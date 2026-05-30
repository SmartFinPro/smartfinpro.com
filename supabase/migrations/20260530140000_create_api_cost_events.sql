-- Migration: Create api_cost_events table (API Cost Tracking + P&L)
-- Date: 2026-05-30
--
-- Records what we SPEND on external APIs (Anthropic, Serper, Resend) so the
-- dashboard can show real revenue minus API cost = net Profit & Loss.
-- Producer: lib/costs/api-costs.ts → recordApiCost() (fire-and-forget, never
-- throws). Instrumented at the central clients (Claude, Resend) + the two
-- high-volume scheduled Serper paths (ranking, competitors).
--
-- RLS: service role only. All reads/writes go through server actions that use
-- the service client (RLS bypassed there).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS api_cost_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text NOT NULL,            -- 'anthropic' | 'serper' | 'resend'
  operation     text NOT NULL,            -- 'messages.create' | 'search' | 'email.send'
  model         text,
  input_tokens  int,
  output_tokens int,
  units         numeric,                  -- generic count (searches, emails)
  cost_usd      numeric NOT NULL DEFAULT 0,
  source        text,                     -- subsystem, e.g. 'genesis','ranking','nurture'
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Recent-first listing + window aggregation
CREATE INDEX IF NOT EXISTS idx_api_cost_events_created_at
  ON api_cost_events (created_at DESC);

-- Per-provider breakdown over a window
CREATE INDEX IF NOT EXISTS idx_api_cost_events_provider_created_at
  ON api_cost_events (provider, created_at DESC);

-- RLS: deny-all by default; service role bypasses RLS so actions still work.
ALTER TABLE api_cost_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_api_cost_events" ON api_cost_events;
CREATE POLICY "service_role_all_api_cost_events"
  ON api_cost_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
