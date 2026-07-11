-- Comparison Cockpit — seed AU CFD trading platforms (market='au', topic='cfd-brokers').
-- Visit-only launch (AU/CA/UK rollout, Stage 1 Slice AU-2): affiliate_link_id NULL,
-- is_affiliate=false, review_slug NULL, external_url = provider homepage.
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- lib/comparison/topics/au/cfd-brokers.ts (auCfdBrokersAttributesSchema).
-- monthly_fee=0 for all rows (banking@0 pattern — see file header comment in
-- the TopicConfig for why fee-on-amount was NOT used: spreads are quoted in
-- genuinely incompatible units across these 7 providers).
-- IC Markets and eToro carry active, unresolved legal/regulatory matters —
-- disclosed per row, neither is the top pick while unresolved.
-- Provenance: live research 2026-07-10/11 against ASIC AFSL register, ASIC
-- media releases/court filings, official pricing pages, Trustpilot.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, monthly_fee,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'cmc-markets-cfd-au', 'au', 'trading', 'cfd-brokers', 'CMC Markets', 'The cleanest regulatory record with the widest CFD range',
  9.0, 4.0, 3200, 3200, 0,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['12,000+ instruments', 'Dual ASIC licences since 1996/2001', 'No minimum deposit']::text[],
  ARRAY['Widest CFD range of the pure-CFD brokers here (12,000+ instruments across FX, indices, commodities, crypto, treasuries, shares)', 'Oldest CFD-specific AFSL in this comparison (since 1996), no regulatory red flags found in ASIC''s 2026 sector review', 'No minimum deposit; proprietary Next Generation platform plus TradingView integration'],
  ARRAY['No traditional flat-commission raw account for cost-conscious traders', 'Exact live spread figures could not be independently pulled from the pricing page at research time'],
  '{"fees":8.8,"features":9.4,"ux":8.6,"support":8.4}'::jsonb,
  'The cleanest regulatory record in this comparison, with the widest instrument range.',
  '{"asic_afsl":"238054","spread_note":"Spread-based pricing (no separate commission); exact current spread on headline indices not independently confirmed at research time — see live pricing page","cfd_range_note":"12,000+ instruments: forex, indices, commodities, crypto, treasuries, shares","min_deposit_aud":null,"max_leverage":"30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)","platforms":["CMC Next Generation","MT4","TradingView"],"retail_loss_pct":null,"retail_loss_note":"Conflicting figures (68-70%) found across secondary sources — not independently confirmed from a live CMC disclosure","trustpilot_rating":4.0,"trustpilot_count":3200,"trustpilot_note":"trustpilot.com/review/www.cmcmarkets.com — exact review count not independently confirmed (fetch blocked)","regulatory_note":"Not named in ASIC''s January 2026 sector-wide CFD review (26-004MR) alongside issuers found to have breached compliance obligations. No material regulatory history found at research time."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.cmcmarkets.com/en-au/', true, 'Traders wanting the widest range with a clean record', 1,
  'https://www.cmcmarkets.com/en-au/cfd/pricing', DATE '2026-07-11', true
),
(
  NULL, 'interactive-brokers-cfd-au', 'au', 'trading', 'cfd-brokers', 'Interactive Brokers', 'Institutional-grade, genuinely low commission pricing',
  8.7, 3.4, 5252, 5252, 0,
  '[{"type":"green","label":"Best for high volume"}]'::jsonb,
  ARRAY['0.05% AU share CFDs (min A$5)', 'No minimum deposit', 'AFSL since 2016, AFCA member']::text[],
  ARRAY['Genuinely transparent, low commission pricing (0.05% on AU share CFDs, min A$5; 0.005-0.01% on index CFDs) — usually the cheapest for high-volume traders', 'No minimum deposit; ASX/ASX24/Cboe Australia participant and AFCA member (#38492)', '8,500+ share CFDs plus index, commodity and FX CFDs on one institutional-grade platform'],
  ARRAY['Trader Workstation (TWS) has a steeper learning curve than the proprietary retail platforms most peers offer', 'Lowest Trustpilot score of the 7 (3.4/5, "Average")'],
  '{"fees":9.6,"features":8.8,"ux":6.8,"support":7.2}'::jsonb,
  'The most transparent, lowest-cost pricing for high-volume or professional-style traders.',
  '{"asic_afsl":"453554","spread_note":"Commission-based, not spread-based: 0.05% on AU share CFDs (min A$5/order, 0.03% above A$10M monthly volume), 0.005-0.01% on index CFDs, FX CFDs pass through interbank spreads (as tight as 0.1 pip) plus a low commission","cfd_range_note":"8,500+ share CFDs plus index, commodity and FX CFDs","min_deposit_aud":0,"max_leverage":"30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)","platforms":["Trader Workstation (TWS)"],"retail_loss_pct":null,"retail_loss_note":"No specific loss-percentage headline figure found on IB''s AU pages at research time — IB''s commission/DMA-style model differs from typical CFD market-makers","trustpilot_rating":3.4,"trustpilot_count":5252,"trustpilot_note":"trustpilot.com/review/interactivebrokers.com — AU-specific listing (3.4/5, 5,252 reviews), rated \"Average\"","regulatory_note":"No material regulatory history found at research time."}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.interactivebrokers.com.au/', false, 'Cost-conscious, high-volume traders', 2,
  'https://www.interactivebrokers.com.au/en/pricing/commissions-home.php', DATE '2026-07-11', true
),
(
  NULL, 'pepperstone-cfd-au', 'au', 'trading', 'cfd-brokers', 'Pepperstone', 'Broadest platform choice with a resolved compliance matter',
  8.6, 4.3, 3423, 3423, 0,
  '[]'::jsonb,
  ARRAY['MT4/MT5/cTrader/TradingView', 'From 1 point on AUS200', 'No minimum deposit']::text[],
  ARRAY['Broadest platform choice of the 7: MT4, MT5, cTrader and native TradingView integration', 'Fixed AUS200 index spread quoted "from 1 point," no commission', 'No minimum deposit; 2023 leverage-cap matter was self-reported and fully remediated under ASIC oversight'],
  ARRAY['~1,400-2,700 instruments depending on how counted — narrower total range than CMC/IG', '2023 ASIC leverage-cap breach exists in the compliance record (self-reported and remediated, see detail)'],
  '{"fees":8.8,"features":9.2,"ux":8.8,"support":8.4}'::jsonb,
  'The widest platform choice, with a transparently disclosed and resolved compliance history.',
  '{"asic_afsl":"414530","spread_note":"Spread-based (fixed-spread account), AUS200 quoted \"from 1 point,\" no commission on the standard tier","cfd_range_note":"~1,400-2,700 instruments (90+ FX pairs, 20+ indices, 1,000+ share CFDs incl. ~200 AU shares, 40 commodities, 90+ ETFs, 26 crypto CFDs)","min_deposit_aud":0,"max_leverage":"30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)","platforms":["MT4","MT5","cTrader","TradingView"],"retail_loss_pct":73.6,"retail_loss_note":"Third-party figure, not independently confirmed from a live Pepperstone AU PDS — treat as indicative pending direct verification","trustpilot_rating":4.3,"trustpilot_count":3423,"trustpilot_note":"trustpilot.com/review/pepperstone.com — global figure, not AU-isolated","regulatory_note":"In November 2023, ASIC identified Pepperstone as one of 7 CFD/FX issuers that breached the leverage Product Intervention Order due to a technical error. Pepperstone self-reported the issue and ran a remediation program compensating over 1,500 affected clients (ASIC media release 23-298MR). Note: some of Pepperstone''s own marketing claims \"zero regulatory sanctions across 15 years,\" which is inconsistent with this self-reported 2023 breach — that specific marketing claim should be treated with caution."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://pepperstone.com/en-au/', false, 'Traders wanting the broadest platform choice', 3,
  'https://pepperstone.com/en-au/pricing', DATE '2026-07-11', true
),
(
  NULL, 'ig-markets-cfd-au', 'au', 'trading', 'cfd-brokers', 'IG', 'The deepest market range of any provider in this comparison',
  8.5, 3.8, 9000, 9000, 0,
  '[]'::jsonb,
  ARRAY['~18,000 markets', 'DMA via L2 Dealer', 'No formal minimum deposit']::text[],
  ARRAY['Deepest market range of the 7: ~18,000 markets (11,000+ shares/ETFs, 36 indices, 90+ FX, 35+ commodities, crypto)', 'ProRealTime charting bundled free for active traders (4+ trades/month); L2 Dealer DMA for approved professional/high-volume accounts', 'No formal minimum to open (deposit method minimums vary A$10-A$450)'],
  ARRAY['No genuinely clean minimum-deposit story — varies meaningfully by payment method', 'Retail-loss percentage could not be independently confirmed (conflicting 67-71% figures found across sources)'],
  '{"fees":8.2,"features":9.4,"ux":8.4,"support":8.2}'::jsonb,
  'The deepest instrument range in this comparison, from a large, established global brand.',
  '{"asic_afsl":"220440","spread_note":"Spread-based; AUS200-equivalent index CFD spread quoted \"from 1 point\"","cfd_range_note":"~18,000 markets: 11,000+ shares/ETFs, 36 indices, 90+ FX pairs, 35+ commodities, crypto CFDs","min_deposit_aud":null,"max_leverage":"30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)","platforms":["IG platform","MT4","ProRealTime","L2 Dealer (DMA)"],"retail_loss_pct":null,"retail_loss_note":"Conflicting figures (67%, 69%, 71%) found across secondary sources — not independently confirmed from a live IG AU disclosure","trustpilot_rating":3.8,"trustpilot_count":9000,"trustpilot_note":"au.trustpilot.com/review/ig.com — figures inconsistent between snippets (3.6-3.9/5), re-checked directly recommended before publish","regulatory_note":"A proposed Federal Court class action was announced in October 2022 (Piper Alderman, funded by Omni Bridgeway) alleging IG marketed complex CFDs to inexperienced AU investors without adequate risk disclosure, citing ASIC data on CFD losses exceeding A$800 million industry-adjacent. This page could not confirm whether the action was ultimately filed, settled or lapsed — status should be re-checked before this note is treated as current."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.ig.com/au', false, 'Multi-asset traders wanting the deepest range', 4,
  'https://www.ig.com/au/indices/markets-indices', DATE '2026-07-11', true
),
(
  NULL, 'plus500-cfd-au', 'au', 'trading', 'cfd-brokers', 'Plus500', 'Simple proprietary app experience for casual mobile-first traders',
  7.6, 4.2, 19472, 19472, 0,
  '[]'::jsonb,
  ARRAY['Simple proprietary WebTrader', '~2,800 CFDs', 'Fast app-based withdrawals per reviews']::text[],
  ARRAY['Simple, easy-to-use proprietary WebTrader platform, well suited to casual/mobile-first traders', 'Decent Trustpilot score and volume (4.2/5, ~19,472 reviews)', '~2,800 CFDs across shares, indices, forex, crypto-ETFs, ETFs, options and commodities'],
  ARRAY['Highest published retail-loss-rate range found among the 7 (79-84% across sources, not independently confirmed to a single current figure)', 'No MT4/MT5/cTrader/TradingView — proprietary platform only, and minimum deposit figures were inconsistent across sources (A$100-A$500 depending on method)'],
  '{"fees":7.4,"features":7.6,"ux":8.4,"support":7.6}'::jsonb,
  'A simple, mobile-first experience — weigh the higher published loss-rate range below.',
  '{"asic_afsl":"417727","spread_note":"Floating spreads (proprietary WebTrader); exact current AUS200/SPI200 spread not independently confirmed at research time","cfd_range_note":"~2,800 CFDs: ~1,800 shares, 33 indices, 60+ FX pairs, ~20 crypto-ETF CFDs, 90+ ETFs, 20 options CFDs, commodities (AU-specific crypto-CFD availability not separately confirmed)","min_deposit_aud":null,"max_leverage":"30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)","platforms":["Plus500 WebTrader"],"retail_loss_pct":null,"retail_loss_note":"Highly inconsistent figures found across sources (79%, 80%, 82%, 84%) — the highest range of any of the 7 providers researched; not independently confirmed to a single current figure, needs live verification before being stated as fact","trustpilot_rating":4.2,"trustpilot_count":19472,"trustpilot_note":"trustpilot.com — global figure, not AU-isolated","regulatory_note":"No AU-specific 2025/26 ASIC enforcement action found at research time."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.plus500.com/en-au', false, 'Casual, mobile-first traders', 5,
  'https://www.plus500.com/en/help/feescharges', DATE '2026-07-11', true
),
(
  NULL, 'ic-markets-cfd-au', 'au', 'trading', 'cfd-brokers', 'IC Markets', 'Very large instrument range — with an active class action disclosed',
  7.5, 4.8, 15, 15, 0,
  '[]'::jsonb,
  ARRAY['2,850+ instruments', 'A$300 minimum deposit', '⚠ Active class action — see detail']::text[],
  ARRAY['Very large instrument range (2,850+ claimed), tight raw FX/CFD spreads', 'Full MT4/MT5/cTrader/TradingView platform choice'],
  ARRAY['Active, consolidated Federal Court of Australia class action alleging misleading CFD sales conduct (see detail) — no judgment yet', 'AU-specific Trustpilot sample is very thin (~15 reviews); global-entity leverage marketing (up to 1:5000) does not apply to this AU-regulated entity'],
  '{"fees":8.8,"features":9.0,"ux":8.2,"support":7.6}'::jsonb,
  'A very large instrument range, but weigh the active, unresolved legal matter below before choosing.',
  '{"asic_afsl":"335692","spread_note":"Raw Spread accounts as low as 0.0 pips on FX; headline index CFDs quoted \"from 1 point\" generically, exact AUS200 figure not independently confirmed","cfd_range_note":"2,850+ tradable instruments claimed on IC Markets'' own site","min_deposit_aud":300,"max_leverage":"30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps) for this AU AFSL entity — NOT the 1:5000 figure marketed by IC Markets'' separate offshore entity","platforms":["MT4","MT5","cTrader","TradingView","WebTrader"],"retail_loss_pct":null,"retail_loss_note":"Highly inconsistent figures found (71.3%, 72.5%, 73.7%, and a blended \"74.2%\" figure that appears to mix the AU entity with EU/global entities) — not independently confirmed for the AU-specific entity","trustpilot_rating":4.8,"trustpilot_count":15,"trustpilot_note":"The widely-cited 4.8/54,000+ figure is for the separate global (offshore) entity, not this AU AFSL entity, which has only ~15 Trustpilot reviews — too thin to be reliable","regulatory_note":"An active, consolidated Federal Court of Australia class action (Bain and Anor v International Capital Markets Pty Ltd, VID1088/2023, consolidated 2 Aug 2024) alleges misleading/deceptive/unconscionable conduct in the supply of CFDs to retail clients, failure to adequately warn of leverage risk, and conflicted-remuneration breaches, also naming the founder personally. The opt-out deadline passed 2 December 2025; no judgment or class-closure order has been reported as of this page''s last verification."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.icmarkets.com/', false, 'Traders comfortable weighing the active legal matter', 6,
  'https://www.icmarkets.com/en/trading-pricing/spreads', DATE '2026-07-11', true
),
(
  NULL, 'etoro-cfd-au', 'au', 'trading', 'cfd-brokers', 'eToro', 'Social/copy trading — with an active ASIC Federal Court case disclosed',
  7.3, 4.1, 30000, 30000, 0,
  '[]'::jsonb,
  ARRAY['Social/copy trading', 'Lowest published loss-rate claim', '⚠ Active ASIC Federal Court case — see detail']::text[],
  ARRAY['Lowest self-published retail-loss-rate figure found among the 7 (pending independent verification)', 'Lowest minimum deposit of the group (~A$80) and the largest Trustpilot review base (~30,000+)', 'Social/copy-trading differentiator not offered by any other provider on this page'],
  ARRAY['Subject to ASIC''s first-ever Design and Distribution Obligations Federal Court enforcement action, filed Nov 2023, unresolved as of this page''s last verification — see detail', 'No MT4/MT5/cTrader/TradingView — proprietary platform only'],
  '{"fees":8.0,"features":8.2,"ux":8.6,"support":7.4}'::jsonb,
  'A distinctive social-trading offering — read the disclosed, active ASIC enforcement matter below before choosing.',
  '{"asic_afsl":"491139","spread_note":"Spread-based (proprietary platform); comparable S&P 500-style index CFD spread cited around 1.0 point, AUS200-specific figure not independently confirmed","cfd_range_note":"3,000+ CFD assets across FX, commodities, indices, stocks, ETFs, crypto","min_deposit_aud":80,"max_leverage":"30:1 FX majors, 20:1 gold, 2:1 crypto (ASIC PIO caps)","platforms":["eToro platform"],"retail_loss_pct":51,"retail_loss_note":"eToro''s own site states 51% of retail investor accounts lose money \"as at 31 March 2026\" per one source — notably lower than every other provider researched; other snippets cited a wider 50-77% range across regions/dates, so this specific figure needs direct re-verification before being treated as settled","trustpilot_rating":4.1,"trustpilot_count":30000,"trustpilot_note":"trustpilot.com/review/etoro.com — largest review base of the 7 providers researched","regulatory_note":"ASIC''s first-ever Design and Distribution Obligations (DDO) enforcement action is against eToro (Federal Court proceedings commenced 3 November 2023; hearing continued 27-28 April 2026; no final judgment reported as of this page''s last verification). ASIC alleges eToro''s CFD target market was too broad and its client-screening questionnaire was inadequate (unlimited retakes, prompts nudging toward \"correct\" answers), covering roughly 20,000 clients who lost money trading CFDs between 5 October 2021 and 14 June 2023. A reported in-principle settlement fell through, sending the matter to trial."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.etoro.com/en-au/', false, 'Social/copy traders comfortable weighing the active case', 7,
  'https://www.etoro.com/au/trading/fees/', DATE '2026-07-11', true
)
ON CONFLICT (market, category, topic, slug) DO UPDATE SET
  display_name = EXCLUDED.display_name, tagline = EXCLUDED.tagline, score = EXCLUDED.score,
  rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, clicks = EXCLUDED.clicks,
  monthly_fee = EXCLUDED.monthly_fee, badges = EXCLUDED.badges, chips = EXCLUDED.chips,
  pros = EXCLUDED.pros, cons = EXCLUDED.cons, sub_scores = EXCLUDED.sub_scores,
  verdict = EXCLUDED.verdict, attributes = EXCLUDED.attributes, source_type = EXCLUDED.source_type,
  confidence = EXCLUDED.confidence, is_affiliate = EXCLUDED.is_affiliate,
  review_slug = EXCLUDED.review_slug, external_url = EXCLUDED.external_url,
  is_top_pick = EXCLUDED.is_top_pick, best_for = EXCLUDED.best_for,
  display_order = EXCLUDED.display_order, source_url = EXCLUDED.source_url,
  data_verified_at = EXCLUDED.data_verified_at, active = EXCLUDED.active;
