import { describe, expect, it } from 'vitest';

function classifyCompetitorScan(result: { scanned: number; failed: number }) {
  if (result.failed > 0) {
    return result.scanned > 0 ? 'partial' : 'error';
  }
  return 'success';
}

describe('sync-competitors status classification', () => {
  it('returns success when all keyword scans succeed', () => {
    expect(classifyCompetitorScan({ scanned: 12, failed: 0 })).toBe('success');
  });

  it('returns partial when some scans fail', () => {
    expect(classifyCompetitorScan({ scanned: 8, failed: 4 })).toBe('partial');
  });

  it('returns error when all scans fail', () => {
    expect(classifyCompetitorScan({ scanned: 0, failed: 5 })).toBe('error');
  });
});
