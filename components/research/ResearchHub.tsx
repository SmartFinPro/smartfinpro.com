// components/research/ResearchHub.tsx
// The interactive Research hub shell — search, URL-backed facets, and
// accessible result state (unified-research-discovery-pr2-hubs plan, Task 4;
// spec §6, §8). Generalizes the Research Library pilot's `ResearchLibrary`
// (components/research/ResearchLibrary.tsx) from one hard-coded topic
// (trading-platforms) to every market/category the catalog contains.
//
// RSC pattern (spec §8): `ResearchHubPage` (server) builds every card as an
// opaque ReactNode — ResearchCard/CatalogCard read the filesystem and are
// Server Components, so this client shell can never construct one itself.
// This component only decides, for the current filters, WHICH of the
// already-built nodes to show and where — never re-rendering a card.
//
//   - `browseFallback` is the exact same JSX tree `ResearchHubPage` also hands
//     to the wrapping <Suspense fallback={...}> — the crawlable, unfiltered,
//     no-JS browse view (topic-grouped dossiers + featured pin + trailing
//     review grid) a crawler or a JS-disabled visitor sees. Once hydrated,
//     this component builds its OWN default-view render (`DefaultResults`,
//     Task 5) instead of reusing that opaque node verbatim: every dossier
//     card now needs a shortlist toggle wrapped onto it (spec §11), and
//     `browseFallback` is an already-built ReactNode tree with no per-card
//     seam to inject into. `DefaultResults` mirrors the fallback's grouping/
//     featured-pin layout exactly (same `data-testid`s, same section
//     structure) — only the presence of the toggle differs, matching how the
//     filtered case below already diverges from the fallback's own DOM.
//   - `nodes` is the flat, keyed map of the OTHER (already default-projected)
//     cards, used only once a search/facet actually narrows the set. Building
//     the filtered view still needs the same per-COCKPIT-KEY grouping the
//     fallback uses (`groupResolvedEntries`, mirroring `ResearchHubPage`'s
//     server-side `groupBrowseNodes` — never the bare topic string, since
//     BEST_X_MANIFEST reuses topic names like "companies" across categories;
//     see both functions' own doc comments), so the grouping is
//     re-implemented here — the CARD content is reused, the surrounding
//     layout is not, and that split is exactly what "never re-render a card"
//     means: it is a constraint on the opaque node, not on the plain <section>
//     wrapper around it. Each group's `data-testid` stays the pilot's
//     `dossier-<topic>` (the E2E suite scopes every assertion through that
//     test id) UNLESS the topic name is ambiguous in-market, in which case it
//     is `dossier-<category>-<topic>` (`dossierGroupTestId`).
//   - A multi-topic item's currently-selected context can, in principle,
//     differ from the single DEFAULT context `ResearchHubPage` built a node
//     for (e.g. an explicit `topic` filter picks the item's OTHER context).
//     `nodes` only ever has the default cockpitKey's entry for that item, so
//     that lookup is a genuine miss — degrade to the item's review node, or
//     drop the projection when it has none (spec's Task 4 requirement).
//
// URL contract (spec §6.1): `q`, `category`, `type`, `status`, `confidence`,
// `fresh` — parsed/serialized by `parseDiscoverySearchParams` /
// `buildDiscoverySearchParams` (lib/research/catalog-shell-logic.ts). `topic`
// and `specs` round-trip through those same functions (PR 4, spec §10, will
// wire their UI) but this shell does not yet expose a control for either.
// Search writes are debounced via `router.replace()` (mutates the CURRENT
// history entry); facet toggles use `router.push()` (a NEW entry) — that
// split is what makes Back restore "the search, not the last filter click"
// (spec's Task 4 E2E: browser Back after search+filter keeps only the
// search). `useSearchParams()` stays under the caller's <Suspense> so all
// four hub routes remain `○ Static` (spec §8).
//
// Shortlist UI (Task 5; spec §11) lives in components/research/ResearchShortlist.tsx
// (the reducer/snapshot/restore contract) and is wired in here — the toggle
// pill wrapping each dossier card, the fixed compare bar, and the cross-topic
// switch dialog. Analytics (Task 6) still deliberately do not live here.
'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { categoryConfig, type Category, type Market } from '@/lib/i18n/config';
import {
  buildDiscoverySearchParams,
  computeAmbiguousDossierTopics,
  computeDiscoveryFacets,
  dossierGroupTestId,
  parseDiscoverySearchParams,
  projectDiscoveryItems,
  projectionNodeKey,
  sortHubProjections,
  type CockpitKey,
  type DiscoveryFilters,
  type DiscoveryItem,
  type DiscoveryKind,
  type DiscoveryProjection,
  type ResearchConfidence,
  type ResearchStatus,
  type ShortlistScopeSnapshotDTO,
} from '@/lib/research/catalog-shell-logic';
import { formatVerifiedDate } from './VerificationStatus';
import { FilterChips } from './FilterChips';
import {
  ShortlistBar,
  ShortlistSwitchDialog,
  ShortlistToggleCard,
  useScopedResearchShortlist,
} from './ResearchShortlist';

const STATUS_LABEL: Record<ResearchStatus, string> = {
  audited: 'Audited',
  provisional: 'In verification',
};
const CONFIDENCE_LABEL: Record<ResearchConfidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};
const TYPE_LABEL: Record<DiscoveryKind, string> = {
  review: 'Reviews',
  dossier: 'Dossiers',
};

export interface ResearchHubNodeEntry {
  key: string;
  itemId: string;
  cockpitKey: CockpitKey | null;
  node: ReactNode;
}

export interface ResearchHubProps {
  market: Market;
  items: DiscoveryItem[];
  nodes: ResearchHubNodeEntry[];
  browseFallback: ReactNode;
  /** Server-built, serializable shortlist scope snapshot (spec §11.2.1,
   *  operator ONE-FAN-OUT fix 2026-07-27) — threaded straight from
   *  `getDiscoveryCatalogBundle` through `ResearchHubPage` -> `ResearchHubBody`
   *  -> here, never re-derived from `items` client-side (see
   *  ResearchShortlist.tsx's file header for why that re-derivation was a
   *  bug). */
  scopeSnapshot: ShortlistScopeSnapshotDTO;
}

export interface ResolvedEntry {
  key: string;
  kind: DiscoveryKind;
  topic: string | null;
  topicLabel: string | null;
  // The dossier's category — null for a review-kind entry, same pattern as
  // `cockpitKey`/`productSlug`/`displayName` below. Needed (alongside
  // `topic`) to compute this entry's group's disambiguated data-testid
  // (`dossierGroupTestId`) without re-deriving it from `cockpitKey`.
  category: Category | null;
  isFeatured: boolean;
  node: ReactNode;
  // Cockpit identity for the shortlist toggle (spec §11.1) — null for a
  // review-kind entry (a plain MDX review has no Cockpit product to shortlist
  // or compare; the shortlist only ever holds products from exactly one
  // cockpitKey).
  cockpitKey: CockpitKey | null;
  productSlug: string | null;
  displayName: string | null;
}

/** Resolves one projection to its already-built opaque node, applying the
 *  dossier→review degrade rule described in the file header. Returns `null`
 *  when even the degraded lookup misses (the projection is dropped, not
 *  shown broken). */
function resolveEntry(
  projection: DiscoveryProjection,
  nodeByKey: ReadonlyMap<string, ReactNode>,
): ResolvedEntry | null {
  if (projection.kind === 'review') {
    const key = projectionNodeKey(projection.itemId, null);
    const node = nodeByKey.get(key);
    return node
      ? {
          key,
          kind: 'review',
          topic: null,
          topicLabel: null,
          category: null,
          isFeatured: false,
          node,
          cockpitKey: null,
          productSlug: null,
          displayName: null,
        }
      : null;
  }

  const { context, item } = projection;
  const key = projectionNodeKey(projection.itemId, context.cockpitKey);
  const node = nodeByKey.get(key);
  if (node) {
    return {
      key,
      kind: 'dossier',
      topic: context.topic,
      topicLabel: context.topicLabel,
      category: item.category,
      isFeatured: context.status === 'audited' && context.auditedRank === 1,
      node,
      cockpitKey: context.cockpitKey,
      productSlug: context.productSlug,
      displayName: context.displayName,
    };
  }

  if (projection.item.review) {
    const reviewKey = projectionNodeKey(projection.itemId, null);
    const reviewNode = nodeByKey.get(reviewKey);
    if (reviewNode) {
      return {
        key: reviewKey,
        kind: 'review',
        topic: null,
        topicLabel: null,
        category: null,
        isFeatured: false,
        node: reviewNode,
        cockpitKey: null,
        productSlug: null,
        displayName: null,
      };
    }
  }

  return null;
}

export interface DossierGroup {
  cockpitKey: CockpitKey;
  topic: string;
  topicLabel: string;
  category: Category;
  /** data-testid for this group's <section> — see `dossierGroupTestId`
   *  (lib/research/catalog-shell-logic.ts) for the disambiguation rule. */
  testId: string;
  entries: ResolvedEntry[];
}

/** Groups resolved entries by COCKPIT KEY, never the bare topic string —
 *  mirrors `ResearchHubPage`'s server-side `groupBrowseNodes` exactly (same
 *  reason: BEST_X_MANIFEST reuses the topic string "companies" across
 *  credit-repair and debt-relief, and a bare-topic Map key would silently
 *  merge both categories' products into one section). Preserves the order
 *  entries arrive in (already manifest-order first, per `sortHubProjections`).
 *  `ambiguousTopics` (from `computeAmbiguousDossierTopics`, computed ONCE by
 *  the caller from the full unfiltered market `items` — never from `entries`
 *  itself) is what keeps a group's `data-testid` stable regardless of which
 *  filter happens to be narrowing the currently-rendered set; see
 *  `dossierGroupTestId`. Entries that degraded to a review (or never had a
 *  topic/category) fall into the trailing review grid instead. */
export function groupResolvedEntries(
  entries: readonly ResolvedEntry[],
  ambiguousTopics: ReadonlySet<string>,
): {
  dossierGroups: DossierGroup[];
  reviewEntries: ResolvedEntry[];
} {
  const dossierGroups: DossierGroup[] = [];
  const indexByCockpitKey = new Map<CockpitKey, number>();
  const reviewEntries: ResolvedEntry[] = [];

  for (const entry of entries) {
    if (entry.kind === 'dossier' && entry.cockpitKey && entry.topic && entry.topicLabel && entry.category) {
      let index = indexByCockpitKey.get(entry.cockpitKey);
      if (index === undefined) {
        index = dossierGroups.length;
        indexByCockpitKey.set(entry.cockpitKey, index);
        dossierGroups.push({
          cockpitKey: entry.cockpitKey,
          topic: entry.topic,
          topicLabel: entry.topicLabel,
          category: entry.category,
          testId: dossierGroupTestId(entry.topic, entry.category, ambiguousTopics),
          entries: [],
        });
      }
      dossierGroups[index].entries.push(entry);
    } else {
      reviewEntries.push(entry);
    }
  }

  return { dossierGroups, reviewEntries };
}

/** The filtered/searched result view: the same per-topic grouping the
 *  browse fallback uses, but never with a separately pinned featured card —
 *  once a filter narrows the set, every match (including a still-qualifying
 *  #1) renders as a normal card in a uniform grid (pilot precedent: a pinned
 *  "winner" over a provisional/narrow search result reads as broken, not
 *  helpful). */
function FilteredResults({
  entries,
  ambiguousTopics,
}: {
  entries: ResolvedEntry[];
  ambiguousTopics: ReadonlySet<string>;
}) {
  const { dossierGroups, reviewEntries } = groupResolvedEntries(entries, ambiguousTopics);

  return (
    <>
      {dossierGroups.map((group) => (
        <section
          key={group.cockpitKey}
          data-testid={group.testId}
          className="mx-auto px-6 py-8 sm:py-12"
          style={{ maxWidth: '1280px' }}
        >
          <h2 className="mb-6 text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
            {group.topicLabel}
          </h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {group.entries.map((entry) => (
              <div key={entry.key}>{entry.node}</div>
            ))}
          </div>
        </section>
      ))}

      {reviewEntries.length > 0 && (
        <section
          data-testid="research-review-grid"
          className="mx-auto px-6 py-8 sm:py-12"
          style={{ maxWidth: '1280px' }}
        >
          <h2 className="mb-6 text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
            More independent reviews
          </h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {reviewEntries.map((entry) => (
              <div key={entry.key}>{entry.node}</div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** The default (unfiltered) browse view, rendered client-side once hydrated —
 *  mirrors `ResearchHubPage`'s server-rendered `BrowseFallback` exactly
 *  (same topic grouping, same per-topic featured-winner pin, same section
 *  markup/testids), the one structural difference being that every dossier
 *  entry here already carries its shortlist toggle (Task 5; `browseFallback`
 *  itself — the Suspense fallback / no-JS view — never does, since the
 *  shortlist is a pure client enhancement). Kept as its own function, rather
 *  than reusing the `browseFallback` prop for this branch, precisely so the
 *  toggle can wrap each card: `browseFallback` is an opaque, already-built
 *  ReactNode tree with no per-card seam to inject into. */
function DefaultResults({
  entries,
  ambiguousTopics,
}: {
  entries: ResolvedEntry[];
  ambiguousTopics: ReadonlySet<string>;
}) {
  const { dossierGroups, reviewEntries } = groupResolvedEntries(entries, ambiguousTopics);

  return (
    <>
      {dossierGroups.map((group) => {
        const featured = group.entries.find((entry) => entry.isFeatured);
        const rest = featured ? group.entries.filter((entry) => entry.key !== featured.key) : group.entries;

        return (
          <section
            key={group.cockpitKey}
            data-testid={group.testId}
            className="mx-auto px-6 py-8 sm:py-12"
            style={{ maxWidth: '1280px' }}
          >
            <h2 className="mb-6 text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
              {group.topicLabel}
            </h2>
            {featured && <div className="mb-6">{featured.node}</div>}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {rest.map((entry) => (
                <div key={entry.key}>{entry.node}</div>
              ))}
            </div>
          </section>
        );
      })}

      {reviewEntries.length > 0 && (
        <section
          data-testid="research-review-grid"
          className="mx-auto px-6 py-8 sm:py-12"
          style={{ maxWidth: '1280px' }}
        >
          <h2 className="mb-6 text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
            More independent reviews
          </h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {reviewEntries.map((entry) => (
              <div key={entry.key}>{entry.node}</div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

const hasActiveDiscoveryFilters = (filters: DiscoveryFilters): boolean =>
  filters.query.trim() !== '' ||
  filters.category !== null ||
  filters.type !== null ||
  filters.status !== null ||
  filters.confidence !== null ||
  filters.fresh !== null ||
  filters.topic !== null ||
  filters.specs.length > 0;

// `browseFallback` is intentionally not destructured here — see the file
// header: it's still what `ResearchHubPage` hands to `<Suspense fallback>`
// for the crawlable/no-JS view, but once this component itself renders
// client-side, `DefaultResults` (not `browseFallback`) owns the unfiltered
// view so every dossier card can carry a shortlist toggle.
export function ResearchHub({ market, items, nodes, scopeSnapshot }: ResearchHubProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-derived filters (source of truth for everything except the live
  // search text, which needs to filter instantly while its own write to the
  // URL is still debouncing).
  const filters = useMemo(
    () => parseDiscoverySearchParams(searchParams, market, items),
    [searchParams, market, items],
  );

  // Search input is controlled locally for instant filtering; re-synced from
  // the URL during render (React's effect-free alternative) whenever it
  // changes from underneath us — our own debounced write, or a Back/Forward
  // navigation.
  const [query, setQuery] = useState(filters.query);
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(filters.query);
  if (filters.query !== syncedUrlQuery) {
    setSyncedUrlQuery(filters.query);
    setQuery(filters.query);
  }

  const activeFilters = useMemo<DiscoveryFilters>(
    () => ({ ...filters, query }),
    [filters, query],
  );
  const isActive = hasActiveDiscoveryFilters(activeFilters);

  // Settled-query write: debounced router.replace() (mutates the CURRENT
  // history entry, so typing never spams Back) — the only place `q` is
  // written to the URL.
  useEffect(() => {
    const nextQuery = query.trim();
    if (nextQuery === filters.query) return;
    const id = setTimeout(() => {
      const next: DiscoveryFilters = { ...filters, query: nextQuery };
      const qs = buildDiscoverySearchParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [query, filters, pathname, router]);

  // Facet toggle: router.push() (a NEW history entry), so Back after a chip
  // click undoes just that chip, never the settled search underneath it.
  const applyFacet = useCallback(
    (partial: Partial<DiscoveryFilters>) => {
      const next: DiscoveryFilters = { ...activeFilters, ...partial };
      const qs = buildDiscoverySearchParams(next).toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [activeFilters, pathname, router],
  );

  const resetAll = useCallback(() => {
    setQuery('');
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  const facets = useMemo(
    () => computeDiscoveryFacets(items, activeFilters),
    [items, activeFilters],
  );

  const nodeByKey = useMemo(() => {
    const map = new Map<string, ReactNode>();
    for (const entry of nodes) map.set(entry.key, entry.node);
    return map;
  }, [nodes]);

  const resolvedEntries = useMemo(() => {
    const projections = sortHubProjections(projectDiscoveryItems(items, activeFilters));
    const resolved: ResolvedEntry[] = [];
    for (const projection of projections) {
      const entry = resolveEntry(projection, nodeByKey);
      if (entry) resolved.push(entry);
    }
    return resolved;
  }, [items, activeFilters, nodeByKey]);

  const resultCount = resolvedEntries.length;

  // Grounded in the static manifest for `market` (never in `resolvedEntries`,
  // which shrinks under an active filter) so a group's disambiguated
  // data-testid never depends on which filter happens to be narrowing the
  // currently-visible set — see `computeAmbiguousDossierTopics`'s own doc
  // comment (lib/research/catalog-shell-logic.ts).
  const ambiguousTopics = useMemo(() => computeAmbiguousDossierTopics(market), [market]);

  const hasAnyFacetRow =
    facets.categories.length >= 2 ||
    facets.types.length >= 2 ||
    facets.statuses.length >= 2 ||
    facets.confidences.length >= 2 ||
    facets.freshnessDates.length >= 2;

  // Restore-safe, multi-topic shortlist (Task 5; spec §11) — built from
  // `items`, the FULL unfiltered market catalog, never from `resolvedEntries`
  // (the current search/category/topic projection). See
  // components/research/ResearchShortlist.tsx for the three-tier
  // ShortlistScopeSnapshot this depends on. `scopeSnapshot` is the
  // server-built DTO (spec §11.2.1, operator fix 2026-07-27) — never
  // re-derived from `items` here.
  const shortlist = useScopedResearchShortlist(market, items, scopeSnapshot);

  // Every dossier entry gets its shortlist toggle wrapped on BEFORE grouping —
  // `DefaultResults`/`FilteredResults` stay plain layout components with no
  // shortlist awareness of their own. A review-kind entry (no Cockpit
  // identity) passes through unwrapped.
  const entriesForRender: ResolvedEntry[] = resolvedEntries.map((entry) => {
    if (entry.kind !== 'dossier' || !entry.cockpitKey || !entry.productSlug) return entry;
    const cockpitKey = entry.cockpitKey;
    const productSlug = entry.productSlug;
    const { selected, disabled } = shortlist.cardState(cockpitKey, productSlug);
    return {
      ...entry,
      node: (
        <ShortlistToggleCard
          name={entry.displayName ?? productSlug}
          node={entry.node}
          selected={selected}
          disabled={disabled}
          onToggle={() => shortlist.toggle(cockpitKey, productSlug)}
        />
      ),
    };
  });

  return (
    <div>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex flex-col gap-3 px-6 py-5 sm:py-6" style={{ maxWidth: '1280px' }}>
          <div className="relative max-w-md">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--sfp-slate)' }}
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search platforms…"
              aria-label="Search reviews and dossiers"
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--sfp-navy)]"
              style={{ borderColor: 'var(--sfp-hairline)', background: '#ffffff', color: 'var(--sfp-ink)' }}
            />
          </div>

          {hasAnyFacetRow && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <SlidersHorizontal size={15} aria-hidden="true" style={{ color: 'var(--sfp-slate)' }} />
              <FilterChips
                label="Category"
                value={activeFilters.category}
                options={facets.categories.map((entry) => ({
                  value: entry.value,
                  label: categoryConfig[entry.value].name,
                  count: entry.count,
                }))}
                onChange={(value) => applyFacet({ category: value as Category | null })}
              />
              <FilterChips
                label="Type"
                value={activeFilters.type}
                options={facets.types.map((entry) => ({
                  value: entry.value,
                  label: TYPE_LABEL[entry.value],
                  count: entry.count,
                }))}
                onChange={(value) => applyFacet({ type: value as DiscoveryKind | null })}
              />
              <FilterChips
                label="Status"
                value={activeFilters.status}
                options={facets.statuses.map((entry) => ({
                  value: entry.value,
                  label: STATUS_LABEL[entry.value],
                  count: entry.count,
                }))}
                onChange={(value) => applyFacet({ status: value as ResearchStatus | null })}
              />
              <FilterChips
                label="Confidence"
                value={activeFilters.confidence}
                options={facets.confidences.map((entry) => ({
                  value: entry.value,
                  label: CONFIDENCE_LABEL[entry.value],
                  count: entry.count,
                }))}
                onChange={(value) => applyFacet({ confidence: value as ResearchConfidence | null })}
              />
              <FilterChips
                label="Verified since"
                value={activeFilters.fresh}
                options={[...facets.freshnessDates]
                  .reverse()
                  .map((entry) => ({ value: entry.value, label: formatVerifiedDate(entry.value), count: entry.count }))}
                onChange={(value) => applyFacet({ fresh: value })}
              />
            </div>
          )}

          {/* Permanently-mounted SR live region (spec Task 4: never mounted
              conditionally) — the visible count below is aria-hidden so the
              result count is announced exactly once. */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </p>

          {isActive && (
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--sfp-slate)' }}>
              <span aria-hidden="true">
                {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </span>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1 font-semibold hover:underline"
                style={{ color: 'var(--sfp-navy)' }}
              >
                <X size={13} aria-hidden="true" />
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {!isActive ? (
        <DefaultResults entries={entriesForRender} ambiguousTopics={ambiguousTopics} />
      ) : resultCount > 0 ? (
        <FilteredResults entries={entriesForRender} ambiguousTopics={ambiguousTopics} />
      ) : (
        <div
          className="mx-auto px-6 py-16 text-center"
          style={{ maxWidth: '1280px', color: 'var(--sfp-slate)' }}
        >
          <p className="text-sm">No results match your search or filters.</p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-2 text-sm font-semibold hover:underline"
            style={{ color: 'var(--sfp-navy)' }}
          >
            Clear all filters
          </button>
        </div>
      )}

      {shortlist.pendingSwitchDescription && (
        <ShortlistSwitchDialog
          description={shortlist.pendingSwitchDescription}
          onCancel={shortlist.cancelSwitch}
          onConfirm={shortlist.confirmSwitch}
        />
      )}

      <ShortlistBar
        slugs={shortlist.slugs}
        displayNameFor={shortlist.displayNameFor}
        onRemove={shortlist.removeSlug}
        onClearAll={shortlist.clearAll}
        compareUrl={shortlist.compareUrl}
      />
    </div>
  );
}
