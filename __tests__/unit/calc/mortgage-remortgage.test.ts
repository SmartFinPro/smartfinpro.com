// __tests__/unit/calc/mortgage-remortgage.test.ts
//
// UK remortgage engine test suite (PR 5.1). Vectors grouped by sourceType:
// reference (golden fixtures, independently double-computed) and invariant
// (mathematical properties). UK has one editable-default RuleEntry
// (remortgageArrangementFeeDefault, lib/rules/uk.ts) — it is a UI/prefill
// concern, not consumed by this pure engine (fees is a direct required
// input), so no 'official' fixture group is needed here.

import { describe, it, expect } from 'vitest';
import { compareRemortgage, validateRemortgageInputs } from '@/lib/calc/mortgage/remortgage';
import type { RemortgageInputs } from '@/lib/calc/mortgage/remortgage';
import { REMORTGAGE_REFERENCE_FIXTURES } from './fixtures/mortgage/reference';

// ── reference (golden fixtures) ──────────────────────────────────────────

describe('remortgage engine — reference (golden) fixtures', () => {
  for (const f of REMORTGAGE_REFERENCE_FIXTURES) {
    it(`${f.name} — ${f.source}`, () => {
      const result = compareRemortgage(f.inputs);
      expect(result.monthlySavings, 'monthlySavings').toBeCloseTo(f.expected.monthlySavings, 1);
      expect(Math.abs(result.monthlySavings - f.expected.monthlySavings)).toBeLessThanOrEqual(f.tolerance);
      expect(result.totalInterestCurrentDeal, 'totalInterestCurrentDeal').toBeCloseTo(f.expected.totalInterestCurrentDeal, 1);
      expect(result.totalInterestOfferDeal, 'totalInterestOfferDeal').toBeCloseTo(f.expected.totalInterestOfferDeal, 1);
      expect(result.breakEvenMonths, 'breakEvenMonths').toBe(f.expected.breakEvenMonths);
      expect(result.netSavingsOverDeal, 'netSavingsOverDeal').toBeCloseTo(f.expected.netSavingsOverDeal, 1);
    });
  }
});

// ── invariants ────────────────────────────────────────────────────────────

const BASE: RemortgageInputs = {
  currentBalance: 180000,
  currentRatePct: 5.0,
  remainingTermYears: 18,
  offerRatePct: 3.8,
  offerDealYears: 5,
  fees: 999,
};

describe('remortgage engine — invariants', () => {
  it('breakEvenMonths is null when monthlySavings <= 0', () => {
    const worseOffer = compareRemortgage({ ...BASE, offerRatePct: BASE.currentRatePct + 1 });
    expect(worseOffer.monthlySavings).toBeLessThanOrEqual(0);
    expect(worseOffer.breakEvenMonths).toBeNull();
  });

  it('breakEvenMonths is null at exactly zero savings (offer rate == current rate)', () => {
    const zeroSavings = compareRemortgage({ ...BASE, offerRatePct: BASE.currentRatePct });
    expect(zeroSavings.monthlySavings).toBeCloseTo(0, 6);
    expect(zeroSavings.breakEvenMonths).toBeNull();
  });

  it('fees = 0 ⇒ breakEvenMonths is 0 or 1 (positive savings case)', () => {
    const result = compareRemortgage({ ...BASE, fees: 0 });
    expect(result.monthlySavings).toBeGreaterThan(0);
    expect([0, 1]).toContain(result.breakEvenMonths);
  });

  it('breakEvenMonths = ceil(fees / monthlySavings) exactly', () => {
    const result = compareRemortgage(BASE);
    expect(result.monthlySavings).toBeGreaterThan(0);
    expect(result.breakEvenMonths).toBe(Math.ceil(BASE.fees / result.monthlySavings));
  });

  it('lower offer rate never yields less total interest saved (monotonicity of savings in rate spread)', () => {
    const offers = [4.5, 4.0, 3.5, 3.0];
    const savings = offers.map((offerRatePct) => compareRemortgage({ ...BASE, offerRatePct }).monthlySavings);
    for (let i = 1; i < savings.length; i++) {
      expect(savings[i]).toBeGreaterThanOrEqual(savings[i - 1]);
    }
  });

  it('netSavingsOverDeal = monthlySavings × dealMonths − fees', () => {
    const result = compareRemortgage(BASE);
    const dealMonths = Math.min(Math.round(BASE.offerDealYears * 12), Math.round(BASE.remainingTermYears * 12));
    expect(result.netSavingsOverDeal).toBeCloseTo(result.monthlySavings * dealMonths - BASE.fees, 1);
  });

  it('validateRemortgageInputs rejects non-positive balance/term/dealYears and negative rate/fees', () => {
    expect(() => validateRemortgageInputs({ ...BASE, currentBalance: 0 })).toThrow(TypeError);
    expect(() => validateRemortgageInputs({ ...BASE, remainingTermYears: 0 })).toThrow(TypeError);
    expect(() => validateRemortgageInputs({ ...BASE, offerDealYears: 0 })).toThrow(TypeError);
    expect(() => validateRemortgageInputs({ ...BASE, currentRatePct: -1 })).toThrow(TypeError);
    expect(() => validateRemortgageInputs({ ...BASE, offerRatePct: -1 })).toThrow(TypeError);
    expect(() => validateRemortgageInputs({ ...BASE, fees: -1 })).toThrow(TypeError);
  });
});
