// app/api/dashboard/trigger-cron/route.ts
// Manually triggers any cron job from the dashboard.
// Protected by proxy.ts (same session auth as all /api/dashboard/* routes).
// Always logs to cron_logs so the Cron Health page picks up the run.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const ALLOWED_JOBS = [
  'spike-monitor',
  'perf-governance',
  'auto-genesis',
  'ev-refresh',
  'sync-conversions',
  'update-fx-rates',
  'seo-drift',
  'check-links',
  'sync-competitors',
  'sync-revenue',
  'freshness-check',
  'check-rankings',
  'affiliate-scout',
  'send-emails',
  'backlink-post',
  'daily-strategy',
  'backlink-scout',
  'backlink-verify',
  'weekly-report',
];

export async function POST(req: NextRequest) {
  const { job } = await req.json();

  if (!job || !ALLOWED_JOBS.includes(job)) {
    return NextResponse.json({ error: 'Unknown job' }, { status: 400 });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  // Call the cron endpoint directly on the local process — bypasses Cloudflare
  // so there's no hairpin-loop through the CDN. PORT is set by PM2 (prod=3000)
  // and by the Next.js dev server (dev=3002 via launch.json).
  const port    = process.env.PORT ?? '3000';
  const baseUrl = `http://localhost:${port}`;
  const start = Date.now();

  try {
    const res = await fetch(`${baseUrl}/api/cron/${job}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(30_000),
    });

    const body = await res.text().catch(() => '');
    const duration = Date.now() - start;

    // Always log to cron_logs — most cron jobs don't log themselves,
    // so without this the Cron Health page would always show "never run".
    let logError: string | null = null;
    try {
      const supabase = createServiceClient();
      const { error: insertErr } = await supabase.from('cron_logs').insert({
        job_name: job,
        status: res.ok ? 'success' : 'error',
        duration_ms: duration,
        error: res.ok ? null : `HTTP ${res.status}: ${body.slice(0, 200)}`,
        metadata: { source: 'dashboard-trigger', httpStatus: res.status },
        executed_at: new Date().toISOString(),
      });
      if (insertErr) logError = insertErr.message;
    } catch (e) {
      logError = e instanceof Error ? e.message : 'unknown';
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      duration,
      body: body.slice(0, 500),
      logged: !logError,
      logError,
    });
  } catch (err) {
    const duration = Date.now() - start;

    // Log failure to cron_logs too
    try {
      const supabase = createServiceClient();
      await supabase.from('cron_logs').insert({
        job_name: job,
        status: 'error',
        duration_ms: duration,
        error: err instanceof Error ? err.message : 'fetch failed',
        metadata: { source: 'dashboard-trigger' },
        executed_at: new Date().toISOString(),
      });
    } catch {
      // Don't fail the response if logging fails
    }

    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'fetch failed',
      duration,
    }, { status: 502 });
  }
}
