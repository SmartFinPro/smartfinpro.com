// __tests__/unit/calc/retirement-escalation.test.ts
//
// Wealth Horizon v4 — engine escalation feature ("Increase monthly
// contributions each year"), FDL binding spec (TEIL A). Tests written FIRST
// (TDD) against the exact contract:
//   - contributionGrowthPct?: number, 0–5, REAL escalation of EMPLOYEE
//     contributions only (employer stays flat), on top of inflation (the
//     whole model is already real — no second inflation application).
//   - 0/undefined must be bit-identical to the pre-v4 engine (invariant).
//   - monthlyContributionInYear(base, growthPct, year) is the shared pure
//     helper the UI's dynamic hint uses — engine and UI must never diverge.
//   - Advisory contribution checks keep using year-1 amounts (existing
//     convention, unaffected by escalation).

import { describe, it, expect } from 'vitest';
import { resolveRuleSnapshot, RULE_PACKS } from '@/lib/rules';
import {
  projectRetirement,
  buildContributionChecks,
  validateInputs,
  monthlyContributionInYear,
} from '@/lib/calc/retirement/engine';
import type { RetirementInputs } from '@/lib/calc/retirement/types';

const RULE_KEYS = [
  'realReturnConservative', 'realReturnBase', 'realReturnOptimistic', 'inflationAssumption',
  'k401Limit', 'k401CatchUp', 'k401CatchUpAge60To63', 'k401TotalContributionLimit',
  'iraLimit', 'iraCatchUp',
  'isaAllowance',
  'rrspLimit', 'tfsaCumulative',
  'concessionalCap', 'nonConcessionalCap', 'superGuaranteeRate',
];

function rulesFor(market: 'us' | 'uk' | 'ca' | 'au', asOf = '2026-07-12') {
  const available = RULE_KEYS.filter((k) => k in RULE_PACKS[market]);
  return resolveRuleSnapshot(market, available, asOf);
}

const BASE_SIMPLE_INPUTS: RetirementInputs = {
  market: 'us',
  currentAge: 40,
  retireAge: 65,
  annualFeePct: 1.0,
  targetMonthlyIncomeToday: 4000,
  withdrawalRatePct: 4.0,
  contributionMode: 'simple',
  simple: {
    taxAdvantagedBalance: 100000,
    taxableBalance: 20000,
    employeeContributionMonthly: 800,
    employerContributionMonthly: 200,
  },
};

describe('retirement engine — contribution escalation (Wealth Horizon v4)', () => {
  const rules = rulesFor('us');

  it('1. g undefined AND g=0 produce a result bit-identical (toEqual, not toBeCloseTo) to the field being absent entirely', () => {
    const withoutField = projectRetirement(BASE_SIMPLE_INPUTS, rules);
    const withUndefined = projectRetirement({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: undefined }, rules);
    const withZero = projectRetirement({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: 0 }, rules);

    expect(withUndefined).toEqual(withoutField);
    expect(withZero).toEqual(withoutField);
  });

  it('2. monotonicity: g=0 < g=2 < g=5 ⇒ balanceAtRetire strictly increasing (employeeMonthly > 0)', () => {
    const b0 = projectRetirement({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: 0 }, rules)
      .scenarios.find((s) => s.key === 'base')!.balanceAtRetire;
    const b2 = projectRetirement({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: 2 }, rules)
      .scenarios.find((s) => s.key === 'base')!.balanceAtRetire;
    const b5 = projectRetirement({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: 5 }, rules)
      .scenarios.find((s) => s.key === 'base')!.balanceAtRetire;

    expect(b2).toBeGreaterThan(b0);
    expect(b5).toBeGreaterThan(b2);
  });

  it('3. validateInputs throws for contributionGrowthPct outside [0, 5]; accepts the boundaries 0 and 5', () => {
    expect(() => validateInputs({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: -1 })).toThrow(TypeError);
    expect(() => validateInputs({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: 6 })).toThrow(TypeError);
    expect(() => validateInputs({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: 0 })).not.toThrow();
    expect(() => validateInputs({ ...BASE_SIMPLE_INPUTS, contributionGrowthPct: 5 })).not.toThrow();
  });

  it('4. monthlyContributionInYear(400, 3, 10) ≈ 521.90 (400×1.03^9); year 1 is exactly the base amount', () => {
    expect(monthlyContributionInYear(400, 3, 10)).toBeCloseTo(521.9, 1);
    expect(monthlyContributionInYear(400, 3, 1)).toBe(400);
  });

  it("5. account-breakdown: escalation scales EACH account's employee share; employer contributions stay flat (hand-computed)", () => {
    // rNet forced to 0 for the 'conservative' scenario (realReturnConservative
    // = 3.0% exactly cancels a 3.0% fee — same trick as the existing
    // zero-return invariant test in retirement-engine.test.ts).
    const feeEqualToConservativeRate = rules.values.realReturnConservative * 100; // 3.0
    const inputs: RetirementInputs = {
      market: 'us',
      currentAge: 40,
      retireAge: 42,
      annualFeePct: feeEqualToConservativeRate,
      targetMonthlyIncomeToday: 4000,
      withdrawalRatePct: 4.0,
      contributionGrowthPct: 5,
      contributionMode: 'account-breakdown',
      accounts: [
        { id: 'a', type: 'us-taxable', balance: 10000, employeeContributionMonthly: 100, employerContributionMonthly: 50 },
        { id: 'b', type: 'us-taxable', balance: 5000, employeeContributionMonthly: 200, employerContributionMonthly: 25 },
      ],
    };
    const result = projectRetirement(inputs, rules);
    const conservative = result.scenarios.find((s) => s.key === 'conservative')!;

    // Hand computation (rNet forced to 0 above, so balance only accumulates
    // contributions — no compounding to account for):
    //   year 1 (age 41): employee = (100+200)×12×1.05^0 = 3,600; employer flat = (50+25)×12 = 900
    //     → contribution = 4,500 → balance = 15,000 + 4,500 = 19,500
    //   year 2 (age 42): employee = 3,600×1.05^1 = 3,780; employer flat = 900
    //     → contribution = 4,680 → balance = 19,500 + 4,680 = 24,180
    // Per-account view (escalation distributes linearly over the sum, since
    // multiplication distributes over addition):
    //   account a's employee share @ year 2: 100×12×1.05 = 1,260
    //   account b's employee share @ year 2: 200×12×1.05 = 2,520
    //   sum = 3,780 — identical to the aggregate above. Employer (50+25=75/mo)
    //   never gets multiplied by 1.05^k in either view.
    expect(conservative.balanceAtRetire).toBeCloseTo(24180, 6);
  });

  it('6. advisory contribution checks keep using year-1 amounts — g=5 does not change check.amountApplied', () => {
    const inputs: RetirementInputs = {
      ...BASE_SIMPLE_INPUTS,
      contributionMode: 'account-breakdown',
      accounts: [{ id: 'k401-1', type: 'us-401k', balance: 100000, employeeContributionMonthly: 3000, contributedYtd: 20000 }],
      simple: undefined,
    } as RetirementInputs;

    const checksNoGrowth = buildContributionChecks(inputs, rules);
    const checksWithGrowth = buildContributionChecks({ ...inputs, contributionGrowthPct: 5 }, rules);

    expect(checksWithGrowth[0].amountApplied).toBe(checksNoGrowth[0].amountApplied);
    expect(checksWithGrowth[0].amountApplied).toBeCloseTo(375, 2); // unchanged from the existing 7b fixture (k401Limit 24,500 − 20,000 YTD)/12
  });
});
