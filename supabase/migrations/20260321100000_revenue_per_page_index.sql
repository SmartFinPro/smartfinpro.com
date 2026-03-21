-- ============================================================
-- Revenue per Page — Performance Index
-- ============================================================
-- Enables fast aggregation of clicks grouped by page_slug
-- for the Revenue Attribution per Page dashboard feature.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_link_clicks_page_slug_clicked_at
  ON link_clicks(page_slug, clicked_at DESC)
  WHERE page_slug IS NOT NULL;

-- Composite index for page_slug + link_id joins
CREATE INDEX IF NOT EXISTS idx_link_clicks_page_slug_link_id
  ON link_clicks(page_slug, link_id)
  WHERE page_slug IS NOT NULL;
