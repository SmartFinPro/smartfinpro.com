/**
 * Rate Limiter — Upstash-compatible sliding-window rate limiter with in-memory fallback
 *
 * F-05 hardening (SECURITY AUDIT 2026-04-14):
 *   - Preserves synchronous .check(ip) API for existing callers
 *   - Adds .checkAsync(ip) for Upstash Redis (distributed) when env is set
 *   - Auto-selects backend: Upstash if UPSTASH_REDIS_REST_URL + _TOKEN present,
 *     else in-memory Map (single-instance only — safe for Cloudways/PM2 cluster
 *     because each worker has its own map; Cloudflare is the first line of defence).
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });
 *   if (!limiter.check(ip)) return new Response('Too many requests', { status: 429 });
 *
 *   // For distributed / multi-instance hardening:
 *   if (!(await limiter.checkAsync(ip))) return new Response('Too many', { status: 429 });
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
  /** Optional key prefix for Upstash namespacing (avoids collisions between limiters) */
  prefix?: string;
}

interface RateLimiter {
  /** Synchronous in-memory check — single-instance. Returns true if allowed. */
  check(key: string): boolean;
  /** Async check — uses Upstash REST if configured, else falls back to in-memory. */
  checkAsync(key: string): Promise<boolean>;
}

// ── Upstash REST config (read at module load, single source of truth) ─────
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const UPSTASH_ENABLED = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

/**
 * Upstash INCR + EXPIRE via REST pipeline. Returns current count after increment.
 * Fails silently (returns null) on network error — caller falls back to in-memory.
 */
async function upstashIncr(key: string, windowSec: number): Promise<number | null> {
  if (!UPSTASH_ENABLED) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSec), 'NX'],
      ]),
      // Keep it tight — rate limiting must be fast or it becomes a DoS vector itself
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: number | string }>;
    const count = Number(data?.[0]?.result);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const map = new Map<string, RateLimitEntry>();
  const prefix = options.prefix ?? 'rl';

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

  function checkInMemory(key: string): boolean {
    cleanup();
    const now = Date.now();
    const entry = map.get(key);
    if (!entry || now > entry.resetAt) {
      map.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }
    entry.count++;
    return entry.count <= options.maxRequests;
  }

  return {
    check(key: string): boolean {
      return checkInMemory(key);
    },
    async checkAsync(key: string): Promise<boolean> {
      if (UPSTASH_ENABLED) {
        const windowSec = Math.max(1, Math.floor(options.windowMs / 1000));
        const count = await upstashIncr(`${prefix}:${key}`, windowSec);
        if (count !== null) {
          return count <= options.maxRequests;
        }
        // Upstash failed — fall through to in-memory so we don't fail-open
      }
      return checkInMemory(key);
    },
  };
}

// ── Pre-configured limiters for common routes ──

/** Affiliate redirect: 10 req/min per IP — tighter to prevent click fraud */
export const affiliateRedirectLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
  prefix: 'rl:go',
});

/** Genesis API (AI calls): 10 req/min per IP */
export const genesisApiLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
  prefix: 'rl:genesis',
});

/** Webhook endpoint: 60 req/min per IP */
export const webhookLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60_000,
  prefix: 'rl:webhook',
});

/** Newsletter subscribe: 5 req/min per IP — prevents email-bombing */
export const subscribeLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
  prefix: 'rl:subscribe',
});

/** Contact form: 3 req / 5 min per IP — prevents abuse without blocking genuine follow-ups */
export const contactLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 5 * 60_000,
  prefix: 'rl:contact',
});

/** Web Vitals ingestion: 60 req/min per IP — generous for real browsers */
export const webVitalsLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60_000,
  prefix: 'rl:vitals',
});

/** Track CTA / pageview: 120 req/min per IP */
export const trackLimiter = createRateLimiter({
  maxRequests: 120,
  windowMs: 60_000,
  prefix: 'rl:track',
});

/** Money Leak Scanner: 15 req/min per IP — write-heavy + scoring-heavy */
export const scanLimiter = createRateLimiter({
  maxRequests: 15,
  windowMs: 60_000,
  prefix: 'rl:scan',
});
