-- ============================================================
-- Migration 012: CTR-Based Decision Threshold
-- Adds per-market CTR threshold to spike_alert_settings.
-- Auto-pilot only fires when spike AND CTR > threshold.
-- ============================================================

-- Add CTR threshold column (default 5.0%)
ALTER TABLE spike_alert_settings
  ADD COLUMN IF NOT EXISTS ctr_threshold NUMERIC(5,2) NOT NULL DEFAULT 5.0;

-- Add index on page_views for fast CTR joins (page_path + viewed_at)
CREATE INDEX IF NOT EXISTS idx_page_views_path_viewed
  ON page_views (page_path, viewed_at DESC);

-- Composite index for market + path lookups on page_views
CREATE INDEX IF NOT EXISTS idx_page_views_market_path
  ON page_views (market, page_path);
