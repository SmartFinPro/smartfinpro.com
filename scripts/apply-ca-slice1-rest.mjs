#!/usr/bin/env node
// AU/CA/UK rollout Slice CA-1 (personal-finance/robo-advisors,
// business-banking/business-bank-accounts, tax-efficient-investing/
// tfsa-rrsp-platforms) — first Canada slice. Applies seed rows via the
// PostgREST API (upsert on the product_attributes unique constraint), same
// working pattern as apply-au-slice{1,2,3}-rest.mjs (exec_sql RPC and direct
// Postgres connection are both unreachable from this environment).
// Row data mirrors supabase/migrations/20260711180000-20260711180200 exactly
// — those .sql files remain the source-of-truth audit trail; this script is
// the actual write path used to seed prod.
// Usage: node --env-file=.env.local scripts/apply-ca-slice1-rest.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

const roboAdvisors = [
  {
    slug: 'wealthsimple-invest', market: 'ca', category: 'personal-finance', topic: 'robo-advisors',
    display_name: 'Wealthsimple', tagline: 'Broadest account support, no minimum balance',
    score: 9.0, rating: 1.4, review_count: 610, clicks: 610, management_fee: 0.50, account_minimum: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['No minimum balance', 'FHSA, RESP, RRIF & more', 'Daily rebalancing'],
    pros: [
      'Broadest account-type support of any candidate (TFSA, RRSP, FHSA, RESP, RRIF, LIRA, non-registered, corporate)',
      'No minimum balance and daily rebalancing',
      'Largest, most recognized robo-advisor brand in Canada',
    ],
    cons: [
      'Trustpilot score is poor (1.4/5), driven mainly by account-freeze and support-speed complaints, not investment performance',
      'Tax-loss harvesting is gated behind the C$100,000+ Black tier per third-party reviews (not independently confirmed on an official page)',
    ],
    sub_scores: { fees: 8.4, features: 9.4, ux: 8.6, support: 6.6 },
    verdict: 'The most versatile robo-advisor in Canada — broadest accounts, no minimum.',
    attributes: { account_types: ['TFSA', 'RRSP', 'FHSA', 'RESP', 'RRIF', 'LIRA', 'Non-registered', 'Corporate'], regulator_type: 'ciro_dealer', custodian_note: '', cipf_protected: true, auto_rebalancing: true, tax_loss_harvesting: true, tlh_note: 'reportedly gated behind the C$100,000+ Black tier per third-party reviews, not independently confirmed on an official Wealthsimple page', trustpilot_rating: 1.4, trustpilot_count: 610, trustpilot_note: 'ca.trustpilot.com — figure fluctuated 597-657 across snapshots, many reviews conflate Wealthsimple\'s broader banking/crypto products with the investing product specifically', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.wealthsimple.com/en-ca/',
    is_top_pick: true, best_for: 'Most investors wanting one flexible account for everything', display_order: 1,
    source_url: 'https://www.wealthsimple.com/en-ca/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'questwealth-portfolios', market: 'ca', category: 'personal-finance', topic: 'robo-advisors',
    display_name: 'Questwealth Portfolios', tagline: 'The lowest management fee among full-service robo-advisors',
    score: 8.7, rating: 1.3, review_count: 393, clicks: 393, management_fee: 0.25, account_minimum: 1000,
    badges: [{ type: 'green', label: 'Best value' }],
    chips: ['Lowest fee: 0.25% (0.20% above $100K)', 'C$1,000 minimum', 'TipRanks research integration'],
    pros: [
      'Lowest management fee of any full-service robo-advisor researched (0.25%, dropping to 0.20% above $100K)',
      'Low C$1,000 minimum to open',
      "Backed by Questrade's established brokerage infrastructure and research tools",
    ],
    cons: [
      'Consistently poor Trustpilot score (1.3/5, ~84% one-star), with complaints about frozen accounts and slow support',
      'Questrade disclosed 2026 layoffs (100+ staff) — a service-continuity concern to weigh, not a solvency issue',
    ],
    sub_scores: { fees: 9.4, features: 8.2, ux: 7.8, support: 6.2 },
    verdict: 'The lowest-fee full-service robo-advisor in this comparison.',
    attributes: { account_types: ['TFSA', 'RRSP', 'RESP', 'RRIF', 'FHSA'], regulator_type: 'ciro_dealer', custodian_note: '', cipf_protected: true, auto_rebalancing: true, tax_loss_harvesting: false, trustpilot_rating: 1.3, trustpilot_count: 393, trustpilot_note: 'ca.trustpilot.com — "Bad" rating, review count varied 323-393 across snapshots', regulatory_note: 'Questrade disclosed 2026 layoffs affecting 100+ staff, cited in some customer reviews as context for slower support response times. This is a staffing/service-continuity matter, not a solvency or regulatory enforcement issue.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.questrade.com/questwealth-portfolios',
    is_top_pick: false, best_for: 'Cost-conscious investors already using Questrade', display_order: 2,
    source_url: 'https://www.questrade.com/pricing/questwealth-portfolios-fees', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'justwealth', market: 'ca', category: 'personal-finance', topic: 'robo-advisors',
    display_name: 'Justwealth', tagline: 'The widest registered-account menu — the only one offering RDSP',
    score: 8.5, rating: 0, review_count: 0, clicks: 0, management_fee: 0.50, account_minimum: 5000,
    badges: [{ type: 'sky', label: 'Best for RESP & families' }],
    chips: ['Only candidate offering RDSP', '80+ target-date & specialty portfolios', 'Dedicated portfolio manager contact'],
    pros: [
      'The only candidate in this comparison offering an RDSP (Registered Disability Savings Plan) alongside the standard registered-account suite',
      '80+ distinct model portfolios including target-date RESP and ESG options',
      'Consistently well-reviewed in third-party 2026 roundups and award lists',
    ],
    cons: [
      'C$5,000 minimum — the highest of the more accessible candidates',
      'A flat C$4.99/month minimum fee makes small accounts relatively expensive; no reliable Trustpilot page found to independently verify service sentiment',
    ],
    sub_scores: { fees: 8.0, features: 9.2, ux: 8.4, support: 8.6 },
    verdict: 'The widest account-type menu of any robo-advisor researched, ideal for families.',
    attributes: { account_types: ['TFSA', 'RRSP', 'RESP', 'RRIF', 'FHSA', 'LIRA', 'RDSP', 'Non-registered'], regulator_type: 'portfolio_manager', custodian_note: 'CI Investment Services Inc. (formerly BBS Securities), a CIRO/CIPF member — holds custody for Justwealth\'s portfolio-manager-structured accounts', cipf_protected: true, auto_rebalancing: true, tax_loss_harvesting: true, tlh_note: 'non-registered accounts only', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No distinct, reliable Trustpilot page found for Justwealth specifically — shown as not yet rated rather than citing an unverified third-party aggregator score', regulatory_note: '' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.justwealth.com/',
    is_top_pick: false, best_for: 'Families wanting RESP or RDSP support', display_order: 3,
    source_url: 'https://www.justwealth.com/faqs/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'rbc-investease', market: 'ca', category: 'personal-finance', topic: 'robo-advisors',
    display_name: 'RBC InvestEase', tagline: "Low C$100 entry point, backed by Canada's largest bank",
    score: 8.0, rating: 0, review_count: 1, clicks: 1, management_fee: 0.50, account_minimum: 100,
    badges: [],
    chips: ['Invests once balance reaches C$100', 'Big-bank backing (RBC)', 'Human Portfolio Advisor access'],
    pros: [
      'Low C$100 threshold to begin investing, with a "Starter Portfolio" for balances under $1,500',
      "Backed by RBC, Canada's largest bank, with access to a human Portfolio Advisor",
      '10 portfolios across 5 risk tiers x 2 styles (Standard / Responsible Investing)',
    ],
    cons: [
      'Narrower account-type support than most peers — RESP and RRIF are not confirmed as available on official pages',
      'C$150 + tax fee to transfer out to a non-RBC institution',
    ],
    sub_scores: { fees: 8.0, features: 7.0, ux: 8.2, support: 8.0 },
    verdict: 'A low-cost, bank-backed entry point — note the narrower account-type support.',
    attributes: { account_types: ['TFSA', 'RRSP', 'FHSA', 'Non-registered'], regulator_type: 'ciro_dealer', custodian_note: '', cipf_protected: true, auto_rebalancing: true, tax_loss_harvesting: false, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'Only 1 review found on Trustpilot — too small a sample to be meaningful, shown as not yet rated', regulatory_note: 'A C$150 + tax fee applies to transfer assets out to a non-RBC institution (RBC-to-RBC transfers are free) — a real switching cost worth disclosing upfront.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.rbcinvestease.com/',
    is_top_pick: false, best_for: 'Existing RBC customers wanting simplicity', display_order: 4,
    source_url: 'https://www.rbcinvestease.com/pricing-fees.html', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'nest-wealth', market: 'ca', category: 'personal-finance', topic: 'robo-advisors',
    display_name: 'Nest Wealth', tagline: 'A flat monthly fee — cheaper than a percentage fee at larger balances',
    score: 7.6, rating: 0, review_count: 0, clicks: 0, management_fee: 0.6, account_minimum: 0,
    badges: [],
    chips: ['Flat monthly fee model', 'No minimum balance', 'Institutional pedigree (also serves banks)'],
    pros: [
      'Flat monthly fee (from C$5/mo under $10K up to a C$150/mo cap) can beat a percentage fee at larger balances',
      'No minimum balance to open',
      'Strong institutional pedigree — also powers robo-advisor infrastructure for banks',
    ],
    cons: [
      'Flat fee is expensive on very small balances (C$60/year minimum even on a few hundred dollars invested)',
      'Acquired 100% by Italian fintech Objectway in January 2024, and increasingly focused on B2B (bank-facing) business — worth confirming continued retail focus before committing',
    ],
    sub_scores: { fees: 7.4, features: 8.0, ux: 7.6, support: 7.4 },
    verdict: 'A flat-fee structure that can be the cheapest option at larger balances.',
    attributes: { account_types: ['TFSA', 'RRSP', 'LIRA', 'RESP', 'RRIF', 'Non-registered', 'Corporate', 'Trust'], regulator_type: 'portfolio_manager', custodian_note: 'Fidelity Clearing Canada / National Bank Independent Network, both CIRO/CIPF members — hold custody for Nest Wealth\'s portfolio-manager-structured accounts', cipf_protected: true, auto_rebalancing: true, tax_loss_harvesting: false, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No distinct, reliable Trustpilot page found for Nest Wealth — shown as not yet rated', regulatory_note: 'Nest Wealth was acquired 100% by Italian fintech Objectway in January 2024 (including buying out National Bank of Canada\'s prior minority stake). The core retail business appears to continue unchanged as of 2026, but recent coverage suggests its consumer-facing identity has become secondary to a growing B2B (bank-facing) business — disclosed for transparency.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.nestwealth.com/',
    is_top_pick: false, best_for: 'Larger balances where a flat fee beats a percentage', display_order: 5,
    source_url: 'https://www.nestwealth.com/pricing/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'ci-direct-investing', market: 'ca', category: 'personal-finance', topic: 'robo-advisors',
    display_name: 'CI Direct Investing', tagline: 'Confirmed operational under new Mubadala Capital ownership',
    score: 7.4, rating: 0, review_count: 0, clicks: 0, management_fee: 0.60, account_minimum: 100,
    badges: [],
    chips: ['Confirmed operational (2026)', 'Access to alternative/private-asset portfolios', 'C$100 minimum to invest'],
    pros: [
      'Confirmed live and accepting new clients — actively-maintained legal disclosures (Aug 2026 update) resolve prior status ambiguity',
      'Offers ESG and "Private Portfolios" (alternative assets) not available from pure-robo competitors',
      'Low C$100 minimum to be invested',
    ],
    cons: [
      'Does not offer FHSA or RDSP — a real account-type gap versus peers',
      'Zero independent review signal found (no Trustpilot ratings), and its parent CI Financial completed a take-private acquisition by Mubadala Capital in August 2025 — an ownership change worth knowing',
    ],
    sub_scores: { fees: 7.6, features: 8.0, ux: 7.4, support: 7.0 },
    verdict: 'A confirmed-operational robo-advisor with unique access to alternative assets.',
    attributes: { account_types: ['TFSA', 'RRSP', 'RESP', 'RRIF', 'LIRA', 'LIF', 'Non-registered'], regulator_type: 'portfolio_manager', custodian_note: 'CI Investment Services Inc. (CIIS, formerly BBS Securities), a CIRO/CIPF member', cipf_protected: true, auto_rebalancing: true, tax_loss_harvesting: false, trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'Zero reviews found on Trustpilot for CI Direct Investing / WealthBar — shown as not yet rated', regulatory_note: "CI Direct Investing's operational status was previously ambiguous in earlier research; now confirmed live and accepting new clients as of this page's verification. Its parent, CI Financial, completed a take-private acquisition by Mubadala Capital (Abu Dhabi sovereign-wealth-linked) on 13 August 2025; CI Financial has stated it continues to operate independently with its existing structure and management post-close. No wind-down of CI Direct Investing has been announced." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.cifinancial.com/ci-di/ca/en/invest.html',
    is_top_pick: false, best_for: 'Investors wanting alternative-asset access', display_order: 6,
    source_url: 'https://www.cifinancial.com/ci-di/ca/en/invest/pricing.html', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'moka', market: 'ca', category: 'personal-finance', topic: 'robo-advisors',
    display_name: 'Moka', tagline: 'Round-up micro-investing — pricing is mid-transition, see detail',
    score: 6.4, rating: 1.9, review_count: 15, clicks: 15, management_fee: 0.10, account_minimum: 0,
    badges: [],
    chips: ['Round-up / spare-change investing', 'No minimum balance', '⚠ Active pricing transition — see detail'],
    pros: [
      'Unique round-up/spare-change micro-investing niche not matched by the other 6 candidates',
      'No minimum balance to start — good for absolute beginners',
    ],
    cons: [
      'Parent company Mogo renamed itself Orion Digital Corp in December 2025, and the platform is actively transitioning from moka.ai to intelligentinvesting.ai with a live pricing discrepancy (legacy C$1-4/mo vs. a current-site C$20/mo membership fee) — unresolved, disclosed rather than guessed',
      'Small, mostly-negative Trustpilot sample (1.9/5, 15 reviews) citing unauthorized charges and round-up features breaking after bank-link changes',
    ],
    sub_scores: { fees: 6.0, features: 7.0, ux: 6.8, support: 6.0 },
    verdict: 'A distinctive micro-investing niche — but confirm current pricing directly before signing up.',
    attributes: { account_types: ['TFSA', 'RRSP', 'Non-registered'], regulator_type: 'portfolio_manager', custodian_note: 'CI Investment Services Inc., a CIRO/CIPF member — holds custody for managed accounts opened via IntelligentInvesting Wealth Management Inc.', cipf_protected: true, auto_rebalancing: true, tax_loss_harvesting: false, trustpilot_rating: 1.9, trustpilot_count: 15, trustpilot_note: 'moka.ai Trustpilot page — small sample (15 reviews), mostly negative', regulatory_note: 'Mogo Inc. (Moka\'s parent) renamed itself Orion Digital Corp effective 29 December 2025 (new ticker ORIO). The consumer platform previously at moka.ai now redirects to intelligentinvesting.ai, which "unifies MogoTrade and Moka into a single brand." Current official pricing shows a C$20/month membership fee plus 0.10% management fee, a significant change from historic C$1-4/month round-up pricing still cited on some third-party review sites as of this research — this discrepancy is unresolved and should be reconfirmed directly before relying on either figure.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.intelligentinvesting.ai/',
    is_top_pick: false, best_for: 'Absolute beginners wanting round-up investing', display_order: 7,
    source_url: 'https://help.intelligentinvesting.ai/en/articles/11138873-moka-is-a-part-of-your-intelligent-investing-experience-with-mogo', data_verified_at: '2026-07-11', active: true,
  },
];

const businessBankAccounts = [
  {
    slug: 'rbc-business', market: 'ca', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'RBC Business', tagline: 'The largest branch network with genuine accounting automation',
    score: 8.9, rating: 0, review_count: 0, clicks: 0, monthly_fee: 6,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['C$6/mo, waivable at $8,000+', 'RBC PayEdge accounting automation', 'Largest branch network in Canada'],
    pros: [
      'Direct CDIC-insured bank with the largest physical branch network of any candidate',
      'RBC PayEdge offers genuine embedded-banking automation beyond a simple bank feed',
      'Low C$6/mo entry fee, waivable with a minimum balance',
    ],
    cons: [
      'No independent, reliable Trustpilot review sample found for the business banking product specifically',
      'Higher-tier accounts with more transactions cost significantly more per month',
    ],
    sub_scores: { fees: 8.2, protection: 9.6, integrations: 8.8, support: 8.6 },
    verdict: 'Best overall — a direct CDIC-insured bank with real accounting automation.',
    attributes: { fee_waiver_note: 'C$6/mo Digital plan waived with a $8,000+ minimum monthly balance; higher-transaction tiers ($16-$120/mo) available for larger businesses', interest_rate_pct: 0, cdic_protected: true, cdic_note: '', intl_payments: true, intl_payments_note: 'RBC PayEdge cross-border payments and embedded-banking automation', accounting_integrations: ['RBC PayEdge'], trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.rbcroyalbank.com/business/accounts/index.html',
    is_top_pick: true, best_for: 'Businesses wanting a full-service bank with automation', display_order: 1,
    source_url: 'https://www.rbcroyalbank.com/business/accounts/business-bank-accounts.html', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'eq-bank-business', market: 'ca', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'EQ Bank Business', tagline: 'Completely free, with a genuinely competitive interest rate',
    score: 8.6, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Best value' }],
    chips: ['C$0/mo, no minimum balance', 'Competitive interest on idle balances', 'Direct CDIC-insured bank'],
    pros: [
      'Genuinely free account — no monthly fee, no minimum balance, no waiver hoops',
      'Direct CDIC-member bank (Equitable Bank), unlike several fintech competitors',
      'Interest paid on the operating balance, unusual for a business chequing account',
    ],
    cons: [
      'No branch network — digital-only, which will not suit every business',
      'No accounting-software integration at all currently — a real gap versus Float, RBC or BMO',
    ],
    sub_scores: { fees: 9.8, protection: 9.6, integrations: 4.0, support: 7.6 },
    verdict: 'The best value — a genuinely free, direct CDIC-insured account.',
    attributes: { fee_waiver_note: 'C$0/mo — no fee, no minimum balance required', interest_rate_pct: 1.5, cdic_protected: true, cdic_note: '', intl_payments: false, intl_payments_note: 'No dedicated international/cross-border payment product as of this research', accounting_integrations: [], trustpilot_rating: 4.1, trustpilot_count: 3400, trustpilot_note: 'trustpilot.com/review/eqbank.ca — the rating reflects EQ Bank overall, not the business product specifically; personal-banking reviews dominate the sample', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.eqbank.ca/business-banking',
    is_top_pick: false, best_for: 'Cost-conscious digital-first businesses', display_order: 2,
    source_url: 'https://www.eqbank.ca/business-banking/business-account', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'float-business', market: 'ca', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Float', tagline: 'The deepest accounting-software integration — with an indirect CDIC structure',
    score: 8.3, rating: 4.4, review_count: 210, clicks: 210, monthly_fee: 0,
    badges: [{ type: 'sky', label: 'Best accounting integration' }],
    chips: ['QuickBooks, Xero & NetSuite native sync', 'C$0/mo, no minimum balance', '⚠ Indirect CDIC via Scotiabank trust'],
    pros: [
      'The deepest accounting-software integration of any candidate — native QuickBooks Online, Xero and NetSuite sync',
      'No monthly fee and strong corporate-card/expense-management tooling built in',
      'Well-reviewed on Trustpilot (4.4/5) for product experience and support',
    ],
    cons: [
      'Not itself a CDIC member — it is a registered Money Services Business, and customer funds sit in a trust account at Scotiabank, capping protection at $100,000 combined across CAD and USD (versus per-category coverage at a direct bank)',
      'No physical branch access, and cross-border/FX support is narrower than the Big Five banks',
    ],
    sub_scores: { fees: 9.8, protection: 6.4, integrations: 10.0, support: 8.4 },
    verdict: 'The deepest accounting automation — understand the indirect CDIC structure first.',
    attributes: { fee_waiver_note: 'C$0/mo — no fee, no minimum balance required', interest_rate_pct: 0, cdic_protected: false, cdic_note: 'Float is a registered Money Services Business, not a CDIC member bank. Customer CAD/USD funds are held in trust AT SCOTIABANK (the actual CDIC member), giving indirect protection capped at $100,000 COMBINED across both currencies — a materially different, lower-ceiling structure than a direct bank account.', intl_payments: true, intl_payments_note: 'Multi-currency accounts and international wire support built into the core product', accounting_integrations: ['QuickBooks Online', 'Xero', 'NetSuite'], trustpilot_rating: 4.4, trustpilot_count: 210, trustpilot_note: 'trustpilot.com/review/float.com', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.float.com/',
    is_top_pick: true, best_for: 'Finance teams wanting deep accounting-software sync', display_order: 3,
    source_url: 'https://www.float.com/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'bmo-business', market: 'ca', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'BMO Business', tagline: 'A formal Xero partnership alongside QuickBooks support',
    score: 8.0, rating: 0, review_count: 0, clicks: 0, monthly_fee: 4,
    badges: [],
    chips: ['C$4/mo entry tier (new pricing effective March 2026)', 'Formal Xero partnership + QuickBooks', 'Direct CDIC-insured bank'],
    pros: [
      'One of few banks with a formal Xero accounting partnership, plus QuickBooks support',
      'Low entry-tier fee among the Big Five, waivable at a modest minimum balance',
      'Direct CDIC-member bank with national branch coverage',
    ],
    cons: [
      'New fee schedule takes effect March 2026 — confirm current pricing directly, as older reviews may cite the prior schedule',
      'No independent, reliable Trustpilot sample found for the business product specifically',
    ],
    sub_scores: { fees: 8.4, protection: 9.6, integrations: 8.2, support: 7.8 },
    verdict: 'A strong balance of low entry cost and genuine accounting integration.',
    attributes: { fee_waiver_note: 'C$4/mo Business Basic tier (effective March 2026 fee schedule), waivable at a $5,000+ minimum balance', interest_rate_pct: 0, cdic_protected: true, cdic_note: '', intl_payments: true, intl_payments_note: 'BMO cross-border banking for businesses trading with the US', accounting_integrations: ['Xero', 'QuickBooks'], trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated', regulatory_note: "BMO's business account fee schedule changes on 1 March 2026 — figures above reflect the new schedule; verify against BMO's official pricing page for the most current terms." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.bmo.com/en-ca/main/business/accounts-services/bank-accounts/',
    is_top_pick: false, best_for: 'Businesses using Xero wanting a bank-native integration', display_order: 4,
    source_url: 'https://www.bmo.com/en-ca/main/business/accounts-services/bank-accounts/business-basic/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'scotiabank-business', market: 'ca', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'Scotiabank Business', tagline: 'A well-established option with strong US/international banking ties',
    score: 7.6, rating: 0, review_count: 0, clicks: 0, monthly_fee: 14.95,
    badges: [],
    chips: ['C$14.95/mo, waivable at $10,000+ balance', 'Strong cross-border US banking ties', 'Direct CDIC-insured bank'],
    pros: [
      'Direct CDIC-member bank with an established international/cross-border banking network (Scotiabank operates across the Americas)',
      'Full branch network across Canada',
    ],
    cons: [
      'Higher entry-tier fee than BMO, RBC or the digital-only options',
      'No dedicated accounting-software integration found for the base business account, and no independent Trustpilot sample specific to the business product',
    ],
    sub_scores: { fees: 7.0, protection: 9.6, integrations: 5.0, support: 7.6 },
    verdict: 'A solid, if pricier, direct-bank option with strong cross-border ties.',
    attributes: { fee_waiver_note: 'C$14.95/mo Right Size Business account, waivable at a $10,000+ minimum balance', interest_rate_pct: 0, cdic_protected: true, cdic_note: '', intl_payments: true, intl_payments_note: "Scotiabank's Americas network supports US and Latin American cross-border banking", accounting_integrations: [], trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.scotiabank.com/ca/en/small-business/bank-accounts.html',
    is_top_pick: false, best_for: 'Businesses needing US or LatAm cross-border banking', display_order: 5,
    source_url: 'https://www.scotiabank.com/ca/en/small-business/bank-accounts/chequing-accounts.html', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'td-business', market: 'ca', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'TD Business', tagline: 'Embedded-banking automation — with a disclosed 2025 compliance record',
    score: 6.8, rating: 0, review_count: 0, clicks: 0, monthly_fee: 6,
    badges: [],
    chips: ['C$6/mo, waivable at $5,000+ balance', 'TD Embedded Banking (via FISPAN)', '⚠ Disclosed 2025 AML & FCAC penalties — see detail'],
    pros: [
      'TD Embedded Banking (built on FISPAN) offers genuine automation beyond a simple bank feed',
      'Low entry-tier fee among the Big Five, historically long branch hours',
    ],
    cons: [
      'TD pleaded guilty and paid approximately US$3.09 billion in a 2024-finalized US anti-money-laundering case, still part of its recent compliance record through 2025-26',
      "Canada's FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products, including small-business loans",
    ],
    sub_scores: { fees: 8.0, protection: 9.6, integrations: 8.4, support: 7.4 },
    verdict: 'Strong accounting automation — weigh the disclosed 2025 compliance record.',
    attributes: { fee_waiver_note: 'C$6/mo Basic Business Plan, waivable at a $5,000+ minimum balance', interest_rate_pct: 0, cdic_protected: true, cdic_note: '', intl_payments: true, intl_payments_note: 'TD Embedded Banking via FISPAN supports automated cross-border and domestic payment workflows', accounting_integrations: ['TD Embedded Banking (FISPAN)'], trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated', regulatory_note: "TD Bank pleaded guilty and paid approximately US$3.09 billion in a US anti-money-laundering case (finalized 2024, still relevant through 2025-26). Canada's FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products, including small-business loans. Disclosed in full; TD is not our top pick as a result." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.td.com/ca/en/business-banking/small-business/bank-accounts',
    is_top_pick: false, best_for: 'Embedded-banking automation, compliance record aware', display_order: 6,
    source_url: 'https://www.td.com/ca/en/business-banking/small-business/bank-accounts/basic-business-plan', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'national-bank-business', market: 'ca', category: 'business-banking', topic: 'business-bank-accounts',
    display_name: 'National Bank Business', tagline: 'Strong Quebec/Eastern Canada presence, new pricing lands August 2026',
    score: 7.2, rating: 0, review_count: 0, clicks: 0, monthly_fee: 24.95,
    badges: [],
    chips: ['C$24.95/mo (new pricing effective August 2026)', 'Strong Quebec & Eastern Canada branch network', 'Direct CDIC-insured bank'],
    pros: [
      'Direct CDIC-member bank with a particularly strong branch presence in Quebec and Eastern Canada',
      'National Bank was previously a minority shareholder in the robo-advisor Nest Wealth, reflecting a genuine fintech-partnership track record',
    ],
    cons: [
      'Highest entry-tier fee of the 7 candidates, and a new, higher fee schedule takes effect August 2026',
      'No dedicated accounting-software integration found for the base business account, and no independent Trustpilot sample specific to the business product',
    ],
    sub_scores: { fees: 6.2, protection: 9.6, integrations: 5.0, support: 7.4 },
    verdict: 'A regional strength pick for Quebec and Eastern Canada — confirm the August 2026 pricing change.',
    attributes: { fee_waiver_note: 'C$24.95/mo standard business account; new fee schedule effective August 2026 — waiver conditions vary by tier', interest_rate_pct: 0, cdic_protected: true, cdic_note: '', intl_payments: true, intl_payments_note: 'Standard international wire support; no dedicated embedded-banking product found', accounting_integrations: [], trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, business-banking-specific Trustpilot sample found — shown as not yet rated', regulatory_note: "National Bank's business account fee schedule changes on 1 August 2026 — figures above reflect the pre-change schedule at time of research; verify against National Bank's official pricing page closer to that date." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.nbc.ca/business/bank-accounts.html',
    is_top_pick: false, best_for: 'Businesses based in Quebec or Eastern Canada', display_order: 7,
    source_url: 'https://www.nbc.ca/business/bank-accounts/all-accounts.html', data_verified_at: '2026-07-11', active: true,
  },
];

const tfsaRrspPlatforms = [
  {
    slug: 'wealthsimple-trade', market: 'ca', category: 'tax-efficient-investing', topic: 'tfsa-rrsp-platforms',
    display_name: 'Wealthsimple Trade', tagline: '$0 commissions, $0 account fee, the broadest account-type support',
    score: 9.0, rating: 1.4, review_count: 610, clicks: 610, monthly_fee: 0,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['$0 commission on CA/US stocks & ETFs', '$0 account fee, no minimum', 'TFSA, RRSP, FHSA & non-registered'],
    pros: [
      '$0 commission on Canadian and US stock/ETF trades with no account maintenance fee at all',
      'Broadest account-type support of the 7 candidates (TFSA, RRSP, FHSA, non-registered)',
      'Simple, well-known mobile-first platform',
    ],
    cons: [
      "Trustpilot score is poor (1.4/5), driven mainly by account-freeze and support-speed complaints across Wealthsimple's broader product suite, not specifically the trading product",
      'Research tools are minimal compared to the bank-owned brokers',
    ],
    sub_scores: { cost: 10.0, accounts: 9.4, research: 6.0, support: 6.6 },
    verdict: 'The lowest-cost, broadest-account-support self-directed brokerage in this comparison.',
    attributes: { commission_per_trade_cad: 0, fee_waiver_note: 'No account fee at any balance — $0 by default', account_types: ['TFSA', 'RRSP', 'FHSA', 'Non-registered'], cipf_protected: true, research_tools_note: 'Basic charting and company snapshots; no bundled third-party research service', trustpilot_rating: 1.4, trustpilot_count: 610, trustpilot_note: "ca.trustpilot.com — figure fluctuated 597-657 across snapshots, many reviews conflate Wealthsimple's broader banking/crypto products with the trading product specifically", regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.wealthsimple.com/en-ca/product/trade',
    is_top_pick: true, best_for: 'DIY investors wanting the simplest, lowest-cost option', display_order: 1,
    source_url: 'https://www.wealthsimple.com/en-ca/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'qtrade-direct-investing', market: 'ca', category: 'tax-efficient-investing', topic: 'tfsa-rrsp-platforms',
    display_name: 'Qtrade Direct Investing', tagline: 'Eliminated commissions and its account fee in October 2025',
    score: 8.8, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [{ type: 'sky', label: 'Most improved / best research' }],
    chips: ['$0 commission since Oct 2025', '$0 account fee since Oct 2025', 'Morningstar + Recognia research suite'],
    pros: [
      'Eliminated both trading commissions and its CAD account maintenance fee in October 2025 — a genuine, verified, recent improvement',
      'Bundles Morningstar research and Recognia technical-analysis tools, plus a portfolio-planning suite',
      'Consistently wins independent third-party investor-satisfaction awards',
    ],
    cons: [
      'No independent, reliable Trustpilot sample found specifically for Qtrade',
      'Smaller brand recognition than the bank-owned brokers or Wealthsimple/Questrade',
    ],
    sub_scores: { cost: 10.0, accounts: 8.6, research: 9.4, support: 8.4 },
    verdict: 'The strongest research toolkit among the commission-free platforms.',
    attributes: { commission_per_trade_cad: 0, fee_waiver_note: 'Account fee eliminated entirely as of October 2025 — $0 regardless of balance', account_types: ['TFSA', 'RRSP', 'FHSA', 'RESP', 'RRIF', 'Non-registered'], cipf_protected: true, research_tools_note: 'Morningstar research reports plus Recognia technical-analysis screening and a portfolio-planning suite', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, independent Trustpilot sample found for Qtrade specifically — shown as not yet rated', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.qtrade.ca/en/investor/',
    is_top_pick: true, best_for: 'DIY investors wanting strong research + $0 commissions', display_order: 2,
    source_url: 'https://www.qtrade.ca/en/investor/pricing/commissions-and-fees', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'questrade-self-directed', market: 'ca', category: 'tax-efficient-investing', topic: 'tfsa-rrsp-platforms',
    display_name: 'Questrade', tagline: 'The lowest ongoing cost structure for active DIY traders',
    score: 8.6, rating: 1.3, review_count: 393, clicks: 393, monthly_fee: 0,
    badges: [{ type: 'green', label: 'Best for active traders' }],
    chips: ['$0 commission on CA/US stocks & ETFs', '$0 account fee', 'Questrade Edge with TipRanks analyst ratings'],
    pros: [
      '$0 commission on stock/ETF trades with no account maintenance fee, and low per-contract options pricing for active traders',
      'Questrade Edge trading platform includes TipRanks-powered analyst ratings and screening tools',
      'Backed by an established, long-running Canadian brokerage',
    ],
    cons: [
      'Consistently poor Trustpilot score (1.3/5, ~84% one-star), with complaints about frozen accounts and slow support',
      'Questrade disclosed 2026 layoffs (100+ staff) — a service-continuity consideration to weigh, not a solvency issue',
    ],
    sub_scores: { cost: 10.0, accounts: 8.6, research: 8.6, support: 6.2 },
    verdict: 'The best cost structure for traders who transact often, backed by a real analyst-ratings toolkit.',
    attributes: { commission_per_trade_cad: 0, fee_waiver_note: 'No account fee at any balance — $0 by default', account_types: ['TFSA', 'RRSP', 'FHSA', 'RESP', 'RRIF', 'Non-registered'], cipf_protected: true, research_tools_note: 'Questrade Edge platform with TipRanks-powered analyst ratings and screening tools', trustpilot_rating: 1.3, trustpilot_count: 393, trustpilot_note: 'ca.trustpilot.com — "Bad" rating, review count varied 323-393 across snapshots', regulatory_note: 'Questrade disclosed 2026 layoffs affecting 100+ staff, cited in some customer reviews as context for slower support response times. This is a staffing/service-continuity matter, not a solvency or regulatory enforcement issue.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.questrade.com/',
    is_top_pick: false, best_for: 'Active traders wanting the lowest ongoing cost', display_order: 3,
    source_url: 'https://www.questrade.com/pricing/commissions-fees', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'rbc-direct-investing', market: 'ca', category: 'tax-efficient-investing', topic: 'tfsa-rrsp-platforms',
    display_name: 'RBC Direct Investing', tagline: 'Recently eliminated its account fee entirely, regardless of balance',
    score: 7.8, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['$9.95/trade standard (from $6.95 at high volume)', '$0 account fee (eliminated, any balance)', "Backed by Canada's largest bank"],
    pros: [
      'RBC has genuinely eliminated its account maintenance fee entirely regardless of balance — a verified, recent improvement over older reviews that may still cite a fee',
      "Backed by RBC's brand, branch network and human-advisor access if needed",
    ],
    cons: [
      'Standard commission (C$9.95) is meaningfully higher than the three commission-free candidates',
      'No independent, reliable Trustpilot sample found specifically for the direct-investing product',
    ],
    sub_scores: { cost: 6.6, accounts: 8.0, research: 7.6, support: 8.2 },
    verdict: "A big-bank broker that has removed its account fee — commission remains standard-tier.",
    attributes: { commission_per_trade_cad: 9.95, fee_waiver_note: 'Account fee eliminated entirely as of this research — $0 regardless of balance', account_types: ['TFSA', 'RRSP', 'RESP', 'RRIF', 'Non-registered'], cipf_protected: true, research_tools_note: 'RBC Direct Investing research centre with third-party analyst reports', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, independent Trustpilot sample found for RBC Direct Investing specifically — shown as not yet rated', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.rbcdirectinvesting.com/',
    is_top_pick: false, best_for: 'Existing RBC customers wanting an integrated brokerage', display_order: 4,
    source_url: 'https://www.rbcdirectinvesting.com/pricing.html', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'td-direct-investing', market: 'ca', category: 'tax-efficient-investing', topic: 'tfsa-rrsp-platforms',
    display_name: 'TD Direct Investing', tagline: "Bundled Morningstar research — weigh TD's disclosed 2025 compliance record",
    score: 6.9, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['$9.99/trade standard (from $7.00 at high volume)', 'Bundled Morningstar research', '⚠ Disclosed 2025 AML & FCAC penalties — see detail'],
    pros: [
      'Bundled Morningstar research reports at no extra cost',
      "Account fee waived at a modest balance/trade threshold, backed by TD's branch network",
    ],
    cons: [
      'TD pleaded guilty and paid approximately US$3.09 billion in a 2024-finalized US anti-money-laundering case, still part of its recent compliance record through 2025-26',
      "Canada's FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products",
      'Standard commission (C$9.99) is the highest among the 7 candidates',
    ],
    sub_scores: { cost: 6.2, accounts: 8.0, research: 8.4, support: 7.4 },
    verdict: "Strong bundled research — weigh the disclosed 2025 compliance record.",
    attributes: { commission_per_trade_cad: 9.99, fee_waiver_note: 'Registered-account fee waived at a $15,000+ balance or minimum annual trade count', account_types: ['TFSA', 'RRSP', 'RESP', 'RRIF', 'Non-registered'], cipf_protected: true, research_tools_note: 'Bundled Morningstar research reports at no extra cost', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, independent Trustpilot sample found for TD Direct Investing specifically — shown as not yet rated', regulatory_note: "TD Bank pleaded guilty and paid approximately US$3.09 billion in a US anti-money-laundering case (finalized 2024, still relevant through 2025-26). Canada's FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products. Disclosed in full; TD is not our top pick as a result." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.td.com/ca/en/investing/direct-investing',
    is_top_pick: false, best_for: 'Bundled-research investors, compliance-aware', display_order: 5,
    source_url: 'https://www.td.com/ca/en/investing/direct-investing/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'bmo-investorline', market: 'ca', category: 'tax-efficient-investing', topic: 'tfsa-rrsp-platforms',
    display_name: 'BMO InvestorLine', tagline: 'A straightforward big-bank brokerage with a Xero-adjacent ecosystem',
    score: 7.2, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['$9.95/trade standard (from $3.95 at high volume)', 'Account fee waived at a modest balance', "Backed by BMO's branch network"],
    pros: [
      'Commission drops meaningfully at high trading volume (as low as C$3.95/trade)',
      "Backed by BMO's branch network and customer service infrastructure",
    ],
    cons: [
      'Standard commission (C$9.95) is well above the commission-free candidates for typical trading volumes',
      'No independent, reliable Trustpilot sample found specifically for InvestorLine, and research tools are more basic than TD or Qtrade',
    ],
    sub_scores: { cost: 6.6, accounts: 7.6, research: 6.8, support: 7.6 },
    verdict: 'A standard big-bank brokerage option, best at higher trading volumes.',
    attributes: { commission_per_trade_cad: 9.95, fee_waiver_note: 'Registered-account fee waived at a $25,000+ balance or minimum annual trade count', account_types: ['TFSA', 'RRSP', 'RESP', 'RRIF', 'Non-registered'], cipf_protected: true, research_tools_note: 'Standard third-party analyst reports; no bundled premium research suite', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, independent Trustpilot sample found for BMO InvestorLine specifically — shown as not yet rated', regulatory_note: '' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.bmo.com/main/investments/investorline/',
    is_top_pick: false, best_for: "High-volume traders wanting BMO's volume discount", display_order: 6,
    source_url: 'https://www.bmo.com/main/investments/investorline/pricing/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'scotia-itrade', market: 'ca', category: 'tax-efficient-investing', topic: 'tfsa-rrsp-platforms',
    display_name: 'Scotia iTRADE', tagline: 'The smallest of the bank-owned brokerages in this comparison',
    score: 6.6, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['$9.99/trade standard (from $4.99 at high volume)', 'Account fee waived at a modest balance', "Backed by Scotiabank's branch network"],
    pros: [
      "Backed by Scotiabank's branch network and established brokerage infrastructure",
      'Commission drops at high trading volume, similar to peer bank brokers',
    ],
    cons: [
      'Standard commission (C$9.99) matches the highest in this comparison',
      "No independent, reliable Trustpilot sample found specifically for iTRADE, and its research toolkit is less distinctive than TD's or Qtrade's",
    ],
    sub_scores: { cost: 6.2, accounts: 7.6, research: 6.4, support: 7.2 },
    verdict: "A standard bank-owned brokerage — no strong differentiator versus its bank-broker peers.",
    attributes: { commission_per_trade_cad: 9.99, fee_waiver_note: 'Registered-account fee waived at a $25,000+ balance or minimum annual trade count', account_types: ['TFSA', 'RRSP', 'RESP', 'RRIF', 'Non-registered'], cipf_protected: true, research_tools_note: 'Standard third-party analyst reports; no bundled premium research suite', trustpilot_rating: null, trustpilot_count: null, trustpilot_note: 'No reliable, independent Trustpilot sample found for Scotia iTRADE specifically — shown as not yet rated', regulatory_note: '' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.scotiaitrade.com/',
    is_top_pick: false, best_for: 'Existing Scotiabank customers wanting one brokerage', display_order: 7,
    source_url: 'https://www.scotiaitrade.com/pricing', data_verified_at: '2026-07-11', active: true,
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

await upsert(roboAdvisors, 'personal-finance/robo-advisors (ca)');
await upsert(businessBankAccounts, 'business-banking/business-bank-accounts (ca)');
await upsert(tfsaRrspPlatforms, 'tax-efficient-investing/tfsa-rrsp-platforms (ca)');

const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/product_attributes?select=category,topic&market=eq.ca&active=eq.true&topic=in.(robo-advisors,business-bank-accounts,tfsa-rrsp-platforms)`,
  { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } },
);
const countRows = await countRes.json();
const counts = {};
for (const r of countRows) {
  const key = `${r.category}/${r.topic}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log('\nActive row counts:', counts);
console.log('\nNext: npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts ca personal-finance robo-advisors');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts ca business-banking business-bank-accounts');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts ca tax-efficient-investing tfsa-rrsp-platforms');
