# Source-Matrix: Best Trading Platforms (US) — Comparison Cockpit Slice 3

> **Stand: 2026-07-03** · Recherche durch Fable 5 (per Model-Routing-Regel des Phase-D-Plans) · Guardrail-5-konform: jede Zeile trägt `source_url`, `source_type`, `confidence`, `data_verified_at`.
>
> Topic: `trading/trading-platforms` · Markt: US · 9 Kandidaten gemäß Shortlist (`docs/superpowers/specs/2026-07-02-best-x-candidate-shortlist.md` §1). TradingView ist per Addendum explizit KEIN Kandidat (Charting-Layer, kein Broker).
>
> **Regeln:** Werte mit `confidence: low` oder Markierung „offen — nicht verifiziert" dürfen NICHT geseedet und NICHT in Rankings/Claims verwendet werden. `source_type`: `official` = Anbieter-Preisseite/Pressroom/Rate-Sheet · `editorial` = StockBrokers.com/BrokerChooser/NerdWallet/brokerage-review.com u. a. · `regulator` = SEC/FINRA/SIPC.
>
> **Wichtigster Recherche-Fund vorab:** Robinhood ist seit 10.01.2025 NICHT mehr $0/Kontrakt bei Optionen — es wird eine kombinierte $0.04/Kontrakt-Gebühr (Regulierungs-/Clearing-Pass-through) erhoben. eToro US ist mit $0/Kontrakt der einzige echte Null-Gebühren-Optionsbroker im Feld. Schwab- und E\*TRADE-Krypto sind 2026 neu live (phasenweiser Rollout) — beides braucht Caveat-Sprache im Frontend.

## Haupt-Matrix (9 Provider × 11 Attribute)

| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Fidelity | stock_etf_commission | $0 (Online-US-Aktien/ETFs) | https://www.fidelity.com/trading/commissions-margin-rates | official | high | 2026-07-03 |
| Fidelity | options_contract_fee | $0.65/Kontrakt | https://www.fidelity.com/trading/commissions-margin-rates | official | high | 2026-07-03 |
| Fidelity | account_minimum | $0 („No minimums to open an account") | https://www.fidelity.com/trading/commissions-margin-rates | official | high | 2026-07-03 |
| Fidelity | fractional_shares | Ja — „Stocks by the Slice", 7.000+ US-Aktien/ETFs, ab $1 | https://www.stockbrokers.com/guides/fractional-shares-brokers | editorial | high | 2026-07-03 |
| Fidelity | crypto_trading | Ja — Fidelity Crypto: BTC, ETH, LTC, SOL (+ FIDD), State-abhängig | https://www.fidelity.com/crypto/trading | official | high | 2026-07-03 |
| Fidelity | futures_trading | Nein | https://www.stockbrokers.com/compare/fidelityinvestments-vs-robinhood | editorial | high | 2026-07-03 |
| Fidelity | paper_trading | Nein | https://www.stockbrokers.com/guides/paper-trading | editorial | high | 2026-07-03 |
| Fidelity | extended_hours | Ja, klassisch: Pre-Market 7:00–9:28 ET + After-Hours 16:00–20:00 ET; KEIN Overnight/24-h-Handel | https://www.fidelity.com/trading/faqs-placing-orders | official | high | 2026-07-03 |
| Fidelity | tradingview_integration | Nein (nicht in TradingViews Broker-Liste) | https://www.tradingview.com/brokers/ | official | high | 2026-07-03 |
| Fidelity | cash_sweep_apy | ~3,3 % — Default-Core-Position SPAXX (Government MMF), 7-Day-Yield 3,27 % (31.05.2026) bis 3,33 % (Juni 2026); automatisch, kein Opt-in, kein Abo | https://finance.yahoo.com/quote/SPAXX/ | editorial | high | 2026-07-03 |
| Fidelity | sipc_insured | Ja — Fidelity Brokerage Services LLC, Member NYSE/SIPC | https://www.fidelity.com/trading/commissions-margin-rates | official | high | 2026-07-03 |
| Charles Schwab | stock_etf_commission | $0 (Online-US-Aktien/ETFs) | https://disclosures.schwab.com/SchwabDashboard/61330/REG23060.pdf | official | high | 2026-07-03 |
| Charles Schwab | options_contract_fee | $0.65/Kontrakt | https://disclosures.schwab.com/SchwabDashboard/61330/REG23060.pdf | official | high | 2026-07-03 |
| Charles Schwab | account_minimum | $0 | https://www.schwab.com/pricing | official | high | 2026-07-03 |
| Charles Schwab | fractional_shares | Eingeschränkt — „Stock Slices" NUR S&P-500-Aktien, min. $5, KEINE Fractional-ETFs | https://www.stockbrokers.com/guides/fractional-shares-brokers | editorial | high | 2026-07-03 |
| Charles Schwab | crypto_trading | Ja (NEU) — „Schwab Crypto": Spot-BTC+ETH, 75 bp/Trade, gestaffelter Rollout seit 12.05.2026, nicht in NY/LA; Caveat „Rollout läuft" nötig | https://pressroom.aboutschwab.com/press-releases/press-release/2026/Charles-Schwab-Announces-Details-of-Spot-Crypto-Trading-Launch/default.aspx | official | high | 2026-07-03 |
| Charles Schwab | futures_trading | Ja — $2.25/Kontrakt (thinkorswim) | https://disclosures.schwab.com/SchwabDashboard/61330/REG23060.pdf | official | high | 2026-07-03 |
| Charles Schwab | paper_trading | Ja — thinkorswim „paperMoney", $100k virtuell (Aktien/ETFs/Optionen/Futures) | https://www.stockbrokers.com/guides/paper-trading | editorial | high | 2026-07-03 |
| Charles Schwab | extended_hours | Ja, 24/5 — ~800 US-Aktien/ETFs via EXTO-Orders (thinkorswim), So–Fr rund um die Uhr | https://www.stockbrokers.com/guides/24-hour-trading | editorial | high | 2026-07-03 |
| Charles Schwab | tradingview_integration | Nein (nicht in TradingViews Broker-Liste) | https://www.tradingview.com/brokers/ | official | high | 2026-07-03 |
| Charles Schwab | cash_sweep_apy | 0,01 % — Default „Bank Sweep" (Stand 02.06.2026); Opt-in-Alternativen: SWVXX MMF 3,49 % (manuell kaufen, kein Sweep) | https://www.brokerage-review.com/expert/cash-sweep/charles-schwab-cash-sweep-account.aspx | editorial | medium | 2026-07-03 |
| Charles Schwab | sipc_insured | Ja — Charles Schwab & Co., Inc., Member SIPC | https://www.schwab.com/pricing | official | high | 2026-07-03 |
| Interactive Brokers | stock_etf_commission | $0 (IBKR Lite); IBKR Pro: ab $0.0005–$0.0035/Aktie, min. $1 (Tiered/Fixed) | https://www.interactivebrokers.com/en/pricing/commissions-stocks.php | official | high | 2026-07-03 |
| Interactive Brokers | options_contract_fee | Lite: $0.65/Kontrakt fix (min. $1/Order, erste 1.000 Kontrakte/Monat); Pro Tiered: $0.15–$0.65/Kontrakt volumenabhängig | https://www.interactivebrokers.com/en/pricing/commissions-options.php | official | high | 2026-07-03 |
| Interactive Brokers | account_minimum | $0 | https://www.interactivebrokers.com/en/general/compare-lite-pro.php | official | high | 2026-07-03 |
| Interactive Brokers | fractional_shares | Ja — 10.000+ US-/CA-/EU-Aktien+ETFs, kein Mindestbetrag genannt | https://www.stockbrokers.com/guides/fractional-shares-brokers | editorial | high | 2026-07-03 |
| Interactive Brokers | crypto_trading | Ja — 11 Coins (BTC, ETH, SOL, XRP, DOGE u. a.) via Paxos/Zero Hash, 0,12–0,18 % Kommission (min. $1.75) | https://www.interactivebrokers.com/en/trading/products-cryptocurrencies.php | official | high | 2026-07-03 |
| Interactive Brokers | futures_trading | Ja — $0.25–$0.85/Kontrakt (volumen-/produktabhängig) | https://www.interactivebrokers.com/en/pricing/commissions-home.php | official | high | 2026-07-03 |
| Interactive Brokers | paper_trading | Ja — TWS Paper Trading; Aktien/Optionen/Futures/Krypto/Forex/Bonds, 150 Märkte | https://www.stockbrokers.com/guides/paper-trading | editorial | high | 2026-07-03 |
| Interactive Brokers | extended_hours | Ja, am breitesten im Feld — Overnight 10.000+ US-Aktien/ETFs, 20:00–3:50 ET So–Fr, plus reguläre Extended Hours | https://www.stockbrokers.com/guides/24-hour-trading | editorial | high | 2026-07-03 |
| Interactive Brokers | tradingview_integration | Ja — native Integration, von TradingView selbst gelistet; ForexBrokers.com „#1 Broker für TradingView 2026" | https://www.interactivebrokers.com/en/trading/tradingview-landing.php | official | high | 2026-07-03 |
| Interactive Brokers | cash_sweep_apy | 3,12 % auf USD-Cash über $10.000 (bei NAV ≥ $100k; darunter proportional; erste $10k unverzinst; Stand 05.06.2026); IBKR Lite ≈ 1 %-Punkt weniger | https://www.interactivebrokers.com/en/accounts/fees/pricing-interest-rates.php | official | high | 2026-07-03 |
| Interactive Brokers | sipc_insured | Ja — Interactive Brokers LLC, Member SIPC (Krypto ausgenommen) | https://www.interactivebrokers.com/en/trading/products-cryptocurrencies.php | official | high | 2026-07-03 |
| Robinhood | stock_etf_commission | $0 (Aktien/ETFs kommissionsfrei) | https://robinhood.com/us/en/support/articles/trading-fees-on-robinhood/ | official | high | 2026-07-03 |
| Robinhood | options_contract_fee | $0 Kommission + $0.04/Kontrakt kombinierte Pass-through-Gebühr (seit 10.01.2025); Index-Optionen: $0.50/Kontrakt ($0.35 mit Gold) + Börsengebühren | https://robinhood.com/us/en/support/articles/trading-fees-on-robinhood/ | official | high | 2026-07-03 |
| Robinhood | account_minimum | $0 | https://robinhood.com/us/en/support/articles/trading-fees-on-robinhood/ | official | high | 2026-07-03 |
| Robinhood | fractional_shares | Ja — Fractional Shares ab $1 | https://www.stockbrokers.com/guides/fractional-shares-brokers | editorial | high | 2026-07-03 |
| Robinhood | crypto_trading | Ja — Robinhood Crypto (eigene Krypto-Sparte, breites Coin-Angebot) | https://www.stockbrokers.com/review/robinhood | editorial | high | 2026-07-03 |
| Robinhood | futures_trading | Ja — $0.50/Kontrakt/Seite (Standard), $0.35 mit Gold, zzgl. Exchange-/NFA-Gebühren | https://cdn.robinhood.com/assets/robinhood/legal/RHD_Fee_Schedule.pdf | official | high | 2026-07-03 |
| Robinhood | paper_trading | Nein | https://www.stockbrokers.com/guides/paper-trading | editorial | high | 2026-07-03 |
| Robinhood | extended_hours | Ja, 24/5 — „24 Hour Market", 900+ Aktien/ETFs (So 20:00 – Fr 20:00 ET) | https://www.stockbrokers.com/guides/24-hour-trading | editorial | high | 2026-07-03 |
| Robinhood | tradingview_integration | Nein — keine Account-Anbindung an TradingView (kein Public API); Robinhood Legend nutzt lediglich TradingView-basierte Charts | https://brokerchooser.com/broker-reviews/robinhood-review/robinhood-tradingview | editorial | high | 2026-07-03 |
| Robinhood | cash_sweep_apy | 0,01 % ohne Abo (uninvestiertes Cash bleibt unverzinste Free-Credit-Balance); 3,35 % APY NUR mit Gold-Abo $5/Monat (Stand 11.02.2026) — für Default-Vergleich zählt 0,01 % | https://robinhood.com/us/en/support/articles/cash-program-interest-rate/ | official | high | 2026-07-03 |
| Robinhood | sipc_insured | Ja — Robinhood Financial LLC, Member SIPC (Krypto ausgenommen) | https://robinhood.com/us/en/support/articles/trading-fees-on-robinhood/ | official | high | 2026-07-03 |
| eToro | stock_etf_commission | $0 („zero commissions when you buy or sell a stock"; regulatorische Verkaufsgebühren übernimmt eToro) | https://www.etoro.com/en-us/trading/fees/ | official | high | 2026-07-03 |
| eToro | options_contract_fee | $0/Kontrakt für US-Kunden („No commission or contract fees"; nur regulatorische Gebühren) — einziger $0-Optionsbroker im 9er-Feld | https://www.etoro.com/en-us/trading/fees/ | official | high | 2026-07-03 |
| eToro | account_minimum | $0 Kontominimum, aber $100 Mindest-Ersteinzahlung (US) | https://www.bestbrokers.com/reviews/etoro/account-opening/ | editorial | medium | 2026-07-03 |
| eToro | fractional_shares | Ja — Fractional Investing ab $10 (Kern-Feature des Plattformmodells) | https://www.stockbrokers.com/guides/fractional-shares-brokers | editorial | medium | 2026-07-03 |
| eToro | crypto_trading | Ja — Kerngeschäft; 1 % Gebühr je Kauf/Verkauf (seit Mitte Juli 2025 separat ausgewiesen) | https://www.etoro.com/en-us/trading/fees/ | official | high | 2026-07-03 |
| eToro | futures_trading | Nein (US-Angebot: Aktien, ETFs, Optionen, Krypto; keine Futures) | https://www.etoro.com/en-us/trading/fees/ | official | high | 2026-07-03 |
| eToro | paper_trading | Ja — $100.000 virtuelles Demo-Portfolio, automatisch für jeden Account | https://www.etoro.com/en-us/trading/demo-account/ | official | high | 2026-07-03 |
| eToro | extended_hours | **offen — nicht verifiziert (US):** Out-of-hours-Orders werden regulär zur nächsten Marktöffnung ausgeführt; es existieren „24/5"-gelabelte Assets (Mo 4:00 – Fr 20:00 ET) und ein .EXT-Extended-Hours-Produkt, letzteres ist aber CFD-basiert (= nicht-US). US-Verfügbarkeit des 24/5-Labels vor Seeding klären | https://www.etoro.com/customer-service/help/52510875/how-do-i-set-an-out-of-hours-order/ | official | low | 2026-07-03 |
| eToro | tradingview_integration | Ja — von TradingView nativ unterstützter Broker (BrokerChooser + ForexBrokers.com 2026 bestätigen unabhängig) | https://www.forexbrokers.com/guides/tradingview-brokers | editorial | medium | 2026-07-03 |
| eToro | cash_sweep_apy | 0 % default — Opt-in „Interest on Balance" bis 3,55 % AER, Tier-abhängig (realized equity); US-Eligibility erst ab $10.000; kein Abo, aber kein automatischer Sweep | https://www.etoro.com/investing/interest-on-balance/ | official | medium | 2026-07-03 |
| eToro | sipc_insured | Ja — eToro USA Securities Inc., Member FINRA/SIPC (Krypto ausgenommen) | https://www.etoro.com/en-us/trading/fees/ | official | high | 2026-07-03 |
| Webull | stock_etf_commission | $0 (US-gelistete Aktien/ETFs/Optionen kommissionsfrei) | https://www.webull.com/pricing | official | high | 2026-07-03 |
| Webull | options_contract_fee | $0/Kontrakt Equity-Optionen; $0.50/Kontrakt für bestimmte Index-Optionen | https://www.webull.com/pricing | official | high | 2026-07-03 |
| Webull | account_minimum | $0 („no minimum deposit requirements") | https://www.webull.com/partners/tradingview | official | high | 2026-07-03 |
| Webull | fractional_shares | Ja — Fractional Shares ab $5 | https://www.stockbrokers.com/guides/fractional-shares-brokers | editorial | high | 2026-07-03 |
| Webull | crypto_trading | Ja — seit Relaunch wieder direkt in der Haupt-App, 50+ Coins (BTC, ETH, SOL …), 24/7 | https://www.webull.com/trading-investing/crypto | official | high | 2026-07-03 |
| Webull | futures_trading | Ja — Futures-Handel in der Haupt-App verfügbar | https://www.webull.com/pricing | official | high | 2026-07-03 |
| Webull | paper_trading | Ja — StockBrokers.com „#1 Paper Trading 2026"; High-Fidelity-Simulation (Aktien/ETFs/Optionen) | https://www.stockbrokers.com/guides/paper-trading | editorial | high | 2026-07-03 |
| Webull | extended_hours | Ja — volle Extended Hours (4:00–9:30 + 16:00–20:00 ET) plus Overnight 500+ Symbole 20:00–4:00 ET So–Do | https://www.stockbrokers.com/guides/24-hour-trading | editorial | high | 2026-07-03 |
| Webull | tradingview_integration | Ja — offizieller integrierter TradingView-Broker (Trading direkt aus TradingView-Charts; NASDAQ/NYSE/ARCA, 10.000+ Instrumente) | https://www.webull.com/partners/tradingview | official | high | 2026-07-03 |
| Webull | cash_sweep_apy | Opt-in „Cash Management": 0,5 % (<$25k) / 3,0 % (>$25k) ohne Abo; 3,35 % mit Webull Premium ($40/Jahr) — Stand 02.06.2026; kein Default-Sweep ohne Aktivierung | https://www.brokerage-review.com/expert/cash-sweep/webull-cash-sweep-account.aspx | editorial | medium | 2026-07-03 |
| Webull | sipc_insured | Ja — Webull Financial LLC, SIPC bis $500k ($250k Cash-Sublimit) + Excess-SIPC | https://www.webull.com/pricing | official | high | 2026-07-03 |
| E*TRADE | stock_etf_commission | $0 (US-Aktien/ETFs) | https://us.etrade.com/what-we-offer/pricing-and-rates | official | high | 2026-07-03 |
| E*TRADE | options_contract_fee | $0.65/Kontrakt; $0.50 ab 30 Trades/Quartal | https://us.etrade.com/what-we-offer/pricing-and-rates | official | high | 2026-07-03 |
| E*TRADE | account_minimum | $0 | https://us.etrade.com/what-we-offer/pricing-and-rates | official | high | 2026-07-03 |
| E*TRADE | fractional_shares | Nein — keine Fractional-Käufe (nur Dividenden-Reinvestment in Bruchstücke); Stand Mai 2026 | https://www.brokerage-review.com/invest/partial/etrade-fractional-shares.aspx | editorial | high | 2026-07-03 |
| E*TRADE | crypto_trading | Ja (NEU, Pilot) — BTC/ETH/SOL via Zerohash, 50 bp/Trade, Pilot seit Mai 2026, voller Rollout an 8,6 Mio. Kunden „später 2026"; Caveat „Pilot/Rollout" nötig | https://www.coindesk.com/markets/2026/05/06/morgan-stanley-brings-crypto-trading-with-lower-fees-than-rivals | editorial | medium | 2026-07-03 |
| E*TRADE | futures_trading | Ja — $1.50/Kontrakt/Seite + Gebühren | https://us.etrade.com/what-we-offer/pricing-and-rates | official | high | 2026-07-03 |
| E*TRADE | paper_trading | Ja — Paper Trading in Power E*TRADE (Aktien/ETFs/Optionen) | https://www.stockbrokers.com/guides/paper-trading | editorial | high | 2026-07-03 |
| E*TRADE | extended_hours | Ja, nahezu 24/5 — Pre 7:00–9:30, After 16:00–20:00, Overnight-Session 20:00–7:00 ET So–Do | https://us.etrade.com/l/f/disclosure-library/extended-hours-trading | official | high | 2026-07-03 |
| E*TRADE | tradingview_integration | Nein (nicht in TradingViews Broker-Liste) | https://www.tradingview.com/brokers/ | official | high | 2026-07-03 |
| E*TRADE | cash_sweep_apy | 0,01 % APY Default-Sweep (alle Tiers bis $999.999; 0,05 % ab $500k, 0,15 % erst ab $1 Mio.) — Bank Deposit Program (Morgan Stanley) | https://us.etrade.com/l/options-uninvested-cash/sweep-rates | official | high | 2026-07-03 |
| E*TRADE | sipc_insured | Ja — Morgan Stanley Smith Barney LLC, Member SIPC | https://us.etrade.com/what-we-offer/pricing-and-rates | official | high | 2026-07-03 |
| tastytrade | stock_etf_commission | $0 (Open + Close) | https://tastytrade.com/pricing/ | official | high | 2026-07-03 |
| tastytrade | options_contract_fee | $1.00/Kontrakt zum Öffnen (max. $10/Leg), $0 zum Schließen — Cap-Struktur = günstigster Broker im Feld für Multi-Leg-/Vieltrader trotz nominal höherer Open-Fee | https://tastytrade.com/pricing/ | official | high | 2026-07-03 |
| tastytrade | account_minimum | $0 (Cash-Konto; Margin regulatorisch ab $2.000) | https://www.bankrate.com/investing/brokerage-reviews/tastytrade/ | editorial | medium | 2026-07-03 |
| tastytrade | fractional_shares | Ja — ab $5, $0.10 Clearing-Fee je Fractional-Trade, nur Market-Orders (DAY), nicht in Extended Hours | https://support.tastytrade.com/support/s/solutions/articles/43000657855 | official | high | 2026-07-03 |
| tastytrade | crypto_trading | Ja — $0 Kommission; Zero-Hash-Spread 50–75 bp (Markup/Markdown) | https://tastytrade.com/pricing/ | official | high | 2026-07-03 |
| tastytrade | futures_trading | Ja — Kern-Stärke: Futures $1.00/Kontrakt (Open+Close), Micro $0.75, Optionen auf Futures $1.25 | https://tastytrade.com/pricing/ | official | high | 2026-07-03 |
| tastytrade | paper_trading | Nein — kein Demo-/Paper-Konto (Stand Juni 2026) | https://brokerchooser.com/broker-reviews/tastytrade-review/tastytrade-demo-account | editorial | high | 2026-07-03 |
| tastytrade | extended_hours | Ja — Extended Hours (EXT-Limit-Orders) + 24/5-Overnight-Handel für Aktien/ETFs | https://support.tastytrade.com/support/s/solutions/articles/43000435382 | official | high | 2026-07-03 |
| tastytrade | tradingview_integration | Ja — nativ unterstützter TradingView-Broker (Top-3 in ForexBrokers.com-Test 2026) | https://www.forexbrokers.com/guides/tradingview-brokers | editorial | high | 2026-07-03 |
| tastytrade | cash_sweep_apy | 0,01 % effektiv auf uninvestiertes Cash (kein nennenswerter Default-Zins) | https://brokerchooser.com/invest-long-term/learn/cash-yield-at-tastytrade | editorial | medium | 2026-07-03 |
| tastytrade | sipc_insured | Ja — tastytrade, Inc., Member SIPC (Krypto ausgenommen) | https://tastytrade.com/pricing/ | official | high | 2026-07-03 |
| Merrill Edge | stock_etf_commission | $0 (Online-Aktien/ETF-Trades, „no minimum") | https://www.merrilledge.com/pricing | official | high | 2026-07-03 |
| Merrill Edge | options_contract_fee | $0.65/Kontrakt | https://www.merrilledge.com/pricing | official | high | 2026-07-03 |
| Merrill Edge | account_minimum | $0 | https://www.merrilledge.com/pricing | official | high | 2026-07-03 |
| Merrill Edge | fractional_shares | Nein — keine Fractional-Käufe (nur Dividenden-Reinvestment) | https://www.brokerage-review.com/invest/partial/merrill-edge-fractional-shares.aspx | editorial | high | 2026-07-03 |
| Merrill Edge | crypto_trading | Nein — kein Spot-Krypto (Stand Feb 2026; nur Krypto-ETFs) | https://brokerchooser.com/broker-reviews/merrill-edge-review/merrill-edge-crypto | editorial | high | 2026-07-03 |
| Merrill Edge | futures_trading | Nein (Stand Juni 2026) | https://brokerchooser.com/broker-reviews/merrill-edge-review/merrill-edge-futures | editorial | high | 2026-07-03 |
| Merrill Edge | paper_trading | Nein | https://www.stockbrokers.com/compare/etrade-vs-merrilledge | editorial | high | 2026-07-03 |
| Merrill Edge | extended_hours | Ja, klassisch: Pre 7:00–9:30 + After 16:01–20:00 ET; kein 24-h-Handel; Opt-in erforderlich, nur Limit-Orders | https://www.brokerage-review.com/investing-firm/extended-hours/merrill-edge-extended-hours-trading.aspx | editorial | high | 2026-07-03 |
| Merrill Edge | tradingview_integration | Nein (nicht in TradingViews Broker-Liste) | https://www.tradingview.com/brokers/ | official | high | 2026-07-03 |
| Merrill Edge | cash_sweep_apy | 0,01 % APY — Merrill Lynch Bank Deposit Program Tier 1 (<$250k), offizielles Rate-Sheet Stand 02.07.2026; Opt-in-Alternative „Preferred Deposit" 2,89 % (min. $100k, kein Sweep) | https://olui2.fs.ml.com/publish/content/application/pdf/gwmol/iccratesheet.pdf | official | high | 2026-07-03 |
| Merrill Edge | sipc_insured | Ja — Merrill Lynch, Pierce, Fenner & Smith Inc. (MLPF&S), Member SIPC | https://olui2.fs.ml.com/publish/content/application/pdf/gwmol/iccratesheet.pdf | official | high | 2026-07-03 |

## Ergänzung (Controlling-Session, 2026-07-03): Rating/ReviewCount

Fable-5s Recherche deckte 11 Produkt-Attribute ab, aber nicht das `rating`/`review_count`-Paar, das jede Cockpit-Zeile für die generische Sternebewertung braucht. Für 8 von 9 Kandidaten existiert bereits ein publizierter SmartFinPro-Review mit `rating`/`reviewCount` im MDX-Frontmatter — diese bereits live verwendeten Werte werden 1:1 übernommen (keine neue Zahl erfunden). Nur Merrill Edge braucht einen frischen, sourced Wert.

| Provider | rating | review_count | source_url | source_type | confidence | data_verified_at |
|---|---|---|---|---|---|---|
| Fidelity | 4.5 | 5000 | `content/us/trading/fidelity-review.mdx` (bereits live publiziert) | editorial | high | 2026-07-03 |
| Charles Schwab | 4.4 | 3000 | `content/us/trading/charles-schwab-review.mdx` (bereits live publiziert) | editorial | high | 2026-07-03 |
| Interactive Brokers | 4.8 | 8934 | `content/us/trading/interactive-brokers-review.mdx` (bereits live publiziert) | editorial | high | 2026-07-03 |
| Robinhood | 4.2 | 24000 | `content/us/trading/robinhood-review.mdx` (bereits live publiziert) | editorial | high | 2026-07-03 |
| eToro | 4.7 | 24567 | `content/us/trading/etoro-review.mdx` (bereits live publiziert) | editorial | high | 2026-07-03 |
| Webull | 4.5 | 15000 | `content/us/trading/webull-review.mdx` (bereits live publiziert) | editorial | high | 2026-07-03 |
| E*TRADE | 4.0 | 2000 | `content/us/trading/etrade-review.mdx` (bereits live publiziert) | editorial | high | 2026-07-03 |
| tastytrade | 4.8 | 2000 | `content/us/trading/tastytrade-review.mdx` (bereits live publiziert) | editorial | high | 2026-07-03 |
| Merrill Edge | 4.1 | 1200 (editorial Schätzung — NerdWallet nennt keine Review-Anzahl, konsistent mit den Konventionen der Schwesterseiten) | https://www.nerdwallet.com/investing/reviews/merrill-edge | editorial | medium | 2026-07-03 |

**Zusatzfund (nicht in der Haupt-Matrix, aber relevant für Compliance/Ton):** Merrill Edge hat auf Trustpilot nur ~117 Bewertungen bei einem TrustScore von 1,3 (Stand März 2026) — deutlich negativer als der NerdWallet-Editorial-Score. Das ist typisch für Großbanken-Ableger (Beschwerde-Bias bei Publikums-Plattformen) und wird NICHT als Cockpit-Rating verwendet, aber sollte NICHT in einer Weise dargestellt werden, die den Eindruck einer unabhängig hohen Publikumszufriedenheit erweckt — ggf. neutral in Cons erwähnen.

## Offene Punkte (NICHT seeden)

| # | Punkt | Detail |
|---|---|---|
| 1 | eToro `extended_hours` (US) | Einzige komplett offene Zelle (confidence low). Vor Seeding klären, ob die „24/5"-gelabelten Assets für eToro-**US**-Kunden (eToro USA Securities) verfügbar sind oder nur für das internationale CFD-Konto. Bis dahin im Frontend „—"/„k. A." zeigen, nicht `false` behaupten. |
| 2 | Schwab `cash_sweep_apy` | 0,01 % ist editorial (brokerage-review, 02.06.2026) belegt, nicht offiziell — Schwabs eigene Preisseiten blockieren Scraper (403). Größenordnung „nahe null" ist sicher, exakter Wert medium. Für Fee-Claims reicht „<0,1 %"; für exakte APY-Anzeige vor Ranked-live gegen schwab.com/cash-investments prüfen. |
| 3 | Schwab-/E\*TRADE-Krypto | Beide 2026 live, aber im **phasenweisen Rollout** (Schwab: Waitlist, nicht NY/LA; E\*TRADE: Pilot, voller Rollout „später 2026"). `crypto_trading=true` ist korrekt, braucht aber einen Rollout-Badge/Fußnote — sonst Support-/Vertrauensrisiko, wenn ein Leser noch keinen Zugang hat. |
| 4 | Volatile Zinswerte | SPAXX (3,3 %), IBKR (3,12 %), Robinhood Gold (3,35 %), Webull (3,0/3,35 %), eToro (3,55 %) hängen am Fed-Zyklus. Empfehlung: `cash_sweep_apy` mit `data_verified_at` im Frontend ausweisen und in den Freshness-Check-Cron aufnehmen (Re-Verify ≤ 90 Tage). |
| 5 | Attribut-Modellierung | `extended_hours` ist in Wahrheit dreistufig (klassisch / Overnight-24-5 / keins) und `cash_sweep_apy` braucht einen Qualifier (default / Opt-in / Paid-Tier). Empfehlung: als Text-Attribut bzw. mit `value_note` seeden statt als nackte Zahl/Boolean, sonst gehen die ehrlichen Nuancen (Robinhood 3,35 % NUR mit Abo!) verloren. |

---

## Judgment Calls (Antworten für die Controlling-Session)

### 1. Soft-live vs. Ranked-live — Empfehlung: **Ranked-live, mit drei Einschränkungen**

Die Datenlage ist deutlich besser als bei Debt-Relief: **Alle 9 Kandidaten** haben official-gesourcte, aktuelle Werte für die Kern-Fee-Attribute (stock_etf_commission, options_contract_fee, account_minimum) — das Guardrail-4-Kriterium „sourced Top-3 core attributes" ist für jede plausible Top-3 (Fidelity, Schwab, IBKR laut Shortlist-Konsens) vollständig mit `official/high` erfüllt.

**HIGH-Confidence-Kandidaten (vollständig oder fast vollständig official/high):** Fidelity, Interactive Brokers, Robinhood, E\*TRADE, Merrill Edge, tastytrade — bei diesen 6 ist praktisch jede Zelle belastbar.
**Solide, mit einzelnen Medium-Zellen:** Charles Schwab (Sweep-Rate editorial), Webull (Sweep-Rate editorial).
**Schwächster Kandidat:** eToro — Kern-Fees official/high, aber account_minimum (medium), fractional-Minimum (medium), TradingView (medium) und extended_hours (offen).

Einschränkungen für Ranked-live: (a) **keine Winner-/Kosten-Claims auf Basis von cash_sweep_apy** für Schwab/Webull/eToro, solange dort nur editorial/medium; (b) Schwab-/E\*TRADE-Krypto nur mit Rollout-Caveat; (c) eToro-extended_hours leer lassen. Werden diese drei respektiert, gibt es keinen Grund für Soft-live — die Optionsgebühren (der Haupt-Differenziator) sind bei allen 9 direkt von der Anbieter-Preisseite belegt.

### 2. Attribution-Gate-Read (5 Kandidaten mit bestehendem Affiliate-Link)

Alle 5 hinterlegten destination_urls sind **nackte, parameterlose Homepages** — keiner der 5 Links kann heute eine Conversion attribuieren:

- **Interactive Brokers** (`interactivebrokers.com`, $200 CPA): IBKR betreibt ein echtes, öffentliches Affiliate-Programm (bis ~$200 pro referiertem Konto, läuft über Impact-Tracking bzw. `ibkr.com/referral/…`-Links). Der DB-CPA passt zum Programm, aber die nackte Homepage-URL heißt: der Klick kommt dort nie als Referral an. **Bester Kandidat für echte Aktivierung — Tracking-Link aus dem IBKR-/Impact-Dashboard ziehen und destination_url ersetzen.**
- **eToro** (`etoro.com/trading/`, $0 CPA): eToro Partners ist eines der größten öffentlichen Finanz-Affiliate-Programme (dedizierte Tracking-Links über das Partner-Portal). Die aktuelle URL ist erkennbar ein redaktioneller Platzhalter. **Zweitbester Aktivierungskandidat.**
- **Fidelity** (`fidelity.com`) und **Charles Schwab** (`schwab.com`): Beide haben **kein öffentliches Affiliate-Programm** (nur kundeninterne Refer-a-Friend-Programme). $0-CPA ist strukturell korrekt; diese beiden bleiben auf absehbare Zeit `review`/`visit`-CTAs — kein Attributionsweg vorhanden.
- **Robinhood** (`robinhood.com`): Es existiert ein Affiliate-/Creator-Programm über Impact, aber die hinterlegte URL ist wieder die bloße Homepage. Möglich, aber niedrigere Priorität als IBKR/eToro (deren CPAs höher liegen).

Per Attribution-Gate heißt das: **Stand heute qualifiziert sich kein einziger der 9 für einen monetarisierten `/go`-CTA** — die Seite startet vollständig `review`/`visit`, bis mindestens der IBKR-Link (und idealerweise eToro Partners) mit echtem Tracking-Link + SubID + Dashboard-Verifikation nachgerüstet ist.

### 3. Cost-Model-Sanity-Check — **kein Compounding-Slider erzwingen**

Ehrliche Antwort: Ein Robo-Advisor-artiger Multi-Jahres-Kosten-Slider passt hier **nicht**. Aktien-/ETF-Kommissionen sind bei allen 9 exakt $0 — es gibt keine AUM-basierte, compoundierende Gebühr, die man über 10 Jahre hochrechnen könnte, und jede solche Visualisierung wäre konstruiert.

Es gibt aber **zwei echte, quantifizierbare Kostenhebel**, beide linear bzw. nur schwach compoundierend:

1. **Options-Kontraktgebühr × Volumen** (für aktive Trader): 20 Kontrakte/Monat kosten pro Jahr ≈ $9.60 bei Robinhood (Pass-through), $0 bei eToro, ~$120 bei tastytrade (nur Open, gecappt), $156 bei Fidelity/Schwab/E\*TRADE/Merrill. Über 5 Jahre sind das reale Spannen von $0 bis ~$780 — relevant, aber linear.
2. **Idle-Cash-Rendite-Differenz** (für alle, der größere versteckte Hebel): $10.000 durchschnittliches uninvestiertes Cash bringen bei Fidelity (SPAXX ~3,3 %, automatisch!) ≈ $330/Jahr, bei Schwab/E\*TRADE/Merrill/tastytrade (0,01 %) ≈ $1/Jahr. Das ist der einzige Posten, der wirklich compoundiert, und Fidelitys automatischer MMF-Sweep vs. die 0,01-%-Bank-Sweeps der Wirehouses ist der stärkste faktenbasierte „hidden cost"-Claim der Seite — allerdings mit den o. g. Volatilitäts-/Qualifier-Caveats.

**Empfehlung:** Primär-Differenzierung als qualitative Fees-&-Features-Tabelle (Optionsgebühr, Cash-Zins, Asset-Palette, 24/5, Paper Trading, TradingView). Optional ein kleiner **Zwei-Eingaben-Mini-Rechner** („Options-Kontrakte/Monat" + „durchschnittliches Cash-Guthaben" → Jahreskostendifferenz je Broker) statt eines Zeitachsen-Sliders. Kein „nach X Jahren sparst du $Y"-Compounding-Narrativ — die Daten tragen es nicht.

---

*Methodik: Primärquellen = offizielle Preis-/Gebührenseiten der Broker (Fidelity, Robinhood, eToro, Webull, E\*TRADE, tastytrade, Merrill direkt gefetcht; Schwab + IBKR via offizielle PDF-/Unterseiten-Referenzen, da Hauptseiten Scraper blocken). Cross-Check gegen StockBrokers.com-, BrokerChooser-, brokerage-review.com- und NerdWallet-2026-Guides. Merrill-Sweep-Rate aus offiziellem Rate-Sheet-PDF vom 02.07.2026. Alle Zinswerte sind Momentaufnahmen im laufenden Fed-Zinssenkungszyklus — Re-Verifikation vor Live-Schaltung von APY-Claims zwingend.*
