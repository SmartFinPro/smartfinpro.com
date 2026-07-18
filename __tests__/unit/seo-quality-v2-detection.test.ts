import { describe, expect, it } from 'vitest';
import { isV2Frontmatter, scoreV2File, V2_WORD_COUNT_RANGE } from '../../scripts/lib/seo-quality-v2.mjs';

describe('isV2Frontmatter', () => {
  it('is true only when reviewLayout is exactly the string "v2"', () => {
    expect(isV2Frontmatter({ reviewLayout: 'v2' })).toBe(true);
  });

  it('is false for V1 pages (no reviewLayout field)', () => {
    expect(isV2Frontmatter({ title: 'Some Review' })).toBe(false);
  });

  it('is false for unrelated/garbage values, including case variants', () => {
    expect(isV2Frontmatter({ reviewLayout: 'V2' })).toBe(false);
    expect(isV2Frontmatter({ reviewLayout: 'v1' })).toBe(false);
    expect(isV2Frontmatter({ reviewLayout: true })).toBe(false);
  });

  it('tolerates missing/null frontmatter', () => {
    expect(isV2Frontmatter(null)).toBe(false);
    expect(isV2Frontmatter(undefined)).toBe(false);
    expect(isV2Frontmatter({})).toBe(false);
  });
});

// A complete, in-range V2 fixture — every field present, word count centered
// in the 2,600–3,600 target range.
function buildCompleteFrontmatter(overrides: Record<string, unknown> = {}) {
  return {
    reviewLayout: 'v2',
    title: 'eToro Review 2026',
    verdict: { summary: 'word '.repeat(90).trim() },
    essentialFacts: [
      { context: 'word '.repeat(80).trim(), sourceHref: 'https://example.com', asOf: '2026-07-18' },
      { context: 'word '.repeat(80).trim(), sourceHref: 'https://example.com', asOf: '2026-07-18' },
    ],
    alternatives: [{ whyInstead: 'word '.repeat(80).trim() }],
    finalDecision: 'word '.repeat(80).trim(),
    faq: [{ answer: 'word '.repeat(60).trim() }],
    ...overrides,
  };
}

// ~2,720-word MDX body — 5 sections of ~544 words, comfortably inside range
// once combined with the frontmatter zones below (kept lean to isolate the
// body's own contribution from the frontmatter-zone contribution).
const IN_RANGE_BODY = Array.from({ length: 5 }, (_, i) => `## Section ${i + 1}\n\n${'word '.repeat(500).trim()}`).join('\n\n');

describe('scoreV2File', () => {
  it('scores 10.0 with no issues when verdict/essentialFacts/alternatives are present and the rendered word count is in range', () => {
    const frontmatterData = buildCompleteFrontmatter();
    const result = scoreV2File({ fm: 'title: "eToro Review 2026"', body: IN_RANGE_BODY, frontmatterData });
    expect(result.issues).toEqual([]);
    expect(result.score).toBe(10.0);
    expect(result.wordCount).toBeGreaterThanOrEqual(V2_WORD_COUNT_RANGE.min);
    expect(result.wordCount).toBeLessThanOrEqual(V2_WORD_COUNT_RANGE.max);
  });

  it('flags NO_VERDICT and deducts 3.0 when verdict.summary is missing', () => {
    const frontmatterData = buildCompleteFrontmatter({ verdict: undefined });
    const result = scoreV2File({ fm: 'title: "x"', body: IN_RANGE_BODY, frontmatterData });
    expect(result.issues).toContain('NO_VERDICT');
    expect(result.score).toBeLessThanOrEqual(7.0);
  });

  it('flags NO_FACTS when essentialFacts is missing or empty', () => {
    const empty = scoreV2File({ fm: 'title: "x"', body: IN_RANGE_BODY, frontmatterData: buildCompleteFrontmatter({ essentialFacts: [] }) });
    expect(empty.issues).toContain('NO_FACTS');

    const missing = scoreV2File({ fm: 'title: "x"', body: IN_RANGE_BODY, frontmatterData: buildCompleteFrontmatter({ essentialFacts: undefined }) });
    expect(missing.issues).toContain('NO_FACTS');
  });

  it('flags NO_ALTERNATIVES when alternatives is missing or empty', () => {
    const result = scoreV2File({ fm: 'title: "x"', body: IN_RANGE_BODY, frontmatterData: buildCompleteFrontmatter({ alternatives: [] }) });
    expect(result.issues).toContain('NO_ALTERNATIVES');
  });

  it('flags a WC_V2_ issue with the actual count when the rendered word count is out of range (too low)', () => {
    const frontmatterData = buildCompleteFrontmatter({
      verdict: { summary: 'short' },
      essentialFacts: [{ context: 'short' }],
      alternatives: [{ whyInstead: 'short' }],
      finalDecision: 'short',
      faq: [{ answer: 'short' }],
    });
    const result = scoreV2File({ fm: 'title: "x"', body: '## Fees\n\nvery short body', frontmatterData });
    expect(result.issues.some((i) => i.startsWith('WC_V2_'))).toBe(true);
    expect(result.wordCount).toBeLessThan(V2_WORD_COUNT_RANGE.min);
  });

  it('flags a WC_V2_ issue when the rendered word count is too high', () => {
    const bloatedBody = Array.from({ length: 5 }, (_, i) => `## Section ${i + 1}\n\n${'word '.repeat(900).trim()}`).join('\n\n');
    const result = scoreV2File({ fm: 'title: "x"', body: bloatedBody, frontmatterData: buildCompleteFrontmatter() });
    expect(result.issues.some((i) => i.startsWith('WC_V2_'))).toBe(true);
    expect(result.wordCount).toBeGreaterThan(V2_WORD_COUNT_RANGE.max);
  });

  it('flags TITLE_<n>c when the title exceeds 65 characters, same convention as V1', () => {
    const longTitle = 'a'.repeat(70);
    const result = scoreV2File({
      fm: `title: "${longTitle}"`,
      body: IN_RANGE_BODY,
      frontmatterData: buildCompleteFrontmatter(),
    });
    expect(result.issues).toContain(`TITLE_${longTitle.length}c`);
  });

  it('never checks V1-only signals (rating, ExpertBox, AffiliateButton, TrustAuthority, AutoDisclaimer) for V2 pages', () => {
    // A V2 fixture with none of the V1 MDX tags and no `rating:` frontmatter
    // must still be able to reach a perfect score — V1 machinery must not
    // leak into the V2 rubric.
    const frontmatterData = buildCompleteFrontmatter();
    const result = scoreV2File({ fm: 'title: "eToro Review 2026"', body: IN_RANGE_BODY, frontmatterData });
    expect(result.score).toBe(10.0);
  });
});
