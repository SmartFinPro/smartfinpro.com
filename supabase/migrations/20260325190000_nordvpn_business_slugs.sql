-- supabase/migrations/20260325190000_nordvpn_business_slugs.sql
-- NordVPN Teams/Business CJ Affiliate — US / UK / CA / AU market entries
-- CJ Advertiser ID: 13382109 | Publisher ID: 7906274
-- Used on /[market]/cybersecurity/nordvpn-business-review pages

INSERT INTO affiliate_links (slug, partner_name, destination_url, category, market, commission_type, commission_value, active)
VALUES
  (
    'nordvpn-business',
    'NordVPN',
    'https://www.jdoqocy.com/click-7906274-13382109',
    'cybersecurity',
    'us',
    'cpa',
    40.00,
    true
  ),
  (
    'nordvpn-business-uk',
    'NordVPN',
    'https://www.jdoqocy.com/click-7906274-13382109',
    'cybersecurity',
    'uk',
    'cpa',
    40.00,
    true
  ),
  (
    'nordvpn-business-ca',
    'NordVPN',
    'https://www.jdoqocy.com/click-7906274-13382109',
    'cybersecurity',
    'ca',
    'cpa',
    40.00,
    true
  ),
  (
    'nordvpn-business-au',
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
VALUES ('migration_20260325190000_nordvpn_business_slugs', 'success', 0, NULL, NOW())
ON CONFLICT DO NOTHING;
