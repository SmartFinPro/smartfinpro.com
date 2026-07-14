'use client';
// components/tools/shell/impact-levers.tsx
// Exactly 3 prioritized levers (SPEC 8.1 Lever, result order slot 4).
// Applying a lever is the CALLER's responsibility to track — this component
// only renders and forwards the click (tool_input_change{controlRole:'lever'}
// is fired by the page wiring onApply to its ToolTracker, same as
// ResultPanel's onLeverApply contract).

import type { Lever } from '@/lib/tools/shell-types';

export interface ImpactLeversProps {
  levers: [Lever, Lever, Lever];
  onApply?: (lever: Lever) => void;
}

export function ImpactLevers({ levers, onApply }: ImpactLeversProps) {
  return (
    <div className="levers grid grid-cols-1 gap-3 sm:grid-cols-3">
      {levers.map((lever) => (
        <button
          key={lever.key}
          type="button"
          onClick={() => onApply?.(lever)}
          // Light-blue hover per User-Direktive 14.07. — background/border
          // only (no translate/scale, token rule). The delta amount is the
          // hero of the card: big, green, tabular; the title is the caption.
          className="lever group flex min-h-20 flex-col gap-1 rounded-tool-control border border-[var(--tool-border)] bg-[var(--tool-surface)] p-4 text-left transition-colors duration-200 hover:border-[var(--sfp-navy)] hover:bg-[var(--sfp-sky)] focus-visible:border-[var(--sfp-navy)] focus-visible:bg-[var(--sfp-sky)] focus-visible:outline-none"
        >
          <span className="text-[13px] font-medium text-[var(--sfp-slate)] transition-colors duration-200 group-hover:text-[var(--sfp-ink)]">{lever.title}</span>
          <span className="tabular-nums text-2xl font-bold leading-tight text-[var(--sfp-green)]">{lever.deltaLabel}</span>
        </button>
      ))}
    </div>
  );
}
