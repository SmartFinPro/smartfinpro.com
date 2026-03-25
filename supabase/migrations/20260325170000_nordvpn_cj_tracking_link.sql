-- supabase/migrations/20260325170000_nordvpn_cj_tracking_link.sql
-- NordVPN CJ Affiliate Program — Approved 2026-03-25
-- Update destination_url with real CJ tracking link
-- CJ Advertiser ID: 13382109 | Publisher ID: 7906274
-- Tracking domain: jdoqocy.com (CJ tracking domain)

-- INSERT NordVPN (was not in DB yet — seed from schema.sql was never applied)
INSERT INTO affiliate_links (slug, partner_name, destination_url, category, market, commission_type, commission_value, active)
VALUES (
  'nordvpn',
  'NordVPN',
  'https://www.jdoqocy.com/click-7906274-13382109',
  'cybersecurity',
  'us',
  'cpa',
  40.00,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  destination_url = EXCLUDED.destination_url,
  active = true;

-- Log migration
INSERT INTO cron_logs (job_name, status, duration_ms, error, executed_at)
VALUES ('migration_20260325170000_nordvpn_cj', 'success', 0, NULL, NOW())
ON CONFLICT DO NOTHING;
