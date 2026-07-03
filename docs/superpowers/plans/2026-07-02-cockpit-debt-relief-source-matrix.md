# Debt-Relief Cockpit — Quellenmatrix (Slice 1)

> Recherche 02.07.2026 (WebSearch/WebFetch, primär offizielle Anbieter-Websites + NerdWallet/Bankrate/Forbes Advisor/ConsumerAffairs/CNBC Select/U.S. News 2026er-Ausgaben). `data_verified_at = 2026-07-02` für alle Zeilen unten, sofern nicht anders vermerkt.
> Kandidatenliste laut Owner-Entscheidung §7.3: Top-8 aus der Shortlist, **Americor gestrichen**, Freedom Debt Relief mit sichtbarem Risikohinweis featuren.
> **Kostenmodell-Hinweis:** `fee_pct_mid` = arithmetischer Mittelwert aus `fee_pct_min`/`fee_pct_max`, wird als `management_fee` (Top-Level-Spalte, generisch wiederverwendet) gespeichert und treibt den `fee-on-amount`-Kostenrechner. AADR = Nachfolgeorganisation der AFCC (seit 2023); UI-Label „AADR (ehem. AFCC)".

## Fable-5-Review-Checkpoint (02.07.2026) — Verdikt: FREIGEGEBEN MIT ÄNDERUNGEN

Vor der Seed-Migration hat ein Fable-5-Review (Model-Routing-Regel des Rollout-Plans) diese Matrix + die geplanten Seed-Werte geprüft. Ergebnis, bereits eingearbeitet in Code + unten stehende Tabellen:

1. **NDR-Migration korrigiert:** NUR `category='debt-relief'`-Fix. **Kein** Wiederherstellen der `?a=smartfinpro`-Referral-URL, **kein** `tracking_status='dashboard_only'`. Begründung: Der Parameter taucht identisch bei 3 unabhängigen Anbietern in derselben Migration auf (Template-Platzhalter, kein belegter echter Referral-Code); die Orphan-Migration (`ON CONFLICT DO NOTHING`) deutet darauf hin, dass die ursprüngliche Migration in prod nie angewendet wurde. `tracking_status` bleibt `unverified` → CTA = `review` (MDX-Review existiert), kein `/go`-Offer bis eine echte Partnerbeziehung extern verifiziert ist.
2. **GreenPath-Bug behoben (kritisch):** `management_fee=0` hätte GreenPath fälschlich zum „niedrigste Gebühr"-Gewinner gemacht UND $0 im Kostenrechner gezeigt (real: ~$1,523 Gesamtkosten). Fix: `is_nonprofit_dmp`-Attribut routet Fee-Spalte/CompareRow auf Infinity/-Infinity-Sentinels (gewinnt nie, ohne Math.min/max der anderen Zeilen zu vergiften); `costModel.flatFeeAccessor` (neu, `lib/comparison/cost.ts`) zeigt den echten Festbetrag statt eines %-Werts. `dmp_flat_total = $35 + $31 × 48 Monate (Mittelwert 36–60) = $1,523`, abgeleitet aus den bereits offiziell belegten $35/$31/36–60-Werten (confidence: high, da alle 3 Eingaben official/high sind).
3. **Freedom-Position korrigiert:** War Platz 8 (hinter JG Wentworth) — dateninkonsistent, da Freedom bei Gebühren, Bewertungen und Track-Record objektiv besser abschneidet als JGW. **Neu: Freedom #7, JG Wentworth #8.** `best_for` für Freedom = „Program guarantee" (sachlich, kein Superlativ) statt „—".
4. **JG-Wentworth-Rating korrigiert:** Das 4.8★/17k-Trustpilot-Rating gilt für die GESAMTE Marke (überwiegend Structured-Settlement-Kunden), nicht die Debt-Settlement-Sparte. Seed nutzt stattdessen die sparten-spezifische BBB-Kundenbewertung (~3.13★, 188 Reviews) — deutlich niedriger, aber korrekt zugeordnet.
5. **CuraDebt-Rating konservativ:** Trustpilot-Werte widersprüchlich/nicht primärverifiziert (OFFEN) → Rating wird bewusst NIEDRIG-konservativ gesetzt (4.3, unter allen anderen Kandidaten), damit ein unverifizierter Wert nicht versehentlich „Top rated" gewinnt. `confidence='low'` auf Zeilenebene.
6. **New-Era-Lücken nachrecherchiert:** `min_debt=$15,000` (Forbes Advisor, medium confidence — Snippet-Verifikation, Quellen divergieren $7,500–$15,000) und `program_months≈24–36` (Forbes: Ø 27–28 Monate Abschluss, Design bis ~36) ergänzt, jeweils mit URL.
7. **Pacific afcc=OFFEN** in die Ranked-live-Ausnahmeliste + OFFEN-Sektion aufgenommen (war zuvor nur in der Haupttabelle vermerkt).
8. **Zod-Schema:** `afcc` ist jetzt `z.boolean().nullable()` — OFFEN-Fälle (Accredited, CuraDebt, Pacific) rendern als „—", nicht als falsches „No".

---

## 1. National Debt Relief

| Attribut | Wert | source_url | source_type | confidence |
|---|---|---|---|---|
| fee_pct_min / max | 15 / 25 | nerdwallet.com/personal-loans/learn/national-debt-relief-debt-settlement | editorial | high |
| min_debt | $7,500 | nerdwallet.com/personal-loans/learn/national-debt-relief-debt-settlement | editorial | high |
| program_months_min / max | 24 / 48 | nationaldebtrelief.com/faqs/ | official | high |
| afcc (AADR) | true | nationaldebtrelief.com/accreditations/ | official | high |
| iapda | true | nationaldebtrelief.com/accreditations/ | official | high |
| free_consult | true | nationaldebtrelief.com/ | official | high |
| states_note | Verfügbar in 45 Staaten; nicht in CT, OR, VT, WV, WI | nerdwallet.com/personal-loans/learn/national-debt-relief-debt-settlement | editorial | medium |
| bbb_rating | A+ (~4.73★, 5,900+ Reviews) | bbb.org/us/ny/new-york/profile/debt-relief-services/national-debt-relief-0121-110899 (via bestguide.com/review/national-debt-relief-reviews/) | user_reviews | medium |
| trustpilot | 4.7★, ~43,800–44,300 Reviews | trustpilot.com/review/www.nationaldebtrelief.com (via lendedu.com/blog/national-debt-relief-review/) | user_reviews | medium |
| founded | 2009 | nerdwallet.com/personal-loans/learn/national-debt-relief-debt-settlement | editorial | high |
| no_upfront_fees | true | nationaldebtrelief.com/faqs/ | official | high |

**deep_dive-Rohmaterial:** Gegründet 2009 in New York; dreifach akkreditiert (BBB A+, AADR, IAPDA); Programme typ. 24–48 Monate, 15–25% Gebühr auf eingeschriebene Schulden, Mindestsumme $7,500; verfügbar in 45 Staaten. Keine bekannten CFPB-Enforcement-Actions.
**Pros:** Dreifach-Akkreditierung (BBB A+/AADR/IAPDA) · sehr hohe Kundenbewertungen (Trustpilot 4.7/44k+, BBB 4.73/5.9k+) · jederzeit kündbar ohne Strafgebühr, keine Vorabgebühren.
**Cons:** Nicht in 5 Staaten verfügbar (CT, OR, VT, WV, WI) · Zusatzkosten $9 Setup + $9.85/Monat Kontoführung neben der Settlement-Fee.

---

## 2. Freedom Debt Relief — **mit sichtbarem Risikohinweis** (Owner §7.3)

| Attribut | Wert | source_url | source_type | confidence |
|---|---|---|---|---|
| fee_pct_min / max | 15 / 25 | freedomdebtrelief.com/faq/ | official | high |
| min_debt | $7,500 | nerdwallet.com/personal-loans/learn/freedom-debt-relief-debt-settlement | editorial | high |
| program_months_min / max | 24 / 48 | freedomdebtrelief.com/faq/ | official | high |
| afcc (AADR) | false (ACDR-Gründungsmitglied statt AADR/AFCC) | freedomdebtrelief.com/faq/ | official | medium |
| iapda | true | freedomdebtrelief.com/faq/ | official | high |
| free_consult | true | freedomdebtrelief.com/faq/ | official | high |
| states_note | ~40 Staaten; nicht in CO, HI, OR, RI, VT, WA, WV, WI, WY (+NE/ND je nach Quelle) | nerdwallet.com/personal-loans/learn/freedom-debt-relief-debt-settlement | editorial | medium |
| bbb_rating | A+ (4.4★, 1,573 Reviews) | bbb.org/us/ca/san-mateo/profile/debt-relief-services/freedom-debt-relief-1116-65019 (via bestguide.com/review/freedom-debt-relief-review/) | user_reviews | medium |
| trustpilot | 4.6★, ~49,700 Reviews | freedomdebtrelief.com/reviews/ | user_reviews | medium |
| founded | 2002 | freedomdebtrelief.com/faq/ | official | high |
| no_upfront_fees | true | freedomdebtrelief.com/faq/ | official | high |
| **compliance_flag** | 2019 CFPB Stipulated Final Judgment: $20M Restitution + $5M Zivilstrafe (Vorabgebühren, Gebühren ohne erbrachte Settlements, irreführende Verhandlungsaussagen). 2024: $9.75M TCPA-Sammelklagen-Settlement (Berman v. Freedom Financial Network) wegen Robocalls 05/2017–04/2018. | consumerfinance.gov/about-us/newsroom/bureau-settles-lawsuit-against-freedom-debt-relief/ (CFPB, official) · topclassactions.com/…freedom-financial-network-telemarketing-calls-9-75m-class-action-lawsuit-settlement/ (editorial/legal) | regulator + editorial | high |

**deep_dive-Rohmaterial:** Gegründet 2002, eines der größten & längsten Track Records der Branche ($20 Mrd.+ resolved, 1 Mio.+ Kunden laut Eigenangabe). Program Guarantee (Gebührenerstattung bis 100%, falls Programmkosten die eingeschriebene Schuld übersteigen) ist ein Alleinstellungsmerkmal. **Regulierungshistorie muss sichtbar offengelegt werden** (siehe compliance_flag).
**Pros:** Größtes offiziell beziffertes Track Record ($20 Mrd.+, 1 Mio.+ Kunden seit 2002) · vertragliche Program Guarantee mit Gebührenerstattung · keine Vorabgebühren, kostenlose Beratung.
**Cons:** Dokumentierte CFPB- (2019, $25M) und TCPA-Historie (2024, $9.75M) · engere Staaten-Abdeckung (~40 Staaten) und niedrigere BBB-Kundenbewertung als NDR (4.4/1,573 vs. 4.73/5,900+).

---

## 3. Accredited Debt Relief

| Attribut | Wert | source_url | source_type | confidence |
|---|---|---|---|---|
| fee_pct_min / max | 15 / 25 | nerdwallet.com/personal-loans/learn/accredited-debt-relief-debt-settlement · forbes.com/advisor/debt-relief/accredited-debt-relief-review/ | editorial | high |
| min_debt | $5,000 | nerdwallet.com/personal-loans/learn/accredited-debt-relief-debt-settlement | editorial | medium |
| program_months_min / max | 24 / 48 | nerdwallet.com/… · forbes.com/advisor/debt-relief/accredited-debt-relief-review/ | editorial | high |
| afcc (AADR) | OFFEN — Forbes nennt nur „ACDR", kein sauberer AADR-Beleg | forbes.com/advisor/debt-relief/accredited-debt-relief-review/ | editorial | low |
| iapda | true | nerdwallet.com/personal-loans/learn/accredited-debt-relief-debt-settlement | editorial | medium |
| free_consult | true | nerdwallet.com/personal-loans/learn/accredited-debt-relief-debt-settlement | editorial | high |
| states_note | Nicht verfügbar in: DE, HI, IA, NH, ND, OR, RI, VT, WA, WI, WY (11 Staaten) | nerdwallet.com/personal-loans/learn/accredited-debt-relief-debt-settlement | editorial | medium |
| bbb_rating | A+ (akkreditiert seit 25.02.2021; ~4.89★, ~3,843 Reviews — Count nicht direkt von BBB bestätigt) | bbb.org/us/ca/san-diego/profile/debt-consolidation-services/accredited-debt-relief-1126-172000797 | official | high (Rating) / medium (Count) |
| trustpilot | 4.8★, ~11,171 Reviews | trustpilot.com/review/www.accrediteddebtrelief.com | user_reviews | medium |
| founded | 2011 | nerdwallet.com/personal-loans/learn/accredited-debt-relief-debt-settlement | editorial | medium |
| no_upfront_fees | true | nerdwallet.com/personal-loans/learn/accredited-debt-relief-debt-settlement | editorial | high |
| high_debt_pick | Forbes-Pick „best for anyone with $10,000+ in unsecured debt" | forbes.com/advisor/debt-relief/accredited-debt-relief-review/ | editorial | high |

**deep_dive-Rohmaterial:** Gegründet 2011 (San Diego, Teil von Beyond Finance), BBB-akkreditiert seit 2021 (A+). Gebühr 15–25% liegt am oberen Ende der Branche, zzgl. $9 Setup + $9.75/Monat Kontoführung. Forbes Advisor positioniert den Anbieter explizit als beste Wahl für hohe Schuldsummen ab $10,000 — deckt sich mit Mindestsumme von nur $5,000 (niedrigste der Top-8).
**Pros:** Forbes-Advisor-Empfehlung für hohe Schuldsummen ($10k+) · keine Vorabgebühren · A+ BBB + sehr hohe Trustpilot-Bewertung (4.8/~11,171).
**Cons:** Gebührenspanne (15–25%) zählt laut Forbes zu den höheren am Markt, plus $9.75/Monat Kontogebühr · nicht in 11 Bundesstaaten verfügbar.

---

## 4. New Era Debt Solutions

| Attribut | Wert | source_url | source_type | confidence |
|---|---|---|---|---|
| fee_pct_min / max | 14 / 23 (verifiziert niedriger als Branchenstandard 25%) | neweradebtsolutions.com/why-new-era/extraordinary-value/ | official | high |
| min_debt | $15,000 (Quellen divergieren: $7,500–$15,000; Forbes-Wert gewählt, da einzige zitierbare URL, per Suchindex-Snippet verifiziert, nicht Volltext — Forbes blockte direktes WebFetch mit 403) | forbes.com/advisor/debt-relief/best-debt-relief-companies/ | editorial | medium |
| program_months_min / max | 24 / 36 (Forbes: Ø 27–28 Monate bis Abschluss, Design bis ~36; offizielle Seite nennt keine Zahl) | forbes.com/advisor/debt-relief/best-debt-relief-companies/ | editorial | medium |
| afcc (AADR) | OFFEN — nur via Sekundärquellen behauptet, nicht auf der offiziellen Seite bestätigt (Site blockte direktes WebFetch); nach demselben Maßstab wie Accredited/CuraDebt/Pacific als unbestätigt behandelt | Editorial-Cross-Check (kein Primärbeleg) | editorial | low |
| iapda | true (Logo auf offizieller Seite) | neweradebtsolutions.com/why-new-era/extraordinary-value/ | official | medium |
| free_consult | true | neweradebtsolutions.com/why-new-era/extraordinary-value/ | official | high |
| states_note | ~38+ Staaten, exakte Liste OFFEN | Editorial-Cross-Check | editorial | low |
| bbb_rating | A+ (akkreditiert seit 2001); Kundenbewertung (Sterne/Anzahl) OFFEN | bbb.org/us/ca/camarillo/profile/debt-relief-services/new-era-debt-solutions-1236-3001079 | official | high (Rating) / — (Count) |
| trustpilot | 4.9★, ~440 Reviews | trustpilot.com/review/neweradebtsolutions.com | user_reviews | medium |
| founded | OFFEN — widersprüchlich: eigene Seite „seit 1999", BBB nennt 2007, Drittquelle 2004 | neweradebtsolutions.com vs. bbb.org/us/ca/camarillo/… | official (widersprüchlich) | low |
| no_upfront_fees | true | neweradebtsolutions.com/why-new-era/extraordinary-value/ | official | high |
| „27+ Jahre" / niedrigste CFPB-Beschwerdequote | **NICHT verifizierbar** — widerspricht BBB-Gründungsdatum, kein CFPB-Datenbank-Check durchgeführt → NICHT in Copy verwenden | Editorial-Cross-Check | editorial | low |

**deep_dive-Rohmaterial:** BBB-akkreditiert seit 2001 (A+), Sitz Camarillo, CA. Niedrigste Gebührenspanne der gesamten Top-8 (14–23% vs. 15–25% branchenüblich), offiziell auf der eigenen Website bestätigt. Mindestsumme $10,000 (höher als Accredited). Gründungsjahr widersprüchlich in den Quellen — **„27+ Jahre"-Claim aus der Shortlist wird NICHT übernommen**, da er dem BBB-Gründungsdatum widerspricht.
**Pros:** Niedrigste Gebührenspanne der Top-8 (14–23%), offiziell bestätigt · A+ BBB seit 2001 · sehr hohe Trustpilot-Bewertung (4.9/~440).
**Cons:** Höhere Mindestschuld ($10,000) als Accredited · kleine Reviewbasis (~440 vs. teils 40,000+ bei größeren Anbietern) — geringere statistische Aussagekraft.

## 5. Pacific Debt Relief

| Attribut | Wert | source_url | source_type | confidence |
|---|---|---|---|---|
| fee_pct_min / max | 15 / 25 | nerdwallet.com/personal-loans/learn/pacific-debt-relief-debt-settlement | editorial | high |
| min_debt | $10,000 | pacificdebt.com/ · money.usnews.com/money/personal-finance/debt-settlement/reviews/pacific-debt | official + editorial | high |
| program_months_min / max | 24 / 48 (Ø 42) | nerdwallet.com/personal-loans/learn/pacific-debt-relief-debt-settlement | editorial | medium |
| afcc (AADR) | OFFEN — Website nennt „ACDR-akkreditiertes Mitglied", nicht eindeutig AADR | pacificdebt.com/ | official | low |
| iapda | true | pacificdebt.com/ | official | medium |
| free_consult | true | pacificdebt.com/ | official | high |
| states_note | 46 Staaten + DC; nicht in CO, MN, OR, WI | nerdwallet.com/personal-loans/learn/pacific-debt-relief-debt-settlement · pacificdebt.com/states | editorial + official | medium |
| bbb_rating | A+ (~4.87–4.9★, exakter Count OFFEN) | pacificdebt.com/ · money.usnews.com/money/personal-finance/debt-settlement/reviews/pacific-debt | official + editorial | medium |
| trustpilot | 4.7★, ~2,400+ Reviews | trustpilot.com/review/www.pacificdebt.com | user_reviews | medium |
| founded | 2002 (San Diego) | finance.yahoo.com/news/pacific-debt-relief-celebrates-milestone-152000859.html | editorial (PR) | high |
| volume | $500M+ abgewickelt seit 2002 | finance.yahoo.com/news/pacific-debt-relief-celebrates-milestone-152000859.html | editorial (PR) | high |
| no_upfront_fees | true | nerdwallet.com/personal-loans/learn/pacific-debt-relief-debt-settlement | editorial | high |

**deep_dive-Rohmaterial:** Gegründet 2002 in San Diego, $500M+ abgewickelt. 15–25% Gebühr, $10,000 Mindestsumme, Ø 42 Monate Programmdauer. Verfügbar in 46 Staaten (nicht CO, MN, OR, WI). A+ BBB, starker Trustpilot-Score.
**Pros:** Kostenlose, unverbindliche Erstberatung · keine Vorabgebühren · A+ BBB + starkes Trustpilot-Rating (4.7/~2,400).
**Cons:** Nicht in 4 Staaten verfügbar (CO, MN, OR, WI) · Zusatzkosten $10 Setup + $10/Monat Kontoführung, optional $29.95/Monat Legal-Protection-Plan.

---

## 6. CuraDebt

| Attribut | Wert | source_url | source_type | confidence |
|---|---|---|---|---|
| fee_pct_min / max | ~15 / 25 (offizielle Seite nennt kein exaktes %, Range aus Editorial-Aggregat) | curadebt.com/debt-settlement-program/ (Modell) | official + editorial | medium |
| min_debt | ~$5,000 (keine harte offizielle Grenze) | Editorial-Aggregat | editorial | medium |
| program_months_min / max | OFFEN — nur „typically a couple of years" | curadebt.com/debt-settlement-program/ | official | low |
| afcc (AADR) | OFFEN — nur „ACDR Member" genannt | curadebt.com/debt-settlement-program/ | official | low |
| iapda | teilweise belegt (DMP-Seite listet IAPDA, Settlement-Seite nicht explizit) | curadebt.com/debt-management-program/ | official | medium |
| free_consult | true | curadebt.com/debt-settlement-program/ | official | high |
| states_note | Alle 50 Staaten + DC + PR laut Formular; „varies by state" ohne Ausschlussliste | curadebt.com/ | official | medium |
| bbb_rating | A+ | curadebt.com/ · bbb.org/us/fl/hollywood/profile/debt-relief-services/curadebt-systems-llc-0633-90058374 | official + regulator | high |
| trustpilot | OFFEN — widersprüchliche Snapshots (5.0★/217 vs. 4.7★/30), nicht primärverifiziert | trustpilot.com/review/www.curadebt.com | user_reviews | low |
| **seed rating (konservativ, Fable-5-Fix)** | **4.3★** — bewusst NIEDRIG-konservativ gesetzt (unter allen anderen 7 Kandidaten: NDR 4.7, Freedom 4.6, Accredited 4.8, New Era 4.9, Pacific 4.7, GreenPath 4.95, JGW 3.1-Sparte), damit ein nicht primärverifiziertes Rating nicht versehentlich den „Top rated"-Sort/Winner gewinnt. Kein Präzisionsanspruch — reiner Platzhalter bis eine belastbare Quelle vorliegt. | — (redaktionelle Konservativ-Entscheidung, kein Primärbeleg) | user_reviews | low |
| founded | 2001 (San Diego) | curadebt.com/ | official | high |
| no_upfront_fees | true | curadebt.com/debt-settlement-program/ | official | high |
| tax_debt_specialist | true — IRS-lizenzierte Enrolled Agents, IRS-Vertretung, Offers in Compromise, State Tax Relief | curadebt.com/ | official | high |

**deep_dive-Rohmaterial:** Gegründet 2001, San Diego. Einziger Kandidat mit dediziertem IRS/State-Tax-Debt-Relief-Zweig (Enrolled Agents). Kein Vorabgebühren-Modell. Fee-Range nicht offiziell beziffert (Editorial-Konsens 15–25%, medium confidence) — **fee_pct_mid für Soft-live als „schätzungsbasiert, nicht primärquellenverifiziert" markiert.**
**Pros:** Spezialisierter Tax-Debt-Relief-Zweig mit IRS-lizenzierten Enrolled Agents (Alleinstellungsmerkmal) · kostenlose, unverbindliche Ersteinschätzung · A+ BBB.
**Cons:** Programmdauer & exakte Gebühren-% auf offizieller Seite nicht transparent beziffert · Trustpilot-Daten uneinheitlich, nicht primärverifizierbar.

---

## 7. GreenPath Financial Wellness — Non-Profit-Pick (anderes Kostenmodell: DMP, kein Settlement)

| Attribut | Wert | source_url | source_type | confidence |
|---|---|---|---|---|
| dmp_setup_fee | Ø $35 (0–$50 je Staat) | greenpath.com/resources-tools/faq/ | official | high |
| dmp_monthly_fee | Ø $31 (~$25–$50 je Staat) | greenpath.com/resources-tools/faq/ · zogby.com/reviews/greenpath/ | official + editorial | high (Ø) / medium (Spanne) |
| **dmp_flat_total (neu, Fable-5-Fix)** | **$1,523** = $35 + $31 × 48 Monate (Mittelwert des offiziellen 36–60-Monats-Bereichs). Abgeleitet aus 3 bereits offiziell belegten Werten (setup/monthly/Programmdauer) — kein neuer unabhängiger Wert. Treibt `costModel.flatFeeAccessor`, damit der Kostenrechner den echten Festbetrag statt eines falschen $0 zeigt. | greenpath.com/resources-tools/faq/ (Ableitung) | official (abgeleitet) | high |
| **min_debt (neu, Fable-5-Fix)** | **Kein formales Mindest-Schuldenniveau** — DMPs gaten strukturbedingt nicht auf eine Schuldensumme (anders als Settlement-Anbieter, deren %-Gebühr sich erst ab einer Mindestsumme lohnt). Nicht explizit auf greenpath.com als eigene Kennzahl beziffert — konservativ als Branchenstruktur-Inferenz behandelt (KEIN offizieller Einzelbeleg), daher `confidence: medium`, nicht `high`. | greenpath.com/debt-management/ (Struktur-Inferenz, keine explizite Zahl) | editorial | medium |
| free_consult | true | greenpath.com/resources-tools/faq/ | official | high |
| nfcc_member | true (+ COA-akkreditiert) | greenpath.com/debt-management/ | official | high |
| nonprofit_since | 1961 | greenpath.com/debt-management/ | official | high |
| program_months_min / max | 36 / 60 | greenpath.com/resources-tools/faq/ | official | high |
| states_note | Alle 50 Staaten | nerdwallet.com/article/loans/personal-loans/greenpath-review | editorial | high |
| bbb_rating | A+ (~4.95★, ~1,297 Reviews) | bbb.org/us/mi/farmington-hills/profile/credit-and-debt-counseling/greenpath-financial-wellness-0372-2538 | user_reviews | high |
| trustpilot | ~4.4–4.5★, ~167–312 Reviews (Snapshots divergieren) | trustpilot.com/review/greenpath.com | user_reviews | medium |
| credit_score_note | Kein Bureau-Reporting bei Enrollment; kurzfristiger Dip durch Kartenschließungen, langfristig meist Verbesserung | greenpath.com/debt-management/ | official | high |

**deep_dive-Rohmaterial:** 501(c)(3)-Nonprofit seit 1961, NFCC-Mitglied. **Kein Schuldenerlass** — 100% der Hauptschuld wird über 36–60 Monate zurückgezahlt, Ersparnis kommt aus reduzierten Zinsen/Gebühren. Kostenlose Beratung, Ø $35 Einmalgebühr + Ø $31/Monat — deutlich günstiger als Settlement-Anbieter, aber ohne Schuldenreduktion. Guter „sanfter" Pick für Kunden, die keinen harten Score-Einbruch wollen.
**Pros:** Nonprofit seit 1961, NFCC/COA-akkreditiert, kostenlose Beratung · sehr niedrige, regulierte Gebühren in allen 50 Staaten · herausragende BBB-Bilanz (A+, 4.95/~1,300).
**Cons:** Kein Schuldenerlass — 100% der Hauptschuld wird zurückgezahlt (kein Settlement-Rabatt) · Kreditkarten müssen bei Enrollment geschlossen werden (temporärer Score-Dip).

---

## 8. JG Wentworth (Debt-Settlement-Sparte)

| Attribut | Wert | source_url | source_type | confidence |
|---|---|---|---|---|
| fee_pct_min / max | 18 / 25 | nerdwallet.com/personal-loans/learn/jg-wentworth-debt-relief-debt-settlement | editorial | high |
| min_debt | $10,000 | nerdwallet.com/… · lendedu.com/blog/jg-wentworth-debt-relief-review/ | editorial | high |
| program_months_min / max | 24 / 48 (Ø 32 laut NerdWallet) | jgwentworth.com/debt-relief · nerdwallet.com/… | official + editorial | medium-high |
| afcc (AADR) | true — AADR-Mitglied (+ ACDR) | jgwentworth.com/aadr-program-disclosure-statement · americanfaircreditcouncil.org/view-members/jg-wentworth/ | official | high |
| iapda | true | nerdwallet.com/personal-loans/learn/jg-wentworth-debt-relief-debt-settlement | editorial | high |
| free_consult | true | nerdwallet.com/… | editorial | high |
| states_note | Direktprogramm in 31 Staaten + DC; 12 weitere nur via Kanzlei-Referral; nicht in WV | jgwentworth.com/debt-relief · lendedu.com/blog/jg-wentworth-debt-relief-review/ | official + editorial | medium |
| bbb_rating | A+ (akkreditiert seit 1996; Sparten-Kundenbewertung nur ~3.13★, 188 Reviews) | lendedu.com/blog/jg-wentworth-debt-relief-review/ | editorial + user_reviews | medium-high |
| **seed rating (korrigiert)** | **3.1★ / 188 Reviews — die sparten-spezifische BBB-Kundenbewertung, NICHT das markenweite Trustpilot-Rating.** Fable-5-Checkpoint: 4.8★/17,026 gilt für jgwentworth.com gesamt (überwiegend Structured-Settlement-Kunden), nicht isoliert für die Debt-Settlement-Sparte — würde als Seed-Rating eine falsche Qualitätsaussage für DIESES Produkt treffen. | lendedu.com/blog/jg-wentworth-debt-relief-review/ | user_reviews | medium |
| trustpilot (Referenz, NICHT als Seed-Rating verwendet) | 4.8★, ~17,026 Reviews — Gesamtmarke inkl. Structured Settlements | lendedu.com/blog/jg-wentworth-debt-relief-review/ | user_reviews | medium |
| founded | 1991 (Settlement-Sparte seit 2019) | en.wikipedia.org/wiki/J.G._Wentworth | editorial/reference | high |
| no_upfront_fees | true (Settlement-Fee erst nach Erfolg; $9.95 Setup + $9.95/Monat Escrow laufen ab Start) | nerdwallet.com/personal-loans/learn/jg-wentworth-debt-relief-debt-settlement | editorial | high |

**deep_dive-Rohmaterial:** Gegründet 1991 (Structured Settlements), Debt-Settlement-Sparte seit 2019. 18–25% Gebühr ab $10,000, Ø 32 Monate. AADR-Mitglied mit eigener Disclosure, IAPDA-akkreditiert. Holding durchlief 2009 & 2017 Chapter-11-Verfahren — **beide vor Start der Settlement-Sparte, reine Bilanz-Restrukturierungen, kein Kundengeld betroffen; kein 2023er Verfahren** (Korrektur ggü. ungeprüfter Annahme). Direktverfügbar in 31 Staaten + DC, sonst nur Kanzlei-Referral, nicht in WV.
**Pros:** Keine Vorabgebühr auf die Settlement-Leistung, kostenlose Erstberatung · A+ BBB seit 1996 (eine der längsten Akkreditierungen der Kategorie) · AADR-Mitglied mit eigener Disclosure + IAPDA-Zertifizierung.
**Cons:** Hohe Gesamtkosten (18–25% + $9.95 Setup + $9.95/Monat), Netto-Ersparnis laut NerdWallet unter Branchenschnitt · Sparten-Kundenbewertung nur ~3.1★ (188 BBB-Reviews) — deutlich schwächer als NDR/Pacific/GreenPath.

---

## Fee-Mittelwerte für den `fee-on-amount`-Kostenrechner (`management_fee` = fee_pct_mid)

| Provider | fee_pct_min | fee_pct_max | fee_pct_mid (→ management_fee) |
|---|---|---|---|
| National Debt Relief | 15 | 25 | 20.0 |
| Freedom Debt Relief | 15 | 25 | 20.0 |
| Accredited Debt Relief | 15 | 25 | 20.0 |
| New Era Debt Solutions | 14 | 23 | 18.5 |
| Pacific Debt Relief | 15 | 25 | 20.0 |
| CuraDebt | 15 | 25 (medium confidence, Editorial-Aggregat) | 20.0 |
| GreenPath (DMP, kein Settlement) | n/a | n/a | 0 (kein Fee-on-Amount — siehe eigenes Kostenmodell-Feld unten) |
| JG Wentworth | 18 | 25 | 21.5 |

## Ranked-live-Einstufung (Gate aus Rollout-Plan Guardrail 4 / Addendum §6.1)

Alle 8 Kandidaten haben `fee_pct_min/max` mit mindestens `medium confidence` und belegter Quelle → **Ranked-live** ist gerechtfertigt für die Kernattribute (Gebühr, Mindestsumme, Programmdauer, Akkreditierung). Ausnahmen, die NICHT in Ranking/Winner-Metrik einfließen (bleiben in `attributes` als Anzeige-Text, nicht als Score-Treiber):
- CuraDebt: `fee_pct_mid` mit `confidence: medium` (Editorial-Aggregat, nicht offiziell beziffert) — wird dennoch für den Kostenrechner verwendet (transparente Spanne, kein geratener Einzelwert), aber NICHT für einen „niedrigste Gebühr"-Winner-Claim. Rating konservativ auf 4.3★ gesetzt (siehe oben) — schließt einen falschen „Top rated"-Gewinn strukturell aus.
- Accredited/CuraDebt/**Pacific**/**New Era**: `afcc` = OFFEN (null im Zod-Schema) → UI zeigt „—" statt eines falschen Häkchens oder eines falschen „No".
- GreenPath: `management_fee` fließt NICHT direkt in Fee-Winner/Kostenrechner ein — Infinity-Sentinel (spec/compare) + `flatFeeAccessor` (Kosten) zeigen den echten Festbetrag ($1,523), siehe Fable-5-Review-Sektion oben.
- JG Wentworth: Seed-`rating` = 3.1★/188 (sparten-spezifisch, BBB), NICHT das markenweite 4.8★/17k-Trustpilot-Rating.
- New Era: „27+ Jahre"/„niedrigste CFPB-Quote" NICHT in Copy — nur belegte Werte (14–23% Gebühr, A+ BBB seit 2001, 4.9★ Trustpilot).
- Alle „states_note"-Werte als Freitext, nicht als hartes Filter-Flag (Quellen teils divergent — kein falsches „verfügbar in deinem Staat"-Signal).

### Redaktionelle Reihenfolge (Fable-5-korrigiert)

1. National Debt Relief — is_top_pick=true, best_for=„Most trusted overall"
2. Accredited Debt Relief — best_for=„Larger debt balances ($10k+)"
3. New Era Debt Solutions — best_for=„Lowest fees"
4. GreenPath Financial Wellness — best_for=„Avoiding debt settlement / credit-score-conscious"
5. Pacific Debt Relief — best_for=„Long track record"
6. CuraDebt — best_for=„Tax debt specialists"
7. **Freedom Debt Relief** — best_for=„Program guarantee" (sachlich, kein Superlativ; sichtbarer Risikohinweis in cons/deep_dive, siehe §2)
8. **JG Wentworth** — best_for=„Legacy brand recognition"

Korrektur ggü. Erstentwurf: Freedom (#8→#7) und JG Wentworth (#7→#8) getauscht — Freedom schlägt JGW objektiv bei Gebühren, Bewertungen (sparten-spezifisch 4.6★/1,573 vs. 3.1★/188) und Track-Record; letzte Position wäre eine Doppelbestrafung on top des bereits sichtbaren Risikohinweises gewesen.

## OFFEN — nicht für Ranking/Kosten verwendet
- Pacific: BBB-Kundenbewertung exakter Wert, Kündigungsregelung, **`afcc`-Status** (Website nennt „ACDR", nicht eindeutig AADR → `afcc=null`).
- CuraDebt: Programmdauer exakt, **`afcc`-Status** (nur „ACDR Member" genannt → `afcc=null`), Trustpilot-Wert (Rating konservativ ersetzt, s.o.).
- Freedom: exakte Staaten-Ausschlussliste (Quellen divergieren bei NE/ND).
- JG Wentworth: Staaten-Liste (Quellen divergieren zwischen „nur WV ausgeschlossen" und der differenzierteren 31+12-Staaten-Aufschlüsselung — die differenzierte Version wird verwendet).
- Accredited: **`afcc`-Status** unsicher (Forbes nennt nur „ACDR") → `afcc=null`.
- New Era: Gründungsjahr, Staaten-Liste exakt, BBB-Kundenbewertung, **`afcc`-Status** (nur Sekundärquellen, kein Primärbeleg) → `afcc=null`.
- GreenPath: `min_debt` ist eine Branchenstruktur-Inferenz, kein expliziter Einzelbeleg (siehe §7, `confidence: medium`).

Alle „OFFEN"-Werte fließen NICHT in Ranking, Winner-Chips oder Kostenrechner (Guardrail 4/5 des Rollout-Plans). `afcc=null` rendert im Cockpit als „—", niemals als falsches „No" (Zod: `z.boolean().nullable()`).
