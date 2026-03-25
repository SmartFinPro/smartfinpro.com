-- supabase/migrations/20260325160000_cj_top7_programs.sql
-- CJ Top 7 High-EPC Programs — Applied 2026-03-25
-- All pending advertiser approval (1–7 days)
-- Update urls with real CJ tracking links after approval

INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, is_active, network, created_at, updated_at)
VALUES

  -- 1. Fairstone Canada Personal Loans — EPC: $716.85 CAD (ID: 3344421)
  (
    'fairstone-canada',
    'Fairstone Canada',
    '/go/fairstone-canada/',
    'ca',
    'personal-finance',
    200.00,
    false, -- pending CJ approval
    'Commission Junction',
    NOW(),
    NOW()
  ),

  -- 2. Hiscox Small Business Insurance — EPC: $441 (ID: 4165310)
  (
    'hiscox-business',
    'Hiscox Small Business Insurance',
    '/go/hiscox-business/',
    'us',
    'business-banking',
    150.00,
    false, -- pending CJ approval
    'Commission Junction',
    NOW(),
    NOW()
  ),

  -- 3. New York Life Insurance — EPC: $390 (ID: 6580343)
  (
    'new-york-life',
    'New York Life Insurance',
    '/go/new-york-life/',
    'us',
    'personal-finance',
    100.00,
    false, -- pending CJ approval
    'Commission Junction',
    NOW(),
    NOW()
  ),

  -- 4. ExpressVPN Global Programme — EPC: $378 (ID: 5577978)
  (
    'expressvpn',
    'ExpressVPN',
    '/go/expressvpn/',
    'us',
    'cybersecurity',
    36.00,
    false, -- pending CJ approval
    'Commission Junction',
    NOW(),
    NOW()
  ),

  -- 5. Mortgage Research Center — EPC: $316 (ID: 7647072)
  (
    'mortgage-research-center',
    'Mortgage Research Center',
    '/go/mortgage-research-center/',
    'us',
    'personal-finance',
    30.00,
    false, -- pending CJ approval
    'Commission Junction',
    NOW(),
    NOW()
  ),

  -- 6. AVAST Software — EPC: $125 (ID: 4257305)
  (
    'avast',
    'AVAST Software',
    '/go/avast/',
    'us',
    'cybersecurity',
    40.00,
    false, -- pending CJ approval
    'Commission Junction',
    NOW(),
    NOW()
  ),

  -- 7. CyberGhost VPN — EPC: $118 (ID: 4996371)
  (
    'cyberghost-vpn',
    'CyberGhost VPN',
    '/go/cyberghost-vpn/',
    'us',
    'cybersecurity',
    30.00,
    false, -- pending CJ approval
    'Commission Junction',
    NOW(),
    NOW()
  )

ON CONFLICT (slug) DO UPDATE SET
  provider = EXCLUDED.provider,
  url = EXCLUDED.url,
  market = EXCLUDED.market,
  category = EXCLUDED.category,
  cpa_value = EXCLUDED.cpa_value,
  network = EXCLUDED.network,
  updated_at = NOW();

-- Log migration
INSERT INTO cron_logs (job_name, status, duration_ms, error, executed_at)
VALUES ('migration_20260325160000_cj_top7', 'success', 0, NULL, NOW());

-- ============================================================
-- TODO after CJ approval (1–7 days):
-- UPDATE affiliate_links SET
--   url = 'https://www.cj.com/track/[REAL_LINK]',
--   is_active = true,
--   updated_at = NOW()
-- WHERE slug IN (
--   'fairstone-canada',       -- CJ Advertiser ID: 3344421
--   'hiscox-business',        -- CJ Advertiser ID: 4165310
--   'new-york-life',          -- CJ Advertiser ID: 6580343
--   'expressvpn',             -- CJ Advertiser ID: 5577978
--   'mortgage-research-center', -- CJ Advertiser ID: 7647072
--   'avast',                  -- CJ Advertiser ID: 4257305
--   'cyberghost-vpn'          -- CJ Advertiser ID: 4996371
-- );
-- ============================================================
