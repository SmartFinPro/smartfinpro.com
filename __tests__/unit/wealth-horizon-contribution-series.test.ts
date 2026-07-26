// __tests__/unit/wealth-horizon-contribution-series.test.ts
// Wealth Horizon v3 signature visual — the stacked "contribution vs growth"
// bar chart needs, per projection year, how much of the balance is money the
// user (and employer) put in vs. investment growth. This is a UI-only SPLIT
// of an already-engine-computed balance (never a second balance calculation
// — `balance` always comes straight from the engine's own accumulation
// rows); only the contributions half is computed here, linearly, from the
// starting amount + monthly contribution rate.

import { describe, it, expect } from 'vitest';
import { buildContributionGrowthSeries } from '@/lib/tools/results/wealth-horizon-contribution-series';

describe('buildContributionGrowthSeries()', () => {
  const rows = [
    { age: 30, balance: 25_000 },
    { age: 31, balance: 30_400 },
    { age: 32, balance: 36_000 },
  ];

  it('contributions accumulate linearly from the starting amount at the monthly rate', () => {
    const series = buildContributionGrowthSeries(rows, 30, 25_000, 400);
    expect(series[0].contributions).toBe(25_000); // age 30 = currentAge → zero elapsed years
    expect(series[1].contributions).toBe(25_000 + 400 * 12); // + 1 year of contributions
    expect(series[2].contributions).toBe(25_000 + 400 * 12 * 2);
  });

  it('growth = balance − contributions, and balance passes through unchanged (no second calc path)', () => {
    const series = buildContributionGrowthSeries(rows, 30, 25_000, 400);
    for (const point of series) {
      const row = rows.find((r) => r.age === point.age)!;
      expect(point.balance).toBe(row.balance);
      expect(point.growth).toBeCloseTo(row.balance - point.contributions, 6);
    }
  });

  it('never draws negative growth — floors at 0 even if contributions exceed balance', () => {
    const series = buildContributionGrowthSeries(
      [{ age: 30, balance: 100 }],
      30,
      25_000, // starting amount alone already exceeds the (unrealistic) balance
      400,
    );
    expect(series[0].growth).toBe(0);
  });

  it('empty rows returns an empty series without throwing', () => {
    expect(buildContributionGrowthSeries([], 30, 25_000, 400)).toEqual([]);
  });

  it('zero monthly contribution still tracks the starting amount as a flat contributions floor', () => {
    const series = buildContributionGrowthSeries(rows, 30, 25_000, 0);
    for (const point of series) expect(point.contributions).toBe(25_000);
  });
});
