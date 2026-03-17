// app/api/dashboard/trigger-scan/route.ts
// Proxy: validates dashboard session → forwards to affiliate-scout cron with CRON_SECRET
// Solves: client can't know CRON_SECRET; sends DASHBOARD_SECRET cookie instead.

import { NextRequest, NextResponse } from 'next/server';

function isAuthed(request: NextRequest): boolean {
  // Auth-disabled flag takes priority (dev / local)
  if (process.env.DASHBOARD_AUTH_DISABLED === 'true') return true;

  const dashSecret = process.env.DASHBOARD_SECRET;
  if (!dashSecret) return false;

  const cookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearer = request.headers.get('authorization')?.replace('Bearer ', '');

  return cookie === dashSecret || bearer === dashSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  // Build base URL from request (works on VPS + local dev)
  const { origin } = new URL(request.url);

  try {
    const res = await fetch(`${origin}/api/cron/affiliate-scout`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Proxy error' },
      { status: 502 },
    );
  }
}
