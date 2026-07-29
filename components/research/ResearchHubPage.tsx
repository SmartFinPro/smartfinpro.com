// components/research/ResearchHubPage.tsx
// The one server ResearchHubPage all four market route wrappers
// (app/(marketing)/research, /uk/research, /ca/research, /au/research)
// delegate to (unified-research-discovery-pr2-hubs plan, Task 3; spec §8,
// §9.1, §7.4).
//
// Server Component ONLY: builds the discovery catalog for the given market,
// the server-rendered dossier/card nodes, the audited-only JSON-LD, and a
// COMPLETE browse fallback — no searchParams/headers() access anywhere in
// THIS file itself. That keeps `/research` (and its three market siblings)
// statically prerenderable, and every review href visible in raw HTML with
// JavaScript disabled (spec §8).
//
// Task 4 wires the interactive client shell (`ResearchHub`, URL filters,
// facets) in under a <Suspense> boundary, because `ResearchHub` reads
// `useSearchParams()` — a hook that forces Next to bail the wrapped subtree
// to client-only rendering during static generation. The Suspense `fallback`
// is the SAME `<BrowseFallback>` element `ResearchHub` also receives as its
// own `browseFallback` prop: one build of the topic-grouped, JSON-LD-backed
// browse view serves both the crawlable static HTML (fallback) and the
// hydrated client's own unfiltered state (prop) — never two independently
// assembled views of the same catalog.
//
// MERGE-BLOCKER INVARIANT (operator-mandated, this task): the JSON-LD
// ItemList and the raw rendered HTML must describe the SAME audited
// products. `buildResearchHubNodes` and `buildResearchItemListSchema` are
// therefore always fed the identical, already-degraded projection list —
// never two independently filtered views of the catalog. See
// __tests__/unit/research-hub-schema.test.ts for the set-equality proof.
//
// The marketing route group's layout already owns the single <main
// id="main-content"> landmark for every page under app/(marketing) — this
// component must not add a second one.

import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import type { Category, Market } from '@/lib/i18n/config';
import { marketConfig } from '@/lib/i18n/config';
import {
  getDiscoveryCatalogBundle,
  type DiscoveryCatalog,
  type DiscoveryCatalogBundle,
  type DiscoveryDossierRenderRow,
} from '@/lib/research/catalog';
import { getResearchHubCopy, type ResearchHubCopy } from '@/lib/research/hub-copy';
import {
  computeAmbiguousDossierTopics,
  dossierGroupTestId,
  EMPTY_DISCOVERY_FILTERS,
  projectDiscoveryItems,
  projectionNodeKey,
  researchBaseForMarket,
  sortHubProjections,
  type CockpitKey,
  type DiscoveryProjection,
  type ShortlistScopeSnapshotDTO,
} from '@/lib/research/catalog-shell-logic';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { generateComparisonItemListSchema } from '@/lib/seo/schema';
import { formatVerifiedDate } from './VerificationStatus';
import { ResearchCard } from './ResearchCard';
import { CatalogCard } from './CatalogCard';
import { ResearchHub, type ResearchHubNodeEntry } from './ResearchHub';
import { ShortlistRestoreController } from './ResearchShortlist';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// ── Server nodes (spec §8) ───────────────────────────────────────────────────

export interface ResearchHubNode {
  key: string;
  projection: DiscoveryProjection;
  node: ReactNode;
}

/** Resolves one default projection to its rendered node (spec §9):
 *  - a plain review projection -> CatalogCard;
 *  - a Cockpit-only PROVISIONAL dossier (no review, provisional context) ->
 *    CatalogCard ("In verification", no number);
 *  - every other qualified dossier (audited any, or provisional WITH a
 *    review — i.e. never "Cockpit-only") -> ResearchCard, sourced from its
 *    full-provenance sidecar row in `dossierRows`.
 *
 *  Degradation (spec §13 "Dossier-Node fehlt"): a missing sidecar row throws
 *  in development (a real join bug must never pass silently) and degrades in
 *  production — to the review projection when the item has one, otherwise
 *  the projection is dropped entirely (returns null). Returning the
 *  DEGRADED projection (not the original) is what keeps
 *  buildResearchItemListSchema's audited-only filter and this function's own
 *  rendering choice in permanent agreement: a degraded item can never both
 *  render as a plain review AND still claim an audited ItemList entry. */
function resolveHubNode(
  projection: DiscoveryProjection,
  dossierRowsByKey: ReadonlyMap<string, DiscoveryDossierRenderRow>,
): { projection: DiscoveryProjection; node: ReactNode } | null {
  if (projection.kind === 'review') {
    return { projection, node: <CatalogCard projection={projection} /> };
  }

  const { item, context } = projection;
  const isCockpitOnly = item.review === null;

  if (isCockpitOnly && context.status === 'provisional') {
    return { projection, node: <CatalogCard projection={projection} /> };
  }

  const key = projectionNodeKey(item.id, context.cockpitKey);
  const row = dossierRowsByKey.get(key);

  if (!row) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`ResearchHubPage: missing dossier sidecar row for ${key}`);
    }
    if (item.review) {
      const degraded: DiscoveryProjection = { itemId: item.id, kind: 'review', item, context: null };
      return { projection: degraded, node: <CatalogCard projection={degraded} /> };
    }
    return null;
  }

  const variant = context.status === 'audited' && context.auditedRank === 1 ? 'featured' : 'standard';
  return { projection, node: <ResearchCard item={row.researchProduct} variant={variant} /> };
}

/** Builds every server-rendered node for the market's default (unfiltered)
 *  browse projection, in display order (spec §6.3). This is the single list
 *  both the browse fallback AND the JSON-LD are derived from — see the
 *  merge-blocker note above. Only ever ONE node per item — the item's
 *  DEFAULT projection (`projectDiscoveryItems` + `EMPTY_DISCOVERY_FILTERS`
 *  picks exactly one: the dossier when the item has any qualifying context,
 *  else the review) — which is exactly right for a single unfiltered browse
 *  view, but is NOT a complete map of every projection the client shell can
 *  ever select once a filter narrows or an explicit `topic` picks a
 *  different context. See `buildResearchNodeBank` below for that. */
export function buildResearchHubNodes(
  bundle: Pick<DiscoveryCatalogBundle, 'catalog' | 'dossierRows'>,
): ResearchHubNode[] {
  const dossierRowsByKey = new Map(bundle.dossierRows.map((row) => [row.key, row]));
  const projections = sortHubProjections(
    projectDiscoveryItems(bundle.catalog.items, EMPTY_DISCOVERY_FILTERS),
  );

  const nodes: ResearchHubNode[] = [];
  for (const projection of projections) {
    const resolved = resolveHubNode(projection, dossierRowsByKey);
    if (!resolved) continue;
    const cockpitKey = resolved.projection.kind === 'dossier' ? resolved.projection.context.cockpitKey : null;
    nodes.push({
      key: projectionNodeKey(resolved.projection.itemId, cockpitKey),
      projection: resolved.projection,
      node: resolved.node,
    });
  }
  return nodes;
}

/** Builds a COMPLETE node bank — every projection a filter can ever select,
 *  not just each item's single default one (P1 merge-blocker fix, adversarial
 *  review of PR #122). `buildResearchHubNodes` above only ever resolves ONE
 *  projection per item (its default), so the client shell's `resolveEntry`
 *  (ResearchHub.tsx) — which looks a node up by
 *  `projectionNodeKey(itemId, cockpitKey)` for whatever projection the
 *  CURRENT filters actually picked — could miss:
 *
 *  1. A review-backed item whose default projection is a dossier: under
 *     `?type=review`, `projectDiscoveryItems` correctly still emits this
 *     item's REVIEW projection (spec: `filters.type === 'review'` only needs
 *     `item.review`), but the default-only bank never built a node keyed
 *     `projectionNodeKey(itemId, null)` for it — the item silently
 *     disappeared from the filtered view entirely.
 *  2. A second qualifying context on the SAME item (an explicit `topic`
 *     filter picking the item's OTHER Cockpit context): `computeDiscoveryFacets`
 *     counts it (it re-runs the real projection pipeline per candidate
 *     value), but no node was ever built for its `cockpitKey` — a facet chip
 *     could claim a result the shell then has nothing to render.
 *
 *  Resolves the review projection (whenever `item.review` exists) AND one
 *  dossier projection per `item.researchContexts` entry, through the exact
 *  same `resolveHubNode` used above — a missing dossier sidecar row still
 *  throws in development and degrades/drops in production identically. Never
 *  read for the SSR `BrowseFallback` or the JSON-LD — see this file's
 *  MERGE-BLOCKER INVARIANT note: `buildResearchHubNodes`'s own default-only
 *  list keeps driving both of those unchanged; this bank exists solely to
 *  give the CLIENT shell (`ResearchHub`'s `nodes` prop) a node for whatever
 *  it actually selects.
 *
 *  PAYLOAD DEDUPLICATION (2026-07-29) — `defaultNodes` is REQUIRED, not
 *  optional, and must be the very `buildResearchHubNodes(bundle)` list the
 *  caller also renders. React Flight deduplicates by OBJECT REFERENCE: a
 *  default card reached through `<Suspense fallback>`, `<ResearchHub
 *  browseFallback>` and `<ResearchHub nodes>` is written into the RSC payload
 *  ONCE and referenced thereafter — but only while all three see the same
 *  object. Building this bank from scratch broke that for every key the
 *  default list already covered, writing a second full copy of each default
 *  card into the payload: measured on the live standalone build as
 *  `/research` 1,161,259 -> 1,712,307 raw bytes (+47.4%), and +33% on
 *  UK/CA/AU, which have no extra projections at all — their entire growth was
 *  duplicated text. So every resolved key is looked up in `defaultNodes`
 *  first and that exact entry reused; only genuine EXTRAS get a fresh
 *  element. The parameter is deliberately not optional: an omittable one
 *  silently reinstates the duplication, and the resulting page is perfectly
 *  correct — same cards, same keys, same DOM — so nothing but a reference
 *  check would ever notice. See __tests__/unit/research-hub-schema.test.ts
 *  ("reuses the DEFAULT list's node objects by reference").
 *
 *  Reuse happens IN PLACE, inside the existing per-item iteration — the
 *  bank's order (per item: the review projection, then one dossier per
 *  `researchContexts` entry in manifest order) is unchanged, never
 *  re-sequenced into "all defaults first, extras appended". */
export function buildResearchNodeBank(
  bundle: Pick<DiscoveryCatalogBundle, 'catalog' | 'dossierRows'>,
  defaultNodes: readonly ResearchHubNode[],
): ResearchHubNode[] {
  const dossierRowsByKey = new Map(bundle.dossierRows.map((row) => [row.key, row]));
  const defaultsByKey = new Map(defaultNodes.map((entry) => [entry.key, entry]));
  const nodes: ResearchHubNode[] = [];
  const seenKeys = new Set<string>();

  const resolveAndPush = (projection: DiscoveryProjection): void => {
    // `resolveHubNode` runs even when a default already covers this key: the
    // key itself depends on the RESOLVED (possibly degraded) projection, so
    // it cannot be known before resolving, and re-deriving it any other way
    // would fork the degrade rule into a second implementation that can
    // drift. The discarded element is a plain object literal — created, never
    // rendered, never serialized.
    const resolved = resolveHubNode(projection, dossierRowsByKey);
    if (!resolved) return;
    const cockpitKey = resolved.projection.kind === 'dossier' ? resolved.projection.context.cockpitKey : null;
    const key = projectionNodeKey(resolved.projection.itemId, cockpitKey);
    // A dossier row that FAILS to resolve degrades to the item's review
    // projection (resolveHubNode's own production fallback) — which, for an
    // item this loop already visited (review pushed first, below), would
    // otherwise be pushed a second time under the identical review key.
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    // Reuse over rebuild (see the payload note above). A shared key always
    // describes the SAME resolved projection in both lists — both sides run
    // this identical `resolveHubNode`, degrade included — so this swaps
    // object identity only, never semantics.
    nodes.push(defaultsByKey.get(key) ?? { key, projection: resolved.projection, node: resolved.node });
  };

  for (const item of bundle.catalog.items) {
    if (item.review) {
      resolveAndPush({ itemId: item.id, kind: 'review', item, context: null });
    }
    for (const context of item.researchContexts) {
      resolveAndPush({ itemId: item.id, kind: 'dossier', item, context });
    }
  }

  return nodes;
}

/** Flattens `ResearchHubNode[]` into the plain, serializable shape
 *  `ResearchHub` (client) needs (spec §8): the `projection` field carried a
 *  `DiscoveryItem` and, for a dossier, a full `ResearchContext` — both
 *  perfectly fine to serialize, but `cockpitKey` alone is what the client
 *  needs to key its own node lookup by `projectionNodeKey(itemId, cockpitKey)`,
 *  so this is the minimal cut rather than sending the whole projection twice
 *  (once here, once inside `items` from the catalog). */
function buildClientHubNodes(nodes: readonly ResearchHubNode[]): ResearchHubNodeEntry[] {
  return nodes.map((entry) => ({
    key: entry.key,
    itemId: entry.projection.itemId,
    cockpitKey: entry.projection.kind === 'dossier' ? entry.projection.context.cockpitKey : null,
    node: entry.node,
  }));
}

// ── Audited-only JSON-LD (spec §7.4) ─────────────────────────────────────────

/** The single audited-only ItemList for this hub. Fed the SAME finalized
 *  projection list `buildResearchHubNodes` rendered from (see the file-level
 *  merge-blocker note) — never a separately re-filtered view of the catalog.
 *  A Cockpit-only audited product's URL mirrors ResearchCard's own primary
 *  href exactly (`compareBaseHref?compare=slug`), not the bare
 *  `compareBaseHref` — otherwise the ItemList would point at a URL that
 *  never actually appears as a link in that product's rendered card. */
export function buildResearchItemListSchema(
  market: Market,
  projections: readonly DiscoveryProjection[],
  copy: ResearchHubCopy,
) {
  const absoluteUrl = (path: string): string => new URL(path, BASE_URL).toString();
  const hubUrl = absoluteUrl(researchBaseForMarket(market));

  const seen = new Set<string>();
  const audited = projections.filter(
    (projection): projection is Extract<DiscoveryProjection, { kind: 'dossier' }> => {
      if (
        projection.kind !== 'dossier' ||
        projection.context.status !== 'audited' ||
        seen.has(projection.itemId)
      ) {
        return false;
      }
      seen.add(projection.itemId);
      return true;
    },
  );

  return generateComparisonItemListSchema({
    title: copy.h1,
    description: copy.description,
    url: hubUrl,
    id: `${hubUrl}#itemlist`,
    products: audited.map(({ item, context }) => ({
      name: item.display.title,
      ...(item.display.bestFor && { description: item.display.bestFor }),
      url: absoluteUrl(
        item.review?.href ?? `${context.compareBaseHref}?compare=${encodeURIComponent(context.productSlug)}`,
      ),
      areaServed: copy.areaServed,
    })),
  });
}

// ── Rendering helpers ────────────────────────────────────────────────────────

function HeroMetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3"
      style={{ borderColor: 'var(--sfp-hairline)', background: 'var(--sfp-gray)' }}
    >
      <div className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
        {label}
      </div>
    </div>
  );
}

/** Newest genuine `dataVerifiedAt` across every AUDITED research context in
 *  the catalog — never a fabricated freshness claim (spec §13).
 *  `dataVerifiedAt` is documented (VerificationStatus.tsx) as "ignored
 *  unless status === 'audited'" — a provisional context can legitimately
 *  carry a real collected-data date even though it failed the audit gate,
 *  so scanning every context regardless of status let a hub with ZERO
 *  audited products still show a fabricated "Updated {date}" claim sourced
 *  from a row that never cleared the bar. Requiring `status === 'audited'`
 *  here means an all-provisional/unavailable catalog correctly falls back
 *  to the caller's 'Pending' label. */
function newestVerifiedAt(catalog: DiscoveryCatalog): string | null {
  let newest: string | null = null;
  for (const item of catalog.items) {
    for (const context of item.researchContexts) {
      if (
        context.status === 'audited' &&
        context.dataVerifiedAt &&
        (newest === null || context.dataVerifiedAt > newest)
      ) {
        newest = context.dataVerifiedAt;
      }
    }
  }
  return newest;
}

export interface DossierGroup {
  cockpitKey: CockpitKey;
  topic: string;
  topicLabel: string;
  category: Category;
  /** data-testid for this group's <section> — see `dossierGroupTestId`
   *  (lib/research/catalog-shell-logic.ts) for the disambiguation rule. */
  testId: string;
  entries: ResearchHubNode[];
}

/** Groups dossier nodes by COCKPIT KEY (`market/category/topic`), never the
 *  bare topic string — BEST_X_MANIFEST genuinely reuses one topic name
 *  ("companies") across two different categories (credit-repair,
 *  debt-relief), and a bare-topic Map key silently merged both into one
 *  section under whichever entry's label was seen first (spec §4.1 already
 *  makes category part of a Cockpit-only item's identity for exactly this
 *  reason; this grouping now follows the same rule). Preserves manifest
 *  order — every row for one Cockpit key is already contiguous in
 *  `sortHubProjections`'s output (manifestOrder is the primary sort key and
 *  identical for every row of one Cockpit key), so first-seen order here
 *  already IS manifest order. Review-only nodes are returned separately for
 *  the trailing review grid. */
export function groupBrowseNodes(nodes: readonly ResearchHubNode[]): {
  dossierGroups: DossierGroup[];
  reviewEntries: ResearchHubNode[];
} {
  const dossierGroups: DossierGroup[] = [];
  const groupIndexByCockpitKey = new Map<CockpitKey, number>();
  const reviewEntries: ResearchHubNode[] = [];
  const ambiguousTopicsByMarket = new Map<Market, ReadonlySet<string>>();

  for (const entry of nodes) {
    if (entry.projection.kind !== 'dossier') {
      reviewEntries.push(entry);
      continue;
    }
    const { cockpitKey, topic, topicLabel } = entry.projection.context;
    let index = groupIndexByCockpitKey.get(cockpitKey);
    if (index === undefined) {
      index = dossierGroups.length;
      groupIndexByCockpitKey.set(cockpitKey, index);
      const category = entry.projection.item.category;
      const market = entry.projection.item.market;
      let ambiguousTopics = ambiguousTopicsByMarket.get(market);
      if (!ambiguousTopics) {
        ambiguousTopics = computeAmbiguousDossierTopics(market);
        ambiguousTopicsByMarket.set(market, ambiguousTopics);
      }
      dossierGroups.push({
        cockpitKey,
        topic,
        topicLabel,
        category,
        testId: dossierGroupTestId(topic, category, ambiguousTopics),
        entries: [],
      });
    }
    dossierGroups[index].entries.push(entry);
  }

  return { dossierGroups, reviewEntries };
}

/** The complete, unsliced browse fallback (spec §8): every qualified dossier
 *  node grouped by its Cockpit KEY, never the bare topic string (see
 *  `groupBrowseNodes` above) — each group keeps the stable
 *  `data-testid="dossier-<topic>"` scope the US trading-platforms pilot
 *  originated (spec DoD "bestehender US-Pilot bleibt mit neun
 *  Trading-Dossiers funktional") when its topic name is unique in-market, and
 *  falls back to `data-testid="dossier-<category>-<topic>"` only when
 *  BEST_X_MANIFEST reuses that topic name across categories (e.g.
 *  credit-repair vs. debt-relief "companies" — see `dossierGroupTestId`).
 *  Followed by one review grid for every review-backed item not already
 *  shown in a dossier section. Never sliced or paginated. */
function BrowseFallback({ nodes }: { nodes: ResearchHubNode[] }) {
  const { dossierGroups, reviewEntries } = groupBrowseNodes(nodes);

  return (
    <>
      {dossierGroups.map((group) => {
        const featured = group.entries.find(
          (entry) =>
            entry.projection.kind === 'dossier' &&
            entry.projection.context.status === 'audited' &&
            entry.projection.context.auditedRank === 1,
        );
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

// ── Page body (pure — I/O already resolved by the caller) ──────────────────

export interface ResearchHubBodyProps {
  market: Market;
  catalog: DiscoveryCatalog;
  copy: ResearchHubCopy;
  /** The DEFAULT (unfiltered) list — drives the SSR `BrowseFallback` and the
   *  JSON-LD ItemList ONLY. Never the source for the client shell's own node
   *  lookup; see `nodeBank` below (P1 merge-blocker fix). */
  nodes: ResearchHubNode[];
  /** EVERY selectable projection's node (P1 merge-blocker fix) — fed to
   *  `<ResearchHub>`'s `nodes` prop so a filter (`?type=review`, an explicit
   *  `topic` picking a second context) always has a node to render, not just
   *  each item's single default projection. Defaults to `[]` so the existing
   *  fixture-driven unit tests that construct `ResearchHubBodyProps` by hand
   *  (predating this field) keep compiling unchanged — production always
   *  supplies it via `ResearchHubPage`'s `buildResearchNodeBank`. */
  nodeBank?: ResearchHubNode[];
  /** Server-built, serializable shortlist scope snapshot (spec §11.2.1,
   *  operator ONE-FAN-OUT merge-blocker fix 2026-07-27) — from
   *  `getDiscoveryCatalogBundle(market).scopeSnapshot`, the SAME single
   *  per-topic load `catalog`/`nodes` were also built from. Threaded straight
   *  through to `<ResearchHub>` (non-empty branch) or
   *  `<ShortlistRestoreController>` (empty branch) — never re-derived here. */
  scopeSnapshot: ShortlistScopeSnapshotDTO;
}

/** Renders the whole hub given already-fetched data — separated from
 *  `ResearchHubPage` so unit tests (e.g. the empty-catalog case) can render
 *  it directly from a fixture bundle, without exercising the real
 *  'server-only' catalog I/O. */
export function ResearchHubBody({ market, catalog, copy, nodes, nodeBank, scopeSnapshot }: ResearchHubBodyProps) {
  const homeHref = market === 'us' ? '/' : `/${market}`;

  if (catalog.items.length === 0) {
    return (
      <article data-research-market={market}>
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto px-6 pb-10 pt-6 sm:pb-14 sm:pt-8" style={{ maxWidth: '1280px' }}>
            <Breadcrumb items={[{ label: 'Home', href: homeHref }, { label: 'Research' }]} />
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--sfp-navy)' }}>
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl lg:text-5xl" style={{ color: 'var(--sfp-ink)' }}>
              {copy.h1}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
              {marketConfig[market].name} research is on its way — no verified dossiers or reviews are
              published for this market yet. Check back soon.
            </p>
          </div>
        </section>
        {/* MERGE-BLOCKER FIX (operator, 2026-07-27): a market-wide-empty
            catalog is not evidence that every scope is stale — a topic can
            legitimately have loaded fine with zero qualifying products right
            now (spec §11.2.1 Rule 4, which must still clear a stored
            shortlist for it) or be temporarily unverifiable (Rule 2, which
            must NOT touch storage). This branch used to `return` before ever
            reaching `<ResearchHub>` — the only place that mounted the
            shortlist restore effect — silently disabling that cleanup for as
            long as the market stayed empty. The full interactive
            `ResearchHub` shell has nothing to show here and needs a Router
            context this page never provides on its own, so only the
            restore-only controller mounts. */}
        <ShortlistRestoreController market={market} scopeSnapshot={scopeSnapshot} />
      </article>
    );
  }

  const auditedCount = catalog.counts.auditedItemCount;
  const totalCount = catalog.counts.discoveryItemCount;
  const verifiedDataPoints = catalog.counts.verifiedDataPointCount;
  const updatedIso = newestVerifiedAt(catalog);
  const updatedLabel = updatedIso ? formatVerifiedDate(updatedIso) : 'Pending';

  return (
    <article data-research-market={market} style={{ background: 'var(--sfp-gray)' }} className="min-h-screen">
      {nodes.length > 0 &&
        (() => {
          const schema = buildResearchItemListSchema(
            market,
            nodes.map((entry) => entry.projection),
            copy,
          );
          return schema.numberOfItems > 0 ? (
            <script
              type="application/ld+json"
              // Escape "<" so an editorial field (title/bestFor) that ever
              // contained "</script>" or "<" can't break out of the tag.
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
            />
          ) : null;
        })()}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto px-6 pb-6 pt-6 sm:pb-10 sm:pt-8" style={{ maxWidth: '1280px' }}>
          <Breadcrumb items={[{ label: 'Home', href: homeHref }, { label: 'Research' }]} />

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--sfp-navy)' }}>
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl lg:text-5xl" style={{ color: 'var(--sfp-ink)' }}>
            {copy.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {copy.description}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-4">
            <HeroMetricTile value={String(totalCount)} label="Products" />
            <HeroMetricTile value={String(auditedCount)} label="Audited" />
            <HeroMetricTile value={String(verifiedDataPoints)} label="Verified data points" />
            <HeroMetricTile value={updatedLabel} label="Updated" />
          </div>
        </div>
      </section>

      <Suspense fallback={<BrowseFallback nodes={nodes} />}>
        <ResearchHub
          market={market}
          items={catalog.items}
          nodes={buildClientHubNodes(nodeBank ?? [])}
          browseFallback={<BrowseFallback nodes={nodes} />}
          scopeSnapshot={scopeSnapshot}
        />
      </Suspense>

      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto px-6 py-10" style={{ maxWidth: '1280px' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
            How we score
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {auditedCount} of {totalCount} products above carry an audited BEST-X score: an editorial
            0–10 rating with a documented confidence level, where every key fact shown on a card is
            backed by a dated, named source. Commercial relationships never influence a score or a
            ranking.{' '}
            {/* textDecoration inline, not just the `underline` class: this
                section is wrapped in <article>, and globals.css strips the
                underline from internal links inside article/.prose (restoring
                it only on :hover). Navy against the surrounding slate is a
                1.08:1 contrast, far below the 3:1 a link needs to be
                identifiable by colour alone (WCAG 1.4.1) — an inline style
                outranks that stylesheet rule (axe: link-in-text-block). */}
            <Link
              href="/methodology"
              className="underline"
              style={{ color: 'var(--sfp-navy)', textDecoration: 'underline' }}
            >
              Read the full methodology
            </Link>
            .
          </p>
          <p className="mt-4 text-xs" style={{ color: 'var(--sfp-slate)' }}>
            Advertising disclosure: some links on this page may earn us a commission at no cost to
            you — it never affects our rankings.{' '}
            <Link
              href="/affiliate-disclosure"
              className="underline"
              style={{ color: 'var(--sfp-navy)', textDecoration: 'underline' }}
            >
              Details
            </Link>
          </p>
        </div>
      </section>
    </article>
  );
}

// ── Server entry point (I/O) ─────────────────────────────────────────────────

export async function ResearchHubPage({ market }: { market: Market }) {
  const [bundle, copy] = await Promise.all([
    getDiscoveryCatalogBundle(market),
    Promise.resolve(getResearchHubCopy(market)),
  ]);
  const nodes = buildResearchHubNodes(bundle);
  // `nodes` is passed in so the bank can reuse those exact node objects for
  // every key it shares with them — the Flight payload then carries each
  // default card once instead of twice (see buildResearchNodeBank's own note).
  const nodeBank = buildResearchNodeBank(bundle, nodes);
  return (
    <ResearchHubBody
      market={market}
      catalog={bundle.catalog}
      copy={copy}
      nodes={nodes}
      nodeBank={nodeBank}
      scopeSnapshot={bundle.scopeSnapshot}
    />
  );
}
