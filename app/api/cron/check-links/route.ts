import { NextRequest, NextResponse } from 'next/server';
import { runHealthChecks } from '@/lib/actions/link-health';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { createServiceClient } from '@/lib/supabase/server';
import { logger, logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

/**
 * Link Health Monitor (Dead-Link Monitor) — Cron Job
 *
 * Sends HEAD requests (8s timeout, 5 concurrent) to all active affiliate
 * links. Classifies each as healthy / degraded (>5s) / dead. Persists
 * health_status + last_health_check to affiliate_links via Supabase.
 * Fires a Telegram alert if any dead or degraded links are found.
 * Logs run results to cron_logs table.
 *
 * Requires DB migration: 20260305120000_affiliate_link_health.sql
 *
 * Schedule: Daily @ 02:00 server time
 *
 * Self-hosted crontab entry:
 *   0 2 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/check-links >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // ── Auth (timing-safe) ──────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && !validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[check-links] Unauthorized attempt', { ip: request.headers.get('x-forwarded-for') ?? 'unknown' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Run checks ──────────────────────────────────────────────────────────
  const startTime = Date.now();
  let alertSent = false;

  try {
    const result = await runHealthChecks();
    const durationMs = Date.now() - startTime;
    const duration = (durationMs / 1000).toFixed(1);

    logger.info('[check-links] Health check complete', {
      healthy: result.healthy, degraded: result.degraded, dead: result.dead, total: result.results.length, duration_s: duration,
    });

    // ── Telegram alert on issues ─────────────────────────────────────────
    const hasIssues = result.dead > 0 || result.degraded > 0;

    if (hasIssues) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
      const severity = result.dead > 0 ? '🔴' : '🟠';

      const deadSlugs = result.results
        .filter((r) => !r.healthy)
        .slice(0, 10)
        .map((r) => `  • <code>${r.slug}</code>`)
        .join('\n');

      const overflowNote =
        result.dead > 10 ? `  … and ${result.dead - 10} more\n` : '';

      const message = [
        `${severity} <b>DEAD LINK ALERT</b>`,
        ``,
        `✅ <b>Healthy:</b> ${result.healthy}/${result.results.length}`,
        result.dead > 0 ? `❌ <b>Dead:</b> ${result.dead}` : null,
        result.degraded > 0 ? `⚠️ <b>Degraded (slow >5s):</b> ${result.degraded}` : null,
        result.dead > 0 ? `\n<b>Dead Links:</b>\n${deadSlugs}${overflowNote}` : null,
        `🔗 <a href="${siteUrl}/dashboard/links">View Affiliate Links</a>`,
        `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
      ]
        .filter(Boolean)
        .join('\n');

      const telegramResult = await sendTelegramAlert(message);
      alertSent = telegramResult.success;

      if (!telegramResult.success) {
        logger.warn('[check-links] Telegram alert failed', { error: telegramResult.error });
      }
    }

    logCron({ job: 'check-links', status: 'success', duration_ms: durationMs, healthy: result.healthy, degraded: result.degraded, dead: result.dead, total: result.results.length });

    return NextResponse.json({
      success: true,
      healthy: result.healthy,
      degraded: result.degraded,
      dead: result.dead,
      total: result.results.length,
      alertSent,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const durationMs = Date.now() - startTime;
    logCron({ job: 'check-links', status: 'error', duration_ms: durationMs, error: msg });

    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
