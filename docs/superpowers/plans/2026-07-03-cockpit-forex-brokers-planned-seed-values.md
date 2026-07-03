# Slice 4 — Planned TopicConfig Design + Seed Values (pre-migration draft)

> Written by the controlling (Sonnet) session, translating the Fable-5 source matrix
> (`2026-07-03-cockpit-forex-brokers-source-matrix.md`) into concrete schema + seed
> values. **Nothing here has been written to code or the database yet.** This is the
> input for the mandatory Fable-5 pre-migration review checkpoint (Slice-Template step 3
> / Model-Routing-Regel point 4) — review this, THEN the TopicConfig + migration get
> written.

## 0. Owner decisions already made (do not re-litigate)

Per the source matrix's two material shortlist corrections, the owner has confirmed:
1. **Top-5 ranked field** (tastyfx, Interactive Brokers, FOREX.com, OANDA, Charles Schwab) —
   Plus500 US dropped entirely (it's a CFTC-registered futures broker, not spot-forex; no
   replacement candidate exists with genuine consensus).
2. **`content/us/forex/ig-markets-review.mdx` rebrand fix folded into this slice** — IG US
   was officially rebranded to tastyfx in June 2024 (same entity). Already implemented in
   this worktree (not part of this design doc's review scope, but noted for completeness):
   a permanent 301 redirect `/us/forex/ig-markets-review` → `/us/forex/tastyfx-review` was
   added to `next.config.ts`, and the two internal links + duplicate section in
   `content/us/forex/index.mdx` were merged/corrected to reference tastyfx only.

## 1. Ranked-live vs. soft-live

Adopting Fable-5's recommendation: **ranked-live**. Confidence is high/official for
4 of 5 candidates (tastyfx, Interactive Brokers, OANDA, Charles Schwab), with FOREX.com
being the sole editorial-heavy candidate (WAF blocks automated verification of its own
pricing pages) — still consistently corroborated by ForexBrokers.com/StockBrokers.com,
so no attribute is `low` confidence. FOREX.com renders as `review` per Gate 5 (see §6).

## 2. Attribute schema (JSONB `attributes`, Zod-validated)

```ts
export const forexBrokersAttributesSchema = z.object({
  eur_usd_spread_pips: z.number(),        // representative round-turn EUR/USD spread
  eur_usd_spread_note: z.string().optional(),
  commission_per_lot: z.number(),         // round-turn USD per 100k-unit standard lot, 0 if spread-only
  commission_per_lot_note: z.string().optional(),
  max_leverage: z.number(),               // on majors (US retail cap is 50:1)
  max_leverage_note: z.string().optional(),
  micro_lots: z.boolean(),
  micro_lots_note: z.string().optional(),
  demo_account: z.boolean(),
  tradingview_integration: z.boolean(),
  mt4_support: z.boolean(),
  mt5_support: z.boolean(),
  currency_pairs_count: z.number(),
  nfa_cftc_regulated: z.boolean(),
}).passthrough();
```

Top-level `product_attributes` columns used (already exist): `account_minimum` (min deposit),
`management_fee` (the combined round-turn cost rate, see §3), `rating`, `review_count`,
`score`, `display_order`, `is_top_pick`, `is_affiliate`, `review_slug`, `external_url`,
`tagline`, `pros`, `cons`, `best_for`, `source_type`, `confidence`, `data_verified_at`.

## 3. Cost model — `kind: 'fee-on-amount'`, reusing the DEFAULT feeAccessor (no override needed)

Unlike trading-platforms (all $0 on the modeled fee), forex brokers have a real,
volume-scaling cost: spread + any per-lot commission, expressed as a % of traded notional.
`cost.ts`'s `'fee-on-amount'` branch already does exactly this when no `feeAccessor` is
supplied: `feeRate = (p.managementFee ?? 0) / 100; cost = amount * feeRate`. So
`management_fee` stores the **combined round-turn cost rate as a percentage of notional**
(spread-in-pips × 0.01% + commission-%), and no custom `feeAccessor`/`flatFeeAccessor` is
needed at all (simpler than debt-relief's GreenPath special case).

**Rates (round-turn, standardized on each broker's most authoritative available spread —
official published rate where one exists, otherwise the ForexBrokers.com 2026 measured
average):**

| Provider | Spread used | Why this one | Commission | Rate (`management_fee`) |
|---|---|---|---|---|
| tastyfx | 1.15 pips (measured avg, Standard) | No stable official avg published (only "as low as 0.8" teaser) | $0 | **0.0115** |
| Interactive Brokers | 0.226 pips (measured) | IBKR's raw-interbank model has no single published avg; floats per quote | $4.60/100k (Tier I, 0.20bp) | **0.0063** |
| FOREX.com | 0.137 pips (measured, RAW tier) | RAW is the all-in tier Fable recommends for ranking (Standard has an unresolved 1.00-vs-1.62 discrepancy between two ForexBrokers pages — noted, not seeded as the headline number) | $7.00/100k (RAW) | **0.0084** |
| OANDA | 1.4 pips (**official**, oanda.com pricing page) | Real official number exists — prefer it over the 1.68 measured figure for the headline/ranking value | $0 | **0.0140** |
| Charles Schwab | 1.27 pips (measured, Oct 2025) | No official avg published | $0 | **0.0127** |

```ts
costModel: {
  kind: 'fee-on-amount',
  amountLabel: 'Annual trading volume (notional)',
  amountMin: 120_000,
  amountMax: 24_000_000,
  amountStep: 120_000,
  amountDefault: 1_200_000,
  yearsLabel: 'Time horizon (years)', // inert for fee-on-amount, kept for UI consistency (matches debt-relief-companies.ts)
  yearsMin: 1,
  yearsMax: 5,
  yearsDefault: 3,
},
```

**FOREX.com Standard-vs-RAW discrepancy — flagged for Fable's review, not resolved unilaterally:**
the source matrix's own confidence note says the Standard-tier spread is ambiguous (1.00 per
one ForexBrokers guide page, 1.62 per another ForexBrokers review page, same source family).
Using RAW (0.137 pips + $7/lot, fully official-adjacent since FOREX.com publishes the RAW
commission itself) sidesteps the ambiguous Standard number entirely. `eur_usd_spread_note`
will document both tiers for transparency.

## 4. specColumns (4 headline columns)

Rejected candidate: `max_leverage` — all 5 are capped at 50:1 on majors (US regulatory cap),
so this column would never show a winner distinction. Replaced with `currency_pairs_count`.

1. **EUR/USD spread (round-turn)** — `attributes.eur_usd_spread_pips`, format `X.XX pips`, `winner: 'min'`, sortKey `spread`.
2. **Minimum deposit** — `accountMinimum`, format `$X`, `winner: 'min'`, sortKey `min`.
3. **Currency pairs** — `attributes.currency_pairs_count`, format `X+`, `winner: 'max'`.
4. **TradingView integration** — boolean, `winner: 'max'`.

`max_leverage` still appears in compareRows/detailRows as informational text (all show "50:1"),
never scored — matches the robo-advisors precedent of a tied/free-text row with no `score`.

## 5. Planned per-candidate seed values

| Field | tastyfx | Interactive Brokers | FOREX.com | OANDA | Charles Schwab |
|---|---|---|---|---|---|
| `display_order` | 1 | 2 | 4 | 3 | 5 |
| `is_top_pick` | **true** | false | false | false | false |
| `best_for` | Best overall | Best for active/high-volume traders | — | Best for beginners | — |
| `score` | 9.4 | 9.2 | 8.6 | 8.8 | 8.0 |
| `rating` / `review_count` | 4.4 / 200 (existing `tastyfx-review.mdx`) | 4.2 / 500 (existing) | 4.3 / 1500 (existing) | 4.3 / 500 (existing) | 4.4 / 3000 (reused from `charles-schwab-review.mdx` — same company/platform, no dedicated forex review exists) |
| `eur_usd_spread_pips` | 1.15 | 0.226 | 0.137 (RAW) | 1.4 (official) | 1.27 |
| `commission_per_lot` | 0 | 4.60 | 7.00 (RAW) | 0 | 0 |
| `management_fee` (cost rate %) | 0.0115 | 0.0063 | 0.0084 | 0.0140 | 0.0127 |
| `account_minimum` | 0 | 0 | 100 | 0 | 0 |
| `max_leverage` | 50 | 50 | 50 | 50 | 50 (no official Schwab number — note flags this) |
| `micro_lots` | true | true (IdealPro $25k min + odd-lot caveat in note) | true | true (1-unit min order) | **false** (10,000-unit min — biggest weakness) |
| `demo_account` | true | true | true | true | true |
| `tradingview_integration` | true | true | true | true | **false** |
| `mt4_support` | true | false | true | true | false |
| `mt5_support` | true | false | true | **false** (US-specific limitation) | false |
| `currency_pairs_count` | 85 | 100 | 80 | 68 | 65 |
| `nfa_cftc_regulated` | true ×5 (all) |
| `confidence` | high | high | **medium** (WAF-blocked, editorial-sourced) | high | **medium** (max_leverage unpublished) |
| `source_type` | official | official | editorial | official | official |
| `is_affiliate` | false (no link) | **true** (`interactive-brokers-forex`, $200 CPA) | **true** (`forex-com`, health flagged dead — see §6) | **true** (`oanda`, healthy) | false (no forex-specific link; the `charles-schwab` link is scoped to the trading-platforms topic/category and doesn't resolve here) |
| `review_slug` | `tastyfx-review` | `interactive-brokers-forex-review` | `forex-com-review` | `oanda-review` | **null** (no dedicated forex review) |
| `external_url` (ALL 5, per the Slice-3 standing rule) | `https://www.tastyfx.com/` | `https://www.interactivebrokers.com/` | `https://www.forex.com/en-us/` | `https://www.oanda.com/us-en/trading/` | `https://www.schwab.com/forex` |
| resulting `ctaMode` | review | review | **review** (Gate 5) | review | **visit** (no review_slug) |

All `*_note` fields (eur_usd_spread_note, commission_per_lot_note, max_leverage_note,
micro_lots_note) are populated verbatim from the source-matrix caveat text — full detail
in the source-matrix file, not duplicated here.

## 6. FOREX.com Gate-5 handling (link-health)

Fable-5's independent investigation found the `dead` `health_status` flag is very likely a
**WAF false-positive** — automated requests (this session's own curl attempts, presumably
also the site's own link-health cron) get a 403 bot-challenge from forex.com's Cloudflare
WAF, while the broker is confirmed operating normally (ForexBrokers.com #3 2026 ranking,
active NFA #0339826, StoneX/NASDAQ:SNEX parent). Per Gate 5: render as `review` (already the
natural outcome here since `review_slug` exists and `tracking_status` stays `unverified` —
no `/go` gate opens regardless). No affiliate_links row is modified in this migration.
**Recommendation for a follow-up (out of scope for this slice):** annotate the `dead` status
as "WAF-blocked, manually verified 2026-07-03" rather than leaving a misleading "dead" label,
and consider whitelisting 403-with-Cloudflare-challenge-headers in the `check-links` cron
so it doesn't keep flagging a live broker as dead.

## 7. Attribution-gate classification

`is_affiliate: true` for the 3 candidates with a genuine (if untracked) `affiliate_links` row
(Interactive Brokers Forex, FOREX.com, OANDA) — does NOT by itself open the gate, since
`mapCockpitRow` additionally requires `tracking_status ∈ {verified, dashboard_only}`, which
stays at the DB-wide `unverified` default and is NOT changed in this migration. tastyfx and
Charles Schwab get `is_affiliate: false` (no link exists for tastyfx; Schwab's existing link
is scoped to a different category/topic). All 5 render `review` (4, matched by `review_slug`)
or `visit` (Charles Schwab, no review) — never `offer`.

## 8. Compliance (different regulators than trading-platforms/robo-advisors)

Forex is NOT a securities product — no SIPC coverage applies. The correct regulatory bodies
for US retail forex are the CFTC (federal regulator) and NFA (self-regulatory membership
body all 5 brokers hold, confirmed individually in the source matrix).

```ts
compliance: {
  notice: 'Not investment advice · retail forex trading is highly leveraged and carries a high risk of loss; most retail accounts lose money.',
  regulators: ['NFA', 'CFTC'],
},
```

## 9. filters / priorityChips / sortOptions / matcher

```ts
filters: [
  { key: 'micro', label: 'Micro lots', predicate: (p) => attr(p, 'micro_lots') },
  { key: 'tradingview', label: 'TradingView integration', predicate: (p) => attr(p, 'tradingview_integration') },
  { key: 'mt', label: 'MetaTrader 4/5', predicate: (p) => attr(p, 'mt4_support') || attr(p, 'mt5_support') },
  { key: 'demo', label: 'Demo account', predicate: (p) => attr(p, 'demo_account') },
  { key: 'noMin', label: 'No minimum deposit', predicate: (p) => p.accountMinimum === 0 },
],

priorityChips: [
  { id: 'spread', label: 'Tightest spread', icon: 'Percent', sort: 'spread' },
  { id: 'min', label: 'No minimum', icon: 'Wallet', sort: 'min' },
  { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  { id: 'mt', label: 'Best for MetaTrader', icon: 'LineChart', sort: 'mt' },
],

sortOptions: [
  { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
  { value: 'spread', label: 'Lowest all-in cost', metric: (p) => -p.managementFee },
  { value: 'min', label: 'Lowest minimum deposit', metric: (p) => -p.accountMinimum },
  { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
  { value: 'mt', label: 'Best for MetaTrader', metric: (p) => ((attrBool(p,'mt4_support')||attrBool(p,'mt5_support')) ? 1000 : 0) + p.score },
],

matcher: [
  { id: 'cost', label: 'Do you want the lowest all-in trading cost?', weight: 14,
    award: (p, a) => a === 'yes' ? { matched: p.managementFee <= 0.01, reason: 'Low all-in cost' } : { matched: true } },
  { id: 'mt', label: 'Do you trade on MetaTrader 4/5?', weight: 10,
    award: (p, a) => a === 'yes' ? { matched: attr(p,'mt4_support') || attr(p,'mt5_support'), reason: 'MetaTrader support' } : { matched: true } },
  { id: 'beginner', label: 'Just starting out (want $0 minimum + a demo account)?', weight: 10,
    award: (p, a) => a === 'yes' ? { matched: p.accountMinimum === 0 && attr(p,'demo_account'), reason: '$0 minimum + demo' } : { matched: true } },
],
```

## 10. Verdict picks

- **Best overall:** tastyfx — consensus #1 (ForexBrokers.com & BrokerChooser 2026), zero
  commission, tightest spread-only pricing, widest pair selection.
- **Best for active/high-volume traders:** Interactive Brokers — lowest all-in cost at scale
  (0.0063%), though steepest learning curve (TWS).
- **Best for beginners:** OANDA — $0 minimum deposit, native TradingView, simplest onboarding.

## 11. Open question for Fable's review

Is standardizing on "official spread where one exists, else measured average" (rather than
uniformly using one source type) a defensible, consistent rule across all 5 — or does mixing
official (OANDA) with measured-average (the other 4) risk an apples-to-oranges ranking
comparison? Recommend confirming or overriding before code is written.
