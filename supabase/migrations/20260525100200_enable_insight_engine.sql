-- Migration: Enable insight-engine and autonomous system components
-- Date: 2026-05-25
-- Applied: 2026-05-25 (via Supabase REST API, session smartfinpro-com#3341974b)
--
-- At apply-time live check revealed:
--   • insight_engine_enabled  = already 'true'  → UPDATE is idempotent, no harm
--   • feedback_loop_enabled   = 'false'          → corrected to 'true' (primary fix)
--   • auto_executor_enabled   = 'true'           → unchanged
--   • auto_executor_mode      key does not exist → no-op on the conditional UPDATE below
--
-- The insight-engine cron runs every Sunday 04:00 UTC. content_health_scores.computed_at
-- was stuck at 2026-04-12 because feedback_loop_enabled was false, preventing the
-- loop from persisting learnings and triggering downstream re-computation.
--
-- Note: auto_executor stays in simulation mode (guarded by conditional UPDATE).
--       Enable manually once insights have been reviewed.

UPDATE system_settings
SET value = 'true'
WHERE key = 'insight_engine_enabled';

-- Primary fix: feedback loop was disabled — re-enable so learnings can be persisted
UPDATE system_settings
SET value = 'true'
WHERE key = 'feedback_loop_enabled';

-- Keep auto-executor in simulation mode for safety (only enable after insights validate)
UPDATE system_settings
SET value = 'simulation'
WHERE key = 'auto_executor_mode'
  AND value = 'disabled';
