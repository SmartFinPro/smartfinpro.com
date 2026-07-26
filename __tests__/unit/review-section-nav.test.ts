// __tests__/unit/review-section-nav.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/review-section-nav.tsx (T10, review-redesign V2).
//
// IntersectionObserver doesn't exist in Node and useEffect never runs under
// renderToStaticMarkup, so this only exercises the pre-hydration static
// markup — which is exactly what the plan's "SectionNav rendert exakt 7 aus
// der Konstante" requirement needs: the 7 anchors come from
// REVIEW_V2_ANCHORS, not a second hand-typed list in the component.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ReviewSectionNav } from '@/components/reviews/review-section-nav';
import { REVIEW_V2_ANCHORS } from '@/lib/reviews/section-anchors';

describe('ReviewSectionNav', () => {
  it('renders exactly the 7 anchors from REVIEW_V2_ANCHORS, in order, each as an in-page link', () => {
    const html = renderToStaticMarkup(h(ReviewSectionNav, {}));
    const hrefMatches = [...html.matchAll(/href="(#[a-z]+)"/g)].map((m) => m[1]);
    expect(hrefMatches).toEqual(REVIEW_V2_ANCHORS.map((a) => `#${a.id}`));
    for (const anchor of REVIEW_V2_ANCHORS) {
      // renderToStaticMarkup HTML-escapes "&" — compare against the escaped form.
      expect(html).toContain(anchor.title.replace(/&/g, '&amp;'));
    }
  });

  it('has no active anchor before hydration (scroll-spy has not run yet)', () => {
    const html = renderToStaticMarkup(h(ReviewSectionNav, {}));
    expect(html).not.toContain('aria-current="true"');
  });

  it('renders no CTA and no rating markup — those belong to VerdictCard/DecisionBridge only', () => {
    const html = renderToStaticMarkup(h(ReviewSectionNav, {}));
    expect(html).not.toContain('Compare all');
    expect(html).not.toContain('/10');
    expect(html).not.toContain('★');
  });

  it('uses `position: sticky` (not a fixed+translate overlay) and respects a custom topOffset', () => {
    const html = renderToStaticMarkup(h(ReviewSectionNav, { topOffset: 80 }));
    expect(html).toContain('sticky');
    expect(html).toContain('top:80px');
  });
});
