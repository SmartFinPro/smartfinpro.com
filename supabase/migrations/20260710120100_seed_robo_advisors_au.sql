-- Comparison Cockpit — seed AU robo-advisors & micro-investing (market='au', topic='robo-advisors').
-- Visit-only launch (AU/CA/UK rollout, Stage 1 Slice AU-1): affiliate_link_id NULL,
-- is_affiliate=false, review_slug NULL, external_url = provider homepage.
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- lib/comparison/topics/au/robo-advisors.ts (auRoboAdvisorsAttributesSchema).
-- rating/review_count = 0 where no independently verified consumer-review
-- pair (rating + count from the SAME source) exists — cockpit-card/table/
-- compare already render reviewCount===0 as "Not yet rated" rather than a
-- misleading 0-star claim (see ai-tools-finance.ts precedent).
-- Provenance: docs/superpowers/specs/2026-07-10-best-x-au-ca-uk-country-shortlist.md
-- (AU section 5) + live research 2026-07-10 (official pricing pages, ASIC AFSL register).

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, management_fee, account_minimum,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'stockspot', 'au', 'personal-finance', 'robo-advisors', 'Stockspot', 'Australia''s largest robo-advisor, with your own CHESS HIN',
  9.3, 0, 0, 0, 0.12, 1000,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['Own HIN — CHESS-sponsored','A$1/month up to $20,000','5 sustainable portfolio options']::text[],
  ARRAY['Individually CHESS-sponsored — ETFs held directly in your own name','Only A$1/month up to A$20,000, the cheapest full-portfolio robo entry','Largest, longest-running Australian robo-advisor with sustainable variants of all 5 strategies']::text[],
  ARRAY['A$1,000 minimum investment','Above A$20,000, fees rise to roughly 0.66% p.a.']::text[],
  '{"fees":9.4,"features":9.2,"ux":9.0,"support":8.8}'::jsonb,
  'The best all-round Australian robo-advisor — real ownership, low entry cost, long track record.',
  '{"fee_structure_note":"A$1/month for balances up to A$20,000; tiered percentage fees above that (roughly 0.66% mid-tier, down to 0.396% p.a. above A$2M), inclusive of GST, no brokerage charged separately.","ownership_model":"chess","ethical_option":true,"super_option":true,"round_ups":false,"auto_invest":true,"afsl_or_licence":"AFSL 536082","portfolio_count":10,"app_rating":null,"app_rating_note":"Trustpilot shows an aggregate \"Excellent\" rating (4.9) but a verified review count could not be independently confirmed"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.stockspot.com.au/', true, 'Most investors', 1,
  'https://www.stockspot.com.au/how-it-works/pricing/', DATE '2026-07-10', true
),
(
  NULL, 'raiz-invest', 'au', 'personal-finance', 'robo-advisors', 'Raiz Invest', 'Australia''s best-known spare-change investing app',
  8.8, 4.7, 33000, 33000, 0.66, 5,
  '[{"type":"green","label":"Best for spare change"}]'::jsonb,
  ARRAY['Round-ups from A$5','Investing + Super + Kids in one app','No brokerage or withdrawal fees']::text[],
  ARRAY['Fully automated round-up and recurring-deposit investing from just A$5','Ecosystem of investing, super (Raiz Invest Super) and Raiz Kids','No brokerage, trading, switching or withdrawal fees, unlimited transactions'],
  ARRAY['Flat monthly fee is expensive on small balances (A$66/yr ≈ 1.32% on A$5,000)','Custodial/pooled fund structure — no direct ownership of the underlying ETFs'],
  '{"fees":7.8,"features":9.0,"ux":9.2,"support":8.2}'::jsonb,
  'The default choice for hands-off, automated spare-change investing.',
  '{"fee_structure_note":"Lite plan A$2.50/month (max 3 portfolios, auto-upgrades to Regular above A$1,500); Regular from A$5.50/month plus 0.275% p.a. above A$26,000; Plus from A$6.50/month plus 0.275% p.a. above A$28,000; no fee at $0 balance; no brokerage, trading or withdrawal fees.","ownership_model":"custodial","ethical_option":true,"super_option":true,"round_ups":true,"auto_invest":true,"afsl_or_licence":"AFSL 434776 (Instreet Investment Limited, Responsible Entity)","portfolio_count":8,"app_rating":4.7,"app_rating_note":"Apple App Store AU, ~33,000 ratings (Raiz-cited figure, Dec 2022)"}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://raizinvest.com.au/', false, 'Spare-change investing beginners', 2,
  'https://raizinvest.com.au/fees', DATE '2026-07-10', true
),
(
  NULL, 'commsec-pocket', 'au', 'personal-finance', 'robo-advisors', 'CommSec Pocket', 'CHESS-sponsored micro-investing from the Commonwealth Bank',
  8.6, 0, 0, 0, 0.24, 50,
  '[{"type":"sky","label":"Best CHESS-sponsored starter"}]'::jsonb,
  ARRAY['Own HIN — CHESS-sponsored','No ongoing management fee','$0 brokerage promo until 30 Oct 2026']::text[],
  ARRAY['CHESS-sponsored with your own HIN — real ownership, backed by a big-four bank','No ongoing management fee at all, just A$2 per trade (currently $0 under a promo)','Seamless CommBank app integration from just A$50'],
  ARRAY['Only 10 fixed themed ETFs, no diversified managed portfolio or rebalancing','No round-ups — A$2 brokerage is proportionally expensive on very small, frequent trades'],
  '{"fees":8.8,"features":6.8,"ux":9.0,"support":8.0}'::jsonb,
  'The best CHESS-sponsored entry point for beginners who want real ownership from a trusted bank.',
  '{"fee_structure_note":"No management fee. Brokerage A$2.00 per trade up to A$1,000, then 0.20% per trade, plus underlying ETF MERs. Promotional $0 brokerage on CommSec Pocket trades from 20 Apr 2026 to 30 Oct 2026.","ownership_model":"chess","ethical_option":true,"super_option":false,"round_ups":false,"auto_invest":true,"afsl_or_licence":"AFSL 238814 (Commonwealth Securities Limited)","portfolio_count":10,"app_rating":null,"app_rating_note":"No independently verified consumer-review count found at research time"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.commsec.com.au/products/pocket.html', false, 'CHESS ownership on a small budget', 3,
  'https://www.commbank.com.au/investing/commsec-pocket-etfs.html', DATE '2026-07-10', true
),
(
  NULL, 'spaceship-voyager', 'au', 'personal-finance', 'robo-advisors', 'Spaceship Voyager', 'No-minimum micro-investing in themed growth portfolios',
  8.4, 4.4, 8000, 8000, 0.36, 0,
  '[]'::jsonb,
  ARRAY['No minimum investment','$0 fee under A$100','5 themed portfolios']::text[],
  ARRAY['No minimum investment at all, and $0/month while your balance stays under A$100','One flat A$3/month fee covers up to 5 portfolios','Growth-oriented themed portfolios (tech, positive-impact) with a clear per-portfolio fee scale'],
  ARRAY['Only 5 fixed portfolios, no individual customisation','Custodial managed-fund structure — no CHESS/HIN ownership, plus a portfolio fee on top of the platform fee'],
  '{"fees":8.2,"features":7.8,"ux":8.8,"support":7.6}'::jsonb,
  'The easiest way to start with literally nothing to invest yet.',
  '{"fee_structure_note":"A$3/month once any portfolio reaches A$100 (covers up to 5 portfolios); $0/month below A$100 total balance; plus a per-portfolio management fee of 0.15%-0.50% p.a. built into the unit price; no brokerage, withdrawal or transaction fees.","ownership_model":"custodial","ethical_option":true,"super_option":true,"round_ups":true,"auto_invest":true,"afsl_or_licence":"AFSL 501605 (Spaceship Capital Limited; acquired by eToro 2025, brand retained)","portfolio_count":5,"app_rating":4.4,"app_rating_note":"Apple App Store AU, ~8,000 ratings"}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.spaceship.com.au/voyager/', false, 'Starting with less than $100', 4,
  'https://help.spaceship.com.au/en/articles/5694014-what-are-the-fees-for-spaceship-voyager', DATE '2026-07-10', true
),
(
  NULL, 'sharesies-au', 'au', 'personal-finance', 'robo-advisors', 'Sharesies', 'Fractional shares across AU, US and NZ markets',
  8.0, 0, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['ASX, US & NZX access','Fractional shares, no minimum','Capped transaction fees']::text[],
  ARRAY['Access to three markets (ASX, US, NZX) with fractional shares and no minimum balance','Predictable costs via monthly plans that include auto-invest and round-ups','Transaction fees capped at A$6 per AU order'],
  ARRAY['1.9% pay-as-you-go transaction fee makes very small orders proportionally expensive','Custodial model — shares held via a pooled nominee (Sharesies Australia Nominee), not an individual CHESS HIN'],
  '{"fees":7.4,"features":8.6,"ux":8.0,"support":7.2}'::jsonb,
  'The pick for fractional access to Australian, US and New Zealand shares in one account.',
  '{"fee_structure_note":"No management fee. Pay-as-you-go: 1.9% per trade, capped at A$6 (AU), US$5 (US) or NZ$25 (NZ); or monthly plans from A$5-$20 covering set buy/sell and auto-invest limits; 0.6% FX fee; A$50 per investment to transfer shares out.","ownership_model":"custodial","ethical_option":true,"super_option":false,"round_ups":true,"auto_invest":true,"afsl_or_licence":"AFSL 529893 (Sharesies Australia Limited)","portfolio_count":null,"app_rating":null,"app_rating_note":"Trustpilot shows \"Average\" (3.7) but a verified review count could not be independently confirmed"}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://sharesies.com.au/', false, 'Fractional shares across 3 markets', 5,
  'https://sharesies.com.au/pricing', DATE '2026-07-10', true
),
(
  NULL, 'pearler-micro', 'au', 'personal-finance', 'robo-advisors', 'Pearler Micro', 'The cheapest flat-fee micro-investing app, with heavy automation',
  8.2, 0, 0, 0, 0.24, 5,
  '[]'::jsonb,
  ARRAY['A$2/month flat, 2 months free','Round-ups, schedules & auto-rebalance','Upgrade path to CHESS-sponsored Pearler Shares']::text[],
  ARRAY['Cheapest flat fee in the micro-investing segment (A$2/month, first 2 months free)','The most extensive automation suite: round-ups, scheduled deposits, auto-rebalancing, thresholds','Clear upgrade path to CHESS-sponsored Pearler Shares for long-term investors'],
  ARRAY['Micro assets are fund units (custodial), not CHESS-sponsored like Pearler''s main Shares product','Licensed via a chain of authorised representatives rather than its own AFSL'],
  '{"fees":9.0,"features":9.0,"ux":8.4,"support":7.4}'::jsonb,
  'The best automation-first pick for disciplined, FIRE-minded savers starting small.',
  '{"fee_structure_note":"Flat A$2.00/month regardless of number of funds held, first 2 months free; no brokerage on buys/sells; plus the costs of the underlying ETFs held inside the Pearler Investors Fund wrapper.","ownership_model":"custodial","ethical_option":false,"super_option":true,"round_ups":true,"auto_invest":true,"afsl_or_licence":"Authorised Representative (1281540) of Sanlam Private Wealth Pty Ltd, AFSL 337927; fund issued by Cache (RE Services) Ltd, AFSL 494886","portfolio_count":10,"app_rating":null,"app_rating_note":"Trustpilot has only 4 reviews (2.7★) — too small a sample to display, treated as not yet rated"}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://pearler.com/micro', false, 'Automated, FIRE-minded savers', 6,
  'https://pearler.com/pricing', DATE '2026-07-10', true
),
(
  NULL, 'investsmart-pma', 'au', 'personal-finance', 'robo-advisors', 'InvestSMART', 'A managed ETF portfolio with fees capped at A$880/year',
  7.8, 0, 0, 0, 0.44, 10000,
  '[]'::jsonb,
  ARRAY['Fee capped at A$880/year','CHESS-sponsored, transferable holdings','No performance fees']::text[],
  ARRAY['Unique fee cap — never more than A$880/year regardless of balance size','CHESS-sponsored brokerage account with holdings you can transfer, not a pooled fund','No performance fees, and buy-side brokerage is included in the fee'],
  ARRAY['A$10,000 minimum — no micro-investing entry point','0.44% p.a. is not cheaper than flat-fee apps at smaller balances, plus sell-side brokerage'],
  '{"fees":8.6,"features":7.6,"ux":7.2,"support":7.4}'::jsonb,
  'The best value once your balance is large enough that the fee cap kicks in.',
  '{"fee_structure_note":"0.44% p.a. on balances up to A$200,000, capped at A$880/year above that — includes buy-side brokerage; sell-side brokerage is the greater of A$4.40 or 0.044% of trade value; indirect ETF costs 0.05%-0.23% p.a.; no performance fees.","ownership_model":"chess","ethical_option":true,"super_option":false,"round_ups":false,"auto_invest":null,"afsl_or_licence":"AFSL 226435 (InvestSMART Financial Services Pty Limited)","portfolio_count":12,"app_rating":null,"app_rating_note":"No independently verified consumer-review count found at research time"}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.investsmart.com.au/', false, 'Larger balances (fee cap)', 7,
  'https://www.investsmart.com.au/capped-fees', DATE '2026-07-10', true
)
ON CONFLICT (market, category, topic, slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  tagline = EXCLUDED.tagline,
  score = EXCLUDED.score,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  clicks = EXCLUDED.clicks,
  management_fee = EXCLUDED.management_fee,
  account_minimum = EXCLUDED.account_minimum,
  badges = EXCLUDED.badges,
  chips = EXCLUDED.chips,
  pros = EXCLUDED.pros,
  cons = EXCLUDED.cons,
  sub_scores = EXCLUDED.sub_scores,
  verdict = EXCLUDED.verdict,
  attributes = EXCLUDED.attributes,
  source_type = EXCLUDED.source_type,
  confidence = EXCLUDED.confidence,
  is_affiliate = EXCLUDED.is_affiliate,
  review_slug = EXCLUDED.review_slug,
  external_url = EXCLUDED.external_url,
  is_top_pick = EXCLUDED.is_top_pick,
  best_for = EXCLUDED.best_for,
  display_order = EXCLUDED.display_order,
  source_url = EXCLUDED.source_url,
  data_verified_at = EXCLUDED.data_verified_at,
  active = EXCLUDED.active;
