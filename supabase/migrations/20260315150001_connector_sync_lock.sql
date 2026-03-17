-- Migration: Connector Sync Lock
-- Created: 2026-03-15
-- Purpose: Add sync_in_progress_at for mutual exclusion of concurrent syncs
-- Fix 1.2: Prevents duplicate records from concurrent sync-conversions runs
-- Stale-Lock-Timeout: 1 hour (documented below and in code)
-- Rollback: ALTER TABLE api_connectors DROP COLUMN sync_in_progress_at;

ALTER TABLE api_connectors ADD COLUMN IF NOT EXISTS sync_in_progress_at TIMESTAMPTZ;

-- Stale-Lock Rule: Locks older than 1 hour are considered abandoned.
-- Any new sync attempt will claim the lock if sync_in_progress_at < NOW() - 1 hour.
-- This handles cases where the previous sync process crashed without releasing the lock.
COMMENT ON COLUMN api_connectors.sync_in_progress_at IS
  'Mutex timestamp for sync operations. NULL = unlocked. Stale after 1 hour.';
