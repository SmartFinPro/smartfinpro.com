-- Migration: Conversions — Add missing columns + Unique Network Reference
-- Created: 2026-03-15
-- Purpose: 1) Add network, network_status, product_name, updated_at columns used by sync code
--          2) Prevent duplicate conversions from same network via DB constraint
-- Fix 1.7: App-level dedup is insufficient — add DB-level guarantee
-- Rollback:
--   ALTER TABLE conversions DROP CONSTRAINT IF EXISTS uq_conversions_network_ref;
--   ALTER TABLE conversions DROP COLUMN IF EXISTS network, DROP COLUMN IF EXISTS network_status,
--     DROP COLUMN IF EXISTS product_name, DROP COLUMN IF EXISTS updated_at;

-- Step 1: Add missing columns referenced by affiliate-networks.ts processTransactions()
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS network VARCHAR(50);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS network_status VARCHAR(20);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Step 2: Clean up orphan duplicates (keep the newest by id)
-- Only applies if network column already had data (safe no-op on fresh installs)
DELETE FROM conversions a USING conversions b
WHERE a.id < b.id
AND a.network = b.network
AND a.network_reference = b.network_reference
AND a.network_reference IS NOT NULL;

-- Step 3: Add unique constraint on (network, network_reference)
-- NULL values are excluded from unique constraints (NULL ≠ NULL in SQL)
ALTER TABLE conversions ADD CONSTRAINT uq_conversions_network_ref
  UNIQUE (network, network_reference);
