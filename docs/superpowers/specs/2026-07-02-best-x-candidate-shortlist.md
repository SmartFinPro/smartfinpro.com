# SmartFinPro — Best-X Top-9-Shortlist für die fehlenden Vergleichsseiten

> Stand: 02.07.2026 · Recherchiert gegen echte Marktführer-Vergleichsseiten (NerdWallet, Bankrate, Forbes Advisor, Investopedia, CNBC Select, StockBrokers.com, ForexBrokers.com, BrokerChooser, Money.com, G2, PCMag, TechRadar Pro, ConsumerAffairs u.a.) — nicht aus dem Gedächtnis geraten, sondern per WebSearch/WebFetch gegen aktuelle 2026er-Rankings verifiziert.
>
> Kategorien 1–8 sind die ursprünglich fehlenden Einträge aus `BEST_X_MANIFEST` (lib/comparison/topics/manifest.ts) — Robo-Advisors und Business-Bank-Accounts sind bereits live. Kategorien 9–10 sind Ergänzungen: **CFD-Broker** (explizit angefragt) und **Debt-Relief** (Empfehlung, siehe Begründung unten).
>
> **Begleit-Dokument:** `docs/superpowers/specs/2026-07-02-comparison-cockpit-phase-d-plus-extensions.md` — Design-Addendum zur Master-Spec (`2026-06-28-comparison-cockpit-design.md`), das diese Kandidatenlisten in konkrete Build-Tasks/offene Owner-Entscheidungen übersetzt. Diese Datei hier ist der reine Recherche-Input (Kandidaten + Quellenbeleg), keine Implementierungsanleitung.

## Kurzübersicht: Was ist schon abgedeckt?

| Kategorie | Markt | Bereits mit Review | Bereits mit aktivem Affiliate-Link | Neue Kandidaten (kein Review/Link) |
|---|---|---|---|---|
| Trading-Plattformen | US | 8 von 9 | 5 von 9 | Merrill Edge |
| Forex-Broker | US | 5 von 8 | 3 von 8 | Charles Schwab, Plus500 US |
| High-Yield-Savings | US | 0 von 9 | 0 von 9 (SoFi hat Link für anderes Produkt) | alle 9 — komplett neuer Aufbau nötig |
| Credit-Monitoring | US | 0 von 9 | 0 von 9 | alle 9 — komplett neuer Aufbau nötig |
| Credit-Repair | US | 3 von 9 | 1 von 9 | 6 neue |
| AI-Tools für Finance | US | 4 von 9 | 0 von 9 (Copy.ai/Jasper sind Marketing-Tools, gehören eigentlich nicht hierher) | 5 neue |
| Cybersecurity SMB | US | 5 von 9 | 5 von 9 | Bitdefender, Sophos, Bitwarden |
| Gold-Investing | US | 3 von 9 (+ Silver Gold Bull als einziger Affiliate-Link, aber NICHT in Top-9) | 0 von 9 (Silver Gold Bull ist "dead"-Status) | 6 neue |
| **CFD-Broker** | **UK/AU** | 3 von 9 (davon 2 fragwürdig, siehe unten) | 2 von 9 aktiv, 1 tot | Capital.com, Pepperstone, Saxo, IC Markets, XTB |
| **Debt-Relief** | **US** | 1 von 9 | 1 von 9 (aber falsch kategorisiert in DB) | 8 neue |

---

## 1. Best Trading Platforms (`trading/trading-platforms`)

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **Fidelity** | 5 Jahre in Folge Investopedia-Spitzenreiter; NerdWallet 2026 "Best Investing App"/"Best for Beginners"; StockBrokers.com "Best in Class" in 14 Kategorien | NerdWallet, Bankrate, Investopedia, StockBrokers.com, Benzinga | ✅ Review + aktiver Affiliate-Link |
| 2 | **Charles Schwab** | StockBrokers.com #1 Overall (2. Jahr in Folge), Top in Mobile/Advanced Trading/Service; thinkorswim-Plattform | NerdWallet, Bankrate, Forbes Advisor, StockBrokers.com, Benzinga | ✅ Review + aktiver Affiliate-Link |
| 3 | **Interactive Brokers** | Konsens-Pick "Best for Advanced Traders"; unübertroffene globale Marktabdeckung; #1 bei TradingView-Integrations-Rankings | NerdWallet, Bankrate, Forbes Advisor, Investopedia, Benzinga | ✅ Review + aktiver Affiliate-Link |
| 4 | **Robinhood** | Bankrate/Benzinga: beste Einsteiger-Usability; StockBrokers.com 2026 Award #1 Prediction Markets | Bankrate, Benzinga, StockBrokers.com | ✅ Review + aktiver Affiliate-Link |
| 5 | **eToro** | Investopedia-Kategorieführer Social Trading (CopyTrader); native TradingView-Chart-Integration | Investopedia, StockBrokers.com | ✅ Review + aktiver Affiliate-Link |
| 6 | **Webull** | NerdWallet Top-Pick Mobile-First/Active-Trader-Tools; StockBrokers.com #1 Paper Trading, #2 Overall | NerdWallet, Investopedia, StockBrokers.com | ⚠️ Review vorhanden, **kein** aktiver Affiliate-Link |
| 7 | **E\*TRADE** | Bankrate/NerdWallet Top-Performer; breiteste Kontoarten-Palette (Aktien, ETFs, Fonds, Optionen, Futures, Anleihen) | NerdWallet, Bankrate | ⚠️ Review vorhanden, **kein** aktiver Affiliate-Link |
| 8 | **tastytrade** | Investopedia "Best Options Broker" 5 Jahre in Folge; Benzinga bestätigt unabhängig | Investopedia, Benzinga | ⚠️ Review vorhanden, **kein** aktiver Affiliate-Link |
| 9 | **Merrill Edge** | Bankrate-Top-Pick; Alleinstellungsmerkmal: kostenlose BofA-Analystenresearch im Depot enthalten | Bankrate | 🆕 Komplett neu — kein Review, kein Link |

**TradingView-Einordnung (explizit geprüft):** Nicht als 9. Broker-Slot empfohlen. TradingView ist die Charting-/Analyse-Schicht, mit der Broker sich verbinden (100+ Broker-Partner) — es bietet selbst keine US-Aktienausführung/Depotführung. Interactive Brokers, tastytrade und eToro sind die Broker, die am häufigsten "am besten mit TradingView kombiniert" genannt werden. Empfehlung: TradingView separat als "Best Charting/Analyse-Tools"-Content oder als Ergänzung in Broker-Reviews führen ("integriert mit TradingView") — nicht auf dieser Seite als Broker-Konkurrent listen. Als eigener Monetarisierungs-Kandidat aber sehr relevant für **Kategorie 6 (AI-Tools)**, siehe dort.

---

## 2. Best Forex Brokers (`forex/forex-brokers`)

> Wichtig: Für US-Kunden sind nur NFA/CFTC-lizenzierte Broker zulässig. Globale Platzhirsche wie Pepperstone, IC Markets, XM, Exness nehmen KEINE US-Kunden an — bewusst ausgeschlossen.

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **tastyfx** | NFA/CFTC-reguliert (IG-Group-Infrastruktur); #1 "Best Overall" bei ForexBrokers.com & BrokerChooser 2026 | ForexBrokers.com, BrokerChooser, FXEmpire | ✅ Review vorhanden, kein Link |
| 2 | **Interactive Brokers (Forex)** | "Best for Professionals", niedrigste EUR/USD-Spreads (~0,226 Pips) | ForexBrokers.com, NerdWallet, Forbes Advisor, BrokerChooser | ✅ Review + aktiver Affiliate-Link |
| 3 | **FOREX.com** | Einer von nur ~5 legal lizenzierten US-Retail-FX-Dealern; starke TradingView-Integration | ForexBrokers.com, BrokerChooser, DailyForex, NerdWallet | ⚠️ Review vorhanden, Affiliate-Link auf "dead" — **Reparatur nötig** |
| 4 | **OANDA (US)** | NFA/CFTC-autorisiert, $0 Mindesteinlage, starke Research-Tools | ForexBrokers.com, FXEmpire, BrokerChooser | ✅ Review + aktiver Affiliate-Link |
| 5 | **IG (IG US)** | Mutterkonzern 8 Jahre in Folge #1 Forex-Broker weltweit (ForexBrokers.com); eigenständig NFA/CFTC-registriert | ForexBrokers.com | ✅ Review vorhanden, kein Link |
| 6 | **Charles Schwab (thinkorswim)** | "Best Support" für US-Forex-Trader; führend bei verwaltetem Vermögen unter US-Brokern | ForexBrokers.com, BrokerChooser, DailyForex | 🆕 Komplett neu |
| 7 | **Plus500 US** | NFA/CFTC-reguliert; FXEmpire "Best Trading Platform" für US-Trader, $100 Mindesteinlage | FXEmpire | 🆕 Komplett neu (Plus500 UK/AU-Links im System sind "dead") |
| 8 | *(nur 7 echte US-lizenzierte Broker mit belastbarem Konsens gefunden — siehe TradingView unten als 8./9. Slot-Alternative)* | | | |
| 9 | **TradingView** *(Begleit-Tool, kein Broker)* | Wird wiederholt als dominante Charting-Schicht genannt, mit der FOREX.com, OANDA, tastyfx und IBKR integrieren | ForexBrokers.com ("7 Best Brokers for TradingView"), BrokerChooser | 🆕 — als "Pair your broker with TradingView"-Sidebar-Content, nicht als eigener Ranking-Slot |

*Hinweis: Es existieren schlicht nur 7 relevante NFA/CFTC-lizenzierte Retail-Forex-Broker mit echtem Cross-Source-Konsens — das ist nahezu das komplette Universum. Alternative zu Slot 8/9: nur 7 Broker ranken + TradingView als redaktionelle Sidebar statt als 9. Kandidat.*

---

## 3. Best High-Yield Savings (`personal-finance/high-yield-savings`)

> Komplett neuer Aufbau — SmartFinPro hat aktuell **keinen einzigen** Review oder Affiliate-Link in diesem Segment.

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **Ally Bank** | FDIC-versichert, keine Mindesteinlage/Gebühren, ~3,10% APY, starkes Markenvertrauen | U.S. News, Forbes Advisor, NerdWallet | 🆕 Nur toter Robo-Advisor-Link vorhanden, kein Savings-Link |
| 2 | **Marcus by Goldman Sachs** | Goldman-Sachs-Marke, keine Gebühren/Minimum, historisch eine der höchsten "Big-Name"-APYs | CNBC Select, NerdWallet | 🆕 Nur toter UK-Link vorhanden |
| 3 | **Capital One 360 Performance Savings** | Gleicher Satz auf alle Guthaben, keine Gebühren, hat Discover-Kundenbasis übernommen (Merger 2025) | NerdWallet, CNBC Select | 🆕 Komplett neu |
| 4 | **CIT Bank (Platinum Savings)** | Eine der höchsten APYs unter Direktbanken (~4,10% ab $5.000 Guthaben) | Bankrate (#2), CNBC Select | 🆕 Komplett neu |
| 5 | **Synchrony Bank** | Wettbewerbsfähige APY, ATM-Zugang (Differenzierung ggü. reinen Online-Banken) | U.S. News, Forbes Advisor (4,5★) | 🆕 Komplett neu |
| 6 | **American Express National Bank** | Amex-Markenvertrauen, keine Minimums/Gebühren, 24/7-Service | CNBC Select, Forbes Advisor | 🆕 Komplett neu |
| 7 | **SoFi Bank (Checking & Savings)** | NerdWallet 2026 "Best Overall Bank", bis zu $2–3M erweiterter FDIC-Schutz via Sweep-Netzwerk | NerdWallet, Forbes Advisor, CNBC Select | ✅ **Bereits 2 aktive US-Affiliate-Links** (Personal Loans, Robo) — leichtester Umsetzungs-Kandidat, da Partnerbeziehung schon besteht |
| 8 | **Barclays (Tiered Savings)** | Keine Gebühren/Minimum, gestaffelte APY bis 3,65% ab $250k | U.S. News, NerdWallet | 🆕 Komplett neu |
| 9 | *(Discover Bank bewusst ausgeschlossen — siehe Hinweis unten)* | | | |

**Hinweis Discover Bank:** Historisch Top-Marke, aber seit der Fusion mit Capital One (Mai 2025) werden **keine Neuanträge mehr angenommen** — für eine Affiliate-Seite nicht bewerbbar, daher aus der Top-9 gestrichen. Ebenfalls ausgeschlossen: Newtek Bank (NerdWallet nominell #1), da aktuell ebenfalls keine Neuanmeldungen möglich sind.

**Empfehlung:** SoFi zuerst umsetzen (Partnerbeziehung existiert bereits), danach Ally/Marcus/Amex als bekannteste Marken.

---

## 4. Best Credit Monitoring (`personal-finance/credit-monitoring`)

> Komplett neuer Aufbau — kein bestehender Review/Link. Unterscheidet sich von "Credit-Repair" (Streitigkeiten/Reparatur vs. Monitoring).

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | Affiliate-Potenzial |
|---|---|---|---|---|
| 1 | **Experian (IdentityWorks)** | "Best Overall", FICO-Score-Monitoring, 3-Bureau-Abdeckung, starkes Markenvertrauen als Auskunftei selbst | Money.com, Investopedia, CNBC Select, NerdWallet | ✅ CJ Affiliate + Awin, ~$12–31/Sale, 30-Tage-Cookie |
| 2 | **Aura** | Schnellste Alarmierung (4 Min. vs. Stunden bei Wettbewerbern), bis $1M Identitätsdiebstahl-Versicherung, bündelt Passwortmanager/Antivirus | Money.com (#2), CNBC Select | ✅ Direktprogramm, $65 pro Enrollment (bis $125 via Aura Business), 60-Tage-Cookie |
| 3 | **PrivacyGuard** | Monatliche Tri-Bureau-Reports (Wettbewerber oft nur quartalsweise), dedizierter Restoration-Agent | Money.com (#3), CNBC Select | ⚠️ Kein bestätigtes offenes Affiliate-Programm gefunden — vor Aufbau verifizieren |
| 4 | **IdentityForce** | Bis $2M Versicherungsschutz (höchster gefundener Wert), TransUnion-Tochter, starkes Familien/Kinder-SSN-Monitoring | Money.com (#5), Forbes Advisor | ✅ CJ Affiliate, $35 Flat/Sale, 30-Tage-Cookie |
| 5 | **LifeLock (Norton)** | Norton/Gen-Digital-Marke, sehr hohe Konsumentenbekanntheit in den USA | CNBC Select, Investopedia | ✅ Impact-Netzwerk, 20% Provision, 60-Tage-Cookie, dediziertes Affiliate-Management |
| 6 | **IdentityIQ** | $1M Versicherung selbst im günstigsten Tarif ($6,99/Monat), niedrigster Einstiegspreis | Ranking-Aggregator, Security.org, U.S. News | ✅ Awin + Inhouse, ~$40/Signup — ⚠️ BBB "B"-Rating mit Billing-Beschwerdemuster, vor Feature vorsichtig prüfen |
| 7 | **myFICO** | Einziger Anbieter mit echtem FICO-8/9-Score (der Score, den Kreditgeber tatsächlich nutzen) | Money.com (#7) | ✅ CJ Affiliate/ShareASale, $5–100 je Produkt (Jahres-3-Bureau: $100) |
| 8 | **IDShield** | Cybersecurity-Bundle (Malware/Ransomware-Schutz für bis zu 3 Geräte) | Money.com (#6), CNBC Select | ⚠️ Wahrscheinlich über LegalShield-Netzwerk, Konditionen nicht verifiziert |
| 9 | **Credit Karma** | Meistgenutzte kostenlose Monitoring-App in den USA, hohes Conversion-Volumen als "kostenloser" Einstieg | Money.com (#4), NerdWallet, CNBC Select, Investopedia — in ALLEN geprüften Quellen | ✅ Ja, aber schwach — Impact/Awin, nur ~$2–7/Signup (kein Abo-Umsatz dahinter) |

**Empfohlene Aufbau-Priorität:** Experian, Aura, LifeLock, IdentityForce, myFICO zuerst (etablierte Netzwerke, klare Auszahlungen). IdentityIQ hat die höchste Auszahlung, aber Reputationsrisiko. PrivacyGuard/IDShield erst redaktionell aufnehmen, Affiliate-Programm separat verifizieren.

---

## 5. Best Credit Repair Companies (`credit-repair/companies`)

> ⚠️ **Compliance-Warnung:** Lexington Law wurde mit einem **$2,7-Mrd.-CFPB-Urteil** (2023–2025) wegen illegaler Vorabgebühren belegt, ist in Chapter-11-Insolvenz gegangen, hat ~80% des Betriebs/Personals abgebaut und unterliegt einem 10-jährigen Telemarketing-Verbot. SmartFinPro hat aktuell einen aktiven Review für Lexington Law — **Compliance-Review empfohlen**, bevor hier weiter Traffic/Affiliate-Bewerbung draufgesetzt wird.

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **Credit Saint** | ConsumerAffairs #1 Overall (4,8/5, 533 Reviews, schlägt 16 Wettbewerber inkl. Lexington Law); 90-Tage-Geld-zurück-Garantie | ConsumerAffairs, Money.com, CNBC Select, Forbes Advisor | ✅ Review vorhanden |
| 2 | **Sky Blue Credit** | Längste Erfahrung (seit 1989); TopConsumerReviews Top-Score (5.0); unbedingte 90-Tage-Rückerstattung | Money.com, Forbes Advisor, TopConsumerReviews | 🆕 Noch nicht auf SmartFinPro |
| 3 | **The Credit People** | Niedrigste Einrichtungsgebühr der Kategorie ($19), unbegrenzte Disputes | Money.com, CNBC Select, Forbes Advisor | ✅ Review + **aktiver US-Affiliate-Link** |
| 4 | **Safeport Law** | "Best for Legal Support" (Money.com); anwaltsgestütztes Modell ohne CFPB-Vorbelastung | Money.com | 🆕 Noch nicht auf SmartFinPro |
| 5 | **MSI Credit Solutions** | "Best for Customized Pricing" (Money.com); Rückerstattung bei verfehlten Löschzielen | Money.com | 🆕 Noch nicht auf SmartFinPro |
| 6 | **Credit Firm** | TopConsumerReviews #3 (4.0/5); niedrigster Preispunkt seriöser Anbieter ($49,99) | TopConsumerReviews | 🆕 Noch nicht auf SmartFinPro |
| 7 | **Ovation Credit Services** | LendingTree-Tochter seit 2018 (Konzern-Rückhalt), A+ BBB | ConsumersAdvocate.org, BestCompany | 🆕 Noch nicht auf SmartFinPro |
| 8 | **The Credit Pros** | "Best for Extra Services" (Money.com), gebündeltes 3-Bureau-Monitoring — ⚠️ Trustpilot-Fake-Review-Flag + aktive TCPA-Klagen, nur mit starker Offenlegung featuren | Money.com, Forbes Advisor | 🆕 Noch nicht auf SmartFinPro |
| 9 | **Lexington Law** | Siehe Compliance-Warnung oben — nominell noch aktiv (als Oquirrh Mountain Law Group), aber massiv geschrumpft | Suchkonsens (CFPB, CBS News) | ⚠️ Review vorhanden — **Compliance-Check statt Ausbau empfohlen**, ggf. durch Safeport Law ersetzen |

**Explizit ausgeschlossen:** CreditRepair.com (gleiche CFPB-Durchsetzung/Shutdown, schlimmer betroffen, aktuell in keinem geprüften 2026er-Ranking).

---

## 6. Best AI Tools for Finance (`ai-tools/ai-tools-finance`)

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **Monarch Money** | Durchgängig #1 "AI-Budgeting-App" 2026, KI-Transaktionskategorisierung, starker Konsens | Mehrere AI-Budgeting-Roundups 2026 | ✅ Review vorhanden |
| 2 | **Copilot Money** | "Beste KI-Kategorisierung" für iOS, adaptive KI-Budgets | Era, X1Wealth, TechCapitalHub | ✅ Review vorhanden |
| 3 | **ChatGPT (OpenAI, Finance-Feature)** | 200M+ monatliche Nutzer, neues natives Personal-Finance-Feature (Plaid-Integration, 12.000+ Institute, seit Juni 2026) | OpenAI-Ankündigung, NerdWallet-adjacent | ✅ Review vorhanden |
| 4 | **QuickBooks (AI-Features)** | In fast jedem Finance-Automation-Ranking; KI-Kategorisierung, agentisches Bookkeeping | Zapier (#2), Capterra | ✅ Review vorhanden |
| 5 | **TradingView (AI Chart Copilot)** | Native KI seit 2026: AI Chart Copilot, KI-generierte SEC-Filing-Zusammenfassungen, KI-Screener; wird in "beste KI-Aktien-Tools"-Listen neben Trade Ideas/TrendSpider genannt | TraderPost, ChartingLens, mehrere AI-Stock-Tool-Roundups 2026 | 🆕 Kein Review/Link — **siehe Empfehlung unten** |
| 6 | **Danelfin** | Purpose-built KI-Aktienbewertung (AI Score 1–10), 10.000+ Features/Aktie täglich | Monday.com, ToolWorthy, WallStreetZen | 🆕 Komplett neu |
| 7 | **Composer (by SoFi)** | No-Code-KI-Strategiebuilder, seit Juni 2026 von SoFi übernommen (deutlich höhere Seriosität), $20 Mrd.+ verarbeitetes Handelsvolumen | WallStreetPrep, SoFi-Investor-Release | 🆕 Komplett neu |
| 8 | **Ramp** | KI-gestütztes Spend-Management, Auto-Genehmigung/Anomalie-Erkennung, wachsendes B2B-Finance-Segment | Zapier, Spendesk | 🆕 Komplett neu |
| 9 | **Truewind** | Führender "KI-Buchhaltungs-Agent", 47% automatisierter Monatsabschluss laut Anbieter, unabhängig bestätigt via G2 | G2, DesignRush | 🆕 Komplett neu |

**TradingView-Empfehlung für diese Kategorie:** **Aufnehmen.** Begründung: (1) echte, aktiv entwickelte native KI-Features seit 2026 (nicht nur Community-Skripte), (2) unabhängige Roundups gruppieren TradingView explizit mit dedizierten KI-Aktien-Tools, (3) eine der bekanntesten Fintech-Marken weltweit — schafft Vertrauen auf der Seite, (4) eigenes Affiliate-/Referral-Programm sofort nutzbar. Copy-Hinweis: als "KI-gestützte Trading- & Analyse-Plattform" positionieren, nicht als reines KI-natives Produkt (bleibt so compliance-sicher korrekt).

**Aufräum-Hinweis:** Copy.ai und Jasper AI (aktuell mit aktiven Affiliate-Links unter "ai-tools") sind reine Marketing-Content-Tools und tauchten in KEINER Finance-KI-Quelle auf — gehören eigentlich nicht in diese Kategorie, sondern sollten als "Marketing-KI" reklassifiziert werden. Systeme.io ebenfalls raus — reines Funnel/Kurs-Tool, kein Finance-Bezug.

---

## 7. Best Cybersecurity for SMBs (`cybersecurity/cybersecurity-smb`)

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **CrowdStrike (Falcon)** | Gartner Magic Quadrant Leader Endpoint Protection 2026, 4,7★/3.081 Reviews; starker SMB-Tier (Falcon Go) | Gartner Peer Insights, G2 | ✅ Review + aktiver Affiliate-Link ($200–700 CPA) |
| 2 | **Bitdefender (GravityZone)** | #1 SMB-Endpoint-Plattform bei G2/Capterra/AV-Test; PCMag-Empfehlung Einstiegsklasse | G2, PCMag, TechRadar Pro | 🆕 Komplett neu |
| 3 | **SentinelOne (Singularity)** | Gartner Magic Quadrant Leader 2026, 4,7★/2.875 Reviews; autonome Verhaltenserkennung | G2, Gartner Peer Insights | ✅ Review + aktiver Affiliate-Link |
| 4 | **Sophos (Intercept X)** | G2: "umfassendster Endpoint-Schutz weltweit"; EDR + MDR-Add-on | G2, SMB-Security-Roundups | 🆕 Komplett neu |
| 5 | **1Password Business** | "Meistgenutzter Enterprise-Passwortmanager" (G2, 180.000+ Firmen), 4,6★ | G2 | ✅ Review + aktiver Affiliate-Link |
| 6 | **Bitwarden** | #1 Enterprise User Satisfaction (G2 Grid, 11 Quartale in Folge), Open-Source-Transparenz | G2 | 🆕 Komplett neu |
| 7 | **NordLayer / NordVPN Business** | TechRadar hebt Cloud-native Firewall hervor, niedrigere Nutzer-Minimums als Perimeter 81 | TechRadar Pro, Cybernews, G2 | ✅ Review + aktiver Affiliate-Link (mehrere Märkte) |
| 8 | **Perimeter 81 (jetzt Check Point SASE/Harmony)** | Wiederholt "beste Business-VPN" genannt — **Marken-Hinweis: jetzt Teil von Check Point SASE/Harmony nach Übernahme, Branding auf SmartFinPro prüfen** | VPN/ZTNA-Vergleichsguides, G2 | ✅ Review + aktiver Affiliate-Link (700 CPA, hoher Wert) |
| 9 | **Proofpoint** | Höheres Gartner-Rating als Mimecast (4,7★/1.413 vs. 4,5★/710), stärkste Threat-Intelligence-Tiefe | Gartner Peer Insights | ✅ Review + aktiver Affiliate-Link |

**Beobachtung:** Mimecast taucht wiederholt als SMB-freundlichere Alternative zu Proofpoint auf (günstiger, einfachere Administration) — als 10. Kandidat oder Proofpoint-Alternative erwägenswert.

---

## 8. Best Gold Investing Platforms (`gold-investing/platforms`)

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **Augusta Precious Metals** | Fast überall #1/Best Overall; A+ BBB, AAA BCA; "transparenteste Preisgestaltung" (Investopedia, 4 Jahre in Folge) | Money.com, IRAEmpire, Love Gold/Gold Advisor | 🆕 Komplett neu |
| 2 | **Goldco** | #1 bei Pierce Points & Love Gold 2026, #2 bei Gold Advisor; A+ BBB seit 2011; $3 Mrd.+ Transaktionsvolumen | Investopedia-adjacent, Love Gold, Gold Advisor, Pierce Points | ✅ Review vorhanden |
| 3 | **American Hartford Gold** | "Best for Low Fees" (Money.com); keine Setup-/Transfer-/Liquidationsgebühren | Money.com, Gold Advisor | 🆕 Komplett neu |
| 4 | **Birch Gold Group** | Vollständig transparente Gebührenstruktur, langjährige Reputation | Investopedia-Zusammenfassung | 🆕 Komplett neu |
| 5 | **APMEX** | "Best Overall"/"Best Customer Support"; A+ BBB, seit 2000, größter Produktkatalog (30.000+) | Money.com | ✅ Review vorhanden |
| 6 | **JM Bullion** | "Best for Transparent Pricing"; A+ BBB; "Bullion Dealer of the Year" 3 Jahre in Folge (2026) | Money.com, Branchenauszeichnungen | ✅ Review vorhanden |
| 7 | **Noble Gold Investments** | "Best for Diverse Storage Options" (Money.com); #2 bei Love Gold | Money.com, Love Gold | 🆕 Komplett neu |
| 8 | **Money Metals Exchange** | A+ BBB, Service-first-Positionierung, höhere Rückkaufpreise | Money.com, Vergleichs-Coverage | 🆕 Komplett neu |
| 9 | **SD Bullion** | A+ BBB (4,7/5 bei manchen Trackern); Preisführer mit Price-Match-Garantie | Money.com | 🆕 Komplett neu |

**Wichtiger Fund zu Silver Gold Bull** (SmartFinPros einziger bestehender Gold-Affiliate-Link, aktuell "dead"-Status): Taucht bei KEINER der geprüften Vergleichsseiten in den Top-Rankings auf (Money.com schließt es explizit aus der Dealer-Liste aus). A+ BBB und solide Reviews (4,5★, ~4.900 Trustpilot), aber deutlich geringere redaktionelle Sichtbarkeit als die 9 oben. Der defekte Affiliate-Link sollte separat repariert werden — unabhängig davon aber keine Top-9-Priorität für neue Bewerbung.

---

## 9. Best CFD Brokers (`trading/cfd-brokers` — Markt: UK und/oder AU, NICHT US)

> ⚠️ **Wichtiger struktureller Hinweis:** CFD-Trading ist für US-Retail-Kunden gesetzlich verboten (CFTC-Verbot). Diese Seite kann daher nicht wie die anderen 8 als US-Seite gebaut werden — sie braucht einen UK- und/oder AU-Markteintrag im Comparison Cockpit. Das ist der erste "Best-X"-Fall außerhalb von US im Manifest. Siehe Design-Addendum §5 für die technischen Voraussetzungen.

| # | Broker | Warum zuverlässig/aussichtsreich & Marktlizenz | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **IG (IG Markets)** | Konsens-#1 fast überall; FCA-reguliert (UK) + ASIC-reguliert (AU); 17.000–19.500+ CFD-Märkte, Trust Score 99 | ForexBrokers.com (#1), Finder.com.au, Good Money Guide | ✅ UK (aktiv, £150 CPA) + AU (aktiv, $150 CPA) |
| 2 | **CMC Markets** | Konstant Top-3; FCA + ASIC-reguliert; 12.000+ Instrumente, mehrere "Best Platform"-Awards 2026 | ForexBrokers.com (#2), Good Money Guide 2026, Finder.com.au | ⚠️ Nur AU aktiv, **kein** UK-Link |
| 3 | **Capital.com** | BrokerChooser "Best CFD Broker" **sowohl UK als auch AU** 2026; enge Spreads, KI-gestützte Insights, niedriges Mindest-Investment | BrokerChooser UK, BrokerChooser Australia | 🆕 Komplett neu |
| 4 | **Pepperstone** | Australischer Ursprung, ASIC-reguliert; "Best Overall Broker 2026" bei CompareForexBrokers.com AU; auch FCA-reguliert für UK | CompareForexBrokers.com, BrokerChooser AU | 🆕 Komplett neu |
| 5 | **eToro** | Breit gelistet (Finder.com.au Top-3, ForexBrokers.com #3); FCA + ASIC-reguliert; Social-/Copy-Trading | ForexBrokers.com (#3), Finder.com.au | ⚠️ UK-Review vorhanden, Affiliate-Status unklar |
| 6 | **Saxo (Saxo Markets)** | High-End/Profi-Pick; FCA-reguliert (UK), auch AU-Kunden zugelassen; "Best CFD Broker" Good Money Guide Awards 2025; 71.000+ Instrumente | ForexBrokers.com (#4), BrokerChooser UK, Good Money Guide | 🆕 Komplett neu |
| 7 | **IC Markets** | Wiederholt "niedrigste Spreads"; ASIC-reguliert (AU-Ursprung), auch UK/international | BrokerChooser UK & AU (Spread-Champion) | 🆕 Komplett neu |
| 8 | **Plus500** | Wiederkehrender Pick (DailyForex, Finder.com.au Top-3 AU); FCA + ASIC-reguliert | DailyForex, Finder.com.au | ⚠️ UK + AU Reviews vorhanden, **Affiliate-Links in beiden Märkten tot** — Reaktivierung statt Neuaufbau |
| 9 | **XTB** | Stark bei BrokerChooser UK neben Capital.com/Saxo; FCA-reguliert; eigener 2026 "Best CFD Brokers UK"-Guide | BrokerChooser UK | 🆕 Komplett neu, primär UK |

**Wichtige Disqualifikationen aus der Recherche:**
- **Hargreaves Lansdown** (bereits im UK-Bestand) bietet **kein echtes eigenes CFD-Produkt** — der CFD-Zugang läuft über eine White-Label-Partnerschaft mit IG. Nicht als unabhängiger CFD-Broker geeignet, aus dem Ranking gestrichen.
- **SelfWealth** (AU, bereits mit aktivem Affiliate-Link) bietet **gar keine CFDs** an (nur Cash-Aktien ohne Margin). Sollte auf dieser Seite nicht positioniert werden.
- **Interactive Brokers (AU)** kam nur vereinzelt vor (US-lastige Quellen) — plausibler 10. Kandidat bei Erweiterung, aber nicht im Kern-Konsens.

---

## 10. Best Debt Relief Companies (`debt-relief/companies` — Markt: US)

**Warum diese Kategorie unbedingt ergänzt werden sollte:** Der Content existiert bereits vollständig (`content/us/debt-relief/`: Index, 2 Ratgeberseiten + ein voller National-Debt-Relief-Review), es gibt bereits einen aktiven Affiliate-Link, und Debt-Relief ist eine der umsatzstärksten Affiliate-Nischen im Personal-Finance-Bereich (hohe CPAs, jeder große Konkurrent — NerdWallet, Bankrate, Forbes Advisor, ConsumerAffairs, U.S. News — hat eine eigene "Best Debt Relief"-Vergleichsseite). Es ist der einzige Fall, wo SmartFinPro schon zahlende Infrastruktur hat, aber keine Cockpit-Vergleichsseite.

| # | Unternehmen | Warum zuverlässig/aussichtsreich | Gefunden bei | SmartFinPro-Status |
|---|---|---|---|---|
| 1 | **National Debt Relief** | AFCC-akkreditiert; BBB A+ (4,7–4,9★, ~59.000 Reviews — höchstes Review-Volumen der Kategorie); Forbes' #1-Pick 4 Jahre in Folge | NerdWallet, Bankrate, Forbes Advisor, ConsumerAffairs, Money | ✅ Voller Review + aktiver Affiliate-Link — **aber in der DB fälschlich unter "personal-finance" statt "debt-relief" kategorisiert** |
| 2 | **Freedom Debt Relief** | AFCC-akkreditiert; $20 Mrd.+ Schulden seit 2002 abgewickelt — ⚠️ 2019 CFPB-Bußgeld ($20M Rückerstattung + $5M Strafe) + 2024 TCPA-Vergleich ($9,75M); bei Promotion offenlegen | NerdWallet, Bankrate, CNBC Select, ConsumerAffairs, Money | 🆕 Komplett neu |
| 3 | **Accredited Debt Relief** | AFCC-akkreditiert (Beyond Finance); BBB A+ (4,89★, niedriges Beschwerdevolumen); Forbes-Pick für hohe Schuldsummen ($10k+) | Bankrate, Forbes Advisor, Money, ConsumerAffairs | 🆕 Komplett neu |
| 4 | **New Era Debt Solutions** | AFCC + IAPDA-akkreditiert; niedrigste Gebührenspanne der Kategorie (14–23%); niedrigste CFPB-Beschwerdequote unter etablierten Anbietern; 27+ Jahre im Geschäft | CNBC Select, Forbes Advisor | 🆕 Komplett neu |
| 5 | **Pacific Debt Relief** | BBB A+ (4,93★ — einer der höchsten Kundenbewertungswerte der Kategorie); seit 2002, $500M+ abgewickelt; keine Vorabgebühren | Bankrate, CNBC Select | 🆕 Komplett neu |
| 6 | **CuraDebt** | AFCC + IAPDA-akkreditiert; einziger mit Steuerschulden-Spezialisierung + Anwalts-Partnerschaft ("Best for Legal Support"/"Best for Tax Debt") | Money, Forbes Advisor | 🆕 Komplett neu |
| 7 | **Americor** | AFCC + IAPDA-akkreditiert; Forbes 2026 "Best Debt Relief Company" für Preistransparenz — ⚠️ BBB-Beschwerden stark steigend (CFPB-Beschwerden +540% 2021→2025), Dez. 2022 Colorado-AG-Vergleich ($200k Rückerstattung); vor Promotion beobachten | Forbes Advisor | 🆕 Komplett neu |
| 8 | **GreenPath Financial Wellness** | Non-Profit-Alternative (Schuldenberatung statt -verhandlung); NFCC-Mitglied, seit 1968, A+ BBB (4,95★) — guter "sanfter" Pick für Kunden, die keinen Kreditscore-Einbruch wollen | Referenziert in NerdWallet-DMP-Vergleichsguides | 🆕 Komplett neu |
| 9 | **JG Wentworth** | Längste Erfahrung der Kategorie laut Bankrate; breiteste Staatenabdeckung (alle außer West Virginia) | NerdWallet, Bankrate | 🆕 Komplett neu |

**Compliance-Hinweis:** Freedom Debt Relief (#2) und Americor (#7) haben die auffälligste Regulierungshistorie in dieser Liste — bei prominenter Featurung sichtbare Gebühren-/Risikohinweise einplanen (analog zur Credit-Repair-Behandlung). National Debt Relief, Accredited Debt Relief, New Era, Pacific Debt Relief und CuraDebt haben saubere bis minimale Beschwerdehistorien.

---

## Zusammenfassung: TradingView als Marktführer-Referenz

- **Trading-Plattformen:** NICHT als 9. Broker-Slot — TradingView ist die Charting-Schicht, kein Broker mit Orderausführung. Empfehlung: eigener "Best Charting-Tools"-Content oder Erwähnung in Broker-Reviews.
- **Forex-Broker:** Als 9. Slot in Form eines "Pair your broker with TradingView"-Sidebar-Kastens, da nur 7 echte NFA/CFTC-Broker mit Konsens existieren.
- **AI-Tools für Finance:** **Empfohlene Aufnahme** als vollwertiger Kandidat (#5) — TradingViews native KI-Features (AI Chart Copilot, KI-SEC-Filing-Summaries) sind 2026 real und werden von unabhängigen Quellen neben dedizierten KI-Aktientools geführt.

---

## Launch-Gate: Was diese Shortlist nicht ersetzt

Diese Datei ist bewusst eine Kandidaten-Shortlist, keine Seed- oder Monetarisierungsfreigabe. Sie kann ein **Soft-live-Gerüst** speisen (Kandidaten sichtbar, neutrale Reihenfolge, externe `Visit site`-Links ohne Affiliate-Code), ersetzt aber nicht die Datenfreigabe für einen vollwertig gerankten Vergleich. Vor Ranked-live je Topic gelten drei harte Gates:

1. **Primärdaten-Gate:** Die finalen Provider-Zeilen für Ranking, Winner-Chips und Kosten-/APY-/Spread-Vergleiche brauchen echte, aktuelle Produktattribute aus Primärquellen oder belastbaren Regulator-/Anbieterquellen (z. B. Gebühren, APY, Mindestanlage, Spreads, Versicherungsschutz, Feature-Flags). Jede ranked Zeile braucht `source_url`, `source_type`, `confidence` und `data_verified_at`.
2. **Attribution-Gate:** Affiliate-Potenzial oder ein vorhandener Partnerstatus reicht nicht für einen `/go`-CTA. Monetisierte CTAs erst setzen, wenn Tracking-Link, erlaubter SubID-Parameter und Postback-/Dashboard-Attribution pro Programm verifiziert sind. Sonst bleibt der Anbieter redaktionell als `review`/`visit`.
3. **Content-Hygiene-Gate:** Bestehende SmartFinPro-Reviews mit Compliance-, Branding- oder Dead-Link-Flags müssen vor Cockpit-Prominenz aktualisiert werden. Das betrifft insbesondere Lexington Law, Perimeter 81/Check Point SASE, FOREX.com, Plus500 UK/AU und Silver Gold Bull.

---

## Technischer Check: Laufen die bestehenden Best-X-Seiten problemlos unter allen 4 Silos?

**Kurzantwort: Nein — der Schutz davor, dass eine UK/CA/AU-URL falsche Inhalte zeigt, ist heute reiner Zufall (leere Datenbank), kein bewusstes Code-Design.** Vollständiger technischer Befund mit Datei:Zeile-Referenzen und Fix-Vorschlag: siehe **Design-Addendum §5** (`2026-07-02-comparison-cockpit-phase-d-plus-extensions.md`).

---

## Empfohlene nächste Schritte

1. **Schnellster Win von allen:** Debt-Relief-Seite bauen — Content existiert schon komplett, Affiliate-Deal existiert schon, es fehlt nur der Cockpit-Eintrag + die DB-Korrektur (National-Debt-Relief-Link von `personal-finance` auf `debt-relief` umkategorisieren).
2. **Weitere schnelle Wins:** Kategorien mit bereits bestehenden Reviews/Affiliate-Links ausbauen (Trading-Plattformen, Cybersecurity-SMB, Credit-Repair) — Cockpit-Integration ist am schnellsten machbar.
3. **CFD-Broker-Seite** braucht zuerst eine Marktentscheidung (UK, AU oder beide) UND die im Design-Addendum §5 beschriebenen Code-Erweiterungen (Markt-Dimension in TopicConfig, Currency-Formatierung, echte Compliance-Badges statt hartcodiertem SEC/SIPC/FDIC) — architektonisch der aufwändigste der 12 Fälle. Capital.com, Pepperstone, Saxo als vielversprechendste komplett neue Partner.
4. **FOREX.com-Link reparieren** (aktuell "dead"), **Silver Gold Bull-Link reparieren** (aktuell "dead") und **Plus500 UK/AU-Links reaktivieren** (beide "dead", aber für die neue CFD-Seite relevant) — unabhängig von dieser Liste, aber während der Recherche aufgefallen.
5. **Lexington-Law-Compliance-Review** einplanen, bevor die Credit-Repair-Seite live geht (CFPB-Urteil, siehe Abschnitt 5). Bei Debt-Relief dieselbe Vorsicht bei Freedom Debt Relief und Americor.
6. **Copy.ai/Jasper AI/Systeme.io** aus der `ai-tools`-Kategorie heraus reklassifizieren (Marketing-Tools, kein Finance-Bezug) — betrifft nicht direkt diese Liste, aber Datenhygiene für die neue AI-Tools-Finance-Seite.
7. **Komplett neue Segmente** (High-Yield-Savings, Credit-Monitoring) brauchen zuerst Affiliate-Programm-Anmeldungen, bevor MDX-Reviews + Cockpit-Einträge sinnvoll sind — SoFi (HYSA) und Experian/Aura/LifeLock (Monitoring) sind die am leichtesten umsetzbaren Startpunkte.

---

*Methodik-Hinweis: Einige Quellen (Bankrate, Forbes Advisor, CNBC Select, G2) blockierten direktes WebFetch (403/JS-Rendering) — deren Rankings wurden über WebSearch-Snippets rekonstruiert und, wo möglich, gegen mindestens eine zweite unabhängige Quelle gegengeprüft. Alle Angaben Stand Juli 2026, vor Live-Schaltung nochmals verifizieren (v.a. APYs, Gebühren, Affiliate-Konditionen ändern sich häufig). Enthält KEINE seed-fertigen Attributwerte (Gebühren/APY/Spreads) — siehe Design-Addendum §3/§7 für diesen offenen Punkt.*
