-- Migration: 20260306140000_dashboard_perf_indexes_v2.sql
-- Additional performance indexes for remaining slow dashboard pages.
--
-- Pages addressed:
--   quiz (36s)          → analytics_events: no limit + no index on event_name/occurred_at
--   web-vitals (8.2s)   → web_vitals: range queries on recorded_at + name filter
--   genesis (12s)       → genesis_pipeline_runs: order by created_at DESC
--   planning (9.4s)     → planning_queue: filter on status + order by opportunity_score
--   opportunities (15s) → affiliate_opportunities: order by trust_score + discovered_at
--   ranking (6.5s)      → keyword_tracking: order by current_position ASC
--   compliance (9.5s)   → affiliate_links: range used in link distribution queries
--
-- CONCURRENTLY: Does NOT lock tables (safe for production).
-- IF NOT EXISTS: Idempotent — re-running never fails.

-- ── analytics_events ──────────────────────────────────────────────────────────

-- Quiz page: .in('event_name', [...]).gte('occurred_at', ...)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_name_occurred
  ON analytics_events (event_name, occurred_at DESC);

-- Broad range-only queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_occurred
  ON analytics_events (occurred_at DESC);

-- ── web_vitals ────────────────────────────────────────────────────────────────

-- getMetricSummaries: .gte('recorded_at', since) — all metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_web_vitals_recorded_at
  ON web_vitals (recorded_at DESC);

-- getTimeSeries: .in('name', ['LCP','INP','CLS']).gte('recorded_at', since)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_web_vitals_name_recorded
  ON web_vitals (name, recorded_at DESC);

-- getTopSlowPages: .eq('name','LCP').eq('rating','poor').gte('recorded_at',...)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_web_vitals_name_rating_recorded
  ON web_vitals (name, rating, recorded_at DESC)
  WHERE page_url IS NOT NULL;

-- ── genesis_pipeline_runs ─────────────────────────────────────────────────────

-- getRecentRuns: .order('created_at', desc).limit(10)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_genesis_runs_created_at
  ON genesis_pipeline_runs (created_at DESC);

-- ── planning_queue ────────────────────────────────────────────────────────────

-- getPendingPlans: .in('status', ['planned','approved','executing']).order(opportunity_score desc)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_queue_status_score
  ON planning_queue (status, opportunity_score DESC);

-- digest_date used in OR filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_queue_digest_date
  ON planning_queue (digest_date DESC);

-- ── affiliate_opportunities ───────────────────────────────────────────────────

-- getOpportunities: .order('trust_score', desc).order('discovered_at', desc).limit(200)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_affiliate_opportunities_trust_score
  ON affiliate_opportunities (trust_score DESC, discovered_at DESC);

-- getStats: .eq('status','new'/.eq('status','approved')
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_affiliate_opportunities_status
  ON affiliate_opportunities (status);

-- ── keyword_tracking ──────────────────────────────────────────────────────────
-- NOTE: keyword_tracking table does not exist in this project.
-- The ranking page falls back to Google Search Console API when DB is empty.
-- Skipped intentionally.
