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
  sortResearchContexts,
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
  attachLiveManifestOrder,
  buildDiscoveryCatalog,
  buildDiscoveryScopeSnapshot,
  flattenQualifiedOverlayRows,
  loadMarketReviewItems,
  loadMarketResearchContexts,
  loadOneTopicOverlay,
  resolveMarketResearchOverlay,
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

    const result = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'));

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

    const result = await loadOneTopicOverlay('us', entryFor('forex', 'forex-brokers'));

    expect(result).toEqual({
      ok: true,
      entry: entryFor('forex', 'forex-brokers'),
      contexts: [],
      rows: [],
    });
  });

  it('resolves ok:false missing_topic_config when the manifest entry has no resolvable TopicConfig', async () => {
    mockGetTopicConfig.mockReturnValue(null);

    const result = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'));

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

    await expect(loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'))).rejects.toThrow(
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

    const result = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'));
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

// --- attachLiveManifestOrder — post-cache-boundary manifest order (P2) -----
// Decision A P2 (operator-reported): getCachedTopicOverlay's cache KEY
// (['research-discovery-contexts', market, category, topic]) never included
// manifestOrder, but until this fix loadOneTopicOverlay baked the CALL-TIME
// manifestOrder into every context anyway — so a BEST_X_MANIFEST re-ordering
// left an existing cache entry silently serving the OLD position (and so the
// wrong sortResearchContexts order) for up to the full 3600s TTL.
// loadOneTopicOverlay is now manifest-order-free (every context it builds
// carries a `0` placeholder); attachLiveManifestOrder is the thin, cache-free
// post-step getCachedTopicOverlay always applies afterwards (hit or miss),
// tested directly here without going through unstable_cache (which requires
// a Next.js request runtime this vitest suite doesn't have).

describe('attachLiveManifestOrder', () => {
  const entryFor = (category: string, topic: string): BestXManifestEntry =>
    TEST_MANIFEST.find((e) => e.category === category && e.topic === topic) as unknown as BestXManifestEntry;

  it('loadOneTopicOverlay itself is manifest-order-free: every context it builds carries the 0 placeholder, never a real position', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category !== 'trading') return [];
      return [
        makeProduct({ slug: 'acme', category: 'trading', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
      ];
    });

    const result = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'));
    if (!result.ok) throw new Error('expected ok:true');

    expect(result.contexts[0].manifestOrder).toBe(0);
    expect(result.rows[0].context.manifestOrder).toBe(0);
  });

  it('overwrites a stale cached manifestOrder (0) with the live manifest order (3), reusing the cached payload with no re-fetch', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category !== 'trading') return [];
      return [
        makeProduct({ slug: 'acme', category: 'trading', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
      ];
    });

    // Simulates a fake cached payload built earlier (at manifestOrder 0) —
    // exactly what a real unstable_cache entry from before a manifest
    // re-ordering would still be serving.
    const cachedPayload = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'));
    if (!cachedPayload.ok) throw new Error('expected ok:true');
    expect(cachedPayload.contexts[0].manifestOrder).toBe(0);

    // The live manifest now places this topic at index 3 (e.g. after a
    // BEST_X_MANIFEST re-ordering). The post-cache step must reflect that
    // immediately, from the SAME cached payload, with no re-fetch.
    mockGetCockpitData.mockClear();
    const attached = attachLiveManifestOrder(cachedPayload, 3);

    expect(mockGetCockpitData).not.toHaveBeenCalled(); // no re-fetch — the cached payload is reused as-is
    if (!attached.ok) throw new Error('expected ok:true');
    expect(attached.contexts.every((c) => c.manifestOrder === 3)).toBe(true);
    expect(attached.rows.every((r) => r.context.manifestOrder === 3)).toBe(true);
    expect(attached.contexts).toEqual(attached.rows.map((r) => r.context));

    // The original cached object itself is never mutated in place — a real
    // cache can hand the identical object to a second concurrent reader
    // requesting a DIFFERENT live order (see the next test).
    expect(cachedPayload.contexts[0].manifestOrder).toBe(0);
  });

  it('applies a DIFFERENT live order to the same cached payload on a second read, proving the order always comes from the live manifest, not from whatever was cached first', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category !== 'trading') return [];
      return [
        makeProduct({ slug: 'acme', category: 'trading', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
      ];
    });
    const cachedPayload = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'));
    if (!cachedPayload.ok) throw new Error('expected ok:true');

    const firstRead = attachLiveManifestOrder(cachedPayload, 3);
    const secondRead = attachLiveManifestOrder(cachedPayload, 5);

    if (!firstRead.ok || !secondRead.ok) throw new Error('expected ok:true');
    expect(firstRead.contexts[0].manifestOrder).toBe(3);
    expect(secondRead.contexts[0].manifestOrder).toBe(5);
  });

  it('leaves a failure result (missing_topic_config / load_failed / backoff) untouched — there are no contexts to reorder', () => {
    const entry = entryFor('trading', 'trading-platforms');
    const failure: TopicOverlayResult = { ok: false, entry, reason: 'load_failed' };

    expect(attachLiveManifestOrder(failure, 3)).toEqual(failure);
  });

  it('downstream sortResearchContexts orders by the LIVE manifest position, not the stale cached one', async () => {
    // Topic A was cached first (order 0 at cache-write time); topic B was
    // cached second (order 1 at cache-write time). The live manifest has
    // since swapped them — topic B is now first (0), topic A is now second
    // (1). Ordering must follow the LIVE positions, not the cached ones.
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category === 'trading') {
        return [
          makeProduct({ slug: 'topic-a-co', category: 'trading', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
        ];
      }
      if (category === 'forex') {
        return [
          makeProduct({ slug: 'topic-b-co', category: 'forex', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
        ];
      }
      return [];
    });

    const cachedA = await loadOneTopicOverlay('us', entryFor('trading', 'trading-platforms'));
    const cachedB = await loadOneTopicOverlay('us', entryFor('forex', 'forex-brokers'));
    if (!cachedA.ok || !cachedB.ok) throw new Error('expected ok:true');

    const liveA = attachLiveManifestOrder(cachedA, 1); // topic A is now SECOND
    const liveB = attachLiveManifestOrder(cachedB, 0); // topic B is now FIRST
    if (!liveA.ok || !liveB.ok) throw new Error('expected ok:true');

    const sorted = sortResearchContexts([...liveA.contexts, ...liveB.contexts]);
    expect(sorted.map((c) => c.productSlug)).toEqual(['topic-b-co', 'topic-a-co']);
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

// --- loadMarketResearchContexts — singleflight under concurrent requests --
// (Decision A P1, operator-reported): the 60s backoff above is a
// check-then-act race — several concurrent requests can all read
// topicBackoffUntil.get(cockpitKey) and pass the `retryAfter > now()` check
// BEFORE the first failure ever writes the map, so N concurrent requests for
// one topic each independently call loadTopic and each independently warn.
// The fix is a process-local singleflight: one shared in-flight
// Promise<TopicOverlayResult> per CockpitKey. Critically, the memoized
// promise must cover the ENTIRE attempt — the loadTopic call, the catch, the
// backoff-map write, and the logger.warn — not just the raw loader promise;
// otherwise every awaiter would still run its own catch/warn once the shared
// loader promise rejects, and the log storm the fix exists to close would
// remain even though the loader itself was only called once. These tests
// fire real concurrent requests (Promise.all) with the injected loader
// resolving/rejecting only after a delay, so every caller genuinely arrives
// while the first attempt is still in flight.

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('loadMarketResearchContexts — singleflight under concurrent requests (P1)', () => {
  const stubResult = (entry: BestXManifestEntry): TopicOverlayResult => ({
    ok: true,
    entry,
    contexts: [],
    rows: [],
  });

  it('fires exactly one loader call and exactly one warn when 5 concurrent requests race for the same failing topic, and every caller receives the identical failure result', async () => {
    let clock = 0;
    const now = () => clock;
    let businessBankingCalls = 0;
    const loadTopic = vi.fn(async (_market: string, entry: BestXManifestEntry) => {
      if (entry.category === 'business-banking') {
        businessBankingCalls += 1;
        await delay(15); // every concurrent caller below arrives inside this window
        throw new Error('DB unavailable');
      }
      return stubResult(entry);
    });

    const N = 5;
    const allResults = await Promise.all(
      Array.from({ length: N }, () => loadMarketResearchContexts('us', now, loadTopic)),
    );

    expect(businessBankingCalls).toBe(1);
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('Research discovery topic unavailable', {
      market: 'us',
      category: 'business-banking',
      topic: 'business-bank-accounts',
      reason: 'load_failed',
    });

    const bbResults = allResults.map(
      (results) => results.find((r) => r.entry.category === 'business-banking')!,
    );
    const first = bbResults[0];
    expect(first.ok).toBe(false);
    if (first.ok) throw new Error('expected ok:false');
    expect(first.reason).toBe('load_failed');
    for (const bb of bbResults) {
      expect(bb).toBe(first); // every concurrent caller shares the IDENTICAL resolved failure object
    }

    // Behavioral proof the backoff map was actually written (exactly once,
    // alongside the single warn above, not zero times and not repeatedly):
    // the very next request in the same tick must be short-circuited as
    // 'backoff' instead of attempting a fresh load.
    loadTopic.mockClear();
    const followUp = await loadMarketResearchContexts('us', now, loadTopic);
    const followUpBB = followUp.find((r) => r.entry.category === 'business-banking')!;
    expect(followUpBB).toEqual({ ok: false, entry: followUpBB.entry, reason: 'backoff' });
    expect(loadTopic).not.toHaveBeenCalledWith(
      'us',
      expect.objectContaining({ category: 'business-banking' }),
      expect.anything(),
    );
  });

  it('fires exactly one loader call when 5 concurrent requests race for the same SUCCEEDING topic, and every caller receives the identical success result', async () => {
    let clock = 0;
    const now = () => clock;
    let tradingCalls = 0;
    const loadTopic = vi.fn(async (_market: string, entry: BestXManifestEntry) => {
      if (entry.category === 'trading') {
        tradingCalls += 1;
        await delay(15);
        return stubResult(entry);
      }
      return stubResult(entry);
    });

    const N = 5;
    const allResults = await Promise.all(
      Array.from({ length: N }, () => loadMarketResearchContexts('us', now, loadTopic)),
    );

    expect(tradingCalls).toBe(1);
    const tradingResults = allResults.map(
      (results) => results.find((r) => r.entry.category === 'trading')!,
    );
    const first = tradingResults[0];
    expect(first.ok).toBe(true);
    for (const trading of tradingResults) {
      expect(trading).toBe(first); // every concurrent caller shares the IDENTICAL resolved success object
    }
  });

  it('lets two different topics load in parallel — the singleflight guard is per CockpitKey, not a global lock', async () => {
    let clock = 0;
    const now = () => clock;
    let active = 0;
    let maxActive = 0;
    const loadTopic = vi.fn(async (_market: string, entry: BestXManifestEntry) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await delay(15);
      active -= 1;
      return stubResult(entry);
    });

    const results = await loadMarketResearchContexts('us', now, loadTopic);

    expect(loadTopic).toHaveBeenCalledTimes(TEST_MANIFEST.length);
    expect(maxActive).toBeGreaterThanOrEqual(2);
    expect(results.every((r) => r.ok)).toBe(true);
  });

  it('is identity-safe: an older attempt settling late must not evict a newer attempt in-flight entry for the same key', async () => {
    let clock = 0;
    const now = () => clock;
    let businessBankingCalls = 0;
    const deferred: Record<number, { resolve: () => void }> = {};
    const loadTopic = vi.fn(async (_market: string, entry: BestXManifestEntry) => {
      if (entry.category !== 'business-banking') return stubResult(entry);
      businessBankingCalls += 1;
      const myGeneration = businessBankingCalls;
      return new Promise<TopicOverlayResult>((resolve) => {
        deferred[myGeneration] = { resolve: () => resolve(stubResult(entry)) };
      });
    });

    // Generation 1 starts and registers its own in-flight entry.
    const gen1 = loadMarketResearchContexts('us', now, loadTopic);

    // Simulate an external reset racing against a still-pending attempt
    // (e.g. test teardown between suites) — clears the in-flight map WITHOUT
    // generation 1 ever settling.
    __resetTopicOverlayBackoffForTests();

    // Generation 2 starts fresh (the map is empty) and registers ITS OWN
    // in-flight entry for the identical CockpitKey.
    const gen2 = loadMarketResearchContexts('us', now, loadTopic);

    // A third caller, arriving while generation 2 is still pending, must
    // join generation 2 rather than start a third real load.
    const gen3 = loadMarketResearchContexts('us', now, loadTopic);
    expect(businessBankingCalls).toBe(2);

    // Let generation 1 settle LATE, after generations 2/3 already exist.
    deferred[1].resolve();
    await gen1;

    // A caller arriving right after generation 1's cleanup ran must still
    // join generation 2 — an identity-UNSAFE cleanup would have deleted
    // generation 2's map entry here and forced a fresh (3rd) load instead.
    const gen4 = loadMarketResearchContexts('us', now, loadTopic);
    expect(businessBankingCalls).toBe(2);

    deferred[2].resolve();
    await Promise.all([gen2, gen3, gen4]);
    expect(businessBankingCalls).toBe(2);
  });

  it('__resetTopicOverlayBackoffForTests clears the in-flight map too, so a reset genuinely re-enables a fresh loader call', async () => {
    let clock = 0;
    const now = () => clock;
    let businessBankingCalls = 0;
    const deferred: Record<number, { resolve: () => void }> = {};
    const loadTopic = vi.fn(async (_market: string, entry: BestXManifestEntry) => {
      if (entry.category !== 'business-banking') return stubResult(entry);
      businessBankingCalls += 1;
      const myGeneration = businessBankingCalls;
      return new Promise<TopicOverlayResult>((resolve) => {
        deferred[myGeneration] = { resolve: () => resolve(stubResult(entry)) };
      });
    });

    const inFlightCall = loadMarketResearchContexts('us', now, loadTopic);
    __resetTopicOverlayBackoffForTests();
    const secondCall = loadMarketResearchContexts('us', now, loadTopic);

    // If the reset had NOT cleared the in-flight map, secondCall would have
    // found generation 1's stale (but still-registered) entry and reused it
    // instead of starting a genuinely fresh load.
    expect(businessBankingCalls).toBe(2);

    deferred[1].resolve();
    deferred[2].resolve();
    await Promise.all([inFlightCall, secondCall]);
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

// --- resolveMarketResearchOverlay — injectable seam around the cached ------
// overlay, ONE fan-out (operator merge-blocker fix, 2026-07-27). Distinct
// from loadMarketResearchContexts's per-TOPIC resilience above: this guards
// against the cache LAYER itself throwing (unstable_cache, or its own
// logger), which .catch(() => []) used to swallow silently at the call site
// with no diagnostic at all. `load` is injected here instead of mocking
// next/cache, mirroring how the rest of this file bypasses the cache wrappers
// entirely for direct, network-free unit coverage. Renamed from the old
// `resolveOverlayContexts` (which returned a bare `NormalizedOverlayRow[]`):
// this function now returns BOTH the flattened rows AND the serializable
// `ShortlistScopeSnapshotDTO` — derived from the identical `results` a single
// `load(market)` call resolves, never two independent loader calls (spec
// §11.2.1's "ONE fan-out, one source").

describe('resolveMarketResearchOverlay', () => {
  it('logs exactly one structured warning, returns empty rows, and marks EVERY known scope unknown_state when the cache layer itself throws — the bundle still carries the full review catalog', async () => {
    const rejectingLoad = vi.fn(async () => {
      throw new Error('unstable_cache blew up');
    });

    const overlay = await resolveMarketResearchOverlay('us', rejectingLoad);

    expect(overlay.rows).toEqual([]);
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('Research discovery overlay cache unavailable', {
      market: 'us',
      scope: 'research-catalog-overlay-cache',
      errorType: 'Error',
    });

    // Requirement 6 (operator): a market-wide cache-LAYER failure cannot
    // vouch for ANY topic, so every known scope — never just the ones that
    // happened to load — is reported unavailable('unknown_state'), never
    // guessed available-empty.
    expect(overlay.scopeSnapshot.knownScopes).toHaveLength(TEST_MANIFEST.length);
    expect(overlay.scopeSnapshot.availableScopes).toEqual([]);
    expect(overlay.scopeSnapshot.unavailableScopes).toHaveLength(TEST_MANIFEST.length);
    expect(overlay.scopeSnapshot.unavailableScopes.every((entry) => entry.reason === 'unknown_state')).toBe(
      true,
    );

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

    const { catalog } = buildDiscoveryCatalog('us', [reviewA, reviewB], overlay.rows);

    expect(catalog.items).toHaveLength(2);
    expect(catalog.items.every((i) => i.researchContexts.length === 0)).toBe(true);
  });

  // --- Mandatory test (c) — one fan-out, one source (operator, binding) ----
  it('invokes the per-topic loader EXACTLY ONCE per topic — the flattened catalog rows and the scope snapshot DTO are derived from the SAME single TopicOverlayResult[] load, never two independent loader calls', async () => {
    mockGetCockpitData.mockImplementation(async (_market: string, category: string) => {
      if (category === 'trading') {
        return [
          makeProduct({ slug: 'acme', category: 'trading', reviewSlug: null, researchStatus: 'audited', fieldSources: { fee: src() } }),
        ];
      }
      return []; // business-banking, forex — load fine, zero qualifying rows
    });

    const callCountByTopic = new Map<string, number>();
    const countingLoadTopic = async (
      market: 'us' | 'uk' | 'ca' | 'au',
      entry: BestXManifestEntry,
      manifestOrder: number,
    ): Promise<TopicOverlayResult> => {
      const key = `${entry.category}/${entry.topic}`;
      callCountByTopic.set(key, (callCountByTopic.get(key) ?? 0) + 1);
      void manifestOrder;
      return loadOneTopicOverlay(market, entry);
    };

    const overlay = await resolveMarketResearchOverlay('us', (market) =>
      loadMarketResearchContexts(market, () => 0, countingLoadTopic),
    );

    // Exactly one call per manifest topic — never two (which a "fetch once
    // for the catalog, fetch again for the snapshot" implementation would
    // produce).
    expect(callCountByTopic.size).toBe(TEST_MANIFEST.length);
    for (const count of callCountByTopic.values()) expect(count).toBe(1);

    // Both artifacts are actually populated FROM that one load, proving
    // there's real substance behind the call-count assertion above — not
    // just two vacuously-empty results.
    expect(overlay.rows.length).toBeGreaterThan(0);
    expect(overlay.scopeSnapshot.knownScopes).toHaveLength(TEST_MANIFEST.length);
    const tradingScope = overlay.scopeSnapshot.availableScopes.find(
      (entry) => entry.cockpitKey === 'us/trading/trading-platforms',
    );
    expect(tradingScope?.slugs).toEqual(['acme']);
  });
});

// --- buildDiscoveryScopeSnapshot — the server-side DTO adapter -------------
// (spec §11.2.1, operator merge-blocker fix 2026-07-27). Mandatory tests (a)
// and (b)'s TYPED-data half: proves the adapter itself never collapses
// "loaded fine, zero rows" (ok:true) and "failed/backed off" (ok:false) into
// the same classification — the exact distinction the old client-side
// buildShortlistScopeSnapshot (removed from ResearchShortlist.tsx) could not
// make once data had already flattened into DiscoveryItem[]. The DTO's
// consumption by restoreScopedShortlist (proving the actual storage
// cleanup/preservation behavior for these same two cases) is covered in
// __tests__/unit/research-shortlist-ui-state.test.ts, which hydrates this
// exact function's output.

describe('buildDiscoveryScopeSnapshot', () => {
  const entryFor = (category: string, topic: string): BestXManifestEntry =>
    TEST_MANIFEST.find((e) => e.category === category && e.topic === topic) as unknown as BestXManifestEntry;

  it('(a) an ok:true result with an EMPTY contexts array is classified availableScopes with an empty slug set — never unavailable/unknown_state', () => {
    const results: TopicOverlayResult[] = TEST_MANIFEST.map((m) =>
      m.category === 'trading' && m.topic === 'trading-platforms'
        ? { ok: true, entry: entryFor('trading', 'trading-platforms'), contexts: [], rows: [] }
        : { ok: false, entry: entryFor(m.category, m.topic), reason: 'load_failed' },
    );

    const dto = buildDiscoveryScopeSnapshot('us', results);

    const tradingEntry = dto.availableScopes.find((e) => e.cockpitKey === 'us/trading/trading-platforms');
    expect(tradingEntry).toEqual({ cockpitKey: 'us/trading/trading-platforms', slugs: [] });
    expect(dto.unavailableScopes.some((e) => e.cockpitKey === 'us/trading/trading-platforms')).toBe(false);
  });

  it('(b) an ok:false result carries its REAL reason straight through — never defaulted to unknown_state', () => {
    const results: TopicOverlayResult[] = [
      { ok: false, entry: entryFor('trading', 'trading-platforms'), reason: 'load_failed' },
      { ok: true, entry: entryFor('business-banking', 'business-bank-accounts'), contexts: [], rows: [] },
      { ok: true, entry: entryFor('forex', 'forex-brokers'), contexts: [], rows: [] },
    ];

    const dto = buildDiscoveryScopeSnapshot('us', results);

    expect(dto.unavailableScopes).toEqual([
      { cockpitKey: 'us/trading/trading-platforms', reason: 'load_failed' },
    ]);
  });

  it('partitions every known scope into EXACTLY ONE of availableScopes/unavailableScopes for a full set of results — disjoint and gapless (merge-blocker invariant)', () => {
    const results: TopicOverlayResult[] = [
      { ok: true, entry: entryFor('trading', 'trading-platforms'), contexts: [], rows: [] },
      { ok: false, entry: entryFor('business-banking', 'business-bank-accounts'), reason: 'backoff' },
      { ok: false, entry: entryFor('forex', 'forex-brokers'), reason: 'missing_topic_config' },
    ];

    const dto = buildDiscoveryScopeSnapshot('us', results);

    expect(dto.knownScopes).toHaveLength(TEST_MANIFEST.length);
    for (const cockpitKey of dto.knownScopes) {
      const inAvailable = dto.availableScopes.some((e) => e.cockpitKey === cockpitKey);
      const inUnavailable = dto.unavailableScopes.some((e) => e.cockpitKey === cockpitKey);
      expect(inAvailable && inUnavailable).toBe(false); // disjoint
      expect(inAvailable || inUnavailable).toBe(true); // gapless
    }
  });

  it('a known scope with NO corresponding result at all is the ONE case classified unknown_state (genuinely missing result bucket)', () => {
    // Only two of the three TEST_MANIFEST topics have a result.
    const results: TopicOverlayResult[] = [
      { ok: true, entry: entryFor('trading', 'trading-platforms'), contexts: [], rows: [] },
      { ok: false, entry: entryFor('business-banking', 'business-bank-accounts'), reason: 'backoff' },
    ];

    const dto = buildDiscoveryScopeSnapshot('us', results);

    expect(dto.unavailableScopes).toContainEqual({
      cockpitKey: 'us/forex/forex-brokers',
      reason: 'unknown_state',
    });
  });
});
