-- Comparison Cockpit — seed CA business-bank-accounts (market='ca').
-- Visit-only launch (AU/CA/UK rollout, Stage 2 Slice CA-1): affiliate_link_id
-- NULL, is_affiliate=false, review_slug NULL, external_url = provider homepage.
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- caBusinessBankAttributesSchema. Float's CDIC protection is indirect
-- (trust account at Scotiabank, $100k combined CAD+USD cap) — disclosed via
-- cdic_note, not glossed as equivalent to a direct bank account. TD's real,
-- material 2025 compliance record (US AML penalty + FCAC fine) is disclosed
-- in full via regulatory_note; TD is not the top pick.
-- Provenance: live research 2026-07-11 against official pricing pages, CDIC,
-- OSFI, FCAC.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, monthly_fee,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'rbc-business', 'ca', 'business-banking', 'business-bank-accounts', 'RBC Business', 'The largest branch network with genuine accounting automation',
  8.9, 0, 0, 0, 6,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['C$6/mo, waivable at $8,000+', 'RBC PayEdge accounting automation', 'Largest branch network in Canada']::text[],
  ARRAY['Direct CDIC-insured bank with the largest physical branch network of any candidate', 'RBC PayEdge offers genuine embedded-banking automation beyond a simple bank feed', 'Low C$6/mo entry fee, waivable with a minimum balance'],
  ARRAY['No independent, reliable Trustpilot review sample found for the business banking product specifically', 'Higher-tier accounts with more transactions cost significantly more per month'],
  '{"fees":8.2,"protection":9.6,"integrations":8.8,"support":8.6}'::jsonb,
  'Best overall — a direct CDIC-insured bank with real accounting automation.',
  '{"fee_waiver_note":"C$6/mo Digital plan waived with a $8,000+ minimum monthly balance; higher-transaction tiers ($16-$120/mo) available for larger businesses","interest_rate_pct":0,"cdic_protected":true,"cdic_note":"","intl_payments":true,"intl_payments_note":"RBC PayEdge cross-border payments and embedded-banking automation","accounting_integrations":["RBC PayEdge"],"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.rbcroyalbank.com/business/accounts/index.html', true, 'Businesses wanting a full-service bank with automation', 1,
  'https://www.rbcroyalbank.com/business/accounts/business-bank-accounts.html', DATE '2026-07-11', true
),
(
  NULL, 'eq-bank-business', 'ca', 'business-banking', 'business-bank-accounts', 'EQ Bank Business', 'Completely free, with a genuinely competitive interest rate',
  8.6, 0, 0, 0, 0,
  '[{"type":"green","label":"Best value"}]'::jsonb,
  ARRAY['C$0/mo, no minimum balance', 'Competitive interest on idle balances', 'Direct CDIC-insured bank']::text[],
  ARRAY['Genuinely free account — no monthly fee, no minimum balance, no waiver hoops', 'Direct CDIC-member bank (Equitable Bank), unlike several fintech competitors', 'Interest paid on the operating balance, unusual for a business chequing account'],
  ARRAY['No branch network — digital-only, which will not suit every business', 'No accounting-software integration at all currently — a real gap versus Float, RBC or BMO'],
  '{"fees":9.8,"protection":9.6,"integrations":4.0,"support":7.6}'::jsonb,
  'The best value — a genuinely free, direct CDIC-insured account.',
  '{"fee_waiver_note":"C$0/mo — no fee, no minimum balance required","interest_rate_pct":1.5,"cdic_protected":true,"cdic_note":"","intl_payments":false,"intl_payments_note":"No dedicated international/cross-border payment product as of this research","accounting_integrations":[],"trustpilot_rating":4.1,"trustpilot_count":3400,"trustpilot_note":"trustpilot.com/review/eqbank.ca — the rating reflects EQ Bank overall, not the business product specifically; personal-banking reviews dominate the sample","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.eqbank.ca/business-banking', false, 'Cost-conscious digital-first businesses', 2,
  'https://www.eqbank.ca/business-banking/business-account', DATE '2026-07-11', true
),
(
  NULL, 'float-business', 'ca', 'business-banking', 'business-bank-accounts', 'Float', 'The deepest accounting-software integration — with an indirect CDIC structure',
  8.3, 4.4, 210, 210, 0,
  '[{"type":"sky","label":"Best accounting integration"}]'::jsonb,
  ARRAY['QuickBooks, Xero & NetSuite native sync', 'C$0/mo, no minimum balance', '⚠ Indirect CDIC via Scotiabank trust']::text[],
  ARRAY['The deepest accounting-software integration of any candidate — native QuickBooks Online, Xero and NetSuite sync', 'No monthly fee and strong corporate-card/expense-management tooling built in', 'Well-reviewed on Trustpilot (4.4/5) for product experience and support'],
  ARRAY['Not itself a CDIC member — it is a registered Money Services Business, and customer funds sit in a trust account at Scotiabank, capping protection at $100,000 combined across CAD and USD (versus per-category coverage at a direct bank)', 'No physical branch access, and cross-border/FX support is narrower than the Big Five banks'],
  '{"fees":9.8,"protection":6.4,"integrations":10.0,"support":8.4}'::jsonb,
  'The deepest accounting automation — understand the indirect CDIC structure first.',
  '{"fee_waiver_note":"C$0/mo — no fee, no minimum balance required","interest_rate_pct":0,"cdic_protected":false,"cdic_note":"Float is a registered Money Services Business, not a CDIC member bank. Customer CAD/USD funds are held in trust AT SCOTIABANK (the actual CDIC member), giving indirect protection capped at $100,000 COMBINED across both currencies — a materially different, lower-ceiling structure than a direct bank account.","intl_payments":true,"intl_payments_note":"Multi-currency accounts and international wire support built into the core product","accounting_integrations":["QuickBooks Online","Xero","NetSuite"],"trustpilot_rating":4.4,"trustpilot_count":210,"trustpilot_note":"trustpilot.com/review/float.com","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.float.com/', true, 'Finance teams wanting deep accounting-software sync', 3,
  'https://www.float.com/pricing', DATE '2026-07-11', true
),
(
  NULL, 'bmo-business', 'ca', 'business-banking', 'business-bank-accounts', 'BMO Business', 'A formal Xero partnership alongside QuickBooks support',
  8.0, 0, 0, 0, 4,
  '[]'::jsonb,
  ARRAY['C$4/mo entry tier (new pricing effective March 2026)', 'Formal Xero partnership + QuickBooks', 'Direct CDIC-insured bank']::text[],
  ARRAY['One of few banks with a formal Xero accounting partnership, plus QuickBooks support', 'Low entry-tier fee among the Big Five, waivable at a modest minimum balance', 'Direct CDIC-member bank with national branch coverage'],
  ARRAY['New fee schedule takes effect March 2026 — confirm current pricing directly, as older reviews may cite the prior schedule', 'No independent, reliable Trustpilot sample found for the business product specifically'],
  '{"fees":8.4,"protection":9.6,"integrations":8.2,"support":7.8}'::jsonb,
  'A strong balance of low entry cost and genuine accounting integration.',
  '{"fee_waiver_note":"C$4/mo Business Basic tier (effective March 2026 fee schedule), waivable at a $5,000+ minimum balance","interest_rate_pct":0,"cdic_protected":true,"cdic_note":"","intl_payments":true,"intl_payments_note":"BMO cross-border banking for businesses trading with the US","accounting_integrations":["Xero","QuickBooks"],"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated","regulatory_note":"BMO''s business account fee schedule changes on 1 March 2026 — figures above reflect the new schedule; verify against BMO''s official pricing page for the most current terms."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.bmo.com/en-ca/main/business/accounts-services/bank-accounts/', false, 'Businesses using Xero wanting a bank-native integration', 4,
  'https://www.bmo.com/en-ca/main/business/accounts-services/bank-accounts/business-basic/', DATE '2026-07-11', true
),
(
  NULL, 'scotiabank-business', 'ca', 'business-banking', 'business-bank-accounts', 'Scotiabank Business', 'A well-established option with strong US/international banking ties',
  7.6, 0, 0, 0, 14.95,
  '[]'::jsonb,
  ARRAY['C$14.95/mo, waivable at $10,000+ balance', 'Strong cross-border US banking ties', 'Direct CDIC-insured bank']::text[],
  ARRAY['Direct CDIC-member bank with an established international/cross-border banking network (Scotiabank operates across the Americas)', 'Full branch network across Canada'],
  ARRAY['Higher entry-tier fee than BMO, RBC or the digital-only options', 'No dedicated accounting-software integration found for the base business account, and no independent Trustpilot sample specific to the business product'],
  '{"fees":7.0,"protection":9.6,"integrations":5.0,"support":7.6}'::jsonb,
  'A solid, if pricier, direct-bank option with strong cross-border ties.',
  '{"fee_waiver_note":"C$14.95/mo Right Size Business account, waivable at a $10,000+ minimum balance","interest_rate_pct":0,"cdic_protected":true,"cdic_note":"","intl_payments":true,"intl_payments_note":"Scotiabank''s Americas network supports US and Latin American cross-border banking","accounting_integrations":[],"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.scotiabank.com/ca/en/small-business/bank-accounts.html', false, 'Businesses needing US or LatAm cross-border banking', 5,
  'https://www.scotiabank.com/ca/en/small-business/bank-accounts/chequing-accounts.html', DATE '2026-07-11', true
),
(
  NULL, 'td-business', 'ca', 'business-banking', 'business-bank-accounts', 'TD Business', 'Embedded-banking automation — with a disclosed 2025 compliance record',
  6.8, 0, 0, 0, 6,
  '[]'::jsonb,
  ARRAY['C$6/mo, waivable at $5,000+ balance', 'TD Embedded Banking (via FISPAN)', '⚠ Disclosed 2025 AML & FCAC penalties — see detail']::text[],
  ARRAY['TD Embedded Banking (built on FISPAN) offers genuine automation beyond a simple bank feed', 'Low entry-tier fee among the Big Five, historically long branch hours'],
  ARRAY['TD pleaded guilty and paid approximately US$3.09 billion in a 2024-finalized US anti-money-laundering case, still part of its recent compliance record through 2025-26', "Canada's FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products, including small-business loans"],
  '{"fees":8.0,"protection":9.6,"integrations":8.4,"support":7.4}'::jsonb,
  'Strong accounting automation — weigh the disclosed 2025 compliance record.',
  '{"fee_waiver_note":"C$6/mo Basic Business Plan, waivable at a $5,000+ minimum balance","interest_rate_pct":0,"cdic_protected":true,"cdic_note":"","intl_payments":true,"intl_payments_note":"TD Embedded Banking via FISPAN supports automated cross-border and domestic payment workflows","accounting_integrations":["TD Embedded Banking (FISPAN)"],"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated","regulatory_note":"TD Bank pleaded guilty and paid approximately US$3.09 billion in a US anti-money-laundering case (finalized 2024, still relevant through 2025-26). Canada''s FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products, including small-business loans. Disclosed in full; TD is not our top pick as a result."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.td.com/ca/en/business-banking/small-business/bank-accounts', false, 'Embedded-banking automation, compliance record aware', 6,
  'https://www.td.com/ca/en/business-banking/small-business/bank-accounts/basic-business-plan', DATE '2026-07-11', true
),
(
  NULL, 'national-bank-business', 'ca', 'business-banking', 'business-bank-accounts', 'National Bank Business', 'Strong Quebec/Eastern Canada presence, new pricing lands August 2026',
  7.2, 0, 0, 0, 24.95,
  '[]'::jsonb,
  ARRAY['C$24.95/mo (new pricing effective August 2026)', 'Strong Quebec & Eastern Canada branch network', 'Direct CDIC-insured bank']::text[],
  ARRAY['Direct CDIC-member bank with a particularly strong branch presence in Quebec and Eastern Canada', 'National Bank was previously a minority shareholder in the robo-advisor Nest Wealth, reflecting a genuine fintech-partnership track record'],
  ARRAY['Highest entry-tier fee of the 7 candidates, and a new, higher fee schedule takes effect August 2026', 'No dedicated accounting-software integration found for the base business account, and no independent Trustpilot sample specific to the business product'],
  '{"fees":6.2,"protection":9.6,"integrations":5.0,"support":7.4}'::jsonb,
  'A regional strength pick for Quebec and Eastern Canada — confirm the August 2026 pricing change.',
  '{"fee_waiver_note":"C$24.95/mo standard business account; new fee schedule effective August 2026 — waiver conditions vary by tier","interest_rate_pct":0,"cdic_protected":true,"cdic_note":"","intl_payments":true,"intl_payments_note":"Standard international wire support; no dedicated embedded-banking product found","accounting_integrations":[],"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated","regulatory_note":"National Bank''s business account fee schedule changes on 1 August 2026 — figures above reflect the pre-change schedule at time of research; verify against National Bank''s official pricing page closer to that date."}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.nbc.ca/business/bank-accounts.html', false, 'Businesses based in Quebec or Eastern Canada', 7,
  'https://www.nbc.ca/business/bank-accounts/all-accounts.html', DATE '2026-07-11', true
)
ON CONFLICT (market, category, topic, slug) DO UPDATE SET
  display_name = EXCLUDED.display_name, tagline = EXCLUDED.tagline, score = EXCLUDED.score,
  rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, clicks = EXCLUDED.clicks,
  monthly_fee = EXCLUDED.monthly_fee,
  badges = EXCLUDED.badges, chips = EXCLUDED.chips, pros = EXCLUDED.pros, cons = EXCLUDED.cons,
  sub_scores = EXCLUDED.sub_scores, verdict = EXCLUDED.verdict, attributes = EXCLUDED.attributes,
  source_type = EXCLUDED.source_type, confidence = EXCLUDED.confidence,
  is_affiliate = EXCLUDED.is_affiliate, review_slug = EXCLUDED.review_slug,
  external_url = EXCLUDED.external_url, is_top_pick = EXCLUDED.is_top_pick,
  best_for = EXCLUDED.best_for, display_order = EXCLUDED.display_order,
  source_url = EXCLUDED.source_url, data_verified_at = EXCLUDED.data_verified_at, active = EXCLUDED.active;
