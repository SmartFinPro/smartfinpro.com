# Unified Research Discovery PR 3 Quick Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage report feed and Editor's Picks with a compact, market-aware Research Quick Finder that searches the canonical catalog, shows at most six cards, and hands users into reviews or the full Research hub.

**Architecture:** A server section loads the same `DiscoveryCatalog` used by the hub and sends normalized body-free `DiscoveryItem[]` to a small client Finder. Shared pure catalog logic performs local query/category matching and ranking. Review-backed cards always go to their review; Cockpit-only items go to a query-built hub URL for further Research qualification.

**Tech Stack:** Next.js RSC · React client state · shared Discovery shell logic · existing `research_v1` transport · Vitest · Playwright

## Global Constraints

- PR 2 must be merged.
- Finder state stays local and never writes the homepage URL.
- No more than six result cards are rendered.
- Review-backed items link directly to their review.
- Cockpit-only items link to the market Research hub, never directly to the Cockpit.
- Every query string is constructed with `URLSearchParams`.
- The main CTA carries only non-empty `q` and `category`.
- The result live region remains mounted even when its text changes.
- The Finder sends query length, never query text.
- Homepage JavaScript growth is at most 25 KB gzip.
- LCP remains at or below 2.5 seconds and within 10% of baseline; CLS remains below 0.1.

---

### Task 1: Add the Finder analytics event before rendering the surface

**Files:**

- Modify: `docs/research-library/analytics-research-v1.md`
- Modify: `lib/analytics/research-events.ts`
- Modify: `lib/analytics/research-tracking.ts`
- Modify: `lib/validation/index.ts`
- Modify: `__tests__/unit/research-events.test.ts`
- Modify: `__tests__/unit/research-tracking.test.ts`
- Modify: `__tests__/unit/track-route-research-batch.test.ts`

**Interfaces:**

- Consumes: PR 2 optional `surface`, `kind`, `trigger`, `category`, and item dimensions.
- Produces: `research_finder_cta`, `trackFinderCta()`, and strict route acceptance.

- [ ] **Step 1: Add failing event-list and payload tests**

```ts
const FINDER_CTX: ResearchContext = {
  market: "us",
  topic: "hub",
  pagePath: "/",
};

it("includes the Finder CTA event in the additive contract", () => {
  expect(RESEARCH_EVENT_NAMES).toContain("research_finder_cta");
});

it("builds a view-all Finder CTA without raw query text", () => {
  const event = buildResearchEventData("research_finder_cta", FINDER_CTX, {
    surface: "finder",
    trigger: "view_all",
    queryLength: 6,
    resultCount: 2,
  });
  expect(event.eventAction).toBe("finder_cta");
  expect(event.properties.trigger).toBe("view_all");
  expect(JSON.stringify(event)).not.toContain("schwab");
});

it("builds a dossier-item CTA with actual topic and category", () => {
  const event = buildResearchEventData(
    "research_finder_cta",
    FINDER_CTX,
    {
      surface: "finder",
      kind: "dossier",
      trigger: "dossier_item",
      productSlug: "merrill-edge",
    },
    { topic: "trading-platforms", category: "trading" },
  );
  expect(event.properties.topic).toBe("trading-platforms");
  expect(event.properties.category).toBe("trading");
});
```

- [ ] **Step 2: Run analytics tests and confirm the enum/schema failures**

```bash
npx vitest run \
  __tests__/unit/research-events.test.ts \
  __tests__/unit/research-tracking.test.ts \
  __tests__/unit/track-route-research-batch.test.ts
```

Expected: FAIL until all analytics layers accept the new event.

- [ ] **Step 3: Extend event actions, labels, values, tracker, and strict Zod enum**

Add `'research_finder_cta'` to both event-name arrays and:

```ts
research_finder_cta: 'finder_cta',
```

Derive label from `trigger` and value from `resultCount`.

Add:

```ts
trackFinderCta(
  trigger: 'view_all' | 'dossier_item',
  props: {
    queryLength: number;
    resultCount: number;
    productSlug?: string;
    kind?: 'review' | 'dossier';
  },
  options?: ResearchTrackOptions,
): void;
```

`options` carries surface/kind/topic/category through the PR 2 split between
serialized properties and item dimensions. Send immediately because both
Finder CTA variants navigate.

- [ ] **Step 4: Update the contract document**

Document both triggers, `surface: 'finder'`, item dimensions for dossier cards, and the privacy rule.

- [ ] **Step 5: Run analytics regressions**

```bash
npx vitest run \
  __tests__/unit/research-events.test.ts \
  __tests__/unit/research-tracking.test.ts \
  __tests__/unit/track-route-research-batch.test.ts \
  __tests__/unit/track-route-tool-batch.test.ts \
  __tests__/unit/cockpit-events.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Finder analytics**

```bash
git add docs/research-library/analytics-research-v1.md lib/analytics/research-events.ts lib/analytics/research-tracking.ts lib/validation/index.ts __tests__/unit/research-events.test.ts __tests__/unit/research-tracking.test.ts __tests__/unit/track-route-research-batch.test.ts
git commit -m "feat(research): add quick finder analytics"
```

### Task 2: Pure Finder ranking and URL contracts

**Files:**

- Modify: `lib/research/catalog-shell-logic.ts`
- Modify: `__tests__/unit/research-catalog-shell-logic.test.ts`

**Interfaces:**

- Consumes: `DiscoveryItem`, `researchBaseForMarket()`, query/category matching.
- Produces: `finderResults()`, `finderItemHref()`, and `finderViewAllHref()`.

- [ ] **Step 1: Add failing Finder behavior tests**

```ts
const finderItem = (
  id: string,
  over: Partial<DiscoveryItem> = {},
): DiscoveryItem =>
  makeDiscoveryItem({
    id,
    display: {
      ...makeDiscoveryItem().display,
      title: id,
      searchText: id.toLowerCase(),
    },
    ...over,
  });

const featuredReview = finderItem("featured", {
  review: makeReview({ featured: true }),
});
const newerOrdinary = finderItem("newer", {
  review: makeReview({ featured: false, modifiedDate: "2026-07-27" }),
});
const eightItems = Array.from({ length: 8 }, (_, index) =>
  finderItem(`item-${index}`),
);
const reviewWithContext = finderItem("fidelity", {
  review: makeReview({ href: "/us/trading/fidelity-review" }),
  researchContexts: [makeContext()],
});
const cockpitOnly = finderItem("merrill-edge", {
  review: null,
  display: {
    title: "Merrill Edge",
    description: "Broker research",
    bestFor: null,
    searchText: "merrill edge broker research",
    sortDate: "2026-07-03",
  },
  researchContexts: [
    makeContext({ productSlug: "merrill-edge", displayName: "Merrill Edge" }),
  ],
});

it("limits Finder results to six", () => {
  expect(finderResults(eightItems, { query: "", category: null })).toHaveLength(
    6,
  );
});

it("puts featured review-backed items first in the default state", () => {
  expect(
    finderResults([newerOrdinary, featuredReview], {
      query: "",
      category: null,
    })[0].id,
  ).toBe(featuredReview.id);
});

it("sends review-backed items directly to the review", () => {
  expect(finderItemHref(reviewWithContext)).toBe("/us/trading/fidelity-review");
});

it("sends cockpit-only items to a URLSearchParams-built hub URL", () => {
  expect(finderItemHref(cockpitOnly)).toBe(
    "/research?type=dossier&topic=trading-platforms&q=Merrill+Edge",
  );
});

it("omits empty view-all parameters", () => {
  expect(finderViewAllHref("uk", { query: " ", category: null })).toBe(
    "/uk/research",
  );
});
```

- [ ] **Step 2: Run and confirm missing Finder helpers**

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement the pure helpers**

```ts
export interface FinderFilters {
  query: string;
  category: Category | null;
}

export function finderResults(
  items: readonly DiscoveryItem[],
  filters: FinderFilters,
  limit = 6,
): DiscoveryItem[] {
  return sortFinderItems(items, filters).slice(0, limit);
}

export function finderItemHref(item: DiscoveryItem): string {
  if (item.review) return item.review.href;
  const context = item.researchContexts[0];
  if (!context) return researchBaseForMarket(item.market);
  const params = new URLSearchParams();
  params.set("type", "dossier");
  params.set("topic", context.topic);
  params.set("q", item.display.title);
  return `${researchBaseForMarket(item.market)}?${params.toString()}`;
}

export function finderViewAllHref(
  market: Market,
  filters: FinderFilters,
): string {
  const params = new URLSearchParams();
  const query = filters.query.trim();
  if (query) params.set("q", query);
  if (filters.category) params.set("category", filters.category);
  const queryString = params.toString();
  return `${researchBaseForMarket(market)}${queryString ? `?${queryString}` : ""}`;
}
```

- [ ] **Step 4: Run the shared shell tests**

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Finder contracts**

```bash
git add lib/research/catalog-shell-logic.ts __tests__/unit/research-catalog-shell-logic.test.ts
git commit -m "feat(research): add quick finder shell contracts"
```

### Task 3: Server section and client Quick Finder

**Files:**

- Create: `components/marketing/research-quick-finder-section.tsx`
- Create: `components/research/QuickFinder.tsx`
- Create: `__tests__/unit/research-quick-finder.test.ts`
- Modify: `app/(marketing)/[market]/page.tsx`
- Modify: `components/marketing/homepage-sections.tsx`

**Interfaces:**

- Consumes: `getDiscoveryCatalog()`, `FilterChips`, Finder pure helpers, Research tracker.
- Produces: `ResearchQuickFinderSection({ market, catalog })` and `QuickFinder({ market, items })`.

- [ ] **Step 1: Write failing server-markup tests**

```ts
import { renderToStaticMarkup } from 'react-dom/server';

const makeFinderItem = (index: number): DiscoveryItem => ({
  id: `review:/us/trading/provider-${index}-review`,
  market: 'us',
  category: 'trading',
  review: {
    slug: `provider-${index}-review`,
    href: `/us/trading/provider-${index}-review`,
    title: `Provider ${index} Review`,
    description: `Provider ${index} description`,
    editorialRating: 4.5,
    publishDate: '2026-06-01',
    modifiedDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    readingWords: 2800,
    featured: index === 0,
    pricing: null,
  },
  display: {
    title: `Provider ${index} Review`,
    description: `Provider ${index} description`,
    bestFor: null,
    searchText: `provider ${index} trading`,
    sortDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
  },
  researchContexts: [],
});

const eightItems = Array.from({ length: 8 }, (_, index) =>
  makeFinderItem(index),
);
const renderQuickFinder = (): string =>
  renderToStaticMarkup(<QuickFinder market="us" items={eightItems} />);
const countOccurrences = (value: string, needle: string): number =>
  value.split(needle).length - 1;

it('renders at most six Finder cards', () => {
  const html = renderQuickFinder();
  expect(countOccurrences(html, 'data-finder-item=')).toBe(6);
});

it('keeps a mounted polite live region', () => {
  const html = renderQuickFinder();
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('aria-atomic="true"');
});

it('does not render star or review-count semantics', () => {
  const html = renderQuickFinder();
  expect(html).not.toContain('reviewCount');
  expect(html).not.toContain('aria-label="star"');
});
```

- [ ] **Step 2: Run and confirm the components are missing**

```bash
npx vitest run __tests__/unit/research-quick-finder.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement the server section**

```tsx
interface ResearchQuickFinderSectionProps {
  market: Market;
  catalog: DiscoveryCatalog;
}

export function ResearchQuickFinderSection({
  market,
  catalog,
}: ResearchQuickFinderSectionProps) {
  const categoryCounts = Object.entries(
    catalog.items.reduce<Record<string, number>>((counts, item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
      return counts;
    }, {}),
  );

  return (
    <section id="reports" aria-labelledby="research-finder-heading">
      <p>Research Library</p>
      <h2 id="research-finder-heading">
        Find the research that fits your decision
      </h2>
      <p>{catalog.counts.discoveryItemCount} research entries available</p>
      <nav aria-label="Research categories">
        {categoryCounts.map(([category, count]) => {
          const params = new URLSearchParams();
          params.set("category", category);
          const href = `${researchBaseForMarket(market)}?${params.toString()}`;
          return (
            <Link key={category} href={href}>
              {categoryConfig[category as Category].name} ({count})
            </Link>
          );
        })}
      </nav>
      <QuickFinder market={market} items={catalog.items} />
    </section>
  );
}
```

- [ ] **Step 4: Implement the client Finder**

```tsx
"use client";

export interface QuickFinderProps {
  market: Market;
  items: DiscoveryItem[];
}
```

Behavior:

- `useState('')` for query and `useState<Category | null>(null)` for category;
- `useMemo(() => finderResults(items, { query, category }), ...)`;
- render category chips only for categories present in `items`;
- render six or fewer `<article data-finder-item={item.id}>`;
- title link uses `finderItemHref(item)`;
- review-backed rating is `Editorial · x/5`;
- Cockpit-only provisional state is `In verification`;
- view-all link uses `finderViewAllHref()`;
- permanent live region text is `${results.length} results`;
- no router import and no homepage query updates.

Wire analytics:

- query engagement emits once after a 300 ms settled-value debounce using the
  existing Research search method with `surface: 'finder'`;
- category changes emit one filter event with `surface: 'finder'`;
- review title clicks use `research_review_click`, `surface: 'finder'`, and actual item dimensions when available;
- Cockpit-only item clicks use `trackFinderCta('dossier_item', ...)`;
- main CTA uses `trackFinderCta('view_all', ...)`.

- [ ] **Step 5: Replace the homepage feed and Editor's Picks**

In `[market]/page.tsx`:

- load `const catalog = await getDiscoveryCatalog(marketData)`;
- remove the local `getMarketReviews` cache and its
  `unstable_cache`/`getContentByMarketAndCategory` imports;
- remove `REPORTS_PER_PAGE` and page-search-param parsing when they have no
  remaining consumer;
- remove `currentPage`, pagination math, `paginatedReviews`, and Editor's Picks derivation;
- remove `PortalSidebar`, `ReportCard`, `ReportPagination`, `EditorsPicks`, and `BarChart3` imports when unused;
- replace the entire `#reports` feed with:

```tsx
<ResearchQuickFinderSection market={marketData} catalog={catalog} />
```

- remove `<EditorsPicks ... />`;
- use `catalog.counts.reviewBackedCount` for `PlatformStats.totalReviews`, because its visible label remains “Expert Reviews”;
- use catalog items for any homepage category count that represents Research inventory.

- [ ] **Step 6: Run unit and type tests**

```bash
npx vitest run \
  __tests__/unit/research-quick-finder.test.ts \
  __tests__/unit/research-catalog-shell-logic.test.ts \
  __tests__/unit/research-events.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit the Finder surface**

```bash
git add components/marketing/research-quick-finder-section.tsx components/research/QuickFinder.tsx __tests__/unit/research-quick-finder.test.ts app/\(marketing\)/\[market\]/page.tsx components/marketing/homepage-sections.tsx
git commit -m "feat(homepage): replace report feed with research finder"
```

### Task 4: Homepage Finder E2E and performance release gate

**Files:**

- Create: `e2e/homepage-quick-finder.spec.ts`
- Create: `scripts/research/measure-route-js.mjs`
- Modify: `e2e/research-tracking.spec.ts`
- Modify: homepage-related E2E files returned by `rg -n "#reports|Editor.s Picks|Report Feed" e2e`
- Create: `audits/reports/research-discovery-pr3.md`

**Interfaces:**

- Consumes: completed Finder surface.
- Produces: functional, accessibility, analytics, payload, LCP, and CLS proof.

- [ ] **Step 1: Add functional E2E with JavaScript enabled**

Use `test.use({ javaScriptEnabled: true })` and implement:

| Case         | Action                                       | Required assertion                                       |
| ------------ | -------------------------------------------- | -------------------------------------------------------- |
| limit        | open each market homepage                    | Finder card count is between 1 and 6                     |
| local query  | type into Finder search                      | result count changes and homepage URL does not           |
| category     | toggle an available category                 | every visible card belongs to it and URL does not change |
| view all     | activate query and category                  | href contains exactly those non-empty parameters         |
| review       | click a review-backed card                   | destination is its review href                           |
| Cockpit-only | click an unmatched dossier card when present | destination is prefiltered Research hub, never Cockpit   |
| reset        | activate filters then reset                  | default result IDs return                                |
| live region  | change query                                 | polite region announces visible count                    |
| Axe          | scan default and filtered states             | no serious or critical findings                          |

For the US journey:

```ts
await page.goto("/");
await page.getByRole("searchbox", { name: /search research/i }).fill("schwab");
const cta = page.getByRole("link", { name: /view all research/i });
await expect(cta).toHaveAttribute("href", "/research?q=schwab");
```

- [ ] **Step 2: Assert Finder analytics on the wire**

Intercept `/api/track` and prove:

- `research_search` has `surface: 'finder'`, query length, and no raw query;
- `research_finder_cta` main CTA has `trigger: 'view_all'`;
- Cockpit-only item CTA has `trigger: 'dossier_item'`, actual topic, and actual category;
- review click has `kind: 'review'`.

- [ ] **Step 3: Capture before/after route JavaScript**

Create `scripts/research/measure-route-js.mjs`. It fetches one production URL,
extracts unique local `<script src="/_next/static/...js">` paths, maps them to
files under `.next/static`, sums `gzipSync(readFileSync(file)).byteLength`, and
prints JSON containing URL, sorted chunk paths, raw bytes, and gzip bytes.
Reject remote script hosts and missing local chunks.

Run the same command against base and head builds:

```bash
node scripts/research/measure-route-js.mjs http://127.0.0.1:3012/
```

- [ ] **Step 4: Measure LCP and CLS**

Reuse the `PerformanceObserver` pattern from `e2e/research-a11y.spec.ts`. Assert:

```ts
expect(lcp).toBeGreaterThan(0);
expect(lcp).toBeLessThanOrEqual(2500);
expect(lcp).toBeLessThanOrEqual(baselineLcp * 1.1);
expect(cls).toBeLessThan(0.1);
```

The baseline value must be measured from the PR base build on the same machine and viewport.

- [ ] **Step 5: Run focused E2E and the full PR gate**

```bash
BASE_URL=http://127.0.0.1:3012 npx playwright test \
  e2e/homepage-quick-finder.spec.ts \
  e2e/research-tracking.spec.ts \
  e2e/hydration.spec.ts
npx tsc --noEmit
npx vitest run
npm run check:imports
npm run build
```

Expected: every command exits 0.

- [ ] **Step 6: Record measured results and commit**

Create `audits/reports/research-discovery-pr3.md` with literal base/head values for homepage HTML, route JavaScript gzip delta, LCP, CLS, visible/raw link counts, Discovery counts, test totals, route types, and commit hash.

```bash
git add e2e/homepage-quick-finder.spec.ts scripts/research/measure-route-js.mjs e2e/research-tracking.spec.ts audits/reports/research-discovery-pr3.md
git commit -m "test(homepage): verify research finder release gates"
```
