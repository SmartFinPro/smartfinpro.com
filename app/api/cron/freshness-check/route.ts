// app/api/cron/freshness-check/route.ts
// Content Freshness Check — Cron Job
//
// Scans all MDX files under content/{market}/{category}/*.mdx,
// parses the publishDate/modifiedDate from frontmatter (gray-matter),
// and flags articles older than 180 days for editorial review.
// Upserts results to content_freshness table, sends Telegram alert
// when new stale articles are found, logs to cron_logs.
//
// Schedule: Daily @ 03:00 server time
//
// Self-hosted crontab entry:
//   0 3 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/freshness-check >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { logger, logCron } from '@/lib/logging';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const STALE_THRESHOLD_DAYS = 180; // 6 months
const VALID_MARKETS = ['us', 'uk', 'ca', 'au'] as const;

interface ScannedFile {
  filePath: string;   // relative: content/us/ai-tools/jasper-review.mdx
  slug: string;       // /us/ai-tools/jasper-review (us prefix omitted for US)
  market: string;
  category: string;
  publishDate: string | null;
  modifiedDate: string | null;
  ageDays: number | null;
  needsReview: boolean;
}

/** Recursively collect .mdx files under a directory */
function collectMdxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue; // skip _templates, _archived
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMdxFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(full);
    }
  }

  return files;
}

/** Parse date string (YYYY-MM-DD) → days since today, or null */
function daysSince(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Derive canonical slug from file path */
function slugFromPath(absolutePath: string): string {
  const rel = path.relative(CONTENT_DIR, absolutePath);
  // rel: us/ai-tools/jasper-review.mdx → parts: [us, ai-tools, jasper-review.mdx]
  const parts = rel.replace(/\.mdx$/, '').split(path.sep);
  const [market, ...rest] = parts;
  // US pages have no /us prefix in canonical URL
  if (market === 'us') {
    return '/' + rest.join('/');
  }
  return '/' + parts.join('/');
}

export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isDev = process.env.NODE_ENV === 'development';
  const isAuthenticated = authHeader === `Bearer ${cronSecret}`;

  if (!isAuthenticated && !isDev) {
    logger.warn('[freshness-check] Unauthorized attempt', { ip: request.headers.get('x-forwarded-for') ?? 'unknown' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createServiceClient();

  try {
    // ── Scan MDX files ─────────────────────────────────────────────────
    const scanned: ScannedFile[] = [];

    for (const market of VALID_MARKETS) {
      const marketDir = path.join(CONTENT_DIR, market);
      if (!fs.existsSync(marketDir)) continue;

      for (const catEntry of fs.readdirSync(marketDir, { withFileTypes: true })) {
        if (!catEntry.isDirectory()) continue;
        const category = catEntry.name;
        const categoryDir = path.join(marketDir, category);
        const mdxFiles = collectMdxFiles(categoryDir);

        for (const filePath of mdxFiles) {
          try {
            const raw = fs.readFileSync(filePath, 'utf8');
            const { data } = matter(raw);

            const publishDate: string | null = data.publishDate ?? data.date ?? null;
            const modifiedDate: string | null = data.modifiedDate ?? null;

            // Use modifiedDate if available (more accurate staleness indicator)
            const effectiveDate = modifiedDate ?? publishDate;
            const ageDays = daysSince(effectiveDate);
            const needsReview = ageDays !== null && ageDays > STALE_THRESHOLD_DAYS;

            const relPath = path.relative(process.cwd(), filePath);
            const slug = slugFromPath(filePath);

            scanned.push({
              filePath: relPath,
              slug,
              market,
              category,
              publishDate,
              modifiedDate,
              ageDays,
              needsReview,
            });
          } catch (parseErr) {
            logger.warn('[freshness-check] Could not parse MDX', { file: filePath, error: parseErr instanceof Error ? parseErr.message : String(parseErr) });
          }
        }
      }
    }

    // ── Upsert to content_freshness ────────────────────────────────────
    const now = new Date().toISOString();
    let newlyFlagged = 0;
    const errors: string[] = [];

    for (const file of scanned) {
      // Check if already flagged (to track newly vs already flagged)
      const { data: existing } = await supabase
        .from('content_freshness')
        .select('id, needs_review, flagged_at')
        .eq('file_path', file.filePath)
        .maybeSingle();

      const wasAlreadyFlagged = existing?.needs_review === true;
      const flaggedAt = file.needsReview
        ? (wasAlreadyFlagged ? existing!.flagged_at : now)
        : null;

      if (file.needsReview && !wasAlreadyFlagged) {
        newlyFlagged++;
      }

      const { error } = await supabase
        .from('content_freshness')
        .upsert(
          {
            slug: file.slug,
            market: file.market,
            category: file.category,
            file_path: file.filePath,
            publish_date: file.publishDate ?? null,
            modified_date: file.modifiedDate ?? null,
            needs_review: file.needsReview,
            flagged_at: flaggedAt,
            updated_at: now,
          },
          { onConflict: 'file_path' }
        );

      if (error) {
        errors.push(`${file.filePath}: ${error.message}`);
      }
    }

    const staleCount = scanned.filter((f) => f.needsReview).length;
    const durationMs = Date.now() - startTime;

    logger.info('[freshness-check] Scan complete', {
      scanned: scanned.length, stale: staleCount, newly_flagged: newlyFlagged, duration_s: (durationMs / 1000).toFixed(1),
    });

    // ── Telegram alert for newly flagged articles ──────────────────────
    let alertSent = false;
    if (newlyFlagged > 0) {
      const newlyStale = scanned
        .filter((f) => f.needsReview)
        .slice(0, 8)
        .map((f) => `  • <code>${f.slug}</code> (${f.ageDays}d old)`)
        .join('\n');

      const overflowNote = staleCount > 8 ? `\n  … and ${staleCount - 8} more` : '';

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
      const message = [
        `🗂️ <b>CONTENT FRESHNESS ALERT</b>`,
        ``,
        `📊 Scanned <b>${scanned.length}</b> articles`,
        `⚠️ <b>${newlyFlagged} newly stale</b> (>${STALE_THRESHOLD_DAYS} days since last update)`,
        staleCount > newlyFlagged
          ? `📋 Total flagged for review: <b>${staleCount}</b>`
          : null,
        ``,
        `<b>Newly flagged:</b>`,
        newlyStale + overflowNote,
        ``,
        `🔗 <a href="${siteUrl}/dashboard/content/hub">Content Hub → Review Queue</a>`,
        `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
      ]
        .filter((l) => l !== null)
        .join('\n');

      const tg = await sendTelegramAlert(message);
      alertSent = tg.success;
      if (!tg.success) {
        logger.warn('[freshness-check] Telegram alert failed', { error: tg.error });
      }
    }

    // ── Log to cron_logs ───────────────────────────────────────────────
    try {
      await supabase.from('cron_logs').insert({
        job_name: 'freshness-check',
        status: errors.length === 0 ? 'success' : 'partial',
        duration_ms: durationMs,
        metadata: {
          scanned: scanned.length,
          stale: staleCount,
          newly_flagged: newlyFlagged,
          alert_sent: alertSent,
          errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
        },
      });
    } catch (logErr) {
      logger.warn('[freshness-check] cron_logs insert failed', { error: logErr instanceof Error ? logErr.message : String(logErr) });
    }

    logCron({ job: 'freshness-check', status: errors.length === 0 ? 'success' : 'error', duration_ms: durationMs, scanned: scanned.length, stale: staleCount, newly_flagged: newlyFlagged });

    return NextResponse.json({
      success: true,
      scanned: scanned.length,
      stale: staleCount,
      newlyFlagged,
      alertSent,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${(durationMs / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const durationMs = Date.now() - startTime;
    logCron({ job: 'freshness-check', status: 'error', duration_ms: durationMs, error: msg });

    try {
      await supabase.from('cron_logs').insert({
        job_name: 'freshness-check',
        status: 'error',
        duration_ms: durationMs,
        error: msg,
      });
    } catch { /* non-critical */ }

    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
