# Source-Matrix: Best Forex Brokers (US) — Comparison Cockpit Slice 4

> **Stand: 2026-07-03** · Recherche durch Fable 5 (per Model-Routing-Regel des Phase-D-Plans) · Guardrail-5-konform: jede Zeile trägt `source_url`, `source_type`, `confidence`, `data_verified_at`.
>
> Topic: `forex/forex-brokers` · Markt: US · Kandidaten gemäß Shortlist (`docs/superpowers/specs/2026-07-02-best-x-candidate-shortlist.md` §2). TradingView ist per Addendum explizit KEIN Kandidat (Charting-Layer — als „Pair your broker with TradingView"-Sidebar/buyerGuide-Content führen).
>
> **Regeln:** Werte mit `confidence: low` oder Markierung „offen — nicht verifiziert" dürfen NICHT geseedet und NICHT in Rankings/Claims verwendet werden. `source_type`: `official` = Anbieter-Preisseite/Hilfe-Center/Site-Disclosure/Pressemitteilung · `editorial` = ForexBrokers.com/BrokerChooser/StockBrokers.com/DailyForex u. a. · `regulator` = NFA/CFTC-Registry-Angaben.
>
> **Wichtigste Recherche-Funde vorab (korrigieren die Shortlist §2):**
>
> 1. **IG US und tastyfx sind DERSELBE Broker.** IG US LLC hat seine Forex-Plattform im Juni 2024 offiziell zu tastyfx umbenannt (Businesswire-Pressemitteilung). Live-verifiziert am 2026-07-03: `https://www.ig.com/us` antwortet HTTP 200 mit finaler URL `https://www.tastyfx.com/` (Redirect). Es gibt keinen separaten „IG US"-Retail-Forex-Broker mehr. Shortlist-Slot #5 entfällt als eigener Kandidat.
> 2. **Plus500 US ist kein Spot-Forex-Broker.** Plus500US Financial Services LLC ist ein CFTC-registrierter **Futures** Commission Merchant (NFA ID 0001398) und bietet CME-**Futures** auf FX-Paare (plus Indizes, Krypto, Prediction Markets) — kein Retail-Spot-Forex (kein RFED/FDM). Details unten.
> 3. **Das echte US-Spot-Forex-Feld sind exakt 5 Broker:** tastyfx, Interactive Brokers, FOREX.com, OANDA, Charles Schwab. Das deckt sich 1:1 mit ForexBrokers.coms „5 Best US Forex Brokers of 2026" — es existieren schlicht nicht mehr legitime US-lizenzierte Retail-Spot-FX-Dealer mit Konsens.
> 4. **Charles Schwab Forex ist aktiv** (kein Discontinue gefunden; Forex auf thinkorswim seit 2024 ausgebaut, 65+ Paare, Produktseiten live) — aber mit 10.000-Einheiten-Mindestorder ohne Micro-Lots.
> 5. **FOREX.com blockt automatisierte Zugriffe hart** (403 sowohl via Datacenter-Fetch als auch via lokalem curl mit Browser-UA = TLS-/Bot-Fingerprinting-WAF). Der Broker selbst operiert nachweislich normal (Details im Urteils-Abschnitt).

## Haupt-Matrix (5 Spot-Broker × 10 Attribute)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| tastyfx | eur_usd_spread_pips | Ø 1,15 Pips (ForexBrokers-Messung, Standard-Konto, all-in ohne Kommission); offiziell „ab 0,8" (Standard), 0,0 (Zero+, mit Kommission), 0,6 (Prime, $50k+) | https://www.forexbrokers.com/reviews/tastyfx | editorial | high | 2026-07-03 |
| tastyfx | commission_per_lot | $0 (Standard/Prime); Zero+: $5 pro Seite = $10 Round-Turn je Standard-Lot, anteilig für Mini/Micro (0,1 Lot = $0,50/Seite); Volumen-Rebates bis 15 % | https://www.tastyfx.com/accounts/zero/ | official | high | 2026-07-03 |
| tastyfx | max_leverage | 50:1 auf Majors (volles CFTC-Retail-Maximum; EUR/USD-Margin ~2 %) | https://www.tastyfx.com/help-and-support/product-details/what-are-tastyfxs-forex-product-details/ | official | high | 2026-07-03 |
| tastyfx | min_deposit | $0 Kontominimum (Standard/Zero+; ForexBrokers nennt $1 Mindesteinzahlung); Prime erfordert $50.000 | https://www.tastyfx.com/accounts/pricing/ | official | high | 2026-07-03 |
| tastyfx | micro_lots | Ja — 0,01 Lot = 1.000 Einheiten auf Standard-Kontrakten; zusätzlich Mini-Kontrakte auf 7 USD-Paaren bis hinunter zu 100 Einheiten (Margin ab $2) | https://www.tastyfx.com/help-and-support/mini-contracts/what-are-mini-contracts/ | official | high | 2026-07-03 |
| tastyfx | demo_account | Ja — kostenloses Demo-Konto auf eigener Plattform („Create demo account" / „Practice trading risk-free") | https://www.tastyfx.com/accounts/pricing/ | official | high | 2026-07-03 |
| tastyfx | tradingview_integration | Ja — offizielle Plattform-Kompatibilität Standard/Prime: „tastyfx, TradingView, MetaTrader 5"; Achtung: Zero+-Konto NUR tastyfx + MT5 (kein TradingView) | https://www.tastyfx.com/accounts/pricing/ | official | high | 2026-07-03 |
| tastyfx | mt4_mt5_support | Ja — MT5 (alle Kontotypen) und MT4 (inkl. MT4-Demo, MT4 für Mac, VPS) | https://www.tastyfx.com/help-and-support/product-details/what-are-tastyfxs-forex-mt4-product-details/ | official | high | 2026-07-03 |
| tastyfx | currency_pairs_count | 85+ Währungspaare (Standard/Prime); Zero+ nur 7 Major-USD-Paare + 6 populäre Crosses | https://www.tastyfx.com/accounts/pricing/ | official | high | 2026-07-03 |
| tastyfx | nfa_cftc_regulated | Ja — tastyfx, LLC: CFTC-registrierter Retail Foreign Exchange Dealer (RFED) + Introducing Broker, NFA Forex Dealer Member, **NFA ID 0509630** (Site-Disclosure, Footer) | https://www.tastyfx.com/accounts/pricing/ | official | high | 2026-07-03 |
| Interactive Brokers (Forex) | eur_usd_spread_pips | Ø 0,226 Pips (ForexBrokers-Messung; roher Interbank-Spread ohne Markup — Kommission kommt separat obendrauf); offiziell „tight spreads as narrow as 1/10 PIP", Quotes von 17 FX-Dealern | https://www.forexbrokers.com/guides/united-states | editorial | high | 2026-07-03 |
| Interactive Brokers (Forex) | commission_per_lot | 0,20 Basispunkte × Handelswert (Tier I, ≤ $1 Mrd. Monatsvolumen), Minimum $2,00/Order → ≈ $2,30/Seite ≈ **$4,60 Round-Turn je 100k EUR/USD** (bei Kurs ~1,15); sinkt bis 0,08 bp bei > $5 Mrd. | https://www.interactivebrokers.com/en/pricing/commissions-spot-currencies.php | official | high | 2026-07-03 |
| Interactive Brokers (Forex) | max_leverage | 50:1 auf Majors / 20:1 Minors (US-Retail-Cap; gilt lt. ForexBrokers einheitlich für alle US-Broker) | https://www.forexbrokers.com/guides/united-states | editorial | high | 2026-07-03 |
| Interactive Brokers (Forex) | min_deposit | $0 | https://www.interactivebrokers.com/en/general/compare-lite-pro.php | official | high | 2026-07-03 |
| Interactive Brokers (Forex) | micro_lots | Eingeschränkt ja — IdealPro-Mindestorder $25.000; kleinere Orders (ab 1.000 Einheiten = 0,01 Lot) werden als „Odd Lot" geroutet und ~1 Pip außerhalb des Interbank-BBO gefüllt (schlechtere Ausführung für Kleinst-Trades) | https://www.interactivebrokers.com/en/trading/forexOrderSize.php | official | high | 2026-07-03 |
| Interactive Brokers (Forex) | demo_account | Ja — TWS Paper Trading (inkl. Forex, simulierte Funds) | https://www.interactivebrokers.com/en/trading/products-spot-currencies.php | official | high | 2026-07-03 |
| Interactive Brokers (Forex) | tradingview_integration | Ja — native TradingView-Broker-Integration (eigene offizielle Landing Page; auf TradingViews Broker-Liste); ForexBrokers „#1 Broker für TradingView 2026" | https://www.interactivebrokers.com/en/trading/tradingview-landing.php | official | high | 2026-07-03 |
| Interactive Brokers (Forex) | mt4_mt5_support | Nein — kein MT4/MT5; eigene Plattformen (TWS, IBKR Desktop/Mobile, FXTrader) | https://www.forexbrokers.com/reviews/interactive-brokers | editorial | high | 2026-07-03 |
| Interactive Brokers (Forex) | currency_pairs_count | 100+ Paare auf 28 Währungen (offiziell; Drittquellen zählen 105 Cash-FX-Paare) | https://www.interactivebrokers.com/en/trading/products-spot-currencies.php | official | high | 2026-07-03 |
| Interactive Brokers (Forex) | nfa_cftc_regulated | Ja — Interactive Brokers LLC, CFTC-registrierter FCM, NFA-Mitglied (NFA ID 0258600); Retail-Forex läuft unter dem FCM-Status (FCM-Ausnahme von separater RFED-Pflicht) | https://www.forexbrokers.com/reviews/interactive-brokers | editorial | high | 2026-07-03 |
| FOREX.com | eur_usd_spread_pips | Standard (spread-only): Ø 1,62 Pips lt. ForexBrokers-**Review** (US-Messung) — die ForexBrokers-**Guide**-Tabelle nennt 1,00; RAW-Konto: Ø 0,137 Pips + Kommission. Diskrepanz Standard-Wert vor Seeding auflösen (Empfehlung: RAW-all-in als Vergleichswert nutzen, Standard mit Spanne „1,0–1,6" ausweisen) | https://www.forexbrokers.com/reviews/forex-com | editorial | medium | 2026-07-03 |
| FOREX.com | commission_per_lot | Standard: $0 (spread-only); RAW: **$7 je 100k Round-Turn** ($3,50 je Seite, je Leg berechnet) | https://www.forexbrokers.com/reviews/forex-com | editorial | high | 2026-07-03 |
| FOREX.com | max_leverage | 50:1 auf Majors / 20:1 Minors (CFTC-Cap) | https://www.forexbrokers.com/reviews/forex-com | editorial | high | 2026-07-03 |
| FOREX.com | min_deposit | $100 (offizielle Empfehlung: $2.500 für sinnvolles Risk Management) | https://www.forexbrokers.com/reviews/forex-com | editorial | high | 2026-07-03 |
| FOREX.com | micro_lots | Ja — Micro-Lots 0,01 Lot = 1.000 Einheiten (eigene Plattform + MT5) | https://www.dailyforex.com/forex-brokers/forex-review/account-types | editorial | medium | 2026-07-03 |
| FOREX.com | demo_account | Ja — Demo-Konto verfügbar | https://www.forexbrokers.com/reviews/forex-com | editorial | high | 2026-07-03 |
| FOREX.com | tradingview_integration | Ja — steht auf TradingViews offizieller Broker-Liste (Konto direkt aus TradingView handelbar); zusätzlich TradingView-Charts in den eigenen Plattformen | https://www.tradingview.com/brokers/ | official | high | 2026-07-03 |
| FOREX.com | mt4_mt5_support | Ja — MT5 für US-Kunden (Standard- UND RAW-Pricing, US-Sonderfall); MT4 lt. ForexBrokers-Review ebenfalls für US-Residents verfügbar | https://www.forexbrokers.com/reviews/forex-com | editorial | high | 2026-07-03 |
| FOREX.com | currency_pairs_count | 80 Forex-Paare (5.500+ Symbole gesamt inkl. anderer Assetklassen) | https://www.forexbrokers.com/reviews/forex-com | editorial | high | 2026-07-03 |
| FOREX.com | nfa_cftc_regulated | Ja — GAIN Capital Group LLC (dba FOREX.com), RFED/Forex Dealer Member, **NFA #0339826**; Mutter: StoneX Group Inc. (NASDAQ: SNEX, börsennotiert) | https://www.stockbrokers.com/guides/best-forex-brokers | editorial | high | 2026-07-03 |
| OANDA (US) | eur_usd_spread_pips | Offiziell 1,4 Pips EUR/USD (US-Pricing-Seite; Majors 1,4–3,1); ForexBrokers-Messung Ø 1,68 — höchster Spread im 5er-Feld | https://www.oanda.com/us-en/trading/our-pricing/ | official | high | 2026-07-03 |
| OANDA (US) | commission_per_lot | $0 — reines Spread-Pricing („commission is wrapped into the spread"); Elite-Trader-Cash-Rebates $5–$17 je $1 Mio. ab $10 Mio. Monatsvolumen | https://www.oanda.com/us-en/trading/our-pricing/ | official | high | 2026-07-03 |
| OANDA (US) | max_leverage | 50:1 auf Majors — offiziell „Margin ab 2 % auf EUR/USD" (= 50:1), 3 % AUD/USD | https://www.oanda.com/us-en/trading/our-pricing/ | official | high | 2026-07-03 |
| OANDA (US) | min_deposit | $0 — „no minimum deposit or minimum balance" (offizielles Help-Center US) | https://help.oanda.com/us/en/faqs/minimum-deposit-requirement.htm | official | high | 2026-07-03 |
| OANDA (US) | micro_lots | Ja — kleinste Ordergröße **1 Einheit** (flexibelste Positionsgrößen im Feld, unter Micro-Lot-Niveau); auf MT4 Standard-Lot-Notation 0,01 = Micro | https://help.oanda.com/us/en/faqs/micro-lots.htm | official | high | 2026-07-03 |
| OANDA (US) | demo_account | Ja — kostenloses Demo-Konto | https://www.oanda.com/us-en/trading/our-pricing/ | official | high | 2026-07-03 |
| OANDA (US) | tradingview_integration | Ja — auf TradingViews offizieller Broker-Liste; TradingView-Award „Broker of the Year"; OANDA-Trade-Charts powered by TradingView (80+ Indikatoren) | https://www.tradingview.com/brokers/ | official | high | 2026-07-03 |
| OANDA (US) | mt4_mt5_support | Teilweise — MT4 ja (offiziell „OANDA Trade and MT4"); **MT5 für US-Kunden nicht verfügbar** (nur bei Nicht-US-Entities) | https://www.oanda.com/us-en/trading/our-pricing/ | official | high | 2026-07-03 |
| OANDA (US) | currency_pairs_count | 68+ Major- und Minor-Paare | https://www.oanda.com/us-en/trading/our-pricing/ | official | high | 2026-07-03 |
| OANDA (US) | nfa_cftc_regulated | Ja — OANDA Corporation, CFTC-registrierter FCM + RFED, NFA-Mitglied **Nr. 0325821** (Site-Disclosure auf oanda.com/us-en verifiziert); kontinuierliche CFTC-Registrierung seit 1996er-Ära | https://www.oanda.com/us-en/trading/ | official | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | eur_usd_spread_pips | Ø 1,27 Pips (ForexBrokers-Messung Okt 2025); commission-free — Gesamtkosten stecken im Bid/Ask-Spread (Schwab markiert den Spread auf) | https://www.forexbrokers.com/reviews/charles-schwab | editorial | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | commission_per_lot | $0 — „Commission-free*; *Trade costs are reflected in the bid-ask spread" (offiziell) | https://www.schwab.com/forex | official | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | max_leverage | Bis 50:1 auf Majors (US-Retail-Cap gilt); Schwab publiziert auf den Produktseiten keine eigene Max-Leverage-Zahl — nur „highly leveraged" + Risk Disclosure. Vor Seeding einer konkreten Schwab-Zahl: offen — als „bis zu 50:1 (US-Cap)" ausweisen | https://www.forexbrokers.com/guides/united-states | editorial | medium | 2026-07-03 |
| Charles Schwab (thinkorswim) | min_deposit | $0 (aber separate Forex-Freischaltung/Approval nötig) | https://www.forexbrokers.com/reviews/charles-schwab | editorial | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | micro_lots | **Nein** — Mindestordergröße 10.000 Einheiten („smallest trade size allowed is 10,000 units"); keine 1.000er-Micro-Lots — größte Schwäche für kleine Konten | https://www.forexbrokers.com/reviews/charles-schwab | editorial | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | demo_account | Ja — paperMoney auf thinkorswim (Simulation mit Live-Marktdaten, inkl. Forex) | https://www.schwab.com/forex/trade-forex | official | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | tradingview_integration | Nein — Forex ausschließlich über thinkorswim (Desktop/Web/Mobile); nicht auf TradingViews Broker-Liste | https://www.tradingview.com/brokers/ | official | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | mt4_mt5_support | Nein — kein MT4/MT5 | https://www.forexbrokers.com/reviews/charles-schwab | editorial | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | currency_pairs_count | 65+ offiziell („Access to over 65 currency pairs"); ForexBrokers-Review zählt 73 Paare aus 11 Währungen | https://www.schwab.com/forex | official | high | 2026-07-03 |
| Charles Schwab (thinkorswim) | nfa_cftc_regulated | Ja — Charles Schwab Futures and Forex LLC, CFTC-registrierter FCM + **NFA Forex Dealer Member** (offizielle Site-Disclosure); Forex-Konten nicht SIPC-geschützt (Standard bei US-Forex) | https://www.schwab.com/forex/trade-forex | official | high | 2026-07-03 |

## Entity-Auflösung: IG (IG US) — Shortlist-Slot #5

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| IG (IG US) | entity_status | **Identisch mit tastyfx** — IG US LLC hat die Forex-Plattform im Juni 2024 zu tastyfx umbenannt („IG US rebrands foreign exchange trading platform to tastyfx", IG-North-America-Pressemitteilung); Live-Check 2026-07-03: ig.com/us → HTTP 200 mit finaler URL tastyfx.com. Kein separater IG-US-Retail-Forex-Broker mehr existent. Alle 10 Attribute: siehe tastyfx-Zeilen (keine Doppelzählung) | https://www.businesswire.com/news/home/20240624759492/en/IG-US-rebrands-foreign-exchange-trading-platform-to-tastyfx | official | high | 2026-07-03 |
| IG (IG US) | content_hygiene_flag | `content/us/forex/ig-markets-review.mdx` (rating 4.1, affiliateUrl /go/ig-markets) beschreibt das Angebot unter veralteter Marke „IG Markets US" — sollte auf tastyfx umgezogen/redirected oder klar als „jetzt tastyfx" gekennzeichnet werden, bevor die Cockpit-Seite live geht. Nicht als eigener Kandidat ins Cockpit seeden | https://www.ig.com/us | official | high | 2026-07-03 |

## Sonderfall: Plus500 US — Shortlist-Slot #7 (Futures, kein Spot-Forex)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Plus500 US | product_surface | **Kein Spot-Forex-Dealer** — offizielle Selbstbeschreibung: „Plus500 US Futures … Futures on: Crypto, Equity Indices, Energy, Metals, **Forex**, Agriculture, Interest Rates, Prediction Markets". FX-Exposure ausschließlich über börsengehandelte CME-Währungs-Futures | https://us.plus500.com/en/ | official | high | 2026-07-03 |
| Plus500 US | eur_usd_spread_pips | Nicht anwendbar — börsengehandelte Futures haben keinen Dealer-Spread; Spread ist marktgetrieben (Orderbuch). **Offen — nicht verifiziert/nicht auf das Spot-Attribut abbildbar** | — | — | low | 2026-07-03 |
| Plus500 US | commission_per_lot | Nicht in Lots — Futures-Kommission: $0,49 je Micro-Kontrakt / $0,89 je Standard-Kontrakt **pro Seite**; zzgl. $10 Auto-Liquidation-Fee je Kontrakt | https://brokerchooser.com/broker-reviews/plus500-futures-review | editorial | high | 2026-07-03 |
| Plus500 US | max_leverage | Nicht anwendbar — Futures-Margin-Systematik (Exchange-Margins), nicht der 50:1-Retail-FX-Cap. **Offen — nicht auf das Spot-Attribut abbildbar** | — | — | low | 2026-07-03 |
| Plus500 US | min_deposit | $100 (Debit-/Kreditkarte, Google Pay) / $200 (Banküberweisung) | https://brokerchooser.com/broker-reviews/plus500-futures-review/regulation-safety-faq | editorial | high | 2026-07-03 |
| Plus500 US | micro_lots | Sinngemäß ja — Micro-Futures-Kontrakte handelbar (eigener $0,49-Kommissionstier für Micros), aber Kontrakt- statt Lot-Logik | https://brokerchooser.com/broker-reviews/plus500-futures-review/products-and-trading-faq | editorial | medium | 2026-07-03 |
| Plus500 US | demo_account | Ja — „Try free demo" / „demo live quotes" (offizielle Homepage) | https://us.plus500.com/en/ | official | high | 2026-07-03 |
| Plus500 US | tradingview_integration | Nein — eigene App/Web-Plattform; nicht auf TradingViews Broker-Liste gefunden | https://www.tradingview.com/brokers/ | official | medium | 2026-07-03 |
| Plus500 US | mt4_mt5_support | Nein — nur proprietäre Plattform | https://www.daytrading.com/plus500-us | editorial | high | 2026-07-03 |
| Plus500 US | currency_pairs_count | **Offen — nicht verifiziert** (Anzahl der angebotenen FX-Futures-Kontrakte nicht belastbar ermittelt; typisch wären ~10–20 CME-FX-Futures — NICHT seeden) | — | — | low | 2026-07-03 |
| Plus500 US | nfa_cftc_regulated | Ja, aber als **FCM (Futures)**, nicht als RFED/Forex Dealer Member — Plus500US Financial Services LLC, CFTC-registrierter Futures Commission Merchant, **NFA ID 0001398** (offizielle Site-Disclosure); FXEmpire-Award ist „Best **Futures** Broker" | https://us.plus500.com/en/ | official | high | 2026-07-03 |

---

## Urteils-Abschnitt (die 5 angeforderten Judgment Calls)

### 1. FOREX.com Link-Health-Verdikt

**Der Broker ist NICHT tot — der `dead`-Status ist ein WAF-False-Positive.** Befunde vom 2026-07-03:

- `https://www.forex.com/en-us/` und `/en-us/pricing/` liefern **403** sowohl via Datacenter-Fetch als auch via lokalem curl mit Chrome-User-Agent von einer Residential-IP → TLS-/Bot-Fingerprinting-WAF (blockt alles Nicht-Browser-artige), kein Server-Ausfall.
- Gegenbeweise für normalen Betrieb: ForexBrokers.com führt FOREX.com als **#3 im 2026er US-Ranking** und bestätigt „Operating status: Normal operations" unter StoneX Group Inc. (NASDAQ: SNEX); aktuelle offizielle Unterseiten (Account-Opening, RAW-Pricing-FAQ, MT5-Konto) sind frisch in Suchindizes präsent; StockBrokers.com 2026 bestätigt aktive NFA-Registrierung #0339826.
- **Empfehlung:** In diesem Slice als `review` rendern (Gate-5-Default) — nicht weil der Broker defekt wäre, sondern weil (a) der automatische Health-Check das Ziel nicht verifizieren kann und (b) die hinterlegte Destination `https://www.forex.com/en-us/` ohnehin ein nackter Homepage-Link ohne jegliche Tracking-Parameter ist (siehe Punkt 4). Den DB-`health_status` als „WAF-blocked, manuell verifiziert am 2026-07-03" annotieren statt „dead"; idealerweise den Link-Checker für forex.com auf Status-Code-Whitelist (403 ≠ tot) setzen.

### 2. Plus500-US-Verdikt

**Real, aktiv und NFA-reguliert — aber die falsche Produktkategorie.** Plus500US Financial Services LLC existiert als eigenständige, CFTC-registrierte US-Entität (FCM, NFA ID 0001398, offizielle Site-Disclosure; seit 2021 im US-Markt via Cunningham-Übernahme). Die Shortlist-Einordnung braucht jedoch eine Korrektur: Es ist ein **Futures-Broker** (CME-Währungs-Futures + Prediction Markets), **kein Retail-Spot-Forex-Dealer** (kein RFED/FDM). CFDs bietet die US-Entität korrekt nicht an (für US-Retail verboten). Der FXEmpire-Award lautet „Best **Futures** Broker".

**Empfehlung: Aus dem gerankten Spot-Forex-Feld nehmen.** Die Kern-Attribute der Seite (Dealer-Spread in Pips, Kommission pro Lot, 50:1-Leverage, Lot-Größen) sind auf ein Futures-Produkt nicht abbildbar — 3 von 10 Attributen wären „offen/nicht anwendbar". Zwei saubere Optionen: (a) komplett weglassen → **Top-5** (deckt sich exakt mit ForexBrokers.coms eigenem 5er-US-Feld — extern validiert), oder (b) als klar gelabelte, NICHT gerankte „Währungs-Futures-Alternative"-Karte unterhalb des Rankings (analog zur TradingView-Sidebar-Behandlung). Ein Ersatz-Spot-Kandidat mit Konsens existiert nicht (trading.com/Trading Point US hat sich aus dem US-Retail-Markt zurückgezogen) — **nicht auffüllen, Top-5 akzeptieren.** Zusammen mit der IG-US-Dedup (=tastyfx) schrumpft das ehrliche Feld von „7" auf **5 gerankte Spot-Broker**.

### 3. Soft-live vs. Ranked-live

**Ranked-live ist für die 5 Spot-Broker datenseitig vertretbar.** Konfidenz-Spread: tastyfx / IBKR / OANDA / Schwab nahezu vollständig `official`+`high` (Preisseiten, Help-Center, Site-Disclosures direkt verifiziert); FOREX.com ist der einzige editorial-lastige Kandidat (WAF), aber über ForexBrokers-Review/-Guide + StockBrokers konsistent belegt — einzige echte Restlücke ist die Standard-Spread-Diskrepanz 1,00 vs. 1,62 Pips (beide ForexBrokers-Quellen; Empfehlung: RAW-all-in als Rankingwert nutzen, Standard als Spanne ausweisen, oder vor Seeding einmal manuell im Browser die offizielle Pricing-Seite gegenprüfen). Kein Attribut der 5 steht auf `low`. Die Gates, die NICHT die Daten betreffen: FOREX.com → `review`-Render (Gate 5), tastyfx + Schwab ohne Affiliate-Link → `external_url`-Visit (per Standardregel), Plus500 nicht ranken. Unter diesen Bedingungen: **ranked-live empfohlen**, kein Soft-live-Zwischenschritt nötig.

### 4. Attribution-Gate-Lesart (3 Kandidaten mit bestehenden Links)

- **Interactive Brokers Forex** (slug `interactive-brokers-forex`, $200 CPA, healthy): IBKRs Partnerprogramm läuft über Impact (impact.com) mit SubID-fähigen Tracking-Links — grundsätzlich attributierbar. Prüfen, ob die Destination dieses Slugs dieselbe Impact-Tracking-Struktur trägt wie der bereits für trading-platforms geprüfte `interactive-brokers`-Slug (gleicher Advertiser, vermutlich gleiches Programm) — wenn ja, ist der Befund übertragbar.
- **FOREX.com** (slug `forex-com`): Destination ist `https://www.forex.com/en-us/` — ein **nackter Homepage-Link ohne Affiliate-/Tracking-Parameter**. Selbst bei perfekter Link-Health wäre hier null Attribution möglich. Klarer `review`-Fall, bis ein echter Tracking-Link (StoneX/FOREX.com-Partnerprogramm) mit SubID + Postback verifiziert ist.
- **OANDA** (slug `oanda`, healthy): OANDA betreibt ein eigenes Partnerprogramm; ob die hinterlegte Destination Tracking-Parameter trägt, konnte ohne DB-Zugriff nicht geprüft werden — vor CTA-Freischaltung die Destination-URL auf Referral-/SubID-Parameter prüfen (nackte oanda.com-URL = gleicher Fall wie FOREX.com → `review`/`visit`).

### 5. Kostenmodell-Empfehlung

**Ein echter Live-Kostenrechner ist hier erreichbar — `'fee-on-amount'` passt, definitive Empfehlung: nutzen.** Anders als bei trading-platforms (alle $0) haben Forex-Broker einen realen, volumenskalierenden Kostensatz: die Round-Turn-Kosten (Spread + ggf. Kommission) als Prozentsatz des gehandelten Notionals.

- **Mathematik:** 1 Pip EUR/USD = 0,0001 → Spreadkosten = Pips × 0,01 % des Notionals. Kommissionen als %-Satz addieren. Damit: `cost = amount × feeRate%` mit `amount` = **jährliches Handelsvolumen (Notional)** — exakt die `'fee-on-amount'`-Signatur.
- **Konkrete feeRates (Round-Turn, gemessene Ø-Spreads, Basis-Tier):**
  - Interactive Brokers: 0,226 Pips (0,00226 %) + 2 × 0,20 bp Kommission (0,004 %) = **0,0063 %**
  - FOREX.com RAW: 0,137 Pips (0,00137 %) + $7/100k (0,007 %) = **0,0084 %** · Standard spread-only: 0,0162 % (bei Ø 1,62)
  - tastyfx Standard: 1,15 Pips = **0,0115 %** (Zero+: 0,0 Pips + $10/100k = 0,010 %)
  - Charles Schwab: 1,27 Pips = **0,0127 %**
  - OANDA: 1,68 Pips = **0,0168 %** (offizielle 1,4 Pips = 0,014 %)
- **Nötige Annahmen (im buyerGuide/Methodology offenlegen):** (a) EUR/USD als Referenzpaar, (b) gemessene Durchschnitts-Spreads (ForexBrokers 2026) statt „ab"-Werbespreads, (c) pro Broker das Standard-/Einstiegs-Pricing (IBKR hat nur das Kommissionsmodell), (d) Slider-Semantik „jährlich gehandeltes Volumen": sinnvoller Bereich $120k (1 Mini-Lot-Round-Turn/Monat) bis $24 Mio. (20 Standard-Lot-RT/Monat), Default ~$1,2 Mio. (≈ 5 RT/Monat × 0,2 Lot). Trade-Größe/Frequenz muss NICHT separat abgefragt werden — sie kollabiert vollständig ins Jahresvolumen.
- **Kein neuer costModel-Kind nötig, kein `'banking'`-Nullmodell:** Die Kostenunterschiede sind real und groß (2,7× zwischen IBKR und OANDA) — ein inertes Modell würde den stärksten Differenziator der Kategorie verschenken.

---

## Empfohlene Kandidaten-Aufstellung für Slice 4 (Ergebnis dieser Recherche)

| Rang-Slot | Provider | Render-Empfehlung | Begründung |
|---|---|---|---|
| 1–5 (ranked) | tastyfx · Interactive Brokers · FOREX.com · OANDA · Charles Schwab | IBKR/OANDA je nach Attribution-Check `offer`/`visit`; FOREX.com `review`; tastyfx + Schwab `external_url`-Visit | Vollständiges legitimes US-Spot-Feld, deckungsgleich mit ForexBrokers.com 2026 |
| nicht ranked | Plus500 US | Optional: „Futures-Alternative"-Infokarte, sonst weglassen | FCM/Futures, kein Spot-Forex; Attribute nicht abbildbar |
| nicht ranked | IG (IG US) | Entfällt — identisch mit tastyfx; `ig-markets-review.mdx` Content-Hygiene-Fix | ig.com/us → tastyfx.com (Redirect verifiziert) |
| Sidebar | TradingView | buyerGuide-/Methodology-Content „Pair your broker with TradingView" | Per Addendum kein Broker-Slot; FOREX.com/OANDA/IBKR nativ integriert, tastyfx offiziell kompatibel |
