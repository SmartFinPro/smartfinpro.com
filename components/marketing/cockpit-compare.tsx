// components/marketing/cockpit-compare.tsx
// Presentational side-by-side comparison. The orchestrator guarantees 2–4
// selected providers (auto-seeds top picks). Chip-bar swaps providers; the
// matrix highlights the winning cell per row. Config-driven rows.

import { Plus, Check, X, ArrowRight, Columns3 } from 'lucide-react';
import type { ProductForComparison } from '@/lib/comparison/types';
import type { TopicConfig } from '@/lib/comparison/topics/types';
import { costOverTime, type CostInputs } from '@/lib/comparison/cost';

const C = {
  ink: '#1A1F36',
  slate: '#6B7280',
  border: '#E1E7F0',
  navy: '#1B4F8C',
  greenDark: '#3F9655',
  greenBg: '#E9F4ED',
  ctaGreen: '#54B269',
  sky: '#E8F0FB',
  indigo: '#5046E5',
} as const;

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

interface Row {
  key: string;
  label: string;
  render: (p: ProductForComparison) => string;
  score: (p: ProductForComparison) => number;
  indigo?: boolean;
}

export interface CockpitCompareProps {
  all: ProductForComparison[];
  selectedSlugs: string[];
  config: TopicConfig;
  inputs: CostInputs;
  onToggleSelect: (slug: string) => void;
  onOfferClick: (product: ProductForComparison) => void;
}

export function CockpitCompare({ all, selectedSlugs, config, inputs, onToggleSelect, onOfferClick }: CockpitCompareProps) {
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const ps = selectedSlugs.map((s) => bySlug.get(s)).filter((p): p is ProductForComparison => !!p);

  const rows: Row[] = [
    { key: 'rating', label: 'Our rating', render: (p) => p.rating.toFixed(1), score: (p) => p.rating },
    { key: 'cost', label: `${inputs.years}-yr cost`, render: (p) => usd(costOverTime(p, config.costModel, inputs)), score: (p) => -costOverTime(p, config.costModel, inputs), indigo: true },
    ...config.compareRows.map((r) => ({ key: r.key, label: r.label, render: r.accessor, score: r.score ?? (() => 0) })),
  ];

  const gridCols = `128px repeat(${ps.length}, minmax(0, 1fr))`;

  return (
    <div>
      {/* Picker chip-bar */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 15px', marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, color: C.slate, fontWeight: 600, marginBottom: 9 }}>
          <Columns3 size={14} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 4, color: C.navy }} />
          Comparing {ps.length} of 4 — tap a provider to add or remove
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {all.map((p) => {
            const on = selectedSlugs.includes(p.slug);
            const atMax = !on && selectedSlugs.length >= 4;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => onToggleSelect(p.slug)}
                aria-pressed={on}
                disabled={atMax}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: atMax ? 'not-allowed' : 'pointer', opacity: atMax ? 0.45 : 1, background: on ? C.navy : '#fff', color: on ? '#fff' : C.navy, border: `1px solid ${on ? C.navy : C.border}`, fontFamily: 'inherit' }}
              >
                {on ? <Check size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
                {p.displayName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side matrix */}
      <div className="ck-scroll-x" style={{ background: '#fff', border: `2px solid ${C.navy}`, borderRadius: 14, overflowX: 'auto', fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 1, background: C.border, minWidth: 128 + ps.length * 150 }}>
          {/* Header row */}
          <div className="ck-cmp-corner" style={{ background: C.navy, color: '#fff', padding: '12px', display: 'flex', alignItems: 'flex-end', fontSize: 12.5, fontWeight: 600 }}>Side-by-side</div>
          {ps.map((p) => {
            const reviewHref = p.reviewSlug ? `/${p.market}/${p.category}/${p.reviewSlug}` : null;
            // Mirror the card's primary CTA: always green, never /go for unverified.
            const cta =
              p.ctaMode === 'offer'
                ? { label: 'View offer', href: `/go/${p.slug}`, external: false, tracked: true }
                : p.externalUrl
                  ? { label: 'Visit site', href: p.externalUrl, external: true, tracked: false }
                  : reviewHref
                    ? { label: 'Read review', href: reviewHref, external: false, tracked: false }
                    : { label: 'Visit site', href: '#', external: true, tracked: false };
            return (
              <div key={p.slug} style={{ background: C.navy, color: '#fff', padding: '12px', textAlign: 'center', position: 'relative' }}>
                {ps.length > 2 && (
                  <button type="button" className="ck-cmp-remove" onClick={() => onToggleSelect(p.slug)} aria-label={`Remove ${p.displayName}`} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: '#fff', opacity: 0.85, cursor: 'pointer', padding: 0 }}>
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
                <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', color: C.navy, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  {p.initial}
                </span>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.displayName}</div>
                <a
                  href={cta.href}
                  className="cmp-cta"
                  {...(cta.external ? { target: '_blank', rel: 'nofollow sponsored noopener' } : {})}
                  onClick={cta.tracked ? () => onOfferClick(p) : undefined}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', background: C.ctaGreen, color: '#fff', border: 'none' }}
                >
                  {cta.label} <ArrowRight size={12} aria-hidden="true" />
                </a>
              </div>
            );
          })}

          {/* Attribute rows */}
          {rows.map((row) => {
            const scores = ps.map((p) => row.score(p));
            const max = Math.max(...scores);
            const min = Math.min(...scores);
            const varies = max !== min;
            return (
              <ComparisonRowCells key={row.key} row={row} ps={ps} scores={scores} max={max} varies={varies} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ComparisonRowCells({
  row,
  ps,
  scores,
  max,
  varies,
}: {
  row: Row;
  ps: ProductForComparison[];
  scores: number[];
  max: number;
  varies: boolean;
}) {
  return (
    <>
      <div className="ck-cmp-label" style={{ background: '#FAFBFD', padding: '11px 12px', fontSize: 12, color: C.slate }}>{row.label}</div>
      {ps.map((p, i) => {
        const win = varies && scores[i] === max;
        return (
          <div key={p.slug} style={{ background: win ? C.greenBg : '#fff', padding: '11px 12px', textAlign: 'center', fontSize: 13, fontWeight: win ? 700 : 400, color: row.indigo ? C.indigo : C.ink }}>
            {row.render(p)}
            {win && <Check size={12} style={{ color: C.greenDark, marginLeft: 4, verticalAlign: -1 }} aria-hidden="true" />}
          </div>
        );
      })}
    </>
  );
}
