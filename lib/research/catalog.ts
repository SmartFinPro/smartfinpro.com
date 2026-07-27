// lib/research/catalog.ts
// The Unified Research Discovery server catalog builder — the ONLY server
// boundary that joins cached MDX review metadata (lib/mdx) with independently
// loaded Cockpit topic overlays (lib/comparison) into one market-wide
// DiscoveryCatalog (spec §5). `buildDiscoveryCatalog` is a pure assembly
// function: it never does I/O itself, so it is unit-testable with fixtures.
// The uncached loaders (`loadMarketReviewItems`, `loadOneTopicOverlay`) are
// exported for the same reason — direct, network-free unit coverage of the
// MDX filter and the per-topic overlay contract, mirroring how
// research-adapter.test.ts fixture-tests buildResearchView instead of the
// Supabase-backed lib/research/data.ts wrapper.
//
// Per-topic cache + 60s failure backoff (spec §5.3.1, amendment 2026-07-27):
// the overlay cache moved from one entry per MARKET to one entry per TOPIC
// (`loadOneTopicOverlay`, wrapped by `getCachedTopicOverlay`) so one bad
// manifest entry can no longer hold the whole market's overlay hostage for
// the full 3600s revalidate window. Every per-topic load now resolves to a
// discriminated `TopicOverlayResult` (`loadMarketResearchContexts` returns
// the array of these, NOT a flattened list) instead of collapsing "loaded
// fine, zero qualifying rows" and "failed to load" into the same `[]` — that
// collapse is exactly the distinction the three-tier `ShortlistScopeSnapshot`
// (catalog-shell-logic.ts, §11.2.1) depends on to avoid destructively
// clearing a shortlist it simply couldn't verify. Because `unstable_cache`
// only ever caches a resolved value — never a thrown error — a real
// **transient** failure must REJECT out of the cached function so it isn't
// cached for the full 3600s success TTL; the independent 60s backoff for that
// case lives in `loadMarketResearchContexts`, keyed by an injectable clock so
// tests can fast-forward the window deterministically. `flattenQualifiedOverlayRows`
// is the thin back-compat helper that keeps `buildDiscoveryCatalog` and every
// other pre-Decision-A consumer of the flat `NormalizedOverlayRow[]` shape
// working unchanged.
//
// `import 'server-only'` guards the whole module: DiscoveryCatalogBundle.
// dossierRows carries the complete ResearchProduct (full Cockpit provenance)
// for every dossier row, and must never reach a client bundle — only
// `bundle.catalog` and `bundle.scopeSnapshot` (both serializable, <200 KB)
// cross the RSC/client boundary.
//
// ONE FAN-OUT, ONE SOURCE (operator merge-blocker fix, 2026-07-27, spec
// §11.2.1): `resolveMarketResearchOverlay` is the ONE place that calls
// `loadMarketResearchContexts` per request — it derives BOTH the flattened
// `NormalizedOverlayRow[]` `buildDiscoveryCatalog` joins against AND the
// serializable `ShortlistScopeSnapshotDTO` (`buildDiscoveryScopeSnapshot`)
// from the SAME typed `TopicOverlayResult[]` array. This closes a third
// occurrence of the same defect class the per-topic `TopicOverlayResult`
// contract above already fixed once: `getDiscoveryCatalogBundle` used to
// return only the flattened, already-qualified `DiscoveryItem[]`, and the
// CLIENT re-derived its own shortlist scope snapshot from that flattened
// shape — which, exactly like the old market-wide overlay cache, could not
// tell "this topic loaded fine with zero rows" apart from "this topic's
// load failed/backed off". The fix is the same shape both times: keep the
// typed, discriminated result alive across the boundary instead of
// re-flattening it one level up.

import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Market } from '@/lib/i18n/config';
import { marketCategories, categoryConfig } from '@/lib/i18n/config';
import { getContentByMarketAndCategory } from '@/lib/mdx';
import { BEST_X_MANIFEST, type BestXManifestEntry } from '@/lib/comparison/topics/manifest';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import type { TopicConfig } from '@/lib/comparison/topics/types';
import { getCockpitData } from '@/lib/comparison/loader';
import { buildResearchView, type ResearchProduct } from '@/lib/research/adapter';
import { logger } from '@/lib/logging';
import {
  buildShortlistScopeSnapshotDTO,
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
  type ShortlistScopeSnapshotDTO,
  type TopicScopeResult,
  type UnavailableScopeReason,
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

/** `buildDiscoveryCatalog`'s own return shape — the pure join/merge/display
 *  step (spec §5.2, §4) has no notion of a shortlist scope snapshot, so it is
 *  kept separate from (and extended by) `DiscoveryCatalogBundle` below rather
 *  than forcing every one of this function's many existing callers/fixtures
 *  to also fabricate a `scopeSnapshot`. Only `getDiscoveryCatalogBundle`
 *  actually adds one, from the same `resolveMarketResearchOverlay` load its
 *  `overlay` rows already came from. */
export interface DiscoveryCatalogJoin {
  catalog: DiscoveryCatalog;
  dossierRows: DiscoveryDossierRenderRow[];
}

export interface DiscoveryCatalogBundle extends DiscoveryCatalogJoin {
  /** Serializable — safe to cross the RSC/client boundary (spec §11.2.1,
   *  operator ONE-FAN-OUT fix 2026-07-27). Built from the EXACT SAME
   *  `TopicOverlayResult[]` load `catalog`/`dossierRows` are built from (see
   *  `resolveMarketResearchOverlay` below) — never a second loader call, and
   *  never re-derived client-side from `catalog.items` (that re-derivation,
   *  fixed here, is what silently disabled shortlist Rule 4's cleanup: the
   *  client cannot tell "this topic loaded fine with zero rows" apart from
   *  "this topic's load failed/backed off" once both have collapsed into the
   *  same zero-context observation on `DiscoveryItem[]`). */
  scopeSnapshot: ShortlistScopeSnapshotDTO;
}

/** One already-qualified (audited/provisional) Cockpit row, normalized to its
 *  ResearchContext, still carrying the manifest entry (needed for the review
 *  join key) and the full ResearchProduct (needed only by dossierRows).
 *  Exported only because it appears in `TopicOverlaySuccess.rows` — the join
 *  below is still the only real consumer. */
export interface NormalizedOverlayRow {
  entry: BestXManifestEntry;
  context: ResearchContext;
  researchProduct: ResearchProduct;
  reviewSlug: string | null;
}

// ── Typed per-topic overlay result (spec §5.3.1) ────────────────────────────
// Replaces the old contract where a topic that loaded fine with zero
// qualifying rows and a topic that failed to load both surfaced as the same
// `[]` — a collapse the three-tier ShortlistScopeSnapshot (catalog-shell-logic
// §11.2.1) cannot tolerate, since it needs to tell "verified empty" apart from
// "currently unverifiable" to avoid destructively clearing a stored shortlist
// it simply couldn't check. `TopicOverlayFailureReason` is deliberately a
// subset of catalog-shell-logic's `UnavailableScopeReason` (excluding
// `unknown_state`, which only ever describes an inconsistent SNAPSHOT built
// downstream — the loader itself always knows exactly why a topic failed).

/** Every reason this loader itself can assign to a failed/unavailable topic.
 *  `unknown_state` is intentionally excluded — see catalog-shell-logic.ts. */
export type TopicOverlayFailureReason = Exclude<UnavailableScopeReason, 'unknown_state'>;

export interface TopicOverlaySuccess {
  ok: true;
  entry: BestXManifestEntry;
  /** Convenience projection of `rows.map(row => row.context)` — same order. */
  contexts: ResearchContext[];
  rows: NormalizedOverlayRow[];
}

export interface TopicOverlayFailure {
  ok: false;
  entry: BestXManifestEntry;
  reason: TopicOverlayFailureReason;
}

export type TopicOverlayResult = TopicOverlaySuccess | TopicOverlayFailure;

/** The shape `loadMarketResearchContexts` calls per manifest topic — the real
 *  default is the per-topic-cached `getCachedTopicOverlay`; tests inject the
 *  uncached `loadOneTopicOverlay` (bypassing unstable_cache, which requires a
 *  Next.js request runtime this vitest suite never has) or a bare stub to
 *  drive the backoff Map's timeline deterministically. */
export type TopicOverlayLoader = (
  market: Market,
  entry: BestXManifestEntry,
  manifestOrder: number,
) => Promise<TopicOverlayResult>;

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

// ── Step 2: uncached overlay loader (wrapped by getCachedTopicOverlay) ──────

/** Loads one manifest topic's Cockpit rows and normalizes only the qualified
 *  (audited/provisional) ones into NormalizedOverlayRow — unavailable rows are
 *  dropped here and never create a DiscoveryItem (spec §4.2). Takes an
 *  already-resolved `config` (the caller, `loadOneTopicOverlay`, owns the
 *  getTopicConfig null-check and its distinct `missing_topic_config` outcome)
 *  so THIS function's only failure mode is a genuine getCockpitData rejection
 *  — the caller settles that.
 *
 *  Deliberately manifest-order-free (spec §5.3.1 amendment, Decision A P2
 *  fix): every context's `manifestOrder` is a `0` placeholder, never the real
 *  `BEST_X_MANIFEST` position. This function's result is what
 *  `getCachedTopicOverlay` caches, and a `BEST_X_MANIFEST` array position is
 *  not part of a topic's own Cockpit data — baking it in here would let a
 *  manifest re-ordering serve a stale position from an existing cache entry
 *  for up to the full 3600s TTL. `attachLiveManifestOrder` overwrites this
 *  placeholder with the CURRENT live position after every cache read (hit or
 *  miss), outside the cache boundary entirely. */
async function loadTopicOverlayRows(
  market: Market,
  entry: BestXManifestEntry,
  config: TopicConfig,
): Promise<NormalizedOverlayRow[]> {
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
      // Placeholder — see the manifest-order-free note above. Overwritten by
      // attachLiveManifestOrder() after every cache read, never trusted here.
      manifestOrder: 0,
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

/** Uncached, single-topic overlay load (spec §5.3.1) — the function
 *  `getCachedTopicOverlay` wraps in a per-TOPIC `unstable_cache` entry
 *  (`['research-discovery-contexts', market, category, topic]`, 3600s).
 *  Manifest-order-free (Decision A P2 fix, see loadTopicOverlayRows): does
 *  NOT take a `manifestOrder` parameter, so the cached payload can never bake
 *  in a `BEST_X_MANIFEST` position that could go stale relative to the cache
 *  key. `getCachedTopicOverlay` applies the CURRENT live manifestOrder via
 *  `attachLiveManifestOrder` after every cache read.
 *
 *  Resolves `{ok:false, reason:'missing_topic_config'}` — a normal, CACHEABLE
 *  return — when the manifest entry's TopicConfig doesn't resolve; that is a
 *  static configuration problem, not a transient one, so letting it ride the
 *  same 3600s success TTL as a real load is correct (and still logs once per
 *  cache window, since the log line only runs on cache miss).
 *
 *  REJECTS (never catches) when getCockpitData fails — deliberately. Per
 *  spec §5.3.1, `unstable_cache` can only ever cache a resolved value; if this
 *  function caught the failure and returned an `ok:false` sentinel instead of
 *  throwing, that sentinel would itself get cached for the full 3600s success
 *  TTL, not the 60s a transient failure warrants. The 60s backoff for that
 *  case is therefore handled one layer up, in `loadMarketResearchContexts`,
 *  entirely outside `unstable_cache`.
 *
 *  @internal — test seam; production callers use loadMarketResearchContexts /
 *  getDiscoveryCatalog(Bundle). */
export async function loadOneTopicOverlay(
  market: Market,
  entry: BestXManifestEntry,
): Promise<TopicOverlayResult> {
  const config = getTopicConfig(entry.category, entry.topic, entry.market);
  if (!config) {
    logger.warn('Research discovery topic has no TopicConfig', {
      market,
      category: entry.category,
      topic: entry.topic,
      reason: 'missing_topic_config',
    });
    return { ok: false, entry, reason: 'missing_topic_config' };
  }

  const rows = await loadTopicOverlayRows(market, entry, config);
  return { ok: true, entry, contexts: rows.map((row) => row.context), rows };
}

/** Post-cache-boundary manifest-order attachment (spec §5.3.1 amendment,
 *  Decision A P2 fix). `getCachedTopicOverlay`'s cache KEY intentionally
 *  excludes manifestOrder — only market/category/topic identify a topic's
 *  own Cockpit data; a `BEST_X_MANIFEST` array POSITION is not part of that
 *  data. Before this fix, `loadOneTopicOverlay` baked the CALL-TIME
 *  manifestOrder into every context anyway, so a cached entry silently kept
 *  serving the OLD position — and therefore the wrong `sortResearchContexts`
 *  order (manifestOrder -> audited rank -> productSlug) — for up to the full
 *  3600s TTL after a `BEST_X_MANIFEST` re-ordering.
 *
 *  `loadOneTopicOverlay` is now manifest-order-free (every context it builds
 *  carries a `0` placeholder). This function is the thin, cache-free
 *  post-step that overwrites every context — both the `contexts` projection
 *  and each row's own `context` — with the CURRENT manifestOrder, read fresh
 *  from the live `BEST_X_MANIFEST` at request time, regardless of what was
 *  true when the entry was cached. Never mutates its input: a real cache can
 *  hand the identical cached object to multiple concurrent readers, each
 *  possibly requesting a different live order. A failure result has no
 *  contexts and passes through unchanged.
 *
 *  @internal — exported only as a test seam so this can be verified without
 *  going through `unstable_cache` (which requires a Next.js request runtime
 *  this vitest suite doesn't have); production callers rely on
 *  `getCachedTopicOverlay`, which always applies this after every cache read
 *  (hit or miss). */
export function attachLiveManifestOrder(
  result: TopicOverlayResult,
  manifestOrder: number,
): TopicOverlayResult {
  if (!result.ok) return result;
  const rows = result.rows.map((row) => ({
    ...row,
    context: { ...row.context, manifestOrder },
  }));
  return { ...result, rows, contexts: rows.map((row) => row.context) };
}

/** Per-topic cache (spec §5.3.1): one `unstable_cache` entry per
 *  (market, category, topic), 3600s, tag `research-catalog` — replaces the
 *  single market-wide entry the old `getCachedResearchContexts` used, so one
 *  bad manifest topic can no longer hold the whole market's overlay hostage
 *  for an hour. Constructing `unstable_cache(...)` per call is cheap (pure
 *  closure setup, no I/O) and lets the key vary per topic without a
 *  module-level cache-function-per-topic registry.
 *
 *  The cache key deliberately excludes `manifestOrder` (Decision A P2 fix):
 *  `loadOneTopicOverlay` (what actually gets cached) is manifest-order-free,
 *  and `attachLiveManifestOrder` stamps the CURRENT live position onto the
 *  result every time, hit or miss — so a `BEST_X_MANIFEST` re-ordering is
 *  reflected immediately instead of waiting out the 3600s TTL. */
function getCachedTopicOverlay(
  market: Market,
  entry: BestXManifestEntry,
  manifestOrder: number,
): Promise<TopicOverlayResult> {
  return unstable_cache(
    () => loadOneTopicOverlay(market, entry),
    ['research-discovery-contexts', market, entry.category, entry.topic],
    { revalidate: 3600, tags: ['research-catalog'] },
  )().then((result) => attachLiveManifestOrder(result, manifestOrder));
}

const BACKOFF_WINDOW_MS = 60_000;

/** Module-level 60s post-failure backoff (spec §5.3.1) — deliberately OUTSIDE
 *  `unstable_cache`, which can never cache a thrown error and would otherwise
 *  let a popular, persistently-failing topic re-hit `getCockpitData` on every
 *  single request. Cleared only in `__resetTopicOverlayBackoffForTests`. */
const topicBackoffUntil = new Map<CockpitKey, number>();

/** Module-level singleflight (Decision A P1 fix): the backoff Map above is a
 *  check-then-act race under concurrent requests — several callers can all
 *  read `topicBackoffUntil.get(cockpitKey)` and pass the `retryAfter > now()`
 *  gate BEFORE the first failure ever writes the map, so N concurrent
 *  requests for one topic each independently call `loadTopic` and each
 *  independently warn. This map holds one shared, in-flight
 *  `Promise<TopicOverlayResult>` per CockpitKey — the promise for the ENTIRE
 *  attempt (the `loadTopic` call, its catch, the backoff-map write, AND the
 *  `logger.warn`), never just the raw loader promise. That distinction
 *  matters: if the map instead stored only the bare `loadTopic(...)` promise,
 *  every concurrent awaiter would still run its OWN catch/backoff-write/warn
 *  once that shared promise rejects — one loader call, but N backoff writes
 *  and N warns, which is exactly the log storm this fix exists to close.
 *  Storing the whole attempt means every concurrent caller instead receives
 *  the SAME already-settled `TopicOverlayResult`. Cleared in a `finally`, but
 *  only when the map still holds THIS SAME promise (identity check) —
 *  otherwise an older attempt settling late could delete a newer, still
 *  in-flight attempt's entry out from under it. Keyed by CockpitKey (not
 *  global), so two different topics still load fully in parallel. */
const inFlightTopicLoads = new Map<CockpitKey, Promise<TopicOverlayResult>>();

/** @internal test-only — clears both module-level maps (the failure backoff
 *  and the singleflight in-flight map) so each test in
 *  research-catalog.test.ts starts from a clean slate regardless of
 *  execution order or which CockpitKey an earlier test touched. Never called
 *  by production code. */
export function __resetTopicOverlayBackoffForTests(): void {
  topicBackoffUntil.clear();
  inFlightTopicLoads.clear();
}

/** Loads every manifest topic for `market` (spec §5.2, amended §5.3.1): each
 *  topic now resolves to a typed `TopicOverlayResult` — NOT a flattened array
 *  — instead of the old Promise.allSettled loader collapsing "loaded fine,
 *  zero qualifying rows" and "failed to load" into the same absent-from-array
 *  `[]`. No individual topic promise rejects out of this function.
 *
 *  Per-topic flow:
 *  1. A `CockpitKey` already inside its backoff window is reported
 *     `{ok:false, reason:'backoff'}` WITHOUT calling `loadTopic` again — no
 *     repeat request to getCockpitData/getTopicConfig, no repeat warn.
 *  2. Otherwise the CockpitKey's singleflight entry (`inFlightTopicLoads`
 *     above) is consulted: a caller that finds an in-flight attempt for its
 *     key awaits THAT SAME attempt instead of starting a new one; the first
 *     caller creates the attempt and registers it in the map SYNCHRONOUSLY,
 *     before awaiting anything, so every other caller that arrives while it
 *     is still pending shares the exact same attempt (one `loadTopic` call,
 *     one backoff write, one warn — not N of each — Decision A P1 fix).
 *     Success clears any (possibly stale) backoff entry for that key. A
 *     rejection sets `retryAfterEpochMs = now() + 60_000` and logs exactly
 *     once, inside the shared attempt itself, so every awaiter of that
 *     attempt receives the identical `{ok:false, reason:'load_failed'}`
 *     value rather than each running its own catch/warn — this is the
 *     transition INTO a new backoff window, which is exactly why the log
 *     line lives here and nowhere else: once step 1 above starts
 *     short-circuiting on the next call, this branch (and its warn) simply
 *     doesn't run again until the window has elapsed and a genuinely new
 *     failure occurs.
 *
 *  `now` defaults to `Date.now` but is always injectable so tests can
 *  fast-forward the 60s window deterministically; `loadTopic` defaults to the
 *  real per-topic-cached `getCachedTopicOverlay` but is always injectable so
 *  tests never have to go through `unstable_cache` (which requires a Next.js
 *  request runtime this vitest suite doesn't have).
 *
 *  @internal — test seam only for the `now`/`loadTopic` overrides; production
 *  callers must use getDiscoveryCatalog / getDiscoveryCatalogBundle. */
export async function loadMarketResearchContexts(
  market: Market,
  now: () => number = Date.now,
  loadTopic: TopicOverlayLoader = getCachedTopicOverlay,
): Promise<TopicOverlayResult[]> {
  const entries = BEST_X_MANIFEST.map((entry, manifestOrder) => ({ entry, manifestOrder })).filter(
    ({ entry }) => entry.market === market,
  );

  return Promise.all(
    entries.map(({ entry, manifestOrder }): Promise<TopicOverlayResult> => {
      const cockpitKey = cockpitKeyFor(market, entry.category, entry.topic);
      const retryAfter = topicBackoffUntil.get(cockpitKey);
      if (retryAfter !== undefined && retryAfter > now()) {
        return Promise.resolve({ ok: false, entry, reason: 'backoff' });
      }

      const existingAttempt = inFlightTopicLoads.get(cockpitKey);
      if (existingAttempt) return existingAttempt;

      // The whole attempt — loader call, catch, backoff write, warn — is
      // memoized as ONE promise so every concurrent awaiter (including this
      // very caller) shares the identical settled TopicOverlayResult.
      const attempt: Promise<TopicOverlayResult> = (async (): Promise<TopicOverlayResult> => {
        try {
          const result = await loadTopic(market, entry, manifestOrder);
          topicBackoffUntil.delete(cockpitKey);
          return result;
        } catch {
          topicBackoffUntil.set(cockpitKey, now() + BACKOFF_WINDOW_MS);
          logger.warn('Research discovery topic unavailable', {
            market,
            category: entry.category,
            topic: entry.topic,
            reason: 'load_failed',
          });
          return { ok: false, entry, reason: 'load_failed' };
        }
      })();

      // Identity-safe cleanup, chained via `.finally()` on the SETTLED
      // `attempt` promise rather than living inside the IIFE above
      // (identity-safety regression fix, reviewer-reported): the ECMAScript
      // spec guarantees a `.finally()` callback is always invoked as a
      // QUEUED MICROTASK, never synchronously — even when the promise it's
      // attached to is already settled at attachment time. That means the
      // `inFlightTopicLoads.set(...)` two lines below is guaranteed to run
      // BEFORE this callback ever can, for every `loadTopic` shape,
      // including one that throws SYNCHRONOUSLY (calling it throws before
      // it ever returns a Promise — a shape `TopicOverlayLoader`'s type
      // permits even though the real `getCachedTopicOverlay` never does).
      //
      // The previous in-IIFE `finally` (plus a `let attemptRef` workaround
      // solely to dodge TypeScript flagging a self-referential `const` as
      // "used before being assigned") relied on `loadTopic`'s own internal
      // `await` always yielding first — false for a synchronously-throwing
      // loader, which ran the entire try/catch/finally synchronously,
      // BEFORE `attemptRef`/`inFlightTopicLoads` were ever written. The
      // identity check then compared `undefined === undefined`, "succeeded"
      // as a no-op, and the already-settled failure promise got registered
      // into the map immediately after — permanently, since a promise's own
      // `finally` runs exactly once, at settlement, and never again. The
      // topic then returned `load_failed` for the process lifetime, past
      // every future backoff window, and the real loader was never called
      // again. Moving cleanup to a statement strictly AFTER `attempt`'s own
      // declaration also lets it reference `attempt` directly — no
      // self-referential-const TDZ hazard, and no extra `attemptRef`
      // variable to keep in sync.
      attempt.finally(() => {
        // Only remove the map entry if it still holds THIS attempt. An
        // older attempt settling late — e.g. after
        // __resetTopicOverlayBackoffForTests cleared the map mid-flight and
        // a newer attempt for the same key has already taken its place —
        // must never delete a newer, still-pending entry out from under it.
        if (inFlightTopicLoads.get(cockpitKey) === attempt) {
          inFlightTopicLoads.delete(cockpitKey);
        }
      });

      inFlightTopicLoads.set(cockpitKey, attempt);
      return attempt;
    }),
  );
}

/** Thin back-compat helper (spec §5.3.1): flattens only the rows of
 *  successfully loaded topics, in order — keeps `buildDiscoveryCatalog` and
 *  every other pre-Decision-A consumer of the flat `NormalizedOverlayRow[]`
 *  overlay shape working unchanged. A topic currently `backoff`,
 *  `load_failed`, or `missing_topic_config` contributes nothing, the same
 *  visible effect the old flat array had when it simply omitted a rejected
 *  topic. */
export function flattenQualifiedOverlayRows(
  results: readonly TopicOverlayResult[],
): NormalizedOverlayRow[] {
  const rows: NormalizedOverlayRow[] = [];
  for (const result of results) {
    if (result.ok) rows.push(...result.rows);
  }
  return rows;
}

/** Adapts one typed `TopicOverlayResult` to the minimal, structural
 *  `TopicScopeResult` shape catalog-shell-logic.ts's snapshot DTO builder
 *  consumes — that file cannot import this 'server-only' module's own
 *  `TopicOverlayResult` type (see its own header comment on why), so this
 *  thin per-topic mapping is the only place the two shapes meet. */
function toTopicScopeResult(market: Market, result: TopicOverlayResult): TopicScopeResult {
  const cockpitKey = cockpitKeyFor(market, result.entry.category, result.entry.topic);
  return result.ok
    ? { cockpitKey, ok: true, slugs: result.contexts.map((context) => context.productSlug), reason: null }
    : { cockpitKey, ok: false, slugs: [], reason: result.reason };
}

/** The server-computed, serializable `ShortlistScopeSnapshotDTO` for `market`
 *  (spec §11.2.1, operator ONE-FAN-OUT merge-blocker fix 2026-07-27) — built
 *  from the SAME typed `results` `flattenQualifiedOverlayRows` also consumes,
 *  never a second loader call (see `resolveMarketResearchOverlay` below,
 *  the only production caller, which passes both functions the identical
 *  `results` array from one `loadMarketResearchContexts` invocation).
 *  Delegates the actual three-tier classification to
 *  catalog-shell-logic.ts's `buildShortlistScopeSnapshotDTO`; this function's
 *  only job is the per-topic adaptation via `toTopicScopeResult` above. An
 *  empty `results` array (the market-wide cache-layer-failure case) makes
 *  EVERY known scope for `market` fall into that function's "genuinely
 *  missing result bucket" branch — i.e. `unknown_state` for all of them,
 *  exactly the defensive behavior a total cache-layer failure warrants. */
export function buildDiscoveryScopeSnapshot(
  market: Market,
  results: readonly TopicOverlayResult[],
): ShortlistScopeSnapshotDTO {
  return buildShortlistScopeSnapshotDTO(
    market,
    results.map((result) => toTopicScopeResult(market, result)),
  );
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
): DiscoveryCatalogJoin {
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
// The MDX review cache stays one entry per market (fast-moving editorial
// content, 300s). The Cockpit overlay cache is now one entry per TOPIC (spec
// §5.3.1) via getCachedTopicOverlay above, not a second market-wide
// unstable_cache wrapper here — loadAndFlattenMarketOverlay below is the thin
// glue that fans out through loadMarketResearchContexts (per-topic cache +
// 60s backoff) and flattens the result back to the flat NormalizedOverlayRow[]
// shape this file's pure buildDiscoveryCatalog has always consumed. Precedents
// for the review cache: getMarketReviews (app/(marketing)/[market]/page.tsx)
// and cachedResolveDecisionBridgeData (lib/comparison/bridge.ts).

const getCachedReviewItems = unstable_cache(
  loadMarketReviewItems,
  ['research-discovery-reviews'],
  { revalidate: 300, tags: ['market-reviews', 'research-catalog'] },
);

/** One market's Cockpit overlay, both shapes a single request needs — the
 *  flattened `NormalizedOverlayRow[]` `buildDiscoveryCatalog` joins against,
 *  and the serializable `ShortlistScopeSnapshotDTO` (spec §11.2.1) the client
 *  shortlist restores against — derived from the exact SAME typed
 *  `TopicOverlayResult[]` load (operator ONE-FAN-OUT fix 2026-07-27; see
 *  `resolveMarketResearchOverlay` below). */
export interface MarketResearchOverlay {
  rows: NormalizedOverlayRow[];
  scopeSnapshot: ShortlistScopeSnapshotDTO;
}

/** Resolves the cached Cockpit overlay for `market` from a SINGLE
 *  `TopicOverlayResult[]` load, failing soft: a throw from the cache LAYER
 *  itself — `unstable_cache`, or the logger it might call — is caught,
 *  logged exactly once with a structured payload, and degrades to an empty
 *  overlay PLUS every known scope for `market` reported `unknown_state` (via
 *  `buildDiscoveryScopeSnapshot(market, [])` — see its own doc comment) so
 *  the Hub still renders its full review catalog (spec §13: HTTP 200 even
 *  when Cockpit data is unreachable) while the shortlist restore logic
 *  correctly treats every scope as currently unverifiable rather than
 *  guessing any of them empty. This is distinct from
 *  `loadMarketResearchContexts`'s own per-TOPIC resilience above (typed
 *  results + 60s backoff, spec §5.3.1), which already isolates one bad
 *  manifest entry from the rest and never itself rejects — this seam guards
 *  defensively against the (now largely theoretical, but still checked) case
 *  of the surrounding layer throwing regardless.
 *
 *  ONE FAN-OUT, ONE SOURCE (operator, binding): `load` defaults to the real
 *  `loadMarketResearchContexts` — the SAME per-topic-cached, singleflighted
 *  pipeline `flattenQualifiedOverlayRows` and `buildDiscoveryScopeSnapshot`
 *  both then read from the ONE resolved `results` array below. Neither is
 *  ever fed a second, independently-refetched `results` — a retry or backoff
 *  transition between two separate loads could otherwise leave the catalog
 *  and the scope snapshot describing two different moments in time (a
 *  topic's cards on screen while its snapshot reports it unavailable, or a
 *  restore cleaning a scope whose cards are still showing). Injectable
 *  purely so tests can supply a rejecting stub, or a call-counting wrapper
 *  proving this single-load contract, without mocking next/cache.
 *
 *  @internal — test seam only; production callers must use
 *  getDiscoveryCatalog / getDiscoveryCatalogBundle. */
export async function resolveMarketResearchOverlay(
  market: Market,
  load: (market: Market) => Promise<TopicOverlayResult[]> = loadMarketResearchContexts,
): Promise<MarketResearchOverlay> {
  try {
    const results = await load(market);
    return {
      rows: flattenQualifiedOverlayRows(results),
      scopeSnapshot: buildDiscoveryScopeSnapshot(market, results),
    };
  } catch (error) {
    logger.warn('Research discovery overlay cache unavailable', {
      market,
      scope: 'research-catalog-overlay-cache',
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return { rows: [], scopeSnapshot: buildDiscoveryScopeSnapshot(market, []) };
  }
}

/** The serializable, <200 KB public catalog for one market (spec §5.3). */
export async function getDiscoveryCatalog(market: Market): Promise<DiscoveryCatalog> {
  return (await getDiscoveryCatalogBundle(market)).catalog;
}

/** Full bundle for server rendering: `catalog` and `scopeSnapshot` may cross
 *  the RSC/client boundary; `dossierRows` (full ResearchProduct per dossier)
 *  never does. Overlay resolution goes through `resolveMarketResearchOverlay`
 *  so a cache-layer failure is logged once and degrades to a reviews-only
 *  catalog (plus an all-`unknown_state` scope snapshot) instead of failing
 *  silently — and so the catalog rows and the scope snapshot always come
 *  from the same single per-topic load (see that function's own doc
 *  comment). */
export async function getDiscoveryCatalogBundle(market: Market): Promise<DiscoveryCatalogBundle> {
  const [reviews, overlay] = await Promise.all([
    getCachedReviewItems(market),
    resolveMarketResearchOverlay(market),
  ]);
  const bundle = buildDiscoveryCatalog(market, reviews, overlay.rows);
  return { ...bundle, scopeSnapshot: overlay.scopeSnapshot };
}
