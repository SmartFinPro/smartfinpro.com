// __tests__/unit/final-decision.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/final-decision.tsx (T12, review-redesign V2).
//
// Covers: the "Final Decision" heading (never "Recommendation"), the CTA
// Null-Degradation Pflicht (no affiliateUrl leaves only the editorial CTA),
// and — since 2026-07-25 — the removal of the derived "Choose X if / Choose Y
// instead if" cards. Those cards restated `verdict.bestFor` and each
// `alternatives[].whyInstead` verbatim; on the built page that meant `bestFor`
// rendered twice and every `whyInstead` three times. The tests below assert the
// removal, so the duplication cannot creep back in unnoticed.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { FinalDecision } from '@/components/reviews/final-decision';

const FINAL_DECISION_TEXT =
  'eToro is a strong pick for copy trading and low-cost US options trading, backed by no broker-imposed ' +
  'per-contract fees, though regulatory and exchange pass-through fees still apply on every trade. If reliable, ' +
  'fast support matters more to you than copy trading tools, the field has stronger options — but for traders who ' +
  'value the combination eToro offers, it remains a solid, well-priced choice among the nine platforms compared here today.';

describe('FinalDecision', () => {
  it('renders the heading as "Final Decision" — never "Recommendation"', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT }),
    );
    expect(html).toContain('Final Decision');
    expect(html).not.toContain('Recommendation');
  });

  it('renders the finalDecision prose verbatim', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT }),
    );
    expect(html).toContain('eToro is a strong pick for copy trading');
  });

  it('renders NO "Choose … if" cards — the section is heading, prose, CTA and nothing else', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, {
        productName: 'eToro',
        finalDecision: FINAL_DECISION_TEXT,
        compareHref: '/us/trading/best/trading-platforms',
        affiliateUrl: '/go/etoro/',
      }),
    );
    expect(html).not.toContain('Choose eToro if');
    expect(html).not.toContain('instead if');
    // The broken join the cards produced ("Choose Fidelity instead if The
    // category leader (9.6/10)…") is impossible once the prefix is gone.
    expect(html).not.toContain('Choose ');
  });

  it('Null-Degradation Pflicht: no affiliateUrl leaves only the editorial CTA', () => {
    const html = renderToStaticMarkup(
      h(FinalDecision, {
        productName: 'eToro',
        finalDecision: FINAL_DECISION_TEXT,
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
      h(FinalDecision, { productName: 'eToro', finalDecision: FINAL_DECISION_TEXT }),
    );
    expect(html).not.toContain('Compare');
    expect(html).not.toContain('Visit eToro');
  });

  it('renders only the affiliate CTA when the layout withholds compareHref (AlternativesSection carries it)', () => {
    // review-layout-v2.tsx passes compareHref={null} whenever an Alternatives
    // section rendered above, because that section ends with the identical gold
    // button pointing at the identical href.
    const html = renderToStaticMarkup(
      h(FinalDecision, {
        productName: 'eToro',
        finalDecision: FINAL_DECISION_TEXT,
        compareHref: null,
        compareLabel: 'Compare all 9 trading platforms',
        affiliateUrl: '/go/etoro/',
      }),
    );
    expect(html).not.toContain('Compare all 9 trading platforms');
    expect(html).toContain('Visit eToro');
  });
});
