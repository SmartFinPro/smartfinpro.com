-- ============================================================
-- Migration 019: A/B Testing for ComparisonHub
-- Variant A = Profit-First (sort by CPA desc)
-- Variant B = Trust-First  (sort by user rating desc)
-- ============================================================

-- Core stats table — one row per hub_id × variant
CREATE TABLE IF NOT EXISTS ab_test_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id TEXT NOT NULL,             -- e.g. "trading__us", "personal-finance__uk"
  variant CHAR(1) NOT NULL CHECK (variant IN ('A', 'B')),
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  winner_declared BOOLEAN NOT NULL DEFAULT FALSE,
  winner_declared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (hub_id, variant)
);

-- Granular event log for detailed analysis
CREATE TABLE IF NOT EXISTS ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id TEXT NOT NULL,
  variant CHAR(1) NOT NULL CHECK (variant IN ('A', 'B')),
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  provider_name TEXT,               -- which partner was clicked (null for impressions)
  session_id TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Winner log — persists when a test is concluded
CREATE TABLE IF NOT EXISTS ab_test_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id TEXT NOT NULL,
  winning_variant CHAR(1) NOT NULL CHECK (winning_variant IN ('A', 'B')),
  variant_a_cr NUMERIC(6, 3),       -- conversion rate %
  variant_b_cr NUMERIC(6, 3),
  variant_a_impressions INT,
  variant_b_impressions INT,
  variant_a_clicks INT,
  variant_b_clicks INT,
  lift_percent NUMERIC(6, 2),       -- % improvement winner over loser
  confidence NUMERIC(5, 2),         -- statistical confidence %
  declared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_stats_hub ON ab_test_stats (hub_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_hub ON ab_test_events (hub_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_events_type ON ab_test_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_winners_hub ON ab_test_winners (hub_id, declared_at DESC);

-- Seed initial rows for each category × market combo
-- (ensures upsert-safe incrementing)
DO $$
DECLARE
  m TEXT;
  c TEXT;
  hid TEXT;
BEGIN
  FOR m IN SELECT unnest(ARRAY['us', 'uk', 'ca', 'au']) LOOP
    FOR c IN SELECT unnest(ARRAY['ai-tools', 'cybersecurity', 'trading', 'forex', 'personal-finance', 'business-banking']) LOOP
      hid := c || '__' || m;
      INSERT INTO ab_test_stats (hub_id, variant) VALUES (hid, 'A') ON CONFLICT DO NOTHING;
      INSERT INTO ab_test_stats (hub_id, variant) VALUES (hid, 'B') ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Atomic increment function — prevents race conditions
CREATE OR REPLACE FUNCTION increment_ab_stat(
  p_hub_id TEXT,
  p_variant CHAR(1),
  p_field TEXT  -- 'impressions' or 'clicks'
)
RETURNS VOID AS $$
BEGIN
  IF p_field = 'impressions' THEN
    UPDATE ab_test_stats
       SET impressions = impressions + 1,
           updated_at = NOW()
     WHERE hub_id = p_hub_id AND variant = p_variant;
  ELSIF p_field = 'clicks' THEN
    UPDATE ab_test_stats
       SET clicks = clicks + 1,
           updated_at = NOW()
     WHERE hub_id = p_hub_id AND variant = p_variant;
  END IF;

  -- If no row updated, insert one (handles missing seed rows)
  IF NOT FOUND THEN
    INSERT INTO ab_test_stats (hub_id, variant, impressions, clicks)
    VALUES (
      p_hub_id,
      p_variant,
      CASE WHEN p_field = 'impressions' THEN 1 ELSE 0 END,
      CASE WHEN p_field = 'clicks' THEN 1 ELSE 0 END
    )
    ON CONFLICT (hub_id, variant) DO UPDATE SET
      impressions = ab_test_stats.impressions + CASE WHEN p_field = 'impressions' THEN 1 ELSE 0 END,
      clicks = ab_test_stats.clicks + CASE WHEN p_field = 'clicks' THEN 1 ELSE 0 END,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS: Allow anon read, service role full access
ALTER TABLE ab_test_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY ab_stats_read ON ab_test_stats FOR SELECT USING (true);
CREATE POLICY ab_stats_service ON ab_test_stats FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY ab_events_read ON ab_test_events FOR SELECT USING (true);
CREATE POLICY ab_events_service ON ab_test_events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY ab_winners_read ON ab_test_winners FOR SELECT USING (true);
CREATE POLICY ab_winners_service ON ab_test_winners FOR ALL USING (true) WITH CHECK (true);
