// __tests__/unit/verdict-frontmatter.test.ts
// T5 (2026-07-18 review-redesign V2 foundation): §30.1 word-length rules and
// structural rules for V2 review frontmatter, enforced as Zod refinements —
// so a violation fails a test, not a human editorial review. See
// lib/reviews/verdict-frontmatter.ts and the parent plan's "Technische
// Härtung" point 3.
//
// normalizeVerdictFrontmatter() must NEVER throw during the build — it
// always returns { ok: true, data } or { ok: false, issues }. The
// build/quality-gate consumes `issues`; it does not catch an exception.

import { describe, expect, it } from 'vitest';
import { normalizeVerdictFrontmatter } from '@/lib/reviews/verdict-frontmatter';

// n-word string, e.g. words(18) -> "word word word ... " (18 tokens)
function words(n: number): string {
  return Array.from({ length: n }, () => 'word').join(' ');
}

function validEssentialFact(i: number) {
  return {
    label: `Fact ${i}`,
    value: `Value ${i}`,
    context: 'Some context sentence about this fact.',
    asOf: '2026-07-18',
    sourceHref: 'https://example.com/source',
  };
}

function validAlternative(i: number) {
  return {
    slug: `alt-${i}`,
    name: `Alt ${i}`,
    whyInstead: words(20),
  };
}

// A minimal, fully valid V2 frontmatter bundle — every length rule centered
// safely inside its range, every required-count rule satisfied.
function buildValid(overrides: Record<string, unknown> = {}) {
  return {
    verdict: {
      positioning: words(24),
      summary: words(90),
      bestFor: ['Active traders', 'Beginners wanting one app'],
      notFor: ['High-frequency scalpers'],
      topStrengths: ['No options fee', 'Wide asset range'],
      mainLimitation: 'Customer support response times can be slow during peak hours.',
      bestAlternative: { name: 'Example Alt', slug: 'example-alt', reason: 'Lower minimum deposit.' },
    },
    essentialFacts: [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)],
    alternatives: [validAlternative(1), validAlternative(2)],
    sectionVerdicts: { fees: words(20), markets: words(20) },
    finalDecision: words(100),
    faq: [{ question: 'Is it safe?', answer: words(60) }],
    ...overrides,
  };
}

describe('normalizeVerdictFrontmatter — happy path', () => {
  it('never throws, and returns ok:true for a fully valid bundle', () => {
    expect(() => normalizeVerdictFrontmatter(buildValid())).not.toThrow();
    const result = normalizeVerdictFrontmatter(buildValid());
    expect(result.ok).toBe(true);
  });

  it('never throws for garbage input either — returns ok:false with issues', () => {
    expect(() => normalizeVerdictFrontmatter(null)).not.toThrow();
    expect(() => normalizeVerdictFrontmatter(undefined)).not.toThrow();
    expect(() => normalizeVerdictFrontmatter('not an object')).not.toThrow();
    expect(() => normalizeVerdictFrontmatter(42)).not.toThrow();
    const result = normalizeVerdictFrontmatter(null);
    expect(result.ok).toBe(false);
  });
});

describe('normalizeVerdictFrontmatter — verdict.positioning (18-30 words)', () => {
  it('rejects 17 words (just under the floor)', () => {
    const result = normalizeVerdictFrontmatter(buildValid({ verdict: { ...buildValid().verdict, positioning: words(17) } }));
    expect(result.ok).toBe(false);
  });
  it('accepts 18 words (floor)', () => {
    const result = normalizeVerdictFrontmatter(buildValid({ verdict: { ...buildValid().verdict, positioning: words(18) } }));
    expect(result.ok).toBe(true);
  });
  it('accepts 30 words (ceiling)', () => {
    const result = normalizeVerdictFrontmatter(buildValid({ verdict: { ...buildValid().verdict, positioning: words(30) } }));
    expect(result.ok).toBe(true);
  });
  it('rejects 31 words (just over the ceiling)', () => {
    const result = normalizeVerdictFrontmatter(buildValid({ verdict: { ...buildValid().verdict, positioning: words(31) } }));
    expect(result.ok).toBe(false);
  });
});

describe('normalizeVerdictFrontmatter — verdict.summary (70-120 words)', () => {
  it('rejects 69 words', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ verdict: { ...buildValid().verdict, summary: words(69) } })).ok).toBe(false);
  });
  it('accepts 70 words (floor)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ verdict: { ...buildValid().verdict, summary: words(70) } })).ok).toBe(true);
  });
  it('accepts 120 words (ceiling)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ verdict: { ...buildValid().verdict, summary: words(120) } })).ok).toBe(true);
  });
  it('rejects 121 words', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ verdict: { ...buildValid().verdict, summary: words(121) } })).ok).toBe(false);
  });
});

describe('normalizeVerdictFrontmatter — sectionVerdicts values (15-30 words each)', () => {
  it('rejects 14 words', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ sectionVerdicts: { fees: words(14) } })).ok).toBe(false);
  });
  it('accepts 15 words (floor)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ sectionVerdicts: { fees: words(15) } })).ok).toBe(true);
  });
  it('accepts 30 words (ceiling)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ sectionVerdicts: { fees: words(30) } })).ok).toBe(true);
  });
  it('rejects 31 words', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ sectionVerdicts: { fees: words(31) } })).ok).toBe(false);
  });

  it('rejects an unknown key not in section-anchors.ts MDX_ANCHOR_IDS', () => {
    const result = normalizeVerdictFrontmatter(buildValid({ sectionVerdicts: { fees: words(20), bogus: words(20) } }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes('sectionVerdicts') && i.message.toLowerCase().includes('bogus'))).toBe(true);
    }
  });

  it('rejects a layout-owned id used as a sectionVerdicts key (verdict/alternatives are not mdx-owned)', () => {
    const result = normalizeVerdictFrontmatter(buildValid({ sectionVerdicts: { verdict: words(20) } }));
    expect(result.ok).toBe(false);
  });

  it('accepts all 5 mdx-owned keys at once', () => {
    const result = normalizeVerdictFrontmatter(
      buildValid({
        sectionVerdicts: {
          fees: words(20),
          markets: words(20),
          platform: words(20),
          safety: words(20),
          support: words(20),
        },
      })
    );
    expect(result.ok).toBe(true);
  });

  it('sectionVerdicts itself is optional — omitting it entirely is valid', () => {
    const { sectionVerdicts, ...rest } = buildValid();
    void sectionVerdicts;
    expect(normalizeVerdictFrontmatter(rest).ok).toBe(true);
  });
});

describe('normalizeVerdictFrontmatter — finalDecision (80-140 words, optional)', () => {
  it('is optional — omitting it entirely is valid', () => {
    const { finalDecision, ...rest } = buildValid();
    void finalDecision;
    expect(normalizeVerdictFrontmatter(rest).ok).toBe(true);
  });
  it('rejects 79 words when present', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ finalDecision: words(79) })).ok).toBe(false);
  });
  it('accepts 80 words (floor)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ finalDecision: words(80) })).ok).toBe(true);
  });
  it('accepts 140 words (ceiling)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ finalDecision: words(140) })).ok).toBe(true);
  });
  it('rejects 141 words', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ finalDecision: words(141) })).ok).toBe(false);
  });
});

describe('normalizeVerdictFrontmatter — faq[].answer (40-100 words, optional)', () => {
  it('is optional — omitting faq entirely is valid', () => {
    const { faq, ...rest } = buildValid();
    void faq;
    expect(normalizeVerdictFrontmatter(rest).ok).toBe(true);
  });
  it('rejects a 39-word answer', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ faq: [{ question: 'Q?', answer: words(39) }] })).ok).toBe(false);
  });
  it('accepts a 40-word answer (floor)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ faq: [{ question: 'Q?', answer: words(40) }] })).ok).toBe(true);
  });
  it('accepts a 100-word answer (ceiling)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ faq: [{ question: 'Q?', answer: words(100) }] })).ok).toBe(true);
  });
  it('rejects a 101-word answer', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ faq: [{ question: 'Q?', answer: words(101) }] })).ok).toBe(false);
  });
});

describe('normalizeVerdictFrontmatter — essentialFacts (4-6 entries, sourceHref + asOf required)', () => {
  it('rejects 3 facts (below the 4 floor)', () => {
    const result = normalizeVerdictFrontmatter(buildValid({ essentialFacts: [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3)] }));
    expect(result.ok).toBe(false);
  });
  it('accepts 4 facts (floor)', () => {
    const result = normalizeVerdictFrontmatter(
      buildValid({ essentialFacts: [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)] })
    );
    expect(result.ok).toBe(true);
  });
  it('accepts 6 facts (ceiling)', () => {
    const result = normalizeVerdictFrontmatter(
      buildValid({
        essentialFacts: [1, 2, 3, 4, 5, 6].map(validEssentialFact),
      })
    );
    expect(result.ok).toBe(true);
  });
  it('rejects 7 facts (over the ceiling)', () => {
    const result = normalizeVerdictFrontmatter(
      buildValid({
        essentialFacts: [1, 2, 3, 4, 5, 6, 7].map(validEssentialFact),
      })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes('essentialFacts'))).toBe(true);
    }
  });

  it('rejects a fact missing sourceHref', () => {
    const facts = [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)];
    delete (facts[0] as { sourceHref?: string }).sourceHref;
    const result = normalizeVerdictFrontmatter(buildValid({ essentialFacts: facts }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes('sourceHref'))).toBe(true);
    }
  });

  it('rejects a fact missing asOf', () => {
    const facts = [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)];
    delete (facts[0] as { asOf?: string }).asOf;
    const result = normalizeVerdictFrontmatter(buildValid({ essentialFacts: facts }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes('asOf'))).toBe(true);
    }
  });

  it('rejects a non-absolute-URL sourceHref', () => {
    const facts = [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)];
    facts[0] = { ...facts[0], sourceHref: 'not-a-url' };
    const result = normalizeVerdictFrontmatter(buildValid({ essentialFacts: facts }));
    expect(result.ok).toBe(false);
  });

  it('context is optional on an essential fact', () => {
    const facts = [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)];
    const { context, ...withoutContext } = facts[0];
    void context;
    facts[0] = withoutContext as typeof facts[0];
    expect(normalizeVerdictFrontmatter(buildValid({ essentialFacts: facts })).ok).toBe(true);
  });
});

describe('normalizeVerdictFrontmatter — alternatives (2-3 entries)', () => {
  it('rejects 1 alternative (below the 2 floor)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ alternatives: [validAlternative(1)] })).ok).toBe(false);
  });
  it('accepts 2 alternatives (floor)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ alternatives: [validAlternative(1), validAlternative(2)] })).ok).toBe(true);
  });
  it('accepts 3 alternatives (ceiling)', () => {
    expect(normalizeVerdictFrontmatter(buildValid({ alternatives: [validAlternative(1), validAlternative(2), validAlternative(3)] })).ok).toBe(true);
  });
  it('rejects 4 alternatives (over the ceiling)', () => {
    expect(
      normalizeVerdictFrontmatter(buildValid({ alternatives: [validAlternative(1), validAlternative(2), validAlternative(3), validAlternative(4)] })).ok
    ).toBe(false);
  });
});

describe('normalizeVerdictFrontmatter — verdict.bestFor/notFor/topStrengths (<=3 entries)', () => {
  it('rejects 4 bestFor entries', () => {
    const valid = buildValid();
    const result = normalizeVerdictFrontmatter(buildValid({ verdict: { ...valid.verdict, bestFor: ['a', 'b', 'c', 'd'] } }));
    expect(result.ok).toBe(false);
  });
  it('accepts exactly 3 bestFor entries', () => {
    const valid = buildValid();
    const result = normalizeVerdictFrontmatter(buildValid({ verdict: { ...valid.verdict, bestFor: ['a', 'b', 'c'] } }));
    expect(result.ok).toBe(true);
  });
});

describe('normalizeVerdictFrontmatter — required top-level blocks', () => {
  it('fails when verdict is missing entirely', () => {
    const { verdict, ...rest } = buildValid();
    void verdict;
    expect(normalizeVerdictFrontmatter(rest).ok).toBe(false);
  });
  it('fails when essentialFacts is missing entirely', () => {
    const { essentialFacts, ...rest } = buildValid();
    void essentialFacts;
    expect(normalizeVerdictFrontmatter(rest).ok).toBe(false);
  });
  it('fails when alternatives is missing entirely', () => {
    const { alternatives, ...rest } = buildValid();
    void alternatives;
    expect(normalizeVerdictFrontmatter(rest).ok).toBe(false);
  });
});
