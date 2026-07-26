// lib/calc/mortgage/repayment.ts
// AU mortgage repayment engine (PR 5.1, FDL). Pure, monthly amortization —
// no React, no DOM, no Date.now. v1: monthly repayment frequency only
// (fortnightly is a Phase-6 candidate per the brief).
//
// Binding model conventions (FDL 5.1 brief):
//   1. monthlyPayment is the standard annuity payment on the FULL principal,
//      IGNORING any offset balance — payment = P × r / (1 − (1+r)^−n),
//      r = annualRatePct / 100 / 12, n = termYears × 12. An offset account
//      shortens the term (fewer months to pay off), it never changes the
//      fixed monthly payment amount.
//   2. Offset month: interestBase = max(0, remaining − offsetBalance);
//      interest = interestBase × r; remaining = remaining + interest −
//      payment (payment fixed at monthlyPayment, clipped on the final
//      instalment so remaining never goes negative).
//   3. rate 0 ⇒ payment = P / n exactly, and interest is 0 every month
//      (Grenzfall, invariant-tested).
//   4. Offset can only accelerate payoff relative to the no-offset case —
//      it can never increase totalInterest or extend months (invariant-
//      tested). This holds because the fixed payment amortizes the
//      no-offset schedule in exactly `n` months; a smaller interest charge
//      each month (from the offset reduction) only ever leaves MORE of the
//      fixed payment to reduce principal, never less.

export interface RepaymentInputs {
  principal: number;
  annualRatePct: number;
  termYears: number;
  offsetBalance?: number; // reduces interest-bearing principal each month; payment stays fixed
  repaymentFrequency?: 'monthly'; // v1: monthly only
}

export interface RepaymentResult {
  monthlyPayment: number; // standard annuity on FULL principal (offset shortens term, not payment)
  totalInterest: number;
  months: number; // actual months incl. offset effect
  schedule: { month: number; remaining: number; interest: number }[];
  offsetSavings?: { interestSaved: number; monthsSaved: number };
}

export function validateRepaymentInputs(inputs: RepaymentInputs): void {
  if (!Number.isFinite(inputs.principal) || inputs.principal <= 0) {
    throw new TypeError('principal must be a positive finite number');
  }
  if (!Number.isFinite(inputs.annualRatePct) || inputs.annualRatePct < 0) {
    throw new TypeError('annualRatePct must be >= 0');
  }
  if (!Number.isFinite(inputs.termYears) || inputs.termYears <= 0) {
    throw new TypeError('termYears must be a positive finite number');
  }
  if (inputs.offsetBalance !== undefined && (!Number.isFinite(inputs.offsetBalance) || inputs.offsetBalance < 0)) {
    throw new TypeError('offsetBalance must be >= 0 when provided');
  }
  if (inputs.repaymentFrequency !== undefined && inputs.repaymentFrequency !== 'monthly') {
    throw new TypeError("repaymentFrequency v1 supports 'monthly' only");
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Standard annuity payment. r === 0 ⇒ P/n (Grenzfall). */
function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

/** Simulates the fixed-payment amortization with a (possibly zero) constant
 *  offset balance. Bounded to `maxMonths` iterations (== the no-offset term
 *  n, since offset can only ever shorten the payoff, never lengthen it). */
function simulate(
  principal: number,
  monthlyRate: number,
  payment: number,
  offsetBalance: number,
  maxMonths: number,
): { totalInterest: number; months: number; schedule: { month: number; remaining: number; interest: number }[] } {
  let remaining = principal;
  let totalInterest = 0;
  const schedule: { month: number; remaining: number; interest: number }[] = [];
  let month = 0;

  while (remaining > 0.005 && month < maxMonths) {
    month++;
    const interestBase = Math.max(0, remaining - offsetBalance);
    const interest = interestBase * monthlyRate;
    let thisPayment = payment;
    // Final instalment: never let a fixed payment push remaining negative.
    if (thisPayment > remaining + interest) thisPayment = remaining + interest;
    remaining = remaining + interest - thisPayment;
    totalInterest += interest;
    schedule.push({ month, remaining: round2(Math.max(0, remaining)), interest: round2(interest) });
  }

  return { totalInterest: round2(totalInterest), months: month, schedule };
}

export function computeRepayment(inputs: RepaymentInputs): RepaymentResult {
  validateRepaymentInputs(inputs);

  const monthlyRate = inputs.annualRatePct / 100 / 12;
  const n = Math.round(inputs.termYears * 12);
  const monthlyPayment = annuityPayment(inputs.principal, monthlyRate, n);
  const offsetBalance = inputs.offsetBalance ?? 0;

  const withOffset = simulate(inputs.principal, monthlyRate, monthlyPayment, offsetBalance, n);

  let offsetSavings: RepaymentResult['offsetSavings'];
  if (inputs.offsetBalance !== undefined) {
    const noOffset = simulate(inputs.principal, monthlyRate, monthlyPayment, 0, n);
    offsetSavings = {
      interestSaved: round2(noOffset.totalInterest - withOffset.totalInterest),
      monthsSaved: noOffset.months - withOffset.months,
    };
  }

  return {
    monthlyPayment: round2(monthlyPayment),
    totalInterest: withOffset.totalInterest,
    months: withOffset.months,
    schedule: withOffset.schedule,
    offsetSavings,
  };
}
