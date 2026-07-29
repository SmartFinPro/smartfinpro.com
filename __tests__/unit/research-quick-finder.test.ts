// __tests__/unit/research-quick-finder.test.ts
// Homepage Quick Finder render contract (research-discovery-pr3 plan, Task 3;
// spec §9.3). `QuickFinder` is a 'use client' component but still renders
// synchronously from its initial `useState`/`useMemo` values, so
// `renderToStaticMarkup` captures the exact same six-or-fewer card markup a
// crawler (or a JS-disabled visitor) sees in the server-rendered HTML — same
// idiom as research-catalog-card.test.ts, next/link mocked so it never needs
// a real Next.js router context.
//
// HONESTY rules this file guards (never relax — spec §9.1/§9.3, same as
// CatalogCard): no star icon, no `reviewCount`, no nested anchors.

import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { DiscoveryItem } from '@/lib/research/catalog-shell-logic';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ href, children, ...rest }: any) =>
      createElement('a', { href: typeof href === 'string' ? href : href?.pathname ?? '#', ...rest }, children),
  };
});

// Imported AFTER the mock is registered.
import { QuickFinder } from '@/components/research/QuickFinder';

// --- fixtures ----------------------------------------------------------------

const makeFinderItem = (index: number): DiscoveryItem => ({
  id: `review:/us/trading/provider-${index}-review`,
  market: 'us',
  category: 'trading',
  review: {
    slug: `provider-${index}-review`,
    href: `/us/trading/provider-${index}-review`,
    title: `Provider ${index} Review`,
    description: `Provider ${index} description`,
    bestFor: null,
    editorialRating: 4.5,
    publishDate: '2026-06-01',
    modifiedDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    readingWords: 2800,
    featured: index === 0,
    pricing: null,
  },
  display: {
    title: `Provider ${index} Review`,
    description: `Provider ${index} description`,
    bestFor: null,
    searchText: `provider ${index} trading`,
    sortDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
  },
  researchContexts: [],
});

const eightItems = Array.from({ length: 8 }, (_, index) => makeFinderItem(index));

const makeItems = (count: number): DiscoveryItem[] =>
  Array.from({ length: count }, (_, index) => makeFinderItem(index));

// `.test.ts` (not `.test.tsx`) has no JSX pragma — `createElement` builds the
// same element `<QuickFinder market="us" items={eightItems} />` would,
// without hooks-invoked-outside-React's-dispatcher errors that a plain
// `QuickFinder({...})` function call would hit (unlike the hook-free
// CatalogCard, QuickFinder uses useState/useMemo/useEffect and MUST go
// through React's real render path).
const renderQuickFinder = (): string =>
  renderToStaticMarkup(createElement(QuickFinder, { market: 'us', items: eightItems }));

const renderQuickFinderWithItems = (items: DiscoveryItem[]): string =>
  renderToStaticMarkup(createElement(QuickFinder, { market: 'us', items }));

const countOccurrences = (value: string, needle: string): number =>
  value.split(needle).length - 1;

describe('QuickFinder', () => {
  it('renders at most six Finder cards', () => {
    const html = renderQuickFinder();
    expect(countOccurrences(html, 'data-finder-item=')).toBe(6);
  });

  it('keeps a mounted polite live region', () => {
    const html = renderQuickFinder();
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
  });

  it('does not render star or review-count semantics', () => {
    const html = renderQuickFinder();
    expect(html).not.toContain('reviewCount');
    expect(html).not.toContain('aria-label="star"');
  });
});

// PR 3 review fix (spec §15 invariant 13, "Hero, Facetten, CTA und Events
// melden konsistente Counts"): the live region and the "View all" CTA must
// both report the HONEST, uncapped total — never the six-card render cap.
// Default state (no query, no category) means totalMatches === items.length,
// so this matrix also covers the boundary the operator flagged as the
// interesting one: at exactly six items, "Showing 6 of 6" must be true
// because there are genuinely six matches, not because a cap silently
// kicked in and happened to also read 6.
describe('QuickFinder — visibleResults vs totalMatches (default state)', () => {
  it.each([
    [0, 0],
    [1, 1],
    [5, 5],
    [6, 6],
    [9, 6],
  ])('%i item(s) in the catalog render %i card(s), and both counts are announced honestly', (itemCount, expectedCards) => {
    const html = renderQuickFinderWithItems(makeItems(itemCount));
    expect(countOccurrences(html, 'data-finder-item=')).toBe(expectedCards);
    expect(html).toContain(`Showing ${expectedCards} of ${itemCount} results`);
    expect(html).toContain(`View all research (${itemCount})`);
  });

  it('at exactly six items, the visible count and the total are equal for a genuine reason, not a hidden cap', () => {
    const html = renderQuickFinderWithItems(makeItems(6));
    expect(html).toContain('Showing 6 of 6 results');
  });

  it('above six items, the announced total is the true uncapped count while only six cards render', () => {
    const html = renderQuickFinderWithItems(makeItems(9));
    expect(countOccurrences(html, 'data-finder-item=')).toBe(6);
    expect(html).toContain('Showing 6 of 9 results');
    expect(html).not.toContain('Showing 9 of 9');
  });
});
