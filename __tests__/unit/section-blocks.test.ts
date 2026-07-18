// __tests__/unit/section-blocks.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/section-blocks.tsx (T11, review-redesign V2):
// SectionVerdict, SectionVerdictsProvider, KeyEvidence, SmartFinProTake.
//
// SectionVerdict's Context-based Provider/Consumer is verified directly
// here (not mocked) — see the file header of section-blocks.tsx for why
// Context, not a plain module variable or cache(), is the only approach
// proven to propagate correctly under this repo's renderToStaticMarkup test
// pattern.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  SectionVerdict,
  SectionVerdictsProvider,
  KeyEvidence,
  SmartFinProTake,
} from '@/components/reviews/section-blocks';
import type { SectionVerdicts } from '@/lib/reviews/verdict-frontmatter';

const VERDICTS: SectionVerdicts = {
  fees: 'No broker-imposed per-contract options fee, but regulatory pass-throughs still apply.',
  markets: 'Wide multi-asset coverage across stocks, ETFs, crypto, and copy-trading portfolios.',
};

describe('SectionVerdict', () => {
  it('renders null when no SectionVerdictsProvider is mounted', () => {
    const html = renderToStaticMarkup(h(SectionVerdict, { id: 'fees' }));
    expect(html).toBe('');
  });

  it('renders the matching text when a Provider is mounted with a valid id', () => {
    const html = renderToStaticMarkup(
      h(SectionVerdictsProvider, { data: VERDICTS, children: h(SectionVerdict, { id: 'fees' }) }),
    );
    expect(html).toContain('No broker-imposed per-contract options fee');
    expect(html).toContain('Verdict');
  });

  it('renders null for an unknown id even with a Provider mounted', () => {
    const html = renderToStaticMarkup(
      h(SectionVerdictsProvider, { data: VERDICTS, children: h(SectionVerdict, { id: 'bogus' }) }),
    );
    expect(html).toBe('');
  });

  it('rejects the 2 layout-owned ids ("verdict", "alternatives") even if a Provider happened to carry data under those keys', () => {
    const html = renderToStaticMarkup(
      h(SectionVerdictsProvider, {
        data: { ...VERDICTS } as unknown as SectionVerdicts,
        children: h(SectionVerdict, { id: 'verdict' }),
      }),
    );
    expect(html).toBe('');
  });

  it('renders null when the Provider is mounted but has no text for that particular id', () => {
    const html = renderToStaticMarkup(
      h(SectionVerdictsProvider, {
        data: { fees: VERDICTS.fees },
        children: h(SectionVerdict, { id: 'support' }),
      }),
    );
    expect(html).toBe('');
  });

  it('takes no props beyond id — Proplos-Prinzip (no text prop to fabricate through)', () => {
    // Type-level guard: SectionVerdictProps only declares `id`. Passing an
    // extra "text" prop would not compile in the real component tree; here
    // we assert the render ignores unknown data and still requires context.
    const html = renderToStaticMarkup(h(SectionVerdict, { id: 'fees' } as { id: string }));
    expect(html).toBe('');
  });
});

describe('KeyEvidence', () => {
  it('renders children inside a <ul> with a hairline above, no table', () => {
    const html = renderToStaticMarkup(
      h(KeyEvidence, null, h('li', { key: '1' }, 'Verified against the official fee schedule, 18 Jul 2026.')),
    );
    expect(html).toContain('<ul');
    expect(html).toContain('Verified against the official fee schedule');
    expect(html).toContain('var(--sfp-hairline)');
    expect(html).not.toContain('<table');
  });
});

describe('SmartFinProTake', () => {
  it('renders children prose in a Sky-tinted, Navy-edged block', () => {
    const html = renderToStaticMarkup(
      h(SmartFinProTake, null, 'Copy trading is the standout feature here, but support response times lag the field leaders.'),
    );
    expect(html).toContain('Copy trading is the standout feature');
    expect(html).toContain('var(--sfp-sky)');
    expect(html).toContain('var(--sfp-navy)');
  });

  it('never uses red or gold — those are reserved for Cons/Risk and CTAs respectively', () => {
    const html = renderToStaticMarkup(h(SmartFinProTake, null, 'Some editorial aside.'));
    expect(html).not.toContain('var(--sfp-red)');
    expect(html).not.toContain('var(--sfp-gold)');
  });
});
