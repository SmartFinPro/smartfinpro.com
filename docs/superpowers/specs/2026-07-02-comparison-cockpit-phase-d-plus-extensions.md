# Comparison Cockpit — Phase D Scale-Out + Debt-Relief + CFD-Broker Extension

> **Typ:** Design-Addendum zu `2026-06-28-comparison-cockpit-design.md` (im Folgenden „Master-Spec").
> **Status:** Entwurf — Kandidatenlisten recherchiert & quellenbelegt, Produkt-Attributdaten (Gebühren/APY/Spreads etc.) **noch nicht erhoben**, Owner-Entscheidungen offen (siehe §7).
> **Datum:** 02.07.2026 · Setzt voraus: Phase A der Master-Spec ist live (`robo-advisors`, `business-bank-accounts`).
> **Quelle der Kandidatenlisten:** `docs/superpowers/specs/2026-07-02-best-x-candidate-shortlist.md` (im selben Verzeichnis, 8 US-Themen + Debt-Relief + CFD-Broker, jeweils gegen NerdWallet/Bankrate/Forbes Advisor/Investopedia/BrokerChooser/Money.com/G2 u.a. verifiziert).

Dieses Dokument ist **kein Plan** — Planung (Task-Reihenfolge, Slicing, Review-Checkpoints) ist bewusst Fable 5s Aufgabe. Es ist der **vollständige Requirements-Input**: welche 10 Themen (statt der ursprünglich 9 aus Master-Spec §15 Phase D), mit welchen Kandidaten, welchen bekannten Blockern und welchen offenen Entscheidungen.

---

## 1. Was sich gegenüber der Master-Spec ändert

Master-Spec §2 listet **10 Themen total**, davon 2 live (Phase A) und 8 in Phase D. Dieses Addendum:

1. Liefert für alle **8 Phase-D-Themen** die recherchierten Top-9-Kandidatenlisten (Master-Spec hatte nur die Taxonomie-Zeile, keine Produktkandidaten).
2. Ergänzt **ein 11. Thema: Debt-Relief** (Empfehlung dieser Session — Content + Affiliate-Deal existieren bereits, siehe §3).
3. Ergänzt **ein 12. Thema: CFD-Broker (UK/AU)** — das erste Nicht-US-Thema. Das **amendiert Master-Spec §17**, die „non-US markets/seeds" explizit als *out of scope* führt. Der konkrete Änderungsvorschlag steht in §5.

---

## 2. Aktualisierte Themen-Tabelle (ersetzt/ergänzt Master-Spec §2)

| # | Seite | market | category | topic | Route | Status |
|---|---|---|---|---|---|---|
| 1 | Best Robo-Advisors 2026 | us | personal-finance | `robo-advisors` | `/us/personal-finance/best/robo-advisors` | ✅ LIVE |
| 2 | Best Business Bank Accounts | us | business-banking | `business-bank-accounts` | `/us/business-banking/best/business-bank-accounts` | ✅ LIVE |
| 3 | Best Trading Platforms 2026 | us | trading | `trading-platforms` | `/us/trading/best/trading-platforms` | Spec bereit (§3) |
| 4 | Best Forex Brokers 2026 | us | forex | `forex-brokers` | `/us/forex/best/forex-brokers` | Spec bereit (§3) |
| 5 | Best Credit Repair Companies 2026 | us | credit-repair | `companies` | `/us/credit-repair/best/companies` | Spec bereit (§3) — Compliance-Flag |
| 6 | Best Credit Monitoring Services | us | personal-finance | `credit-monitoring` | `/us/personal-finance/best/credit-monitoring` | Spec bereit (§3) |
| 7 | Best AI Tools for Finance | us | ai-tools | `ai-tools-finance` | `/us/ai-tools/best/ai-tools-finance` | Spec bereit (§3) |
| 8 | Best Cybersecurity for SMB | us | cybersecurity | `cybersecurity-smb` | `/us/cybersecurity/best/cybersecurity-smb` | Spec bereit (§3) |
| 9 | Best Gold Investing Platforms | us | gold-investing | `platforms` | `/us/gold-investing/best/platforms` | Spec bereit (§3) |
| 10 | Best High-Yield Savings Accounts | us | personal-finance | `high-yield-savings` | `/us/personal-finance/best/high-yield-savings` | Spec bereit (§3) |
| **11** | **Best Debt Relief Companies** | us | **debt-relief** | `companies` | `/us/debt-relief/best/companies` | **NEU** — Spec bereit (§4) |
| **12** | **Best CFD Brokers** | **uk + au** | trading | `cfd-brokers` | `/uk/trading/best/cfd-brokers` + `/au/trading/best/cfd-brokers` | **NEU** — braucht Plumbing zuerst (§5) |

**Verifiziert (kein weiterer Check nötig):**
- `debt-relief` ist bereits in `marketCategories.us` registriert (`lib/i18n/config.ts`) — `isValidCombo('us','debt-relief')` ist bereits `true`.
- `trading` ist bereits in `marketCategories.uk` UND `marketCategories.au` registriert — die CFD-Route ist unter beiden Märkten strukturell erreichbar, sobald §5 umgesetzt ist.
- `product_attributes.market` CHECK-Constraint erlaubt bereits `'uk'`/`'au'` (Migration `20260627120000_product_attributes.sql:21`) — keine Schema-Änderung nötig, nur echte Zeilen.

---

## 3. Themen 3–10 — Kandidatenrosters (Phase D, unverändert zur Master-Spec-Reihenfolge)

Alle 9-Kandidaten-Listen mit Quellenbeleg, Konsens-Begründung und SmartFinPro-Status (Review/Affiliate-Link vorhanden ja/nein) liegen vollständig in **`2026-07-02-best-x-candidate-shortlist.md`, Abschnitte 1–8**. Diese Datei ist der maßgebliche Input für die `TopicConfig`- und Seed-Erstellung jedes Themas — hier nicht dupliziert, um Drift zwischen zwei Kopien zu vermeiden.

**Wichtiger Hinweis für die Planung (harter Blocker):** Diese Listen enthalten **Firmennamen + qualitative Begründung + Quellenbeleg**, aber **keine echten Attributwerte** (Gebühren, Mindesteinlagen, APY, Spreads, Ratings etc.), die `TopicConfig.attributesSchema` und die `_seed_*.sql`-Migration tatsächlich brauchen (Master-Spec §4/§5/§6.2). Bevor zu einem Thema eine Seed-Migration geschrieben wird, müssen diese Zahlen pro Kandidat separat erhoben werden (Owner-Entscheidung in §7: eigener Recherche-Pass oder manuelle Dateneingabe).

**Bekannte Compliance-Flags aus der Recherche (in TopicConfig.verdict/methodology bzw. redaktionell zu behandeln, nicht stillschweigend zu ignorieren):**
- **Credit-Repair (#5):** Lexington Law trägt ein $2,7-Mrd.-CFPB-Urteil (2023–2025), ~80% Personal-/Betriebsabbau, 10-Jahres-Telemarketing-Verbot. SmartFinPro hat aktuell einen aktiven Review dafür — Owner-Entscheidung nötig (§7), ob mit Disclosure featuren oder ersetzen (Kandidat: Safeport Law).
- **Cybersecurity-SMB (#8):** Perimeter 81 (bereits SmartFinPro-Partner) firmiert inzwischen als „Check Point SASE / Harmony SASE" — Branding auf der bestehenden Review-/Affiliate-Seite vor Cockpit-Launch verifizieren.

**Reihenfolge:** Master-Spec §15 Phase D empfiehlt: Trading Platforms → Forex Brokers → Credit Repair → Credit Monitoring → Business Bank Accounts (bereits live, migriert) → AI Tools → Cybersecurity → Gold Investing → High-Yield Savings. Dieses Addendum ändert diese Reihenfolge nicht, ergänzt nur Debt-Relief davor (§4) als zusätzlichen Quick-Win.

---

## 4. Thema 11 — Debt-Relief (neu, höchste Priorität)

**Warum zuerst (vor Trading Platforms aus Master-Spec §15):** Einziges Thema, bei dem Content UND ein aktiver Affiliate-Deal bereits existieren — geringstes Risiko, schnellster Vollzug.

- **Route:** `/us/debt-relief/best/companies` (Taxonomie-Regel D-taxonomy der Master-Spec: eigene Silo `debt-relief` existiert bereits → eigene Kategorie nutzen, nicht `personal-finance`, analog zu `credit-repair`).
- **Kandidatenliste:** `2026-07-02-best-x-candidate-shortlist.md`, Abschnitt 10 (9 Kandidaten: National Debt Relief, Freedom Debt Relief, Accredited Debt Relief, New Era Debt Solutions, Pacific Debt Relief, CuraDebt, Americor, GreenPath Financial Wellness, JG Wentworth).
- **Content:** `content/us/debt-relief/national-debt-relief-review.mdx` existiert bereits vollständig; `credit-repair-vs-debt-consolidation.mdx` als Cross-Link nutzbar.
- **DB-Fix vor Launch (Pflicht, kein Planungsschritt):** Der aktive Affiliate-Link `national-debt-relief` steht aktuell unter `category='personal-finance'` in `affiliate_links` statt `category='debt-relief'` — falsche Kategorie bedeutet, `getLinksForMarketCategory('us','debt-relief')` (Master-Spec §11.1-Pattern) findet ihn nicht und die Cockpit-Seite würde für National Debt Relief keinen monetarisierten CTA zeigen, obwohl der Link aktiv ist. **UPDATE-only**, kein Schema-Change (Pattern analog zum Silver-Gold-Bull-Pilot: `docs/superpowers/plans/2026-05-30-option-a-pilot-silvergoldbull.md`).
- **Compliance-Flags:** Freedom Debt Relief (2019 CFPB $20M+$5M, 2024 TCPA $9,75M) und Americor (CFPB-Beschwerden +540% 2021→2025, Colorado-AG-Vergleich 2022) — Owner-Entscheidung nötig (§7), ob/wie prominent featuren.
- **Sonst:** folgt exakt dem Master-Spec-Pattern (TopicConfig + Zod-Schema + Seed + SEO-Content + Attribution-Gate-Review, keine neuen Komponenten).

---

## 5. Thema 12 — CFD-Broker (UK/AU) — Amendiert Master-Spec §17

### 5.1 Warum das ein Sonderfall ist

CFD-Handel ist für US-Retail-Kunden per CFTC verboten — dieses Thema kann strukturell nicht als US-Seite existieren. Master-Spec §17 „Out of scope / later" listet aber explizit **„non-US markets/seeds"**. Dieser Abschnitt ist der konkrete Änderungsvorschlag, um genau diese eine Ausnahme freizugeben, **ohne** die generelle US-Only-Grenze für die anderen 11 Themen aufzuheben.

### 5.2 Befund (aus Code-Analyse dieser Session, 3 Agents, read-only)

Die Cockpit-Engine ist strukturell bereits fast multi-market-fähig (Routing, DB-Schema, Affiliate-Link-Zuordnung sind sauber markt-gebunden), aber **drei konkrete Stellen sind hart auf US codiert**:

| # | Problem | Datei:Zeile | Fix-Vorschlag |
|---|---|---|---|
| 1 | Compliance-Regulatoren statisch pro Topic, nicht pro Markt (`SEC`/`SIPC`/`FDIC` unabhängig von der URL) | `lib/comparison/topics/robo-advisors.ts:200-203`, `business-bank-accounts.ts:217-220`, konsumiert in `app/(marketing)/[market]/[category]/best/[topic]/page.tsx:191` → `components/marketing/cockpit-content.tsx:77-85,188-203` | Beim Rendern `getPrimaryRegulator(market, category)` aufrufen (existiert bereits, `lib/affiliate/regulator-map.ts:53-60`; liefert für `('uk','trading')` → `'FCA'`, für `('au','trading')` → `'ASIC'`) statt `config.compliance.regulators` direkt zu übergeben. `TopicConfig.compliance.notice` (freier Risikotext) bleibt pro Topic bestehen — nur die Regulator-Badges werden marktabgeleitet statt hartcodiert. **Hinweis:** `getPrimaryRegulator` liefert einen einzelnen String, `compliance.regulators` erwartet `string[]` — kleiner Adapter nötig (`[regulator].filter(Boolean)`). |
| 2 | Währung hart auf `$`/`en-US` codiert, kein Currency-Feld im Datenmodell | `lib/comparison/topics/robo-advisors.ts:27` (`usd()`-Helper), `business-bank-accounts.ts:17-19`; `lib/comparison/types.ts` (`ProductForComparison` hat kein Currency-Feld); `lib/comparison/cost.ts` (`costOverTime`/`orderProducts` reine Zahlenarithmetik) | Zentralen `formatMoney(n, market)`-Helper in `lib/comparison/` einführen, der `marketConfig[market].currencySymbol`/`.locale` (`lib/i18n/config.ts`, bereits vorhanden: `£`/`en-GB`, `A$`/`en-AU`) nutzt. `SpecColumn.format`/`CompareRow`-Signaturen (`lib/comparison/topics/types.ts`) müssten `market` als Parameter durchreichen — **einmalige, zentrale Änderung**, die dann für JEDES künftige Nicht-US-Thema mitgilt, nicht nur CFD. **Wichtig:** reine Formatierung, keine Betrags-Umrechnung — echte £/A$-Preispunkte pro Anbieter müssen trotzdem recherchiert/eingegeben werden (siehe §3-Blocker). |
| 3 | Homepage-Index (`BEST_X_MANIFEST`) zeigt nie Nicht-US-Kacheln | `lib/comparison/topics/manifest.ts:23-34` (alle Einträge `market: 'us'`), gefiltert in `lib/comparison/loader.ts:439` (`buildBestXIndex`) | Reine Daten-Ergänzung, keine Logik-Änderung: zwei neue Manifest-Einträge (`market:'uk'` und `market:'au'`, `category:'trading'`, `topic:'cfd-brokers'`). `buildBestXIndex(market)` filtert bereits korrekt pro Markt. |

**Bewusst NICHT geändert:** `getTopicConfig(category, topic)` (`lib/comparison/topics/index.ts:8-15`) bleibt markt-blind — **eine** `TopicConfig` für `trading/cfd-brokers`, die dank Fix #1+#2 pro Markt korrekt rendert, statt die Registry auf `market:category/topic`-Keys aufzuspalten (würde Konfigurationspflege für alle künftigen Themen unnötig verdoppeln).

**Zusatz-Guardrail für CFD:** `TopicConfig.compliance.notice` ist heute ein statischer String. Für CFD reicht das nur, wenn der Text bewusst marktneutral formuliert ist. Sobald UK und AU unterschiedliche Risiko-/Regulator-Sprache brauchen, muss die TopicConfig vor dem Launch um ein kleines Override-Muster erweitert werden (z. B. `compliance.noticeByMarket` oder `getComplianceNotice(market)`), statt UK/AU-spezifische Aussagen in einen gemeinsamen String zu pressen.

**Bereits korrekt, kein Fix nötig:** Affiliate-Link-Zuordnung (`getLinksForMarketCategory`, `lib/affiliate/link-registry.ts:139-147`) ist bereits markt- UND kategorie-gebunden; `AffiliateDisclosure` (`components/ui/affiliate-disclosure.tsx:26-57`) ist bereits marktlokalisiert (FCA/ASIC-Text vorhanden); Sitemap/Hreflang sind DB-getrieben und damit automatisch korrekt sobald echte UK/AU-Zeilen existieren.

### 5.3 Kandidatenroster

`2026-07-02-best-x-candidate-shortlist.md`, Abschnitt 9 (9 Kandidaten: IG, CMC Markets, Capital.com, Pepperstone, eToro, Saxo, IC Markets, Plus500, XTB — mit Markt-Eignung UK/AU/beide je Kandidat vermerkt). **Disqualifiziert trotz bestehendem SmartFinPro-Content:** Hargreaves Lansdown (kein eigenes CFD-Produkt, nur White-Label über IG) und SelfWealth (bietet gar keine CFDs an) — nicht auf dieser Seite listen, auch wenn Reviews/Affiliate-Links dafür existieren.

### 5.4 Empfohlene Reihenfolge

CFD-Broker läuft **nach** den 11 anderen Themen (Master-Spec Phase D + Debt-Relief), weil §5.2 echte Code-Arbeit voraussetzt, die für kein anderes Thema nötig ist. Empfehlung: die drei Fixes aus §5.2 als eigene Vorstufe planen (**Phase E — Multi-Market-Plumbing**), danach `TopicConfig` + Seeds für UK und AU gleichzeitig ausliefern (identische Config, unterschiedliche Produktzeilen — z.B. IC Markets primär AU, XTB primär UK, siehe Marktvermerke im Roster).

---

## 6. Was dieses Addendum NICHT tut

- Es sammelt **keine** echten Produkt-Attributwerte (Gebühren/APY/Spreads/Mindesteinlagen) — reine Namens-/Konsens-Recherche, siehe Blocker in §3.
- Es beantragt/verifiziert **keine** Affiliate-Programme für die „🆕 komplett neu"-markierten Kandidaten (ca. 60 von 99 über alle 12 Themen) — das ist BD-Arbeit außerhalb des Cockpit-Codes.
- Es trifft **keine** Compliance-Entscheidung zu Lexington Law / Freedom Debt Relief / Americor — nur Flag + Kontext, Entscheidung liegt beim Owner (§7).
- Es erweitert die Multi-Market-Fähigkeit **nur für CFD-Broker**, nicht generell für alle 12 Themen auf UK/CA/AU — Master-Spec §17 bleibt für alle anderen Themen in Kraft.

---

## 6.1 Ergänzende Go-live-Gates für Fable-5-Planung

Diese Gates sind bewusst redundant zur Master-Spec formuliert, weil sie bei einem 12-Themen-Rollout die häufigsten Fehler verhindern:

1. **Soft-live ist erlaubt.** Eine Topic-Seite darf schon mit Kandidatenroster, neutraler Reihenfolge und nicht-monetarisierten `Visit site`-/`Read review`-CTAs live gehen, damit das Gerüst, interne Links und die Homepage-Kachel früh stehen. Dann muss die UI aber klar als redaktioneller Vergleichsaufbau funktionieren: keine erfundenen Metriken, keine falschen Kostenrechner-Werte, keine harten "#1 wegen X%"-Claims, solange die echten Attribute fehlen.
2. **Ranked-live braucht Primärdaten.** Eine Seite darf erst als vollwertig gerankter, data-driven Cockpit-Vergleich mit Gewinner-Metrik, Kosten-/Spread-/APY-Vergleich und belastbarer Top-3 kommuniziert werden, wenn mindestens die für das TopicConfig-Schema benötigten Primärattribute erhoben sind (z. B. APY, Gebühren, Mindestanlage, Spread, Versicherung/SIPC/FDIC, Plattformumfang) UND pro Attribut eine belastbare Quelle vorliegt (`source_url`, `source_type`, `confidence`, `data_verified_at`). Snippet-basierte Shortlist-Belege reichen für diese Ranked-Version nicht.
3. **Kandidat ≠ monetisierter CTA.** `tracking_status` bleibt `unverified`, bis ein echter Tracking-Link, erlaubter SubID-Parameter und gegebenenfalls Postback-/Dashboard-Attribution pro Programm bestätigt sind. Unverifizierte Kandidaten dürfen redaktionell erscheinen, aber nicht als `/go`-Offer gerendert werden; externe Anbieter-Homepages ohne Affiliate-Code sind als `visit`-Fallback korrekt.
4. **Homepage-Kachel kennt zwei Zustände.** Eine Kachel darf schon auf eine Soft-live-Seite verlinken, aber dann ohne Winner-Chip wie "#1 Anbieter · Metrik". Der Winner-/Metric-Chip wird erst gezeigt, wenn `TopicConfig` registriert ist, aktive `product_attributes`-Rows existieren und die Top-3 mindestens `source_url` + `data_verified_at` + validierte Attribute haben.
5. **Bestehende Reviews vor Wiederverwendung prüfen.** Wo ein Kandidat bereits Review/Affiliate-Link hat, aber Compliance-/Branding-/Link-Flags trägt (Lexington Law, FOREX.com dead link, Perimeter 81/Rebranding, Plus500 dead links, Silver Gold Bull), muss zuerst die bestehende Seite bereinigt werden. Kein Cockpit sollte alten oder riskanten Content prominent recyceln.
6. **URL-/Interlink-Audit vor Launch.** Für jedes neue Topic einmal `rg` über MDX + App-Routen laufen lassen: bestehende alte Zielpfade, falsche Kategorie-Silos, fehlende interne Links und potenzielle Redirect-Aliasse identifizieren. Das verhindert, dass neue Cockpit-Seiten live sind, aber alte interne Links weiter auf Legacy-/404-Pfade zeigen.

---

## 7. Offene Entscheidungen für den Owner (vor Freigabe an Fable 5)

1. **Produkt-Attributdaten:** Sollen die echten Zahlen (Gebühren, APY, Mindesteinlagen, Spreads) pro Kandidat in einem weiteren Recherche-Pass erhoben werden, oder manuell/aus bestehenden Partnerunterlagen eingepflegt werden? Ohne diese Daten kann keine `_seed_*.sql`-Migration geschrieben werden — das ist der härteste Blocker vor jedem der 12 Themen.
2. **Lexington Law:** Trotz CFPB-Urteil weiter featuren (mit Disclosure) oder aus Credit-Repair-Seite entfernen/durch Safeport Law ersetzen?
3. **Freedom Debt Relief / Americor:** Mit sichtbarem Risikohinweis featuren oder aus der Debt-Relief-Top-9 streichen?
4. **CFD-Broker-Scope:** Beide Märkte (UK + AU) gleichzeitig launchen (empfohlen, da Fix #1+#2 aus §5.2 ohnehin marktagnostisch gebaut werden) oder erst UK, AU als Folge-Slice?
5. **Perimeter 81 / Check Point SASE Rebranding:** Bestehenden Review/Affiliate-Auftritt vor Cockpit-Launch aktualisieren?
6. **Reihenfolge-Bestätigung:** Debt-Relief zuerst (dieses Addendum) statt Trading Platforms zuerst (Master-Spec §15) — Owner-OK?
7. **CFD-Risikotext:** Reicht ein marktneutraler CFD-Risikohinweis für UK+AU oder soll die TopicConfig vor CFD-Launch ein markt-spezifisches `noticeByMarket`-Muster bekommen?

---

## 8. Referenzen

- Master-Spec: `docs/superpowers/specs/2026-06-28-comparison-cockpit-design.md`
- Kandidaten-Rohdaten (alle 12 Themen, mit Quellenbelegen): `docs/superpowers/specs/2026-07-02-best-x-candidate-shortlist.md`
- Regulator-Lookup (wiederverwendbar): `lib/affiliate/regulator-map.ts`
- Markt-Konfiguration (Currency/Locale bereits vorhanden): `lib/i18n/config.ts`
- Pilot-Muster für „einzelne Zeile aktivieren + Owner-Entscheidungen": `docs/superpowers/plans/2026-05-30-option-a-pilot-silvergoldbull.md`

---

## 9. Extern vorgeschlagene Ideen — geprüft und eingeordnet (Guardrail für Fable 5)

Im Zuge dieses Addendums wurde eine externe KI-generierte Strategie-Analyse (Traffic/Conversion/SEO, inkl. eines fertigen `reviews_data`-Schemas + Next.js-Seitentemplates) gegen den echten Code geprüft. Ergebnis, damit dieselben Vorschläge nicht versehentlich in einer künftigen Session (auch mit anderem Modell) unverifiziert umgesetzt werden:

**Übernommen (§9.1):**
- **Dynamische OG-Bilder pro Best-X-Themenseite.** Die Idee ist richtig, die konkrete Umsetzung existiert in dieser Codebase bereits als funktionierendes Muster: `next/og`'s `ImageResponse` (nicht das separate `@vercel/og`-Paket), siehe Referenzimplementierung `app/(marketing)/us/business-banking/programmatic-financial-firewall/opengraph-image.tsx`. **Für Cockpit-Themenseiten:** pro `(market,category,topic)` ein `opengraph-image.tsx` mit Titel + Top-Pick-Name + Rating, gerendert mit dem **hellen** Marken-Farbschema (`--sfp-navy`/`--sfp-gold`/`--sfp-sky`) — NICHT mit der dunklen Optik der Financial-Firewall-Referenzseite, die laut CLAUDE.md nur für Protocol-Landingpages gilt. `ImageResponse` unterstützt nur Inline-Flexbox-Styles, kein Tailwind/JSX-Import — beim Bauen berücksichtigen. Empfehlung: als kleiner Zusatzpunkt in Master-Spec §7 „Component architecture" mit aufnehmen, sobald eine Topic-Seite live geht.

**Explizit abgelehnt (§9.2) — nicht umsetzen, auch wenn die Idee erneut vorgeschlagen wird:**
- **Das vorgeschlagene `reviews_data`-Tabellenschema + Next.js-Seitentemplate.** Baut eine zweite, zur bestehenden `product_attributes`-Tabelle (Master-Spec §4) parallele Datenschicht auf — Architektur-Gabelung statt Erweiterung, widerspricht der „keine Gesamt-Refactorings"-Regel und der bereits reviewten (D1–D4 approved) Master-Spec.
- Im vorgeschlagenen Template werden Affiliate-Links **direkt und unverschleiert** verlinkt (`<a href={product.affiliate_url}>`), statt über `/go/[slug]/` + `buildTrackedDestinationUrl` (`lib/affiliate/tracker.ts:74`). Das verstößt gegen die CLAUDE.md-Pflichtregel „Affiliate-Links verschleiert" und **hebelt das Attribution-Gate aus** (Master-Spec §11.1 / §6.1 Punkt 3 dieses Addendums), das explizit gebaut wurde, um die reale 492-Klicks-→-0-Conversions-Lücke zu schließen.
- Hardcodierte Tailwind-Utility-Farben (`bg-blue-600`, `text-blue-600`) statt `var(--sfp-navy)`/`var(--sfp-gold)` — verstößt gegen die CSS-Variablen-Pflicht und das Markenfarbschema (Navy/Gold/Green, kein Blue-600-Akzent).
- Keine Compliance-/Regulator-Badge, keine markt-bewusste Währungsformatierung, kein `tracking_status`-Check — reproduziert exakt die Lücken, die in §5.2 dieses Addendums als CFD-Blocker identifiziert wurden, nur in einem zweiten, redundanten System statt als Fix am bestehenden.
- **Fazit:** Falls diese oder eine ähnliche Code-Vorlage einer anderen Session vorgelegt wird — nicht übernehmen. Stattdessen den bestehenden Cockpit/TopicConfig-Weg (Master-Spec + dieses Addendum) nutzen.

**Verifiziert falsch (§9.3):** Die Behauptung eines „Template-Bugs" (CFPB/IRS/NFCC-Methodik-Block auf der NordVPN-Review-Seite) wurde gegen `content/us/cybersecurity/nordvpn-review.mdx` geprüft und **nicht bestätigt** — die einzige Fed-Reserve-Erwähnung dort ist ein korrekter, themenbezogener Vergleich (AES-256-Verschlüsselungsstärke). Kein Handlungsbedarf; nicht in einen Content-Quality-Sweep aufnehmen, ohne erneut zu verifizieren.

**Bewusst außerhalb dieses Addendums (§9.4)** — legitime Ideen, aber eigenes Vorhaben, nicht Teil des Cockpit-Rollouts: GSC-Striking-Distance-Keyword-Loop, Topical-Authority-Content-Cluster, programmatische „X-vs-Y"-Seiten, Lead-Magnet/E-Mail-Funnel, Reddit/YouTube-Distribution. Die vorgeschlagenen AEO/GEO-Maßnahmen (Schema, TL;DR-Blöcke, `llms.txt`) sind zudem bereits präziser und genehmigt in Master-Spec §10 spezifiziert — dort ist nichts nachzurüsten.
