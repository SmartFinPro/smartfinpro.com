-- ============================================================
-- Migration: conversion_events — S2S Postback Event Graph
--
-- Tracks the full lifecycle of each click_id through the
-- affiliate funnel: Click → Registration → KYC → FTD → Approved → Reversed.
--
-- This is the foundation for the Closed-Loop Conversion Engine (P1).
-- The existing `conversions` table remains the financial summary;
-- this table captures every intermediate event chronologically.
-- ============================================================

CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Attribution (links to link_clicks.click_id)
  click_id VARCHAR(36) NOT NULL,
  link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,

  -- Event Stage
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
    'registration',
    'kyc_submitted',
    'kyc_approved',
    'kyc_rejected',
    'ftd',
    'deposit',
    'qualified',
    'approved',
    'rejected',
    'reversed'
  )),
  event_value DECIMAL(12,2),
  event_currency VARCHAR(3) DEFAULT 'USD',

  -- Network Reference
  network VARCHAR(50),
  network_event_id VARCHAR(255),

  -- Metadata (network-specific raw data)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  occurred_at TIMESTAMPTZ,            -- When the event happened at the network
  received_at TIMESTAMPTZ DEFAULT NOW() -- When we received the postback
);

-- Dedup index: same click + same event type + same network event ID = skip
CREATE UNIQUE INDEX idx_ce_dedup
  ON conversion_events (click_id, event_type, COALESCE(network_event_id, ''))
  WHERE network_event_id IS NOT NULL OR network_event_id IS NULL;

-- Query indexes
CREATE INDEX idx_ce_click_id ON conversion_events(click_id);
CREATE INDEX idx_ce_event_type ON conversion_events(event_type);
CREATE INDEX idx_ce_received_at ON conversion_events(received_at DESC);
CREATE INDEX idx_ce_link_id ON conversion_events(link_id) WHERE link_id IS NOT NULL;
CREATE INDEX idx_ce_network ON conversion_events(network) WHERE network IS NOT NULL;

-- RLS
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

-- Service role: full CRUD (dashboard, sync-service, postback-service)
CREATE POLICY "Service role full access"
  ON conversion_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Anon: INSERT only (postback endpoint uses anon key with token auth)
CREATE POLICY "Anon insert via postback"
  ON conversion_events FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated: SELECT only (dashboard reads)
CREATE POLICY "Authenticated read access"
  ON conversion_events FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- Aggregated funnel view for dashboard queries
-- ============================================================
CREATE OR REPLACE VIEW offer_funnel_metrics AS
SELECT
  al.partner_name,
  al.market,
  al.category,
  COUNT(DISTINCT lc.click_id) AS total_clicks,
  COUNT(DISTINCT CASE WHEN ce.event_type = 'registration' THEN ce.click_id END) AS registrations,
  COUNT(DISTINCT CASE WHEN ce.event_type = 'kyc_submitted' THEN ce.click_id END) AS kyc_submitted,
  COUNT(DISTINCT CASE WHEN ce.event_type = 'kyc_approved' THEN ce.click_id END) AS kyc_approved,
  COUNT(DISTINCT CASE WHEN ce.event_type = 'ftd' THEN ce.click_id END) AS ftds,
  COUNT(DISTINCT CASE WHEN ce.event_type = 'approved' THEN ce.click_id END) AS approved,
  COUNT(DISTINCT CASE WHEN ce.event_type = 'reversed' THEN ce.click_id END) AS reversals,
  COALESCE(SUM(CASE WHEN ce.event_type IN ('approved', 'ftd') THEN ce.event_value END), 0) AS gross_revenue,
  COALESCE(SUM(CASE WHEN ce.event_type = 'reversed' THEN ce.event_value END), 0) AS reversed_revenue
FROM affiliate_links al
LEFT JOIN link_clicks lc ON lc.link_id = al.id
LEFT JOIN conversion_events ce ON ce.click_id = lc.click_id
WHERE al.active = true
GROUP BY al.partner_name, al.market, al.category;

-- Grant SELECT on view to authenticated users
GRANT SELECT ON offer_funnel_metrics TO authenticated;
GRANT SELECT ON offer_funnel_metrics TO service_role;
