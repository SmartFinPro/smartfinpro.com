// __tests__/unit/methodology-section.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/methodology-section.tsx (T12, review-redesign V2).
//
// Covers: the mandatory methodology sentence (verbatim match with
// components/reviews/verdict-card.tsx's BestXScore panel), the "How we
// score"/"View methodology" links, deduplicated essentialFacts sourceHrefs,
// UpdateLog real-entries-only filtering (no synthetic date), and the
// "leer ⇒ Abschnitt schrumpft" behaviour (no pointless empty accordion).

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { MethodologySection } from '@/components/reviews/methodology-section';
import type { EssentialFact } from '@/lib/reviews/verdict-frontmatter';

const FACTS: EssentialFact[] = [
  { label: 'Account minimum', value: '$50', asOf: '2026-07-18', sourceHref: 'https://www.etoro.com/en-us/customer-service/deposit-faq/' },
  { label: 'Options contract fee', value: '$0', asOf: '2026-07-18', sourceHref: 'https://www.etoro.com/en-us/trading/fees/' },
  // Duplicate sourceHref — must be deduplicated in the rendered Sources list.
  { label: 'Stock trading fee', value: '$0', asOf: '2026-07-18', sourceHref: 'https://www.etoro.com/en-us/trading/fees/' },
];

describe('MethodologySection', () => {
  it('renders the mandatory methodology sentence verbatim — same wording as VerdictCard', () => {
    const html = renderToStaticMarkup(h(MethodologySection, { essentialFacts: FACTS }));
    expect(html).toContain(
      'Calculated from verified data points from official sources. Commercial relationships do not affect the score.',
    );
  });

  it('renders both "How we score" and "View methodology" links, both to /methodology by default', () => {
    const html = renderToStaticMarkup(h(MethodologySection, { essentialFacts: FACTS }));
    expect(html).toContain('How we score');
    expect(html).toContain('View methodology');
    const hrefCount = (html.match(/href="\/methodology"/g) ?? []).length;
    expect(hrefCount).toBe(2);
  });

  it('respects a custom methodologyHref', () => {
    const html = renderToStaticMarkup(h(MethodologySection, { essentialFacts: FACTS, methodologyHref: '/us/methodology' }));
    expect(html).toContain('href="/us/methodology"');
    expect(html).not.toContain('href="/methodology"');
  });

  it('deduplicates essentialFacts sourceHrefs in the Sources list', () => {
    const html = renderToStaticMarkup(h(MethodologySection, { essentialFacts: FACTS }));
    // Count the <a href="..."> tags for the shared sourceHref, not raw substring matches
    // (the link's visible text is the URL itself, so a naive substring count double-counts one <a>).
    const anchorOccurrences = (html.match(/<a[^>]*href="https:\/\/www\.etoro\.com\/en-us\/trading\/fees\/"/g) ?? []).length;
    expect(anchorOccurrences).toBe(1);
    expect(html).toContain('deposit-faq');
  });

  it('filters UpdateLog to real entries only — a synthetic/blank date or change is dropped', () => {
    const html = renderToStaticMarkup(
      h(MethodologySection, {
        essentialFacts: FACTS,
        updateLog: [
          { date: '2026-07-18', change: 'Corrected account minimum from $100 to $50 per official deposit FAQ.' },
          { date: '', change: 'Should not render — missing date.' },
          { date: '2026-01-01', change: '' },
        ],
      }),
    );
    expect(html).toContain('Corrected account minimum from $100 to $50');
    expect(html).not.toContain('Should not render');
  });

  it('"leer ⇒ Abschnitt schrumpft": renders no accordion at all when there are no sources and no update-log entries', () => {
    const html = renderToStaticMarkup(h(MethodologySection, { essentialFacts: [] }));
    expect(html).toContain('Calculated from verified data points');
    expect(html).not.toContain('Sources & updates');
    expect(html).not.toContain('<details');
  });

  it('renders the accordion when only update-log entries are present (no facts)', () => {
    const html = renderToStaticMarkup(
      h(MethodologySection, {
        essentialFacts: [],
        updateLog: [{ date: '2026-07-18', change: 'Initial V2 publish.' }],
      }),
    );
    // renderToStaticMarkup HTML-escapes "&" — compare against the escaped form.
    expect(html).toContain('Sources &amp; updates');
    expect(html).toContain('Initial V2 publish.');
  });
});
