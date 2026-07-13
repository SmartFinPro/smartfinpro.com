// __tests__/unit/calc/fixtures/retirement/reference.ts
//
// sourceType: 'reference' — golden fixtures, independently double-computed
// (Node one-off script mirroring the engine's exact year-end/round2
// convention, NOT the engine itself) — see the calculation method comment
// on each fixture. tolerance is absolute, in the tool's currency unit.

import type { RetirementInputs } from '@/lib/calc/retirement/types';

export interface RetirementReferenceFixture {
  name: string;
  source: string;
  sourceType: 'reference';
  asOf: string;
  inputs: RetirementInputs;
  expected: {
    conservative: { balanceAtRetire: number; withdrawal: number; gap: number; fiDate: string | null };
    base: { balanceAtRetire: number; withdrawal: number; gap: number; fiDate: string | null };
    optimistic: { balanceAtRetire: number; withdrawal: number; gap: number; fiDate: string | null };
  };
  tolerance: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Fixture 1 — US simple mode, 35→65, start $50,000, $500/mo employee +
// $250/mo employer, fee 0.5%, withdrawal rate 4.0%, no benefit, target
// $3,000/mo (today's money).
//
// Calculation method (hand/spreadsheet-equivalent, independent of the
// engine): annualContribution = (500+250)×12 = 9,000. For each scenario,
// rNet = rScenario − 0.005. Starting at balance=50,000 (age 35), iterate
// age 36..65: balance = balance×(1+rNet) + 9,000, rounding to cents each
// step (matches the engine's round2-per-row convention). balanceAtRetire =
// balance at age 65. withdrawal = round2(balanceAtRetire × 0.04 / 12).
// gap = max(0, round2(3000 − withdrawal − 0)) (no benefit configured).
// fiDate: first row (age 35..65) where balance×0.04/12 ≥ 3000; asOfYear
// 2026 + (age − 35).
//   conservative (rNet=2.5%): balanceAtRetire=500002.71, withdrawal=1666.68,
//     gap=1333.32, fiDate=null (never reaches 3000/mo by age 65)
//   base (rNet=4.5%): balanceAtRetire=736329.53, withdrawal=2454.43,
//     gap=545.57, fiDate=null
//   optimistic (rNet=6.0%): balanceAtRetire=998698.23, withdrawal=3328.99,
//     gap=0 (withdrawal already exceeds target), fiDate='2055' (first hit
//     at age 64: balance=933677.58 → capacity=3112.26 ≥ 3000)
// ─────────────────────────────────────────────────────────────────────────
export const REFERENCE_US_SIMPLE: RetirementReferenceFixture = {
  name: 'US simple mode 35→65, $50k start, $750/mo combined, fee 0.5%, rate 4.0%',
  source: 'independent spreadsheet-equivalent recomputation (see comment above)',
  sourceType: 'reference',
  asOf: '2026-07-12',
  inputs: {
    market: 'us',
    currentAge: 35,
    retireAge: 65,
    annualFeePct: 0.5,
    targetMonthlyIncomeToday: 3000,
    withdrawalRatePct: 4.0,
    contributionMode: 'simple',
    simple: {
      taxAdvantagedBalance: 50000,
      taxableBalance: 0,
      employeeContributionMonthly: 500,
      employerContributionMonthly: 250,
    },
  },
  expected: {
    conservative: { balanceAtRetire: 500002.71, withdrawal: 1666.68, gap: 1333.32, fiDate: null },
    base: { balanceAtRetire: 736329.53, withdrawal: 2454.43, gap: 545.57, fiDate: null },
    optimistic: { balanceAtRetire: 998698.23, withdrawal: 3328.99, gap: 0, fiDate: '2055' },
  },
  tolerance: 0.02,
};

// ─────────────────────────────────────────────────────────────────────────
// Fixture 2 — UK account-breakdown, ISA + SIPP, 40→65, fee 0.3%, withdrawal
// rate 4.0%, no benefit, target £2,500/mo.
//
// Calculation method: ISA £300/mo employee (no contributedYtd → 'ok', not
// clamped, annual £3,600 well under the £20,000 allowance anyway). SIPP
// £400/mo employee + £100/mo employer (uk-sipp has no deferralCapKey → 'ok',
// no limit check applicable). Combined employeeMonthly=700, employerMonthly
// =100 → annualContribution = 800×12 = 9,600. startingBalance = 20,000
// (ISA) + 60,000 (SIPP) = 80,000. Same iteration/rounding convention as
// Fixture 1, ages 41..65.
//   conservative (rNet=2.7%): balanceAtRetire=492266.38, withdrawal=1640.89,
//     gap=859.11, fiDate=null
//   base (rNet=4.7%): balanceAtRetire=691884.23, withdrawal=2306.28,
//     gap=193.72, fiDate=null
//   optimistic (rNet=6.2%): balanceAtRetire=901693.17, withdrawal=3005.64,
//     gap=0, fiDate='2049' (row-by-row capacity check: first row whose
//     balance×0.04/12 ≥ 2500 is age 63, balance=781932.58, capacity=
//     2606.44 → asOfYear 2026 + (63−40) = 2049)
// ─────────────────────────────────────────────────────────────────────────
export const REFERENCE_UK_BREAKDOWN: RetirementReferenceFixture = {
  name: 'UK account-breakdown (ISA+SIPP) 40→65, fee 0.3%, rate 4.0%',
  source: 'independent spreadsheet-equivalent recomputation (see comment above)',
  sourceType: 'reference',
  asOf: '2026-07-12',
  inputs: {
    market: 'uk',
    currentAge: 40,
    retireAge: 65,
    annualFeePct: 0.3,
    targetMonthlyIncomeToday: 2500,
    withdrawalRatePct: 4.0,
    contributionMode: 'account-breakdown',
    accounts: [
      { id: 'isa-1', type: 'uk-isa', balance: 20000, employeeContributionMonthly: 300 },
      { id: 'sipp-1', type: 'uk-sipp', balance: 60000, employeeContributionMonthly: 400, employerContributionMonthly: 100 },
    ],
  },
  expected: {
    conservative: { balanceAtRetire: 492266.38, withdrawal: 1640.89, gap: 859.11, fiDate: null },
    base: { balanceAtRetire: 691884.23, withdrawal: 2306.28, gap: 193.72, fiDate: null },
    optimistic: { balanceAtRetire: 901693.17, withdrawal: 3005.64, gap: 0, fiDate: '2049' },
  },
  tolerance: 0.02,
};

// ─────────────────────────────────────────────────────────────────────────
// Fixture 3 — AU simple mode, 55→60 (retireAge BEFORE the benefit starts),
// expectedRetirementBenefit starts at age 67 (> retireAge 60). Verifies the
// benefit-0-before-startsAtAge rule at the exact point that matters: the
// engine's fiDate search AND the retirement-year gap calculation are both
// bounded by retireAge (v1 never projects past retireAge), so a benefit
// that starts strictly after retireAge must contribute exactly 0 to EVERY
// row of this projection, including the final one.
//
// Calculation method: annualContribution = (1000+500)×12 = 18,000.
// startingBalance = 300,000. Ages 56..60 iterated with the same
// round2-per-row convention as Fixture 1. benefitAt(age) = age>=67 ? 1500
// : 0 → always 0 in this fixture (ages 55..60). gap = target − withdrawal
// − 0. fiDate search uses capacity = balance×rate/12 + benefitAt(age),
// which reduces to balance×rate/12 for every row here.
//   conservative (rNet=2.8%): balanceAtRetire=439601.89, withdrawal=1465.34,
//     benefitAtRetire=0, gap=2534.66, fiDate=null
//   base (rNet=4.8%): balanceAtRetire=478316.58, withdrawal=1594.39,
//     benefitAtRetire=0, gap=2405.61, fiDate=null
//   optimistic (rNet=6.3%): balanceAtRetire=509258.28, withdrawal=1697.53,
//     benefitAtRetire=0, gap=2302.47, fiDate=null
// ─────────────────────────────────────────────────────────────────────────
export const REFERENCE_AU_BENEFIT_AFTER_RETIRE: RetirementReferenceFixture = {
  name: 'AU simple mode 55→60 with benefit starting at 67 (benefit-0-before-startsAtAge)',
  source: 'independent spreadsheet-equivalent recomputation (see comment above)',
  sourceType: 'reference',
  asOf: '2026-07-12',
  inputs: {
    market: 'au',
    currentAge: 55,
    retireAge: 60,
    annualFeePct: 0.2,
    targetMonthlyIncomeToday: 4000,
    withdrawalRatePct: 4.0,
    expectedRetirementBenefit: { monthlyAmountToday: 1500, startsAtAge: 67, source: 'user-estimate' },
    contributionMode: 'simple',
    simple: {
      taxAdvantagedBalance: 300000,
      taxableBalance: 0,
      employeeContributionMonthly: 1000,
      employerContributionMonthly: 500,
    },
  },
  expected: {
    conservative: { balanceAtRetire: 439601.89, withdrawal: 1465.34, gap: 2534.66, fiDate: null },
    base: { balanceAtRetire: 478316.58, withdrawal: 1594.39, gap: 2405.61, fiDate: null },
    optimistic: { balanceAtRetire: 509258.28, withdrawal: 1697.53, gap: 2302.47, fiDate: null },
  },
  tolerance: 0.02,
};

export const RETIREMENT_REFERENCE_FIXTURES: RetirementReferenceFixture[] = [
  REFERENCE_US_SIMPLE,
  REFERENCE_UK_BREAKDOWN,
  REFERENCE_AU_BENEFIT_AFTER_RETIRE,
];
