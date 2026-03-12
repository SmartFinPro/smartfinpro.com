-- 20260309170000_postback_dual_bucket_dedup.sql
-- Fully atomic no-txn_id dedup via DUAL overlapping day-bucket indexes
--
-- PROBLEM: A single UTC-midnight-aligned day-bucket index has a boundary race.
-- Two concurrent requests at 23:59 and 00:01 UTC (2 min apart) land in
-- different day-buckets. If the first INSERT hasn't committed, the second
-- sees count=0 and both succeed → duplicate.
--
-- SOLUTION: Two overlapping 24h-wide indexes offset by 12 hours.
--
--   Bucket A: |── Day 1 ──|── Day 2 ──|    (midnight-aligned, existing)
--   Bucket B: ────|── Day 1 ──|── Day 2 ──| (noon-aligned, +12h offset)
--
-- Any two events within 12h of each other ALWAYS share at least one bucket.
-- The DB INSERT is atomic — if EITHER index fires 23505, the INSERT fails.
-- This eliminates all app-level SELECT race conditions.
--
-- DEDUP WINDOWS:
--   < 12h apart:  ALWAYS blocked (at least one bucket overlaps)
--   12h–24h apart: MAY be blocked (depends on alignment with bucket boundaries)
--   ≥ 24h apart:  ALWAYS allowed (both buckets guaranteed different)
--
-- Typical affiliate network retries happen within seconds/minutes → well covered.
--
-- SEMANTICS:
--   - Concurrent retries (any gap < 12h): ALWAYS blocked (≥1 bucket overlap) ✓
--   - Cross-midnight retries (23:59 → 00:01): blocked by Bucket B ✓
--   - Cross-noon retries (11:59 → 12:01): blocked by Bucket A ✓
--   - Same UTC day, any gap (e.g. 05:00→23:00 = 18h): blocked by Bucket A ✓
--   - Same noon-window, any gap (e.g. 13:00→11:00+1d = 22h): blocked by Bucket B ✓
--   - Events 12h–24h crossing BOTH boundaries: allowed (rare, legitimate) ✓
--   - Events ≥ 24h apart: ALWAYS allowed by both indexes ✓
--   - Events WITH txn_id: unaffected (idx_ce_dedup_with_txn) ✓
--
-- TRADE-OFF (no-txn_id recurring events like 'deposit'):
--   Without txn_id, same-type events from the same click_id within the same
--   bucket (~24h) ARE treated as duplicates. Networks SHOULD provide txn_id
--   for event types that can legitimately recur (deposit, etc.) to enable
--   exact-match dedup via idx_ce_dedup_with_txn instead.

-- IMMUTABLE noon-offset helper: epoch / 86400 with +12h shift
CREATE OR REPLACE FUNCTION sfp_day_bucket_offset(ts timestamptz)
RETURNS bigint LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT ((EXTRACT(EPOCH FROM ts)::bigint + 43200) / 86400) $$;

-- Bucket B: noon-aligned 24h partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_ce_fingerprint_daily_offset_dedup
  ON conversion_events (click_id, event_type, sfp_day_bucket_offset(occurred_at))
  WHERE network_event_id IS NULL;
