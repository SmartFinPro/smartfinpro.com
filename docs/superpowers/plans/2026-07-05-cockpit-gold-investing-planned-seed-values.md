# Planned Seed Values: Best Gold Investing Platforms (US) — Comparison Cockpit Slice 9

> Stand: 2026-07-05 · Übersetzt die Fable-5-Recherche (`2026-07-05-cockpit-gold-investing-source-matrix.md` + eine Live-Profil-Verifikationsrunde) in ein konkretes `TopicConfig` + Migrations-Plan. Topic: `gold-investing/platforms` (bereits in `manifest.ts` registriert). Vor Implementierung: Fable-5-Pre-Migration-Review.
>
> **Live-Verifikation abgeschlossen (echter Chrome-Browser, 2026-07-05):** Alle 10 Review-Profile (Trustpilot/Shopper Approved/BBB) + 3 Fee-Detailfragen wurden live nachgeprüft. Ergebnis: **alle 6 Trustpilot-Zahlen aus der ursprünglichen Recherche lagen daneben** (Score und/oder Count) — die unten verwendeten Zahlen sind die frisch verifizierten, nicht die aus der Matrix. Eine Korrektur ist besonders wichtig: der APMEX-Trustpilot-„1,6–1,8"-Kontrast aus der Matrix ist selbst stale — live zeigt das Profil **4,2/5 aus 9.267 Reviews**. Die „Google 4,9/6.177"-Zahl der Matrix matcht kein aktuelles Profil und wird NICHT geseedet.

---

## §0 Entscheidungen dieser Session (Owner-Fragen aufgelöst)

1. **Content-Fix-Scope (User-Entscheidung, AskUserQuestion):** „Vollen Umfang jetzt fixen" — alle 4 Bestandsreviews (Goldco, APMEX, JM Bullion, Silver Gold Bull) + `index.mdx` werden in diesem Slice vollständig bereinigt (Umfang wie Slice 8): erfundene Testmethodik entfernen, Zahlen korrigieren, Goldpreis aktualisieren, tote CTAs fixen, Disclosures ergänzen, Reviewer-Namen auf den echten `/integrity`-Roster ziehen.
2. **Silver Gold Bull:** Top-9-Ausschluss bestätigt (kein 2026er-Editorial-Ranking listet es) — buyerGuide-Absatz statt Ranked-Slot (Mimecast-/Truewind-Muster). Dead-Link-Reparatur (CJ-Dashboard) bleibt Owner-Folgetask, `tracking_status`/`destination_url` der `silvergoldbull-us`/`-ca`-Rows werden in dieser Migration NICHT angefasst.
3. **`is_top_pick` (Steuerungs-Session-Entscheidung):** **Augusta Precious Metals** — einzige BBB-0-Beschwerden-Bilanz der Kategorie (3 Jahre), kein Verfahren/Settlement, mehrjährige (wenn auch vendor-zitierte) Investopedia-Anerkennung. Pflicht-Auflage (doppelte Ehrlichkeits-Klausel, CrowdStrike-Slice-8-Präzedenz): $50.000-Mindestanlage MUSS im ersten Satz des Verdicts stehen + Investopedia-Claim als „vendor-cited recognition", NICHT als „consensus #1" (Money.coms aktueller Best-Overall ist Allegiance Gold, kein Kandidat dieser Liste).
4. **Exclusion vs. Disclosure:** kein Kandidat erreicht die Lexington-Law-Ausschluss-Schwelle. Vier Disclosure-Fälle (Freedom-/Experian-Muster): American Hartford Gold (härtester Fall — MSNBC-Exposé + Kiesel-Law-Investigation + dokumentiertes Markup-Muster), SD Bullion (aktive False-Advertising-Klasse-Klage seit 07/2025 — keine „lowest price"-Claims übernehmen), Goldco (TCPA-Settlement $2 Mio., final 03/2026), JM Bullion (2020-Datenpanne, settled).
5. **Review-Seeding-Sonderfälle:** Money Metals Exchange seedet BBB-Basis (4,31/5, 128 Reviews) statt der schwachen/polarisierten Trustpilot-Zahl (3,6/5, 236 — in `review_note` als Kontrast erwähnt). APMEX seedet Shopper Approved (4,9/5, 266.837) als primäre Zahl; der Trustpilot-Kontrast wird korrekt als 4,2/5 (nicht 1,6–1,8) in `review_note` offengelegt.
6. **Kostenmodell:** neutralisiertes `banking`-Kind (Slice-7/8-Präzedenz, null Shared-Code-Änderung) — zwei ökonomisch inkompatible Preismodelle (IRA-Flat-Fees + nicht-publizierte Telefon-Premiums vs. Live-Online-Premiums ohne Kontogebühren) machen einen ehrlichen Kosten-Sieger unmöglich. `monthly_fee = 0` für alle 9, reale Preisstruktur nur als Text-Spalten.
7. **Quellen-Hygiene:** Love Gold, Pierce Points, Gold Advisor, IRAEmpire, WireDaily, SHSMF, Havelock sind bezahlte Newswire-/Affiliate-PR und werden in KEINEM sichtbaren Text (verdict/methodology/buyerGuide/FAQ) als Beleg zitiert.
8. **Kandidaten-Feld:** 9 Ranked-Kandidaten (5 Gold-IRA-Spezialisten, 4 Online-Bullion-Dealer). Silver Gold Bull nur buyerGuide.

---

## §1 TopicConfig-Grundgerüst

```ts
slug: 'platforms',
category: 'gold-investing',
label: 'Gold Investing Platforms',
publishedDate: '2026-07-05',
```

`h1`: `Best gold investing platforms in ${y}`
`metaTitle`: `Best Gold Investing Platforms (${y}) — Compared & Ranked`
`metaDescription`: `Compare the best gold IRA companies and online bullion dealers of ${y} — fees, storage, minimums, and real complaint history, sourced and honest about what each business model actually costs.`
`intro`: "Independent, side-by-side comparison of gold IRA specialists and online bullion dealers — two genuinely different businesses that both get called \"gold investing,\" with real fee and complaint-history differences worth knowing before you call anyone."

### Zod-Schema (`attributes` JSONB)

```ts
export const goldInvestingAttributesSchema = z.object({
  segment: z.enum(['gold_ira_specialist', 'online_bullion_dealer']),
  starting_price_headline: z.string(), // short, feeds specColumn + homepage tile
  starting_price_note: z.string(), // full detail, detailRow only
  min_investment_note: z.string(), // e.g. "$50,000 (IRA & cash)" or "No account minimum"
  min_investment_usd: z.number(), // real numeric minimum in dollars, CASH floor where an IRA/cash split exists (e.g. Goldco: 3500, not its 25000 IRA floor) — feeds the "Lowest minimum" sort/chip without re-parsing prose
  storage_note: z.string(),
  core_features_note: z.string(),
  target_user_note: z.string(),
  founded_year: z.number(),
  bbb_rating_note: z.string(), // e.g. "A+, 0 complaints/3yr" — BBB is a regulator-adjacent source, not a review score
  analyst_leader: z.boolean(), // true only for a verified, named, non-paid-PR editorial recognition
  analyst_leader_note: z.string().optional(),
  clean_incident_record: z.boolean(), // drives the matcher directly, not just prose
  review_score: z.number().nullable(),
  review_count: z.number().nullable(),
  review_source: z.string(),
  review_note: z.string().optional(),
  regulatory_history_note: z.string(),
  editorial_consensus_note: z.string(),
}).passthrough();
```

`review_score`/`review_count` nullable — reuses the Slice-8 nullable pattern + shared-UI `reviewCount === 0` guard (zero additional shared-code change; no candidate in this slice actually needs `null` since all 9 have a seedable review basis, but the schema stays consistent with sibling topics for future-proofing and because Silver Gold Bull's buyerGuide mention references the same pattern).

### specColumns (no winner on any — heterogeneous field, matches Slice 7/8 precedent)

1. **Segment** — Gold IRA specialist / Online bullion dealer. No winner.
2. **Starting price** — `starting_price_headline`. No winner (two incompatible pricing models).
3. **Min. investment** — `min_investment_note`, `sortKey: 'minInvestment'` (drives the "Lowest minimum" priorityChip/sortOption off `min_investment_usd`). No winner highlight (a lower minimum isn't universally "better" — it's a fit question).

### filters
- `ira` — segment === 'gold_ira_specialist'
- `dealer` — segment === 'online_bullion_dealer'
- `cleanRecord` — `clean_incident_record === true`
- `analystRecognized` — `analyst_leader === true`

### priorityChips
- Best gold IRA → sort `ira`, icon `Landmark`
- Best online dealer → sort `dealer`, icon `ShoppingCart`
- Lowest minimum → sort `minInvestment`, icon `TrendingDown`
- Top rated → sort `rating`, icon `Star`

### matcher (3 questions, mirrors Slice 7/8's 3-question structure)
1. "What are you looking to do?" (weight 16) → segment match (`ira` → gold_ira_specialist, `dealer` → online_bullion_dealer)
2. "How much are you looking to invest?" (weight 10) → two bands keyed directly off the numeric `min_investment_usd` field (no prose-parsing, no per-candidate hardcoding): `under_50k` → `matched: true` when `min_investment_usd < 50000` (8 of 9 candidates qualify — every candidate except Augusta clusters between $0 and $5,000); `50k_plus` → `matched: true` for all 9 (a $50k+ budget clears every candidate's floor, including Augusta's). This honestly reflects the real distribution: Augusta is the sole $50,000-minimum outlier in this field: everyone else sits at $0-$5,000, so a finer 3-band split would not change any candidate's match outcome.
3. "Prefer a company with no regulatory or legal disclosures on record?" (weight 8) → reads `clean_incident_record`; neutral (`matched:true`) when answer is 'no'/doesn't matter.

### sortOptions
`smart` (p.score), `ira`/`dealer` (segment-boosted + p.score), `minInvestment` (ascending on `min_investment_usd`), `rating` (`(attrNumOrNull(review_score) ?? 0) * 100 + p.score`).

### costModel
```ts
costModel: {
  kind: 'banking',
  amountLabel: 'Representative usage', // ignored — matches Slice 7/8 precedent
  amountMin: 0, amountMax: 0, amountStep: 1, amountDefault: 0,
  yearsLabel: 'Time horizon (years)',
  yearsMin: 1, yearsMax: 5, yearsDefault: 3,
},
```
All 9 candidates seed `monthly_fee = 0` (uniform, inert) — same fix class the Slice-7/8 pre-migration reviews found; applied preventively here from the start.

### compareRows
- `price` (starting_price_headline, no score)
- `segment` (label, no score)
- `minInvestment` (min_investment_note, no score — see matcher note on fit-not-quality)
- `storage` (storage_note, no score)
- `bbbRating` (bbb_rating_note, no score — BBB is regulator-adjacent, not comparable across differing complaint volumes without context, kept informational)
- `rating` (nullable-safe, `score: (p) => attrNumOrNull(review_score) ?? 0` — same pattern as Slice 7/8; no candidate is actually null this slice, but the accessor stays defensive)

### detailRows
Seven rows, one per schema field that isn't already a compareRow: `priceNote` (starting_price_note), `storageNote` (storage_note, full detail — distinct from the short compareRow storage summary), `coreFeaturesNote` (core_features_note), `targetUserNote` (target_user_note), `regulatoryNote` (regulatory_history_note), `reviewNote` (review_note), `editorialConsensusNote` (editorial_consensus_note). `founded_year` + `bbb_rating_note` render together as one composed sentence inside `storageNote`'s neighboring card region (component-level string composition at render time, not an 8th schema field or detailRow).

---

## §2 Kandidaten-Seed-Werte (9 Ranked-Kandidaten)

Alle Preise/Reviews/Regulatorik-Fakten unten kombinieren die Source-Matrix (Stand 2026-07-04/05) mit der Live-Profil-Verifikation (2026-07-05, s. Kopfnotiz).

### 1. Augusta Precious Metals (Beverly Hills CA / Casper WY) — **is_top_pick: true**
- segment: `gold_ira_specialist` · min_investment_usd: **50000**
- starting_price_headline: **"Phone-quoted premiums; ~$180-230/yr IRA fees"**
- starting_price_note: "No published price list — 1:1 phone consultation required for any product quote. Standard (non-promo) IRA fees: $50 setup + $30 wire one-time, then ~$80/yr custodian (Equity Trust) + ~$100-150/yr storage ≈ $180-230/yr. A recurring \"fees waived up to 10 years\" promo is advertised in Augusta's own affiliate materials — cited as a vendor claim, not seeded as the guaranteed standard rate."
- min_investment_note: "$50,000 (IRA and cash purchases) — the highest minimum in this comparison"
- storage_note: "Custodian: Equity Trust (recommended). Depository: Delaware Depository, multiple locations, segregated or commingled storage available."
- core_features_note: "Lifetime customer-support commitment, 1:1 web conference with a Harvard-trained economist (vendor-described positioning), buyback program (no guaranteed price), 7-day return window for first-time buyers (confirm current terms directly)."
- target_user_note: "Well-capitalized retirees ($50k+) who want maximum process hand-holding and value a genuinely clean complaint record over the lowest possible entry point."
- founded_year: 2012, bbb_rating_note: "A+, 0 complaints in 3 years (BBB) — the cleanest record in this comparison; BCA rated AAA."
- analyst_leader: **true** — analyst_leader_note: "Investopedia has repeatedly cited Augusta for pricing transparency across multiple years — a vendor-cited recognition, not an independent-consensus \"#1\" ranking (as of mid-2026, Money.com's own current top pick in this category is a different company)."
- clean_incident_record: **true**
- review_score: **4.8**, review_count: **350**, review_source: "Trustpilot"
- review_note: "Smallest Trustpilot sample in this comparison (350 reviews) alongside the cleanest BBB record — both facts shown together rather than letting the small sample stand alone."
- regulatory_history_note: "No enforcement action, no class action found. Disclosure: Joe Montana has been a paid brand ambassador since 2020 (disclosed by Augusta itself) — standard for this industry's celebrity-endorsement marketing pattern, not a red flag on its own."
- editorial_consensus_note: "Multi-year Investopedia pricing-transparency recognition (vendor-cited); consistently listed among gold IRA companies in mainstream comparison coverage, though not the current top pick in every list."

### 2. Goldco (Calabasas CA)
- segment: `gold_ira_specialist` · min_investment_usd: **3500**
- starting_price_headline: **"Phone-quoted premiums; ~$200-250/yr ongoing (higher year 1)"**
- starting_price_note: "No published price list. IRA fees: $50 setup + $30 wire (one-time, first year only), then $100/yr maintenance + $100-150/yr storage ≈ $200-250/yr ongoing — first-year total (including the one-time setup/wire) runs roughly $280-330 (editorial consensus; do not use the older \"$230-300\" figure, which predates this breakdown). A \"free silver\" promotion (5% back on purchases $50k+, 10% on $100k+) is advertised — economically, this is priced into the metal markup rather than a genuine discount, and should be framed that way in copy, not as free money."
- min_investment_note: "$25,000 IRA rollover / $3,500 cash purchase"
- storage_note: "Custodian: Equity Trust (preferred). Depositories: Delaware Depository and Brink's Global Services (Lloyd's-insured)."
- core_features_note: "401(k)/IRA rollover guidance, buyback program (\"highest price buyback\" is a vendor claim), education library, IRS 408(m)-compliant metal selection."
- target_user_note: "Rollover customers with $25k+ who want an established, heavily-marketed brand and are comfortable with phone-based sales."
- founded_year: 2006, bbb_rating_note: "A+, 59 complaints in 3 years (all answered) — a meaningful volume that scales with Goldco's larger customer base, though lower than American Hartford Gold's complaint count in this comparison."
- analyst_leader: **false** — no verified non-paid-PR editorial \"#1\" recognition found; Goldco's most-cited superlatives trace back to paid newswire PR (Love Gold, Pierce Points), which this rollout does not treat as citable.
- clean_incident_record: **false** (TCPA settlement below)
- review_score: **4.4**, review_count: **1786**, review_source: "Trustpilot"
- review_note: "Reviewed 4.4/5 from 1,786 Trustpilot reviews; ConsumerAffairs shows a higher 4.8, illustrating how much these scores can vary by platform."
- regulatory_history_note: "No enforcement action, no product-quality finding. Disclosure: a $2,000,000 TCPA class-action settlement was finally approved March 26, 2026 (Summerton v. Goldco Direct LLC, W.D. Wis. 3:23-cv-238) over marketing text messages sent to Do-Not-Call-registered numbers after opt-out. This is a marketing-practice violation, not a finding about metal pricing or IRA handling — but it fits this industry's broader pattern of aggressive sales outreach and belongs on the card."
- editorial_consensus_note: "Widely marketed brand with strong paid-PR presence (Love Gold, Pierce Points — not independently verifiable rankings); genuine editorial-list membership exists but without a distinct \"#1\" claim that holds up to verification."

### 3. American Hartford Gold (Los Angeles CA)
- segment: `gold_ira_specialist` · min_investment_usd: **5000**
- starting_price_headline: **"Phone-quoted premiums; ~$175-280/yr editorial estimate"**
- starting_price_note: "No published fee structure on AHG's own site (confirmed via live check, 2026-07-05) — AHG states only that \"every custodian has its own fee structure.\" Two editorial estimates exist and don't fully agree: an older component-based estimate of $175-280/yr (from $75-125/yr custodian + $100/yr storage + $50-100/yr for segregated storage), and a live-checked comparisun.com estimate (2026-07-05) of $180-250/yr all-in. First-year-fee-waiver promotions are commonly advertised (\"100% free IRA rollover\" marketing is a waiver promo, not a permanently free account). Treat any specific dollar breakdown as an editorial estimate, not a confirmed structure — no official source publishes one."
- min_investment_note: "$10,000 IRA / $5,000 cash purchase"
- storage_note: "Custodian: Equity Trust (primary). Storage in \"approved depositories\" (Delaware Depository among them; confirm current full list directly)."
- core_features_note: "Price-match and satisfaction claims, buyback commitment, choice of physical delivery or IRA placement. Bill O'Reilly is a paid, multi-year exclusive endorser (disclosed)."
- target_user_note: "First-time gold IRA buyers with $10-50k who want a mid-range entry point among the IRA specialists — but should insist on standard bullion only and get any markup in writing (see regulatory disclosure)."
- founded_year: 2015, bbb_rating_note: "A+ accredited, 93 complaints in 3 years — the highest complaint volume in this comparison."
- analyst_leader: **true** — analyst_leader_note: "CNBC Select has named AHG among gold IRA companies with some of the lowest advertised fees in the category (2026)."
- clean_incident_record: **false** (documented complaint pattern below)
- review_score: **4.7**, review_count: **1693**, review_source: "Trustpilot"
- review_note: "Also cited: Google 4.8/1,604, ConsumerAffairs 4.8/1,134 — broadly consistent with the Trustpilot figure."
- regulatory_history_note: "No enforcement action, no certified class action — but the most documented warning pattern in this comparison. A 2023 MSNBC investigative piece named AHG alongside other gold-IRA sellers over sales tactics targeting older, conservative-leaning consumers via targeted Facebook ads and fear-based scripts. A documented complaint pattern describes sales staff steering customers from standard bullion toward \"specialty\" or \"exclusive\" coins carrying alleged 45-100% markups, with buyback losses reported in some cases. Kiesel Law LLP announced an investigation into potential FTC/CFTC-relevant undisclosed spreads in October 2023 — an investigation, not a filed lawsuit, and no charges have resulted. We disclose this directly rather than omit it: if you work with AHG, insist on standard bullion products and get any markup in writing before purchasing."
- editorial_consensus_note: "CNBC Select \"lowest fees\" pick (2026); Inc. 5000 honoree (2024) — a real growth signal, not a product-quality rating."

### 4. Birch Gold Group (Burbank CA)
- segment: `gold_ira_specialist` · min_investment_usd: **5000**
- starting_price_headline: **"Phone-quoted premiums; ~$235/yr average IRA fee"**
- starting_price_note: "No published price list for metal premiums. Birch's own FAQ page confirms: \"total annual custodial fees typically average around $235 per year,\" with the first year's fees covered for accounts over $50,000 (both live-verified, 2026-07-05). Itemized setup/wire/storage/management line items are no longer published as a fixed schedule — treat only the $235/yr average and the $50k waiver as confirmed facts."
- min_investment_note: "$5,000 (confirmed via live FAQ check, 2026-07-05 — lower than the $10,000 figure some older sources still cite)"
- storage_note: "Depositories: Delaware Depository, Brink's. Custodians include Equity Trust and GoldStar (confirm current full list directly)."
- core_features_note: "Publishes a real average annual fee figure (rare in this segment), education-focused sales process, buyback program."
- target_user_note: "Cost-conscious IRA beginners who want to see a real number before the sales call, not just \"call for pricing\" — and, at $5,000, the lowest confirmed IRA minimum among the five specialists in this comparison."
- founded_year: 2011 (per Birch's own live FAQ page, "in business since 2011" — confirmed 2026-07-05; supersedes an older, unverified "since 2003" claim found in some third-party content and NOT used here), bbb_rating_note: "A+, accredited since 2013, only 10 complaints in 3 years — one of the cleaner complaint records among the IRA specialists."
- analyst_leader: **true** — analyst_leader_note: "Cited in mainstream comparison roundups (e.g. Yahoo Finance) specifically for publishing its fee structure, a genuine differentiator versus phone-only-quote competitors."
- clean_incident_record: **true** (a labor-practices class settlement and a website-accessibility suit exist but are unrelated to customer/investment conduct — noted in regulatory_history_note, not treated as a customer-facing incident)
- review_score: **4.5**, review_count: **301**, review_source: "Trustpilot"
- review_note: "Also cited: BBB customer reviews 4.8/71 (separate from the BBB complaint count above), Google 4.7/430+, ConsumerAffairs 4.8/114."
- regulatory_history_note: "No enforcement action, no investment-related lawsuit found. Unrelated footnotes: a $500,000 employment-practices class settlement (workplace conditions, not customers) and a 2025 website-accessibility lawsuit (Mitchell v. Birch) — neither concerns metal pricing, IRA handling, or customer funds."
- editorial_consensus_note: "Consistently described in mainstream roundups as transparent about its fee structure — a claim that matches its own published $235/yr average, unlike most IRA-specialist competitors."

### 5. Noble Gold Investments (Encino CA)
- segment: `gold_ira_specialist` · min_investment_usd: **2000**
- starting_price_headline: **"Phone-quoted premiums; $275/yr flat IRA fee"**
- starting_price_note: "No published price list for metal premiums. Noble's own support page confirms a one-time $80 setup fee plus a flat $275/yr ($125 custodial + $150 segregated storage) — live-verified, 2026-07-05. Noble notes that lower ~$160/yr offers advertised by some competitors refer to commingled (not segregated) storage, which Noble does not offer."
- min_investment_note: "$20,000 IRA rollover / $2,000 direct cash purchase — the lowest cash entry point among the IRA specialists"
- storage_note: "Segregated storage only (a real differentiator — assets are not commingled with other customers'). Depository: International Depository Services (IDS), with a Texas location plus Delaware and Mississauga (Canada) options."
- core_features_note: "Texas storage option, buyback program, education content. \"Royal Survival Packs\" (emergency barter kits) are advertised but were not independently verified in this research — mention only if confirmed directly with the vendor."
- target_user_note: "Investors who specifically want segregated (not pooled) storage and a lower direct-cash entry point than the other IRA specialists."
- founded_year: 2016, bbb_rating_note: "A+, accredited since January 2017, only 4-5 complaints in 3 years; separate BBB customer rating 4.97/216."
- analyst_leader: **false** — thinner independent editorial coverage than Augusta/Goldco/AHG/Birch; honestly described as solid but less-covered rather than claimed as a recognized leader.
- clean_incident_record: **true** (an individual disputed fee complaint exists but is not a pattern or enforcement finding)
- review_score: **4.9**, review_count: **783**, review_source: "Trustpilot"
- review_note: "One of the highest Trustpilot scores in this comparison, from a moderate-sized sample."
- regulatory_history_note: "No enforcement action found (CFTC/SEC/FTC). Noble has been the plaintiff, not the defendant, in at least one defamation-style suit against an online critic — noted as context about how the company responds to criticism, not treated as a customer-facing complaint."
- editorial_consensus_note: "Mentioned in mainstream roundups for its segregated-storage and Texas-depository options; genuinely narrower analyst coverage than the top IRA specialists in this comparison."

### 6. APMEX (Oklahoma City OK)
- segment: `online_bullion_dealer` · min_investment_usd: **0**
- starting_price_headline: **"Live online premiums, no account fees"**
- starting_price_note: "Real-time premiums over spot, shown per product in the online catalog. Payment-method surcharges apply (roughly 4% for card vs. wire/check). No account minimum; per-order minimums may apply at checkout (confirm current threshold directly — an older \"$500+\" claim was not independently verifiable and is not repeated here)."
- min_investment_note: "No account minimum"
- storage_note: "Citadel Storage program: 0.55%/yr (up to $1M balance; 0.50% above $1M, 0.45% above $10M), $15/month minimum, billed quarterly, no premium on silver storage."
- core_features_note: "Large product catalog (tens of thousands of SKUs — confirm current exact count directly rather than repeating a specific figure), numismatic coins alongside bullion, mobile app, autoinvest program, buyback program."
- target_user_note: "Self-directed buyers and collectors who value selection and Citadel's professional storage program over shaving the last cent off the premium."
- founded_year: 1999, bbb_rating_note: "A+, accredited since 2004."
- analyst_leader: **true** — analyst_leader_note: "A member of Money.com's online-dealer comparison coverage; a frequent reference point in competitor comparison pages across this category."
- clean_incident_record: **true** (only a website-accessibility suit and an unrelated B2B commercial dispute found; no enforcement action)
- review_score: **4.9**, review_count: **266837**, review_source: "Shopper Approved"
- review_note: "Also cited: Google Seller Rating 4.8/18,958. APMEX's Trustpilot score is notably lower (4.2/5 from 9,267 reviews as of July 2026) — a real cross-platform split, not a data error, and worth knowing: Trustpilot skews toward complaint-driven reviews for many high-volume e-commerce dealers, while Shopper Approved and Google reflect a broader purchase-verified sample."
- regulatory_history_note: "No enforcement action found. Only a 2019 website-accessibility lawsuit (Traynor v. APMEX) and a 2020 commercial B2B dispute (unrelated to retail customers)."
- editorial_consensus_note: "A standard reference point in online bullion-dealer comparisons; larger absolute complaint counts than smaller dealers are a scale effect, not a rate problem, given its BBB A+ standing."

### 7. JM Bullion (Dallas TX)
- segment: `online_bullion_dealer` · min_investment_usd: **0**
- starting_price_headline: **"Live online premiums, no account fees"**
- starting_price_note: "Real-time premiums over spot. A cash-discount pricing tier applies for wire/check/crypto payment versus card. Published price-match policy. No account fees. Order minimum $99 (confirm current threshold directly)."
- min_investment_note: "No account minimum ($99 order minimum)"
- storage_note: "Free shipping on orders $199+ (insured, via USPS/UPS/FedEx). Optional storage through a partnership with TDS Vaults (Transcontinental Depository Services) — allocated, segregated storage, Lloyd's-insured, with vault locations including Toronto, Las Vegas, Singapore, and Zurich."
- core_features_note: "Publishes its own price comparisons against competitors, accepts cryptocurrency payment, buyback program. No in-house IRA custodian — IRA purchases route through partner custodians."
- target_user_note: "Price-conscious bullion buyers, especially above the $199 free-shipping threshold, who value being backed by a publicly traded parent company."
- founded_year: 2011, bbb_rating_note: "A+, 4.64/900+ (BBB customer rating, distinct from complaint count)."
- analyst_leader: **true** — analyst_leader_note: "Named Bullion.Directory's \"Bullion Dealer of the Year\" for a 3rd consecutive year (2026), based on over 30,000 public votes (43.5% share) — a community public-vote award, not an independent editorial analysis, but a real, verifiable, named recognition rather than paid-PR."
- clean_incident_record: **false** (2020 data breach below)
- review_score: **4.4**, review_count: **2319**, review_source: "Trustpilot"
- review_note: "JM Bullion has been a wholly owned subsidiary of A-Mark Precious Metals (NASDAQ: AMRK) since March 19, 2021 — not \"DGSE Companies,\" a common but incorrect claim found in older content about this company."
- regulatory_history_note: "Disclosure: a Magecart-style card-skimming data breach affected jmbullion.com between February and July 2020 (names, addresses, and full card numbers were exposed; sister site Provident Metals was also affected from January 1, 2020). It was disclosed publicly in October 2020. A resulting class action (Newman v. JM Bullion) settled with an estimated total value of about $14.8 million, including a $250,000 cash fund (up to $100 per California claimant) and two years of Experian IdentityWorks credit monitoring for all affected customers. No further incident has been found since, and no regulator action was filed — this is a disclosed, resolved 2020 incident, not an ongoing issue."
- editorial_consensus_note: "3-time Bullion Dealer of the Year (public vote); backed by a NASDAQ-listed parent, which some buyers weigh as a trust signal."

### 8. Money Metals Exchange (Eagle ID)
- segment: `online_bullion_dealer` · min_investment_usd: **0**
- starting_price_headline: **"Live online premiums + own depository program"**
- starting_price_note: "Real-time premiums over spot. Monthly savings plan available for automated recurring purchases. Storage tiers: approximately 0.59%/yr ($16k-$99k balance), 0.49%/yr ($100k-$999k); IRA storage specifically is priced lower, around 0.29%/yr including all-risk insurance — the most aggressive storage pricing in this comparison. No account fees for basic dealer purchases."
- min_investment_note: "No account minimum"
- storage_note: "Uses its own in-house depository (Money Metals Depository, Eagle ID, Class 3 vault, all-risk insured) rather than a third-party depository like every other candidate in this comparison — genuinely more convenient, but a structural trade-off worth naming plainly: the seller and the custodian are the same company, versus the separation of duties other dealers offer through independent depositories."
- core_features_note: "Monthly Savings Plan for automated dollar-cost-averaging purchases, buyback program, active \"sound money\" policy advocacy (a real differentiator in positioning, not just marketing)."
- target_user_note: "Recurring-purchase \"stackers\" on a standing order, and buyers who want integrated, lower-cost storage without a separate depository relationship."
- founded_year: 2010, bbb_rating_note: "A+, accredited since March 29, 2011; 128 customer reviews averaging 4.31/5, alongside 46 complaints in 3 years."
- analyst_leader: **false** — the strongest review figures found for this company live only on its own site (not independently citable); mainstream tier-1 financial press coverage is thin relative to other candidates.
- clean_incident_record: **true** (only a website-accessibility suit found; no enforcement action)
- review_score: **4.31**, review_count: **128**, review_source: "BBB"
- review_note: "Trustpilot shows a weaker, more polarized picture (3.6/5 from 236 reviews) — the most divided independent review base in this comparison. We seed the BBB figure as the primary score because it reflects an accredited, complaint-adjacent record rather than an unverified self-hosted testimonial base, but the Trustpilot split is real and worth knowing."
- regulatory_history_note: "No enforcement action, no customer-facing class action found (only a 2021 website-accessibility suit, Sanchez v. Money Metals). Money Metals was a plaintiff (not defendant) in a March 2025 Kentucky lawsuit challenging state sales-tax collection on precious metals — a pro-customer policy position, not a legal liability."
- editorial_consensus_note: "Known within the industry for its Sound Money Defense League advocacy work; limited tier-1 financial-press coverage relative to the IRA specialists and larger dealers in this comparison."

### 9. SD Bullion (Toledo OH)
- segment: `online_bullion_dealer` · min_investment_usd: **0**
- starting_price_headline: **"Live online premiums (low-price positioning, self-described)"**
- starting_price_note: "Markets itself on low pricing and a price-match promise; free shipping on orders $199+. We deliberately do not repeat a \"lowest price\" claim here — that exact promise is the subject of an active lawsuit (see regulatory disclosure), and documented customer complaints describe a price gap between the listed price and the final checkout price plus a roughly 4% card-processing fee."
- min_investment_note: "No account minimum"
- storage_note: "In-house storage program: segregated, Lloyd's-insured, with the first 3 months typically free (confirm current terms directly for the ongoing rate)."
- core_features_note: "Aggressively priced core bullion products, buyback program, IRA-eligible products available through partner custodians."
- target_user_note: "Price-focused buyers willing to pay by wire or check (to avoid the card surcharge) and to double-check advertised savings against the actual checkout total themselves."
- founded_year: 2012, bbb_rating_note: "A+ (BBB) — not independently re-verified beyond the BBB listing itself; no other rating agency figure is seeded here (see §8 open items)."
- analyst_leader: **false** — generic \"known for low prices\" mentions exist in dealer-comparison coverage, but no distinct, verifiable named award was found (unlike JM Bullion's Bullion.Directory recognition).
- clean_incident_record: **false** (active litigation below)
- review_score: **4.8**, review_count: **222105**, review_source: "Shopper Approved"
- review_note: "A large, long-running review base (over 220,000 reviews across roughly 9 years per the platform's own reporting) — but read alongside the active pricing-related litigation below rather than in isolation."
- regulatory_history_note: "Disclosure: an active class-action lawsuit filed in July 2025 in California federal court alleges SD Bullion's \"lowest price\" advertising is misleading and that customers ultimately paid more than at competing dealers. The case is ongoing with no ruling yet — we describe it as a pending false-advertising class action, not a proven finding, and we do not adopt SD Bullion's own \"lowest price\" marketing language on this page as a result. A separate, resolved 2021 website-accessibility suit also exists. No regulator enforcement action or data breach was found."
- editorial_consensus_note: "A standard low-price reference point in dealer-comparison coverage (Money.com among others); the active litigation over that exact positioning is the honest counterweight to include."

---

## §3 Verdict (Segment-Picks + doppelt gehedgter Top-Pick)

```
intro: "Our top pick, Augusta Precious Metals, has the cleanest complaint record in this comparison but requires a $50,000 minimum — smaller budgets should look at Birch Gold or Noble Gold instead. Nine platforms here split into two genuinely different businesses: gold IRA specialists who quote premiums by phone, and online bullion dealers who show live prices."
picks:
- augusta            "Best overall / cleanest complaint record (requires $50,000 minimum)"
- birch-gold          "Lowest IRA minimum ($5,000) + a real published fee number before you call"
- noble-gold          "Lowest cash entry point ($2,000) + segregated-only storage"
- american-hartford-gold "Mid-range IRA minimum, most-discussed complaint pattern (read the disclosure first)"
- goldco              "Best known brand for IRA rollovers"
- apmex               "Best online dealer for selection + professional storage"
- jm-bullion          "Best online dealer backed by a public parent company"
- money-metals-exchange "Best for automated recurring purchases + in-house storage"
- sd-bullion          "Largest review base among dealers (read the pricing disclosure first)"
```

## §4 Methodology (Pflichtabsatz)

"These nine platforms split into two genuinely different businesses: gold IRA specialists, who don't publish metal premiums and require a phone call for any real number, and online bullion dealers, who show live prices but charge no account fees. We don't force a single price-based ranking across that divide — \"starting price\" describes each vendor's pricing model in its own terms, and the real IRA cost (the premium over spot, not the account fee) is simply not public for any of the five IRA specialists in this comparison. We rank using published fee transparency where it exists, BBB and independent review-platform standing (always shown with its source and count, since this industry's review scores vary enormously by platform — one dealer scores in the 4s on one platform and barely above 4 on another), and a documented regulatory/complaint history that we disclose rather than omit. We do not cite paid-newswire \"rankings\" (a real pattern in this industry, where several widely-repeated \"#1\" claims trace back to sponsored press releases rather than independent analysis) — every superlative on this page is sourced to a named, verifiable outlet or record."

## §5 BuyerGuide (draft h3/body)

1. **"Gold IRA vs. online bullion dealer: which do you actually need?"** — the two-business-model explainer (mirrors Slice 7/8's equivalent entry).
2. **"Why doesn't this page compare prices directly?"** — gold IRA companies quote premiums by phone and don't publish them; this is industry-standard, not unique to any one company, but it means a real head-to-head price comparison across the IRA specialists isn't possible from public information.
3. **"The industry's real risk: undisclosed markups on retirement savings"** — cite the CFTC/FINRA/NASAA joint investor alert on precious-metals sales tactics targeting retirees, and the enforcement precedents (TMTE/Metals.com's $185M CFTC+30-state settlement, Safeguard Metals' $51M+ judgment) as industry context — explicitly noting none of the 9 candidates on this page is a party to those specific cases, but the sales mechanics regulators have flagged (celebrity endorsements, \"free silver\" promotions, fear-based marketing to retirees) are common across this space, including some candidates here.
4. **"Where does Silver Gold Bull fit?"** — Silver Gold Bull isn't ranked here (no independent 2026 editorial ranking includes it), but it has a solid Trustpilot base (~4.5/5 from ~4,900 reviews) and an A+ BBB record; the honest caveat is Canadian-based storage logistics for US customers and limited editorial visibility versus the ranked field. Link to the (content-fixed) existing SmartFinPro review.
5. **"A published fee doesn't mean a low total cost"** — the metal premium, not the account fee, is where most of an IRA specialist's revenue and most of the industry's documented markup complaints come from; a company with a clean, published $235/yr fee schedule (like Birch) can still charge whatever premium it wants on the metal itself, same as everyone else in this segment.

## §6 FAQ (≥5 items)

1. **Q: Why can't I see gold IRA prices on this page the way I can for the online dealers?**
   A: Gold IRA companies don't publish their metal premiums — every one of the five specialists here (Augusta, Goldco, American Hartford Gold, Birch Gold, Noble Gold) requires a phone call to get a real quote. This is standard across the entire industry, not something unique to any one company. What we can and do show is each company's published account fee structure (where one exists), storage terms, and complaint history — the premium itself simply isn't public information anywhere.
2. **Q: Which of these companies has had a real security or financial disclosure I should know about?**
   A: JM Bullion disclosed a 2020 card-skimming data breach that led to a roughly $14.8 million class-action settlement; Goldco reached a $2 million TCPA settlement (finalized March 2026) over unsolicited marketing texts; American Hartford Gold has been the subject of a 2023 MSNBC investigative report and a law-firm investigation into markup practices on specialty coins; and SD Bullion is currently facing an active (unresolved) false-advertising class action over its "lowest price" claims. We disclose all four directly on their respective cards rather than omitting them.
3. **Q: Is a lower minimum investment always the better deal?**
   A: No — a lower minimum is a fit question, not a quality signal. Noble Gold's $2,000 cash floor and Birch Gold's $5,000 IRA floor make them accessible to smaller budgets, but Augusta's $50,000 minimum comes with the cleanest complaint record in this comparison. Choose based on how much hand-holding, storage structure, and complaint history matter to you — not just the entry price.
4. **Q: Why isn't Silver Gold Bull ranked here if SmartFinPro already has a relationship with it?**
   A: No independent 2026 editorial ranking includes Silver Gold Bull among top gold-investing platforms, so we don't force it into the ranked field just because a relationship exists. It has a solid Trustpilot record and an A+ BBB rating, and we cover it honestly in the buyer's guide above with its real caveats (Canadian-based storage logistics for US customers, thinner editorial coverage) rather than either excluding it entirely or artificially ranking it.
5. **Q: Are any of these affiliate links?**
   A: Where we have an active, verified affiliate relationship, the destination link is disclosed as such on the individual candidate's card. As of this comparison's publish date, none of the nine ranked candidates has a verified, monetized tracking link in place — every link here currently routes to either the company's own review page or its official site, not a tracked affiliate URL.
6. **Q: What should I watch out for when a gold IRA company quotes me a price by phone?**
   A: Get the exact markup over spot price in writing before you buy, insist on standard bullion coins/bars rather than "specialty" or "exclusive" numismatic pieces (which can carry markups of 45-100% or more), and ask directly what the buyback price would be on the same day. Regulators (the CFTC, FINRA, and NASAA jointly) have specifically warned about high-pressure sales tactics targeting retirees in this industry — a legitimate company will let you take the quote away and think it over.

## §7 Compliance

```
notice: "Precious-metals dealers are not investment advisers and are largely outside SEC/FINRA oversight. Dealer premiums over spot are the industry's real cost and are often only quoted by phone; \"free silver\" promotions are typically priced into those markups rather than being a true discount. The CFTC, FINRA, and NASAA have jointly warned retirees about high-pressure precious-metals sales tactics — verify any specific markup or fee in writing before purchasing."
regulators: []
```

---

## §8 Offene Pre-Seed-Punkte

Alle 10 Review-Profile + 3 Fee-Details wurden live verifiziert (2026-07-05, s. Kopfnotiz) — im Gegensatz zu Slice 8 gibt es hier **keine strukturell offenen `null`-Felder**. Verbleibende, nicht-blockierende Pre-Publication-Checks:

1. AHG's exact fee structure remains unconfirmed by any official source (two contradictory editorial estimates found) — the seeded copy deliberately uses a soft "~$180-250/yr editorial estimate" rather than a specific breakdown; re-check before any future update that tightens this figure.
2. APMEX's exact current catalog SKU count, order minimum, and return-policy window were deliberately left as "confirm directly" rather than repeating a specific number that could not be freshly verified.
3. SD Bullion's BCA grade (Money.com snippet suggested "C") was not independently confirmed — not seeded.
4. Money Metals' monthly-savings-plan minimum dollar amount was not confirmed — not seeded as a specific figure.

---

## §9 Content-Fix-Aufgaben (US-Scope, User-bestätigt: voller Umfang)

Alle Fixes an den bestehenden Dateien in `content/us/gold-investing/`.

1. **`goldco-review.mdx`**: reviewedBy "Michael Torres, CFP, CFA" → korrekter Roster-Name "Michelle Torres" mit ihrem echten, einzigen Credential ("Financial Analyst" lt. `/integrity` — NICHT "CFP, CFA", die nicht belegt sind); "4,8/5 Trustpilot 3.000+" → "4.4/5 from 1,786 Trustpilot reviews"; unbelegte "How We Tested"/"120h Research Dez 2025–Feb 2026"-Erzählung entfernen/durch ehrliche Methodik ersetzen (Slice-8-Muster: "we review vendor documentation, cross-reference BBB/Trustpilot, and check for disclosed regulatory history" statt erfundener Testphasen); Jahreskosten "$230-300" → "$280-330/yr"; unbelegten "reduced from $50,000"-Rabatt-Claim entfernen/verifizieren; tote CTAs `/go/goldco` (5×) → `https://goldco.com/`, `/go/augusta` → `https://www.augustapreciousmetals.com/`, `/go/birch-gold` → `https://www.birchgold.com/`; **TCPA-Settlement-Disclosure ergänzen** ($2M, final 03/2026, Quelle: Urteils-Abschnitt 3/§2 oben).
2. **`apmex-review.mdx`**: reviewedBy-Fix wie oben; "4,7/5 Trustpilot 7.000+" → primär "4.9/5 from 266,837 Shopper Approved reviews", mit ehrlichem Kontrast "(Trustpilot separately shows 4.2/5 from 9,267 reviews — a real cross-platform split, not an error)" statt der falschen "1,6-1,8"-Kontrast-Behauptung; Citadel-Storage "0,12%/Jahr, min $8/Monat" → "0.55%/yr, $15/month minimum"; unbelegtes "200+ Preispunkte getrackt"-Testing-Narrativ entfernen; Katalogzahl "10.000+" auf "tens of thousands" oder Live-Check ändern; **"30-day return policy"-Claim direkt am Anbieter verifizieren, bevor er als Fakt stehen bleibt** (Matrix-Pflicht-Fix); tote CTAs `/go/apmex` (5×) → `https://www.apmex.com/`, `/go/sd-bullion` → `https://sdbullion.com/`, `/go/jm-bullion` → `https://www.jmbullion.com/`.
3. **`jm-bullion-review.mdx`** (schwerster Fall): reviewedBy "Michael Torres, CFP, CFA" → korrekter Roster-Name "Michelle Torres, Financial Analyst" (derselbe Fix wie §9.1/9.2 — diese Datei trägt denselben fehlerhaften Namen); komplette fiktive Testmethodik entfernen (12+ Testbestellungen, 2 Price-Match-Requests, 2 Buyback-Verkäufe, "Screenshots from our own test orders", 90-Tage-Preis-Dataset) inkl. des **anachronistischen Goldpreises "$2.750-2.850/oz Dez 2025-Feb 2026"** (real >$4.000/oz in diesem Fenster) — durch ehrliche, dokumentationsbasierte Methodik ersetzen; "NASDAQ ... DGSE Companies" → "A-Mark Precious Metals (NASDAQ: AMRK), since March 2021"; "4,8/5 Trustpilot 6.000+" → "4.4/5 from 2,319 Trustpilot reviews"; "No professional storage option" → TDS-Vaults-Partnerschaft (allocated, segregated, Lloyd's) korrekt beschreiben; unbelegte App-Ratings entfernen; tote CTAs `/go/jm-bullion` (5×) → `https://www.jmbullion.com/`, `/go/apmex` → `https://www.apmex.com/`; **2020-Datenpanne-Disclosure ergänzen** (Magecart, Feb-Jul 2020, Settlement ~$14.8M).
4. **`silver-gold-bull-review.mdx`**: reviewedBy "James Miller, CFA" → korrekter Roster-Name "Jessica Miller" mit ihrem echten Credential ("CFA, CFP" lt. `/integrity`); "founded 2006 / 20 years" → "founded 2009"; "4,9/5 3.500+" → "4.5/5 from 4,898 Trustpilot reviews" (live-verifiziert); unbelegtes "6 Testbestellungen/2 Buyback-Verkäufe"-Narrativ entfernen; Storage-Aussagen verifizieren; CTA `/go/silvergoldbull-us` bleibt (funktionierender, wenn auch aktuell "dead"-Status-Link — NICHT in diesem Slice anfassen, Owner-Folgetask).
5. **`index.mdx`**: reviewedBy-Fix wie oben ("Jessica Miller"); **Goldpreis "$2.700-$2.900/oz" in Title/Description/FAQ → aktualisieren auf "~$4,100-4,200/oz (July 2026) — prices change daily" statt einer harten Zahl in SEO-Meta**; FAQ-Zahlen (ETF-Expense-Ratios GLD/IAU/GLDM 0.40%/0.25%/0.10%) beim Fix mitprüfen; nach Cockpit-Launch internen Link auf `/us/gold-investing/best/platforms` ergänzen.

**Cross-cutting Reviewer-Identitäts-Frage (Urteils-Abschnitt 5, NICHT in diesem Slice lösen):** Die prod-`experts`-DB-Tabelle selbst weicht vom kanonischen `/integrity`-Roster ab (u. a. trägt sie noch die in Slice 8 als fabriziert eingestufte "James Mitchell, CISSP, CISM"-Kombination) — dieser Fund betrifft alle Kategorien, nicht nur Gold. **Empfehlung: in diesem Slice nur die 5 Gold-Dateien auf roster-konforme MDX-`reviewedBy`-Werte ziehen; die DB-`experts`-Tabellen-Migration als eigenen, kleinen Owner-Folgetask ausklammern** (CLAUDE.md verbietet Gesamt-Refactorings in einem Slice).

**Folgetasks (spawn_task nach Slice-Abschluss):**
- Silver-Gold-Bull-Dead-Link-Reparatur (CJ-Dashboard: neuen Deeplink generieren, `commission_value` gegen reale 1,7%/0,8%-Sätze korrigieren).
- `experts`-DB-Tabellen-Migration (Namen/Credentials sitewide auf `/integrity`-Roster ziehen — betrifft mindestens Gold + Cybersecurity, vermutlich weitere Kategorien).
- Augusta/JM-Bullion-Affiliate-Programm-Registrierung prüfen (Augusta Inhouse-Programm, JMB via Awin Merchant-Profil 22685) — beide real, unmonetarisiert.
