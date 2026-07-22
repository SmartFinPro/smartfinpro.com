// __tests__/unit/click-fraud-detection.test.ts
// Click-fraud heuristics in lib/affiliate/tracker.ts → detectFraud().
//
// Why these tests exist:
//   The duplicate-IP heuristic was dead in production for its entire lifetime.
//   It ran `.select('click_id', { count: 'exact', head: true })` and then tested
//   `if (data !== null)`. postgrest-js issues a real HTTP HEAD request when
//   `head: true` is set and never parses a body, so `data` is ALWAYS null — the
//   condition could never be true. Verified against production on 2026-07-20:
//   across 2394 link_clicks rows, fraud_reason was {null: 2057, off_target_geo:
//   337} — zero duplicate_ip, zero bot_ua.
//
//   The mock below reproduces that exact postgrest-js contract (data: null +
//   a populated count) so the regression cannot silently return.
//
// Note on bot_ua: /go/[slug] already 403s bot user-agents before trackClick()
// runs, so the tracker's own UA check is a second line of defence for any
// future non-/go caller. It is covered here regardless.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock: next/headers ────────────────────────────────────────────────────────
// tracker.ts imports it at module scope; detectFraud itself never calls it.
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

// ── Mock: Supabase ────────────────────────────────────────────────────────────
// Mirrors the postgrest-js response shape for `head: true`:
//   { data: null, count: <number|null>, error: null }
let mockCount: number | null = 0;
let mockShouldThrow = false;
const capturedFilters: Array<{ method: string; args: unknown[] }> = [];

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => {
    if (mockShouldThrow) throw new Error('supabase unavailable');
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'gte', 'lt', 'limit', 'is', 'not']) {
      chain[m] = vi.fn((...args: unknown[]) => {
        capturedFilters.push({ method: m, args });
        return chain;
      });
    }
    // Awaiting the builder resolves to the postgrest response.
    chain.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, count: mockCount, error: null }).then(resolve);
    return { from: vi.fn(() => chain) };
  },
}));

import { detectFraud } from '@/lib/affiliate/tracker';

const HUMAN_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

function baseParams(overrides: Partial<Parameters<typeof detectFraud>[0]> = {}) {
  return {
    ip: '203.0.113.7',
    userAgent: HUMAN_UA,
    linkId: 'link-1',
    countryCode: 'US',
    ...overrides,
  };
}

beforeEach(() => {
  mockCount = 0;
  mockShouldThrow = false;
  capturedFilters.length = 0;
});

// ── Duplicate-IP velocity (the dead heuristic) ────────────────────────────────

describe('detectFraud — duplicate_ip', () => {
  it('flags a click when a prior click from the same IP+link exists in the window', async () => {
    mockCount = 1; // postgrest head:true → data stays null, count carries the answer

    const result = await detectFraud(baseParams());

    expect(result.reason).toBe('duplicate_ip');
    expect(result.isSuspicious).toBe(true);
  });

  it('does not flag the first click from an IP (count 0)', async () => {
    mockCount = 0;

    const result = await detectFraud(baseParams());

    expect(result.isSuspicious).toBe(false);
    expect(result.reason).toBeNull();
  });

  it('does not flag when count is null (count header absent)', async () => {
    mockCount = null;

    const result = await detectFraud(baseParams());

    expect(result.isSuspicious).toBe(false);
  });

  it('scopes the lookup to this IP, this link, and the last 60 seconds', async () => {
    mockCount = 3;
    const before = Date.now();

    await detectFraud(baseParams({ ip: '198.51.100.4', linkId: 'link-42' }));

    const after = Date.now();

    const eqs = capturedFilters.filter((f) => f.method === 'eq');
    expect(eqs).toContainEqual({ method: 'eq', args: ['ip_address', '198.51.100.4'] });
    expect(eqs).toContainEqual({ method: 'eq', args: ['link_id', 'link-42'] });

    const gte = capturedFilters.find((f) => f.method === 'gte');
    expect(gte?.args[0]).toBe('clicked_at');
    const cutoff = new Date(gte?.args[1] as string).getTime();
    // cutoff is computed as `Date.now() - 60_000` *inside* detectFraud, at some
    // point between `before` and `after` — so `cutoff + 60_000` must itself
    // fall in that window, not `before` directly (a slow CI runner can burn
    // more than 1ms between capturing `before` and the call, which previously
    // made this assert backwards and flaked under load).
    expect(cutoff + 60_000).toBeGreaterThanOrEqual(before);
    expect(cutoff + 60_000).toBeLessThanOrEqual(after);
  });

  it('skips the DB lookup entirely when the IP is unknown', async () => {
    mockCount = 5; // would flag if the query ran

    const result = await detectFraud(baseParams({ ip: 'unknown' }));

    expect(result.isSuspicious).toBe(false);
    expect(capturedFilters).toHaveLength(0);
  });

  it('stays non-blocking when Supabase throws', async () => {
    mockShouldThrow = true;

    const result = await detectFraud(baseParams());

    expect(result.isSuspicious).toBe(false);
    expect(result.reason).toBeNull();
  });
});

// ── Off-target geography ──────────────────────────────────────────────────────

describe('detectFraud — off_target_geo', () => {
  it.each(['US', 'GB', 'CA', 'AU'])('does not flag monetizable market %s', async (countryCode) => {
    const result = await detectFraud(baseParams({ countryCode }));
    expect(result.isSuspicious).toBe(false);
  });

  it.each(['VN', 'BR', 'FR', 'CN', 'ID'])('flags non-monetizable country %s', async (countryCode) => {
    const result = await detectFraud(baseParams({ countryCode }));
    expect(result.reason).toBe('off_target_geo');
  });

  it('leaves unknown geo (XX) unflagged to avoid false positives on real users', async () => {
    const result = await detectFraud(baseParams({ countryCode: 'XX' }));
    expect(result.isSuspicious).toBe(false);
  });
});

// ── Bot user-agent ────────────────────────────────────────────────────────────

describe('detectFraud — bot_ua', () => {
  it('flags a known crawler user-agent', async () => {
    const result = await detectFraud(
      baseParams({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }),
    );
    expect(result.reason).toBe('bot_ua');
  });

  it('flags an empty user-agent', async () => {
    const result = await detectFraud(baseParams({ userAgent: '' }));
    expect(result.reason).toBe('bot_ua');
  });

  it('does not flag a real browser user-agent', async () => {
    const result = await detectFraud(baseParams());
    expect(result.isSuspicious).toBe(false);
  });
});

// ── Multiple signals ──────────────────────────────────────────────────────────

describe('detectFraud — combined signals', () => {
  it('joins every triggered reason with a pipe', async () => {
    mockCount = 2;

    const result = await detectFraud(
      baseParams({ userAgent: 'curl/8.4.0', countryCode: 'VN' }),
    );

    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toBe('bot_ua|off_target_geo|duplicate_ip');
  });
});
