'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DeviceStats } from '@/lib/actions/dashboard';

interface DeviceChartProps {
  data: DeviceStats;
}

// Canua-inspired colors: Navy, Teal, Mint
const COLORS = {
  desktop: '#1e3a5a', // Deep navy
  mobile: '#14b8a6', // Teal
  tablet: '#6ee7b7', // Mint
};

export function DeviceChart({ data }: DeviceChartProps) {
  const total = data.desktop + data.mobile + data.tablet;

  if (total === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-400">
        No device data yet.
      </div>
    );
  }

  const chartData = [
    { name: 'Desktop', value: data.desktop, color: COLORS.desktop },
    { name: 'Mobile', value: data.mobile, color: COLORS.mobile },
    { name: 'Tablet', value: data.tablet, color: COLORS.tablet },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value, name) => {
              const val = typeof value === 'number' ? value : 0;
              return [
                `${val} (${Math.round((val / total) * 100)}%)`,
                String(name),
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend - Canua style with percentages on the side */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.desktop }} />
            <span className="text-sm text-slate-600">Desktop</span>
          </div>
          <span className="text-sm font-semibold text-slate-800">{data.desktopPercent}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.mobile }} />
            <span className="text-sm text-slate-600">Mobile</span>
          </div>
          <span className="text-sm font-semibold text-slate-800">{data.mobilePercent}%</span>
        </div>
        {data.tablet > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.tablet }} />
              <span className="text-sm text-slate-600">Tablet</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">{data.tabletPercent}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
