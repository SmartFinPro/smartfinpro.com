// __tests__/unit/cockpit-cost-monthly-plus-setup.test.ts
// Slice 5 (Credit Repair): new pure CostModel `monthly-plus-setup` —
// total cost = one-time setup fee + monthly fee × months in program. The
// generic `amount` slider is repurposed as a MONTHS dial for this kind only;
// `years` is unused (mirrors how `fee-on-amount` leaves `years` unused).
// Plus regression pins for all 3 existing kinds (goldens captured before this
// change, matching the pattern from cockpit-cost-fee-on-amount.test.ts).

import { describe, expect, it } from 'vitest';
import { costOverTime } from '@/lib/comparison/cost';
import type { CostModelDef } from '@/lib/comparison/topics/types';

const sliders = {
  amountLabel: 'Months in program',
  amountMin: 3,
  amountMax: 12,
  amountStep: 1,
  amountDefault: 6,
  yearsLabel: 'Unused',
  yearsMin: 1,
  yearsMax: 1,
  yearsDefault: 1,
};
const noFees = { managementFee: 0, fxFeePct: 0, atmFee: 0, attributes: {} };

describe('costOverTime — monthly-plus-setup (credit repair)', () => {
  const model: CostModelDef = { kind: 'monthly-plus-setup', ...sliders };

  it('charges setupFee + monthlyFee × months', () => {
    // Credit Firm: $0 setup + $49.99/mo × 6 = $300 (299.94 rounds to 300)
    expect(costOverTime({ ...noFees, monthlyFee: 49.99 }, model, { amount: 6, years: 1 })).toBe(300);
    // The Credit People: $19 setup + $99/mo × 6 = $613
    const withSetup: CostModelDef = {
      ...model,
      setupFeeAccessor: (p) => (typeof p.attributes?.setup_fee === 'number' ? p.attributes.setup_fee : null),
    };
    expect(
      costOverTime({ ...noFees, monthlyFee: 99, attributes: { setup_fee: 19 } }, withSetup, { amount: 6, years: 1 }),
    ).toBe(613);
  });

  it('scales linearly with months (no compounding, no discount)', () => {
    const p = { ...noFees, monthlyFee: 79.99 };
    expect(costOverTime(p, model, { amount: 3, years: 1 })).toBe(240); // 79.99*3=239.97
    expect(costOverTime(p, model, { amount: 12, years: 1 })).toBe(960); // 79.99*12=959.88
  });

  it('is independent of years (no years dimension for this kind)', () => {
    const p = { ...noFees, monthlyFee: 99 };
    const at = (years: number) => costOverTime(p, model, { amount: 6, years });
    expect(at(1)).toBe(at(1)); // trivially — but assert years is never read at all
    expect(costOverTime(p, { ...model, yearsMin: 1, yearsMax: 30 }, { amount: 6, years: 30 })).toBe(
      costOverTime(p, model, { amount: 6, years: 1 }),
    );
  });

  it('defaults setupFeeAccessor to 0 when omitted (no bare-$0-looking gap for missing setup data)', () => {
    expect(costOverTime({ ...noFees, monthlyFee: 98 }, model, { amount: 6, years: 1 })).toBe(588);
  });

  it('setupFeeAccessor returning null falls back to 0, not an error', () => {
    const withNullableSetup: CostModelDef = {
      ...model,
      setupFeeAccessor: () => null,
    };
    expect(costOverTime({ ...noFees, monthlyFee: 98 }, withNullableSetup, { amount: 6, years: 1 })).toBe(588);
  });
});

describe('costOverTime — regression pins (existing 3 kinds unchanged after adding monthly-plus-setup)', () => {
  const base = { amountLabel: 'x', amountMin: 0, amountMax: 1, amountStep: 1, amountDefault: 0, yearsLabel: 'y', yearsMin: 1, yearsMax: 30, yearsDefault: 10 };
  const noMonthly = { monthlyFee: 0, fxFeePct: 0, atmFee: 0, attributes: {} };

  it('compounding-fee unchanged', () => {
    const model: CostModelDef = { kind: 'compounding-fee', growthRate: 0.06, ...base };
    expect(costOverTime({ managementFee: 0.25, ...noMonthly }, model, { amount: 100_000, years: 10 })).toBe(3_450);
    expect(costOverTime({ managementFee: 0.4, ...noMonthly }, model, { amount: 50_000, years: 5 })).toBe(1_185);
  });

  it('banking unchanged (annualCost × years)', () => {
    const model: CostModelDef = { kind: 'banking', ...base };
    expect(
      costOverTime({ managementFee: 0, monthlyFee: 10, fxFeePct: 1, atmFee: 2, attributes: {} }, model, {
        amount: 500,
        years: 3,
      }),
    ).toBe(828);
  });

  it('fee-on-amount unchanged', () => {
    const model: CostModelDef = { kind: 'fee-on-amount', ...base };
    expect(costOverTime({ managementFee: 21.5, ...noMonthly }, model, { amount: 10_000, years: 3 })).toBe(2_150);
    expect(costOverTime({ managementFee: 18, ...noMonthly }, model, { amount: 25_000, years: 3 })).toBe(4_500);
  });
});
