// app/api/cron/ev-refresh/route.ts
// P4: EV Refresh — scheduled hourly via GitHub Actions cron workflow
//
// Schedule: Hourly at :05 UTC (same batch as sync-conversions / perf-governance)

import { NextRequest, NextResponse } from 'next/server';
import { computeOfferEV } from '@/lib/actions/offer-ev';
import { logger, logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

async function handleRequest(request: NextRequest) {
  // ── Auth (timing-safe) ──────────────────────────────────────────
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && !validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
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

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
