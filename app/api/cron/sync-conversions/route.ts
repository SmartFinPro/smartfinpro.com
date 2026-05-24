import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { syncConnector } from '@/lib/api/sync-service';
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

  const supabase = createServiceClient();
  const results: Array<{
    connector: string;
    success: boolean;
    records_synced: number;
    records_skipped: number;
    errors: string[];
  }> = [];

  try {
    // Get all enabled connectors
    const { data: connectors } = await supabase
      .from('api_connectors')
      .select('name')
      .eq('is_enabled', true);

    if (!connectors || connectors.length === 0) {
      logCron({
        job: 'sync-conversions',
        status: 'skipped',
        duration_ms: Date.now() - startTime,
        error: 'No enabled connectors found',
      });
      return NextResponse.json({
        message: 'No enabled connectors found',
        results: [],
      });
    }

    // Sync each connector with mutex to prevent concurrent duplicate syncs.
    // Lock: sync_in_progress_at is set atomically. Stale after 1 hour.
    // Release: ALWAYS in finally block, even on exception.
    const STALE_LOCK_MS = 60 * 60 * 1000; // 1 hour

    for (const connector of connectors) {
      // Acquire lock: atomic UPDATE only if unlocked or stale (> 1 hour)
      const staleThreshold = new Date(Date.now() - STALE_LOCK_MS).toISOString();
      const { data: locked, error: lockError } = await supabase
        .from('api_connectors')
        .update({ sync_in_progress_at: new Date().toISOString() })
        .eq('name', connector.name)
        .or(`sync_in_progress_at.is.null,sync_in_progress_at.lt.${staleThreshold}`)
        .select('name')
        .single();

      if (lockError || !locked) {
        logger.warn('[sync-conversions] Skipping — sync already in progress', { connector: connector.name });
        results.push({
          connector: connector.name,
          success: false,
          records_synced: 0,
          records_skipped: 0,
          errors: ['Sync already in progress (mutex locked)'],
        });
        continue;
      }

      try {
        logger.info('[sync-conversions] Lock acquired, starting sync', { connector: connector.name });

        const result = await syncConnector(connector.name, 'scheduled');

        results.push({
          connector: connector.name,
          success: result.success,
          records_synced: result.records_synced,
          records_skipped: result.records_skipped,
          errors: result.errors,
        });

        logger.info('[sync-conversions] Connector complete', {
          connector: connector.name, success: result.success,
          synced: result.records_synced, skipped: result.records_skipped,
        });
      } finally {
        // ALWAYS release lock, even on exception
        await supabase
          .from('api_connectors')
          .update({ sync_in_progress_at: null })
          .eq('name', connector.name);
        logger.info('[sync-conversions] Lock released', { connector: connector.name });
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.records_synced, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.records_skipped, 0);
    const failedCount = results.filter((r) => !r.success).length;
    const succeededCount = results.length - failedCount;
    const allSuccessful = results.length > 0 && failedCount === 0;
    const cronStatus = failedCount === 0 ? 'success' : succeededCount === 0 ? 'error' : 'partial';

    logCron({
      job: 'sync-conversions',
      status: cronStatus,
      duration_ms: Date.now() - startTime,
      records_synced: totalSynced,
      records_skipped: totalSkipped,
      connectors_succeeded: succeededCount,
      connectors_failed: failedCount,
    });

    return NextResponse.json({
      success: allSuccessful,
      total_records_synced: totalSynced,
      results,
    });
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
