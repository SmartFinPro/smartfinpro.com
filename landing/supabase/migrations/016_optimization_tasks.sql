-- ════════════════════════════════════════════════════════════════
-- Migration 016: AI-Optimization Center — optimization_tasks
--
-- Stores AI-generated page optimization suggestions from the
-- periodic analysis engine. Each task targets a specific slug
-- with a concrete suggestion, an MDX delta patch, and approval
-- status for the one-click execution pipeline.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS optimization_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target page
  slug              TEXT NOT NULL,
  market            VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au')) DEFAULT 'us',
  category          VARCHAR(50),

  -- Optimization type
  task_type         VARCHAR(30) CHECK (task_type IN (
    'underperformer', 'efficiency_gap', 'market_trend', 'cta_wording', 'general'
  )) DEFAULT 'general',

  -- AI-generated content
  observation       TEXT NOT NULL,
  suggestion_text   TEXT NOT NULL,
  delta_code        TEXT,               -- MDX patch / replacement content
  ai_reasoning      TEXT,               -- Full AI reasoning for audit

  -- Performance metrics at time of analysis
  traffic_24h       INTEGER DEFAULT 0,
  emerald_ctr       NUMERIC(6, 3) DEFAULT 0,
  violet_ctr        NUMERIC(6, 3) DEFAULT 0,
  current_cpa       NUMERIC(10, 2) DEFAULT 0,
  potential_uplift  NUMERIC(6, 2) DEFAULT 0,   -- Estimated % revenue increase

  -- Lifecycle
  status            VARCHAR(20) CHECK (status IN (
    'pending', 'approved', 'executing', 'applied', 'failed', 'dismissed'
  )) DEFAULT 'pending',

  -- Analysis interval context
  interval_type     VARCHAR(20) CHECK (interval_type IN (
    'weekly', 'biweekly', 'monthly', 'manual'
  )) DEFAULT 'weekly',

  -- Execution tracking
  applied_at        TIMESTAMPTZ,
  indexed_at        TIMESTAMPTZ,

  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index: pending tasks for dashboard display
CREATE INDEX IF NOT EXISTS idx_optimization_tasks_status
  ON optimization_tasks (status, created_at DESC);

-- Index: lookup by slug for history
CREATE INDEX IF NOT EXISTS idx_optimization_tasks_slug
  ON optimization_tasks (slug, market);

-- Index: interval-based queries
CREATE INDEX IF NOT EXISTS idx_optimization_tasks_interval
  ON optimization_tasks (interval_type, status);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE optimization_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on optimization_tasks"
  ON optimization_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view optimization_tasks"
  ON optimization_tasks
  FOR SELECT
  TO authenticated
  USING (true);
