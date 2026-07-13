// components/tools/shell/assumptions-drawer.tsx
// RSC — native <details>/<summary>, usable without JS (SPEC 7.3). Lists the
// calculation's assumptions and every rule source with its Effective and
// Verified date (SPEC design rule 5/8.6).

import type { AssumptionEntry, RuleSourceRef } from '@/lib/tools/shell-types';

export interface AssumptionsDrawerProps {
  assumptions: AssumptionEntry[];
  sources: RuleSourceRef[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function AssumptionsDrawer({ assumptions, sources }: AssumptionsDrawerProps) {
  return (
    <details
      className="assumptions rounded-tool-control border p-3.5 text-sm"
      style={{ borderColor: 'var(--tool-border)' }}
    >
      <summary className="cursor-pointer text-sm font-semibold text-[var(--sfp-ink)]">
        Assumptions &amp; sources
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        {assumptions.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {assumptions.map((a, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
                <span className="font-medium text-[var(--sfp-ink)]">{a.label}:</span>
                <span className="tabular-nums text-[var(--sfp-ink)]">{a.value}</span>
                {a.note ? <span className="text-xs text-[var(--sfp-slate)]">({a.note})</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {sources.length > 0 ? (
          <ul className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: 'var(--tool-border)' }}>
            {sources.map((s, i) => (
              <li key={i} className="src text-xs text-[var(--sfp-slate)]">
                <a href={s.url} className="text-[var(--sfp-navy)] no-underline hover:underline">
                  {s.label}
                </a>
                {' — '}effective {formatDate(s.effectiveFrom)} · verified {formatDate(s.verifiedAt)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}
