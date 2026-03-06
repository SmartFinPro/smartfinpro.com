-- Migration: 20260306070000_affiliate_opportunities.sql
-- Smart-Scan 2026 — Affiliate Opportunity Queue
-- Stores automatically discovered & Claude-analysed affiliate programs

CREATE TABLE IF NOT EXISTS affiliate_opportunities (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Discovery context
  market                   TEXT        NOT NULL CHECK (market IN ('us','uk','ca','au')),
  category                 TEXT        NOT NULL,
  source                   TEXT        NOT NULL DEFAULT 'serper_competitor_scan',
  source_competitor        TEXT,
  source_query             TEXT,

  -- Program info
  program_name             TEXT        NOT NULL,
  provider_url             TEXT,
  network                  TEXT        DEFAULT 'unknown',

  -- Claude Analysis
  trust_score              INTEGER     CHECK (trust_score BETWEEN 1 AND 10),
  compliance_status        TEXT        DEFAULT 'pending'
                             CHECK (compliance_status IN ('pending','pass','review','fail')),
  compliance_flags         TEXT[]      DEFAULT '{}',
  revenue_forecast_monthly NUMERIC(10,2),
  revenue_confidence       TEXT        DEFAULT 'low'
                             CHECK (revenue_confidence IN ('low','medium','high')),

  -- Draft content
  draft_slug               TEXT,
  draft_title              TEXT,
  analysis_notes           TEXT,

  -- Workflow
  status                   TEXT        DEFAULT 'new'
                             CHECK (status IN ('new','reviewing','approved','rejected','published')),
  reviewed_at              TIMESTAMPTZ,
  published_at             TIMESTAMPTZ,

  discovered_at            TIMESTAMPTZ DEFAULT NOW(),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Dedup: same program per market only once
CREATE UNIQUE INDEX IF NOT EXISTS idx_opp_program_market
  ON affiliate_opportunities(LOWER(program_name), market);

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_opp_status
  ON affiliate_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opp_market_category
  ON affiliate_opportunities(market, category);
CREATE INDEX IF NOT EXISTS idx_opp_trust_score
  ON affiliate_opportunities(trust_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_opp_discovered_at
  ON affiliate_opportunities(discovered_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_affiliate_opportunities_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_opp_updated_at
  BEFORE UPDATE ON affiliate_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_affiliate_opportunities_ts();

-- RLS
ALTER TABLE affiliate_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
  ON affiliate_opportunities FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE affiliate_opportunities IS
  'Smart-Scan 2026: Auto-discovered affiliate programs with Claude trust/compliance analysis';
COMMENT ON COLUMN affiliate_opportunities.trust_score IS
  '1-10: 1-3=high risk, 4-6=medium, 7-9=good, 10=tier-1 regulated';
COMMENT ON COLUMN affiliate_opportunities.compliance_flags IS
  'Array of compliance issues: e.g. {missing_fca_disclosure, unregulated_product}';
COMMENT ON COLUMN affiliate_opportunities.revenue_forecast_monthly IS
  'Estimated monthly USD revenue based on traffic × CPA × conversion rate';
