-- Slice 10 — Best High-Yield Savings Accounts (US, personal-finance)
-- Route: /us/personal-finance/best/high-yield-savings
-- 8 candidates; all FDIC-insured; all $0 monthly fees; no active affiliate tracking links.
--
-- APY figures verified July 2–5, 2026 via official bank websites and NerdWallet / Bankrate.
-- Federal Funds Rate target: 3.50–3.75% (unchanged, June 2026 FOMC).
--
-- Discover Bank excluded: Capital One merger completed May 2025 — new accounts halted.
-- Affiliate status: SoFi and Ally have confirmed programs but no savings-specific
-- affiliate_links row exists in prod. is_affiliate = false for all rows.
--
-- Idempotent: ON CONFLICT (market, category, topic, slug) DO UPDATE

INSERT INTO product_attributes (
  affiliate_link_id,
  slug, market, category, topic,
  display_name, tagline,
  score, rating, review_count, clicks,
  management_fee, account_minimum, monthly_fee,
  attributes,
  source_type, confidence,
  badges, chips, pros, cons, sub_scores,
  verdict, deep_dive,
  is_affiliate, review_slug, external_url,
  is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
)
VALUES

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. SoFi Bank — Best overall (direct-deposit members)
-- ──────────────────────────────────────────────────────────────────────────────
(
  NULL,
  'sofi', 'us', 'personal-finance', 'high-yield-savings',
  'SoFi Bank',
  'Highest APY for direct-deposit members — debit card + up to $2M FDIC',
  8.8, 4.1, 10517, 0,
  0, 0, 0,
  '{
    "apy": 3.10,
    "apy_note": "3.10% APY requires a qualifying direct deposit (any recurring ACH payroll, Social Security or pension — no minimum amount). SoFi Plus ($10/month) raises this to 4.50% APY on the first $20,000; base rate without direct deposit or Plus is 1.20%. Rates verified July 3, 2026.",
    "apy_type": "conditional",
    "min_balance_for_apy": 0,
    "min_opening_deposit": 0,
    "atm_access": true,
    "atm_note": "Visa debit card included. 55,000+ fee-free ATMs via Allpoint network.",
    "max_fdic_coverage": 2000000,
    "fdic_note": "Deposits swept across up to 32 FDIC-member partner banks — up to $2,000,000 per depositor.",
    "review_score": 4.1,
    "review_count": 10517,
    "review_source": "Trustpilot",
    "review_note": "Trustpilot score is representative of the banking product; SoFi does not operate a separate high-complaint credit card portfolio.",
    "bbb_rating": "A+",
    "bbb_complaints_3yr": 2317,
    "app_store_rating_ios": 4.8,
    "regulatory_history_note": "December 2025 data breach (38,049 individuals). Class-action lawsuit filed February 2026. Breach contained; affected customers notified by SoFi.",
    "affiliate_status_note": "Confirmed affiliate program via FlexOffers and Impact ($80-$150 per funded account). No active savings-specific affiliate_links row in SmartFinPro prod DB as of July 2026."
  }'::jsonb,
  'official', 'high',
  '[{"type":"gold","label":"Top pick"}]'::jsonb,
  ARRAY['3.10% APY with direct deposit', '55k Allpoint ATMs — debit card included', 'Up to $2M FDIC via sweep'],
  ARRAY[
    '3.10% APY (4.50% with $10/mo Plus) — highest tier available',
    '55,000+ fee-free ATMs, Visa debit card included',
    'Up to $2M FDIC via 32 partner bank sweep',
    '4.1/5 Trustpilot from 10,500+ reviews — best consumer score here'
  ],
  ARRAY[
    '1.20% base rate without direct deposit or Plus — drops sharply',
    '$10/month SoFi Plus ($120/year) — only worthwhile above ~$5,700 balance',
    'December 2025 data breach (38k accounts) — class action filed Feb 2026'
  ],
  '{"cost": 8.5, "features": 9.2, "ux": 8.6, "support": 7.6}'::jsonb,
  'The full-service choice — 3.10% APY with direct deposit, debit card, 55k ATMs, and up to $2M FDIC. Best overall for members who receive payroll.',
  'SoFi combines a high-yield savings account with a checking account in one product. The 3.10% APY requires a qualifying direct deposit (any recurring ACH payroll, Social Security or pension — no minimum amount). SoFi Plus ($10/month) raises this to 4.50% APY on the first $20,000; on balances above $20k it reverts to 3.10%. At a 4.50% rate the $120/year subscription pays for itself once your balance exceeds approximately $5,700. SoFi deposits are swept across up to 32 partner banks, providing FDIC coverage of up to $2,000,000 per depositor. A Visa debit card with access to 55,000+ Allpoint ATMs is included. Note: a class-action lawsuit was filed in February 2026 following a December 2025 data breach affecting 38,049 individuals; the breach has been contained and SoFi has notified affected customers.',
  false, NULL, 'https://www.sofi.com/banking/high-yield-savings-account/',
  true, 'Direct-deposit members who want the highest APY + ATM access', 1,
  'https://www.sofi.com/banking/high-yield-savings-account/', '2026-07-03', true
),

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. CIT Bank Platinum Savings — Highest unconditional APY ($5k+ balance)
-- ──────────────────────────────────────────────────────────────────────────────
(
  NULL,
  'cit-bank', 'us', 'personal-finance', 'high-yield-savings',
  'CIT Bank Platinum Savings',
  'Highest unconditional APY on balances of $5,000 or more',
  8.2, 0, 0, 0,
  0, 100, 0,
  '{
    "apy": 4.10,
    "apy_note": "4.10% promotional APY through August 31, 2026 (promo code CITBOOST). Standard rate reverts to 3.75% APY for balances of $5,000 or more; 0.25% APY for balances below $5,000. $100 minimum to open. Rates verified July 2, 2026.",
    "apy_type": "tiered",
    "min_balance_for_apy": 5000,
    "min_opening_deposit": 100,
    "atm_access": false,
    "atm_note": "No debit card, no ATM access. Funds move via ACH or wire transfer only.",
    "max_fdic_coverage": 250000,
    "fdic_note": "Standard FDIC coverage $250,000 per depositor. CIT Bank is a subsidiary of First Citizens Bank.",
    "review_score": 0,
    "review_count": 0,
    "review_source": "Not available",
    "review_note": "No significant Trustpilot or App Store consumer rating found for CIT Bank savings product.",
    "bbb_rating": "Not accredited",
    "regulatory_history_note": "No regulatory actions specific to CIT Bank savings product found. First Citizens BancShares acquired CIT Group in January 2022.",
    "affiliate_status_note": "No confirmed affiliate program for CIT Bank Platinum Savings as of July 2026."
  }'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['4.10% promo APY through Aug 2026', '$5,000 minimum for competitive rate', '$0 monthly fee'],
  ARRAY[
    '4.10% promo APY (3.75% standard on $5k+) — highest unconditional rate here',
    'First Citizens Bank subsidiary — established institutional backing',
    '$0 monthly fee'
  ],
  ARRAY[
    '$5,000 minimum balance for competitive APY — earns 0.25% below that',
    '$100 minimum to open — the only opening minimum in this comparison',
    'No ATM card — electronic transfers only'
  ],
  '{"cost": 9.0, "features": 6.8, "ux": 7.0, "support": 7.0}'::jsonb,
  'Highest available APY for balances above $5,000 — 4.10% promo through August 2026 (3.75% standard). Requires $100 to open and $5,000 to earn the competitive rate.',
  'CIT Bank Platinum Savings is a First Citizens Bank subsidiary (CIT Group acquired 2022). The 4.10% promotional APY is valid through August 31, 2026 using code CITBOOST; the standard rate is 3.75% for balances of $5,000 or more and 0.25% for balances below $5,000. There is no debit card and no ATM access — funds move via ACH or wire transfer only. No monthly fees. A $100 opening deposit is required. No affiliate program exists for this product.',
  false, NULL, 'https://www.cit.com/cit-bank/bank/savings/platinum-savings-account',
  false, 'Savers with $5,000+ who want the highest APY without daily conditions', 2,
  'https://www.cit.com/cit-bank/bank/savings/platinum-savings-account', '2026-07-02', true
),

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Barclays Tiered Savings — Best no-conditions APY (promo through July 31)
-- ──────────────────────────────────────────────────────────────────────────────
(
  NULL,
  'barclays', 'us', 'personal-finance', 'high-yield-savings',
  'Barclays Tiered Savings',
  '3.65% APY on any balance — no conditions, no minimum (promo through July 31)',
  7.8, 4.8, 0, 0,
  0, 0, 0,
  '{
    "apy": 3.65,
    "apy_note": "3.65% APY on balances under $250,000; 3.75% APY on balances of $250,000 or more. Promotional rate valid through July 31, 2026 — post-promotion rate not yet announced. AARP members can access the Barclays Select Savings account at 4.00% APY (members only). No conditions on the headline rate. Rates verified July 2, 2026.",
    "apy_type": "tiered",
    "min_balance_for_apy": 0,
    "min_opening_deposit": 0,
    "atm_access": false,
    "atm_note": "No debit card, no ATM access. Funds move via ACH (1–5 business days). Documents may require mail or fax.",
    "max_fdic_coverage": 250000,
    "fdic_note": "Standard FDIC coverage $250,000 per depositor. Barclays US Savings is a subsidiary of Barclays Bank PLC (UK), operating as an FDIC-insured institution.",
    "review_score": 4.8,
    "review_count": 0,
    "review_source": "App Store (iOS)",
    "review_note": "Trustpilot profile (1.3/5) is dominated by Barclaycard (credit card) complaints. iOS App Store rating of 4.8/5 is more representative of the savings product experience.",
    "bbb_rating": "A+",
    "regulatory_history_note": "No regulatory actions specific to Barclays US Savings found. Barclaycard US has historical CFPB settlements unrelated to savings products.",
    "affiliate_status_note": "No confirmed affiliate program for Barclays US Tiered Savings as of July 2026."
  }'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['3.65% APY — no conditions, no minimum', 'AARP members: 4.00% Select Savings', 'Promo expires July 31, 2026'],
  ARRAY[
    '3.65% APY on all balances — zero conditions or minimums',
    'AARP Select Savings: 4.00% APY for members — best guaranteed no-condition rate',
    '$0 to open, $0 monthly fee, 4.8/5 App Store'
  ],
  ARRAY[
    'Promo rates expire July 31, 2026 — post-promo rate unknown',
    'No debit card, no ATM — electronic transfers only',
    '5-business-day transfer delays commonly reported'
  ],
  '{"cost": 8.2, "features": 7.0, "ux": 8.2, "support": 6.8}'::jsonb,
  'Clean 3.65% APY with no conditions — promotional rate expires July 31, 2026. AARP members get 4.00% via Select Savings.',
  'Barclays US Tiered Savings pays 3.65% APY on balances under $250,000 and 3.75% on balances above. The promotional rate runs through July 31, 2026 — the post-promotion rate has not been publicly announced. AARP members can access the Barclays Select Savings account at 4.00% APY. No debit card, no ATM access. Funds move via ACH in 1–5 business days; some users report delays at the upper end of that range. The iOS app is rated 4.8/5. Barclays US Savings is a subsidiary of Barclays Bank PLC (UK), operating as an FDIC-insured institution. The Trustpilot profile is dominated by Barclaycard (credit card) complaints, not savings customers.',
  false, NULL, 'https://banking.us.barclays/tiered-savings.html',
  false, 'Savers who want competitive APY with zero conditions or minimums', 3,
  'https://banking.us.barclays/tiered-savings.html', '2026-07-02', true
),

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Marcus by Goldman Sachs — 3.40% no conditions, Goldman Sachs brand
-- ──────────────────────────────────────────────────────────────────────────────
(
  NULL,
  'marcus', 'us', 'personal-finance', 'high-yield-savings',
  'Marcus by Goldman Sachs',
  '3.40% APY with zero conditions — Goldman Sachs institutional backing',
  7.6, 1.2, 0, 0,
  0, 0, 0,
  '{
    "apy": 3.40,
    "apy_note": "3.40% APY with no conditions, no balance requirements, and no monthly fees. No referral boost or direct deposit requirement. Rate verified July 2, 2026.",
    "apy_type": "standard",
    "min_balance_for_apy": 0,
    "min_opening_deposit": 0,
    "atm_access": false,
    "atm_note": "No debit card, no ATM access. Savings and CDs only — no checking account. Funds move via ACH.",
    "max_fdic_coverage": 250000,
    "fdic_note": "Standard FDIC coverage $250,000 per depositor. Marcus is a division of Goldman Sachs Bank USA, Member FDIC.",
    "review_score": 1.2,
    "review_count": 0,
    "review_source": "Trustpilot",
    "review_note": "Trustpilot reviews are dominated by Apple Card and Marcus loan account closure complaints. No independent Trustpilot sample specific to high-yield savings.",
    "bbb_rating": "A+ (accredited)",
    "regulatory_history_note": "Goldman Sachs consumer banking received a Federal Reserve consent order in 2022 related to credit card risk management practices. No separate regulatory action for Marcus savings.",
    "affiliate_status_note": "No affiliate program. Marcus offers APY boosts (up to +0.10%) for referred friends via the Marcus app — referrals are user-to-user only, not through publisher networks."
  }'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['3.40% APY — no conditions anywhere', 'Goldman Sachs backing', '$0 fees, $0 minimum balance'],
  ARRAY[
    '3.40% APY with zero conditions or minimums',
    'Goldman Sachs brand — institutional-grade backing',
    '$0 fees everywhere — no penalties, no withdrawal limits'
  ],
  ARRAY[
    'No ATM card — savings and CDs only, no checking',
    '1.2/5 Trustpilot — recurring account closure and fund access delay complaints',
    'No affiliate program — referral-only APY boosts, no publisher tracking'
  ],
  '{"cost": 7.8, "features": 6.8, "ux": 7.0, "support": 6.4}'::jsonb,
  '3.40% APY with no conditions or fees — backed by Goldman Sachs. The cleanest simple-savings option for those who do not need ATM access.',
  'Marcus by Goldman Sachs offers a straightforward high-yield savings account with no monthly fees, no minimum balance, and no conditions on the 3.40% APY. The account is savings-and-CDs only — there is no checking account, no debit card, and no ATM access. Fund transfers happen via ACH. Marcus does not have a publisher affiliate program; APY boosts are offered through the Marcus app for user referrals only. A Federal Reserve consent order (2022, credit card practices) applies to Goldman Sachs consumer banking broadly; Marcus savings has not been the subject of separate regulatory action. Trustpilot reviews are 1.2/5 but dominated by Apple Card and loan account closure complaints — not savings-specific.',
  false, NULL, 'https://www.marcus.com/us/en/savings/high-yield-savings',
  false, 'Brand-conscious savers who want simple, no-conditions savings', 4,
  'https://www.marcus.com/us/en/savings/high-yield-savings', '2026-07-02', true
),

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Synchrony Bank — Only account with an optional ATM card
-- ──────────────────────────────────────────────────────────────────────────────
(
  NULL,
  'synchrony', 'us', 'personal-finance', 'high-yield-savings',
  'Synchrony Bank High Yield Savings',
  '3.30% APY on any balance — optional ATM card available, daily compounding',
  7.4, 4.8, 0, 0,
  0, 0, 0,
  '{
    "apy": 3.30,
    "apy_note": "3.30% APY on all balances with no minimum balance and no conditions. Daily compounding. Rate verified July 2, 2026.",
    "apy_type": "standard",
    "min_balance_for_apy": 0,
    "min_opening_deposit": 0,
    "atm_access": true,
    "atm_note": "Optional ATM card available on request. ATM fee reimbursement: up to $5 per statement cycle. No checking account — this is a savings-only account with an ATM card option.",
    "max_fdic_coverage": 250000,
    "fdic_note": "Standard FDIC coverage $250,000 per depositor. Synchrony Bank, Member FDIC.",
    "review_score": 4.8,
    "review_count": 0,
    "review_source": "App Store (iOS)",
    "review_note": "Trustpilot 1.1/5 is dominated by Synchrony credit card complaints (Amazon, PayPal, Sam''s Club cards). iOS App Store 4.8/5 is more representative of the savings product.",
    "bbb_rating": "A+ (accredited)",
    "bbb_complaints_3yr": 7500,
    "app_store_rating_ios": 4.8,
    "regulatory_history_note": "CFPB consent order (2023) related to credit card practices was terminated May 12, 2025. No separate regulatory action for savings products.",
    "affiliate_status_note": "No affiliate program for Synchrony Bank savings product as of July 2026."
  }'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['3.30% APY — no conditions or minimums', 'Optional ATM card ($5/mo reimbursement)', 'Daily compounding'],
  ARRAY[
    '3.30% APY on any balance — no conditions or minimums',
    'Optional ATM card issued — unique among pure savings accounts here',
    'Daily compounding — maximizes earned interest'
  ],
  ARRAY[
    '1.1/5 Trustpilot — dominated by credit card complaints, not savings-specific',
    '$5/month ATM reimbursement cap — limited coverage',
    'No checking account option'
  ],
  '{"cost": 7.6, "features": 7.6, "ux": 8.4, "support": 7.0}'::jsonb,
  '3.30% APY on any balance with daily compounding. The only account in this comparison with an optional ATM card on a pure savings product.',
  'Synchrony Bank offers 3.30% APY on all savings balances with daily compounding and no minimum balance. An optional ATM card is available — with $5 per statement cycle in ATM fee reimbursements. No checking account is offered; this is a pure savings vault with an ATM option. The iOS app is rated 4.8/5. A 2023 CFPB consent order (credit card practices) was terminated in May 2025. No affiliate program exists for the savings product.',
  false, NULL, 'https://www.synchronybank.com/banking/high-yield-savings-account/',
  false, 'Savers who want an optional ATM card on their savings account', 5,
  'https://www.synchronybank.com/banking/high-yield-savings-account/', '2026-07-02', true
),

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. American Express National Bank — 3.10% no conditions, 24/7 U.S. service
-- ──────────────────────────────────────────────────────────────────────────────
(
  NULL,
  'american-express', 'us', 'personal-finance', 'high-yield-savings',
  'American Express High Yield Savings',
  '3.10% APY with zero conditions — 24/7 U.S.-based customer service',
  7.2, 4.8, 0, 0,
  0, 0, 0,
  '{
    "apy": 3.10,
    "apy_note": "3.10% APY with no conditions, no balance minimums, and no monthly fees. Interest compounds daily and posts monthly. Rate verified July 3, 2026.",
    "apy_type": "standard",
    "min_balance_for_apy": 0,
    "min_opening_deposit": 0,
    "atm_access": false,
    "atm_note": "No debit card, no ATM access. Electronic transfers only via ACH. Account is savings-only — no checking.",
    "max_fdic_coverage": 250000,
    "fdic_note": "Standard FDIC coverage $250,000 per depositor. American Express National Bank, Member FDIC.",
    "review_score": 4.8,
    "review_count": 0,
    "review_source": "App Store (iOS)",
    "review_note": "Trustpilot 1.3/5 is dominated by American Express credit card complaints. iOS App Store 4.8+/5 reflects the integrated Amex app used by savings customers.",
    "bbb_rating": "A+ (accredited)",
    "app_store_rating_ios": 4.8,
    "regulatory_history_note": "No regulatory actions specific to American Express National Bank savings products found.",
    "affiliate_status_note": "No affiliate program for American Express High Yield Savings as of July 2026."
  }'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['3.10% APY — zero conditions or minimums', '24/7 U.S.-based customer service', 'Amex brand trust, 4.8/5 App Store'],
  ARRAY[
    '3.10% APY with zero conditions or minimums',
    '24/7 U.S.-based customer service — available around the clock',
    'American Express brand — strong institutional trust'
  ],
  ARRAY[
    'No debit card, no ATM — electronic transfers only',
    '1.3/5 Trustpilot — skewed by credit card complaints, not savings-specific',
    'No checking account — pure savings vault'
  ],
  '{"cost": 7.4, "features": 7.2, "ux": 8.4, "support": 8.4}'::jsonb,
  '3.10% APY with no conditions — backed by American Express. 24/7 U.S.-based customer service sets it apart from most online-only savings accounts.',
  'American Express National Bank offers a high-yield savings account with 3.10% APY, no monthly fees, and no minimum balance. Interest compounds daily and posts monthly. There is no debit card and no ATM access — the account is electronic-only. Customer service is available 24/7 via phone with U.S.-based representatives, which is unusual in this category. The account integrates with the American Express app (rated 4.8+/5 iOS). No affiliate program exists for this product. Trustpilot reviews (1.3/5) are dominated by credit card complaints, not savings customers.',
  false, NULL, 'https://www.americanexpress.com/en-us/banking/online-savings/',
  false, 'Amex cardholders who want simple savings with excellent customer service', 6,
  'https://www.americanexpress.com/en-us/banking/online-savings/', '2026-07-03', true
),

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. Ally Bank — 3.00% APY, savings buckets, strong mobile app
-- ──────────────────────────────────────────────────────────────────────────────
(
  NULL,
  'ally', 'us', 'personal-finance', 'high-yield-savings',
  'Ally Bank Online Savings',
  '3.00% APY with no fees — savings buckets and goal tracking built in',
  7.0, 4.7, 0, 0,
  0, 0, 0,
  '{
    "apy": 3.00,
    "apy_note": "3.00% APY on all balances with no minimum balance and no conditions. No monthly fees or penalties. Rate verified July 3, 2026.",
    "apy_type": "standard",
    "min_balance_for_apy": 0,
    "min_opening_deposit": 0,
    "atm_access": false,
    "atm_note": "No ATM card on standalone savings account. Ally checking account holders can access 43,000+ Allpoint ATMs. Savings-only customers cannot access funds at ATMs.",
    "max_fdic_coverage": 250000,
    "fdic_note": "Standard FDIC coverage $250,000 per depositor. Ally Bank, Member FDIC.",
    "review_score": 4.7,
    "review_count": 0,
    "review_source": "App Store (iOS)",
    "review_note": "Trustpilot 1.6–1.8/5 reflects broad banking complaints including ACH delays and customer service wait times. iOS App Store 4.7/5 is more representative of the savings product UX.",
    "bbb_rating": "A (not accredited)",
    "app_store_rating_ios": 4.7,
    "regulatory_history_note": "No significant regulatory actions specific to Ally savings products. Ally Financial (parent) is a publicly traded bank holding company regulated by the Federal Reserve.",
    "affiliate_status_note": "Confirmed affiliate program via CJ Affiliate and FlexOffers. No active savings-specific affiliate_links row in SmartFinPro prod DB as of July 2026."
  }'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['3.00% APY — no fees, no minimums', 'Savings buckets for goal tracking', '4.7/5 App Store iOS'],
  ARRAY[
    '3.00% APY with zero fees or minimums',
    'Savings buckets for goal tracking — built-in financial planning tool',
    'Strong mobile app: 4.7/5 iOS, 4.3/5 Android'
  ],
  ARRAY[
    'No ATM card on savings-only account — need companion checking for ATM access',
    '1.7/5 Trustpilot — customer service wait times and ACH delay complaints',
    '3.00% APY — mid-range in this comparison'
  ],
  '{"cost": 7.2, "features": 8.0, "ux": 8.6, "support": 7.4}'::jsonb,
  '3.00% APY with no fees or minimums. Savings buckets and round-up tools make Ally the best choice for goal-oriented savers.',
  'Ally Bank Online Savings Account pays 3.00% APY on all balances with no minimum balance, no monthly fees, and no conditions. The standout feature is savings buckets — virtual envelopes that let you earmark portions of your savings for specific goals (emergency fund, vacation, down payment). Ally also offers automatic round-ups from checking to savings. There is no ATM card on a standalone savings account; ATM access requires an Ally checking account. The iOS app is rated 4.7/5. Ally has confirmed affiliate programs via CJ Affiliate and FlexOffers, but no savings-specific tracking link exists in the SmartFinPro affiliate_links table as of July 2026.',
  false, NULL, 'https://www.ally.com/bank/online-savings-account/',
  false, 'Goal-oriented savers who want savings buckets and planning tools', 7,
  'https://www.ally.com/bank/online-savings-account/', '2026-07-03', true
),

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. Capital One 360 — Best app (4.9/5), 70k+ ATMs, but APY dropped to 3.00%
-- ──────────────────────────────────────────────────────────────────────────────
(
  NULL,
  'capital-one', 'us', 'personal-finance', 'high-yield-savings',
  'Capital One 360 Performance Savings',
  '70,000+ fee-free ATMs and the best mobile app — APY dropped to 3.00% in July 2026',
  6.8, 4.9, 0, 0,
  0, 0, 0,
  '{
    "apy": 3.00,
    "apy_note": "3.00% APY on all balances with no conditions or minimum balance. Rate dropped from approximately 4.00% to 3.00% in early July 2026. Rate verified July 2, 2026 via official Capital One site.",
    "apy_type": "standard",
    "min_balance_for_apy": 0,
    "min_opening_deposit": 0,
    "atm_access": true,
    "atm_note": "70,000+ fee-free ATMs via Allpoint and MoneyPass networks. Savings account includes debit card access. Physical Capital One Cafe branches in select markets.",
    "max_fdic_coverage": 250000,
    "fdic_note": "FDIC alert: Capital One completed the acquisition of Discover Bank in May 2025. Accounts at both Capital One and Discover opened after May 18, 2025 are now treated as deposits at the same FDIC institution — combined coverage is capped at $250,000 total, not $250,000 per bank.",
    "review_score": 4.9,
    "review_count": 0,
    "review_source": "App Store (iOS)",
    "review_note": "Trustpilot 1.2/5 is dominated by credit card complaints. App Store 4.9/5 iOS is the highest app rating in this comparison and reflects the banking product experience.",
    "bbb_rating": "A+ (accredited)",
    "app_store_rating_ios": 4.9,
    "regulatory_history_note": "Capital One entered a consent order with the OCC in 2023 (AML deficiencies) — unrelated to savings products. DOJ settlement (2024) over anti-competitive practices in credit cards is unrelated to savings.",
    "affiliate_status_note": "No affiliate program for Capital One 360 Performance Savings as of July 2026."
  }'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['70k+ fee-free ATMs — best network here', '4.9/5 App Store — top mobile app', '3.00% APY — dropped from ~4.00% in July 2026'],
  ARRAY[
    '70,000+ fee-free ATMs via Allpoint and MoneyPass — most ATM access here',
    '4.9/5 App Store — best mobile banking app in this comparison',
    'Physical Capital One Cafe branches in select markets — rare for HYSA'
  ],
  ARRAY[
    'APY dropped from ~4.00% to 3.00% in July 2026 — significant rate cut',
    'Post-merger FDIC alert: Capital One + Discover accounts now share the $250k limit',
    'No affiliate program — editorial coverage only'
  ],
  '{"cost": 7.0, "features": 8.4, "ux": 9.2, "support": 7.2}'::jsonb,
  'Best mobile app (4.9/5 App Store) and 70k+ ATM access — but Capital One cut its APY from ~4.00% to 3.00% in July 2026. Worth considering if ATM access and app quality are your priorities.',
  'Capital One 360 Performance Savings offers 3.00% APY on all balances with no minimum balance, no conditions, and no monthly fees. The standout strengths are its 70,000+ fee-free ATMs (Allpoint and MoneyPass), the highest-rated mobile app in this comparison (4.9/5 iOS), and physical Capital One Cafe branches in select markets. However, Capital One cut its APY from approximately 4.00% to 3.00% in early July 2026 — a significant drop that moves it from a top-tier rate to mid-range. Additionally, since Capital One completed its acquisition of Discover in May 2025, accounts at both institutions opened after May 18, 2025 share a combined FDIC limit of $250,000 — not $250,000 at each bank. No affiliate program exists for this product.',
  false, NULL, 'https://www.capitalone.com/bank/savings-accounts/high-yield-performance-savings/',
  false, 'Savers who want the best mobile app and widest ATM access', 8,
  'https://www.capitalone.com/bank/savings-accounts/high-yield-performance-savings/', '2026-07-02', true
)

ON CONFLICT (market, category, topic, slug) DO UPDATE SET
  display_name        = EXCLUDED.display_name,
  tagline             = EXCLUDED.tagline,
  score               = EXCLUDED.score,
  rating              = EXCLUDED.rating,
  review_count        = EXCLUDED.review_count,
  management_fee      = EXCLUDED.management_fee,
  account_minimum     = EXCLUDED.account_minimum,
  monthly_fee         = EXCLUDED.monthly_fee,
  attributes          = EXCLUDED.attributes,
  source_type         = EXCLUDED.source_type,
  confidence          = EXCLUDED.confidence,
  badges              = EXCLUDED.badges,
  chips               = EXCLUDED.chips,
  pros                = EXCLUDED.pros,
  cons                = EXCLUDED.cons,
  sub_scores          = EXCLUDED.sub_scores,
  verdict             = EXCLUDED.verdict,
  deep_dive           = EXCLUDED.deep_dive,
  is_affiliate        = EXCLUDED.is_affiliate,
  review_slug         = EXCLUDED.review_slug,
  external_url        = EXCLUDED.external_url,
  is_top_pick         = EXCLUDED.is_top_pick,
  best_for            = EXCLUDED.best_for,
  display_order       = EXCLUDED.display_order,
  source_url          = EXCLUDED.source_url,
  data_verified_at    = EXCLUDED.data_verified_at,
  active              = EXCLUDED.active;
