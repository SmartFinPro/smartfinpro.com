-- Migration: Create subscribers table for newsletter opt-ins
-- Run this in your Supabase SQL Editor

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  lead_magnet VARCHAR(255),
  source TEXT,
  country_code VARCHAR(2),
  user_agent TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  resubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_unique ON subscribers (LOWER(email));

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS subscribers_status_idx ON subscribers (status);
CREATE INDEX IF NOT EXISTS subscribers_lead_magnet_idx ON subscribers (lead_magnet);
CREATE INDEX IF NOT EXISTS subscribers_subscribed_at_idx ON subscribers (subscribed_at DESC);
CREATE INDEX IF NOT EXISTS subscribers_country_idx ON subscribers (country_code);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access to subscribers"
  ON subscribers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read aggregate stats only
CREATE POLICY "Authenticated users can read subscriber counts"
  ON subscribers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS subscribers_updated_at ON subscribers;
CREATE TRIGGER subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscribers_updated_at();

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO subscribers (email, status, lead_magnet, source, country_code) VALUES
-- ('test@example.com', 'active', 'The 5-Minute AI Finance Workflow', 'https://smartfinpro.com/ai-tools/', 'US');

COMMENT ON TABLE subscribers IS 'Newsletter subscribers with lead magnet tracking';
COMMENT ON COLUMN subscribers.lead_magnet IS 'Name of the lead magnet that triggered the subscription';
COMMENT ON COLUMN subscribers.source IS 'Referrer URL or source of the subscription';
