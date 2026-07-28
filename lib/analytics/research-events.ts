// lib/analytics/research-events.ts
// Pure logic for the Research Library discovery surface (schema research_v1),
// implementing docs/research-library/analytics-research-v1.md — that contract
// is FROZEN AT THE SCHEMA STRING; extensions are additive-only (spec §12,
// unified-research-discovery-pr2-hubs plan Task 6) and must always change
// together with the strict Zod schema (lib/validation/index.ts) and this
// file's own doc comment set — never drift from either.
//
// Strictly ADDITIVE sibling of tool_v1 and the frozen cockpit_v1: it shares the
// analytics_events table and POST /api/track, but carries its own event names,
// its own strict Zod schema and its own batch type 'research_event_batch'.
// No React, no DOM — the 'use client' binding lives in
// lib/analytics/research-tracking.ts.
//
// PRIVACY (binding, contract §"Privacy rules"): the raw search string never
// leaves the browser. Only its trimmed character count (toQueryLength) and the
// result count are ever sent. Slugs are our own editorial identifiers and are
// safe; there are no prices and no identifiers beyond the anonymous session id.
//
// HUB DIMENSIONS (Task 6, spec §12): the universal hub is not scoped to one
// topic the way the pilot was, so every event now carries an explicit
// `topic` — 'hub' for the two GLOBAL events (research_search, the hub-wide
// research_filter_change) and the selected DiscoveryProjection's real topic
// for the four ITEM events (research_review_click, research_evidence_open,
// research_shortlist_change, research_cockpit_handoff). `category` is the
// item-event sibling of `topic`: together they are what keeps two
// same-named topics in different categories (e.g. `us/credit-repair/companies`
// vs `us/debt-relief/companies`) analytically separable — a bare topic string
// alone cannot. `topicOverride`-style values are NEVER a serialized property;
// they are the `dimensions` argument below and only ever replace
// `properties.topic`/`properties.category` at build time.
//
// FINDER CTA (PR 3 Task 1, spec §12): `research_finder_cta` is the Homepage
// Quick Finder's own event (surface: 'finder') — a 7th, additive sibling of
// the six names above. `trigger: 'view_all'` is a GLOBAL event (topic: 'hub')
// for the Finder's main CTA; `trigger: 'dossier_item'` is an ITEM event (real
// topic/category via `dimensions`) for a Cockpit-only card's CTA. Both fire
// only on an actual click via `trackFinderCta()` — never on render, search,
// or filter changes — and `resultCount` is always the caller-supplied value
// visible at click time, never recomputed here.

import type { Category } from '@/lib/i18n/config';

export const RESEARCH_SCHEMA_VERSION = 'research_v1';
export const RESEARCH_EVENT_CATEGORY = 'research';
/** Keep in sync with TrackResearchEventBatchSchema (.max(20)). */
export const RESEARCH_EVENT_BATCH_HARD_CAP = 20;

export const RESEARCH_EVENT_NAMES = [
  'research_search',
  'research_filter_change',
  'research_evidence_open',
  'research_review_click',
  'research_shortlist_change',
  'research_cockpit_handoff',
  // PR 3 Task 1 (spec §12) — the Homepage Quick Finder's own CTA event.
  // Additive: the six names above stay frozen, this is a 7th sibling.
  'research_finder_cta',
] as const;
export type ResearchEventName = (typeof RESEARCH_EVENT_NAMES)[number];

/** The filter dimensions the shell actually renders (shell-logic facets).
 *  'status'|'confidence'|'fresh' shipped with Task 6; 'category' and 'type'
 *  join additively (PR 5 gap-close, spec §12) — this was supposed to land in
 *  PR 2 Task 6 alongside the other three and did not, leaving both the hub's
 *  and the Homepage Quick Finder's category (and the hub's type) chips
 *  analytically unmeasurable. deriveLabel/deriveValue below are unchanged:
 *  both are already facet-agnostic (label = the facet name itself, value =
 *  resultCount), so no new branch is needed for either new value. */
export type ResearchFacet = 'status' | 'confidence' | 'fresh' | 'category' | 'type';
/** Mirrors ResearchLibraryItemMeta['status'] — the verification states. */
export type ResearchProductStatus = 'audited' | 'provisional' | 'unavailable';
export type ShortlistAction = 'add' | 'remove' | 'clear';

export interface ResearchContext {
  market: string;
  topic: string;
  /** Canonical pathname WITHOUT query or fragment (e.g. '/research'). */
  pagePath: string;
}

export interface ResearchV1Properties {
  schemaVersion: typeof RESEARCH_SCHEMA_VERSION;
  market: string;
  topic: string;
  /** ITEM events only (spec §12) — the projection's real category, so two
   *  same-named topics in different categories stay analytically separable.
   *  Never set directly by a call site; only via `dimensions` (see
   *  `ResearchItemDimensions` / `buildResearchEventData`). */
  category?: Category;
  /** 'hub' for the universal Research hub; 'finder' for the Homepage Quick
   *  Finder (PR 3 Task 1). */
  surface?: 'hub' | 'finder';
  /** The clicked/opened/shortlisted item's own kind — mirrors
   *  `DiscoveryProjection['kind']`. */
  kind?: 'review' | 'dossier';
  /** research_finder_cta only (PR 3 Task 1) — which Finder CTA fired:
   *  'view_all' (the main CTA, a GLOBAL event, topic: 'hub') or
   *  'dossier_item' (a Cockpit-only card's CTA, an ITEM event carrying the
   *  card's real topic/category). */
  trigger?: 'view_all' | 'dossier_item';
  /** research_search — trimmed CHARACTER COUNT only, never the query itself. */
  queryLength?: number;
  /** research_search / research_filter_change — matches after the change. */
  resultCount?: number;
  facet?: ResearchFacet;
  /** The chip value the facet was set to; null when the filter was cleared. */
  value?: string | null;
  active?: boolean;
  /** null only for the shortlist 'clear' action. */
  productSlug?: string | null;
  status?: ResearchProductStatus;
  dataPoints?: number;
  rank?: number | null;
  /** 1-based index of the card in the currently rendered list. */
  position?: number;
  action?: ShortlistAction;
  count?: number;
  productSlugs?: string[];
}

/** The `data.events[]` record POSTed to /api/track (columns of analytics_events). */
export interface ResearchEventData {
  eventName: ResearchEventName;
  eventCategory: typeof RESEARCH_EVENT_CATEGORY;
  eventAction: string;
  eventLabel: string;
  eventValue?: number;
  pagePath: string;
  properties: ResearchV1Properties;
}

const EVENT_ACTIONS: Record<ResearchEventName, string> = {
  research_search: 'search',
  research_filter_change: 'filter_change',
  research_evidence_open: 'evidence_open',
  research_review_click: 'review_click',
  research_shortlist_change: 'shortlist_change',
  research_cockpit_handoff: 'cockpit_handoff',
  research_finder_cta: 'finder_cta',
};

/** The human-readable dimension of the event — NEVER the search string. */
function deriveLabel(name: ResearchEventName, p: ResearchV1Properties): string {
  switch (name) {
    case 'research_filter_change':
      return p.facet ?? '';
    case 'research_evidence_open':
    case 'research_review_click':
      return p.productSlug ?? '';
    case 'research_shortlist_change':
      return p.action ?? '';
    case 'research_cockpit_handoff':
      return (p.productSlugs ?? []).join(',');
    case 'research_finder_cta':
      // 'view_all' or 'dossier_item' — which CTA fired, never the query.
      return p.trigger ?? '';
    default:
      // research_search — the topic, so the label column stays queryable
      // without ever carrying user input.
      return p.topic;
  }
}

/** The single numeric column per event (analytics_events.event_value). */
function deriveValue(name: ResearchEventName, p: ResearchV1Properties): number | undefined {
  switch (name) {
    case 'research_search':
    case 'research_filter_change':
    case 'research_finder_cta':
      // research_finder_cta: the resultCount VISIBLE AT CLICK TIME — the
      // caller (trackFinderCta) is the only source of truth for this value;
      // it is never recomputed or defaulted here.
      return p.resultCount;
    case 'research_evidence_open':
      return p.dataPoints;
    case 'research_review_click':
      return p.position;
    case 'research_shortlist_change':
    case 'research_cockpit_handoff':
      return p.count;
  }
}

/** The item-scoped analytics dimensions (spec §12): the real topic + category
 *  of the selected `DiscoveryProjection`, as opposed to the `'hub'` topic (and
 *  absent category) the two GLOBAL events use. Never a serialized property by
 *  itself — see `buildResearchEventData`'s `dimensions` argument. */
export interface ResearchItemDimensions {
  topic: string;
  category: Category;
}

/** Optional per-call overrides threaded through every `ResearchTracker`
 *  method (lib/analytics/research-tracking.ts) — item dimensions plus the
 *  three new scalar properties. All optional: an omitted `ResearchTrackOptions`
 *  keeps a call's existing (pre-Task-6) behavior byte-identical. */
export interface ResearchTrackOptions extends Partial<ResearchItemDimensions> {
  surface?: 'hub' | 'finder';
  kind?: 'review' | 'dossier';
  trigger?: 'view_all' | 'dossier_item';
}

/** Builds the /api/track `data` record for one research event.
 *
 *  `dimensions` (spec §12) is NEVER itself serialized — `topicOverride` is a
 *  build-time argument only. When present, `dimensions.topic` replaces
 *  `ctx.topic` and `dimensions.category` is stamped onto `properties.category`;
 *  omitted, `properties.topic` falls back to the tracker's bound `ctx.topic`
 *  (which the hub binds to `'hub'` for its own lifetime) and no `category` is
 *  set. This is what lets the SAME tracker instance emit both hub-wide events
 *  (topic: 'hub') and item events carrying the clicked/opened item's own
 *  topic + category, without rebinding a new tracker per card. */
export function buildResearchEventData(
  name: ResearchEventName,
  ctx: ResearchContext,
  props: Omit<Partial<ResearchV1Properties>, 'schemaVersion' | 'market' | 'topic'> = {},
  dimensions: Partial<ResearchItemDimensions> = {},
): ResearchEventData {
  const properties: ResearchV1Properties = {
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    market: ctx.market,
    topic: dimensions.topic ?? ctx.topic,
    ...props,
    ...(dimensions.category !== undefined ? { category: dimensions.category } : {}),
  };
  return {
    eventName: name,
    eventCategory: RESEARCH_EVENT_CATEGORY,
    eventAction: EVENT_ACTIONS[name],
    eventLabel: deriveLabel(name, properties),
    eventValue: deriveValue(name, properties),
    pagePath: ctx.pagePath,
    properties,
  };
}

/**
 * The ONLY sanctioned way to derive a search event's payload from a raw query:
 * the trimmed character count. Anything that would put the string itself into
 * an event is a contract violation.
 */
export function toQueryLength(raw: string): number {
  return raw.trim().length;
}

/**
 * Rate-limit weight for a 'research_event_batch' request — one token per event,
 * clamped to the hard cap (mirrors computeToolBatchWeight; the cockpit's
 * computeTrackRateLimitWeight stays frozen and cockpit-only).
 */
export function computeResearchBatchWeight(rawEventsLength: unknown): number {
  const n =
    typeof rawEventsLength === 'number' && Number.isFinite(rawEventsLength) ? rawEventsLength : 0;
  return Math.max(1, Math.min(n, RESEARCH_EVENT_BATCH_HARD_CAP));
}
