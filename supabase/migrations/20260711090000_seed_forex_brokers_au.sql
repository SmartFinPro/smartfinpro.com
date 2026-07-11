-- Comparison Cockpit — seed AU forex brokers (market='au', topic='forex-brokers').
-- Visit-only launch (AU/CA/UK rollout, Stage 1 Slice AU-2): affiliate_link_id NULL,
-- is_affiliate=false, review_slug NULL, external_url = provider homepage.
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- lib/comparison/topics/au/forex-brokers.ts (auForexBrokersAttributesSchema).
-- Regulatory history disclosed per row (IC Markets: active Federal Court class
-- action; Pepperstone: 2023 leverage-cap breach, self-reported & remediated).
-- retail_loss_pct is NULL where not independently confirmed from a live PDS —
-- see regulatory_note / retail_loss_note per row.
-- Provenance: live research 2026-07-10/11 against official pricing/regulatory
-- pages, ASIC AFSL register, ASIC media releases, Trustpilot.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, management_fee, account_minimum,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'pepperstone-au', 'au', 'forex', 'forex-brokers', 'Pepperstone', 'Tight raw spreads across the broadest platform choice',
  9.1, 4.3, 3400, 3400, 0.008, 0,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['~0.1 pip EUR/USD (Razor)', 'MT4/MT5/cTrader/TradingView', 'No minimum deposit']::text[],
  ARRAY['Tightest raw spreads in this comparison (~0.1 pip EUR/USD on Razor)', 'Broadest platform choice: MT4, MT5, cTrader and native TradingView integration', 'No minimum deposit; 2023 leverage-cap matter was self-reported and fully remediated'],
  ARRAY['A$7 round-turn commission on the Razor (raw) account', '2023 ASIC leverage-cap breach exists in the compliance record (see detail)'],
  '{"fees":9.4,"features":9.6,"ux":9.0,"support":8.6}'::jsonb,
  'The tightest spreads and widest platform choice in this comparison, with a transparently disclosed and resolved compliance history.',
  '{"asic_afsl":"414530","avg_spread_eurusd_pips":0.1,"commission_round_turn_aud":7.00,"account_type_note":"Razor account (raw/ECN, MT4/MT5/cTrader)","max_leverage":"30:1","platforms":["MT4","MT5","cTrader","TradingView"],"trustpilot_rating":4.3,"trustpilot_count":3400,"trustpilot_note":"trustpilot.com/review/pepperstone.com — global aggregate page, not confirmed AU-entity-specific","retail_loss_pct":null,"regulatory_note":"In November 2023, ASIC identified Pepperstone as one of 7 CFD/FX issuers that breached the 2020 leverage Product Intervention Order due to a technical error. Pepperstone self-reported the issue and ran a remediation program compensating over 1,500 affected clients, part of a combined $17.4M+ returned to retail investors across issuers under ASIC oversight (media release 23-298MR). No further action found for 2024-2026."}'::jsonb,
  'official', 'high',
  false, NULL, 'https://pepperstone.com/en-au/', true, 'Active traders wanting the tightest spreads', 1,
  'https://pepperstone.com/en-au/pricing', DATE '2026-07-11', true
),
(
  NULL, 'fusion-markets', 'au', 'forex', 'forex-brokers', 'Fusion Markets', 'No minimum deposit and the lowest commission in this comparison',
  8.9, 4.8, 7500, 7500, 0.0045, 0,
  '[{"type":"green","label":"Best value"}]'::jsonb,
  ARRAY['A$4.50 round-turn commission', 'No minimum deposit', 'MT4/MT5/cTrader/TradingView']::text[],
  ARRAY['Lowest all-in commission of the 7 (A$4.50 round-turn on Zero account)', 'No minimum deposit on either account type', 'No regulatory red flags found; strong Trustpilot score (4.8/5, ~7,500 reviews)'],
  ARRAY['Youngest brand in this comparison, less track record than the older incumbents', 'Narrower non-forex product range than IG/CMC'],
  '{"fees":9.6,"features":8.8,"ux":8.8,"support":8.4}'::jsonb,
  'The lowest-cost, no-minimum-deposit option with a clean regulatory record.',
  '{"asic_afsl":"385620","avg_spread_eurusd_pips":0.0,"commission_round_turn_aud":4.50,"account_type_note":"Zero account (raw/ECN, MT4/MT5/cTrader/TradingView)","max_leverage":"30:1","platforms":["MT4","MT5","cTrader","TradingView"],"trustpilot_rating":4.8,"trustpilot_count":7500,"trustpilot_note":"trustpilot.com/review/fusionmarkets.com — primary/global aggregate page","retail_loss_pct":null,"regulatory_note":""}'::jsonb,
  'official', 'high',
  false, NULL, 'https://fusionmarkets.com/', false, 'Cost-conscious traders', 2,
  'https://fusionmarkets.com/Trading/Zero-Trading-Account', DATE '2026-07-11', true
),
(
  NULL, 'cmc-markets-forex-au', 'au', 'forex', 'forex-brokers', 'CMC Markets', 'Long-established dual-licensed broker with 0.0-pip majors on FX Active',
  8.8, 4.3, 3200, 3200, 0.005, 0,
  '[{"type":"sky","label":"Long track record"}]'::jsonb,
  ARRAY['0.0 pips on 6 major pairs (FX Active)', 'Dual ASIC licences since 1996/2001', 'No minimum deposit']::text[],
  ARRAY['FX Active tier offers 0.0-pip spreads on 6 major pairs plus a low % commission', 'Long-established brand (est. 1989) with dual AFSL licensing and no regulatory red flags found', 'No minimum deposit; proprietary Next Generation platform plus MT4/MT5'],
  ARRAY['No traditional flat-commission raw account — cost model less familiar to ECN-account traders', 'Some reviews cite slower withdrawal processing on larger amounts'],
  '{"fees":9.0,"features":8.8,"ux":8.6,"support":8.2}'::jsonb,
  'A safe, long-track-record choice with genuinely tight pricing on FX Active.',
  '{"asic_afsl":"238054","avg_spread_eurusd_pips":0.0,"commission_round_turn_aud":5.00,"account_type_note":"FX Active account (0.0 pips on 6 majors + ~0.0025% commission per side); Standard account also available, spread-only, no commission","max_leverage":"30:1","platforms":["MT4","MT5","CMC Next Generation"],"trustpilot_rating":4.3,"trustpilot_count":3200,"trustpilot_note":"trustpilot.com/review/www.cmcmarkets.com — mixed-market aggregate, not confirmed AU-exclusive","retail_loss_pct":null,"regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.cmcmarkets.com/en-au/', false, 'Traders wanting an established, dual-licensed broker', 3,
  'https://www.cmcmarkets.com/en-au/cfd/pricing', DATE '2026-07-11', true
),
(
  NULL, 'ic-markets-au', 'au', 'forex', 'forex-brokers', 'IC Markets', 'Very tight raw spreads, with an active class action disclosed',
  8.3, 4.8, 15, 15, 0.008, 300,
  '[]'::jsonb,
  ARRAY['~0.1 pip EUR/USD (Raw Spread)', 'MT4/MT5/cTrader', 'A$300 minimum deposit']::text[],
  ARRAY['Very tight raw spreads (~0.1 pip) and deep liquidity/fast execution reputation', 'Full MT4/MT5/cTrader platform choice'],
  ARRAY['Active Federal Court of Australia consolidated class action alleging misleading CFD sales conduct (see detail) — no judgment yet', 'AU-specific Trustpilot sample is very thin (~15 reviews); the widely-cited 4.8/54,000+ figure is for the separate global entity, not the AU AFSL entity'],
  '{"fees":9.4,"features":9.0,"ux":8.4,"support":7.8}'::jsonb,
  'Tight pricing and deep platform choice, but weigh the active, unresolved legal matter below before choosing.',
  '{"asic_afsl":"335692","avg_spread_eurusd_pips":0.1,"commission_round_turn_aud":7.00,"account_type_note":"Raw Spread account (ECN, MT4/MT5/cTrader); Standard account also available, no commission","max_leverage":"30:1","platforms":["MT4","MT5","cTrader"],"trustpilot_rating":4.8,"trustpilot_count":15,"trustpilot_note":"icmarkets.com.au (AU entity) has only ~15 Trustpilot reviews — too thin to be reliable; the 4.8/54,000+ figure cited elsewhere is for the separate global (offshore) entity, not this AU AFSL entity","retail_loss_pct":null,"regulatory_note":"An active, consolidated Federal Court of Australia class action (Bain and Anor v International Capital Markets Pty Ltd, VID1088/2023, consolidated 2 Aug 2024) alleges misleading/deceptive/unconscionable conduct in the supply of CFDs to retail clients, failure to adequately warn of leverage risk, and conflicted-remuneration breaches. The opt-out deadline passed 2 December 2025; no judgment or settlement has been reported as of this page''s last verification. IC Markets'' global marketing of leverage up to 1:5000 applies to a separate offshore entity, not this ASIC-regulated AU entity, which is capped at 30:1 for retail FX majors."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.icmarkets.com/', false, 'Traders comfortable weighing the active legal matter', 4,
  'https://www.icmarkets.com/en/trading-pricing/spreads', DATE '2026-07-11', true
),
(
  NULL, 'ig-markets-forex-au', 'au', 'forex', 'forex-brokers', 'IG Markets', 'Large global brand with the broadest platform and market range',
  8.4, 4.0, 9689, 9689, 0.007, 0,
  '[]'::jsonb,
  ARRAY['~0.6-0.9 pip EUR/USD (spread-only)', 'Own platform + MT4 + ProRealTime + DMA', 'No formal minimum deposit']::text[],
  ARRAY['Widest platform choice: own platform, MT4, ProRealTime charting (free with 4+ trades/month) and L2 Dealer DMA', 'Very large, long-tenured global brand with its own AU AFSL', 'No formal minimum deposit'],
  ARRAY['No genuine low-commission/raw-spread account for cost-conscious active traders', 'Spread wider than the raw/ECN brokers on this page (~0.6-0.9 pip vs ~0.0-0.1 pip)'],
  '{"fees":8.2,"features":9.2,"ux":8.6,"support":8.4}'::jsonb,
  'The broadest platform and market range from a large, established global brand.',
  '{"asic_afsl":"220440","avg_spread_eurusd_pips":0.7,"commission_round_turn_aud":0,"account_type_note":"Standard spread-only account (no raw/commission tier for retail); L2 Dealer DMA available for approved professional/high-volume traders","max_leverage":"30:1","platforms":["IG platform","MT4","ProRealTime","L2 Dealer (DMA)"],"trustpilot_rating":4.0,"trustpilot_count":9689,"trustpilot_note":"trustpilot.com/review/ig.com — global/UK-anchored aggregate page, not confirmed AU-exclusive","retail_loss_pct":null,"regulatory_note":"A proposed Federal Court class action was announced in October 2022 (Piper Alderman, funded by Omni Bridgeway) alleging IG marketed complex CFDs to inexperienced AU investors without adequate risk disclosure. This page could not confirm whether the action was ultimately filed, settled or lapsed — status should be re-checked before this note is treated as current."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.ig.com/au', false, 'Multi-asset traders wanting one broad account', 5,
  'https://www.ig.com/au/help-and-support/cfds/fees-and-charges/what-are-igs-forex-cfd-product-details', DATE '2026-07-11', true
),
(
  NULL, 'fp-markets-au', 'au', 'forex', 'forex-brokers', 'FP Markets', 'Sydney-founded broker with the longest AU AFSL tenure in this comparison',
  8.5, 4.8, 10000, 10000, 0.0067, 100,
  '[]'::jsonb,
  ARRAY['~0.07 pip EUR/USD (Raw)', 'AFSL held since 2005', 'MT4/MT5/cTrader/IRESS']::text[],
  ARRAY['Longest-tenured AU-founded entity in this comparison (AFSL since 2005, Sydney HQ)', 'Widest platform range including IRESS (DMA-style, share-market-oriented)', 'Very high Trustpilot volume/score (4.8/5, ~10,000 reviews)'],
  ARRAY['IRESS platform requires a higher A$1,000 minimum deposit vs. A$100 on MT4/MT5/cTrader', 'Exact AUD-denominated commission figure not independently confirmed at research time'],
  '{"fees":9.0,"features":8.8,"ux":8.4,"support":8.4}'::jsonb,
  'The longest-established AU-founded broker in this comparison, with the widest platform range.',
  '{"asic_afsl":"286354","avg_spread_eurusd_pips":0.07,"commission_round_turn_aud":6.00,"account_type_note":"Raw account (ECN, MT4/MT5/cTrader), figure in USD terms pending AUD confirmation; IRESS (DMA) requires A$1,000 minimum","max_leverage":"30:1","platforms":["MT4","MT5","cTrader","IRESS"],"trustpilot_rating":4.8,"trustpilot_count":10000,"trustpilot_note":"trustpilot.com/review/fpmarkets.com — global aggregate page, not confirmed AU-segmented","retail_loss_pct":null,"regulatory_note":"FP Markets hosts its own public \"ASIC Regulatory Update\" page (fpmarkets.com/asic-regulatory-update/), which could not be accessed during research (blocked). This page''s content and purpose could not be independently confirmed — worth checking directly before treating as either a concern or routine compliance messaging."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.fpmarkets.com/', false, 'Traders wanting an AU-founded, long-tenured broker', 6,
  'https://www.fpmarkets.com/account-types/', DATE '2026-07-11', true
),
(
  NULL, 'eightcap-au', 'au', 'forex', 'forex-brokers', 'Eightcap', 'Low A$100 minimum deposit with native TradingView execution',
  8.0, 4.0, 3400, 3400, 0.008, 100,
  '[]'::jsonb,
  ARRAY['A$100 minimum deposit', 'Native TradingView execution', '~0.1 pip EUR/USD (Raw)']::text[],
  ARRAY['Low A$100 minimum deposit on both account types', 'Native TradingView order execution, not just charting', 'Competitive raw spreads (~0.1 pip) on the Raw account'],
  ARRAY['No cTrader — narrower platform range than IC Markets/Pepperstone/FP Markets/Fusion', 'Lowest Trustpilot score of the 7 (~4.0/5), with a comparatively higher 1-star share concentrated on payment/withdrawal complaints'],
  '{"fees":8.8,"features":7.6,"ux":8.2,"support":7.4}'::jsonb,
  'An accessible A$100-minimum entry point with genuine TradingView execution.',
  '{"asic_afsl":"391441","avg_spread_eurusd_pips":0.1,"commission_round_turn_aud":7.00,"account_type_note":"Raw account (ECN, MT4/MT5/TradingView); Standard account also available, commission-free","max_leverage":"30:1","platforms":["MT4","MT5","TradingView"],"trustpilot_rating":4.0,"trustpilot_count":3400,"trustpilot_note":"trustpilot.com/review/eightcap.com — global aggregate page, ~12% one-star share concentrated on payment/withdrawal complaints","retail_loss_pct":null,"regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.eightcap.com/au', false, 'Traders wanting native TradingView execution', 7,
  'https://www.eightcap.com/en/trading-costs/', DATE '2026-07-11', true
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
