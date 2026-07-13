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
          className="lever flex min-h-16 flex-col gap-0.5 rounded-tool-control border p-3 text-left"
          style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface)' }}
        >
          <span className="text-sm font-semibold text-[var(--sfp-ink)]">{lever.title}</span>
          <span className="tabular-nums text-sm font-bold text-[var(--sfp-green)]">{lever.deltaLabel}</span>
        </button>
      ))}
    </div>
  );
}
