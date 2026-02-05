-- Migration: Add click_id for SubID tracking and sync status
-- Run this in your Supabase SQL Editor

-- Add click_id column to link_clicks for SubID matching
ALTER TABLE link_clicks ADD COLUMN IF NOT EXISTS click_id VARCHAR(36);
CREATE INDEX IF NOT EXISTS idx_link_clicks_click_id ON link_clicks(click_id);

-- Create sync_logs table to track API synchronization
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_name VARCHAR(100) NOT NULL,
  sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('manual', 'scheduled', 'webhook')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  records_synced INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_sync_logs_connector ON sync_logs(connector_name);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);

-- Create api_connectors table to store connector configurations
CREATE TABLE IF NOT EXISTS api_connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  connector_type VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  webhook_secret TEXT,
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_connectors ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role only for write, authenticated for read)
CREATE POLICY "Allow service role full access to sync_logs"
  ON sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read sync_logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role full access to api_connectors"
  ON api_connectors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read api_connectors"
  ON api_connectors FOR SELECT
  TO authenticated
  USING (true);

-- Insert default PartnerStack connector (disabled by default)
INSERT INTO api_connectors (name, connector_type, config)
VALUES (
  'partnerstack',
  'partnerstack',
  '{"base_url": "https://api.partnerstack.com/api/v2", "sync_interval_hours": 24}'
)
ON CONFLICT (name) DO NOTHING;
