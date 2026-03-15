-- Migration: Keyword Tracking Table
-- Created: 2026-03-15
-- Purpose: Runtime keyword position tracking synced from Google Search Console
-- Referenced by: lib/actions/ranking.ts (seedMoneyKeywords, getRankingData, syncGSCData)

CREATE TABLE IF NOT EXISTS keyword_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  page TEXT,
  market VARCHAR(4) NOT NULL CHECK (market IN ('us', 'uk', 'ca', 'au')),
  current_position INTEGER NOT NULL DEFAULT 0,
  previous_position INTEGER,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0,
  tracked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(keyword, market)
);

-- Indexes for common query patterns
CREATE INDEX idx_kw_tracking_market ON keyword_tracking(market);
CREATE INDEX idx_kw_tracking_position ON keyword_tracking(current_position);
CREATE INDEX idx_kw_tracking_tracked_at ON keyword_tracking(tracked_at DESC);

-- RLS — service role only (server actions + cron jobs)
ALTER TABLE keyword_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_kw_tracking"
  ON keyword_tracking FOR ALL TO service_role USING (true) WITH CHECK (true);
