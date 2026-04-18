import { NextRequest, NextResponse } from 'next/server';
import { runSpikeMonitor } from '@/lib/actions/spike-monitor';
import { logger, logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

/**
 * CTA Spike Monitor — Cron Job
 *
 * Compares CTA clicks in the last 60 minutes against the 7-day rolling
 * average per slug. If clicks exceed 300% of the average:
 *   1. Sends a Telegram spike alert
 *   2. AUTO-PILOT: Updates content_overrides.boost_date
 *   3. AUTO-PILOT: Fires DEPLOY_HOOK_URL for Cloudways rebuild
 *   4. Records 24h cooldown per slug (build-loop prevention)
 *
 * Schedule: Every 15 minutes
 *
 * Self-hosted crontab entry:
 *   *\/15 * * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/spike-monitor >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET (timing-safe)
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && !validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[spike-monitor] Unauthorized attempt', { ip: request.headers.get('x-forwarded-for') ?? 'unknown' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    const result = await runSpikeMonitor();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    logCron({
      job: 'spike-monitor', status: 'success',
      duration_ms: Date.now() - startTime,
      scanned: result.scanned, spikes: result.spikesDetected, alerts: result.alertsSent,
      auto_pilot: result.autoPilotRuns, cooldown_skips: result.cooldownSkips,
    });

    // Guardian: API connectivity check (fail-safe — never blocks spike-monitor)
    let guardianResult: {
      checked: number;
      failures: number;
      alertsSent: number;
      errors: string[];
    } | null = null;

    try {
      const { checkAllApiConnectivities } = await import('@/lib/actions/guardian');
      guardianResult = await checkAllApiConnectivities();
      if (guardianResult.checked > 0) {
        logger.info('[guardian] API connectivity check', {
          checked: guardianResult.checked, failures: guardianResult.failures, alerts: guardianResult.alertsSent,
        });
      }
    } catch (guardianErr) {
      logger.warn('[spike-monitor] Guardian check failed (non-blocking)', {
        error: guardianErr instanceof Error ? guardianErr.message : 'Unknown error',
      });
    }

    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      spikesDetected: result.spikesDetected,
      alertsSent: result.alertsSent,
      autoPilot: {
        runs: result.autoPilotRuns,
        highPriorityRuns: result.highPriorityRuns,
        cooldownSkips: result.cooldownSkips,
        ctrGateBlocks: result.ctrGateBlocks,
        actions: result.autoPilotActions.map((a) => ({
          slug: a.slug,
          market: a.market,
          boostSuccess: a.boostSuccess,
          deploySuccess: a.deploySuccess,
          cooldownSkipped: a.cooldownSkipped,
          ctr: a.ctr,
          pageViews: a.pageViews,
          ctrBelowThreshold: a.ctrBelowThreshold,
          priority: a.priority,
        })),
      },
      alerts: result.alerts.map((a) => ({
        slug: a.slug,
        market: a.market,
        clicks: a.clicksLastHour,
        multiplier: a.spikeMultiplier.toFixed(1),
      })),
      errors: result.errors.length > 0 ? result.errors : undefined,
      guardian: guardianResult
        ? {
            checked: guardianResult.checked,
            failures: guardianResult.failures,
            alertsSent: guardianResult.alertsSent,
            errors: guardianResult.errors.length > 0 ? guardianResult.errors : undefined,
          }
        : undefined,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logCron({ job: 'spike-monitor', status: 'error', error: msg });
    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
