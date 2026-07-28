// __tests__/unit/research-hub-integration.test.ts
// Adversarial integration coverage for the Research hub's P1 fixes (review
// of PR #122, commit 5 of the fix set) — end-to-end through the REAL
// production functions (buildDiscoveryCatalog, buildResearchNodeBank,
// projectDiscoveryItems, sortHubProjections, resolveEntry,
// computeDiscoveryFacets), never a hand-rolled re-implementation of any of
// them.
//
// (a) "an item whose default projection is a dossier stays visible as a
//     review under ?type=review" is covered as a REAL browser test —
//     e2e/research-shell.spec.ts, against a real production build, using
//     Fidelity (audited #1 in us/trading/trading-platforms, and
//     review-backed) as the live fixture.
//
// (b) "with an explicit topic selected, a secondary context becomes
//     visible, and DOM count, live-region count, facet count and the
//     tracked resultCount all agree" — NOT coverable as a live browser test
//     today. Investigated exhaustively (2026-07-28): BEST_X_MANIFEST
//     (lib/comparison/topics/manifest.ts) has exactly ONE (market, category)
//     pair with more than one topic — us/personal-finance (robo-advisors,
//     high-yield-savings, credit-card-companies, credit-monitoring) — every
//     other category has exactly one topic per market, so a genuine
//     multi-context DiscoveryItem (spec §4.1: same market+category+
//     productSlug qualifying under 2+ topics) is structurally impossible
//     anywhere else. A live check of all four us/personal-finance topics'
//     rendered product slugs (via a real browser against the production
//     build) found ZERO overlap — 6 robo-advisors + 8 high-yield-savings +
//     10 credit-card-companies + 8 credit-monitoring slugs, all distinct.
//     All four hubs currently have zero multi-context items — exactly the
//     condition under which the operator's instructions call for a
//     fixture-driven unit test instead of faking a browser case. This
//     block is that fixture-driven test: it reuses
//     __tests__/unit/research-hub-schema.test.ts's own established fixture
//     shape (a Fidelity item deliberately qualifying in TWO topics) and
//     proves the four counts genuinely agree by computing each one via its
//     OWN real production code path — never by asserting one against a
//     copy of itself.
//
// (c) The unavailable-scope open→wait→cancel→byte-identical guarantee's
//     "browser-level counterpart" (commit 2's unit test) is a documented
//     DEVIATION, not covered here or in e2e — see this repo's final PR
//     report / commit message for commit 5 for the full investigation:
//     no query param, header, env var, or other codebase-native seam exists
//     to force one SPECIFIC KNOWN Cockpit topic into the `unavailable`
//     classification (backoff / load_failed / missing_topic_config /
//     unknown_state) for a single real e2e run against a live production
//     build without adding new production code outside this fix's six
//     authorized commits — and doing that would itself be exactly the kind
//     of "fake a browser case" the operator's instructions rule out. The
//     guarantee is proven at the pure-logic level in
//     __tests__/unit/research-shortlist-ui-state.test.ts (both the
//     'proposing/cancelling a cross-scope switch never touches the reducer'
//     block and the pre-existing Rule-2-restore cross-scope test), and the
//     REACHABLE half of the SAME guarantee — a real cross-scope switch on
//     an AVAILABLE active scope, including an explicit wait between open
//     and cancel — is hardened as a genuine e2e test in
//     e2e/research-shell.spec.ts's 'scope switch: adding from another
//     research topic is blocked behind a dialog until "Switch & add"' test.

import { describe, expect, it, vi } from 'vitest';
import type { Category } from '@/lib/i18n/config';
import type { FieldSource, FilterKey, ProductForComparison } from '@/lib/comparison/types';
import type { BestXManifestEntry } from '@/lib/comparison/topics/manifest';
import type { ResearchProduct } from '@/lib/research/adapter';
import type { DiscoveryItem, DiscoveryReview, ResearchContext } from '@/lib/research/catalog-shell-logic';
import {
  cockpitKeyFor,
  computeDiscoveryFacets,
  EMPTY_DISCOVERY_FILTERS,
  projectDiscoveryItems,
  sortHubProjections,
  type DiscoveryFilters,
} from '@/lib/research/catalog-shell-logic';
import { buildDiscoveryCatalog } from '@/lib/research/catalog';
import { buildResearchNodeBank } from '@/components/research/ResearchHubPage';
import { resolveEntry } from '@/components/research/ResearchHub';

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
  resolveCockpitCta: () => ({
    label: 'Visit site',
    href: '#',
    external: false,
    tracked: false,
    ctaMode: 'unavailable',
    destinationType: 'unavailable',
  }),
}));

// --- Fixtures — mirrors research-hub-schema.test.ts's local helpers -------

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
    slug: 'fidelity',
    displayName: 'Fidelity',
    initial: 'F',
    tagline: 'Full-service investing',
    logoUrl: null,
    verified: true,
    score: 9,
    rating: 0,
    reviewCount: 0,
    monthlyFee: 0,
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
    reviewSlug: 'fidelity',
    externalUrl: null,
    isTopPick: false,
    bestFor: 'Long-term investors',
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
      fieldSources: { fee: src() },
    } as ResearchProduct['research'],
    rank,
    displayScore: product.score,
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
  };
  const researchProduct = makeResearchProduct(
    makeProduct({ slug: params.productSlug, category: params.category, market, reviewSlug }),
    1,
  );
  return { entry, context, researchProduct, reviewSlug };
}

describe('(b) fixture-driven substitute: a secondary context is visible, and DOM/live-region/facet/tracked counts all agree (P1 fix)', () => {
  it('an explicit ?topic= for a SECOND qualifying context resolves a real node, and the resolved-entry count matches the independently-computed facet count for that same topic', () => {
    // Fidelity qualifies in BOTH trading-platforms (manifestOrder 0, the
    // DEFAULT context) and options-brokers (manifestOrder 1, the SECONDARY
    // context an explicit ?topic=options-brokers filter selects instead).
    const fidelityRowA = makeOverlayRow({
      category: 'trading',
      topic: 'trading-platforms',
      productSlug: 'fidelity',
      reviewSlug: 'fidelity',
      manifestOrder: 0,
    });
    const fidelityRowB = makeOverlayRow({
      category: 'trading',
      topic: 'options-brokers',
      productSlug: 'fidelity',
      reviewSlug: 'fidelity',
      manifestOrder: 1,
    });
    // A second, unrelated item so the topic facet has more than one
    // candidate item to distinguish real filtering from a length-1
    // coincidence.
    const schwabRow = makeOverlayRow({
      category: 'trading',
      topic: 'trading-platforms',
      productSlug: 'charles-schwab',
      manifestOrder: 0,
    });

    const { catalog, dossierRows } = buildDiscoveryCatalog(
      'us',
      [makeDiscoveryItem()],
      [fidelityRowA, fidelityRowB, schwabRow],
    );
    expect(catalog.items).toHaveLength(2); // Fidelity (1 item, 2 contexts) + Schwab

    // The COMPLETE node bank (P1 fix) — this is what the client shell's
    // `nodes` prop is actually built from now (ResearchHubPage.tsx).
    const nodeBank = buildResearchNodeBank({ catalog, dossierRows });
    const nodeByKey = new Map(nodeBank.map((n) => [n.key, n.node]));

    // --- Witness 1: resolved entries for `?topic=options-brokers` — this
    //     SINGLE value is what ResearchHub.tsx's `resolvedEntries.length`
    //     feeds into the DOM (<div>{entries}</div> per group), the sr-only
    //     live region, the visible "N results" text, AND
    //     `tracker.trackSearch(...)`'s `resultCount` argument all at once
    //     (one shared variable in the real component — see its own "single
    //     source" doc comment) — so proving this ONE number is correct is
    //     what proves all four agree in production. ------------------------
    const filters: DiscoveryFilters = { ...EMPTY_DISCOVERY_FILTERS, topic: 'options-brokers' };
    const projections = sortHubProjections(projectDiscoveryItems(catalog.items, filters));
    const resolvedEntries = projections
      .map((projection) => resolveEntry(projection, nodeByKey))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    expect(resolvedEntries).toHaveLength(1); // only Fidelity qualifies for options-brokers
    expect(resolvedEntries[0].productSlug).toBe('fidelity');
    expect(resolvedEntries[0].topic).toBe('options-brokers');
    // The node genuinely resolved (not a null/dropped projection) — the
    // exact regression the P1 node-bank fix closes.
    expect(resolvedEntries[0].node).not.toBeNull();

    // --- Witness 2: computeDiscoveryFacets' topic facet count — an
    //     INDEPENDENT re-run of the real projection pipeline per candidate
    //     topic (its own doc comment: "RUNNING THE REAL PIPELINE with that
    //     dimension SET to v"), never reading `resolvedEntries` itself. ----
    const facets = computeDiscoveryFacets(catalog.items, filters);
    const optionsBrokersFacet = facets.topics.find((t) => t.value === 'options-brokers');
    expect(optionsBrokersFacet, 'options-brokers must appear as a selectable topic facet').toBeDefined();

    // The two independently-computed witnesses must agree.
    expect(resolvedEntries.length).toBe(optionsBrokersFacet!.count);
    expect(optionsBrokersFacet!.count).toBe(1);
  });
});
