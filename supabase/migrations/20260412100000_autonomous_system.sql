-- ============================================================================
-- Migration: Autonomous Self-Optimizing Revenue System
-- Date: 2026-04-12
-- Description: 5 new tables + ENUMs + RLS + system_settings seeds
--              for insight engine, auto-executor, and feedback loop
-- ============================================================================

-- ── ENUMs (strikte Typisierung, kein freier Text) ──────────────────────────

CREATE TYPE insight_type_enum AS ENUM (
  'content_decay', 'competitor_opportunity', 'ab_winner',
  'revenue_anomaly', 'affiliate_underperformer', 'content_rescue',
  'content_gap', 'revenue_opportunity'
);

CREATE TYPE action_type_enum AS ENUM (
  'deploy_ab_winner', 'boost_content', 'apply_optimization',
  'activate_link', 'deactivate_link', 'queue_genesis',
  'update_facts', 'retrain_bandit'
);

CREATE TYPE insight_status_enum AS ENUM (
  'pending', 'executing', 'completed', 'dismissed', 'failed'
);

CREATE TYPE action_outcome_enum AS ENUM (
  'pending', 'positive', 'neutral', 'negative'
);

CREATE TYPE learning_category_enum AS ENUM (
  'cta_positioning', 'content_freshness', 'affiliate_selection',
  'market_behavior', 'ranking_recovery', 'ab_testing',
  'competitor_response', 'revenue_optimization'
);

-- ── Table: cron_run_audit ──────────────────────────────────────────────────
-- Observability for all cron jobs (new + existing)

CREATE TABLE cron_run_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'error', 'timeout')),
  duration_ms INTEGER,
  processed_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_cra_job ON cron_run_audit (job_name, started_at DESC);

-- ── Table: content_health_scores ───────────────────────────────────────────
-- Unified page health from 5 data sources

CREATE TABLE content_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('us', 'uk', 'ca', 'au')),
  category TEXT,

  -- Individual scores (0.0 – 1.0, strict bounds)
  ranking_score NUMERIC(4,3) DEFAULT 0 CHECK (ranking_score BETWEEN 0 AND 1),
  freshness_score NUMERIC(4,3) DEFAULT 0 CHECK (freshness_score BETWEEN 0 AND 1),
  engagement_score NUMERIC(4,3) DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 1),
  conversion_score NUMERIC(4,3) DEFAULT 0 CHECK (conversion_score BETWEEN 0 AND 1),
  competitor_score NUMERIC(4,3) DEFAULT 0 CHECK (competitor_score BETWEEN 0 AND 1),

  -- Weighted composite score (auto-computed)
  health_score NUMERIC(4,3) GENERATED ALWAYS AS (
    ranking_score * 0.25 +
    freshness_score * 0.15 +
    engagement_score * 0.15 +
    conversion_score * 0.30 +
    competitor_score * 0.15
  ) STORED,

  -- Revenue metrics (NUMERIC for financial precision)
  monthly_revenue NUMERIC(10,2) DEFAULT 0,
  monthly_clicks INTEGER DEFAULT 0 CHECK (monthly_clicks >= 0),
  epc NUMERIC(8,4) DEFAULT 0,

  -- Trend (delta vs previous week)
  health_delta NUMERIC(5,3) DEFAULT 0,
  revenue_delta NUMERIC(10,2) DEFAULT 0,

  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, market)
);

CREATE INDEX idx_chs_health ON content_health_scores (health_score DESC);
CREATE INDEX idx_chs_market ON content_health_scores (market, category);

-- ── Table: insights ────────────────────────────────────────────────────────
-- Prioritized, actionable findings with idempotency

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  insight_type insight_type_enum NOT NULL,
  slug TEXT,
  market TEXT CHECK (market IS NULL OR market IN ('us', 'uk', 'ca', 'au')),
  category TEXT,

  title TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}',
  recommended_action TEXT,
  risk_tier INTEGER NOT NULL DEFAULT 2 CHECK (risk_tier BETWEEN 0 AND 3),

  -- Prioritization (NUMERIC for money values)
  expected_revenue_impact NUMERIC(10,2) DEFAULT 0,
  confidence NUMERIC(4,3) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  priority_score NUMERIC(12,2) GENERATED ALWAYS AS (
    expected_revenue_impact * confidence
  ) STORED,

  -- Status
  status insight_status_enum DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  execution_result JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  CHECK (expires_at > created_at)
);

CREATE INDEX idx_insights_priority ON insights (status, priority_score DESC);
CREATE INDEX idx_insights_type ON insights (insight_type, status);
CREATE INDEX idx_insights_dedupe ON insights (dedupe_key);

-- ── Table: autonomous_actions ──────────────────────────────────────────────
-- Audit log with hashed undo token and idempotency

CREATE TABLE autonomous_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  insight_id UUID REFERENCES insights(id),
  action_type action_type_enum NOT NULL,
  risk_tier INTEGER NOT NULL CHECK (risk_tier BETWEEN 0 AND 3),
  slug TEXT,
  market TEXT,

  -- What was done?
  description TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  rollback_payload JSONB,

  -- Outcome (populated by feedback-loop)
  outcome action_outcome_enum DEFAULT 'pending',
  outcome_metrics JSONB,
  outcome_baseline JSONB,
  measured_at TIMESTAMPTZ,

  -- Undo (token stored as SHA-256 hash, one-time use)
  undo_token_hash TEXT UNIQUE,
  undo_expires_at TIMESTAMPTZ,
  undone_at TIMESTAMPTZ,

  executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_aa_outcome ON autonomous_actions (outcome, executed_at);
CREATE INDEX idx_aa_undo ON autonomous_actions (undo_token_hash)
  WHERE undo_token_hash IS NOT NULL;
CREATE INDEX idx_aa_pending ON autonomous_actions (outcome, executed_at)
  WHERE outcome = 'pending';

-- ── Table: learnings ───────────────────────────────────────────────────────
-- Accumulated system knowledge with strict constraints

CREATE TABLE learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  category learning_category_enum NOT NULL,
  market TEXT CHECK (market IS NULL OR market IN ('us', 'uk', 'ca', 'au')),
  learning TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(4,3) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  sample_size INTEGER DEFAULT 1 CHECK (sample_size >= 1),
  first_observed_at TIMESTAMPTZ DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ DEFAULT now(),
  last_threshold_adjust_at TIMESTAMPTZ,
  contradicted_count INTEGER DEFAULT 0 CHECK (contradicted_count >= 0)
);

CREATE INDEX idx_learnings_cat ON learnings (category, confidence DESC);

-- ── RLS Policies (deny-by-default) ─────────────────────────────────────────

ALTER TABLE cron_run_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;

-- Service Role: Full access (crons + executor)
CREATE POLICY "service_role_full_cra" ON cron_run_audit
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_chs" ON content_health_scores
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_insights" ON insights
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_aa" ON autonomous_actions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_learnings" ON learnings
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated (Dashboard): Read-only
CREATE POLICY "dashboard_read_cra" ON cron_run_audit
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "dashboard_read_chs" ON content_health_scores
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "dashboard_read_insights" ON insights
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "dashboard_read_aa" ON autonomous_actions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "dashboard_read_learnings" ON learnings
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── System Settings Seeds ──────────────────────────────────────────────────

INSERT INTO system_settings (key, value, category) VALUES
  -- Controls (all start conservative/disabled)
  ('auto_executor_enabled', 'false', 'controls'),
  ('feedback_loop_enabled', 'false', 'controls'),
  ('insight_engine_enabled', 'true', 'controls'),
  ('simulation_mode', 'true', 'controls'),
  -- Guardrails
  ('auto_executor_max_tier', '1', 'guardrails'),
  ('auto_executor_daily_budget', '5', 'guardrails'),
  ('undo_window_hours', '24', 'guardrails'),
  ('learning_confidence_threshold', '0.7', 'guardrails'),
  ('max_threshold_adjustment', '0.10', 'guardrails'),
  ('min_samples_for_escalation', '10', 'guardrails'),
  ('min_samples_for_deescalation', '20', 'guardrails'),
  ('threshold_adjust_cooldown_days', '7', 'guardrails')
ON CONFLICT (key) DO NOTHING;
