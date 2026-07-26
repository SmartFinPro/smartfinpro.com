// __tests__/unit/calc/fixtures/mortgage/reference.ts
//
// sourceType: 'reference' — golden fixtures, independently double-computed
// (standalone Node script implementing the same documented formula from
// the FDL 5.1 brief, run separately from the engine under test — same
// convention as __tests__/unit/calc/fixtures/retirement/reference.ts).
// tolerance is absolute, in the tool's currency unit (cents-scale via
// toBeCloseTo(…, 1) in the test file, plus an explicit $/£ tolerance guard).

import type { RepaymentInputs } from '@/lib/calc/mortgage/repayment';
import type { AffordabilityInputs } from '@/lib/calc/mortgage/affordability';
import type { RemortgageInputs } from '@/lib/calc/mortgage/remortgage';

// ── AU repayment ────────────────────────────────────────────────────────

export interface RepaymentReferenceFixture {
  name: string;
  source: string;
  sourceType: 'reference';
  inputs: RepaymentInputs;
  expected: {
    monthlyPayment: number;
    totalInterest: number;
    months: number;
    offsetSavings?: { interestSaved: number; monthsSaved: number };
  };
  tolerance: number;
}

// Fixture 1 — no offset, standard 30y amortization.
// Calculation method: r = 6.0/100/12 = 0.005, n = 360.
// payment = 500000 × 0.005 / (1 − 1.005^−360) = 2997.75 (independent Node
// recomputation of the annuity formula). Simulated month-by-month with the
// SAME payment for 360 months: totalInterest = 579190.95, remaining lands
// on exactly 0 at month 360.
export const REPAYMENT_REFERENCE_NO_OFFSET: RepaymentReferenceFixture = {
  name: 'AU repayment — $500k @ 6.0% / 30y, no offset',
  source: 'independent Node recomputation of the standard annuity formula (see comment above)',
  sourceType: 'reference',
  inputs: { principal: 500000, annualRatePct: 6.0, termYears: 30 },
  expected: { monthlyPayment: 2997.75, totalInterest: 579190.95, months: 360 },
  tolerance: 0.5,
};

// Fixture 2 — $50k offset account, same fixed payment, shorter payoff.
// Calculation method: r = 5.0/100/12, n = 300, payment = annuity($400k, r,
// 300) = 2338.36 (independent recomputation). Simulated with offsetBalance
// = $50,000 constant: interestBase = max(0, remaining − 50000) each month,
// fixed payment 2338.36 → payoff in 257 months, totalInterest 199582.48.
// No-offset baseline over the same 300-month schedule: totalInterest
// 301508.05, months 300. interestSaved = 301508.05 − 199582.48 = 101925.57;
// monthsSaved = 300 − 257 = 43.
export const REPAYMENT_REFERENCE_WITH_OFFSET: RepaymentReferenceFixture = {
  name: 'AU repayment — $400k @ 5.0% / 25y, $50k offset',
  source: 'independent Node recomputation of the fixed-payment offset simulation (see comment above)',
  sourceType: 'reference',
  inputs: { principal: 400000, annualRatePct: 5.0, termYears: 25, offsetBalance: 50000 },
  expected: {
    monthlyPayment: 2338.36,
    totalInterest: 199582.48,
    months: 257,
    offsetSavings: { interestSaved: 101925.57, monthsSaved: 43 },
  },
  tolerance: 0.5,
};

export const REPAYMENT_REFERENCE_FIXTURES: RepaymentReferenceFixture[] = [
  REPAYMENT_REFERENCE_NO_OFFSET,
  REPAYMENT_REFERENCE_WITH_OFFSET,
];

// ── CA affordability ────────────────────────────────────────────────────

export interface AffordabilityReferenceFixture {
  name: string;
  source: string;
  sourceType: 'reference';
  inputs: AffordabilityInputs;
  expected: {
    qualifyingRatePct: number;
    low: number;
    high: number;
    gdsAtMax: number;
    tdsAtMax: number;
    cmhcRequired: boolean;
    cmhcPremiumPct: number;
  };
  tolerance: number;
}

// Fixture 1 — GDS-binding case (modest debts: the 5pp GDS/TDS threshold gap
// exceeds the debt load, so the GDS bound is the tighter/lower price).
// Calculation method: independent Node re-implementation of the bisection
// (60 iterations, $1 tolerance) over the same documented formula —
// qualifyingRatePct = max(4.5+2, 5.25) = 6.5%; bisection on GDS (≤0.39) and
// TDS (≤0.44) separately; low = min(bounds) = 597036.63 (GDS-bound), high =
// 625850.26 (TDS-bound). At low: LTV=83.25% ⇒ CMHC required, premium band
// 80.01-85% = 2.8%. gdsAtMax≈0.39 (binding), tdsAtMax≈0.42 (slack).
export const AFFORDABILITY_REFERENCE_GDS_BINDING: AffordabilityReferenceFixture = {
  name: 'CA affordability — $120k income, modest debts, GDS-binding',
  source: 'independent Node recomputation of the bisection (see comment above)',
  sourceType: 'reference',
  inputs: {
    grossAnnualIncome: 120000,
    monthlyDebts: 300,
    downPayment: 100000,
    contractRatePct: 4.5,
    termYears: 25,
    monthlyHeatingCost: 150,
    annualPropertyTax: 3600,
    condoFeesMonthly: 0,
  },
  expected: {
    qualifyingRatePct: 6.5,
    low: 597036.63,
    high: 625850.26,
    gdsAtMax: 0.39,
    tdsAtMax: 0.42,
    cmhcRequired: true,
    cmhcPremiumPct: 0.028,
  },
  tolerance: 5, // $ tolerance on price bounds (bisection to $1, plus rounding)
};

// Fixture 2 — TDS-binding case (large debt load relative to income, so the
// extra 5pp of TDS headroom is more than eaten up by monthlyDebts, making
// the TDS bound the tighter/lower price).
// Calculation method: same independent bisection script. qualifyingRatePct
// = max(5.0+2, 5.25) = 7.0%; low = min(bounds) = 264341.38 (TDS-bound),
// high = 376906.25 (GDS-bound). At low: LTV=84.87% ⇒ CMHC required, premium
// band 80.01-85% = 2.8%. tdsAtMax≈0.44 (binding), gdsAtMax≈0.28 (slack).
export const AFFORDABILITY_REFERENCE_TDS_BINDING: AffordabilityReferenceFixture = {
  name: 'CA affordability — $90k income, high debts, TDS-binding',
  source: 'independent Node recomputation of the bisection (see comment above)',
  sourceType: 'reference',
  inputs: {
    grossAnnualIncome: 90000,
    monthlyDebts: 1200,
    downPayment: 40000,
    contractRatePct: 5.0,
    termYears: 25,
    monthlyHeatingCost: 120,
    annualPropertyTax: 2400,
    condoFeesMonthly: 300,
  },
  expected: {
    qualifyingRatePct: 7.0,
    low: 264341.38,
    high: 376906.25,
    gdsAtMax: 0.28,
    tdsAtMax: 0.44,
    cmhcRequired: true,
    cmhcPremiumPct: 0.028,
  },
  tolerance: 5,
};

export const AFFORDABILITY_REFERENCE_FIXTURES: AffordabilityReferenceFixture[] = [
  AFFORDABILITY_REFERENCE_GDS_BINDING,
  AFFORDABILITY_REFERENCE_TDS_BINDING,
];

// ── UK remortgage ───────────────────────────────────────────────────────

export interface RemortgageReferenceFixture {
  name: string;
  source: string;
  sourceType: 'reference';
  inputs: RemortgageInputs;
  expected: {
    monthlySavings: number;
    totalInterestCurrentDeal: number;
    totalInterestOfferDeal: number;
    breakEvenMonths: number | null;
    netSavingsOverDeal: number;
  };
  tolerance: number;
}

// Fixture 1 — positive savings, defined break-even month 14 (matches the
// FDL 5.1 brief's example: "Remortgage mit Break-even Monat 14").
// Calculation method: independent Node recomputation. Both payments
// amortized over the SAME 240-month (20y) remaining term: current @5.5% =
// 1375.77/mo, offer @4.0% = 1211.96/mo ⇒ monthlySavings = 163.81. fees =
// 2195 ⇒ breakEvenMonths = ceil(2195/163.81) = 14. dealMonths = 60 (5y
// deal). totalInterestCurrentDeal (first 60mo @5.5%) = 50922.74;
// totalInterestOfferDeal (first 60mo @4.0%) = 36565.21. netSavingsOverDeal
// = 163.81×60 − 2195 = 7633.60.
export const REMORTGAGE_REFERENCE_BREAK_EVEN_14: RemortgageReferenceFixture = {
  name: 'UK remortgage — $200k, 5.5% → 4.0%, break-even month 14',
  source: 'independent Node recomputation of the amortization + break-even formula (see comment above)',
  sourceType: 'reference',
  inputs: {
    currentBalance: 200000,
    currentRatePct: 5.5,
    remainingTermYears: 20,
    offerRatePct: 4.0,
    offerDealYears: 5,
    fees: 2195,
  },
  expected: {
    monthlySavings: 163.81,
    totalInterestCurrentDeal: 50922.74,
    totalInterestOfferDeal: 36565.21,
    breakEvenMonths: 14,
    netSavingsOverDeal: 7633.60,
  },
  tolerance: 0.5,
};

// Fixture 2 — negative savings (offer rate HIGHER than current rate):
// breakEvenMonths must be null, netSavingsOverDeal negative.
// Calculation method: same independent script. Both amortized over 180
// months (15y): current @3.0% = 1035.87/mo, offer @4.5% = 1147.49/mo ⇒
// monthlySavings = −111.62 (negative). dealMonths = 24 (2y deal).
// totalInterestCurrentDeal (first 24mo @3.0%) = 8535.53;
// totalInterestOfferDeal (first 24mo @4.5%) = 12877.55. netSavingsOverDeal
// = −111.62×24 − 500 = −3178.88.
export const REMORTGAGE_REFERENCE_NEGATIVE_SAVINGS: RemortgageReferenceFixture = {
  name: 'UK remortgage — $150k, 3.0% → 4.5% (worse offer), no break-even',
  source: 'independent Node recomputation of the amortization + break-even formula (see comment above)',
  sourceType: 'reference',
  inputs: {
    currentBalance: 150000,
    currentRatePct: 3.0,
    remainingTermYears: 15,
    offerRatePct: 4.5,
    offerDealYears: 2,
    fees: 500,
  },
  expected: {
    monthlySavings: -111.62,
    totalInterestCurrentDeal: 8535.53,
    totalInterestOfferDeal: 12877.55,
    breakEvenMonths: null,
    netSavingsOverDeal: -3178.88,
  },
  tolerance: 0.5,
};

export const REMORTGAGE_REFERENCE_FIXTURES: RemortgageReferenceFixture[] = [
  REMORTGAGE_REFERENCE_BREAK_EVEN_14,
  REMORTGAGE_REFERENCE_NEGATIVE_SAVINGS,
];
