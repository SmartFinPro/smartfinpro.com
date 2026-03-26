-- ============================================================
-- Migration: 20260326000000_crawl_status.sql
-- Purpose: Crawl Status State Machine for GSC indexing tracking
--
-- Tracks each page's indexing lifecycle:
--   pending → submitted → indexed / failed → cooldown → retry
--
-- Key constraints:
--   - max_attempts = 5 (prevent infinite re-submits)
--   - cooldown_days = 14 (respect Google's crawl budget)
--   - Re-submit only allowed when: attempt_count < max_attempts AND
--     (last_submitted_at IS NULL OR last_submitted_at < now() - cooldown_days)
--
-- Used by:
--   - /api/cron/freshness-check (weekly audit: flags thin content + new submits)
--   - Dashboard → Ranking Tracker (crawl status display)
--   - Future: auto re-submit cron with intelligent backoff
-- ============================================================

-- ── Status enum ───────────────────────────────────────────────
CREATE TYPE crawl_status_state AS ENUM (
  'pending',      -- Known URL, not yet submitted to Indexing API
  'submitted',    -- Submitted via Indexing API or GSC Request Indexing
  'indexed',      -- Confirmed indexed (GSC coverage = "Submitted and indexed")
  'not_indexed',  -- GSC: "Found – currently not indexed" / "Crawled – not indexed"
  'error',        -- Submit attempt failed (network error, API quota exceeded, etc.)
  'cooldown',     -- Max attempts reached or cooldown active — do not retry yet
  'noindex'       -- Page has meta robots=noindex or canonical mismatch — skip indexing
);

-- ── Main state machine table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS crawl_status (
  id                  BIGSERIAL PRIMARY KEY,

  -- Page identification
  page_slug           TEXT        NOT NULL UNIQUE,  -- e.g. "/us/trading/etoro-review"
  market              TEXT        NOT NULL DEFAULT 'us',
  category            TEXT,                         -- e.g. "trading"
  page_type           TEXT        NOT NULL DEFAULT 'review',
  -- Values: 'homepage' | 'pillar' | 'review' | 'tool' | 'static' | 'overview'

  -- Current state
  status              crawl_status_state NOT NULL DEFAULT 'pending',

  -- Submit tracking
  attempt_count       INTEGER     NOT NULL DEFAULT 0,
  max_attempts        INTEGER     NOT NULL DEFAULT 5,
  last_submitted_at   TIMESTAMPTZ,
  next_review_at      TIMESTAMPTZ NOT NULL DEFAULT now(),  -- When to check this URL next

  -- Cooldown: re-submit not allowed before this timestamp
  cooldown_until      TIMESTAMPTZ,
  cooldown_days       INTEGER     NOT NULL DEFAULT 14,

  -- GSC data (populated by GSC API sync)
  gsc_status          TEXT,       -- Raw GSC coverage status string
  gsc_last_checked_at TIMESTAMPTZ,
  gsc_impressions     INTEGER     DEFAULT 0,
  gsc_clicks          INTEGER     DEFAULT 0,

  -- Content quality signals
  word_count          INTEGER,    -- Populated by freshness-check cron
  is_thin_content     BOOLEAN     DEFAULT FALSE,  -- word_count < 1200
  has_canonical       BOOLEAN,
  has_schema          BOOLEAN,

  -- Error tracking
  last_error          TEXT,
  last_error_at       TIMESTAMPTZ,

  -- Meta
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_crawl_status_status ON crawl_status(status);
CREATE INDEX IF NOT EXISTS idx_crawl_status_next_review ON crawl_status(next_review_at);
CREATE INDEX IF NOT EXISTS idx_crawl_status_market_category ON crawl_status(market, category);
CREATE INDEX IF NOT EXISTS idx_crawl_status_not_indexed ON crawl_status(status)
  WHERE status = 'not_indexed';

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_crawl_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crawl_status_updated_at
  BEFORE UPDATE ON crawl_status
  FOR EACH ROW EXECUTE FUNCTION update_crawl_status_updated_at();

-- ── Helper view: URLs ready for re-submission ─────────────────
-- Returns pages that can be submitted: not indexed, attempts remaining,
-- not in cooldown, and due for review.
CREATE OR REPLACE VIEW crawl_status_eligible_for_submit AS
SELECT
  id,
  page_slug,
  market,
  category,
  page_type,
  status,
  attempt_count,
  max_attempts,
  last_submitted_at,
  next_review_at,
  gsc_status,
  word_count,
  is_thin_content
FROM crawl_status
WHERE
  -- Only pages that need indexing
  status IN ('pending', 'not_indexed', 'error')
  -- Must have attempts remaining
  AND attempt_count < max_attempts
  -- Must not be thin content (thin content → fix content first)
  AND (is_thin_content = FALSE OR is_thin_content IS NULL)
  -- Must not be in active cooldown
  AND (cooldown_until IS NULL OR cooldown_until <= now())
  -- Must be due for review
  AND next_review_at <= now()
ORDER BY
  -- Prioritise: pending first, then not_indexed, then errors
  CASE status WHEN 'pending' THEN 0 WHEN 'not_indexed' THEN 1 ELSE 2 END,
  -- Lower attempt count = higher priority (fresher, less likely to be genuinely excluded)
  attempt_count ASC,
  -- Then by most recent GSC update
  gsc_last_checked_at ASC NULLS FIRST;

-- ── Helper view: thin content report ─────────────────────────
CREATE OR REPLACE VIEW crawl_status_thin_content AS
SELECT
  page_slug,
  market,
  category,
  word_count,
  status,
  gsc_impressions,
  gsc_clicks,
  created_at
FROM crawl_status
WHERE is_thin_content = TRUE
ORDER BY word_count ASC;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE crawl_status ENABLE ROW LEVEL SECURITY;

-- Service role (used by server actions and cron jobs) has full access
CREATE POLICY "Service role full access"
  ON crawl_status
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated dashboard users can read (for display in Ranking dashboard)
CREATE POLICY "Authenticated read"
  ON crawl_status
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── Seed initial data from sitemap pages ─────────────────────
-- Pre-populate with all known market homepages and key category pages.
-- The freshness-check cron will fill in the full set of review URLs.
INSERT INTO crawl_status (page_slug, market, category, page_type, status)
VALUES
  -- US homepages + category hubs
  ('/us',                     'us', NULL,              'homepage', 'pending'),
  ('/us/trading',             'us', 'trading',         'pillar',   'pending'),
  ('/us/ai-tools',            'us', 'ai-tools',        'pillar',   'pending'),
  ('/us/cybersecurity',       'us', 'cybersecurity',   'pillar',   'pending'),
  ('/us/personal-finance',    'us', 'personal-finance','pillar',   'pending'),
  ('/us/business-banking',    'us', 'business-banking','pillar',   'pending'),
  -- UK
  ('/uk',                     'uk', NULL,              'homepage', 'pending'),
  ('/uk/trading',             'uk', 'trading',         'pillar',   'pending'),
  ('/uk/personal-finance',    'uk', 'personal-finance','pillar',   'pending'),
  ('/uk/ai-tools',            'uk', 'ai-tools',        'pillar',   'pending'),
  ('/uk/remortgaging/overview','uk','remortgaging',    'overview', 'pending'),
  ('/uk/savings/overview',    'uk', 'savings',         'overview', 'pending'),
  -- AU
  ('/au',                     'au', NULL,              'homepage', 'pending'),
  ('/au/trading',             'au', 'trading',         'pillar',   'pending'),
  ('/au/superannuation/overview','au','superannuation', 'overview','pending'),
  ('/au/savings/overview',    'au', 'savings',         'overview', 'pending'),
  -- CA
  ('/ca',                     'ca', NULL,              'homepage', 'pending'),
  ('/ca/forex',               'ca', 'forex',           'pillar',   'pending'),
  ('/ca/housing/overview',    'ca', 'housing',         'overview', 'pending')
ON CONFLICT (page_slug) DO NOTHING;

-- ── Grant permissions ─────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON crawl_status TO authenticated;
GRANT ALL ON crawl_status TO service_role;
GRANT USAGE, SELECT ON SEQUENCE crawl_status_id_seq TO authenticated, service_role;
