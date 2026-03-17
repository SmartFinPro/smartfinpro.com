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
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: '#1e293b', fontWeight: 600 }}
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
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#pageViewsGradient)"
        />
        <Area
          type="monotone"
          dataKey="sessions"
          name="Sessions"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#sessionsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
