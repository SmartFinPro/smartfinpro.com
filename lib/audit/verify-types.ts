// lib/audit/verify-types.ts
// Shared types and constants for the audit verification runner.
// Imported by: API routes (/api/audit/verify/*), status manager, UI button.
//
// Central definition prevents magic strings scattered across files.

// ── Verify run status ──────────────────────────────────────────────────────────

export type VerifyRunStatus = 'idle' | 'running' | 'passed' | 'failed';

// ── Verify state — persisted to audits/reports/verify-status.json ────────────

export interface VerifyState {
  /** Current status of the verify runner. */
  status: VerifyRunStatus;
  /** Unique ID for this run (crypto.randomUUID). Null when idle and never run. */
  runId: string | null;
  /** ISO timestamp when the current/last run started. */
  startedAt: string | null;
  /** ISO timestamp when the current/last run finished. Null while running. */
  finishedAt: string | null;
  /** Process exit code. Null while running or if never run. */
  exitCode: number | null;
  /** Last error message (stderr excerpt or spawn error). Null on success. */
  lastError: string | null;
  /** PID of the running child process. Used for stale-lock detection. */
  pid: number | null;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

export const VERIFY_STATE_IDLE: VerifyState = {
  status: 'idle',
  runId: null,
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  lastError: null,
  pid: null,
};

// ── API response types ─────────────────────────────────────────────────────────

export interface VerifyStartResponse {
  runId: string;
  status: 'running';
  startedAt: string;
}

export interface VerifyStartConflictResponse {
  error: string;
  currentRunId: string;
  startedAt: string;
}

export type VerifyStatusResponse = VerifyState;
