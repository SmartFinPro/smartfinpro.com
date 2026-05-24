import { describe, expect, it } from 'vitest';
import { inferKeywordDataSource, isRankingDataStale } from '@/lib/actions/ranking';

describe('inferKeywordDataSource', () => {
  it('marks seeded keywords when position and traffic are zero', () => {
    expect(
      inferKeywordDataSource({
        keyword: 'best ai writer',
        current_position: 0,
        clicks: 0,
        impressions: 0,
      }),
    ).toBe('seeded');
  });

  it('marks gsc keywords when position exists and traffic exists', () => {
    expect(
      inferKeywordDataSource({
        keyword: 'jasper ai review',
        current_position: 4.2,
        clicks: 12,
        impressions: 130,
      }),
    ).toBe('gsc');
  });

  it('marks serper keywords when position exists without traffic', () => {
    expect(
      inferKeywordDataSource({
        keyword: 'etoro review',
        current_position: 8,
        clicks: 0,
        impressions: 0,
      }),
    ).toBe('serper');
  });
});

describe('isRankingDataStale', () => {
  it('returns true when data is older than the freshness window', () => {
    const old = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();
    expect(isRankingDataStale(old)).toBe(true);
  });
});
