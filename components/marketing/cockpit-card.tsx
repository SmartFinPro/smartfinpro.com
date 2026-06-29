// components/marketing/cockpit-card.tsx
// Presentational Cockpit card — renders entirely from props in the body (no
// useEffect) so SSR HTML carries every fact (AEO). Config-driven: spec cells,
// detail rows and the live X-yr cost come from the TopicConfig. Mirrors the
// locked comparison-card design.

import {
  BadgeCheck,
  PartyPopper,
  Check,
  X,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import type { ProductForComparison } from '@/lib/comparison/types';
import type { TopicConfig } from '@/lib/comparison/topics/types';
import { costOverTime, type CostInputs } from '@/lib/comparison/cost';

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
  greenDark: '#3F9655',
  checkGreen: '#16A34A',
  link: '#3B5FD9',
  checkBlue: '#2563EB',
  red: '#DC2626',
  indigo: '#5046E5',
  tile: '#00B67A',
  pill: '#EAEFF9',
} as const;

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

const badgeColors: Record<string, { bg: string; fg: string }> = {
  gold: { bg: '#F5A623', fg: C.navyDark },
  green: { bg: '#E3F1E8', fg: '#1A6B3A' },
  sky: { bg: C.sky, fg: C.navyDark },
};

const hostFromUrl = (url: string | null): string => {
  if (!url) return 'provider site';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'provider site';
  }
};

export interface CockpitCardProps {
  product: ProductForComparison;
  rank: number;
  config: TopicConfig;
  inputs: CostInputs;
  isMatch: boolean;
  selected: boolean;
  expanded: boolean;
  isColWinner: (colKey: string, p: ProductForComparison) => boolean;
  isCostWinner: (p: ProductForComparison) => boolean;
  onToggleDetails: (slug: string) => void;
  onToggleSelect: (slug: string) => void;
  onOfferClick: (product: ProductForComparison) => void;
}

export function CockpitCard({
  product: p,
  rank,
  config,
  inputs,
  isMatch,
  selected,
  expanded,
  isColWinner,
  isCostWinner,
  onToggleDetails,
  onToggleSelect,
  onOfferClick,
}: CockpitCardProps) {
  const isTop = rank === 1;
  const cost = costOverTime(p, config.costModel, inputs);
  const filledTiles = Math.max(0, Math.min(5, Math.round(p.rating)));
  const specCells = config.specColumns.slice(0, 3);

  const reviewHref = p.reviewSlug ? `/${p.market}/${p.category}/${p.reviewSlug}` : null;
  // Primary is always the green "go to provider" button (matches the business-banking
  // engine's offer card). Verified offer → tracked /go; otherwise an external visit to
  // the provider's own site (NO /go — the attribution gate stays intact for unverified
  // providers). "Read review" rides along as the blue secondary whenever a review exists.
  let primary: { label: string; href: string; external?: boolean; tracked?: boolean };
  if (p.ctaMode === 'offer') {
    primary = { label: 'View offer', href: `/go/${p.slug}`, tracked: true };
  } else if (p.externalUrl) {
    primary = { label: 'Visit site', href: p.externalUrl, external: true };
  } else if (reviewHref) {
    primary = { label: 'Read review', href: reviewHref };
  } else {
    primary = { label: 'Visit site', href: '#', external: true };
  }
  const showReadReviewInRating = !!reviewHref && primary.href !== reviewHref;

  return (
    <div
      style={{
        background: '#fff',
        border: isMatch ? `2px solid ${C.ctaGreen}` : isTop ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '22px 24px',
        marginBottom: 14,
        boxShadow: isMatch ? '0 4px 20px rgba(84,178,107,.16)' : '0 1px 3px rgba(27,79,140,.05)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
          <div
            aria-hidden="true"
            style={{ width: 52, height: 52, borderRadius: 12, background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}
          >
            {p.initial}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-.4px' }}>{p.displayName}</span>
              {p.verified && (
                <span style={{ color: C.greenDark, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <BadgeCheck size={15} aria-hidden="true" /> Verified
                </span>
              )}
              {isMatch && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: C.ctaGreen, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <PartyPopper size={12} aria-hidden="true" /> Your match
                </span>
              )}
              {p.badges.map((b) => {
                const col = badgeColors[b.type] ?? badgeColors.sky;
                return (
                  <span key={b.label} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: col.bg, color: col.fg }}>
                    {b.label}
                  </span>
                );
              })}
            </div>
            {p.tagline && <div style={{ fontSize: 14, color: C.slate, marginTop: 4 }}>{p.tagline}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
          <a
            href={primary.href}
            className="cmp-cta"
            {...(primary.external ? { target: '_blank', rel: 'nofollow sponsored noopener' } : {})}
            onClick={primary.tracked ? () => onOfferClick(p) : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '14px 30px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '.5px',
              textDecoration: 'none',
              background: C.ctaGreen,
              color: '#fff',
              border: 'none',
            }}
          >
            {primary.label} <ArrowRight size={16} aria-hidden="true" />
          </a>
          <div style={{ fontSize: 12.5, color: C.slate, marginTop: 8 }}>on {hostFromUrl(p.externalUrl)}</div>
          <button
            type="button"
            onClick={() => onToggleSelect(p.slug)}
            aria-pressed={selected}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12.5, fontWeight: selected ? 600 : 500, color: selected ? C.greenDark : C.slate, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {selected ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
            {selected ? 'Comparing' : 'Compare'}
          </button>
        </div>
      </div>

      {/* Chips */}
      {p.chips.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 15 }}>
          {p.chips.map((chip) => (
            <span key={chip} style={{ fontSize: 12.5, color: C.navyDark, background: C.pill, borderRadius: 20, padding: '6px 13px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <Check size={14} style={{ color: C.greenDark }} aria-hidden="true" />
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Spec row: first 3 config columns + live X-yr cost */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '18px 0 4px' }}>
        {specCells.map((col) => {
          const win = isColWinner(col.key, p);
          return (
            <Spec key={col.key} label={col.label} value={col.format(col.accessor(p))} win={win} />
          );
        })}
        <Spec
          label={`${inputs.years}-yr cost`}
          value={usd(cost)}
          win={isCostWinner(p)}
          subNode={<span style={{ color: C.indigo }}>re-ranks live</span>}
        />
      </div>

      {/* Pros / Cons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, margin: '16px 0 2px' }}>
        <div>{p.pros.map((x) => <LineItem key={x} kind="pro" text={x} />)}</div>
        <div>{p.cons.map((x) => <LineItem key={x} kind="con" text={x} />)}</div>
      </div>

      {/* Dashed divider + rating row */}
      <div style={{ borderTop: `1px dashed ${C.borderStrong}`, margin: '16px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: C.ink, letterSpacing: '-.5px' }}>{p.rating.toFixed(1)}</span>
          <div style={{ display: 'flex', gap: 4 }} aria-label={`${p.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ width: 24, height: 24, borderRadius: 4, background: i < filledTiles ? C.tile : '#E1E7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            className="cmp-cta"
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
            {config.detailRows.map((row) => (
              <SpecRow key={row.key} label={row.label} value={row.accessor(p)} />
            ))}
          </div>

          {p.deepDive && (
            <p style={{ fontSize: 14, color: C.body, lineHeight: 1.6, marginTop: 14 }}>{p.deepDive}</p>
          )}

          {p.verdict && (
            <div style={{ background: C.sky, borderLeft: `4px solid ${C.navy}`, borderRadius: '0 8px 8px 0', padding: '10px 14px', marginTop: 12, fontSize: 14, color: C.navyDark, fontStyle: 'italic' }}>
              {p.verdict} — <span style={{ fontStyle: 'normal', fontWeight: 700 }}>SmartFinPro verdict</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spec({ label, value, win, subNode }: { label: string; value: string; win?: boolean; subNode?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, color: C.slate, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, color: win ? C.greenDark : C.ink, lineHeight: 1.05, letterSpacing: '-.3px' }}>{value}</div>
      {subNode && <div style={{ fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{subNode}</div>}
    </div>
  );
}

function LineItem({ kind, text }: { kind: 'pro' | 'con'; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, marginBottom: 9, color: C.body }}>
      {kind === 'pro' ? (
        <Check size={16} style={{ color: C.greenDark, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      ) : (
        <X size={16} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderTop: `1px solid ${C.lineSoft}`, fontSize: 14 }}>
      <span style={{ color: C.slate }}>{label}</span>
      <span style={{ fontWeight: 600, color: C.ink }}>{value}</span>
    </div>
  );
}
