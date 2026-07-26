// components/reviews/review-disclosure.tsx — the article's affiliate disclosure
// ============================================================
// Moved out of ReviewHeader (operator, 2026-07-21) so it can sit immediately
// before the Methodology section instead of directly under the H1. It is the
// same wording, in one place, rather than copied to a second call site: this
// is compliance copy and __tests__/unit/review-header.test.ts guards it
// verbatim.
//
// WHY MOVING IT DOWN IS SAFE. A disclosure should be clear and conspicuous
// near the affiliate links it concerns, so relocating one to the foot of the
// article would normally be a step backwards. It is not here, because it is
// not the only one: ReviewSidebar renders its own compact disclosure directly
// beneath the "Visit <product>" button, and that sidebar is rendered twice —
// pinned in the right rail on desktop, in-flow under the verdict on mobile —
// so a disclosure sits beside the CTA at every breakpoint. Verified in the
// built page before the move: header disclosure at y=389, sidebar disclosure
// at y=1140, both visible. What moves is the article-level statement, which
// now reads next to the methodology it refers to.
// ============================================================

import Link from 'next/link';
import type { Category } from '@/lib/i18n/config';

/**
 * Categories where the line gets a terse leverage-risk addendum. This
 * condenses the same CFD/leverage fact already carried in full by
 * lib/reviews/category-disclaimers.ts (rendered via CategoryRiskDisclosure) —
 * a one-clause echo, not a replacement for the full disclosure.
 */
const LEVERAGE_RISK_CATEGORIES: ReadonlySet<Category> = new Set(['trading', 'forex']);

export interface ReviewDisclosureProps {
  category: Category;
  /** From frontmatter. The addendum needs BOTH a leverage category and this flag. */
  hasLeverageRisk?: boolean;
}

export function ReviewDisclosure({ category, hasLeverageRisk }: ReviewDisclosureProps) {
  const showRiskAddendum = LEVERAGE_RISK_CATEGORIES.has(category) && Boolean(hasLeverageRisk);

  return (
    <p
      style={{
        fontFamily: 'var(--font-primary)',
        fontSize: '12.5px',
        color: 'var(--sfp-slate)',
        lineHeight: 1.6,
        margin: 0,
        maxWidth: '66ch',
        borderTop: '1px solid var(--sfp-hairline)',
        paddingTop: '12px',
      }}
    >
      SmartFinPro may earn a commission from partner links. This never affects our{' '}
      <span style={{ whiteSpace: 'nowrap' }}>BEST-X Score.</span>{' '}
      {/* Inline underline: globals.css strips underlines from internal links
          inside <article>, and navy against the surrounding slate is 1.72:1 —
          far below the 3:1 that would let colour alone mark a link (WCAG
          1.4.1). The inline style out-specifies that stylesheet rule. */}
      <Link
        href="/affiliate-disclosure"
        style={{
          color: 'var(--sfp-navy)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        How we make money
      </Link>
      {showRiskAddendum
        ? ' Leveraged trading products carry a high risk of losing money rapidly.'
        : null}
    </p>
  );
}
