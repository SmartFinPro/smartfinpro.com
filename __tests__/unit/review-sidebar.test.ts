// __tests__/unit/review-sidebar.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/verdict-card.test.ts) for
// components/reviews/review-sidebar.tsx (sidebar rework, 2026-07-18).
//
// Covers: Report-Info-Card (real logo vs BarChart3 fallback — resolveLogoSrc
// checks the actual public/images/brokers/ filesystem, never a guessed src),
// "Published {Month Year}" formatting, the DecisionBridge Market Check
// widget with its internal CTA suppressed (showCta=false — the sidebar's own
// button pair is the only Compare affordance), the Visit button gated on
// affiliateUrl, and the affiliate/risk disclosure gated on affiliateUrl +
// category.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewSidebar } from '@/components/reviews/review-sidebar';
import type { DecisionBridgeData } from '@/lib/comparison/types';

function makeDecisionBridge(overrides: Partial<DecisionBridgeData> = {}): DecisionBridgeData {
  return {
    market: 'us',
    category: 'trading',
    topic: 'trading-platforms',
    topicLabel: 'trading platforms',
    cockpitHref: '/us/trading/best/trading-platforms',
    fieldCount: 9,
    leader: { name: 'Fidelity', score: 9.6 },
    scoreMin: 7.7,
    scoreMax: 9.6,
    lastVerified: '2026-07-18',
    officialSourceCount: 9,
    confidenceMix: { high: 6, medium: 2, low: 1 },
    field: [
      { rank: 1, name: 'Fidelity', score: 9.6, reviewHref: '/us/trading/fidelity-review', isYou: false },
      { rank: 8, name: 'eToro', score: 8.3, reviewHref: null, isYou: true },
    ],
    fieldBestSubScores: { fees: 9.5, features: 9.2, ux: 9.0, support: 9.6 },
    position: {
      rank: 8,
      slug: 'etoro',
      name: 'eToro',
      score: 8.3,
      subScores: { fees: 8.8, features: 8.0, ux: 8.4, support: 7.8 },
      confidence: 'medium',
      dataVerifiedAt: '2026-07-03',
      isTopPick: false,
    },
    ...overrides,
  };
}

describe('ReviewSidebar', () => {
  it('full fixture (eToro, known logo slug, trading category, affiliateUrl present): every sub-zone renders', () => {
    const html = renderToStaticMarkup(
      h(ReviewSidebar, {
        productName: 'eToro',
        publishDate: '2026-02-15',
        decisionBridge: makeDecisionBridge(),
        compareLabel: 'Compare all 9 trading platforms',
        affiliateUrl: 'https://www.etoro.com/en-us/',
        market: 'us',
        category: 'trading',
      }),
    );

    // a. Report Info Card
    expect(html).toContain('Expert Review');
    expect(html).toContain('Published');
    expect(html).toContain('February 2026');
    // Real logo (etoro.svg genuinely exists in public/images/brokers/) —
    // fs.existsSync-checked, not a hardcoded assumption.
    expect(html).toContain('/images/brokers/etoro.svg');

    // b. Market Check — the widget itself renders...
    expect(html).toContain('How eToro compares');
    // ...but its OWN internal CtaLink is suppressed (showCta=false): the
    // arrow-suffixed CTA text it would otherwise emit must not appear.
    expect(html).not.toContain('trading platforms →');

    // c. Button pair
    expect(html).toContain('Compare all 9 trading platforms');
    expect(html).toContain('Visit eToro');

    // d. Compact disclosure — trading category, but the eToro fixture has NO
    // hasLeverageRisk flag (eToro US offers no CFDs), so the quiet general-risk
    // line renders, NOT the prominent CFD RiskWarningBox.
    expect(html).toContain('reader-supported');
    expect(html).toContain('Investing involves risk, including possible loss of principal');
    expect(html).not.toContain('Risk Warning');

    // Sticky only at lg:
    expect(html).toContain('lg:sticky');
  });

  it('with hasLeverageRisk=true (a real CFD broker): shows the prominent CFD RiskWarningBox, not the general-risk line', () => {
    const html = renderToStaticMarkup(
      h(ReviewSidebar, {
        productName: 'eToro',
        publishDate: '2026-01-10',
        decisionBridge: makeDecisionBridge({}),
        compareLabel: 'Compare all 9 trading platforms',
        affiliateUrl: '/go/etoro',
        market: 'us',
        category: 'trading',
        hasLeverageRisk: true,
      }),
    );
    expect(html).toContain('Risk Warning');
    expect(html).not.toContain('Investing involves risk, including possible loss of principal');
  });

  it('unknown broker slug (no logo file): falls back to the BarChart3 icon, never a guessed <img src>', () => {
    const html = renderToStaticMarkup(
      h(ReviewSidebar, {
        productName: 'Totally Fictional Broker',
        publishDate: '2026-02-15',
        decisionBridge: makeDecisionBridge({
          position: {
            rank: 3,
            slug: 'totally-fictional-broker',
            name: 'Totally Fictional Broker',
            score: 8.0,
            subScores: {},
            confidence: null,
            dataVerifiedAt: null,
            isTopPick: false,
          },
        }),
        compareLabel: 'Compare all 9 trading platforms',
        affiliateUrl: null,
        market: 'us',
        category: 'trading',
      }),
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('totally-fictional-broker.svg');
  });

  it('position === null (Zustand B): no logo slug to resolve, falls back to BarChart3, no crash', () => {
    expect(() => {
      const html = renderToStaticMarkup(
        h(ReviewSidebar, {
          productName: 'eToro',
          publishDate: '2026-02-15',
          decisionBridge: makeDecisionBridge({ position: null }),
          compareLabel: 'Compare all 9 trading platforms',
          affiliateUrl: null,
          market: 'us',
          category: 'trading',
        }),
      );
      expect(html).not.toContain('<img');
      expect(html).toContain('How the field compares');
    }).not.toThrow();
  });

  it('affiliateUrl === null: no Visit button, no affiliate/risk disclosure (nothing to disclose)', () => {
    const html = renderToStaticMarkup(
      h(ReviewSidebar, {
        productName: 'eToro',
        publishDate: '2026-02-15',
        decisionBridge: makeDecisionBridge(),
        compareLabel: 'Compare all 9 trading platforms',
        affiliateUrl: null,
        market: 'us',
        category: 'trading',
      }),
    );
    expect(html).not.toContain('Visit eToro');
    expect(html).not.toContain('reader-supported');
    expect(html).not.toContain('Risk Warning');
    // Compare button still present — it's an internal link, not an affiliate link.
    expect(html).toContain('Compare all 9 trading platforms');
  });

  it('non-trading/forex category (e.g. business-banking): no RiskWarningBox even with affiliateUrl present', () => {
    const html = renderToStaticMarkup(
      h(ReviewSidebar, {
        productName: 'Mercury',
        publishDate: '2026-02-15',
        decisionBridge: makeDecisionBridge({ category: 'business-banking', topic: 'business-banking', topicLabel: 'business banking' }),
        compareLabel: 'Compare all 9 business banking',
        affiliateUrl: 'https://mercury.com/',
        market: 'us',
        category: 'business-banking',
      }),
    );
    expect(html).toContain('reader-supported'); // AffiliateDisclosure still required
    expect(html).not.toContain('Risk Warning'); // but no leverage-risk category
  });

  it('hasLeverageRisk=true forces the risk warning even outside trading/forex (F-04b override)', () => {
    const html = renderToStaticMarkup(
      h(ReviewSidebar, {
        productName: 'Mercury',
        publishDate: '2026-02-15',
        decisionBridge: makeDecisionBridge({ category: 'business-banking', topic: 'business-banking', topicLabel: 'business banking' }),
        compareLabel: 'Compare all 9 business banking',
        affiliateUrl: 'https://mercury.com/',
        market: 'us',
        category: 'business-banking',
        hasLeverageRisk: true,
      }),
    );
    expect(html).toContain('Risk Warning');
  });
});
