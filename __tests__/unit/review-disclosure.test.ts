// __tests__/unit/review-disclosure.test.ts
// Render-to-string tests for components/reviews/review-disclosure.tsx.
//
// These moved here verbatim from review-header.test.ts when the disclosure was
// lifted out of the header to sit before the Methodology section. The wording
// is operator-approved compliance copy, so it is asserted exactly — and against
// the rendered TEXT rather than the raw HTML, because "BEST-X Score." sits in a
// nowrap span that splits the markup without changing a single character on
// screen.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ReviewDisclosure } from '@/components/reviews/review-disclosure';

const text = (html: string) => html.replace(/<[^>]+>/g, '');

describe('ReviewDisclosure', () => {
  it('renders the exact operator-approved wording and a How-we-make-money link', () => {
    const html = renderToStaticMarkup(h(ReviewDisclosure, { category: 'business-banking' }));
    expect(text(html)).toContain(
      'SmartFinPro may earn a commission from partner links. This never affects our BEST-X Score.',
    );
    expect(html).toContain('href="/affiliate-disclosure"');
    expect(html).toContain('How we make money');
  });

  it('appends the leverage-risk addendum only for a leverage category AND hasLeverageRisk=true', () => {
    for (const category of ['trading', 'forex'] as const) {
      const leveraged = renderToStaticMarkup(h(ReviewDisclosure, { category, hasLeverageRisk: true }));
      expect(leveraged).toContain('high risk of losing money');

      // Same category, flag absent — eToro US carries no CFDs, so a trading
      // page must not inherit the warning from its category alone.
      const unleveraged = renderToStaticMarkup(h(ReviewDisclosure, { category }));
      expect(unleveraged).not.toContain('high risk of losing money');
    }

    // A non-leverage category never shows it, flag or not.
    const banking = renderToStaticMarkup(
      h(ReviewDisclosure, { category: 'business-banking', hasLeverageRisk: true }),
    );
    expect(banking).not.toContain('high risk of losing money');
  });
});
