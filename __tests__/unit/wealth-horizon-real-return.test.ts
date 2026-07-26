// __tests__/unit/wealth-horizon-real-return.test.ts
// Wealth Horizon v3 DESIGN-DIREKTIVE — "Rendite→Engine (Vertrags-konform)":
// the engine stays REAL and UNTOUCHED; the UI computes
// realPct = returnNominalPct − inflationPct (documented approximation) and
// hands the engine a CLONED RuleSnapshot with realReturnBase/Conservative/
// Optimistic overridden (±1.5pp editorial spread), clamped to [0.5, 8].

import { describe, it, expect } from 'vitest';
import { resolveRuleSnapshot } from '@/lib/rules';
import {
  buildRealReturnRuleSnapshot,
  computeClampedRealReturn,
  REAL_RETURN_CLAMP_MAX,
  REAL_RETURN_CLAMP_MIN,
  REAL_RETURN_SCENARIO_SPREAD_PCT,
} from '@/lib/tools/results/wealth-horizon-real-return';

describe('computeClampedRealReturn()', () => {
  it('subtracts inflation from the nominal return (documented approximation)', () => {
    const clamp = computeClampedRealReturn(7.5, 2.5);
    expect(clamp.rawRealPct).toBe(5.0);
    expect(clamp.realPct).toBe(5.0);
    expect(clamp.clamped).toBe(false);
  });

  it('clamps below the floor and flags it', () => {
    const clamp = computeClampedRealReturn(2, 3); // raw = -1
    expect(clamp.rawRealPct).toBe(-1);
    expect(clamp.realPct).toBe(REAL_RETURN_CLAMP_MIN);
    expect(clamp.clamped).toBe(true);
  });

  it('clamps above the ceiling and flags it', () => {
    const clamp = computeClampedRealReturn(15, 0); // raw = 15
    expect(clamp.rawRealPct).toBe(15);
    expect(clamp.realPct).toBe(REAL_RETURN_CLAMP_MAX);
    expect(clamp.clamped).toBe(true);
  });

  it('boundary values are NOT flagged as clamped (inclusive range)', () => {
    expect(computeClampedRealReturn(0.5, 0).clamped).toBe(false);
    expect(computeClampedRealReturn(8, 0).clamped).toBe(false);
  });
});

describe('buildRealReturnRuleSnapshot()', () => {
  const RULES = resolveRuleSnapshot('us', ['realReturnConservative', 'realReturnBase', 'realReturnOptimistic', 'inflationAssumption'], '2026-07-13');

  it('overrides base/conservative/optimistic from realPct ± spread, leaves other values untouched', () => {
    const { rules, clamp } = buildRealReturnRuleSnapshot(RULES, 7.5, 2.5);
    expect(clamp.realPct).toBe(5.0);
    expect(rules.values.realReturnBase).toBeCloseTo(0.05, 10);
    expect(rules.values.realReturnConservative).toBeCloseTo((5.0 - REAL_RETURN_SCENARIO_SPREAD_PCT) / 100, 10);
    expect(rules.values.realReturnOptimistic).toBeCloseTo((5.0 + REAL_RETURN_SCENARIO_SPREAD_PCT) / 100, 10);
    expect(rules.values.inflationAssumption).toBe(RULES.values.inflationAssumption);
  });

  it('does not mutate the input RuleSnapshot (returns a clone)', () => {
    const before = { ...RULES.values };
    buildRealReturnRuleSnapshot(RULES, 9, 1);
    expect(RULES.values).toEqual(before);
  });

  it('uses the CLAMPED realPct for the override when the raw value is out of range', () => {
    const { rules, clamp } = buildRealReturnRuleSnapshot(RULES, 20, 0); // raw = 20 → clamp to 8
    expect(clamp.clamped).toBe(true);
    expect(rules.values.realReturnBase).toBeCloseTo(REAL_RETURN_CLAMP_MAX / 100, 10);
  });

  it('preserves meta unchanged (sources/verifiedAt still point at the original rule entries)', () => {
    const { rules } = buildRealReturnRuleSnapshot(RULES, 7.5, 2.5);
    expect(rules.meta).toEqual(RULES.meta);
  });
});
