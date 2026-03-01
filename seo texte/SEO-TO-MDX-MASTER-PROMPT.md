# Master Prompt: SEO-Text → MDX Review-Seite (ReportLayout)

> **Version 4.0 | März 2026**
> Diesen Prompt für JEDE SEO-Text-Konvertierung verwenden.
> Erzeugt produktionsreife MDX-Dateien die den **Competitive Quality Score 9.5/10** erreichen.
> **Gold-Standard Review:** `content/au/business-banking/revolut-business-review.mdx` (Score 9.50/10)
> **Gold-Standard Guide:** `content/us/debt-relief/debt-consolidation-vs-debt-management.mdx`
>
> **NEU in v4.0:** Locked Component Blueprint, EvidenceCarousel, ScoringCriteria, MethodologyBox, 10-Dimension Quality Score Framework, Evidence Image Workflow, exakte Sektionsreihenfolge festgeschrieben.

---

## Aufgabe

Konvertiere einen SEO-Text aus dem Ordner `seo texte/` in eine produktionsreife MDX-Seite.
**Qualitätsziel:** Jede produzierte Seite MUSS den Competitive Quality Score 9.5/10 erreichen (siehe Anhang C).

## Automatisches Mapping (Ordnername → URL → Zieldatei)

Der SEO-Ordnername bestimmt automatisch Market, Category, Slug und Zieldatei.

### Namenskonvention der SEO-Ordner

```
seo texte/[MARKET]-[CATEGORY]/                → Pillar-Seite (index.mdx)
seo texte/[MARKET]-[CATEGORY]-[SLUG]/         → Review-Seite ([slug].mdx)
```

### Gültige Markets (erster Teil vor dem ersten Bindestrich)

`us` · `uk` · `ca` · `au`

### Gültige Categories (können selbst Bindestriche enthalten)

`ai-tools` · `cybersecurity` · `trading` · `forex` · `personal-finance` · `business-banking` · `credit-repair` · `debt-relief` · `credit-score` · `remortgaging` · `cost-of-living` · `savings` · `superannuation` · `gold-investing` · `tax-efficient-investing` · `housing`

### Mapping-Beispiele

| SEO-Ordner | Market | Category | Slug | Zieldatei | URL |
|---|---|---|---|---|---|
| `ca-tax-efficient-investing` | ca | tax-efficient-investing | index | `content/ca/tax-efficient-investing/index.mdx` | `/ca/tax-efficient-investing` |
| `ca-tax-efficient-investing-canadian-tax-guide` | ca | tax-efficient-investing | canadian-tax-guide | `content/ca/tax-efficient-investing/canadian-tax-guide.mdx` | `/ca/tax-efficient-investing/canadian-tax-guide` |
| `us-trading-robinhood-review` | us | trading | robinhood-review | `content/us/trading/robinhood-review.mdx` | `/trading/robinhood-review` |
| `us-ai-tools-jasper-ai-review` | us | ai-tools | jasper-ai-review | `content/us/ai-tools/jasper-ai-review.mdx` | `/ai-tools/jasper-ai-review` |
| `uk-personal-finance` | uk | personal-finance | index | `content/uk/personal-finance/index.mdx` | `/uk/personal-finance` |
| `au-gold-investing-apmex-review` | au | gold-investing | apmex-review | `content/au/gold-investing/apmex-review.mdx` | `/au/gold-investing/apmex-review` |

### Parsing-Logik (Schritt für Schritt)

```
1. Nimm den Ordnernamen, z.B. "ca-tax-efficient-investing-canadian-tax-guide"
2. Extrahiere Market: erste 2 Zeichen → "ca"
3. Entferne Market-Prefix: "tax-efficient-investing-canadian-tax-guide"
4. Matche die LÄNGSTE gültige Category von links:
   → "tax-efficient-investing" matcht ✓
5. Rest nach Category = Slug: "canadian-tax-guide"
   → Kein Rest = Pillar-Seite (slug = "index")
6. URL: /{market}/{category}/{slug}
   → US-Ausnahme: US hat KEIN /us/ Prefix → /{category}/{slug}
```

### SEO-Text finden

Im Ordner liegt immer genau EINE `.md`-Datei mit dem SEO-Content:

```
seo texte/[ORDNERNAME]/[beliebiger-name].md
```

Lies die erste (oder einzige) `.md`-Datei im Ordner.

### Artikel-Typ bestimmen

- **Slug = "index"** (Pillar-Seite): Kann Guide Mode ODER Review Mode sein — entscheide anhand des Inhalts
- **Slug ≠ "index"** (Review-Seite): IMMER Review Mode (MIT `rating` im Frontmatter → ReportLayout)

---

## Schritt 1 — Kontext lesen (PFLICHT)

Lies diese Dateien BEVOR du schreibst:

```
CLAUDE.md
content/_templates/expert-review-master.mdx
lib/mdx/components.tsx
content/au/business-banking/revolut-business-review.mdx   ← GOLD-STANDARD REVIEW (Score 9.5/10)
```

**Analysiere die Referenz-Datei genau.** Zähle:
- Wörter pro H2-Sektion (Ziel: 300-500 Wörter reiner Fließtext PRO Sektion)
- Component-zu-Prosa-Verhältnis (Ziel: 85% Prosa / 15% Components für Reviews)
- Absatzlänge (Ziel: 4-6 Sätze pro Absatz, narrative Struktur)
- Inline-Quellenlinks (Ziel: 25+ externe Quellen zu Regulierungsbehörden, Review-Plattformen, offiziellen Seiten)

---

## Schritt 2 — SEO-Text VOLLSTÄNDIG extrahieren (PFLICHT — keine Datenpunkte dürfen fehlen)

Der SEO-Text ist die **primäre Faktenquelle** für den MDX-Artikel. JEDER einzelne Datenpunkt, jede Zahl, jeder Prozentsatz und jede Aussage im SEO-Text MUSS im finalen MDX auftauchen. Nichts darf verlorengehen.

### 2.1 Pflicht-Extraktion — Systematisch nach Kategorien

Lies den vollständigen SEO-Text Zeile für Zeile und extrahiere **systematisch** in diese Kategorien:

| Kategorie | Was extrahieren | Wo im MDX einfügen |
|---|---|---|
| **Preise & Gebühren** | Exakte Beträge, Währungen, Tiers, Setup-Kosten, Transaktionsgebühren | Pricing-Tabelle, Hidden Costs, Break-Even |
| **Gebührenmodell** | Flat-Rate vs. Allowance vs. Per-Transaction — das EXAKTE Modell | Pricing-Sektion, Fee Comparison, Prosa |
| **Regulierung & Lizenzen** | ABN/ACN, AFSL-Nr., APRA-Status, AUSTRAC-Registrierung, FCA-Nr., Dispute Resolution | Compliance-Sektion, Disclaimer, Prosa |
| **User Reviews & Ratings** | Plattform-Ratings, Stichprobengrößen, Top-Lob, Top-Beschwerden | User Reviews Tabelle + Prosa |
| **Features & Tools** | Alle genannten Features mit konkreten Zahlen (z.B. "40+ Währungen", "23+ lokale Konten") | Features-Sektion, Prosa |
| **Vergleichsdaten** | Tabellen, Rankings, Konkurrenten mit deren exakten Stärken/Schwächen | Fee Comparison, ComparisonTable, Alternatives |
| **Case Studies & Szenarien** | Stadt, Geschäftstyp, Volumen, exakte Kostenzahlen vorher/nachher, Ersparnis | Real-World Cost Scenario |
| **FAQs** | Alle Fragen + Antworten mit konkreten Zahlen, ALLE genannten Entitätstypen | Frontmatter faqs |
| **Zielgruppen** | Wer profitiert, wer nicht, Break-Even-Schwellen, genannte Business-Typen | Who Should Use, bestFor |
| **Kundenprozesse** | Anmelde-Schritte, Dokumente, Zeitrahmen, KYC-Details | Sign-Up Sektion |
| **Wettbewerber-Details** | Konkurrenten-Preise, Features, Lizenzen, Länder, Regulierungsnummern | Comparison Tables, Alternatives |
| **Sicherheit** | Verschlüsselung, 2FA, Einlagensicherung, Segregated Accounts | Compliance & Security Sektion |
| **Transfer-Geschwindigkeit** | Prozentsätze (z.B. "60% unter 20 Sekunden"), Zeitangaben | Features, Prosa |
| **SEO Assets** | Meta Title, Meta Description, Schema.org JSON-LD, 144-Wort-Description | Frontmatter, separate Nutzung |

### 2.2 SEO Assets extrahieren (Meta-Daten aus dem SEO-Text übernehmen)

Der SEO-Text enthält am Ende immer einen **SEO ASSETS** Abschnitt. Diese Daten MÜSSEN 1:1 übernommen werden:

```
PFLICHT-ÜBERNAHME:
━━━━━━━━━━━━━━━━━
1. Meta Title       → frontmatter `title:` (max 60 Zeichen — EXAKT aus SEO-Text)
2. Meta Description → frontmatter `description:` (max 155 Zeichen — EXAKT aus SEO-Text)
3. Schema.org       → Werte (ratingValue, ratingCount, datePublished) ins Frontmatter übernehmen
4. 144-Wort-Desc    → Als Referenz für Executive Summary verwenden
```

**WICHTIG:** Wenn der SEO-Text einen Meta Title und Meta Description vorgibt, verwende diese EXAKT (nicht abändern, nicht "verbessern"). Die SEO-Texte sind für Zeichenlimits optimiert.

### 2.3 Extraktions-Output erstellen (intern — nicht im MDX)

Erstelle für dich selbst eine vollständige Extraktionsliste aller Datenpunkte. Beispiel:

```
EXTRAHIERTE DATENPUNKTE AUS SEO-TEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[P1] 16 Millionen globale Kunden
[P2] AUD 12 Milliarden monatliche Cross-Border-Transaktionen
[P3] Gebühren ab 0.63%
[P4] 40+ Währungen
[P5] 23+ lokale Kontodetails
[P6] AUD 65 einmalige Aktivierungsgebühr
[P7] Wise Interest 2.98% p.a. (seit April 2025)
[P8] 0.72% jährliche Management-Gebühr
[P9] ABN 88 631 583 291
[P10] AFSL No. 513764
...
[P38] Schema.org ratingValue: 4.3
```

### 2.4 Vergleichstabellen-Daten vollständig übernehmen

Wenn der SEO-Text Vergleichstabellen enthält (z.B. "Wise vs. Airwallex", "Wise vs. Revolut"):
- **ALLE Zeilen** der Tabelle müssen im MDX-Vergleich auftauchen
- **ALLE Konkurrenten-Zahlen** (Preise, Features, Lizenzen) exakt übernehmen
- **Fehlende Vergleichszeilen** hinzufügen, nicht weglassen (z.B. "Countries for sending", "ASIC regulated")
- **Verdict-Absätze** unter Vergleichstabellen in die Alternatives-Prosa einarbeiten

### 2.5 Cross-Check Pflicht — KEIN Datenpunkt darf fehlen

**Nach dem Schreiben des MDX-Artikels MUSS ein systematischer Cross-Check erfolgen:**

```
CROSS-CHECK PROZESS:
━━━━━━━━━━━━━━━━━━━━
1. Gehe JEDEN Datenpunkt [P1]-[Pn] aus der Extraktionsliste durch
2. Suche den Datenpunkt im fertigen MDX
3. Markiere: ✅ FOUND (mit Zeile) oder ❌ MISSING
4. Bei MISSING → sofort in den MDX einfügen
5. ERST wenn 100% FOUND → Artikel ist fertig
```

**Häufig vergessene Datenpunkte (besonders aufpassen):**
- Konkurrenten-Lizenznummern (z.B. Airwallex AFSL #487221)
- Konkurrenten-Preise (ALLE Tiers, nicht nur der niedrigste)
- "Countries for sending" Zeile in Vergleichstabellen
- Genaue Fallstudie-Zahlen (Monatliche Kosten vorher/nachher, Jahresersparnis)
- Alle Entity-Typen in FAQs (z.B. "sole traders, freelancers, limited companies, PUBLIC COMPANIES, partnerships, non-profits")
- Anmelde-Zeitrahmen (z.B. "around 10 minutes" vs. "under 10 minutes")
- Transfer-Geschwindigkeits-Prozentsätze (z.B. "60% unter 20 Sekunden, 80% innerhalb 24h")
- Regulatorische Details (AUSTRAC, AFCA-Mitgliedschaft, PPF-Lizenz)

### 2.6 Ausgabe-Verifizierung (PFLICHT nach jedem Artikel)

Am Ende jeder MDX-Konvertierung diese Tabelle ausfüllen:

```
SEO-TEXT DATENABGLEICH:
━━━━━━━━━━━━━━━━━━━━━━
| # | Datenpunkt aus SEO-Text | MDX-Position | Status |
|---|---|---|---|
| P1 | [Fakt] | [Sektion/Zeile] | ✅/❌ |
| P2 | [Fakt] | [Sektion/Zeile] | ✅/❌ |
| ... | ... | ... | ... |
| GESAMT | [N] Datenpunkte | | [N]/[N] ✅ |
```

**AKZEPTANZKRITERIUM: 100% der SEO-Text-Datenpunkte müssen im MDX enthalten sein.**
Kein Artikel darf als fertig gelten, wenn auch nur ein einziger Datenpunkt aus dem SEO-Text fehlt.

---

## Schritt 2.5 — Deep Research Integration (wenn vorhanden)

Wenn neben dem SEO-Text eine **Deep Research-Datei** vorliegt (z.B. aus Perplexity, Grok Deep Research, o.ä.), ist diese die **primäre Faktenquelle**. Der SEO-Text liefert die Struktur, die Research-Datei die Präzision.

### Research-Daten haben Vorrang

```
PRIORITÄT:
1. Deep Research Report  → Zahlen, Preise, Regulierung, User-Reviews
2. SEO-Text              → Struktur, Keywords, Themenfokus
3. Eigene Recherche       → Lücken füllen, Aktualität prüfen
```

### Pflicht-Extraktion aus Research-Dateien

Lies die Research-Datei vollständig und extrahiere systematisch:

| Kategorie | Was extrahieren | Beispiel |
|---|---|---|
| **Preise & Gebühren** | Exakte Beträge, Währungen, Tiers, versteckte Kosten | A$10/A$21/A$79 Monatspläne |
| **Gebührenmodell** | Flat-Rate vs. Allowance vs. Per-Transaction — das EXAKTE Modell | Interbank bis A$75k, dann 0.6% |
| **Regulierung** | Lizenznummern, Regulierungsbehörden, Compliance-Geschichte | AFSL No. 517589, AUSTRAC-Registrierung |
| **Compliance-Vorfälle** | Strafen, Verwarnungen, Untersuchungen mit Datum + Betrag | AUSTRAC A$187,800 Infringement (Sept 2025) |
| **User Reviews** | Plattform-Ratings, Stichprobengröße, Top-Beschwerden | ProductReview 1.8/5 (198 Reviews), Capterra 3.9/5 |
| **Neue Features** | Datum + Feature-Name + Impact auf Nutzer | BPAY (Sept 2025), Merchant Acquiring (Feb 2026) |
| **Konkurrenten** | Alle genannten Alternativen mit deren Stärken/Schwächen | Airwallex für E-Commerce Collections |
| **Zielgruppen** | Wer profitiert, wer nicht, Break-Even-Schwellen | >A$200k/Mo → Revolut; <A$15k/Mo → Wise |
| **Anmelde-Schritte** | Konkreter Prozess, Dokumente, Zeitrahmen | 8 Schritte, 100-Punkte-ID-Check, 1-5 Werktage |

### Cross-Check Pflicht

**IMMER den SEO-Text gegen die Research-Daten prüfen.** Häufige Diskrepanzen:
- SEO-Text hat veraltete Preise (z.B. "Free/A$39/A$149" statt aktuell "A$10/A$21/A$79")
- SEO-Text zeigt falsches Gebührenmodell (z.B. "flat 0.4% FX markup" statt "Allowance-System")
- SEO-Text listet Features die im Markt nicht verfügbar sind (z.B. "QuickBooks" in AU)
- SEO-Text fehlen Compliance-Vorfälle die für Transparenz/E-E-A-T kritisch sind

**Research-Daten gewinnen bei Widersprüchen.**

---

## Schritt 3 — Frontmatter erstellen

**WICHTIG: Immer MIT `rating` und `reviewCount`** — das aktiviert das ReportLayout mit Sidebar, Expert Verifier, Trust Bar, und automatischen Pros/Cons.

```yaml
---
title: "[KEYWORD] [YEAR]: [Value Promise]"
description: "[150 Zeichen max — Kernaussage + Zielgruppe + Outcome]"
author: "[Expert Name]"
reviewedBy: "[EXPERT NAME], [CREDENTIALS]"    # ⚠️ GENDER RULE: Name MUSS zum Porträt-Geschlecht passen! Siehe Experten-Tabelle unten
publishDate: "2026-[MM]-[DD]"
modifiedDate: "2026-[MM]-[DD]"
changelog:
  - date: "2026-[MM]-[DD]"
    note: "Initial publication with [X]-month hands-on testing data"
category: "[CATEGORY-SLUG]"
market: "[MARKET]"
rating: [4.5-4.9]
reviewCount: [1000-9000]
affiliateUrl: "/go/[PRIMARY-PARTNER]"
affiliateDisclosure: true
featured: false
pros:
  - "[Stärke #1 mit konkreter Zahl]"
  - "[Stärke #2 mit konkreter Zahl]"
  - "[Stärke #3 mit konkreter Zahl]"
  - "[Stärke #4 mit konkreter Zahl]"
  - "[Stärke #5 mit konkreter Zahl]"
  - "[Stärke #6 mit konkreter Zahl]"
cons:
  - "[Schwäche #1 — ehrlich und konkret]"
  - "[Schwäche #2 — ehrlich und konkret]"
  - "[Schwäche #3 — ehrlich und konkret]"
  - "[Schwäche #4 — ehrlich und konkret]"
  - "[Schwäche #5 — ehrlich und konkret]"
  - "[Schwäche #6 — ehrlich und konkret]"
  - "[Schwäche #7 — ehrlich und konkret]"
bestFor: "[Zielgruppe in einem Satz mit Zahlen/Kriterien]"
pricing: "[Preis-Zusammenfassung]"
guarantee: "[Garantie/Schutz-Info]"
sections:
  - id: "platform-evidence"
    title: "Platform Evidence"
  - id: "overview"
    title: "Overview"
  - id: "pricing"
    title: "[Market] Pricing"
  - id: "features"
    title: "Key Features"
  - id: "features-deep-dive"
    title: "Features Deep-Dive"
  - id: "fee-comparison"
    title: "Fee Comparison"
  - id: "cost-comparison"
    title: "Annual Cost Comparison"
  - id: "compliance"
    title: "[Regulator] Compliance & Security"
  - id: "who-should-use"
    title: "Who Should Use It"
  - id: "customer-support"
    title: "Customer Support"
  - id: "user-reviews"
    title: "User Reviews"
  - id: "how-[product]-makes-money"
    title: "How [Product] Makes Money"
  - id: "alternatives"
    title: "Alternatives Deep-Dive"
  - id: "vs-[main-competitor]"
    title: "[Product] vs. [Competitor]"
  - id: "how-we-tested"
    title: "How We Tested"
  - id: "verdict"
    title: "Our Verdict"
faqs:
  - question: "[FAQ #1]"
    answer: "[Antwort mit konkreten Zahlen, 2-4 Sätze]"
  # ... 6-8 FAQs
---
```

### Frontmatter-Pflichtfelder (NEU in v4.0)

| Feld | Pflicht? | Beschreibung |
|---|---|---|
| `changelog` | ✅ | Array mit `date` + `note` — zeigt Aktualisierungshistorie |
| `sections` | ✅ | Array mit `id` + `title` — generiert Quick Navigation im ReportLayout |
| `pros` | ✅ | 5-7 Pros mit konkreten Zahlen/Fakten |
| `cons` | ✅ | 5-7 Cons mit konkreten Zahlen/Fakten — EHRLICH (kein Weichspülen) |
| `bestFor` | ✅ | Ein Satz mit Zielgruppe + Schwellenwert (z.B. "SMEs with A$15k+ monthly FX") |
| `pricing` | ✅ | Kompakte Preis-Zusammenfassung aller Tiers |
| `guarantee` | ✅ | Free Trial, Geld-zurück, oder "N/A" |

---

## Schritt 4 — MDX-Body schreiben (KERN-REGELN)

### A) Goldene Regel: FLIESSTEXT DOMINIERT

Der Artikel liest sich wie **Experten-Journalismus**, NICHT wie eine Component-Showcase.

```
PFLICHT-VERHÄLTNIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  85% Fließtext-Prosa  |  15% Components
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### B) Absatz-Struktur (nicht verhandelbar)

- **4-6 Sätze pro Absatz** — niemals Einzeiler, niemals Textwände über 8 Sätze
- **Jede H2-Sektion beginnt mit 300-500 Wörtern** reinem Fließtext BEVOR irgendein Component erscheint
- **Mindestens 3 Absätze Prosa pro H2** bevor ein Tip/Warning/AnswerBlock kommt
- **Keine aufeinanderfolgenden Components** — zwischen jedem Component mindestens 150 Wörter Prosa
- **Jede Behauptung** enthält eine konkrete Zahl, Range oder Schwellenwert

### C) Schreibstil (wie Referenz-Datei)

```
RICHTIG (wie revolut-business-review.mdx — Score 9.5):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Revolut Business launched in Australia in May 2023 and has grown
aggressively — reaching over 1 million Australian customers by
early 2026, with a planned A$400 million investment over five years.
The platform positions itself as a cheaper, faster alternative to
Big 4 bank international transfers. After testing the platform for
six months (August 2025 – February 2026), processing over 200
transactions across multiple currencies, we found that Revolut
delivers genuine savings for businesses with high international
payment volumes — but the allowance-based pricing model catches
many users off guard when they exceed their plan limits."

→ Hands-on Testerfahrung, konkrete Zahlen, ehrliche Einschätzung.


FALSCH (zu viele Components, zu wenig Prosa):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Revolut Business

Revolut is a popular fintech company.

<Tip>Look for low interest rates.</Tip>

<AnswerBlock question="What is Revolut?">
It's a business banking app.
</AnswerBlock>

<Warning>Watch out for fees.</Warning>
```

### D) Sektions-Template

Jede H2-Sektion folgt diesem Pattern:

```
## [Section Title]

[Absatz 1: 4-6 Sätze — Kontext, warum wichtig, was auf dem Spiel steht]

[Absatz 2: 4-6 Sätze — Wie es funktioniert, Mechanik, konkrete Zahlen]

[Absatz 3: 4-6 Sätze — Beispielrechnung oder Szenario mit echten Dollarwerten]

[Absatz 4: 4-6 Sätze — Vorteile UND Risiken, ehrlich abwägen]

[Optional: EIN Component — Tip, Warning, oder AnswerBlock]

[Absatz 5: 2-3 Sätze — Überleitung oder interner Link zur nächsten Sektion]
```

### E) Component-Budget (STRENG)

Es gibt zwei Typen von MDX-Seiten mit unterschiedlichen Component-Budgets:

#### E1) Guide/Vergleichs-Seiten (kein einzelnes Produkt)

| Component | Max | Platzierung |
|---|---|---|
| ExecutiveSummary | 1 | Nach 150+ Wörtern Einleitungs-Prosa |
| AnswerBlock | 2-3 | Nur an echten Entscheidungspunkten, nach 300+ Wörtern Prosa |
| Tip | 1-2 | Mitte einer Sektion, nach vollständiger Erklärung |
| Warning | 1-2 | Nach Risiko-Diskussion, nie dekorativ |
| Info | 0-1 | Regulatorischer/Compliance-Hinweis |
| ProviderCard | 0-1 | Am finalen Entscheidungspunkt |
| AffiliateButton | 0 | NICHT im Body verwenden — ProviderCard hat eigenen CTA |
| FAQSection | 1 | Am Ende, mit faqs-Array als Prop |
| ComparisonTablePremium | 0-1 | Nach FAQSection, ganz am Ende |
| AutoDisclaimer | 1 | Letzte Zeile der Datei |

**GESAMT Guide-Seiten: Maximal 8-12 Components auf 2.800+ Wörter**

#### E2) Produkt-Review-Seiten — LOCKED COMPONENT BLUEPRINT (Score 9.5)

Produkt-Reviews nutzen das **ReportLayout** und folgen dem exakten Blueprint der Gold-Standard-Referenz `revolut-business-review.mdx`. Die Component-Palette ist festgeschrieben:

| Component | Anzahl | Platzierung | Zweck |
|---|---|---|---|
| **TrustAuthority** | 1 | Erste Zeile nach Frontmatter | Social Proof: 4 Key-Stats (Testing Period, Transactions, Currencies, Trustpilot) |
| **Warning** | 3-5 | Nach Risiko-Diskussion | Regulierungs-Warnungen (ASIC/FCA/CIRO), versteckte Kosten, Account-Risiken |
| **AnswerBlock** | 1 | Nach ASIC/FCA Warning, vor Platform Evidence | Kernfrage: "Welche [Markt]-Businesses sollten [Produkt] nutzen?" |
| **EvidenceCarousel** | 1 | Direkt nach AnswerBlock (vor erstem H2) | Live-Screenshots aus eigenem Testing — KEIN Marketing-Material |
| **ExecutiveSummary** | 1 | Nach 200+ Wörtern Intro-Prosa | 4-5 Key Findings + Bottom Line Absatz |
| **ExpertBox** | 1 | Nach 1-2 Absätzen verbindender Prosa | Benannter Experte mit Credentials + datengestütztes Zitat + Rating |
| **AffiliateButton** | 2 | Nach ExpertBox + nach Pricing Break-Even | CTA-Only (keine Sterne) — Platzierung nach Trust-Aufbau |
| **ScoringCriteria** | 1 | Nach AffiliateButton, vor erstem Content-H2 | 5 gewichtete Bewertungskriterien mit Scores + Erklärungen |
| **Info** | 1-2 | Nach ScoringCriteria + nach Cost Comparison | Berechnungserklärung, Key Assumptions |
| **CollapsibleSection** | 3-6 | Bei Listen mit 5+ Items | Accordion für: Integrations, Features, Sign-Up Steps, Security etc. |
| **Tip** | 2-4 | Nach Erklärung/Empfehlung | Konkurrenten-Tipps, Nischen-Empfehlungen |
| **ComparisonTable** | 1 | Alternatives-Sektion | 3-Wege Produkt-Vergleich mit Features + CTA |
| **MethodologyBox** | 1 | How We Tested Sektion (vor Prosa) | Strukturierte Testmethodik: Hours, Data Points, Period, Steps |
| **ProsCons** | 1 | Verdict-Sektion | 6 Pros / 6-7 Cons mit konkreten Zahlen |
| **CTABox** | 1 | Nach ProsCons | Finaler Conversion-Block mit Primary + Secondary CTA |
| **NewsletterBox** | 1 | Nach Sign-Up-Sektion | E-Mail-Capture |
| **AutoDisclaimer** | 1 | Letzte Zeile der Datei | Markt-spezifischer Disclaimer |

**GESAMT Review-Seiten: 25-35 Component-Instanzen auf 4.000-7.000 Wörter**
(CollapsibleSection zählt NICHT zum Budget — ist Layout-Wrapper)

> **⚠️ TrustAuthority — Approved Proof Design (NICHT ÄNDERN)**
> Das finale Design ist festgeschrieben und darf nicht verändert werden:
> - **Layout:** Split-Panel — links Titel-Panel (sky-blue, 260px) + rechts Stats in einer Zeile (lg:grid-cols-4, gap-px Dividers)
> - **Gradient-Akzentlinie** oben (navy → gold)
> - **Linkes Panel:** Shield-Icon (grüner Outline auf hellgrünem Hintergrund) + "VERIFIED PLATFORM DATA" (14px bold uppercase navy) + Source-Text (11px slate)
> - **Stats:** Werte 14px bold slate + Labels 12px normal slate, whitespace-nowrap, tabular-nums
> - **Mobile:** Gestapelt (flex-col) mit 2×2 Grid
> - **Props:** `stats` (Array mit label/value), `title?` (Default: "Verified Platform Data"), `source?` (z.B. "SmartFinPro Testing · AUSTRAC · Trustpilot")
> - **Beispiel-Aufruf:**
> ```mdx
> <TrustAuthority
>   title="Verified Platform Data"
>   source="SmartFinPro Testing · AUSTRAC · Trustpilot"
>   stats={[
>     { label: "Testing Period", value: "6 Months" },
>     { label: "Transactions Processed", value: "200+" },
>     { label: "Currencies Tested", value: "8" },
>     { label: "Trustpilot (Global)", value: "4.6/5 (357k+)" }
>   ]}
> />
> ```

> **⚠️ EvidenceCarousel — Live Testing Screenshots (NEU in v4.0)**
> Carousel mit echten Screenshots aus eigenem Testing. KEIN Marketing-Material.
> - **Layout:** Split-Panel Header (sky-blue left, white right) + Embla Carousel + Lightbox
> - **Gradient-Akzentlinie** oben (navy → gold)
> - **Features:** Arrows, Dots, Swipe, Keyboard (← →), Lightbox/Zoom bei Klick
> - **Tracking:** `screenshot_view`, `screenshot_next`, `screenshot_zoom` Events
> - **Position:** Direkt nach AnswerBlock, VOR dem ersten H2 (prominenteste Position)
> - **Props:**
>   - `slides`: Array von `{ src, alt, caption, testedOn }`
>   - `title?`: Default "Live Testing Evidence"
>   - `source?`: z.B. "SmartFinPro hands-on testing · Feb 2026"
>   - `methodNote?`: Transparenz-Text zur Screenshot-Herkunft
> - **Bilder:** In `public/images/evidence/[provider]-[market]/` mit Schema `[provider]-[market]-[nn]-[screen].jpg`
> - **Beispiel-Aufruf:**
> ```mdx
> <EvidenceCarousel
>   title="Live Testing Evidence"
>   source="SmartFinPro hands-on testing · Feb 2026"
>   methodNote="All screenshots were captured during live testing of [Product] in [Country] ([Month Year]). Sensitive data has been redacted. No images are sourced from marketing materials."
>   slides={[
>     {
>       src: "/images/evidence/[provider]-[market]/[provider]-[market]-01-[screen].jpg",
>       alt: "[Product] [Market] [screen] showing [specific UI elements visible]",
>       caption: "[Screen name] — [what the screen demonstrates]",
>       testedOn: "[Month Year] · [Product] [Market]"
>     },
>     // ... 4-10 Slides
>   ]}
> />
> ```

> **⚠️ ScoringCriteria — Gewichtete Bewertungskriterien (NEU in v4.0)**
> Zeigt die 5 Bewertungskriterien mit Gewichtung, Score und Erklärung.
> - **Layout:** Kompakte Tabelle mit Score-Bars + Gewichtung + Beschreibung
> - **Position:** Nach AffiliateButton, vor dem ersten Content-H2
> - **Props:**
>   - `title`: z.B. "How We Score [Product]"
>   - `criteria`: Array von `{ name, weight, score, description, icon }`
> - **Icons:** `"rates"`, `"features"`, `"ease"`, `"support"`, `"regulation"`
> - **Gewichtung MUSS 100% ergeben** (z.B. 25+20+20+15+20 = 100)
> - **Gesamtscore im Frontmatter `rating`** muss der gewichteten Berechnung entsprechen
> - **Beispiel-Aufruf:**
> ```mdx
> <ScoringCriteria
>   title="How We Score [Product]"
>   criteria={[
>     { name: "FX Rates & Cost", weight: 25, score: 4.9, description: "...", icon: "rates" },
>     { name: "Features & Tools", weight: 20, score: 4.7, description: "...", icon: "features" },
>     { name: "Ease of Use", weight: 20, score: 4.8, description: "...", icon: "ease" },
>     { name: "Customer Support", weight: 15, score: 3.8, description: "...", icon: "support" },
>     { name: "Regulatory Standing", weight: 20, score: 4.5, description: "...", icon: "regulation" }
>   ]}
> />
> ```

> **⚠️ MethodologyBox — Strukturierte Testmethodik (NEU in v4.0)**
> Zeigt die Testmethodik in einer strukturierten Box mit Key-Metriken.
> - **Layout:** Split-Panel Header + nummerierte Steps
> - **Position:** Am Anfang der "How We Tested" Sektion, VOR der Prosa
> - **Props:**
>   - `title`: z.B. "Our Testing Methodology"
>   - `hoursResearch`: Gesamtstunden Research
>   - `dataPoints`: Anzahl analysierter Datenpunkte/Transaktionen
>   - `testingPeriod`: z.B. "Aug 2025 – Feb 2026"
>   - `lastVerified`: z.B. "Mar 1, 2026"
>   - `steps`: Array von Strings — 5-6 konkrete Testschritte
> - **Beispiel-Aufruf:**
> ```mdx
> <MethodologyBox
>   title="Our Testing Methodology"
>   hoursResearch={180}
>   dataPoints={200}
>   testingPeriod="Aug 2025 – Feb 2026"
>   lastVerified="Mar 1, 2026"
>   steps={[
>     "Opened [Product] account and used it as primary platform for [X] months",
>     "Processed [X]+ transactions across [X] currencies tracking effective rates against benchmarks",
>     "Timed [X]+ transfers measuring initiation-to-arrival speed across delivery methods",
>     "Submitted [X] support tickets measuring response times and resolution quality",
>     "Tested every [market]-relevant feature: [list specific features tested]",
>     "Analysed [X]+ reviews across [X] platforms for cross-reference"
>   ]}
> />
> ```

> **⚠️ CollapsibleSection — Approved Proof Design (NICHT ÄNDERN)**
> Accordion-Komponente für Aufzählungslisten mit 5+ Items. Das Design ist festgeschrieben:
> - **Layout:** Split-Panel — links Label-Panel (sky-blue, 260px) + rechts "Show/Hide details" mit Chevron
> - **Gradient-Akzentlinie** oben (navy → gold)
> - **Linkes Panel:** Layers-Icon (navy auf hellblauem Hintergrund) + Title (14px bold uppercase navy) + Count-Badge (navy pill)
> - **Rechtes Panel:** "Show details" / "Hide details" Toggle + animierter Chevron (rotate-180)
> - **Content:** Nativ `<details>`/`<summary>` (kein JavaScript, Server Component kompatibel)
> - **Props:** `title` (string, Pflicht), `count?` (number), `defaultOpen?` (boolean, default false), `children`
> - **Regel:** JEDE Aufzählungsliste (ul/ol) mit **5 oder mehr Items** MUSS in CollapsibleSection gewrappt werden
> - **Beispiel-Aufruf:**
> ```mdx
> <CollapsibleSection title="Security Features" count={9}>
>
> - **256-bit TLS encryption** for all data in transit
> - **Two-factor authentication (2FA)** via SMS or authenticator app
> - ...
>
> </CollapsibleSection>
> ```

> **⚠️ Rating — Automatisch im Quick Verdict (NICHT im MDX verwenden)**
> Das Rating wird automatisch vom ReportLayout im Quick Verdict-Bereich angezeigt (unter Pricing).
> - **KEIN `<Rating>` Tag im MDX-Body verwenden** — der Wert kommt aus `schema.rating` im Frontmatter
> - **Design:** Split-Panel Proof Design mit Star-Icon + "OUR RATING" / "Expert Score" + Sterne + Wert/5
> - Das Rating erscheint nach Best For / Pricing im Quick Verdict, VOR dem Hauptinhalt

> **⚠️ AffiliateButton — CTA-Only Proof Design (NICHT ÄNDERN)**
> Der AffiliateButton zeigt NUR den CTA-Button, keine Sterne mehr (Rating ist jetzt im Quick Verdict):
> - **Layout:** Split-Panel — links "GET STARTED" / "Official Partner Link" (sky-blue) + rechts zentrierter Gold-Button
> - **Gradient-Akzentlinie** oben (navy → gold)
> - **Linkes Panel:** ArrowRight-Icon (navy auf hellblauem Hintergrund) + "GET STARTED" + "Official Partner Link"
> - **Rechtes Panel:** Gold CTA-Button mit Affiliate-Link

> **⚠️ Tabellen-Design — Zwei Varianten (NICHT ÄNDERN)**
>
> **Variante 1: Gradient-Header (Comparison Tables mit Produkt-Karten)**
> Für ComparisonTable, ComparisonTablePremium, BrokerComparisonPremium Header/Footer:
> - **Header-Gradient:** `linear-gradient(to bottom, var(--sfp-navy), #3B82F6)` — von oben (dunkel-navy) nach unten (helles Blau)
> - **Header-Text:** Weiß (`text-white`, `text-white/90`) — Produktnamen bold, Labels uppercase tracking-wider
> - **Sterne:** Amber-400 auf blauem Hintergrund, unfilled = `text-white/30`
> - **Recommended Badge:** Grüner Hintergrund (`--sfp-green`) mit weißem Text
> - **WinnerBadge:** Weiß-transparent (`rgba(255,255,255,0.2)`) Pill mit weißem Text
> - **CTA-Footer:** Gleicher Gradient wie Header + Gold-Buttons (`--sfp-gold`)
> - **Gilt für:** `comparison-table.tsx`, `comparison-table-premium.tsx`, `broker-comparison-premium.tsx`
>
> **Variante 2: Sky-Blue Flat-Header (Daten-Tabellen + Split-Panels)**
> Für Markdown-Tabellen, EnterpriseTable und alle Split-Panel-Komponenten:
> - **Header-Hintergrund:** `var(--sfp-sky)` (#E8F0FB) — flach, kein Gradient
> - **Header-Text:** `var(--sfp-ink)` (#1A1A2E) — dunkler Text auf hellblauem Hintergrund
> - **Alternating Rows:** Bleiben `var(--sfp-gray)` (#F2F4F8) — nur Header sind sky-blue
> - **Gilt für:** `StyledThead` + `WinnerTh` (lib/mdx/components.tsx), `EnterpriseTable`, alle Split-Panel linke Panels (TrustAuthority, ExpertBox, Rating, AffiliateButton, CollapsibleSection, EvidenceCarousel, ScoringCriteria, MethodologyBox, Quick Verdict OUR RATING)

**WICHTIG — Prosa-Regeln gelten trotzdem:**
- Zwischen je zwei Components MUSS mindestens ein Absatz (4+ Sätze) Prosa stehen
- Ausnahme: Der obere Trust-Block (TrustAuthority → Warning → AnswerBlock → EvidenceCarousel → Intro → ExecutiveSummary → Prosa → ExpertBox → AffiliateButton → ScoringCriteria) darf kompakter sein, weil er den "Above the Fold"-Bereich bedient
- **CollapsibleSection zählt NICHT zum Component-Budget** — sie ist ein Layout-Wrapper, kein Content-Component
- Alle Markdown-Tabellen zählen NICHT als Components, brauchen aber ebenfalls Prosa davor (siehe Schritt 4G)

### F) Pflicht-Sektionen — Guide/Vergleichs-Seiten

```
1.  ## [Themen-Überblick]                    — 300-500 Wörter + ExecutiveSummary
2.  ## [Vergleichstabelle]                   — Markdown-Tabelle + 100 Wörter Kontext
3.  ## [Option/Methode A]                    — 400-600 Wörter Fließtext + ggf. Warning
4.  ## [Option/Methode B]                    — 400-600 Wörter Fließtext + ggf. Tip
5.  ## [Option/Methode C]                    — 300-500 Wörter Fließtext
6.  ## [Option/Methode D] (falls vorhanden)  — 300-500 Wörter Fließtext + ProviderCard
7.  ## [Kosten/Impact-Vergleich]             — 300-400 Wörter mit Zahlen + Tip
8.  ## [Entscheidungs-Framework]             — 300-400 Wörter + AnswerBlock + ProviderCard
9.  ## [Real-World Szenarien]                — 3 Szenarien à 150-200 Wörter
10. ## Frequently Asked Questions            — <FAQSection faqs={[...]} />
    + <ComparisonTablePremium ... /> (falls Partner vorhanden)
    + <AutoDisclaimer category="..." market="..." />
```

### F2) Pflicht-Sektionen — Produkt-Review-Seiten: LOCKED SECTION ORDER (Score 9.5)

**Diese Reihenfolge ist festgeschrieben und basiert auf dem Gold-Standard `revolut-business-review.mdx`.**
Jeder neue Produkt-Review MUSS exakt dieser Sektionsreihenfolge folgen:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LOCKED SECTION ORDER — Produkt-Review-Seiten (Score 9.5 Blueprint)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ABOVE-THE-FOLD TRUST BLOCK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
<TrustAuthority>                          — 4 Key-Stats aus eigenem Testing + Social Proof

<Warning>                                 — Markt-spezifische Regulierungswarnung
                                            AU: "ASIC General Advice Warning"
                                            UK: "FCA Risk Warning"
                                            CA: "CIRO Risk Disclosure"
                                            US: "SEC/FINRA Disclosure"

<AnswerBlock>                             — Kernfrage: "Which [Market] businesses should consider [Product]?"
                                            Antwort: Zielgruppe + Volumen-Schwelle + Alternative

VISUAL EVIDENCE (prominenteste Position):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<span id="platform-evidence"></span>

## Platform Evidence & Screenshots

<EvidenceCarousel>                        — 4-10 Live-Screenshots aus eigenem Testing
                                            Titel: "Live Testing Evidence"
                                            Source: "SmartFinPro hands-on testing · [Month Year]"
                                            methodNote: Transparenz-Text
                                            Jeder Slide: src, alt, caption, testedOn

OVERVIEW (mit Trust-Block Fortsetzung):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## [Produkt]: [Kernnutzenversprechen]     — 200-300 Wörter Intro-Prosa mit 2+ internen Links
                                            → Kontext, Marktpositionierung, Kernaussage
                                            → Link zu Haupt-Konkurrent-Review
                                            → Link zur Pillar/Kategorie-Seite

<ExecutiveSummary>                        — 4-5 Bullet Points + "Bottom Line" Absatz
[1-2 Absätze verbindende Prosa]           — AFSL/Lizenzen, Kurzinfo, Methodik-Link
<ExpertBox>                               — Benannter Experte mit Credentials + Zitat + Rating
<AffiliateButton>                         — Primärer CTA (NUR Button, kein Rating)
                                            ⚠️ KEIN <Rating> im MDX!

---

SCORING FRAMEWORK:
━━━━━━━━━━━━━━━━━━
<ScoringCriteria>                         — 5 gewichtete Kriterien mit Score + Beschreibung
                                            Gewichtung MUSS 100% ergeben
                                            Gesamtscore = Frontmatter `rating`

<Info>                                    — Gewichtete Score-Berechnung erklären
                                            z.B. "(4.9×25% + 4.7×20% + ...) = 4.6/5"

---

PREIS & GEBÜHREN:
━━━━━━━━━━━━━━━━━
## [Markt]-Pricing & Plans [Jahr]         — 2-3 Sätze Kontext VOR der Tabelle
[Pricing-Tabelle: alle Tiers]             — Alle Pläne mit exakten lokalen Preisen

### Hidden Costs to Watch                 — 3-5 Sätze Prosa die erklären WARUM
[Hidden-Costs-Tabelle]                      diese Kosten wichtig sind

### Break-Even Analysis                   — Markdown-Tabelle: Volumen → bester Anbieter
                                          — 2-3 Sätze die Schwellenwerte erklären

<AffiliateButton>                         — Zweiter CTA nach Pricing-Analyse

---

<Warning>                                 — FX Allowance / Hidden Cost Warning

KEY FEATURES:
━━━━━━━━━━━━━
## Key Features for [Market]              — Feature-Sektionen mit Prosa + Tabellen
### [Feature-Cluster 1-5]                 — Jeweils 150-300 Wörter
                                          — <CollapsibleSection> für Listen 5+ Items
                                          — <Warning> wo relevant

<CollapsibleSection title="Integrations"> — Xero, MYOB, QuickBooks (marktabhängig)
<CollapsibleSection title="New Features"> — Timeline neuer Features mit Datum + Impact

---

DEEP-DIVE (Tiefenanalyse):
━━━━━━━━━━━━━━━━━━━━━━━━━━
## [Produkt] Features Deep-Dive           — Tiefgehende Analyse der wichtigsten Features
### [Feature A] im Detail                 — 200-400 Wörter pro Sub-Feature
### [Feature B] Vergleich vs. Konkurrenz  — Tabelle: Produkt vs. 4-5 Konkurrenten
                                            mit konkreten Kostenbeispielen

<Warning>                                 — Feature-spezifische Warnung (z.B. Weekend FX)

### [Feature C: z.B. Batch Payments]      — Praxisnahe Beschreibung
<CollapsibleSection>                      — Feature-Details wenn 5+ Items

---

FEE COMPARISON (6+ Spalten):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Fee Comparison: [Produkt] vs. Konkurrenz
[5-8 Sätze Prosa]                        — WARUM dieser Vergleich anders ist
[6-Spalten-Tabelle: 10-12 Zeilen]        — Alle Konkurrenten nebeneinander
                                          — <Tip> zu speziellem Konkurrenten

---

COST COMPARISON (Real-World Szenarien):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Annual Cost Comparison: [Markt] Business Profiles
[3+ Sätze Kontext]                       — Assumptions erklären
[Szenario-Tabelle: 3 Profile × 3-4 Anbieter]
<Info>                                    — Key Assumptions dokumentieren
[Takeaway-Absatz]                         — Klare Empfehlung mit Schwellenwerten

---

### Real-World Cost Scenario              — Konkretes Szenario mit echten Zahlen:
                                            "[Stadt]-basiertes [Geschäft] mit [Volumen]/Monat"
[Jährliche Kostenvergleich-Tabelle]       — 4-5 Kostenpositionen × 4 Anbieter
[Prosa: Was passiert bei Wachstum]        — Break-Even bei höherem Volumen

---

COMPLIANCE & SICHERHEIT:
━━━━━━━━━━━━━━━━━━━━━━━━
## [Regulierungsbehörde] Compliance       — Regulatorischer Status, Lizenzen
                                            mit LINKS zu Regulierungsbehörden
### Compliance History                    — EHRLICH: Strafen, Verwarnungen
                                            mit Datum, Betrag, Kontext
### Segregated Funds / Einlagensicherung  — Was ist geschützt, was nicht
### Security Features                     — <CollapsibleSection> für 5+ Features

---

ZIELGRUPPEN:
━━━━━━━━━━━━
## Who Should Use [Produkt]               — "Ideal For" + "NOT Ideal For" Absätze
### Ideal For                             — 4 Zielgruppen mit je 3-5 Sätzen
### NOT Ideal For                         — 4 Anti-Zielgruppen mit je 3-5 Sätzen
                                          — Interner Link zu Alternative

---

CUSTOMER SUPPORT:
━━━━━━━━━━━━━━━━━
## Customer Support: Our Testing Results  — Eigene Support-Test-Ergebnisse
### Support Channel Performance           — Tabelle: Channel, Response Time, Quality
### What We Found                         — 4-6 konkrete Findings mit Zeiten
### Comparison to Competitors             — Support-Vergleich mit 3-4 Anbietern
[Prosa: Empfehlung + AFCA-Hinweis]

---

USER REVIEWS (Multi-Plattform):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## What [Markt]-Users Are Saying          — 5-8 Sätze Prosa VOR der Tabelle
[Review-Tabelle: 4+ Plattformen]          — Platform | Rating | Sample Size | Key Finding
                                            mit LINKS zu Review-Plattformen
[Prosa: Was Nutzer loben/kritisieren]     — Zusammenfassung in eigenen Worten
<Warning>                                 — Häufigste Beschwerde (Account Freezes etc.)

---

BUSINESS MODEL TRANSPARENCY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## How [Produkt] Makes Money              — Revenue-Kanäle als nummerierte Liste
                                            5 Channels mit Erklärung
                                          — Abschluss: Incentive-Alignment für Leser

---

SIGN-UP:
━━━━━━━━
## How to Sign Up in [Market]             — Nummerierte Schritte
<CollapsibleSection title="Sign-Up Steps" count={N}>
                                          — 6-10 konkrete Schritte mit Dokumenten
</CollapsibleSection>
<Tip>                                     — Spezielle Nutzergruppen (Sole Traders etc.)
<NewsletterBox>                           — E-Mail-Capture

---

VERGLEICH (interaktiv):
━━━━━━━━━━━━━━━━━━━━━━━
## When to Choose an Alternative          — Prosa-Sektionen pro Konkurrent
### Choose [Konkurrent A] If...           — 1 Absatz mit Zahlen + Link
### Choose [Konkurrent B] If...           — 1 Absatz mit Zahlen
### Choose [Konkurrent C] If...           — 1 Absatz mit Zahlen
### Stick with [Traditional Option] If... — 1 Absatz

---

## [Produkt] vs. Alternatives             — <ComparisonTable> mit 3 Produkten
<ComparisonTable products={[...]}>        — 3 Produkte mit features, rating, CTA
<Tip>                                     — Nischen-Alternative (z.B. "domestic-only")

---

METHODIK (E-E-A-T):
━━━━━━━━━━━━━━━━━━━
## How We Tested [Produkt]  {#how-we-tested}
<MethodologyBox>                          — Strukturierte Test-Metriken
                                            hoursResearch, dataPoints, testingPeriod, steps

[200-300 Wörter Prosa]                    — Testzeitraum, Transaktionen, Währungen
                                            5 Testbereiche als nummerierte Liste
                                          — "This approach ensures..."

---

VERDICT + CONVERSION:
━━━━━━━━━━━━━━━━━━━━━
## Our Verdict: [Rating] for [Zielgruppe]
<ProsCons>                                — 6 Pros / 6-7 Cons mit konkreten Zahlen
<CTABox>                                  — Headline + Description + Primary CTA + Secondary CTA
[Regulatorischer Disclaimer in Kursiv]    — Lizenz-Nr., ABN, "general info only"
                                            mit LINKS zu ASIC/FCA/CIRO/AFCA
<AutoDisclaimer>                          — Automatischer Markt-Disclaimer
```

**PFLICHT-SEKTIONEN (jeder Review MUSS diese haben):**
- ✅ Platform Evidence & Screenshots (mit EvidenceCarousel)
- ✅ Pricing + Hidden Costs + Break-Even
- ✅ Compliance History (wenn Vorfälle existieren — Transparenz = Trust)
- ✅ Real-World Cost Scenario (DAS ist unser stärkster Differenzierungsfaktor)
- ✅ Fee Comparison (6+ Spalten)
- ✅ Annual Cost Comparison (3 Business Profiles)
- ✅ Customer Support: Our Testing Results
- ✅ User Reviews Multi-Plattform (4+ Plattformen)
- ✅ How [Product] Makes Money (Business Model Transparency)
- ✅ How We Tested (E-E-A-T Signal mit MethodologyBox)
- ✅ ScoringCriteria (gewichtete transparente Bewertung)

### G) Prosa vor JEDER Tabelle (nicht verhandelbar)

**Pflicht-Regel:** Jede Markdown-Tabelle braucht **mindestens 3 Sätze kontextgebende Prosa davor.** Die Prosa erklärt, WARUM die Tabelle wichtig ist und WAS der Leser daraus mitnehmen soll.

```
FALSCH:
━━━━━━━
### Hidden Costs

| Fee | Amount | Notes |
|-----|--------|-------|
| Weekend surcharge | 1.5% | Fri-Sun |


RICHTIG:
━━━━━━━━
### Hidden Costs to Watch

Revolut's headline pricing looks competitive, but several additional fees can
significantly increase your total cost of ownership. These are the charges
that do not appear in the main pricing table but affect most Australian
businesses in practice. The weekend FX surcharge in particular catches many
users off guard — if your business operates across time zones and processes
conversions outside Sydney market hours, you could be paying up to 1.5% more
without realising it.

| Fee | Amount | Notes |
|-----|--------|-------|
| Weekend surcharge | Up to 1.5% | Friday 23:00–Sunday 23:00 AEST |
```

Dieses Pattern gilt für ALLE Tabellen im Artikel:
- Pricing-Tabellen → erkläre das Gebührenmodell (Allowance vs. Flat vs. Per-Transaction)
- Fee-Comparison-Tabellen → erkläre warum der Vergleich nicht trivial ist (unterschiedliche Modelle)
- User-Review-Tabellen → erkläre den Review-Split und warum beide Seiten wichtig sind
- Feature-Tabellen → erkläre was die Features im Alltag bedeuten
- Cost-Scenario-Tabellen → beschreibe das Szenario bevor die Zahlen kommen

### H) Interne Links (Pflicht: 5-8 pro Review)

Jeder Produkt-Review muss **mindestens 5 interne Links** zu anderen SmartFinPro-Seiten enthalten. Die Links müssen **natürlich im Fließtext eingebettet** sein, nicht als separate Liste.

**Pflicht-Link-Typen:**

| Link-Typ | Beispiel | Platzierung |
|---|---|---|
| **Haupt-Konkurrent Review** | `[Wise Business](/au/business-banking/wise-business-review)` | Intro + Fee Comparison |
| **Kategorie-Pillar** | `[business banking options in Australia](/au/business-banking/)` | Intro oder User Reviews |
| **Verwandte Kategorie** | `[forex broker](/au/forex/)` | Feature-Sektion wo relevant |
| **Weitere verwandte Kategorien** | `[trading platform](/au/trading/)` | Deep-Dive oder Zielgruppen |
| **Cross-Category** | `[cyber threats](/au/cybersecurity/)` | Sicherheits-Sektion |
| **Weitere Pillar/Reviews** | `[personal finance products](/au/personal-finance/)` | "NOT Ideal For" Sektion |

**Link-Formel:** `[natürlicher Ankertext](/{market}/{category}/{optional-slug})`

**VERBOTEN:**
- Nackte URLs
- "Click here" oder "Read more" als Ankertext
- Mehr als 2 Links im selben Absatz
- Links in Tabellen (außer ComparisonTable-Component)
- Links zu nicht-existierenden Seiten (prüfe `content/` Ordner!)

### I) Inline-Quellenlinks (Pflicht: 25+ pro Review — NEU in v4.0)

Jeder Produkt-Review muss **mindestens 25 externe Quellenlinks** inline im Fließtext enthalten. Diese Links stärken E-E-A-T und beweisen, dass die Daten aus realen Quellen stammen.

**Pflicht-Quellentypen:**

| Quellentyp | Beispiel | Min. Anzahl |
|---|---|---|
| **Regulierungsbehörden** | `[AUSTRAC](https://www.austrac.gov.au/)`, `[ASIC](https://asic.gov.au/)`, `[APRA](https://www.apra.gov.au/)` | 5+ |
| **Review-Plattformen** | `[ProductReview.com.au](https://www.productreview.com.au/...)`, `[Trustpilot](https://www.trustpilot.com/...)` | 4+ |
| **Offizielle Produktseite** | `[Revolut Business pricing](https://www.revolut.com/en-AU/business/pricing/)` | 2+ |
| **Regierungs-/Schutzprogramme** | `[Financial Claims Scheme](https://www.apra.gov.au/financial-claims-scheme-for-adis)` | 2+ |
| **Branchen-Awards** | `[Finder Business Banking Award](https://www.finder.com.au/business-banking)` | 1+ |
| **Beschwerdestellen** | `[AFCA](https://www.afca.org.au/)` | 1+ |

**Formatierung:** Links immer mit beschreibendem Ankertext, nie als nackte URL. Mehrfachverwendung desselben Links ist erlaubt und erwünscht (z.B. AUSTRAC in Compliance UND User Reviews).

---

## Schritt 5 — FAQs (Frontmatter vs. Body — ACHTUNG Duplikate!)

### Produkt-Reviews (mit `rating` → ReportLayout)

Bei Seiten mit `rating` im Frontmatter rendert das **ReportLayout-Template automatisch die FAQs** aus dem Frontmatter. Deshalb:

```
✅ FAQs NUR im Frontmatter definieren (frontmatter.faqs)
   → Template rendert sie automatisch auf der Seite
   → Schema.org FAQPage JSON-LD wird automatisch generiert

❌ KEINE <FAQSection> im MDX-Body verwenden!
   → Sonst erscheinen FAQs DOPPELT oder DREIFACH auf der Seite
```

### Guide/Vergleichs-Seiten (ohne `rating`)

Bei Seiten OHNE `rating` müssen FAQs **explizit im Body** stehen:

```mdx
## Frequently Asked Questions

<FAQSection
  faqs={[
    {
      question: "...",
      answer: "..."
    }
  ]}
/>
```

Die FAQs im Frontmatter werden trotzdem für Schema.org JSON-LD genutzt. **Beide müssen identisch sein.**

### FAQ-Qualitäts-Regeln

- **6-8 FAQs** pro Artikel
- Jede Antwort: **2-4 Sätze** mit konkreten Zahlen
- Mindestens 1 FAQ zum **Haupt-Konkurrenten** (z.B. "Is Revolut or Wise better?")
- Mindestens 1 FAQ zur **Regulierung/Sicherheit** im jeweiligen Markt
- Mindestens 1 FAQ zur **Verfügbarkeit** im Markt
- Mindestens 1 FAQ zu einem **spezifischen Use Case** (z.B. "Can sole traders use...?")

---

## Schritt 6 — Abschluss-Elemente

Am Ende der Datei (nach Verdict):

```mdx
{/* Regulatorischer Disclaimer — IMMER in Kursiv, mit Links zu Regulierungsbehörden */}
*[Company Legal Name] (ABN/Company Number) holds [License] issued by [Regulator](link).
[Product] is not a bank/[specific status]. This article contains general information only
and does not constitute personal financial advice. [External Dispute Resolution body](link).*

{/* PFLICHT: AutoDisclaimer als letzte Zeile */}
<AutoDisclaimer category="[category]" market="[market]" />
```

---

## Schritt 7 — Regeln (nicht verhandelbar)

### Basis-Regeln (alle Artikel)

- [ ] **Kein Component vor 300 Wörtern Prosa** in jeder H2-Sektion
- [ ] **rating im Frontmatter** (aktiviert ReportLayout + Sidebar + Expert Verifier)
- [ ] **Keine HTML-Kommentare** `<!-- -->` — nur `{/* */}`
- [ ] **Alle Affiliate-Links** als `/go/[slug]` Pattern
- [ ] **AutoDisclaimer** als letzte Zeile
- [ ] **Keine aufeinanderfolgenden Components** — immer Prosa dazwischen
- [ ] **Jeder Absatz 4-6 Sätze** — keine Einzeiler, keine Textwände
- [ ] **Konkrete Zahlen** in jeder Behauptung ($-Beträge, %-Werte, Zeiträume)
- [ ] **Markt-spezifische Compliance** (FCA/UK, ASIC/AU, CIRO/CA, SEC/US)

### Guide/Vergleichs-Seiten (zusätzlich)

- [ ] **2.800+ Wörter** Gesamt (davon 90%+ Fließtext)
- [ ] **Max 8-12 Components** gesamt
- [ ] **FAQSection im Body** mit faqs-Array (identisch zum Frontmatter)
- [ ] **Interne Links** min. 3-5 pro Artikel

### Produkt-Review-Seiten (zusätzlich — Score 9.5 Blueprint)

- [ ] **4.000-7.000 Wörter** Gesamt (davon 85%+ Fließtext)
- [ ] **KEINE FAQSection im Body** — FAQs nur im Frontmatter (ReportLayout rendert sie)
- [ ] **Interne Links** min. 5-8 pro Artikel (natürlich im Fließtext)
- [ ] **Inline-Quellenlinks** min. 25 externe Quellen (Regulierungsbehörden, Review-Plattformen, offizielle Seiten)
- [ ] **Prosa vor jeder Tabelle** — min. 3 Sätze Kontext vor jeder Markdown-Tabelle
- [ ] **Min. 10 Markdown-Tabellen** (Pricing, Hidden Costs, Break-Even, Features, FX Comparison, Fee Comparison, Cost Scenarios, Support, User Reviews, Regulatory)
- [ ] **Hidden Costs Tabelle** — versteckte Gebühren separat aufgelistet
- [ ] **Break-Even-Analyse** — Volumen-Schwellen: wann lohnt sich welcher Anbieter
- [ ] **Real-World Cost Scenario** — konkretes Szenario mit Stadt + Geschäftstyp + Monatszahlen
- [ ] **6-Spalten Fee Comparison** — Produkt (alle Tiers) + 2-3 Konkurrenten nebeneinander
- [ ] **Annual Cost Comparison** — 3 Business Profiles × 3-4 Anbieter
- [ ] **User Reviews Multi-Plattform** — min. 4 Plattformen mit Rating + Sample Size + Key Finding + LINKS
- [ ] **Customer Support Testing** — eigene Test-Ergebnisse mit Ticket-Anzahl + Response-Zeiten
- [ ] **Business Model Transparency** — Wie verdient das Produkt Geld (5 Revenue-Kanäle)
- [ ] **Compliance History** — alle bekannten Strafen/Vorfälle mit Datum + Betrag (wenn existent)
- [ ] **How We Tested** Sektion — MethodologyBox + Prosa mit konkreten Zahlen
- [ ] **ScoringCriteria** — 5 gewichtete Kriterien mit Scores, Gewichtung = 100%
- [ ] **EvidenceCarousel** — Min. 4 Live-Screenshots aus eigenem Testing (oder Placeholder bis Bilder verfügbar)
- [ ] **ExpertBox** mit benanntem Experten, verifizierbaren Credentials und datengestütztem Zitat
- [ ] **TrustAuthority** mit 4 Key-Stats als erste Zeile nach Frontmatter
- [ ] **ProsCons** mit min. 6 Pros + 6 Cons, jeder Punkt mit konkreter Zahl/Fakt
- [ ] **CTABox** mit Primary + Secondary CTA (Secondary = Link zum Haupt-Konkurrenten)
- [ ] **Regulatorischer Disclaimer** in Kursiv vor AutoDisclaimer (mit Links zu Regulierungsbehörden)
- [ ] **Frontmatter `reviewedBy`** stimmt mit ExpertBox `name` überein
- [ ] **Frontmatter `changelog`** vorhanden mit Erstveröffentlichungsdatum
- [ ] **Frontmatter `sections`** vorhanden mit allen H2-Sektions-IDs
- [ ] **Gebührenmodell korrekt** — Flat-Rate vs. Allowance vs. Per-Transaction exakt dargestellt
- [ ] **Preise in Lokalwährung** — A$ für AU, £ für UK, C$ für CA, $ für US
- [ ] **KEIN `<Rating>` im MDX** — Rating wird automatisch im Quick Verdict (ReportLayout) aus `schema.rating` angezeigt
- [ ] **CollapsibleSection** für JEDE Liste mit 5+ Items (Integrations, Features, Sign-Up Steps, Security etc.)
- [ ] **AffiliateButton** zeigt NUR CTA-Button (keine Sterne) — Platzierung nach ExpertBox + nach Pricing
- [ ] **Gender Rule** — `reviewedBy`-Name passt zum Geschlecht des Experten-Porträts (siehe Tabelle)
- [ ] **AnswerBlock** vor Platform Evidence — beantwortet die Kernfrage des Artikels
- [ ] **NewsletterBox** nach Sign-Up-Sektion

### ⚠️ Expert Gender Rule — PFLICHT (NICHT ÄNDERN)

Jedes Experten-Porträt hat ein festes Geschlecht. Der `reviewedBy`-Name im Frontmatter **MUSS** zum Geschlecht des Bildes passen.
Zentrale Datei: `lib/experts/image-routing.ts`

| Markt | Expert Name (reviewedBy) | Bild-Datei | Geschlecht |
|-------|-------------------------|------------|------------|
| US | James Miller, CFA, CFP | james-miller.jpg | männlich |
| US | Michael Torres, CFP, CFA | michael-torres.jpg | männlich |
| US | Robert Hayes, CMT, CFA | robert-hayes.jpg | männlich |
| US | James Mitchell, CISSP, CISM | james-mitchell.jpg | männlich |
| US | Michael Chen, CPA | michael-chen.jpg | männlich |
| US | Dr. Sarah Chen, CPA, CFP | sarah-chen.jpg | **weiblich** |
| UK | Sarah Thompson, CFA, CISI | sarah-thompson.jpg | **weiblich** |
| UK | James Blackwood, CFA, CISI | james-blackwood.jpg | männlich |
| CA | Marc Fontaine, CFA, CIM | marc-fontaine.jpg | männlich |
| CA | Philippe Leblanc, CFA | philippe-leblanc.jpg | männlich |
| AU | Emma Whitfield, CFA, AFA | daniel-whitfield.jpg | **weiblich** |
| AU | James Liu, AFA | james-liu.jpg | männlich |

**Regeln:**
- Weibliches Porträt → IMMER weiblicher Name (Sarah, Emma, Charlotte, etc.)
- Männliches Porträt → IMMER männlicher Name (James, Michael, Marc, etc.)
- `ExpertBox name=` MUSS exakt dem `reviewedBy`-Vornamen+Nachnamen entsprechen
- Bei neuen Alias-Namen: Geschlecht des Bildes prüfen in `EXPERT_IMAGE_GENDER` Map

---

## Schritt 8 — Validierung

### Basis-Checks (alle Artikel)

```bash
# Wortanzahl (Guide: mind. 2.800 / Review: mind. 4.000)
wc -w content/[MARKET]/[CATEGORY]/[SLUG].mdx

# Keine HTML-Kommentare
grep -c '<!-- ' content/[MARKET]/[CATEGORY]/[SLUG].mdx

# MDX-Syntax
npm run check:mdx

# Import-Checks
npm run check:imports
```

### Review-spezifische Checks

```bash
# Component-Zählung (Review: Alle Pflicht-Components vorhanden?)
grep -cE '<(TrustAuthority|ExecutiveSummary|ExpertBox|AffiliateButton|Warning|Tip|Info|AnswerBlock|EvidenceCarousel|ScoringCriteria|MethodologyBox|ComparisonTable|ProsCons|CTABox|NewsletterBox|AutoDisclaimer)' content/[MARKET]/[CATEGORY]/[SLUG].mdx
# ⚠️ Rating ist NICHT in der Zählung — wird automatisch im Quick Verdict angezeigt
# CollapsibleSection zählt NICHT zum Component-Budget (Layout-Wrapper)

# Pflicht-Components vorhanden?
for comp in TrustAuthority AnswerBlock EvidenceCarousel ExecutiveSummary ExpertBox AffiliateButton ScoringCriteria MethodologyBox ComparisonTable ProsCons CTABox AutoDisclaimer; do
  count=$(grep -c "<$comp" content/[MARKET]/[CATEGORY]/[SLUG].mdx)
  echo "$comp: $count"
done

# Keine FAQSection im Body (ReportLayout rendert sie automatisch)
grep -c '<FAQSection' content/[MARKET]/[CATEGORY]/[SLUG].mdx
# → Muss 0 sein für Review-Seiten!

# Interne Links zählen (min. 5)
grep -cE '\]\(/[a-z]{2}/' content/[MARKET]/[CATEGORY]/[SLUG].mdx

# Externe Quellenlinks zählen (min. 25)
grep -cE '\]\(https?://' content/[MARKET]/[CATEGORY]/[SLUG].mdx

# Markdown-Tabellen zählen (min. 10)
grep -c '|.*|.*|.*|' content/[MARKET]/[CATEGORY]/[SLUG].mdx

# ExpertBox name vs. frontmatter reviewedBy Konsistenz
grep 'reviewedBy' content/[MARKET]/[CATEGORY]/[SLUG].mdx
grep 'name=' content/[MARKET]/[CATEGORY]/[SLUG].mdx | grep 'ExpertBox' -A1

# Frontmatter changelog vorhanden
grep -c 'changelog:' content/[MARKET]/[CATEGORY]/[SLUG].mdx

# Frontmatter sections vorhanden
grep -c 'sections:' content/[MARKET]/[CATEGORY]/[SLUG].mdx

# Tabellen mit Prosa davor (manuell prüfen)
grep -n '|.*|.*|' content/[MARKET]/[CATEGORY]/[SLUG].mdx | head -20
# → Jede Tabelle sollte min. 3 Zeilen Prosa davor haben

# Doppelte --- (horizontale Linien) finden
grep -n '^---$' content/[MARKET]/[CATEGORY]/[SLUG].mdx
# → Keine zwei --- direkt hintereinander
```

### Inhaltliche Prüfung (manuell)

- [ ] Preise stimmen mit offizieller Produktseite überein
- [ ] Gebührenmodell korrekt dargestellt (nicht vereinfacht/verfälscht)
- [ ] Compliance-Vorfälle vollständig und mit korrektem Datum/Betrag
- [ ] User-Review-Ratings aktuell und mit Quellenangabe + Links
- [ ] Alle internen Links zeigen auf existierende Seiten
- [ ] Alle externen Quellenlinks sind aktive, verifizierbare URLs
- [ ] ExpertBox-Name = Frontmatter reviewedBy (ohne Credentials-Suffix)
- [ ] Real-World-Szenario-Rechnung mathematisch korrekt
- [ ] Break-Even-Schwellen logisch konsistent
- [ ] ScoringCriteria-Gewichtung ergibt 100%
- [ ] Gewichteter Score in ScoringCriteria = Frontmatter `rating`

---

## Schritt 9 — Zusammenfassung ausgeben

Nach Fertigstellung:

### Basis (alle Artikel)
1. Dateipfad
2. Wortanzahl (Gesamt + Fließtext-Anteil)
3. Anzahl H2-Sektionen
4. Prosa/Component-Verhältnis (Guide: 90/10, Review: 85/15)
5. Component-Nutzung mit Anzahl
6. Anzahl FAQs
7. Affiliate-Links (welche Slugs)
8. Interne Links (welche Seiten)
9. Compliance-Status
10. Eventuelle Warnungen

### Zusätzlich für Produkt-Reviews — Competitive Quality Scorecard

| Dimension (Gewicht) | Score | Details |
|---|---|---|
| Content Depth & Accuracy (10%) | /10 | [Wortanzahl, Tabellen, Prosa-Ratio] |
| E-E-A-T Signals (15%) | /10 | [Expert, MethodologyBox, ScoringCriteria, Testing-Daten] |
| Inline Sources & Citations (15%) | /10 | [Anzahl externe Links, Regulierungsbehörden, Review-Plattformen] |
| Rating Transparency (10%) | /10 | [ScoringCriteria vorhanden, gewichtete Berechnung, Erklärung] |
| Visual Evidence (10%) | /10 | [EvidenceCarousel, Anzahl Screenshots, methodNote] |
| Cost Comparisons & Scenarios (10%) | /10 | [Fee Comparison, Break-Even, Cost Scenarios] |
| Testing Methodology (10%) | /10 | [MethodologyBox, Support-Tests, Transaction-Tracking] |
| Regulatory Compliance (10%) | /10 | [Compliance History, Lizenzen, Warnungen, Disclaimer] |
| UX Components (5%) | /10 | [CollapsibleSection, TrustAuthority, ProsCons, CTABox] |
| Update Freshness (5%) | /10 | [changelog, modifiedDate, aktuelle Daten] |
| **GESAMT** | **/10** | **Ziel: ≥ 9.5** |

### Wettbewerbsvorteil-Scorecard (Pflicht-Elemente)

| Differenzierungsmerkmal | Status | Details |
|---|---|---|
| TrustAuthority | ✅/❌ | [4 Key-Stats] |
| AnswerBlock | ✅/❌ | [Kernfrage + Schwellenwert] |
| EvidenceCarousel | ✅/❌ | [Anzahl Screenshots] |
| ScoringCriteria | ✅/❌ | [5 Kriterien, Gewichtung 100%] |
| MethodologyBox | ✅/❌ | [Testing Period + Data Points] |
| Hidden Costs Tabelle | ✅/❌ | [Anzahl Gebühren aufgelistet] |
| Break-Even-Analyse | ✅/❌ | [Schwellenwerte] |
| Real-World Cost Scenario | ✅/❌ | [Stadt + Geschäftstyp + Monatsvolumen] |
| Annual Cost Comparison | ✅/❌ | [Anzahl Profile × Anbieter] |
| Fee Comparison (6+ Spalten) | ✅/❌ | [Welche Anbieter verglichen] |
| Customer Support Testing | ✅/❌ | [Ticket-Anzahl + Response-Zeiten] |
| User Reviews Multi-Plattform | ✅/❌ | [Anzahl Plattformen + Sample Sizes] |
| Business Model Transparency | ✅/❌ | [Anzahl Revenue-Kanäle] |
| Compliance History | ✅/❌/N/A | [Vorfälle + Beträge] |
| How We Tested (E-E-A-T) | ✅/❌ | [Testdauer + Transaktionen] |
| Prosa vor allen Tabellen | ✅/❌ | [Anzahl Tabellen mit Prosa davor] |
| Interne Links | ✅/❌ | [Anzahl + Zielseiten] |
| Externe Quellenlinks | ✅/❌ | [Anzahl + Typen] |
| Expert konsistent | ✅/❌ | [Name frontmatter = ExpertBox] |
| Regulatorischer Disclaimer | ✅/❌ | [Mit Links zu Behörden] |

---

## Beispiel-Aufrufe

Der Aufruf ist maximal einfach — du gibst nur den Ordnernamen an:

### Pillar-Seite (nur Market + Category)

```
Nutze den Master Prompt `seo texte/SEO-TO-MDX-MASTER-PROMPT.md`
und konvertiere den SEO-Text aus dem Ordner: ca-tax-efficient-investing
```

→ Claude erkennt automatisch:
- SEO-Text: `seo texte/ca-tax-efficient-investing/*.md`
- Market: `ca` | Category: `tax-efficient-investing` | Slug: `index`
- Zieldatei: `content/ca/tax-efficient-investing/index.mdx`
- URL: `/ca/tax-efficient-investing`

### Review-Seite (Market + Category + Slug)

```
Nutze den Master Prompt `seo texte/SEO-TO-MDX-MASTER-PROMPT.md`
und konvertiere den SEO-Text aus dem Ordner: us-trading-robinhood-review
```

→ Claude erkennt automatisch:
- SEO-Text: `seo texte/us-trading-robinhood-review/*.md`
- Market: `us` | Category: `trading` | Slug: `robinhood-review`
- Zieldatei: `content/us/trading/robinhood-review.mdx`
- URL: `/trading/robinhood-review` (US hat kein /us/ Prefix)

### Mehrere Ordner auf einmal

```
Nutze den Master Prompt `seo texte/SEO-TO-MDX-MASTER-PROMPT.md`
und konvertiere diese SEO-Ordner:
1. ca-forex-forex-com-review
2. ca-forex-questrade-forex-review
3. ca-forex
```

→ Claude verarbeitet alle drei nacheinander mit automatischem Mapping.

### Kurzform (wenn der Prompt bereits in der Session geladen ist)

```
Konvertiere: us-ai-tools-chatgpt-for-finance-review
```

---

## Anhang A — Die Tiefenanalyse-Methode: Surface Reviews vs. SmartFinPro

### Das Problem mit generischen Vergleichsportalen

Die meisten großen Vergleichsportale setzen auf **Breite statt Tiefe**: Hunderte Produkte mit je 500-800 Wörtern, generische Bewertungskriterien und keine marktspezifischen Details. Google belohnt zunehmend Seiten, die **E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) nachweisen — und genau da liegt unser Vorteil.

### Tiefenanalyse-Dimensionen: Wo wir uns differenzieren

| Dimension | Generische Reviews (Surface) | SmartFinPro (Tiefenanalyse, Score 9.5) |
|---|---|---|
| **Preisdarstellung** | Ein Preis, oft USD, oft veraltet | Alle Tiers in Lokalwährung (A$/£/C$) mit exaktem Gebührenmodell |
| **Gebührenmodell** | "Low fees" oder "Competitive rates" | Allowance vs. Flat vs. Per-Transaction — das EXAKTE Modell erklärt |
| **Versteckte Kosten** | Nicht erwähnt | Separate Tabelle: Weekend-Surcharge, Over-Allowance, Extras |
| **Kostenrechnung** | Keine | Konkretes Szenario: "[Stadt]-Importeur mit [Volumen]/Mo" durchgerechnet |
| **Entscheidungshilfe** | "Depends on your needs" | Break-Even-Schwellen: unter X → Anbieter A, über Y → Anbieter B |
| **Nutzermeinungen** | Eine Quelle oder keine | 4+ Plattformen mit Rating, Sample Size und Key Finding + Links |
| **Regulierungs-Transparenz** | Meist ignoriert | Strafen/Vorfälle mit Datum, Betrag, Kontext — ehrlich dokumentiert |
| **Testmethodik** | "Our editors reviewed this product" | MethodologyBox: "200 Transaktionen, 6 Monate, 8 Währungen" |
| **Visual Evidence** | Marketing-Screenshots oder keine | EvidenceCarousel: Live-Screenshots aus eigenem Testing |
| **Scoring-Transparenz** | Opaque "4.5/5" ohne Erklärung | ScoringCriteria: 5 gewichtete Kriterien mit individuellen Scores |
| **Anbietervergleich** | 2-3 Spalten, oberflächlich | 6+ Spalten: Produkt (alle Tiers) + 3-4 Konkurrenten + Nischenanbieter |
| **Business Model** | Nicht erwähnt | "How [Product] Makes Money" — Revenue-Kanäle transparent erklärt |
| **Support-Testing** | "Contact support for help" | 12 Test-Tickets mit Response-Zeiten und Resolution-Quality |
| **Interne Vernetzung** | Keine kontextuellen Links | 5-8 natürliche Links zu verwandten Reviews und Guides |
| **Feature-Aktualität** | Selten aktualisiert | changelog im Frontmatter + neue Features mit Datum + Impact |
| **Anmeldeprozess** | "Sign up on their website" | 6-10 konkrete Schritte mit Dokument-Anforderungen und Zeitrahmen |

### Die Formel: Tiefe × Ehrlichkeit × Lokalisierung × Evidence

```
SURFACE REVIEW (Competitor Score: 3-6/10):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Breite × Volumen = Hunderte Produkte, je 500 Wörter, generisch

  "Revolut offers competitive rates for business users."

  → Kein Marktbezug, kein Gebührenmodell, keine Zahlen.
     Der Leser weiß nach dem Lesen nicht mehr als vorher.


SMARTFINPRO TIEFENANALYSE (Score: 9.5/10):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tiefe × Präzision × Evidence = Ein Produkt, 5.000+ Wörter, marktspezifisch

  "Revolut's Scale plan offers interbank rates on conversions up to
   A$75,000/month. Above that limit, a 0.6% fee applies to every
   conversion. For a Melbourne importer converting A$60,000/month,
   that means A$948/year total cost vs. A$18,360 at CBA — backed
   by 200+ transactions we processed over 6 months of hands-on testing."

  → Exakter Plan, exaktes Limit, exakte Kosten, lokales Szenario,
     eigene Testing-Daten. Der Leser kann sofort entscheiden.
```

**Das Signal an Google:** Unsere Seiten bieten die tiefste, ehrlichste, lokal-relevanteste Information zu jedem Produkt — untermauert durch echte Screenshots und transparente Testmethodik. Das ist der Kern von E-E-A-T — und dieser Vorteil ist nicht durch Linkbuilding oder Domain Authority allein replizierbar.

---

## Anhang B — Häufige Fehler bei der Konvertierung

| Fehler | Problem | Lösung |
|---|---|---|
| SEO-Text-Preise blind übernommen | Veraltet oder falscher Markt | Immer gegen Research-Datei oder offizielle Seite prüfen |
| Gebührenmodell vereinfacht | "0.4% FX fee" statt Allowance-System | Exaktes Modell aus Research-Datei übernehmen |
| FAQSection im Body + Frontmatter | FAQs erscheinen 2-3× auf der Seite | Bei Reviews: NUR Frontmatter-FAQs (Template rendert) |
| ExpertBox-Name ≠ frontmatter reviewedBy | Inkonsistenz im Expert-Profil | Exakt gleichen Namen verwenden |
| Tabellen ohne Prosa davor | Sieht aus wie Daten-Dump | Min. 3 Sätze Kontext vor jeder Tabelle |
| Nur 1-2 interne Links | Schwaches internes Linking-Signal | Min. 5 natürliche Links zu verwandten Seiten |
| Nur 5-10 externe Quellenlinks | Schwaches E-E-A-T Signal | Min. 25 inline-Links zu Regulierungsbehörden, Reviews, offiziellen Seiten |
| QuickBooks für AU/UK gelistet | Feature existiert nicht in diesem Markt | Research-Datei prüfen: welche Integrationen sind WIRKLICH verfügbar |
| Keine Compliance-Vorfälle erwähnt | Mangelnde Transparenz = Trust-Verlust | Alle bekannten Strafen/Vorfälle ehrlich dokumentieren |
| reviewCount beliebig gewählt | Unglaubwürdige Zahl | Realistische Zahl basierend auf tatsächlicher Marktpräsenz |
| reviewedBy-Name passt nicht zum Porträt | Weibliches Foto mit männlichem Namen | Expert Gender Rule prüfen: `EXPERT_IMAGE_GENDER` Map |
| ScoringCriteria fehlt | Opaque Rating ohne Erklärung | 5 gewichtete Kriterien, Gesamtscore = frontmatter rating |
| EvidenceCarousel fehlt | Kein Visual Evidence | Min. 4 Screenshots oder Placeholder bis Bilder verfügbar |
| MethodologyBox fehlt | Testing-Methodik nicht strukturiert | Immer in "How We Tested" Sektion einbauen |
| changelog fehlt im Frontmatter | Keine Update-Historie | Immer mit Erstveröffentlichungsdatum anlegen |
| sections fehlt im Frontmatter | Keine Quick Navigation | Alle H2-Sektionen als id/title auflisten |
| Keine Business Model Sektion | Revenue-Modell unklar | "How [Product] Makes Money" ist Pflicht |
| Keine Customer Support Tests | Support nur vom Hörensagen | Eigene Test-Tickets dokumentieren |

---

## Anhang C — Competitive Quality Score Framework (Score 9.5 Ziel)

### Die 10 Dimensionen (gewichtet)

Jeder Produkt-Review wird gegen diese 10 Dimensionen gemessen. Das Ziel ist ≥ 9.5/10 gewichteter Gesamtscore.

| # | Dimension | Gewicht | Was wird gemessen | Score 10/10 bedeutet |
|---|---|---|---|---|
| 1 | **Content Depth & Accuracy** | 10% | Wortanzahl, Tabellen, Prosa-Ratio, konkrete Zahlen | 4.000-7.000 Wörter, 10+ Tabellen, 85%+ Prosa, jede Behauptung mit Zahl |
| 2 | **E-E-A-T Signals** | 15% | ExpertBox, ScoringCriteria, Testing-Daten, Credentials | Benannter Experte mit verifizierbaren Credentials + 200+ Test-Transaktionen |
| 3 | **Inline Sources & Citations** | 15% | Externe Links zu Regulierungsbehörden, Reviews, offiziellen Seiten | 25+ inline-Links, alle mit beschreibendem Ankertext, zu verifizierbaren Quellen |
| 4 | **Rating Transparency** | 10% | ScoringCriteria, gewichtete Berechnung, Erklärung | 5 Kriterien mit Gewichtung + individuelle Scores + Berechnungsformel |
| 5 | **Visual Evidence** | 10% | EvidenceCarousel, Screenshots aus eigenem Testing | 4-10 Live-Screenshots mit methodNote, captions, testedOn-Daten |
| 6 | **Cost Comparisons & Scenarios** | 10% | Fee Comparison, Break-Even, Real-World Cost Scenarios | 3+ Szenarien, Break-Even-Schwellen, 6-Spalten Vergleich, Annual Comparison |
| 7 | **Testing Methodology** | 10% | MethodologyBox, Support-Tests, Transaction-Tracking | 6+ Monate Testing, 200+ Transaktionen, 12+ Support-Tickets, strukturierte Methodik |
| 8 | **Regulatory Compliance** | 10% | Compliance History, Lizenzen, Warnungen, Disclaimer | Alle Vorfälle dokumentiert, Links zu Regulierungsbehörden, kursiver Disclaimer |
| 9 | **UX Components** | 5% | CollapsibleSection, TrustAuthority, ProsCons, Accordions | Alle Listen 5+ Items in Accordions, alle Pflicht-Components vorhanden |
| 10 | **Update Freshness** | 5% | changelog, modifiedDate, aktuelle Daten/Features | changelog vorhanden, Daten nicht älter als 3 Monate, neue Features dokumentiert |

### Score-Berechnung

```
Competitive Quality Score = Σ (Dimension_Score × Dimension_Weight)

Beispiel Gold-Standard (revolut-business-review.mdx):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Content Depth:        10/10 × 10% = 1.00
  E-E-A-T:              10/10 × 15% = 1.50
  Inline Sources:       10/10 × 15% = 1.50
  Rating Transparency:  10/10 × 10% = 1.00
  Visual Evidence:       8/10 × 10% = 0.80   (5 Screenshots, Ziel 8-10)
  Cost Comparisons:     10/10 × 10% = 1.00
  Testing Methodology:  10/10 × 10% = 1.00
  Regulatory:           10/10 × 10% = 1.00
  UX Components:         9/10 ×  5% = 0.45
  Update Freshness:      9/10 ×  5% = 0.45
  ─────────────────────────────────────────
  GESAMT:                              9.50/10 ✅
```

### Mindest-Scores pro Dimension

| Dimension | Minimum für 9.5 Gesamt |
|---|---|
| Content Depth | ≥ 9/10 |
| E-E-A-T | ≥ 9/10 |
| Inline Sources | ≥ 9/10 |
| Rating Transparency | ≥ 9/10 |
| Visual Evidence | ≥ 7/10 (verbessern wenn Screenshots verfügbar) |
| Cost Comparisons | ≥ 9/10 |
| Testing Methodology | ≥ 9/10 |
| Regulatory | ≥ 9/10 |
| UX Components | ≥ 8/10 |
| Update Freshness | ≥ 8/10 |

---

## Anhang D — Evidence Image Workflow

### Screenshot-Capture für neue Reviews

Für jeden neuen Produkt-Review sollten 5-10 Screenshots aus eigenem Testing erfasst werden.

#### Naming Convention

```
public/images/evidence/[provider]-[market]/[provider]-[market]-[nn]-[screen].jpg

Beispiel:
public/images/evidence/revolut-au/revolut-au-01-payments-drafts.jpg
public/images/evidence/wise-au/wise-au-01-dashboard.jpg
public/images/evidence/trading212-uk/trading212-uk-01-portfolio.jpg
```

#### Pflicht-Screenshots (10 Screens pro Review)

| # | Screen | Was zeigen | Blur |
|---|---|---|---|
| 01 | Sign-up/Onboarding | Registrierungsflow, Verifizierung | Name, E-Mail |
| 02 | Dashboard | Hauptansicht mit Kernmetriken | Kontonummern, Beträge |
| 03 | Kernfeature A | Hauptnutzen des Produkts | — |
| 04 | Kernfeature B | Zweiter Hauptnutzen | — |
| 05 | Pricing/Plans | Plan-Auswahl oder Kostenübersicht | — |
| 06 | Zahlungen/Transfers | Transaktionsflow oder Orderflow | Empfängerdaten |
| 07 | Einstellungen/Controls | Sicherheits- oder Account-Einstellungen | Persönliche Daten |
| 08 | Analytics/Reports | Reporting oder Performance-Ansicht | Beträge |
| 09 | Mobile App | Mobile Hauptansicht | Name |
| 10 | Integration | Drittanbieter-Integration (Xero, etc.) | Firmenname |

#### Image Processing

```bash
# Bilder verarbeiten mit dem Script:
bash scripts/process-evidence-images.sh

# Input:  raw-evidence/[provider]-[market]/
# Output: public/images/evidence/[provider]-[market]/
# Format: 1100×1300, center-crop, JPEG optimiert
```

#### Wenn keine Screenshots verfügbar

Wenn noch keine echten Screenshots vorliegen, verwende einen Placeholder-Kommentar im MDX:

```mdx
{/* TODO: EvidenceCarousel — Screenshots aus eigenem Testing einfügen wenn verfügbar */}
{/* Mindestens 4 Screenshots: Dashboard, Kernfeature, Pricing, Mobile */}
```

Das EvidenceCarousel kann später nachgerüstet werden. Der Visual Evidence Score startet dann bei 3/10 statt 8-10/10.

---

*SmartFinPro.com | SEO-to-MDX Master Prompt v4.0 | März 2026*
*Gold-Standard Guide: content/us/debt-relief/debt-consolidation-vs-debt-management.mdx*
*Gold-Standard Review: content/au/business-banking/revolut-business-review.mdx (Score 9.50/10)*
*Competitive Quality Score Target: ≥ 9.5/10 für jeden Produkt-Review*
