// __tests__/unit/score-label.test.ts
// T4 (2026-07-18 review-redesign V2 foundation): pure band/rank-phrase
// helpers for the BEST-X 0-10 score. See lib/reviews/score-label.ts.

import { describe, expect, it } from 'vitest';
import { scoreLabel, rankPhrase, SCORE_BANDS } from '@/lib/reviews/score-label';

describe('SCORE_BANDS', () => {
  it('is the single exported source of the band thresholds/labels', () => {
    expect(SCORE_BANDS.map((b) => b.label)).toEqual([
      'Excellent',
      'Very Good',
      'Good',
      'Fair',
      'Mixed',
    ]);
  });
});

describe('scoreLabel', () => {
  it('labels 9.0 and above as Excellent', () => {
    expect(scoreLabel(9.0)).toBe('Excellent');
    expect(scoreLabel(9.5)).toBe('Excellent');
    expect(scoreLabel(10.0)).toBe('Excellent');
  });

  it('draws the Excellent/Very Good boundary exactly at 9.0 (8.99 is Very Good)', () => {
    expect(scoreLabel(8.99)).toBe('Very Good');
    expect(scoreLabel(9.0)).toBe('Excellent');
  });

  it('labels the 8.5-8.9 band as Very Good', () => {
    expect(scoreLabel(8.5)).toBe('Very Good');
    expect(scoreLabel(8.9)).toBe('Very Good');
  });

  it('draws the Very Good/Good boundary exactly at 8.5 (8.49 is Good)', () => {
    expect(scoreLabel(8.49)).toBe('Good');
    expect(scoreLabel(8.5)).toBe('Very Good');
  });

  it('labels the 8.0-8.4 band as Good', () => {
    expect(scoreLabel(8.0)).toBe('Good');
    expect(scoreLabel(8.4)).toBe('Good');
  });

  it('draws the Good/Fair boundary exactly at 8.0 (7.99 is Fair)', () => {
    expect(scoreLabel(7.99)).toBe('Fair');
    expect(scoreLabel(8.0)).toBe('Good');
  });

  it('labels the 7.0-7.9 band as Fair', () => {
    expect(scoreLabel(7.0)).toBe('Fair');
    expect(scoreLabel(7.9)).toBe('Fair');
  });

  it('draws the Fair/Mixed boundary exactly at 7.0 (6.99 is Mixed)', () => {
    expect(scoreLabel(6.99)).toBe('Mixed');
    expect(scoreLabel(7.0)).toBe('Fair');
  });

  it('labels anything below 7.0 as Mixed, including 0', () => {
    expect(scoreLabel(5.0)).toBe('Mixed');
    expect(scoreLabel(0)).toBe('Mixed');
  });
});

describe('rankPhrase', () => {
  it('always returns "Rank X of Y" for fieldCount < 20, never a percent/percentile', () => {
    expect(rankPhrase(1, 9)).toBe('Rank 1 of 9');
    expect(rankPhrase(9, 9)).toBe('Rank 9 of 9');
    expect(rankPhrase(3, 19)).toBe('Rank 3 of 19');
  });

  it('never emits "%" for a small field, even at the top or bottom rank', () => {
    expect(rankPhrase(1, 9)).not.toMatch(/%/);
    expect(rankPhrase(9, 9)).not.toMatch(/%/);
  });

  it('does not use "Top 20%"-style pseudo-precision for a 9-product field', () => {
    // The exact regression this rule exists for: a 9-candidate field must
    // never be phrased as a percentile — "Rank 1 of 9", not "Top 11%"/"Top 20%".
    expect(rankPhrase(1, 9)).toBe('Rank 1 of 9');
  });

  it('may return a "Top X%" phrase once fieldCount reaches 20', () => {
    const phrase = rankPhrase(1, 20);
    expect(phrase).toMatch(/^Top \d+%$/);
  });

  it('computes the percentile from rank/fieldCount for large fields', () => {
    expect(rankPhrase(1, 20)).toBe('Top 5%');
    expect(rankPhrase(10, 100)).toBe('Top 10%');
  });

  it('treats the boundary at exactly 20 as the large-field path (not "Rank X of Y")', () => {
    expect(rankPhrase(5, 20)).not.toMatch(/^Rank/);
    expect(rankPhrase(5, 19)).toMatch(/^Rank/);
  });
});
