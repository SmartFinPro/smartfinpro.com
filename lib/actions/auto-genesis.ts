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

  // Insert log entry
  const { error: insertError } = await supabase
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
    );

  if (insertError) {
    logger.error('[auto-genesis] Failed to insert log entry:', insertError.message);
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

    await supabase
      .from('auto_genesis_log')
      .update({
        status: 'failed',
        error_message: errorMsg,
        completed_at: new Date().toISOString(),
      })
      .eq('brief_path', brief.folderName)
      .eq('brief_hash', brief.briefHash);

    await sendTelegramAlert(
      `<b>AUTO-GENESIS FAILED</b>\n\n` +
      `Brief: ${brief.briefPath}\n` +
      `Market: ${brief.market.toUpperCase()} | Category: ${brief.category}\n` +
      `Error: ${errorMsg}\n\n` +
      `Duration: ${(duration / 1000).toFixed(1)}s`,
    );

    logger.error(`[auto-genesis] Failed: ${brief.folderName} — ${errorMsg}`);

    return { status: 'failed', error: errorMsg };
  }
}

// ── Main Orchestrator ───────────────────────────────────────

export async function runAutoGenesis(): Promise<AutoGenesisResult> {
  if (process.env.AUTO_GENESIS_ENABLED === 'false') {
    logger.info('[auto-genesis] Disabled via AUTO_GENESIS_ENABLED=false');
    return { scanned: 0, pending: 0, generated: 0, failed: 0, skipped: 0, details: [] };
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
