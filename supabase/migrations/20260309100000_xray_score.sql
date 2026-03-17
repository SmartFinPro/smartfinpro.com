-- supabase/migrations/20260309100000_xray_score.sql
-- X-Ray Score™ — product profiles for scoring + persisted results for sharing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Product Profiles ──────────────────────────────────────────────────
-- Structured pricing and fit/risk data per product×market.
-- Dashboard-editable; the score engine queries this at computation time.

CREATE TABLE IF NOT EXISTS public.product_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(100) NOT NULL,
  market        VARCHAR(4)   NOT NULL CHECK (market IN ('us','uk','ca','au')),
  category      VARCHAR(50)  NOT NULL,

  -- Pricing (monthly, for annual_cost formula)
  base_price_monthly      DECIMAL(10,2) NOT NULL DEFAULT 0,
  seat_price_monthly      DECIMAL(10,2) NOT NULL DEFAULT 0,
  free_seats              INTEGER       NOT NULL DEFAULT 1,
  usage_overage_monthly   DECIMAL(10,2) NOT NULL DEFAULT 0,
  addon_cost_monthly      DECIMAL(10,2) NOT NULL DEFAULT 0,
  onboarding_hours        DECIMAL(5,1)  NOT NULL DEFAULT 2,

  -- Fit dimensions (0.0 – 1.0, higher = better fit for that persona)
  fit_beginner      DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  fit_advanced      DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  fit_teams         DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  fit_solo          DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  fit_low_cost      DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  fit_feature_rich  DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  fit_compliance    DECIMAL(3,2) NOT NULL DEFAULT 0.50,

  -- Risk dimensions (0.0 – 1.0, higher = more risk)
  compliance_gap  DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  lockin_risk     DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  support_risk    DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  outage_risk     DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  policy_risk     DECIMAL(3,2) NOT NULL DEFAULT 0.10,

  -- Value multiplier (derived from EV data / review quality)
  expected_hours_saved  DECIMAL(5,1) NOT NULL DEFAULT 10,

  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (slug, market)
);

CREATE INDEX IF NOT EXISTS idx_pp_slug_market    ON public.product_profiles (slug, market);
CREATE INDEX IF NOT EXISTS idx_pp_market_category ON public.product_profiles (market, category);

-- ── X-Ray Results ─────────────────────────────────────────────────────
-- Persisted score computations, addressable by short result_id for sharing.

CREATE TABLE IF NOT EXISTS public.xray_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id     VARCHAR(20) NOT NULL UNIQUE,
  session_id    VARCHAR(128),
  slug          VARCHAR(100) NOT NULL,
  market        VARCHAR(4)   NOT NULL CHECK (market IN ('us','uk','ca','au')),
  category      VARCHAR(50)  NOT NULL,

  -- User inputs (flexible JSONB)
  inputs        JSONB NOT NULL DEFAULT '{}',

  -- Computed scores (0–100)
  fit_score     DECIMAL(5,2) NOT NULL,
  cost_score    DECIMAL(5,2) NOT NULL,
  risk_score    DECIMAL(5,2) NOT NULL,
  value_score   DECIMAL(5,2) NOT NULL,
  xray_score    DECIMAL(5,2) NOT NULL,

  -- Derived outputs
  annual_cost     DECIMAL(12,2),
  top_risks       JSONB DEFAULT '[]',
  alternatives    JSONB DEFAULT '[]',
  decision_label  VARCHAR(50),

  -- Meta
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash     VARCHAR(16)
);

CREATE INDEX IF NOT EXISTS idx_xr_result_id       ON public.xray_results (result_id);
CREATE INDEX IF NOT EXISTS idx_xr_slug_market     ON public.xray_results (slug, market);
CREATE INDEX IF NOT EXISTS idx_xr_created         ON public.xray_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xr_session         ON public.xray_results (session_id);

-- ── RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.product_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_service_role_all" ON public.product_profiles;
CREATE POLICY "pp_service_role_all"
  ON public.product_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pp_authenticated_read" ON public.product_profiles;
CREATE POLICY "pp_authenticated_read"
  ON public.product_profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "pp_anon_read" ON public.product_profiles;
CREATE POLICY "pp_anon_read"
  ON public.product_profiles FOR SELECT TO anon
  USING (true);


ALTER TABLE public.xray_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xr_service_role_all" ON public.xray_results;
CREATE POLICY "xr_service_role_all"
  ON public.xray_results FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "xr_authenticated_read" ON public.xray_results;
CREATE POLICY "xr_authenticated_read"
  ON public.xray_results FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "xr_anon_insert" ON public.xray_results;
CREATE POLICY "xr_anon_insert"
  ON public.xray_results FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "xr_anon_select" ON public.xray_results;
CREATE POLICY "xr_anon_select"
  ON public.xray_results FOR SELECT TO anon
  USING (true);
