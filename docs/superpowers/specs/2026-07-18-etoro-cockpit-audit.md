# T0b — Cockpit-Datenaudit `us/trading/trading-platforms` (Optionsgebühren-Semantik + eToro-Zeile)

**Datum:** 2026-07-18 · **Auditor:** Fable (Primärquellen via WebFetch) · **Opus-Verifikation:** ausstehend (Gate vor T8/T15/T17)
**Scope:** Semantik-Definition für alle 9 Zeilen; migriert werden nur als inkonsistent befundene Zeilen (eToro, Robinhood-Note, Webull-Note).

---

## 1. Verbindliche Felddefinition `options_fee`

> **`options_fee` = round-trip (open + close) broker-imposed per-contract fee auf Standard-US-Equity-Optionen.**
> *Broker-imposed* = vom Broker festgesetzte Gebühr — auch wenn sie regulatorische Kosten „deckt", sobald der Broker Höhe und Einbehalt bestimmt (Kennzeichen: „may differ from or exceed the actual fee").
> Reine 1:1-Durchreichungen einzeln ausgewiesener Regulierungs-/Börsenposten zählen NICHT in `options_fee`, sind aber **Pflichtbestandteil von `options_fee_note`** — sonst suggeriert 0.0 Kostenfreiheit, die nicht existiert.

**Ökonomische Ehrlichkeit (Kern des Audits):** eToros Durchreichungen (~$0.02 ORF + $0.02 LQT + $0.00279 TAF/Verkauf) und Robinhoods broker-eigene $0.04 combined liegen **praktisch gleichauf** (~$0.04–0.05 pro Kontrakt und Seite). Die DB-Werte 0.0 vs. 0.08 sind nach der Definition korrekt, dürfen aber nie ohne Note verglichen werden. **Jeder Exklusivitäts- oder „Cheapest"-Claim auf Basis von `options_fee` ist unzulässig.**

## 2. Quellenlage (abgerufen 2026-07-18)

| Anbieter | Befund | Quelle |
|---|---|---|
| **eToro US** | „No commission or contract fees" (US); Durchreichungen: ORF **$0.02**/Kontrakt, FINRA TAF **$0.00279**/Kontrakt (Verkauf), LQT **$0.02**/Kontrakt. Optionen-Start ab $50 erwähnt. | https://www.etoro.com/en-us/trading/fees/ |
| **Robinhood** | Keine Commission, aber **„Robinhood Contract Fee" $0.04/Kontrakt** (seit 10.01.2025, kombiniert reg./exchange-Kosten); „may differ from or exceed the actual fee we paid". Index-Optionen $0.35 (Gold)/$0.50. | https://robinhood.com/us/en/support/articles/trading-fees-on-robinhood/ |
| **Webull** | „does not charge commissions for … options listed on U.S. exchanges" (Equity); **Index-Optionen $0.50**/Kontrakt; **oversized orders $0.10**/Kontrakt; „Webull does not profit from these [pass-through] fees". | https://www.webull.com/pricing |
| **eToro Deposit** | Standard-Mindesteinzahlung **$50**; **ACH ab $10** (Funds-Availability-Dokument). **$100 ist durch keine Quelle gedeckt.** | https://www.etoro.com/en-us/customer-service/deposit-faq/ · https://www.etoro.com/wp-content/uploads/2021/10/Funds_Availability.pdf |

## 3. Feld-für-Feld: alt → neu

### eToro-Zeile (Hauptkorrekturen)

| Feld | Alt | Neu | Begründung |
|---|---|---|---|
| `tagline` | „Only true $0-fee options broker" | **„Copy trading at scale, with $0 broker contract fees on options"** | Exklusivclaim widerlegt (Webull $0, Robinhood ohne Commission). Neue tagline nennt belegte Fakten, kein Superlativ. |
| `account_minimum` | 100 | **50** | $100 quellenlos. $50 = Standard lt. Deposit-FAQ. |
| `attributes.deposit_note` | — | „$50 standard minimum first deposit; ACH transfers from $10 (eToro Funds Availability, checked 18 Jul 2026)." | Zahlungsweg-Differenzierung lt. Rev.-2.1-Review. |
| `attributes.options_fee_note` | „…The only true $0-options broker among these 9." | **„eToro charges no commission or broker-imposed per-contract fee on US options. Regulatory and exchange pass-through fees still apply (ORF $0.02, LQT $0.02, FINRA TAF $0.00279/contract on sales — ~$0.04–0.05 per contract per side, comparable to peers' combined fees)."** | Rev.-2.1-Pflichtformulierung + Bezifferung + Vergleichbarkeits-Hinweis. |
| `pros[0]` | „$0/contract options — the only true zero-fee options broker in this comparison" | „No commission or broker-imposed per-contract fee on US options (regulatory pass-throughs apply)" | dito |
| `cons[0]` | „$100 minimum first deposit for US customers, higher than most peers' $0" | „$50 minimum first deposit ($10 via ACH) — most peers require $0" | Faktenkorrektur, Con bleibt dem Sinn nach bestehen |
| `deep_dive` | „…the only broker in this comparison charging genuinely $0 per options contract … requires a $100 minimum first deposit…" | Neuformulierung ohne Exklusivclaim, mit $50/$10-Deposit und Pass-through-Hinweis | dito |
| `confidence` | low | **medium** | Nach Audit sind Kern-Pricing + Deposit quellenbelegt; einziger offener Punkt bleibt extended_hours (transparent `null`). |
| `attributes.confidence_reason` | — | „Core pricing and deposit terms verified against official eToro pages (18 Jul 2026). Extended-hours availability for US accounts remains unestablished — no citable source; shown as unverified." | Rev.-2.1 Punkt 3 (JSONB, keine neue Spalte). |

### Robinhood-Zeile (nur Note)

| Feld | Alt | Neu |
|---|---|---|
| `attributes.options_fee_note` | „Round-trip of the combined $0.04/contract **regulatory/clearing pass-through fee**…" | „Round-trip of Robinhood's **broker-set** $0.04/contract combined fee (in effect since Jan 10, 2025) covering regulatory/exchange costs; per Robinhood's fee schedule it ‚may differ from or exceed the actual fee'. Index options $0.50/contract ($0.35 with Gold)." |

`options_fee: 0.08` bleibt — nach Definition korrekt (broker-set, round-trip 2 × $0.04).

### Webull-Zeile (nur Note)

| Feld | Alt | Neu |
|---|---|---|
| `attributes.options_fee_note` | „$0/contract on equity options; $0.50/contract on certain index options." | „$0 broker fee on US equity options; regulatory/exchange pass-throughs apply. $0.50/contract on certain index options; $0.10/contract on oversized orders (Webull pricing, checked 18 Jul 2026)." |

`options_fee: 0.0` bleibt — Definition erfüllt.

### Übrige 6 Zeilen (Fidelity, Schwab, IBKR, tastytrade, E*TRADE, Merrill)

`options_fee` 1.0–1.3 = klassische broker-imposed Per-Contract-Commissions → definitionskonform, **keine Migration**. (Vollständigkeit der Notes ist Task-10-Gesamtaudit, nicht T0b.)

## 4. Bewusst NICHT geändert (Audit-Entscheidungen)

1. **`score` 8.3 + `sub_scores`** (fees 8.8 / ux 8.4 / support 7.8 / features 8.0): redaktionelle Bewertungen, kein extern beweisbarer Fakt. Die zugrunde liegenden Fakten sind nach diesem Audit korrekt. Die fees-Rangfolge Webull 9.0 > eToro 8.8 > Robinhood 8.2 ist nach neuer Semantik plausibel (Webull ohne broker-eigene Options-/Aktiengebühren), aber eine Neukalibrierung aller 9 fees-Subscores gehört ins Task-10-Gesamtaudit. **8.3 darf nach Opus-Gate sichtbar werden.**
2. **`rating` 4.7 / `review_count` 24567** in der DB-Zeile: werden von V2 nicht gelesen (Source-of-Truth-Matrix); Bereinigung = Task-10.
3. `extended_hours: null` + ehrliche Note: bleibt — vorbildlich, ist die Vorlage für `confidence_reason`.

## 5. Migration

`supabase/migrations/20260718T0B00_audit_trading_platforms_options.sql` — UPDATEs für genau 3 Zeilen (eToro vollständig, Robinhood + Webull nur `attributes.options_fee_note`), Rollback-SQL als Kommentarblock am Dateiende. Anwendung auf Prod **manuell** (deploy.yml fährt keine Migrationen).
