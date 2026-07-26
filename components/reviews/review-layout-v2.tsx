// components/reviews/review-layout-v2.tsx — V2 review page composition (T13)
// ============================================================
// Server Component. Composes a V2 review page strictly along the 7-anchor
// nav matrix in lib/reviews/section-anchors.ts (REVIEW_V2_ANCHORS — the
// single source of truth for which zone owns which anchor; see that file's
// header for the full T0a rationale). This file does not re-type the
// anchor list; it only orders the zones to match it:
//
//   ReviewHeader
//     → #verdict   VerdictCard (BestXScore + compact mobile actions)
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
// the compact ReviewMobileActions surface is inserted after BestForNotFor
// inside VerdictCard. It deliberately omits the repeated provider card and
// Market Check; ReviewSidebar renders only in the desktop rail.
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
import { ReviewSectionNav } from './review-section-nav';
import { ReviewSidebar } from './review-sidebar';
import { ReviewMobileActions } from './review-mobile-actions';
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
}: ReviewLayoutV2Props) {
  const title = meta.seoTitle || meta.title;
  // The audited cockpit row carries the real product name ("Charles Schwab").
  // The old fallback — meta.title.split(' ')[0] — took the FIRST WORD of the
  // headline, which is right only for single-word brands. It went unnoticed
  // while eToro was the sole V2 review; on the Schwab pilot it rendered the
  // affiliate CTA as "Visit Charles" and the logo alt as "Charles logo".
  // Half the broker corpus (18 of 36) has a multi-word name, so this would
  // have shipped on most of the rollout. The split stays as the last resort
  // for a review with no cockpit match, where nothing better is available.
  const productName = decisionBridge?.position?.name || meta.title.split(' ')[0];
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
  const mobileActions = decisionBridge ? (
    <ReviewMobileActions
      productName={productName}
      compareHref={decisionBridge.cockpitHref}
      compareLabel={compareLabel as string}
      affiliateUrl={affiliateUrl}
      market={market}
      category={category}
      hasLeverageRisk={meta.hasLeverageRisk}
    />
  ) : null;

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
        {/* TWO grid rows, every item placed EXPLICITLY (col-start/row-start).
            Row 1 = article + sticky rail; row 2 = the CTA-bearing downstream
            zones, column 1 only.

            Why two rows. Both children used to sit in row 1, which makes the
            rail's grid item `align-self: stretch` — its containing block then
            spans the WHOLE page, so `lg:sticky` kept the rail pinned all the
            way down past Alternatives and Final Decision. Measured at 1440px:
            four to five CTAs on screen at once (exact count depends on viewport
            height), including two identical gold buttons 5px apart. Confining
            the rail to row 1 lets it travel with the article — where it is
            useful, the reader is deep in the text and far from any CTA — and
            scroll away before the closing CTA zones begin.

            Why EXPLICIT placement. Auto-placement walks the DOM: the rail comes
            last in the JSX, so it would land in a third row UNDER the downstream
            block instead of beside the article.

            Why column 1 for row 2 rather than a `col-span-2` with its own
            max-width: at 1024px column 1 measures 660px, so a 760px-capped
            spanning block would stick out past the article above it. Sharing
            the column makes the left edge identical at every width, by
            construction rather than by arithmetic.

            Why `gap-x` and not `gap`: `gap` applies to both axes and would
            insert 32/56px of dead vertical space between the two new rows that
            was never there before.

            Why `minmax(0,760px)` instead of a flat `760px`: the fixed track
            demanded 760+300+56 = 1116px while the container offers only 992px
            of content width at `lg`, so the page scrolled sideways by 46px
            (measured: scrollWidth 1070 against clientWidth 1024). The flexible
            track shrinks to 660px there — 660+32+300 = 992, exact fit — and
            grows back to the full 760px from `xl` up, where `justify-center`
            centres it as before. `min-w-0` on the content items because grid
            items default to `min-width: auto`, which a wide MDX table could
            otherwise use to blow the track open again. */}
        <div className={hasSidebar ? 'lg:grid lg:grid-cols-[minmax(0,760px)_300px] lg:gap-x-8 xl:gap-x-14 lg:justify-center' : ''}>
        <div className={hasSidebar ? 'max-w-[760px] mx-auto lg:mx-0 lg:max-w-none lg:col-start-1 lg:row-start-1 lg:min-w-0' : 'max-w-[760px] mx-auto'}>
          {/* #verdict — layout-owned nav anchor (REVIEW_V2_ANCHORS). It wraps
              the WHOLE opening block, not just the card: on the card alone the
              anchor sat below the H1, the positioning line and the meta line, so
              opening the page at #verdict (or clicking "Verdict" in the nav)
              left the H1 entirely above the viewport — the reader arrived at a
              score with no idea which product it belonged to.
              The `scroll-margin-top: 124px` rule in the scoped style block below
              is unchanged and now applies to this wrapper.
              The sub-score breakdown lives INSIDE VerdictCard's BestXScore panel
              (2026-07-19 compact redesign) — no separate full-width zone. */}
          <div id="verdict">
            <ReviewHeader
              title={title}
              positioning={verdict?.positioning}
              breadcrumbs={breadcrumbs}
              category={category}
              dataVerifiedDate={meta.dataVerifiedDate}
              modifiedDate={meta.modifiedDate}
            />

            {verdict && (
              <div style={{ marginBottom: '40px' }}>
                <VerdictCard
                  verdict={verdict}
                  position={position}
                  fieldCount={fieldCount}
                  essentialFacts={essentialFacts}
                  mobileActions={mobileActions}
                />
              </div>
            )}

            {!verdict && mobileActions && (
              <div style={{ marginBottom: '40px' }}>{mobileActions}</div>
            )}

            {/* ScoreInField ("Where X sits in the field") removed from this slot
                (operator, 2026-07-25): the sidebar's "How X compares" table
                covers the same audited position/field numbers on this page, so
                the extra card read as a repeat. The component and its tests
                remain in the repo for surfaces without the sidebar table. */}

          </div>

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
.review-v2-prose li { font-family: var(--font-secondary); font-size: 18px; line-height: 1.65; }
.review-v2-prose > * > p { margin: 0 0 1.15em; }
/* The MDX renderer's shared H2 is 16px because it also serves compact V1
   contexts. Inside the 18px V2 article that inverted the hierarchy: section
   headings were smaller than the paragraphs they introduced. Keep the
   override local to Review V2 and restore a document-scale step. */
.review-v2-prose h2 {
  font-family: var(--font-secondary);
  font-size: 24px;
  line-height: 1.25;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--sfp-ink);
  margin: 2.25em 0 0.7em;
}
/* Tables render with StyledTable/StyledTh/StyledTd's own, un-overridden
   styling (lib/mdx/components.tsx, shared with all 216 V1 pages) — sans,
   uppercase+tracked header on the sky band — instead of the article's serif
   voice (operator, 2026-07-26: match V1's table look for consistency across
   review versions). Earlier this file forced tables into the 18px Georgia
   body font and stripped the header's uppercase/tracking; both overrides are
   gone, so a V2 table is now visually identical to the same component on a
   V1 page. */
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
  .review-v2-prose li { font-size: 17px; }
  .review-v2-prose h2 { font-size: 22px; margin-top: 2em; }
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
        </div>

        {/* Row 2, column 1 — the downstream zones, all of which carry their own
            CTA. Sharing column 1 with the article above keeps the left edge
            identical at every width; being in row 2 is what ends the sticky
            rail's containing block, so the rail is gone by the time these CTAs
            arrive. See the grid note at the top of this container. */}
        <div className={hasSidebar ? 'max-w-[760px] mx-auto lg:mx-0 lg:max-w-none lg:col-start-1 lg:row-start-2 lg:min-w-0' : 'max-w-[760px] mx-auto'}>
          {/* Final Decision — CTA-Zone 3, no nav entry (T0a). Rendered before
              Alternatives (operator, 2026-07-25): the closing judgement comes
              first, then the alternatives it references.
              compareHref is withheld whenever AlternativesSection renders
              below: it ends with the identical gold button pointing at the
              identical cockpit href, and the two came out ~5px apart. Passing
              null here rather than editing FinalDecision keeps that component's
              Null-Degradation contract intact — a review with no alternatives
              has no other compare route and still gets the button. */}
          {meta.finalDecision && (
            <div style={{ marginBottom: '40px' }}>
              <FinalDecision
                productName={productName}
                finalDecision={meta.finalDecision}
                compareHref={alternatives.length > 0 ? null : decisionBridge?.cockpitHref}
                compareLabel={compareLabel}
                affiliateUrl={affiliateUrl}
              />
              <CategoryRiskDisclosure category={category} hasLeverageRisk={meta.hasLeverageRisk} className="mt-3 text-xs" />
            </div>
          )}

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

          {/* Affiliate disclosure — moved out of ReviewHeader (operator,
              2026-07-21) to sit here, immediately before the methodology it
              refers to, instead of directly under the H1. The CTA-adjacent
              disclosure is unaffected: ReviewSidebar and ReviewMobileActions
              each render it directly beside their own Visit button. */}
          <div style={{ marginBottom: '28px' }}>
            <ReviewDisclosure category={category} hasLeverageRisk={meta.hasLeverageRisk} />
          </div>

          {/* Methodology — no nav entry (T0a) */}
          <div style={{ marginBottom: '40px' }}>
            <MethodologySection essentialFacts={essentialFacts} updateLog={meta.updateLog} />
          </div>

          {/* FAQ — no nav entry (T0a); includeSchema=false, the script above already
              emitted FAQPage. defaultOpen=false (operator, 2026-07-25): V2 reviews
              keep answers collapsed until clicked, unlike the sitewide default. */}
          {meta.faq && meta.faq.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <FAQSection faqs={meta.faq} includeSchema={false} defaultOpen={false} />
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

        {/* Desktop-only sticky right rail — mobile/tablet use the compact
            ReviewMobileActions surface inside VerdictCard above.
            Explicitly placed in row 1: it is last in the JSX, so auto-placement
            would drop it into a third row beneath the downstream block instead
            of beside the article. Row 1 also bounds its containing block, which
            is what stops the sticky behaviour before the closing CTA zones. */}
        {hasSidebar && decisionBridge && (
          <div className="hidden lg:block lg:col-start-2 lg:row-start-1 lg:mb-[124px]">
            <ReviewSidebar
              productName={productName}
              verifiedDate={meta.dataVerifiedDate ?? meta.modifiedDate ?? meta.publishDate}
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
