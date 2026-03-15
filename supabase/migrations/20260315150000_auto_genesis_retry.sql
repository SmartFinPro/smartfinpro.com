-- Migration: Auto-Genesis Stale-State Recovery
-- Created: 2026-03-15
-- Purpose: Add retry_count column for stale 'generating' state recovery
-- Fix 1.1: Briefs stuck in 'generating' status after crash/timeout
-- Rollback: ALTER TABLE auto_genesis_log DROP COLUMN retry_count;

ALTER TABLE auto_genesis_log ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
