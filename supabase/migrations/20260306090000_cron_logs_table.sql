-- ============================================================
-- cron_logs — Execution log for all cron jobs
-- Referenced by 7+ cron routes but never formally migrated.
-- This migration creates the table idempotently.
-- ============================================================

CREATE TABLE IF NOT EXISTS cron_logs (
  id          BIGSERIAL    PRIMARY KEY,
  job_name    TEXT         NOT NULL,                       -- 'check-links', 'freshness-check', etc.
  status      TEXT         NOT NULL                        -- 'success' | 'error' | 'partial' | 'completed'
              CHECK (status IN ('success', 'error', 'partial', 'completed', 'running')),
  duration_ms INTEGER,                                     -- wall-clock ms
  error       TEXT,                                        -- error message if status = 'error'
  metadata    JSONB        DEFAULT '{}'::jsonb,            -- job-specific KPIs (healthy, dead, stale …)
  executed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Add metadata column if the table already existed without it
ALTER TABLE cron_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index: latest runs per job (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_executed
  ON cron_logs (job_name, executed_at DESC);

-- Index: recent failures (alert queries)
CREATE INDEX IF NOT EXISTS idx_cron_logs_errors
  ON cron_logs (executed_at DESC)
  WHERE status = 'error';

-- RLS
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cron_logs_service_all"
  ON cron_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "cron_logs_authenticated_read"
  ON cron_logs FOR SELECT
  TO authenticated
  USING (true);

-- Auto-prune: keep only last 90 days to avoid unbounded growth
-- (optional — run manually or via pg_cron if available)
-- DELETE FROM cron_logs WHERE executed_at < NOW() - INTERVAL '90 days';
