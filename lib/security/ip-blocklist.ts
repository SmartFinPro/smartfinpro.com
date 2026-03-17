/**
 * IP Blocklist — Supabase-backed, cluster-safe persistent blocking.
 *
 * Architecture:
 *   - Supabase `blocked_ips` table is the source of truth (shared across PM2 workers)
 *   - Local per-process TTL cache (60s) reduces DB hits per worker from O(N*req) to O(1/min)
 *   - Cache miss → DB lookup → cache populated for 60 seconds
 *   - Auto-blocks are written to DB after rate-limit breach (future requests blocked immediately)
 *
 * Usage:
 *   const blocked = await isIpBlocked(ip);
 *   if (blocked) return new NextResponse(null, { status: 403 });
 *
 *   // After detecting fraud:
 *   await blockIp(ip, 'bot_ua_detected', { durationMs: 24 * 60 * 60 * 1000, path: '/go/slug', ua });
 */

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

// ── Local per-process cache ───────────────────────────────────────────────────
// Prevents a DB query on every single request while still propagating
// new blocks within ~60 seconds across all PM2 workers.
interface CacheEntry {
  blocked: boolean;
  expiresAt: number; // epoch ms
}

const _cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

// Periodic cleanup — prevent unbounded memory growth in long-running workers
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let _lastCleanup = Date.now();

function cleanupCache() {
  const now = Date.now();
  if (now - _lastCleanup < CLEANUP_INTERVAL_MS) return;
  _lastCleanup = now;
  for (const [ip, entry] of _cache) {
    if (now > entry.expiresAt) _cache.delete(ip);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns true if the IP is currently blocked (either permanently or within expiry).
 * Uses local cache to avoid a DB hit on every request.
 * Falls back to `false` if Supabase is unavailable (fail-open for availability).
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  cleanupCache();

  const cached = _cache.get(ip);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.blocked;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('id, expires_at')
      .eq('ip', ip)
      .or('expires_at.is.null,expires_at.gt.now()')
      .maybeSingle();

    if (error) {
      logger.warn('[ip-blocklist] DB lookup error (fail-open)', { ip, error: error.message });
      return false; // fail-open: prefer availability over strict blocking
    }

    const blocked = !!data;
    _cache.set(ip, { blocked, expiresAt: Date.now() + CACHE_TTL_MS });
    return blocked;
  } catch (err) {
    logger.warn('[ip-blocklist] Unexpected error (fail-open)', {
      ip, error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

interface BlockOptions {
  /** Duration in ms. If omitted, block is permanent. */
  durationMs?: number;
  /** Path that triggered the block (for audit trail) */
  path?: string;
  /** User-Agent at time of block */
  ua?: string;
  /** Who blocked this IP */
  blockedBy?: 'system' | 'cron' | 'dashboard';
}

/**
 * Persist an IP block to Supabase.
 * Upserts so re-blocking the same IP extends the expiry rather than erroring.
 * Updates local cache immediately so subsequent requests in this worker are blocked.
 */
export async function blockIp(
  ip: string,
  reason: string,
  options: BlockOptions = {},
): Promise<void> {
  const { durationMs, path, ua, blockedBy = 'system' } = options;
  const expires_at = durationMs
    ? new Date(Date.now() + durationMs).toISOString()
    : null;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('blocked_ips')
      .upsert(
        {
          ip,
          reason,
          expires_at,
          blocked_by: blockedBy,
          request_path: path ?? null,
          user_agent: ua ? ua.slice(0, 500) : null, // truncate long UAs
          blocked_at: new Date().toISOString(),
        },
        { onConflict: 'ip' },
      );

    if (error) {
      logger.error('[ip-blocklist] Failed to persist block', { ip, reason, error: error.message });
      return;
    }

    // Update local cache immediately for this worker
    _cache.set(ip, { blocked: true, expiresAt: Date.now() + CACHE_TTL_MS });

    logger.warn('[ip-blocklist] IP blocked', {
      ip,
      reason,
      expires_at: expires_at ?? 'permanent',
      path,
    });
  } catch (err) {
    logger.error('[ip-blocklist] Unexpected error persisting block', {
      ip, error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Remove an IP block (used by dashboard or automated unblock).
 */
export async function unblockIp(ip: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from('blocked_ips').delete().eq('ip', ip);
    _cache.set(ip, { blocked: false, expiresAt: Date.now() + CACHE_TTL_MS });
    logger.info('[ip-blocklist] IP unblocked', { ip });
  } catch (err) {
    logger.error('[ip-blocklist] Failed to unblock', {
      ip, error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Cleanup expired blocks from Supabase.
 * Call from a weekly cron job to keep the table tidy.
 */
export async function cleanupExpiredBlocks(): Promise<number> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('blocked_ips')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      logger.error('[ip-blocklist] Cleanup failed', { error: error.message });
      return 0;
    }

    const count = data?.length ?? 0;
    if (count > 0) logger.info('[ip-blocklist] Expired blocks removed', { count });
    return count;
  } catch {
    return 0;
  }
}
