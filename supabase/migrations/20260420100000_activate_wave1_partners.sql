-- Wave 1 Partner Activation — 10 primary slugs + 7 market/category aliases + 1 low-priority slug (novo)
--
-- Context: 186 content slugs reference /go/<slug> but are not in affiliate_links.
-- trackClick() filters on active=true → null → silent 307 to homepage.
-- This migration activates 18 rows; stops bounce-to-homepage on ~208 MDX refs.
--
-- Destination URLs are official provider signup pages (Fallback-Policy).
-- Real tracking links with partner IDs can be patched in later via UPDATE;
-- the slug stays stable so content references never break.
--
-- ON CONFLICT DO UPDATE is idempotent and normalizes any pre-existing rows
-- (interactive-brokers, ig-uk, tide are already in schema.sql:712 seed).
--
-- NOTE: Column set matches live production schema (probed 2026-04-20):
--   id, slug, partner_name, destination_url, category, market,
--   commission_type, commission_value, active, created_at,
--   health_status, last_health_check
-- The supabase/schema.sql definition includes `network` + `description`
-- columns that do not exist in prod. Schema-reconcile is out-of-scope for
-- this sprint — this migration targets the live schema only.

INSERT INTO affiliate_links (slug, partner_name, destination_url, category, market, commission_type, commission_value, active)
VALUES
  -- ── Primary slugs ───────────────────────────────────────────
  ('wise-business', 'Wise Business', 'https://wise.com/business/', 'business-banking', 'uk', 'cpa', 0, true),
  ('mercury', 'Mercury', 'https://mercury.com/business-banking', 'business-banking', 'us', 'cpa', 0, true),
  ('relay', 'Relay', 'https://relayfi.com/', 'business-banking', 'us', 'cpa', 0, true),
  ('oanda', 'OANDA', 'https://www.oanda.com/us-en/trading/', 'forex', 'us', 'cpa', 0, true),
  ('revolut-business', 'Revolut Business', 'https://www.revolut.com/business/', 'business-banking', 'uk', 'cpa', 0, true),
  ('plus500', 'Plus500', 'https://www.plus500.com/', 'trading', 'uk', 'cpa', 0, true),
  ('ic-markets', 'IC Markets', 'https://www.icmarkets.com/', 'forex', 'au', 'cpa', 0, true),

  -- Low-priority slug (smaller existing content surface)
  ('novo', 'Novo', 'https://www.novo.co/business-banking', 'business-banking', 'us', 'cpa', 0, true),

  -- ── Primary re-seeds (already in schema.sql:712; update destination_url) ──
  ('interactive-brokers', 'Interactive Brokers', 'https://www.interactivebrokers.com/', 'trading', 'us', 'cpa', 200, true),
  ('ig-uk', 'IG', 'https://www.ig.com/uk', 'trading', 'uk', 'cpa', 150, true),
  ('tide', 'Tide', 'https://www.tide.co/business-current-account/', 'business-banking', 'uk', 'cpa', 50, true),

  -- ── Market/category aliases ─────────────────────────────────
  ('interactive-brokers-forex', 'Interactive Brokers', 'https://www.interactivebrokers.com/', 'forex', 'us', 'cpa', 200, true),
  ('interactive-brokers-au', 'Interactive Brokers', 'https://www.interactivebrokers.com/', 'trading', 'au', 'cpa', 200, true),
  ('ig-markets', 'IG', 'https://www.ig.com/uk', 'trading', 'uk', 'cpa', 150, true),
  ('ig-markets-forex', 'IG', 'https://www.ig.com/uk', 'forex', 'uk', 'cpa', 150, true),
  ('ig-markets-au', 'IG', 'https://www.ig.com/au', 'trading', 'au', 'cpa', 150, true),
  ('plus500-uk', 'Plus500', 'https://www.plus500.com/', 'trading', 'uk', 'cpa', 0, true),
  ('plus500-au', 'Plus500', 'https://www.plus500.com/', 'trading', 'au', 'cpa', 0, true)

ON CONFLICT (slug) DO UPDATE SET
  partner_name     = EXCLUDED.partner_name,
  destination_url  = EXCLUDED.destination_url,
  market           = EXCLUDED.market,
  category         = EXCLUDED.category,
  commission_type  = EXCLUDED.commission_type,
  commission_value = EXCLUDED.commission_value,
  active           = EXCLUDED.active;
