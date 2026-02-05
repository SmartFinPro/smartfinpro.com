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

// Canua-inspired colors
const CHART_COLORS = {
  stroke: '#10b981', // Emerald
  fill: '#10b981',
  grid: '#e2e8f0',
  text: '#64748b',
};

export function ClicksChart({ data }: ClicksChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        No click data yet.
      </div>
    );
  }

  const hasClicks = data.some((d) => d.clicks > 0);

  if (!hasClicks) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        No clicks in this time period. Try visiting /go/jasper-ai to test.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.fill} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: CHART_COLORS.text }}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_COLORS.text }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          formatter={(value) => {
            const val = typeof value === 'number' ? value : 0;
            return [`${val} clicks`, 'Clicks'];
          }}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke={CHART_COLORS.stroke}
          strokeWidth={2}
          fill="url(#clicksGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
