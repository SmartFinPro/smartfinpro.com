-- supabase/migrations/20260325150000_cj_new_partners.sql
-- Neue CJ Affiliate-Partner (nach CJ-Genehmigung URLs eintragen)
-- CJ Research: Banking/Trading + Investment, sortiert nach Network Earnings
-- TOP TIER: Luxury Card, Barclays US Savings, Sainsbury's Bank, BMO Harris Bank
-- GOOD TIER: Northwestern Mutual, Axos Bank, FarmTogether, Zacks Trade

-- ── Hilfsfunktion: Provider-ID aus affiliate_rates holen ──────────────────
-- Alle Links via /go/[slug]/ Pattern (niemals direkte URLs im Frontend)

-- ══════════════════════════════════════════════════════════════════════════
-- 🔥 TOP TIER
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Luxury Card (US) — premium credit card, 3m EPC $1,039
-- CJ Advertiser ID: [NACH GENEHMIGUNG EINTRAGEN]
-- CJ-Link URL: [NACH GENEHMIGUNG EINTRAGEN]
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'luxury-card',
  'Luxury Card',
  'https://www.luxurycard.com',  -- TODO: mit echtem CJ-Tracking-Link ersetzen
  'us',
  'personal-finance',
  0,  -- TODO: genaue CPA nach Genehmigung eintragen (EPC ~$1,039)
  'Commission Junction',
  NULL,  -- TODO: CJ Advertiser ID eintragen
  false  -- Deaktiviert bis Link genehmigt
) ON CONFLICT (slug) DO NOTHING;

-- 2. Barclays US Online Savings (US) — Lead bis $250, 3m EPC $1,027
-- CJ Advertiser ID: [NACH GENEHMIGUNG EINTRAGEN]
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'barclays-us-savings',
  'Barclays US Online Savings',
  'https://www.banking.barclaysus.com',  -- TODO: CJ-Link
  'us',
  'personal-finance',
  250,  -- Lead bis $250
  'Commission Junction',
  NULL,
  false
) ON CONFLICT (slug) DO NOTHING;

-- 3. Sainsbury's Bank (UK) — 3m EPC £447, 7d EPC £1,056
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'sainsburys-bank',
  'Sainsbury''s Bank',
  'https://www.sainsburysbank.co.uk',  -- TODO: CJ-Link
  'uk',
  'personal-finance',
  0,  -- TODO: genaue CPA nach Genehmigung (EPC ~£447)
  'Commission Junction',
  NULL,
  false
) ON CONFLICT (slug) DO NOTHING;

-- 4a. BMO Harris Bank (US) — Sale $100–$400, dual-market (US + CA)
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'bmo-harris-bank',
  'BMO Harris Bank',
  'https://www.bmoharris.com',  -- TODO: CJ-Link
  'us',
  'business-banking',
  250,  -- Mitte aus $100–$400 Range
  'Commission Junction',
  NULL,
  false
) ON CONFLICT (slug) DO NOTHING;

-- 4b. BMO Canada (CA) — gleiche CJ-Partnerschaft, CA-Markt
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'bmo-canada',
  'BMO Bank of Montreal',
  'https://www.bmo.com',  -- TODO: CJ-Link (ggf. gleicher wie US)
  'ca',
  'business-banking',
  250,
  'Commission Junction',
  NULL,
  false
) ON CONFLICT (slug) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════
-- 🟡 GOOD TIER
-- ══════════════════════════════════════════════════════════════════════════

-- 5. Northwestern Mutual (US) — financial planning, 7d EPC $415
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'northwestern-mutual',
  'Northwestern Mutual',
  'https://www.northwesternmutual.com',  -- TODO: CJ-Link
  'us',
  'personal-finance',
  0,  -- Lead-basiert, CPA nach Genehmigung
  'Commission Junction',
  NULL,
  false
) ON CONFLICT (slug) DO NOTHING;

-- 6. Axos Bank (US) — online bank, Sale $0–$150, 7d EPC $379
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'axos-bank',
  'Axos Bank',
  'https://www.axosbank.com',  -- TODO: CJ-Link
  'us',
  'business-banking',
  150,  -- Max. $150/sale
  'Commission Junction',
  NULL,
  false
) ON CONFLICT (slug) DO NOTHING;

-- 7. Zacks Trade (US) — stock trading, $70/funded account
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'zacks-trade',
  'Zacks Trade',
  'https://www.zackstrade.com',  -- TODO: CJ-Link
  'us',
  'trading',
  70,  -- $70 per funded account
  'Commission Junction',
  NULL,
  false
) ON CONFLICT (slug) DO NOTHING;

-- 8. FarmTogether (US) — farmland investing, $200/sale + $15/lead
INSERT INTO affiliate_links (slug, provider, url, market, category, cpa_value, network, network_link_id, is_active)
VALUES (
  'farmtogether',
  'FarmTogether',
  'https://www.farmtogether.com',  -- TODO: CJ-Link
  'us',
  'personal-finance',
  200,  -- $200/sale (+ $15/lead)
  'Commission Junction',
  NULL,
  false
) ON CONFLICT (slug) DO NOTHING;

-- ── Affiliate-Rates Einträge (für Revenue Forecast + Genesis Hub) ─────────

INSERT INTO affiliate_rates (provider_name, market, commission_type, cpa_value, currency, avg_conversion_rate, active)
VALUES
  ('Luxury Card',                'us', 'cpa',       0,   'USD', 1.5, false),
  ('Barclays US Online Savings', 'us', 'cpa',     250,   'USD', 4.0, false),
  ('Sainsbury''s Bank',          'uk', 'cpa',       0,   'GBP', 3.0, false),
  ('BMO Harris Bank',            'us', 'cpa',     250,   'USD', 2.5, false),
  ('BMO Bank of Montreal',       'ca', 'cpa',     250,   'CAD', 2.5, false),
  ('Northwestern Mutual',        'us', 'cpa',       0,   'USD', 2.0, false),
  ('Axos Bank',                  'us', 'cpa',     150,   'USD', 3.5, false),
  ('Zacks Trade',                'us', 'cpa',      70,   'USD', 2.0, false),
  ('FarmTogether',               'us', 'cpa',     200,   'USD', 1.0, false)
ON CONFLICT (provider_name, market) DO NOTHING;

-- ── Aktivieren nach CJ-Genehmigung ───────────────────────────────────────
-- UPDATE affiliate_links SET is_active = true, url = '[ECHTER CJ LINK]', network_link_id = '[CJ ID]'
-- WHERE slug IN ('luxury-card', 'barclays-us-savings', 'sainsburys-bank',
--               'bmo-harris-bank', 'bmo-canada', 'northwestern-mutual',
--               'axos-bank', 'zacks-trade', 'farmtogether');
