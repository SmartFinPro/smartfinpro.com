-- ============================================================================
-- Migration: Money Leak Scanner — results table
-- Date: 2026-04-17
-- Description: Captures scan inputs, computed leak breakdown, recommended
--              affiliate products, and email-capture conversions for the
--              /tools/money-leak-scanner interactive lead magnet.
-- ============================================================================

CREATE TABLE IF NOT EXISTS leak_scanner_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  session_id VARCHAR(255) NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('us', 'uk', 'ca', 'au')),

  -- Email capture (NULL until user unlocks full report)
  email TEXT NULL,
  email_captured_at TIMESTAMPTZ NULL,

  -- Raw inputs
  monthly_income NUMERIC(12, 2) NOT NULL,
  currency CHAR(3) NOT NULL,
  expenses JSONB NOT NULL,
  lifestyle JSONB NOT NULL,

  -- Computed results
  total_monthly_leak NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_annual_leak NUMERIC(12, 2) NOT NULL DEFAULT 0,
  categories JSONB NOT NULL,
  top_leaks JSONB NOT NULL,
  overall_severity TEXT NOT NULL CHECK (overall_severity IN ('low', 'medium', 'high', 'critical')),
  recommended_products JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Attribution
  user_clicked_recommendation BOOLEAN DEFAULT FALSE,
  clicked_provider VARCHAR(255) NULL,
  clicked_at TIMESTAMPTZ NULL,

  -- Privacy-respecting client info
  user_agent TEXT NULL,
  ip_hash TEXT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leak_results_market_created
  ON leak_scanner_results (market, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leak_results_email
  ON leak_scanner_results (LOWER(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leak_results_session
  ON leak_scanner_results (session_id);

-- Row Level Security: no client policies — all access via service client
-- (server actions / API routes only).
ALTER TABLE leak_scanner_results ENABLE ROW LEVEL SECURITY;
