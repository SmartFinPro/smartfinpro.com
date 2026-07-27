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
//     to the wrapping <Suspense fallback={...}> — the crawlable, unfiltered
//     browse view (topic-grouped dossiers + featured pin + trailing review
//     grid). When no filter is active, this component renders that SAME node
//     verbatim, so there is no visual or structural difference between the
//     server-rendered fallback a crawler sees and what a hydrated browser
//     shows by default — no logic is duplicated for that case.
//   - `nodes` is the flat, keyed map of the OTHER (already default-projected)
//     cards, used only once a search/facet actually narrows the set. Building
//     the filtered view still needs the same per-topic
//     `data-testid="dossier-<topic>"` grouping the fallback uses (the pilot
//     E2E scopes every assertion through that test id), so the grouping is
//     re-implemented here — the CARD content is reused, the surrounding
//     layout is not, and that split is exactly what "never re-render a card"
//     means: it is a constraint on the opaque node, not on the plain <section>
//     wrapper around it.
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
// Shortlist UI (Task 5) and analytics (Task 6) deliberately do not live here
// yet — this component only shows/hides cards and reports the result count.
'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { categoryConfig, type Category, type Market } from '@/lib/i18n/config';
import {
  buildDiscoverySearchParams,
  computeDiscoveryFacets,
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
} from '@/lib/research/catalog-shell-logic';
import { formatVerifiedDate } from './VerificationStatus';
import { FilterChips } from './FilterChips';

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
}

interface ResolvedEntry {
  key: string;
  kind: DiscoveryKind;
  topic: string | null;
  topicLabel: string | null;
  isFeatured: boolean;
  node: ReactNode;
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
      ? { key, kind: 'review', topic: null, topicLabel: null, isFeatured: false, node }
      : null;
  }

  const { context } = projection;
  const key = projectionNodeKey(projection.itemId, context.cockpitKey);
  const node = nodeByKey.get(key);
  if (node) {
    return {
      key,
      kind: 'dossier',
      topic: context.topic,
      topicLabel: context.topicLabel,
      isFeatured: context.status === 'audited' && context.auditedRank === 1,
      node,
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
        isFeatured: false,
        node: reviewNode,
      };
    }
  }

  return null;
}

interface DossierGroup {
  topic: string;
  topicLabel: string;
  entries: ResolvedEntry[];
}

/** Groups resolved entries by Cockpit topic, preserving the order they arrive
 *  in (already manifest-order first, per `sortHubProjections`) — mirrors
 *  `ResearchHubPage`'s server-side `groupBrowseNodes` so a filtered result
 *  keeps the same `data-testid="dossier-<topic>"` scope the unfiltered
 *  fallback uses. Entries that degraded to a review (or never had a topic)
 *  fall into the trailing review grid instead. */
function groupResolvedEntries(entries: readonly ResolvedEntry[]): {
  dossierGroups: DossierGroup[];
  reviewEntries: ResolvedEntry[];
} {
  const dossierGroups: DossierGroup[] = [];
  const indexByTopic = new Map<string, number>();
  const reviewEntries: ResolvedEntry[] = [];

  for (const entry of entries) {
    if (entry.kind === 'dossier' && entry.topic && entry.topicLabel) {
      let index = indexByTopic.get(entry.topic);
      if (index === undefined) {
        index = dossierGroups.length;
        indexByTopic.set(entry.topic, index);
        dossierGroups.push({ topic: entry.topic, topicLabel: entry.topicLabel, entries: [] });
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
function FilteredResults({ entries }: { entries: ResolvedEntry[] }) {
  const { dossierGroups, reviewEntries } = groupResolvedEntries(entries);

  return (
    <>
      {dossierGroups.map((group) => (
        <section
          key={group.topic}
          data-testid={`dossier-${group.topic}`}
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

const hasActiveDiscoveryFilters = (filters: DiscoveryFilters): boolean =>
  filters.query.trim() !== '' ||
  filters.category !== null ||
  filters.type !== null ||
  filters.status !== null ||
  filters.confidence !== null ||
  filters.fresh !== null ||
  filters.topic !== null ||
  filters.specs.length > 0;

export function ResearchHub({ market, items, nodes, browseFallback }: ResearchHubProps) {
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
  const hasAnyFacetRow =
    facets.categories.length >= 2 ||
    facets.types.length >= 2 ||
    facets.statuses.length >= 2 ||
    facets.confidences.length >= 2 ||
    facets.freshnessDates.length >= 2;

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
        browseFallback
      ) : resultCount > 0 ? (
        <FilteredResults entries={resolvedEntries} />
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
    </div>
  );
}
