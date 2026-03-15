'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import {
  magicFind,
  generateLongFormAsset,
  distributeAndIndex,
  getAutoTemplatePartnerPreview,
} from '@/lib/actions/genesis';
import type { AffiliateMappingEntry } from '@/lib/actions/genesis';
import {
  scanForPendingBriefs,
  buildEnrichedBrief,
} from '@/lib/auto-genesis/scanner';
import type { PendingBrief } from '@/lib/auto-genesis/scanner';

// ════════════════════════════════════════════════════════════════
// AUTO-GENESIS — Automated SEO Text → MDX Pipeline
//
// Scanner logic lives in lib/auto-genesis/scanner.ts (no 'use server').
// This file only contains the server actions that orchestrate generation.
// ════════════════════════════════════════════════════════════════

const BATCH_SIZE = parseInt(process.env.AUTO_GENESIS_BATCH_SIZE || '3', 10);

interface AutoGenesisResult {
  scanned: number;
  pending: number;
  generated: number;
  failed: number;
  skipped: number;
  details: Array<{
    folder: string;
    status: 'generated' | 'failed' | 'skipped';
    slug?: string;
    wordCount?: number;
    indexed?: boolean;
    error?: string;
  }>;
}

// ── Auto-Generate Single Brief ──────────────────────────────

async function autoGenerateSingle(
  brief: PendingBrief,
): Promise<{
  status: 'generated' | 'failed';
  slug?: string;
  wordCount?: number;
  indexed?: boolean;
  error?: string;
}> {
  const supabase = createServiceClient();
  const startTime = Date.now();

  // Optimistic lock: only transition from 'pending' (or new) to 'generating'.
  // If another worker already set 'generating', we skip this brief.
  const { data: lockResult, error: insertError } = await supabase
    .from('auto_genesis_log')
    .upsert(
      {
        brief_path: brief.folderName,
        brief_hash: brief.briefHash,
        market: brief.market,
        category: brief.category,
        keyword: brief.keyword,
        slug: brief.slug,
        status: 'generating',
        started_at: new Date().toISOString(),
      },
      { onConflict: 'brief_path,brief_hash' },
    )
    .select('status')
    .single();

  if (insertError) {
    logger.error('[auto-genesis] Failed to insert log entry:', insertError.message);
  }

  // If upsert returned but status isn't 'generating' (another worker won), skip
  if (lockResult && lockResult.status !== 'generating') {
    logger.info(`[auto-genesis] Skipping ${brief.folderName} — already being processed`);
    return { status: 'failed', error: 'Already being processed by another worker' };
  }

  try {
    logger.info(`[auto-genesis] Starting: ${brief.folderName} (${brief.keyword})`);

    let runId = '';

    try {
      const research = await magicFind(brief.keyword, brief.market, brief.category);
      if (research.success && research.data) {
        runId = research.data.runId;
      }
    } catch (err) {
      logger.warn('[auto-genesis] magicFind failed, continuing without competitor data:', err);
    }

    // If magicFind failed or returned no runId, create a pipeline run manually
    if (!runId) {
      const { data: newRun } = await supabase
        .from('genesis_pipeline_runs')
        .insert({
          keyword: brief.keyword,
          market: brief.market,
          category: brief.category,
          status: 'research',
          research_data: {
            suggestions: [],
            query: brief.keyword,
            market: brief.market,
            category: brief.category,
            scannedAt: new Date().toISOString(),
          },
        })
        .select('id')
        .single();

      if (!newRun) {
        throw new Error('Failed to create genesis pipeline run');
      }
      runId = newRun.id;
    }

    // Generate MDX with enriched brief
    const enrichedBrief = buildEnrichedBrief(brief);

    const genResult = await generateLongFormAsset(
      runId,
      brief.keyword,
      brief.market,
      brief.category,
      enrichedBrief,
    );

    if (!genResult.success) {
      throw new Error(genResult.error || 'Generation failed');
    }

    // Auto-resolve affiliate partner
    const affiliateMappings: AffiliateMappingEntry[] = [];
    try {
      const partner = await getAutoTemplatePartnerPreview(brief.market, brief.category);
      if (partner.success && partner.partnerName && partner.affiliateUrl) {
        affiliateMappings.push({
          partnerName: partner.partnerName,
          slug: partner.affiliateUrl.replace('/go/', ''),
          cpaValue: 0,
          currency: 'USD',
          position: 'hero-cta',
        });
      }
    } catch {
      logger.warn(`[auto-genesis] No affiliate partner for ${brief.market}/${brief.category}`);
    }

    // Distribute & Index
    const distResult = await distributeAndIndex(runId, affiliateMappings);

    const duration = Date.now() - startTime;
    const indexed = distResult.indexed || false;

    // Update log entry
    await supabase
      .from('auto_genesis_log')
      .update({
        status: 'completed',
        genesis_run_id: runId,
        mdx_path: genResult.filePath,
        word_count: genResult.wordCount,
        indexed,
        completed_at: new Date().toISOString(),
      })
      .eq('brief_path', brief.folderName)
      .eq('brief_hash', brief.briefHash);

    // Telegram success alert
    const pageUrl = genResult.slug;
    const partnerInfo = affiliateMappings.length > 0
      ? `Partner: ${affiliateMappings[0].partnerName} (/go/${affiliateMappings[0].slug})`
      : 'Partner: none configured';

    await sendTelegramAlert(
      `<b>AUTO-GENESIS COMPLETE</b>\n\n` +
      `Page: <code>${pageUrl}</code> (${genResult.wordCount.toLocaleString('en-US')} words)\n` +
      `Market: ${brief.market.toUpperCase()} | Category: ${brief.category}\n` +
      `Keyword: "${brief.keyword}"\n` +
      `${partnerInfo}\n` +
      `Indexed: ${indexed ? 'Yes' : 'No'}\n` +
      `Source: ${brief.briefPath}\n\n` +
      `Duration: ${(duration / 1000).toFixed(1)}s`,
    );

    logger.info(
      `[auto-genesis] Completed: ${brief.folderName} → ${genResult.slug} (${genResult.wordCount} words, ${(duration / 1000).toFixed(1)}s)`,
    );

    return {
      status: 'generated',
      slug: genResult.slug,
      wordCount: genResult.wordCount,
      indexed,
    };
  } catch (err) {
    Sentry.captureException(err);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    const duration = Date.now() - startTime;

    // Get current retry_count to decide: reset to pending (retry) or mark as failed
    const { data: currentLog } = await supabase
      .from('auto_genesis_log')
      .select('retry_count')
      .eq('brief_path', brief.folderName)
      .eq('brief_hash', brief.briefHash)
      .single();

    const retryCount = (currentLog?.retry_count ?? 0) + 1;

    if (retryCount < MAX_RETRY_COUNT) {
      // Reset to pending for retry on next cron run
      await supabase
        .from('auto_genesis_log')
        .update({
          status: 'pending',
          error_message: `Attempt ${retryCount}: ${errorMsg}`,
          retry_count: retryCount,
          started_at: null,
        })
        .eq('brief_path', brief.folderName)
        .eq('brief_hash', brief.briefHash);

      logger.warn(`[auto-genesis] Retry ${retryCount}/${MAX_RETRY_COUNT}: ${brief.folderName} — ${errorMsg}`);
    } else {
      // Max retries exhausted — mark as permanently failed
      await supabase
        .from('auto_genesis_log')
        .update({
          status: 'failed',
          error_message: `Failed after ${retryCount} attempts. Last: ${errorMsg}`,
          retry_count: retryCount,
          completed_at: new Date().toISOString(),
        })
        .eq('brief_path', brief.folderName)
        .eq('brief_hash', brief.briefHash);

      await sendTelegramAlert(
        `<b>AUTO-GENESIS FAILED (${retryCount} attempts)</b>\n\n` +
        `Brief: ${brief.briefPath}\n` +
        `Market: ${brief.market.toUpperCase()} | Category: ${brief.category}\n` +
        `Error: ${errorMsg}\n\n` +
        `Duration: ${(duration / 1000).toFixed(1)}s`,
      );
    }

    logger.error(`[auto-genesis] Failed: ${brief.folderName} — ${errorMsg} (attempt ${retryCount})`);

    return { status: 'failed', error: errorMsg };
  }
}

// ── Stale-State Recovery ──────────────────────────────────
// Briefs stuck in 'generating' for >1 hour are reset to 'pending' (max 3 retries).
// After 3 retries, status is set to 'failed' to prevent infinite loops.
// Stale-Lock-Timeout: 1 hour (covers Claude API + image processing worst case).

const STALE_THRESHOLD_HOURS = 1;
const MAX_RETRY_COUNT = 3;

async function recoverStaleGenerations(): Promise<number> {
  const supabase = createServiceClient();

  // Reset stale entries with retries remaining → pending
  const { data: recovered } = await supabase
    .from('auto_genesis_log')
    .update({
      status: 'pending',
      started_at: null,
    })
    .eq('status', 'generating')
    .lt('started_at', new Date(Date.now() - STALE_THRESHOLD_HOURS * 3600_000).toISOString())
    .lt('retry_count', MAX_RETRY_COUNT)
    .select('brief_path, retry_count');

  // Increment retry_count for recovered entries
  if (recovered && recovered.length > 0) {
    for (const entry of recovered) {
      await supabase
        .from('auto_genesis_log')
        .update({ retry_count: (entry.retry_count ?? 0) + 1 })
        .eq('brief_path', entry.brief_path)
        .eq('status', 'pending');
    }
    logger.warn(`[auto-genesis] Recovered ${recovered.length} stale 'generating' entries`);
  }

  // Mark exhausted retries as failed
  const { data: exhausted } = await supabase
    .from('auto_genesis_log')
    .update({
      status: 'failed',
      error_message: `Max retries (${MAX_RETRY_COUNT}) exceeded after stale recovery`,
      completed_at: new Date().toISOString(),
    })
    .eq('status', 'generating')
    .lt('started_at', new Date(Date.now() - STALE_THRESHOLD_HOURS * 3600_000).toISOString())
    .gte('retry_count', MAX_RETRY_COUNT)
    .select('brief_path');

  if (exhausted && exhausted.length > 0) {
    logger.error(`[auto-genesis] ${exhausted.length} briefs failed after ${MAX_RETRY_COUNT} retries`);
    await sendTelegramAlert(
      `<b>AUTO-GENESIS MAX RETRIES</b>\n\n` +
      `${exhausted.length} brief(s) failed after ${MAX_RETRY_COUNT} retries:\n` +
      exhausted.map((e) => `  • ${e.brief_path}`).join('\n'),
    );
  }

  return (recovered?.length ?? 0) + (exhausted?.length ?? 0);
}

// ── Main Orchestrator ───────────────────────────────────────

export async function runAutoGenesis(): Promise<AutoGenesisResult> {
  if (process.env.AUTO_GENESIS_ENABLED === 'false') {
    logger.info('[auto-genesis] Disabled via AUTO_GENESIS_ENABLED=false');
    return { scanned: 0, pending: 0, generated: 0, failed: 0, skipped: 0, details: [] };
  }

  // Recover stale 'generating' entries before processing new briefs
  const staleRecovered = await recoverStaleGenerations();
  if (staleRecovered > 0) {
    logger.info(`[auto-genesis] Recovered ${staleRecovered} stale entries before scan`);
  }

  const supabase = createServiceClient();
  const scan = await scanForPendingBriefs(supabase);

  logger.info(
    `[auto-genesis] Scan complete: ${scan.scanned} folders, ${scan.pending.length} pending, ` +
    `${scan.alreadyExist} exist, ${scan.alreadyProcessed} processed, ${scan.parseErrors} parse errors`,
  );

  if (scan.pending.length === 0) {
    return {
      scanned: scan.scanned,
      pending: 0,
      generated: 0,
      failed: 0,
      skipped: scan.alreadyExist + scan.alreadyProcessed,
      details: [],
    };
  }

  const batch = scan.pending.slice(0, BATCH_SIZE);
  const details: AutoGenesisResult['details'] = [];
  let generated = 0;
  let failed = 0;

  for (const brief of batch) {
    const result = await autoGenerateSingle(brief);
    details.push({
      folder: brief.folderName,
      status: result.status,
      slug: result.slug,
      wordCount: result.wordCount,
      indexed: result.indexed,
      error: result.error,
    });

    if (result.status === 'generated') generated++;
    else failed++;
  }

  if (batch.length > 1) {
    const summaryLines = details.map((d) => {
      if (d.status === 'generated') {
        return `  ${d.slug} (${d.wordCount?.toLocaleString('en-US')} words)`;
      }
      return `  ${d.folder} — FAILED: ${d.error}`;
    });

    await sendTelegramAlert(
      `<b>AUTO-GENESIS BATCH COMPLETE</b>\n\n` +
      `Scanned: ${scan.scanned} folders\n` +
      `Generated: ${generated} new pages\n` +
      `Failed: ${failed}\n` +
      `Remaining: ${scan.pending.length - batch.length}\n\n` +
      summaryLines.join('\n'),
    );
  }

  return {
    scanned: scan.scanned,
    pending: scan.pending.length,
    generated,
    failed,
    skipped: scan.alreadyExist + scan.alreadyProcessed,
    details,
  };
}
