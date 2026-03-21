-- ============================================================
-- Deploy Logs — Track GitHub Actions deploys in dashboard
-- ============================================================
-- Replaces Telegram notifications with dashboard-native tracking.
-- Populated via POST /api/webhooks/github-deploy from deploy.yml.
-- ============================================================

CREATE TABLE IF NOT EXISTS deploy_logs (
  id              BIGSERIAL PRIMARY KEY,
  commit_sha      VARCHAR(40)   NOT NULL,
  commit_message  TEXT,
  branch          VARCHAR(100)  NOT NULL DEFAULT 'main',
  actor           VARCHAR(100),                          -- GitHub username
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending',  -- pending | success | failed | rolled_back
  health_check    BOOLEAN,                               -- true = passed, false = failed, null = skipped
  rollback        BOOLEAN       NOT NULL DEFAULT false,  -- true if auto-rollback was triggered
  duration_s      INTEGER,                               -- total deploy duration in seconds
  error_message   TEXT,
  run_id          BIGINT,                                -- GitHub Actions run ID
  run_url         TEXT,                                   -- Full URL to GitHub Actions run
  deployed_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Dashboard queries: latest deploys, filter by status
CREATE INDEX IF NOT EXISTS idx_deploy_logs_deployed_at
  ON deploy_logs (deployed_at DESC);

CREATE INDEX IF NOT EXISTS idx_deploy_logs_status
  ON deploy_logs (status, deployed_at DESC);

-- RLS: service role can write, authenticated can read
ALTER TABLE deploy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deploy_logs_service_all"
  ON deploy_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "deploy_logs_authenticated_read"
  ON deploy_logs FOR SELECT TO authenticated
  USING (true);
