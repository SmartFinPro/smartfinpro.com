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
