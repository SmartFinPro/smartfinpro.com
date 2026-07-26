// components/tools/shell/precision-worksheet.tsx
// RSC — Debt Payoff / AU/CA/UK Home Lab / Trading Cost (SPEC 6.2). Section
// form on the left (each section its own H3 + divider), an assumptions bar
// plus detail result on the right. Stays a plain server component — the
// interactive fields inside `sections[].content` are client islands supplied
// by the caller; this component itself only lays out the grid.

import type { ReactNode } from 'react';

export interface PrecisionWorksheetSection {
  key: string;
  title: string;
  content: ReactNode;
}

export interface PrecisionWorksheetLayoutProps {
  sections: PrecisionWorksheetSection[];
  assumptions: ReactNode;
  result: ReactNode;
}

export function PrecisionWorksheetLayout({ sections, assumptions, result }: PrecisionWorksheetLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
      <div
        className="panel flex flex-col rounded-tool-panel border md:col-span-5"
        style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface)', boxShadow: 'var(--tool-shadow)' }}
      >
        {sections.map((s, i) => (
          <div
            key={s.key}
            className="section p-5"
            style={i > 0 ? { borderTop: '1px solid var(--tool-border)' } : undefined}
          >
            <h3 className="t-h3 m-0 mb-3 text-[17px] font-semibold leading-6 text-[var(--sfp-ink)]">{s.title}</h3>
            {s.content}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 md:col-span-7">
        <div
          className="rounded-tool-control border p-3.5"
          style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface-muted)' }}
        >
          {assumptions}
        </div>
        {result}
      </div>
    </div>
  );
}
