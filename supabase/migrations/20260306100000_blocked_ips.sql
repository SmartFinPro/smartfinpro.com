-- Migration: blocked_ips
-- Persistent IP blocklist — cluster-safe alternative to in-memory rate-limit state.
--
-- Rationale:
--   PM2 cluster mode runs 1 worker per CPU core. In-memory rate limiters are
--   per-process → an attacker can spread requests across workers and bypass limits.
--   This table provides a shared, persistent blocklist visible to all workers.
--
-- Lifecycle:
--   - System auto-blocks IPs that trigger click-fraud / rate-limit abuse
--   - Manual blocks from dashboard (reason = 'manual')
--   - Temporary blocks expire via expires_at; permanent blocks have expires_at = NULL
--   - Cleanup cron removes expired entries weekly

CREATE TABLE IF NOT EXISTS blocked_ips (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip          text        NOT NULL,
  reason      text        NOT NULL DEFAULT 'rate_limit_exceeded',
  blocked_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,                     -- NULL = permanent block
  blocked_by  text        NOT NULL DEFAULT 'system',
  request_path text,                           -- Which path triggered the block
  user_agent  text,                            -- UA at time of block (for analysis)

  CONSTRAINT blocked_ips_ip_unique UNIQUE (ip)
);

-- Fast lookup by IP (primary access pattern)
CREATE INDEX IF NOT EXISTS blocked_ips_ip_idx
  ON blocked_ips(ip);

-- Cleanup index — efficient expired-record removal
CREATE INDEX IF NOT EXISTS blocked_ips_expires_idx
  ON blocked_ips(expires_at)
  WHERE expires_at IS NOT NULL;

-- Block-time index for analytics (newest blocked IPs first)
CREATE INDEX IF NOT EXISTS blocked_ips_blocked_at_idx
  ON blocked_ips(blocked_at DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Service role has full access (API routes + cron jobs)
CREATE POLICY "Service role: full access"
  ON blocked_ips FOR ALL
  USING (auth.role() = 'service_role');

-- Comment
COMMENT ON TABLE blocked_ips IS
  'Persistent IP blocklist shared across all PM2 cluster workers. '
  'system: auto-blocked by click-fraud detection. manual: blocked via dashboard.';
