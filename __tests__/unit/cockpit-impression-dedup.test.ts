// __tests__/unit/cockpit-impression-dedup.test.ts
// Session-scoped impression dedup: key format, first-fire-only semantics,
// 500-entry FIFO cap and corrupt-storage fallback.

import { describe, it, expect } from 'vitest';
import {
  impressionKey,
  createImpressionDeduper,
  IMPRESSION_STORAGE_KEY,
  type KeyValueStorage,
} from '@/lib/analytics/cockpit-events';

function makeFakeStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe('impressionKey()', () => {
  it('is page|surface|slug', () => {
    expect(impressionKey('/au/forex/best/forex-brokers', 'card', 'pepperstone')).toBe(
      '/au/forex/best/forex-brokers|card|pepperstone',
    );
  });

  it('omits slug for surface-level impressions', () => {
    expect(impressionKey('/p', 'cockpit')).toBe('/p|cockpit|');
  });
});

describe('createImpressionDeduper()', () => {
  it('fires once per key, then dedupes', () => {
    const d = createImpressionDeduper(makeFakeStorage());
    expect(d.markSeen('a')).toBe(true);
    expect(d.markSeen('a')).toBe(false);
    expect(d.hasSeen('a')).toBe(true);
    expect(d.hasSeen('b')).toBe(false);
  });

  it('persists to storage and re-hydrates across instances (same session)', () => {
    const storage = makeFakeStorage();
    const d1 = createImpressionDeduper(storage);
    d1.markSeen('x');
    const d2 = createImpressionDeduper(storage);
    expect(d2.markSeen('x')).toBe(false); // still deduped after "remount"
  });

  it('caps persisted keys at 500 (FIFO eviction of oldest)', () => {
    const storage = makeFakeStorage();
    const d = createImpressionDeduper(storage);
    for (let i = 0; i < 510; i++) d.markSeen(`k${i}`);
    const persisted = JSON.parse(storage.data[IMPRESSION_STORAGE_KEY]) as string[];
    expect(persisted).toHaveLength(500);
    expect(persisted).not.toContain('k0'); // oldest evicted
    expect(persisted).toContain('k509'); // newest kept
  });

  it('falls back to in-memory dedup on corrupt storage', () => {
    const storage = makeFakeStorage({ [IMPRESSION_STORAGE_KEY]: '{not-json' });
    const d = createImpressionDeduper(storage);
    expect(d.markSeen('a')).toBe(true);
    expect(d.markSeen('a')).toBe(false);
  });

  it('survives a throwing storage (privacy mode) without propagating', () => {
    const throwing: KeyValueStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    const d = createImpressionDeduper(throwing);
    expect(d.markSeen('a')).toBe(true);
    expect(d.markSeen('a')).toBe(false);
  });

  it('works without any storage (SSR safety)', () => {
    const d = createImpressionDeduper(null);
    expect(d.markSeen('a')).toBe(true);
    expect(d.markSeen('a')).toBe(false);
  });
});
