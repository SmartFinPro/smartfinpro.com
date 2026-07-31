// lib/comparison/topics/types.ts
// Per-topic configuration contract for the Comparison Cockpit. Pure types +
// pure accessor functions only — no React, no server imports. Imported by both
// the server route and the 'use client' Cockpit components.

import type { ZodType } from 'zod';
import type { ProductForComparison } from '@/lib/comparison/types';

/** A headline spec cell shown on each card + as a sortable Table column. */
export interface SpecColumn {
  key: string;
  label: string;
  accessor: (p: ProductForComparison) => string | number | null;
  /** How to render the accessor value. */
  format: (v: string | number | null) => string;
  /** Which extreme is "best" (gets the green winner highlight). Omit for non-comparable. */
  winner?: 'min' | 'max';
  /** sortOptions value this column maps to (makes the Table header clickable). */
  sortKey?: string;
}

/** A boolean filter pill (AND-combined). */
export interface FilterDef {
  key: string;
  label: string;
  predicate: (p: ProductForComparison) => boolean;
}

/** A sort option for the dropdown. `cost` is special-cased in orderProducts. */
export interface SortOption {
  value: string;
  label: string;
  /** Higher = ranked first (unless `dir: 'asc'`). */
  metric: (p: ProductForComparison) => number;
  dir?: 'asc' | 'desc';
}

/** An "In a hurry?" quick-sort chip. */
export interface IntentDef {
  id: string;
  label: string;
  /** lucide-react icon component name resolved by the decision bar. */
  icon: string;
  sort: string;
}

/** A row in the side-by-side compare matrix. */
export interface CompareRow {
  key: string;
  label: string;
  accessor: (p: ProductForComparison) => string;
  /** Higher = better; the top-scoring cell(s) win the green highlight. Omit = no winner. */
  score?: (p: ProductForComparison) => number;
}

/** A spec row shown inside "View details". */
export interface DetailRow {
  key: string;
  label: string;
  accessor: (p: ProductForComparison) => string;
}

/**
 * Live cost model.
 * - `compounding-fee` = robo (mgmt fee on a growing balance, compounds over years).
 * - `banking` = legacy annual cost × years.
 * - `fee-on-amount` = one-time settlement-style fee (fee% × amount), independent
 *   of years (e.g. debt-relief: a % of the enrolled debt, not a recurring charge).
 * - `monthly-plus-setup` = flat monthly subscription + a one-time setup/first-work
 *   fee (e.g. credit repair). The generic `amount` slider is repurposed as a
 *   MONTHS dial for this kind (not a dollar amount) — `years` is unused, same as
 *   `fee-on-amount` leaves it unused.
 */
export interface CostModelDef {
  kind: 'compounding-fee' | 'banking' | 'fee-on-amount' | 'monthly-plus-setup';
  growthRate?: number; // e.g. 0.06
  /** `fee-on-amount` only: fee % source. Defaults to `p.managementFee` when omitted. */
  feeAccessor?: (p: Pick<ProductForComparison, 'managementFee' | 'attributes'>) => number | null;
  /**
   * `fee-on-amount` only: a fixed dollar total, independent of the amount
   * slider — for providers whose real cost is NOT a % of the enrolled balance
   * (e.g. a non-profit debt-management plan charging setup + monthly fees).
   * Takes precedence over `feeAccessor`/`managementFee` when it returns a
   * non-null number, so their true cost is shown instead of a misleading $0.
   */
  flatFeeAccessor?: (p: Pick<ProductForComparison, 'managementFee' | 'attributes'>) => number | null;
  /**
   * `monthly-plus-setup` only: one-time setup/first-work fee. Defaults to 0
   * when omitted. The recurring fee always comes from `p.monthlyFee`.
   */
  setupFeeAccessor?: (p: Pick<ProductForComparison, 'attributes'>) => number | null;
  /**
   * Optional static label for the live-cost cell/column/row (e.g. "Spread
   * cost", "Est. broker fee"). Without it, formatCostLabel
   * (lib/comparison/money.ts) derives a per-kind default — set this for
   * `fee-on-amount` topics where "Cost on volume" is too generic.
   */
  costLabel?: string;
  amountLabel: string;
  amountMin: number;
  amountMax: number;
  amountStep: number;
  amountDefault: number;
  yearsLabel: string;
  yearsMin: number;
  yearsMax: number;
  yearsDefault: number;
}

/** A weighted "Find my match" question. */
export interface MatcherQuestionDef {
  id: string;
  label: string;
  weight: number;
  options: { value: string; label: string }[];
  /** null = neutral (no scoring effect); {matched,reason} otherwise. */
  award: (p: ProductForComparison, answer: string) => { matched: boolean; reason?: string } | null;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** Everything that makes a "Best X" page differ from another. New page = new config. */
export interface TopicConfig {
  slug: string;
  category: string;
  label: string;
  h1: (year: number) => string;
  metaTitle: (year: number) => string;
  metaDescription: (year: number) => string;
  intro: string;
  /** ISO YYYY-MM-DD — the page's first-published date (Article publishDate). */
  publishedDate: string;
  /** Zod schema for the `attributes` JSONB blob — validated per row in the loader. */
  attributesSchema: ZodType;
  specColumns: SpecColumn[];
  filters: FilterDef[];
  priorityChips: IntentDef[];
  matcher: MatcherQuestionDef[];
  sortOptions: SortOption[];
  costModel: CostModelDef;
  compareRows: CompareRow[];
  detailRows: DetailRow[];
  // SEO/AEO content (Tier 1/3 — surfaced in Phase C; carried here now).
  verdict: { intro: string; picks: { slug: string; label: string }[] };
  methodology: string;
  buyerGuide: { h3: string; body: string }[];
  faq: FaqItem[];
  compliance: { notice: string; regulators: string[] };
  /**
   * External authority references (regulator registers, official protection-
   * limit / fee-disclosure pages) rendered as a compact "Sources & references"
   * list in CockpitBody (SEO addendum §8). Each link must support a concrete
   * claim on the page — never a bare homepage link.
   */
  sources?: { label: string; url: string }[];
  /**
   * Suppress every star-rating surface for this topic.
   *
   * The cockpit renders two different things side by side: the ranking, which
   * comes from the audited SmartFinPro score (0-10), and star ratings plus
   * review counts, which come from the generic `rating` / `review_count`
   * columns in product_attributes. Those columns carry no provenance — no
   * source, no source URL, no as-of date, no market scope — and on
   * us/trading they contradict the ranking outright: Fidelity leads at 9.6
   * while showing 4.5 stars above Interactive Brokers' 4.8.
   *
   * Set this where the numbers cannot be attributed, and the cockpit drops
   * the star block and review count on the cards, the Rating column and its
   * sort, the "Our rating" compare row, the stars in the verdict CTA, the
   * "Top rated" chip and the "Best rated" sort option. The audited score is
   * untouched and keeps driving the ranking.
   *
   * Deliberately opt-in per topic rather than a global default: other
   * categories can carry genuinely sourced ratings, and flipping the default
   * would blank all 38 topics silently.
   *
   * To bring ratings back, the data needs full provenance first — source,
   * source URL, as-of date, market/scope, and rating plus count as nullable
   * fields — after which this flag comes off.
   */
  ratingsUnsourced?: boolean;
  /**
   * Internal related links (category pillar, tools/calculators, methodology,
   * existing reviews) rendered in CockpitBody (SEO addendum §7). Canonical
   * site-relative hrefs only — no redirecting/legacy variants.
   */
  relatedLinks?: { label: string; href: string }[];
}

/* --- Rating-provenance accessors -------------------------------------- *
 * Single place that decides whether a rating-driven control is offered.
 * Every render site AND orderProducts go through these, so a `?sort=rating`
 * URL cannot resurrect a suppressed sort. Topics keep their definitions —
 * they are filtered at read time, not deleted from 38 config files. */

/** Sort options the user may pick — rating sorts drop out where unsourced. */
export function visibleSortOptions(config: TopicConfig): SortOption[] {
  if (!config.ratingsUnsourced) return config.sortOptions;
  return config.sortOptions.filter((o) => o.value !== 'rating');
}

/** "In a hurry?" chips — those that trigger a rating sort drop out too. */
export function visiblePriorityChips(config: TopicConfig): IntentDef[] {
  if (!config.ratingsUnsourced) return config.priorityChips;
  return config.priorityChips.filter((c) => c.sort !== 'rating');
}
