// __tests__/unit/review-layout-v2.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/review-layout-v2.tsx (T13, review-redesign V2
// integration). ReviewLayoutV2 takes all its data as props (no async data
// fetching of its own), so it renders directly under renderToStaticMarkup
// like its child zones.
//
// Covers the plan's T13 acceptance bar:
//   - full fixture: every zone renders, exactly one FAQPage JSON-LD
//     emission, no "@type":"Person" anywhere on the page.
//   - position=null: no reviewRating in the Review JSON-LD (T0d — score and
//     reviewRating disappear together).
//   - missing verdict block: component never throws; the verdict-derived
//     zones (VerdictCard/BestForNotFor) are omitted, everything else
//     (independent of `verdict`) still renders.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ReviewLayoutV2 } from '@/components/reviews/review-layout-v2';
import type { ContentMeta, ContentItem } from '@/lib/mdx';
import type { DecisionBridgeData } from '@/lib/comparison/types';

const FULL_META: ContentMeta = {
  title: 'eToro Review',
  seoTitle: 'eToro Review 2026 — Fees, Markets & Verdict',
  description: 'An independent, data-verified look at eToro US: fees, markets, platform, safety, and support.',
  author: 'SmartFinPro Editorial Team',
  publishDate: '2026-01-10',
  modifiedDate: '2026-07-18',
  category: 'trading',
  market: 'us',
  affiliateUrl: 'https://www.etoro.com/en-us/',
  affiliateDisclosure: true,
  dataVerifiedDate: '2026-07-18',
  reviewLayout: 'v2',
  verdict: {
    positioning: 'A social-first US broker with zero broker contract fees on options trading today.',
    summary:
      "eToro's US offering ranks 8th of the 9 trading platforms we track, at 8.3/10 in a field so tight " +
      'that 1.6 points separate first from last. It stands out for copy trading and charges no commission ' +
      'or broker-imposed per-contract fee on US options — though regulatory and exchange pass-through fees ' +
      'still apply, and run comparable to what peers charge outright. A $50 minimum deposit and no futures ' +
      'trading narrow its appeal. Support is its weakest dimension; platforms like Fidelity score materially ' +
      'higher there today.',
    bestFor: ['Copy-trading and social investors', 'US options traders avoiding broker contract fees'],
    notFor: ['Futures traders — not offered on the US platform'],
    topStrengths: ['No broker-imposed per-contract fee on US options', 'Copy trading with a $100,000 practice account'],
    mainLimitation: 'Customer support scores lowest in the field (7.8/10 against a field best of 9.6).',
    bestAlternative: { name: 'Fidelity', slug: 'fidelity-review', reason: 'the category leader at 9.6/10' },
  },
  essentialFacts: [
    { label: 'Options contract fee', value: '$0 broker-imposed', asOf: '2026-07-18', sourceHref: 'https://www.etoro.com/en-us/trading/fees/' },
    { label: 'Stock & ETF commission', value: '$0', asOf: '2026-07-18', sourceHref: 'https://www.etoro.com/en-us/trading/fees/' },
    { label: 'Minimum first deposit', value: '$50', asOf: '2026-07-18', sourceHref: 'https://www.etoro.com/en-us/customer-service/deposit-faq/' },
    { label: 'Practice account', value: '$100,000 virtual', asOf: '2026-07-18', sourceHref: 'https://www.etoro.com/en-us/trading/demo-account/' },
  ],
  alternatives: [
    { slug: 'fidelity-review', name: 'Fidelity', whyInstead: 'the category leader with the field’s best support score' },
    { slug: 'webull-review', name: 'Webull', whyInstead: 'also charges no broker fee on US equity options' },
  ],
  sectionVerdicts: {
    fees: 'No commission or broker-imposed contract fees on US options and stocks; pass-throughs apply.',
    support: "Support is the field's weak spot for eToro — 7.8/10 against a field best of 9.6 today.",
  },
  finalDecision:
    'eToro earns its place for a specific trader: one who values copy trading, wants a large practice ' +
    'account before committing real money, and trades US options without broker contract fees. Within ' +
    'this field it is a mid-tier all-rounder, not a category leader — seven platforms score higher ' +
    'overall, and its support rating is the group’s weakest. Choose eToro if social features and options ' +
    'pricing drive your decision and you accept average support today across the board.',
  faq: [
    { question: 'Does eToro charge a per-contract fee on US options?', answer: 'No broker-imposed fee — only regulatory and exchange pass-through fees apply, itemized on the official fee schedule.' },
    { question: 'What is the minimum deposit for eToro US?', answer: 'The standard minimum first deposit is $50 for most funding methods; wire transfers start at $500.' },
  ],
  updateLog: [{ date: '2026-07-18', change: 'Options-fee claim corrected — no exclusivity; pass-through fees itemized.' }],
};

const POSITION: NonNullable<DecisionBridgeData['position']> = {
  rank: 8,
  slug: 'etoro',
  name: 'eToro',
  score: 8.3,
  subScores: { fees: 8.8, features: 8.0, ux: 8.4, support: 7.8 },
  confidence: 'medium',
  dataVerifiedAt: '2026-07-03',
  isTopPick: false,
};

const DECISION_BRIDGE: DecisionBridgeData = {
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
  position: POSITION,
};

const SIBLING: ContentItem = {
  slug: 'webull-review',
  meta: {
    title: 'Webull Review',
    description: 'Commission-free US equity and options trading with advanced charting tools.',
    author: 'SmartFinPro Editorial Team',
    publishDate: '2026-01-05',
    modifiedDate: '2026-06-01',
    category: 'trading',
    market: 'us',
    affiliateDisclosure: true,
  },
  content: '',
  readingTime: { text: '5 min read', minutes: 5, time: 300000, words: 1200 },
};

const CROSS_CATEGORY: ContentItem = {
  slug: 'mercury-review',
  meta: {
    title: 'Mercury Review',
    description: 'Business banking built for startups — no monthly fees, fast account opening.',
    author: 'SmartFinPro Editorial Team',
    publishDate: '2026-01-05',
    modifiedDate: '2026-06-01',
    category: 'business-banking',
    market: 'us',
    affiliateDisclosure: true,
  },
  content: '',
  readingTime: { text: '6 min read', minutes: 6, time: 360000, words: 1400 },
};

describe('ReviewLayoutV2', () => {
  it('full fixture: renders every zone, exactly one FAQPage emission, and no Person schema anywhere', () => {
    const html = renderToStaticMarkup(
      h(ReviewLayoutV2, {
        meta: FULL_META,
        market: 'us',
        category: 'trading',
        slug: 'etoro-review',
        decisionBridge: DECISION_BRIDGE,
        siblingReviews: [SIBLING],
        crossCategoryContent: [CROSS_CATEGORY],
        bestAlternativeHref: '/us/trading/fidelity-review',
      }),
    );

    // Header
    expect(html).toContain('eToro Review');
    // CTA-Zone 1
    expect(html).toContain('Compare all 9 trading platforms');
    expect(html).toContain('Visit eToro');
    // Verdict zone (+ score breakdown)
    expect(html).toContain('Our Verdict');
    expect(html).toContain('Score Breakdown');
    // BestForNotFor
    expect(html).toContain('Best for');
    expect(html).toContain('Not for');
    // Essential Facts
    expect(html).toContain('Options contract fee');
    // Section nav — all 7 anchors
    expect(html).toContain('Markets &amp; Tools');
    expect(html).toContain('Safety &amp; Regulation');
    // MDX body fallback (no mdxSource passed in this fixture)
    expect(html).toContain('Review content is being prepared.');
    // Alternatives
    expect(html).toContain('Alternatives to eToro');
    // Final Decision
    expect(html).toContain('Final Decision');
    expect(html).not.toContain('Recommendation');
    // Methodology
    expect(html).toContain('Methodology');
    // FAQ
    expect(html).toContain('Does eToro charge a per-contract fee on US options?');
    // Related Topics / siblings
    expect(html).toContain('Related Topics');
    expect(html).toContain('More Trading Platforms Reviews');
    expect(html).toContain('Webull Review');

    // Exactly one FAQPage JSON-LD emission (script above + FAQSection includeSchema=false)
    const faqPageCount = (html.match(/"@type":"FAQPage"/g) ?? []).length;
    expect(faqPageCount).toBe(1);

    // No fabricated Person schema anywhere on the page
    expect(html).not.toContain('"@type":"Person"');

    // Review + BreadcrumbList schema present
    expect(html).toContain('"@type":"Review"');
    expect(html).toContain('"@type":"BreadcrumbList"');

    // No V1 star-rating markup or reviewCount display
    expect(html).not.toContain('★');
  });

  it('position === null: no reviewRating in the Review JSON-LD, but the verdict prose still renders', () => {
    const html = renderToStaticMarkup(
      h(ReviewLayoutV2, {
        meta: FULL_META,
        market: 'us',
        category: 'trading',
        slug: 'etoro-review',
        decisionBridge: null,
      }),
    );
    expect(html).not.toContain('reviewRating');
    expect(html).toContain('Our Verdict');
    expect(html).not.toContain('Score Breakdown');
  });

  it('missing verdict block: never throws; verdict-derived zones are omitted, independent zones still render', () => {
    const { verdict: _verdict, essentialFacts: _facts, alternatives: _alts, finalDecision: _fd, faq: _faq, ...withoutVerdict } = FULL_META;
    void _verdict;
    void _facts;
    void _alts;
    void _fd;
    void _faq;

    expect(() => {
      const html = renderToStaticMarkup(
        h(ReviewLayoutV2, {
          meta: withoutVerdict as ContentMeta,
          market: 'us',
          category: 'trading',
          slug: 'etoro-review',
          decisionBridge: null,
        }),
      );
      // Verdict-derived zones omitted.
      expect(html).not.toContain('Our Verdict');
      expect(html).not.toContain('Best for');
      expect(html).not.toContain('Alternatives to eToro');
      expect(html).not.toContain('Final Decision');
      // Independent zones still render.
      expect(html).toContain('Methodology');
      expect(html).toContain('Markets &amp; Tools');
    }).not.toThrow();
  });
});
