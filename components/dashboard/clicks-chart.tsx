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

interface ClicksChartProps {
  data: TimeSeriesData[];
}

// Light theme chart colors
const CHART_COLORS = {
  stroke: '#10b981', // Emerald-500
  fill: '#10b981',
  grid: '#e2e8f0', // Slate-200 - light gray grid
  text: '#64748b', // Slate-500
  tooltip: {
    bg: '#ffffff', // White
    border: '#e2e8f0', // Slate-200
    text: '#1e293b', // Slate-800
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
          labelStyle={{ color: '#64748b' }}
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
