// lib/calc/mortgage/remortgage.ts
// UK remortgage comparison engine (PR 5.1, FDL). Pure, no React/DOM/Date.now.
//
// Binding model conventions (FDL 5.1 brief):
//   1. monthlySavings = current monthly payment − offer monthly payment,
//      BOTH computed on the SAME currentBalance over the SAME
//      remainingTermYears (gleiche Restlaufzeit) — only the rate differs.
//      offerDealYears is the initial fixed-rate deal length, NOT the
//      amortization term used for the payment comparison.
//   2. totalInterestCurrentDeal/totalInterestOfferDeal = interest paid
//      during the deal window only (min(offerDealYears, remainingTermYears)
//      × 12 months), amortizing at the respective rate over the full
//      remainingTermYears schedule.
//   3. breakEvenMonths = ceil(fees / monthlySavings); null when
//      monthlySavings <= 0 (never breaks even / costs more, per brief).
//   4. netSavingsOverDeal = (monthlySavings × dealMonths) − fees, where
//      dealMonths = min(offerDealYears, remainingTermYears) × 12.

export interface RemortgageInputs {
  currentBalance: number;
  currentRatePct: number;
  remainingTermYears: number;
  offerRatePct: number;
  offerDealYears: number;
  fees: number; // arrangement + legal + valuation combined
}

export interface RemortgageResult {
  monthlySavings: number; // current payment − offer payment (gleiche Restlaufzeit)
  totalInterestCurrentDeal: number; // over offerDealYears
  totalInterestOfferDeal: number;
  breakEvenMonths: number | null; // ceil(fees / monthlySavings); null wenn savings <= 0
  netSavingsOverDeal: number; // (monthlySavings × dealMonths) − fees
}

export function validateRemortgageInputs(inputs: RemortgageInputs): void {
  if (!Number.isFinite(inputs.currentBalance) || inputs.currentBalance <= 0) {
    throw new TypeError('currentBalance must be a positive finite number');
  }
  if (!Number.isFinite(inputs.currentRatePct) || inputs.currentRatePct < 0) {
    throw new TypeError('currentRatePct must be >= 0');
  }
  if (!Number.isFinite(inputs.remainingTermYears) || inputs.remainingTermYears <= 0) {
    throw new TypeError('remainingTermYears must be a positive finite number');
  }
  if (!Number.isFinite(inputs.offerRatePct) || inputs.offerRatePct < 0) {
    throw new TypeError('offerRatePct must be >= 0');
  }
  if (!Number.isFinite(inputs.offerDealYears) || inputs.offerDealYears <= 0) {
    throw new TypeError('offerDealYears must be a positive finite number');
  }
  if (!Number.isFinite(inputs.fees) || inputs.fees < 0) {
    throw new TypeError('fees must be >= 0');
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

/** Interest paid during the first `windowMonths` of a fixed-payment
 *  amortization schedule (principal, monthlyRate, totalMonths). */
function interestOverWindow(principal: number, monthlyRate: number, totalMonths: number, windowMonths: number): number {
  const payment = annuityPayment(principal, monthlyRate, totalMonths);
  let remaining = principal;
  let totalInterest = 0;
  for (let month = 1; month <= windowMonths && remaining > 0.005; month++) {
    const interest = remaining * monthlyRate;
    let thisPayment = payment;
    if (thisPayment > remaining + interest) thisPayment = remaining + interest;
    remaining = remaining + interest - thisPayment;
    totalInterest += interest;
  }
  return round2(totalInterest);
}

export function compareRemortgage(inputs: RemortgageInputs): RemortgageResult {
  validateRemortgageInputs(inputs);

  const totalMonths = Math.round(inputs.remainingTermYears * 12);
  const dealMonths = Math.min(Math.round(inputs.offerDealYears * 12), totalMonths);

  const currentMonthlyRate = inputs.currentRatePct / 100 / 12;
  const offerMonthlyRate = inputs.offerRatePct / 100 / 12;

  const currentPayment = annuityPayment(inputs.currentBalance, currentMonthlyRate, totalMonths);
  const offerPayment = annuityPayment(inputs.currentBalance, offerMonthlyRate, totalMonths);

  const monthlySavings = round2(currentPayment - offerPayment);

  const totalInterestCurrentDeal = interestOverWindow(inputs.currentBalance, currentMonthlyRate, totalMonths, dealMonths);
  const totalInterestOfferDeal = interestOverWindow(inputs.currentBalance, offerMonthlyRate, totalMonths, dealMonths);

  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(inputs.fees / monthlySavings) : null;
  const netSavingsOverDeal = round2(monthlySavings * dealMonths - inputs.fees);

  return {
    monthlySavings,
    totalInterestCurrentDeal,
    totalInterestOfferDeal,
    breakEvenMonths,
    netSavingsOverDeal,
  };
}
