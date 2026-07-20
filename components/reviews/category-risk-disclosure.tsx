// components/reviews/category-risk-disclosure.tsx — category-specific risk disclaimer
// Server Component (no state/events/browser APIs — plain conditional text render).
// See lib/reviews/category-disclaimers.ts for the category → text mapping and
// the T2 rationale (2026-07-18 editorial-integrity remediation).

import { getCategoryDisclaimer, LEVERAGE_DISCLAIMER_CATEGORIES } from '@/lib/reviews/category-disclaimers';

interface CategoryRiskDisclosureProps {
  category: string;
  /** Product-level leverage/CFD flag. For leverage categories (trading/forex)
   *  the CFD warning renders ONLY when this is true — a `trading` product that
   *  offers no CFDs (e.g. eToro US) must not show a CFD warning. Non-leverage
   *  category disclaimers (debt-relief, credit-repair) ignore this flag. */
  hasLeverageRisk?: boolean;
  className?: string;
}

/** Renders nothing when the category has no mapped disclaimer — no generic fallback text. */
export function CategoryRiskDisclosure({ category, hasLeverageRisk, className = 'mt-3 text-xs' }: CategoryRiskDisclosureProps) {
  const text = getCategoryDisclaimer(category);
  if (!text) return null;
  // CFD/leverage warning only for products that actually carry that risk.
  if (LEVERAGE_DISCLAIMER_CATEGORIES.has(category) && !hasLeverageRisk) return null;

  return (
    <div className={className} style={{ color: 'var(--sfp-slate)' }}>
      {text}
    </div>
  );
}
