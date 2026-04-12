'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { EPCTrendData } from '@/lib/actions/revenue';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

interface EPCTrendChartProps {
  data: EPCTrendData[];
  globalEPC: number;
}

const CHART_COLORS = {
  stroke: '#8b5cf6', // Purple-500
  fill: '#8b5cf6',
  grid: '#e2e8f0',
  reference: '#10b981', // Emerald for average line
  tooltip: {
    bg: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
  },
};

export function EPCTrendChart({ data, globalEPC }: EPCTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <WidgetErrorBoundary label="EPC Trend Chart" minHeight="h-64">
        <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
          No EPC data yet.
        </div>
      </WidgetErrorBoundary>
    );
  }

  return (
    <WidgetErrorBoundary label="EPC Trend Chart" minHeight="h-64">
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="epcGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.fill} stopOpacity={0.2} />
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
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
          width={40}
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
            if (name === 'epc') {
              const val = typeof value === 'number' ? value : 0;
              return [`$${val.toFixed(2)}`, 'EPC'];
            }
            return [value, name];
          }}
          labelStyle={{ color: '#64748b' }}
        />
        {/* Reference line for global average EPC */}
        {globalEPC > 0 && (
          <ReferenceLine
            y={globalEPC}
            stroke={CHART_COLORS.reference}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `Avg: $${globalEPC.toFixed(2)}`,
              position: 'right',
              fill: CHART_COLORS.reference,
              fontSize: 10,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="epc"
          stroke={CHART_COLORS.stroke}
          strokeWidth={2}
          fill="url(#epcGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
    </WidgetErrorBoundary>
  );
}
