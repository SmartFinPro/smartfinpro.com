// __tests__/unit/cockpit-modified-date.test.ts
// computeCockpitModifiedDate — the single "when was this data last verified"
// date shared by the cockpit page (metadata + JSON-LD) and the sitemap, so
// both surfaces report the same lastmod for the same /best/{topic} route.

import { describe, expect, it } from 'vitest';
import { computeCockpitModifiedDate } from '@/lib/comparison/dates';

describe('computeCockpitModifiedDate', () => {
  it('returns the max dataVerifiedAt across providers', () => {
    const products = [
      { dataVerifiedAt: '2026-01-10' },
      { dataVerifiedAt: '2026-03-05' },
      { dataVerifiedAt: '2026-02-01' },
    ];
    expect(computeCockpitModifiedDate(products, '2025-01-01')).toBe('2026-03-05');
  });

  it('ignores null dataVerifiedAt values', () => {
    const products = [
      { dataVerifiedAt: null },
      { dataVerifiedAt: '2026-01-15' },
      { dataVerifiedAt: null },
    ];
    expect(computeCockpitModifiedDate(products, '2025-01-01')).toBe('2026-01-15');
  });

  it('falls back to publishedDate when no provider has a verified date', () => {
    const products = [{ dataVerifiedAt: null }, { dataVerifiedAt: null }];
    expect(computeCockpitModifiedDate(products, '2025-06-01')).toBe('2025-06-01');
  });

  it('falls back to publishedDate for an empty product list', () => {
    expect(computeCockpitModifiedDate([], '2025-06-01')).toBe('2025-06-01');
  });

  it('never lets the modified date precede publishedDate (invalid Article schema)', () => {
    const products = [{ dataVerifiedAt: '2020-01-01' }];
    expect(computeCockpitModifiedDate(products, '2025-06-01')).toBe('2025-06-01');
  });
});
