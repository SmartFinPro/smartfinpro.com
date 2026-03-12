-- Auto-Genesis Log — Idempotency tracking for automated content generation
-- Prevents re-processing SEO text briefs that have already been converted to MDX

CREATE TABLE IF NOT EXISTS auto_genesis_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Brief identification (unique constraint for idempotency)
  brief_path      TEXT NOT NULL,           -- e.g., "seo texte/us-ai-tools-best-ai-writing-tools-finance"
  brief_hash      VARCHAR(64) NOT NULL,    -- SHA-256 of .md file contents

  -- Derived metadata
  market          VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au')),
  category        VARCHAR(50) NOT NULL,
  keyword         TEXT NOT NULL,
  slug            TEXT,

  -- Execution tracking
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'skipped')),
  genesis_run_id  UUID,

  -- Results
  mdx_path        TEXT,
  word_count      INTEGER,
  indexed         BOOLEAN DEFAULT FALSE,
  error_message   TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- Idempotency: one log entry per brief_path + brief_hash combination
CREATE UNIQUE INDEX idx_auto_genesis_path_hash
  ON auto_genesis_log (brief_path, brief_hash);

-- Fast lookup for pending/failed items
CREATE INDEX idx_auto_genesis_status
  ON auto_genesis_log (status);

-- RLS
ALTER TABLE auto_genesis_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on auto_genesis_log"
  ON auto_genesis_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view auto_genesis_log"
  ON auto_genesis_log FOR SELECT
  TO authenticated
  USING (true);
