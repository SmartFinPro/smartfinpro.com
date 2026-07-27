# Unified Research Discovery PR 1 Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the canonical market-wide Discovery catalog, pure filtering/projection/facet logic, and collision-safe shortlist core without changing any rendered UI.

**Architecture:** `lib/research/catalog.ts` is the only server boundary and joins cached MDX metadata with independently loaded Cockpit topics. `lib/research/catalog-shell-logic.ts` is framework-free and owns canonical types, IDs, routing, projections, filters, facets, sorting, counts, and storage contracts. The existing single-topic `shell-logic.ts` remains intact until PR 2 migrates its consumer.

**Tech Stack:** TypeScript · Next.js `unstable_cache` · existing MDX loader · existing Cockpit loader/adapter · Vitest

## Global Constraints

- Normative source: `docs/superpowers/specs/2026-07-27-research-discovery-catalog-design.md`.
- Review IDs are `review:${review.href}`.
- Cockpit-only IDs are `product:${market}:${category}:${productSlug}`; topic is never part of the item ID.
- Qualified contexts are exactly audited and provisional.
- Audited-only fields are score, rank, and confidence; they are null for provisional contexts.
- Filter order is item query/category first, then context filters, then type projection.
- One item appears at most once in a result set.
- Shortlists contain at most four validated slugs from one Cockpit key.
- No UI file changes belong in this PR.

---

### Task 1: Canonical types, identity helpers, and market routes

**Files:**

- Create: `lib/research/catalog-shell-logic.ts`
- Create: `__tests__/unit/research-catalog-shell-logic.test.ts`

**Interfaces:**

- Consumes: `Market`, `Category`, and `categoryConfig` from `lib/i18n/config.ts`.
- Produces: `ResearchContext`, `DiscoveryReview`, `DiscoveryDisplay`, `DiscoveryItem`, `DiscoveryProjection`, `DiscoveryFilters`, `DiscoveryCounts`, `researchBaseForMarket()`, `cockpitKeyFor()`, `reviewItemId()`, `productItemId()`, and `projectionNodeKey()`.

- [ ] **Step 1: Write the failing identity and routing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  cockpitKeyFor,
  productItemId,
  researchBaseForMarket,
  reviewItemId,
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
```

- [ ] **Step 2: Run the tests and confirm the module is missing**

Run:

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
```

Expected: FAIL because `@/lib/research/catalog-shell-logic` does not exist.

- [ ] **Step 3: Add the canonical contracts and identity helpers**

Create `lib/research/catalog-shell-logic.ts` with these exported contracts:

```ts
import type { Category, Market } from "@/lib/i18n/config";

export type ResearchStatus = "audited" | "provisional";
export type ResearchConfidence = "high" | "medium" | "low";
export type DiscoveryKind = "review" | "dossier";
export type CockpitKey = `${Market}/${Category}/${string}`;

export interface ResearchContext {
  cockpitKey: CockpitKey;
  topic: string;
  topicLabel: string;
  manifestOrder: number;
  productSlug: string;
  displayName: string;
  tagline: string | null;
  bestFor: string | null;
  status: ResearchStatus;
  confidence: ResearchConfidence | null;
  dataVerifiedAt: string | null;
  auditedScore: number | null;
  auditedRank: number | null;
  dataPoints: number;
  compareBaseHref: string;
  keyFacts: Record<string, string>;
}

export interface DiscoveryReview {
  slug: string;
  href: string;
  title: string;
  description: string;
  editorialRating: number;
  publishDate: string;
  modifiedDate: string;
  readingWords: number;
  featured: boolean;
  pricing: string | null;
}

export interface DiscoveryDisplay {
  title: string;
  description: string;
  bestFor: string | null;
  searchText: string;
  sortDate: string | null;
}

export interface DiscoveryItem {
  id: string;
  market: Market;
  category: Category;
  review: DiscoveryReview | null;
  display: DiscoveryDisplay;
  researchContexts: ResearchContext[];
}

export type DiscoveryProjection =
  | { itemId: string; kind: "review"; item: DiscoveryItem; context: null }
  | {
      itemId: string;
      kind: "dossier";
      item: DiscoveryItem;
      context: ResearchContext;
    };

export interface DiscoveryFilters {
  query: string;
  category: Category | null;
  type: DiscoveryKind | null;
  status: ResearchStatus | null;
  confidence: ResearchConfidence | null;
  fresh: string | null;
  topic: string | null;
  specs: string[];
}

export interface DiscoveryCounts {
  reviewBackedCount: number;
  dossierCount: number;
  discoveryItemCount: number;
  auditedItemCount: number;
  verifiedDataPointCount: number;
}

export const researchBaseForMarket = (market: Market): string =>
  market === "us" ? "/research" : `/${market}/research`;

export const cockpitKeyFor = (
  market: Market,
  category: Category,
  topic: string,
): CockpitKey => `${market}/${category}/${topic}`;

export const reviewItemId = (href: string): string => `review:${href}`;

export const productItemId = (
  market: Market,
  category: Category,
  productSlug: string,
): string => `product:${market}:${category}:${productSlug}`;

export const projectionNodeKey = (
  itemId: string,
  cockpitKey: CockpitKey | null,
): string => `${itemId}\u001f${cockpitKey ?? "review"}`;
```

- [ ] **Step 4: Run the narrow tests**

Run:

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the contracts**

```bash
git add lib/research/catalog-shell-logic.ts __tests__/unit/research-catalog-shell-logic.test.ts
git commit -m "feat(research): add discovery catalog contracts"
```

### Task 2: Projection, filtering, disjunctive facets, sorting, and counts

**Files:**

- Modify: `lib/research/catalog-shell-logic.ts`
- Modify: `__tests__/unit/research-catalog-shell-logic.test.ts`

**Interfaces:**

- Consumes: the Task 1 canonical types.
- Produces: `EMPTY_DISCOVERY_FILTERS`, `matchesItemQuery()`, `matchingContexts()`, `projectDiscoveryItems()`, `computeDiscoveryFacets()`, `sortHubProjections()`, `sortFinderItems()`, and `countDiscoveryItems()`.

- [ ] **Step 1: Add fixtures and failing projection tests**

Append a fixture builder that creates:

```ts
const makeReview = (over: Partial<DiscoveryReview> = {}): DiscoveryReview => ({
  slug: "fidelity-review",
  href: "/us/trading/fidelity-review",
  title: "Fidelity Review",
  description: "Independent Fidelity review",
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
  specs: [],
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
```

Add assertions:

```ts
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
```

- [ ] **Step 2: Run and confirm missing exports**

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
```

Expected: FAIL because the projection functions are not exported.

- [ ] **Step 3: Implement the pure pipeline**

Use this exact public shape:

```ts
export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  query: "",
  category: null,
  type: null,
  status: null,
  confidence: null,
  fresh: null,
  topic: null,
  specs: [],
};

export interface DiscoveryFacets {
  categories: Array<{ value: Category; count: number }>;
  types: Array<{ value: DiscoveryKind; count: number }>;
  statuses: Array<{ value: ResearchStatus; count: number }>;
  confidences: Array<{ value: ResearchConfidence; count: number }>;
  freshnessDates: Array<{ value: string; count: number }>;
  topics: Array<{ value: string; label: string; count: number }>;
}

export function matchesItemQuery(item: DiscoveryItem, query: string): boolean;

export function matchingContexts(
  item: DiscoveryItem,
  filters: DiscoveryFilters,
): ResearchContext[];

export function projectDiscoveryItems(
  items: readonly DiscoveryItem[],
  filters: DiscoveryFilters,
): DiscoveryProjection[];

export function computeDiscoveryFacets(
  items: readonly DiscoveryItem[],
  filters: DiscoveryFilters,
): DiscoveryFacets;

export function sortHubProjections(
  projections: readonly DiscoveryProjection[],
): DiscoveryProjection[];

export function sortFinderItems(
  items: readonly DiscoveryItem[],
  filters: Pick<DiscoveryFilters, "query" | "category">,
): DiscoveryItem[];

export function countDiscoveryItems(
  items: readonly DiscoveryItem[],
): DiscoveryCounts;
```

Implementation rules:

```ts
const normalize = (value: string): string =>
  value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");

const contextMatches = (
  context: ResearchContext,
  filters: DiscoveryFilters,
): boolean =>
  (!filters.status || context.status === filters.status) &&
  (!filters.confidence ||
    (context.status === "audited" &&
      context.confidence === filters.confidence)) &&
  (!filters.fresh ||
    (context.status === "audited" &&
      context.dataVerifiedAt !== null &&
      context.dataVerifiedAt >= filters.fresh)) &&
  (!filters.topic || context.topic === filters.topic);
```

For `specs`, use a private parser that splits only the first two colons into
topic, key, and remaining value. Group tokens by topic/key. A context matches
when its topic matches and its single formatted `keyFacts[key]` value appears
in the selected value set for every active key: OR within one spec key, AND
across different spec keys. PR 4 promotes this parser into the public
registry-validating facet module; PR 1 must not compare a raw token to a
`keyFacts` key.

Disjunctive facet counts must call the same projection pipeline with only the facet's own dimension cleared. Hide nothing in the pure result; the UI decides whether a dimension with fewer than two values is visible.

- [ ] **Step 4: Add sorting, count, and disjunctive-facet assertions**

```ts
it("counts union items without double-counting multi-topic dossiers", () => {
  expect(countDiscoveryItems([item])).toEqual({
    reviewBackedCount: 1,
    dossierCount: 1,
    discoveryItemCount: 1,
    auditedItemCount: 1,
    verifiedDataPointCount: expect.any(Number),
  });
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

it("hub sort uses manifest order, audited rank, then stable item id", () => {
  expect(
    sortHubProjections([rankTwo, provisional, rankOne]).map((p) => p.itemId),
  ).toEqual([rankOne.itemId, rankTwo.itemId, provisional.itemId]);
});
```

- [ ] **Step 5: Run the complete catalog-shell test**

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
```

Expected: PASS with assertions covering spec invariants 3, 5, 6, 7, and 8.

- [ ] **Step 6: Commit the pure pipeline**

```bash
git add lib/research/catalog-shell-logic.ts __tests__/unit/research-catalog-shell-logic.test.ts
git commit -m "feat(research): add discovery projection and facets"
```

### Task 3: Scoped shortlist storage and validated Cockpit handoff

**Files:**

- Modify: `lib/research/catalog-shell-logic.ts`
- Modify: `__tests__/unit/research-catalog-shell-logic.test.ts`

**Interfaces:**

- Consumes: `CockpitKey`, `MAX_SHORTLIST`, and the existing compare query contract.
- Produces: `StorageLike`, `ScopedShortlist`, `shortlistStorageKey()`, `shortlistPointerKey()`, `restoreScopedShortlist()`, `persistScopedShortlist()`, `migrateLegacyTradingShortlist()`, `toggleScopedShortlist()`, and `buildScopedCompareUrl()`.

- [ ] **Step 1: Add failing storage-collision and migration tests**

```ts
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

it("rejects slugs outside the active Cockpit key", () => {
  expect(
    buildScopedCompareUrl(
      "/us/trading/best/trading-platforms",
      ["fidelity", "foreign"],
      new Set(["fidelity"]),
    ),
  ).toBeNull();
});
```

- [ ] **Step 2: Run and confirm the missing shortlist exports**

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
```

Expected: FAIL on missing storage helpers.

- [ ] **Step 3: Implement the storage contract**

```ts
export const MAX_SHORTLIST = 4;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ScopedShortlist {
  cockpitKey: CockpitKey | null;
  slugs: string[];
}

export const shortlistStorageKey = (key: CockpitKey): string => {
  const [market, category, topic] = key.split("/");
  return `research-shortlist:${market}:${category}:${topic}`;
};

export const shortlistPointerKey = (market: Market): string =>
  `research-shortlist-active:${market}`;
```

`restoreScopedShortlist()` must:

1. Read the market pointer.
2. Reconstruct a Cockpit key from `${category}:${topic}`.
3. Reject a key not present in the supplied `Map<CockpitKey, ReadonlySet<string>>`.
4. Parse the scoped array, retain only known unique strings, and cap at four.
5. Remove invalid pointer/scoped state and return `{ cockpitKey: null, slugs: [] }`.

`persistScopedShortlist()` must store `${category}:${topic}` in the pointer and the JSON slug array in the scoped key. An empty shortlist removes both.

`buildScopedCompareUrl()` must return null for fewer than two slugs, more than four slugs, duplicates, or any slug absent from the valid set. Valid output remains:

```text
/{market}/{category}/best/{topic}?compare=a,b&view=compare#comparison
```

Use these exact signatures:

```ts
export function restoreScopedShortlist(
  storage: StorageLike,
  market: Market,
  validScopes: ReadonlyMap<CockpitKey, ReadonlySet<string>>,
): ScopedShortlist;

export function persistScopedShortlist(
  storage: StorageLike,
  market: Market,
  shortlist: ScopedShortlist,
): void;

export function migrateLegacyTradingShortlist(storage: StorageLike): void;

export function toggleScopedShortlist(
  current: ScopedShortlist,
  cockpitKey: CockpitKey,
  slug: string,
  validSlugs: ReadonlySet<string>,
): { next: ScopedShortlist; requiresScopeSwitch: boolean };

export function buildScopedCompareUrl(
  cockpitBase: string,
  slugs: readonly string[],
  validSlugs: ReadonlySet<string>,
): string | null;
```

- [ ] **Step 4: Run the shortlist tests and existing pilot regressions**

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts __tests__/unit/research-shell-logic.test.ts
```

Expected: PASS; the old pilot helpers remain byte-compatible.

- [ ] **Step 5: Commit the shortlist core**

```bash
git add lib/research/catalog-shell-logic.ts __tests__/unit/research-catalog-shell-logic.test.ts
git commit -m "feat(research): scope discovery shortlists by cockpit"
```

### Task 4: Server catalog builder and independent caches

**Files:**

- Create: `lib/research/catalog.ts`
- Create: `__tests__/unit/research-catalog.test.ts`
- Modify: `lib/research/catalog-shell-logic.ts`

**Interfaces:**

- Consumes: `getContentByMarketAndCategory()`, `marketCategories`, `BEST_X_MANIFEST`, `getCockpitData()`, `getTopicConfig()`, and `buildResearchView()`.
- Produces: `DiscoveryCatalog`, server-only `DiscoveryCatalogBundle`, `buildDiscoveryCatalog()`, cached `getDiscoveryCatalog()`, and cached `getDiscoveryCatalogBundle()`.

- [ ] **Step 1: Write failing builder tests with mocked MDX and topic loaders**

Cover these cases explicitly:

| Test                        | Fixture                                            | Required assertion                         |
| --------------------------- | -------------------------------------------------- | ------------------------------------------ |
| rated MDX                   | one rated review and one `index` entry             | exactly one review-backed item             |
| category + review slug join | same slug in two categories                        | context joins only the matching category   |
| unmatched review            | rated review without overlay row                   | review remains with zero contexts          |
| multi-topic Cockpit-only    | same market/category/product in two topics         | one item with two contexts                 |
| unavailable row             | unmatched unavailable product                      | no item is created                         |
| rejected topic              | one rejected topic promise and one fulfilled topic | every review and fulfilled context remains |
| duplicate context           | repeated row with one Cockpit key                  | item contains that Cockpit key once        |
| size ceiling                | assembled catalog for each market                  | UTF-8 JSON byte length is below 200,000    |

Use a collision fixture in which:

```ts
const creditRepair = {
  market: "us",
  category: "credit-repair",
  topic: "companies",
};
const debtRelief = {
  market: "us",
  category: "debt-relief",
  topic: "companies",
};
```

Both may use `productSlug: 'freedom'`; their item IDs must still differ because category is part of the ID.

- [ ] **Step 2: Run and confirm the server module is missing**

```bash
npx vitest run __tests__/unit/research-catalog.test.ts
```

Expected: FAIL because `lib/research/catalog.ts` does not exist.

- [ ] **Step 3: Implement normalized MDX loading**

Define:

```ts
export interface DiscoveryCatalog {
  market: Market;
  items: DiscoveryItem[];
  counts: DiscoveryCounts;
}

export interface DiscoveryDossierRenderRow {
  key: string;
  itemId: string;
  cockpitKey: CockpitKey;
  researchProduct: ResearchProduct;
}

export interface DiscoveryCatalogBundle {
  catalog: DiscoveryCatalog;
  dossierRows: DiscoveryDossierRenderRow[];
}

interface NormalizedOverlayRow {
  entry: BestXManifestEntry;
  context: ResearchContext;
  researchProduct: ResearchProduct;
  reviewSlug: string | null;
}

export function buildDiscoveryCatalog(
  market: Market,
  reviews: readonly DiscoveryItem[],
  overlay: readonly NormalizedOverlayRow[],
): DiscoveryCatalogBundle;
```

`DiscoveryCatalog` is the serializable public catalog subject to the 200 KB
limit. `DiscoveryCatalogBundle.dossierRows` is a server-only render sidecar:
it preserves the complete `ResearchProduct` required by the existing
`ResearchCard` evidence/provenance UI and is never sent to a client component.

The uncached MDX loader must:

```ts
const categoryResults = await Promise.all(
  marketCategories[market].map((category) =>
    getContentByMarketAndCategory(market, category),
  ),
);
```

Filter with `slug !== 'index' && typeof meta.rating === 'number'`. Map without the MDX body:

```ts
const href = `/${market}/${meta.category}/${slug}`;
const review: DiscoveryReview = {
  slug,
  href,
  title: meta.seoTitle || meta.title,
  description: meta.description,
  editorialRating: meta.rating,
  publishDate: meta.publishDate,
  modifiedDate: meta.modifiedDate,
  readingWords: readingTime.words,
  featured: meta.featured === true,
  pricing: meta.pricing ?? null,
};
```

Set review-backed `sortDate` to `modifiedDate || publishDate`.

- [ ] **Step 4: Implement the `Promise.allSettled` overlay**

Filter `BEST_X_MANIFEST` by market and retain its array index as `manifestOrder`. Each topic task must:

```ts
const config = getTopicConfig(entry.category, entry.topic, entry.market);
if (!config) return { entry, rows: [] };
const products = await getCockpitData(
  entry.market,
  entry.category,
  entry.topic,
);
const rows = buildResearchView(
  products,
  config.specColumns.map((column) => column.key),
);
return { entry, config, rows };
```

Map only audited/provisional rows. Build `keyFacts` once:

```ts
const keyFacts = Object.fromEntries(
  config.specColumns.map((column) => {
    const raw = column.accessor(row.product);
    return [column.key, column.format(raw)];
  }),
);
```

Use `category + reviewSlug` as the review join key. Merge unmatched rows by `productItemId(market, category, product.slug)`. Log one warning per rejected topic with:

```ts
logger.warn("Research discovery topic unavailable", {
  market,
  category: entry.category,
  topic: entry.topic,
  errorType:
    result.reason instanceof Error ? result.reason.name : typeof result.reason,
});
```

Never log raw row contents or user data.

Normalize each context with:

```ts
const audited = row.research.status === "audited";
const context: ResearchContext = {
  cockpitKey: cockpitKeyFor(market, entry.category, entry.topic),
  topic: entry.topic,
  topicLabel: entry.label,
  manifestOrder,
  productSlug: row.product.slug,
  displayName: row.product.displayName,
  tagline: row.product.tagline || null,
  bestFor: row.product.bestFor || null,
  status: audited ? "audited" : "provisional",
  confidence: audited ? row.research.confidence : null,
  dataVerifiedAt: row.research.dataVerifiedAt,
  auditedScore: audited ? row.displayScore : null,
  auditedRank: audited ? row.rank : null,
  dataPoints: Object.keys(row.research.fieldSources).length,
  compareBaseHref: `/${market}/${entry.category}/best/${entry.topic}`,
  keyFacts,
};
```

Sort contexts by manifest order, then audited rank, then product slug. For a
review-backed item, use MDX title/description/rating and
`sortDate = modifiedDate || publishDate`. For a Cockpit-only item, use
display name, then tagline/best-for/topic-label description fallback, and the
newest real context `dataVerifiedAt` as `sortDate`. Build normalized
`display.searchText` from every source listed in spec §4.4, replacing slug
hyphens with spaces. Never synthesize a date, rating, or claim.

- [ ] **Step 5: Add independent caches**

Keep cache wrappers separate so MDX and overlay use their required lifetimes:

```ts
const getCachedReviewItems = unstable_cache(
  loadMarketReviewItems,
  ["research-discovery-reviews"],
  { revalidate: 300, tags: ["market-reviews", "research-catalog"] },
);

const getCachedResearchContexts = unstable_cache(
  loadMarketResearchContexts,
  ["research-discovery-contexts"],
  { revalidate: 3600, tags: ["research-catalog"] },
);

export async function getDiscoveryCatalog(
  market: Market,
): Promise<DiscoveryCatalog> {
  return (await getDiscoveryCatalogBundle(market)).catalog;
}

export async function getDiscoveryCatalogBundle(
  market: Market,
): Promise<DiscoveryCatalogBundle> {
  const [reviews, overlay] = await Promise.all([
    getCachedReviewItems(market),
    getCachedResearchContexts(market),
  ]);
  return buildDiscoveryCatalog(market, reviews, overlay);
}
```

The market argument must be passed into both cached functions. Each normalized
overlay row retains its complete `ResearchProduct` until the merge assigns
`itemId` and `projectionNodeKey(itemId, cockpitKey)`. Only
`bundle.catalog.items` is passed over the RSC/client boundary.

- [ ] **Step 6: Run builder and adapter regressions**

```bash
npx vitest run __tests__/unit/research-catalog.test.ts __tests__/unit/research-adapter.test.ts __tests__/unit/research-validation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the server catalog**

```bash
git add lib/research/catalog.ts lib/research/catalog-shell-logic.ts __tests__/unit/research-catalog.test.ts
git commit -m "feat(research): build unified discovery catalog"
```

### Task 5: Contract coverage and PR 1 verification report

**Files:**

- Modify: `__tests__/unit/research-catalog.test.ts`
- Modify: `__tests__/unit/research-catalog-shell-logic.test.ts`
- Create: `audits/reports/research-discovery-pr1.md`

**Interfaces:**

- Consumes: all PR 1 public exports.
- Produces: automated coverage for spec invariants 1–11 and the PR baseline report.

- [ ] **Step 1: Add the invariant matrix test**

Create a `describe('Discovery catalog invariants 1–11')` block. Each numbered
test reuses the concrete fixtures from Tasks 1–4 and asserts the corresponding
row in this matrix:

| Invariant | Action                                                     | Exact outcome                                     |
| --------- | ---------------------------------------------------------- | ------------------------------------------------- |
| 1         | build catalog from two qualified rows joined to one review | one item for the review href                      |
| 2         | build same product slug in credit-repair and debt-relief   | two category-scoped product IDs                   |
| 3         | build one product in two topics                            | one item and two contexts                         |
| 4         | supply the same topic row twice                            | one unique Cockpit key                            |
| 5         | inspect audited and provisional contexts                   | audited fields populated; provisional fields null |
| 6         | project with `type='review'`                               | every projection has `kind='review'`              |
| 7         | filter context-free review by audited status               | zero projections                                  |
| 8         | project a multi-topic item                                 | one result                                        |
| 9         | build compare URL with a foreign slug                      | null                                              |
| 10        | derive keys for the two `companies` topics                 | unequal storage keys                              |
| 11        | reject every overlay topic                                 | original review IDs remain byte-identical         |

- [ ] **Step 2: Run the focused PR 1 suite**

```bash
npx vitest run \
  __tests__/unit/research-catalog.test.ts \
  __tests__/unit/research-catalog-shell-logic.test.ts \
  __tests__/unit/research-adapter.test.ts \
  __tests__/unit/research-shell-logic.test.ts \
  __tests__/unit/research-events.test.ts
```

Expected: all files and tests pass.

- [ ] **Step 3: Run the complete PR gate**

```bash
npx tsc --noEmit
npx vitest run
npm run check:imports
npm run build
```

Expected: every command exits 0. This PR intentionally leaves the existing `/research` UI unchanged.

- [ ] **Step 4: Record exact before/after evidence**

Write `audits/reports/research-discovery-pr1.md` after collecting the base hash
with `git merge-base HEAD origin/main`, the head hash with `git rev-parse HEAD`,
catalog byte/count output from the catalog test, and Vitest totals from the
focused and full runs. The report has the heading
`# Research Discovery PR 1 Verification` and records those literal values plus
TypeScript, import-boundary, build, and “UI files changed: 0” results. Do not
commit the report until every field is backed by command output.

- [ ] **Step 5: Commit the verification evidence**

```bash
git add __tests__/unit/research-catalog.test.ts __tests__/unit/research-catalog-shell-logic.test.ts audits/reports/research-discovery-pr1.md
git commit -m "test(research): verify discovery catalog invariants"
```
