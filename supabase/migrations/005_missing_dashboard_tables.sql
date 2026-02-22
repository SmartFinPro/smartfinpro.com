-- ============================================================
-- Migration 005: Create missing tables required by Dashboard
--
-- These tables are referenced by dashboard.ts but didn't exist:
--   - page_views (scroll depth, engagement tracking)
--   - newsletter_subscribers (alias view for subscribers table)
--   - leads (lead tracking)
-- ============================================================

-- ── 1. PAGE_VIEWS TABLE ──
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  market VARCHAR(4),
  category VARCHAR(50),
  article_slug VARCHAR(255),
  lang VARCHAR(10),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_on_page INTEGER, -- seconds
  scroll_depth SMALLINT CHECK (scroll_depth IS NULL OR (scroll_depth >= 0 AND scroll_depth <= 100)),
  referrer TEXT,
  referrer_domain VARCHAR(255),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  device_type VARCHAR(20),
  browser VARCHAR(100),
  os VARCHAR(100),
  screen_width SMALLINT,
  screen_height SMALLINT,
  country_code VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  user_agent TEXT,
  ip_hash VARCHAR(64)
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views (viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_article_slug ON page_views (article_slug) WHERE article_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_scroll_depth ON page_views (scroll_depth) WHERE scroll_depth IS NOT NULL AND scroll_depth > 0;
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views (page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_market ON page_views (market);
CREATE INDEX IF NOT EXISTS idx_page_views_lang ON page_views (lang);

-- RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to page_views" ON page_views FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE page_views IS 'Page view tracking with scroll depth and engagement metrics';


-- ── 2. LEADS TABLE ──
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(100) NOT NULL DEFAULT 'website',
  source_url TEXT,
  source_page TEXT,
  campaign VARCHAR(255),
  market VARCHAR(4) NOT NULL DEFAULT 'us',
  interest_category VARCHAR(50),
  budget_range VARCHAR(50),
  timeline VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_market ON leads (market);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (LOWER(email));

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to leads" ON leads FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE leads IS 'Qualified leads from forms, downloads, and interactions';


-- ── 3. NEWSLETTER_SUBSCRIBERS VIEW ──
-- Dashboard code references 'newsletter_subscribers' but migration 003
-- created 'subscribers'. Create a view alias for compatibility.
-- If 'subscribers' table already exists, create a view.
-- If it doesn't exist, create the full table.

DO $$
BEGIN
  -- Check if 'subscribers' table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers') THEN
    -- Create a view alias
    CREATE OR REPLACE VIEW newsletter_subscribers AS
    SELECT
      id,
      email,
      status,
      lead_magnet,
      source AS source_page,
      country_code,
      created_at,
      updated_at
    FROM subscribers;

    RAISE NOTICE 'Created newsletter_subscribers view (alias for subscribers table)';
  ELSE
    -- Create the full table if subscribers doesn't exist
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'confirmed', 'unsubscribed', 'bounced', 'complained')),
      lead_magnet VARCHAR(255),
      source_page TEXT,
      country_code VARCHAR(2),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subs_email ON newsletter_subscribers (LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_newsletter_subs_created ON newsletter_subscribers (created_at DESC);

    ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Service role full access to newsletter_subscribers" ON newsletter_subscribers FOR ALL USING (auth.role() = 'service_role');

    RAISE NOTICE 'Created newsletter_subscribers table (subscribers table did not exist)';
  END IF;
END $$;

COMMENT ON TABLE page_views IS 'Page view tracking with scroll depth and engagement metrics';
COMMENT ON TABLE leads IS 'Qualified leads from forms, downloads, and interactions';
