// lib/research/shell-logic.ts
// Pure, framework-free logic for the Research Library shell — no React, no DOM,
// no next/navigation. The client component (components/research/ResearchLibrary.tsx)
// wires these to state/URL/sessionStorage; here they stay unit-testable in the
// Node/vitest env (see __tests__/unit/research-shell-logic.test.ts). Keeping the
// risky bits (filtering, storage validation, the Cockpit handoff URL) pure means
// they're covered by fast deterministic tests, while Playwright exercises the
// real browser wiring.

export interface ResearchLibraryItemMeta {
  slug: string;
  name: string;
  status: 'audited' | 'provisional' | 'unavailable';
  confidence: 'high' | 'medium' | 'low' | null;
  /** ISO YYYY-MM-DD; only audited records carry one. */
  verifiedAt: string | null;
  score: number | null;
  rank: number | null;
  bestFor: string | null;
  tagline: string | null;
}

export interface ResearchFilters {
  /** Raw search-box value — normalized inside. */
  query: string;
  status: string | null;
  confidence: string | null;
  /** Freshness lower-bound: match verifiedAt >= this ISO date. */
  fresh: string | null;
}

export const MAX_SHORTLIST = 4;

/** Normalize a raw search value to its comparison form (trim + lowercase). */
export function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

/** True when any filter dimension is active. */
export function hasActiveFilters(filters: ResearchFilters): boolean {
  return normalizeQuery(filters.query) !== '' || !!filters.status || !!filters.confidence || !!filters.fresh;
}

/** True if a product matches ALL active filter dimensions. The query matches on
 *  name / bestFor / tagline (case-insensitive substring). */
export function matchesFilters(meta: ResearchLibraryItemMeta, filters: ResearchFilters): boolean {
  const q = normalizeQuery(filters.query);
  if (q) {
    const haystack = [meta.name, meta.bestFor, meta.tagline].filter(Boolean).join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.status && meta.status !== filters.status) return false;
  if (filters.confidence && meta.confidence !== filters.confidence) return false;
  if (filters.fresh && !(meta.verifiedAt && meta.verifiedAt >= filters.fresh)) return false;
  return true;
}

/** Toggle a slug in the shortlist, enforcing the max. Returns a NEW set;
 *  removing is always allowed, adding only below `max`. */
export function toggleShortlist(current: ReadonlySet<string>, slug: string, max = MAX_SHORTLIST): Set<string> {
  const next = new Set(current);
  if (next.has(slug)) next.delete(slug);
  else if (next.size < max) next.add(slug);
  return next;
}

/** Parse + validate a persisted shortlist. Accepts only a JSON array of strings
 *  that are KNOWN slugs; dedupes preserving first-seen order and caps at `max`.
 *  Any malformed / non-array / corrupt input yields []. */
export function restoreShortlist(raw: string | null, validSlugs: Iterable<string>, max = MAX_SHORTLIST): string[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const valid = new Set(validSlugs);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of parsed) {
    if (typeof entry !== 'string' || !valid.has(entry) || seen.has(entry)) continue;
    seen.add(entry);
    out.push(entry);
    if (out.length >= max) break;
  }
  return out;
}

/** The single Cockpit compare-handoff URL for a shortlist of >=2, else null.
 *  Encodes each slug, comma-joins them, activates the compare view and targets
 *  the #comparison anchor. The Cockpit owns ALL compare rendering — this only
 *  builds the URL its own applyUrlInit round-trips. */
export function buildCompareUrl(cockpitBase: string, slugs: string[]): string | null {
  if (slugs.length < 2) return null;
  return `${cockpitBase}?compare=${slugs.map(encodeURIComponent).join(',')}&view=compare#comparison`;
}

/** Which filter dimensions actually DIFFERENTIATE the current data (only those
 *  should render a control). Confidence + freshness consider audited rows only;
 *  freshness dates are returned newest-first. */
export function computeFacets(metas: ResearchLibraryItemMeta[]): {
  statuses: Array<ResearchLibraryItemMeta['status']>;
  confidences: Array<'high' | 'medium' | 'low'>;
  freshnessDates: string[];
} {
  const audited = metas.filter((m) => m.status === 'audited');
  const statuses = [...new Set(metas.map((m) => m.status))];
  const confidences = [...new Set(audited.map((m) => m.confidence).filter((c): c is 'high' | 'medium' | 'low' => !!c))];
  const freshnessDates = [...new Set(audited.map((m) => m.verifiedAt).filter((d): d is string => !!d))].sort().reverse();
  return { statuses, confidences, freshnessDates };
}
