// __tests__/unit/research-tracking.test.ts
// Client binding for research_v1 (lib/analytics/research-tracking.ts) — the
// browser-runtime wiring on top of the pure core (research-events.ts) and the
// generic primitives (event-queue.ts): the batch envelope, the killswitch, the
// "handoff is sent immediately because the page is navigating away" rule, the
// empty-query guard and the fail-soft promise (a throwing tracker must never
// break the UI).
//
// Same harness as tool-tracking.test.ts: vitest's `node` environment has no
// window/document/navigator/sessionStorage/fetch, so a minimal browser surface
// is stubbed on globalThis and the module is re-imported per test
// (vi.resetModules()) to avoid module-singleton leakage.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ResearchContext } from '@/lib/analytics/research-events';

const CTX: ResearchContext = { market: 'us', topic: 'trading-platforms', pagePath: '/research' };

interface SentBatch {
  type: string;
  sessionId: string;
  data: { events: Array<Record<string, unknown>> };
}

interface BrowserEnv {
  sentBatches: SentBatch[];
}

function stubBrowserEnv(): BrowserEnv {
  const store = new Map<string, string>([['sfp_session_id', 'session-research-1234']]);
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
  const sentBatches: SentBatch[] = [];

  const define = (key: string, value: unknown) =>
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

  define('window', { sessionStorage: storage, addEventListener: () => {}, removeEventListener: () => {} });
  define('document', { visibilityState: 'visible', addEventListener: () => {}, removeEventListener: () => {} });
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

  return { sentBatches };
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
  return import('@/lib/analytics/research-tracking');
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  teardownBrowserEnv();
  delete process.env.NEXT_PUBLIC_ENABLE_ANALYTICS;
});

describe('createResearchTracker() — transport envelope', () => {
  it("POSTs type 'research_event_batch' with the analytics session id", async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    createResearchTracker(CTX).trackSearch(6, 1);
    vi.advanceTimersByTime(800);

    expect(env.sentBatches).toHaveLength(1);
    expect(env.sentBatches[0].type).toBe('research_event_batch');
    expect(env.sentBatches[0].sessionId).toBe('session-research-1234');
    expect(env.sentBatches[0].data.events[0].eventName).toBe('research_search');
  });

  it('batches queued events into a single request', async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    const tracker = createResearchTracker(CTX);
    tracker.trackSearch(6, 1);
    tracker.trackFilterChange('status', 'audited', true, 8);
    tracker.trackEvidenceOpen('charles-schwab', 'audited', 4);
    vi.advanceTimersByTime(800);

    expect(env.sentBatches).toHaveLength(1);
    expect(allEvents(env)).toHaveLength(3);
  });
});

describe('emission discipline', () => {
  it('never sends a search event for an empty query', async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    createResearchTracker(CTX).trackSearch(0, 9);
    vi.advanceTimersByTime(800);
    expect(allEvents(env)).toHaveLength(0);
  });

  it('sends the cockpit handoff IMMEDIATELY — the page is navigating away', async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    createResearchTracker(CTX).trackCockpitHandoff(['fidelity', 'charles-schwab']);

    // No timer advance: the batch must already be on the wire.
    expect(env.sentBatches).toHaveLength(1);
    const event = allEvents(env)[0];
    expect(event.eventName).toBe('research_cockpit_handoff');
    expect((event.properties as Record<string, unknown>).productSlugs).toEqual(['fidelity', 'charles-schwab']);
    expect(event.eventValue).toBe(2);
  });

  it('sends the review click immediately too (same-tab navigation)', async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    createResearchTracker(CTX).trackReviewClick('etoro', 'provisional', null, 9);

    expect(env.sentBatches).toHaveLength(1);
    expect(allEvents(env)[0].eventName).toBe('research_review_click');
  });

  it("derives the shortlist count from the action ('clear' carries a null slug)", async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    const tracker = createResearchTracker(CTX);
    tracker.trackShortlistChange('add', 'fidelity', 1);
    tracker.trackShortlistChange('clear', null, 0);
    vi.advanceTimersByTime(800);

    const events = allEvents(env);
    expect(events).toHaveLength(2);
    expect((events[0].properties as Record<string, unknown>).action).toBe('add');
    expect((events[1].properties as Record<string, unknown>).productSlug).toBeNull();
    expect(events[1].eventValue).toBe(0);
  });
});

// Task 6 (unified-research-discovery-pr2-hubs plan, spec §12) — every track
// method's new optional `options` (`ResearchTrackOptions`) argument: item
// dimensions (topic/category) are removed from the top-level serialized
// props and folded into `properties` by the builder; surface/kind/trigger
// forward straight through as properties. Omitting `options` entirely (every
// call above this block) must keep behaving byte-identically — proven by the
// pre-Task-6 tests above still passing unmodified.
describe('ResearchTrackOptions (Task 6, spec §12)', () => {
  it('a global call forwards surface without touching topic/category', async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    createResearchTracker({ market: 'us', topic: 'hub', pagePath: '/research' }).trackSearch(6, 1, {
      surface: 'hub',
    });
    vi.advanceTimersByTime(800);

    const props = allEvents(env)[0].properties as Record<string, unknown>;
    expect(props.surface).toBe('hub');
    expect(props.topic).toBe('hub');
    expect(props.category).toBeUndefined();
  });

  it('an item call overrides topic/category and carries kind — the tracker-bound topic never leaks through', async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    createResearchTracker({ market: 'us', topic: 'hub', pagePath: '/research' }).trackReviewClick(
      'fidelity',
      'audited',
      1,
      1,
      { topic: 'trading-platforms', category: 'trading', kind: 'dossier' },
    );

    const props = allEvents(env)[0].properties as Record<string, unknown>;
    expect(props.topic).toBe('trading-platforms');
    expect(props.category).toBe('trading');
    expect(props.kind).toBe('dossier');
    // The override REPLACES the bound context topic, never appends a second key.
    expect(Object.keys(props).filter((k) => k === 'topic')).toHaveLength(1);
  });

  it('trackEvidenceOpen/trackShortlistChange/trackCockpitHandoff all thread options through', async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    const tracker = createResearchTracker({ market: 'us', topic: 'hub', pagePath: '/research' });
    const dims = { topic: 'trading-platforms', category: 'trading' as const, kind: 'dossier' as const };

    tracker.trackEvidenceOpen('fidelity', 'audited', 4, dims);
    tracker.trackShortlistChange('add', 'fidelity', 1, dims);
    vi.advanceTimersByTime(800);
    tracker.trackCockpitHandoff(['fidelity'], dims);

    const events = allEvents(env);
    expect(events).toHaveLength(3);
    for (const event of events) {
      const props = event.properties as Record<string, unknown>;
      expect(props.topic).toBe('trading-platforms');
      expect(props.category).toBe('trading');
      expect(props.kind).toBe('dossier');
    }
  });

  it('an omitted options argument keeps topic bound to ctx and carries no surface/kind/trigger/category', async () => {
    const env = stubBrowserEnv();
    const { createResearchTracker } = await freshModule();
    createResearchTracker(CTX).trackFilterChange('status', 'audited', true, 3);
    vi.advanceTimersByTime(800);

    const props = allEvents(env)[0].properties as Record<string, unknown>;
    expect(props.topic).toBe('trading-platforms');
    expect(props.surface).toBeUndefined();
    expect(props.kind).toBeUndefined();
    expect(props.category).toBeUndefined();
  });
});

describe('killswitch + fail-soft', () => {
  it("NEXT_PUBLIC_ENABLE_ANALYTICS='false' silences every entry point", async () => {
    const env = stubBrowserEnv();
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'false';
    const { createResearchTracker } = await freshModule();
    const tracker = createResearchTracker(CTX);
    tracker.trackSearch(6, 1);
    tracker.trackFilterChange('status', 'audited', true, 8);
    tracker.trackEvidenceOpen('charles-schwab', 'audited', 4);
    tracker.trackReviewClick('fidelity', 'audited', 1, 1);
    tracker.trackShortlistChange('add', 'fidelity', 1);
    tracker.trackCockpitHandoff(['fidelity', 'charles-schwab']);
    vi.advanceTimersByTime(800);

    expect(env.sentBatches).toHaveLength(0);
  });

  it('a failing transport never throws into the caller', async () => {
    stubBrowserEnv();
    Object.defineProperty(globalThis, 'fetch', {
      value: () => {
        throw new Error('network down');
      },
      configurable: true,
      writable: true,
    });
    const { createResearchTracker } = await freshModule();
    const tracker = createResearchTracker(CTX);

    expect(() => tracker.trackCockpitHandoff(['fidelity', 'charles-schwab'])).not.toThrow();
    expect(() => {
      tracker.trackSearch(6, 1);
      vi.advanceTimersByTime(800);
    }).not.toThrow();
  });

  it('no-ops on the server (no window)', async () => {
    const { createResearchTracker } = await freshModule();
    const tracker = createResearchTracker(CTX);
    expect(() => tracker.trackSearch(6, 1)).not.toThrow();
    expect(() => tracker.trackCockpitHandoff(['a', 'b'])).not.toThrow();
  });
});
