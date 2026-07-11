#!/usr/bin/env node
// AU/CA/UK rollout Slice CA-3 (ai-tools/ai-tools-finance,
// cybersecurity/cybersecurity-smb) — final Canada slice, completes CA
// (8/8 topics). Applies seed rows via the PostgREST API (upsert on the
// product_attributes unique constraint), same working pattern as
// apply-au-slice{1,2,3}-rest.mjs / apply-ca-slice{1,2}-rest.mjs (exec_sql
// RPC and direct Postgres connection are both unreachable from this
// environment).
// Row data mirrors supabase/migrations/20260711200000-20260711200100 exactly
// — those .sql files remain the source-of-truth audit trail; this script is
// the actual write path used to seed prod.
// Usage: node --env-file=.env.local scripts/apply-ca-slice3-rest.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

const aiTools = [
  {
    slug: 'chatgpt', market: 'ca', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'ChatGPT', tagline: "The most-used AI tool among Canadians for money management",
    score: 8.8, rating: 4.3, review_count: 5298, clicks: 5298, monthly_fee: 27,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Most-used AI tool for money mgmt (BMO report)', 'Dedicated personal-finance experience', 'Free tier available'],
    pros: [
      'The most-used AI tool among Canadians for money management, per a BMO report',
      'A dedicated "personal finance experience" initiative for budgeting Q&A and document/receipt analysis',
      'Free tier available, with paid tiers scaling up to team/enterprise use',
    ],
    cons: [
      'Faces an active class-action lawsuit (filed May 2026) alleging undisclosed tracker use on chat content, including financial topics',
      'No native CAD pricing — bills in USD, converted at checkout',
    ],
    sub_scores: { fees: 8.0, features: 9.4, ux: 9.0, support: 7.0 },
    verdict: 'The most broadly used AI tool for Canadian money questions, with real privacy litigation to weigh.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Free tier available. Plus: $20 USD/month (~C$27/month estimated, no native CAD price). Pro tiers: $100 and $200 USD/month, the $100 tier added April 2026.', target_segment: 'general_assistant', ai_features_note: 'General-purpose conversational AI; OpenAI\'s "personal finance experience in ChatGPT" initiative adds budgeting Q&A, financial-concept explanations and receipt/document analysis on top of the base assistant.', free_tier_or_trial: true, review_score: 4.3, review_count: 5298, review_source: 'Google Play', review_note: 'No reliable aggregate Trustpilot/G2 score specific to the personal-finance use case was found — this figure reflects the general ChatGPT app.', regulatory_note: 'OpenAI faces an active class action (filed May 2026, N.D. California) alleging Meta Pixel and Google Analytics trackers on chatgpt.com secretly sent chat content — including financial and health topics — to Meta and Google without consent; the case survived a motion to dismiss in late 2025. Separately, a January 2026 court order in New York Times copyright litigation compelled OpenAI to produce 20 million anonymized ChatGPT logs — sought by the litigants, not OpenAI, but a real user-privacy consideration.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://chatgpt.com/',
    is_top_pick: true, best_for: 'Most Canadians wanting general AI money help', display_order: 1,
    source_url: 'https://openai.com/business/chatgpt-pricing/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'monarch-money', market: 'ca', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Monarch Money', tagline: 'The strongest dedicated AI budgeting assistant researched',
    score: 8.9, rating: 4.9, review_count: 70000, clicks: 70000, monthly_fee: 12,
    badges: [{ type: 'green', label: 'Best dedicated AI budgeting app' }],
    chips: ['AI Assistant: summaries + forecasting', 'App Store 4.9/5 (70K+ ratings)', 'Read-only bank linking'],
    pros: [
      'A genuinely AI-branded in-app assistant delivering weekly financial summaries, spending-trend detection and cash-flow forecasting',
      'The strongest independent review scores researched for this comparison (App Store 4.9/5, ~70K ratings; Google Play 4.7/5, ~17.6K reviews)',
      'Read-only bank linking — Monarch cannot move funds, a real security mitigant',
    ],
    cons: [
      'No native CAD pricing — bills in USD, converted at checkout',
      'No permanent free tier; trial availability varies by promo code',
    ],
    sub_scores: { fees: 7.6, features: 9.2, ux: 9.4, support: 8.2 },
    verdict: 'The strongest dedicated AI budgeting product researched, with genuinely shipped (not just marketed) AI features.',
    attributes: { pricing_model: 'flat_subscription', starting_price_note: 'Core: $99.99 USD/year (~C$11.50/month estimated). Plus: $199 USD/year (~C$23/month estimated), adds forecasting, business/rental income tracking and deeper Morningstar-powered investment analysis. No native CAD price.', target_segment: 'budgeting', ai_features_note: 'In-app "AI Assistant" delivers weekly financial summaries, surfaces spending trends, answers natural-language money questions, and provides forward-looking cash-flow projections ("Monarch Forecasting") — a genuinely shipped AI feature set, not just marketing language.', free_tier_or_trial: false, review_score: 4.9, review_count: 70000, review_source: 'App Store', review_note: 'Google Play separately shows 4.7/5 (~17,600 reviews). G2/Capterra samples were too small to be meaningful for this product.', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.monarch.com/',
    is_top_pick: false, best_for: 'Households wanting genuine AI budgeting features', display_order: 2,
    source_url: 'https://www.monarch.com/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'copilot-money', market: 'ca', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Copilot Money', tagline: 'Apple Design Award recognition, iOS/Mac-only',
    score: 8.5, rating: 4.8, review_count: 28000, clicks: 28000, monthly_fee: 11,
    badges: [{ type: 'sky', label: 'Best for Apple users' }],
    chips: ['Apple Design Award Finalist 2026', 'Automatic categorization + cash-flow view', 'iOS/Mac only'],
    pros: [
      'Automatic transaction categorization that learns spending patterns, plus a genuinely useful cash-flow visualization tool',
      'Apple Editor\'s Choice and Apple Design Award Finalist recognition (2026)',
      'Strong App Store rating (~4.8/5, 27,000-30,000+ ratings)',
    ],
    cons: [
      'iOS/Mac only — no Android app, a real reach limitation for many Canadians',
      'Explicitly weaker on long-range planning (debt payoff, retirement modeling) per third-party reviews',
    ],
    sub_scores: { fees: 7.8, features: 8.6, ux: 9.4, support: 7.8 },
    verdict: 'The best AI budgeting experience for Apple users specifically — no Android version exists.',
    attributes: { pricing_model: 'flat_subscription', starting_price_note: '$95 USD/year when billed annually (~C$11/month estimated); higher on monthly billing (~$13 USD/month per some reviews — confirm current rate at checkout). Single tier, no feature-gating. No native CAD price.', target_segment: 'budgeting', ai_features_note: 'Automatic transaction categorization that learns spending patterns, a cash-flow visualization tool for spotting income/spending trends, and subscription/recurring-charge detection.', free_tier_or_trial: true, review_score: 4.8, review_count: 28000, review_source: 'App Store', review_note: 'iOS/Mac-only — no Android app.', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://copilot.money/',
    is_top_pick: false, best_for: 'Apple users wanting a polished budgeting AI', display_order: 3,
    source_url: 'https://copilot.money/pricing/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'perplexity-ai', market: 'ca', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Perplexity AI', tagline: 'A cited-source research tool — with active copyright litigation disclosed',
    score: 7.4, rating: 1.6, review_count: 400, clicks: 400, monthly_fee: 27,
    badges: [],
    chips: ['Cited-source AI research', 'Recommended for CA startup market research', '⚠ Active copyright lawsuits — see detail'],
    pros: [
      'AI-powered answer engine with cited sources, useful for Canadian startups researching markets or regulations',
      'Free tier available, with model-switching between frontier LLMs on paid tiers',
    ],
    cons: [
      'Trustpilot score is poor (~1.5-1.6/5, ~180-695 reviews across snapshots), dominated by billing and cancellation complaints',
      'Multiple active copyright/IP lawsuits bear directly on the reliability of its AI-generated answers',
    ],
    sub_scores: { fees: 7.0, features: 8.6, ux: 7.4, support: 5.4 },
    verdict: 'A genuinely useful research tool — weigh the disclosed billing complaints and active litigation.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Free tier available. Pro: $20 USD/month or $200 USD/year (~C$27/month estimated). Max: $200 USD/month or $2,000 USD/year, adds a multi-model "Model Council" and the Comet AI-agent browser. No native CAD price.', target_segment: 'general_assistant', ai_features_note: 'AI-powered answer engine with cited sources ("Pro Search"), model-switching between frontier LLMs, and (Max tier) an agentic browser (Comet) that can take actions on websites — useful for Canadian founders doing market or regulatory research.', free_tier_or_trial: true, review_score: 1.6, review_count: 400, review_source: 'Trustpilot', review_note: 'Sharp platform split — Trustpilot is dominated by billing/cancellation complaints, while Product Hunt/G2/Capterra show notably higher marks for the core search product itself. Both are disclosed since the billing pattern is a legitimate consumer-warning point.', regulatory_note: "Perplexity faces multiple active copyright/IP lawsuits: News Corp (October 2024, alleging misuse of Wall Street Journal/New York Post content plus hallucinated attributions), Encyclopedia Britannica and Merriam-Webster (2026, alleging near-verbatim content reproduction), and Amazon (November 2025, alleging its Comet AI-agent browser impersonated a human shopper on Amazon without disclosing itself as a bot). These bear directly on the reliability of AI-generated answers for research use." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.perplexity.ai/',
    is_top_pick: false, best_for: 'Founders doing market or regulatory research', display_order: 4,
    source_url: 'https://www.perplexity.ai/hub/pricing', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'wealthsimple-ai', market: 'ca', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Wealthsimple', tagline: 'A trusted Canadian brand — with a real 2025 breach disclosed',
    score: 6.8, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['Free core budgeting', 'AI support chatbot (Decagon)', '⚠ Sept 2025 data breach — see detail'],
    pros: [
      'Free core budgeting/spend-tracking, backed by a large, well-known Canadian brand',
      'An AI support chatbot (switched to Decagon in January 2026) resolves an estimated 60-70% of support queries without a human',
      'Publishes a dedicated legal AI-disclosure page — a genuine transparency signal',
    ],
    cons: [
      'AI positioning is weaker than the other 6 candidates — no headline AI-branded budgeting/forecasting feature the way Monarch or Copilot has',
      'Disclosed a real data breach in September 2025 exposing SINs and government IDs for roughly 30,000 customers',
    ],
    sub_scores: { fees: 9.4, features: 6.0, ux: 8.0, support: 6.6 },
    verdict: 'A trusted, free budgeting tool from a major Canadian brand — the weakest AI positioning of the 7, with a real breach to weigh.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Free — core budgeting/spend-tracking has no subscription fee (does not pull in external bank accounts, unlike Monarch/Copilot, a real limitation). Investing/trading fees are separate and not the focus of this comparison.', target_segment: 'budgeting', ai_features_note: 'A customer-facing support chatbot (switched to Decagon as the underlying AI vendor in January 2026) resolves an estimated 60-70% of support queries without a human; a planned AI-powered investment research/trading dashboard is rolling out. Budgeting-specific AI (auto-categorization, forecasting) is not a headline feature the way it is for Monarch/Copilot.', free_tier_or_trial: true, review_score: null, review_count: null, review_source: 'Not isolated', review_note: 'A comprehensive third-party review aggregate score specific to the budgeting feature was not isolated in research — shown as not yet rated rather than citing an overall brand score.', regulatory_note: 'Wealthsimple disclosed a data breach in September 2025 — a supply-chain attack via a third-party software package exposed data for roughly 30,000 customers (under 1% of its ~3M users), including SINs, government IDs, dates of birth, IP addresses and account numbers. Wealthsimple states funds and passwords were not compromised and the intrusion was contained within hours; affected users received free credit monitoring.' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.wealthsimple.com/en-ca/',
    is_top_pick: false, best_for: 'Existing Wealthsimple users wanting free budgeting', display_order: 5,
    source_url: 'https://www.wealthsimple.com/en-ca/legal/ai-disclosure', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'koho', market: 'ca', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'KOHO', tagline: 'A Canadian fintech — its "AI" is internal infrastructure, not an in-app feature',
    score: 6.2, rating: 4.5, review_count: 2000, clicks: 2000, monthly_fee: 0,
    badges: [],
    chips: ['Canadian fintech (Toronto)', 'Kortex AI = internal fraud/AML tooling', 'Free Essential tier'],
    pros: [
      'A genuine Canadian fintech with a free account tier and native CAD pricing on paid plans',
      'Kortex AI (built on AWS Bedrock) is real, purpose-built AI infrastructure for fraud investigation and AML compliance',
      'Strong Trustpilot rating (~4.5/5, 2,000+ reviews)',
    ],
    cons: [
      'Kortex AI is internal-only — Canadians do not directly see or use it inside the app, unlike the other 6 candidates\' customer-facing AI features',
      'Recurring complaint pattern around support responsiveness and account holds during re-verification',
    ],
    sub_scores: { fees: 9.0, features: 4.4, ux: 7.4, support: 6.6 },
    verdict: 'A real Canadian fintech with genuine AI infrastructure — but not a customer-facing AI tool in the way the others are.',
    attributes: { pricing_model: 'freemium', starting_price_note: 'Essential: free (with direct deposit or $1,000+/month in deposits, otherwise a fee applies). Extra: $12 CAD/month. Everything: ~$14.75 CAD/month billed annually ($177/year) or ~$22 CAD/month billed monthly. Native CAD pricing — no conversion needed.', target_segment: 'fraud_security', ai_features_note: 'Kortex AI (built on Amazon Bedrock) is an internal platform used for anti-money-laundering suspicious-transaction-report automation, fraud/scam investigation and security-event triage — it is not a labeled, customer-facing in-app feature. Treat this as AI infrastructure powering the product behind the scenes, not a tool Canadians interact with directly.', free_tier_or_trial: true, review_score: 4.5, review_count: 2000, review_source: 'Trustpilot', review_note: 'Recurring complaints center on customer service (slow chat, account holds during re-verification), not the AI systems themselves.', regulatory_note: '' },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.koho.ca/',
    is_top_pick: false, best_for: 'Canadians wanting real AI infrastructure, not hype', display_order: 6,
    source_url: 'https://www.koho.ca/everything/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'moka-ai', market: 'ca', category: 'ai-tools', topic: 'ai-tools-finance',
    display_name: 'Moka', tagline: 'AI positioning largely absorbed into an ongoing platform migration',
    score: 4.6, rating: 1.9, review_count: 15, clicks: 15, monthly_fee: 15,
    badges: [],
    chips: ['Round-up investing app', '⚠ Active platform migration — see detail', 'Poor Trustpilot score'],
    pros: [
      'A distinctive round-up/spare-change investing niche among the 7 candidates',
    ],
    cons: [
      "AI-feature positioning is thin and largely absorbed into the ongoing moka.ai → intelligentinvesting.ai migration, rather than a distinct, independently verifiable 'Moka AI' product",
      'Poor Trustpilot score (1.9/5, 15 reviews) with billing-after-cancellation complaints and users describing the in-app AI chatbot as ineffective',
    ],
    sub_scores: { fees: 6.0, features: 4.0, ux: 4.4, support: 4.0 },
    verdict: "Kept on this list per the approved shortlist — its AI claim is the least substantiated and its pricing the least settled of the 7. Read the disclosure below.",
    attributes: { pricing_model: 'freemium', starting_price_note: 'Pricing is genuinely unclear and in flux during the platform migration — sources cite figures from $4/month (basic round-up) to $15/month (premium with coaching), with at least one complaint describing a $10.50/month charge persisting post-cancellation. Treat any figure as unverified until reconfirmed directly.', target_segment: 'budgeting', ai_features_note: "Marketing around the broader Intelligent Investing platform references a \"Fiscal.ai Pro\" research layer and a \"behavioral science\" engine, but these are positioned at the platform level rather than clearly branded as distinct \"Moka AI\" features still active under the Moka name specifically — the weakest-substantiated AI claim of the 7 candidates on this page.", free_tier_or_trial: false, review_score: 1.9, review_count: 15, review_source: 'Trustpilot', review_note: 'Small sample (15 reviews), predominantly negative.', regulatory_note: "Moka's parent company (Mogo, renamed Orion Digital Corp in December 2025) is actively migrating the platform from moka.ai to intelligentinvesting.ai, with unresolved pricing and feature-branding inconsistencies across sources at research time. Trustpilot reviews describe billing continuing after cancellation requests, no live chat/phone support, and an in-app AI chatbot users describe as ineffective. Website traffic is reportedly down roughly 87%, a signal of declining usage, not a formal incident." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.intelligentinvesting.ai/moka',
    is_top_pick: false, best_for: 'Buyers who have confirmed current Moka pricing directly', display_order: 7,
    source_url: 'https://help.intelligentinvesting.ai/en/articles/11138873-moka-is-a-part-of-your-intelligent-investing-experience-with-mogo', data_verified_at: '2026-07-11', active: true,
  },
];

const cybersecurity = [
  {
    slug: '1password-business-ca', market: 'ca', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: '1Password Business', tagline: 'Canadian-founded, Toronto-headquartered, transparent pricing',
    score: 9.0, rating: 0, review_count: 0, clicks: 0, monthly_fee: 13,
    badges: [{ type: 'gold', label: "Editor's pick" }],
    chips: ['Canadian-founded (Toronto HQ since 2005)', 'Transparent published pricing', 'SSO integrations for growing teams'],
    pros: [
      'A genuinely Canadian-founded company, headquartered in Toronto, Ontario since 2005',
      'One of the few vendors on this page with fully transparent, published self-serve pricing',
      'SSO integrations (Okta, Entra ID, Duo) and role-based vault sharing suit growing SMB teams',
    ],
    cons: [
      'Later-stage ownership is US-led venture capital (~$920M raised 2019-2022) — "Canadian-owned" would overstate this, though "Canadian-founded, Toronto-headquartered" remains accurate',
      'Current G2/Capterra review score could not be independently confirmed at research time',
    ],
    sub_scores: { fees: 8.6, features: 9.0, ux: 9.2, support: 8.6 },
    verdict: 'The strongest combination of Canadian provenance and transparent, trustworthy pricing.',
    attributes: { pricing_model: 'per-user/month', starting_price_note: '$8.99 USD/user/month (Business, billed annually), confirmed on the official pricing page; converts to an estimated ~C$13/user/month (no native CAD price shown).', product_category: 'password_manager', key_feature_note: 'SSO integrations (Okta, Entra ID, Duo), role-based vault sharing, Watchtower security-hygiene alerts and activity monitoring — a Customer Success Manager is included at 101+ seats.', ca_presence_note: 'Headquartered in Toronto, Ontario since founding in 2005 — a genuine Canadian-founded company. After 14 self-funded years it raised roughly $920M across three US-led venture rounds (2019-2022, valuing it at $6.8B), so "Canadian-founded, Toronto-headquartered" is accurate, though "Canadian-owned" would overstate later-stage ownership.', review_score: null, review_count: null, review_source: 'G2/Capterra', review_note: 'A specific, current G2/Capterra star rating and review count could not be independently confirmed at research time — shown as not yet rated rather than citing a stale or unverified figure.', security_note: "No confirmed breach, lawsuit or fine was found for 2024-2026. The 2023 Okta third-party incident touched some 1Password-adjacent systems, but no customer vault data was accessed — a resolved, pre-window matter disclosed for context. In 2025, a DEF CON researcher disclosed and helped patch browser-extension vulnerabilities affecting several password managers including 1Password, and phishing campaigns have separately impersonated 1Password's 'Watchtower' brand — both are third-party/attacker-side issues, not 1Password platform compromises." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://1password.com/business/',
    is_top_pick: true, best_for: 'Teams wanting a trusted Canadian-founded vendor', display_order: 1,
    source_url: 'https://1password.com/pricing/password-manager', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'crowdstrike-ca-smb', market: 'ca', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'CrowdStrike Falcon Go', tagline: 'Top-tier EDR pedigree — with a well-documented 2024 outage disclosed',
    score: 8.3, rating: 4.6, review_count: 385, clicks: 385, monthly_fee: 11,
    badges: [],
    chips: ['Purpose-built SMB entry tier', 'Top-tier EDR pedigree', '⚠ July 2024 global outage — see detail'],
    pros: [
      'Falcon Go is a purpose-built SMB bundle (AI-powered next-gen antivirus, USB device control, mobile protection) from a top-tier EDR vendor',
      'Strong review score (G2 4.6/5, 385 reviews) for the broader Falcon platform',
      'Sold via CDW Canada and Pax8 Canada, with a registered Vancouver, BC entity',
    ],
    cons: [
      'The July 2024 global outage — a faulty Falcon sensor update bricked ~8.5M Windows devices worldwide — hit Canada hard: Pearson and Montreal-Trudeau airports, Porter Airlines, RBC/TD and hospitals across ON/BC/MB/NL were all disrupted',
      'Falcon Go lacks true EDR; real detection/response requires upgrading to the pricier Falcon Pro or Enterprise tiers',
    ],
    sub_scores: { fees: 7.6, features: 9.2, ux: 8.4, support: 8.0 },
    verdict: 'Elite EDR pedigree at an SMB price point — weigh the disclosed 2024 outage, which hit Canada directly.',
    attributes: { pricing_model: 'per-device/month or /year', starting_price_note: 'Falcon Go: $7.99 USD/device/month or $59.99 USD/device/year, capped at 100 devices. No native CAD price found; converts to an estimated ~C$11/device/month.', product_category: 'endpoint_protection', key_feature_note: 'Falcon Go bundles AI-powered next-gen antivirus, USB device control and mobile protection with "Express Support" onboarding for SMBs — full EDR/response requires upgrading to the pricier Falcon Pro or Enterprise tiers.', ca_presence_note: 'CrowdStrike Canada, Inc. is registered in Vancouver, BC, with a Toronto event/marketing presence; sold via CDW Canada and Pax8 Canada. No stated Canadian data-residency option found.', review_score: 4.6, review_count: 385, review_source: 'G2', review_note: 'Capterra shows the same 4.6-4.7/5 (55 reviews); both reflect the broader Falcon platform, not the Falcon Go SMB tier specifically.', security_note: "The July 2024 global outage — a faulty Falcon sensor update bricked approximately 8.5 million Windows devices worldwide — hit Canada hard: Toronto Pearson and Montreal-Trudeau airports were disrupted, Porter Airlines cancelled all flights, RBC and TD were affected, and hospitals across Ontario, British Columbia, Manitoba and Newfoundland & Labrador (including Toronto's UHN and Sunnybrook) faced disruptions. A US federal judge dismissed a shareholder securities-fraud suit in January 2026; Delta Air Lines' roughly $500M lawsuit survived a motion to dismiss and remains active. Separately, in November 2025 CrowdStrike fired an employee who leaked internal screenshots to the hacking group 'Scattered Lapsus$ Hunters'; CrowdStrike states no systems or customer data were compromised despite the group's false claim of a full breach." },
    source_type: 'official', confidence: 'high',
    is_affiliate: false, review_slug: null, external_url: 'https://www.crowdstrike.com/en-ca/',
    is_top_pick: false, best_for: 'Businesses wanting top-tier EDR pedigree', display_order: 2,
    source_url: 'https://www.crowdstrike.com/en-us/pricing/falcon-go/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'bitdefender-ca', market: 'ca', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Bitdefender GravityZone', tagline: 'SMB-sized endpoint protection — with an April 2025 GDPR fine disclosed',
    score: 7.9, rating: 4.6, review_count: 208, clicks: 208, monthly_fee: 3,
    badges: [],
    chips: ['SMB-tiered up to 30 endpoints', 'Localized CA site + contact page', '⚠ April 2025 GDPR fine — see detail'],
    pros: [
      'SMB-sized tiers with multi-layered ransomware prevention, network attack defense and a single-pane console',
      'Localized bitdefender.com/en-ca site with a dedicated Canadian business-contact page',
      'Strong Capterra score (4.6/5, 208 reviews)',
    ],
    cons: [
      "Romania's data protection authority fined Bitdefender approximately €10,000 in April 2025 for a GDPR violation after an email-security update exposed customer names and emails",
      'No official self-serve price published (interactive calculator only) — the figure shown is a third-party estimate',
    ],
    sub_scores: { fees: 8.2, features: 8.6, ux: 8.2, support: 7.6 },
    verdict: 'Strong SMB endpoint protection — weigh the disclosed 2025 GDPR fine.',
    attributes: { pricing_model: 'per-device/year', starting_price_note: 'No official self-serve price published (interactive calculator only). Third-party estimate: Small Business Security ~$77.69 USD/3 devices/year ≈ C$3/device/month — unverified against an official quote, get a direct quote before committing.', product_category: 'endpoint_protection', key_feature_note: 'Multi-layered ransomware prevention, network attack defense, misconfiguration/risk management, anti-phishing and web filtering in a single-pane console.', ca_presence_note: 'Localized bitdefender.com/en-ca site and a dedicated Canadian business-contact page; a Vancouver office address appears only in a lower-tier business directory and is unconfirmed. No explicit Canadian data-residency claim found.', review_score: 4.6, review_count: 208, review_source: 'Capterra', review_note: 'G2 shows a lower 4.0/5 (72 reviews) specifically for "GravityZone XDR," a scope mismatch worth noting versus plain Business Security.', security_note: "Romania's data protection authority (ANSPDCP) fined Bitdefender SRL approximately €10,000 (RON 47,772) on 30 April 2025 for GDPR Article 32 violations, after a programming error in an email-security update exposed customer names and emails to third parties. Several 2024-2025 CVEs affecting Bitdefender products exist (including a Console SSRF flaw and a Box-firmware RCE flaw), though none are listed in CISA's Known Exploited Vulnerabilities catalog as of this research." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.bitdefender.com/en-ca/business/',
    is_top_pick: false, best_for: 'SMBs wanting a localized CA business contact', display_order: 3,
    source_url: 'https://www.bitdefender.com/en-us/business/smb-products/business-security', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'sophos-ca', market: 'ca', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Sophos Intercept X', tagline: 'A genuine, substantial Vancouver presence since 2003',
    score: 7.6, rating: 4.6, review_count: 820, clicks: 820, monthly_fee: 0,
    badges: [],
    chips: ['Vancouver office since 2003 (~220 staff)', 'Deep-learning malware prevention', 'Contact for pricing'],
    pros: [
      'A genuine, substantial Canadian presence — a Vancouver office since 2003 (~220 staff, product R&D via its ActiveState acquisition) plus a Toronto sales office',
      'Deep-learning malware detection with optional XDR add-on tiers scaled to organisational maturity',
      'Strong review score (G2 4.6/5, 820 reviews) for the broader Sophos Endpoint line',
    ],
    cons: [
      "Sophos's own Firewall product line (a separate product from Intercept X) has been targeted by a multi-year nation-state exploitation campaign",
      'Zero self-serve pricing — quote-only via reseller',
    ],
    sub_scores: { fees: 7.0, features: 8.8, ux: 8.0, support: 8.2 },
    verdict: "One of the strongest Canadian office presences of the 7 — but no self-serve pricing, budget for a reseller quote.",
    attributes: { pricing_model: 'per-user/year, reseller-quoted', starting_price_note: 'No official price published (quote-only via reseller). Third-party estimates: Intercept X Advanced ~$66 USD/user/year for small deployments — unverified against an official CA quote.', product_category: 'endpoint_protection', key_feature_note: 'Deep-learning malware prevention plus optional XDR add-on tiers scaled to org maturity — the Advanced tier (no XDR) is the realistic SMB entry point.', ca_presence_note: 'A Vancouver office since 2003 (~220 staff, product R&D, via its ActiveState acquisition) plus a Toronto sales office — a genuine, substantial Canadian presence. No confirmed Canadian data-residency option for Intercept X specifically.', review_score: 4.6, review_count: 820, review_source: 'G2 (Sophos Endpoint, not Intercept X-specific)', review_note: 'Capterra shows 4.5/5 (218 reviews) listed specifically as "Intercept X Endpoint."', security_note: "Sophos's own 'Pacific Rim' research (October 2024) documented a five-year China-linked nation-state campaign actively exploiting zero-day vulnerabilities in Sophos Firewall (XG/XGS) products against critical infrastructure; the US DOJ separately charged a Chinese national in 2024 over a 2020 campaign that compromised roughly 81,000 Sophos firewalls globally. Multiple critical Firewall RCE CVEs were patched through 2024-2025. This exploitation history is specific to Sophos's network Firewall product line, not Intercept X (the endpoint product featured on this page) — but we disclose it in full given it's the same vendor." },
    source_type: 'official', confidence: 'medium',
    is_affiliate: false, review_slug: null, external_url: 'https://www.sophos.com/en-us/products/endpoint-antivirus',
    is_top_pick: false, best_for: 'Businesses wanting a strong local CA office presence', display_order: 4,
    source_url: 'https://secure2.sophos.com/en-us/products/intercept-x/get-pricing.aspx', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'eset-ca', market: 'ca', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'ESET PROTECT', tagline: 'A Montreal R&D facility since 2009 — with an actively-exploited CVE disclosed',
    score: 7.2, rating: 0, review_count: 0, clicks: 0, monthly_fee: 0,
    badges: [],
    chips: ['Montreal R&D facility since 2009', 'Runs well on legacy hardware', '⚠ Actively-exploited 2024 CVE — see detail'],
    pros: [
      'A genuine Canadian R&D presence — a Montreal threat-intelligence/R&D facility since 2009, plus a Thornhill, Ontario sales office since 2015',
      'Cloud-managed PROTECT console with a flexible Entry/Advanced/Complete/MDR upgrade path',
      'Runs lightly on older hardware, a real advantage for cost-conscious SMBs',
    ],
    cons: [
      "CVE-2024-11859, a flaw in ESET's own scanner, was actively exploited by the ToddyCat APT group into 2025 — a genuine product-security concern for a security vendor",
      'Zero public list pricing anywhere — quote-only, and current review scores could not be independently confirmed',
    ],
    sub_scores: { fees: 7.0, features: 8.4, ux: 7.6, support: 8.0 },
    verdict: 'A real Canadian R&D presence and a flexible upgrade path — but a real exploited CVE to weigh, and no public pricing.',
    attributes: { pricing_model: 'per-device, custom quote', starting_price_note: 'No public list price found anywhere — ESET states pricing is quote-only and tailored to years and devices purchased.', product_category: 'endpoint_protection', key_feature_note: 'Tiered PROTECT platform (Entry/Advanced/Complete/MDR) lets SMBs start with basic endpoint AV and add EDR/MDR later without switching vendors; runs lightly on older hardware.', ca_presence_note: 'A Montreal threat-intelligence/R&D facility since 2009 and a Thornhill, Ontario sales office since 2015. Marketing references a Montreal-linked "local data centre," though the exact scope of Canadian data residency for PROTECT\'s cloud services is unconfirmed.', review_score: null, review_count: null, review_source: 'G2/Capterra', review_note: 'PROTECT MDR (4.8/5, 16 reviews) and PROTECT Complete (4.7/5, 10 reviews) samples are both too small to be meaningful — shown as not yet rated rather than citing an unreliable figure.', security_note: "CVE-2024-11859, a DLL search-order hijacking flaw (CVSS 8.4) in ESET's own Windows products, was actively exploited in the wild by the China-linked APT group ToddyCat to deploy malware and disable kernel security notifications, patched in January 2025. Separately, ESET's own researchers discovered and disclosed CVE-2024-7344, an industry-wide UEFI Secure Boot bypass, fixed via the January 2025 Patch Tuesday." },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.eset.com/ca/business/',
    is_top_pick: false, best_for: 'Budget-conscious businesses on older hardware', display_order: 5,
    source_url: 'https://www.eset.com/ca/business/contact-sales/', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'malwarebytes-ca', market: 'ca', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'Malwarebytes', tagline: 'The simplest deployment of the 7 — with the cleanest disclosed record',
    score: 7.0, rating: 4.6, review_count: 1120, clicks: 1120, monthly_fee: 14,
    badges: [{ type: 'green', label: 'Cleanest disclosed record' }],
    chips: ['Simple 3/10/20-device Teams tiers', 'Built-in Privacy VPN + Browser Guard', 'No confirmed Canadian office'],
    pros: [
      'The simplest deployment of the 7 — straightforward 3/10/20-device Teams tiers with 24/7 support',
      'Built-in Privacy VPN, Browser Guard and Brute Force Protection bundled at every tier',
      'The cleanest disclosed security record of the 7 — only a resolved 2021 incident and a local-access-only CVE found',
    ],
    cons: [
      'No confirmed Canadian office, distributor or data-residency claim — the only Canada-linked asset found is a consumer VPN exit node in Toronto',
      'Weaker advanced reporting/remote-management than competitors, per reviewer feedback',
    ],
    sub_scores: { fees: 8.4, features: 7.4, ux: 8.4, support: 7.6 },
    verdict: 'The simplest, cleanest-disclosed option — with the weakest Canadian presence of the 7.',
    attributes: { pricing_model: 'per-device/year', starting_price_note: 'Sole Proprietor (3 devices): $119.99 USD/year (~C$14/month estimated). Small Office (20 devices): $519.99 USD/year. No native CAD price found.', product_category: 'endpoint_protection', key_feature_note: 'Simple 3/10/20-device Teams tiers with 24/7 support, a built-in Privacy VPN, Browser Guard and Brute Force Protection, plus monthly reporting across platforms.', ca_presence_note: 'No confirmed Canadian office, distributor or data-residency claim found — company locations are Cork, Ireland and Santa Clara, California only. The sole Canada-linked asset found is a consumer VPN exit node in Toronto, not a business/compliance feature.', review_score: 4.6, review_count: 1120, review_source: 'G2', review_note: 'This figure is blended across all Malwarebytes products, not isolated to the Teams/Business SKU specifically.', security_note: 'A 2021 nation-state email-access incident (attributed to the same actor group behind the SolarWinds breach) is historical and resolved — no customer data was compromised, and no follow-up developments were found for 2024-2026. A local-privilege-escalation CVE exists (a quarantine symlink-abuse flaw, CVSS 7.8, patched November 2024) but requires local device access, and no in-the-wild exploitation was found.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://www.malwarebytes.com/business',
    is_top_pick: false, best_for: 'Small teams wanting the simplest deployment', display_order: 6,
    source_url: 'https://www.malwarebytes.com/pricing/teams', data_verified_at: '2026-07-11', active: true,
  },
  {
    slug: 'nordlayer-ca', market: 'ca', category: 'cybersecurity', topic: 'cybersecurity-smb',
    display_name: 'NordLayer (NordVPN Business)', tagline: 'Server nodes in Vancouver, Montreal and Toronto — with a January 2026 breach claim disclosed',
    score: 6.6, rating: 4.6, review_count: 33, clicks: 33, monthly_fee: 15,
    badges: [],
    chips: ['CA server nodes: Vancouver, Montreal, Toronto', 'ThreatBlock + Cloud Firewall', '⚠ Jan 2026 breach claim — see detail'],
    pros: [
      'NordLayer gateway server nodes exist in Vancouver, Montreal and Toronto',
      'ThreatBlock malicious-site filtering, IP allowlisting, DNS filtering and a Cloud Firewall for distributed teams',
    ],
    cons: [
      'No confirmed dedicated Canadian office or NordLayer-specific data-residency guarantee',
      'A threat actor claimed a January 2026 breach of Salesforce/Jira-adjacent infrastructure; NordVPN disputes any production impact, calling the leaked data "dummy data" from an old third-party test environment',
    ],
    sub_scores: { fees: 7.6, features: 7.6, ux: 7.8, support: 7.2 },
    verdict: 'A capable business VPN with real Canadian server presence — read the disclosed breach claim below before choosing.',
    attributes: { pricing_model: 'per-user/month', starting_price_note: 'Lite: $8 USD/user/month. Core: $11 USD/user/month (~C$15/month estimated). Premium: $14 USD/user/month. Minimum 5 users on Lite/Core/Premium; Enterprise from $6 USD/user/month at 200+ seats, custom. No native CAD price.', product_category: 'vpn_network_security', key_feature_note: 'ThreatBlock malicious-site filtering, IP allowlisting, DNS filtering (Core+), Cloud Firewall and site-to-site VPN (Premium+), up to 1Gbps throughput.', ca_presence_note: 'NordLayer gateway server nodes exist in Vancouver, Montreal and Toronto. No confirmed dedicated Canadian office or NordLayer-specific data-residency guarantee.', review_score: 4.6, review_count: 33, review_source: 'Capterra', review_note: 'Reviews.io separately shows 4.7/5 (152 reviews, 93% recommend). Do not cite consumer NordVPN\'s Trustpilot score as NordLayer\'s — different product and audience.', security_note: 'A threat actor calling itself "1011" claimed a January 2026 breach of Salesforce/Jira-adjacent development infrastructure. NordVPN\'s response within 24 hours: the exposed data came from an isolated third-party test environment and was "dummy data," with no production or customer data affected. No independent forensic verification of either side\'s account has surfaced as of this page\'s last check, and no Canada-specific dimension to this incident was found.' },
    source_type: 'official', confidence: 'low',
    is_affiliate: false, review_slug: null, external_url: 'https://nordlayer.com/',
    is_top_pick: false, best_for: 'Distributed CA teams needing network access', display_order: 7,
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

await upsert(aiTools, 'ai-tools/ai-tools-finance (ca)');
await upsert(cybersecurity, 'cybersecurity/cybersecurity-smb (ca)');

const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/product_attributes?select=category,topic&market=eq.ca&active=eq.true&topic=in.(ai-tools-finance,cybersecurity-smb)`,
  { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } },
);
const countRows = await countRes.json();
const counts = {};
for (const r of countRows) {
  const key = `${r.category}/${r.topic}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log('\nActive row counts:', counts);
console.log('\nNext: npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts ca ai-tools ai-tools-finance');
console.log('      npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts ca cybersecurity cybersecurity-smb');
