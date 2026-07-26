// __tests__/unit/content-quality-score.test.ts
// Guards lib/reviews/content-quality.ts, which produces the 0-100 score used
// as the "Content Quality >= 90" publication gate in
// docs/reviews/broker-v2-standard.md.
//
// Until 2026-07-26 this logic lived inside lib/actions/content-hub.ts — a
// 'use server' module, which may only export async server actions, so it
// could not be imported by a test at all. The whole suite ran green while the
// approved V2 reference scored 33/100. Hence this file: the gate now has a
// test behind it, and the V1 corpus has a regression guard.

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { computeContentQuality } from '@/lib/reviews/content-quality';

const REPO = process.cwd();
const read = (rel: string) => matter(fs.readFileSync(path.join(REPO, rel), 'utf8'));
const bodyWords = (body: string) => body.split(/\s+/).filter(Boolean).length;

/** Scores a real review file the way content-hub.ts does. */
function scoreFile(rel: string) {
  const { content, data } = read(rel);
  const isV2 = data.reviewLayout === 'v2';
  return computeContentQuality(content, bodyWords(content), isV2, data);
}

describe('content quality score — V2 reference', () => {
  const REFERENCE = 'content/us/trading/etoro-review.mdx';

  it('scores the approved V2 reference at or above the publication gate', () => {
    const q = scoreFile(REFERENCE);
    // The reference satisfies the contract, so it must clear the gate it is
    // measured against. Before the scorer became V2-aware it scored 33.
    expect(q.score).toBeGreaterThanOrEqual(90);
  });

  it('credits the frontmatter zones the layout renders, not just the body', () => {
    const { content, data } = read(REFERENCE);

    // Same body, but the structured zones stripped away. Every subscore that
    // reads frontmatter must drop — this is what made the reference look empty
    // before: 2,092 body words, no visible links, no recognised structure.
    const withFrontmatter = computeContentQuality(content, bodyWords(content), true, data);
    const bodyOnly = computeContentQuality(content, bodyWords(content), true, {});

    expect(withFrontmatter.wordScore).toBeGreaterThan(bodyOnly.wordScore);
    expect(withFrontmatter.structureScore).toBeGreaterThan(bodyOnly.structureScore);
    expect(withFrontmatter.linkScore).toBeGreaterThan(bodyOnly.linkScore);
  });

  it('is not overfitted to the reference: a gutted V2 review scores badly', () => {
    const { data } = read(REFERENCE);
    const empty = computeContentQuality('', 0, true, data);
    expect(empty.score).toBeLessThan(90);
  });
});

describe('content quality score — V1 regression guard', () => {
  // V1 scoring must not shift when the V2 branches change. These are real
  // files; if a future edit to the V2 path leaks into the shared code, the
  // numbers below move and this test fails.
  // charles-schwab-review and fidelity-review are deliberately absent: both
  // have been migrated to V2 and no longer score on the V1 path. Each
  // migration tripped this test first, which is the behaviour intended — a
  // file changing tier should never pass silently.
  const V1_EXPECTED: Record<string, number> = {
    'content/us/trading/etrade-review.mdx': 87,
    'content/us/trading/tastytrade-review.mdx': 87,
    'content/us/trading/robinhood-review.mdx': 87,
    'content/us/trading/webull-review.mdx': 87,
    'content/us/forex/oanda-review.mdx': 87,
  };

  for (const [file, expected] of Object.entries(V1_EXPECTED)) {
    it(`${path.basename(file)} still scores ${expected}`, () => {
      expect(scoreFile(file).score).toBe(expected);
    });
  }

  it('ignores frontmatter for V1 files — they are scored on the body alone', () => {
    const file = 'content/us/trading/robinhood-review.mdx';
    const { content, data } = read(file);
    const withFm = computeContentQuality(content, bodyWords(content), false, data);
    const withoutFm = computeContentQuality(content, bodyWords(content), false, {});
    expect(withFm).toEqual(withoutFm);
  });
});
