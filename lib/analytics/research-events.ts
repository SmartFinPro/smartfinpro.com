// lib/analytics/research-events.ts
// Pure logic for the Research Library discovery surface (schema research_v1),
// implementing docs/research-library/analytics-research-v1.md — that contract
// is FROZEN; this file must not drift from it.
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
] as const;
export type ResearchEventName = (typeof RESEARCH_EVENT_NAMES)[number];

/** The three filter dimensions the shell actually renders (shell-logic facets). */
export type ResearchFacet = 'status' | 'confidence' | 'fresh';
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

/** Builds the /api/track `data` record for one research event. */
export function buildResearchEventData(
  name: ResearchEventName,
  ctx: ResearchContext,
  props: Omit<Partial<ResearchV1Properties>, 'schemaVersion' | 'market' | 'topic'> = {},
): ResearchEventData {
  const properties: ResearchV1Properties = {
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    market: ctx.market,
    topic: ctx.topic,
    ...props,
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
