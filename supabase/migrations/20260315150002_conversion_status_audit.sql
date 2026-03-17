-- Migration: Conversion Status Audit Trail
-- Created: 2026-03-15
-- Purpose: Historize all conversion status transitions for compliance and debugging
-- Fix 1.6: Enables rejected → approved transitions with full audit trail
-- Rollback: DROP TABLE IF EXISTS conversion_status_audit;

CREATE TABLE IF NOT EXISTS conversion_status_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversion_id UUID NOT NULL REFERENCES conversions(id) ON DELETE CASCADE,
  old_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  changed_by VARCHAR(50) NOT NULL,  -- 'sync-revenue' | 'postback' | 'manual'
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Index for fast lookup by conversion
CREATE INDEX IF NOT EXISTS idx_conversion_status_audit_conversion_id
  ON conversion_status_audit(conversion_id);

-- Index for chronological audit queries
CREATE INDEX IF NOT EXISTS idx_conversion_status_audit_changed_at
  ON conversion_status_audit(changed_at DESC);

-- RLS: Only service role can read/write audit entries
ALTER TABLE conversion_status_audit ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE conversion_status_audit IS
  'Audit trail for conversion status transitions. Every status change is logged before the UPDATE.';
