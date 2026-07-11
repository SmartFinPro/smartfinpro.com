// lib/comparison/cta.ts
// Single source of truth for the CTA ladder rendered by every Cockpit surface
// (card / table / compare / verdict). Pure — safe to import from server and
// client components. Output is byte-identical to the ladders it replaces
// (guarded by __tests__/unit/cockpit-cta-resolver.test.ts).
//
// IMPORTANT: the rendered ctaMode is derived from the ladder, NOT taken from
// product.ctaMode — the ladder checks externalUrl BEFORE reviewSlug, so a
// product with ctaMode='review' + externalUrl renders as a 'visit' CTA.

import type { ProductForComparison } from '@/lib/comparison/types';
import type { CockpitCtaMode, CockpitDestinationType } from '@/lib/analytics/cockpit-events';

export interface ResolvedCockpitCta {
  label: string;
  href: string;
  external: boolean;
  tracked: boolean;
  ctaMode: CockpitCtaMode;
  destinationType: CockpitDestinationType;
}

export function reviewHrefFor(p: ProductForComparison): string | null {
  return p.reviewSlug ? `/${p.market}/${p.category}/${p.reviewSlug}` : null;
}

/** The PRIMARY provider CTA (green button) — offer → tracked /go; otherwise an
 *  external visit (attribution gate stays closed for unverified providers);
 *  otherwise the internal review; otherwise unavailable. */
export function resolveCockpitCta(p: ProductForComparison): ResolvedCockpitCta {
  if (p.ctaMode === 'offer') {
    return { label: 'View offer', href: `/go/${p.slug}`, external: false, tracked: true, ctaMode: 'offer', destinationType: 'affiliate' };
  }
  if (p.externalUrl) {
    return { label: 'Visit site', href: p.externalUrl, external: true, tracked: false, ctaMode: 'visit', destinationType: 'outbound' };
  }
  const reviewHref = reviewHrefFor(p);
  if (reviewHref) {
    return { label: 'Read review', href: reviewHref, external: false, tracked: false, ctaMode: 'review', destinationType: 'internal_review' };
  }
  return { label: 'Visit site', href: '#', external: true, tracked: false, ctaMode: 'unavailable', destinationType: 'unavailable' };
}

export interface ResolvedReviewCta {
  href: string;
  ctaMode: 'review';
  destinationType: 'internal_review';
}

/** The card's title link and secondary "Read review" link — ALWAYS the
 *  internal review page, regardless of what the primary CTA resolves to. */
export function resolveReviewCta(p: ProductForComparison): ResolvedReviewCta | null {
  const href = reviewHrefFor(p);
  return href ? { href, ctaMode: 'review', destinationType: 'internal_review' } : null;
}
