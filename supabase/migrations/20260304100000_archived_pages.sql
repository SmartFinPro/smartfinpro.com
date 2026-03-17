-- ============================================================================
-- Migration: archived_pages + archive_audit_log
-- Two-stage page delete: Soft-Delete (archive + 301) → Hard-Delete (permanent)
-- ============================================================================

-- ── archived_pages ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS archived_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Page identity
  page_url TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  archived_file_path TEXT NOT NULL,
  market TEXT NOT NULL,
  category TEXT NOT NULL,
  slug TEXT NOT NULL,

  -- Redirect config
  redirect_target TEXT NOT NULL,
  redirect_status SMALLINT NOT NULL DEFAULT 301,

  -- Lifecycle
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_reason TEXT DEFAULT '',
  cooldown_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  hard_deleted_at TIMESTAMPTZ,
  restored_at TIMESTAMPTZ,

  -- Status: 'archived' | 'hard_deleted' | 'restored'
  status TEXT NOT NULL DEFAULT 'archived',

  -- Audit
  action_by TEXT DEFAULT 'dashboard',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE archived_pages
  ADD CONSTRAINT archived_pages_status_check
  CHECK (status IN ('archived', 'hard_deleted', 'restored'));

CREATE INDEX idx_archived_pages_status ON archived_pages (status);
CREATE INDEX idx_archived_pages_page_url ON archived_pages (page_url);
CREATE INDEX idx_archived_pages_market ON archived_pages (market);
CREATE INDEX idx_archived_pages_cooldown ON archived_pages (cooldown_expires_at)
  WHERE status = 'archived';

-- RLS
ALTER TABLE archived_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "archived_pages_service_all" ON archived_pages
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "archived_pages_anon_read" ON archived_pages
  FOR SELECT TO anon USING (true);

CREATE POLICY "archived_pages_auth_read" ON archived_pages
  FOR SELECT TO authenticated USING (true);


-- ── archive_audit_log ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS archive_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archived_page_id UUID REFERENCES archived_pages(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  page_url TEXT NOT NULL,
  old_file_path TEXT,
  new_file_path TEXT,
  redirect_target TEXT,
  reason TEXT DEFAULT '',
  action_by TEXT DEFAULT 'dashboard',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE archive_audit_log
  ADD CONSTRAINT archive_audit_action_check
  CHECK (action IN ('archive', 'restore', 'hard_delete'));

CREATE INDEX idx_archive_audit_page_url ON archive_audit_log (page_url);
CREATE INDEX idx_archive_audit_action ON archive_audit_log (action);
CREATE INDEX idx_archive_audit_created ON archive_audit_log (created_at DESC);

ALTER TABLE archive_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "archive_audit_service_all" ON archive_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "archive_audit_anon_read" ON archive_audit_log
  FOR SELECT TO anon USING (true);

CREATE POLICY "archive_audit_auth_read" ON archive_audit_log
  FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE archived_pages IS 'Tracks soft-deleted (archived) and hard-deleted MDX content pages';
COMMENT ON TABLE archive_audit_log IS 'Audit trail for all archive/restore/hard-delete actions';
