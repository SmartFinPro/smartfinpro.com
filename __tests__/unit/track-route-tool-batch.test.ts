// __tests__/unit/track-route-tool-batch.test.ts
// POST /api/track — the new 'tool_event_batch' case (additive sibling of the
// existing 'event_batch' case, which must stay byte-identical). Supabase and
// the logger are mocked; Request objects are constructed directly (a
// duck-typed object exposing headers.get()/json(), not a real NextRequest —
// avoids depending on next/server's internals, which vitest.setup.ts already
// mocks globally so NextResponse.json() returns a plain
// {__nextResponseMock, data, status} object instead of a real Response).

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

function cockpitItem(overrides: Record<string, unknown> = {}) {
  return {
    eventName: 'cockpit_view',
    eventCategory: 'cockpit',
    eventAction: 'view',
    eventLabel: 'robo-advisors',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      market: 'us',
      category: 'personal-finance',
      topic: 'robo-advisors',
      view: 'cards',
      surface: 'cockpit',
    },
    ...overrides,
  };
}

let ipCounter = 0;
/** A fresh x-forwarded-for value per call so the module-level rate limiter never crosses tests. */
function freshIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

/** isBotUserAgent() treats a missing/empty UA as a bot — real requests need a normal browser UA. */
const NORMAL_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

describe('POST /api/track — tool_event_batch case', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  });

  it('a valid batch (3 events) → 200 {success:true}; exactly 1 from() + 1 insert() call with 3 rows, all event_category=tool', async () => {
    const { POST } = await import('@/app/api/track/route');
    const batch = [toolItem(), toolItem({ eventName: 'tool_start' }), toolItem({ eventName: 'tool_first_result' })];
    const req = makeRequest(
      { type: 'tool_event_batch', sessionId: 'session-abc12345', data: { events: batch } },
      { 'x-forwarded-for': freshIp(), 'user-agent': NORMAL_UA },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true });

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith('analytics_events');
    expect(insertMock).toHaveBeenCalledTimes(1);
    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.event_category).toBe('tool');
  });

  it('a bot User-Agent (Googlebot) → 200 {success:true, skipped:true}, 0 insert calls', async () => {
    const { POST } = await import('@/app/api/track/route');
    const batch = [toolItem()];
    const req = makeRequest(
      { type: 'tool_event_batch', sessionId: 'session-abc12345', data: { events: batch } },
      { 'x-forwarded-for': freshIp(), 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true, skipped: true });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('an invalid batch (unknown property key) → 400, 0 inserts', async () => {
    const { POST } = await import('@/app/api/track/route');
    const badItem = toolItem({ properties: { ...toolItem().properties, foo: 1 } });
    const req = makeRequest(
      { type: 'tool_event_batch', sessionId: 'session-abc12345', data: { events: [badItem] } },
      { 'x-forwarded-for': freshIp() },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('rate-limit weight: a 20-event batch costs 20 tokens — the 6th request from the same fresh IP (100 tokens) is 429', async () => {
    const { POST } = await import('@/app/api/track/route');
    const ip = freshIp();
    const batch20 = Array.from({ length: 20 }, () => toolItem());
    let lastStatus = 200;
    for (let i = 0; i < 6; i++) {
      const req = makeRequest(
        { type: 'tool_event_batch', sessionId: 'session-abc12345', data: { events: batch20 } },
        { 'x-forwarded-for': ip },
      );
      const res = (await POST(req)) as unknown as MockedTrackResponse;
      lastStatus = res.status;
      if (i < 5) expect(res.status).not.toBe(429);
    }
    expect(lastStatus).toBe(429);
  });

  it('REGRESSION: the existing cockpit event_batch case still works unchanged', async () => {
    const { POST } = await import('@/app/api/track/route');
    const batch = [cockpitItem()];
    const req = makeRequest(
      { type: 'event_batch', sessionId: 'session-abc12345', data: { events: batch } },
      { 'x-forwarded-for': freshIp(), 'user-agent': NORMAL_UA },
    );
    const res = (await POST(req)) as unknown as MockedTrackResponse;
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true });
    expect(fromMock).toHaveBeenCalledWith('analytics_events');
    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].event_category).toBe('cockpit');
  });
});
