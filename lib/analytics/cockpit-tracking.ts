'use client';

// lib/analytics/cockpit-tracking.ts
// Browser binding for cockpit_v1 events — thin, fail-soft module singleton
// over the pure core in lib/analytics/cockpit-events.ts.
//
// - sendBeacon POST /api/track {type:'event_batch'} with fetch-keepalive fallback
// - one shared queue (flush: 12 events / 800ms / pagehide / immediate CTA clicks)
// - sessionStorage impression dedup (per session+page+surface+product)
// - killswitch: NEXT_PUBLIC_ENABLE_ANALYTICS==='false' (same flag as
//   AnalyticsProvider) — and every entry point no-ops on SSR
// - plain function exports so server-rendered leaves (verdict CTA) can track
//   without React context; useCockpitTracking() is the hook convenience layer.

import { useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  buildCockpitEventData,
  createEventQueue,
  createImpressionDeduper,
  createTrailingDebounce,
  impressionKey,
  type CockpitContext,
  type CockpitEventData,
  type CockpitEventName,
  type CockpitEventQueue,
  type CockpitSurface,
  type CockpitV1Properties,
  type ImpressionDeduper,
} from '@/lib/analytics/cockpit-events';
import { getOrCreateAnalyticsSessionId } from '@/lib/analytics/session';

type CockpitEventProps = Omit<Partial<CockpitV1Properties>, 'schemaVersion' | 'market' | 'category' | 'topic'>;

// ── Module singletons (lazy, browser-only) ──────────────────────────────────

let queueSingleton: CockpitEventQueue | null = null;
let deduperSingleton: ImpressionDeduper | null = null;

function isEnabled(): boolean {
  return typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';
}

function sendBatch(events: CockpitEventData[]): void {
  const sessionId = getOrCreateAnalyticsSessionId();
  if (!sessionId) return;
  const payload = JSON.stringify({ type: 'event_batch', sessionId, data: { events } });
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

function getQueue(): CockpitEventQueue {
  if (!queueSingleton) {
    queueSingleton = createEventQueue({ send: sendBatch });
    // Flush pending events when the page is backgrounded or unloaded —
    // sendBeacon survives navigation (incl. same-tab /go/ redirects).
    const flush = () => queueSingleton?.flush();
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
  }
  return queueSingleton;
}

function getDeduper(): ImpressionDeduper {
  if (!deduperSingleton) {
    let storage: Pick<Storage, 'getItem' | 'setItem'> | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      storage = null; // privacy mode → in-memory dedup only
    }
    deduperSingleton = createImpressionDeduper(storage);
  }
  return deduperSingleton;
}

// ── Google Analytics mirroring ───────────────────────────────────────────────
// Only view + cta_click are mirrored (GA quota). Legacy aliases keep GA
// continuity for the two pre-cockpit_v1 event names.
// TODO(2026-08-11): remove the legacy aliases after the ~30-day transition.

type GtagFn = (command: string, event: string, params: Record<string, unknown>) => void;

function mirrorToGtag(data: CockpitEventData): void {
  try {
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
    if (!gtag) return;
    if (data.eventName !== 'cockpit_view' && data.eventName !== 'cockpit_cta_click') return;
    gtag('event', data.eventName, {
      event_category: 'Cockpit',
      event_label: data.eventLabel,
      value: data.eventValue,
      market: data.properties.market,
      topic: data.properties.topic,
      surface: data.properties.surface,
      cta_mode: data.properties.ctaMode,
    });
    if (data.eventName === 'cockpit_view' && data.properties.surface === 'cockpit') {
      gtag('event', 'comparison-cockpit_view', { event_category: 'Component Interaction', event_action: 'view' });
    }
    if (data.eventName === 'cockpit_cta_click' && data.properties.ctaMode === 'offer') {
      gtag('event', 'comparison-cockpit_offer_click', {
        event_category: 'Component Interaction',
        event_action: 'offer_click',
        event_label: data.properties.productSlug,
      });
    }
  } catch {
    // fail-soft
  }
}

// ── Public API (plain functions — usable outside the React tree) ────────────

export function trackCockpitEvent(
  ctx: CockpitContext,
  pagePath: string,
  name: CockpitEventName,
  props: CockpitEventProps = {},
  opts?: { immediate?: boolean },
): void {
  if (!isEnabled()) return;
  try {
    const data = buildCockpitEventData(name, ctx, pagePath, props);
    getQueue().enqueue(data, opts);
    mirrorToGtag(data);
  } catch {
    // fail-soft
  }
}

/** Surface-level visibility (cockpit_view) — fires once per session+page+surface. */
export function trackCockpitViewOnce(
  ctx: CockpitContext,
  pagePath: string,
  surface: CockpitSurface,
  props: CockpitEventProps = {},
): void {
  if (!isEnabled()) return;
  try {
    if (!getDeduper().markSeen(impressionKey(pagePath, surface))) return;
    trackCockpitEvent(ctx, pagePath, 'cockpit_view', { ...props, surface });
  } catch {
    // fail-soft
  }
}

/** Product-level impression — fires once per session+page+surface+product. */
export function trackCockpitProductImpressionOnce(
  ctx: CockpitContext,
  pagePath: string,
  props: CockpitEventProps & { productSlug: string; surface: CockpitSurface },
): void {
  if (!isEnabled()) return;
  try {
    if (!getDeduper().markSeen(impressionKey(pagePath, props.surface, props.productSlug))) return;
    trackCockpitEvent(ctx, pagePath, 'cockpit_product_impression', props);
  } catch {
    // fail-soft
  }
}

// ── Hook convenience layer ───────────────────────────────────────────────────

export interface CockpitTracking {
  track: (name: CockpitEventName, props?: CockpitEventProps, opts?: { immediate?: boolean }) => void;
  viewOnce: (surface: CockpitSurface, props?: CockpitEventProps) => void;
  productImpressionOnce: (props: CockpitEventProps & { productSlug: string; surface: CockpitSurface }) => void;
  trackAmountDebounced: (amount: number, costModelKind?: string) => void;
  trackYearsDebounced: (years: number, costModelKind?: string) => void;
}

export function useCockpitTracking(ctx: CockpitContext): CockpitTracking {
  const pathname = usePathname() ?? '/';
  // Context values are per-page constants; the ref keeps callback identities
  // stable without stringifying the object into dependency arrays.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const track = useCallback<CockpitTracking['track']>(
    (name, props, opts) => trackCockpitEvent(ctxRef.current, pathname, name, props, opts),
    [pathname],
  );

  const viewOnce = useCallback<CockpitTracking['viewOnce']>(
    (surface, props) => trackCockpitViewOnce(ctxRef.current, pathname, surface, props),
    [pathname],
  );

  const productImpressionOnce = useCallback<CockpitTracking['productImpressionOnce']>(
    (props) => trackCockpitProductImpressionOnce(ctxRef.current, pathname, props),
    [pathname],
  );

  const sliders = useMemo(
    () => ({
      amount: createTrailingDebounce<{ amount: number; costModelKind?: string }>(
        (v) => trackCockpitEvent(ctxRef.current, pathname, 'cockpit_amount_change', v),
        800,
      ),
      years: createTrailingDebounce<{ years: number; costModelKind?: string }>(
        (v) => trackCockpitEvent(ctxRef.current, pathname, 'cockpit_years_change', v),
        800,
      ),
    }),
    [pathname],
  );

  const trackAmountDebounced = useCallback(
    (amount: number, costModelKind?: string) => sliders.amount({ amount, costModelKind }),
    [sliders],
  );
  const trackYearsDebounced = useCallback(
    (years: number, costModelKind?: string) => sliders.years({ years, costModelKind }),
    [sliders],
  );

  return useMemo(
    () => ({ track, viewOnce, productImpressionOnce, trackAmountDebounced, trackYearsDebounced }),
    [track, viewOnce, productImpressionOnce, trackAmountDebounced, trackYearsDebounced],
  );
}
