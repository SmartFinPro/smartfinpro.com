// components/tools/shell/scenario-chart.tsx
// Pure SVG rendering of the signature visuals (SPEC 6.4/7.3) from
// lib/calc/chart-geometry — RSC-capable, no client directive: the worked
// example renders this exact markup on the server, and the client island
// re-renders the SAME component from live data, so the two never drift.
// Scenarios are distinguished by stroke-dasharray IN ADDITION to color
// (never color alone) per the design a11y rule (6.4/6.6).

import {
  buildCorridorPath,
  buildBarLayout,
  buildStackLayout,
  buildRangeLayout,
  DEFAULT_FRAME,
  type ChartFrame,
} from '@/lib/calc/chart-geometry';
import type { ScenarioVisualData } from '@/lib/tools/shell-types';

export interface ScenarioChartProps {
  data: ScenarioVisualData;
  mini?: boolean;
  titleId?: string;
}

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

function formatDefault(v: number): string {
  // Compact notation ("362K", "1.4M") — full figures like "1,447,643" are
  // wider than the chart's left padding and get clipped by the SVG edge
  // (found in the 4.2 design review: the axis read as garbage "47,643").
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

export function ScenarioChart({ data, mini = false }: ScenarioChartProps) {
  const frame: ChartFrame = mini
    ? { width: 120, height: 64, padX: 6, padY: 6 }
    : DEFAULT_FRAME;
  const height = mini ? 64 : 280;
  const width = mini ? 120 : 640;

  return (
    <svg
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={mini ? 64 : undefined}
      style={{ maxWidth: '100%' }}
    >
      <title>{data.kind === 'corridor' ? data.xLabel : 'Result chart'}</title>
      <desc>{data.textAlternative}</desc>
      {renderBody(data, frame, mini)}
    </svg>
  );
}

function renderBody(data: ScenarioVisualData, frame: ChartFrame, mini: boolean) {
  switch (data.kind) {
    case 'corridor': {
      const layout = buildCorridorPath(data.series, data.markers, frame, formatDefault);
      return (
        <>
          {layout.bandD ? <path d={layout.bandD} fill="var(--sfp-sky)" stroke="none" opacity={0.7} /> : null}
          {!mini &&
            layout.yTicks.map((t, i) => (
              <text key={i} x={frame.padX - 8} y={t.y} fontSize={11} textAnchor="end" fill="var(--sfp-slate)">
                {t.label}
              </text>
            ))}
          {layout.paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill="none"
              stroke={SERIES_COLOR[p.key] ?? 'var(--sfp-navy)'}
              strokeWidth={p.key === 'base' ? 2.5 : 1.75}
              strokeDasharray={SERIES_DASH[p.key]}
            />
          ))}
          {layout.markers.map((m, i) => (
            <g key={i}>
              <line x1={m.x} x2={m.x} y1={frame.padY} y2={frame.height - frame.padY} stroke="var(--sfp-gold)" strokeWidth={1.5} />
              {!mini ? (
                <text x={m.x} y={frame.padY - 6} fontSize={11} textAnchor="middle" fill="var(--sfp-ink)" fontWeight={600}>
                  {m.label}
                </text>
              ) : null}
            </g>
          ))}
        </>
      );
    }
    case 'bars': {
      const layout = buildBarLayout(data.bars, data.total, frame);
      return (
        <>
          {layout.bars.map((b) => (
            <g key={b.key}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill={b.emphasis ? 'var(--sfp-navy)' : 'var(--sfp-navy-dark, var(--sfp-navy))'}
                opacity={b.emphasis ? 1 : 0.75}
              />
              {!mini ? (
                <text x={b.x + b.w + 6} y={b.y + b.h / 2 + 4} fontSize={12} fill="var(--sfp-ink)">
                  {b.label}
                </text>
              ) : null}
            </g>
          ))}
        </>
      );
    }
    case 'stack': {
      const layout = buildStackLayout(data.segments, data.cap?.value, frame);
      const barY = frame.height / 2 - 17;
      const palette = ['var(--sfp-navy)', 'var(--sfp-green)', 'var(--sfp-gold)', 'var(--sfp-slate)'];
      return (
        <>
          {layout.segments.map((s, i) => (
            <rect key={s.key} x={s.x} y={barY} width={s.w} height={34} fill={palette[i % palette.length]} />
          ))}
          {layout.capX !== undefined ? (
            <line x1={layout.capX} x2={layout.capX} y1={barY - 6} y2={barY + 40} stroke="var(--sfp-red)" strokeWidth={2} />
          ) : null}
        </>
      );
    }
    case 'range': {
      const layout = buildRangeLayout(data.low, data.high, data.axisLow, data.axisHigh, data.marker?.value, frame);
      const trackY = frame.height / 2 - 17;
      return (
        <>
          <rect x={layout.trackX} y={trackY} width={layout.trackW} height={34} fill="var(--sfp-sky)" />
          <rect x={layout.bandX} y={trackY} width={layout.bandW} height={34} fill="var(--sfp-green)" opacity={0.35} />
          {layout.markerX !== undefined ? (
            <rect x={layout.markerX - 1.5} y={trackY - 6} width={3} height={46} fill="var(--sfp-navy)" />
          ) : null}
        </>
      );
    }
  }
}
