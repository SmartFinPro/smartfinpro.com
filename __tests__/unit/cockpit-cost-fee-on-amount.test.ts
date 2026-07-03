// __tests__/unit/cockpit-cost-fee-on-amount.test.ts
// Slice 1 (Debt-Relief): neues pures CostModel `fee-on-amount` —
// Gesamtkosten = fee% × eingeschriebener Betrag, unabhängig von der Laufzeit.
// Plus Regressions-Pins für die bestehenden Kinds (Goldens vor der Änderung
// eingefangen: compounding 0.25/100k/10y=3450 · 0.4/50k/5y=1185 · banking=828).

import { describe, expect, it } from 'vitest';
import { costOverTime } from '@/lib/comparison/cost';
import type { CostModelDef } from '@/lib/comparison/topics/types';

const sliders = {
  amountLabel: 'Enrolled debt',
  amountMin: 5_000,
  amountMax: 100_000,
  amountStep: 1_000,
  amountDefault: 20_000,
  yearsLabel: 'Program length (years)',
  yearsMin: 2,
  yearsMax: 4,
  yearsDefault: 3,
};
const noFees = { monthlyFee: 0, fxFeePct: 0, atmFee: 0, attributes: {} };

describe('costOverTime — fee-on-amount (debt-relief)', () => {
  const model: CostModelDef = { kind: 'fee-on-amount', ...sliders };

  it('charges fee% × amount', () => {
    expect(costOverTime({ managementFee: 21.5, ...noFees }, model, { amount: 10_000, years: 3 })).toBe(2_150);
    expect(costOverTime({ managementFee: 18, ...noFees }, model, { amount: 25_000, years: 3 })).toBe(4_500);
  });

  it('is independent of years (fee is a one-time % of enrolled debt)', () => {
    const p = { managementFee: 21.5, ...noFees };
    const at = (years: number) => costOverTime(p, model, { amount: 10_000, years });
    expect(at(2)).toBe(at(4));
    expect(at(1)).toBe(2_150);
  });

  it('returns 0 for zero or missing fee', () => {
    expect(costOverTime({ managementFee: 0, ...noFees }, model, { amount: 10_000, years: 3 })).toBe(0);
    expect(
      costOverTime({ managementFee: null as unknown as number, ...noFees }, model, { amount: 10_000, years: 3 }),
    ).toBe(0);
  });

  it('prefers feeAccessor over managementFee, falls back when accessor yields null', () => {
    const withAccessor: CostModelDef = {
      ...model,
      feeAccessor: (p) => (typeof p.attributes?.fee_pct_mid === 'number' ? p.attributes.fee_pct_mid : null),
    };
    expect(
      costOverTime({ managementFee: 99, ...noFees, attributes: { fee_pct_mid: 20 } }, withAccessor, {
        amount: 10_000,
        years: 3,
      }),
    ).toBe(2_000);
    expect(
      costOverTime({ managementFee: 10, ...noFees, attributes: {} }, withAccessor, { amount: 10_000, years: 3 }),
    ).toBe(1_000);
  });

  it('flatFeeAccessor overrides fee%×amount with a fixed dollar total (non-profit DMP, not a % of debt)', () => {
    const withFlatFee: CostModelDef = {
      ...model,
      flatFeeAccessor: (p) =>
        typeof p.attributes?.dmp_flat_total === 'number' ? p.attributes.dmp_flat_total : null,
    };
    // GreenPath-style: managementFee is 0 (no % fee), but the real cost is
    // ~$35 setup + $31/mo x 48mo = $1,523 — never a false $0.
    expect(
      costOverTime({ managementFee: 0, ...noFees, attributes: { dmp_flat_total: 1_523 } }, withFlatFee, {
        amount: 20_000,
        years: 3,
      }),
    ).toBe(1_523);
    // The flat total must NOT scale with the amount slider — it's a fixed cost.
    expect(
      costOverTime({ managementFee: 0, ...noFees, attributes: { dmp_flat_total: 1_523 } }, withFlatFee, {
        amount: 80_000,
        years: 3,
      }),
    ).toBe(1_523);
    // Rows without a flat total fall through to the normal fee%×amount path.
    expect(
      costOverTime({ managementFee: 20, ...noFees, attributes: {} }, withFlatFee, { amount: 10_000, years: 3 }),
    ).toBe(2_000);
  });
});

describe('costOverTime — regression pins (bestehende Kinds unverändert)', () => {
  const base = { ...sliders, yearsMin: 1, yearsMax: 30, yearsDefault: 10 };

  it('compounding-fee liefert die Vorher-Goldens', () => {
    const model: CostModelDef = { kind: 'compounding-fee', growthRate: 0.06, ...base };
    expect(costOverTime({ managementFee: 0.25, ...noFees }, model, { amount: 100_000, years: 10 })).toBe(3_450);
    expect(costOverTime({ managementFee: 0.4, ...noFees }, model, { amount: 50_000, years: 5 })).toBe(1_185);
  });

  it('banking liefert den Vorher-Golden (annualCost × years)', () => {
    const model: CostModelDef = { kind: 'banking', ...base };
    expect(
      costOverTime({ managementFee: 0, monthlyFee: 10, fxFeePct: 1, atmFee: 2, attributes: {} }, model, {
        amount: 500,
        years: 3,
      }),
    ).toBe(828);
  });
});
