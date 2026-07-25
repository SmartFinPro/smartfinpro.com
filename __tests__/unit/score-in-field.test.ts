// __tests__/unit/score-in-field.test.ts
// Render-to-string tests (react-dom/server, no jsdom — same pattern as
// __tests__/unit/score-breakdown.test.ts) for components/reviews/score-in-field.tsx.
//
// Focus is the honesty contract and the degradation matrix the plan makes
// mandatory: never invent a value, never divide by zero, never label an axis
// end with a provider that does not own that extreme, and render NOTHING at
// all rather than a placeholder when the data is absent.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ScoreInField } from '@/components/reviews/score-in-field';
import type { DecisionBridgeData, DecisionBridgeFieldRow } from '@/lib/comparison/types';

type Position = DecisionBridgeData['position'];

function row(rank: number, name: string, score: number, isYou = false): DecisionBridgeFieldRow {
  return { rank, name, score, reviewHref: null, isYou };
}

/** The real audited eToro US trading-platforms shape: 9 products, 8.0–9.6 (a
 *  1.6-point spread), reviewed product #8 at 8.3. */
const FIELD: DecisionBridgeFieldRow[] = [
  row(1, 'Fidelity', 9.6),
  row(2, 'Charles Schwab', 9.3),
  row(3, 'Interactive Brokers', 9.2),
  row(4, 'Robinhood', 8.9),
  row(5, 'E*TRADE', 8.7),
  row(6, 'Webull', 8.6),
  row(7, 'tastytrade', 8.5),
  row(8, 'eToro', 8.3, true),
  row(9, 'Merrill Edge', 8.0),
];

const POSITION: Position = {
  rank: 8,
  slug: 'etoro',
  name: 'eToro',
  score: 8.3,
  subScores: { fees: 8.8, features: 8.0, ux: 8.4, support: 7.8 },
  confidence: 'high',
  dataVerifiedAt: '2026-07-03',
  isTopPick: false,
};

function render(props: Parameters<typeof ScoreInField>[0]): string {
  return renderToStaticMarkup(h(ScoreInField, props));
}

describe('ScoreInField — honesty contract', () => {
  it('renders the spread, the rank phrase and both named rail ends for a healthy field', () => {
    const html = render({ field: FIELD, position: POSITION, fieldCount: 9 });

    expect(html).toContain('Where eToro sits in the field');
    expect(html).toContain('Rank 8 of 9'); // rankPhrase, not a pseudo-precise percentile
    expect(html).toContain('1.6-point spread on a 10-point scale');
    expect(html).toContain('Inside that 1.6-point band');
    expect(html).toContain('Merrill Edge · lowest');
    expect(html).toContain('Fidelity · highest');
    // Distance sentence — the textual equivalent of the pin's placement.
    expect(html).toContain('0.3 points above the lowest');
    expect(html).toContain('1.3 below the highest');
  });

  it('never emits stars, review counts or aggregated user ratings', () => {
    const html = render({ field: FIELD, position: POSITION, fieldCount: 9 });
    expect(html).not.toMatch(/★|✩|<svg[^>]*star/i);
    expect(html.toLowerCase()).not.toContain('review count');
    expect(html.toLowerCase()).not.toContain('reviewcount');
    expect(html.toLowerCase()).not.toContain('out of 5');
  });

  it('uses CSS variables for brand colour, never hardcoded brand hex values', () => {
    const html = render({ field: FIELD, position: POSITION, fieldCount: 9 });
    expect(html).toContain('var(--sfp-navy)');
    expect(html).toContain('var(--sfp-slate)');
    expect(html).not.toMatch(/#1B4F8C|#F5A623|#D48B1A|#1A6B3A|#555555/i);
  });

  it('emits no NaN, Infinity or undefined anywhere in the markup', () => {
    const html = render({ field: FIELD, position: POSITION, fieldCount: 9 });
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
    expect(html).not.toContain('undefined');
  });
});

describe('ScoreInField — degradation (renders null, never a placeholder)', () => {
  it('renders nothing when position is missing', () => {
    expect(render({ field: FIELD, position: null, fieldCount: 9 })).toBe('');
    expect(render({ field: FIELD, position: undefined, fieldCount: 9 })).toBe('');
  });

  it('renders nothing when the field is missing, empty or not an array', () => {
    expect(render({ field: null, position: POSITION, fieldCount: 9 })).toBe('');
    expect(render({ field: undefined, position: POSITION, fieldCount: 9 })).toBe('');
    expect(render({ field: [], position: POSITION, fieldCount: 9 })).toBe('');
    // Defensive: a non-array survives the type system only via bad runtime data.
    expect(render({ field: {} as unknown as DecisionBridgeFieldRow[], position: POSITION })).toBe('');
  });

  it("renders nothing when the reviewed product's own score is not a finite number", () => {
    expect(render({ field: FIELD, position: { ...POSITION, score: Number.NaN } })).toBe('');
    expect(render({ field: FIELD, position: { ...POSITION, score: Number.POSITIVE_INFINITY } })).toBe('');
    expect(render({ field: FIELD, position: { ...POSITION, score: null as unknown as number } })).toBe('');
  });

  it('renders nothing when every field row is malformed (no plotted dot may be invented)', () => {
    const broken = [
      { rank: 1, name: 'A', score: Number.NaN, reviewHref: null, isYou: false },
      { rank: 2, name: '', score: 9.0, reviewHref: null, isYou: false },
    ] as DecisionBridgeFieldRow[];
    expect(render({ field: broken, position: POSITION, fieldCount: 2 })).toBe('');
  });
});

describe('ScoreInField — zero-spread degradation (no division by zero)', () => {
  it('drops the magnified rail for a single-product field and says so plainly', () => {
    const html = render({
      field: [row(1, 'eToro', 8.3, true)],
      position: { ...POSITION, rank: 1 },
      fieldCount: 1,
    });
    expect(html).toContain('only provider currently tracked in this field');
    expect(html).not.toContain('Inside that'); // magnified rail suppressed
    expect(html).not.toContain('lowest');
    expect(html).not.toContain('NaN');
  });

  it('drops the magnified rail when every score is identical', () => {
    const level = [row(1, 'A', 8.3), row(2, 'B', 8.3), row(3, 'eToro', 8.3, true)];
    const html = render({ field: level, position: { ...POSITION, rank: 3 }, fieldCount: 3 });
    expect(html).toContain('All 3 providers score');
    expect(html).toContain('the field is completely level');
    expect(html).not.toContain('Inside that');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('0.0-point spread');
  });
});

describe('ScoreInField — partial data still renders the distribution', () => {
  it('drops only the rank chip when the rank is missing or implausible', () => {
    const noRank = render({ field: FIELD, position: { ...POSITION, rank: Number.NaN }, fieldCount: 9 });
    expect(noRank).not.toContain('Rank ');
    expect(noRank).toContain('1.6-point spread'); // distribution survives

    const tooHigh = render({ field: FIELD, position: { ...POSITION, rank: 42 }, fieldCount: 9 });
    expect(tooHigh).not.toContain('Rank ');

    const zero = render({ field: FIELD, position: { ...POSITION, rank: 0 }, fieldCount: 9 });
    expect(zero).not.toContain('Rank ');
  });

  it('falls back to the plotted row count when fieldCount is absent', () => {
    const html = render({ field: FIELD, position: POSITION });
    expect(html).toContain('Rank 8 of 9');
    expect(html).toContain('All 9 providers score between');
  });

  it('leaves a rail end unnamed when no plotted provider owns that extreme', () => {
    // Stale row set: the reviewed product scores below every row in `field`,
    // so the low end belongs to nobody in the list and must stay unnamed.
    const rowsWithoutYou = FIELD.filter((r) => !r.isYou);
    const html = render({ field: rowsWithoutYou, position: { ...POSITION, score: 7.0 }, fieldCount: 9 });
    expect(html).toContain('7.0');
    expect(html).toContain('>lowest<'); // bare label, no provider name attached
    expect(html).not.toContain('Merrill Edge · lowest');
    expect(html).toContain('Fidelity · highest'); // the high end IS owned by a real row
  });

  it('phrases the distance sentence correctly when the product itself is the extreme', () => {
    const asLowest = render({ field: FIELD, position: { ...POSITION, name: 'Merrill Edge', score: 8.0, rank: 9 } });
    expect(asLowest).toContain('the lowest in this field');
    expect(asLowest).toContain('1.6 points below the highest score');

    const asHighest = render({ field: FIELD, position: { ...POSITION, name: 'Fidelity', score: 9.6, rank: 1 } });
    expect(asHighest).toContain('the highest in this field');
    expect(asHighest).toContain('1.6 points above the lowest score');
  });
});
