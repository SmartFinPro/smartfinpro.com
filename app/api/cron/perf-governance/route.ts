// app/api/cron/perf-governance/route.ts
// P2b: Performance-Governance — Daily CWV budget check + regression alerts
//
// Schedule: Daily 03:00 UTC
// Self-hosted crontab entry:
//   0 3 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/perf-governance >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

import { NextRequest, NextResponse } from 'next/server';
import { runPerfGovernance } from '@/lib/actions/perf-governance';
import { logger, logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

export async function GET(request: NextRequest) {
  // ── Auth (timing-safe) ──────────────────────────────────────────
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && !validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[perf-governance] Unauthorized attempt', {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    const result = await runPerfGovernance();

    const duration = Date.now() - startTime;

    logCron({
      job: 'perf-governance',
      status: 'success',
      duration_ms: duration,
      enabled: result.enabled,
      alerts_sent: result.alertsSent,
      tests_reset: result.testsReset.length,
      metrics: result.metrics.map((m) => ({
        name: m.name,
        p75: m.thisWeekP75,
        budget: m.budget,
        over: m.overBudget,
        regressed: m.regressed,
      })),
    });

    return NextResponse.json({
      success: true,
      enabled: result.enabled,
      metrics: result.metrics,
      alertsSent: result.alertsSent,
      testsReset: result.testsReset,
      duration: `${(duration / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';

    logCron({
      job: 'perf-governance',
      status: 'error',
      error: msg,
    });

    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
