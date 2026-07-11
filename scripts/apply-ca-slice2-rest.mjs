#!/usr/bin/env node
// AU/CA/UK rollout Slice CA-2 (forex/forex-brokers, housing/mortgage-brokers,
// gold-investing/platforms) — second Canada slice. Applies seed rows via the
// PostgREST API (upsert on the product_attributes unique constraint), same
// working pattern as apply-au-slice{1,2,3}-rest.mjs / apply-ca-slice1-rest.mjs
// (exec_sql RPC and direct Postgres connection are both unreachable from
// this environment).
// Row data mirrors supabase/migrations/20260711190000-20260711190200 exactly
// — those .sql files remain the source-of-truth audit trail; this script is
// the actual write path used to seed prod.
// Usage: node --env-file=.env.local scripts/apply-ca-slice2-rest.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

const forexBrokers = [
  {
    slug: 'interactive-brokers-ca', market: 'ca', category: 'forex', topic: 'forex-brokers',
    display_name: 'Interactive Brokers Canada', tagline: 'The tightest pass-through pricing for active traders',
    score: 9.0, rating: 3.5, review_count: 5200, clicks: 5200, management_fee: 0.003, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Pass-through ECN pricing', '17+ liquidity providers', 'TWS, Client Portal, mobile'],
    pros: [
      'Aggregates 17+ liquidity providers for pass-through/ECN-style pricing with no markup on spread',
      'Lowest all-in cost of any candidate researched for active traders',
      'Direct CIRO and CIPF member with a long institutional track record',
    ],
    cons: [
      'Trustpilot score (3.5/5, ~5,200 reviews) is a global brand page, not Canada-specific',
      'Platform (TWS) has a steeper learning curve than simpler retail-focused competitors',
    ],
    sub_scores: { cost: 9.8, platforms: 8.6, trust: 9.0, support: 7.6 },
    verdict: 'The lowest all-in trading cost in this comparison, built for active traders.',
    attributes: { ciro_member: 'Interactive Brokers Canada Inc.', avg_spread_eurusd_pips: 0.1, commission_round_turn_cad: 2, account_type_note: 'Pass-through/ECN pricing aggregating 17+ liquidity providers; tiered commission ~0.08-0.20bps of trade value', max_leverage: '50:1', platforms: ['TWS', 'IBKR Desktop', 'Client Portal', 'IBKR Mobile'], trustpilot_rating: 3.5, trustpilot_count: 5200, trustpilot_note: 'Global brand-level Trustpilot page, not Canada-entity-specific', regulatory_note: 'FINRA fined Interactive Brokers LLC (the U.S. broker-dealer entity) $2.25M in December 2024 for failing to detect/prevent "free-riding" in cash accounts (2015-2022), a further $650,000 in August 2025 for options-approval supervisory failures, and $125,000 in September 2025 for municipal-bond disclosure lapses. These are U.S.-entity FINRA actions — no CIRO enforcement action against Interactive Brokers Canada Inc. specifically was found at research time.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.interactivebrokers.ca/en/trading/products-spot-currencies.php',
    is_top_pick: true, best_for: 'Active traders wanting the lowest all-in cost', display_order: 1,
    source_url: 'https://www.interactivebrokers.ca/en/pricing/commissions-spot-currencies.php', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'cmc-markets-ca', market: 'ca', category: 'forex', topic: 'forex-brokers',
    display_name: 'CMC Markets Canada', tagline: '330+ FX pairs with no minimum deposit and no issues found',
    score: 8.7, rating: 4.0, review_count: 3230, clicks: 3230, management_fee: 0.0065, account_minimum: 0,
    badges: [{ type: 'green', label: 'Best overall' }],
    chips: ['330+ FX pairs', 'Funds at Canadian chartered banks', 'No minimum deposit'],
    pros: [
      'A direct CIRO dealer member (CMC Markets Canada Inc.) with funds segregated at a Canadian chartered bank',
      '330 FX pairs — the widest instrument range of any candidate researched',
      'No minimum deposit and no Canada-specific regulatory issues found',
    ],
    cons: [
      'Trustpilot score (4.0/5, ~3,230 reviews) is a global brand page, not Canada-specific',
      'Alberta CFD access is restricted to Accredited Investors only',
    ],
    sub_scores: { cost: 8.4, platforms: 8.2, trust: 9.4, support: 8.4 },
    verdict: 'The best all-round choice — widest pair range, no minimum deposit, clean record.',
    attributes: { ciro_member: 'CMC Markets Canada Inc.', avg_spread_eurusd_pips: 0.3, commission_round_turn_cad: 3.5, account_type_note: 'FX Active account, spreads from 0.0 pip plus commission; standard account is commission-free with wider spreads', max_leverage: '50:1', platforms: ['Next Generation', 'MT4'], trustpilot_rating: 4.0, trustpilot_count: 3230, trustpilot_note: 'Global brand-level Trustpilot page, not Canada-entity-specific', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.cmcmarkets.com/en-ca/',
    is_top_pick: false, best_for: 'Traders wanting the widest pair range', display_order: 2,
    source_url: 'https://www.cmcmarkets.com/en-ca/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'oanda-ca', market: 'ca', category: 'forex', topic: 'forex-brokers',
    display_name: 'OANDA Canada', tagline: 'Native CAD accounts with a genuine Toronto office',
    score: 8.4, rating: 3.9, review_count: 1200, clicks: 1200, management_fee: 0.0095, account_minimum: 0,
    badges: [{ type: 'sky', label: 'Best for beginners' }],
    chips: ['Native CAD accounts', 'Toronto head office', 'No minimum deposit'],
    pros: [
      'A direct CIRO dealer member (OANDA (Canada) Corporation ULC) with a genuine Toronto head office',
      'Native CAD account support and simple, transparent spread-only pricing',
      'No minimum deposit, with micro-lots available from 1 unit',
    ],
    cons: [
      'Standard-account spreads are wider than a raw/ECN tier — active traders may prefer a commission-based competitor',
      'Trustpilot figures vary by regional page (3.7-4.1/5, ~1,150-1,220 reviews) — not perfectly comparable across entities',
    ],
    sub_scores: { cost: 7.4, platforms: 8.0, trust: 8.4, support: 8.2 },
    verdict: 'The most "Canadian" broker experience — native CAD accounts and local presence.',
    attributes: { ciro_member: 'OANDA (Canada) Corporation ULC', avg_spread_eurusd_pips: 0.95, commission_round_turn_cad: 0, account_type_note: 'Standard account, spread-only, no commission; Core Pricing (raw spread + commission) requires a much larger balance', max_leverage: '50:1', platforms: ['OANDA Trade', 'MT4', 'TradingView'], trustpilot_rating: 3.9, trustpilot_count: 1200, trustpilot_note: 'OANDA maintains multiple regional Trustpilot pages — figures are not perfectly comparable across entities', regulatory_note: "The U.S. NFA fined OANDA Corporation (OANDA's U.S. entity) $600,000 in May 2025 for capital-adequacy deficiencies persisting 7+ months in 2023, a pricing/API error that harmed roughly 3,900 customers (with restitution agreed), and inadequate disclosure of a crypto-broker relationship. This action targets OANDA's U.S. entity — no confirmed CIRO enforcement action against OANDA (Canada) Corporation ULC specifically was found at research time." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.oanda.com/ca-en/',
    is_top_pick: false, best_for: 'Beginners wanting native CAD accounts', display_order: 3,
    source_url: 'https://www.oanda.com/ca-en/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'questrade-global', market: 'ca', category: 'forex', topic: 'forex-brokers',
    display_name: 'Questrade (Questrade Global)', tagline: "Canada's largest independent broker's FX arm",
    score: 8.0, rating: 1.35, review_count: 350, clicks: 350, management_fee: 0.008, account_minimum: 1000,
    badges: [],
    chips: ['110+ currency pairs', 'Saxo-powered platform', 'Largest independent CA broker'],
    pros: [
      "Canada's largest independent broker (~$50B+ AUA), with an FX/CFD arm covering 110+ pairs",
      'Saxo Bank-powered Questrade Global platform offers institutional-grade execution',
      'Direct CIRO dealer member with supplemental private insurance beyond standard CIPF coverage',
    ],
    cons: [
      'Recent Trustpilot score is poor (1.3-1.4/5, ~300-400 reviews) — a sharp divergence from older, more positive aggregator citations',
      '$0 to open, but a $1,000 CAD balance is required before trading is enabled',
    ],
    sub_scores: { cost: 8.2, platforms: 8.6, trust: 5.6, support: 6.0 },
    verdict: "Canada's largest independent broker's FX arm, with real recent service complaints to weigh.",
    attributes: { ciro_member: 'Questrade Inc.', avg_spread_eurusd_pips: 0.8, commission_round_turn_cad: 0, account_type_note: 'Questrade Global (Saxo Bank-powered), spread-inclusive pricing, 110+ pairs', max_leverage: '50:1', platforms: ['Questrade Global', 'Questrade Edge', 'IQ Edge'], trustpilot_rating: 1.35, trustpilot_count: 350, trustpilot_note: 'ca.trustpilot.com — recent snapshots show 1.3-1.4/5 (~300-400 reviews); older aggregator citations claim 4.2/5 (2,000+ reviews) — the low recent score is treated as the more reliable current read', regulatory_note: 'Questrade was named, alongside five other Canadian financial institutions, in an April 2025 Quebec class action alleging non-disclosure of currency-conversion fees on self-directed accounts — an active, unresolved matter as of this page\'s last verification.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.questrade.com/',
    is_top_pick: false, best_for: 'Existing Questrade customers wanting one platform', display_order: 4,
    source_url: 'https://www.questrade.com/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'forex-com-ca', market: 'ca', category: 'forex', topic: 'forex-brokers',
    display_name: 'FOREX.com Canada', tagline: 'Part of the NASDAQ-listed StoneX Group',
    score: 7.6, rating: 4.3, review_count: 2350, clicks: 2350, management_fee: 0.012, account_minimum: 0,
    badges: [],
    chips: ['Backed by NASDAQ-listed StoneX', 'Standard & RAW account tiers', 'Trading Central integration'],
    pros: [
      'Backed by StoneX Group Inc. (NASDAQ-listed parent), a large, well-capitalized institution',
      'Choice of spread-only Standard account or commission-based RAW account for high-volume traders',
      'Proprietary platform bundles Trading Central research alongside MT4/MT5',
    ],
    cons: [
      'Minimum deposit for the Canadian entity specifically was not firmly confirmed — verify directly before opening',
      'Trustpilot score (4.0-4.6/5, ~2,300-2,400 reviews) is a global/US brand page, not Canada-isolated',
    ],
    sub_scores: { cost: 7.0, platforms: 8.4, trust: 8.2, support: 7.8 },
    verdict: 'A well-capitalized global broker with a straightforward Standard account tier.',
    attributes: { ciro_member: 'FOREX.com Canada (StoneX Group Inc.)', avg_spread_eurusd_pips: 1.2, commission_round_turn_cad: 0, account_type_note: 'Standard account, spread-only, no commission; RAW account offers tighter spreads plus a per-lot commission for high-volume traders', max_leverage: '50:1', platforms: ['FOREX.com Web/Mobile', 'MT4', 'MT5'], trustpilot_rating: 4.3, trustpilot_count: 2350, trustpilot_note: 'Global/US brand-level Trustpilot page, not Canada-entity-specific', regulatory_note: "The U.S. NFA fined StoneX Markets LLC (FOREX.com's U.S. parent entity) $1,000,000 in January 2023 for margin-rule violations, and the CFTC separately fined StoneX Markets $650,000 for a disclosure breach. These target StoneX's U.S. entity — no confirmed CIRO enforcement action against FOREX.com Canada specifically was found at research time." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.forex.com/en-ca/',
    is_top_pick: false, best_for: 'Traders wanting a large, well-capitalized parent', display_order: 5,
    source_url: 'https://www.forex.com/en-ca/pricing/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'avatrade-ca', market: 'ca', category: 'forex', topic: 'forex-brokers',
    display_name: 'AvaTrade Canada', tagline: 'A globally recognized brand, regulated in Canada via Friedberg',
    score: 7.2, rating: 4.75, review_count: 12000, clicks: 12000, management_fee: 0.009, account_minimum: 0,
    badges: [],
    chips: ['MT4, MT5, AvaOptions', 'Copy trading (ZuluTrade, DupliTrade)', 'Regulated via Friedberg Direct'],
    pros: [
      'High global brand recognition (4.7-4.8/5 on Trustpilot globally, 11,000+ reviews)',
      'Broad platform choice including MT4, MT5, WebTrader and AvaOptions, plus copy-trading integrations',
      "Canadian accounts are held under Friedberg Mercantile Group Ltd.'s CIRO membership, giving genuine CIPF coverage",
    ],
    cons: [
      'Not independently CIRO-registered — operates in Canada solely via a technology/branding license with Friedberg Direct',
      'Trustpilot figures are brand-level (global/UK pages), not Canada-entity-specific',
    ],
    sub_scores: { cost: 7.8, platforms: 9.0, trust: 6.6, support: 7.4 },
    verdict: 'A globally recognized platform — understand the Friedberg regulatory relationship first.',
    attributes: { ciro_member: 'Friedberg Mercantile Group Ltd. (via AvaTrade Technology license)', avg_spread_eurusd_pips: 0.9, commission_round_turn_cad: 0, account_type_note: 'Standard no-commission model, 50+ FX pairs', max_leverage: '50:1', platforms: ['MT4', 'MT5', 'WebTrader', 'AvaOptions'], trustpilot_rating: 4.75, trustpilot_count: 12000, trustpilot_note: 'avatrade.com global page shows 4.7-4.8/5 (11,000-12,800+ reviews); avatrade.co.uk shows ~4.0/5 (2,700 reviews) — neither is Canada/Friedberg-specific', regulatory_note: 'AvaTrade Canada is not independently CIRO-registered. Canadian accounts are opened and held by Friedberg Mercantile Group Ltd. (trading as Friedberg Direct), which licenses AvaTrade\'s trading technology and branding for the Canadian market — see Friedberg Direct\'s own row for the shared-entity relationship. Historically, AvaTrade paid a $244,000 fine in 2020 to settle allegations of operating as an unregistered entity in a Canadian province before this Friedberg-licensing structure was formalized — dated, and disclosed as context for why the current structure exists, not a current compliance issue.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.avatrade.ca/',
    is_top_pick: false, best_for: 'Traders wanting AvaTrade\'s global platform in Canada', display_order: 6,
    source_url: 'https://www.avatrade.ca/about-friedberg/why-friedberg/regulation', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'friedberg-direct', market: 'ca', category: 'forex', topic: 'forex-brokers',
    display_name: 'Friedberg Direct', tagline: "One of Canada's oldest independent brokers, since 1971",
    score: 7.0, rating: 0, review_count: 0, clicks: 0, management_fee: 0.011, account_minimum: 0,
    badges: [],
    chips: ['Independent since 1971', 'Direct CIRO + CIPF member', 'MT4, MT5, WebTrader'],
    pros: [
      "One of the oldest independent Canadian brokers still operating (since 1971)",
      'Direct CIRO dealer member and CIPF member in its own right — the same regulated entity that also holds AvaTrade Canada',
      'Standard MetaTrader platform choice (MT4, MT5) plus its own WebTrader',
    ],
    cons: [
      'No independent, reliable review-platform sample found specifically for the Friedberg Direct brand',
      'Some Friedberg-branded pages reference a co-branding relationship with FXCM rather than AvaTrade — confirm which technology partner is current before opening an account',
    ],
    sub_scores: { cost: 7.2, platforms: 7.6, trust: 8.2, support: 7.0 },
    verdict: "One of Canada's longest-operating independent brokers, directly CIRO-regulated.",
    attributes: { ciro_member: 'Friedberg Mercantile Group Ltd. (Friedberg Direct)', avg_spread_eurusd_pips: 1.1, commission_round_turn_cad: 0, account_type_note: 'Standard no-commission model', max_leverage: '50:1', platforms: ['MT4', 'MT5', 'Friedberg WebTrader'], trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No distinct, reliable Trustpilot page found for Friedberg Direct specifically — shown as not yet rated', regulatory_note: 'Friedberg Mercantile Group Ltd. is the CIRO dealer member of record for both the Friedberg Direct and AvaTrade Canada brands (see AvaTrade Canada\'s row for the shared-entity relationship). Some Friedberg-branded marketing pages reference "powered by FXCM" rather than AvaTrade, suggesting the current primary technology partner should be confirmed directly with Friedberg before opening an account. No independent CIRO enforcement action against Friedberg was found at research time.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.friedbergdirect.com/',
    is_top_pick: false, best_for: 'Traders wanting the longest-operating CA broker', display_order: 7,
    source_url: 'https://www.friedbergdirect.com/', data_verified_at: '2026-07-11', active: true,
  },
];

const mortgageBrokers = [
  {
    slug: 'ratehub', market: 'ca', category: 'housing', topic: 'mortgage-brokers',
    display_name: 'Ratehub', tagline: "Canada's dominant rate aggregator, with its own licensed brokerage",
    score: 9.0, rating: 4.3, review_count: 92, clicks: 92, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['$15B+ mortgages facilitated since 2015', 'Own brokerage: CanWise', '$0 to you — paid by the lender'],
    pros: [
      "Canada's dominant rate-comparison platform, having facilitated $15B+ in mortgages since 2015",
      'Owns a licensed in-house brokerage (CanWise) for direct execution, not just rate listing',
      'Confirmed licensing in Ontario, Quebec and BC, with 30+ lenders on its panel',
    ],
    cons: [
      'Explicitly states it does not include the entire universe of available offers',
      'Customer reviews describe occasional pre-approval/rate-creep friction once an agent engages',
    ],
    sub_scores: { trust: 9.0, coverage: 8.4, rating: 8.6 },
    verdict: "Canada's most recognized rate-comparison brand, backed by a real licensed brokerage.",
    attributes: { business_model: 'rate_comparison_platform', business_model_note: 'Rate-comparison/publisher platform that also owns an in-house licensed brokerage (formerly branded CanWise Financial); compensated via lender referral fees and sponsored placements', provincial_licenses: ['ON', 'QC', 'BC'], lender_panel_note: '30+ lenders including online lenders and MICs; states it does not include the entire market', consumer_fee_note: '$0 — paid by the lender', trustpilot_rating: 4.3, trustpilot_count: 92, trustpilot_note: 'ca.trustpilot.com', regulatory_note: 'Recurring complaint themes in customer reviews: pre-approvals dropped or rescinded close to renewal, rate or cost creep once an agent engages, and slow communication — service-quality issues, not confirmed regulatory action.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.ratehub.ca/',
    is_top_pick: true, best_for: 'Borrowers wanting the most recognized aggregator', display_order: 1,
    source_url: 'https://www.ratehub.ca/about-ratehub', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'nesto', market: 'ca', category: 'housing', topic: 'mortgage-brokers',
    display_name: 'nesto', tagline: "Canada's largest fully-digital mortgage broker",
    score: 8.8, rating: 4.4, review_count: 344, clicks: 344, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'green', label: 'Best fully-digital experience' }],
    chips: ['450,000+ customers', 'Rate-match guarantee', '150-day rate hold'],
    pros: [
      "Canada's largest fully-digital mortgage broker (450,000+ customers since 2018)",
      'Rate-match guarantee and a 150-day rate hold, both genuinely differentiated features',
      'Broad provincial licensing footprint (8 provinces confirmed) with published license numbers',
    ],
    cons: [
      'Blends broker and in-house-lender roles on some files — not a pure independent broker for every mortgage',
      'Lender panel size not currently disclosed as a headline number',
    ],
    sub_scores: { trust: 8.6, coverage: 9.0, rating: 8.8 },
    verdict: 'The largest and most fully-digital mortgage experience in this comparison.',
    attributes: { business_model: 'hybrid_broker_lender', business_model_note: 'Digital mortgage brokerage that also funds some of its own insured mortgages directly — a broker/lender hybrid depending on the specific product', provincial_licenses: ['ON', 'BC', 'AB', 'SK', 'NB', 'NS', 'NL', 'QC'], lender_panel_note: '11+ institutional lending partners historically disclosed, plus nesto\'s own funding capacity for some insured mortgages', consumer_fee_note: '$0 for standard files; fees can apply on non-standard/self-employed files — confirm per file', trustpilot_rating: 4.4, trustpilot_count: 344, trustpilot_note: 'ca.trustpilot.com; Google shows ~4.5/5 from 1,500+ reviews', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.nesto.ca/',
    is_top_pick: false, best_for: 'Borrowers wanting a fully digital experience', display_order: 2,
    source_url: 'https://www.nesto.ca/licences/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'true-north-mortgage', market: 'ca', category: 'housing', topic: 'mortgage-brokers',
    display_name: 'True North Mortgage', tagline: 'The highest independently corroborated customer rating researched',
    score: 8.6, rating: 4.9, review_count: 2500, clicks: 2500, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'sky', label: 'Highest-rated by customers' }],
    chips: ['4.9/5 Trustpilot', 'In-house lender: THINK Financial', 'Serving Canada since 1999'],
    pros: [
      'Highest customer rating researched for this comparison (4.9/5 on Trustpilot)',
      'Operating since 1999, with an in-house lender (THINK Financial) used alongside third-party A/B lenders',
      'Serves Atlantic Canada in addition to the provinces most competitors focus on',
    ],
    cons: [
      "The company's own \"About\" page still references FSCO, Ontario's mortgage regulator retired in 2019 and replaced by FSRA — confirm the current FSRA registration directly rather than trusting the website reference",
      'Claims 17,000+ five-star reviews across platforms; this figure is self-reported',
    ],
    sub_scores: { trust: 8.4, coverage: 8.0, rating: 9.6 },
    verdict: 'The highest customer rating in this comparison, with a genuine in-house lending arm.',
    attributes: { business_model: 'hybrid_broker_lender', business_model_note: 'Traditional brokerage that also owns an in-house lender, THINK Financial, used for some client files alongside third-party A/B lenders', provincial_licenses: ['AB', 'BC', 'ON'], lender_panel_note: 'Works with large public banks and small private trust companies, plus its in-house lender THINK Financial; exact panel size not disclosed', consumer_fee_note: '$0 standard', trustpilot_rating: 4.9, trustpilot_count: 2500, trustpilot_note: 'ca.trustpilot.com — rating sourced via the approved candidate shortlist (NerdWallet Canada/Trustpilot); the company separately claims 17,000+ five-star reviews across all platforms, which was not independently re-confirmed this pass', regulatory_note: "True North Mortgage's own \"About\" page still references FSCO, the Ontario mortgage regulator retired in 2019 and replaced by FSRA — stale website content rather than a licensing problem, but worth confirming the current FSRA registration number directly before relying on it." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.truenorthmortgage.ca/',
    is_top_pick: false, best_for: 'Borrowers prioritizing customer satisfaction', display_order: 3,
    source_url: 'https://www.truenorthmortgage.ca/about-us/company-profile', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'butler-mortgage', market: 'ca', category: 'housing', topic: 'mortgage-brokers',
    display_name: 'Butler Mortgage', tagline: 'One of the largest disclosed lender panels in this comparison',
    score: 8.0, rating: 0, review_count: 0, clicks: 0, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['350+ lending partners', 'Rate-beat guarantee', 'Discount brokerage since 1997'],
    pros: [
      'Claims 350+ lending partners — the largest disclosed panel of any candidate researched',
      'Discount brokerage model (cuts its own commission rather than charging fees) operating since 1997',
      'Rate-beat and after-approval rate guarantees',
    ],
    cons: [
      'Public reviews are mixed, with no single reliable aggregate score found across platforms',
      'Some complaints describe rate increases after the initial quote, and one account alleges pressure on a client who threatened a negative review',
    ],
    sub_scores: { trust: 7.2, coverage: 7.8, rating: 6.8 },
    verdict: 'The largest disclosed lender panel of any candidate — service consistency is the real variable.',
    attributes: { business_model: 'licensed_brokerage', business_model_note: 'Discount mortgage brokerage in business since 1997; buys down rates by cutting its own commission rather than charging consumer fees', provincial_licenses: ['ON', 'BC', 'AB'], lender_panel_note: '350+ lending partners — one of the largest disclosed panels among Canadian brokers', consumer_fee_note: '$0, with a lowest-rate and after-approval rate guarantee', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'Public reviews are mixed across platforms with no single reliable aggregate score found — see regulatory note for specific complaint themes', regulatory_note: 'Public complaints describe rate creep after the initial quote, and one account alleges the company pressured a client who threatened a negative review. No regulatory enforcement action found.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.butlermortgage.ca/',
    is_top_pick: false, best_for: 'Borrowers wanting the largest lender panel', display_order: 4,
    source_url: 'https://www.butlermortgage.ca/our-lenders/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'pine', market: 'ca', category: 'housing', topic: 'mortgage-brokers',
    display_name: 'Pine', tagline: 'Digital-first, distributed through Wealthsimple',
    score: 7.8, rating: 4.7, review_count: 308, clicks: 308, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['Distributed via Wealthsimple', 'Broker + direct lender', '4.7/5 Google (308 reviews)'],
    pros: [
      'Functions as both a licensed broker and a direct lender, funded via partner financial institutions',
      'Distributed partly through Wealthsimple Mortgage Services Inc. — a natural fit for existing Wealthsimple users',
      '4.7/5 on Google from 308 reviews, praising service speed and rates',
    ],
    cons: [
      'Not yet licensed in Quebec or the territories (Quebec approval reportedly in progress)',
      'No meaningful Trustpilot sample yet, consistent with its 2021 founding',
    ],
    sub_scores: { trust: 7.6, coverage: 7.0, rating: 8.4 },
    verdict: 'A modern, digital-first hybrid broker/lender with a genuine Wealthsimple integration.',
    attributes: { business_model: 'hybrid_broker_lender', business_model_note: 'Digital-first mortgage broker, founded 2021, that also functions as a direct lender funded via partner financial institutions; distributed partly through Wealthsimple Mortgage Services Inc., which earns a separate referral fee', provincial_licenses: ['ON', 'BC', 'AB', 'SK', 'NB', 'NS', 'NL'], lender_panel_note: 'Functions as both a licensed broker and a direct lender funded via partner financial institutions; exact panel size not disclosed', consumer_fee_note: '$0 — no origination, application, processing, underwriting or commitment-break fees; standard third-party costs (appraisal, legal) may still apply', trustpilot_rating: 4.7, trustpilot_count: 308, trustpilot_note: 'Google rating (308 reviews) — no meaningful Trustpilot sample yet, consistent with Pine\'s 2021 founding', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.pine.ca/',
    is_top_pick: false, best_for: 'Wealthsimple users wanting an integrated mortgage', display_order: 5,
    source_url: 'https://www.pine.ca/mortgage', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'perch', market: 'ca', category: 'housing', topic: 'mortgage-brokers',
    display_name: 'Perch', tagline: 'A smaller digital broker with a BBB A+ rating since 2023',
    score: 7.4, rating: 0, review_count: 0, clicks: 0, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['30+ lenders', 'BBB-accredited since 2023', 'Ongoing renewal optimization focus'],
    pros: [
      'BBB-accredited since August 2023, with a clean profile at research time',
      'Positions itself around ongoing renewal-scenario optimization, not just origination',
      'Aggregates 30+ lenders (banks, credit unions, B-lenders, private lenders)',
    ],
    cons: [
      'Only its Ontario FSRA license was independently confirmed, despite claims of operating in all provinces',
      'No consolidated Trustpilot page found specifically for the Canadian mortgage entity — thinner third-party verification than larger peers',
    ],
    sub_scores: { trust: 7.0, coverage: 6.4, rating: 6.6 },
    verdict: 'A smaller, BBB-accredited digital broker — confirm your province\'s licensing directly.',
    attributes: { business_model: 'licensed_brokerage', business_model_note: 'Digital mortgage brokerage/comparison hybrid, founded 2018, positioned around ongoing renewal-scenario optimization', provincial_licenses: ['ON'], lender_panel_note: '30+ lenders (banks, credit unions, B-lenders, private lenders); company states it operates in all provinces though only its Ontario FSRA license was independently confirmed', consumer_fee_note: '$0', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No consolidated Trustpilot page found for the Canadian mortgage entity specifically — thinner third-party verification than larger peers on this page', regulatory_note: "Not to be confused with unrelated US \"Perch Loans\" or UK \"Perch Capital Limited\" entities, which carry unrelated complaint histories under the same brand name — this row refers specifically to the Canadian mortgage brokerage (Perch Mortgages, myperch.io)." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://myperch.io/',
    is_top_pick: false, best_for: 'Borrowers wanting a smaller, digital-first broker', display_order: 6,
    source_url: 'https://myperch.io/faq/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'mortgage-alliance', market: 'ca', category: 'housing', topic: 'mortgage-brokers',
    display_name: 'Mortgage Alliance', tagline: 'A large national franchise network under M3 Financial Group',
    score: 7.2, rating: 0, review_count: 0, clicks: 0, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['2,400+ professionals', '100+ franchises since 1998', 'Part of M3 Financial Group'],
    pros: [
      'Large national franchise network — 2,400+ mortgage professionals across 100+ franchises since 1998',
      'Part of M3 Financial Group, Canada\'s largest non-bank mortgage originator ($75B+ annual volume group-wide)',
      'No comparable regulatory scrutiny found, unlike a competing network (see disclosure below)',
    ],
    cons: [
      'Not a single licensed brokerage — each individual broker or franchise holds their own provincial license, so service quality depends heavily on which broker you\'re matched with',
      'BBB lists the parent entity as Not Rated / Not Accredited, and reputation is fragmented across dozens of regional franchise listings',
    ],
    sub_scores: { trust: 7.4, coverage: 8.0, rating: 5.4 },
    verdict: 'A large, in-person franchise network — outcomes depend heavily on your individual broker.',
    attributes: { business_model: 'franchise_network', business_model_note: 'Large franchise-based brokerage network (part of M3 Financial Group, alongside Invis, Mortgage Intelligence and Verico); individual brokers/franchisees are independently licensed and paid by lender commission, while the parent earns franchise fees', provincial_licenses: ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS'], lender_panel_note: 'Network-wide lender panel breadth not specifically disclosed; individual franchise brokers typically offer a wide multi-lender panel comparable to peers', consumer_fee_note: '$0 — standard industry commission model', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'BBB lists the parent entity as Not Rated / Not Accredited (insufficient information); reputation is fragmented across dozens of individual regional franchise listings rather than one consolidated score', regulatory_note: 'A 2023 Competition Bureau investigation into anti-competitive franchise practices targeted Dominion Lending Centres (DLC), a competing network — not Mortgage Alliance or its parent M3 Financial Group. That DLC inquiry was discontinued in June 2024 with no wrongdoing found. No comparable Competition Bureau action against Mortgage Alliance or M3 Financial Group was found at any point 2023-2026.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.mortgagealliance.com/',
    is_top_pick: false, best_for: 'Borrowers wanting a local, in-person broker', display_order: 7,
    source_url: 'https://www.joinmortgagealliance.ca/whymortgagealliance', data_verified_at: '2026-07-11', active: true,
  },
];

const goldInvesting = [
  {
    slug: 'silver-gold-bull-ca', market: 'ca', category: 'gold-investing', topic: 'platforms',
    display_name: 'Silver Gold Bull', tagline: 'The cleanest track record of any dealer researched',
    score: 9.0, rating: 4.6, review_count: 4700, clicks: 4700, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['BBB A+, zero complaints in 3 years', 'LBMA Affiliate Member', 'RRSP/TFSA-eligible'],
    pros: [
      'BBB A+ accredited since 2012 with zero unresolved complaints',
      'LBMA Affiliate Member — independently confirmed via LBMA\'s own Alchemist magazine profile',
      'Direct RRSP/TFSA-eligible gold products, operating since 2009',
    ],
    cons: [
      'Exact current storage fee schedule was not independently confirmable at research time',
      'Occasional shipping delays reported at high order volume',
    ],
    sub_scores: { trust: 9.6, cost: 8.2, rating: 9.2 },
    verdict: 'The cleanest complaint record and strongest independent accreditation in this comparison.',
    attributes: { product_type: 'direct_bullion', premium_over_spot_pct: 3.5, premium_note: 'Approximate — based on a CAD $50-150/oz premium range on coins cited on official pricing pages, converted using an estimated ~CAD $2,850/oz gold spot reference; bars carry a lower premium (CAD $30-80/oz). Get a live, dated quote before buying.', storage_note: 'Fully insured, allocated vault storage available; exact fee schedule not independently confirmed at research time — request current fees directly.', buyback_available: true, registered_account_note: 'RRSP/TFSA-eligible gold products offered directly.', accreditation: 'lbma_affiliate', accreditation_note: 'LBMA Affiliate Member, confirmed via LBMA\'s own Alchemist magazine profile.', years_in_business: 17, trustpilot_rating: 4.6, trustpilot_count: 4700, trustpilot_note: 'Reported ratings ranged 4.5-4.9/5 across sources; BBB A+ accredited with zero unresolved complaints in the last 3 years.', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.silvergoldbull.ca/',
    is_top_pick: true, best_for: 'Investors wanting the cleanest overall track record', display_order: 1,
    source_url: 'https://www.silvergoldbull.ca/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'bmg-bullionfund', market: 'ca', category: 'gold-investing', topic: 'platforms',
    display_name: 'BMG (Bullion Management Group)', tagline: 'The only Canadian gold product built for registered accounts',
    score: 8.6, rating: 0, review_count: 0, clicks: 0, management_fee: 1.25, account_minimum: 1000,
    badges: [{ type: 'sky', label: 'Best for RRSP/TFSA' }],
    chips: ['OSC-regulated mutual fund', 'RRSP/RRIF/TFSA/RESP/RDSP eligible', 'LBMA Good Delivery bars (per fund materials)'],
    pros: [
      'The only Canadian gold product structured as an OSC-regulated mutual fund holding allocated bullion',
      'Purpose-built for every major registered account type: RRSP, RRIF, TFSA, RESP and RDSP',
      'Regulated like any other Canadian mutual fund — clearer oversight than an unregulated bullion dealer',
    ],
    cons: [
      'Management fees (1.25%-2.74% depending on unit class) are materially higher than a one-time dealer premium over a long holding period',
      'No Trustpilot/BBB consumer-review data exists for a fund-structured product',
    ],
    sub_scores: { trust: 9.0, cost: 6.4, rating: 0 },
    verdict: 'The clearest, most regulated route to RRSP/TFSA gold exposure — at an ongoing fee.',
    attributes: { product_type: 'fund_wrapper', premium_over_spot_pct: null, premium_note: 'Not applicable — priced at fund NAV, not a per-oz premium. Management fee: Class D 1.25% total, Class A MER 2.74% (varies by unit class).', storage_note: 'Professional vault custody via the fund; specific custodian not disclosed in the fund materials reviewed.', buyback_available: true, registered_account_note: 'Purpose-built for registered accounts — RRSP, RRIF, TFSA, RESP and RDSP all eligible.', accreditation: 'osc_regulated_fund', accreditation_note: 'OSC-regulated mutual fund; fund materials state holdings are LBMA Good Delivery bars (not independently re-verified beyond the fund\'s own disclosures).', years_in_business: null, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No Trustpilot/BBB data found for this fund-structured product — mutual funds are not typically reviewed on consumer platforms.', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://bmgfunds.com/',
    is_top_pick: false, best_for: 'RRSP/TFSA investors wanting fund-wrapped bullion', display_order: 2,
    source_url: 'https://bmgfunds.com/bmg-mutual-fund-frequently-asked-questions/canadian-investor-faqs/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'rcm-gold-etr', market: 'ca', category: 'gold-investing', topic: 'platforms',
    display_name: 'Royal Canadian Mint Gold ETR', tagline: 'A direct obligation of the Government of Canada',
    score: 8.4, rating: 0, review_count: 0, clicks: 0, management_fee: 0.35, account_minimum: 66,
    badges: [{ type: 'sky', label: 'Most trust-anchored' }],
    chips: ['TSX-listed (MNT / MNT.U)', 'Direct claim on Mint-vaulted gold', '0.35% p.a. service fee'],
    pros: [
      'The strongest sovereign-trust signal of any option researched — a direct obligation of the Government of Canada',
      'Trades on the TSX like any other security, through any brokerage — no dealer relationship needed',
      'A single flat 0.35% p.a. service fee, with no separate storage fee',
    ],
    cons: [
      'Physical bullion redemption requires a minimum of 10,000 ETRs (~CAD $664,000) — effectively inaccessible for retail-sized physical delivery',
      'Purity figures showed a minor discrepancy across sources (99.9% vs. 99.99%) — confirm against the Mint\'s own information statement',
    ],
    sub_scores: { trust: 10.0, cost: 8.6, rating: 0 },
    verdict: "The most trust-anchored option in this comparison — a listed security, not a dealer relationship.",
    attributes: { product_type: 'etr_security', premium_over_spot_pct: null, premium_note: 'Not applicable — a TSX-listed security (symbols MNT in CAD, MNT.U in USD) representing a direct legal and beneficial interest in Mint-vaulted gold. 0.35% p.a. service fee; no separate premium or storage fee.', storage_note: "Held at the Royal Canadian Mint's Ottawa vault; storage cost is built into the 0.35% p.a. service fee.", buyback_available: true, registered_account_note: 'RRSP/TFSA-eligible through any self-directed brokerage, since it trades as a normal listed security.', accreditation: 'government_mint', accreditation_note: 'A direct obligation of the Government of Canada, issued and vaulted by the Royal Canadian Mint — the strongest sovereign-trust signal of any option on this page.', years_in_business: null, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'Not applicable — a listed security, not a dealer; no consumer review platform coverage.', regulatory_note: 'Physical bullion redemption requires a minimum of 10,000 ETRs (~CAD $664,000) — effectively inaccessible for retail-sized physical delivery, though the security itself is fully liquid on the TSX. Purity is stated as high-purity, though sources showed a minor 99.9%/99.99% discrepancy — confirm against the Mint\'s own information statement before relying on a specific figure.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.reserves.mint.ca/tsx_gold',
    is_top_pick: false, best_for: 'Investors wanting the strongest sovereign backing', display_order: 3,
    source_url: 'https://www.reserves.mint.ca/media/1521/gold-etr-information-statement.pdf', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'sprott-money', market: 'ca', category: 'gold-investing', topic: 'platforms',
    display_name: 'Sprott Money', tagline: 'A well-established Toronto dealer with a BBB A+ rating',
    score: 8.0, rating: 3.7, review_count: 0, clicks: 0, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['BBB A+ since 2011, 0 complaints (3 yrs)', 'ShopperApproved 4.8/5 (2,600+)', 'RRSP/TFSA via Questrade'],
    pros: [
      'BBB A+ accredited since 2011 with 0 complaints in the last 3 years',
      'Strong ShopperApproved score (4.8/5, 2,600+ verified reviews) alongside a smaller, mixed Trustpilot sample',
      'Part of the broader, well-known Sprott brand, operating since 2008',
    ],
    cons: [
      'RRSP/TFSA purchases require opening a separate Questrade account first as third-party custodian — a real extra step',
      'No flat published premium rate — pricing requires a live quote, and storage fees scale up to ~1.5%/yr on smaller holdings',
    ],
    sub_scores: { trust: 8.6, cost: 7.0, rating: 7.4 },
    verdict: 'A well-established, well-reviewed dealer — plan for the Questrade custodian step on registered accounts.',
    attributes: { product_type: 'direct_bullion', premium_over_spot_pct: 5.24, premium_note: 'Not published as a flat rate — one example found a 1oz gold coin priced ~5.24% over spot; premiums are described as lower on bars than coins and scale with order size. Call for live pricing.', storage_note: 'Held via third-party depository International Depository Services (IDS) in Canada, the US and other jurisdictions, with allocated and segregated options. Minimum storage fee $200/yr (~$16.67/mo) plus tax; IDS reportedly charges up to ~1.5%/yr of value on smaller holdings — exact tiered pricing requires a quote.', buyback_available: true, registered_account_note: 'RRSP/TFSA-eligible via a required third-party custodian — a Questrade account must be opened first before Sprott Money can process a registered-account order.', accreditation: 'retail_dealer', accreditation_note: 'States FINTRAC AML/CTF compliance obligations on its own FAQ; specific MSB registration number not independently confirmed. Accepts LBMA-accredited bullion products for registered-account purchases; no explicit LBMA membership independently confirmed.', years_in_business: 18, trustpilot_rating: 3.7, trustpilot_count: null, trustpilot_note: 'Trustpilot 3.7/5 (smaller sample); ShopperApproved 4.8/5 from 2,600+ verified reviews; BBB A+ accredited since 2011 with 0 complaints in the last 3 years.', regulatory_note: 'Individual reviews mention billing friction with the vault/storage program and occasional shipping delays — customer-service-level issues, not regulatory findings.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.sprottmoney.com/',
    is_top_pick: false, best_for: 'Investors already using Questrade for RRSP/TFSA gold', display_order: 4,
    source_url: 'https://www.sprottmoney.com/faq', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'kitco', market: 'ca', category: 'gold-investing', topic: 'platforms',
    display_name: 'Kitco', tagline: 'One of the longest-operating dealers in Canada, since 1977',
    score: 7.2, rating: 0, review_count: 0, clicks: 0, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['Operating since 1977', 'Storage at the Royal Canadian Mint', '⚠ Pool product not fully backed — see detail'],
    pros: [
      'One of the longest-operating precious-metals dealers in Canada (since 1977)',
      'Three distinct storage tiers, including allocated storage at the Royal Canadian Mint',
      'VaultChain blockchain-tracked ownership option, custodied at the Mint',
    ],
    cons: [
      "Kitco Pool is unallocated (pooled, not individually segregated) — a materially different and lower-protection structure than the allocated tier, and a 2014 report found it was not 100% physically backed at the time",
      'No reliable Trustpilot/BBB score found; pricing requires direct contact',
    ],
    sub_scores: { trust: 6.6, cost: 6.0, rating: 0 },
    verdict: "A long-established name — understand the Pool product's different (lower) protection level before choosing it.",
    attributes: { product_type: 'direct_bullion', premium_over_spot_pct: null, premium_note: 'Not publicly disclosed — Kitco requires direct contact for quotes.', storage_note: 'Three tiers: Allocated Storage (KAS, segregated physical, at the Royal Canadian Mint/COMEX-approved depository/Hong Kong), Kitco Pool (UNALLOCATED, pooled — not individually segregated, a materially different structure), and VaultChain (blockchain-tracked, custodied at the Royal Canadian Mint).', buyback_available: true, registered_account_note: 'Registered-account eligibility not independently confirmed at research time — confirm directly before assuming RRSP/TFSA support.', accreditation: 'retail_dealer', accreditation_note: 'Storage partnership with the Royal Canadian Mint (a Crown corporation); no explicit public LBMA membership confirmation found. Founded 1977, one of the longest-operating dealers on this page.', years_in_business: 49, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: "No reliable Trustpilot/BBB score found for Kitco's bullion business specifically at research time.", regulatory_note: "A 2011 creditor-protection (CCAA) filing tied to a Revenue Québec tax dispute involving suppliers was resolved in Kitco's favor by the Quebec Superior Court in 2016, with no wrongdoing found — historical, disclosed for transparency. Separately, a 2014 report noted the Kitco Pool product was not 100% physically backed at the time and pool holders were not treated as creditors in the 2011 proceeding — relevant specifically to the Pool (unallocated) product, not the allocated storage program." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://online.kitco.com/',
    is_top_pick: false, best_for: 'Buyers wanting the longest-established Canadian name', display_order: 5,
    source_url: 'https://online.kitco.com/storage/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'goldmoney', market: 'ca', category: 'gold-investing', topic: 'platforms',
    display_name: 'GoldMoney', tagline: 'A TSX-listed public company with real, recent account complaints',
    score: 6.4, rating: 2.6, review_count: 1800, clicks: 1800, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['TSX: XAU, 22,000+ customers', '$1.4B+ partner-vault holdings', '⚠ 2024-25 account-freeze complaints — see detail'],
    pros: [
      'A currently-operating, TSX-listed public company (TSX: XAU) with 22,000+ customers and $1.4B+ in partner-vault holdings',
      'Long operating history and public financial disclosures (unusual transparency for a bullion dealer)',
    ],
    cons: [
      'Real, recent (2024-2025) customer complaints describe account freezes demanding decade-old documentation and at least one case of unilateral liquidation of a customer\'s holdings',
      'Trustpilot score is poor (2.6/5, ~1,800 reviews), with a suspicious cluster of 5-star reviews after a long period of ~2-star averages',
    ],
    sub_scores: { trust: 5.0, cost: 6.0, rating: 5.2 },
    verdict: 'A legitimate public company — but weigh the real, recent account-freeze complaints carefully.',
    attributes: { product_type: 'direct_bullion', premium_over_spot_pct: null, premium_note: 'Not independently confirmed at research time — request a live quote.', storage_note: 'Partner-vault custody; ~$1.4B in partner-vault holdings across 22,000+ customers per company disclosures.', buyback_available: true, registered_account_note: 'Registered-account eligibility not independently confirmed at research time.', accreditation: 'retail_dealer', accreditation_note: 'Goldmoney Inc. is a currently-operating, TSX-listed public company (TSX: XAU); not independently confirmed as an LBMA member.', years_in_business: null, trustpilot_rating: 2.6, trustpilot_count: 1800, trustpilot_note: 'trustpilot.com — of the most recent 20 reviews only 2 were 4-5 stars; a sudden cluster of 5-star reviews after roughly a year of ~2-star averages reads as a possible review-manipulation pattern and should be treated skeptically.', regulatory_note: "Goldmoney Inc. shifted its corporate registration from British Columbia to the British Virgin Islands in September 2024 — a disclosed, shareholder-approved move (over 90% of share capital held by non-Canadian beneficial owners) by a real, currently-operating public company, not a covert shell restructuring; stated rationale was capital-return efficiency. Separately, the Jersey Financial Services Commission required Goldmoney to agree not to operate in Jersey for 10 years (2021-2022), tied to an undisclosed 2016-2018 matter in its Jersey subsidiary. More relevant to a retail buyer: real, recent (2024-2025) customer complaints describe repeated account freezes demanding decade-old documentation from already-verified accounts, accounts frozen without notification, and at least one case of unilateral liquidation of a customer's gold holdings in early 2025." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.goldmoney.com/',
    is_top_pick: false, best_for: 'Investors weighing real account-freeze complaints', display_order: 6,
    source_url: 'https://www.goldmoney.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'canadian-bullion-services', market: 'ca', category: 'gold-investing', topic: 'platforms',
    display_name: 'Canadian Bullion Services', tagline: 'Active, recent non-delivery complaints — disclosed, ranked last',
    score: 4.8, rating: 0, review_count: 0, clicks: 0, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['Not BBB-accredited', '⚠ Active 2025-2026 non-delivery complaints — see detail'],
    pros: [
      'Frequently listed on Canadian comparison portals',
    ],
    cons: [
      'Multiple recent (2025-2026) customer reports describe months-long non-delivery after payment, unreturned calls, and unanswered refund requests',
      'Not BBB-accredited, with no reliable positive-sentiment review base found',
    ],
    sub_scores: { trust: 2.0, cost: 5.0, rating: 0 },
    verdict: 'Kept on this list per the approved shortlist — but the disclosed complaint pattern is serious. Read the detail below.',
    attributes: { product_type: 'direct_bullion', premium_over_spot_pct: null, premium_note: 'Not independently confirmed at research time.', storage_note: 'Not independently confirmed at research time.', buyback_available: false, registered_account_note: 'Not independently confirmed at research time.', accreditation: 'retail_dealer', accreditation_note: 'Not BBB-accredited.', years_in_business: null, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable positive-sentiment review base found — see regulatory note for the specific, recent complaint pattern.', regulatory_note: "Multiple recent (2025-2026, including March 2026 and June 2025) customer reports describe months-long non-delivery after payment, unreturned phone calls with full voicemail boxes, and refund requests going unanswered after cancellation — the most concerning, active complaint pattern of any of the 7 dealers researched for this page. The company is not BBB-accredited. An unverified allegation (via a consumer-complaint site) claims prior operation under a different company name — treated as an allegation, not confirmed fact. Ranked last with this disclosure rather than excluded, per the approved candidate shortlist; consider the disclosed risk carefully before ordering." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.canadianbullion.ca/',
    is_top_pick: false, best_for: 'Buyers who have weighed the active complaint pattern', display_order: 7,
    source_url: 'https://www.canadianbullion.ca/', data_verified_at: '2026-07-11', active: true,
  },
];

async function upsert(rows, label) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/product_attributes?on_conflict=market,category,topic,slug`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(rows),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${label} failed (${res.status}):`, text);
    process.exit(1);
  }
  const parsed = JSON.parse(text);
  console.log(`✅ ${label}: ${parsed.length} rows upserted`);
  return parsed;
}

await upsert(forexBrokers, 'forex/forex-brokers (ca)');
await upsert(mortgageBrokers, 'housing/mortgage-brokers (ca)');
await upsert(goldInvesting, 'gold-investing/platforms (ca)');

const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/product_attributes?select=category,topic&market=eq.ca&active=eq.true&topic=in.(forex-brokers,mortgage-brokers,platforms)`,
  { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } },
);
const countRows = await countRes.json();
const counts = {};
for (const r of countRows) {
  const key = `${r.category}/${r.topic}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log('\nActive row counts:', counts);
console.log('\nNext: npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts ca forex forex-brokers');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts ca housing mortgage-brokers');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts ca gold-investing platforms');
