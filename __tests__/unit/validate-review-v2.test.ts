// __tests__/unit/validate-review-v2.test.ts
// Broker-V2 publication contract guard — docs/reviews/broker-v2-standard.md.
//
// validateReviewV2() is pure (no file IO, no process.exit, no console
// output) — see lib/reviews/validate-review-v2.ts. It reuses
// normalizeVerdictFrontmatter() (lib/reviews/verdict-frontmatter.ts) for
// the schema-level rules and REVIEW_V2_ANCHORS/MDX_ANCHOR_IDS
// (lib/reviews/section-anchors.ts) for the 5 mdx-owned section ids/titles
// — this suite does not re-test those (see verdict-frontmatter.test.ts /
// section-anchors.test.ts), only the "pluses" this module adds on top:
// sectionVerdicts/finalDecision/faq/dataVerifiedDate/updateLog/
// modifiedDate required-ness, the body's span+H2+SectionVerdict triple
// structure, and alternatives path resolution.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';

import { validateReviewV2 } from '@/lib/reviews/validate-review-v2';

// n-word string, e.g. words(18) -> "word word word ... " (18 tokens)
function words(n: number): string {
  return Array.from({ length: n }, () => 'word').join(' ');
}

const ISO = '2026-07-18';

function validEssentialFact(i: number) {
  return {
    label: `Fact ${i}`,
    value: `Value ${i}`,
    context: 'Some context sentence about this fact.',
    asOf: ISO,
    sourceHref: 'https://example.com/source',
  };
}

function validAlternative(slug: string, name: string) {
  return { slug, name, whyInstead: words(20) };
}

function validFaqEntry(i: number) {
  return { question: `Question ${i}?`, answer: words(60) };
}

// A minimal, fully valid V2 frontmatter bundle, shaped like eToro's:
// verdict + essentialFacts + alternatives (the schema's own pflicht) PLUS
// every guard-added plus (sectionVerdicts all 5 keys, finalDecision, faq
// 4 entries, dataVerifiedDate, updateLog, modifiedDate) — every rule
// centered safely inside its range.
function buildValidFrontmatter(overrides: Record<string, unknown> = {}) {
  return {
    market: 'us',
    category: 'trading',
    verdict: {
      positioning: words(24),
      summary: words(90),
      bestFor: ['Active traders', 'Beginners wanting one app'],
      notFor: ['High-frequency scalpers'],
      topStrengths: ['No options fee', 'Wide asset range'],
      mainLimitation: 'Customer support response times can be slow during peak hours.',
    },
    essentialFacts: [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)],
    alternatives: [validAlternative('fidelity-review', 'Fidelity'), validAlternative('webull-review', 'Webull')],
    sectionVerdicts: {
      fees: words(20),
      markets: words(20),
      platform: words(20),
      safety: words(20),
      support: words(20),
    },
    finalDecision: words(100),
    faq: [validFaqEntry(1), validFaqEntry(2), validFaqEntry(3), validFaqEntry(4)],
    dataVerifiedDate: ISO,
    updateLog: [{ date: ISO, change: 'Migrated to the V2 format; facts checked against primary sources.' }],
    modifiedDate: ISO,
    ...overrides,
  };
}

// The 5-section triple body, in REVIEW_V2_ANCHORS order — mirrors eToro's shape.
function buildValidBody(): string {
  return [
    '<span id="fees"></span>',
    '',
    '## Fees',
    '',
    '<SectionVerdict id="fees" />',
    '',
    'Prose about fees goes here for readers to weigh the cost structure.',
    '',
    '<span id="markets"></span>',
    '',
    '## Markets & Tools',
    '',
    '<SectionVerdict id="markets" />',
    '',
    'Prose about markets and tools available on the platform.',
    '',
    '<span id="platform"></span>',
    '',
    '## Platform Experience',
    '',
    '<SectionVerdict id="platform" />',
    '',
    'Prose about the platform experience and mobile app.',
    '',
    '<span id="safety"></span>',
    '',
    '## Safety & Regulation',
    '',
    '<SectionVerdict id="safety" />',
    '',
    'Prose about safety, regulation, and deposit insurance.',
    '',
    '<span id="support"></span>',
    '',
    '## Support',
    '',
    '<SectionVerdict id="support" />',
    '',
    'Prose about support channels and response times.',
  ].join('\n');
}

const KNOWN_PATHS = ['/us/trading/fidelity-review', '/us/trading/webull-review'];
const FILE_PATH = 'content/us/trading/synthetic-review.mdx';

function run(frontmatter: Record<string, unknown> = buildValidFrontmatter(), body: string = buildValidBody(), knownReviewPaths: readonly string[] = KNOWN_PATHS) {
  return validateReviewV2({ filePath: FILE_PATH, frontmatter, body, knownReviewPaths });
}

describe('validateReviewV2 — valid fixture (eToro shape)', () => {
  it('passes with ok:true and no issues', () => {
    const result = run();
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('never throws', () => {
    expect(() => run()).not.toThrow();
  });
});

describe('validateReviewV2 — frontmatter pluses', () => {
  it('fails when sectionVerdicts is missing entirely', () => {
    const { sectionVerdicts: _sectionVerdicts, ...rest } = buildValidFrontmatter();
    void _sectionVerdicts;
    const result = run(rest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'sectionVerdicts')).toBe(true);
  });

  it('fails when sectionVerdicts is missing one of the 5 keys', () => {
    const fm = buildValidFrontmatter();
    const { support: _support, ...partial } = fm.sectionVerdicts as Record<string, string>;
    void _support;
    const result = run(buildValidFrontmatter({ sectionVerdicts: partial }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'sectionVerdicts.support')).toBe(true);
  });

  it('fails when finalDecision is present but too short (schema word-count rule)', () => {
    const result = run(buildValidFrontmatter({ finalDecision: words(10) }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'finalDecision')).toBe(true);
  });

  it('fails when finalDecision is missing entirely', () => {
    const { finalDecision: _finalDecision, ...rest } = buildValidFrontmatter();
    void _finalDecision;
    const result = run(rest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'finalDecision')).toBe(true);
  });

  it('fails when faq has only 3 entries (below the 4 floor)', () => {
    const result = run(buildValidFrontmatter({ faq: [validFaqEntry(1), validFaqEntry(2), validFaqEntry(3)] }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'faq')).toBe(true);
  });

  it('fails when faq is missing entirely', () => {
    const { faq: _faq, ...rest } = buildValidFrontmatter();
    void _faq;
    const result = run(rest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'faq')).toBe(true);
  });

  it('fails when dataVerifiedDate is older than the newest essentialFacts[].asOf', () => {
    const result = run(
      buildValidFrontmatter({
        dataVerifiedDate: '2026-01-01',
        essentialFacts: [
          validEssentialFact(1),
          validEssentialFact(2),
          validEssentialFact(3),
          { ...validEssentialFact(4), asOf: '2026-07-20' },
        ],
      })
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'dataVerifiedDate')).toBe(true);
  });

  it('fails when dataVerifiedDate is missing entirely', () => {
    const { dataVerifiedDate: _dataVerifiedDate, ...rest } = buildValidFrontmatter();
    void _dataVerifiedDate;
    const result = run(rest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'dataVerifiedDate')).toBe(true);
  });

  it('fails when modifiedDate is missing entirely', () => {
    const { modifiedDate: _modifiedDate, ...rest } = buildValidFrontmatter();
    void _modifiedDate;
    const result = run(rest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'modifiedDate')).toBe(true);
  });

  it('fails when modifiedDate is not an ISO date', () => {
    const result = run(buildValidFrontmatter({ modifiedDate: '18 July 2026' }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'modifiedDate')).toBe(true);
  });

  it('fails when updateLog is an empty array', () => {
    const result = run(buildValidFrontmatter({ updateLog: [] }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'updateLog')).toBe(true);
  });

  it('fails when updateLog is missing entirely', () => {
    const { updateLog: _updateLog, ...rest } = buildValidFrontmatter();
    void _updateLog;
    const result = run(rest);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'updateLog')).toBe(true);
  });

  it('fails when an updateLog entry is missing `change`', () => {
    const result = run(buildValidFrontmatter({ updateLog: [{ date: ISO }] }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'updateLog.0.change')).toBe(true);
  });

  it('fails when an updateLog entry is missing `date`', () => {
    const result = run(buildValidFrontmatter({ updateLog: [{ change: 'Something changed.' }] }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'updateLog.0.date')).toBe(true);
  });
});

describe('validateReviewV2 — essentialFacts sourceHref (URL form only, no network access)', () => {
  it('fails when a sourceHref is not a URL', () => {
    const facts = [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)];
    facts[0] = { ...facts[0], sourceHref: 'not-a-url' };
    const result = run(buildValidFrontmatter({ essentialFacts: facts }));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path.includes('sourceHref'))).toBe(true);
  });
});

describe('validateReviewV2 — body structure (span + H2 + SectionVerdict triples)', () => {
  it('fails when a <SectionVerdict> is missing for a section', () => {
    const body = buildValidBody().replace('<SectionVerdict id="fees" />\n\n', '');
    const result = run(buildValidFrontmatter(), body);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'body.fees')).toBe(true);
  });

  it('fails when a <SectionVerdict> carries the wrong id', () => {
    const body = buildValidBody().replace('<SectionVerdict id="fees" />', '<SectionVerdict id="markets" />');
    const result = run(buildValidFrontmatter(), body);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'body.fees')).toBe(true);
  });

  it('fails when two whole sections are swapped (H2 out of order)', () => {
    const feesTriple = '<span id="fees"></span>\n\n## Fees\n\n<SectionVerdict id="fees" />';
    const marketsTriple = '<span id="markets"></span>\n\n## Markets & Tools\n\n<SectionVerdict id="markets" />';
    let body = buildValidBody();
    body = body.replace(feesTriple, '__MARKETS_PLACEHOLDER__').replace(marketsTriple, feesTriple);
    body = body.replace('__MARKETS_PLACEHOLDER__', marketsTriple);
    const result = run(buildValidFrontmatter(), body);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'body.fees' || i.path === 'body.markets')).toBe(true);
  });

  it('fails when an extra H2 is added to the body', () => {
    const body = `${buildValidBody()}\n\n## Bonus Section\n\nSome extra content that should not be here.`;
    const result = run(buildValidFrontmatter(), body);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'body' && i.message.includes('found 6'))).toBe(true);
  });

  it('fails when a section is missing altogether (only 4 H2s)', () => {
    const supportTriple = '<span id="support"></span>\n\n## Support\n\n<SectionVerdict id="support" />';
    const body = buildValidBody().replace(`\n\n${supportTriple}`, '');
    const result = run(buildValidFrontmatter(), body);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'body')).toBe(true);
  });

  it('fails when the body contains an H1 (the H1 comes from the layout, never the body)', () => {
    const body = `# Should not be here\n\n${buildValidBody()}`;
    const result = run(buildValidFrontmatter(), body);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === 'body' && i.message.includes('H1'))).toBe(true);
  });
});

describe('validateReviewV2 — alternatives (full-path resolution)', () => {
  it('fails on a self-link (alternative resolves to the review\'s own path)', () => {
    const result = run(
      buildValidFrontmatter({
        alternatives: [validAlternative('synthetic-review', 'Self'), validAlternative('webull-review', 'Webull')],
      })
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes('self-link'))).toBe(true);
  });

  it('fails on a duplicate alternative entry', () => {
    const result = run(
      buildValidFrontmatter({
        alternatives: [validAlternative('fidelity-review', 'Fidelity'), validAlternative('fidelity-review', 'Fidelity Again')],
      })
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes('duplicate'))).toBe(true);
  });

  it('fails on a dead alternative path (does not exist in knownReviewPaths)', () => {
    const result = run(
      buildValidFrontmatter({
        alternatives: [validAlternative('fidelity-review', 'Fidelity'), validAlternative('nonexistent-broker-review', 'Ghost Broker')],
      })
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes('does not exist'))).toBe(true);
  });

  it('resolves the FULL path, not the bare slug — a same-slug alternative in a different knownReviewPaths set still needs its own market/category entry', () => {
    // etoro-review exists in 4 markets; a bare-slug membership check would be
    // wrong. Membership is only granted for the exact "/{market}/{category}/{slug}"
    // this review's own market+category resolve to.
    const result = run(buildValidFrontmatter(), buildValidBody(), ['/uk/trading/fidelity-review']); // wrong market
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes('does not exist'))).toBe(true);
  });
});

describe('validateReviewV2 — content/_templates/broker-review-v2.mdx fixture', () => {
  // The guard itself skips content/_templates/ (per the standard doc, section
  // D) — a green `npm run check:review-v2` run proves nothing about whether
  // the template still teaches the contract correctly. This test loads the
  // real template, substitutes its PLATZHALTER placeholder VALUES with valid
  // ones (word counts, ISO dates, real URLs), and asserts the result passes
  // — so template drift from the contract fails a test, not a human review.
  it('passes once PLATZHALTER placeholders are substituted with valid values', () => {
    const templatePath = path.join(process.cwd(), 'content/_templates/broker-review-v2.mdx');
    const raw = fs.readFileSync(templatePath, 'utf-8');
    const parsed = matter(raw);
    const rawData = parsed.data as Record<string, unknown>;
    const rawVerdict = rawData.verdict as Record<string, unknown>;

    const validData = {
      ...rawData,
      publishDate: ISO,
      modifiedDate: ISO,
      dataVerifiedDate: ISO,
      rating: 4.5,
      verdict: {
        ...rawVerdict,
        positioning: words(24),
        summary: words(90),
      },
      sectionVerdicts: {
        fees: words(20),
        markets: words(20),
        platform: words(20),
        safety: words(20),
        support: words(20),
      },
      finalDecision: words(100),
      essentialFacts: [validEssentialFact(1), validEssentialFact(2), validEssentialFact(3), validEssentialFact(4)],
      alternatives: [validAlternative('fidelity-review', 'Fidelity'), validAlternative('webull-review', 'Webull')],
      updateLog: [{ date: ISO, change: 'Migrated to the V2 template; facts checked against primary sources.' }],
      faq: [validFaqEntry(1), validFaqEntry(2), validFaqEntry(3), validFaqEntry(4)],
    };

    const result = validateReviewV2({
      filePath: 'content/us/trading/template-fixture-review.mdx',
      frontmatter: validData,
      body: parsed.content,
      knownReviewPaths: KNOWN_PATHS,
    });

    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
