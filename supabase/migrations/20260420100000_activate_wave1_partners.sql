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

INSERT INTO affiliate_links (slug, partner_name, destination_url, category, market, commission_type, commission_value, network, description, active)
VALUES
  -- ── Primary slugs ───────────────────────────────────────────
  ('wise-business', 'Wise Business', 'https://wise.com/business/', 'business-banking', 'uk', 'cpa', 0, 'direct', 'Cross-border business banking with multi-currency accounts', true),
  ('mercury', 'Mercury', 'https://mercury.com/business-banking', 'business-banking', 'us', 'cpa', 0, 'direct', 'US business banking for startups and operators', true),
  ('relay', 'Relay', 'https://relayfi.com/', 'business-banking', 'us', 'cpa', 0, 'direct', 'US SMB banking for bookkeepers and agencies', true),
  ('oanda', 'OANDA', 'https://www.oanda.com/us-en/trading/', 'forex', 'us', 'cpa', 0, 'direct', 'US forex and CFD trading', true),
  ('revolut-business', 'Revolut Business', 'https://www.revolut.com/business/', 'business-banking', 'uk', 'cpa', 0, 'direct', 'Multi-market business banking and expense cards', true),
  ('plus500', 'Plus500', 'https://www.plus500.com/', 'trading', 'uk', 'cpa', 0, 'direct', 'UK CFD trading platform', true),
  ('ic-markets', 'IC Markets', 'https://www.icmarkets.com/', 'forex', 'au', 'cpa', 0, 'direct', 'AU raw-spread forex for active traders', true),

  -- Low-priority slug (smaller existing content surface)
  ('novo', 'Novo', 'https://www.novo.co/business-banking', 'business-banking', 'us', 'cpa', 0, 'direct', 'US business banking for Stripe/Shopify freelancers', true),

  -- ── Primary re-seeds (already in schema.sql:712; update destination_url) ──
  ('interactive-brokers', 'Interactive Brokers', 'https://www.interactivebrokers.com/', 'trading', 'us', 'cpa', 200, 'direct', 'Professional trading platform', true),
  ('ig-uk', 'IG', 'https://www.ig.com/uk', 'trading', 'uk', 'cpa', 150, 'awin', 'UK trading platform', true),
  ('tide', 'Tide', 'https://www.tide.co/business-current-account/', 'business-banking', 'uk', 'cpa', 50, 'awin', 'UK business banking for freelancers', true),

  -- ── Market/category aliases ─────────────────────────────────
  ('interactive-brokers-forex', 'Interactive Brokers', 'https://www.interactivebrokers.com/', 'forex', 'us', 'cpa', 200, 'direct', 'IBKR forex alias', true),
  ('interactive-brokers-au', 'Interactive Brokers', 'https://www.interactivebrokers.com/', 'trading', 'au', 'cpa', 200, 'direct', 'IBKR AU alias', true),
  ('ig-markets', 'IG', 'https://www.ig.com/uk', 'trading', 'uk', 'cpa', 150, 'awin', 'IG UK trading alias', true),
  ('ig-markets-forex', 'IG', 'https://www.ig.com/uk', 'forex', 'uk', 'cpa', 150, 'awin', 'IG UK forex alias', true),
  ('ig-markets-au', 'IG', 'https://www.ig.com/au', 'trading', 'au', 'cpa', 150, 'awin', 'IG AU alias', true),
  ('plus500-uk', 'Plus500', 'https://www.plus500.com/', 'trading', 'uk', 'cpa', 0, 'direct', 'Plus500 UK alias', true),
  ('plus500-au', 'Plus500', 'https://www.plus500.com/', 'trading', 'au', 'cpa', 0, 'direct', 'Plus500 AU alias', true)

ON CONFLICT (slug) DO UPDATE SET
  partner_name     = EXCLUDED.partner_name,
  destination_url  = EXCLUDED.destination_url,
  market           = EXCLUDED.market,
  category         = EXCLUDED.category,
  commission_type  = EXCLUDED.commission_type,
  commission_value = EXCLUDED.commission_value,
  network          = EXCLUDED.network,
  description      = EXCLUDED.description,
  active           = EXCLUDED.active,
  updated_at       = NOW();
