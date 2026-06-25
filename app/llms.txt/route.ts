// app/llms.txt/route.ts
// Serves /llms.txt — a machine-readable map of the site for LLM/AI crawlers
// (GPTBot, ClaudeBot, PerplexityBot, Google-Extended). Convention: llmstxt.org.
//
// Why this matters here especially: the MDX article bodies currently render
// client-side, so non-JS AI crawlers can miss deep content. This file gives them
// an explicit, curated map of the most important pages and what they cover.

export const dynamic = 'force-static';

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

## Other Markets
- [United Kingdom](https://smartfinpro.com/uk)
- [Canada](https://smartfinpro.com/ca)
- [Australia](https://smartfinpro.com/au)

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
