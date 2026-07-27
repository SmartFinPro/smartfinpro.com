// components/research/CatalogCard.tsx
// Research Discovery — the market-agnostic catalog card for every projection
// ResearchCard does not own (unified-research-discovery-pr2-hubs plan, Task 3;
// spec §9.1). Server Component: presentational + links only, no client JS.
//
// Used for:
//   - a plain review projection (kind: 'review') — the item has MDX-editorial
//     provenance but no qualified Cockpit context;
//   - a Cockpit-only PROVISIONAL dossier projection (kind: 'dossier',
//     item.review === null, context.status === 'provisional') — too little
//     is known yet for the full ResearchCard evidence/methodology treatment;
//   - the production degradation path in ResearchHubPage when an audited
//     projection's dossier sidecar row is unexpectedly missing (spec §13:
//     "Dossier-Node fehlt -> Item degradiert auf Review, falls vorhanden").
//
// Every other qualified dossier (audited, or provisional WITH a review) is
// ResearchCard's job — see ResearchHubPage's resolveHubNode.
//
// HARD honesty rules (never relax — spec §9.1):
//   - `Audited · x/10` only when `context.status === 'audited'` and a real
//     `auditedScore` is present.
//   - Otherwise `Editorial · x/5` — only when the item has a review (its own
//     MDX rating). No star icon, no `reviewCount`, ever.
//   - A Cockpit-only PROVISIONAL projection reads `In verification` with no
//     number of any kind.
//   - No fabricated date: the "Updated" line only renders when
//     `item.display.sortDate` is a genuine, non-null value.
//
// DOM contract (spec §9.1 / §8): no outer anchor — the title is its own
// Link, the Methodology chip is a separate sibling Link. Never nested.

import Link from 'next/link';
import { categoryConfig } from '@/lib/i18n/config';
import { formatVerifiedDate } from './VerificationStatus';
import { researchBaseForMarket, type DiscoveryProjection } from '@/lib/research/catalog-shell-logic';

export interface CatalogCardProps {
  projection: DiscoveryProjection;
  methodologyHref?: string;
}

export function CatalogCard({ projection, methodologyHref = '/methodology' }: CatalogCardProps) {
  const { item, context } = projection;

  // Cockpit-only fallback (context present, no review) reuses the exact same
  // "<compareBaseHref>?compare=<slug>" shape ResearchCard's own compareHref
  // computes for a no-review product — the two must never drift (spec §7.4 /
  // this task's merge-blocker requirement: JSON-LD and raw HTML describe the
  // same rendered things).
  const cockpitHref = context
    ? `${context.compareBaseHref}?compare=${encodeURIComponent(context.productSlug)}`
    : researchBaseForMarket(item.market);
  const primaryHref = item.review?.href ?? cockpitHref;

  const ratingLabel =
    context?.status === 'audited' && context.auditedScore !== null
      ? `Audited · ${context.auditedScore.toFixed(1)}/10`
      : item.review
        ? `Editorial · ${item.review.editorialRating.toFixed(1)}/5`
        : 'In verification';

  const ratingColor =
    context?.status === 'audited' && context.auditedScore !== null
      ? 'var(--sfp-green)'
      : item.review
        ? 'var(--sfp-navy)'
        : 'var(--sfp-slate)';

  const updatedLabel = item.display.sortDate ? formatVerifiedDate(item.display.sortDate) : null;

  return (
    <article
      className="card-light flex flex-col gap-3 rounded-xl p-5 sm:p-6"
      data-discovery-item={item.id}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
        {categoryConfig[item.category].name}
      </p>

      <h3 className="text-lg font-bold leading-tight" style={{ color: 'var(--sfp-ink)' }}>
        <Link href={primaryHref} className="no-underline hover:underline" style={{ color: 'inherit' }}>
          {item.display.title}
        </Link>
      </h3>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
        {item.display.description}
      </p>

      {item.display.bestFor && (
        <span
          className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
        >
          {item.display.bestFor}
        </span>
      )}

      <div
        className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-3"
        style={{ borderColor: 'var(--sfp-hairline)' }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold" style={{ color: ratingColor }}>
            {ratingLabel}
          </span>
          {updatedLabel && (
            <span className="text-[11px]" style={{ color: 'var(--sfp-slate)' }}>
              Updated {updatedLabel}
            </span>
          )}
        </div>
        <Link
          href={methodologyHref}
          className="text-xs font-semibold underline"
          style={{ color: 'var(--sfp-navy)' }}
        >
          Methodology
        </Link>
      </div>
    </article>
  );
}
