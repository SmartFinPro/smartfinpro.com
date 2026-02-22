/**
 * Market-Specific Compliance Prompts
 *
 * These prompts are injected into Claude's content generation requests
 * to ensure all generated content complies with local financial regulations.
 *
 * Used by:
 * - lib/actions/genesis.ts (generateLongFormAsset)
 * - lib/actions/content-generator.ts (any AI-generated content)
 *
 * Each market includes:
 * - Regulatory body requirements
 * - Required disclaimers
 * - Key compliance terms and formatting rules
 * - Examples of compliant language
 */

export const marketCompliancePrompts = {
  us: `IMPORTANT: US Compliance Requirements

This content will be published for US-based audiences. You MUST include:

1. AFFILIATE DISCLOSURE (prominently, multiple locations):
   - At the top of the article: "We may earn a commission when you click affiliate links."
   - In any product review/comparison sections
   - Bottom of page: Full FTC disclosure statement

2. FINANCIAL ADVICE DISCLAIMER (if recommending brokers, investments, or financial products):
   "This article is educational only. It does not constitute investment advice.
   Consult with a qualified financial advisor before making investment decisions."

3. RISK DISCLAIMERS (for trading/investing content):
   - "Trading and investing involve substantial risk of loss."
   - "Past performance does not guarantee future results."
   - "Leverage and margin can amplify losses."

4. NO GUARANTEES:
   - Never state that profits are "guaranteed"
   - Never promise "sure wins" or fixed returns
   - Use language: "may", "could", "potential to"

5. BROKER REVIEWS:
   - Include "This is not an endorsement" statement
   - Always mention account opening and fee details
   - Flag any promotional offers clearly

Generated content will be checked by compliance_audit dashboard.`,

  uk: `IMPORTANT: UK Compliance Requirements (FCA Consumer Duty)

This content will be published for UK-based audiences. You MUST include:

1. FCA DISCLAIMER (required at top AND bottom of pages discussing financial products):
   "⚠️ FCA DISCLAIMER: This content is for educational purposes only.
   Financial Conduct Authority (FCA) regulated products are not suitable
   for all customers. We are not licensed financial advisors.

   Consult an FCA-regulated Independent Financial Adviser before proceeding."

2. CONSUMER DUTY COMPLIANCE (FCA Consumer Duty rules effective 2023):
   - Content must put consumer interests first
   - Clear, fair, and not misleading information
   - Acknowledge conflicts of interest in affiliate partnerships
   - Explain how recommendations serve YOUR interests, not just the firm's

3. INVESTMENT WARNINGS (mandatory for any investment/ISA/Trading content):
   "Your capital is at risk. ISAs and Investment Accounts are not protected by FSCS.
   Past performance is not indicative of future results."

4. MORTGAGE/PROPERTY FINANCE (if covered):
   - "A secured loan is secured against your home and your home can be repossessed."
   - FCA Mortgage Credit Directive compliance

5. AFFILIATE DISCLOSURES:
   - Explicitly state "This page contains affiliate links"
   - Explain how you profit from recommendations
   - Format: "We earn a commission if you click through and open an account"

6. LANGUAGE:
   - Avoid "best" without qualification → "highly-rated" or "competitive"
   - Avoid guarantees → use "may", "typically", "generally"

Generated content will be flagged with FCA labels in dashboard.`,

  ca: `IMPORTANT: Canada Compliance Requirements (IIROC/CIRO/OSC)

This content will be published for Canadian audiences. You MUST include:

1. CIRO/OSC DISCLAIMER (for investment/broker recommendations):
   "⚠️ CANADIAN SECURITIES DISCLAIMER:
   Investment products and trading services are subject to regulation by:
   - Canadian Investment Regulatory Organization (CIRO)
   - Ontario Securities Commission (OSC) / provincial regulators

   This content is educational only. Not investment advice.
   Consult a CIRO-registered advisor before investing."

2. TAX CONSIDERATIONS (important for Canadian audience):
   - "Tax implications vary. Consult a Canadian tax professional."
   - Mention RRSP, TFSA, and FHSA where relevant
   - Flag any US tax treaty implications

3. AFFILIATE DISCLAIMERS:
   - "We may earn commissions. This does not affect your pricing."
   - "Our recommendations are unbiased, but we may profit from referrals"
   - Transparency about compensation

4. MARGIN/LEVERAGE WARNINGS:
   - "Margin trading can result in total loss of capital"
   - "CIRO requires specific risk disclosures"
   - Link to regulator's resources

5. BANKING & LENDING:
   - CDIC protection limits (currently $100k CAD)
   - Interest rate and fee clarity
   - "Your deposits may be insured up to $100,000 CAD per institution"

6. FOREX/CRYPTO:
   - Not eligible for CDIC protection
   - Subject to high volatility
   - May not be suitable for retail clients

Generated content will comply with provincial securities regulations.`,

  au: `IMPORTANT: Australia Compliance Requirements (ASIC/CSLR)

This content will be published for Australian audiences. You MUST include:

1. ASIC DISCLAIMER (mandatory for financial product recommendations):
   "⚠️ ASIC GENERAL ADVICE WARNING:
   This content provides GENERAL advice only. It does not constitute personal financial advice.
   The Australian Securities and Investments Commission (ASIC) regulates financial services.

   Before investing, consider:
   - Your financial objectives and circumstances
   - Your risk tolerance

   Consult an ASIC-licensed financial adviser for personal advice."

2. FINANCIAL PRODUCT ENDORSEMENTS:
   - Avoid implying government endorsement
   - Avoid promises of "safety" or "guaranteed returns"
   - Always include: "Your capital is at risk"

3. AFFILIATE TRANSPARENCY:
   - "We receive commissions from featured products"
   - "This does not affect pricing for you"
   - Explain potential conflicts of interest

4. SUPERANNUATION/RETIREMENT:
   - Link to super.asic.gov.au for consumer guides
   - Mention contribution limits (current financial year)
   - Flag preservation age rules

5. BANKING & DEPOSITS:
   - "Deposits are protected by the Financial Claims Scheme up to $250,000 AUD"
   - Name the Australian Prudential Regulation Authority (APRA)

6. FOREX/CFD/CRYPTO:
   - "High-risk products. Retail investors should understand risks."
   - Link to ASIC's MoneySmart warnings
   - "Not suitable for all investors"

7. LANGUAGE:
   - Use Australian English spelling (favour, realise, etc.)
   - Currency: AUD (not USD unless explicitly comparing)
   - Tax references: ASIC/ATO, not IRS or other jurisdictions

Generated content will be tagged with ASIC labels for regulatory tracking.`,
} as const;

/**
 * Get compliance prompt for a specific market
 * Falls back to US if market not found
 */
export function getCompliancePrompt(market: 'us' | 'uk' | 'ca' | 'au'): string {
  return marketCompliancePrompts[market] || marketCompliancePrompts.us;
}

/**
 * Format a full Claude system prompt with market compliance injected
 *
 * Usage:
 *   const systemPrompt = formatComplianceSystemPrompt('uk', baseSystemPrompt);
 */
export function formatComplianceSystemPrompt(
  market: 'us' | 'uk' | 'ca' | 'au',
  baseSystemPrompt: string,
): string {
  const compliancePrompt = getCompliancePrompt(market);
  return `${baseSystemPrompt}\n\n${compliancePrompt}`;
}

/**
 * Compliance checklist — use before publishing to check generated content
 *
 * Returns: { passed: boolean; issues: string[] }
 */
export function checkComplianceRequirements(
  market: 'us' | 'uk' | 'ca' | 'au',
  content: string,
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  const contentLower = content.toLowerCase();

  const checks: Record<string, Record<string, string[]>> = {
    us: {
      affiliate: ['affiliate disclosure', 'commission'],
      disclaimer: ['educational only', 'not financial advice', 'consult'],
      risk: ['risk', 'may lose', 'no guarantee'],
    },
    uk: {
      fca: ['fca disclaimer', 'fca'],
      consumer_duty: ['consumer interests', 'not misleading'],
      investment_warning: ['capital at risk'],
    },
    ca: {
      ciro: ['ciro', 'canadian investment'],
      tax: ['tax professional', 'rrsp', 'tfsa'],
      affiliate: ['commissions', 'may profit'],
    },
    au: {
      asic: ['asic', 'general advice warning'],
      government: ['not endorsed'],
      deposits: ['protected', 'financial claims scheme'],
    },
  };

  const marketChecks = checks[market] || checks.us;

  for (const [category, keywords] of Object.entries(marketChecks)) {
    const hasAny = keywords.some((kw) => contentLower.includes(kw));
    if (!hasAny) {
      issues.push(`Missing ${category}: ${keywords.join(' or ')}`);
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
