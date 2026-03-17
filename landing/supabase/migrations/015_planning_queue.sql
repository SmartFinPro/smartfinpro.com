-- ════════════════════════════════════════════════════════════════
-- Migration 015: Self-Planning Loop — planning_queue
--
-- Stores AI-generated content plans from analyzeAndPlanNextDay().
-- The Daily Digest presents these as "tomorrow's content plan",
-- and the Telegram approve button triggers sequential execution.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS planning_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content target
  keyword         TEXT NOT NULL,
  market          VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au')) DEFAULT 'us',
  category        VARCHAR(50) NOT NULL,

  -- AI reasoning
  predicted_cpa   NUMERIC(10, 2) DEFAULT 0,
  reason          TEXT,
  opportunity_score INTEGER DEFAULT 0,
  source_slug     TEXT,               -- which performing slug inspired this suggestion

  -- Lifecycle
  status          VARCHAR(20) CHECK (status IN (
    'planned', 'approved', 'executing', 'completed', 'failed', 'skipped'
  )) DEFAULT 'planned',

  -- Execution link
  genesis_run_id  UUID REFERENCES genesis_pipeline_runs(id),

  -- Digest reference (which daily digest proposed this)
  digest_date     DATE DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  approved_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- Index: fast lookup for pending plans by date
CREATE INDEX IF NOT EXISTS idx_planning_queue_status_date
  ON planning_queue (status, digest_date DESC);

-- Index: prevent duplicate keywords per market
CREATE INDEX IF NOT EXISTS idx_planning_queue_keyword_market
  ON planning_queue (keyword, market);

-- Index: link back to genesis runs
CREATE INDEX IF NOT EXISTS idx_planning_queue_genesis_run
  ON planning_queue (genesis_run_id)
  WHERE genesis_run_id IS NOT NULL;

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE planning_queue ENABLE ROW LEVEL SECURITY;

-- Service role: full access (cron jobs + server actions)
CREATE POLICY "Service role full access on planning_queue"
  ON planning_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: read-only (dashboard)
CREATE POLICY "Authenticated users can view planning_queue"
  ON planning_queue
  FOR SELECT
  TO authenticated
  USING (true);
