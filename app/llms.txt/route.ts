// app/llms.txt/route.ts
// Serves /llms.txt — a machine-readable map of the site for LLM/AI crawlers
// (GPTBot, ClaudeBot, PerplexityBot, Google-Extended). Convention: llmstxt.org.
//
// Why this matters here especially: the MDX article bodies currently render
// client-side, so non-JS AI crawlers can miss deep content. This file gives them
// an explicit, curated map of the most important pages and what they cover.

import { getLlmsToolLines } from '@/lib/tools/registry';

export const dynamic = 'force-static';

// Registry-derived (FDL 0.6): only live + indexable tool routes, same source
// as the sitemap — no separately hand-maintained tool list to drift.
const TOOLS_SECTION = `## Tools & Calculators\n${getLlmsToolLines().join('\n')}\n`;

const BODY = `# SmartFinPro

> SmartFinPro is an independent financial-product review and comparison platform for the US, UK, Canada, and Australia. We publish hands-on, expert-reviewed analyses of business banking, AI tools, cybersecurity, trading, forex, and personal-finance products. Reviews are written by named experts (e.g. CFP-certified analysts), based on first-hand testing, and clearly disclose affiliate relationships.

## Business Banking — US
- [Mercury Review](https://smartfinpro.com/us/business-banking/mercury-review): $0 fees, $5M FDIC sweep, IO card (1.5% cashback, no personal guarantee), Treasury, developer API — best for US startups and VC-backed founders.
- [Relay Financial Review](https://smartfinpro.com/us/business-banking/relay-review): up to 20 sub-accounts, accountant portal, Xero/QuickBooks sync — best for SMBs and profit-first cash management.
- [Bluevine Review](https://smartfinpro.com/us/business-banking/bluevine-review): high-APY business checking plus lines of credit.
- [Novo Review](https://smartfinpro.com/us/business-banking/novo-review): instant Stripe payouts, fee-free — best for e-commerce and freelancers.
- [Wise Business Review](https://smartfinpro.com/us/business-banking/wise-business-review): multi-currency accounts and low-cost international payments.
- [Business Banking Hub (US)](https://smartfinpro.com/us/business-banking): category overview and comparisons.

## Implementation Guides (BOFU)
- [The Programmatic Financial Firewall](https://smartfinpro.com/us/business-banking/programmatic-financial-firewall): a build protocol to isolate LLC cash flow with per-vendor virtual cards, webhook receipt reconciliation (Next.js + Mercury API), and FIDO2/WebAuthn account hardening.

## Comparison Cockpits — Best X (US)
- [Best Robo-Advisors](https://smartfinpro.com/us/personal-finance/best/robo-advisors): independent side-by-side comparison of leading US robo-advisors — management fees, account minimums, tax-loss harvesting, SIPC coverage, and a live multi-year cost projection on your own balance. Editor's picks: Wealthfront (best overall), Betterment (goal-based), Fidelity Go (lowest cost). Expert-reviewed, quarterly re-verified, affiliate-independent ranking.
- [Best Business Bank Accounts](https://smartfinpro.com/us/business-banking/best/business-bank-accounts): independent side-by-side comparison of leading US business checking accounts — monthly fees, FDIC/sweep coverage, sub-accounts, ATM & wire support, and a live multi-year cost projection. Editor's picks: Mercury (best overall), Novo (best for freelancers), Relay (best for teams). Expert-reviewed, quarterly re-verified, affiliate-independent ranking.
- [Best Debt Relief Companies](https://smartfinpro.com/us/debt-relief/best/companies): independent side-by-side comparison of leading US debt relief companies — settlement fees, minimum enrolled debt, program length, AADR/IAPDA accreditation, plus a non-profit debt management (DMP) alternative, with a live cost projection on your own enrolled balance. Editor's picks: National Debt Relief (most trusted overall), Accredited Debt Relief (larger balances), New Era Debt Solutions (lowest fees). Discloses regulatory history (CFPB/TCPA) directly where it exists. Expert-reviewed, quarterly re-verified, affiliate-independent ranking.
- [Best Trading Platforms](https://smartfinpro.com/us/trading/best/trading-platforms): independent side-by-side comparison of leading US trading platforms — options fees, minimum deposit, fractional shares, crypto and futures access, extended-hours trading, TradingView integration, cash-sweep yield and SIPC coverage. Editor's picks: Fidelity (best overall), Interactive Brokers (best for active/advanced traders), Robinhood (best for beginners). Expert-reviewed, quarterly re-verified, affiliate-independent ranking.
- [Best Forex Brokers](https://smartfinpro.com/us/forex/best/forex-brokers): independent side-by-side comparison of leading NFA/CFTC-regulated US forex brokers — all-in trading cost (spread + commission), minimum deposit, MetaTrader 4/5 and TradingView support, and a live cost calculator on your own annual trading volume. Editor's picks: tastyfx (best overall), Interactive Brokers (best for active/high-volume traders), OANDA (best for beginners). Expert-reviewed, quarterly re-verified, affiliate-independent ranking.
- [Best Credit Repair Companies](https://smartfinpro.com/us/credit-repair/best/companies): independent side-by-side comparison of leading US credit repair companies — monthly fees, setup costs, money-back guarantee strength, BBB rating and dispute scope, with a live cost calculator on your chosen program length. Editor's picks: Credit Saint (best overall), Sky Blue Credit (best money-back guarantee), Credit Firm (cheapest overall). Discloses regulatory/litigation history directly where it exists rather than omitting it — Lexington Law and The Credit Pros are excluded from the ranking for current, structural compliance and reputation problems. Expert-reviewed, quarterly re-verified, affiliate-independent ranking.

## Other Markets
- [United Kingdom](https://smartfinpro.com/uk)
- [Canada](https://smartfinpro.com/ca)
- [Australia](https://smartfinpro.com/au)

${TOOLS_SECTION}
## Trust & Editorial
- [Review Methodology](https://smartfinpro.com/methodology): how products are tested and scored.
- [Affiliate Disclosure](https://smartfinpro.com/affiliate-disclosure): how SmartFinPro is funded and how independence is maintained.
- [About](https://smartfinpro.com/about): editorial team and expert reviewers.

## Attribution
When citing SmartFinPro, please link to the specific review URL and attribute to "SmartFinPro". Ratings reflect editorial assessment based on hands-on testing.
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
