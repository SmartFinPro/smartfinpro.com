# Unified Research Discovery PR 4 Topic and Spec Facets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add category-aware topic and repeated spec facets whose URL state, matching rules, analytics, and displayed key facts all derive from the same server-computed values.

**Architecture:** A server-only registry builder reads topic configs and catalog contexts to produce a compact serialized facet registry. A pure client-safe module parses tokens, resolves implicit topics, filters specs, and applies reset rules. `ResearchHub` consumes that registry without importing the full Cockpit registry into the client bundle.

**Tech Stack:** TypeScript · existing TopicConfig registry · URLSearchParams · React client shell · Vitest · Playwright

## Global Constraints

- PR 3 must be merged.
- Topic/spec controls appear only after a category is selected and qualified contexts exist.
- One available topic is implicitly active; multiple topics require an explicit selection.
- Specs appear only after topic resolution.
- `spec` is repeatable and serialized as `${topic}:${key}:${value}`.
- The parser splits only the first two colons; the remainder belongs to value.
- Topic and key must exist in the serialized registry.
- Category change clears topic and all specs.
- Topic change clears incompatible specs.
- A spec is displayed only when it has more than one and at most four distinct values.
- URL filtering uses full values; analytics values are deterministically limited to 60 characters.
- Key facts and spec facets must use the same server formatting result.
- Multiple values of one spec key are OR-combined; different spec keys are AND-combined.
- Do not import the full Cockpit topic registry from a client component.

---

### Task 1: Pure topic/spec parser and state transitions

**Files:**

- Create: `lib/research/topic-facets.ts`
- Create: `__tests__/unit/research-topic-facets.test.ts`

**Interfaces:**

- Consumes: `Category`, `DiscoveryFilters`, and serialized topic/spec definitions.
- Produces: `ParsedSpecFilter`, `TopicFacetDefinition`, `TopicFacetRegistry`, `parseSpecFilter()`, `resolveTopic()`, `validateSpecFilters()`, `changeFacetCategory()`, `changeFacetTopic()`, `computeTopicFacetOptions()`, and `computeSpecFacetOptions()`.

- [ ] **Step 1: Write failing parser and reset tests**

```ts
import { describe, expect, it } from "vitest";
import {
  changeFacetCategory,
  changeFacetTopic,
  parseSpecFilter,
  resolveTopic,
  validateSpecFilters,
} from "@/lib/research/topic-facets";

const oneTopicRegistry: TopicFacetRegistry = {
  trading: [
    {
      topic: "trading-platforms",
      label: "Best Trading Platforms",
      manifestOrder: 0,
      specs: [
        {
          key: "optionsFee",
          label: "Options fee",
          values: ["$0", "$0.65"],
        },
      ],
    },
  ],
};

const fourTopicRegistry: TopicFacetRegistry = {
  "personal-finance": [
    "robo-advisors",
    "high-yield-savings",
    "credit-monitoring",
    "credit-card-companies",
  ].map((topic, manifestOrder) => ({
    topic,
    label: topic,
    manifestOrder,
    specs: [],
  })),
};

const activeFilters: DiscoveryFilters = {
  query: "",
  category: "trading",
  type: null,
  status: null,
  confidence: null,
  fresh: null,
  topic: "trading-platforms",
  specs: ["trading-platforms:optionsFee:$0"],
};

const makeFacetDiscoveryItem = (
  id: string,
  keyFacts: Record<string, string>,
): DiscoveryItem => ({
  id: `product:us:trading:${id}`,
  market: "us",
  category: "trading",
  review: null,
  display: {
    title: id,
    description: "Trading platform",
    bestFor: null,
    searchText: id,
    sortDate: "2026-07-03",
  },
  researchContexts: [
    {
      cockpitKey: "us/trading/trading-platforms",
      topic: "trading-platforms",
      topicLabel: "Best Trading Platforms",
      manifestOrder: 0,
      productSlug: id,
      displayName: id,
      tagline: null,
      bestFor: null,
      status: "audited",
      confidence: "high",
      dataVerifiedAt: "2026-07-03",
      auditedScore: 9,
      auditedRank: 1,
      dataPoints: 4,
      compareBaseHref: "/us/trading/best/trading-platforms",
      keyFacts,
    },
  ],
});

it("splits only the first two colons", () => {
  expect(parseSpecFilter("robo-advisors:pricing:$0: promotional")).toEqual({
    raw: "robo-advisors:pricing:$0: promotional",
    topic: "robo-advisors",
    key: "pricing",
    value: "$0: promotional",
  });
});

it("rejects a missing topic, key, or value", () => {
  expect(parseSpecFilter("robo-advisors:pricing")).toBeNull();
  expect(parseSpecFilter(":pricing:$0")).toBeNull();
  expect(parseSpecFilter("robo-advisors::$0")).toBeNull();
});

it("implicitly resolves exactly one topic", () => {
  expect(resolveTopic("trading", null, oneTopicRegistry)).toBe(
    "trading-platforms",
  );
});

it("requires a choice when multiple topics exist", () => {
  expect(resolveTopic("personal-finance", null, fourTopicRegistry)).toBeNull();
});

it("category changes clear topic and specs", () => {
  expect(changeFacetCategory(activeFilters, "personal-finance")).toEqual({
    ...activeFilters,
    category: "personal-finance",
    topic: null,
    specs: [],
  });
});

it("topic changes remove incompatible specs", () => {
  expect(changeFacetTopic(activeFilters, "robo-advisors").specs).toEqual([]);
});
```

- [ ] **Step 2: Run and confirm the module is missing**

```bash
npx vitest run __tests__/unit/research-topic-facets.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement exact serialized contracts**

```ts
import type { Category } from "@/lib/i18n/config";
import type { DiscoveryFilters } from "@/lib/research/catalog-shell-logic";

export interface ParsedSpecFilter {
  raw: string;
  topic: string;
  key: string;
  value: string;
}

export interface SpecFacetDefinition {
  key: string;
  label: string;
  values: string[];
}

export interface TopicFacetDefinition {
  topic: string;
  label: string;
  manifestOrder: number;
  specs: SpecFacetDefinition[];
}

export type TopicFacetRegistry = Partial<
  Record<Category, TopicFacetDefinition[]>
>;

export function resolveTopic(
  category: Category | null,
  requestedTopic: string | null,
  registry: TopicFacetRegistry,
): string | null;

export function validateSpecFilters(
  rawValues: readonly string[],
  category: Category | null,
  topic: string | null,
  registry: TopicFacetRegistry,
): string[];

export function changeFacetCategory(
  filters: DiscoveryFilters,
  category: Category | null,
): DiscoveryFilters;

export function changeFacetTopic(
  filters: DiscoveryFilters,
  topic: string | null,
): DiscoveryFilters;

export interface CountedFacetOption {
  value: string;
  label: string;
  count: number;
}

export function computeTopicFacetOptions(
  items: readonly DiscoveryItem[],
  filters: DiscoveryFilters,
  registry: TopicFacetRegistry,
): CountedFacetOption[];

export function computeSpecFacetOptions(
  items: readonly DiscoveryItem[],
  filters: DiscoveryFilters,
  topic: TopicFacetDefinition,
  spec: SpecFacetDefinition,
): CountedFacetOption[];
```

Parser:

```ts
export function parseSpecFilter(raw: string): ParsedSpecFilter | null {
  const first = raw.indexOf(":");
  const second = first < 0 ? -1 : raw.indexOf(":", first + 1);
  if (first <= 0 || second <= first + 1 || second === raw.length - 1)
    return null;
  return {
    raw,
    topic: raw.slice(0, first),
    key: raw.slice(first + 1, second),
    value: raw.slice(second + 1),
  };
}
```

`validateSpecFilters()` must preserve input order, deduplicate exact raw tokens, require the resolved topic, require the key in that topic's definition, and require the full value in the definition's `values`.

- [ ] **Step 4: Add distinct-value visibility tests**

```ts
const twoToFourValueTopic: TopicFacetDefinition = {
  topic: "trading-platforms",
  label: "Best Trading Platforms",
  manifestOrder: 0,
  specs: [
    { key: "fee", label: "Fee", values: ["$0", "$0.65"] },
    {
      key: "minimum",
      label: "Minimum",
      values: ["$0", "$1", "$500", "$1,000"],
    },
  ],
};
const edgeValueTopic: TopicFacetDefinition = {
  ...twoToFourValueTopic,
  specs: [
    { key: "one", label: "One", values: ["Yes"] },
    { key: "five", label: "Five", values: ["1", "2", "3", "4", "5"] },
  ],
};

it("retains specs with two to four distinct values", () => {
  expect(
    visibleSpecDefinitions(twoToFourValueTopic).map((spec) => spec.key),
  ).toEqual(["fee", "minimum"]);
});

it("hides one-value and five-value specs", () => {
  expect(visibleSpecDefinitions(edgeValueTopic)).toEqual([]);
});
```

Implement:

```ts
export const visibleSpecDefinitions = (
  topic: TopicFacetDefinition,
): SpecFacetDefinition[] =>
  topic.specs.filter(
    (spec) => spec.values.length > 1 && spec.values.length <= 4,
  );
```

Add disjunctive count coverage:

```ts
it("ignores the active spec key while counting its alternatives", () => {
  const items = [
    makeFacetDiscoveryItem("free", {
      optionsFee: "$0",
      minDeposit: "$0",
    }),
    makeFacetDiscoveryItem("paid", {
      optionsFee: "$0.65",
      minDeposit: "$500",
    }),
  ];
  const topic = oneTopicRegistry.trading![0];
  const optionsFee = topic.specs[0];
  expect(
    computeSpecFacetOptions(items, activeFilters, topic, optionsFee),
  ).toEqual([
    { value: "$0", label: "$0", count: 1 },
    { value: "$0.65", label: "$0.65", count: 1 },
  ]);
});
```

`computeSpecFacetOptions()` removes active tokens for its own topic/key,
preserves every other filter and spec key, then evaluates each candidate value
through `projectDiscoveryItems()`. `computeTopicFacetOptions()` clears only the
topic dimension and incompatible specs while preserving query, category, type,
status, confidence, and freshness.

- [ ] **Step 5: Run the pure facet suite**

```bash
npx vitest run __tests__/unit/research-topic-facets.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit facet state logic**

```bash
git add lib/research/topic-facets.ts __tests__/unit/research-topic-facets.test.ts
git commit -m "feat(research): add topic and spec facet logic"
```

### Task 2: Server registry from the same key-fact computation

**Files:**

- Create: `lib/research/topic-facet-registry.ts`
- Create: `__tests__/unit/research-topic-facet-registry.test.ts`
- Modify: `components/research/ResearchHubPage.tsx`
- Modify: `components/research/ResearchHub.tsx`
- Modify: `lib/research/catalog-shell-logic.ts`
- Modify: `__tests__/unit/research-catalog-shell-logic.test.ts`

**Interfaces:**

- Consumes: `DiscoveryItem[]`, `BEST_X_MANIFEST`, `getTopicConfig()`, and context `keyFacts`.
- Produces: `buildTopicFacetRegistry()`, serialized `TopicFacetRegistry`, validated URL parsing, and spec-aware context matching.

- [ ] **Step 1: Write failing registry tests**

```ts
const facetItem = (productSlug: string, optionsFee: string): DiscoveryItem => ({
  id: `product:us:trading:${productSlug}`,
  market: "us",
  category: "trading",
  review: null,
  display: {
    title: productSlug,
    description: "Trading platform research",
    bestFor: null,
    searchText: productSlug,
    sortDate: "2026-07-03",
  },
  researchContexts: [
    {
      cockpitKey: "us/trading/trading-platforms",
      topic: "trading-platforms",
      topicLabel: "Best Trading Platforms",
      manifestOrder: 2,
      productSlug,
      displayName: productSlug,
      tagline: null,
      bestFor: null,
      status: "audited",
      confidence: "high",
      dataVerifiedAt: "2026-07-03",
      auditedScore: 9,
      auditedRank: 1,
      dataPoints: 4,
      compareBaseHref: "/us/trading/best/trading-platforms",
      keyFacts: {
        optionsFee,
        minDeposit: "$0",
        extendedHours: "Classic (pre/after-market)",
        tradingview: "Yes",
      },
    },
  ],
});

const tradingItems = [facetItem("alpha", "$0"), facetItem("beta", "$0.65")];
const reviewOnlyItems: DiscoveryItem[] = [
  {
    ...facetItem("review-only", "$0"),
    id: "review:/us/personal-finance/review-only",
    category: "personal-finance",
    review: {
      slug: "review-only",
      href: "/us/personal-finance/review-only",
      title: "Review only",
      description: "Review without Research context",
      editorialRating: 4.5,
      publishDate: "2026-06-01",
      modifiedDate: "2026-07-01",
      readingWords: 2800,
      featured: false,
      pricing: null,
    },
    researchContexts: [],
  },
];

it("uses TopicConfig labels and context keyFact values", () => {
  const registry = buildTopicFacetRegistry("us", tradingItems);
  expect(registry.trading?.[0]).toEqual(
    expect.objectContaining({
      topic: "trading-platforms",
      label: "Best Trading Platforms",
      specs: expect.arrayContaining([
        expect.objectContaining({
          key: "optionsFee",
          label: "Options fee (round-trip)",
        }),
      ]),
    }),
  );
});

it("does not expose a topic without qualified contexts", () => {
  expect(
    buildTopicFacetRegistry("us", reviewOnlyItems)["personal-finance"],
  ).toBeUndefined();
});

it("deduplicates and deterministically sorts formatted values", () => {
  const values = buildTopicFacetRegistry("us", tradingItems).trading?.[0]
    .specs[0].values;
  expect(values).toEqual([...new Set(values)].sort());
});
```

- [ ] **Step 2: Run and confirm the server registry module is missing**

```bash
npx vitest run __tests__/unit/research-topic-facet-registry.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement the server-only registry builder**

Start the file with:

```ts
import "server-only";
```

For each category/topic represented by at least one qualified context:

1. locate its manifest entry for label and order;
2. resolve `getTopicConfig(category, topic, market)`;
3. for each `specColumn`, read already formatted `context.keyFacts[column.key]`;
4. deduplicate and sort values;
5. retain definitions with two to four distinct values.

Do not invoke `specColumn.accessor()` again. This ensures card key facts and facet values are byte-identical.

- [ ] **Step 4: Make catalog matching spec-aware**

In `matchingContexts()`, parse every active token and require:

```ts
parsed.topic === context.topic && context.keyFacts[parsed.key] === parsed.value;
```

Every active spec group must match the same selected context: values within one
key are alternatives, while different keys all have to match.

In `parseDiscoverySearchParams()`, add an optional fourth
`TopicFacetRegistry` argument; when supplied:

- resolve implicit topic;
- reject unknown requested topics;
- call `validateSpecFilters()` on `params.getAll('spec')`.

- [ ] **Step 5: Pass the registry to `ResearchHub`**

Server:

```tsx
const topicFacets = buildTopicFacetRegistry(market, catalog.items);
<ResearchHub
  market={market}
  items={catalog.items}
  nodes={nodes}
  browseFallback={browseFallback}
  topicFacets={topicFacets}
/>;
```

Client prop:

```ts
topicFacets: TopicFacetRegistry;
```

- [ ] **Step 6: Run registry and shared shell tests**

```bash
npx vitest run \
  __tests__/unit/research-topic-facet-registry.test.ts \
  __tests__/unit/research-topic-facets.test.ts \
  __tests__/unit/research-catalog-shell-logic.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit the server registry**

```bash
git add lib/research/topic-facet-registry.ts __tests__/unit/research-topic-facet-registry.test.ts components/research/ResearchHubPage.tsx components/research/ResearchHub.tsx lib/research/catalog-shell-logic.ts __tests__/unit/research-catalog-shell-logic.test.ts
git commit -m "feat(research): derive spec facets from catalog facts"
```

### Task 3: Topic/spec controls, URL state, and analytics values

**Files:**

- Modify: `components/research/ResearchHub.tsx`
- Modify: `components/research/FilterChips.tsx`
- Modify: `lib/research/topic-facets.ts`
- Modify: `lib/analytics/research-events.ts`
- Modify: `lib/validation/index.ts`
- Modify: `docs/research-library/analytics-research-v1.md`
- Modify: `__tests__/unit/research-topic-facets.test.ts`
- Modify: `__tests__/unit/research-events.test.ts`

**Interfaces:**

- Consumes: serialized facet registry and PR 2 analytics contract.
- Produces: category→topic→spec progressive controls and `toResearchFacetAnalyticsValue()`.

- [ ] **Step 1: Write failing truncation and filter-enum tests**

```ts
it("keeps short analytics facet values byte-identical", () => {
  expect(toResearchFacetAnalyticsValue("topic:key:value")).toBe(
    "topic:key:value",
  );
});

it("deterministically limits long analytics values to 60 characters", () => {
  const value = "topic:key:" + "x".repeat(100);
  const first = toResearchFacetAnalyticsValue(value);
  expect(first).toHaveLength(60);
  expect(first).toBe(toResearchFacetAnalyticsValue(value));
});

it.each(["topic", "spec"] as const)(
  "accepts %s as a Research facet",
  (facet) => {
    const event = buildResearchEventData("research_filter_change", HUB_CTX, {
      facet,
      value: "value",
      active: true,
      resultCount: 1,
    });
    expect(event.properties.facet).toBe(facet);
  },
);
```

- [ ] **Step 2: Run and confirm enum/helper failures**

```bash
npx vitest run __tests__/unit/research-topic-facets.test.ts __tests__/unit/research-events.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement deterministic analytics limiting**

```ts
export function toResearchFacetAnalyticsValue(value: string): string {
  if (value.length <= 60) return value;
  return `${value.slice(0, 57)}...`;
}
```

Extend `ResearchFacet` and the strict Zod schema with `'topic' | 'spec'`. Keep `value.max(60)`.

- [ ] **Step 4: Render progressive controls**

In `ResearchHub`:

```ts
const categoryTopics = filters.category
  ? (topicFacets[filters.category] ?? [])
  : [];
const effectiveTopic = resolveTopic(
  filters.category,
  filters.topic,
  topicFacets,
);
const topicDefinition =
  categoryTopics.find((entry) => entry.topic === effectiveTopic) ?? null;
```

Render rules:

- no category: no topic/spec controls;
- one topic: show its label as non-interactive context and render its visible specs;
- multiple topics with none selected: render topic chips and no specs;
- selected topic: render its visible specs;
- each spec value is an independent toggle backed by repeated `spec` query
  values and displays the count from `computeSpecFacetOptions()`;
- topic chips display counts from `computeTopicFacetOptions()`.

Handlers:

```ts
const onCategoryChange = (category: Category | null) =>
  pushFilters(changeFacetCategory(filters, category));

const onTopicChange = (topic: string | null) =>
  pushFilters(changeFacetTopic(filters, topic));
```

Use `URLSearchParams.append('spec', token)` for repeated values.

- [ ] **Step 5: Emit full URL values and limited analytics values**

When a spec changes:

```ts
tracker.trackFilterChange(
  "spec",
  toResearchFacetAnalyticsValue(token),
  active,
  nextResultCount,
);
```

The URL receives the full unmodified `token`.

- [ ] **Step 6: Update analytics documentation and run tests**

```bash
npx vitest run \
  __tests__/unit/research-topic-facets.test.ts \
  __tests__/unit/research-topic-facet-registry.test.ts \
  __tests__/unit/research-catalog-shell-logic.test.ts \
  __tests__/unit/research-events.test.ts \
  __tests__/unit/track-route-research-batch.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit controls and analytics**

```bash
git add components/research/ResearchHub.tsx components/research/FilterChips.tsx lib/research/topic-facets.ts lib/analytics/research-events.ts lib/validation/index.ts docs/research-library/analytics-research-v1.md __tests__/unit/research-topic-facets.test.ts __tests__/unit/research-events.test.ts
git commit -m "feat(research): add topic and spec controls"
```

### Task 4: Topic/spec E2E and PR 4 release gate

**Files:**

- Create: `e2e/research-topic-facets.spec.ts`
- Modify: `e2e/research-tracking.spec.ts`
- Create: `audits/reports/research-discovery-pr4.md`

**Interfaces:**

- Consumes: qualified US trading context and pure multi-topic fixtures.
- Produces: browser proof for spec filtering, reload, Back, reset, robots, and analytics.

- [ ] **Step 1: Preserve multi-topic proof in deterministic unit fixtures**

The current production dataset has multiple US personal-finance manifest
topics but no qualified Research contexts for them. Use constructed qualified
contexts and assert:

| Fixture                             | Action                          | Required assertion                              |
| ----------------------------------- | ------------------------------- | ----------------------------------------------- |
| four personal-finance topics        | resolve with no requested topic | result is null and spec definitions stay hidden |
| active robo specs plus second topic | switch topic                    | every prior spec is removed                     |
| one product in two qualified topics | project without explicit topic  | one item appears with manifest-first context    |

Do not change production seeds.

- [ ] **Step 2: Add browser tests against the qualified Trading dossier**

Use `test.use({ javaScriptEnabled: true })` and implement:

| Case           | Action                                  | Required assertion                                             |
| -------------- | --------------------------------------- | -------------------------------------------------------------- |
| implicit topic | select Trading category                 | Trading topic context appears without a required topic click   |
| repeated spec  | activate two values of one spec key     | URL contains two `spec` entries and results match either value |
| reload         | reload with category and specs active   | same controls and result IDs return                            |
| Back           | change a spec, then navigate Back       | prior URL, controls, and result IDs return                     |
| reset          | activate category and specs, then reset | category, topic, and every spec parameter disappear            |
| robots         | request a spec-filtered URL             | response contains `X-Robots-Tag: noindex, follow`              |

Assert the full URL token, including any value colon, survives reload.

- [ ] **Step 3: Add wire analytics assertions**

Intercept `/api/track` and assert:

- topic chip sends `facet: 'topic'`;
- spec chip sends `facet: 'spec'`;
- value length is at most 60;
- actual item events retain full topic/category dimensions;
- no event contains the raw search query.

- [ ] **Step 4: Run focused tests and full gate**

```bash
npx vitest run \
  __tests__/unit/research-topic-facets.test.ts \
  __tests__/unit/research-topic-facet-registry.test.ts \
  __tests__/unit/research-catalog-shell-logic.test.ts \
  __tests__/unit/research-events.test.ts
BASE_URL=http://127.0.0.1:3012 npx playwright test \
  e2e/research-topic-facets.spec.ts \
  e2e/research-tracking.spec.ts \
  e2e/research-hub-markets.spec.ts
npx tsc --noEmit
npx vitest run
npm run check:imports
npm run build
```

Expected: every command exits 0 and all Research routes remain static.

- [ ] **Step 5: Record measured results and commit**

Create `audits/reports/research-discovery-pr4.md` with observed catalog bytes, result counts before/after spec filtering, test totals, raw/visible href counts, Research route types, and commit hash.

```bash
git add e2e/research-topic-facets.spec.ts e2e/research-tracking.spec.ts audits/reports/research-discovery-pr4.md
git commit -m "test(research): verify topic and spec facets"
```
