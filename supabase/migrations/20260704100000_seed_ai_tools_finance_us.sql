-- Comparison Cockpit -- seed US AI tools for finance (topic = 'ai-tools-finance', category = 'ai-tools').
-- Mirrors 20260703130000_seed_credit_monitoring_us.sql. Idempotent (ON CONFLICT DO UPDATE).
-- Provenance is mandatory per row (source_url/source_type/confidence/data_verified_at);
-- full source-by-attribute matrix at
-- docs/superpowers/plans/2026-07-04-cockpit-ai-tools-finance-source-matrix.md, translated into
-- concrete seed values (with a Fable-5 pre-migration review + 11 changes, section 0a is the final,
-- authoritative changelog) at
-- docs/superpowers/plans/2026-07-04-cockpit-ai-tools-finance-planned-seed-values.md.
--
-- Candidates (8): Monarch Money, Copilot Money, Ramp, QuickBooks Online (AI/Intuit Assist),
-- Danelfin, Composer by SoFi, ChatGPT (Finances feature), TradingView. Truewind (originally
-- shortlisted as a 9th candidate) is excluded: a live browser check against G2 (WebFetch itself
-- 403s, matching this rollout's established WAF-block pattern) shows exactly 4 reviews, not the
-- "114+" an aggregator site reported -- below every threshold this rollout has used to reject a
-- too-small sample (myFICO's 4-review Trustpilot sample was rejected on the same basis in Slice 6).
-- No backfill to 9 (Forex 7->5, Credit Repair 9->6, Credit Monitoring 9->8 precedent).
--
-- This is the first slice comparing structurally heterogeneous product types with 4 genuinely
-- incompatible pricing structures -- every row seeds `monthly_fee = 0` (not a "reference" number)
-- because the pre-migration review found the shared cockpit-card/table/compare components render
-- a cost figure UNCONDITIONALLY regardless of sortOptions/priorityChips config. A uniform $0
-- across the field (matching the trading-platforms $0-commission precedent exactly) makes that
-- figure inert rather than dishonest; the real, non-comparable pricing lives in the
-- attributes.starting_price_headline/_note fields and the Pricing-model compareRow instead.
--
-- ChatGPT's and Composer's `rating`/`review_count` are seeded 0 at the top level (matching the
-- attributes.review_score/review_count = NULL) -- a small additive fix in cockpit-card.tsx,
-- cockpit-table.tsx and cockpit-compare.tsx now renders reviewCount === 0 as "Not yet rated"/"--"
-- instead of "0.0 from 0 reviews" (which would otherwise read as a false worst-rated claim). This
-- is a new code path that never triggers for any other topic (all have real nonzero review counts).
--
-- Disclosed, not excluded (Freedom-Debt-Relief pattern): OpenAI/ChatGPT (Italian Garante EUR15M
-- fine, Dec 2024, fully overturned by a Rome court 2026-03-18; FTC CID July 2023 = investigation
-- only; March 2023 data breach), Intuit/QuickBooks (FTC Final Order Jan 2024 + $141M multistate
-- settlement May 2022, both TurboTax-marketing-specific, not the QuickBooks product), Composer's
-- parent SoFi (FTC 2019 no-fine cease-and-desist, SEC Aug 2021 $300,000 penalty against SoFi
-- Wealth LLC, FINRA 2024 $1.1M against SoFi Securities -- none attributed to Composer itself,
-- whose own BrokerCheck record (CRD 325118) was directly verified as clean), and Ramp (disclosed
-- complaint pattern, not a legal finding: credit-limit reductions from daily balance monitoring,
-- a March 2026 BBB complaint over an AP-clerk-role payment release).
--
-- Composer is the only regulated entity in the comparison (Composer Technologies Inc. = SEC RIA
-- CRD 311289, confirmed still actively registered post-SoFi-acquisition; Composer Securities LLC
-- = FINRA/SIPC broker-dealer CRD 325118, BrokerCheck disclosure record confirmed clean) -- this is
-- presented as a genuine differentiator fact on its own card/compareRow, never as a page-level
-- regulatory badge (`compliance.regulators: []` stays empty -- 7 of 8 candidates are unregulated
-- software; a badge would falsely dignify them).
--
-- `free_tier_trial` is feature-scoped, not product-scoped: Ramp's free base tier is real but does
-- NOT include Ramp Agents (the AI feature compared here) -- seeded 'none', matching the same logic
-- already applied to ChatGPT (free ChatGPT lacks the Finances feature). QuickBooks corrected to
-- 'trial' (confirmed genuine 30-day free trial across all tiers, including Intuit Assist).
--
-- Affiliate-gate status: is_affiliate=false for ALL 8 -- DB-verified 2026-07-04 via
-- mcp__smartfinpro__list_affiliate_links (72 rows total, all categories checked): zero rows match
-- any of the 9 researched candidates (including Truewind). No affiliate_links rows created
-- (Guardrail 6). Copy.ai/Jasper AI/Systeme.io have real active ai-tools rows but appear in zero
-- finance-AI sources found during research -- correctly excluded from this topic entirely; their
-- existing revenue/links are untouched and do not factor into this slice's monetization footnote.
--
-- external_url is set for ALL 8 candidates (each provider's own bare official homepage -- never a
-- tracked/disguised affiliate link, per the standing rule established in Slice 3). 4 candidates
-- (Monarch, Copilot Money, ChatGPT, QuickBooks) additionally get review_slug pointing at their
-- existing, now-content-fixed SmartFinPro review -- ctaMode resolves to 'review' for those 4,
-- 'visit' for the other 4 (Ramp, Danelfin, Composer, TradingView -- no existing review content).

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, management_fee, account_minimum, monthly_fee,
  attributes, source_type, confidence,
  badges, chips, pros, cons, sub_scores, verdict, deep_dive,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL,
  'monarch', 'us', 'ai-tools', 'ai-tools-finance', 'Monarch Money', 'Best overall -- best AI budgeting app',
  9.2, 4.9, 70000, 0, 0, 0, 0,
  '{"pricing_model":"flat_subscription","starting_price_headline":"$14.99/mo","starting_price_note":"$14.99/mo or $99.99/yr -- flat consumer subscription (7-day trial, card required)","target_segment":"budgeting","ai_features_note":"AI transaction categorization (learns from custom rules), AI Assistant for natural-language queries over your own data, recurring/subscription detection; Plaid aggregation (12,000+ institutions, read-only).","free_tier_trial":"trial","free_tier_trial_note":"7-day trial, credit card required (\"your first week is on us\"); no ongoing free plan.","review_score":4.9,"review_count":70000,"review_source":"App Store","review_note":"Trustpilot profile has only ~24 reviews -- too small, not used (Sky-Blue-Credit rule); App Store 4.9/70,000 + Google Play 4.7/17,600 used instead, both channels disclosed.","regulated_entity":false,"regulatory_history_note":"No FTC, CFPB, SEC or state AG enforcement actions or data breaches found. Note: news references to a \"Monarch data breach\" (2022) refer to Monarch of North Carolina, a behavioral-healthcare company -- no connection to Monarch Money."}'::jsonb,
  'official', 'medium',
  '[{"type":"gold","label":"Top pick"}]'::jsonb,
  ARRAY['Strongest editorial consensus','AI transaction categorization + assistant','Widest platform support among consumer budgeting apps']::text[],
  ARRAY['Strongest multi-source editorial consensus of any candidate -- Forbes Advisor 4.8, NerdWallet and Engadget''s "Mint successor" consensus','AI Assistant lets you ask natural-language questions about your own linked accounts, not just view static categorization','A clean regulatory record -- no enforcement actions or data breaches found']::text[],
  ARRAY['No ongoing free plan -- only a 7-day trial that requires a credit card','Trustpilot profile is too small to be a meaningful signal (~24 reviews); we use App Store/Google Play instead','Plus tier ($199/yr) is annual-billing only, no monthly option']::text[],
  '{"cost":7.8,"features":9.4,"ux":9.2,"support":8.8}'::jsonb,
  'The best overall pick for most people',
  'Monarch Money has the strongest multi-source editorial consensus of any AI budgeting app in this comparison -- Forbes Advisor rates it 4.8 and independent roundups consistently call it the "Mint successor." Its AI Assistant lets you ask natural-language questions about your own linked accounts, on top of learning transaction categorization. Pricing is $14.99/month or $99.99/year for Core, with a Plus tier ($199/year, annual-billing only) adding forecasting and Morningstar analysis. There is no ongoing free plan, only a 7-day trial that requires a card, and it has a clean regulatory record -- no enforcement actions or data breaches found.',
  false, 'monarch-money-review', 'https://www.monarch.com/', true, 'Best AI budgeting app', 1,
  'https://www.monarch.com/pricing', DATE '2026-07-04', true
),
(
  NULL,
  'copilot-money', 'us', 'ai-tools', 'ai-tools-finance', 'Copilot Money', 'Best for Apple users',
  8.8, 4.8, 24000, 0, 0, 0, 0,
  '{"pricing_model":"flat_subscription","starting_price_headline":"$95/yr","starting_price_note":"$95/yr (≈$7.92/mo); $13/mo if billed monthly -- flat consumer subscription (1-month trial)","target_segment":"budgeting","ai_features_note":"Learning AI categorization (\"the more you use it, the smarter it gets\"), personalized recommendations, subscription detection, investment tracking. iPhone/iPad/Mac + web; no Android app (nothing officially announced).","free_tier_trial":"trial","free_tier_trial_note":"1-month trial; no ongoing free plan.","review_score":4.8,"review_count":24000,"review_source":"App Store","review_note":"No usable Trustpilot profile found (the frequently-cited \"4.6\" is not attributable to any findable Copilot Money profile). App Store count varies slightly by source (~24,000-25,000); seeded at the more commonly-cited 24,000.","regulated_entity":false,"regulatory_history_note":"No FTC, CFPB, SEC or state AG enforcement actions or data breaches found."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Apple Editors'' Choice design','Learning AI categorization','Web app since Dec 2025']::text[],
  ARRAY['An Apple Editors'' Choice app widely praised for its interface -- "best-looking budgeting app" is a recurring editorial consensus','Learning AI categorization improves the more you use the app, plus subscription detection and investment tracking','A web app has been available since December 2025 -- no longer Apple-exclusive as some older reviews still claim']::text[],
  ARRAY['No Android app -- iPhone, iPad, Mac and web only, with nothing officially announced for Android','Only a 1-month trial, no ongoing free plan','No standalone Trustpilot profile exists -- some competitor claims citing a "4.6 Trustpilot" for Copilot Money are not attributable to any findable profile']::text[],
  '{"cost":8.6,"features":8.6,"ux":9.4,"support":8.2}'::jsonb,
  'The best pick for Apple users who want the cleanest interface',
  'Copilot Money is an Apple Editors'' Choice pick known for its design and learning AI categorization -- it gets smarter the more you use it, and adds subscription detection and investment tracking on top of standard budgeting. It costs $95/year (about $7.92/month), or $13/month if billed monthly, with only a 1-month trial and no ongoing free plan. It remains iOS/Mac-only aside from a web app that launched in December 2025 -- there is still no Android version.',
  false, 'copilot-money-review', 'https://copilot.money/', false, 'Best for Apple users', 2,
  'https://copilot.money/pricing/', DATE '2026-07-04', true
),
(
  NULL,
  'ramp', 'us', 'ai-tools', 'ai-tools-finance', 'Ramp', 'Best for business spend management',
  8.6, 4.8, 2427, 0, 0, 0, 0,
  '{"pricing_model":"per_user","starting_price_headline":"Free–$15/user/mo","starting_price_note":"Free tier available (unlimited cards, core expense management); Ramp Agents (the AI features) require Ramp Plus, $15/user/mo","target_segment":"spend_management","ai_features_note":"\"Ramp Agents\": live (not roadmap) autonomous approval of low-risk expenses, escalation of the 10-15% edge cases, real-time anomaly/fraud scanning (including AI-generated fake receipts), policy-improvement suggestions. Plus-tier only. Accuracy/detection-rate figures are vendor claims -- labeled as such.","free_tier_trial":"none","free_tier_trial_note":"Genuine, permanent free base tier (unlimited cards, core expense management) -- but Ramp Agents, the AI feature compared on this page, require the paid Plus tier ($15/user/mo). The free tier itself does not include what this column measures.","review_score":4.8,"review_count":2427,"review_source":"G2","review_note":"Channel spread: G2 4.8/2,427 (stable 12-24mo) vs. Trustpilot 3.5/5 (support/credit-limit complaints) vs. Capterra 4.9/200+ -- all three disclosed, not just the flattering G2 number.","regulated_entity":false,"regulatory_history_note":"No FTC, CFPB, SEC or state AG enforcement actions found. BBB profile exists, not accredited, grade not established. Disclosed complaint pattern (not a legal finding): sudden credit-limit reductions from daily linked-bank-balance monitoring; a March 2026 BBB complaint alleging $92,453.70 released by an AP-clerk-role account despite Ramp''s own documentation stating \"AP Clerks cannot release payments\" (an individual customer complaint, not confirmed as an error by Ramp -- labeled as such)."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Live AI expense-approval agents','Strongest B2B editorial consensus','Genuine free base tier']::text[],
  ARRAY['"Ramp Agents" are live, not roadmap -- autonomous approval of low-risk expenses, real-time fraud/anomaly scanning including AI-generated fake receipts, and policy-improvement suggestions','Strongest B2B editorial consensus in this comparison (NerdWallet, Accounting Today, CPA Practice Advisor)','A genuine, permanent free tier with unlimited cards and core expense management for teams that don''t need the AI agents']::text[],
  ARRAY['The free tier does not include Ramp Agents -- the AI features compared on this page require the paid Plus tier at $15/user/month','Disclosed complaint pattern: sudden credit-limit reductions from daily balance monitoring, and a March 2026 BBB complaint over an AP-clerk-role payment release','Consumer-review channel spread is wide -- G2 4.8 (B2B evaluators) vs. Trustpilot 3.5 (support/limit complaints); read both, not just one']::text[],
  '{"cost":8.4,"features":9.0,"ux":8.6,"support":7.8}'::jsonb,
  'The best pick for business spend management with live AI agents',
  'Ramp''s "Ramp Agents" are a live, not roadmap, AI feature: autonomous approval of low-risk expenses, real-time anomaly and fraud scanning (including AI-generated fake receipts), and policy-improvement suggestions, backed by the strongest B2B editorial consensus in this comparison. Its free base tier is genuinely permanent and unlimited on cards, but the AI agents themselves require the paid Plus tier at $15 per user per month -- the free tier alone does not include what this page compares. Disclosed complaints (not legal findings) include sudden credit-limit reductions from daily balance monitoring and a March 2026 BBB complaint over a payment release.',
  false, null, 'https://ramp.com/', false, 'Best for business spend management', 3,
  'https://ramp.com/pricing', DATE '2026-07-04', true
),
(
  NULL,
  'quickbooks-ai', 'us', 'ai-tools', 'ai-tools-finance', 'QuickBooks Online', 'Best AI inside accounting software',
  8.2, 4.0, 2967, 0, 0, 0, 0,
  '{"pricing_model":"bundle_tier","starting_price_headline":"from $38/mo","starting_price_note":"from $38/mo (Simple Start) -- bundled inside an accounting-software subscription; higher AI-agent features require Advanced ($275/mo)","target_segment":"accounting","ai_features_note":"Intuit Assist (conversational assistant from Simple Start), automated categorization, cash-flow forecasting, anomaly detection; higher-tier AI Agents (finance/project workflows) only on Advanced ($275/mo) -- AI feature depth genuinely varies by plan.","free_tier_trial":"trial","free_tier_trial_note":"30-day free trial, no credit card required, confirmed to include Intuit Assist across all tiers.","review_score":4.0,"review_count":2967,"review_source":"G2","review_note":"Extreme channel spread (Experian/Ramp pattern): G2 4.0/2,967 (B2B evaluators) vs. Trustpilot-US 1.1/1,244 (unclaimed profile, billing/support escalations) vs. Trustpilot-UK 3.9/~16,600 (managed profile). Never use one number alone -- all three disclosed.","regulated_entity":false,"regulatory_history_note":"Parent-level disclosure (not attributed to the QuickBooks product itself): FTC Opinion + Final Order, January 2024, finding Intuit''s TurboTax \"free\" advertising deceptive; a separate $141M multistate AG settlement, May 2022, over the same TurboTax \"free\" marketing. Both concern TurboTax marketing, not QuickBooks. No QuickBooks-product-specific enforcement action found."}'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['Intuit Assist from the cheapest paid tier','30-day free trial across all tiers','Market-leading SMB accounting platform']::text[],
  ARRAY['Intuit Assist (conversational AI assistant) is included starting at the cheapest paid tier, Simple Start ($38/mo)','30-day free trial, no credit card required, confirmed to include the AI features across every tier','Market-leading SMB accounting platform with the broadest third-party integration ecosystem']::text[],
  ARRAY['AI feature depth genuinely varies by plan -- higher-tier AI Agents for finance/project workflows require Advanced at $275/mo','Consumer-review channel spread is extreme: G2 4.0 vs. Trustpilot-US 1.1 (unclaimed profile) vs. Trustpilot-UK 3.9 (managed profile) -- never trust one number alone','Parent company Intuit has a January 2024 FTC order and a 2022 $141M multistate settlement over TurboTax "free" advertising -- unrelated to the QuickBooks product itself, but worth knowing about the parent company']::text[],
  '{"cost":7.4,"features":8.8,"ux":8.0,"support":7.0}'::jsonb,
  'The best AI features built into full accounting software',
  'QuickBooks Online bundles Intuit Assist -- a conversational AI assistant plus automated categorization, cash-flow forecasting and anomaly detection -- starting at its cheapest paid tier, Simple Start ($38/month), with a confirmed 30-day free trial across all tiers. Higher-value AI Agents for finance and project workflows are reserved for the Advanced tier ($275/month). Consumer reviews show an extreme channel spread (G2 4.0 vs. Trustpilot-US 1.1 vs. Trustpilot-UK 3.9) worth reading in full rather than trusting one number. Parent company Intuit has a 2024 FTC order and a 2022 multistate settlement over TurboTax marketing -- unrelated to the QuickBooks product itself.',
  false, 'quickbooks-ai-review', 'https://quickbooks.intuit.com/', false, 'Best AI inside accounting software', 4,
  'https://quickbooks.intuit.com/pricing/', DATE '2026-07-04', true
),
(
  NULL,
  'danelfin', 'us', 'ai-tools', 'ai-tools-finance', 'Danelfin', 'Best AI stock research',
  8.0, 4.2, 90, 0, 0, 0, 0,
  '{"pricing_model":"flat_subscription","starting_price_headline":"$22–59/mo","starting_price_note":"Plus $22/mo ($199/yr); Pro $59/mo ($499/yr) -- flat SaaS subscription","target_segment":"stock_research","ai_features_note":"Explainable AI Score (1-10) per US stock/ETF (probability of 3-month outperformance vs. S&P 500), 10,000+ daily features per stock, trade ideas, screener, portfolio tools, API. Performance claims (\"21% alpha,\" \"70% win rate\") are vendor-reported backtests -- labeled as such, never presented as independent fact.","free_tier_trial":"trial","free_tier_trial_note":"14-day trial confirmed on both Plus and Pro, plus a 30-day money-back guarantee.","review_score":4.2,"review_count":90,"review_source":"Trustpilot","review_note":"Smallest still-usable sample in the field (~90 reviews) -- disclosed as such, not hidden.","regulated_entity":false,"regulatory_history_note":"No FTC, CFPB, SEC or state AG enforcement actions found. Not an SEC-registered adviser; operates as a research/publisher tool (\"not investment advice\")."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Explainable AI Score per stock','10,000+ daily features analyzed per stock','14-day trial + 30-day money-back guarantee']::text[],
  ARRAY['A purpose-built, explainable AI Score (1-10) rates each US stock/ETF''s probability of 3-month outperformance vs. the S&P 500','Analyzes 10,000+ technical, fundamental and sentiment features per stock daily, with a screener, trade ideas and an API','14-day free trial on both paid tiers, plus a 30-day money-back guarantee']::text[],
  ARRAY['Performance claims ("21% alpha," "70% win rate") are vendor-reported backtests, not independently verified results','Smallest consumer-review sample in this comparison (~90 Trustpilot reviews) -- still usable, but the thinnest base in the field','Not an SEC-registered investment adviser -- a research/publisher tool, not a source of licensed financial advice']::text[],
  '{"cost":8.0,"features":8.4,"ux":8.2,"support":7.6}'::jsonb,
  'The best purpose-built AI stock research tool',
  'Danelfin''s explainable AI Score rates every US stock and ETF''s probability of outperforming the S&P 500 over the next 3 months, drawing on 10,000+ daily technical, fundamental and sentiment features per stock. Plans run $22/month (Plus) to $59/month (Pro), both with a 14-day trial and a 30-day money-back guarantee. Its headline performance claims are vendor-reported backtests, not independently verified, and its ~90-review Trustpilot base is the thinnest consumer-review sample in this comparison -- still usable, but worth knowing.',
  false, null, 'https://danelfin.com/', false, 'Best AI stock research', 5,
  'https://danelfin.com/pricing/monthly', DATE '2026-07-04', true
),
(
  NULL,
  'composer', 'us', 'ai-tools', 'ai-tools-finance', 'Composer by SoFi', 'Best AI investing automation',
  8.0, 0, 0, 0, 0, 0, 0,
  '{"pricing_model":"flat_subscription","starting_price_headline":"$40/mo","starting_price_note":"$40/mo Trading Pass, or $32/mo billed annually ($384/yr) -- flat subscription plus a live brokerage account","target_segment":"automated_investing","ai_features_note":"Natural-language strategy creation/refinement, backtesting, automated rule-based execution. Explicitly self-limited in its own press release: no agentic trading -- AI builds rules, execution follows deterministic, user-defined rules.","free_tier_trial":"free_tier","free_tier_trial_note":"Free tier covers strategy building and backtesting only -- live automated execution requires the paid Trading Pass.","review_score":null,"review_count":null,"review_source":"n/a -- App Store rating/count not independently confirmed","review_note":"Trustpilot 2.9/5 from only ~25 reviews -- too small, not used (Sky-Blue-Credit rule). App Store rating/count could not be independently confirmed via search; a qualitative billing-complaint pattern is disclosed in the regulatory note instead of a guessed number.","regulated_entity":true,"regulated_entity_note":"Composer Technologies Inc. is an SEC-registered Investment Adviser (CRD 311289, active registration confirmed); Composer Securities LLC is a FINRA- and SIPC-member broker-dealer (CRD 325118) with zero disclosure events on its BrokerCheck record (confirmed directly, not the parent''s) -- the only SEC/FINRA-registered entity in this comparison.","regulatory_history_note":"Composer entities: no enforcement actions found; BrokerCheck disclosure section for Composer Securities LLC (CRD 325118) directly verified as clean (zero disclosure events). Parent SoFi (footnote, not attributed to Composer): FTC Final Order, Feb 2019 (misleading student-loan-savings advertising claims; no fine, cease-and-desist); SEC settled charges, Aug 2021, against SoFi Wealth LLC for breaching fiduciary duty by investing client robo-advisory assets into SoFi''s own proprietary ETFs without adequate disclosure -- $300,000 penalty, censure, cease-and-desist; FINRA, 2024, $1.1M fine against SoFi Securities for customer-identification/identity-theft-prevention failures (2018-19, ~800 accounts)."}'::jsonb,
  'official', 'medium',
  '[{"type":"sky","label":"SEC/FINRA regulated"}]'::jsonb,
  ARRAY['Only regulated entity in this comparison','Natural-language strategy building + backtesting','No agentic trading -- deterministic rule execution']::text[],
  ARRAY['The only SEC/FINRA-registered entity in this comparison -- Composer Technologies Inc. is an SEC-registered Investment Adviser and Composer Securities LLC is a FINRA/SIPC broker-dealer with a clean disclosure record','Build and refine investment strategies in natural language, with backtesting before you risk real money','Explicitly no agentic trading -- the AI builds rules, but execution follows deterministic, user-defined logic, not autonomous AI decisions']::text[],
  ARRAY['$40/month Trading Pass (or $32/month billed annually) is a cost on top of any trading losses your strategy incurs','Trustpilot sample is too small to trust (~25 reviews) and App Store rating/count could not be independently confirmed','Backtested performance never guarantees future returns -- a genuine risk for any rule-based strategy, disclosed plainly here']::text[],
  '{"cost":7.4,"features":8.6,"ux":8.2,"support":7.8}'::jsonb,
  'The best regulated AI investing-automation platform',
  'Composer by SoFi is the only regulated entity in this comparison: Composer Technologies Inc. is an SEC-registered Investment Adviser, and Composer Securities LLC is a FINRA- and SIPC-member broker-dealer with a clean, directly-verified disclosure record. It lets you build and backtest investment strategies in natural language, with automated execution that explicitly follows deterministic rules rather than autonomous AI trading decisions. The Trading Pass costs $40/month (or $32/month billed annually), and a free tier covers strategy building and backtesting without live execution. Parent company SoFi carries its own separate regulatory history (FTC 2019, SEC $300,000 penalty 2021, FINRA $1.1M 2024) -- disclosed as a parent-level footnote, not attributed to Composer itself.',
  false, null, 'https://www.composer.trade/', false, 'Best AI investing automation', 6,
  'https://www.composer.trade/pricing', DATE '2026-07-04', true
),
(
  NULL,
  'chatgpt-finances', 'us', 'ai-tools', 'ai-tools-finance', 'ChatGPT (Finances)', 'Most versatile AI finance assistant',
  7.6, 0, 0, 0, 0, 0, 0,
  '{"pricing_model":"bundle_tier","starting_price_headline":"$20/mo (bundle)","starting_price_note":"$20/mo (ChatGPT Plus) -- the AI finance feature is one part of a general-purpose LLM subscription, not a standalone product; Free tier does not include it","target_segment":"llm_assistant","ai_features_note":"Account aggregation via Plaid (12,000+ institutions -- Schwab, Fidelity, Chase, Robinhood, Amex, Capital One, etc.), spending/subscription/portfolio dashboard, conversational analysis of your own linked accounts. No budgeting workflow (no budgets/rules/goals) -- narrower than purpose-built apps. US-only, still in preview (launched Pro-only 2026-05-15, expanded to Plus 2026-06-25).","free_tier_trial":"none","free_tier_trial_note":"Free ChatGPT does not include the Finances feature at all -- Plus ($20/mo) is the minimum paid tier that unlocks it.","review_score":null,"review_count":null,"review_source":"n/a -- feature too new to rate","review_note":"Feature launched 2026-05-15 (Pro-only), expanded to Plus 2026-06-25 -- 7 weeks old at research time, no feature-specific review base exists yet. App-Store-wide ChatGPT ratings measure the entire app, not this feature, so are deliberately NOT used here to avoid a misleading borrowed score.","regulated_entity":false,"regulatory_history_note":"OpenAI: Italian Garante fined EUR15M (Dec 2024, GDPR/training data) -- overturned in full by a Rome court on 2026-03-18; fined, then judicially overturned, not a standing sanction. FTC issued a Civil Investigative Demand (July 2023) -- an investigation, not an enforcement action; no finding made. A March 2023 data breach exposed some ChatGPT Plus subscribers'' chat titles and limited payment data -- disclosed as historical precedent relevant to the finance feature''s centralization risk."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Aggregates 12,000+ institutions via Plaid','Conversational analysis of your own finances','Widest general-purpose reach of any candidate']::text[],
  ARRAY['Connects to 12,000+ financial institutions via Plaid (Schwab, Fidelity, Chase, Robinhood, Amex, Capital One and more) for a spending/subscription/portfolio dashboard','Lets you ask natural-language questions across your own linked accounts, drawing on the same reasoning as general ChatGPT','Backed by Plaid''s own confirmation of the integration -- a real, current feature, not a rumor']::text[],
  ARRAY['A real, disclosed privacy risk: a compromised ChatGPT account could expose your linked balances and transactions alongside your entire chat history; OpenAI disclosed a March 2023 breach exposing some subscribers'' chat titles and payment data','Free ChatGPT does not include this feature at all -- Plus ($20/month) buys an entire general-purpose LLM subscription, not just the finance feature','Feature is 7 weeks old at review time with no feature-specific review base yet, and no budgeting workflow (no budgets, rules or goals) unlike purpose-built apps']::text[],
  '{"cost":7.0,"features":8.2,"ux":7.6,"support":6.8}'::jsonb,
  'The most versatile AI finance assistant, with real privacy trade-offs',
  'ChatGPT''s Finances feature connects to 12,000+ institutions via Plaid and lets you ask natural-language questions about your own linked accounts -- the widest, most conversational reach of any tool in this comparison, confirmed live as of 2026-05-15 (Pro) and 2026-06-25 (Plus), still US-only and in preview. The honest trade-off: you''re paying $20/month for an entire general-purpose LLM subscription, not a finance app, and centralizing your financial data inside a general-purpose chatbot carries real privacy risk -- OpenAI disclosed a March 2023 breach exposing some subscribers'' chat data. The feature is too new (7 weeks old) for a credible review score, so we don''t borrow one from the unrelated, app-wide ChatGPT rating.',
  false, 'chatgpt-for-finance-review', 'https://openai.com/chatgpt/', false, 'Most versatile AI finance assistant (privacy caveats)', 7,
  'https://openai.com/index/personal-finance-chatgpt/', DATE '2026-07-04', true
),
(
  NULL,
  'tradingview', 'us', 'ai-tools', 'ai-tools-finance', 'TradingView', 'Best AI stock charting (beta)',
  7.4, 1.5, 1205, 0, 0, 0, 0,
  '{"pricing_model":"freemium","starting_price_headline":"Free–$14.95/mo","starting_price_note":"Free tier available; paid plans from $14.95/mo (Essential) unlock higher AI-copilot request limits","target_segment":"charting","ai_features_note":"AI Chart Copilot: public-beta Chrome browser extension (officially confirmed via TradingView''s own blog, not a community script) -- chart interpretation, indicator/trendline automation, news/earnings-catalyst summaries, natural-language screening, alert creation. Free during beta with request caps that scale by paid tier. Also ships AI news/filing summaries platform-wide.","free_tier_trial":"free_tier","free_tier_trial_note":"Genuine, permanent $0 tier; AI Chart Copilot works on it too during the public beta, with the lowest request cap.","review_score":1.5,"review_count":1205,"review_source":"Trustpilot","review_note":"Weakest consumer score in the field: 1.5/5 from ~1,205 Trustpilot reviews (support/cancellation friction, NOT charting quality) alongside 100M+ users and uniformly positive trade-press coverage (StockBrokers.com et al.) -- both sides disclosed.","regulated_entity":false,"regulatory_history_note":"No FTC, CFPB, SEC or state AG enforcement actions found. Operates as a non-broker charting/publication platform (BBB category: \"Trade Publications\"), outside SEC/FINRA broker oversight -- stated plainly, not dressed up as a compliance credential."}'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['AI Chart Copilot (public beta)','100M+ users, genuine free tier','Uniformly positive trade-press coverage']::text[],
  ARRAY['AI Chart Copilot (officially confirmed, not a community script) handles chart interpretation, indicator automation, news/earnings summaries and natural-language screening, free during its public beta','A genuine, permanent free tier -- the AI copilot works on it too, just with the lowest request cap','100M+ users and uniformly positive trade-press coverage (StockBrokers.com and others) for its core charting product']::text[],
  ARRAY['The weakest consumer-review score in this entire comparison: 1.5/5 from ~1,205 Trustpilot reviews, driven by support and cancellation friction, not charting quality','AI Chart Copilot is a public-beta Chrome extension with request caps that scale by plan tier -- not a finished, standalone AI product','Not a broker and not SEC/FINRA-regulated -- purely a charting/publication platform (BBB category "Trade Publications")']::text[],
  '{"cost":8.8,"features":8.0,"ux":7.8,"support":5.4}'::jsonb,
  'The best AI-assisted charting platform, with a genuine free tier and a beta caveat',
  'TradingView''s AI Chart Copilot -- officially confirmed via the company''s own blog, not a community script -- handles chart interpretation, indicator automation, and natural-language screening, free during its public beta with request caps that scale by plan. TradingView''s free tier is genuine and permanent, with 100M+ users and uniformly positive trade-press coverage for its core charting product. The honest caveat: the AI copilot is explicitly beta, not a finished product, and TradingView''s Trustpilot score (1.5/5 from ~1,205 reviews) is the weakest in this entire comparison -- driven by support and cancellation friction, not the quality of the charting tools themselves.',
  false, null, 'https://www.tradingview.com/', false, 'Best AI stock charting (beta)', 8,
  'https://www.tradingview.com/blog/en/tradingview-ai-chart-copilot-beta-57730/', DATE '2026-07-04', true
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
  monthly_fee = EXCLUDED.monthly_fee,
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
