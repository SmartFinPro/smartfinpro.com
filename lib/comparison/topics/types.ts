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
 */
export interface CostModelDef {
  kind: 'compounding-fee' | 'banking' | 'fee-on-amount';
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
}
