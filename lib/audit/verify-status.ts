// lib/audit/verify-status.ts
// Status manager + lock logic for the audit verification runner.
//
// Persists run state to audits/reports/verify-status.json.
// Provides atomic lock acquisition via PID-based stale detection.
//
// Imported by: /api/audit/verify/start, /api/audit/verify/status, unit tests.

import fs from 'fs';
import path from 'path';
import type { VerifyState } from './verify-types';
import { VERIFY_STATE_IDLE } from './verify-types';

// ── Paths ──────────────────────────────────────────────────────────────────────

const REPORT_DIR = path.join(process.cwd(), 'audits', 'reports');
const STATUS_FILE = path.join(REPORT_DIR, 'verify-status.json');

/** Exposed for testing — override via dependency injection in tests. */
export const PATHS = {
  reportDir: REPORT_DIR,
  statusFile: STATUS_FILE,
} as const;

// ── Read / Write ───────────────────────────────────────────────────────────────

export function readVerifyStatus(statusFile = PATHS.statusFile): VerifyState {
  if (!fs.existsSync(statusFile)) return { ...VERIFY_STATE_IDLE };
  try {
    const raw = fs.readFileSync(statusFile, 'utf-8');
    const parsed: VerifyState = JSON.parse(raw);
    return parsed;
  } catch {
    return { ...VERIFY_STATE_IDLE };
  }
}

export function writeVerifyStatus(
  state: VerifyState,
  statusFile = PATHS.statusFile,
  reportDir = PATHS.reportDir,
): void {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(statusFile, JSON.stringify(state, null, 2), 'utf-8');
}

// ── PID alive check (cross-platform) ──────────────────────────────────────────

export function isPidAlive(pid: number): boolean {
  try {
    // Sending signal 0 doesn't kill the process — just checks existence.
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// ── Stale lock detection ───────────────────────────────────────────────────────
//
// A lock is stale when:
//   - status === 'running'
//   - AND the PID is no longer alive  (or was never recorded)
//
// NOTE: No time-based fallback — a time check would falsely mark a still-alive
// process as stale (e.g. long integration suites). isPidAlive() is sufficient
// because the OS recycles PIDs only after a process truly exits.

export function isLockStale(state: VerifyState): boolean {
  if (state.status !== 'running') return false;

  // No PID recorded? Definitely stale.
  if (state.pid === null) return true;

  // PID no longer alive? Stale.
  if (!isPidAlive(state.pid)) return true;

  return false;
}

// ── Lock acquisition ───────────────────────────────────────────────────────────

export interface TryAcquireResult {
  acquired: boolean;
  state: VerifyState;
}

/**
 * Attempts to acquire a run lock. Returns { acquired: true, state } if the
 * lock was acquired, or { acquired: false, state } with the current running
 * state if another run is in progress.
 *
 * Automatically recovers from stale locks (crashed/killed processes).
 */
export function tryAcquireLock(
  runId: string,
  pid: number,
  statusFile = PATHS.statusFile,
  reportDir = PATHS.reportDir,
): TryAcquireResult {
  const current = readVerifyStatus(statusFile);

  // If currently running, check for stale lock
  if (current.status === 'running') {
    if (!isLockStale(current)) {
      // Genuinely running — reject
      return { acquired: false, state: current };
    }
    // Stale lock — recover by marking previous run as failed
    const recovered: VerifyState = {
      ...current,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      exitCode: -1,
      lastError: 'Previous run did not complete (stale lock recovered).',
      pid: null,
    };
    writeVerifyStatus(recovered, statusFile, reportDir);
  }

  // Acquire lock
  const now = new Date().toISOString();
  const newState: VerifyState = {
    status: 'running',
    runId,
    startedAt: now,
    finishedAt: null,
    exitCode: null,
    lastError: null,
    pid,
  };
  writeVerifyStatus(newState, statusFile, reportDir);
  return { acquired: true, state: newState };
}

// ── Mark run finished ──────────────────────────────────────────────────────────
//
// runId + pid guard: only write if the state file still belongs to THIS run.
// Without this guard, a late-exiting old process could overwrite the state of
// a newer run that already started (P1 race condition).

export function markFinished(
  runId: string,
  pid: number,
  exitCode: number,
  lastError: string | null,
  statusFile = PATHS.statusFile,
  reportDir = PATHS.reportDir,
): VerifyState | null {
  const current = readVerifyStatus(statusFile);

  // Bail out if a newer run has already taken ownership of the state file.
  if (current.runId !== runId || current.pid !== pid) {
    return null;
  }

  const finished: VerifyState = {
    ...current,
    status: exitCode === 0 ? 'passed' : 'failed',
    finishedAt: new Date().toISOString(),
    exitCode,
    lastError,
    pid: null,
  };
  writeVerifyStatus(finished, statusFile, reportDir);
  return finished;
}
