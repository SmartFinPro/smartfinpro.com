-- ============================================================
-- Revenue per Page — Add page_slug column + Performance Indexes
-- ============================================================
-- 1. Adds missing page_slug and button_id columns to link_clicks
-- 2. Creates indexes for fast aggregation by page_slug
-- ============================================================

-- Step 1: Add missing columns (safe — IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'link_clicks' AND column_name = 'page_slug'
  ) THEN
    ALTER TABLE link_clicks ADD COLUMN page_slug VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'link_clicks' AND column_name = 'button_id'
  ) THEN
    ALTER TABLE link_clicks ADD COLUMN button_id VARCHAR(100);
  END IF;
END $$;

-- Step 2: Performance indexes for Revenue per Page dashboard
CREATE INDEX IF NOT EXISTS idx_link_clicks_page_slug_clicked_at
  ON link_clicks(page_slug, clicked_at DESC)
  WHERE page_slug IS NOT NULL;

-- Composite index for page_slug + link_id joins
CREATE INDEX IF NOT EXISTS idx_link_clicks_page_slug_link_id
  ON link_clicks(page_slug, link_id)
  WHERE page_slug IS NOT NULL;
