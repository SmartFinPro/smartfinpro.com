import { describe, expect, it } from "vitest";
import {
  buildScopedCompareUrl,
  cockpitKeyFor,
  computeDiscoveryFacets,
  countDiscoveryItems,
  migrateLegacyTradingShortlist,
  persistScopedShortlist,
  productItemId,
  projectDiscoveryItems,
  researchBaseForMarket,
  restoreScopedShortlist,
  reviewItemId,
  shortlistStorageKey,
  sortFinderItems,
  sortHubProjections,
  toggleScopedShortlist,
} from "@/lib/research/catalog-shell-logic";
import type {
  CockpitKey,
  DiscoveryItem,
  DiscoveryProjection,
  DiscoveryReview,
  ResearchContext,
  ScopedShortlist,
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

it("computeDiscoveryFacets counts every reachable alternative through the real pipeline, not just the item's default projection (spec §6.2)", () => {
  // The operator's exact regression scenario: `item` (defined above) has BOTH
  // an audited trading-platforms context AND a provisional options-brokers
  // context (a different manifest position). The buggy implementation only
  // tallied whichever ONE context `projectDiscoveryItems`'s DEFAULT branch
  // would pick for this item (its audited context — the default branch
  // prefers a qualified dossier over the review) — silently dropping
  // type=review, status=provisional, and topic=options-brokers even though
  // each of those filters, applied directly via projectDiscoveryItems,
  // yields exactly 1 result for this same item.
  const facets = computeDiscoveryFacets([item], filters);

  expect(facets.types).toEqual([
    { value: "review", count: 1 },
    { value: "dossier", count: 1 },
  ]);
  expect(facets.statuses).toEqual([
    { value: "audited", count: 1 },
    { value: "provisional", count: 1 },
  ]);
  expect(facets.topics.map(({ value, count }) => ({ value, count }))).toEqual([
    { value: "trading-platforms", count: 1 },
    { value: "options-brokers", count: 1 },
  ]);
  // Confidence stays audited-sourced (spec §6.2): the provisional context
  // never contributes a candidate, even though this fixture happens to
  // leave a non-null `confidence` on it (irrelevant to a provisional row).
  expect(facets.confidences).toEqual([{ value: "high", count: 1 }]);
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

it("sortFinderItems: featured beats a newer sortDate, and equal featured+sortDate falls back to item.id", () => {
  const featuredOlder = makeDiscoveryItem({
    id: "review:/us/trading/a-review",
    review: makeReview({ slug: "a-review", href: "/us/trading/a-review", featured: true }),
    display: {
      title: "A Review",
      description: "Independent A review",
      bestFor: null,
      searchText: "a review trading",
      sortDate: "2026-01-01",
    },
  });
  const nonFeaturedNewer = makeDiscoveryItem({
    id: "review:/us/trading/b-review",
    review: makeReview({ slug: "b-review", href: "/us/trading/b-review", featured: false }),
    display: {
      title: "B Review",
      description: "Independent B review",
      bestFor: null,
      searchText: "b review trading",
      sortDate: "2026-07-01", // newer than both featured items below
    },
  });
  const featuredOlderTie = makeDiscoveryItem({
    id: "review:/us/trading/c-review",
    review: makeReview({ slug: "c-review", href: "/us/trading/c-review", featured: true }),
    display: {
      title: "C Review",
      description: "Independent C review",
      bestFor: null,
      searchText: "c review trading",
      sortDate: "2026-01-01", // ties featuredOlder's sortDate exactly
    },
  });

  const sorted = sortFinderItems(
    [nonFeaturedNewer, featuredOlderTie, featuredOlder],
    { query: "", category: null },
  );

  expect(sorted.map((item) => item.id)).toEqual([
    featuredOlder.id, // featured, ties with featuredOlderTie -> id order ("a" < "c")
    featuredOlderTie.id,
    nonFeaturedNewer.id, // not featured -> last despite the newest sortDate
  ]);
});

// In-memory StorageLike stub so the storage contract stays testable without
// window.sessionStorage — mirrors what the PR 2 client adapter will inject.
// Also exposes `snapshot()` (beyond the StorageLike contract) so idempotence
// tests can assert on the storage's full state without knowing every key a
// function under test might touch.
const memoryStorage = (
  initial: Record<string, string> = {},
): StorageLike & { snapshot(): Record<string, string> } => {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    snapshot: () => Object.fromEntries(store),
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

it("normalizes the legacy value: strings only, deduped, capped at MAX_SHORTLIST", () => {
  const storage = memoryStorage({
    "research-shortlist:us:trading-platforms":
      '["a","a","b","c","d","e",42]',
  });
  migrateLegacyTradingShortlist(storage);
  expect(
    storage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBe('["a","b","c","d"]');
});

it("a malformed legacy value is discarded without touching the v2 key or pointer", () => {
  const storage = memoryStorage({
    "research-shortlist:us:trading-platforms": "not json{",
  });
  migrateLegacyTradingShortlist(storage);
  expect(
    storage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBeNull();
  expect(storage.getItem("research-shortlist-active:us")).toBeNull();
  expect(
    storage.getItem("research-shortlist:us:trading-platforms"),
  ).toBeNull();
});

it("a throwing storage.setItem leaves the legacy key intact", () => {
  const store = new Map<string, string>([
    ["research-shortlist:us:trading-platforms", '["fidelity"]'],
  ]);
  const throwingStorage: StorageLike = {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: () => {
      throw new Error("quota exceeded");
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };

  migrateLegacyTradingShortlist(throwingStorage);

  expect(
    throwingStorage.getItem("research-shortlist:us:trading-platforms"),
  ).toBe('["fidelity"]');
  expect(
    throwingStorage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBeNull();
});

it("migration is idempotent end-to-end", () => {
  const storage = memoryStorage({
    "research-shortlist:us:trading-platforms":
      '["fidelity","charles-schwab"]',
  });

  migrateLegacyTradingShortlist(storage);
  const afterFirst = storage.snapshot();
  migrateLegacyTradingShortlist(storage);
  const afterSecond = storage.snapshot();

  expect(afterSecond).toEqual(afterFirst);
});

it("restore round-trip: a migrated shortlist is actually reachable", () => {
  const storage = memoryStorage({
    "research-shortlist:us:trading-platforms":
      '["fidelity","charles-schwab"]',
  });

  migrateLegacyTradingShortlist(storage);

  const validScopes = new Map<CockpitKey, ReadonlySet<string>>([
    [
      "us/trading/trading-platforms",
      new Set(["fidelity", "charles-schwab", "etrade"]),
    ],
  ]);

  const restored = restoreScopedShortlist(storage, "us", validScopes);

  expect(restored).toEqual({
    cockpitKey: "us/trading/trading-platforms",
    slugs: ["fidelity", "charles-schwab"],
  });
});

it("toggleScopedShortlist: a cross-topic add requires a scope switch and never mutates the current state", () => {
  const current: ScopedShortlist = {
    cockpitKey: "us/trading/trading-platforms",
    slugs: ["fidelity"],
  };
  const currentSnapshot = { cockpitKey: current.cockpitKey, slugs: [...current.slugs] };

  const result = toggleScopedShortlist(
    current,
    "us/personal-finance/robo-advisors",
    "betterment",
    new Set(["betterment"]),
  );

  expect(result.requiresScopeSwitch).toBe(true);
  expect(result.next).toEqual({
    cockpitKey: "us/personal-finance/robo-advisors",
    slugs: ["betterment"],
  });
  expect(current).toEqual(currentSnapshot);
});

it("toggleScopedShortlist: removing the last slug clears the scope back to null", () => {
  const current: ScopedShortlist = {
    cockpitKey: "us/trading/trading-platforms",
    slugs: ["fidelity"],
  };

  const result = toggleScopedShortlist(
    current,
    "us/trading/trading-platforms",
    "fidelity",
    new Set(["fidelity"]),
  );

  expect(result.requiresScopeSwitch).toBe(false);
  expect(result.next).toEqual({ cockpitKey: null, slugs: [] });
});

it("persistScopedShortlist: an empty shortlist removes both the scoped key and the pointer", () => {
  const storage = memoryStorage({
    "research-shortlist-active:us": "trading:trading-platforms",
    "research-shortlist:us:trading:trading-platforms": '["fidelity"]',
  });

  persistScopedShortlist(storage, "us", {
    cockpitKey: "us/trading/trading-platforms",
    slugs: [],
  });

  expect(storage.getItem("research-shortlist-active:us")).toBeNull();
  expect(
    storage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBeNull();
});

it("restoreScopedShortlist: a pointer naming a scope absent from validScopes clears the pointer and that scope's stored key", () => {
  const storage = memoryStorage({
    "research-shortlist-active:us": "trading:trading-platforms",
    "research-shortlist:us:trading:trading-platforms": '["fidelity"]',
  });

  const validScopes = new Map<CockpitKey, ReadonlySet<string>>(); // trading-platforms is not a known scope on this page

  const restored = restoreScopedShortlist(storage, "us", validScopes);

  expect(restored).toEqual({ cockpitKey: null, slugs: [] });
  expect(storage.getItem("research-shortlist-active:us")).toBeNull();
  expect(
    storage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBeNull();
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
