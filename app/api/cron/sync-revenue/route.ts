import { NextRequest, NextResponse } from 'next/server';
import { runAllConnectors } from '@/lib/api/sync-service';
import { logger, logCron } from '@/lib/logging';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { validateBearer } from '@/lib/security/timing-safe';

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
  // Verify CRON_SECRET (timing-safe)
  if (!validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[sync-revenue] Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[sync-revenue] Starting revenue sync');
  const startTime = Date.now();

  try {
    const result = await runAllConnectors({ trigger: 'scheduled' });

    const duration = Date.now() - startTime;

    if (result.results.length === 0) {
      logCron({
        job: 'sync-revenue',
        status: 'partial',
        duration_ms: duration,
        error: 'No enabled connectors found',
      });

      return NextResponse.json({
        success: false,
        partial: true,
        message: 'No enabled connectors found',
        results: [],
      }, { status: 207 });
    }

    // Classify per-network results.
    // A connector skipped purely because another sync already holds its mutex
    // lock is NOT a failure — sync-revenue and sync-conversions both run on the
    // unified connector stack, so an overlapping run would otherwise raise a
    // false "partial/failed" alert. Treat lock collisions as a benign skip.
    const isLockSkip = (r: { success: boolean; errors: string[] }) =>
      !r.success &&
      r.errors.length > 0 &&
      r.errors.every((e) => /already in progress|mutex locked/i.test(e));

    const lockedNetworks = result.results.filter(isLockSkip).map((r) => r.connector);
    const genuineFailures = result.results.filter((r) => !r.success && !isLockSkip(r));
    const networksOk = result.succeeded.map((r) => r.connector);
    const networksFailed = genuineFailures.map((r) => r.connector);

    const allFailed = networksOk.length === 0 && networksFailed.length > 0;
    const partialFailure = networksFailed.length > 0 && networksOk.length > 0;
    // Nothing genuinely failed and nothing actually synced → every connector was
    // locked by a concurrent run. Benign no-op, no alert.
    const skippedOnly =
      networksFailed.length === 0 && networksOk.length === 0 && lockedNetworks.length > 0;

    // Determine cron log status: success | partial | error | skipped
    const cronStatus = allFailed
      ? 'error'
      : partialFailure
        ? 'partial'
        : skippedOnly
          ? 'skipped'
          : 'success';

    logCron({
      job: 'sync-revenue',
      status: cronStatus,
      duration_ms: duration,
      records_synced: result.totalRecords,
      records_skipped: result.totalSkipped,
      connectors_succeeded: result.succeeded.length,
      connectors_failed: networksFailed.length,
      ...(networksFailed.length === 0 && lockedNetworks.length > 0
        ? { error: `Skipped (locked by concurrent run): ${lockedNetworks.join(', ')}` }
        : {}),
      metadata: {
        networks_ok: networksOk,
        networks_failed: networksFailed,
        networks_locked: lockedNetworks,
      },
    });

    // Telegram alert ONLY for genuine failures — never for lock skips.
    if (partialFailure) {
      const failedDetails = genuineFailures
        .map((r) => `  • ${r.connector}: ${r.errors.join(', ') || 'unknown error'}`)
        .join('\n');

      await sendTelegramAlert(
        `<b>⚠️ REVENUE SYNC PARTIAL</b>\n\n` +
        `OK: ${networksOk.join(', ')}\n` +
        `FAILED:\n${failedDetails}\n` +
        (lockedNetworks.length ? `Skipped (locked): ${lockedNetworks.join(', ')}\n` : '') +
        `\nSynced: ${result.totalRecords} | Skipped: ${result.totalSkipped}\n` +
        `Duration: ${(duration / 1000).toFixed(1)}s`,
      );
    }

    if (allFailed) {
      const failedDetails = genuineFailures
        .map((r) => `  • ${r.connector}: ${r.errors.join(', ') || 'unknown error'}`)
        .join('\n');

      await sendTelegramAlert(
        `<b>🚨 REVENUE SYNC FAILED</b>\n\n` +
        `ALL networks failed:\n${failedDetails}\n\n` +
        `Duration: ${(duration / 1000).toFixed(1)}s`,
      );
    }

    const responseBody = {
      success: cronStatus === 'success' || cronStatus === 'skipped',
      partial: partialFailure,
      skipped: skippedOnly,
      message: allFailed
        ? 'Revenue sync failed — all networks'
        : partialFailure
          ? `Revenue sync partial — ${networksFailed.join(', ')} failed`
          : skippedOnly
            ? 'Revenue sync skipped — all connectors locked by a concurrent run'
            : 'Revenue sync completed',
      totalSynced: result.totalRecords,
      totalSkipped: result.totalSkipped,
      duration: `${duration}ms`,
      networks_ok: networksOk,
      networks_failed: networksFailed,
      networks_locked: lockedNetworks,
      results: result.results.map((r) => ({
        connector: r.connector,
        success: r.success,
        synced: r.records_synced,
        skipped: r.records_skipped,
        errors: r.errors.length,
      })),
    };

    // HTTP 207 for partial, 500 for all-failed, 200 for success/skipped
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
