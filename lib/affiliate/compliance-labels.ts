/**
 * Compliance Labels — Client-safe, pure-function module
 *
 * Regional regulatory disclaimers for affiliate links.
 * Extracted from link-registry.ts to avoid pulling in server-only
 * dependencies (supabase/server -> next/headers) when used in
 * client components via the MDX component tree.
 *
 * IMPORTANT: This file must remain 100% client-safe.
 *            NO imports from next/headers, supabase/server, or
 *            any 'use server' module. Breaking this rule will
 *            re-introduce the Turbopack enqueueModel crash.
 *
 * Coverage: 4 markets x 16 categories = 64 cells (full matrix)
 */

import type { Market, Category } from '@/types';

// ── Default fallback ────────────────────────────────────────
const DEFAULT_LABEL = 'Terms and conditions apply. 18+ only.';

// ── Full Compliance Matrix ──────────────────────────────────
// Every Market x Category combination has a specific label.
// Regulatory references follow industry standards per jurisdiction.

const COMPLIANCE_MAP: Record<Market, Partial<Record<Category, string>> & { default: string }> = {
  // ────────────────────────────────────────────────────────────
  // US — SEC / NFA / CFTC / FDIC / NCUA
  // ────────────────────────────────────────────────────────────
  us: {
    default: 'Terms and conditions apply. 18+ only.',
    'ai-tools':
      'Affiliate link. Terms apply. Not an endorsement.',
    trading:
      'Investing involves risk of loss and is not suitable for all investors. Securities offered through SEC-registered entities. Not FDIC insured.',
    forex:
      'Forex trading involves significant risk of loss. NFA/CFTC regulated. Leverage can amplify gains and losses.',
    'personal-finance':
      'Rates and fees apply. See issuer\'s terms for details. Not financial advice. APRs may vary.',
    'business-banking':
      'Terms apply. Deposits may be FDIC insured where applicable. Business eligibility requirements apply.',
    cybersecurity:
      'Affiliate link. Terms apply. Feature availability may vary by plan.',
    'credit-repair':
      'This is not legal or financial advice. Results vary. Credit repair companies cannot guarantee specific outcomes.',
    'debt-relief':
      'Debt relief programs may have tax consequences. Fees apply. Results vary based on individual circumstances.',
    'credit-score':
      'Credit scores are for educational purposes only. Actual scores may vary by bureau and scoring model.',
    remortgaging:
      'Refinancing may involve closing costs and fees. Not FDIC insured. Rates subject to credit approval. NMLS regulated.',
    'cost-of-living':
      'Information provided for educational purposes only. Not financial advice. Rates and prices may vary by state.',
    savings:
      'Rates and APYs may vary. Deposits may be FDIC insured up to $250,000. Terms and conditions apply.',
    superannuation:
      'US equivalent: 401(k)/IRA retirement accounts. SEC regulated. Past performance is not indicative of future results.',
    'gold-investing':
      'Investing in precious metals carries risk. Not FDIC insured. Past performance is not indicative of future returns.',
    'tax-efficient-investing':
      'Tax benefits depend on individual circumstances. Not tax advice. Consult a qualified tax professional. SEC regulated.',
    housing:
      'Terms apply. Mortgage rates subject to credit approval. Not FDIC insured. NMLS regulated. Equal Housing Lender.',
  },

  // ────────────────────────────────────────────────────────────
  // UK — FCA / PRA / FSCS
  // ────────────────────────────────────────────────────────────
  uk: {
    default: 'Terms and conditions apply. 18+ only.',
    'ai-tools':
      'Affiliate link. Terms apply. Not an endorsement.',
    trading:
      'Capital at risk. 74-89% of retail CFD accounts lose money. FCA regulated. Professional controls apply.',
    forex:
      'Capital at risk. CFDs are complex instruments with high risk of rapid loss due to leverage. FCA authorised.',
    'personal-finance':
      'Your capital is at risk. FCA regulated. FSCS protected up to \u00A385,000 where applicable.',
    'business-banking':
      'Terms apply. FCA authorised. FSCS protection may apply to eligible deposits.',
    cybersecurity:
      'Affiliate link. Terms apply. Feature availability may vary by plan.',
    remortgaging:
      'Your home may be repossessed if you do not keep up repayments on your mortgage. FCA regulated.',
    'cost-of-living':
      'Information provided for guidance only. Eligibility for government schemes varies. FCA regulated where applicable.',
    savings:
      'Your capital is at risk. FSCS protected up to £85,000 where applicable. Interest rates may vary.',
    'credit-repair':
      'FCA regulated where applicable. Credit repair outcomes are not guaranteed. Seek independent financial advice.',
    'debt-relief':
      'Debt solutions may affect your credit rating. FCA authorised. Fees may apply. Seek independent debt advice.',
    'credit-score':
      'Credit scores are for educational purposes only. Scores may vary between CRAs (Experian, Equifax, TransUnion).',
    superannuation:
      'UK equivalent: Workplace pensions. FCA regulated. The Pensions Regulator rules apply. Tax relief subject to eligibility.',
    'gold-investing':
      'Capital at risk. FCA regulated where applicable. Past performance is not a reliable indicator of future results.',
    'tax-efficient-investing':
      'ISA/SIPP tax benefits depend on individual circumstances. FCA regulated. HMRC rules apply. Not tax advice.',
    housing:
      'Your home may be repossessed if you do not keep up repayments. FCA regulated. Stamp Duty may apply.',
  },

  // ────────────────────────────────────────────────────────────
  // CA — CIRO / CIPF / CDIC / OSFI
  // ────────────────────────────────────────────────────────────
  ca: {
    default: 'Terms and conditions apply. 18+ only.',
    'ai-tools':
      'Affiliate link. Terms apply. Not an endorsement.',
    trading:
      'Trading involves risk of loss. CIRO regulated. Protected by CIPF within specified limits.',
    forex:
      'Forex trading carries significant risk. CIRO regulated. Leverage can amplify gains and losses.',
    'personal-finance':
      'Terms apply. Protected by CIRO / CIPF where applicable. Rates may vary by province.',
    'business-banking':
      'Terms apply. CDIC insured where applicable. Business eligibility requirements apply.',
    cybersecurity:
      'Affiliate link. Terms apply. Feature availability may vary by plan.',
    'tax-efficient-investing':
      'Terms apply. CIRO regulated where applicable. Tax rules vary by province. Not tax advice.',
    'credit-repair':
      'CIRO regulated where applicable. Credit repair outcomes are not guaranteed. Provincial consumer protection rules apply.',
    'debt-relief':
      'Debt relief may affect your credit rating. Provincial licensing requirements apply. Fees may apply.',
    'credit-score':
      'Credit scores are for educational purposes only. Scores may vary between bureaus (Equifax, TransUnion).',
    remortgaging:
      'Terms apply. OSFI regulated. Mortgage rates subject to credit approval. Provincial rules may vary.',
    'cost-of-living':
      'Information provided for educational purposes only. Prices and benefits may vary by province.',
    savings:
      'Terms apply. CDIC insured up to $100,000 per category where applicable. Interest rates may vary.',
    superannuation:
      'Canadian equivalent: RRSP/RPP pension accounts. CIRO regulated. Tax rules vary by province.',
    'gold-investing':
      'Investing in precious metals carries risk. CIRO regulated where applicable. Past performance is not indicative of future returns.',
    housing:
      'Terms apply. CDIC insured where applicable. Mortgage rates and eligibility may vary.',
  },

  // ────────────────────────────────────────────────────────────
  // AU — ASIC / AFSL / RG 227 / ACL
  // ────────────────────────────────────────────────────────────
  au: {
    default: 'Terms and conditions apply. 18+ only.',
    'ai-tools':
      'Affiliate link. Terms apply. Not an endorsement.',
    trading:
      'Trading involves risk. ASIC regulated (RG 227). Consider the PDS and TMD before deciding.',
    forex:
      'CFDs carry a high risk of rapid loss due to leverage. AFSL holder. Consider the PDS before deciding.',
    'personal-finance':
      'ACL regulated where applicable. Consider the PDS and TMD before deciding. Terms apply.',
    'business-banking':
      'Terms apply. Consider the PDS & TMD. Deposits may be protected under the FCS.',
    cybersecurity:
      'Affiliate link. Terms apply. Feature availability may vary by plan.',
    superannuation:
      'General advice warning. Consider the PDS and TMD before deciding. Past performance is not a reliable indicator of future results.',
    'gold-investing':
      'Investing in gold carries risk. AFSL regulated where applicable. Consider the PDS. Past performance is not indicative of future returns.',
    'credit-repair':
      'ASIC regulated where applicable. Credit repair outcomes are not guaranteed. Consider seeking independent financial advice.',
    'debt-relief':
      'General advice warning. Debt agreements may affect your credit rating. ASIC regulated. Consider the PDS.',
    'credit-score':
      'Credit scores are for educational purposes only. Scores may vary between CRAs (Equifax, Experian, illion).',
    remortgaging:
      'Consider the PDS and TMD before deciding. ASIC regulated. Your home may be at risk if you do not keep up repayments.',
    'cost-of-living':
      'Information provided for educational purposes only. General advice warning. Prices may vary by state and territory.',
    savings:
      'ACL regulated where applicable. Consider the PDS and TMD before deciding. Interest rates may vary.',
    'tax-efficient-investing':
      'General advice warning. Tax benefits depend on individual circumstances. ASIC regulated. ATO rules apply. Not tax advice.',
    housing:
      'Consider the PDS and TMD before deciding. ASIC regulated. Mortgage rates subject to credit approval. Stamp duty may apply.',
  },
};

// ── Public API ──────────────────────────────────────────────

/**
 * Get the compliance label for a given market and category.
 *
 * Extremely robust: handles undefined, null, empty strings, and
 * unknown market/category values by cascading through fallbacks.
 *
 * Pure function — zero server dependencies, safe for client components.
 *
 * @example
 *   getComplianceLabel('uk', 'trading')
 *   // → "Capital at risk. 74-89% of retail CFD accounts lose money. FCA regulated. Professional controls apply."
 *
 *   getComplianceLabel(undefined as any, undefined as any)
 *   // → "Terms and conditions apply. 18+ only."
 */
export function getComplianceLabel(market?: Market, category?: Category): string {
  if (!market || !category) return DEFAULT_LABEL;

  const marketLabels = COMPLIANCE_MAP[market];
  if (!marketLabels) return DEFAULT_LABEL;

  return marketLabels[category] || marketLabels.default || DEFAULT_LABEL;
}

// ── Dashboard Export ────────────────────────────────────────
// Pre-structured for the Affiliate Command Center dashboard.
// Allows rendering all 64 disclaimer cells in one table view.

export interface MarketRule {
  market: Market;
  category: Category;
  label: string;
  regulator: string;
}

const REGULATOR_MAP: Record<Market, string> = {
  us: 'SEC / NFA / CFTC',
  uk: 'FCA / PRA',
  ca: 'CIRO / OSFI',
  au: 'ASIC / AFSL',
};

const ALL_CATEGORIES: Category[] = [
  'ai-tools',
  'trading',
  'forex',
  'personal-finance',
  'business-banking',
  'cybersecurity',
  'credit-repair',
  'debt-relief',
  'credit-score',
  'remortgaging',
  'cost-of-living',
  'savings',
  'superannuation',
  'gold-investing',
  'tax-efficient-investing',
  'housing',
];

const ALL_MARKETS: Market[] = ['us', 'uk', 'ca', 'au'];

/**
 * Full market rules matrix for dashboard display.
 * 64 entries: 4 markets x 16 categories.
 *
 * @example
 *   // In a dashboard component:
 *   import { MARKET_RULES } from '@/lib/affiliate/compliance-labels';
 *   MARKET_RULES.forEach(rule => {
 *     console.log(`${rule.market}/${rule.category}: ${rule.label} (${rule.regulator})`);
 *   });
 */
export const MARKET_RULES: MarketRule[] = ALL_MARKETS.flatMap((market) =>
  ALL_CATEGORIES.map((category) => ({
    market,
    category,
    label: COMPLIANCE_MAP[market][category] || COMPLIANCE_MAP[market].default,
    regulator: REGULATOR_MAP[market],
  })),
);
