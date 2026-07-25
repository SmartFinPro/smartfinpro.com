// __tests__/unit/verdict-card.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/verdict-card.tsx (T8, review-redesign V2).
//
// Covers the plan's explicit T8 contract: verdict prose + top-3-strengths
// single mainLimitation
// fallback, and — the Pflicht requirement — Null-Degradation: `position ===
// null` omits the BestXScore panel entirely (never falls back to a
// frontmatter rating) while the verdict prose still renders single-column.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { VerdictCard, type ReviewPosition } from '@/components/reviews/verdict-card';
import type { VerdictBlock } from '@/lib/reviews/verdict-frontmatter';

const VERDICT: VerdictBlock = {
  positioning: 'Good for active copy traders who want zero broker-imposed options contract fees.',
  summary:
    'eToro is a strong pick for copy trading and low-cost US options trading, backed by no broker-imposed ' +
    'per-contract fees, though regulatory and exchange pass-through fees still apply on every trade. Support ' +
    'response times lag the field leaders, and extended-hours trading availability for US accounts remains ' +
    'unestablished. For traders who value copy-trading tools and are comfortable with a mid-tier support ' +
    'experience, eToro is a solid, well-priced choice among the nine platforms compared here.',
  bestFor: ['Copy traders', 'Options traders watching contract fees', 'Multi-asset portfolios'],
  notFor: ['Traders who need 24/7 phone support', 'Extended-hours traders'],
  topStrengths: ['No broker-imposed options contract fees', 'Copy trading at scale', 'Wide asset coverage', 'Simple mobile app'],
  mainLimitation: 'Support response times trail the field leaders.',
  bestAlternative: { name: 'Fidelity', slug: 'fidelity', reason: 'higher overall score and faster support' },
};

const POSITION: ReviewPosition = {
  rank: 8,
  slug: 'etoro',
  name: 'eToro',
  score: 8.3,
  subScores: { fees: 8.8, features: 8.0, ux: 8.4, support: 7.8 },
  confidence: 'medium',
  dataVerifiedAt: '2026-07-03',
  isTopPick: false,
};

describe('VerdictCard', () => {
  it('renders the summary and exactly one mainLimitation, and no longer renders topStrengths', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: VERDICT, position: POSITION, fieldCount: 9 }),
    );
    // The summary itself, not a label: "Our Verdict" was removed as redundant
    // above the opening paragraph of a review.
    expect(html).not.toContain('Our Verdict');
    expect(html).toContain('eToro is a strong pick for copy trading');
    expect(html).toContain('Main limitation:');
    expect(html).toContain('Support response times trail the field leaders.');

    // topStrengths is no longer rendered (operator: too much information in
    // this block). Asserted against a fixture that still HAS the list, so
    // re-adding the render fails here — a check on absent data would not.
    expect(VERDICT.topStrengths.length).toBeGreaterThan(0);
    for (const strength of VERDICT.topStrengths) {
      expect(html).not.toContain(strength);
    }
  });

  it('never renders a best-alternative line, even when the frontmatter carries one', () => {
    // Removed from the card (operator, 2026-07-21). The fixture still has
    // `bestAlternative` — the frontmatter field and its Zod schema are
    // untouched — so this asserts the RENDER drops it rather than the data
    // being absent, which is what would silently regress if someone re-added
    // the block.
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: VERDICT, position: POSITION, fieldCount: 9 }),
    );
    expect(VERDICT.bestAlternative).toBeTruthy();
    expect(html).not.toContain('Best alternative');
    expect(html).not.toContain('higher overall score and faster support');
  });

  it('BestXScore renders score, band label, rank phrase, and the mandatory methodology sentence + link', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: VERDICT, position: POSITION, fieldCount: 9 }),
    );
    expect(html).toContain('8.3');
    expect(html).toContain('/10');
    expect(html).toContain('Good'); // scoreLabel(8.3) band
    expect(html).toContain('Rank 8 of 9'); // rankPhrase, fieldCount < 20
    expect(html).toContain(
      'Calculated from verified data points from official sources. Commercial relationships do not affect the score.',
    );
    expect(html).toContain('href="/methodology"');
    expect(html).toContain('How we score');
  });

  it('places mobile actions after audience fit and before the limitation and summary', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, {
        verdict: VERDICT,
        position: POSITION,
        fieldCount: 9,
        mobileActions: h('div', { 'data-mobile-actions-marker': true }, 'Actions'),
      }),
    );

    const score = html.indexOf('8.3');
    const bestFor = html.indexOf('>Best for<');
    const actions = html.indexOf('data-mobile-actions-marker');
    const limitation = html.indexOf('Main limitation:');
    const summary = html.indexOf('eToro is a strong pick for copy trading');

    expect(score).toBeGreaterThan(-1);
    expect(bestFor).toBeGreaterThan(score);
    expect(actions).toBeGreaterThan(bestFor);
    expect(limitation).toBeGreaterThan(actions);
    expect(summary).toBeGreaterThan(limitation);
  });

  it('keeps desktop facts visible and offers the same facts behind a collapsed mobile details control', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, {
        verdict: VERDICT,
        position: POSITION,
        fieldCount: 9,
        essentialFacts: [
          {
            label: 'Options contract fee',
            value: '$0 broker-imposed',
            asOf: '2026-07-18',
            sourceHref: 'https://www.etoro.com/en-us/trading/fees/',
          },
        ],
      }),
    );

    expect(html).toContain('<details');
    expect(html).not.toContain('<details open');
    expect(html).toContain('<summary');
    expect(html).toContain('Essential facts');
    expect(html).toContain('hidden md:block');
    expect(html).toContain('md:hidden');
    expect((html.match(/Options contract fee/g) ?? []).length).toBe(2);
  });

  it('Null-Degradation: position === null omits the BestXScore panel entirely and keeps the verdict prose single-column', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: VERDICT, position: null, fieldCount: 9 }),
    );
    // Verdict prose still renders (without the removed label).
    expect(html).toContain('eToro is a strong pick for copy trading');
    // BestXScore panel is gone — no score digits, no band label markup, no methodology sentence/link.
    expect(html).not.toContain('/10');
    expect(html).not.toContain('How we score');
    expect(html).not.toContain('Calculated from verified data points');
    expect(html).not.toContain('href="/methodology"');
    // The CARD's own two-column grid is not applied when there is no right
    // panel. Asserted on the card's specific class rather than the substring
    // "grid-cols": Best for / Not for now renders inside the card and brings
    // its own `sm:grid-cols-2`, which is a different grid and legitimately
    // present here.
    expect(html).not.toContain('md:grid-cols-[minmax(0,1fr)_260px]');
  });
});
