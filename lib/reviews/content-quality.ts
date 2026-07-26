// lib/reviews/content-quality.ts — the 0-100 content quality score
// ============================================================
// Extracted from lib/actions/content-hub.ts (2026-07-26). That file is
// 'use server', which may only export async server actions, so the scoring
// logic could not be exported for testing while it lived there. It is pure
// (string in, numbers out) and now gates review publication via the
// "Content Quality >= 90" criterion in docs/reviews/broker-v2-standard.md —
// a gate with no test behind it is not a gate.
//
// V1 and V2 reviews are scored on different shapes: a V2 review keeps most
// of its editorial content in structured frontmatter (verdict, sectionVerdicts,
// essentialFacts, alternatives, faq) which the layout renders, so a
// body-only measurement reads it as nearly empty.
// ============================================================

import { countRenderedWords } from '@/scripts/lib/rendered-word-count.mjs';
import { REVIEW_V2_ANCHORS } from '@/lib/reviews/section-anchors';

export interface ContentQuality {
  score: number;          // 0-100 overall
  wordScore: number;      // 0-100 word count quality
  structureScore: number; // 0-100 heading structure
  linkScore: number;      // 0-100 internal + external links
  componentScore: number; // 0-100 MDX components usage
  breakdown: string;      // "W:85 S:90 L:70 C:95" short form
}

// ── Content Quality Scoring ─────────────────────────────────────

// <ExpertBox> and <EvidenceCarousel> were removed 2026-07-18 (T0e audit):
// they rewarded fabricated reviewer identities / non-existent test
// screenshots — see docs/superpowers/specs/2026-07-18-etoro-cockpit-audit.md.
const MDX_COMPONENTS = [
  '<TrustAuthority', '<Rating', '<AffiliateButton',
  '<ExecutiveSummary', '<CollapsibleSection', '<ComparisonTable',
  '<SimpleComparison', '<BrokerComparison', '<EnterpriseTable',
  '<FAQ', '<Pros', '<Cons', '<Info', '<Warning', '<Tip',
  '<NewsletterBox', '<WinnerAtGlance',
];

// V2 review-layout pages (frontmatter `reviewLayout: 'v2'`) never contain any
// of the V1 MDX_COMPONENTS tags above — their body uses a different, small
// vocabulary shared with the VerdictCard/SectionVerdict rendering pipeline
// (docs/reviews/broker-v2-standard.md §B; registered together in
// lib/mdx/components.tsx). Confirmed as the FULL set actually in use via
// `grep -oE '</?[A-Z][A-Za-z0-9]*' content/us/trading/etoro-review.mdx`
// against the reference V2 review.
const V2_MDX_COMPONENTS = ['<SectionVerdict', '<KeyEvidence', '<SmartFinProTake'];

/** Escapes regex special characters in a literal string. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// V2 review-layout pages (frontmatter `reviewLayout: 'v2'`) target a much
// leaner rendered word count (2,600–3,600 vs. V1's 4,000–7,000) because
// most of their editorial content lives in structured frontmatter zones
// (verdict/essentialFacts/alternatives), not the MDX body — see
// scripts/lib/rendered-word-count.mjs for the counting rationale.
//
// Reuses countRenderedWords() (body + verdict.summary + essentialFacts[].
// context + alternatives[].whyInstead + finalDecision + faq[].answer) as the
// base, then adds the rendered frontmatter zones that shared helper doesn't
// cover yet — verdict.positioning, verdict.bestFor/notFor, verdict.
// mainLimitation, sectionVerdicts (all 5), essentialFacts[].label/value,

// V2 structure score: contract compliance (docs/reviews/broker-v2-standard.md
// §B) instead of "more H2 is better" — the V2 contract mandates EXACTLY five
// H2 sections and the guard (lib/reviews/validate-review-v2.ts) forbids
// extras. REVIEW_V2_ANCHORS (lib/reviews/section-anchors.ts) is the single
// typed source for the 5 mandated ids/titles, shared with the Nav and
// ReviewLayoutV2 — not re-typed here.
function computeV2StructureScore(content: string, fm: Record<string, any>): number {
  const mandatedAnchors = REVIEW_V2_ANCHORS.filter((a) => a.owner === 'mdx');
  const pointsPerSection = 80 / mandatedAnchors.length; // 16 pts each, 5 sections = 80 pts

  let score = 0;
  for (const anchor of mandatedAnchors) {
    const h2Re = new RegExp(`^##\\s+${escapeRegExp(anchor.title)}\\s*$`, 'm');
    const sectionVerdictRe = new RegExp(`<SectionVerdict\\s+id=["']${escapeRegExp(anchor.id)}["']`);
    if (h2Re.test(content) && sectionVerdictRe.test(content)) {
      score += pointsPerSection;
    }
  }

  // FAQ presence read from frontmatter.faq (not the MDX body — V2 FAQ is a
  // Layout zone, never MDX-rendered).
  if (Array.isArray(fm.faq) && fm.faq.length > 0) score += 10;

  // Best-for / not-for presence read from frontmatter.verdict.
  const verdict = (fm.verdict ?? {}) as Record<string, any>;
  const hasBestForNotFor =
    Array.isArray(verdict.bestFor) && verdict.bestFor.length > 0 &&
    Array.isArray(verdict.notFor) && verdict.notFor.length > 0;
  if (hasBestForNotFor) score += 10;

  return Math.min(Math.round(score), 100);
}

// V2 link score: essentialFacts[].sourceHref (external authority sources) and
// alternatives[] (internal cross-links) carry the review's link equity, on
// top of whatever links happen to sit in the MDX body. A compliant review
// has 4-6 sources and 2-3 alternatives (docs/reviews/broker-v2-standard.md
// §A) — the caps below match those contract limits.
function computeV2LinkScore(content: string, fm: Record<string, any>): number {
  const bodyInternalLinks = (content.match(/\]\(\//g) || []).length;
  const bodyExternalLinks = (content.match(/\]\(https?:\/\//g) || []).length;

  const alternatives = Array.isArray(fm.alternatives) ? fm.alternatives : [];
  const essentialFacts = Array.isArray(fm.essentialFacts) ? fm.essentialFacts : [];
  const sourceHrefCount = essentialFacts.filter(
    (f: any) => typeof f?.sourceHref === 'string' && f.sourceHref.length > 0
  ).length;

  const internalLinks = bodyInternalLinks + alternatives.length;
  const externalLinks = bodyExternalLinks + sourceHrefCount;

  let linkScore = 0;
  linkScore += Math.min(internalLinks, 3) * 17; // Up to 51 pts — contract caps alternatives at 2-3
  linkScore += Math.min(externalLinks, 6) * 8;  // Up to 48 pts — contract caps essentialFacts at 4-6
  return Math.min(linkScore, 100);
}

export function computeContentQuality(
  content: string,
  wordCount: number,
  isV2 = false,
  frontmatter: Record<string, any> = {}
): ContentQuality {
  const fm = frontmatter ?? {};

  // ── Word Score (30% weight) ──
  const effectiveWordCount = isV2 ? countRenderedWords(content, fm).total : wordCount;

  let wordScore = 0;
  if (isV2) {
    if (effectiveWordCount >= 2600 && effectiveWordCount <= 3600) wordScore = 100;
    else if (effectiveWordCount >= 2200 && effectiveWordCount < 2600) wordScore = 70;
    else if (effectiveWordCount > 3600 && effectiveWordCount <= 4200) wordScore = 80;
    else if (effectiveWordCount >= 1800 && effectiveWordCount < 2200) wordScore = 50;
    else if (effectiveWordCount > 4200) wordScore = 60;
    else if (effectiveWordCount >= 900) wordScore = 30;
    else wordScore = 10;
  } else {
    if (wordCount >= 4000 && wordCount <= 7000) wordScore = 100;
    else if (wordCount >= 3000 && wordCount < 4000) wordScore = 70;
    else if (wordCount > 7000 && wordCount <= 9000) wordScore = 80;
    else if (wordCount >= 2000 && wordCount < 3000) wordScore = 50;
    else if (wordCount > 9000) wordScore = 60;
    else if (wordCount >= 1000) wordScore = 30;
    else wordScore = 10;
  }

  // ── Structure Score (25% weight) ──
  let structureScore: number;
  if (isV2) {
    structureScore = computeV2StructureScore(content, fm);
  } else {
    // headings + FAQ (V1 body-shape heuristic — unchanged)
    const h2Count = (content.match(/^## /gm) || []).length;
    const h3Count = (content.match(/^### /gm) || []).length;
    const hasFaq = /(<FAQ|^## .*FAQ|^## .*Frequently Asked)/im.test(content);
    const hasProsCons = /<Pros|<Cons|^## .*Pros|^## .*Cons/im.test(content);

    structureScore = 0;
    structureScore += Math.min(h2Count, 8) * 8;  // Up to 64 points for H2s
    structureScore += Math.min(h3Count, 6) * 3;  // Up to 18 points for H3s
    if (hasFaq) structureScore += 10;
    if (hasProsCons) structureScore += 8;
    structureScore = Math.min(structureScore, 100);
  }

  // ── Link Score (20% weight) ──
  let linkScore: number;
  if (isV2) {
    linkScore = computeV2LinkScore(content, fm);
  } else {
    // internal + external MDX-body links (V1 heuristic — unchanged)
    const internalLinks = (content.match(/\]\(\//g) || []).length;
    const externalLinks = (content.match(/\]\(https?:\/\//g) || []).length;

    linkScore = 0;
    linkScore += Math.min(internalLinks, 8) * 7;  // Up to 56 pts for internal
    linkScore += Math.min(externalLinks, 6) * 7;  // Up to 42 pts for external
    linkScore = Math.min(linkScore, 100);
  }

  // ── Component Score (25% weight) — MDX components usage ──
  // V2 reviews are scored against their own small component vocabulary
  // instead of the V1 MDX_COMPONENTS list, which V2 bodies never contain.
  const componentVocabulary = isV2 ? V2_MDX_COMPONENTS : MDX_COMPONENTS;
  const componentCap = isV2 ? componentVocabulary.length : 6;
  let componentCount = 0;
  for (const comp of componentVocabulary) {
    if (content.includes(comp)) componentCount++;
  }
  const imageCount = (content.match(/!\[.*?\]/g) || []).length;

  let componentScore = 0;
  componentScore += Math.min(componentCount, componentCap) * (72 / componentCap); // Up to 72 pts for components
  // V2 pages have no image requirement (real product screenshots are
  // editorial illustration only, never fabricated "test evidence") — award
  // the full 28 pts unconditionally instead of gating on imageCount.
  componentScore += isV2 ? 28 : Math.min(imageCount, 4) * 7;
  componentScore = Math.min(componentScore, 100);

  // ── Weighted overall score ──
  const score = Math.round(
    wordScore * 0.30 +
    structureScore * 0.25 +
    linkScore * 0.20 +
    componentScore * 0.25
  );

  const breakdown = `W:${wordScore} S:${structureScore} L:${linkScore} C:${componentScore}`;

  return { score, wordScore, structureScore, linkScore, componentScore, breakdown };
}

export const EMPTY_QUALITY: ContentQuality = {
  score: 0, wordScore: 0, structureScore: 0, linkScore: 0, componentScore: 0, breakdown: '—',
};
