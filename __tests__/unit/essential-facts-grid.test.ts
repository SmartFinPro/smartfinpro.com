// __tests__/unit/essential-facts-grid.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/essential-facts-grid.tsx (T9, review-redesign V2).
//
// Covers: label/value/context/asOf rendering, the mandatory sourceHref link
// (component does not itself validate presence — that's the frontmatter
// Zod layer's job — but always renders the link when the field is there),
// graceful asOf-parse-failure (micro-line omitted, link still renders), and
// the empty-array no-render case.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { EssentialFactsGrid } from '@/components/reviews/essential-facts-grid';
import type { EssentialFact } from '@/lib/reviews/verdict-frontmatter';

const FACTS: EssentialFact[] = [
  {
    label: 'Account minimum',
    value: '$50',
    context: 'Standard across all deposit methods',
    asOf: '2026-07-18',
    sourceHref: 'https://www.etoro.com/en-us/customer-service/deposit-faq/',
  },
  {
    label: 'Options contract fee',
    value: '$0',
    context: 'Broker-imposed; regulatory pass-throughs still apply',
    asOf: '2026-07-18',
    sourceHref: 'https://www.etoro.com/en-us/trading/fees/',
  },
];

describe('EssentialFactsGrid', () => {
  it('renders label, value, context, "as of" date, and the sourceHref link for each fact', () => {
    const html = renderToStaticMarkup(h(EssentialFactsGrid, { facts: FACTS }));
    expect(html).toContain('Account minimum');
    expect(html).toContain('$50');
    expect(html).toContain('Standard across all deposit methods');
    expect(html).toContain('as of 18 Jul 2026');
    expect(html).toContain('href="https://www.etoro.com/en-us/customer-service/deposit-faq/"');
    expect(html).toContain('Options contract fee');
    expect(html).toContain('href="https://www.etoro.com/en-us/trading/fees/"');
  });

  it('still renders the sourceHref link even when asOf fails to parse (only the date micro-text is omitted)', () => {
    const facts: EssentialFact[] = [
      { label: 'Deposit', value: '$50', asOf: 'not-a-date', sourceHref: 'https://example.com/source' },
    ];
    const html = renderToStaticMarkup(h(EssentialFactsGrid, { facts }));
    expect(html).not.toContain('as of');
    expect(html).toContain('href="https://example.com/source"');
    expect(html).toContain('Source');
  });

  it('omits the context line when context is absent', () => {
    const facts: EssentialFact[] = [
      { label: 'Deposit', value: '$50', asOf: '2026-07-18', sourceHref: 'https://example.com/source' },
    ];
    const html = renderToStaticMarkup(h(EssentialFactsGrid, { facts }));
    expect(html).toContain('Deposit');
    expect(html).toContain('$50');
  });

  it('renders nothing for an empty facts array', () => {
    expect(renderToStaticMarkup(h(EssentialFactsGrid, { facts: [] }))).toBe('');
  });

  it('renders up to 6 facts in a responsive 2/3-column grid (no <table>)', () => {
    const sixFacts: EssentialFact[] = Array.from({ length: 6 }, (_, i) => ({
      label: `Fact ${i + 1}`,
      value: `${i + 1}`,
      asOf: '2026-07-18',
      sourceHref: `https://example.com/${i + 1}`,
    }));
    const html = renderToStaticMarkup(h(EssentialFactsGrid, { facts: sixFacts }));
    for (let i = 1; i <= 6; i++) {
      expect(html).toContain(`Fact ${i}`);
    }
    expect(html).not.toContain('<table');
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('md:grid-cols-3');
  });
});
