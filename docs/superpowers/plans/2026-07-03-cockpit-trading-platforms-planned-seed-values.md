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

---

## 9. REVISIONS after Fable-5 pre-migration review (CHANGES REQUESTED → addressed below)

Fable-5 reviewed sections 1–8 against the source matrix and the actual codebase
(`mapCockpitRow`, `cost.ts`/`ranking.ts`, `cockpit-decision-bar.tsx`, live `affiliate_links`
table) and returned **CHANGES REQUESTED** with 2 blocking fixes + conditions. All are
incorporated below; this is now the final design the implementer works from.

### Fix 1 (blocking) — `options_fee` is now a round-trip (open+close) figure, not a bare open-fee

Fable found the original per-open-leg framing inverted tastytrade's own documented advantage
(tastytrade's fee cap makes it the *cheapest* broker for active/multi-leg traders despite a
higher nominal open fee — the source matrix says so explicitly). Column relabeled **"Options
fee (round-trip)"**, values now: Fidelity/Schwab/IBKR-Lite/E\*TRADE/Merrill Edge = **$1.30**
(open $0.65 + close $0.65), Robinhood = **$0.08** ($0.04 × 2), tastytrade = **$1.00** (open
$1.00, close $0 — the cap structure), eToro/Webull = **$0**. `options_fee_note` keeps the raw
per-leg source-matrix number for transparency (e.g. Fidelity's note now reads "Round-trip
(open+close) of the official $0.65/contract per-leg fee").

### Fix 2 (blocking) — `account_minimum` specColumn relabeled "Minimum deposit"

eToro's seed ($100) was accurate to "minimum first deposit" but the column was labeled
"Account minimum" (which the source matrix says is genuinely $0 for eToro) — a documented $0
fact was being displayed as a $100 claim. Column relabeled **"Minimum deposit"** (broader,
accurate framing that covers both concepts for all 9): eToro = 100 (sourced, medium
confidence), all other 8 = 0. `winner: 'min'` stays — now honestly comparing deposit minimums,
not misrepresenting eToro's account-opening minimum.

### Fix 3 (conditional, applied) — Schwab `cash_sweep_apy` display softened

Per Fable: the exact 0.01% is only editorial/medium-sourced (Schwab's own pages block
scrapers). `cash_sweep_note` for Schwab now explicitly reads "~0.01% (editorial estimate,
Schwab's own pricing pages block automated verification — re-verify before treating as
broker-confirmed)" so the compareRow's rendered text carries the caveat, not a bare number.

### Cost-model — Fable's DEFINITIVE answer to §8: reuse `'banking'`, 3 conditions (all applied)

Fable verified in code (`ranking.ts` `annualCost`, `cost.ts` `costOverTime`,
`comparison-cockpit.tsx:91` `varies` guard, `cockpit-decision-bar.tsx:146` amount-slider hiding)
that `monthlyFee/fxFeePct/atmFee = 0` for all 9 genuinely produces $0 with no false
winner-badge and a hidden amount slider — confirmed safe, no new costModel kind needed.
Conditions, all applied in this design:
1. **No `'cost'` sortOption and no "Lowest cost" priorityChip** in this TopicConfig (§4/§5
   below) — a 9-way $0 tie would read as a broken control.
2. FAQ (§10) explicitly explains why the multi-year cost is $0 for every provider.
3. The inert $0 cost display + hidden amount slider is accepted as-is for this slice (a
   `costDisplay: 'hidden'` opt-out is a future shared-UI follow-up, not in scope now).

### `cash_sweep_apy` — confirmed never scored, made explicit for the implementer

No `score` on its compareRow, no sortOption, no priorityChip, no matcher question references
it. Its compareRow accessor renders the qualifier text (default/opt-in/paid-tier), never the
bare percentage alone.

### Attribution-gate slug fix

Fable cross-checked the live `affiliate_links` table directly: the Schwab row's slug is
**`charles-schwab`**, not `schwab`. `product_attributes.slug` for Schwab MUST be
`charles-schwab` to actually join via `linksBySlug` in `mapCockpitRow` — using `schwab` would
silently break the (already-gated-closed) link association. Corrected in §5 below.

### `display_order` realigned to descending `score` (was following the shortlist's own numbering, which didn't match the scores)

New order: 1 Fidelity (9.6) · 2 Charles Schwab (9.3) · 3 Interactive Brokers (9.2) ·
4 tastytrade (8.8) · 5 Robinhood (8.7) · 6 Webull (8.5) · 7 E\*TRADE (8.4) · 8 eToro (8.3) ·
9 Merrill Edge (8.0).

### Row-level `confidence` set to each row's LOWEST individual attribute confidence (was previously unset/implied "high" for all)

Fidelity = high · Charles Schwab = medium (cash_sweep editorial) · Interactive Brokers = high ·
Robinhood = high · eToro = **low** (extended_hours is the one open/low-confidence cell) ·
Webull = medium (cash_sweep editorial) · E\*TRADE = medium (crypto pilot editorial) ·
tastytrade = medium (account_minimum editorial) · Merrill Edge = medium (rating/review_count
supplement is medium confidence).

### `extended_hours` display — `null` renders as "—", never conflated with "No"/`false`

Format function must branch on `null` explicitly (eToro) separately from `'none'` (not
currently used by any of the 9, but kept in the enum for future topics) — both differ from
`'classic'`/`'overnight'`. `null` → "—", never "No".

### Verdict picks — Fidelity and Interactive Brokers confirmed; Robinhood accepted WITH a condition

Fable flagged Robinhood as the weakest of the 3 picks (no paper trading — Webull is "#1 Paper
Trading 2026" per the matrix — and 0.01% default cash vs. Webull/eToro's $0 options fee).
Accepted only under Fable's stated condition: Robinhood's verdict copy justifies the pick via
**simplicity/UX**, not fees/features, and Robinhood's seeded `cons` array explicitly includes
"No paper/demo trading account". Fidelity's verdict/pros may descriptively mention its
automatic ~3.3% SPAXX sweep (dated) as a factual pro — that's a factual statement with a date,
not a comparative winner-claim, so it doesn't conflict with the cash_sweep_apy scoring ban.

### `filters` / `matcher` / `priorityChips` / `sortOptions` — were missing from this doc, now specified (Fable flagged the gap)

```ts
filters: [
  { key: 'fractional', label: 'Fractional shares', predicate: (p) => attr(p, 'fractional_shares') },
  { key: 'crypto', label: 'Crypto trading', predicate: (p) => attr(p, 'crypto_trading') },
  { key: 'futures', label: 'Futures trading', predicate: (p) => attr(p, 'futures_trading') },
  { key: 'paperTrading', label: 'Paper trading', predicate: (p) => attr(p, 'paper_trading') },
  { key: 'tradingview', label: 'TradingView integration', predicate: (p) => attr(p, 'tradingview_integration') },
  { key: 'overnight', label: '24/5 overnight trading', predicate: (p) => attr(p, 'extended_hours') === 'overnight' }, // eToro's null is conservatively excluded, never asserted false
  { key: 'noMin', label: 'No minimum deposit', predicate: (p) => p.accountMinimum === 0 },
],

priorityChips: [
  { id: 'fee', label: 'Cheapest options', icon: 'Percent', sort: 'fee' },
  { id: 'min', label: 'No minimum', icon: 'Wallet', sort: 'min' },
  { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  { id: 'active', label: 'Best for active trading', icon: 'TrendingUp', sort: 'active' },
], // NOTE: no 'cost' chip — banned per the cost-model conditions above

sortOptions: [
  { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
  { value: 'fee', label: 'Cheapest options (round-trip)', metric: (p) => -attr(p, 'options_fee') },
  { value: 'min', label: 'Lowest minimum deposit', metric: (p) => -p.accountMinimum },
  { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
  { value: 'active', label: 'Best for active trading', metric: (p) => extHoursOrdinal(p) * 10 + (attr(p, 'futures_trading') ? 8 : 0) + (attr(p, 'tradingview_integration') ? 8 : 0) + p.score },
], // NOTE: no 'cost' sortOption — banned per the cost-model conditions above

matcher: [
  { id: 'options', label: 'Do you trade options frequently?', weight: 14, options: [yes/no],
    award: (p, a) => a === 'yes' ? { matched: attr(p, 'options_fee') <= 1.0, reason: 'Low/no options fee' } : { matched: true } },
  { id: 'crypto', label: 'Want to trade crypto on the same platform?', weight: 10, options: [yes/no],
    award: (p, a) => a === 'yes' ? { matched: attr(p, 'crypto_trading'), reason: 'Crypto trading' } : { matched: true } },
  { id: 'active', label: 'Want futures trading or native TradingView charting?', weight: 10, options: [yes/no],
    award: (p, a) => a === 'yes' ? { matched: attr(p, 'futures_trading') || attr(p, 'tradingview_integration'), reason: 'Futures/TradingView' } : { matched: true } },
],
```

### Top-level `source_type` per row

`'official'` for all 9 — each candidate's headline fee data (the columns that matter most:
options fee, account/deposit minimum) traces to an official broker page even where a secondary
attribute (cash-sweep rate, one crypto pilot date) leans editorial; the granular caveats live in
the `*_note` fields, not in this single categorical tag.

### `data_verified_at`

`'2026-07-03'` for all 9 rows (source-matrix research date).

This section (§9) supersedes the specific numbers in §4/§5 above where they conflict — the
implementer should read §9 as the final authority for anything it revises.
