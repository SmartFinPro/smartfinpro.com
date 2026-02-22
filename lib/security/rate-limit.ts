/**
 * Rate Limiter — In-memory sliding window rate limiter
 *
 * Used across API routes to prevent abuse.
 * For production at scale, replace with Redis/Upstash or Cloudflare Rate Limiting.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });
 *   if (!limiter.check(ip)) return new Response('Too many requests', { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Maximum requests allowed per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimiter {
  /** Returns true if the request is allowed, false if rate-limited */
  check(key: string): boolean;
}

/**
 * Create a rate limiter with automatic stale entry cleanup.
 *
 * @example
 *   const limiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });
 *   const ip = request.headers.get('x-forwarded-for') || 'unknown';
 *   if (!limiter.check(ip)) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const map = new Map<string, RateLimitEntry>();

  // Periodic cleanup every 5 minutes to prevent memory leaks
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of map) {
      if (now > entry.resetAt) {
        map.delete(key);
      }
    }
  }

  return {
    check(key: string): boolean {
      cleanup();

      const now = Date.now();
      const entry = map.get(key);

      if (!entry || now > entry.resetAt) {
        map.set(key, { count: 1, resetAt: now + options.windowMs });
        return true;
      }

      entry.count++;
      return entry.count <= options.maxRequests;
    },
  };
}

// ── Pre-configured limiters for common routes ──

/** Affiliate redirect: 30 req/min per IP */
export const affiliateRedirectLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
});

/** Genesis API (AI calls): 10 req/min per IP */
export const genesisApiLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

/** Webhook endpoint: 60 req/min per IP */
export const webhookLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60_000,
});
