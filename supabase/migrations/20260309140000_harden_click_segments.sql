-- 20260309140000_harden_click_segments.sql
-- P0-02 Security: Remove anon INSERT access from click_segments
--
-- WHY: The original migration (20260308120000_click_segments.sql) granted
-- anon users direct INSERT access to click_segments. This table feeds the
-- Thompson Sampling bandit algorithm — any external actor can poison the
-- segment distribution, skewing offer selection and reducing revenue.
--
-- FIX: Drop the "anon_insert" policy. All writes to click_segments are
-- performed exclusively via /api/pre-qual using createServiceClient()
-- (SUPABASE_SERVICE_KEY) which bypasses RLS entirely. Anon access is
-- not needed and creates a data-integrity attack vector.

DROP POLICY IF EXISTS "anon_insert" ON click_segments;

-- Verify the only remaining policy is service_role_full_access
-- (run manually to confirm): SELECT polname FROM pg_policies WHERE tablename = 'click_segments';
