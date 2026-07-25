// components/reviews/review-layout-v2.tsx — V2 review page composition (T13)
// ============================================================
// Server Component. Composes a V2 review page strictly along the 7-anchor
// nav matrix in lib/reviews/section-anchors.ts (REVIEW_V2_ANCHORS — the
// single source of truth for which zone owns which anchor; see that file's
// header for the full T0a rationale). This file does not re-type the
// anchor list; it only orders the zones to match it:
//
//   ReviewHeader
//     → #verdict   VerdictCard (BestXScore panel embeds ScoreBreakdown)
//     → [mobile-only] ReviewSidebar in-flow, directly under #verdict
//     → ReviewSectionNav (renders all 7 REVIEW_V2_ANCHORS)
//     → MDX body, wrapped in SectionVerdictsProvider (5 mdx-owned H2 sections)
//     → #alternatives  AlternativesSection (CTA-Zone 1)
//     → FinalDecision (CTA-Zone 2) + CategoryRiskDisclosure
//     → ReviewDisclosure + MethodologySection
//     → FAQSection (includeSchema=false — this file emits the one FAQPage script)
//     → Related Topics / pillar backlink / sibling reviews
//   [desktop-only, right rail] ReviewSidebar, sticky
//
// Sidebar (Betreiber-Wunsch, 2026-07-18 — revises T0c below): rendered by
// components/reviews/review-sidebar.tsx, gated on `decisionBridge` being
// present. It is now the PRIMARY CTA surface (Report-Info-Card w/ provider
// logo, Market Check with its internal CTA suppressed via
// `<DecisionBridge showCta={false} />`, its own Compare+Visit button pair,
// compact affiliate/risk disclosure). The former "CTA-Zone 1" — a Compare/
// Visit pair rendered between ReviewHeader and #verdict — was REMOVED
// entirely (not renumbered into the sidebar) to avoid doubling it: with the
// sidebar now primary, only 2 CTA zones remain in the main column
// (Alternatives, Final Decision), for 3 total incl. the sidebar — within
// the Konzept's "max 3 CTA-Zonen" cap. On mobile (no room for a rail),
// ReviewSidebar is rendered a second time in-flow, directly under the
// #verdict zone, and hidden on desktop — the same dual-render-per-breakpoint
// pattern components/marketing/report-layout.tsx already uses for its
// ProtocolBridge "mobile fallback".
//
// Deliberately still NOT rendered here (plan T0a, "Explizit NICHT drin"):
// StickyReviewNav (V1), ReviewExitIntent, XRayScore, MiniQuiz, the V1 "Quick
// Verdict" card, star ratings, ComparisonTablePremium ("Ready to try"), and
// the V1 Author-Box.
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

import Link from 'next/link';
import { ReviewHeader } from './review-header';
import { VerdictCard } from './verdict-card';
import { ScoreInField } from './score-in-field';
import { ReviewSectionNav } from './review-section-nav';
import { ReviewSidebar } from './review-sidebar';
import { SectionVerdictsProvider } from './section-blocks';
import { AlternativesSection } from './alternatives-section';
import { FinalDecision } from './final-decision';
import { MethodologySection } from './methodology-section';
import { ReviewDisclosure } from './review-disclosure';
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

  // Sidebar (Betreiber-Wunsch, 2026-07-18) — gated on decisionBridge like
  // every other cockpit-derived zone; a review with no resolved cockpit
  // field gets no sidebar, same as it gets no Market Check on V1.
  const hasSidebar = Boolean(decisionBridge);

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
        <div className={hasSidebar ? 'lg:grid lg:grid-cols-[760px_300px] lg:gap-14 lg:justify-center' : ''}>
        <div className={hasSidebar ? 'max-w-[760px] mx-auto lg:mx-0 lg:max-w-none' : 'max-w-[760px] mx-auto'}>
          <ReviewHeader
            title={title}
            positioning={verdict?.positioning}
            breadcrumbs={breadcrumbs}
            category={category}
            dataVerifiedDate={meta.dataVerifiedDate}
            modifiedDate={meta.modifiedDate}
          />

          {/* #verdict — layout-owned nav anchor (REVIEW_V2_ANCHORS). The
              sub-score breakdown lives INSIDE VerdictCard's BestXScore panel
              (2026-07-19 compact redesign) — no separate full-width zone. */}
          {verdict && (
            <div id="verdict" style={{ marginBottom: '40px' }}>
              <VerdictCard
                verdict={verdict}
                bestAlternativeHref={bestAlternativeHref}
                position={position}
                fieldCount={fieldCount}
                essentialFacts={essentialFacts}
              />
            </div>
          )}

          {/* Mobile-only sidebar, in-flow directly under the Verdict zone —
              hidden on desktop where the sticky right rail below takes over. */}
          {hasSidebar && decisionBridge && (
            <div className="lg:hidden" style={{ marginBottom: '40px' }}>
              <ReviewSidebar
                productName={productName}
                publishDate={meta.publishDate}
                decisionBridge={decisionBridge}
                compareLabel={compareLabel as string}
                affiliateUrl={affiliateUrl}
                market={market}
                category={category}
                hasLeverageRisk={meta.hasLeverageRisk}
              />
            </div>
          )}

          {/* Where this product sits in the field — closes the opening block
              (score → who it is for → hard facts → standing) before the nav
              hands over to the deep dive. It plots the same audited
              position/field numbers the sidebar lists as a table; the table
              answers "who is above me", this answers "by how much", which is
              the point the verdict prose makes in words ("1.6 points separate
              first from last") and which no table can show.
              Self-degrading: renders null without position/field, so a review
              with no cockpit match simply has no such block. */}
          {/* Gated on the same preconditions the component itself requires, so
              a review without a cockpit match gets no empty 40px gap where the
              block would have been (the wrapper's margin would survive a null
              child). The component keeps its own, stricter validation. */}
          {position && decisionBridge?.field && decisionBridge.field.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <ScoreInField field={decisionBridge.field} position={position} fieldCount={fieldCount} />
            </div>
          )}

          <ReviewSectionNav />

          {/* MDX body — the 5 mdx-owned H2 sections (Fees/Markets/Platform/Safety/Support)
              READING MEASURE. The body column is 760px wide and the MDX
              paragraph component asks for 16px text, which puts a line at
              roughly 95 characters — well past the 60–75 that typography
              research treats as comfortable, and the main reason a 4,100-word
              review reads as a wall.
              Operator decision (2026-07-21), taken after seeing a capped
              measure rendered: running text keeps the FULL column width, so it
              aligns with the verdict box and the section-verdict callouts
              directly above it — a narrower text column underneath a
              full-width box read as a misalignment.
              One face and one size for the whole article (2026-07-21, second
              pass): paragraphs, list items and table cells were 18/13.5/14/12px
              in the sans while the callouts were 18px serif. The article now
              sets entirely in the serif at 18px, matching the callouts, so the
              page reads as one document rather than as a text with widgets in
              it. Table headers keep only their weight to stay scannable.
              The paragraph selector is `p`, not `> * > p`: the callouts wrap
              their text in an MDX paragraph one level deeper, which carried its
              own 16px and left five boxes a size below everything around them. The readability gain
              therefore comes from type rather than from measure. Calibrated
              against a reference the operator named as easy to read
              (dollarscout.net), measured in the browser rather than guessed:
              18px, line-height 1.63, 72 characters per line. Note the absolute
              leading there is 29.25px and ours was already 29.75px — the gap
              was never the line spacing, it was the SIZE, and through it the
              characters per line. At 18px in this 760px column a line holds
              about 76 characters, against 95 before. No max-width, deliberately
              (operator decision: text aligns with the boxes above it).
              A scoped rule rather than utility classes because the paragraphs
              are created by StyledP deep inside MDX: nothing here can reach
              them without stacking `[&_p]:` variants, and this file cannot edit
              StyledP without changing all 216 V1 pages too. The rule wins on
              specificity (0,1,1 against a utility's 0,1,0), which is how it
              overrides StyledP's own 16px/1.7.
              Correcting an earlier claim in this comment: StyledP's utilities
              are NOT broken. Measuring them against a page whose Suspense
              boundary had not resolved reports `line-height: normal` and the
              browser's default margin, because the MDX body is still parked in
              a hidden container outside this element — the known trap recorded
              in memory as qa-hidden-tab-suspense-gotchas. With the boundary
              resolved, text-base / leading-[1.7] / mb-5 all arrive.
              Note the two `prose` classes below are inert: @tailwindcss/
              typography is not registered in tailwind.config.ts, so only the
              handful of hand-written `.prose …` rules in app/globals.css apply.
              Scoped to .review-v2-prose, so V1 pages are untouched. */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
.review-v2-prose p,
.review-v2-prose li,
.review-v2-prose table td,
.review-v2-prose table th { font-family: var(--font-secondary); font-size: 18px; line-height: 1.65; }
.review-v2-prose > * > p { margin: 0 0 1.15em; }
.review-v2-prose table th { font-weight: 600; }
/* Sticky-chrome offset for every in-page anchor target. The site header
   (65px, top:0) and the section nav (44px, top:64) together cover the first
   108px of the viewport, and the anchors — bare <span id> markers in the MDX
   plus the two layout-owned ids — all sat at scroll-margin-top:0. Clicking a
   nav item therefore scrolled its heading to y=0, i.e. underneath the two
   bars, and the reader landed on the paragraph after it. 124px clears both
   and leaves air above the heading.
   One value, no breakpoint: the two bars measure the same 108px at 1440 and
   at 390, so a mobile override would be a distinction without a difference.
   Verified after the fix — headings land at 139-157px at both widths. */
.review-v2-prose span[id],
#verdict,
#alternatives { scroll-margin-top: 124px; }
@media (max-width: 640px) {
  .review-v2-prose p,
  .review-v2-prose li,
  .review-v2-prose table td,
  .review-v2-prose table th { font-size: 17px; }
}
`,
            }}
          />
          <div className="review-v2-prose prose prose-lg max-w-none" style={{ margin: '32px 0 40px' }}>
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
              <CategoryRiskDisclosure category={category} hasLeverageRisk={meta.hasLeverageRisk} className="mt-3 text-xs" />
            </div>
          )}

          {/* Affiliate disclosure — moved out of ReviewHeader (operator,
              2026-07-21) to sit here, immediately before the methodology it
              refers to, instead of directly under the H1. The CTA-adjacent
              disclosure is unaffected: ReviewSidebar renders its own beneath
              the Visit button, at every breakpoint. */}
          <div style={{ marginBottom: '28px' }}>
            <ReviewDisclosure category={category} hasLeverageRisk={meta.hasLeverageRisk} />
          </div>

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

        {/* Desktop-only sticky right rail — hidden on mobile where ReviewSidebar
            already rendered in-flow under #verdict above. */}
        {hasSidebar && decisionBridge && (
          <div className="hidden lg:block">
            <ReviewSidebar
              productName={productName}
              publishDate={meta.publishDate}
              decisionBridge={decisionBridge}
              compareLabel={compareLabel as string}
              affiliateUrl={affiliateUrl}
              market={market}
              category={category}
              hasLeverageRisk={meta.hasLeverageRisk}
            />
          </div>
        )}
        </div>
      </div>
    </article>
  );
}
