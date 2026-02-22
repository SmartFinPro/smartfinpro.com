-- ════════════════════════════════════════════════════════════════
-- Migration 018: Guardian Notification Settings
--
-- Adds notification_email and guardian_enabled settings
-- for the API connectivity monitoring system (Guardian).
-- ════════════════════════════════════════════════════════════════

INSERT INTO system_settings (key, value, category) VALUES
  ('notification_email', '', 'notifications'),
  ('guardian_enabled', 'false', 'notifications')
ON CONFLICT (key) DO NOTHING;
