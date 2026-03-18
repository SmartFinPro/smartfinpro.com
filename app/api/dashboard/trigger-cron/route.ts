// app/api/dashboard/trigger-cron/route.ts
// Manually triggers any cron job from the dashboard.
// Protected by proxy.ts (same session auth as all /api/dashboard/* routes).

import { NextRequest, NextResponse } from 'next/server';

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

  // Call the cron endpoint on the same server
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const start = Date.now();

  try {
    const res = await fetch(`${baseUrl}/api/cron/${job}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(30_000),
    });

    const body = await res.text().catch(() => '');
    const duration = Date.now() - start;

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      duration,
      body: body.slice(0, 500),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'fetch failed',
      duration: Date.now() - start,
    }, { status: 502 });
  }
}
