// __tests__/unit/count-up.test.ts
// Pure easing/interpolation helpers behind the Wealth Horizon v3 hero
// count-up animation (components/tools/wealth-horizon/wealth-horizon-live.tsx).
// The requestAnimationFrame loop itself is imperative and lives in the
// component; only the pure math is unit-tested here.

import { describe, it, expect } from 'vitest';
import { easeOutCubic, interpolateCountUp } from '@/lib/tools/count-up';

describe('easeOutCubic()', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('is monotonically non-decreasing across the domain', () => {
    let prev = -Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
      const v = easeOutCubic(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('clamps progress outside [0,1]', () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });

  it('decelerates — the back half of the animation covers less distance than the front half', () => {
    const firstHalf = easeOutCubic(0.5) - easeOutCubic(0);
    const secondHalf = easeOutCubic(1) - easeOutCubic(0.5);
    expect(firstHalf).toBeGreaterThan(secondHalf);
  });
});

describe('interpolateCountUp()', () => {
  it('returns `from` at progress 0 and `to` at progress 1', () => {
    expect(interpolateCountUp(100, 500, 0)).toBe(100);
    expect(interpolateCountUp(100, 500, 1)).toBe(500);
  });

  it('handles from === to without NaN', () => {
    expect(interpolateCountUp(250, 250, 0.5)).toBe(250);
  });

  it('handles a decreasing target (from > to)', () => {
    const mid = interpolateCountUp(1000, 200, 0.5);
    expect(mid).toBeLessThan(1000);
    expect(mid).toBeGreaterThan(200);
  });

  it('never overshoots the target for any progress in [0,1]', () => {
    for (let p = 0; p <= 1; p += 0.1) {
      const v = interpolateCountUp(0, 1000, p);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1000);
    }
  });
});
