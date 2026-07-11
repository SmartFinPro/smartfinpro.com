-- Comparison Cockpit — seed AU gold investing platforms (market='au', topic='platforms').
-- Visit-only launch (AU/CA/UK rollout, Stage 1 Slice AU-2): affiliate_link_id NULL,
-- is_affiliate=false, review_slug NULL, external_url = provider homepage.
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- lib/comparison/topics/au/gold-investing.ts (auGoldInvestingAttributesSchema).
-- Gold Stackers kept per the approved candidate shortlist but ranked last with
-- prominent disclosure of a specific, dated (Feb 2026) non-delivery complaint —
-- disclosed, not silently excluded, per SEO addendum §14.
-- Provenance: live research 2026-07-10 against official pricing pages,
-- LBMA Good Delivery list, bullion.directory, Trustpilot.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, monthly_fee,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'perth-mint', 'au', 'gold-investing', 'platforms', 'The Perth Mint', 'Australia''s only government-owned mint, LBMA-accredited',
  9.0, 0, 0, 0, 0,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['Government-owned (WA)', 'LBMA Good Delivery-accredited', '0% unallocated storage']::text[],
  ARRAY['Australia''s only government-owned mint, backed by the Western Australian Government', 'LBMA Good Delivery-accredited refiner — the strongest accreditation in this comparison', 'Unallocated storage is free (0%); allocated storage 1.0% p.a.'],
  ARRAY['A past AUSTRAC AML/CTF enforceable undertaking (2023-2025, now resolved) is part of the record', 'Live pricing page was non-functional at research time, complicating premium verification'],
  '{"fees":8.6,"features":9.4,"ux":8.4,"support":8.8}'::jsonb,
  'The strongest accreditation of any dealer in this comparison — a government-owned, LBMA-accredited mint.',
  '{"premium_over_spot_pct":null,"premium_note":"Live pricing page returned \"pricing unavailable\" at research time — get a current quote directly before buying; industry reference range for minted bars/coins is commonly cited around 3-6%, not independently confirmed here.","storage_fee_pct":1.0,"storage_note":"Allocated gold: 1.0% p.a.; Unallocated gold: 0% (free)","buyback_available":true,"accreditation":"government_mint","accreditation_note":"Wholly owned by the Government of Western Australia (trades as Gold Corporation); also an LBMA Good Delivery-accredited refiner.","years_in_business":126,"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"Not independently confirmed at research time — recommend using Perth Mint''s own published customer stats or Google Business rating instead","regulatory_note":"AUSTRAC found serious AML/CTF program failings at Gold Corporation (Perth Mint) — inadequate customer due diligence and transaction monitoring. An enforceable undertaking ran Nov 2023 to May 2025, when AUSTRAC accepted the external auditor''s final remediation report and concluded the matter. Disclosed transparently given Perth Mint''s position as the highest-accreditation candidate on this page."}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.perthmint.com/', true, 'Investors who want government/LBMA-backed gold', 1,
  'https://www.perthmint.com/invest/information-about-gold-and-silver-storage/fees/', DATE '2026-07-10', true
),
(
  NULL, 'ainslie-bullion', 'au', 'gold-investing', 'platforms', 'Ainslie Bullion', 'Australia''s longest-operating independent dealer, since 1974',
  8.6, 4.5, 12, 12, 0,
  '[{"type":"green","label":"Most established independent"}]'::jsonb,
  ARRAY['Operating since 1974', 'Clear allocated/unallocated storage', '4.5/5 on bullion.directory']::text[],
  ARRAY['Oldest independent dealer in this comparison, operating since 1974', 'Clear storage structure: $15.50/oz p.a. allocated, free unallocated', 'Strong independent trust score (4.5/5, "A+" rating on bullion.directory) and a clean complaint record'],
  ARRAY['Does not hold an AFSL — outside ASIC/AFCA scope, same as most dealers in this category', 'Storage is a flat per-ounce fee, not a percentage, complicating direct comparison'],
  '{"fees":8.4,"features":8.6,"ux":8.8,"support":9.0}'::jsonb,
  'The most established independent Australian bullion dealer, with a clean track record.',
  '{"premium_over_spot_pct":null,"premium_note":"Not confirmed live at research time — get a current quote directly before buying.","storage_fee_pct":null,"storage_note":"Allocated gold & platinum: A$15.50/oz p.a. (incl. GST), a flat per-ounce fee, not a percentage; Unallocated: free (0%)","buyback_available":true,"accreditation":"retail_dealer","accreditation_note":"Independent retail bullion dealer; does not hold an AFSL (explicitly outside ASIC regulation and AFCA dispute resolution).","years_in_business":52,"trustpilot_rating":4.5,"trustpilot_count":12,"trustpilot_note":"bullion.directory internal score (4.5/5 from 12 reviews, \"A+\" rating) — direct Trustpilot figure could not be confirmed (fetch blocked)","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.ainsliebullion.com.au/', false, 'Buyers who value the longest track record', 2,
  'https://ainsliebullion.com.au/Storage', DATE '2026-07-10', true
),
(
  NULL, 'as-good-as-gold-australia', 'au', 'gold-investing', 'platforms', 'As Good As Gold Australia', 'The best-attested customer rating in this comparison',
  8.3, 4.7, 28, 28, 0,
  '[{"type":"sky","label":"Highest-rated"}]'::jsonb,
  ARRAY['4.7/5 from 28 Trustpilot reviews', 'Sources from 6 major mints', 'Founder-led, personally accessible']::text[],
  ARRAY['Highest, most robustly corroborated Trustpilot score of the 7 (4.7/5, 28 reviews, cross-checked against a second independent directory)', 'Sources from Perth Mint, Royal Canadian Mint, The Royal Mint, Austrian Mint, PAMP and Valcambi', 'Founder-led and described by customers as personally accessible'],
  ARRAY['Newer/smaller company than most peers (founded 2013)', 'Several hard numeric fields (premium %, storage %, minimum order) not independently confirmed at research time'],
  '{"fees":8.0,"features":8.2,"ux":8.8,"support":9.0}'::jsonb,
  'The strongest independently corroborated customer rating in this comparison.',
  '{"premium_over_spot_pct":null,"premium_note":"Not confirmed live at research time — get a current quote directly before buying.","storage_fee_pct":null,"storage_note":"Not confirmed at research time — no storage percentage was found on the provider''s public pages.","buyback_available":false,"accreditation":"authorised_distributor","accreditation_note":"Sources product from multiple accredited mints/refiners (Perth Mint, Royal Canadian Mint, The Royal Mint, Austrian Mint, PAMP, Valcambi); not itself a government mint or LBMA-accredited refiner.","years_in_business":13,"trustpilot_rating":4.7,"trustpilot_count":28,"trustpilot_note":"Trustpilot 4.7/5 from 28 reviews, corroborated by a second independent directory (bullion.directory, 5/5 from 5 reviews) — the most robustly attested rating found among the 7 candidates","regulatory_note":"Buyback availability could not be explicitly confirmed at research time — company markets itself as a buyer/seller but no dedicated buyback page/spread was found; confirm directly before assuming buyback terms."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.asgoodasgold.com.au/', false, 'Buyers prioritising customer-rating track record', 3,
  'https://www.asgoodasgold.com.au/', DATE '2026-07-10', true
),
(
  NULL, 'abc-bullion', 'au', 'gold-investing', 'platforms', 'ABC Bullion', 'Large, LBMA-accredited refiner with a mixed service record',
  7.6, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['LBMA-accredited refinery (ABC Refinery)', 'Reduced storage fees since Jul 2025', 'Large, well-known Pallion Group brand']::text[],
  ARRAY['Owns its own LBMA Good Delivery-accredited refinery — few AU dealers do', 'Reduced storage fees (0.55% p.a. on gold cast bars) for single-issuer holdings since July 2025', 'Large, well-known brand (Pallion Group)'],
  ARRAY['Customer-service complaints (long hold times, delivery/dispatch delays) appear repeatedly in reviews', 'Conflicting Trustpilot figures found across sources (ranging 1.7-3.7/5) — too inconsistent to publish a single confirmed number'],
  '{"fees":8.0,"features":8.6,"ux":6.8,"support":6.2}'::jsonb,
  'A large, LBMA-accredited refiner — weigh the mixed service-quality reviews against its scale and accreditation.',
  '{"premium_over_spot_pct":3.9,"premium_note":"One low-confidence indexed data point (~3.9% on a 1oz Gold Cast Bar, Jan 2026) — treat as indicative only, get a current quote before buying.","storage_fee_pct":0.55,"storage_note":"0.55% p.a. for gold cast bars in Premium/Secure storage (reduced 15-20% from July 2025 for single-issuer holdings)","buyback_available":true,"accreditation":"lbma_refiner","accreditation_note":"ABC Refinery (part of the same group) is LBMA Good Delivery-accredited for gold.","years_in_business":null,"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"Conflicting figures found across sources (1.7/5 to 3.7/5 on Trustpilot; 2.67/5 from 12 reviews on bullion.directory) — too inconsistent to publish a single confirmed rating without a fresh direct check","regulatory_note":"Multiple negative customer reviews describe unresponsive customer service (up to 60 minutes on hold, unanswered emails) and delivery/dispatch delays without tracking; one review describes 17 days of no response on a stored-silver delivery request. Positive reviews (product quality, Gold Saver program) also exist — sentiment is genuinely mixed, not uniformly negative."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.abcbullion.com.au/', false, 'Buyers wanting a large, LBMA-accredited refiner', 4,
  'https://www.abcbullion.com/store/gold', DATE '2026-07-10', true
),
(
  NULL, 'gold-bullion-australia', 'au', 'gold-investing', 'platforms', 'Gold Bullion Australia', 'A 40+ year dealer with its own in-house vault',
  7.8, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['40+ years in business', 'Own in-house custodial vault', 'Consistently positive review sentiment']::text[],
  ARRAY['One of the few AU dealers with its own in-house custodial vault', 'Long operating history (40+ years)', 'Consistently positive review sentiment where found'],
  ARRAY['Founding year is inconsistent between the company''s own marketing (1980) and an independent directory (1984)', 'Premium %, storage % and minimum order could not be independently confirmed at research time'],
  '{"fees":7.6,"features":8.0,"ux":8.4,"support":8.2}'::jsonb,
  'A long-established dealer with its own vault — several pricing fields need a direct quote before buying.',
  '{"premium_over_spot_pct":null,"premium_note":"Not found/confirmed at research time.","storage_fee_pct":null,"storage_note":"Described as \"pool allocated holdings, segregated storage\" with no percentage published — confirm directly.","buyback_available":true,"accreditation":"retail_dealer","accreditation_note":"Independent retail dealer with its own in-house custodial vault (uncommon among AU dealers); not itself a government mint or LBMA-listed refiner.","years_in_business":42,"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"One low-confidence source (Trustindex.io, a Trustpilot-adjacent aggregator) cited 4.9/5 from ~420 reviews; a separate bullion.directory listing showed zero reviews — the two sources don''t corroborate each other, treated as unconfirmed pending a direct Trustpilot check","regulatory_note":"Two conflicting founding dates found (1980 per own marketing vs. 1984 per an independent directory) — using \"40+ years\" rather than a precise founding year pending resolution. No substantive complaints found."}'::jsonb,
  'official', 'low',
  false, NULL, 'https://goldbullionaustralia.com.au/', false, 'Buyers wanting in-house vault storage', 5,
  'https://www.goldbullionaustralia.com.au/', DATE '2026-07-10', true
),
(
  NULL, 'guardian-gold', 'au', 'gold-investing', 'platforms', 'Guardian Gold', 'Individually segregated safe-deposit storage, off-balance-sheet',
  7.9, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['Off-balance-sheet, segregated storage', 'Dual mint distributorship', 'Optional Lloyd''s of London insurance']::text[],
  ARRAY['Off-balance-sheet, individually segregated safe-deposit-box storage — structurally lower counterparty risk than pooled allocated storage', 'Authorised distributor of both The Perth Mint and the Royal Australian Mint', 'Optional unlimited insurance available through Lloyd''s of London'],
  ARRAY['Flat-fee storage model (from A$199/year) makes % comparison to competitors awkward at low holding values', 'Very small review sample sizes across all sources found (3-5 reviews)'],
  '{"fees":7.4,"features":8.8,"ux":8.6,"support":8.6}'::jsonb,
  'A structurally different, lower-counterparty-risk storage model worth considering for larger holdings.',
  '{"premium_over_spot_pct":null,"premium_note":"Not confirmed live at research time.","storage_fee_pct":null,"storage_note":"Flat safe-deposit-box lease fee starting from A$199/year (not a percentage of holding value) — a structurally different model from allocated/unallocated storage elsewhere on this page","buyback_available":true,"accreditation":"authorised_distributor","accreditation_note":"Authorised distributor of The Perth Mint and the Royal Australian Mint; storage via individually segregated, off-balance-sheet safe deposit boxes with sole legal title to contents.","years_in_business":16,"trustpilot_rating":null,"trustpilot_count":null,"trustpilot_note":"bullion.directory internal score 5/5 from only 3 reviews — too small a sample to be reliable, direct Trustpilot figure not confirmed","regulatory_note":"Two different founding years found for two related entities (Guardian Vaults, the storage company, founded 2002; Guardian Gold, the bullion-trading arm, founded 2010) — kept distinct rather than conflated. No complaints found."}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.guardiangold.com.au/', false, 'Larger holdings wanting segregated storage', 6,
  'https://guardian-gold.com.au/sell-bullion/', DATE '2026-07-10', true
),
(
  NULL, 'gold-stackers', 'au', 'gold-investing', 'platforms', 'Gold Stackers', 'Authorised Perth Mint/ABC Bullion distributor — with a serious disclosed complaint',
  6.0, 3.2, 1, 1, 0,
  '[]'::jsonb,
  ARRAY['Authorised Perth Mint/ABC Bullion distributor', 'Tiered storage options', '⚠ Serious complaint on record — see detail']::text[],
  ARRAY['Authorised distributor of Perth Mint and ABC Bullion products', 'Tiered storage options (allocated, private, pool allocated)'],
  ARRAY['A specific, dated (February 2026) Trustpilot complaint describes a fully-paid silver order left undelivered for weeks with no tracking, followed by a refund refusal and an offer to liquidate at buy-back price instead — the most concerning record found among the 7 dealers researched for this page', 'Thin review sample (1 Trustpilot review found, "Average" 3.21/5) and a possible undisclosed corporate affiliation with Gold Bullion Australia (shared "GBA Group" / 1980 founding narrative)'],
  '{"fees":7.0,"features":7.4,"ux":6.0,"support":4.0}'::jsonb,
  'Kept in this comparison per our sourced-shortlist policy, but ranked last — read the disclosed complaint below before buying.',
  '{"premium_over_spot_pct":null,"premium_note":"Not confirmed live at research time.","storage_fee_pct":null,"storage_note":"Reported tiers (secondary source, not primary-confirmed): allocated storage 0.65% p.a. gold / 1.25% p.a. silver; private storage 0.85% p.a.; pool allocated storage free — recommend a direct primary confirmation before publishing.","buyback_available":true,"accreditation":"authorised_distributor","accreditation_note":"Authorised distributor of Perth Mint and ABC Bullion products; not itself a government mint or LBMA-accredited refiner. Possible corporate affiliation with Gold Bullion Australia (both trace to \"established 1980\" language and \"GBA Group\") — not independently confirmed, disclosed for transparency.","years_in_business":46,"trustpilot_rating":3.21,"trustpilot_count":1,"trustpilot_note":"au.trustpilot.com — 3.21/5 (\"Average\") based on only 1 review at research time — too thin a sample to be statistically meaningful on its own","regulatory_note":"A February 2026-dated Trustpilot complaint describes a fully-paid silver order (placed 27 Jan 2026) with weeks of no delivery, no tracking and no confirmed dispatch date; when the customer requested a refund, the company reportedly refused and instead offered liquidation at the market buy-back price (a loss to the customer given price movement); the matter was reportedly escalated to the company''s lawyers after the customer pursued consumer-protection channels. A separate, smaller complaint (bullion.directory, 2 reviews) alleges a negative review was never published on the company''s own testimonials page. This is the most concerning record found among the 7 candidates researched for this page and is disclosed here in full rather than omitted."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://goldstackers.com.au/', false, 'Read the disclosed complaint before choosing', 7,
  'https://www.goldstackers.com.au/buy/gold/', DATE '2026-07-10', true
)
ON CONFLICT (market, category, topic, slug) DO UPDATE SET
  display_name = EXCLUDED.display_name, tagline = EXCLUDED.tagline, score = EXCLUDED.score,
  rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, clicks = EXCLUDED.clicks,
  monthly_fee = EXCLUDED.monthly_fee, badges = EXCLUDED.badges, chips = EXCLUDED.chips,
  pros = EXCLUDED.pros, cons = EXCLUDED.cons, sub_scores = EXCLUDED.sub_scores,
  verdict = EXCLUDED.verdict, attributes = EXCLUDED.attributes, source_type = EXCLUDED.source_type,
  confidence = EXCLUDED.confidence, is_affiliate = EXCLUDED.is_affiliate,
  review_slug = EXCLUDED.review_slug, external_url = EXCLUDED.external_url,
  is_top_pick = EXCLUDED.is_top_pick, best_for = EXCLUDED.best_for,
  display_order = EXCLUDED.display_order, source_url = EXCLUDED.source_url,
  data_verified_at = EXCLUDED.data_verified_at, active = EXCLUDED.active;
