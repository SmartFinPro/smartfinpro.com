'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimeSeriesPageView } from '@/lib/actions/analytics';
import { DASHBOARD_CHART, CHART_NEUTRAL } from '@/lib/constants/brand-colors';

// AP-03 Phase 3 — Farben aus brand-colors.ts (Single Source of Truth)
// Originale Optik beibehalten: Emerald (pageViews) + Blue (sessions)
const TRAFFIC_COLORS = {
  pageViews: DASHBOARD_CHART.primary,   // #10b981 emerald-500
  sessions:  DASHBOARD_CHART.sessions,  // #3b82f6 blue-500
} as const;

interface TrafficChartProps {
  data: TimeSeriesPageView[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        No traffic data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={TRAFFIC_COLORS.pageViews} stopOpacity={0.3} />
            <stop offset="95%" stopColor={TRAFFIC_COLORS.pageViews} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={TRAFFIC_COLORS.sessions} stopOpacity={0.3} />
            <stop offset="95%" stopColor={TRAFFIC_COLORS.sessions} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_NEUTRAL.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: CHART_NEUTRAL.axisText }}
          tickLine={false}
          axisLine={{ stroke: CHART_NEUTRAL.axisLine }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: CHART_NEUTRAL.axisText }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_NEUTRAL.tooltipBg,
            border: `1px solid ${CHART_NEUTRAL.tooltipBorder}`,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: CHART_NEUTRAL.tooltipText, fontWeight: 600 }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span className="text-sm text-slate-600">{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="pageViews"
          name="Page Views"
          stroke={TRAFFIC_COLORS.pageViews}
          strokeWidth={2}
          fill="url(#pageViewsGradient)"
        />
        <Area
          type="monotone"
          dataKey="sessions"
          name="Sessions"
          stroke={TRAFFIC_COLORS.sessions}
          strokeWidth={2}
          fill="url(#sessionsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
