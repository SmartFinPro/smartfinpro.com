import type { Category, Market } from "@/lib/i18n/config";
import { marketCategories } from "@/lib/i18n/config";

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
  bestFor: string | null;
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
): string => `${itemId}:${cockpitKey ?? "review"}`;

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

/** Every value returned here has count > 0 and is genuinely selectable.
 *  RENDER GATING IS THE CONSUMER'S JOB: spec §6.2 says a dimension is only
 *  *shown* when at least two selectable values remain — this module reports
 *  the data, the shell decides visibility (same split as the pilot's
 *  `computeFacets` in shell-logic.ts). A surface that renders every returned
 *  dimension unconditionally would ship single-value chips and violate §6.2. */
export interface DiscoveryFacets {
  categories: Array<{ value: Category; count: number }>;
  types: Array<{ value: DiscoveryKind; count: number }>;
  statuses: Array<{ value: ResearchStatus; count: number }>;
  confidences: Array<{ value: ResearchConfidence; count: number }>;
  /** ascending ISO order; consumers wanting newest-first must reverse. */
  freshnessDates: Array<{ value: string; count: number }>;
  topics: Array<{ value: string; label: string; count: number }>;
}

/** Trim + locale-stable lowercase + collapse internal whitespace, so query
 *  and searchText compare the same way regardless of incidental spacing. */
const normalize = (value: string): string =>
  value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");

/** Context-level predicate for status/confidence/fresh/topic. `specs` is
 *  handled separately below because it needs the topic:key:value parser. */
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

interface SpecGroup {
  topic: string;
  key: string;
  values: Set<string>;
}

/** Parses `"<topic>:<key>:<value>"` tokens, splitting only the first two
 *  colons (the value itself may contain further colons). Tokens are grouped
 *  by topic+key so multiple values for the same key OR together, while
 *  distinct topic/key groups AND together. This parser stays private to PR 1;
 *  PR 4 promotes it into the registry-validating facet module. */
const parseSpecGroups = (specs: readonly string[]): SpecGroup[] => {
  const groups = new Map<string, SpecGroup>();
  for (const token of specs) {
    const firstColon = token.indexOf(":");
    if (firstColon === -1) continue;
    const secondColon = token.indexOf(":", firstColon + 1);
    if (secondColon === -1) continue;
    const topic = token.slice(0, firstColon);
    const key = token.slice(firstColon + 1, secondColon);
    const value = token.slice(secondColon + 1);
    const groupKey = `${topic}${key}`;
    const existing = groups.get(groupKey);
    if (existing) {
      existing.values.add(value);
    } else {
      groups.set(groupKey, { topic, key, values: new Set([value]) });
    }
  }
  return [...groups.values()];
};

/** A context matches the specs filter when, for every active topic/key group,
 *  its topic matches and its own keyFacts[key] value is in that group's
 *  selected value set. Groups with no keyFacts[key] at all never match. */
const specGroupsMatch = (
  context: ResearchContext,
  groups: readonly SpecGroup[],
): boolean =>
  groups.every(
    (group) =>
      context.topic === group.topic &&
      group.values.has(context.keyFacts[group.key]),
  );

export function matchesItemQuery(item: DiscoveryItem, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (normalizedQuery === "") return true;
  return normalize(item.display.searchText).includes(normalizedQuery);
}

export function matchingContexts(
  item: DiscoveryItem,
  filters: DiscoveryFilters,
): ResearchContext[] {
  const specGroups = parseSpecGroups(filters.specs);
  return item.researchContexts.filter(
    (context) =>
      contextMatches(context, filters) && specGroupsMatch(context, specGroups),
  );
}

/** Multi-context selection: explicit topic wins when present among the
 *  already-matched contexts, otherwise the first context in manifest order. */
const selectContext = (
  contexts: readonly ResearchContext[],
  explicitTopic: string | null,
): ResearchContext | null => {
  if (contexts.length === 0) return null;
  if (explicitTopic) {
    const explicit = contexts.find((context) => context.topic === explicitTopic);
    if (explicit) return explicit;
  }
  return [...contexts].sort((a, b) => a.manifestOrder - b.manifestOrder)[0];
};

const isResearchOnlyFilterActive = (filters: DiscoveryFilters): boolean =>
  filters.status !== null ||
  filters.confidence !== null ||
  filters.fresh !== null ||
  filters.topic !== null ||
  filters.specs.length > 0;

export function projectDiscoveryItems(
  items: readonly DiscoveryItem[],
  filters: DiscoveryFilters,
): DiscoveryProjection[] {
  const researchOnlyFilterActive = isResearchOnlyFilterActive(filters);
  const projections: DiscoveryProjection[] = [];

  for (const item of items) {
    if (filters.category && item.category !== filters.category) continue;
    if (!matchesItemQuery(item, filters.query)) continue;

    const matched = matchingContexts(item, filters);
    if (researchOnlyFilterActive && matched.length === 0) continue;

    if (filters.type === "review") {
      if (item.review) {
        projections.push({ itemId: item.id, kind: "review", item, context: null });
      }
      continue;
    }

    if (filters.type === "dossier") {
      const context = selectContext(matched, filters.topic);
      if (context) {
        projections.push({ itemId: item.id, kind: "dossier", item, context });
      }
      continue;
    }

    const context = selectContext(matched, filters.topic);
    if (context) {
      projections.push({ itemId: item.id, kind: "dossier", item, context });
    } else if (item.review) {
      projections.push({ itemId: item.id, kind: "review", item, context: null });
    }
  }

  return projections;
}

/** Disjunctive facet counting (spec §6.2): a facet's count for candidate
 *  value `v` is measured by RUNNING THE REAL PIPELINE with that dimension SET
 *  to `v` (every other active filter kept as-is) — never by clearing the
 *  dimension and tallying whichever single "default" projection
 *  `projectDiscoveryItems` happens to pick per item. The latter under-counts
 *  any item with more than one qualifying context: `projectDiscoveryItems`
 *  emits at most ONE projection per item (spec §6.1), so an item with both an
 *  audited context and a provisional context would only ever register its
 *  audited alternative, silently hiding that filtering directly by
 *  type=review, status=provisional, or the provisional context's topic each
 *  still yields this same item. Setting the dimension per candidate value
 *  fixes this because each run picks its OWN qualifying context independently.
 *
 *  Candidate values are enumerated from the full item set, not from whatever
 *  the current filters happen to leave visible — categories/types/statuses/
 *  topics from every item and context; confidence and freshness stay
 *  audited-sourced (only an audited context ever contributes a candidate).
 *  Category is mathematically equivalent to the old clear-and-tally approach
 *  (an item has exactly one category, never per-context), but is computed the
 *  same uniform way here for consistency. */
export function computeDiscoveryFacets(
  items: readonly DiscoveryItem[],
  filters: DiscoveryFilters,
): DiscoveryFacets {
  const market = items[0]?.market ?? null;
  const categoryOrder: readonly Category[] = market ? marketCategories[market] : [];

  const candidateCategories = new Set<Category>();
  const candidateStatuses = new Set<ResearchStatus>();
  const candidateConfidences = new Set<ResearchConfidence>();
  const candidateFreshnessDates = new Set<string>();
  const candidateTopics = new Map<string, { label: string; order: number }>();

  for (const item of items) {
    candidateCategories.add(item.category);
    for (const context of item.researchContexts) {
      candidateStatuses.add(context.status);
      if (context.status === "audited" && context.confidence) {
        candidateConfidences.add(context.confidence);
      }
      if (context.status === "audited" && context.dataVerifiedAt) {
        candidateFreshnessDates.add(context.dataVerifiedAt);
      }
      if (!candidateTopics.has(context.topic)) {
        candidateTopics.set(context.topic, {
          label: context.topicLabel,
          order: context.manifestOrder,
        });
      }
    }
  }

  const categories = categoryOrder
    .filter((category) => candidateCategories.has(category))
    .map((category) => ({
      value: category,
      count: projectDiscoveryItems(items, { ...filters, category }).length,
    }))
    .filter((entry) => entry.count > 0);

  const types = (["review", "dossier"] as const)
    .map((type) => ({
      value: type,
      count: projectDiscoveryItems(items, { ...filters, type }).length,
    }))
    .filter((entry) => entry.count > 0);

  const statuses = (["audited", "provisional"] as const)
    .filter((status) => candidateStatuses.has(status))
    .map((status) => ({
      value: status,
      count: projectDiscoveryItems(items, { ...filters, status }).length,
    }))
    .filter((entry) => entry.count > 0);

  const confidences = (["high", "medium", "low"] as const)
    .filter((confidence) => candidateConfidences.has(confidence))
    .map((confidence) => ({
      value: confidence,
      count: projectDiscoveryItems(items, { ...filters, confidence }).length,
    }))
    .filter((entry) => entry.count > 0);

  const freshnessDates = [...candidateFreshnessDates]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((fresh) => ({
      value: fresh,
      count: projectDiscoveryItems(items, { ...filters, fresh }).length,
    }))
    .filter((entry) => entry.count > 0);

  const topics = [...candidateTopics.entries()]
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([topic, meta]) => ({
      value: topic,
      label: meta.label,
      count: projectDiscoveryItems(items, { ...filters, topic }).length,
    }))
    .filter((entry) => entry.count > 0);

  return { categories, types, statuses, confidences, freshnessDates, topics };
}

/** Hub sort: dossiers ordered by their topic's manifest position, then
 *  audited rank, then provisional entries by productSlug; reviews ordered by
 *  modifiedDate descending; item.id is the final stable tiebreak throughout. */
const compareHubProjections = (
  a: DiscoveryProjection,
  b: DiscoveryProjection,
): number => {
  if (a.kind !== b.kind) {
    return a.kind === "dossier" ? -1 : 1;
  }

  if (a.kind === "dossier" && b.kind === "dossier") {
    if (a.context.manifestOrder !== b.context.manifestOrder) {
      return a.context.manifestOrder - b.context.manifestOrder;
    }
    if (a.context.status !== b.context.status) {
      return a.context.status === "audited" ? -1 : 1;
    }
    if (a.context.status === "audited") {
      const rankA = a.context.auditedRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.context.auditedRank ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
    } else if (a.context.productSlug !== b.context.productSlug) {
      return a.context.productSlug < b.context.productSlug ? -1 : 1;
    }
  } else {
    const dateA = a.item.review?.modifiedDate ?? "";
    const dateB = b.item.review?.modifiedDate ?? "";
    if (dateA !== dateB) {
      return dateA > dateB ? -1 : 1;
    }
  }

  if (a.itemId !== b.itemId) return a.itemId < b.itemId ? -1 : 1;
  return 0;
};

export function sortHubProjections(
  projections: readonly DiscoveryProjection[],
): DiscoveryProjection[] {
  return [...projections].sort(compareHubProjections);
}

export function sortFinderItems(
  items: readonly DiscoveryItem[],
  filters: Pick<DiscoveryFilters, "query" | "category">,
): DiscoveryItem[] {
  const matching = items.filter(
    (item) =>
      (!filters.category || item.category === filters.category) &&
      matchesItemQuery(item, filters.query),
  );

  return matching.sort((a, b) => {
    const featuredA = a.review?.featured ? 1 : 0;
    const featuredB = b.review?.featured ? 1 : 0;
    if (featuredA !== featuredB) return featuredB - featuredA;

    const dateA = a.display.sortDate;
    const dateB = b.display.sortDate;
    if (dateA !== dateB) {
      if (dateA === null) return 1;
      if (dateB === null) return -1;
      return dateA > dateB ? -1 : 1;
    }

    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    return 0;
  });
}

/** Canonical multi-topic context ordering for one DiscoveryItem (spec §4.1):
 *  manifest position first — topics never collide on manifestOrder within a
 *  single item, since a product appears at most once per topic — then
 *  audited rank, then productSlug as a final deterministic tiebreak for any
 *  remaining tie. Used by the server catalog builder (lib/research/catalog.ts)
 *  when it merges overlay rows onto a DiscoveryItem's researchContexts. */
export function sortResearchContexts(
  contexts: readonly ResearchContext[],
): ResearchContext[] {
  return [...contexts].sort((a, b) => {
    if (a.manifestOrder !== b.manifestOrder) return a.manifestOrder - b.manifestOrder;
    const aAudited = a.status === "audited";
    const bAudited = b.status === "audited";
    if (aAudited !== bAudited) return aAudited ? -1 : 1;
    if (aAudited) {
      const rankA = a.auditedRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.auditedRank ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
    }
    return a.productSlug < b.productSlug ? -1 : a.productSlug > b.productSlug ? 1 : 0;
  });
}

export function countDiscoveryItems(
  items: readonly DiscoveryItem[],
): DiscoveryCounts {
  let reviewBackedCount = 0;
  let dossierCount = 0;
  let auditedItemCount = 0;
  let verifiedDataPointCount = 0;

  for (const item of items) {
    if (item.review) reviewBackedCount += 1;
    if (item.researchContexts.length > 0) dossierCount += 1;
    if (item.researchContexts.some((context) => context.status === "audited")) {
      auditedItemCount += 1;
    }
    for (const context of item.researchContexts) {
      verifiedDataPointCount += context.dataPoints;
    }
  }

  return {
    reviewBackedCount,
    dossierCount,
    discoveryItemCount: items.length,
    auditedItemCount,
    verifiedDataPointCount,
  };
}

// --- Scoped shortlist storage & Cockpit compare handoff ---------------------
// The shortlist reads/writes through an injected StorageLike rather than
// window.sessionStorage directly, so it stays framework-free and unit-testable
// here; the client wiring (PR 2) supplies the real adapter. Storage v2 scopes
// every shortlist to one Cockpit key so same-named topics in different
// categories (e.g. credit-repair/companies vs. debt-relief/companies) never
// collide. See spec §11.

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

/** Reconstructs a CockpitKey from the market pointer's `${category}:${topic}`
 *  value. Returns null when the pointer has no separator (malformed). */
const cockpitKeyFromPointer = (
  market: Market,
  pointer: string,
): CockpitKey | null => {
  const separatorIndex = pointer.indexOf(":");
  if (separatorIndex === -1) return null;
  const category = pointer.slice(0, separatorIndex);
  const topic = pointer.slice(separatorIndex + 1);
  return `${market}/${category}/${topic}` as CockpitKey;
};

/** Restores a scoped shortlist without an effect-order hazard: reads the
 *  market pointer, rejects any Cockpit key absent from the caller's
 *  `validScopes` map, then keeps only unique persisted slugs that belong to
 *  that Cockpit's own product set (capped at MAX_SHORTLIST). Any invalid step
 *  clears the leftover pointer/scoped storage and returns a clean empty
 *  state — callers get either a fully valid scope or nothing, never a partial
 *  or stale one. */
export function restoreScopedShortlist(
  storage: StorageLike,
  market: Market,
  validScopes: ReadonlyMap<CockpitKey, ReadonlySet<string>>,
): ScopedShortlist {
  const pointerKey = shortlistPointerKey(market);
  const pointer = storage.getItem(pointerKey);
  if (!pointer) return { cockpitKey: null, slugs: [] };

  const clearAndReturnEmpty = (): ScopedShortlist => {
    storage.removeItem(pointerKey);
    return { cockpitKey: null, slugs: [] };
  };

  const cockpitKey = cockpitKeyFromPointer(market, pointer);
  if (!cockpitKey) return clearAndReturnEmpty();

  const validSlugs = validScopes.get(cockpitKey);
  if (!validSlugs) {
    storage.removeItem(shortlistStorageKey(cockpitKey));
    return clearAndReturnEmpty();
  }

  const scopedKey = shortlistStorageKey(cockpitKey);
  const raw = storage.getItem(scopedKey);
  if (!raw) return clearAndReturnEmpty();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    storage.removeItem(scopedKey);
    return clearAndReturnEmpty();
  }
  if (!Array.isArray(parsed)) {
    storage.removeItem(scopedKey);
    return clearAndReturnEmpty();
  }

  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "string" || !validSlugs.has(entry) || seen.has(entry)) {
      continue;
    }
    seen.add(entry);
    slugs.push(entry);
    if (slugs.length >= MAX_SHORTLIST) break;
  }

  if (slugs.length === 0) {
    storage.removeItem(scopedKey);
    return clearAndReturnEmpty();
  }

  return { cockpitKey, slugs };
}

/** Persists a scoped shortlist: the pointer stores `${category}:${topic}`,
 *  the scoped key stores the JSON slug array. An empty shortlist removes both
 *  entries instead of writing an empty array. */
export function persistScopedShortlist(
  storage: StorageLike,
  market: Market,
  shortlist: ScopedShortlist,
): void {
  const pointerKey = shortlistPointerKey(market);

  if (!shortlist.cockpitKey || shortlist.slugs.length === 0) {
    storage.removeItem(pointerKey);
    if (shortlist.cockpitKey) {
      storage.removeItem(shortlistStorageKey(shortlist.cockpitKey));
    }
    return;
  }

  const [, category, topic] = shortlist.cockpitKey.split("/");
  storage.setItem(pointerKey, `${category}:${topic}`);
  storage.setItem(
    shortlistStorageKey(shortlist.cockpitKey),
    JSON.stringify(shortlist.slugs),
  );
}

/** Normalizes a legacy shortlist's raw JSON string into a slug list: keeps
 *  only string entries, dedupes preserving first-seen order, and caps at
 *  MAX_SHORTLIST. Returns null when `raw` is not valid JSON, does not parse
 *  to an array, or normalizes to an empty list — the caller treats null as
 *  "nothing worth migrating". */
function normalizeLegacyShortlistValue(raw: string): string[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "string" || seen.has(entry)) continue;
    seen.add(entry);
    slugs.push(entry);
    if (slugs.length >= MAX_SHORTLIST) break;
  }

  return slugs.length > 0 ? slugs : null;
}

/** One-time migration of the Research Library pilot's flat sessionStorage key
 *  into the v2 scoped key for us/trading/trading-platforms.
 *
 *  - Never overwrites an existing v2 value or an existing market pointer.
 *  - The legacy value is normalized before being written (string entries
 *    only, deduped in first-seen order, capped at MAX_SHORTLIST). A legacy
 *    value that is malformed JSON, not an array, or normalizes to an empty
 *    list is discarded outright: the v2 key and pointer are never written,
 *    only the (worthless) legacy key is removed.
 *  - Write order is v2 key, then pointer, then legacy removal — the legacy
 *    key is deleted ONLY once every applicable write has actually
 *    succeeded. The function is fail-soft like the rest of the storage
 *    layer: a throwing `storage.setItem` is swallowed (not rethrown) and
 *    the legacy key is left in place, so a later call can retry instead of
 *    silently losing the user's shortlist. */
export function migrateLegacyTradingShortlist(storage: StorageLike): void {
  const legacyKey = "research-shortlist:us:trading-platforms";
  const legacyValue = storage.getItem(legacyKey);
  if (legacyValue === null) return;

  const cockpitKey: CockpitKey = "us/trading/trading-platforms";
  const v2Key = shortlistStorageKey(cockpitKey);
  const pointerKey = shortlistPointerKey("us");

  if (storage.getItem(v2Key) === null) {
    const normalized = normalizeLegacyShortlistValue(legacyValue);
    if (normalized === null) {
      storage.removeItem(legacyKey);
      return;
    }
    try {
      storage.setItem(v2Key, JSON.stringify(normalized));
    } catch {
      return; // fail-soft: leave the legacy key intact for a later retry.
    }
  }

  if (storage.getItem(pointerKey) === null) {
    const [, category, topic] = cockpitKey.split("/");
    try {
      storage.setItem(pointerKey, `${category}:${topic}`);
    } catch {
      return; // fail-soft: leave the legacy key intact for a later retry.
    }
  }

  storage.removeItem(legacyKey);
}

/** Toggles one slug within `cockpitKey`. Adding beyond MAX_SHORTLIST or a slug
 *  outside `validSlugs` is a no-op. Adding from a DIFFERENT cockpit than
 *  `current.cockpitKey` never merges silently: it reports
 *  `requiresScopeSwitch: true` and returns the post-switch state (the new
 *  scope with exactly the requested slug) for the caller to apply only after
 *  the user confirms "Switch & add" (spec §11.3). Removing the last slug
 *  always clears the scope back to null, matching persistScopedShortlist's
 *  "empty shortlist removes both" contract. */
export function toggleScopedShortlist(
  current: ScopedShortlist,
  cockpitKey: CockpitKey,
  slug: string,
  validSlugs: ReadonlySet<string>,
): { next: ScopedShortlist; requiresScopeSwitch: boolean } {
  const sameScope = current.cockpitKey === null || current.cockpitKey === cockpitKey;

  if (!sameScope) {
    if (!validSlugs.has(slug)) {
      return { next: current, requiresScopeSwitch: false };
    }
    return {
      next: { cockpitKey, slugs: [slug] },
      requiresScopeSwitch: true,
    };
  }

  if (current.slugs.includes(slug)) {
    const nextSlugs = current.slugs.filter((existing) => existing !== slug);
    return {
      next: {
        cockpitKey: nextSlugs.length > 0 ? cockpitKey : null,
        slugs: nextSlugs,
      },
      requiresScopeSwitch: false,
    };
  }

  if (!validSlugs.has(slug) || current.slugs.length >= MAX_SHORTLIST) {
    return { next: current, requiresScopeSwitch: false };
  }

  return {
    next: { cockpitKey, slugs: [...current.slugs, slug] },
    requiresScopeSwitch: false,
  };
}

/** The Cockpit compare handoff URL, built only from `cockpitKey` and slugs
 *  already confirmed against `validSlugs` — a foreign or stale slug can never
 *  reach the URL. Null for fewer than two slugs, more than MAX_SHORTLIST,
 *  duplicates, or any slug missing from the valid set. */
export function buildScopedCompareUrl(
  cockpitBase: string,
  slugs: readonly string[],
  validSlugs: ReadonlySet<string>,
): string | null {
  if (slugs.length < 2 || slugs.length > MAX_SHORTLIST) return null;
  if (new Set(slugs).size !== slugs.length) return null;
  if (!slugs.every((slug) => validSlugs.has(slug))) return null;
  return `${cockpitBase}?compare=${slugs.map(encodeURIComponent).join(",")}&view=compare#comparison`;
}
