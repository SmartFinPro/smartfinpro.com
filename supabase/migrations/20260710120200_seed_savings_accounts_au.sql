-- Comparison Cockpit — seed AU high-interest savings accounts (market='au', topic='savings-accounts').
-- Visit-only launch (AU/CA/UK rollout, Stage 1 Slice AU-1): affiliate_link_id NULL,
-- is_affiliate=false, review_slug NULL, external_url = provider homepage.
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- lib/comparison/topics/au/savings-accounts.ts (auSavingsAttributesSchema).
-- All 7 rows seed monthly_fee=0 (banking@0 pattern — the cost calculator is
-- honest at $0 fees; the comparison signal lives entirely in the max-rate
-- specColumn, matching high-yield-savings.ts's US precedent).
-- Provenance: docs/superpowers/specs/2026-07-10-best-x-au-ca-uk-country-shortlist.md
-- (AU section 9) + live research 2026-07-10 (official rate sheets, Finder/Infochoice
-- cross-checks, APRA ADI register).

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, monthly_fee,
  badges, chips, pros, cons, sub_scores, verdict,
  has_no_monthly_fee, has_interest,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'bankwest-easy-saver', 'au', 'savings', 'savings-accounts', 'Bankwest Easy Saver', 'Strong intro rate plus the best unconditional fallback in the field',
  9.3, 0, 0, 0, 0,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['5.75% p.a. for 4 months','5.00% p.a. ongoing, no conditions','No fees, no minimum']::text[],
  ARRAY['5.75% p.a. introductory rate for 4 months on balances up to A$250,000.99','5.00% p.a. ongoing rate with NO behavioural conditions once the intro period ends','Backed by Commonwealth Bank infrastructure, no fees or minimum balance'],
  ARRAY['No joint accounts, and a 2-year lockout before requalifying for another intro rate','Above A$250,000.99, the ongoing rate drops sharply to 2.10% p.a.'],
  '{"fees":10.0,"features":9.0,"ux":8.8,"support":8.8}'::jsonb,
  'The strongest combination of a high introductory rate and a genuinely good unconditional fallback.',
  true, true,
  '{"max_rate_pct":5.75,"base_rate_pct":5.00,"rate_type":"intro","rate_conditions":"5.75% p.a. for the first 4 months on balances up to A$250,000.99 (4.80% intro above that threshold); no deposit or withdrawal conditions; limited to 1 account per customer, no joint accounts; not eligible again if an Easy Saver intro rate was held in the last 2 years.","intro_period_months":4,"max_balance_for_rate":250000,"min_deposit":0,"linked_account_required":true,"adi_fcs":true,"fcs_shared_licence_note":"Bankwest is a division of Commonwealth Bank of Australia — FCS protection is shared across Bankwest and CommBank-branded accounts.","app_rating":null,"app_rating_note":"No independently verified consumer-app rating found at research time"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.bankwest.com.au/savings-accounts/high-interest', true, 'Best overall — intro boost plus a strong ongoing rate', 1,
  'https://www.bankwest.com.au/rates/savings-bank-rates', DATE '2026-07-10', true
),
(
  NULL, 'amp-go-save', 'au', 'savings', 'savings-accounts', 'AMP Bank GO Save', 'A flat 5.10% p.a. with zero behavioural conditions',
  9.0, 0, 0, 0, 0,
  '[{"type":"green","label":"Best unconditional rate"}]'::jsonb,
  ARRAY['5.10% p.a. flat, no conditions','No minimum balance','App-only GO banking platform']::text[],
  ARRAY['5.10% p.a. — the highest fully unconditional rate in our comparison','No minimum balance required to earn interest, and no deposit/growth conditions','Balance cap of A$500,000 for the rate, double most competitors'' introductory-tier caps'],
  ARRAY['App-only banking (GO platform) — no classic online banking portal','Lower headline peak rate than the best conditional/introductory offers (5.10% vs up to 5.90%)'],
  '{"fees":10.0,"features":8.2,"ux":8.4,"support":7.8}'::jsonb,
  'The best choice if you want the same rate every month with zero conditions to track.',
  true, true,
  '{"max_rate_pct":5.10,"base_rate_pct":5.10,"rate_type":"standard","rate_conditions":"No deposit, withdrawal or balance-growth conditions; requires an active AMP Bank GO Everyday account.","intro_period_months":null,"max_balance_for_rate":500000,"min_deposit":0,"linked_account_required":true,"adi_fcs":true,"fcs_shared_licence_note":"AMP Bank Ltd is its own APRA-licensed ADI.","app_rating":null,"app_rating_note":"AMP Bank GO is a newer app-only platform; no independently verified rating found at research time"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.amp.com.au/personal-banking/everyday-money/amp-bank-go-save', false, 'Zero-condition savers', 2,
  'https://www.amp.com.au/personal-banking/interest-rates-fees', DATE '2026-07-10', true
),
(
  NULL, 'rabobank-hisa', 'au', 'savings', 'savings-accounts', 'Rabobank Australia High Interest Savings', 'The single highest headline rate on the market',
  8.6, 0, 0, 0, 0,
  '[{"type":"sky","label":"Highest headline rate"}]'::jsonb,
  ARRAY['5.90% p.a. for 4 months','No conditions during intro period','No own transaction account required']::text[],
  ARRAY['5.90% p.a. — the highest rate in our entire comparison','Zero behavioural conditions during the 4-month introductory window','No need to hold a Rabobank transaction account — fund from any Australian bank account'],
  ARRAY['Steepest rate cliff in the field: falls to 4.00% p.a. after 4 months, the lowest ongoing rate here','Introductory rate is one-time-only, for new customers'' first account'],
  '{"fees":9.6,"features":8.0,"ux":7.6,"support":7.6}'::jsonb,
  'The pick for disciplined rate-hoppers chasing the single highest number for a fixed window.',
  true, true,
  '{"max_rate_pct":5.90,"base_rate_pct":4.00,"rate_type":"intro","rate_conditions":"5.90% p.a. for the first 4 months, new personal customers only (first account), on balances up to A$250,000; no monthly conditions; reverts to the 4.00% p.a. Standard Variable Rate after 4 months.","intro_period_months":4,"max_balance_for_rate":250000,"min_deposit":0,"linked_account_required":false,"adi_fcs":true,"fcs_shared_licence_note":"Rabobank Australia Ltd is its own APRA-licensed ADI, separate from its Dutch parent.","app_rating":null,"app_rating_note":"No independently verified consumer-app rating found at research time"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.rabobank.com.au/high-interest-savings-account', false, 'Rate-hoppers chasing the peak number', 3,
  'https://www.rabobank.com.au/rates/personal-rates', DATE '2026-07-10', true
),
(
  NULL, 'ing-savings-maximiser', 'au', 'savings', 'savings-accounts', 'ING Savings Maximiser', 'The highest ongoing rate for disciplined monthly savers',
  8.4, 3.2, 8400, 8400, 0,
  '[]'::jsonb,
  ARRAY['5.50% p.a. ongoing, no intro cliff','Large customer base, established brand','$0 fees']::text[],
  ARRAY['5.50% p.a. — the highest ONGOING (non-introductory) rate in our comparison','Bonus applies indefinitely, no introductory cliff to worry about','$0 fees and a large, established customer base'],
  ARRAY['Strictest conditions in the field: 4 requirements including a mandatory balance-growth rule','Lowest rate cap (A$100,000) and a near-zero 0.01% base rate if you miss a condition'],
  '{"fees":9.2,"features":7.4,"ux":7.8,"support":7.6}'::jsonb,
  'A strong ongoing rate for savers who reliably meet all four monthly conditions.',
  true, true,
  '{"max_rate_pct":5.50,"base_rate_pct":0.01,"rate_type":"conditional","rate_conditions":"Requires a linked ING Orange Everyday account, at least A$1,000 in external deposits per month, 5+ settled card purchases per month, AND the total balance must grow each month (excluding interest).","intro_period_months":null,"max_balance_for_rate":100000,"min_deposit":0,"linked_account_required":true,"adi_fcs":true,"fcs_shared_licence_note":"ING Bank (Australia) Ltd is its own APRA-licensed ADI.","app_rating":3.2,"app_rating_note":"Apple App Store AU, ~8,400 ratings"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.ing.com.au/banking/savings/savings-maximiser.html', false, 'Disciplined monthly savers', 4,
  'https://www.ing.com.au/rates-and-fees/savings-interest-rates.html', DATE '2026-07-10', true
),
(
  NULL, 'macquarie-savings', 'au', 'savings', 'savings-accounts', 'Macquarie Bank Savings Account', 'A high, fully unconditional ongoing rate up to $2 million',
  8.8, 3.8, 928, 928, 0,
  '[]'::jsonb,
  ARRAY['5.00% p.a. ongoing, no conditions','Cap up to A$2 million','$0 fees incl. transaction account']::text[],
  ARRAY['5.00% p.a. ongoing rate with zero behavioural conditions — the highest no-strings ongoing rate from a full bank','Very high balance cap (A$2 million) versus most competitors'' $100k-$250k caps','Completely fee-free, including the linked transaction account'],
  ARRAY['Welcome rate boost lasts only 4 months and only on the first account','Banking app rated only middling (3.8) in the Australian App Store'],
  '{"fees":9.4,"features":8.4,"ux":7.6,"support":7.8}'::jsonb,
  'Best for larger balances that want a high, truly unconditional rate.',
  true, true,
  '{"max_rate_pct":5.35,"base_rate_pct":5.00,"rate_type":"intro","rate_conditions":"5.35% Welcome Rate for the first 4 months, first savings account only, on balances up to A$250,000; reverts to an unconditional 5.00% p.a. (no deposit, transaction or growth requirements) on balances up to A$2,000,000; 2.75% above that.","intro_period_months":4,"max_balance_for_rate":2000000,"min_deposit":0,"linked_account_required":true,"adi_fcs":true,"fcs_shared_licence_note":"Macquarie Bank Limited is its own APRA-licensed ADI.","app_rating":3.8,"app_rating_note":"Apple App Store AU, 928 ratings"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.macquarie.com.au/everyday-banking/savings-account.html', false, 'Larger, no-condition balances', 5,
  'https://www.macquarie.com.au/everyday-banking/savings-account.html', DATE '2026-07-10', true
),
(
  NULL, 'ubank-save', 'au', 'savings', 'savings-accounts', 'Ubank Save', 'The mildest bonus condition in the market, with the top-rated banking app',
  8.7, 4.7, 51000, 51000, 0,
  '[]'::jsonb,
  ARRAY['5.85% p.a. welcome, 5.10% ongoing','Easiest bonus condition: grow by just A$1','4.7★ app, 51,000+ ratings']::text[],
  ARRAY['Easiest bonus condition in the market — grow your Save balance by just A$1/month','Highest-rated banking app in this comparison (4.7★, 51,000+ ratings)','Bonus rate cap of A$1 million, the highest in the field'],
  ARRAY['Base rate is 0.00% — missing the A$1 growth condition means an entire month with no interest at all','5.85% welcome rate lasts only 4 months, then drops to the ongoing 5.10%'],
  '{"fees":9.0,"features":8.2,"ux":9.2,"support":8.4}'::jsonb,
  'The pick for app-first savers who want the lowest possible bar to clear each month.',
  true, true,
  '{"max_rate_pct":5.85,"base_rate_pct":0.00,"rate_type":"conditional","rate_conditions":"Requires a Ubank Spend account and the total Save balance to grow by at least A$1 per month (excluding interest); 5.85% Welcome Rate for new customers'' first 4 months, then 5.10% ongoing bonus rate continues indefinitely if the condition is met.","intro_period_months":4,"max_balance_for_rate":1000000,"min_deposit":0,"linked_account_required":true,"adi_fcs":true,"fcs_shared_licence_note":"Ubank is a brand of National Australia Bank (NAB) — FCS protection (A$250,000) is shared across Ubank and NAB-branded accounts held by the same customer.","app_rating":4.7,"app_rating_note":"Apple App Store AU, ~51,000 ratings"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.ubank.com.au/banking/savings-account', false, 'App-first savers wanting the lowest bar', 6,
  'https://www.ubank.com.au/banking/savings-account/bonus-interest', DATE '2026-07-10', true
),
(
  NULL, 'judo-personal-savings', 'au', 'savings', 'savings-accounts', 'Judo Bank Personal Savings Account', 'One simple condition: deposit A$300 a month',
  8.0, 4.7, 314, 314, 0,
  '[]'::jsonb,
  ARRAY['5.35% p.a., one simple condition','No bank-switching required','No intro cliff']::text[],
  ARRAY['Only condition is a A$300/month deposit — no balance-growth rule, no card-spend rule, withdrawals don''t affect eligibility','No need to switch your everyday bank — link any external Australian account','Bonus rate applies indefinitely, no introductory cliff'],
  ARRAY['Base rate falls to just 0.05% p.a. if the A$300 monthly deposit is missed','Young challenger bank with a smaller, less-tested app rating base (314 ratings)'],
  '{"fees":9.2,"features":7.6,"ux":8.6,"support":8.2}'::jsonb,
  'Best for savers who want to keep their existing bank and meet one easy deposit rule.',
  true, true,
  '{"max_rate_pct":5.35,"base_rate_pct":0.05,"rate_type":"conditional","rate_conditions":"Deposit at least A$300 per calendar month into the savings account (withdrawals do not affect eligibility); applies to balances up to A$250,000 (lower tiered rate up to 4.85% above that).","intro_period_months":null,"max_balance_for_rate":250000,"min_deposit":0,"linked_account_required":false,"adi_fcs":true,"fcs_shared_licence_note":"Judo Bank Pty Ltd is its own APRA-licensed ADI (full banking licence since 2019).","app_rating":4.7,"app_rating_note":"Apple App Store AU, 314 ratings (small sample); Google Play 4.6"}'::jsonb,
  'official', 'high',
  false, NULL, 'https://www.judo.bank/savings-accounts/personal-savings-account/', false, 'Keeping your existing everyday bank', 7,
  'https://www.judo.bank/savings-accounts/personal-savings-account/', DATE '2026-07-10', true
)
ON CONFLICT (market, category, topic, slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  tagline = EXCLUDED.tagline,
  score = EXCLUDED.score,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  clicks = EXCLUDED.clicks,
  monthly_fee = EXCLUDED.monthly_fee,
  badges = EXCLUDED.badges,
  chips = EXCLUDED.chips,
  pros = EXCLUDED.pros,
  cons = EXCLUDED.cons,
  sub_scores = EXCLUDED.sub_scores,
  verdict = EXCLUDED.verdict,
  has_no_monthly_fee = EXCLUDED.has_no_monthly_fee,
  has_interest = EXCLUDED.has_interest,
  attributes = EXCLUDED.attributes,
  source_type = EXCLUDED.source_type,
  confidence = EXCLUDED.confidence,
  is_affiliate = EXCLUDED.is_affiliate,
  review_slug = EXCLUDED.review_slug,
  external_url = EXCLUDED.external_url,
  is_top_pick = EXCLUDED.is_top_pick,
  best_for = EXCLUDED.best_for,
  display_order = EXCLUDED.display_order,
  source_url = EXCLUDED.source_url,
  data_verified_at = EXCLUDED.data_verified_at,
  active = EXCLUDED.active;
