// lib/reviews/category-disclaimers.ts — category → risk-disclosure text mapping
// ============================================================
// T2 (2026-07-18 editorial-integrity remediation): report-layout.tsx used to
// render one blanket disclaimer ("Not legal, tax, or bankruptcy advice.
// Terms vary by state and credit profile.") under EVERY affiliate CTA,
// regardless of category — including trading/forex reviews, where "credit
// profile" is meaningless and the real regulatory risk (CFD/leverage loss)
// went undisclosed entirely.
//
// This maps each category to its own, category-appropriate disclaimer.
// Categories with no mapping render nothing (`null`) — no fallback text,
// no reused blanket claim. See components/reviews/category-risk-disclosure.tsx
// for the render wrapper and report-layout.tsx:747 for the call site.
// ============================================================

const CFD_LEVERAGE_RISK_DISCLAIMER =
  'CFDs and other leveraged trading products carry a high risk of losing money rapidly due to leverage. ' +
  'The majority of retail investor accounts lose money when trading these products with a given provider. ' +
  'Consider whether you understand how leveraged products work and whether you can afford to take the high risk of losing your money.';

const DEBT_RELIEF_DISCLAIMER =
  'Not legal, tax, or bankruptcy advice. Debt settlement programs may reduce your credit score, may involve tax consequences on forgiven debt, ' +
  'and are not available in every state — results vary by individual financial situation and creditor.';

const CREDIT_REPAIR_DISCLAIMER =
  'Not legal advice. Credit repair results vary by individual credit history and are not guaranteed — under the federal Credit Repair Organizations Act, ' +
  'no company can lawfully promise to remove accurate, timely, and verifiable negative information from your credit report.';

/** Category → disclaimer text. Categories not listed here render nothing. */
const CATEGORY_DISCLAIMERS: Record<string, string> = {
  trading: CFD_LEVERAGE_RISK_DISCLAIMER,
  forex: CFD_LEVERAGE_RISK_DISCLAIMER,
  'debt-relief': DEBT_RELIEF_DISCLAIMER,
  'credit-repair': CREDIT_REPAIR_DISCLAIMER,
};

/**
 * Returns the category-appropriate risk disclaimer, or `null` when the
 * category has no mapped disclaimer (renders nothing — never falls back to
 * a generic/blanket claim for an unmapped category).
 */
export function getCategoryDisclaimer(category: string): string | null {
  return CATEGORY_DISCLAIMERS[category] ?? null;
}
