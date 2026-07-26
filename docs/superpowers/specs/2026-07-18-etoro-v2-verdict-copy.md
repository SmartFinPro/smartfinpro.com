# T15 — eToro V2 Verdict-Copy (Fable, aus T0b-auditierten Daten)

**Status:** Runde 1 REJECT (13 Fixes, alle umgesetzt) → Opus-Gate Runde 2 · **Quellenbasis:** ausschließlich `2026-07-18-etoro-cockpit-audit.md` (Opus-APPROVED, Stand bc0687a) + berechnete Feld-Daten (`position`/`field`: Rang 8/9, Score 8.3, Spread 1.6, Support 7.8 vs. Field-best 9.6).

**Gate-Runde 1 hat die vier markierten Aussagen geprüft:** (a) TradingView = nur eingebettetes Charting → Wording korrigiert; (b) Demo bestätigt, aber Geo-Qualifier Pflicht (nicht NY/NV/HI/PR/USVI); (c) SEC/FINRA/SIPC wahr, /legal/-Link 404 → BrokerCheck CRD #298361; (d) keine US-Futures bestätigt (StockBrokers.com 20.05.2026). Ursprünglich markiert: Drei Aussagen stammen NICHT aus dem T0b-Audit und brauchen unabhängige Verifikation — (a) **TradingView-Integration** (Seed-Attribut, unauditiert), (b) **$100.000-Demo-Konto** (Teil des approbierten deep_dive, aber nie extern geprüft; Quellkandidat https://www.etoro.com/en-us/trading/demo-account/), (c) **SEC-registriert / FINRA/SIPC-Mitglied** (Seed `sipc_insured`, unauditiert; Quellkandidat https://www.etoro.com/en-us/legal/ bzw. FINRA BrokerCheck). Zusätzlich (d) **cons[1] „No futures on US platform"** — vom T0b-Rollover byte-gleich übernommen, Wahrheit nie geprüft. Fällt eine Prüfung durch, fällt die betroffene Zeile ersatzlos.

Alle Wortlängen gegen §30.1 gezählt (Utility-kompatibel).

---

## Frontmatter-Block (Ziel: `content/us/trading/etoro-review.mdx`)

```yaml
reviewLayout: 'v2'
dataVerifiedDate: '2026-07-18'
verdict:
  positioning: >-
    A social-first US broker with zero broker contract fees on options
    (regulatory pass-throughs apply) — strong for copy trading, weaker on
    customer support.
  summary: >-
    eToro's US offering ranks 8th of the 9 trading platforms we track, at
    8.3/10 in a field so tight that 1.6 points separate first from last. It
    stands out for copy trading and charges no commission or broker-imposed
    per-contract fee on US options — though regulatory and exchange
    pass-through fees still apply, and run comparable to what peers charge
    outright. A $50 minimum deposit and no futures trading narrow its appeal.
    Support is its weakest dimension; platforms like Fidelity score materially
    higher there.
  bestFor:
    - Copy-trading and social investors
    - US options traders avoiding broker contract fees
    - Investors who practice first — a $100,000 demo is included
  notFor:
    - Futures traders — not offered on the US platform
    - Anyone prioritizing top-tier customer support
    - Traders who depend on extended-hours access — availability is unverified
  topStrengths:
    - No broker-imposed per-contract fee on US options (regulatory pass-throughs apply)
    - Copy trading with a standing $100,000 practice account
    - TradingView-powered charting built into the app
  mainLimitation: >-
    Customer support is eToro's weakest dimension and sits near the bottom of
    the field (7.8/10 against a field best of 9.6).
  bestAlternative:
    name: Fidelity
    slug: fidelity-review
    reason: the category leader at 9.6/10, with the field's strongest support score (9.6)
sectionVerdicts:
  fees: >-
    No commission or broker-imposed contract fees on US options and stocks;
    regulatory pass-throughs apply and roughly match what rivals charge as
    their own fees.
  markets: >-
    Stocks, ETFs, options and crypto in one account — with copy trading as
    the differentiator. No futures, which rules out an entire trader segment.
  platform: >-
    The platform is built around social features and a standing $100,000
    demo account; TradingView-powered charting covers needs most
    social-first brokers leave out.
  safety: >-
    eToro USA Securities is SEC-registered and a FINRA/SIPC member; crypto is
    held with eToro USA LLC, outside SIPC coverage. Extended-hours
    availability remains unverified.
  support: >-
    Support is eToro's weak spot — 7.8/10, near the bottom of a field whose
    best scores 9.6. Weigh this if service quality drives your choice.
finalDecision: >-
  eToro earns its place for a specific trader: one who values copy trading,
  wants a large practice account before committing real money, and trades US
  options without broker contract fees (regulatory pass-throughs apply).
  Within this field it is a mid-tier
  all-rounder, not a category leader — seven platforms score higher overall,
  and its support rating sits near the bottom of the group. Choose eToro if social
  features and options pricing drive your decision and you accept average
  support. Choose Fidelity instead if you want the strongest overall
  package — it leads this field at 9.6/10 with the best support score.
  Either way, compare the full field before opening an account; only 1.6
  points separate all nine.
essentialFacts:
  - label: Options contract fee
    value: $0 broker-imposed
    context: 'Regulatory/exchange pass-throughs apply: ORF $0.02, LQT $0.02, TAF $0.00279/contract on sales'
    asOf: '2026-07-18'
    sourceHref: https://www.etoro.com/en-us/trading/fees/
  - label: Stock & ETF commission
    value: $0
    context: eToro pays regulatory transaction fees on stock sales
    asOf: '2026-07-18'
    sourceHref: https://www.etoro.com/en-us/trading/fees/
  - label: Minimum first deposit
    value: $50
    context: All standard methods; wire transfers from $500
    asOf: '2026-07-18'
    sourceHref: https://www.etoro.com/en-us/customer-service/deposit-faq/
  - label: Practice account
    value: $100,000 virtual
    context: Included automatically; not available in NY, NV, HI, PR or the US Virgin Islands
    asOf: '2026-07-18'
    sourceHref: https://www.etoro.com/en-us/trading/demo-account/
  - label: Regulation
    value: SEC-registered · FINRA/SIPC member
    context: eToro USA Securities Inc.
    asOf: '2026-07-18'
    sourceHref: https://brokercheck.finra.org/firm/summary/298361
alternatives:
  - slug: fidelity-review
    name: Fidelity
    whyInstead: >-
      The category leader (9.6/10) with the field's best support score — the
      stronger overall package.
  - slug: webull-review
    name: Webull
    whyInstead: >-
      Also charges no broker fee on US equity options (pass-through fees
      apply), and adds free advanced charting and paper trading.
  - slug: robinhood-review
    name: Robinhood
    whyInstead: >-
      The simpler app for beginners; its $0.04-per-contract combined options
      fee is broker-set but comparable in size.
updateLog:
  - date: '2026-07-18'
    changes:
      - Options-fee claim corrected — no exclusivity; pass-through fees itemized
      - Minimum deposit corrected to $50 (was unsourced $100)
      - Unverifiable testing claims and fabricated reviewer attributions removed (see repo history, commit b7ffc23)
```

## Sprachregeln, gegen die diese Copy geschrieben ist

Kein Superlativ/Exklusivclaim („only/cheapest/best" nur als „field best" mit Zahl) · keine Person, kein Test-Claim, keine Ich-Form · „Recommendation" kommt nicht vor · Rang-Aussagen als „Rank 8 of 9", nie Prozent · Render-Vertrag §6 erfüllt: Wo „$0"/„no fees" steht, stehen die Pass-throughs im selben Satz oder derselben Fact-Zeile.
