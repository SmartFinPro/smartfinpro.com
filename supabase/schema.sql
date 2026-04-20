-- ============================================================
-- SmartFinPro Complete Database Schema
-- Version: 2.0
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Affiliate Links Table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  partner_name VARCHAR(255) NOT NULL,
  destination_url TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('ai-tools', 'cybersecurity', 'trading', 'forex', 'personal-finance', 'business-banking', 'credit-repair', 'credit-score', 'gold-investing')),
  market VARCHAR(10) CHECK (market IN ('us', 'uk', 'ca', 'au')),
  commission_type VARCHAR(20) CHECK (commission_type IN ('cpa', 'recurring', 'hybrid', 'revenue-share')),
  commission_value DECIMAL(10,2),
  commission_currency VARCHAR(3) DEFAULT 'USD',
  cookie_days INTEGER DEFAULT 30,
  network VARCHAR(50),
  network_link_id VARCHAR(255),
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Click Tracking Table
CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE,
  session_id VARCHAR(64),
  clicked_at TIMESTAMPTZ DEFAULT NOW(),

  -- UTM Parameters
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),

  -- Geographic & Device Info
  country_code VARCHAR(2) DEFAULT 'XX',
  region VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser VARCHAR(50),
  os VARCHAR(50),

  -- Referral Info
  referrer TEXT,
  referrer_domain VARCHAR(255),
  landing_page TEXT,

  -- Raw Data
  user_agent TEXT,
  ip_hash VARCHAR(64),  -- Hashed for privacy

  -- Attribution
  page_slug VARCHAR(255),
  button_id VARCHAR(100)
);

-- Conversions Table
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  click_id UUID REFERENCES link_clicks(id) ON DELETE SET NULL,

  converted_at TIMESTAMPTZ DEFAULT NOW(),
  commission_earned DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Network Data
  network VARCHAR(50),
  network_reference VARCHAR(255),
  network_status VARCHAR(50),

  -- Status Tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reversed')),
  approved_at TIMESTAMPTZ,

  -- Additional Info
  product_name VARCHAR(255),
  transaction_value DECIMAL(10,2),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEADS & SUBSCRIBERS
-- ============================================================

-- Email Subscribers Table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,

  -- Subscription Details
  lead_magnet VARCHAR(100),
  source VARCHAR(100),
  market VARCHAR(10) DEFAULT 'us' CHECK (market IN ('us', 'uk', 'ca', 'au')),

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'bounced', 'complained')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,

  -- Preferences
  preferences JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Tracking
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,

  -- Email Provider
  email_provider_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads Table (for more detailed lead capture)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact Info
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  phone VARCHAR(50),

  -- Lead Source
  source VARCHAR(100) NOT NULL,
  source_url TEXT,
  campaign VARCHAR(255),
  market VARCHAR(10) DEFAULT 'us' CHECK (market IN ('us', 'uk', 'ca', 'au')),

  -- Lead Qualification
  interest_category VARCHAR(50),
  budget_range VARCHAR(50),
  timeline VARCHAR(50),

  -- Status
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  score INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  -- Tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(255),
  ip_address VARCHAR(45),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================

-- Page Views Table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(64) NOT NULL,

  -- Page Info
  page_path TEXT NOT NULL,
  page_title VARCHAR(500),
  market VARCHAR(10),
  category VARCHAR(50),
  article_slug VARCHAR(255),

  -- Timing
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  time_on_page INTEGER, -- seconds
  scroll_depth INTEGER, -- percentage

  -- Traffic Source
  referrer TEXT,
  referrer_domain VARCHAR(255),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(255),

  -- Device Info
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  screen_width INTEGER,
  screen_height INTEGER,

  -- Geographic
  country_code VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),

  -- User Agent
  user_agent TEXT,
  ip_hash VARCHAR(64)
);

-- Custom Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(64) NOT NULL,

  -- Event Info
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50),
  event_action VARCHAR(100),
  event_label VARCHAR(255),
  event_value DECIMAL(10,2),

  -- Context
  page_path TEXT,
  element_id VARCHAR(100),
  element_class VARCHAR(255),
  element_text VARCHAR(500),

  -- Metadata
  properties JSONB DEFAULT '{}',

  -- Timing
  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  -- Device & Geo
  device_type VARCHAR(20),
  country_code VARCHAR(2)
);

-- ============================================================
-- ADMIN & SETTINGS
-- ============================================================

-- Admin Users (links to Supabase Auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id)
);

-- API Sync Logs
CREATE TABLE IF NOT EXISTS api_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network VARCHAR(50) NOT NULL,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Affiliate Links
CREATE INDEX IF NOT EXISTS idx_affiliate_links_slug ON affiliate_links(slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON affiliate_links(active);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_category ON affiliate_links(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_market ON affiliate_links(market);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_network ON affiliate_links(network);

-- Link Clicks
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_link_clicks_session_id ON link_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_country ON link_clicks(country_code);
CREATE INDEX IF NOT EXISTS idx_link_clicks_device ON link_clicks(device_type);

-- Conversions
CREATE INDEX IF NOT EXISTS idx_conversions_link_id ON conversions(link_id);
CREATE INDEX IF NOT EXISTS idx_conversions_converted_at ON conversions(converted_at);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_network ON conversions(network);

-- Subscribers
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_market ON subscribers(market);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_lead_magnet ON subscribers(lead_magnet);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Page Views
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_article_slug ON page_views(article_slug);

-- Analytics Events
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON analytics_events(occurred_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sync_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Public read active affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Authenticated full access affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Anon insert clicks" ON link_clicks;
DROP POLICY IF EXISTS "Authenticated read clicks" ON link_clicks;
DROP POLICY IF EXISTS "Authenticated full access conversions" ON conversions;
DROP POLICY IF EXISTS "Anon insert subscribers" ON subscribers;
DROP POLICY IF EXISTS "Authenticated read subscribers" ON subscribers;
DROP POLICY IF EXISTS "Authenticated update subscribers" ON subscribers;

-- Affiliate Links Policies
CREATE POLICY "Public read active affiliate links"
  ON affiliate_links FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated full access affiliate links"
  ON affiliate_links FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Link Clicks Policies (anonymous can insert, authenticated can read)
CREATE POLICY "Anon insert clicks"
  ON link_clicks FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service insert clicks"
  ON link_clicks FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated read clicks"
  ON link_clicks FOR SELECT
  TO authenticated
  USING (true);

-- Conversions Policies
CREATE POLICY "Authenticated full access conversions"
  ON conversions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Subscribers Policies
CREATE POLICY "Anon insert subscribers"
  ON subscribers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service insert subscribers"
  ON subscribers FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated manage subscribers"
  ON subscribers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Leads Policies
CREATE POLICY "Anon insert leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated manage leads"
  ON leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Page Views Policies
CREATE POLICY "Anon insert page views"
  ON page_views FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated read page views"
  ON page_views FOR SELECT
  TO authenticated
  USING (true);

-- Analytics Events Policies
CREATE POLICY "Anon insert events"
  ON analytics_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated read events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (true);

-- Admin Users Policies
CREATE POLICY "Users can view own profile"
  ON admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Settings Policies
CREATE POLICY "Authenticated read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update settings"
  ON settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- API Sync Logs Policies
CREATE POLICY "Authenticated read sync logs"
  ON api_sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service manage sync logs"
  ON api_sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- VIEWS
-- ============================================================

-- Daily Click Statistics
CREATE OR REPLACE VIEW daily_click_stats AS
SELECT
  DATE(clicked_at) as date,
  link_id,
  COUNT(*) as clicks,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT country_code) as unique_countries,
  COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_clicks,
  COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_clicks
FROM link_clicks
GROUP BY DATE(clicked_at), link_id
ORDER BY date DESC;

-- Monthly Revenue Summary
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', converted_at) as month,
  SUM(commission_earned) as total_revenue,
  COUNT(*) as total_conversions,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_conversions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_conversions,
  currency
FROM conversions
GROUP BY DATE_TRUNC('month', converted_at), currency
ORDER BY month DESC;

-- Link Performance Overview
CREATE OR REPLACE VIEW link_performance AS
SELECT
  al.id,
  al.slug,
  al.partner_name,
  al.category,
  al.market,
  al.commission_type,
  al.commission_value,
  COUNT(DISTINCT lc.id) as total_clicks,
  COUNT(DISTINCT lc.session_id) as unique_clicks,
  COUNT(DISTINCT c.id) as total_conversions,
  COALESCE(SUM(CASE WHEN c.status = 'approved' THEN c.commission_earned ELSE 0 END), 0) as approved_revenue,
  COALESCE(SUM(c.commission_earned), 0) as total_revenue,
  CASE
    WHEN COUNT(DISTINCT lc.id) > 0
    THEN ROUND(COUNT(DISTINCT c.id)::numeric / COUNT(DISTINCT lc.id) * 100, 2)
    ELSE 0
  END as conversion_rate,
  MAX(lc.clicked_at) as last_click,
  MAX(c.converted_at) as last_conversion
FROM affiliate_links al
LEFT JOIN link_clicks lc ON al.id = lc.link_id
LEFT JOIN conversions c ON al.id = c.link_id
WHERE al.active = true
GROUP BY al.id, al.slug, al.partner_name, al.category, al.market, al.commission_type, al.commission_value;

-- Geographic Stats
CREATE OR REPLACE VIEW geographic_stats AS
SELECT
  country_code,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT session_id) as unique_sessions,
  DATE(MIN(clicked_at)) as first_click,
  DATE(MAX(clicked_at)) as last_click
FROM link_clicks
WHERE country_code != 'XX'
GROUP BY country_code
ORDER BY total_clicks DESC;

-- Device Stats
CREATE OR REPLACE VIEW device_stats AS
SELECT
  device_type,
  browser,
  os,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT session_id) as unique_sessions
FROM link_clicks
WHERE device_type IS NOT NULL
GROUP BY device_type, browser, os
ORDER BY total_clicks DESC;

-- Subscriber Growth
CREATE OR REPLACE VIEW subscriber_growth AS
SELECT
  DATE(subscribed_at) as date,
  market,
  lead_magnet,
  COUNT(*) as new_subscribers,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'unsubscribed' THEN 1 END) as unsubscribed
FROM subscribers
GROUP BY DATE(subscribed_at), market, lead_magnet
ORDER BY date DESC;

-- Top Pages by Views
CREATE OR REPLACE VIEW top_pages AS
SELECT
  page_path,
  article_slug,
  category,
  market,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_views,
  AVG(time_on_page) as avg_time_on_page,
  AVG(scroll_depth) as avg_scroll_depth
FROM page_views
WHERE viewed_at > NOW() - INTERVAL '30 days'
GROUP BY page_path, article_slug, category, market
ORDER BY total_views DESC;

-- Grant view access
GRANT SELECT ON daily_click_stats TO authenticated;
GRANT SELECT ON monthly_revenue TO authenticated;
GRANT SELECT ON link_performance TO authenticated;
GRANT SELECT ON geographic_stats TO authenticated;
GRANT SELECT ON device_stats TO authenticated;
GRANT SELECT ON subscriber_growth TO authenticated;
GRANT SELECT ON top_pages TO authenticated;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_affiliate_links_updated_at ON affiliate_links;
CREATE TRIGGER update_affiliate_links_updated_at
  BEFORE UPDATE ON affiliate_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversions_updated_at ON conversions;
CREATE TRIGGER update_conversions_updated_at
  BEFORE UPDATE ON conversions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_clicks', (
      SELECT COUNT(*) FROM link_clicks
      WHERE clicked_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'unique_sessions', (
      SELECT COUNT(DISTINCT session_id) FROM link_clicks
      WHERE clicked_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'total_conversions', (
      SELECT COUNT(*) FROM conversions
      WHERE converted_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(commission_earned), 0) FROM conversions
      WHERE converted_at > NOW() - (days_back || ' days')::INTERVAL
      AND status = 'approved'
    ),
    'pending_revenue', (
      SELECT COALESCE(SUM(commission_earned), 0) FROM conversions
      WHERE converted_at > NOW() - (days_back || ' days')::INTERVAL
      AND status = 'pending'
    ),
    'new_subscribers', (
      SELECT COUNT(*) FROM subscribers
      WHERE subscribed_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'conversion_rate', (
      SELECT CASE
        WHEN COUNT(DISTINCT lc.session_id) > 0
        THEN ROUND(COUNT(DISTINCT c.id)::numeric / COUNT(DISTINCT lc.session_id) * 100, 2)
        ELSE 0
      END
      FROM link_clicks lc
      LEFT JOIN conversions c ON c.click_id = lc.id
      WHERE lc.clicked_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'active_links', (
      SELECT COUNT(*) FROM affiliate_links WHERE active = true
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;

-- ============================================================
-- SEED DATA (Sample Affiliate Links)
-- ============================================================

-- Insert sample affiliate links (run separately after schema creation)
INSERT INTO affiliate_links (slug, partner_name, destination_url, category, market, commission_type, commission_value, network, description) VALUES
  ('jasper-ai', 'Jasper AI', 'https://jasper.ai?ref=smartfinpro', 'ai-tools', 'us', 'recurring', 30.00, 'partnerstack', 'AI writing assistant for content creation'),
  ('copy-ai', 'Copy.ai', 'https://copy.ai?ref=smartfinpro', 'ai-tools', 'us', 'recurring', 25.00, 'partnerstack', 'AI copywriting tool'),
  ('nordvpn-business', 'NordVPN Business', 'https://nordvpn.com/business?ref=smartfinpro', 'cybersecurity', 'us', 'cpa', 40.00, 'cj', 'Enterprise VPN solution'),
  ('perimeter-81', 'Perimeter 81', 'https://perimeter81.com?ref=smartfinpro', 'cybersecurity', 'us', 'cpa', 50.00, 'partnerstack', 'Zero trust network security'),
  ('sofi-personal-loans', 'SoFi Personal Loans', 'https://sofi.com/personal-loans?ref=smartfinpro', 'personal-finance', 'us', 'cpa', 150.00, 'financeads', 'Personal loans with no fees'),
  ('interactive-brokers', 'Interactive Brokers', 'https://interactivebrokers.com?ref=smartfinpro', 'trading', 'us', 'cpa', 200.00, 'direct', 'Professional trading platform'),
  ('etoro', 'eToro', 'https://etoro.com?ref=smartfinpro', 'trading', 'us', 'cpa', 100.00, 'cj', 'Social trading platform'),
  ('ig-uk', 'IG', 'https://ig.com/uk?ref=smartfinpro', 'trading', 'uk', 'cpa', 150.00, 'awin', 'UK trading platform'),
  ('hargreaves-lansdown', 'Hargreaves Lansdown', 'https://hl.co.uk?ref=smartfinpro', 'trading', 'uk', 'cpa', 100.00, 'awin', 'UK investment platform'),
  ('starling-business', 'Starling Business', 'https://starlingbank.com/business?ref=smartfinpro', 'business-banking', 'uk', 'cpa', 75.00, 'awin', 'Free UK business banking'),
  ('tide', 'Tide', 'https://tide.co?ref=smartfinpro', 'business-banking', 'uk', 'cpa', 50.00, 'awin', 'Business banking for freelancers')
ON CONFLICT (slug) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('site_name', '"SmartFinPro"', 'Site name'),
  ('default_market', '"us"', 'Default market for new visitors'),
  ('analytics_enabled', 'true', 'Enable analytics tracking'),
  ('newsletter_double_optin', 'true', 'Require email confirmation'),
  ('conversion_window_days', '30', 'Days to attribute conversions')
ON CONFLICT (key) DO NOTHING;
