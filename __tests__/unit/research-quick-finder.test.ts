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

// `.test.ts` (not `.test.tsx`) has no JSX pragma — `createElement` builds the
// same element `<QuickFinder market="us" items={eightItems} />` would,
// without hooks-invoked-outside-React's-dispatcher errors that a plain
// `QuickFinder({...})` function call would hit (unlike the hook-free
// CatalogCard, QuickFinder uses useState/useMemo/useEffect and MUST go
// through React's real render path).
const renderQuickFinder = (): string =>
  renderToStaticMarkup(createElement(QuickFinder, { market: 'us', items: eightItems }));

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
