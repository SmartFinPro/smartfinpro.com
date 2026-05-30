import { NextRequest, NextResponse } from 'next/server';
import { runAllConnectors } from '@/lib/api/sync-service';
import { logger, logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

/**
 * Scheduled sync endpoint for daily conversion synchronization.
 *
 * Syncs all enabled connectors from Supabase.
 *
 * Security: Requires CRON_SECRET environment variable via Bearer token.
 *
 * Self-hosted crontab entry:
 *   0 6 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-conversions >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify CRON_SECRET (timing-safe)
  if (!validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[sync-conversions] Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAllConnectors({ trigger: 'scheduled' });

    if (result.results.length === 0) {
      logCron({
        job: 'sync-conversions',
        status: 'partial',
        duration_ms: Date.now() - startTime,
        error: 'No enabled connectors found',
      });
      return NextResponse.json({
        success: false,
        partial: true,
        message: 'No enabled connectors found',
        results: [],
      }, { status: 207 });
    }

    const failedCount = result.failed.length;
    const succeededCount = result.succeeded.length;
    const allSuccessful = result.results.length > 0 && failedCount === 0;
    const allFailed = failedCount > 0 && succeededCount === 0;
    const cronStatus = failedCount === 0 ? 'success' : succeededCount === 0 ? 'error' : 'partial';

    logCron({
      job: 'sync-conversions',
      status: cronStatus,
      duration_ms: Date.now() - startTime,
      records_synced: result.totalRecords,
      records_skipped: result.totalSkipped,
      connectors_succeeded: succeededCount,
      connectors_failed: failedCount,
    });

    return NextResponse.json({
      success: allSuccessful,
      partial: !allSuccessful && !allFailed,
      total_records_synced: result.totalRecords,
      total_records_skipped: result.totalSkipped,
      results: result.results,
    }, { status: allFailed ? 500 : allSuccessful ? 200 : 207 });
  } catch (error) {
    logCron({
      job: 'sync-conversions',
      status: 'error',
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST for manual trigger from dashboard
export async function POST(request: NextRequest) {
  if (!validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return GET(request);
}
