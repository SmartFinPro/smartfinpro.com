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

/** The Final Decision <section> alone — the desktop rail is DOM-last and would
 *  otherwise be swept into any slice that runs to the end of the document. */
function finalDecisionSection(html: string): string {
  const start = html.indexOf('id="final-decision-heading"');
  if (start === -1) return '';
  const end = html.indexOf('</section>', start);
  return html.slice(start, end === -1 ? undefined : end);
}

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
      }),
    );

    // Header
    expect(html).toContain('eToro Review');
    // The full Sidebar is desktop-only. Mobile gets the compact action surface
    // inside VerdictCard, so Market Check appears exactly once and is never
    // repeated immediately after ScoreInField.
    expect(html).toContain('Expert Review');
    expect(html).toContain('Data verified');
    expect(html).toContain('/images/brokers/etoro-seeklogo.svg'); // real wordmark, fs-checked
    const decisionBridgeTestIdCount = (html.match(/data-testid="decision-bridge"/g) ?? []).length;
    expect(decisionBridgeTestIdCount).toBe(1);
    expect((html.match(/data-review-mobile-actions/g) ?? []).length).toBe(1);
    // Sidebar's own Compare/Visit button pair (the former "CTA-Zone 1" — a
    // duplicate pair rendered between ReviewHeader and #verdict — was
    // removed; the sidebar is now the primary CTA surface).
    expect(html).toContain('Compare all 9 trading platforms');
    expect(html).toContain('Visit eToro');
    // Verdict zone (+ score breakdown). Asserted by the summary text — the
    // "Our Verdict" label was removed.
    expect(html).toContain(FULL_META.verdict!.summary.slice(0, 40));
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

  // ── Structural contracts from the 2026-07-25 design-audit fix ────────────
  // These four were regressions waiting to happen: each is a single className
  // or a single JSX position, invisible in a diff, and each one silently
  // undoes a measured fix. See the plan file
  // bitte-den-fix-planen-gleaming-elephant.md.

  it('#verdict wraps the WHOLE opening block, so the H1 sits INSIDE it', () => {
    // On the card alone the anchor sat below the H1: opening the page at
    // #verdict left the H1 entirely above the viewport, so the reader arrived
    // at a score with no idea which product it belonged to.
    const html = renderToStaticMarkup(
      h(ReviewLayoutV2, {
        meta: FULL_META,
        market: 'us',
        category: 'trading',
        slug: 'etoro-review',
        decisionBridge: DECISION_BRIDGE,
      }),
    );
    const anchorIdx = html.indexOf('id="verdict"');
    const h1Idx = html.indexOf('<h1');
    expect(anchorIdx).toBeGreaterThan(-1);
    expect(h1Idx).toBeGreaterThan(anchorIdx);
  });

  it('opening block reads score → who it is for → CTA, without a mobile Market Check or a ScoreInField repeat', () => {
    const html = renderToStaticMarkup(
      h(ReviewLayoutV2, {
        meta: FULL_META,
        market: 'us',
        category: 'trading',
        slug: 'etoro-review',
        decisionBridge: DECISION_BRIDGE,
      }),
    );
    // Scoped to the opening block. The JSON-LD scripts above it repeat the
    // verdict prose verbatim, so an unscoped indexOf finds the schema copy and
    // reports an order that has nothing to do with the layout.
    const region = html.slice(html.indexOf('id="verdict"'));
    const bestForIdx = region.indexOf('>Best for<');
    const mobileActionsIdx = region.indexOf('data-review-mobile-actions');
    expect(bestForIdx).toBeGreaterThan(-1);
    expect(mobileActionsIdx).toBeGreaterThan(bestForIdx);
    // ScoreInField was removed from this layout (operator, 2026-07-25): the
    // sidebar's "How X compares" table already carries the same audited
    // position/field numbers on this page, so the card read as a repeat.
    expect(region).not.toContain('id="score-in-field-heading"');
    expect((region.match(/data-testid="decision-bridge"/g) ?? []).length).toBe(1);
  });

  it('verdict card leads with Best for / Not for and closes with the summary prose', () => {
    const html = renderToStaticMarkup(
      h(ReviewLayoutV2, {
        meta: FULL_META,
        market: 'us',
        category: 'trading',
        slug: 'etoro-review',
        decisionBridge: DECISION_BRIDGE,
      }),
    );
    const region = html.slice(html.indexOf('id="verdict"'));
    const bestForIdx = region.indexOf('>Best for<');
    const limitationIdx = region.indexOf('>Main limitation<');
    // A fragment WITHOUT the leading "eToro's": React escapes the apostrophe to
    // &#x27; in the rendered card, while the JSON-LD (dangerouslySetInnerHTML)
    // keeps it raw. Matching on the raw form finds only the schema copy — which
    // sits above this region and would make the assertion untestable here.
    const summaryIdx = region.indexOf('ranks 8th of the 9 trading platforms');
    expect(bestForIdx).toBeGreaterThan(-1);
    expect(summaryIdx).toBeGreaterThan(-1);
    expect(limitationIdx).toBeGreaterThan(bestForIdx);
    expect(summaryIdx).toBeGreaterThan(limitationIdx);
  });

  it('grid places all three items explicitly and never hands the rail to auto-placement', () => {
    // Without explicit placement the rail — last in the JSX — lands in a third
    // row beneath the downstream block instead of beside the article, and the
    // sticky behaviour that the two-row split exists to bound comes back.
    const html = renderToStaticMarkup(
      h(ReviewLayoutV2, {
        meta: FULL_META,
        market: 'us',
        category: 'trading',
        slug: 'etoro-review',
        decisionBridge: DECISION_BRIDGE,
      }),
    );
    expect(html).toContain('lg:grid-cols-[minmax(0,760px)_300px]');
    // gap-x only: a plain `gap` would insert dead vertical space between the
    // two rows that was never there before.
    expect(html).toContain('lg:gap-x-8');
    expect(html).not.toMatch(/class="[^"]*\blg:gap-14\b/);
    expect(html).toContain('lg:col-start-1 lg:row-start-1');
    expect(html).toContain('lg:col-start-1 lg:row-start-2');
    expect(html).toContain('lg:col-start-2 lg:row-start-1');
  });

  it('renders the compare CTA once: Alternatives carries it, Final Decision does not', () => {
    // Both used the same gold button pointing at the same cockpit href and
    // rendered ~5px apart.
    const html = renderToStaticMarkup(
      h(ReviewLayoutV2, {
        meta: FULL_META,
        market: 'us',
        category: 'trading',
        slug: 'etoro-review',
        decisionBridge: DECISION_BRIDGE,
      }),
    );
    // Scoped to the Final Decision <section> itself. Slicing to the end of the
    // document would sweep in the desktop rail, which is DOM-last and carries
    // its own (legitimate) compare button.
    expect(html).toContain('Alternatives to eToro');
    expect(finalDecisionSection(html)).not.toContain('Compare all 9 trading platforms');
    expect(finalDecisionSection(html)).toContain('Visit eToro');
  });

  it('keeps the compare CTA in Final Decision when there are no alternatives to carry it', () => {
    const noAlternatives = { ...FULL_META, alternatives: [] };
    const html = renderToStaticMarkup(
      h(ReviewLayoutV2, {
        meta: noAlternatives as ContentMeta,
        market: 'us',
        category: 'trading',
        slug: 'etoro-review',
        decisionBridge: DECISION_BRIDGE,
      }),
    );
    expect(html).not.toContain('Alternatives to eToro');
    expect(finalDecisionSection(html)).toContain('Compare all 9 trading platforms');
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
    expect(html).toContain(FULL_META.verdict!.summary.slice(0, 40));
    expect(html).not.toContain('Score Breakdown');
    // No decisionBridge → no sidebar at all (gated on decisionBridge, same as V1's Market Check).
    expect(html).not.toContain('Expert Review');
    expect(html).not.toContain('data-testid="decision-bridge"');
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
      // Verdict-derived zones omitted. Asserted on the summary text: with the
      // label gone, checking for "Our Verdict" would pass no matter what.
      expect(html).not.toContain(FULL_META.verdict!.summary.slice(0, 40));
      expect(html).not.toContain('Best for');
      expect(html).not.toContain('Alternatives to eToro');
      expect(html).not.toContain('Final Decision');
      // Independent zones still render.
      expect(html).toContain('Methodology');
      expect(html).toContain('Markets &amp; Tools');
    }).not.toThrow();
  });
});
