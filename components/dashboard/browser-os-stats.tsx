'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { BrowserStat, OSStat } from '@/lib/actions/analytics';

interface BrowserOSStatsProps {
  browserStats: BrowserStat[];
  osStats: OSStat[];
}

const BROWSER_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
const OS_COLORS = ['#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#64748b'];

export function BrowserOSStats({ browserStats, osStats }: BrowserOSStatsProps) {
  const browserData = browserStats.map((b, i) => ({
    name: b.browser,
    value: b.sessions,
    color: BROWSER_COLORS[i % BROWSER_COLORS.length],
  }));

  const osData = osStats.map((o, i) => ({
    name: o.os,
    value: o.sessions,
    color: OS_COLORS[i % OS_COLORS.length],
  }));

  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const { name, percent } = props;
    if (typeof percent !== 'number' || percent < 0.05) return null;
    return `${name || ''} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Browser Stats */}
      <div>
        <h4 className="text-sm font-medium text-slate-600 mb-4">Browser Distribution</h4>
        {browserData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={browserData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                label={renderCustomLabel}
                labelLine={false}
              >
                {browserData.map((entry, index) => (
                  <Cell key={`browser-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`${value} sessions`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400">
            No browser data
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {browserData.slice(0, 4).map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OS Stats */}
      <div>
        <h4 className="text-sm font-medium text-slate-600 mb-4">Operating System</h4>
        {osData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={osData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                label={renderCustomLabel}
                labelLine={false}
              >
                {osData.map((entry, index) => (
                  <Cell key={`os-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`${value} sessions`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400">
            No OS data
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {osData.slice(0, 4).map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
