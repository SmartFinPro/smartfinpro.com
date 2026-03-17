// app/api/audit/verify/start/route.ts
// POST — Starts bin/verify-audit.sh as a detached background process.
//
// Auth: DASHBOARD_SECRET via cookie or bearer token (same pattern as /api/dashboard/*).
//
// Response:
//   202 Accepted — run started, returns { runId, status, startedAt }
//   409 Conflict  — another run is already in progress
//   401 Unauthorized
//   500 Internal Server Error (missing script, spawn failure)
//
// The child process runs detached. On exit, the .on('exit') handler
// updates verify-status.json with the final result — no polling needed server-side.

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { tryAcquireLock, markFinished, PATHS } from '@/lib/audit/verify-status';
import type { VerifyStartResponse, VerifyStartConflictResponse } from '@/lib/audit/verify-types';

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

// ── POST handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the script exists
  const scriptPath = path.join(process.cwd(), 'bin', 'verify-audit.sh');
  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json(
      { error: 'Audit script not found: bin/verify-audit.sh' },
      { status: 500 },
    );
  }

  // Generate run ID
  const runId = crypto.randomUUID();

  // Ensure report directory exists
  if (!fs.existsSync(PATHS.reportDir)) {
    fs.mkdirSync(PATHS.reportDir, { recursive: true });
  }

  // Spawn the process first to get a PID, then acquire lock
  const logFile = path.join(
    PATHS.reportDir,
    `verify-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
  );
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  let child;
  try {
    child = spawn('bash', [scriptPath], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: { ...process.env },
    });
  } catch (err) {
    logStream.end(); // P2: close fd on spawn failure
    return NextResponse.json(
      { error: `Failed to spawn process: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  const pid = child.pid;
  if (!pid) {
    logStream.end(); // P2: close fd when PID unavailable
    return NextResponse.json(
      { error: 'Failed to obtain PID from spawned process.' },
      { status: 500 },
    );
  }

  // Try to acquire lock with the real PID
  const { acquired, state } = tryAcquireLock(runId, pid);

  if (!acquired) {
    // Another run is active — kill our just-spawned process and return 409
    try { child.kill('SIGTERM'); } catch { /* ignore */ }
    logStream.end();

    const conflict: VerifyStartConflictResponse = {
      error: 'Another audit verification is already running.',
      currentRunId: state.runId ?? 'unknown',
      startedAt: state.startedAt ?? 'unknown',
    };
    return NextResponse.json(conflict, { status: 409 });
  }

  // ── Background: pipe stdout/stderr to logfile ──────────────────────────────

  child.stdout?.pipe(logStream);
  child.stderr?.pipe(logStream);

  // Capture last 500 chars of stderr for error reporting
  let stderrTail = '';
  child.stderr?.on('data', (chunk: Buffer) => {
    const str = chunk.toString();
    stderrTail = (stderrTail + str).slice(-500);
  });

  // ── Background: on exit → update status file ───────────────────────────────

  child.on('exit', (code) => {
    const exitCode = code ?? -1;
    const lastError = exitCode !== 0 && stderrTail.trim()
      ? stderrTail.trim()
      : null;
    markFinished(runId, pid, exitCode, lastError); // P1: bound to this run
    logStream.end();
  });

  child.on('error', (err) => {
    markFinished(runId, pid, -1, `Spawn error: ${err.message}`); // P1: bound to this run
    logStream.end();
  });

  // Unref so the parent process doesn't wait for the child
  child.unref();

  // ── Return 202 Accepted immediately ────────────────────────────────────────

  const response: VerifyStartResponse = {
    runId,
    status: 'running',
    startedAt: state.startedAt!,
  };

  return NextResponse.json(response, { status: 202 });
}
