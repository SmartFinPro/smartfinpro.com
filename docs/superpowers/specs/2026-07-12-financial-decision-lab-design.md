# SmartFinPro Financial Decision Lab — Design- und Architekturspezifikation

> **Version 1.0 | 12. Juli 2026 | Status: Zur Review**
> Basis: `origin/main` @ `99960a0` (inkl. PR #71 cockpit_v1-Tracking, PR #73 Badge-Fix).
> Governance: Freigegebener Plan `~/.claude/plans/master-prompt-smartfinpro-financial-whimsical-frog.md` (Modellsteuerung, Design-Vorgaben Runde 1+2, Review-Korrekturen). Diese Spec ist die Single Source of Truth für Produkt, Design, SEO und Verträge; der Plan regelt Ausführung und Modell-Gates.
> Sprache: Dokumentation Deutsch, sämtliche Nutzertexte (H1, Titles, UI-Copy) Englisch.

---

## Inhalt

1. [Current-State-Audit](#1-current-state-audit)
2. [Vergleich der drei Lösungsansätze](#2-vergleich-der-drei-lösungsansätze)
3. [Empfehlung](#3-empfehlung)
4. [Informationsarchitektur](#4-informationsarchitektur)
5. [User Journeys der vier Major Tools](#5-user-journeys-der-vier-major-tools)
6. [Responsive Wireframe-Spezifikation](#6-responsive-wireframe-spezifikation)
7. [Design Tokens und Komponenten-Inventar](#7-design-tokens-und-komponenten-inventar)
8. [Berechnungs- und Datenverträge](#8-berechnungs--und-datenverträge)
9. [SEO-Routenmatrix](#9-seo-routenmatrix)
10. [tool_v1-Eventvertrag und Dashboard-Spezifikation](#10-tool_v1-eventvertrag-und-dashboard-spezifikation)
11. [Phasenplan mit PR-Grenzen](#11-phasenplan-mit-pr-grenzen)
12. [Acceptance Criteria je Phase](#12-acceptance-criteria-je-phase)
13. [QA-Matrix](#13-qa-matrix)
14. [Risiko-Register](#14-risiko-register)
15. [In-Scope / Out-of-Scope](#15-in-scope--out-of-scope)
16. [Dokumentations-Drift](#16-dokumentations-drift)

---

## 1. Current-State-Audit

### 1.1 Messbasis (bindende Formulierung)

**1.179 erfasste Affiliate-Klicks und 0 SmartFinPro zuordenbare Conversions** in 30 Tagen (MCP-Funnel, Stand 12.07.2026). Solange die Affiliate-Postbacks nicht vollständig integriert und validiert sind (CJ-`sid`-Fix live, `POSTBACK_SECRET` gesetzt, Netzwerk-Postback-Konfiguration offen), ist dies eine **Tracking-Baseline** — kein Beleg für tatsächlich 0 Abschlüsse. Alle CRO-Argumente dieser Spec stützen sich auf strukturelle Defizite, nicht auf diese Zahl.

### 1.2 Bestandszählung

- **20 öffentliche Tool-Routen** = 10 US + 3 UK + 4 CA + 3 AU, **17 Tool-Konzepte**, **4 Hub-Seiten**.
- CLAUDE.md („Interaktive Tools: 9") und der Homepage-Claim „9 Interactive Tools" (`components/marketing/homepage-sections.tsx`, `PlatformStats`-Default `totalTools=9`) sind falsch → Kapitel 16.
- Die Tool-Liste ist **fünffach dupliziert** ohne gemeinsame Quelle: `config/navigation.ts`, `app/(marketing)/tools/page.tsx` (14 Karten), `uk|ca|au/tools/page.tsx` (je eigenes Array), `app/sitemap.ts` (hardcoded, 3 auskommentiert).

### 1.3 Tool-Inventar (alle 20 Routen)

Legende: **Render** CL = Client-only via `dynamic-calculators.tsx` (`ssr:false`, kein SSR-HTML fürs Widget), SSR = statisch importiert + hydratisiert. **2×** = Doppel-Brand-Suffix (Title endet auf `| SmartFinPro`, Root-Template hängt es erneut an). **Q** = Qualität 1–5.

| # | Route | Page-Datei (`app/(marketing)/…`) | Status | Zielgruppe / Search Intent | Index | Canonical | Render | Calc-Logik | Daten verifiziert? | Tracking | CTA-Pfad | Q | Aktion |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/tools/money-leak-scanner` | `tools/money-leak-scanner/page.tsx` | live, 2× | Haushalte: „where does my money go" | ja | self + korrektes 4er-hreflang | SSR | `lib/money-leak/*` (einziges Tool mit Lib + Unit-Test) | keine Datumsangaben | kaputt (`/api/track-cta` ohne Pflichtfelder → 400) | matched `/go/*` | 4 | **behalten — Pilot LiveCanvas (2.2)** |
| 2 | `/tools/broker-finder` | `tools/broker-finder/page.tsx` | live, 2× | Trading-Einsteiger: „which broker suits me" | ja | **fehlt** | CL | inline | n/a | quiz_* via `/api/track` (funktioniert) | `/go/etoro,capital-com,ibkr,investing,revolut` | 3.5 | überarbeiten — Journey-Schritt 1 (Phase 3) |
| 3 | `/tools/trading-cost-calculator` | `tools/trading-cost-calculator/page.tsx` | live, 2× | Aktive Trader: Kostenvergleich | ja | **fehlt** | CL | inline | Gebührendaten undatiert | keins | `/go/{cheapest}` | 3 | überarbeiten — Journey-Schritt „persönliche Kosten" |
| 4 | `/tools/broker-comparison` | `tools/broker-comparison/page.tsx` | live, 2× | Trader: Direktvergleich | ja | **fehlt** | CL | inline | Gebührendaten undatiert | keins | `/go/avatrade,vantage,ic-markets,etoro` | 3 | überarbeiten — Journey-Schritt „Vergleich" |
| 5 | `/tools/ai-roi-calculator` | `tools/ai-roi-calculator/page.tsx` | live, 2× | SMB/Business: AI-Tool-Payback | ja | **fehlt** | CL | inline (Toolpreise hardcoded) | Preise undatiert | keins | `/go/jasper-ai,copy-ai,writesonic,chatgpt,claude-pro` | 2.5 | überarbeiten — Business-Repositionierung (5.3) |
| 6 | `/tools/loan-calculator` | `tools/loan-calculator/page.tsx` | live, 2× | Kreditsuchende (generisch) | ja | **fehlt** | CL | inline (Amortisation) | APR-Ranges im Servertext undatiert | keins | `/go/lending-tree` | 2.5 | überarbeiten — Entscheidungskontext schärfen (5.3) |
| 7 | `/tools/debt-payoff-calculator` | `tools/debt-payoff-calculator/page.tsx` | fertig gebaut, als „Coming Soon" versteckt | Verschuldete: Payoff-Plan | **noindex** | self | SSR | inline | ok (generisch) | keins | `/go/national-debt-relief` | 3 | **überarbeiten — Pilot PrecisionWorksheet (2.3), dann Indexability Gate** |
| 8 | `/tools/credit-score-simulator` | `tools/credit-score-simulator/page.tsx` | fertig gebaut, versteckt | Score-Optimierer | **noindex** | self | SSR | inline (FICO-Gewichte, Punkt-Prognosen) | Modell-Annahmen undatiert | keins | `/go/the-credit-people` | 2.5 | **umbauen → „Credit Utilization & Score Impact Explorer", Bänder statt Punktwerte, neuer Slug + 308 (5.3), dann Gate** |
| 9 | `/tools/gold-roi-calculator` | `tools/gold-roi-calculator/page.tsx` | live, AU-gebrandet am US-Pfad | AU-Anleger: Gold-Rendite | ja | **→ nicht existentes `/au/tools/gold-roi-calculator` (404)** | SSR | inline + Server-Prosa | Annahmen undatiert | keins | `/go/perth-mint` | 2.5 | **behalten (Nische) — atomarer Umzug nach `/au/tools/` (PR 0.3)** |
| 10 | `/tools/credit-card-rewards-calculator` | `tools/credit-card-rewards-calculator/page.tsx` | live, 2× | Kartensucher: Rewards-Maximierung | ja | **fehlt** | CL | inline | Kartendaten undatiert | keins | `/go/{winner}` | 3 | überarbeiten — Shell-Migration (Phase 5) |
| 11 | `/uk/tools/money-leak-scanner` | `uk/tools/money-leak-scanner/page.tsx` | live, 2× | UK-Haushalte | ja | self + korrektes hreflang | SSR | `lib/money-leak/*` | keine Datumsangaben | kaputt (wie #1) | matched `/go/*` | 4 | behalten — Pilot |
| 12 | `/uk/tools/isa-tax-savings-calculator` | `uk/tools/isa-tax-savings-calculator/page.tsx` | live, 2× | UK-Sparer: ISA-Steuervorteil | ja | self | CL | inline | **STALE: Label „2025/26"; Page-Copy CGT „10%" vs. Komponente 18 % (Komponente korrekt)** | keins | keiner (nur Reviews) | 2.5 | überarbeiten — Daten-Fix (0.4), Shell (Phase 5), Deep-Link Wealth Horizon |
| 13 | `/uk/tools/remortgage-calculator` | `uk/tools/remortgage-calculator/page.tsx` | fertig gebaut, versteckt | UK: Remortgage-Ersparnis | **noindex** | self + **falscher hreflang-Cluster** | SSR | inline | Zinsen ohne Quelle/Datum | keins | `/go/habito` | 3 | **überarbeiten — Home Lab (5.2), dann Gate** |
| 14 | `/ca/tools/money-leak-scanner` | `ca/tools/money-leak-scanner/page.tsx` | live, 2× | CA-Haushalte | ja | self + korrektes hreflang | SSR | `lib/money-leak/*` | keine Datumsangaben | kaputt (wie #1) | matched `/go/*` | 4 | behalten — Pilot |
| 15 | `/ca/tools/tfsa-rrsp-calculator` | `ca/tools/tfsa-rrsp-calculator/page.tsx` | live | CA: TFSA-vs-RRSP-Wahl | ja | self + **falscher hreflang-Cluster** | SSR | inline | **STALE: RRSP $31.560 (2024), TFSA lifetime $95.000; korrekt 2026: $33.810 / $109.000** | keins | `/go/wealthsimple` | 2 | überarbeiten — Daten-Fix (0.4), Shell (Phase 5), Deep-Link Wealth Horizon |
| 16 | `/ca/tools/wealthsimple-calculator` | `ca/tools/wealthsimple-calculator/page.tsx` | live, 2× | CA: Gebührenvergleich Wealthsimple | ja | self | CL | inline | Gebührensätze undatiert | keins | `/go/wealthsimple` | 3 | behalten — Naming vereinheitlichen („Wealthsimple Fee Savings Calculator"), Shell (Phase 5) |
| 17 | `/ca/tools/ca-mortgage-affordability-calculator` | `ca/tools/ca-mortgage-affordability-calculator/page.tsx` | live, 2× | CA: Affordability/Stress-Test | ja | self | CL | inline (CMHC-Tiers, GDS/TDS) | CMHC-Sätze undatiert | keins | keiner | 3 | überarbeiten — Home Lab (5.2) |
| 18 | `/au/tools/money-leak-scanner` | `au/tools/money-leak-scanner/page.tsx` | live, 2× | AU-Haushalte | ja | self + korrektes hreflang | SSR | `lib/money-leak/*` | keine Datumsangaben | kaputt (wie #1) | matched `/go/*` | 4 | behalten — Pilot |
| 19 | `/au/tools/superannuation-calculator` | `au/tools/superannuation-calculator/page.tsx` | live | AU: Super-Projektion | ja | self + **falscher hreflang-Cluster** | SSR | inline | **STALE: SG 11,5 %, Cap „A$27.500 (2024-25)"; korrekt: SG 12 % (seit 1.7.2025), Cap A$32.500 (FY2026-27); Page/Komponente widersprechen sich** | keins | `/go/australiansuper` | 2 | überarbeiten — Daten-Fix (0.4), supporting, Deep-Link Wealth Horizon |
| 20 | `/au/tools/au-mortgage-calculator` | `au/tools/au-mortgage-calculator/page.tsx` | live, 2× | AU: Repayments/LVR/Offset | ja | self + **falscher hreflang-Cluster** (nur en-AU) | CL | inline | Default-Zins 6,09 % ohne Quelle/Datum | keins | keiner | 3 | überarbeiten — Home Lab (5.2) |

**Hubs:** `/tools` (14 statische Karten, davon 3 „Coming Soon"-Badges für fertige Tools, gold-roi fehlt, kein Canonical, 2×-Suffix), `/uk|ca|au/tools` (eigene Arrays, 2×-Suffix, **nicht in Sitemap, nicht in Nav** — nur über Money-Leak-„related tools" erreichbar). Statische `badge:'Popular'`-Strings ohne Analytics-Basis in allen 4 Hubs. → Aktion: **Decision Launcher (2.4)**, Registry-Konsument (0.6).

### 1.4 Querschnittsdefekte

1. **Doppel-Brand-Suffix** auf ~18 Tool-/Hub-Seiten (Root-Template `%s | SmartFinPro` in `app/layout.tsx` + hardcodierter Suffix).
2. **7 US-Routen + US-Hub ohne Canonical**; **4 kopierte falsche hreflang-Cluster** (uk/remortgage, au/superannuation, ca/tfsa-rrsp, au/au-mortgage) mit teils nicht existenten Zielen; gold-roi-Canonical/og:url auf 404-Route (Sitemap listet gleichzeitig den realen Pfad).
3. **0 JSON-LD auf allen Tool-Seiten** (kein WebApplication/FAQPage/BreadcrumbList; sichtbare FAQs ohne Schema; `AnswerBlock`-Kommentar „Linked to FAQPage Schema" ist falsch). Kein WebApplication-Generator in `lib/seo/schema.ts`.
4. **3 fertige Tools auf noindex** („Coming Soon"), aber im Footer aller Märkte verlinkt.
5. **`llms.txt` enthält null Tools**; Markt-Hubs fehlen in Sitemap.
6. **15/17 Konzepte ohne Analytics**; Money-Leak-Events laufen gegen eine 400-Wand; Session-Key dreifach fragmentiert (`sfp_session_id`/`sfp_sid`/`sfp_session`).
7. **Naming-Drift**: „Fee Savings Calculator" vs. „Wealthsimple Fee Calculator" (4 Oberflächen); Broker-Quiz „4 questions" (Page) vs. „5 questions" (Hub).
8. Calc-Logik inline in `'use client'` (16/17); nur `lib/money-leak/` extrahiert + getestet; 11 Widgets ohne SSR-HTML.
9. CI baut nicht (`next build` fehlt); `check-client-server-imports.sh` und `check-hydration-safety.sh` klammern `components/tools/` aus.

### 1.5 Verifizierte Marktdaten (Primärquellen, Stand 12.07.2026)

| Markt | Wert | Korrekt (heute) | Quelle |
|---|---|---|---|
| US | 401(k)-Limit 2026 | **$24.500** Arbeitnehmer-Deferral; Catch-up 50+ **$8.000**, Alter 60–63 **$11.250**; Gesamtbeitrag inkl. Arbeitgeber **$72.000**; Roth-Catch-up-Wage-Threshold **$150.000** | IRS Notice 2025-67 |
| US | IRA-Limit 2026 | **$7.500** (Catch-up: $1.100) | ebd. |
| CA | TFSA-Limit 2026 | **$7.000/Jahr**, kumulativ **$109.000** | canada.ca …/mp-rrsp-dpsp-tfsa-limits-ympe.html |
| CA | RRSP-Limit 2026 | **$33.810** | ebd. |
| UK | ISA-Allowance 2026/27 | **£20.000** (unverändert); **Cash-ISA £12.000 ab 6.4.2027** (unter 65) | gov.uk/individual-savings-accounts + gov.uk „ISA reform 2027" Factsheet (Autumn Budget 2025) |
| UK | CGT-Sätze | **18 % / 24 %** (seit 30.10.2024); Freibetrag £3.000; Dividenden-Freibetrag £500 | gov.uk/capital-gains-tax/rates |
| AU | Super Guarantee | **12 %** (seit 1.7.2025, letzter Schritt) | ato.gov.au Key superannuation rates and thresholds |
| AU | Concessional Cap FY2026-27 | **A$32.500** (seit 1.7.2026); non-concessional A$130.000; Max Contribution Base A$270.830 | ato.gov.au …/contributions-caps |

Diese Werte wandern als `RuleEntry`-Einträge nach `lib/rules/` (Kapitel 8).

---

## 2. Vergleich der drei Lösungsansätze

| Kriterium | **A: Unified Financial Decision Lab** | B: Separate Tool-Microsites | C: Personal Finance Decision OS (sofort) |
|---|---|---|---|
| Nutzen/CRO | Hoch: durchgehende Journeys, ein Result Contract, ein Qualified-Decision-Signal | Mittel: isolierte Conversion je Tool, keine Journey | Theoretisch am höchsten, aber unbelegt — es existiert keine Nutzungs-Baseline |
| SEO-Potenzial | Bündelt Domain-Autorität; ein Quality-Bar (Cockpit-Muster existiert und rankt); interne Verlinkung Tool↔Cockpit↔Review | Fragmentiert Autorität; dupliziert Search Intent; Backlink-Aufbau ×n | Wie A — Personalisierung selbst ist nicht indexierbar |
| Entwicklungsaufwand | Mittel; inkrementell pro Tool; Registry+Shell einmalig | Hoch: n× Infrastruktur, n× Design, n× Deploy | Hoch: Persistenz-, Versions-, Privacy-Layer vor jedem sichtbaren Nutzen |
| Wartbarkeit (Solo-Betrieb, 23 Crons) | Eine Registry, eine Shell, ein Eventvertrag | n Silos; widerspricht dem bestehenden Monorepo-Betrieb | Zusätzliche dauerhafte State-Pflege |
| Vertrauen/YMYL | Ein Methodik-/Quellen-/Freshness-Standard | Inkonsistent zwischen Sites | Profil-Speicherung erhöht Sensibilität und Erklärlast |
| Skalierbarkeit | Registry + Modi decken neue Tools ab | Jede Site skaliert einzeln | Auf A aufsetzbar (Passport = Opt-in-Upgrade) |
| Risiko | Klein-PRs, jederzeit revertbar | Strategisch falsch für eine Affiliate-Domain | Baut Komplexität auf ungetesteter Nutzung |

## 3. Empfehlung

**A jetzt — C als Sequenzziel — B verworfen.**

Die Sequenz A→C ist die einzige, in der C auf gemessener Nutzung statt Annahmen aufsetzt: Phase 3 (Broker Journey) erzwingt ohnehin einen typisierten, versionierten, lokalen Decision-State (`DecisionStateV1`, Kapitel 8.6). Genau dieser Store ist der Passport-Keim; C wird ein **Opt-in-Upgrade** (sessionStorage → localStorage) statt Neubau, freigegeben erst, wenn `tool_qualified_decision`-Daten den Bedarf belegen (Phase 6). B scheitert an Domain-Autorität, Wartungskosten im Solo-Betrieb und am vorhandenen, funktionierenden Design-System.

Die Begründung stützt sich auf strukturelle Defizite (keine Journeys, kein Result Contract, kein Entscheidungs-Signal, 15/17 Tools blind) — **nicht** auf die 0-Conversion-Zahl, deren Messung unvollständig validiert ist (1.1).

---

## 4. Informationsarchitektur

### 4.1 Ebenen

```
Financial Decision Lab
├── Hub (Decision Launcher)            /tools · /uk/tools · /ca/tools · /au/tools
│   ├── Marktverfügbare Major Decisions (erster Viewport, mit „Example"-Miniaturen)
│   │   ├── "Find where my money is going"        → Money Leak Scanner        (LiveCanvas)
│   │   ├── "Plan my financial future"            → Wealth Horizon            (GuidedJourney)
│   │   ├── "Choose the right broker"             → Broker Decision Journey   (GuidedJourney; alle Märkte)
│   │   └── "Understand what home I can afford"   → Home Decision Lab         (UK/CA/AU)
│   └── Supporting Tools, gruppiert nach decisionCategory (unterhalb des ersten Viewports)
├── Tool-Seiten (20 bestehende + 4 Wealth-Horizon-Routen)
├── Cockpit-Brücken (NextBestAction, genau EINE pro Ergebnis)
└── Reviews/Pillars (bestehende MDX-Inhalte, verlinkt aus Below-Fold-Sektionen)
```

### 4.2 decisionCategory-Taxonomie (Registry-Feld, gruppiert Supporting Tools im Hub)

| decisionCategory | Hub-Gruppe (EN) | Tools |
|---|---|---|
| `spend` | Everyday money | Money Leak Scanner |
| `retire` | Retirement & investing | Wealth Horizon, Superannuation, TFSA/RRSP, ISA |
| `broker` | Trading & brokers | Broker Finder, Trading Cost, Broker Comparison |
| `home` | Home & mortgages | AU Mortgage, CA Affordability, UK Remortgage |
| `debt` | Debt & credit | Debt Payoff, Credit Utilization Explorer, Loan |
| `credit-cards` | Cards & rewards | Credit Card Rewards |
| `fees` | Fees & costs | Wealthsimple Fee Savings |
| `niche` | Specialist | Gold ROI (AU) |
| `business` | Business | AI ROI |

Jede Supporting-Gruppe erscheint nur in Märkten, die mindestens ein Tool darin haben. Die Registry trennt deshalb **SEO-Varianten** (`variants[]`: eigene indexierbare Route) von **funktionaler Marktverfügbarkeit** (`availableMarkets[]`: ein globaler Pfad darf mehrere Märkte bedienen).

**Major-Decision-Verfügbarkeit (bindend):**

| Hub | Sichtbare Major Decisions | Routing-Vertrag |
|---|---|---|
| `/tools` (US/x-default) | Money Leak · Wealth Horizon · Broker Journey | Kein Home-Panel, solange kein US-Home-Tool existiert; keine tote oder fachfremde Ersatzroute |
| `/uk/tools` | Money Leak · Wealth Horizon · Broker Journey · Home Lab | Broker → `/tools/broker-finder?market=uk`; Home → UK Remortgage |
| `/ca/tools` | Money Leak · Wealth Horizon · Broker Journey · Home Lab | Broker → `/tools/broker-finder?market=ca`; Home → CA Affordability |
| `/au/tools` | Money Leak · Wealth Horizon · Broker Journey · Home Lab | Broker → `/tools/broker-finder?market=au`; Home → AU Mortgage |

Die drei globalen Broker-Routen bleiben aus SEO-Sicht self-canonical und erhalten **keine** künstlichen lokalisierten Duplikate. Der nicht-sensitive `market`-Queryparameter steuert nur Produktauswahl, Regulierungstexte, Kostenannahmen und die spätere Cockpit-Brücke; `getToolEntryHref(tool, market)` erzeugt ihn, `DecisionStateV1.broker.market` persistiert ihn. Fehlt oder ist er ungültig, gilt `us`. Alle Broker-Ergebnisse müssen Anbieter anhand `availableMarkets` filtern; ein Anbieter ohne nachgewiesene Marktverfügbarkeit darf nicht empfohlen werden. Canonical und Open Graph URL bleiben parameterlos.

### 4.3 Markt-Hubs und Navigation

- `/uk|ca|au/tools` kommen in **Sitemap** (0.6) und werden zum Nav-Ziel: Header-„Tools"-Menü und „Get Started"-CTA verlinken **markt-lokal** (`getHubPathForMarket(market)`), nicht mehr pauschal `/tools`.
- Footer-„Tools"-Spalte wird Registry-Konsument (`getFooterToolLinks(market)`); noindex-Tools erscheinen dort erst nach bestandenem Indexability Gate.
- Hub-Cluster: die 4 Hubs bilden einen hreflang-Cluster (en-US/en-GB/en-CA/en-AU + x-default→US).

### 4.4 Interne Verlinkung (Mindeststandard je Tool-Seite)

1. Breadcrumb: Home → Tools (markt-lokal) → Tool.
2. Genau **eine** NextBestAction-Brücke (4.5).
3. „Related tools": 2–3 Registry-Nachbarn derselben decisionCategory bzw. desselben Markts.
4. Below-Fold: 2+ redaktionelle Links (Review/Pillar) passend zum Intent.
5. Supporting-↔-Major-Deep-Links (z. B. Superannuation ↔ Wealth Horizon AU) via Fragment-Codec (Kapitel 8.7).

### 4.5 Cockpit-Brücken (verifiziert gegen `BEST_X_MANIFEST`, 38 Live-Routen)

Registry-Feld `bridge: Partial<Record<Market, {href, label}>>`; Build-Test validiert jeden `href` gegen das Manifest (kein Link auf `coming_soon`).

| Tool | US | UK | CA | AU |
|---|---|---|---|---|
| Money Leak | `/us/personal-finance/best/high-yield-savings` | `/uk/cost-of-living/best/money-saving-tools` | `/ca/tax-efficient-investing/best/tfsa-rrsp-platforms` | `/au/savings/best/savings-accounts` |
| Wealth Horizon | `/us/personal-finance/best/robo-advisors` | `/uk/personal-finance/best/investing-apps` | `/ca/tax-efficient-investing/best/tfsa-rrsp-platforms` | `/au/superannuation/best/super-funds` |
| Broker Journey (Abschluss) | `/us/trading/best/trading-platforms` | `/uk/trading/best/cfd-brokers` | `/ca/forex/best/forex-brokers` | `/au/trading/best/cfd-brokers` |
| Home Lab | — (bewusst kein US-Panel bis zu einem eigenen Tool) | `/uk/remortgaging/best/remortgage-brokers` | `/ca/housing/best/mortgage-brokers` | `/au/savings/best/savings-accounts` (Offset/Deposit; AU-Mortgage-Cockpit existiert nicht) |
| Debt Payoff | `/us/debt-relief/best/companies` | — | — | — |
| Credit Utilization | `/us/personal-finance/best/credit-monitoring` | — | — | — |
| Credit Card Rewards | `/us/personal-finance/best/credit-card-companies` | — | — | — |
| Gold ROI | — | — | — | `/au/gold-investing/best/platforms` |
| AI ROI | `/us/ai-tools/best/ai-tools-finance` | — | — | — |
| ISA | — | `/uk/personal-finance/best/investing-apps` | — | — |
| TFSA/RRSP | — | — | `/ca/tax-efficient-investing/best/tfsa-rrsp-platforms` | — |
| Superannuation | — | — | — | `/au/superannuation/best/super-funds` |
| Wealthsimple Fee Savings | — | — | `/ca/personal-finance/best/robo-advisors` | — |
| Trading Cost / Broker Comparison | wie Broker Journey | wie Broker Journey | wie Broker Journey | wie Broker Journey |
| Loan | `/us/debt-relief/best/companies` (Konsolidierungs-Intent) | — | — | — |

Die Brücke ist one-way: **kein Cockpit-Code liest den Decision-Store** (cockpit_v1-Freeze). Am Übergang feuert `tool_cockpit_cta_click`.

---

## 5. User Journeys der vier Major Tools

Notation je Schritt: **State** = ResultPanel-State-Machine (initial/ready/calculating/result/insufficient-data/stale-data/error) × Ergebniszustand (example/yours/shared); **Events** = tool_v1 (Kapitel 10).

### 5.1 Money Leak Scanner (LiveCanvas, Pilot)

Einstieg: SEO („money leak", „where does my money go"), Hub-Decision „Find where my money is going", Homepage.

| # | Schritt | UI | State | Events |
|---|---|---|---|---|
| 0 | Landung | H1 + 1-Satz-Nutzen + TrustStrip; links Inputs (Einkommen, Haushaltsgröße, Ausgaben-Slider mit `CurrencyField`), rechts Worked Example mit Chip **„Example result"** | `result` × `example` | `tool_view` |
| 1 | Erste Eingabe | Nutzer ändert Einkommen (Zahlenfeld oder Slider) | `calculating` → `result` × `yours` | `tool_start`, `tool_input_change` (debounced) |
| 2 | Erstes Ergebnis | Antwortsatz („You may be leaking ~$X–$Y/month") + Kategorie-Leisten (Signatur-Visual) + Gesamtverlust | `result` × `yours` | `tool_first_result` |
| 3 | Vertiefung | 3 Impact-Levers (priorisierte Fixes), Kategorien auf-/zuklappen | ebd. | `tool_input_change` (`controlRole:'lever'`) → ggf. `tool_qualified_decision` |
| 4 | Optionaler Bericht | E-Mail-Unlock **erst nach sichtbarem Ergebnis** (bestehender `/api/tools/money-leak/unlock`-Flow bleibt) | ebd. | `tool_report_email` |
| 5 | Nächste Aktion | Genau eine Brücke (4.5), markt-spezifisch | ebd. | immer `tool_next_action_click`; bei Cockpit-Ziel zusätzlich `tool_cockpit_cta_click` |
| Alt | Zu wenig Angaben | < Mindestinputs → erklärender Zustand statt leerer Zahlen | `insufficient-data` | — |
| Alt | Share-Link geöffnet | `#s=`-Payload dekodiert, Chip **„Shared scenario"** | `result` × `shared` | `tool_view` |

### 5.2 Wealth Horizon (GuidedJourney, neu — Phase 4)

Einstieg: SEO („retirement calculator", „pension calculator uk", …), Hub „Plan my financial future", Deep-Links aus Super/TFSA-RRSP/ISA.

| # | Schritt | UI | State | Events |
|---|---|---|---|---|
| 0 | Landung | H1 + Nutzen + TrustStrip; Schritt 1/3 sichtbar; rechts Worked Example (Szenariokorridor) mit „Example result" | `initial`→`ready`; Ergebnis `example` | `tool_view` |
| 1 | Schritt 1 „About you" | Alter, geplantes Rentenalter (`IntegerField`/`DurationField`), Markt-Kontotypen werden erklärt (US: 401(k)/IRA/Roth · UK: ISA/SIPP · CA: TFSA/RRSP · AU: Super) | `ready` | `tool_start`, `tool_input_change` |
| 2 | Schritt 2 „Savings & contributions" | Default **Simple mode**: Gesamtbestand, eigener Monatsbeitrag, optionaler Arbeitgeberbeitrag als Monatsbetrag, Gebühren-%; keine automatische Cap-Anwendung. Optional **Account breakdown**: je Konto Typ, Bestand, eigener/Arbeitgeberbeitrag, YTD-Beitrag und persönlich verfügbarer Beitragsraum. AU-Helfer kann aus anrechenbarem Jahresgehalt × SG 12 % einen editierbaren Arbeitgeber-Monatsbetrag berechnen. Zwischenergebnis „on track towards ~…" | `ready` mit Zwischenergebnis | `tool_input_change` |
| 3 | Schritt 3 „Target income" | Ziel-Monatseinkommen heute (`CurrencyField`), optional erwartete staatliche/betriebliche Leistung als **vom Nutzer eingegebener** Monatsbetrag in heutiger Kaufkraft + Startalter (Default aus/0; Links zu offiziellen Estimatoren), Entnahmerate 2,5–5,0 % (Default 4,0 %) | `calculating` → `result` × `yours` | `tool_first_result` |
| 4 | Ergebnis-Canvas | Fixe Reihenfolge: (1) Antwortsatz inkl. FI-Jahr, (2) Vermögensbandbreite bei Rentenalter („in today's money"), (3) Szenariokorridor + FI-Datum + Meilensteine, (4) 3 Levers (Fees −0,5 pp / +$X mtl. / +2 Jahre), (5) Annahmen+Quellen (AssumptionsDrawer), (6) eine Brücke | `result` × `yours` | `tool_scenario_compare` (Szenario-Toggle), Lever-Events → `tool_qualified_decision` |
| 5 | Teilen/Bericht | Share mit Allowlist-Vorschau; optionaler Report nach Ergebnis | ebd. | `tool_result_share`, `tool_report_*` |
| Alt | Beitragsgrenze | Simple mode → nur informativer Hinweis, nie Clamp. Account breakdown → Clamp nur bei eindeutigem, konto-spezifischem Limit und bekanntem YTD/`availableRoom`; personalisierte Räume (TFSA/RRSP, AU Carry-forward) werden nie aus nationalen Maxima erfunden. Jeder Clamp ist sichtbar, begründet und editierbar | `result` + Warnhinweis | `tool_input_change` |
| Alt | Regel-Fenster abgelaufen (SLA) | TrustStrip zeigt Stale-Zustand, Ergebnis bleibt nutzbar mit Hinweis | `stale-data` | kein Error-Event; nur UI-Zustand |

### 5.3 Broker Decision Journey (GuidedJourney über bestehende Routen — Phase 3)

Quiz → Shortlist → persönliche Kosten → Vergleich → Review/Anbieter. Bestehende SEO-Routen bleiben; der Zustand wandert via `DecisionStateV1.broker` mit. Einstieg aus einem Markt-Hub setzt `?market=uk|ca|au` (US ist Default), validiert den Wert gegen `availableMarkets` und schreibt ihn als erste Aktion in den Store. Jede Stufe filtert Anbieter, Gebühren, Regulierungs- und Risikotexte nach diesem Markt.

| # | Schritt | Route | Verhalten | Events |
|---|---|---|---|---|
| 1 | Quiz | `/tools/broker-finder?market={market}` | Bestehende 5 Fragen; bei Abschluss schreibt der Quiz `broker.market`, `broker.quizAnswers` + abgeleitetes `profile` (experience, instruments, tradesPerMonth, avgTradeSize, priorities) in den Store; die Shortlist enthält nur im Markt verfügbare Anbieter | bestehende quiz_* bleiben; zusätzlich `tool_view`/`tool_start`/`tool_first_result` (Shortlist = erstes Ergebnis) |
| 2 | Shortlist | Quiz-Ergebnis | Match-Karten (Signatur-Visual: Match-Begründung + geschätzte Jahreskosten), Shortlist-Auswahl → `broker.shortlistSlugs` | `tool_qualified_decision` bei Shortlist-Interaktion |
| 3 | Persönliche Kosten | `/tools/trading-cost-calculator` | **Prefill** aus `profile` (tradesPerMonth, avgTradeSize) → startet in `ready` statt `initial`; Nutzer verfeinert | `tool_view`, `tool_first_result` sofort möglich |
| 4 | Vergleich | `/tools/broker-comparison` | Shortlist prä-selektiert; Jahreskosten aus Schritt 3 eingeblendet | `tool_scenario_compare` |
| 5 | Abschluss | Brücke → Trading-Cockpit des Markts (4.5) oder Review/`/go/*` | genau eine NextBestAction | immer `tool_next_action_click`; bei Cockpit-Ziel zusätzlich `tool_cockpit_cta_click` |

Kein Nutzer gibt dieselben Angaben zweimal ein: jeder Schritt liest den Namespace, zeigt eine „Using your quiz answers — edit"-Zeile (Transparenz + Korrigierbarkeit).

### 5.4 Home Decision Lab (PrecisionWorksheet — Phase 5)

Drei Markt-Tools unter einer UX (Routen bleiben): AU Repayments/LVR/Offset · CA Affordability (GDS/TDS/Stress-Test) · UK Remortgage.

| # | Schritt | UI | State | Events |
|---|---|---|---|---|
| 0 | Landung | Worksheet-Layout: Abschnitts-Formular (Property & Loan / Income & Debts / Rates & Fees) links, Annahmen-Spalte + Detail-Resultat rechts; Worked Example „Example result" | `result` × `example` | `tool_view` |
| 1 | Abschnitt 1–3 ausfüllen | `CurrencyField`/`PercentageField`/`DurationField`; Zinssatz-Feld mit Quelle+Datum aus Rules („RBA cash rate context, verified {date}") — nie erfundene Live-Zinsen | `ready` → `calculating` | `tool_start`, `tool_input_change` |
| 2 | Ergebnis | (1) Antwortsatz („You can likely afford ~$X–$Y"), (2) Affordability Range, (3) **Payment Stack** (Principal/Interest/Fees/Insurance) + **Risikopuffer** (Stress-Szenario +2 pp bzw. Markt-Regel), (4) 3 Levers, (5) Annahmen/Quellen, (6) eine Brücke | `result` × `yours` | `tool_first_result`, `tool_scenario_compare` (Stress-Toggle) |
| 3 | Grenzfälle | GDS/TDS überschritten (CA) oder LVR>95 (AU) → Warning-Token-Block mit Erklärung statt roher Zahlen | `result` + Warnung bzw. `insufficient-data` | `tool_input_change` |
| 4 | Abschluss | Brücke: CA→mortgage-brokers-Cockpit, UK→remortgage-brokers-Cockpit, AU→savings-accounts (Offset/Deposit) | ebd. | `tool_next_action_click` + `tool_cockpit_cta_click` |

---

## 6. Responsive Wireframe-Spezifikation

Verbindliche Breakpoints: **1440 / 1280 / 1024 / 390 / 360 px**. High-Fi-Referenzscreens werden bei 1280 und 390 px erstellt; übrige Viewports laufen über die Responsive-QA-Checkliste (6.6). Lo-Fi-Wireframes + interaktive Prototypen (Broker Journey, Wealth Horizon) + State Board folgen als eigene Artefakte unter `docs/superpowers/specs/assets/2026-07-12-fdl/`.

### 6.1 Gemeinsame Tool-Anatomie (alle Modi)

**Oberhalb des Workspace (RSC, in dieser Reihenfolge):**

| Region | Inhalt | Höhe Desktop | Höhe Mobile |
|---|---|---|---|
| Breadcrumb | Home → Tools (markt-lokal) → Tool | ~24 px | ~24 px |
| H1-Block | H1 (40/48 bzw. 30/38) + genau 1 Satz Nutzenversprechen (16/24, `--sfp-slate`) | ≤ 96 px | ≤ 108 px |
| ToolTrustStrip | Markt-Flag/Label · „~N min" Bearbeitungszeit · „Data verified {minVerifiedAt}" · Sekundärlinks „Methodology" + „Privacy" (Anker in Below-Fold) | ~32 px | ~40 px (umbrechend) |

**Workspace:** max-width **1180–1240 px**, zentriert; 12-Spalten-Grid, Gutter **24 px** (1024) bis **32 px** (≥1280). Panels: Radius 8 px, 1 px `--tool-border`, Hintergrund `--tool-surface`; Seiten-Hintergrund `--tool-surface-muted`. **Keine verschachtelten Cards** — innerhalb eines Panels nur Gruppierung per Abstand/Divider. Keine Gradients, keine Hover-Translationen, Schatten max `0 1px 2px rgb(16 24 40 / 0.05)`.

**Below-Fold (RSC, alle Modi identisch):** Methodology (H2) → Worked example (inkl. statischem SVG-Chart) → FAQ (sichtbar, speist FAQPage-Schema) → Sources & data (jede Quelle mit Effective + Verified Date) → Related tools → redaktionelle Links. Ohne JavaScript sind H1, Intro, initialer Tool-Zustand (Formular-Markup mit `defaultValue`s), Worked Example, Methodik, FAQ, Quellen und Verified-Datum vollständig sichtbar.

**Ergebnisreihenfolge (fix, alle Modi):** (1) Antwortsatz → (2) primäre Zahl + Bandbreite → (3) Szenario-Visual → (4) exakt 3 Levers → (5) Annahmen + Quellen → (6) genau eine NextBestAction.

### 6.2 Die drei Shell-Modi

**LiveCanvas** (Money Leak, Sparrechner, Rewards, Gold ROI, AI ROI, Credit Utilization):

| Viewport | Layout |
|---|---|
| ≥1280 | Inputs links `col-span-4` (1440: 4, 1280: 5), Ergebnis rechts `col-span-8/7`; Ergebnis-Panel sticky (top: Header+16 px) NUR wenn Input-Spalte länger als Viewport; sonst statisch |
| 1024 | Inputs 5 / Ergebnis 7, Gutter 24 px, kein sticky |
| 390/360 | Einspaltig: H1+TrustStrip → erster Input-Abschnitt (im ersten Viewport sichtbar) → weitere Abschnitte → Ergebnis; nach belastbarem Resultat erscheint `ResultMiniBar` (unten fixiert, 56 px, zeigt Antwortsatz-Kurzform + „View result"), verdeckt nie Eingaben (Content bekommt padding-bottom 72 px); Tap öffnet Result View (Scroll-Anker, kein Modal) |

**GuidedJourney** (Wealth Horizon, Broker Journey, Loan):

| Viewport | Layout |
|---|---|
| ≥1280 | Schritt-Panel links `col-span-5` (Fortschritt „Step 1 of 3" + Fragenblock + Zurück/Weiter), Zwischenergebnis/Preview rechts `col-span-7` (Worked Example bzw. „on track towards ~…"-Badge); nach Abschluss ersetzt der Ergebnis-Canvas beide Spalten (volle 12, interne 5/7-Teilung Inputs-Zusammenfassung/Ergebnis) |
| 1024 | 5/7 wie oben, Gutter 24 px |
| 390/360 | Sequenziell: Fortschrittsleiste (4 px, Navy) oben; ein Fragenblock pro Screen-Abschnitt; Zwischenergebnis als kompakte Zeile unter dem Weiter-Button; Ergebnis als eigener Result View |

**PrecisionWorksheet** (Debt Payoff, AU/CA/UK Home Lab, Trading Cost):

| Viewport | Layout |
|---|---|
| ≥1280 | Abschnitts-Formular links `col-span-5` (Sektionen mit H3: z. B. „Property & loan" / „Income & debts" / „Rates & fees"; jede Sektion ein Panel-Segment mit Divider), rechts `col-span-7` zweigeteilt: oben Annahmen-Leiste (kompakt, verlinkt AssumptionsDrawer), darunter Detail-Resultat (Payment Stack/Tabellen) |
| 1024 | 5/7, Annahmen-Leiste einzeilig scrollbar |
| 390/360 | Sektionen als Accordion (erste offen); Ergebnis + Annahmen unterhalb; ResultMiniBar wie LiveCanvas |

### 6.3 Hub „Decision Launcher"

| Viewport | Erster Viewport (kritisch: bei 1280×720 alle marktverfügbaren Decisions erkennbar) |
|---|---|
| ≥1280 | H1-Bereich **≤220 px** gesamt: markt-lokale Kategorie-H1 (US: „Financial Decision Tools & Calculators", UK/CA/AU entsprechend lokalisiert, 40/48) + sichtbare Launcher-Frage „What financial decision are you making today?" (22/28) + Marktumschalter (SegmentedControl US/UK/CA/AU, 44 px). Darunter alle **marktverfügbaren** Decision-Panels: US 3 Spalten, UK/CA/AU 4 Spalten bei 1440 bzw. 2×2 bei 1280. Je Panel = Decision-Frage + Tool-Name + **Ergebnis-Miniatur** (echtes Mini-SVG aus `chart-geometry` mit Worked-Example-Daten, ~120×64 px, Chip „Example") + „Start →". Kein Hero, kein Gradient, kein Punktmuster. |
| 1024 | US 3 Panels in einem stabilen Raster; UK/CA/AU 2×2; H1-Bereich ≤200 px |
| 390/360 | Kategorie-H1 (30/38) + Launcher-Frage + Marktumschalter (volle Breite) + marktverfügbare Decision-Panels gestapelt (je ~132 px, Miniatur rechts 96×52 px); Panel 1 vollständig im ersten Viewport |

**Unterhalb:** Supporting-Tools gruppiert nach decisionCategory (4.2): Gruppen-H2 (22/28) + kompakte Listen-Cards (Icon + Name + 1-Zeilen-Blurb + Markt-Badge falls markt-spezifisch). Reihenfolge der Gruppen: Retirement & investing → Debt & credit → Trading & brokers → Home & mortgages → Cards & rewards → Fees & costs → Business → Specialist. **Keine „Popular"/„Most clicked"-Badges**, bis tool_v1 eine Mindeststichprobe liefert (Schwelle: ≥500 `tool_view` im 28-Tage-Fenster, dann datengetrieben via Dashboard-Export — Phase ≥3, separater Beschluss).

### 6.4 Signatur-Visuals der Major Tools (Platzierung = Ergebnis-Slot 3)

| Tool | Visual | Spezifikation |
|---|---|---|
| Money Leak | Priorisierte Kategorie-Leisten + Gesamtverlust | Horizontale Balken, absteigend sortiert, direktes Wert-Label am Balkenende ($/Monat), Gesamtverlust als Ergebniszahl darüber; Balkenfarbe `--sfp-navy`, kritische Kategorie zusätzlich Muster-Overlay (nicht nur Farbe) |
| Wealth Horizon | Szenariokorridor + FI-Datum + Meilensteine | Flächenkorridor (konservativ→optimistisch) + Basis-Linie; X-Achse Alter, Y „today's money"; FI-Datum als vertikale Markierung mit Label; Meilensteine (Rentenalter, Caps erreicht) als beschriftete Punkte; Szenarien unterschieden durch Linienstil (durchgezogen/gestrichelt/gepunktet) + Label, nie nur Farbe; Textalternative fasst Endwerte + FI-Jahr zusammen |
| Broker Journey | Match + Jahreskosten + Shortlist-Begründung | Match-Karte: Prozent-Match (tabular-nums) + 2–3 Begründungs-Bullets + geschätzte Jahreskosten als Bandbreite; Kostenvergleich als kompakte Balken |
| Home Lab | Affordability Range + Payment Stack + Risikopuffer | Range-Balken (min–max leistbar, Marker „your target"); gestapelter Payment-Balken (Principal/Interest/Fees/Insurance, direkt beschriftet, Muster je Segment); Risikopuffer-Zeile („at +2 pp: $X/month — still affordable? ✓/⚠") |

### 6.5 State Board (verbindlich, wird als eigenes Artefakt visualisiert)

7 Zustände × Ergebniszustand-Chips (`Example result` neutral-grau · `Your result` navy · `Shared scenario` sky):

| State | Sichtbares Verhalten |
|---|---|
| `initial` | Worked Example mit „Example result"-Chip; Inputs mit Defaults; CTA „Calculate"/erster Schritt |
| `ready` | Genug Inputs für Berechnung; Live-Preview aktualisiert (LiveCanvas) bzw. Weiter-Button aktiv (GuidedJourney) |
| `calculating` | Skeleton NUR im Zahlenbereich (Layout-stabil, reservierte Breiten), 180–240 ms; kein Spinner-Overlay |
| `result` | Volle Ergebnisreihenfolge (6.1); Chip „Your result" bzw. „Shared scenario" |
| `insufficient-data` | Erklärender Block („We need your income and at least one expense…"), listet fehlende Felder mit Sprung-Links; keine leeren Zahlen |
| `stale-data` | Ergebnis bleibt nutzbar; Warning-Token-Banner „Some rules were last verified {date} — results may be outdated" + Link auf Quellen |
| `error` | Fehler-Block (Rot-Token), entschuldigender Satz, „Try again"; Eingaben bleiben erhalten; feuert `tool_calculation_error` |

### 6.6 Design-Abnahmekriterien (Checkliste je Screen/Prototyp)

- [ ] 1280×720: Hub zeigt alle marktverfügbaren Major Decisions erkennbar (US 3, UK/CA/AU 4); Major-Tool-Seite zeigt H1+Nutzen, TrustStrip, erste relevante Eingabe UND Beginn des Ergebnisbereichs
- [ ] 1440/1280/1024/390/360: keine Überlappung, keine abgeschnittenen Zahlen, kein horizontales Scrollen
- [ ] Extremwerte getestet (z. B. $9.999.999 Balance, 45 Jahre Laufzeit, 12-stellige Ergebniszahl) — tabular-nums + reservierte Breiten verhindern Layout Shift
- [ ] Tastatur: vollständige Bedienbarkeit, sichtbarer Fokus-Ring (2 px Navy, 2 px Offset), logische Tab-Reihenfolge
- [ ] Screenreader: Fehler-Summary-Region, gedrosseltes aria-live (8.9), Chart-Textalternativen
- [ ] Light-Mode-Kontrast AA (inkl. Warning-Token-Set auf BG und Weiß)
- [ ] `prefers-reduced-motion`: alle Transitions deaktiviert
- [ ] Reale Inhalte (keine Lorem-Texte), „Example"-Label auf jeder Miniatur/jedem Worked Example
- [ ] Konsistent mit SmartFinPro-Marke (Navy/Gold/Green, Inter), ohne Cockpit-UI zu kopieren

---

## 7. Design Tokens und Komponenten-Inventar

### 7.1 Tool-Tokens (neu in `app/globals.css`; globale `--sfp-*` bleiben unverändert; Tailwind v3 — Mapping in `tailwind.config.ts` `theme.extend`)

| Token | Wert (Vorschlag) | Verwendung |
|---|---|---|
| `--tool-radius-control` | `6px` | Inputs, Buttons, Chips, SegmentedControl |
| `--tool-radius-panel` | `8px` | Panels, Ergebnis-Container, Drawer |
| `--tool-surface` | `#FFFFFF` | Panel-Hintergrund |
| `--tool-surface-muted` | `#F7F9FC` | Seiten-/Sektions-Hintergrund (sehr helles Neutralgrau) |
| `--tool-border` | `#D9DEE8` | Panel-/Input-Borders (ruhiges Grau, klare Kontraststufe zu Surface) |
| `--tool-border-strong` | `#B6C0D2` | Fokus-nahe Abgrenzungen, Tabellen-Header |
| Primary Action | `var(--sfp-navy)` / Hover `var(--sfp-navy-dark)` | Buttons, aktive Steps, Links |
| Positiv | `var(--sfp-green)` | positive Resultate, Einsparungen |
| Risiko/Fehler | `var(--sfp-red)` | ausschließlich Risiken/Fehler |
| Premium-Akzent | `var(--sfp-gold)` | sparsam: max. 1 Akzent je Screen (z. B. FI-Datum-Marker) |
| `--sfp-warning-bg` | `#FFF8E6` | Warnflächen (stale-data, Cap-Hinweise) |
| `--sfp-warning-border` | `#E8C978` | Warn-Border |
| `--sfp-warning-foreground` | `#8A5A00` | Warn-Text — AA-Pflicht auf Warning-BG **und** Weiß (finale Prüfung im High-Fi-Gate) |
| `--sfp-warning-icon` | `#B45309` | Warn-Icons (lucide `triangle-alert`) |
| `--tool-motion` | `200ms cubic-bezier(0.2, 0, 0, 1)` | alle Transitions (Band 180–240 ms); unter `prefers-reduced-motion: reduce` → `0ms` |
| Schatten | `0 1px 2px rgb(16 24 40 / 0.05)` | einzige erlaubte Elevation |

Verboten in Tool-Oberflächen: Farbverläufe, Hover-Translationen, backdrop-filter, verschachtelte Cards, viewport-skalierte Schrift (`clamp()`/`vw`), negatives Letter-Spacing.

### 7.2 Typografie (Inter, `font-variant-numeric: tabular-nums` auf allen Zahlwerten)

| Rolle | Desktop | Mobile | Gewicht |
|---|---|---|---|
| H1 | 40/48 | 30/38 | 700 |
| Tool-H2 | 22/28 | 20/26 | 600 |
| Sektions-H3 | 17/24 | 16/22 | 600 |
| Fließtext/Labels | 15–16/24 | 15–16/24 | 400/500 |
| Zentrale Ergebniszahl | max 44/52 | max 36/44 | 700 |
| Meta/TrustStrip | 13/20 | 13/20 | 500 |

Letter-Spacing überall `0`. Lange Werte: Zahlcontainer mit `min-width` für die längste realistische Ausprägung (Extremwert-AK 6.6).

### 7.3 Komponenten-Inventar `components/tools/shell/`

| Komponente | Datei | RSC/Client | Zweck |
|---|---|---|---|
| `ToolShell` | `tool-shell.tsx` | RSC | Rahmen: Breadcrumb, H1-Block, TrustStrip, Workspace-Grid, Below-Fold-Slots, JSON-LD |
| `ToolTrustStrip` | `tool-trust-strip.tsx` | RSC | Markt · Bearbeitungszeit · „Data verified {min(verifiedAt kritischer Rules)}" · Methodology/Privacy-Links (Name vermeidet Kollision mit `components/marketing/trust-bar.tsx`) |
| `LiveCanvasLayout` / `GuidedJourneyLayout` / `PrecisionWorksheetLayout` | `live-canvas.tsx` etc. | RSC (Grid) + Client-Islands | Modus-Layouts gemäß 6.2 |
| `InputPanel` | `input-panel.tsx` | Client | Formular-Container, Fehler-Summary-Region (`role="alert"`), Abschnitts-Gliederung |
| Financial-Field-Familie | `fields/{currency,percentage,duration,integer,estimate-range,segmented-control}-field.tsx` | Client | Gemeinsame Basis `fields/base-field.tsx`: Label, Locale-Formatierung (Intl.NumberFormat je Markt), Min/Max, Inline-Validierung, Hilfetext, optionale „I'm not sure"-Schätzchips, optional gekoppelter Slider, 44 px Targets |
| `ResultPanel` | `result-panel.tsx` | Client | State-Machine (6.5), Ergebniszustand-Chips, fixe Sektionsreihenfolge, gedrosseltes aria-live (8.9) |
| `ScenarioChart` | `scenario-chart.tsx` | RSC-fähig + Client | Pures SVG; Geometrie aus `lib/calc/chart-geometry.ts`; Varianten: corridor, bars, range, stack, mini (Hub-Miniaturen) |
| `ImpactLevers` | `impact-levers.tsx` | Client | Exakt 3 priorisierte Hebel; Interaktion = `tool_input_change` mit `controlRole:'lever'` |
| `AssumptionsDrawer` | `assumptions-drawer.tsx` | RSC (`<details>`) | Annahmen, Methodik-Kurzform, jede Quelle mit Effective + Verified Date; ohne JS nutzbar |
| `NextBestAction` | `next-best-action.tsx` | RSC + Klick-Tracker-Leaf | Genau eine Brücke (4.5) |
| `ShareResult` | `share-result.tsx` | Client | Fragment-Link + Allowlist-Vorschau (8.7) |
| `ResultMiniBar` | `result-mini-bar.tsx` | Client | Mobile Ergebnisleiste (6.2), erscheint erst ab belastbarem Resultat |
| `ToolJsonLd` | `tool-json-ld.tsx` | RSC | WebApplication + FAQPage + BreadcrumbList aus Registry |
| Hub | `components/tools/hub/{decision-launcher,decision-panel,tool-group}.tsx` | RSC | Decision Launcher (6.3), Miniaturen via `ScenarioChart mini` + „Example"-Chip |

Wiederverwendet ohne Änderung: `AffiliateDisclosure`, `components/seo/{faq,breadcrumb}-schema.tsx`, `lib/seo/hreflang.ts`, cockpit_v1-Module gemäß Kapitel 10.

---

## 8. Berechnungs- und Datenverträge

### 8.1 Result Contract (jedes Major Tool, `lib/tools/shell-types.ts`)

```ts
export type ResultState = 'example' | 'yours' | 'shared';

export interface ToolResult {
  answer: string;                                   // (1) ein Satz, EN
  primary: {
    label: string;                                  // z. B. "Estimated monthly leak"
    value: number;
    range: { low: number; high: number };           // (2) realistische Bandbreite, Pflicht
    format: 'currency' | 'percent' | 'years' | 'date';
    currency?: 'USD' | 'GBP' | 'CAD' | 'AUD';
  };
  scenario: ScenarioVisualData;                     // (3) Daten fürs Signatur-Visual + Textalternative
  levers: [Lever, Lever, Lever];                    // (4) exakt drei, priorisiert
  assumptions: AssumptionEntry[];                   // (5) inkl. Methodik-Verweis
  sources: RuleSourceRef[];                         //     je Quelle: label, url, effectiveFrom, verifiedAt
  verifiedAt: string;                               //     = min(verifiedAt kritischer Rules), ISO
  nextAction: { href: string; label: string; kind: 'cockpit' | 'review' | 'provider' | 'tool' }; // (6) genau eine
  share?: { allowedFields: string[]; preview: string }; // (8) Allowlist + Vorschautext
  report?: { formats: ('pdf' | 'email')[] };        // (9) erst nach Ergebnis angeboten
  resultState: ResultState;                         // (7/10) Chips example/yours/shared
}

export interface Lever {
  key: string;                                      // controlRole:'lever'-Events referenzieren diesen Key
  title: string; deltaLabel: string;                // "Save ~$X/mo" — immer als Bandbreite/Zirka
  apply?: Partial<Record<string, number>>;          // optionale Input-Mutation (Live-Anwendung)
}
```

### 8.2 Calc-Engines (`lib/calc/`, pure Funktionen, kein React/DOM/Date.now)

| Modul | Signatur (Kern) | Konsument |
|---|---|---|
| `retirement/engine.ts` | `projectRetirement(inputs: RetirementInputs, rules: RuleSnapshot): EngineResult` | Wealth Horizon (4 Märkte) |
| `debt/payoff.ts` | `buildPayoffPlan(debts: Debt[], strategy: 'avalanche'\|'snowball', extra: number): PayoffPlan` | Debt Payoff |
| `mortgage/repayment.ts` | `computeRepayment(loan, rate, termYears, offsetBalance?)` | AU Mortgage |
| `mortgage/affordability.ts` | `computeAffordability(income, debts, downPayment, rate, rules)` (GDS/TDS/Stress/CMHC aus Rules) | CA Affordability |
| `mortgage/remortgage.ts` | `compareRemortgage(current, offer, fees)` (inkl. Break-even) | UK Remortgage |
| `savings/{isa,tfsa-rrsp,super,fee-drag}.ts` | je `project*(inputs, rules)` | Supporting Tools |
| `credit/utilization.ts` | `exploreUtilization(cards, actions): ImpactBand[]` — **Rückgabetyp erzwingt Bänder, keine Punkt-Scores** | Credit Utilization Explorer |
| `brokerage/costs.ts` | `estimateAnnualCosts(profile, brokerFees[]): CostEstimate[]` | Trading Cost / Journey (getrennt von cockpit-eigenem `lib/comparison/cost.ts`) |
| `chart-geometry.ts` | `buildCorridorPath`, `buildBarLayout`, `buildStackLayout`, `buildRangeLayout`, `buildMini` — pure SVG-Geometrie | ScenarioChart, Hub-Miniaturen |
| `money-leak/*` | bestehend, bleibt Quelle für den Pilot | Money Leak |

### 8.3 Wealth-Horizon-Modell (mathematisch bindend)

**Durchgängiges Realwert-Modell.** Alle Beträge in heutiger Kaufkraft; Wachstum mit **realen Renditen** (konservativ 3,0 % · Basis 5,0 % · optimistisch 6,5 %, jährlich). **Keine zweite Inflationsbereinigung an irgendeiner Stelle.** Die Inflationsannahme (2,5 %) dient ausschließlich der dokumentierten Herleitung (nominal ≈ real + Inflation) im AssumptionsDrawer; v1 zeigt nur reale Werte, UI-Label „in today's money" prominent am Ergebnis.

Die drei Renditen sind ausdrücklich **redaktionelle Planungsszenarien, keine Prognosen und keine regulatorischen Werte**. Sie werden in `lib/rules/assumptions.ts` als gerundete Realwert-Szenarien dokumentiert und mindestens jährlich gegen drei aktuelle Primärpublikationen der jeweiligen Research-Anbieter geprüft: [Vanguard Capital Markets Model forecasts](https://corporate.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-return-forecasts.html), [BlackRock Capital Market Assumptions](https://www.blackrock.com/institutions/en-global/institutional-insights/thought-leadership/capital-market-assumptions) und [J.P. Morgan 2026 Long-Term Capital Market Assumptions](https://am.jpmorgan.com/us/en/asset-management/adv/insights/portfolio-insights/ltcma/). Methodik: publizierte nominale Bandbreiten diversifizierter Portfolios triangulieren → 2,5 % dokumentierte Inflation abziehen → auf die drei bewusst breiten Szenarien runden. `annualFeePct` wird danach exakt einmal in der Engine abgezogen. Es werden keine Wahrscheinlichkeiten behauptet; Quellen, Datenstand, Ableitung und Unsicherheit erscheinen im AssumptionsDrawer. Ändern die Research-Quellen die Plausibilitätsbandbreite wesentlich, ist ein eigener fachlich reviewter Rules-PR nötig, keine stille Content-Änderung.

```ts
export type RetirementAccountType =
  | 'us-401k' | 'us-traditional-ira' | 'us-roth-ira' | 'us-taxable'
  | 'uk-isa' | 'uk-sipp' | 'uk-taxable'
  | 'ca-tfsa' | 'ca-rrsp' | 'ca-taxable'
  | 'au-super' | 'au-taxable';

export interface RetirementAccountInput {
  id: string;
  type: RetirementAccountType;
  balance: number;
  employeeContributionMonthly: number;
  employerContributionMonthly?: number;
  contributedYtd?: number;
  availableRoom?: number;           // nur Nutzereingabe/offizieller persönlicher Wert; nie aus nationalem Maximum abgeleitet
}

export interface RetirementBaseInputs {
  market: Market; currentAge: number; retireAge: number;
  annualFeePct: number;
  targetMonthlyIncomeToday: number;
  expectedRetirementBenefit?: {
    monthlyAmountToday: number;     // vom Nutzer aus offiziellem Estimator/Statement übernommen
    startsAtAge: number;
    source: 'user-estimate';        // Engine schätzt Anspruch/Höhe nie automatisch
  };
  withdrawalRatePct: number;        // 2.5–5.0, Default 4.0 — einstellbar, Teil der Inputs
}

export type RetirementInputs = RetirementBaseInputs & (
  | {
      contributionMode: 'simple';
      simple: {
        taxAdvantagedBalance: number; taxableBalance: number;
        employeeContributionMonthly: number;
        employerContributionMonthly?: number;
      };
      accounts?: never;
    }
  | {
      contributionMode: 'account-breakdown';
      accounts: [RetirementAccountInput, ...RetirementAccountInput[]];
      simple?: never;
    }
);

export interface ScenarioResult {
  key: 'conservative' | 'base' | 'optimistic';
  rows: { age: number; balance: number }[];         // real, jährlich
  balanceAtRetire: number;
  illustrativeMonthlyWithdrawal: number;            // balance × withdrawalRate / 12 — NIE "sustainable"/Garantie-Wording
  incomeGapMonthly: number;                         // target − withdrawal − Benefit, aber Benefit erst ab startsAtAge
  fiDate: string | null;                            // erstes Jahr, in dem withdrawal + ggf. bereits gestarteter Benefit ≥ target
}

export interface EngineResult {
  scenarios: [ScenarioResult, ScenarioResult, ScenarioResult];
  levers: [Lever, Lever, Lever];                    // Fees −0,5 pp · +$X/Monat · Rentenalter +2 J (Priorität nach Delta)
  contributionChecks: {
    accountId?: string; ruleKey?: string;
    status: 'not-applicable' | 'ok' | 'warning' | 'clamped';
    amountApplied: number; message: string;
  }[];
  bands?: PercentileBand[];                         // Phase-6-Slot (Monte Carlo), v1 ungenutzt
}
```

**Contribution-Vertrag:** Simple mode nutzt die eingegebenen Gesamtwerte ohne automatische Cap-Anwendung und zeigt nur einen Hinweis auf mögliche kontoabhängige Grenzen. Account breakdown prüft jedes Konto separat. Ein festes gesetzliches Limit darf nur mit passendem Kontotyp und `contributedYtd` angewendet werden; ein persönlicher Raum (insbesondere TFSA/RRSP und AU-Carry-forward) nur mit `availableRoom`. Arbeitgeberbeiträge werden als Monatsbetrag an die Engine übergeben und nie aus einem Prozentsatz ohne anrechenbares Einkommen erfunden. Für AU darf ein UI-Helfer `annualEligibleEarnings × SG rate / 12` rechnen; sein Ergebnis bleibt editierbar. Für US unterscheidet die Rules-Schicht Arbeitnehmer-Deferral, Catch-up und Gesamtbeitrag einschließlich Arbeitgeber.

**Benefit-Vertrag:** v1 berechnet weder Social Security noch State Pension, CPP/OAS oder Age Pension automatisch. Der optionale Betrag und sein Startalter stammen vom Nutzer; die UI verlinkt marktbezogen auf [SSA Get a benefits estimate](https://www.ssa.gov/prepare/get-benefits-estimate), [GOV.UK Check your State Pension forecast](https://www.gov.uk/check-state-pension), den [Canadian Retirement Income Calculator](https://www.canada.ca/en/services/benefits/publicpensions/cpp/retirement-income-calculator.html) beziehungsweise [Moneysmart Prepare to retire](https://moneysmart.gov.au/retirement-income/prepare-to-retire) und erklärt, dass Anspruch und Höhe individuell sind. Vor `startsAtAge` ist der Benefit in Projektion, FI-Datum und Einkommenslücke exakt 0.

UI-Pflichten: Entnahme heißt überall **„Illustrative retirement withdrawal"**; Ergebnis als Bandbreite über die drei Szenarien; Entnahmerate sichtbar einstellbar; Sensitivität über die Levers erlebbar; Edukations-/Kein-Beratungs-Hinweis im AssumptionsDrawer und Footer der Ergebnis-Sektion.

### 8.4 Marktregeln (`lib/rules/`)

```ts
export type RuleCategory = 'limit' | 'tax' | 'rate' | 'assumption';
export interface RuleEntry {
  value: number;
  effectiveFrom: string;            // ISO
  effectiveTo?: string;             // offen = bis auf Weiteres
  sourceUrl: string;                // Primärquelle
  verifiedAt: string;               // ISO, Datum der letzten Verifikation
  label: string;                    // EN, UI-tauglich
  category: RuleCategory;           // steuert Freshness-SLA (8.5)
}
export type RulePack = Record<string, RuleEntry[]>; // Einträge je Key sortiert, Fenster überlappungsfrei
// getRule(market, key, asOf): number — dev: throw bei Miss; prod: neuester Eintrag + logger.warn
// getRuleMeta(...), resolveRuleSnapshot(market, keys, asOf) → serialisierbar, RSC→Island-Prop
```

Initiale Einträge (Auszug; Quellen aus 1.5; Alt-Einträge bleiben für asOf-Korrektheit erhalten):

| Pack | Key | Einträge (value @ effectiveFrom) | category |
|---|---|---|---|
| `au` | `superGuaranteeRate` | 0.115 @ 2024-07-01 (bis 2025-06-30) · **0.12 @ 2025-07-01** | limit |
| `au` | `concessionalCap` | 30000 @ 2024-07-01 · **32500 @ 2026-07-01** | limit |
| `au` | `nonConcessionalCap` | 120000 @ 2024-07-01 · **130000 @ 2026-07-01** | limit |
| `ca` | `rrspLimit` | 32490 @ 2025-01-01 · **33810 @ 2026-01-01** | limit |
| `ca` | `tfsaAnnual` | **7000 @ 2024-01-01** (unverändert bis 2026) | limit |
| `ca` | `tfsaCumulative` | 102000 @ 2025-01-01 · **109000 @ 2026-01-01** | limit |
| `ca` | `gdsThreshold` / `tdsThreshold` | 0.32/0.39 · 0.44 (OSFI/CMHC-Richtwerte, verifizieren bei 5.1) | limit |
| `uk` | `isaAllowance` | **20000 @ 2025-04-06** | limit |
| `uk` | `cashIsaAllowance` | 20000 @ 2025-04-06 (bis 2027-04-05) · **12000 @ 2027-04-06** (unter 65) | limit |
| `uk` | `cgtBasicRate` / `cgtHigherRate` | **0.18 / 0.24 @ 2024-10-30** | tax |
| `uk` | `cgtAllowance` / `dividendAllowance` | 3000 / 500 @ 2024-04-06 | tax |
| `us` | `k401Limit` / `k401CatchUp` | 23500/7500 @ 2025-01-01 · **24500/8000 @ 2026-01-01** | limit |
| `us` | `k401CatchUpAge60To63` / `k401TotalContributionLimit` / `rothCatchUpWageThreshold` | **11250 / 72000 / 150000 @ 2026-01-01** | limit |
| `us` | `iraLimit` / `iraCatchUp` | 7000/1000 @ 2025-01-01 · **7500/1100 @ 2026-01-01** | limit |
| `*` | `realReturnConservative/Base/Optimistic` | 0.03 / 0.05 / 0.065 @ 2026-07-12; redaktionelle Szenarien nach Methodik 8.3, nicht als regulatorisch/garantiert labeln | assumption |
| `*` | `inflationAssumption` | 0.025 @ 2026-07-12 (nur Doku-Herleitung, 8.3; kein zweiter Engine-Abzug) | assumption |
| `au/ca/uk` | Hypotheken-Kontextzinsen | nur mit sourceUrl + verifiedAt; Input bleibt editierbar; nie „Live-Zins" behaupten | rate |

### 8.5 Freshness-Semantik (bindend)

- `ToolTrustStrip` zeigt **`min(verifiedAt)` über die kritischen Rules des Tools** (Registry `ruleKeys` markiert kritisch) — „Data verified" darf nie besser aussehen als die schwächste kritische Quelle.
- AssumptionsDrawer/Sources listen **jede** Quelle mit eigenem Effective + Verified Date.
- `scripts/check-rule-freshness.mjs` (Muster `check-content-freshness.mjs`) mit SLAs je `category`: `rate` **90 Tage** · `limit`/`tax` **400 Tage** + Stichtags-Warnung 30 Tage vor 1.1. (US/CA), 6.4. (UK), 1.7. (AU) · `assumption` **365 Tage**. Ausgabe: warn (CI-nicht-blockierend) + Tabelle fürs Dashboard.
- Tool-Seiten: `export const revalidate = 86400`, damit Stichtags-Flips ohne Deploy greifen.
- Überschreitet eine kritische Rule ihr SLA, rendert das Tool den State `stale-data` (6.5) — nutzbar, aber ehrlich.

### 8.6 DecisionStateV1 (`lib/decision/`)

```ts
export interface DecisionStateV1 {
  v: 1; updatedAt: string;
  broker?: { market: Market; quizAnswers: Record<string, string>;
             profile: { experience: string; instruments: string[]; tradesPerMonth: number;
                        avgTradeSize: number; priorities: string[] };
             shortlistSlugs: string[]; costInputs?: Record<string, number> };
  horizon?: { inputs: Partial<RetirementInputs> };
  home?:    { market: Market; inputs: Record<string, number> };
}
```

Storage-Key `sfp_decision_v1`, **sessionStorage** (Privacy-Default; localStorage erst mit Passport-Opt-in, Phase 6). Zod-validiert beim Lesen; fremde Version/korrupt → verwerfen. SSR-safe No-ops. Kein Cockpit-Code liest den Store. Zusätzlich **Session-Key-Konsolidierung** (Phase 1.2): `tracked-affiliate-link.tsx`, `trust-block-tracker.tsx`, `xray-score.tsx`, `comparison-hub.tsx`, `MoneyLeakScanner.tsx` nutzen `getOrCreateAnalyticsSessionId()` statt eigener Keys (`sfp_sid`/`sfp_session` entfallen).

### 8.7 Share-Links (Fragment + Allowlist, bindend)

- Format: `https://smartfinpro.com{toolPath}#s=<base64url(JSON)>` — **niemals Queryparameter**; das Fragment verlässt den Browser nicht (keine Server-Logs/Referrer). Canonical bleibt clean; SSR zeigt stets „Example result", der Client dekodiert und rendert „Shared scenario".
- Payload: `{ v: 1, t: ToolId, i: Record<string, number|string> }`, **gefiltert gegen die per-Tool-Allowlist** (Registry `shareableFields`), Werte **gerundet/gebuckete** (nie Rohbeträge), zod-validiert + an Feld-Ranges geclampt, Cap ~1500 Zeichen; jeder Fehlschlag → `null` (Example-Zustand).
- **Sichtbare Vorschau vor dem Kopieren** (ShareResult): „This link includes: {menschlich lesbare Feldliste}. It never includes exact amounts you typed."

| Tool | `shareableFields` (initial) | Vorschau-Beispiel (EN) |
|---|---|---|
| Money Leak | incomeBand, householdSize, topCategoryKeys, totalLeakBand | "This link includes: income range, household size and your leak categories." |
| Wealth Horizon | ageBand, retireAge, balanceBand, contributionBand, feeBand, withdrawalRatePct, scenario | "This link includes: age range, savings range, fee level and selected scenario." |
| Broker Journey | experience, instruments, tradesPerMonthBand, priorities | "This link includes: trading style, instruments and priorities — no amounts." |
| Home Lab | priceBand, depositBand, termYears, ratePct, market | "This link includes: price range, deposit range, term and rate." |
| Debt Payoff | debtCountBand, totalDebtBand, strategy, extraPaymentBand | "This link includes: debt range, strategy and extra payment range." |

Explizit ausgeschlossen: exaktes Einkommen, exakte Schulden-/Kontostände, E-Mail, Freitext.

### 8.8 Testvektoren (bindend, `__tests__/unit/calc/` + `__tests__/unit/rules.test.ts`)

Fixture-Format: `{ name, source, sourceType, asOf, inputs, expected, tolerance }` mit **`sourceType`**:

- `official` — regulatorische Limits + veröffentlichte Behördenbeispiele (ATO-SG-Beispiele, CRA-RRSP-Raum, IRS-Limits inkl. 60–63-Catch-up/Gesamtbeitrag/Roth-Threshold, gov.uk-CGT-Sätze). Nur diese dürfen „offiziell" heißen.
- `reference` — unabhängig nachgerechnete Golden Fixtures (z. B. Wealth-Horizon-Projektionen, per Tabellenkalkulation doppelt gerechnet, Rechenweg im Fixture-Kommentar).
- `invariant` — mathematische Eigenschaften: Realwert-/Nominalwert-Trennung (eine Projektion mit Inflations-Doppelanwendung MUSS vom Erwartungswert abweichen — Guard gegen Doppelbereinigung), Monotonie (mehr Beitrag ⇒ nie weniger Endvermögen), Nullrendite-Grenzfall, Rundung (Locale-stabil), Entnahmerate (2,5 % ⇒ Entnahme < 4 %-Fall), Simple mode clampet nie, Account breakdown clampet nie ohne passende Konto-/YTD-/Room-Daten, Benefit zählt vor `startsAtAge` exakt 0, Fenster-Boundaries (asOf 2026-06-30 vs. 2026-07-01 flippt AU-Cap), Überlappungsfreiheit aller RulePack-Fenster.

### 8.9 aria-live-Vertrag

Ein einziges visually-hidden `aria-live="polite"`-Element pro Tool; Announcements sind der zusammengefasste Antwortsatz (nicht einzelne Zahlen); **Drosselung: max. 1 Announcement/Sekunde** (Trailing), keine Announcements während Slider-Drag (erst on release/blur); Fehler laufen über eine separate `role="alert"`-Summary. Formale Prüfung in der QA-Matrix (13).

---

## 9. SEO-Routenmatrix

Zielzustand: 28 Routen (4 Hubs · 20 bestehende Tool-Routen inkl. gold-roi am neuen AU-Pfad und Credit-Utilization am neuen Slug · 4 Wealth-Horizon-Routen). Regeln: **Titles ohne Brand-Suffix** (Root-Template hängt `| SmartFinPro` exakt einmal an; Ziel 45–60 Zeichen bare), **Descriptions 140–160 Zeichen**, Canonical immer self via `getCanonicalUrl`, hreflang nur als echter Cluster über `generateAlternates` (x-default → US-Variante), Schema je Tool: `WebApplication` + `FAQPage` (nur bei sichtbarer FAQ) + `BreadcrumbList`. Redirects: `/tools/gold-roi-calculator → /au/tools/gold-roi-calculator` (308, PR 0.3) · `/tools/credit-score-simulator → /tools/credit-utilization-explorer` (308, PR 5.3).

### 9.1 Tabelle A — H1, Title, Description

| Route | H1 (EN) | Title (bare, EN) | Description (EN) |
|---|---|---|---|
| `/tools` | Financial Decision Tools & Calculators | Financial Decision Lab: Free Money Decision Tools | Make one financial decision at a time with free, data-verified tools for budgeting, retirement, broker choice, trading costs and debt planning. |
| `/uk/tools` | UK Financial Decision Tools & Calculators | UK Financial Decision Tools: ISA, Pension & Money | Free UK money tools with verified data: scan household spending, project your pension, compare remortgage savings and plan your ISA tax shield. |
| `/ca/tools` | Canadian Financial Decision Tools & Calculators | Canadian Financial Tools: TFSA, RRSP & Mortgages | Free Canadian money tools with verified data: compare TFSA and RRSP, check mortgage affordability, cut investing fees and find spending leaks. |
| `/au/tools` | Australian Financial Decision Tools & Calculators | Australian Financial Tools: Super, Loans & Savings | Free Australian money tools with verified data: project your super, plan home loan repayments, track gold returns and find hidden overspend. |
| `/tools/money-leak-scanner` | Money Leak Scanner | Money Leak Scanner: Find Hidden Household Overspend | Scan your household budget in two minutes to reveal hidden money leaks, see your biggest cost drains and get three prioritized fixes with savings. |
| `/uk/tools/money-leak-scanner` | Money Leak Scanner UK | Money Leak Scanner UK: Find Hidden Household Waste | Scan your UK household budget in two minutes to reveal hidden money leaks from subscriptions to insurance, with three prioritized fixes and savings. |
| `/ca/tools/money-leak-scanner` | Money Leak Scanner Canada | Money Leak Scanner Canada: Find Hidden Overspend | Scan your Canadian household budget in two minutes to reveal hidden money leaks from banking fees to insurance, with three prioritized fixes. |
| `/au/tools/money-leak-scanner` | Money Leak Scanner Australia | Money Leak Scanner Australia: Find Hidden Overspend | Scan your Australian household budget in two minutes to reveal hidden money leaks from subscriptions to insurance, with three prioritized fixes. |
| `/tools/retirement-calculator` (NEU) | Retirement & Financial Freedom Calculator | Retirement Calculator: 401(k), IRA & FIRE Scenarios | Project your retirement in today's dollars across three scenarios: 401(k) and IRA balances, financial independence date, income gap and fee impact. |
| `/uk/tools/pension-calculator` (NEU) | Pension & Financial Freedom Calculator | Pension Calculator UK: ISA, SIPP & Retirement Income | Project your UK retirement in today's money across three scenarios: ISA and SIPP growth, financial independence date, income gap and fee impact. |
| `/ca/tools/retirement-calculator` (NEU) | Retirement & Financial Freedom Calculator | Retirement Calculator Canada: TFSA, RRSP & FI Date | Project your Canadian retirement in today's dollars across three scenarios: TFSA and RRSP growth, financial independence date and fee impact. |
| `/au/tools/retirement-calculator` (NEU) | Retirement & Financial Freedom Calculator | Retirement Calculator Australia: Super & FIRE Date | Project your Australian retirement in today's dollars across three scenarios: super growth at the 12% guarantee, FIRE date, income gap and fees. |
| `/tools/broker-finder` | Broker Finder Quiz | Broker Finder Quiz: Match Your Ideal Trading Platform | Answer five quick questions about your trading style and get a matched broker shortlist with clear reasoning, estimated costs and sensible next steps. |
| `/tools/trading-cost-calculator` | Trading Cost Calculator | Trading Cost Calculator: Compare Broker Fees Fast | Estimate your yearly trading costs from trade size and frequency, compare spreads, commissions and fees across brokers, and find the cheapest fit. |
| `/tools/broker-comparison` | Broker Comparison Tool | Broker Comparison Tool: Forex & CFD Brokers Compared | Compare forex and CFD brokers side by side on spreads, fees, platforms and regulation, pre-filtered by your quiz shortlist and personal cost profile. |
| `/tools/debt-payoff-calculator` | Debt Payoff Calculator | Debt Payoff Calculator: Your Debt-Free Date & Plan | List your debts and compare avalanche versus snowball payoff plans: see your debt-free date, total interest saved and three moves that speed it up. |
| `/tools/credit-utilization-explorer` (NEU, ersetzt credit-score-simulator) | Credit Utilization & Score Impact Explorer | Credit Utilization Explorer: Score Impact in Ranges | Explore how paying down balances or changing limits shifts your credit utilization, with realistic score impact ranges instead of false precision. |
| `/tools/credit-card-rewards-calculator` | Credit Card Rewards Calculator | Credit Card Rewards Calculator: Find Your Best Card | Enter monthly spending by category and compare credit card rewards side by side to see which card pays you back the most each year after annual fees. |
| `/tools/loan-calculator` | Loan Calculator | Loan Calculator: Monthly Payments, Interest & Payoff | Work out monthly payments, total interest and payoff time for personal or consolidation loans, then compare scenarios before you borrow anything. |
| `/tools/ai-roi-calculator` | AI ROI Calculator for Business | AI ROI Calculator: Measure AI Tool Payback for Business | Estimate the return on AI writing and productivity tools for your business: monthly cost, time saved, payback period and a realistic ROI range. |
| `/uk/tools/isa-tax-savings-calculator` | ISA Tax Savings Calculator | ISA Tax Savings Calculator 2026/27: Your Tax Shield | See how much capital gains and dividend tax an ISA could save you in 2026/27, with verified HMRC rates, allowances and the 2027 cash ISA change. |
| `/uk/tools/remortgage-calculator` | UK Remortgage Calculator | Remortgage Calculator UK: Interest Savings & Fees | Compare your current mortgage against a new rate: monthly savings, total interest, fees and break-even point, with sourced and dated assumptions. |
| `/ca/tools/tfsa-rrsp-calculator` | TFSA vs RRSP Calculator | TFSA vs RRSP Calculator 2026: Compare Tax Savings | Compare TFSA and RRSP outcomes with verified 2026 CRA limits: after-tax growth, refund effects and which account fits your income and timeline. |
| `/ca/tools/wealthsimple-calculator` | Wealthsimple Fee Savings Calculator | Wealthsimple Fee Savings Calculator: What You Save | Compare Wealthsimple's management fees against typical Canadian mutual fund costs and see what lower fees could add to your portfolio over time. |
| `/ca/tools/ca-mortgage-affordability-calculator` | Canadian Mortgage Affordability Calculator | Canada Mortgage Affordability: GDS, TDS & Stress Test | Check what home you can afford in Canada using GDS and TDS ratios, the mortgage stress test and CMHC insurance tiers, with a clear payment stack. |
| `/au/tools/superannuation-calculator` | Superannuation Calculator | Superannuation Calculator: Project Your Super at 67 | Project your super balance at retirement with the current 12% guarantee and 2026-27 caps: contributions, fees and three levers that grow it faster. |
| `/au/tools/au-mortgage-calculator` | Australian Home Loan Calculator | Australian Mortgage Calculator: Repayments & Offset | Calculate Australian home loan repayments with LVR, offset account savings and a rate stress buffer, using dated assumptions that you can verify. |
| `/au/tools/gold-roi-calculator` (Umzugsziel) | Gold ROI Calculator Australia | Gold ROI Calculator Australia: Investment Returns | Model gold investment returns for Australian investors across conservative to optimistic scenarios, with dated assumptions and clear methodology. |

### 9.2 Tabelle B — Intent, Canonical, hreflang, Indexierung, Schema

| Route | Primärer Intent / Sekundär | Keyword-Cluster | hreflang | Index | Schema |
|---|---|---|---|---|---|
| `/tools` + 3 Markt-Hubs | navigational/transaktional: „free financial calculators" / Markt-Varianten | financial tools, money calculator, {market} finance tools | 4er-Cluster (Hubs untereinander), x-default→`/tools` | ja | BreadcrumbList + ItemList(WebApplication) |
| Money Leak ×4 | transaktional: „where does my money go" / „money leak", „budget leaks" | household overspend, hidden subscriptions, budget scanner | bestehender korrekter 4er-Cluster bleibt | ja | WebApplication + FAQPage + HowTo (bestehend) + BreadcrumbList |
| Wealth Horizon ×4 | transaktional: „retirement calculator" (US/CA/AU), „pension calculator" (UK) / „FIRE calculator", „financial independence" | retirement projection, {401k/ISA-SIPP/TFSA-RRSP/super} calculator, FIRE date | NEUER 4er-Cluster, x-default→US | ja (Launch komplett) | WebApplication + FAQPage + BreadcrumbList |
| `/tools/broker-finder` | transaktional: „which broker should I use" / „broker quiz" | broker finder, broker match quiz | kein Cluster (self) | ja | WebApplication + FAQPage + BreadcrumbList |
| `/tools/trading-cost-calculator` | transaktional: „trading fees calculator" | brokerage cost, commission calculator | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/tools/broker-comparison` | kommerziell: „compare forex brokers" | broker comparison, cfd broker compare | self | ja | WebApplication + BreadcrumbList (+ bestehende Vergleichsschemata nur falls Datenbasis) |
| `/tools/debt-payoff-calculator` | transaktional: „debt payoff calculator" / „debt snowball vs avalanche" | debt free date, payoff plan | self | **noindex bis Gate** (erwartet nach PR 2.3) | WebApplication + FAQPage + BreadcrumbList |
| `/tools/credit-utilization-explorer` | informational/transaktional: „credit utilization impact" / bewusst NICHT „exact score simulator" | credit utilization, score impact range | self | **noindex bis Gate** (nach PR 5.3) | WebApplication + FAQPage + BreadcrumbList |
| `/tools/credit-card-rewards-calculator` | kommerziell: „best rewards card for my spending" | rewards calculator, cashback compare | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/tools/loan-calculator` | transaktional: „loan payment calculator" / Konsolidierung | loan repayment, consolidation cost | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/tools/ai-roi-calculator` | kommerziell (B2B): „AI tools ROI" | ai roi, ai payback business | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/uk/tools/isa-tax-savings-calculator` | transaktional: „isa tax savings" / „2027 cash isa change" | isa allowance 2026/27, cgt dividend shield | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/uk/tools/remortgage-calculator` | transaktional: „remortgage savings calculator" | remortgage deal compare, break even | self | **noindex bis Gate** (nach PR 5.2) | WebApplication + FAQPage + BreadcrumbList |
| `/ca/tools/tfsa-rrsp-calculator` | kommerziell/informational: „tfsa vs rrsp" | tfsa rrsp 2026 limits, which account | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/ca/tools/wealthsimple-calculator` | kommerziell: „wealthsimple fees" | wealthsimple vs mutual funds, fee drag | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/ca/tools/ca-mortgage-affordability-calculator` | transaktional: „how much house can I afford canada" | gds tds calculator, stress test | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/au/tools/superannuation-calculator` | transaktional: „superannuation calculator" (Konto-Mechanik) | super balance projection, sg 12% | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/au/tools/au-mortgage-calculator` | transaktional: „home loan repayment calculator australia" | repayments lvr offset | self | ja | WebApplication + FAQPage + BreadcrumbList |
| `/au/tools/gold-roi-calculator` | Nische: „gold investment return australia" | gold roi, gold vs inflation au | self | ja (nach atomarem Umzug 0.3) | WebApplication + FAQPage + BreadcrumbList |

Canonical ist in **allen** Fällen self-referenziell auf die eigene Route via `getCanonicalUrl` (behebt: 7 fehlende Canonicals, gold-roi-404-Canonical, 4 falsche Cluster). x-default nur bei echten Clustern.

### 9.3 Tabelle C — Interne Links, externe Quellen, Abgrenzung

| Route | Interne Links (min.) | Externe Autoritätsquellen | Content-Abgrenzung |
|---|---|---|---|
| Hubs | marktverfügbare Major Decisions (US 3, UK/CA/AU 4) + gruppierte Supporting-Tools + Markt-Hub-Geschwister | — | Hub = Entscheidungs-Einstieg; keine Berechnung, kein Ratgeber-Longform (Abgrenzung zu Pillar-Seiten) |
| Money Leak ×4 | Hub, Wealth Horizon (Ersparnis investieren), Brücke 4.5, 2 Reviews | markt-spezifische Verbraucherseiten (CFPB / MoneyHelper / FCAC / Moneysmart) | Ausgaben-Diagnose; NICHT Budget-Planner oder Debt-Tool |
| Wealth Horizon ×4 | Hub, jeweiliger Supporting-Sparrechner (Deep-Link), Brücke 4.5, Pillar Personal Finance | IRS n-25-67 / gov.uk Pension+ISA / canada.ca Limits / ato.gov.au Caps + SG | Ganzheitliche Projektion + FI-Datum; Supporting-Rechner = Einzelkonto-Mechanik (siehe deren Zeilen) |
| Broker Finder | Trading Cost (Journey-Schritt 3), Broker Comparison, Trading-Cockpit, 2 Broker-Reviews | Regulatoren (SEC/FINRA bzw. FCA/ASIC/CIRO je Markt-Kontext) | Matching-Quiz; NICHT Vergleichstabelle (das ist broker-comparison) und NICHT Kostenrechner |
| Trading Cost | Broker Finder, Broker Comparison, Trading-Cockpit | Regulatoren-Gebühren-Doku, Broker-Preislisten (dated) | Persönliche Kostenrechnung; NICHT generischer Brokervergleich |
| Broker Comparison | Broker Finder, Trading Cost, Trading-Cockpit, Reviews | Regulatoren | Side-by-side-Attribute; Abgrenzung zum Best-X-Cockpit: Tool = nutzerkonfigurierter Vergleich der Quiz-Shortlist, Cockpit = redaktionell gerankte Bestenliste |
| Debt Payoff | Loan (Konsolidierung), Credit Utilization, Debt-Relief-Cockpit | CFPB Debt-Ratgeber | Payoff-Plan; NICHT Kreditvergabe (loan) und NICHT Score-Betrachtung |
| Credit Utilization Explorer | Debt Payoff, Rewards, Credit-Monitoring-Cockpit | CFPB/FICO-Methodik-Doku (nur Erklärung, keine Score-Garantien) | Bänder statt Score-Simulation — bewusste Abgrenzung vom alten „Simulator"-Framing |
| Rewards | Credit-Card-Cockpit, Credit Utilization, 2 Karten-Reviews | Issuer-Preisverzeichnisse (dated) | Rewards-Optimierung; NICHT Schulden-/Zinsrechner |
| Loan | Debt Payoff, Debt-Relief-Cockpit | CFPB | Kreditkosten-Entscheidung („borrow or not"); NICHT Payoff-Planung bestehender Schulden |
| AI ROI | AI-Tools-Cockpit, 2 AI-Tool-Reviews, Business-Banking-Pillar | Anbieter-Preisseiten (dated) | B2B-Payback; NICHT Consumer-Finanzplanung — läuft unter decisionCategory `business` |
| ISA | Wealth Horizon UK (Deep-Link), Investing-Apps-Cockpit, ISA-Pillar | gov.uk ISA + CGT + Factsheet 2027 | Steuer-Schild einzelnes Konto; Pension-Projektion → Wealth Horizon UK |
| UK Remortgage | Home-Lab-Geschwister, Remortgage-Cockpit, Remortgage-Pillar | MoneyHelper, FCA | Deal-Vergleich bestehender Hypothek; NICHT Erst-Affordability |
| TFSA/RRSP | Wealth Horizon CA (Deep-Link), TFSA-RRSP-Platforms-Cockpit | canada.ca Limits | Kontowahl-Entscheidung; Projektion → Wealth Horizon CA |
| Wealthsimple Fee | Robo-Advisors-Cockpit CA, Wealthsimple-Review | Wealthsimple-Preisseite (dated), FCAC | Anbieter-spezifischer Fee-Vergleich; NICHT generische Projektion |
| CA Affordability | Home-Lab-Geschwister, Mortgage-Brokers-Cockpit CA | CMHC, OSFI (Stress-Test) | Kaufkraft-Ermittlung; NICHT Raten-Detailrechnung (au-mortgage) oder Remortgage |
| Superannuation | Wealth Horizon AU (Deep-Link), Super-Funds-Cockpit | ato.gov.au SG + Caps, Moneysmart | Super-Konto-Mechanik (SG, Caps, Gebühren); Whole-of-wealth-FI → Wealth Horizon AU |
| AU Mortgage | Home-Lab-Geschwister, Savings-Cockpit AU (Offset) | RBA (Zins-Kontext, dated), Moneysmart | Repayment/Offset-Mechanik; Affordability → CA-Pendant nur als Konzept, kein AU-Duplikat |
| Gold ROI | Gold-Investing-Cockpit AU, Gold-Review | Perth Mint / World Gold Council (dated) | Nischen-Szenariorechner; KEIN Anlageberatungs-Framing |

---

## 10. tool_v1-Eventvertrag und Dashboard-Spezifikation

### 10.1 Grundsätze

- **Strikt additiv zu cockpit_v1**: neuer Sibling-Typ `tool_event_batch` in `/api/track` (`TrackSchema.type`-Enum +1, eine neue `case`); der cockpit_v1-Pfad bleibt byte-identisch; GA-Alias-Code (läuft ~11.08.2026 aus) unangetastet.
- Ziel-Tabelle: bestehende `analytics_events` (properties JSONB, GIN-Index) — **keine Migration**.
- Reuse unverändert: `lib/analytics/session.ts` (`sfp_session_id`), `lib/analytics/bot-detect.ts` (Bot-Gate verwirft den ganzen Batch, da alle Items category `tool`), `createImpressionDeduper` (eigener Storage-Key `sfp_tool_seen_v1`).
- Neu: `lib/analytics/event-queue.ts` (generische Queue + Trailing-Debounce; die cockpit-eigenen Kopien bleiben eingefroren), `lib/analytics/tool-events.ts` (pure core), `lib/analytics/tool-tracking.ts` (`'use client'`, sendBeacon → fetch-keepalive, Killswitch `NEXT_PUBLIC_ENABLE_ANALYTICS`).
- Rate-Limit: bestehendes gewichtetes IP-Limit; `computeToolBatchWeight` analog cockpit (1 Token/Event, Batch-Cap 20).
- **Einheitlicher Funnel-Dedupe-Key:** `sessionId + toolId + market + variantPath`, wobei `variantPath` immer der kanonische Pathname ohne Query oder Fragment ist. `tool_view`, `tool_start`, `tool_first_result` und `tool_qualified_decision` verwenden exakt denselben Scope, damit Markt-/Varianten-Nenner und -Zähler nicht auseinanderlaufen; dies trennt insbesondere die globalen Broker-Routen bei einem Marktwechsel korrekt.

### 10.2 Die 12 Events (`eventCategory: 'tool'`, `schemaVersion: 'tool_v1'`)

| Event | Trigger | Dedupe | Besondere Properties |
|---|---|---|---|
| `tool_view` | Tool-Seite sichtbar | 1×/Funnel-Dedupe-Key | `resultState:'example'` initial |
| `tool_start` | erste echte Nutzer-Interaktion mit einem Input | 1×/Funnel-Dedupe-Key | `inputKey` des ersten Felds |
| `tool_input_change` | Feldänderung, **600 ms Trailing-Debounce pro Feld**; Werte NUR als Buckets (`inputBucket`), nie Rohbeträge. `controlRole:'field'`: Hard-Cap 40/Funnel-Key. `controlRole:'lever'`: separater Cap 10/Funnel-Key und nie vom Feld-Cap blockiert | rollenabhängiger Cap | `inputKey`, `inputBucket`, `controlRole?: 'field'\|'lever'` |
| `tool_first_result` | erster Wechsel in State `result` × `yours` | 1×/Funnel-Dedupe-Key | `ttfvMs` (Zeit seit `tool_view`) |
| `tool_qualified_decision` | Prädikat 10.3 | 1×/Funnel-Dedupe-Key | `qualifiedVia` |
| `tool_scenario_compare` | Szenario-Umschaltung/Stress-Toggle | — | `scenario` |
| `tool_result_share` | Share-Link kopiert (nach Vorschau) | — | `shareFieldCount` |
| `tool_report_download` / `tool_report_email` | Bericht erzeugt/angefordert (immer NACH Ergebnis) | — | `format` |
| `tool_next_action_click` | Klick auf NextBestAction | — | `nextActionKind: 'cockpit'\|'review'\|'provider'\|'tool'` |
| `tool_cockpit_cta_click` | Zusatzsignal, wenn NextBestAction-Ziel ein Cockpit ist; derselbe Klick feuert **zuerst `tool_next_action_click`, danach zusätzlich dieses Event**, damit Result-to-Action vollständig bleibt (Name kollidiert bewusst NICHT mit cockpit_v1s `cockpit_cta_click`) | — | `bridgeHref` |
| `tool_calculation_error` | Engine wirft / State `error` | — | `errorKind` (ohne PII/Stacktrace) |

`ToolV1PropertiesSchema` (in `lib/validation/index.ts`, `.strict()`): `schemaVersion: z.literal('tool_v1')`, `toolId` (Registry-Enum), `market`, `variantPath`, `shellMode`, `resultState`, plus die Event-spezifischen Felder oben; Batch-Schema `TrackToolEventBatchSchema` max 20, `eventName: z.enum(TOOL_EVENT_NAMES)`, `eventCategory: z.literal('tool')`.

### 10.3 Qualified-Decision-Prädikat (bindend, pure Funktion `isQualifiedDecision()` in `tool-events.ts`, unit-getestet)

`tool_first_result` ist gefeuert **UND** mindestens eines von:
- `tool_scenario_compare`
- `tool_input_change` mit `controlRole='lever'`
- `tool_next_action_click`
- `tool_result_share`
- `tool_report_download`
- `tool_report_email`

**Alternativ:** Resultat ≥ 20 Sekunden **qualifiziert sichtbar** UND ≥ 3 qualifizierende Inputs. Qualifiziert sichtbar bedeutet: `document.visibilityState === 'visible'` und mindestens 50 % des ResultPanel liegen per IntersectionObserver im Viewport. Der Timer startet erst bei erfüllten Bedingungen, pausiert sofort bei Tab-Hintergrund/Unterschreiten der Schwelle und setzt danach fort; Hintergrundzeit zählt nie. Auslösung **maximal einmal pro Funnel-Dedupe-Key**. Das Dashboard zählt ausschließlich das Event, es re-deriviert nie.

GA-Mirror: nur `tool_view`, `tool_qualified_decision`, `tool_cockpit_cta_click` (Quota-Disziplin; keine Legacy-Aliase).

### 10.4 Dashboard `/dashboard/analytics/tools`

Dateien: `lib/actions/tool-analytics.ts` (`'use server'`, select-then-aggregate-in-JS, defensive `.range()`-Pagination, PAGE_SIZE 10k / HARD_CAP 100k — Muster `cockpit-analytics.ts`) · `app/api/dashboard/tool-analytics/route.ts` (GET-Proxy; Client-Komponenten fetchen, importieren nie Server Actions) · `app/(dashboard)/dashboard/analytics/tools/page.tsx` · `components/dashboard/tool-analytics.tsx` (recharts erlaubt) · je 1 Nav-Eintrag in `app/(dashboard)/layout.tsx` + `command-palette.tsx`. Abgrenzung: `/dashboard/tools/money-leak` (bestehende Ops-Seite) bleibt unberührt.

Metriken (je Tool × Markt × Zeitraum × Device):

| Metrik | Definition |
|---|---|
| Starts | `tool_start`-Sessions |
| Time to First Value (TTFV) | Median `ttfvMs` aus `tool_first_result` |
| Completion Rate | `tool_first_result` ÷ `tool_view` |
| Qualified Decision Rate (QDR) | `tool_qualified_decision` ÷ `tool_view` — **North-Star** |
| Result-to-Action Rate | `tool_next_action_click` ÷ `tool_first_result` |
| Szenariointeraktionen | `tool_scenario_compare` je Session mit Result |
| Share-/Report-Rate | (`tool_result_share` + `tool_report_*`) ÷ `tool_first_result` |
| Mobile Drop-off | 1 − Completion(mobile) ÷ Completion(desktop) |
| Wiederkehrende Nutzung | Sessions mit `tool_view` auf ≥ 2 Kalendertagen (Näherung ohne Nutzer-ID: nur innerhalb Session-Persistenz möglich → als „Return within session window" ausgewiesen, ehrlich beschriftet) |
| Tool Health | Registry-Manifest (`getExpectedTrackingManifest()`) × Ist-Events: `reporting` / `silent` (≥5 Pageviews, 0 Events) / `low_traffic` / `no_traffic` |
| Volumen-Wache | rows/day je event_name (Guard gegen input_change-Flut) |

**Nach Affiliate-Anbindung** (separates Vorhaben, hier nur Platzhalter-Kacheln mit „pending postback integration"-Label): EPC, Revenue per Qualified Session, Approval Rate, Provider Conversion und **Postback-Abdeckung als eigene Kennzahl** (verifizierte Provider ÷ aktive Provider).

Experimente: vor jeder CRO-Änderung **7–14 Tage Baseline** (startet mit PR 1.3); pro Experiment genau eine zentrale Variable.

---

## 11. Phasenplan mit PR-Grenzen

**Zwei Implementierungspläne** (Modell-Gates gemäß Governance-Plan): **Foundation Implementation Plan** (Phase 0+1) — erstellt direkt nach Freigabe dieser Spec, Umsetzung parallel zum Design-Track; **Product Experience Implementation Plan** (Phase 2–5) — erst nach visueller Freigabe (Lo-Fi → interaktive Prototypen Broker Journey + Wealth Horizon → State Board → High-Fi ×5 bei 1280/390 px). Phase 6 nur nach gesondertem Beschluss auf Datenbasis.

Gates je PR: `npx tsc --noEmit` · relevante Vitest-Suiten · lokales `npm run build` (Vorab-Gate) · **ab PR 0.0 CI-Production-Build als Required Check** · benannte Playwright-Specs · Rollback = `git revert` (nirgends DB-Migrationen). Basis aller Branches: frisches `origin/main`.

| PR | Inhalt | Kern-Dateien | Zusätzliche Gates |
|---|---|---|---|
| **0.0** | CI-Production-Build: echter `npm run build` im Runner für PRs, die `app/`, `components/tools/`, `lib/{calc,rules,tools,decision}/`, SEO-Schemas oder `next.config.ts` berühren; Required Check; Nightly ergänzend | `.github/workflows/*` | Umsetzung Sonnet; Opus nur bei Env-Fallbacks |
| **0.1** | Tool-Registry + fs-Parity-Test; `variants[]` (SEO-Routen) und `availableMarkets[]` (funktionale Verfügbarkeit) getrennt; `getToolEntryHref()` erzeugt bei globalen marktübergreifenden Tools den validierten Marktparameter | `lib/tools/registry/*`, `__tests__/unit/tool-registry.test.ts` | nur neue Dateien — risikofrei |
| **0.2** | `buildToolMetadata()` auf alle 20 Tool-Seiten: Doppel-Suffix weg, 7 fehlende Canonicals, 4 falsche hreflang-Cluster ersetzt | 20 × `page.tsx`, `lib/tools/registry/metadata.ts` | neu: `e2e/tool-seo.spec.ts` (JS-off: genau 1 Brand-Suffix, self-Canonical); `npm run check:seo` |
| **0.3** | **gold-roi ATOMAR**: neue Route `/au/tools/gold-roi-calculator` + 308 von `/tools/gold-roi-calculator` + korrekter Canonical + hreflang + Registry- + Sitemap-Eintrag + AU-Hub-Link + Redirect-/Canonical-/Route-Tests | 2 Pages, `next.config.ts`, Registry, `sitemap.ts` | e2e-Redirect-Assertion; kein inkonsistenter Zwischenstand |
| **0.4** | `lib/rules/` + Testvektoren + Stale-Fixes: Super 11,5→12 % + Cap-Copy, TFSA/RRSP-2026-Werte, ISA-CGT-Copy (10 %→18/24) + Label 2026/27 | `lib/rules/*`, 3 Widgets, 2 Page-Copies, `__tests__/unit/rules.test.ts` | Fable-Entwurf → Sonnet → **Opus-Review** |
| **0.5** | Naming-Drift (Wealthsimple Fee Savings; „5 questions") + statische „Popular"-Badges entfernt | Hub-Arrays, `config/navigation.ts`, 2 Pages | kein De-noindex (Gate!) |
| **0.6** | Übrige Registry-Konsumenten: Nav/Footer, 4 Hubs datenseitig, Sitemap + Markt-Hub-URLs, `llms.txt`-Tools-Sektion, Homepage `totalTools={countLiveTools()}` | `config/navigation.ts`, 4 Hub-Pages, `sitemap.ts`, `app/llms.txt/route.ts`, Homepage | fs-Parity-Test ist der Wächter |
| **0.7** | `generateWebApplicationSchema` + FAQPage-JSON-LD auf Tool-Seiten mit sichtbarer FAQ | `lib/seo/schema.ts`, `components/seo/web-application-schema.tsx`, Tool-Pages | JSON-LD-Parse-Assertion in e2e (JS-off) |
| **1.1** | tool_v1 Core: `tool-events.ts`, `event-queue.ts`, Validation-Schemas, `/api/track`-Case | `lib/analytics/*`, `lib/validation/index.ts`, `app/api/track/route.ts` | Fable-Entwurf → Sonnet → **Opus-Review**; vitest tool-events/validation |
| **1.2** | Client-Binding `tool-tracking.ts` + Session-Key-Konsolidierung (5 Komponenten) | `lib/analytics/tool-tracking.ts`, 5 Komponenten | `e2e/tool-tracking.spec.ts` (JS-on, route-intercept) |
| **1.3** | Instrumentierung: Money Leak (ersetzt kaputte `/api/track-cta`-Calls), Broker Finder, Trading Cost → **Baseline-Fenster 7–14 Tage startet** | 3 Widgets | e2e-Eventfluss |
| **1.4** | Dashboard-Tab Tools | Dateien aus 10.4 | `test:dashboard-smoke` |
| **2.1** | Shell-Rahmen + 3 Modus-Layouts + Financial-Field-Familie + `chart-geometry` + Tokens; **CI-Guards ausweiten** (`check-client-server-imports.sh` DIRS += `components/tools`; Hydration-Exemption entfernen) | `components/tools/shell/*`, `lib/calc/chart-geometry.ts`, `app/globals.css`, `tailwind.config.ts`, 2 Scripts | Fable-Referenz → Sonnet → **Opus-Review** (SSR/Hydration) |
| **2.2** | Pilot Money Leak → LiveCanvas-Shell | Money-Leak-Pages/-Komponenten | no-JS-e2e (H1/Methodik/FAQ/Worked-Example/Verified-Date), `test:hydration`, Design-AK 6.6 |
| **2.3** | Debt Payoff → PrecisionWorksheet (Calc-Extraktion `lib/calc/debt/`, Fragment-Share) · danach eigener **Gate-PR** (De-noindex bei bestandener Checkliste) | Widget, `lib/calc/debt/*` | vitest-Vektoren; Gate-Checkliste im PR-Text |
| **2.4** | Hub → Decision Launcher (alle 4 Märkte) | `app/(marketing)/{tools,uk/tools,ca/tools,au/tools}/page.tsx`, `components/tools/hub/*` | Design-AK 1280×720; e2e-Hub-Assertions |
| **3.1–3.4** | `lib/decision/*` + Codec-Tests → Hub-Marktparameter validieren/persistieren → Quiz schreibt marktgefiltertes Profile → Trading-Cost-Prefill + Comparison-Shortlist → marktgerechte Cockpit-Brücke + Journey-e2e | `lib/decision/*`, 3 Widgets | Fable: 3.1-Entwurf; Journey-e2e JS-on mehrseitig für US/UK/CA/AU; Canonical bleibt parameterlos |
| **4.1–4.4** | Retirement-Engine + Vektoren (Realwert-Invariante, Simple-vs.-Account-Modus, Benefit-Startalter, account-spezifische Caps) → US-Route (volle Shell) → UK/CA/AU + hreflang-Cluster → Supporting-Deep-Links | `lib/calc/retirement/*`, 4 neue Page-Trees | **Fable + unabhängiger Opus-Review der Engine vor Merge** |
| **5.1–5.3** | Mortgage-Engines ×3 + Vektoren → Home-Lab-Shell (3 Märkte; URLs bleiben) + **Gate-PR uk/remortgage** → Rest-Migrationen: Credit Utilization Explorer (neuer Slug + 308 + Band-Typ) + **Gate-PR**, AI-ROI-Repositionierung, Loan-Kontext, Wealthsimple + Rewards in Shell | `lib/calc/mortgage/*`, Widgets | **Fable + Opus-Review der Engines**; Gate-Checklisten |
| **6.x** | Decision Passport (localStorage-Opt-in) + Monte-Carlo-Bands | — | nur nach validiertem Bedarf (QDR-Daten) + gesonderter Freigabe |

**Indexability Gate** (ersetzt jedes pauschale De-noindex; je Tool eigener Mini-PR mit ausgefüllter Checkliste): (1) Berechnungslogik getestet · (2) Daten aktuell · (3) eigenständiger Search Intent bestätigt · (4) vollständige Methodik + Quellen · (5) Canonical + hreflang korrekt · (6) Schema valide · (7) interne Links vorhanden · (8) Mobile UX geprüft · (9) keine kritischen Fehler · (10) keine Kannibalisierung einer stärkeren Route. Nicht bestanden ⇒ bleibt noindex.

Abhängigkeiten: 0.2/0.3/0.5/0.6 ← 0.1 · 0.5 ← 0.4 · 1.2 ← 1.1 · 1.3 ← 1.2 · 1.4 ← 1.1+0.1 · 2.x ← visuelle Freigabe + 1.2 · 3.x ← 2.1 · 4.2 ← 4.1+2.1 · 5.2 ← 5.1+2.1.

## 12. Acceptance Criteria je Phase

**Phase 0:** Kein Tool-Title enthält doppeltes `| SmartFinPro` (e2e-bewiesen) · alle 28 Ziel-Routen (soweit existent) haben self-Canonical · kein hreflang-Ziel 404t · gold-roi: alter Pfad 308t, neuer Pfad 200, Sitemap führt nur den neuen · Super-Widget zeigt 12 %/A$32.500, TFSA/RRSP 2026-Werte, ISA-Copy 18/24 % + 2026/27 · Sitemap enthält 3 Markt-Hubs · llms.txt listet Live-Tools · Homepage-Zahl == `countLiveTools()` · fs-Parity-Test grün · CI-Build Required Check aktiv.

**Phase 1:** `event_batch` (cockpit) verhält sich byte-identisch (Regressions-e2e) · `tool_event_batch` validiert strikt, Bots verworfen, Feld-Cap 40 und separater Lever-Cap 10 greifen (Unit) · alle Funnel-Stufen nutzen denselben `sessionId+toolId+market+variantPath`-Dedupe-Key · 20-Sekunden-Fallback zählt nur qualifiziert sichtbare Resultatzeit (Visibility-/Intersection-Tests) · Money-Leak-Events landen in `analytics_events` statt 400 · alle 5 Komponenten nutzen `sfp_session_id` · Dashboard-Tab rendert mit leeren Daten fehlerfrei · Baseline-Fenster dokumentiert (Start/Ende im Dashboard annotiert).

**Phase 2:** Pilot-Seiten bestehen no-JS-e2e (H1, Intro, initialer Zustand, Worked Example inkl. SVG, Methodik, FAQ, Quellen, Verified-Datum sichtbar) · Hydration-Suite grün · Design-AK 6.6 vollständig abgehakt (inkl. 1280×720-Checks) · First-Load-JS der migrierten Routen ≤ Vorher-Wert (build-Vergleich) · Hubs zeigen alle marktverfügbaren Decisions mit „Example"-Miniaturen (US 3, UK/CA/AU 4) · CI-Guards decken `components/tools` ab.

**Phase 3:** Hub-Marktparameter wird validiert und in `broker.market` persistiert · Quiz→Kosten→Vergleich ohne Doppeleingabe (e2e je US/UK/CA/AU) · Shortlist enthält ausschließlich im gewählten Markt verfügbare Anbieter · Regulierung/Kosten/Brücke entsprechen dem Markt · Canonical/OG bleiben parameterlos · „Using your quiz answers"-Zeile sichtbar+editierbar · Cockpit unverändert (kein Import aus `lib/decision` in Cockpit-Code, Grep-Gate) · jeder Cockpit-Klick feuert `tool_next_action_click` plus `tool_cockpit_cta_click`.

**Phase 4:** Alle Engine-Vektoren grün (official/reference/invariant, inkl. Realwert-Invariante + Boundary 1.7.) · 4 Routen live mit korrektem Cluster · Entnahme überall „Illustrative retirement withdrawal" mit einstellbarer Rate · Simple mode clampet nie; Account breakdown prüft Konto/YTD/persönlichen Raum und zeigt jeden zulässigen Clamp mit Quelle · Benefit wird nur aus Nutzereingabe und erst ab Startalter berücksichtigt · US-Age-60–63-/Gesamtbeitrags-Regeln getestet · Opus-Review-Protokoll im PR.

**Phase 5:** 3 Mortgage-Engines mit Vektoren · Payment Stack + Risikopuffer gerendert · Gate-PRs nur bei 10/10-Checkliste · Credit Utilization liefert ausschließlich Bänder (Typ-erzwungen) · alte credit-score-URL 308t.

## 13. QA-Matrix

| Prüfung | Werkzeug/Methode | Wann |
|---|---|---|
| Typen | `npx tsc --noEmit` | jeder PR |
| Unit/Calc | `vitest run` (Suiten des PRs; Calc-Vektoren official/reference/invariant) | jeder PR |
| Client/Server-Importe | `npm run check:imports` (ab 2.1 inkl. `components/tools`) | jeder PR |
| Hydration | `npm run check:hydration` + `test:hydration` | Shell-/Widget-PRs |
| Production Build | lokal + **CI Required Check (ab 0.0)** | jeder PR |
| SSR ohne JS | Playwright default `javaScriptEnabled:false`: H1/Intro/initialer Zustand/Worked Example/Methodik/FAQ/Quellen/Verified-Datum | Tool-Page-PRs |
| Interaktion/Events | Playwright JS-on (`test.use`), route-intercept auf `/api/track` | Tracking-/Widget-PRs |
| SEO-Technik | `npm run check:seo` + e2e: genau 1 Brand-Suffix, self-Canonical, hreflang-Ziele 200, JSON-LD parsebar, Meta-Robots korrekt | Metadata-PRs + Gates |
| Sitemap/Redirects | e2e: 308-Ketten, Sitemap-Inhalte | 0.3/0.6/5.3 |
| Viewports | 1440/1280/1024/390/360: Überlappung, abgeschnittene Zahlen, horizontales Scrollen, CLS (Extremwerte!) | Design-AK je migriertem Tool |
| Tastatur/Fokus | manuell + Playwright-Tab-Order-Spec | Shell-PRs + je Major Tool |
| Screenreader/aria-live | manuelle VoiceOver-Prüfung + Unit-Test der Drossel-Logik | 2.1, je Major Tool |
| Reduced Motion | Emulation `prefers-reduced-motion` | Shell-PRs |
| Kontrast | Token-Kontrastrechnung (inkl. Warning-Set auf BG+Weiß) | High-Fi-Gate + 2.1 |
| Konsole/Netzwerk | `read_console_messages` + failed requests im Preview | je migriertem Tool |
| Broken Links | bestehender Link-Check + Brücken-Manifest-Test | 0.6 + je Gate |
| CWV/Lighthouse | Ziel: A11y ≥ 95, SEO ≥ 95, Best Practices ≥ 95, Mobile-Perf ≥ 90; keine Regression zur Baseline | je Phase, Pilot zuerst |
| Rule-Freshness | `scripts/check-rule-freshness.mjs` (SLAs 8.5) | wöchentlich + vor Releases |

## 14. Risiko-Register

| # | Risiko | W'keit | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | Turbopack-Trap: Client-Widget importiert Server Action | mittel | hoch (Build-Crash) | Guard-Ausweitung in 2.1; Widget→Server nur `fetch` | Sonnet |
| 2 | Hydration-Mismatch beim `ssr:false`-Ausstieg | mittel | hoch | Exemption entfernen; Dates/Rules nur als String-Props; `test:hydration` je Tool | Sonnet + Opus-Review |
| 3 | cockpit_v1-Kontamination | niedrig | sehr hoch | Sibling-Typ, `tool_`-Prefix, eigene `.strict()`-Schemas, Regressions-e2e, GA-Aliase unangetastet | Opus-Review |
| 4 | analytics_events-Volumenexplosion durch input_change | mittel | mittel | Debounce 600 ms, Feld-Cap 40, separater Lever-Cap 10, Buckets, Batch-Gewichtung, Volumen-Kachel, Killswitch | Sonnet |
| 5 | Stichtags-Stale (1.1./6.4./1.7.) auf statischen Seiten | hoch | mittel | zukunftsdatierte RuleEntries, `revalidate 86400`, SLA-Script mit Stichtags-Vorwarnung, `stale-data`-State | Sonnet |
| 6 | SEO-Fehltritt bei De-noindex/Umzug | mittel | hoch | Indexability Gate (10 Kriterien), gold-roi atomar (0.3), Sitemap/Canonical/Redirect aus einer Registry | Opus-Review |
| 7 | Doppelte Inflationsbereinigung, falscher Cap oder zu früh eingerechneter Benefit in Wealth Horizon | niedrig | sehr hoch (YMYL) | Realwert-Modell bindend (8.3), Simple/Account-Vertrag, keine automatische Benefit-Schätzung, offizielle+Reference+Invariant-Vektoren, unabhängiger Opus-Review vor Merge | Fable + Opus |
| 8 | Session-Key-Konsolidierung bricht Same-Session-Joins am Deploy-Tag | sicher (einmalig) | niedrig | vor Baseline-Fenster shippen (1.2), Dashboards annotieren | Sonnet |
| 9 | Bundle-/CWV-Regression durch SSR-Widgets | mittel | mittel | `next/dynamic` mit SSR, pures SVG statt recharts, First-Load-JS-Vergleich je Migration | Sonnet |
| 10 | Design-Drift zwischen den 3 Modi | mittel | mittel | gemeinsamer Rahmen + eine Token-Quelle; State Board + High-Fi-Screens als Abnahme-Artefakte | Fable |
| 11 | Share-Link-Missbrauch/Privacy-Regression | niedrig | hoch | Fragment-only, per-Tool-Allowlist, Buckets, zod+Clamps, sichtbare Vorschau | Opus-Review |
| 12 | CI-Lücke lässt kaputten Build durch | niedrig (nach 0.0) | hoch | PR 0.0 Required Check; lokales Build bleibt Vorab-Gate | Sonnet |
| 13 | Broker aus falschem Markt empfohlen / falsche Regulierungs- oder Kostenannahme | mittel | hoch | `availableMarkets`, validierter Marktparameter, marktgefilterte Fixtures, Journey-e2e für alle 4 Märkte, parameterloser Canonical | Fable + Sonnet |

## 15. In-Scope / Out-of-Scope

**In-Scope:** Tool-Registry + alle 5 Konsumenten · Phase-0-SEO-/Daten-Fixes · tool_v1 + Dashboard-Tab · ToolShell mit 3 Modi + Financial-Field-Familie · Pilot Money Leak + Debt Payoff · Decision Launcher Hub mit ehrlicher Marktverfügbarkeit · Broker Journey (Shared State + marktgefilterte globale Routen) · Wealth Horizon v1 (4 Märkte, deterministisch; Simple/Account-Modus; nutzereingegebener Benefit) · Home Decision Lab (3 Märkte) · Supporting-Migrationen inkl. Credit-Utilization-Umbau · Indexability-Gate-PRs · Lo-Fi/Prototypen/State-Board/High-Fi-Artefakte.

**Out-of-Scope (v1):** Monte Carlo (nur typisierter `bands?`-Slot) · Accounts, Login, E-Mail-Zwang vor Mehrwert · Decision Passport (Phase 6, gesonderte Freigabe) · neue Rechner rein zur Keyword-Abdeckung, insbesondere kein fachlich unvorbereiteter US-Home-Rechner nur für ein symmetrisches Hub-Raster · automatische Schätzung von Social Security/State Pension/CPP-OAS/Age Pension · jegliche Änderung an cockpit_v1/Cockpit-UI · DB-Migrationen · Microsites · Query-Param-Share-Links (der nicht-sensitive Broker-Marktparameter ist kein Share-Payload) · Nominalwert-Anzeigen in Wealth Horizon · Affiliate-Postback-Integration (eigenes Vorhaben; Dashboard zeigt nur „pending"-Kacheln) · automatische „Popular"-Badges vor Mindeststichprobe.

## 16. Dokumentations-Drift (Korrektur-Empfehlung, eigener Mini-PR)

| Dokument | Behauptung | Realität | Korrektur |
|---|---|---|---|
| `CLAUDE.md` | „Tailwind CSS v4 … Konfiguration in `tailwind.css`, KEINE tailwind.config.js" | **v3.4.19**, `tailwind.config.ts`, `@tailwind`-Direktiven in `app/globals.css` | Tech-Stack-Tabelle + Fallstricke-Zeile berichtigen |
| `CLAUDE.md` | „Interaktive Tools: 9" | 20 Routen / 17 Konzepte (nach Phase 4: 24 Routen) | Zahl durch Verweis auf Registry ersetzen |
| Homepage `PlatformStats` | „9 Interactive Tools" (Default) | s. o. | `totalTools={countLiveTools()}` (PR 0.6) |
| `components/ui/answer-block.tsx` | Kommentar „Linked to FAQPage Schema" | emittiert kein JSON-LD | Kommentar fixen bzw. Schema via `ToolJsonLd` real machen (0.7) |
| Cron-/Routen-Zahlen in CLAUDE.md vs. `memory/generated/` | 19/23 Crons uneinheitlich | `npm run refresh:agent-context` ist Quelle | im selben Mini-PR aktualisieren |

---

*Ende der Spezifikation. Nächste Schritte nach Freigabe: Foundation Implementation Plan (Phase 0/1, Sonnet nach Fable-Brief) parallel zum Design-Track (Lo-Fi → interaktive Prototypen → State Board → High-Fi ×5 → visuelle Freigabe).*
