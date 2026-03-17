-- ============================================================
-- Migration 007: Competitor Radar
--
-- Three tables for SERP-based competitor intelligence:
--   1. competitor_serp_snapshots — historical SERP analysis + CPS scores
--   2. competitor_alerts — opportunity alerts (competitor drops, gaps)
--   3. competitor_tracked_keywords — expanded keyword list for monitoring
-- ============================================================

-- ── 1. SERP SNAPSHOTS ──

CREATE TABLE IF NOT EXISTS competitor_serp_snapshots (
  id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword             TEXT          NOT NULL,
  market              VARCHAR(4)    NOT NULL CHECK (market IN ('us','uk','ca','au')),
  category            VARCHAR(50)   NOT NULL,

  -- SERP signals (raw from Serper.dev)
  has_ads             BOOLEAN       DEFAULT false,
  ad_count            SMALLINT      DEFAULT 0,
  has_knowledge_graph BOOLEAN       DEFAULT false,
  paa_count           SMALLINT      DEFAULT 0,
  related_count       SMALLINT      DEFAULT 0,

  -- Top 10 organic results
  organic_results     JSONB         NOT NULL DEFAULT '[]',

  -- Computed scores
  cps_score           NUMERIC(4,1)  NOT NULL DEFAULT 0,
  authority_count     SMALLINT      DEFAULT 0,

  -- Own site position
  own_position        SMALLINT,
  own_url             TEXT,

  -- Temporal
  scanned_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comp_snapshots_kw_market
  ON competitor_serp_snapshots (keyword, market);
CREATE INDEX IF NOT EXISTS idx_comp_snapshots_scanned
  ON competitor_serp_snapshots (scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_comp_snapshots_cps
  ON competitor_serp_snapshots (cps_score DESC);
CREATE INDEX IF NOT EXISTS idx_comp_snapshots_market_cat
  ON competitor_serp_snapshots (market, category);

ALTER TABLE competitor_serp_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to competitor_serp_snapshots"
  ON competitor_serp_snapshots FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE competitor_serp_snapshots
  IS 'Historical SERP snapshots with CPS scoring for competitor analysis';


-- ── 2. COMPETITOR ALERTS ──

CREATE TABLE IF NOT EXISTS competitor_alerts (
  id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword             TEXT          NOT NULL,
  market              VARCHAR(4)    NOT NULL,
  category            VARCHAR(50)   NOT NULL,
  alert_type          VARCHAR(30)   NOT NULL CHECK (alert_type IN (
                        'competitor_drop', 'new_gap', 'authority_exit'
                      )),
  severity            VARCHAR(10)   NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),

  -- Context
  competitor_domain   TEXT,
  previous_position   SMALLINT,
  current_position    SMALLINT,
  cps_score           NUMERIC(4,1),
  own_position        SMALLINT,

  -- Action tracking
  dismissed           BOOLEAN       DEFAULT false,
  boost_triggered     BOOLEAN       DEFAULT false,
  slug_to_boost       TEXT,

  -- Temporal
  detected_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at        TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_comp_alerts_undismissed
  ON competitor_alerts (dismissed) WHERE dismissed = false;
CREATE INDEX IF NOT EXISTS idx_comp_alerts_detected
  ON competitor_alerts (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_comp_alerts_severity
  ON competitor_alerts (severity);

ALTER TABLE competitor_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to competitor_alerts"
  ON competitor_alerts FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE competitor_alerts
  IS 'Opportunity alerts when competitors drop or content gaps appear';


-- ── 3. TRACKED KEYWORDS ──

CREATE TABLE IF NOT EXISTS competitor_tracked_keywords (
  id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword             TEXT          NOT NULL,
  market              VARCHAR(4)    NOT NULL,
  category            VARCHAR(50)   NOT NULL,
  source              VARCHAR(30)   NOT NULL DEFAULT 'seed' CHECK (source IN (
                        'seed', 'related_search', 'paa', 'manual'
                      )),
  active              BOOLEAN       DEFAULT true,
  latest_cps          NUMERIC(4,1)  DEFAULT 0,
  latest_own_position SMALLINT,
  last_scanned_at     TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT uq_comp_tracked_kw_market UNIQUE (keyword, market)
);

CREATE INDEX IF NOT EXISTS idx_comp_tracked_active
  ON competitor_tracked_keywords (active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_comp_tracked_market_cat
  ON competitor_tracked_keywords (market, category);

ALTER TABLE competitor_tracked_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to competitor_tracked_keywords"
  ON competitor_tracked_keywords FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE competitor_tracked_keywords
  IS 'Expanded keyword list for competitor monitoring (seed + auto-discovered)';
