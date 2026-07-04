# Comparison Cockpit — Phase-D+E-Rollout: die restlichen 10 „Best X"-Topics (11 neue Routen)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Slice für Slice, Review-Checkpoint nach jedem Slice). Checkboxen (`- [ ]`) dienen dem Tracking.
> **Status:** Owner-approved 02.07.2026. Slice 0 (Setup & Ground-Truth-Baseline) wurde in der Planungs-Session ausgeführt; dieses Dokument enthält die verbleibenden Slices 1–12.

**Goal:** Die 10 verbleibenden Topics ausrollen: **9 neue US-Routen** (8× Phase D + Debt-Relief) + **1 CFD-Topic mit 2 Markt-Routen** (UK/AU). Am Ende sind **12 Topics und 13 Routen** live. Jede neue Seite optisch/funktional ununterscheidbar von den zwei Live-Referenzseiten, ausschließlich per TopicConfig + Zod + recherchierter Seed-Migration + SEO-Content. **Keine neuen UI-Komponenten.**

**Architektur:** Bestehendes Cockpit-System 1:1 wiederverwenden (`lib/comparison/*`, `app/(marketing)/[market]/[category]/best/[topic]/page.tsx`, `components/marketing/cockpit-*.tsx` = eingefroren). Neues Thema = 1 TopicConfig-Datei + 1 Registry-Zeile + 1 Seed-Migration + llms.txt-Eintrag. Einzige Shared-Code-Arbeit: Phase E (Multi-Market-Plumbing für CFD) + OG-Image-Route (Addendum §9.1).

**Tech:** Next.js 16 App Router · Supabase (`product_attributes`, `affiliate_links`) · Zod · Tailwind v4 (`--sfp-*` only)

---

## Kontext

2 von 12 Best-X-Topics sind live (`/us/personal-finance/best/robo-advisors`, `/us/business-banking/best/business-bank-accounts`); es fehlen 10 Topics = 11 Routen (9 US + CFD in UK und AU). Die Specs sind bindend:
- **Master-Spec:** `docs/superpowers/specs/2026-06-28-comparison-cockpit-design.md` (§7 Komponenten-Reuse, §10 SEO-Tiers, §11.1 Attribution-Gate, §14 Test-Gates, §15 Reihenfolge)
- **Addendum:** `docs/superpowers/specs/2026-07-02-comparison-cockpit-phase-d-plus-extensions.md` (12 Themen, §4 Debt-Relief, §5 CFD-Plumbing, §6.1 Go-live-Gates, §9.2 Guardrail)
- **Shortlist:** `docs/superpowers/specs/2026-07-02-best-x-candidate-shortlist.md` (9 Kandidaten/Thema, OHNE Attributwerte)

### Owner-Entscheidungen (final, 02.07.2026 — nicht erneut verhandeln)

| § | Entscheidung |
|---|---|
| 7.1 | Attributdaten recherchiert der Ausführende selbst (WebSearch/WebFetch, offizielle Preisseiten + NerdWallet/Bankrate/Forbes/Investopedia); Quellenmatrix ist Pflicht vor jeder Seed-Migration |
| 7.2 | **Lexington Law raus, Safeport Law rückt nach**; Lexington-Review bleibt online + bekommt Compliance-Hinweis, kein Cockpit-Feature |
| 7.3 | **Freedom Debt Relief mit sichtbarem Risikohinweis featuren, Americor streichen** → Debt-Relief wird Top-8 |
| 7.4 | **CFD: UK + AU gleichzeitig** (eine TopicConfig, zwei Seed-Sets) |
| 7.5 | **Perimeter-81-Rebranding (Check Point SASE) vor Cybersecurity-Cockpit-Launch** aktualisieren |
| 7.6 | **Debt-Relief zuerst**, dann Master-Spec-Phase-D-Reihenfolge, CFD zuletzt nach Phase E |
| 7.7 | **`compliance.noticeByMarket`-Muster** in Phase E bauen (FCA/ASIC-spezifische CFD-Risikotexte) |

### Verifizierte Codebasis-Fakten (Exploration 02.07.2026)

- **TopicConfig** (`lib/comparison/topics/types.ts:94-120`): slug, category, label, h1/metaTitle/metaDescription (fn of year), intro, publishedDate, attributesSchema (Zod), specColumns (4), filters, priorityChips, matcher, sortOptions, costModel (`kind: 'compounding-fee' | 'banking'`), compareRows, detailRows, verdict {intro, picks[]}, methodology, buyerGuide[], faq[], compliance {notice, regulators[]}. Muster: `robo-advisors.ts` (attributes-getrieben) bzw. `business-bank-accounts.ts` (Top-Level-Spalten-getrieben).
- **Registry:** `lib/comparison/topics/index.ts:8-15` — Key `'{category}/{topic}'`. **Manifest:** `manifest.ts:23-34` hat bereits alle 10 US-Einträge (8 davon `coming_soon`); nur CFD braucht 2 neue Einträge (uk/au) + `/public/images/comparison/cfd-brokers.webp`.
- **Loader-Gate** (`lib/comparison/loader.ts:154-162`): Offer-CTA nur bei `is_affiliate && link && tracking_status ∈ {verified, dashboard_only}`; sonst `review`/`visit`. Zod-Validation: dev throw, prod exclude+log.
- **Seed-Muster:** `supabase/migrations/20260628120020_seed_robo_advisors_us.sql` — INSERT mit `affiliate_link_id`-Subquery, attributes-JSONB, `source_url`/`source_type`/`confidence`/`data_verified_at`, `review_slug` (= MDX-Dateiname ohne .mdx), `ON CONFLICT (market, category, topic, slug) DO UPDATE`.
- **Route/Sitemap/JSON-LD automatisch** (generateStaticParams via `getCockpitRouteParams()`, sitemap.ts:274-291, Schema-Helper in `lib/seo/schema.ts`). **llms.txt-Einträge sind manuell** (`app/llms.txt/route.ts`) → pro Slice ergänzen.
- **Addendum-§5.2-Referenzen alle BESTÄTIGT** + 2 Zusatzbefunde: (a) `cockpit-content.tsx:188-203` erwartet `complianceNotice`-Prop, `page.tsx` übergibt sie **nicht** (Notice rendert heute vermutlich nirgends — in Phase E klären); (b) `getPrimaryRegulator('us','debt-relief'|'credit-repair'|'gold-investing')` → `''` und `('us','personal-finance')` → nur `'SEC'` (Robo zeigt heute SEC+SIPC) → der wörtliche Addendum-Fix #1 würde die US-Referenzseiten sichtbar ändern. **Abweichung nötig, siehe Slice 11.**
- **national-debt-relief-Link:** `20260221000001` legte ihn mit `category='debt-relief'` an, die spätere Orphan-Migration `20260525100100` setzte ihn per ON CONFLICT auf `'personal-finance'` zurück → UPDATE-Fix nötig (kein Schema-Change). `tracking_status` ist DB-weit default `'unverified'` (Seeds setzen ihn nie).
- **marketCategories:** us enthält credit-repair, gold-investing, debt-relief ✓; uk+au enthalten trading ✓. `product_attributes.market` CHECK erlaubt uk/au ✓. **Offen: hat `product_attributes.category` einen CHECK?** → Prüfschritt in Slice 1 (Ergebnis Slice 0 siehe Slice-1-Plan).
- **Tracker:** `buildTrackedDestinationUrl` kennt Awin (`clickref`), Impact (`subId1`), CJ/Fallback (`sid`) — kein PartnerStack. Mappings nur für echte Tracking-Links bauen.
- **Werkzeuge:** Dev-Server via `preview_start` Name `"dev"` (Port 3002, Webpack). Prod-Migrationen manuell (deploy.yml macht keine): pg-meta-API-Pattern bzw. `node --env-file=.env.local`-Script (siehe Memory `cockpit-prod-data-apply`); Seiten sind SSG (1d) → nach Datenänderung Redeploy/Revalidate. CI baut nicht voll → lokal `npm run build` vor Merge.

### Harte Guardrails (gelten in jedem Slice)

1. **Shared-UI-Freeze:** `comparison-cockpit.tsx`, `cockpit-card.tsx`, `cockpit-table.tsx`, `cockpit-compare.tsx`, `cockpit-decision-bar.tsx` nur bei reproduzierbarem, nicht per Config lösbarem Bug ändern — mit Begründung + Regressionstest gegen BEIDE Referenzseiten. (Phase E ist die einzige geplante, vom Auftrag freigegebene Shared-Code-Arbeit.)
2. **Keine `reviews_data`-Parallelarchitektur, keine unverschleierten Affiliate-Links** (Addendum §9.2) — nur `product_attributes` + TopicConfig + `/go/[slug]`.
3. Farben nur `var(--sfp-*)`; helles Trust-Design; keine Tailwind-Utility-Farben.
4. **Soft-live vs. Ranked-live:** Auch Soft-live braucht Seed-Rows — aber mit neutralen Feldern: `score`/`rating` nicht als harte Ranking-Aussage missbrauchen (nur mit Quelle setzen, sonst neutral/gleichwertig), `is_top_pick = false` überall, `display_order` = redaktionelle neutrale Reihenfolge, kein Winner-orientiertes `verdict`, keine Winner-Chips (weder auf der Seite noch auf der Homepage-Kachel), keine Kosten-/APY-/Spread-Claims, CTAs nur `review`/`visit`. Ranked + Gewinner-Metrik erst, wenn Top-3-Kernattribute mit Quelle in der Matrix stehen; monetarisierter `/go`-CTA zusätzlich erst bei `tracking_status ∈ {verified, dashboard_only}`. Kein Thema wird deshalb komplett blockiert.
   - **⚠️ Offene Auflage aus Slice-2-Fable-5-Review (vor dem ersten Soft-live-Seed zu erledigen, spätestens vor dem jeweiligen Slice aus 3–10, dessen Thema soft-live startet):** Sowohl `buildBestXIndex` (Homepage-Winner-Chip, `lib/comparison/loader.ts:449-466`, `const top = products[0]`) als auch die neue OG-Bild-Route (`app/(marketing)/[market]/[category]/best/[topic]/opengraph-image.tsx`, Slice 2) zeigen aktuell UNGEGATET `products[0]` als "Top Pick", sobald `products.length > 0` — unabhängig von `is_top_pick`. Für die 3 bisher live Themen (alle ranked-live) korrekt; sobald ein Soft-live-Thema geseedet wird, würde beides fälschlich einen Winner-Claim fabrizieren. **Fix (kleines, gezieltes Gate, kein Refactor):** beide Stellen auf `products[0]?.isTopPick === true` prüfen, bevor Name/Metric/Rating angezeigt werden; sonst neutraler Fallback (kein Chip / generisches Bild ohne Top-Pick-Zeile).
5. Quellenmatrix-Pflicht: `Provider · Attribut · Wert · source_url · source_type · confidence · data_verified_at` — kein Seed-Wert ohne Zeile darin.
6. **Migration-Safety:** Jede Seed-/Fix-Migration idempotent (`ON CONFLICT … DO UPDATE`, `IF NOT EXISTS`) und wiederholt anwendbar. `affiliate_links`-Änderungen nur gezielt per `WHERE slug = '…' AND market = '…'` (einzelne Slugs) — niemals breite category-/status-Updates, keine fremden Linkdaten überschreiben. **Visit-only-Anbieter brauchen KEINEN `affiliate_links`-Row** (`product_attributes.is_affiliate=false` + `external_url` reicht); falls doch einer angelegt wird: `active=false`, `tracking_status='unverified'`, keine erfundenen Destination-URLs.
7. **Mandatory Review Quality Gate (AGENTS.md):** gilt bei jedem Slice mit MDX-/Comparison-/SEO-Textänderungen — siehe eigener Block unter dem Slice-Template.

---

## Model-Routing-Regel

**Standardmodell für die Umsetzung: Sonnet 5.**

Nutze bzw. fordere **Fable 5** explizit für folgende Schritte an, bevor Code/Seeds gemerged werden:
1. **Recherche- und Quellenmatrix für komplexe Themen:** Debt Relief · Trading Platforms · Forex Brokers · Gold Investing · CFD Brokers UK/AU
2. **Phase E Multi-Market-Plumbing:** `formatMoney(market)` · `getEffectiveRegulators` · `noticeByMarket` · alle Änderungen an Shared-Cockpit-Komponenten oder TopicConfig-Typen
3. **Compliance-sensitive Themen:** Credit Repair · Debt Relief · CFD Brokers · Gold Investing
4. **Pre-Merge-Review jedes Slice:** Datenintegrität · Attribution-Gate · SEO/AEO · Migration-Safety · Referenzseiten-Regression

**Umsetzung im Runner:** In Claude Code kann der Ausführende die Checkpoints direkt als Fable-5-Review-Subagent dispatchen (Agent-Tool mit Modell-Override `fable`). Falls das im aktuellen Runner NICHT verfügbar ist:
- **STOPPE** an diesen Checkpoints.
- Schreibe einen klaren Review-Prompt für Fable 5 mit Dateien, Diff, offenen Risiken und konkreten Fragen.
- Fahre erst fort, wenn der Fable-Review bestanden oder vom Owner freigegeben wurde.

**Sonnet 5 darf High-Risk-Schritte nicht stillschweigend allein finalisieren.**

---

## Slice-Plan (Reihenfolge fix, 1 PR pro Slice, Branch `feat/cockpit-<slice>`)

### Slice 1 — Debt-Relief `/us/debt-relief/best/companies` (Quick-Win, monetarisierbar)
Kandidaten (Top-8, Owner §7.3): National Debt Relief, Freedom Debt Relief (mit Risikohinweis), Accredited Debt Relief, New Era, Pacific Debt Relief, CuraDebt, GreenPath (Non-Profit-Pick), JG Wentworth. Americor raus.
- [ ] **Recherche + Quellenmatrix** (`docs/superpowers/plans/2026-07-02-cockpit-debt-relief-source-matrix.md`): pro Kandidat u. a. Gebühr in % der Schulden (min–max), Mindest-Schuldensumme, Programmdauer (Monate), AFCC/IAPDA-Akkreditierung, kostenlose Erstberatung, Staaten-Abdeckung, BBB-Rating. Quellen: offizielle Sites + NerdWallet/Bankrate/Forbes/ConsumerAffairs.
- [ ] **DB-Fix-Migration** `supabase/migrations/<ts>_fix_ndr_category.sql`: `UPDATE affiliate_links SET category='debt-relief' WHERE slug='national-debt-relief' AND market='us';` (UPDATE-only, Addendum §4).
- [ ] **Attribution-Gate-Review:** via `mcp__smartfinpro__list_affiliate_links` Ist-Zustand prüfen. `/go`-CTA nur, wenn Tracking belegbar ist (URL `?a=smartfinpro` = Referral-Parameter → wenn Conversions nur im Partner-Dashboard sichtbar: `tracking_status='dashboard_only'` per Migration setzen, Begründung im Commit analog Mercury). Nicht belegbar → `review`-CTA, Seite trotzdem ranked (Daten sind recherchierbar).
- [ ] **CostModel-Subtask (festgelegt, kein „falls nötig"):** Debt-Relief nutzt ein neues pures CostModel `kind: 'fee-on-amount'` — KEINE Banking-Simulation. Implementierung ausschließlich in `lib/comparison/topics/types.ts` (CostModelDef-Union + optionales `feeAccessor`) und `lib/comparison/cost.ts` (`costOverTime`: Kosten = fee% × Betrag, jahresunabhängig). Unit-Tests `__tests__/unit/cockpit-cost-fee-on-amount.test.ts` — Run: `npx vitest run __tests__/unit/cockpit-cost-fee-on-amount.test.ts` (Gesamtlauf: `npx vitest run`): (a) fee% × amount korrekt, (b) `years` ohne Einfluss, (c) Regressionsfälle: `compounding-fee` und `banking` liefern unveränderte Werte. Danach Decision-Bar im Preview prüfen (Slider-Label „Enrolled debt", Kostenanzeige plausibel, Gold-Slider-Fill unverändert).
- [ ] **TopicConfig** `lib/comparison/topics/debt-relief-companies.ts` + Zod (`fee_pct_min/max`, `min_debt`, `program_months_min/max`, `afcc`, `iapda`, `free_consult`, `states_note` …) + Registry-Zeile `'debt-relief/companies'`; `costModel: { kind: 'fee-on-amount', … }`.
- [ ] **Seed-Migration** `<ts>_seed_debt_relief_us.sql` nach Robo-Muster (ON CONFLICT DO UPDATE; `review_slug: 'national-debt-relief-review'` für NDR; Freedom-Row bekommt Risikohinweis in cons/verdict/deep_dive).
- [ ] **SEO Tier 0–3** via Config (verdict mit Named Picks nur bei ranked; methodology inkl. AFCC/CFPB-Kontext; FAQ ≥5; `compliance.notice`: „Debt settlement can negatively impact your credit score …"; `regulators: []` — kein erfundenes Badge). llms.txt-Eintrag ergänzen.
- [ ] **Test-Gates** (siehe Template unten) + Migrationen auf prod Supabase anwenden + verifizieren.

### Slice 2 — OG-Images für alle Topic-Seiten (klein; Addendum §9.1)
- [ ] `app/(marketing)/[market]/[category]/best/[topic]/opengraph-image.tsx` (eine dynamische Datei für ALLE Topics, auch die 2 Referenzseiten → keine Diskrepanz): `next/og` `ImageResponse`, Muster `app/(marketing)/us/business-banking/programmatic-financial-firewall/opengraph-image.tsx`, aber **helles** Schema (Navy/Gold/Sky als Inline-Hex im Image erlaubt — CSS-Variablen existieren dort nicht), Titel + Top-Pick + Rating aus `getCockpitData`.
- [ ] Verifizieren: `curl` der OG-Route im Prod-Build für beide Referenz-Topics + Debt-Relief.

### Slices 3–10 — die 8 US-Phase-D-Themen (Master-Spec-Reihenfolge)

Jedes dieser Slices folgt exakt dem **Slice-Template** (unten). Themenspezifisches:

| Slice | Topic (`category/topic`) | Kandidaten-Besonderheiten | Monetarisierung (Stand heute) |
|---|---|---|---|
| 3 ✅ LIVE (03.07.2026, PR #52) | Trading Platforms (`trading/trading-platforms`) | 9 lt. Shortlist §1; TradingView NICHT als Slot; Merrill Edge neu | 5 aktive Links (Fidelity, Schwab, IBKR, Robinhood, eToro) → alle `review`-CTA (Gate geschlossen, `tracking_status` unverändert), Rest `review`/`visit`; alle 9 zusätzlich mit `external_url` (siehe Slice-Template Punkt 5) |
| 4 ✅ LIVE (03.07.2026, PR #53) | Forex Brokers (`forex/forex-brokers`) | Owner-Entscheidung: Plus500 US ganz raus (Futures-Broker, kein Spot-FX) → **Top-5** statt gepolsterter 7; IG US/tastyfx-Rebrand (Juni 2024) im Slice mitgefixt (301-Redirect + Content-Konsolidierung); erstes Thema mit echtem `fee-on-amount`-Kostenmodell (Spread+Kommission als %-Notional, echte "Lowest cost"-Differenzierung statt $0-Patt wie bei Trading Platforms); FOREX.com „dead" → Gate 5: WAF-Fehlalarm, `review`-CTA bleibt | IBKR ($200 CPA) + FOREX.com + OANDA aktiv (alle `review`/`visit`, Gate geschlossen); alle 5 zusätzlich mit `external_url` |
| 5 ✅ LIVE (03.07.2026, PR #54) | Credit Repair (`credit-repair/companies`) | Owner §7.2 bestätigt+verschärft: Lexington Law UND The Credit Pros komplett ausgeschlossen (nicht nur Disclosure) — Lexington-Vorgängerfirma nach $2,7-Mrd.-CFPB-Urteil in Chapter-11 aufgelöst, Nachfolgefirma führt Marke fort; Ovation Credit Services ist seit 2023 defunkt (Fakten-Korrektur, keine Owner-Entscheidung). **6 Ranked-Kandidaten** (nicht 8–9): Credit Saint, Sky Blue Credit, The Credit People, Safeport Law, MSI Credit Solutions, Credit Firm. Neues geteiltes Kostenmodell `monthly-plus-setup` (Monatsabo + einmalige Setup-Gebühr). Im Zuge der Recherche echte redaktionelle Fabrikation in 4 Live-MDX-Seiten entdeckt+bereinigt (erfundene „Testberichte"/Kundenfälle) | The Credit People aktiv |
| 6 ✅ LIVE (04.07.2026, PR #55) | Credit Monitoring (`personal-finance/credit-monitoring`) | **8 Ranked-Kandidaten** (nicht 9): Aura, LifeLock, IdentityForce, Experian IdentityWorks, IdentityIQ, myFICO, IDShield, Credit Karma — PrivacyGuard ausgeschlossen (keine zitierbare Review-Basis), Identity Guard ohne eigenen Slot (gehört zu Aura, kein Schein-Diversität-Slot). Höchste Regulatorik-Dichte aller bisherigen Slices — Disclosure statt Ausschluss (Freedom-Muster) für IdentityIQ ($8,77-Mio.-Settlement), LifeLock (FTC $12M+$100M), Experian (aktive CFPB-Klage, direkt auf der Top-Pick-Karte offengelegt), Credit Karma (FTC $3M) und IdentityForce-Mutter TransUnion. Existierendes Kostenmodell `banking` wiederverwendet — **null Shared-Code-Änderung**. Fable-5-Vor-Migrations-Review (12 Änderungen, u. a. zwei erfundene BBB-Fakten) + finales Fable-5-Review (3 blockierende Korrekturen, u. a. ein unbelegtes Datum in der Experian-Klage-Offenlegung) | Keine Links → ranked-unmonetarisiert (Daten gut recherchierbar), CTAs `visit` |
| 7 ✅ LIVE (04.07.2026, PR #56) | AI Tools Finance (`ai-tools/ai-tools-finance`) | Erstes Slice mit strukturell heterogenen Produkttypen (Budgeting-App, LLM-Chatbot-Feature, AI-Buchhaltung, AI-Charting-Beta, AI-Aktien-Scoring, regulierte AI-Investing-Automation, B2B-Spend-Management) — **8 Ranked-Kandidaten**: Monarch Money, Copilot Money, Ramp, QuickBooks AI, Danelfin, Composer by SoFi, ChatGPT (Finances), TradingView. Truewind ausgeschlossen (Live-G2-Check: nur 4 Reviews statt der von einem Aggregator gemeldeten „114+"). Kein ehrlicher Kosten-Vergleich möglich (4 inkompatible Preismodelle) → `banking`-Kind mit `monthlyFee=0` bei allen 8 (Vor-Migrations-Review deckte auf, dass die eingefrorene UI trotz fehlender Sort-Option zwingend eine Kostenzahl mit Sieger-Highlight zeigt — Trading-Platforms-Präzedenz). **Erste Slice mit Shared-UI-Änderung** (`reviewCount === 0`-Guard in cockpit-card/table/compare für ChatGPT/Composers echte Nicht-Bewertung „Not yet rated" statt falscher „0.0 aus 0 Reviews"-Behauptung — additiv, null Regression auf den 6 anderen Live-Themen geprüft). Composer by SoFi als einzige regulierte Entität (SEC-RIA + FINRA/SIPC-Broker-Dealer, BrokerCheck-Record live verifiziert sauber). Fable-5-Vor-Migrations-Review (11 Änderungen, u. a. die widerlegte „kein Kosten-Wert sichtbar"-Kernannahme) + finales Fable-5-Review (3 blockierende Korrekturen: tote `/go/`-Wettbewerber-CTAs zum dritten Mal in dieser Rollout-Serie, defekter CTA, „(0) Reviews"-Anzeigefehler). Content-Hygiene zum dritten Mal: 4 bestehende MDX-Reviews (Monarch, Copilot, ChatGPT, QuickBooks) mit veralteten Preisen/erfundenen Review-Zahlen/toten CTAs gefixt | Keine Finance-AI-Links aktiv → überwiegend visit/review |
| 8 ✅ LIVE (04.07.2026, PR #57) | Cybersecurity SMB (`cybersecurity/cybersecurity-smb`) | **9 Ranked-Kandidaten** über 4 inkompatible Sicherheitsebenen: CrowdStrike Falcon Go, Bitdefender GravityZone, SentinelOne Singularity, Sophos Intercept X (Endpoint & EDR); 1Password Business, Bitwarden (Passwort-Management); NordLayer, Check Point SASE — ehem. Perimeter 81 (Netzwerk & SASE); Proofpoint Essentials (E-Mail-Security). Mimecast bewusst KEIN 10. Slot (nur buyerGuide-Absatz — Proofpoints Dez-2025-Hornetsecurity-Übernahme schwächt das SMB-Argument). **Vorstufe erledigt (Owner §7.5):** `perimeter-81-review.mdx` + `affiliate_links.partner_name` auf „Check Point SASE (formerly Perimeter 81)" umbenannt, `tracking_status`/`cpa_value`/`destination_url` unangetastet. **Plan-Zeilen-Korrektur:** die ursprüngliche „5–6 aktive Links"-Annahme war in 3 Punkten falsch (DB-verifiziert, nicht nur MCP-Tool) — SentinelOne hat GAR keine `affiliate_links`-Row (totes `/go/sentinelone`); „NordLayer" existiert nur als Consumer-NordVPN-CJ-Link (nicht als eigene Row, NICHT als NordLayer-Offer ausgegeben); CrowdStrike/1Password/Proofpoint sind nackte cpa=0-Homepage-Bookmarks. **Alle 15** cybersecurity-Rows stehen auf `tracking_status='unverified'` → **keine einzige `offer`-CTA möglich**, alle CTAs `review`/`visit` (Attribution-Gate korrekt). Drittes Slice mit heterogenem Kostenmodell (3 inkompatible Preiseinheiten: per-Device/Jahr, per-User/Monat, Quote-only) → `banking`-Kind mit `monthlyFee=0`, „Starting price"/„Pricing basis" als reine Info-Spalten, kein Kosten-Sort — **null Shared-Code-Änderung** (reine Wiederverwendung des Slice-7-Musters). 5 von 9 Kandidaten seeden `review_score=null` (Sophos, Bitwarden, NordLayer, Check Point SASE, Proofpoint — kein unabhängig verifizierbarer Score), nutzt den in Slice 7 geschaffenen `reviewCount===0`-Guard verlustfrei weiter. Content-Fabrikation zum vierten Mal entdeckt — diesmal am gravierendsten: nicht nur erfundene Reviewzahlen/Testberichte, sondern eine komplette fiktive „60/90-Tage-Hands-on-Test"-Methodik-Erzählung (inkl. zweier frei erfundener Fallstudien mit Firmennamen/Vorfällen/Dollarbeträgen) über alle 5 US-Reviews + Kategorie-Indexseite hinweg, sowie eine falsche Reviewer-Zertifizierung („James Mitchell, CISSP, CISM" — echtes, einziges Credential lt. `/integrity`-Rooster: „Debt & Credit Specialist"). Nutzer-genehmigt in vollem Umfang gefixt (nicht nur Teilscope). Zwei echte, umsatzrelevante Slug-Drift-Bugs live gefixt: `/go/1password`→`/go/onepassword` (0 Klicks trotz 5 CTA-Platzierungen) und die NordLayer-Review zeigte fälschlich auf `/go/nordvpn` (Consumer) statt `/go/nordvpn-business` (eigene Row). Fable-5-Vor-Migrations-Review (8 blockierende Korrekturen: interner Doku-Jargon der wörtlich ins UI gerendert hätte, zwei unverifizierte Zahlen mit falscher Präzision, fehlendes Contract-Feld, fehlende Pflicht-Disclosure im Top-Pick-Verdict) + **zwei** finale Fable-5-Reviews in Folge (Runde 1: 10 blockierende Funde, v. a. Cross-File-Kontamination — CrowdStrike/SentinelOne zitierten gegenseitig veraltete/falsche Preise des jeweils anderen, plus eine echte Gartner-Reviewzahl-Vertauschung 3.081↔2.875; Runde 2 nach Fix-Durchlauf: 8 weitere Funde, u. a. verbliebene Ableitungsrechnungen auf Basis der alten Preise und zwei neue fabrizierte Testbehauptungen in `index.mdx`). Ein von der Fix-Runde selbst verursachter MDX-Syntaxfehler (`<5` in einer Markdown-Tabelle brach den kompletten Build für die SentinelOne-Review) wurde beim finalen Build-Gate entdeckt und behoben | Alle 15 Rows `tracking_status='unverified'` → **0 `offer`-CTAs überhaupt möglich**, ausschließlich `review`/`visit`; Check-Point-SASE-Programm-Registrierung, 1Password-CJ-Anbindung und NordLayer-eigenes Partnerprogramm als Owner-Folgetasks dokumentiert |
| 9 | Gold Investing (`gold-investing/platforms`) | Augusta/AHG/Birch/Noble/MME/SD Bullion neu; Silver Gold Bull NICHT in Top-9 (dead link separat reparieren = Folgetask) | Keine verifizierten Links → visit/review |
| 10 | High-Yield Savings (`personal-finance/high-yield-savings`) | Alle 9 neu; APY-Volatilität → `data_verified_at` Pflicht + „rates change daily"-Hinweis in methodology; SoFi-Links gehören zu anderen Produkten → NICHT als Savings-Offer nutzen | Keine → ranked-unmonetarisiert, `visit` |

### Slice 11 — Phase E: Multi-Market-Plumbing (Voraussetzung für CFD; kein Seed)
- [ ] **Fix 1 Regulator-Lookup** — bewusste Abweichung vom wörtlichen Addendum-Vorschlag, weil `getPrimaryRegulator` für US weniger liefert als die Live-Configs (nur `SEC` statt `SEC+SIPC`, `''` für debt-relief etc.) und die Referenzseiten sich nicht ändern dürfen: Helper `getEffectiveRegulators(market, category, config)` in `lib/comparison/topics/` — `market === 'us' ? config.compliance.regulators : [getPrimaryRegulator(market, category)].filter(Boolean)`; in `page.tsx:191` verwenden. US-Seiten bleiben byte-identisch, UK/AU bekommen FCA/ASIC.
- [ ] **Fix 2 Currency** — `formatMoney(n, market)` in `lib/comparison/` (nutzt `marketConfig[market].currencySymbol`/`.locale` aus `lib/i18n/config.ts`); Formatter-Signaturen in `topics/types.ts` um optionalen `market`-Parameter erweitern (`format: (value: unknown, market?: Market) => string` — bestehende einstellige Formatter bleiben zuweisbar, US-Configs unverändert); Aufrufstellen in den Cockpit-Komponenten reichen ihr vorhandenes `market`-Prop durch (minimal-invasive, begründete Freeze-Ausnahme laut Auftrag „Phase E als eigene Vorstufe"). Reine Formatierung, keine Umrechnung.
- [ ] **Fix 3 Manifest** — 2 Einträge (`market:'uk'` + `'au'`, `trading/cfd-brokers`) + `/public/images/comparison/cfd-brokers.webp` erzeugen.
- [ ] **noticeByMarket (Owner §7.7 — Pflicht für CFD, nicht optional)** — `compliance.noticeByMarket?: Partial<Record<Market, string>>` in `topics/types.ts` + Auflösungshelfer (Fallback `notice`). Für CFD ist ein reines FCA/ASIC-Badge NICHT ausreichend: pro Markt muss eine explizite Retail-CFD-Verlustwarnung sichtbar gerendert werden (UK: FCA-Stil „CFDs are complex instruments … [X]% of retail investor accounts lose money when trading CFDs"; AU: ASIC-konforme Formulierung). Dabei den Befund klären: `complianceNotice`-Prop wird von `page.tsx` nicht übergeben → verdrahten (Master-Spec §11.2 verlangt sichtbaren Notice); Vorher/Nachher-Screenshot beider Referenzseiten — falls dadurch erstmals ein Notice-Text sichtbar wird, ist das ein spec-konformer Bugfix, im PR dokumentieren.
- [ ] **Regressionstest (Pflicht-Gate):** beide Referenzseiten vor/nach Phase E — Screenshots aller 3 Views + mobil, `preview_inspect` auf Farben/Spacing; `npm run build` lokal; erst dann mergen.

### Slice 12 — CFD-Broker `/uk/trading/best/cfd-brokers` + `/au/trading/best/cfd-brokers` (UK+AU gleichzeitig, Owner §7.4)
- [ ] Quellenmatrix für 9 Kandidaten (IG, CMC, Capital.com, Pepperstone, eToro, Saxo, IC Markets, Plus500, XTB): Spread EUR/USD (Pips), max. Retail-Leverage (30:1 FCA/ASIC), Mindesteinzahlung (£/A$ — echte Marktpreise recherchieren, keine Umrechnung), Instrumente-Anzahl, FCA/ASIC-Lizenz, Plattformen. **Hargreaves Lansdown + SelfWealth explizit NICHT listen** (Shortlist-Disqualifikation).
- [ ] EINE TopicConfig `trading/cfd-brokers` (markt-blinde Registry bleibt); `noticeByMarket` ist Pflicht: UK = explizite FCA-Retail-Verlustwarnung, AU = ASIC-konforme Warnung — beide sichtbar gerendert, nicht nur Regulator-Badge; Formatter via `formatMoney(n, market)`.
- [ ] Zwei Seed-Sets in einer Migration (`market='uk'`-Rows + `market='au'`-Rows; Roster-Marktvermerke: XTB primär UK, IC Markets/CMC primär AU, IG/eToro/Plus500/Capital.com/Pepperstone/Saxo beide).
- [ ] Attribution-Gate: IG UK (£150 CPA) + IG AU + CMC AU laut Shortlist aktiv → tracking_status-Review; Plus500-Links tot → `review`; Neue (Capital.com, Pepperstone, Saxo, IC Markets, XTB) → `visit`.
- [ ] Zusätzlich zu den Standard-Gates: beide Märkte einzeln smoke-testen (£ vs. A$ im SSR-HTML, FCA- vs. ASIC-Badge/Notice), Hreflang prüfen.

---

## Slice-Template (gilt für Slices 1, 3–10, 12)

1. **Vorbereitung:** `git status` (fremde Änderungen unangetastet), Branch `feat/cockpit-<topic>`. Slice-Plan `docs/superpowers/plans/<datum>-cockpit-<topic>-slice.md` anlegen.
2. **Recherche → Quellenmatrix** (Pflicht vor Seed): alle Kandidaten × alle `attributesSchema`-Felder; nicht belastbar belegbare Werte als „offen" markieren → fließen NICHT in Ranking/Winner/Kostenrechner. Die Matrix wird als **eigene Markdown-Datei committed** (`docs/superpowers/plans/<datum>-cockpit-<topic>-source-matrix.md`, Teil des Slice-PRs) — damit später jeder APY/Spread/Gebührenwert auf seine Quelle rückführbar ist.
3. **Soft-live/Ranked-live-Entscheidung** nach Datenlage dokumentieren (Guardrail 4).
   - [ ] **Fable-5-Review-Checkpoint (Pflicht, Model-Routing-Regel):** Quellenmatrix + geplante Seed-Werte + Attribution-Gate-Einstufung + Soft/Ranked-Entscheidung durch Fable 5 prüfen lassen, BEVOR die Migration geschrieben/angewendet wird. Erst nach bestandenem Review (oder expliziter Owner-Freigabe) weiter.
4. **Code:** `lib/comparison/topics/<topic>.ts` (TopicConfig + Zod, Muster `robo-advisors.ts`) + Registry-Zeile in `topics/index.ts`. Kein weiterer UI-Code.
5. **Seed-Migration** `supabase/migrations/<ts>_seed_<topic>_<market>.sql` nach Muster `20260628120020_seed_robo_advisors_us.sql` (ON CONFLICT (market,category,topic,slug) DO UPDATE; `review_slug` nur wenn MDX existiert; `source_url`/`source_type`/`confidence`/`data_verified_at` je Row; Soft-live: `display_order` = redaktionelle neutrale Reihenfolge, kein `is_top_pick`).
   - **`external_url` IMMER für JEDEN Kandidaten setzen** (Owner-Entscheidung nach Slice 3, gilt ab sofort für jedes Thema): die offizielle, unverschleierte Homepage des Anbieters — nie ein getrackter Link, unabhängig von `is_affiliate`/`tracking_status`. Grund: `cockpit-card.tsx`s bestehende, eingefrorene CTA-Priorität (`ctaMode==='offer'` > `externalUrl` gesetzt > `reviewSlug` gesetzt) macht daraus automatisch den primären grünen „Visit site"-Button für JEDE Karte — konsistent mit dem Debt-Relief-Präzedenzfall (National Debt Relief hat sowohl `review_slug` als auch `external_url`). Ohne `external_url` zeigen Kandidaten mit Review stattdessen „Read review" als primären Button, was optisch inkonsistent zu Kandidaten mit `external_url` wirkt (siehe Slice 3, wo das erst nachträglich für alle 9 ergänzt werden musste). Kein neuer UI-Code nötig — nur die Datenspalte befüllen.
6. **SEO:** verdict/methodology/buyerGuide (H3 je Kriterium)/faq (≥5) in der Config; llms.txt-Eintrag in `app/llms.txt/route.ts`; JSON-LD/Sitemap kommen automatisch.
7. **Attribution-Gate-Review:** `mcp__smartfinpro__list_affiliate_links` je Kandidat; `tracking_status`-Änderungen nur per begründeter Migration; niemals `/go`-CTA ohne `verified`/`dashboard_only`.
8. **URL-/Interlink-Audit** (Addendum-Gate 6): `rg` über `content/` + `app/` nach altem/falschem Pfad zum Thema; interne Links ergänzen wo sinnvoll (z. B. Kategorie-Pillar → Best-X).
9. **Test-Gates (Master-Spec §14):**
   - `npx tsc --noEmit` · `npm run check:imports` · (bei MDX-Änderung) `npm run check:mdx`
   - lokal `npm run build` (CI baut nicht voll!)
   - Prod-Build-Smoke: `npm start` + `curl` → Top-3-Provider im SSR-HTML, JSON-LD parsebar, CTA-Modi korrekt je tracking_status
   - Migration(en) auf prod Supabase anwenden (pg-meta-Pattern / node-Script) + per Query verifizieren; danach Redeploy/Revalidate (SSG 1d). **Rollback/Fail-Safe:** VOR jeder Prod-Migration einen Query-Snapshot der betroffenen Rows sichern (SELECT-Dump nach `docs/superpowers/plans/data/` oder Scratchpad); bei Seed-Fehlern KEIN manuelles Rumfixen in der DB, sondern immer eine neue Korrektur-Migration.
   - **Paritäts-Check:** Preview-Screenshots der neuen Seite vs. BEIDE Referenzseiten in Cards/Table/Compare + mobil (375×812). Erwartung = **Komponenten-/Token-Parität, nicht Pixel-Identität** (neue Inhalte haben andere Textlängen): gleiche Komponenten, gleiche `--sfp-*`-Token-Werte (via `preview_inspect`: CTA-Grün, Gold-Badge, Sky-Buttons, Hover-States), gleiches Spacing-System, gleiche CTA-Stati, gleiche Breakpoints — keinerlei visuelle Neugestaltung. Jede Abweichung in Farbe/Hover/Spacing-System/Verhalten = Bug; unterschiedliche Textlänge = erwartbar.
10. **Homepage-Kachel-Check (Addendum-Gate 4):** Nach Migration+Deploy die Best-X-Kachel des Themas prüfen (`getBestXIndex`): Kachel verlinkt live auf die neue Seite; Winner-Chip („#1 … · Metrik") erscheint NUR bei Ranked-live mit belegten Top-3 — bei Soft-live darf KEIN Chip erscheinen. Der Index darf nie aggressiver kommunizieren als die Seite selbst.
11. **Mandatory Review Quality Gate (AGENTS.md)** — siehe Block unten — abarbeiten und im Slice-Report dokumentieren.
12. **Abschluss:** **Pre-Merge-Fable-5-Review** (Model-Routing-Regel Punkt 4: Datenintegrität, Attribution-Gate, SEO/AEO, Migration-Safety, Referenzseiten-Regression) bestanden · `npm run refresh:agent-context` · Commit/PR (nur eigene Dateien) · Deploy-Run-Conclusion prüfen (415-Coldstart-Flake → `gh run rerun`).

### Mandatory Review Quality Gate (AGENTS.md)

Bei jedem Slice mit MDX-/Comparison-/SEO-Textänderungen gilt zusätzlich AGENTS.md:
- Meta-Title 45–60 Zeichen, Meta-Description 140–160 Zeichen
- `modifiedDate` und `dataVerifiedDate`/`data_verified_at` auf aktuelles Datum
- exakt 1 H1, saubere H2/H3-Hierarchie
- interne Links Ziel ≥8, externe Autoritätslinks Ziel ≥6
- JSON-LD / canonical / hreflang prüfen
- Content-Quality-Score Ziel ≥90
- Vorher/Nachher-Tabelle mit diesen Metriken im Slice-Report (bei neuen Seiten: Soll/Ist-Tabelle)

---

## Folgetasks (außerhalb der Slices, nicht blockierend)
- Copy.ai/Jasper/Systeme.io aus `ai-tools` reklassifizieren (Datenhygiene, Shortlist §6-Hinweis)
- Silver-Gold-Bull- und FOREX.com-Dead-Links reparieren (falls nicht im jeweiligen Slice erledigt)
- Monitoring-Widget je Topic (Master-Spec §13) — eigenes Vorhaben

## Verifikation des Gesamterfolgs
Nach Slice 12: 12 Topics / 13 Routen live (11 US + 2 CFD), `getBestXIndex` zeigt Kacheln korrekt (Winner-Chip nur bei ranked mit belegten Top-3, Addendum-Gate 4), prod-curl je Route (SSR-Top-3 + JSON-LD), GSC/Indexing beobachten. Referenzseiten unverändert (Screenshot-Diff gegen Slice-0-Baseline).
