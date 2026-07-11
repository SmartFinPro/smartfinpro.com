-- Comparison Cockpit — seed CA robo-advisors (market='ca', topic='robo-advisors').
-- Visit-only launch (AU/CA/UK rollout, Stage 2 Slice CA-1): affiliate_link_id NULL,
-- is_affiliate=false, review_slug NULL, external_url = provider homepage.
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- caRoboAdvisorsAttributesSchema. CI Direct Investing's operational status
-- (previously ambiguous) is confirmed live under new Mubadala Capital
-- ownership; Moka's pricing is mid-transition (Mogo -> Orion Digital rebrand)
-- with a real discrepancy between legacy and current-site figures — disclosed,
-- ranked last, not top pick.
-- Provenance: live research 2026-07-11 against official pricing pages, CIRO,
-- CIPF, Trustpilot.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, management_fee, account_minimum,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'wealthsimple-invest', 'ca', 'personal-finance', 'robo-advisors', 'Wealthsimple', 'Broadest account support, no minimum balance',
  9.0, 1.4, 610, 610, 0.50, 0,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['No minimum balance', 'FHSA, RESP, RRIF & more', 'Daily rebalancing']::text[],
  ARRAY['Broadest account-type support of any candidate (TFSA, RRSP, FHSA, RESP, RRIF, LIRA, non-registered, corporate)', 'No minimum balance and daily rebalancing', 'Largest, most recognized robo-advisor brand in Canada'],
  ARRAY['Trustpilot score is poor (1.4/5), driven mainly by account-freeze and support-speed complaints, not investment performance', 'Tax-loss harvesting is gated behind the C$100,000+ Black tier per third-party reviews (not independently confirmed on an official page)'],
  '{"fees":8.4,"features":9.4,"ux":8.6,"support":6.6}'::jsonb,
  'The most versatile robo-advisor in Canada — broadest accounts, no minimum.',
  '{"account_types":["TFSA","RRSP","FHSA","RESP","RRIF","LIRA","Non-registered","Corporate"],"regulator_type":"ciro_dealer","custodian_note":"","cipf_protected":true,"auto_rebalancing":true,"tax_loss_harvesting":true,"tlh_note":"reportedly gated behind the C$100,000+ Black tier per third-party reviews, not independently confirmed on an official Wealthsimple page","trustpilot_rating":1.4,"trustpilot_count":610,"trustpilot_note":"ca.trustpilot.com — figure fluctuated 597-657 across snapshots, many reviews conflate Wealthsimple''s broader banking/crypto products with the investing product specifically","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.wealthsimple.com/en-ca/', true, 'Most investors wanting one flexible account for everything', 1,
  'https://www.wealthsimple.com/en-ca/pricing', DATE '2026-07-11', true
),
(
  NULL, 'questwealth-portfolios', 'ca', 'personal-finance', 'robo-advisors', 'Questwealth Portfolios', 'The lowest management fee among full-service robo-advisors',
  8.7, 1.3, 393, 393, 0.25, 1000,
  '[{"type":"green","label":"Best value"}]'::jsonb,
  ARRAY['Lowest fee: 0.25% (0.20% above $100K)', 'C$1,000 minimum', 'TipRanks research integration']::text[],
  ARRAY['Lowest management fee of any full-service robo-advisor researched (0.25%, dropping to 0.20% above $100K)', 'Low C$1,000 minimum to open', 'Backed by Questrade''s established brokerage infrastructure and research tools'],
  ARRAY['Consistently poor Trustpilot score (1.3/5, ~84% one-star), with complaints about frozen accounts and slow support', 'Questrade disclosed 2026 layoffs (100+ staff) — a service-continuity concern to weigh, not a solvency issue'],
  '{"fees":9.4,"features":8.2,"ux":7.8,"support":6.2}'::jsonb,
  'The lowest-fee full-service robo-advisor in this comparison.',
  '{"account_types":["TFSA","RRSP","RESP","RRIF","FHSA"],"regulator_type":"ciro_dealer","custodian_note":"","cipf_protected":true,"auto_rebalancing":true,"tax_loss_harvesting":false,"trustpilot_rating":1.3,"trustpilot_count":393,"trustpilot_note":"ca.trustpilot.com — \"Bad\" rating, review count varied 323-393 across snapshots","regulatory_note":"Questrade disclosed 2026 layoffs affecting 100+ staff, cited in some customer reviews as context for slower support response times. This is a staffing/service-continuity matter, not a solvency or regulatory enforcement issue."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.questrade.com/questwealth-portfolios', false, 'Cost-conscious investors already using Questrade', 2,
  'https://www.questrade.com/pricing/questwealth-portfolios-fees', DATE '2026-07-11', true
),
(
  NULL, 'justwealth', 'ca', 'personal-finance', 'robo-advisors', 'Justwealth', 'The widest registered-account menu — the only one offering RDSP',
  8.5, 0, 0, 0, 0.50, 5000,
  '[{"type":"sky","label":"Best for RESP & families"}]'::jsonb,
  ARRAY['Only candidate offering RDSP', '80+ target-date & specialty portfolios', 'Dedicated portfolio manager contact']::text[],
  ARRAY['The only candidate in this comparison offering an RDSP (Registered Disability Savings Plan) alongside the standard registered-account suite', '80+ distinct model portfolios including target-date RESP and ESG options', 'Consistently well-reviewed in third-party 2026 roundups and award lists'],
  ARRAY['C$5,000 minimum — the highest of the more accessible candidates', 'A flat C$4.99/month minimum fee makes small accounts relatively expensive; no reliable Trustpilot page found to independently verify service sentiment'],
  '{"fees":8.0,"features":9.2,"ux":8.4,"support":8.6}'::jsonb,
  'The widest account-type menu of any robo-advisor researched, ideal for families.',
  '{"account_types":["TFSA","RRSP","RESP","RRIF","FHSA","LIRA","RDSP","Non-registered"],"regulator_type":"portfolio_manager","custodian_note":"CI Investment Services Inc. (formerly BBS Securities), a CIRO/CIPF member — holds custody for Justwealth''s portfolio-manager-structured accounts","cipf_protected":true,"auto_rebalancing":true,"tax_loss_harvesting":true,"tlh_note":"non-registered accounts only","trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No distinct, reliable Trustpilot page found for Justwealth specifically — shown as not yet rated rather than citing an unverified third-party aggregator score","regulatory_note":""}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.justwealth.com/', false, 'Families wanting RESP or RDSP support', 3,
  'https://www.justwealth.com/faqs/', DATE '2026-07-11', true
),
(
  NULL, 'rbc-investease', 'ca', 'personal-finance', 'robo-advisors', 'RBC InvestEase', 'Low C$100 entry point, backed by Canada''s largest bank',
  8.0, 0, 1, 1, 0.50, 100,
  '[]'::jsonb,
  ARRAY['Invests once balance reaches C$100', 'Big-bank backing (RBC)', 'Human Portfolio Advisor access']::text[],
  ARRAY['Low C$100 threshold to begin investing, with a "Starter Portfolio" for balances under $1,500', 'Backed by RBC, Canada''s largest bank, with access to a human Portfolio Advisor', '10 portfolios across 5 risk tiers x 2 styles (Standard / Responsible Investing)'],
  ARRAY['Narrower account-type support than most peers — RESP and RRIF are not confirmed as available on official pages', 'C$150 + tax fee to transfer out to a non-RBC institution'],
  '{"fees":8.0,"features":7.0,"ux":8.2,"support":8.0}'::jsonb,
  'A low-cost, bank-backed entry point — note the narrower account-type support.',
  '{"account_types":["TFSA","RRSP","FHSA","Non-registered"],"regulator_type":"ciro_dealer","custodian_note":"","cipf_protected":true,"auto_rebalancing":true,"tax_loss_harvesting":false,"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"Only 1 review found on Trustpilot — too small a sample to be meaningful, shown as not yet rated","regulatory_note":"A C$150 + tax fee applies to transfer assets out to a non-RBC institution (RBC-to-RBC transfers are free) — a real switching cost worth disclosing upfront."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.rbcinvestease.com/', false, 'Existing RBC customers wanting simplicity', 4,
  'https://www.rbcinvestease.com/pricing-fees.html', DATE '2026-07-11', true
),
(
  NULL, 'nest-wealth', 'ca', 'personal-finance', 'robo-advisors', 'Nest Wealth', 'A flat monthly fee — cheaper than a percentage fee at larger balances',
  7.6, 0, 0, 0, 0.6, 0,
  '[]'::jsonb,
  ARRAY['Flat monthly fee model', 'No minimum balance', 'Institutional pedigree (also serves banks)']::text[],
  ARRAY['Flat monthly fee (from C$5/mo under $10K up to a C$150/mo cap) can beat a percentage fee at larger balances', 'No minimum balance to open', 'Strong institutional pedigree — also powers robo-advisor infrastructure for banks'],
  ARRAY['Flat fee is expensive on very small balances (C$60/year minimum even on a few hundred dollars invested)', 'Acquired 100% by Italian fintech Objectway in January 2024, and increasingly focused on B2B (bank-facing) business — worth confirming continued retail focus before committing'],
  '{"fees":7.4,"features":8.0,"ux":7.6,"support":7.4}'::jsonb,
  'A flat-fee structure that can be the cheapest option at larger balances.',
  '{"account_types":["TFSA","RRSP","LIRA","RESP","RRIF","Non-registered","Corporate","Trust"],"regulator_type":"portfolio_manager","custodian_note":"Fidelity Clearing Canada / National Bank Independent Network, both CIRO/CIPF members — hold custody for Nest Wealth''s portfolio-manager-structured accounts","cipf_protected":true,"auto_rebalancing":true,"tax_loss_harvesting":false,"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"No distinct, reliable Trustpilot page found for Nest Wealth — shown as not yet rated","regulatory_note":"Nest Wealth was acquired 100% by Italian fintech Objectway in January 2024 (including buying out National Bank of Canada''s prior minority stake). The core retail business appears to continue unchanged as of 2026, but recent coverage suggests its consumer-facing identity has become secondary to a growing B2B (bank-facing) business — disclosed for transparency."}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.nestwealth.com/', false, 'Larger balances where a flat fee beats a percentage', 5,
  'https://www.nestwealth.com/pricing/', DATE '2026-07-11', true
),
(
  NULL, 'ci-direct-investing', 'ca', 'personal-finance', 'robo-advisors', 'CI Direct Investing', 'Confirmed operational under new Mubadala Capital ownership',
  7.4, 0, 0, 0, 0.60, 100,
  '[]'::jsonb,
  ARRAY['Confirmed operational (2026)', 'Access to alternative/private-asset portfolios', 'C$100 minimum to invest']::text[],
  ARRAY['Confirmed live and accepting new clients — actively-maintained legal disclosures (Aug 2026 update) resolve prior status ambiguity', 'Offers ESG and "Private Portfolios" (alternative assets) not available from pure-robo competitors', 'Low C$100 minimum to be invested'],
  ARRAY['Does not offer FHSA or RDSP — a real account-type gap versus peers', 'Zero independent review signal found (no Trustpilot ratings), and its parent CI Financial completed a take-private acquisition by Mubadala Capital in August 2025 — an ownership change worth knowing'],
  '{"fees":7.6,"features":8.0,"ux":7.4,"support":7.0}'::jsonb,
  'A confirmed-operational robo-advisor with unique access to alternative assets.',
  '{"account_types":["TFSA","RRSP","RESP","RRIF","LIRA","LIF","Non-registered"],"regulator_type":"portfolio_manager","custodian_note":"CI Investment Services Inc. (CIIS, formerly BBS Securities), a CIRO/CIPF member","cipf_protected":true,"auto_rebalancing":true,"tax_loss_harvesting":false,"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"Zero reviews found on Trustpilot for CI Direct Investing / WealthBar — shown as not yet rated","regulatory_note":"CI Direct Investing''s operational status was previously ambiguous in earlier research; now confirmed live and accepting new clients as of this page''s verification. Its parent, CI Financial, completed a take-private acquisition by Mubadala Capital (Abu Dhabi sovereign-wealth-linked) on 13 August 2025; CI Financial has stated it continues to operate independently with its existing structure and management post-close. No wind-down of CI Direct Investing has been announced."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.cifinancial.com/ci-di/ca/en/invest.html', false, 'Investors wanting alternative-asset access', 6,
  'https://www.cifinancial.com/ci-di/ca/en/invest/pricing.html', DATE '2026-07-11', true
),
(
  NULL, 'moka', 'ca', 'personal-finance', 'robo-advisors', 'Moka', 'Round-up micro-investing — pricing is mid-transition, see detail',
  6.4, 1.9, 15, 15, 0.10, 0,
  '[]'::jsonb,
  ARRAY['Round-up / spare-change investing', 'No minimum balance', '⚠ Active pricing transition — see detail']::text[],
  ARRAY['Unique round-up/spare-change micro-investing niche not matched by the other 6 candidates', 'No minimum balance to start — good for absolute beginners'],
  ARRAY['Parent company Mogo renamed itself Orion Digital Corp in December 2025, and the platform is actively transitioning from moka.ai to intelligentinvesting.ai with a live pricing discrepancy (legacy C$1-4/mo vs. a current-site C$20/mo membership fee) — unresolved, disclosed rather than guessed', 'Small, mostly-negative Trustpilot sample (1.9/5, 15 reviews) citing unauthorized charges and round-up features breaking after bank-link changes'],
  '{"fees":6.0,"features":7.0,"ux":6.8,"support":6.0}'::jsonb,
  'A distinctive micro-investing niche — but confirm current pricing directly before signing up.',
  '{"account_types":["TFSA","RRSP","Non-registered"],"regulator_type":"portfolio_manager","custodian_note":"CI Investment Services Inc., a CIRO/CIPF member — holds custody for managed accounts opened via IntelligentInvesting Wealth Management Inc.","cipf_protected":true,"auto_rebalancing":true,"tax_loss_harvesting":false,"trustpilot_rating":1.9,"trustpilot_count":15,"trustpilot_note":"moka.ai Trustpilot page — small sample (15 reviews), mostly negative","regulatory_note":"Mogo Inc. (Moka''s parent) renamed itself Orion Digital Corp effective 29 December 2025 (new ticker ORIO). The consumer platform previously at moka.ai now redirects to intelligentinvesting.ai, which \"unifies MogoTrade and Moka into a single brand.\" Current official pricing shows a C$20/month membership fee plus 0.10% management fee, a significant change from historic C$1-4/month round-up pricing still cited on some third-party review sites as of this research — this discrepancy is unresolved and should be reconfirmed directly before relying on either figure."}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.intelligentinvesting.ai/', false, 'Absolute beginners wanting round-up investing', 7,
  'https://help.intelligentinvesting.ai/en/articles/11138873-moka-is-a-part-of-your-intelligent-investing-experience-with-mogo', DATE '2026-07-11', true
)
ON CONFLICT (market, category, topic, slug) DO UPDATE SET
  display_name = EXCLUDED.display_name, tagline = EXCLUDED.tagline, score = EXCLUDED.score,
  rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, clicks = EXCLUDED.clicks,
  management_fee = EXCLUDED.management_fee, account_minimum = EXCLUDED.account_minimum,
  badges = EXCLUDED.badges, chips = EXCLUDED.chips, pros = EXCLUDED.pros, cons = EXCLUDED.cons,
  sub_scores = EXCLUDED.sub_scores, verdict = EXCLUDED.verdict, attributes = EXCLUDED.attributes,
  source_type = EXCLUDED.source_type, confidence = EXCLUDED.confidence,
  is_affiliate = EXCLUDED.is_affiliate, review_slug = EXCLUDED.review_slug,
  external_url = EXCLUDED.external_url, is_top_pick = EXCLUDED.is_top_pick,
  best_for = EXCLUDED.best_for, display_order = EXCLUDED.display_order,
  source_url = EXCLUDED.source_url, data_verified_at = EXCLUDED.data_verified_at, active = EXCLUDED.active;
