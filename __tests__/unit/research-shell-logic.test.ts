// __tests__/unit/research-shell-logic.test.ts
// Unit tests for the pure Research Library shell logic (lib/research/shell-logic).
// No DOM / no React / no new deps — Playwright covers the browser wiring; here
// we pin the risky deterministic bits: the filter predicate, query
// normalisation, the shortlist toggle + max-4 rule, sessionStorage validation
// (invalid JSON / duplicates / unknown slugs / overflow) and the Cockpit
// handoff URL.

import { describe, it, expect } from 'vitest';
import {
  MAX_SHORTLIST,
  normalizeQuery,
  hasActiveFilters,
  matchesFilters,
  toggleShortlist,
  restoreShortlist,
  buildCompareUrl,
  computeFacets,
  type ResearchLibraryItemMeta,
} from '@/lib/research/shell-logic';

const meta = (over: Partial<ResearchLibraryItemMeta> = {}): ResearchLibraryItemMeta => ({
  slug: 'fidelity',
  name: 'Fidelity',
  status: 'audited',
  confidence: 'high',
  verifiedAt: '2026-07-03',
  score: 9.6,
  rank: 1,
  bestFor: 'Best overall',
  tagline: 'Zero fees, automatic cash yield',
  ...over,
});

const NONE = { query: '', status: null, confidence: null, fresh: null } as const;

describe('normalizeQuery', () => {
  it('trims and lowercases', () => {
    expect(normalizeQuery('  Fidelity  ')).toBe('fidelity');
    expect(normalizeQuery('E*TRADE')).toBe('e*trade');
  });
  it('collapses whitespace-only to empty', () => {
    expect(normalizeQuery('   ')).toBe('');
    expect(normalizeQuery('')).toBe('');
  });
});

describe('hasActiveFilters', () => {
  it('false when nothing is set (whitespace query counts as empty)', () => {
    expect(hasActiveFilters(NONE)).toBe(false);
    expect(hasActiveFilters({ ...NONE, query: '   ' })).toBe(false);
  });
  it('true for any active dimension', () => {
    expect(hasActiveFilters({ ...NONE, query: 'x' })).toBe(true);
    expect(hasActiveFilters({ ...NONE, status: 'audited' })).toBe(true);
    expect(hasActiveFilters({ ...NONE, confidence: 'high' })).toBe(true);
    expect(hasActiveFilters({ ...NONE, fresh: '2026-01-01' })).toBe(true);
  });
});

describe('matchesFilters', () => {
  it('query matches name / bestFor / tagline, case-insensitively', () => {
    const schwab = meta({ name: 'Charles Schwab', bestFor: 'Best all-in-one', tagline: 'thinkorswim' });
    expect(matchesFilters(schwab, { ...NONE, query: 'schwab' })).toBe(true);
    expect(matchesFilters(schwab, { ...NONE, query: 'ALL-IN-ONE' })).toBe(true);
    expect(matchesFilters(schwab, { ...NONE, query: 'thinkorswim' })).toBe(true);
    expect(matchesFilters(schwab, { ...NONE, query: 'robinhood' })).toBe(false);
  });
  it('status filter is exact', () => {
    expect(matchesFilters(meta({ status: 'audited' }), { ...NONE, status: 'audited' })).toBe(true);
    expect(matchesFilters(meta({ status: 'audited' }), { ...NONE, status: 'provisional' })).toBe(false);
  });
  it('confidence filter is exact and null never matches', () => {
    expect(matchesFilters(meta({ confidence: 'medium' }), { ...NONE, confidence: 'medium' })).toBe(true);
    expect(matchesFilters(meta({ confidence: 'high' }), { ...NONE, confidence: 'medium' })).toBe(false);
    expect(matchesFilters(meta({ confidence: null }), { ...NONE, confidence: 'high' })).toBe(false);
  });
  it('freshness is a >= lower bound; a record without a verified date never passes', () => {
    expect(matchesFilters(meta({ verifiedAt: '2026-07-03' }), { ...NONE, fresh: '2026-07-01' })).toBe(true);
    expect(matchesFilters(meta({ verifiedAt: '2026-07-03' }), { ...NONE, fresh: '2026-07-03' })).toBe(true);
    expect(matchesFilters(meta({ verifiedAt: '2026-06-30' }), { ...NONE, fresh: '2026-07-01' })).toBe(false);
    expect(matchesFilters(meta({ verifiedAt: null }), { ...NONE, fresh: '2026-07-01' })).toBe(false);
  });
  it('all active dimensions must pass (AND)', () => {
    const m = meta({ name: 'eToro', status: 'provisional', confidence: null });
    expect(matchesFilters(m, { query: 'etoro', status: 'provisional', confidence: null, fresh: null })).toBe(true);
    expect(matchesFilters(m, { query: 'etoro', status: 'audited', confidence: null, fresh: null })).toBe(false);
  });
});

describe('toggleShortlist', () => {
  it('adds to an empty set and returns a new set (immutable)', () => {
    const start = new Set<string>();
    const next = toggleShortlist(start, 'fidelity');
    expect([...next]).toEqual(['fidelity']);
    expect(start.size).toBe(0);
  });
  it('removes a slug that is already present', () => {
    expect([...toggleShortlist(new Set(['a', 'b']), 'a')]).toEqual(['b']);
  });
  it('does NOT add beyond the max, but removal at capacity is always allowed', () => {
    const full = new Set(['a', 'b', 'c', 'd']);
    expect(full.size).toBe(MAX_SHORTLIST);
    expect([...toggleShortlist(full, 'e')]).toEqual(['a', 'b', 'c', 'd']); // blocked
    expect([...toggleShortlist(full, 'b')]).toEqual(['a', 'c', 'd']); // remove ok
  });
});

describe('restoreShortlist', () => {
  const valid = ['fidelity', 'etoro', 'charles-schwab', 'webull', 'robinhood'];
  it('returns [] for null / invalid JSON / non-array', () => {
    expect(restoreShortlist(null, valid)).toEqual([]);
    expect(restoreShortlist('not json', valid)).toEqual([]);
    expect(restoreShortlist('{"a":1}', valid)).toEqual([]);
    expect(restoreShortlist('"fidelity"', valid)).toEqual([]);
  });
  it('keeps only known slugs, dropping unknowns and non-strings', () => {
    expect(restoreShortlist('["fidelity","bogus","etoro"]', valid)).toEqual(['fidelity', 'etoro']);
    expect(restoreShortlist('[1,"fidelity",null,{"x":1}]', valid)).toEqual(['fidelity']);
  });
  it('dedupes preserving first-seen order', () => {
    expect(restoreShortlist('["etoro","fidelity","etoro"]', valid)).toEqual(['etoro', 'fidelity']);
  });
  it('caps at the max even when more valid slugs are stored', () => {
    const restored = restoreShortlist(JSON.stringify(valid), valid); // 5 valid slugs
    expect(restored).toHaveLength(MAX_SHORTLIST);
    expect(restored).toEqual(valid.slice(0, MAX_SHORTLIST));
  });
});

describe('buildCompareUrl', () => {
  const base = '/us/trading/best/trading-platforms';
  it('returns null for fewer than two products', () => {
    expect(buildCompareUrl(base, [])).toBeNull();
    expect(buildCompareUrl(base, ['fidelity'])).toBeNull();
  });
  it('builds the comma-joined compare handoff with view + #comparison anchor', () => {
    expect(buildCompareUrl(base, ['fidelity', 'charles-schwab'])).toBe(
      '/us/trading/best/trading-platforms?compare=fidelity,charles-schwab&view=compare#comparison',
    );
  });
  it('url-encodes each slug', () => {
    expect(buildCompareUrl(base, ['a b', 'c&d'])).toBe(
      '/us/trading/best/trading-platforms?compare=a%20b,c%26d&view=compare#comparison',
    );
  });
  it('handles the full shortlist of four', () => {
    expect(buildCompareUrl(base, ['a', 'b', 'c', 'd'])).toContain('compare=a,b,c,d&view=compare#comparison');
  });
});

describe('computeFacets', () => {
  it('returns only dimensions present, audited-scoped for confidence/freshness', () => {
    const metas = [
      meta({ slug: 'fidelity', status: 'audited', confidence: 'high', verifiedAt: '2026-07-03' }),
      meta({ slug: 'schwab', status: 'audited', confidence: 'medium', verifiedAt: '2026-07-03' }),
      meta({ slug: 'etoro', status: 'provisional', confidence: null, verifiedAt: null }),
    ];
    const f = computeFacets(metas);
    expect(f.statuses.sort()).toEqual(['audited', 'provisional']);
    expect(f.confidences.sort()).toEqual(['high', 'medium']);
    expect(f.freshnessDates).toEqual(['2026-07-03']); // provisional's null excluded
  });
  it('a non-differentiating dimension collapses to a single value (so the UI hides it)', () => {
    const metas = [
      meta({ slug: 'a', confidence: 'high', verifiedAt: '2026-07-03' }),
      meta({ slug: 'b', confidence: 'high', verifiedAt: '2026-07-03' }),
    ];
    const f = computeFacets(metas);
    expect(f.confidences).toEqual(['high']); // length 1 → caller hides the filter
    expect(f.freshnessDates).toEqual(['2026-07-03']);
  });
  it('sorts freshness dates newest-first', () => {
    const metas = [
      meta({ slug: 'a', verifiedAt: '2026-06-01' }),
      meta({ slug: 'b', verifiedAt: '2026-07-03' }),
      meta({ slug: 'c', verifiedAt: '2026-05-10' }),
    ];
    expect(computeFacets(metas).freshnessDates).toEqual(['2026-07-03', '2026-06-01', '2026-05-10']);
  });
});
