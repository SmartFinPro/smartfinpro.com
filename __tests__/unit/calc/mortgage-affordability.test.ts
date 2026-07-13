// __tests__/unit/calc/mortgage-affordability.test.ts
//
// CA affordability engine test suite (PR 5.1, SPEC per FDL 5.1 brief).
// Vectors grouped by sourceType: official (freshly verified RuleEntries),
// reference (golden fixtures, independently double-computed), invariant
// (mathematical properties).

import { describe, it, expect } from 'vitest';
import { getRule, resolveRuleSnapshot } from '@/lib/rules';
import { computeAffordability, validateAffordabilityInputs } from '@/lib/calc/mortgage/affordability';
import type { AffordabilityInputs } from '@/lib/calc/mortgage/affordability';
import { OFFICIAL_MORTGAGE_RULE_FIXTURES } from './fixtures/mortgage/official';
import { AFFORDABILITY_REFERENCE_FIXTURES } from './fixtures/mortgage/reference';

const RULE_KEYS = [
  'osfiQualifyingRateFloor',
  'gdsThreshold',
  'tdsThreshold',
  'cmhcPremiumLtv65',
  'cmhcPremiumLtv75',
  'cmhcPremiumLtv80',
  'cmhcPremiumLtv85',
  'cmhcPremiumLtv90',
  'cmhcPremiumLtv95',
  'cmhcPremiumLtv95NonTraditional',
];

function caRules(asOf = '2026-07-13') {
  return resolveRuleSnapshot('ca', RULE_KEYS, asOf);
}

// ── official ────────────────────────────────────────────────────────────

describe('affordability engine — official rule fixtures', () => {
  for (const f of OFFICIAL_MORTGAGE_RULE_FIXTURES) {
    it(`${f.name} (${f.source})`, () => {
      expect(getRule(f.market, f.ruleKey, f.asOf)).toBe(f.expectedValue);
    });
  }
});

// ── reference (golden fixtures) ──────────────────────────────────────────

describe('affordability engine — reference (golden) fixtures', () => {
  for (const f of AFFORDABILITY_REFERENCE_FIXTURES) {
    it(`${f.name} — ${f.source}`, () => {
      const rules = caRules();
      const result = computeAffordability(f.inputs, rules);

      expect(result.qualifyingRatePct, 'qualifyingRatePct').toBeCloseTo(f.expected.qualifyingRatePct, 6);
      expect(result.maxPurchasePrice.low, 'low').toBeCloseTo(f.expected.low, 0);
      expect(Math.abs(result.maxPurchasePrice.low - f.expected.low)).toBeLessThanOrEqual(f.tolerance);
      expect(result.maxPurchasePrice.high, 'high').toBeCloseTo(f.expected.high, 0);
      expect(Math.abs(result.maxPurchasePrice.high - f.expected.high)).toBeLessThanOrEqual(f.tolerance);
      expect(result.gdsAtMax, 'gdsAtMax').toBeCloseTo(f.expected.gdsAtMax, 2);
      expect(result.tdsAtMax, 'tdsAtMax').toBeCloseTo(f.expected.tdsAtMax, 2);
      expect(result.cmhc?.required, 'cmhc.required').toBe(f.expected.cmhcRequired);
      expect(result.cmhc?.premiumPct, 'cmhc.premiumPct').toBeCloseTo(f.expected.cmhcPremiumPct, 6);
    });
  }
});

// ── invariants ────────────────────────────────────────────────────────────

const BASE: AffordabilityInputs = {
  grossAnnualIncome: 100000,
  monthlyDebts: 400,
  downPayment: 60000,
  contractRatePct: 4.0,
  termYears: 25,
  monthlyHeatingCost: 100,
  annualPropertyTax: 3000,
  condoFeesMonthly: 0,
};

describe('affordability engine — invariants', () => {
  it('stress test: +2pp contract rate ⇒ maxPurchasePrice.low decreases monotonically', () => {
    const rules = caRules();
    const rates = [3.0, 5.0, 7.0, 9.0];
    const lows = rates.map((contractRatePct) => computeAffordability({ ...BASE, contractRatePct }, rules).maxPurchasePrice.low);
    for (let i = 1; i < lows.length; i++) {
      expect(lows[i]).toBeLessThanOrEqual(lows[i - 1]);
    }
  });

  it('GDS-bound ≤ TDS-bound price when debts > 0 (low = min, high = max, by construction)', () => {
    const rules = caRules();
    const result = computeAffordability(BASE, rules);
    expect(result.maxPurchasePrice.low).toBeLessThanOrEqual(result.maxPurchasePrice.high);
  });

  it('qualifyingRatePct = max(contract + 2, OSFI floor)', () => {
    const rules = caRules();
    const floorPct = rules.values.osfiQualifyingRateFloor * 100;
    const lowRate = computeAffordability({ ...BASE, contractRatePct: 1.0 }, rules); // floor binds
    expect(lowRate.qualifyingRatePct).toBeCloseTo(floorPct, 6);
    const highRate = computeAffordability({ ...BASE, contractRatePct: 8.0 }, rules); // contract+2 binds
    expect(highRate.qualifyingRatePct).toBeCloseTo(10.0, 6);
  });

  it('bisection converges: binding ratio sits at/under threshold, and the bound is sensitive (not degenerate)', () => {
    const rules = caRules();
    const result = computeAffordability(BASE, rules);
    const binding = result.gdsAtMax >= result.tdsAtMax ? 'gds' : 'tds';
    const threshold = binding === 'gds' ? rules.values.gdsThreshold : rules.values.tdsThreshold;
    const atBinding = binding === 'gds' ? result.gdsAtMax : result.tdsAtMax;
    // At the converged low price, the binding ratio must sit at or just under threshold.
    expect(atBinding).toBeLessThanOrEqual(threshold + 0.001);
    expect(atBinding).toBeGreaterThan(threshold - 0.01); // genuinely converged near the boundary, not far below it

    // A meaningfully higher income raises the affordable price — proves the
    // bisection is sensitive to inputs rather than returning a degenerate
    // constant.
    const richerResult = computeAffordability({ ...BASE, grossAnnualIncome: BASE.grossAnnualIncome * 1.5 }, rules);
    expect(richerResult.maxPurchasePrice.low).toBeGreaterThan(result.maxPurchasePrice.low);
  });

  it('GDS/TDS ratios at low are within their thresholds (both constraints satisfied simultaneously)', () => {
    const rules = caRules();
    const result = computeAffordability(BASE, rules);
    expect(result.gdsAtMax).toBeLessThanOrEqual(rules.values.gdsThreshold + 0.001);
    expect(result.tdsAtMax).toBeLessThanOrEqual(rules.values.tdsThreshold + 0.001);
  });

  it('CMHC not required when down payment >= 20% of maxPurchasePrice.low', () => {
    const rules = caRules();
    // Large down payment relative to income-constrained price ⇒ LTV should land <= 80%.
    const result = computeAffordability({ ...BASE, downPayment: 500000, grossAnnualIncome: 300000 }, rules);
    if (result.maxPurchasePrice.low > 0) {
      const ltv = Math.max(0, result.maxPurchasePrice.low - 500000) / result.maxPurchasePrice.low;
      if (ltv <= 0.80) {
        expect(result.cmhc?.required).toBe(false);
        expect(result.cmhc?.premiumAmount).toBe(0);
      }
    }
  });

  it('riskBuffer.paymentAtQualifying >= riskBuffer.paymentAtContract (qualifying rate is always the stress-tested, higher-or-equal rate)', () => {
    const rules = caRules();
    const result = computeAffordability(BASE, rules);
    expect(result.riskBuffer.paymentAtQualifying).toBeGreaterThanOrEqual(result.riskBuffer.paymentAtContract);
  });

  it('validateAffordabilityInputs rejects non-positive income/termYears and negative debts/downPayment/rate', () => {
    expect(() => validateAffordabilityInputs({ ...BASE, grossAnnualIncome: 0 })).toThrow(TypeError);
    expect(() => validateAffordabilityInputs({ ...BASE, termYears: 0 })).toThrow(TypeError);
    expect(() => validateAffordabilityInputs({ ...BASE, monthlyDebts: -1 })).toThrow(TypeError);
    expect(() => validateAffordabilityInputs({ ...BASE, downPayment: -1 })).toThrow(TypeError);
    expect(() => validateAffordabilityInputs({ ...BASE, contractRatePct: -1 })).toThrow(TypeError);
  });
});
