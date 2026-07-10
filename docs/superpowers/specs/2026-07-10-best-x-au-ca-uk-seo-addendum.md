# AU/CA/UK Best-X Cockpits — Professional SEO Addendum

> Stand: 2026-07-10. Ergänzt den Rollout-Plan "AU/CA/UK Best-X Produktcockpits" und die Shortlist `docs/superpowers/specs/2026-07-10-best-x-au-ca-uk-country-shortlist.md`.
> Gilt verbindlich für alle 26 neuen AU/CA/UK Cockpit-Seiten, deren Homepage-Kacheln, SEO-Metadaten, JSON-LD, Sitemap-/llms.txt-Einträge und Post-Deploy-Smokes.

## Zweck

Der technische Rollout-Plan ist tragfähig, aber "professionelles SEO" darf nicht nur aus Titel/Description-Längen bestehen. Für YMYL-Finanzvergleiche braucht jeder Slice zusätzlich einen prüfbaren SEO-Workflow:

- Suchintention und lokaler SERP-Wortlaut pro Markt vor dem Schreiben festlegen.
- Canonical, hreflang, Sitemap, llms.txt und JSON-LD als harte Gates behandeln.
- E-E-A-T sichtbar machen: Methode, Quellen, Regulatorik, Autor/Reviewer, Aktualitätsdatum, Risikohinweise.
- Keine Winner-, Kosten-, APY-, Spread- oder Regulator-Claims ohne belegte Quelle.
- Interne Link-Silos stärken, ohne Keyword-Stuffing oder künstliche Anchor-Texte.

Dieses Addendum ist ein Launch-Gate: Ein Slice darf nicht gemerged/deployed werden, wenn die unten genannten Muss-Kriterien nicht erfüllt oder als explizite, begründete Ausnahme dokumentiert sind.

## 1. Keyword- und Intent-Mapping

Vor jeder TopicConfig und Seed-Migration wird eine kurze SEO-Matrix im Slice-Plan oder in der Quellenmatrix ergänzt.

Pflichtfelder je Topic:

| Feld | Muss-Regel |
|---|---|
| Primary query | Lokaler Marktbegriff, z. B. `best business bank accounts australia`, `best cash isa uk`, `best robo advisors canada`. |
| Secondary queries | 5-10 Varianten inkl. lokaler Terminologie: AER/APY, TFSA/RRSP, superannuation, remortgage, FCS/CDIC/FSCS. |
| Intent type | Compare / choose / cost / safety / regulator / review. |
| SERP expectation | Was muss in den ersten 600 sichtbaren Wörtern beantwortet sein: Top-Pick, Kosten, Schutzgrenze, Risiko, Auswahlkriterien. |
| Local wording | UK: AER, Stocks & Shares ISA, FCA/FSCS/PRA. CA: CIRO/CIPF/CDIC, TFSA/RRSP/FHSA. AU: APRA/ASIC/FCS, super balance, p.a. |
| Non-goals | Begriffe, die bewusst nicht optimiert werden, z. B. "free money", "guaranteed returns", "best guaranteed CFD broker". |

Die `metaTitle`, `h1`, `intro`, `verdict`, `methodology`, `buyerGuide` und FAQ müssen aus dieser Matrix ableitbar sein.

## 2. URL- und Slug-Mapping

Die Country-Shortlist nutzt recherchenahe Slugs wie `forex/best-forex-brokers-uk`; der Rollout-Plan nutzt normalisierte Cockpit-Slugs wie `uk:forex/forex-brokers`. Diese Normalisierung ist korrekt, weil sie Hreflang-Cluster ermöglicht, muss aber pro Slice explizit dokumentiert werden.

Pflicht:

| Shortlist-Slug | Canonical Cockpit-Key | Grund |
|---|---|---|
| `business-banking/best-business-bank-accounts-uk` | `uk:business-banking/business-bank-accounts` | Gemeinsamer Cluster mit US/CA/AU. |
| `forex/best-forex-brokers` | `ca:forex/forex-brokers` | Marktpräfix statt Land im Topic-Slug. |
| `savings/best-high-interest-savings-accounts` | `au:savings/savings-accounts` | Einheitliche Savings-Cockpit-Struktur. |

Jeder Slice-Plan enthält die vollständige Mapping-Zeile für seine Topics. Seeds, Registry, Manifest, sitemap, llms.txt und Curl-Smokes müssen denselben Canonical Cockpit-Key verwenden. Keine parallelen URLs für dieselbe Seite anlegen.

## 3. Title, Description und Heading Gate

Für jede neue Cockpit-Seite:

- Genau ein H1, erzeugt durch `CockpitHero`; kein zusätzliches MDX- oder Component-H1.
- `config.h1(year)` nennt Markt/Land, wenn der Slug mit anderen Märkten geteilt wird.
- Gerenderter Browser-Title inklusive Root-Template-Suffix ` | SmartFinPro`: Ziel 45-60 Zeichen. Wenn ein einzelner lokaler Pflichtbegriff das unmöglich macht, Ausnahme mit Ist-Länge dokumentieren.
- `metaDescription(year)`: Ziel 140-160 Zeichen; enthält Thema, Markt, wichtigsten Auswahlfaktor und Neutralitäts-/Methodenhinweis.
- Keine harten tagesaktuellen Preis-/Rate-Versprechen in Title/Description, wenn die Zahl volatil ist. APY/AER/Spread/Goldpreis gehören in Page Body + `data_verified_at`, nicht in dauerhaftes Meta, außer die Zahl wird im Slice bewusst täglich/frequent aktualisiert.
- H2/H3-Hierarchie: `Expert Reviews & Ratings`, `Best-X Compare`, `How we test`, Buyer's-Guide-H3s, FAQ. Kein H3 ohne vorheriges H2.

Beispielrichtung:

- Gut: `Best Business Bank Accounts in Australia (2026)`
- Gut: `Compare Australian business bank accounts by monthly fee, APRA/FCS protection, international payments and tools. Independent SmartFinPro data, verified July 2026.`
- Schlecht: `Best #1 Cheapest Free Australian Business Bank Account With Guaranteed Approval`

## 4. YMYL/E-E-A-T Gate

Jede Seite braucht sichtbare, belegte Vertrauenssignale:

- Reviewer/Expert sichtbar via bestehendem `getMarketExpert`-Pfad; wenn nur "SmartFinPro Team" verfügbar ist, im Slice-Report als E-E-A-T-Polish-Follow-up dokumentieren.
- `methodology` erklärt Datenquellen, Auswahlkriterien, Scoring, Affiliate-Unabhängigkeit und Aktualisierungsrhythmus.
- Jede `buyerGuide`-Sektion beantwortet eine echte Entscheidungsfrage, nicht nur Keyword-Varianten.
- FAQ mindestens 5 Fragen; davon mindestens:
  - 1 regulatorische Sicherheit/Schutzgrenze,
  - 1 Kosten-/Gebührenfrage,
  - 1 Risiko-/Einschränkungsfrage,
  - 1 "who is this best for"-Frage,
  - 1 Aktualitäts-/Datenfrage.
- `compliance.notice` wird gepflegt; bei Hochrisiko-Themen muss der Notice sichtbar gerendert oder ein eigener Implementation-Task dafür im Slice enthalten sein.

Regulatorische Spezialregeln:

- UK Deposits/Savings/Business Banking: FSCS-Deposit-Limit nicht pauschal mit alter `GBP 85k`-Logik übernehmen. Für Bankeinlagen gilt seit 2025-12-01 als Arbeitsannahme `GBP 120k`; Investment-/Brokerage-Schutz separat prüfen.
- UK Investing/Trading/CFD: FCA/FSCS/PRA nicht vermischen. Investment-Schutz, Bankeinlagenschutz und E-Money-Safeguarding getrennt ausweisen.
- CA Investing/Forex: CIRO/CIPF; CA Deposits/Business Banking: CDIC. Nicht mischen.
- AU Banking/Savings: APRA/FCS; AU Trading/Forex/CFD: ASIC; AU Superannuation: APRA plus FOFA-Hard-Stop für spätere Monetarisierung.
- Bullion/Gold: Keine erfundene Securities-Regulator-Abdeckung. Akkreditierung, Mint-/Vault-/LBMA-/AUSTRAC-/OSC-Kontext sauber voneinander trennen.

## 5. Structured Data Gate

Jede Seite muss parsebares JSON-LD enthalten:

- `BreadcrumbList`
- `ItemList` / Vergleichsliste mit allen gerenderten Anbietern
- `FAQPage`
- `Article`
- `Person`

Regeln:

- Keine doppelten FAQ- oder Person-Schemas aus Child-Komponenten.
- `dateModified` darf nie vor `datePublished` liegen.
- `reviewedBy` muss dem sichtbaren Reviewer entsprechen.
- Keine `AggregateRating` pro Anbieter, solange Ratings aus unterschiedlichen Quellen, redaktioneller Bewertung oder Review-Reuse stammen.
- Anbieter-URLs im Schema folgen dem CTA-Gate: `/go` nur bei `offer`; sonst existierende Review-URL oder offizielle `external_url`.
- Structured data muss mit einem lokalen JSON-Parse-Smoke und nach Deploy mit Google Rich Results / Schema Validator stichprobenartig geprüft werden.

Orientierung: Google Search Central zu Structured Data, Product Snippets, hilfreichem Content, Canonicals und lokalisierten Versionen ist die primäre Referenz.

## 6. Canonical, Hreflang und Sitemap Gate

Pflicht pro neuer Route:

- Self-canonical auf die finale URL `https://smartfinpro.com/{market}/{category}/best/{topic}`.
- Hreflang nur für Märkte, in denen dieselbe `category/topic`-Kombination live ist.
- Hreflang reziprok: Wenn UK auf CA verweist, muss CA nach Deploy auch auf UK verweisen.
- `x-default` korrekt nach bestehendem `generateAlternates`-Verhalten.
- Neue URLs erscheinen in `/sitemap.xml` nach Deploy.
- Interne Links verwenden immer canonical URLs, nicht Shortlist-/Legacy-/redirectende Varianten.
- Keine URL-Fragmente als canonical.

Slice-Smoke:

```bash
curl -sS https://smartfinpro.com/sitemap.xml | rg '/(uk|ca|au)/.*/best/'
curl -sS https://smartfinpro.com/{market}/{category}/best/{topic} | rg 'canonical|alternate|application/ld\\+json'
```

## 7. Internal-Link-Silo Gate

Ziel pro Cockpit-Seite: mindestens 8 sinnvolle interne Links, wenn inhaltlich möglich.

Pflichtquellen:

- Markt-Homepage `/{market}` über Best-X-Kachel.
- Kategorie-Pillar `/{market}/{category}`.
- Verwandte Best-X Cockpits im selben Markt über `RelatedComparisons`.
- Existierende Anbieter-Reviews, nur wenn MDX existiert.
- Relevante Tools/Calculators im selben Markt.
- Methodology/Integrity/Affiliate Disclosure.

Anchor-Regeln:

- Natürlich und spezifisch: `compare UK business bank accounts`, `TFSA/RRSP calculator`, `how we review financial products`.
- Keine wiederholten Exact-Match-Anker.
- Keine Links auf nicht existente Reviews.
- Bei neuen Country-Slices `rg` gegen `content/` und `app/` ausführen, um passende Pillar-/Tool-Links zu finden.

## 8. External Authority-Link Gate

Ziel pro Seite: mindestens 6 hochwertige externe Autoritätsquellen in sichtbarem Content oder Quellen-/Detailtext, wenn inhaltlich möglich.

Priorität:

1. Regulatoren und offizielle Register: FCA, PRA, FSCS, CIRO, CIPF, CDIC, ASIC, APRA, AUSTRAC.
2. Offizielle Anbieter-Preis-/Fee-/Disclosure-Seiten.
3. Offizielle Schutzgrenzen/Disclosure-Seiten.
4. Seriöse Trust-/Review-Quellen nur ergänzend, nie als alleinige Grundlage für regulatorische Claims.

Regeln:

- Jeder externe Link muss die konkrete Aussage stützen, nicht nur allgemein auf eine Homepage zeigen.
- Volatile Werte wie APY/AER/Spreads/fees erhalten `data_verified_at` und werden im Text als variabel bezeichnet.
- Kein Link auf Affiliate-, Redirect-, Coupon- oder unklare Tracking-URLs als Quelle.

## 9. llms.txt, AI Overview und Snippet Gate

Jeder neue live gerankte Topic erhält einen Eintrag in `app/llms.txt/route.ts`.

Format:

- Marktgruppe oder "Comparison Cockpits — Best X (UK/CA/AU)" ergänzen.
- Ein Satz mit Thema, wichtigsten Vergleichsdimensionen, lokalen Regulatoren und Editor-Picks.
- Keine Winner-Picks bei Soft-live oder nicht belegter Ranked-live-Seite.
- Keine `/go`-URLs in llms.txt.

Snippet-Regeln:

- Die ersten 600 sichtbaren Wörter müssen die Frage "Which provider should I choose and why?" beantworten.
- Top-3-Picks mit kurzer Begründung nur bei Ranked-live.
- Soft-live: neutraler Vergleich ohne Winner-Claim.

## 10. Image, OG und Visual Search Gate

Für jede Manifest-Kachel und Hero:

- Bilddatei existiert unter `public/`.
- `alt` beschreibt Thema und Markt, nicht nur "comparison image".
- OG-Image route liefert 200.
- Keine falschen Winner-/Top-Pick-Zeilen im OG-Bild bei Soft-live.
- Platzhalterbilder nur, wenn im Slice-Report als "temporary editorial placeholder" dokumentiert und visuell geprüft.

## 11. Cost/Label SEO Consistency

Der Cost-Calculator ist Teil der SEO-Antwort. Labels dürfen keine falschen Fachclaims erzeugen.

Pflichtkorrekturen im Plumbing-PR:

- `fee-on-amount` darf nicht als `N-yr cost` gerendert werden. Label muss thematisch stimmen, z. B. `Cost on volume`, `Estimated broker fee`, `Spread cost` oder ein zentraler `formatCostLabel(config.costModel, inputs)`-Helper.
- `monthly-plus-setup` bleibt `N-mo cost`.
- `banking@0` ist nur Plan-Shorthand. In Code/Config immer `kind: 'banking'` und Seed-Werte wie `monthly_fee=0`; Vergleichssignal liegt dann in SpecColumns, nicht im Kosten-Sieger.
- Market-Währung kommt aus `formatMoney(n, market)`; keine lokalen `$`-Helper in Client-Komponenten für internationale Seiten.

## 12. Verification Checklist Pro Slice

Jeder Slice-Report enthält diese Tabelle:

| Metrik | Ziel | Ist | Status |
|---|---:|---:|---|
| Canonical self-referential | ja |  |  |
| Hreflang nur Live-Märkte | ja |  |  |
| Sitemap enthält URL | ja |  |  |
| llms.txt aktualisiert | ja |  |  |
| Title-Länge gerendert | 45-60 |  |  |
| Description-Länge | 140-160 |  |  |
| H1-Anzahl | 1 |  |  |
| FAQ-Fragen | >=5 |  |  |
| Interne Links | >=8 wenn möglich |  |  |
| Externe Autoritätslinks | >=6 wenn möglich |  |  |
| JSON-LD parsebar | ja |  |  |
| `dateModified >= datePublished` | ja |  |  |
| Provider-Rows validieren gegen Zod | 7/7 |  |  |
| Keine `[cockpit] excluding row` Logs | 0 |  |  |
| OG route 200 | ja |  |  |
| Top-Pick nur bei Ranked-live | ja |  |  |

Pflichtbefehle lokal vor Merge:

```bash
npx tsc --noEmit
npx vitest run
npm run check:imports
npm run check:comparison
npm run check:seo
npm run build
```

Zusätzlich, wenn MDX geändert wurde:

```bash
npm run check:mdx
npm run check:frontmatter
```

Post-Deploy:

```bash
curl -sS -I https://smartfinpro.com/{market}/{category}/best/{topic}
curl -sS https://smartfinpro.com/{market}/{category}/best/{topic} | rg 'application/ld\\+json|canonical|alternate|Best-X Compare'
curl -sS https://smartfinpro.com/{market}/{category}/best/{topic}/opengraph-image
curl -sS https://smartfinpro.com/sitemap.xml | rg '/{market}/{category}/best/{topic}'
```

## 13. Search Console and Indexing Follow-up

Nach jedem Deploy:

- Route in `/sitemap.xml` prüfen.
- GSC URL Inspection für mindestens eine neue Seite je Slice ausführen.
- Sitemap-Resubmit nur bei größerem Batch oder wenn GSC die neuen Routen nicht erkennt.
- Nach 7 und 28 Tagen prüfen: impressions, queries, average position, indexed/not indexed, canonical selected by Google.
- Auffällige Query-Mismatches in den nächsten Content-Polish einplanen, nicht im Launch-Slice überoptimieren.

## 14. Slice-Stop Conditions

Nicht mergen/deployen, wenn eines davon zutrifft:

- TopicConfig-Key, Seed-Key und Manifest-Key weichen voneinander ab.
- `getTopicConfig(category, topic, market)` fehlt an einer Server- oder Client-Call-Site für Marktseiten.
- UK/CA/AU-Seite rendert US-Währung, US-Regulatoren oder US-Title.
- Hreflang zeigt auf nicht live verfügbare Märkte.
- JSON-LD enthält tote interne Review-URLs.
- Winner-/Top-Pick-Claims existieren ohne belegte Ranked-live-Daten.
- `external_url` fehlt für Visit-only-Anbieter.
- Compliance-sensitive Kategorie hat keinen sichtbaren Risiko-/Regulator-Kontext.

## Referenzen

- SmartFinPro Master-Spec: `docs/superpowers/specs/2026-06-28-comparison-cockpit-design.md`, insbesondere SEO/AEO §10 und Test-Gates §14.
- AGENTS.md Mandatory Review Content Quality Gate.
- Google Search Central: canonicalization, localized versions/hreflang, structured data guidelines, product snippets, helpful people-first content.
