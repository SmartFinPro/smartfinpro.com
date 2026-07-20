// scripts/lib/rendered-word-count.mjs — Rendered editorial word count (V2 review layout)
// ============================================================
// Pure ESM utility — deliberately dependency-free so it can be imported
// both from plain-node CLI scripts (e.g. check-seo-quality.mjs, which runs
// under `node` with no TS loader) and, wrapped/re-exported, from the
// TypeScript side (lib/reviews/*.ts).
//
// Why this exists (T0e, 2026-07-18 audit): a V2 review page's reader-facing
// prose is NOT just the MDX body — the Betreiber-Konzept moves the Verdict,
// Essential Facts context, Alternatives reasoning, Final Decision and FAQ
// answers into structured, Zod-validated frontmatter zones (owned by the
// Layout, per lib/reviews/section-anchors.ts), not into MDX markdown. A
// naive MDX-body-only word count would undercount real content by roughly
// half and force fabricated filler back into the MDX body to pass the gate
// — exactly the failure mode this audit is fixing. See
// docs/superpowers/specs/2026-07-18-etoro-cockpit-audit.md and the parent
// plan's Rev. 2.1 correction #4.
//
// Counts: MDX body + verdict.summary + essentialFacts[].context +
// alternatives[].whyInstead + finalDecision + faq[].answer.
// ============================================================

/** Target rendered-word-count range for a V2 review page. */
export const V2_WORD_COUNT_RANGE = { min: 2600, max: 3600 };

/**
 * Strips MDX/JSX syntax that isn't reader-facing prose, so tag names and
 * prop scaffolding don't inflate the word count:
 *  - {/* MDX comments *\/}
 *  - self-closing JSX components, e.g. <SectionVerdict id="fees" />
 *  - paired JSX component tags, e.g. <SomeBlock>...</SomeBlock> (tags only)
 *  - markdown heading markers (##, ###, ...)
 *  - emphasis/code markers (*, _, `)
 */
function stripMdxSyntax(mdx) {
  if (!mdx) return '';
  return String(mdx)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<[A-Z][^>]*\/>/g, ' ')
    .replace(/<\/?[A-Z][^>]*>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`]/g, ' ');
}

/**
 * Whitespace-token word count for a single string. Exported (T5, 2026-07-18)
 * so lib/reviews/verdict-frontmatter.ts can apply the exact same counting
 * rule to individual §30.1 length checks (verdict.positioning,
 * verdict.summary, sectionVerdicts values, finalDecision, faq[].answer) —
 * one counting implementation shared by both the per-field content-rule
 * validator (verdict-frontmatter.ts) and the whole-page rendered-word-count
 * gate below, instead of two independently-drifting word counters.
 *
 * @param {string | null | undefined} text
 * @returns {number}
 */
export function countWords(text) {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function textFromFinalDecision(finalDecision) {
  if (!finalDecision) return '';
  if (typeof finalDecision === 'string') return finalDecision;
  if (typeof finalDecision === 'object') {
    return finalDecision.summary || finalDecision.text || finalDecision.body || '';
  }
  return '';
}

/**
 * Sums the word count of the full rendered editorial surface of a V2
 * review page.
 *
 * @param {string} mdxBody - MDX body content (frontmatter already stripped)
 * @param {object} frontmatter - parsed frontmatter (e.g. gray-matter `data`)
 * @returns {{ total: number, breakdown: { body: number, verdictSummary: number, essentialFacts: number, alternatives: number, finalDecision: number, faq: number } }}
 */
export function countRenderedWords(mdxBody, frontmatter = {}) {
  const fm = frontmatter || {};

  const body = countWords(stripMdxSyntax(mdxBody));
  const verdictSummary = countWords(fm.verdict?.summary);

  const essentialFacts = Array.isArray(fm.essentialFacts)
    ? fm.essentialFacts.reduce((sum, fact) => sum + countWords(fact?.context), 0)
    : 0;

  const alternatives = Array.isArray(fm.alternatives)
    ? fm.alternatives.reduce((sum, alt) => sum + countWords(alt?.whyInstead), 0)
    : 0;

  const finalDecision = countWords(textFromFinalDecision(fm.finalDecision));

  const faq = Array.isArray(fm.faq)
    ? fm.faq.reduce((sum, item) => sum + countWords(item?.answer), 0)
    : 0;

  const total = body + verdictSummary + essentialFacts + alternatives + finalDecision + faq;

  return {
    total,
    breakdown: { body, verdictSummary, essentialFacts, alternatives, finalDecision, faq },
  };
}

/** True when a rendered word-count total falls inside the V2 target range (inclusive). */
export function isWithinV2WordRange(total) {
  return total >= V2_WORD_COUNT_RANGE.min && total <= V2_WORD_COUNT_RANGE.max;
}
