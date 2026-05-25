import { describe, expect, it } from 'vitest';
import { normalizeKeywordTrackingPosition } from '@/lib/actions/ranking';

describe('normalizeKeywordTrackingPosition', () => {
  it('rounds fractional GSC positions to the nearest whole number for storage', () => {
    expect(normalizeKeywordTrackingPosition(79.5)).toBe(80);
    expect(normalizeKeywordTrackingPosition(39.4)).toBe(39);
  });

  it('returns zero for invalid or non-positive values', () => {
    expect(normalizeKeywordTrackingPosition(null)).toBe(0);
    expect(normalizeKeywordTrackingPosition('')).toBe(0);
    expect(normalizeKeywordTrackingPosition(-3)).toBe(0);
  });
});
