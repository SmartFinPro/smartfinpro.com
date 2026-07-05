# Slice 10 — HYSA Planned Seed Values
> Migration: `supabase/migrations/20260705180000_seed_hysa_us.sql`  
> TopicConfig: `lib/comparison/topics/high-yield-savings.ts`  
> Verified: July 5, 2026

## Editorial Scores

| Slug | Score | Rationale |
|---|---|---|
| `sofi` | 8.8 | Best overall: highest conditional APY (3.10%), debit card, 55k ATMs, $2M FDIC, best Trustpilot |
| `cit-bank` | 8.2 | Best unconditional APY for $5k+ — only weakness is $100 min open and no ATM |
| `barclays` | 7.8 | Clean 3.65% no conditions; promo expiry risk caps the score |
| `marcus` | 7.6 | Strong brand, 3.40% standard APY, but no ATM and Trustpilot concerns |
| `synchrony` | 7.4 | 3.30% + unique ATM card option; Trustpilot skew and low reimbursement cap |
| `american-express` | 7.2 | 3.10% standard, 24/7 US service; no ATM, modest APY vs leaders |
| `ally` | 7.0 | 3.00% but excellent savings tools and app; mid-range APY |
| `capital-one` | 6.8 | Best app (4.9) and ATM network (70k) but big APY drop July 2026 + FDIC alert |

## Sub-Scores (cost / features / ux / support)

| Slug | cost | features | ux | support |
|---|---|---|---|---|
| `sofi` | 8.5 | 9.2 | 8.6 | 7.6 |
| `cit-bank` | 9.0 | 6.8 | 7.0 | 7.0 |
| `barclays` | 8.2 | 7.0 | 8.2 | 6.8 |
| `marcus` | 7.8 | 6.8 | 7.0 | 6.4 |
| `synchrony` | 7.6 | 7.6 | 8.4 | 7.0 |
| `american-express` | 7.4 | 7.2 | 8.4 | 8.4 |
| `ally` | 7.2 | 8.0 | 8.6 | 7.4 |
| `capital-one` | 7.0 | 8.4 | 9.2 | 7.2 |

**cost** = APY competitiveness (higher APY = lower opportunity cost = higher score)  
**features** = ATM/debit, FDIC, savings tools, checking bundle  
**ux** = app ratings and ease of use  
**support** = customer service quality and accessibility

## Key Attributes Per Row

| Slug | apy | apy_type | min_balance_for_apy | atm_access | max_fdic | account_minimum |
|---|---|---|---|---|---|---|
| `sofi` | 3.10 | conditional | 0 | true | 2,000,000 | 0 |
| `cit-bank` | 4.10 | tiered | 5,000 | false | 250,000 | 100 |
| `barclays` | 3.65 | tiered | 0 | false | 250,000 | 0 |
| `marcus` | 3.40 | standard | 0 | false | 250,000 | 0 |
| `synchrony` | 3.30 | standard | 0 | true | 250,000 | 0 |
| `american-express` | 3.10 | standard | 0 | false | 250,000 | 0 |
| `ally` | 3.00 | standard | 0 | false | 250,000 | 0 |
| `capital-one` | 3.00 | standard | 0 | true | 250,000 | 0 |

## Filter Behavior

| Filter | Matches |
|---|---|
| `noMinBalance` (min_balance_for_apy === 0) | sofi, barclays, marcus, synchrony, american-express, ally, capital-one (7/8; excludes cit-bank) |
| `atmAccess` | sofi, synchrony, capital-one (3/8) |
| `extendedFdic` (> $250k) | sofi (1/8) |
| `noConditions` (apy_type === 'standard') | marcus, synchrony, american-express, ally, capital-one (5/8) |

## Matcher Behavior

**Q1 "How much are you saving?"**
- Under $5k → excludes cit-bank (needs $5k for competitive APY)
- Over $25k → surfaces sofi (extended FDIC $2M)

**Q2 "Direct deposit?"**
- Yes → sofi qualifies for 3.10% (conditional); others with standard qualify too
- No → standard accounts only (marcus, synchrony, amex, ally, capital-one)

**Q3 "Need ATM/debit card?"**
- Yes → sofi (55k ATMs + debit), synchrony (ATM card), capital-one (70k ATMs)
- No → all qualify

## TopicConfig Architecture Notes

- Cost model: `kind: 'banking'` — all monthly_fee = 0; cost calculator shows $0 for all rows (honest, no fees)
- specColumns: APY (winner max), Min. for top rate (winner min), FDIC coverage (winner max)
- Verdict picks: SoFi (overall), CIT Bank (APY $5k+), Barclays (no conditions), Synchrony (ATM), Ally (goal tools), Capital One (app+ATM)
- Priority chips: Highest APY, No minimum, ATM access, Top rated
- No h1 function override needed (generic format from `(y) => Best high-yield savings accounts in ${y}`)
