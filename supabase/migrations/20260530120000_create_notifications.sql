-- Migration: Create notifications table (Dashboard Notification Center)
-- Date: 2026-05-30
--
-- Central event log surfaced in the dashboard header bell + /dashboard/notifications.
-- Producer: lib/notifications.ts → recordNotification(), fed by the
-- channel-neutral alert layer (lib/alerts/alert-delivery.ts). Telegram is not
-- a product channel; the legacy telegram.ts shim delegates here too.
--
-- RLS: service role only. All reads/writes go through API routes + server
-- actions that use the service client (RLS bypassed there).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,
  severity    text NOT NULL DEFAULT 'info'
                CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  title       text NOT NULL,
  message     text,
  source      text,
  link_url    text,
  metadata    jsonb NOT NULL DEFAULT '{}',
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Recent-first listing (full page + bell dropdown)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at DESC);

-- Fast unread-count badge (partial index — only unread rows)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (created_at DESC)
  WHERE read_at IS NULL;

-- RLS: deny-all by default; service role bypasses RLS so API/actions still work.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_notifications" ON notifications;
CREATE POLICY "service_role_all_notifications"
  ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
