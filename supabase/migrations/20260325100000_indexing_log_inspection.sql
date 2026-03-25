-- Add URL Inspection API status columns to indexing_log
-- Tracks whether submitted URLs are actually indexed by Google

ALTER TABLE indexing_log
  ADD COLUMN IF NOT EXISTS indexed_status TEXT,
  ADD COLUMN IF NOT EXISTS indexed_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS indexing_log_indexed_status_idx
  ON indexing_log (indexed_status);
