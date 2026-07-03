-- Comparison Cockpit — seed US debt relief companies (topic = 'companies', category = 'debt-relief').
-- Mirrors 20260628120020_seed_robo_advisors_us.sql. Idempotent (ON CONFLICT DO UPDATE).
-- Provenance is mandatory per row (source_url/source_type/confidence/data_verified_at);
-- full source-by-attribute matrix at
-- docs/superpowers/plans/2026-07-02-cockpit-debt-relief-source-matrix.md (Fable-5-checkpoint-reviewed).
--
-- Candidates: Top-8 per owner decision (Americor excluded; Freedom Debt Relief featured WITH a
-- visible risk disclosure in its cons/deep_dive for its 2019 CFPB and 2024 TCPA settlements).
-- Affiliate links are left to the attribution gate: only national-debt-relief has an
-- affiliate_links row (is_affiliate=true), and its tracking_status stays 'unverified'
-- (see 20260703090000_fix_ndr_category.sql) — no monetized offer for anyone in this slice yet,
-- all render as review/visit until a real tracking relationship is verified.
--
-- GreenPath (Fable-5 fix): management_fee is NULL (it charges no % settlement fee — a null,
-- never a misleading 0 that would falsely "win" the fee comparison). Its real fixed-dollar DMP
-- cost ($35 setup + $31/mo x 48mo midpoint = $1,523, both figures officially sourced) is stored
-- in attributes.dmp_flat_total and surfaced by TopicConfig.costModel.flatFeeAccessor instead.
--
-- JG Wentworth's `rating`/`review_count` use its settlement-SPARTE-specific BBB figures
-- (3.1 / 188), not its brand-wide Trustpilot rating (4.8 / 17k, mostly structured-settlement
-- customers) — using the brand-wide number would misrepresent this specific product.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, management_fee, account_minimum,
  attributes, source_type, confidence,
  badges, chips, pros, cons, sub_scores, verdict, deep_dive,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'national-debt-relief' AND market = 'us' LIMIT 1),
  'national-debt-relief', 'us', 'debt-relief', 'companies', 'National Debt Relief', 'Most trusted overall, triple-accredited',
  9.4, 4.7, 44000, 44000, 20.0, 0,
  '{"fee_pct_min":15,"fee_pct_max":25,"min_debt":7500,"program_months_min":24,"program_months_max":48,"afcc":true,"iapda":true,"free_consult":true,"is_nonprofit_dmp":false,"states_note":"Not available in CT, OR, VT, WV, WI"}'::jsonb,
  'official', 'high',
  '[{"type":"gold","label":"Top pick"}]'::jsonb,
  ARRAY['Triple-accredited (BBB A+/AADR/IAPDA)','No upfront fees','Cancel anytime']::text[],
  ARRAY['Dual AADR + IAPDA accreditation','Very high customer ratings (Trustpilot 4.7, ~44k reviews)','No upfront fees, cancel anytime without penalty']::text[],
  ARRAY['Not available in 5 states (CT, OR, VT, WV, WI)','Extra $9 setup + $9.85/mo account fee on top of the settlement fee']::text[],
  '{"fees":8.0,"features":8.8,"ux":9.0,"support":9.2}'::jsonb,
  'The most trusted overall pick for debt settlement',
  'National Debt Relief pairs a market-standard 15-25% settlement fee with the strongest accreditation and review profile in the category (BBB A+, AADR, IAPDA, Trustpilot 4.7 across ~44,000 reviews), with no known regulatory actions and a straightforward cancel-anytime policy.',
  true, 'national-debt-relief-review', 'https://www.nationaldebtrelief.com/', true, 'Most trusted overall', 1,
  'https://www.nationaldebtrelief.com/faqs/', DATE '2026-07-02', true
),
(
  NULL,
  'accredited-debt-relief', 'us', 'debt-relief', 'companies', 'Accredited Debt Relief', 'Best for larger debt balances',
  8.9, 4.8, 11171, 11171, 20.0, 0,
  '{"fee_pct_min":15,"fee_pct_max":25,"min_debt":5000,"program_months_min":24,"program_months_max":48,"afcc":null,"iapda":true,"free_consult":true,"is_nonprofit_dmp":false,"states_note":"Not available in DE, HI, IA, NH, ND, OR, RI, VT, WA, WI, WY"}'::jsonb,
  'editorial', 'high',
  '[{"type":"sky","label":"High debt specialist"}]'::jsonb,
  ARRAY['Forbes pick for $10k+ debt','No upfront fees','Very high Trustpilot rating']::text[],
  ARRAY['Forbes Advisor names it best for anyone with $10,000+ in unsecured debt','No upfront fees — pay only after a successful settlement','Excellent Trustpilot rating (4.8, ~11,171 reviews)']::text[],
  ARRAY['Fee range (15-25%) is at the higher end of the category','Not available in 11 states']::text[],
  '{"fees":7.6,"features":8.6,"ux":9.0,"support":8.8}'::jsonb,
  'The best choice for larger debt balances',
  'Accredited Debt Relief (part of Beyond Finance) is Forbes Advisor''s explicit pick for consumers with $10,000+ in unsecured debt, backed by an A+ BBB rating and an excellent 4.8-star Trustpilot score across more than 11,000 reviews — though its 15-25% fee sits at the higher end of the category.',
  false, NULL, 'https://www.accrediteddebtrelief.com/', false, 'Larger debt balances ($10k+)', 2,
  'https://www.nerdwallet.com/personal-loans/learn/accredited-debt-relief-debt-settlement', DATE '2026-07-02', true
),
(
  NULL,
  'new-era-debt-solutions', 'us', 'debt-relief', 'companies', 'New Era Debt Solutions', 'Lowest settlement fee in the category',
  8.8, 4.9, 440, 440, 18.5, 0,
  '{"fee_pct_min":14,"fee_pct_max":23,"min_debt":15000,"program_months_min":24,"program_months_max":36,"afcc":null,"iapda":true,"free_consult":true,"is_nonprofit_dmp":false,"states_note":"Available in most states; exact list not published"}'::jsonb,
  'official', 'medium',
  '[{"type":"green","label":"Lowest fee"}]'::jsonb,
  ARRAY['14-23% fee — lowest in the category','BBB A+ since 2001','4.9-star Trustpilot rating']::text[],
  ARRAY['Officially confirmed 14-23% settlement fee, below the 15-25% industry standard','A+ BBB accreditation since 2001','Outstanding 4.9-star Trustpilot rating']::text[],
  ARRAY['Higher $15,000 minimum enrolled debt than most peers','Small review base (~440) limits statistical confidence']::text[],
  '{"fees":9.2,"features":8.2,"ux":8.6,"support":8.6}'::jsonb,
  'The lowest-fee pick in the category',
  'New Era Debt Solutions charges the lowest settlement fee we found in this category (14-23% vs. the 15-25% industry standard), officially confirmed on its own site, backed by an A+ BBB rating since 2001 and a 4.9-star Trustpilot score — though its $15,000 minimum debt requirement and small review base are worth weighing.',
  false, NULL, 'https://neweradebtsolutions.com/', false, 'Lowest fees', 3,
  'https://neweradebtsolutions.com/why-new-era/extraordinary-value/', DATE '2026-07-02', true
),
(
  NULL,
  'greenpath', 'us', 'debt-relief', 'companies', 'GreenPath Financial Wellness', 'Non-profit alternative to settlement',
  8.6, 4.95, 1297, 1297, NULL, 0,
  '{"fee_pct_min":0,"fee_pct_max":0,"min_debt":0,"program_months_min":36,"program_months_max":60,"afcc":null,"iapda":false,"free_consult":true,"is_nonprofit_dmp":true,"dmp_flat_total":1523,"states_note":"All 50 states"}'::jsonb,
  'official', 'high',
  '[{"type":"green","label":"Non-profit pick"}]'::jsonb,
  ARRAY['Non-profit since 1961, NFCC-accredited','No credit-score hit from missed payments','A+ BBB, 4.95-star rating']::text[],
  ARRAY['501(c)(3) non-profit since 1961, NFCC + COA accredited','Repays 100% of principal — no settlement mark on your credit report','Outstanding BBB record (A+, 4.95 stars, ~1,297 reviews)']::text[],
  ARRAY['No debt reduction — you repay 100% of principal, just at lower interest','Requires closing credit cards at enrollment (temporary score dip)']::text[],
  '{"fees":9.5,"features":7.2,"ux":8.4,"support":9.0}'::jsonb,
  'The best non-profit alternative to debt settlement',
  'GreenPath is a 501(c)(3) non-profit debt management plan (DMP), not a settlement service — it charges no percentage-of-debt fee and instead has a fixed cost of roughly $35 setup plus $31/month over a 36-60 month program (about $1,523 total), while repaying 100% of principal at reduced interest. It avoids the credit-score hit of missed settlement-style payments, at the cost of no debt reduction.',
  false, NULL, 'https://www.greenpath.com/', false, 'Avoiding debt settlement / credit-score-conscious', 4,
  'https://www.greenpath.com/debt-management/', DATE '2026-07-02', true
),
(
  NULL,
  'pacific-debt-relief', 'us', 'debt-relief', 'companies', 'Pacific Debt Relief', 'Long track record since 2002',
  8.4, 4.7, 2400, 2400, 20.0, 0,
  '{"fee_pct_min":15,"fee_pct_max":25,"min_debt":10000,"program_months_min":24,"program_months_max":48,"afcc":null,"iapda":true,"free_consult":true,"is_nonprofit_dmp":false,"states_note":"46 states + DC; not available in CO, MN, OR, WI"}'::jsonb,
  'official', 'high',
  '[{"type":"sky","label":"Established since 2002"}]'::jsonb,
  ARRAY['$500M+ resolved since 2002','Free, no-obligation consultation','A+ BBB, strong Trustpilot rating']::text[],
  ARRAY['Over $500 million in debt resolved since founding in 2002','Free, no-obligation consultation','A+ BBB rating and strong Trustpilot score (4.7, ~2,400 reviews)']::text[],
  ARRAY['Not available in 4 states (CO, MN, OR, WI)','Extra $10 setup + $10/mo account fee, optional $29.95/mo legal-protection add-on']::text[],
  '{"fees":7.8,"features":8.2,"ux":8.6,"support":8.6}'::jsonb,
  'A long-established, solid all-round choice',
  'Pacific Debt Relief has resolved over $500 million in debt since its 2002 founding in San Diego, with a market-standard 15-25% fee, a free consultation, and an A+ BBB rating backed by a strong 4.7-star Trustpilot score — though it isn''t available in four states and adds a modest monthly account fee.',
  false, NULL, 'https://www.pacificdebt.com/', false, 'Long track record', 5,
  'https://www.nerdwallet.com/personal-loans/learn/pacific-debt-relief-debt-settlement', DATE '2026-07-02', true
),
(
  NULL,
  'curadebt', 'us', 'debt-relief', 'companies', 'CuraDebt', 'Specialist in IRS and state tax debt',
  8.0, 4.3, 30, 30, 20.0, 0,
  '{"fee_pct_min":15,"fee_pct_max":25,"min_debt":5000,"program_months_min":24,"program_months_max":48,"afcc":null,"iapda":true,"free_consult":true,"is_nonprofit_dmp":false,"states_note":"All 50 states + DC + Puerto Rico per enrollment form; availability varies by state"}'::jsonb,
  'editorial', 'medium',
  '[{"type":"sky","label":"Tax debt specialist"}]'::jsonb,
  ARRAY['Dedicated IRS/state tax debt relief team','No upfront fees','A+ BBB rating']::text[],
  ARRAY['Only candidate with a dedicated tax-debt-relief track (IRS-licensed Enrolled Agents, Offers in Compromise, state tax relief)','No upfront fees — charged only after a successful settlement','A+ BBB accreditation']::text[],
  ARRAY['Exact fee percentage and program length are not published on its own site — we show the industry-standard range as a transparent estimate','Customer-review data is inconsistent across sources and could not be primary-verified']::text[],
  '{"fees":7.2,"features":8.4,"ux":7.8,"support":8.2}'::jsonb,
  'A specialist choice for tax debt',
  'CuraDebt is the only candidate in this category with a dedicated IRS and state tax-debt-relief track, staffed by IRS-licensed Enrolled Agents who can negotiate Offers in Compromise — a genuine alternative for consumers whose debt problem is primarily with the IRS rather than credit cards. Its settlement-fee percentage and program length aren''t published on its own site, so we show the industry-standard range rather than a false-precision figure.',
  false, NULL, 'https://www.curadebt.com/', false, 'Tax debt specialists', 6,
  'https://www.curadebt.com/debt-settlement-program/', DATE '2026-07-02', true
),
(
  NULL,
  'freedom-debt-relief', 'us', 'debt-relief', 'companies', 'Freedom Debt Relief', 'Largest track record, with a program guarantee',
  7.8, 4.6, 49700, 49700, 20.0, 0,
  '{"fee_pct_min":15,"fee_pct_max":25,"min_debt":7500,"program_months_min":24,"program_months_max":48,"afcc":false,"iapda":true,"free_consult":true,"is_nonprofit_dmp":false,"states_note":"~40 states; not available in CO, HI, OR, RI, VT, WA, WV, WI, WY (and NE/ND per some sources)"}'::jsonb,
  'official', 'high',
  '[{"type":"sky","label":"Program guarantee"}]'::jsonb,
  ARRAY['$20B+ resolved, 1M+ clients since 2002','Program Guarantee refunds fees if costs exceed enrolled debt','No upfront fees']::text[],
  ARRAY['Largest officially-disclosed track record in the category ($20B+ resolved, 1M+ clients since 2002)','Contractual Program Guarantee: fee refund if total program cost exceeds your enrolled debt','No upfront fees, free consultation']::text[],
  ARRAY['2019 CFPB consent order: $20M consumer restitution + $5M civil penalty for prohibited upfront-fee practices and misleading negotiation claims','2024: $9.75M TCPA class-action settlement over unauthorized robocalls (May 2017-April 2018) — review this history before enrolling','Not available in ~9 states']::text[],
  '{"fees":7.6,"features":8.4,"ux":8.4,"support":8.0}'::jsonb,
  'A large, established provider — with regulatory history to weigh',
  'Freedom Debt Relief has the largest officially-disclosed track record in this category ($20 billion-plus resolved, over 1 million clients since 2002) and a unique contractual Program Guarantee that refunds fees if total program costs exceed your enrolled debt. It also carries the most significant regulatory history among our candidates: a 2019 CFPB consent order ($20M restitution + $5M penalty) and a 2024 TCPA class-action settlement ($9.75M) over unauthorized robocalls — both fully resolved, but worth reading before enrolling.',
  false, NULL, 'https://www.freedomdebtrelief.com/', false, 'Program guarantee', 7,
  'https://www.freedomdebtrelief.com/faq/', DATE '2026-07-02', true
),
(
  NULL,
  'jg-wentworth-debt-relief', 'us', 'debt-relief', 'companies', 'JG Wentworth', 'Legacy brand, limited direct-state availability',
  7.0, 3.1, 188, 188, 21.5, 0,
  '{"fee_pct_min":18,"fee_pct_max":25,"min_debt":10000,"program_months_min":24,"program_months_max":48,"afcc":true,"iapda":true,"free_consult":true,"is_nonprofit_dmp":false,"states_note":"Direct program in 31 states + DC; 12 more via law-firm referral only; not available in WV"}'::jsonb,
  'editorial', 'medium',
  '[{"type":"sky","label":"Established brand"}]'::jsonb,
  ARRAY['AADR member with a public program disclosure','IAPDA-accredited specialists','No upfront settlement fee']::text[],
  ARRAY['AADR member with its own public program disclosure statement','IAPDA-accredited debt specialists','No upfront settlement fee — charged only after a successful negotiation']::text[],
  ARRAY['Highest fee range in the category (18-25%) plus $9.95 setup + $9.95/mo escrow fees','Settlement-specific customer rating is notably lower than peers (3.1 stars, 188 BBB reviews)','Direct enrollment limited to 31 states + DC; 12 more only via a referred law firm, not available in West Virginia']::text[],
  '{"fees":6.8,"features":7.8,"ux":7.0,"support":7.2}'::jsonb,
  'A recognizable name, but the weakest metrics in this category',
  'JG Wentworth — best known for structured settlements — has run a debt-settlement division since 2019, AADR- and IAPDA-accredited, with fees of 18-25% (the highest range among our candidates) plus $9.95 setup and monthly escrow fees. Its settlement-division-specific customer rating (3.1 stars, 188 BBB reviews) is notably weaker than its peers, and direct enrollment is limited to 31 states plus DC.',
  false, NULL, 'https://www.jgwentworth.com/debt-relief', false, 'Legacy brand recognition', 8,
  'https://lendedu.com/blog/jg-wentworth-debt-relief-review/', DATE '2026-07-02', true
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
