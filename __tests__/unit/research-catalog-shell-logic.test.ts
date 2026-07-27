import { describe, expect, it } from "vitest";
import {
  buildScopedCompareUrl,
  cockpitKeyFor,
  computeDiscoveryFacets,
  countDiscoveryItems,
  migrateLegacyTradingShortlist,
  productItemId,
  projectDiscoveryItems,
  researchBaseForMarket,
  reviewItemId,
  shortlistStorageKey,
  sortHubProjections,
} from "@/lib/research/catalog-shell-logic";
import type {
  DiscoveryItem,
  DiscoveryProjection,
  DiscoveryReview,
  ResearchContext,
  StorageLike,
} from "@/lib/research/catalog-shell-logic";

describe("Discovery identity", () => {
  it("keeps topic out of a cockpit-only item id", () => {
    expect(productItemId("us", "credit-repair", "lexington-law")).toBe(
      "product:us:credit-repair:lexington-law",
    );
  });

  it("uses the canonical review href as review identity", () => {
    expect(reviewItemId("/us/trading/fidelity-review")).toBe(
      "review:/us/trading/fidelity-review",
    );
  });

  it("keeps category in the Cockpit key", () => {
    expect(cockpitKeyFor("us", "credit-repair", "companies")).not.toBe(
      cockpitKeyFor("us", "debt-relief", "companies"),
    );
  });
});

describe.each([
  ["us", "/research"],
  ["uk", "/uk/research"],
  ["ca", "/ca/research"],
  ["au", "/au/research"],
] as const)("researchBaseForMarket(%s)", (market, expected) => {
  it(`returns ${expected}`, () => {
    expect(researchBaseForMarket(market)).toBe(expected);
  });
});

const makeReview = (over: Partial<DiscoveryReview> = {}): DiscoveryReview => ({
  slug: "fidelity-review",
  href: "/us/trading/fidelity-review",
  title: "Fidelity Review",
  description: "Independent Fidelity review",
  bestFor: null,
  editorialRating: 4.8,
  publishDate: "2026-06-01",
  modifiedDate: "2026-07-01",
  readingWords: 2800,
  featured: false,
  pricing: null,
  ...over,
});

const makeContext = (over: Partial<ResearchContext> = {}): ResearchContext => ({
  cockpitKey: "us/trading/trading-platforms",
  topic: "trading-platforms",
  topicLabel: "Best Trading Platforms",
  manifestOrder: 0,
  productSlug: "fidelity",
  displayName: "Fidelity",
  tagline: "Full-service investing",
  bestFor: "Long-term investors",
  status: "audited",
  confidence: "high",
  dataVerifiedAt: "2026-07-03",
  auditedScore: 9.6,
  auditedRank: 1,
  dataPoints: 4,
  compareBaseHref: "/us/trading/best/trading-platforms",
  keyFacts: { optionsFee: "$0.65" },
  ...over,
});

const makeDiscoveryItem = (
  over: Partial<DiscoveryItem> = {},
): DiscoveryItem => ({
  id: "review:/us/trading/fidelity-review",
  market: "us",
  category: "trading",
  review: makeReview(),
  display: {
    title: "Fidelity Review",
    description: "Independent Fidelity review",
    bestFor: "Long-term investors",
    searchText: "fidelity review long term investors trading",
    sortDate: "2026-07-01",
  },
  researchContexts: [makeContext()],
  ...over,
});

const filters = {
  query: "",
  category: null,
  type: null,
  status: null,
  confidence: null,
  fresh: null,
  topic: null,
  specs: [] as string[],
} as const;

const item = makeDiscoveryItem({
  id: "review:/us/trading/fidelity-review",
  review: makeReview({ slug: "fidelity-review" }),
  researchContexts: [
    makeContext({
      cockpitKey: "us/trading/trading-platforms",
      topic: "trading-platforms",
      status: "audited",
      confidence: "high",
      auditedScore: 9.6,
      auditedRank: 1,
    }),
    makeContext({
      cockpitKey: "us/trading/options-brokers",
      topic: "options-brokers",
      manifestOrder: 1,
      status: "provisional",
    }),
  ],
});

it("projects one item once and prefers an explicit topic", () => {
  const result = projectDiscoveryItems([item], {
    ...filters,
    topic: "options-brokers",
  });
  expect(result).toHaveLength(1);
  expect(result[0].kind).toBe("dossier");
  expect(result[0].context?.topic).toBe("options-brokers");
});

it("type=review never emits a dossier projection", () => {
  const result = projectDiscoveryItems([item], { ...filters, type: "review" });
  expect(result).toEqual([
    expect.objectContaining({ itemId: item.id, kind: "review", context: null }),
  ]);
});

it("a research-only filter excludes a context-free review", () => {
  const reviewOnly = makeDiscoveryItem({ researchContexts: [] });
  expect(
    projectDiscoveryItems([reviewOnly], { ...filters, status: "audited" }),
  ).toEqual([]);
});

it("fresh compares dataVerifiedAt and never the review date", () => {
  const stale = makeDiscoveryItem({
    review: makeReview({ modifiedDate: "2026-07-27" }),
    researchContexts: [
      makeContext({ dataVerifiedAt: "2026-06-01", status: "audited" }),
    ],
  });
  expect(
    projectDiscoveryItems([stale], { ...filters, fresh: "2026-07-01" }),
  ).toEqual([]);
});

it("OR-combines values within one spec key", () => {
  const result = projectDiscoveryItems([item], {
    ...filters,
    specs: [
      "trading-platforms:optionsFee:$0",
      "trading-platforms:optionsFee:$0.65",
    ],
  });
  expect(result).toHaveLength(1);
});

it("AND-combines different spec keys", () => {
  const result = projectDiscoveryItems([item], {
    ...filters,
    specs: [
      "trading-platforms:optionsFee:$0.65",
      "trading-platforms:minDeposit:$500",
    ],
  });
  expect(result).toEqual([]);
});

it("counts union items without double-counting multi-topic dossiers", () => {
  expect(countDiscoveryItems([item])).toEqual({
    reviewBackedCount: 1,
    dossierCount: 1,
    discoveryItemCount: 1,
    auditedItemCount: 1,
    verifiedDataPointCount: expect.any(Number),
  });
});

// Single-context fixtures for the disjunctive-facet test below: each item
// carries exactly one qualified context so it can only ever land in one
// status bucket, isolating "ignores its own dimension" from "still respects
// the query" (unrelatedReview has no "trading" in its searchText at all).
const auditedFidelity = makeDiscoveryItem({
  id: "review:/us/trading/fidelity-review",
  review: makeReview({ slug: "fidelity-review" }),
  researchContexts: [
    makeContext({
      cockpitKey: "us/trading/trading-platforms",
      topic: "trading-platforms",
      status: "audited",
      confidence: "high",
      auditedScore: 9.6,
      auditedRank: 1,
    }),
  ],
});

const provisionalEtoro = makeDiscoveryItem({
  id: "review:/us/trading/etoro-review",
  category: "trading",
  review: makeReview({
    slug: "etoro-review",
    href: "/us/trading/etoro-review",
    title: "eToro Review",
    description: "Independent eToro review",
  }),
  display: {
    title: "eToro Review",
    description: "Independent eToro review",
    bestFor: "Social and copy trading",
    searchText: "etoro review social copy trading trading platforms",
    sortDate: "2026-07-02",
  },
  researchContexts: [
    makeContext({
      cockpitKey: "us/trading/trading-platforms",
      topic: "trading-platforms",
      productSlug: "etoro",
      displayName: "eToro",
      status: "provisional",
      confidence: null,
      auditedScore: null,
      auditedRank: null,
    }),
  ],
});

const unrelatedReview = makeDiscoveryItem({
  id: "review:/us/personal-finance/budgeting-app-review",
  category: "personal-finance",
  review: makeReview({
    slug: "budgeting-app-review",
    href: "/us/personal-finance/budgeting-app-review",
    title: "Budgeting App Review",
    description: "Independent budgeting app review",
  }),
  display: {
    title: "Budgeting App Review",
    description: "Independent budgeting app review",
    bestFor: null,
    searchText: "budgeting app review personal finance",
    sortDate: "2026-06-15",
  },
  researchContexts: [],
});

it("a status facet ignores its own active value but respects query", () => {
  const facets = computeDiscoveryFacets(
    [auditedFidelity, provisionalEtoro, unrelatedReview],
    { ...filters, query: "trading", status: "audited" },
  );
  expect(facets.statuses).toEqual([
    { value: "audited", count: 1 },
    { value: "provisional", count: 1 },
  ]);
});

// Hub-sort fixtures: three dossier projections sharing one topic's manifest
// position, so the comparator must fall through to audited rank and, for the
// provisional entry, to productSlug.
const rankOneContext = makeContext({
  productSlug: "rank-one",
  displayName: "Rank One",
  status: "audited",
  confidence: "high",
  auditedScore: 9.5,
  auditedRank: 1,
});
const rankOneItem = makeDiscoveryItem({
  id: "review:/us/trading/rank-one-review",
  review: makeReview({
    slug: "rank-one-review",
    href: "/us/trading/rank-one-review",
    title: "Rank One Review",
    description: "Independent rank one review",
  }),
  researchContexts: [rankOneContext],
});
const rankOne: DiscoveryProjection = {
  itemId: rankOneItem.id,
  kind: "dossier",
  item: rankOneItem,
  context: rankOneContext,
};

const rankTwoContext = makeContext({
  productSlug: "rank-two",
  displayName: "Rank Two",
  status: "audited",
  confidence: "high",
  auditedScore: 9.0,
  auditedRank: 2,
});
const rankTwoItem = makeDiscoveryItem({
  id: "review:/us/trading/rank-two-review",
  review: makeReview({
    slug: "rank-two-review",
    href: "/us/trading/rank-two-review",
    title: "Rank Two Review",
    description: "Independent rank two review",
  }),
  researchContexts: [rankTwoContext],
});
const rankTwo: DiscoveryProjection = {
  itemId: rankTwoItem.id,
  kind: "dossier",
  item: rankTwoItem,
  context: rankTwoContext,
};

const provisionalContext = makeContext({
  productSlug: "zzz-provisional",
  displayName: "Zzz Provisional",
  status: "provisional",
  confidence: null,
  auditedScore: null,
  auditedRank: null,
});
const provisionalItem = makeDiscoveryItem({
  id: "product:us:trading:zzz-provisional",
  review: null,
  display: {
    title: "Zzz Provisional",
    description: "In verification",
    bestFor: null,
    searchText: "zzz provisional trading platforms",
    sortDate: null,
  },
  researchContexts: [provisionalContext],
});
const provisional: DiscoveryProjection = {
  itemId: provisionalItem.id,
  kind: "dossier",
  item: provisionalItem,
  context: provisionalContext,
};

it("hub sort uses manifest order, audited rank, then stable item id", () => {
  expect(
    sortHubProjections([rankTwo, provisional, rankOne]).map((p) => p.itemId),
  ).toEqual([rankOne.itemId, rankTwo.itemId, provisional.itemId]);
});

// In-memory StorageLike stub so the storage contract stays testable without
// window.sessionStorage — mirrors what the PR 2 client adapter will inject.
const memoryStorage = (initial: Record<string, string> = {}): StorageLike => {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
};

it("separates same-named topics in different categories", () => {
  expect(shortlistStorageKey("us/credit-repair/companies")).not.toBe(
    shortlistStorageKey("us/debt-relief/companies"),
  );
});

it("does not overwrite an existing v2 value during pilot migration", () => {
  const storage = memoryStorage({
    "research-shortlist:us:trading-platforms": '["legacy"]',
    "research-shortlist:us:trading:trading-platforms": '["v2"]',
  });
  migrateLegacyTradingShortlist(storage);
  expect(
    storage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBe('["v2"]');
  expect(storage.getItem("research-shortlist:us:trading-platforms")).toBeNull();
});

it("migration sets the market pointer when none exists", () => {
  const storage = memoryStorage({
    "research-shortlist:us:trading-platforms": '["fidelity"]',
  });
  migrateLegacyTradingShortlist(storage);
  expect(storage.getItem("research-shortlist-active:us")).toBe(
    "trading:trading-platforms",
  );
  expect(
    storage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBe('["fidelity"]');
  expect(
    storage.getItem("research-shortlist:us:trading-platforms"),
  ).toBeNull();
});

it("migration never overwrites an existing pointer", () => {
  const storage = memoryStorage({
    "research-shortlist:us:trading-platforms": '["fidelity"]',
    "research-shortlist-active:us": "personal-finance:robo-advisors",
  });
  migrateLegacyTradingShortlist(storage);
  expect(storage.getItem("research-shortlist-active:us")).toBe(
    "personal-finance:robo-advisors",
  );
});

it("rejects slugs outside the active Cockpit key", () => {
  expect(
    buildScopedCompareUrl(
      "/us/trading/best/trading-platforms",
      ["fidelity", "foreign"],
      new Set(["fidelity"]),
    ),
  ).toBeNull();
});
