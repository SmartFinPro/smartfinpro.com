CREATE TABLE IF NOT EXISTS compliance_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT NOW(),
  triggered_by text NOT NULL,
  total_links int NOT NULL,
  compliant_count int NOT NULL,
  attention_count int NOT NULL,
  critical_count int NOT NULL,
  details jsonb NOT NULL,
  duration_ms int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_runs_ran_at
  ON compliance_audit_runs (ran_at DESC);

ALTER TABLE compliance_audit_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_compliance_audit_runs" ON compliance_audit_runs;
CREATE POLICY "service_role_all_compliance_audit_runs"
  ON compliance_audit_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
