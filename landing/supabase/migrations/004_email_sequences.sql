-- Migration: Email Sequence Tracking
-- Run this in your Supabase SQL Editor

-- Table to track subscriber email sequence progress
CREATE TABLE IF NOT EXISTS email_sequence_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  sequence_name VARCHAR(50) NOT NULL DEFAULT 'welcome',
  step_number INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS email_sequence_logs_subscriber_idx ON email_sequence_logs (subscriber_id);
CREATE INDEX IF NOT EXISTS email_sequence_logs_email_idx ON email_sequence_logs (email);
CREATE INDEX IF NOT EXISTS email_sequence_logs_sequence_idx ON email_sequence_logs (sequence_name, step_number);
CREATE INDEX IF NOT EXISTS email_sequence_logs_status_idx ON email_sequence_logs (status);
CREATE INDEX IF NOT EXISTS email_sequence_logs_sent_at_idx ON email_sequence_logs (sent_at DESC);

-- Unique constraint to prevent duplicate sends
CREATE UNIQUE INDEX IF NOT EXISTS email_sequence_logs_unique
  ON email_sequence_logs (email, sequence_name, step_number);

-- Enable Row Level Security
ALTER TABLE email_sequence_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access to email_sequence_logs"
  ON email_sequence_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add sequence-related columns to subscribers table
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS sequence_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"marketing": true, "product_updates": true}'::jsonb;

-- Create index for sequence processing
CREATE INDEX IF NOT EXISTS subscribers_sequence_idx ON subscribers (status, sequence_step, last_email_sent_at);

COMMENT ON TABLE email_sequence_logs IS 'Tracks all emails sent as part of nurture sequences';
COMMENT ON COLUMN email_sequence_logs.step_number IS '0=Welcome, 1=Day 2 Regional Tools, 2=Day 5 Case Study';
COMMENT ON COLUMN subscribers.sequence_step IS 'Current step in the welcome sequence (0-2)';
