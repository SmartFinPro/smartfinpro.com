'use client';

// lib/analytics/tool-tracking.ts
// Browser binding for tool_v1 events — thin, fail-soft module singleton over
// the pure core in lib/analytics/tool-events.ts and the generic primitives
// in lib/analytics/event-queue.ts. Mirrors lib/analytics/cockpit-tracking.ts
// 1:1 (killswitch, sendBeacon→fetch-keepalive fallback, pagehide/
// visibilitychange flush, gtag-guard) — tool_v1 is a strictly additive
// sibling; cockpit_v1 files are never imported or modified here.
//
// - sendBeacon POST /api/track {type:'tool_event_batch'} with fetch-keepalive fallback
// - one shared queue (flush: 12 events / 800ms / pagehide / immediate sends)
// - sessionStorage impression dedup (per funnel key: sessionId+toolId+market+variantPath)
// - killswitch: NEXT_PUBLIC_ENABLE_ANALYTICS==='false' (same flag as cockpit) —
//   and every entry point no-ops on SSR
// - plain function export (createToolTracker) usable outside React;
//   useToolTracking() is the hook convenience layer (stable identity + pagehide flush)

import { useEffect, useRef } from 'react';
import {
  createEventQueue,
  createImpressionDeduper,
  createTrailingDebounce,
  type ImpressionDeduper,
  type EventQueue,
} from '@/lib/analytics/event-queue';
import {
  buildToolEventData,
  funnelKey,
  isQualifiedDecision,
  advanceQualifiedVisibility,
  qualifiedVisibleMs,
  toInputBucket,
  createInputChangeGate,
  INITIAL_QUALIFIED_VISIBILITY,
  TOOL_IMPRESSION_STORAGE_KEY,
  TOOL_EVENT_BATCH_HARD_CAP,
  INPUT_DEBOUNCE_MS,
  type ToolContext,
  type ToolEventData,
  type ToolEventName,
  type ToolV1Properties,
  type ControlRole,
  type InputBucketKind,
  type NextActionKind,
  type QualifiedDecisionSignals,
  type QualifiedVisibilityState,
} from '@/lib/analytics/tool-events';
import { getOrCreateAnalyticsSessionId } from '@/lib/analytics/session';

export interface ToolTracker {
  /** dedupe 1×/funnelKey; sets resultState:'example' as the initial property (Spec 10.2). */
  trackView(): void;
  /** dedupe 1×/funnelKey (fires once regardless of which field started it). */
  trackStart(inputKey: string): void;
  /** 600ms trailing debounce PER inputKey; gated (FIELD_INPUT_CAP/LEVER_INPUT_CAP); value is bucketed, never raw. */
  trackInputChange(inputKey: string, rawValue: number, kind: InputBucketKind, role?: ControlRole): void;
  /**
   * Same debounce/gate/qualified-decision plumbing as trackInputChange, but
   * for a value that is ALREADY a bucket (e.g. a quiz answer slug like
   * 'beginner') — added in PR 1.3 because numeric toInputBucket() bucketing
   * would destroy a categorical answer's identity (Spec 10.2: inputBucket is
   * a bucket, never a raw value; a categorical slug already IS the bucket).
   */
  trackCategoricalInputChange(inputKey: string, bucket: string, role?: ControlRole): void;
  /** dedupe 1×/funnelKey; ttfvMs = now − viewAt. */
  trackFirstResult(): void;
  trackScenarioCompare(scenario: string): void;
  trackShare(shareFieldCount: number): void;
  trackReport(format: 'pdf' | 'email'): void;
  /** kind 'cockpit' fires tool_next_action_click, THEN tool_cockpit_cta_click — both immediate. */
  trackNextAction(kind: NextActionKind, href: string): void;
  trackError(errorKind: string): void;
  /** IntersectionObserver threshold 0.5 + visibilitychange → qualified-visibility reducer. Returns cleanup. */
  bindResultVisibility(el: Element): () => void;
  /** Flushes the shared queue — call on pagehide. */
  flush(): void;
}

// ── Module singletons (lazy, browser-only), shared across every mounted tool ──

let queueSingleton: EventQueue<ToolEventData> | null = null;
let deduperSingleton: ImpressionDeduper | null = null;

function isEnabled(): boolean {
  return typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';
}

function sendBatch(events: ToolEventData[]): void {
  const sessionId = getOrCreateAnalyticsSessionId();
  if (!sessionId) return;
  const payload = JSON.stringify({ type: 'tool_event_batch', sessionId, data: { events } });
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

function getQueue(): EventQueue<ToolEventData> {
  if (!queueSingleton) {
    queueSingleton = createEventQueue<ToolEventData>({ send: sendBatch, hardCap: TOOL_EVENT_BATCH_HARD_CAP });
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
    deduperSingleton = createImpressionDeduper(TOOL_IMPRESSION_STORAGE_KEY, storage);
  }
  return deduperSingleton;
}

// ── Google Analytics mirroring ───────────────────────────────────────────────
// ONLY tool_view / tool_qualified_decision / tool_cockpit_cta_click are
// mirrored (GA quota) — NO legacy aliases (unlike the cockpit transition).

type GtagFn = (command: string, event: string, params: Record<string, unknown>) => void;

const GA_MIRROR_EVENTS: ReadonlySet<ToolEventName> = new Set([
  'tool_view',
  'tool_qualified_decision',
  'tool_cockpit_cta_click',
]);

function mirrorToGtag(data: ToolEventData): void {
  try {
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
    if (!gtag) return;
    if (!GA_MIRROR_EVENTS.has(data.eventName)) return;
    gtag('event', data.eventName, {
      event_category: 'Tool',
      event_label: data.eventLabel,
      value: data.eventValue,
      tool_id: data.properties.toolId,
      market: data.properties.market,
      shell_mode: data.properties.shellMode,
    });
  } catch {
    // fail-soft
  }
}

// ── Tracker factory (plain function — usable outside the React tree) ────────

export function createToolTracker(ctx: ToolContext): ToolTracker {
  let viewAt: number | null = null;
  let firstResultFired = false;
  let scenarioCompared = false;
  let leverUsed = false;
  let nextActionClicked = false;
  let shared = false;
  let reportDownloaded = false;
  let reportEmailed = false;
  let visibility: QualifiedVisibilityState = INITIAL_QUALIFIED_VISIBILITY;
  const changedInputKeys = new Set<string>();
  const gate = createInputChangeGate();
  const debouncers = new Map<string, (value: { rawValue: number; kind: InputBucketKind; role: ControlRole }) => void>();
  /** Separate debouncer map for trackCategoricalInputChange (PR 1.3) — keyed the same way, disjoint values. */
  const categoricalDebouncers = new Map<string, (value: { bucket: string; role: ControlRole }) => void>();
  let qualifiedInterval: ReturnType<typeof setInterval> | null = null;

  function currentFunnelKey(): string {
    return funnelKey(getOrCreateAnalyticsSessionId() ?? '', ctx);
  }

  function enqueue(
    name: ToolEventName,
    props: Omit<Partial<ToolV1Properties>, 'schemaVersion' | keyof ToolContext> = {},
    opts?: { immediate?: boolean },
  ): void {
    if (!isEnabled()) return;
    try {
      const data = buildToolEventData(name, ctx, props);
      getQueue().enqueue(data, opts);
      mirrorToGtag(data);
    } catch {
      // fail-soft
    }
  }

  function checkQualified(): void {
    if (!isEnabled()) return;
    try {
      const key = `q|${currentFunnelKey()}`;
      const signals: QualifiedDecisionSignals = {
        firstResultFired,
        scenarioCompared,
        leverUsed,
        nextActionClicked,
        shared,
        reportDownloaded,
        reportEmailed,
        qualifiedVisibleMs: qualifiedVisibleMs(visibility, Date.now()),
        qualifyingInputCount: changedInputKeys.size,
        alreadyQualified: getDeduper().hasSeen(key),
      };
      const { qualified, via } = isQualifiedDecision(signals);
      if (!qualified || !via) return;
      if (!getDeduper().markSeen(key)) return; // race safety — never double-fire
      enqueue('tool_qualified_decision', { qualifiedVia: via }, { immediate: true });
    } catch {
      // fail-soft
    }
  }

  function trackView(): void {
    if (!isEnabled()) return;
    try {
      viewAt = Date.now();
      const key = `v|${currentFunnelKey()}`;
      if (!getDeduper().markSeen(key)) return;
      enqueue('tool_view', { resultState: 'example' });
      checkQualified();
    } catch {
      // fail-soft
    }
  }

  function trackStart(inputKey: string): void {
    if (!isEnabled()) return;
    try {
      const key = `s|${currentFunnelKey()}`;
      if (!getDeduper().markSeen(key)) return;
      enqueue('tool_start', { inputKey });
      checkQualified();
    } catch {
      // fail-soft
    }
  }

  function trackInputChange(
    inputKey: string,
    rawValue: number,
    kind: InputBucketKind,
    role: ControlRole = 'field',
  ): void {
    if (!isEnabled()) return;
    try {
      let debounced = debouncers.get(inputKey);
      if (!debounced) {
        debounced = createTrailingDebounce<{ rawValue: number; kind: InputBucketKind; role: ControlRole }>(
          (value) => {
            if (!gate.allow(value.role)) return;
            changedInputKeys.add(inputKey);
            if (value.role === 'lever') leverUsed = true;
            enqueue('tool_input_change', {
              inputKey,
              inputBucket: toInputBucket(value.rawValue, value.kind),
              controlRole: value.role,
            });
            checkQualified();
          },
          INPUT_DEBOUNCE_MS,
        );
        debouncers.set(inputKey, debounced);
      }
      debounced({ rawValue, kind, role });
    } catch {
      // fail-soft
    }
  }

  function trackCategoricalInputChange(
    inputKey: string,
    bucket: string,
    role: ControlRole = 'field',
  ): void {
    if (!isEnabled()) return;
    try {
      let debounced = categoricalDebouncers.get(inputKey);
      if (!debounced) {
        debounced = createTrailingDebounce<{ bucket: string; role: ControlRole }>(
          (value) => {
            if (!gate.allow(value.role)) return;
            changedInputKeys.add(inputKey);
            if (value.role === 'lever') leverUsed = true;
            enqueue('tool_input_change', {
              inputKey,
              inputBucket: value.bucket,
              controlRole: value.role,
            });
            checkQualified();
          },
          INPUT_DEBOUNCE_MS,
        );
        categoricalDebouncers.set(inputKey, debounced);
      }
      debounced({ bucket, role });
    } catch {
      // fail-soft
    }
  }

  function trackFirstResult(): void {
    if (!isEnabled()) return;
    try {
      const key = `fr|${currentFunnelKey()}`;
      if (!getDeduper().markSeen(key)) return;
      firstResultFired = true;
      const ttfvMs = viewAt !== null ? Date.now() - viewAt : undefined;
      enqueue('tool_first_result', { ttfvMs });
      checkQualified();
    } catch {
      // fail-soft
    }
  }

  function trackScenarioCompare(scenario: string): void {
    if (!isEnabled()) return;
    try {
      scenarioCompared = true;
      enqueue('tool_scenario_compare', { scenario });
      checkQualified();
    } catch {
      // fail-soft
    }
  }

  function trackShare(shareFieldCount: number): void {
    if (!isEnabled()) return;
    try {
      shared = true;
      enqueue('tool_result_share', { shareFieldCount });
      checkQualified();
    } catch {
      // fail-soft
    }
  }

  function trackReport(format: 'pdf' | 'email'): void {
    if (!isEnabled()) return;
    try {
      if (format === 'pdf') reportDownloaded = true;
      else reportEmailed = true;
      enqueue(format === 'pdf' ? 'tool_report_download' : 'tool_report_email', { format });
      checkQualified();
    } catch {
      // fail-soft
    }
  }

  function trackNextAction(kind: NextActionKind, href: string): void {
    if (!isEnabled()) return;
    try {
      nextActionClicked = true;
      enqueue('tool_next_action_click', { nextActionKind: kind, bridgeHref: href }, { immediate: true });
      if (kind === 'cockpit') {
        enqueue('tool_cockpit_cta_click', { nextActionKind: kind, bridgeHref: href }, { immediate: true });
      }
      checkQualified();
    } catch {
      // fail-soft
    }
  }

  function trackError(errorKind: string): void {
    if (!isEnabled()) return;
    try {
      enqueue('tool_calculation_error', { errorKind }, { immediate: true });
    } catch {
      // fail-soft
    }
  }

  function bindResultVisibility(el: Element): () => void {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return () => {};
    let intersecting = false;

    function isQualifiedVisible(): boolean {
      return intersecting && document.visibilityState === 'visible';
    }

    function advance(): void {
      visibility = advanceQualifiedVisibility(visibility, isQualifiedVisible(), Date.now());
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        advance();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);

    const onVisibilityChange = () => advance();
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (qualifiedInterval === null) {
      qualifiedInterval = setInterval(() => {
        advance();
        checkQualified();
      }, 1000);
    }

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (qualifiedInterval !== null) {
        clearInterval(qualifiedInterval);
        qualifiedInterval = null;
      }
    };
  }

  function flush(): void {
    try {
      getQueue().flush();
    } catch {
      // fail-soft
    }
  }

  return {
    trackView,
    trackStart,
    trackInputChange,
    trackCategoricalInputChange,
    trackFirstResult,
    trackScenarioCompare,
    trackShare,
    trackReport,
    trackNextAction,
    trackError,
    bindResultVisibility,
    flush,
  };
}

// ── Hook convenience layer ───────────────────────────────────────────────────

/** Stable tracker identity via useRef; binds a pagehide flush for this instance. */
export function useToolTracking(ctx: ToolContext): ToolTracker {
  const trackerRef = useRef<ToolTracker | null>(null);
  if (!trackerRef.current) {
    trackerRef.current = createToolTracker(ctx);
  }
  const tracker = trackerRef.current;

  useEffect(() => {
    const onPageHide = () => tracker.flush();
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [tracker]);

  return tracker;
}
