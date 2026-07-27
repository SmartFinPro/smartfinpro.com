import { describe, expect, it } from "vitest";
import {
  buildScopedCompareUrl,
  cockpitKeyFor,
  computeDiscoveryFacets,
  countDiscoveryItems,
  describeScopeSwitch,
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
  ShortlistScopeSnapshot,
  StorageLike,
  UnavailableScopeReason,
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

// Builds a ShortlistScopeSnapshot (spec §11.2.1) from plain object literals so
// tests stay readable. `knownScopes` defaults to the union of every key
// mentioned in `available`/`unavailable` (the normal production shape: every
// manifest topic ends up in exactly one of the two buckets) plus whatever
// `extraKnown` keys the test wants to add on top (e.g. a scope that is known
// but — deliberately, for one defensive test — in neither bucket).
const makeSnapshot = (
  available: Record<string, string[]> = {},
  unavailable: Record<string, UnavailableScopeReason> = {},
  extraKnown: CockpitKey[] = [],
): ShortlistScopeSnapshot => {
  const availableScopes = new Map<CockpitKey, ReadonlySet<string>>(
    Object.entries(available).map(([key, slugs]) => [
      key as CockpitKey,
      new Set(slugs),
    ]),
  );
  const unavailableScopes = new Map<CockpitKey, UnavailableScopeReason>(
    Object.entries(unavailable).map(([key, reason]) => [
      key as CockpitKey,
      reason,
    ]),
  );
  const knownScopes = new Set<CockpitKey>([
    ...availableScopes.keys(),
    ...unavailableScopes.keys(),
    ...extraKnown,
  ]);
  return { knownScopes, availableScopes, unavailableScopes };
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

it("retries and completes after a partial failure: v2 write succeeds, pointer write throws, then a later call finishes the job", () => {
  const legacyKey = "research-shortlist:us:trading-platforms";
  const v2Key = "research-shortlist:us:trading:trading-platforms";
  const pointerKey = "research-shortlist-active:us";
  const store = new Map<string, string>([[legacyKey, '["fidelity","charles-schwab"]']]);
  let throwOnPointerWrite = true;
  const storage: StorageLike = {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      if (key === pointerKey && throwOnPointerWrite) {
        throw new Error("quota exceeded");
      }
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };

  // Call 1: the v2 write succeeds, but the pointer write throws — the
  // legacy key must survive so a later call can retry the failed step.
  migrateLegacyTradingShortlist(storage);
  expect(storage.getItem(v2Key)).toBe('["fidelity","charles-schwab"]');
  expect(storage.getItem(pointerKey)).toBeNull();
  expect(storage.getItem(legacyKey)).toBe('["fidelity","charles-schwab"]');

  // Call 2 (retry, storage healthy again): v2 already holds a value so its
  // write is skipped entirely; only the still-absent pointer is attempted,
  // and this time it succeeds — completing the migration.
  throwOnPointerWrite = false;
  migrateLegacyTradingShortlist(storage);
  expect(storage.getItem(pointerKey)).toBe("trading:trading-platforms");
  expect(storage.getItem(legacyKey)).toBeNull();

  const snapshot = makeSnapshot({
    "us/trading/trading-platforms": ["fidelity", "charles-schwab", "etrade"],
  });
  const restored = restoreScopedShortlist(storage, "us", snapshot);
  expect(restored).toEqual({
    cockpitKey: "us/trading/trading-platforms",
    slugs: ["fidelity", "charles-schwab"],
  });
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

  const snapshot = makeSnapshot({
    "us/trading/trading-platforms": ["fidelity", "charles-schwab", "etrade"],
  });

  const restored = restoreScopedShortlist(storage, "us", snapshot);

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

// --- ShortlistScopeSnapshot restore rules (spec §11.2.1) --------------------
// Six operator-mandated cases. Each pins one of the four restore rules
// verbatim from the spec: (1)+(4) prove the snapshot must always come from
// the FULL market catalog, never a filtered view; (2)+(6) prove an
// `unavailable` scope is non-destructive (byte-identical storage), distinct
// from (3) genuinely-stale and (5) authoritative-empty, which both DO clear.

it("[mandatory 4] a scope absent from knownScopes is cleared (pointer + scoped key)", () => {
  const storage = memoryStorage({
    "research-shortlist-active:us": "trading:trading-platforms",
    "research-shortlist:us:trading:trading-platforms": '["fidelity"]',
  });

  // trading-platforms is not a known scope at all on this page (e.g. dropped
  // from the manifest) — this is the ONLY case that clears storage among the
  // scenarios in this block.
  const snapshot = makeSnapshot();

  const restored = restoreScopedShortlist(storage, "us", snapshot);

  expect(restored).toEqual({ cockpitKey: null, slugs: [] });
  expect(storage.getItem("research-shortlist-active:us")).toBeNull();
  expect(
    storage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBeNull();
});

it("[mandatory 1] a filtered hub view preserves a foreign scope: the snapshot always comes from the full market catalog, so a scope invisible under the current filter is still known+available and its OWN storage is read normally — while an UNRELATED scope's storage is never touched by that restore", () => {
  const tradingKey: CockpitKey = "us/trading/trading-platforms";
  const roboKey: CockpitKey = "us/personal-finance/robo-advisors";
  const storage = memoryStorage({
    // The active pointer is the trading scope. This simulates a user who is
    // currently viewing the hub with e.g. `?category=personal-finance` set —
    // the trading topic is not part of what's rendered right now, but its
    // stored shortlist is still perfectly valid.
    "research-shortlist-active:us": "trading:trading-platforms",
    "research-shortlist:us:trading:trading-platforms": '["fidelity"]',
    // A second, unrelated scope's storage sitting untouched alongside it.
    "research-shortlist:us:personal-finance:robo-advisors": '["betterment"]',
  });
  const roboScopedKey = "research-shortlist:us:personal-finance:robo-advisors";
  const roboValueBefore = storage.getItem(roboScopedKey);

  // The snapshot is built from the FULL, unfiltered market catalog (per
  // §11.2.1) — both scopes are known+available, regardless of which category
  // filter happens to be active in the UI right now.
  const snapshot = makeSnapshot({
    [tradingKey]: ["fidelity", "charles-schwab"],
    [roboKey]: ["betterment", "wealthfront"],
  });

  const restored = restoreScopedShortlist(storage, "us", snapshot);

  expect(restored).toEqual({ cockpitKey: tradingKey, slugs: ["fidelity"] });
  // The foreign (robo) scope's own storage entry is byte-identical — restore
  // only ever reads/writes the POINTER's own scope.
  expect(storage.getItem(roboScopedKey)).toBe(roboValueBefore);
});

it("[mandatory 2] a failed topic (unavailable/'load_failed') leaves storage byte-identical", () => {
  const tradingKey: CockpitKey = "us/trading/trading-platforms";
  const storage = memoryStorage({
    "research-shortlist-active:us": "trading:trading-platforms",
    "research-shortlist:us:trading:trading-platforms":
      '["fidelity","charles-schwab"]',
  });
  const before = storage.snapshot();

  const snapshot = makeSnapshot({}, { [tradingKey]: "load_failed" });

  const restored = restoreScopedShortlist(storage, "us", snapshot);

  expect(restored).toEqual({ cockpitKey: null, slugs: [] });
  expect(storage.snapshot()).toEqual(before);
});

it("[mandatory 3] after a later successful retry (same key now in availableScopes with its slugs) the shortlist restores to exactly those slugs", () => {
  const tradingKey: CockpitKey = "us/trading/trading-platforms";
  const storage = memoryStorage({
    "research-shortlist-active:us": "trading:trading-platforms",
    "research-shortlist:us:trading:trading-platforms":
      '["fidelity","charles-schwab"]',
  });

  // The topic that was previously in backoff/failed has now loaded
  // successfully and moved into availableScopes with its real slug set.
  const snapshot = makeSnapshot({
    [tradingKey]: ["fidelity", "charles-schwab", "etrade"],
  });

  const restored = restoreScopedShortlist(storage, "us", snapshot);

  expect(restored).toEqual({
    cockpitKey: tradingKey,
    slugs: ["fidelity", "charles-schwab"],
  });
});

it("[mandatory 5] an available scope with an EMPTY slug set clears the stored shortlist", () => {
  const tradingKey: CockpitKey = "us/trading/trading-platforms";
  const storage = memoryStorage({
    "research-shortlist-active:us": "trading:trading-platforms",
    "research-shortlist:us:trading:trading-platforms": '["fidelity"]',
  });

  // The topic loaded successfully but is authoritatively empty (e.g. every
  // product was delisted) — this is NOT a failure, so it must still clear.
  const snapshot = makeSnapshot({ [tradingKey]: [] });

  const restored = restoreScopedShortlist(storage, "us", snapshot);

  expect(restored).toEqual({ cockpitKey: null, slugs: [] });
  expect(storage.getItem("research-shortlist-active:us")).toBeNull();
  expect(
    storage.getItem("research-shortlist:us:trading:trading-platforms"),
  ).toBeNull();
});

it("[mandatory 6] a known manifest topic with unresolvable config ('missing_topic_config') preserves storage (non-destructive)", () => {
  const tradingKey: CockpitKey = "us/trading/trading-platforms";
  const storage = memoryStorage({
    "research-shortlist-active:us": "trading:trading-platforms",
    "research-shortlist:us:trading:trading-platforms":
      '["fidelity","charles-schwab"]',
  });
  const before = storage.snapshot();

  const snapshot = makeSnapshot({}, { [tradingKey]: "missing_topic_config" });

  const restored = restoreScopedShortlist(storage, "us", snapshot);

  expect(restored).toEqual({ cockpitKey: null, slugs: [] });
  expect(storage.snapshot()).toEqual(before);
});

// --- describeScopeSwitch (spec §11.3.1) -------------------------------------

describe("describeScopeSwitch", () => {
  const tradingKey: CockpitKey = "us/trading/trading-platforms";
  const roboKey: CockpitKey = "us/personal-finance/robo-advisors";

  it("reports no-switch when there is no active scope", () => {
    const snapshot = makeSnapshot({ [roboKey]: ["betterment"] });
    expect(describeScopeSwitch(snapshot, null, roboKey)).toEqual({
      kind: "no-switch",
    });
  });

  it("reports no-switch when the active and target scopes are the same", () => {
    const snapshot = makeSnapshot({ [tradingKey]: ["fidelity"] });
    expect(describeScopeSwitch(snapshot, tradingKey, tradingKey)).toEqual({
      kind: "no-switch",
    });
  });

  it("reports active-available for a verified active scope, so the dialog can use the normal Switch & add wording", () => {
    const snapshot = makeSnapshot({
      [tradingKey]: ["fidelity"],
      [roboKey]: ["betterment"],
    });
    expect(describeScopeSwitch(snapshot, tradingKey, roboKey)).toEqual({
      kind: "active-available",
      activeCockpitKey: tradingKey,
    });
  });

  it("reports active-unavailable with the structured reason for a backoff active scope, so the dialog can render the honest replacement wording instead of a 'clear' claim", () => {
    const snapshot = makeSnapshot(
      { [roboKey]: ["betterment"] },
      { [tradingKey]: "backoff" },
    );
    expect(describeScopeSwitch(snapshot, tradingKey, roboKey)).toEqual({
      kind: "active-unavailable",
      activeCockpitKey: tradingKey,
      reason: "backoff",
    });
  });

  it("reports active-unavailable for an active scope that is not in the snapshot at all (defensive: neither available nor unavailable)", () => {
    const snapshot = makeSnapshot({ [roboKey]: ["betterment"] });
    expect(describeScopeSwitch(snapshot, tradingKey, roboKey)).toEqual({
      kind: "active-unavailable",
      activeCockpitKey: tradingKey,
      reason: "load_failed",
    });
  });
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
