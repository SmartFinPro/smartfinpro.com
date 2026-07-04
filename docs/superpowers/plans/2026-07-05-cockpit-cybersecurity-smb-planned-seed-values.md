# Planned Seed Values: Best Cybersecurity for SMBs (US) — Comparison Cockpit Slice 8

> Stand: 2026-07-05 · Übersetzt die Fable-5-Recherche (`2026-07-05-cockpit-cybersecurity-smb-source-matrix.md`) in ein konkretes `TopicConfig` + Migrations-Plan. Topic: `cybersecurity/cybersecurity-smb` (bereits in `manifest.ts` registriert). Vor Implementierung: Fable-5-Pre-Migration-Review.
>
> **Hinweis zur Recherche-Tiefe:** Eine geplante Zweit-Verifikation (G2-Live-Counts, Bitdefender-Kalkulator-Preis u. a. `confidence: low`-Punkte der Checkliste) ist am Session-Usage-Limit gescheitert (0 Tokens, kein Ergebnis). Dieses Dokument nutzt daher NUR die bereits im Source-Matrix als `high`/`medium` markierten Werte; alle noch offenen Punkte sind in §8 explizit aufgeführt und NICHT geseedet — konsistent mit der Projekt-Regel "confidence: low nie seeden" und dem Source-Matrix-eigenen Soft-Live-Fallback (Abschnitt "Pre-Seed-Verifikations-Checkliste", Zeilen 253–277 des Source-Matrix-Dokuments).

---

## §0 Entscheidungen dieser Session (Owner-Fragen aufgelöst)

1. **Content-Fix-Scope (User-Entscheidung, AskUserQuestion):** „US-Reviews jetzt fixen" — die 5 US-Review-Dateien (perimeter-81, sentinelone, crowdstrike, 1password-business, nordvpn-business) werden in diesem Slice bereinigt, inkl. beider Slug-Drift-Bugs. Markt-Varianten (ca/uk/au) + die 3 nicht-US Proofpoint-Reviews werden NICHT in diesem Slice angefasst, sondern per `spawn_task` als Folgetask geflaggt.
2. **Perimeter 81 → Check Point SASE (Owner §7.5):** Relabel-only-Scope wie vom Research empfohlen — `partner_name` in der DB-Row + MDX-Branding auf „Check Point SASE (formerly Perimeter 81)" umstellen, `tracking_status` NICHT anfassen, Programm-Registrierung = separater Owner-Folgetask (per `spawn_task`).
3. **Mimecast:** kein 10. Ranked-Slot — buyerGuide-Absatz „Proofpoint vs. Mimecast", wie vom Research empfohlen (Hornetsecurity-Akquisition schwächt das SMB-Argument, keine SmartFinPro-Monetarisierungsbasis).
4. **Top-Pick (Steuerungs-Session-Entscheidung):** **CrowdStrike Falcon Go** — stärkster belegter Analysten-Konsens (Gartner MQ Leader 7×, 4,7/3.081 Reviews, Customers' Choice 2026), existierendes Review + Klick-Historie. Pflicht-Auflage: Outage-Disclosure direkt auf der Karte + ehrliche „enterprise-leaning" Einordnung im Verdict. Bitdefender bleibt der editorial „best balance"-Alternativ-Pick (eigener Segment-Slot, kein zweiter Top-Pick).
5. **Kostenmodell:** neutralisiertes `banking`-Kind (AI-Tools-Slice-7-Präzedenz, null Shared-Code-Change) — kein Kosten-Sort, kein Winner-Chip; „Starting price" + „Pricing basis" als reine Info-Spalten.
6. **Kandidaten-Feld:** 9 Ranked-Kandidaten (siehe §2), Microsoft Defender + Mimecast nur als buyerGuide-Erwähnung, kein Slot.

### §0b Fable-5-Pre-Migration-Review appliziert (8 Blocking + 10 Non-Blocking)

Der Review fand: interne Doku-Referenzen ("see §8", "this pass") die wörtlich in die Compare-Matrix gerendert hätten (`review_source` bei 5 null-Kandidaten); zwei sichtbare Zahlen, die die matrixeigene Pflicht-Verifikation umgangen hätten (Bitdefender-Preis-Headline, 1Password-Count 12.354); eine unbestätigte Mimecast-Gartner-Zahl im buyerGuide entgegen expliziter Checklisten-Auflage; ein fehlendes `IntentDef.icon`-Feld (Contract-Verletzung); eine fehlende Pflicht-Auflage im Top-Pick-Verdict ("enterprise-leaning, smaller teams may prefer Bitdefender"); ein FAQ-Item mit DB-Jargon und einer sachlich falschen Referenz auf nicht-existente NordVPN-Kandidaten. Alle 8 Blocking-Punkte + die meisten Non-Blocking-Empfehlungen sind unten bereits eingearbeitet (nicht als Nachtrag, sondern direkt in §1–§9). Kernurteil des Reviewers zur Ranked-Live-Frage: **"Ranked-live mit `is_top_pick=crowdstrike` ist vertretbar, WENN die 4 verbliebenen unverifizierten Sichtzellen (Bitdefender-Preis/-Capterra, Proofpoint-Preis, 1Password-Count) vor der Migration erhoben oder wie die Quote-Kandidaten demoted werden."** — in diesem Doc bereits demoted (Bitdefender-Preis) bzw. konservativ geflooert (1Password-Count) bzw. in §8 als Pre-Ship-Check vorgemerkt (Bitdefender-Capterra, Proofpoint-Preis).

---

## §1 TopicConfig-Grundgerüst

```ts
slug: 'cybersecurity-smb',
category: 'cybersecurity',
label: 'Cybersecurity for SMBs',
publishedDate: '2026-07-05',
```

`h1`: `Best cybersecurity tools for small businesses in ${y}`
`metaTitle`: `Best Cybersecurity for SMBs (${y}) — Compared & Ranked`
`metaDescription`: `Compare the best cybersecurity tools for small businesses in ${y}: endpoint protection, password managers, network security and email security — independent, sourced, and honest about what each layer actually protects.`
`intro`: "Independent, side-by-side comparison across four security layers — endpoints, passwords, network access, and email — because no SMB buys just one tool, and no single winner exists across all four."

### Zod-Schema (`attributes` JSONB)

```ts
export const cybersecuritySmbAttributesSchema = z.object({
  segment: z.enum(['endpoint_edr', 'password_management', 'network_sase', 'email_security']),
  product_type: z.string(), // short descriptor, e.g. "Endpoint Protection / EDR"
  pricing_basis: z.enum(['per_device_year', 'per_user_month', 'quote_based']),
  starting_price_headline: z.string(), // short, feeds specColumn + homepage tile
  starting_price_note: z.string(), // full detail, detailRow only
  core_features_note: z.string(),
  target_user_note: z.string(),
  mdr_option: z.boolean(), // managed detection/response service available
  analyst_leader: z.boolean(), // true only with a verified named analyst claim (Gartner MQ Leader / G2 #1 Grid etc.)
  analyst_leader_note: z.string().optional(),
  clean_incident_record: z.boolean(), // true only for a verified zero-enforcement-action, zero-disclosed-incident record (SentinelOne, Bitdefender, Bitwarden); drives the matcher, not just prose
  review_score: z.number().nullable(),
  review_count: z.number().nullable(),
  review_source: z.string(),
  review_note: z.string().optional(),
  regulatory_history_note: z.string(),
  editorial_consensus_note: z.string(),
}).passthrough();
```

`review_score`/`review_count` nullable — reuses the exact nullable pattern + shared-UI `reviewCount === 0` guard already shipped in Slice 7 (cockpit-card/table/compare). **Zero additional shared-code change needed this slice.**

### specColumns (no winner on any — heterogeneous field, matches AI-Tools-Slice-7 "Segment/Price" precedent)

1. **Segment** — `attrStr(segment)` → label map (Endpoint & EDR / Password management / Network & SASE / Email security). No winner.
2. **Starting price** — `starting_price_headline`. No winner (3 incompatible units — per Urteil 3 of the source matrix).
3. **Pricing basis** — `pricing_basis` → label map (Per device/year / Per user/month / Quote-based). No winner.

### filters
- `endpoint` — segment === 'endpoint_edr'
- `password` — segment === 'password_management'
- `network` — segment === 'network_sase'
- `email` — segment === 'email_security'
- `analystLeader` — `analyst_leader === true`

### priorityChips
- Best for endpoint protection → sort `endpoint`, icon `Shield`
- Best password manager → sort `password`, icon `KeyRound`
- Best network/SASE → sort `network`, icon `Network`
- Best email security → sort `email`, icon `Mail`
- Top rated → sort `rating`, icon `Star`

### matcher (3 questions, mirrors ai-tools-finance's 3-question structure)
1. "What do you need to protect?" (weight 16) → segment match (endpoint/password/network/email)
2. "Do you want a managed detection & response (MDR) option, not just software?" (weight 10) → `mdr_option === true` when 'yes'
3. "Prefer a vendor with no security incidents **or major outages** on record?" (weight 8) → reads `clean_incident_record` (schema field, not a hardcoded slug list) — `true` only for SentinelOne, Bitdefender, Bitwarden; neutral (`matched:true`) when answer is 'no'/doesn't matter. The "or major outages" wording matters: CrowdStrike's 2024 incident was a service outage, not a security breach, so a bare "no security incidents" label would be technically contestable.

### sortOptions
`smart` (p.score), `endpoint`/`password`/`network`/`email` (segment-boosted + p.score, mirrors ai-tools' segment sorts), `rating` (`(attrNumOrNull(review_score) ?? 0) * 100 + p.score` — null-safe; the 5 candidates without a confirmed score — Sophos, Bitwarden, NordLayer, Check Point SASE, Proofpoint — rank last in this sort mode only, never a false score).

**Migration note (Non-Blocking §review):** the 5 null-review candidates (Sophos, Bitwarden, NordLayer, Check Point SASE, Proofpoint) must seed **top-level** `rating = 0, review_count = 0` on the `product_attributes` row (not just `null` inside the JSONB `attributes`) — `mapCockpitRow` reads the top-level columns for the card/table, and the Slice-7 "Not yet rated" path triggers on `reviewCount === 0` there, exactly like ChatGPT/Composer in `ai-tools-finance`. Seeding anything else at the top level risks fabricating a score the JSONB layer correctly left null.

**Smart-rank `score`/`display_order` (fix during migration, ascending display order = descending intended prominence):** 1 crowdstrike · 2 bitdefender · 3 sentinelone · 4 sophos · 5 onepassword · 6 bitwarden · 7 nordlayer · 8 perimeter-81 · 9 proofpoint (segment-grouped: endpoint block first since it has the most analyst-backed candidates incl. the top pick, then password, network, email).

### costModel
```ts
costModel: {
  kind: 'banking',
  amountLabel: 'Representative usage', // ignored, matches ai-tools-finance/trading-platforms precedent
  amountMin: 0, amountMax: 0, amountStep: 1, amountDefault: 0,
  yearsLabel: 'Time horizon (years)',
  yearsMin: 1, yearsMax: 5, yearsDefault: 3,
},
```
Every candidate seeds `monthly_fee = 0` (uniform, inert) — same fix class the AI-Tools pre-migration review caught in Slice 7; applying it from the start here avoids repeating that finding.

### compareRows
- `price` (starting_price_headline, no score)
- `pricingBasis` (label, no score)
- `segment` (label, no score)
- `mdrOption` (Yes/No, no score — a single "Yes" doesn't make MDR-less tools unfair, they're different products)
- `analystLeader` (analyst_leader_note text or "—", no score — not comparable across categories, see Urteil 3)
- `rating` (nullable-safe, `score: (p) => attrNumOrNull(review_score) ?? 0` — same pattern as ai-tools-finance)

### detailRows
`priceNote`, `coreFeaturesNote`, `targetUserNote`, `regulatoryNote` (regulatory_history_note), `reviewNote`, `editorialConsensusNote`

---

## §2 Kandidaten-Seed-Werte (9 Ranked-Kandidaten)

Alle Preise/Reviews/Regulatorik-Fakten unten sind aus dem Source-Matrix übernommen (Quellen dort, Stand 2026-07-04) und tragen dort `confidence: high` oder `medium` — mit Ausnahme des explizit als „editorial estimate, unconfirmed" markierten Bitdefender-Preises (siehe unten + §8).

### 1. CrowdStrike Falcon Go (slug: `crowdstrike`) — **is_top_pick: true**
- segment: `endpoint_edr` · pricing_basis: `per_device_year`
- starting_price_headline: **"$59.99/device/yr (Falcon Go, ≤100 devices)"**
- starting_price_note: "Falcon Go $59.99/device/year (~$7.99/device billed monthly, max 100 devices, 15-day trial). Pro $99.99/yr · Enterprise $184.99/yr · Complete (MDR) quote-based. Device limit + trial terms should get a same-day pricing-page recheck immediately before publish (§8)."
- core_features_note: "Cloud-native single agent, NGAV/ML-based prevention, Threat Graph; EDR/threat-hunting/intel unlock in higher tiers. Editorial consensus: gold-standard detection, but enterprise-oriented — SMBs without dedicated security staff may find it needs more tuning than expected."
- target_user_note: "The brand-name pick for SMBs with some in-house IT/security capability (Falcon Go caps at 100 devices) scaling up to enterprise; not the simplest \"set and forget\" option on this page."
- mdr_option: **true** (Falcon Complete)
- analyst_leader: **true** — "Gartner Magic Quadrant Leader for Endpoint Protection, 7 consecutive reports (furthest right + highest Ability to Execute in 2026); Gartner Peer Insights Customers' Choice 2026."
- clean_incident_record: **false** (the 2024 outage disclosure below)
- review_score: **4.7**, review_count: **3081**, review_source: "Gartner Peer Insights" (short — feeds the compare-matrix cell verbatim as "(3,081 Gartner Peer Insights reviews)")
- review_note: "Endpoint Protection Platforms category, May 2026."
- regulatory_history_note (MANDATORY disclosure, top-pick): "No enforcement action. Disclosure: a faulty Falcon content update caused a global IT outage on July 19, 2024 (airlines, banks, hospitals, 911 lines). As of January 2026: a shareholder lawsuit over the outage was dismissed (Jan 13–14, 2026 — the court found plaintiffs had not shown intent to deceive); Delta Air Lines' lawsuit (~$500M claimed) is still active; a passenger class action was dismissed and is on appeal. This was a service outage, not a data breach — CrowdStrike's core detection business and analyst leadership position were unaffected."
- editorial_consensus_note: "Gartner MQ Leader 7th consecutive year; a fixture of every SMB endpoint-security roundup, always with the same caveat: strong protection, but built for teams with some security capability."
- DB: existing `crowdstrike` row (us, cpa 0, bare homepage URL, tracking_status unverified, `is_affiliate=false` — a bare bookmark, not a real affiliate deal per the source matrix) → CTA `review` (after content fix), `external_url` unchanged.

### 2. Bitdefender GravityZone Small Business Security (slug: `bitdefender`)
- segment: `endpoint_edr` · pricing_basis: `per_device_year`
- starting_price_headline: **"Calculator-priced (per device/yr)"** — no dollar figure seeded (mirrors the Sophos/Check Point SASE treatment; per Fable-5 review, the $32.50 editorial estimate is explicitly flagged "Pflicht-Verifikation" in the source matrix and must not appear on the card/homepage tile until confirmed live)
- starting_price_note: "No official static price page — GravityZone Small Business Security uses a JS pricing calculator. Editorial data point (costbench.com, 2026-04, NOT independently confirmed): 10 devices/1 year list ≈$324.99 (≈$32.50/device/yr); promo pricing has been seen as low as $227.49 but promos are time-limited and not cited as current fact. **Must be confirmed at the live calculator before shipping (§8)** — if confirmed, restore the headline to a real number; if not, keep the calculator-only headline."
- core_features_note: "NGAV + Advanced Threat Control, ransomware mitigation with backup/rollback, fileless-attack protection; web/device control and network attack defense as add-ons. Cloud console, no dedicated SOC staff required to administer."
- target_user_note: "THE \"balance of price and protection\" pick of the 2026 SMB roundups; consistently #1 in AV-TEST/AV-Comparatives detection with very few false positives (test-lab claims, labeled as such, not presented as SmartFinPro's own testing)."
- mdr_option: false
- analyst_leader: false (no named Gartner/G2 leader claim confirmed this pass — avoid an unverified superlative)
- clean_incident_record: **true**
- review_score: **4.6**, review_count: **208**, review_source: "Capterra" — ⚠️ added to §8: re-confirm today's date before shipping (Fable-5 review flagged this was omitted from the original open-items list)
- review_note: "Also cited: TrustRadius 8.3/10 from 185 reviews. Bitdefender's G2 listing is fragmented across separate XDR/MDR product pages, so Capterra is the most citable single figure."
- regulatory_history_note: "No FTC/SEC/DOJ enforcement actions and no vendor data breach found (searched 2026-07-04) — the cleanest record of the endpoint-security group."
- editorial_consensus_note: "2026 SMB roundups (Huntress, defendmybusiness, Simply IT, iFeelTech's head-to-head) consistently name GravityZone the SMB price/value winner."
- DB: no row, no link → `external_url` https://www.bitdefender.com/en-us/business/products/gravityzone-small-business-security, `is_affiliate=false`, CTA `visit`.

### 3. SentinelOne Singularity (slug: `sentinelone`)
- segment: `endpoint_edr` · pricing_basis: `per_device_year`
- starting_price_headline: **"$69.99/endpoint/yr (Core)"**
- starting_price_note: "Sold via authorized partners, for 5–100 workstations. Core $69.99/endpoint/year · Complete $179.99 (full EDR, 14-day data retention) · Commercial $229.99 · Enterprise quote-based. (Control tier price not published on the official site — omitted rather than guessed.)"
- core_features_note: "Single agent, Storyline correlation, autonomous remediation + rollback (SMB-relevant: less analyst time needed than CrowdStrike-style tuning); Purple AI in higher tiers."
- target_user_note: "SMB to enterprise; positioned by SMB roundups as the \"autonomous\" counterpart to CrowdStrike, with lower day-to-day operational overhead."
- mdr_option: false (no distinct SMB-facing MDR product confirmed)
- analyst_leader: **true** — "Gartner Magic Quadrant Leader for Endpoint Protection, 6th consecutive year."
- clean_incident_record: **true**
- review_score: **4.7**, review_count: **2875**, review_source: "Gartner Peer Insights"
- review_note: "Endpoint Protection Platforms category, May 2026."
- regulatory_history_note: "No enforcement actions, no confirmed compromise. Context (not a con, a threat-landscape fact SentinelOne itself disclosed): targeted in 2024/25 by a Chinese reconnaissance campaign (\"PurpleHaze\") and by North Korean fake-IT-worker infiltration attempts — SentinelOne states its own systems were not compromised."
- editorial_consensus_note: "Gartner MQ Leader 6th consecutive year; a fixture of every EDR SMB roundup."
- DB: **no row exists** (plan doc's premise was wrong). Live MDX has a dead `affiliateUrl: /go/sentinelone` (5 uses) → content-fix to `external_url`, `is_affiliate=false`, CTA `review`.

### 4. Sophos Intercept X / Sophos Endpoint (slug: `sophos`)
- segment: `endpoint_edr` · pricing_basis: `quote_based`
- starting_price_headline: **"Quote-based (via partners)"** — no dollar estimate seeded (explicit source-matrix instruction: editorial guesses "NICHT als offizielle Preise seeden")
- starting_price_note: "No public list price — sold through partners with a quote. Editorial estimates (not seeded as fact) put entry pricing around $50–70/user/year with discounts commonly 15–40%."
- core_features_note: "Exploit prevention (60+ techniques), CryptoGuard ransomware rollback, Synchronized Security with Sophos firewalls, centralized Sophos Central console."
- target_user_note: "SMB to mid-market; the managed-detection-and-response (MDR) add-on is the strongest argument for teams without dedicated security staff."
- mdr_option: **true** (MDR is a first-class Sophos offering)
- analyst_leader: **true** — "Gartner Magic Quadrant Leader for Endpoint Protection, 17th consecutive report — the longest active streak in the field; also #1 Overall Endpoint Protection in G2's Spring AND Summer 2026 Grid Reports (plus #1 in EDR/XDR/MDR/Firewall, Spring 2026)."
- clean_incident_record: **false** (firewall-line disclosure below, even though it doesn't touch the ranked product)
- review_score: null, review_count: null, review_source: "Not yet independently rated (G2 Grid Leader status confirmed)"
- review_note: "#1 Overall Endpoint Protection, G2 Spring and Summer 2026 Grid Reports; exact review score and count pending independent confirmation."
- regulatory_history_note: "No enforcement action against Sophos. Context: Sophos XG firewalls were mass-exploited in 2020 via zero-day CVE-2020-12271 (~81,000 devices); the U.S. DOJ charged and OFAC sanctioned the Chinese state-linked actor behind it (Dec 10, 2024, $10M reward offered). Sophos was the victim and disclosed the campaign itself via its \"Pacific Rim\" reports — this affects the firewall product line, not Intercept X/Sophos Endpoint."
- editorial_consensus_note: "Longest-running Gartner MQ Leader streak in endpoint protection (17 reports); G2's #1 overall endpoint protection vendor in 2026."
- DB: no row, no link → `external_url` https://www.sophos.com/en-us/products/intercept-x, `is_affiliate=false`, CTA `visit`.

### 5. 1Password Business (slug: `onepassword` — existing DB slug, keep as-is)
- segment: `password_management` · pricing_basis: `per_user_month`
- starting_price_headline: **"$7.99/user/mo"**
- starting_price_note: "Business $7.99/user/month (annual billing) · Teams Starter Pack $19.95/month flat for up to 10 users · Enterprise quote-based."
- core_features_note: "Vaults/roles/policies, SSO integration (Okta/Azure AD/Google), SCIM provisioning, audit logs, Watchtower breach monitoring; a personal Families account included per employee."
- target_user_note: "SMB to enterprise; widely used business password manager — 180,000+ companies is the vendor's own figure, cited as a vendor claim, not an independent count."
- mdr_option: false (not applicable to this segment)
- analyst_leader: false (no named analyst-leader claim confirmed this pass)
- clean_incident_record: **false** (Okta-adjacent disclosure below, even though no user data was accessed)
- review_score: **4.7**, review_count: **12000**, review_source: "Trustpilot" — the source matrix's own conservative floor ("&gt;12,000") rather than the higher, unconfirmed 12,354 figure (its two cited counts, 9,300+ and 12,354, contradict each other and neither was independently re-verified)
- review_note: "12,000+ Trustpilot reviews (exact count pending profile verification). G2 rating also ~4.7/5 but exact review count was not independently confirmed."
- regulatory_history_note: "No enforcement actions, no user-data breach. Disclosure: on Sept 29, 2023, suspicious activity was detected on 1Password's internal Okta instance, a downstream effect of the broader Okta support-system breach (a stolen HAR file/session cookie). The attack was stopped and 1Password states \"no 1Password user data was accessed\" — disclosed transparently and promptly."
- editorial_consensus_note: "G2 Grid Leader for password managers; standard recommendation across business password-manager roundups (PCMag/Wirecutter consensus); expanded its global partner program in Feb 2026."
- DB: existing `onepassword` row (us, cpa 0, bare homepage URL, tracking_status unverified, `is_affiliate=false` — a bare bookmark per the source matrix), **0 clicks** due to the slug-drift bug in the review's own CTAs (fixed this slice) → CTA `review` after fix.

### 6. Bitwarden (slug: `bitwarden`)
- segment: `password_management` · pricing_basis: `per_user_month`
- starting_price_headline: **"$4/user/mo (Teams)"**
- starting_price_note: "Teams $4/user/month · Enterprise $6/user/month (both annual billing); free tier for individual use; Enterprise includes a Families plan per employee."
- core_features_note: "End-to-end zero-knowledge encryption, open-source codebase (publicly auditable + regular third-party audits), self-hosting option (a real compliance argument), Vault Health Reports, passkeys."
- target_user_note: "Budget- and transparency-focused SMBs; IT teams with a self-hosting requirement."
- mdr_option: false
- analyst_leader: **true** — "#1 Enterprise User Satisfaction in the G2 Grid — 11 consecutive quarters (Satisfaction Score 98)."
- clean_incident_record: **true**
- review_score: null, review_count: null, review_source: "Not yet independently rated (~4.6/5 on G2, count pending)"
- review_note: "#1 Enterprise User Satisfaction in the G2 Grid, 11 consecutive quarters (Satisfaction Score 98); exact review score and count pending independent confirmation."
- regulatory_history_note: "No enforcement actions, no vendor breach found (searched 2026-07-04); annual external security audits are published."
- editorial_consensus_note: "Info-Tech Report Leader (Composite score 9.1); the standard \"best value\" pick across 2026 password-manager roundups."
- DB: no row, no link (the `/go/bitwarden` link referenced in the 1Password review is dead — fixed this slice) → `external_url` https://bitwarden.com/, `is_affiliate=false`, CTA `visit`.

### 7. NordLayer (slug: `nordlayer` — new cockpit candidate, NOT tied to the existing `nordvpn`/`nordvpn-business` affiliate rows)
- segment: `network_sase` · pricing_basis: `per_user_month`
- starting_price_headline: **"$8/user/mo (Lite, min. 5 seats)"**
- starting_price_note: "Lite $8 · Core $11 · Premium $14 per user/month (annual billing; monthly billing up to 22% higher). Minimum 5 seats. Enterprise from $6/user (200+ seats). Dedicated fixed-IP server +$40/month. 14-day money-back guarantee."
- core_features_note: "Encrypted team tunnels, dedicated IPs, DNS filtering (Core+), cloud firewall/device posture/site-to-site (Premium), central admin console. Not a full SASE stack (no full secure web gateway like Check Point SASE)."
- target_user_note: "Small teams (5+ users) up to mid-market; a lower entry hurdle than full SASE platforms like Check Point SASE."
- mdr_option: false
- analyst_leader: false
- clean_incident_record: **false** (parent-company disclosure below)
- review_score: **null**, review_count: **null**, review_source: "Not yet independently rated"
- review_note: "A G2 profile exists; exact score and count pending independent confirmation."
- regulatory_history_note: "No enforcement actions against NordLayer itself. Parent-company disclosure (footnote, not attributed to this product): a rented server in Finland used by NordVPN's consumer product was compromised in March 2018 via the data center's insecure remote management; no activity logs or credentials were taken and the TLS key involved had already expired. Disclosed publicly on Oct 21, 2019 — the delayed disclosure drew criticism. This is a consumer-product incident from the parent company (Nord Security), not a NordLayer incident."
- editorial_consensus_note: "TechRadar Pro (praised its cloud firewall), Cybernews, and a 2026 Security.org review are solid but there's less analyst coverage than the EDR/SASE candidates."
- DB: **no dedicated row.** `external_url` https://nordlayer.com/, `is_affiliate=false` for the cockpit candidate (the existing NordVPN consumer CJ-link must NOT be presented as a NordLayer offer, per the source matrix's explicit warning). `review_slug`: the `nordvpn-business-review` MDX, once content-fixed this slice to actually name and describe NordLayer, CTA `review`.

### 8. Check Point SASE — formerly Perimeter 81 (slug: `perimeter-81` — existing DB slug UNCHANGED, only `partner_name` updates)
- segment: `network_sase` · pricing_basis: `quote_based`
- starting_price_headline: **"Quote-based (via demo)"** — no dollar estimate seeded
- starting_price_note: "No public list price since the Check Point acquisition — self-service pricing ($8/$12 under the old Perimeter 81 brand) was replaced by a demo + TCO-calculator sales motion. Editorial estimates from the Harmony-era (~$10/$15/$20/user/month) exist but are not seeded as current fact."
- core_features_note: "ZTNA with app-level access, IdP integrations (Okta/Entra/SAML), web filtering/SWG, device posture, cloud firewall. The product was substantially expanded after the acquisition (added Check Point's ThreatCloud + SD-WAN stack), not discontinued."
- target_user_note: "Mid-market (50–500 users) with zero-trust needs; losing self-service pricing pushes it closer to an enterprise sales cycle — stated plainly rather than glossed over."
- mdr_option: false
- analyst_leader: false (no independently confirmed named-leader claim this pass)
- clean_incident_record: **false** (parent-company disclosures below)
- review_score: **null**, review_count: **null**, review_source: "Not yet independently rated"
- review_note: "A G2 profile exists under \"Check Point Harmony SASE\"; exact score and count pending independent confirmation."
- regulatory_history_note: "Two parent-company (Check Point) disclosures, neither attributed to the SASE product itself: (a) an Oct 22, 2024 SEC civil settlement — $995,000 penalty for misleading SolarWinds-era cyber-incident disclosures (one of four firms settled that day, including Mimecast); (b) CVE-2024-24919, an actively exploited zero-day in Check Point's classic Quantum Security Gateways/remote-access VPN (April–June 2024, exploited by Qilin ransomware affiliates, prompting a CISA emergency directive) — this affects the Quantum Gateway line, not the Perimeter-81-based SASE product. No enforcement action against the SASE product itself."
- editorial_consensus_note: "Formerly Perimeter 81, acquired by Check Point (closed Sept 13, 2023, ~$490M) and rebranded via Quantum SASE → Harmony SASE → Check Point SASE. Check Point's own product page still titles it \"Check Point SASE - Perimeter 81\"; \"(formerly Perimeter 81)\" is this rollout's recommended editorial label, not a direct quote."
- DB: existing `perimeter-81` row (us, cpa 700 — highest in the table, `https://perimeter81.com/?ref=smartfinpro`, tracking_status unverified), 41 clicks (most recent of any row in this slice), 0 conversions → CTA stays `review` (Gate). Migration updates `partner_name` only; `tracking_status`/`cpa_value` untouched — but the migration's SQL comment must mark `cpa_value=700` as unconfirmed (plausible, in-range, but `?ref=smartfinpro` is not a documented Post Affiliate Pro tracking parameter and no SmartFinPro program registration is evidenced, per source matrix §1.5). Optional (source-matrix-offered, non-blocking): lift `destination_url` to `https://www.perimeter81.com/?ref=smartfinpro` (the `www` subdomain avoids the apex domain's broken IPv6/AAAA records).

### 9. Proofpoint Essentials (slug: `proofpoint`)
- segment: `email_security` · pricing_basis: `per_user_month`
- starting_price_headline: **"~$2.75/user/mo (Business tier, via reseller)"** — ⚠️ added to §8: reseller quote + package names need a same-day recheck before shipping
- starting_price_note: "Proofpoint doesn't publish list prices; reseller-quoted Essentials tiers: Business ~$2.75 · Advanced ~$3.75 · Professional ~$5.33–5.86 per user/month (annual billing). Enterprise-tier Proofpoint products are quote-only. Package names and figures are reseller-sourced (not vendor-published) and should be re-confirmed with a fresh date before shipping."
- core_features_note: "URL/attachment sandboxing, impostor/BEC classification, data-loss prevention (Professional tier), deep threat intelligence as the core differentiator. \"Stopping 99.999% of email threats\" is a vendor claim, cited as such, not stated as fact."
- target_user_note: "Enterprise-first DNA, but its SMB story got materially stronger after completing the $1.8B acquisition of Hornetsecurity (an SMB/MSP-focused email-security vendor) on Dec 8, 2025 — the largest acquisition in Proofpoint's history."
- mdr_option: false
- analyst_leader: **true** — "Gartner Magic Quadrant Leader for Email Security, \"Highest in Execution\" 2nd consecutive year (2025), per Proofpoint's own communication of the MQ result."
- clean_incident_record: **false** (EchoSpoofing disclosure below)
- review_score: null, review_count: null, review_source: "Not yet independently rated (Gartner MQ Leader, email security)"
- review_note: "Shortlist cites Gartner Peer Insights 4.7/1,413 for the email-security category; not independently re-confirmed, so not seeded as a score."
- regulatory_history_note: "No regulator action. Disclosure: \"EchoSpoofing\" (Jan–July 2024) — phishers abused an insecurely-configurable-by-default Microsoft 365 relay setting on Proofpoint customer accounts to send an average of 3M (peak 14M) perfectly SPF/DKIM-signed spoofed emails per day impersonating major brands (Disney, Nike, IBM, Coca-Cola). Fixed with Guardio Labs' help; the insecure default is now deny-by-default with admin visibility. This was a configuration-design weakness, not a breach of Proofpoint's own systems. Ownership: Thoma Bravo (private, $12.3B take-private, 2021); an IPO is reportedly being explored."
- editorial_consensus_note: "Gartner MQ Email Security Leader (\"highest in execution\", 2025); editorial consensus: strongest threat-intel depth, enterprise-first — for SMB/mid-market, Mimecast has historically offered comparable protection at a lower price (see buyerGuide)."
- DB: existing `proofpoint` row (us, cpa 0, bare homepage URL, tracking_status unverified, `is_affiliate=false` — a bare bookmark per the source matrix), 11 clicks (from ca/uk/au review pages — **no US review MDX exists**) → `external_url`-based `visit` CTA, **no `review_slug`** (no US content to link to).

---

## §3 Verdict (Segment-Picks, keine forcierte "Best Overall" außer dem separaten is_top_pick-Flag)

```
intro: "Nine tools, four security layers — endpoints, passwords, network access, and email. Most SMBs need one tool per layer, not a single winner. Our top pick, CrowdStrike, is the strongest analyst-backed choice on this page — but it leans enterprise; smaller teams without dedicated security staff may prefer Bitdefender."
picks:
- crowdstrike     "Best overall / best brand-name EDR"
- bitdefender     "Best endpoint protection for most SMBs"
- sentinelone     "Best autonomous EDR"
- sophos          "Best with a managed MDR option"
- onepassword     "Best business password manager"
- bitwarden       "Best value password manager"
- nordlayer       "Best business VPN/ZTNA entry point"
- perimeter-81    "Best full SASE platform" (label reads "Check Point SASE")
- proofpoint      "Best email security"
```

## §4 Methodology (Pflichtabsatz, per Urteil 3)

"These nine tools protect four different layers of a small business — endpoints, passwords, network access, and email — so we don't force them into a single price-based ranking. \"Starting price\" shows each vendor's cheapest SMB-suitable plan in its own unit (per device or per user, per year or per month) alongside a \"pricing basis\" label; these are not like-for-like dollar figures, and two vendors (Sophos, Check Point SASE) only sell through a sales-assisted quote. We rank within each of the four segments using analyst consensus (Gartner Magic Quadrant, G2 Grid), a credible review sample where one exists, and editorial roundup consensus — not a cross-category cost comparison. Where a candidate lacks a credible, independently confirmed review score (Sophos, Bitwarden, NordLayer, Check Point SASE, Proofpoint), we say so rather than borrow an unrelated number. Even top-rated vendors have had real incidents — from CrowdStrike's July 2024 global outage to SEC settlements against Check Point and Mimecast — and we disclose them on the relevant cards rather than omit them."

## §5 BuyerGuide (draft h3/body)

1. **"Why isn't there one overall winner?"** — the four-segments-not-one-hierarchy explainer (mirrors ai-tools-finance's equivalent entry).
2. **"Proofpoint vs. Mimecast: when the cheaper, simpler option wins"** — Mimecast coverage (G2 4.3/~470 at the seller level — matrix-verified; the Gartner 4.5/710 figure from the shortlist is NOT independently confirmed and is omitted rather than cited with a hedge; SEC $990k settlement Oct 2024; 2021 SVR/NOBELIUM certificate compromise) framed against Proofpoint's post-Hornetsecurity SMB story; explicit "no SmartFinPro link or content exists for Mimecast" disclosure.
3. **"Layer your defenses"** — why an SMB typically needs at least 2–3 of these categories together, not a single tool.
4. **"CrowdStrike's July 2024 outage, explained"** — factual timeline + current litigation status, linked from the top-pick card's disclosure box.
5. **"Microsoft Defender for Business: the bundled option"** — brief mention that it ships with Microsoft 365 and shows up in every SMB roundup; not a ranked candidate here (no SmartFinPro content or link).

## §6 FAQ (≥5 items)

1. Why are there no price comparisons across all nine tools?
2. Which of these tools has a managed (MDR) option if I don't have in-house security staff? (Sophos, CrowdStrike Falcon Complete)
3. Is Check Point SASE the same product as Perimeter 81? (yes — acquired Sept 2023, renamed twice since, same underlying platform, expanded feature set)
4. Are any of these affiliate links? (Check Point SASE, formerly Perimeter 81, has an affiliate relationship in our system. But no click from this page is currently attributed as a paid referral — every button on this page resolves to a review or a plain visit link, and rankings never depend on commissions.)
5. Why doesn't this page include Mimecast or Microsoft Defender as ranked candidates?
6. Has any tool on this page had a security incident? (yes — disclosed per-candidate, see regulatory notes above; a security vendor having a disclosed incident is common in this industry and is not treated as disqualifying unless it's a pattern of enforcement action, per this rollout's established Aura/Freedom precedent.)

## §7 Compliance

```
notice: "Cybersecurity tools are not regulated financial products, and no financial regulator endorses these rankings. Even top-rated vendors have had real incidents — from CrowdStrike's July 2024 global outage to breaches and SEC settlements at security vendors themselves. Layer your defenses, and verify current SOC 2/ISO 27001 attestations directly with each vendor before buying."
regulators: []
```

---

## §8 Offene Pre-Seed-Punkte (NICHT geseedet, für Fable-5-Review + spätere Live-Nachprüfung)

Diese Felder sind absichtlich mit `null`/konservativem Platzhalter-Text seeded, nicht mit einer erfundenen Zahl, weil die geplante Zweit-Verifikation am Session-Limit scheiterte:

1. NordLayer G2-Score+Anzahl (strukturell `low` laut Source-Matrix — bleibt `null`, bis erhoben)
2. Check Point SASE G2-Score+Anzahl (strukturell `low` — bleibt `null`)
3. Sophos G2-Score+Anzahl (Grid-Platzierung ist belegt, exakte Zahl offen — bleibt `null`)
4. Bitwarden G2-Anzahl (Grid-Platzierung/Satisfaction-Score belegt, exakte Review-Anzahl offen — bleibt `null`)
5. Bitdefender Kalkulator-Preis (nur Listenpreis-Editorial-Schätzung geseedet, als solche gekennzeichnet — Promo-Preis explizit NICHT geseedet)
6. 1Password Trustpilot-Anzahl (Quellen widersprüchlich, 9.300+ vs. 12.354 — höhere Zahl vorläufig übernommen, vor finaler Migration erneut prüfen)
7. Proofpoint/Mimecast Gartner-Peer-Insights-Zahlen (Shortlist-Zahlen nicht unabhängig bestätigt — Proofpoint-Score/Count bleibt `null`, Mimecast-Gartner-Zahl wird NICHT im buyerGuide zitiert, nur die matrixverifizierte G2-4.3/~470-Zahl)
8. SentinelOne Control-Tarif-Preis (auf offizieller Seite nicht ausgewiesen — bewusst weggelassen statt geraten)
9. **(Fable-5-Review-Ergänzung)** Bitdefender Capterra 4,6/208 — tagesaktuell bestätigen (Checkliste Punkt 9); bis dahin bleibt der bereits im Source-Matrix zitierte Stand geseedet, aber als Re-Check markiert.
10. **(Fable-5-Review-Ergänzung)** Proofpoint Essentials Reseller-Preise ($2.75/$3.75/$5.33–5.86) + Paketnamen — an Reseller-Quelle mit frischem Datum fixieren (Checkliste Punkt 3), bevor die Headline final geht.
11. **(Fable-5-Review-Ergänzung, Pre-Publication-Checks ohne Seed-Änderung)** Falcon-Go-Gerätelimit (≤100) + 15-Tage-Trial-Terms am Tag der Veröffentlichung nochmal auf der Pricing-Seite gegenchecken (Checkliste Punkt 13); Delta-v-CrowdStrike-Verfahrensstand unmittelbar vor Publikation prüfen, Formulierung darf nicht präjudizieren (Checkliste Punkt 12).

**Empfehlung für den Fable-5-Reviewer:** Prüfen, ob die obigen Platzhalter/`null`-Werte für einen Ranked-Live-Launch ausreichen (das Source-Matrix-Dokument selbst sagt: das Feld ist "ranked-fähig", strukturell `low` sind nur Punkte 1–2 + die quote-basierten Preisschätzungen) — oder ob eine weitere Verifikationsrunde vor der Migration zwingend ist, insbesondere für Punkt 5 (Bitdefender) und 6 (1Password), da beide einen sichtbaren Zahlenwert auf der Karte zeigen würden.

---

## §9 Content-Fix-Aufgaben (US-Scope, User-bestätigt)

Alle Fixes NUR an den US-Dateien; ca/uk/au-Kopien + die 3 nicht-US Proofpoint-Reviews werden per `spawn_task` als Folgetask geflaggt, nicht in diesem Slice angefasst.

**(Fable-5-Review-Ergänzung, gilt für ALLE 5 Dateien unten, nicht nur Item 1):** Experts-DB-Abgleich der Reviewer-Identität (Checkliste Punkt 15 — "James Miller, CFP, CISSP" / "James Mitchell, CISSP, CISM" u. a. gegen die `/integrity`-Namensliste prüfen, Memory: [[expert-identity-db-source]]) ist für jede der 5 US-Reviews fällig, nicht nur für perimeter-81.

1. **`perimeter-81-review.mdx`**: Rebrand auf "Check Point SASE (formerly Perimeter 81)" (Titel, H1, Pricing-Sektion → "Quote-based, editorial ~$10+/user/mo", Plan-Tabelle, Competitor-Tabelle); Preise $8/$12 raus; `reviewCount: 1847` (unbelegt) raus oder durch echte Zahl ersetzen (aktuell keine echte verfügbar → Feld entfernen/neutral formulieren); "ISO 27001 in progress (expected 2026)" als stale kennzeichnen oder entfernen (nicht ohne Trust-Center-Check neu behaupten); fabrizierte 60-Tage-Test-Metriken/Umfragezahlen entfernen; Experten-Identität "James Miller, CFP, CISSP" gegen `experts`-DB abgleichen (Memory: [[expert-identity-db-source]]); CTA-Text auf neue Marke anpassen (Row/Link bleiben funktional).
2. **`sentinelone-review.mdx`**: `affiliateUrl: /go/sentinelone` (5×) → `external_url`-Strategie (keine DB-Row vorhanden); Complete-Preis $159.99 → $179.99; `reviewCount: 800` (unbelegt) entfernen, UND den gleichen unbelegten "G2 4,8/5 (800+)"-Claim im Fließtext neutralisieren, nicht nur im Frontmatter (Fable-5-Review-Fund); toter `/go/microsoft-defender`-Competitor-Link fixen (externe URL statt totem `/go`).
3. **`crowdstrike-review.mdx`**: Preisgerüst korrigieren (Go $59.99 / Pro $99.99 / Enterprise $184.99 statt der unbelegten "$69–$159"/"$299–$499" Spannen); tote `/go/sentinelone` + `/go/microsoft-defender` Competitor-Links fixen; `reviewCount: 800` (unbelegt) entfernen; Outage-Rechtslage aktualisieren (Shareholder-Klage-Abweisung Jan 2026 ergänzen); Umsatz-/Kundenzahlen ("$5.4B" u. Ä.) tagesaktuell gegenprüfen, nicht ungeprüft übernehmen (Fable-5-Review-Fund).
4. **`1password-business-review.mdx`**: `affiliateUrl: /go/1password` (5×) → **`/go/onepassword`** (Slug-Drift-Fix, schaltet die bestehende CTA-Strecke live frei); tote `/go/bitwarden` + `/go/dashlane` Competitor-Links fixen; Trustpilot "4.5" → "4.7" (Anzahl siehe §8, konservativ formulieren).
5. **`nordvpn-business-review.mdx`**: NordLayer-Rebrand nachtragen (Produkt heißt seit Sept 2021 so, aktuell null Erwähnungen); `affiliateUrl: /go/nordvpn` → **`/go/nordvpn-business`** (Slug-Drift-Fix — die Row existiert, zeigt aber technisch weiter auf den Consumer-CJ-Deeplink; das Ziel-URL-Problem selbst bleibt ein Monetarisierungs-Folgetask, hier wird nur die CTA korrekt auf die eigene Row umgestellt). **Offene Entscheidung (Fable-5-Review, non-blocking, bewusst abzusegnen statt automatisch zu ändern):** nach dem Rebrand führt ein "Get NordLayer"-Klick technisch weiter auf den branchenfremden Consumer-NordVPN-CJ-Link. Option: `destination_url` der `nordvpn-business`-Row in derselben Migration auf `https://nordlayer.com/` heben (reines Ziel-Update, `tracking_status` unberührt, gleiches Muster wie die optionale Perimeter-81-www-Korrektur) — der CJ-Link hat ohnehin 0 Conversions. Wird bei Implementierung explizit entschieden, nicht automatisch übernommen.
6. **`index.mdx`** (us cybersecurity): tote `/go/1password-business` + `/go/cisco-anyconnect` fixen; 6× `/go/nordvpn` prüfen (Consumer-Link, ggf. bewusst so lassen falls thematisch passend); unbelegten "18 Lösungen über 4 Monate getestet"-Claim entfernen/neutralisieren; nach Cockpit-Launch internen Link auf `/us/cybersecurity/best/cybersecurity-smb` ergänzen.
7. **`best-perimeter-81-review-2026.mdx.draft`**: löschen (unausgefülltes Genesis-Skelett, nie publiziert).

**Folgetasks (spawn_task nach Slice-Abschluss):**
- Markt-Varianten (ca/uk/au) derselben 5 Reviews + die 3 nicht-US Proofpoint-Reviews — gleiches Fabrikations-Muster, nicht in diesem Slice gefixt.
- Check-Point-SASE-Affiliate-Programm-Registrierung (Post Affiliate Pro) für einen echten Tracking-Link.
- 1Password-CJ-Programm-Anbindung ($2 + 25% Jahr 1).
- NordLayer-eigenes Affiliate-Programm (bis 50% Rev-Share) statt des branchenfremden Consumer-CJ-Links.
