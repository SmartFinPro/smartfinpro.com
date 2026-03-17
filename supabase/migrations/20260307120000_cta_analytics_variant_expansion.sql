-- ============================================================
-- Migration: Expand cta_analytics variant CHECK constraint
--
-- The original constraint only allowed 'emerald-shimmer' and 'violet-pill'.
-- New features (StickyReviewNav, ReviewExitIntent) need additional variants:
--   - impression, sticky_nav_pos1..3, exit_intent_impression, exit_intent_click
--   - Future A/B test variants
--
-- Solution: Drop the restrictive CHECK and widen VARCHAR to 50 chars
-- to support free-form variant naming (validated by Zod in the API layer).
-- ============================================================

-- Drop the existing restrictive CHECK constraint
ALTER TABLE cta_analytics DROP CONSTRAINT IF EXISTS cta_analytics_variant_check;

-- Widen column to 50 chars (was 30) for longer variant names
ALTER TABLE cta_analytics ALTER COLUMN variant TYPE VARCHAR(50);
