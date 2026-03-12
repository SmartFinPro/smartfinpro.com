// __tests__/unit/verify-status.test.ts
// Unit tests for the audit verify status manager + lock logic.
//
// Tests cover:
//   - readVerifyStatus: defaults, valid file, corrupt file
//   - writeVerifyStatus: creates dir, writes JSON
//   - isLockStale: PID alive, PID dead, no PID, timeout
//   - tryAcquireLock: fresh lock, concurrent rejection, stale recovery
//   - markFinished: success, failure, error details

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  readVerifyStatus,
  writeVerifyStatus,
  isPidAlive,
  isLockStale,
  tryAcquireLock,
  markFinished,
} from '@/lib/audit/verify-status';
import { VERIFY_STATE_IDLE } from '@/lib/audit/verify-types';
import type { VerifyState } from '@/lib/audit/verify-types';

// ── Test fixtures ──────────────────────────────────────────────────────────────

const TEST_DIR = path.join(process.cwd(), 'audits', 'reports', '__test__');
const TEST_FILE = path.join(TEST_DIR, 'verify-status-test.json');

function cleanup() {
  if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  if (fs.existsSync(TEST_DIR)) fs.rmdirSync(TEST_DIR);
}

beforeEach(() => {
  cleanup();
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ── readVerifyStatus ───────────────────────────────────────────────────────────

describe('readVerifyStatus', () => {
  it('returns idle state when file does not exist', () => {
    const state = readVerifyStatus('/nonexistent/path/file.json');
    expect(state).toEqual(VERIFY_STATE_IDLE);
  });

  it('returns parsed state from valid JSON file', () => {
    const stored: VerifyState = {
      status: 'passed',
      runId: 'test-123',
      startedAt: '2026-03-08T10:00:00Z',
      finishedAt: '2026-03-08T10:05:00Z',
      exitCode: 0,
      lastError: null,
      pid: null,
    };
    fs.writeFileSync(TEST_FILE, JSON.stringify(stored), 'utf-8');
    const state = readVerifyStatus(TEST_FILE);
    expect(state).toEqual(stored);
  });

  it('returns idle state on corrupt JSON', () => {
    fs.writeFileSync(TEST_FILE, '{{invalid json!!', 'utf-8');
    const state = readVerifyStatus(TEST_FILE);
    expect(state).toEqual(VERIFY_STATE_IDLE);
  });
});

// ── writeVerifyStatus ──────────────────────────────────────────────────────────

describe('writeVerifyStatus', () => {
  it('writes JSON to file', () => {
    const state: VerifyState = {
      ...VERIFY_STATE_IDLE,
      status: 'running',
      runId: 'write-test',
    };
    writeVerifyStatus(state, TEST_FILE, TEST_DIR);
    const raw = fs.readFileSync(TEST_FILE, 'utf-8');
    expect(JSON.parse(raw)).toEqual(state);
  });

  it('creates directory if missing', () => {
    cleanup(); // Remove test dir
    const deepFile = path.join(TEST_DIR, 'deep', 'file.json');
    const deepDir = path.join(TEST_DIR, 'deep');
    const state: VerifyState = { ...VERIFY_STATE_IDLE };
    writeVerifyStatus(state, deepFile, deepDir);
    expect(fs.existsSync(deepFile)).toBe(true);
    // Clean up deep dir
    fs.unlinkSync(deepFile);
    fs.rmdirSync(deepDir);
  });
});

// ── isPidAlive ─────────────────────────────────────────────────────────────────

describe('isPidAlive', () => {
  it('returns true for current process PID', () => {
    expect(isPidAlive(process.pid)).toBe(true);
  });

  it('returns false for non-existent PID', () => {
    // PID 99999999 is extremely unlikely to exist
    expect(isPidAlive(99999999)).toBe(false);
  });
});

// ── isLockStale ────────────────────────────────────────────────────────────────

describe('isLockStale', () => {
  it('returns false when status is not running', () => {
    const state: VerifyState = { ...VERIFY_STATE_IDLE, status: 'passed' };
    expect(isLockStale(state)).toBe(false);
  });

  it('returns true when running with no PID', () => {
    const state: VerifyState = { ...VERIFY_STATE_IDLE, status: 'running', pid: null };
    expect(isLockStale(state)).toBe(true);
  });

  it('returns false when running with alive PID', () => {
    const state: VerifyState = {
      ...VERIFY_STATE_IDLE,
      status: 'running',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    };
    expect(isLockStale(state)).toBe(false);
  });

  it('returns true when running with dead PID', () => {
    const state: VerifyState = {
      ...VERIFY_STATE_IDLE,
      status: 'running',
      pid: 99999999,
      startedAt: new Date().toISOString(),
    };
    expect(isLockStale(state)).toBe(true);
  });

  it('returns false when running longer than 10 minutes but PID still alive', () => {
    // P1 fix: time-based stale detection removed — alive PID must not be evicted.
    const state: VerifyState = {
      ...VERIFY_STATE_IDLE,
      status: 'running',
      pid: process.pid, // alive
      startedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(), // 11 min ago
    };
    expect(isLockStale(state)).toBe(false);
  });
});

// ── tryAcquireLock ─────────────────────────────────────────────────────────────

describe('tryAcquireLock', () => {
  it('acquires lock when idle', () => {
    const { acquired, state } = tryAcquireLock('run-1', process.pid, TEST_FILE, TEST_DIR);
    expect(acquired).toBe(true);
    expect(state.status).toBe('running');
    expect(state.runId).toBe('run-1');
    expect(state.pid).toBe(process.pid);
  });

  it('rejects when another run is active with alive PID', () => {
    // First: acquire a lock
    tryAcquireLock('run-1', process.pid, TEST_FILE, TEST_DIR);

    // Second: try to acquire another lock
    const { acquired, state } = tryAcquireLock('run-2', process.pid, TEST_FILE, TEST_DIR);
    expect(acquired).toBe(false);
    expect(state.runId).toBe('run-1'); // Returns the existing run info
    expect(state.status).toBe('running');
  });

  it('recovers stale lock and acquires', () => {
    // Write a stale running state (dead PID)
    const stale: VerifyState = {
      status: 'running',
      runId: 'stale-run',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      exitCode: null,
      lastError: null,
      pid: 99999999, // dead PID
    };
    writeVerifyStatus(stale, TEST_FILE, TEST_DIR);

    // Should recover stale lock and acquire
    const { acquired, state } = tryAcquireLock('run-new', process.pid, TEST_FILE, TEST_DIR);
    expect(acquired).toBe(true);
    expect(state.runId).toBe('run-new');
    expect(state.status).toBe('running');
  });
});

// ── markFinished ───────────────────────────────────────────────────────────────

describe('markFinished', () => {
  it('marks as passed with exit code 0', () => {
    tryAcquireLock('run-finish', process.pid, TEST_FILE, TEST_DIR);

    const result = markFinished('run-finish', process.pid, 0, null, TEST_FILE, TEST_DIR);
    expect(result).not.toBeNull();
    expect(result!.status).toBe('passed');
    expect(result!.exitCode).toBe(0);
    expect(result!.lastError).toBeNull();
    expect(result!.finishedAt).toBeTruthy();
    expect(result!.pid).toBeNull();
  });

  it('marks as failed with exit code 1 and error', () => {
    tryAcquireLock('run-fail', process.pid, TEST_FILE, TEST_DIR);

    const result = markFinished('run-fail', process.pid, 1, 'Tests failed', TEST_FILE, TEST_DIR);
    expect(result).not.toBeNull();
    expect(result!.status).toBe('failed');
    expect(result!.exitCode).toBe(1);
    expect(result!.lastError).toBe('Tests failed');
    expect(result!.pid).toBeNull();
  });

  it('preserves runId and startedAt from running state', () => {
    tryAcquireLock('run-preserve', process.pid, TEST_FILE, TEST_DIR);
    const result = markFinished('run-preserve', process.pid, 0, null, TEST_FILE, TEST_DIR);
    expect(result).not.toBeNull();
    expect(result!.runId).toBe('run-preserve');
    expect(result!.startedAt).toBeTruthy();
  });

  it('returns null and does not overwrite state when runId does not match (P1 guard)', () => {
    // Simulate: old run exits after a new run has started.
    tryAcquireLock('run-new', process.pid, TEST_FILE, TEST_DIR);

    // Old run (different runId) tries to mark finished.
    const result = markFinished('run-old', process.pid, 0, null, TEST_FILE, TEST_DIR);
    expect(result).toBeNull();

    // State file must still belong to the new run.
    const state = readVerifyStatus(TEST_FILE);
    expect(state.runId).toBe('run-new');
    expect(state.status).toBe('running');
  });

  it('returns null and does not overwrite state when pid does not match (P1 guard)', () => {
    tryAcquireLock('run-pid-test', process.pid, TEST_FILE, TEST_DIR);

    // Wrong PID (simulates a stale exit from a previously crashed process).
    const result = markFinished('run-pid-test', 99999999, 0, null, TEST_FILE, TEST_DIR);
    expect(result).toBeNull();

    const state = readVerifyStatus(TEST_FILE);
    expect(state.status).toBe('running');
  });
});
