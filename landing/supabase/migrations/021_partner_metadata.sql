-- ============================================================
-- 021: Partner Metadata + Click Counts RPC
-- Category Winner Badges, Featured Partner status,
-- and dynamic social proof via aggregated click counts
-- ============================================================

-- ── Table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  market VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au')),
  category VARCHAR(40) NOT NULL CHECK (category IN (
    'ai-tools', 'cybersecurity', 'trading', 'forex', 'personal-finance', 'business-banking'
  )),
  -- Winner Badge (editorial or auto-assigned)
  winner_badge TEXT,
  winner_badge_type VARCHAR(20) DEFAULT 'editorial' CHECK (winner_badge_type IN ('editorial', 'auto')),
  -- Featured Partner fields
  is_featured BOOLEAN NOT NULL DEFAULT false,
  featured_headline TEXT,
  featured_offer TEXT,
  featured_expires_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────

-- One metadata row per provider+market+category
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_meta_unique
  ON partner_metadata (provider_name, market, category)
  WHERE market IS NOT NULL;

-- Global entries (market IS NULL = all markets)
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_meta_global
  ON partner_metadata (provider_name, category)
  WHERE market IS NULL;

-- Fast lookup by market + category
CREATE INDEX IF NOT EXISTS idx_partner_meta_market_cat
  ON partner_metadata (market, category);

-- Featured partners quick lookup
CREATE INDEX IF NOT EXISTS idx_partner_meta_featured
  ON partner_metadata (category, market)
  WHERE is_featured = true;

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE partner_metadata ENABLE ROW LEVEL SECURITY;

-- Anon can read all metadata (public data)
CREATE POLICY "partner_metadata_anon_read" ON partner_metadata
  FOR SELECT TO anon
  USING (true);

-- Authenticated can read all
CREATE POLICY "partner_metadata_auth_read" ON partner_metadata
  FOR SELECT TO authenticated
  USING (true);

-- Service role has full access
CREATE POLICY "partner_metadata_service_all" ON partner_metadata
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ── RPC: Aggregated Click Counts ─────────────────────────────
-- Combines link_clicks (via affiliate_links JOIN) and cta_analytics
-- to produce per-provider click counts for social proof display.

CREATE OR REPLACE FUNCTION get_provider_click_counts(
  p_category TEXT,
  p_market TEXT DEFAULT NULL,
  p_days_back INT DEFAULT 30
)
RETURNS TABLE (provider_name TEXT, click_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH link_click_counts AS (
    -- Clicks from link_clicks joined to affiliate_links for provider name
    SELECT
      al.partner_name AS pname,
      COUNT(lc.id) AS cnt
    FROM link_clicks lc
    JOIN affiliate_links al ON al.id::text = lc.link_id
    WHERE al.category = p_category
      AND al.active = true
      AND lc.clicked_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND (p_market IS NULL OR al.market = p_market OR al.market IS NULL)
    GROUP BY al.partner_name
  ),
  cta_click_counts AS (
    -- Clicks from cta_analytics (has provider directly)
    SELECT
      ca.provider AS pname,
      COUNT(ca.id) AS cnt
    FROM cta_analytics ca
    WHERE ca.slug LIKE '%' || p_category || '%'
      AND ca.clicked_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND (p_market IS NULL OR ca.market = p_market)
    GROUP BY ca.provider
  ),
  combined AS (
    SELECT pname, cnt FROM link_click_counts
    UNION ALL
    SELECT pname, cnt FROM cta_click_counts
  )
  SELECT
    combined.pname AS provider_name,
    SUM(combined.cnt) AS click_count
  FROM combined
  GROUP BY combined.pname
  ORDER BY click_count DESC;
END;
$$;

-- ── Seed Data ────────────────────────────────────────────────

-- US Trading
INSERT INTO partner_metadata (provider_name, market, category, winner_badge, winner_badge_type, is_featured, featured_headline, featured_offer) VALUES
  ('eToro', 'us', 'trading', 'Best Overall', 'editorial', true,
   'Copy the Pros', 'Start with $50. Copy top traders automatically with 30M+ users worldwide.'),
  ('Interactive Brokers', 'us', 'trading', 'Best for Active Traders', 'editorial', false, NULL, NULL),
  ('Webull', 'us', 'trading', 'Best for Beginners', 'editorial', false, NULL, NULL),
  ('Robinhood', 'us', 'trading', 'Best Value', 'editorial', false, NULL, NULL);

-- US Personal Finance
INSERT INTO partner_metadata (provider_name, market, category, winner_badge, winner_badge_type, is_featured, featured_headline, featured_offer) VALUES
  ('Wealthfront', 'us', 'personal-finance', 'Best Overall', 'editorial', true,
   'Automated Investing Made Simple', 'Get your first $5,000 managed free. Tax-loss harvesting included.'),
  ('Betterment', 'us', 'personal-finance', 'Best for Beginners', 'editorial', false, NULL, NULL),
  ('Schwab Intelligent', 'us', 'personal-finance', 'Best Value', 'editorial', false, NULL, NULL);

-- US AI Tools
INSERT INTO partner_metadata (provider_name, market, category, winner_badge, winner_badge_type, is_featured, featured_headline, featured_offer) VALUES
  ('TradingView', 'us', 'ai-tools', 'Best Overall', 'editorial', true,
   'AI-Powered Market Analysis', 'Join 50M+ traders. Advanced charting with AI insights built in.');

-- UK Trading
INSERT INTO partner_metadata (provider_name, market, category, winner_badge, winner_badge_type, is_featured, featured_headline, featured_offer) VALUES
  ('eToro', 'uk', 'trading', 'Best Overall', 'editorial', true,
   'Copy the Pros', 'Start with $50. Copy top traders automatically.'),
  ('IG', 'uk', 'trading', 'Best for Active Traders', 'editorial', false, NULL, NULL);

-- US Forex
INSERT INTO partner_metadata (provider_name, market, category, winner_badge, winner_badge_type, is_featured, featured_headline, featured_offer) VALUES
  ('IG', 'us', 'forex', 'Best Overall', 'editorial', true,
   'World-Class Forex Trading', 'Trade 80+ currency pairs with tight spreads and advanced tools.');
