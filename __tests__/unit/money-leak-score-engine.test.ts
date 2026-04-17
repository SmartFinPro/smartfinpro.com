// __tests__/unit/money-leak-score-engine.test.ts
// Pure-function tests for the Money Leak Scanner scoring engine.

import { describe, it, expect } from 'vitest';
import { computeLeakScore } from '@/lib/money-leak/score-engine';
import type { LeakInputs } from '@/lib/money-leak/types';

function baseInputs(overrides: Partial<LeakInputs> = {}): LeakInputs {
  return {
    monthlyIncome: 5000,
    currency: 'USD',
    market: 'us',
    expenses: {
      banking: 0,
      subscriptions: 0,
      creditCardInterest: 0,
      insurance: 0,
      investing: 0,
      forex: 0,
    },
    lifestyle: {
      hasMultipleBankAccounts: false,
      usesRoboAdvisor: false,
      refinancedRecently: false,
      comparesInsuranceAnnually: false,
      investsRegularly: false,
    },
    ...overrides,
  };
}

describe('computeLeakScore', () => {
  it('returns zero leak for a squeaky-clean profile', () => {
    const r = computeLeakScore(baseInputs());
    expect(r.totalAnnualLeak).toBe(0);
    expect(r.topLeaks).toEqual([]);
    expect(r.overallSeverity).toBe('low');
  });

  it('flags banking fees above threshold and annualizes savings', () => {
    const r = computeLeakScore(
      baseInputs({
        expenses: {
          banking: 25,
          subscriptions: 0,
          creditCardInterest: 0,
          insurance: 0,
          investing: 0,
          forex: 0,
        },
      }),
    );
    const banking = r.categories.find((c) => c.id === 'banking');
    expect(banking?.estimatedLeak).toBe(25);
    // 25 * 0.9 multiplier * 12 months = 270
    expect(banking?.potentialSavings).toBe(270);
    expect(r.topLeaks[0]).toBe('banking');
  });

  it('always flags credit card interest regardless of amount', () => {
    const r = computeLeakScore(
      baseInputs({
        expenses: {
          banking: 0,
          subscriptions: 0,
          creditCardInterest: 5,
          insurance: 0,
          investing: 0,
          forex: 0,
        },
      }),
    );
    const cc = r.categories.find((c) => c.id === 'creditCards');
    expect(cc?.potentialSavings).toBeGreaterThan(0);
    expect(r.topLeaks).toContain('creditCards');
  });

  it('does NOT flag insurance when user already comparison-shops annually', () => {
    const r = computeLeakScore(
      baseInputs({
        expenses: {
          banking: 0,
          subscriptions: 0,
          creditCardInterest: 0,
          insurance: 400,
          investing: 0,
          forex: 0,
        },
        lifestyle: {
          hasMultipleBankAccounts: false,
          usesRoboAdvisor: false,
          refinancedRecently: false,
          comparesInsuranceAnnually: true,
          investsRegularly: false,
        },
      }),
    );
    const ins = r.categories.find((c) => c.id === 'insurance');
    expect(ins?.potentialSavings).toBe(0);
  });

  it('does NOT flag investing fees for robo-advisor users', () => {
    const r = computeLeakScore(
      baseInputs({
        expenses: {
          banking: 0,
          subscriptions: 0,
          creditCardInterest: 0,
          insurance: 0,
          investing: 150,
          forex: 0,
        },
        lifestyle: {
          hasMultipleBankAccounts: false,
          usesRoboAdvisor: true,
          refinancedRecently: false,
          comparesInsuranceAnnually: false,
          investsRegularly: true,
        },
      }),
    );
    const inv = r.categories.find((c) => c.id === 'investing');
    expect(inv?.potentialSavings).toBe(0);
  });

  it('sorts topLeaks by potentialSavings descending and caps to 3', () => {
    const r = computeLeakScore(
      baseInputs({
        expenses: {
          banking: 25,
          subscriptions: 300,
          creditCardInterest: 80,
          insurance: 500,
          investing: 200,
          forex: 200,
        },
      }),
    );
    expect(r.topLeaks.length).toBeLessThanOrEqual(3);
    // Verify descending order
    const savings = r.topLeaks.map(
      (id) => r.categories.find((c) => c.id === id)!.potentialSavings,
    );
    for (let i = 1; i < savings.length; i++) {
      expect(savings[i - 1]).toBeGreaterThanOrEqual(savings[i]);
    }
  });

  it('escalates overall severity as leak/income ratio grows', () => {
    const low = computeLeakScore(
      baseInputs({
        monthlyIncome: 10000,
        expenses: {
          banking: 20,
          subscriptions: 0,
          creditCardInterest: 0,
          insurance: 0,
          investing: 0,
          forex: 0,
        },
      }),
    );
    const heavy = computeLeakScore(
      baseInputs({
        monthlyIncome: 3000,
        expenses: {
          banking: 50,
          subscriptions: 400,
          creditCardInterest: 250,
          insurance: 500,
          investing: 300,
          forex: 300,
        },
      }),
    );
    const severityRank: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    expect(severityRank[heavy.overallSeverity]).toBeGreaterThan(severityRank[low.overallSeverity]);
  });

  it('is deterministic for identical inputs', () => {
    const inputs = baseInputs({
      expenses: {
        banking: 25,
        subscriptions: 120,
        creditCardInterest: 40,
        insurance: 250,
        investing: 100,
        forex: 80,
      },
    });
    const a = computeLeakScore(inputs);
    const b = computeLeakScore(inputs);
    expect(a).toEqual(b);
  });

  it('uses market-specific thresholds (UK has tighter subscription threshold)', () => {
    const us = computeLeakScore(
      baseInputs({
        market: 'us',
        expenses: {
          banking: 0,
          subscriptions: 70,
          creditCardInterest: 0,
          insurance: 0,
          investing: 0,
          forex: 0,
        },
      }),
    );
    const uk = computeLeakScore(
      baseInputs({
        market: 'uk',
        expenses: {
          banking: 0,
          subscriptions: 70,
          creditCardInterest: 0,
          insurance: 0,
          investing: 0,
          forex: 0,
        },
      }),
    );
    // UK threshold is 60, US is 80 → UK flags, US doesn't
    const usSubs = us.categories.find((c) => c.id === 'subscriptions')!;
    const ukSubs = uk.categories.find((c) => c.id === 'subscriptions')!;
    expect(ukSubs.potentialSavings).toBeGreaterThan(0);
    expect(usSubs.potentialSavings).toBe(0);
  });
});
