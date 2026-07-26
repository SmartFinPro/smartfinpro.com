// __tests__/unit/best-for-not-for.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/best-for-not-for.tsx (T9, review-redesign V2).

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { BestForNotFor } from '@/components/reviews/best-for-not-for';

describe('BestForNotFor', () => {
  it('renders both columns with their eyebrow labels', () => {
    const html = renderToStaticMarkup(
      h(BestForNotFor, {
        bestFor: ['Copy traders', 'Options traders watching contract fees'],
        notFor: ['Traders who need 24/7 phone support'],
      }),
    );
    expect(html).toContain('Best for');
    expect(html).toContain('Copy traders');
    expect(html).toContain('Not for');
    expect(html).toContain('Traders who need 24/7 phone support');
  });

  it('caps each column at 3 entries even if given more', () => {
    const html = renderToStaticMarkup(
      h(BestForNotFor, {
        bestFor: ['A', 'B', 'C', 'D'],
        notFor: ['W', 'X', 'Y', 'Z'],
      }),
    );
    expect(html).toContain('>A<');
    expect(html).toContain('>B<');
    expect(html).toContain('>C<');
    expect(html).not.toContain('>D<');
    expect(html).not.toContain('>Z<');
  });

  it('renders only the populated column when the other is empty', () => {
    const html = renderToStaticMarkup(h(BestForNotFor, { bestFor: ['Copy traders'], notFor: [] }));
    expect(html).toContain('Best for');
    expect(html).toContain('Copy traders');
    expect(html).not.toContain('Not for');
  });

  it('renders nothing when both columns are empty', () => {
    expect(renderToStaticMarkup(h(BestForNotFor, { bestFor: [], notFor: [] }))).toBe('');
  });
});
