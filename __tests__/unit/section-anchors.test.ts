// __tests__/unit/section-anchors.test.ts
// T0a / T4 (2026-07-18 review-redesign V2 foundation): the Nav-anchor /
// zone-ownership matrix must live as ONE typed constant, imported by Nav,
// Layout, and the validator — never re-typed as a comment (comments drift).
// See lib/reviews/section-anchors.ts and plan section T0a.

import { describe, expect, it } from 'vitest';
import {
  REVIEW_V2_ANCHORS,
  MDX_ANCHOR_IDS,
} from '@/lib/reviews/section-anchors';

describe('REVIEW_V2_ANCHORS', () => {
  it('has exactly 7 anchors (the Betreiber-Konzept nav-point cap)', () => {
    expect(REVIEW_V2_ANCHORS.length).toBe(7);
  });

  it('has exactly 5 mdx-owned anchors and 2 layout-owned anchors', () => {
    const mdxOwned = REVIEW_V2_ANCHORS.filter((a) => a.owner === 'mdx');
    const layoutOwned = REVIEW_V2_ANCHORS.filter((a) => a.owner === 'layout');
    expect(mdxOwned.length).toBe(5);
    expect(layoutOwned.length).toBe(2);
  });

  it('owns Verdict and Alternatives as layout (no MDX doubling)', () => {
    const layoutIds = REVIEW_V2_ANCHORS.filter((a) => a.owner === 'layout').map((a) => a.id);
    expect(layoutIds).toEqual(['verdict', 'alternatives']);
  });

  it('owns Fees/Markets/Platform/Safety/Support as mdx, in order', () => {
    const mdxIds = REVIEW_V2_ANCHORS.filter((a) => a.owner === 'mdx').map((a) => a.id);
    expect(mdxIds).toEqual(['fees', 'markets', 'platform', 'safety', 'support']);
  });

  it('matches the T0a matrix ids/titles/owners exactly, in order', () => {
    expect(REVIEW_V2_ANCHORS).toEqual([
      { id: 'verdict', title: 'Verdict', owner: 'layout' },
      { id: 'fees', title: 'Fees', owner: 'mdx' },
      { id: 'markets', title: 'Markets & Tools', owner: 'mdx' },
      { id: 'platform', title: 'Platform Experience', owner: 'mdx' },
      { id: 'safety', title: 'Safety & Regulation', owner: 'mdx' },
      { id: 'support', title: 'Support', owner: 'mdx' },
      { id: 'alternatives', title: 'Alternatives', owner: 'layout' },
    ]);
  });

  it('has unique ids (no duplicate nav anchors)', () => {
    const ids = REVIEW_V2_ANCHORS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('MDX_ANCHOR_IDS', () => {
  it('is derived from REVIEW_V2_ANCHORS, not a second hand-typed list', () => {
    const expected = REVIEW_V2_ANCHORS.filter((a) => a.owner === 'mdx').map((a) => a.id);
    expect(MDX_ANCHOR_IDS).toEqual(expected);
  });

  it('has exactly the 5 mdx-owned ids', () => {
    expect(MDX_ANCHOR_IDS).toEqual(['fees', 'markets', 'platform', 'safety', 'support']);
  });

  it('never includes a layout-owned id (verdict/alternatives)', () => {
    expect(MDX_ANCHOR_IDS).not.toContain('verdict');
    expect(MDX_ANCHOR_IDS).not.toContain('alternatives');
  });
});
