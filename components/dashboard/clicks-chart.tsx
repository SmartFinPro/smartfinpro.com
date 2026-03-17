'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimeSeriesData } from '@/lib/actions/dashboard';
import { DASHBOARD_CHART, CHART_NEUTRAL } from '@/lib/constants/brand-colors';

interface ClicksChartProps {
  data: TimeSeriesData[];
}

// AP-03 Phase 3 — Farben aus brand-colors.ts (Single Source of Truth)
// DASHBOARD_CHART.primary = #10b981 (emerald-500) — originale Optik beibehalten
const CHART_COLORS = {
  stroke: DASHBOARD_CHART.primary,      // emerald-500 — Klick-Linie
  fill:   DASHBOARD_CHART.primary,
  grid:   CHART_NEUTRAL.grid,
  text:   CHART_NEUTRAL.axisText,
  tooltip: {
    bg:     CHART_NEUTRAL.tooltipBg,
    border: CHART_NEUTRAL.tooltipBorder,
    text:   CHART_NEUTRAL.tooltipText,
  },
};

export function ClicksChart({ data }: ClicksChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">
        No click data yet.
      </div>
    );
  }

  const hasClicks = data.some((d) => d.clicks > 0);

  if (!hasClicks) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">
        No clicks in this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.fill} stopOpacity={0.15} />
            <stop offset="100%" stopColor={CHART_COLORS.fill} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.grid}
          strokeOpacity={0.3}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: CHART_COLORS.text }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: CHART_COLORS.text }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_COLORS.tooltip.bg,
            border: `1px solid ${CHART_COLORS.tooltip.border}`,
            borderRadius: '6px',
            fontSize: '12px',
            color: CHART_COLORS.tooltip.text,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
          formatter={(value) => {
            const val = typeof value === 'number' ? value : 0;
            return [`${val}`, 'Clicks'];
          }}
          labelStyle={{ color: CHART_NEUTRAL.axisText }}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke={CHART_COLORS.stroke}
          strokeWidth={1.5}
          fill="url(#clicksGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
