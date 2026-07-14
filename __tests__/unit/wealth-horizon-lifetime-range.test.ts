// __tests__/unit/wealth-horizon-lifetime-range.test.ts
// Wealth Horizon v4 — pure constraint function backing the two-handle
// lifetime-range slider (components/tools/wealth-horizon/lifetime-range.tsx).
// retirement ≥ today + 1 is enforced by stopping the MOVED handle at the
// other one; the un-moved value is never itself clamped.

import { describe, it, expect } from 'vitest';
import {
  constrainLifetime,
  LIFETIME_TODAY_MIN,
  LIFETIME_TODAY_MAX,
  LIFETIME_RETIREMENT_MIN,
  LIFETIME_RETIREMENT_MAX,
} from '@/components/tools/wealth-horizon/lifetime-range';

describe('constrainLifetime', () => {
  it('passes through a normal move within bounds unaffected', () => {
    expect(constrainLifetime(32, 65, 'today')).toEqual({ today: 32, retirement: 65 });
    expect(constrainLifetime(32, 68, 'retirement')).toEqual({ today: 32, retirement: 68 });
  });

  it('today max = retirement − 1: dragging today past retirement stops at retirement − 1, never crossing', () => {
    // End key on "today" jumps to the input's own max (70) first.
    const result = constrainLifetime(70, 65, 'today');
    expect(result.today).toBe(64);
    expect(result.retirement).toBe(65); // untouched
    expect(result.today).toBeLessThan(result.retirement);
  });

  it('retirement min = today + 1: dragging retirement below today stops at today + 1, never crossing', () => {
    // Home key on "retirement" jumps to the input's own min (45) first.
    const result = constrainLifetime(50, 45, 'retirement');
    expect(result.retirement).toBe(51);
    expect(result.today).toBe(50); // untouched
    expect(result.retirement).toBeGreaterThan(result.today);
  });

  it("today's own absolute bounds [18, 70] still apply before the cross-handle stop", () => {
    expect(constrainLifetime(10, 65, 'today').today).toBe(LIFETIME_TODAY_MIN);
    expect(constrainLifetime(75, 80, 'today').today).toBe(LIFETIME_TODAY_MAX);
  });

  it("retirement's own absolute bounds [45, 80] still apply before the cross-handle stop", () => {
    expect(constrainLifetime(20, 30, 'retirement').retirement).toBe(LIFETIME_RETIREMENT_MIN);
    expect(constrainLifetime(20, 90, 'retirement').retirement).toBe(LIFETIME_RETIREMENT_MAX);
  });

  it('adjacent values (retirement = today + 1) are stable and never invert', () => {
    expect(constrainLifetime(64, 65, 'today')).toEqual({ today: 64, retirement: 65 });
    expect(constrainLifetime(64, 65, 'retirement')).toEqual({ today: 64, retirement: 65 });
  });
});
