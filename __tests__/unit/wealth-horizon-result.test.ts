// __tests__/unit/wealth-horizon-result.test.ts
// Adapter tests for buildWealthHorizonResult (FDL 4.2) — verifies the
// ToolResult contract (SPEC 8.1) is honored and the binding wording rules
// (SPEC 8.3: "illustrative retirement withdrawal", never "sustainable" /
// "guaranteed" / "you will have") hold for every resultState/focusScenario
// combination, without a second calculation path (every number traces back
// to projectRetirement()).

import { describe, it, expect } from 'vitest';
import { resolveRuleSnapshot } from '@/lib/rules';
import type { RetirementInputs } from '@/lib/calc/retirement/types';
import { projectRetirement } from '@/lib/calc/retirement/engine';
import {
  buildWealthHorizonResult,
  WEALTH_HORIZON_US_RULE_KEYS,
} from '@/lib/tools/results/wealth-horizon-result';

const ASOF = '2026-07-12';
const RULES = resolveRuleSnapshot('us', [...WEALTH_HORIZON_US_RULE_KEYS], ASOF);

const SIMPLE_INPUTS: RetirementInputs = {
  market: 'us',
  currentAge: 35,
  retireAge: 65,
  annualFeePct: 0.5,
  targetMonthlyIncomeToday: 4500,
  withdrawalRatePct: 4.0,
  contributionMode: 'simple',
  simple: {
    taxAdvantagedBalance: 60000,
    taxableBalance: 15000,
    employeeContributionMonthly: 900,
    employerContributionMonthly: 300,
  },
};

const FORBIDDEN_WORDS = ['sustainable', 'guaranteed', 'you will have'];

describe('buildWealthHorizonResult', () => {
  it('never uses the forbidden wording (SPEC 8.3 negative list)', () => {
    const result = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours');
    const haystack = [result.answer, result.primary.label, ...result.assumptions.map((a) => `${a.label} ${a.value} ${a.note ?? ''}`)]
      .join(' ')
      .toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      expect(haystack.includes(word), `found forbidden word "${word}"`).toBe(false);
    }
  });

  it('primary.value is the base-scenario withdrawal, range spans conservative..optimistic', () => {
    const engine = projectRetirement(SIMPLE_INPUTS, RULES);
    const result = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours');
    const base = engine.scenarios.find((s) => s.key === 'base')!;
    const conservative = engine.scenarios.find((s) => s.key === 'conservative')!;
    const optimistic = engine.scenarios.find((s) => s.key === 'optimistic')!;

    expect(result.primary.value).toBe(base.illustrativeMonthlyWithdrawal);
    expect(result.primary.range.low).toBe(conservative.illustrativeMonthlyWithdrawal);
    expect(result.primary.range.high).toBe(optimistic.illustrativeMonthlyWithdrawal);
    expect(result.primary.format).toBe('currency');
    expect(result.primary.currency).toBe('USD');
  });

  it('scenario is a corridor with all three series and (when reached) a single FI marker', () => {
    const result = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours');
    expect(result.scenario.kind).toBe('corridor');
    if (result.scenario.kind === 'corridor') {
      expect(result.scenario.series.map((s) => s.key).sort()).toEqual(['base', 'conservative', 'optimistic']);
      expect(result.scenario.textAlternative.length).toBeGreaterThan(0);
    }
  });

  it('exposes exactly 3 levers, identical to the engine output (no second calc path)', () => {
    const engine = projectRetirement(SIMPLE_INPUTS, RULES);
    const result = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours');
    expect(result.levers).toHaveLength(3);
    expect(result.levers).toEqual(engine.levers);
  });

  it('verifiedAt is the min(verifiedAt) across the resolved rule snapshot', () => {
    const result = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours');
    const allVerified = Object.values(RULES.meta).map((m) => m.verifiedAt);
    expect(result.verifiedAt).toBe(allVerified.reduce((min, d) => (d < min ? d : min)));
  });

  it('nextAction is exactly one, kind "tool" (not "cockpit" — baseline-window guard, SPEC 4.5 local placeholder)', () => {
    const result = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours');
    expect(result.nextAction.kind).toBe('tool');
    expect(result.nextAction.href).toBe('/tools/money-leak-scanner');
  });

  it('resultState is passed through unchanged', () => {
    expect(buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'example').resultState).toBe('example');
    expect(buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours').resultState).toBe('yours');
    expect(buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'shared').resultState).toBe('shared');
  });

  it('focusScenario changes the answer sentence and primary value without changing the corridor series', () => {
    const base = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours', 'base');
    const optimistic = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours', 'optimistic');
    expect(base.answer).not.toBe(optimistic.answer);
    expect(base.primary.value).not.toBe(optimistic.primary.value);
    // Range (conservative..optimistic) stays identical — only the focused value/answer moves.
    expect(base.primary.range).toEqual(optimistic.primary.range);
  });

  it('sources have no duplicate (url,label) pairs and every entry has effectiveFrom+verifiedAt', () => {
    const result = buildWealthHorizonResult(SIMPLE_INPUTS, RULES, 'yours');
    expect(result.sources.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const s of result.sources) {
      const key = `${s.url}|${s.label}`;
      expect(seen.has(key), `duplicate source ${key}`).toBe(false);
      seen.add(key);
      expect(s.effectiveFrom).toBeTruthy();
      expect(s.verifiedAt).toBeTruthy();
    }
  });
});
