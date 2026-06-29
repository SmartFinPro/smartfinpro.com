// components/marketing/cockpit-table.tsx
// Presentational dense comparison matrix — semantic <table> (SSR/AEO friendly)
// with click-to-sort headers, per-column winner highlight, live cost bar and a
// compare checkbox per row. Config-driven columns.

import { ArrowDown, ArrowUp, Check, Minus, Star, ArrowRight, Award } from 'lucide-react';
import type { ProductForComparison } from '@/lib/comparison/types';
import type { TopicConfig } from '@/lib/comparison/topics/types';
import { costOverTime, type CostInputs } from '@/lib/comparison/cost';

const C = {
  ink: '#1A1F36',
  slate: '#6B7280',
  border: '#E1E7F0',
  navy: '#1B4F8C',
  gold: '#F5A623',
  greenDark: '#3F9655',
  greenBg: '#E9F4ED',
  ctaGreen: '#54B269',
  sky: '#E8F0FB',
} as const;

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

export interface CockpitTableProps {
  products: ProductForComparison[];
  config: TopicConfig;
  inputs: CostInputs;
  sort: string;
  dir: 'asc' | 'desc';
  onSort: (key: string) => void;
  selection: Set<string>;
  onToggleSelect: (slug: string) => void;
  isColWinner: (colKey: string, p: ProductForComparison) => boolean;
  isCostWinner: (p: ProductForComparison) => boolean;
  onOfferClick: (product: ProductForComparison) => void;
}

function SortHead({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey?: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onSort: (key: string) => void;
}) {
  const ariaSort = active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none';
  if (!sortKey) {
    return (
      <th scope="col" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11.5, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '.3px' }}>
        {label}
      </th>
    );
  }
  return (
    <th scope="col" aria-sort={ariaSort} style={{ textAlign: 'left', padding: 0 }}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '10px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, color: active ? C.navy : C.slate, textTransform: 'uppercase', letterSpacing: '.3px', fontFamily: 'inherit' }}
      >
        {label}
        {active && (dir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
      </button>
    </th>
  );
}

export function CockpitTable({
  products,
  config,
  inputs,
  sort,
  dir,
  onSort,
  selection,
  onToggleSelect,
  isColWinner,
  isCostWinner,
  onOfferClick,
}: CockpitTableProps) {
  const costs = products.map((p) => costOverTime(p, config.costModel, inputs));
  const maxCost = Math.max(1, ...costs);

  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums', minWidth: 720 }}>
        <thead>
          <tr style={{ background: '#FAFBFD', borderBottom: `1px solid ${C.border}` }}>
            <th scope="col" style={{ width: 36 }}>
              <span className="sr-only">Compare</span>
            </th>
            <th scope="col" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11.5, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '.3px' }}>
              Provider
            </th>
            <SortHead label="Rating" sortKey="rating" active={sort === 'rating'} dir={dir} onSort={onSort} />
            {config.specColumns.map((col) => (
              <SortHead key={col.key} label={col.label} sortKey={col.sortKey} active={sort === col.sortKey} dir={dir} onSort={onSort} />
            ))}
            <SortHead label={`${inputs.years}-yr cost`} sortKey="cost" active={sort === 'cost'} dir={dir} onSort={onSort} />
            <th scope="col" style={{ width: 124 }} />
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const cost = costs[i];
            const selected = selection.has(p.slug);
            const costWin = isCostWinner(p);
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
              <tr key={p.slug} style={{ borderTop: `1px solid ${C.border}`, background: p.isTopPick ? '#FBFCFE' : '#fff' }}>
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <button
                    type="button"
                    onClick={() => onToggleSelect(p.slug)}
                    aria-pressed={selected}
                    aria-label={`Compare ${p.displayName}`}
                    style={{ width: 19, height: 19, borderRadius: 5, border: selected ? `1.5px solid ${C.ctaGreen}` : '1.5px solid #c4ccd6', background: selected ? C.ctaGreen : '#fff', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    {selected && <Check size={12} aria-hidden="true" />}
                  </button>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 7, background: C.navy, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                      {p.initial}
                    </span>
                    <span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 13, color: C.ink }}>
                        {p.displayName}
                        {p.isTopPick && <Award size={13} style={{ color: C.gold }} aria-label="Top pick" />}
                      </span>
                      {p.bestFor && <span style={{ display: 'block', fontSize: 10.5, color: C.navy }}>{p.bestFor}</span>}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600, color: isColWinner('rating', p) ? C.greenDark : C.ink }}>
                  <Star size={11} aria-hidden="true" style={{ verticalAlign: -1 }} /> {p.rating.toFixed(1)}
                </td>
                {config.specColumns.map((col) => {
                  const raw = col.accessor(p);
                  const win = isColWinner(col.key, p);
                  const isBool = col.format(raw) === 'Yes' || col.format(raw) === 'No';
                  return (
                    <td key={col.key} style={{ padding: '10px 8px', fontSize: 12.5, color: win ? C.greenDark : C.ink, fontWeight: win ? 700 : 400 }}>
                      {isBool ? (
                        col.format(raw) === 'Yes' ? (
                          <Check size={15} style={{ color: C.greenDark }} aria-label="Yes" />
                        ) : (
                          <Minus size={15} style={{ color: '#B6BECA' }} aria-label="No" />
                        )
                      ) : (
                        col.format(raw)
                      )}
                    </td>
                  );
                })}
                <td style={{ padding: '10px 8px', minWidth: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ flex: 1, height: 6, background: '#E1E7F0', borderRadius: 4, overflow: 'hidden', minWidth: 40 }}>
                      <span style={{ display: 'block', height: '100%', width: `${Math.max(6, Math.round((cost / maxCost) * 100))}%`, background: costWin ? C.ctaGreen : C.navy, borderRadius: 4 }} />
                    </span>
                    <span style={{ fontSize: 11.5, color: costWin ? C.greenDark : C.ink, fontWeight: costWin ? 700 : 400, minWidth: 42, textAlign: 'right' }}>{usd(cost)}</span>
                  </div>
                </td>
                <td style={{ padding: '8px' }}>
                  <a
                    href={cta.href}
                    className="cmp-cta"
                    {...(cta.external ? { target: '_blank', rel: 'nofollow sponsored noopener' } : {})}
                    onClick={cta.tracked ? () => onOfferClick(p) : undefined}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', background: C.ctaGreen, color: '#fff', border: 'none' }}
                  >
                    {cta.label} <ArrowRight size={12} aria-hidden="true" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
