-- Migration: 20260306120000_dashboard_perf_indexes.sql
-- Performance indexes for dashboard queries.
--
-- Before: getDashboardStats() ran 13 sequential Supabase awaits → ~8s TTFB.
-- After:  Queries run in parallel (Promise.all) + these indexes let Postgres
--         use index scans instead of full table scans on the three hottest tables.
--
-- Expected impact:
--   link_clicks:            range queries on clicked_at  → 10–100x faster
--   page_views:             range queries on viewed_at   → 10–100x faster
--   conversions:            range queries on converted_at → 10–100x faster
--   affiliate_links:        active=true filter           → minor improvement
--
-- CONCURRENTLY: Does NOT lock the table during creation (safe for production).
-- IF NOT EXISTS: Idempotent — re-running this migration never fails.

-- ── link_clicks ───────────────────────────────────────────────────────────────

-- Primary dashboard range filter (most queries: .gte('clicked_at', rangeStart))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_clicks_clicked_at
  ON link_clicks (clicked_at DESC);

-- Composite: range + link_id together (used in getGlobalMarketIntelligence)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_clicks_link_id_clicked_at
  ON link_clicks (link_id, clicked_at DESC);

-- Country filter (geo stats, market intelligence)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_clicks_country_clicked_at
  ON link_clicks (country_code, clicked_at DESC);

-- ── page_views ────────────────────────────────────────────────────────────────

-- Primary range filter (scroll depth + engagement queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_viewed_at
  ON page_views (viewed_at DESC);

-- Scroll depth queries (.not('scroll_depth', 'is', null).gt('scroll_depth', 0))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_scroll_viewed_at
  ON page_views (viewed_at DESC)
  WHERE scroll_depth IS NOT NULL AND scroll_depth > 0;

-- Engagement / article queries (.not('article_slug', 'is', null))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_views_article_viewed_at
  ON page_views (viewed_at DESC)
  WHERE article_slug IS NOT NULL;

-- ── conversions ───────────────────────────────────────────────────────────────

-- Revenue comparison queries (.gte('converted_at', ...).eq('status', 'approved'))
-- NOTE: conversions table uses converted_at (not created_at)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversions_status_converted_at
  ON conversions (status, converted_at DESC);

-- Link revenue map (getDashboardStats uses all-time approved conversions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversions_link_id_status
  ON conversions (link_id, status);

-- ── affiliate_links ───────────────────────────────────────────────────────────

-- Active link count (.eq('active', true) + count)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_affiliate_links_active
  ON affiliate_links (active)
  WHERE active = true;

-- ── newsletter_subscribers ────────────────────────────────────────────────────
-- NOTE: newsletter_subscribers is a VIEW (not a base table) in this project.
-- Indexes cannot be created on views — skipped intentionally.
-- The underlying base table already has its own indexes via Supabase internals.
