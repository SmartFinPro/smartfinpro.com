import type { Category, Market } from "@/lib/i18n/config";
import { marketCategories } from "@/lib/i18n/config";
import { BEST_X_MANIFEST } from "@/lib/comparison/topics/manifest";

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

// --- URL round-trip (spec §6.1) ---------------------------------------------
// The Research hub keeps every filter in the URL (query, category, type,
// status, confidence, fresh) so a search is shareable and survives Back —
// `ResearchHub` (Task 4) is the only consumer of these two functions today,
// but `topic`/`specs` are parsed and serialized here too because
// `DiscoveryFilters` is the one contract PR 4's topic/spec facets (spec §10)
// will also read and write. An invalid or unrecognized raw value is DROPPED,
// never preserved or defaulted to something else — a stale/bogus query
// string degrades to "no filter", not to a thrown error.

const isDiscoveryKind = (value: string): value is DiscoveryKind =>
  value === "review" || value === "dossier";

const isResearchStatus = (value: string): value is ResearchStatus =>
  value === "audited" || value === "provisional";

const isResearchConfidence = (value: string): value is ResearchConfidence =>
  value === "high" || value === "medium" || value === "low";

const FRESH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const collectKnownTopics = (items: readonly DiscoveryItem[]): Set<string> => {
  const topics = new Set<string>();
  for (const item of items) {
    for (const context of item.researchContexts) topics.add(context.topic);
  }
  return topics;
};

/** Parses one `"<topic>:<key>:<value>"` spec token the same way
 *  `parseSpecGroups` (below) does — splitting only the first two colons —
 *  and reports whether ANY context in `items` actually has that
 *  topic/key/value combination. A token nobody could ever match is dropped
 *  at the URL boundary rather than silently carried into a filter that can
 *  never select anything. */
const specTokenIsKnown = (
  items: readonly DiscoveryItem[],
  token: string,
): boolean => {
  const firstColon = token.indexOf(":");
  if (firstColon === -1) return false;
  const secondColon = token.indexOf(":", firstColon + 1);
  if (secondColon === -1) return false;
  const topic = token.slice(0, firstColon);
  const key = token.slice(firstColon + 1, secondColon);
  const value = token.slice(secondColon + 1);
  return items.some((item) =>
    item.researchContexts.some(
      (context) => context.topic === topic && context.keyFacts[key] === value,
    ),
  );
};

/** Reads `DiscoveryFilters` out of a `URLSearchParams`-shaped source, dropping
 *  (never preserving) any value that isn't a recognized enum member, isn't a
 *  market-valid category, isn't a topic/spec combination actually present in
 *  `items`, or isn't a `YYYY-MM-DD` date. `query` is the one field with no
 *  "invalid" state — it is only ever trimmed. */
export function parseDiscoverySearchParams(
  params: Pick<URLSearchParams, "get" | "getAll">,
  market: Market,
  items: readonly DiscoveryItem[],
): DiscoveryFilters {
  const rawCategory = params.get("category");
  const validCategories: readonly string[] = marketCategories[market];
  const category =
    rawCategory && validCategories.includes(rawCategory)
      ? (rawCategory as Category)
      : null;

  const rawType = params.get("type");
  const type = rawType && isDiscoveryKind(rawType) ? rawType : null;

  const rawStatus = params.get("status");
  const status = rawStatus && isResearchStatus(rawStatus) ? rawStatus : null;

  const rawConfidence = params.get("confidence");
  const confidence =
    rawConfidence && isResearchConfidence(rawConfidence) ? rawConfidence : null;

  const rawFresh = params.get("fresh");
  const fresh = rawFresh && FRESH_DATE_PATTERN.test(rawFresh) ? rawFresh : null;

  const knownTopics = collectKnownTopics(items);
  const rawTopic = params.get("topic");
  const topic = rawTopic && knownTopics.has(rawTopic) ? rawTopic : null;

  const specs = params
    .getAll("spec")
    .filter((token) => specTokenIsKnown(items, token));

  return {
    query: (params.get("q") ?? "").trim(),
    category,
    type,
    status,
    confidence,
    fresh,
    topic,
    specs,
  };
}

/** The inverse of `parseDiscoverySearchParams`: builds a `URLSearchParams`
 *  containing only the filters that are actually set, via `.set()`/`.append()`
 *  only (never the constructor's query-string form) — an empty/default
 *  `DiscoveryFilters` round-trips to an empty `URLSearchParams`. */
export function buildDiscoverySearchParams(
  filters: DiscoveryFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  const trimmedQuery = filters.query.trim();
  if (trimmedQuery) params.set("q", trimmedQuery);
  if (filters.category) params.set("category", filters.category);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.confidence) params.set("confidence", filters.confidence);
  if (filters.fresh) params.set("fresh", filters.fresh);
  if (filters.topic) params.set("topic", filters.topic);
  for (const spec of filters.specs) params.append("spec", spec);

  return params;
}

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

/** Every topic name BEST_X_MANIFEST assigns to MORE THAN ONE category within
 *  `market` — e.g. the bare string `"companies"` identifies both
 *  `us/credit-repair/companies` and `us/debt-relief/companies`. This is the
 *  defect the hub's dossier grouping (`ResearchHubPage.tsx`'s
 *  `groupBrowseNodes`, `ResearchHub.tsx`'s `groupResolvedEntries`) fixes by
 *  keying its Map on the full `cockpitKey` rather than the bare topic —
 *  `dossierGroupTestId` below is the one remaining place a bare topic name
 *  is still user-/DOM-visible (the `data-testid`), so it needs this same
 *  ambiguity signal to stay collision-free.
 *
 *  Grounded in the STATIC manifest, never in live catalog rows (`items`,
 *  qualifying dossier counts, etc.): a data-testid's shape must never flip
 *  just because a topic's qualifying-row count changed today — only an
 *  actual BEST_X_MANIFEST edit (adding/removing a topic/category pairing)
 *  can change which topics are ambiguous. */
export function computeAmbiguousDossierTopics(market: Market): ReadonlySet<string> {
  const categoriesByTopic = new Map<string, Set<Category>>();
  for (const entry of BEST_X_MANIFEST) {
    if (entry.market !== market) continue;
    let categories = categoriesByTopic.get(entry.topic);
    if (!categories) {
      categories = new Set();
      categoriesByTopic.set(entry.topic, categories);
    }
    categories.add(entry.category);
  }

  const ambiguous = new Set<string>();
  for (const [topic, categories] of categoriesByTopic) {
    if (categories.size > 1) ambiguous.add(topic);
  }
  return ambiguous;
}

/** The Research hub's per-dossier-group `data-testid`. Bare `dossier-<topic>`
 *  when `topic` is unique within this market — the stable, pre-existing shape
 *  `dossier-trading-platforms` and `dossier-robo-advisors` already rely on
 *  (e2e/research-shell.spec.ts), which this function NEVER renames.
 *  `dossier-<category>-<topic>` only for a topic name `ambiguousTopics`
 *  (built by `computeAmbiguousDossierTopics` above) actually flags as reused
 *  across categories in this market — e.g. `dossier-credit-repair-companies`
 *  vs. `dossier-debt-relief-companies`, so two same-named-topic sections can
 *  never collide in the DOM. */
export function dossierGroupTestId(
  topic: string,
  category: Category,
  ambiguousTopics: ReadonlySet<string>,
): string {
  return ambiguousTopics.has(topic) ? `dossier-${category}-${topic}` : `dossier-${topic}`;
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

/** `restoreScopedShortlist`'s actual return shape — a `ScopedShortlist` PLUS
 *  one optional field that only Rules 2/2b (below) ever set. `cockpitKey`
 *  above deliberately stays `null` for those two rules — never repurposed to
 *  carry the unverifiable scope — because `persistScopedShortlist` treats
 *  ANY non-null `cockpitKey` paired with an empty `slugs` as "the user
 *  cleared this scope" and destructively removes BOTH its pointer and its
 *  scoped storage entry (see its own `if (!shortlist.cockpitKey ||
 *  shortlist.slugs.length === 0)` branch). Since every later state change
 *  (e.g. `request-switch`) re-runs the persist effect with whatever
 *  `cockpitKey` the reducer currently holds, putting the unverifiable key
 *  there would eventually feed it straight into that branch and silently
 *  destroy the exact storage entry Rule 2/2b exists to protect — defeating
 *  the byte-identical guarantee one render later instead of immediately.
 *  `unverifiableCockpitKey` is therefore a SEPARATE, never-persisted signal:
 *  it lets a caller (the shortlist reducer) distinguish "no scope was ever
 *  active" from "a scope IS active but its current load state can't be
 *  verified right now", so a cross-scope toggle can still route through the
 *  honest `describeScopeSwitch` "active-unavailable" dialog instead of
 *  silently repointing the market pointer with no warning (spec §11.3.1). */
export interface RestoredShortlist extends ScopedShortlist {
  unverifiableCockpitKey?: CockpitKey | null;
}

/** Why a manifest Cockpit key currently has no authoritative slug set (spec
 *  §11.2.1). `load_failed` and `backoff` both come from the per-topic overlay
 *  loader (§5.3.1: a topic in its 60s post-failure backoff window is reported
 *  the same way as one that just failed, since neither can be verified right
 *  now); `missing_topic_config` is a manifest entry whose `getTopicConfig`
 *  never resolves — structurally different (a config problem, not a
 *  transient load problem) but identically non-destructive for restore.
 *  `unknown_state` is NEVER assigned by the overlay loader into
 *  `ShortlistScopeSnapshot.unavailableScopes` itself — it exists solely for
 *  `describeScopeSwitch`'s defensive fallback, when a known Cockpit key is
 *  present in NEITHER `availableScopes` NOR `unavailableScopes` (an
 *  inconsistent-snapshot signal). Labelling that case `load_failed` would
 *  fabricate a specific cause we do not actually know. */
export type UnavailableScopeReason =
  | "load_failed"
  | "backoff"
  | "missing_topic_config"
  | "unknown_state";

/** Three-tier replacement for the old flat `ReadonlyMap<CockpitKey,
 *  ReadonlySet<string>>` "validScopes" contract (spec §11.2.1). The old flat
 *  map could not distinguish "this scope doesn't exist" from "this scope
 *  exists but couldn't be loaded right now" — both looked like "absent from
 *  the map" and triggered the same destructive clear. Always built from the
 *  FULL, unfiltered market catalog: a search/category/topic filter narrowing
 *  what's currently visible must never shrink `knownScopes`, or a perfectly
 *  valid stored shortlist for a topic the user simply isn't looking at right
 *  now would be wiped out as "stale". */
export interface ShortlistScopeSnapshot {
  /** Every manifest Cockpit key for this market (static, from
   *  BEST_X_MANIFEST). The universe against which "genuinely stale" is
   *  judged. */
  knownScopes: ReadonlySet<CockpitKey>;
  /** Successfully loaded keys → their authoritative slug set (possibly
   *  empty, meaning the topic loaded fine but currently qualifies zero
   *  products). */
  availableScopes: ReadonlyMap<CockpitKey, ReadonlySet<string>>;
  /** Keys that failed to load, are inside the 60s post-failure backoff
   *  window, or whose manifest entry has no resolvable TopicConfig — each
   *  with a structured reason so a UI/log consumer knows which. */
  unavailableScopes: ReadonlyMap<CockpitKey, UnavailableScopeReason>;
}

/** All manifest Cockpit keys for `market` — the static universe a
 *  `ShortlistScopeSnapshot` classifies against (spec §11.2.1). Relocated here
 *  (operator merge-blocker fix, 2026-07-27) from
 *  components/research/ResearchShortlist.tsx's now-removed client-only
 *  `buildShortlistScopeSnapshot`: the snapshot is built SERVER-SIDE now (see
 *  `buildShortlistScopeSnapshotDTO` below, and lib/research/catalog.ts's
 *  `buildDiscoveryScopeSnapshot`, which is the only caller that actually has
 *  the typed per-topic `TopicOverlayResult[]` this needs to classify
 *  correctly), never re-derived client-side from the already-flattened
 *  `DiscoveryItem[]` the RSC boundary hands the client — that re-derivation
 *  is exactly the bug this fix closes (see the DTO doc comment below). */
export function knownScopesFor(market: Market): ReadonlySet<CockpitKey> {
  const scopes = new Set<CockpitKey>();
  for (const entry of BEST_X_MANIFEST) {
    if (entry.market === market) scopes.add(cockpitKeyFor(market, entry.category, entry.topic));
  }
  return scopes;
}

// --- Serializable ShortlistScopeSnapshot DTO (spec §11.2.1, operator fix) --
// A `ReadonlySet`/`ReadonlyMap` cannot cross the Server-Component ->
// Client-Component (RSC) boundary — only plain, JSON-shaped arrays/objects
// survive that serialization. `ShortlistScopeSnapshotDTO` is the wire shape;
// `hydrateShortlistScopeSnapshot` turns it back into the Set/Map shape
// `restoreScopedShortlist`/`describeScopeSwitch` already operate on. Building
// the DTO itself requires the TYPED per-topic `TopicOverlayResult[]` load
// (lib/research/catalog.ts, 'server-only') — this file stays import-clean of
// that module (it must remain safely importable from a client component), so
// `buildShortlistScopeSnapshotDTO` below takes the minimal, STRUCTURALLY
// compatible `TopicScopeResult` shape instead of importing `TopicOverlayResult`
// itself; catalog.ts's `buildDiscoveryScopeSnapshot` is the thin adapter that
// maps its real typed results into this shape before calling here.

export interface AvailableScopeEntryDTO {
  cockpitKey: CockpitKey;
  slugs: readonly string[];
}

export interface UnavailableScopeEntryDTO {
  cockpitKey: CockpitKey;
  reason: UnavailableScopeReason;
}

export interface ShortlistScopeSnapshotDTO {
  knownScopes: readonly CockpitKey[];
  availableScopes: readonly AvailableScopeEntryDTO[];
  unavailableScopes: readonly UnavailableScopeEntryDTO[];
}

/** Pure reshaping only — every classification decision (available vs.
 *  unavailable, and which reason) was already made SERVER-SIDE by
 *  `buildShortlistScopeSnapshotDTO` from the real per-topic load; this
 *  function never re-derives or second-guesses any of it, it only rebuilds
 *  the Set/Map shape the rest of this file's restore/switch logic expects. */
export function hydrateShortlistScopeSnapshot(
  dto: ShortlistScopeSnapshotDTO,
): ShortlistScopeSnapshot {
  return {
    knownScopes: new Set(dto.knownScopes),
    availableScopes: new Map(
      dto.availableScopes.map((entry) => [entry.cockpitKey, new Set(entry.slugs)]),
    ),
    unavailableScopes: new Map(
      dto.unavailableScopes.map((entry) => [entry.cockpitKey, entry.reason]),
    ),
  };
}

/** One manifest topic's classification input for
 *  `buildShortlistScopeSnapshotDTO` below — structurally compatible with (but
 *  deliberately NOT importing) lib/research/catalog.ts's `TopicOverlayResult`
 *  discriminated union, since that module is 'server-only' and this file must
 *  stay importable from the client. `ok:true` with an EMPTY `slugs` array is
 *  the authoritative "this topic loaded fine, zero qualifying products right
 *  now" result (spec §11.2.1 Rule 4) — it must land in `availableScopes`,
 *  never be guessed into `unavailableScopes` just because it looks the same
 *  as a load failure once the slug count hits zero. */
export interface TopicScopeResult {
  cockpitKey: CockpitKey;
  ok: boolean;
  slugs: readonly string[];
  reason: UnavailableScopeReason | null;
}

/** Builds the three-tier `ShortlistScopeSnapshotDTO` from ONE normalized
 *  result per manifest topic (spec §11.2.1, operator merge-blocker fix
 *  2026-07-27 — the third occurrence of the "same defect": a `[]` doing
 *  double duty for two different meanings at a boundary). Every member of
 *  `knownScopesFor(market)` lands in EXACTLY ONE of
 *  `availableScopes`/`unavailableScopes`:
 *
 *  - A result with `ok:true` is ALWAYS available, even with a zero-length
 *    `slugs` — that IS the authoritative "loaded fine, zero rows" case Rule 4
 *    depends on to trigger its destructive shortlist cleanup.
 *  - A result with `ok:false` carries its own real reason (`load_failed` |
 *    `backoff` | `missing_topic_config`) straight through — never defaulted
 *    to `unknown_state`.
 *  - A known Cockpit key with NO corresponding result at all — a genuinely
 *    missing result bucket (a manifest edit landing between two reads, or a
 *    market-wide cache-layer failure that passes `results: []` because it
 *    cannot vouch for ANY topic right now) — is the ONE place `unknown_state`
 *    is used, and only as this fallback, never as a substitute for a real
 *    ok:true-zero-rows or ok:false result. */
export function buildShortlistScopeSnapshotDTO(
  market: Market,
  results: readonly TopicScopeResult[],
): ShortlistScopeSnapshotDTO {
  const knownScopes = knownScopesFor(market);
  const resultByKey = new Map<CockpitKey, TopicScopeResult>();
  for (const result of results) resultByKey.set(result.cockpitKey, result);

  const availableScopes: AvailableScopeEntryDTO[] = [];
  const unavailableScopes: UnavailableScopeEntryDTO[] = [];

  for (const cockpitKey of knownScopes) {
    const result = resultByKey.get(cockpitKey);
    if (!result) {
      unavailableScopes.push({ cockpitKey, reason: "unknown_state" });
      continue;
    }
    if (result.ok) {
      availableScopes.push({ cockpitKey, slugs: result.slugs });
    } else {
      unavailableScopes.push({ cockpitKey, reason: result.reason ?? "unknown_state" });
    }
  }

  return { knownScopes: [...knownScopes], availableScopes, unavailableScopes };
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
 *  market pointer, then classifies its Cockpit key against the three-tier
 *  `ShortlistScopeSnapshot` (spec §11.2.1) before touching anything. Only
 *  POSITIVE evidence ever justifies destructive cleanup — its absence never
 *  does:
 *
 *  1. Absent from `knownScopes` → genuinely stale: clear pointer + scoped
 *     storage, return empty.
 *  2. Present in `unavailableScopes` (backoff / load failure / missing topic
 *     config) → storage stays BYTE-IDENTICAL (not even the pointer is
 *     touched); return empty so the UI goes temporarily inactive without
 *     destroying anything it cannot currently verify.
 *  2b. Present in NEITHER map (defensive — an inconsistent-snapshot signal,
 *      e.g. a snapshot-builder bug or a topic whose failure the builder
 *      forgot to record; NOT evidence of staleness) → identical
 *      non-destructive treatment as rule 2. Not knowing a scope's state is
 *      never itself grounds to delete what's stored for it.
 *  3. Present in `availableScopes` → keep only unique persisted slugs that
 *     belong to that Cockpit's own authoritative product set (capped at
 *     MAX_SHORTLIST); an empty raw value, unparsable JSON, or an
 *     authoritatively empty slug set all clear the same as rule 1's stale
 *     case — that IS positive evidence (a successful load reporting zero
 *     qualifying products), not an absence of information.
 *
 *  Callers get either a fully valid scope, nothing, or (rule 2/2b) an
 *  untouched pass-through — never a partial or silently-lost one. Rules 2/2b
 *  additionally surface the untouched scope's key via
 *  `RestoredShortlist.unverifiableCockpitKey` (see its own doc comment) —
 *  `cockpitKey` itself stays `null`, so this is purely informational, never
 *  something a persist path could mistake for a real active scope. */
export function restoreScopedShortlist(
  storage: StorageLike,
  market: Market,
  snapshot: ShortlistScopeSnapshot,
): RestoredShortlist {
  const pointerKey = shortlistPointerKey(market);
  const pointer = storage.getItem(pointerKey);
  if (!pointer) return { cockpitKey: null, slugs: [] };

  const clearAndReturnEmpty = (): RestoredShortlist => {
    storage.removeItem(pointerKey);
    return { cockpitKey: null, slugs: [] };
  };

  const cockpitKey = cockpitKeyFromPointer(market, pointer);
  if (!cockpitKey) return clearAndReturnEmpty();

  if (!snapshot.knownScopes.has(cockpitKey)) {
    // Rule 1: genuinely stale — this scope no longer exists at all.
    storage.removeItem(shortlistStorageKey(cockpitKey));
    return clearAndReturnEmpty();
  }

  if (snapshot.unavailableScopes.has(cockpitKey)) {
    // Rule 2: known but currently unverifiable (backoff / load failure /
    // missing topic config). Deliberately does NOT call
    // clearAndReturnEmpty() — that would remove the pointer. Nothing in
    // storage is read, written, or removed here. `cockpitKey` stays `null`
    // (byte-identical guarantee — see RestoredShortlist's doc comment);
    // `unverifiableCockpitKey` carries the scope a caller cannot currently
    // verify, so it can still be told apart from "nothing was ever active".
    return { cockpitKey: null, slugs: [], unverifiableCockpitKey: cockpitKey };
  }

  const validSlugs = snapshot.availableScopes.get(cockpitKey);
  if (!validSlugs) {
    // Rule 2b (defensive): known, but present in NEITHER map — a
    // snapshot-builder bug, or a topic whose failure the builder forgot to
    // record in `unavailableScopes`. This is an inconsistent-snapshot signal
    // to whoever built `snapshot`, not proof of staleness. It gets the exact
    // same non-destructive treatment as rule 2: we do not have positive
    // evidence this scope is empty or gone, so nothing is read, written, or
    // removed. Absence of information must never be a delete reason — that
    // was the whole point of splitting `validScopes` into three tiers.
    // Same `unverifiableCockpitKey` treatment as rule 2, for the same reason.
    return { cockpitKey: null, slugs: [], unverifiableCockpitKey: cockpitKey };
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

/** Discriminated result for the cross-topic switch dialog (spec §11.3.1): it
 *  tells the UI only whether the CURRENTLY ACTIVE scope (the one about to be
 *  replaced) is `available` (known-good, normal "Switch & add" wording) or
 *  `unavailable` (backoff/load failure/missing topic config — the dialog must
 *  say a currently-unverifiable stored shortlist will be REPLACED, and must
 *  never claim the user can "clear" a topic they cannot see). No UI text and
 *  no storage mutation live here; this is a pure read of the snapshot. */
export type ScopeSwitchDescription =
  | { kind: "no-switch" }
  | { kind: "active-available"; activeCockpitKey: CockpitKey }
  | {
      kind: "active-unavailable";
      activeCockpitKey: CockpitKey;
      reason: UnavailableScopeReason;
    };

export function describeScopeSwitch(
  snapshot: ShortlistScopeSnapshot,
  activeCockpitKey: CockpitKey | null,
  targetCockpitKey: CockpitKey,
): ScopeSwitchDescription {
  if (!activeCockpitKey || activeCockpitKey === targetCockpitKey) {
    return { kind: "no-switch" };
  }

  const unavailableReason = snapshot.unavailableScopes.get(activeCockpitKey);
  if (unavailableReason) {
    return {
      kind: "active-unavailable",
      activeCockpitKey,
      reason: unavailableReason,
    };
  }

  if (snapshot.availableScopes.has(activeCockpitKey)) {
    return { kind: "active-available", activeCockpitKey };
  }

  // Defensive: the active scope isn't in either bucket — an
  // inconsistent-snapshot signal (a snapshot-builder bug, or a topic whose
  // failure the builder forgot to record), not a real load failure. Reusing
  // "load_failed" here would fabricate a cause we do not actually know, so
  // this gets its own honest `unknown_state` reason — but the SAME
  // non-destructive "can't verify, will still replace" `active-unavailable`
  // treatment as an explicit failure. It must never be reported as
  // `active-available`: absence of information is not evidence of safety.
  return {
    kind: "active-unavailable",
    activeCockpitKey,
    reason: "unknown_state",
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
