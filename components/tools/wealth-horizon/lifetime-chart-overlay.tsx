'use client';
// components/tools/wealth-horizon/lifetime-chart-overlay.tsx
// Thin client overlay for the Lifetime Path chart (lifetime-chart.tsx, an
// RSC component) — renders ONLY a crosshair + tooltip as an absolutely
// positioned layer on top of the static SVG. Pointermove maps the cursor's
// fractional X position to the nearest pre-serialized point (no re-running
// any engine/adapter math client-side — `points` already carries the
// formatted label from the same buildLifetimeLayout scale the SVG used).
// JS-off: this component simply never mounts — the static SVG underneath is
// fully complete/labeled on its own (title/desc + visible axis/markers), so
// its absence changes nothing about JS-off correctness.

import { useRef, useState } from 'react';
import type { HoverPoint } from './lifetime-chart';

export interface LifetimeChartOverlayProps {
  points: HoverPoint[];
}

export function LifetimeChartOverlay({ points }: LifetimeChartOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<HoverPoint | null>(null);

  if (points.length === 0) return null;

  function nearestPoint(clientX: number): HoverPoint | null {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return null;
    const xFrac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    let best: HoverPoint | null = null;
    let bestDist = Infinity;
    for (const p of points) {
      const dist = Math.abs(p.xFrac - xFrac);
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }
    return best;
  }

  return (
    <div
      ref={containerRef}
      className="lifetime-chart-overlay absolute inset-0"
      style={{ cursor: 'crosshair' }}
      onPointerMove={(e) => setActive(nearestPoint(e.clientX))}
      onPointerLeave={() => setActive(null)}
    >
      {active ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 w-px"
            style={{
              left: `${active.xFrac * 100}%`,
              background: 'var(--tool-border-strong)',
              transition: `left var(--tool-motion)`,
            }}
          />
          <div
            role="status"
            className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-tool-control border px-2 py-1 text-xs font-semibold tabular-nums"
            style={{
              left: `${Math.min(92, Math.max(8, active.xFrac * 100))}%`,
              top: `${Math.max(4, active.yFrac * 100 - 8)}%`,
              background: 'var(--tool-surface)',
              borderColor: 'var(--tool-border-strong)',
              color: 'var(--sfp-ink)',
              transition: `left var(--tool-motion), top var(--tool-motion)`,
            }}
          >
            {active.label}
          </div>
        </>
      ) : null}
    </div>
  );
}
