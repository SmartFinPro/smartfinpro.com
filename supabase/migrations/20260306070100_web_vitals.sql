-- Migration: 20260306070100_web_vitals.sql
-- AP-13 Phase 4 — Core Web Vitals Real User Monitoring (RUM)

CREATE TABLE IF NOT EXISTS web_vitals (
  id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT         NOT NULL,          -- 'LCP', 'INP', 'CLS', 'FCP', 'TTFB'
  value       FLOAT        NOT NULL,          -- raw metric value (ms or score)
  rating      TEXT,                           -- 'good', 'needs-improvement', 'poor'
  page_url    TEXT,                           -- pathname (e.g. '/us/trading/best-brokers')
  market      TEXT,                           -- 'us','uk','ca','au','unknown'
  delta       FLOAT,                          -- incremental change since last report
  metric_id   TEXT,                           -- browser-generated unique ID for dedup
  navigation_type TEXT,                       -- 'navigate', 'reload', 'back-forward'
  recorded_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Dedup: one record per browser session metric
CREATE UNIQUE INDEX IF NOT EXISTS idx_wv_metric_id
  ON web_vitals(metric_id)
  WHERE metric_id IS NOT NULL;

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_wv_name_rating
  ON web_vitals(name, rating);
CREATE INDEX IF NOT EXISTS idx_wv_page_url
  ON web_vitals(page_url);
CREATE INDEX IF NOT EXISTS idx_wv_market
  ON web_vitals(market);
CREATE INDEX IF NOT EXISTS idx_wv_recorded_at
  ON web_vitals(recorded_at DESC);

-- RLS
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
  ON web_vitals FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Allow anon INSERT (from browser clients) — no personal data stored
CREATE POLICY "anon_insert"
  ON web_vitals FOR INSERT
  TO anon WITH CHECK (true);

COMMENT ON TABLE web_vitals IS
  'AP-13 Core Web Vitals RUM — LCP, INP, CLS, FCP, TTFB from real users';
COMMENT ON COLUMN web_vitals.rating IS
  'good=green, needs-improvement=amber, poor=red (Google thresholds)';
COMMENT ON COLUMN web_vitals.value IS
  'LCP/INP/FCP/TTFB in milliseconds; CLS as dimensionless score (0–∞)';
