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
// switch dialog.
//
// Analytics (Task 6; spec §12) also live here — the ONLY client entry point
// for every card in the tree, since ResearchCard/CatalogCard stay Server
// Components. Two DELEGATED-listener wrappers (`TrackedCard`,
// `HandoffTrackingBoundary`) close that gap without turning either card type
// into a client component — same pattern the pilot's `SelectableCard`
// established (components/research/ResearchLibrary.tsx): a `click` listener
// compares the nearest `<a>`'s href against the ONE href this wrapper was
// told about, and a `toggle` listener (bound in the CAPTURE phase — native
// `toggle` doesn't bubble) fires only for `<details data-research-evidence>`,
// open only. The hub tracker itself binds `topic: 'hub'` for its whole
// lifetime (the two GLOBAL events, search + the hub-wide filter chips, keep
// that); every ITEM event (review click, evidence open, shortlist change,
// Cockpit handoff) overrides `topic`/`category` per call from the entry (or
// the shortlist's scoped cockpitKey) it actually concerns — never the bound
// 'hub' value — so the two same-named `companies` topics
// (`us/credit-repair` vs `us/debt-relief`) stay analytically separable.
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { useResearchTracking } from '@/lib/analytics/research-tracking';
import { toQueryLength, type ResearchFacet, type ResearchProductStatus } from '@/lib/analytics/research-events';
import { schedulePush } from '@/lib/research/deferred-navigation';

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
  // The item's REAL category (`DiscoveryItem.category`) — set for EVERY
  // entry, dossier or review (P1 fix, adversarial review of PR #122: a
  // review-kind entry used to hardcode this `null`, following the same
  // pattern as `cockpitKey`/`productSlug`/`displayName` below — but unlike
  // those three, which genuinely don't exist for a plain review with no
  // Cockpit product, `category` always does; every `DiscoveryItem` has one).
  // Also needed (alongside `topic`) to compute a DOSSIER entry's group's
  // disambiguated data-testid (`dossierGroupTestId`) without re-deriving it
  // from `cockpitKey` — `groupResolvedEntries` below still gates that
  // grouping on `kind === 'dossier'` first, so a review entry's now-real
  // `category` never routes it into a dossier group.
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
  // ── Analytics (Task 6; spec §12) — all optional so the hand-built fixture
  // in __tests__/unit/research-hub-dossier-grouping.test.ts (predates this
  // field set and constructs `ResolvedEntry`-shaped literals directly,
  // without going through `resolveEntry`) keeps type-checking unchanged.
  // `resolveEntry` itself always sets every one of them.
  /** Cockpit verification status for research_review_click/research_evidence_open
   *  — mirrors `context.status` for a dossier entry; 'unavailable' for a
   *  review-kind entry (no Cockpit dossier data exists for it at all). */
  status?: ResearchProductStatus;
  /** Mirrors `context.auditedRank`; null for a review-kind entry. */
  rank?: number | null;
  /** Mirrors `context.dataPoints`; 0 for a review-kind entry — a CatalogCard
   *  never renders an evidence disclosure, so this never surfaces there. */
  dataPoints?: number;
  /** The card's own review link (`item.review?.href`) — used ONLY by the
   *  delegated click listener below to tell a genuine review click apart
   *  from a card's other links (Compare, methodology, provider, evidence
   *  source). The SAME value CatalogCard/ResearchCard render as their own
   *  primary CTA. Null when the item has no review at all. */
  reviewHref?: string | null;
  /** The identifier reported on research_review_click/research_evidence_open
   *  — the Cockpit product slug for a dossier entry, or the review's own MDX
   *  slug for a review-kind entry (there is no Cockpit product to name). */
  analyticsProductSlug?: string;
}

/** Resolves one projection to its already-built opaque node, applying the
 *  dossier→review degrade rule described in the file header. Returns `null`
 *  when even the degraded lookup misses (the projection is dropped, not
 *  shown broken). Exported for direct unit coverage of the P1 category fix
 *  (__tests__/unit/research-hub-tracking.test.ts) — the analytics fields this
 *  function sets are otherwise only reachable by rendering the whole
 *  `ResearchHub` client component. */
export function resolveEntry(
  projection: DiscoveryProjection,
  nodeByKey: ReadonlyMap<string, ReactNode>,
): ResolvedEntry | null {
  if (projection.kind === 'review') {
    const key = projectionNodeKey(projection.itemId, null);
    const node = nodeByKey.get(key);
    // A 'review' kind projection is only ever built when `item.review` is
    // non-null (projectDiscoveryItems, lib/research/catalog-shell-logic.ts)
    // — safe to read directly for the analytics fields below.
    return node
      ? {
          key,
          kind: 'review',
          topic: null,
          topicLabel: null,
          // The item's REAL category — P1 fix (adversarial review of PR
          // #122): this used to hardcode `null`, which dropped
          // research_review_click's `category` for every review-kind entry
          // (e.g. a review filtered into view via `?type=review`), even
          // though `DiscoveryItem.category` always has a real value. `topic`
          // stays `null` — a plain review genuinely has no Cockpit topic.
          category: projection.item.category,
          isFeatured: false,
          node,
          cockpitKey: null,
          productSlug: null,
          displayName: null,
          status: 'unavailable',
          rank: null,
          dataPoints: 0,
          reviewHref: projection.item.review?.href ?? null,
          analyticsProductSlug: projection.item.review?.slug,
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
      status: context.status,
      rank: context.auditedRank,
      dataPoints: context.dataPoints,
      reviewHref: item.review?.href ?? null,
      analyticsProductSlug: context.productSlug,
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
        // Same P1 fix as the top branch above — the item's real category,
        // never a hardcoded `null`.
        category: projection.item.category,
        isFeatured: false,
        node: reviewNode,
        cockpitKey: null,
        productSlug: null,
        displayName: null,
        status: 'unavailable',
        rank: null,
        dataPoints: 0,
        reviewHref: projection.item.review.href,
        analyticsProductSlug: projection.item.review.slug,
      };
    }
  }

  return null;
}

// ── Analytics wrappers (Task 6; spec §12) ───────────────────────────────────
// See the file header for why these exist: ResearchCard/CatalogCard are
// Server Components with no onClick, so a DELEGATED listener on a thin client
// wrapper is the only way to measure their interactions — the exact pattern
// the pilot's SelectableCard established (components/research/ResearchLibrary.tsx).

/** Wraps an already-built card node with delegated `click`/`toggle` listeners
 *  for research_review_click / research_evidence_open. `click` -> nearest
 *  `<a>`, counted only when its href equals THIS entry's own `reviewHref` (so
 *  Compare / provider / evidence-source / methodology links on the SAME card
 *  never count — they never share that href). `toggle` is bound in the
 *  CAPTURE phase (native `toggle` doesn't bubble) and fires only for
 *  `<details data-research-evidence>` (EvidenceDisclosure.tsx's own marker),
 *  open only — the featured card's separate "Score breakdown" `<details>`
 *  has no such marker and is correctly ignored. */
function TrackedCard({
  node,
  reviewHref,
  onReviewClick,
  onEvidenceOpen,
}: {
  node: ReactNode;
  reviewHref: string | null;
  onReviewClick: () => void;
  onEvidenceOpen: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Latest-value ref so the listeners bind exactly ONCE per card while still
  // calling the current handlers (position/status/etc. can change on re-render).
  const latest = useRef({ reviewHref, onReviewClick, onEvidenceOpen });
  useEffect(() => {
    latest.current = { reviewHref, onReviewClick, onEvidenceOpen };
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleClick = (event: Event) => {
      try {
        const href = latest.current.reviewHref;
        if (!href) return;
        const anchor = (event.target as Element | null)?.closest?.('a');
        if (!anchor || anchor.getAttribute('href') !== href) return;
        latest.current.onReviewClick();
      } catch {
        /* fail-soft — tracking must never break a navigation */
      }
    };

    const handleToggle = (event: Event) => {
      try {
        const details = event.target as HTMLDetailsElement | null;
        if (!details?.hasAttribute?.('data-research-evidence')) return;
        if (details.open) latest.current.onEvidenceOpen(); // open only, never close
      } catch {
        /* fail-soft */
      }
    };

    el.addEventListener('click', handleClick);
    el.addEventListener('toggle', handleToggle, true); // capture: toggle doesn't bubble
    return () => {
      el.removeEventListener('click', handleClick);
      el.removeEventListener('toggle', handleToggle, true);
    };
  }, []);

  return <div ref={containerRef}>{node}</div>;
}

/** Delegated click tracking for the Cockpit handoff. `ShortlistBar`'s
 *  "Compare in the cockpit" anchor (components/research/ResearchShortlist.tsx)
 *  is a plain `<a href>` with no onClick of its own — that file is not part
 *  of this task's change set — so this wraps it the same way `TrackedCard`
 *  wraps a server-rendered card: click -> nearest `<a>`, counted only when
 *  its href equals the shortlist's OWN `compareUrl`. Fires IMMEDIATELY
 *  (contract: the page is navigating away) and never calls
 *  `preventDefault()`, so the real navigation is untouched. */
function HandoffTrackingBoundary({
  compareUrl,
  onHandoff,
  children,
}: {
  compareUrl: string | null;
  onHandoff: () => void;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ compareUrl, onHandoff });
  useEffect(() => {
    latest.current = { compareUrl, onHandoff };
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleClick = (event: Event) => {
      try {
        const href = latest.current.compareUrl;
        if (!href) return;
        const anchor = (event.target as Element | null)?.closest?.('a');
        if (!anchor || anchor.getAttribute('href') !== href) return;
        latest.current.onHandoff();
      } catch {
        /* fail-soft */
      }
    };
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

/** A `CockpitKey` is literally `${market}/${category}/${topic}`
 *  (`cockpitKeyFor`, lib/research/catalog-shell-logic.ts) — the shortlist's
 *  scoped cockpitKey is the only handle `ShortlistBar`'s handoff/remove/clear
 *  actions carry, so this recovers the real `topic`/`category` item
 *  dimensions (spec §12) from it directly rather than re-scanning `items`
 *  (which may no longer even contain the scoped product under the current
 *  filters). `market` is always the caller's own bound market — a shortlist
 *  is never cross-market. */
function dimensionsForCockpitKey(
  cockpitKey: CockpitKey,
  market: Market,
): { topic: string; category: Category } {
  const rest = cockpitKey.slice(market.length + 1);
  const slashIndex = rest.indexOf('/');
  return { category: rest.slice(0, slashIndex) as Category, topic: rest.slice(slashIndex + 1) };
}

/** The click/evidence-open tracking dimensions for one resolved entry (P1
 *  fix, adversarial review of PR #122): `dossierDimensions` (the
 *  topic+category pair `resolveEntry`'s dossier branch always builds) when
 *  present, else — for a review-kind entry — `{category: entry.category}`
 *  alone. A review-kind entry has no dossier `topic` (there is no Cockpit
 *  context to name), but DOES have a real `category` (`resolveEntry` sets it
 *  from `DiscoveryItem.category`, which is never null) — before this fix,
 *  `entriesForRender` only ever spread the dossier-strict pair, so ANY
 *  review-kind click/evidence-open event silently reported no `category` at
 *  all, even for e.g. a credit-repair review shown under `?type=review`.
 *  Exported for direct unit coverage
 *  (__tests__/unit/research-hub-tracking.test.ts). */
export function trackedDimensionsFor(
  entry: Pick<ResolvedEntry, 'category'>,
  dossierDimensions: { topic: string; category: Category } | undefined,
): Partial<{ topic: string; category: Category }> {
  if (dossierDimensions) return dossierDimensions;
  return entry.category ? { category: entry.category } : {};
}

/** What (if anything) a shortlist toggle click should report IMMEDIATELY
 *  (P1 fix, adversarial review of PR #122, spec §12/§11.3). Pure — mirrors
 *  `useScopedResearchShortlist`'s OWN "effective active key" reasoning
 *  (`cockpitKey ?? unverifiableCockpitKey`) so a toggle away from a
 *  restored-but-currently-UNVERIFIABLE scope (Rule 2/2b) is recognized as a
 *  genuine cross-scope switch — never as "no scope active, apply
 *  immediately". Before this fix, `handleShortlistToggle` checked the bare
 *  (always-`null`-while-unverifiable) `shortlist.cockpitKey` alone, so it
 *  fired a wrong 'add' event the instant the dialog opened — before the
 *  user confirmed anything — and a subsequent Cancel left that false event
 *  standing with nothing to correct it. */
export function resolveShortlistToggleAnalytics(
  selected: boolean,
  effectiveCockpitKey: CockpitKey | null,
  targetCockpitKey: CockpitKey,
): { kind: 'remove' } | { kind: 'add' } | { kind: 'pending' } {
  if (selected) return { kind: 'remove' };
  if (effectiveCockpitKey === null || effectiveCockpitKey === targetCockpitKey) return { kind: 'add' };
  return { kind: 'pending' };
}

/** The ordered `research_shortlist_change` calls a CONFIRMED cross-scope
 *  switch should report (P1 fix, adversarial review of PR #122, spec §12):
 *  `clear` for the OLD scope (when one was genuinely active — available or
 *  merely unverifiable) followed by `add` for the target, in that order.
 *  Before this fix `handleConfirmSwitch` only ever emitted the `add` half —
 *  the contract's own `clear(old)` + `add(target)` pair was never complete.
 *  Pure — takes the already-resolved old-scope dimensions (or `null` when
 *  there was no real prior scope) rather than a `CockpitKey`, so this stays
 *  free of `dimensionsForCockpitKey`/`market` and is directly unit-testable. */
export function resolveConfirmSwitchAnalytics(
  previousCockpitKey: CockpitKey | null,
  previousDimensions: { topic: string; category: Category } | null,
  pending: { productSlug: string; dimensions: { topic: string; category: Category } },
): Array<{
  action: 'clear' | 'add';
  productSlug: string | null;
  count: number;
  dimensions: { topic: string; category: Category };
}> {
  const events: Array<{
    action: 'clear' | 'add';
    productSlug: string | null;
    count: number;
    dimensions: { topic: string; category: Category };
  }> = [];
  if (previousCockpitKey && previousDimensions) {
    events.push({ action: 'clear', productSlug: null, count: 0, dimensions: previousDimensions });
  }
  // confirm-switch always lands on exactly the one requested slug
  // (shortlistReducer, components/research/ResearchShortlist.tsx) — the
  // resulting count is always 1, never derived from the prior scope's size.
  events.push({ action: 'add', productSlug: pending.productSlug, count: 1, dimensions: pending.dimensions });
  return events;
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

  // research_v1 (docs/research-library/analytics-research-v1.md, spec §12) —
  // bound ONCE for the hub's whole lifetime with topic: 'hub'. The two GLOBAL
  // events (search, the hub-wide filter chips) keep that bound topic as-is;
  // every ITEM event below overrides topic/category per call via
  // ResearchTrackOptions — see the file header. Fail-soft by construction;
  // the raw query never leaves the browser (only its length).
  const tracker = useResearchTracking({ market, topic: 'hub', pagePath: pathname });

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

  // NOT a style choice and NOT removable: a `router.push()` issued
  // SYNCHRONOUSLY from inside a discrete click handler is silently DROPPED by
  // the Next 16 App Router when the click lands in the first ~100–200 ms after
  // the router mounted. The action is dispatched and the navigation's own RSC
  // request is issued and answered 200 — but the router never commits the new
  // canonical URL: no history entry, `useSearchParams()` never changes, so the
  // chip never becomes pressed and the results never filter. It never
  // recovers, and a second click is lost the same way; only a reload does.
  // Because every filter on this hub is URL-derived, that leaves the whole
  // discovery UI dead for a fast clicker.
  //
  // Handing the push to the next task dodges it. Measured on a production
  // build, one worker, 111 clicks per arm at the same click timing (p50 121 ms
  // after router mount): 10 lost navigations (9.0%) issuing the push inline,
  // 0 issuing it deferred. e2e/research-filter-chip-navigation.spec.ts is the
  // regression guard and fails within a few iterations if this is inlined
  // again. Only the push is deferred — the target URL and the analytics event
  // are still computed synchronously from the click's own state, so nothing
  // about ordering or the reported counts changes.
  //
  // The scheduling itself (defer by exactly one task, exactly once, same
  // href) is factored into `schedulePush` (lib/research/deferred-navigation.ts)
  // so that contract has a deterministic unit test — this component is not
  // unit-testable directly (no jsdom/RTL in this repo). `{ scroll: false }`
  // stays here, bound into the `push` callback, not in that helper.
  const pushUrl = useCallback(
    (href: string) => {
      schedulePush((h) => router.push(h, { scroll: false }), href);
    },
    [router],
  );

  // Facet toggle: router.push() (a NEW history entry), so Back after a chip
  // click undoes just that chip, never the settled search underneath it.
  // `tracked` is set for every facet research_v1 measures — originally just
  // status/confidence/fresh (Task 6); `category`/`type` joined additively
  // (PR 5 gap-close, ResearchFacet — lib/analytics/research-events.ts) once
  // the frozen-but-additive contract grew a legal facet value for them. The
  // result count is computed for the FILTER'S OWN next state (not read from
  // `resultCount`, which describes the CURRENT render) — mirrors the pilot's
  // `setParam` (components/research/ResearchLibrary.tsx).
  const applyFacet = useCallback(
    (partial: Partial<DiscoveryFilters>, tracked?: { facet: ResearchFacet; value: string | null }) => {
      const next: DiscoveryFilters = { ...activeFilters, ...partial };
      if (tracked) {
        const nextCount = projectDiscoveryItems(items, next).length;
        tracker.trackFilterChange(tracked.facet, tracked.value, tracked.value !== null, nextCount, {
          surface: 'hub',
        });
      }
      const qs = buildDiscoverySearchParams(next).toString();
      pushUrl(qs ? `${pathname}?${qs}` : pathname);
    },
    [activeFilters, pathname, pushUrl, items, tracker],
  );

  const resetAll = useCallback(() => {
    setQuery('');
    pushUrl(pathname);
  }, [pathname, pushUrl]);

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

  // Settled-query write: debounced router.replace() (mutates the CURRENT
  // history entry, so typing never spams Back) — the only place `q` is
  // written to the URL, and the only place research_search fires. Declared
  // AFTER `resultCount` (pilot precedent, components/research/ResearchLibrary.tsx)
  // so the settled query's own result count is the one read from the render
  // that produced it — the debounce already restarts on every keystroke
  // (`query`/`filters` below), so `resultCount` closing over the FINAL
  // (settled) render's value is exactly the point, not a race. The tracker's
  // own trackSearch drops a zero-length query itself (contract), so no
  // separate empty-query guard is needed here.
  useEffect(() => {
    const nextQuery = query.trim();
    if (nextQuery === filters.query) return;
    const id = setTimeout(() => {
      tracker.trackSearch(toQueryLength(nextQuery), resultCount, { surface: 'hub' });
      const next: DiscoveryFilters = { ...filters, query: nextQuery };
      const qs = buildDiscoverySearchParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [query, filters, pathname, router, resultCount, tracker]);

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

  // research_shortlist_change for a CROSS-scope toggle (spec §11.3) can't be
  // tracked at click time — nothing has actually changed yet, only a switch
  // dialog is requested (or, rarely, a silent no-op if the target scope has
  // gone `unavailable` mid-session; either way, an event now would describe a
  // mutation that didn't happen). Remembers the ONE pending target between
  // the toggle click and the dialog's own confirm/cancel — overwritten by a
  // later cross-scope click, cleared on cancel, matching the reducer's own
  // "latest request wins" pendingSwitch semantics.
  const pendingSwitchTrackingRef = useRef<{
    productSlug: string;
    dimensions: { topic: string; category: Category };
  } | null>(null);

  const handleShortlistToggle = useCallback(
    (cockpitKey: CockpitKey, productSlug: string, dimensions: { topic: string; category: Category }) => {
      const { selected } = shortlist.cardState(cockpitKey, productSlug);
      // Effective active key (mirrors the hook's own toggle()/confirmSwitch()
      // reasoning) — a restored-but-currently-unverifiable scope (Rule 2/2b)
      // must still be recognized as "a scope IS active", or a toggle away
      // from it misreads as a fresh/same-scope add (P1 fix, adversarial
      // review of PR #122).
      const effectiveCockpitKey = shortlist.cockpitKey ?? shortlist.unverifiableCockpitKey;
      const decision = resolveShortlistToggleAnalytics(selected, effectiveCockpitKey, cockpitKey);
      if (decision.kind === 'remove') {
        // Removing FROM the active scope is always same-scope and immediate
        // — deterministic, no ambiguity.
        tracker.trackShortlistChange('remove', productSlug, shortlist.slugs.length - 1, {
          ...dimensions,
          kind: 'dossier',
        });
      } else if (decision.kind === 'add') {
        // A same-(or fresh-)scope add. The full-capacity block is a disabled
        // button (ShortlistToggleCard) — onToggle never fires for it, so
        // reaching this branch always means the add actually applies.
        tracker.trackShortlistChange('add', productSlug, shortlist.slugs.length + 1, {
          ...dimensions,
          kind: 'dossier',
        });
      } else {
        // Cross-scope: toggle() below will request the switch dialog (or, if
        // the target scope is unavailable, silently no-op) — remember the
        // target for the dialog's own confirm handler; nothing tracked yet
        // (P1 fix: no premature event, so a Cancel has nothing false to
        // leave behind).
        pendingSwitchTrackingRef.current = { productSlug, dimensions };
      }
      shortlist.toggle(cockpitKey, productSlug);
    },
    [shortlist, tracker],
  );

  const handleConfirmSwitch = useCallback(() => {
    const pending = pendingSwitchTrackingRef.current;
    pendingSwitchTrackingRef.current = null;
    if (pending) {
      // P1 fix (adversarial review of PR #122): report the OLD scope's
      // `clear` before the target's `add` — the full contract pair, not just
      // the `add` half. Read BEFORE `shortlist.confirmSwitch()` runs, so
      // this always reflects the scope that's actually about to be replaced
      // (available or merely unverifiable — either way a real prior scope).
      const previousCockpitKey = shortlist.cockpitKey ?? shortlist.unverifiableCockpitKey;
      const previousDimensions = previousCockpitKey ? dimensionsForCockpitKey(previousCockpitKey, market) : null;
      for (const event of resolveConfirmSwitchAnalytics(previousCockpitKey, previousDimensions, pending)) {
        tracker.trackShortlistChange(event.action, event.productSlug, event.count, {
          ...event.dimensions,
          kind: 'dossier',
        });
      }
    }
    shortlist.confirmSwitch();
  }, [shortlist, tracker, market]);

  const handleCancelSwitch = useCallback(() => {
    pendingSwitchTrackingRef.current = null;
    shortlist.cancelSwitch();
  }, [shortlist]);

  const handleRemoveSlug = useCallback(
    (slug: string) => {
      if (shortlist.cockpitKey) {
        tracker.trackShortlistChange('remove', slug, shortlist.slugs.length - 1, {
          ...dimensionsForCockpitKey(shortlist.cockpitKey, market),
          kind: 'dossier',
        });
      }
      shortlist.removeSlug(slug);
    },
    [shortlist, tracker, market],
  );

  const handleClearAll = useCallback(() => {
    if (shortlist.cockpitKey) {
      tracker.trackShortlistChange('clear', null, 0, {
        ...dimensionsForCockpitKey(shortlist.cockpitKey, market),
        kind: 'dossier',
      });
    }
    shortlist.clearAll();
  }, [shortlist, tracker, market]);

  const handleCockpitHandoff = useCallback(() => {
    if (!shortlist.cockpitKey) return;
    tracker.trackCockpitHandoff(shortlist.slugs, {
      ...dimensionsForCockpitKey(shortlist.cockpitKey, market),
      kind: 'dossier',
    });
  }, [shortlist, tracker, market]);

  // Every entry is first wrapped with the delegated review-click/evidence-open
  // listener (TrackedCard; Task 6), THEN — for a dossier entry only — with the
  // shortlist toggle (Task 5). `DefaultResults`/`FilteredResults` stay plain
  // layout components aware of neither. `position` is the entry's 1-based
  // index in this FULL resolved/ordered list (research_v1 contract's
  // `position` — the same order both grouped views render, just laid out
  // differently), computed BEFORE grouping so it never depends on which
  // dossier section a card lands in.
  const entriesForRender: ResolvedEntry[] = resolvedEntries.map((entry, index) => {
    const position = index + 1;
    const status: ResearchProductStatus = entry.status ?? 'unavailable';
    const rank = entry.rank ?? null;
    const dataPoints = entry.dataPoints ?? 0;
    const analyticsSlug = entry.analyticsProductSlug ?? entry.key;
    // Dossier-STRICT dimensions — used ONLY to gate the shortlist toggle
    // below (a shortlist entry always needs a real topic+cockpitKey), never
    // for click/evidence tracking (see `trackedDimensionsFor`).
    const itemDimensions: { topic: string; category: Category } | undefined =
      entry.kind === 'dossier' && entry.topic && entry.category
        ? { topic: entry.topic, category: entry.category }
        : undefined;
    // Click/evidence tracking dimensions (P1 fix, adversarial review of PR
    // #122): a review-kind entry has no dossier `topic`, but DOES have a
    // real `category` now that `resolveEntry` no longer hardcodes it `null`
    // — `trackedDimensionsFor` surfaces that category-only shape instead of
    // dropping it just because the dossier-strict `itemDimensions` above is
    // `undefined` for it.
    const trackedDimensions = trackedDimensionsFor(entry, itemDimensions);

    const trackedNode = (
      <TrackedCard
        node={entry.node}
        reviewHref={entry.reviewHref ?? null}
        onReviewClick={() =>
          tracker.trackReviewClick(analyticsSlug, status, rank, position, { ...trackedDimensions, kind: entry.kind })
        }
        onEvidenceOpen={() =>
          tracker.trackEvidenceOpen(analyticsSlug, status, dataPoints, { ...trackedDimensions, kind: entry.kind })
        }
      />
    );

    if (entry.kind !== 'dossier' || !entry.cockpitKey || !entry.productSlug || !itemDimensions) {
      return { ...entry, node: trackedNode };
    }
    const cockpitKey = entry.cockpitKey;
    const productSlug = entry.productSlug;
    const dimensions = itemDimensions;
    const { selected, disabled } = shortlist.cardState(cockpitKey, productSlug);
    return {
      ...entry,
      node: (
        <ShortlistToggleCard
          name={entry.displayName ?? productSlug}
          node={trackedNode}
          selected={selected}
          disabled={disabled}
          onToggle={() => handleShortlistToggle(cockpitKey, productSlug, dimensions)}
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
                onChange={(value) =>
                  applyFacet({ category: value as Category | null }, { facet: 'category', value })
                }
              />
              <FilterChips
                label="Type"
                value={activeFilters.type}
                options={facets.types.map((entry) => ({
                  value: entry.value,
                  label: TYPE_LABEL[entry.value],
                  count: entry.count,
                }))}
                onChange={(value) => applyFacet({ type: value as DiscoveryKind | null }, { facet: 'type', value })}
              />
              <FilterChips
                label="Status"
                value={activeFilters.status}
                options={facets.statuses.map((entry) => ({
                  value: entry.value,
                  label: STATUS_LABEL[entry.value],
                  count: entry.count,
                }))}
                onChange={(value) =>
                  applyFacet({ status: value as ResearchStatus | null }, { facet: 'status', value })
                }
              />
              <FilterChips
                label="Confidence"
                value={activeFilters.confidence}
                options={facets.confidences.map((entry) => ({
                  value: entry.value,
                  label: CONFIDENCE_LABEL[entry.value],
                  count: entry.count,
                }))}
                onChange={(value) =>
                  applyFacet({ confidence: value as ResearchConfidence | null }, { facet: 'confidence', value })
                }
              />
              <FilterChips
                label="Verified since"
                value={activeFilters.fresh}
                options={[...facets.freshnessDates]
                  .reverse()
                  .map((entry) => ({ value: entry.value, label: formatVerifiedDate(entry.value), count: entry.count }))}
                onChange={(value) => applyFacet({ fresh: value }, { facet: 'fresh', value })}
              />
            </div>
          )}

          {/* Permanently-mounted SR live region (spec Task 4: never mounted
              conditionally) — the visible count below is aria-hidden so the
              result count is announced exactly once.
              `data-testid="research-result-count"` (PR 3 review fix, commit
              4): a stable e2e selector — the app also mounts a Sonner
              toaster (components/ui/sonner.tsx) with its own
              `aria-live="polite"` region on every page, so a bare aria-live
              selector needs either DOM-order luck or `.first()` to find the
              right one. Mirrored on QuickFinder's own result-count region
              (components/research/QuickFinder.tsx) — the two never render on
              the same page, so one shared name is unambiguous. */}
          <p className="sr-only" aria-live="polite" aria-atomic="true" data-testid="research-result-count">
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
          onCancel={handleCancelSwitch}
          onConfirm={handleConfirmSwitch}
        />
      )}

      <HandoffTrackingBoundary compareUrl={shortlist.compareUrl} onHandoff={handleCockpitHandoff}>
        <ShortlistBar
          slugs={shortlist.slugs}
          displayNameFor={shortlist.displayNameFor}
          onRemove={handleRemoveSlug}
          onClearAll={handleClearAll}
          compareUrl={shortlist.compareUrl}
        />
      </HandoffTrackingBoundary>
    </div>
  );
}
