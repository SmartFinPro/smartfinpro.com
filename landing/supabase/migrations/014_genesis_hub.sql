-- ============================================================
-- Migration 014: Genesis Pipeline Runs
-- Tracks state for the Auto-Genesis Hub's 4-step pipeline:
-- Research → Generate → Media → Launch
--
-- Each row represents one content creation run,
-- storing outputs from each step as JSONB for flexibility.
-- ============================================================

CREATE TABLE IF NOT EXISTS genesis_pipeline_runs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword            TEXT NOT NULL,
  market             VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au')),
  category           VARCHAR(50) NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'research'
    CHECK (status IN ('research', 'generating', 'media', 'publishing', 'completed', 'failed')),

  -- Step 1: Research outputs
  research_data      JSONB,
  selected_keyword   TEXT,

  -- Step 2: Generation outputs
  brief              JSONB,
  mdx_file_path      TEXT,
  slug               TEXT,
  word_count         INTEGER,
  generation_progress JSONB DEFAULT '{"step":"idle","progress":0,"message":""}',

  -- Step 3: Media outputs
  images             JSONB DEFAULT '[]',

  -- Step 4: Distribution outputs
  affiliate_mappings JSONB DEFAULT '[]',
  indexed_at         TIMESTAMPTZ,
  deployed_at        TIMESTAMPTZ,

  -- Metadata
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  completed_at       TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_genesis_runs_status
  ON genesis_pipeline_runs (status);
CREATE INDEX IF NOT EXISTS idx_genesis_runs_market
  ON genesis_pipeline_runs (market, category);
CREATE INDEX IF NOT EXISTS idx_genesis_runs_created
  ON genesis_pipeline_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_genesis_runs_slug
  ON genesis_pipeline_runs (slug) WHERE slug IS NOT NULL;

-- Enable RLS
ALTER TABLE genesis_pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on genesis_pipeline_runs"
  ON genesis_pipeline_runs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
