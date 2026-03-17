// app/api/audit/verify/status/route.ts
// GET — Returns the current verification run status.
//
// Auth: DASHBOARD_SECRET via cookie or bearer token.
//
// Response:
//   200 OK — { status, runId, startedAt, finishedAt, exitCode, lastError, pid }
//   401 Unauthorized
//
// Auto-recovers stale locks: if status is "running" but the PID is dead,
// the state is corrected to "failed" before responding.

import { NextRequest, NextResponse } from 'next/server';
import { readVerifyStatus, isLockStale, writeVerifyStatus, PATHS } from '@/lib/audit/verify-status';
import type { VerifyState, VerifyStatusResponse } from '@/lib/audit/verify-types';

export const dynamic = 'force-dynamic';

// ── Auth (mirrors /api/dashboard/trigger-scan) ─────────────────────────────────

function isAuthed(request: NextRequest): boolean {
  if (process.env.DASHBOARD_AUTH_DISABLED === 'true') return true;

  const dashSecret = process.env.DASHBOARD_SECRET;
  if (!dashSecret) return false;

  const cookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearer = request.headers.get('authorization')?.replace('Bearer ', '');

  return cookie === dashSecret || bearer === dashSecret;
}

// ── GET handler ────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let state: VerifyState = readVerifyStatus();

  // Auto-recover stale locks so the UI never gets stuck on "running"
  if (state.status === 'running' && isLockStale(state)) {
    const recovered: VerifyState = {
      ...state,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      exitCode: -1,
      lastError: 'Process terminated unexpectedly (stale lock recovered).',
      pid: null,
    };
    writeVerifyStatus(recovered, PATHS.statusFile, PATHS.reportDir);
    state = recovered;
  }

  const response: VerifyStatusResponse = state;
  return NextResponse.json(response, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
