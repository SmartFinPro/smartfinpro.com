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

import { useEffect, useState } from 'react';
import { createEventQueue, type EventQueue } from '@/lib/analytics/event-queue';
import {
  buildResearchEventData,
  RESEARCH_EVENT_BATCH_HARD_CAP,
  type ResearchContext,
  type ResearchEventData,
  type ResearchEventName,
  type ResearchFacet,
  type ResearchProductStatus,
  type ResearchV1Properties,
  type ShortlistAction,
} from '@/lib/analytics/research-events';
import { getOrCreateAnalyticsSessionId } from '@/lib/analytics/session';

export interface ResearchTracker {
  /** Settled query only (never per keystroke); a zero-length query is dropped. */
  trackSearch(queryLength: number, resultCount: number): void;
  trackFilterChange(facet: ResearchFacet, value: string | null, active: boolean, resultCount: number): void;
  /** Open only — closing a disclosure is not an event. */
  trackEvidenceOpen(productSlug: string, status: ResearchProductStatus, dataPoints: number): void;
  /** Immediate — the click navigates away. `position` is 1-based in the rendered list. */
  trackReviewClick(
    productSlug: string,
    status: ResearchProductStatus,
    rank: number | null,
    position: number,
  ): void;
  trackShortlistChange(action: ShortlistAction, productSlug: string | null, count: number): void;
  /** Immediate — the handoff navigates to the Cockpit. */
  trackCockpitHandoff(productSlugs: string[]): void;
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
  function enqueue(
    name: ResearchEventName,
    props: Omit<Partial<ResearchV1Properties>, 'schemaVersion' | 'market' | 'topic'> = {},
    opts?: { immediate?: boolean },
  ): void {
    if (!isEnabled()) return;
    try {
      getQueue().enqueue(buildResearchEventData(name, ctx, props), opts);
    } catch {
      // fail-soft
    }
  }

  return {
    trackSearch(queryLength, resultCount) {
      // An empty query is a reset, not a search (contract) — drop it here so
      // no call site can accidentally emit it.
      if (queryLength <= 0) return;
      enqueue('research_search', { queryLength, resultCount });
    },

    trackFilterChange(facet, value, active, resultCount) {
      enqueue('research_filter_change', { facet, value, active, resultCount });
    },

    trackEvidenceOpen(productSlug, status, dataPoints) {
      enqueue('research_evidence_open', { productSlug, status, dataPoints });
    },

    trackReviewClick(productSlug, status, rank, position) {
      enqueue('research_review_click', { productSlug, status, rank, position }, { immediate: true });
    },

    trackShortlistChange(action, productSlug, count) {
      enqueue('research_shortlist_change', { action, productSlug, count });
    },

    trackCockpitHandoff(productSlugs) {
      enqueue(
        'research_cockpit_handoff',
        { productSlugs, count: productSlugs.length },
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
