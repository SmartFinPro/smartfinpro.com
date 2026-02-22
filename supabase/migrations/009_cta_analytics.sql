-- ============================================================
-- Migration 009: CTA Analytics Table
-- Tracks granular CTA button clicks with provider + variant info
-- ============================================================

CREATE TABLE IF NOT EXISTS cta_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clicked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Page context
  slug VARCHAR(255) NOT NULL,           -- e.g. '/personal-finance/best-robo-advisors'
  market VARCHAR(10) NOT NULL DEFAULT 'us'
    CHECK (market IN ('us', 'uk', 'ca', 'au')),

  -- CTA context
  provider VARCHAR(100) NOT NULL,       -- e.g. 'Wealthfront', 'Schwab Intelligent'
  variant VARCHAR(30) NOT NULL           -- 'emerald-shimmer' or 'violet-pill'
    CHECK (variant IN ('emerald-shimmer', 'violet-pill')),

  -- Session & device (lightweight, no PII)
  session_id VARCHAR(64),
  device_type VARCHAR(10) CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  ip_hash VARCHAR(16)                    -- SHA-256 truncated, GDPR-safe
);

-- Performance indexes
CREATE INDEX idx_cta_analytics_slug ON cta_analytics (slug);
CREATE INDEX idx_cta_analytics_provider ON cta_analytics (provider);
CREATE INDEX idx_cta_analytics_variant ON cta_analytics (variant);
CREATE INDEX idx_cta_analytics_clicked_at ON cta_analytics (clicked_at DESC);
CREATE INDEX idx_cta_analytics_market ON cta_analytics (market);

-- Composite index for dashboard queries (slug + provider + variant)
CREATE INDEX idx_cta_analytics_slug_provider ON cta_analytics (slug, provider, variant);

-- Enable Row Level Security
ALTER TABLE cta_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: service role can insert (server actions)
CREATE POLICY "Service role can insert cta_analytics"
  ON cta_analytics FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: service role can read (dashboard queries)
CREATE POLICY "Service role can read cta_analytics"
  ON cta_analytics FOR SELECT
  TO service_role
  USING (true);

-- Policy: anon can insert (for client-side tracking fallback)
CREATE POLICY "Anon can insert cta_analytics"
  ON cta_analytics FOR INSERT
  TO anon
  WITH CHECK (true);
