-- Migration: Set security_invoker=true on offer_funnel_metrics view
--
-- The view was created without security_invoker, making it run with the
-- privileges of the creator (postgres/service_role) rather than the caller.
-- This means RLS policies on the underlying tables were bypassed.
--
-- With security_invoker=true, the view respects the caller's RLS context:
-- - anon: blocked (no SELECT policy on underlying tables)
-- - authenticated: sees only what RLS allows
-- - service_role: full access (bypasses RLS as expected)

ALTER VIEW offer_funnel_metrics SET (security_invoker = true);
