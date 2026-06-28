// lib/comparison/types.ts
// Pure types for the Comparison Engine. No React / no server imports —
// safe to import from both Server Components and 'use client' components.

import type { Market, Category } from '@/lib/i18n/config';

export type CtaMode = 'offer' | 'review' | 'visit';

export type FilterKey =
  | 'noMonthly'
  | 'freeAtm'
  | 'noFx'
  | 'cashback'
  | 'bonus'
  | 'subAccounts'
  | 'interest'
  | 'applePay';

export type SortKey = 'smart' | 'cost' | 'rating' | 'bonus' | 'apy' | 'team' | 'travel';

export interface Usage {
  /** Foreign spend per month (currency units) */
  fxSpend: number;
  /** ATM withdrawals per month */
  atmCount: number;
}

export interface SubScores {
  fees: number;
  features: number;
  ux: number;
  support: number;
}

export interface Badge {
  type: 'gold' | 'green' | 'sky';
  label: string;
}

/**
 * Immutable, already-normalized provider shape passed from the server page
 * to the client engine. All numeric fields are real `number`s (Supabase
 * returns DECIMAL as string — the loader coerces before this type is built).
 */
export interface ProductForComparison {
  slug: string;
  displayName: string;
  initial: string;
  tagline: string;
  logoUrl: string | null;
  verified: boolean;

  // Ranking inputs
  score: number; // 0-10 editorial (drives smartRank)
  rating: number; // 0-5 Trustpilot star (display)
  reviewCount: number;
  monthlyFee: number;
  signupBonus: number;
  fxFeePct: number;
  atmFee: number;
  apy: number;
  clicks: number;

  // Display
  badges: Badge[];
  chips: string[];
  pros: string[];
  cons: string[];
  subScores: SubScores;
  effectiveApr: string | null;
  cashback: string | null;
  cardNetwork: string | null;
  wireTransfers: string | null;
  fdicCoverage: string | null;
  apps: string[];
  verdict: string | null;

  // Stored filter flags
  flags: Record<FilterKey, boolean>;

  // Matcher dimensions
  entityTypes: string[];
  supportsCashDeposits: boolean;
  supportsIntlWires: boolean;
  hasBookkeeping: boolean;
  hasLending: boolean;
  hasSubAccounts: boolean;
  integrations: string[];

  // CTA gating
  ctaMode: CtaMode;
  reviewSlug: string | null;
  externalUrl: string | null;

  isTopPick: boolean;
  bestFor: string | null;
  displayOrder: number;

  // Generic topic fields (Comparison Cockpit) — banking rows default these.
  topic: string;
  managementFee: number;
  accountMinimum: number;
  attributes: Record<string, unknown>;
  deepDive: string | null;
  sourceType: 'official' | 'regulator' | 'editorial' | 'user_reviews' | null;
  confidence: 'high' | 'medium' | 'low' | null;
  /**
   * Attribution transparency for analytics:
   * 'verified' = click_id can return a conversion (full S2S);
   * 'dashboard_only' = monetized but NO click-id conversion attribution;
   * null = not a monetized offer.
   */
  offerAttribution: 'verified' | 'dashboard_only' | null;

  market: Market;
  category: Category;
}

export interface MatcherAnswers {
  [questionId: string]: string;
}
