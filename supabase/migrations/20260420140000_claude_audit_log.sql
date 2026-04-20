-- Claude MCP Tool Audit Log
--
-- Every tool call from scripts/mcp-server writes a fire-and-forget row here.
-- Enables operational visibility: what tools ran, how long, how often,
-- validation-failure rate, which tools wrote rows.
--
-- Phase 1: service-role-only writes. Dashboard read-access can be added later
-- via separate RLS policy if a /dashboard/system/claude-audit UI is built.

CREATE TABLE IF NOT EXISTS claude_audit_log (
  id             BIGSERIAL PRIMARY KEY,
  tool_name      TEXT NOT NULL,
  args_json      JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary TEXT,
  status         TEXT NOT NULL CHECK (status IN ('success', 'error', 'validation_failed', 'unauthorized')),
  duration_ms    INTEGER,
  error          TEXT,
  executed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS claude_audit_log_executed_at_idx
  ON claude_audit_log (executed_at DESC);

CREATE INDEX IF NOT EXISTS claude_audit_log_tool_status_idx
  ON claude_audit_log (tool_name, status);

-- RLS: service-role has full access by default; authenticated/anon have none
-- unless a policy is added. Phase 1 = service-role only.
ALTER TABLE claude_audit_log ENABLE ROW LEVEL SECURITY;

-- ── View for MCP detect_schema_drift ────────────────────────────────────
-- Exposes a limited slice of information_schema.columns to the service-role
-- so the MCP tool can diff live DB state against supabase/schema.sql.
-- Only columns we actually need for drift detection.

CREATE OR REPLACE VIEW mcp_information_schema_columns WITH (security_invoker = true) AS
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public';

GRANT SELECT ON mcp_information_schema_columns TO service_role;
