# Slice 10 — HYSA Source Matrix
> Route: `/us/personal-finance/best/high-yield-savings`  
> Research date: July 2–5, 2026  
> Federal Funds Rate: 3.50–3.75% (unchanged, June 2026 FOMC)

## Candidates (8)

| Slug | Display Name | Primary Source | Verified Via |
|---|---|---|---|
| `sofi` | SoFi Bank | sofi.com/banking/high-yield-savings-account | NerdWallet, Bankrate, official site |
| `cit-bank` | CIT Bank Platinum Savings | cit.com/cit-bank/bank/savings/platinum-savings-account | Bankrate, official site, CITBOOST code verified |
| `barclays` | Barclays Tiered Savings | banking.us.barclays/tiered-savings.html | Bankrate, NerdWallet, official site |
| `marcus` | Marcus by Goldman Sachs | marcus.com/us/en/savings/high-yield-savings | Forbes, official site |
| `synchrony` | Synchrony Bank High Yield Savings | synchronybank.com/banking/high-yield-savings | Bankrate, official site |
| `american-express` | American Express High Yield Savings | americanexpress.com/en-us/banking/online-savings | Forbes, official site |
| `ally` | Ally Bank Online Savings | ally.com/bank/online-savings-account | NerdWallet, official site |
| `capital-one` | Capital One 360 Performance Savings | capitalone.com/bank/savings-accounts/... | Multiple sources — rate drop confirmed July 2 |

### Excluded
- **Discover Bank**: Capital One acquisition completed May 2025; new accounts halted. Would be a duplicate institution with Capital One for FDIC purposes.

## APY Data (July 2–5, 2026)

| Slug | Primary APY | Conditions | Notes |
|---|---|---|---|
| `sofi` | 3.10% | Requires direct deposit (any amount) | 4.50% with $10/mo Plus on first $20k; 1.20% baseline |
| `cit-bank` | 4.10% | Promo through Aug 31, 2026 (code CITBOOST) | 3.75% standard on $5k+; 0.25% below $5k |
| `barclays` | 3.65% | Promo through July 31, 2026 | 3.75% on $250k+; post-promo rate unknown |
| `marcus` | 3.40% | None | Standard unconditional |
| `synchrony` | 3.30% | None | Standard unconditional, daily compounding |
| `american-express` | 3.10% | None | Standard unconditional |
| `ally` | 3.00% | None | Standard unconditional |
| `capital-one` | 3.00% | None | Dropped from ~4.00% early July 2026 |

## Consumer Ratings

| Slug | Rating Used | Source | Notes |
|---|---|---|---|
| `sofi` | 4.1/5 | Trustpilot (10,517 reviews) | Representative of banking product |
| `cit-bank` | 0 | N/A | No significant consumer rating found |
| `barclays` | 4.8/5 | App Store (iOS) | Trustpilot 1.3 dominated by Barclaycard CC complaints |
| `marcus` | 1.2/5 | Trustpilot | Dominated by Apple Card / loan closure complaints |
| `synchrony` | 4.8/5 | App Store (iOS) | Trustpilot 1.1 dominated by CC complaints |
| `american-express` | 4.8/5 | App Store (iOS) | Trustpilot 1.3 dominated by CC complaints |
| `ally` | 4.7/5 | App Store (iOS) | Trustpilot 1.7 dominated by broad banking complaints |
| `capital-one` | 4.9/5 | App Store (iOS) | Trustpilot 1.2 dominated by CC complaints; 4.9 = highest app score here |

**Editorial note on rating methodology**: For banks whose Trustpilot profile is dominated by credit card complaints (not savings), App Store ratings (which are product-specific) are more representative. SoFi is the exception — their Trustpilot reflects the banking product. Rating source stored in `attributes.review_source`.

## Affiliate Status

| Slug | Affiliate Program | Publisher Network | Active Link in DB |
|---|---|---|---|
| `sofi` | YES — $80–$150/funded account | FlexOffers, Impact | NO (personal loans link exists; no savings link) |
| `cit-bank` | UNVERIFIED | Unknown | NO |
| `barclays` | UNVERIFIED | Unknown | NO |
| `marcus` | NO (referral-only) | N/A | NO |
| `synchrony` | NO | N/A | NO |
| `american-express` | NO | N/A | NO |
| `ally` | YES (confirmed) | CJ Affiliate, FlexOffers | NO (no savings-specific link) |
| `capital-one` | NO | N/A | NO |

**Attribution Gate**: All 8 rows seed `is_affiliate = false`. CTAs resolve to `visit` mode. When SoFi or Ally savings affiliate links are added to `affiliate_links` in prod, the Cockpit engine will auto-detect and surface `offer` CTAs without a re-seed.

## Regulatory Flags

| Slug | Flag | Status |
|---|---|---|
| `sofi` | Data breach Dec 2025 (38k individuals) | Class action filed Feb 2026; contained |
| `capital-one` | Post-Discover merger FDIC limit change | Combined $250k limit since May 18, 2025 |
| `synchrony` | CFPB consent order (CC practices) | Terminated May 12, 2025 |
| `marcus` | Fed consent order (CC practices) | 2022; Marcus savings not specifically cited |
| `barclays` | Barclaycard CFPB settlements (historical) | Unrelated to US savings products |
