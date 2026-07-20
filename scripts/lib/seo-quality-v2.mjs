// scripts/lib/seo-quality-v2.mjs — V2 review-layout detection + scoring
// ============================================================
// Split out of check-seo-quality.mjs so this logic is unit-testable
// without triggering the CLI script's file-walk / baseline-diff / CI-exit
// side effects (that script executes top-level on import).
//
// V2 pages (frontmatter `reviewLayout: 'v2'`) don't carry the V1 MDX-tag
// scaffolding (<ExpertBox>, <AffiliateButton>, ...) — their quality signal
// is structural frontmatter completeness (verdict / essentialFacts /
// alternatives, owned by the Layout per lib/reviews/section-anchors.ts)
// plus the rendered-editorial word count across MDX body + frontmatter
// prose zones (see rendered-word-count.mjs). V1 scoring in
// check-seo-quality.mjs is untouched by this module.
// ============================================================

import { countRenderedWords, isWithinV2WordRange, V2_WORD_COUNT_RANGE } from './rendered-word-count.mjs';

export { V2_WORD_COUNT_RANGE };

/** True when the parsed frontmatter opts into the V2 review layout. */
export function isV2Frontmatter(frontmatterData) {
  return Boolean(frontmatterData) && frontmatterData.reviewLayout === 'v2';
}

/**
 * Scores a V2 review page: structural completeness (verdict / essentialFacts
 * / alternatives present) + rendered-editorial word count in range
 * (2,600–3,600) — instead of the V1 MDX-tag/raw-body-word-count rubric.
 *
 * @param {{ fm: string, body: string, frontmatterData: object }} args
 *   `fm` is the raw frontmatter text block (for the title-length check,
 *   same regex convention as the V1 scorer); `body` is the raw MDX body;
 *   `frontmatterData` is the parsed frontmatter object.
 */
export function scoreV2File({ fm, body, frontmatterData }) {
  const titleMatch = fm.match(/^title:\s*['"]?(.*?)['"]?\s*$/m);
  const titleLen = titleMatch ? titleMatch[1].length : 0;

  const hasVerdict = Boolean(frontmatterData?.verdict?.summary);
  const hasEssentialFacts = Array.isArray(frontmatterData?.essentialFacts) && frontmatterData.essentialFacts.length > 0;
  const hasAlternatives = Array.isArray(frontmatterData?.alternatives) && frontmatterData.alternatives.length > 0;

  const { total: wordCount } = countRenderedWords(body, frontmatterData);
  const inRange = isWithinV2WordRange(wordCount);

  let score = 10.0;
  const issues = [];

  if (!hasVerdict) { score -= 3.0; issues.push('NO_VERDICT'); }
  if (!hasEssentialFacts) { score -= 2.0; issues.push('NO_FACTS'); }
  if (!hasAlternatives) { score -= 2.0; issues.push('NO_ALTERNATIVES'); }
  if (titleLen > 65) { score -= 0.5; issues.push(`TITLE_${titleLen}c`); }
  if (!inRange) { score -= 2.5; issues.push(`WC_V2_${wordCount}`); }

  return {
    score: Math.round(score * 10) / 10,
    issues,
    wordCount,
    titleLen,
  };
}
