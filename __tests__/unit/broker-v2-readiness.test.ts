import { describe, it, expect } from 'vitest';
import {
  countFields,
  rankRows,
  deriveReadinessEntry,
  type CockpitRowLite,
} from '@/lib/reviews/readiness';

const row = (over: Partial<CockpitRowLite> = {}): CockpitRowLite => ({
  market: 'us', category: 'trading', topic: 'trading-platforms',
  slug: 'interactive-brokers', review_slug: 'interactive-brokers-review',
  score: 9.2, is_top_pick: false, data_verified_at: '2026-07-03',
  attributes: { fees: 0, min_deposit: 0, platforms: 'TWS' },
  ...over,
});

const cand = {
  path: 'content/us/trading/interactive-brokers-review.mdx',
  market: 'us', category: 'trading', slug: 'interactive-brokers-review',
};

describe('countFields', () => {
  it('zählt nur nicht-leere Attributwerte', () => {
    expect(countFields({ a: 1, b: '', c: null, d: 'x', e: undefined })).toBe(2);
  });
  it('null/fehlende attributes → 0', () => {
    expect(countFields(null)).toBe(0);
  });
});

describe('rankRows', () => {
  it('ordnet is_top_pick desc, dann score desc (nulls last), dann slug asc', () => {
    const rows = [
      row({ slug: 'b', score: 9.0, is_top_pick: false }),
      row({ slug: 'a', score: null, is_top_pick: false }),
      row({ slug: 'c', score: 8.0, is_top_pick: true }),
      row({ slug: 'd', score: 9.0, is_top_pick: false }),
    ];
    expect(rankRows(rows).map((r) => r.slug)).toEqual(['c', 'b', 'd', 'a']);
  });
});

describe('deriveReadinessEntry', () => {
  const audited = '2026-07-26';

  it('ready: Produkt gefunden, Felder + data_verified_at + score vorhanden', () => {
    const e = deriveReadinessEntry(cand, ['trading-platforms'],
      new Map([['trading-platforms', [row({ slug: 'etoro', review_slug: 'etoro-review', score: 9.6, is_top_pick: true }), row()]]]), audited);
    expect(e).toMatchObject({
      status: 'ready', topic: 'trading-platforms', productSlug: 'interactive-brokers',
      reviewSlug: 'interactive-brokers-review', rank: 2, fieldCount: 3,
      dataVerifiedAt: '2026-07-03', auditedAt: audited,
    });
  });

  it('missing-topic: keine Manifest-Topics für market/category', () => {
    expect(deriveReadinessEntry(cand, [], new Map(), audited).status).toBe('missing-topic');
  });

  it('missing-product: Topics existieren, aber kein row.review_slug matcht', () => {
    const e = deriveReadinessEntry(cand, ['trading-platforms'],
      new Map([['trading-platforms', [row({ review_slug: 'etoro-review', slug: 'etoro' })]]]), audited);
    expect(e.status).toBe('missing-product');
  });

  it('empty-field: Produkt gefunden, aber 0 Felder ODER kein data_verified_at ODER kein score', () => {
    for (const bad of [{ attributes: {} }, { data_verified_at: null }, { score: null }]) {
      const e = deriveReadinessEntry(cand, ['trading-platforms'],
        new Map([['trading-platforms', [row(bad as Partial<CockpitRowLite>)]]]), audited);
      expect(e.status).toBe('empty-field');
    }
  });

  it('erster Topic-Treffer gewinnt bei mehreren Topics', () => {
    const e = deriveReadinessEntry(cand, ['a-topic', 'trading-platforms'],
      new Map([
        ['a-topic', [row({ topic: 'a-topic' })]],
        ['trading-platforms', [row()]],
      ]), audited);
    expect(e.topic).toBe('a-topic');
  });
});
