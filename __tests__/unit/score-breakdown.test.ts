// __tests__/unit/score-breakdown.test.ts
// Render-to-string tests (react-dom/server, no jsdom — pattern from
// __tests__/unit/shell-rsc-smoke.test.ts) for
// components/reviews/score-breakdown.tsx (T8, review-redesign V2).
//
// Covers: dynamic key iteration (no hardcoded 4-key set — a 4-key AND a
// 6-key field must both work, plan's explicit test requirement), the 5-row
// visibility cap, and Null-Degradation (missing/empty subScores → null,
// tested both-sided per the plan's Pflicht).

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ScoreBreakdown } from '@/components/reviews/score-breakdown';

describe('ScoreBreakdown', () => {
  it('Null-Degradation: renders nothing for null, undefined, or an empty subScores object', () => {
    expect(renderToStaticMarkup(h(ScoreBreakdown, { subScores: null }))).toBe('');
    expect(renderToStaticMarkup(h(ScoreBreakdown, { subScores: undefined }))).toBe('');
    expect(renderToStaticMarkup(h(ScoreBreakdown, { subScores: {} }))).toBe('');
  });

  it('renders all 4 rows for a 4-key field (eToro shape: fees/features/ux/support) — no hardcoded key set', () => {
    const html = renderToStaticMarkup(
      h(ScoreBreakdown, { subScores: { fees: 8.8, features: 8.0, ux: 8.4, support: 7.8 } }),
    );
    expect(html).toContain('Fees');
    expect(html).toContain('Features');
    expect(html).toContain('UX'); // special-cased casing
    expect(html).toContain('Support');
    expect(html).toContain('8.8');
    expect(html).toContain('7.8');
  });

  it('caps a 6-key field at the 5 most-visible rows, dropping the 6th', () => {
    const html = renderToStaticMarkup(
      h(ScoreBreakdown, {
        subScores: {
          fees: 9.0,
          features: 8.5,
          ux: 8.4,
          support: 7.8,
          reliability: 8.9,
          onboarding: 6.5,
        },
      }),
    );
    expect(html).toContain('Fees');
    expect(html).toContain('Features');
    expect(html).toContain('UX');
    expect(html).toContain('Support');
    expect(html).toContain('Reliability');
    // 6th key must not render.
    expect(html).not.toContain('Onboarding');
    expect(html).not.toContain('6.5');
  });

  it('renders values as bare tabular numbers (no per-row band words — compact 2026-07-19 redesign), and no <table> / donut markup', () => {
    const html = renderToStaticMarkup(h(ScoreBreakdown, { subScores: { fees: 9.2, support: 7.5 } }));
    expect(html).toContain('9.2');
    expect(html).toContain('7.5');
    // Per-row scoreLabel() words were dropped: the headline score above the
    // breakdown (BestXScore panel) already carries its band word.
    expect(html).not.toContain('Excellent'); // scoreLabel(9.2)
    expect(html).not.toContain('Fair'); // scoreLabel(7.5)
    expect(html).not.toContain('<table');
    expect(html).not.toContain('<circle');
  });

  it('filters out non-finite sub-score values instead of throwing', () => {
    const html = renderToStaticMarkup(
      h(ScoreBreakdown, { subScores: { fees: 8.8, broken: Number.NaN } as unknown as Record<string, number> }),
    );
    expect(html).toContain('Fees');
    expect(html).not.toContain('Broken');
  });
});
