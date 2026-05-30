// app/api/dashboard/compliance-audit/route.ts
// POST proxy: runs the global compliance audit and returns results.
// Solves: 'use client' components cannot import server actions directly (Turbopack crash).

import { NextRequest, NextResponse } from 'next/server';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';
import {
  getLatestAuditRun,
  runComplianceAudit,
  saveAuditRun,
} from '@/lib/actions/compliance-audit';

function isAuthorized(request: NextRequest): boolean {
  const dashSecret = process.env.DASHBOARD_SECRET;
  const authCookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return (
    isValidDashboardSessionValue(authCookie, dashSecret) ||
    compareSecret(bearerToken, dashSecret)
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startedAt = Date.now();
    const result = await runComplianceAudit();
    await saveAuditRun(result, 'manual', Date.now() - startedAt);
    const lastRun = await getLatestAuditRun();
    return NextResponse.json({ ok: true, result, lastRun });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Audit failed' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json({ lastRun: await getLatestAuditRun() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load latest audit' },
      { status: 500 },
    );
  }
}
