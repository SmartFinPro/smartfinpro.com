-- supabase/migrations/20260221000001_new_affiliate_programs.sql
-- Phase 2: New Affiliate Programs for New Silos
-- Date: 2026-02-21

-- Insert new affiliate programs for US, UK, AU, CA markets

INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, is_active, created_at, updated_at)
VALUES
  -- US Credit Repair & Debt Relief
  (
    'the-credit-people',
    'The Credit People',
    'https://www.thecreditpeople.com/?a=smartfinpro',
    'us',
    'credit-repair',
    150.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'national-debt-relief',
    'National Debt Relief',
    'https://www.nationaldebtrelief.com/?a=smartfinpro',
    'us',
    'debt-relief',
    250.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'lending-tree',
    'LendingTree',
    'https://www.lendingtree.com/?a=smartfinpro',
    'us',
    'credit-repair',
    65.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'lexington-law',
    'Lexington Law',
    'https://www.lexingtonlaw.com/?a=smartfinpro',
    'us',
    'credit-repair',
    120.00,
    true,
    NOW(),
    NOW()
  ),

  -- UK Remortgaging & Savings
  (
    'habito',
    'Habito',
    'https://www.habito.com/?a=smartfinpro',
    'uk',
    'remortgaging',
    125.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'raisin-uk',
    'Raisin UK',
    'https://www.raisin.co.uk/?a=smartfinpro',
    'uk',
    'savings',
    100.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'trussle',
    'Trussle',
    'https://www.trussle.com/?a=smartfinpro',
    'uk',
    'remortgaging',
    110.00,
    true,
    NOW(),
    NOW()
  ),

  -- AU Superannuation & Gold Investing
  (
    'perth-mint',
    'Perth Mint',
    'https://www.perthmint.com/goldpass/?a=smartfinpro',
    'au',
    'gold-investing',
    0.00, -- RevShare model
    true,
    NOW(),
    NOW()
  ),
  (
    'australiansuper',
    'AustralianSuper',
    'https://www.australiansuper.com/?a=smartfinpro',
    'au',
    'superannuation',
    0.00, -- Brand awareness
    true,
    NOW(),
    NOW()
  ),

  -- CA Tax-Efficient Investing
  (
    'wealthsimple',
    'Wealthsimple',
    'https://www.wealthsimple.com/invite/smartfinpro',
    'ca',
    'tax-efficient-investing',
    125.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'questrade',
    'Questrade',
    'https://www.questrade.com/?a=smartfinpro',
    'ca',
    'tax-efficient-investing',
    75.00,
    true,
    NOW(),
    NOW()
  ),

  -- Global/Multi-Market Programs
  (
    'binance',
    'Binance',
    'https://www.binance.com/en/activity/referral/smartfinpro',
    'us',
    'trading',
    0.00, -- 50% RevShare
    true,
    NOW(),
    NOW()
  ),
  (
    'etoro-global',
    'eToro',
    'https://www.etoro.com/en-us/?a=smartfinpro',
    'us',
    'trading',
    200.00,
    true,
    NOW(),
    NOW()
  )

ON CONFLICT (slug) DO UPDATE SET
  provider = EXCLUDED.provider,
  url = EXCLUDED.url,
  market = EXCLUDED.market,
  category = EXCLUDED.category,
  cpa_value = EXCLUDED.cpa_value,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Add indexes for new categories
CREATE INDEX IF NOT EXISTS idx_affiliate_links_category_us_credit_repair
  ON affiliate_links (market, category)
  WHERE market = 'us' AND category = 'credit-repair';

CREATE INDEX IF NOT EXISTS idx_affiliate_links_category_us_debt_relief
  ON affiliate_links (market, category)
  WHERE market = 'us' AND category = 'debt-relief';

CREATE INDEX IF NOT EXISTS idx_affiliate_links_category_uk_remortgaging
  ON affiliate_links (market, category)
  WHERE market = 'uk' AND category = 'remortgaging';

CREATE INDEX IF NOT EXISTS idx_affiliate_links_category_au_superannuation
  ON affiliate_links (market, category)
  WHERE market = 'au' AND category = 'superannuation';

CREATE INDEX IF NOT EXISTS idx_affiliate_links_category_au_gold_investing
  ON affiliate_links (market, category)
  WHERE market = 'au' AND category = 'gold-investing';

CREATE INDEX IF NOT EXISTS idx_affiliate_links_category_ca_tax_investing
  ON affiliate_links (market, category)
  WHERE market = 'ca' AND category = 'tax-efficient-investing';

-- Log migration
INSERT INTO cron_logs (job_name, status, duration_ms, error, executed_at)
VALUES ('migration_20260221000001', 'success', 0, NULL, NOW());

COMMENT ON TABLE affiliate_links IS 'Affiliate program links with market-specific categorization and CPA tracking';
