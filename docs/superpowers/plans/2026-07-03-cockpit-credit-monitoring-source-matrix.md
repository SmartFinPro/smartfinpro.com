# Source-Matrix: Best Credit Monitoring Services (US) — Comparison Cockpit Slice 6

> **Stand: 2026-07-03** · Recherche durch Fable 5 (per Model-Routing-Regel des Phase-D-Plans: compliance-sensitives Thema) · Guardrail-5-konform: jede Zeile trägt `source_url`, `source_type`, `confidence`, `data_verified_at`.
>
> Topic: `personal-finance/credit-monitoring` · Markt: US · Kandidaten gemäß Shortlist (`docs/superpowers/specs/2026-07-02-best-x-candidate-shortlist.md` §4, im Haupt-Repo — **Achtung: die Spec-Datei ist untracked und liegt NICHT im Worktree**) + Plan-Zeile Slice 6 („Alle 9 neu; IdentityIQ nur mit BBB-Vorsichtsprüfung; PrivacyGuard/IDShield redaktionell; Keine Links → ranked-unmonetarisiert, CTAs `visit`").
>
> **Regeln:** Werte mit `confidence: low` oder Markierung „offen — nicht verifiziert" dürfen NICHT geseedet und NICHT in Rankings/Claims verwendet werden. `source_type`: `official` = Anbieter-Preisseite/Site/ToS · `editorial` = Money/CNBC Select/Security.org/NerdWallet/PCMag/AllAboutCookies u. a. · `regulator` = FTC/CFPB/Gerichtsakten/BBB-Registerdaten.
>
> **Wichtigste Recherche-Funde vorab (korrigieren bzw. schärfen die Shortlist §4):**
>
> 1. **IdentityIQs BBB-Lage hat sich seit der Shortlist GEDREHT — aber nicht sauber.** Die Shortlist flaggte „BBB B-Rating mit Billing-Beschwerdemuster". Ist-Zustand 03.07.2026: Das BBB-Profil (Identity Intelligence Group LLC, Temecula CA) zeigt **„BBB Accredited since 5/13/2026"**, aber gleichzeitig **„information is being updated, no report available at this time"** — d. h. aktuell wird GAR KEIN Grade angezeigt; Suchtreffer nennen „A+". Die frische Akkreditierung (7 Wochen alt!) ersetzt keinen Track-Record. Wichtiger: **$8,77-Mio.-Klassenklage-Settlement wegen Autorenewal-Praktiken** (Caldwell v. Identity Intelligence Group, CA Automatic Renewal Law, Zeitraum 22.03.2019–20.08.2023, Final-Approval-Hearing 19.09.2025) + anhaltende Billing-Beschwerden bis in 2026. **Urteil: Aufnahme MIT Disclosure** (Freedom-Muster, kein Credit-Pros-Muster) — Details Urteils-Abschnitt 1.
> 2. **PrivacyGuard: Ausschluss aus dem Ranked-Feld empfohlen** (Plan-Doc-Vermerk „redaktionell" wird damit konkretisiert): kein Trustpilot-Profil, einzige organische Review-Basis (ConsumerAffairs) ~1 Stern bei kleiner Anzahl → die Kern-Vergleichsspalte „Consumer-Review-Score" ist nicht ehrlich befüllbar; Parent Trilegiant/Affinion trägt ein **47-Staaten-/$30-Mio.-AG-Settlement (2013)** wegen deceptive enrollment + CFPB-Klage gegen Affinion (2015). Redaktionelle Erwähnung im buyerGuide (USP: günstigster monatlicher Tri-Bureau-Report-Refresh, $24,99) statt Ranking-Slot. Details Urteils-Abschnitt 2.
> 3. **Identity Guard bekommt KEINEN eigenen Slot, obwohl CNBC es separat rankt:** Identity Guard gehört Aura (Übernahme via Intersections/iSubscribed 2019, heute Aura-Produktlinie) — zwei Slots für dieselbe Firma/Plattform wären Schein-Diversität. Ein Slot pro Konzern (buyerGuide-Fußnote erklärt die Beziehung). Details Urteils-Abschnitt 3.
> 4. **Das ehrliche Ranked-Feld sind 8 Anbieter** (nicht 9): Aura · LifeLock · IdentityForce · Experian IdentityWorks · IdentityIQ · myFICO · IDShield · Credit Karma. Kein Auffüllen (Forex-Präzedenz 7→5, Credit-Repair-Präzedenz 9→6).
> 5. **Die Kategorie hat ECHTE $0-Anbieter — das ist ein Differenzierungsmerkmal, kein Patt:** Credit Karma ist komplett kostenlos (2-Bureau, VantageScore), Experian und myFICO haben echte Gratis-Tiers (je 1-Bureau). Anders als der $0-Kommissions-Patt bei Trading Platforms trägt der Kostenvergleich hier reale Information ($0 bis $2.094 über 5 Jahre) → **Kostenmodell `banking` (existierendes Kind, NULL Shared-Code-Change), `cost`-Sort erlaubt** + Pflicht-Spalte „Free tier". Details + echte Zahlen Urteils-Abschnitt 4.
> 6. **Regulatorik-Dichte ist der höchste aller bisherigen Slices — ironischerweise inkl. Datenpanne beim Schutzanbieter selbst:** LifeLock FTC $12 Mio. (2010) + $100 Mio. Contempt (2015, größte Order-Enforcement-Summe der FTC-Geschichte); Credit Karma FTC $3 Mio. „Pre-Approved"-Dark-Patterns (2022/23); Experian CFPB $3 Mio. (2017) + DOJ/FTC $650k CAN-SPAM (2023) + **laufende CFPB-FCRA-Klage („sham investigations", eingereicht 07.01.2025, Discovery läuft Stand Jan 2026)**; TransUnion (IdentityForce-Parent) CFPB-Consent-Order 2017 ($13,9 Mio. + $3 Mio.) und Dark-Pattern-Klage 2022 (28.02.2025 with prejudice dismissed); **Aura-Datenpanne März 2026** (~900k Kontaktdatensätze via Vishing, ShinyHunters). Nichts davon ist ein Ausschlussgrund nach Freedom-Maßstab — aber ALLES gehört in die jeweiligen cons/deep_dive-Disclosures.
> 7. **DB-Ist-Zustand `affiliate_links` (via `mcp__smartfinpro__list_affiliate_links`, 2026-07-03, 72 Rows gesamt):** **KEINE Row matcht irgendeinen der 9/10 Kandidaten** — weder in `personal-finance` (dort nur Robo/Loans/Cards: acorns, betterment, fidelity-go, robinhood-strategies, schwab-intelligent, sofi-*, stash, vanguard-digital, wealthfront) noch in einer anderen Kategorie. Plan-Doc-Angabe „Keine Links" **bestätigt** → alle 8 Ranked-Kandidaten `external_url`-Visit-CTAs auf `product_attributes` (`is_affiliate=false`), keine neuen `affiliate_links`-Rows anlegen (Guardrail 6).
> 8. **Kein bestehender Credit-Monitoring-Content, aber Adjazenz:** `content/us/credit-score/free-credit-score-check.mdx` + `content/us/credit-score/index.mdx` existieren (Credit-Score-Silo) — Interne-Verlinkungs-Chance für die Cockpit-Seite, kein Konflikt. „Alle 9 neu" bestätigt: kein Review-MDX zu einem der Kandidaten vorhanden.

---

## Haupt-Matrix (8 Ranked-Kandidaten × 10 Attribute)

**Seeding-Regel Preis:** Pro Anbieter wird der günstigste Plan mit **3-Bureau-Monitoring** geseedet (Kategorie-Kernversprechen), zum **Listen-Monatspreis bei monatlicher Abrechnung**. Wo nur Annual-Äquivalente oder Erstjahres-Intro-Preise publiziert sind, ist das in der Zeile vermerkt und VOR Seeding manuell zu verifizieren (Verifikations-Liste in Urteils-Abschnitt 7).

### 1. Aura (Aura Sub, LLC, Boston MA — Money.com #1 Identity-Theft-Protection Juli 2026)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Aura | monthly_fee | Individual $15/Monat (monatlich) bzw. $12/Monat (jährlich); Couple $29/$22; Family $50/$37. **Achtung: Quellen kennzeichnen diese Preise als Erstjahres-Intro-Raten, Renewal deutlich höher** → Listen-/Renewal-Preis vor Seeding manuell verifizieren | https://www.security.org/identity-theft/aura/ + https://allaboutcookies.org/aura-identity-theft-price-now | editorial | medium | 2026-07-03 |
| Aura | free_tier | Nein (14-Tage-Trial; 60-Tage-Geld-zurück auf Jahrespläne) | https://www.security.org/identity-theft/aura/ | editorial | high | 2026-07-03 |
| Aura | bureaus_monitored | **3-Bureau in ALLEN Plänen** (Equifax, Experian, TransUnion) — einziger Kandidat ohne Bureau-Gating nach Tier | https://www.aura.com/pricing | official | high | 2026-07-03 |
| Aura | monitoring_scope | Dark-Web, SSN, Home-Title, Bank-/Konto-Monitoring; gebündelt mit VPN/Antivirus/Passwortmanager; Money.com: schnellste Alarmierung des Feldes | https://money.com/best-identity-theft-protection/ | editorial | high | 2026-07-03 |
| Aura | id_theft_insurance | $1 Mio. pro Erwachsenem (Family-Plan: bis zu 5 Erwachsene = bis $5 Mio. aggregiert) | https://www.aura.com/pricing | official | high | 2026-07-03 |
| Aura | family_plan | Ja — 5 Erwachsene + unbegrenzt Kinder ($50/Monat monatlich, $37/Monat jährlich); Kids-Add-on $13 | https://allaboutcookies.org/aura-identity-theft-price-now | editorial | high | 2026-07-03 |
| Aura | bbb_rating | A+ (Boston-Profil) | https://www.bbb.org/us/ma/boston/profile/cyber-security/aura-0021-557119 | regulator | medium | 2026-07-03 |
| Aura | consumer_reviews | Trustpilot 4,1/5 (Stand März 2026; 84 % 5-Sterne-Anteil) — **Review-ANZAHL nicht verifiziert → Score+Anzahl vor Seeding gemeinsam erheben** (Kategorie-Regel: nie nackte Zahl) | https://www.trustpilot.com/review/aura.com | official | medium | 2026-07-03 |
| Aura | regulatory_history | Keine FTC-/CFPB-/State-AG-Enforcement-Actions gefunden. **ABER: Datenpanne März 2026** — ~900.000 Kontaktdatensätze (überwiegend Namen/E-Mails aus Marketing-Tool einer 2021-Akquisition; <20k aktive + <15k ehemalige Kunden betroffen; auch IPs/Telefon/Adressen/Support-Kommentare; laut Aura keine SSN/Passwörter/Finanzdaten), Vishing-Angriff auf Mitarbeiter, ShinyHunters bekannte sich, Zugriff ~1 Stunde. **Pflicht-Disclosure in cons** — ironischer, aber begrenzter Vorfall; Reaktion (Response-Plan, Law Enforcement) dokumentiert | https://www.securityweek.com/security-firm-aura-discloses-data-breach-impacting-900000-records/ | editorial | high | 2026-07-03 |
| Aura | editorial_consensus | Money #1 Identity-Theft (Juli 2026) · CNBC Select „Best for families" · Money Credit-Monitoring „Best low-cost" · NerdWallet-Review positiv · Security.org Top-Feld | https://money.com/best-identity-theft-protection/ + https://www.cnbc.com/select/best-identity-theft-protection-services/ | editorial | high | 2026-07-03 |

### 2. LifeLock (Gen Digital Inc., Tempe AZ — höchste Markenbekanntheit, PCMag Editors' Choice)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| LifeLock | monthly_fee | **Plan-Struktur 2026 komplett neu**: Core $12,49 (2-Bureau) / Advanced $19,99 (3-Bureau) / Total $34,99; Jahrespreise $124,99/$199,99/$349,99. Legacy-Pläne mit Norton 360 (Select $14,99, Ultimate Plus $34,99) nicht mehr regulär buchbar. **Erstjahres-Preise — Renewal-Rate höher, vor Seeding verifizieren.** Seed-Plan: **Advanced $19,99** (günstigster 3-Bureau-Plan) | https://lifelock.norton.com/products + https://www.security.org/identity-theft/lifelock/ | official | medium | 2026-07-03 |
| LifeLock | free_tier | Nein | https://lifelock.norton.com/products | official | high | 2026-07-03 |
| LifeLock | bureaus_monitored | Core: 2-Bureau · Advanced/Total: 3-Bureau (kontinuierlich) | https://support.norton.com/sp/en/us/home/current/solutions/v20250925172133820 | official | high | 2026-07-03 |
| LifeLock | monitoring_scope | Dark-Web, SSN, Konten-Alerts (Advanced: bis 5 Konten; Total: unbegrenzt), Data-Broker-Removal (neu, ab Advanced), Scam-Reimbursement ($5k Advanced/$10k Total), Total: Home-Title, SIM-Swap, 401(k)-/Investment-Fraud | https://lifelock.norton.com/learn/identity-theft-resources/new-lifelock-plans | official | high | 2026-07-03 |
| LifeLock | id_theft_insurance | „Million Dollar Protection Package": bis $1 Mio. Anwälte/Experten in allen Plänen; Stolen-Funds-/Expense-Reimbursement nach Tier gestaffelt, Total bis $1 Mio.; Legacy Ultimate Plus warb mit $3 Mio. Gesamtdeckung (3×$1 Mio.-Kategorien) — **im Cockpit die Staffelung ehrlich ausweisen, nicht die Marketing-Summe** | https://lifelock.norton.com/products | official | medium | 2026-07-03 |
| LifeLock | family_plan | Ja — Familienvarianten aller Tiers, bis $74,99/Monat (Total Family); Kinder-SSN-Monitoring enthalten | https://www.safehome.org/identity-theft-protection/lifelock/family/ | editorial | medium | 2026-07-03 |
| LifeLock | bbb_rating | Gen-Digital-/NortonLifeLock-Profil (Tempe AZ) existiert; **Grade nicht belastbar erhoben → vor Seeding am BBB-Profil verifizieren** (nicht als A+ raten) | https://www.bbb.org/us/az/tempe/profile/identity-theft-protection/nortonlifelock-inc-1126-83005924 | regulator | low | 2026-07-03 |
| LifeLock | consumer_reviews | Trustpilot 4,8/5 aus ~13.668 Reviews (größte verifizierte Review-Basis des Feldes; ~9 % 1-Stern: False Alarms, Billing) — Anzahl via Norton-Seite zitiert, am Trustpilot-Profil gegenprüfen | https://www.trustpilot.com/review/lifelock.norton.com | official | medium | 2026-07-03 |
| LifeLock | regulatory_history | **FTC-Doppel-Historie, adjudiziert:** 2010 $12 Mio. Settlement (FTC + 35 Staaten, deceptive advertising „guarantees") und **2015 $100 Mio. Contempt-Settlement wegen Verstoßes gegen die 2010er-Order** (größte Order-Enforcement-Summe der FTC-Geschichte; $68 Mio. an Class-Action-Kunden). Seitdem (11 Jahre) keine neue Enforcement-Action; Eigentümerwechsel zu Symantec/Norton 2017, heute Gen Digital. **Aufnahme mit Disclosure-Absatz** (Freedom-Muster: intaktes, marktführendes Kerngeschäft, aktuelles Produkt unabhängig gut bewertet) | https://www.ftc.gov/news-events/news/press-releases/2015/12/lifelock-pay-100-million-consumers-settle-ftc-charges-it-violated-2010-order | regulator | high | 2026-07-03 |
| LifeLock | editorial_consensus | PCMag Editors' Choice „Best Overall" (Norton-Bundle) · Security.org #1 2026 · SafeHome #1 · CNBC „Best for device protection" · Money „Best to protect families" | https://www.security.org/identity-theft/best/ + https://www.cnbc.com/select/best-identity-theft-protection-services/ | editorial | high | 2026-07-03 |

### 3. IdentityForce (Sontiq/TransUnion, Framingham MA — höchste Versicherungssumme des Feldes)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| IdentityForce | monthly_fee | UltraSecure+Credit **$34,90/Monat** bzw. $349,90/Jahr (Seed-Plan — einziger Plan mit Credit-Monitoring); UltraSecure (ohne Credit) $19,90/Monat ($17,99 lt. einzelnen Quellen, $199,90/Jahr) | https://www.identityforce.com/products-and-pricing/ultra-secure-credit | official | high | 2026-07-03 |
| IdentityForce | free_tier | Nein | https://www.identityforce.com/identity-protection-pricing | official | high | 2026-07-03 |
| IdentityForce | bureaus_monitored | 3-Bureau (UltraSecure+Credit); täglicher TransUnion-Report + VantageScore 3.0 | https://www.cnbc.com/select/identityforce-ultrasecure-and-ultrasecure-plus-credit-review/ | editorial | high | 2026-07-03 |
| IdentityForce | monitoring_scope | Dark-Web (CNBC „Best for dark web scanning"), SSN, Adress-/Court-Records, Social-Media-Monitoring, Restoration-Spezialist | https://www.cnbc.com/select/best-identity-theft-protection-services/ | editorial | high | 2026-07-03 |
| IdentityForce | id_theft_insurance | **Bis $2 Mio.** (höchster Einzelwert des Ranked-Feldes; IDShield $3 Mio. siehe dort — Formulierung „bis zu" beibehalten, Deckungs-Aufteilung vor Seeding aus Policy-Doku prüfen) | https://www.security.org/identity-theft/identityforce/review/ | editorial | medium | 2026-07-03 |
| IdentityForce | family_plan | Ja — Family-Variante UltraSecure+Credit $39,90/Monat (~$399,90/Jahr), 2 Erwachsene + bis 10 Kinder | https://www.safehome.org/identity-theft-protection/identityforce/ | editorial | medium | 2026-07-03 |
| IdentityForce | bbb_rating | Framingham-Profil existiert, Reviews gemischt (Service-/Billing-Beschwerden); **Grade nicht belastbar erhoben → vor Seeding verifizieren** | https://www.bbb.org/us/ma/framingham/profile/identity-theft-protection/identityforce-0021-104012 | regulator | low | 2026-07-03 |
| IdentityForce | consumer_reviews | Trustpilot 3,5/5 (59 % positiv; **Anzahl klein/unverifiziert → Score+Anzahl gemeinsam erheben**); App-Ratings schwach (iOS 3,0 / Android 2,5) | https://www.trustpilot.com/review/www.identityforce.com | official | medium | 2026-07-03 |
| IdentityForce | regulatory_history | Produkt selbst: keine Enforcement-Action. **Parent TransUnion:** CFPB-Consent-Order Jan 2017 ($13,9 Mio. Restitution + $3 Mio. CMP, deceptive Marketing von Credit-Score-/Subscription-Produkten); CFPB-Klage April 2022 (Dark Patterns, Verstoß gegen 2017er-Order, inkl. Ex-Manager Danaher) — **28.02.2025 einvernehmlich with prejudice dismissed** (keine Wiederaufnahme möglich, keine Zahlung, kein Schuldeingeständnis). TransUnion-Akquisition von Sontiq/IdentityForce: 2021, $638 Mio. **Parent-Historie als Fußnote disclosen, nicht dem Produkt zurechnen** | https://www.consumerfinance.gov/about-us/newsroom/cfpb-charges-transunion-and-senior-executive-john-danaher-with-violating-law-enforcement-order/ + https://news.bloomberglaw.com/business-and-practice/cfpb-drops-transunion-lawsuit-in-latest-enforcement-retreat | regulator | high | 2026-07-03 |
| IdentityForce | editorial_consensus | CNBC „Best for dark web scanning" · Money Credit-Monitoring #5 · Forbes Advisor gelistet · U.S. News Review | https://www.cnbc.com/select/best-identity-theft-protection-services/ | editorial | high | 2026-07-03 |

### 4. Experian IdentityWorks (Experian Consumer Services, Costa Mesa CA — Money #1 Credit Monitoring, echtes Gratis-Tier)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Experian IdentityWorks | monthly_fee | Premium **$24,99/Monat** (Seed-Plan) · Family $34,99/Monat · Free $0; 7-Tage-Trial auf Paid-Pläne (Kreditkarte nötig) | https://www.experian.com/protection/compare-identity-theft-products/ | official | high | 2026-07-03 |
| Experian IdentityWorks | free_tier | **Ja, echt und dauerhaft**: Experian-Report + FICO 8 (monatlich), Basis-Monitoring/Alerts (nur Experian-Bureau), manueller Dark-Web-Scan, kostenloser Freeze | https://www.security.org/identity-theft/experian/ | editorial | high | 2026-07-03 |
| Experian IdentityWorks | bureaus_monitored | Free: 1-Bureau (Experian) · Premium/Family: 3-Bureau — **Monitoring-Frequenz je Bureau (täglich Experian vs. 3B-Turnus) vor Seeding präzisieren** | https://www.experian.com/protection/compare-identity-theft-products/ | official | medium | 2026-07-03 |
| Experian IdentityWorks | monitoring_scope | FICO-Score-Monitoring (USP: Bureau-eigene Daten), Dark-Web, SSN, **CreditLock (Experian-Datei per App sperren/entsperren)** — stärkstes Lock-Feature des Feldes | https://www.security.org/identity-theft/experian/review/ | editorial | high | 2026-07-03 |
| Experian IdentityWorks | id_theft_insurance | Bis $1 Mio. (Premium und Family; Family pro Erwachsenem) | https://www.experian.com/help/summary-benefits-identityworks-premium/ | official | high | 2026-07-03 |
| Experian IdentityWorks | family_plan | Ja — $34,99/Monat, 2 Erwachsene + bis 10 Kinder | https://www.safehome.org/identity-theft-protection/experian-identityworks/ | editorial | high | 2026-07-03 |
| Experian IdentityWorks | bbb_rating | **F** (Experian-Konzern-Profil Costa Mesa; einzelne Quellen: D) bei >12.000 Beschwerden/3 Jahre — Konzern-Grade, nicht produktspezifisch; ehrlich ausweisen mit Kontext „Auskunftei-Beschwerdevolumen (Disputes) dominiert" | https://www.bbb.org/us/ca/costa-mesa/profile/credit-reporting-agencies/experian-1126-31551/complaints | regulator | medium | 2026-07-03 |
| Experian IdentityWorks | consumer_reviews | Trustpilot 4,1/5 aus ~94.000 Reviews — **Caveat mitliefern:** Experian ist zahlender Trustpilot-Kunde mit aktivem Reputation-Management (99 % der Negativ-Reviews binnen 48h beantwortet); organische Kanäle (BBB/ConsumerAffairs) deutlich schlechter. Score+Anzahl+Kanal-Hinweis gemeinsam ausweisen | https://www.trustpilot.com/review/experian.com | official | medium | 2026-07-03 |
| Experian IdentityWorks | regulatory_history | CFPB 2017: $3 Mio. Strafe (deceptive Vermarktung von Credit Scores); DOJ/FTC 2023: $650k CAN-SPAM (ConsumerInfo.com, Marketing-Mails ohne Opt-out); **CFPB v. Experian (FCRA, „sham investigations" von Disputes): eingereicht 07.01.2025, AKTIV — Motion to Dismiss am 22.10.2025 abgewiesen, Answer 03.11.2025, Discovery läuft (letzter Docket-Stand 26.01.2026)**. Zusätzlich NerdWallet-Generalvorbehalt gegen Bureau-eigene Monitoring-Produkte. **Aufnahme mit Disclosure**; laufendes Verfahren als „pending, keine Feststellung" formulieren — nicht präjudizieren | https://www.consumerfinance.gov/enforcement/actions/experian-information-solutions-inc/ + https://www.consumerfinance.gov/about-us/newsroom/cfpb-fines-experian-3-million-deceiving-consumers-marketing-credit-scores/ | regulator | high | 2026-07-03 |
| Experian IdentityWorks | editorial_consensus | Money Credit-Monitoring **#1 „Best Overall"** (Juli 2026) · CNBC „Best for credit monitoring" · Investopedia/NerdWallet gelistet (NerdWallet mit Bureau-Skepsis-Vermerk) | https://money.com/best-credit-monitoring-services/ | editorial | high | 2026-07-03 |

### 5. IdentityIQ (Identity Intelligence Group, LLC / IDIQ, Temecula CA — Plan-Doc-Sonderprüfung, siehe Urteils-Abschnitt 1)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| IdentityIQ | monthly_fee | Offizielle Preisseite (03.07.2026, **Annual-Billing-Äquivalente**): Secure Basic $8,49 · Secure Plus $11,49 · Secure Pro $21,49 · Secure Max $31,49. Monatliche Abrechnung teurer (Editorial-Quellen: bis $34,99 Max) — **Monthly-Billing-Preise vor Seeding im Checkout verifizieren**; der $6,99-Wert aus der Shortlist ist auf der aktuellen Preisseite nicht mehr existent (veraltet/Promo). Seed-Plan: **Secure Pro $21,49** (günstigster Plan mit vollem 3-Bureau-Monitoring) | https://www.identityiq.com/plans-pricing | official | medium | 2026-07-03 |
| IdentityIQ | free_tier | Nein — $1-„Trial" (7 Tage) mit Vorab-Autorisierung der Monatsgebühr; **NICHT als „free trial" bewerben** (siehe regulatory_history) | https://www.security.org/identity-theft/identityiq/ | editorial | high | 2026-07-03 |
| IdentityIQ | bureaus_monitored | Basic: 1-Bureau (täglich) · Plus: 1-Bureau-Monitoring + jährliche 3B-Reports · **Pro: 3-Bureau-Monitoring** (halbjährl. 3B-Reports) · Max: 3-Bureau + monatliche 3B-Reports | https://www.identityiq.com/plans-pricing | official | high | 2026-07-03 |
| IdentityIQ | monitoring_scope | Dark-Web, SSN, Synthetic-ID-Theft-Check, Daten-Broker-Opt-out (obere Tiers); Fokus klar auf Credit-Seite (Monitoring-Firma, kein Cybersecurity-Bundle) | https://www.security.org/identity-theft/identityiq/ | editorial | medium | 2026-07-03 |
| IdentityIQ | id_theft_insurance | $1 Mio. Stolen-Funds-Reimbursement in ALLEN Plänen (auch $8,49-Tier — Preis-Leistungs-USP); Secure Max zusätzlich $25k pro Familienmitglied | https://www.identityiq.com/plans-pricing | official | high | 2026-07-03 |
| IdentityIQ | family_plan | Kein separater Familien-Tarif; Secure Max deckt Familienmitglieder mit je $25k ID-Theft-Insurance ab | https://www.identityiq.com/plans-pricing | official | medium | 2026-07-03 |
| IdentityIQ | bbb_rating | **Im Umbruch, aktuell KEIN Grade abrufbar:** Profil zeigt „BBB Accredited since 13.05.2026" + „information is being updated, no report available at this time" (03.07.2026); Suchtreffer nennen „A+"; Shortlist sah noch „B". **Tri-State seeden: Grade `null` (unbekannt), `bbb_accredited: true` mit Datum 05/2026 + Fußnote „frisch akkreditiert"** — nicht als etabliertes A+ verkaufen | https://www.bbb.org/us/ca/temecula/profile/identity-theft-protection/identity-iq-1126-1000142078 | regulator | medium | 2026-07-03 |
| IdentityIQ | consumer_reviews | Trustpilot 3,9/5 „Great" — **Anzahl nicht verifiziert (Fetch WAF-geblockt) → vor Seeding am Profil erheben**; ConsumerAffairs/PissedConsumer mit wiederkehrenden Billing-/Cancellation-Beschwerden bis in 2026 | https://www.trustpilot.com/review/identityiq.com | official | medium | 2026-07-03 |
| IdentityIQ | regulatory_history | **Keine FTC-/CFPB-/State-AG-Enforcement-Action.** Aber: **Caldwell v. Identity Intelligence Group, LLC — $8.769.854 Klassenklage-Settlement** wegen Verstoßes gegen Kaliforniens Automatic Renewal Law / UCL (Autorenewal-Terms nicht clear-and-conspicuous; Klassenzeitraum 22.03.2019–20.08.2023; Final-Approval-Hearing 19.09.2025; Auszahlung ohne Claim-Form). Dazu passendes, anhaltendes Beschwerdemuster (unautorisierte Abbuchungen nach Trial, wirkungslose Kündigungen, Debit-Preauth blockiert Funds). Historischer Vertriebskontext: IdentityIQ ist das Standard-Monitoring-Upsell vieler Credit-Repair-Firmen (Referral-Modell) — Berührungspunkt zum Slice-5-Umfeld, im buyerGuide neutral einordnen | https://www.claimdepot.com/settlements/identity-iq-settlement + https://www.identityiqsettlement.com/ | regulator | high | 2026-07-03 |
| IdentityIQ | editorial_consensus | Security.org Review · U.S. News 360 Review · SafeHome/Retirement Living/CyberInsider — solide Editorial-Abdeckung, aber KEIN Top-3-Slot in Money/CNBC (dort ungelistet) → dünnster Editorial-Konsens des Ranked-Feldes, Ranking-Position entsprechend | https://www.usnews.com/360-reviews/privacy/identity-theft-protection/identityiq | editorial | medium | 2026-07-03 |

### 6. myFICO (Fair Isaac Corporation — einziger Anbieter mit echten FICO-Scores, echtes Gratis-Tier)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| myFICO | monthly_fee | Basic $19,95 (1B Experian) · **Advanced $29,95 (3B, Quartals-Reports — Seed-Plan)** · Premier $39,95 (3B, Monats-Reports); Jahresabo bis 20 % günstiger; Free $0 | https://www.myfico.com/products/fico-score-plans | official | high | 2026-07-03 |
| myFICO | free_tier | **Ja, echt und dauerhaft** (keine Kreditkarte): Equifax-Report + FICO 8 monatlich + Basis-Alerts | https://allaboutcookies.org/myfico-review | editorial | high | 2026-07-03 |
| myFICO | bureaus_monitored | Free: 1B (Equifax) · Basic: 1B (Experian) · Advanced/Premier: 3-Bureau | https://www.myfico.com/products/fico-score-plans | official | high | 2026-07-03 |
| myFICO | monitoring_scope | USP: **echte FICO-Scores inkl. 28 Score-Versionen** (Mortgage-/Auto-Scores — die Scores, die Lender real nutzen); Identity-Monitoring + Dark-Web auf Paid-Tiers; **kein Credit Lock, keine Cybersecurity-Tools** (ehrlich als Contra) | https://www.usnews.com/360-reviews/privacy/identity-theft-protection/myfico | editorial | high | 2026-07-03 |
| myFICO | id_theft_insurance | $1 Mio. (Advanced/Premier) + 24/7-Restoration; Teil-Limits (z. B. $10k unautorisierte EFTs) in Policy-FAQ | https://support.myfico.com/hc/en-us/articles/360037605234-How-does-the-1-Million-Identity-Theft-Insurance-work | official | high | 2026-07-03 |
| myFICO | family_plan | **Nein** — Einzelpersonen-Produkt (ehrlich als Contra ggü. Aura/LifeLock/Experian) | https://www.myfico.com/products/fico-score-plans | official | medium | 2026-07-03 |
| myFICO | bbb_rating | A+ (Fair-Isaac-Profil) | https://www.usnews.com/360-reviews/privacy/identity-theft-protection/myfico | editorial | medium | 2026-07-03 |
| myFICO | consumer_reviews | Solide BBB-/App-Ratings lt. U.S. News; **Trustpilot-Score+Anzahl nicht erhoben → vor Seeding verifizieren**; kleine Review-Basis erwartbar | https://www.usnews.com/360-reviews/privacy/identity-theft-protection/myfico | editorial | low | 2026-07-03 |
| myFICO | regulatory_history | **Sauber**: keine Enforcement-Actions zum Consumer-Angebot gefunden (Suche 2026-07-03); Fair Isaac ist Score-Anbieter, nicht Auskunftei — kein Dispute-Beschwerdevolumen wie bei Experian | https://www.nerdwallet.com/finance/learn/myfico | editorial | medium | 2026-07-03 |
| myFICO | editorial_consensus | Money „Best for access to FICO Score" (#7) · TechRadar/Tom's Guide Reviews · U.S. News — Konsens: bester Score-Zugang, schwaches Feature-Bundle fürs Geld | https://money.com/best-credit-monitoring-services/ | editorial | high | 2026-07-03 |

### 7. IDShield (PPLSI/LegalShield, Ada OK — Plan-Doc „redaktionell", nach Prüfung: voll ranked-fähig)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| IDShield | monthly_fee | Individual: $14,95 (1-Bureau) / **$19,95 (3-Bureau — Seed-Plan)**; Family: $29,95 (1B) / $34,95 (3B) | https://www.idshield.com/individual-plan | official | high | 2026-07-03 |
| IDShield | free_tier | Nein (30-Tage-Trial lt. Editorial-Quellen — Konditionen vor Seeding auf idshield.com prüfen) | https://www.security.org/identity-theft/idshield/review/ | editorial | medium | 2026-07-03 |
| IDShield | bureaus_monitored | Wahlweise 1-Bureau oder 3-Bureau (transparentes Tier-Modell) | https://www.idshield.com/individual-plan | official | high | 2026-07-03 |
| IDShield | monitoring_scope | Dark-Web, SSN, Social-Media-Monitoring; USP: **Restoration durch lizenzierte Privatermittler** (unbegrenzte Konsultation) + Cybersecurity-Bundle (Malware-Schutz bis 3 Geräte, lt. Shortlist/Money) | https://money.com/best-credit-monitoring-services/ | editorial | high | 2026-07-03 |
| IDShield | id_theft_insurance | **Bis $3 Mio.** (höchste beworbene Summe des Feldes — Deckungsstruktur vor Seeding aus Plan-Doku präzisieren) | https://www.idshield.com/ | official | medium | 2026-07-03 |
| IDShield | family_plan | Ja — 2 Erwachsene + bis 10 Kinder, $29,95/$34,95 | https://www.idshield.com/ | official | high | 2026-07-03 |
| IDShield | bbb_rating | Parent LegalShield (Ada OK): **A+, akkreditiert seit 1995** — längste BBB-Historie des Feldes; BBB-Kundenreviews aber nur 3,22/5 aus 317+ (Kündigungsfriktion: Brief-Pflicht, Weiterbelastung nach Kündigung) | https://www.bbb.org/us/ok/ada/profile/legal-services/legalshield-0995-9000434/complaints | regulator | medium | 2026-07-03 |
| IDShield | consumer_reviews | Trustpilot 4,7/5 — **Anzahl nicht verifiziert → Score+Anzahl gemeinsam erheben**; ConsumerAffairs gemischt (Wochenend-Support, IRS-Alert-Verzögerungen) | https://allaboutcookies.org/idshield-by-legalshield-review | editorial | medium | 2026-07-03 |
| IDShield | regulatory_history | Keine FTC-/CFPB-/State-AG-Enforcement gefunden (Suche 2026-07-03). Kontext-Fußnote: PPLSI vertreibt via Network-Marketing (MLM-Vertriebsmodell) — kein Compliance-Befund, aber für Preistransparenz-Einordnung erwähnenswert | https://www.consumeraffairs.com/finance/idshield.html | editorial | medium | 2026-07-03 |
| IDShield | editorial_consensus | Money Credit-Monitoring #6 („Cybersecurity-Bundle") · CNBC gelistet · Tom's Guide/U.S. News Reviews | https://money.com/best-credit-monitoring-services/ | editorial | high | 2026-07-03 |

### 8. Credit Karma (Intuit — der echte $0-Anker des Feldes)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Credit Karma | monthly_fee | **$0 — komplett kostenlos** (Geschäftsmodell: Kredit-/Karten-Offers im Produkt; der Nutzer ist der Lead) | https://www.creditkarma.com/free-credit-score | official | high | 2026-07-03 |
| Credit Karma | free_tier | Das GESAMTE Produkt ist das Free-Tier — keine Paid-Stufe | https://www.creditkarma.com/free-credit-score | official | high | 2026-07-03 |
| Credit Karma | bureaus_monitored | **2-Bureau (TransUnion + Equifax), tägliche Prüfung; KEIN Experian; VantageScore 3.0 statt FICO** (Kern-Contra: Score-Mismatch bei Kreditanträgen) | https://www.security.org/identity-theft/credit-karma/review/ | editorial | high | 2026-07-03 |
| Credit Karma | monitoring_scope | Report-Alerts, Dark-Web-Monitoring (Basis), kostenlose ID-Monitoring-Basics; **keine Restoration-Services, kein Credit Lock** | https://www.security.org/identity-theft/credit-karma/review/ | editorial | high | 2026-07-03 |
| Credit Karma | id_theft_insurance | **$0 — keine** (einziger Ranked-Kandidat ohne; ehrlich als Contra ausweisen) | https://www.security.org/identity-theft/credit-karma/review/ | editorial | high | 2026-07-03 |
| Credit Karma | family_plan | N/A (kostenlose Einzelkonten) | — | — | high | 2026-07-03 |
| Credit Karma | bbb_rating | **F** bei >2.000 Beschwerden — ehrlich ausweisen; Kontext: kostenloser Massendienst (~130 Mio. Nutzer), Beschwerden primär Offers/Spam/Support, nicht Abrechnungsbetrug (es gibt nichts abzurechnen) | https://cybernews.com/identity-theft-protection/credit-karma-review/ | editorial | medium | 2026-07-03 |
| Credit Karma | consumer_reviews | Trustpilot 1,2/5 (Intuit-Credit-Karma-US-Profil; Themen: Lender-Spam nach Offer-Klicks, Rate-Bait, Intuit-Verschlechterung) — **Anzahl vor Seeding erheben**; krasser Kontrast zu App-Store-Ratings (Millionen positiver App-Bewertungen) → beide Kanäle nennen | https://www.trustpilot.com/review/www.creditkarma.com | official | medium | 2026-07-03 |
| Credit Karma | regulatory_history | **FTC-Consent-Order (finalisiert Jan 2023): $3 Mio.** wegen Dark Patterns bei falschen „Pre-Approved"-Kreditkarten-Claims (Feb 2018–Apr 2021; ~1/3 der Beworbenen abgelehnt → Hard Inquiries umsonst). Datennutzungs-Modell (Sharing mit Dritten) als Privacy-Contra. **Aufnahme mit Disclosure** — der $0-Preis ist die Kompensation, die Offer-Monetarisierung IST das Produkt und wird im buyerGuide erklärt | https://www.ftc.gov/news-events/news/press-releases/2023/01/ftc-finalizes-order-requiring-credit-karma-pay-3-million-halt-deceptive-pre-approved-claims | regulator | high | 2026-07-03 |
| Credit Karma | editorial_consensus | Money „Best free" (#4) · in ALLEN geprüften Quellen gelistet (Money, NerdWallet, CNBC, Investopedia — lt. Shortlist §4 und aktuell bestätigt) — meistgenutzte Gratis-Monitoring-App der USA | https://money.com/best-credit-monitoring-services/ | editorial | high | 2026-07-03 |

---

## Nicht-Ranked-Kandidaten (Fakten-Matrix)

### PrivacyGuard — Ausschluss aus dem Ranked-Feld empfohlen (Plan-Doc „redaktionell" konkretisiert)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| PrivacyGuard | monthly_fee | Identity $9,99 · Credit $19,99 · Total $24,99; $1-Trial (14 Tage) | https://www.privacyguard.com/plans-pricing.html | official | high | 2026-07-03 |
| PrivacyGuard | usp | Monatlicher Tri-Bureau-Report-Refresh im Total-Plan ($24,99) — günstigster monatlicher 3B-Report-Zugang des Feldes (Vergleich: IdentityIQ Max $31,49, myFICO Premier $39,95); dedizierter Restoration-Agent; $1 Mio. Versicherung | https://www.privacyguard.com/plans-pricing.html | official | medium | 2026-07-03 |
| PrivacyGuard | family_plan | Nein (nur Kinder-SSN-Monitoring im Total-Plan) | https://allaboutcookies.org/privacy-guard-review | editorial | medium | 2026-07-03 |
| PrivacyGuard | consumer_reviews | **Kein Trustpilot-Profil existent**; einzige organische Basis ConsumerAffairs ~1/5 (kleine Anzahl); WalletHub 22 Ratings — **kein seriös zitierbarer positiver Consumer-Score verfügbar** | https://www.consumeraffairs.com/privacy/privacyguard.html | editorial | high | 2026-07-03 |
| PrivacyGuard | bbb_rating | Quellen uneins (A− vs. B+) — nicht belastbar | https://www.security.org/identity-theft/privacyguard/review/ | editorial | low | 2026-07-03 |
| PrivacyGuard | regulatory_history | Marke der **Trilegiant Corporation (Affinion Group)**: 2013 **$30-Mio.-Settlement mit 46 Staaten + DC** (deceptive Enrollment in Discount-/Membership-Programme, Scheck-Einlöse-Trick mit Auto-Abo); CFPB-Klage gegen Affinion 2015; jahrzehntelanges Klage-/Beschwerdemuster zu Billing-Praktiken der Parent-Gruppe; zusätzlich dokumentierte Daten-Verkaufs-Praxis | https://www.atg.wa.gov/news/news-releases/ferguson-announces-30m-judgment-against-company-runs-discount-club-programs + https://files.consumerfinance.gov/f/201507_cfpb_complaint_affinion.pdf | regulator | high | 2026-07-03 |
| PrivacyGuard | editorial_consensus | Money #3 + CNBC „Best for combining credit and identity" — der Editorial-Halo ist real, kollidiert aber mit der Konsumenten-/Regulatorik-Faktenlage | https://www.cnbc.com/select/best-identity-theft-protection-services/ | editorial | high | 2026-07-03 |

### Identity Guard — kein eigener Slot (Aura-Duplikat)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Identity Guard | ownership | **Gehört Aura** (Intersections Inc. 2019 von iSubscribed/WndrCo/General Catalyst übernommen → heute Aura-Produktfamilie) — zweiter Slot für denselben Konzern wäre Schein-Diversität im Ranking | https://www.aura.com/press/release/isubscribed-and-partners-complete-acquisition-of-intersections-inc-owner-of-identity-guard-r-consumer-security-platform | official | high | 2026-07-03 |
| Identity Guard | pricing_note | Value $8,99 / Total / Ultra $29,99 (Family bis $39,99); $1 Mio. Versicherung ab Value-Tier; CNBC „Best for identity theft insurance" — als **buyerGuide-Fußnote unter Aura** („günstigere Schwester-Marke ohne VPN/Antivirus-Bundle") verwerten, nicht als Slot | https://www.security.org/identity-theft/identity-guard/ | editorial | medium | 2026-07-03 |

---

## Urteils-Abschnitt (die angeforderten Judgment Calls)

### 1. IdentityIQ — der vom Plan-Doc angeforderte BBB-Vorsichts-Check

**Empfehlung: AUFNAHME MIT DISCLOSURE (Freedom-Debt-Relief-Muster) — nicht Ausschluss, nicht bedenkenlose Aufnahme.**

Der Dreisatz zu den etablierten Präzedenzfällen:

- **Kein Credit-Pros-Fall:** The Credit Pros wurde ausgeschlossen, weil das zentrale Vergleichsattribut (Trustpilot) *manipuliert* war — die Integrität der Vergleichstabelle selbst war gebrochen. Bei IdentityIQ ist die Review-Basis intakt (Trustpilot 3,9 „Great", keinerlei Fake-Review-Flags); die Probleme liegen im Billing-Prozess, nicht in gefälschten Daten.
- **Kein Lexington-Fall:** Kein behördliches Urteil, keine Entitäts-Auflösung, kein adjudiziert-illegales Geschäftsmodell. Das $8,77-Mio.-Settlement (Caldwell, CA Autorenewal Law) ist eine *private* Klassenklage, ohne Schuldeingeständnis beigelegt, und betrifft die Klarheit von Abo-Terms 2019–2023 — dieselbe Deliktkategorie, für die auch TransUnion (2017 Consent Order) und Credit Karma (FTC 2022) im Feld stehen. Wer IdentityIQ dafür ausschließt, müsste konsequenterweise das halbe Feld ausschließen.
- **Freedom-Analogie trägt:** kompensierende Stärken sind real — $1 Mio. Versicherung schon im $8,49-Einstiegstarif (bester Preis-Leistungs-Einstieg des Feldes), sauberes 4-Tier-Modell bis monatliche 3B-Reports, keinerlei behördliche Enforcement-Historie.

**Zur BBB-Frage konkret:** Die Shortlist-Warnung („B-Rating") ist überholt, aber nicht entwarnt: Das Profil steht 03.07.2026 auf „being updated / no report available", die Akkreditierung datiert vom 13.05.2026 (7 Wochen alt). Eine frisch gekaufte Akkreditierung ist kein Trust-Signal — **Grade als `null` seeden, `bbb_accredited: true` nur mit Datums-Fußnote**, und das Ranking NICHT auf BBB stützen.

**Pflicht-Auflagen bei Aufnahme:** (a) Disclosure-Box in der Kandidaten-Karte: Autorenewal-Settlement + Billing-Beschwerdemuster + $1-Trial-Mechanik (Preauth, 7 Tage, dann Vollpreis); (b) $1-Trial nirgends als „free" labeln; (c) Ranking-Position aus den Daten, nicht aus dem Preis-Halo — der dünnste Editorial-Konsens des Feldes (kein Money-/CNBC-Slot) deckelt die Position naturgemäß im Mittelfeld/unteren Drittel.

### 2. PrivacyGuard — Ausschluss aus dem Ranked-Feld

**Empfehlung: NICHT ranked; redaktionelle Erwähnung im buyerGuide.** Das konkretisiert die Plan-Doc-Vorgabe „PrivacyGuard/IDShield redaktionell" — IDShield hat die Prüfung bestanden (Trustpilot 4,7, LegalShield A+ seit 1995, keine Enforcement-Historie) und wandert ins Ranked-Feld; PrivacyGuard fällt durch:

1. **Die Consumer-Review-Kernspalte ist nicht befüllbar.** Kein Trustpilot-Profil; ConsumerAffairs ~1 Stern bei kleiner Anzahl. Der Safeport-Präzedenzfall (kein Trustpilot → Birdeye 4,7/734 + Google 4,7 als Ersatz) griff nur, weil positive Alternativ-Quellen existierten — hier existiert keine. Ein Ranked-Slot mit leerer oder 1-Stern-Review-Zelle gegen acht befüllte Zeilen wäre keine ehrliche Tabelle.
2. **Parent-Regulatorik ohne Kompensation:** Trilegiant/Affinion trägt das breiteste State-AG-Muster des Feldes (46 Staaten + DC, $30 Mio., deceptive enrollment — exakt die Deliktart, die bei einem Abo-Produkt zählt) plus CFPB-Klage 2015. Anders als bei LifeLock/Experian (Marktführer, riesige verifizierte Review-Basen, aktive Produktentwicklung) gibt es hier keine kompensierende Stärke außer dem Preis-USP.
3. **Der USP bleibt nutzbar — redaktionell:** „Günstigster monatlicher Tri-Bureau-Report-Refresh ($24,99)" wird als buyerGuide-Absatz mit ehrlicher Einordnung erwähnt (Plus500-/Credit-Pros-Lehre: weglassen aus dem Ranking ist sauberer als ein Slot mit Warnstern, aber hier rechtfertigt der echte Editorial-Konsens von Money #3 + CNBC immerhin die Erwähnung als Info, nicht als Empfehlung).

### 3. Identity Guard — kein Slot trotz CNBC-Listung

Identity Guard gehört Aura. Zwei Ranking-Slots desselben Konzerns würden (a) Schein-Diversität suggerieren, (b) das „9 Kandidaten"-Feld künstlich polstern — genau das Anti-Pattern, das diese Rollout-Serie vermeidet. Aura ist die stärkere Marke (Money #1, eigenes Produkt-Flaggschiff). Identity Guard wird als Fußnote unter Auras deep_dive erwähnt („günstigere Schwester-Marke ab $8,99 ohne VPN/Antivirus-Bundle, CNBC ‚Best for identity theft insurance'"). Sollte der Owner später einen 9. Slot wollen, wäre Identity Guard der erste Nachrücker — aber nicht neben Aura, sondern nur statt Aura.

### 4. Kostenmodell-Empfehlung: existierendes Kind `banking` — NULL Shared-Code-Change

**Die Preisform der Kategorie ist ein flaches, unbefristetes Monats-Abo ohne Setup-Gebühr — das passt exakt auf das existierende `banking`-Kind:**

- `banking` rechnet `annualCost(p) × years` mit `annualCost = monthlyFee×12 + fxSpend-Term + atmFee-Term` (`lib/comparison/ranking.ts:15-17`). Mit `fx_fee_pct = 0` und `atm_fee = 0` geseedet kollabiert das ehrlich zu **Monatsgebühr × 12 × Jahre** — genau die wahre Kostenfunktion eines Monitoring-Abos. Kein neues Kind, keine Änderung an `cost.ts`/`types.ts`, keine Regressionsgefahr für die Referenzseiten.
- `monthly-plus-setup` (Slice-5-Kind) wurde geprüft und **verworfen**: Es würde rechnerisch funktionieren (Setup = $0), aber (a) der Monats-Dial (3–12) unterstellt ein endendes Programm — Monitoring läuft unbefristet; (b) eine tote All-$0-Setup-Spalte wäre die gleiche unehrliche UI, die der Slice-5-Bericht bei `fee-on-amount`-Missbrauch verworfen hat. `fee-on-amount`/`compounding-fee`: offensichtlich unpassend (kein Betrag, kein Wachstumsguthaben).
- **Anders als bei Trading Platforms ist `cost`-Sort hier ERLAUBT und sinnvoll** — die Differenzierung ist real und die $0-Werte sind ECHTE Preise (Gratis-Produkte), kein inerter Kommissions-Patt:

| Anbieter (Seed-Plan, 3-Bureau wo verfügbar) | Monatlich | 1 Jahr | 3 Jahre | 5 Jahre |
|---|---|---|---|---|
| Credit Karma (frei, nur 2-Bureau) | **$0** | $0 | $0 | $0 |
| Aura Individual (Intro-Preis!*) | $15,00* | $180 | $540 | $900 |
| LifeLock Advanced (Intro-Preis!*) | $19,99* | $240 | $720 | $1.199 |
| IDShield 3-Bureau | $19,95 | $239 | $718 | $1.197 |
| IdentityIQ Secure Pro (Annual-Basis*) | $21,49* | $258 | $774 | $1.289 |
| Experian Premium (Free-Tier existiert) | $24,99 | $300 | $900 | $1.499 |
| myFICO Advanced (Free-Tier existiert) | $29,95 | $359 | $1.078 | $1.797 |
| IdentityForce UltraSecure+Credit | $34,90 | $419 | $1.256 | $2.094 |
| — nicht ranked: PrivacyGuard Total | $24,99 | $300 | $900 | $1.499 |

  \* Preis-Basis-Vorbehalte siehe Matrix-Zeilen + Verifikations-Liste (Abschnitt 7). Spread: **$0 vs. $2.094 über 5 Jahre** — der Jahres-Slider trägt echte Information.
- **Slider-Konfiguration:** `amountLabel`-Slider stilllegen wie bei Trading Platforms (`amountMin: 0, amountMax: 0` — es gibt keinen sinnvollen Betrags-Input), `yearsLabel: 'Time horizon (years)'`, `yearsMin: 1, yearsMax: 5, yearsDefault: 1` (Jahreskosten sind der natürliche Vergleichsanker eines Abos).
- **Free-Tier-Ehrlichkeit (Kern-Anforderung dieses Slices):** Der echte $0 von Credit Karma ist ein Differenzierungsmerkmal, KEIN Trading-Platforms-Patt. Zwei Pflicht-Maßnahmen: (1) **compareRow „Free tier"** (tri-state: Credit Karma = „Entire product free" · Experian/myFICO = „Yes (1-bureau)" · Rest = „No") — so wird sichtbar, dass drei Anbieter einen Gratis-Einstieg haben, ohne die Paid-Plan-Preise zu verwässern; (2) **methodology-Absatz:** „Cost projections use each provider's cheapest plan with three-bureau monitoring at list price. Credit Karma is genuinely free (two bureaus, VantageScore, no insurance) — its $0 is a real price, not a teaser. Aura and LifeLock advertise first-year rates; renewal prices are typically higher."
- **Empfohlene specColumns:** Monthly price (winner: min) · Bureaus monitored (3B > 2B > 1B) · ID theft insurance (winner: max) · Free tier — deckt die vier realen Kaufkriterien der Kategorie ab.

### 5. Attribution-Gate / `affiliate_links`-Ist-Zustand (DB-verifiziert 2026-07-03)

- **Null Treffer:** Kein einziger der 10 recherchierten Anbieter (8 ranked + PrivacyGuard + Identity Guard) hat eine `affiliate_links`-Row — in keiner Kategorie, keinem Markt (72 Rows via MCP-Tool geprüft). Die Plan-Doc-Angabe „Keine Links → ranked-unmonetarisiert" ist **bestätigt und aktuell**.
- **Konsequenz (Standardregel seit Slice 3):** Alle 8 Ranked-Kandidaten bekommen `external_url`-Visit-CTAs auf `product_attributes` (`is_affiliate = false`), Ziel = offizielle Produktseite (Aura aura.com/pricing · LifeLock lifelock.norton.com/products · IdentityForce identityforce.com · Experian experian.com/protection · IdentityIQ identityiq.com · myFICO myfico.com · IDShield idshield.com · Credit Karma creditkarma.com). **Keine `affiliate_links`-Rows anlegen** (Guardrail 6 — keine erfundenen Link-Rows).
- **Monetarisierungs-Perspektive (Folgetask, kein Slice-Blocker):** Die Shortlist §4 nennt reale Programme (Experian CJ/Awin ~$12–31 · Aura Direktprogramm $65+ · LifeLock Impact 20 % · IdentityForce CJ $35 · myFICO CJ/ShareASale bis $100). Erst Netzwerk-Link mit SubID + Postback verifizieren, dann `affiliate_links`-Row + `tracking_status` per Migration (Mercury-Muster). IdentityIQ (Awin ~$40) NUR nach Owner-Freigabe angesichts der Disclosure-Auflagen.

### 6. Finale Ranked-Kandidaten-Zahl: 8 (nicht 9)

Rechenweg: 9 Shortlist-Slots − PrivacyGuard (Abschnitt 2) = **8 Ranked-Kandidaten: Aura · LifeLock · IdentityForce · Experian IdentityWorks · IdentityIQ · myFICO · IDShield · Credit Karma.**

**Nicht auffüllen** (Forex-Präzedenz 7→5, Credit-Repair-Präzedenz 9→6): Der nächstliegende Nachrücker Identity Guard ist ein Aura-Duplikat (Abschnitt 3); danach kämen Equifax/TransUnion-Eigenprodukte (NerdWallet rät explizit von Bureau-Monitoring-Abos ab — zwei Bureau-Produkte im Feld reichen mit Experian und myFICO/TransUnion-Tochter IdentityForce), EverSafe (Nischen-Fokus Senioren) oder Coveron (junge Marke ohne Multi-Quellen-Konsens). Acht voll besetzte Zeilen schlagen neun mit einer Wackel-Row. Die 8 decken alle Kaufintentionen: komplett kostenlos (Credit Karma) · Gratis-Einstieg + FICO vom Bureau (Experian) · echte FICO-Scores (myFICO) · All-in-One-Familie (Aura) · Marken-/Device-Bundle (LifeLock) · höchste Versicherung (IDShield $3M / IdentityForce $2M) · günstigster Voll-Einstieg (IdentityIQ).

### 7. Soft-live vs. Ranked-live — Pflicht-Verifikationen vor Seeding

**Ranked-live ist erreichbar, aber erst nach diesen manuellen Prüfungen** (überwiegend Preis-Basis- und Review-Count-Lücken, keine strukturellen Quellenprobleme):

1. **Aura + LifeLock: Listen- vs. Erstjahres-Preis** — beide bewerben Intro-Raten; Renewal-Preis im Browser auf den offiziellen Pricing-Seiten erheben und ENTWEDER Listenpreis seeden ODER Intro-Preis mit `price_note`-Fußnote („first-year rate").
2. **IdentityIQ: Monthly-Billing-Preise** — offizielle Seite zeigt Annual-Äquivalente ($21,49 Pro); Monatsabrechnung im Checkout prüfen. Dazu Trustpilot-Review-Anzahl (Fetch WAF-geblockt).
3. **Trustpilot-Counts für Aura, IDShield, IdentityForce, Credit Karma, myFICO** — Kategorie-Regel aus Slice 5 gilt verschärft: Score+Quelle+Anzahl IMMER zusammen, nie nackte Zahl. LifeLock-Count (~13.668) am Profil gegenprüfen.
4. **BBB-Grades LifeLock/Gen Digital + IdentityForce** — Profile existieren, Grades nicht belastbar erhoben (beide `low`).
5. **Experian Premium: 3-Bureau-Monitoring-Frequenz** — täglich Experian + welcher Turnus für EQ/TU.
6. **IDShield: Trial-Konditionen** (30 Tage lt. Editorial) + $3M-Deckungsstruktur; IdentityForce $2M-Deckungsaufteilung.

Ohne diese Prüfungen: Soft-live-Auflagen aus Guardrail 4 (inkl. `products[0]`-Gate für Homepage-Chip + OG-Image). Kein Attribut der 8 Ranked-Kandidaten steht auf `low` außer den genannten BBB-Grades (LifeLock, IdentityForce) und myFICO-Reviews — für diese Zellen gilt: neutraler Text („see provider") statt Claim, bis verifiziert.

### 8. Content-/Hygiene-Befunde (klein — Kontrast zu Slice 5)

1. **Kein Alt-Content-Risiko:** Es existiert kein Credit-Monitoring-Review-MDX — nichts zu bereinigen (angenehmer Kontrast zum Slice-5-Fabrikations-Fund).
2. **Interne Verlinkung:** `content/us/credit-score/free-credit-score-check.mdx` + `content/us/credit-score/index.mdx` thematisch adjazent → wechselseitige Links Cockpit ↔ Credit-Score-Silo einplanen (AEO-Cluster).
3. **buyerGuide-Pflichtthemen:** (a) VantageScore vs. FICO erklären (der Kern-Trade-off frei vs. bezahlt); (b) AnnualCreditReport.com + kostenlose Freezes bei allen drei Bureaus als Selbsthilfe-Baseline (CROA-/FCRA-Verbraucherrechte — E-E-A-T wie GA-Recht-Absatz in Slice 5); (c) Einordnung „Monitoring verhindert keinen Diebstahl, es verkürzt die Entdeckungszeit"; (d) PrivacyGuard-Info-Absatz + Identity-Guard-Fußnote (Abschnitte 2–3).
4. **Bild-Asset:** `/public/images/comparison/credit-monitoring.webp` wird gebraucht (Manifest-Eintrag analog Vorslices).

---

## Empfohlene Kandidaten-Aufstellung für Slice 6 (Ergebnis dieser Recherche)

| Rang-Slot | Provider | Render-Empfehlung | Begründung |
|---|---|---|---|
| 1–8 (ranked) | Aura · LifeLock · IdentityForce · Experian IdentityWorks · IdentityIQ · myFICO · IDShield · Credit Karma | ALLE `external_url`-Visit-CTAs (`is_affiliate=false`) — keine `affiliate_links`-Rows existieren, keine anlegen | Vollständiges ehrliches US-Feld, alle Kaufintentionen abgedeckt; jede Zeile mit Multi-Quellen-Konsens |
| ranked, mit Disclosure-Box | IdentityIQ · LifeLock · Experian · Credit Karma | Disclosure-Absätze: IdentityIQ ($8,77M-Autorenewal-Settlement + $1-Trial-Mechanik + BBB-Grade `null`) · LifeLock (FTC $12M/2010 + $100M/2015) · Experian (CFPB $3M/2017, CAN-SPAM $650k/2023, laufende CFPB-FCRA-Klage seit 01/2025 — als „pending" formulieren) · Credit Karma (FTC $3M Dark Patterns 2022/23, Daten-Modell) | Freedom-Muster: kompensierende Stärken vorhanden, Fakten offenlegen statt ausschließen |
| nicht ranked | PrivacyGuard | buyerGuide-Absatz (Info, keine Empfehlung): günstigster monatlicher 3B-Report-Refresh, aber keine zitierbare Consumer-Review-Basis + Affinion/Trilegiant-47-Staaten-Historie | Kern-Vergleichsspalte nicht ehrlich befüllbar (Credit-Pros-Logik, mildere Variante) |
| kein Slot | Identity Guard | Fußnote unter Auras deep_dive („Schwester-Marke ab $8,99") | Aura-Duplikat — ein Slot pro Konzern |
| Sidebar/buyerGuide | — | VantageScore-vs-FICO-Erklärung, AnnualCreditReport.com/Freeze-Selbsthilfe, „Monitoring ≠ Prävention", Free-Tier-Übersicht | AEO-/E-E-A-T-Content statt zusätzlicher Ranking-Slots |
