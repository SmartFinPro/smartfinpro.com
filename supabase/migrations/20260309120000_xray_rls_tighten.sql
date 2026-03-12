-- supabase/migrations/20260309120000_xray_rls_tighten.sql
-- P0 Fix: Remove overly broad anon access to xray_results.
--
-- Both /api/xray/score (POST) and /api/xray/result/[id] (GET) use
-- createServiceClient() → service_role. Anon never needs direct table access.
-- Leaving anon INSERT/SELECT open bypasses API validation, rate-limits,
-- and exposes session_id + ip_hash + raw inputs to enumeration.

-- ── xray_results: revoke anon access ────────────────────────────────

DROP POLICY IF EXISTS "xr_anon_insert" ON public.xray_results;
DROP POLICY IF EXISTS "xr_anon_select" ON public.xray_results;

-- ── product_profiles: keep anon read (public catalog data, no PII) ──
-- pp_anon_read stays — product profiles contain no sensitive data.
