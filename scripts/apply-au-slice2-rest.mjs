#!/usr/bin/env node
// AU/CA/UK rollout Slice AU-2 (forex-brokers, gold-investing/platforms,
// trading/cfd-brokers) — applies seed rows via the PostgREST API (upsert on
// the product_attributes unique constraint), same working pattern as
// apply-au-slice1-rest.mjs (exec_sql RPC and direct Postgres connection are
// both unreachable from this environment — see that script's header).
// Row data mirrors supabase/migrations/20260711090000-20260711090200 exactly
// — those .sql files remain the source-of-truth audit trail; this script is
// the actual write path used to seed prod.
// Usage: node --env-file=.env.local scripts/apply-au-slice2-rest.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

const forex = [
  {
    slug: 'pepperstone-au', market: 'au', category: 'forex', topic: 'forex-brokers',
    display_name: 'Pepperstone', tagline: 'Tight raw spreads across the broadest platform choice',
    score: 9.1, rating: 4.3, review_count: 3400, clicks: 3400, management_fee: 0.008, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['~0.1 pip EUR/USD (Razor)', 'MT4/MT5/cTrader/TradingView', 'No minimum deposit'],
    pros: [
      'Tightest raw spreads in this comparison (~0.1 pip EUR/USD on Razor)',
      'Broadest platform choice: MT4, MT5, cTrader and native TradingView integration',
      'No minimum deposit; 2023 leverage-cap matter was self-reported and fully remediated',
    ],
    cons: ['A$7 round-turn commission on the Razor (raw) account', '2023 ASIC leverage-cap breach exists in the compliance record (see detail)'],
    sub_scores: { fees: 9.4, features: 9.6, ux: 9.0, support: 8.6 },
    verdict: 'The tightest spreads and widest platform choice in this comparison, with a transparently disclosed and resolved compliance history.',
    attributes: { asic_afsl: '414530', avg_spread_eurusd_pips: 0.1, commission_round_turn_aud: 7.00, account_type_note: 'Razor account (raw/ECN, MT4/MT5/cTrader)', max_leverage: '30:1', platforms: ['MT4', 'MT5', 'cTrader', 'TradingView'], trustpilot_rating: 4.3, trustpilot_count: 3400, trustpilot_note: 'trustpilot.com/review/pepperstone.com — global aggregate page, not confirmed AU-entity-specific', retail_loss_pct: null, regulatory_note: 'In November 2023, ASIC identified Pepperstone as one of 7 CFD/FX issuers that breached the 2020 leverage Product Intervention Order due to a technical error. Pepperstone self-reported the issue and ran a remediation program compensating over 1,500 affected clients, part of a combined $17.4M+ returned to retail investors across issuers under ASIC oversight (media release 23-298MR). No further action found for 2024-2026.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://pepperstone.com/en-au/',
    is_top_pick: true, best_for: 'Active traders wanting the tightest spreads', display_order: 1,
    source_url: 'https://pepperstone.com/en-au/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'fusion-markets', market: 'au', category: 'forex', topic: 'forex-brokers',
    display_name: 'Fusion Markets', tagline: 'No minimum deposit and the lowest commission in this comparison',
    score: 8.9, rating: 4.8, review_count: 7500, clicks: 7500, management_fee: 0.0045, account_minimum: 0,
    badges: [{ type: 'green', label: 'Best value' }],
    chips: ['A$4.50 round-turn commission', 'No minimum deposit', 'MT4/MT5/cTrader/TradingView'],
    pros: [
      'Lowest all-in commission of the 7 (A$4.50 round-turn on Zero account)',
      'No minimum deposit on either account type',
      'No regulatory red flags found; strong Trustpilot score (4.8/5, ~7,500 reviews)',
    ],
    cons: ['Youngest brand in this comparison, less track record than the older incumbents', 'Narrower non-forex product range than IG/CMC'],
    sub_scores: { fees: 9.6, features: 8.8, ux: 8.8, support: 8.4 },
    verdict: 'The lowest-cost, no-minimum-deposit option with a clean regulatory record.',
    attributes: { asic_afsl: '385620', avg_spread_eurusd_pips: 0.0, commission_round_turn_aud: 4.50, account_type_note: 'Zero account (raw/ECN, MT4/MT5/cTrader/TradingView)', max_leverage: '30:1', platforms: ['MT4', 'MT5', 'cTrader', 'TradingView'], trustpilot_rating: 4.8, trustpilot_count: 7500, trustpilot_note: 'trustpilot.com/review/fusionmarkets.com — primary/global aggregate page', retail_loss_pct: null, regulatory_note: '' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://fusionmarkets.com/',
    is_top_pick: false, best_for: 'Cost-conscious traders', display_order: 2,
    source_url: 'https://fusionmarkets.com/Trading/Zero-Trading-Account', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'cmc-markets-forex-au', market: 'au', category: 'forex', topic: 'forex-brokers',
    display_name: 'CMC Markets', tagline: 'Long-established dual-licensed broker with 0.0-pip majors on FX Active',
    score: 8.8, rating: 4.3, review_count: 3200, clicks: 3200, management_fee: 0.005, account_minimum: 0,
    badges: [{ type: 'sky', label: 'Long track record' }],
    chips: ['0.0 pips on 6 major pairs (FX Active)', 'Dual ASIC licences since 1996/2001', 'No minimum deposit'],
    pros: [
      'FX Active tier offers 0.0-pip spreads on 6 major pairs plus a low % commission',
      'Long-established brand (est. 1989) with dual AFSL licensing and no regulatory red flags found',
      'No minimum deposit; proprietary Next Generation platform plus MT4/MT5',
    ],
    cons: ['No traditional flat-commission raw account — cost model less familiar to ECN-account traders', 'Some reviews cite slower withdrawal processing on larger amounts'],
    sub_scores: { fees: 9.0, features: 8.8, ux: 8.6, support: 8.2 },
    verdict: 'A safe, long-track-record choice with genuinely tight pricing on FX Active.',
    attributes: { asic_afsl: '238054', avg_spread_eurusd_pips: 0.0, commission_round_turn_aud: 5.00, account_type_note: 'FX Active account (0.0 pips on 6 majors + ~0.0025% commission per side); Standard account also available, spread-only, no commission', max_leverage: '30:1', platforms: ['MT4', 'MT5', 'CMC Next Generation'], trustpilot_rating: 4.3, trustpilot_count: 3200, trustpilot_note: 'trustpilot.com/review/www.cmcmarkets.com — mixed-market aggregate, not confirmed AU-exclusive', retail_loss_pct: null, regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.cmcmarkets.com/en-au/',
    is_top_pick: false, best_for: 'Traders wanting an established, dual-licensed broker', display_order: 3,
    source_url: 'https://www.cmcmarkets.com/en-au/cfd/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'ic-markets-au', market: 'au', category: 'forex', topic: 'forex-brokers',
    display_name: 'IC Markets', tagline: 'Very tight raw spreads, with an active class action disclosed',
    score: 8.3, rating: 4.8, review_count: 15, clicks: 15, management_fee: 0.008, account_minimum: 300,
    badges: [],
    chips: ['~0.1 pip EUR/USD (Raw Spread)', 'MT4/MT5/cTrader', 'A$300 minimum deposit'],
    pros: ['Very tight raw spreads (~0.1 pip) and deep liquidity/fast execution reputation', 'Full MT4/MT5/cTrader platform choice'],
    cons: [
      'Active Federal Court of Australia consolidated class action alleging misleading CFD sales conduct (see detail) — no judgment yet',
      'AU-specific Trustpilot sample is very thin (~15 reviews); the widely-cited 4.8/54,000+ figure is for the separate global entity, not the AU AFSL entity',
    ],
    sub_scores: { fees: 9.4, features: 9.0, ux: 8.4, support: 7.8 },
    verdict: 'Tight pricing and deep platform choice, but weigh the active, unresolved legal matter below before choosing.',
    attributes: { asic_afsl: '335692', avg_spread_eurusd_pips: 0.1, commission_round_turn_aud: 7.00, account_type_note: 'Raw Spread account (ECN, MT4/MT5/cTrader); Standard account also available, no commission', max_leverage: '30:1', platforms: ['MT4', 'MT5', 'cTrader'], trustpilot_rating: 4.8, trustpilot_count: 15, trustpilot_note: 'icmarkets.com.au (AU entity) has only ~15 Trustpilot reviews — too thin to be reliable; the 4.8/54,000+ figure cited elsewhere is for the separate global (offshore) entity, not this AU AFSL entity', retail_loss_pct: null, regulatory_note: "An active, consolidated Federal Court of Australia class action (Bain and Anor v International Capital Markets Pty Ltd, VID1088/2023, consolidated 2 Aug 2024) alleges misleading/deceptive/unconscionable conduct in the supply of CFDs to retail clients, failure to adequately warn of leverage risk, and conflicted-remuneration breaches. The opt-out deadline passed 2 December 2025; no judgment or settlement has been reported as of this page's last verification. IC Markets' global marketing of leverage up to 1:5000 applies to a separate offshore entity, not this ASIC-regulated AU entity, which is capped at 30:1 for retail FX majors." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.icmarkets.com/',
    is_top_pick: false, best_for: 'Traders comfortable weighing the active legal matter', display_order: 4,
    source_url: 'https://www.icmarkets.com/en/trading-pricing/spreads', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'ig-markets-forex-au', market: 'au', category: 'forex', topic: 'forex-brokers',
    display_name: 'IG Markets', tagline: 'Large global brand with the broadest platform and market range',
    score: 8.4, rating: 4.0, review_count: 9689, clicks: 9689, management_fee: 0.007, account_minimum: 0,
    badges: [],
    chips: ['~0.6-0.9 pip EUR/USD (spread-only)', 'Own platform + MT4 + ProRealTime + DMA', 'No formal minimum deposit'],
    pros: [
      'Widest platform choice: own platform, MT4, ProRealTime charting (free with 4+ trades/month) and L2 Dealer DMA',
      'Very large, long-tenured global brand with its own AU AFSL',
      'No formal minimum deposit',
    ],
    cons: ['No genuine low-commission/raw-spread account for cost-conscious active traders', 'Spread wider than the raw/ECN brokers on this page (~0.6-0.9 pip vs ~0.0-0.1 pip)'],
    sub_scores: { fees: 8.2, features: 9.2, ux: 8.6, support: 8.4 },
    verdict: 'The broadest platform and market range from a large, established global brand.',
    attributes: { asic_afsl: '220440', avg_spread_eurusd_pips: 0.7, commission_round_turn_aud: 0, account_type_note: 'Standard spread-only account (no raw/commission tier for retail); L2 Dealer DMA available for approved professional/high-volume traders', max_leverage: '30:1', platforms: ['IG platform', 'MT4', 'ProRealTime', 'L2 Dealer (DMA)'], trustpilot_rating: 4.0, trustpilot_count: 9689, trustpilot_note: 'trustpilot.com/review/ig.com — global/UK-anchored aggregate page, not confirmed AU-exclusive', retail_loss_pct: null, regulatory_note: 'A proposed Federal Court class action was announced in October 2022 (Piper Alderman, funded by Omni Bridgeway) alleging IG marketed complex CFDs to inexperienced AU investors without adequate risk disclosure. This page could not confirm whether the action was ultimately filed, settled or lapsed — status should be re-checked before this note is treated as current.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.ig.com/au',
    is_top_pick: false, best_for: 'Multi-asset traders wanting one broad account', display_order: 5,
    source_url: 'https://www.ig.com/au/help-and-support/cfds/fees-and-charges/what-are-igs-forex-cfd-product-details', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'fp-markets-au', market: 'au', category: 'forex', topic: 'forex-brokers',
    display_name: 'FP Markets', tagline: "Sydney-founded broker with the longest AU AFSL tenure in this comparison",
    score: 8.5, rating: 4.8, review_count: 10000, clicks: 10000, management_fee: 0.0067, account_minimum: 100,
    badges: [],
    chips: ['~0.07 pip EUR/USD (Raw)', 'AFSL held since 2005', 'MT4/MT5/cTrader/IRESS'],
    pros: [
      'Longest-tenured AU-founded entity in this comparison (AFSL since 2005, Sydney HQ)',
      'Widest platform range including IRESS (DMA-style, share-market-oriented)',
      'Very high Trustpilot volume/score (4.8/5, ~10,000 reviews)',
    ],
    cons: ['IRESS platform requires a higher A$1,000 minimum deposit vs. A$100 on MT4/MT5/cTrader', 'Exact AUD-denominated commission figure not independently confirmed at research time'],
    sub_scores: { fees: 9.0, features: 8.8, ux: 8.4, support: 8.4 },
    verdict: 'The longest-established AU-founded broker in this comparison, with the widest platform range.',
    attributes: { asic_afsl: '286354', avg_spread_eurusd_pips: 0.07, commission_round_turn_aud: 6.00, account_type_note: 'Raw account (ECN, MT4/MT5/cTrader), figure in USD terms pending AUD confirmation; IRESS (DMA) requires A$1,000 minimum', max_leverage: '30:1', platforms: ['MT4', 'MT5', 'cTrader', 'IRESS'], trustpilot_rating: 4.8, trustpilot_count: 10000, trustpilot_note: 'trustpilot.com/review/fpmarkets.com — global aggregate page, not confirmed AU-segmented', retail_loss_pct: null, regulatory_note: 'FP Markets hosts its own public "ASIC Regulatory Update" page (fpmarkets.com/asic-regulatory-update/), which could not be accessed during research (blocked). This page\'s content and purpose could not be independently confirmed — worth checking directly before treating as either a concern or routine compliance messaging.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.fpmarkets.com/',
    is_top_pick: false, best_for: 'Traders wanting an AU-founded, long-tenured broker', display_order: 6,
    source_url: 'https://www.fpmarkets.com/account-types/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'eightcap-au', market: 'au', category: 'forex', topic: 'forex-brokers',
    display_name: 'Eightcap', tagline: 'Low A$100 minimum deposit with native TradingView execution',
    score: 8.0, rating: 4.0, review_count: 3400, clicks: 3400, management_fee: 0.008, account_minimum: 100,
    badges: [],
    chips: ['A$100 minimum deposit', 'Native TradingView execution', '~0.1 pip EUR/USD (Raw)'],
    pros: ['Low A$100 minimum deposit on both account types', 'Native TradingView order execution, not just charting', 'Competitive raw spreads (~0.1 pip) on the Raw account'],
    cons: [
      'No cTrader — narrower platform range than IC Markets/Pepperstone/FP Markets/Fusion',
      'Lowest Trustpilot score of the 7 (~4.0/5), with a comparatively higher 1-star share concentrated on payment/withdrawal complaints',
    ],
    sub_scores: { fees: 8.8, features: 7.6, ux: 8.2, support: 7.4 },
    verdict: 'An accessible A$100-minimum entry point with genuine TradingView execution.',
    attributes: { asic_afsl: '391441', avg_spread_eurusd_pips: 0.1, commission_round_turn_aud: 7.00, account_type_note: 'Raw account (ECN, MT4/MT5/TradingView); Standard account also available, commission-free', max_leverage: '30:1', platforms: ['MT4', 'MT5', 'TradingView'], trustpilot_rating: 4.0, trustpilot_count: 3400, trustpilot_note: 'trustpilot.com/review/eightcap.com — global aggregate page, ~12% one-star share concentrated on payment/withdrawal complaints', retail_loss_pct: null, regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.eightcap.com/au',
    is_top_pick: false, best_for: 'Traders wanting native TradingView execution', display_order: 7,
    source_url: 'https://www.eightcap.com/en/trading-costs/', data_verified_at: '2026-07-11', active: true,
  },
];

const gold = [
  {
    slug: 'perth-mint', market: 'au', category: 'gold-investing', topic: 'platforms',
    display_name: 'The Perth Mint', tagline: "Australia's only government-owned mint, LBMA-accredited",
    score: 9.0, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Government-owned (WA)', 'LBMA Good Delivery-accredited', '0% unallocated storage'],
    pros: [
      "Australia's only government-owned mint, backed by the Western Australian Government",
      'LBMA Good Delivery-accredited refiner — the strongest accreditation in this comparison',
      'Unallocated storage is free (0%); allocated storage 1.0% p.a.',
    ],
    cons: ['A past AUSTRAC AML/CTF enforceable undertaking (2023-2025, now resolved) is part of the record', 'Live pricing page was non-functional at research time, complicating premium verification'],
    sub_scores: { fees: 8.6, features: 9.4, ux: 8.4, support: 8.8 },
    verdict: 'The strongest accreditation of any dealer in this comparison — a government-owned, LBMA-accredited mint.',
    attributes: { premium_over_spot_pct: null, premium_note: 'Live pricing page returned "pricing unavailable" at research time — get a current quote directly before buying; industry reference range for minted bars/coins is commonly cited around 3-6%, not independently confirmed here.', storage_fee_pct: 1.0, storage_note: 'Allocated gold: 1.0% p.a.; Unallocated gold: 0% (free)', buyback_available: true, accreditation: 'government_mint', accreditation_note: 'Wholly owned by the Government of Western Australia (trades as Gold Corporation); also an LBMA Good Delivery-accredited refiner.', years_in_business: 126, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: "Not independently confirmed at research time — recommend using Perth Mint's own published customer stats or Google Business rating instead", regulatory_note: "AUSTRAC found serious AML/CTF program failings at Gold Corporation (Perth Mint) — inadequate customer due diligence and transaction monitoring. An enforceable undertaking ran Nov 2023 to May 2025, when AUSTRAC accepted the external auditor's final remediation report and concluded the matter. Disclosed transparently given Perth Mint's position as the highest-accreditation candidate on this page." },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.perthmint.com/',
    is_top_pick: true, best_for: 'Investors who want government/LBMA-backed gold', display_order: 1,
    source_url: 'https://www.perthmint.com/invest/information-about-gold-and-silver-storage/fees/', data_verified_at: '2026-07-10', active: true,
  },
  {
    slug: 'ainslie-bullion', market: 'au', category: 'gold-investing', topic: 'platforms',
    display_name: 'Ainslie Bullion', tagline: "Australia's longest-operating independent dealer, since 1974",
    score: 8.6, rating: 4.5, review_count: 12, clicks: 12, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Most established independent' }],
    chips: ['Operating since 1974', 'Clear allocated/unallocated storage', '4.5/5 on bullion.directory'],
    pros: [
      'Oldest independent dealer in this comparison, operating since 1974',
      'Clear storage structure: $15.50/oz p.a. allocated, free unallocated',
      'Strong independent trust score (4.5/5, "A+" rating on bullion.directory) and a clean complaint record',
    ],
    cons: ['Does not hold an AFSL — outside ASIC/AFCA scope, same as most dealers in this category', 'Storage is a flat per-ounce fee, not a percentage, complicating direct comparison'],
    sub_scores: { fees: 8.4, features: 8.6, ux: 8.8, support: 9.0 },
    verdict: 'The most established independent Australian bullion dealer, with a clean track record.',
    attributes: { premium_over_spot_pct: null, premium_note: 'Not confirmed live at research time — get a current quote directly before buying.', storage_fee_pct: null, storage_note: 'Allocated gold & platinum: A$15.50/oz p.a. (incl. GST), a flat per-ounce fee, not a percentage; Unallocated: free (0%)', buyback_available: true, accreditation: 'retail_dealer', accreditation_note: 'Independent retail bullion dealer; does not hold an AFSL (explicitly outside ASIC regulation and AFCA dispute resolution).', years_in_business: 52, trustpilot_rating: 4.5, trustpilot_count: 12, trustpilot_note: 'bullion.directory internal score (4.5/5 from 12 reviews, "A+" rating) — direct Trustpilot figure could not be confirmed (fetch blocked)', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.ainsliebullion.com.au/',
    is_top_pick: false, best_for: 'Buyers who value the longest track record', display_order: 2,
    source_url: 'https://ainsliebullion.com.au/Storage', data_verified_at: '2026-07-10', active: true,
  },
  {
    slug: 'as-good-as-gold-australia', market: 'au', category: 'gold-investing', topic: 'platforms',
    display_name: 'As Good As Gold Australia', tagline: 'The best-attested customer rating in this comparison',
    score: 8.3, rating: 4.7, review_count: 28, clicks: 28, monthly_fee: 0,
    badges: [{ type: 'sky', label: 'Highest-rated' }],
    chips: ['4.7/5 from 28 Trustpilot reviews', 'Sources from 6 major mints', 'Founder-led, personally accessible'],
    pros: [
      'Highest, most robustly corroborated Trustpilot score of the 7 (4.7/5, 28 reviews, cross-checked against a second independent directory)',
      'Sources from Perth Mint, Royal Canadian Mint, The Royal Mint, Austrian Mint, PAMP and Valcambi',
      'Founder-led and described by customers as personally accessible',
    ],
    cons: ['Newer/smaller company than most peers (founded 2013)', 'Several hard numeric fields (premium %, storage %, minimum order) not independently confirmed at research time'],
    sub_scores: { fees: 8.0, features: 8.2, ux: 8.8, support: 9.0 },
    verdict: 'The strongest independently corroborated customer rating in this comparison.',
    attributes: { premium_over_spot_pct: null, premium_note: 'Not confirmed live at research time — get a current quote directly before buying.', storage_fee_pct: null, storage_note: "Not confirmed at research time — no storage percentage was found on the provider's public pages.", buyback_available: false, accreditation: 'authorised_distributor', accreditation_note: 'Sources product from multiple accredited mints/refiners (Perth Mint, Royal Canadian Mint, The Royal Mint, Austrian Mint, PAMP, Valcambi); not itself a government mint or LBMA-accredited refiner.', years_in_business: 13, trustpilot_rating: 4.7, trustpilot_count: 28, trustpilot_note: 'Trustpilot 4.7/5 from 28 reviews, corroborated by a second independent directory (bullion.directory, 5/5 from 5 reviews) — the most robustly attested rating found among the 7 candidates', regulatory_note: 'Buyback availability could not be explicitly confirmed at research time — company markets itself as a buyer/seller but no dedicated buyback page/spread was found; confirm directly before assuming buyback terms.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.asgoodasgold.com.au/',
    is_top_pick: false, best_for: 'Buyers prioritising customer-rating track record', display_order: 3,
    source_url: 'https://www.asgoodasgold.com.au/', data_verified_at: '2026-07-10', active: true,
  },
  {
    slug: 'abc-bullion', market: 'au', category: 'gold-investing', topic: 'platforms',
    display_name: 'ABC Bullion', tagline: 'Large, LBMA-accredited refiner with a mixed service record',
    score: 7.6, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['LBMA-accredited refinery (ABC Refinery)', 'Reduced storage fees since Jul 2025', 'Large, well-known Pallion Group brand'],
    pros: [
      'Owns its own LBMA Good Delivery-accredited refinery — few AU dealers do',
      'Reduced storage fees (0.55% p.a. on gold cast bars) for single-issuer holdings since July 2025',
      'Large, well-known brand (Pallion Group)',
    ],
    cons: [
      'Customer-service complaints (long hold times, delivery/dispatch delays) appear repeatedly in reviews',
      'Conflicting Trustpilot figures found across sources (ranging 1.7-3.7/5) — too inconsistent to publish a single confirmed number',
    ],
    sub_scores: { fees: 8.0, features: 8.6, ux: 6.8, support: 6.2 },
    verdict: 'A large, LBMA-accredited refiner — weigh the mixed service-quality reviews against its scale and accreditation.',
    attributes: { premium_over_spot_pct: 3.9, premium_note: 'One low-confidence indexed data point (~3.9% on a 1oz Gold Cast Bar, Jan 2026) — treat as indicative only, get a current quote before buying.', storage_fee_pct: 0.55, storage_note: '0.55% p.a. for gold cast bars in Premium/Secure storage (reduced 15-20% from July 2025 for single-issuer holdings)', buyback_available: true, accreditation: 'lbma_refiner', accreditation_note: 'ABC Refinery (part of the same group) is LBMA Good Delivery-accredited for gold.', years_in_business: null, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'Conflicting figures found across sources (1.7/5 to 3.7/5 on Trustpilot; 2.67/5 from 12 reviews on bullion.directory) — too inconsistent to publish a single confirmed rating without a fresh direct check', regulatory_note: 'Multiple negative customer reviews describe unresponsive customer service (up to 60 minutes on hold, unanswered emails) and delivery/dispatch delays without tracking; one review describes 17 days of no response on a stored-silver delivery request. Positive reviews (product quality, Gold Saver program) also exist — sentiment is genuinely mixed, not uniformly negative.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.abcbullion.com.au/',
    is_top_pick: false, best_for: 'Buyers wanting a large, LBMA-accredited refiner', display_order: 4,
    source_url: 'https://www.abcbullion.com/store/gold', data_verified_at: '2026-07-10', active: true,
  },
  {
    slug: 'gold-bullion-australia', market: 'au', category: 'gold-investing', topic: 'platforms',
    display_name: 'Gold Bullion Australia', tagline: 'A 40+ year dealer with its own in-house vault',
    score: 7.8, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['40+ years in business', 'Own in-house custodial vault', 'Consistently positive review sentiment'],
    pros: ['One of the few AU dealers with its own in-house custodial vault', 'Long operating history (40+ years)', 'Consistently positive review sentiment where found'],
    cons: ["Founding year is inconsistent between the company's own marketing (1980) and an independent directory (1984)", 'Premium %, storage % and minimum order could not be independently confirmed at research time'],
    sub_scores: { fees: 7.6, features: 8.0, ux: 8.4, support: 8.2 },
    verdict: "A long-established dealer with its own vault — several pricing fields need a direct quote before buying.",
    attributes: { premium_over_spot_pct: null, premium_note: 'Not found/confirmed at research time.', storage_fee_pct: null, storage_note: 'Described as "pool allocated holdings, segregated storage" with no percentage published — confirm directly.', buyback_available: true, accreditation: 'retail_dealer', accreditation_note: 'Independent retail dealer with its own in-house custodial vault (uncommon among AU dealers); not itself a government mint or LBMA-listed refiner.', years_in_business: 42, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: "One low-confidence source (Trustindex.io, a Trustpilot-adjacent aggregator) cited 4.9/5 from ~420 reviews; a separate bullion.directory listing showed zero reviews — the two sources don't corroborate each other, treated as unconfirmed pending a direct Trustpilot check", regulatory_note: 'Two conflicting founding dates found (1980 per own marketing vs. 1984 per an independent directory) — using "40+ years" rather than a precise founding year pending resolution. No substantive complaints found.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://goldbullionaustralia.com.au/',
    is_top_pick: false, best_for: 'Buyers wanting in-house vault storage', display_order: 5,
    source_url: 'https://www.goldbullionaustralia.com.au/', data_verified_at: '2026-07-10', active: true,
  },
  {
    slug: 'guardian-gold', market: 'au', category: 'gold-investing', topic: 'platforms',
    display_name: 'Guardian Gold', tagline: 'Individually segregated safe-deposit storage, off-balance-sheet',
    score: 7.9, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['Off-balance-sheet, segregated storage', 'Dual mint distributorship', "Optional Lloyd's of London insurance"],
    pros: [
      'Off-balance-sheet, individually segregated safe-deposit-box storage — structurally lower counterparty risk than pooled allocated storage',
      'Authorised distributor of both The Perth Mint and the Royal Australian Mint',
      "Optional unlimited insurance available through Lloyd's of London",
    ],
    cons: ['Flat-fee storage model (from A$199/year) makes % comparison to competitors awkward at low holding values', 'Very small review sample sizes across all sources found (3-5 reviews)'],
    sub_scores: { fees: 7.4, features: 8.8, ux: 8.6, support: 8.6 },
    verdict: 'A structurally different, lower-counterparty-risk storage model worth considering for larger holdings.',
    attributes: { premium_over_spot_pct: null, premium_note: 'Not confirmed live at research time.', storage_fee_pct: null, storage_note: 'Flat safe-deposit-box lease fee starting from A$199/year (not a percentage of holding value) — a structurally different model from allocated/unallocated storage elsewhere on this page', buyback_available: true, accreditation: 'authorised_distributor', accreditation_note: 'Authorised distributor of The Perth Mint and the Royal Australian Mint; storage via individually segregated, off-balance-sheet safe deposit boxes with sole legal title to contents.', years_in_business: 16, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'bullion.directory internal score 5/5 from only 3 reviews — too small a sample to be reliable, direct Trustpilot figure not confirmed', regulatory_note: 'Two different founding years found for two related entities (Guardian Vaults, the storage company, founded 2002; Guardian Gold, the bullion-trading arm, founded 2010) — kept distinct rather than conflated. No complaints found.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.guardiangold.com.au/',
    is_top_pick: false, best_for: 'Larger holdings wanting segregated storage', display_order: 6,
    source_url: 'https://guardian-gold.com.au/sell-bullion/', data_verified_at: '2026-07-10', active: true,
  },
  {
    slug: 'gold-stackers', market: 'au', category: 'gold-investing', topic: 'platforms',
    display_name: 'Gold Stackers', tagline: 'Authorised Perth Mint/ABC Bullion distributor — with a serious disclosed complaint',
    score: 6.0, rating: 3.2, review_count: 1, clicks: 1, monthly_fee: 0,
    badges: [],
    chips: ['Authorised Perth Mint/ABC Bullion distributor', 'Tiered storage options', '⚠ Serious complaint on record — see detail'],
    pros: ['Authorised distributor of Perth Mint and ABC Bullion products', 'Tiered storage options (allocated, private, pool allocated)'],
    cons: [
      'A specific, dated (February 2026) Trustpilot complaint describes a fully-paid silver order left undelivered for weeks with no tracking, followed by a refund refusal and an offer to liquidate at buy-back price instead — the most concerning record found among the 7 dealers researched for this page',
      'Thin review sample (1 Trustpilot review found, "Average" 3.21/5) and a possible undisclosed corporate affiliation with Gold Bullion Australia (shared "GBA Group" / 1980 founding narrative)',
    ],
    sub_scores: { fees: 7.0, features: 7.4, ux: 6.0, support: 4.0 },
    verdict: 'Kept in this comparison per our sourced-shortlist policy, but ranked last — read the disclosed complaint below before buying.',
    attributes: { premium_over_spot_pct: null, premium_note: 'Not confirmed live at research time.', storage_fee_pct: null, storage_note: 'Reported tiers (secondary source, not primary-confirmed): allocated storage 0.65% p.a. gold / 1.25% p.a. silver; private storage 0.85% p.a.; pool allocated storage free — recommend a direct primary confirmation before publishing.', buyback_available: true, accreditation: 'authorised_distributor', accreditation_note: 'Authorised distributor of Perth Mint and ABC Bullion products; not itself a government mint or LBMA-accredited refiner. Possible corporate affiliation with Gold Bullion Australia (both trace to "established 1980" language and "GBA Group") — not independently confirmed, disclosed for transparency.', years_in_business: 46, trustpilot_rating: 3.21, trustpilot_count: 1, trustpilot_note: 'au.trustpilot.com — 3.21/5 ("Average") based on only 1 review at research time — too thin a sample to be statistically meaningful on its own', regulatory_note: "A February 2026-dated Trustpilot complaint describes a fully-paid silver order (placed 27 Jan 2026) with weeks of no delivery, no tracking and no confirmed dispatch date; when the customer requested a refund, the company reportedly refused and instead offered liquidation at the market buy-back price (a loss to the customer given price movement); the matter was reportedly escalated to the company's lawyers after the customer pursued consumer-protection channels. A separate, smaller complaint (bullion.directory, 2 reviews) alleges a negative review was never published on the company's own testimonials page. This is the most concerning record found among the 7 candidates researched for this page and is disclosed here in full rather than omitted." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://goldstackers.com.au/',
    is_top_pick: false, best_for: 'Read the disclosed complaint before choosing', display_order: 7,
    source_url: 'https://www.goldstackers.com.au/buy/gold/', data_verified_at: '2026-07-10', active: true,
  },
];

const cfd = [
  {
    slug: 'cmc-markets-cfd-au', market: 'au', category: 'trading', topic: 'cfd-brokers',
    display_name: 'CMC Markets', tagline: 'The cleanest regulatory record with the widest CFD range',
    score: 9.0, rating: 4.0, review_count: 3200, clicks: 3200, monthly_fee: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['12,000+ instruments', 'Dual ASIC licences since 1996/2001', 'No minimum deposit'],
    pros: [
      'Widest CFD range of the pure-CFD brokers here (12,000+ instruments across FX, indices, commodities, crypto, treasuries, shares)',
      "Oldest CFD-specific AFSL in this comparison (since 1996), no regulatory red flags found in ASIC's 2026 sector review",
      'No minimum deposit; proprietary Next Generation platform plus TradingView integration',
    ],
    cons: ['No traditional flat-commission raw account for cost-conscious traders', 'Exact live spread figures could not be independently pulled from the pricing page at research time'],
    sub_scores: { fees: 8.8, features: 9.4, ux: 8.6, support: 8.4 },
    verdict: 'The cleanest regulatory record in this comparison, with the widest instrument range.',
    attributes: { asic_afsl: '238054', spread_note: 'Spread-based pricing (no separate commission); exact current spread on headline indices not independently confirmed at research time — see live pricing page', cfd_range_note: '12,000+ instruments: forex, indices, commodities, crypto, treasuries, shares', min_deposit_aud: null, max_leverage: '30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)', platforms: ['CMC Next Generation', 'MT4', 'TradingView'], retail_loss_pct: null, retail_loss_note: 'Conflicting figures (68-70%) found across secondary sources — not independently confirmed from a live CMC disclosure', trustpilot_rating: 4.0, trustpilot_count: 3200, trustpilot_note: 'trustpilot.com/review/www.cmcmarkets.com — exact review count not independently confirmed (fetch blocked)', regulatory_note: "Not named in ASIC's January 2026 sector-wide CFD review (26-004MR) alongside issuers found to have breached compliance obligations. No material regulatory history found at research time." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.cmcmarkets.com/en-au/',
    is_top_pick: true, best_for: 'Traders wanting the widest range with a clean record', display_order: 1,
    source_url: 'https://www.cmcmarkets.com/en-au/cfd/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'interactive-brokers-cfd-au', market: 'au', category: 'trading', topic: 'cfd-brokers',
    display_name: 'Interactive Brokers', tagline: 'Institutional-grade, genuinely low commission pricing',
    score: 8.7, rating: 3.4, review_count: 5252, clicks: 5252, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Best for high volume' }],
    chips: ['0.05% AU share CFDs (min A$5)', 'No minimum deposit', 'AFSL since 2016, AFCA member'],
    pros: [
      'Genuinely transparent, low commission pricing (0.05% on AU share CFDs, min A$5; 0.005-0.01% on index CFDs) — usually the cheapest for high-volume traders',
      'No minimum deposit; ASX/ASX24/Cboe Australia participant and AFCA member (#38492)',
      '8,500+ share CFDs plus index, commodity and FX CFDs on one institutional-grade platform',
    ],
    cons: ['Trader Workstation (TWS) has a steeper learning curve than the proprietary retail platforms most peers offer', 'Lowest Trustpilot score of the 7 (3.4/5, "Average")'],
    sub_scores: { fees: 9.6, features: 8.8, ux: 6.8, support: 7.2 },
    verdict: 'The most transparent, lowest-cost pricing for high-volume or professional-style traders.',
    attributes: { asic_afsl: '453554', spread_note: 'Commission-based, not spread-based: 0.05% on AU share CFDs (min A$5/order, 0.03% above A$10M monthly volume), 0.005-0.01% on index CFDs, FX CFDs pass through interbank spreads (as tight as 0.1 pip) plus a low commission', cfd_range_note: '8,500+ share CFDs plus index, commodity and FX CFDs', min_deposit_aud: 0, max_leverage: '30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)', platforms: ['Trader Workstation (TWS)'], retail_loss_pct: null, retail_loss_note: "No specific loss-percentage headline figure found on IB's AU pages at research time — IB's commission/DMA-style model differs from typical CFD market-makers", trustpilot_rating: 3.4, trustpilot_count: 5252, trustpilot_note: 'trustpilot.com/review/interactivebrokers.com — AU-specific listing (3.4/5, 5,252 reviews), rated "Average"', regulatory_note: 'No material regulatory history found at research time.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.interactivebrokers.com.au/',
    is_top_pick: false, best_for: 'Cost-conscious, high-volume traders', display_order: 2,
    source_url: 'https://www.interactivebrokers.com.au/en/pricing/commissions-home.php', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'pepperstone-cfd-au', market: 'au', category: 'trading', topic: 'cfd-brokers',
    display_name: 'Pepperstone', tagline: 'Broadest platform choice with a resolved compliance matter',
    score: 8.6, rating: 4.3, review_count: 3423, clicks: 3423, monthly_fee: 0,
    badges: [],
    chips: ['MT4/MT5/cTrader/TradingView', 'From 1 point on AUS200', 'No minimum deposit'],
    pros: [
      'Broadest platform choice of the 7: MT4, MT5, cTrader and native TradingView integration',
      'Fixed AUS200 index spread quoted "from 1 point," no commission',
      'No minimum deposit; 2023 leverage-cap matter was self-reported and fully remediated under ASIC oversight',
    ],
    cons: ['~1,400-2,700 instruments depending on how counted — narrower total range than CMC/IG', '2023 ASIC leverage-cap breach exists in the compliance record (self-reported and remediated, see detail)'],
    sub_scores: { fees: 8.8, features: 9.2, ux: 8.8, support: 8.4 },
    verdict: 'The widest platform choice, with a transparently disclosed and resolved compliance history.',
    attributes: { asic_afsl: '414530', spread_note: 'Spread-based (fixed-spread account), AUS200 quoted "from 1 point," no commission on the standard tier', cfd_range_note: '~1,400-2,700 instruments (90+ FX pairs, 20+ indices, 1,000+ share CFDs incl. ~200 AU shares, 40 commodities, 90+ ETFs, 26 crypto CFDs)', min_deposit_aud: 0, max_leverage: '30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)', platforms: ['MT4', 'MT5', 'cTrader', 'TradingView'], retail_loss_pct: 73.6, retail_loss_note: 'Third-party figure, not independently confirmed from a live Pepperstone AU PDS — treat as indicative pending direct verification', trustpilot_rating: 4.3, trustpilot_count: 3423, trustpilot_note: 'trustpilot.com/review/pepperstone.com — global figure, not AU-isolated', regulatory_note: 'In November 2023, ASIC identified Pepperstone as one of 7 CFD/FX issuers that breached the leverage Product Intervention Order due to a technical error. Pepperstone self-reported the issue and ran a remediation program compensating over 1,500 affected clients (ASIC media release 23-298MR). Note: some of Pepperstone\'s own marketing claims "zero regulatory sanctions across 15 years," which is inconsistent with this self-reported 2023 breach — that specific marketing claim should be treated with caution.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://pepperstone.com/en-au/',
    is_top_pick: false, best_for: 'Traders wanting the broadest platform choice', display_order: 3,
    source_url: 'https://pepperstone.com/en-au/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'ig-markets-cfd-au', market: 'au', category: 'trading', topic: 'cfd-brokers',
    display_name: 'IG', tagline: 'The deepest market range of any provider in this comparison',
    score: 8.5, rating: 3.8, review_count: 9000, clicks: 9000, monthly_fee: 0,
    badges: [],
    chips: ['~18,000 markets', 'DMA via L2 Dealer', 'No formal minimum deposit'],
    pros: [
      'Deepest market range of the 7: ~18,000 markets (11,000+ shares/ETFs, 36 indices, 90+ FX, 35+ commodities, crypto)',
      'ProRealTime charting bundled free for active traders (4+ trades/month); L2 Dealer DMA for approved professional/high-volume accounts',
      'No formal minimum to open (deposit method minimums vary A$10-A$450)',
    ],
    cons: ['No genuinely clean minimum-deposit story — varies meaningfully by payment method', 'Retail-loss percentage could not be independently confirmed (conflicting 67-71% figures found across sources)'],
    sub_scores: { fees: 8.2, features: 9.4, ux: 8.4, support: 8.2 },
    verdict: 'The deepest instrument range in this comparison, from a large, established global brand.',
    attributes: { asic_afsl: '220440', spread_note: 'Spread-based; AUS200-equivalent index CFD spread quoted "from 1 point"', cfd_range_note: '~18,000 markets: 11,000+ shares/ETFs, 36 indices, 90+ FX pairs, 35+ commodities, crypto CFDs', min_deposit_aud: null, max_leverage: '30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)', platforms: ['IG platform', 'MT4', 'ProRealTime', 'L2 Dealer (DMA)'], retail_loss_pct: null, retail_loss_note: 'Conflicting figures (67%, 69%, 71%) found across secondary sources — not independently confirmed from a live IG AU disclosure', trustpilot_rating: 3.8, trustpilot_count: 9000, trustpilot_note: 'au.trustpilot.com/review/ig.com — figures inconsistent between snippets (3.6-3.9/5), re-checked directly recommended before publish', regulatory_note: 'A proposed Federal Court class action was announced in October 2022 (Piper Alderman, funded by Omni Bridgeway) alleging IG marketed complex CFDs to inexperienced AU investors without adequate risk disclosure, citing ASIC data on CFD losses exceeding A$800 million industry-adjacent. This page could not confirm whether the action was ultimately filed, settled or lapsed — status should be re-checked before this note is treated as current.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.ig.com/au',
    is_top_pick: false, best_for: 'Multi-asset traders wanting the deepest range', display_order: 4,
    source_url: 'https://www.ig.com/au/indices/markets-indices', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'plus500-cfd-au', market: 'au', category: 'trading', topic: 'cfd-brokers',
    display_name: 'Plus500', tagline: 'Simple proprietary app experience for casual mobile-first traders',
    score: 7.6, rating: 4.2, review_count: 19472, clicks: 19472, monthly_fee: 0,
    badges: [],
    chips: ['Simple proprietary WebTrader', '~2,800 CFDs', 'Fast app-based withdrawals per reviews'],
    pros: [
      'Simple, easy-to-use proprietary WebTrader platform, well suited to casual/mobile-first traders',
      'Decent Trustpilot score and volume (4.2/5, ~19,472 reviews)',
      '~2,800 CFDs across shares, indices, forex, crypto-ETFs, ETFs, options and commodities',
    ],
    cons: [
      'Highest published retail-loss-rate range found among the 7 (79-84% across sources, not independently confirmed to a single current figure)',
      'No MT4/MT5/cTrader/TradingView — proprietary platform only, and minimum deposit figures were inconsistent across sources (A$100-A$500 depending on method)',
    ],
    sub_scores: { fees: 7.4, features: 7.6, ux: 8.4, support: 7.6 },
    verdict: 'A simple, mobile-first experience — weigh the higher published loss-rate range below.',
    attributes: { asic_afsl: '417727', spread_note: 'Floating spreads (proprietary WebTrader); exact current AUS200/SPI200 spread not independently confirmed at research time', cfd_range_note: '~2,800 CFDs: ~1,800 shares, 33 indices, 60+ FX pairs, ~20 crypto-ETF CFDs, 90+ ETFs, 20 options CFDs, commodities (AU-specific crypto-CFD availability not separately confirmed)', min_deposit_aud: null, max_leverage: '30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps)', platforms: ['Plus500 WebTrader'], retail_loss_pct: null, retail_loss_note: 'Highly inconsistent figures found across sources (79%, 80%, 82%, 84%) — the highest range of any of the 7 providers researched; not independently confirmed to a single current figure, needs live verification before being stated as fact', trustpilot_rating: 4.2, trustpilot_count: 19472, trustpilot_note: 'trustpilot.com — global figure, not AU-isolated', regulatory_note: 'No AU-specific 2025/26 ASIC enforcement action found at research time.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.plus500.com/en-au',
    is_top_pick: false, best_for: 'Casual, mobile-first traders', display_order: 5,
    source_url: 'https://www.plus500.com/en/help/feescharges', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'ic-markets-cfd-au', market: 'au', category: 'trading', topic: 'cfd-brokers',
    display_name: 'IC Markets', tagline: 'Very large instrument range — with an active class action disclosed',
    score: 7.5, rating: 4.8, review_count: 15, clicks: 15, monthly_fee: 0,
    badges: [],
    chips: ['2,850+ instruments', 'A$300 minimum deposit', '⚠ Active class action — see detail'],
    pros: ['Very large instrument range (2,850+ claimed), tight raw FX/CFD spreads', 'Full MT4/MT5/cTrader/TradingView platform choice'],
    cons: [
      'Active, consolidated Federal Court of Australia class action alleging misleading CFD sales conduct (see detail) — no judgment yet',
      'AU-specific Trustpilot sample is very thin (~15 reviews); global-entity leverage marketing (up to 1:5000) does not apply to this AU-regulated entity',
    ],
    sub_scores: { fees: 8.8, features: 9.0, ux: 8.2, support: 7.6 },
    verdict: 'A very large instrument range, but weigh the active, unresolved legal matter below before choosing.',
    attributes: { asic_afsl: '335692', spread_note: 'Raw Spread accounts as low as 0.0 pips on FX; headline index CFDs quoted "from 1 point" generically, exact AUS200 figure not independently confirmed', cfd_range_note: "2,850+ tradable instruments claimed on IC Markets' own site", min_deposit_aud: 300, max_leverage: '30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto (ASIC PIO caps) for this AU AFSL entity — NOT the 1:5000 figure marketed by IC Markets\' separate offshore entity', platforms: ['MT4', 'MT5', 'cTrader', 'TradingView', 'WebTrader'], retail_loss_pct: null, retail_loss_note: 'Highly inconsistent figures found (71.3%, 72.5%, 73.7%, and a blended "74.2%" figure that appears to mix the AU entity with EU/global entities) — not independently confirmed for the AU-specific entity', trustpilot_rating: 4.8, trustpilot_count: 15, trustpilot_note: 'The widely-cited 4.8/54,000+ figure is for the separate global (offshore) entity, not this AU AFSL entity, which has only ~15 Trustpilot reviews — too thin to be reliable', regulatory_note: 'An active, consolidated Federal Court of Australia class action (Bain and Anor v International Capital Markets Pty Ltd, VID1088/2023, consolidated 2 Aug 2024) alleges misleading/deceptive/unconscionable conduct in the supply of CFDs to retail clients, failure to adequately warn of leverage risk, and conflicted-remuneration breaches, also naming the founder personally. The opt-out deadline passed 2 December 2025; no judgment or class-closure order has been reported as of this page\'s last verification.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.icmarkets.com/',
    is_top_pick: false, best_for: 'Traders comfortable weighing the active legal matter', display_order: 6,
    source_url: 'https://www.icmarkets.com/en/trading-pricing/spreads', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'etoro-cfd-au', market: 'au', category: 'trading', topic: 'cfd-brokers',
    display_name: 'eToro', tagline: 'Social/copy trading — with an active ASIC Federal Court case disclosed',
    score: 7.3, rating: 4.1, review_count: 30000, clicks: 30000, monthly_fee: 0,
    badges: [],
    chips: ['Social/copy trading', 'Lowest published loss-rate claim', '⚠ Active ASIC Federal Court case — see detail'],
    pros: [
      'Lowest self-published retail-loss-rate figure found among the 7 (pending independent verification)',
      'Lowest minimum deposit of the group (~A$80) and the largest Trustpilot review base (~30,000+)',
      'Social/copy-trading differentiator not offered by any other provider on this page',
    ],
    cons: [
      "Subject to ASIC's first-ever Design and Distribution Obligations Federal Court enforcement action, filed Nov 2023, unresolved as of this page's last verification — see detail",
      'No MT4/MT5/cTrader/TradingView — proprietary platform only',
    ],
    sub_scores: { fees: 8.0, features: 8.2, ux: 8.6, support: 7.4 },
    verdict: 'A distinctive social-trading offering — read the disclosed, active ASIC enforcement matter below before choosing.',
    attributes: { asic_afsl: '491139', spread_note: 'Spread-based (proprietary platform); comparable S&P 500-style index CFD spread cited around 1.0 point, AUS200-specific figure not independently confirmed', cfd_range_note: '3,000+ CFD assets across FX, commodities, indices, stocks, ETFs, crypto', min_deposit_aud: 80, max_leverage: '30:1 FX majors, 20:1 gold, 2:1 crypto (ASIC PIO caps)', platforms: ['eToro platform'], retail_loss_pct: 51, retail_loss_note: 'eToro\'s own site states 51% of retail investor accounts lose money "as at 31 March 2026" per one source — notably lower than every other provider researched; other snippets cited a wider 50-77% range across regions/dates, so this specific figure needs direct re-verification before being treated as settled', trustpilot_rating: 4.1, trustpilot_count: 30000, trustpilot_note: 'trustpilot.com/review/etoro.com — largest review base of the 7 providers researched', regulatory_note: 'ASIC\'s first-ever Design and Distribution Obligations (DDO) enforcement action is against eToro (Federal Court proceedings commenced 3 November 2023; hearing continued 27-28 April 2026; no final judgment reported as of this page\'s last verification). ASIC alleges eToro\'s CFD target market was too broad and its client-screening questionnaire was inadequate (unlimited retakes, prompts nudging toward "correct" answers), covering roughly 20,000 clients who lost money trading CFDs between 5 October 2021 and 14 June 2023. A reported in-principle settlement fell through, sending the matter to trial.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.etoro.com/en-au/',
    is_top_pick: false, best_for: 'Social/copy traders comfortable weighing the active case', display_order: 7,
    source_url: 'https://www.etoro.com/au/trading/fees/', data_verified_at: '2026-07-11', active: true,
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

await upsert(forex, 'forex-brokers (au)');
await upsert(gold, 'gold-investing/platforms (au)');
await upsert(cfd, 'trading/cfd-brokers (au)');

const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/product_attributes?select=category,topic&market=eq.au&active=eq.true&topic=in.(forex-brokers,platforms,cfd-brokers)`,
  { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } },
);
const countRows = await countRes.json();
const counts = {};
for (const r of countRows) {
  const key = `${r.category}/${r.topic}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log('\nActive row counts:', counts);
console.log('\nNext: npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts au forex forex-brokers');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts au gold-investing platforms');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts au trading cfd-brokers');
