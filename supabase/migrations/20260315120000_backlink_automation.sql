-- Migration: Backlink Automation System
-- Created: 2026-03-15
-- Purpose: Tables for automated backlink discovery, placement, and tracking

-- ============================================================
-- 1. backlink_opportunities — Found opportunities via Serper/Reddit monitoring
-- ============================================================
CREATE TABLE IF NOT EXISTS backlink_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('reddit', 'quora', 'forum', 'medium', 'pr', 'stackexchange', 'hackernews')),
  source_url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,                        -- Extracted context snippet from Serper
  target_keyword TEXT NOT NULL,        -- Our target keyword
  target_url TEXT NOT NULL,            -- Our page to link to
  market TEXT NOT NULL CHECK (market IN ('us', 'uk', 'ca', 'au')),
  category TEXT,
  opportunity_score INTEGER DEFAULT 0 CHECK (opportunity_score BETWEEN 0 AND 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'posted', 'failed', 'skipped', 'manual_review')),
  generated_content TEXT,              -- Claude-generated response/article
  anchor_text TEXT,                    -- Suggested anchor text
  posted_at TIMESTAMPTZ,
  placement_url TEXT,                  -- URL of our posted response
  error_message TEXT,                  -- If status = 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backlink_opps_status ON backlink_opportunities(status);
CREATE INDEX idx_backlink_opps_market ON backlink_opportunities(market);
CREATE INDEX idx_backlink_opps_score ON backlink_opportunities(opportunity_score DESC);
CREATE INDEX idx_backlink_opps_keyword ON backlink_opportunities(target_keyword);
CREATE UNIQUE INDEX idx_backlink_opps_source ON backlink_opportunities(source_url); -- no duplicates

-- ============================================================
-- 2. backlink_placements — Successful placements with live tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS backlink_placements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES backlink_opportunities(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  is_dofollow BOOLEAN DEFAULT true,
  domain_authority INTEGER,            -- DA score 0-100
  market TEXT CHECK (market IN ('us', 'uk', 'ca', 'au')),
  category TEXT,
  status TEXT DEFAULT 'live' CHECK (status IN ('live', 'lost', 'nofollow', 'unverified')),
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  UNIQUE(source_url, target_url)       -- no duplicate tracking
);

CREATE INDEX idx_backlink_pl_status ON backlink_placements(status);
CREATE INDEX idx_backlink_pl_market ON backlink_placements(market);
CREATE INDEX idx_backlink_pl_da ON backlink_placements(domain_authority DESC);
CREATE INDEX idx_backlink_pl_target ON backlink_placements(target_url);

-- ============================================================
-- 3. backlink_campaigns — Campaign configuration per market/category
-- ============================================================
CREATE TABLE IF NOT EXISTS backlink_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  market TEXT CHECK (market IN ('us', 'uk', 'ca', 'au')),  -- NULL = all markets
  category TEXT,                       -- NULL = all categories
  target_keywords TEXT[] NOT NULL DEFAULT '{}',
  target_urls TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{"reddit", "quora", "medium"}',
  daily_limit INTEGER DEFAULT 5 CHECK (daily_limit BETWEEN 1 AND 20),
  min_opportunity_score INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. backlink_domain_authority — DA cache for known domains
-- ============================================================
CREATE TABLE IF NOT EXISTS backlink_domain_authority (
  domain TEXT PRIMARY KEY,
  da_score INTEGER,
  is_dofollow BOOLEAN DEFAULT true,    -- Most known high-DA domains are dofollow
  last_checked TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-seed known DA values for Tier 1 platforms
INSERT INTO backlink_domain_authority (domain, da_score, is_dofollow) VALUES
  ('reddit.com', 91, true),
  ('quora.com', 83, true),
  ('medium.com', 95, true),
  ('linkedin.com', 98, false),        -- LinkedIn links are nofollow
  ('money.stackexchange.com', 79, true),
  ('news.ycombinator.com', 88, true),
  ('dev.to', 74, true),
  ('hashnode.com', 72, true),
  ('forexpeacearmy.com', 55, true),
  ('babypips.com', 65, true),
  ('bogleheads.org', 60, true),
  ('whirlpool.net.au', 52, true),
  ('stockhouse.com', 51, true),
  ('prlog.org', 65, true),
  ('pr.com', 55, true),
  ('openpr.com', 58, true)
ON CONFLICT (domain) DO NOTHING;

-- ============================================================
-- 5. Row Level Security
-- ============================================================
ALTER TABLE backlink_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_domain_authority ENABLE ROW LEVEL SECURITY;

-- Service role gets full access (used by cron jobs + server actions)
CREATE POLICY "service_role_all_opportunities"
  ON backlink_opportunities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_placements"
  ON backlink_placements FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_campaigns"
  ON backlink_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_da"
  ON backlink_domain_authority FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 6. Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at column (skip if trigger already exists from earlier migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_backlink_opportunities_updated_at'
  ) THEN
    CREATE TRIGGER update_backlink_opportunities_updated_at
      BEFORE UPDATE ON backlink_opportunities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_backlink_campaigns_updated_at'
  ) THEN
    CREATE TRIGGER update_backlink_campaigns_updated_at
      BEFORE UPDATE ON backlink_campaigns
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- ============================================================
-- 7. Default campaigns seeding
-- ============================================================
INSERT INTO backlink_campaigns (name, market, category, target_keywords, target_urls, platforms, daily_limit)
VALUES
  (
    'US Forex Backlinks',
    'us', 'forex',
    ARRAY['best forex brokers', 'forex trading platforms USA', 'forex broker comparison', 'best forex broker for beginners'],
    ARRAY['/forex/', '/forex/best-forex-brokers/'],
    ARRAY['reddit', 'quora', 'medium', 'forum'],
    5
  ),
  (
    'UK Trading Authority',
    'uk', 'trading',
    ARRAY['best trading platforms UK', 'UK stock broker comparison', 'ISA investing UK'],
    ARRAY['/uk/trading/', '/uk/trading/best-trading-platforms-uk/'],
    ARRAY['reddit', 'quora', 'medium'],
    4
  ),
  (
    'AU Forex Pepperstone',
    'au', 'forex',
    ARRAY['best forex brokers Australia', 'Pepperstone review', 'Australian forex trading'],
    ARRAY['/au/forex/', '/au/forex/pepperstone-review/'],
    ARRAY['reddit', 'quora', 'forum'],
    3
  ),
  (
    'CA Investing Questrade',
    'ca', 'trading',
    ARRAY['best investment platforms Canada', 'Questrade review', 'TFSA investing Canada 2026'],
    ARRAY['/ca/trading/', '/ca/trading/questrade-review/'],
    ARRAY['reddit', 'quora', 'medium'],
    3
  ),
  (
    'US AI Tools',
    'us', 'ai-tools',
    ARRAY['best AI writing tools', 'Jasper AI review', 'AI tools for business 2026', 'ChatGPT alternatives'],
    ARRAY['/ai-tools/', '/ai-tools/jasper-ai-review/'],
    ARRAY['reddit', 'quora', 'medium', 'hackernews'],
    5
  ),
  (
    'US Personal Finance Debt',
    'us', 'personal-finance',
    ARRAY['best debt relief companies', 'National Debt Relief review', 'debt consolidation USA'],
    ARRAY['/personal-finance/', '/personal-finance/national-debt-relief-review/'],
    ARRAY['reddit', 'quora', 'medium'],
    4
  )
ON CONFLICT DO NOTHING;
