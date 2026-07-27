// __tests__/unit/research-card.test.ts
// Card-layer CONTRACT tests for the Research Library (plan §13). ResearchCard,
// ScoreBadge and VerificationStatus are synchronous server components with no
// client state, so they render to a static HTML string via
// react-dom/server#renderToStaticMarkup in the existing Node/vitest env — no
// jsdom / testing-library / new deps, no config change (this is a `.test.ts`,
// caught by the default include glob; JSX-free, using React.createElement).
//
// These guard the HONESTY surface at the card layer (the adapter already tests
// the status-degradation logic; here we prove the RENDER never leaks a number/
// rank for a non-audited record, never emits a dead review link, etc.):
//   - provisional / unavailable  -> no score numeral, no rank, no "—/10"
//   - audited                     -> score + rank rendered
//   - no-review (Merrill)          -> Compare primary, ?compare= without
//                                     view=compare, never a review link
//   - bestFor chip                  -> audited only
//   - provider CTA                   -> only when the resolved CTA is external
//   - screen-reader rank             -> announced (standard sr-only + featured
//                                     sr-only sentence), visible score aria-hidden
//   - evidence label                  -> "N verified data points", never "sources"
// (Facts <-> fieldSources completeness is an adapter/contract concern, tested
//  in research-adapter/research-score — deliberately not re-asserted here.)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// --- deterministic render mocks (no new deps) --------------------------------
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ href, children, ...rest }: any) =>
      createElement('a', { href: typeof href === 'string' ? href : href?.pathname ?? '#', ...rest }, children),
  };
});
vi.mock('next/image', async () => {
  const { createElement } = await import('react');
  return { default: ({ src, alt }: any) => createElement('img', { src, alt }) };
});
vi.mock('@/lib/comparison/topics/index', () => ({
  // 4 trivial spec columns so keyFacts render without needing real product attrs.
  getTopicConfig: () => ({
    specColumns: ['optionsFee', 'minDeposit', 'extendedHours', 'tradingview'].map((key) => ({
      key,
      label: key,
      accessor: () => 0,
      format: () => 'val',
    })),
  }),
}));
const resolveCockpitCta = vi.fn();
vi.mock('@/lib/comparison/cta', () => ({ resolveCockpitCta: (p: any) => resolveCockpitCta(p) }));

// Imported AFTER the mocks are registered.
import { ResearchCard } from '@/components/research/ResearchCard';

// --- fixtures ---------------------------------------------------------------
const src = (t: string): any => ({ sourceUrl: 'https://example.com/x', sourceType: t, verifiedAt: '2026-07-03' });

const audited = (over: any = {}): any => ({
  status: 'audited',
  score: 9.6,
  subScores: {},
  methodologyVersion: 'trading-v1',
  dataVerifiedAt: '2026-07-03',
  confidence: 'high',
  confidenceReason: 'Verified against official published sources',
  fieldSources: {
    optionsFee: src('official'),
    minDeposit: src('official'),
    extendedHours: src('editorial'),
    tradingview: src('official'),
  },
  ...over,
});
const provisional = (over: any = {}): any => ({
  status: 'provisional',
  score: null,
  subScores: {},
  methodologyVersion: null,
  dataVerifiedAt: null,
  confidence: null,
  confidenceReason: 'Extended-hours availability not established',
  fieldSources: { optionsFee: src('official') },
  ...over,
});
const unavailable = (over: any = {}): any => ({
  status: 'unavailable',
  score: null,
  subScores: {},
  methodologyVersion: null,
  dataVerifiedAt: null,
  confidence: null,
  confidenceReason: null,
  fieldSources: {},
  ...over,
});

const product = (over: any = {}): any => ({
  slug: 'fidelity',
  displayName: 'Fidelity',
  initial: 'F',
  market: 'us',
  category: 'trading',
  topic: 'trading-platforms',
  tagline: 'Zero fees, automatic cash yield',
  bestFor: 'Best overall',
  cons: ['No futures or forex trading available on the platform'],
  ...over,
});

const item = (over: any = {}): any => ({
  product: product(over.product),
  research: over.research,
  rank: over.rank ?? null,
  reviewHref: over.reviewHref ?? null,
});

const render = (it: any, variant?: 'standard' | 'featured'): string =>
  renderToStaticMarkup(h(ResearchCard as any, { item: it, variant }));

beforeEach(() => {
  resolveCockpitCta.mockReset();
  resolveCockpitCta.mockReturnValue({ href: 'https://provider.example', external: true, label: 'Visit site' });
});

// --- tests ------------------------------------------------------------------
describe('ResearchCard — honesty contract', () => {
  it('audited standard: renders score + rank + review CTA, never a bad fallback', () => {
    const html = render(item({ research: audited(), rank: 2, reviewHref: '/us/trading/fidelity-review' }));
    expect(html).toContain('9.6');
    expect(html).toMatch(/>#2</); // rank chip
    expect(html).toContain('Read research');
    expect(html).toContain('Ranked number 2'); // sr-only rank for standard cards
    expect(html).not.toContain('—/10');
    expect(html.toLowerCase()).not.toContain('rank 0');
  });

  it('provisional: no score numeral, no rank, shows "Verification in progress"', () => {
    const html = render(item({ research: provisional(), rank: null, reviewHref: '/us/trading/etoro-review' }));
    expect(html).toContain('Verification in progress');
    // The ScoreBadge (and its "… out of 10" sr-only sentence) only renders for
    // audited records — its absence is the precise "no numeric score" signal.
    expect(html).not.toContain('out of 10');
    expect(html).not.toContain('BEST-X Score');
    expect(html).not.toMatch(/>#\d/); // no rank chip
    expect(html).not.toContain('—/10');
  });

  it('unavailable: shows "Score unavailable", no score, no rank', () => {
    const html = render(item({ research: unavailable(), rank: null }));
    expect(html).toContain('Score unavailable');
    expect(html).not.toContain('out of 10');
    expect(html).not.toContain('BEST-X Score');
    expect(html).not.toMatch(/>#\d/);
    expect(html).not.toContain('—/10');
  });

  it('no-review product (Merrill Edge): Compare is primary, never a dead review link', () => {
    const html = render(
      item({
        product: { slug: 'merrill-edge', displayName: 'Merrill Edge', initial: 'M' },
        research: audited(),
        rank: 8,
        reviewHref: null,
      }),
    );
    expect(html).toContain('Compare');
    expect(html).toContain('?compare=merrill-edge');
    expect(html).not.toContain('view=compare'); // single-slug handoff only
    expect(html).not.toContain('Read research');
    expect(html).not.toMatch(/href="[^"]*-review/); // no fabricated review link
  });

  it('bestFor chip renders for audited but not for provisional', () => {
    expect(render(item({ research: audited(), rank: 1, reviewHref: '/r' }))).toContain('Best overall');
    expect(render(item({ research: provisional(), reviewHref: '/r' }))).not.toContain('Best overall');
  });

  it('provider CTA renders only when the resolved CTA is external', () => {
    resolveCockpitCta.mockReturnValue({ href: 'https://x.example', external: true, label: 'Visit' });
    expect(render(item({ research: audited(), rank: 1, reviewHref: '/r' }))).toContain('Visit provider');

    resolveCockpitCta.mockReturnValue({ href: '/us/trading/x-review', external: false, label: 'Read review' });
    const internal = render(item({ research: audited(), rank: 1, reviewHref: '/r' }));
    expect(internal).not.toContain('Visit provider');
  });

  it('evidence is labelled "verified data points", never "sources"', () => {
    const html = render(item({ research: audited(), rank: 1, reviewHref: '/r' }));
    expect(html).toContain('4 verified data points');
    expect(html).not.toContain('4 sources');
  });

  it('featured winner panel: rank announced via a single sr-only sentence, visible score aria-hidden', () => {
    const html = render(item({ research: audited(), rank: 1, reviewHref: '/r' }), 'featured');
    expect(html).toContain('Ranked number 1 overall'); // the one sr-only source of truth
    expect(html).toContain('aria-hidden="true"'); // visible rank/score decorations are hidden from AT
    expect(html).not.toContain('—/10');
  });
});
