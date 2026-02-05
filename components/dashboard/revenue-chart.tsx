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

interface RevenueChartProps {
  data: { month: string; revenue: number; count: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        No revenue data yet. Import conversions to see monthly revenue.
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
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
        <YAxis
          className="text-xs"
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value, name) => {
            if (name === 'revenue') {
              const val = typeof value === 'number' ? value : 0;
              return [`$${val.toFixed(2)}`, 'Revenue'];
            }
            return [value, 'Conversions'];
          }}
        />
        <Bar
          dataKey="revenue"
          fill="hsl(142, 76%, 36%)"
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
