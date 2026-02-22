-- ============================================================
-- Migration 011: Auto-Pilot Cooldowns
-- Prevents the same slug from triggering a rebuild more than
-- once every 24 hours (build-loop protection).
-- ============================================================

CREATE TABLE IF NOT EXISTS autopilot_cooldowns (
  slug TEXT PRIMARY KEY,
  last_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  spike_multiplier NUMERIC(6,2),
  clicks_at_trigger INTEGER,
  market VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au'))
);

-- Fast lookup by timestamp for cleanup queries
CREATE INDEX IF NOT EXISTS idx_autopilot_cooldowns_last_triggered
  ON autopilot_cooldowns (last_triggered_at DESC);

-- Enable Row Level Security
ALTER TABLE autopilot_cooldowns ENABLE ROW LEVEL SECURITY;

-- Policy: service role full access
CREATE POLICY "Service role manages autopilot_cooldowns"
  ON autopilot_cooldowns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
