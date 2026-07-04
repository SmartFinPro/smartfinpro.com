-- Comparison Cockpit -- seed US cybersecurity for SMBs (topic = 'cybersecurity-smb', category = 'cybersecurity').
-- Mirrors 20260704100000_seed_ai_tools_finance_us.sql. Idempotent (ON CONFLICT DO UPDATE).
-- Provenance is mandatory per row (source_url/source_type/confidence/data_verified_at);
-- full source-by-attribute matrix at
-- docs/superpowers/plans/2026-07-05-cockpit-cybersecurity-smb-source-matrix.md, translated into
-- concrete seed values (with a Fable-5 pre-migration review + 8 blocking fixes, section 0b is the
-- final, authoritative changelog) at
-- docs/superpowers/plans/2026-07-05-cockpit-cybersecurity-smb-planned-seed-values.md.
--
-- Candidates (9), spanning 4 incompatible security layers: CrowdStrike Falcon Go, Bitdefender
-- GravityZone Small Business Security, SentinelOne Singularity, Sophos Intercept X (endpoint & EDR);
-- 1Password Business, Bitwarden (password management); NordLayer, Check Point SASE -- formerly
-- Perimeter 81 (network & SASE); Proofpoint Essentials (email security). Mimecast and Microsoft
-- Defender for Business are deliberately NOT a 10th/11th ranked slot -- buyerGuide mentions only
-- (no SmartFinPro content or link for either; see design doc Urteil 4).
--
-- Heterogeneous-field cost model (AI-Tools-Slice-7 precedent, zero shared-code change): 3
-- incompatible pricing units (per-device/year, per-user/month, quote-only) make a single "cheapest"
-- claim dishonest. Every row seeds `monthly_fee = 0`; the real, non-comparable pricing lives in
-- attributes.starting_price_headline/_note and the Pricing-basis compareRow instead. No
-- specColumn/compareRow declares a cost winner.
--
-- Attribution Gate: ALL 15 cybersecurity-adjacent affiliate_links rows in prod carry
-- tracking_status = 'unverified' (DB-verified 2026-07-04, not just the summary-level MCP tool,
-- which does not expose tracking_status) -- so ZERO 'offer' CTAs are possible anywhere on this
-- page; every candidate resolves to 'review' or 'visit', matching every prior slice. The plan doc's
-- original "5-6 active links" framing was wrong in 3 ways (corrected here, not touched): SentinelOne
-- has NO affiliate_links row at all (its live MDX's /go/sentinelone is a dead route); "NordLayer"
-- has no row of its own -- only nordvpn/nordvpn-business rows exist, all pointing to the same
-- consumer NordVPN CJ deeplink, which is NOT presented here as a NordLayer offer; CrowdStrike,
-- 1Password (DB slug `onepassword`) and Proofpoint are bare cpa=0 homepage-URL bookmarks, not real
-- monetized deals. Per the owner's standing rule, tracking_status is NOT touched by this migration.
--
-- Check Point SASE (DB slug `perimeter-81`, UNCHANGED) is a relabel-only fix this slice --
-- partner_name updates to "Check Point SASE (formerly Perimeter 81)" below; cpa_value (700) and
-- destination_url are left as-is (cpa_value is plausible/in-range for Check Point's own affiliate
-- program, but `?ref=smartfinpro` is not a documented Post Affiliate Pro tracking parameter and no
-- SmartFinPro program registration is evidenced -- a real fix is a separate owner follow-up task,
-- not this migration). NordLayer is a NEW cockpit candidate with no affiliate_links row of its own.
--
-- 5 candidates seed NULL attributes.review_score/review_count (Sophos, Bitwarden, NordLayer, Check
-- Point SASE, Proofpoint) -- reusing the exact nullable pattern + shared-UI `reviewCount === 0`
-- guard already shipped in Slice 7 (cockpit-card/table/compare render "Not yet rated"/"--" instead
-- of a false "0.0 from 0 reviews" claim). Top-level rating/review_count are seeded 0 to match.
--
-- Disclosed, not excluded (Freedom-Debt-Relief/Experian-Slice-6 pattern): CrowdStrike (July 2024
-- global outage; Jan 2026 shareholder-suit dismissal; Delta lawsuit still active), Check Point
-- (parent SEC $995k settlement Oct 2024 + CVE-2024-24919 on the unrelated Quantum Gateway line),
-- Proofpoint ("EchoSpoofing" relay-config abuse, Jan-July 2024), NordLayer (parent Nord Security's
-- 2018 consumer-server compromise, disclosed 2019 -- footnoted, not attributed to this product),
-- 1Password (a 2023 Okta-support-breach-adjacent incident with confirmed zero user-data access),
-- Sophos (2020 XG-firewall zero-day exploited by a state actor -- affects the firewall line, not
-- the ranked Intercept X/Endpoint product). SentinelOne, Bitdefender, Bitwarden: no enforcement
-- actions or vendor breaches found -- `clean_incident_record = true`, driving the matcher directly.
--
-- Affiliate-gate status: is_affiliate=true ONLY for perimeter-81 (a real, if unverified-tracking,
-- CPA deal). crowdstrike/onepassword/proofpoint are existing bare-bookmark rows -- is_affiliate
-- stays false, matching their cpa=0 status. No new affiliate_links rows created (Bitdefender,
-- SentinelOne, Sophos, Bitwarden, NordLayer all get external_url only, is_affiliate=false).
--
-- external_url is set for ALL 9 candidates (each provider's own bare official homepage -- never a
-- tracked/disguised affiliate link). review_slug is set for the 5 candidates with content-fixed US
-- review MDX (crowdstrike, sentinelone, onepassword, nordlayer -> nordvpn-business-review after its
-- rebrand fix, perimeter-81); ctaMode resolves to 'review' for those 5, 'visit' for the other 4
-- (bitdefender, sophos, bitwarden, proofpoint -- no existing US review content).

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
  'crowdstrike', 'us', 'cybersecurity', 'cybersecurity-smb', 'CrowdStrike Falcon Go', 'Best overall -- best brand-name EDR',
  9.0, 4.7, 3081, 0, 0, 0, 0,
  '{"segment":"endpoint_edr","product_type":"Endpoint Protection / EDR","pricing_basis":"per_device_year","starting_price_headline":"$59.99/device/yr (Falcon Go, ≤100 devices)","starting_price_note":"Falcon Go $59.99/device/year (~$7.99/device billed monthly, max 100 devices, 15-day trial). Pro $99.99/yr; Enterprise $184.99/yr; Complete (MDR) quote-based.","core_features_note":"Cloud-native single agent, NGAV/ML-based prevention, Threat Graph; EDR/threat-hunting/intel unlock in higher tiers. Editorial consensus: gold-standard detection, but enterprise-oriented -- SMBs without dedicated security staff may find it needs more tuning than expected.","target_user_note":"The brand-name pick for SMBs with some in-house IT/security capability (Falcon Go caps at 100 devices) scaling up to enterprise; not the simplest set-and-forget option on this page.","mdr_option":true,"analyst_leader":true,"analyst_leader_note":"Gartner Magic Quadrant Leader for Endpoint Protection, 7 consecutive reports (furthest right + highest Ability to Execute in 2026); Gartner Peer Insights Customers'' Choice 2026.","clean_incident_record":false,"review_score":4.7,"review_count":3081,"review_source":"Gartner Peer Insights","review_note":"Endpoint Protection Platforms category, May 2026.","regulatory_history_note":"No enforcement action. Disclosure: a faulty Falcon content update caused a global IT outage on July 19, 2024 (airlines, banks, hospitals, 911 lines). As of January 2026: a shareholder lawsuit over the outage was dismissed (Jan 13-14, 2026 -- the court found plaintiffs had not shown intent to deceive); Delta Air Lines'' lawsuit (~$500M claimed) is still active; a passenger class action was dismissed and is on appeal. This was a service outage, not a data breach -- CrowdStrike''s core detection business and analyst leadership position were unaffected.","editorial_consensus_note":"Gartner MQ Leader 7th consecutive year; a fixture of every SMB endpoint-security roundup, always with the same caveat: strong protection, but built for teams with some security capability."}'::jsonb,
  'official', 'high',
  '[{"type":"gold","label":"Top pick"}]'::jsonb,
  ARRAY['Gartner MQ Leader, 7 years running','15-day trial, Falcon Complete MDR available','Brand-name EDR consensus pick']::text[],
  ARRAY['Strongest analyst consensus in this comparison -- Gartner Magic Quadrant Leader for Endpoint Protection 7 consecutive years, Peer Insights Customers'' Choice 2026 at 4.7/5 from 3,081 reviews','Falcon Complete adds a fully managed detection-and-response service for teams without in-house security staff','15-day free trial on Falcon Go, which covers up to 100 devices at $59.99/device/year']::text[],
  ARRAY['Enterprise-oriented by design -- editorial consensus is that SMBs without any dedicated IT/security capability may find it needs more tuning than a simpler tool','A faulty content update caused a global IT outage on July 19, 2024; Delta Air Lines'' roughly $500M lawsuit over it is still active (a shareholder suit was dismissed in Jan 2026)','Falcon Complete (the MDR tier) is quote-based, with no published SMB price']::text[],
  '{"cost":7.6,"features":9.4,"ux":8.4,"support":8.2}'::jsonb,
  'The strongest analyst-backed pick, but it leans enterprise',
  'CrowdStrike Falcon Go is the brand-name endpoint protection pick for small businesses, backed by the strongest analyst consensus in this comparison: a 7-year run as a Gartner Magic Quadrant Leader and a 4.7/5 score from 3,081 Gartner Peer Insights reviews. Falcon Go covers up to 100 devices at $59.99/device/year with a 15-day trial, and Falcon Complete adds a fully managed detection-and-response service for teams without dedicated security staff. The honest caveat: it is built for teams with at least some security capability, not a pure set-and-forget tool, and a faulty July 2024 content update caused a widely reported global IT outage -- a service outage, not a data breach, with a still-active Delta Air Lines lawsuit and a dismissed shareholder suit as of January 2026.',
  false, 'crowdstrike-review', 'https://www.crowdstrike.com/', true, 'Best brand-name EDR', 1,
  'https://www.crowdstrike.com/en-us/pricing/', DATE '2026-07-04', true
),
(
  NULL,
  'bitdefender', 'us', 'cybersecurity', 'cybersecurity-smb', 'Bitdefender GravityZone Small Business Security', 'Best endpoint protection for most SMBs',
  8.7, 4.6, 208, 0, 0, 0, 0,
  '{"segment":"endpoint_edr","product_type":"Endpoint Protection","pricing_basis":"per_device_year","starting_price_headline":"Calculator-priced (per device/yr)","starting_price_note":"No official static price page -- GravityZone Small Business Security uses a JS pricing calculator. Editorial data point (costbench.com, 2026-04, not independently confirmed): 10 devices/1 year list ≈$324.99 (≈$32.50/device/yr); promo pricing has been seen as low as $227.49 but promos are time-limited and not cited as current fact.","core_features_note":"NGAV + Advanced Threat Control, ransomware mitigation with backup/rollback, fileless-attack protection; web/device control and network attack defense as add-ons. Cloud console, no dedicated SOC staff required to administer.","target_user_note":"THE balance-of-price-and-protection pick of the 2026 SMB roundups; consistently #1 in AV-TEST/AV-Comparatives detection with very few false positives (test-lab claims, labeled as such).","mdr_option":false,"analyst_leader":false,"clean_incident_record":true,"review_score":4.6,"review_count":208,"review_source":"Capterra","review_note":"Also cited: TrustRadius 8.3/10 from 185 reviews. Bitdefender''s G2 listing is fragmented across separate XDR/MDR product pages, so Capterra is the most citable single figure.","regulatory_history_note":"No FTC/SEC/DOJ enforcement actions and no vendor data breach found (searched 2026-07-04) -- the cleanest record of the endpoint-security group.","editorial_consensus_note":"2026 SMB roundups (Huntress, defendmybusiness, Simply IT, iFeelTech''s head-to-head) consistently name GravityZone the SMB price/value winner."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['SMB roundup price/value consensus winner','Cleanest regulatory record in the group','#1 AV-TEST/AV-Comparatives detection']::text[],
  ARRAY['Consistently named the SMB "balance of price and protection" winner across 2026 roundups','The cleanest regulatory record among the endpoint-security candidates -- no enforcement actions or vendor breaches found','Consistently #1 in AV-TEST/AV-Comparatives detection with very few false positives']::text[],
  ARRAY['No official static price page -- exact cost requires the vendor''s JS calculator, and any promo price is time-limited','No managed detection-and-response (MDR) option for teams without security staff','No named Gartner/G2 analyst-leader recognition confirmed, unlike several other candidates on this page']::text[],
  '{"cost":8.8,"features":8.6,"ux":8.4,"support":7.8}'::jsonb,
  'The best balance of price and protection for most SMBs',
  'Bitdefender GravityZone Small Business Security is the SMB roundup consensus pick for balancing price and protection -- consistently #1 in AV-TEST and AV-Comparatives detection testing with very few false positives, and it carries the cleanest regulatory record of any endpoint-security candidate on this page. Pricing runs through a JS calculator rather than a static price page (editorial estimates put a 10-device/1-year plan around $32.50/device/year before any promo), and it lacks a managed detection-and-response option for teams without in-house security staff. Reviewed 4.6/5 on Capterra from 208 reviews, with a supporting 8.3/10 TrustRadius score.',
  false, NULL, 'https://www.bitdefender.com/en-us/business/products/gravityzone-small-business-security', false, 'Best endpoint protection for most SMBs', 2,
  'https://www.bitdefender.com/en-us/business/products/gravityzone-small-business-security', DATE '2026-07-04', true
),
(
  NULL,
  'sentinelone', 'us', 'cybersecurity', 'cybersecurity-smb', 'SentinelOne Singularity', 'Best autonomous EDR',
  8.4, 4.7, 2875, 0, 0, 0, 0,
  '{"segment":"endpoint_edr","product_type":"Endpoint Protection / EDR","pricing_basis":"per_device_year","starting_price_headline":"$69.99/endpoint/yr (Core)","starting_price_note":"Sold via authorized partners, for 5-100 workstations. Core $69.99/endpoint/year; Complete $179.99 (full EDR, 14-day data retention); Commercial $229.99; Enterprise quote-based. Control tier price not published on the official site -- omitted rather than guessed.","core_features_note":"Single agent, Storyline correlation, autonomous remediation + rollback (SMB-relevant: less analyst time needed than CrowdStrike-style tuning); Purple AI in higher tiers.","target_user_note":"SMB to enterprise; positioned by SMB roundups as the autonomous counterpart to CrowdStrike, with lower day-to-day operational overhead.","mdr_option":false,"analyst_leader":true,"analyst_leader_note":"Gartner Magic Quadrant Leader for Endpoint Protection, 6th consecutive year.","clean_incident_record":true,"review_score":4.7,"review_count":2875,"review_source":"Gartner Peer Insights","review_note":"Endpoint Protection Platforms category, May 2026.","regulatory_history_note":"No enforcement actions, no confirmed compromise. Context (not a con, a threat-landscape fact SentinelOne itself disclosed): targeted in 2024/25 by a Chinese reconnaissance campaign (\"PurpleHaze\") and by North Korean fake-IT-worker infiltration attempts -- SentinelOne states its own systems were not compromised.","editorial_consensus_note":"Gartner MQ Leader 6th consecutive year; a fixture of every EDR SMB roundup."}'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['Gartner MQ Leader, 6 years running','Autonomous remediation + rollback','Lower day-to-day overhead than CrowdStrike']::text[],
  ARRAY['A 6-year run as a Gartner Magic Quadrant Leader, with a 4.7/5 score from 2,875 Gartner Peer Insights reviews','Autonomous remediation and ransomware rollback reduce the day-to-day analyst time needed compared to CrowdStrike-style tuning','A clean incident record -- no enforcement actions and no confirmed compromise of SentinelOne''s own systems']::text[],
  ARRAY['No managed detection-and-response (MDR) service confirmed for the SMB tier, unlike CrowdStrike or Sophos','Control-tier pricing is not published on the official site','Sold through authorized partners for 5-100 workstations, not a fully self-service checkout']::text[],
  '{"cost":7.8,"features":9.0,"ux":8.6,"support":8.0}'::jsonb,
  'The best autonomous alternative to CrowdStrike',
  'SentinelOne Singularity is the autonomous-detection counterpart to CrowdStrike -- a 6-year Gartner Magic Quadrant Leader with a 4.7/5 score from 2,875 Peer Insights reviews, built around automatic remediation and ransomware rollback that SMB roundups say needs less day-to-day tuning than CrowdStrike. Core starts at $69.99/endpoint/year (sold through authorized partners, for 5-100 workstations), with Complete at $179.99 adding full EDR and 14-day data retention. It has a clean incident record -- SentinelOne itself disclosed being targeted by state-linked reconnaissance campaigns in 2024/25 without confirming any compromise of its own systems.',
  false, 'sentinelone-review', 'https://www.sentinelone.com/', false, 'Best autonomous EDR', 3,
  'https://www.sentinelone.com/platform-packages/', DATE '2026-07-04', true
),
(
  NULL,
  'sophos', 'us', 'cybersecurity', 'cybersecurity-smb', 'Sophos Intercept X', 'Best with a managed MDR option',
  8.2, 0, 0, 0, 0, 0, 0,
  '{"segment":"endpoint_edr","product_type":"Endpoint Protection","pricing_basis":"quote_based","starting_price_headline":"Quote-based (via partners)","starting_price_note":"No public list price -- sold through partners with a quote. Editorial estimates (not seeded as fact) put entry pricing around $50-70/user/year with discounts commonly 15-40%.","core_features_note":"Exploit prevention (60+ techniques), CryptoGuard ransomware rollback, Synchronized Security with Sophos firewalls, centralized Sophos Central console.","target_user_note":"SMB to mid-market; the managed-detection-and-response (MDR) add-on is the strongest argument for teams without dedicated security staff.","mdr_option":true,"analyst_leader":true,"analyst_leader_note":"Gartner Magic Quadrant Leader for Endpoint Protection, 17th consecutive report -- the longest active streak in the field; also #1 Overall Endpoint Protection in G2''s Spring AND Summer 2026 Grid Reports (plus #1 in EDR/XDR/MDR/Firewall, Spring 2026).","clean_incident_record":false,"review_score":null,"review_count":null,"review_source":"Not yet independently rated (G2 Grid Leader status confirmed)","review_note":"#1 Overall Endpoint Protection, G2 Spring and Summer 2026 Grid Reports; exact review score and count pending independent confirmation.","regulatory_history_note":"No enforcement action against Sophos. Context: Sophos XG firewalls were mass-exploited in 2020 via zero-day CVE-2020-12271 (~81,000 devices); the U.S. DOJ charged and OFAC sanctioned the Chinese state-linked actor behind it (Dec 10, 2024, $10M reward offered). Sophos was the victim and disclosed the campaign itself via its Pacific Rim reports -- this affects the firewall product line, not Intercept X/Sophos Endpoint.","editorial_consensus_note":"Longest-running Gartner MQ Leader streak in endpoint protection (17 reports); G2''s #1 overall endpoint protection vendor in 2026."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Longest Gartner MQ Leader streak (17 reports)','#1 overall on G2''s Endpoint Protection grid','Managed MDR is a first-class offering']::text[],
  ARRAY['The longest active Gartner Magic Quadrant Leader streak in endpoint protection -- 17 consecutive reports -- plus the #1 spot on G2''s Spring and Summer 2026 Endpoint Protection grids','Managed detection-and-response (MDR) is a first-class Sophos offering, the strongest argument on this page for teams with no dedicated security staff','CryptoGuard ransomware rollback and Synchronized Security tie in with Sophos''s own firewall line']::text[],
  ARRAY['No public list price -- sold through partners via quote, so exact SMB cost requires a sales conversation','No independently confirmed review score or count yet, despite its strong Grid placement','Sophos''s own XG firewalls (a different product line) were mass-exploited by a state-linked actor in 2020, disclosed by Sophos itself']::text[],
  '{"cost":7.6,"features":9.0,"ux":8.2,"support":8.8}'::jsonb,
  'The best pick if you want a managed service, not just software',
  'Sophos Intercept X (Sophos Endpoint) holds the longest active Gartner Magic Quadrant Leader streak in endpoint protection -- 17 consecutive reports -- and topped G2''s Spring and Summer 2026 Endpoint Protection grids outright. Its strongest differentiator for SMBs is a first-class managed detection-and-response (MDR) service, letting Sophos''s own team handle monitoring and response for teams without security staff. There is no public list price; it sells through partners via quote, with editorial estimates around $50-70/user/year before discounts. Sophos disclosed, via its own "Pacific Rim" research, that its separate XG firewall line was mass-exploited by a Chinese state-linked actor in 2020 -- unrelated to the ranked Intercept X/Endpoint product.',
  false, NULL, 'https://www.sophos.com/en-us/products/intercept-x', false, 'Best with a managed MDR option', 4,
  'https://www.sophos.com/en-us/products/intercept-x.aspx', DATE '2026-07-04', true
),
(
  NULL,
  'onepassword', 'us', 'cybersecurity', 'cybersecurity-smb', '1Password Business', 'Best business password manager',
  8.0, 4.7, 12000, 0, 0, 0, 0,
  '{"segment":"password_management","product_type":"Business password manager","pricing_basis":"per_user_month","starting_price_headline":"$7.99/user/mo","starting_price_note":"Business $7.99/user/month (annual billing); Teams Starter Pack $19.95/month flat for up to 10 users; Enterprise quote-based.","core_features_note":"Vaults/roles/policies, SSO integration (Okta/Azure AD/Google), SCIM provisioning, audit logs, Watchtower breach monitoring; a personal Families account included per employee.","target_user_note":"SMB to enterprise; widely used business password manager -- 180,000+ companies is the vendor''s own figure, cited as a vendor claim, not an independent count.","mdr_option":false,"analyst_leader":false,"clean_incident_record":false,"review_score":4.7,"review_count":12000,"review_source":"Trustpilot","review_note":"12,000+ Trustpilot reviews (exact count pending profile verification). G2 rating also ~4.7/5 but exact review count was not independently confirmed.","regulatory_history_note":"No enforcement actions, no user-data breach. Disclosure: on Sept 29, 2023, suspicious activity was detected on 1Password''s internal Okta instance, a downstream effect of the broader Okta support-system breach (a stolen HAR file/session cookie). The attack was stopped and 1Password states no 1Password user data was accessed -- disclosed transparently and promptly.","editorial_consensus_note":"G2 Grid Leader for password managers; standard recommendation across business password-manager roundups (PCMag/Wirecutter consensus); expanded its global partner program in Feb 2026."}'::jsonb,
  'official', 'high',
  '[]'::jsonb,
  ARRAY['Widely used business password manager','SSO/SCIM + Watchtower breach monitoring','Transparent Okta-adjacent disclosure']::text[],
  ARRAY['The standard recommendation across business password-manager roundups, with SSO integration, SCIM provisioning and Watchtower breach monitoring','A very large, if vendor-reported, install base (180,000+ companies) and a strong 4.7/5 Trustpilot score from 12,000+ reviews','Promptly and transparently disclosed a Sept 2023 Okta-adjacent incident, confirming no 1Password user data was accessed']::text[],
  ARRAY['Teams Starter Pack tops out at 10 users flat-rate before per-seat Business pricing applies','No managed detection-and-response equivalent -- not applicable to this product category, but no extra managed-service tier either','The Okta-support-system incident, while resolved with no data accessed, is still a disclosed security event worth knowing about']::text[],
  '{"cost":8.2,"features":9.0,"ux":9.2,"support":8.6}'::jsonb,
  'The standard recommendation for business password management',
  '1Password Business is the standard recommendation across business password-manager roundups: SSO integration with Okta, Azure AD and Google, SCIM provisioning, audit logs and Watchtower breach monitoring, at $7.99/user/month (or a flat $19.95/month Teams Starter Pack for up to 10 users). It carries a strong 4.7/5 score from over 12,000 Trustpilot reviews and a very large, vendor-reported install base of 180,000+ companies. In September 2023, 1Password transparently disclosed suspicious activity on its internal Okta instance stemming from the broader Okta support-system breach, confirming no 1Password user data was accessed.',
  false, '1password-business-review', 'https://1password.com', false, 'Best business password manager', 5,
  'https://1password.com/pricing/password-manager', DATE '2026-07-04', true
),
(
  NULL,
  'bitwarden', 'us', 'cybersecurity', 'cybersecurity-smb', 'Bitwarden', 'Best value password manager',
  7.8, 0, 0, 0, 0, 0, 0,
  '{"segment":"password_management","product_type":"Open-source password manager","pricing_basis":"per_user_month","starting_price_headline":"$4/user/mo (Teams)","starting_price_note":"Teams $4/user/month; Enterprise $6/user/month (both annual billing); free tier for individual use; Enterprise includes a Families plan per employee.","core_features_note":"End-to-end zero-knowledge encryption, open-source codebase (publicly auditable + regular third-party audits), self-hosting option (a real compliance argument), Vault Health Reports, passkeys.","target_user_note":"Budget- and transparency-focused SMBs; IT teams with a self-hosting requirement.","mdr_option":false,"analyst_leader":true,"analyst_leader_note":"#1 Enterprise User Satisfaction in the G2 Grid -- 11 consecutive quarters (Satisfaction Score 98).","clean_incident_record":true,"review_score":null,"review_count":null,"review_source":"Not yet independently rated (~4.6/5 on G2, count pending)","review_note":"#1 Enterprise User Satisfaction in the G2 Grid, 11 consecutive quarters (Satisfaction Score 98); exact review score and count pending independent confirmation.","regulatory_history_note":"No enforcement actions, no vendor breach found (searched 2026-07-04); annual external security audits are published.","editorial_consensus_note":"Info-Tech Report Leader (Composite score 9.1); the standard best-value pick across 2026 password-manager roundups."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Lowest price in the password-management group','Open-source, publicly audited codebase','#1 G2 Enterprise User Satisfaction, 11 quarters']::text[],
  ARRAY['The lowest price of any password manager in this comparison at $4/user/month, with a genuine free tier for individuals','Open-source and publicly auditable, with regular third-party security audits published -- a real transparency and compliance argument','#1 Enterprise User Satisfaction on the G2 Grid for 11 consecutive quarters, plus a clean incident record']::text[],
  ARRAY['No named Gartner Magic Quadrant recognition, unlike several endpoint-security candidates on this page','No self-serve US review content on SmartFinPro yet -- links go straight to Bitwarden''s own site','Exact current G2 review score and count not yet independently confirmed']::text[],
  '{"cost":9.4,"features":8.2,"ux":8.4,"support":7.6}'::jsonb,
  'The best-value pick for budget-conscious, transparency-minded teams',
  'Bitwarden is the best-value password manager in this comparison: $4/user/month for Teams (or $6 for Enterprise), an open-source, publicly audited codebase, and a self-hosting option that''s a real compliance argument for some SMBs. It holds the #1 Enterprise User Satisfaction spot on the G2 Grid for 11 consecutive quarters and has a clean incident record -- no enforcement actions or vendor breaches found. Its exact current G2 review score and count are still pending independent confirmation, and it lacks the brand-name analyst recognition of some pricier competitors.',
  false, NULL, 'https://bitwarden.com/', false, 'Best value password manager', 6,
  'https://bitwarden.com/pricing/business/', DATE '2026-07-04', true
),
(
  NULL,
  'nordlayer', 'us', 'cybersecurity', 'cybersecurity-smb', 'NordLayer', 'Best business VPN/ZTNA entry point',
  7.5, 0, 0, 0, 0, 0, 0,
  '{"segment":"network_sase","product_type":"Business VPN / ZTNA","pricing_basis":"per_user_month","starting_price_headline":"$8/user/mo (Lite, min. 5 seats)","starting_price_note":"Lite $8; Core $11; Premium $14 per user/month (annual billing; monthly billing up to 22% higher). Minimum 5 seats. Enterprise from $6/user (200+ seats). Dedicated fixed-IP server +$40/month. 14-day money-back guarantee.","core_features_note":"Encrypted team tunnels, dedicated IPs, DNS filtering (Core+), cloud firewall/device posture/site-to-site (Premium), central admin console. Not a full SASE stack (no full secure web gateway like Check Point SASE).","target_user_note":"Small teams (5+ users) up to mid-market; a lower entry hurdle than full SASE platforms like Check Point SASE.","mdr_option":false,"analyst_leader":false,"clean_incident_record":false,"review_score":null,"review_count":null,"review_source":"Not yet independently rated","review_note":"A G2 profile exists; exact score and count pending independent confirmation.","regulatory_history_note":"No enforcement actions against NordLayer itself. Parent-company disclosure (footnote, not attributed to this product): a rented server in Finland used by NordVPN''s consumer product was compromised in March 2018 via the data center''s insecure remote management; no activity logs or credentials were taken and the TLS key involved had already expired. Disclosed publicly on Oct 21, 2019 -- the delayed disclosure drew criticism. This is a consumer-product incident from the parent company (Nord Security), not a NordLayer incident.","editorial_consensus_note":"TechRadar Pro (praised its cloud firewall), Cybernews, and a 2026 Security.org review are solid but there''s less analyst coverage than the EDR/SASE candidates."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Lower entry price than full SASE platforms','Cloud firewall + device posture (Premium)','14-day money-back guarantee']::text[],
  ARRAY['A lower-cost, lower-complexity entry point into network access security than a full SASE platform like Check Point SASE, starting at $8/user/month','Cloud firewall, device posture and site-to-site connectivity on the Premium tier, plus a central admin console','A 14-day money-back guarantee lowers the risk of trying it']::text[],
  ARRAY['Not a full SASE stack -- no complete secure web gateway the way Check Point SASE offers','Minimum 5 seats required, so it doesn''t fit teams smaller than that','Parent company Nord Security disclosed a 2018 consumer-product server compromise (publicly disclosed in 2019) -- not a NordLayer incident, but worth knowing about the corporate family']::text[],
  '{"cost":8.4,"features":7.6,"ux":8.0,"support":7.4}'::jsonb,
  'The lower-cost entry point into business network security',
  'NordLayer is the lower-cost, lower-complexity way for a small team to add network access security -- encrypted team tunnels, dedicated IPs, DNS filtering, and on the Premium tier a cloud firewall with device posture and site-to-site connectivity, starting at $8/user/month for a minimum of 5 seats. It''s a lighter product than a full SASE platform like Check Point SASE (no complete secure web gateway), backed by a 14-day money-back guarantee. Its parent company, Nord Security, disclosed a 2018 compromise of a rented server used by its consumer NordVPN product (publicly disclosed in 2019) -- a footnote about the corporate family, not an incident involving NordLayer itself.',
  false, 'nordvpn-business-review', 'https://nordlayer.com/', false, 'Best business VPN/ZTNA entry point', 7,
  'https://nordlayer.com/pricing/', DATE '2026-07-04', true
),
(
  NULL,
  'perimeter-81', 'us', 'cybersecurity', 'cybersecurity-smb', 'Check Point SASE', 'Best full SASE platform',
  7.3, 0, 0, 0, 0, 0, 0,
  '{"segment":"network_sase","product_type":"Cloud SASE / ZTNA","pricing_basis":"quote_based","starting_price_headline":"Quote-based (via demo)","starting_price_note":"No public list price since the Check Point acquisition -- self-service pricing ($8/$12 under the old Perimeter 81 brand) was replaced by a demo + TCO-calculator sales motion. Editorial estimates from the Harmony-era (~$10/$15/$20/user/month) exist but are not seeded as current fact.","core_features_note":"ZTNA with app-level access, IdP integrations (Okta/Entra/SAML), web filtering/SWG, device posture, cloud firewall. The product was substantially expanded after the acquisition (added Check Point''s ThreatCloud + SD-WAN stack), not discontinued.","target_user_note":"Mid-market (50-500 users) with zero-trust needs; losing self-service pricing pushes it closer to an enterprise sales cycle -- stated plainly rather than glossed over.","mdr_option":false,"analyst_leader":false,"clean_incident_record":false,"review_score":null,"review_count":null,"review_source":"Not yet independently rated","review_note":"A G2 profile exists under \"Check Point Harmony SASE\"; exact score and count pending independent confirmation.","regulatory_history_note":"Two parent-company (Check Point) disclosures, neither attributed to the SASE product itself: (a) an Oct 22, 2024 SEC civil settlement -- $995,000 penalty for misleading SolarWinds-era cyber-incident disclosures (one of four firms settled that day, including Mimecast); (b) CVE-2024-24919, an actively exploited zero-day in Check Point''s classic Quantum Security Gateways/remote-access VPN (April-June 2024, exploited by Qilin ransomware affiliates, prompting a CISA emergency directive) -- this affects the Quantum Gateway line, not the Perimeter-81-based SASE product. No enforcement action against the SASE product itself.","editorial_consensus_note":"Formerly Perimeter 81, acquired by Check Point (closed Sept 13, 2023, ~$490M) and rebranded via Quantum SASE -> Harmony SASE -> Check Point SASE. Check Point''s own product page still titles it Check Point SASE - Perimeter 81; (formerly Perimeter 81) is this rollout''s recommended editorial label, not a direct quote."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Full ZTNA + SWG + SD-WAN SASE stack','Expanded, not discontinued, since the Check Point acquisition','Backed by Check Point''s ThreatCloud intelligence']::text[],
  ARRAY['A full SASE stack -- ZTNA, a secure web gateway, device posture and cloud firewall -- unlike NordLayer''s lighter network-access product','Substantially expanded after Check Point''s 2023 acquisition, adding Check Point''s own ThreatCloud intelligence and SD-WAN capability rather than being discontinued','IdP integrations with Okta, Entra and SAML for straightforward identity-provider setup']::text[],
  ARRAY['Lost its self-service pricing after the acquisition -- now a demo + TCO-calculator sales cycle with no public list price','Parent company Check Point settled with the SEC for $995,000 in Oct 2024 over misleading cyber-incident disclosures (unrelated to this specific product)','Renamed twice since the 2023 acquisition (Quantum SASE, then Harmony SASE, now Check Point SASE), which can make it hard to find under its current name']::text[],
  '{"cost":7.0,"features":8.8,"ux":7.8,"support":7.6}'::jsonb,
  'The most complete SASE platform in this comparison, now sold through a demo cycle',
  'Check Point SASE -- formerly Perimeter 81, acquired by Check Point in September 2023 for roughly $490 million -- is the most complete SASE platform in this comparison, combining ZTNA, a secure web gateway, device posture management and a cloud firewall, expanded since the acquisition with Check Point''s own ThreatCloud intelligence and SD-WAN stack. The trade-off: it lost its self-service pricing along the way, replaced by a demo-and-TCO-calculator sales cycle with no public list price. Parent company Check Point settled with the SEC for $995,000 in October 2024 over unrelated cyber-incident disclosures, and a separately-disclosed zero-day (CVE-2024-24919) affects its classic Quantum Gateway product line, not this SASE platform.',
  true, 'perimeter-81-review', 'https://perimeter81.com/?ref=smartfinpro', false, 'Best full SASE platform', 8,
  'https://sase.checkpoint.com/', DATE '2026-07-04', true
),
(
  NULL,
  'proofpoint', 'us', 'cybersecurity', 'cybersecurity-smb', 'Proofpoint Essentials', 'Best email security',
  7.0, 0, 0, 0, 0, 0, 0,
  '{"segment":"email_security","product_type":"Email security","pricing_basis":"per_user_month","starting_price_headline":"~$2.75/user/mo (Business tier, via reseller)","starting_price_note":"Proofpoint doesn''t publish list prices; reseller-quoted Essentials tiers: Business ~$2.75; Advanced ~$3.75; Professional ~$5.33-5.86 per user/month (annual billing). Enterprise-tier Proofpoint products are quote-only. Package names and figures are reseller-sourced (not vendor-published) and should be re-confirmed with a fresh date before shipping.","core_features_note":"URL/attachment sandboxing, impostor/BEC classification, data-loss prevention (Professional tier), deep threat intelligence as the core differentiator. \"Stopping 99.999% of email threats\" is a vendor claim, cited as such, not stated as fact.","target_user_note":"Enterprise-first DNA, but its SMB story got materially stronger after completing the $1.8B acquisition of Hornetsecurity (an SMB/MSP-focused email-security vendor) on Dec 8, 2025 -- the largest acquisition in Proofpoint''s history.","mdr_option":false,"analyst_leader":true,"analyst_leader_note":"Gartner Magic Quadrant Leader for Email Security, Highest in Execution 2nd consecutive year (2025), per Proofpoint''s own communication of the MQ result.","clean_incident_record":false,"review_score":null,"review_count":null,"review_source":"Not yet independently rated (Gartner MQ Leader, email security)","review_note":"Shortlist cites Gartner Peer Insights 4.7/1,413 for the email-security category; not independently re-confirmed, so not seeded as a score.","regulatory_history_note":"No regulator action. Disclosure: EchoSpoofing (Jan-July 2024) -- phishers abused an insecurely-configurable-by-default Microsoft 365 relay setting on Proofpoint customer accounts to send an average of 3M (peak 14M) perfectly SPF/DKIM-signed spoofed emails per day impersonating major brands (Disney, Nike, IBM, Coca-Cola). Fixed with Guardio Labs'' help; the insecure default is now deny-by-default with admin visibility. This was a configuration-design weakness, not a breach of Proofpoint''s own systems. Ownership: Thoma Bravo (private, $12.3B take-private, 2021); an IPO is reportedly being explored.","editorial_consensus_note":"Gartner MQ Email Security Leader (highest in execution, 2025); editorial consensus: strongest threat-intel depth, enterprise-first -- for SMB/mid-market, Mimecast has historically offered comparable protection at a lower price (see buyer''s guide)."}'::jsonb,
  'official', 'medium',
  '[]'::jsonb,
  ARRAY['Gartner MQ Leader, email security','Strengthened SMB story via Hornetsecurity acquisition','Deep threat-intelligence differentiator']::text[],
  ARRAY['Gartner Magic Quadrant Leader for Email Security, rated highest in execution for the 2nd consecutive year','Deep threat-intelligence is the core differentiator -- sandboxing, BEC/impostor classification and, on the Professional tier, data-loss prevention','Its SMB story got materially stronger after the December 2025 acquisition of Hornetsecurity, an SMB/MSP-focused email-security vendor']::text[],
  ARRAY['Enterprise-first DNA -- historically priced and positioned above SMB-friendlier alternatives like Mimecast (see buyer''s guide)','A configuration weakness called "EchoSpoofing" let attackers send millions of perfectly signed spoofed emails per day for roughly six months in 2024 before being fixed','Prices are reseller-quoted, not vendor-published, and no US SmartFinPro review exists yet for this product']::text[],
  '{"cost":8.6,"features":8.4,"ux":7.8,"support":7.4}'::jsonb,
  'The strongest threat-intelligence email security pick, now with a real SMB story',
  'Proofpoint Essentials brings Proofpoint''s enterprise-grade threat intelligence -- sandboxing, business-email-compromise classification, and data-loss prevention on its Professional tier -- down to reseller-quoted SMB pricing starting around $2.75/user/month. It''s a two-time Gartner Magic Quadrant Leader for Email Security, rated highest in execution, and its SMB credibility grew significantly after the December 2025 acquisition of the SMB/MSP-focused Hornetsecurity for $1.8 billion. A real disclosure worth knowing: a 2024 configuration weakness called "EchoSpoofing" let attackers send millions of perfectly signed spoofed emails per day for roughly six months before Proofpoint fixed the underlying default setting.',
  false, NULL, 'https://www.proofpoint.com/us', false, 'Best email security', 9,
  'https://www.proofpoint.com/us/products/email-protection/email-security-and-protection', DATE '2026-07-04', true
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

-- Check Point SASE relabel (Owner sec. 7.5 of the Phase-D plan) -- partner_name only.
-- tracking_status, cpa_value, and destination_url are deliberately UNTOUCHED per the standing rule
-- against silently changing tracking status; the real monetization fix (program registration, a
-- verified tracking link) is a separate owner follow-up task, not this migration.
UPDATE public.affiliate_links
SET partner_name = 'Check Point SASE (formerly Perimeter 81)'
WHERE slug = 'perimeter-81' AND market = 'us' AND category = 'cybersecurity';
