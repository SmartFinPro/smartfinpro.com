-- ============================================================
-- Migration: Backlinks table for Content Hub BL column
-- Stores external + internal backlinks per target page.
-- Sources: GSC CSV import, internal MDX scan, manual entry.
-- ============================================================

CREATE TABLE IF NOT EXISTS backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target page on smartfinpro.com (normalized path, e.g. "/uk/trading/etoro-review")
  target_url TEXT NOT NULL,

  -- Source of the backlink
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,

  -- Link metadata
  anchor_text TEXT DEFAULT '',
  link_type TEXT NOT NULL DEFAULT 'external',
  rel_attributes TEXT DEFAULT '',

  -- Tracking
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_lost BOOLEAN NOT NULL DEFAULT false,

  -- Import metadata
  import_source TEXT NOT NULL DEFAULT 'gsc_csv',
  import_batch_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent exact duplicate links
  UNIQUE (target_url, source_url)
);

-- Constraints
ALTER TABLE backlinks
  ADD CONSTRAINT backlinks_link_type_check
  CHECK (link_type IN ('external', 'internal'));

ALTER TABLE backlinks
  ADD CONSTRAINT backlinks_import_source_check
  CHECK (import_source IN ('gsc_csv', 'internal_scan', 'manual'));

-- Primary lookup: all backlinks for a target page
CREATE INDEX IF NOT EXISTS idx_backlinks_target_url ON backlinks (target_url);

-- Domain analysis: which domains link to us most
CREATE INDEX IF NOT EXISTS idx_backlinks_source_domain ON backlinks (source_domain);

-- Temporal queries: new/lost tracking
CREATE INDEX IF NOT EXISTS idx_backlinks_last_seen ON backlinks (last_seen_at);

-- Lost links filter
CREATE INDEX IF NOT EXISTS idx_backlinks_is_lost ON backlinks (is_lost) WHERE is_lost = true;

-- RLS
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backlinks_service_all" ON backlinks
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "backlinks_anon_read" ON backlinks
  FOR SELECT TO anon USING (true);

CREATE POLICY "backlinks_auth_read" ON backlinks
  FOR SELECT TO authenticated USING (true);

-- Documentation
COMMENT ON TABLE backlinks IS 'Stores backlinks to smartfinpro.com pages from external and internal sources';
COMMENT ON COLUMN backlinks.target_url IS 'Normalized path on smartfinpro.com (e.g. /uk/trading/etoro-review)';
COMMENT ON COLUMN backlinks.source_url IS 'Full URL of the page containing the backlink';
COMMENT ON COLUMN backlinks.source_domain IS 'Extracted domain of the linking page (e.g. forbes.com)';
COMMENT ON COLUMN backlinks.is_lost IS 'True when link existed in previous import but missing from latest';
COMMENT ON COLUMN backlinks.import_batch_id IS 'Groups rows from same CSV upload for rollback';
