// __tests__/unit/mdx-normalize-frontmatter.test.ts
// Fake-freshness guard: missing frontmatter dates must stay undefined —
// never silently default to "today" (spec: research-discovery-catalog-design §4.3).
// A missing date is enforced as a build error by scripts/check-frontmatter.mjs,
// so downstream consumers may rely on publishDate existing for real content.

import { describe, it, expect } from 'vitest';
import { normalizeFrontmatter } from '@/lib/mdx';

const base = {
  title: 'Test Review',
  description: 'Test description',
  market: 'us',
  category: 'trading',
};

describe('normalizeFrontmatter — date handling', () => {
  it('leaves publishDate and modifiedDate undefined when frontmatter has no dates', () => {
    const meta = normalizeFrontmatter({ ...base });
    expect(meta.publishDate).toBeUndefined();
    expect(meta.modifiedDate).toBeUndefined();
  });

  it('never invents today for missing dates (no fake freshness, no "undefined" string)', () => {
    const today = new Date().toISOString().split('T')[0];
    const meta = normalizeFrontmatter({ ...base });
    expect(meta.publishDate).not.toBe(today);
    expect(meta.modifiedDate).not.toBe(today);
    expect(meta.publishDate).not.toBe('undefined');
    expect(meta.modifiedDate).not.toBe('undefined');
  });

  it('maps legacy `date` to both publishDate and modifiedDate', () => {
    const meta = normalizeFrontmatter({ ...base, date: '2026-01-15' });
    expect(meta.publishDate).toBe('2026-01-15');
    expect(meta.modifiedDate).toBe('2026-01-15');
  });

  it('keeps explicit publishDate and modifiedDate as-is', () => {
    const meta = normalizeFrontmatter({
      ...base,
      publishDate: '2026-01-01',
      modifiedDate: '2026-03-02',
    });
    expect(meta.publishDate).toBe('2026-01-01');
    expect(meta.modifiedDate).toBe('2026-03-02');
  });

  it('does not backfill modifiedDate from publishDate — consumers decide via || chains', () => {
    const meta = normalizeFrontmatter({ ...base, publishDate: '2026-01-01' });
    expect(meta.publishDate).toBe('2026-01-01');
    expect(meta.modifiedDate).toBeUndefined();
  });

  it('treats empty-string dates as missing', () => {
    const meta = normalizeFrontmatter({ ...base, publishDate: '', date: '' });
    expect(meta.publishDate).toBeUndefined();
    expect(meta.modifiedDate).toBeUndefined();
  });
});
