-- 20260309160000_postback_fingerprint_24h_dedup.sql
-- Widen no-txn_id dedup window: 1h → 24h (UTC day bucket)
--
-- REASON: idx_ce_fingerprint_hourly_dedup (1h bucket) was too narrow.
-- Affiliate networks occasionally retry failed S2S calls with multi-hour delays.
-- A retry arriving 61+ minutes after the original would bypass the 1h dedup
-- constraint and be inserted as a duplicate event.
--
-- FIX: Replace the hourly bucket with a UTC daily bucket (÷ 86400).
--
-- SEMANTICS:
--   - Concurrent retries (same second / same minute): blocked by DB constraint ✓
--   - Same-day retries (up to ~23h 59m apart): blocked by DB constraint ✓
--   - Genuine new events on a DIFFERENT UTC day (recurring deposits): allowed ✓
--   - Events WITH txn_id: unaffected (idx_ce_dedup_with_txn, separate index) ✓
--
-- Application code (postback-service.ts) is unchanged —
-- the atomic INSERT → catch 23505 → duplicate_skipped pattern still applies.

-- Step 1: Drop the 1h index (superseded)
DROP INDEX IF EXISTS idx_ce_fingerprint_hourly_dedup;

-- Step 2: Drop the 1h helper function (superseded)
DROP FUNCTION IF EXISTS sfp_hour_bucket(timestamptz);

-- Step 3: IMMUTABLE 24h helper
-- EXTRACT(EPOCH FROM timestamptz) returns UTC-based Unix seconds.
-- Dividing by 86400 gives the UTC day bucket — deterministic regardless of
-- session timezone. Declaring IMMUTABLE is correct and safe.
CREATE OR REPLACE FUNCTION sfp_day_bucket(ts timestamptz)
RETURNS bigint LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT (EXTRACT(EPOCH FROM ts)::bigint / 86400) $$;

-- Step 4: New 24h partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_ce_fingerprint_daily_dedup
  ON conversion_events (click_id, event_type, sfp_day_bucket(occurred_at))
  WHERE network_event_id IS NULL;
