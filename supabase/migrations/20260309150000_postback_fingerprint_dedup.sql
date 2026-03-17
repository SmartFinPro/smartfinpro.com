-- 20260309150000_postback_fingerprint_dedup.sql
-- P1-02: Make fingerprint dedup (no-txn_id) atomic via DB constraint
--
-- PROBLEM: postback-service.ts used a non-atomic SELECT-count-then-INSERT pattern
-- for events without txn_id. Two concurrent retry requests could both pass the
-- count check (both see 0 rows) and both INSERT, creating duplicates.
--
-- SOLUTION: Partial unique index on (click_id, event_type, 1-hour time bucket)
-- WHERE network_event_id IS NULL.
--
-- IMMUTABILITY NOTE:
--   date_trunc('hour', timestamptz) is STABLE (timezone-dependent) — cannot be indexed.
--   date_trunc('hour', occurred_at::timestamp) also STABLE — ::timestamp cast uses
--   the session's TimeZone GUC, still not IMMUTABLE.
--   FIX: Custom IMMUTABLE wrapper using Unix epoch math (UTC-based, deterministic):
--     sfp_hour_bucket(ts) = floor(epoch_seconds / 3600)
--   Declaring a SQL function IMMUTABLE is a user contract — PostgreSQL trusts it.
--   EXTRACT(EPOCH FROM timestamptz) is always UTC-based → genuinely deterministic.
--
-- SEMANTICS:
--   - Concurrent retries within the same clock-hour → DB constraint fires → 23505
--     → caught in postback-service.ts INSERT error handler → duplicate_skipped ✓
--   - Genuine new events in a DIFFERENT hour (e.g. recurring deposits) → allowed ✓
--   - Events WITH txn_id → unaffected (separate idx_ce_dedup_with_txn index) ✓
--
-- Application change: pre-flight SELECT removed in postback-service.ts.
-- The atomic INSERT → catch 23505 pattern handles dedup correctly.

-- Step 1: Create IMMUTABLE hour-bucket helper
-- Wraps EXTRACT(EPOCH) / 3600 — epoch from timestamptz is always UTC-based,
-- so this is genuinely deterministic regardless of session timezone.
CREATE OR REPLACE FUNCTION sfp_hour_bucket(ts timestamptz)
RETURNS bigint LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT (EXTRACT(EPOCH FROM ts)::bigint / 3600) $$;

-- Step 2: Partial unique index using the IMMUTABLE function
CREATE UNIQUE INDEX IF NOT EXISTS idx_ce_fingerprint_hourly_dedup
  ON conversion_events (click_id, event_type, sfp_hour_bucket(occurred_at))
  WHERE network_event_id IS NULL;
