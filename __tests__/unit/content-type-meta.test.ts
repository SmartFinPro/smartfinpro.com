// __tests__/unit/content-type-meta.test.ts
import { describe, it, expect } from 'vitest';
import { CONTENT_TYPE_META, CONTENT_TYPES } from '@/components/marketing/content-type-meta';

describe('CONTENT_TYPE_META', () => {
  it('exposes the four content types', () => {
    expect(CONTENT_TYPES).toEqual(['review', 'guide', 'protocol', 'playbook']);
  });

  it('maps every type to a non-empty label', () => {
    expect(CONTENT_TYPE_META.review.label).toBe('Review');
    expect(CONTENT_TYPE_META.guide.label).toBe('Guide');
    expect(CONTENT_TYPE_META.protocol.label).toBe('Protocol');
    expect(CONTENT_TYPE_META.playbook.label).toBe('Playbook');
  });

  it('groups light types (review/guide) apart from dark types (protocol/playbook)', () => {
    expect(CONTENT_TYPE_META.review.tone).toBe('light');
    expect(CONTENT_TYPE_META.guide.tone).toBe('light');
    expect(CONTENT_TYPE_META.protocol.tone).toBe('dark');
    expect(CONTENT_TYPE_META.playbook.tone).toBe('dark');
  });
});
