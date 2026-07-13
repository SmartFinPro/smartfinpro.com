// __tests__/unit/calc/mortgage-repayment.test.ts
//
// AU repayment engine test suite (PR 5.1). Vectors grouped by sourceType:
// reference (golden fixtures, independently double-computed) and invariant
// (mathematical properties). AU has no regulatory RuleEntry inputs in v1
// (rate is a direct user input, per the FDL 5.1 brief) — no 'official'
// group here.

import { describe, it, expect } from 'vitest';
import { computeRepayment, validateRepaymentInputs } from '@/lib/calc/mortgage/repayment';
import type { RepaymentInputs } from '@/lib/calc/mortgage/repayment';
import { REPAYMENT_REFERENCE_FIXTURES } from './fixtures/mortgage/reference';

// ── reference (golden fixtures) ──────────────────────────────────────────

describe('repayment engine — reference (golden) fixtures', () => {
  for (const f of REPAYMENT_REFERENCE_FIXTURES) {
    it(`${f.name} — ${f.source}`, () => {
      const result = computeRepayment(f.inputs);
      expect(result.monthlyPayment, 'monthlyPayment').toBeCloseTo(f.expected.monthlyPayment, 1);
      expect(Math.abs(result.monthlyPayment - f.expected.monthlyPayment)).toBeLessThanOrEqual(f.tolerance);
      expect(result.totalInterest, 'totalInterest').toBeCloseTo(f.expected.totalInterest, 1);
      expect(Math.abs(result.totalInterest - f.expected.totalInterest)).toBeLessThanOrEqual(f.tolerance);
      expect(result.months, 'months').toBe(f.expected.months);
      if (f.expected.offsetSavings) {
        expect(result.offsetSavings, 'offsetSavings').toBeDefined();
        expect(result.offsetSavings!.interestSaved).toBeCloseTo(f.expected.offsetSavings.interestSaved, 1);
        expect(result.offsetSavings!.monthsSaved).toBe(f.expected.offsetSavings.monthsSaved);
      }
    });
  }
});

// ── invariants ────────────────────────────────────────────────────────────

const BASE: RepaymentInputs = { principal: 350000, annualRatePct: 5.5, termYears: 30 };

describe('repayment engine — invariants', () => {
  it('rate 0 ⇒ payment = P/n and totalInterest = 0 (Grenzfall)', () => {
    const inputs: RepaymentInputs = { principal: 240000, annualRatePct: 0, termYears: 20 };
    const result = computeRepayment(inputs);
    expect(result.monthlyPayment).toBeCloseTo(240000 / (20 * 12), 6);
    expect(result.totalInterest).toBe(0);
    expect(result.months).toBe(20 * 12);
  });

  it('offset monotonicity — more offset never increases interest or months', () => {
    const offsets = [0, 20000, 60000, 120000];
    const results = offsets.map((offsetBalance) => computeRepayment({ ...BASE, offsetBalance }));
    for (let i = 1; i < results.length; i++) {
      expect(results[i].totalInterest).toBeLessThanOrEqual(results[i - 1].totalInterest);
      expect(results[i].months).toBeLessThanOrEqual(results[i - 1].months);
    }
  });

  it('offset never changes the fixed monthly payment amount', () => {
    const noOffset = computeRepayment(BASE);
    const withOffset = computeRepayment({ ...BASE, offsetBalance: 80000 });
    expect(withOffset.monthlyPayment).toBeCloseTo(noOffset.monthlyPayment, 6);
  });

  it('offsetBalance = 0 behaves identically to no offset at all', () => {
    const noOffset = computeRepayment(BASE);
    const zeroOffset = computeRepayment({ ...BASE, offsetBalance: 0 });
    expect(zeroOffset.totalInterest).toBeCloseTo(noOffset.totalInterest, 6);
    expect(zeroOffset.months).toBe(noOffset.months);
    // offsetSavings IS populated when the field is explicitly passed (even as 0) —
    // the signal is "offsetBalance was provided", not "offsetBalance > 0".
    expect(zeroOffset.offsetSavings).toEqual({ interestSaved: 0, monthsSaved: 0 });
    expect(noOffset.offsetSavings).toBeUndefined();
  });

  it('schedule length matches months and ends at (approximately) zero remaining', () => {
    const result = computeRepayment(BASE);
    expect(result.schedule).toHaveLength(result.months);
    expect(result.schedule[result.schedule.length - 1].remaining).toBeCloseTo(0, 1);
  });

  it('validateRepaymentInputs rejects non-positive principal/termYears and negative rate', () => {
    expect(() => validateRepaymentInputs({ principal: 0, annualRatePct: 5, termYears: 30 })).toThrow(TypeError);
    expect(() => validateRepaymentInputs({ principal: 100000, annualRatePct: -1, termYears: 30 })).toThrow(TypeError);
    expect(() => validateRepaymentInputs({ principal: 100000, annualRatePct: 5, termYears: 0 })).toThrow(TypeError);
    expect(() =>
      validateRepaymentInputs({ principal: 100000, annualRatePct: 5, termYears: 30, offsetBalance: -1 }),
    ).toThrow(TypeError);
  });
});
