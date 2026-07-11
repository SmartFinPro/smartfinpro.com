#!/usr/bin/env node
// AU/CA/UK rollout Slice UK-1 (personal-finance/investing-apps,
// business-banking/business-bank-accounts, savings/savings-accounts) —
// first UK slice. Applies seed rows via the PostgREST API (upsert on the
// product_attributes unique constraint), same working pattern as
// apply-au-slice{1,2,3}-rest.mjs / apply-ca-slice{1,2,3}-rest.mjs (exec_sql
// RPC and direct Postgres connection are both unreachable from this
// environment).
// Row data mirrors supabase/migrations/20260711210000-20260711210200 exactly
// — those .sql files remain the source-of-truth audit trail; this script is
// the actual write path used to seed prod.
// Usage: node --env-file=.env.local scripts/apply-uk-slice1-rest.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

const investingApps = [
  {
    slug: 'aj-bell', market: 'uk', category: 'personal-finance', topic: 'investing-apps',
    display_name: 'AJ Bell', tagline: 'The highest raw Which? customer-satisfaction score of any platform tested',
    score: 9.1, rating: 4.9, review_count: 15459, clicks: 15459, management_fee: 0.25, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Which? Recommended Provider (77%)', 'Highest satisfaction score (81%)', 'Trustpilot 4.9/5'],
    pros: [
      "The highest raw customer-satisfaction score (81%) of any platform in the Which? 2026 survey",
      'A 2026 Which? Recommended Provider — #2 overall (77%)',
      'Strongest independently corroborated review score in this comparison (Trustpilot 4.9/5, 15,459 reviews)',
    ],
    cons: [
      '0.25% platform fee, capped at £3.50/month — not the cheapest option for very large portfolios',
      '£5.00 dealing fee per trade — higher than interactive investor\'s £3.99',
    ],
    sub_scores: { fees: 8.6, universe: 8.8, ux: 9.2, support: 9.4 },
    verdict: 'The highest-satisfaction, most trusted platform in this comparison.',
    attributes: { fee_structure: 'percentage', fee_note: '0.25% platform fee, capped at £3.50/month (cap reached around £17,000)', dealing_fee_gbp: 5.00, investment_universe_note: '~8,200 shares, 4,000+ funds, 3,400 ETFs, 450 trusts, 134 bonds/gilts, 24 markets', fscs_protected: true, which_survey_note: 'Which? 2026 — #2 overall (77%), Recommended Provider, highest raw satisfaction score (81%)', trustpilot_rating: 4.9, trustpilot_count: 15459, trustpilot_note: 'trustpilot.com/review/ajbell.co.uk', regulatory_note: '' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.ajbell.co.uk/',
    is_top_pick: true, best_for: 'Investors wanting the highest-satisfaction platform', display_order: 1,
    source_url: 'https://www.ajbell.co.uk/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'trading-212', market: 'uk', category: 'personal-finance', topic: 'investing-apps',
    display_name: 'Trading 212', tagline: 'The lowest cost structure — £0 platform fee, £0 dealing',
    score: 9.0, rating: 4.6, review_count: 0, clicks: 0, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'green', label: 'Lowest cost' }],
    chips: ['£0 platform fee, £0 dealing', 'Which? #1 overall (83%)', '⚠ Not a Which? Recommended Provider — see detail'],
    pros: [
      'No platform fee and no dealing commission — only a 0.15% FX fee on non-GBP trades',
      'Topped the Which? 2026 investment platform survey outright (83% overall, 100% fees score)',
      'A new 2026 SIPP product launched with the same £0 platform/dealing fee structure',
    ],
    cons: [
      'Explicitly NOT a "Which? Recommended Provider" — Trading 212\'s FCA authorisation covers CFD trading, carrying the standard high-risk retail-investor warning',
      'Multiple Financial Ombudsman complaints exist over account-freeze/re-verification issues, though FOS decisions reviewed did not uphold them',
    ],
    sub_scores: { fees: 10.0, universe: 7.6, ux: 8.8, support: 7.4 },
    verdict: 'The lowest-cost platform in this comparison — understand the CFD-arm risk-warning nuance first.',
    attributes: { fee_structure: 'zero_platform', fee_note: '£0 platform fee, £0 dealing commission; only a 0.15% FX fee applies on non-GBP trades', dealing_fee_gbp: 0, investment_universe_note: 'Thousands of UK/US/EU shares and ETFs; new 2026 SIPP product (waitlist rollout, 75,000+ beta sign-ups)', fscs_protected: true, which_survey_note: 'Which? 2026 — #1 overall (83%), perfect 100% fees score, but explicitly NOT a Which? Recommended Provider due to the standard CFD-arm risk warning its FCA authorisation carries', trustpilot_rating: 4.6, trustpilot_count: null, trustpilot_note: 'Review count not independently confirmed at research time', regulatory_note: 'Multiple Financial Ombudsman Service complaints exist over account freezes/re-verification (KYC) — the FOS decisions reviewed did not uphold these complaints, finding Trading 212 acted within its terms and AML/KYC obligations. Separately, an unrelated "TRADING212" clone-scam entity has been FCA-flagged — not the real firm.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.trading212.com/',
    is_top_pick: false, best_for: 'Cost-conscious investors okay with the CFD warning', display_order: 2,
    source_url: 'https://www.trading212.com/isa', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'investengine', market: 'uk', category: 'personal-finance', topic: 'investing-apps',
    display_name: 'InvestEngine', tagline: 'The best pick for pure ETF portfolio-builders',
    score: 8.7, rating: 4.6, review_count: 0, clicks: 0, management_fee: 0, account_minimum: 0,
    badges: [{ type: 'sky', label: 'Best for ETF portfolios' }],
    chips: ['£0 platform fee (DIY)', 'Which? Recommended, 3rd year running', '"Great Value" badge, 2nd year'],
    pros: [
      'No platform fee on the DIY plan, commission-free ETF dealing',
      'A Which? Recommended Provider for the 3rd consecutive year, plus a "Great Value" badge for the 2nd year',
      'Strong Trustpilot rating (4.6-4.7/5)',
    ],
    cons: [
      '~830 ETFs only — no individual stocks, the narrowest investment universe of the 7 candidates',
      'Managed plan (as opposed to DIY) carries an additional ~0.25% fee',
    ],
    sub_scores: { fees: 9.6, universe: 5.6, ux: 8.6, support: 8.6 },
    verdict: 'The best-value, most-trusted choice for ETF-only portfolio building — not for stock-pickers.',
    attributes: { fee_structure: 'zero_platform', fee_note: '£0 platform fee on the DIY plan; the Managed plan adds an additional fee (~0.25%)', dealing_fee_gbp: 0, investment_universe_note: '~830 ETFs only — no individual stocks; an ETF/portfolio-builder tool, not a stock-picker\'s platform', fscs_protected: true, which_survey_note: 'Which? 2026 — #3 overall (76%), Recommended Provider (3rd consecutive year), "Great Value" badge (2nd year)', trustpilot_rating: 4.6, trustpilot_count: null, trustpilot_note: 'Sources cite 4.6-4.7/5; exact review count not independently confirmed at research time', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.investengine.com/',
    is_top_pick: false, best_for: 'Investors wanting a low-cost, ETF-only portfolio', display_order: 3,
    source_url: 'https://www.investengine.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'interactive-investor', market: 'uk', category: 'personal-finance', topic: 'investing-apps',
    display_name: 'interactive investor', tagline: 'A flat monthly fee — cheaper than a percentage fee at larger balances',
    score: 8.2, rating: 4.5, review_count: 0, clicks: 0, management_fee: 0.12, account_minimum: 0,
    badges: [],
    chips: ['Flat £4.99-11.99/month fee', 'Cheapest per-trade dealing (£3.99)', '40,000+ combined instruments'],
    pros: [
      'A flat monthly fee that stays the same regardless of balance — genuinely cheaper than percentage-fee platforms above roughly £17,000-20,000',
      'The cheapest per-trade dealing commission of the "full-service" platforms (£3.99)',
      'A vast combined universe of 40,000+ instruments across 500,000+ investors',
    ],
    cons: [
      'The flat fee makes small ISAs relatively expensive — Which? gave it the weakest fees score (45%) of the platforms reviewed',
      'Which? 2026 — #8 overall (64%), the lowest-ranked platform in this comparison',
    ],
    sub_scores: { fees: 6.6, universe: 9.6, ux: 8.0, support: 7.8 },
    verdict: 'The best choice for large portfolios — a flat fee that becomes expensive on smaller ones.',
    attributes: { fee_structure: 'flat_monthly', fee_note: 'Flat £4.99-11.99/month depending on tier (not a % of assets). Shown here as an effective 0.12% on a £50,000 reference portfolio — the real cost is FIXED regardless of balance, making ii cheaper than percentage-fee platforms above roughly £17,000-20,000 and more expensive below that threshold.', dealing_fee_gbp: 3.99, investment_universe_note: '40,000+ combined instruments; 3,000+ funds, 1,000+ ETFs, 37 bonds/59 gilts', fscs_protected: true, which_survey_note: 'Which? 2026 — #8 overall (64%), weakest fees score (45%) of the platforms reviewed — the flat fee structure penalises smaller ISAs specifically', trustpilot_rating: 4.5, trustpilot_count: null, trustpilot_note: 'Review count not independently confirmed at research time', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.ii.co.uk/',
    is_top_pick: false, best_for: 'Larger portfolios where a flat fee beats a percentage', display_order: 4,
    source_url: 'https://www.ii.co.uk/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'freetrade', market: 'uk', category: 'personal-finance', topic: 'investing-apps',
    display_name: 'Freetrade', tagline: 'Now a wholly owned IG Group subsidiary — with a disclosed 2022 FCA notice',
    score: 7.6, rating: 4.15, review_count: 7300, clicks: 7300, management_fee: 0, account_minimum: 0,
    badges: [],
    chips: ['Fully owned by IG Group since April 2025', 'Which? #4 overall (76%)', '⚠ 2022 FCA supervisory notice — see detail'],
    pros: [
      'Commission-free equity dealing across a growing universe, backed by IG Group\'s scale since its April 2025 acquisition',
      'Which? 2026 — #4 overall (76%), perfect 100% fees score',
    ],
    cons: [
      'Received a formal FCA Second Supervisory Notice in 2022 over misleading social-media financial promotions — predates the IG acquisition but remains disclosed regulatory history',
      'FX fees (0.39-0.99% depending on plan) are notably higher than Trading 212\'s flat 0.15%',
    ],
    sub_scores: { fees: 8.0, universe: 7.4, ux: 8.0, support: 7.0 },
    verdict: 'A backed-by-IG-Group platform with real regulatory history — disclosed, not hidden.',
    attributes: { fee_structure: 'flat_monthly', fee_note: 'Tiered Basic/Standard/Plus plans; SIPP fee removed on the Basic plan from 22 January 2026. FX fee ranges 0.39% (Plus) to 0.99% (Basic).', dealing_fee_gbp: 0, investment_universe_note: 'Growing universe under IG Group ownership; assets under administration +34% to £3.3bn in FY2025', fscs_protected: true, which_survey_note: 'Which? 2026 — #4 overall (76%), 100% fees score', trustpilot_rating: 4.15, trustpilot_count: 7300, trustpilot_note: 'Sources showed variance (4.0-4.3/5) — figure shown is a midpoint, verify live before relying on an exact number', regulatory_note: 'The FCA issued a Second Supervisory Notice against Freetrade Ltd on 8 February 2022, ordering removal of paid-for social media promotions with an influencer, citing breaches of financial-promotion rules (missing risk warnings, risk of misleading vulnerable/indebted consumers). This predates Freetrade\'s 1 April 2025 acquisition by IG Group Holdings plc (£160m enterprise value) but remains part of its disclosed regulatory history. Freetrade\'s loss before tax widened to £24.4m in its first year under IG ownership (FY2025), from £6.8m the prior year.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://freetrade.io/',
    is_top_pick: false, best_for: 'Investors wanting IG Group-backed scale', display_order: 5,
    source_url: 'https://freetrade.io/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'moneyfarm', market: 'uk', category: 'personal-finance', topic: 'investing-apps',
    display_name: 'Moneyfarm', tagline: 'One of the UK\'s largest non-bank-owned digital wealth managers',
    score: 7.4, rating: 0, review_count: 0, clicks: 0, management_fee: 0.65, account_minimum: 0,
    badges: [],
    chips: ['160,000+ active investors, £5bn+ AUM', 'Not bank/broker-owned', 'Managed ISA, no per-trade dealing'],
    pros: [
      "Reports 160,000+ active investors and £5bn+ AUM — one of the UK's largest non-bank-owned digital wealth managers",
      'Not owned by a bank or broker group, distinguishing it from Freetrade (IG-owned) or J.P. Morgan Personal Investing (bank-owned, formerly Nutmeg)',
      'Managed portfolios remove the need to pick individual investments',
    ],
    cons: [
      'Not present in the Which? 2026 investment platform survey — no independently confirmed customer-satisfaction ranking',
      'Combined custody + management fee (0.45-0.75%+ typical) is higher than the percentage-fee DIY platforms in this comparison',
    ],
    sub_scores: { fees: 6.8, universe: 7.0, ux: 8.0, support: 0 },
    verdict: 'One of the largest non-bank-owned managed platforms — no independent satisfaction ranking found.',
    attributes: { fee_structure: 'percentage', fee_note: '0.35% custody fee, capped at £45/year, plus a tiered management fee (~0.75% down to ~0.35% by portfolio size) — combined cost typically 0.45-0.75%+ on top of underlying ETF costs (~0.20% average)', dealing_fee_gbp: null, investment_universe_note: 'Managed ETF-based portfolios, not individual stock-picking', fscs_protected: true, which_survey_note: 'Not present in the Which? 2026 survey reviewed for this comparison', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable Trustpilot rating found for Moneyfarm specifically at research time — shown as not yet rated rather than an unverified figure', regulatory_note: "Moneyfarm (trading name of MFM Investment Ltd) has significant minority institutional ownership — Allianz SE holds 25-50% via its holding company, the largest single stakeholder, alongside M&G, Poste Italiane, Allianz Global Investors, Smedvig Ventures and Venrex. We describe it as \"one of the UK's largest non-bank-owned\" digital wealth managers rather than asserting it is the single largest independent platform, since no third-party ranking directly confirmed that superlative against competitors." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.moneyfarm.com/uk/',
    is_top_pick: false, best_for: 'Investors wanting a managed portfolio, not bank-owned', display_order: 6,
    source_url: 'https://www.moneyfarm.com/uk/pricing/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'hargreaves-lansdown', market: 'uk', category: 'personal-finance', topic: 'investing-apps',
    display_name: 'Hargreaves Lansdown', tagline: "The UK's largest platform — with a disputed 2026 breach claim disclosed",
    score: 7.0, rating: 4.35, review_count: 21000, clicks: 21000, management_fee: 0.35, account_minimum: 0,
    badges: [],
    chips: ["UK's largest platform (~1.9M clients)", 'ISA fee cut to 0.35% (Jan 2026)', '⚠ Disputed 2026 ransomware claim — see detail'],
    pros: [
      "The UK's largest investment platform by client count (~1.9M clients)",
      'ISA fee cut from 0.45% to 0.35% in January 2026, capped at £12.50/month',
      'The widest investment universe of the 7 candidates (~8,500 shares, 3,000 funds, 1,400 ETFs, 400 trusts)',
    ],
    cons: [
      'A ransomware group (APT73/Bashe) claimed a breach in January and again April 2026; HL disputes any breach occurred and states no evidence of a cyberattack was found',
      '£6.95 dealing fee — the highest per-trade commission in this comparison',
      'Did not appear in the Which? 2026 top-10 satisfaction table found',
    ],
    sub_scores: { fees: 6.0, universe: 9.6, ux: 7.6, support: 7.6 },
    verdict: 'The largest, widest-universe platform — weigh the disputed 2026 breach claim below.',
    attributes: { fee_structure: 'percentage', fee_note: '0.35% platform fee (cut from 0.45% in January 2026, for portfolios under £250k), capped at £12.50/month (cap reached around £43,000)', dealing_fee_gbp: 6.95, investment_universe_note: '~8,500 shares, 3,000 funds, 1,400 ETFs, 400 trusts, 200+ bonds/gilts (UK/US/Europe/Canada)', fscs_protected: true, which_survey_note: 'Did not appear in the Which? 2026 top-10 satisfaction table reviewed for this comparison', trustpilot_rating: 4.35, trustpilot_count: 21000, trustpilot_note: 'Sources cite 4.3-4.4/5', regulatory_note: 'A ransomware group calling itself APT73/Bashe claimed a breach of Hargreaves Lansdown systems in January and again April 2026 (alleging 50GB of stolen data); Hargreaves Lansdown disputes any breach occurred and states it has found no evidence of a cyberattack. We present this as a disputed, unconfirmed claim rather than a proven incident. No FCA enforcement fine was found against Hargreaves Lansdown for 2024-2026.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.hl.co.uk/',
    is_top_pick: false, best_for: "Investors wanting the UK's widest investment universe", display_order: 7,
    source_url: 'https://www.hl.co.uk/', data_verified_at: '2026-07-11', active: true,
  },
];

const businessBankAccounts = [
  {
    slug: 'starling-business', market: 'uk', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Starling Bank Business', tagline: 'A full UK banking licence with unambiguous £120,000 FSCS protection',
    score: 8.8, rating: 4.1, review_count: 45000, clicks: 45000, monthly_fee: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['£0/mo, free UK transfers', 'Full FSCS £120,000', 'Free Making Tax Digital tool'],
    pros: [
      'A full UK banking licence — deposits are unambiguously FSCS-protected up to £120,000',
      'Free GBP current account with no monthly fee and no UK transfer fees',
      'A genuinely useful free Making Tax Digital tool for sole traders (launched March 2026)',
    ],
    cons: [
      'The FCA fined Starling Bank £28,959,426 in October 2024 for financial-crime screening failures',
      'No interest paid on the main current account (savings products separately pay up to ~2.5% AER)',
    ],
    sub_scores: { fees: 9.6, protection: 10.0, integrations: 8.4, support: 7.6 },
    verdict: 'Best overall — unambiguous full FSCS protection and genuinely free banking, with a disclosed 2024 fine.',
    attributes: { fscs_status: 'full_fscs', fscs_note: 'Starling Bank Ltd holds a full UK banking licence — deposits are FSCS-protected up to £120,000, no ambiguity.', interest_rate_note: 'No interest on the main current account; separate savings products pay up to ~2.5% AER', intl_payments_note: 'EUR account £2/month; USD accounts closed to new applicants (April 2026)', accounting_integrations: ['Xero', 'QuickBooks', 'FreeAgent'], trustpilot_rating: 4.1, trustpilot_count: 45000, trustpilot_note: 'uk.trustpilot.com/review/starlingbank.com', regulatory_note: 'The FCA fined Starling Bank £28,959,426 in October 2024 for financial-crime risk-management failures — the bank opened 54,000+ accounts for approximately 49,000 high-risk customers in breach of a 2021 regulatory requirement, and its sanctions screening had checked only a fraction of the full sanctions list since 2017. Starling states the underlying issues have since been remediated.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.starlingbank.com/business-account/',
    is_top_pick: true, best_for: 'Businesses wanting unambiguous full FSCS protection', display_order: 1,
    source_url: 'https://www.starlingbank.com/legal/account/fscs-protection/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'mettle-natwest', market: 'uk', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Mettle by NatWest', tagline: 'Completely free, including free FreeAgent accounting software',
    score: 8.6, rating: 4.6, review_count: 6350, clicks: 6350, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Best value' }],
    chips: ['£0/mo, no fees', 'Free FreeAgent accounting', 'Full FSCS via NatWest'],
    pros: [
      'Completely free — no monthly fee, free UK transfers',
      'Free FreeAgent accounting software (conditional on at least 1 transaction/month) — a genuinely valuable inclusion',
      'Full FSCS £120,000 protection via National Westminster Bank plc\'s banking licence',
    ],
    cons: [
      'Balances count toward the same £120,000 FSCS limit shared across the wider NatWest Group (NatWest, RBS, Ulster Bank, NatWest Boxed, Mettle)',
      'Smallest review base of the 7, consistent with being a narrower product aimed at freelancers and small limited companies',
    ],
    sub_scores: { fees: 10.0, protection: 9.6, integrations: 8.8, support: 8.4 },
    verdict: 'The best value — genuinely free banking plus free accounting software.',
    attributes: { fscs_status: 'full_fscs', fscs_note: 'Provided by National Westminster Bank plc — full UK banking licence, FSCS-protected up to £120,000, shared with the wider NatWest Group licence (NatWest, RBS, Ulster Bank, NatWest Boxed, Mettle count as one licence for FSCS purposes).', interest_rate_note: 'No interest on the core account', intl_payments_note: 'Standard NatWest Group international payment rails', accounting_integrations: ['FreeAgent (free)', 'Xero', 'QuickBooks'], trustpilot_rating: 4.6, trustpilot_count: 6350, trustpilot_note: 'uk.trustpilot.com/review/mettle.co.uk', regulatory_note: 'No material FCA enforcement action or lawsuit specific to Mettle was found for 2024-2026 in this research pass.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.mettle.co.uk/',
    is_top_pick: false, best_for: 'Freelancers wanting free banking plus accounting', display_order: 2,
    source_url: 'https://www.mettle.co.uk/fscs-key-information/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'monzo-business', market: 'uk', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Monzo Business', tagline: 'The strongest accounting-integration breadth — with a disclosed 2025 fine',
    score: 8.2, rating: 4.6, review_count: 69500, clicks: 69500, monthly_fee: 0,
    badges: [{ type: 'sky', label: 'Best accounting integration' }],
    chips: ['Xero, QuickBooks, FreeAgent, Sage', 'Full FSCS £120,000', '⚠ July 2025 FCA fine — see detail'],
    pros: [
      'The broadest accounting-software integration of the 7 (Xero, QuickBooks, FreeAgent, Sage)',
      'Free Lite tier with a real-time accounting sync and Savings Pots',
      'Strong Trustpilot rating (4.6/5, ~69,500 reviews)',
    ],
    cons: [
      'The FCA fined Monzo Bank £21,091,300 in July 2025 for anti-money-laundering system failures spanning October 2018-August 2020',
      'Paid tiers (Pro £9/mo, Team £25/mo) required for the deepest accounting features',
    ],
    sub_scores: { fees: 9.0, protection: 9.6, integrations: 9.6, support: 8.0 },
    verdict: 'The strongest accounting integration of the 7 — weigh the disclosed 2025 AML fine.',
    attributes: { fscs_status: 'full_fscs', fscs_note: 'Monzo Bank Ltd holds a full UK banking licence — deposits are FSCS-protected up to £120,000.', interest_rate_note: 'No interest on the core Lite account; Savings Pots pay separately', intl_payments_note: 'Foreign-currency payment fees 0.5-1.30% variable + fixed fee £0.50-£2.68', accounting_integrations: ['Xero', 'QuickBooks', 'FreeAgent', 'Sage'], trustpilot_rating: 4.6, trustpilot_count: 69500, trustpilot_note: 'trustpilot.com/review/www.monzo.com', regulatory_note: 'The FCA fined Monzo Bank £21,091,300 on 8 July 2025 for anti-money-laundering systems and controls failures spanning October 2018-August 2020, including allowing accounts to be opened with implausible addresses (e.g. "Buckingham Palace") and breaching a regulatory order by opening 34,000+ high-risk accounts between August 2020 and June 2022. Monzo states the underlying issues were remediated years ago.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://monzo.com/business-banking/',
    is_top_pick: false, best_for: 'Businesses wanting the deepest accounting sync', display_order: 3,
    source_url: 'https://monzo.com/business-banking/plans-pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'barclays-business', market: 'uk', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Barclays', tagline: 'The most traditional corporate-bank feature set — with disclosed 2025 fines',
    score: 6.8, rating: 4.0, review_count: 22000, clicks: 22000, monthly_fee: 8.50,
    badges: [],
    chips: ['12 months free for new businesses', 'SWIFT gpi payment tracking', '⚠ £42M combined 2025 FCA fines — see detail'],
    pros: [
      'The most traditional corporate-bank feature set of the 7 — SWIFT gpi payment tracking, 120+ currencies, 200+ countries',
      'Free for the first 12 months for new-to-Barclays businesses; branch access for businesses that need it',
      'Bespoke ERP/TMS reporting for larger businesses',
    ],
    cons: [
      'The FCA fined Barclays a combined £42 million in 2025 across two separate financial-crime risk-management cases',
      'International transfers use Barclays\' own FX rate, not the mid-market rate, and cost from £4',
    ],
    sub_scores: { fees: 6.6, protection: 9.6, integrations: 7.0, support: 7.6 },
    verdict: 'The most traditional, branch-backed option — weigh the disclosed 2025 combined fines.',
    attributes: { fscs_status: 'full_fscs', fscs_note: 'Barclays Bank UK plc holds a full UK banking licence — deposits are FSCS-protected up to £120,000.', interest_rate_note: 'Standard business current account rates apply — not a headline-rate product', intl_payments_note: '120+ currencies, 200+ countries reach via SWIFT gpi tracking; transfers from £4 at Barclays\' own FX rate (not mid-market)', accounting_integrations: ['Xero', 'QuickBooks', 'FreeAgent (discounted, not free)'], trustpilot_rating: 4.0, trustpilot_count: 22000, trustpilot_note: 'Fragmented across multiple Barclays subdomains on Trustpilot — treat as directional only', regulatory_note: 'The FCA fined Barclays a combined £42 million in 2025 across two separate financial-crime risk-management cases: £3.09m (after settlement discount) relating to Barclays Bank UK plc\'s onboarding of collapsed wealth manager WealthTek, and £39.3m relating to Barclays Bank plc\'s oversight of a precious-metals firm (Stunt & Co) that received £46.8m from a known money-laundering network before Barclays acted.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.barclays.co.uk/business-banking/',
    is_top_pick: false, best_for: 'Businesses needing branch access or complex treasury needs', display_order: 4,
    source_url: 'https://www.barclays.co.uk/business-banking/accounts/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'wise-business', market: 'uk', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Wise Business', tagline: 'The strongest international/multi-currency proposition — safeguarded, not FSCS',
    score: 7.4, rating: 4.3, review_count: 294000, clicks: 294000, monthly_fee: 0,
    badges: [],
    chips: ['Multi-currency (8+ local currency details)', 'FX from 0.33-0.37%', '⚠ Safeguarded, not FSCS — see detail'],
    pros: [
      'The strongest pure international/multi-currency proposition of the 7 — local account details in 8+ currencies',
      'FX from 0.33-0.37% at the mid-market rate, transparently disclosed',
      'No monthly fee on the Essential plan',
    ],
    cons: [
      'An e-money institution, not a bank — funds are safeguarded, NOT FSCS-protected, a real and lower-assurance distinction',
      'Advanced features (Direct Debits, receiving) require a one-off £50 fee',
    ],
    sub_scores: { fees: 8.8, protection: 5.0, integrations: 7.6, support: 7.8 },
    verdict: 'The best international-payments proposition — understand the safeguarding-not-FSCS distinction first.',
    attributes: { fscs_status: 'safeguarded', fscs_note: 'Wise Payments Ltd is an e-money institution, not a bank — funds are held under statutory safeguarding (segregated accounts, government bonds/cash) under the Electronic Money Regulations, NOT FSCS-protected. Wise is explicit about this itself.', interest_rate_note: 'A separate "interest" product is available on GBP/USD/EUR balances — rate varies, check wise.com/gb/interest for the current figure', intl_payments_note: 'Local account details in 8+ currencies; FX from 0.33-0.37% at the mid-market rate — the strongest pure-FX proposition of the 7', accounting_integrations: ['Xero', 'QuickBooks'], trustpilot_rating: 4.3, trustpilot_count: 294000, trustpilot_note: 'Platform-wide figure (not business-account-specific)', regulatory_note: 'No major FCA enforcement action was found for 2024-2026. General criticism in third-party reviews centres on account freezes/verification delays common to e-money providers, not a specific regulatory finding.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://wise.com/gb/business/',
    is_top_pick: false, best_for: 'Internationally-trading businesses prioritizing FX cost', display_order: 5,
    source_url: 'https://wise.com/help/articles/4IusAofIppsIGPcs7sEIXI/how-our-uk-entity-wise-payments-ltd-safeguards-customer-funds', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'tide-business', market: 'uk', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Tide', tagline: 'Built-in invoicing and business savings — protection depends on which rail your funds sit on',
    score: 7.0, rating: 4.35, review_count: 30000, clicks: 30000, monthly_fee: 0,
    badges: [],
    chips: ['Built-in invoicing + savings', '30,000+ Trustpilot reviews', '⚠ Split FSCS/safeguarding rails — see detail'],
    pros: [
      'Built-in invoicing, expense cards, accounting integrations and business savings in the free tier',
      'Strong Trustpilot rating (4.3-4.4/5, 30,000+ reviews)',
    ],
    cons: [
      "Protection depends on which rail your funds sit on — newer accounts on ClearBank rails get FSCS £120,000, legacy accounts (PrePay Technologies-issued) remain safeguarded-only — a genuinely confusing split for customers",
      'Documented cases of accounts frozen without warning, with recurring Financial Ombudsman-level complaints about chargeback handling and support responsiveness',
    ],
    sub_scores: { fees: 8.2, protection: 6.0, integrations: 8.0, support: 6.6 },
    verdict: 'Feature-rich free banking — check which rail your account sits on for its real protection status.',
    attributes: { fscs_status: 'transitional', fscs_note: 'Tide Platform Ltd is fundamentally an e-money institution (FCA-authorised under the Electronic Money Regulations 2011) — not FSCS-protected by default. However, newer accounts are moved onto ClearBank (a licensed bank) rails, giving FSCS protection up to £120,000 for those specific deposits, while legacy PrePay Technologies-issued accounts remain safeguarded-only. Protection genuinely depends on which rail a given customer\'s funds currently sit on — check in-app rather than assuming either status.', interest_rate_note: 'Interest available on business savings products; no interest on the core current account', intl_payments_note: '2.75% card FX fee on the free plan', accounting_integrations: ['Xero', 'QuickBooks', 'FreeAgent'], trustpilot_rating: 4.35, trustpilot_count: 30000, trustpilot_note: 'trustpilot.com/review/tide.co', regulatory_note: 'Documented cases of accounts frozen without warning, causing operational disruption for customers, with recurring complaints about chargeback handling and support responsiveness reaching the Financial Ombudsman Service. Separately, an unrelated clone-firm scam ("Tide Finance"/"Tide Capital Markets") has been FCA-flagged — not the real Tide.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.tide.co/',
    is_top_pick: false, best_for: 'Businesses wanting built-in invoicing and savings tools', display_order: 6,
    source_url: 'https://www.tide.co/safety-security/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'revolut-business', market: 'uk', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Revolut Business', tagline: 'A new UK bank licence — with real disclosed fraud-complaint and EU-arm issues',
    score: 6.2, rating: 4.7, review_count: 400000, clicks: 400000, monthly_fee: 10,
    badges: [],
    chips: ['New UK banking licence (March 2026)', '25+ currencies at interbank FX', '⚠ Worst-for-fraud-complaints (Which?) — see detail'],
    pros: [
      'Received a full UK banking licence in March 2026 — new/migrated accounts now qualify for FSCS £120,000 protection',
      '25+ currencies with FX at interbank rates within plan allowances',
    ],
    cons: [
      'Migration is phased — accounts opened before March 2026 may still sit with the legacy e-money entity and remain safeguarded-only, not FSCS-covered, until actively migrated',
      'Which? named Revolut the UK\'s worst firm for fraud/scam complaints escalated to the Financial Ombudsman for two consecutive years (2024, 2025); its EU arm had business activities restricted by the ECB in July 2025',
    ],
    sub_scores: { fees: 7.0, protection: 5.6, integrations: 7.4, support: 5.4 },
    verdict: 'A newly-banked platform with real, current fraud-complaint and transitional-protection issues to weigh.',
    attributes: { fscs_status: 'transitional', fscs_note: 'Revolut Bank UK Ltd received a full UK banking licence on 11 March 2026 (PRA mobilisation restrictions lifted). New/migrated accounts are FSCS-protected up to £120,000. Accounts opened before 11 March 2026 may still sit with the legacy e-money entity (Revolut Ltd) and remain under safeguarding, not FSCS, until Revolut actively migrates them (with at least 2 months\' customer notice). Check your specific account\'s current status in-app rather than assuming full protection.', interest_rate_note: 'Varies by plan tier', intl_payments_note: '25+ currencies, FX at interbank rates within plan allowances', accounting_integrations: ['Xero', 'QuickBooks'], trustpilot_rating: 4.7, trustpilot_count: 400000, trustpilot_note: 'Platform-wide figure, notably high — weigh against the disclosed fraud-complaint data below', regulatory_note: "Which? named Revolut the UK's worst firm for fraud/scam complaints escalated to the Financial Ombudsman Service for two consecutive years (2024 and 2025); BBC Panorama (2024) separately flagged Revolut as a leading target for fraud among digital banks. In July 2025 the European Central Bank restricted business activities at Revolut's EU (Lithuania-licensed) arm pending an independent risk review — this concerns the EU entity, not directly the new UK bank, but is disclosed given the shared brand." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.revolut.com/business/',
    is_top_pick: false, best_for: 'Businesses that confirmed current FSCS status', display_order: 7,
    source_url: 'https://www.revolut.com/blog/post/is-revolut-a-fully-licensed-bank-in-the-uk/', data_verified_at: '2026-07-11', active: true,
  },
];

const savingsAccounts = [
  {
    slug: 'atom-bank', market: 'uk', category: 'savings', topic: 'savings-accounts',
    display_name: 'Atom Bank', tagline: 'The strongest independently corroborated customer rating researched',
    score: 9.0, rating: 4.9, review_count: 18000, clicks: 18000, monthly_fee: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Trustpilot 4.8-5.0/5', 'Reward tier up to 4.85% AER', 'Cash ISA at 4.25% AER'],
    pros: [
      'The strongest independently corroborated customer rating of the 7 (Trustpilot 4.8-5.0/5, ~15,800-20,500+ reviews)',
      'A competitive Reward-tier rate (up to 4.75-4.85% AER) for customers who skip withdrawals in a given month',
      'A genuinely competitive Easy Access Cash ISA (4.25% AER variable)',
    ],
    cons: [
      'The Reward tier rate drops to the 2.50% base rate the moment any withdrawal is made in a month',
      'Easy-access balance is capped at £100,000 combined',
    ],
    sub_scores: { rate: 9.0, protection: 10.0, flexibility: 7.8, support: 9.8 },
    verdict: 'The best-reviewed, most trusted savings bank in this comparison.',
    attributes: { max_rate_pct: 4.85, base_rate_pct: 2.50, rate_type: 'conditional', rate_conditions: 'Instant Saver Reward tier pays up to 4.75-4.85% AER only in months with no withdrawal; any withdrawal drops that month\'s rate to the 2.50% base', cash_isa_available: true, cash_isa_note: 'Easy Access Cash ISA at 4.25% AER variable', min_deposit: 1, fscs_full: true, trustpilot_rating: 4.9, trustpilot_count: 18000, trustpilot_note: 'Sources cite 4.8-5.0/5, 15,800-20,500+ reviews', regulatory_note: 'No material FCA enforcement action found for 2024-2026. An FCA clone-scam warning exists for an unrelated entity ("Immediate Atom") impersonating the brand — not a real Atom Bank issue.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.atombank.co.uk/savings/',
    is_top_pick: true, best_for: 'Savers wanting the most trusted, best-reviewed bank', display_order: 1,
    source_url: 'https://www.atombank.co.uk/savings/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'charter-savings-bank', market: 'uk', category: 'savings', topic: 'savings-accounts',
    display_name: 'Charter Savings Bank', tagline: 'The best unconditional easy-access rate — no conditions attached',
    score: 8.7, rating: 4.25, review_count: 4000, clicks: 4000, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Best unconditional rate' }],
    chips: ['4.21% AER, no conditions', 'Same-day access', 'Fixed Cash ISAs up to 4.46% AER'],
    pros: [
      'The best unconditional easy-access rate of the 7 (4.21% AER, no bonus conditions to meet)',
      'Same-day access if requested before 9pm — no notice required on the easy-access product',
      'A range of Fixed Cash ISAs (1/2/3-year) all paying 4.46% AER',
    ],
    cons: [
      'Smaller review base than several peers (~3,900-4,200 Trustpilot reviews)',
      'Award claims found in some sources ("Which? Recommended", "Moneynet Provider of the Year") could not be independently confirmed against a canonical source — not asserted as fact here',
    ],
    sub_scores: { rate: 9.4, protection: 10.0, flexibility: 9.0, support: 7.6 },
    verdict: 'The strongest genuinely unconditional easy-access rate in this comparison.',
    attributes: { max_rate_pct: 4.46, base_rate_pct: 4.21, rate_type: 'fixed_term', rate_conditions: '4.46% AER applies to 1/2/3-year Fixed Cash ISAs (funds locked for the term); the unconditional Easy Access rate (4.21% AER) requires no conditions at all and is the strongest such rate in this comparison', cash_isa_available: true, cash_isa_note: '1/2/3-year Fixed Cash ISAs at 4.46% AER; Easy Access Cash ISA at 4.21% AER', min_deposit: 1000, fscs_full: true, trustpilot_rating: 4.25, trustpilot_count: 4000, trustpilot_note: '"Great" rating, sources cite 4.2-4.3/5, ~3,900-4,200 reviews', regulatory_note: 'No FCA enforcement action found. Some sources reference a "Which? Recommended Provider for Savings 2025" and "Moneynet Cash ISA Provider of the Year 2026" award, but neither could be independently confirmed against a canonical which.co.uk or Moneynet source at research time — these are not asserted as fact on this page pending direct verification.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.chartersavingsbank.co.uk/',
    is_top_pick: false, best_for: 'Savers wanting the best rate with zero conditions', display_order: 2,
    source_url: 'https://www.chartersavingsbank.co.uk/ataglance', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'shawbrook-bank', market: 'uk', category: 'savings', topic: 'savings-accounts',
    display_name: 'Shawbrook Bank', tagline: 'A long-running UK best-buy fixture since 2017',
    score: 8.3, rating: 4.65, review_count: 15000, clicks: 15000, monthly_fee: 0,
    badges: [{ type: 'sky', label: 'Best long-running fixed-rate option' }],
    chips: ['Best-buy fixture since 2017', 'Bonus Easy Access 4.13% AER', 'Next-working-day access'],
    pros: [
      'A long-running fixture of UK savings best-buy tables since 2017',
      'Strong Trustpilot rating (4.6-4.7/5, "Excellent")',
      'A competitive Bonus Easy Access rate (4.13% AER, including a 12-month fixed bonus) with next-working-day access, no limits',
    ],
    cons: [
      'A legacy 2021 timeshare mis-selling case (unsecured loans tied to Club La Costa/Diamond Resorts) — the Financial Ombudsman ruled for affected customers, upheld on High Court judicial review in 2023',
      'Standard Easy Access base rate (2.70% AER) is meaningfully lower than the Bonus tier',
    ],
    sub_scores: { rate: 8.6, protection: 10.0, flexibility: 8.6, support: 8.6 },
    verdict: 'A consistently well-reviewed, long-running best-buy fixture — with disclosed legacy litigation.',
    attributes: { max_rate_pct: 4.30, base_rate_pct: 2.70, rate_type: 'fixed_term', rate_conditions: '4.30% AER on the 1-year Fixed Cash ISA (funds locked for the term); a separate Bonus Easy Access account pays 4.13% AER (includes a fixed 12-month bonus), while the standard unconditional Easy Access rate is 2.70% AER', cash_isa_available: true, cash_isa_note: 'Easy Access Cash ISA at 4.00% AER; 1-year Fixed Cash ISA at 4.30% AER', min_deposit: 1000, fscs_full: true, trustpilot_rating: 4.65, trustpilot_count: 15000, trustpilot_note: 'Sources cite 4.6-4.7/5, 10,000-21,000 reviews depending on source', regulatory_note: 'A legacy timeshare mis-selling case (unsecured loans connected to Club La Costa/Diamond Resorts) saw the Financial Ombudsman rule in favour of affected customers in 2021, upheld on High Court judicial review in 2023. This predates the 2024-2026 research window, but related claims are reportedly still being processed — disclosed for transparency. Separately, Shawbrook Group plc completed an LSE main-market IPO on 4 November 2025 (~£2bn valuation), and as of May 2026 was reportedly weighing a merger involving Aldermore — corporate context, not a compliance matter.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.shawbrook.co.uk/savings/',
    is_top_pick: false, best_for: 'Savers wanting a consistently well-reviewed bank', display_order: 3,
    source_url: 'https://www.shawbrook.co.uk/savings/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'zopa-bank', market: 'uk', category: 'savings', topic: 'savings-accounts',
    display_name: 'Zopa Bank', tagline: 'A well-known challenger bank with a competitive Cash ISA',
    score: 7.8, rating: 4.2, review_count: 29000, clicks: 29000, monthly_fee: 0,
    badges: [],
    chips: ['Standalone UK bank since 2020', 'Cash ISA at 3.25% AER', 'Biscuit-boosted rate up to 4.75%'],
    pros: [
      'A standalone, full UK banking licence since 2020',
      'A competitive Cash ISA (Access ISA at 3.25% AER)',
      'A boosted rate (up to 4.75% AER) for customers holding an active Zopa "Biscuit" current account',
    ],
    cons: [
      'Base easy-access rate (2.95% AER) is unremarkable without the Biscuit boost',
      'Combined balance across pots is capped at £250,000',
    ],
    sub_scores: { rate: 8.0, protection: 10.0, flexibility: 8.4, support: 7.4 },
    verdict: 'A solid, well-known challenger bank — the Biscuit-boosted rate is the real draw.',
    attributes: { max_rate_pct: 4.75, base_rate_pct: 2.95, rate_type: 'conditional', rate_conditions: 'Up to 4.75% AER requires holding an active Zopa "Biscuit" current account for 12 months; the unconditional Access pot rate is 2.95% AER', cash_isa_available: true, cash_isa_note: 'Access ISA at 3.25% AER variable', min_deposit: 1, fscs_full: true, trustpilot_rating: 4.2, trustpilot_count: 29000, trustpilot_note: 'Sources showed variance (4.0-4.5/5, 22,000-36,000+ reviews) — "Excellent" band, verify live before relying on an exact figure', regulatory_note: 'Zopa has publicly pushed back on the FCA\'s motor-finance redress scheme design, setting aside £7.9m in provisions and describing the retrospective approach as "penalising" (January 2026) — a genuine, disclosed regulatory friction point concerning its motor-finance business specifically, not the savings products on this page.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.zopa.com/savings',
    is_top_pick: false, best_for: 'Existing Zopa/Biscuit customers wanting a boosted rate', display_order: 4,
    source_url: 'https://www.zopa.com/savings', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'marcus-goldman-sachs', market: 'uk', category: 'savings', topic: 'savings-accounts',
    display_name: 'Marcus by Goldman Sachs', tagline: 'A competitive MSE-listed fixed rate — with a weak UK Trustpilot score disclosed',
    score: 6.8, rating: 2.9, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['MSE top pick: 4.9% AER (1-yr fixed)', '~1M UK savers', '⚠ Weak UK Trustpilot (2.9/5) — see detail'],
    pros: [
      "MoneySavingExpert's current top pick for a 1-year fixed-rate bond (4.9% AER)",
      "Backed by Goldman Sachs' scale, with approximately 1 million UK savers",
      'Offers a Cash ISA alongside its easy-access and fixed products',
    ],
    cons: [
      'A genuinely weak UK-specific Trustpilot score (2.9/5), with 2025 complaints describing sudden account closures',
      'Easy-access rate (3.75% AER) is unremarkable without locking into the fixed-term product',
    ],
    sub_scores: { rate: 8.4, protection: 10.0, flexibility: 6.4, support: 3.4 },
    verdict: 'A competitive fixed rate from a major name — the disclosed UK service complaints are real, weigh them.',
    attributes: { max_rate_pct: 4.90, base_rate_pct: 3.75, rate_type: 'fixed_term', rate_conditions: '4.90% AER on the 1-year fixed-rate bond (funds locked for the term, MoneySavingExpert\'s current top pick in that category); the unconditional Online Savings Account pays 3.75% AER variable (includes a 0.49% 12-month bonus)', cash_isa_available: true, cash_isa_note: 'Cash ISA offered — current AER not independently confirmed at research time, verify on-site', min_deposit: 1, fscs_full: true, trustpilot_rating: 2.9, trustpilot_count: null, trustpilot_note: 'uk.trustpilot.com/review/www.marcus.co.uk — notably weak for a major bank', regulatory_note: 'Multiple 2025 Trustpilot/Resolver complaints describe sudden account closures without notice and frozen funds. An FCA clone-scam warning exists for firms impersonating Marcus — not a real Marcus issue. Parent entity Goldman Sachs International was previously fined £34.3m by the FCA for transaction-reporting failures relating to its wholesale business — not confirmed as connected to the retail Marcus savings product, disclosed as parent-company context only.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.marcus.co.uk/uk/en/savings',
    is_top_pick: false, best_for: 'Savers wanting a competitive fixed rate from a major name', display_order: 5,
    source_url: 'https://www.marcus.co.uk/uk/en/savings', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'paragon-bank', market: 'uk', category: 'savings', topic: 'savings-accounts',
    display_name: 'Paragon Bank', tagline: 'A FTSE 250-listed bank — but a genuinely low headline easy-access rate',
    score: 6.4, rating: 4.7, review_count: 10500, clicks: 10500, monthly_fee: 0,
    badges: [],
    chips: ['FTSE 250-listed (Paragon Banking Group)', 'Shares licence with "Spring" brand', 'Easy-access rate only 1.50% AER'],
    pros: [
      'A FTSE 250-listed group with a strong Trustpilot rating (4.7/5)',
      'A wide range of Cash ISA products (1-year Fixed 4.00% AER, 14-month Fixed 4.30% AER)',
      'A 120-Day Notice account paying 3.75% AER for savers who can plan ahead',
    ],
    cons: [
      'The standard Easy Access rate (1.50% AER) is genuinely low, the weakest headline easy-access rate of the 7',
      'Shares its banking licence with its "Spring" savings brand — combined balances across both count toward the same £120,000 FSCS cap',
    ],
    sub_scores: { rate: 6.0, protection: 9.6, flexibility: 6.4, support: 8.4 },
    verdict: 'Strong fixed and ISA products — but the headline easy-access rate is genuinely uncompetitive.',
    attributes: { max_rate_pct: 4.25, base_rate_pct: 1.50, rate_type: 'fixed_term', rate_conditions: '4.25% AER on the 1-year fixed-rate bond (funds locked for the term); the standard unconditional Easy Access rate is only 1.50% AER — a Triple Access account reaches up to 3.20% AER but limits withdrawals to 3/year before the rate is cut, and a 120-Day Notice account pays 3.75% AER', cash_isa_available: true, cash_isa_note: '1-year Fixed Cash ISA at 4.00% AER; 14-month Fixed Cash ISA at 4.30% AER; Easy Access Cash ISA only 1.50% AER', min_deposit: 500, fscs_full: true, fscs_shared_licence_note: 'Paragon Bank shares its banking licence with its "Spring" savings brand — a customer\'s combined balance across both counts toward the same £120,000 FSCS limit', trustpilot_rating: 4.7, trustpilot_count: 10500, trustpilot_note: 'Sources cite 4.7/5, ~10,000-11,500 reviews', regulatory_note: 'Parent Paragon Banking Group has disclosed exposure to the industry-wide FCA motor-finance redress scheme (sector-wide estimated £9-12bn), which lenders were reportedly considering legally challenging as of March 2026 — this is sector/group-level exposure, not confirmed misconduct specific to Paragon\'s savings business.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.paragonbank.co.uk/savings',
    is_top_pick: false, best_for: 'Savers wanting fixed-term/ISA products, not easy access', display_order: 6,
    source_url: 'https://www.paragonbank.co.uk/savings', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'chase-uk', market: 'uk', category: 'savings', topic: 'savings-accounts',
    display_name: 'Chase UK', tagline: 'A well-known name — but no Cash ISA offered',
    score: 6.0, rating: 4.1, review_count: 15000, clicks: 15000, monthly_fee: 0,
    badges: [],
    chips: ['Boosted Saver 4.5% AER (12mo, new customers)', 'Backed by J.P. Morgan', '⚠ No Cash ISA offered'],
    pros: [
      'A competitive Boosted Saver rate (4.5% AER) for new customers in their first 12 months',
      'Backed by J.P. Morgan Europe Ltd — a large, well-capitalized institution',
    ],
    cons: [
      'Does not currently offer a Cash ISA — a genuine gap for tax-free-savings-focused savers',
      'The Boosted Saver rate reverts to the Standard Saver rate (2.25% AER) after 12 months',
      'Only easy-access/round-up savings — no 1-year fixed-rate bond product',
    ],
    sub_scores: { rate: 6.6, protection: 10.0, flexibility: 8.8, support: 5.6 },
    verdict: 'A competitive introductory rate — but no Cash ISA, a real limitation for many UK savers.',
    attributes: { max_rate_pct: 4.50, base_rate_pct: 2.25, rate_type: 'intro', rate_conditions: '4.50% AER on the Boosted Saver applies for 12 months to new customers only (tracks BoE base rate minus 1.50%, updated ~5 business days after MPC changes), reverting to the 2.25% AER Standard Saver rate afterward', cash_isa_available: false, cash_isa_note: 'Not offered as of July 2026', min_deposit: 1, fscs_full: true, trustpilot_rating: 4.1, trustpilot_count: 15000, trustpilot_note: 'Sources disagree significantly (3.5-4.7/5) — treat as mixed, verify the live score before relying on a specific figure', regulatory_note: 'No FCA enforcement action found for 2024-2026 beyond a clone-firm scam warning (fraud impersonating Chase, not an issue with Chase itself).' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.chase.co.uk/',
    is_top_pick: false, best_for: 'New customers wanting a 12-month boosted rate', display_order: 7,
    source_url: 'https://www.chase.co.uk/gb/en/product/chase-saver-account', data_verified_at: '2026-07-11', active: true,
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

await upsert(investingApps, 'personal-finance/investing-apps (uk)');
await upsert(businessBankAccounts, 'business-banking/business-bank-accounts (uk)');
await upsert(savingsAccounts, 'savings/savings-accounts (uk)');

const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/product_attributes?select=category,topic&market=eq.uk&active=eq.true&topic=in.(investing-apps,business-bank-accounts,savings-accounts)`,
  { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } },
);
const countRows = await countRes.json();
const counts = {};
for (const r of countRows) {
  const key = `${r.category}/${r.topic}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log('\nActive row counts:', counts);
console.log('\nNext: npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk personal-finance investing-apps');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk business-banking business-bank-accounts');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk savings savings-accounts');
