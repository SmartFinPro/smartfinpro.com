-- Comparison Cockpit — seed AU superannuation funds (market='au', topic='super-funds').
-- Visit-only launch (AU/CA/UK rollout, Stage 1 Slice AU-3): affiliate_link_id NULL,
-- is_affiliate=false, review_slug NULL, external_url = fund homepage.
-- HARD COMPLIANCE STOP: FOFA conflicted-remuneration ban prohibits commission
-- CTAs on super recommendations — never flip is_affiliate=true on this topic
-- without legal review (see lib/comparison/topics/au/super-funds.ts header).
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- auSuperFundsAttributesSchema. rating/review_count seeded 0 (no consumer
-- review platform score researched for super funds — value communicated via
-- award_note text instead; renders as honest "Not yet rated").
-- AustralianSuper carries an active, unresolved ASIC Federal Court case and a
-- confirmed member financial loss in the April 2025 credential-stuffing
-- attack — disclosed in full, ranked last, not top pick.
-- Provenance: live research 2026-07-11 against fund PDS/fee pages, APRA,
-- ASIC, SuperRatings/Canstar/Money magazine.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, management_fee, account_minimum,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'aware-super', 'au', 'superannuation', 'super-funds', 'Aware Super', 'Back-to-back SuperRatings Fund of the Year, 2025 and 2026',
  9.1, 0, 0, 0, 0.914, 0,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['SuperRatings Fund of the Year 2025 & 2026', 'Falling admin fees into 2026', '8.83% p.a. 10-yr return (High Growth)']::text[],
  ARRAY['The only fund in this comparison named SuperRatings Fund of the Year in both 2025 and 2026', 'Strong 10-year return on its default High Growth lifecycle stage (8.83% p.a. to 30 June 2025)', 'Admin fees falling into 2026 (cut to 0.16% from 1 May 2026) — rare among peers'],
  ARRAY['Lifecycle default means younger/older members sit in different stages with different fee/return profiles', 'Fee example figure sits close to the industry median, not the outright cheapest'],
  '{"fees":8.4,"features":9.2,"ux":8.8,"support":9.0}'::jsonb,
  'The strongest all-round pick — back-to-back Fund of the Year with a clean regulatory record.',
  '{"total_fee_aud_on_50k":457,"flat_admin_fee_aud":null,"default_option":"MySuper Lifecycle (High Growth stage, members ≤55)","ten_year_return_pct":8.83,"return_period_note":"High Growth stage, 10 years to 30 June 2025","members_millions":1.2,"aum_billions_aud":200,"aum_note":"$200bn+ AUM (2025)","award_note":"SuperRatings Fund of the Year 2025 AND 2026 (announced 26 Nov 2025); Canstar Outstanding Value Award, 5th consecutive year 2026","mysuper_authorised":true,"regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://aware.com.au/', true, 'Most members wanting an all-round strong fund', 1,
  'https://aware.com.au/member/what-we-offer/fees-and-costs', DATE '2026-07-11', true
),
(
  NULL, 'australian-retirement-trust', 'au', 'superannuation', 'super-funds', 'Australian Retirement Trust', 'Below-median fees with multiple 2025/26 awards',
  8.9, 0, 0, 0, 0.6744, 0,
  '[{"type":"green","label":"Best value"}]'::jsonb,
  ARRAY['SuperRatings MySuper of the Year 2025', 'Canstar Outstanding Value, 2nd year running', '8.69% p.a. 10-yr return']::text[],
  ARRAY['Below-median fee on the $50,000 benchmark, backed by multiple 2025/26 awards (SuperRatings MySuper of the Year 2025, Money magazine Best MySuper Lifecycle Product 2026)', 'Strong 10-year return (8.69% p.a. to 30 June 2025)', "Australia's 2nd-largest fund, ~2.4 million members"],
  ARRAY['Recently absorbed the Qantas Super merger (March 2025) — an operational integration to be aware of, not a compliance issue', 'Lifecycle-based default makes a single return figure only an approximation for any individual member'],
  '{"fees":9.0,"features":8.8,"ux":8.6,"support":8.6}'::jsonb,
  'The strongest fee-and-award combination in this comparison.',
  '{"total_fee_aud_on_50k":337.20,"flat_admin_fee_aud":57.20,"default_option":"Super Savings Lifecycle Balanced","ten_year_return_pct":8.69,"return_period_note":"Lifecycle Balanced, 10 years to 30 June 2025","members_millions":2.4,"aum_billions_aud":330,"aum_note":"$330bn+ AUM (2025), Australia''s 2nd-largest fund","award_note":"SuperRatings MySuper of the Year 2025; Money magazine Best MySuper Lifecycle Product 2026 & Best Moderate Pension Product 2026; Canstar Outstanding Value Award, 2nd consecutive year 2026","mysuper_authorised":true,"regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.australianretirementtrust.com.au/', false, 'Value-focused members', 2,
  'https://www.australianretirementtrust.com.au/investments/fees', DATE '2026-07-11', true
),
(
  NULL, 'hostplus', 'au', 'superannuation', 'super-funds', 'Hostplus', '#1-ranked long-term MySuper performance by SuperRatings',
  8.7, 0, 0, 0, 1.1382, 0,
  '[{"type":"sky","label":"Best long-term performance"}]'::jsonb,
  ARRAY['#1 SuperRatings 10/15/20-yr MySuper performance', 'Money magazine Best Super Fund 2026', '8.32% p.a. 10-yr return'],
  ARRAY['SuperRatings ranks Hostplus #1 for MySuper performance over 10, 15 AND 20 years to 30 June 2025', 'Money magazine named it Best Super Fund 2026 overall', 'Canstar Outstanding Value Award, 9th consecutive year'],
  ARRAY['Higher total fee load than peers once performance fees are included (~1.14% vs ~0.7% industry-fund norm)', 'Member/AUM figures varied across sources at research time — confirm against the fund''s latest factsheet'],
  '{"fees":7.4,"features":9.4,"ux":8.6,"support":8.6}'::jsonb,
  'The strongest long-term track record in this comparison, at a higher fee.',
  '{"total_fee_aud_on_50k":569.10,"flat_admin_fee_aud":78,"default_option":"Balanced (MySuper)","ten_year_return_pct":8.32,"return_period_note":"Balanced (MySuper), 10 years to 30 June 2025 — SuperRatings #1 over 10, 15 and 20 years","members_millions":1.8,"aum_billions_aud":115,"aum_note":"Member/AUM figures conflicted across sources at research time (1.8-2.1M members; $115-145bn AUM cited) — confirm against Hostplus'' latest factsheet","award_note":"Money magazine Best Super Fund 2026 & Best Balanced Super Product; Canstar Outstanding Value Award, 9th consecutive year 2026; SuperRatings 10-yr Platinum (MySuper), 20-yr Platinum (core fund)","mysuper_authorised":true,"regulatory_note":""}'::jsonb,
  'official', 'low',
  false, NULL, 'https://hostplus.com.au/', false, 'Members prioritising long-term performance', 3,
  'https://hostplus.com.au/members/our-products-and-services/super/fees-charges', DATE '2026-07-11', true
),
(
  NULL, 'unisuper', 'au', 'superannuation', 'super-funds', 'UniSuper', 'SuperRatings Fund of the Year 2026, majority in-house managed',
  8.5, 0, 0, 0, 0.812, 0,
  '[]'::jsonb,
  ARRAY['SuperRatings Fund of the Year 2026', 'Below-median fee ($406 on $50k)', '>70% of assets managed in-house'],
  ARRAY['SuperRatings named UniSuper Fund of the Year 2026 (and Retirement Offering of the Year 2025)', 'Below-median fee relative to the ~$467 industry median', 'Over 70% of assets managed in-house, an unusual structural strength'],
  ARRAY['A severe April 2024 cloud-infrastructure misconfiguration by Google Cloud deleted UniSuper''s private-cloud subscription, locking 620,000+ members out of online accounts for over a week (resolved, disclosed for transparency)', 'Investment fee % not cleanly isolated from admin fee in available sources at research time'],
  '{"fees":8.6,"features":8.8,"ux":7.8,"support":8.4}'::jsonb,
  'A strong, award-winning fund — weigh its most severe documented outage below.',
  '{"total_fee_aud_on_50k":406,"flat_admin_fee_aud":96,"default_option":"Balanced (MySuper)","ten_year_return_pct":7.7,"return_period_note":"Balanced (MySuper), 10 years to 30 June 2025","members_millions":0.65,"aum_billions_aud":139,"aum_note":"647,000-680,495 members cited across sources; $139bn (30 June 2024) growing toward ~$170bn by an April 2026 report — confirm against UniSuper''s latest factsheet","award_note":"SuperRatings Super Fund of the Year 2026 (also Retirement Offering of the Year 2025, Fund of the Year 2024); Money magazine Best Pension Fund 2025; 20-Year Platinum Performance Fund 2005-2025","mysuper_authorised":true,"regulatory_note":"In April 2024, a Google Cloud misconfiguration deleted UniSuper''s entire private-cloud infrastructure subscription, locking 620,000+ members out of online accounts for over a week. Backups held with a separate provider minimised data loss; APRA said it was monitoring. This is a resolved operational incident (not an ongoing compliance matter) and predates the 2025/2026 research window, but remains the most severe documented member-access disruption among the funds researched for this page — disclosed for transparency."}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.unisuper.com.au/', false, 'Members wanting in-house-managed assets', 4,
  'https://www.unisuper.com.au/super/fees-and-costs', DATE '2026-07-11', true
),
(
  NULL, 'hesta', 'au', 'superannuation', 'super-funds', 'HESTA', 'Consecutive SuperRatings Net Benefit Awards, health & community-services focus',
  8.2, 0, 0, 0, 0.774, 0,
  '[]'::jsonb,
  ARRAY['SuperRatings Net Benefit Award 2025 & 2026', 'Chant West 5 Apples 2025', 'Low $52/yr flat admin fee'],
  ARRAY['SuperRatings Net Benefit Award winner in both 2025 and 2026 (best net-benefit outcomes to members)', 'Chant West Specialist Fund of the Year 2025 (5 Apples rating), SuperRatings Platinum', 'One of the lowest flat admin fees in this comparison ($52/yr)'],
  ARRAY['10-year return (7.40-7.64% p.a.) trails the top performers in this comparison (AustralianSuper, ART, Hostplus, Aware all above 7.9-8.8%)', 'Some fee-page content required a re-fetch to reconcile during research — recommend a final spot-check against the PDS'],
  '{"fees":9.0,"features":8.2,"ux":8.4,"support":8.6}'::jsonb,
  'Strong net-benefit track record and low admin fee, with more modest headline returns.',
  '{"total_fee_aud_on_50k":387,"flat_admin_fee_aud":52,"default_option":"Balanced Growth (MySuper)","ten_year_return_pct":7.52,"return_period_note":"Balanced Growth (MySuper), 10 years to 30 June 2025 (fund cites 7.40-7.64% across slightly different periods; midpoint used)","members_millions":1.0,"aum_billions_aud":105,"aum_note":"1 million+ members; ~$105bn AUM (FY2025-26 reporting)","award_note":"SuperRatings Net Benefit Award 2025 and 2026; Chant West Specialist Fund of the Year 2025 (5 Apples); SuperRatings Platinum rating","mysuper_authorised":true,"regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.hesta.com.au/', false, 'Health & community-services members', 5,
  'https://www.hesta.com.au/members/your-superannuation/fees-and-costs', DATE '2026-07-11', true
),
(
  NULL, 'rest-super', 'au', 'superannuation', 'super-funds', 'Rest Super', 'Large-scale fund with transparent MySuper dashboard fee reporting',
  7.6, 0, 0, 0, 0.816, 0,
  '[]'::jsonb,
  ARRAY['~2 million members', 'Transparent MySuper Product Dashboard', 'Retail/hospitality-sector heritage'],
  ARRAY['Large scale (~2 million members) with broad relevance beyond its retail-sector origins', 'Publishes a transparent MySuper Product Dashboard fee breakdown', 'Age-based lifecycle default (Core Strategy) tailors growth exposure to member age'],
  ARRAY['Lowest 10-year return of the 7 funds researched (6.56% p.a. to 30 June 2025)', 'No major 2025/2026 "fund of the year"-tier award found at research time'],
  '{"fees":8.2,"features":7.4,"ux":8.2,"support":8.0}'::jsonb,
  'A large, transparent fund whose recent long-term performance trails its peers.',
  '{"total_fee_aud_on_50k":408,"flat_admin_fee_aud":78,"default_option":"Core Strategy (age-based lifecycle MySuper)","ten_year_return_pct":6.56,"return_period_note":"Core Strategy, 10 years to 30 June 2025","members_millions":2.0,"aum_billions_aud":100,"aum_note":"~$100bn AUM (31 July 2025); a ~$112bn (30 June 2026) figure was also cited but close to the research date and unverified — confirm against Rest''s latest factsheet","award_note":"No major 2025/2026 SuperRatings/Canstar/Money magazine award found at research time — check rest.com.au/why-rest/awards directly for smaller-category recognitions","mysuper_authorised":true,"regulatory_note":""}'::jsonb,
  'official', 'low',
  false, NULL, 'https://rest.com.au/', false, 'Members from retail & hospitality backgrounds', 6,
  'https://rest.com.au/investments/mysuper-product-dashboard', DATE '2026-07-11', true
),
(
  NULL, 'australiansuper', 'au', 'superannuation', 'super-funds', 'AustralianSuper', 'Australia''s largest fund — with an active ASIC case disclosed',
  7.3, 0, 0, 0, 0.734, 0,
  '[]'::jsonb,
  ARRAY['Australia''s largest fund, 3.6M+ members', '15 consecutive years Canstar value award', '⚠ Active ASIC Federal Court case — see detail'],
  ARRAY["Australia's largest fund by both members (3.6M+) and assets (A$410bn+), with the lowest relative fee among the largest-scale funds", 'Strong 10-year return (7.94% p.a. to 30 June 2025)', 'Canstar Outstanding Value Award, 15th consecutive year — the longest streak in this comparison'],
  ARRAY['Active, unresolved ASIC Federal Court case alleging failures processing ~6,897 death benefit claims (some delayed up to 1,140 days) — no penalty determined as of this page''s last verification', 'The only fund among several targeted in an April 2025 credential-stuffing attack with a confirmed member financial loss (A$500,000 across 4 members, one losing A$406,000)'],
  '{"fees":9.2,"features":8.6,"ux":8.0,"support":6.8}'::jsonb,
  'Australia''s largest and one of its lowest-fee funds — read the disclosed regulatory matter below before choosing.',
  '{"total_fee_aud_on_50k":367,"flat_admin_fee_aud":52,"default_option":"Balanced (MySuper)","ten_year_return_pct":7.94,"return_period_note":"Balanced (MySuper), 10 years to 30 June 2025","members_millions":3.6,"aum_billions_aud":410,"aum_note":"3.6 million+ members; A$410bn+ AUM as at 31 Dec 2025 — Australia''s largest fund","award_note":"Canstar Outstanding Value Award — Superannuation, 15th consecutive year (2011-2026)","mysuper_authorised":true,"regulatory_note":"ASIC filed a Federal Court lawsuit against AustralianSuper on 30 May 2025 (media release 25-034MR) alleging the fund failed to efficiently process approximately 6,897 death benefit claims between 1 July 2019 and 18 October 2024, with some claims taking up to 1,140 days; AustralianSuper is disputing the allegations and the case remains ongoing (case management hearings continuing through 2026), with no penalty determined as of this page''s last verification. Separately, in an April 2025 credential-stuffing cyberattack that also targeted several other super funds, AustralianSuper was the only fund among the group with a confirmed member financial loss — A$500,000 combined across 4 members, including one member who lost A$406,000."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.australiansuper.com/', false, 'Read the disclosed ASIC matter before choosing', 7,
  'https://www.australiansuper.com/why-choose-us/fees-costs', DATE '2026-07-11', true
)
ON CONFLICT (market, category, topic, slug) DO UPDATE SET
  display_name = EXCLUDED.display_name, tagline = EXCLUDED.tagline, score = EXCLUDED.score,
  rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, clicks = EXCLUDED.clicks,
  management_fee = EXCLUDED.management_fee, account_minimum = EXCLUDED.account_minimum,
  badges = EXCLUDED.badges, chips = EXCLUDED.chips, pros = EXCLUDED.pros, cons = EXCLUDED.cons,
  sub_scores = EXCLUDED.sub_scores, verdict = EXCLUDED.verdict, attributes = EXCLUDED.attributes,
  source_type = EXCLUDED.source_type, confidence = EXCLUDED.confidence,
  is_affiliate = EXCLUDED.is_affiliate, review_slug = EXCLUDED.review_slug,
  external_url = EXCLUDED.external_url, is_top_pick = EXCLUDED.is_top_pick,
  best_for = EXCLUDED.best_for, display_order = EXCLUDED.display_order,
  source_url = EXCLUDED.source_url, data_verified_at = EXCLUDED.data_verified_at, active = EXCLUDED.active;
