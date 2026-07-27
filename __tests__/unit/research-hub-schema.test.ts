// __tests__/unit/research-hub-schema.test.ts
// ItemList JSON-LD contract for the universal Research hubs
// (unified-research-discovery-pr2-hubs plan, Task 3; spec §7.4) — PLUS the
// operator-mandated merge-blocker proof: the audited-only ItemList and the
// raw rendered HTML must describe the SAME products. That is asserted here
// as genuine SET EQUALITY (never by sampling one or two entries) between the
// ItemList's URLs and the hrefs of every rendered AUDITED card, using
// real ResearchCard/CatalogCard renders — not a second hand-rolled copy of
// the same href formula checked only against itself.
//
// buildDiscoveryCatalog (lib/research/catalog.ts) builds the fixture bundle
// for real — it is pure (no I/O) — so these fixtures exercise the actual
// join/dedup logic instead of a hand-assembled DiscoveryCatalog shape that
// could silently drift from what production code actually produces.

import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Category } from '@/lib/i18n/config';
import type { FieldSource, FilterKey, ProductForComparison } from '@/lib/comparison/types';
import type { BestXManifestEntry } from '@/lib/comparison/topics/manifest';
import type { ResearchProduct } from '@/lib/research/adapter';
import type {
  DiscoveryItem,
  DiscoveryProjection,
  DiscoveryReview,
  ResearchContext,
} from '@/lib/research/catalog-shell-logic';
import { cockpitKeyFor, reviewItemId } from '@/lib/research/catalog-shell-logic';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ href, children, ...rest }: any) =>
      createElement('a', { href: typeof href === 'string' ? href : href?.pathname ?? '#', ...rest }, children),
  };
});
vi.mock('next/image', async () => {
  const { createElement } = await import('react');
  return { default: ({ src, alt }: any) => createElement('img', { src, alt }) };
});
vi.mock('@/lib/comparison/topics/index', () => ({
  getTopicConfig: () => ({
    specColumns: ['fee'].map((key) => ({ key, label: key, accessor: () => 0, format: () => '$0' })),
  }),
}));
vi.mock('@/lib/comparison/cta', () => ({
  resolveCockpitCta: () => ({ label: 'Visit site', href: '#', external: false, tracked: false, ctaMode: 'unavailable', destinationType: 'unavailable' }),
}));

// Imported AFTER the mocks are registered.
import { buildDiscoveryCatalog } from '@/lib/research/catalog';
import { getResearchHubCopy } from '@/lib/research/hub-copy';
import {
  buildResearchHubNodes,
  buildResearchItemListSchema,
  ResearchHubBody,
} from '@/components/research/ResearchHubPage';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// --- fixtures (mirrors __tests__/unit/research-catalog.test.ts's local
//     helpers — buildDiscoveryCatalog's real join/dedup logic runs for real
//     here, only the Cockpit/MDX I/O around it is faked) -------------------

const src = (over: Partial<FieldSource> = {}): FieldSource => ({
  sourceUrl: 'https://example.com/pricing',
  sourceType: 'official',
  verifiedAt: '2026-07-01',
  ...over,
});

const FLAGS: Record<FilterKey, boolean> = {
  noMonthly: false,
  freeAtm: false,
  noFx: false,
  cashback: false,
  bonus: false,
  subAccounts: false,
  interest: false,
  applePay: false,
};

function makeProduct(over: Partial<ProductForComparison> = {}): ProductForComparison {
  return {
    slug: 'acme',
    displayName: 'Acme',
    initial: 'A',
    tagline: 'Great product',
    logoUrl: null,
    verified: true,
    score: 8,
    rating: 0,
    reviewCount: 0,
    monthlyFee: 10,
    signupBonus: 0,
    fxFeePct: 0,
    atmFee: 0,
    apy: 0,
    clicks: 0,
    badges: [],
    chips: [],
    pros: [],
    cons: [],
    subScores: {},
    effectiveApr: null,
    cashback: null,
    cardNetwork: null,
    wireTransfers: null,
    fdicCoverage: null,
    apps: [],
    verdict: null,
    flags: FLAGS,
    entityTypes: [],
    supportsCashDeposits: false,
    supportsIntlWires: false,
    hasBookkeeping: false,
    hasLending: false,
    hasSubAccounts: false,
    integrations: [],
    ctaMode: 'review',
    reviewSlug: null,
    externalUrl: null,
    isTopPick: false,
    bestFor: 'Beginners',
    displayOrder: 0,
    topic: 'trading-platforms',
    managementFee: 0,
    accountMinimum: 0,
    attributes: {},
    deepDive: null,
    sourceType: 'official',
    confidence: 'high',
    sourceUrl: 'https://example.com',
    dataVerifiedAt: '2026-07-01',
    offerAttribution: null,
    researchStatus: 'audited',
    methodologyVersion: 'v1',
    confidenceReason: 'Verified against official sources.',
    fieldSources: { fee: src() },
    market: 'us',
    category: 'trading',
    ...over,
  };
}

function makeResearchProduct(product: ProductForComparison, rank: number | null = 1): ResearchProduct {
  const audited = product.researchStatus === 'audited';
  return {
    product,
    research: {
      status: product.researchStatus === 'unavailable' ? 'unavailable' : (product.researchStatus as 'audited' | 'provisional'),
      score: audited ? product.score : null,
      subScores: {},
      methodologyVersion: audited ? 'v1' : null,
      dataVerifiedAt: audited ? '2026-07-01' : null,
      confidence: audited ? 'high' : null,
      confidenceReason: 'ok',
      fieldSources: audited ? { fee: src() } : {},
    } as ResearchProduct['research'],
    rank: audited ? rank : null,
    displayScore: audited ? product.score : null,
    reviewHref: product.reviewSlug ? `/us/${product.category}/${product.reviewSlug}` : null,
  };
}

const makeReview = (over: Partial<DiscoveryReview> = {}): DiscoveryReview => ({
  slug: 'fidelity',
  href: '/us/trading/fidelity',
  title: 'Fidelity Review',
  description: 'Independent Fidelity review',
  bestFor: null,
  editorialRating: 4.6,
  publishDate: '2026-01-01',
  modifiedDate: '2026-02-01',
  readingWords: 3000,
  featured: false,
  pricing: null,
  ...over,
});

const makeDiscoveryItem = (over: Partial<DiscoveryItem> = {}): DiscoveryItem => ({
  id: 'review:/us/trading/fidelity',
  market: 'us',
  category: 'trading',
  review: makeReview(),
  display: { title: '', description: '', bestFor: null, searchText: '', sortDate: null },
  researchContexts: [],
  ...over,
});

function makeOverlayRow(params: {
  category: Category;
  topic: string;
  productSlug: string;
  manifestOrder?: number;
  reviewSlug?: string | null;
  status?: 'audited' | 'provisional';
  auditedRank?: number;
}) {
  const market = 'us' as const;
  const label = `Best ${params.topic}`;
  const entry: BestXManifestEntry = {
    market,
    category: params.category,
    topic: params.topic,
    label,
    blurb: '',
    icon: 'x',
    image: '/x.webp',
  };
  const reviewSlug = params.reviewSlug ?? null;
  const status = params.status ?? 'audited';
  const audited = status === 'audited';
  const context: ResearchContext = {
    cockpitKey: cockpitKeyFor(market, params.category, params.topic),
    topic: params.topic,
    topicLabel: label,
    manifestOrder: params.manifestOrder ?? 0,
    productSlug: params.productSlug,
    displayName: params.productSlug,
    tagline: null,
    bestFor: null,
    status,
    confidence: audited ? 'high' : null,
    dataVerifiedAt: audited ? '2026-07-01' : null,
    auditedScore: audited ? 8 : null,
    auditedRank: audited ? (params.auditedRank ?? 1) : null,
    dataPoints: 1,
    compareBaseHref: `/${market}/${params.category}/best/${params.topic}`,
    keyFacts: { fee: '$10' },
  };
  const researchProduct = makeResearchProduct(
    makeProduct({
      slug: params.productSlug,
      category: params.category,
      market,
      reviewSlug,
      researchStatus: status,
    }),
    params.auditedRank ?? 1,
  );
  return { entry, context, researchProduct, reviewSlug };
}

// --- "emits only unique audited dossier products in ItemList order" --------
// (plan's literal Task 3 example, adapted to this file's local fixtures.)

describe('buildResearchItemListSchema', () => {
  it('emits only unique audited dossier products in ItemList order', () => {
    const auditedWithReview: DiscoveryProjection = {
      itemId: 'review:/us/trading/fidelity',
      kind: 'dossier',
      item: makeDiscoveryItem(),
      context: makeOverlayRow({ category: 'trading', topic: 'trading-platforms', productSlug: 'fidelity' }).context,
    };
    const secondAudited: DiscoveryProjection = {
      itemId: 'product:us:trading:charles-schwab',
      kind: 'dossier',
      item: makeDiscoveryItem({
        id: 'product:us:trading:charles-schwab',
        review: null,
        display: { title: 'Charles Schwab', description: '', bestFor: null, searchText: '', sortDate: null },
      }),
      context: makeOverlayRow({
        category: 'trading',
        topic: 'trading-platforms',
        productSlug: 'charles-schwab',
        auditedRank: 2,
      }).context,
    };
    const provisionalOnly: DiscoveryProjection = {
      itemId: 'product:us:trading:etoro',
      kind: 'dossier',
      item: makeDiscoveryItem({
        id: 'product:us:trading:etoro',
        review: null,
        display: { title: 'eToro', description: '', bestFor: null, searchText: '', sortDate: null },
      }),
      context: makeOverlayRow({ category: 'trading', topic: 'trading-platforms', productSlug: 'etoro', status: 'provisional' }).context,
    };

    const copy = getResearchHubCopy('us');
    const schema = buildResearchItemListSchema('us', [auditedWithReview, secondAudited, provisionalOnly], copy);

    expect(schema.numberOfItems).toBe(2);
    expect(schema.itemListElement.map((entry: any) => entry.position)).toEqual([1, 2]);
  });
});

// --- Merge-blocker: ItemList URLs === hrefs of the rendered audited cards ---

describe('research hub merge blocker (JSON-LD vs. raw HTML)', () => {
  it('renders exactly the same audited product set the ItemList schema claims — set equality, not sampling', () => {
    // Fidelity: review-backed, audited rank 1 in trading-platforms, AND
    // (deliberately) also audited rank 1 in a second topic — same item, two
    // contexts, still exactly one projection/one ItemList entry (spec §4.1).
    const fidelityRowA = makeOverlayRow({ category: 'trading', topic: 'trading-platforms', productSlug: 'fidelity', reviewSlug: 'fidelity', manifestOrder: 0 });
    const fidelityRowB = makeOverlayRow({ category: 'trading', topic: 'options-brokers', productSlug: 'fidelity', reviewSlug: 'fidelity', manifestOrder: 1 });
    // Charles Schwab: Cockpit-only (no review), audited rank 2 — must use
    // the SAME compare-href-with-query the rendered ResearchCard uses, not a
    // bare compareBaseHref.
    const schwabRow = makeOverlayRow({ category: 'trading', topic: 'trading-platforms', productSlug: 'charles-schwab', manifestOrder: 0, auditedRank: 2 });
    // eToro: Cockpit-only, provisional — must be rendered (CatalogCard) but
    // excluded from the audited-only ItemList.
    const etoroRow = makeOverlayRow({ category: 'trading', topic: 'trading-platforms', productSlug: 'etoro', manifestOrder: 0, status: 'provisional' });

    const blogReview = makeDiscoveryItem({
      id: reviewItemId('/us/trading/independent-blog'),
      review: makeReview({ slug: 'independent-blog', href: '/us/trading/independent-blog', editorialRating: 4.2 }),
    });

    const { catalog, dossierRows } = buildDiscoveryCatalog(
      'us',
      [makeDiscoveryItem(), blogReview],
      [fidelityRowA, fidelityRowB, schwabRow, etoroRow],
    );

    const nodes = buildResearchHubNodes({ catalog, dossierRows });
    const copy = getResearchHubCopy('us');
    const schema = buildResearchItemListSchema(
      'us',
      nodes.map((n) => n.projection),
      copy,
    );

    // Exactly the two audited products (Fidelity, Schwab) — never eToro
    // (provisional) or the blog review (no Cockpit context at all).
    expect(schema.numberOfItems).toBe(2);
    const schemaUrls = new Set(schema.itemListElement.map((entry: any) => entry.item.url as string));

    // Independently recomputed (not by calling buildResearchItemListSchema
    // again) — a hand-rolled filter/dedup over the SAME finalized node list,
    // so a real regression in either implementation shows up as a mismatch.
    const seen = new Set<string>();
    const expectedUrls = new Set<string>();
    for (const { projection } of nodes) {
      if (projection.kind !== 'dossier' || projection.context.status !== 'audited') continue;
      if (seen.has(projection.itemId)) continue;
      seen.add(projection.itemId);
      const href =
        projection.item.review?.href ??
        `${projection.context.compareBaseHref}?compare=${encodeURIComponent(projection.context.productSlug)}`;
      expectedUrls.add(`${BASE_URL}${href}`);
    }

    expect(schemaUrls).toEqual(expectedUrls);
    expect(expectedUrls.has(`${BASE_URL}/us/trading/fidelity`)).toBe(true);
    expect(expectedUrls.has(`${BASE_URL}/us/trading/best/trading-platforms?compare=charles-schwab`)).toBe(true);

    // And prove those URLs are truly what gets rendered, not merely
    // computed the same way twice: render each finalized AUDITED node for
    // real and require its own expected href to be a literal anchor in it.
    for (const { projection, node } of nodes) {
      if (projection.kind !== 'dossier' || projection.context.status !== 'audited') continue;
      const href =
        projection.item.review?.href ??
        `${projection.context.compareBaseHref}?compare=${encodeURIComponent(projection.context.productSlug)}`;
      const html = renderToStaticMarkup(node as Parameters<typeof renderToStaticMarkup>[0]);
      expect(html).toContain(`href="${href}"`);
    }

    // Reverse direction: no rendered PROVISIONAL/review-only card ever
    // fabricates an audited claim, and none of them leak into the schema.
    const etoroNode = nodes.find((n) => n.projection.itemId === 'product:us:trading:etoro')!;
    const etoroHtml = renderToStaticMarkup(etoroNode.node as Parameters<typeof renderToStaticMarkup>[0]);
    expect(etoroHtml).toContain('In verification');
    expect(etoroHtml).not.toContain('Audited ·');
    expect([...schemaUrls].some((url) => url.includes('etoro'))).toBe(false);
  });
});

// --- Honest empty state (Task 3 Step 4) -------------------------------------

describe('ResearchHubBody — empty catalog', () => {
  it('renders one H1, the empty-state copy, zero product cards, and no fabricated score/date text', () => {
    const copy = getResearchHubCopy('uk');
    const emptyCatalog = {
      market: 'uk' as const,
      items: [] as DiscoveryItem[],
      counts: {
        reviewBackedCount: 0,
        dossierCount: 0,
        discoveryItemCount: 0,
        auditedItemCount: 0,
        verifiedDataPointCount: 0,
      },
    };

    const html = renderToStaticMarkup(
      ResearchHubBody({ market: 'uk', catalog: emptyCatalog, copy, nodes: [] }) as Parameters<
        typeof renderToStaticMarkup
      >[0],
    );

    expect((html.match(/<h1[ >]/g) ?? []).length).toBe(1);
    expect(html).toContain(copy.h1);
    expect(html).toContain('research is on its way');
    expect(html).not.toContain('<article data-discovery-item');
    expect(html).not.toContain('Audited ·');
    expect(html).not.toContain('Editorial ·');
    // No product ItemList for an empty catalog (Breadcrumb's own unrelated
    // BreadcrumbList JSON-LD is expected and fine).
    expect(html).not.toContain('"@type":"ItemList"');
  });
});
