#!/usr/bin/env node
// AU/CA/UK rollout Slice UK-3 (ai-tools/ai-tools-finance,
// cost-of-living/money-saving-tools, cybersecurity/cybersecurity-smb) —
// final UK slice, completes UK (9/9 topics) and the entire 26-topic
// AU/CA/UK rollout. Applies seed rows via the PostgREST API (upsert on the
// product_attributes unique constraint), same working pattern as every
// prior apply-*-rest.mjs script in this rollout (exec_sql RPC and direct
// Postgres connection are both unreachable from this environment).
// Row data mirrors supabase/migrations/20260711230000-20260711230200 exactly
// — those .sql files remain the source-of-truth audit trail; this script is
// the actual write path used to seed prod.
// Usage: node --env-file=.env.local scripts/apply-uk-slice3-rest.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

const aiTools = [
  {
    slug: 'emma', market: 'uk', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Emma', tagline: 'AI subscription detection with a clean regulatory record',
    score: 8.9, rating: 4.3, review_count: 8800, clicks: 8800, monthly_fee: 4.99,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['AI subscription/duplicate-payment detection', 'FCA-registered AISP', 'Free tier available'],
    pros: [
      'Genuinely useful AI subscription and duplicate-payment detection across 50+ linked accounts',
      'FCA-registered as an Account Information Service Provider under Open Banking',
      'Free core tier with paid Plus/Pro/Ultimate tiers for deeper features',
    ],
    cons: [
      'Recurring complaints about unexpected charges after free-trial periods and difficulty cancelling paid subscriptions',
      'Emma holds two separate FCA FRNs (AISP registration and a separate investment/consumer-credit permission) — confirm current mapping directly on the FCA Register before relying on either number',
    ],
    sub_scores: { fees: 8.4, features: 9.2, ux: 8.8, support: 7.4 },
    verdict: 'The most broadly useful AI budgeting app researched, with a clean regulatory record.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Free core tier. Paid: Plus £4.99/month, Pro £9.99/month, Ultimate £14.99/month (7-day free trial, ~30% off if paid annually).', target_segment: 'budgeting', ai_features_note: 'Automated subscription/recurring-payment detection ("Who Charged Me" lookup engine), transaction categorisation, and an AI investing feature (in-app ETF access) added in 2026.', free_tier_or_trial: true, review_score: 4.3, review_count: 8800, review_source: 'Google Play', review_note: 'Trustpilot figures conflict between sources (3.5-4.1/5) — treat as unverified/volatile pending a fresh pull.', regulatory_note: 'Emma Technologies Ltd holds two separate FCA registrations: FRN 794952 for its AISP (Open Banking) registration under the Payment Services Regulations 2017, and a separate FRN, 1042167, covering investment services and consumer-credit broking permissions. Verify the current FRN-to-permission mapping directly on the FCA Register before relying on either number for a specific claim.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://emma-app.com/',
    is_top_pick: true, best_for: 'Most UK users wanting broad AI budgeting help', display_order: 1,
    source_url: 'https://help.emma-app.com/en/article/how-much-does-emma-plusproultimate-cost-1ywhulq/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'plum', market: 'uk', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Plum', tagline: 'Automated saving & investing — FSCS-protected, no disclosed issues',
    score: 8.7, rating: 4.4, review_count: 4200, clicks: 4200, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Best for automated saving & investing' }],
    chips: ['AI-driven automated saving', 'FSCS-protected investments (£85K)', 'No disclosed regulatory issues'],
    pros: [
      'The "Plum brain" AI analyses income/spending patterns to automatically move small, affordable amounts into savings and investments',
      'Investments held via GIA/Stocks & Shares ISA/SIPP are FSCS-protected up to £85,000',
      'No confirmed regulatory issues found for 2024-2026',
    ],
    cons: [
      'Exact current paid-tier pricing was not independently confirmed at research time — verify on withplum.com/pricing',
      'FSCS protection covers firm insolvency, not market losses on investments',
    ],
    sub_scores: { fees: 8.6, features: 8.8, ux: 8.6, support: 8.2 },
    verdict: 'The cleanest regulatory record of the 7, with genuine FSCS-protected automated investing.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Free tier exists; paid subscription tiers (Plus/Pro) confirmed to exist but exact current 2026 pricing was not independently confirmed in this research pass — verify directly on withplum.com/pricing.', target_segment: 'budgeting', ai_features_note: 'Algorithmic automated saving that analyses income/spending patterns and moves small, affordable amounts into savings/investments; automated investment portfolio rebalancing.', free_tier_or_trial: true, review_score: 4.4, review_count: 4200, review_source: 'Trustpilot', review_note: 'App Store 4.7/5, Google Play 4.6/5 also cited.', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://withplum.com/',
    is_top_pick: false, best_for: 'Savers wanting automated, FSCS-protected investing', display_order: 2,
    source_url: 'https://withplum.com/legal/money-protections', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'anna-money', market: 'uk', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'ANNA Money', tagline: 'AI receipt scanning + live HMRC tax estimate for sole traders',
    score: 8.4, rating: 4.4, review_count: 4000, clicks: 4000, monthly_fee: 14.90,
    badges: [{ type: 'sky', label: 'Best for sole traders' }],
    chips: ['AI receipt-to-transaction matching', 'Live HMRC tax-liability estimate', 'HMRC-recognised for Making Tax Digital'],
    pros: [
      'AI receipt-to-transaction matching, automatic tax categorisation and a live running HMRC tax-liability estimate',
      'Officially recognised by HMRC for Making Tax Digital (MTD)',
      '100,000+ UK business customers, with a free PAYG tier available',
    ],
    cons: [
      'Funds are e-money safeguarded via PayrNet (not FSCS-protected) — a materially different, lower-assurance protection than the FSCS-backed apps on this page',
      'Recurring 2024-2026 reviews describe account freezes/suspensions tied to fraud/AML checks with limited communication during investigation',
    ],
    sub_scores: { fees: 8.0, features: 8.8, ux: 8.4, support: 7.6 },
    verdict: 'The best AI tax-automation tool for sole traders — understand the safeguarding-not-FSCS distinction.',
    attributes: { pricing_model: 'bundle_tier', starting_price_note: 'PAYG: £0/month (20 free transfers, then 20p each). ANNA Business: ~£14.90/month (50 free transfers). ANNA Big Business: ~£49.90/month (unlimited transfers). AI tax automation (Auto Accountant) tier around £24+VAT/month.', target_segment: 'tax_compliance', ai_features_note: 'AI receipt-to-transaction matching, automatic tax categorisation, a live running HMRC tax-liability estimate, and a "Smart Tax Pot" that auto-sets aside funds for tax.', free_tier_or_trial: true, review_score: 4.4, review_count: 4000, review_source: 'Trustpilot', review_note: '"Excellent" rating, 83% five-star / 11% one-star split.', regulatory_note: "ANNA's funds are e-money safeguarded (not FSCS-protected) via PayrNet Limited, an FCA-authorised EMI — a materially different, lower-assurance protection than the FSCS-backed apps on this page. In June 2020, ANNA suspended all cards when its then-payment processor Wirecard UK was frozen by the FCA — a historical, resolved third-party-risk incident. Recurring 2024-2026 reviews describe account freezes/suspensions tied to fraud/AML checks with limited communication during investigation — a pattern common to EMI-based business accounts generally, not unique to ANNA." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://anna.money/',
    is_top_pick: false, best_for: 'Sole traders wanting AI-assisted tax compliance', display_order: 3,
    source_url: 'https://anna.money/help/articles/6811441-how-anna-protects-your-money/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'moneybox', market: 'uk', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Moneybox', tagline: 'Round-up investing — the weakest AI positioning of the 7',
    score: 7.4, rating: 4.0, review_count: 4778, clicks: 4778, monthly_fee: 1,
    badges: [],
    chips: ['1M+ UK customers', 'Round-up investing + savings-goal suggestions', 'Weaker AI positioning than peers'],
    pros: [
      'A well-established UK brand (over 1 million customers) combining round-up investing with algorithmic savings-goal suggestions',
      'No confirmed regulatory issues found for 2024-2026',
      'Subscription fee waived above £5,000 in cash savings, free for the first 3 months',
    ],
    cons: [
      'Its AI positioning is thinner than Emma, Plum or Cleo — round-up investing with basic algorithmic suggestions, not a headline AI feature',
      '£1/month subscription plus a 0.45% annual platform fee on investments',
    ],
    sub_scores: { fees: 8.0, features: 6.6, ux: 8.0, support: 7.4 },
    verdict: 'A well-established, reliable round-up investing app — disclosed as having the weakest AI claim of the 7.',
    attributes: { pricing_model: 'flat_subscription', starting_price_note: '£1/month app subscription plus a 0.45% annual platform fee on investments; subscription free for the first 3 months and waived above £5,000 in cash savings.', target_segment: 'budgeting', ai_features_note: 'Round-up (spare-change) investing with algorithmic savings-goal suggestions — a less AI-branded feature set than Emma, Plum or Cleo, disclosed rather than inflated.', free_tier_or_trial: true, review_score: 4.0, review_count: 4778, review_source: 'Trustpilot', review_note: '', regulatory_note: 'No confirmed 2024-2026 breach or FCA fine found; individual Financial Ombudsman complaints exist but are routine customer disputes, not systemic incidents.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.moneyboxapp.com/',
    is_top_pick: false, best_for: 'Beginners wanting simple round-up investing', display_order: 4,
    source_url: 'https://www.moneyboxapp.com/fees-and-charges', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'microsoft-copilot-finance', market: 'uk', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Microsoft Copilot for Finance', tagline: 'Excel reconciliation agents for enterprise finance teams',
    score: 7.2, rating: 0, review_count: 0, clicks: 0, monthly_fee: 24.70,
    badges: [],
    chips: ['Financial Reconciliation agent in Excel', 'From £24.70/user/month (base licence)', 'Enterprise / B2B tool'],
    pros: [
      'The Financial Reconciliation agent in Excel matches datasets and auto-suggests reconciliation rules in assistive or autonomous mode',
      'Backed by Microsoft\'s enterprise scale and integration with the existing Microsoft 365 ecosystem',
    ],
    cons: [
      "The £24.70/user/month figure is the entry price for the base Copilot licence that includes Finance agents, not a standalone \"Copilot for Finance\" product price — realistic all-in cost for UK SMEs is closer to £35-55/user/month once governance and rollout costs are included",
      'No dedicated G2/Capterra review listing exists specifically for the Finance agents',
    ],
    sub_scores: { fees: 6.4, features: 8.4, ux: 7.6, support: 7.0 },
    verdict: 'A genuinely capable enterprise tool for finance teams already on Microsoft 365 — understand the real all-in cost.',
    attributes: { pricing_model: 'bundle_tier', starting_price_note: '£24.70/user/month (ex-VAT, annual commitment) is the list price for the base Microsoft 365 Copilot licence that includes Finance agents, not a separately-priced "Copilot for Finance" SKU. Realistic all-in cost for UK SMEs is estimated at £35-55/user/month once base-licence uplift and governance costs are included.', target_segment: 'enterprise_finance', ai_features_note: 'Financial Reconciliation agent in Excel matches two datasets, auto-suggests reconciliation rules, and categorises transactions as matched/unmatched/potentially-matched, running in assistive or fully autonomous mode.', free_tier_or_trial: false, review_score: null, review_count: null, review_source: 'Not applicable', review_note: 'No dedicated G2/Capterra listing exists specifically for "Microsoft Copilot for Finance" as a distinct product — reviews exist for Microsoft 365 Copilot generally, not the finance agent specifically, so no finance-specific score is published here.', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.microsoft.com/en-gb/microsoft-365-copilot/pricing',
    is_top_pick: false, best_for: 'Enterprise finance teams already on Microsoft 365', display_order: 5,
    source_url: 'https://learn.microsoft.com/en-us/copilot/finance', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'cleo', market: 'uk', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Cleo', tagline: 'A relaunched AI money coach — with a disclosed US FTC settlement',
    score: 6.8, rating: 4.1, review_count: 3700, clicks: 3700, monthly_fee: 0,
    badges: [],
    chips: ['UK relaunch Feb 2026', '850K+ paying subscribers globally', '⚠ $17M US FTC settlement — see detail'],
    pros: [
      'A confirmed UK relaunch (5 February 2026) with an engaging "Money Coach" chatbot personality (Roast Mode/Hype Mode) and subscription-detection features',
      'Large global scale (850,000+ paying subscribers as of mid-2026 company reporting)',
    ],
    cons: [
      "The US FTC secured a $17 million settlement against Cleo AI in March 2025 over deceptive cash-advance marketing, undisclosed express fees and subscription-cancellation dark patterns",
      'No parallel UK/FCA enforcement action identified, but the settlement concerns a product (cash advances) that remains part of Cleo\'s offering',
    ],
    sub_scores: { fees: 8.6, features: 8.0, ux: 8.2, support: 6.4 },
    verdict: 'An engaging, freshly-relaunched AI coach — weigh the disclosed US FTC settlement carefully.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Freemium chat assistant; Cleo Plus/Builder subscriptions plus an optional cash-advance product with express fees (e.g. approximately $3.99 for a same-day advance).', target_segment: 'coaching_chatbot', ai_features_note: 'Conversational "Money Coach" chatbot with personality modes (Roast Mode/Hype Mode), subscription/spend detection, and financial coaching tuned to user goals.', free_tier_or_trial: true, review_score: 4.1, review_count: 3700, review_source: 'Trustpilot', review_note: 'App Store 4.7/5 (2,600+ reviews); Google Play 4.0/5 (77,500+ reviews).', regulatory_note: "In March 2025, the US FTC secured a $17 million settlement against Cleo AI over deceptive cash-advance marketing (advertising \"up to $250\" when most users received far less), undisclosed express fees, and subscription-cancellation dark patterns. This is a US enforcement action; no evidence of a parallel UK/FCA action was found, but it directly concerns Cleo's cash-advance product, which remains part of its offering, so we disclose it in full rather than treat it as irrelevant to the UK service." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.meetcleo.com/',
    is_top_pick: false, best_for: 'Users wanting an engaging AI coaching personality', display_order: 6,
    source_url: 'https://www.prnewswire.co.uk/news-releases/cleo-brings-ai-powered-money-management-back-to-the-uk-302679663.html', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'snoop', market: 'uk', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Snoop', tagline: 'Free AI spend analysis — now part of Vanquis Banking Group',
    score: 6.4, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['Completely free', 'AI + human-curated bill optimisation', 'Acquired by Vanquis Banking Group (2023)'],
    pros: [
      'Completely free AI + human-curated spend analysis, bill/tariff comparison and "rip-off alerts" via Open Banking',
      'FCA-registered as an RAISP since 2019/2020 launch',
    ],
    cons: [
      'No longer an independent company — acquired by Vanquis Banking Group in July 2023, though it continues under its own brand',
      'Trustpilot rating is genuinely conflicting across sources on a small sample (~120 reviews) — shown as not yet rated rather than an unreliable figure',
    ],
    sub_scores: { fees: 9.4, features: 7.2, ux: 7.4, support: 6.6 },
    verdict: 'A genuinely free AI spend-optimisation tool — now owned by a banking group, disclosed for transparency.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Completely free.', target_segment: 'budgeting', ai_features_note: 'AI plus human-curated spending analysis, bill/tariff comparison and "rip-off alerts" via Open Banking account aggregation.', free_tier_or_trial: true, review_score: null, review_count: null, review_source: 'Conflicting sources', review_note: 'App Store shows 4.6/5 (6,900+ reviews); Trustpilot figures conflict significantly between sources (3.2 vs 4.4/5) on a small sample (~120 reviews) — shown as not yet rated rather than an unreliable specific number.', regulatory_note: 'Snoop was acquired by Vanquis Banking Group in July 2023 and is no longer an independent company, though it continues operating as its own branded app within the group rather than being absorbed or renamed. Q1 2026 reporting shows active users up 7% year-over-year to 344,000.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.snoop.app/',
    is_top_pick: false, best_for: 'Users wanting a genuinely free bill-optimisation tool', display_order: 7,
    source_url: 'https://www.vanquis.com/money-saving-app-snoop/', data_verified_at: '2026-07-11', active: true,
  },
];

const moneySavingTools = [
  {
    slug: 'moneysupermarket', market: 'uk', category: 'cost-of-living', topic: 'money-saving-tools',
    display_name: 'MoneySuperMarket', tagline: 'A broad, Ofgem-accredited comparison hub',
    score: 9.0, rating: 4.8, review_count: 56000, clicks: 56000, monthly_fee: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Ofgem-accredited energy comparison', 'Multi-category: energy, insurance, credit cards', 'Trustpilot 4.8/5 (~56K reviews)'],
    pros: [
      'Ofgem-accredited for its energy comparison channel, plus broad multi-category coverage (insurance, credit cards, broadband)',
      'FCA-authorised (as an appointed representative) for insurance, mortgage and consumer-credit comparisons',
      'Strong Trustpilot rating (4.8/5, ~56,000 reviews)',
    ],
    cons: [
      'Shares the same FTSE 250 parent (MONY Group) as Quidco and MoneySavingExpert — worth knowing if comparing more than one on this page',
      'Commission-based revenue model, though FCA rules require this not to affect comparison ranking',
    ],
    sub_scores: { trust: 9.0, breadth: 9.4, rating: 9.6 },
    verdict: 'The broadest, most trusted comparison hub in this comparison.',
    attributes: { tool_type: 'multi_category_comparison', business_model_note: 'Free to use; earns commission from suppliers (energy, insurance, credit cards, broadband) when a user completes a switch or purchase — commission does not affect comparison ranking. MoneySuperMarket.com Limited is an appointed representative of MoneySuperMarket.com Financial Group Ltd, FCA-authorised (FRN 303190).', key_feature_note: 'Broad multi-category comparison across energy, insurance, credit cards and broadband, positioned as a one-stop bill-cutting hub.', ofgem_accredited: true, trustpilot_rating: 4.8, trustpilot_count: 56000, trustpilot_note: 'uk.trustpilot.com/review/www.moneysupermarket.com — "Excellent"', regulatory_note: 'MoneySuperMarket, MoneySavingExpert and Quidco (also on this page) are all owned by the same FTSE 250 parent, MONY Group plc — worth knowing if comparing more than one as though they were fully independent recommendations. No CMA or FCA enforcement action was found for 2024-2026; the FCA has separately warned about clone-firm scams impersonating the "Money Supermarket" name, which is fraud against the brand, not a finding against the real company.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.moneysupermarket.com/',
    is_top_pick: true, best_for: 'Households wanting the broadest comparison coverage', display_order: 1,
    source_url: 'https://www.moneysupermarket.com/how-moneysupermarket-works/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'topcashback', market: 'uk', category: 'cost-of-living', topic: 'money-saving-tools',
    display_name: 'TopCashback', tagline: "The UK's largest cashback portal — with a disclosed payout-delay pattern",
    score: 8.6, rating: 4.6, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Best cashback portal' }],
    chips: ['15M+ UK members', '£1bn+ paid out cumulatively', '⚠ Payout-delay complaints — see detail'],
    pros: [
      "The UK's largest cashback portal by membership (15M+ members)",
      'Won Consumer Moneyfacts "Cashback Site of the Year 2024"',
      'Strong Trustpilot rating (4.6/5, "Excellent")',
    ],
    cons: [
      'Multiple 2026 complaints describe cashback claims declined or delayed for months beyond the stated payment window',
      'A small membership fee applies to unlock 100% payout on some account tiers — verify current fee structure at signup',
    ],
    sub_scores: { trust: 7.6, breadth: 8.8, rating: 9.2 },
    verdict: "The largest cashback portal by scale — a real payout-delay pattern to weigh, common across the industry.",
    attributes: { tool_type: 'cashback_portal', business_model_note: 'Retailers pay TopCashback commission for referred sales; TopCashback passes on a large share of that commission to members as cashback, plus revenue from on-site sponsored placements.', key_feature_note: "Passive cashback layered on top of everyday spending across thousands of UK retailers — the UK's largest such platform by membership.", ofgem_accredited: null, trustpilot_rating: 4.6, trustpilot_count: null, trustpilot_note: 'trustpilot.com/review/www.topcashback.co.uk — "Excellent"', regulatory_note: 'Multiple 2026 complaints (via BBB and consumer forums) describe cashback claims declined or delayed for months beyond the stated payment window, and slow support-ticket resolution. This is a genuine, recurring pattern reflecting retailer-side tracking-pixel reliability across the cashback industry broadly, not unique to TopCashback, but real and worth disclosing plainly.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.topcashback.co.uk/',
    is_top_pick: false, best_for: 'Shoppers wanting the largest cashback network', display_order: 2,
    source_url: 'https://www.topcashback.co.uk/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'compare-the-market', market: 'uk', category: 'cost-of-living', topic: 'money-saving-tools',
    display_name: 'Compare the Market', tagline: 'The highest independently corroborated customer satisfaction of the 7',
    score: 8.4, rating: 4.9, review_count: 124500, clicks: 124500, monthly_fee: 0,
    badges: [{ type: 'sky', label: 'Highest customer satisfaction' }],
    chips: ['Trustpilot 4.9/5 (124,500+ reviews)', 'Rewards loyalty scheme', 'Broad insurance, energy comparison'],
    pros: [
      'The highest independently corroborated customer satisfaction of the 7 (4.9/5 on Trustpilot, 124,500+ reviews)',
      'A "Rewards" loyalty scheme (free cinema tickets/meals with qualifying purchases) adds extra value alongside comparison',
    ],
    cons: [
      "Its own site is not itself listed as a direct Ofgem Confidence Code accreditation holder — its energy comparison function is understood to be underpinned by a third-party accredited engine, worth verifying directly against Ofgem's current list",
      "Historically (pre-2020) was subject to a CMA investigation into 'most-favoured nation' pricing clauses in home insurance, resolved by dropping the clauses",
    ],
    sub_scores: { trust: 8.4, breadth: 8.2, rating: 9.8 },
    verdict: 'The best-reviewed comparison site of the 7, with a genuinely valuable loyalty scheme.',
    attributes: { tool_type: 'multi_category_comparison', business_model_note: 'Free to use; results-based commission from suppliers (insurance, energy, etc.) when a customer switches. Part of BGL Group (majority-owned by BHL (UK) Holdings, minority stake held by CPP Investments).', key_feature_note: 'Broad comparison (car/home insurance, energy, broadband) plus a "Rewards" loyalty scheme offering free cinema tickets/meals with qualifying purchases.', ofgem_accredited: null, trustpilot_rating: 4.9, trustpilot_count: 124500, trustpilot_note: 'uk.trustpilot.com/review/www.comparethemarket.com — "Excellent"; do not confuse with the separate, lower-rated Australian entity (comparethemarket.com.au)', regulatory_note: "Its direct Ofgem Confidence Code accreditation status was not conclusively confirmed in research — its energy comparison function is understood to rely on a third-party accredited engine; verify directly against Ofgem's live accredited-sites register before relying on this. Historically (pre-2020) Compare the Market was subject to a CMA investigation into \"most-favoured nation\" pricing clauses in the home-insurance market, resolved by the company dropping the clauses — background context, not a live issue." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.comparethemarket.com/',
    is_top_pick: false, best_for: 'Households wanting the best-reviewed comparison experience', display_order: 3,
    source_url: 'https://www.comparethemarket.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'quidco', market: 'uk', category: 'cost-of-living', topic: 'money-saving-tools',
    display_name: 'Quidco', tagline: "The UK's second-largest cashback portal",
    score: 7.6, rating: 4.2, review_count: 130900, clicks: 130900, monthly_fee: 0,
    badges: [],
    chips: ['10M+ members since 2005', '£400m+ shared cumulatively', '⚠ Payout-delay complaints — see detail'],
    pros: [
      "The UK's second-largest cashback portal (10M+ members since 2005, ~£300/year average member return cited)",
      'Runs its own affiliate/new-member programme through the Awin network',
    ],
    cons: [
      'Owned by the same MONY Group parent as MoneySuperMarket and MoneySavingExpert',
      'Similar to TopCashback, recurring complaints describe cashback payout delays (up to around a year in some cases) and tracking failures on larger purchases',
    ],
    sub_scores: { trust: 7.4, breadth: 8.0, rating: 8.4 },
    verdict: "A large, long-running cashback portal — the same industry-wide payout-delay pattern applies as with TopCashback.",
    attributes: { tool_type: 'cashback_portal', business_model_note: 'Retailer commission on tracked purchases, shared with members as cashback; also earns via featured placement, promotions and a comparison-referral arm. Quidco Limited is an appointed representative of MONY Group Financial Ltd (FCA-regulated), the same parent group that owns MoneySuperMarket and MoneySavingExpert.', key_feature_note: 'Cashback on everyday and larger purchases across thousands of UK retailers; average member return cited at approximately £300/year.', ofgem_accredited: null, trustpilot_rating: 4.2, trustpilot_count: 130900, trustpilot_note: 'uk.trustpilot.com/review/www.quidco.com — "Great"', regulatory_note: 'Owned by the same MONY Group parent as MoneySuperMarket and MoneySavingExpert (also on this page). Similar to TopCashback, recurring complaints describe cashback payout delays of up to around a year in some cases and tracking failures on larger purchases — an industry-wide pattern (dependent on retailer-side tracking pixels), not unique to Quidco.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.quidco.com/',
    is_top_pick: false, best_for: 'Shoppers wanting a long-running, established cashback site', display_order: 4,
    source_url: 'https://www.quidco.com/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'uswitch-money-saving', market: 'uk', category: 'cost-of-living', topic: 'money-saving-tools',
    display_name: 'Uswitch', tagline: 'A leading energy/broadband comparison site since 2000',
    score: 7.4, rating: 4.7, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['Ofgem Confidence Code accredited', 'Energy/broadband/SIM-only comparison', 'Since 2000'],
    pros: [
      'Ofgem Confidence Code accredited for energy comparison, one of the original UK comparison sites (since 2000)',
      'Multi-category tariff switching (energy, broadband, SIM-only) plus stacked cashback/voucher incentives',
      'Strong Trustpilot rating (~4.7/5)',
    ],
    cons: [
      'Recurring complaints about technical glitches requiring re-entry of data, and occasional mismatches between quoted and actual tariffs',
      'Some users report not being clearly warned about early-exit penalties on switched contracts',
    ],
    sub_scores: { trust: 8.4, breadth: 7.4, rating: 9.0 },
    verdict: 'A well-established, Ofgem-accredited energy and broadband comparison specialist.',
    attributes: { tool_type: 'energy_comparison', business_model_note: 'Free to use; earns commission from energy/broadband/mobile suppliers when a user completes a switch through the site — commission does not affect the tariff price the customer pays.', key_feature_note: 'Multi-category tariff switching (energy, broadband, SIM-only) plus stacked cashback/voucher incentives directly targeting bill reduction.', ofgem_accredited: true, trustpilot_rating: 4.7, trustpilot_count: null, trustpilot_note: 'trustpilot.com/review/www.uswitch.com', regulatory_note: 'No CMA or Ofgem enforcement action against Uswitch specifically was found for 2024-2026. The CMA\'s late-2025 "drip pricing" enforcement wave did not name Uswitch.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.uswitch.com/',
    is_top_pick: false, best_for: 'Households wanting a dedicated energy/broadband specialist', display_order: 5,
    source_url: 'https://www.uswitch.com/gas-electricity/guides/ofgem/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'emma-cost-of-living', market: 'uk', category: 'cost-of-living', topic: 'money-saving-tools',
    display_name: 'Emma', tagline: 'Free budgeting with open-banking analysis, direct cost-of-living response',
    score: 7.2, rating: 4.3, review_count: 8800, clicks: 8800, monthly_fee: 0,
    badges: [],
    chips: ['3M+ users', 'Open-banking spend analysis', '⚠ Billing/cancellation complaints — see detail'],
    pros: [
      'Aggregates 50+ UK bank/institution accounts via open banking to auto-generate a budget and flag overspend',
      'Explicitly marketed around subscription-cancellation as a direct cost-of-living-crisis response',
      '3 million+ users',
    ],
    cons: [
      'Recurring complaints describe unexpected charges after free-trial periods and difficulty cancelling paid subscriptions — a real friction point for a tool marketed around saving money',
      'Free tier core budgeting, but the deepest features sit behind paid tiers (£4.99-£14.99/month)',
    ],
    sub_scores: { trust: 7.6, breadth: 7.0, rating: 8.6 },
    verdict: 'A genuinely useful free budgeting tool — the billing-friction complaints are worth knowing about upfront.',
    attributes: { tool_type: 'budgeting_app', business_model_note: 'Freemium subscription — free core budgeting tier, plus paid tiers (Plus £4.99, Pro £9.99, Ultimate £14.99/month). Emma Technologies Ltd is FCA-registered under the Payment Services Regulations 2017 for account-information services.', key_feature_note: 'Aggregates 50+ UK bank/institution accounts via open banking, auto-generates a spending budget, flags overspend, surfaces duplicate/wasteful subscriptions, and offers auto-save — explicitly positioned as a cost-of-living-crisis response.', ofgem_accredited: null, trustpilot_rating: 4.3, trustpilot_count: 8800, trustpilot_note: 'Figures fragmented across multiple listed entities (emma-app.com and myemma.com); Google Play shows 4.3/5 (8,800+ reviews)', regulatory_note: 'Recurring complaints describe unexpected charges after free-trial periods, being charged annually when expecting monthly billing, difficulty cancelling subscriptions, and features moved behind paywalls after previously being included free — a legitimate reputational/billing risk worth disclosing given the page\'s cost-of-living, money-saving framing.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://emma-app.com/',
    is_top_pick: false, best_for: 'Users wanting free open-banking spend analysis', display_order: 6,
    source_url: 'https://www.openbanking.org.uk/apps/emma/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'chip', market: 'uk', category: 'cost-of-living', topic: 'money-saving-tools',
    display_name: 'Chip', tagline: 'AI autosave — savings held via FSCS-protected partner bank ClearBank',
    score: 6.8, rating: 3.8, review_count: 1600, clicks: 1600, monthly_fee: 0,
    badges: [],
    chips: ["Finder Savings App of the Year 2025", "AI-powered autosave", 'FSCS protection via ClearBank — see detail'],
    pros: [
      'Confirmed winner of Finder\'s 2025 "Savings App Provider of the Year" award',
      'AI-powered autosave analyses linked-account spending and auto-transfers "spare" amounts based on a user-selected intensity',
    ],
    cons: [
      'Trustpilot rating is notably lower and more polarised than the comparison/cashback sites on this page (~3.8/5, 65% five-star but 22% one-star)',
      'Chip is not itself a bank — savings sit with partner bank ClearBank, and the £120,000 FSCS protection is aggregated across all ClearBank-held Chip products, not per product',
    ],
    sub_scores: { trust: 6.8, breadth: 6.4, rating: 6.8 },
    verdict: 'An award-winning AI autosave tool — understand the FSCS-via-ClearBank structure precisely.',
    attributes: { tool_type: 'budgeting_app', business_model_note: 'Freemium app (Chip Financial Ltd, FCA-regulated); revenue from subscription tiers and from the interest/rate spread on partner-bank savings products it distributes.', key_feature_note: 'Uses open banking to analyse linked-account spending and auto-transfer "spare" amounts into savings based on a user-selected autosave intensity.', ofgem_accredited: null, trustpilot_rating: 3.8, trustpilot_count: 1600, trustpilot_note: 'trustpilot.com — 65% five-star but 22% one-star, a polarised distribution; recurring complaints about customer-support responsiveness and occasional technical glitches', regulatory_note: 'Chip is not a bank and does not hold customer deposits itself. Savings products (Instant Access, Easy Access Saver, Cash ISA, Prize Savings Account) are held via partner bank ClearBank, which is the actual FSCS-protected institution. Protection (up to £120,000, the UK-wide limit effective 1 December 2025) is aggregated across all products held at that one banking licence — a customer holding multiple Chip products on ClearBank\'s licence gets one combined £120,000 ceiling, not £120,000 per product.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.getchip.uk/',
    is_top_pick: false, best_for: 'Savers wanting AI-automated autosave', display_order: 7,
    source_url: 'https://www.getchip.uk/how-we-protect-your-money', data_verified_at: '2026-07-11', active: true,
  },
];

const cybersecurity = [
  {
    slug: 'sophos-uk', market: 'uk', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Sophos', tagline: 'A genuinely British company, headquartered in Oxfordshire since 1985',
    score: 8.9, rating: 4.6, review_count: 820, clicks: 820, monthly_fee: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['HQ: Abingdon, Oxfordshire since 1985', 'SE Labs Awards 2026 — 3 categories won', 'NCSC CIR-assured'],
    pros: [
      'A genuinely British company, headquartered in Abingdon, Oxfordshire since 1985, hosting its SophosLabs threat-analysis centre on-site',
      'Won three categories at the UK-based SE Labs Awards 2026 (Enterprise Endpoint Windows, Small Business Endpoint Windows, Small Business Security Development)',
      'NCSC-assured for Cyber Incident Response (CIR) Standard and Enhanced levels',
    ],
    cons: [
      "Sophos's own Firewall product line (a different product from Intercept X) has been targeted by a multi-year nation-state exploitation campaign",
      'Zero self-serve pricing — quote-only via reseller',
    ],
    sub_scores: { cost: 7.0, features: 8.8, trust: 9.6, support: 8.6 },
    verdict: 'The most UK-relevant vendor of the 7 — a genuinely British company with independent UK award recognition.',
    attributes: { pricing_model: 'per-user/year, reseller-quoted', starting_price_note: 'No official price published (quote-only via reseller). Third-party estimates from prior research: Intercept X Advanced ~$66 USD/user/yr for small deployments — unverified against an official UK quote.', product_category: 'endpoint_protection', key_feature_note: 'Deep-learning malware prevention plus optional XDR add-on tiers scaled to org maturity — the Advanced tier (no XDR) is the realistic SMB entry point.', uk_presence_note: 'Headquartered in Abingdon, Oxfordshire since 1985 (global HQ, not just a UK office) — genuinely British, hosting SophosLabs threat-analysis on-site. Won 3 categories at the UK-based SE Labs Awards 2026 and holds NCSC Cyber Incident Response scheme assurance.', review_score: 4.6, review_count: 820, review_source: 'G2 (Sophos Endpoint, not Intercept X-specific)', review_note: 'Capterra shows 4.5/5 (218 reviews) listed as "Intercept X Endpoint".', security_note: "Sophos's own 'Pacific Rim' research (October 2024) documented a five-year China-linked nation-state campaign actively exploiting zero-day vulnerabilities in Sophos Firewall (XG/XGS) products against critical infrastructure; the US DOJ separately charged a Chinese national in 2024 over a 2020 campaign that compromised roughly 81,000 Sophos firewalls globally. This exploitation history is specific to Sophos's network Firewall product line, not Intercept X (the endpoint product featured here) — but we disclose it in full given it's the same vendor." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.sophos.com/en-us/products/endpoint-antivirus',
    is_top_pick: true, best_for: 'Businesses wanting a British vendor with UK awards', display_order: 1,
    source_url: 'https://secure2.sophos.com/en-us/products/intercept-x/get-pricing.aspx', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: '1password-business-uk', market: 'uk', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: '1Password Business', tagline: 'Transparent pricing and no confirmed platform-level breach',
    score: 8.8, rating: 0, review_count: 0, clicks: 0, monthly_fee: 7,
    badges: [{ type: 'green', label: 'Best password manager' }],
    chips: ['Transparent published pricing', 'SSO integrations for growing teams', 'No confirmed platform breach'],
    pros: [
      'One of the few vendors on this page with fully transparent, published self-serve pricing',
      'SSO integrations (Okta, Entra ID, Duo) and role-based vault sharing suit growing SMB teams',
      'No confirmed platform-level breach of its own found',
    ],
    cons: [
      'No confirmed dedicated UK office — headquartered in Toronto, Canada; offers EU data residency (Frankfurt) but no UK-specific data-residency option',
      'Current G2/Capterra review score could not be independently confirmed at research time',
    ],
    sub_scores: { cost: 8.2, features: 9.0, trust: 9.0, support: 8.4 },
    verdict: 'The most transparent, best-attested password manager researched — no confirmed UK office, but a clean record.',
    attributes: { pricing_model: 'per-user/month', starting_price_note: '$8.99 USD/user/month (Business, billed annually), confirmed on the official pricing page; converts to an estimated ~£7/user/month. No native GBP price found (pricing shown in USD, CAD and EUR only).', product_category: 'password_manager', key_feature_note: 'SSO integrations (Okta, Entra ID, Duo), role-based vault sharing, Watchtower security-hygiene alerts and activity monitoring.', uk_presence_note: 'No confirmed dedicated UK office found — headquartered in Toronto, Canada. Offers EU data residency (vault data hosted in Frankfurt, Germany) as an option, but this is an EU offering, not UK-specific.', review_score: null, review_count: null, review_source: 'G2/Capterra', review_note: 'A specific, current G2/Capterra star rating and review count could not be independently confirmed at research time — shown as not yet rated.', security_note: "No confirmed breach, lawsuit or fine was found for 2024-2026. The 2023 Okta third-party incident touched some 1Password-adjacent systems, but no customer vault data was accessed — a resolved, pre-window matter disclosed for context. In 2025, a DEF CON researcher disclosed and helped patch browser-extension vulnerabilities affecting several password managers including 1Password, and phishing campaigns have separately impersonated 1Password's 'Watchtower' brand — both are third-party/attacker-side issues, not 1Password platform compromises." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://1password.com/business/',
    is_top_pick: false, best_for: 'Teams wanting transparent pricing and SSO', display_order: 2,
    source_url: 'https://1password.com/pricing/password-manager', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'crowdstrike-uk-smb', market: 'uk', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'CrowdStrike Falcon Go', tagline: 'A London-registered UK entity — with a well-documented 2024 outage disclosed',
    score: 8.3, rating: 4.6, review_count: 385, clicks: 385, monthly_fee: 6,
    badges: [],
    chips: ['CrowdStrike UK Limited (London)', 'NCSC CIR-assured', '⚠ July 2024 global outage — see detail'],
    pros: [
      'CrowdStrike UK Limited is registered in London and holds NCSC Cyber Incident Response (CIR) scheme assurance',
      'Falcon Go is a purpose-built SMB bundle from a top-tier EDR vendor, with strong review scores (G2 4.6/5, 385 reviews)',
    ],
    cons: [
      'The July 2024 global outage — a faulty Falcon sensor update bricked approximately 8.5 million Windows devices worldwide — remains the most severe documented incident of any vendor in this comparison',
      'Falcon Go lacks true EDR; real detection/response requires upgrading to the pricier Falcon Pro or Enterprise tiers',
    ],
    sub_scores: { cost: 7.8, features: 9.0, trust: 8.0, support: 8.2 },
    verdict: 'A London-registered, NCSC-assured EDR vendor — weigh the disclosed 2024 outage, a genuinely severe incident.',
    attributes: { pricing_model: 'per-device/month or /year', starting_price_note: 'Falcon Go: $7.99 USD/device/month or $59.99 USD/device/year, capped at 100 devices. No native GBP price found; converts to an estimated ~£6/device/month.', product_category: 'endpoint_protection', key_feature_note: 'Falcon Go bundles next-gen AV, USB device control and mobile protection with "Express Support" onboarding for SMBs — full EDR/response requires upgrading to the pricier Falcon Pro or Enterprise tiers.', uk_presence_note: 'CrowdStrike UK Limited is registered at 7 Albemarle Street, London W1S 4HQ, and holds NCSC Cyber Incident Response (CIR) scheme assurance.', review_score: 4.6, review_count: 385, review_source: 'G2', review_note: 'Capterra shows 4.6-4.7/5 (55 reviews); both reflect the broader Falcon platform, not the Falcon Go SMB tier specifically.', security_note: "The July 2024 global outage — a faulty Falcon sensor update bricked approximately 8.5 million Windows devices worldwide (airlines, hospitals, banks affected) — is the most severe documented incident of any vendor in this comparison; litigation remains live through 2025-26, including a Delta Air Lines lawsuit seeking roughly $500M in damages. Separately, in November 2025 CrowdStrike fired an employee who leaked internal data to the hacking group 'Scattered Lapsus$ Hunters'; CrowdStrike states no systems or customer data were compromised despite the group's false claim of a full breach." },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.crowdstrike.com/en-gb/',
    is_top_pick: false, best_for: 'Businesses wanting top-tier, NCSC-assured EDR', display_order: 3,
    source_url: 'https://www.crowdstrike.com/en-us/pricing/falcon-go/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'bitwarden-uk', market: 'uk', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Bitwarden', tagline: 'The cheapest password manager researched — no UK data region',
    score: 8.0, rating: 4.9, review_count: 903, clicks: 903, monthly_fee: 3,
    badges: [],
    chips: ['Cheapest per-seat of the 7', 'Open-source, self-hostable', '⚠ No UK data region + Apr 2026 CLI compromise — see detail'],
    pros: [
      'The cheapest per-seat pricing researched (Teams: $4.00 USD/user/month, converts to ~£3/user/month)',
      'Open-source, independently-audited codebase with a self-hosting option — relevant for businesses with data-residency concerns',
      'Strong review standing (#1 in the G2 Enterprise Grid password-manager category for 11 consecutive quarters)',
    ],
    cons: [
      'Offers only US and EU server regions — UK customers cannot use the EU region post-Brexit, meaning UK users default to the US region absent self-hosting',
      'A malicious version of the Bitwarden CLI npm package was live for roughly 90 minutes in April 2026 as part of a broader supply-chain campaign',
    ],
    sub_scores: { cost: 9.4, features: 8.4, trust: 8.0, support: 7.8 },
    verdict: 'The cheapest, most open password manager researched — the UK data-residency gap is a real, disclosed limitation.',
    attributes: { pricing_model: 'per-user/month', starting_price_note: 'Teams: $4.00 USD/user/month (billed annually); Enterprise: $6.00 USD/user/month. No native GBP price; converts to an estimated ~£3/user/month (Teams). Pricing stated as "USD only," "taxes not included."', product_category: 'password_manager', key_feature_note: 'Open-source, independently-audited codebase plus a self-hosting option — lets businesses with data-residency concerns keep vault infrastructure in-country.', uk_presence_note: 'No confirmed UK office found. Data-residency-wise, Bitwarden offers US and EU server regions only — UK customers explicitly cannot use the EU region post-Brexit, meaning UK users default to the US region unless self-hosting.', review_score: 4.9, review_count: 903, review_source: 'G2 (98/100 satisfaction score)', review_note: 'Capterra shows 4.7/5 (215 reviews). Widely cited as "best free password manager" across UK-facing tech press (Tom\'s Guide, Gadget Scout) for 2026.', security_note: 'On 22 April 2026, a malicious version of the Bitwarden CLI npm package (@bitwarden/cli@2026.4.0) was live for approximately 1.5 hours as part of a broader supply-chain campaign, stealing SSH keys, npm tokens and AWS credentials from roughly 334 downloaders. Bitwarden confirmed no vault data was accessed and the impact was scoped strictly to CLI/developer users, not the password-manager app itself.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://bitwarden.com/business/',
    is_top_pick: false, best_for: 'Budget-conscious teams wanting self-hosting', display_order: 4,
    source_url: 'https://bitwarden.com/pricing/business/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'bitdefender-uk', market: 'uk', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Bitdefender GravityZone', tagline: 'A GBP storefront exists — with an April 2025 GDPR fine disclosed',
    score: 7.6, rating: 4.6, review_count: 208, clicks: 208, monthly_fee: 3,
    badges: [],
    chips: ['GBP-priced storefront (en-gb)', 'SMB-tiered up to 30 endpoints', '⚠ April 2025 GDPR fine — see detail'],
    pros: [
      'A localized bitdefender.com/en-gb storefront uses GBP pricing (exact figures not confirmed, dynamically loaded)',
      'SMB-sized tiers with ransomware remediation/rollback and a single-pane console',
      'Strong Capterra score (4.6/5, 208 reviews)',
    ],
    cons: [
      "Romania's data protection authority fined Bitdefender approximately €10,000 in April 2025 for a GDPR violation after an email-security update exposed customer names and emails",
      'No independently confirmed dedicated UK operations office — the UK entity appears to be a registered/holding entity rather than a staffed office',
    ],
    sub_scores: { cost: 8.0, features: 8.6, trust: 7.4, support: 7.6 },
    verdict: 'A GBP-priced option with strong SMB features — weigh the disclosed 2025 GDPR fine.',
    attributes: { pricing_model: 'per-device/year', starting_price_note: 'A GBP-priced storefront exists at bitdefender.com/en-gb, but exact current figures did not render in research (dynamic pricing widget) — third-party USD estimate from prior research: Small Business Security ~$77.69/3 devices/year ≈ £3/device/month, unverified against an official UK quote.', product_category: 'endpoint_protection', key_feature_note: 'Multi-layered ransomware prevention, network attack defense, misconfiguration/risk management, anti-phishing and web filtering in a single-pane console.', uk_presence_note: 'Bitdefender Limited UK entity is registered (address via agent in Stoke-on-Trent), but appears to be a registered/holding entity rather than a staffed operations office — primary HQ is dual Bucharest (Romania) / San Antonio (US).', review_score: 4.6, review_count: 208, review_source: 'Capterra', review_note: 'G2 shows a lower 4.0/5 (72 reviews) specifically for "GravityZone XDR," a scope mismatch worth noting versus plain Business Security.', security_note: "Romania's data protection authority (ANSPDCP) fined Bitdefender SRL approximately €10,000 (RON 47,772) on 30 April 2025 for GDPR Article 32 violations, after a programming error in an email-security update exposed customer names and emails to third parties. Several 2024-2025 CVEs affecting Bitdefender products exist, though none are listed in CISA's Known Exploited Vulnerabilities catalog as of this research." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.bitdefender.com/en-gb/business/smb-products/business-security',
    is_top_pick: false, best_for: 'SMBs wanting a GBP-priced storefront', display_order: 5,
    source_url: 'https://www.bitdefender.com/en-gb/business/smb-products/business-security', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'eset-uk', market: 'uk', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'ESET PROTECT', tagline: 'A dedicated Bournemouth office — with an actively-exploited CVE disclosed',
    score: 7.4, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['Dedicated Bournemouth UK office', 'Runs well on legacy hardware', '⚠ Actively-exploited 2024 CVE — see detail'],
    pros: [
      'A dedicated UK office at Ocean 80, Holdenhurst Road, Bournemouth, opened as part of ESET\'s stated "British expansion", plus distribution via UK partner Avosec',
      'Cloud-managed PROTECT console with a flexible Entry/Advanced/Complete/MDR upgrade path',
      'Runs lightly on older hardware, a real advantage for cost-conscious SMBs',
    ],
    cons: [
      "CVE-2024-11859, a flaw in ESET's own scanner, was actively exploited by the ToddyCat APT group into 2025 — a genuine product-security concern for a security vendor",
      'Zero public list pricing anywhere — quote-only, and current review scores could not be independently confirmed',
    ],
    sub_scores: { cost: 7.0, features: 8.4, trust: 7.0, support: 8.0 },
    verdict: 'A real, dedicated UK office and a flexible upgrade path — but a real exploited CVE to weigh, and no public pricing.',
    attributes: { pricing_model: 'per-device, custom quote', starting_price_note: 'No public list price found anywhere — ESET states pricing is quote-only. The eset.com/uk pricing page shows "excl. VAT" language consistent with UK-targeted pricing, but exact GBP figures did not render in research.', product_category: 'endpoint_protection', key_feature_note: 'Tiered PROTECT platform (Entry/Advanced/Complete/MDR) lets SMBs start with basic endpoint AV and add EDR/MDR later without switching vendors; runs lightly on older hardware.', uk_presence_note: 'A dedicated UK office at Ocean 80, 80 Holdenhurst Road, Bournemouth BH8 8AQ, opened per ESET\'s own "British expansion" press release. Distribution also runs through UK partner Avosec.', review_score: null, review_count: null, review_source: 'G2/Capterra', review_note: 'Small-sample product-specific scores (PROTECT MDR 4.8/5, 16 reviews; PROTECT Complete 4.7/5, 10 reviews) are both too small to be meaningful — shown as not yet rated.', security_note: "CVE-2024-11859, a DLL search-order hijacking flaw (CVSS 8.4) in ESET's own Windows products, was actively exploited in the wild by the China-linked APT group ToddyCat to deploy malware and disable kernel security notifications, patched in January 2025. Separately, ESET's own researchers discovered and disclosed CVE-2024-7344, an industry-wide UEFI Secure Boot bypass, fixed via the January 2025 Patch Tuesday." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.eset.com/uk/business/protect-platform/',
    is_top_pick: false, best_for: 'Cost-conscious businesses wanting UK-based support', display_order: 6,
    source_url: 'https://www.eset.com/uk/about/contact/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'nordvpn-business-uk', market: 'uk', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'NordVPN (NordLayer Business)', tagline: 'TechRadar UK\'s #1 business VPN — with a January 2026 breach claim disclosed',
    score: 7.0, rating: 0, review_count: 0, clicks: 0, monthly_fee: 9,
    badges: [],
    chips: ['TechRadar UK #1 business VPN 2026', 'UK office in Nord Security\'s footprint', '⚠ Jan 2026 breach claim — see detail'],
    pros: [
      "TechRadar's UK edition ranks NordLayer #1 for \"best business VPN\" 2026; SafetyDetectives also rates it a top business-VPN pick",
      'Sources confirm UK offices among Nord Security\'s international footprint',
    ],
    cons: [
      'A threat actor claimed a January 2026 breach of Salesforce/Jira-adjacent infrastructure; NordVPN disputes any production impact, calling the leaked data "dummy data" from an old third-party test environment',
      'No confirmed native GBP business pricing (consumer NordVPN shows GBP, but NordLayer business pricing found only in USD)',
    ],
    sub_scores: { cost: 7.4, features: 7.6, trust: 6.4, support: 7.2 },
    verdict: 'A UK-award-winning business VPN — read the disclosed breach claim below before choosing.',
    attributes: { pricing_model: 'per-user/month', starting_price_note: 'Lite $8 USD/user/month, Core $11 USD/user/month, Premium $14 USD/user/month (minimum 5 users); Enterprise from $6 USD/user/month at 200+ seats. No confirmed native GBP business price; converts to an estimated ~£9/user/month (Core).', product_category: 'vpn_network_security', key_feature_note: 'ThreatBlock malicious-site filtering, IP allowlisting, DNS filtering, Cloud Firewall and site-to-site VPN for distributed teams.', uk_presence_note: 'Sources confirm UK offices among Nord Security\'s international footprint, though no specific London address was independently confirmed; corporate structure is Panama-registered (NordVPN S.A.) with an EU entity in Amsterdam and parent Nord Security headquartered in Lithuania — a UK presence exists but is not a headquarters.', review_score: null, review_count: null, review_source: 'G2/Capterra', review_note: 'No NordLayer G2 score was independently confirmed at research time — shown as not yet rated.', security_note: 'A threat actor calling itself "1011" claimed a January 2026 breach of Salesforce/Jira-adjacent development infrastructure. NordVPN\'s response within 24 hours: the exposed data came from an isolated third-party test environment and was "dummy data," with no production or customer data affected. No independent forensic verification of either side\'s account has surfaced as of this page\'s last check.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://nordlayer.com/',
    is_top_pick: false, best_for: 'Distributed UK teams needing network access', display_order: 7,
    source_url: 'https://nordlayer.com/pricing/', data_verified_at: '2026-07-11', active: true,
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

await upsert(aiTools, 'ai-tools/ai-tools-finance (uk)');
await upsert(moneySavingTools, 'cost-of-living/money-saving-tools (uk)');
await upsert(cybersecurity, 'cybersecurity/cybersecurity-smb (uk)');

const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/product_attributes?select=category,topic&market=eq.uk&active=eq.true&topic=in.(ai-tools-finance,money-saving-tools,cybersecurity-smb)`,
  { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } },
);
const countRows = await countRes.json();
const counts = {};
for (const r of countRows) {
  const key = `${r.category}/${r.topic}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log('\nActive row counts:', counts);
console.log('\nNext: npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk ai-tools ai-tools-finance');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk cost-of-living money-saving-tools');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts uk cybersecurity cybersecurity-smb');
