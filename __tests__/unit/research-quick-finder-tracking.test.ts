// __tests__/unit/research-quick-finder-tracking.test.ts
// PR 5 gap-close (docs/research-library/analytics-research-v1.md): the
// Homepage Quick Finder's category chip previously had no legal ResearchFacet
// value to report through `trackFilterChange` — Task 6
// (unified-research-discovery-pr2-hubs plan) only ever wired
// 'status'|'confidence'|'fresh'. This proves the pure computation
// `resolveCategoryFilterChange` (components/research/QuickFinder.tsx, exported
// the same way ResearchHub.tsx exports resolveShortlistToggleAnalytics /
// resolveConfirmSwitchAnalytics / trackedDimensionsFor) always derives the
// EXACT research_filter_change args a category chip click now sends:
// facet: 'category', the selected value, active, and the post-filter
// resultCount.
//
// PR 3 review fix (spec §15 invariant 13, "Hero, Facetten, CTA und Events
// melden konsistente Counts"): `resultCount` is the HONEST, UNCAPPED match
// total (`computeFinderCounts(...).totalMatches`, lib/research/
// catalog-shell-logic.ts) — never the six-card-capped `finderResults(...)
// .length` the visible grid renders. Before this fix, a query matching 40
// items and one matching 6 both reported `resultCount: 6`, which was
// indistinguishable in analytics and undersold the true match count. The
// matrix below (0, 1, fewer-than-six, exactly-six, more-than-six) proves
// `resultCount` tracks the real total at every one of those boundaries —
// exactly-six in particular must NOT look like a coincidental "still capped"
// case: it is 6 because there are genuinely only 6 matches, not because a cap
// silently kicked in.
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
    // All 5 fixtures — under the render cap, so total and visible coincide.
    expect(change.resultCount).toBe(5);
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

  // PR 3 review fix: the full boundary matrix (0, 1, fewer than six, exactly
  // six, more than six matches). `resultCount` must equal the TRUE match
  // count at every point — never the six-card render cap.
  it.each([
    [0, 0],
    [1, 1],
    [5, 5],
    [6, 6],
    [9, 9],
  ])('with %i matching "trading" items, resultCount is the true total (%i), never capped at six', (matchCount, expectedResultCount) => {
    const trading = Array.from({ length: matchCount }, (_, i) => makeItem('trading', i));

    const change = resolveCategoryFilterChange(trading, { query: '', category: null }, 'trading');

    expect(change.resultCount).toBe(expectedResultCount);
  });

  it('above six matches, resultCount is the true uncapped total — never the six-card render cap', () => {
    const trading = Array.from({ length: 8 }, (_, i) => makeItem('trading', i));

    const change = resolveCategoryFilterChange(trading, { query: '', category: null }, 'trading');

    // Independent witness: 8 fixtures constructed above, all category
    // 'trading' — the true match count is 8, even though the visible Finder
    // grid would only ever render 6 of them.
    expect(change.resultCount).toBe(8);
  });
});
