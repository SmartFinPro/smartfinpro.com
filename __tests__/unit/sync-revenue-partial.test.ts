// __tests__/unit/sync-revenue-partial.test.ts
// Test A: Revenue Partial Failure Classification (Fix 1.3)
//
// Verifies the HTTP status + cronStatus classification logic from
// app/api/cron/sync-revenue/route.ts — inlined to avoid Next.js runtime deps.

import { describe, it, expect } from 'vitest';

// ── Inlined classification logic from sync-revenue/route.ts ──────────────
interface NetworkResult {
  network: string;
  success: boolean;
  errors: string[];
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
}

function classifySyncResult(results: NetworkResult[]) {
  const networksOk = results.filter((r) => r.success).map((r) => r.network);
  const networksFailed = results.filter((r) => !r.success).map((r) => r.network);
  const allFailed = networksOk.length === 0 && networksFailed.length > 0;
  const partialFailure = networksFailed.length > 0 && networksOk.length > 0;

  const cronStatus = allFailed ? 'error' : partialFailure ? 'partial' : 'success';
  const httpStatus = allFailed ? 500 : partialFailure ? 207 : 200;

  return { networksOk, networksFailed, allFailed, partialFailure, cronStatus, httpStatus };
}
// ─────────────────────────────────────────────────────────────────────────────

const ok = (network: string): NetworkResult => ({
  network, success: true, errors: [], recordsCreated: 5, recordsUpdated: 2, recordsSkipped: 0,
});

const fail = (network: string, error = 'API timeout'): NetworkResult => ({
  network, success: false, errors: [error], recordsCreated: 0, recordsUpdated: 0, recordsSkipped: 0,
});

describe('sync-revenue: partial failure classification (Fix 1.3)', () => {
  // ── All networks succeed ───────────────────────────────────────────────
  it('returns HTTP 200 + cronStatus "success" when all networks succeed', () => {
    const r = classifySyncResult([ok('partnerstack'), ok('awin'), ok('financeads')]);
    expect(r.httpStatus).toBe(200);
    expect(r.cronStatus).toBe('success');
    expect(r.partialFailure).toBe(false);
    expect(r.allFailed).toBe(false);
    expect(r.networksOk).toEqual(['partnerstack', 'awin', 'financeads']);
    expect(r.networksFailed).toEqual([]);
  });

  // ── Partial failure (1 of 3 fails) ────────────────────────────────────
  it('returns HTTP 207 + cronStatus "partial" when 1 network fails', () => {
    const r = classifySyncResult([ok('partnerstack'), fail('awin'), ok('financeads')]);
    expect(r.httpStatus).toBe(207);
    expect(r.cronStatus).toBe('partial');
    expect(r.partialFailure).toBe(true);
    expect(r.allFailed).toBe(false);
    expect(r.networksOk).toEqual(['partnerstack', 'financeads']);
    expect(r.networksFailed).toEqual(['awin']);
  });

  // ── Partial failure (2 of 3 fail) ─────────────────────────────────────
  it('returns HTTP 207 + cronStatus "partial" when 2 networks fail', () => {
    const r = classifySyncResult([fail('partnerstack'), fail('awin'), ok('financeads')]);
    expect(r.httpStatus).toBe(207);
    expect(r.cronStatus).toBe('partial');
    expect(r.partialFailure).toBe(true);
    expect(r.allFailed).toBe(false);
  });

  // ── All networks fail ──────────────────────────────────────────────────
  it('returns HTTP 500 + cronStatus "error" when ALL networks fail', () => {
    const r = classifySyncResult([fail('partnerstack'), fail('awin'), fail('financeads')]);
    expect(r.httpStatus).toBe(500);
    expect(r.cronStatus).toBe('error');
    expect(r.partialFailure).toBe(false);
    expect(r.allFailed).toBe(true);
    expect(r.networksOk).toEqual([]);
    expect(r.networksFailed).toEqual(['partnerstack', 'awin', 'financeads']);
  });

  // ── Edge: single network succeeds ──────────────────────────────────────
  it('returns HTTP 200 for single successful network', () => {
    const r = classifySyncResult([ok('partnerstack')]);
    expect(r.httpStatus).toBe(200);
    expect(r.cronStatus).toBe('success');
  });

  // ── Edge: single network fails ─────────────────────────────────────────
  it('returns HTTP 500 for single failed network', () => {
    const r = classifySyncResult([fail('partnerstack')]);
    expect(r.httpStatus).toBe(500);
    expect(r.cronStatus).toBe('error');
  });

  // ── Edge: empty results ────────────────────────────────────────────────
  it('returns HTTP 200 + success for empty results array', () => {
    const r = classifySyncResult([]);
    expect(r.httpStatus).toBe(200);
    expect(r.cronStatus).toBe('success');
    expect(r.allFailed).toBe(false);
    expect(r.partialFailure).toBe(false);
  });
});
