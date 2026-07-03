-- Comparison Cockpit — seed US trading platforms (topic = 'trading-platforms', category = 'trading').
-- Mirrors 20260703090100_seed_debt_relief_us.sql. Idempotent (ON CONFLICT DO UPDATE).
-- Provenance is mandatory per row (source_url/source_type/confidence/data_verified_at);
-- full source-by-attribute matrix at
-- docs/superpowers/plans/2026-07-03-cockpit-trading-platforms-source-matrix.md, translated
-- into concrete seed values (with a Fable-5 pre-migration review + 2 blocking fixes) at
-- docs/superpowers/plans/2026-07-03-cockpit-trading-platforms-planned-seed-values.md (§9 is
-- the final, authoritative spec — supersedes §1-8 wherever they conflict).
--
-- Candidates (9): Fidelity, Charles Schwab, Interactive Brokers, Robinhood, eToro, Webull,
-- E*TRADE, tastytrade, Merrill Edge. All 9 are SIPC-insured broker-dealers; none charge a
-- monthly account fee or AUM-style recurring fee, so monthly_fee/fx_fee_pct/atm_fee are left
-- out of the INSERT column list and default to 0 at the DB level (product_attributes table,
-- 20260627120000_product_attributes.sql) — this is what makes the 'banking' costModel kind
-- honestly show $0 for every provider (see trading-platforms.ts header comment).
--
-- `options_fee` is a ROUND-TRIP (open+close) figure per Fable-5 Fix 1 (planned-seed-values.md
-- §9) — NOT the bare per-contract open fee — because a naive open-fee-only framing inverts
-- tastytrade's real advantage (its $1.00-open/$0-close cap makes it the cheapest broker in the
-- field for active/multi-leg traders despite a higher nominal open fee). `options_fee_note`
-- keeps the raw per-leg source-matrix figure for transparency.
--
-- `account_minimum` (displayed as "Minimum deposit", Fable-5 Fix 2) is $0 for 8 of 9 — eToro is
-- the sole $100 minimum first deposit (its account-opening minimum is genuinely $0, but the
-- source matrix confirms a $100 minimum first deposit for US customers).
--
-- `charles-schwab` (NOT `schwab`) is the exact slug of the live affiliate_links row per Fable-5's
-- direct DB cross-check — required for the (currently gate-closed) affiliate_link_id join to
-- structurally resolve at all.
--
-- eToro `extended_hours` is seeded as JSON `null` (never `'none'` or `false`) — its US-account
-- availability of any 24/5-labelled asset class is confirmed low-confidence/unverified per the
-- source matrix; `null` renders as "—" in the UI, never a claimed "No".
--
-- `cash_sweep_apy` is informational-only everywhere (no specColumn score, no compareRow `score`
-- prop, no sortOption/matcher reference it) — see trading-platforms.ts. Schwab's cash_sweep_note
-- explicitly flags its 0.01% figure as an editorial estimate (Fable-5 Fix 3), since Schwab's own
-- pricing pages block automated verification.
--
-- Merrill Edge has no published SmartFinPro review yet: review_slug is NULL, external_url points
-- to its own pricing page instead, is_affiliate is false (no affiliate_links row exists), and its
-- rating/review_count use the NerdWallet-editorial estimate documented in the source matrix's
-- "Ergänzung" section (its Trustpilot 1.3/117 score is noted neutrally in cons, not surfaced as
-- the headline rating, consistent with the known complaint-bias pattern for big-bank spinoffs).
--
-- Affiliate-gate status: is_affiliate=true for the 5 candidates with a genuine (if untracked)
-- affiliate_links row (Fidelity, Charles Schwab, Interactive Brokers, Robinhood, eToro) — this
-- does NOT by itself open the monetized CTA gate, since mapCockpitRow additionally requires
-- tracking_status IN ('verified','dashboard_only'), which stays at the DB-wide 'unverified'
-- default and is NOT changed in this migration. Webull, E*TRADE, tastytrade and Merrill Edge get
-- is_affiliate=false (no affiliate_links row exists for them today). All 9 render as
-- review (8, matched by review_slug) or visit (Merrill Edge, external_url) CTAs in this slice.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, management_fee, account_minimum,
  attributes, source_type, confidence,
  badges, chips, pros, cons, sub_scores, verdict, deep_dive,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'fidelity' AND market = 'us' LIMIT 1),
  'fidelity', 'us', 'trading', 'trading-platforms', 'Fidelity', 'Best overall — zero fees, automatic cash yield',
  9.6, 4.5, 5000, 0, NULL, 0,
  '{"options_fee":1.30,"options_fee_note":"Round-trip (open+close) of the official $0.65/contract per-leg fee.","fractional_shares":true,"fractional_shares_note":"\"Stocks by the Slice\" — 7,000+ US stocks/ETFs, from $1.","crypto_trading":true,"crypto_note":"Fidelity Crypto: BTC, ETH, LTC, SOL (+ FIDD); availability varies by state.","futures_trading":false,"paper_trading":false,"extended_hours":"classic","extended_hours_note":"Pre-market 7:00-9:28am ET + after-hours 4:00-8:00pm ET; no overnight/24-hour session.","tradingview_integration":false,"cash_sweep_apy":3.3,"cash_sweep_note":"~3.3% on the default core position (SPAXX government money-market fund) — automatic, no opt-in, no subscription.","sipc_insured":true}'::jsonb,
  'official', 'high',
  '[{"type":"gold","label":"Top pick"}]'::jsonb,
  ARRAY['Automatic ~3.3% cash yield','Zero-fee index funds','#1 customer service']::text[],
  ARRAY['FZROX/FZILX ZERO funds with 0% expense ratio — industry-unique','#1 customer service rating by J.D. Power for five consecutive years','Automatic ~3.3% SPAXX cash sweep yield — no opt-in required, unlike most peers','$14.1 trillion AUM with SIPC protection — massive institutional backing']::text[],
  ARRAY['No futures or forex trading available on the platform','No native TradingView integration','Extended hours limited to classic pre/after-market — no true 24/5 overnight session']::text[],
  '{"fees":9.4,"features":8.6,"ux":9.2,"support":9.6}'::jsonb,
  'The best overall pick for most traders and investors',
  'Fidelity pairs a standard $0.65/contract options fee with the strongest all-round package in this category: zero-expense-ratio index funds, a #1 J.D. Power customer-service rating for five straight years, and — uniquely among the 9 — an automatic ~3.3% yield on uninvested cash with no opt-in or subscription required, which is the single largest real "hidden cost" difference in this whole comparison.',
  true, 'fidelity-review', NULL, true, 'Best overall', 1,
  'https://www.fidelity.com/trading/commissions-margin-rates', DATE '2026-07-03', true
),
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'charles-schwab' AND market = 'us' LIMIT 1),
  'charles-schwab', 'us', 'trading', 'trading-platforms', 'Charles Schwab', 'Best all-in-one platform with thinkorswim',
  9.3, 4.4, 3000, 0, NULL, 0,
  '{"options_fee":1.30,"options_fee_note":"Round-trip (open+close) of the official $0.65/contract per-leg fee.","fractional_shares":true,"fractional_shares_note":"\"Stock Slices\" — S&P 500 stocks only, $5 minimum, no fractional ETFs.","crypto_trading":true,"crypto_note":"\"Schwab Crypto\" (spot BTC+ETH, 75bp/trade) is in a staged rollout since 12.05.2026 — not yet available in NY or LA.","futures_trading":true,"paper_trading":true,"extended_hours":"overnight","extended_hours_note":"24/5 via thinkorswim EXTO orders — roughly 800 US stocks/ETFs, Sunday-Friday around the clock.","tradingview_integration":false,"cash_sweep_apy":0.01,"cash_sweep_note":"~0.01% (editorial estimate, Schwab''s own pricing pages block automated verification — re-verify before treating as broker-confirmed). Opt-in alternative: SWVXX money-market fund at 3.49% (manual purchase, not a sweep).","sipc_insured":true}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['thinkorswim with 400+ indicators','Paper trading + futures','24/5 extended hours']::text[],
  ARRAY['thinkorswim platform with 400+ technical indicators and paperMoney paper trading','$0 commissions on stocks and ETFs with no account minimum','24/5 extended-hours trading via EXTO orders on ~800 US stocks/ETFs','Integrated Schwab Bank with checking, HELOC, and ATM fee reimbursement']::text[],
  ARRAY['Default cash sweep yield is near-zero (~0.01%, editorial estimate) unless you manually buy a money-market fund','New Schwab Crypto offering is in a staged rollout, not yet available in NY or LA','No native TradingView integration']::text[],
  '{"fees":8.6,"features":9.4,"ux":8.8,"support":8.6}'::jsonb,
  'A comprehensive, professional-grade platform for most traders',
  'Charles Schwab combines a standard $0.65/contract options fee with the most fully-featured platform in this category: thinkorswim brings 400+ indicators, full paper trading across stocks/options/futures, and one of the widest 24/5 overnight-trading windows in the field. Its new spot-crypto offering is still in a phased rollout (not yet live in NY or LA), and its default cash-sweep yield is close to zero unless you actively move into a money-market fund.',
  true, 'charles-schwab-review', NULL, false, 'Best all-in-one platform', 2,
  'https://disclosures.schwab.com/SchwabDashboard/61330/REG23060.pdf', DATE '2026-07-03', true
),
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'interactive-brokers' AND market = 'us' LIMIT 1),
  'interactive-brokers', 'us', 'trading', 'trading-platforms', 'Interactive Brokers', 'Best for active and global traders',
  9.2, 4.8, 8934, 0, NULL, 0,
  '{"options_fee":1.30,"options_fee_note":"Round-trip (open+close) of the official IBKR Lite $0.65/contract per-leg fee (min. $1/order, first 1,000 contracts/month); IBKR Pro Tiered runs $0.15-$0.65/contract by volume.","fractional_shares":true,"fractional_shares_note":"10,000+ US/CA/EU stocks and ETFs; no stated minimum.","crypto_trading":true,"crypto_note":"11 coins (BTC, ETH, SOL, XRP, DOGE and others) via Paxos/Zero Hash, 0.12-0.18% commission (min. $1.75).","futures_trading":true,"paper_trading":true,"extended_hours":"overnight","extended_hours_note":"The widest overnight session in the field — 10,000+ US stocks/ETFs, Sunday-Friday 8:00pm-3:50am ET, plus regular extended hours.","tradingview_integration":true,"cash_sweep_apy":3.12,"cash_sweep_note":"3.12% on USD cash above $10,000 (at NAV ≥ $100k; proportional below; the first $10k is unpaid). IBKR Lite earns roughly 1 percentage point less.","sipc_insured":true}'::jsonb,
  'official', 'high',
  '[{"type":"sky","label":"Best for active trading"}]'::jsonb,
  ARRAY['Widest overnight trading window','Native TradingView integration','150+ global markets']::text[],
  ARRAY['Broadest overnight-trading window in the field (10,000+ symbols, Sun-Fri 8pm-3:50am ET)','Native TradingView integration — ForexBrokers.com''s "#1 Broker for TradingView 2026"','Access to 150+ markets across 33 countries via TWS','Full paper trading across stocks, options, futures, crypto and forex']::text[],
  ARRAY['TWS desktop platform has a steep learning curve for beginners','IBKR Pro tiered options pricing requires understanding volume tiers to get the best rate','No futures/options trading is genuinely no-cost — fees scale with activity']::text[],
  '{"fees":8.8,"features":9.6,"ux":8.2,"support":8.6}'::jsonb,
  'The best choice for active, advanced and global traders',
  'Interactive Brokers pairs IBKR Lite''s standard $0.65/contract options fee with the widest asset and market access in this category: 150+ global markets, the broadest overnight-trading window of any of the 9 brokers, native TradingView integration, and full paper trading across stocks, options, futures, crypto and forex — making it the clear pick for active and advanced traders willing to work with a steeper-learning-curve platform.',
  true, 'interactive-brokers-review', NULL, false, 'Best for active/advanced traders', 3,
  'https://www.interactivebrokers.com/en/pricing/commissions-options.php', DATE '2026-07-03', true
),
(
  NULL,
  'tastytrade', 'us', 'trading', 'trading-platforms', 'tastytrade', 'Cheapest for active options traders',
  8.8, 4.8, 2000, 0, NULL, 0,
  '{"options_fee":1.00,"options_fee_note":"Open+close cap structure: $1.00/contract to open (capped at $10/leg), $0 to close — the cheapest broker in the field for active/multi-leg options traders despite a higher nominal open fee.","fractional_shares":true,"fractional_shares_note":"From $5, $0.10 clearing fee per fractional trade; market orders (DAY) only, not available in extended hours.","crypto_trading":true,"crypto_note":"$0 commission; Zero Hash spread of 50-75bp (markup/markdown).","futures_trading":true,"paper_trading":false,"extended_hours":"overnight","extended_hours_note":"Extended-hours (EXT limit orders) plus 24/5 overnight trading for stocks and ETFs.","tradingview_integration":true,"cash_sweep_apy":0.01,"cash_sweep_note":"~0.01% effective on uninvested cash — no meaningful default yield.","sipc_insured":true}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Cheapest for active options traders','Native TradingView integration','Strong futures pricing']::text[],
  ARRAY['$1.00/contract to open, $0 to close, capped at $10/leg — the cheapest structure in the field for active, multi-leg options traders','Native TradingView integration, ranked top-3 by ForexBrokers.com in 2026','Strong futures pricing ($1.00/contract, $0.75 for micros)','40,000+ educational videos covering options mechanics to advanced strategies']::text[],
  ARRAY['No paper/demo trading account as of June 2026','Niche platform focused on options — not beginner-friendly for stock-only investors','Cash sweep yield is negligible (~0.01%) with no default alternative']::text[],
  '{"fees":9.0,"features":8.6,"ux":8.2,"support":8.6}'::jsonb,
  'The best value pick for active options and futures traders',
  'tastytrade''s $1.00-to-open/$0-to-close options structure (capped at $10/leg) makes it the cheapest broker in this category for active, multi-leg options traders, even though its nominal open fee looks higher than competitors'' flat $0.65. It pairs this with native TradingView integration and strong futures pricing, though it has no paper trading account and stays a niche, options-first platform rather than a beginner-friendly all-rounder.',
  false, 'tastytrade-review', NULL, false, 'Active options traders', 4,
  'https://tastytrade.com/pricing/', DATE '2026-07-03', true
),
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'robinhood' AND market = 'us' LIMIT 1),
  'robinhood', 'us', 'trading', 'trading-platforms', 'Robinhood', 'Simplest app for beginners',
  8.7, 4.2, 24000, 0, NULL, 0,
  '{"options_fee":0.08,"options_fee_note":"Round-trip of the combined $0.04/contract regulatory/clearing pass-through fee (in effect since 10.01.2025; Robinhood no longer charges $0/contract on options).","fractional_shares":true,"fractional_shares_note":"Fractional shares from $1.","crypto_trading":true,"crypto_note":"Robinhood Crypto — own crypto division with a broad coin lineup.","futures_trading":true,"paper_trading":false,"extended_hours":"overnight","extended_hours_note":"\"24 Hour Market\" — 900+ stocks/ETFs, Sunday 8:00pm to Friday 8:00pm ET.","tradingview_integration":false,"cash_sweep_apy":0.01,"cash_sweep_note":"0.01% with no subscription (uninvested cash sits as an unpaid free-credit balance); 3.35% APY only with the $5/month Robinhood Gold subscription.","sipc_insured":true}'::jsonb,
  'official', 'high',
  '[{"type":"sky","label":"Best for beginners"}]'::jsonb,
  ARRAY['Simplest app for beginners','$0 account minimum','Fractional shares from $1']::text[],
  ARRAY['$0 account minimum — lowest barrier to entry among US brokers','Fractional shares from $1 (true democratization of investing)','Simplest, most beginner-friendly mobile-first interface in the category','24 Hour Market extends trading to 900+ stocks/ETFs nearly around the clock']::text[],
  ARRAY['No paper/demo trading account','No longer truly $0 on options — a $0.04/contract pass-through fee applies since January 2025','Default cash sweep yield is just 0.01% unless you pay for Robinhood Gold ($5/mo)','No native TradingView integration']::text[],
  '{"fees":8.2,"features":8.0,"ux":9.4,"support":8.4}'::jsonb,
  'The simplest, least intimidating platform for first-time traders',
  'Robinhood''s pick here is about simplicity and user experience, not fees: its mobile-first app remains the easiest on-ramp into investing for absolute beginners, with a $0 account minimum and fractional shares from $1. It no longer offers genuinely free options trading (a small $0.04/contract pass-through fee applies since January 2025), has no paper trading account, and its default cash yield is negligible without a paid Gold subscription — trade-offs that active or cost-focused traders should weigh against its ease of use.',
  true, 'robinhood-review', NULL, false, 'Best for beginners', 5,
  'https://robinhood.com/us/en/support/articles/trading-fees-on-robinhood/', DATE '2026-07-03', true
),
(
  NULL,
  'webull', 'us', 'trading', 'trading-platforms', 'Webull', 'Best free charting and paper trading',
  8.5, 4.5, 15000, 0, NULL, 0,
  '{"options_fee":0.0,"options_fee_note":"$0/contract on equity options; $0.50/contract on certain index options.","fractional_shares":true,"fractional_shares_note":"Fractional shares from $5.","crypto_trading":true,"crypto_note":"50+ coins (BTC, ETH, SOL and others), directly in the main app, 24/7.","futures_trading":true,"paper_trading":true,"extended_hours":"overnight","extended_hours_note":"Full extended hours (4:00-9:30am + 4:00-8:00pm ET) plus overnight trading on 500+ symbols, Sunday-Thursday 8:00pm-4:00am ET.","tradingview_integration":true,"cash_sweep_apy":0.5,"cash_sweep_note":"Opt-in \"Cash Management\": 0.5% under $25k / 3.0% over $25k with no subscription; 3.35% with Webull Premium ($40/yr). No default sweep without activation.","sipc_insured":true}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['$0 options on equities','#1-rated paper trading','Official TradingView broker']::text[],
  ARRAY['$0/contract on equity options — one of only two true zero-fee options brokers here','StockBrokers.com "#1 Paper Trading 2026" — high-fidelity, unlimited simulation','Official, integrated TradingView broker — trade directly from TradingView charts','50+ free charting indicators and free Level II quotes for all users']::text[],
  ARRAY['Cash sweep requires manual opt-in — no yield at all without activating Cash Management','Chinese ownership (Fumi Technology) has drawn an ongoing CFIUS data-sharing review','Less established track record than Schwab, Fidelity or Interactive Brokers']::text[],
  '{"fees":9.0,"features":8.8,"ux":8.2,"support":7.6}'::jsonb,
  'A strong free-charting, zero-options-fee pick for self-directed traders',
  'Webull charges $0/contract on equity options and pairs that with official, native TradingView integration and StockBrokers.com''s top-rated paper trading simulator for 2026 — a compelling combination for cost-conscious, chart-driven traders. Its cash yield requires manually opting into Cash Management (nothing accrues by default), and its Chinese ownership structure has drawn an ongoing CFIUS review that some traders will want to weigh.',
  false, 'webull-review', NULL, false, 'Free charting & paper trading', 6,
  'https://www.webull.com/pricing', DATE '2026-07-03', true
),
(
  NULL,
  'etrade', 'us', 'trading', 'trading-platforms', 'E*TRADE', 'Best options probability tools',
  8.4, 4.0, 2000, 0, NULL, 0,
  '{"options_fee":1.30,"options_fee_note":"Round-trip (open+close) of the official $0.65/contract per-leg fee; drops to $0.50/contract at 30+ trades per quarter.","fractional_shares":false,"fractional_shares_note":"No fractional-share purchases — only dividend reinvestment lands in fractional amounts (as of May 2026).","crypto_trading":true,"crypto_note":"New pilot (since May 2026): BTC/ETH/SOL via Zero Hash, 50bp/trade; full rollout to all 8.6M customers planned for \"later 2026\" — not yet universally available.","futures_trading":true,"paper_trading":true,"extended_hours":"overnight","extended_hours_note":"Near-24/5 — pre-market 7:00-9:30am, after-hours 4:00-8:00pm, plus an overnight session 8:00pm-7:00am ET, Sunday-Thursday.","tradingview_integration":false,"cash_sweep_apy":0.01,"cash_sweep_note":"0.01% APY default sweep for all tiers up to $999,999 (0.05% from $500k, 0.15% only from $1M) — Morgan Stanley Bank Deposit Program.","sipc_insured":true}'::jsonb,
  'editorial', 'medium',
  '[]'::jsonb,
  ARRAY['Power E*TRADE probability tools','Morgan Stanley integration','Solid mobile app']::text[],
  ARRAY['Power E*TRADE probability tools including cone visualization, Greeks display, and risk/reward calculator','Options fee drops to $0.50/contract at 30+ trades per quarter','Morgan Stanley integration for wealth-management clients','Well-rated mobile app (4.6/5) with one-tap trading']::text[],
  ARRAY['No fractional-share purchases — only dividend reinvestment produces fractional amounts','New crypto offering is a limited pilot; full rollout to all customers not expected until later in 2026','Default cash sweep yield is just 0.01% for the vast majority of balances','No native TradingView integration']::text[],
  '{"fees":8.0,"features":8.4,"ux":8.4,"support":8.0}'::jsonb,
  'A solid choice for options traders who want built-in probability tools',
  'E*TRADE pairs a standard $0.65/contract options fee (discounted to $0.50 for frequent traders) with Power E*TRADE''s probability-of-profit visualization tools and Morgan Stanley wealth-management integration. Its new crypto offering is still a limited pilot ahead of a planned "later 2026" full rollout, it doesn''t support fractional-share purchases, and its default cash-sweep yield is negligible for most account sizes.',
  false, 'etrade-review', NULL, false, 'Options probability tools', 7,
  'https://us.etrade.com/what-we-offer/pricing-and-rates', DATE '2026-07-03', true
),
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'etoro' AND market = 'us' LIMIT 1),
  'etoro', 'us', 'trading', 'trading-platforms', 'eToro', 'Only true $0-fee options broker',
  8.3, 4.7, 24567, 0, NULL, 100,
  '{"options_fee":0.0,"options_fee_note":"$0/contract for US customers — no commission or contract fees beyond regulatory pass-throughs. The only true $0-options broker among these 9.","fractional_shares":true,"fractional_shares_note":"Fractional investing from $10 — a core feature of the platform.","crypto_trading":true,"crypto_note":"Core business line; 1% fee per buy/sell (separately disclosed since mid-July 2025).","futures_trading":false,"paper_trading":true,"extended_hours":null,"extended_hours_note":"Not established for US accounts — eToro offers 24/5-labelled assets and a .EXT extended-hours product internationally, but the latter is CFD-based (non-US) and US availability of the 24/5 label is unverified. Shown as — rather than asserted either way.","tradingview_integration":true,"cash_sweep_apy":0.0,"cash_sweep_note":"0% by default — opt-in \"Interest on Balance\" up to 3.55% AER, tiered by realized equity; US eligibility starts at $10,000; no subscription, but no automatic sweep either.","sipc_insured":true}'::jsonb,
  'official', 'low',
  '[]'::jsonb,
  ARRAY['$0 options fee','$100k demo account','Native TradingView integration']::text[],
  ARRAY['$0/contract options — the only true zero-fee options broker in this comparison','$100,000 virtual demo portfolio, automatically included for every account','Native TradingView integration, independently confirmed by BrokerChooser and ForexBrokers.com','Industry-leading social/copy-trading community with 50M+ global users']::text[],
  ARRAY['$100 minimum first deposit for US customers, higher than most peers'' $0','No futures trading available on the US platform','Extended-hours trading availability for US accounts is not established — we show it as unverified rather than claim it']::text[],
  '{"fees":8.8,"features":8.0,"ux":8.4,"support":7.8}'::jsonb,
  'The cheapest options broker in the category, with a caveat on extended hours',
  'eToro is the only broker in this comparison charging genuinely $0 per options contract for US customers, backed by a large, well-known social/copy-trading community and a permanent $100,000 demo account. It requires a $100 minimum first deposit (versus $0 at most peers), and its extended-hours trading availability for US accounts could not be verified at the time of research, so we show it as unestablished rather than claim a feature that may not exist for US customers.',
  true, 'etoro-review', NULL, false, 'Cheapest options trading', 8,
  'https://www.etoro.com/en-us/trading/fees/', DATE '2026-07-03', true
),
(
  NULL,
  'merrill-edge', 'us', 'trading', 'trading-platforms', 'Merrill Edge', 'Best for existing Bank of America / Merrill clients',
  8.0, 4.1, 1200, 0, NULL, 0,
  '{"options_fee":1.30,"options_fee_note":"Round-trip (open+close) of the official $0.65/contract per-leg fee.","fractional_shares":false,"fractional_shares_note":"No fractional-share purchases — only dividend reinvestment lands in fractional amounts.","crypto_trading":false,"crypto_note":"No spot crypto trading as of February 2026 — only crypto-linked ETFs.","futures_trading":false,"paper_trading":false,"extended_hours":"classic","extended_hours_note":"Pre-market 7:00-9:30am + after-hours 4:01-8:00pm ET; no 24-hour session; opt-in required, limit orders only.","tradingview_integration":false,"cash_sweep_apy":0.01,"cash_sweep_note":"0.01% APY — Merrill Lynch Bank Deposit Program Tier 1 (under $250k), per the official rate sheet dated 02.07.2026. Opt-in alternative \"Preferred Deposit\" pays 2.89% (min. $100,000, not a sweep).","sipc_insured":true}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Deep Bank of America integration','Preferred Rewards benefits','$0 minimum']::text[],
  ARRAY['Deep integration with Bank of America checking, savings and credit cards','Preferred Rewards program can unlock trading and banking perks for larger relationship balances','$0 account minimum, $0 stock/ETF commissions']::text[],
  ARRAY['No fractional shares, no crypto trading, no futures and no paper trading account — the most limited feature set in this comparison','Default cash sweep yield is just 0.01% unless you qualify for the $100,000-minimum Preferred Deposit tier','Public review volume is thin and skews negative on some review sites, a known pattern for big-bank brokerage spinoffs rather than a unique red flag']::text[],
  '{"fees":7.6,"features":6.8,"ux":7.6,"support":7.8}'::jsonb,
  'The natural choice for existing Bank of America / Merrill relationship clients',
  'Merrill Edge charges a standard $0.65/contract options fee and $0 stock/ETF commissions, with its real advantage being deep integration into Bank of America banking and the Preferred Rewards relationship-banking program rather than any standout trading feature — it has no fractional shares, no crypto, no futures and no paper trading. Its public review volume is thin and skews negative on some consumer review sites, which is a known complaint-bias pattern for big-bank brokerage spinoffs rather than evidence of a specific problem.',
  false, NULL, 'https://www.merrilledge.com/', false, 'Bank of America / Merrill clients', 9,
  'https://www.merrilledge.com/pricing', DATE '2026-07-03', true
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
