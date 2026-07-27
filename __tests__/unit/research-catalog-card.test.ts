// __tests__/unit/research-catalog-card.test.ts
// CatalogCard render contract (unified-research-discovery-pr2-hubs plan, Task
// 3; spec §9.1). Synchronous Server Component -> renders to a static HTML
// string via react-dom/server#renderToStaticMarkup, same idiom as
// research-card.test.ts (JSX-free .test.ts, next/link mocked so it never
// needs a real Next.js router context).
//
// HONESTY rules this file guards (never relax):
//   - `Audited · x/10` only for a selected audited context.
//   - Otherwise `Editorial · x/5` — only when the item has a review, no star
//     icon, no `reviewCount`.
//   - A Cockpit-only PROVISIONAL projection (no review, provisional context)
//     reads `In verification` with no number of any kind.
//   - No nested anchors: the title Link and the Methodology Link are
//     siblings, never one wrapped in the other (spec §8/§9.1).

import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type {
  DiscoveryItem,
  DiscoveryProjection,
  DiscoveryReview,
  ResearchContext,
} from '@/lib/research/catalog-shell-logic';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ href, children, ...rest }: any) =>
      createElement('a', { href: typeof href === 'string' ? href : href?.pathname ?? '#', ...rest }, children),
  };
});

// Imported AFTER the mock is registered.
import { CatalogCard } from '@/components/research/CatalogCard';

// --- fixtures ----------------------------------------------------------------

const makeReview = (over: Partial<DiscoveryReview> = {}): DiscoveryReview => ({
  slug: 'acme-review',
  href: '/us/trading/acme-review',
  title: 'Acme Review',
  description: 'Independent Acme review',
  bestFor: null,
  editorialRating: 4.5,
  publishDate: '2026-01-01',
  modifiedDate: '2026-02-01',
  readingWords: 2000,
  featured: false,
  pricing: null,
  ...over,
});

const makeContext = (over: Partial<ResearchContext> = {}): ResearchContext => ({
  cockpitKey: 'us/trading/trading-platforms',
  topic: 'trading-platforms',
  topicLabel: 'Best Trading Platforms',
  manifestOrder: 0,
  productSlug: 'acme',
  displayName: 'Acme',
  tagline: null,
  bestFor: null,
  status: 'audited',
  confidence: 'high',
  dataVerifiedAt: '2026-07-01',
  auditedScore: 8,
  auditedRank: 1,
  dataPoints: 3,
  compareBaseHref: '/us/trading/best/trading-platforms',
  keyFacts: {},
  ...over,
});

const makeDiscoveryItem = (over: Partial<DiscoveryItem> = {}): DiscoveryItem => ({
  id: 'review:/us/trading/acme-review',
  market: 'us',
  category: 'trading',
  review: makeReview(),
  display: {
    title: 'Acme',
    description: 'A description of Acme.',
    bestFor: null,
    searchText: 'acme',
    sortDate: '2026-02-01',
  },
  researchContexts: [],
  ...over,
});

const makeProjection = ({
  kind,
  status = 'audited',
  auditedScore = 9.4,
  editorialRating = 4.7,
  hasReview = kind === 'review',
}: {
  kind: 'review' | 'dossier';
  status?: 'audited' | 'provisional';
  auditedScore?: number | null;
  editorialRating?: number;
  hasReview?: boolean;
}): DiscoveryProjection => {
  const item = makeDiscoveryItem({
    review: hasReview ? makeReview({ editorialRating }) : null,
  });
  if (kind === 'review') {
    return { itemId: item.id, kind, item, context: null };
  }
  const context = makeContext({
    status,
    auditedScore: status === 'audited' ? auditedScore : null,
    auditedRank: status === 'audited' ? 1 : null,
    confidence: status === 'audited' ? 'high' : null,
  });
  return { itemId: item.id, kind, item, context };
};

const renderCatalogCard = (projection: DiscoveryProjection): string =>
  renderToStaticMarkup(CatalogCard({ projection }));

describe('CatalogCard', () => {
  it('labels an audited context on the 10-point scale', () => {
    const html = renderCatalogCard(
      makeProjection({ kind: 'dossier', status: 'audited', auditedScore: 9.4 }),
    );
    expect(html).toContain('Audited · 9.4/10');
    expect(html).not.toContain('Editorial ·');
  });

  it('labels an editorial review on the 5-point scale without a star', () => {
    const html = renderCatalogCard(
      makeProjection({ kind: 'review', editorialRating: 4.7 }),
    );
    expect(html).toContain('Editorial · 4.7/5');
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('reviewCount');
  });

  it('shows "In verification" with no number for a Cockpit-only provisional projection', () => {
    const html = renderCatalogCard(
      makeProjection({ kind: 'dossier', status: 'provisional', hasReview: false }),
    );
    expect(html).toContain('In verification');
    expect(html).not.toContain('Audited ·');
    expect(html).not.toContain('Editorial ·');
  });

  it('never fabricates an "Updated" date when display.sortDate is null', () => {
    const projection = makeProjection({ kind: 'review', editorialRating: 4.0 });
    const withoutDate: DiscoveryProjection = {
      ...projection,
      item: { ...projection.item, display: { ...projection.item.display, sortDate: null } },
    };
    const html = renderCatalogCard(withoutDate);
    expect(html).not.toContain('Updated');
  });

  it('never nests the Methodology link inside the title link (no nested anchors)', () => {
    const html = renderCatalogCard(makeProjection({ kind: 'dossier', status: 'audited' }));
    const anchorOpenCount = (html.match(/<a /g) ?? []).length;
    const anchorCloseCount = (html.match(/<\/a>/g) ?? []).length;
    expect(anchorOpenCount).toBe(2); // title link + methodology link, nothing else
    expect(anchorCloseCount).toBe(2);

    const firstOpen = html.indexOf('<a ');
    const firstClose = html.indexOf('</a>', firstOpen);
    const withinFirstAnchor = html.slice(firstOpen + 1, firstClose);
    expect(withinFirstAnchor).not.toContain('<a '); // no anchor nested inside the first
  });

  it('links the Methodology chip to /methodology by default', () => {
    const html = renderCatalogCard(makeProjection({ kind: 'review' }));
    expect(html).toContain('href="/methodology"');
  });
});
