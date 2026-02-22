-- ============================================================
-- Migration 006: Content Overrides (Freshness Boost)
--
-- Stores freshness-boost overrides per slug. Queried at build
-- time to patch MDX modifiedDate → triggers fresh lastmod in
-- sitemap & Schema.org dateModified without touching .mdx files.
--
-- Usage:
--   INSERT INTO content_overrides (slug, reason)
--   VALUES ('/uk/trading/etoro-review', 'Ranking drop detected');
-- ============================================================

CREATE TABLE IF NOT EXISTS content_overrides (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT        NOT NULL,
  boost_date  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason      TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one active override per slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_overrides_slug
  ON content_overrides (slug);

-- Fast lookups by boost_date (for build-time batch query)
CREATE INDEX IF NOT EXISTS idx_content_overrides_boost_date
  ON content_overrides (boost_date DESC);

-- RLS
ALTER TABLE content_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to content_overrides"
  ON content_overrides FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE content_overrides
  IS 'Freshness-boost overrides per slug — queried at build time to patch MDX modifiedDate';
