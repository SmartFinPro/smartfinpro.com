// components/reviews/review-layout-v2.tsx — V2 review page composition (T13)
// ============================================================
// Server Component. Composes a V2 review page strictly along the 7-anchor
// nav matrix in lib/reviews/section-anchors.ts (REVIEW_V2_ANCHORS — the
// single source of truth for which zone owns which anchor; see that file's
// header for the full T0a rationale). This file does not re-type the
// anchor list; it only orders the zones to match it:
//
//   ReviewHeader (+ CTA-Zone 1: Compare primary / Visit secondary)
//     → #verdict   VerdictCard (+ScoreBreakdown from decisionBridge.position)
//     → BestForNotFor
//     → EssentialFactsGrid
//     → ReviewSectionNav (renders all 7 REVIEW_V2_ANCHORS)
//     → MDX body, wrapped in SectionVerdictsProvider (5 mdx-owned H2 sections)
//     → #alternatives  AlternativesSection (CTA-Zone 2)
//     → FinalDecision (CTA-Zone 3) + CategoryRiskDisclosure
//     → MethodologySection
//     → FAQSection (includeSchema=false — this file emits the one FAQPage script)
//     → Related Topics / pillar backlink / sibling reviews
//
// Deliberately NOT rendered here (plan T0a/T0c, "Explizit NICHT drin"):
// StickyReviewNav (V1), ReviewExitIntent, XRayScore, MiniQuiz, the V1 "Quick
// Verdict" card, star ratings, DecisionBridge/DecisionBridgeProvider (T0c —
// the sidebar Market-Check bridge stays V1-only; this file only reads the
// same DecisionBridgeData as plain data), ComparisonTablePremium ("Ready to
// try"), the V1 Report-Info-Card, and the V1 Author-Box. No sidebar at all —
// V2 is a single centered column on both mobile and desktop (Konzept §26/§32
// Weißraum, hairlines instead of shadowed cards).
//
// Source-of-truth (T0d): every zone's copy comes from hand-verified
// frontmatter (ContentMeta.verdict/essentialFacts/alternatives/
// sectionVerdicts/finalDecision/faq) or from the T0b-audited
// `decisionBridge.position`/`field` — never from the unaudited DB
// `pros`/`cons`/`bestFor`/`deepDive` fields V1 reads via `ReviewData`.
//
// Degradation (plan Pflicht): normalizeVerdictFrontmatter() is exercised so
// a malformed verdict-frontmatter bundle is recorded (logger.warn, matching
// the function's own "never throws — a later validator consumes issues"
// contract) rather than silently ignored, but this component NEVER gates
// rendering on that validation result. Each zone below is gated on its own
// plain presence check (meta.verdict truthy, meta.essentialFacts.length,
// etc.) — a word-count violation (an "invalide" but present block) still
// renders; only a genuinely ABSENT block is omitted. Child components
// already null-degrade internally (VerdictCard's BestXScore panel,
// ScoreBreakdown, BestForNotFor, EssentialFactsGrid, AlternativesSection,
// FinalDecision) — this file adds one more layer for the case where the
// top-level frontmatter key itself is missing.
// ============================================================

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ReviewHeader } from './review-header';
import { VerdictCard } from './verdict-card';
import { ScoreBreakdown } from './score-breakdown';
import { BestForNotFor } from './best-for-not-for';
import { EssentialFactsGrid } from './essential-facts-grid';
import { ReviewSectionNav } from './review-section-nav';
import { SectionVerdictsProvider } from './section-blocks';
import { AlternativesSection } from './alternatives-section';
import { FinalDecision } from './final-decision';
import { MethodologySection } from './methodology-section';
import { CategoryRiskDisclosure } from './category-risk-disclosure';
import { SafeMDX } from '@/components/content/SafeMDX';
import { FAQSection } from '@/components/marketing/faq-section';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import { getCanonicalUrl } from '@/lib/seo/hreflang';
import { generateBestXReviewSchema, generateFAQSchema } from '@/lib/seo/schema';
import { normalizeVerdictFrontmatter } from '@/lib/reviews/verdict-frontmatter';
import { categoryConfig } from '@/lib/i18n/config';
import type { Market, Category } from '@/lib/i18n/config';
import type { ContentMeta, ContentItem } from '@/lib/mdx';
import type { DecisionBridgeData } from '@/lib/comparison/types';
import type { MDXRemoteSerializeResult } from '@/lib/mdx/types';
import { logger } from '@/lib/logging';

const CTA_GOLD_STYLE: CSSProperties = {
  display: 'inline-block',
  background: 'var(--sfp-gold)',
  color: 'var(--sfp-ink)',
  fontWeight: 600,
  fontSize: '13.5px',
  padding: '9px 16px',
  textDecoration: 'none',
  borderRadius: '2px',
};

const CTA_OUTLINE_STYLE: CSSProperties = {
  display: 'inline-block',
  background: 'transparent',
  color: 'var(--sfp-navy)',
  border: '1px solid var(--sfp-navy)',
  fontWeight: 600,
  fontSize: '13.5px',
  padding: '8px 15px',
  textDecoration: 'none',
  borderRadius: '2px',
};

export interface ReviewLayoutV2Props {
  meta: ContentMeta;
  mdxSource?: MDXRemoteSerializeResult;
  market: Market;
  category: Category;
  slug: string;
  /** Market Check payload for this article, or null/undefined when no cockpit resolves. Never rendered as the V1 sidebar bridge here (T0c) — consumed only as plain data. */
  decisionBridge?: DecisionBridgeData | null;
  /** Same category, quality-sorted sibling list the V1 branch computes — rendered here without star ratings or reviewCount. */
  siblingReviews?: ContentItem[];
  crossCategoryContent?: ContentItem[];
  /**
   * Resolved internal review link for verdict.bestAlternative, existence-
   * checked by the caller (page.tsx) against the loaded content list — null
   * when that competitor has no review yet (T0d: never a dead link, same
   * convention as DecisionBridgeFieldRow.reviewHref).
   */
  bestAlternativeHref?: string | null;
}

export function ReviewLayoutV2({
  meta,
  mdxSource,
  market,
  category,
  slug,
  decisionBridge,
  siblingReviews,
  crossCategoryContent,
  bestAlternativeHref,
}: ReviewLayoutV2Props) {
  const title = meta.seoTitle || meta.title;
  const productName = meta.title.split(' ')[0];
  const categoryName = categoryConfig[category]?.name || category.replace('-', ' ');
  const marketPrefix = `/${market}`;
  const breadcrumbs = buildBreadcrumbs(market, category, title, slug);
  const canonicalUrl = getCanonicalUrl(market, `/${category}/${slug}`);
  const affiliateUrl: string | null =
    meta.affiliateUrl && meta.affiliateUrl !== '#' ? meta.affiliateUrl : null;

  const verdict = meta.verdict;
  const essentialFacts = meta.essentialFacts ?? [];
  const alternatives = meta.alternatives ?? [];
  const position = decisionBridge?.position ?? null;
  const fieldCount = decisionBridge?.fieldCount ?? 0;

  // Degradation Pflicht: never throws, never gates rendering — see file
  // header. Only exercised to surface issues to the future quality-gate
  // validator (scripts/validate-review-v2.ts, per the plan's Skalierung
  // section); a failing result here does not remove any zone below.
  const verdictValidation = normalizeVerdictFrontmatter({
    verdict,
    essentialFacts,
    alternatives,
    sectionVerdicts: meta.sectionVerdicts,
    finalDecision: meta.finalDecision,
    faq: meta.faq,
  });
  if (!verdictValidation.ok) {
    logger.warn('[review-layout-v2] verdict-frontmatter validation issues', {
      slug,
      market,
      category,
      issues: verdictValidation.issues,
    });
  }

  const compareLabel = decisionBridge
    ? `Compare all ${decisionBridge.fieldCount} ${decisionBridge.topicLabel}`
    : undefined;

  return (
    <article style={{ background: '#fff' }}>
      {/* Schema.org JSON-LD — BEST-X Review (score-less when position is null, T0d) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBestXReviewSchema({
              title,
              url: canonicalUrl,
              verdictSummary: verdict?.summary || meta.description,
              score: position?.score ?? null,
              topStrengths: verdict?.topStrengths ?? [],
              mainLimitation: verdict?.mainLimitation ?? '',
              market,
              datePublished: meta.publishDate,
              dateModified: meta.modifiedDate,
            }),
          ),
        }}
      />

      {/* Schema.org JSON-LD — BreadcrumbList is emitted once by <Breadcrumb>
          (rendered inside ReviewHeader below); intentionally NOT duplicated here. */}

      {/* Schema.org JSON-LD — FAQPage (exactly one emission; FAQSection below gets includeSchema=false) */}
      {meta.faq && meta.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(meta.faq)) }}
        />
      )}

      <div className="container mx-auto px-4 py-10 lg:py-14">
        <div className="max-w-[760px] mx-auto">
          <ReviewHeader
            title={title}
            positioning={verdict?.positioning}
            breadcrumbs={breadcrumbs}
            category={category}
            dataVerifiedDate={meta.dataVerifiedDate}
            modifiedDate={meta.modifiedDate}
          />

          {/* CTA-Zone 1 — Compare primary (Gold) / Visit secondary (outline Navy) */}
          {(decisionBridge?.cockpitHref || affiliateUrl) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '20px 0 32px' }}>
              {decisionBridge?.cockpitHref && (
                <Link href={decisionBridge.cockpitHref} style={CTA_GOLD_STYLE}>
                  {compareLabel}
                </Link>
              )}
              {affiliateUrl && (
                <a
                  href={affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={CTA_OUTLINE_STYLE}
                >
                  Visit {productName}
                </a>
              )}
            </div>
          )}

          {/* #verdict — layout-owned nav anchor (REVIEW_V2_ANCHORS) */}
          {verdict && (
            <div id="verdict" style={{ marginBottom: '40px' }}>
              <VerdictCard
                verdict={verdict}
                bestAlternativeHref={bestAlternativeHref}
                position={position}
                fieldCount={fieldCount}
              />
              {position && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--sfp-hairline)', paddingTop: '20px' }}>
                  <ScoreBreakdown subScores={position.subScores} />
                </div>
              )}
            </div>
          )}

          {verdict && (
            <div style={{ marginBottom: '40px' }}>
              <BestForNotFor bestFor={verdict.bestFor} notFor={verdict.notFor} />
            </div>
          )}

          {essentialFacts.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <EssentialFactsGrid facts={essentialFacts} />
            </div>
          )}

          <ReviewSectionNav />

          {/* MDX body — the 5 mdx-owned H2 sections (Fees/Markets/Platform/Safety/Support) */}
          <div className="prose prose-lg max-w-none" style={{ margin: '32px 0 40px' }}>
            <SectionVerdictsProvider data={meta.sectionVerdicts ?? null}>
              {mdxSource ? (
                <SafeMDX source={mdxSource} />
              ) : (
                <p style={{ color: 'var(--sfp-slate)' }}>Review content is being prepared.</p>
              )}
            </SectionVerdictsProvider>
          </div>

          {/* #alternatives — layout-owned nav anchor; CTA-Zone 2 lives inside AlternativesSection */}
          {alternatives.length > 0 && (
            <div id="alternatives" style={{ marginBottom: '40px' }}>
              <AlternativesSection
                productName={productName}
                market={market}
                category={category}
                alternatives={alternatives}
                field={decisionBridge?.field}
                fieldCount={decisionBridge?.fieldCount}
                topicLabel={decisionBridge?.topicLabel}
                cockpitHref={decisionBridge?.cockpitHref}
              />
            </div>
          )}

          {/* Final Decision — CTA-Zone 3, no nav entry (T0a) */}
          {meta.finalDecision && (
            <div style={{ marginBottom: '40px' }}>
              <FinalDecision
                productName={productName}
                finalDecision={meta.finalDecision}
                bestFor={verdict?.bestFor ?? []}
                alternatives={alternatives}
                compareHref={decisionBridge?.cockpitHref}
                compareLabel={compareLabel}
                affiliateUrl={affiliateUrl}
              />
              <CategoryRiskDisclosure category={category} className="mt-3 text-xs" />
            </div>
          )}

          {/* Methodology — no nav entry (T0a) */}
          <div style={{ marginBottom: '40px' }}>
            <MethodologySection essentialFacts={essentialFacts} updateLog={meta.updateLog} />
          </div>

          {/* FAQ — no nav entry (T0a); includeSchema=false, the script above already emitted FAQPage */}
          {meta.faq && meta.faq.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <FAQSection faqs={meta.faq} includeSchema={false} />
            </div>
          )}

          {/* Related Topics — cross-category, no star ratings (V2 has one rating system: BEST-X) */}
          {crossCategoryContent && crossCategoryContent.length > 0 && (
            <div style={{ marginBottom: '40px', paddingTop: '32px', borderTop: '1px solid var(--sfp-hairline)' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '18px',
                  fontWeight: 400,
                  color: 'var(--sfp-ink)',
                  margin: '0 0 16px',
                }}
              >
                Related Topics
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {crossCategoryContent.map((item) => {
                  const catName = (item.meta.category as string)
                    ?.replace(/-/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <Link
                      key={`cross-${item.slug}`}
                      href={`${marketPrefix}/${item.meta.category}/${item.slug}`}
                      style={{
                        display: 'block',
                        border: '1px solid var(--sfp-hairline)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        textDecoration: 'none',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--sfp-navy)',
                        }}
                      >
                        {catName}
                      </span>
                      <p style={{ fontSize: '13.5px', color: 'var(--sfp-ink)', margin: '6px 0 0', lineHeight: 1.4 }}>
                        {item.meta.seoTitle || item.meta.title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pillar backlink — always rendered, regardless of siblingReviews count (reciprocal Hub↔Leaf signal, matches V1). */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href={`${marketPrefix}/${category}`}
              style={{ color: 'var(--sfp-navy)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
            >
              <span aria-hidden="true">←</span> All {categoryName} Reviews
            </Link>
          </div>

          {/* Sibling reviews — "More {Category} Reviews", no stars, no reviewCount (T0a/T3). */}
          {siblingReviews && siblingReviews.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '18px',
                  fontWeight: 400,
                  color: 'var(--sfp-ink)',
                  margin: '0 0 16px',
                }}
              >
                More {categoryName} Reviews
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {siblingReviews.slice(0, 8).map((item) => (
                  <Link
                    key={item.slug}
                    href={`${marketPrefix}/${category}/${item.slug}`}
                    style={{
                      display: 'block',
                      border: '1px solid var(--sfp-hairline)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sfp-navy)', marginBottom: '4px' }}>
                      {item.meta.title}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--sfp-slate)', margin: 0, lineHeight: 1.5 }}>
                      {item.meta.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
