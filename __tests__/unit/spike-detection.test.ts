// __tests__/unit/spike-detection.test.ts
// Tests the spike detection logic as implemented in lib/actions/spike-monitor.ts
//
// The core detection algorithm is a pure calculation: compare recent clicks
// against a 7-day rolling hourly average with a configurable multiplier.
// Constants and logic are inlined here verbatim for isolation.

import { describe, it, expect } from 'vitest';

// ── Inlined from lib/actions/spike-monitor.ts ─────────────────────────────
const SPIKE_MULTIPLIER   = 3.0;
const MIN_CLICKS_THRESHOLD = 5;
const HOURS_IN_WEEK      = 168;

/**
 * Determines whether a traffic spike is detected for a slug.
 * Mirrors the inner logic of runSpikeMonitor() step 6.
 */
function detectSpike(
  recentClicks: number,
  weeklyTotal: number,
): { isSpike: boolean; multiplier: number; avgHourly: number } {
  if (recentClicks < MIN_CLICKS_THRESHOLD) {
    return { isSpike: false, multiplier: 0, avgHourly: 0 };
  }

  const avgHourly = weeklyTotal / HOURS_IN_WEEK;
  const safeAvg   = Math.max(avgHourly, 0.5); // prevent near-zero division
  const multiplier = recentClicks / safeAvg;

  return {
    isSpike:    multiplier >= SPIKE_MULTIPLIER,
    multiplier,
    avgHourly,
  };
}
// ─────────────────────────────────────────────────────────────────────────────

describe('detectSpike() — CTA traffic spike detection', () => {
  // ── Minimum clicks gate ───────────────────────────────────────────────────

  it('never fires when recent clicks are below MIN_CLICKS_THRESHOLD (5)', () => {
    expect(detectSpike(0, 0).isSpike).toBe(false);
    expect(detectSpike(1, 0).isSpike).toBe(false);
    expect(detectSpike(4, 0).isSpike).toBe(false);
  });

  it('may fire when recent clicks equal MIN_CLICKS_THRESHOLD exactly', () => {
    // 5 clicks with zero history → safeAvg=0.5 → multiplier=10 → spike
    const result = detectSpike(5, 0);
    expect(result.isSpike).toBe(true);
  });

  // ── SPIKE_MULTIPLIER = 3.0 threshold ─────────────────────────────────────

  it('triggers at exactly 3× the hourly average', () => {
    // avgHourly = 2 (336 clicks in 7d), recent = 6 → mult = 3.0 → spike
    const result = detectSpike(6, 336);
    expect(result.isSpike).toBe(true);
    expect(result.multiplier).toBeCloseTo(3.0, 1);
  });

  it('does NOT trigger at just below 3× (multiplier = 2.9)', () => {
    // avgHourly = 2, recent = 5.8 → but we need integers
    // avgHourly = 2 (336), recent = 5 → mult = 2.5 < 3.0
    const result = detectSpike(5, 336);
    expect(result.isSpike).toBe(false);
    expect(result.multiplier).toBeLessThan(SPIKE_MULTIPLIER);
  });

  it('triggers with a strong spike (10× normal traffic)', () => {
    // avgHourly = 1, recent = 10 → mult = 10 → spike
    const result = detectSpike(10, 168);
    expect(result.isSpike).toBe(true);
    expect(result.multiplier).toBeCloseTo(10, 0);
  });

  // ── safeAvg prevents division by zero ────────────────────────────────────

  it('uses safeAvg = 0.5 when there is zero historical data', () => {
    const result = detectSpike(5, 0);
    expect(result.multiplier).toBe(10); // 5 / 0.5 = 10
  });

  it('uses safeAvg = 0.5 for a new slug receiving its first traffic', () => {
    // A brand-new slug with 0 weekly history and 20 recent clicks
    const result = detectSpike(20, 0);
    expect(result.isSpike).toBe(true);
    expect(result.multiplier).toBe(40); // 20 / 0.5 = 40
  });

  it('uses actual avgHourly when history > 0.5/hr threshold', () => {
    // 168 clicks in 7d → avgHourly = 1.0, safeAvg = max(1.0, 0.5) = 1.0
    const result = detectSpike(10, 168);
    expect(result.avgHourly).toBeCloseTo(1.0, 5);
    expect(result.multiplier).toBeCloseTo(10, 1);
  });

  // ── HOURS_IN_WEEK constant ────────────────────────────────────────────────

  it('correctly computes 7-day hourly average (HOURS_IN_WEEK = 168)', () => {
    // 840 clicks in 7d → avgHourly = 5, safeAvg = 5
    const result = detectSpike(20, 840);
    expect(result.avgHourly).toBeCloseTo(5.0, 5);
    expect(result.multiplier).toBeCloseTo(4.0, 1); // 20 / 5 = 4 → spike
    expect(result.isSpike).toBe(true);
  });

  // ── Real-world scenarios ──────────────────────────────────────────────────

  it('handles a normal traffic day with no spike', () => {
    // avgHourly = 5/hr (840 in 7d), recent = 8 → mult = 1.6 → no spike
    const result = detectSpike(8, 840);
    expect(result.isSpike).toBe(false);
    expect(result.multiplier).toBeLessThan(SPIKE_MULTIPLIER);
  });

  it('handles a viral article scenario (50× spike)', () => {
    // avgHourly = 0.5/hr (84 in 7d), recent = 100 → mult = 200 → major spike
    const result = detectSpike(100, 84);
    expect(result.isSpike).toBe(true);
    expect(result.multiplier).toBeGreaterThan(50);
  });
});
