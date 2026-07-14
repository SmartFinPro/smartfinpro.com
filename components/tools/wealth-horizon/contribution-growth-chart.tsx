// components/tools/wealth-horizon/contribution-growth-chart.tsx
// Wealth Horizon v3's signature visual (Fable-Direktive Clean-Redesign,
// replacing v2's Lifetime Path corridor chart entirely — DESIGN-DIREKTIVE
// item 4). RSC (no 'use client'): the worked example renders this exact SVG
// server-side, and the live island re-renders the SAME component from the
// live adapter output, so the two never drift (harte Regel — no second calc
// path; the contributions/growth split itself comes from
// lib/tools/results/wealth-horizon-contribution-series.ts, the balance
// numbers it splits are always straight from the engine).
//
// One bar per projection year (currentAge..retireAge) — accumulation phase
// ONLY, no decumulation/withdrawal zone, no corridor band, no FI/depletion
// markers, no milestones (all removed per the v3 directive; that
// information now lives in the short text line above the chart + the gold
// "Financially free at X" pill). Bottom segment = "Your contributions"
// (navy), top segment = "Growth" (sky, 1px top border for separation).
//
// Bar-grow animation is pure CSS (`.wh-bar` class below, defined inline so
// this file stays a plain RSC component — no client-only matchMedia call
// needed): react re-renders update the SAME <rect> nodes' y/height on any
// recompute, and the browser's CSS transition engine interpolates that
// automatically. First paint has no "previous style" to transition from, so
// JS-off / first load always shows the final, correct bars immediately —
// only SUBSEQUENT recomputes animate. `prefers-reduced-motion: reduce`
// disables the transition entirely via the media query below.

import { buildStackedBarsLayout, type StackedBarInput } from '@/lib/calc/chart-geometry';
import { formatCompactCurrency } from '@/lib/tools/field-format';
import type { ToolCurrency } from '@/lib/tools/shell-types';
import { ContributionGrowthChartOverlay, type ContributionGrowthHoverBar } from './contribution-growth-chart-overlay';

export interface ContributionGrowthChartProps {
  bars: StackedBarInput[];
  currency: ToolCurrency;
  locale: string;
  textAlternative: string;
}

const FRAME = { width: 720, height: 340, padX: 48, padY: 24 };

export function ContributionGrowthChart({ bars, currency, locale, textAlternative }: ContributionGrowthChartProps) {
  const layout = buildStackedBarsLayout(bars, (v) => formatCompactCurrency(v, currency, locale), FRAME);

  const hoverBars: ContributionGrowthHoverBar[] = layout.bars.map((b, i) => {
    const input = bars[i];
    return {
      age: b.age,
      xStartFrac: FRAME.width === 0 ? 0 : b.x / FRAME.width,
      xEndFrac: FRAME.width === 0 ? 0 : (b.x + b.width) / FRAME.width,
      label: `Age ${b.age} · Contributions ${formatCompactCurrency(input.contributions, currency, locale)} · Growth ${formatCompactCurrency(input.growth, currency, locale)} · Total ${formatCompactCurrency(input.contributions + input.growth, currency, locale)}`,
    };
  });

  return (
    <div className="contribution-growth-chart relative w-full">
      {/* Legend — 2 small chips, right-aligned above the chart. */}
      <div className="mb-2 flex flex-wrap justify-end gap-3">
        <LegendChip color="var(--sfp-navy)" label="Your contributions" />
        <LegendChip color="var(--sfp-sky)" borderColor="var(--tool-border)" label="Growth" />
      </div>

      <style>{`
        .wh-bar { transition: height 300ms var(--tool-motion, cubic-bezier(0.2,0,0,1)), y 300ms var(--tool-motion, cubic-bezier(0.2,0,0,1)); }
        @media (prefers-reduced-motion: reduce) { .wh-bar { transition: none; } }
      `}</style>

      <svg role="img" viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} width="100%" style={{ maxWidth: '100%', display: 'block' }}>
        <title>Contribution vs. growth projection</title>
        <desc>{textAlternative}</desc>

        {layout.yTicks.map((t, i) => (
          <text key={i} x={FRAME.padX - 8} y={t.y} fontSize={11} textAnchor="end" fill="var(--sfp-slate)">
            {t.label}
          </text>
        ))}

        {layout.bars.map((b, i) => (
          <g key={b.age} style={{ transitionDelay: `${i * 8}ms` }}>
            <rect
              className="wh-bar"
              style={{ transitionDelay: `${i * 8}ms` }}
              x={b.x}
              y={b.contribY}
              width={b.width}
              height={b.contribHeight}
              fill="var(--sfp-navy)"
            />
            <rect
              className="wh-bar"
              style={{ transitionDelay: `${i * 8}ms` }}
              x={b.x}
              y={b.growthY}
              width={b.width}
              height={b.growthHeight}
              fill="var(--sfp-sky)"
              stroke="var(--tool-border)"
              strokeWidth={b.growthHeight > 0 ? 1 : 0}
            />
          </g>
        ))}

        {layout.xTicks.map((t, i) => (
          <text key={i} x={t.x} y={FRAME.height - FRAME.padY + 16} fontSize={11} textAnchor="middle" fill="var(--sfp-slate)">
            {t.label}
          </text>
        ))}
      </svg>

      <ContributionGrowthChartOverlay bars={hoverBars} />
    </div>
  );
}

function LegendChip({ color, borderColor, label }: { color: string; borderColor?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--sfp-slate)]">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: color, border: borderColor ? `1px solid ${borderColor}` : undefined }}
      />
      {label}
    </span>
  );
}
