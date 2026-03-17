-- ════════════════════════════════════════════════════════════════
-- Migration 017: System Settings — Key-Value Store
--
-- Central configuration table for API credentials, autonomy
-- guardrails, and system control parameters. API keys are stored
-- encrypted at the application layer (masked on read).
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system_settings (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL DEFAULT '',
  category      VARCHAR(50) NOT NULL DEFAULT 'general',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index: fast category-based lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_category
  ON system_settings (category);

-- ── Seed default guardrail values ────────────────────────────

INSERT INTO system_settings (key, value, category) VALUES
  -- API Credentials (empty by default — user must configure)
  ('anthropic_api_key',       '', 'credentials'),
  ('serper_api_key',          '', 'credentials'),
  ('google_indexing_json',    '', 'credentials'),

  -- Autonomy Guardrails
  ('spike_threshold',         '300', 'guardrails'),
  ('confidence_threshold',    '5',   'guardrails'),
  ('optimization_interval',   '7',   'guardrails'),

  -- System Controls
  ('simulation_mode',         'false', 'controls')
ON CONFLICT (key) DO NOTHING;

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on system_settings"
  ON system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view system_settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);
