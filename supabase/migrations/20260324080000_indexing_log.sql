-- Migration: indexing_log table
-- Tracks which URLs have been successfully submitted to Google Indexing API
-- Prevents re-submission and enables "bereits eingereicht" counter in dashboard

CREATE TABLE IF NOT EXISTS indexing_log (
  id            BIGSERIAL PRIMARY KEY,
  url           TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'success',
  message       TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast duplicate-check queries
CREATE INDEX IF NOT EXISTS indexing_log_url_status_idx
  ON indexing_log (url, status);

CREATE INDEX IF NOT EXISTS indexing_log_submitted_at_idx
  ON indexing_log (submitted_at DESC);

-- RLS
ALTER TABLE indexing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON indexing_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
