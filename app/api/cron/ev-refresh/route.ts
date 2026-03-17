// app/api/cron/ev-refresh/route.ts
// P4: EV Refresh — Nightly rebuild of offer_ev_cache
//
// Schedule: Daily 02:00 UTC (before perf-governance at 03:00)
// Self-hosted crontab entry:
//   0 2 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/ev-refresh >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

import { NextRequest, NextResponse } from 'next/server';
import { computeOfferEV } from '@/lib/actions/offer-ev';
import { logger, logCron } from '@/lib/logging';

export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isDev = process.env.NODE_ENV === 'development';
  const isAuthenticated = authHeader === `Bearer ${cronSecret}`;

  if (!isAuthenticated && !isDev) {
    logger.warn('[ev-refresh] Unauthorized attempt', {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    const result = await computeOfferEV();

    const duration = Date.now() - startTime;

    logCron({
      job: 'ev-refresh',
      status: 'success',
      duration_ms: duration,
      computed: result.computed,
      sufficient: result.sufficient,
      insufficient: result.insufficient,
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
      job: 'ev-refresh',
      status: 'error',
      error: msg,
    });

    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
