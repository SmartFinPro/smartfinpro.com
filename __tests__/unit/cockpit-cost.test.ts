import { describe, expect, it } from 'vitest';
import { costOverTime } from '@/lib/comparison/cost';
import type { CostModelDef } from '@/lib/comparison/topics/types';
import type { ProductForComparison } from '@/lib/comparison/types';

const robo: CostModelDef = {
  kind: 'compounding-fee',
  growthRate: 0.06,
  amountLabel: 'Amount',
  amountMin: 0,
  amountMax: 1_000_000,
  amountStep: 5000,
  amountDefault: 100_000,
  yearsLabel: 'Years',
  yearsMin: 1,
  yearsMax: 30,
  yearsDefault: 10,
};

const p = (managementFee: number) => ({ managementFee }) as ProductForComparison;

describe('costOverTime — compounding management fee', () => {
  it('charges the annual management fee on the growing balance each year', () => {
    const c = costOverTime(p(0.25), robo, { amount: 100_000, years: 10 });
    // ~$3,450: 0.25% charged on a balance that grows ~6%/yr for 10 years.
    expect(c).toBeGreaterThan(3000);
    expect(c).toBeLessThan(4000);
  });

  it('is zero when the fee is zero', () => {
    expect(costOverTime(p(0), robo, { amount: 100_000, years: 10 })).toBe(0);
  });

  it('grows monotonically with the fee', () => {
    const a = costOverTime(p(0.25), robo, { amount: 100_000, years: 10 });
    const b = costOverTime(p(0.4), robo, { amount: 100_000, years: 10 });
    expect(b).toBeGreaterThan(a);
  });

  it('grows monotonically with the horizon', () => {
    const ten = costOverTime(p(0.25), robo, { amount: 100_000, years: 10 });
    const twenty = costOverTime(p(0.25), robo, { amount: 100_000, years: 20 });
    expect(twenty).toBeGreaterThan(ten);
  });
});
