// lib/money-leak/score-engine.ts
// Pure scoring engine for the Money Leak Scanner. No side effects, no I/O.
// Given user inputs → returns a leak breakdown + composite severity.

import type {
  LeakInputs,
  LeakResult,
  LeakCategoryResult,
  LeakCategoryId,
  Severity,
} from './types';
import { CATEGORY_DEFINITIONS, LEAK_THRESHOLDS } from './leak-categories';

/** Round to 2 decimal places without FP drift */
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function severityFromRatio(savingsShareOfIncome: number): Severity {
  if (savingsShareOfIncome >= 0.15) return 'critical';
  if (savingsShareOfIncome >= 0.08) return 'high';
  if (savingsShareOfIncome >= 0.03) return 'medium';
  return 'low';
}

interface CategoryComputation {
  currentSpend: number;
  estimatedLeak: number;
  savingsMultiplier: number; // fraction of currentSpend that is recoverable
  reason: string;
}

/**
 * Apply per-category rules. Returns the monthly leak + annualized savings
 * multiplier and a human-readable reason string.
 */
function computeCategory(
  id: LeakCategoryId,
  inputs: LeakInputs,
  threshold: number,
): CategoryComputation {
  const { expenses, lifestyle, monthlyIncome } = inputs;

  switch (id) {
    case 'banking': {
      const spend = expenses.banking;
      const incomeShare = monthlyIncome > 0 ? spend / monthlyIncome : 0;
      const flagged = spend >= threshold || incomeShare > 0.005;
      return {
        currentSpend: spend,
        estimatedLeak: flagged ? spend : 0,
        savingsMultiplier: flagged ? 0.9 : 0,
        reason: flagged
          ? `You are paying ${formatMoneyRaw(spend)} in monthly banking fees — free-tier accounts are available in every market.`
          : 'Your banking fees are already in a healthy range.',
      };
    }

    case 'subscriptions': {
      const spend = expenses.subscriptions;
      const incomeCap = monthlyIncome * 0.03;
      const excess = Math.max(0, spend - incomeCap);
      const flagged = spend >= threshold || excess > 0;
      return {
        currentSpend: spend,
        estimatedLeak: flagged ? Math.max(excess, spend * 0.25) : 0,
        savingsMultiplier: flagged ? 0.5 : 0,
        reason: flagged
          ? `Subscriptions consume ${formatMoneyRaw(spend)}/mo — audit tools can typically recover 30–50%.`
          : 'Your subscription footprint is modest.',
      };
    }

    case 'creditCards': {
      const spend = expenses.creditCardInterest;
      const flagged = spend > 0;
      return {
        currentSpend: spend,
        estimatedLeak: flagged ? spend : 0,
        // 0% balance-transfer cards typically eliminate ~60% of interest
        savingsMultiplier: flagged ? 0.6 : 0,
        reason: flagged
          ? `Credit-card interest of ${formatMoneyRaw(spend)}/mo is a classic high-APR leak — balance-transfer cards cut it to 0% for 12–21 months.`
          : 'No credit-card interest detected.',
      };
    }

    case 'insurance': {
      const spend = expenses.insurance;
      const flagged = spend >= threshold && !lifestyle.comparesInsuranceAnnually;
      return {
        currentSpend: spend,
        estimatedLeak: flagged ? spend * 0.15 : 0,
        savingsMultiplier: flagged ? 0.15 : 0,
        reason: flagged
          ? `You spend ${formatMoneyRaw(spend)}/mo on insurance without annual comparison shopping — the industry average saving is 10–20%.`
          : lifestyle.comparesInsuranceAnnually
            ? 'You already compare insurance annually — good discipline.'
            : 'Your insurance spend is below the attention threshold.',
      };
    }

    case 'investing': {
      const spend = expenses.investing;
      const flagged = spend > 0 && !lifestyle.usesRoboAdvisor;
      return {
        currentSpend: spend,
        estimatedLeak: flagged ? spend : 0,
        // robo-advisors and low-cost ETFs typically recover 40% of fee drag
        savingsMultiplier: flagged ? 0.4 : 0,
        reason: flagged
          ? `${formatMoneyRaw(spend)}/mo in investment fees is a silent drag — low-fee robo-advisors and index ETFs recover most of this.`
          : lifestyle.usesRoboAdvisor
            ? 'You already use a low-fee platform — nice.'
            : 'No meaningful investment fees detected.',
      };
    }

    case 'forex': {
      const spend = expenses.forex;
      const flagged = spend >= threshold;
      return {
        currentSpend: spend,
        estimatedLeak: flagged ? spend : 0,
        // specialists collapse 2–5% FX markup to ~0.5%
        savingsMultiplier: flagged ? 0.85 : 0,
        reason: flagged
          ? `${formatMoneyRaw(spend)}/mo in FX/remittance spend is being marked up 2–5% by your bank.`
          : 'Your FX footprint is low enough to ignore.',
      };
    }
  }
}

function formatMoneyRaw(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/**
 * Compute the full leak breakdown. Pure function — deterministic for identical inputs.
 */
export function computeLeakScore(inputs: LeakInputs): LeakResult {
  const thresholds = LEAK_THRESHOLDS[inputs.market];
  const ids: LeakCategoryId[] = [
    'banking',
    'subscriptions',
    'creditCards',
    'insurance',
    'investing',
    'forex',
  ];

  const categories: LeakCategoryResult[] = ids.map((id) => {
    const def = CATEGORY_DEFINITIONS[id];
    const comp = computeCategory(id, inputs, thresholds[id]);
    const annualSavings = r2(comp.estimatedLeak * comp.savingsMultiplier * 12);
    const severityShare =
      inputs.monthlyIncome > 0 ? comp.estimatedLeak / inputs.monthlyIncome : 0;

    return {
      id,
      label: def.label,
      currentSpend: r2(comp.currentSpend),
      estimatedLeak: r2(comp.estimatedLeak),
      potentialSavings: annualSavings,
      severity: severityFromRatio(severityShare),
      reason: comp.reason,
      affiliateCategories: def.affiliateCategories,
    };
  });

  const totalMonthlyLeak = r2(
    categories.reduce((s, c) => s + c.estimatedLeak * 0, 0) +
      categories.reduce((s, c) => s + c.potentialSavings, 0) / 12,
  );
  const totalAnnualLeak = r2(categories.reduce((s, c) => s + c.potentialSavings, 0));

  const topLeaks = [...categories]
    .filter((c) => c.potentialSavings > 0)
    .sort((a, b) => b.potentialSavings - a.potentialSavings)
    .slice(0, 3)
    .map((c) => c.id);

  const overallShare =
    inputs.monthlyIncome > 0 ? totalMonthlyLeak / inputs.monthlyIncome : 0;
  const overallSeverity = severityFromRatio(overallShare);

  return {
    totalMonthlyLeak,
    totalAnnualLeak,
    categories,
    topLeaks,
    overallSeverity,
  };
}
