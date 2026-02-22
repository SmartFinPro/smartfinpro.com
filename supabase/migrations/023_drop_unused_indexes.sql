-- ============================================================
-- Migration 023: Performance Advisor Fixes (28 issues total)
-- Drops 25 unused indexes + adds 2 missing FK indexes
-- Generated from Supabase Performance Advisor 2026-02-18
-- ============================================================

BEGIN;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SECTION 1: Add missing foreign key indexes                  ║
-- ║  conversions.link_id and link_clicks.link_id need FK indexes ║
-- ╚══════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_conversions_link_id
  ON conversions (link_id);

CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id
  ON link_clicks (link_id);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SECTION 2: Drop unused indexes                             ║
-- ║  All flagged as never used by pg_stat_user_indexes           ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── cta_analytics (5 unused — only clicked_at is still used) ─
DROP INDEX IF EXISTS idx_cta_analytics_slug;
DROP INDEX IF EXISTS idx_cta_analytics_provider;
DROP INDEX IF EXISTS idx_cta_analytics_variant;
DROP INDEX IF EXISTS idx_cta_analytics_market;
DROP INDEX IF EXISTS idx_cta_analytics_slug_provider;

-- ── page_views (2 unused) ────────────────────────────────────
DROP INDEX IF EXISTS idx_page_views_market;
DROP INDEX IF EXISTS idx_page_views_path_viewed;

-- ── leads (4 unused) ─────────────────────────────────────────
DROP INDEX IF EXISTS idx_leads_created_at;
DROP INDEX IF EXISTS idx_leads_email;
DROP INDEX IF EXISTS idx_leads_status;
DROP INDEX IF EXISTS idx_leads_market;

-- ── autopilot_cooldowns ──────────────────────────────────────
DROP INDEX IF EXISTS idx_autopilot_cooldowns_last_triggered;

-- ── partner_metadata ─────────────────────────────────────────
DROP INDEX IF EXISTS idx_partner_meta_featured;

-- ── content_overrides ────────────────────────────────────────
DROP INDEX IF EXISTS idx_content_overrides_boost_date;

-- ── affiliate_rates ──────────────────────────────────────────
DROP INDEX IF EXISTS idx_affiliate_rates_active;

-- ── genesis_pipeline_runs (2 unused) ─────────────────────────
DROP INDEX IF EXISTS idx_genesis_runs_market;
DROP INDEX IF EXISTS idx_genesis_runs_slug;

-- ── planning_queue ───────────────────────────────────────────
DROP INDEX IF EXISTS idx_planning_queue_keyword_market;

-- ── optimization_tasks ───────────────────────────────────────
DROP INDEX IF EXISTS idx_optimization_tasks_interval;

-- ── ab_test_events (2 unused) ────────────────────────────────
DROP INDEX IF EXISTS idx_ab_events_hub;
DROP INDEX IF EXISTS idx_ab_events_type;

-- ── ab_test_winners ──────────────────────────────────────────
DROP INDEX IF EXISTS idx_ab_winners_hub;

COMMIT;
