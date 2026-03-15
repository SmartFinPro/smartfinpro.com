-- ============================================================
-- Backlink Platform Credentials in system_settings
-- Allows managing Reddit, Medium, EIN Presswire credentials
-- directly from the dashboard instead of .env.local
-- ============================================================

INSERT INTO system_settings (key, value, category) VALUES
  ('reddit_client_id',      '', 'backlink_credentials'),
  ('reddit_client_secret',  '', 'backlink_credentials'),
  ('reddit_username',       '', 'backlink_credentials'),
  ('reddit_password',       '', 'backlink_credentials'),
  ('medium_api_token',      '', 'backlink_credentials'),
  ('ein_presswire_api_key', '', 'backlink_credentials'),
  ('backlinks_daily_limit', '10', 'backlink_config')
ON CONFLICT (key) DO NOTHING;
