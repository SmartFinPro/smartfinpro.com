-- supabase/migrations/20260325180000_nordvpn_multi_market.sql
-- NordVPN CJ Affiliate — UK / CA / AU market entries
-- CJ Advertiser ID: 13382109 | Publisher ID: 7906274
-- Same CJ tracking link used across all markets (PID is publisher-level)

INSERT INTO affiliate_links (slug, partner_name, destination_url, category, market, commission_type, commission_value, active)
VALUES
  (
    'nordvpn-uk',
    'NordVPN',
    'https://www.jdoqocy.com/click-7906274-13382109',
    'cybersecurity',
    'uk',
    'cpa',
    40.00,
    true
  ),
  (
    'nordvpn-ca',
    'NordVPN',
    'https://www.jdoqocy.com/click-7906274-13382109',
    'cybersecurity',
    'ca',
    'cpa',
    40.00,
    true
  ),
  (
    'nordvpn-au',
    'NordVPN',
    'https://www.jdoqocy.com/click-7906274-13382109',
    'cybersecurity',
    'au',
    'cpa',
    40.00,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  destination_url = EXCLUDED.destination_url,
  active = true;

-- Log migration
INSERT INTO cron_logs (job_name, status, duration_ms, error, executed_at)
VALUES ('migration_20260325180000_nordvpn_multi_market', 'success', 0, NULL, NOW())
ON CONFLICT DO NOTHING;
