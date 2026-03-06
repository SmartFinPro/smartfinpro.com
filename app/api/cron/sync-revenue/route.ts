import { NextRequest, NextResponse } from 'next/server';
import { syncAllNetworks } from '@/lib/api/affiliate-networks';
import { logger, logCron } from '@/lib/logging';

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

    logCron({
      job: 'sync-revenue', status: 'success', duration_ms: duration,
      created: result.totalCreated, updated: result.totalUpdated,
    });

    return NextResponse.json({
      success: result.success,
      message: 'Revenue sync completed',
      totalCreated: result.totalCreated,
      totalUpdated: result.totalUpdated,
      duration: `${duration}ms`,
      results: result.results.map((r) => ({
        network: r.network,
        success: r.success,
        created: r.recordsCreated,
        updated: r.recordsUpdated,
        skipped: r.recordsSkipped,
        errors: r.errors.length,
      })),
    });
  } catch (error) {
    logCron({ job: 'sync-revenue', status: 'error', duration_ms: Date.now() - startTime, error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST for manual trigger from dashboard
export async function POST(request: NextRequest) {
  return GET(request);
}
