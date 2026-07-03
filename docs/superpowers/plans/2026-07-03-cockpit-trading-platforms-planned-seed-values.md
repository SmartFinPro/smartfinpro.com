# Slice 3 — Planned TopicConfig Design + Seed Values (pre-migration draft)

> Written by the controlling (Sonnet) session, translating the Fable-5 source matrix
> (`2026-07-03-cockpit-trading-platforms-source-matrix.md`) into concrete schema + seed
> values. **Nothing here has been written to code or the database yet.** This file is
> the input for the mandatory Fable-5 pre-migration review checkpoint (Slice-Template
> step 3 / Model-Routing-Regel point 4) — review this, THEN the TopicConfig + migration
> get written.

## 1. Ranked-live vs. soft-live

Adopting Fable-5's recommendation: **ranked-live**, with the three guardrails Fable
specified honored exactly:
- `cash_sweep_apy` is never scored/winner-highlighted anywhere (specColumns, compareRows) —
  informational only, regardless of which provider's number happens to be highest.
- Schwab and E*TRADE crypto get an explicit rollout-caveat note (`crypto_note`), never a
  bare `crypto_trading: true` without context.
- eToro's `extended_hours` is seeded as `null` (not `false`), with a note explaining why
  — never asserted as a claim.

## 2. Attribute schema (JSONB `attributes`, Zod-validated)

```ts
export const tradingPlatformsAttributesSchema = z.object({
  options_fee: z.number(),              // representative $/contract headline value
  options_fee_note: z.string().optional(),
  fractional_shares: z.boolean(),
  fractional_shares_note: z.string().optional(),
  crypto_trading: z.boolean(),
  crypto_note: z.string().optional(),
  futures_trading: z.boolean(),
  paper_trading: z.boolean(),
  extended_hours: z.enum(['none', 'classic', 'overnight']).nullable(),
  extended_hours_note: z.string().optional(),
  tradingview_integration: z.boolean(),
  cash_sweep_apy: z.number(),           // % — NEVER used with `winner`/`score` anywhere
  cash_sweep_note: z.string().optional(),
  sipc_insured: z.boolean(),
}).passthrough();
```

Top-level `product_attributes` columns used (already exist, no schema change): `account_minimum`,
`rating`, `review_count`, `score`, `display_order`, `is_top_pick`, `is_affiliate`, `review_slug`,
`external_url`, `tagline`, `pros`, `cons`, `best_for`, `source_type`, `confidence`, `data_verified_at`.

## 3. Cost model — reusing `kind: 'banking'`, not inventing a new kind

Fable's sanity check: no AUM-style compounding fee exists (all 9 are $0 stock/ETF commission).
Rather than add a new `costModel` kind (extra shared-code surface), reuse the existing
`'banking'` kind verbatim, with `monthlyFee: 0`, `fxFeePct: 0`, `atmFee: 0` for **all 9** rows —
factually accurate (none charge a monthly account fee), and the built-in cost slider legitimately
shows $0 for every provider (matches the honest finding — no fabricated differentiator). Real
differentiation lives entirely in specColumns/compareRows/detailRows (options fee, cash-sweep
APY, crypto, extended hours, TradingView, futures, paper trading), not the cost slider. This is
the same "slider effectively inert, real comparison is the feature table" pattern already
established by `business-bank-accounts.ts` for its amount-hidden banking cost model — no new
UI/shared-code change needed.

```ts
costModel: {
  kind: 'banking',
  amountLabel: 'Representative usage', // ignored — no per-provider differentiation possible ($0 stock/ETF commission across the board)
  amountMin: 0, amountMax: 0, amountStep: 1, amountDefault: 0,
  yearsLabel: 'Time horizon (years)',
  yearsMin: 1, yearsMax: 5, yearsDefault: 3,
},
```

## 4. specColumns (4 headline columns)

1. **Options fee** — `attributes.options_fee`, format `$X.XX/contract`, `winner: 'min'`, sortKey `fee`.
2. **Account minimum** — `accountMinimum`, format `$X`, `winner: 'min'`, sortKey `min`.
3. **Extended hours** — ordinal accessor (`null`→0, `'classic'`→1, `'overnight'`→2), display text, `winner: 'max'`.
4. **TradingView integration** — boolean, `winner: 'max'`.

`cash_sweep_apy` is deliberately **excluded from specColumns** (no headline-card claim) —
appears only in compareRows/detailRows as informational text, per guardrail above.

## 5. Planned per-candidate seed values

| Field | Fidelity | Charles Schwab | Interactive Brokers | Robinhood | eToro | Webull | E*TRADE | tastytrade | Merrill Edge |
|---|---|---|---|---|---|---|---|---|---|
| `display_order` | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| `is_top_pick` | **true** | false | false | false | false | false | false | false | false |
| `best_for` | Best overall | — | Best for active/advanced traders | Best for beginners | — | — | — | — | — |
| `score` | 9.6 | 9.3 | 9.2 | 8.7 | 8.3 | 8.5 | 8.4 | 8.8 | 8.0 |
| `rating` | 4.5 | 4.4 | 4.8 | 4.2 | 4.7 | 4.5 | 4.0 | 4.8 | 4.1 |
| `review_count` | 5000 | 3000 | 8934 | 24000 | 24567 | 15000 | 2000 | 2000 | 1200 |
| `account_minimum` | 0 | 0 | 0 | 0 | 100 | 0 | 0 | 0 | 0 |
| `options_fee` | 0.65 | 0.65 | 0.65 (Lite; Pro tiered $0.15–0.65) | 0.04 | 0 | 0 | 0.65 ($0.50 @30+/qtr) | 1.00 (open, capped $10/leg; $0 close) | 0.65 |
| `fractional_shares` | true | true (S&P 500 only, $5 min) | true | true | true | true | **false** | true | **false** |
| `crypto_trading` | true | true (rollout caveat) | true | true | true | true | true (pilot caveat) | true | **false** |
| `futures_trading` | false | true | true | true | false | true | true | true | false |
| `paper_trading` | false | true | true | false | true | true | true | false | false |
| `extended_hours` | classic | overnight | overnight | overnight | **null** (open) | overnight | overnight | overnight | classic |
| `tradingview_integration` | false | false | true | false | true | true | false | true | false |
| `cash_sweep_apy` (display-only) | 3.3 | 0.01 | 3.12 | 0.01 (3.35 Gold-only) | 0 (opt-in to 3.55) | 0.5 (opt-in tiers) | 0.01 | 0.01 | 0.01 |
| `sipc_insured` | true ×9 (all) |
| `is_affiliate` | true | true | true | true | true | **false** | **false** | **false** | **false** |
| `review_slug` | fidelity-review | charles-schwab-review | interactive-brokers-review | robinhood-review | etoro-review | webull-review | etrade-review | tastytrade-review | **null** |
| `external_url` | null (has review) | null | null | null | null | null | null | null | `https://www.merrilledge.com/` |
| resulting `ctaMode` | review | review | review | review | review | review | review | review | **visit** |

All `*_note` fields (options_fee_note, fractional_shares_note, crypto_note, extended_hours_note,
cash_sweep_note) are populated verbatim from the source-matrix "Wert"/caveat text — full detail
in the source-matrix file, not repeated here to avoid drift between two copies.

## 6. Attribution-gate classification (confirms Fable's read, translated to concrete flags)

**No candidate gets `ctaMode: 'offer'` in this slice.** `is_affiliate: true` is set for the 5
candidates with a genuine (if untracked) existing `affiliate_links` row (Fidelity, Schwab, IBKR,
Robinhood, eToro) — this is factually accurate (a relationship/link record exists) and does
**not** by itself open the gate: `mapCockpitRow`'s gate additionally requires
`link.tracking_status ∈ {verified, dashboard_only}`, which is the DB-wide `unverified` default
and is **not being changed in this slice** (no evidence of real tracking parameters was found,
unlike the debt-relief precedent). Result: all 9 render as `review` (8, matched by `review_slug`)
or `visit` (Merrill Edge, no review yet, `external_url` set instead). Webull/E*TRADE/tastytrade
get `is_affiliate: false` since no `affiliate_links` row exists for them at all today.

No `affiliate_links` migration is planned in this slice — Fable flagged the two best future
activation candidates (Interactive Brokers via Impact, eToro via eToro Partners) as a follow-up,
not part of this slice's scope.

## 7. Compliance

`compliance.notice`: "Not investment advice · brokerage products carry investment risk. Options
and futures trading involve substantial risk and are not suitable for all investors."
`compliance.regulators`: `['SEC', 'FINRA', 'SIPC']` (broker-dealers, unlike robo-advisors'
`['SEC','SIPC']` — FINRA is the direct broker-dealer regulator, appropriate here).

## 8. Open question for Fable's review

Is reusing `'banking'` costModel kind with all-zero fee fields (rather than inventing a new
`per-unit-fee` kind modeling options-fee × volume) the right call, or does it under-deliver on
the Cockpit's usual "live cost calculator" value prop for this specific topic? The alternative
(a two-input mini-calculator per Fable's own suggestion) would require new shared code in
`lib/comparison/cost.ts` + `cockpit-decision-bar.tsx` — a bigger, Shared-UI-Freeze-relevant change
not clearly justified by one topic's needs. Recommend confirming or overriding this call
explicitly before code is written.
