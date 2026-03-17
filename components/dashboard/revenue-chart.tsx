'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DASHBOARD_CHART, CHART_NEUTRAL } from '@/lib/constants/brand-colors';

interface RevenueChartProps {
  data: { month: string; revenue: number; count: number }[];
}

// AP-03 Phase 3 — Farben aus brand-colors.ts (Single Source of Truth)
// DASHBOARD_CHART.primary = #10b981 (emerald-500) — originale Optik beibehalten
const CHART_COLORS = {
  bar: DASHBOARD_CHART.primary,        // emerald-500 — Revenue-Balken
  grid: CHART_NEUTRAL.grid,
  tooltip: {
    bg:     CHART_NEUTRAL.tooltipBg,
    border: CHART_NEUTRAL.tooltipBorder,
    text:   CHART_NEUTRAL.tooltipText,
  },
};

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
        No revenue data yet. Conversions will populate this chart.
      </div>
    );
  }

  // Format data for chart (reverse to show oldest first)
  const chartData = [...data].reverse().map((d) => ({
    month: formatMonth(d.month),
    revenue: d.revenue,
    conversions: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.grid}
          strokeOpacity={0.3}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: CHART_NEUTRAL.axisText }}
          tickLine={false}
          axisLine={{ stroke: CHART_NEUTRAL.axisLine }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_NEUTRAL.axisText }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_COLORS.tooltip.bg,
            border: `1px solid ${CHART_COLORS.tooltip.border}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: CHART_COLORS.tooltip.text,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
          formatter={(value, name) => {
            if (name === 'revenue') {
              const val = typeof value === 'number' ? value : 0;
              return [`$${val.toFixed(2)}`, 'Revenue'];
            }
            return [value, 'Conversions'];
          }}
          labelStyle={{ color: CHART_NEUTRAL.axisText }}
        />
        <Bar
          dataKey="revenue"
          fill={CHART_COLORS.bar}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}
