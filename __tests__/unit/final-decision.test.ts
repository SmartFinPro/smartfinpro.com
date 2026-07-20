// __tests__/unit/final-decision.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/final-decision.tsx (T12, review-redesign V2).
//
// Covers: the "Final Decision" heading (never "Recommendation"), the
// derived "Choose X if / Choose Y instead if" pairs built from
// verdict.bestFor / alternatives[].whyInstead (see the file header for why),
// and the plan's explicit Pflicht — no affiliateUrl leaves only the
// editorial CTA.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { FinalDecision } from '@/components/reviews/final-decision';
import type { AlternativeEntry } from '@/lib/reviews/verdict-frontmatter';

const FINAL_DECISION_TEXT =
  'eToro is a strong pick for copy trading and low-cost US options trading, backed by no broker-imposed ' +
  'per-contract fees, though regulatory and exchange pass-through fees still apply on every trade. If reliable, ' +
  'fast support matters more to you than copy trading tools, the field has stronger options — but for traders who ' +
  'value the combination eToro offers, it remains a solid, well-priced choice among the nine platforms compared here today.';

const BEST_FOR = ['Copy traders', 'Options traders watching contract fees'];

const ALTERNATIVES: AlternativeEntry[] = [
  { slug: 'fidelity-review', name: 'Fidelity', whyInstead: 'you want the field leader on overall score and support' },
];

describe('FinalDecision', () => {
  it('renders the heading as "Final Decision" — never "Recommendation"', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT, bestFor: BEST_FOR, alternatives: ALTERNATIVES }),
    );
    expect(html).toContain('Final Decision');
    expect(html).not.toContain('Recommendation');
  });

  it('renders the finalDecision prose verbatim', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT, bestFor: BEST_FOR, alternatives: ALTERNATIVES }),
    );
    expect(html).toContain('eToro is a strong pick for copy trading');
  });

  it('derives "Choose {productName} if" from verdict.bestFor and "Choose {name} instead if" from alternatives[].whyInstead', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT, bestFor: BEST_FOR, alternatives: ALTERNATIVES }),
    );
    expect(html).toContain('Choose eToro if');
    expect(html).toContain('Copy traders');
    expect(html).toContain('Choose Fidelity instead if');
    expect(html).toContain('you want the field leader on overall score and support');
  });

  it('Null-Degradation Pflicht: no affiliateUrl leaves only the editorial CTA', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, {
        productName: 'eToro',
        finalDecision: FINAL_DECISION_TEXT,
        bestFor: BEST_FOR,
        alternatives: ALTERNATIVES,
        compareHref: '/us/trading/best/trading-platforms',
        compareLabel: 'Compare all 9 trading platforms',
      }),
    );
    expect(html).toContain('Compare all 9 trading platforms');
    expect(html).not.toContain('Visit eToro');
    expect(html).not.toContain('target="_blank"');
  });

  it('renders both CTAs when affiliateUrl is present, secondary labelled "Visit {productName}"', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, {
        productName: 'eToro',
        finalDecision: FINAL_DECISION_TEXT,
        bestFor: BEST_FOR,
        alternatives: ALTERNATIVES,
        compareHref: '/us/trading/best/trading-platforms',
        affiliateUrl: '/go/etoro/',
      }),
    );
    expect(html).toContain('href="/us/trading/best/trading-platforms"');
    expect(html).toContain('href="/go/etoro/"');
    expect(html).toContain('Visit eToro');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });

  it('renders no CTA row at all when both compareHref and affiliateUrl are absent', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT, bestFor: BEST_FOR, alternatives: ALTERNATIVES }),
    );
    expect(html).not.toContain('Compare');
    expect(html).not.toContain('Visit eToro');
  });

  it('caps the alternative if/then cards at 3', () => {
    const four: AlternativeEntry[] = [
      ...ALTERNATIVES,
      { slug: 'schwab-review', name: 'Charles Schwab', whyInstead: 'you want a large branch network' },
      { slug: 'ibkr-review', name: 'Interactive Brokers', whyInstead: 'you want the widest global market access' },
      { slug: 'merrill-edge-review', name: 'Merrill Edge', whyInstead: 'you are already a Bank of America client' },
    ];
    const html = renderToStaticMarkup(
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT, bestFor: BEST_FOR, alternatives: four }),
    );
    expect(html).toContain('Interactive Brokers');
    expect(html).not.toContain('Merrill Edge');
  });

  it('omits the if/then grid entirely when both bestFor and alternatives are empty', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT, bestFor: [], alternatives: [] }),
    );
    expect(html).not.toContain('Choose eToro if');
    expect(html).not.toContain('instead if');
  });
});
