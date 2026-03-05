-- Migration: 20260305120000_affiliate_link_health.sql
-- AP-08 Phase 4 — Link Health Monitoring
--
-- Adds health_status + last_health_check to affiliate_links.
-- Both columns are referenced in lib/actions/link-health.ts but were missing
-- from the schema. Without this migration runHealthChecks() silently fails
-- on every UPDATE statement.

ALTER TABLE affiliate_links
  ADD COLUMN IF NOT EXISTS health_status VARCHAR(20)
    DEFAULT 'unchecked'
    CHECK (health_status IN ('healthy', 'degraded', 'dead', 'unchecked')),
  ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;

-- Index for dashboard filtering by health status
CREATE INDEX IF NOT EXISTS idx_affiliate_links_health_status
  ON affiliate_links(health_status);

COMMENT ON COLUMN affiliate_links.health_status IS
  'healthy = HTTP 200–399 + <5s | degraded = HTTP 200–399 + >5s | dead = HTTP 400+/timeout | unchecked = never checked';

COMMENT ON COLUMN affiliate_links.last_health_check IS
  'Timestamp of the most recent health check execution';
