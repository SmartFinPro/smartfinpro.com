// __tests__/unit/review-header.test.ts
// Render-to-string tests (react-dom/server, no jsdom — see
// __tests__/unit/shell-rsc-smoke.test.ts for the established pattern) for
// components/reviews/review-header.tsx (T7, review-redesign V2).
//
// Covers the plan's explicit contract: no V1 title suffix, MetaLine segment
// omission ("Daten fehlen ⇒ Segment entfällt ersatzlos"), positioning-line
// presence gating, the exact operator-approved DisclosureLine wording, and
// the trading/forex-only risk addendum.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ReviewHeader } from '@/components/reviews/review-header';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Trading Platforms', href: '/trading' },
  { label: 'eToro Review' },
];

describe('ReviewHeader', () => {
  it('renders the H1 with the raw title — no V1 "Expert Review & Analysis Report" suffix', () => {
    const html = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'eToro Review',
        breadcrumbs: BREADCRUMBS,
        category: 'trading',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(html).toContain('eToro Review');
    expect(html).not.toContain('Expert Review & Analysis Report');
  });

  it('includes all three MetaLine segments when both dates are present', () => {
    const html = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'eToro Review',
        breadcrumbs: BREADCRUMBS,
        category: 'trading',
        dataVerifiedDate: '2026-07-18',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(html).toContain('SmartFinPro Research');
    expect(html).toContain('Data verified 18 Jul 2026');
    expect(html).toContain('Updated 17 Jul 2026');
  });

  it('drops the "Data verified" segment ersatzlos (no placeholder) when dataVerifiedDate is absent', () => {
    const html = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'eToro Review',
        breadcrumbs: BREADCRUMBS,
        category: 'trading',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(html).toContain('SmartFinPro Research');
    expect(html).not.toContain('Data verified');
    expect(html).not.toContain('· ·');
    expect(html).toContain('Updated 17 Jul 2026');
  });

  it('drops a malformed date segment instead of rendering "Invalid Date"', () => {
    const html = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'eToro Review',
        breadcrumbs: BREADCRUMBS,
        category: 'trading',
        dataVerifiedDate: 'not-a-date',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(html).not.toContain('Invalid Date');
    expect(html).not.toContain('Data verified');
  });

  it('renders the positioning lead line only when provided', () => {
    const withPositioning = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'eToro Review',
        positioning: 'Best for copy traders who want zero broker options fees.',
        breadcrumbs: BREADCRUMBS,
        category: 'trading',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(withPositioning).toContain('Best for copy traders');

    const withoutPositioning = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'eToro Review',
        breadcrumbs: BREADCRUMBS,
        category: 'trading',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(withoutPositioning).not.toContain('Best for copy traders');
  });

  it('renders the DisclosureLine with the exact operator-approved wording and a How-we-make-money link', () => {
    const html = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'Mercury Review',
        breadcrumbs: BREADCRUMBS,
        category: 'business-banking',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(html).toContain(
      'SmartFinPro may earn a commission from partner links. This never affects our BEST-X Score.',
    );
    expect(html).toContain('href="/affiliate-disclosure"');
    expect(html).toContain('How we make money');
  });

  it('appends a terse risk addendum for trading/forex categories only', () => {
    const trading = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'eToro Review',
        breadcrumbs: BREADCRUMBS,
        category: 'trading',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(trading).toContain('high risk of losing money');

    const forex = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'OANDA Review',
        breadcrumbs: BREADCRUMBS,
        category: 'forex',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(forex).toContain('high risk of losing money');

    const banking = renderToStaticMarkup(
      h(ReviewHeader, {
        title: 'Mercury Review',
        breadcrumbs: BREADCRUMBS,
        category: 'business-banking',
        modifiedDate: '2026-07-17',
      }),
    );
    expect(banking).not.toContain('high risk of losing money');
  });
});
