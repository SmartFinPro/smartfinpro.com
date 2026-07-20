// components/reviews/review-header.tsx — V2 review page header (T7)
// ============================================================
// Server Component (no state/events/browser APIs — pure prop-driven render).
// Renders the Betreiber-Konzept §6.2 header contract: breadcrumb slot, H1,
// positioning lead line, MetaLine, DisclosureLine. See the parent plan
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

import Link from 'next/link';
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

/**
 * Categories where the DisclosureLine gets a terse leverage-risk addendum.
 * This condenses the same CFD/leverage fact already carried in full by
 * lib/reviews/category-disclaimers.ts (the trading/forex disclaimer
 * rendered elsewhere via CategoryRiskDisclosure) — it is a one-clause echo
 * for this compact header line, not a replacement for the full disclosure.
 */
const LEVERAGE_RISK_CATEGORIES: ReadonlySet<Category> = new Set(['trading', 'forex']);

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
  /** Product-level leverage/CFD flag. The leverage-risk addendum shows ONLY
   *  when the product actually carries that risk — not for every trading/forex
   *  page (eToro US offers no CFDs). */
  hasLeverageRisk?: boolean;
}

export function ReviewHeader({
  title,
  positioning,
  breadcrumbs,
  category,
  dataVerifiedDate,
  modifiedDate,
  hasLeverageRisk,
}: ReviewHeaderProps) {
  const verifiedLabel = dataVerifiedDate ? formatIsoDate(dataVerifiedDate) : null;
  const updatedLabel = modifiedDate ? formatIsoDate(modifiedDate) : null;

  const metaSegments: string[] = ['SmartFinPro Research'];
  if (verifiedLabel) metaSegments.push(`Data verified ${verifiedLabel}`);
  if (updatedLabel) metaSegments.push(`Updated ${updatedLabel}`);

  const showRiskAddendum = LEVERAGE_RISK_CATEGORIES.has(category) && Boolean(hasLeverageRisk);

  return (
    <header style={{ fontFamily: 'var(--font-primary)' }}>
      <Breadcrumb items={breadcrumbs} />

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

      <p
        className="text-xs"
        style={{
          fontFamily: 'var(--font-primary)',
          color: 'var(--sfp-slate)',
          lineHeight: 1.5,
          margin: 0,
          maxWidth: '66ch',
        }}
      >
        SmartFinPro may earn a commission from partner links. This never affects our BEST-X Score.{' '}
        <Link href="/affiliate-disclosure" style={{ color: 'var(--sfp-navy)' }}>
          How we make money
        </Link>
        {showRiskAddendum
          ? ' Leveraged trading products carry a high risk of losing money rapidly.'
          : null}
      </p>
    </header>
  );
}
