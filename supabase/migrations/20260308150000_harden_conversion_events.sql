-- 20260308150000_harden_conversion_events.sql
-- Security hardening for conversion_events table
--
-- P0: Remove anon INSERT policy — postback endpoint uses service_role via
--     createServiceClient(), so anon should never write directly.
-- P1: Replace overly aggressive COALESCE dedup index with two separate strategies:
--     (a) WITH network_event_id → strict dedup on (click_id, event_type, network_event_id)
--     (b) WITHOUT network_event_id → allow multiple events per click_id+event_type
--         (e.g. multiple deposit events). Dedup handled at application level.

-- ── P0: Remove dangerous anon INSERT policy ─────────────────────────────────
DROP POLICY IF EXISTS "Anon insert via postback" ON conversion_events;

-- ── P1: Fix dedup index ─────────────────────────────────────────────────────
-- Drop the old COALESCE-based index that was:
--   (a) too aggressive: blocked legitimate events without txn_id
--   (b) fragile with Supabase upsert (COALESCE expression != column list)
DROP INDEX IF EXISTS idx_ce_dedup;

-- New index: strict dedup only when network_event_id is present.
-- Multiple events without network_event_id are allowed (e.g. multiple deposits).
CREATE UNIQUE INDEX idx_ce_dedup_with_txn
  ON conversion_events (click_id, event_type, network_event_id)
  WHERE network_event_id IS NOT NULL;
