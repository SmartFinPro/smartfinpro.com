// lib/money-leak/types.ts
// Money Leak Scanner — shared types across engine, API, UI, email.

import type { Market, Category } from '@/types';

export type LeakCategoryId =
  | 'banking'
  | 'subscriptions'
  | 'creditCards'
  | 'insurance'
  | 'investing'
  | 'forex';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface LeakExpenses {
  banking: number;
  subscriptions: number;
  creditCardInterest: number;
  insurance: number;
  investing: number;
  forex: number;
}

export interface LeakLifestyle {
  hasMultipleBankAccounts: boolean;
  usesRoboAdvisor: boolean;
  refinancedRecently: boolean;
  comparesInsuranceAnnually: boolean;
  investsRegularly: boolean;
}

export interface LeakInputs {
  monthlyIncome: number;
  currency: 'USD' | 'GBP' | 'CAD' | 'AUD';
  market: Market;
  expenses: LeakExpenses;
  lifestyle: LeakLifestyle;
}

export interface LeakCategoryResult {
  id: LeakCategoryId;
  label: string;
  currentSpend: number;
  estimatedLeak: number;
  potentialSavings: number; // annualized
  severity: Severity;
  reason: string;
  affiliateCategories: Category[];
}

export interface LeakResult {
  totalMonthlyLeak: number;
  totalAnnualLeak: number;
  categories: LeakCategoryResult[];
  topLeaks: LeakCategoryId[]; // sorted by potentialSavings desc
  overallSeverity: Severity;
}

export interface Recommendation {
  slug: string;
  partner_name: string;
  trackUrl: string; // /go/[slug]
  matchedCategory: LeakCategoryId;
  affiliateCategory: Category;
  projectedAnnualSavings: number;
  complianceLabel: string;
}

// ── API payload shapes ─────────────────────────────────────────────────────

export interface ScanResponse {
  ok: true;
  scanId: string;
  preview: {
    totalMonthlyLeak: number;
    totalAnnualLeak: number;
    currency: string;
    overallSeverity: Severity;
    topLeaks: Array<{
      id: LeakCategoryId;
      label: string;
      potentialSavings: number;
    }>;
  };
  recommendations: Recommendation[];
}

export interface UnlockResponse {
  ok: true;
  result: LeakResult;
  recommendations: Recommendation[];
}
