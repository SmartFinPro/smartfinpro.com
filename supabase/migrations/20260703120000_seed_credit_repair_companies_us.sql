-- Comparison Cockpit — seed US credit repair companies (topic = 'companies', category = 'credit-repair').
-- Mirrors 20260703110000_seed_forex_brokers_us.sql. Idempotent (ON CONFLICT DO UPDATE).
-- Provenance is mandatory per row (source_url/source_type/confidence/data_verified_at);
-- full source-by-attribute matrix at
-- docs/superpowers/plans/2026-07-03-cockpit-credit-repair-source-matrix.md, translated into
-- concrete seed values (with a Fable-5 pre-migration review + 7 changes, plus 3 resolved
-- pre-seed manual verifications) at
-- docs/superpowers/plans/2026-07-03-cockpit-credit-repair-planned-seed-values.md (§0a is the
-- final, authoritative changelog).
--
-- Candidates (6): Credit Saint, Sky Blue Credit, The Credit People, Safeport Law, MSI Credit
-- Solutions, Credit Firm. Excluded entirely (no backfill, per the Forex-slice 7->5
-- precedent): Lexington Law (convicted predecessor entity dissolved in Chapter 11; a
-- successor, Oquirrh Mountain Law Group, bought the tradename and continues operating under
-- the same damaged brand -- a structural disqualifier, not a disclosure-eligible one), The
-- Credit Pros (confirmed fake-review pattern + 47 mostly-TCPA federal suits), and Ovation
-- Credit Services (outright defunct since a 2023 LendingTree shutdown -- a factual
-- correction to the original shortlist, not a judgment call).
--
-- `monthly_fee` (existing generic top-level column, NOT previously used by trading-platforms
-- or forex-brokers) is the recurring subscription fee that drives the new `monthly-plus-setup`
-- cost model. `attributes.setup_fee` is the one-time setup/first-work fee (NULL for MSI,
-- whose real setup cost is case-by-case and never seeded as a misleading dollar figure).
--
-- The Credit People's headline `rating`/`review_count` seeds from BestCompany (4.3/300), not
-- Trustpilot's count-less 1.8 "Poor" figure -- the same "score+source+count always together"
-- rule this research applied to reject Sky Blue Credit's 2-review Trustpilot sample would be
-- broken inconsistently by using Trustpilot's count-less number here instead. The 1.8 "Poor"
-- figure is disclosed in both `cons` and the `review_source`/note field, not hidden.
--
-- Safeport Law's pricing ($129.99/mo + $129 setup) was the one seed value blocked on a
-- migration gate: its official site (safeportlaw.com) is confirmed genuinely unreachable
-- (403 to both automated fetches AND a full real-browser session), and two fresh, dated
-- 2026 third-party sources disagree ($99/mo no-setup vs $129.99/mo+$129). Resolved by seeding
-- the higher, more conservative figure (errs toward not understating cost), confidence:
-- medium, with the discrepancy disclosed in `monthly_fee_note`.
--
-- Credit Firm's `bbb_rating` seeds as a single ordinal-safe value ('A'), since two sources
-- disagree A+/A -- the discrepancy moves to `bbb_rating_note` since the ordinal winner-column
-- accessor needs exactly one value per candidate.
--
-- Affiliate-gate status: is_affiliate=true ONLY for `the-credit-people` (the sole genuine, if
-- untracked, affiliate_links row for this category -- destination is a bare homepage URL with
-- no tracking parameters, so ctaMode resolves to 'review', never 'offer', matching the
-- FOREX.com/forex-brokers precedent). The other 5 candidates have NO affiliate_links rows and
-- get is_affiliate=false with ctaMode 'visit' (Credit Saint has a review_slug so it resolves
-- 'review' instead, matching Credit Saint's genuine, if unmonetized, existing review).
--
-- external_url is set for ALL 6 candidates (each provider's own bare official homepage --
-- never a tracked/disguised affiliate link, per the standing rule established in Slice 3).

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
  'credit-saint', 'us', 'credit-repair', 'companies', 'Credit Saint', 'Best overall -- dedicated analyst, strongest track record',
  9.0, 4.6, 643, 0, 0, 0, 79.99,
  '{"setup_fee":99,"setup_fee_note":"$99 on the Credit Polish and Credit Remodel tiers; $195 on the Clean Slate tier.","dispute_scope_note":"Bureau disputes across all three tiers (late payments, charge-offs, judgments, collections); inquiry targeting from the Remodel tier up; cease-and-desist letters and unlimited challenges only on the Clean Slate tier. Lower tiers cap disputes at roughly 5 items per bureau per cycle.","guarantee_type":"conditional_refund","guarantee_note":"Full refund if no items are deleted within 90 days; refund audits must be requested between 91-120 days after your first payment. Whether the $99-$195 setup fee itself is included in that refund is not clearly specified in Credit Saint''s terms.","states_note":"Not available in Georgia, Kansas, Louisiana, South Carolina, or Vermont.","bbb_rating":"A-","bbb_accredited":true,"review_score":4.6,"review_count":643,"review_source":"Trustpilot","nacso":null,"attorney_led":false,"regulatory_history_note":"No CFPB, FTC, or state AG enforcement actions found (as of Feb 2026). A private firm''s unverified 2025 investigation alleging CROA/TSR violations was met with a cease-and-desist from Credit Saint; not validated by any regulator, so not treated as fact."}'::jsonb,
  'editorial', 'medium',
  '[{"type":"gold","label":"Top pick"}]'::jsonb,
  ARRAY['Dedicated credit analyst','BBB-accredited since 2007','90-day money-back guarantee']::text[],
  ARRAY['Same dedicated analyst throughout your case, not a rotating support queue','BBB-accredited since 2007, one of the longest track records in this comparison','90-day money-back guarantee if no items are deleted','Three tiers (Polish/Remodel/Clean Slate) let you match service scope to your budget']::text[],
  ARRAY['Over 20% of Trustpilot reviews are 1-star, despite a strong 4.6 average','Not available in Georgia, Kansas, Louisiana, South Carolina, or Vermont','Setup fees ($99-$195) push total 6-month cost higher than several competitors']::text[],
  '{"cost":7.6,"features":9.2,"ux":9.0,"support":9.4}'::jsonb,
  'The best overall pick for most consumers',
  'Credit Saint pairs a dedicated credit analyst with a 90-day money-back guarantee and three tiers ranging from a $79.99/month basic plan to a $139.99/month Clean Slate tier with unlimited disputes. A $99-$195 one-time setup fee applies depending on tier. Its BBB accreditation dates back to 2007, the longest clean-ish track record in this comparison, though a rising share of 1-star Trustpilot reviews and a 5-state exclusion list (GA, KS, LA, SC, VT) are worth checking before enrolling.',
  false, 'credit-saint-review', 'https://www.creditsaint.com/', true, 'Best overall', 1,
  'https://financebuzz.com/credit-saint-review', DATE '2026-07-03', true
),
(
  NULL,
  'sky-blue-credit', 'us', 'credit-repair', 'companies', 'Sky Blue Credit', 'Best money-back guarantee -- unconditional, no strings',
  8.8, 4.3, 497, 0, 0, 0, 99,
  '{"setup_fee":0,"setup_fee_note":"No separate setup fee on the official pricing page; billing begins after a 6-day grace period from enrollment.","dispute_scope_note":"Basic: bureau disputes only. Full Service: adds creditor interventions. Premium: adds monthly inquiry disputes, debt-validation letters, cease-and-desist letters, and personal-info corrections. 45-day dispute cycle (fastest in this comparison; Basic tier runs 60 days).","guarantee_type":"unconditional_refund","guarantee_note":"Unconditional 90-day money-back guarantee, available on request -- not tied to whether any items were actually deleted. The strongest guarantee in this comparison.","states_note":"All 50 states plus Puerto Rico, Guam, the Virgin Islands, and military members worldwide.","bbb_rating":"A+","bbb_accredited":false,"review_score":4.3,"review_count":497,"review_source":"Google","nacso":null,"attorney_led":false,"regulatory_history_note":"No CFPB, FTC, or state AG enforcement actions found in public records; only 2 CFPB complaints in 3 years -- the cleanest compliance record in this comparison, consistent with 35+ years in business."}'::jsonb,
  'official', 'high',
  '[{"type":"sky","label":"Best guarantee"}]'::jsonb,
  ARRAY['Unconditional 90-day refund','Couples plan available','Cleanest regulatory record in the field']::text[],
  ARRAY['Unconditional 90-day money-back guarantee -- not tied to a removal outcome, unlike most competitors'' conditional guarantees','No separate setup fee on the official pricing page','35+ years in business (since 1989) with only 2 CFPB complaints in 3 years','45-day dispute cycle, the fastest in this comparison']::text[],
  ARRAY['Trustpilot profile has only 2 reviews -- too small a sample to be a meaningful signal (we use Google''s larger 497-review sample instead)','Not BBB-accredited (though it holds an A+ BBB rating)','Higher tiers needed for debt-validation and cease-and-desist letters']::text[],
  '{"cost":8.2,"features":8.8,"ux":8.6,"support":8.8}'::jsonb,
  'The strongest money-back guarantee in the category',
  'Sky Blue Credit offers an unconditional 90-day money-back guarantee -- refundable on request regardless of whether any items were actually removed, the strongest guarantee structure in this comparison. Monthly pricing runs $79-$119 individually (couples pay more, at a per-person discount versus two separate subscriptions), with no separate setup fee. Its 35-year operating history and just 2 CFPB complaints in the past 3 years give it the cleanest regulatory record among the 6 ranked candidates.',
  false, null, 'https://www.skybluecredit.com/', false, 'Best money-back guarantee', 2,
  'https://www.skybluecredit.com/', DATE '2026-07-03', true
),
(
  (SELECT id FROM public.affiliate_links WHERE slug = 'the-credit-people' AND market = 'us' LIMIT 1),
  'the-credit-people', 'us', 'credit-repair', 'companies', 'The Credit People', 'Lowest entry cost',
  8.2, 4.3, 300, 0, 0, 0, 99,
  '{"setup_fee":19,"setup_fee_note":"Lowest setup fee among all 6 ranked candidates. A flat-rate option of $599 covers 6 months of Premium service with no monthly billing.","dispute_scope_note":"Unlimited disputes across all three bureaus, creditor interventions, escalated disputes and debt validations, monthly score refreshes -- identical across Standard and Premium tiers; Premium differs mainly in processing speed/priority.","guarantee_type":"partial_refund","guarantee_note":"Cancel anytime; refund of the last two monthly payments if unsatisfied -- not a full 90-day money-back guarantee the way some competitors offer.","states_note":"All 50 states.","bbb_rating":"C+","bbb_accredited":false,"review_score":4.3,"review_count":300,"review_source":"BestCompany","nacso":null,"attorney_led":false,"regulatory_history_note":"No CFPB, FTC, or state AG enforcement actions found. BBB/Trustpilot complaints cluster around slow or absent removals despite months of payment -- a real service-quality concern, not a legal violation."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Lowest setup fee ($19)','Unlimited disputes, all tiers','Flat-rate 6-month option']::text[],
  ARRAY['Lowest setup fee in this comparison at $19','Unlimited disputes across all three bureaus on every tier','A $599 flat-rate 6-month option eliminates monthly billing entirely','Cancel anytime with a partial refund of your last two payments']::text[],
  ARRAY['BBB rating is C+ (not accredited) -- the weakest BBB standing in this comparison alongside MSI','Trustpilot shows a poor 1.8/5 rating on a small-sample profile, a stark contrast to its stronger BestCompany score (4.3/300) -- worth weighing both','Guarantee only covers the last two monthly payments, not a full 90-day refund']::text[],
  '{"cost":8.8,"features":8.2,"ux":7.6,"support":7.4}'::jsonb,
  'The lowest-cost entry point in this comparison',
  'The Credit People charges the lowest setup fee in this comparison ($19) alongside $99-$119/month plans (or a $599 flat rate for 6 months), with unlimited disputes across all three bureaus on every tier. Its BestCompany rating (4.3 from 300 reviews) is solid, but a separate, much smaller Trustpilot profile shows a poor 1.8/5 -- both are disclosed here rather than picking the flattering number. Its guarantee (refund of your last two payments) is weaker than several competitors'' full 90-day terms.',
  true, 'the-credit-people-review', 'https://www.thecreditpeople.com/', false, 'Lowest entry cost', 3,
  'https://www.thecreditpeople.com/pricing', DATE '2026-07-03', true
),
(
  NULL,
  'safeport-law', 'us', 'credit-repair', 'companies', 'Safeport Law', 'Attorney-led disputes',
  8.4, 4.7, 734, 0, 0, 0, 129.99,
  '{"setup_fee":129,"setup_fee_note":"Initial working fee, billed after enrollment.","monthly_fee_note":"Sources disagree on current pricing: FinanceBuzz cites $129.99/month + a $129 setup fee (used here as the more conservative figure); ConsumersAdvocate cites a lower $99/month with no separate setup fee. Safeport''s official site could not be independently verified -- it returned 403 Forbidden to both automated fetches and a full real-browser session. Confirm current pricing directly with Safeport before enrolling.","dispute_scope_note":"Attorney-led bureau challenges across all three bureaus plus creditor interventions and score tracking -- but no cease-and-desist or debt-validation services, the narrowest dispute scope in this comparison.","guarantee_type":"conditional_refund","guarantee_note":"90-day money-back guarantee if no disputed items are removed.","states_note":"Sources disagree on South Carolina availability -- some say Safeport doesn''t operate there, others say all 50 states are covered. Confirm directly if you''re a South Carolina resident.","bbb_rating":"A-","bbb_accredited":true,"review_score":4.7,"review_count":734,"review_source":"Birdeye","nacso":null,"attorney_led":true,"regulatory_history_note":"No CFPB complaints or enforcement actions found. Coleman Legal, LLC (dba Safeport Law) began operating in June 2022 and incorporated in March 2023 -- a genuinely independent Georgia law firm with no corporate or personnel connection to the Progrexion/Lexington Law group."}'::jsonb,
  'editorial', 'medium',
  '[{"type":"sky","label":"Attorney-led"}]'::jsonb,
  ARRAY['Attorney-led disputes','BBB-accredited (A-) since 2023','No connection to Lexington Law/Progrexion']::text[],
  ARRAY['Attorney-led dispute handling with legal escalation capabilities most non-legal firms lack','BBB-accredited (A-) since March 2023, with no CFPB complaints found','A genuinely independent law firm -- no corporate connection to the troubled Progrexion/Lexington Law group, despite superficial category overlap']::text[],
  ARRAY['Current pricing is genuinely unclear -- sources disagree between $99/month (no setup fee) and $129.99/month + $129 setup, and Safeport''s own site is unreachable for verification','Narrowest dispute scope in this comparison -- no cease-and-desist or debt-validation letters','No Trustpilot profile exists; young company (est. 2022) with a shorter track record than most competitors']::text[],
  '{"cost":6.8,"features":7.6,"ux":8.2,"support":8.8}'::jsonb,
  'A credible, independent attorney-led alternative -- verify current pricing before enrolling',
  'Safeport Law (Coleman Legal, LLC) puts licensed attorneys at the center of the dispute process, with BBB accreditation (A-) since March 2023 and no CFPB complaints found -- and, despite operating in the same category as Lexington Law, has no corporate or personnel connection to that troubled group. Its current pricing is the one genuinely unresolved figure in this comparison: two dated 2026 sources disagree ($99/month with no setup fee vs. $129.99/month + a $129 setup fee), and Safeport''s own website could not be independently verified. We seed the higher, more conservative figure here -- confirm directly with Safeport before enrolling.',
  false, null, 'https://www.safeportlaw.com/', false, 'Attorney-led disputes', 4,
  'https://financebuzz.com/safeport-law-review', DATE '2026-07-03', true
),
(
  NULL,
  'msi-credit-solutions', 'us', 'credit-repair', 'companies', 'MSI Credit Solutions', 'Best for couples & customized pricing',
  8.0, 4.8, 2225, 0, 0, 0, 98,
  '{"setup_fee":null,"setup_fee_note":"Variable, assessed case-by-case after a free audit based on the complexity of your negative items -- MSI does not offer a fixed-rate setup fee (\"we do not offer fixed rate services\").","dispute_scope_note":"Late payments, collections, charge-offs, repossessions, foreclosures, bankruptcies, tax liens, and judgments -- the broadest item-type coverage in this comparison; debt-validation/goodwill/cease-and-desist specifics aren''t officially broken out.","guarantee_type":"conditional_refund","guarantee_note":"Refunds the setup fee (not ongoing monthly payments already made) if minimum deletion standards aren''t met and the customer met their own obligations -- an outcome-based guarantee, not a fixed time window.","states_note":"No official state-availability list found; Texas-based with 4 locations and bilingual support.","bbb_rating":"C+","bbb_accredited":false,"review_score":4.8,"review_count":2225,"review_source":"Google","nacso":true,"attorney_led":false,"regulatory_history_note":"No CFPB, FTC, or state AG enforcement actions found. One private federal lawsuit (Jones v. MSI Credit Solutions LLC, filed August 2023, closed August 2024) exists in court records; the claim basis could not be independently verified and is not treated as an established fact."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Only confirmed NACSO member','Largest review sample (2,225 Google reviews)','Couples rate as low as $69/person']::text[],
  ARRAY['The only candidate in this comparison with a confirmed NACSO (National Association of Credit Services Organizations) membership','Largest consumer-review sample in the field: 4.8/5 from 2,225 Google reviews','Couples pricing as low as $69/person, undercutting most individual rates elsewhere']::text[],
  ARRAY['BBB rating is C+ (not accredited) -- tied with The Credit People for the weakest BBB standing here','No fixed setup fee -- your actual upfront cost is unknowable until a free case audit, unlike every other candidate''s published number','No official state-availability list found']::text[],
  '{"cost":7.8,"features":8.4,"ux":8.0,"support":8.6}'::jsonb,
  'Best for couples and anyone wanting a custom-priced plan',
  'MSI Credit Solutions is the only candidate in this comparison with a confirmed NACSO membership, and its 4.8/5 rating from 2,225 Google reviews is the largest, most credible review sample in the field. Individual pricing is $98/month, dropping to $69/person for couples. Its real weakness is transparency: MSI has no fixed setup fee (assessed case-by-case after a free audit) and a C+, non-accredited BBB rating.',
  false, null, 'https://msicredit.com/', false, 'Couples & custom pricing', 5,
  'https://msicredit.com/blog/cost/', DATE '2026-07-03', true
),
(
  NULL,
  'credit-firm', 'us', 'credit-repair', 'companies', 'Credit Firm', 'Cheapest overall',
  8.3, 2.5, 50, 0, 0, 0, 49.99,
  '{"setup_fee":0,"dispute_scope_note":"Unlimited disputes across all categories: bureau challenges (typically 5-7 accounts per bureau per round), debt validation, goodwill interventions, and inquiry challenges. Cease-and-desist letters are not explicitly listed as a service.","guarantee_type":"none","guarantee_note":"No money-back guarantee advertised -- the only ranked candidate without one, offset by the lowest price in the field and month-to-month cancellation flexibility.","states_note":"Third-party sources describe availability across all 50 states; the official site does not make an explicit states claim.","bbb_rating":"A","bbb_rating_note":"Sources disagree between A+ and A -- seeded conservatively as ''A''.","bbb_accredited":false,"review_score":2.5,"review_count":50,"review_source":"Trustpilot","nacso":null,"attorney_led":false,"regulatory_history_note":"No CFPB, FTC, or state AG enforcement actions found."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Cheapest in the comparison ($49.99/mo)','No setup fee','Cancel anytime']::text[],
  ARRAY['Cheapest monthly fee in this comparison by a wide margin, with no setup fee','Pay-as-you-go, cancel anytime with no penalty','Unlimited disputes across bureau challenges, debt validation, and goodwill interventions']::text[],
  ARRAY['No money-back guarantee of any kind -- the only ranked candidate without one','Trustpilot rating is a mixed 2.5/5 (46-61 reviews across snapshots), the lowest consumer-review score in this comparison','Founded by attorneys historically, but current attorney involvement in day-to-day disputes is unclear -- not labeled attorney-led']::text[],
  '{"cost":9.4,"features":7.8,"ux":7.4,"support":7.2}'::jsonb,
  'The cheapest option, with real trade-offs to weigh',
  'Credit Firm charges $49.99/month with no setup fee -- the cheapest total cost of any candidate in this comparison by a wide margin, with unlimited disputes and no long-term contract. The trade-off is real: it''s the only ranked candidate with no money-back guarantee at all, and its Trustpilot rating (2.5/5 from a modest review sample) is the lowest consumer-review score in the field.',
  false, null, 'https://www.creditfirm.net/', false, 'Cheapest overall', 6,
  'https://www.creditfirm.net/', DATE '2026-07-03', true
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
