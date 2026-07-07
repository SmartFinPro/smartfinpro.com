// app/api/cron/attribution-watchdog/route.ts
// Attribution Watchdog — detects silent revenue-attribution failures per
// provider (clicks flowing, conversions/revenue not) and opens incidents +
// Notification-Center alerts.
//
// Schedule: daily 06:30 UTC (after overnight network syncs)
//   30 6 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" \
//     http://localhost:3000/api/cron/attribution-watchdog >> logs/cron.log 2>&1
//
// ?dryRun=1 → full report JSON, ZERO writes (no incidents, no alerts, no
// audit). This is the safe prod verification path — dev reads PROD Supabase.
//
// NOTE: unlike spike-monitor there is deliberately NO dev-mode auth bypass,
// because a local dev run would write into the production database.

import { NextRequest } from 'next/server';
import { logger, logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';
import { runAttributionWatchdog } from '@/lib/actions/attribution-watchdog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const start = Date.now();

  if (!validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[attribution-watchdog] Unauthorized attempt', {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return new Response('Unauthorized', { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';

  try {
    const result = await runAttributionWatchdog({ dryRun });

    if (!dryRun) {
      logCron({
        job: 'attribution-watchdog',
        status: result.ok ? 'success' : 'partial',
        duration_ms: Date.now() - start,
        providers_checked: result.providersChecked,
        incidents_opened: result.incidentsOpened,
        incidents_resolved: result.incidentsResolved,
        alerts_sent: result.alertsSent,
        ...(result.errors.length > 0 && { error: result.errors.join('; ') }),
      });
    }

    return Response.json({
      ok: result.ok,
      dryRun,
      skipped: result.skipped ?? false,
      providers_checked: result.providersChecked,
      incidents_opened: result.incidentsOpened,
      incidents_resolved: result.incidentsResolved,
      alerts_sent: result.alertsSent,
      candidates: result.candidates,
      ...(dryRun && result.providers && { providers: result.providers }),
      unmatched_cta_providers: result.unmatchedCtaProviders,
      errors: result.errors,
      duration_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[cron/attribution-watchdog] Fatal', { error: msg });

    if (!dryRun) {
      logCron({
        job: 'attribution-watchdog',
        status: 'error',
        duration_ms: Date.now() - start,
        error: msg,
      });
    }

    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
