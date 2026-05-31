# SmartFinPro Research — `/research`-Sektion + AEM-Pilot (Design-Spec)

> **Typ:** Neue Public-Sektion + Content-Pilot (1 Note) · Design-Spec, build-ready für Claude Code.
> **Status:** Spezifiziert · **noch nicht gebaut, kein PR/Deploy.**
> **Entscheidungen (Owner, 31.05.2026):** Jurisdiktion **US + English-Canada** · Hosting **`smartfinpro.com/research`** (SEO-Synergie, kein separates Ring-Fencing) · Marke **„SmartFinPro Research"**.
> **Approved-Content-Quelle:** Der bereinigte Entwurf `AEM_Research_Note_Web_v2.html` (SmartFinPro-Research-Branding, `fr@smartfinpro.com`, Freshness-/Konsens-Framing, entschärfte Positions-/Stop-Sprache) ist die **kanonische Compliance- & Copy-Vorlage**.

---

## 1. Ziel

Eine eigenständige, **organisch indexierbare Research-Sektion** unter `smartfinpro.com/research`, die hochwertige Einzelwert-Analysen (Start: Gold-Miner) als **zweistufigen Funnel** ausspielt: freie indexierte Seite (Traffic + AEO) → gegatetes PDF (Lead) → Broker-CTA (CPA). Der **AEM-Pilot** ist die erste Note und dient als **replizierbares Template** für den Gold-Miner-Cluster.

**Erfolgskriterium Pilot:** `/research/gold-mining/agnico-eagle-aem` ist live, indexierbar, compliant geframt, mit funktionierendem E-Mail-Gate (PDF-Versand via Resend) und Broker-CTA über `/go/` — und die erste echte Lead-Capture + der erste Broker-Klick sind im Dashboard messbar.

## 2. Strategische Einordnung (v6)

- **Brückenkopf-Speerspitze:** Gold-Miner-Research verstärkt den Gold-Beachhead (vgl. SGB-Pilot) und monetarisiert ihn zusätzlich über **Broker-CPA** (IBKR $200 / Questrade) statt nur Bullion-RevShare.
- **Bedient drei v6-Hebel:** Original-Daten-Burggraben (4), eigenes Publikum/E-Mail (5), AEO-Zitierbarkeit (3).
- **Sequencing-Hinweis:** Parallel zur Monetarisierungs-Verdrahtung (erste Conversion) — **nicht** als Ersatz dafür. Der Broker-CTA verdient nur mit aktiven Affiliate-Slugs (siehe §9, Owner-Dependency).
- **Traffic-Realismus:** Eine einzelne `/research`-URL wird nicht „durch die Decke“ gehen. Der Hebel entsteht durch **Cluster-Bau + interne Link-Verteilung**: AEM als Pilot, dann 5–7 verwandte Gold-Miner/ETF-/„best brokers for gold stocks"-Seiten und prominente Links aus bestehenden Gold-/Trading-/Canada-Gold-Hubs.
- **Google-Stand Mai 2026:** FAQ-Rich-Results sind laut Google seit **07.05.2026** nicht mehr in Search sichtbar. FAQ bleibt als UX-/AEO-Baustein sinnvoll, ist aber **kein primärer Traffic-Hebel** mehr.
- **AEO/GEO-Priorität:** Laut Googles offizieller Generative-AI-Search-Guidance sind **nicht** `llms.txt`, „Chunking" oder Spezial-Markup der Hebel, sondern **nicht-kommoditärer Content**, klare technische Struktur, Crawlbarkeit und gute interne Distribution.

## 3. Architektur-Entscheidungen

| Entscheidung | Festlegung | Begründung |
|---|---|---|
| **Content-Pfad** | `content/research-notes/[sector]/[slug].md(x)` | ⚠️ **NICHT** `content/research/` — das ist der **Genesis-Hub-Input-Ordner** (Research-Briefs, siehe dessen README). Kollision vermeiden. |
| **Route** | `app/(marketing)/research/[sector]/[slug]/page.tsx` (+ Sektions-Index `app/(marketing)/research/page.tsx`) | Neue Public-Sektion neben `about`, `tools`, `downloads`. |
| **Loader-Modell** | Dedizierter `lib/research/*`-Loader, gespiegelt an `lib/mdx/*` | Bestehende MDX-Loader sind auf `content/{market}/{category}` und `Market`/`Category` getrimmt; Research sauber separat halten statt diese Typen aufzubrechen. |
| **Markt-Modell** | EN-first, **eine kanonische URL** in Phase 1 | Start mit generischem `en` + `x-default`. `en-US`/`en-CA` erst, wenn echte Regionalvarianten existieren (z. B. Broker-Set, Pricing, juristische Copy). |
| **Layout** | Neues `ResearchLayout` (separat von `report-layout.tsx`) | Research ≠ Affiliate-Review: andere Compliance, kein AggregateRating, andere CTA-Semantik. |
| **Schema.org** | `ArticleSchema` + `BreadcrumbSchema` primär; FAQ optional | **Kein** `ReviewSchema`/`AggregateRating`/`FinancialProductSchema` für Einzelaktien. FAQ nur als sekundärer Helfer, nicht als Rich-Result-Wette. |
| **Lead-Magnet** | Freie Seite indexiert; **4-seitiges PDF gegatet** (E-Mail), PDF `noindex` | Gated-Content rankt nicht → die freie Seite erzeugt Traffic, das PDF konvertiert zu Leads. Für den Piloten möglichst viel bestehende Opt-in-Infrastruktur wiederverwenden. |
| **Branding** | „SmartFinPro Research" als Sub-Brand der Hauptdomain | Owner-Entscheidung SEO-Synergie. Trade-off (kein Domain-Ring-Fencing) bewusst akzeptiert → Disclaimer tragen die Last (§8). |

## 4. URL- & Routing-Schema

```
/research                                  → Sektions-Hub (Liste, „How we research"-Link)
/research/gold-mining                      → Sektor-Index (Cluster)
/research/gold-mining/agnico-eagle-aem     → AEM-Pilot (die erste Note)
```
- Canonical = self.
- Phase 1: `hreflang="en"` + `x-default` auf dieselbe URL.
- Phase 2: `en-US` + `en-CA` **nur** mit separaten regionalen Alternates.
- Achtung: `lib/seo/hreflang.ts` geht aktuell von `/{market}`-Präfixen aus; für `/research` entweder schlank erweitern oder einen research-spezifischen Alternates-Helper ergänzen.
- In `app/sitemap.ts` aufnehmen (Priorität analog Pillar-Seiten); in `app/robots.ts` crawlbar (AI-Crawler bereits erlaubt).

## 5. MDX-Frontmatter (neuer Typ `research`)

```yaml
---
type: "research"
title: "Agnico Eagle Mines (AEM): Gold-Miner-Analyse 2026"
description: "..."
ticker: "AEM"
exchanges: ["NYSE", "TSX"]
sector: "gold-mining"
slug: "agnico-eagle-aem"
markets: ["us", "ca"]            # EN, US+CA
author: "..."                     # echter Autor + Credentials (E-E-A-T, MAR-konform)
rating_source: "consensus"        # NIE „eigene Empfehlung"
rating_label: "BUY (Analyst Consensus, 14 analysts)"
price_target_usd: 256
price_target_cad: 354
as_of: "2026-05-28"               # Pflicht — sichtbar
next_review: "2026-08-01"         # Pflicht — Freshness-Cron
data_sources: ["Finviz", "SEC Filings", "Public Aggregation"]   # KEIN Bloomberg (Lizenz)
brokers: ["interactive-brokers", "questrade-ca"]   # /go/-Slugs (müssen aktiv sein!)
gated_pdf: "/research-pdf/agnico-eagle-aem.pdf"     # noindex, via E-Mail ausgeliefert
faqs: [...]                        # für FAQ-Sektion / optionales Markup
hasInvestmentContent: true         # triggert Compliance-Banner im Layout
---
```

## 6. Komponenten (neu + Wiederverwendung)

**Neu:**
- `ResearchLayout` (`components/research/research-layout.tsx`) — orchestriert Banner, Daten-Tabellen, Zonen, Szenarien, CTA, Freshness.
- `ResearchComplianceBanner` — Top-Banner + voller Disclaimer-Block (Copy aus v2, zentral, **nicht** pro MDX).
- `ResearchLeadGate` — möglichst als dünner Wrapper um bestehende Newsletter-/Subscribe-Infrastruktur; nur dann eigene UI/Logik, wenn PDF-Mail + `createLead()` + Tracking in einem Schritt nötig sind.
- `BrokerCtaCards` — IBKR/Questrade-Karten über `/go/[slug]` + Konflikt-Disclosure.
- `FreshnessBanner` — rendert `as_of`/`next_review` + „Data may be stale after review date".

**Wiederverwenden:**
- `RiskWarningBox` (`components/marketing/risk-warning.tsx`), `AffiliateDisclosure` (`components/ui/affiliate-disclosure.tsx`).
- `serializeMDX` (`lib/mdx/serialize.ts`) — **nie** `serialize()` direkt.
- Schema: `ArticleSchema`, `BreadcrumbSchema` (`components/seo`), `FAQSchema` nur optional.
- Lead: `components/marketing/newsletter-optin.tsx`, `lib/newsletter-client.ts`, `app/api/subscribe/route.ts`, `lib/actions/newsletter.ts` (`subscribeWithEmail`), `lib/actions/leads.ts` (`createLead`); Resend-Versand.
- `/go/[slug]`-Handler (`app/(marketing)/go/[slug]/route.ts`) für Broker-CTAs.
- Gated-Download-Muster: `app/(marketing)/downloads/ai-finance-workflow/page.tsx` als Referenz.

**Design-Constraints (CLAUDE.md):** Tailwind v4, CSS-Variablen (kein Hex), helles Trust-Design, **kein** Glassmorphism, Server Components default (`'use client'` nur fürs Lead-Formular).

## 7. Lead-Magnet-Mechanik (zweistufig)

1. **Freie Seite** (`/research/.../aem`) — vollständige Analyse-Zusammenfassung, **indexiert**, AEO-optimiert.
2. **E-Mail-Gate** „Get the full 4-page PDF" → Opt-in (CASL-konform: Consent, Unsubscribe, max 2/Woche) → Resend versendet PDF-Link.
3. **PDF** unter nicht-indexierbarem Pfad (`/research-pdf/...`, `noindex`, nicht in Sitemap, nicht intern verlinkt außer per E-Mail).
4. **Broker-CTA** auf der freien Seite + im PDF → `/go/interactive-brokers`, `/go/questrade-ca`.

PDF-Erzeugung Pilot: vorab generiertes statisches PDF (HTML→PDF, z. B. via Chrome-Headless) — kein On-Demand-Render nötig.

## 8. Compliance-Anforderungen (US + English-Canada)

Copy = kanonisch aus `AEM_Research_Note_Web_v2.html`, **zentral im Layout** (nicht pro MDX duplizieren):
- **Top-Banner:** „General financial information only — not personalized investment advice (OSC NI 31-103 §8.25)."
- **Voller Disclaimer:** §8.25 general-advice-Exemption, nicht registriert, keine Kauf-/Verkaufsempfehlung, „past performance", „risk of loss", „consult a registered advisor".
- **US-Reader-Block:** kein FINRA-2241-Report, kein FINRA-Member/SEC-RIA, Commentary-Framing, Advisers Act 1940.
- **Konflikt-Offenlegung** an jedem Broker-CTA (Affiliate-Vergütung; „not a recommendation to choose any specific broker").
- **Nicht-tailored-Disziplin:** „Analyst Consensus: BUY" (attribuiert), **keine** Positionsgrößen-/Stop-Loss-**Anweisungen** — nur deskriptive Beobachtungen.
- **Quebec/Loi 96:** FR-Hinweis + „Version française en développement (Q3 2026)" + `fr@smartfinpro.com`.
- **Freshness:** `as_of` + `next_review` sichtbar; „verify before acting".
- **Quellen-Hygiene:** `data_sources` ohne **Bloomberg** (Lizenz). ⚠️ **Letzter Copy-Fix:** Tabellen-Header in v2 sagt noch „Finviz / **Bloomberg**" → auf „Finviz / Public Aggregation" ändern.

## 9. Monetarisierung & Owner-Dependency

- Broker-CTA verdient nur mit **aktiven** Slugs: `interactive-brokers` (in DB aktiv, $200) + `questrade-ca` (⚠️ in DB aktuell `dead`/inaktiv → **operativ aktivieren**: echte Affiliate-URL + `active=true`; `ALLOWED_HOSTS` in `go/[slug]/route.ts` ergänzen, vgl. Wave-1-Branch).
- Postback je Netzwerk wie im SGB-Pilot.

## 10. Umsetzung in Slices (für Claude Code)

| Slice | Inhalt | Verifikation |
|---|---|---|
| **1** | Minimal lauffähiger Detail-Path `(/research/[sector]/[slug])`, `ResearchLayout` + `ResearchComplianceBanner` + `FreshnessBanner`, AEM-MDX (Copy aus v2, Bloomberg-Fix) | Seite rendert lokal, Disclaimer sichtbar, `as_of`/`next_review` sichtbar |
| **2** | Minimaler `/research`-Hub + `/research/gold-mining`-Index + **interne Links aus bestehenden Gold-/Trading-/CA-Gold-Seiten** | AEM ist in Navigation/Content erreichbar; erste echte interne Link-Signale stehen |
| **3** | `ResearchLeadGate` + Resend-PDF-Versand; PDF `noindex` | Test-Opt-in → Lead in `leads`/`subscribers`, E-Mail mit PDF-Link kommt an |
| **4** | `BrokerCtaCards` über `/go/`; `questrade-ca` aktivieren (operativ) | `/go/interactive-brokers` + `/go/questrade-ca` → 302 zum Partner, Klick in `link_clicks` |
| **5** | `ArticleSchema` + `BreadcrumbSchema`, optionale FAQ-Auszeichnung, Sitemap, internes Linking zu `methodology`/`integrity`/relevanten Gold-Hubs | `"@type":"Article"`/`BreadcrumbList` im Quelltext; Sitemap enthält URLs |
| **6** | `freshness-check`-Cron erweitern: Alert + Stale-Banner bei `next_review` < heute | Cron-Lauf flaggt Note nach Review-Datum |

## 11. Verifikation (Pilot, end-to-end)

1. `/research/gold-mining/agnico-eagle-aem` lädt, indexierbar (kein `noindex`), Compliance-Banner + Disclaimer sichtbar.
2. E-Mail-Gate: Opt-in → Lead persistiert + PDF-Mail via Resend.
3. Broker-CTA: `/go/`-Klick → 302 zum Partner (nicht Fallback) → `link_clicks`-Row.
4. Schema: Article + Breadcrumb valide; optionale FAQ-Auszeichnung nur als Zusatz, **kein** AggregateRating.
5. Hreflang-Phase korrekt: anfangs `en` + `x-default`; regionale Alternates erst mit echten Varianten.
6. AEM erhält interne Links aus bestehenden Gold-/Trading-/CA-Gold-Assets.
7. Freshness-Banner + Cron-Alert nach `next_review`.

## 12. Non-Goals

- **Kein** UK/EU/AU-Rollout (Jurisdiktion bewusst US+EN-CA).
- **Kein** Massen-Rollout — nur AEM als Template; weitere Gold-Miner danach.
- **Kein** `ReviewSchema`/`AggregateRating`/`FinancialProductSchema` für Einzelaktien.
- **Keine** personalisierte Beratung; keine Positionsgrößen-/Stop-Loss-Anweisungen.
- **Kein** Bloomberg-Daten-Republishing; nur lizenzklare Quellen.
- **Kein** `llms.txt`-Scope im Piloten. Kein Go-Live-Blocker und laut Google kein spezieller Hebel für generative Search.
- **Nicht** `content/research/` anfassen (Genesis-Input-Ordner).
- **Kein** Genesis-Pipeline-Umbau.

## 13. Risiken / Rollback

| Risiko | Mitigation |
|---|---|
| Securities-Compliance (US+CA) | §8.25-Framing + Disclaimer zentral; **anwaltliche Absegnung vor Skalierung** (Owner) |
| Quebec/Loi 96 unvollständig | EN + FR-Hinweis + Q3-2026-Ziel; bei Bedarf QC-Targeting |
| Daten-Lizenz/-Fehler | lizenzklare Quellen + Faktencheck jeder Zahl; `as_of` sichtbar |
| Toter Broker-CTA | `questrade-ca` vor Go-Live aktivieren; sonst nur IBKR |
| Verfall/irreführend | `next_review` + Stale-Banner + Cron-Alert |
| Rollback | Sektion ist additiv → Route/Sitemap-Eintrag entfernen; keine Bestandsdaten betroffen |

## 14. Offene Entscheidungen für den Owner

- **Anwaltliche Bestätigung** (kanadischer Securities-Lawyer + US-Sicht) der §8.25-/Commentary-Exemption-Reliance bei Affiliate-Monetarisierung — vor Skalierung über den Piloten hinaus.
- **Lizenzklare Datenquelle** final festlegen (SEC-Filings + erlaubte API: Finnhub/FMP/Alpha Vantage), Bloomberg ersetzen.
- **PDF-Pipeline:** statisch vorab generiert (Pilot) vs. später automatisiert.
- **Nächste 5 Gold-Miner** für den Cluster (z. B. Newmont, Barrick, Kinross, Wheaton, Franco-Nevada).
