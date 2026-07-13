// __tests__/unit/calc/retirement-decumulation.test.ts
//
// Wealth Horizon v2 — engine decumulation invariants (Teil A of the FDL
// WH-v2 brief). Six binding invariant vectors, numbered to match the brief:
//   1. rate 4% + base 5% real ⇒ depletionAge null AND decumulation end
//      balance ≥ balanceAtRetire (growth beats withdrawal).
//   2. rate 5% + conservative 3% real ⇒ strictly monotonically decreasing
//      decumulationRows and a concrete depletionAge.
//   3. decumulationRows[0] === { age: retireAge, balance: balanceAtRetire } exactly.
//   4. Benefit presence does NOT change decumulationRows (benefit is income,
//      never an asset in this balance path).
//   5. The last row at depletion has balance exactly 0.
//   6. Fee applied exactly once — decumulation with fee 0 vs fee 1 diverges
//      correctly (no double fee-subtraction in the decumulation phase).
//
// Plus: fiAge is the pure inverse of fiDate (age units, not calendar years).

import { describe, it, expect } from 'vitest';
import { resolveRuleSnapshot, RULE_PACKS } from '@/lib/rules';
import { projectRetirement } from '@/lib/calc/retirement/engine';
import type { RetirementInputs } from '@/lib/calc/retirement/types';

const RULE_KEYS = ['realReturnConservative', 'realReturnBase', 'realReturnOptimistic', 'inflationAssumption'];

function rulesFor(market: 'us' = 'us', asOf = '2026-07-12') {
  const available = RULE_KEYS.filter((k) => k in RULE_PACKS[market]);
  return resolveRuleSnapshot(market, available, asOf);
}

const rules = rulesFor();
// From lib/rules/assumptions.ts: conservative=3%, base=5%, optimistic=6.5%.

function makeInputs(overrides: Partial<RetirementInputs> = {}): RetirementInputs {
  return {
    market: 'us',
    currentAge: 40,
    retireAge: 65,
    annualFeePct: 0,
    targetMonthlyIncomeToday: 4000,
    withdrawalRatePct: 4.0,
    contributionMode: 'simple',
    simple: {
      taxAdvantagedBalance: 100000,
      taxableBalance: 20000,
      employeeContributionMonthly: 800,
      employerContributionMonthly: 200,
    },
    ...overrides,
  } as RetirementInputs;
}

describe('retirement engine — decumulation invariants (FDL WH-v2)', () => {
  it('1. rate 4% + base 5% real ⇒ depletionAge null AND decumulation end balance ≥ balanceAtRetire', () => {
    const inputs = makeInputs({ withdrawalRatePct: 4.0 });
    const result = projectRetirement(inputs, rules);
    const base = result.scenarios.find((s) => s.key === 'base')!;

    expect(base.depletionAge).toBeNull();
    expect(base.decumulationRows.length).toBeGreaterThan(1);
    const lastRow = base.decumulationRows[base.decumulationRows.length - 1];
    expect(lastRow.balance).toBeGreaterThanOrEqual(base.balanceAtRetire);
  });

  it('2. rate 5% + conservative 3% real ⇒ strictly monotonically decreasing decumulationRows and a concrete depletionAge', () => {
    // Long decumulation window (40..90 = 50 years) is needed for a 5%
    // withdrawal against a 3% real return to actually cross zero — the gap
    // between rate and rNet is small (2pp), so depletion takes ~31 years.
    const inputs = makeInputs({ withdrawalRatePct: 5.0, currentAge: 20, retireAge: 40 });
    const result = projectRetirement(inputs, rules);
    const conservative = result.scenarios.find((s) => s.key === 'conservative')!;

    expect(conservative.depletionAge).not.toBeNull();
    expect(typeof conservative.depletionAge).toBe('number');

    const rows = conservative.decumulationRows;
    expect(rows.length).toBeGreaterThan(1);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].balance).toBeLessThan(rows[i - 1].balance);
    }
  });

  it('3. decumulationRows[0] is exactly { age: retireAge, balance: balanceAtRetire }', () => {
    const inputs = makeInputs();
    const result = projectRetirement(inputs, rules);
    for (const scenario of result.scenarios) {
      expect(scenario.decumulationRows[0]).toEqual({ age: inputs.retireAge, balance: scenario.balanceAtRetire });
    }
  });

  it('4. benefit presence does NOT change decumulationRows (benefit is income, never an asset)', () => {
    const withoutBenefit = makeInputs();
    const withBenefit = makeInputs({
      expectedRetirementBenefit: { monthlyAmountToday: 2000, startsAtAge: 67, source: 'user-estimate' },
    });
    const resultWithout = projectRetirement(withoutBenefit, rules);
    const resultWith = projectRetirement(withBenefit, rules);
    for (let i = 0; i < 3; i++) {
      expect(resultWith.scenarios[i].decumulationRows).toEqual(resultWithout.scenarios[i].decumulationRows);
      expect(resultWith.scenarios[i].depletionAge).toBe(resultWithout.scenarios[i].depletionAge);
    }
  });

  it('5. the last row at depletion has balance exactly 0', () => {
    const inputs = makeInputs({ withdrawalRatePct: 5.0, currentAge: 20, retireAge: 40 });
    const result = projectRetirement(inputs, rules);
    const conservative = result.scenarios.find((s) => s.key === 'conservative')!;
    expect(conservative.depletionAge).not.toBeNull();
    const lastRow = conservative.decumulationRows[conservative.decumulationRows.length - 1];
    expect(lastRow.age).toBe(conservative.depletionAge);
    expect(lastRow.balance).toBe(0);
  });

  it('6. fee applied exactly once — decumulation with fee 0 vs fee 1 diverges correctly (no double-subtraction)', () => {
    const feeZero = makeInputs({ annualFeePct: 0, withdrawalRatePct: 4.0 });
    const feeOne = makeInputs({ annualFeePct: 1, withdrawalRatePct: 4.0 });
    const resultZero = projectRetirement(feeZero, rules);
    const resultOne = projectRetirement(feeOne, rules);
    const baseZero = resultZero.scenarios.find((s) => s.key === 'base')!;
    const baseOne = resultOne.scenarios.find((s) => s.key === 'base')!;

    // Different fee ⇒ different balanceAtRetire ⇒ different decumulation
    // trajectories (guards against the decumulation phase silently ignoring
    // annualFeePct).
    expect(baseOne.balanceAtRetire).toBeLessThan(baseZero.balanceAtRetire);
    expect(baseOne.decumulationRows).not.toEqual(baseZero.decumulationRows);

    // Hand-rolled reference for fee=1: rNet = realReturnBase - 0.01, reused
    // for BOTH accumulation and decumulation (fee exactly once, never a
    // second time in the decumulation phase). The accumulator itself stays
    // full-precision between steps (matches the engine's own convention) —
    // only the PUSHED row value is rounded to cents.
    const rNet = rules.values.realReturnBase - 1 / 100;
    let dBal = baseOne.balanceAtRetire;
    const withdrawal = baseOne.illustrativeMonthlyWithdrawal;
    const expectedRows: { age: number; balance: number }[] = [{ age: feeOne.retireAge, balance: baseOne.balanceAtRetire }];
    for (let age = feeOne.retireAge + 1; age <= 90; age++) {
      dBal = dBal * (1 + rNet) - withdrawal * 12;
      if (dBal <= 0) { expectedRows.push({ age, balance: 0 }); break; }
      expectedRows.push({ age, balance: Math.round(dBal * 100) / 100 });
    }
    expect(baseOne.decumulationRows).toEqual(expectedRows);

    // Guard: doubly-applying the fee in decumulation must NOT match.
    const rNetDoubleFee = rules.values.realReturnBase - 1 / 100 - 1 / 100;
    let wrongBal = baseOne.balanceAtRetire;
    for (let age = feeOne.retireAge + 1; age <= feeOne.retireAge + 5; age++) {
      wrongBal = wrongBal * (1 + rNetDoubleFee) - withdrawal * 12;
    }
    const actualAtSamePoint = baseOne.decumulationRows.find((r) => r.age === feeOne.retireAge + 5);
    if (actualAtSamePoint) {
      expect(Math.abs(actualAtSamePoint.balance - wrongBal)).toBeGreaterThan(1);
    }
  });
});

describe('retirement engine — fiAge (age-units inverse of fiDate)', () => {
  it('fiAge is null exactly when fiDate is null', () => {
    const inputs = makeInputs({ targetMonthlyIncomeToday: 1_000_000 }); // unreachable target
    const result = projectRetirement(inputs, rules);
    for (const scenario of result.scenarios) {
      expect(scenario.fiDate).toBeNull();
      expect(scenario.fiAge).toBeNull();
    }
  });

  it('fiAge = currentAge + (fiYear - asOfYear) when fiDate is set', () => {
    const inputs = makeInputs({ targetMonthlyIncomeToday: 1 }); // trivially reached immediately
    const result = projectRetirement(inputs, rules);
    const asOfYear = Number(rules.asOf.slice(0, 4));
    for (const scenario of result.scenarios) {
      expect(scenario.fiDate).not.toBeNull();
      const expectedAge = inputs.currentAge + (Number(scenario.fiDate) - asOfYear);
      expect(scenario.fiAge).toBe(expectedAge);
    }
  });
});
