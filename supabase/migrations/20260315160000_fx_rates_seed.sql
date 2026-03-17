-- Migration: FX Rates — Seed system_settings for dynamic ECB rates
-- Created: 2026-03-15
-- Purpose: Seed initial FX rates, mode flag, and alert cooldown keys
-- Rollback:
--   DELETE FROM system_settings WHERE key IN (
--     'fx_rates', 'fx_rates_mode',
--     'fx_alert_last_drift_at', 'fx_alert_last_stale_at'
--   );

INSERT INTO system_settings (key, value, category) VALUES
  ('fx_rates', '{"USD":1,"GBP":1.27,"CAD":0.74,"AUD":0.65,"EUR":1.09}', 'fx'),
  ('fx_rates_mode', 'shadow', 'fx'),
  ('fx_alert_last_drift_at', '', 'fx'),
  ('fx_alert_last_stale_at', '', 'fx')
ON CONFLICT (key) DO NOTHING;
