// components/reviews/review-header.tsx — V2 review page header (T7)
// ============================================================
// Server Component (no state/events/browser APIs — pure prop-driven render).
// Renders the Betreiber-Konzept §6.2 header contract: breadcrumb slot, H1,
// positioning lead line, MetaLine. The DisclosureLine moved OUT (operator,
// 2026-07-21) — it now renders immediately before the Methodology section, see
// components/reviews/review-disclosure.tsx. See the parent plan
// (users-christianb-library-mobile-documen-atomic-charm.md, Phase 2 / T7)
// for the exact wording and structure this implements.
//
// Props-Prinzip (plan clarification): this is a V2 LAYOUT component, not an
// MDX-registry tag. It receives typed data as props from ReviewLayoutV2 (a
// Server Component) — that pattern is correct and intended here, unlike the
// old MDX `<ExpertBox name="..." credentials="..." />` fabrication vector
// the editorial-integrity remediation removed. The Proplos-Prinzip stays in
// force for MDX-registry tags only.
//
// Source-of-truth (T0d): `positioning` comes from hand-verified verdict
// frontmatter (lib/reviews/verdict-frontmatter.ts) — never an unaudited DB
// field. The MetaLine deliberately reads "SmartFinPro Research" — no named
// individual, no credential, no synthetic fact-check date (see the parent
// plan's "Integritäts-Adaptionen des Konzepts" table, row 1). Missing dates
// drop their MetaLine segment entirely — no placeholder, no synthetic date.
// ============================================================

import { Breadcrumb } from '@/components/marketing/breadcrumb';
import type { BreadcrumbItem } from '@/lib/breadcrumbs';
import type { Category } from '@/lib/i18n/config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * ISO YYYY-MM-DD → "18 Jul 2026". Manual parse (no `Date`) so the render is
 * deterministic regardless of server timezone — same technique already used
 * by components/marketing/decision-bridge.tsx's formatVerifiedDate. Returns
 * null for anything that doesn't parse as a valid calendar date, so a
 * malformed value silently drops its MetaLine segment instead of rendering
 * "Invalid Date".
 */
function formatIsoDate(iso: string): string | null {
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export interface ReviewHeaderProps {
  /** Page H1, rendered as-is — WITHOUT the V1 " — Expert Review & Analysis Report {year}" suffix. */
  title: string;
  /** verdict.positioning (18-30 words, lib/reviews/verdict-frontmatter.ts). Omitted entirely when absent — no placeholder. */
  positioning?: string;
  /** Pre-built via lib/breadcrumbs.ts buildBreadcrumbs() — this component only renders the slot, it never builds breadcrumbs itself. */
  breadcrumbs: BreadcrumbItem[];
  category: Category;
  /** ISO YYYY-MM-DD — ContentMeta.dataVerifiedDate. Segment omitted (not placeholder'd) when absent or malformed. */
  dataVerifiedDate?: string;
  /** ISO YYYY-MM-DD — ContentMeta.modifiedDate. Segment omitted (not placeholder'd) when absent or malformed. */
  modifiedDate?: string;
}

export function ReviewHeader({
  title,
  positioning,
  breadcrumbs,
  category,
  dataVerifiedDate,
  modifiedDate,
}: ReviewHeaderProps) {
  const verifiedLabel = dataVerifiedDate ? formatIsoDate(dataVerifiedDate) : null;
  const updatedLabel = modifiedDate ? formatIsoDate(modifiedDate) : null;

  const metaSegments: string[] = ['SmartFinPro Research'];
  if (verifiedLabel) metaSegments.push(`Data verified ${verifiedLabel}`);
  if (updatedLabel) metaSegments.push(`Updated ${updatedLabel}`);

  return (
    <header style={{ fontFamily: 'var(--font-primary)' }}>
      {/* The leaf crumb is the full page title — left alone it wrapped to
          several lines and pushed the H1 far below the fold. The shared
          Breadcrumb also serves V1 pages, so the constraint is scoped HERE
          via descendant selectors instead of editing the shared component.
          Below sm the leaf is hidden outright rather than truncated. Two
          reasons, both measured:
            - Truncating it forced shrink-0 onto the ancestor crumbs (they
              otherwise collapse to min-content and wrap instead), and those
              three fixed-width crumbs plus chevrons overflow a 320px
              viewport: document.scrollWidth 349 against clientWidth 320,
              i.e. the whole page scrolled sideways — a WCAG 1.4.10 failure
              at exactly the width 1.4.10 is tested at.
            - What survived truncation at 390px was "e…". A single letter
              followed by an ellipsis reads as a rendering fault, not as an
              abbreviation, and the leaf is not a link (it is the current
              page) whose full text stands directly below as the H1.
          The label stays in the DOM and in the BreadcrumbList JSON-LD, which
          components/marketing/breadcrumb.tsx builds from the data rather
          than the DOM — so the schema keeps all four positions either way.
          From sm up there is room and the full leaf is shown. */}
      <div className="[&_nav]:min-w-0 [&_nav>span:last-child]:hidden sm:[&_nav>span:last-child]:flex sm:[&_nav>span:not(:last-child)]:shrink-0 sm:[&_nav>span:last-child]:min-w-0 sm:[&_nav>span:last-child>svg]:shrink-0 sm:[&_nav>span:last-child>span:last-child]:truncate">
        <Breadcrumb items={breadcrumbs} />
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: 'clamp(1.75rem, 3.4vw, 2.5rem)',
          lineHeight: 1.15,
          letterSpacing: '-0.015em',
          fontWeight: 400,
          color: 'var(--sfp-ink)',
          margin: '0 0 12px',
        }}
      >
        {title}
      </h1>

      {positioning && (
        <p
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: 'clamp(19px, 2vw, 21px)',
            lineHeight: 1.5,
            color: 'var(--sfp-slate)',
            margin: '0 0 14px',
            maxWidth: '66ch',
          }}
        >
          {positioning}
        </p>
      )}

      <div
        style={{
          fontFamily: 'var(--font-primary)',
          fontSize: '12.5px',
          color: 'var(--sfp-slate)',
          letterSpacing: '0.01em',
          margin: '0 0 16px',
        }}
      >
        {metaSegments.join(' · ')}
      </div>
    </header>
  );
}
