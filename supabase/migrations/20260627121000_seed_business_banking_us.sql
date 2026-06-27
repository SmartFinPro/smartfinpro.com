-- ============================================================
-- Comparison Engine — Pilot Seed: US Business Banking
-- ------------------------------------------------------------
-- Methodik: Fakten verifiziert am 2026-06-27 aus offiziellen
-- Anbieter-Pricing-Seiten (source_url je Row, data_verified_at).
-- Zeitkritische Felder (apy, signup_bonus, monthly_fee) regelmäßig
-- neu verifizieren — sonst veraltete Datensenke.
--
-- CTA-Gating (vom Loader abgeleitet):
--   mercury/novo/relay  → aktive affiliate_links → 'offer' (/go/<slug>)
--   bluevine            → kein Affiliate, Review-MDX vorhanden → 'review'
--   lili                → kein Affiliate, kein Review → 'visit' (external_url)
--
-- affiliate_links werden NICHT verändert (Monetarisierung unangetastet);
-- affiliate_link_id wird per Subquery aufgelöst (NULL falls kein Link).
-- Idempotent via ON CONFLICT (market, category, slug).
-- ============================================================

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, display_name, tagline,
  score, rating, review_count, monthly_fee, signup_bonus, fx_fee_pct, atm_fee, apy, clicks,
  badges, chips, pros, cons, sub_scores,
  effective_apr, cashback, card_network, wire_transfers, fdic_coverage, apps, verdict,
  has_no_monthly_fee, has_free_atm, has_no_fx_fee, has_cashback, has_bonus, has_sub_accounts, has_interest, has_apple_pay,
  entity_types, supports_cash_deposits, supports_intl_wires, has_bookkeeping, has_lending, integrations,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order, source_url, data_verified_at, active
) VALUES
-- ── #1 Mercury (affiliate, top pick) ──────────────────────────
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'mercury' AND market = 'us' LIMIT 1),
  'mercury', 'us', 'business-banking', 'Mercury', 'Best business banking for VC-backed startups',
  9.4, 4.5, 1240, 0, 0, 1, 0, 0, 1240,
  '[{"type":"gold","label":"Top pick"},{"type":"sky","label":"Most clicked"}]'::jsonb,
  ARRAY['FDIC up to $5M','Opens in ~10 min','US LLCs & C-Corps']::text[],
  ARRAY['No monthly fees, no minimums','$5M FDIC via sweep network','Free USD wires + treasury option']::text[],
  ARRAY['No cash deposits','US-registered businesses only']::text[],
  '{"fees":9.6,"features":9.3,"ux":9.2,"support":8.9}'::jsonb,
  'n/a (debit)', '—', 'Mastercard', 'Free USD wires', '$5M (sweep)', '["apple","android","web"]'::jsonb,
  'The best all-rounder for funded startups',
  true, false, false, false, false, true, false, true,
  ARRAY['llc','s-corp','c-corp']::text[], false, true, false, false, ARRAY['quickbooks','stripe','xero']::text[],
  true, 'mercury-review', NULL, true, 'Funded startups', 1,
  'https://mercury.com/business-banking', DATE '2026-06-27', true
),
-- ── #2 Novo (affiliate) ───────────────────────────────────────
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'novo' AND market = 'us' LIMIT 1),
  'novo', 'us', 'business-banking', 'Novo', 'Best for freelancers and solopreneurs',
  8.8, 4.0, 910, 0, 0, 0, 0, 0, 1050,
  '[{"type":"green","label":"Best for freelancers"}]'::jsonb,
  ARRAY['FDIC standard','Refunds ATM fees','US sole props & LLCs']::text[],
  ARRAY['Truly $0 monthly fee','Refunds all ATM fees','Stripe & Shopify integrations']::text[],
  ARRAY['No interest on balances','No international wires']::text[],
  '{"fees":9.4,"features":8.6,"ux":8.8,"support":8.4}'::jsonb,
  'n/a (debit)', '—', 'Mastercard', 'Domestic only', 'Standard ($250k)', '["apple","android","web"]'::jsonb,
  'The strongest truly-free pick for freelancers',
  true, true, true, false, false, false, false, true,
  ARRAY['sole-prop','llc','s-corp']::text[], false, false, false, false, ARRAY['stripe','shopify','quickbooks']::text[],
  true, 'novo-review', NULL, false, 'Freelancers', 2,
  'https://www.novo.co/business-banking', DATE '2026-06-27', true
),
-- ── #3 Relay (affiliate) ──────────────────────────────────────
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'relay' AND market = 'us' LIMIT 1),
  'relay', 'us', 'business-banking', 'Relay', 'Best for teams and Profit First',
  9.0, 4.2, 780, 0, 0, 1, 0, 0, 760,
  '[{"type":"green","label":"Best for teams"}]'::jsonb,
  ARRAY['FDIC up to $3M','Up to 20 accounts','US businesses']::text[],
  ARRAY['Up to 20 checking accounts','Roles & permissions for teams','No-fee Allpoint ATMs']::text[],
  ARRAY['Wires $5 on free plan (free on Grow)','No lending']::text[],
  '{"fees":9.2,"features":9.0,"ux":8.6,"support":8.5}'::jsonb,
  'n/a (debit)', '—', 'Visa', 'Outgoing $5 (free on Grow)', '$3M (sweep)', '["apple","android","web"]'::jsonb,
  'Built for teams and Profit-First budgeting',
  true, true, false, false, false, true, false, true,
  ARRAY['llc','s-corp','c-corp','sole-prop']::text[], true, true, false, false, ARRAY['quickbooks','xero']::text[],
  true, 'relay-review', NULL, false, 'Teams', 3,
  'https://relayfi.com/pricing/', DATE '2026-06-27', true
),
-- ── #4 Bluevine (no affiliate yet → review CTA) ───────────────
(
  NULL,
  'bluevine', 'us', 'business-banking', 'Bluevine', 'Best APY if you keep a balance',
  8.7, 4.0, 1520, 0, 500, 2.9, 2.5, 1.3, 900,
  '[{"type":"green","label":"Highest APY"}]'::jsonb,
  ARRAY['FDIC up to $3M','1.3% APY (Standard)','US businesses']::text[],
  ARRAY['1.3% APY on balances up to $250k','$500 signup bonus (terms apply)','Lines of credit available']::text[],
  ARRAY['$2.50 out-of-network ATM fee','2.9% foreign transaction fee']::text[],
  '{"fees":7.8,"features":8.8,"ux":8.2,"support":8.2}'::jsonb,
  'n/a (debit)', '—', 'Mastercard', 'Outgoing wires (fee)', '$3M (sweep)', '["apple","android","web"]'::jsonb,
  'The pick if you park a higher balance',
  true, false, false, false, true, false, true, true,
  ARRAY['llc','s-corp','c-corp','sole-prop']::text[], true, false, false, true, ARRAY['quickbooks']::text[],
  false, 'bluevine-review', NULL, false, 'High balances', 4,
  'https://www.bluevine.com/business-checking/plans-and-pricing', DATE '2026-06-27', true
),
-- ── #5 Lili (no affiliate, no review → visit CTA) ─────────────
(
  NULL,
  'lili', 'us', 'business-banking', 'Lili', 'Best built-in tax tools for freelancers',
  8.2, 4.0, 640, 15, 0, 3, 0, 0, 540,
  '[{"type":"green","label":"Best tax tools"}]'::jsonb,
  ARRAY['FDIC standard','Free MoneyPass ATMs','US sole props']::text[],
  ARRAY['Built-in tax buckets (Pro)','1% cashback (Pro)','Free MoneyPass ATMs']::text[],
  ARRAY['$15/mo for Pro features','3% foreign transaction fee']::text[],
  '{"fees":8.0,"features":8.2,"ux":8.4,"support":7.8}'::jsonb,
  'n/a (debit)', '1% (Pro)', 'Visa', 'Not supported', 'Standard ($250k)', '["apple","android","web"]'::jsonb,
  'Best for tax-conscious freelancers',
  false, true, false, true, false, false, false, true,
  ARRAY['sole-prop','llc']::text[], true, false, true, false, ARRAY[]::text[],
  false, NULL, 'https://lili.co/', false, 'Tax tools', 5,
  'https://lili.co/plans', DATE '2026-06-27', true
)
ON CONFLICT (market, category, slug) DO UPDATE SET
  affiliate_link_id = EXCLUDED.affiliate_link_id,
  display_name = EXCLUDED.display_name,
  tagline = EXCLUDED.tagline,
  score = EXCLUDED.score,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  monthly_fee = EXCLUDED.monthly_fee,
  signup_bonus = EXCLUDED.signup_bonus,
  fx_fee_pct = EXCLUDED.fx_fee_pct,
  atm_fee = EXCLUDED.atm_fee,
  apy = EXCLUDED.apy,
  clicks = EXCLUDED.clicks,
  badges = EXCLUDED.badges,
  chips = EXCLUDED.chips,
  pros = EXCLUDED.pros,
  cons = EXCLUDED.cons,
  sub_scores = EXCLUDED.sub_scores,
  effective_apr = EXCLUDED.effective_apr,
  cashback = EXCLUDED.cashback,
  card_network = EXCLUDED.card_network,
  wire_transfers = EXCLUDED.wire_transfers,
  fdic_coverage = EXCLUDED.fdic_coverage,
  apps = EXCLUDED.apps,
  verdict = EXCLUDED.verdict,
  has_no_monthly_fee = EXCLUDED.has_no_monthly_fee,
  has_free_atm = EXCLUDED.has_free_atm,
  has_no_fx_fee = EXCLUDED.has_no_fx_fee,
  has_cashback = EXCLUDED.has_cashback,
  has_bonus = EXCLUDED.has_bonus,
  has_sub_accounts = EXCLUDED.has_sub_accounts,
  has_interest = EXCLUDED.has_interest,
  has_apple_pay = EXCLUDED.has_apple_pay,
  entity_types = EXCLUDED.entity_types,
  supports_cash_deposits = EXCLUDED.supports_cash_deposits,
  supports_intl_wires = EXCLUDED.supports_intl_wires,
  has_bookkeeping = EXCLUDED.has_bookkeeping,
  has_lending = EXCLUDED.has_lending,
  integrations = EXCLUDED.integrations,
  is_affiliate = EXCLUDED.is_affiliate,
  review_slug = EXCLUDED.review_slug,
  external_url = EXCLUDED.external_url,
  is_top_pick = EXCLUDED.is_top_pick,
  best_for = EXCLUDED.best_for,
  display_order = EXCLUDED.display_order,
  source_url = EXCLUDED.source_url,
  data_verified_at = EXCLUDED.data_verified_at,
  active = EXCLUDED.active;
