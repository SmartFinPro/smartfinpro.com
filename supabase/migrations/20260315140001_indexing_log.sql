-- Migration: Indexing Log Table
-- Created: 2026-03-15
-- Purpose: Track Google Indexing API submissions and results
-- Referenced by: lib/actions/indexing.ts (logIndexingResult)

CREATE TABLE IF NOT EXISTS indexing_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_indexing_log_submitted ON indexing_log(submitted_at DESC);
CREATE INDEX idx_indexing_log_url ON indexing_log(url);
CREATE INDEX idx_indexing_log_status ON indexing_log(status);

-- RLS — service role only (server actions + cron jobs)
ALTER TABLE indexing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_indexing_log"
  ON indexing_log FOR ALL TO service_role USING (true) WITH CHECK (true);
