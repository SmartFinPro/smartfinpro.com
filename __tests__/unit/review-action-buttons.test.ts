import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ReviewActionButtons } from '@/components/reviews/review-action-buttons';

const BASE_PROPS = {
  productName: 'eToro',
  compareHref: '/us/trading/best/trading-platforms',
  compareLabel: 'Compare all 9 trading platforms',
  market: 'us',
  category: 'trading',
  layoutVariant: 'v2_mobile',
  placement: 'verdict',
} as const;

describe('ReviewActionButtons', () => {
  it('renders the internal comparison and tracked outbound action as distinct links', () => {
    const html = renderToStaticMarkup(
      h(ReviewActionButtons, {
        ...BASE_PROPS,
        affiliateUrl: 'https://www.etoro.com/en-us/',
      }),
    );

    expect(html).toContain('href="/us/trading/best/trading-platforms"');
    expect(html).toContain('Compare all 9 trading platforms');
    expect(html).toContain('href="https://www.etoro.com/en-us/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener sponsored"');
    expect(html).toContain('Visit eToro');
  });

  it('keeps the internal comparison action when no affiliate URL is available', () => {
    const html = renderToStaticMarkup(
      h(ReviewActionButtons, {
        ...BASE_PROPS,
        affiliateUrl: null,
      }),
    );

    expect(html).toContain('Compare all 9 trading platforms');
    expect(html).not.toContain('Visit eToro');
    expect(html).not.toContain('target="_blank"');
  });
});
