-- Comparison Cockpit — seed US forex brokers (topic = 'forex-brokers', category = 'forex').
-- Mirrors 20260703100000_seed_trading_platforms_us.sql. Idempotent (ON CONFLICT DO UPDATE).
-- Provenance is mandatory per row (source_url/source_type/confidence/data_verified_at);
-- full source-by-attribute matrix at
-- docs/superpowers/plans/2026-07-03-cockpit-forex-brokers-source-matrix.md, translated into
-- concrete seed values (with a Fable-5 pre-migration review + 4 changes) at
-- docs/superpowers/plans/2026-07-03-cockpit-forex-brokers-planned-seed-values.md (§0a is the
-- final, authoritative changelog — supersedes the original §1-11 wherever they conflict).
--
-- Candidates (5): tastyfx, Interactive Brokers, FOREX.com, OANDA, Charles Schwab. Plus500 US
-- is excluded entirely (CFTC-registered futures broker, not spot-forex — see source matrix
-- "Sonderfall: Plus500 US"). IG US LLC officially rebranded to tastyfx in June 2024 (same
-- entity) — NOT seeded as a separate candidate; the old ig-markets-review.mdx now
-- 301-redirects to tastyfx-review (next.config.ts).
--
-- `management_fee` stores the combined round-turn cost rate as a % of notional (spread x
-- 0.01% + commission%), standardized uniformly on ForexBrokers.com 2026 MEASURED averages
-- for all 5 (Fable Change 1) — including OANDA, whose official 1.4-pip figure is documented
-- only in eur_usd_spread_note, never seeded as the ranking value, to avoid mixing one
-- marketing-published number with four independently-measured ones.
--
-- `max_leverage` is 50 for all 5 (US CFTC/NFA cap on majors) — Charles Schwab's
-- max_leverage_note reads "up to 50:1 (US cap)" (Fable Change 4) since Schwab publishes no
-- leverage figure of its own; inferred from the regulatory ceiling, not a Schwab disclosure.
--
-- Charles Schwab has no dedicated forex review: review_slug is NULL, external_url points to
-- its own forex product page, is_affiliate is false (the existing 'charles-schwab' affiliate
-- link is scoped to the trading-platforms topic/category and does not resolve here), and its
-- rating/review_count reuse the existing charles-schwab-review.mdx figures (4.4/3000) with an
-- explicit rating_note caveat (Fable Change 3) — that rating measures Schwab's overall
-- brokerage, not forex specifically, where Schwab is this field's weakest entry (no micro
-- lots, no TradingView, no MT4/5). Verified independently that the cockpit's JSON-LD
-- (generateComparisonItemListSchema, lib/seo/schema.ts:417) never emits aggregateRating per
-- item, so there is no schema-integrity risk from the reuse.
--
-- Affiliate-gate status: is_affiliate=true for the 3 candidates with a genuine (if untracked)
-- affiliate_links row (Interactive Brokers Forex $200 CPA, FOREX.com, OANDA) — this does NOT
-- by itself open the monetized CTA gate, since mapCockpitRow additionally requires
-- tracking_status IN ('verified','dashboard_only'), which stays at the DB-wide 'unverified'
-- default and is NOT changed in this migration. tastyfx and Charles Schwab get
-- is_affiliate=false (no link exists for tastyfx; Schwab's link is scoped to a different
-- topic). FOREX.com's affiliate_links row is health-flagged 'dead' — per the source matrix's
-- independent investigation this is very likely a WAF/Cloudflare bot-challenge false-positive
-- (broker confirmed operating normally, #3 on ForexBrokers.com's 2026 ranking, active NFA
-- #0339826) — Gate 5 renders it as 'review' regardless (review_slug is set, tracking_status
-- stays unverified), so this migration does not touch the affiliate_links row. All 5 have
-- ctaMode 'review' (4, matched by review_slug) or 'visit' (Charles Schwab) internally — never
-- 'offer'.
--
-- external_url is set for ALL 5 candidates (each provider's own bare official homepage/product
-- page — never a tracked/disguised affiliate link, per the standing rule established in Slice
-- 3). Per cockpit-card.tsx's CTA priority (ctaMode==='offer' > externalUrl set > reviewSlug
-- set), this makes "Visit site" the PRIMARY green CTA for all 5 cards, with "Read review"
-- riding along as the secondary blue pill for the 4 with a published review.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, management_fee, account_minimum,
  attributes, source_type, confidence,
  badges, chips, pros, cons, sub_scores, verdict, deep_dive,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL,
  'tastyfx', 'us', 'forex', 'forex-brokers', 'tastyfx', 'Best overall — zero commission, tightest all-in spread',
  9.4, 4.4, 200, 0, 0.0115, 0,
  '{"eur_usd_spread_pips":1.15,"eur_usd_spread_note":"Measured average on the Standard account tier (ForexBrokers.com 2026), all-in with no commission. tastyfx also advertises spreads \"as low as 0.8 pips\" as a promotional floor, not a stable average; the optional Prime account ($50,000+) tightens to ~0.6 pips.","commission_per_lot":0,"commission_per_lot_note":"Zero-commission on Standard/Prime — all cost is reflected in the spread. The separate Zero+ tier charges $5/side ($10 round-turn per standard lot) for a tighter spread; not used as the seeded figure since Standard is tastyfx''s default account.","max_leverage":50,"micro_lots":true,"micro_lots_note":"0.01 lot = 1,000 units on Standard contracts; mini-contracts on 7 USD pairs go down to 100 units (margin from $2).","demo_account":true,"tradingview_integration":true,"mt4_support":true,"mt5_support":true,"currency_pairs_count":85,"nfa_cftc_regulated":true}'::jsonb,
  'official', 'high',
  '[{"type":"gold","label":"Top pick"}]'::jsonb,
  ARRAY['Zero commission','Widest pair selection (85+)','Native TradingView + MT4/MT5']::text[],
  ARRAY['Zero-commission pricing on Standard/Prime — all-in cost lives entirely in a tight 1.15-pip average spread','85+ currency pairs, the widest selection among CFTC-regulated US brokers','Officially compatible with both TradingView and MetaTrader 4/5 on its Standard and Prime accounts','$0 account minimum with a $50,000 Prime tier for spreads as tight as ~0.6 pips']::text[],
  ARRAY['The commission-based Zero+ tier drops TradingView support entirely — high-volume traders chasing the tightest pricing lose that charting workflow','Legacy IG US brand recognition is still transitioning post-2024 rebrand','No published maximum leverage beyond the standard CFTC 50:1 cap on majors']::text[],
  '{"cost":9.2,"platform":9.6,"pairs":9.6,"support":9.0}'::jsonb,
  'The best overall pick for most US forex traders',
  'tastyfx (the June 2024 rebrand of IG US, same entity and regulatory registration) pairs zero-commission pricing with a 1.15-pip average EUR/USD spread and 85+ currency pairs — the widest selection in this comparison. It is officially compatible with both TradingView and MetaTrader 4/5 on its Standard and Prime accounts, though its separate commission-based Zero+ tier trades that TradingView support away for a tighter spread. A $50,000 Prime account unlocks spreads as tight as ~0.6 pips for high-volume clients.',
  false, 'tastyfx-review', 'https://www.tastyfx.com/', true, 'Best overall', 1,
  'https://www.tastyfx.com/accounts/pricing/', DATE '2026-07-03', true
),
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'interactive-brokers-forex' AND market = 'us' LIMIT 1),
  'interactive-brokers-forex', 'us', 'forex', 'forex-brokers', 'Interactive Brokers', 'Best for active and high-volume traders',
  9.2, 4.2, 500, 0, 0.0063, 0,
  '{"eur_usd_spread_pips":0.226,"eur_usd_spread_note":"Measured average (ForexBrokers.com 2026) of the raw interbank spread, quoted from 17 FX dealers, before commission. IBKR''s own site advertises spreads \"as narrow as 1/10 pip\" as a best-case figure, not a stable average.","commission_per_lot":4.60,"commission_per_lot_note":"Tier I pricing: 0.20 basis points of trade value, $2.00/order minimum -- roughly $4.60 round-turn per 100k EUR/USD notional at current rates. Drops to 0.08bp for traders above $5 billion in monthly volume.","max_leverage":50,"micro_lots":true,"micro_lots_note":"Limited support -- IdealPro requires a $25,000 minimum order; smaller orders (from 1,000 units / 0.01 lot) route as an \"odd lot\" and fill roughly 1 pip outside the interbank best bid/offer, meaning worse execution for very small trades.","demo_account":true,"tradingview_integration":true,"mt4_support":false,"mt5_support":false,"currency_pairs_count":100,"nfa_cftc_regulated":true}'::jsonb,
  'official', 'high',
  '[{"type":"sky","label":"Best for active trading"}]'::jsonb,
  ARRAY['Lowest all-in cost at scale','Native TradingView integration','100+ currency pairs']::text[],
  ARRAY['Lowest all-in trading cost in this comparison at scale (0.0063% round-turn) -- commission drops to 0.08bp above $5B monthly volume','Native TradingView integration -- ForexBrokers.com''s "#1 Broker for TradingView 2026"','100+ pairs across 28 currencies via IdealPro, IBKR''s institutional FX venue','Full paper trading and multi-asset access across forex, stocks, options and futures from one account']::text[],
  ARRAY['No MetaTrader 4/5 support -- forex trades exclusively through TWS, IBKR Desktop/Mobile or FXTrader','Orders below the $25,000 IdealPro minimum route as odd lots with weaker execution, roughly 1 pip outside interbank pricing','TWS platform has a steep learning curve for traders new to Interactive Brokers']::text[],
  '{"cost":9.8,"platform":8.6,"pairs":9.2,"support":8.6}'::jsonb,
  'The best choice for active, high-volume and professional forex traders',
  'Interactive Brokers combines a razor-thin 0.226-pip average interbank spread with a transparent, volume-tiered commission (0.20 basis points, dropping to 0.08bp above $5B/month) for the lowest all-in trading cost in this comparison at scale. It offers 100+ pairs and native TradingView integration, but has no MetaTrader 4/5 support, and its $25,000 IdealPro minimum order means smaller trades route as weaker-priced odd lots -- making it the clear pick for active and high-volume traders rather than small-account beginners.',
  true, 'interactive-brokers-forex-review', 'https://www.interactivebrokers.com/', false, 'Best for active/high-volume traders', 2,
  'https://www.interactivebrokers.com/en/pricing/commissions-spot-currencies.php', DATE '2026-07-03', true
),
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'forex-com' AND market = 'us' LIMIT 1),
  'forex-com', 'us', 'forex', 'forex-brokers', 'FOREX.com', 'Solid mid-tier pick with the widest platform choice',
  8.6, 4.3, 1500, 0, 0.0084, 100,
  '{"eur_usd_spread_pips":0.137,"eur_usd_spread_note":"RAW-tier average (ForexBrokers.com 2026), commission included in the all-in cost figure. The commission-free Standard tier''s spread is ambiguous between ForexBrokers.com''s own pages (1.00 pips per its Guide table vs 1.62 pips per its Review page) -- not used as the seeded/ranking value; expect roughly 1.0-1.6 pips spread-only on Standard.","commission_per_lot":7.00,"commission_per_lot_note":"RAW tier: $7 round-turn per 100k notional ($3.50/side, charged per leg). Standard tier is commission-free (spread-only).","max_leverage":50,"micro_lots":true,"micro_lots_note":"0.01 lot = 1,000 units, on both FOREX.com''s own platform and MT5.","demo_account":true,"tradingview_integration":true,"mt4_support":true,"mt5_support":true,"currency_pairs_count":80,"nfa_cftc_regulated":true}'::jsonb,
  'editorial', 'medium',
  '[]'::jsonb,
  ARRAY['Widest platform choice (MT4, MT5, TradingView)','80 currency pairs','#3 ForexBrokers.com 2026 ranking']::text[],
  ARRAY['Supports MT4, MT5 and TradingView simultaneously -- the widest platform choice among these 5 brokers','80 currency pairs across 5,500+ total tradable symbols including other asset classes','Ranked #3 in ForexBrokers.com''s 2026 US broker ranking, under active NFA registration (#0339826) as a StoneX Group (NASDAQ: SNEX) brand','RAW-tier all-in pricing (0.137 pips + $7/lot) is competitive for cost-conscious active traders']::text[],
  ARRAY['$100 minimum deposit, the only one of these 5 brokers with a non-zero minimum','FOREX.com''s own pricing pages are largely blocked to automated verification (Cloudflare bot-challenge), so this listing leans more on independent editorial sources than official self-reported data','Standard tier''s spread-only pricing is ambiguously reported (1.0 vs 1.6 pips) across ForexBrokers.com''s own pages -- we use the more transparent, all-in RAW tier for ranking instead']::text[],
  '{"cost":8.8,"platform":9.4,"pairs":8.4,"support":8.0}'::jsonb,
  'A solid, platform-flexible choice with a real -- if editorially-sourced -- track record',
  'FOREX.com pairs a competitive RAW-tier all-in cost (0.137-pip spread + $7/lot commission, round-turn) with the widest platform choice in this comparison: MetaTrader 4, MetaTrader 5 and TradingView all supported simultaneously, across 80 currency pairs. Its own pricing pages are largely inaccessible to automated verification (a Cloudflare bot-challenge, not a sign of business trouble -- ForexBrokers.com independently ranks it #3 in the US for 2026 under active NFA registration), so this listing draws more heavily on independent editorial sources than most others in this comparison. Its $100 minimum deposit is the only non-zero minimum among these 5 brokers.',
  true, 'forex-com-review', 'https://www.forex.com/en-us/', false, NULL, 4,
  'https://www.forexbrokers.com/reviews/forex-com', DATE '2026-07-03', true
),
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'oanda' AND market = 'us' LIMIT 1),
  'oanda', 'us', 'forex', 'forex-brokers', 'OANDA', 'Best for beginners',
  8.8, 4.3, 500, 0, 0.0168, 0,
  '{"eur_usd_spread_pips":1.68,"eur_usd_spread_note":"Measured average (ForexBrokers.com 2026), all-in with no commission. OANDA''s own pricing page quotes a lower official average of 1.4 pips; the measured figure is used here for a consistent, single methodology across all 5 brokers rather than mixing a self-reported number with four independently-measured ones.","commission_per_lot":0,"commission_per_lot_note":"Zero commission -- pure spread-only pricing (\"commission is wrapped into the spread\"). Elite Trader cash rebates of $5-$17 per $1M available above $10M in monthly volume.","max_leverage":50,"micro_lots":true,"micro_lots_note":"Smallest order size is 1 unit -- the most flexible position sizing in this comparison, well below standard micro-lot granularity.","demo_account":true,"tradingview_integration":true,"mt4_support":true,"mt5_support":false,"currency_pairs_count":68,"nfa_cftc_regulated":true}'::jsonb,
  'official', 'high',
  '[{"type":"sky","label":"Best for beginners"}]'::jsonb,
  ARRAY['$0 minimum deposit','1-unit minimum order size','Native TradingView integration']::text[],
  ARRAY['$0 minimum deposit and no inactivity fees -- among the lowest barriers to entry in US forex','1-unit minimum order size, the most flexible position sizing of any broker in this comparison','Native TradingView integration lets traders place live orders directly from TradingView charts','30-year regulatory track record (NFA ID 0325821) with straightforward, transparent spread-only pricing']::text[],
  ARRAY['Highest all-in cost in this comparison (1.68-pip average spread, no commission to offset it)','No MetaTrader 5 support for US accounts -- MT4 only','Spreads widen noticeably during high-impact news events (NFP, FOMC), sometimes 3-5 pips on majors']::text[],
  '{"cost":7.6,"platform":9.0,"pairs":8.2,"support":8.8}'::jsonb,
  'The best starting point for beginners and small-account traders',
  'OANDA removes the barriers that keep many new traders from starting: a genuine $0 minimum deposit, no inactivity fees, and a 1-unit minimum order size that lets a trader risk-manage a small account far more precisely than a broker requiring full micro-lot (1,000-unit) increments. Its native TradingView integration lets traders place live orders directly from TradingView charts, and its spread-only pricing (no commission) keeps cost tracking simple. The trade-off is the highest all-in cost in this comparison -- a 1.68-pip average EUR/USD spread with nothing to offset it -- and no MetaTrader 5 support for US accounts.',
  true, 'oanda-review', 'https://www.oanda.com/us-en/trading/', false, 'Best for beginners', 3,
  'https://www.oanda.com/us-en/trading/our-pricing/', DATE '2026-07-03', true
),
(
  NULL,
  'charles-schwab-forex', 'us', 'forex', 'forex-brokers', 'Charles Schwab (thinkorswim)', 'Best for existing Schwab clients',
  8.0, 4.4, 3000, 0, 0.0127, 0,
  '{"eur_usd_spread_pips":1.27,"eur_usd_spread_note":"Measured average, October 2025 (ForexBrokers.com), all-in with no commission.","commission_per_lot":0,"commission_per_lot_note":"Commission-free -- \"trade costs are reflected in the bid-ask spread\" (official).","max_leverage":50,"max_leverage_note":"Schwab publishes no leverage figure of its own for forex; shown as \"up to 50:1 (US cap)\", inferred from the CFTC/NFA regulatory ceiling that applies to all US retail forex accounts, not a Schwab disclosure.","micro_lots":false,"micro_lots_note":"No micro lots -- the smallest allowed trade size is 10,000 units, the biggest weakness of this platform for small accounts.","demo_account":true,"tradingview_integration":false,"mt4_support":false,"mt5_support":false,"currency_pairs_count":65,"nfa_cftc_regulated":true,"rating_note":"This 4.4/5000 rating is reused from our existing Charles Schwab brokerage review (same company, same thinkorswim platform), not a forex-specific assessment -- forex is this platform''s weakest surface (no micro lots, no TradingView, no MetaTrader 4/5)."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Existing Schwab/thinkorswim integration','65+ currency pairs','Commission-free spread-only pricing']::text[],
  ARRAY['Deep integration with an existing Schwab brokerage/banking relationship and the full thinkorswim platform','65+ currency pairs (some third-party counts put it at 73 pairs across 11 currencies)','Commission-free, spread-only pricing keeps cost tracking simple']::text[],
  ARRAY['No micro lots -- 10,000-unit minimum trade size is the biggest weakness for small accounts','No TradingView integration and no MetaTrader 4/5 support -- forex trades exclusively through thinkorswim','Requires a separate forex trading approval/opt-in on top of a standard Schwab account']::text[],
  '{"cost":7.8,"platform":7.2,"pairs":7.8,"support":8.8}'::jsonb,
  'A reasonable choice if you already bank and trade with Schwab -- less so if forex is your primary focus',
  'Charles Schwab offers commission-free, spread-only forex pricing (1.27-pip average) through thinkorswim, with 65+ currency pairs and deep integration into an existing Schwab brokerage or banking relationship. It has no micro-lot support (a 10,000-unit minimum trade size, the largest in this comparison), no TradingView integration, and no MetaTrader 4/5 support -- meaningful gaps for a small account or a trader who wants platform flexibility. Its rating here is carried over from our overall Charles Schwab brokerage review rather than a forex-specific assessment.',
  false, NULL, 'https://www.schwab.com/forex', false, 'Existing Schwab clients', 5,
  'https://www.schwab.com/forex', DATE '2026-07-03', true
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
  attributes = EXCLUDED.attributes,
  source_type = EXCLUDED.source_type,
  confidence = EXCLUDED.confidence,
  badges = EXCLUDED.badges,
  chips = EXCLUDED.chips,
  pros = EXCLUDED.pros,
  cons = EXCLUDED.cons,
  sub_scores = EXCLUDED.sub_scores,
  verdict = EXCLUDED.verdict,
  deep_dive = EXCLUDED.deep_dive,
  is_affiliate = EXCLUDED.is_affiliate,
  review_slug = EXCLUDED.review_slug,
  external_url = EXCLUDED.external_url,
  is_top_pick = EXCLUDED.is_top_pick,
  best_for = EXCLUDED.best_for,
  display_order = EXCLUDED.display_order,
  source_url = EXCLUDED.source_url,
  data_verified_at = EXCLUDED.data_verified_at,
  active = EXCLUDED.active;
