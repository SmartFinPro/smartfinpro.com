// components/research/ResearchCard.tsx
// Research Library — the "Research Dossier" card (2026-07 premium redesign).
// Server Component: presentational + links only, no state/events, no client
// JS (the "View evidence" / "Score breakdown" disclosures are native
// <details>/<summary>).
//
// TWO layouts, one honesty model:
//
//   standard  — the calm 2-col-grid card. Brand row (logo + name + tagline +
//               rank chip) with the score module top-right, a tinted 2x2 data
//               panel, key trade-off, evidence footer, CTA ladder.
//
//   featured  — the #1-ranked audited product's "Institutional Winner Dossier":
//               an asymmetric card whose RIGHT ~1/3 is a deep brand-navy
//               "Verdict Panel" (SmartFinPro navy accent — NOT a dark theme,
//               NO glassmorphism) carrying the single dominant winner moment:
//               "#1 Overall", the score, the audit line and a Score-breakdown
//               disclosure, with a faint "01" watermark and gold used only
//               punctually (award signet + the "#1"). The LEFT ~2/3 stays light
//               and holds the logo/name, best-for chip, a compact horizontal
//               facts strip, the key trade-off and the CTA ladder. On mobile the
//               panel collapses to a slim horizontal winner header ABOVE the
//               content (left "#N Overall", right score) — see WinnerPanel.
//               The old v1 gold top-border + eyebrow are gone: one winner
//               moment, not four competing gold/rank/eyebrow/score cues.
//
// HARD honesty rules enforced here (never relax these):
//   - Only `research.status === 'audited'` may render a numeric score or a
//     rank. Provisional/unavailable products NEVER show a number, a "—/10"
//     placeholder or a "rank 0" — VerificationStatus (3 distinct states) is the
//     only thing that speaks to status for those records. (featured is audited
//     by construction: the adapter only ever hands variant="featured" the #1
//     audited product.)
//   - `bestFor` (an implicit superlative/ranking claim) is only shown for
//     audited products; the light-blue pill is reserved for that best-for claim.
//   - The provider ("Visit provider") link is always the visually weakest CTA;
//     "Read research" (or "Compare" when there is no review) is always
//     strongest. Navy, never gold, on the primary button — this is a Discovery
//     surface, not a conversion surface.
//   - No review -> NEVER a dead/fabricated review link (Merrill Edge): the
//     primary CTA becomes "Compare" (the single-slug Cockpit handoff).
//   - "N sources" is never claimed for Object.keys(fieldSources).length (that
//     counts Tier-1 FACTS, not unique sources) — EvidenceDisclosure says
//     "N verified data points" instead; see that file's header comment.

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, GitCompare, Scale, Award, ShieldCheck } from 'lucide-react';
import type { ResearchProduct } from '@/lib/research/adapter';
import type { ConfidenceLevel } from '@/lib/comparison/types';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import { resolveCockpitCta } from '@/lib/comparison/cta';
import { scoreLabel } from '@/lib/reviews/score-label';
import { BrokerLogo } from './BrokerLogo';
import { ScoreBadge } from './ScoreBadge';
import { VerificationStatus, formatVerifiedDate } from './VerificationStatus';
import { EvidenceDisclosure } from './EvidenceDisclosure';

export interface ResearchCardProps {
  item: ResearchProduct;
  /** 'featured' = the #1-ranked audited product's "Institutional Winner
   *  Dossier" (own row above the calmer grid, navy verdict panel + punctual
   *  gold). 'standard' (default) = every other card. */
  variant?: 'standard' | 'featured';
}

interface KeyFact {
  key: string;
  label: string;
  value: string;
}

const PRIMARY_BTN_STYLE: CSSProperties = {
  background: 'var(--sfp-navy)',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 13.5,
  padding: '9px 16px',
  borderRadius: 8,
  textDecoration: 'none',
};

const OUTLINE_BTN_STYLE: CSSProperties = {
  background: 'transparent',
  color: 'var(--sfp-navy)',
  border: '1.5px solid var(--sfp-navy)',
  fontWeight: 600,
  fontSize: 13.5,
  padding: '7.5px 14px',
  borderRadius: 8,
  textDecoration: 'none',
};

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Presentational de-duplication (not a data change): the stored tagline often
 *  opens with the very phrase shown in the best-for chip
 *  ("Best overall — zero fees…"), so the card would say "Best overall" twice.
 *  When the chip is present, strip that leading "<bestFor> —/–/-/: " prefix
 *  from the DISPLAYED tagline and re-capitalise the remainder. */
function displayTaglineFor(tagline: string | null | undefined, bestFor: string | null | undefined): string | null {
  if (!tagline) return null;
  if (!bestFor) return tagline;
  const escaped = bestFor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = tagline.replace(new RegExp(`^\\s*${escaped}\\s*[—–:-]\\s*`, 'i'), '');
  if (stripped === tagline || stripped.length === 0) return tagline;
  return capitalize(stripped);
}

/** subScore key ("orderExecution" / "order_execution") -> "Order execution". */
function humanizeSubScoreKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** The featured card's navy "Verdict Panel" — the single dominant winner
 *  moment. Only ever rendered for the audited #1 product. On mobile it is a
 *  slim horizontal header (rank left, score right); at >=lg it becomes the
 *  full vertical right column with eyebrow, audit line, breakdown + watermark. */
function WinnerPanel({
  rank,
  score,
  confidence,
  dataVerifiedAt,
  subScores,
}: {
  rank: number;
  score: number;
  confidence: ConfidenceLevel | null;
  dataVerifiedAt: string | null;
  subScores: Record<string, number>;
}) {
  const label = scoreLabel(score);
  const watermark = String(rank).padStart(2, '0');
  const subs = Object.entries(subScores);
  const lightMuted = 'rgba(255,255,255,0.62)';

  return (
    <div
      className="relative order-1 flex items-center justify-between gap-4 overflow-hidden px-6 py-5 lg:order-2 lg:flex-col lg:items-start lg:justify-center lg:gap-4 lg:px-7 lg:py-8"
      style={{ background: 'linear-gradient(155deg, var(--sfp-navy) 0%, var(--sfp-navy-dark) 100%)' }}
    >
      {/* Faint rank watermark — desktop only; a large low-opacity numeral, not
          a translucent surface (no glassmorphism). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-8 hidden select-none font-black leading-none lg:block"
        style={{ fontSize: 168, color: 'rgba(255,255,255,0.06)' }}
      >
        {watermark}
      </span>

      {/* Eyebrow — desktop only. The visible rank/score/label below are
          aria-hidden: the single sr-only sentence at the end of the panel is
          the screen-reader source of truth, so the winner is announced once. */}
      <p
        aria-hidden="true"
        className="relative hidden text-[10px] font-bold uppercase tracking-[0.18em] lg:block"
        style={{ color: lightMuted }}
      >
        SmartFinPro Ranking
      </p>

      {/* Rank — the winner moment. Gold used punctually: award signet + "#N". */}
      <div aria-hidden="true" className="relative flex items-center gap-2">
        <Award size={18} aria-hidden="true" style={{ color: 'var(--sfp-gold)' }} />
        <span className="text-xl font-black tracking-tight lg:text-[26px]" style={{ color: '#ffffff' }}>
          <span style={{ color: 'var(--sfp-gold)' }}>#{rank}</span> Overall
        </span>
      </div>

      {/* Score lockup */}
      <div aria-hidden="true" className="relative flex flex-col items-end lg:items-start">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black leading-none tabular-nums lg:text-[52px]" style={{ color: '#ffffff' }}>
            {score.toFixed(1)}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            /10
          </span>
        </div>
        <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wider lg:mt-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
          {label}
        </span>
      </div>

      {/* Audit line + Score breakdown — desktop only (mobile keeps the panel to
          the two-line winner header; the full provenance lives on the card). */}
      <div className="relative mt-1 hidden flex-col gap-2 lg:flex">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: 'color-mix(in srgb, var(--sfp-green) 42%, white)' }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {['Audited', dataVerifiedAt ? formatVerifiedDate(dataVerifiedAt) : null, confidence ? `${capitalize(confidence)} confidence` : null]
            .filter(Boolean)
            .join(' · ')}
        </span>

        {subs.length > 0 ? (
          <details className="text-xs">
            <summary
              className="inline-flex cursor-pointer select-none items-center gap-1 font-semibold"
              style={{ color: 'rgba(255,255,255,0.88)' }}
            >
              Score breakdown
              <ArrowRight size={12} aria-hidden="true" />
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {subs.map(([key, value]) => (
                <li key={key} className="flex items-center justify-between gap-4" style={{ color: 'rgba(255,255,255,0.74)' }}>
                  <span>{humanizeSubScoreKey(key)}</span>
                  <span className="font-bold tabular-nums" style={{ color: '#ffffff' }}>
                    {value.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Component ratings — not a weighted formula.{' '}
              <Link href="/research#methodology" className="underline" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Methodology
              </Link>
            </p>
          </details>
        ) : (
          <Link
            href="/research#methodology"
            className="inline-flex items-center gap-1 text-xs font-semibold underline"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            Score methodology
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        )}
      </div>

      <span className="sr-only">{`Ranked number ${rank} overall. BEST-X score ${score.toFixed(1)} out of 10, rated ${label}.`}</span>
    </div>
  );
}

export function ResearchCard({ item, variant = 'standard' }: ResearchCardProps) {
  const { product, research, rank, reviewHref } = item;
  const isFeatured = variant === 'featured';
  const headingId = `research-card-${product.slug}-name`;

  const config = getTopicConfig(product.category, product.topic, product.market);
  const specColumns = config ? config.specColumns.slice(0, 4) : [];
  const keyFacts: KeyFact[] = specColumns.map((col) => ({
    key: col.key,
    label: col.label,
    value: col.format(col.accessor(product)),
  }));
  const labelFor = (key: string): string => specColumns.find((c) => c.key === key)?.label ?? key;

  const mainCon = product.cons && product.cons.length > 0 ? product.cons[0] : null;
  const displayTagline = displayTaglineFor(product.tagline, product.bestFor);

  // Single-slug Cockpit compare handoff — never a two-product state, the
  // Cockpit itself owns the `view=compare` contract.
  const compareHref = `/${product.market}/${product.category}/best/${product.topic}?compare=${encodeURIComponent(product.slug)}`;

  // The provider/affiliate CTA — always the weakest rung. Respects
  // resolveCockpitCta's external/tracked flags exactly like the Cockpit does.
  const providerCta = resolveCockpitCta(product);
  // Only render the weakest "Visit provider" rung when the resolved CTA is a
  // genuine EXTERNAL provider link. resolveCockpitCta returns an internal
  // "Read review" branch (external:false) for a product with a reviewSlug but
  // no externalUrl — rendering that as "Visit provider ↗" would point an
  // external-looking link at an internal page and duplicate the primary CTA.
  const hasProviderCta = providerCta.external && providerCta.href !== '#';

  const primary = reviewHref
    ? { label: 'Read research', href: reviewHref }
    : { label: 'Compare', href: compareHref };
  // "Compare" only needs its own (outline) slot when it isn't already the
  // primary CTA — otherwise it would appear twice on the same card.
  const showSecondaryCompare = !!reviewHref;

  // Narrows `research` to the audited variant once — every score/rank read
  // below goes through this, never a stored boolean, so the honesty gate is
  // visible at each call site.
  const audited = research.status === 'audited' ? research : null;
  const dataPointCount = Object.keys(research.fieldSources).length;
  // Present on provisional AND unavailable records — never on audited (whose
  // confidence is already explained by its own chip/panel).
  const confidenceReasonNote = !audited ? research.confidenceReason : null;

  const nameNode = reviewHref ? (
    <Link href={reviewHref} className="no-underline hover:underline" style={{ color: 'inherit' }}>
      {product.displayName}
    </Link>
  ) : (
    product.displayName
  );

  const bestForChip = audited && product.bestFor && (
    <span
      className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
    >
      {product.bestFor}
    </span>
  );

  const tradeOff = mainCon && (
    <div>
      <div
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
        style={{ color: 'var(--sfp-slate)' }}
      >
        <Scale size={12} aria-hidden="true" />
        Key trade-off
      </div>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
        {mainCon}
      </p>
    </div>
  );

  // CTA ladder — Read research/Compare strongest (navy), Compare outline
  // secondary, Visit provider weakest (text-only).
  const ctaRow = (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={primary.href} className="inline-flex items-center gap-1.5 transition-transform hover:-translate-y-0.5" style={PRIMARY_BTN_STYLE}>
        {primary.label}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
      {showSecondaryCompare && (
        <Link href={compareHref} className="inline-flex items-center gap-1.5 transition-transform hover:-translate-y-0.5" style={OUTLINE_BTN_STYLE}>
          <GitCompare size={14} aria-hidden="true" />
          Compare
        </Link>
      )}
      {hasProviderCta && (
        <a
          href={providerCta.href}
          {...(providerCta.external ? { target: '_blank', rel: 'nofollow sponsored noopener' } : {})}
          className="ml-auto inline-flex items-center gap-1 hover:underline"
          style={{ color: 'var(--sfp-slate)', fontSize: 12.5, fontWeight: 500, textDecoration: 'none' }}
        >
          Visit provider
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      )}
    </div>
  );

  // ── Featured: "Institutional Winner Dossier" ────────────────────────────
  if (isFeatured && audited) {
    return (
      <article className="card-light overflow-hidden rounded-2xl" aria-labelledby={headingId}>
        <div className="flex flex-col lg:grid lg:grid-cols-[1.9fr_1fr]">
          {/* LEFT — light content column (~2/3) */}
          <div className="order-2 flex flex-col gap-4 p-6 sm:p-7 lg:order-1">
            {/* Brand row — big logo + name + de-duplicated tagline. No rank
                chip and no score module here: the panel owns the winner moment,
                so the rank is never shown twice. Stacks on mobile (logo above
                name) so the tagline gets the full card width instead of a
                cramped column beside a wide logo. */}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <BrokerLogo slug={product.slug} displayName={product.displayName} initial={product.initial} variant="featured" />
              <div className="min-w-0">
                <h3 id={headingId} className="text-xl font-bold leading-tight sm:text-2xl" style={{ color: 'var(--sfp-ink)' }}>
                  {nameNode}
                </h3>
                {displayTagline && (
                  <p className="mt-0.5 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    {displayTagline}
                  </p>
                )}
              </div>
            </div>

            {bestForChip}

            {/* Compact horizontal facts strip — no heavy gray box; hairlines
                only (premium comes from proportion/whitespace, not chrome). */}
            {keyFacts.length > 0 && (
              <dl
                className="grid grid-cols-2 gap-x-6 gap-y-3 border-y py-3.5 sm:grid-cols-4"
                style={{ borderColor: 'var(--sfp-hairline)' }}
              >
                {keyFacts.map((fact) => (
                  <div key={fact.key}>
                    <dt className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {tradeOff}

            {/* CTA ladder directly under the trade-off — no forced min-height,
                no large empty container beneath it. */}
            {ctaRow}

            {/* Provenance footer. On mobile the winner panel is only the slim
                rank/score header (its audit line is lg-only), so the featured
                card's "Audited · date · confidence" chip is surfaced here on
                small screens — the biggest score on the page must never render
                without a visible provenance chip beside it (review I-1). On lg
                the panel carries it, so the chip is lg:hidden here. Evidence
                (per-fact sources) stays its own concern below it. */}
            <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'var(--sfp-hairline)' }}>
              <div className="lg:hidden">
                <VerificationStatus status="audited" dataVerifiedAt={audited.dataVerifiedAt} confidence={audited.confidence} />
              </div>
              {dataPointCount > 0 && <EvidenceDisclosure fieldSources={research.fieldSources} labelFor={labelFor} />}
            </div>
          </div>

          {/* RIGHT — navy verdict panel (~1/3); slim winner header on mobile */}
          <WinnerPanel
            rank={rank ?? 1}
            score={audited.score}
            confidence={audited.confidence}
            dataVerifiedAt={audited.dataVerifiedAt}
            subScores={audited.subScores}
          />
        </div>
      </article>
    );
  }

  // ── Standard card — unchanged structure; only the logo grew ─────────────
  return (
    <article className="card-light card-hover-lift flex flex-col gap-4 rounded-xl p-5 sm:p-6" aria-labelledby={headingId}>
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrokerLogo slug={product.slug} displayName={product.displayName} initial={product.initial} variant="standard" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {audited && rank !== null && (
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 items-center rounded-md px-2 text-xs font-bold"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  #{rank}
                </span>
              )}
              <h3 id={headingId} className="text-lg font-bold leading-tight" style={{ color: 'var(--sfp-ink)' }}>
                {nameNode}
              </h3>
            </div>
            {displayTagline && (
              <p className="mt-0.5 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                {displayTagline}
              </p>
            )}
          </div>
        </div>

        {audited && (
          <div className="flex-shrink-0 text-right">
            <ScoreBadge score={audited.score} size="default" rank={rank} />
            <Link
              href="/research#methodology"
              className="mt-1 inline-block text-[11px] font-medium underline"
              style={{ color: 'var(--sfp-navy)' }}
            >
              Why this score?
            </Link>
          </div>
        )}
      </header>

      {bestForChip}

      {keyFacts.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg px-4 py-4" style={{ background: 'var(--sfp-gray)' }}>
          {keyFacts.map((fact) => (
            <div key={fact.key}>
              <dt className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
                {fact.label}
              </dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {tradeOff}

      <footer className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'var(--sfp-hairline)' }}>
        <VerificationStatus status={research.status} dataVerifiedAt={research.dataVerifiedAt} confidence={research.confidence} />
        {confidenceReasonNote && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {confidenceReasonNote}
          </p>
        )}
        {dataPointCount > 0 && <EvidenceDisclosure fieldSources={research.fieldSources} labelFor={labelFor} />}
      </footer>

      {ctaRow}
    </article>
  );
}
