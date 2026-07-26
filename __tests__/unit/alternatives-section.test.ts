// __tests__/unit/alternatives-section.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/alternatives-section.tsx (T12, review-redesign V2).
//
// Covers: reviewHref-Muster construction, the plan's explicit Pflicht —
// zero field-matches degrades to score-less cards, never a crash or a
// fabricated number — the "Tabelle 3 von 3" comparison-table caps (max 3
// products x max 6 criteria) and its null-render when no alternative has
// `facts`, and CTA gating (only renders when cockpitHref + fieldCount +
// topicLabel are all present).

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AlternativesSection } from '@/components/reviews/alternatives-section';
import type { AlternativeEntry } from '@/lib/reviews/verdict-frontmatter';
import type { DecisionBridgeFieldRow } from '@/lib/comparison/types';

const ALTERNATIVES: AlternativeEntry[] = [
  {
    slug: 'fidelity-review',
    name: 'Fidelity',
    whyInstead: 'you want the field leader on overall score and support response times',
    facts: [
      { label: 'Options contract fee', value: '$0' },
      { label: 'Account minimum', value: '$0' },
    ],
  },
  {
    slug: 'charles-schwab-review',
    name: 'Charles Schwab',
    whyInstead: 'you want an established all-in-one brokerage with a large branch network',
    facts: [
      { label: 'Options contract fee', value: '$0.65' },
      { label: 'Account minimum', value: '$0' },
    ],
  },
];

const FIELD: DecisionBridgeFieldRow[] = [
  { rank: 1, name: 'Fidelity', score: 9.6, reviewHref: '/us/trading/fidelity-review', isYou: false },
  { rank: 2, name: 'Charles Schwab', score: 9.3, reviewHref: '/us/trading/charles-schwab-review', isYou: false },
  { rank: 8, name: 'eToro', score: 8.3, reviewHref: null, isYou: true },
];

describe('AlternativesSection', () => {
  it('renders null when there are no alternatives', () => {
    expect(
      renderToStaticMarkup(h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: [] })),
    ).toBe('');
  });

  it('builds each card review link via the reviewHref-Muster (/market/category/slug)', () => {
    const html = renderToStaticMarkup(
      h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: ALTERNATIVES }),
    );
    expect(html).toContain('href="/us/trading/fidelity-review"');
    expect(html).toContain('href="/us/trading/charles-schwab-review"');
    expect(html).toContain('Fidelity');
    expect(html).toContain('Charles Schwab');
  });

  it('shows a score badge for a card whose name matches a field row (case-insensitive)', () => {
    const html = renderToStaticMarkup(
      h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: ALTERNATIVES, field: FIELD }),
    );
    expect(html).toContain('#1');
    expect(html).toContain('9.6');
    expect(html).toContain('#2');
    expect(html).toContain('9.3');
  });

  it('Null-Degradation Pflicht: zero field-matches renders cards WITHOUT a score badge — no crash, no fabricated score', () => {
    const unmatchedField: DecisionBridgeFieldRow[] = [
      { rank: 1, name: 'Some Other Broker', score: 9.9, reviewHref: null, isYou: false },
    ];
    const html = renderToStaticMarkup(
      h(AlternativesSection, {
        productName: 'eToro',
        market: 'us',
        category: 'trading',
        alternatives: ALTERNATIVES,
        field: unmatchedField,
      }),
    );
    expect(html).toContain('Fidelity');
    expect(html).toContain('Charles Schwab');
    expect(html).not.toContain('9.9');
    expect(html).not.toContain('#1');
  });

  it('degrades the same way when `field` is entirely absent', () => {
    const html = renderToStaticMarkup(
      h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: ALTERNATIVES }),
    );
    expect(html).toContain('Fidelity');
    expect(html).not.toContain('#1');
  });

  it('renders the comparison table (max 3 products, hairline rows, first column left / numbers right) when alternatives carry facts', () => {
    const html = renderToStaticMarkup(
      h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: ALTERNATIVES }),
    );
    expect(html).toContain('<table');
    expect(html).toContain('Options contract fee');
    expect(html).toContain('$0.65');
  });

  it('renders no comparison table when no alternative has a facts array', () => {
    const withoutFacts: AlternativeEntry[] = ALTERNATIVES.map(({ facts: _facts, ...rest }) => rest);
    const html = renderToStaticMarkup(
      h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: withoutFacts }),
    );
    expect(html).not.toContain('<table');
  });

  it('renders the "Which should you choose?" if/then line reusing whyInstead verbatim', () => {
    const html = renderToStaticMarkup(
      h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: ALTERNATIVES }),
    );
    expect(html).toContain('Which should you choose?');
    expect(html).toContain('Choose Fidelity instead if');
    expect(html).toContain('you want the field leader on overall score');
  });

  it('renders the Gold compare CTA only when cockpitHref, fieldCount, and topicLabel are all present', () => {
    const withCta = renderToStaticMarkup(
      h(AlternativesSection, {
        productName: 'eToro',
        market: 'us',
        category: 'trading',
        alternatives: ALTERNATIVES,
        cockpitHref: '/us/trading/best/trading-platforms',
        fieldCount: 9,
        topicLabel: 'trading platforms',
      }),
    );
    expect(withCta).toContain('Compare all 9 trading platforms');
    expect(withCta).toContain('href="/us/trading/best/trading-platforms"');

    const withoutCta = renderToStaticMarkup(
      h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: ALTERNATIVES }),
    );
    expect(withoutCta).not.toContain('Compare all');
  });

  it('caps cards at 3 even when more alternatives are passed', () => {
    const four: AlternativeEntry[] = [
      ...ALTERNATIVES,
      { slug: 'ibkr-review', name: 'Interactive Brokers', whyInstead: 'you want the widest global market access' },
      { slug: 'merrill-edge-review', name: 'Merrill Edge', whyInstead: 'you are already a Bank of America client' },
    ];
    const html = renderToStaticMarkup(
      h(AlternativesSection, { productName: 'eToro', market: 'us', category: 'trading', alternatives: four }),
    );
    expect(html).toContain('Interactive Brokers');
    expect(html).not.toContain('Merrill Edge');
  });
});
