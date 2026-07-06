// components/marketing/cockpit-summary-table.tsx
// A real server-rendered <table> summarizing the top providers — the interactive
// cockpit below renders its matrix as a DIV grid (needed for client-side sorting/
// filtering), which Google can't lift into a table-format rich result. This static
// table gives the same headline comparison in table-snippet-eligible markup.

import type { ProductForComparison } from '@/lib/comparison/types';
import type { SpecColumn } from '@/lib/comparison/topics/types';

const BORDER = '#E1E7F0';
const MAX_ROWS = 5;
const MAX_COLS = 3;

interface CockpitSummaryTableProps {
  products: ProductForComparison[];
  specColumns: SpecColumn[];
  label: string;
}

export function CockpitSummaryTable({ products, specColumns, label }: CockpitSummaryTableProps) {
  const cols = specColumns.slice(0, MAX_COLS);
  const rows = products.slice(0, MAX_ROWS);
  if (rows.length === 0 || cols.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="sr-only">{label} comparison table</h2>
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: BORDER }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--sfp-sky)' }}>
              <th scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--sfp-navy)' }}>
                Provider
              </th>
              {cols.map((c) => (
                <th key={c.key} scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--sfp-navy)' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.slug} style={{ borderTop: `1px solid ${BORDER}`, background: i % 2 ? 'var(--sfp-gray)' : '#fff' }}>
                <th scope="row" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                  {p.displayName}
                </th>
                {cols.map((c) => (
                  <td key={c.key} className="px-4 py-3" style={{ color: 'var(--sfp-slate)' }}>
                    {c.format(c.accessor(p))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
