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

/** Topic-specific score dimensions (e.g. fees/features/ux/support for most
 *  topics, but trust/rating/coverage for mortgage brokers, cost/panel/
 *  rating/independence for remortgage brokers, etc.) — rendered dynamically,
 *  not assumed to be a fixed 4-key shape. */
export type SubScores = Record<string, number>;

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
  /** Primary source URL backing this row's attribute data (drives the
   *  "Sources & references" list in CockpitBody). */
  sourceUrl: string | null;
  dataVerifiedAt: string | null; // ISO date (YYYY-MM-DD) of last source re-verification
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

/**
 * DecisionBridge ("Market Check") — the data contract for the review-article
 * → cockpit bridge (see docs/superpowers/specs/2026-07-17-cockpit-bridge-design.md,
 * V15 section). Defined here (not in lib/comparison/bridge.ts, which is
 * `server-only`) so components/marketing/decision-bridge.tsx can `import type`
 * without any risk of pulling a server-only module into the client bundle
 * (memory: client-server-action-import-dashboard — a value import from a
 * server module hangs Suspense with no crash).
 *
 * Every field is either a straight passthrough of one already-validated
 * `ProductForComparison` value, or a plain aggregate (max/min/count/filter)
 * over the field. Deliberately excludes `bestFor` / `pros` / `cons` /
 * `deepDive` — those DB fields are unaudited (Task 10 blocker) and must
 * never surface through this bridge.
 */
export interface DecisionBridgeFieldRow {
  /** 1-indexed — same order getCockpitData already returns (Smart Rank, top pick pinned). */
  rank: number;
  name: string;
  score: number;
  /** Internal review link, or null when that competitor has no review yet
   *  (rendered as plain text, never a dead link). Never `/go`. */
  reviewHref: string | null;
  /** True for the row matching the article being read. */
  isYou: boolean;
}

export interface DecisionBridgeData {
  market: string;
  category: string;
  topic: string;
  topicLabel: string;
  cockpitHref: string;
  fieldCount: number;
  leader: { name: string; score: number };
  scoreMin: number;
  scoreMax: number;
  /** Max `dataVerifiedAt` across the field, ISO YYYY-MM-DD, or null if none set. */
  lastVerified: string | null;
  officialSourceCount: number;
  /** Count per confidence level across the field. Null confidences count nowhere. */
  confidenceMix: { high: number; medium: number; low: number };
  /** Full field in Smart-Rank order — powers the ranking strip. */
  field: DecisionBridgeFieldRow[];
  /** Per sub-score key, the max value seen across the whole field — powers
   *  the "View score details" comparison column. Empty object if no product
   *  in the field has any sub-scores. */
  fieldBestSubScores: Record<string, number>;
  /** null when the reviewed article's product is not in this cockpit's field
   *  (renders "Zustand B" — field-at-a-glance instead of a rank line). */
  position: {
    rank: number;
    /** product_attributes.slug — for analytics only, never rendered as a link. */
    slug: string;
    name: string;
    score: number;
    subScores: SubScores;
    confidence: 'high' | 'medium' | 'low' | null;
    dataVerifiedAt: string | null;
    isTopPick: boolean;
  } | null;
}
