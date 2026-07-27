// __tests__/unit/research-catalog.test.ts
// Task 4 — server catalog builder (lib/research/catalog.ts): joins cached MDX
// review metadata with independently-loaded Cockpit topic overlays into one
// market-wide DiscoveryCatalog. Fixtures only: getContentByMarketAndCategory,
// getCockpitData, getTopicConfig, BEST_X_MANIFEST and the logger are all
// mocked so this suite never touches the filesystem, Supabase, or the real
// topic registry. buildResearchView (lib/research/adapter) runs FOR REAL —
// it is pure, already covered by research-adapter.test.ts, and running it
// for real here exercises the genuine audited/provisional/unavailable
// degradation the "unavailable row" case depends on.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Category } from '@/lib/i18n/config';
import type { ContentItem } from '@/lib/mdx';
import type { FieldSource, FilterKey, ProductForComparison } from '@/lib/comparison/types';
import type { BestXManifestEntry } from '@/lib/comparison/topics/manifest';
import type { ResearchProduct } from '@/lib/research/adapter';
import {
  cockpitKeyFor,
  reviewItemId,
  type DiscoveryItem,
  type DiscoveryReview,
  type ResearchContext,
} from '@/lib/research/catalog-shell-logic';

// --- hoisted mocks (must exist before the vi.mock factories below run) ------
const {
  mockGetContentByMarketAndCategory,
  mockGetCockpitData,
  mockGetTopicConfig,
  mockLoggerWarn,
  TEST_MANIFEST,
  FAKE_CONFIG,
} = vi.hoisted(() => {
  const TEST_MANIFEST: {
    market: string;
    category: string;
    topic: string;
    label: string;
    blurb: string;
    icon: string;
    image: string;
  }[] = [
    { market: 'us', category: 'trading', topic: 'trading-platforms', label: 'Best Trading Platforms', blurb: '', icon: 'x', image: '/x.webp' },
    { market: 'us', category: 'business-banking', topic: 'business-bank-accounts', label: 'Best Business Banking', blurb: '', icon: 'x', image: '/x.webp' },
    { market: 'us', category: 'forex', topic: 'forex-brokers', label: 'Best Forex Brokers', blurb: '', icon: 'x', image: '/x.webp' },
  ];
  const FAKE_CONFIG = {
    specColumns: [
      {
        key: 'fee',
        label: 'Fee',
        accessor: (p: ProductForComparison) => p.monthlyFee,
        format: (v: unknown) => `$${v}`,
      },
    ],
  };
  return {
    TEST_MANIFEST,
    FAKE_CONFIG,
    mockGetContentByMarketAndCategory: vi.fn(),
    mockGetCockpitData: vi.fn(),
    mockGetTopicConfig: vi.fn(),
    mockLoggerWarn: vi.fn(),
  };
});

vi.mock('@/lib/mdx', () => ({ getContentByMarketAndCategory: mockGetContentByMarketAndCategory }));
vi.mock('@/lib/comparison/topics/manifest', () => ({ BEST_X_MANIFEST: TEST_MANIFEST }));
vi.mock('@/lib/comparison/loader', () => ({ getCockpitData: mockGetCockpitData }));
vi.mock('@/lib/comparison/topics/index', () => ({ getTopicConfig: mockGetTopicConfig }));
vi.mock('@/lib/logging', () => ({
  logger: { warn: mockLoggerWarn, info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Imported AFTER the mocks are registered.
import { buildDiscoveryCatalog, loadMarketReviewItems, loadMarketResearchContexts } from '@/lib/research/catalog';

beforeEach(() => {
  vi.resetAllMocks();
  mockGetTopicConfig.mockReturnValue(FAKE_CONFIG);
});

// --- fixtures ----------------------------------------------------------------

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

/** Full ProductForComparison fixture — sane defaults, override what a test needs. */
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
    topic: 'companies',
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
    category: 'credit-repair',
    ...over,
  };
}

/** Minimal ResearchProduct fixture — buildDiscoveryCatalog only carries this
 *  through to dossierRows, it never inspects its internals. */
function makeResearchProduct(product: ProductForComparison): ResearchProduct {
  return {
    product,
    research: {
      status: 'audited',
      score: product.score,
      subScores: {},
      methodologyVersion: 'v1',
      dataVerifiedAt: '2026-07-01',
      confidence: 'high',
      confidenceReason: 'ok',
      fieldSources: {},
    },
    rank: 1,
    displayScore: product.score,
    reviewHref: product.reviewSlug ? `/us/${product.category}/${product.reviewSlug}` : null,
  };
}

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

const makeDiscoveryItem = (over: Partial<DiscoveryItem> = {}): DiscoveryItem => ({
  id: 'review:/us/trading/acme-review',
  market: 'us',
  category: 'trading',
  review: makeReview(),
  display: { title: '', description: '', bestFor: null, searchText: '', sortDate: null },
  researchContexts: [],
  ...over,
});

/** Builds one NormalizedOverlayRow-shaped fixture (entry + context +
 *  researchProduct + reviewSlug) — the exact input shape buildDiscoveryCatalog
 *  consumes as its overlay parameter, structurally matched without importing
 *  the (deliberately unexported) NormalizedOverlayRow type. */
function makeOverlayRow(params: {
  category: Category;
  topic: string;
  productSlug: string;
  manifestOrder?: number;
  reviewSlug?: string | null;
  contextOver?: Partial<ResearchContext>;
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
  const context: ResearchContext = {
    cockpitKey: cockpitKeyFor(market, params.category, params.topic),
    topic: params.topic,
    topicLabel: label,
    manifestOrder: params.manifestOrder ?? 0,
    productSlug: params.productSlug,
    displayName: params.productSlug,
    tagline: null,
    bestFor: null,
    status: 'audited',
    confidence: 'high',
    dataVerifiedAt: '2026-07-01',
    auditedScore: 8,
    auditedRank: 1,
    dataPoints: 1,
    compareBaseHref: `/${market}/${params.category}/best/${params.topic}`,
    keyFacts: { fee: '$10' },
    ...params.contextOver,
  };
  const researchProduct = makeResearchProduct(
    makeProduct({ slug: params.productSlug, category: params.category, market, reviewSlug }),
  );
  return { entry, context, researchProduct, reviewSlug };
}

function makeContentItem(over: { slug: string; rating?: number; category?: Category }): ContentItem {
  return {
    slug: over.slug,
    meta: {
      title: `${over.slug} Title`,
      description: `${over.slug} description`,
      author: 'Jane Doe',
      publishDate: '2026-01-01',
      modifiedDate: '2026-02-01',
      category: over.category ?? 'trading',
      market: 'us',
      affiliateDisclosure: true,
      rating: over.rating,
    },
    content: '',
    readingTime: { text: '10 min read', minutes: 10, time: 600000, words: 2000 },
  };
}

// --- buildDiscoveryCatalog — pure join/merge/display assembly ---------------

describe('buildDiscoveryCatalog', () => {
  it('joins an overlay row to the review only in the matching category', () => {
    const tradingReview = makeDiscoveryItem({
      id: reviewItemId('/us/trading/acme'),
      category: 'trading',
      review: makeReview({
        slug: 'acme',
        href: '/us/trading/acme',
        bestFor: 'Editorial pick for active traders',
      }),
    });
    const forexReview = makeDiscoveryItem({
      id: reviewItemId('/us/forex/acme'),
      category: 'forex',
      review: makeReview({ slug: 'acme', href: '/us/forex/acme' }),
    });
    const row = makeOverlayRow({
      category: 'trading',
      topic: 'trading-platforms',
      productSlug: 'acme',
      reviewSlug: 'acme',
      contextOver: { bestFor: 'Context bestFor should lose' },
    });

    const { catalog } = buildDiscoveryCatalog('us', [tradingReview, forexReview], [row]);

    expect(catalog.items).toHaveLength(2);
    const tradingItem = catalog.items.find((i) => i.id === tradingReview.id)!;
    const forexItem = catalog.items.find((i) => i.id === forexReview.id)!;
    expect(tradingItem.researchContexts).toHaveLength(1);
    expect(forexItem.researchContexts).toHaveLength(0);
    // Precedence: a review-backed item's display.bestFor uses the review's
    // own MDX value, even when its attached context also carries a bestFor.
    expect(tradingItem.display.bestFor).toBe('Editorial pick for active traders');
  });

  it('review-backed item without contexts keeps its MDX bestFor in display and searchText', () => {
    const review = makeDiscoveryItem({
      id: reviewItemId('/us/personal-finance/budget-app'),
      category: 'personal-finance',
      review: makeReview({
        slug: 'budget-app',
        href: '/us/personal-finance/budget-app',
        bestFor: 'Hands-off budgeting teams',
      }),
    });

    const { catalog } = buildDiscoveryCatalog('us', [review], []);

    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].display.bestFor).toBe('Hands-off budgeting teams');
    expect(catalog.items[0].display.searchText).toContain('budgeting');
  });

  it('keeps a rated review with zero contexts when no overlay row matches', () => {
    const review = makeDiscoveryItem({
      id: reviewItemId('/us/trading/solo'),
      category: 'trading',
      review: makeReview({ slug: 'solo', href: '/us/trading/solo' }),
    });

    const { catalog } = buildDiscoveryCatalog('us', [review], []);

    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].review).not.toBeNull();
    expect(catalog.items[0].researchContexts).toHaveLength(0);
  });

  it('merges the same cockpit-only product across two topics into one item with two contexts', () => {
    const rowA = makeOverlayRow({ category: 'personal-finance', topic: 'robo-advisors', productSlug: 'acme', manifestOrder: 0 });
    const rowB = makeOverlayRow({ category: 'personal-finance', topic: 'high-yield-savings', productSlug: 'acme', manifestOrder: 1 });

    const { catalog } = buildDiscoveryCatalog('us', [], [rowA, rowB]);

    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].id).toBe('product:us:personal-finance:acme');
    expect(catalog.items[0].researchContexts).toHaveLength(2);
    expect(catalog.items[0].researchContexts.map((c) => c.topic)).toEqual(['robo-advisors', 'high-yield-savings']);
  });

  it('keeps the credit-repair/debt-relief collision fixture distinct because category is part of the id', () => {
    // Both topics are literally named "companies" and both rows use the same
    // productSlug — only the item id's embedded category tells them apart.
    const creditRepairRow = makeOverlayRow({ category: 'credit-repair', topic: 'companies', productSlug: 'freedom' });
    const debtReliefRow = makeOverlayRow({ category: 'debt-relief', topic: 'companies', productSlug: 'freedom' });

    const { catalog } = buildDiscoveryCatalog('us', [], [creditRepairRow, debtReliefRow]);

    const ids = catalog.items.map((i) => i.id);
    expect(ids).toEqual(['product:us:credit-repair:freedom', 'product:us:debt-relief:freedom']);
    expect(new Set(ids).size).toBe(2);
  });

  it('dedupes a repeated row for the same cockpit key down to one context', () => {
    const row = makeOverlayRow({ category: 'credit-repair', topic: 'companies', productSlug: 'freedom' });

    const { catalog } = buildDiscoveryCatalog('us', [], [row, row]);

    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].researchContexts).toHaveLength(1);
  });

  it('keeps each market catalog under the 200 KB JSON size ceiling', () => {
    const markets = ['us', 'uk', 'ca', 'au'] as const;
    const REVIEW_COUNT = 50;
    const TOPIC_COUNT = 15;
    const PRODUCTS_PER_TOPIC = 12;

    for (const market of markets) {
      const reviews: DiscoveryItem[] = Array.from({ length: REVIEW_COUNT }, (_, i) =>
        makeDiscoveryItem({
          id: reviewItemId(`/${market}/trading/review-${i}`),
          market,
          category: 'trading',
          review: makeReview({ slug: `review-${i}`, href: `/${market}/trading/review-${i}` }),
          researchContexts: [],
        }),
      );

      const overlay = Array.from({ length: TOPIC_COUNT }, (_, topicIndex) =>
        Array.from({ length: PRODUCTS_PER_TOPIC }, (_, productIndex) =>
          makeOverlayRow({
            category: 'personal-finance',
            topic: `topic-${topicIndex}`,
            manifestOrder: topicIndex,
            productSlug: `product-${topicIndex}-${productIndex}`,
          }),
        ),
      ).flat();

      const { catalog } = buildDiscoveryCatalog(market, reviews, overlay);
      const byteLength = new TextEncoder().encode(JSON.stringify(catalog)).length;
      expect(byteLength).toBeLessThan(200_000);
    }
  });
});

// --- loadMarketReviewItems — uncached MDX loader (mocked filesystem seam) ---

describe('loadMarketReviewItems', () => {
  it('includes exactly one review-backed item, excluding the index entry', async () => {
    mockGetContentByMarketAndCategory.mockImplementation(async (_market: string, category: string) => {
      if (category !== 'trading') return [];
      return [
        makeContentItem({ slug: 'index' }), // no rating -> excluded regardless
        makeContentItem({ slug: 'acme-review', rating: 4.5 }),
      ];
    });

    const items = await loadMarketReviewItems('us');

    expect(items).toHaveLength(1);
    expect(items[0].review).not.toBeNull();
    expect(items[0].review!.slug).toBe('acme-review');
  });
});

// --- loadMarketResearchContexts — Promise.allSettled overlay loader --------

describe('loadMarketResearchContexts', () => {
  it('excludes an unmatched unavailable product — no row is created', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category === 'forex') {
        return [makeProduct({ slug: 'shaky', category: 'forex', reviewSlug: null, researchStatus: 'unavailable' })];
      }
      return [];
    });

    const overlay = await loadMarketResearchContexts('us');

    expect(overlay).toHaveLength(0);
  });

  it('keeps the fulfilled topic and every review when one topic rejects, logging exactly one warning', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category === 'business-banking') throw new Error('DB unavailable');
      if (category === 'trading') {
        return [
          makeProduct({ slug: 'acme', category: 'trading', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
        ];
      }
      return [];
    });

    const overlay = await loadMarketResearchContexts('us');

    expect(overlay).toHaveLength(1);
    expect(overlay[0].context.cockpitKey).toBe('us/trading/trading-platforms');
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('Research discovery topic unavailable', {
      market: 'us',
      category: 'business-banking',
      topic: 'business-bank-accounts',
      errorType: 'Error',
    });

    // Every review (independent of the overlay) and the fulfilled context
    // both remain once assembled into the catalog.
    const reviewA = makeDiscoveryItem({
      id: reviewItemId('/us/personal-finance/rev-a'),
      category: 'personal-finance',
      review: makeReview({ slug: 'rev-a', href: '/us/personal-finance/rev-a' }),
    });
    const reviewB = makeDiscoveryItem({
      id: reviewItemId('/us/forex/rev-b'),
      category: 'forex',
      review: makeReview({ slug: 'rev-b', href: '/us/forex/rev-b' }),
    });

    const { catalog } = buildDiscoveryCatalog('us', [reviewA, reviewB], overlay);

    expect(catalog.items.find((i) => i.id === reviewA.id)).toBeTruthy();
    expect(catalog.items.find((i) => i.id === reviewB.id)).toBeTruthy();
    const cockpitOnly = catalog.items.find((i) => i.id === 'product:us:trading:acme');
    expect(cockpitOnly).toBeTruthy();
    expect(cockpitOnly!.researchContexts).toHaveLength(1);
  });
});
