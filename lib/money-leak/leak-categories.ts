// lib/money-leak/leak-categories.ts
// Per-market benchmarks + metadata for each leak category.

import type { Market, Category } from '@/types';
import type { LeakCategoryId } from './types';

export interface CategoryDefinition {
  id: LeakCategoryId;
  label: string;
  /** Affiliate categories to match against, in priority order */
  affiliateCategories: Category[];
  /** Primary description used on the recommendation card */
  problem: string;
}

export const CATEGORY_DEFINITIONS: Record<LeakCategoryId, CategoryDefinition> = {
  banking: {
    id: 'banking',
    label: 'Banking Fees',
    affiliateCategories: ['business-banking', 'personal-finance'],
    problem: 'Monthly account fees, overdraft charges, and ATM fees eat into your balance.',
  },
  subscriptions: {
    id: 'subscriptions',
    label: 'Subscriptions',
    affiliateCategories: ['personal-finance', 'ai-tools'],
    problem: 'Unused streaming, SaaS, and auto-renewing subscriptions silently pile up each month.',
  },
  creditCards: {
    id: 'creditCards',
    label: 'Credit Card Interest',
    affiliateCategories: ['debt-relief', 'credit-repair', 'personal-finance'],
    problem: 'High-APR balances compound — a balance transfer or refinance dramatically cuts interest.',
  },
  insurance: {
    id: 'insurance',
    label: 'Insurance Premiums',
    affiliateCategories: ['personal-finance'],
    problem: 'Insurance premiums drift upward if you don\'t actively shop — switching providers typically saves 10–20%.',
  },
  investing: {
    id: 'investing',
    label: 'Investment Fees',
    affiliateCategories: ['trading', 'ai-tools', 'personal-finance'],
    problem: 'Advisor and fund fees of 1%+ silently reduce long-term returns by 20–30% over decades.',
  },
  forex: {
    id: 'forex',
    label: 'FX & Remittance',
    affiliateCategories: ['forex', 'personal-finance'],
    problem: 'Banks mark up exchange rates 2–5% vs mid-market — specialists like Wise/Revolut compress this to near-zero.',
  },
};

/**
 * Per-market monthly thresholds above which each category is considered a leak.
 * Calibrated roughly to cost-of-living + typical household spend.
 */
export const LEAK_THRESHOLDS: Record<Market, Record<LeakCategoryId, number>> = {
  us: {
    banking: 15,
    subscriptions: 80,
    creditCards: 20,
    insurance: 200,
    investing: 50,
    forex: 50,
  },
  uk: {
    banking: 10,
    subscriptions: 60,
    creditCards: 15,
    insurance: 150,
    investing: 40,
    forex: 40,
  },
  ca: {
    banking: 15,
    subscriptions: 80,
    creditCards: 20,
    insurance: 180,
    investing: 45,
    forex: 50,
  },
  au: {
    banking: 10,
    subscriptions: 75,
    creditCards: 18,
    insurance: 180,
    investing: 45,
    forex: 50,
  },
};

export function getCategoryDefinition(id: LeakCategoryId): CategoryDefinition {
  return CATEGORY_DEFINITIONS[id];
}
