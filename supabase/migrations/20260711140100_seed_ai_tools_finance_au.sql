-- Comparison Cockpit — seed AU AI tools for finance (market='au', topic='ai-tools-finance').
-- Visit-only launch (AU/CA/UK rollout, Stage 1 Slice AU-3): affiliate_link_id NULL,
-- is_affiliate=false, review_slug NULL, external_url = provider homepage.
-- Idempotent (ON CONFLICT DO UPDATE). Attributes validated against
-- auAiToolsFinanceAttributesSchema. Airwallex uses the confirmed-live
-- "Expense Policy Agent" (not the unconfirmed-for-AU "T:0" private beta) and
-- discloses an active AUSTRAC AML/CTF audit order. Frollo's rating is 0/0
-- ("Not yet rated") because Google Play scores conflicted (4.6 vs 3.1) and
-- could not be reconciled — disclosed in review_note rather than guessed.
-- Provenance: live research 2026-07-11 against official pricing pages, G2,
-- Capterra, Trustpilot, AUSTRAC.

INSERT INTO public.product_attributes (
  affiliate_link_id, slug, market, category, topic, display_name, tagline,
  score, rating, review_count, clicks, monthly_fee,
  badges, chips, pros, cons, sub_scores, verdict,
  attributes, source_type, confidence,
  is_affiliate, review_slug, external_url, is_top_pick, best_for, display_order,
  source_url, data_verified_at, active
) VALUES
(
  NULL, 'xero-jax', 'au', 'ai-tools', 'ai-tools-finance', 'Xero (JAX)', 'AI bank reconciliation and cashflow insight, free on every plan',
  9.0, 4.4, 1674, 1674, 35,
  '[{"type":"gold","label":"Editor''s pick"}]'::jsonb,
  ARRAY['JAX bundled free on every tier', 'From A$35/month', 'Auto bank-rec, cashflow insights']::text[],
  ARRAY['JAX (generative-AI assistant) is bundled free into every plan, including the cheapest at A$35/month', 'Automated bank reconciliation (80%+ auto-matched per one source) plus predictive cashflow and natural-language ledger Q&A', "Largest AU accounting-software incumbent, strong G2 score (4.4/5, 1,674 reviews)"],
  ARRAY['Trustpilot score (3.7/5) notably lower than G2, with support and pricing-increase complaints', 'An unconfirmed Feb 2026 dark-web listing claimed to contain Xero customer contact data — Xero has not confirmed a breach; worth monitoring'],
  '{"fees":8.8,"features":9.4,"ux":8.8,"support":8.0}'::jsonb,
  'The best free-with-every-plan AI assistant from Australia''s largest accounting incumbent.',
  '{"pricing_model":"flat_subscription","starting_price_note":"Ignite $35/mo, Grow $75/mo, Comprehensive $100/mo, Ultimate from $130/mo, all AUD GST-inclusive. JAX is included at no extra charge on every tier, including Ignite.","target_segment":"accounting_automation","ai_features_note":"JAX (\"Just Ask Xero\") does automated bank reconciliation, transaction matching, predictive cashflow/payment-timing insights, and natural-language Q&A over the ledger.","free_tier_or_trial":false,"review_score":4.4,"review_count":1674,"review_source":"G2","review_note":"Trustpilot shows a notably lower 3.7/5 (~536+ reviews) — support and pricing-increase complaints are the main driver of the gap.","regulatory_note":"An unconfirmed Feb 2026 dark-web forum listing advertised a database allegedly exfiltrated from Xero (names, business emails, phone numbers) for $1,000 — this has not been confirmed as a breach by Xero directly; disclosed as an unresolved claim worth monitoring, not a confirmed incident."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.xero.com/au/', true, 'Most AU small businesses already on accounting software', 1,
  'https://www.xero.com/au/pricing-plans/', DATE '2026-07-11', true
),
(
  NULL, 'employment-hero', 'au', 'ai-tools', 'ai-tools-finance', 'Employment Hero', 'The most accessible free AI tier of the 7 — 50 free AI interviews',
  8.7, 4.6, 164, 164, 0,
  '[{"type":"green","label":"Best free AI tier"}]'::jsonb,
  ARRAY['Free AI Recruitment Agent (50 interviews)', 'Consistent 4.3-4.6 across 3 platforms', '24/7 AI video screening']::text[],
  ARRAY['AI Recruitment Agent (24/7 automated video screening/scoring) is accessible from the completely free ATS tier — no subscription required', 'Consistently strong review scores across all three major platforms (Capterra 4.4, G2 4.6, Trustpilot 4.3 — an unusually tight, credible band)', 'Clear payroll-HR AI use case once you scale into paid tiers'],
  ARRAY['An ongoing Federal Court dispute with Seek over job-board API access could disrupt distribution features if Employment Hero loses', 'March 2025 "platform misuse" incident (scammers) was reported — Employment Hero denies an actual data breach'],
  '{"fees":9.4,"features":8.6,"ux":8.8,"support":8.6}'::jsonb,
  'The easiest way to try AI-powered hiring automation without paying anything.',
  '{"pricing_model":"freemium","starting_price_note":"Free ATS tier includes 50 complimentary AI video interviews, no subscription required. Paid recruitment tiers scale $199-$959/month for 50-300 monthly AI interviews. Core HR/payroll plans start separately at $10/employee/month (10-user minimum).","target_segment":"payroll_hr","ai_features_note":"AI Recruitment Agent automatically scores, screens and conducts 24/7 video interviews with job applicants; higher HR tiers add broader AI-powered hiring/workflow automation.","free_tier_or_trial":true,"review_score":4.6,"review_count":164,"review_source":"G2","review_note":"Capterra 4.4/5 (218 reviews) and Trustpilot 4.3/5 (129 reviews) are both closely consistent with the G2 figure — an unusually tight, credible band across all three platforms.","regulatory_note":"An ongoing Federal Court dispute with Seek over API access (Seek sought to terminate Employment Hero''s job-board API access from 25 Aug 2025; the court ordered Seek to maintain access pending the case) is a live legal/business matter, not a security incident. Separately, in March 2025 Employment Hero confirmed \"an instance of platform misuse\" by scammers following social-media allegations, but denied an actual data breach."}'::jsonb,
  'official', 'high',
  false, NULL, 'https://employmenthero.com/au/', false, 'Businesses hiring at volume wanting free AI screening first', 2,
  'https://employmenthero.com/au/pricing/', DATE '2026-07-11', true
),
(
  NULL, 'dext', 'au', 'ai-tools', 'ai-tools-finance', 'Dext', 'Purpose-built AI receipt & invoice OCR, widely used by AU accountants',
  8.6, 4.6, 312, 312, 47,
  '[{"type":"sky","label":"Highest reviewed"}]'::jsonb,
  ARRAY['Highest G2 score of the 7 (4.6/5)', 'AI-OCR receipt/invoice extraction', 'Syncs to Xero & MYOB']::text[],
  ARRAY['Highest independent review score among all 7 candidates (G2 4.6/5, 312 reviews)', 'Purpose-built AI-OCR for receipts, invoices and supplier statements, widely used by AU accountants and bookkeepers', 'Complements rather than competes with Xero/MYOB via direct sync'],
  ARRAY['AU-specific AUD pricing could not be independently confirmed — the figure shown is a converted estimate from USD-denominated sources, get a live quote via the AU plan builder before committing', 'Per-user + document-credit pricing is harder to headline as one number than flat-tier competitors'],
  '{"fees":8.2,"features":9.0,"ux":8.6,"support":8.4}'::jsonb,
  'The highest-rated tool in this comparison, purpose-built for receipt and invoice automation.',
  '{"pricing_model":"per_user_usage","starting_price_note":"Estimated ~A$47/month (5 users, 250 documents) converted from a USD-denominated figure (~$31.50 USD/mo) found in secondary sources — Dext''s AU plan builder is dynamic and did not return a static AUD figure at research time; confirm live pricing directly.","target_segment":"bookkeeping_ocr","ai_features_note":"OCR-based automated data extraction from receipts, invoices and bank statements with line-item extraction and supplier-statement reconciliation, syncing into Xero, MYOB and other accounting platforms.","free_tier_or_trial":true,"review_score":4.6,"review_count":312,"review_source":"G2","review_note":"Capterra shows a slightly lower but still strong 4.3/5 (158 reviews).","regulatory_note":""}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://dext.com/au/', false, 'Accountants & bookkeepers serving many clients', 3,
  'https://dext.com/au/pricing/prepare', DATE '2026-07-11', true
),
(
  NULL, 'frollo', 'au', 'ai-tools', 'ai-tools-finance', 'Frollo', 'Free AI-powered open banking budgeting, CDR-based',
  7.8, 0, 0, 0, 0,
  '[]'::jsonb,
  ARRAY['Free consumer app', 'CDR-based open banking', 'AI transaction categorisation']::text[],
  ARRAY['Completely free consumer budgeting app plus a free broker portal', 'AI-powered transaction categorisation and spending insights on top of Consumer Data Right (CDR) open-banking aggregation', 'Broker portal integrates AI-assisted bank-statement categorisation with ApplyOnline loan applications'],
  ARRAY['Review data is genuinely conflicting: one source cites Google Play 4.6, another cites 3.1/5 (405 reviews) — could not be reconciled, shown as not yet rated rather than guessed', 'User reviews (via search snippets) mention categorisation bugs and at least one report of lost transaction history after account relinking'],
  '{"fees":9.6,"features":7.8,"ux":7.2,"support":7.0}'::jsonb,
  'A genuinely free, CDR-based AI budgeting option — review data is unresolved, see detail.',
  '{"pricing_model":"freemium","starting_price_note":"Frollo for You (consumer app) and Frollo for Brokers (broker portal) are both free. Frollo for Business (enterprise data platform) has no published price.","target_segment":"budgeting","ai_features_note":"AI-powered transaction categorisation and spending insights on CDR open-banking account aggregation; for brokers, AI-assisted categorisation of bank statement data feeding into ApplyOnline loan applications.","free_tier_or_trial":true,"review_score":null,"review_count":null,"review_source":"Conflicting sources","review_note":"Google Play rating conflicts across sources found (4.6 vs 3.1/5, 405 reviews); Trustpilot shows 3.2/5 but only ~3 reviews (too small to be credible); G2 listing exists but has no live reviews. Shown as not yet rated rather than guessing a number.","regulatory_note":""}'::jsonb,
  'official', 'low',
  false, NULL, 'https://www.frollo.com.au/', false, 'Individuals & brokers wanting free CDR budgeting', 4,
  'https://www.frollo.com.au/frollo-app/', DATE '2026-07-11', true
),
(
  NULL, 'myob-ai-bas', 'au', 'ai-tools', 'ai-tools-finance', 'MYOB (AI BAS)', 'AI-assisted GST/BAS preparation for AU small business',
  7.6, 4.0, 139, 139, 1,
  '[]'::jsonb,
  ARRAY['AI BAS add-on from A$1/month', 'Flags missing docs & GST issues', 'Large incumbent, broad AU trust']::text[],
  ARRAY['AI BAS directly targets a painful AU-specific compliance task (quarterly GST/BAS prep) from as little as A$1/month', 'Works progressively through the quarter, flagging missing documents and GST issues before the deadline', 'Large, well-established AU small-business accounting incumbent'],
  ARRAY['AI BAS does NOT auto-lodge to the ATO — a BAS agent or the user still lodges manually via myGov/agent portal', 'Core AI Business Insights and Smart Reconciliation features remain in beta, and MYOB showed a notably high 2026 outage/maintenance frequency (33 incidents in a 90-day window per one tracker)'],
  '{"fees":8.8,"features":7.6,"ux":7.4,"support":7.0}'::jsonb,
  'A low-cost, AU-specific BAS/GST assistant — note it does not auto-lodge to the ATO.',
  '{"pricing_model":"bundle_tier","starting_price_note":"AI BAS add-on from A$1/month (billed yearly) for eligible non-employing MYOB Business Lite/Pro customers, available since 3 June 2026. Full AI Business Insights + Smart Reconciliation requires MYOB Business Pro ($21/mo intro, $70/mo standard).","target_segment":"accounting_automation","ai_features_note":"AI BAS connects to MYOB Business data, progressively flags missing documents/GST issues through the quarter, auto-categorises bank-feed transactions and calculates GST — but does not lodge directly to the ATO. Smart Reconciliation and AI Business Insights (Pro tier) remain in beta.","free_tier_or_trial":false,"review_score":4.0,"review_count":139,"review_source":"G2","review_note":"Lowest G2 score of the accounting-software candidates in this comparison; Capterra shows 148 reviews with score not independently isolated.","regulatory_note":"A notably high 2026 outage/maintenance frequency was found for MYOB Business/AccountRight/Practice Management — 33 incidents in a 90-day window per one uptime tracker (median ~6h13m), including a multi-day maintenance lockdown 8-11 May 2026. No confirmed data breach found."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.myob.com/au', false, 'GST-registered small businesses wanting BAS help', 5,
  'https://www.myob.com/au/pricing', DATE '2026-07-11', true
),
(
  NULL, 'wemoney', 'au', 'ai-tools', 'ai-tools-finance', 'WeMoney', 'Free debt-tracking app with a large AU user base',
  7.2, 3.4, 100000, 100000, 0,
  '[]'::jsonb,
  ARRAY['Free, 1.35M+ downloads', 'Debt consolidation matching', 'Credit score tracking']::text[],
  ARRAY['Completely free with a large established AU user base (1.35M+ downloads)', 'Account aggregation, debt-consolidation matching, subscription detection and credit-score tracking in one app', 'Community/peer support features alongside the core budgeting tools'],
  ARRAY['No explicit, verifiable "AI" feature description was found on the official site — positioning is weaker/less substantiated than the other candidates on this page, disclosed rather than inflated', 'Google Play rating (3.4/5, 100K reviews) is notably lower than the App Store (4.3/5, 1.7K reviews), suggesting Android-specific issues'],
  '{"fees":9.4,"features":6.8,"ux":7.2,"support":7.0}'::jsonb,
  'A large, free debt-tracking app — its AI positioning is the least substantiated of the 7 candidates here.',
  '{"pricing_model":"freemium","starting_price_note":"Entirely free — no explicit AI-gated paid tier found on the official site.","target_segment":"budgeting","ai_features_note":"Official site content did not explicitly document a discrete named AI capability (unlike Frollo''s documented categorisation AI) — described features are account aggregation, debt-consolidation matching, subscription detection and credit-score tracking. Kept in this comparison per the approved shortlist, but the AI claim is disclosed as less substantiated than its peers.","free_tier_or_trial":true,"review_score":3.4,"review_count":100000,"review_source":"Google Play","review_note":"Apple App Store shows a notably higher 4.3/5 (1.7K reviews) — the Google Play figure is shown as primary due to its much larger sample size (100K reviews).","regulatory_note":""}'::jsonb,
  'official', 'low',
  false, NULL, 'https://wemoney.com.au/', false, 'Users focused on debt payoff/consolidation', 6,
  'https://wemoney.com.au/', DATE '2026-07-11', true
),
(
  NULL, 'airwallex-au-ai', 'au', 'ai-tools', 'ai-tools-finance', 'Airwallex (Expense Policy Agent)', 'AI expense-policy enforcement — with an active AUSTRAC audit disclosed',
  6.8, 4.4, 49, 49, 99,
  '[]'::jsonb,
  ARRAY['AI Expense Policy Agent', 'From A$99/month (Grow plan)', '⚠ Active AUSTRAC audit — see detail'],
  ARRAY['Expense Policy Agent turns a written expense policy into an always-on AI reviewer, checking every claim the moment it posts across entities, currencies and languages', 'Melbourne-founded fintech at a $11B valuation (Series H, June 2026), native multi-entity/multi-currency fit for AU businesses operating internationally'],
  ARRAY['AUSTRAC has ordered an external audit of Airwallex''s Australian Designated Business Group over suspected AML/CTF compliance failures — active and unresolved', 'Recurring account-freeze complaints in reviews; Trustpilot score (~3.3-3.5/5) notably lower than G2 (~4.2-4.5/5), and review counts were inconsistent across sources'],
  '{"fees":7.6,"features":8.8,"ux":7.8,"support":6.4}'::jsonb,
  'A genuinely capable AI expense tool — read the disclosed AUSTRAC audit below before choosing.',
  '{"pricing_model":"bundle_tier","starting_price_note":"Explore is $0-29/mo but does NOT include the Expense Policy Agent. Grow ($99/mo, \"Best Value\") and Accelerate (from $999/mo) both include it. All AUD, GST-inclusive, per business entity.","target_segment":"spend_management","ai_features_note":"Expense Policy Agent reads a company''s written expense policy and acts as an always-on AI reviewer, checking every reimbursement/receipt claim on posting across entities/currencies/languages, flagging duplicates and policy violations with policy-linked explanations. (Airwallex''s broader \"T:0\" AI finance-team suite remains private-beta with unconfirmed AU availability — not used for this comparison.)","free_tier_or_trial":false,"review_score":4.4,"review_count":49,"review_source":"G2","review_note":"G2 figures varied 4.2-4.5/5 (40-52 reviews) across sources found; Trustpilot figures varied 3.3-3.5/5 (1,700-2,390 reviews) across sources — directionally G2 is clearly positive while Trustpilot is clearly mixed, consistent with positive product-feature reviews on G2 versus account-freeze/support complaints on Trustpilot. Recommend a direct re-check before treating either figure as final.","regulatory_note":"AUSTRAC has ordered an external audit of Airwallex''s Australian Designated Business Group over suspected AML/CTF compliance failures — an active, unresolved regulatory matter as of this page''s last verification (primary source: austrac.gov.au). Separately, recurring account-freeze dispute complaints appear in reviews (including a referenced AFCA complaint from an Australian customer over A$8,000 withheld); a US patent lawsuit (Intercurrency Software) was dismissed with prejudice in September 2025 and is resolved, not an ongoing risk."}'::jsonb,
  'official', 'medium',
  false, NULL, 'https://www.airwallex.com/au', false, 'Multi-entity businesses weighing the active audit', 7,
  'https://www.airwallex.com/au/pricing', DATE '2026-07-11', true
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
