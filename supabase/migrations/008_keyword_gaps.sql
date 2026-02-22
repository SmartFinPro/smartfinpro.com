-- ============================================================
-- 008 — Keyword Gap Analysis Tables
-- ============================================================
-- Stores gap analysis results from domain-vs-domain comparison,
-- shadow-draft tracking, and daily scan limits.
-- ============================================================

-- ── Gap Analysis Results ─────────────────────────────────────
-- Each row = one keyword gap between a competitor and SmartFinPro.
CREATE TABLE IF NOT EXISTS keyword_gap_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain   TEXT NOT NULL,
  market              VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au')),
  keyword             TEXT NOT NULL,
  category            VARCHAR(50),
  competitor_position SMALLINT,
  own_position        SMALLINT,          -- NULL = not ranking
  gap                 SMALLINT,          -- competitor_pos - own_pos (negative = they're ahead)
  cps_score           NUMERIC(4,1) DEFAULT 0,
  opportunity_score   NUMERIC(4,1) DEFAULT 0, -- 0-100 composite opportunity
  gap_type            VARCHAR(20) CHECK (gap_type IN ('missing', 'behind', 'ahead', 'tied')),
  serp_snapshot_id    UUID,              -- optional FK to competitor_serp_snapshots
  scanned_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_domain, keyword, market)
);

CREATE INDEX IF NOT EXISTS idx_gap_results_domain_market
  ON keyword_gap_results (competitor_domain, market);
CREATE INDEX IF NOT EXISTS idx_gap_results_opportunity
  ON keyword_gap_results (opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_gap_results_gap_type
  ON keyword_gap_results (gap_type);
CREATE INDEX IF NOT EXISTS idx_gap_results_scanned
  ON keyword_gap_results (scanned_at DESC);

-- ── Shadow Drafts ────────────────────────────────────────────
-- Tracks MDX draft skeletons generated from gap analysis.
CREATE TABLE IF NOT EXISTS keyword_gap_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword         TEXT NOT NULL,
  market          VARCHAR(4) CHECK (market IN ('us', 'uk', 'ca', 'au')),
  category        VARCHAR(50),
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  status          VARCHAR(20) CHECK (status IN ('draft', 'published', 'discarded')) DEFAULT 'draft',
  competitor_domain TEXT,
  opportunity_score NUMERIC(4,1) DEFAULT 0,
  mdx_skeleton    TEXT,                 -- generated MDX template
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  published_at    TIMESTAMPTZ,
  UNIQUE(keyword, market)
);

CREATE INDEX IF NOT EXISTS idx_gap_drafts_status
  ON keyword_gap_drafts (status);
CREATE INDEX IF NOT EXISTS idx_gap_drafts_market
  ON keyword_gap_drafts (market, category);

-- ── Daily Scan Limits ────────────────────────────────────────
-- Tracks how many gap scans were used per day (Serper API budget).
CREATE TABLE IF NOT EXISTS gap_scan_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  scans_used  INTEGER NOT NULL DEFAULT 0,
  max_scans   INTEGER NOT NULL DEFAULT 50,   -- daily budget
  UNIQUE(scan_date)
);

CREATE INDEX IF NOT EXISTS idx_gap_scan_date
  ON gap_scan_usage (scan_date DESC);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE keyword_gap_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_gap_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_scan_usage ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY "Service role full access on keyword_gap_results"
  ON keyword_gap_results FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on keyword_gap_drafts"
  ON keyword_gap_drafts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on gap_scan_usage"
  ON gap_scan_usage FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users: read + write (dashboard)
CREATE POLICY "Authenticated read/write keyword_gap_results"
  ON keyword_gap_results FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read/write keyword_gap_drafts"
  ON keyword_gap_drafts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read/write gap_scan_usage"
  ON gap_scan_usage FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
