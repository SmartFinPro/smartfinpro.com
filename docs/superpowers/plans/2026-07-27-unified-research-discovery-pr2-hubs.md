# Unified Research Discovery PR 2 Universal Hubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalize the US pilot into four crawlable market Research hubs with honest cards, URL-backed filters, scoped shortlist UI, correct SEO/routing, and complete hub analytics.

**Architecture:** Thin route wrappers call one server `ResearchHubPage`, which builds a single catalog snapshot, server-rendered dossier/card nodes, JSON-LD, metrics, and a complete browse fallback. The client `ResearchHub` receives serializable metadata plus opaque React nodes and owns query state, visibility, shortlist interaction, and delegated analytics. Existing `ResearchCard` provenance rendering remains authoritative.

**Tech Stack:** Next.js App Router · React Server Components · React client shell · Zod · Vitest · Playwright · existing Research analytics transport

## Amended preconditions (2026-07-27)

Two operator-approved decisions amend the PR 1 contract this plan builds on.
Both are documented in `docs/superpowers/specs/2026-07-27-research-discovery-catalog-design.md`
(§5.3.1 and §11.2.1/§11.3.1) and landed in code ahead of this plan via
`feat(research): three-tier scope snapshot guards stored shortlists`
(`lib/research/catalog-shell-logic.ts`). **No task below may re-implement the
old flat contract** — read the linked section before touching the named file.

- **Decision A — per-topic overlay cache + 60s failure backoff (spec §5.3.1).**
  The Research overlay cache moves from one entry per market to one entry per
  topic (`['research-discovery-contexts', market, category, topic]`,
  `revalidate: 3600`), plus an in-process `Map<CockpitKey, retryAfterEpochMs>`
  backoff (injectable clock) for a topic that just failed, because
  `unstable_cache` never stores a thrown error. **Task 3** (server nodes,
  `getDiscoveryCatalogBundle` consumption) and any later task that touches
  `lib/research/catalog.ts`'s overlay loaders (`getCachedResearchContexts`,
  `loadMarketResearchContexts`, `loadTopicOverlayRows`) must wire this
  per-topic cache and backoff instead of reusing the single market-wide
  `unstable_cache` entry that exists today. `logger.warn` fires once per
  backoff window, not once per request.
- **Decision B — three-tier `ShortlistScopeSnapshot` (spec §11.2.1/§11.3.1).**
  `restoreScopedShortlist` no longer takes a flat
  `ReadonlyMap<CockpitKey, ReadonlySet<string>>`; it takes a
  `ShortlistScopeSnapshot { knownScopes, availableScopes, unavailableScopes }`.
  A scope currently in `unavailableScopes` (backoff, load failure, or
  `missing_topic_config`) leaves storage byte-identical and returns an empty
  state — it is NOT treated the same as a scope absent from `knownScopes`
  (which is genuinely stale and does get cleared). **Task 4** (client hub /
  `ResearchHub.tsx` restore-on-mount call) and **Task 5** (shortlist UI,
  `describeScopeSwitch` dialog wording) must build this snapshot from the
  full, unfiltered market catalog — never from the currently visible/filtered
  projection — and must use the shipped `describeScopeSwitch()` helper for the
  cross-topic switch dialog's copy instead of writing new dialog-state logic
  that assumes the active scope is always verifiable.

## Global Constraints

- PR 1 must be merged; import only its public catalog and shell interfaces.
- The four canonical routes are `/research`, `/uk/research`, `/ca/research`, and `/au/research`.
- `/us/research` permanently redirects to `/research`.
- Exactly one H1, one canonical, one hreflang cluster, and one audited-only `ItemList` per hub.
- Every review href must exist in raw HTML with JavaScript disabled.
- Filter URLs are `noindex, follow`; canonical and OpenGraph URLs remain filterless.
- An audited score is shown only from the selected audited context.
- A review without a selected audited context shows `Editorial · x/5` without a star.
- A provisional Cockpit-only card shows `In verification` without a number.
- `reviewCount`, fabricated dates, and fabricated scores are forbidden.
- The existing `ResearchCard` remains a server component.
- Shortlist persistence does not run until an explicit restore completion flag is true.
- Header and market switcher must work at 1024, 1100, and 1280 pixels.

---

### Task 1: Scope the existing pilot E2E before changing the route

**Files:**

- Modify: `e2e/research-shell.spec.ts`
- Modify: `e2e/research-tracking.spec.ts`
- Modify: `e2e/research-a11y.spec.ts`
- Modify: `app/(marketing)/research/page.tsx`

**Interfaces:**

- Consumes: current US pilot markup.
- Produces: `data-testid="dossier-trading-platforms"` as the stable pilot scope used during migration.

- [ ] **Step 1: Add a failing scope assertion**

In `e2e/research-shell.spec.ts`:

```ts
test("the trading pilot has a stable topic scope", async ({ page }) => {
  await gotoResearch(page);
  await expect(page.getByTestId("dossier-trading-platforms")).toBeVisible();
});
```

- [ ] **Step 2: Run against the existing production build**

```bash
BASE_URL=http://127.0.0.1:3012 npx playwright test e2e/research-shell.spec.ts
```

Expected: FAIL because the test id is absent.

- [ ] **Step 3: Add the scope to the pilot dossier section**

Wrap the current pilot's card section:

```tsx
<section
  data-testid="dossier-trading-platforms"
  className="mx-auto px-6 py-8 sm:py-12"
  style={{ maxWidth: "1280px" }}
>
  {/* existing pilot section body remains unchanged */}
</section>
```

Update hard-coded counts and locators in all three Research specs to start from:

```ts
const tradingDossier = page.getByTestId("dossier-trading-platforms");
```

The `q=schwab` and `#1 Overall` assertions must use this locator.

- [ ] **Step 4: Run all pilot Research E2E**

```bash
BASE_URL=http://127.0.0.1:3012 npx playwright test \
  e2e/research-shell.spec.ts \
  e2e/research-tracking.spec.ts \
  e2e/research-a11y.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the migration safety net**

```bash
git add app/\(marketing\)/research/page.tsx e2e/research-shell.spec.ts e2e/research-tracking.spec.ts e2e/research-a11y.spec.ts
git commit -m "test(research): scope pilot assertions by topic"
```

### Task 2: Market copy, metadata, and wrapper routes

**Files:**

- Create: `lib/research/hub-copy.ts`
- Create: `__tests__/unit/research-hub-copy.test.ts`
- Create: `components/research/ResearchHubPage.tsx`
- Replace: `app/(marketing)/research/page.tsx`
- Create: `app/(marketing)/uk/research/page.tsx`
- Create: `app/(marketing)/ca/research/page.tsx`
- Create: `app/(marketing)/au/research/page.tsx`

**Interfaces:**

- Consumes: `Market`, `marketConfig`, `researchBaseForMarket()`, and `getDiscoveryCatalog()`.
- Produces: `ResearchHubCopy`, `getResearchHubCopy()`, `metadataForResearchMarket()`, and `ResearchHubPage({ market })`.

- [ ] **Step 1: Write failing copy and metadata tests**

```ts
import { describe, expect, it } from "vitest";
import {
  getResearchHubCopy,
  metadataForResearchMarket,
} from "@/lib/research/hub-copy";
import { markets } from "@/lib/i18n/config";

describe.each(markets)("%s Research metadata", (market) => {
  it("keeps rendered title and description in the green range", () => {
    const copy = getResearchHubCopy(market);
    expect(`${copy.metadataTitle} | SmartFinPro`.length).toBeGreaterThanOrEqual(
      45,
    );
    expect(`${copy.metadataTitle} | SmartFinPro`.length).toBeLessThanOrEqual(
      60,
    );
    expect(copy.description.length).toBeGreaterThanOrEqual(140);
    expect(copy.description.length).toBeLessThanOrEqual(160);
  });

  it("uses a filterless canonical and complete languages map", () => {
    const metadata = metadataForResearchMarket(market);
    expect(metadata.alternates?.canonical).toBe(
      market === "us" ? "/research" : `/${market}/research`,
    );
    expect(Object.keys(metadata.alternates?.languages ?? {})).toEqual(
      expect.arrayContaining(["en-US", "en-GB", "en-CA", "en-AU", "x-default"]),
    );
  });
});
```

- [ ] **Step 2: Run and confirm the hub-copy module is missing**

```bash
npx vitest run __tests__/unit/research-hub-copy.test.ts
```

Expected: FAIL because `hub-copy.ts` does not exist.

- [ ] **Step 3: Implement explicit per-market copy**

Use:

```ts
export interface ResearchHubCopy {
  metadataTitle: string;
  h1: string;
  description: string;
  eyebrow: string;
  areaServed: string[];
}

const HUB_COPY: Record<Market, ResearchHubCopy> = {
  us: {
    metadataTitle: "US Financial Product Research Library",
    h1: "US Financial Product Research",
    description:
      "Explore independent US financial product reviews and verified research dossiers, with transparent ratings, dated evidence and direct comparison paths.",
    eyebrow: "SmartFinPro Research · United States",
    areaServed: ["US"],
  },
  uk: {
    metadataTitle: "UK Financial Product Research Library",
    h1: "UK Financial Product Research",
    description:
      "Explore independent UK financial product reviews and verified research dossiers, with transparent ratings, dated evidence and direct comparison paths.",
    eyebrow: "SmartFinPro Research · United Kingdom",
    areaServed: ["GB"],
  },
  ca: {
    metadataTitle: "Canada Financial Product Research",
    h1: "Canadian Financial Product Research",
    description:
      "Explore independent Canadian financial product reviews and verified research dossiers, with transparent ratings, dated evidence and comparison paths.",
    eyebrow: "SmartFinPro Research · Canada",
    areaServed: ["CA"],
  },
  au: {
    metadataTitle: "Australia Financial Product Research",
    h1: "Australian Financial Product Research",
    description:
      "Explore independent Australian financial product reviews and verified research dossiers, with transparent ratings, dated evidence and comparison paths.",
    eyebrow: "SmartFinPro Research · Australia",
    areaServed: ["AU"],
  },
};

export const getResearchHubCopy = (market: Market): ResearchHubCopy =>
  HUB_COPY[market];

export function metadataForResearchMarket(market: Market): Metadata {
  const copy = getResearchHubCopy(market);
  const canonical = researchBaseForMarket(market);
  return {
    title: copy.metadataTitle,
    description: copy.description,
    alternates: { canonical, languages },
    openGraph: {
      title: copy.metadataTitle,
      description: copy.description,
      type: "website",
      url: canonical,
    },
  };
}
```

Run the unit test and adjust literal copy only if a length assertion proves a value is out of range.

Build the languages map from `researchBaseForMarket()`, not `generateAlternates()`:

```ts
const languages = Object.fromEntries(
  markets.map((market) => [
    marketConfig[market].hreflang,
    researchBaseForMarket(market),
  ]),
);
languages["x-default"] = "/research";
```

- [ ] **Step 4: Add thin route wrappers**

Each route exports its own metadata function and delegates rendering:

```tsx
import { ResearchHubPage } from "@/components/research/ResearchHubPage";
import { metadataForResearchMarket } from "@/lib/research/hub-copy";

export const generateMetadata = () => metadataForResearchMarket("uk");

export default function UkResearchPage() {
  return <ResearchHubPage market="uk" />;
}
```

Use the corresponding literal market in all four wrappers.

- [ ] **Step 5: Add a compilable server-page foundation**

```tsx
import type { Market } from "@/lib/i18n/config";
import { getDiscoveryCatalogBundle } from "@/lib/research/catalog";
import { getResearchHubCopy } from "@/lib/research/hub-copy";

export async function ResearchHubPage({ market }: { market: Market }) {
  const [{ catalog }, copy] = await Promise.all([
    getDiscoveryCatalogBundle(market),
    Promise.resolve(getResearchHubCopy(market)),
  ]);
  return (
    <article data-research-market={market}>
      <header>
        <p>{copy.eyebrow}</p>
        <h1>{copy.h1}</h1>
        <p>{copy.description}</p>
        <p>{catalog.counts.discoveryItemCount} research entries</p>
      </header>
    </article>
  );
}
```

The marketing layout already owns `<main id="main-content">`; do not add a
second main landmark.

- [ ] **Step 6: Run metadata tests and type checking**

```bash
npx vitest run __tests__/unit/research-hub-copy.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit route foundations**

```bash
git add lib/research/hub-copy.ts __tests__/unit/research-hub-copy.test.ts components/research/ResearchHubPage.tsx app/\(marketing\)/research/page.tsx app/\(marketing\)/uk/research/page.tsx app/\(marketing\)/ca/research/page.tsx app/\(marketing\)/au/research/page.tsx
git commit -m "feat(research): add universal market hub routes"
```

### Task 3: Server-rendered cards, dossier nodes, fallback, and JSON-LD

**Files:**

- Create: `components/research/CatalogCard.tsx`
- Modify: `components/research/ResearchHubPage.tsx`
- Modify: `components/research/ResearchCard.tsx`
- Create: `__tests__/unit/research-catalog-card.test.ts`
- Create: `__tests__/unit/research-hub-schema.test.ts`

**Interfaces:**

- Consumes: `DiscoveryItem`, `DiscoveryProjection`, `ResearchContext`, `DiscoveryCatalogBundle.dossierRows`, `ResearchCard`, `projectionNodeKey()`, and `generateComparisonItemListSchema()`.
- Produces: `CatalogCard`, `ResearchHubNode`, `buildResearchItemListSchema()`, and complete `browseFallback`.

- [ ] **Step 1: Write failing rating-origin and schema tests**

```ts
import { renderToStaticMarkup } from 'react-dom/server';

const makeProjection = ({
  kind,
  status = 'audited',
  auditedScore = 9.4,
  editorialRating = 4.7,
}: {
  kind: 'review' | 'dossier';
  status?: 'audited' | 'provisional';
  auditedScore?: number | null;
  editorialRating?: number;
}): DiscoveryProjection => {
  const item = makeDiscoveryItem({
    review: makeReview({ editorialRating }),
  });
  if (kind === 'review') {
    return { itemId: item.id, kind, item, context: null };
  }
  const context = makeContext({
    status,
    auditedScore: status === 'audited' ? auditedScore : null,
    auditedRank: status === 'audited' ? 1 : null,
    confidence: status === 'audited' ? 'high' : null,
  });
  return { itemId: item.id, kind, item, context };
};

const renderCatalogCard = (projection: DiscoveryProjection): string =>
  renderToStaticMarkup(<CatalogCard projection={projection} />);

const makeSecondAuditedProjection = (): DiscoveryProjection => {
  const base = makeProjection({ kind: 'dossier', status: 'audited' });
  if (base.kind !== 'dossier') throw new Error('fixture must be a dossier');
  const item = {
    ...base.item,
    id: 'product:us:trading:charles-schwab',
    review: null,
    display: { ...base.item.display, title: 'Charles Schwab' },
  };
  return {
    itemId: item.id,
    kind: 'dossier',
    item,
    context: {
      ...base.context,
      productSlug: 'charles-schwab',
      displayName: 'Charles Schwab',
      auditedRank: 2,
    },
  };
};

it('labels an audited context on the 10-point scale', () => {
  const html = renderCatalogCard(
    makeProjection({ kind: 'dossier', status: 'audited', auditedScore: 9.4 }),
  );
  expect(html).toContain('Audited · 9.4/10');
  expect(html).not.toContain('Editorial ·');
});

it('labels an editorial review on the 5-point scale without a star', () => {
  const html = renderCatalogCard(
    makeProjection({ kind: 'review', editorialRating: 4.7 }),
  );
  expect(html).toContain('Editorial · 4.7/5');
  expect(html).not.toContain('<svg');
  expect(html).not.toContain('reviewCount');
});

it('emits only unique audited dossier products in ItemList order', () => {
  const projections = [
    makeProjection({ kind: 'dossier', status: 'audited', auditedScore: 9.4 }),
    makeSecondAuditedProjection(),
    makeProjection({ kind: 'dossier', status: 'provisional' }),
  ];
  const copy = getResearchHubCopy('us');
  const schema = buildResearchItemListSchema('us', projections, copy);
  expect(schema.numberOfItems).toBe(2);
  expect(schema.itemListElement.map((entry) => entry.position)).toEqual([1, 2]);
});
```

- [ ] **Step 2: Run and confirm missing card/schema exports**

```bash
npx vitest run __tests__/unit/research-catalog-card.test.ts __tests__/unit/research-hub-schema.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `CatalogCard` with independent links**

Use the public interface:

```tsx
export interface CatalogCardProps {
  projection: DiscoveryProjection;
  methodologyHref?: string;
}

export function CatalogCard({
  projection,
  methodologyHref = "/methodology",
}: CatalogCardProps) {
  const { item, context } = projection;
  const compareParams = new URLSearchParams();
  if (context) compareParams.set("compare", context.productSlug);
  const cockpitHref = context
    ? `${context.compareBaseHref}?${compareParams.toString()}`
    : researchBaseForMarket(item.market);
  const primaryHref = item.review?.href ?? cockpitHref;
  const ratingLabel =
    context?.status === "audited" && context.auditedScore !== null
      ? `Audited · ${context.auditedScore.toFixed(1)}/10`
      : item.review
        ? `Editorial · ${item.review.editorialRating.toFixed(1)}/5`
        : "In verification";

  return (
    <article data-discovery-item={item.id}>
      <p>{categoryConfig[item.category].name}</p>
      <h3>
        <Link href={primaryHref}>{item.display.title}</Link>
      </h3>
      <p>{item.display.description}</p>
      <span>{ratingLabel}</span>
      <Link href={methodologyHref}>Methodology</Link>
    </article>
  );
}
```

Apply existing premium Research card tokens, but preserve the DOM contract: no outer link, title link and methodology link are siblings, and no stars or review counts.

- [ ] **Step 4: Build server nodes and full fallback**

Define:

```ts
export interface ResearchHubNode {
  key: string;
  projection: DiscoveryProjection;
  node: ReactNode;
}
```

Load `getDiscoveryCatalogBundle(market)` once. For every default projection:

- use `ResearchCard` for a qualified dossier by looking up
  `bundle.dossierRows` with
  `projectionNodeKey(item.id, context.cockpitKey)`;
- use `CatalogCard` for review projections and Cockpit-only provisional projections;
- use `projectionNodeKey(item.id, context?.cockpitKey ?? null)` for every node.

Throw during development when an audited sidecar row is missing. In production,
apply the normative degradation rule: render the review projection when the
item has a review, otherwise omit the result.

`browseFallback` must render:

1. every qualified dossier node;
2. a review grid containing all review-backed items not already linked by a dossier node;
3. the first, middle, and last review href as ordinary server-rendered anchors.

Do not slice or paginate the fallback.

When `catalog.items` is empty, render one honest empty state with the market
name, no metric tiles claiming inventory, and no JSON-LD item list. Add a unit
case that supplies an empty bundle and asserts one H1, the empty-state copy,
zero product cards, and no fabricated score/date text.

- [ ] **Step 5: Build audited-only JSON-LD**

Export:

```ts
export function buildResearchItemListSchema(
  market: Market,
  projections: readonly DiscoveryProjection[],
  copy: ResearchHubCopy,
) {
  const absoluteUrl = (path: string): string =>
    new URL(path, BASE_URL).toString();
  const seen = new Set<string>();
  const audited = projections.filter((projection) => {
    if (
      projection.kind !== "dossier" ||
      projection.context.status !== "audited" ||
      seen.has(projection.itemId)
    ) {
      return false;
    }
    seen.add(projection.itemId);
    return true;
  });
  return generateComparisonItemListSchema({
    title: copy.h1,
    description: copy.description,
    url: absoluteUrl(researchBaseForMarket(market)),
    id: `${absoluteUrl(researchBaseForMarket(market))}#itemlist`,
    products: audited.map(({ item, context }) => ({
      name: item.display.title,
      description: item.display.bestFor ?? undefined,
      url: absoluteUrl(item.review?.href ?? context.compareBaseHref),
      areaServed: copy.areaServed,
    })),
  });
}
```

- [ ] **Step 6: Run card/schema and existing ResearchCard tests**

```bash
npx vitest run \
  __tests__/unit/research-catalog-card.test.ts \
  __tests__/unit/research-hub-schema.test.ts \
  __tests__/unit/research-card.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit server rendering**

```bash
git add components/research/CatalogCard.tsx components/research/ResearchHubPage.tsx components/research/ResearchCard.tsx __tests__/unit/research-catalog-card.test.ts __tests__/unit/research-hub-schema.test.ts
git commit -m "feat(research): render crawlable discovery hubs"
```

### Task 4: Client hub, URL filters, facets, and accessible result state

**Files:**

- Create: `components/research/FilterChips.tsx`
- Create: `components/research/ResearchHub.tsx`
- Modify: `components/research/ResearchHubPage.tsx`
- Modify: `lib/research/catalog-shell-logic.ts`
- Modify: `__tests__/unit/research-catalog-shell-logic.test.ts`

**Interfaces:**

- Consumes: `DiscoveryItem[]`, `ResearchHubNode[]`, pure projection/facet functions, `useSearchParams()`.
- Produces: `parseDiscoverySearchParams()`, `buildDiscoverySearchParams()`, `FilterChips`, and interactive `ResearchHub`.

- [ ] **Step 1: Add failing URL round-trip tests**

```ts
it("parses only valid market categories and known enum values", () => {
  const parsed = parseDiscoverySearchParams(
    new URLSearchParams(
      "q=schwab&category=trading&type=dossier&status=audited&confidence=high&fresh=2026-07-01",
    ),
    "us",
    [makeDiscoveryItem()],
  );
  expect(parsed).toEqual({
    query: "schwab",
    category: "trading",
    type: "dossier",
    status: "audited",
    confidence: "high",
    fresh: "2026-07-01",
    topic: null,
    specs: [],
  });
});

it("drops invalid values instead of preserving them", () => {
  expect(
    buildDiscoverySearchParams(
      parseDiscoverySearchParams(
        new URLSearchParams("category=superannuation&type=bogus"),
        "us",
        [],
      ),
    ).toString(),
  ).toBe("");
});
```

- [ ] **Step 2: Run and confirm the parser exports are missing**

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement URL parsing and serialization**

```ts
export function parseDiscoverySearchParams(
  params: Pick<URLSearchParams, "get" | "getAll">,
  market: Market,
  items: readonly DiscoveryItem[],
): DiscoveryFilters;

export function buildDiscoverySearchParams(
  filters: DiscoveryFilters,
): URLSearchParams;
```

Validate:

- category against `marketCategories[market]`
- type against `review | dossier`
- status against `audited | provisional`
- confidence against `high | medium | low`
- fresh against `/^\d{4}-\d{2}-\d{2}$/`
- query after `.trim()`
- topic against contexts present in `items`
- repeated specs through `getAll('spec')`, retaining only tokens that match at
  least one context topic/key/value in `items`

Use `URLSearchParams.set()`, `append()`, and `delete()` only.

- [ ] **Step 4: Extract `FilterChips`**

```tsx
export interface FilterChipOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterChipsProps {
  label: string;
  value: string | null;
  options: FilterChipOption[];
  onChange(value: string | null): void;
}
```

The button remains `type="button"` with `aria-pressed`. Render the dimension only when `options.length >= 2`.

- [ ] **Step 5: Implement the `ResearchHub` shell**

```tsx
"use client";

export interface ResearchHubProps {
  market: Market;
  items: DiscoveryItem[];
  nodes: Array<{
    key: string;
    itemId: string;
    cockpitKey: CockpitKey | null;
    node: ReactNode;
  }>;
  browseFallback: ReactNode;
}
```

Required behavior:

- initialize from `parseDiscoverySearchParams(useSearchParams(), market, items)`;
- search changes use a 300 ms debounce and `router.replace()`;
- facet changes use `router.push()`;
- call `projectDiscoveryItems()` and `sortHubProjections()`;
- map each projection to its opaque node by `itemId + cockpitKey`;
- degrade a missing dossier node to the item's review node, or remove it when no review exists;
- keep a permanently mounted `<p aria-live="polite" aria-atomic="true">`;
- reset clears every known filter.

- [ ] **Step 6: Run pure tests and type checking**

```bash
npx vitest run __tests__/unit/research-catalog-shell-logic.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit the interactive hub**

```bash
git add components/research/FilterChips.tsx components/research/ResearchHub.tsx components/research/ResearchHubPage.tsx lib/research/catalog-shell-logic.ts __tests__/unit/research-catalog-shell-logic.test.ts
git commit -m "feat(research): add universal hub filtering"
```

### Task 5: Restore-safe multi-topic shortlist UI

**Files:**

- Modify: `components/research/ResearchHub.tsx`
- Create: `components/research/ResearchShortlist.tsx`
- Create: `__tests__/unit/research-shortlist-ui-state.test.ts`
- Modify: `e2e/research-shell.spec.ts`

**Interfaces:**

- Consumes: PR 1 storage helpers, selected projection context, session storage.
- Produces: `useScopedResearchShortlist()`, cross-topic switch dialog, fixed shortlist bar, and validated Cockpit handoff.

- [ ] **Step 1: Write failing restore-order unit tests**

Extract a reducer/state initializer that can be tested without the DOM:

```ts
it("never persists before restore completes", () => {
  const state = initialShortlistState();
  expect(shortlistPersistCommand(state)).toBeNull();
});

it("persists only after hasRestored becomes true", () => {
  const state = shortlistReducer(initialShortlistState(), {
    type: "restored",
    value: {
      cockpitKey: "us/trading/trading-platforms",
      slugs: ["fidelity"],
    },
  });
  expect(shortlistPersistCommand(state)).toEqual({
    cockpitKey: "us/trading/trading-platforms",
    slugs: ["fidelity"],
  });
});
```

Export the reducer seam from `ResearchShortlist.tsx`:

```ts
export const initialShortlistState = (): ResearchShortlistState => ({
  hasRestored: false,
  cockpitKey: null,
  slugs: [],
  pendingSwitch: null,
});

export type ResearchShortlistAction =
  | { type: "restored"; value: ScopedShortlist }
  | { type: "set"; value: ScopedShortlist }
  | { type: "request-switch"; cockpitKey: CockpitKey; slug: string }
  | { type: "cancel-switch" }
  | { type: "confirm-switch" }
  | { type: "clear" };

export function shortlistReducer(
  state: ResearchShortlistState,
  action: ResearchShortlistAction,
): ResearchShortlistState;

export function shortlistPersistCommand(
  state: ResearchShortlistState,
): ScopedShortlist | null {
  return state.hasRestored
    ? { cockpitKey: state.cockpitKey, slugs: state.slugs }
    : null;
}
```

- [ ] **Step 2: Run and confirm the UI state module is absent**

```bash
npx vitest run __tests__/unit/research-shortlist-ui-state.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement explicit restore state**

```ts
interface ResearchShortlistState {
  hasRestored: boolean;
  cockpitKey: CockpitKey | null;
  slugs: string[];
  pendingSwitch: { cockpitKey: CockpitKey; slug: string } | null;
}
```

On mount:

1. call `migrateLegacyTradingShortlist(sessionStorage)`;
2. restore against the page's `Map<CockpitKey, ReadonlySet<string>>`;
3. dispatch one `restored` action;
4. let the persist effect return immediately while `hasRestored === false`.

When adding from another Cockpit key, set `pendingSwitch` and render a dialog with:

```text
Shortlists compare within one research topic.
Cancel
Switch & add
```

Confirming deletes the previous scoped entry and pointer, stores only the new slug, then emits a clear event for the old scope and an add event for the new scope.

- [ ] **Step 4: Preserve body padding cleanup**

Use:

```ts
useEffect(() => {
  if (!visible) {
    document.body.style.paddingBottom = "";
    return;
  }
  document.body.style.paddingBottom = `${barHeight}px`;
  return () => {
    document.body.style.paddingBottom = "";
  };
}, [barHeight, visible]);
```

- [ ] **Step 5: Add reload, Back, collision, and switch E2E**

Extend `e2e/research-shell.spec.ts` with JavaScript enabled and these exact
browser assertions:

| Case          | Action                                         | Required assertion                             |
| ------------- | ---------------------------------------------- | ---------------------------------------------- |
| reload        | add two Trading products and reload            | two pressed toggles and v2 Trading key remains |
| Back          | hand off to Cockpit and navigate Back          | original two slugs restored                    |
| key collision | preseed both `companies` category keys         | restoring one leaves the other untouched       |
| scope switch  | add from another Cockpit key                   | dialog blocks mutation until “Switch & add”    |
| fixed bar     | fill shortlist and scroll disclosure into view | disclosure bottom is above bar top             |

Each test reads the exact v2 storage key through `page.evaluate()`.

- [ ] **Step 6: Run shortlist tests**

```bash
npx vitest run __tests__/unit/research-shortlist-ui-state.test.ts __tests__/unit/research-catalog-shell-logic.test.ts
BASE_URL=http://127.0.0.1:3012 npx playwright test e2e/research-shell.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit shortlist UI**

```bash
git add components/research/ResearchHub.tsx components/research/ResearchShortlist.tsx __tests__/unit/research-shortlist-ui-state.test.ts e2e/research-shell.spec.ts
git commit -m "feat(research): add scoped shortlist experience"
```

### Task 6: Additive hub analytics contract

**Files:**

- Modify: `docs/research-library/analytics-research-v1.md`
- Modify: `lib/analytics/research-events.ts`
- Modify: `lib/analytics/research-tracking.ts`
- Modify: `lib/validation/index.ts`
- Modify: `__tests__/unit/research-events.test.ts`
- Modify: `__tests__/unit/research-tracking.test.ts`
- Modify: `__tests__/unit/track-route-research-batch.test.ts`
- Modify: `components/research/ResearchHub.tsx`

**Interfaces:**

- Consumes: existing six `research_v1` events and transport.
- Produces: optional `surface`, `kind`, `category`, item dimension overrides, and hub-wide `topic: 'hub'`.

- [ ] **Step 1: Add failing strict-contract tests**

```ts
it("uses hub context for global events", () => {
  const event = buildResearchEventData("research_search", HUB_CTX, {
    surface: "hub",
    queryLength: 4,
    resultCount: 2,
  });
  expect(event.properties.topic).toBe("hub");
  expect(event.properties.surface).toBe("hub");
});

it("overrides topic and category for an item event", () => {
  const event = buildResearchEventData(
    "research_review_click",
    HUB_CTX,
    { productSlug: "fidelity", kind: "dossier" },
    { topic: "trading-platforms", category: "trading" },
  );
  expect(event.properties.topic).toBe("trading-platforms");
  expect(event.properties.category).toBe("trading");
});
```

Also add a route test proving an unknown property still returns 400.

- [ ] **Step 2: Run analytics unit tests and confirm type/schema failures**

```bash
npx vitest run \
  __tests__/unit/research-events.test.ts \
  __tests__/unit/research-tracking.test.ts \
  __tests__/unit/track-route-research-batch.test.ts
```

Expected: FAIL until types, builder, tracker, and strict Zod schema agree.

- [ ] **Step 3: Extend all three contract layers together**

Add:

```ts
surface?: 'hub' | 'finder';
kind?: 'review' | 'dossier';
trigger?: 'view_all' | 'dossier_item';
category?: Category;
```

Change the builder signature:

```ts
export interface ResearchItemDimensions {
  topic: string;
  category: Category;
}

export interface ResearchTrackOptions extends Partial<ResearchItemDimensions> {
  surface?: "hub" | "finder";
  kind?: "review" | "dossier";
  trigger?: "view_all" | "dossier_item";
}

export function buildResearchEventData(
  name: ResearchEventName,
  ctx: ResearchContext,
  props?: Omit<
    Partial<ResearchV1Properties>,
    "schemaVersion" | "market" | "topic"
  >,
  dimensions?: Partial<ResearchItemDimensions>,
): ResearchEventData;
```

`topicOverride` is not serialized. Apply `dimensions.topic` and `dimensions.category` only while constructing `properties`.

Update `ResearchTracker` methods without breaking existing call sites:

```ts
trackSearch(
  queryLength: number,
  resultCount: number,
  options?: ResearchTrackOptions,
): void;
trackFilterChange(
  facet: ResearchFacet,
  value: string | null,
  active: boolean,
  resultCount: number,
  options?: ResearchTrackOptions,
): void;
trackEvidenceOpen(
  productSlug: string,
  status: ResearchProductStatus,
  dataPoints: number,
  options?: ResearchTrackOptions,
): void;
trackReviewClick(
  productSlug: string,
  status: ResearchProductStatus,
  rank: number | null,
  position: number,
  options?: ResearchTrackOptions,
): void;
trackShortlistChange(
  action: ShortlistAction,
  productSlug: string | null,
  count: number,
  options?: ResearchTrackOptions,
): void;
trackCockpitHandoff(
  productSlugs: string[],
  options?: ResearchTrackOptions,
): void;
```

The tracker removes `topic` and `category` from the serialized props object,
passes them as builder dimensions, and forwards `surface`, `kind`, and
`trigger` as optional properties. Global hub calls bind `topic: 'hub'`.

- [ ] **Step 4: Update analytics documentation before the UI call sites**

Document:

- global hub events use `topic: 'hub'`;
- item events use selected projection topic and category;
- raw search remains forbidden;
- finder fields exist but the `research_finder_cta` event name is introduced in PR 3.

- [ ] **Step 5: Wire hub events**

The hub emits:

- settled search with `surface: 'hub'`;
- filter change with active facet and `surface: 'hub'`;
- item review/evidence/shortlist/handoff with `kind`, actual topic, and actual category.

Navigation events remain immediate and fail-soft.

- [ ] **Step 6: Run analytics regressions**

```bash
npx vitest run \
  __tests__/unit/research-events.test.ts \
  __tests__/unit/research-tracking.test.ts \
  __tests__/unit/track-route-research-batch.test.ts \
  __tests__/unit/track-route-tool-batch.test.ts \
  __tests__/unit/cockpit-events.test.ts
```

Expected: PASS; tool and cockpit contracts are unchanged.

- [ ] **Step 7: Commit hub analytics**

```bash
git add docs/research-library/analytics-research-v1.md lib/analytics/research-events.ts lib/analytics/research-tracking.ts lib/validation/index.ts __tests__/unit/research-events.test.ts __tests__/unit/research-tracking.test.ts __tests__/unit/track-route-research-batch.test.ts components/research/ResearchHub.tsx
git commit -m "feat(research): extend hub analytics dimensions"
```

### Task 7: Header, switcher, redirect, robots headers, and sitemap

**Files:**

- Modify: `components/marketing/header.tsx`
- Modify: `proxy.ts`
- Modify: `next.config.ts`
- Modify: `app/sitemap.ts`
- Create: `__tests__/unit/research-routing.test.ts`
- Create: `e2e/research-hub-markets.spec.ts`

**Interfaces:**

- Consumes: `researchBaseForMarket()` and normalized MDX dates.
- Produces: top-level Research navigation, Research-aware market switching, filter noindex headers, redirect, and four sitemap entries.

- [ ] **Step 1: Write failing route matrix tests**

```ts
describe.each(["us", "uk", "ca", "au"] as const)(
  "Research switch from %s",
  (from) => {
    it.each(["us", "uk", "ca", "au"] as const)(
      "targets %s canonical route",
      (to) => {
        const current = from === "us" ? "/research" : `/${from}/research`;
        const target = to === "us" ? "/research" : `/${to}/research`;
        expect(researchBaseForMarket(from)).toBe(current);
        expect(researchBaseForMarket(to)).toBe(target);
      },
    );
  },
);
```

Add sitemap assertions for exact URLs and MDX-derived dates.

- [ ] **Step 2: Run and confirm missing route helper/tests fail**

```bash
npx vitest run __tests__/unit/research-routing.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Update header and market switcher**

Add a desktop top-level link beside the nav groups:

```tsx
<Link
  href={researchBaseForMarket(market)}
  className="rounded-lg px-4 py-2 text-[13px] font-medium text-white/85 hover:bg-white/10"
>
  Research
</Link>
```

Add the same destination to the mobile sheet. Remove the US-only Trading panel Research block.

When `pathname` equals any Research base, market choices use `researchBaseForMarket(target)`; other routes keep existing behavior.

- [ ] **Step 4: Add redirect and query-specific headers**

Add:

```ts
{
  source: '/us/research',
  destination: '/research',
  permanent: true,
}
```

For each key in:

```ts
const researchFilterKeys = [
  "q",
  "category",
  "type",
  "status",
  "confidence",
  "fresh",
  "topic",
  "spec",
] as const;
```

Create one header rule for `/research` and one for `/:market(uk|ca|au)/research` using `has: [{ type: 'query', key }]`, setting:

```ts
{ key: 'X-Robots-Tag', value: 'noindex, follow' }
```

Add `/research` to `PROTECTED_PREFIXES` while preserving its sort-order invariant.

- [ ] **Step 5: Add market sitemap entries with real MDX dates**

Derive each Research last-modified value from the already loaded `allContent`, considering only that market's non-index entries and using `modifiedDate || publishDate`. Do not call the Cockpit or Supabase from sitemap generation.

- [ ] **Step 6: Add market E2E**

`e2e/research-hub-markets.spec.ts` uses JavaScript enabled for UI tests and
request context for headers:

| Case                    | Required assertion                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| route matrix            | all four hubs return 200 and self-canonical URLs                                                            |
| document metadata       | one H1 and five-language hreflang map on every hub                                                          |
| editorial origin        | a context-free review reads `Editorial · x/5` and contains no star SVG                                      |
| review-only degradation | when the current catalog reports zero qualified contexts, reviews still render and no audited claim appears |
| robots matrix           | every known filter key returns `X-Robots-Tag: noindex, follow`                                              |
| navigation              | header and every market switch target `researchBaseForMarket()`                                             |

The review-only assertion must derive a market from the current catalog fixture or explicitly skip when that market later gains a qualified context; it must never assert that non-US markets can never have dossiers.

- [ ] **Step 7: Run routing tests**

```bash
npx vitest run __tests__/unit/research-routing.test.ts
npm run build
BASE_URL=http://127.0.0.1:3012 npx playwright test e2e/research-hub-markets.spec.ts
```

Expected: PASS and build output lists all four Research routes as `○`.

- [ ] **Step 8: Commit routing and navigation**

```bash
git add components/marketing/header.tsx proxy.ts next.config.ts app/sitemap.ts __tests__/unit/research-routing.test.ts e2e/research-hub-markets.spec.ts
git commit -m "feat(research): complete market routing and discovery SEO"
```

### Task 8: Raw HTML, accessibility, responsive, and PR 2 release gate

**Files:**

- Create: `scripts/research/export-review-hrefs.mts`
- Create: `e2e/fixtures/research-review-hrefs.json`
- Create: `e2e/research-raw-html.spec.ts`
- Modify: `e2e/research-a11y.spec.ts`
- Modify: `e2e/research-shell.spec.ts`
- Modify: `e2e/research-tracking.spec.ts`
- Create: `audits/reports/research-discovery-pr2.md`

**Interfaces:**

- Consumes: completed hub routes and UI.
- Produces: proof for spec invariants 12–16 and the PR 2 Definition of Done.

- [ ] **Step 1: Add the no-JavaScript raw HTML test**

Do not override the global Playwright JavaScript setting:

```ts
test("raw HTML contains every review href", async ({ request }) => {
  for (const path of [
    "/research",
    "/uk/research",
    "/ca/research",
    "/au/research",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const expectedHrefs = expectedReviewHrefsFor(path);
    for (const href of expectedHrefs) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain(`href="${expectedHrefs[0]}"`);
    expect(html).toContain(
      `href="${expectedHrefs[Math.floor(expectedHrefs.length / 2)]}"`,
    );
    expect(html).toContain(`href="${expectedHrefs.at(-1)}"`);
  }
});
```

Create `scripts/research/export-review-hrefs.mts` using
`getContentByMarketAndCategory()` and `marketCategories`. It writes a sorted
record for `us`, `uk`, `ca`, and `au`, excluding `index` and unrated entries.
Generate and commit `e2e/fixtures/research-review-hrefs.json`; the E2E imports
that fixture. The expected list never comes from browser DOM or the page under
test.

In the E2E file:

```ts
const marketForResearchPath = (path: string): keyof typeof hrefFixture =>
  path === "/research" ? "us" : (path.split("/")[1] as "uk" | "ca" | "au");
const expectedReviewHrefsFor = (path: string): string[] =>
  hrefFixture[marketForResearchPath(path)];
```

- [ ] **Step 2: Expand Axe and responsive checks**

Run Axe on `/uk/research` at 1280 and 390 widths and on a filtered/shortlisted state. Fail only on serious or critical impacts:

```ts
const releaseBlocking = violations.filter(
  (violation) =>
    violation.impact === "serious" || violation.impact === "critical",
);
expect(releaseBlocking).toEqual([]);
```

At 1024, 1100, and 1280 pixels, assert the header link is visible and its bounding box does not overlap the market selector.

- [ ] **Step 3: Verify analytics on the wire**

Update `e2e/research-tracking.spec.ts` to assert:

```ts
expect(properties.surface).toBe("hub");
expect(properties.category).toBe("trading");
expect(properties.topic).toBe("trading-platforms");
```

For global search/filter events, assert `topic === 'hub'` and absence of the raw query.

Add an invariant-13 assertion that reads the default catalog count exposed in
the hero, the sum of category facet counts, the “view all” CTA result count,
and the first analytics search/filter `resultCount` after the same filter.
All four values must equal the projection length returned by the shared shell
logic for that state.

- [ ] **Step 4: Run the focused production E2E suite**

```bash
BASE_URL=http://127.0.0.1:3012 npx playwright test \
  e2e/research-hub-markets.spec.ts \
  e2e/research-raw-html.spec.ts \
  e2e/research-shell.spec.ts \
  e2e/research-tracking.spec.ts \
  e2e/research-a11y.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Run the complete PR gate**

```bash
npx tsc --noEmit
npx vitest run
npm run check:imports
npm run build
```

Expected: every command exits 0 and all four Research routes are `○ Static`.

- [ ] **Step 6: Record the measured release report**

Create `audits/reports/research-discovery-pr2.md` only after measuring the actual base and head builds. Include literal observed values for HTML bytes, route JavaScript bytes, LCP, CLS, raw/visible href counts, catalog counts, test totals, route types, and the final commit hash.

- [ ] **Step 7: Commit the release evidence**

```bash
git add scripts/research/export-review-hrefs.mts e2e/fixtures/research-review-hrefs.json e2e/research-raw-html.spec.ts e2e/research-a11y.spec.ts e2e/research-shell.spec.ts e2e/research-tracking.spec.ts audits/reports/research-discovery-pr2.md
git commit -m "test(research): verify universal hub release gates"
```
