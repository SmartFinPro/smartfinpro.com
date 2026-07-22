// __tests__/unit/go-route-speculative.test.ts
// The /go/[slug] route as the last line of defence for the money invariant.
//
// Every dependency that touches the outside world is mocked, so these tests
// assert the one thing that matters: WHAT the route does before it decides a
// click happened. The guard has to run ahead of the bot gate, the IP blocklist,
// the rate limiter and trackClick — a speculative request must leave no trace
// in `link_clicks`, must not consume a real visitor's rate-limit budget, and
// must never get their IP blocked (behind carrier NAT that would lock real
// users out of every affiliate redirect).

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── next/server: a NextResponse rich enough to inspect ──────────────────────
// Overrides the json-only stub in vitest.setup.ts; this route builds bodyless
// responses and redirects.
vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    headers: Headers;
    constructor(body: unknown, init?: { status?: number; headers?: HeadersInit }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
    }
    static redirect(url: string | URL, init?: { status?: number; headers?: HeadersInit }) {
      const res = new MockNextResponse(null, init);
      res.status = init?.status ?? 307;
      res.headers.set('location', String(url));
      return res;
    }
    static json(data: unknown, init?: { status?: number }) {
      return new MockNextResponse(data, init);
    }
  }
  return { NextResponse: MockNextResponse };
});

const trackClick = vi.fn();
const resolveLink = vi.fn();
const isIpBlocked = vi.fn();
const blockIp = vi.fn();
const rateLimitCheck = vi.fn();

vi.mock('@/lib/affiliate/tracker', () => ({ trackClick: (slug: string) => trackClick(slug) }));
vi.mock('@/lib/affiliate/link-registry', () => ({ resolveLink: (slug: string) => resolveLink(slug) }));
vi.mock('@/lib/security/ip-blocklist', () => ({
  isIpBlocked: (ip: string) => isIpBlocked(ip),
  blockIp: (...args: unknown[]) => blockIp(...args),
}));
vi.mock('@/lib/security/rate-limit', () => ({
  affiliateRedirectLimiter: { check: (ip: string) => rateLimitCheck(ip) },
}));
vi.mock('@/lib/logging', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET } from '../../app/(marketing)/go/[slug]/route';

const DESTINATION = 'https://www.etoro.com/?subid=abc123';

/** Headers a real Chrome sends when a person clicks a CTA. */
const CLICK_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
  'x-forwarded-for': '203.0.113.7',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
};

function call(headers: Record<string, string>, url = 'https://smartfinpro.com/go/etoro') {
  return GET(new Request(url, { headers }), { params: Promise.resolve({ slug: 'etoro' }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  trackClick.mockResolvedValue(DESTINATION);
  resolveLink.mockResolvedValue({ destination_url: DESTINATION });
  isIpBlocked.mockResolvedValue(false);
  rateLimitCheck.mockReturnValue(true);
});

describe('GET /go/[slug] — a real click still earns money', () => {
  it('redirects a clicking visitor to the affiliate destination', async () => {
    const res = await call(CLICK_HEADERS);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(DESTINATION);
  });

  it('records the click', async () => {
    await call(CLICK_HEADERS);

    expect(trackClick).toHaveBeenCalledWith('etoro');
  });
});

describe('GET /go/[slug] — a speculative request is not a click', () => {
  const PREFETCH_HEADERS = { ...CLICK_HEADERS, 'next-router-prefetch': '1', 'sec-fetch-dest': 'empty' };

  it('answers a router prefetch with 204 and no redirect', async () => {
    const res = await call(PREFETCH_HEADERS);

    expect(res.status).toBe(204);
    expect(res.headers.get('location')).toBeNull();
  });

  it('records no click for a router prefetch', async () => {
    await call(PREFETCH_HEADERS);

    expect(trackClick).not.toHaveBeenCalled();
  });

  it('names the reason on the response so the guard is debuggable in production', async () => {
    const res = await call(PREFETCH_HEADERS);

    expect(res.headers.get('x-sfp-speculative')).toBe('next-router-prefetch');
  });

  it('never caches the 204 — the same URL must redirect on a later real click', async () => {
    const res = await call(PREFETCH_HEADERS);

    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('does not spend the visitor rate-limit budget on a prefetch', async () => {
    await call(PREFETCH_HEADERS);

    expect(rateLimitCheck).not.toHaveBeenCalled();
  });

  it('runs before the bot gate, so a prefetch never gets an IP blocked', async () => {
    await call({ ...PREFETCH_HEADERS, 'user-agent': 'HeadlessChrome/126.0 Playwright' });

    expect(blockIp).not.toHaveBeenCalled();
    expect(trackClick).not.toHaveBeenCalled();
  });

  it('runs before the blocklist lookup, so a prefetch costs no DB round-trip', async () => {
    await call(PREFETCH_HEADERS);

    expect(isIpBlocked).not.toHaveBeenCalled();
  });

  it('answers an RSC payload request the same way', async () => {
    const res = await call(CLICK_HEADERS, 'https://smartfinpro.com/go/etoro?_rsc=1a2b3');

    expect(res.status).toBe(204);
    expect(trackClick).not.toHaveBeenCalled();
  });

  it('answers a browser speculation-rules prefetch the same way', async () => {
    const res = await call({ ...CLICK_HEADERS, 'sec-purpose': 'prefetch;prerender' });

    expect(res.status).toBe(204);
    expect(trackClick).not.toHaveBeenCalled();
  });
});

describe('GET /go/[slug] — the rate-limit block never persists "unknown"', () => {
  // No `x-forwarded-for` (e.g. behind a misconfigured proxy, or a health
  // checker) resolves `ip` to the literal string 'unknown'. The rate limiter
  // is in-memory and keyed by that string, so EVERY such request shares one
  // bucket — a burst from unrelated sources can trip it. If the block that
  // follows ever persisted 'unknown' to Supabase, `isIpBlocked('unknown')`
  // would then 403 every future request lacking a forwarded IP, for real
  // visitors, for up to an hour. The current request must still be rate
  // limited (429) — only the persistent block on the literal 'unknown' is
  // the hazard.
  const NO_XFF_HEADERS = { ...CLICK_HEADERS };
  delete (NO_XFF_HEADERS as Record<string, string>)['x-forwarded-for'];

  beforeEach(() => {
    rateLimitCheck.mockReturnValue(false);
  });

  it('still rate-limits the current request with 429', async () => {
    const res = await call(NO_XFF_HEADERS);

    expect(res.status).toBe(429);
  });

  it('never persists a block for the literal ip "unknown"', async () => {
    await call(NO_XFF_HEADERS);

    expect(blockIp).not.toHaveBeenCalled();
  });

  it('still persists a block when a real IP trips the rate limit (control — the fix must not disable blocking generally)', async () => {
    await call(CLICK_HEADERS);

    expect(blockIp).toHaveBeenCalledWith('203.0.113.7', 'rate_limit_exceeded', expect.any(Object));
  });
});
