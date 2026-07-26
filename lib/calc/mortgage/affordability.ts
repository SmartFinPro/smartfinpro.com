// lib/calc/mortgage/affordability.ts
// CA mortgage affordability engine (PR 5.1, FDL) — GDS/TDS/stress-test/CMHC
// premium. Pure, no React/DOM/Date.now; all guideline VALUES (stress-test
// floor, GDS/TDS thresholds, CMHC premium-by-LTV schedule) are resolved
// from a RuleSnapshot (lib/rules/ca.ts) — never hardcoded here (grep-gated,
// FDL 5.1 brief: `rg "0\.32|0\.39|0\.44|5\.25" lib/calc/mortgage` must be 0).
//
// Binding model conventions (FDL 5.1 brief):
//   1. qualifyingRatePct = max(contractRatePct + 2, osfiQualifyingRateFloor
//      as a percentage) — OSFI B-20 stress test.
//   2. GDS = (P&I@qualifying + tax/12 + heat + condo/2) / (income/12) ≤
//      gdsThreshold; TDS = GDS-numerator + monthlyDebts, over the same
//      denominator, ≤ tdsThreshold. Both P&I figures are computed on the
//      loan amount AT the candidate purchase price (down payment is a FIXED
//      dollar amount from the input; loan = price − downPayment, plus any
//      CMHC premium added to the loan for LTV > 80%).
//   3. maxPurchasePrice is a { low, high } band: `low` = min(gdsBoundPrice,
//      tdsBoundPrice), `high` = max(...), where gdsBoundPrice/tdsBoundPrice
//      are each found via independent deterministic bisection (60
//      iterations, $1 tolerance) over the ratio that is monotonically
//      non-decreasing in price (loan amount, hence P&I, hence both ratios,
//      only ever increase as price increases at a fixed down payment). This
//      ordering guarantees low ≤ high by construction, and `low` is always
//      the true overall affordability answer (the price that satisfies
//      BOTH constraints simultaneously) since it is the smaller — i.e.
//      MORE restrictive — of the two bounds.
//   4. paymentStack/cmhc/gdsAtMax/tdsAtMax/riskBuffer are all evaluated AT
//      maxPurchasePrice.low (the binding, overall answer).
//   5. CMHC premium v1 scope: standard 25-year-amortization schedule only
//      (no 30-year +0.20pp surcharge, no "non-traditional down payment"
//      +0.50pp band — both out of scope, see PR 5.1 report). LTV bands
//      above 95% (down payment < 5%) are clamped to the 90.01–95% band
//      rather than treated as ineligible — a documented v1 simplification.

import type { RuleSnapshot } from '@/lib/rules';

export interface AffordabilityInputs {
  grossAnnualIncome: number;
  monthlyDebts: number;
  downPayment: number;
  contractRatePct: number;
  termYears: number;
  monthlyHeatingCost: number;
  annualPropertyTax: number;
  condoFeesMonthly?: number;
}

export interface AffordabilityResult {
  qualifyingRatePct: number; // max(contract + 2, floor aus Rules) — Stress-Test
  maxPurchasePrice: { low: number; high: number }; // Bandbreite: GDS-bound vs TDS-bound
  paymentStack: { key: 'principal-interest' | 'tax' | 'heat' | 'condo-half'; label: string; value: number }[];
  gdsAtMax: number;
  tdsAtMax: number; // gegen Rules-Richtwerte
  cmhc: { required: boolean; premiumPct: number; premiumAmount: number } | null; // LTV-Stufen aus Rules
  riskBuffer: { paymentAtContract: number; paymentAtQualifying: number }; // sichtbarer Puffer
}

export function validateAffordabilityInputs(inputs: AffordabilityInputs): void {
  if (!Number.isFinite(inputs.grossAnnualIncome) || inputs.grossAnnualIncome <= 0) {
    throw new TypeError('grossAnnualIncome must be a positive finite number');
  }
  if (!Number.isFinite(inputs.monthlyDebts) || inputs.monthlyDebts < 0) {
    throw new TypeError('monthlyDebts must be >= 0');
  }
  if (!Number.isFinite(inputs.downPayment) || inputs.downPayment < 0) {
    throw new TypeError('downPayment must be >= 0');
  }
  if (!Number.isFinite(inputs.contractRatePct) || inputs.contractRatePct < 0) {
    throw new TypeError('contractRatePct must be >= 0');
  }
  if (!Number.isFinite(inputs.termYears) || inputs.termYears <= 0) {
    throw new TypeError('termYears must be a positive finite number');
  }
  if (!Number.isFinite(inputs.monthlyHeatingCost) || inputs.monthlyHeatingCost < 0) {
    throw new TypeError('monthlyHeatingCost must be >= 0');
  }
  if (!Number.isFinite(inputs.annualPropertyTax) || inputs.annualPropertyTax < 0) {
    throw new TypeError('annualPropertyTax must be >= 0');
  }
  if (inputs.condoFeesMonthly !== undefined && (!Number.isFinite(inputs.condoFeesMonthly) || inputs.condoFeesMonthly < 0)) {
    throw new TypeError('condoFeesMonthly must be >= 0 when provided');
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

/** CMHC premium band lookup by LTV (loan / price). LTV > 95% is clamped to
 *  the 90.01–95% band (documented v1 simplification, see file header). */
function cmhcPremiumPctForLtv(ltv: number, rules: RuleSnapshot): number {
  if (ltv <= 0.65) return rules.values.cmhcPremiumLtv65;
  if (ltv <= 0.75) return rules.values.cmhcPremiumLtv75;
  if (ltv <= 0.80) return rules.values.cmhcPremiumLtv80;
  if (ltv <= 0.85) return rules.values.cmhcPremiumLtv85;
  if (ltv <= 0.90) return rules.values.cmhcPremiumLtv90;
  return rules.values.cmhcPremiumLtv95; // covers 90.01–95% AND the >95% clamp
}

interface PriceEvaluation {
  loanBeforePremium: number;
  ltv: number;
  cmhcRequired: boolean;
  premiumPct: number;
  premiumAmount: number;
  loanWithPremium: number;
  piAtQualifying: number;
  piAtContract: number;
  gdsNumerator: number;
  gds: number;
  tds: number;
}

function evaluateAtPrice(
  price: number,
  inputs: AffordabilityInputs,
  qualifyingMonthlyRate: number,
  contractMonthlyRate: number,
  months: number,
  rules: RuleSnapshot,
): PriceEvaluation {
  const loanBeforePremium = Math.max(0, price - inputs.downPayment);
  const ltv = price > 0 ? loanBeforePremium / price : 0;
  const cmhcRequired = ltv > 0.80;
  const premiumPct = cmhcRequired ? cmhcPremiumPctForLtv(ltv, rules) : 0;
  const premiumAmount = cmhcRequired ? round2(loanBeforePremium * premiumPct) : 0;
  const loanWithPremium = loanBeforePremium + premiumAmount;

  const piAtQualifying = annuityPayment(loanWithPremium, qualifyingMonthlyRate, months);
  const piAtContract = annuityPayment(loanWithPremium, contractMonthlyRate, months);

  const monthlyIncome = inputs.grossAnnualIncome / 12;
  const taxHeatCondo = inputs.annualPropertyTax / 12 + inputs.monthlyHeatingCost + (inputs.condoFeesMonthly ?? 0) / 2;
  const gdsNumerator = piAtQualifying + taxHeatCondo;
  const gds = gdsNumerator / monthlyIncome;
  const tds = (gdsNumerator + inputs.monthlyDebts) / monthlyIncome;

  return {
    loanBeforePremium, ltv, cmhcRequired, premiumPct, premiumAmount, loanWithPremium,
    piAtQualifying, piAtContract, gdsNumerator, gds, tds,
  };
}

/** Deterministic bisection for the maximum price such that `ratioFn(price)
 *  <= threshold`. 60 iterations, $1 tolerance (FDL 5.1 brief). `ratioFn`
 *  must be monotonically non-decreasing in price. */
function bisectMaxPrice(ratioFn: (price: number) => number, threshold: number): number {
  let lo = 0;
  let hi = 100_000_000; // generous upper bracket; 60 halvings is far more than needed for $1 tolerance
  for (let i = 0; i < 60; i++) {
    if (hi - lo < 1) break;
    const mid = (lo + hi) / 2;
    if (ratioFn(mid) <= threshold) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function computeAffordability(inputs: AffordabilityInputs, rules: RuleSnapshot): AffordabilityResult {
  validateAffordabilityInputs(inputs);

  const qualifyingRatePct = Math.max(inputs.contractRatePct + 2, rules.values.osfiQualifyingRateFloor * 100);
  const qualifyingMonthlyRate = qualifyingRatePct / 100 / 12;
  const contractMonthlyRate = inputs.contractRatePct / 100 / 12;
  const months = Math.round(inputs.termYears * 12);

  const gdsBoundPrice = bisectMaxPrice(
    (price) => evaluateAtPrice(price, inputs, qualifyingMonthlyRate, contractMonthlyRate, months, rules).gds,
    rules.values.gdsThreshold,
  );
  const tdsBoundPrice = bisectMaxPrice(
    (price) => evaluateAtPrice(price, inputs, qualifyingMonthlyRate, contractMonthlyRate, months, rules).tds,
    rules.values.tdsThreshold,
  );

  const low = Math.min(gdsBoundPrice, tdsBoundPrice);
  const high = Math.max(gdsBoundPrice, tdsBoundPrice);

  const atLow = evaluateAtPrice(low, inputs, qualifyingMonthlyRate, contractMonthlyRate, months, rules);

  const paymentStack: AffordabilityResult['paymentStack'] = [
    { key: 'principal-interest', label: 'Principal & interest (at qualifying rate)', value: round2(atLow.piAtQualifying) },
    { key: 'tax', label: 'Property tax', value: round2(inputs.annualPropertyTax / 12) },
    { key: 'heat', label: 'Heating', value: round2(inputs.monthlyHeatingCost) },
    { key: 'condo-half', label: 'Condo fees (50%)', value: round2((inputs.condoFeesMonthly ?? 0) / 2) },
  ];

  return {
    qualifyingRatePct,
    maxPurchasePrice: { low: round2(low), high: round2(high) },
    paymentStack,
    gdsAtMax: atLow.gds,
    tdsAtMax: atLow.tds,
    cmhc: {
      required: atLow.cmhcRequired,
      premiumPct: atLow.premiumPct,
      premiumAmount: atLow.premiumAmount,
    },
    riskBuffer: {
      paymentAtContract: round2(atLow.piAtContract),
      paymentAtQualifying: round2(atLow.piAtQualifying),
    },
  };
}
