// __tests__/unit/cockpit-analytics-display.test.ts
// Display invariant of the Cockpit Analytics widget: every CTA mode the
// action counts (offer, visit, review, unavailable, cockpit — since 781ed4e)
// must be visible in the KPI subtext and the Market×Topic split column, and
// the rendered split must add up to the rendered headline. The fixture uses
// non-zero unavailable/cockpit values on purpose — live prod data is all-zero
// there, which would prove the invariant only trivially.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CockpitAnalytics } from '@/components/dashboard/cockpit-analytics';
import type { CockpitAnalyticsData } from '@/lib/actions/cockpit-analytics';

const SPLIT = { offer: 7, visit: 5, review: 3, unavailable: 4, cockpit: 2 };
const TOTAL = Object.values(SPLIT).reduce((a, b) => a + b, 0); // 21

const fixture: CockpitAnalyticsData = {
  timeRange: '7d',
  truncated: false,
  kpis: {
    pageviews: 100,
    cockpitViews: 40,
    ctaClicks: TOTAL,
    overallCtr: 21.0,
    eventCount: 300,
    prevEventCount: 250,
    volumeDeltaPct: 20,
    zeroVolume: false,
    expectedTotal: 1,
    reportingCount: 1,
    silentCount: 0,
    lowTrafficCount: 0,
    noTrafficCount: 0,
  },
  byTopic: [
    {
      pagePath: '/us/trading/best/trading-platforms',
      market: 'us',
      category: 'trading',
      topic: 'trading-platforms',
      pageviews: 100,
      cockpitViews: 40,
      impressions: 200,
      clicks: TOTAL,
      ctr: 21.0,
      offerClicks: SPLIT.offer,
      visitClicks: SPLIT.visit,
      reviewClicks: SPLIT.review,
      unavailableClicks: SPLIT.unavailable,
      cockpitClicks: SPLIT.cockpit,
      mobileClicks: 12,
      desktopClicks: 9,
    },
  ],
  bySurface: [],
  rates: {
    winnerImpressionToClick: null,
    cardImpressionToClick: null,
    matcherCompleteToClick: null,
    compareUsageToClick: null,
    top3Ctr: null,
    restCtr: null,
  },
  ctaSplit: SPLIT,
  destinationSplit: { affiliate: TOTAL },
  deviceSplit: [],
  health: [
    {
      pagePath: '/us/trading/best/trading-platforms',
      market: 'us',
      isNewMarket: false,
      pageviews: 100,
      events: 300,
      clicks: TOTAL,
      status: 'reporting',
    },
  ],
};

function render(): string {
  return renderToStaticMarkup(
    createElement(CockpitAnalytics, { initialData: fixture, initialError: null }),
  );
}

describe('CockpitAnalytics — CTA split display covers all 5 modes', () => {
  it('renders every counted mode in the KPI subtext, incl. non-zero unavailable/cockpit', () => {
    const html = render();
    const m = html.match(
      /offer (\d+) · visit (\d+) · review (\d+) · unavailable (\d+) · cockpit (\d+)/,
    );
    expect(m).not.toBeNull();
    const [, offer, visit, review, unavailable, cockpit] = m!.map(Number);
    expect(unavailable).toBe(SPLIT.unavailable);
    expect(cockpit).toBe(SPLIT.cockpit);
    expect(unavailable).toBeGreaterThan(0);
    expect(cockpit).toBeGreaterThan(0);
    expect(offer + visit + review + unavailable + cockpit).toBe(TOTAL);
  });

  it('rendered subtext split sums to the rendered headline (display-level, not fixture-level)', () => {
    const html = render();
    // StatCard renders the label <p> first, the tabular-nums value <p> next.
    const headline = html.match(/CTA clicks<\/p>[\s\S]*?tabular-nums">([\d,]+)</);
    expect(headline).not.toBeNull();
    const headlineValue = Number(headline![1].replace(/,/g, ''));
    const split = html.match(
      /offer (\d+) · visit (\d+) · review (\d+) · unavailable (\d+) · cockpit (\d+)/,
    )!;
    const splitSum = split.slice(1, 6).map(Number).reduce((a, b) => a + b, 0);
    expect(splitSum).toBe(headlineValue);
  });

  it('Market×Topic split column shows all 5 modes and sums to the row clicks', () => {
    const html = render();
    expect(html).toContain('Offer / Visit / Review / Unavail / Cockpit');
    expect(html).toContain(
      `${SPLIT.offer} / ${SPLIT.visit} / ${SPLIT.review} / ${SPLIT.unavailable} / ${SPLIT.cockpit}`,
    );
    expect(
      SPLIT.offer + SPLIT.visit + SPLIT.review + SPLIT.unavailable + SPLIT.cockpit,
    ).toBe(fixture.byTopic[0].clicks);
  });
});
