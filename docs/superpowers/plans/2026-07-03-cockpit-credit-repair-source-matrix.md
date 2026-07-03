# Source-Matrix: Best Credit Repair Companies (US) — Comparison Cockpit Slice 5

> **Stand: 2026-07-03** · Recherche durch Fable 5 (per Model-Routing-Regel des Phase-D-Plans: compliance-sensitives Thema) · Guardrail-5-konform: jede Zeile trägt `source_url`, `source_type`, `confidence`, `data_verified_at`.
>
> Topic: `credit-repair/companies` · Markt: US · Kandidaten gemäß Shortlist (`docs/superpowers/specs/2026-07-02-best-x-candidate-shortlist.md` §5) + Owner-Entscheidung §7.2 („Lexington Law raus, Safeport Law rückt nach").
>
> **Regeln:** Werte mit `confidence: low` oder Markierung „offen — nicht verifiziert" dürfen NICHT geseedet und NICHT in Rankings/Claims verwendet werden. `source_type`: `official` = Anbieter-Preisseite/Site/ToS · `editorial` = FinanceBuzz/TopConsumerReviews/ConsumersAdvocate/Money/CNBC u. a. · `regulator` = CFPB/Gerichtsakten/BBB-Registerdaten.
>
> **Wichtigste Recherche-Funde vorab (korrigieren die Shortlist §5):**
>
> 1. **Ovation Credit Services ist DEFUNKT.** LendingTree hat Ovation zum 30.06.2023 geschlossen (~200 Stellen in Jacksonville abgebaut, WARN-Letter Juni 2023). Shortlist-Slot #7 entfällt ersatzlos — die Firma existiert seit 3 Jahren nicht mehr. Brisant: `content/us/credit-repair/best-credit-repair-companies.mdx` rankt Ovation aktuell noch auf #7 (Details im Urteils-Abschnitt 6).
> 2. **Lexington Law operiert 2026 weiter** — aber unter neuer Entität: Die Vorgänger-Kanzlei John C. Heath, Attorney at Law PC wurde in der Chapter-11-Insolvenz aufgelöst; der Tradename wurde von **Oquirrh Mountain Law Group, P.C.** gekauft, die den Betrieb (Stand Feb 2026) unter der Marke „Lexington Law Firm" fortführt und neue Kunden annimmt. Das 10-Jahres-Telemarketing-Verbot (bis ~2033) und das $2,7-Mrd.-Urteil sind aktuell und bestandskräftig. Empfehlung: **Ausschluss aus dem Ranked-Feld bestätigt** (Urteils-Abschnitt 1).
> 3. **Safeport Law ist KEIN Rebrand des Lexington/Progrexion-Geflechts** — eigenständige Georgia-Kanzlei (Coleman Legal, LLC dba Safeport Law, LaGrange GA, Managing Partner Joy Coleman, Esq.), gegründet Juni 2022, BBB-akkreditiert (A-) seit März 2023, keine CFPB-Beschwerden. Aber: jung, kein Trustpilot-Profil, Preisangaben zwischen Quellen volatil ($89,99 → $129,99 → $99/Monat) — Preis vor Seeding einmal manuell verifizieren.
> 4. **The Credit Pros: Ausschluss empfohlen.** Trustpilot-Fake-Review-Flag bestätigt (TrustScore war suspendiert; $50-Rabatt für Reviews = incentivierte Bewertungen), 47 Bundesgerichtsverfahren (überwiegend TCPA) inkl. persönlicher Haftungs-Ruling gegen den Präsidenten, schwächste Garantie im Feld (keine Rückerstattung), teuerster Anbieter. Details Urteils-Abschnitt 2.
> 5. **Das ehrliche Ranked-Feld sind 6 Anbieter** (nicht 8–9): Credit Saint · Sky Blue Credit · The Credit People · Safeport Law · MSI Credit Solutions · Credit Firm. Kein Auffüllen (Forex-Präzedenz: 7→5).
> 6. **DB-Ist-Zustand `affiliate_links` (via `mcp__smartfinpro__list_affiliate_links`, 2026-07-03):** Für `category='credit-repair'` existiert genau **1 Row**: `the-credit-people` (active, healthy, cpa 0, Destination `https://www.thecreditpeople.com/` = nackter Homepage-Link ohne Tracking-Parameter → `review`-CTA, kein `offer`). **`/go/credit-saint` und `/go/lexington-law` haben KEINE DB-Rows**, werden aber von `credit-saint-review.mdx` bzw. `lexington-law-review.mdx` + `best-credit-repair-companies.mdx` als CTA verlinkt → tote `/go`-Ziele (Content-Hygiene-Task, Abschnitt 6).
> 7. **Kostenmodell: keins der 3 existierenden Kinds passt ehrlich.** Credit Repair = Flat-Abo (Monatsgebühr × Programmmonate + einmalige First-Work-Fee) — weder %-vom-Betrag (`fee-on-amount`) noch Banking-Nutzungssimulation noch Compounding. Empfehlung: neues Kind `'monthly-plus-setup'` (kleiner Shared-Code-Change, exakt im Umfang des Slice-1-Präzedenzfalls `fee-on-amount`). Details + echte Zahlen in Urteils-Abschnitt 4.

---

## Haupt-Matrix (6 Ranked-Kandidaten × 10 Attribute)

### 1. Credit Saint (Saint Services LLC, Saddle Brook NJ — BBB-akkreditiert seit 2007)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Credit Saint | monthly_fee | $79,99 (Credit Polish) / $109,99 (Credit Remodel) / $139,99 (Clean Slate) | https://financebuzz.com/credit-saint-review | editorial | high | 2026-07-03 |
| Credit Saint | setup_fee | $99 (Polish + Remodel) / $195 (Clean Slate) — „first work fee" | https://financebuzz.com/credit-saint-review | editorial | high | 2026-07-03 |
| Credit Saint | typical_total_cost_6mo | $579 (Polish) · $759 (Remodel) · $1.035 (Clean Slate) — abgeleitet: setup + 6× monthly (Ø-Programmdauer 3–6 Monate lt. Branchen-Konsens) | abgeleitet aus obigen Zeilen | editorial | medium | 2026-07-03 |
| Credit Saint | dispute_scope | Bureau-Disputes (Late Payments, Charge-offs, Judgments, Collections, Liens); Inquiry-Targeting ab Remodel; Cease-&-Desist + unbegrenzte Challenges nur Clean Slate; untere Tiers limitiert (~5 Items/Bureau/Zyklus) | https://financebuzz.com/credit-saint-review | editorial | high | 2026-07-03 |
| Credit Saint | guarantee | 90-Tage-Geld-zurück, wenn in 90 Tagen kein Item entfernt wurde; First-Work-Fee lt. bisherigem SmartFinPro-Review nicht erstattungsfähig — Refund-Scope vor Seeding auf creditsaint.com/ToS gegenprüfen (Site WAF-blockt automatisierte Zugriffe) | https://financebuzz.com/credit-saint-review | editorial | high | 2026-07-03 |
| Credit Saint | states_note | NICHT verfügbar in GA, KS, LA, SC, VT (lt. offiziellen Website Terms & Conditions; Suchindex-Snippet) — Achtung: bisheriges SmartFinPro-MDX nennt nur GA+SC, das ist unvollständig | https://www.creditsaint.com/terms-of-service/ | official | medium | 2026-07-03 |
| Credit Saint | bbb_rating | A- (Stand Feb 2026), BBB-akkreditiert seit 2007; 4,1/5 aus 121 BBB-Reviews; 119 Beschwerden/3 Jahre, davon 61 in den letzten 12 Monaten (steigender Trend) | https://getoutofdebt.org/231268/is-credit-saint-legit-ai-review | editorial | medium | 2026-07-03 |
| Credit Saint | trustpilot | 4,6/5 aus 643 Reviews — aber >20 % 1-Stern-Anteil | https://www.trustpilot.com/review/creditsaint.com | official | medium | 2026-07-03 |
| Credit Saint | accreditation | NACSO-Mitgliedschaft von Aggregatoren behauptet, auf offizieller Site nicht verifizierbar → als `null` (unbekannt) seeden, nicht als true | https://www.creditdetailer.com/center/nacso | editorial | low | 2026-07-03 |
| Credit Saint | regulatory_history | **Keine CFPB-/FTC-/State-AG-Enforcement-Actions** (Stand Feb 2026). 25 CFPB-Beschwerden (unter Saint Services LLC). Watch-Flag: private Credlocity-„Investigation" (Nov 2025) behauptet CROA-/TSR-Verstöße; Credit Saint antwortete mit $300k-Cease-&-Desist; von keiner Behörde validiert — NICHT als Fakt publizieren, nur intern beobachten | https://getoutofdebt.org/242507/is-credit-saint-legit-in-2026 | editorial | medium | 2026-07-03 |

### 2. Sky Blue Credit (Sky Blue Financial Services, Inc., Boca Raton FL — seit 1989)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Sky Blue Credit | monthly_fee | Einzelperson: $79 (Basic) / $99 (Full Service) / $119 (Premium); Paare: $119 / $149 / $179 | https://www.skybluecredit.com/ | official | high | 2026-07-03 |
| Sky Blue Credit | setup_fee | Kein separater Setup-Ausweis auf der offiziellen Preisseite („No Charge for 6 Days"-Promo = erste Abbuchung nach 6 Tagen); ältere Reviews nennen First-Work-Fee in Höhe einer Monatsrate ($79) — Diskrepanz vor Seeding auflösen, konservativ: $0 separat + Fußnote | https://www.skybluecredit.com/ | official | medium | 2026-07-03 |
| Sky Blue Credit | typical_total_cost_6mo | $594 (Full Service Einzel) · $474 (Basic) · $714 (Premium) — abgeleitet: 6× monthly, kein Setup | abgeleitet | official | medium | 2026-07-03 |
| Sky Blue Credit | dispute_scope | Basic: Bureau-Disputes; Full Service: + Creditor Interventions; Premium: + monatliche Inquiry-Disputes, **Debt-Validation-Letters, Cease-&-Desist-Letters**, Personal-Info-Korrektur. 45-Tage-Dispute-Zyklus (schnellster im Feld; Basic 60 Tage) | https://www.skybluecredit.com/ | official | high | 2026-07-03 |
| Sky Blue Credit | guarantee | 90-Tage-Geld-zurück „no strings" — bedingungslos auf Anfrage innerhalb 90 Tagen ab Enrollment (stärkste Garantie im Feld: nicht an „kein Removal" geknüpft) | https://www.skybluecredit.com/ | official | high | 2026-07-03 |
| Sky Blue Credit | states_note | Alle 50 Staaten + Puerto Rico, Guam, Virgin Islands + Militärangehörige weltweit | https://management.org/sky-blue-credit-repair-review | editorial | medium | 2026-07-03 |
| Sky Blue Credit | bbb_rating | A+ (nicht akkreditiert); BBB-Kundenreviews ~3/5 bei sehr kleiner Anzahl (4–8 Reviews) | https://www.bbb.org/us/fl/boca-raton/profile/credit-repair-services/sky-blue-credit-0633-92005260 | regulator | medium | 2026-07-03 |
| Sky Blue Credit | trustpilot | 2,9/5 aus **nur 2 Reviews** — Sample unbrauchbar, NICHT als Ranking-Signal verwenden. Alternativen: Google 4,3/497 · ConsumerAffairs 4,9/237 | https://www.trustpilot.com/review/skybluecredit.com | official | medium | 2026-07-03 |
| Sky Blue Credit | accreditation | NACSO-Behauptung nur via Aggregator → `null` seeden | https://www.creditdetailer.com/center/nacso | editorial | low | 2026-07-03 |
| Sky Blue Credit | regulatory_history | **Sauber**: keine Enforcement-Actions (CFPB/FTC/State AG) in öffentlich zugänglichen Registern; nur 2 CFPB-Beschwerden in 3 Jahren — bester Compliance-Track-Record im Feld bei 35+ Jahren Betriebsgeschichte | https://getoutofdebt.org/242660/is-sky-blue-credit-legit | editorial | medium | 2026-07-03 |

### 3. The Credit People (The Credit People, Inc., Cottonwood Heights UT — einziger Kandidat mit bestehendem Affiliate-Link)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| The Credit People | monthly_fee | $99 (Standard) / $119 (Premium); zusätzlich Flat-Rate-Option: **$599 einmalig für 6 Monate Premium**. Achtung: der $79-Tier aus dem bestehenden SmartFinPro-Review existiert auf der offiziellen Preisseite nicht mehr | https://www.thecreditpeople.com/pricing | official | high | 2026-07-03 |
| The Credit People | setup_fee | $19 (niedrigste Einstiegsgebühr der Kategorie; auf offizieller Pricing-Seite nicht mehr explizit ausgewiesen, aber 2025/2026-Editorial-Konsens) — vor Seeding im Checkout verifizieren | https://money.com/the-credit-people-credit-repair-review/ | editorial | medium | 2026-07-03 |
| The Credit People | typical_total_cost_6mo | $613 (Standard: $19 + 6×$99) · Flat-Rate $599 | abgeleitet | official | medium | 2026-07-03 |
| The Credit People | dispute_scope | Unbegrenzte Disputes bei allen 3 Bureaus, Creditor Interventions, eskalierte Disputes & Debt-Validations, monatliche Score-Refreshes (alle Tiers identisch — Premium unterscheidet sich primär in Speed/Priorität) | https://www.thecreditpeople.com/pricing | official | high | 2026-07-03 |
| The Credit People | guarantee | „Unbeatable Satisfaction Guarantee": jederzeit kündbar, Erstattung der letzten + vorletzten Monatszahlung. **Kein volles 90-Tage-Geld-zurück** — bisheriges SmartFinPro-MDX („90-day money-back guarantee") überzeichnet die Garantie → Content-Fix nötig | https://www.thecreditpeople.com/pricing | official | medium | 2026-07-03 |
| The Credit People | states_note | Alle 50 Staaten | https://www.creditdonkey.com/the-credit-people-review.html | editorial | medium | 2026-07-03 |
| The Credit People | bbb_rating | **C+ (NICHT akkreditiert)**, 2,35/5 aus ~20 BBB-Reviews — bisheriges SmartFinPro-MDX behauptet „A+ BBB rated": falsch → Pflicht-Content-Fix | https://www.bbb.org/us/ut/cottonwood-heights/profile/credit-repair-services/the-credit-people-inc-1166-90014353 | regulator | medium | 2026-07-03 |
| The Credit People | trustpilot | **1,8/5 „Poor"** (Profil www.thecreditpeople.com, kleine Review-Zahl); BestCompany 4,3/300+. Bisheriges SmartFinPro-MDX behauptet „Trustpilot 4,6 aus 12.847 Reviews" — nicht belegbar, mutmaßlich fabriziert → Pflicht-Content-Fix | https://www.trustpilot.com/review/www.thecreditpeople.com | official | medium | 2026-07-03 |
| The Credit People | accreditation | NACSO-Behauptung nur via Aggregator → `null` seeden | https://www.creditdetailer.com/center/nacso | editorial | low | 2026-07-03 |
| The Credit People | regulatory_history | **Keine CFPB-/FTC-/State-AG-Enforcement-Actions gefunden** (gezielte Suche 2026-07-03 ergebnislos — sauberer Befund, aber Beschwerdebild: BBB-/Trustpilot-Beschwerden über ausbleibende Removals trotz monatelanger Zahlungen) | https://www.consumeraffairs.com/finance/the-credit-people.html | editorial | medium | 2026-07-03 |

### 4. Safeport Law (Coleman Legal, LLC dba Safeport Law, LaGrange GA — Owner-§7.2-Nachrücker)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Safeport Law | monthly_fee | $99/Monat („Credit Cleanse", einziges Programm) lt. ConsumersAdvocate 2026; FinanceBuzz (Nov 2024) nannte $129,99 + $129 Initial, ältere Quellen $89,99 + $89 — Preis offenbar mehrfach angepasst. safeportlaw.com WAF-blockt automatisierte Zugriffe → **vor Seeding einmal manuell im Browser verifizieren** | https://www.consumersadvocate.org/credit-repair-es/c/safeport-law-credit-repair-revies | editorial | medium | 2026-07-03 |
| Safeport Law | setup_fee | Initial Working Fee historisch = ~1 Monatsrate ($89–$129, je nach Preisstand); aktueller Wert offen — manuell verifizieren | https://financebuzz.com/safeport-law-review | editorial | medium | 2026-07-03 |
| Safeport Law | typical_total_cost_6mo | ~$594–$909 je nach Preisstand ($99×6 bzw. $129+6×$129,99) — erst nach Preis-Verifikation seeden | abgeleitet | editorial | low | 2026-07-03 |
| Safeport Law | dispute_scope | Anwaltsgeführte Bureau-Challenges (alle 3 Bureaus) + Creditor Interventions + Score-Analyse/Tracking; **KEINE Cease-&-Desist- oder Debt-Validation-Services** (engster Dispute-Scope im Feld — FinanceBuzz grenzt explizit gegen Wettbewerber ab) | https://financebuzz.com/safeport-law-review | editorial | high | 2026-07-03 |
| Safeport Law | guarantee | 90-Tage-Geld-zurück auf Credit Cleanse: voller Refund, wenn binnen 90 Tagen kein disputetes Item entfernt wurde (setzt ~3 Monatszahlungen voraus) | https://www.consumersadvocate.org/credit-repair-es/c/safeport-law-credit-repair-revies | editorial | high | 2026-07-03 |
| Safeport Law | states_note | Widersprüchlich: ConsumersAdvocate/Banks.com „nicht in South Carolina" vs. FinanceBuzz „alle 50 Staaten inkl. SC" — **offen, vor Seeding klären**; konservativ: „48+ Staaten, SC unklar" oder SC-Ausschluss übernehmen | https://financebuzz.com/safeport-law-review | editorial | low | 2026-07-03 |
| Safeport Law | bbb_rating | A- , BBB-akkreditiert seit 30.03.2023 (LaGrange-GA-Profil); einzelne Quellen nennen inzwischen „A" | https://www.bbb.org/us/ga/lagrange/profile/credit-repair-services/safeport-law-0743-91820374 | regulator | high | 2026-07-03 |
| Safeport Law | trustpilot | **Kein Trustpilot-Profil auffindbar.** Alternativen: Birdeye 4,7/734 · Google 4,7 (Reviews loben Service-Qualität, kaum belastbare Aussagen zu Removal-Ergebnissen) | https://reviews.birdeye.com/safeport-law-169693653374509 | editorial | medium | 2026-07-03 |
| Safeport Law | accreditation | Keine NACSO-/Branchenakkreditierung behauptet; Trust-Anker ist der Kanzleistatus (Attorney-led; CNBC Select: „more than two dozen lawyers") + BBB-Akkreditierung | https://www.cnbc.com/select/best-credit-repair-companies/ | editorial | medium | 2026-07-03 |
| Safeport Law | regulatory_history | **Sauber**: keine CFPB-Beschwerden (FinanceBuzz-Prüfung Nov 2024), keine Enforcement-Actions gefunden. Entität: Coleman Legal, LLC, Betriebsstart 12.06.2022, Inkorporation 10.03.2023, Managing Partner Joy Coleman, Esq. (JD Capital University 2007). **Keinerlei Verbindung zum Progrexion/Lexington-Geflecht (Utah) auffindbar** — eigenständige Gründung, kein Rebrand | https://financebuzz.com/safeport-law-review | editorial | medium | 2026-07-03 |

### 5. MSI Credit Solutions (MSI Credit Solutions, LLC, Dallas TX — seit Dez 2006)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| MSI Credit Solutions | monthly_fee | $98/Monat (Einzel); Paare: $69 pro Person („monthly savings of $58") — offizielle Cost-Seite | https://msicredit.com/blog/cost/ | official | high | 2026-07-03 |
| MSI Credit Solutions | setup_fee | „TBD" — Initialgebühr variiert nach Fallkomplexität (Anzahl/Alter/Art der Negativ-Items), kein Festpreis („we do not offer fixed rate services") → als „variabel, nach kostenlosem Audit" ausweisen, KEINEN Dollarwert seeden | https://msicredit.com/blog/cost/ | official | high | 2026-07-03 |
| MSI Credit Solutions | typical_total_cost_6mo | $588 + variable Initialgebühr (6×$98; offizielle Angabe „average enrollment: six months") — nur mit Fußnote „zzgl. individueller Initialgebühr" verwenden | https://msicredit.com/ | official | medium | 2026-07-03 |
| MSI Credit Solutions | dispute_scope | Late Payments, Collections, Charge-offs, Repossessions, Foreclosures, Bankruptcies, Tax Liens, Judgments (breiteste Item-Abdeckung); Details zu Debt-Validation/Goodwill/C&D nicht offiziell aufgeschlüsselt | https://msicredit.com/ | official | high | 2026-07-03 |
| MSI Credit Solutions | guarantee | Rückerstattung der Initialgebühr, wenn „minimum deletion standards" nicht erreicht werden und der Kunde seine Mitwirkungspflichten erfüllt hat (ergebnisgebundene Garantie, kein Zeitfenster-Refund) | https://msicredit.com/faqs/ | official | medium | 2026-07-03 |
| MSI Credit Solutions | states_note | **Offen — nicht verifiziert.** Keine offizielle Staaten-Liste auffindbar; TX-basiert mit 4 Standorten, bilingualer Support. Vor Seeding klären, sonst neutral „Kontakt erforderlich" | — | — | low | 2026-07-03 |
| MSI Credit Solutions | bbb_rating | **C+ (NICHT akkreditiert)** — BBB-File seit 07.03.2007. Kontrast zum Money.com-„Best for Customized Pricing"-Halo aus der Shortlist; im Cockpit ehrlich ausweisen | https://www.bbb.org/us/tx/dallas/profile/credit-repair-advanced-fee/msi-credit-solutions-llc-0875-90038084 | regulator | medium | 2026-07-03 |
| MSI Credit Solutions | trustpilot | 4,8/5 „Excellent" (msicredit.com-Profil); Google 4,8/2.225 (größte Review-Basis im Feld) | https://www.trustpilot.com/review/msicredit.com | official | medium | 2026-07-03 |
| MSI Credit Solutions | accreditation | **Zertifiziertes NACSO-Mitglied** (einziger Kandidat mit belastbarem NACSO-Beleg); zudem Texas SOS-registriert + gebonded, CROA-konform | https://www.bbb.org/us/tx/dallas/profile/credit-repair-advanced-fee/msi-credit-solutions-llc-0875-90038084 | regulator | medium | 2026-07-03 |
| MSI Credit Solutions | regulatory_history | Keine CFPB-/FTC-/State-AG-Enforcement gefunden. Fußnote: Jones v. MSI Credit Solutions LLC (3:23-cv-01796, eingereicht 08/2023, beendet 08/2024) — privates Bundesverfahren, Klagegrund nicht verifizierbar (CourtListener WAF-blockt) → NICHT publizieren, nur interner Vermerk | https://www.courtlistener.com/docket/67685800/jones-v-msi-credit-solutions-llc/ | regulator | low | 2026-07-03 |

### 6. Credit Firm (CreditFirm.net, Deerfield IL — anwaltsgegründet, Preis-Anker des Feldes)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Credit Firm | monthly_fee | $49,99/Monat „pay as you go", jederzeit kündbar — mit Abstand niedrigster Preis eines seriösen Anbieters | https://www.creditfirm.net/ | official | high | 2026-07-03 |
| Credit Firm | setup_fee | $0 — kein Setup-Fee-Ausweis auf der offiziellen Site; TopConsumerReviews bestätigt „no set-up fee" | https://www.creditfirm.net/ | official | medium | 2026-07-03 |
| Credit Firm | typical_total_cost_6mo | $300 (6×$49,99) — günstigster Total-Cost im Feld (3,4× günstiger als The Credit Pros wäre) | abgeleitet | official | medium | 2026-07-03 |
| Credit Firm | dispute_scope | **Unbegrenzt in allen Kategorien**: Bureau-Challenges (typisch 5–7 Accounts/Bureau/Runde), Debt-Validation, Goodwill-Interventions, Inquiry-Challenges; Cease-&-Desist nicht explizit gelistet | https://www.creditfirm.net/ | official | high | 2026-07-03 |
| Credit Firm | guarantee | **Keine Geld-zurück-Garantie beworben** (einziger Ranked-Kandidat ohne; ehrlich als Contra ausweisen — kompensiert durch Preis + monatliche Kündbarkeit) | https://www.creditfirm.net/ | official | medium | 2026-07-03 |
| Credit Firm | states_note | Shortlist/TopConsumerReviews: alle 50 Staaten; offizielle Site macht keine Staaten-Aussage → medium, vor Seeding gegen ToS prüfen | https://www.topconsumerreviews.com/best-credit-repair-companies/ | editorial | medium | 2026-07-03 |
| Credit Firm | bbb_rating | A+/A (Quellen uneins), NICHT akkreditiert; BBB-Kundenreviews ~3/5 | https://www.bbb.org/us/il/deerfield/profile/credit-repair-services/credit-firmnet-0654-88487834 | regulator | medium | 2026-07-03 |
| Credit Firm | trustpilot | 2,5/5 aus 46–61 Reviews (gemischt: Score-Erfolge vs. „kein Fortschritt/Kündigungsprobleme") | https://www.trustpilot.com/review/www.creditfirm.net | official | medium | 2026-07-03 |
| Credit Firm | accreditation | Registrierte Credit Services Organization, CROA-konform; anwaltsgegründet („founded by a team of attorneys specializing in consumer credit and FCRA"), aktuelle Anwalts-Beteiligung an Disputes unklar — nicht als „attorney-led" labeln | https://www.creditfirm.net/ | official | medium | 2026-07-03 |
| Credit Firm | regulatory_history | Keine CFPB-/FTC-/State-AG-Enforcement gefunden (Suche 2026-07-03) | https://several.com/credit-repair/credit-firm | editorial | medium | 2026-07-03 |

---

## Ausschluss-Kandidaten (Fakten-Matrix)

### Lexington Law — Owner §7.2 bestätigt: NICHT ins Ranked-Feld

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Lexington Law | operating_status_2026 | **Operiert weiter und nimmt neue Kunden an** (Stand Feb 2026): Vorgänger-Entität John C. Heath, Attorney at Law PC in der Insolvenz aufgelöst; Tradename gekauft von **Oquirrh Mountain Law Group, P.C.**, die als „dba Lexington Law Firm" firmiert (Bizapedia-Registereintrag WV bestätigt dba). Landesweit außer **Oregon** | https://getoutofdebt.org/241435/is-lexington-law-legit-ai-review | editorial | high | 2026-07-03 |
| Lexington Law | cfpb_judgment | Stipulated Judgment (Aug 2023, Case 2:19-cv-00298-BSJ, D. Utah): **$2,7 Mrd. Judgment** + **10-Jahres-Telemarketing-Verbot** (läuft bis ~2033) + $45,8 Mio. Civil Money Penalty gegen Progrexion Marketing + $18,4 Mio. gegen die Heath-Kanzlei. Vorausgegangen: Partial Summary Judgment 10.03.2023 — Advance-Fee-Verstoß gegen die Telemarketing Sales Rule als erwiesen festgestellt. $1,8 Mrd. Rückerstattungen an 4+ Mio. Kunden (CFPB Victims Relief Fund, Verteilung ab Dez 2023) | https://www.consumerfinance.gov/about-us/newsroom/cfpb-reaches-multibillion-dollar-settlement-with-credit-repair-conglomerate/ | regulator | high | 2026-07-03 |
| Lexington Law | chapter_11_status | PGX Holdings + verbundene Entitäten: Chapter-11-Filing Juni 2023, ~80 % Personal-/Betriebsabbau; Heath-Kanzlei in der Insolvenz **aufgelöst** (nicht restrukturiert) — die heutige Betreiberin ist eine Nachfolge-Entität per Tradename-Kauf | https://getoutofdebt.org/241435/is-lexington-law-legit-ai-review | editorial | high | 2026-07-03 |
| Lexington Law | monthly_fee | $139,95/Monat, EIN Plan (die alten Concord-Tiers $89–$139 existieren nicht mehr), keine Initialgebühr (1. Zahlung 5–15 Tage nach Enrollment) — bisheriges SmartFinPro-MDX ($89–$139 + $99 Setup) ist veraltet | https://www.lexingtonlaw.com/our-services/pricing | official | medium | 2026-07-03 |
| Lexington Law | reputation_2026 | BBB **NR (Not Rated)**, 140 BBB-Beschwerden/3 Jahre; **676 CFPB-Beschwerden**; Trustpilot 2,3–2,6/5 aus ~604–615 Reviews (Feb–Jun 2026) — schlechtestes Reputationsprofil aller untersuchten Anbieter | https://www.trustpilot.com/review/lexingtonlaw.com | official | high | 2026-07-03 |
| Lexington Law | marketing_flag | Yahoo-Finance-verbreitete „Named Best Credit Repair Company of 2026"-Meldung (Tidewater News) = bezahltes Pressemitteilungs-Placement, kein unabhängiges Ranking — nicht als Trust-Signal verwerten; kein einziges geprüftes unabhängiges 2026er-Ranking (Money, CNBC, ConsumerAffairs, TopConsumerReviews) führt Lexington noch als Empfehlung | https://finance.yahoo.com/news/lexington-law-firm-named-best-013700719.html | editorial | medium | 2026-07-03 |

### The Credit Pros — Ausschluss empfohlen (Urteils-Abschnitt 2)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| The Credit Pros | monthly_fee | $69,99 (Money Management — **kein echtes Credit Repair**, nur 1 Bureau) / $129 (Prosperity) / $149 (Success Plus) + Setup $119/$129/$149 → teuerster Credit-Repair-Anbieter im Vergleichsfeld ($903 für 6 Monate Prosperity) | https://www.topconsumerreviews.com/best-credit-repair-companies/reviews/the-credit-pros.php | editorial | high | 2026-07-03 |
| The Credit Pros | guarantee | 60-Tage-„Satisfaction Guarantee" = 2 Monate Service-Verlängerung gratis, **KEINE Rückerstattung** — schwächste Garantie der Kategorie | https://www.topconsumerreviews.com/best-credit-repair-companies/reviews/the-credit-pros.php | editorial | high | 2026-07-03 |
| The Credit Pros | states_note | NICHT in ME, KS, MN, OR | https://www.topconsumerreviews.com/best-credit-repair-companies/reviews/the-credit-pros.php | editorial | medium | 2026-07-03 |
| The Credit Pros | trustpilot_flag | **Fake-Review-Muster bestätigt:** Trustpilot hat gekaufte/gefälschte Reviews entfernt und den TrustScore zeitweise suspendiert; Unternehmen bietet $50 Rabatt für Trustpilot-Reviews (incentivierte Bewertungen). Zeitlinie widersprüchlich: getoutofdebt (Feb 2026) „wieder aktiv, 4,9/3.928"; TopConsumerReviews (03.07.2026) „flagged, Score nicht verfügbar" → der 4,9-Score ist in JEDEM Fall unbrauchbar als Ranking-Signal | https://getoutofdebt.org/241621/is-the-credit-pros-legit-ai-review | editorial | high | 2026-07-03 |
| The Credit Pros | litigation | **47 Bundesgerichtsverfahren, überwiegend TCPA-Telemarketing**; Champion v. Credit Pros (D.N.J.): Gericht ließ 08/2022 persönliche TCPA-Haftungsklage gegen den Präsidenten/Chief Compliance Officer (Kaplan) zu (47 U.S.C. §217, „more than tangentially involved"). Keine CFPB-/FTC-Enforcement-Action — aber das Litigation-Volumen ist ein Ausreißer im Feld | https://natlawreview.com/article/getting-personal-credit-pros-president-and-chief-compliance-officer-kaplan-stuck | editorial | high | 2026-07-03 |
| The Credit Pros | bbb_rating | A+ (akkreditiert) — aber 60+ Beschwerden/3 Jahre, BBB-Reviews 3,87/154; TopConsumerReviews-Gesamturteil 03.07.2026: **1,4/10 „not worth your time or money"** | https://www.topconsumerreviews.com/best-credit-repair-companies/reviews/the-credit-pros.php | editorial | high | 2026-07-03 |

### Ovation Credit Services — defunkt (Shortlist-Slot #7 entfällt)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Ovation Credit Services | operating_status | **Geschlossen zum 30.06.2023** durch LendingTree (Kostensenkungsprogramm nach 2022er-Verlusten; ~200 Stellen Jacksonville, WARN-Letter). Kein Betrieb, keine Neuannahme — darf in keinem 2026er-Ranking mehr auftauchen. `best-credit-repair-companies.mdx` rankt Ovation aktuell noch #7 → Pflicht-Content-Fix | https://several.com/credit-repair/ovation-credit-services | editorial | high | 2026-07-03 |

---

## Urteils-Abschnitt (die 6 angeforderten Judgment Calls)

### 1. Lexington Law vs. Safeport Law — der zentrale Call

**Empfehlung: Lexington Law KOMPLETT aus dem Ranked-Feld ausschließen (Plus500-US-Präzedenz), Safeport Law als Attorney-led-Slot aufnehmen. Die Owner-Entscheidung §7.2 wird durch die frische Faktenlage voll bestätigt — und verschärft.**

Frisch verifizierter Stand (2026):

- **Lexington Law existiert noch** — aber nicht als dieselbe Firma. Die Kanzlei John C. Heath, Attorney at Law PC wurde in der Chapter-11-Insolvenz **aufgelöst**; eine Nachfolge-Entität (**Oquirrh Mountain Law Group, P.C.**) hat den Markennamen gekauft und betreibt das Geschäft unter „Lexington Law Firm" weiter (Stand Feb 2026: nimmt neue Kunden an, $139,95/Monat Einzelplan, landesweit außer Oregon).
- **Das 10-Jahres-Telemarketing-Verbot ist aktuell** (Stipulated Judgment Aug 2023 → läuft bis ~2033) und das **$2,7-Mrd.-Judgment ist bestandskräftig**; $1,8 Mrd. wurden ab Dez 2023 an 4+ Mio. geschädigte Kunden verteilt. Der Kern des Geschäftsmodells (telefonisch verkaufte Vorab-Gebühren) wurde gerichtlich als illegal festgestellt — das ist kein „Vorfall", sondern ein adjudiziertes Geschäftsmodell-Problem.
- **Reputations-Ist 2026:** BBB NR · 140 BBB-Beschwerden/3J · 676 CFPB-Beschwerden · Trustpilot 2,3–2,6 (~610 Reviews). Kein geprüftes unabhängiges 2026er-Ranking empfiehlt Lexington noch; die kursierende „Best of 2026"-Meldung ist ein bezahltes PR-Placement.
- **Warum Ausschluss statt Featuring-mit-Disclosure (Debt-Relief-Präzedenz Freedom):** Freedom Debt Relief hatte trotz FTC/CFPB-Historie ein intaktes, marktführendes Kerngeschäft mit AFCC-Akkreditierung und positiven unabhängigen Rankings — Disclosure war dort verhältnismäßig. Bei Lexington ist der Fall strukturell: die verurteilte Entität ist aufgelöst, die Nachfolge-Entität ist ein Tradename-Käufer ohne eigenen Track-Record, das Reputationsbild ist das schlechteste des Feldes und die Kern-Attribute (Garantie schwächer, Preis höher, BBB NR) verlieren jeden Spaltenvergleich. Ein Ranking-Slot „mit Warnhinweis" würde dem Nutzer eine Empfehlung suggerieren, die keine Datengrundlage hat → **sauberer Ausschluss** (wie Plus500 US im Forex-Slice).
- **Safeport Law ist eine glaubwürdige, distinkte Alternative — kein Rebrand:** Coleman Legal, LLC (LaGrange, Georgia), Betriebsstart Juni 2022, Managing Partner Joy Coleman, Esq. (JD Capital University 2007) — keinerlei auffindbare personelle, gesellschaftsrechtliche oder geografische Verbindung zum Salt-Lake-City-Geflecht PGX/Progrexion/Heath. BBB-akkreditiert (A-) seit März 2023, keine CFPB-Beschwerden, von CNBC Select und Money.com unabhängig gelistet („more than two dozen lawyers", 90-Tage-Geld-zurück). Pikant und für buyerGuide/Methodology nutzbar: Georgia schränkt gewerbliche Credit-Repair-Services gesetzlich stark ein — als Anwaltskanzlei fällt Safeport unter die Anwalts-Ausnahme, was das Attorney-led-Modell dort strukturell erklärt (und erklärt, warum z. B. Credit Saint GA ausschließt).
- **Ehrliche Caveats zu Safeport (in cons/deep_dive aufnehmen):** jung (2022), nur EIN Programm, engster Dispute-Scope des Feldes (keine Debt-Validation/C&D), kein Trustpilot-Profil, Preisangaben zwischen Quellen volatil ($89,99 → $129,99 → $99) → Preis vor Seeding manuell verifizieren (Site WAF-blockt Fetches), Reviews loben primär Service-Erlebnis statt belegter Removal-Ergebnisse.
- **Zusatz-Task bestätigt und erweitert:** `lexington-law-review.mdx` bekommt den Compliance-Hinweis-Block (CFPB-Urteil, Entitätswechsel, aktueller Preis $139,95 statt der veralteten $89–$139) — Review bleibt online (SEO-Traffic auf „Lexington Law Review" ist informationssuchend; die Seite wird zur Warn-/Aufklärungsseite mit Redirect-CTA auf die Cockpit-Seite). Der `/go/lexington-law`-CTA ist doppelt tot: kein `affiliate_links`-Row + Bewerbung wäre compliance-widrig → CTA aus dem MDX entfernen.

### 2. The Credit Pros — Ausschluss empfohlen

**Empfehlung: NICHT ins Ranked-Feld, auch nicht mit Disclosure.** Verifizierter Stand:

1. **Fake-Review-Muster bestätigt, nicht historisch erledigt:** Trustpilot entfernte gekaufte Reviews und suspendierte den TrustScore; das Unternehmen incentiviert Reviews weiterhin mit $50-Rabatt. Die Quellen widersprechen sich, ob der Score aktuell wieder live (4,9/3.928, Feb 2026) oder erneut geflaggt ist (TopConsumerReviews, 03.07.2026) — für das Cockpit ist das egal: **der Trustpilot-Score dieses Anbieters ist als Attribut unbrauchbar**, und „Consumer-Review-Score" ist eine Kernspalte dieser Kategorie. Ein Kandidat, dessen zentrales Vergleichsattribut manipuliert ist, bricht die Integrität der ganzen Vergleichstabelle.
2. **Litigation-Ausreißer:** 47 Bundesverfahren (überwiegend TCPA) inkl. Ruling, das den Präsidenten/CCO persönlich haftbar hält (Champion v. Credit Pros, D.N.J. 2022). Keine CFPB/FTC-Enforcement — aber kein anderer Kandidat im Feld hat auch nur ansatzweise dieses Klagevolumen.
3. **Produkt-seitig schwach:** teuerster Anbieter ($903/6 Monate Prosperity), schwächste Garantie (Service-Verlängerung statt Refund), Einstiegsplan ist gar kein Credit Repair (1-Bureau-Monitoring). TopConsumerReviews heute: 1,4/10.
4. **Abgrenzung zur Freedom-Präzedenz (Disclosure statt Ausschluss):** Freedom hatte kompensierende Stärken (Marktführerschaft, Akkreditierung, unabhängig validierte Ergebnisse). The Credit Pros hat keine kompensierende Stärke, die den Slot rechtfertigt — nur das „Best for Extra Services"-Label von Money.com, dessen Bündel-USP (3-Bureau-Monitoring) auch über die Credit-Monitoring-Cockpit-Seite (Slice 6) abgedeckt wird. → **Plus500-Muster: weglassen ist sauberer als jede Workaround-Disclosure.**

### 3. Finale Ranked-Kandidaten-Zahl: 6 (nicht 8 oder 9)

Rechenweg: 9 Shortlist-Slots − Lexington Law (Owner §7.2 + Abschnitt 1) − Ovation (defunkt seit 30.06.2023) − The Credit Pros (Abschnitt 2) = **6 Ranked-Kandidaten: Credit Saint · Sky Blue Credit · The Credit People · Safeport Law · MSI Credit Solutions · Credit Firm.**

**Nicht auffüllen** (Forex-Präzedenz 7→5): Die geprüften unabhängigen 2026er-Rankings validieren ein kleines Feld — Money.com führt selbst nur „5 Best". Denkbare Auffüller (Dovly AI, Pyramid Credit Repair, AMB) haben keinen Multi-Quellen-Konsens und keine Slice-Recherche; ein 7.–9. Slot wäre Polsterung. Sechs Kandidaten mit vollständiger Quellenmatrix schlagen acht mit zwei Wackel-Rows. Die 6 decken zudem alle Kaufintentionen ab: günstigster Preis (Credit Firm $49,99), stärkste Garantie (Sky Blue no-strings), niedrigster Einstieg (The Credit People $19), Attorney-led (Safeport), Paar-Tarif/individuelles Pricing (MSI), aggressivste Eskalation (Credit Saint Clean Slate).

### 4. Kostenmodell-Empfehlung: neues Kind `'monthly-plus-setup'` (kleiner Shared-Code-Change — explizit geflaggt)

**Die Preisform der Kategorie ist ein flaches Monats-Abo + einmalige First-Work-Fee — keins der 3 existierenden CostModel-Kinds bildet das ehrlich ab:**

- `compounding-fee`: es gibt kein wachsendes Guthaben, auf das eine %-Fee wirkt — falsch.
- `banking` (`annualCost × years`): nutzt die Legacy-Usage-Annahmen (FX/ATM) und skaliert mit *Jahren* — Credit Repair läuft aber 3–12 *Monate* und endet; eine Jahres-Multiplikation suggeriert Dauerkosten, die es nicht gibt — irreführend.
- `fee-on-amount`: Kosten = % × Betrag. Es gibt keinen „Betrag" — die Kosten sind vom Schulden-/Item-Volumen unabhängig. Man könnte per `flatFeeAccessor` JEDEM Anbieter einen Fixbetrag geben (funktioniert heute ohne Code-Change), aber dann sind beide Slider tot: der Nutzer bewegt „Amount" und nichts passiert — eine kaputte UI und semantischer Missbrauch des Debt-Relief-Sonderfalls. **Verworfen.**

**Empfehlung — neues, viertes Kind in `CostModelDef` (`lib/comparison/topics/types.ts:70-71`) + Branch in `costOverTime` (`lib/comparison/cost.ts`):**

```
kind: 'monthly-plus-setup'
cost = setupFee(p) + monthlyFee(p) × inputs.amount   // amount-Slider = Monate im Programm
```

- Der vorhandene **amount-Slider wird zum Monats-Dial**: `amountLabel: 'Months in program'`, `amountMin: 3`, `amountMax: 12`, `amountStep: 1`, `amountDefault: 6` (6 Monate = offizieller MSI-Durchschnitt + Branchen-Konsens 3–6). `years` wird ignoriert wie bei `fee-on-amount`. Accessors: `monthlyFee` aus der bestehenden Top-Level-Spalte, Setup aus `attributes.setup_fee` (via `feeAccessor`-analogem `setupFeeAccessor` oder Reuse von `flatFeeAccessor`-Pattern).
- **Das ist ein Cross-Topic-Shared-Code-Change** (types.ts-Union + cost.ts + Unit-Tests) — größer als eine Single-Topic-Config, aber exakt der Umfang, den Slice 1 für `fee-on-amount` bereits präzedenziert hat. Pflicht-Tests analog: (a) setup + monthly×months korrekt, (b) `years` ohne Einfluss, (c) **Regression: `compounding-fee`, `banking`, `fee-on-amount` liefern unveränderte Werte** (beide Referenzseiten + Debt-Relief dürfen sich nicht ändern). Per Model-Routing-Regel #2 gehört der Diff vor Merge in einen Fable-5-Review.
- **Echte Zahlen (6-Monats-Programm, Einstiegs-/Kern-Plan) — die Differenzierung ist real (3,4×-Spread):**

| Anbieter | Setup | Monatlich | 6-Monats-Total |
|---|---|---|---|
| Credit Firm | $0 | $49,99 | **$300** |
| Sky Blue (Full Service) | $0* | $99 | **$594** |
| The Credit People (Standard) | $19 | $99 | **$613** (Flat-Rate-Alternative: $599) |
| Safeport Law | ~$0–129* | ~$99* | **~$594–909*** (Preis vor Seeding verifizieren) |
| MSI (Einzel) | variabel | $98 | **$588 + Initialgebühr** (Fußnote) |
| Credit Saint (Polish) | $99 | $79,99 | **$579** (Clean Slate: $1.035) |
| — ausgeschlossen: The Credit Pros (Prosperity) | $129 | $129 | $903 |
| — ausgeschlossen: Lexington Law | $0 | $139,95 | $840 |

  \* siehe Konfidenz-Vermerke in der Matrix. Bei 12 Monaten spreizt sich das Feld weiter ($600 vs. $1.775) — der Monats-Slider trägt also echte Information, anders als der $0-Patt bei Trading Platforms.
- **Slider-Semantik ehrlich dokumentieren** (methodology): „Costs assume your chosen plan's monthly fee for the full program length; most providers recommend 3–6 months minimum. Credit repair companies cannot legally charge for results in advance (CROA)."

### 5. Attribution-Gate / `affiliate_links`-Ist-Zustand (DB-verifiziert 2026-07-03)

- **`the-credit-people`** (id `d4943ddb…`, category `credit-repair`, market `us`, active, healthy, cpa 0): Destination ist `https://www.thecreditpeople.com/` — **nackter Homepage-Link ohne Referral-/SubID-Parameter** → null Attribution möglich. Gate-konform: **`review`-CTA** (identischer Befund wie FOREX.com im Slice 4), bis ein echter Tracking-Link (Partnerprogramm mit SubID + Postback) verifiziert ist. `tracking_status` bleibt unverändert.
- **`/go/credit-saint` + `/go/lexington-law`: KEINE Rows in `affiliate_links`** — beide werden aber in MDX-Content als `affiliateUrl`/AffiliateButton verlinkt (tote `/go`-Ziele, vgl. Orphan-Slug-Befund der Mai-Analyse). Fix gehört in den Content-Hygiene-Teil des Slice (CTAs entfernen/ersetzen), NICHT durch Anlegen erfundener Link-Rows (Guardrail 6).
- **Alle übrigen Ranked-Kandidaten (Credit Saint, Sky Blue, Safeport, MSI, Credit Firm): keine DB-Rows** → per Standardregel `external_url`-Visit-CTAs auf `product_attributes` (`is_affiliate=false`), keine neuen `affiliate_links`-Rows nötig.
- Monetarisierungs-Perspektive (Folgetask, nicht Slice-Blocker): Credit Saint und The Credit People betreiben Partnerprogramme über Affiliate-Netzwerke; erst Netzwerk-Link mit SubID-Struktur + Postback verifizieren, dann `tracking_status` per Migration setzen (Mercury-Muster).

### 6. Akkreditierung: Es gibt KEIN AADR/IAPDA-Äquivalent mit Substanz — Schema-Konsequenz

Recherche-Ergebnis zur Frage „existiert ein Branchen-Gütesiegel wie AADR/IAPDA für Credit Repair?": **Nein, nichts Gleichwertiges.**

- **NACSO** (National Association of Credit Services Organizations, seit 2007, Präsident Robby Birnbaum, aktiv Stand Ende 2025) ist der nächstliegende Kandidat — aber ein dünner, selbstregulierender Branchenverband ohne unabhängige Prüfsubstanz und ohne verlässlich publizierte Mitgliederliste. Belastbar bestätigt ist nur **MSI** als zertifiziertes Mitglied; die Aggregator-Behauptung, auch Credit Saint/Sky Blue/The Credit People seien akkreditiert, ist nicht gegen nacso.org verifizierbar → **tri-state `nacso: boolean | null` seeden (Debt-Relief-`afcc`-Muster), nur MSI = true, Rest = null.**
- IAPDA zertifiziert Einzelpersonen („FICO Scoring Model Specialist"), keine Firmen — kein Spalten-Kandidat.
- **Die ehrlichen Trust-Marker der Kategorie sind andere** und sollten die Spalten stellen: `attorney_led` (Safeport ja; Credit Firm nur „anwaltsgegründet" → nein), `bbb_accredited` + BBB-Grade (nur Credit Saint + Safeport akkreditiert!), CROA-Konformität + State-Bonding (methodology-Content), Geld-zurück-Garantie-Typ. Empfohlene specColumns: Monthly fee (winner: min) · Money-back guarantee · BBB rating/accredited · Attorney-led.

### 7. Soft-live vs. Ranked-live

**Ranked-live ist erreichbar, aber erst nach 3 manuellen Verifikationen** (alle nur wegen WAF-Blocks offen, nicht wegen Quellenlage): (1) Safeport-Preis + Initial-Fee (safeportlaw.com im Browser), (2) Credit-Saint-Staaten-Liste + Guarantee-Scope (creditsaint.com/terms-of-service im Browser), (3) The-Credit-People-Setup-Fee $19 (Checkout). Ohne diese drei: Soft-live-Auflagen aus Guardrail 4 beachten (inkl. `products[0]`-Gate-Fix für Homepage-Chip + OG-Image). Kein Attribut der 6 Ranked-Kandidaten steht auf `low` außer den drei genannten + MSI-Staaten (dort neutraler Text statt Claim). Consumer-Review-Spalte: wegen der Plattform-Heterogenität (Trustpilot-Samples teils <50) Score+Quelle+Anzahl IMMER zusammen ausweisen, nie nackte Zahl.

### 8. Content-Hygiene-Befunde (Pflicht-Folgetasks im Slice, aus dieser Recherche)

1. **`best-credit-repair-companies.mdx` ist in seinem heutigen Zustand ein Compliance-Risiko** und muss im Slice überarbeitet werden (die Plan-Zeile „ggf. prüfen" ist damit beantwortet: ja, zwingend):
   - Rankt **Ovation Credit auf #7** — Firma seit 30.06.2023 defunkt.
   - Rankt **Lexington Law auf #2** mit AffiliateButton `/go/lexington-law` (kein DB-Row, Bewerbung konterkariert Owner §7.2) und veralteten Preisen ($89–$139 + $99 Setup; real: $139,95, kein Setup).
   - Behauptet **„All 7 companies A+ BBB rated"** — falsch: The Credit People C+, MSI C+, Lexington NR.
   - Behauptet für The Credit People **„Trustpilot 4,6 aus 12.847 Reviews"** — reales Profil: 1,8 „Poor" bei kleiner Review-Zahl; die 12.847 sind nicht belegbar.
2. **`lexington-law-review.mdx`**: Compliance-Hinweis-Block (Owner §7.2) + Preis-/Entitäts-Update + `/go/lexington-law`-CTA entfernen; Frontmatter-Rating 4,3 überprüfen (mit CFPB-Urteil, BBB NR und Trustpilot 2,3 nicht haltbar).
3. **`the-credit-people-review.mdx`**: Garantie-Beschreibung korrigieren („90-day money-back" → „Erstattung letzte + vorletzte Monatsrate, jederzeit kündbar"), Preis-Tiers aktualisieren ($99/$119 + $599-Flat statt $79–$119), BBB-/Trustpilot-Angaben real ausweisen.
4. **`credit-saint-review.mdx`**: Staaten-Liste erweitern (GA, KS, LA, SC, VT statt nur GA/SC); First-Work-Fee prüfen (MDX sagt $49 — Multi-Quellen-Konsens 2025/2026: $99/$195).

---

## Empfohlene Kandidaten-Aufstellung für Slice 5 (Ergebnis dieser Recherche)

| Rang-Slot | Provider | Render-Empfehlung | Begründung |
|---|---|---|---|
| 1–6 (ranked) | Credit Saint · Sky Blue Credit · The Credit People · Safeport Law · MSI Credit Solutions · Credit Firm | The Credit People `review`-CTA (Link aktiv, aber nackte Homepage-URL = keine Attribution); alle anderen `external_url`-Visit | Vollständiges ehrliches US-Feld; deckt alle Kaufintentionen ab; Money.com führt selbst nur 5 |
| nicht ranked | Lexington Law | Ausschluss (Plus500-Muster); Review-MDX bleibt online als Warn-/Aufklärungsseite mit Compliance-Block, CTA raus | $2,7-Mrd.-CFPB-Urteil, Entität aufgelöst, Nachfolger per Tradename-Kauf, BBB NR, Trustpilot 2,3, Telemarketing-Verbot bis ~2033 |
| nicht ranked | The Credit Pros | Ausschluss, keine Infokarte | Fake-Review-Muster macht die Kern-Vergleichsspalte unbrauchbar; 47 TCPA-Verfahren; teuerster Anbieter, schwächste Garantie |
| nicht ranked | Ovation Credit Services | Entfällt vollständig (defunkt 30.06.2023) + aus `best-credit-repair-companies.mdx` entfernen | LendingTree-Shutdown; Firma existiert nicht mehr |
| Sidebar/buyerGuide | — | GA-Recht-Kontext (Anwalts-Ausnahme erklärt Safeports Modell + Credit Saints GA-Ausschluss), CROA-Rechte (Selbsthilfe kostenlos, AnnualCreditReport.com), NACSO-Einordnung | AEO-/E-E-A-T-Content statt zusätzlicher Ranking-Slots |
