-- ============================================================
-- Migration 010: Spike Alert Settings
-- Per-market toggles for Telegram CTA spike notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS spike_alert_settings (
  market VARCHAR(4) PRIMARY KEY CHECK (market IN ('us', 'uk', 'ca', 'au')),
  telegram_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed all 4 markets (disabled by default)
INSERT INTO spike_alert_settings (market, telegram_enabled) VALUES
  ('us', false),
  ('uk', false),
  ('ca', false),
  ('au', false)
ON CONFLICT (market) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE spike_alert_settings ENABLE ROW LEVEL SECURITY;

-- Policy: service role full access
CREATE POLICY "Service role manages spike_alert_settings"
  ON spike_alert_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
