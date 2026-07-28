// __tests__/unit/research-quick-finder-tracking.test.ts
// PR 5 gap-close (this task, docs/research-library/analytics-research-v1.md):
// the Homepage Quick Finder's category chip previously had no legal
// ResearchFacet value to report through `trackFilterChange` — Task 6
// (unified-research-discovery-pr2-hubs plan) only ever wired
// 'status'|'confidence'|'fresh'. This proves the pure computation
// `resolveCategoryFilterChange` (components/research/QuickFinder.tsx, exported
// the same way ResearchHub.tsx exports resolveShortlistToggleAnalytics /
// resolveConfirmSwitchAnalytics / trackedDimensionsFor) always derives the
// EXACT research_filter_change args a category chip click now sends:
// facet: 'category', the selected value, active, and the post-filter
// resultCount — computed via a REAL re-filter of `finderResults`
// (lib/research/catalog-shell-logic.ts), not read off the count already on
// screen, and capped at the SAME six-card limit the visible grid uses.
//
// QuickFinder is a 'use client' component with no DOM-free render seam in
// this repo's vitest setup (environment: 'node', no jsdom/
// @testing-library/react — see research-hub-tracking.test.ts's own header for
// the identical constraint on ResearchHub). That means this file can prove
// the EVENT SHAPE a category selection produces, but not that a real chip
// click actually invokes this function exactly once and no more — that
// wiring proof needs a real browser and is Task 4's e2e job (mirroring how
// e2e/research-tracking.spec.ts's "a filter chip sends..." test is what
// actually proves the Hub's own status/confidence/fresh chips fire on click,
// not any unit test in this file).

import { describe, expect, it } from 'vitest';
import { resolveCategoryFilterChange } from '@/components/research/QuickFinder';
import type { DiscoveryItem } from '@/lib/research/catalog-shell-logic';
import type { Category } from '@/lib/i18n/config';

const makeItem = (category: Category, index: number, searchText?: string): DiscoveryItem => ({
  id: `review:/us/${category}/provider-${index}-review`,
  market: 'us',
  category,
  review: {
    slug: `provider-${index}-review`,
    href: `/us/${category}/provider-${index}-review`,
    title: `Provider ${index}`,
    description: `Provider ${index} description`,
    bestFor: null,
    editorialRating: 4.5,
    publishDate: '2026-06-01',
    modifiedDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    readingWords: 2000,
    featured: false,
    pricing: null,
  },
  display: {
    title: `Provider ${index}`,
    description: `Provider ${index} description`,
    bestFor: null,
    searchText: searchText ?? `provider ${index} ${category}`,
    sortDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
  },
  researchContexts: [],
});

describe('resolveCategoryFilterChange (QuickFinder, PR 5 gap-close)', () => {
  it('reports facet: category, the selected value, active: true, and the post-filter result count', () => {
    const trading = [0, 1, 2].map((i) => makeItem('trading', i));
    const personalFinance = [0, 1].map((i) => makeItem('personal-finance', i));
    const items = [...trading, ...personalFinance];

    const change = resolveCategoryFilterChange(items, { query: '', category: null }, 'trading');

    // Independent witness: exactly the 3 'trading' fixtures above, counted by
    // construction — not read back from the function under test.
    expect(change).toEqual({ facet: 'category', value: 'trading', active: true, resultCount: 3 });
  });

  it('reports active: false and a null value when the category is cleared', () => {
    const trading = [0, 1, 2].map((i) => makeItem('trading', i));
    const personalFinance = [0, 1].map((i) => makeItem('personal-finance', i));
    const items = [...trading, ...personalFinance];

    const change = resolveCategoryFilterChange(items, { query: '', category: 'trading' }, null);

    expect(change.facet).toBe('category');
    expect(change.value).toBeNull();
    expect(change.active).toBe(false);
    // All 5 fixtures, under the 6-card cap.
    expect(change.resultCount).toBe(5);
  });

  it('caps the result count at six — the SAME limit the visible Finder grid uses, never the uncapped match total', () => {
    const trading = Array.from({ length: 8 }, (_, i) => makeItem('trading', i));

    const change = resolveCategoryFilterChange(trading, { query: '', category: null }, 'trading');

    expect(change.resultCount).toBe(6);
  });

  it('intersects the category change with an active search query, never just the category alone', () => {
    const items = [
      makeItem('trading', 0, 'acme broker trading'),
      makeItem('trading', 1, 'zenith trading'),
      makeItem('personal-finance', 2, 'acme robo advisor'),
    ];

    const change = resolveCategoryFilterChange(items, { query: 'acme', category: null }, 'trading');

    // Independent witness: only item 0 matches BOTH category:'trading' AND
    // the 'acme' query — item 1 is trading but doesn't match the query, item
    // 2 matches the query but is a different category.
    expect(change.resultCount).toBe(1);
  });
});
