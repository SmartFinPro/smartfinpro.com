-- Migration: Attribution Watchdog (Phase 1)
-- Date: 2026-07-07
--
-- Detects silent attribution failures (clicks flowing, conversions/revenue
-- not) per provider. Background: 492 clicks → 0 conversions went unnoticed
-- for months (CJ sid bug + missing postback config).
--
-- Deliberately does NOT touch affiliate_links.health_status /
-- last_health_check — those columns are owned by the check-links HTTP
-- health cron. Watchdog state lives in attribution_incidents.
--
-- RLS: service role only (same model as notifications). All reads/writes go
-- through server actions using the service client.
-- Idempotent: safe to re-run.

-- 1) Per-provider override for the expected conversion window.
--    NULL → category default map in lib/attribution/health-score.ts → 14 days.
ALTER TABLE affiliate_links
  ADD COLUMN IF NOT EXISTS expected_conversion_days INTEGER
    CHECK (expected_conversion_days IS NULL OR (expected_conversion_days BETWEEN 1 AND 365));

-- 2) Incident log
CREATE TABLE IF NOT EXISTS attribution_incidents (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider                      text NOT NULL,          -- affiliate_links.partner_name
  network                       varchar(40),
  market                        varchar(10),
  category                      varchar(50),
  incident_type                 text NOT NULL
    CHECK (incident_type IN ('cta_no_go', 'clicks_no_postback', 'postback_no_revenue', 'conversion_stalled')),
  status                        text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'confirmed', 'resolved', 'ignored')),
  detected_at                   timestamptz NOT NULL DEFAULT now(),
  clicks_since_last_conversion  integer NOT NULL DEFAULT 0,
  last_conversion_at            timestamptz,            -- last conversion_events signal (NULL = never)
  health_score                  integer,                -- score at detection time (NULL = n/a)
  suspected_cause               text,                   -- German label set by the watchdog
  revenue_risk_estimate         numeric(12,2),
  -- Snooze: an ignored incident suppresses re-alerting only until this
  -- timestamp, so a real later outage is not silenced forever.
  ignored_until                 timestamptz,
  resolution_note               text,
  resolved_at                   timestamptz,
  metadata                      jsonb NOT NULL DEFAULT '{}',
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

-- Dedupe safety net: at most ONE live (open/confirmed) incident per
-- provider+type. Ignored rows are excluded — their suppression is
-- time-boxed via ignored_until and enforced in code.
CREATE UNIQUE INDEX IF NOT EXISTS uq_attribution_incident_live
  ON attribution_incidents (provider, incident_type)
  WHERE status IN ('open', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_attribution_incidents_status
  ON attribution_incidents (status, detected_at DESC);

ALTER TABLE attribution_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_attribution_incidents" ON attribution_incidents;
CREATE POLICY "service_role_all_attribution_incidents"
  ON attribution_incidents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3) Watchdog settings (category 'watchdog'), never overwrite existing values
INSERT INTO system_settings (key, value, category) VALUES
  ('watchdog_enabled',             'true',  'watchdog'),
  ('watchdog_min_clicks_incident', '50',    'watchdog'),
  ('watchdog_min_clicks_score',    '20',    'watchdog'),
  ('watchdog_assumed_baseline_cr', '0.005', 'watchdog'),
  ('watchdog_baseline_days',       '180',   'watchdog'),
  ('watchdog_recent_days',         '30',    'watchdog'),
  ('watchdog_ignore_snooze_days',  '30',    'watchdog')
ON CONFLICT (key) DO NOTHING;
