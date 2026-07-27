// __tests__/unit/track-route-research-batch.test.ts
// POST /api/track — the new 'research_event_batch' case (additive sibling of
// 'event_batch' and 'tool_event_batch', both of which must keep behaving
// byte-identically). Same harness as track-route-tool-batch.test.ts: Supabase
// and the logger are mocked, and the Request is a duck-typed object exposing
// headers.get()/json() (vitest.setup.ts mocks next/server, so NextResponse.json()
// returns {__nextResponseMock, data, status}).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const insertMock = vi.fn(async (_rows: Array<Record<string, unknown>>) => ({ error: null as { message: string } | null }));
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => ({ from: fromMock })),
}));

vi.mock('@/lib/logging', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

interface MockedTrackResponse {
  __nextResponseMock: true;
  data: unknown;
  status: number;
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  const map = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    headers: { get: (key: string) => map.get(key.toLowerCase()) ?? null },
    json: async () => body,
  } as unknown as NextRequest;
}

function researchItem(overrides: Record<string, unknown> = {}) {
  return {
    eventName: 'research_search',
    eventCategory: 'research',
    eventAction: 'search',
    eventLabel: 'trading-platforms',
    pagePath: '/research',
    properties: {
      schemaVersion: 'research_v1',
      market: 'us',
      topic: 'trading-platforms',
      queryLength: 6,
      resultCount: 1,
    },
    ...overrides,
  };
}

function toolItem(overrides: Record<string, unknown> = {}) {
  return {
    eventName: 'tool_view',
    eventCategory: 'tool',
    eventAction: 'view',
    eventLabel: 'money-leak-scanner',
    pagePath: '/tools/money-leak-scanner',
    properties: {
      schemaVersion: 'tool_v1',
      toolId: 'money-leak-scanner',
      market: 'us',
      variantPath: '/tools/money-leak-scanner',
      shellMode: 'live-canvas',
    },
    ...overrides,
  };
}

let ipCounter = 0;
/** A fresh x-forwarded-for value per call so the module-level rate limiter never crosses tests. */
function freshIp(): string {
  ipCounter += 1;
  return `198.51.100.${ipCounter}`;
}

/** isBotUserAgent() treats a missing/empty UA as a bot — real requests need a normal browser UA. */
const NORMAL_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

describe('POST /api/track — research_event_batch case', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  });

  it('a valid batch → 200; exactly one insert with all rows event_category=research', async () => {
    const { POST } = await import('@/app/api/track/route');
    const batch = [
      researchItem(),
      researchItem({
        eventName: 'research_evidence_open',
        eventAction: 'evidence_open',
        eventLabel: 'charles-schwab',
        eventValue: 4,
        properties: {
          schemaVersion: 'research_v1',
          market: 'us',
          topic: 'trading-platforms',
          productSlug: 'charles-schwab',
          status: 'audited',
          dataPoints: 4,
        },
      }),
    ];
    const req = makeRequest(
      { type: 'research_event_batch', sessionId: 'session-abc12345', data: { events: batch } },
      { 'x-forwarded-for': freshIp(), 'user-agent': NORMAL_UA },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true });

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith('analytics_events');
    expect(insertMock).toHaveBeenCalledTimes(1);
    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row.event_category).toBe('research');
    expect(rows[0].session_id).toBe('session-abc12345');
    expect(rows[1].event_value).toBe(4);
  });

  it('a bot User-Agent drops the whole batch → 200 {success, skipped}, 0 inserts', async () => {
    const { POST } = await import('@/app/api/track/route');
    const req = makeRequest(
      { type: 'research_event_batch', sessionId: 'session-abc12345', data: { events: [researchItem()] } },
      { 'x-forwarded-for': freshIp(), 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true, skipped: true });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('a raw query smuggled into properties → 400, 0 inserts', async () => {
    const { POST } = await import('@/app/api/track/route');
    const badItem = researchItem({ properties: { ...researchItem().properties, query: 'fidelity' } });
    const req = makeRequest(
      { type: 'research_event_batch', sessionId: 'session-abc12345', data: { events: [badItem] } },
      { 'x-forwarded-for': freshIp(), 'user-agent': NORMAL_UA },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  // Task 6 (unified-research-discovery-pr2-hubs plan, spec §12) — the hub
  // dimensions (`surface`/`kind`/`trigger`/`category`) are additive, but the
  // properties bag stays `.strict()`: an unrelated unknown key is STILL a 400
  // after this change, even sitting alongside otherwise-valid new fields —
  // proves the extension never loosened the schema into "any object".
  it('an unknown property alongside valid new hub dimensions → 400, 0 inserts', async () => {
    const { POST } = await import('@/app/api/track/route');
    const badItem = researchItem({
      eventName: 'research_review_click',
      eventAction: 'review_click',
      eventLabel: 'fidelity',
      properties: {
        schemaVersion: 'research_v1',
        market: 'us',
        topic: 'trading-platforms',
        category: 'trading',
        surface: 'hub',
        kind: 'dossier',
        productSlug: 'fidelity',
        status: 'audited',
        rank: 1,
        position: 1,
        notInTheContract: 'nope',
      },
    });
    const req = makeRequest(
      { type: 'research_event_batch', sessionId: 'session-abc12345', data: { events: [badItem] } },
      { 'x-forwarded-for': freshIp(), 'user-agent': NORMAL_UA },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('a valid batch WITH the new hub dimensions → 200, one insert per event', async () => {
    const { POST } = await import('@/app/api/track/route');
    const globalEvent = researchItem({
      eventLabel: 'hub',
      properties: {
        schemaVersion: 'research_v1',
        market: 'us',
        topic: 'hub',
        surface: 'hub',
        queryLength: 6,
        resultCount: 1,
      },
    });
    const itemEvent = researchItem({
      eventName: 'research_review_click',
      eventAction: 'review_click',
      eventLabel: 'fidelity',
      properties: {
        schemaVersion: 'research_v1',
        market: 'us',
        topic: 'trading-platforms',
        category: 'trading',
        kind: 'dossier',
        productSlug: 'fidelity',
        status: 'audited',
        rank: 1,
        position: 1,
      },
    });
    const req = makeRequest(
      {
        type: 'research_event_batch',
        sessionId: 'session-abc12345',
        data: { events: [globalEvent, itemEvent] },
      },
      { 'x-forwarded-for': freshIp(), 'user-agent': NORMAL_UA },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledTimes(1);
    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row.event_category).toBe('research');
  });

  it('rate-limit weight: a 20-event batch costs 20 tokens — the 6th request from one IP is 429', async () => {
    const { POST } = await import('@/app/api/track/route');
    const ip = freshIp();
    const batch20 = Array.from({ length: 20 }, () => researchItem());
    let lastStatus = 200;
    for (let i = 0; i < 6; i++) {
      const req = makeRequest(
        { type: 'research_event_batch', sessionId: 'session-abc12345', data: { events: batch20 } },
        { 'x-forwarded-for': ip, 'user-agent': NORMAL_UA },
      );
      const res = (await POST(req)) as unknown as MockedTrackResponse;
      lastStatus = res.status;
      if (i < 5) expect(res.status).not.toBe(429);
    }
    expect(lastStatus).toBe(429);
  });

  it('REGRESSION: the tool_event_batch case still works unchanged', async () => {
    const { POST } = await import('@/app/api/track/route');
    const req = makeRequest(
      { type: 'tool_event_batch', sessionId: 'session-abc12345', data: { events: [toolItem()] } },
      { 'x-forwarded-for': freshIp(), 'user-agent': NORMAL_UA },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(200);
    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0].event_category).toBe('tool');
  });
});
