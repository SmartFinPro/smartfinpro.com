-- Comparison Cockpit -- seed US credit monitoring services (topic = 'credit-monitoring', category = 'personal-finance').
-- Mirrors 20260703120000_seed_credit_repair_companies_us.sql. Idempotent (ON CONFLICT DO UPDATE).
-- Provenance is mandatory per row (source_url/source_type/confidence/data_verified_at);
-- full source-by-attribute matrix at
-- docs/superpowers/plans/2026-07-03-cockpit-credit-monitoring-source-matrix.md, translated into
-- concrete seed values (with a Fable-5 pre-migration review + 12 changes, §0a is the final,
-- authoritative changelog) at
-- docs/superpowers/plans/2026-07-03-cockpit-credit-monitoring-planned-seed-values.md.
--
-- Candidates (8): Experian IdentityWorks, Aura, LifeLock, IDShield, myFICO, IdentityForce,
-- Credit Karma, IdentityIQ. Excluded entirely (no backfill, per the Forex-slice 7->5 /
-- Credit-Repair-slice 9->6 precedent): PrivacyGuard (no citable consumer-review base -- no
-- Trustpilot profile, ~1-star ConsumerAffairs on a tiny sample -- plus its Trilegiant/Affinion
-- parent's $30M/46-state-plus-DC deceptive-enrollment settlement has no compensating strength).
-- Identity Guard gets no slot -- it IS Aura (acquired 2019, same corporate product line); a
-- second slot would be false diversity. Both are covered in the buyerGuide instead of a row.
--
-- `monthly_fee` is the recurring subscription fee that drives the (zero-shared-code-change)
-- `banking` cost model; `fx_fee_pct`/`atm_fee` are left at their DB default of 0 for every row
-- so `annualCost` collapses honestly to `monthly_fee * 12 * years`.
--
-- Disclosed, not excluded (Freedom-Debt-Relief pattern): IdentityIQ ($8.77M Caldwell autorenewal
-- class-action settlement + $1-trial mechanics + BBB grade seeded NULL, not the stale "A+" some
-- search results still show), LifeLock (FTC $12M 2010 + $100M 2015 contempt settlement), Experian
-- (CFPB $3M 2017 + CAN-SPAM $650k 2023 + an ACTIVE CFPB FCRA suit as of March 2026, phrased as
-- pending/no finding and disclosed directly in its top-pick deep_dive per the Fable-5 review's
-- change 8), Credit Karma (FTC $3M dark-patterns settlement 2023), and IdentityForce's parent
-- TransUnion (CFPB consent order 2017 + a 2022 suit dismissed with prejudice 2025 -- attributed to
-- the parent, never the product).
--
-- Fable-5 review corrections applied here (see planned-seed-values.md §0a for full detail):
-- Experian and Credit Karma `bbb_accredited` corrected to FALSE (the initial draft invented
-- `true` for both -- neither is BBB-accredited); Credit Karma's `bbb_rating` corrected from a
-- stale "F" snapshot to the directly-re-verified "B-"; IDShield's `id_theft_insurance` seeded at
-- the individual-plan $1,000,000 (NOT the family-plan-only $3,000,000, which would have falsely
-- beaten IdentityForce's real $2,000,000 individual-plan maximum in a winner:'max' column);
-- Credit Karma `family_plan` corrected from a schema-invalid "n/a" to `false` with a note.
--
-- Affiliate-gate status: is_affiliate=false for ALL 8 -- DB-verified 2026-07-03 via
-- mcp__smartfinpro__list_affiliate_links (72 rows total): zero rows match any of the 10
-- researched candidates in any category. No affiliate_links rows created (Guardrail 6).
--
-- external_url is set for ALL 8 candidates (each provider's own bare official homepage -- never
-- a tracked/disguised affiliate link, per the standing rule established in Slice 3).

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
  'experian-identityworks', 'us', 'personal-finance', 'credit-monitoring', 'Experian IdentityWorks', 'Best overall -- genuine free tier, daily 3-bureau monitoring',
  9.2, 4.1, 94000, 0, 0, 0, 24.99,
  '{"free_tier":"partial","free_tier_note":"Experian-bureau-only free tier: Experian report + FICO 8 monthly, basic alerts, manual dark-web scan, free freeze. Permanent, no credit card required.","bureaus_monitored":3,"monitoring_scope_note":"FICO-score monitoring using Experian''s own bureau data, dark-web monitoring, SSN monitoring, and CreditLock -- lock/unlock your Experian file instantly via the app, the strongest lock feature in this comparison.","id_theft_insurance":1000000,"id_theft_insurance_note":"Up to $1,000,000 on the Premium and Family plans (per adult on Family).","family_plan":true,"family_plan_note":"$34.99/month, 2 adults + up to 10 children.","bbb_rating":"F","bbb_rating_note":"Costa Mesa parent-company BBB profile (35 unanswered + 78 unresolved complaints of 12,000+ over 3 years) -- a bureau-wide complaint volume dominated by credit-report disputes, not specific to the IdentityWorks product.","bbb_accredited":false,"review_score":4.1,"review_count":94000,"review_source":"Trustpilot","review_note":"Experian is a paying Trustpilot customer with active reputation management (99% of negative reviews answered within 48 hours); organic channels (BBB, ConsumerAffairs) score markedly worse than this curated figure.","score_model":"fico","regulatory_history_note":"CFPB fined Experian $3 million in 2017 for deceptive marketing of credit scores; DOJ/FTC fined its ConsumerInfo.com subsidiary $650,000 in 2023 for CAN-SPAM violations (marketing emails with no opt-out). As of March 2026, the CFPB is actively litigating a separate Fair Credit Reporting Act lawsuit against Experian (filed January 2025) alleging its dispute-investigation process amounted to \"sham investigations\"; Experian''s motion to dismiss was denied in October 2025 and the case is in discovery. No court has made a finding of wrongdoing and the case is unresolved -- disclosed here because Experian is our top pick, not buried in a footnote."}'::jsonb,
  'official', 'high',
  '[{"type":"gold","label":"Top pick"}]'::jsonb,
  ARRAY['Genuine free tier','Daily 3-bureau monitoring','Real FICO Score access']::text[],
  ARRAY['Only service in this comparison built on your actual Experian credit file, including a genuine, permanent free tier','Premium plan monitors all three bureaus daily and includes CreditLock to instantly freeze/unfreeze your Experian file from the app','Up to $1,000,000 in ID theft insurance on paid plans']::text[],
  ARRAY['An active CFPB lawsuit (filed Jan. 2025, in discovery as of March 2026) alleges Experian''s dispute process amounts to "sham investigations" -- unresolved, no finding of wrongdoing yet','BBB profile shows an F rating with 12,000+ complaints over 3 years, driven mostly by credit-reporting disputes, not the monitoring product itself','Trustpilot score benefits from active, paid reputation management -- organic review channels are notably harsher']::text[],
  '{"cost":8.4,"features":9.6,"ux":9.0,"support":7.8}'::jsonb,
  'The best overall pick for most people',
  'Experian IdentityWorks is our top pick for credit monitoring: it''s the only service here built on the bureau''s own data, with a genuine, permanent free tier (Experian report + FICO 8 monthly) and a $24.99/month Premium plan that monitors all three bureaus daily, includes up to $1,000,000 in insurance, and adds CreditLock -- instant freeze/unfreeze of your Experian file from the app. Its biggest disclosed caveat: Experian is currently defending an active CFPB lawsuit over its dispute-handling practices, filed in January 2025 and still in discovery as of March 2026, with no finding of wrongdoing to date.',
  false, null, 'https://www.experian.com/protection/', true, 'Best overall', 1,
  'https://www.experian.com/protection/compare-identity-theft-products/', DATE '2026-07-03', true
),
(
  NULL,
  'aura', 'us', 'personal-finance', 'credit-monitoring', 'Aura', 'Best for families -- 3-bureau on every plan, fastest alerts',
  9.0, 4.3, 1103, 0, 0, 0, 15.00,
  '{"free_tier":"none","free_tier_note":"14-day trial; 60-day money-back guarantee on annual plans.","bureaus_monitored":3,"monitoring_scope_note":"Dark-web, SSN, home-title and bank/account monitoring bundled with a VPN, antivirus and a password manager; independently tested as the fastest alerting in the field (Money.com).","monthly_fee_note":"Current $15/month individual list price (monthly billing). Renewal-vs-first-year pricing parity is not independently confirmed -- some sources say Aura''s renewal price typically matches the list price absent a general increase, others say identity-protection renewals commonly rise. Confirm your specific renewal rate before enrolling.","id_theft_insurance":1000000,"id_theft_insurance_note":"$1,000,000 per adult; the Family plan aggregates up to $5,000,000 across 5 adults.","family_plan":true,"family_plan_note":"5 adults + unlimited children, $50/month (monthly billing) or $37/month (annual); Kids add-on $13/month. A cheaper sister brand, Identity Guard (same parent company since a 2019 acquisition), starts at $8.99/month without Aura''s VPN/antivirus bundle -- not ranked separately here since it is the same company.","bbb_rating":"A+","bbb_accredited":true,"review_score":4.3,"review_count":1103,"review_source":"Trustpilot","review_note":"Organic BBB customer reviews are far harsher: 1.11/5 from 115 reviews, with 198 complaints in 3 years. Both the curated Trustpilot 4.3 and the organic BBB score are disclosed here rather than only the flattering one.","score_model":"vantagescore","regulatory_history_note":"No FTC, CFPB or state AG enforcement actions found. A March 2026 data breach exposed roughly 900,000 contact records (mostly names and emails from a marketing tool tied to a 2021 acquisition; fewer than 20,000 active and 15,000 former customers had any real exposure) after a vishing attack on an employee -- the ShinyHunters group claimed responsibility. Aura states no SSNs, passwords or financial data were exposed, and disclosed the incident with a documented response plan."}'::jsonb,
  'official', 'medium',
  '[{"type":"sky","label":"Best for families"}]'::jsonb,
  ARRAY['3-bureau on every tier, no gating','Fastest alerting in testing','Covers 5 adults + unlimited kids']::text[],
  ARRAY['The only service in this comparison that monitors all three bureaus on every plan, including its cheapest tier','Independently tested as the fastest identity-theft alerting in the category (Money.com)','Family plan covers 5 adults plus unlimited children for $50/month, with a Kids add-on for younger dependents']::text[],
  ARRAY['A March 2026 data breach exposed roughly 900,000 contact records (no SSNs, passwords or financial data, per Aura)','Renewal-vs-first-year pricing parity is not independently confirmed by third-party sources','Organic BBB customer reviews (1.11/5) diverge sharply from its curated Trustpilot score (4.3)']::text[],
  '{"cost":8.8,"features":9.2,"ux":9.4,"support":8.8}'::jsonb,
  'The best pick for covering your whole family',
  'Aura is the only service in this comparison that monitors all three credit bureaus on every plan, with no tier-gating, and independent testing rates its alerting as the fastest in the category. Its $50/month family plan covers 5 adults plus unlimited children, and $1,000,000 in insurance per adult (up to $5,000,000 aggregated on Family) is included throughout. A March 2026 data breach exposed contact information for a limited subset of customers -- disclosed here despite the irony for an identity-protection vendor -- and Aura''s own renewal pricing isn''t independently confirmed to match its advertised list price.',
  false, null, 'https://www.aura.com/', false, 'Best for families', 2,
  'https://www.aura.com/pricing', DATE '2026-07-03', true
),
(
  NULL,
  'lifelock', 'us', 'personal-finance', 'credit-monitoring', 'LifeLock', 'Best brand recognition -- largest verified review base',
  8.6, 4.8, 13668, 0, 0, 0, 19.99,
  '{"free_tier":"none","bureaus_monitored":3,"monitoring_scope_note":"Dark-web monitoring, account alerts (up to 5 accounts on Advanced, unlimited on Total), data-broker removal, and scam-fund reimbursement ($5,000 on Advanced, $10,000 on Total); Total tier adds home-title, SIM-swap and 401(k)/investment-fraud monitoring.","monthly_fee_note":"LifeLock''s February 2026 plan restructure prices new subscriptions at renewal parity -- the $19.99/month Advanced rate is a genuine, ongoing monthly-billing price, not a first-year-only teaser. Legacy pre-2026 plans, where still active, have historically renewed roughly 40-70% higher than their first-year price.","id_theft_insurance":1000000,"id_theft_insurance_note":"\"Million Dollar Protection Package\" covers up to $1,000,000 in lawyers and experts on every plan. Stolen-funds reimbursement is a smaller, tier-specific sub-limit: $5,000 on Advanced (the seeded plan), $10,000 on Total -- not the full $1,000,000, and legacy marketing that advertised a combined $3,000,000 applied only to the discontinued Ultimate Plus tier.","family_plan":true,"family_plan_note":"Family variants of every tier, up to $74.99/month on Total Family; includes children''s SSN monitoring.","bbb_rating":"A+","bbb_accredited":true,"review_score":4.8,"review_count":13668,"review_source":"Trustpilot","score_model":"vantagescore","regulatory_history_note":"LifeLock has a two-part FTC enforcement history: a $12 million settlement in 2010 (with 35 states, over deceptive advertising \"guarantees\"), followed by a $100 million contempt settlement in 2015 for violating that 2010 order -- the largest FTC order-enforcement amount in the agency''s history at the time, with $68 million distributed directly to affected customers. No new enforcement action in the 11 years since; ownership changed hands to Symantec/Norton in 2017 and the brand now operates under Gen Digital."}'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['Largest verified review base in the field','PCMag Editors'' Choice','Data-broker removal + scam reimbursement']::text[],
  ARRAY['13,668 Trustpilot reviews at 4.8/5 -- the largest, most verified consumer-review base in this entire comparison','PCMag''s Editors'' Choice pick for identity theft protection, bundled with Norton 360 device security','Data-broker removal and scam-fund reimbursement ($5,000-$10,000 depending on tier) not offered by every competitor']::text[],
  ARRAY['A $12 million (2010) and $100 million (2015) FTC settlement history -- the largest FTC order-enforcement amount in agency history at the time, though 11 years clean since','Legacy pre-2026 plans historically renewed 40-70% above their first-year price','Stolen-funds reimbursement is a modest $5,000-$10,000 sub-limit, well below the $1,000,000 headline lawyer/expert coverage']::text[],
  '{"cost":8.2,"features":8.6,"ux":8.8,"support":8.6}'::jsonb,
  'The most recognized brand, with the deepest review base',
  'LifeLock pairs the largest verified consumer-review base in this comparison (13,668 Trustpilot reviews at 4.8/5) with a PCMag Editors'' Choice pick and a February 2026 plan restructure that now prices new subscriptions at renewal parity -- the $19.99/month Advanced rate is a real ongoing rate, not a first-year teaser. Its history includes a $12 million FTC settlement in 2010 and a $100 million contempt settlement in 2015 (the largest FTC order-enforcement amount in the agency''s history at the time) for violating that order -- 11 years clean since, under new ownership as Gen Digital.',
  false, null, 'https://lifelock.norton.com/', false, 'Best brand recognition', 3,
  'https://lifelock.norton.com/products', DATE '2026-07-03', true
),
(
  NULL,
  'idshield', 'us', 'personal-finance', 'credit-monitoring', 'IDShield', 'Best restoration -- licensed private investigators',
  8.4, 4.7, 673, 0, 0, 0, 19.95,
  '{"free_tier":"none","free_tier_note":"30-day trial -- card is not charged for 30 days and you can cancel anytime during that window.","bureaus_monitored":3,"monitoring_scope_note":"Dark-web and social-media monitoring; restoration is handled by licensed private investigators with unlimited consultation, plus a cybersecurity bundle (malware protection on up to 3 devices).","id_theft_insurance":1000000,"id_theft_insurance_note":"Individual plans carry $1,000,000 in insurance; the widely-advertised $3,000,000 figure applies to the family plan only, not the individual plan seeded here. Sources also disagree on the exact structure: some describe a flat \"$1M individual / $3M family\" split, others describe \"up to $3M on all plans with a $1M stolen-funds sub-limit\" (AIG-underwritten). Confirm the current structure directly with IDShield before enrolling.","family_plan":true,"family_plan_note":"2 adults + up to 10 children, $29.95 (1-bureau) or $34.95/month (3-bureau).","bbb_rating":"A+","bbb_accredited":true,"bbb_accredited_note":"Accredited since 1995 via parent LegalShield -- the longest BBB track record in this comparison.","review_score":4.7,"review_count":673,"review_source":"Trustpilot","score_model":"vantagescore","regulatory_history_note":"No FTC, CFPB or state AG enforcement actions found. Context, not a compliance finding: parent company PPLSI (LegalShield) distributes IDShield primarily through independent network marketing (MLM-style) representatives rather than direct retail -- worth knowing when evaluating pricing and sales-pitch context, though it is not itself a legal or regulatory issue."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Licensed private investigators handle restoration','Longest BBB accreditation in the field (since 1995)','30-day trial, cancel anytime']::text[],
  ARRAY['Restoration is handled by licensed private investigators with unlimited consultation -- a distinct model from the case-manager approach most competitors use','Parent company LegalShield has been BBB-accredited since 1995, the longest track record of any candidate in this comparison','30-day trial with no charge until it ends, and cancellation any time during the trial']::text[],
  ARRAY['The oft-quoted $3,000,000 insurance figure applies to the family plan only -- the individual plan carries $1,000,000, and sources disagree on the exact coverage structure','Distributed primarily through independent network-marketing (MLM-style) representatives rather than direct retail','BBB customer reviews (3.22/5 from 317+) are noticeably weaker than its Trustpilot score, driven by cancellation friction']::text[],
  '{"cost":8.6,"features":8.4,"ux":8.0,"support":8.8}'::jsonb,
  'The strongest restoration model in the category',
  'IDShield''s standout feature is its restoration model: licensed private investigators, not just case managers, handle recovery with unlimited consultation. Its parent, LegalShield, has held BBB accreditation since 1995 -- the longest track record in this comparison -- and a 30-day no-charge trial makes it low-risk to try. Its widely-quoted $3,000,000 insurance figure is a family-plan number; the individual plan we compare here carries $1,000,000, matching most of the field, and sources genuinely disagree on how the family-plan coverage is structured.',
  false, null, 'https://www.idshield.com/', false, 'Best restoration (licensed private investigators)', 4,
  'https://www.idshield.com/individual-plan', DATE '2026-07-03', true
),
(
  NULL,
  'myfico', 'us', 'personal-finance', 'credit-monitoring', 'myFICO', 'Real FICO Scores -- the scores lenders actually use',
  8.0, 4.8, 114, 0, 0, 0, 29.95,
  '{"free_tier":"partial","free_tier_note":"Genuine, permanent free tier, no credit card required: Equifax report + FICO 8 monthly plus basic alerts.","bureaus_monitored":3,"monitoring_scope_note":"The category''s only source of real FICO Scores, including 28+ score versions used across mortgage and auto lending -- the scores lenders actually pull, not an educational VantageScore proxy. No credit lock and no cybersecurity bundle, an honest trade-off for its narrower, score-focused feature set.","id_theft_insurance":1000000,"id_theft_insurance_note":"$1,000,000 plus 24/7 restoration on Advanced and Premier; sub-limits apply to specific loss types (e.g. $10,000 for unauthorized electronic funds transfers) per the policy FAQ.","family_plan":false,"family_plan_note":"Individual-only product -- no family or multi-person plan is offered, an honest trade-off against Aura/LifeLock/Experian.","bbb_rating":"A+","bbb_accredited":true,"review_score":4.8,"review_count":114,"review_source":"Reviews.io","review_note":"myFICO''s own Trustpilot sample is only 4 reviews -- too small to be a meaningful signal, the same rule that rejected Sky Blue Credit''s 2-review Trustpilot sample in the Credit Repair comparison. We use its larger, 114-review Reviews.io base instead, though Reviews.io is a merchant-invited platform that structurally tends to skew higher than fully organic review channels -- read the 4.8 with that in mind.","score_model":"fico","regulatory_history_note":"No enforcement actions found related to the consumer product. Fair Isaac Corporation is a credit-scoring company, not a credit bureau or data broker, so it does not carry the dispute-complaint volume that affects bureau-owned monitoring products like Experian''s."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Real FICO Scores, 28+ versions','Genuine free tier','Cleanest regulatory record in the field']::text[],
  ARRAY['The only service in this comparison selling the actual FICO Score -- in 28+ versions used across mortgage, auto and other lending -- rather than an educational VantageScore substitute','A genuinely free, permanent tier (Equifax report + FICO 8) with no credit card required','No enforcement actions of any kind found -- Fair Isaac is a scoring company, not a bureau, so it carries none of the dispute-complaint baggage that affects bureau-owned products']::text[],
  ARRAY['No family or multi-person plan of any kind -- individual-only','No credit lock and no cybersecurity bundle (VPN, antivirus, password manager) that competitors like Aura include','Its own Trustpilot sample is only 4 reviews, too small to trust -- we substitute a larger 114-review Reviews.io base, itself a merchant-invited platform that tends to skew high']::text[],
  '{"cost":7.6,"features":8.2,"ux":8.0,"support":8.0}'::jsonb,
  'The only place to buy the real FICO Score',
  'myFICO is the only service in this comparison that sells the actual FICO Score -- in 28+ versions covering mortgage, auto and other lending -- rather than an educational VantageScore substitute, alongside a genuinely free, permanent tier. It carries the cleanest regulatory record in the field (Fair Isaac is a scoring company, not a bureau) but has no family plan and skips the credit-lock/cybersecurity bundle several competitors include. Its own Trustpilot sample is too small to trust (4 reviews); we use its larger 114-review Reviews.io base instead, with the caveat that merchant-invited platforms like Reviews.io tend to skew higher than fully organic channels.',
  false, null, 'https://www.myfico.com/', false, 'Real FICO Scores', 5,
  'https://www.myfico.com/products/fico-score-plans', DATE '2026-07-03', true
),
(
  NULL,
  'identityforce', 'us', 'personal-finance', 'credit-monitoring', 'IdentityForce', 'Highest insurance coverage in the field',
  7.8, 3.5, 904, 0, 0, 0, 34.90,
  '{"free_tier":"none","bureaus_monitored":3,"monitoring_scope_note":"Dark-web scanning (independently rated best-in-field by CNBC), SSN monitoring, court/address-record monitoring, and social-media monitoring, backed by a dedicated restoration specialist.","id_theft_insurance":2000000,"id_theft_insurance_note":"Up to $2,000,000 on UltraSecure+Credit (the seeded plan, and the highest individual-plan figure in this entire comparison), Lloyd''s-underwritten with no deductible. The no-credit-monitoring UltraSecure tier carries $1,000,000, not $2,000,000.","family_plan":true,"family_plan_note":"UltraSecure+Credit Family is $39.90/month, covering 2 adults plus up to 10 children.","bbb_rating":"NR","bbb_rating_note":"BBB profile explicitly states IdentityForce is \"NOT a BBB Accredited Business\" and is currently Not Rated while the bureau reviews prior complaints -- some outdated third-party sources still cite a lapsed A+ rating; do not treat it as current.","bbb_accredited":false,"review_score":3.5,"review_count":904,"review_source":"Trustpilot","review_note":"The weakest Trustpilot score in the ranked field, driven by billing and customer-service complaints; app-store ratings are similarly weak (iOS 3.0, Android 2.5).","score_model":"vantagescore","regulatory_history_note":"No enforcement action against the IdentityForce product itself. Its parent, TransUnion (acquired Sontiq/IdentityForce for $638 million in 2021), carries its own history: a January 2017 CFPB consent order ($13.9 million restitution + $3 million penalty for deceptive marketing of credit-score and subscription products), and a April 2022 CFPB lawsuit alleging violations of that 2017 order -- dismissed with prejudice on February 28, 2025 (no re-filing possible, no payment made, no admission of wrongdoing). Attributed here to the parent company, not the IdentityForce product itself; the BBB''s own current rating reason explicitly ties the Not-Rated status to \"reviewing complaints,\" the same parent-company context."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Highest individual-plan insurance ($2M)','Best-rated dark-web scanning (CNBC)','Dedicated restoration specialist']::text[],
  ARRAY['Up to $2,000,000 in ID theft insurance on its UltraSecure+Credit plan -- the highest individual-plan figure of any candidate in this comparison, Lloyd''s-underwritten with no deductible','CNBC rates its dark-web scanning as the best in the category','Every plan includes a dedicated restoration specialist, not just a general support queue']::text[],
  ARRAY['The weakest consumer-review score in the ranked field (3.5/5 on Trustpilot, plus weak app-store ratings) -- billing and service complaints are a recurring theme','BBB profile is currently Not Rated and explicitly not accredited -- some outdated sources still cite a lapsed A+, which no longer applies','Parent company TransUnion carries a 2017 CFPB consent order ($13.9M + $3M) and a since-dismissed 2022 CFPB suit; disclosed here though attributed to the parent, not the product']::text[],
  '{"cost":7.0,"features":8.6,"ux":7.2,"support":7.4}'::jsonb,
  'The deepest insurance coverage, with real service caveats',
  'IdentityForce offers the highest individual-plan ID theft insurance in this comparison -- up to $2,000,000, Lloyd''s-underwritten with no deductible -- plus CNBC''s top rating for dark-web scanning and a dedicated restoration specialist on every plan. The trade-offs are real: its Trustpilot score (3.5/5) is the weakest in the ranked field, its BBB profile is currently Not Rated (not accredited), and its parent company TransUnion carries its own CFPB enforcement history -- a 2017 consent order and a 2022 suit dismissed with prejudice in 2025 -- disclosed here though attributed to the parent, not the IdentityForce product itself.',
  false, null, 'https://www.identityforce.com/', false, 'Highest insurance coverage', 6,
  'https://www.identityforce.com/products-and-pricing/ultra-secure-credit', DATE '2026-07-03', true
),
(
  NULL,
  'credit-karma', 'us', 'personal-finance', 'credit-monitoring', 'Credit Karma', 'Best free -- genuinely $0, no catch',
  7.6, 1.2, 875, 0, 0, 0, 0,
  '{"free_tier":"full","free_tier_note":"The entire product is the free tier -- there is no paid upgrade.","bureaus_monitored":2,"monitoring_scope_note":"Daily 2-bureau (TransUnion + Equifax) report monitoring and alerts, basic dark-web monitoring; no restoration services and no credit lock. Uses VantageScore 3.0, not FICO -- a real mismatch risk versus the FICO Score most lenders pull for an actual credit decision.","id_theft_insurance":0,"id_theft_insurance_note":"No ID theft insurance of any kind -- the only ranked candidate without it, an honest trade-off for a genuinely free product.","family_plan":false,"family_plan_note":"Free individual accounts only -- there is no family-tier concept for a $0 product.","bbb_rating":"B-","bbb_rating_note":"Directly re-verified: B- (2,579 complaints on file), not accredited. Supersedes an earlier, stale \"F\" reading.","bbb_accredited":false,"review_score":1.2,"review_count":875,"review_source":"Trustpilot","review_note":"US Trustpilot profile specifically (UK and Canada have separate, larger, unrelated profiles). Sharply worse than its app-store ratings, which run to millions of largely positive reviews -- both channels are worth knowing before judging Credit Karma by either alone.","score_model":"vantagescore","regulatory_history_note":"The FTC finalized a $3 million consent order against Credit Karma in January 2023 for deceptive \"pre-approved\" credit-card marketing between February 2018 and April 2021 -- roughly a third of consumers shown these offers were actually rejected, generating hard credit inquiries for nothing. Credit Karma''s data-sharing model (using your information to match you with lender offers, which is how it stays free) is a related privacy trade-off worth understanding, not a separate legal violation."}'::jsonb,
  'official', 'high',
  '[{"type":"green","label":"Completely free"}]'::jsonb,
  ARRAY['Genuinely $0 -- no upgrade, no catch','Used by roughly 130 million Americans','Daily 2-bureau monitoring included']::text[],
  ARRAY['The only completely free product in this comparison -- not a freemium teaser, the entire service costs $0 permanently','Used by an estimated 130 million Americans, with universal editorial-source coverage (Money, NerdWallet, CNBC, Investopedia)','Daily monitoring across two bureaus (TransUnion + Equifax) with dark-web alerts, at no cost']::text[],
  ARRAY['No ID theft insurance of any kind -- the only ranked candidate without it','Uses VantageScore 3.0, not the FICO Score most lenders actually pull for a real credit decision','FTC fined Credit Karma $3 million in 2023 for deceptive "pre-approved" credit-card marketing; its lowest Trustpilot score (1.2/5) in the ranked field, sharply worse than its app-store ratings']::text[],
  '{"cost":9.8,"features":6.8,"ux":7.6,"support":6.0}'::jsonb,
  'The best pick if your budget is $0',
  'Credit Karma is the only completely free service in this comparison -- not a freemium teaser, the entire product costs $0, monetized instead by showing you credit-card and loan offers from lenders. It monitors two bureaus (TransUnion and Equifax) daily using VantageScore rather than FICO, and carries no ID theft insurance at all. The FTC fined Credit Karma $3 million in 2023 over deceptive "pre-approved" card marketing, and its US Trustpilot score (1.2/5) is the weakest in this comparison, though its app-store ratings run sharply more positive -- both are disclosed here.',
  false, null, 'https://www.creditkarma.com/', false, 'Best free', 7,
  'https://www.creditkarma.com/free-credit-score', DATE '2026-07-03', true
),
(
  NULL,
  'identityiq', 'us', 'personal-finance', 'credit-monitoring', 'IdentityIQ', '$1M insurance at every tier, including its cheapest plan',
  7.2, 3.9, 424, 0, 0, 0, 22.99,
  '{"free_tier":"none","free_tier_note":"Not a free trial -- a $1 charge (7 days) with your card pre-authorized for the full monthly fee afterward. Never advertise or label this as \"free.\"","bureaus_monitored":3,"monitoring_scope_note":"Dark-web monitoring, SSN monitoring, and synthetic-identity-theft checks, plus data-broker opt-out on upper tiers -- a credit-monitoring specialist without a cybersecurity bundle (VPN/antivirus), unlike Aura or LifeLock.","monthly_fee_note":"The official pricing page lists annual-billing equivalents (e.g. $21.49 for Secure Pro); $22.99/month is the real, confirmed monthly-billing rate for Secure Pro (the seeded plan) -- verify at checkout, as the annual and monthly figures are easy to conflate.","id_theft_insurance":1000000,"id_theft_insurance_note":"$1,000,000 in stolen-funds reimbursement on every plan, including the cheapest $8.49/month tier -- the best price-to-insurance ratio in this comparison. Secure Max additionally covers $25,000 per family member.","family_plan":false,"family_plan_note":"No dedicated family tier; Secure Max covers additional family members at $25,000 in insurance each rather than a bundled family price.","bbb_rating":null,"bbb_rating_note":"The BBB profile shows \"Accredited since 5/13/2026\" (about 7 weeks old at time of research) alongside \"information is being updated, no report available at this time\" -- meaning no letter grade is currently displayed, despite some search results still surfacing a stale \"A+.\" Do not treat a freshly-purchased accreditation as an established trust signal, and do not rank on BBB for this candidate.","bbb_accredited":true,"bbb_accredited_note":"Accredited only since 2026-05-13 -- about 7 weeks old, disclosed as recent rather than an established track record.","review_score":3.9,"review_count":424,"review_source":"Trustpilot","review_note":"Rated \"Great\" on Trustpilot; review count fluctuates across snapshots (roughly 420-450). ConsumerAffairs and PissedConsumer show a recurring pattern of billing and cancellation complaints continuing into 2026.","score_model":"vantagescore","regulatory_history_note":"No FTC, CFPB or state AG enforcement action found. IdentityIQ (Identity Intelligence Group, LLC) settled a $8,769,854 class-action lawsuit (Caldwell v. Identity Intelligence Group) in 2025 over alleged violations of California''s Automatic Renewal Law -- unclear, not clearly-and-conspicuously-disclosed auto-renewal terms, covering a 2019-03-22 to 2023-08-20 class period, with final approval on 2025-09-19 and payouts made without a claim form. This is a private class-action settlement with no admission of wrongdoing, not a government enforcement action -- alongside a continuing pattern of billing complaints (unauthorized charges after the $1 trial, cancellations that don''t take effect). IdentityIQ is also commonly sold as a referral upsell by credit-repair companies, a related context worth knowing."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['$1M insurance on every plan, even the cheapest tier','Full 4-tier lineup from $8.49 to $31.49/month','Thorough synthetic-ID-theft detection']::text[],
  ARRAY['Includes $1,000,000 in stolen-funds insurance on every plan, including its cheapest $8.49/month tier -- the best price-to-insurance ratio of any candidate in this comparison','A clean 4-tier lineup (Basic through Max) lets you match monitoring depth to budget','Synthetic-identity-theft detection alongside standard dark-web and SSN monitoring']::text[],
  ARRAY['Settled a $8.77 million class-action lawsuit in 2025 over unclear auto-renewal terms, with a continuing pattern of billing/cancellation complaints into 2026','Its $1 "trial" pre-authorizes your card for the full monthly fee after 7 days -- never treat it as a free trial','Thinnest editorial consensus in the ranked field (no Money or CNBC top-3 slot) and a BBB grade currently unavailable (accreditation is only 7 weeks old at time of research)']::text[],
  '{"cost":8.6,"features":8.0,"ux":7.0,"support":6.6}'::jsonb,
  'A real price-to-insurance value, with real billing caveats to know before enrolling',
  'IdentityIQ''s standout feature is $1,000,000 in stolen-funds insurance on every plan, including its cheapest $8.49/month tier -- the best price-to-insurance ratio in this comparison, with a clean 4-tier lineup from $8.49 to $31.49/month (the seeded Secure Pro plan bills at $22.99/month, not the lower annual-equivalent figure sometimes advertised). It settled a $8.77 million class-action lawsuit in 2025 over unclear auto-renewal terms, with a continuing pattern of billing and cancellation complaints -- and its $1 "trial" pre-authorizes your card for the full monthly fee after 7 days, so never treat it as free. Its BBB accreditation is only 7 weeks old at time of research and currently displays no letter grade at all.',
  false, null, 'https://www.identityiq.com/', false, '$1M insurance at every tier', 8,
  'https://www.identityiq.com/plans-pricing', DATE '2026-07-03', true
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
