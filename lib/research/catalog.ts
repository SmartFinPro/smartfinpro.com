// lib/research/catalog.ts
// The Unified Research Discovery server catalog builder — the ONLY server
// boundary that joins cached MDX review metadata (lib/mdx) with independently
// loaded Cockpit topic overlays (lib/comparison) into one market-wide
// DiscoveryCatalog (spec §5). `buildDiscoveryCatalog` is a pure assembly
// function: it never does I/O itself, so it is unit-testable with fixtures.
// The two uncached loaders (`loadMarketReviewItems`, `loadMarketResearchContexts`)
// are exported for the same reason — direct, network-free unit coverage of the
// MDX filter and the Promise.allSettled per-topic resilience, mirroring how
// research-adapter.test.ts fixture-tests buildResearchView instead of the
// Supabase-backed lib/research/data.ts wrapper.
//
// `import 'server-only'` guards the whole module: DiscoveryCatalogBundle.
// dossierRows carries the complete ResearchProduct (full Cockpit provenance)
// for every dossier row, and must never reach a client bundle — only
// `bundle.catalog` (the serializable, <200 KB DiscoveryCatalog) crosses the
// RSC/client boundary.

import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Market } from '@/lib/i18n/config';
import { marketCategories, categoryConfig } from '@/lib/i18n/config';
import { getContentByMarketAndCategory } from '@/lib/mdx';
import { BEST_X_MANIFEST, type BestXManifestEntry } from '@/lib/comparison/topics/manifest';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import { getCockpitData } from '@/lib/comparison/loader';
import { buildResearchView, type ResearchProduct } from '@/lib/research/adapter';
import { logger } from '@/lib/logging';
import {
  cockpitKeyFor,
  countDiscoveryItems,
  productItemId,
  projectionNodeKey,
  reviewItemId,
  sortResearchContexts,
  type CockpitKey,
  type DiscoveryCounts,
  type DiscoveryDisplay,
  type DiscoveryItem,
  type DiscoveryReview,
  type ResearchContext,
} from '@/lib/research/catalog-shell-logic';

export interface DiscoveryCatalog {
  market: Market;
  items: DiscoveryItem[];
  counts: DiscoveryCounts;
}

/** Server-only render sidecar: one row per (item, Cockpit topic) dossier
 *  context, carrying the FULL ResearchProduct the existing ResearchCard
 *  evidence/provenance UI needs. Never sent to a client component — only
 *  `DiscoveryCatalogBundle.catalog` crosses the RSC/client boundary. */
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

/** One already-qualified (audited/provisional) Cockpit row, normalized to its
 *  ResearchContext, still carrying the manifest entry (needed for the review
 *  join key) and the full ResearchProduct (needed only by dossierRows). Not
 *  exported — an internal shape between the two loaders and the join below. */
interface NormalizedOverlayRow {
  entry: BestXManifestEntry;
  context: ResearchContext;
  researchProduct: ResearchProduct;
  reviewSlug: string | null;
}

// ── Shared display computation (spec §4.3, §4.4) ────────────────────────────
// Used both by loadMarketReviewItems (contexts always [] at that stage) and by
// buildDiscoveryCatalog's finalize pass (contexts known after the join) — one
// implementation, so a review's title/description/date never drifts between
// the two call sites.

const newestVerifiedAt = (contexts: readonly ResearchContext[]): string | null => {
  let newest: string | null = null;
  for (const context of contexts) {
    if (context.dataVerifiedAt && (newest === null || context.dataVerifiedAt > newest)) {
      newest = context.dataVerifiedAt;
    }
  }
  return newest;
};

/** searchText per spec §4.4 — built once, raw (case-folding happens later, at
 *  match time, via catalog-shell-logic's private `normalize()`). Never sent to
 *  analytics. */
const buildSearchText = (
  item: Pick<DiscoveryItem, 'category' | 'review'>,
  contexts: readonly ResearchContext[],
  title: string,
  bestFor: string | null,
): string => {
  const parts: string[] = [title];
  if (item.review) {
    parts.push(item.review.title, item.review.description, item.review.slug.replace(/-/g, ' '));
  }
  if (bestFor) parts.push(bestFor);
  for (const context of contexts) {
    parts.push(context.displayName);
    if (context.tagline) parts.push(context.tagline);
    parts.push(context.topicLabel, context.productSlug.replace(/-/g, ' '));
  }
  parts.push(categoryConfig[item.category]?.name ?? item.category);
  return parts.filter((part) => part.trim().length > 0).join(' ');
};

/** Computes the final display fields for one item given its (already sorted)
 *  research contexts. Review-backed items take title/description/rating/date/
 *  featured/pricing exclusively from MDX (spec §4.3); `bestFor` also prefers
 *  the review's own MDX value and only falls back to the first qualified
 *  context when the review has none. Cockpit-only items take
 *  title/description/sortDate/bestFor from the first (manifest-order)
 *  context. No invented date, rating, or description text. */
function computeDisplay(item: DiscoveryItem, sortedContexts: readonly ResearchContext[]): DiscoveryDisplay {
  const first = sortedContexts[0] ?? null;

  if (item.review) {
    const title = item.review.title;
    const description = item.review.description;
    const sortDate = item.review.modifiedDate || item.review.publishDate || null;
    const bestFor = item.review?.bestFor ?? first?.bestFor ?? null;
    return {
      title,
      description,
      bestFor,
      searchText: buildSearchText(item, sortedContexts, title, bestFor),
      sortDate,
    };
  }

  // Cockpit-only (a DiscoveryItem without a review is only ever created once
  // at least one qualified context attaches, so `first` is never null here).
  const bestFor = first?.bestFor ?? null;
  const title = first?.displayName ?? '';
  const description = first?.tagline || first?.bestFor || first?.topicLabel || '';
  return {
    title,
    description,
    bestFor,
    searchText: buildSearchText(item, sortedContexts, title, bestFor),
    sortDate: newestVerifiedAt(sortedContexts),
  };
}

// ── Step 1: uncached MDX loader (wrapped by getCachedReviewItems below) ─────

/** Loads every rated review across the market's categories, in parallel, and
 *  maps each to a baseline DiscoveryItem (spec §5.1): `slug !== 'index'` and a
 *  numeric editorial rating are the only inclusion gates; the MDX body is
 *  dropped before this ever reaches a cache. `researchContexts` is always []
 *  here — buildDiscoveryCatalog attaches the overlay afterwards.
 *
 *  @internal — test seam only; production callers must use
 *  getDiscoveryCatalog / getDiscoveryCatalogBundle. */
export async function loadMarketReviewItems(market: Market): Promise<DiscoveryItem[]> {
  const categories = marketCategories[market];
  const categoryResults = await Promise.all(
    categories.map((category) => getContentByMarketAndCategory(market, category)),
  );

  const items: DiscoveryItem[] = [];
  for (let categoryIndex = 0; categoryIndex < categoryResults.length; categoryIndex += 1) {
    // The directory category this batch was fetched under — NOT
    // contentItem.meta.category, which is frontmatter and can drift from
    // where the file actually lives. getContentBySlug resolves by
    // directory, so trusting frontmatter here would both collide this
    // item's id with a same-slug item in its true category and emit an
    // href that 404s.
    const category = categories[categoryIndex];
    const contentItems = categoryResults[categoryIndex];
    for (const contentItem of contentItems) {
      if (contentItem.slug === 'index') continue;
      if (typeof contentItem.meta.rating !== 'number') continue;

      const href = `/${market}/${category}/${contentItem.slug}`;
      const review: DiscoveryReview = {
        slug: contentItem.slug,
        href,
        title: contentItem.meta.seoTitle || contentItem.meta.title,
        description: contentItem.meta.description,
        bestFor:
          typeof contentItem.meta.bestFor === 'string' && contentItem.meta.bestFor.trim()
            ? contentItem.meta.bestFor.trim()
            : null,
        editorialRating: contentItem.meta.rating,
        publishDate: contentItem.meta.publishDate,
        modifiedDate: contentItem.meta.modifiedDate,
        readingWords: contentItem.readingTime.words,
        featured: contentItem.meta.featured === true,
        pricing: contentItem.meta.pricing ?? null,
      };

      const item: DiscoveryItem = {
        id: reviewItemId(href),
        market,
        category,
        review,
        display: { title: '', description: '', bestFor: null, searchText: '', sortDate: null },
        researchContexts: [],
      };
      item.display = computeDisplay(item, []);
      items.push(item);
    }
  }

  return items;
}

// ── Step 2: uncached overlay loader (wrapped by getCachedResearchContexts) ──

/** Loads one manifest topic's Cockpit rows and normalizes only the qualified
 *  (audited/provisional) ones into NormalizedOverlayRow — unavailable rows are
 *  dropped here and never create a DiscoveryItem (spec §4.2). Can reject (a
 *  bad getCockpitData/getTopicConfig call); the caller below settles it. */
async function loadTopicOverlayRows(
  market: Market,
  entry: BestXManifestEntry,
  manifestOrder: number,
): Promise<NormalizedOverlayRow[]> {
  const config = getTopicConfig(entry.category, entry.topic, entry.market);
  if (!config) return [];

  const products = await getCockpitData(entry.market, entry.category, entry.topic);
  const requiredFieldKeys = config.specColumns.map((column) => column.key);
  const rows = buildResearchView(products, requiredFieldKeys);

  const qualified = rows.filter(
    (row) => row.research.status === 'audited' || row.research.status === 'provisional',
  );

  return qualified.map((row) => {
    const audited = row.research.status === 'audited';
    const keyFacts = Object.fromEntries(
      config.specColumns.map((column) => {
        const raw = column.accessor(row.product);
        return [column.key, column.format(raw)];
      }),
    );
    const context: ResearchContext = {
      cockpitKey: cockpitKeyFor(market, entry.category, entry.topic),
      topic: entry.topic,
      topicLabel: entry.label,
      manifestOrder,
      productSlug: row.product.slug,
      displayName: row.product.displayName,
      tagline: row.product.tagline || null,
      bestFor: row.product.bestFor || null,
      status: audited ? 'audited' : 'provisional',
      confidence: audited ? row.research.confidence : null,
      dataVerifiedAt: row.research.dataVerifiedAt,
      auditedScore: audited ? row.displayScore : null,
      auditedRank: audited ? row.rank : null,
      dataPoints: Object.keys(row.research.fieldSources).length,
      compareBaseHref: `/${market}/${entry.category}/best/${entry.topic}`,
      keyFacts,
    };
    return {
      entry,
      context,
      researchProduct: row,
      reviewSlug: row.product.reviewSlug ?? null,
    };
  });
}

/** Loads every manifest topic for `market` via Promise.allSettled (spec §5.2):
 *  a rejected topic logs exactly one structured warning (market, category,
 *  topic, error type) and is simply absent from the result — every other
 *  topic's rows, and all reviews (loaded independently), are unaffected. Never
 *  logs raw row contents or user data.
 *
 *  @internal — test seam only; production callers must use
 *  getDiscoveryCatalog / getDiscoveryCatalogBundle. */
export async function loadMarketResearchContexts(market: Market): Promise<NormalizedOverlayRow[]> {
  const entries = BEST_X_MANIFEST.map((entry, manifestOrder) => ({ entry, manifestOrder })).filter(
    ({ entry }) => entry.market === market,
  );

  const settled = await Promise.allSettled(
    entries.map(({ entry, manifestOrder }) => loadTopicOverlayRows(market, entry, manifestOrder)),
  );

  const rows: NormalizedOverlayRow[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      rows.push(...result.value);
      return;
    }
    const { entry } = entries[index];
    logger.warn('Research discovery topic unavailable', {
      market,
      category: entry.category,
      topic: entry.topic,
      errorType: result.reason instanceof Error ? result.reason.name : typeof result.reason,
    });
  });

  return rows;
}

// ── Step 3: pure assembly — join reviews with the overlay (spec §5.2, §4) ───

/** Pure — no I/O. Joins `reviews` with `overlay` into the final catalog:
 *  - `category + reviewSlug` matches an overlay row to its review (spec §5.2);
 *  - an unmatched qualified row becomes/merges into a Cockpit-only item keyed
 *    by `productItemId` — the same product across topics stays ONE item with
 *    multiple contexts (spec §4.1);
 *  - a repeated row for one Cockpit key is deduped to a single context;
 *  - every item's contexts are sorted (manifest order, then audited rank, then
 *    productSlug) and its display fields are (re)computed once contexts are
 *    final, so searchText always reflects every attached context. */
export function buildDiscoveryCatalog(
  market: Market,
  reviews: readonly DiscoveryItem[],
  overlay: readonly NormalizedOverlayRow[],
): DiscoveryCatalogBundle {
  // Shallow-clone every item (and its own researchContexts array) so this
  // pure function never mutates the caller's (possibly cached) inputs.
  const items: DiscoveryItem[] = reviews.map((item) => ({ ...item, researchContexts: [...item.researchContexts] }));
  // Built as an explicit loop (not `new Map(items.map(...))`) so a duplicate
  // review id is a hard failure (spec §4.1: "Eine Kollision ist ein
  // Testfehler, kein Last-write-wins-Fall") instead of the Map constructor
  // silently keeping only the last-seen item.
  const itemsById = new Map<string, DiscoveryItem>();
  for (const item of items) {
    if (itemsById.has(item.id)) {
      throw new Error(`Duplicate discovery item id: ${item.id}`);
    }
    itemsById.set(item.id, item);
  }

  const reviewJoinIndex = new Map<string, DiscoveryItem>();
  for (const item of items) {
    if (item.review) reviewJoinIndex.set(`${item.category}:${item.review.slug}`, item);
  }

  const dossierRows: DiscoveryDossierRenderRow[] = [];
  const seenNodeKeys = new Set<string>();

  for (const row of overlay) {
    const { entry, context, researchProduct, reviewSlug } = row;

    let item = reviewSlug ? reviewJoinIndex.get(`${entry.category}:${reviewSlug}`) : undefined;

    if (!item) {
      const id = productItemId(market, entry.category, context.productSlug);
      const existing = itemsById.get(id);
      if (existing) {
        item = existing;
      } else {
        item = {
          id,
          market,
          category: entry.category,
          review: null,
          display: { title: '', description: '', bestFor: null, searchText: '', sortDate: null },
          researchContexts: [],
        };
        itemsById.set(id, item);
        items.push(item);
      }
    }

    const nodeKey = projectionNodeKey(item.id, context.cockpitKey);
    if (seenNodeKeys.has(nodeKey)) continue; // duplicate row for one Cockpit key
    seenNodeKeys.add(nodeKey);

    item.researchContexts.push(context);
    dossierRows.push({ key: nodeKey, itemId: item.id, cockpitKey: context.cockpitKey, researchProduct });
  }

  for (const item of items) {
    const sorted = sortResearchContexts(item.researchContexts);
    item.researchContexts = sorted;
    item.display = computeDisplay(item, sorted);
  }

  const counts = countDiscoveryItems(items);
  return { catalog: { market, items, counts }, dossierRows };
}

// ── Step 4: independent caches (spec §5.3) + public entry points ───────────
// Kept as two separate unstable_cache wrappers so MDX (fast-moving editorial
// content) and the Cockpit overlay (slower-moving, DB-backed) use their own
// required lifetimes; the market is a cache argument on both. Precedents:
// getMarketReviews (app/(marketing)/[market]/page.tsx) and
// cachedResolveDecisionBridgeData (lib/comparison/bridge.ts).

const getCachedReviewItems = unstable_cache(
  loadMarketReviewItems,
  ['research-discovery-reviews'],
  { revalidate: 300, tags: ['market-reviews', 'research-catalog'] },
);

const getCachedResearchContexts = unstable_cache(
  loadMarketResearchContexts,
  ['research-discovery-contexts'],
  { revalidate: 3600, tags: ['research-catalog'] },
);

/** Resolves the cached Cockpit overlay for `market`, failing soft: a throw
 *  from the cache LAYER itself — `unstable_cache`, or the logger it might
 *  call — is caught, logged exactly once with a structured payload, and
 *  turned into an empty overlay so the Hub still renders its full review
 *  catalog (spec §13: HTTP 200 even when Cockpit data is unreachable). This
 *  is distinct from loadMarketResearchContexts's own per-TOPIC resilience
 *  (Promise.allSettled) above, which already isolates one bad manifest entry
 *  from the rest — this seam guards the layer wrapping ALL of them together.
 *  `load` defaults to the real cached loader and exists purely so tests can
 *  inject a rejecting stub without mocking next/cache.
 *
 *  @internal — test seam only; production callers must use
 *  getDiscoveryCatalog / getDiscoveryCatalogBundle. */
export async function resolveOverlayContexts(
  market: Market,
  load: (market: Market) => Promise<NormalizedOverlayRow[]> = getCachedResearchContexts,
): Promise<NormalizedOverlayRow[]> {
  try {
    return await load(market);
  } catch (error) {
    logger.warn('Research discovery overlay cache unavailable', {
      market,
      scope: 'research-catalog-overlay-cache',
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return [];
  }
}

/** The serializable, <200 KB public catalog for one market (spec §5.3). */
export async function getDiscoveryCatalog(market: Market): Promise<DiscoveryCatalog> {
  return (await getDiscoveryCatalogBundle(market)).catalog;
}

/** Full bundle for server rendering: `catalog` may cross the RSC/client
 *  boundary; `dossierRows` (full ResearchProduct per dossier) never does.
 *  Overlay resolution goes through resolveOverlayContexts so a cache-layer
 *  failure is logged once and degrades to a reviews-only catalog instead of
 *  failing silently. */
export async function getDiscoveryCatalogBundle(market: Market): Promise<DiscoveryCatalogBundle> {
  const [reviews, overlay] = await Promise.all([
    getCachedReviewItems(market),
    resolveOverlayContexts(market),
  ]);
  return buildDiscoveryCatalog(market, reviews, overlay);
}
