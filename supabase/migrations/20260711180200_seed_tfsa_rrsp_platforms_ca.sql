-- Comparison Cockpit — seed CA tfsa-rrsp-platforms (market='ca',
-- category='tax-efficient-investing', CA-exclusive topic).
-- Visit-only launch (AU/CA/UK rollout, Stage 2 Slice CA-1): affiliate_link_id
-- NULL, is_affiliate=false, review_slug NULL, external_url = provider
-- homepage. Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- caTfsaRrspAttributesSchema. monthly_fee holds the monthly-ized registered-
-- account maintenance fee; commission_per_trade_cad is a separate,
-- non-recurring per-trade cost (see file header in
-- lib/comparison/topics/ca/tfsa-rrsp-platforms.ts for the costModel
-- rationale, mirroring the US trading-platforms.ts precedent).
-- Provenance: live research 2026-07-11 against official pricing pages,
-- CIRO, CIPF.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, monthly_fee,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'wealthsimple-trade', 'ca', 'tax-efficient-investing', 'tfsa-rrsp-platforms', 'Wealthsimple Trade', '$0 commissions, $0 account fee, the broadest account-type support',
  9.0, 1.4, 610, 610, 0,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['$0 commission on CA/US stocks & ETFs', '$0 account fee, no minimum', 'TFSA, RRSP, FHSA & non-registered']::text[],
  ARRAY['$0 commission on Canadian and US stock/ETF trades with no account maintenance fee at all', 'Broadest account-type support of the 7 candidates (TFSA, RRSP, FHSA, non-registered)', 'Simple, well-known mobile-first platform'],
  ARRAY['Trustpilot score is poor (1.4/5), driven mainly by account-freeze and support-speed complaints across Wealthsimple''s broader product suite, not specifically the trading product', 'Research tools are minimal compared to the bank-owned brokers'],
  '{"cost":10.0,"accounts":9.4,"research":6.0,"support":6.6}'::jsonb,
  'The lowest-cost, broadest-account-support self-directed brokerage in this comparison.',
  '{"commission_per_trade_cad":0,"fee_waiver_note":"No account fee at any balance — $0 by default","account_types":["TFSA","RRSP","FHSA","Non-registered"],"cipf_protected":true,"research_tools_note":"Basic charting and company snapshots; no bundled third-party research service","trustpilot_rating":1.4,"trustpilot_count":610,"trustpilot_note":"ca.trustpilot.com — figure fluctuated 597-657 across snapshots, many reviews conflate Wealthsimple''s broader banking/crypto products with the trading product specifically","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.wealthsimple.com/en-ca/product/trade', true, 'DIY investors wanting the simplest, lowest-cost option', 1,
  'https://www.wealthsimple.com/en-ca/pricing', DATE '2026-07-11', true
),
(
  NULL, 'qtrade-direct-investing', 'ca', 'tax-efficient-investing', 'tfsa-rrsp-platforms', 'Qtrade Direct Investing', 'Eliminated commissions and its account fee in October 2025',
  8.8, 0, 0, 0, 0,
  '[{"type":"sky","label":"Most improved / best research"}]'::jsonb,
  ARRAY['$0 commission since Oct 2025', '$0 account fee since Oct 2025', 'Morningstar + Recognia research suite']::text[],
  ARRAY['Eliminated both trading commissions and its CAD account maintenance fee in October 2025 — a genuine, verified, recent improvement', 'Bundles Morningstar research and Recognia technical-analysis tools, plus a portfolio-planning suite', 'Consistently wins independent third-party investor-satisfaction awards'],
  ARRAY['No independent, reliable Trustpilot sample found specifically for Qtrade', 'Smaller brand recognition than the bank-owned brokers or Wealthsimple/Questrade'],
  '{"cost":10.0,"accounts":8.6,"research":9.4,"support":8.4}'::jsonb,
  'The strongest research toolkit among the commission-free platforms.',
  '{"commission_per_trade_cad":0,"fee_waiver_note":"Account fee eliminated entirely as of October 2025 — $0 regardless of balance","account_types":["TFSA","RRSP","FHSA","RESP","RRIF","Non-registered"],"cipf_protected":true,"research_tools_note":"Morningstar research reports plus Recognia technical-analysis screening and a portfolio-planning suite","trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, independent Trustpilot sample found for Qtrade specifically — shown as not yet rated","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.qtrade.ca/en/investor/', true, 'DIY investors wanting strong research + $0 commissions', 2,
  'https://www.qtrade.ca/en/investor/pricing/commissions-and-fees', DATE '2026-07-11', true
),
(
  NULL, 'questrade-self-directed', 'ca', 'tax-efficient-investing', 'tfsa-rrsp-platforms', 'Questrade', 'The lowest ongoing cost structure for active DIY traders',
  8.6, 1.3, 393, 393, 0,
  '[{"type":"green","label":"Best for active traders"}]'::jsonb,
  ARRAY['$0 commission on CA/US stocks & ETFs', '$0 account fee', 'Questrade Edge with TipRanks analyst ratings']::text[],
  ARRAY['$0 commission on stock/ETF trades with no account maintenance fee, and low per-contract options pricing for active traders', 'Questrade Edge trading platform includes TipRanks-powered analyst ratings and screening tools', 'Backed by an established, long-running Canadian brokerage'],
  ARRAY['Consistently poor Trustpilot score (1.3/5, ~84% one-star), with complaints about frozen accounts and slow support', 'Questrade disclosed 2026 layoffs (100+ staff) — a service-continuity consideration to weigh, not a solvency issue'],
  '{"cost":10.0,"accounts":8.6,"research":8.6,"support":6.2}'::jsonb,
  'The best cost structure for traders who transact often, backed by a real analyst-ratings toolkit.',
  '{"commission_per_trade_cad":0,"fee_waiver_note":"No account fee at any balance — $0 by default","account_types":["TFSA","RRSP","FHSA","RESP","RRIF","Non-registered"],"cipf_protected":true,"research_tools_note":"Questrade Edge platform with TipRanks-powered analyst ratings and screening tools","trustpilot_rating":1.3,"trustpilot_count":393,"trustpilot_note":"ca.trustpilot.com — \"Bad\" rating, review count varied 323-393 across snapshots","regulatory_note":"Questrade disclosed 2026 layoffs affecting 100+ staff, cited in some customer reviews as context for slower support response times. This is a staffing/service-continuity matter, not a solvency or regulatory enforcement issue."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.questrade.com/', false, 'Active traders wanting the lowest ongoing cost', 3,
  'https://www.questrade.com/pricing/commissions-fees', DATE '2026-07-11', true
),
(
  NULL, 'rbc-direct-investing', 'ca', 'tax-efficient-investing', 'tfsa-rrsp-platforms', 'RBC Direct Investing', 'Recently eliminated its account fee entirely, regardless of balance',
  7.8, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['$9.95/trade standard (from $6.95 at high volume)', '$0 account fee (eliminated, any balance)', 'Backed by Canada''s largest bank']::text[],
  ARRAY['RBC has genuinely eliminated its account maintenance fee entirely regardless of balance — a verified, recent improvement over older reviews that may still cite a fee', 'Backed by RBC''s brand, branch network and human-advisor access if needed'],
  ARRAY['Standard commission (C$9.95) is meaningfully higher than the three commission-free candidates', 'No independent, reliable Trustpilot sample found specifically for the direct-investing product'],
  '{"cost":6.6,"accounts":8.0,"research":7.6,"support":8.2}'::jsonb,
  'A big-bank broker that has removed its account fee — commission remains standard-tier.',
  '{"commission_per_trade_cad":9.95,"fee_waiver_note":"Account fee eliminated entirely as of this research — $0 regardless of balance","account_types":["TFSA","RRSP","RESP","RRIF","Non-registered"],"cipf_protected":true,"research_tools_note":"RBC Direct Investing research centre with third-party analyst reports","trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, independent Trustpilot sample found for RBC Direct Investing specifically — shown as not yet rated","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.rbcdirectinvesting.com/', false, 'Existing RBC customers wanting an integrated brokerage', 4,
  'https://www.rbcdirectinvesting.com/pricing.html', DATE '2026-07-11', true
),
(
  NULL, 'td-direct-investing', 'ca', 'tax-efficient-investing', 'tfsa-rrsp-platforms', 'TD Direct Investing', 'Bundled Morningstar research — weigh TD''s disclosed 2025 compliance record',
  6.9, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['$9.99/trade standard (from $7.00 at high volume)', 'Bundled Morningstar research', '⚠ Disclosed 2025 AML & FCAC penalties — see detail']::text[],
  ARRAY['Bundled Morningstar research reports at no extra cost', 'Account fee waived at a modest balance/trade threshold, backed by TD''s branch network'],
  ARRAY['TD pleaded guilty and paid approximately US$3.09 billion in a 2024-finalized US anti-money-laundering case, still part of its recent compliance record through 2025-26', "Canada's FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products", 'Standard commission (C$9.99) is the highest among the 7 candidates'],
  '{"cost":6.2,"accounts":8.0,"research":8.4,"support":7.4}'::jsonb,
  'Strong bundled research — weigh the disclosed 2025 compliance record.',
  '{"commission_per_trade_cad":9.99,"fee_waiver_note":"Registered-account fee waived at a $15,000+ balance or minimum annual trade count","account_types":["TFSA","RRSP","RESP","RRIF","Non-registered"],"cipf_protected":true,"research_tools_note":"Bundled Morningstar research reports at no extra cost","trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, independent Trustpilot sample found for TD Direct Investing specifically — shown as not yet rated","regulatory_note":"TD Bank pleaded guilty and paid approximately US$3.09 billion in a US anti-money-laundering case (finalized 2024, still relevant through 2025-26). Canada''s FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products. Disclosed in full; TD is not our top pick as a result."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.td.com/ca/en/investing/direct-investing', false, 'Bundled-research investors, compliance-aware', 5,
  'https://www.td.com/ca/en/investing/direct-investing/pricing', DATE '2026-07-11', true
),
(
  NULL, 'bmo-investorline', 'ca', 'tax-efficient-investing', 'tfsa-rrsp-platforms', 'BMO InvestorLine', 'A straightforward big-bank brokerage with a Xero-adjacent ecosystem',
  7.2, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['$9.95/trade standard (from $3.95 at high volume)', 'Account fee waived at a modest balance', 'Backed by BMO''s branch network']::text[],
  ARRAY['Commission drops meaningfully at high trading volume (as low as C$3.95/trade)', 'Backed by BMO''s branch network and customer service infrastructure'],
  ARRAY['Standard commission (C$9.95) is well above the commission-free candidates for typical trading volumes', 'No independent, reliable Trustpilot sample found specifically for InvestorLine, and research tools are more basic than TD or Qtrade'],
  '{"cost":6.6,"accounts":7.6,"research":6.8,"support":7.6}'::jsonb,
  'A standard big-bank brokerage option, best at higher trading volumes.',
  '{"commission_per_trade_cad":9.95,"fee_waiver_note":"Registered-account fee waived at a $25,000+ balance or minimum annual trade count","account_types":["TFSA","RRSP","RESP","RRIF","Non-registered"],"cipf_protected":true,"research_tools_note":"Standard third-party analyst reports; no bundled premium research suite","trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, independent Trustpilot sample found for BMO InvestorLine specifically — shown as not yet rated","regulatory_note":""}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.bmo.com/main/investments/investorline/', false, 'High-volume traders wanting BMO''s volume discount', 6,
  'https://www.bmo.com/main/investments/investorline/pricing/', DATE '2026-07-11', true
),
(
  NULL, 'scotia-itrade', 'ca', 'tax-efficient-investing', 'tfsa-rrsp-platforms', 'Scotia iTRADE', 'The smallest of the bank-owned brokerages in this comparison',
  6.6, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['$9.99/trade standard (from $4.99 at high volume)', 'Account fee waived at a modest balance', 'Backed by Scotiabank''s branch network']::text[],
  ARRAY['Backed by Scotiabank''s branch network and established brokerage infrastructure', 'Commission drops at high trading volume, similar to peer bank brokers'],
  ARRAY['Standard commission (C$9.99) matches the highest in this comparison', 'No independent, reliable Trustpilot sample found specifically for iTRADE, and its research toolkit is less distinctive than TD''s or Qtrade''s'],
  '{"cost":6.2,"accounts":7.6,"research":6.4,"support":7.2}'::jsonb,
  'A standard bank-owned brokerage — no strong differentiator versus its bank-broker peers.',
  '{"commission_per_trade_cad":9.99,"fee_waiver_note":"Registered-account fee waived at a $25,000+ balance or minimum annual trade count","account_types":["TFSA","RRSP","RESP","RRIF","Non-registered"],"cipf_protected":true,"research_tools_note":"Standard third-party analyst reports; no bundled premium research suite","trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No reliable, independent Trustpilot sample found for Scotia iTRADE specifically — shown as not yet rated","regulatory_note":""}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.scotiaitrade.com/', false, 'Existing Scotiabank customers wanting one brokerage', 7,
  'https://www.scotiaitrade.com/pricing', DATE '2026-07-11', true
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
