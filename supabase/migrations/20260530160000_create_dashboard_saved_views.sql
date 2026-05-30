-- Migration: Create dashboard_saved_views table (Dashboard Saved Views — SP2)
-- Date: 2026-05-30
--
-- Generic, per-route saved filter views: a named snapshot of a dashboard
-- page's query-param map (e.g. {"range":"7d","silo":"uk"}) that can be listed,
-- applied, and deleted from the FilterBar. is_default is reserved for Slice 2
-- (apply-default-when-no-params); Slice 1 does not yet act on it.
--
-- RLS: service role only. All reads/writes go through the API route +
-- server action that use the service client (RLS bypassed there).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS dashboard_saved_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route       text NOT NULL,
  name        text NOT NULL,
  params      jsonb NOT NULL DEFAULT '{}',
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- One view name per route (enables upsert on save).
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_views_route_name
  ON dashboard_saved_views (route, name);

-- Per-route listing, newest first.
CREATE INDEX IF NOT EXISTS idx_saved_views_route
  ON dashboard_saved_views (route, created_at DESC);

-- RLS: deny-all by default; service role bypasses RLS so API/actions still work.
ALTER TABLE dashboard_saved_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_saved_views" ON dashboard_saved_views;
CREATE POLICY "service_role_all_saved_views"
  ON dashboard_saved_views
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
