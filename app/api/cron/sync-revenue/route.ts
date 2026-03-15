import { NextRequest, NextResponse } from 'next/server';
import { syncAllNetworks } from '@/lib/api/affiliate-networks';
import { logger, logCron } from '@/lib/logging';
import { sendTelegramAlert } from '@/lib/alerts/telegram';

/**
 * Revenue Sync Cron Job
 *
 * Syncs commission data from affiliate networks:
 * - PartnerStack (Jasper AI, SaaS)
 * - Awin (UK/EU Banking)
 * - FinanceAds (US/EU Finance)
 *
 * Schedule: Daily at 2 AM UTC (before sync-conversions at 6 AM)
 *
 * Self-hosted crontab entry:
 *   0 2 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-revenue >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET — only Bearer token auth (self-hosted)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('[sync-revenue] Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[sync-revenue] Starting revenue sync');
  const startTime = Date.now();

  try {
    const result = await syncAllNetworks();

    const duration = Date.now() - startTime;

    // Classify per-network results
    const networksOk = result.results.filter((r) => r.success).map((r) => r.network);
    const networksFailed = result.results.filter((r) => !r.success).map((r) => r.network);
    const allFailed = networksOk.length === 0 && networksFailed.length > 0;
    const partialFailure = networksFailed.length > 0 && networksOk.length > 0;

    // Determine cron log status: success | partial | error
    const cronStatus = allFailed ? 'error' : partialFailure ? 'partial' : 'success';

    logCron({
      job: 'sync-revenue',
      status: cronStatus,
      duration_ms: duration,
      created: result.totalCreated,
      updated: result.totalUpdated,
      metadata: { networks_ok: networksOk, networks_failed: networksFailed },
    });

    // Telegram alert for partial or full failure
    if (partialFailure) {
      const failedDetails = result.results
        .filter((r) => !r.success)
        .map((r) => `  • ${r.network}: ${r.errors.join(', ') || 'unknown error'}`)
        .join('\n');

      await sendTelegramAlert(
        `<b>⚠️ REVENUE SYNC PARTIAL</b>\n\n` +
        `OK: ${networksOk.join(', ')}\n` +
        `FAILED:\n${failedDetails}\n\n` +
        `Created: ${result.totalCreated} | Updated: ${result.totalUpdated}\n` +
        `Duration: ${(duration / 1000).toFixed(1)}s`,
      );
    }

    if (allFailed) {
      const failedDetails = result.results
        .map((r) => `  • ${r.network}: ${r.errors.join(', ') || 'unknown error'}`)
        .join('\n');

      await sendTelegramAlert(
        `<b>🚨 REVENUE SYNC FAILED</b>\n\n` +
        `ALL networks failed:\n${failedDetails}\n\n` +
        `Duration: ${(duration / 1000).toFixed(1)}s`,
      );
    }

    const responseBody = {
      success: cronStatus === 'success',
      partial: partialFailure,
      message: allFailed
        ? 'Revenue sync failed — all networks'
        : partialFailure
          ? `Revenue sync partial — ${networksFailed.join(', ')} failed`
          : 'Revenue sync completed',
      totalCreated: result.totalCreated,
      totalUpdated: result.totalUpdated,
      duration: `${duration}ms`,
      networks_ok: networksOk,
      networks_failed: networksFailed,
      results: result.results.map((r) => ({
        network: r.network,
        success: r.success,
        created: r.recordsCreated,
        updated: r.recordsUpdated,
        skipped: r.recordsSkipped,
        errors: r.errors.length,
      })),
    };

    // HTTP 207 for partial, 500 for all-failed, 200 for success
    const httpStatus = allFailed ? 500 : partialFailure ? 207 : 200;
    return NextResponse.json(responseBody, { status: httpStatus });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    logCron({ job: 'sync-revenue', status: 'error', duration_ms: duration, error: errorMsg });

    await sendTelegramAlert(
      `<b>🚨 REVENUE SYNC CRASH</b>\n\n` +
      `Unhandled error: ${errorMsg}\n` +
      `Duration: ${(duration / 1000).toFixed(1)}s`,
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}

// POST for manual trigger from dashboard
export async function POST(request: NextRequest) {
  return GET(request);
}
