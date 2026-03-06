// app/api/health/route.ts
// Health & Readiness endpoint for load balancer + PM2 cluster monitoring.
//
// GET /api/health          — full check (Supabase, env, cron freshness)
// GET /api/health?quick=1  — liveness only (no DB call, instant response)
//
// PM2 ecosystem.config.js health check:
//   "max_restarts": 10, "health_check_grace_period": 3000
//
// Crontab keepalive example:
//   */5 * * * * curl -sf http://localhost:3000/api/health >> /dev/null

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { logger } from '@/lib/logging';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  checks: Record<string, CheckResult>;
}

interface CheckResult {
  status: 'ok' | 'warn' | 'error';
  latency_ms?: number;
  message?: string;
}

const START_TIME = Date.now();

// ── Outage Alert Cooldown ─────────────────────────────────────────────────────
// Prevent alert spam — only fire once per 30 minutes even if health stays down.
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
let lastOutageAlertAt = 0;

export async function GET(request: NextRequest): Promise<NextResponse<HealthStatus>> {
  const quick = request.nextUrl.searchParams.get('quick') === '1';
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - START_TIME) / 1000);

  // ── Quick liveness check (no external calls) ─────────────────────────────
  if (quick) {
    return NextResponse.json({
      status: 'ok',
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'production',
      uptime,
      timestamp,
      checks: { liveness: { status: 'ok' } },
    });
  }

  // ── Full readiness check ─────────────────────────────────────────────────
  const checks: Record<string, CheckResult> = {};
  let overallStatus: HealthStatus['status'] = 'ok';

  // ── 1. Environment variables ─────────────────────────────────────────────
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'CRON_SECRET',
    'RESEND_API_KEY',
    'TELEGRAM_BOT_TOKEN',
  ];
  const missingEnvs = requiredEnvs.filter((k) => !process.env[k] || process.env[k]?.startsWith('your-'));

  checks.env = missingEnvs.length === 0
    ? { status: 'ok', message: `${requiredEnvs.length} required vars present` }
    : { status: 'warn', message: `Missing: ${missingEnvs.join(', ')}` };

  if (missingEnvs.length > 0) overallStatus = 'degraded';

  // ── 2. Supabase connectivity ─────────────────────────────────────────────
  const dbStart = Date.now();
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('affiliate_links').select('id').limit(1);
    const latency = Date.now() - dbStart;

    if (error) {
      checks.supabase = { status: 'error', latency_ms: latency, message: error.message };
      overallStatus = 'down';
    } else if (latency > 2000) {
      checks.supabase = { status: 'warn', latency_ms: latency, message: 'Slow response (>2s)' };
      if (overallStatus === 'ok') overallStatus = 'degraded';
    } else {
      checks.supabase = { status: 'ok', latency_ms: latency };
    }
  } catch (err) {
    checks.supabase = {
      status: 'error',
      latency_ms: Date.now() - dbStart,
      message: err instanceof Error ? err.message : 'Connection failed',
    };
    overallStatus = 'down';
  }

  // ── 3. Last cron execution freshness ─────────────────────────────────────
  try {
    const supabase = createServiceClient();
    const { data: lastRun } = await supabase
      .from('cron_logs')
      .select('job_name, executed_at')
      .order('executed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastRun) {
      const ageMs = Date.now() - new Date(lastRun.executed_at).getTime();
      const ageHours = Math.round(ageMs / 3600000);
      checks.crons = {
        status: ageHours < 25 ? 'ok' : 'warn',
        message: `Last run: ${lastRun.job_name} (${ageHours}h ago)`,
      };
      if (ageHours >= 25 && overallStatus === 'ok') overallStatus = 'degraded';
    } else {
      checks.crons = { status: 'warn', message: 'No cron runs recorded yet' };
    }
  } catch {
    checks.crons = { status: 'warn', message: 'Could not query cron_logs' };
  }

  // ── 4. Memory usage ──────────────────────────────────────────────────────
  const memUsage = process.memoryUsage();
  const heapMB = Math.round(memUsage.heapUsed / 1048576);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1048576);

  checks.memory = {
    status: heapMB > 500 ? 'warn' : 'ok',
    message: `Heap: ${heapMB}MB / ${heapTotalMB}MB`,
  };
  if (heapMB > 800 && overallStatus === 'ok') overallStatus = 'degraded';

  // ── 5. Supabase Outage Alert (Telegram) ──────────────────────────────────
  // Fire once per 30 minutes to avoid alert spam during sustained outages.
  if (overallStatus === 'down') {
    logger.error('[health] Platform status DOWN', {
      checks: Object.fromEntries(
        Object.entries(checks).map(([k, v]) => [k, v.status + (v.message ? `: ${v.message}` : '')]),
      ),
    });

    const now = Date.now();
    if (now - lastOutageAlertAt > ALERT_COOLDOWN_MS) {
      lastOutageAlertAt = now;

      const failedChecks = Object.entries(checks)
        .filter(([, v]) => v.status === 'error')
        .map(([k, v]) => `  ❌ <b>${k}</b>: ${v.message ?? 'error'}`)
        .join('\n');

      const alertMsg = [
        `🔴 <b>SMARTFIN OUTAGE DETECTED</b>`,
        ``,
        `Status: <b>DOWN</b> — platform may be unreachable`,
        ``,
        failedChecks || `  ❌ Unknown failure`,
        ``,
        `⏱️ Uptime: ${Math.floor(uptime / 60)}min | Heap: ${heapMB}MB`,
        `<i>${timestamp}</i>`,
        ``,
        `<i>Next alert in 30 min if issue persists.</i>`,
      ].join('\n');

      // Fire-and-forget — don't block the health response
      sendTelegramAlert(alertMsg).catch((err) => {
        logger.error('[health] Telegram outage alert failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  }

  const httpStatus = overallStatus === 'down' ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'production',
      uptime,
      timestamp,
      checks,
    },
    { status: httpStatus },
  );
}
