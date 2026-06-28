// components/marketing/comparison-card.tsx
// Presentational comparison card. Renders entirely from props in the component
// body (no useEffect) so the server-rendered initial HTML contains every fact
// (AEO/SSR requirement). Used by <ComparisonEngine/>.

import type { ReactNode } from 'react';
import {
  BadgeCheck,
  PartyPopper,
  Check,
  X,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  Apple,
  Smartphone,
  Globe,
} from 'lucide-react';
import type { ProductForComparison, Usage } from '@/lib/comparison/types';
import { annualCost, DEFAULT_USAGE } from '@/lib/comparison/ranking';

// Approved Comparison-Engine palette (v13 reference-matched). Intentionally
// includes a few hexes outside the core brand tokens (green CTA, indigo accent)
// that the design sign-off locked in.
const C = {
  ink: '#1A1F36',
  slate: '#6B7280',
  body: '#374151',
  border: '#E1E7F0',
  borderStrong: '#C9D1DC',
  lineSoft: '#EEF1F6',
  navy: '#1B4F8C',
  navyDark: '#163D6E',
  sky: '#E8F0FB',
  ctaGreen: '#54B269',
  checkGreen: '#16A34A',
  checkBlue: '#2563EB',
  red: '#DC2626',
  indigo: '#5046E5',
  tile: '#00B67A',
  pill: '#EAEFF9',
} as const;

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

const badgeColors: Record<string, { bg: string; fg: string }> = {
  gold: { bg: '#F5A623', fg: C.navyDark },
  green: { bg: '#E3F1E8', fg: '#1A6B3A' },
  sky: { bg: C.sky, fg: C.navyDark },
};

export interface ComparisonCardProps {
  product: ProductForComparison;
  rank: number;
  usage: Usage;
  isMatch: boolean;
  expanded: boolean;
  onToggleDetails: (slug: string) => void;
  onOfferClick: (product: ProductForComparison) => void;
}

export function ComparisonCard({
  product: p,
  rank,
  usage,
  isMatch,
  expanded,
  onToggleDetails,
  onOfferClick,
}: ComparisonCardProps) {
  const cost = annualCost(p, usage);
  const base = annualCost(p, DEFAULT_USAGE);
  const changed = Math.round(cost) !== Math.round(base);
  const isTop = rank === 1;
  const filledTiles = Math.max(0, Math.min(5, Math.round(p.rating)));

  const reviewHref = p.reviewSlug ? `/${p.market}/${p.category}/${p.reviewSlug}` : null;
  let primary: { label: string; href: string; variant: 'green' | 'outline'; external?: boolean; tracked?: boolean };
  if (p.ctaMode === 'offer') {
    primary = { label: 'View offer', href: `/go/${p.slug}`, variant: 'green', tracked: true };
  } else if (p.ctaMode === 'review' && reviewHref) {
    primary = { label: 'Read review', href: reviewHref, variant: 'outline' };
  } else {
    primary = { label: 'Visit site', href: p.externalUrl || '#', variant: 'outline', external: true };
  }

  const showReadReviewInRating = p.ctaMode === 'offer' && !!reviewHref;

  return (
    <div
      style={{
        background: '#fff',
        border: isTop ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '22px 24px',
        marginBottom: 14,
        boxShadow: isMatch ? `0 0 0 2px ${C.ctaGreen}` : '0 1px 3px rgba(27,79,140,.05)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
          <div
            aria-hidden="true"
            style={{
              width: 58,
              height: 58,
              borderRadius: 12,
              background: rank % 2 === 0 ? C.navyDark : C.navy,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 29,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {p.initial}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 23, fontWeight: 700, color: C.ink, letterSpacing: '-.4px' }}>{p.displayName}</span>
              {p.verified && (
                <span style={{ color: C.checkGreen, fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <BadgeCheck size={16} aria-hidden="true" /> Verified
                </span>
              )}
              {isMatch && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#F5A623', color: C.navyDark, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <PartyPopper size={13} aria-hidden="true" /> Your match
                </span>
              )}
              {p.badges.map((b) => {
                const col = badgeColors[b.type] ?? badgeColors.sky;
                return (
                  <span key={b.label} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: col.bg, color: col.fg }}>
                    {b.label}
                  </span>
                );
              })}
            </div>
            {p.tagline && <div style={{ fontSize: 15, color: C.slate, marginTop: 5 }}>{p.tagline}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <a
            href={primary.href}
            className="cmp-cta"
            {...(primary.external ? { target: '_blank', rel: 'nofollow sponsored noopener' } : {})}
            onClick={primary.tracked ? () => onOfferClick(p) : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: primary.variant === 'green' ? '14px 30px' : '13px 26px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: primary.variant === 'green' ? 700 : 600,
              letterSpacing: primary.variant === 'green' ? '.5px' : undefined,
              textDecoration: 'none',
              background: primary.variant === 'green' ? C.ctaGreen : '#fff',
              color: primary.variant === 'green' ? '#fff' : C.navy,
              border: primary.variant === 'green' ? 'none' : `1.5px solid ${C.navy}`,
            }}
          >
            {primary.label} <ArrowRight size={16} aria-hidden="true" />
          </a>
          <div style={{ fontSize: 12.5, color: C.slate, marginTop: 8 }}>
            {p.ctaMode === 'offer' ? `on ${p.displayName.toLowerCase()}.com` : p.ctaMode === 'review' ? 'independent review' : 'on provider site'}
          </div>
        </div>
      </div>

      {/* Chips */}
      {p.chips.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 15 }}>
          {p.chips.map((chip) => (
            <span
              key={chip}
              style={{ fontSize: 13.5, color: C.navyDark, background: C.pill, borderRadius: 20, padding: '7px 14px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 500 }}
            >
              <Check size={15} style={{ color: C.checkGreen }} aria-hidden="true" />
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* 4-col spec row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '20px 0 4px' }}>
        <Spec label="Monthly fee" value={p.monthlyFee ? money(p.monthlyFee) : '$0'} sub={p.monthlyFee ? 'per month' : 'no minimums'} />
        <Spec label="Signup bonus" value={p.signupBonus ? money(p.signupBonus) : '—'} sub={p.signupBonus ? 'new accounts' : ''} />
        <Spec label="FX fee" value={`${p.fxFeePct}%`} sub={p.fxFeePct === 0 ? 'no FX markup' : 'on intl spend'} subColor={p.fxFeePct === 0 ? C.indigo : C.slate} />
        <Spec
          label="Cost / yr"
          value={money(cost)}
          subNode={
            <>
              {changed && <span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>{money(base)}</span>}
              {changed && ' · '}
              <span style={{ color: C.indigo }}>re-ranks live</span>
            </>
          }
        />
      </div>

      {/* Pros / Cons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, margin: '18px 0 2px' }}>
        <div>
          {p.pros.map((x) => (
            <LineItem key={x} kind="pro" text={x} />
          ))}
        </div>
        <div>
          {p.cons.map((x) => (
            <LineItem key={x} kind="con" text={x} />
          ))}
        </div>
      </div>

      {/* Dashed divider + rating row */}
      <div style={{ borderTop: `1px dashed ${C.borderStrong}`, margin: '18px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: C.ink, letterSpacing: '-.5px' }}>{p.rating.toFixed(1)}</span>
          <div style={{ display: 'flex', gap: 4 }} aria-label={`${p.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                style={{ width: 24, height: 24, borderRadius: 4, background: i < filledTiles ? C.tile : '#E1E7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Star size={14} color="#fff" fill="#fff" aria-hidden="true" />
              </span>
            ))}
          </div>
          <span style={{ fontSize: 14, color: C.slate }}>
            <b style={{ color: C.ink, fontWeight: 600 }}>{p.reviewCount.toLocaleString('en-US')}</b> reviews
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {showReadReviewInRating && reviewHref && (
            <a className="cmp-cta" href={reviewHref} style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, textDecoration: 'none', background: C.sky, color: C.checkBlue, border: `1px solid ${C.sky}` }}>
              Read review
            </a>
          )}
          <button
            type="button"
            onClick={() => onToggleDetails(p.slug)}
            aria-expanded={expanded}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', background: '#fff', color: C.ink, border: `1px solid ${C.borderStrong}` }}
          >
            View details {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div style={{ background: '#FAFBFD', border: `1px solid ${C.lineSoft}`, borderRadius: 10, padding: '18px 20px', marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 13 }}>Our sub-scores</div>
          <ScoreBar label="Fees" value={p.subScores.fees} />
          <ScoreBar label="Features" value={p.subScores.features} />
          <ScoreBar label="UX" value={p.subScores.ux} />
          <ScoreBar label="Support" value={p.subScores.support} />

          <div style={{ marginTop: 8 }}>
            <SpecRow label="Effective APR" value={p.effectiveApr ?? '—'} />
            <SpecRow label="Cashback" value={p.cashback ?? '—'} />
            <SpecRow label="Card network" value={p.cardNetwork ?? '—'} />
            <SpecRow label="Wire transfers" value={p.wireTransfers ?? '—'} />
            <SpecRow label="FDIC coverage" value={p.fdicCoverage ?? '—'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.lineSoft}`, fontSize: 14 }}>
              <span style={{ color: C.slate }}>Apps</span>
              <span style={{ display: 'inline-flex', gap: 12, color: C.slate }}>
                {p.apps.includes('apple') && <Apple size={18} aria-label="iOS" />}
                {p.apps.includes('android') && <Smartphone size={18} aria-label="Android" />}
                {p.apps.includes('web') && <Globe size={18} aria-label="Web" />}
              </span>
            </div>
          </div>

          {p.verdict && (
            <div style={{ background: C.sky, borderLeft: `3px solid ${C.navy}`, borderRadius: '0 8px 8px 0', padding: '10px 13px', marginTop: 14, fontSize: 13.5, color: C.navyDark, fontStyle: 'italic' }}>
              {p.verdict} — <span style={{ fontStyle: 'normal', fontWeight: 600 }}>SmartFinPro verdict</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spec({ label, value, sub, subColor, subNode }: { label: string; value: string; sub?: string; subColor?: string; subNode?: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, lineHeight: 1.05, letterSpacing: '-.3px' }}>{value}</div>
      {subNode ? (
        <div style={{ fontSize: 12.5, marginTop: 5, fontWeight: 500 }}>{subNode}</div>
      ) : sub ? (
        <div style={{ fontSize: 12.5, color: subColor ?? C.slate, marginTop: 5, fontWeight: 500 }}>{sub}</div>
      ) : null}
    </div>
  );
}

function LineItem({ kind, text }: { kind: 'pro' | 'con'; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 14.5, lineHeight: 1.55, marginBottom: 11, color: C.body }}>
      {kind === 'pro' ? (
        <Check size={17} style={{ color: C.checkGreen, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      ) : (
        <X size={17} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      )}
      <span>{text}</span>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 34px', alignItems: 'center', gap: 12, marginBottom: 9 }}>
      <span style={{ fontSize: 13.5, color: C.ink }}>{label}</span>
      <div style={{ height: 7, background: '#E1E7F0', borderRadius: 4, overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, value * 10))}%`, background: C.navy, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: C.navyDark, textAlign: 'right' }}>{value.toFixed(1)}</span>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.lineSoft}`, fontSize: 14 }}>
      <span style={{ color: C.slate }}>{label}</span>
      <span style={{ fontWeight: 600, color: C.ink }}>{value}</span>
    </div>
  );
}
