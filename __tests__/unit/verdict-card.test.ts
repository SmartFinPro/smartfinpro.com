// __tests__/unit/verdict-card.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/verdict-card.tsx (T8, review-redesign V2).
//
// Covers the plan's explicit T8 contract: verdict prose + top-3-strengths
// cap + single mainLimitation + optional bestAlternative link/plain-text
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
  it('renders the verdict summary, caps topStrengths at 3, and renders exactly one mainLimitation', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: VERDICT, position: POSITION, fieldCount: 9 }),
    );
    expect(html).toContain('Our Verdict');
    expect(html).toContain('eToro is a strong pick for copy trading');
    expect(html).toContain('No broker-imposed options contract fees');
    expect(html).toContain('Copy trading at scale');
    expect(html).toContain('Wide asset coverage');
    // 4th topStrength must be dropped (schema caps at 3, component slices defensively)
    expect(html).not.toContain('Simple mobile app');
    expect(html).toContain('Main limitation:');
    expect(html).toContain('Support response times trail the field leaders.');
  });

  it('links the best alternative when a resolved href is provided', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: VERDICT, position: POSITION, fieldCount: 9, bestAlternativeHref: '/trading/fidelity-review' }),
    );
    expect(html).toContain('href="/trading/fidelity-review"');
    expect(html).toContain('Fidelity');
    expect(html).toContain('higher overall score and faster support');
  });

  it('renders the best alternative as plain text (never a dead link) when no href is resolved', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: VERDICT, position: POSITION, fieldCount: 9 }),
    );
    expect(html).not.toContain('<a href=""');
    expect(html).toContain('Fidelity');
  });

  it('omits the best-alternative line entirely when verdict.bestAlternative is absent', () => {
    const { bestAlternative, ...withoutAlt } = VERDICT;
    void bestAlternative;
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: withoutAlt as VerdictBlock, position: POSITION, fieldCount: 9 }),
    );
    expect(html).not.toContain('Best alternative');
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

  it('Null-Degradation: position === null omits the BestXScore panel entirely and keeps the verdict prose single-column', () => {
    const html = renderToStaticMarkup(
      h(VerdictCard, { verdict: VERDICT, position: null, fieldCount: 9 }),
    );
    // Verdict prose still renders.
    expect(html).toContain('Our Verdict');
    expect(html).toContain('eToro is a strong pick for copy trading');
    // BestXScore panel is gone — no score digits, no band label markup, no methodology sentence/link.
    expect(html).not.toContain('/10');
    expect(html).not.toContain('How we score');
    expect(html).not.toContain('Calculated from verified data points');
    expect(html).not.toContain('href="/methodology"');
    // Two-column grid class is not applied when there is no right panel.
    expect(html).not.toContain('grid-cols');
  });
});
