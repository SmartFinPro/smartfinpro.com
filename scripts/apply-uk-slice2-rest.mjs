#!/usr/bin/env node
// AU/CA/UK rollout Slice UK-2 (trading/cfd-brokers, forex/forex-brokers,
// remortgaging/remortgage-brokers) — second UK slice. Applies seed rows via
// the PostgREST API (upsert on the product_attributes unique constraint),
// same working pattern as apply-au-slice{1,2,3}-rest.mjs /
// apply-ca-slice{1,2,3}-rest.mjs / apply-uk-slice1-rest.mjs (exec_sql RPC
// and direct Postgres connection are both unreachable from this
// environment).
// Row data mirrors supabase/migrations/20260711220000-20260711220200 exactly
// — those .sql files remain the source-of-truth audit trail; this script is
// the actual write path used to seed prod.
// Usage: node --env-file=.env.local scripts/apply-uk-slice2-rest.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

const cfdBrokers = [
  {
    slug: 'ig-cfd-uk', market: 'uk', category: 'trading', topic: 'cfd-brokers',
    display_name: 'IG', tagline: '17,000+ markets, the widest CFD range of any candidate researched',
    score: 9.1, rating: 4.1, review_count: 9000, clicks: 9000, management_fee: 0.006, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['17,000+ markets', 'Tightest spread researched (0.6 pips)', 'No confirmed FCA fine 2024-2026'],
    pros: [
      "The widest CFD instrument range of any candidate researched (17,000+ markets)",
      'The tightest EUR/USD-style spread researched (0.6 pips)',
      'No confirmed UK FCA enforcement action found for 2024-2026',
    ],
    cons: [
      'Legacy 2015 Swiss franc (SNB) shock complaints remain referenced in ongoing third-party litigation-funding activity',
      'Broadest range means a steeper learning curve for absolute beginners',
    ],
    sub_scores: { cost: 9.0, range: 10.0, trust: 9.0, support: 8.0 },
    verdict: 'The widest range and tightest spread researched, with a clean recent regulatory record.',
    attributes: { fca_frn: 'IG Markets Ltd FRN 195355 / IG Index Ltd FRN 114059', avg_spread_eurusd_pips: 0.6, commission_round_turn_gbp: 0, spread_note: 'EUR/USD-style spread shown; individual index/share/commodity CFD spreads differ and should be checked per-instrument on IG\'s own site', instrument_range_note: '17,000+ markets — the widest range of the 7 candidates', max_leverage: '30:1 FX majors, 20:1 indices/gold, 10:1 other commodities, 5:1 shares', platforms: ['Proprietary web/app', 'MT4', 'ProRealTime', 'L2 Dealer'], retail_loss_pct: 71, retail_loss_note: 'recently cited 69-74% depending on period/source, verify live figure', trustpilot_rating: 4.1, trustpilot_count: 9000, trustpilot_note: 'uk.trustpilot.com/review/ig.com', regulatory_note: 'Legacy 2015 Swiss franc (SNB) shock complaints (approximately £18.4m in aggregated client losses at the time) remain referenced in ongoing third-party litigation-funding activity — Omni Bridgeway is investigating/funding a prospective UK class action on behalf of affected CFD clients. No confirmed UK FCA fine against IG was found for 2024-2026.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.ig.com/uk',
    is_top_pick: true, best_for: 'Traders wanting the widest CFD range', display_order: 1,
    source_url: 'https://www.ig.com/uk', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'capital-com', market: 'uk', category: 'trading', topic: 'cfd-brokers',
    display_name: 'Capital.com', tagline: 'The lowest barrier to entry — £20 minimum deposit',
    score: 8.8, rating: 4.6, review_count: 13000, clicks: 13000, management_fee: 0.007, account_minimum: 20,
    badges: [{ type: 'green', label: 'Best for beginners' }],
    chips: ['£20 minimum deposit (lowest of the 7)', 'Highest Trustpilot rating (4.6/5)', 'Single commission-free pricing model'],
    pros: [
      'The lowest minimum deposit of any candidate researched (£20)',
      'The highest Trustpilot rating of the 7 (4.6/5, 13,000+ reviews)',
      'A single, simple commission-free pricing model across both FX and CFDs — no confusing account tiers',
    ],
    cons: [
      'A narrower instrument range (5,000+ CFDs) than IG or Saxo',
      'No FCA loss-percentage figure was independently confirmed at research time',
    ],
    sub_scores: { cost: 8.6, range: 7.0, trust: 9.6, support: 8.4 },
    verdict: 'The most accessible, best-reviewed entry point for new CFD traders.',
    attributes: { fca_frn: 'Capital Com (UK) Ltd FRN 793714', avg_spread_eurusd_pips: 0.7, commission_round_turn_gbp: 0, spread_note: 'EUR/USD-style spread shown; individual index/share/commodity CFD spreads differ and should be checked per-instrument', instrument_range_note: '5,000+ CFDs', max_leverage: '30:1 FX majors, 20:1 indices/gold, 10:1 other commodities, 5:1 shares', platforms: ['Proprietary web/mobile', 'MT4'], retail_loss_pct: null, retail_loss_note: 'Not independently confirmed at research time', trustpilot_rating: 4.6, trustpilot_count: 13000, trustpilot_note: 'uk.trustpilot.com/review/capital.com', regulatory_note: 'No FCA enforcement action, fine or notable lawsuit was found for 2024-2026 in this research pass — noted as "none found" rather than a confirmed clean record, given limited primary-source depth available.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://capital.com/en-gb',
    is_top_pick: false, best_for: 'Beginners wanting a low-deposit, simple pricing model', display_order: 2,
    source_url: 'https://capital.com/en-gb', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'pepperstone-cfd-uk', market: 'uk', category: 'trading', topic: 'cfd-brokers',
    display_name: 'Pepperstone', tagline: 'The broadest platform choice — with a disclosed 2023 leverage-breach remediation',
    score: 8.7, rating: 4.3, review_count: 3400, clicks: 3400, management_fee: 0.010, account_minimum: 0,
    badges: [{ type: 'sky', label: 'Best for active traders' }],
    chips: ['MT4, MT5, cTrader, TradingView', 'Razor account: ultra-tight raw spreads', '⚠ Self-reported 2023 ASIC breach — see detail'],
    pros: [
      'The broadest platform choice of the 7 (MT4, MT5, cTrader, native TradingView)',
      'Razor account offers ultra-tight raw spreads for active/high-volume traders',
      'A leverage-cap compliance matter was self-reported and fully remediated under regulatory oversight',
    ],
    cons: [
      'Was one of seven brokers found by ASIC to have breached a 2020 CFD leverage-ratio order due to a technical error (self-reported, remediated)',
      'Some 2025-2026 review-aggregator complaint spikes about withdrawal delays and slippage — anecdotal, not confirmed regulatory findings',
    ],
    sub_scores: { cost: 8.6, range: 8.0, trust: 8.2, support: 8.0 },
    verdict: 'The best platform choice for active traders — a disclosed, remediated compliance matter to weigh.',
    attributes: { fca_frn: 'FRN 684312', avg_spread_eurusd_pips: 1.0, commission_round_turn_gbp: 0, spread_note: 'EUR/USD-style spread shown for the Standard account; the Razor account offers tighter raw spreads plus a per-lot commission — individual CFD instrument spreads differ from this figure', instrument_range_note: '1,350+ CFDs — FX/index/commodity/share/crypto CFD focus, narrower range than IG/CMC/Saxo', max_leverage: '30:1 FX majors, 20:1 indices/gold, 10:1 other commodities, 5:1 shares', platforms: ['MT4', 'MT5', 'cTrader', 'TradingView', 'Proprietary webtrader'], retail_loss_pct: 80, retail_loss_note: 'recently cited in a wide 74-89% range depending on source/period, verify live', trustpilot_rating: 4.3, trustpilot_count: 3400, trustpilot_note: 'uk.trustpilot.com/review/pepperstone.com', regulatory_note: 'ASIC found Pepperstone was one of seven brokers that breached Australia\'s 2020 CFD leverage-ratio order due to a technical error (finding published November 2023, still relevant/recent); Pepperstone self-reported the issue and ran a remediation program compensating 1,500+ affected clients. No UK FCA fine was identified.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://pepperstone.com/en-gb',
    is_top_pick: false, best_for: 'Active traders wanting the broadest platform choice', display_order: 3,
    source_url: 'https://pepperstone.com/en-gb', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'xtb-cfd-uk', market: 'uk', category: 'trading', topic: 'cfd-brokers',
    display_name: 'XTB', tagline: 'A large instrument range on a single zero-commission account',
    score: 8.0, rating: 4.0, review_count: 1900, clicks: 1900, management_fee: 0.008, account_minimum: 0,
    badges: [],
    chips: ['11,400+ instruments', 'Single zero-commission account', '⚠ March 2026 Polish MiFID II fine — see detail'],
    pros: [
      'A large instrument range (11,400+ FX, indices, commodities, share and ETF CFDs) on one simple account',
      'Proprietary xStation 5 platform across web, desktop and mobile',
    ],
    cons: [
      "Poland's KNF fined parent XTB S.A. approximately $5.5m in March 2026 for MiFID II client-suitability and product-governance failures (2022-2023)",
      'Smallest Trustpilot review base of the 7 (1,900+ reviews)',
    ],
    sub_scores: { cost: 8.2, range: 8.6, trust: 6.6, support: 7.4 },
    verdict: 'A large, simple instrument range — weigh the disclosed 2026 Polish regulatory fine.',
    attributes: { fca_frn: 'FRN 522157', avg_spread_eurusd_pips: 0.8, commission_round_turn_gbp: 0, spread_note: 'EUR/USD-style spread shown; individual index/share/commodity CFD spreads differ and should be checked per-instrument', instrument_range_note: '11,400+ instruments (FX, indices, commodities, share CFDs, ETF CFDs, plus underlying stock/ETF investing)', max_leverage: '30:1 FX majors, 20:1 indices/gold, 10:1 other commodities, 5:1 shares', platforms: ['Proprietary xStation 5 (web/desktop/mobile)'], retail_loss_pct: 70, retail_loss_note: 'recently cited around 70%, verify live', trustpilot_rating: 4.0, trustpilot_count: 1900, trustpilot_note: 'uk.trustpilot.com/review/xtb.com', regulatory_note: "Poland's KNF fined parent XTB S.A. PLN 20m (approximately $5.5m) in March 2026 for MiFID II breaches — inadequate client-suitability questionnaires and product-governance failures between January 2022 and September 2023 that let inexperienced clients access high-risk CFDs. A prior KNF fine (PLN 9.9m, 2018) addressed asymmetric price slippage. Q1 2025 disclosures also flagged ongoing, non-final regulatory inspections in Czechia, Belize, Spain and Portugal. These are Polish/EU parent-entity actions; XTB UK Ltd operates under the same group governance." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.xtb.com/en',
    is_top_pick: false, best_for: 'Traders wanting a large range on one simple account', display_order: 4,
    source_url: 'https://www.xtb.com/en', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'cmc-markets-cfd-uk', market: 'uk', category: 'trading', topic: 'cfd-brokers',
    display_name: 'CMC Markets', tagline: 'FCA-regulated since 2001 — with an active Australian class action disclosed',
    score: 7.6, rating: 4.15, review_count: 3000, clicks: 3000, management_fee: 0.007, account_minimum: 0,
    badges: [],
    chips: ['FCA-regulated since 2001', '12,000+ CFD instruments', '⚠ Active AU Federal Court class action — see detail'],
    pros: [
      'FCA-regulated since 2001, one of the longest track records of the 7',
      '12,000+ CFD/spread-bet instruments across a proprietary platform',
    ],
    cons: [
      "An active Australian Federal Court class action (2024-2026) alleges approximately 2,500 clients who failed appropriateness screening were still allowed to trade high-risk products",
      'A £4.3m one-off customer remediation charge (2025) tied to an Australian margin-netting industry review',
    ],
    sub_scores: { cost: 8.0, range: 8.6, trust: 6.4, support: 7.6 },
    verdict: 'A long-established broker — weigh the active Australian class action against the UK-specific regulatory record.',
    attributes: { fca_frn: 'FRN 173730', avg_spread_eurusd_pips: 0.7, commission_round_turn_gbp: 0, spread_note: 'EUR/USD-style no-commission account spread shown; a commission-based account (0 pip + $5/lot) is also available; individual CFD instrument spreads vary', instrument_range_note: '12,000+ CFD/spread-bet instruments', max_leverage: '30:1 FX majors, 20:1 indices/gold, 10:1 other commodities, 5:1 shares', platforms: ['Proprietary Next Generation platform', 'MT4'], retail_loss_pct: 68, retail_loss_note: 'recently cited around 68% (range 67-84% across periods), verify live', trustpilot_rating: 4.15, trustpilot_count: 3000, trustpilot_note: 'uk.trustpilot.com/review/cmcmarkets.com — sources cite 4.0-4.3/5', regulatory_note: "CMC Markets faces an active Australian Federal Court class action (2024-2026) alleging approximately 2,500 clients who failed appropriateness screening were still allowed to trade high-risk CFD products, and separately disclosed a £4.3m one-off customer remediation charge in 2025 tied to an Australian margin-netting industry review. A former senior employee also filed a 2024 bonus-scheme lawsuit (~$1m claim). These are Australian/employment matters, not confirmed UK FCA enforcement actions." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.cmcmarkets.com/en-gb',
    is_top_pick: false, best_for: 'Traders wanting an FCA-regulated broker since 2001', display_order: 5,
    source_url: 'https://www.cmcmarkets.com/en-gb', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'etoro-cfd-uk', market: 'uk', category: 'trading', topic: 'cfd-brokers',
    display_name: 'eToro', tagline: 'The market leader in social/copy trading',
    score: 7.4, rating: 4.15, review_count: 30000, clicks: 30000, management_fee: 0.010, account_minimum: 10,
    badges: [],
    chips: ['Social/copy trading market leader', 'Largest review base (30,000+)', '⚠ US/Italian entity fines — see detail'],
    pros: [
      'The market leader in social/copy trading, letting users automatically mirror other traders\' positions',
      'The largest Trustpilot review base of the 7 (30,000+ reviews)',
      'Low $10 minimum deposit',
    ],
    cons: [
      'A narrower CFD-specific range than most peers (approximately 50 currency pairs, 15 indices) — eToro\'s core strength is stocks/crypto/social trading, not tight CFD spreads',
      'No proprietary MT4/MT5/cTrader/TradingView integration — web/app platform only',
    ],
    sub_scores: { cost: 7.6, range: 6.4, trust: 7.4, support: 7.6 },
    verdict: 'The best social/copy-trading platform — weigh its narrower CFD-specific range and disclosed non-UK fines.',
    attributes: { fca_frn: 'FRN 583263', avg_spread_eurusd_pips: 1.0, commission_round_turn_gbp: 0, spread_note: 'EUR/USD-style spread shown; eToro\'s core differentiator is social/copy trading rather than tight CFD spreads — individual instrument spreads vary', instrument_range_note: '3,000+ assets total (stocks/ETFs/crypto/commodities); CFD-specific coverage is narrower — approximately 50 currency pairs, 15 indices', max_leverage: '30:1 FX majors, 20:1 indices/gold, 10:1 other commodities, 5:1 shares, 2:1 crypto', platforms: ['Proprietary web/app only'], retail_loss_pct: 61, retail_loss_note: 'recently cited around 61%, notably lower than most peers — plausibly reflects eToro\'s retail base skewing toward long-only investing rather than leveraged CFDs, verify live', trustpilot_rating: 4.15, trustpilot_count: 30000, trustpilot_note: 'uk.trustpilot.com/review/etoro.com', regulatory_note: "Not UK FCA-specific, but relevant for honest disclosure: the SEC fined eToro USA $1.5m (September 2024) for operating as an unregistered broker/clearing agency in US crypto trading (a separate US entity from the UK FCA-regulated business); Italy's competition authority fined eToro €1.3m (2023) for misleading fee advertising; historical CySEC (€50k, 2013) and Canadian regulator ($550k + $1.8m disgorgement, 2018) settlements also exist. None of these are UK FCA actions against eToro (UK) Ltd specifically." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.etoro.com/',
    is_top_pick: false, best_for: 'Traders wanting social/copy trading', display_order: 6,
    source_url: 'https://www.etoro.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'saxo-cfd-uk', market: 'uk', category: 'trading', topic: 'cfd-brokers',
    display_name: 'Saxo', tagline: 'The widest multi-asset range — with a disclosed ~£37-40M Danish AML fine',
    score: 7.0, rating: 3.5, review_count: 8200, clicks: 8200, management_fee: 0.007, account_minimum: 500,
    badges: [],
    chips: ['8,800+ CFDs, ~19,000+ instruments overall', 'SaxoTraderGO/PRO + TradingView', '⚠ ~£37-40M Danish AML fine — see detail'],
    pros: [
      'The widest overall instrument range of the 7 by far (~19,000+ tradable instruments across all product types, reflecting Saxo\'s investment-bank positioning)',
      'SaxoTraderGO (web/app), SaxoTraderPRO (desktop) and TradingView integration',
    ],
    cons: [
      "Denmark's FSA fined parent Saxo Bank approximately $46-50m (one of the largest fines in years) for AML Act violations related to KYC/customer due-diligence failures",
      'The lowest Trustpilot rating of the 7 (~3.5/5), and a tiered account structure (£500 minimum for Classic, up to £1,000,000 for VIP) that is notably higher-barrier than peers',
    ],
    sub_scores: { cost: 7.8, range: 9.4, trust: 5.0, support: 7.0 },
    verdict: 'The widest multi-asset range in this comparison — weigh the disclosed Danish AML fine carefully.',
    attributes: { fca_frn: 'FRN 551422 (confirm directly against the FCA Register before relying on this number)', avg_spread_eurusd_pips: 0.7, commission_round_turn_gbp: 0, spread_note: 'EUR/USD-style spread shown for the Classic tier (VIP tier tighter, from ~0.5 pips); individual CFD instrument spreads across Saxo\'s much broader 8,800+ CFD range vary', instrument_range_note: '8,800+ CFDs, part of a wider ~19,000+ tradable-instrument platform including bonds/options — the widest range of the 7', max_leverage: '30:1 FX majors, 20:1 indices/gold, 10:1 other commodities, 5:1 shares', platforms: ['SaxoTraderGO', 'SaxoTraderPRO', 'TradingView'], retail_loss_pct: null, retail_loss_note: 'Not independently confirmed at research time', trustpilot_rating: 3.5, trustpilot_count: 8200, trustpilot_note: 'uk.trustpilot.com/review/home.saxo — lowest rating of the 7', regulatory_note: "Denmark's Financial Supervisory Authority fined parent Saxo Bank approximately $46-50m for AML Act violations related to KYC/customer due-diligence failures, disclosed alongside a 2025 ownership-change process (the purchase price was adjusted down by approximately $8.7m to reflect the fine); the regulator found no evidence that actual money laundering occurred, only compliance-process failures. Saxo's Hong Kong unit was separately fined approximately $4m for unrelated breaches. These are Danish/Hong Kong parent-entity actions, not a UK FCA fine on Saxo Capital Markets UK, but disclosed given their severity and recency." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.home.saxo/en-gb',
    is_top_pick: false, best_for: 'Investors wanting the widest multi-asset range', display_order: 7,
    source_url: 'https://www.home.saxo/en-gb', data_verified_at: '2026-07-11', active: true,
  },
];

const forexBrokers = [
  {
    slug: 'pepperstone-forex-uk', market: 'uk', category: 'forex', topic: 'forex-brokers',
    display_name: 'Pepperstone', tagline: 'The lowest overall cost of any broker researched',
    score: 9.0, rating: 4.3, review_count: 3400, clicks: 3400, management_fee: 0.0057, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Razor account: avg 0.12 pips EUR/USD', 'MT4, MT5, cTrader, TradingView', '⚠ Self-reported 2023 ASIC breach — see detail'],
    pros: [
      'The lowest all-in trading cost of any broker researched, via the Razor account\'s ultra-tight raw spreads (average 0.12 pips on EUR/USD)',
      'The broadest platform choice of the 7 (MT4, MT5, cTrader, native TradingView)',
      'A leverage-cap compliance matter was self-reported and fully remediated under regulatory oversight',
    ],
    cons: [
      'Was one of seven brokers found by ASIC to have breached a 2020 CFD leverage-ratio order due to a technical error (self-reported, remediated)',
      'Some 2025-2026 review-aggregator complaint spikes about withdrawal delays and slippage — anecdotal, not confirmed regulatory findings',
    ],
    sub_scores: { cost: 9.8, platforms: 9.4, trust: 8.2, support: 8.0 },
    verdict: 'The lowest all-in trading cost researched, with a disclosed, remediated compliance matter.',
    attributes: { fca_frn: 'FRN 684312', avg_spread_eurusd_pips: 0.12, commission_round_turn_gbp: 4.5, account_type_note: 'Razor account, raw spread + per-lot commission (~£2.25/lot/side)', max_leverage: '30:1', platforms: ['MT4', 'MT5', 'cTrader', 'TradingView', 'Proprietary webtrader'], trustpilot_rating: 4.3, trustpilot_count: 3400, trustpilot_note: 'uk.trustpilot.com/review/pepperstone.com', regulatory_note: 'ASIC found Pepperstone was one of seven brokers that breached Australia\'s 2020 CFD leverage-ratio order due to a technical error (finding published November 2023, still relevant/recent); Pepperstone self-reported the issue and ran a remediation program compensating 1,500+ affected clients. No UK FCA fine was identified.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://pepperstone.com/en-gb',
    is_top_pick: true, best_for: 'Traders wanting the lowest all-in cost', display_order: 1,
    source_url: 'https://pepperstone.com/en-gb', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'ig-forex-uk', market: 'uk', category: 'forex', topic: 'forex-brokers',
    display_name: 'IG', tagline: "The UK's largest FCA spread-betting provider since 1974",
    score: 8.8, rating: 4.1, review_count: 9000, clicks: 9000, management_fee: 0.006, account_minimum: 0,
    badges: [{ type: 'green', label: 'Widest market range' }],
    chips: ['17,000+ markets', "UK's largest spread-betting provider since 1974", 'No confirmed FCA fine 2024-2026'],
    pros: [
      "The UK's largest FCA-authorised spread-betting provider, operating since 1974",
      'The widest instrument range of any candidate researched (17,000+ markets)',
      'No confirmed UK FCA enforcement action found for 2024-2026',
    ],
    cons: [
      'Legacy 2015 Swiss franc (SNB) shock complaints remain referenced in ongoing third-party litigation-funding activity',
      'Standard account spread (0.6 pips) is competitive but not the outright cheapest researched',
    ],
    sub_scores: { cost: 8.6, platforms: 8.0, trust: 9.0, support: 8.0 },
    verdict: "The UK's largest, most established forex provider, with the widest market range.",
    attributes: { fca_frn: 'IG Markets Ltd FRN 195355 / IG Index Ltd FRN 114059', avg_spread_eurusd_pips: 0.6, commission_round_turn_gbp: 0, account_type_note: 'Standard account, spread-only, no commission', max_leverage: '30:1', platforms: ['Proprietary web/app', 'MT4', 'ProRealTime', 'L2 Dealer'], trustpilot_rating: 4.1, trustpilot_count: 9000, trustpilot_note: 'uk.trustpilot.com/review/ig.com', regulatory_note: 'Legacy 2015 Swiss franc (SNB) shock complaints (approximately £18.4m in aggregated client losses at the time) remain referenced in ongoing third-party litigation-funding activity — Omni Bridgeway is investigating/funding a prospective UK class action on behalf of affected clients. No confirmed UK FCA fine against IG was found for 2024-2026.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.ig.com/uk',
    is_top_pick: false, best_for: 'Traders wanting the widest market range', display_order: 2,
    source_url: 'https://www.ig.com/uk', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'cmc-markets-forex-uk', market: 'uk', category: 'forex', topic: 'forex-brokers',
    display_name: 'CMC Markets', tagline: 'FCA-regulated since 2001, 330+ FX pairs, FSCS-eligible',
    score: 7.9, rating: 4.15, review_count: 3000, clicks: 3000, management_fee: 0.007, account_minimum: 0,
    badges: [],
    chips: ['FCA-regulated since 2001', '330+ FX pairs', '⚠ Active AU Federal Court class action — see detail'],
    pros: [
      'FCA-regulated since 2001, one of the longest track records of the 7',
      '330+ FX pairs, FSCS-eligible up to £85,000',
    ],
    cons: [
      "An active Australian Federal Court class action (2024-2026) alleges approximately 2,500 clients who failed appropriateness screening were still allowed to trade high-risk products",
      'A £4.3m one-off customer remediation charge (2025) tied to an Australian margin-netting industry review',
    ],
    sub_scores: { cost: 8.0, platforms: 7.4, trust: 6.4, support: 7.6 },
    verdict: 'A long-established, FSCS-eligible broker — weigh the active Australian class action.',
    attributes: { fca_frn: 'FRN 173730', avg_spread_eurusd_pips: 0.7, commission_round_turn_gbp: 0, account_type_note: 'No-commission account, spread-only; a commission-based account (0 pip + $5/lot) is also available', max_leverage: '30:1', platforms: ['Proprietary Next Generation platform', 'MT4'], trustpilot_rating: 4.15, trustpilot_count: 3000, trustpilot_note: 'uk.trustpilot.com/review/cmcmarkets.com — sources cite 4.0-4.3/5', regulatory_note: "CMC Markets faces an active Australian Federal Court class action (2024-2026) alleging approximately 2,500 clients who failed appropriateness screening were still allowed to trade high-risk CFD products, and separately disclosed a £4.3m one-off customer remediation charge in 2025 tied to an Australian margin-netting industry review. These are Australian matters, not confirmed UK FCA enforcement actions." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.cmcmarkets.com/en-gb',
    is_top_pick: false, best_for: 'Traders wanting an FSCS-eligible, established broker', display_order: 3,
    source_url: 'https://www.cmcmarkets.com/en-gb', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'xtb-forex-uk', market: 'uk', category: 'forex', topic: 'forex-brokers',
    display_name: 'XTB', tagline: 'ForexBrokers.com "Best in Class" for beginners',
    score: 7.4, rating: 4.0, review_count: 1900, clicks: 1900, management_fee: 0.008, account_minimum: 0,
    badges: [],
    chips: ['ForexBrokers.com "Best in Class" (beginners)', 'Zero-commission single account', '⚠ March 2026 Polish MiFID II fine — see detail'],
    pros: [
      'Named ForexBrokers.com 2026 "Best in Class" for beginners',
      'A simple, zero-commission single-account model across FX and CFDs',
    ],
    cons: [
      "Poland's KNF fined parent XTB S.A. approximately $5.5m in March 2026 for MiFID II client-suitability and product-governance failures (2022-2023)",
      'Smallest Trustpilot review base of the 7 (1,900+ reviews)',
    ],
    sub_scores: { cost: 8.0, platforms: 6.6, trust: 6.6, support: 7.4 },
    verdict: 'A beginner-friendly, simple pricing model — weigh the disclosed 2026 Polish regulatory fine.',
    attributes: { fca_frn: 'FRN 522157', avg_spread_eurusd_pips: 0.8, commission_round_turn_gbp: 0, account_type_note: 'Single zero-commission account', max_leverage: '30:1', platforms: ['Proprietary xStation 5 (web/desktop/mobile)'], trustpilot_rating: 4.0, trustpilot_count: 1900, trustpilot_note: 'uk.trustpilot.com/review/xtb.com', regulatory_note: "Poland's KNF fined parent XTB S.A. PLN 20m (approximately $5.5m) in March 2026 for MiFID II breaches — inadequate client-suitability questionnaires and product-governance failures between January 2022 and September 2023. A prior KNF fine (PLN 9.9m, 2018) addressed asymmetric price slippage. These are Polish/EU parent-entity actions; XTB UK Ltd operates under the same group governance." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.xtb.com/en',
    is_top_pick: false, best_for: 'Beginners wanting a simple, guided experience', display_order: 4,
    source_url: 'https://www.xtb.com/en', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'forex-com-uk', market: 'uk', category: 'forex', topic: 'forex-brokers',
    display_name: 'FOREX.com', tagline: 'Part of the NASDAQ-listed StoneX Group',
    score: 7.0, rating: 0, review_count: 0, clicks: 0, management_fee: 0.008, account_minimum: 100,
    badges: [],
    chips: ['Backed by NASDAQ-listed StoneX', 'RAW & Standard account tiers', 'MT4, MT5, TradingView'],
    pros: [
      'Backed by StoneX Group Inc. (NASDAQ-listed parent), a large, well-capitalized institution',
      'Choice of spread-only Standard account or commission-based RAW account for high-volume traders',
    ],
    cons: [
      'Parent StoneX has a long US regulatory-sanction record and several 2024-2025 exchange-level fines (NYMEX, CME, CFTC)',
      'No independent Trustpilot rating confirmed for the UK entity at research time',
    ],
    sub_scores: { cost: 7.6, platforms: 8.0, trust: 6.6, support: 7.0 },
    verdict: 'A well-capitalized global broker — weigh the disclosed US parent-level regulatory history.',
    attributes: { fca_frn: 'StoneX Financial Ltd FRN 446717', avg_spread_eurusd_pips: 0.8, commission_round_turn_gbp: 0, account_type_note: 'Standard account, spread-only, no commission; RAW account offers tighter spreads plus a per-lot commission', max_leverage: '30:1', platforms: ['Proprietary web platform', 'MT4', 'MT5', 'TradingView'], trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No independent UK-specific Trustpilot rating confirmed at research time — shown as not yet rated', regulatory_note: "Parent StoneX Financial has a long US regulatory-sanction record (FINRA discloses 76 sanctions historically) and several 2024-2025 exchange-level fines: NYMEX ~$575k (April 2025, block-trade disclosure failures), CME $20k (September 2025, physically-settled futures delivery violation), CME $2,500 (December 2025, data-entry threshold breach), and a CFTC $650k fine against StoneX Markets LLC (disclosure breach). These are US CFTC/exchange actions against the StoneX group/US entities, not the UK FCA-regulated FOREX.com entity, but reflect on overall group compliance culture." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.forex.com/en-uk',
    is_top_pick: false, best_for: 'Traders wanting a large, well-capitalized parent', display_order: 5,
    source_url: 'https://www.forex.com/en-uk', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'admirals-uk', market: 'uk', category: 'forex', topic: 'forex-brokers',
    display_name: 'Admirals', tagline: 'MetaTrader specialist — verify the genuine FRN before trading',
    score: 6.8, rating: 4.2, review_count: 2150, clicks: 2150, management_fee: 0.008, account_minimum: 250,
    badges: [],
    chips: ['MT4 & MT5 specialist', 'FCA-regulated since 2013', '⚠ FCA actively warns of clone sites — see detail'],
    pros: [
      'A dedicated MetaTrader specialist (MT4 and MT5), FCA-regulated since 2013',
      '8,000+ instruments including FX, CFDs, stocks and fractional shares',
    ],
    cons: [
      'The FCA actively warns about fraudulent clone websites impersonating Admirals — always verify the genuine FRN 595450 before depositing funds',
      "Admirals Group's audited FY2025 results showed an €18.5m net loss and a 55% year-over-year drop in net trading income",
    ],
    sub_scores: { cost: 7.4, platforms: 7.0, trust: 6.0, support: 7.0 },
    verdict: 'A genuine MetaTrader specialist — the clone-site risk is real, verify the FRN carefully.',
    attributes: { fca_frn: 'Admiral Markets UK Ltd FRN 595450 (verify this exact FRN — multiple clone sites exist)', avg_spread_eurusd_pips: 0.8, commission_round_turn_gbp: 0, account_type_note: 'Invest.MT5-type account, spread-only; a Zero account (0 pip + commission) is also available', max_leverage: '30:1', platforms: ['MT4', 'MT5'], trustpilot_rating: 4.2, trustpilot_count: 2150, trustpilot_note: 'uk.trustpilot.com/review/admiralmarkets.com — the correct/claimed corporate domain; an unclaimed "admiral-markets.com" alternate profile shows a much lower score from only 3 reviews and should not be conflated with this one', regulatory_note: "The FCA has repeatedly (most recently updated January 2024, with further warnings since) flagged fraudulent clone websites impersonating Admirals (e.g. admiral-fx.com, fxsadmiral.com, admrlmrkts.co) — these offer no FSCS or Financial Ombudsman protection. Separately, Estonia's Finantsinspektsioon fined the Estonia entity (Admiral Markets AS) €32,000 (2021) and approximately €20,000 (reporting failures); in April 2026 Admirals voluntarily surrendered its Estonian investment-firm licence as part of a restructuring (not a sanction) to consolidate under its Cyprus licence. Admirals Group's FY2025 results showed an €18.5m net loss and a 55% YoY drop in net trading income, alongside an April 2024 pause on onboarding new European clients linked to CySEC regulatory friction. None of this is a UK FCA action against Admiral Markets UK Ltd (FRN 595450) specifically — its issue set is dominated by third-party clone fraud, not its own conduct." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://admiralmarkets.com/',
    is_top_pick: false, best_for: 'MetaTrader users who have verified the genuine FRN', display_order: 6,
    source_url: 'https://admiralmarkets.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'saxo-forex-uk', market: 'uk', category: 'forex', topic: 'forex-brokers',
    display_name: 'Saxo', tagline: 'BrokerChooser 2026 UK forex overall winner — with a disclosed Danish AML fine',
    score: 6.6, rating: 3.5, review_count: 8200, clicks: 8200, management_fee: 0.007, account_minimum: 500,
    badges: [],
    chips: ['BrokerChooser 2026 UK forex winner', '185+ FX pairs', '⚠ ~£37-40M Danish AML fine — see detail'],
    pros: [
      'Named BrokerChooser 2026 overall winner among UK forex brokers (100+ brokers tested)',
      '185+ FX pairs across a tiered institutional-grade pricing structure',
    ],
    cons: [
      "Denmark's FSA fined parent Saxo Bank approximately $46-50m for AML Act violations related to KYC/customer due-diligence failures",
      'A high-barrier tiered account structure (£500 minimum for Classic, up to £1,000,000 for VIP) and the lowest Trustpilot rating of the 7 (~3.5/5)',
    ],
    sub_scores: { cost: 7.6, platforms: 7.4, trust: 5.0, support: 7.0 },
    verdict: 'An award-winning platform with real scale — weigh the disclosed Danish AML fine carefully.',
    attributes: { fca_frn: 'FRN 551422 (confirm directly against the FCA Register before relying on this number)', avg_spread_eurusd_pips: 0.7, commission_round_turn_gbp: 0, account_type_note: 'Classic tier, spread-only; VIP tier offers tighter spreads (~0.5 pips) at a much higher minimum deposit', max_leverage: '30:1', platforms: ['SaxoTraderGO', 'SaxoTraderPRO', 'TradingView'], trustpilot_rating: 3.5, trustpilot_count: 8200, trustpilot_note: 'uk.trustpilot.com/review/home.saxo — lowest rating of the 7', regulatory_note: "Denmark's Financial Supervisory Authority fined parent Saxo Bank approximately $46-50m for AML Act violations related to KYC/customer due-diligence failures, disclosed alongside a 2025 ownership-change process (the purchase price was adjusted down by approximately $8.7m to reflect the fine); the regulator found no evidence that actual money laundering occurred, only compliance-process failures. Saxo's Hong Kong unit was separately fined approximately $4m for unrelated breaches." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.home.saxo/en-gb',
    is_top_pick: false, best_for: 'Traders wanting an award-winning institutional platform', display_order: 7,
    source_url: 'https://www.home.saxo/en-gb', data_verified_at: '2026-07-11', active: true,
  },
];

const remortgageBrokers = [
  {
    slug: 'lc-mortgages', market: 'uk', category: 'remortgaging', topic: 'remortgage-brokers',
    display_name: 'L&C (London & Country) Mortgages', tagline: "The UK's largest fee-free broker",
    score: 9.0, rating: 4.6, review_count: 18000, clicks: 18000, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['£33M+ saved for customers in 2025', '65,000+ completions in 2025', 'B Corp certified'],
    pros: [
      "The UK's largest fee-free mortgage broker, with a transparent \"how we're paid\" disclosure",
      'Saved customers £33m+ in 2025 across 65,000+ completions',
      'British Bank Awards 2026 — Customer Service Champion + Best Broker (highly commended)',
    ],
    cons: [
      'Recurring complaint theme is slow or unclear communication, per Trustpilot review analysis',
      'Not owned by a bank — majority-owned by its founder since 2000, with Experian holding a minority stake since 2017 (a real but not concerning ownership structure)',
    ],
    sub_scores: { independence: 9.4, panel: 8.6, cost: 10.0, rating: 9.2 },
    verdict: "The UK's largest, most-trusted fee-free remortgage broker.",
    attributes: { business_model: 'whole_of_market_broker', business_model_note: 'Independent whole-of-market broker; not owned by a bank or comparison-site conglomerate — majority-owned by founder Michael Edge since 2000, with Experian holding a minority stake since 2017', lender_panel_note: "~90+ lenders per third-party review; L&C's own \"whole-of-market\" marketing claim is not independently verified against every UK lender", broker_fee_gbp: 0, consumer_fee_note: "Fee-free for mortgage advice; exceptions apply for conveyancing (referral fee, paid to the conveyancer) and optional life/protection cover (commission-based)", trustpilot_rating: 4.6, trustpilot_count: 18000, trustpilot_note: 'uk.trustpilot.com/review/landc.co.uk', regulatory_note: 'No FCA fines or enforcement action found for 2024-2026 — only routine service-delay complaints on consumer forums.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.landc.co.uk/',
    is_top_pick: true, best_for: 'Borrowers wanting the largest fee-free broker', display_order: 1,
    source_url: 'https://www.landc.co.uk/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'habito', market: 'uk', category: 'remortgaging', topic: 'remortgage-brokers',
    display_name: 'Habito', tagline: 'A fully digital, whole-of-market broker — now backed by Monzo',
    score: 8.7, rating: 4.9, review_count: 10000, clicks: 10000, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'green', label: 'Best digital, whole-of-market broker' }],
    chips: ['95+ lenders', 'Acquired by Monzo (completed 30 Apr 2026)', 'Still operates under its own brand'],
    pros: [
      'A whole-of-market digital broker with a 95+ lender panel',
      'Strong Trustpilot rating (~4.9/5)',
      'Now backed by Monzo\'s resources following an April 2026 acquisition, while continuing to operate under its own brand and FCA authorisation',
    ],
    cons: [
      'You do not need a Monzo account to use Habito, but the acquisition is a genuine, recent ownership change worth knowing about',
    ],
    sub_scores: { independence: 8.0, panel: 9.4, cost: 10.0, rating: 9.6 },
    verdict: 'The best fully digital, whole-of-market broker — now with Monzo\'s backing.',
    attributes: { business_model: 'whole_of_market_broker', business_model_note: 'Digital-first, whole-of-market broker; acquired by Monzo (Monzo\'s first-ever acquisition), completed 30 April 2026, but continues operating under its own brand and FCA authorisation (Hey Habito Ltd, FRN 714187) — a Monzo account is not required to use Habito', lender_panel_note: '95+ lenders — current figure supersedes an older "90+" claim', broker_fee_gbp: 0, consumer_fee_note: 'Free — paid via an approximate 0.35% lender procuration fee', trustpilot_rating: 4.9, trustpilot_count: 10000, trustpilot_note: 'Trustpilot "Excellent" rating; exact current review count not independently re-confirmed live at research time', regulatory_note: "Monzo announced its first-ever acquisition of Habito in December 2025; the deal completed 30 April 2026. Habito continues operating under its own brand, own site and own FCA authorisation. No FCA fines or enforcement action found for 2024-2026." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.habito.com/',
    is_top_pick: false, best_for: 'Borrowers wanting a fully digital, whole-of-market broker', display_order: 2,
    source_url: 'https://www.habito.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'better-co-uk', market: 'uk', category: 'remortgaging', topic: 'remortgage-brokers',
    display_name: 'Better.co.uk', tagline: 'Digital broker, now under new UK ownership (OneDome)',
    score: 8.3, rating: 4.85, review_count: 9000, clicks: 9000, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['90-100+ lenders (RateWatch monitoring)', 'Sold to UK proptech OneDome (2025)', 'Free for most customers'],
    pros: [
      'A digital broker with a "RateWatch" rate-monitoring tool and a 90-100+ lender panel',
      'Strong Trustpilot rating ("Excellent", 4.8-4.9/5)',
      'Sold in mid-2025 by its struggling US parent to UK proptech firm OneDome — now genuinely decoupled from that parent\'s financial turmoil',
    ],
    cons: [
      'Free "for most customers," but the site notes fees can apply depending on individual circumstances',
      'Excludes some direct-only lenders (e.g. Lloyds, First Direct) from its panel',
    ],
    sub_scores: { independence: 8.2, panel: 8.6, cost: 9.6, rating: 9.4 },
    verdict: 'A well-reviewed digital broker, now under new, more stable UK ownership.',
    attributes: { business_model: 'whole_of_market_broker', business_model_note: 'Digital broker (formerly Trussle, launched 2015; rebranded Better.co.uk in January 2023 after acquisition by US-based Better Home & Finance Holding); in May-June 2025 the UK entity (Trussle Lab Ltd) was sold by its US parent to UK proptech firm OneDome — Trustpilot now lists it as "Better.co.uk — trading as ONEDOME"', lender_panel_note: '90-100+ lenders (the "100+" figure on-site carries a January 2023 disclaimer, treat as approximate); excludes some direct-only lenders (Lloyds, First Direct)', broker_fee_gbp: 0, consumer_fee_note: 'Free for most customers; the site notes fees can apply depending on individual circumstances', trustpilot_rating: 4.85, trustpilot_count: 9000, trustpilot_note: 'Trustpilot "Excellent", 4.8-4.9/5, figure fluctuated across pages', regulatory_note: "Better.co.uk's former US parent, Better Home and Finance Holding (Nasdaq: BETR), saw its stock fall approximately 93% after its August 2024 Nasdaq debut, underwent a 1-for-50 reverse stock split, and completed an April 2025 debt restructuring exchanging $534m of SoftBank debt for $110m cash plus $155m in new notes — separately from a widely-reported December 2021 mass-layoff incident (~900 staff let go via a single Zoom call). None of this directly affected the UK entity, which was sold to UK-based OneDome in May-June 2025 and now operates independently of the US parent's ongoing situation — disclosed for transparency, not as a current risk to the UK service." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://better.co.uk/',
    is_top_pick: false, best_for: 'Borrowers wanting ongoing rate-monitoring after applying', display_order: 3,
    source_url: 'https://better.co.uk/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'tembo-money', market: 'uk', category: 'remortgaging', topic: 'remortgage-brokers',
    display_name: 'Tembo Money', tagline: 'The best specialist choice for complex remortgage cases',
    score: 8.0, rating: 4.7, review_count: 6000, clicks: 6000, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'sky', label: 'Best for complex/specialist cases' }],
    chips: ['British Bank Awards winner, 5 years running', '100+ lenders', 'Free remortgage service'],
    pros: [
      'Best Mortgage Broker at the British Bank Awards for 5 consecutive years (2026), beating L&C, Habito and Mojo per Tembo\'s own announcement',
      'Human advisers specializing in affordability-boosting products (guarantor mortgages, shared ownership, income-boosting schemes) that generalist brokers often can\'t place',
      'Remortgage service is free, like the other whole-of-market brokers on this page',
    ],
    cons: [
      "Its standard (new-purchase) mortgage service charges a £499 fee, rising to £749 for complex cases — a genuine exception versus the fully fee-free brokers, though not applicable to remortgaging specifically",
      'Smaller review base than the largest brokers on this page (~6,000+ reviews)',
    ],
    sub_scores: { independence: 8.8, panel: 8.6, cost: 9.4, rating: 9.0 },
    verdict: 'The best specialist option for complex cases — genuinely free for remortgages specifically.',
    attributes: { business_model: 'specialist_broker', business_model_note: 'Whole-of-market broker with human advisers, specializing in affordability-boosting products (Deposit Boost, Income/Family Boost, guarantor mortgages, shared ownership, key-worker schemes) for buyers who don\'t qualify with generalist brokers', lender_panel_note: '100+ lenders claimed', broker_fee_gbp: 0, consumer_fee_note: 'Free for remortgages; its standard (new-purchase) mortgage service charges £499, rising to £749 for complex/specialist cases (capped at 1% of loan value), waived for HomeSaver/savings-account holders — not applicable to this remortgage-specific comparison', trustpilot_rating: 4.7, trustpilot_count: 6000, trustpilot_note: 'Trustpilot "Excellent", ~4.8/5 per one source, ~4.6/5 per another — figure shown is a midpoint, verify live', regulatory_note: 'No FCA enforcement found for Tembo Money Ltd or Tembo Savings Ltd. Minor MoneySavingExpert complaint threads exist about FSCS-protection clarity for its savings products, and some 1-star Trustpilot complaints about missed appointments — service-quality issues, not regulatory findings. Raised £15m+ in February 2026 (led by Gresham House Ventures with Aviva Investors and British Business Bank), with savings AUA reaching £3bn in 2025.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.tembomoney.com/',
    is_top_pick: false, best_for: 'Borrowers with complex cases generalist brokers can\'t place', display_order: 4,
    source_url: 'https://www.tembomoney.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'mojo-mortgages', market: 'uk', category: 'remortgaging', topic: 'remortgage-brokers',
    display_name: 'Mojo Mortgages', tagline: 'A whole-of-market fintech broker, part of the RVU group',
    score: 7.6, rating: 4.8, review_count: 9945, clicks: 9945, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['60+ lenders (per Mojo\'s own site)', 'Trustpilot 4.8/5 (9,945 reviews)', 'Owned by RVU (with Uswitch)'],
    pros: [
      'Strong Trustpilot rating (4.8/5, 9,945 reviews)',
      'Free advice, paid via lender commission',
    ],
    cons: [
      'Mojo\'s own site states 60+ lenders — a narrower confirmed panel than L&C, Habito, Better.co.uk or Tembo (though some third-party sites cite higher, unverified figures)',
      'Owned by RVU (part of Zoopla Property Group, majority-owned by Silver Lake Partners) — the same parent that owns Uswitch, which feeds referrals directly to Mojo',
    ],
    sub_scores: { independence: 7.0, panel: 7.4, cost: 10.0, rating: 9.6 },
    verdict: 'A well-reviewed broker with a narrower confirmed lender panel and notable corporate ownership ties.',
    attributes: { business_model: 'whole_of_market_broker', business_model_note: "Fintech-style whole-of-market broker; acquired by RVU in July 2021 — RVU also owns Uswitch, Confused.com, Money.co.uk and Tempcover, and is itself part of Zoopla Property Group, majority-owned by US private-equity firm Silver Lake Partners since 2018", lender_panel_note: "60+ lenders per Mojo's own site; some third-party sites cite 70-90+, unverified against a primary source", broker_fee_gbp: 0, consumer_fee_note: "Free — no fees for advice, paid via lender commission", trustpilot_rating: 4.8, trustpilot_count: 9945, trustpilot_note: "Per Mojo's own broker page (via Uswitch)", regulatory_note: 'No FCA enforcement found for Mojo Mortgages or parent RVU. Two individual Financial Ombudsman rulings on delayed-communication complaints were found — routine, not systemic.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://mojomortgages.com/',
    is_top_pick: false, best_for: 'Borrowers wanting a fintech-style broker experience', display_order: 5,
    source_url: 'https://mojomortgages.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'moneysupermarket-mortgages', market: 'uk', category: 'remortgaging', topic: 'remortgage-brokers',
    display_name: 'MoneySuperMarket Mortgages', tagline: 'A comparison tool, not a broker — hands off to L&C',
    score: 6.8, rating: 4.9, review_count: 54000, clicks: 54000, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['Pure comparison tool, not a broker', 'Hands off to L&C for advice', '90+ lenders covered'],
    pros: [
      'A large, well-known comparison hub (site-wide Trustpilot ~5-star, 52,000-56,500+ reviews) covering 90+ lenders',
      'Hands off to L&C (a genuinely strong, independent broker) for actual advice and completion',
    ],
    cons: [
      'Not itself a broker — gives no advice directly, so the "MoneySuperMarket" experience is really just the L&C experience downstream',
      "L&C's own fee applies downstream if you're switching lender (free if staying with your current lender, £195 if switching, payable on completion only)",
    ],
    sub_scores: { independence: 6.0, panel: 8.4, cost: 9.6, rating: 9.8 },
    verdict: 'A large comparison hub — understand you\'re really getting the L&C experience downstream.',
    attributes: { business_model: 'comparison_lead_gen', business_model_note: 'Pure comparison/lead-gen tool, not a broker — for actual advice and completion, hands consumers off primarily to L&C (non-exclusive; Fluent Mortgages also partners); MoneySuperMarket earns referral commission when a user completes via a partner', lender_panel_note: 'Comparison tool covers 90+ lenders; the broker it feeds into (L&C) covers 80+', broker_fee_gbp: 0, consumer_fee_note: "Free to use; L&C's own downstream fee applies if switching lender (free if staying with your current lender, £195 payable on completion if switching)", trustpilot_rating: 4.9, trustpilot_count: 54000, trustpilot_note: 'Site-wide rating (not mortgage-specific), ~52,000-56,500 reviews', regulatory_note: 'No FCA action found against the genuine company (ultimate parent: MONY Group plc, LSE-listed FTSE 250, renamed from Moneysupermarket.com Group plc in May 2024). The FCA has separately warned about clone-firm scams impersonating the "Money Supermarket" name — this is fraud against the brand, not a finding against the real company.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.moneysupermarket.com/mortgages/',
    is_top_pick: false, best_for: 'Borrowers wanting a large, well-known comparison hub', display_order: 6,
    source_url: 'https://www.moneysupermarket.com/mortgages/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'uswitch-mortgages', market: 'uk', category: 'remortgaging', topic: 'remortgage-brokers',
    display_name: 'Uswitch Mortgages', tagline: 'A comparison tool that hands off to its own sister company',
    score: 6.2, rating: 4.0, review_count: 39000, clicks: 39000, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['Pure comparison tool, not a broker', 'Hands off to Mojo — same RVU parent', '60+ lenders covered'],
    pros: [
      'A well-known comparison brand (site-wide Trustpilot ~4/5, 39,000+ reviews)',
      'Free to use',
    ],
    cons: [
      'Not itself a broker — hands consumers off to Mojo Mortgages, a corporate sister company under the same RVU/Zoopla/Silver Lake Partners ownership structure, materially limiting how independent the recommendation really is',
      'The narrowest confirmed lender panel of the 7 (60+, via Mojo)',
    ],
    sub_scores: { independence: 5.0, panel: 7.0, cost: 10.0, rating: 8.0 },
    verdict: 'A well-known brand — but understand its mortgage tool structurally feeds its own sister company.',
    attributes: { business_model: 'comparison_lead_gen', business_model_note: 'Pure comparison/lead-gen tool — Uswitch does not give mortgage advice itself, and hands consumers to Mojo Mortgages for actual advice/completion. Both Uswitch and Mojo are owned by RVU (part of Zoopla Property Group, majority-owned by Silver Lake Partners since 2018) — Uswitch states it does not earn money directly from these referrals, but the two are corporate affiliates, not independently competing services', lender_panel_note: '60+ lenders (via Mojo)', broker_fee_gbp: 0, consumer_fee_note: 'Free to use', trustpilot_rating: 4.0, trustpilot_count: 39000, trustpilot_note: 'Uswitch overall (site-wide, not mortgage-specific)', regulatory_note: 'No FCA enforcement found against Uswitch Limited (FRN 312850) or RVU/Mojo. The shared RVU/Zoopla/Silver Lake Partners ownership with Mojo Mortgages (the broker Uswitch refers customers to) is disclosed as a material relationship affecting independence, not a compliance violation.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.uswitch.com/mortgages/',
    is_top_pick: false, best_for: 'Existing Uswitch users comparing energy/broadband too', display_order: 7,
    source_url: 'https://www.uswitch.com/mortgages/', data_verified_at: '2026-07-11', active: true,
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

await upsert(cfdBrokers, 'trading/cfd-brokers (uk)');
await upsert(forexBrokers, 'forex/forex-brokers (uk)');
await upsert(remortgageBrokers, 'remortgaging/remortgage-brokers (uk)');

const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/product_attributes?select=category,topic&market=eq.uk&active=eq.true&topic=in.(cfd-brokers,forex-brokers,remortgage-brokers)`,
  { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } },
);
const countRows = await countRes.json();
const counts = {};
for (const r of countRows) {
  const key = `${r.category}/${r.topic}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log('\nActive row counts:', counts);
console.log('\nNext: npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk trading cfd-brokers');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk forex forex-brokers');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk remortgaging remortgage-brokers');
