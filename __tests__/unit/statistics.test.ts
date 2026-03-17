// __tests__/unit/statistics.test.ts
// Tests the Z-test for two proportions as implemented in lib/actions/ab-testing.ts
//
// The calculateConfidence() function is a pure math function with no I/O.
// It is inlined here verbatim so these tests remain isolated from Next.js runtime
// dependencies (createServiceClient, headers(), sendTelegramAlert).
//
// If the source implementation changes, update this copy to match.

import { describe, it, expect } from 'vitest';

// ── Inlined from lib/actions/ab-testing.ts (calculateConfidence) ──────────
/**
 * Z-test for two proportions — returns confidence level (0–100).
 * p1/n1 = variant A CR, p2/n2 = variant B CR.
 */
function calculateConfidence(
  clicksA: number,
  impressionsA: number,
  clicksB: number,
  impressionsB: number,
): number {
  if (impressionsA === 0 || impressionsB === 0) return 0;

  const p1 = clicksA / impressionsA;
  const p2 = clicksB / impressionsB;
  const pPool = (clicksA + clicksB) / (impressionsA + impressionsB);
  const se = Math.sqrt(
    pPool * (1 - pPool) * (1 / impressionsA + 1 / impressionsB),
  );

  if (se === 0) return 0;

  const z = Math.abs(p1 - p2) / se;

  if (z >= 3.29) return 99.9;
  if (z >= 2.576) return 99;
  if (z >= 2.326) return 98;
  if (z >= 1.96) return 95;
  if (z >= 1.645) return 90;
  if (z >= 1.282) return 80;
  if (z >= 1.0) return 68;
  return Math.round(z * 40);
}
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateConfidence() — Z-test for two proportions', () => {
  // ── Edge cases ────────────────────────────────────────────────────────────

  it('returns 0 when impressionsA is zero', () => {
    expect(calculateConfidence(0, 0, 10, 500)).toBe(0);
  });

  it('returns 0 when impressionsB is zero', () => {
    expect(calculateConfidence(10, 500, 0, 0)).toBe(0);
  });

  it('returns 0 when both CRs are 0% (se = 0)', () => {
    // pPool = 0 → se = sqrt(0 * 1 * ...) = 0 → guard triggers
    expect(calculateConfidence(0, 1000, 0, 1000)).toBe(0);
  });

  it('returns 0 when both CRs are 100% (se = 0)', () => {
    // pPool = 1 → se = sqrt(1 * 0 * ...) = 0 → guard triggers
    expect(calculateConfidence(1000, 1000, 1000, 1000)).toBe(0);
  });

  it('returns 0 when CRs are identical (no detectable difference)', () => {
    // Identical 5% CRs → z = 0
    expect(calculateConfidence(50, 1000, 50, 1000)).toBe(0);
  });

  // ── Confidence thresholds (z-table anchors) ───────────────────────────────

  it('returns 99.9 for a massive effect (z ≥ 3.29) at scale', () => {
    // CR_A = 2% (n=10000), CR_B = 5% (n=10000) → z >> 3.29
    expect(calculateConfidence(200, 10000, 500, 10000)).toBe(99.9);
  });

  it('returns ≥ 95 for a clear winner (5% vs 8% CR, n=1000 each)', () => {
    // Clinically meaningful effect with adequate sample → ≥ 95%
    const result = calculateConfidence(50, 1000, 80, 1000);
    expect(result).toBeGreaterThanOrEqual(95);
  });

  it('returns ≥ 90 for a moderate effect at decent sample size', () => {
    // CR_A = 3% (n=1000), CR_B = 5% (n=1000)
    const result = calculateConfidence(30, 1000, 50, 1000);
    expect(result).toBeGreaterThanOrEqual(90);
  });

  it('returns < 95 when the CR difference is marginal at small N', () => {
    // 10% vs 15% CR (subtle difference), n=20 each — z ≈ 0.48 → ~19% confidence
    const result = calculateConfidence(2, 20, 3, 20);
    expect(result).toBeLessThan(95);
  });

  it('returns < 68 for very small / noisy differences', () => {
    // 5% vs 5.5% CR, n=200 each — negligible difference
    const result = calculateConfidence(10, 200, 11, 200);
    expect(result).toBeLessThan(68);
  });

  // ── Symmetry property ─────────────────────────────────────────────────────

  it('is symmetric — swapping A and B gives the same confidence', () => {
    const ab = calculateConfidence(50, 1000, 80, 1000);
    const ba = calculateConfidence(80, 1000, 50, 1000);
    expect(ab).toBe(ba);
  });

  // ── Monotonicity: larger N → more confidence, same CR ratio ──────────────

  it('gains confidence as sample size increases (same CR difference)', () => {
    const small  = calculateConfidence(5, 100, 8, 100);   // CR: 5% vs 8%
    const medium = calculateConfidence(50, 1000, 80, 1000);
    const large  = calculateConfidence(500, 10000, 800, 10000);
    expect(medium).toBeGreaterThanOrEqual(small);
    expect(large).toBeGreaterThanOrEqual(medium);
  });

  // ── Business logic: MIN_CONFIDENCE = 95 ──────────────────────────────────
  it('must reach 95 before auto-declaring a winner (production guard)', () => {
    // Any result below 95 must NOT trigger winner declaration
    const borderline = calculateConfidence(10, 200, 11, 200); // tiny delta
    expect(borderline).toBeLessThan(95);

    // A proper winner signal at scale
    const winner = calculateConfidence(50, 1000, 80, 1000);
    expect(winner).toBeGreaterThanOrEqual(95);
  });
});
