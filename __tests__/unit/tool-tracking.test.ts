// __tests__/unit/tool-tracking.test.ts
// Client binding for tool_v1 (lib/analytics/tool-tracking.ts) — verifies the
// browser-runtime wiring on top of the pure core (tool-events.ts) and the
// generic primitives (event-queue.ts): view/start/first-result dedupe shared
// across tracker instances (module-singleton queue + deduper, mirroring
// lib/analytics/cockpit-tracking.ts), per-inputKey debounce + gate
// enforcement, the tool_next_action_click → tool_cockpit_cta_click
// double-fire ordering, the qualified-decision fire-once contract, and the
// exact 3-event GA-mirror whitelist.
//
// cockpit-tracking.ts itself has no unit tests (e2e-only) — the PR 1.2 brief
// explicitly requires unit coverage for tool-tracking.ts's wiring logic, so
// this file stubs a minimal browser surface on globalThis (window/document/
// navigator/sessionStorage/fetch — none exist in vitest's `node`
// environment) and re-imports the module fresh per test (vi.resetModules())
// to avoid module-singleton leakage between cases.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ToolContext } from '@/lib/analytics/tool-events';

const CTX: ToolContext = {
  toolId: 'money-leak-scanner',
  market: 'us',
  variantPath: '/tools/money-leak-scanner',
  shellMode: 'live-canvas',
};

interface SentBatch {
  type: string;
  sessionId: string;
  data: { events: Array<Record<string, unknown>> };
}

interface BrowserEnv {
  sentBatches: SentBatch[];
  gtagCalls: Array<[string, Record<string, unknown>]>;
}

/** Minimal browser surface for the module's window/document/navigator/sessionStorage/fetch use. */
function stubBrowserEnv(): BrowserEnv {
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
  const sentBatches: SentBatch[] = [];
  const gtagCalls: Array<[string, Record<string, unknown>]> = [];

  const fakeWindow: Record<string, unknown> = {
    sessionStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
    gtag: (_command: string, eventName: string, params: Record<string, unknown>) => {
      gtagCalls.push([eventName, params]);
    },
  };

  // Node ships a built-in read-only `navigator` global (getter, no setter) —
  // plain assignment throws in strict mode. Redefine it as a configurable,
  // writable data property so each test gets a fresh stub.
  const define = (key: string, value: unknown) =>
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

  define('window', fakeWindow);
  define('document', {
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  define('navigator', { sendBeacon: undefined });
  define('sessionStorage', storage);
  define('fetch', vi.fn((_url: string, init?: RequestInit) => {
    if (init?.body) {
      try {
        sentBatches.push(JSON.parse(init.body as string) as SentBatch);
      } catch {
        /* ignore malformed test noise */
      }
    }
    return Promise.resolve({ ok: true });
  }));

  return { sentBatches, gtagCalls };
}

function teardownBrowserEnv(): void {
  for (const key of ['window', 'document', 'navigator', 'sessionStorage', 'fetch']) {
    delete (globalThis as Record<string, unknown>)[key];
  }
}

function allEvents(env: BrowserEnv): Array<Record<string, unknown>> {
  return env.sentBatches.flatMap((b) => b.data.events);
}

async function freshModule() {
  vi.resetModules();
  return import('@/lib/analytics/tool-tracking');
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  teardownBrowserEnv();
});

describe('createToolTracker()', () => {
  it("trackView() sends tool_view with resultState 'example' as the initial property", async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    tracker.trackView();
    vi.advanceTimersByTime(800); // trailing queue flush (view is batched, not immediate)

    const events = allEvents(env);
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('tool_view');
    const props = events[0].properties as Record<string, unknown>;
    expect(props.resultState).toBe('example');
  });

  it('trackView/trackStart/trackFirstResult dedupe once per funnel key, shared across two tracker instances (same storage)', async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const trackerA = createToolTracker(CTX);
    const trackerB = createToolTracker(CTX); // second instance, same module-singleton storage

    trackerA.trackView();
    trackerB.trackView(); // same funnel key → must NOT fire again
    trackerA.trackStart('monthlyIncome');
    trackerB.trackStart('expenses'); // still one tool_start per funnel, regardless of inputKey
    trackerA.trackFirstResult();
    trackerB.trackFirstResult();
    vi.advanceTimersByTime(800); // trailing queue flush

    const names = allEvents(env).map((e) => e.eventName);
    expect(names.filter((n) => n === 'tool_view')).toHaveLength(1);
    expect(names.filter((n) => n === 'tool_start')).toHaveLength(1);
    expect(names.filter((n) => n === 'tool_first_result')).toHaveLength(1);
  });

  it('trackInputChange debounces per inputKey — two fields changing concurrently settle to two events', async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    tracker.trackInputChange('monthlyIncome', 4200, 'currency');
    tracker.trackInputChange('monthlyIncome', 4300, 'currency'); // same field, rapid — settles once
    tracker.trackInputChange('years', 12, 'years');

    vi.advanceTimersByTime(599);
    expect(allEvents(env).filter((e) => e.eventName === 'tool_input_change')).toHaveLength(0);
    vi.advanceTimersByTime(1); // 600ms — both per-field debounces settle, pushing onto the shared queue
    vi.advanceTimersByTime(800); // shared queue's own trailing flush (events are batched, not immediate)

    const inputEvents = allEvents(env).filter((e) => e.eventName === 'tool_input_change');
    expect(inputEvents).toHaveLength(2);
    const income = inputEvents.find(
      (e) => (e.properties as Record<string, unknown>).inputKey === 'monthlyIncome',
    )!;
    expect((income.properties as Record<string, unknown>).inputBucket).toBe('2500-5000'); // settled value 4300
  });

  it('trackCategoricalInputChange sends the bucket value verbatim (never numeric-bucketed) and shares the gate with trackInputChange', async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    // PR 1.3: the Broker Finder Quiz answers are categorical slugs
    // ('beginner', 'growth', ...) — bucketing them through toInputBucket()
    // would destroy their identity, so this path skips it entirely.
    tracker.trackCategoricalInputChange('experience', 'beginner');
    vi.advanceTimersByTime(600); // per-inputKey debounce
    vi.advanceTimersByTime(800); // shared queue trailing flush

    const inputEvents = allEvents(env).filter((e) => e.eventName === 'tool_input_change');
    expect(inputEvents).toHaveLength(1);
    const props = inputEvents[0].properties as Record<string, unknown>;
    expect(props.inputKey).toBe('experience');
    expect(props.inputBucket).toBe('beginner');
    expect(props.controlRole).toBe('field');
  });

  it('input-change gate: field cap (40) blocks the 41st change silently', async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    for (let i = 0; i < 41; i++) {
      tracker.trackInputChange(`field-${i}`, 10, 'count', 'field');
      vi.advanceTimersByTime(600);
    }

    const inputEvents = allEvents(env).filter((e) => e.eventName === 'tool_input_change');
    expect(inputEvents).toHaveLength(40);
  });

  it("trackNextAction('cockpit', href) fires tool_next_action_click THEN tool_cockpit_cta_click, both as separate immediate sends", async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    tracker.trackNextAction('cockpit', '/us/personal-finance/best/robo-advisors');

    expect(env.sentBatches).toHaveLength(2); // two separate immediate sends, in order
    expect(env.sentBatches[0].data.events[0].eventName).toBe('tool_next_action_click');
    expect(env.sentBatches[1].data.events[0].eventName).toBe('tool_cockpit_cta_click');
  });

  it('trackNextAction with a non-cockpit kind fires ONLY tool_next_action_click', async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    tracker.trackNextAction('review', '/us/reviews/some-review');

    const names = allEvents(env).map((e) => e.eventName);
    expect(names).toEqual(['tool_next_action_click']);
  });

  it('tool_qualified_decision fires exactly once per funnel key (via mock storage), even if the triggering signal repeats', async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    tracker.trackFirstResult(); // firstResultFired = true, required precondition
    tracker.trackNextAction('review', '/us/reviews/some-review'); // qualifies via 'next_action'
    tracker.trackNextAction('review', '/us/reviews/some-review'); // repeat signal — must not re-fire

    const qualified = allEvents(env).filter((e) => e.eventName === 'tool_qualified_decision');
    expect(qualified).toHaveLength(1);
    expect((qualified[0].properties as Record<string, unknown>).qualifiedVia).toBe('next_action');
  });

  it('GA mirror fires ONLY for tool_view, tool_qualified_decision, tool_cockpit_cta_click — no other event calls gtag', async () => {
    const env = stubBrowserEnv();
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    tracker.trackView();
    tracker.trackStart('monthlyIncome');
    tracker.trackInputChange('monthlyIncome', 4200, 'currency');
    vi.advanceTimersByTime(600);
    tracker.trackFirstResult();
    tracker.trackScenarioCompare('aggressive');
    tracker.trackShare(3);
    tracker.trackReport('pdf');
    tracker.trackNextAction('cockpit', '/us/personal-finance/best/robo-advisors');
    tracker.trackError('calc_overflow');

    const mirroredNames = env.gtagCalls.map(([eventName]) => eventName);
    expect(new Set(mirroredNames)).toEqual(
      new Set(['tool_view', 'tool_qualified_decision', 'tool_cockpit_cta_click']),
    );
  });

  it('tracking failure never throws (fail-soft) — a throwing fetch never propagates', async () => {
    stubBrowserEnv();
    (globalThis as Record<string, unknown>).fetch = vi.fn(() => {
      throw new Error('network down');
    });
    const { createToolTracker } = await freshModule();
    const tracker = createToolTracker(CTX);

    expect(() => tracker.trackView()).not.toThrow();
  });
});
