#!/usr/bin/env node
// AU/CA/UK rollout Slice AU-3 (superannuation/super-funds, ai-tools/
// ai-tools-finance, cybersecurity/cybersecurity-smb) — final AU slice.
// Applies seed rows via the PostgREST API (upsert on the product_attributes
// unique constraint), same working pattern as apply-au-slice1-rest.mjs /
// apply-au-slice2-rest.mjs (exec_sql RPC and direct Postgres connection are
// both unreachable from this environment).
// Row data mirrors supabase/migrations/20260711140000-20260711140200 exactly
// — those .sql files remain the source-of-truth audit trail; this script is
// the actual write path used to seed prod.
// Usage: node --env-file=.env.local scripts/apply-au-slice3-rest.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

const superFunds = [
  {
    slug: 'aware-super', market: 'au', category: 'superannuation', topic: 'super-funds',
    display_name: 'Aware Super', tagline: 'Back-to-back SuperRatings Fund of the Year, 2025 and 2026',
    score: 9.1, rating: 0, review_count: 0, clicks: 0, management_fee: 0.914, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['SuperRatings Fund of the Year 2025 & 2026', 'Falling admin fees into 2026', '8.83% p.a. 10-yr return (High Growth)'],
    pros: [
      'The only fund in this comparison named SuperRatings Fund of the Year in both 2025 and 2026',
      'Strong 10-year return on its default High Growth lifecycle stage (8.83% p.a. to 30 June 2025)',
      'Admin fees falling into 2026 (cut to 0.16% from 1 May 2026) — rare among peers',
    ],
    cons: ['Lifecycle default means younger/older members sit in different stages with different fee/return profiles', 'Fee example figure sits close to the industry median, not the outright cheapest'],
    sub_scores: { fees: 8.4, features: 9.2, ux: 8.8, support: 9.0 },
    verdict: 'The strongest all-round pick — back-to-back Fund of the Year with a clean regulatory record.',
    attributes: { total_fee_aud_on_50k: 457, flat_admin_fee_aud: null, default_option: 'MySuper Lifecycle (High Growth stage, members ≤55)', ten_year_return_pct: 8.83, return_period_note: 'High Growth stage, 10 years to 30 June 2025', members_millions: 1.2, aum_billions_aud: 200, aum_note: '$200bn+ AUM (2025)', award_note: 'SuperRatings Fund of the Year 2025 AND 2026 (announced 26 Nov 2025); Canstar Outstanding Value Award, 5th consecutive year 2026', mysuper_authorised: true, regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://aware.com.au/',
    is_top_pick: true, best_for: 'Most members wanting an all-round strong fund', display_order: 1,
    source_url: 'https://aware.com.au/member/what-we-offer/fees-and-costs', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'australian-retirement-trust', market: 'au', category: 'superannuation', topic: 'super-funds',
    display_name: 'Australian Retirement Trust', tagline: 'Below-median fees with multiple 2025/26 awards',
    score: 8.9, rating: 0, review_count: 0, clicks: 0, management_fee: 0.6744, account_minimum: 0,
    badges: [{ type: 'green', label: 'Best value' }],
    chips: ['SuperRatings MySuper of the Year 2025', 'Canstar Outstanding Value, 2nd year running', '8.69% p.a. 10-yr return'],
    pros: [
      'Below-median fee on the $50,000 benchmark, backed by multiple 2025/26 awards (SuperRatings MySuper of the Year 2025, Money magazine Best MySuper Lifecycle Product 2026)',
      'Strong 10-year return (8.69% p.a. to 30 June 2025)',
      'Australia\'s 2nd-largest fund, ~2.4 million members',
    ],
    cons: ['Recently absorbed the Qantas Super merger (March 2025) — an operational integration to be aware of, not a compliance issue', 'Lifecycle-based default makes a single return figure only an approximation for any individual member'],
    sub_scores: { fees: 9.0, features: 8.8, ux: 8.6, support: 8.6 },
    verdict: 'The strongest fee-and-award combination in this comparison.',
    attributes: { total_fee_aud_on_50k: 337.20, flat_admin_fee_aud: 57.20, default_option: 'Super Savings Lifecycle Balanced', ten_year_return_pct: 8.69, return_period_note: 'Lifecycle Balanced, 10 years to 30 June 2025', members_millions: 2.4, aum_billions_aud: 330, aum_note: "$330bn+ AUM (2025), Australia's 2nd-largest fund", award_note: 'SuperRatings MySuper of the Year 2025; Money magazine Best MySuper Lifecycle Product 2026 & Best Moderate Pension Product 2026; Canstar Outstanding Value Award, 2nd consecutive year 2026', mysuper_authorised: true, regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.australianretirementtrust.com.au/',
    is_top_pick: false, best_for: 'Value-focused members', display_order: 2,
    source_url: 'https://www.australianretirementtrust.com.au/investments/fees', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'hostplus', market: 'au', category: 'superannuation', topic: 'super-funds',
    display_name: 'Hostplus', tagline: '#1-ranked long-term MySuper performance by SuperRatings',
    score: 8.7, rating: 0, review_count: 0, clicks: 0, management_fee: 1.1382, account_minimum: 0,
    badges: [{ type: 'sky', label: 'Best long-term performance' }],
    chips: ['#1 SuperRatings 10/15/20-yr MySuper performance', 'Money magazine Best Super Fund 2026', '8.32% p.a. 10-yr return'],
    pros: [
      'SuperRatings ranks Hostplus #1 for MySuper performance over 10, 15 AND 20 years to 30 June 2025',
      'Money magazine named it Best Super Fund 2026 overall',
      'Canstar Outstanding Value Award, 9th consecutive year',
    ],
    cons: ['Higher total fee load than peers once performance fees are included (~1.14% vs ~0.7% industry-fund norm)', "Member/AUM figures varied across sources at research time — confirm against the fund's latest factsheet"],
    sub_scores: { fees: 7.4, features: 9.4, ux: 8.6, support: 8.6 },
    verdict: 'The strongest long-term track record in this comparison, at a higher fee.',
    attributes: { total_fee_aud_on_50k: 569.10, flat_admin_fee_aud: 78, default_option: 'Balanced (MySuper)', ten_year_return_pct: 8.32, return_period_note: 'Balanced (MySuper), 10 years to 30 June 2025 — SuperRatings #1 over 10, 15 and 20 years', members_millions: 1.8, aum_billions_aud: 115, aum_note: "Member/AUM figures conflicted across sources at research time (1.8-2.1M members; $115-145bn AUM cited) — confirm against Hostplus' latest factsheet", award_note: 'Money magazine Best Super Fund 2026 & Best Balanced Super Product; Canstar Outstanding Value Award, 9th consecutive year 2026; SuperRatings 10-yr Platinum (MySuper), 20-yr Platinum (core fund)', mysuper_authorised: true, regulatory_note: '' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://hostplus.com.au/',
    is_top_pick: false, best_for: 'Members prioritising long-term performance', display_order: 3,
    source_url: 'https://hostplus.com.au/members/our-products-and-services/super/fees-charges', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'unisuper', market: 'au', category: 'superannuation', topic: 'super-funds',
    display_name: 'UniSuper', tagline: 'SuperRatings Fund of the Year 2026, majority in-house managed',
    score: 8.5, rating: 0, review_count: 0, clicks: 0, management_fee: 0.812, account_minimum: 0,
    badges: [],
    chips: ['SuperRatings Fund of the Year 2026', 'Below-median fee ($406 on $50k)', '>70% of assets managed in-house'],
    pros: [
      'SuperRatings named UniSuper Fund of the Year 2026 (and Retirement Offering of the Year 2025)',
      'Below-median fee relative to the ~$467 industry median',
      'Over 70% of assets managed in-house, an unusual structural strength',
    ],
    cons: [
      'A severe April 2024 cloud-infrastructure misconfiguration by Google Cloud deleted UniSuper\'s private-cloud subscription, locking 620,000+ members out of online accounts for over a week (resolved, disclosed for transparency)',
      'Investment fee % not cleanly isolated from admin fee in available sources at research time',
    ],
    sub_scores: { fees: 8.6, features: 8.8, ux: 7.8, support: 8.4 },
    verdict: 'A strong, award-winning fund — weigh its most severe documented outage below.',
    attributes: { total_fee_aud_on_50k: 406, flat_admin_fee_aud: 96, default_option: 'Balanced (MySuper)', ten_year_return_pct: 7.7, return_period_note: 'Balanced (MySuper), 10 years to 30 June 2025', members_millions: 0.65, aum_billions_aud: 139, aum_note: "647,000-680,495 members cited across sources; $139bn (30 June 2024) growing toward ~$170bn by an April 2026 report — confirm against UniSuper's latest factsheet", award_note: 'SuperRatings Super Fund of the Year 2026 (also Retirement Offering of the Year 2025, Fund of the Year 2024); Money magazine Best Pension Fund 2025; 20-Year Platinum Performance Fund 2005-2025', mysuper_authorised: true, regulatory_note: "In April 2024, a Google Cloud misconfiguration deleted UniSuper's entire private-cloud infrastructure subscription, locking 620,000+ members out of online accounts for over a week. Backups held with a separate provider minimised data loss; APRA said it was monitoring. This is a resolved operational incident (not an ongoing compliance matter) and predates the 2025/2026 research window, but remains the most severe documented member-access disruption among the funds researched for this page — disclosed for transparency." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.unisuper.com.au/',
    is_top_pick: false, best_for: 'Members wanting in-house-managed assets', display_order: 4,
    source_url: 'https://www.unisuper.com.au/super/fees-and-costs', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'hesta', market: 'au', category: 'superannuation', topic: 'super-funds',
    display_name: 'HESTA', tagline: 'Consecutive SuperRatings Net Benefit Awards, health & community-services focus',
    score: 8.2, rating: 0, review_count: 0, clicks: 0, management_fee: 0.774, account_minimum: 0,
    badges: [],
    chips: ['SuperRatings Net Benefit Award 2025 & 2026', 'Chant West 5 Apples 2025', 'Low $52/yr flat admin fee'],
    pros: [
      'SuperRatings Net Benefit Award winner in both 2025 and 2026 (best net-benefit outcomes to members)',
      'Chant West Specialist Fund of the Year 2025 (5 Apples rating), SuperRatings Platinum',
      'One of the lowest flat admin fees in this comparison ($52/yr)',
    ],
    cons: ['10-year return (7.40-7.64% p.a.) trails the top performers in this comparison (AustralianSuper, ART, Hostplus, Aware all above 7.9-8.8%)', 'Some fee-page content required a re-fetch to reconcile during research — recommend a final spot-check against the PDS'],
    sub_scores: { fees: 9.0, features: 8.2, ux: 8.4, support: 8.6 },
    verdict: 'Strong net-benefit track record and low admin fee, with more modest headline returns.',
    attributes: { total_fee_aud_on_50k: 387, flat_admin_fee_aud: 52, default_option: 'Balanced Growth (MySuper)', ten_year_return_pct: 7.52, return_period_note: 'Balanced Growth (MySuper), 10 years to 30 June 2025 (fund cites 7.40-7.64% across slightly different periods; midpoint used)', members_millions: 1.0, aum_billions_aud: 105, aum_note: '1 million+ members; ~$105bn AUM (FY2025-26 reporting)', award_note: 'SuperRatings Net Benefit Award 2025 and 2026; Chant West Specialist Fund of the Year 2025 (5 Apples); SuperRatings Platinum rating', mysuper_authorised: true, regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.hesta.com.au/',
    is_top_pick: false, best_for: 'Health & community-services members', display_order: 5,
    source_url: 'https://www.hesta.com.au/members/your-superannuation/fees-and-costs', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'rest-super', market: 'au', category: 'superannuation', topic: 'super-funds',
    display_name: 'Rest Super', tagline: 'Large-scale fund with transparent MySuper dashboard fee reporting',
    score: 7.6, rating: 0, review_count: 0, clicks: 0, management_fee: 0.816, account_minimum: 0,
    badges: [],
    chips: ['~2 million members', 'Transparent MySuper Product Dashboard', 'Retail/hospitality-sector heritage'],
    pros: [
      'Large scale (~2 million members) with broad relevance beyond its retail-sector origins',
      'Publishes a transparent MySuper Product Dashboard fee breakdown',
      'Age-based lifecycle default (Core Strategy) tailors growth exposure to member age',
    ],
    cons: ['Lowest 10-year return of the 7 funds researched (6.56% p.a. to 30 June 2025)', 'No major 2025/2026 "fund of the year"-tier award found at research time'],
    sub_scores: { fees: 8.2, features: 7.4, ux: 8.2, support: 8.0 },
    verdict: "A large, transparent fund whose recent long-term performance trails its peers.",
    attributes: { total_fee_aud_on_50k: 408, flat_admin_fee_aud: 78, default_option: 'Core Strategy (age-based lifecycle MySuper)', ten_year_return_pct: 6.56, return_period_note: 'Core Strategy, 10 years to 30 June 2025', members_millions: 2.0, aum_billions_aud: 100, aum_note: "~$100bn AUM (31 July 2025); a ~$112bn (30 June 2026) figure was also cited but close to the research date and unverified — confirm against Rest's latest factsheet", award_note: 'No major 2025/2026 SuperRatings/Canstar/Money magazine award found at research time — check rest.com.au/why-rest/awards directly for smaller-category recognitions', mysuper_authorised: true, regulatory_note: '' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://rest.com.au/',
    is_top_pick: false, best_for: 'Members from retail & hospitality backgrounds', display_order: 6,
    source_url: 'https://rest.com.au/investments/mysuper-product-dashboard', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'australiansuper', market: 'au', category: 'superannuation', topic: 'super-funds',
    display_name: 'AustralianSuper', tagline: "Australia's largest fund — with an active ASIC case disclosed",
    score: 7.3, rating: 0, review_count: 0, clicks: 0, management_fee: 0.734, account_minimum: 0,
    badges: [],
    chips: ["Australia's largest fund, 3.6M+ members", '15 consecutive years Canstar value award', '⚠ Active ASIC Federal Court case — see detail'],
    pros: [
      "Australia's largest fund by both members (3.6M+) and assets (A$410bn+), with the lowest relative fee among the largest-scale funds",
      'Strong 10-year return (7.94% p.a. to 30 June 2025)',
      'Canstar Outstanding Value Award, 15th consecutive year — the longest streak in this comparison',
    ],
    cons: [
      'Active, unresolved ASIC Federal Court case alleging failures processing ~6,897 death benefit claims (some delayed up to 1,140 days) — no penalty determined as of this page\'s last verification',
      'The only fund among several targeted in an April 2025 credential-stuffing attack with a confirmed member financial loss (A$500,000 across 4 members, one losing A$406,000)',
    ],
    sub_scores: { fees: 9.2, features: 8.6, ux: 8.0, support: 6.8 },
    verdict: "Australia's largest and one of its lowest-fee funds — read the disclosed regulatory matter below before choosing.",
    attributes: { total_fee_aud_on_50k: 367, flat_admin_fee_aud: 52, default_option: 'Balanced (MySuper)', ten_year_return_pct: 7.94, return_period_note: 'Balanced (MySuper), 10 years to 30 June 2025', members_millions: 3.6, aum_billions_aud: 410, aum_note: "3.6 million+ members; A$410bn+ AUM as at 31 Dec 2025 — Australia's largest fund", award_note: 'Canstar Outstanding Value Award — Superannuation, 15th consecutive year (2011-2026)', mysuper_authorised: true, regulatory_note: 'ASIC filed a Federal Court lawsuit against AustralianSuper on 30 May 2025 (media release 25-034MR) alleging the fund failed to efficiently process approximately 6,897 death benefit claims between 1 July 2019 and 18 October 2024, with some claims taking up to 1,140 days; AustralianSuper is disputing the allegations and the case remains ongoing (case management hearings continuing through 2026), with no penalty determined as of this page\'s last verification. Separately, in an April 2025 credential-stuffing cyberattack that also targeted several other super funds, AustralianSuper was the only fund among the group with a confirmed member financial loss — A$500,000 combined across 4 members, including one member who lost A$406,000.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.australiansuper.com/',
    is_top_pick: false, best_for: 'Read the disclosed ASIC matter before choosing', display_order: 7,
    source_url: 'https://www.australiansuper.com/why-choose-us/fees-costs', data_verified_at: '2026-07-11', active: true,
  },
];

const aiTools = [
  {
    slug: 'xero-jax', market: 'au', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Xero (JAX)', tagline: 'AI bank reconciliation and cashflow insight, free on every plan',
    score: 9.0, rating: 4.4, review_count: 1674, clicks: 1674, monthly_fee: 35,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['JAX bundled free on every tier', 'From A$35/month', 'Auto bank-rec, cashflow insights'],
    pros: [
      'JAX (generative-AI assistant) is bundled free into every plan, including the cheapest at A$35/month',
      'Automated bank reconciliation (80%+ auto-matched per one source) plus predictive cashflow and natural-language ledger Q&A',
      'Largest AU accounting-software incumbent, strong G2 score (4.4/5, 1,674 reviews)',
    ],
    cons: ['Trustpilot score (3.7/5) notably lower than G2, with support and pricing-increase complaints', 'An unconfirmed Feb 2026 dark-web listing claimed to contain Xero customer contact data — Xero has not confirmed a breach; worth monitoring'],
    sub_scores: { fees: 8.8, features: 9.4, ux: 8.8, support: 8.0 },
    verdict: 'The best free-with-every-plan AI assistant from Australia\'s largest accounting incumbent.',
    attributes: { pricing_model: 'flat_subscription', starting_price_note: 'Ignite $35/mo, Grow $75/mo, Comprehensive $100/mo, Ultimate from $130/mo, all AUD GST-inclusive. JAX is included at no extra charge on every tier, including Ignite.', target_segment: 'accounting_automation', ai_features_note: 'JAX ("Just Ask Xero") does automated bank reconciliation, transaction matching, predictive cashflow/payment-timing insights, and natural-language Q&A over the ledger.', free_tier_or_trial: false, review_score: 4.4, review_count: 1674, review_source: 'G2', review_note: 'Trustpilot shows a notably lower 3.7/5 (~536+ reviews) — support and pricing-increase complaints are the main driver of the gap.', regulatory_note: 'An unconfirmed Feb 2026 dark-web forum listing advertised a database allegedly exfiltrated from Xero (names, business emails, phone numbers) for $1,000 — this has not been confirmed as a breach by Xero directly; disclosed as an unresolved claim worth monitoring, not a confirmed incident.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.xero.com/au/',
    is_top_pick: true, best_for: 'Most AU small businesses already on accounting software', display_order: 1,
    source_url: 'https://www.xero.com/au/pricing-plans/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'employment-hero', market: 'au', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Employment Hero', tagline: 'The most accessible free AI tier of the 7 — 50 free AI interviews',
    score: 8.7, rating: 4.6, review_count: 164, clicks: 164, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Best free AI tier' }],
    chips: ['Free AI Recruitment Agent (50 interviews)', 'Consistent 4.3-4.6 across 3 platforms', '24/7 AI video screening'],
    pros: [
      'AI Recruitment Agent (24/7 automated video screening/scoring) is accessible from the completely free ATS tier — no subscription required',
      'Consistently strong review scores across all three major platforms (Capterra 4.4, G2 4.6, Trustpilot 4.3 — an unusually tight, credible band)',
      'Clear payroll-HR AI use case once you scale into paid tiers',
    ],
    cons: ['An ongoing Federal Court dispute with Seek over job-board API access could disrupt distribution features if Employment Hero loses', 'March 2025 "platform misuse" incident (scammers) was reported — Employment Hero denies an actual data breach'],
    sub_scores: { fees: 9.4, features: 8.6, ux: 8.8, support: 8.6 },
    verdict: 'The easiest way to try AI-powered hiring automation without paying anything.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Free ATS tier includes 50 complimentary AI video interviews, no subscription required. Paid recruitment tiers scale $199-$959/month for 50-300 monthly AI interviews. Core HR/payroll plans start separately at $10/employee/month (10-user minimum).', target_segment: 'payroll_hr', ai_features_note: 'AI Recruitment Agent automatically scores, screens and conducts 24/7 video interviews with job applicants; higher HR tiers add broader AI-powered hiring/workflow automation.', free_tier_or_trial: true, review_score: 4.6, review_count: 164, review_source: 'G2', review_note: 'Capterra 4.4/5 (218 reviews) and Trustpilot 4.3/5 (129 reviews) are both closely consistent with the G2 figure — an unusually tight, credible band across all three platforms.', regulatory_note: 'An ongoing Federal Court dispute with Seek over API access (Seek sought to terminate Employment Hero\'s job-board API access from 25 Aug 2025; the court ordered Seek to maintain access pending the case) is a live legal/business matter, not a security incident. Separately, in March 2025 Employment Hero confirmed "an instance of platform misuse" by scammers following social-media allegations, but denied an actual data breach.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://employmenthero.com/au/',
    is_top_pick: false, best_for: 'Businesses hiring at volume wanting free AI screening first', display_order: 2,
    source_url: 'https://employmenthero.com/au/pricing/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'dext', market: 'au', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Dext', tagline: 'Purpose-built AI receipt & invoice OCR, widely used by AU accountants',
    score: 8.6, rating: 4.6, review_count: 312, clicks: 312, monthly_fee: 47,
    badges: [{ type: 'sky', label: 'Highest reviewed' }],
    chips: ['Highest G2 score of the 7 (4.6/5)', 'AI-OCR receipt/invoice extraction', 'Syncs to Xero & MYOB'],
    pros: [
      'Highest independent review score among all 7 candidates (G2 4.6/5, 312 reviews)',
      'Purpose-built AI-OCR for receipts, invoices and supplier statements, widely used by AU accountants and bookkeepers',
      'Complements rather than competes with Xero/MYOB via direct sync',
    ],
    cons: ['AU-specific AUD pricing could not be independently confirmed — the figure shown is a converted estimate from USD-denominated sources, get a live quote via the AU plan builder before committing', 'Per-user + document-credit pricing is harder to headline as one number than flat-tier competitors'],
    sub_scores: { fees: 8.2, features: 9.0, ux: 8.6, support: 8.4 },
    verdict: 'The highest-rated tool in this comparison, purpose-built for receipt and invoice automation.',
    attributes: { pricing_model: 'per_user_usage', starting_price_note: "Estimated ~A$47/month (5 users, 250 documents) converted from a USD-denominated figure (~$31.50 USD/mo) found in secondary sources — Dext's AU plan builder is dynamic and did not return a static AUD figure at research time; confirm live pricing directly.", target_segment: 'bookkeeping_ocr', ai_features_note: 'OCR-based automated data extraction from receipts, invoices and bank statements with line-item extraction and supplier-statement reconciliation, syncing into Xero, MYOB and other accounting platforms.', free_tier_or_trial: true, review_score: 4.6, review_count: 312, review_source: 'G2', review_note: 'Capterra shows a slightly lower but still strong 4.3/5 (158 reviews).', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://dext.com/au/',
    is_top_pick: false, best_for: 'Accountants & bookkeepers serving many clients', display_order: 3,
    source_url: 'https://dext.com/au/pricing/prepare', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'frollo', market: 'au', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Frollo', tagline: 'Free AI-powered open banking budgeting, CDR-based',
    score: 7.8, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['Free consumer app', 'CDR-based open banking', 'AI transaction categorisation'],
    pros: [
      'Completely free consumer budgeting app plus a free broker portal',
      'AI-powered transaction categorisation and spending insights on top of Consumer Data Right (CDR) open-banking aggregation',
      'Broker portal integrates AI-assisted bank-statement categorisation with ApplyOnline loan applications',
    ],
    cons: ['Review data is genuinely conflicting: one source cites Google Play 4.6, another cites 3.1/5 (405 reviews) — could not be reconciled, shown as not yet rated rather than guessed', 'User reviews (via search snippets) mention categorisation bugs and at least one report of lost transaction history after account relinking'],
    sub_scores: { fees: 9.6, features: 7.8, ux: 7.2, support: 7.0 },
    verdict: 'A genuinely free, CDR-based AI budgeting option — review data is unresolved, see detail.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Frollo for You (consumer app) and Frollo for Brokers (broker portal) are both free. Frollo for Business (enterprise data platform) has no published price.', target_segment: 'budgeting', ai_features_note: 'AI-powered transaction categorisation and spending insights on CDR open-banking account aggregation; for brokers, AI-assisted categorisation of bank statement data feeding into ApplyOnline loan applications.', free_tier_or_trial: true, review_score: null, review_count: null, review_source: 'Conflicting sources', review_note: 'Google Play rating conflicts across sources found (4.6 vs 3.1/5, 405 reviews); Trustpilot shows 3.2/5 but only ~3 reviews (too small to be credible); G2 listing exists but has no live reviews. Shown as not yet rated rather than guessing a number.', regulatory_note: '' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.frollo.com.au/',
    is_top_pick: false, best_for: 'Individuals & brokers wanting free CDR budgeting', display_order: 4,
    source_url: 'https://www.frollo.com.au/frollo-app/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'myob-ai-bas', market: 'au', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'MYOB (AI BAS)', tagline: 'AI-assisted GST/BAS preparation for AU small business',
    score: 7.6, rating: 4.0, review_count: 139, clicks: 139, monthly_fee: 1,
    badges: [],
    chips: ['AI BAS add-on from A$1/month', 'Flags missing docs & GST issues', 'Large incumbent, broad AU trust'],
    pros: [
      'AI BAS directly targets a painful AU-specific compliance task (quarterly GST/BAS prep) from as little as A$1/month',
      'Works progressively through the quarter, flagging missing documents and GST issues before the deadline',
      'Large, well-established AU small-business accounting incumbent',
    ],
    cons: ['AI BAS does NOT auto-lodge to the ATO — a BAS agent or the user still lodges manually via myGov/agent portal', 'Core AI Business Insights and Smart Reconciliation features remain in beta, and MYOB showed a notably high 2026 outage/maintenance frequency (33 incidents in a 90-day window per one tracker)'],
    sub_scores: { fees: 8.8, features: 7.6, ux: 7.4, support: 7.0 },
    verdict: 'A low-cost, AU-specific BAS/GST assistant — note it does not auto-lodge to the ATO.',
    attributes: { pricing_model: 'bundle_tier', starting_price_note: 'AI BAS add-on from A$1/month (billed yearly) for eligible non-employing MYOB Business Lite/Pro customers, available since 3 June 2026. Full AI Business Insights + Smart Reconciliation requires MYOB Business Pro ($21/mo intro, $70/mo standard).', target_segment: 'accounting_automation', ai_features_note: 'AI BAS connects to MYOB Business data, progressively flags missing documents/GST issues through the quarter, auto-categorises bank-feed transactions and calculates GST — but does not lodge directly to the ATO. Smart Reconciliation and AI Business Insights (Pro tier) remain in beta.', free_tier_or_trial: false, review_score: 4.0, review_count: 139, review_source: 'G2', review_note: 'Lowest G2 score of the accounting-software candidates in this comparison; Capterra shows 148 reviews with score not independently isolated.', regulatory_note: 'A notably high 2026 outage/maintenance frequency was found for MYOB Business/AccountRight/Practice Management — 33 incidents in a 90-day window per one uptime tracker (median ~6h13m), including a multi-day maintenance lockdown 8-11 May 2026. No confirmed data breach found.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.myob.com/au',
    is_top_pick: false, best_for: 'GST-registered small businesses wanting BAS help', display_order: 5,
    source_url: 'https://www.myob.com/au/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'wemoney', market: 'au', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'WeMoney', tagline: 'Free debt-tracking app with a large AU user base',
    score: 7.2, rating: 3.4, review_count: 100000, clicks: 100000, monthly_fee: 0,
    badges: [],
    chips: ['Free, 1.35M+ downloads', 'Debt consolidation matching', 'Credit score tracking'],
    pros: [
      'Completely free with a large established AU user base (1.35M+ downloads)',
      'Account aggregation, debt-consolidation matching, subscription detection and credit-score tracking in one app',
      'Community/peer support features alongside the core budgeting tools',
    ],
    cons: ['No explicit, verifiable "AI" feature description was found on the official site — positioning is weaker/less substantiated than the other candidates on this page, disclosed rather than inflated', 'Google Play rating (3.4/5, 100K reviews) is notably lower than the App Store (4.3/5, 1.7K reviews), suggesting Android-specific issues'],
    sub_scores: { fees: 9.4, features: 6.8, ux: 7.2, support: 7.0 },
    verdict: "A large, free debt-tracking app — its AI positioning is the least substantiated of the 7 candidates here.",
    attributes: { pricing_model: 'freemium', starting_price_note: 'Entirely free — no explicit AI-gated paid tier found on the official site.', target_segment: 'budgeting', ai_features_note: 'Official site content did not explicitly document a discrete named AI capability (unlike Frollo\'s documented categorisation AI) — described features are account aggregation, debt-consolidation matching, subscription detection and credit-score tracking. Kept in this comparison per the approved shortlist, but the AI claim is disclosed as less substantiated than its peers.', free_tier_or_trial: true, review_score: 3.4, review_count: 100000, review_source: 'Google Play', review_note: 'Apple App Store shows a notably higher 4.3/5 (1.7K reviews) — the Google Play figure is shown as primary due to its much larger sample size (100K reviews).', regulatory_note: '' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://wemoney.com.au/',
    is_top_pick: false, best_for: 'Users focused on debt payoff/consolidation', display_order: 6,
    source_url: 'https://wemoney.com.au/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'airwallex-au-ai', market: 'au', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Airwallex (Expense Policy Agent)', tagline: 'AI expense-policy enforcement — with an active AUSTRAC audit disclosed',
    score: 6.8, rating: 4.4, review_count: 49, clicks: 49, monthly_fee: 99,
    badges: [],
    chips: ['AI Expense Policy Agent', 'From A$99/month (Grow plan)', '⚠ Active AUSTRAC audit — see detail'],
    pros: [
      'Expense Policy Agent turns a written expense policy into an always-on AI reviewer, checking every claim the moment it posts across entities, currencies and languages',
      'Melbourne-founded fintech at a $11B valuation (Series H, June 2026), native multi-entity/multi-currency fit for AU businesses operating internationally',
    ],
    cons: ["AUSTRAC has ordered an external audit of Airwallex's Australian Designated Business Group over suspected AML/CTF compliance failures — active and unresolved", 'Recurring account-freeze complaints in reviews; Trustpilot score (~3.3-3.5/5) notably lower than G2 (~4.2-4.5/5), and review counts were inconsistent across sources'],
    sub_scores: { fees: 7.6, features: 8.8, ux: 7.8, support: 6.4 },
    verdict: 'A genuinely capable AI expense tool — read the disclosed AUSTRAC audit below before choosing.',
    attributes: { pricing_model: 'bundle_tier', starting_price_note: 'Explore is $0-29/mo but does NOT include the Expense Policy Agent. Grow ($99/mo, "Best Value") and Accelerate (from $999/mo) both include it. All AUD, GST-inclusive, per business entity.', target_segment: 'spend_management', ai_features_note: 'Expense Policy Agent reads a company\'s written expense policy and acts as an always-on AI reviewer, checking every reimbursement/receipt claim on posting across entities/currencies/languages, flagging duplicates and policy violations with policy-linked explanations. (Airwallex\'s broader "T:0" AI finance-team suite remains private-beta with unconfirmed AU availability — not used for this comparison.)', free_tier_or_trial: false, review_score: 4.4, review_count: 49, review_source: 'G2', review_note: 'G2 figures varied 4.2-4.5/5 (40-52 reviews) across sources found; Trustpilot figures varied 3.3-3.5/5 (1,700-2,390 reviews) across sources — directionally G2 is clearly positive while Trustpilot is clearly mixed, consistent with positive product-feature reviews on G2 versus account-freeze/support complaints on Trustpilot. Recommend a direct re-check before treating either figure as final.', regulatory_note: "AUSTRAC has ordered an external audit of Airwallex's Australian Designated Business Group over suspected AML/CTF compliance failures — an active, unresolved regulatory matter as of this page's last verification (primary source: austrac.gov.au). Separately, recurring account-freeze dispute complaints appear in reviews (including a referenced AFCA complaint from an Australian customer over A$8,000 withheld); a US patent lawsuit (Intercurrency Software) was dismissed with prejudice in September 2025 and is resolved, not an ongoing risk." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.airwallex.com/au',
    is_top_pick: false, best_for: 'Multi-entity businesses weighing the active audit', display_order: 7,
    source_url: 'https://www.airwallex.com/au/pricing', data_verified_at: '2026-07-11', active: true,
  },
];

const cybersecurity = [
  {
    slug: '1password-business-au', market: 'au', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: '1Password Business', tagline: 'Transparent pricing and the largest, most consistent review base',
    score: 9.0, rating: 4.7, review_count: 2128, clicks: 2128, monthly_fee: 13,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Transparent published pricing', 'Largest review base of the 7 (2,128 Capterra)', 'SSO integrations for growing teams'],
    pros: [
      'One of only 3 of the 7 vendors with fully transparent, published self-serve pricing (~A$13/user/month)',
      'Largest and most consistent review base found (Capterra 4.7/5, 2,128 reviews)',
      'SSO integrations (Okta, Entra ID, OneLogin, Duo) and role-based vault sharing suit growing SMB teams',
    ],
    cons: ['Recent price increase (from $7.99 to $8.99 USD/user/month)', 'Password-manager category only — does not cover endpoint/malware protection'],
    sub_scores: { fees: 8.4, features: 9.0, ux: 9.2, support: 8.8 },
    verdict: 'The most transparent, best-attested pick in this comparison.',
    attributes: { pricing_model: 'per-user/month', starting_price_note: '$8.99 USD/user/month (Business, billed annually), confirmed on the official pricing page; converts to an estimated ~A$13/user/month (no native AUD price shown). Teams Starter Pack: $24.95 USD/month flat for 10 users.', product_category: 'password_manager', key_feature_note: 'SSO integrations (Okta, Entra ID, OneLogin, Duo) and role-based vault sharing for growing SMB teams moving past shared-password chaos.', au_presence_note: 'No AU-specific office or data-residency claim found — global product.', review_score: 4.7, review_count: 2128, review_source: 'Capterra', security_note: 'No confirmed platform breach found in 2025-2026. Recurring phishing campaigns impersonate 1Password\'s "Watchtower" brand (fake breach alerts from spoofed domains) — a social-engineering risk to train staff on, not a 1Password system compromise. Historical indirect exposure via the 2023 Okta breach (a third party 1Password integrates with) is also part of the public record.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://1password.com/business/',
    is_top_pick: true, best_for: 'Growing teams wanting SSO + transparent pricing', display_order: 1,
    source_url: 'https://1password.com/pricing/password-manager', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'bitdefender-au', market: 'au', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Bitdefender GravityZone', tagline: 'SMB-sized endpoint protection with a genuine new Melbourne office',
    score: 8.7, rating: 4.6, review_count: 208, clicks: 208, monthly_fee: 7,
    badges: [{ type: 'green', label: 'Best local AU support' }],
    chips: ['New Melbourne office (2025-26)', 'SMB-tiered up to 30 endpoints', 'Ransomware rollback'],
    pros: [
      'Genuine local Australian presence — acquired longtime AU/NZ partner SMS eTech and opened a direct Melbourne office in 2025-26',
      'SMB-sized tiers (up to 30 endpoints) with ransomware remediation/rollback and a single-pane console',
      'Strong Capterra score (4.6/5, 208 reviews)',
    ],
    cons: ['No self-serve published pricing — official page uses an interactive calculator with no static price; the figure shown is a third-party estimate', 'Lower G2 score (4.0/5, 72 reviews) than Capterra, and user complaints about steep renewal-price jumps after the promo year'],
    sub_scores: { fees: 8.4, features: 9.0, ux: 8.4, support: 8.6 },
    verdict: 'The strongest combination of local AU support and SMB-sized endpoint protection.',
    attributes: { pricing_model: 'per-device/year', starting_price_note: 'No official self-serve price published (interactive calculator only). Third-party estimate: Small Business Security ~$57 USD/device/yr (≤30 endpoints) ≈ A$6.84/month, Business Security ~$74/device/yr, Business Security Premium (EDR) ~$95.89/device/yr — unverified against an official quote, get a direct quote before committing.', product_category: 'endpoint_protection', key_feature_note: 'SMB-tiered line up to 30 endpoints with ransomware remediation/rollback and a single-pane management console, sized below the enterprise GravityZone tiers.', au_presence_note: 'Genuine local presence: acquired longtime AU/NZ partner SMS eTech and opened a direct Melbourne office in 2025-26; Bluechip Infotech holds ANZ distribution.', review_score: 4.6, review_count: 208, review_source: 'Capterra', review_note: 'G2 shows a lower 4.0/5 (72 reviews); TrustRadius shows 8.3/10 (185 reviews).', security_note: 'No Bitdefender-specific breach found at research time — search results surfaced only Bitdefender\'s own industry threat-research publications, not incidents affecting Bitdefender itself.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.bitdefender.com/business/',
    is_top_pick: false, best_for: 'AU businesses wanting local support', display_order: 2,
    source_url: 'https://www.bitdefender.com/en-us/business/smb-products/business-security', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'crowdstrike-au-smb', market: 'au', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'CrowdStrike Falcon Go', tagline: 'Top-tier EDR pedigree in a cheap SMB entry tier',
    score: 8.4, rating: 4.7, review_count: 385, clicks: 385, monthly_fee: 12,
    badges: [],
    chips: ['Purpose-built SMB entry tier', '30-day money-back guarantee', 'Top-tier EDR pedigree'],
    pros: [
      'Falcon Go is a purpose-built SMB bundle (next-gen AV, USB device control, mobile protection, "Express Support") from a top-tier EDR vendor',
      '30-day money-back guarantee and strong overall review score (G2 4.7/5, 385 reviews)',
      'Sydney office for APAC sales/support',
    ],
    cons: ['The July 2024 global outage — a faulty Falcon sensor update bricked ~8.5M Windows devices worldwide, with major airline disruption and litigation still live through 2025-26 — is the most severe documented incident of any vendor in this comparison', 'Falcon Go lacks true EDR; real detection/response requires upgrading to the pricier Falcon Pro or Enterprise tiers, and Capterra users rate "value for money" a lower 4.2/5'],
    sub_scores: { fees: 7.8, features: 9.2, ux: 8.6, support: 8.4 },
    verdict: 'Elite EDR pedigree at an SMB price point — weigh the disclosed 2024 outage below.',
    attributes: { pricing_model: 'per-device/month or /year', starting_price_note: 'Falcon Go: $7.99 USD/device/month or $59.99 USD/device/year, capped at 100 devices. No native AUD price found; converts to an estimated ~A$11.50/device/month.', product_category: 'endpoint_protection', key_feature_note: 'Falcon Go bundles next-gen AV, USB device control and mobile protection with "Express Support" for SMBs — full EDR/response requires the pricier Falcon Pro ($14.99) or Enterprise ($19.99) tiers.', au_presence_note: 'CrowdStrike has a Sydney office (APAC sales/support); no AU-specific data-residency claim found.', review_score: 4.7, review_count: 385, review_source: 'G2', review_note: 'Capterra shows the same 4.7/5 (55 reviews) but "value for money" specifically rated lower at 4.2/5.', security_note: 'CrowdStrike caused a catastrophic global IT outage on 19 July 2024 when a faulty Falcon sensor update bricked approximately 8.5 million Windows devices worldwide (airlines, hospitals, banks affected); litigation remains live through 2025-26, including a Delta Air Lines lawsuit seeking roughly $500M in damages. Separately, in 2025 CrowdStrike terminated an employee for leaking internal data to the "Scattered Lapsus$ Hunters" hacker collective. Both disclosed in full given the severity and relevance to a security-product comparison.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.crowdstrike.com/en-au/',
    is_top_pick: false, best_for: 'Businesses wanting top-tier EDR pedigree', display_order: 3,
    source_url: 'https://www.crowdstrike.com/en-us/pricing/falcon-go/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'bitwarden-au', market: 'au', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Bitwarden', tagline: 'The cheapest per-seat password manager, with a self-hosting option',
    score: 8.2, rating: 4.9, review_count: 903, clicks: 903, monthly_fee: 6,
    badges: [],
    chips: ['Cheapest per-seat of the group', 'Self-hosting for AU data residency', '#1 G2 Enterprise Grid, 11 quarters running'],
    pros: [
      'Cheapest per-seat pricing of the 7 (Teams: ~A$5.75/user/month)',
      'Open-source, independently-audited codebase with a self-hosting option on Enterprise — relevant for AU businesses with data-residency concerns',
      'Strong G2 standing: #1 in the Enterprise Grid password-manager category for 11 consecutive quarters, 98/100 satisfaction score',
    ],
    cons: ['A malicious version of the Bitwarden CLI npm package was live for roughly 90 minutes in April 2026 as part of a broader supply-chain campaign — disclosed below', 'No AU-specific office, distributor or data-residency claim found — smallest AU footprint of the 7'],
    sub_scores: { fees: 9.4, features: 8.4, ux: 8.6, support: 8.0 },
    verdict: 'The best-value password manager here, with a real AU data-residency option via self-hosting.',
    attributes: { pricing_model: 'per-user/month', starting_price_note: 'Teams: $4.00 USD/user/month (billed annually, 10-person org = $480 USD/yr); Enterprise: $6.00 USD/user/month. No native AUD price; converts to an estimated ~A$5.75/user/month (Teams).', product_category: 'password_manager', key_feature_note: 'Open-source, independently-audited codebase plus a self-hosting option on Enterprise — lets AU businesses with data-residency concerns keep vault infrastructure in-country.', au_presence_note: 'No AU-specific office, distributor or data-residency claim found — global product only.', review_score: 4.9, review_count: 903, review_source: 'G2 (98/100 satisfaction score)', review_note: 'Capterra shows 4.7/5 (215 reviews, an older snapshot showed 141).', security_note: 'On 22 April 2026, a malicious version of the Bitwarden CLI npm package (@bitwarden/cli@2026.4.0) was live for approximately 1.5 hours as part of a broader "Shai-Hulud"/TeamPCP supply-chain campaign, stealing SSH keys, npm tokens and AWS credentials from roughly 334 downloaders. Bitwarden confirmed no vault data was accessed and the impact was scoped strictly to CLI/developer users, not the password-manager app itself — disclosed in full despite the limited scope.' },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://bitwarden.com/business/',
    is_top_pick: false, best_for: 'Budget-conscious teams wanting self-hosting', display_order: 4,
    source_url: 'https://bitwarden.com/pricing/business/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'eset-au', market: 'au', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'ESET PROTECT', tagline: 'Dual-city AU offices with a tiered upgrade path',
    score: 7.8, rating: 4.7, review_count: 1169, clicks: 1169, monthly_fee: 0,
    badges: [],
    chips: ['Sydney + Melbourne offices', 'Tiered Entry/Advanced/Complete/MDR path', 'GST-inclusive AU billing'],
    pros: [
      'Real dual-city AU presence — representative offices in both Sydney (North Sydney) and Melbourne, plus an established reseller and dedicated AU contact',
      'Tiered PROTECT platform lets SMBs start with basic endpoint AV and add EDR/MDR later without switching vendors',
      'Strong Capterra score (4.7/5, though this figure is brand-level, not isolated to the PROTECT product)',
    ],
    cons: ['Zero public list pricing anywhere — quote-only via a contact form, the hardest of the 7 to comparison-shop', 'CVE-2024-11859, a flaw in ESET\'s own Command Line Scanner, was actively exploited by the ToddyCat APT group into 2025 — a genuine product-security concern for a security vendor'],
    sub_scores: { fees: 7.0, features: 8.6, ux: 7.8, support: 8.4 },
    verdict: 'Strong local AU presence and a flexible upgrade path — but no public pricing and a real exploited CVE to weigh.',
    attributes: { pricing_model: 'per-device, custom quote', starting_price_note: 'No public list price found anywhere — ESET AU states pricing is quote-only and "tailored... dependent on years and devices purchased." AU business pages show GST-inclusive pricing once quoted, confirming genuine AUD billing.', product_category: 'endpoint_protection', key_feature_note: 'Tiered PROTECT platform (Entry/Advanced/Complete/MDR) lets SMBs start with basic endpoint AV and add EDR/MDR later without switching vendors.', au_presence_note: 'Strong local presence: representative offices in both Sydney (North Sydney) and Melbourne, an established reseller (Microbe), and a dedicated au.office@eset.com contact.', review_score: 4.7, review_count: 1169, review_source: 'Capterra (brand-level, not isolated to PROTECT specifically)', review_note: 'ESET PROTECT MDR variant separately shows 4.8/5 (16 reviews); G2 score not isolated from search snippets.', security_note: "CVE-2024-11859, a DLL-loading flaw in ESET's own Command Line Scanner, was actively exploited by the ToddyCat advanced persistent threat (APT) group into 2025 — a genuine, disclosed product-security concern rather than a third-party incident." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.eset.com/au/business/',
    is_top_pick: false, best_for: 'Businesses wanting a flexible AV-to-EDR upgrade path', display_order: 5,
    source_url: 'https://www.eset.com/au/business/contact-sales/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'sophos-au', market: 'au', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Sophos Intercept X', tagline: 'Deep-learning endpoint protection with a real Sydney office',
    score: 7.7, rating: 4.5, review_count: 228, clicks: 228, monthly_fee: 0,
    badges: [],
    chips: ['Sydney office (Barangaroo)', 'Deep-learning malware prevention', 'Optional XDR/MDR add-on'],
    pros: [
      'Genuine AU presence — Sydney office at Barangaroo International Towers, plus established AU/NZ distributors',
      'Deep-learning malware prevention with optional XDR/MDR add-on tiers scaled to organisational maturity',
      'Strong cross-platform scores (TrustRadius 8.9/10, 228 reviews) and no self-incident found',
    ],
    cons: ['Zero self-serve pricing — quote-only via reseller, small (1-9 user) deployments reportedly pay markedly more per seat than volume buyers (third-party estimates ~$66/user/yr small vs ~$25/user/yr at 5,000+ seats)', 'Advanced tier alone (no XDR) is the realistic SMB entry point — full XDR/MDR pushes cost and complexity higher'],
    sub_scores: { fees: 6.8, features: 8.8, ux: 8.0, support: 8.4 },
    verdict: 'Strong local presence and no self-incident found — but zero self-serve pricing, budget for a reseller quote.',
    attributes: { pricing_model: 'per-user/year, reseller-quoted', starting_price_note: 'No official price published (quote-only via reseller). Third-party estimates: Intercept X Advanced ~$66 USD/user/yr for small (1-9 user) deployments, dropping to ~$25/user/yr at 5,000+ seats — unverified against an official AU quote, heavily volume-discounted.', product_category: 'endpoint_protection', key_feature_note: 'Deep-learning malware prevention plus optional XDR/MDR add-on tiers scaled to org maturity — the Advanced tier (no XDR) is the realistic SMB entry point.', au_presence_note: 'Genuine AU presence: Sydney office (Barangaroo, International Towers) plus established AU/NZ distributors (Bluechip Infotech, Leader).', review_score: 4.5, review_count: 228, review_source: 'TrustRadius (8.9/10, converted to a 5-point scale)', review_note: 'G2 ~4.4/5 and Capterra ~4.5/5 cited in secondary sources; exact review counts for Intercept X specifically (vs. the Sophos brand overall) were not isolated.', security_note: "No breach or incident affecting Sophos itself was found at research time — search results surfaced only Sophos' own annual Active Adversary threat-research report, not a self-incident." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.sophos.com/en-us/products/endpoint-antivirus',
    is_top_pick: false, best_for: 'Businesses wanting a scalable XDR/MDR upgrade path', display_order: 6,
    source_url: 'https://www.sophos.com/en-us/products/endpoint-security/request-pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'nordlayer-au', market: 'au', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'NordLayer (NordVPN Business)', tagline: 'Simple business VPN/ZTNA — with a January 2026 breach claim disclosed',
    score: 6.9, rating: 0, review_count: 0, clicks: 0, monthly_fee: 12,
    badges: [],
    chips: ['Simple ZTNA/VPN deployment', 'AU distribution via Bluechip IT, ACA Pacific', '⚠ Jan 2026 breach claim — see detail'],
    pros: [
      'Simple deployment for distributed/remote AU teams needing secure network access',
      'AU channel presence via Bluechip IT and ACA Pacific distributors, plus Australian VPN server locations',
    ],
    cons: ['A threat actor claimed a January 2026 breach of Salesforce/Jira-adjacent infrastructure; NordVPN disputes any production impact, calling the leaked data "dummy data" from an old third-party test environment — disclosed as an unresolved claim', 'Category mismatch risk: a VPN does not replace antivirus/EDR or a password manager, and NordVPN itself suggests teams under 4 people may be better served by a personal plan; exact review data could not be confirmed'],
    sub_scores: { fees: 8.0, features: 7.2, ux: 7.8, support: 7.0 },
    verdict: 'A capable, AU-distributed business VPN — read the disclosed breach claim below before choosing.',
    attributes: { pricing_model: 'per-user/month', starting_price_note: 'Lite tier $8-9 USD/user/month (billed annually). No native AUD price found; converts to an estimated ~A$12/user/month.', product_category: 'vpn_network_security', key_feature_note: 'Business ZTNA/VPN with simple deployment; NordVPN itself explicitly suggests teams under 4 people may be better served by a personal plan with a dedicated IP rather than the business product.', au_presence_note: 'No dedicated Nord Security AU office found, but has AU/NZ distribution via Bluechip IT and ACA Pacific, plus Australian VPN server locations.', review_score: null, review_count: null, review_source: 'Not independently confirmed', review_note: 'A NordLayer G2 reviews page exists but an exact aggregate score/count could not be retrieved from search snippets — shown as not yet rated rather than guessed; recommend a direct G2 page check before treating any figure as final.', regulatory_note: 'On 4 January 2026, a threat actor claimed a breach exposing Salesforce/Jira-adjacent development infrastructure; Nord Security\'s forensic response states no evidence of production compromise, describing the leaked data as "dummy data" from a third-party proof-of-concept testing environment roughly 6 months prior. Not a confirmed breach, but real, current negative press disclosed in full given this is a security-product comparison.', security_note: 'See regulatory_note — the January 2026 breach claim is the material disclosure item for this row.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://nordlayer.com/',
    is_top_pick: false, best_for: 'Remote/distributed AU teams needing network access', display_order: 7,
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

await upsert(superFunds, 'superannuation/super-funds (au)');
await upsert(aiTools, 'ai-tools/ai-tools-finance (au)');
await upsert(cybersecurity, 'cybersecurity/cybersecurity-smb (au)');

const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/product_attributes?select=category,topic&market=eq.au&active=eq.true&topic=in.(super-funds,ai-tools-finance,cybersecurity-smb)`,
  { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } },
);
const countRows = await countRes.json();
const counts = {};
for (const r of countRows) {
  const key = `${r.category}/${r.topic}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log('\nActive row counts:', counts);
console.log('\nNext: npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts au superannuation super-funds');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts au ai-tools ai-tools-finance');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts au cybersecurity cybersecurity-smb');
