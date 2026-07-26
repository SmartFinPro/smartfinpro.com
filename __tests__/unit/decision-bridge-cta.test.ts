// __tests__/unit/decision-bridge-cta.test.ts
// Render-to-string tests (react-dom/server, no jsdom) for the `showCta` prop
// added to components/marketing/decision-bridge.tsx (2026-07-18 sidebar
// rework, task 4): components/reviews/review-sidebar.tsx renders its own
// Compare button next to <DecisionBridge>, so the widget's own internal
// CtaLink must be suppressible to avoid doubling the same link in one rail.
//
// Covers: default (no prop / showCta=true) is byte-identical to the
// pre-existing behaviour for both StateA (position present) and StateB
// (position null); showCta=false removes ONLY the CtaLink, nothing else.

import { describe, it, expect } from 'vitest';
import { createElement as h, type Attributes } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DecisionBridge, DecisionBridgeProvider, type DecisionBridgeProps } from '@/components/marketing/decision-bridge';
import type { DecisionBridgeData } from '@/lib/comparison/types';

const STATE_A_DATA: DecisionBridgeData = {
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
};

const STATE_B_DATA: DecisionBridgeData = { ...STATE_A_DATA, position: null };

// The exact text CtaLink renders (components/marketing/decision-bridge.tsx):
// `Compare all {fieldCount} {topicNoun} →` — topicNoun here equals topicLabel
// verbatim since STATE_A_DATA.topicLabel has no "Best " prefix to strip.
const CTA_LINK_TEXT = 'Compare all 9 trading platforms';

function renderBridge(data: DecisionBridgeData, showCta?: boolean) {
  const bridgeProps: DecisionBridgeProps = showCta === undefined ? {} : { showCta };
  // `DecisionBridgeProps` is all-optional, which trips a known TS
  // `createElement` overload-resolution quirk ("no properties in common
  // with Attributes") unrelated to actual type-safety — the props object is
  // still fully typed via the `DecisionBridgeProps` annotation above.
  return renderToStaticMarkup(
    h(DecisionBridgeProvider, { data, children: h(DecisionBridge, bridgeProps as Attributes & DecisionBridgeProps) }),
  );
}

describe('DecisionBridge showCta prop', () => {
  it('StateA, no prop passed: CtaLink renders (default true, V1/MDX callers unaffected)', () => {
    const html = renderBridge(STATE_A_DATA);
    expect(html).toContain(CTA_LINK_TEXT);
    expect(html).toContain('How eToro compares');
  });

  it('StateA, showCta={true} explicit: CtaLink renders', () => {
    const html = renderBridge(STATE_A_DATA, true);
    expect(html).toContain(CTA_LINK_TEXT);
  });

  it('StateA, showCta={false}: CtaLink is gone, everything else (strip table, verdict, footer) still renders', () => {
    const html = renderBridge(STATE_A_DATA, false);
    expect(html).not.toContain(CTA_LINK_TEXT);
    // Everything else untouched:
    expect(html).toContain('How eToro compares');
    expect(html).toContain('Fidelity'); // ranking strip
    expect(html).toContain('Verdict');
    expect(html).toContain('official sources');
  });

  it('StateB (position null), no prop: CtaLink renders', () => {
    const html = renderBridge(STATE_B_DATA);
    expect(html).toContain(CTA_LINK_TEXT);
    expect(html).toContain('How the field compares');
  });

  it('StateB (position null), showCta={false}: CtaLink is gone, field-at-a-glance cells still render', () => {
    const html = renderBridge(STATE_B_DATA, false);
    expect(html).not.toContain(CTA_LINK_TEXT);
    expect(html).toContain('How the field compares');
    expect(html).toContain('Leader');
    expect(html).toContain('Spread');
  });
});
