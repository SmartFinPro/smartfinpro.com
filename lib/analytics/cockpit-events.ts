// lib/analytics/cockpit-events.ts
// Pure logic for Comparison Cockpit interaction tracking (schema cockpit_v1).
// No React, no DOM, no server imports — unit-testable in plain node. The
// 'use client' browser binding lives in lib/analytics/cockpit-tracking.ts.
//
// Every cockpit event lands in the existing `analytics_events` table via
// POST /api/track — event_category is always 'cockpit' (the dashboard filter
// key), the cockpit_v1 payload rides in the JSONB `properties` column.

export const COCKPIT_SCHEMA_VERSION = 'cockpit_v1';
export const COCKPIT_EVENT_CATEGORY = 'cockpit';

export type CockpitEventName =
  | 'cockpit_view'
  | 'cockpit_product_impression'
  | 'cockpit_cta_click'
  | 'cockpit_sort_change'
  | 'cockpit_filter_change'
  | 'cockpit_compare_toggle'
  | 'cockpit_details_toggle'
  | 'cockpit_matcher_open'
  | 'cockpit_matcher_answer'
  | 'cockpit_matcher_complete'
  | 'cockpit_amount_change'
  | 'cockpit_years_change';

/** Where an event originated. sticky / decision-bar / matcher are reserved —
 *  no provider CTA exists on those surfaces today. 'body' is DecisionBridge
 *  (the Market Check panel inside review/guide article bodies) — its one CTA
 *  is `ctaMode: 'cockpit'` / `destinationType: 'internal_cockpit'`, never a
 *  provider offer. */
export type CockpitSurface =
  | 'cockpit'
  | 'card'
  | 'table'
  | 'compare'
  | 'verdict'
  | 'sticky'
  | 'decision-bar'
  | 'matcher'
  | 'body';

/** The CTA mode of the ACTUALLY RENDERED link (never product.ctaMode — the
 *  render ladder puts externalUrl before reviewSlug, so they can differ).
 *  'cockpit' is DecisionBridge's single CTA — it never resolves through
 *  resolveCockpitCta (no provider offer exists on the 'body' surface). */
export type CockpitCtaMode = 'offer' | 'visit' | 'review' | 'unavailable' | 'cockpit';

export type CockpitDestinationType =
  | 'affiliate'
  | 'outbound'
  | 'internal_review'
  | 'unavailable'
  | 'internal_cockpit';

export type CockpitImpressionKind = 'viewport' | 'rendered';

export type CockpitCompareToggleSource = 'card' | 'table' | 'compare_chip' | 'compare_remove';

/** Click metadata assembled at the call site from the EXACT rendered link
 *  (primary CTA via resolveCockpitCta, title/secondary via resolveReviewCta). */
export interface CockpitCtaClickMeta {
  surface: CockpitSurface;
  ctaPosition: 'primary' | 'secondary' | 'title';
  rank?: number;
  ctaMode: CockpitCtaMode;
  destinationType: CockpitDestinationType;
}

export interface CockpitContext {
  market: string;
  category: string;
  topic: string;
}

export interface CockpitV1Properties extends CockpitContext {
  schemaVersion: typeof COCKPIT_SCHEMA_VERSION;
  view?: 'cards' | 'table' | 'compare';
  surface?: CockpitSurface;
  productSlug?: string;
  providerName?: string;
  rank?: number;
  isTopPick?: boolean;
  impressionKind?: CockpitImpressionKind;
  productCount?: number;
  ctaMode?: CockpitCtaMode;
  destinationType?: CockpitDestinationType;
  /** product.ctaMode as stored in the DB — kept alongside the rendered
   *  ctaMode so discrepancies stay visible in the dashboard. */
  productCtaMode?: string;
  ctaPosition?: 'primary' | 'secondary' | 'title';
  sortKey?: string;
  dir?: 'asc' | 'desc';
  trigger?: 'dropdown' | 'table_header' | 'intent_chip';
  filterKey?: string;
  enabled?: boolean;
  activeFilters?: string[];
  resultCount?: number;
  selected?: boolean;
  selectionCount?: number;
  source?: 'card' | 'table' | 'compare_chip' | 'compare_remove';
  expanded?: boolean;
  matcherQuestion?: string;
  matcherAnswer?: string;
  answeredCount?: number;
  topMatchSlug?: string;
  fitScore?: number;
  amount?: number;
  years?: number;
  costModelKind?: string;
  // Reserved attribution fields — typed now, never populated in cockpit_v1.
  affiliateNetwork?: string;
  affiliateProgramId?: string;
  affiliateClickId?: string;
  campaignId?: string;
  subId?: string;
  subId2?: string;
  payoutType?: string;
  estimatedCommission?: number;
}

/** The `data` record POSTed to /api/track (columns of analytics_events). */
export interface CockpitEventData {
  eventName: CockpitEventName;
  eventCategory: typeof COCKPIT_EVENT_CATEGORY;
  eventAction: string;
  eventLabel: string;
  eventValue?: number;
  pagePath: string;
  properties: CockpitV1Properties;
}

const EVENT_ACTIONS: Record<CockpitEventName, string> = {
  cockpit_view: 'view',
  cockpit_product_impression: 'impression',
  cockpit_cta_click: 'cta_click',
  cockpit_sort_change: 'sort_change',
  cockpit_filter_change: 'filter_change',
  cockpit_compare_toggle: 'compare_toggle',
  cockpit_details_toggle: 'details_toggle',
  cockpit_matcher_open: 'matcher_open',
  cockpit_matcher_answer: 'matcher_answer',
  cockpit_matcher_complete: 'matcher_complete',
  cockpit_amount_change: 'amount_change',
  cockpit_years_change: 'years_change',
};

function deriveLabel(name: CockpitEventName, p: CockpitV1Properties): string {
  switch (name) {
    case 'cockpit_view':
      return p.surface ?? 'cockpit';
    case 'cockpit_product_impression':
    case 'cockpit_cta_click':
    case 'cockpit_compare_toggle':
    case 'cockpit_details_toggle':
      return p.productSlug ?? '';
    case 'cockpit_sort_change':
      return p.sortKey ?? '';
    case 'cockpit_filter_change':
      return p.filterKey ?? '';
    case 'cockpit_matcher_open':
      return 'matcher';
    case 'cockpit_matcher_answer':
      return p.matcherQuestion ?? '';
    case 'cockpit_matcher_complete':
      return p.topMatchSlug ?? '';
    case 'cockpit_amount_change':
      return 'amount';
    case 'cockpit_years_change':
      return 'years';
  }
}

function deriveValue(name: CockpitEventName, p: CockpitV1Properties): number | undefined {
  switch (name) {
    case 'cockpit_product_impression':
    case 'cockpit_cta_click':
    case 'cockpit_details_toggle':
      return p.rank;
    case 'cockpit_filter_change':
      return p.resultCount;
    case 'cockpit_compare_toggle':
      return p.selectionCount;
    case 'cockpit_matcher_complete':
      return p.fitScore;
    case 'cockpit_amount_change':
      return p.amount;
    case 'cockpit_years_change':
      return p.years;
    default:
      return undefined;
  }
}

/** Builds the /api/track `data` record for one cockpit event. */
export function buildCockpitEventData(
  name: CockpitEventName,
  ctx: CockpitContext,
  pagePath: string,
  props: Omit<Partial<CockpitV1Properties>, 'schemaVersion' | 'market' | 'category' | 'topic'> = {},
): CockpitEventData {
  const properties: CockpitV1Properties = {
    schemaVersion: COCKPIT_SCHEMA_VERSION,
    market: ctx.market,
    category: ctx.category,
    topic: ctx.topic,
    ...props,
  };
  return {
    eventName: name,
    eventCategory: COCKPIT_EVENT_CATEGORY,
    eventAction: EVENT_ACTIONS[name],
    eventLabel: deriveLabel(name, properties),
    eventValue: deriveValue(name, properties),
    pagePath,
    properties,
  };
}

// ── Cockpit path parsing ─────────────────────────────────────────────────────
// The dashboard derives market/category/topic from page_path because the
// global pageview layer does not reliably populate page_views.market/category.
// Every cockpit route is market-prefixed: /{us|uk|ca|au}/{category}/best/{topic}
// (US uses /us/... too — there is no unprefixed cockpit route).

const COCKPIT_PATH_RE = /^\/(us|uk|ca|au)\/([a-z0-9-]+)\/best\/([a-z0-9-]+)\/?$/;

export function parseCockpitPath(
  pagePath: string | null | undefined,
): { market: string; category: string; topic: string } | null {
  if (!pagePath) return null;
  const path = pagePath.split('?')[0].split('#')[0];
  const m = COCKPIT_PATH_RE.exec(path);
  if (!m) return null;
  return { market: m[1], category: m[2], topic: m[3] };
}

// ── Impression dedup ─────────────────────────────────────────────────────────
// One impression per session + page + surface (+ product + rank). Rank is
// part of the key for product-level impressions so a re-sort/re-filter that
// moves a product to a new rank produces a FRESH impression at that rank —
// otherwise a click at the new rank would have no matching impression at
// that rank (the impression would still show the stale first-seen rank),
// corrupting rank-based CTR cohorts (e.g. Top-3 vs Rest). Surface-level
// impressions (cockpit_view) omit rank. sessionStorage is per-tab-session,
// matching the sfp_session_id lifetime exactly.

export const IMPRESSION_STORAGE_KEY = 'sfp_ck_imp_v1';
const IMPRESSION_CAP = 500;

export function impressionKey(
  pagePath: string,
  surface: string,
  productSlug?: string,
  rank?: number,
): string {
  return `${pagePath}|${surface}|${productSlug ?? ''}|${rank ?? ''}`;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ImpressionDeduper {
  hasSeen(key: string): boolean;
  /** Marks the key as seen. Returns true when newly marked (= fire the event). */
  markSeen(key: string): boolean;
}

export function createImpressionDeduper(storage?: KeyValueStorage | null): ImpressionDeduper {
  const seen = new Set<string>();
  if (storage) {
    try {
      const raw = storage.getItem(IMPRESSION_STORAGE_KEY);
      if (raw) {
        const arr: unknown = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const k of arr) if (typeof k === 'string') seen.add(k);
        }
      }
    } catch {
      // Corrupt / unavailable storage → in-memory-only dedup (still fail-soft).
    }
  }
  return {
    hasSeen(key) {
      return seen.has(key);
    },
    markSeen(key) {
      if (seen.has(key)) return false;
      seen.add(key);
      if (storage) {
        try {
          let arr = [...seen];
          if (arr.length > IMPRESSION_CAP) arr = arr.slice(arr.length - IMPRESSION_CAP);
          storage.setItem(IMPRESSION_STORAGE_KEY, JSON.stringify(arr));
        } catch {
          // Quota / privacy mode → keep in-memory dedup only.
        }
      }
      return true;
    },
  };
}

// ── Event queue (batching) ───────────────────────────────────────────────────
// Flush policy: (a) queue reaches maxBatch, (b) flushDelayMs after the first
// enqueue, (c) caller requests immediate (CTA clicks — beacon before
// navigation), (d) external flush (pagehide). A send() that throws never
// propagates — tracking must not break the UI.

/** Server-side hard cap per batch — keep in sync with TrackEventBatchSchema. */
export const EVENT_BATCH_HARD_CAP = 20;

/**
 * Rate-limit weight for a POST /api/track request. A single-event request
 * ('event'/'pageview'/'scroll'/'time_on_page') costs 1 token, matching the
 * existing per-request limiter. A batch costs one token PER EVENT it carries
 * (clamped to the hard cap) — otherwise one request could write up to
 * EVENT_BATCH_HARD_CAP rows for the price of a single token, silently
 * multiplying the effective per-IP write budget by that factor.
 */
export function computeTrackRateLimitWeight(type: string, rawEventsLength: unknown): number {
  if (type !== 'event_batch') return 1;
  const n = typeof rawEventsLength === 'number' && Number.isFinite(rawEventsLength) ? rawEventsLength : 0;
  return Math.max(1, Math.min(n, EVENT_BATCH_HARD_CAP));
}

type TimerHandle = ReturnType<typeof setTimeout> | number | object;

export interface EventQueueOptions {
  send: (events: CockpitEventData[]) => void;
  maxBatch?: number;
  flushDelayMs?: number;
  schedule?: (fn: () => void, ms: number) => TimerHandle;
  cancel?: (handle: TimerHandle) => void;
}

export interface CockpitEventQueue {
  enqueue(event: CockpitEventData, opts?: { immediate?: boolean }): void;
  flush(): void;
  size(): number;
}

export function createEventQueue(options: EventQueueOptions): CockpitEventQueue {
  const maxBatch = options.maxBatch ?? 12;
  const flushDelayMs = options.flushDelayMs ?? 800;
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = options.cancel ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));

  let queue: CockpitEventData[] = [];
  let timer: TimerHandle | null = null;

  function flush(): void {
    if (timer !== null) {
      try {
        cancel(timer);
      } catch {
        /* fail-soft */
      }
      timer = null;
    }
    while (queue.length > 0) {
      const batch = queue.slice(0, EVENT_BATCH_HARD_CAP);
      queue = queue.slice(EVENT_BATCH_HARD_CAP);
      try {
        options.send(batch);
      } catch {
        // Dropped batch is acceptable; a throwing tracker is not.
      }
    }
  }

  function enqueue(event: CockpitEventData, opts?: { immediate?: boolean }): void {
    queue.push(event);
    if (opts?.immediate || queue.length >= maxBatch) {
      flush();
      return;
    }
    if (timer === null) {
      timer = schedule(flush, flushDelayMs);
    }
  }

  return { enqueue, flush, size: () => queue.length };
}

// ── Trailing debounce (sliders) ──────────────────────────────────────────────

export function createTrailingDebounce<T>(
  fn: (value: T) => void,
  delayMs: number,
  schedule: (cb: () => void, ms: number) => TimerHandle = (cb, ms) => setTimeout(cb, ms),
  cancel: (handle: TimerHandle) => void = (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
): (value: T) => void {
  let timer: TimerHandle | null = null;
  let last: T;
  return (value: T) => {
    last = value;
    if (timer !== null) {
      try {
        cancel(timer);
      } catch {
        /* fail-soft */
      }
    }
    timer = schedule(() => {
      timer = null;
      try {
        fn(last);
      } catch {
        /* fail-soft */
      }
    }, delayMs);
  };
}
