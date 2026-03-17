-- ============================================================
-- Migration 013: Affiliate Rates (CPA/Revenue-Share Lookup)
-- Maps provider × market to commission values for revenue
-- forecasting from CTA click data.
--
-- Security: RLS + service_role only — never exposed to frontend.
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  market VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au')),
  commission_type VARCHAR(20) NOT NULL DEFAULT 'cpa'
    CHECK (commission_type IN ('cpa', 'recurring', 'hybrid', 'revenue-share')),
  cpa_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  avg_conversion_rate NUMERIC(5,4) DEFAULT 0.03,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_name, market)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_rates_provider
  ON affiliate_rates (provider_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_rates_market
  ON affiliate_rates (market);
CREATE INDEX IF NOT EXISTS idx_affiliate_rates_active
  ON affiliate_rates (active) WHERE active = true;

-- Enable Row Level Security
ALTER TABLE affiliate_rates ENABLE ROW LEVEL SECURITY;

-- Policy: service role ONLY (never public)
CREATE POLICY "Service role manages affiliate_rates"
  ON affiliate_rates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Seed with common affiliate providers + estimated CPA values
-- ============================================================
INSERT INTO affiliate_rates (provider_name, market, commission_type, cpa_value, currency, avg_conversion_rate, notes) VALUES
  -- Trading
  ('eToro', 'us', 'cpa', 100.00, 'USD', 0.03, 'Funded account CPA'),
  ('eToro', 'uk', 'cpa', 80.00, 'USD', 0.025, 'Funded account CPA'),
  ('eToro', 'au', 'cpa', 80.00, 'USD', 0.025, 'Funded account CPA'),
  ('Interactive Brokers', 'us', 'cpa', 200.00, 'USD', 0.02, 'Funded account CPA'),
  ('Interactive Brokers', 'uk', 'cpa', 150.00, 'USD', 0.02, 'Funded account CPA'),
  ('Plus500', 'uk', 'cpa', 120.00, 'USD', 0.025, 'Funded account'),
  ('Plus500', 'au', 'cpa', 100.00, 'USD', 0.025, 'Funded account'),
  -- Personal Finance / Robo-Advisors
  ('Wealthfront', 'us', 'cpa', 75.00, 'USD', 0.04, 'Account signup CPA'),
  ('Betterment', 'us', 'cpa', 50.00, 'USD', 0.035, 'Account signup CPA'),
  ('Schwab Intelligent', 'us', 'cpa', 60.00, 'USD', 0.03, 'Account signup CPA'),
  ('Nutmeg', 'uk', 'cpa', 40.00, 'GBP', 0.035, 'Account signup CPA'),
  ('Wealthsimple', 'ca', 'cpa', 50.00, 'CAD', 0.04, 'Account signup CPA'),
  -- Business Banking
  ('Mercury', 'us', 'cpa', 100.00, 'USD', 0.05, 'Business account'),
  ('Relay', 'us', 'cpa', 75.00, 'USD', 0.04, 'Business account'),
  ('Tide', 'uk', 'cpa', 60.00, 'GBP', 0.045, 'Business account'),
  -- Cybersecurity
  ('NordVPN', NULL, 'recurring', 30.00, 'USD', 0.06, 'Subscription CPA — all markets'),
  ('ExpressVPN', NULL, 'recurring', 36.00, 'USD', 0.05, 'Subscription CPA — all markets'),
  ('Surfshark', NULL, 'recurring', 25.00, 'USD', 0.07, 'Subscription CPA — all markets'),
  -- AI Tools
  ('Jasper', NULL, 'recurring', 40.00, 'USD', 0.04, 'Subscription CPA — all markets'),
  ('Copy.ai', NULL, 'cpa', 30.00, 'USD', 0.05, 'Free trial → paid conversion')
ON CONFLICT (provider_name, market) DO NOTHING;
