import { NextRequest, NextResponse } from 'next/server';
import { runSeoDriftCheck } from '@/lib/actions/seo-drift';

/**
 * SEO Drift Monitor — Cron Job
 * ============================
 * Weekly audit that compares current MDX quality scores against the
 * committed baseline (scripts/seo-baseline.json). Fires a Telegram
 * alert if any file regresses or new non-compliant files are detected.
 *
 * Checks performed:
 *   • Score regressions vs baseline (any score drop)
 *   • New files added without full compliance (score < 9.5)
 *   • Aggregate violations across all 173+ review files
 *
 * Schedule: Weekly — Monday 08:00 UTC
 *
 * Crontab entry (VPS):
 *   0 8 * * 1 curl -sf -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/seo-drift >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 *
 * Manual trigger:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://smartfinpro.com/api/cron/seo-drift
 */
export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isDev      = process.env.NODE_ENV === 'development';

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}` && !isDev) {
    console.warn(
      `[seo-drift] Unauthorized attempt from ${request.headers.get('x-forwarded-for') ?? 'unknown'}`,
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Run ───────────────────────────────────────────────────────────────
  try {
    const startTime = Date.now();
    const result    = await runSeoDriftCheck();
    const duration  = ((Date.now() - startTime) / 1000).toFixed(1);

    const status = result.violations.length === 0 &&
                   result.regressions.length === 0 &&
                   result.newNonCompliant.length === 0
      ? 'clean'
      : 'drift_detected';

    console.log(
      `[seo-drift] ${status}: scanned=${result.scanned} avg=${result.avgScore} ` +
      `violations=${result.violations.length} regressions=${result.regressions.length} ` +
      `new_bad=${result.newNonCompliant.length} alert=${result.alertSent} (${duration}s)`,
    );

    return NextResponse.json({
      status,
      scanned:          result.scanned,
      avgScore:         result.avgScore,
      perfectFiles:     result.perfectFiles,
      violations:       result.violations.length,
      regressions:      result.regressions.length,
      newNonCompliant:  result.newNonCompliant.length,
      alertSent:        result.alertSent,
      durationMs:       result.durationMs,
      ...(result.violations.length > 0 && {
        violationDetails: result.violations.map(v => ({ file: v.file, score: v.score, issues: v.issues })),
      }),
      ...(result.regressions.length > 0 && {
        regressionDetails: result.regressions.map(r => ({ file: r.file, was: r.was, now: r.now, delta: r.delta })),
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[seo-drift] Fatal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
