// __tests__/unit/go-redirect-blocking.test.ts
// Blocking policy of the affiliate redirect route: app/(marketing)/go/[slug]/route.ts
//
// Policy (agreed 2026-07-20, after `blocked_ips` went live in prod):
//   Bot UA          → request-local 403. No click recorded. NO blocked_ips entry.
//   Rate limit hit  → temporary IP block, max 1 hour, explicit reason + expiry.
//   24h / permanent → only for repeatedly confirmed abuse or manual dashboard blocks.
//
// Why the bot-UA block was removed: a single User-Agent hit is not enough signal
// for an IP-wide 24h ban. The UA is trivially spoofed, and behind carrier NAT,
// corporate proxies or VPN exits one crawler request would lock real users out of
// every affiliate redirect for a day. The 403 already stops the bot; the persistent
// entry only added collateral damage. This was harmless until 2026-07-20 because
// the `blocked_ips` table did not exist in prod and `blockIp()` silently discarded
// every write — applying the migration made the path live, so this is a safety fix.
//
// Everything external is mocked; no database and no network are touched.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock: next/server ─────────────────────────────────────────────────────────
// Overrides the minimal global mock in vitest.setup.ts (json() only).
vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    headers: Record<string, string>;
    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = init?.headers ?? {};
    }
    static json(data: unknown, init?: { status?: number }) {
      return new MockNextResponse(data, init);
    }
    static redirect(url: string | URL, init?: { status?: number; headers?: Record<string, string> }) {
      const res = new MockNextResponse(null, init);
      res.headers = { ...res.headers, location: String(url) };
      return res;
    }
  }
  return { NextResponse: MockNextResponse };
});

// ── Mock: collaborators ───────────────────────────────────────────────────────
const trackClick = vi.fn();
const resolveLink = vi.fn();
const isIpBlocked = vi.fn();
const blockIp = vi.fn();
const limiterCheck = vi.fn();

vi.mock('@/lib/affiliate/tracker', () => ({ trackClick: (...a: unknown[]) => trackClick(...a) }));
vi.mock('@/lib/affiliate/link-registry', () => ({ resolveLink: (...a: unknown[]) => resolveLink(...a) }));
vi.mock('@/lib/security/ip-blocklist', () => ({
  isIpBlocked: (...a: unknown[]) => isIpBlocked(...a),
  blockIp: (...a: unknown[]) => blockIp(...a),
}));
vi.mock('@/lib/security/rate-limit', () => ({
  affiliateRedirectLimiter: { check: (...a: unknown[]) => limiterCheck(...a) },
}));
vi.mock('@/lib/logging', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { GET } from '@/app/(marketing)/go/[slug]/route';

const HUMAN_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const IP = '203.0.113.9';
const DEST = 'https://www.mercury.com/?subid=abc';

// A real Request/Headers pair, not a hand-rolled `{ get }` stub — the route
// also calls `headers.has(...)` and reads `request.url` via `new URL(...)`
// (added by the prefetch-filtering money invariant), which a partial mock
// would silently fail on and get swallowed by the route's outer try/catch.
function request(ua: string | null = HUMAN_UA, ip: string = IP) {
  const headers: Record<string, string> = { 'x-forwarded-for': ip };
  if (ua !== null) headers['user-agent'] = ua;
  return new Request('https://smartfinpro.com/go/mercury/', { headers });
}

const params = Promise.resolve({ slug: 'mercury' });

// The mocked NextResponse exposes headers as a plain record, not a real Headers
// instance — narrow to that shape so assertions can read `headers.location`.
type MockedResponse = { status: number; headers: Record<string, string> };

async function call(req: Request): Promise<MockedResponse> {
  return (await GET(req, { params })) as unknown as MockedResponse;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Happy-path defaults; individual tests narrow these.
  isIpBlocked.mockResolvedValue(false);
  limiterCheck.mockReturnValue(true);
  resolveLink.mockResolvedValue({ destination_url: 'https://www.mercury.com/' });
  trackClick.mockResolvedValue(DEST);
});

// ── Bot user-agent ────────────────────────────────────────────────────────────

describe('/go/[slug] — bot user-agent', () => {
  it('returns 403 without recording a click', async () => {
    const res = await call(request('Mozilla/5.0 (compatible; Googlebot/2.1)'));

    expect(res.status).toBe(403);
    expect(trackClick).not.toHaveBeenCalled();
  });

  it('does NOT write a persistent blocked_ips entry', async () => {
    await call(request('Mozilla/5.0 (compatible; Googlebot/2.1)'));

    expect(blockIp).not.toHaveBeenCalled();
  });

  it('treats a missing user-agent the same way — 403, no click, no block', async () => {
    const res = await call(request(null));

    expect(res.status).toBe(403);
    expect(trackClick).not.toHaveBeenCalled();
    expect(blockIp).not.toHaveBeenCalled();
  });

  it.each(['curl/8.4.0', 'python-requests/2.31', 'HeadlessChrome/125.0', 'Scrapy/2.11'])(
    'blocks %s with 403 but never persists it',
    async (ua) => {
      const res = await call(request(ua));

      expect(res.status).toBe(403);
      expect(blockIp).not.toHaveBeenCalled();
    },
  );
});

// ── Rate limit ────────────────────────────────────────────────────────────────

describe('/go/[slug] — rate limit exceeded', () => {
  beforeEach(() => limiterCheck.mockReturnValue(false));

  it('returns 429 without recording a click', async () => {
    const res = await call(request());

    expect(res.status).toBe(429);
    expect(trackClick).not.toHaveBeenCalled();
  });

  it('persists a temporary block with an explicit reason and a 1-hour expiry', async () => {
    await call(request());

    expect(blockIp).toHaveBeenCalledTimes(1);
    const [ip, reason, options] = blockIp.mock.calls[0];
    expect(ip).toBe(IP);
    expect(reason).toBe('rate_limit_exceeded');
    expect(options.durationMs).toBe(60 * 60 * 1000);
  });

  it('never escalates to a block longer than one hour', async () => {
    await call(request());

    for (const [, , options] of blockIp.mock.calls) {
      expect(options?.durationMs).toBeDefined(); // never a permanent block
      expect(options.durationMs).toBeLessThanOrEqual(60 * 60 * 1000);
    }
  });
});

// ── Already-blocked IP ────────────────────────────────────────────────────────

describe('/go/[slug] — IP already on the blocklist', () => {
  it('returns 403 without recording a click', async () => {
    isIpBlocked.mockResolvedValue(true);

    const res = await call(request());

    expect(res.status).toBe(403);
    expect(trackClick).not.toHaveBeenCalled();
  });

  it('does not re-block an already-blocked IP', async () => {
    isIpBlocked.mockResolvedValue(true);

    await call(request());

    expect(blockIp).not.toHaveBeenCalled();
  });
});

// ── Legitimate browser ────────────────────────────────────────────────────────

describe('/go/[slug] — legitimate browser', () => {
  it('redirects to the tracked destination', async () => {
    const res = await call(request());

    expect(res.status).toBe(307);
    expect(res.headers.location).toBe(DEST);
  });

  it('records exactly one click, for the requested slug', async () => {
    await call(request());

    expect(trackClick).toHaveBeenCalledTimes(1);
    expect(trackClick).toHaveBeenCalledWith('mercury');
  });

  it('never blocks a legitimate visitor', async () => {
    await call(request());

    expect(blockIp).not.toHaveBeenCalled();
  });

  it('does not redirect to a destination outside the partner whitelist', async () => {
    trackClick.mockResolvedValue('https://evil.example.com/steal');

    const res = await call(request());

    expect(res.headers.location).not.toContain('evil.example.com');
    expect(res.status).toBe(307); // falls back to the homepage
  });
});
