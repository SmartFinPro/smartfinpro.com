-- supabase/migrations/20260417220000_create_leak_scanner_results.sql
-- Money Leak Scanner — persists scan results + email capture.
-- Referenced by: app/api/tools/money-leak/scan/route.ts + unlock/route.ts

CREATE TABLE IF NOT EXISTS leak_scanner_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Client-supplied session key (idempotency + revisit tracking)
  session_id TEXT NOT NULL,

  -- Scan inputs
  market TEXT NOT NULL CHECK (market IN ('us', 'uk', 'ca', 'au')),
  monthly_income NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  expenses JSONB NOT NULL,
  lifestyle JSONB NOT NULL,

  -- Scan outputs (computed by lib/money-leak/score-engine)
  total_monthly_leak NUMERIC(12, 2) NOT NULL,
  total_annual_leak NUMERIC(12, 2) NOT NULL,
  categories JSONB NOT NULL,
  top_leaks JSONB NOT NULL,
  overall_severity TEXT NOT NULL CHECK (overall_severity IN ('low', 'moderate', 'high', 'severe')),
  recommended_products JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Privacy-preserving request metadata
  user_agent TEXT,
  ip_hash TEXT,

  -- Email capture (set by /unlock route)
  email TEXT,
  email_captured_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leak_scanner_results_session_idx
  ON leak_scanner_results (session_id);

CREATE INDEX IF NOT EXISTS leak_scanner_results_market_created_idx
  ON leak_scanner_results (market, created_at DESC);

CREATE INDEX IF NOT EXISTS leak_scanner_results_email_captured_idx
  ON leak_scanner_results (email_captured_at)
  WHERE email_captured_at IS NOT NULL;

-- RLS: service role only. Public writes/reads go through the API routes
-- which use the service client (RLS bypassed there).
ALTER TABLE leak_scanner_results ENABLE ROW LEVEL SECURITY;

-- Deny-all default (no policies = no access for authenticated/anon roles)
-- Service role bypasses RLS, so API routes still work.
