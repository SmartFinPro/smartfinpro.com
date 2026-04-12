// app/api/cron/sync-rankings/route.ts
import { NextRequest } from 'next/server';
import { logger, logCron } from '@/lib/logging';
import { syncKeywordTracking, seedCompetitorKeywords } from '@/lib/actions/ranking';

export const maxDuration = 120;

/**
 * Sync Rankings — Daily Cron Job
 *
 * Two-step process:
 *   1. Seed competitor keywords into keyword_tracking (idempotent — skips duplicates)
 *   2. Sync live GSC data (position, clicks, impressions) into keyword_tracking
 *
 * This ensures:
 *   - keyword_tracking always has 100+ keywords (not just the 10 seed set)
 *   - Positions/clicks stay fresh from GSC (3-day lag built into GSC API)
 *
 * Schedule: Daily at 3:30 AM UTC (after sync-competitors at 3 AM, before check-rankings at 4 AM)
 *
 * Self-hosted crontab entry:
 *   30 3 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-rankings >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Step 1: Seed competitor keywords (idempotent — only inserts new ones)
    const seedResult = await seedCompetitorKeywords(120);
    logger.info('[sync-rankings] Keywords seeded', seedResult);

    // Step 2: Sync live GSC data
    const syncResult = await syncKeywordTracking();
    logger.info('[sync-rankings] GSC sync complete', syncResult);

    const duration = Date.now() - start;

    await logCron({
      job: 'sync-rankings',
      status: 'success',
      duration_ms: duration,
      seeded: seedResult.seeded,
      synced: syncResult.synced,
      errors: syncResult.errors,
    });

    return Response.json({
      ok: true,
      seeded: seedResult.seeded,
      skipped: seedResult.skipped,
      gsc_synced: syncResult.synced,
      gsc_errors: syncResult.errors,
      duration_ms: duration,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[sync-rankings] Cron failed', { error: msg });
    await logCron({
      job: 'sync-rankings',
      status: 'error',
      duration_ms: Date.now() - start,
      error: msg,
    });
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
