// components/reviews/category-risk-disclosure.tsx — category-specific risk disclaimer
// Server Component (no state/events/browser APIs — plain conditional text render).
// See lib/reviews/category-disclaimers.ts for the category → text mapping and
// the T2 rationale (2026-07-18 editorial-integrity remediation).

import { getCategoryDisclaimer } from '@/lib/reviews/category-disclaimers';

interface CategoryRiskDisclosureProps {
  category: string;
  className?: string;
}

/** Renders nothing when the category has no mapped disclaimer — no generic fallback text. */
export function CategoryRiskDisclosure({ category, className = 'mt-3 text-xs' }: CategoryRiskDisclosureProps) {
  const text = getCategoryDisclaimer(category);
  if (!text) return null;

  return (
    <div className={className} style={{ color: 'var(--sfp-slate)' }}>
      {text}
    </div>
  );
}
