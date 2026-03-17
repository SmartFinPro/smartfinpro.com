-- Migration: 20260305150000_link_clicks_fraud.sql
-- AP-06 Phase 4 — Click-Fraud Detection
--
-- Adds fraud-detection columns to link_clicks.
-- Populated by lib/affiliate/tracker.ts on every click:
--   ip_address    → stored for dedup / pattern analysis
--   is_suspicious → true if any fraud signal triggered
--   fraud_reason  → human-readable flag (bot_ua, duplicate_ip, rate_limit, etc.)
--
-- Dashboard query: SELECT * FROM link_clicks WHERE is_suspicious = true
-- Index makes this fast even on large tables.

ALTER TABLE link_clicks
  ADD COLUMN IF NOT EXISTS ip_address    VARCHAR(45),
  ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN  DEFAULT false,
  ADD COLUMN IF NOT EXISTS fraud_reason  TEXT;

-- Partial index: only indexes suspicious rows (tiny, fast)
CREATE INDEX IF NOT EXISTS idx_link_clicks_suspicious
  ON link_clicks(is_suspicious)
  WHERE is_suspicious = true;

-- Composite index for duplicate-IP dedup check
-- Used by: SELECT 1 FROM link_clicks WHERE ip_address = $1 AND link_id = $2 AND clicked_at > now() - interval '60 seconds'
CREATE INDEX IF NOT EXISTS idx_link_clicks_ip_link_time
  ON link_clicks(ip_address, link_id, clicked_at DESC);

COMMENT ON COLUMN link_clicks.ip_address    IS 'IPv4 or IPv6 address of the clicker (hashed in future iteration)';
COMMENT ON COLUMN link_clicks.is_suspicious IS 'Set to true by fraud-detection logic in tracker.ts';
COMMENT ON COLUMN link_clicks.fraud_reason  IS 'bot_ua | duplicate_ip | missing_referer | combined';
