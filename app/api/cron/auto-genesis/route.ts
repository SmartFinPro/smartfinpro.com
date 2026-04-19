// app/api/cron/auto-genesis/route.ts
// Auto-Genesis — Scans /seo texte/ for new SEO briefs without MDX pages,
// auto-generates review pages via Genesis Hub pipeline, and submits to Google Indexing API.
//
// Schedule: Every 30 minutes
// Self-hosted crontab entry:
//   */30 * * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/auto-genesis >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

import { NextRequest, NextResponse } from 'next/server';
import { runAutoGenesis } from '@/lib/actions/auto-genesis';
import { logger, logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

export const maxDuration = 300; // 5 minutes — enough for 3 briefs

export async function GET(request: NextRequest) {
  // ── Auth (timing-safe) ──────────────────────────────────────────
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[auto-genesis] Unauthorized attempt', {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    const result = await runAutoGenesis();

    const duration = Date.now() - startTime;

    logCron({
      job: 'auto-genesis',
      status: result.failed > 0 && result.generated === 0 ? 'error' : 'success',
      duration_ms: duration,
      scanned: result.scanned,
      pending: result.pending,
      generated: result.generated,
      failed: result.failed,
      skipped: result.skipped,
    });

    return NextResponse.json({
      success: true,
      ...result,
      duration: `${(duration / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';

    logCron({
      job: 'auto-genesis',
      status: 'error',
      error: msg,
    });

    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
