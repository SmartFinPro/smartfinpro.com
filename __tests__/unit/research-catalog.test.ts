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
import {
  buildDiscoveryCatalog,
  flattenQualifiedOverlayRows,
  loadMarketReviewItems,
  loadMarketResearchContexts,
  loadOneTopicOverlay,
  resolveOverlayContexts,
  __resetTopicOverlayBackoffForTests,
  type TopicOverlayResult,
} from '@/lib/research/catalog';

beforeEach(() => {
  vi.resetAllMocks();
  mockGetTopicConfig.mockReturnValue(FAKE_CONFIG);
  // The 60s failure-backoff map (spec §5.3.1) is module-level state, not a vi
  // mock — vi.resetAllMocks() above does not touch it. Without this reset, a
  // backoff entry set by one test (e.g. the "other topics unaffected" test
  // below, which fails 'business-banking' under the REAL Date.now clock)
  // would leak into a later test's fake-clock timeline for the same
  // CockpitKey and silently report "backoff" instead of the state that test
  // actually means to exercise.
  __resetTopicOverlayBackoffForTests();
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

  it('invariant 1 (spec §15) — two overlay rows from two topics, joined to one review, still yield exactly one item for that review href', () => {
    // "Jedes qualifizierte Review erzeugt genau ein DiscoveryItem." Two
    // different manifest topics both attach to the SAME review (matched by
    // category + reviewSlug) — the join must not fan the review out into two
    // items; both contexts must land on the one review-backed item instead.
    const review = makeDiscoveryItem({
      id: reviewItemId('/us/trading/acme'),
      category: 'trading',
      review: makeReview({ slug: 'acme', href: '/us/trading/acme' }),
    });
    const rowA = makeOverlayRow({
      category: 'trading',
      topic: 'trading-platforms',
      productSlug: 'acme',
      reviewSlug: 'acme',
      manifestOrder: 0,
    });
    const rowB = makeOverlayRow({
      category: 'trading',
      topic: 'options-brokers',
      productSlug: 'acme',
      reviewSlug: 'acme',
      manifestOrder: 1,
    });

    const { catalog } = buildDiscoveryCatalog('us', [review], [rowA, rowB]);

    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].id).toBe(reviewItemId('/us/trading/acme'));
    expect(catalog.items[0].researchContexts).toHaveLength(2);
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

  it('throws instead of silently dropping one item when two review items share the same id (spec §4.1: a collision is a test failure, not last-write-wins)', () => {
    const reviewA = makeDiscoveryItem({
      id: reviewItemId('/us/trading/dup'),
      category: 'trading',
      review: makeReview({ slug: 'dup', href: '/us/trading/dup' }),
    });
    const reviewB = makeDiscoveryItem({
      id: reviewItemId('/us/trading/dup'),
      category: 'trading',
      review: makeReview({ slug: 'dup', href: '/us/trading/dup' }),
    });

    expect(() => buildDiscoveryCatalog('us', [reviewA, reviewB], [])).toThrow(
      /review:\/us\/trading\/dup/,
    );
  });

  // Modeled capacity for the guard below: >=100 review-backed items + 30
  // dossier contexts per market at real-world string lengths (review title
  // 54 chars, description 156, bestFor 131; context tagline 40, bestFor 24;
  // 4 keyFacts entries at realistic label/value lengths) — not placeholder
  // single-word/single-char strings. If this fails, the serialized catalog
  // shape must slim down — do NOT shrink the fixture to force a pass; that
  // would silently narrow the ceiling this guard exists to enforce.
  const REALISTIC_TITLE = 'Fidelity Investments Review: Fees, Tools & Safety 2026'; // 54 chars
  const REALISTIC_DESCRIPTION =
    'An independent, fee-by-fee breakdown of trading platforms, account minimums, and customer support quality compared across major online brokers overall today'; // 156 chars
  const REALISTIC_BEST_FOR =
    'Long-term investors and retirees who want zero-commission stock trades, strong research tools, and a well-trusted online brokerage.'; // 131 chars
  const REALISTIC_TAGLINE = 'Zero-commission trades, expert research.'; // 40 chars
  const REALISTIC_CONTEXT_BEST_FOR = 'Long-term buy-and-holder'; // 24 chars
  const REALISTIC_KEY_FACTS = {
    optionsFee: '$0.65 per options contract',
    stockTrades: '$0 commission per online trade',
    minDeposit: '$0 account minimum to open',
    accountFee: '$0 monthly maintenance fee',
  };

  it('keeps each market catalog under the 200 KB JSON size ceiling at realistic scale (100 reviews + 30 dossier contexts)', () => {
    const markets = ['us', 'uk', 'ca', 'au'] as const;
    const REVIEW_COUNT = 100;
    const TOPIC_COUNT = 5;
    const PRODUCTS_PER_TOPIC = 6; // 5 * 6 = 30 overlay contexts across a few topics

    for (const market of markets) {
      const reviews: DiscoveryItem[] = Array.from({ length: REVIEW_COUNT }, (_, i) =>
        makeDiscoveryItem({
          id: reviewItemId(`/${market}/trading/review-${i}`),
          market,
          category: 'trading',
          review: makeReview({
            slug: `review-${i}`,
            href: `/${market}/trading/review-${i}`,
            title: REALISTIC_TITLE,
            description: REALISTIC_DESCRIPTION,
            bestFor: REALISTIC_BEST_FOR,
          }),
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
            contextOver: {
              tagline: REALISTIC_TAGLINE,
              bestFor: REALISTIC_CONTEXT_BEST_FOR,
              keyFacts: REALISTIC_KEY_FACTS,
            },
          }),
        ),
      ).flat();

      const { catalog } = buildDiscoveryCatalog(market, reviews, overlay);
      const byteLength = new TextEncoder().encode(JSON.stringify(catalog)).length;
      expect(
        byteLength,
        `serialized ${market} catalog at realistic scale (100 reviews + 30 dossier contexts): ${byteLength} bytes, ceiling 200,000`,
      ).toBeLessThan(200_000);
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

  it('uses the directory category it was loaded under, not a drifted meta.category', async () => {
    // getContentBySlug resolves content by directory, not by frontmatter —
    // a content item physically living under content/us/forex/ is a forex
    // item regardless of what its own `category` frontmatter field claims.
    // Trusting meta.category here would both collide this item's id with a
    // same-slug item actually living under content/us/trading/, and emit an
    // href ('/us/trading/<slug>') that 404s because the file isn't there.
    mockGetContentByMarketAndCategory.mockImplementation(async (_market: string, category: string) => {
      if (category !== 'forex') return [];
      return [makeContentItem({ slug: 'drifted-review', rating: 4.2, category: 'trading' })];
    });

    const items = await loadMarketReviewItems('us');

    expect(items).toHaveLength(1);
    expect(items[0].category).toBe('forex');
    expect(items[0].review!.href).toBe('/us/forex/drifted-review');
  });
});

// --- loadOneTopicOverlay — uncached single-topic loader (spec §5.3.1) ------
// This is the function `getCachedTopicOverlay` wraps in a per-topic
// unstable_cache entry. It is the loader boundary the amended spec (§5.3.1)
// requires to stop collapsing "loaded fine, zero qualifying rows" and "failed
// to load" into the same `[]` — every call below returns a discriminated
// TopicOverlayResult instead.

describe('loadOneTopicOverlay', () => {
  const entryFor = (category: string, topic: string): BestXManifestEntry =>
    TEST_MANIFEST.find((e) => e.category === category && e.topic === topic) as unknown as BestXManifestEntry;

  it('resolves ok:true with its contexts for a qualified topic', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category !== 'trading') return [];
      return [
        makeProduct({ slug: 'acme', category: 'trading', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
      ];
    });

    const result = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'), 0);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok:true');
    expect(result.contexts).toHaveLength(1);
    expect(result.contexts[0].cockpitKey).toBe('us/trading/trading-platforms');
    expect(result.rows).toHaveLength(1);
  });

  it('resolves ok:true with an EMPTY contexts array when nothing qualifies — explicitly NOT ok:false (the merge-blocker distinction spec §5.3.1 exists to fix)', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category === 'forex') {
        return [makeProduct({ slug: 'shaky', category: 'forex', reviewSlug: null, researchStatus: 'unavailable' })];
      }
      return [];
    });

    const result = await loadOneTopicOverlay('us', entryFor('forex', 'forex-brokers'), 2);

    expect(result).toEqual({
      ok: true,
      entry: entryFor('forex', 'forex-brokers'),
      contexts: [],
      rows: [],
    });
  });

  it('resolves ok:false missing_topic_config when the manifest entry has no resolvable TopicConfig', async () => {
    mockGetTopicConfig.mockReturnValue(null);

    const result = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'), 0);

    expect(result).toEqual({
      ok: false,
      entry: entryFor('trading', 'trading-platforms'),
      reason: 'missing_topic_config',
    });
    expect(mockGetCockpitData).not.toHaveBeenCalled();
  });

  it('rejects (does not catch) when getCockpitData fails, so unstable_cache never caches a transient failure for the full 3600s success TTL', async () => {
    mockGetCockpitData.mockImplementation(async () => {
      throw new Error('DB unavailable');
    });

    await expect(loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'), 0)).rejects.toThrow(
      'DB unavailable',
    );
  });

  it('invariant 5 (spec §15) — only an audited context carries score, rank, and confidence; a provisional context nulls all three', async () => {
    // deriveResearchScore only attempts the audited branch when
    // researchStatus === 'audited' exactly, so setting 'provisional' here
    // takes the editorial-ceiling branch regardless of otherwise-complete
    // data (confidence/score/dataVerifiedAt all present on the input). That
    // makes this a real test of catalog.ts's own `audited ? x : null`
    // ternary in loadTopicOverlayRows — not merely of upstream nullness.
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category !== 'trading') return [];
      return [
        makeProduct({
          slug: 'audited-co',
          category: 'trading',
          reviewSlug: null,
          researchStatus: 'audited',
          fieldSources: { fee: src() },
        }),
        makeProduct({
          slug: 'provisional-co',
          category: 'trading',
          reviewSlug: null,
          researchStatus: 'provisional',
          fieldSources: { fee: src() },
        }),
      ];
    });

    const result = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'), 0);
    if (!result.ok) throw new Error('expected ok:true');

    const auditedRow = result.rows.find((r) => r.context.productSlug === 'audited-co')!;
    const provisionalRow = result.rows.find((r) => r.context.productSlug === 'provisional-co')!;

    expect(auditedRow.context.status).toBe('audited');
    expect(auditedRow.context.confidence).toBe('high');
    expect(auditedRow.context.auditedScore).toBe(8);
    expect(auditedRow.context.auditedRank).toBe(1);

    expect(provisionalRow.context.status).toBe('provisional');
    expect(provisionalRow.context.confidence).toBeNull();
    expect(provisionalRow.context.auditedScore).toBeNull();
    expect(provisionalRow.context.auditedRank).toBeNull();
  });
});

// --- loadMarketResearchContexts — per-topic typed results (spec §5.3.1) ----
// Fans out across every manifest topic for the market. Unlike the old
// Promise.allSettled loader, no individual topic promise ever rejects here —
// loadTopic (injected as the uncached loadOneTopicOverlay in these tests, so
// the real unstable_cache/Next.js runtime is never touched) is called inside
// a try/catch that turns a rejection into `{ok:false, reason:'load_failed'}`
// plus exactly one structured warn.

describe('loadMarketResearchContexts', () => {
  it('reports load_failed for a rejecting topic, leaves every other topic unaffected, and logs exactly one structured warning', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category === 'business-banking') throw new Error('DB unavailable');
      if (category === 'trading') {
        return [
          makeProduct({ slug: 'acme', category: 'trading', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
        ];
      }
      return []; // forex — loads fine, zero qualifying rows
    });

    const results = await loadMarketResearchContexts('us', () => 0, loadOneTopicOverlay);

    expect(results).toHaveLength(TEST_MANIFEST.length);
    const trading = results.find((r) => r.entry.category === 'trading')!;
    const businessBanking = results.find((r) => r.entry.category === 'business-banking')!;
    const forex = results.find((r) => r.entry.category === 'forex')!;

    expect(trading.ok).toBe(true);
    expect(businessBanking).toEqual({ ok: false, entry: businessBanking.entry, reason: 'load_failed' });
    // The merge-blocker distinction: forex loaded fine with zero qualifying
    // rows — ok:true, NOT the same ok:false shape as the topic that actually
    // failed to load.
    expect(forex).toEqual({ ok: true, entry: forex.entry, contexts: [], rows: [] });

    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('Research discovery topic unavailable', {
      market: 'us',
      category: 'business-banking',
      topic: 'business-bank-accounts',
      reason: 'load_failed',
    });

    // Every review (independent of the overlay) and the fulfilled context
    // both remain once assembled into the catalog via the flatten helper.
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

    const overlay = flattenQualifiedOverlayRows(results);
    const { catalog } = buildDiscoveryCatalog('us', [reviewA, reviewB], overlay);

    expect(catalog.items.find((i) => i.id === reviewA.id)).toBeTruthy();
    expect(catalog.items.find((i) => i.id === reviewB.id)).toBeTruthy();
    const cockpitOnly = catalog.items.find((i) => i.id === 'product:us:trading:acme');
    expect(cockpitOnly).toBeTruthy();
    expect(cockpitOnly!.researchContexts).toHaveLength(1);
  });

  it('invariant 11 (spec §15) — every overlay topic rejecting leaves review ids byte-identical and context-free', async () => {
    // Spec §13 degradation matrix: "Gesamtes Overlay scheitert -> Hub bleibt
    // als Review-Katalog mit HTTP 200 erreichbar." Unlike the "one topic
    // rejects" test above, here EVERY manifest topic for the market throws —
    // the review catalog must come through completely untouched.
    mockGetCockpitData.mockImplementation(async () => {
      throw new Error('Cockpit unreachable');
    });

    const results = await loadMarketResearchContexts('us', () => 0, loadOneTopicOverlay);

    expect(results.every((r) => !r.ok && r.reason === 'load_failed')).toBe(true);
    expect(mockLoggerWarn).toHaveBeenCalledTimes(TEST_MANIFEST.length);

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

    const overlay = flattenQualifiedOverlayRows(results);
    expect(overlay).toHaveLength(0);
    const { catalog } = buildDiscoveryCatalog('us', [reviewA, reviewB], overlay);

    expect(catalog.items).toHaveLength(2);
    expect(catalog.items.find((i) => i.id === reviewA.id)?.id).toBe(reviewA.id);
    expect(catalog.items.find((i) => i.id === reviewB.id)?.id).toBe(reviewB.id);
    expect(catalog.items.every((i) => i.researchContexts.length === 0)).toBe(true);
  });
});

// --- loadMarketResearchContexts — 60s failure backoff (spec §5.3.1) --------
// Exercises the module-level Map<CockpitKey, retryAfterEpochMs> directly via
// an injected `loadTopic` stub (not loadOneTopicOverlay) and an injected
// clock, so the timeline is fully deterministic and independent of
// getCockpitData/getTopicConfig plumbing already covered above.

describe('loadMarketResearchContexts — 60s failure backoff', () => {
  const stubResult = (entry: BestXManifestEntry): TopicOverlayResult => ({
    ok: true,
    entry,
    contexts: [],
    rows: [],
  });

  it('does not re-invoke a topic still inside its 60s backoff window, reporting backoff instead of load_failed', async () => {
    let clock = 0;
    const now = () => clock;
    let failBusinessBanking = true;
    const loadTopic = vi.fn(async (_market: string, entry: BestXManifestEntry) => {
      if (entry.category === 'business-banking' && failBusinessBanking) {
        throw new Error('DB unavailable');
      }
      return stubResult(entry);
    });

    // t=0: business-banking fails for the first time.
    const first = await loadMarketResearchContexts('us', now, loadTopic);
    const firstBB = first.find((r) => r.entry.category === 'business-banking')!;
    expect(firstBB).toEqual({ ok: false, entry: firstBB.entry, reason: 'load_failed' });
    expect(loadTopic).toHaveBeenCalledTimes(TEST_MANIFEST.length);

    // t=30_000 (30s later, still inside the 60s window): must NOT call
    // loadTopic again for business-banking — only the other two topics.
    clock = 30_000;
    loadTopic.mockClear();
    const second = await loadMarketResearchContexts('us', now, loadTopic);
    const secondBB = second.find((r) => r.entry.category === 'business-banking')!;
    expect(secondBB).toEqual({ ok: false, entry: secondBB.entry, reason: 'backoff' });
    expect(loadTopic).toHaveBeenCalledTimes(TEST_MANIFEST.length - 1);
    expect(loadTopic).not.toHaveBeenCalledWith(
      'us',
      expect.objectContaining({ category: 'business-banking' }),
      expect.anything(),
    );

    // t=61_000 (past the 60s window): retries automatically and can succeed.
    clock = 61_000;
    failBusinessBanking = false;
    loadTopic.mockClear();
    const third = await loadMarketResearchContexts('us', now, loadTopic);
    const thirdBB = third.find((r) => r.entry.category === 'business-banking')!;
    expect(thirdBB.ok).toBe(true);
    expect(loadTopic).toHaveBeenCalledTimes(TEST_MANIFEST.length);
  });

  it('logs the structured warning exactly once per backoff window, not on every request that lands inside it', async () => {
    let clock = 0;
    const now = () => clock;
    const loadTopic = vi.fn(async (_market: string, entry: BestXManifestEntry) => {
      if (entry.category === 'forex') throw new Error('DB unavailable');
      return stubResult(entry);
    });

    await loadMarketResearchContexts('us', now, loadTopic); // t=0 — first failure, one warn
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('Research discovery topic unavailable', {
      market: 'us',
      category: 'forex',
      topic: 'forex-brokers',
      reason: 'load_failed',
    });

    clock = 30_000; // still inside the window — a second request
    await loadMarketResearchContexts('us', now, loadTopic);
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1); // no new warn

    clock = 45_000; // still inside the window — a third request
    await loadMarketResearchContexts('us', now, loadTopic);
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1); // still no new warn (this test's core claim)

    clock = 61_000; // window elapsed — a genuinely new failure opens a new window
    await loadMarketResearchContexts('us', now, loadTopic);
    expect(mockLoggerWarn).toHaveBeenCalledTimes(2);
  });
});

// --- flattenQualifiedOverlayRows — thin back-compat helper (spec §5.3.1) ---

describe('flattenQualifiedOverlayRows', () => {
  it('feeds existing NormalizedOverlayRow[] consumers unchanged: only the rows of successful topics, in order, skipping failed/backoff/missing-config topics entirely', () => {
    const rowA = makeOverlayRow({ category: 'trading', topic: 'trading-platforms', productSlug: 'acme' });
    const rowB = makeOverlayRow({ category: 'forex', topic: 'forex-brokers', productSlug: 'zeta' });

    const results: TopicOverlayResult[] = [
      { ok: true, entry: rowA.entry, contexts: [rowA.context], rows: [rowA] },
      { ok: false, entry: rowA.entry, reason: 'load_failed' },
      { ok: false, entry: rowA.entry, reason: 'backoff' },
      { ok: false, entry: rowA.entry, reason: 'missing_topic_config' },
      { ok: true, entry: rowB.entry, contexts: [rowB.context], rows: [rowB] },
    ];

    expect(flattenQualifiedOverlayRows(results)).toEqual([rowA, rowB]);
  });

  it('returns an empty array when every topic is unavailable', () => {
    const rowA = makeOverlayRow({ category: 'trading', topic: 'trading-platforms', productSlug: 'acme' });
    const results: TopicOverlayResult[] = [
      { ok: false, entry: rowA.entry, reason: 'load_failed' },
      { ok: false, entry: rowA.entry, reason: 'backoff' },
    ];

    expect(flattenQualifiedOverlayRows(results)).toEqual([]);
  });
});

// --- resolveOverlayContexts — injectable seam around the cached overlay ----
// Distinct from loadMarketResearchContexts's per-TOPIC resilience above: this
// guards against the cache LAYER itself throwing (unstable_cache, or its own
// logger), which .catch(() => []) used to swallow silently at the call site
// with no diagnostic at all. `load` is injected here instead of mocking
// next/cache, mirroring how the rest of this file bypasses the cache wrappers
// entirely for direct, network-free unit coverage.

describe('resolveOverlayContexts', () => {
  it('logs exactly one structured warning and returns [] when the cache layer itself throws, and the bundle still carries the full review catalog', async () => {
    const rejectingLoad = vi.fn(async () => {
      throw new Error('unstable_cache blew up');
    });

    const overlay = await resolveOverlayContexts('us', rejectingLoad);

    expect(overlay).toEqual([]);
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('Research discovery overlay cache unavailable', {
      market: 'us',
      scope: 'research-catalog-overlay-cache',
      errorType: 'Error',
    });

    // The whole point of the fallback: every review survives untouched, no
    // matter how badly the overlay cache layer itself failed.
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

    expect(catalog.items).toHaveLength(2);
    expect(catalog.items.every((i) => i.researchContexts.length === 0)).toBe(true);
  });
});
