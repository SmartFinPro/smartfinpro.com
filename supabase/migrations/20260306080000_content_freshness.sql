-- ============================================================
-- Content Freshness Tracking
-- Flags MDX articles older than 6 months for editorial review.
-- Populated/updated daily by /api/cron/freshness-check.
-- ============================================================

CREATE TABLE IF NOT EXISTS content_freshness (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT        NOT NULL,               -- e.g. /us/ai-tools/jasper-review
  market          TEXT        NOT NULL,               -- us | uk | ca | au
  category        TEXT        NOT NULL,               -- ai-tools | trading | ...
  file_path       TEXT        NOT NULL UNIQUE,        -- relative path: content/us/ai-tools/jasper-review.mdx
  publish_date    DATE,                               -- frontmatter publishDate
  modified_date   DATE,                               -- frontmatter modifiedDate (if present)
  age_days        INTEGER     GENERATED ALWAYS AS (
    CASE WHEN publish_date IS NOT NULL
    THEN (CURRENT_DATE - publish_date)
    ELSE NULL END
  ) STORED,
  needs_review    BOOLEAN     NOT NULL DEFAULT false,
  flagged_at      TIMESTAMPTZ,                        -- when needs_review was first set true
  reviewed_at     TIMESTAMPTZ,                        -- when editor marked as reviewed
  reviewer_notes  TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_content_freshness_needs_review
  ON content_freshness (needs_review, age_days DESC);

CREATE INDEX IF NOT EXISTS idx_content_freshness_market
  ON content_freshness (market, needs_review);

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_content_freshness_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_freshness_updated_at
  BEFORE UPDATE ON content_freshness
  FOR EACH ROW EXECUTE FUNCTION update_content_freshness_updated_at();

-- RLS: only service role can modify; authenticated users can read
ALTER TABLE content_freshness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_freshness_service_all"
  ON content_freshness
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "content_freshness_authenticated_read"
  ON content_freshness
  FOR SELECT
  TO authenticated
  USING (true);
