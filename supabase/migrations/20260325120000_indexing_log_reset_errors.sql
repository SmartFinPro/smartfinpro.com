-- Migration: 20260325120000_indexing_log_reset_errors.sql
-- Resets indexing_log entries that were falsely marked 'not_indexed' due to a bug
-- where API errors were stored as real 'not_indexed' status.
--
-- ⚠️  IMPORTANT: Run STEP 1 first to verify timestamps before running STEP 2!
--
-- STEP 1 — Verify the exact time window (run this in Supabase SQL Editor first):
-- SELECT indexed_status, date_trunc('hour', indexed_checked_at) AS hour, COUNT(*)
-- FROM indexing_log
-- WHERE indexed_status = 'not_indexed'
-- GROUP BY indexed_status, date_trunc('hour', indexed_checked_at)
-- ORDER BY hour;
--
-- Adjust the timestamps below based on the output of STEP 1 before running!
-- The window below covers the first "Status prüfen" run on 2026-03-25.

UPDATE indexing_log
SET
  indexed_status     = NULL,
  indexed_checked_at = NULL
WHERE indexed_status = 'not_indexed'
  AND indexed_checked_at >= '2026-03-25 07:00:00+00'
  AND indexed_checked_at <= '2026-03-25 09:00:00+00';

-- After running, verify with:
-- SELECT indexed_status, COUNT(*) FROM indexing_log GROUP BY indexed_status;
-- Expected: all rows should have indexed_status = NULL (unchecked)
