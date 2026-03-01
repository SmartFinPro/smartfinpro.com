-- GIN index on analytics_events.properties for fast JSONB queries
-- Speeds up: properties ->> 'market', properties ->> 'category', etc.
-- Used by: trust-cta-daily.sql funnel report, dashboard analytics

CREATE INDEX IF NOT EXISTS idx_analytics_events_properties_gin
  ON analytics_events USING gin (properties);
