import { describe, expect, it } from 'vitest';
import {
  countRenderedWords,
  isWithinV2WordRange,
  V2_WORD_COUNT_RANGE,
} from '../../scripts/lib/rendered-word-count.mjs';

describe('countRenderedWords', () => {
  it('counts the MDX body alone when no structured frontmatter zones are present', () => {
    const body = 'one two three four five';
    const { total, breakdown } = countRenderedWords(body, {});
    expect(total).toBe(5);
    expect(breakdown).toEqual({
      body: 5,
      verdictSummary: 0,
      essentialFacts: 0,
      alternatives: 0,
      finalDecision: 0,
      faq: 0,
    });
  });

  it('sums MDX body + verdict.summary + essentialFacts[].context + alternatives[].whyInstead + finalDecision + faq[].answer', () => {
    const body = 'word '.repeat(10).trim(); // 10 words
    const frontmatter = {
      verdict: { summary: 'word '.repeat(20).trim() }, // 20
      essentialFacts: [
        { context: 'word '.repeat(5).trim() }, // 5
        { context: 'word '.repeat(5).trim() }, // 5
      ],
      alternatives: [
        { whyInstead: 'word '.repeat(8).trim() }, // 8
      ],
      finalDecision: 'word '.repeat(15).trim(), // 15
      faq: [
        { answer: 'word '.repeat(7).trim() }, // 7
        { answer: 'word '.repeat(3).trim() }, // 3
      ],
    };
    const { total, breakdown } = countRenderedWords(body, frontmatter);
    expect(breakdown).toEqual({
      body: 10,
      verdictSummary: 20,
      essentialFacts: 10,
      alternatives: 8,
      finalDecision: 15,
      faq: 10,
    });
    expect(total).toBe(10 + 20 + 10 + 8 + 15 + 10);
  });

  it('accepts finalDecision as an object with a summary field', () => {
    const { breakdown } = countRenderedWords('', {
      finalDecision: { summary: 'one two three' },
    });
    expect(breakdown.finalDecision).toBe(3);
  });

  it('strips JSX component tags and MDX comments before counting body words', () => {
    const body = [
      '## Fees',
      '',
      '{/* internal note, not reader-facing */}',
      '<SectionVerdict id="fees" />',
      'Real editorial sentence here with six words.',
      '<SomeWrapper>wrapped text stays</SomeWrapper>',
    ].join('\n');
    const { breakdown } = countRenderedWords(body, {});
    // "Fees" (heading text after marker strip) + the 7-word sentence + "wrapped text stays"
    expect(breakdown.body).toBe(1 + 7 + 3);
  });

  it('tolerates missing/malformed frontmatter arrays without throwing', () => {
    const { total } = countRenderedWords('a b c', {
      essentialFacts: 'not-an-array',
      alternatives: null,
      faq: undefined,
    });
    expect(total).toBe(3);
  });

  it('treats undefined frontmatter the same as an empty object', () => {
    const { total } = countRenderedWords('a b', undefined);
    expect(total).toBe(2);
  });
});

describe('isWithinV2WordRange', () => {
  it('exposes the documented 2,600–3,600 target range', () => {
    expect(V2_WORD_COUNT_RANGE).toEqual({ min: 2600, max: 3600 });
  });

  it('accepts the inclusive boundaries', () => {
    expect(isWithinV2WordRange(2600)).toBe(true);
    expect(isWithinV2WordRange(3600)).toBe(true);
  });

  it('rejects just outside the boundaries', () => {
    expect(isWithinV2WordRange(2599)).toBe(false);
    expect(isWithinV2WordRange(3601)).toBe(false);
  });

  it('accepts a typical mid-range value', () => {
    expect(isWithinV2WordRange(3100)).toBe(true);
  });
});
