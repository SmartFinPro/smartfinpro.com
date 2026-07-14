'use client';
// components/tools/wealth-horizon/contribution-growth-chart-overlay.tsx
// Thin client overlay for the Contribution/Growth bar chart
// (contribution-growth-chart.tsx, an RSC component) — same split pattern as
// the v2 lifetime-chart-overlay.tsx it replaces: renders ONLY a highlight +
// tooltip as an absolutely positioned layer on top of the static SVG.
// Pointermove maps the cursor's fractional X position to the bar whose
// [xStartFrac, xEndFrac) range contains it (no re-running any engine/adapter
// math client-side — `bars` already carries the pre-formatted tooltip label
// from the same layout the SVG used). JS-off: this component simply never
// mounts — the static SVG underneath is fully complete/labeled on its own
// (title/desc + visible axis/legend), so its absence changes nothing about
// JS-off correctness.

import { useRef, useState } from 'react';

export interface ContributionGrowthHoverBar {
  age: number;
  xStartFrac: number; // 0..1, position within the viewBox width
  xEndFrac: number; // 0..1, position within the viewBox width
  label: string; // pre-formatted "Age · Contributions · Growth · Total" tooltip text
}

export interface ContributionGrowthChartOverlayProps {
  bars: ContributionGrowthHoverBar[];
}

export function ContributionGrowthChartOverlay({ bars }: ContributionGrowthChartOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ContributionGrowthHoverBar | null>(null);

  if (bars.length === 0) return null;

  function barAt(clientX: number): ContributionGrowthHoverBar | null {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return null;
    const xFrac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const hit = bars.find((b) => xFrac >= b.xStartFrac && xFrac < b.xEndFrac);
    if (hit) return hit;
    // Fall back to the nearest bar (covers the small gaps between bars and
    // the frame's outer padding on either side).
    let best: ContributionGrowthHoverBar | null = null;
    let bestDist = Infinity;
    for (const b of bars) {
      const mid = (b.xStartFrac + b.xEndFrac) / 2;
      const dist = Math.abs(mid - xFrac);
      if (dist < bestDist) {
        bestDist = dist;
        best = b;
      }
    }
    return best;
  }

  return (
    <div
      ref={containerRef}
      className="contribution-growth-chart-overlay absolute inset-0"
      style={{ cursor: 'crosshair' }}
      onPointerMove={(e) => setActive(barAt(e.clientX))}
      onPointerLeave={() => setActive(null)}
    >
      {active ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0"
            style={{
              left: `${active.xStartFrac * 100}%`,
              width: `${Math.max(0, active.xEndFrac - active.xStartFrac) * 100}%`,
              background: 'var(--sfp-gold)',
              opacity: 0.12,
              transition: `left var(--tool-motion), width var(--tool-motion)`,
            }}
          />
          <div
            role="status"
            className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-tool-control border px-2 py-1 text-xs font-semibold tabular-nums"
            style={{
              left: `${Math.min(92, Math.max(8, ((active.xStartFrac + active.xEndFrac) / 2) * 100))}%`,
              top: '4%',
              background: 'var(--tool-surface)',
              borderColor: 'var(--tool-border-strong)',
              color: 'var(--sfp-ink)',
              transition: `left var(--tool-motion)`,
            }}
          >
            {active.label}
          </div>
        </>
      ) : null}
    </div>
  );
}
