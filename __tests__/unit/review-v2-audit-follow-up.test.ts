import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ReviewLayoutV2 } from '@/components/reviews/review-layout-v2';
import type { DecisionBridgeData } from '@/lib/comparison/types';
import type { ContentMeta } from '@/lib/mdx';

const META: ContentMeta = {
  title: 'eToro Review',
  seoTitle: 'eToro Review 2026 — Fees, Markets & Verdict',
  description: 'An independent, data-verified look at eToro US.',
  author: 'SmartFinPro Editorial Team',
  publishDate: '2026-01-10',
  modifiedDate: '2026-07-17',
  dataVerifiedDate: '2026-07-18',
  category: 'trading',
  market: 'us',
  affiliateUrl: 'https://www.etoro.com/en-us/',
  affiliateDisclosure: true,
  reviewLayout: 'v2',
  verdict: {
    positioning: 'A social-first US broker for copy and options traders.',
    summary:
      'eToro is a mid-field choice for copy trading and low-cost US options, with weaker support than the field leaders today.',
    bestFor: ['Copy traders', 'US options traders'],
    notFor: ['Traders who need futures'],
    topStrengths: ['Copy trading'],
    mainLimitation: 'Support trails the field leaders.',
  },
  essentialFacts: [
    {
      label: 'Options contract fee',
      value: '$0 broker-imposed',
      asOf: '2026-07-18',
      sourceHref: 'https://www.etoro.com/en-us/trading/fees/',
    },
  ],
};

const BRIDGE: DecisionBridgeData = {
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
    subScores: { fees: 8.8, features: 8, ux: 8.4, support: 7.8 },
    confidence: 'medium',
    dataVerifiedAt: '2026-07-03',
    isTopPick: false,
  },
};

function render(meta: ContentMeta = META): string {
  return renderToStaticMarkup(
    h(ReviewLayoutV2, {
      meta,
      market: 'us',
      category: 'trading',
      slug: 'etoro-review',
      decisionBridge: BRIDGE,
    }),
  );
}

describe('Review V2 audit follow-up', () => {
  it('renders one Market Check for desktop and a separate compact mobile action surface', () => {
    const html = render();

    expect((html.match(/data-testid="decision-bridge"/g) ?? []).length).toBe(1);
    expect((html.match(/data-review-mobile-actions/g) ?? []).length).toBe(1);
    expect(html).toContain('Compare all 9 trading platforms');
    expect(html).toContain('Visit eToro');
  });

  it('places the compact mobile actions before the field-position visualization', () => {
    const html = render();
    const opening = html.slice(html.indexOf('id="verdict"'));
    const actions = opening.indexOf('data-review-mobile-actions');
    const standing = opening.indexOf('id="score-in-field-heading"');

    expect(actions).toBeGreaterThan(-1);
    expect(standing).toBeGreaterThan(actions);
  });

  it('keeps the primary mobile actions when a bridge resolves but the verdict block is absent', () => {
    const { verdict: _verdict, ...withoutVerdict } = META;
    void _verdict;
    const html = render(withoutVerdict as ContentMeta);

    expect((html.match(/data-review-mobile-actions/g) ?? []).length).toBe(1);
    expect(html).toContain('Compare all 9 trading platforms');
  });

  it('reserves the sticky chrome offset at the bottom of the desktop rail item', () => {
    expect(render()).toContain('lg:mb-[124px]');
  });
});
