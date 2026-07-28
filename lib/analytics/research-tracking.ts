'use client';

// lib/analytics/research-tracking.ts
// Browser binding for research_v1 events — a thin, fail-soft module singleton
// over the pure core in lib/analytics/research-events.ts and the generic
// primitives in lib/analytics/event-queue.ts. Mirrors lib/analytics/
// tool-tracking.ts (killswitch, sendBeacon→fetch-keepalive fallback, pagehide/
// visibilitychange flush) — research_v1 is a strictly additive sibling; the
// frozen cockpit_v1 files are never imported or modified here.
//
// - sendBeacon POST /api/track {type:'research_event_batch'} with fetch-keepalive fallback
// - one shared queue (flush: 12 events / 800ms / pagehide / immediate sends)
// - killswitch: NEXT_PUBLIC_ENABLE_ANALYTICS==='false' (same flag as cockpit/tool)
//   — and every entry point no-ops on SSR
// - no new cookie, storage key or vendor: the anonymous session id is the
//   existing sfp_session_id, nothing else identifies the visitor
// - no GA mirroring: the contract lists /api/track as the only sink
//
// Emission discipline (contract, frozen):
//   - trackSearch fires on the SETTLED query only (the caller's debounce) and
//     never for an empty one — the guard lives here so no call site can leak it.
//   - trackReviewClick / trackCockpitHandoff are sent IMMEDIATELY: the page is
//     navigating away and a queued batch could die with it.
//   - a throwing tracker must never break the UI — every entry point is wrapped.
//
// trackFinderCta (PR 3 Task 1, spec §12) — the Homepage Quick Finder's own
// CTA event, added additively on top of the frozen six above:
//   - sent IMMEDIATELY too (both 'view_all' and 'dossier_item' navigate away);
//   - fires ONLY when the caller invokes it — never on render, search, or
//     filter changes, so it can only ever represent a real CTA click;
//   - `props.resultCount` is forwarded byte-for-byte from the caller — this
//     module holds no "last known resultCount" state, so a click always
//     reports exactly what was on screen at that moment, never a stale or
//     recomputed value.

import { useEffect, useState } from 'react';
import { createEventQueue, type EventQueue } from '@/lib/analytics/event-queue';
import {
  buildResearchEventData,
  RESEARCH_EVENT_BATCH_HARD_CAP,
  type ResearchContext,
  type ResearchEventData,
  type ResearchEventName,
  type ResearchFacet,
  type ResearchItemDimensions,
  type ResearchProductStatus,
  type ResearchTrackOptions,
  type ResearchV1Properties,
  type ShortlistAction,
} from '@/lib/analytics/research-events';
import { getOrCreateAnalyticsSessionId } from '@/lib/analytics/session';

export interface ResearchTracker {
  /** Settled query only (never per keystroke); a zero-length query is dropped.
   *  `options.surface` is 'hub' for every call site today (Task 6); item
   *  dimensions (`topic`/`category`) are meaningless here — this is a GLOBAL
   *  event and always reports the tracker's bound `ctx.topic` ('hub'). */
  trackSearch(queryLength: number, resultCount: number, options?: ResearchTrackOptions): void;
  /** Global event — same `surface`-only usage as `trackSearch` above. */
  trackFilterChange(
    facet: ResearchFacet,
    value: string | null,
    active: boolean,
    resultCount: number,
    options?: ResearchTrackOptions,
  ): void;
  /** Open only — closing a disclosure is not an event. ITEM event: pass
   *  `options.topic`/`options.category` for the card's real projection. */
  trackEvidenceOpen(
    productSlug: string,
    status: ResearchProductStatus,
    dataPoints: number,
    options?: ResearchTrackOptions,
  ): void;
  /** Immediate — the click navigates away. `position` is 1-based in the
   *  rendered list. ITEM event: pass `options.topic`/`options.category`. */
  trackReviewClick(
    productSlug: string,
    status: ResearchProductStatus,
    rank: number | null,
    position: number,
    options?: ResearchTrackOptions,
  ): void;
  /** ITEM event: pass `options.topic`/`options.category` for the shortlist's
   *  scoped cockpitKey (null productSlug/no dimensions only for 'clear'). */
  trackShortlistChange(
    action: ShortlistAction,
    productSlug: string | null,
    count: number,
    options?: ResearchTrackOptions,
  ): void;
  /** Immediate — the handoff navigates to the Cockpit. ITEM event: pass
   *  `options.topic`/`options.category` for the shortlist's scoped cockpitKey. */
  trackCockpitHandoff(productSlugs: string[], options?: ResearchTrackOptions): void;
  /** Immediate — both Finder CTA variants navigate away (PR 3 Task 1).
   *  `trigger: 'view_all'` is the Finder's main CTA — a GLOBAL event; pass
   *  only `options.surface: 'finder'`, never `options.topic`/`category`.
   *  `trigger: 'dossier_item'` is a Cockpit-only card's CTA — an ITEM event;
   *  pass `options.topic`/`options.category` for that card's real
   *  projection. `props.resultCount` MUST be the count the caller actually
   *  saw at click time — this function forwards it verbatim, it is never
   *  recomputed or defaulted here. */
  trackFinderCta(
    trigger: 'view_all' | 'dossier_item',
    props: {
      queryLength: number;
      resultCount: number;
      productSlug?: string;
      kind?: 'review' | 'dossier';
    },
    options?: ResearchTrackOptions,
  ): void;
  /** Flushes the shared queue — call on pagehide. */
  flush(): void;
}

// ── Module singleton (lazy, browser-only), shared across mounted surfaces ────

let queueSingleton: EventQueue<ResearchEventData> | null = null;

function isEnabled(): boolean {
  return typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';
}

function sendBatch(events: ResearchEventData[]): void {
  const sessionId = getOrCreateAnalyticsSessionId();
  if (!sessionId) return;
  const payload = JSON.stringify({ type: 'research_event_batch', sessionId, data: { events } });
  try {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track', blob)) return;
  } catch {
    // fall through to fetch
  }
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // fail-soft — tracking must never break the page
  }
}

function getQueue(): EventQueue<ResearchEventData> {
  if (!queueSingleton) {
    queueSingleton = createEventQueue<ResearchEventData>({
      send: sendBatch,
      hardCap: RESEARCH_EVENT_BATCH_HARD_CAP,
    });
    // Flush pending events when the page is backgrounded or unloaded —
    // sendBeacon survives navigation (incl. the Cockpit handoff).
    const flush = () => queueSingleton?.flush();
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
  }
  return queueSingleton;
}

// ── Tracker factory (plain function — usable outside the React tree) ────────

export function createResearchTracker(ctx: ResearchContext): ResearchTracker {
  // Splits a call site's `ResearchTrackOptions` into the two shapes
  // `buildResearchEventData` wants: `dimensions` (topic/category — NEVER
  // serialized as-is, only applied while building `properties`) and the
  // three scalar properties (surface/kind/trigger), which fold straight into
  // `props` alongside the event's own fields. A call site that passes no
  // `options` at all keeps every pre-Task-6 call site byte-identical:
  // `dimensions` stays `{}` (topic falls back to the bound `ctx.topic`) and
  // no surface/kind/trigger key is added.
  function enqueue(
    name: ResearchEventName,
    props: Omit<Partial<ResearchV1Properties>, 'schemaVersion' | 'market' | 'topic'> = {},
    options?: ResearchTrackOptions,
    transportOpts?: { immediate?: boolean },
  ): void {
    if (!isEnabled()) return;
    try {
      const dimensions: Partial<ResearchItemDimensions> = {};
      if (options?.topic !== undefined) dimensions.topic = options.topic;
      if (options?.category !== undefined) dimensions.category = options.category;

      const fullProps: Omit<Partial<ResearchV1Properties>, 'schemaVersion' | 'market' | 'topic'> = {
        ...props,
      };
      if (options?.surface !== undefined) fullProps.surface = options.surface;
      if (options?.kind !== undefined) fullProps.kind = options.kind;
      if (options?.trigger !== undefined) fullProps.trigger = options.trigger;

      getQueue().enqueue(buildResearchEventData(name, ctx, fullProps, dimensions), transportOpts);
    } catch {
      // fail-soft
    }
  }

  return {
    trackSearch(queryLength, resultCount, options) {
      // An empty query is a reset, not a search (contract) — drop it here so
      // no call site can accidentally emit it.
      if (queryLength <= 0) return;
      enqueue('research_search', { queryLength, resultCount }, options);
    },

    trackFilterChange(facet, value, active, resultCount, options) {
      enqueue('research_filter_change', { facet, value, active, resultCount }, options);
    },

    trackEvidenceOpen(productSlug, status, dataPoints, options) {
      enqueue('research_evidence_open', { productSlug, status, dataPoints }, options);
    },

    trackReviewClick(productSlug, status, rank, position, options) {
      enqueue('research_review_click', { productSlug, status, rank, position }, options, { immediate: true });
    },

    trackShortlistChange(action, productSlug, count, options) {
      enqueue('research_shortlist_change', { action, productSlug, count }, options);
    },

    trackCockpitHandoff(productSlugs, options) {
      enqueue(
        'research_cockpit_handoff',
        { productSlugs, count: productSlugs.length },
        options,
        { immediate: true },
      );
    },

    trackFinderCta(trigger, props, options) {
      enqueue(
        'research_finder_cta',
        {
          trigger,
          queryLength: props.queryLength,
          // The caller's OWN resultCount, forwarded verbatim — never
          // recomputed or defaulted here (contract: it must be the count
          // actually visible at click time).
          resultCount: props.resultCount,
          ...(props.productSlug !== undefined ? { productSlug: props.productSlug } : {}),
          ...(props.kind !== undefined ? { kind: props.kind } : {}),
        },
        options,
        { immediate: true },
      );
    },

    flush() {
      try {
        getQueue().flush();
      } catch {
        // fail-soft
      }
    },
  };
}

// ── Hook convenience layer ───────────────────────────────────────────────────

/**
 * Stable tracker identity for the lifetime of the component; binds a pagehide
 * flush for this instance. Uses a lazy useState initializer rather than
 * tool-tracking.ts's useRef idiom: same once-per-mount semantics, but reading
 * a ref during render trips react-hooks/refs (the sibling file predates that
 * rule). ctx is captured once — the market/topic of a mounted surface don't
 * change without a remount.
 */
export function useResearchTracking(ctx: ResearchContext): ResearchTracker {
  const [tracker] = useState<ResearchTracker>(() => createResearchTracker(ctx));

  useEffect(() => {
    const onPageHide = () => tracker.flush();
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [tracker]);

  return tracker;
}
