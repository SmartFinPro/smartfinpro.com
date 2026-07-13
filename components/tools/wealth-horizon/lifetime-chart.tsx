// components/tools/wealth-horizon/lifetime-chart.tsx
// Lifetime Path — Wealth Horizon v2's signature visual. RSC (no 'use client'
// directive): the worked example renders this exact SVG server-side, and the
// live island re-renders the SAME component from the live adapter output, so
// the two never drift (harte Regel — no second calc path). A thin client
// overlay (lifetime-chart-overlay.tsx) is layered on top for hover/tooltip;
// this file stays fully functional with JS off.
//
// Single continuous age axis (currentAge → endAge, typically 90) spanning
// BOTH phases:
//   - Accumulation (currentAge..retireAge): conservative↔optimistic corridor
//     band + 3 lines (same stroke/dash conventions as ScenarioChart's
//     corridor — scenarios distinguished by dash pattern, never color alone).
//   - Decumulation (retireAge..depletion/endAge): a shaded retirement zone
//     with a withdrawal-rate label, the 3 lines continuing from where
//     accumulation left off (no seam, no second scale).
// Plus: a gold FI marker/flag, a red depletion marker (only for the
// currently focused scenario, only if reached), and up to 4 navy milestone
// dots on the base accumulation line.
//
// No gradients (binding token rule), no framer-motion — hover transitions
// use var(--tool-motion) CSS only, applied by the overlay component.

import {
  buildLifetimeLayout,
  type LifetimeSeriesInput,
} from '@/lib/calc/chart-geometry';
import { formatCompactCurrency, formatCurrency } from '@/lib/tools/field-format';
import type { ToolCurrency } from '@/lib/tools/shell-types';
import { LifetimeChartOverlay } from './lifetime-chart-overlay';

export interface LifetimeChartProps {
  series: LifetimeSeriesInput[];
  currentAge: number;
  retireAge: number;
  endAge: number;
  fiAge: number | null;
  depletionAge: number | null;
  milestones: { age: number; balance: number; label: string }[];
  withdrawalMonthly: number;
  currency: ToolCurrency;
  locale: string;
  textAlternative: string;
}

const FRAME = { width: 720, height: 400, padX: 52, padY: 28 };

const SERIES_DASH: Record<string, string | undefined> = {
  conservative: '4 3',
  base: undefined, // solid
  optimistic: '1 3',
};

const SERIES_COLOR: Record<string, string> = {
  conservative: 'var(--sfp-slate)',
  base: 'var(--sfp-navy)',
  optimistic: 'var(--sfp-green)',
};

export function LifetimeChart({
  series,
  currentAge,
  retireAge,
  endAge,
  fiAge,
  depletionAge,
  milestones,
  withdrawalMonthly,
  currency,
  locale,
  textAlternative,
}: LifetimeChartProps) {
  const layout = buildLifetimeLayout({
    series,
    currentAge,
    retireAge,
    endAge,
    fiAge,
    depletionAge,
    milestones,
    frame: FRAME,
    formatY: (v) => formatCompactCurrency(v, currency, locale),
  });

  const withdrawalLabel = `Retirement — withdrawing ≈${formatCurrency(withdrawalMonthly, currency, locale)}/mo`;

  // Serialized points for the client overlay's pointermove→nearestAge lookup
  // — plain data, no DOM/React refs crossing the RSC/client boundary.
  const hoverPoints = buildHoverPoints(series, layout, currency, locale);

  return (
    <div className="lifetime-chart relative w-full">
      <svg
        role="img"
        viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
        width="100%"
        style={{ maxWidth: '100%', display: 'block' }}
      >
        <title>Lifetime balance projection — accumulation and retirement withdrawal phases</title>
        <desc>{textAlternative}</desc>

        {/* Retirement (decumulation) zone background */}
        <rect
          x={layout.retirementZone.x}
          y={layout.retirementZone.y}
          width={layout.retirementZone.width}
          height={layout.retirementZone.height}
          fill="var(--sfp-sky)"
          opacity={0.35}
        />
        {layout.retirementZone.width > 0 ? (
          <text
            x={layout.retirementZone.x + 8}
            y={FRAME.padY - 8}
            fontSize={11}
            fontWeight={600}
            fill="var(--sfp-slate)"
          >
            {withdrawalLabel}
          </text>
        ) : null}

        {/* Divider at retireAge */}
        <line
          x1={layout.dividerX}
          x2={layout.dividerX}
          y1={FRAME.padY}
          y2={FRAME.height - FRAME.padY}
          stroke="var(--tool-border-strong)"
          strokeWidth={1}
        />

        {/* Accumulation corridor band (conservative↔optimistic) */}
        {layout.bandD ? <path d={layout.bandD} fill="var(--sfp-sky)" stroke="none" opacity={0.7} /> : null}

        {/* Y ticks */}
        {layout.yTicks.map((t, i) => (
          <text key={i} x={FRAME.padX - 8} y={t.y} fontSize={11} textAnchor="end" fill="var(--sfp-slate)">
            {t.label}
          </text>
        ))}

        {/* Accumulation lines */}
        {layout.accumulationPaths.map((p) => (
          <path
            key={`acc-${p.key}`}
            d={p.d}
            fill="none"
            stroke={SERIES_COLOR[p.key] ?? 'var(--sfp-navy)'}
            strokeWidth={p.key === 'base' ? 2.5 : 1.75}
            strokeDasharray={SERIES_DASH[p.key]}
          />
        ))}

        {/* Decumulation lines — same stroke conventions, continue from accumulation */}
        {layout.decumulationPaths.map((p) => (
          <path
            key={`dec-${p.key}`}
            d={p.d}
            fill="none"
            stroke={SERIES_COLOR[p.key] ?? 'var(--sfp-navy)'}
            strokeWidth={p.key === 'base' ? 2.5 : 1.75}
            strokeDasharray={SERIES_DASH[p.key]}
          />
        ))}

        {/* Milestone markers (base accumulation line, max 4) */}
        {layout.milestoneMarkers.map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r={4} fill="var(--sfp-navy)" stroke="#fff" strokeWidth={1.5} />
            <text
              x={m.x}
              y={m.labelAbove ? m.y - 10 : m.y + 18}
              fontSize={10}
              textAnchor="middle"
              fill="var(--sfp-ink)"
              fontWeight={600}
            >
              {m.label}
            </text>
          </g>
        ))}

        {/* FI marker — gold diamond + dashed line + flag label */}
        {layout.fiMarker ? (
          <g>
            <line
              x1={layout.fiMarker.x}
              x2={layout.fiMarker.x}
              y1={FRAME.padY}
              y2={FRAME.height - FRAME.padY}
              stroke="var(--sfp-gold)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
            <rect
              x={layout.fiMarker.x - 4}
              y={layout.fiMarker.y - 4}
              width={8}
              height={8}
              fill="var(--sfp-gold)"
              transform={`rotate(45 ${layout.fiMarker.x} ${layout.fiMarker.y})`}
            />
            <text
              x={layout.fiMarker.x}
              y={FRAME.padY - 8}
              fontSize={11}
              fontWeight={700}
              textAnchor="middle"
              fill="var(--sfp-ink)"
            >
              FI at {layout.fiMarker.age}
            </text>
          </g>
        ) : null}

        {/* Depletion marker — red dot at the zero baseline + label */}
        {layout.depletionMarker ? (
          <g>
            <circle cx={layout.depletionMarker.x} cy={layout.depletionMarker.y} r={4} fill="var(--sfp-red)" />
            <text
              x={layout.depletionMarker.x}
              y={layout.depletionMarker.y - 10}
              fontSize={10}
              fontWeight={600}
              textAnchor="middle"
              fill="var(--sfp-red)"
            >
              funds run out ~{layout.depletionMarker.age} in this scenario
            </text>
          </g>
        ) : null}

        {/* X ticks */}
        {layout.xTicks.map((t, i) => (
          <text key={i} x={t.x} y={FRAME.height - FRAME.padY + 16} fontSize={11} textAnchor="middle" fill="var(--sfp-slate)">
            {t.label}
          </text>
        ))}
      </svg>

      <LifetimeChartOverlay points={hoverPoints} />
    </div>
  );
}

export interface HoverPoint {
  age: number;
  xFrac: number; // 0..1, position within the viewBox width
  yFrac: number; // 0..1, position within the viewBox height (base series)
  label: string; // pre-formatted tooltip text
}

function buildHoverPoints(
  series: LifetimeSeriesInput[],
  layout: ReturnType<typeof buildLifetimeLayout>,
  currency: ToolCurrency,
  locale: string,
): HoverPoint[] {
  const base = series.find((s) => s.key === 'base');
  if (!base) return [];
  // decumulation[0] duplicates accumulation's last row (retireAge) by
  // construction (engine contract) — skip it here to avoid a duplicate point.
  const rows = [...base.accumulation, ...base.decumulation.slice(1)];
  return rows.map((row) => ({
    age: row.age,
    xFrac: FRAME.width === 0 ? 0 : layout.scale.sx(row.age) / FRAME.width,
    yFrac: FRAME.height === 0 ? 0 : layout.scale.sy(row.balance) / FRAME.height,
    label: `Age ${row.age}: ${formatCompactCurrency(row.balance, currency, locale)}`,
  }));
}
