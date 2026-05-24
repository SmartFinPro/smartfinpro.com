-- Backfill: every legacy 'completed' becomes 'success' (canonical).
UPDATE cron_logs
SET status = 'success'
WHERE status = 'completed';

-- Add CHECK constraint to enforce the canonical enum going forward.
ALTER TABLE cron_logs
  DROP CONSTRAINT IF EXISTS cron_logs_status_check;

ALTER TABLE cron_logs
  ADD CONSTRAINT cron_logs_status_check
  CHECK (status IN ('success', 'error', 'partial', 'skipped'));
