-- Migration: Add new category support to content_items table
-- Date: 2026-02-21 02:00:00
-- Purpose: Expand category enum for new market silos (credit-repair, debt-relief, etc.)

-- ══════════════════════════════════════════════════════════════════
-- STEP 1: Add new categories to category check constraint
-- ══════════════════════════════════════════════════════════════════

-- Drop existing check constraint if exists
ALTER TABLE IF EXISTS content_items
  DROP CONSTRAINT IF EXISTS content_items_category_check;

-- Add new check constraint with all categories
ALTER TABLE content_items
  ADD CONSTRAINT content_items_category_check
  CHECK (category IN (
    'ai-tools',
    'cybersecurity',
    'trading',
    'forex',
    'personal-finance',
    'business-banking',
    'credit-repair',
    'debt-relief',
    'credit-score',
    'remortgaging',
    'cost-of-living',
    'savings',
    'superannuation',
    'gold-investing',
    'tax-efficient-investing',
    'housing'
  ));

-- ══════════════════════════════════════════════════════════════════
-- STEP 2: Update affiliate_links table category constraint
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS affiliate_links
  DROP CONSTRAINT IF EXISTS affiliate_links_category_check;

ALTER TABLE affiliate_links
  ADD CONSTRAINT affiliate_links_category_check
  CHECK (category IN (
    'ai-tools',
    'cybersecurity',
    'trading',
    'forex',
    'personal-finance',
    'business-banking',
    'credit-repair',
    'debt-relief',
    'credit-score',
    'remortgaging',
    'cost-of-living',
    'savings',
    'superannuation',
    'gold-investing',
    'tax-efficient-investing',
    'housing'
  ));

-- ══════════════════════════════════════════════════════════════════
-- STEP 3: Add market-category composite index for performance
-- ══════════════════════════════════════════════════════════════════

-- Index for fast lookups by market + category (used in dashboard)
CREATE INDEX IF NOT EXISTS idx_content_items_market_category
  ON content_items(market, category);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_market_category
  ON affiliate_links(market, category);

-- ══════════════════════════════════════════════════════════════════
-- STEP 4: Add comment metadata for new categories
-- ══════════════════════════════════════════════════════════════════

COMMENT ON CONSTRAINT content_items_category_check ON content_items IS
  'Updated 2026-02-21: Added 10 new categories for multi-market expansion (US: credit-repair, debt-relief, credit-score | UK: remortgaging, cost-of-living, savings | AU: superannuation, gold-investing, savings | CA: tax-efficient-investing, housing)';

COMMENT ON CONSTRAINT affiliate_links_category_check ON affiliate_links IS
  'Updated 2026-02-21: Added 10 new categories for multi-market expansion';

-- ══════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ══════════════════════════════════════════════════════════════════

-- Run after migration to verify constraints are active:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'content_items'::regclass AND conname = 'content_items_category_check';
