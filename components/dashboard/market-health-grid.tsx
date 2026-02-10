'use client';

import { ArrowUpRight, ArrowDownRight, Crown, TrendingUp } from 'lucide-react';
import type { MarketPerformance, MarketSparklineData } from '@/lib/actions/dashboard';

interface MarketHealthGridProps {
  markets: MarketPerformance[];
}

// Mini sparkline component
function Sparkline({ data, color = '#10b981' }: { data: MarketSparklineData[]; color?: string }) {
  if (!data || data.length === 0) return null;

  const maxClicks = Math.max(...data.map(d => d.clicks), 1);
  const height = 24;
  const width = 80;
  const padding = 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.clicks / maxClicks) * (height - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={width - padding}
          cy={height - padding - ((data[data.length - 1].clicks / maxClicks) * (height - padding * 2))}
          r="2"
          fill={color}
        />
      )}
    </svg>
  );
}

// Trend indicator
function TrendBadge({ trend, change }: { trend: 'up' | 'down' | 'neutral'; change: number }) {
  if (trend === 'neutral' || change === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      trend === 'up' ? 'text-green-600' : 'text-red-500'
    }`}>
      {trend === 'up' ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {change}%
    </span>
  );
}

// Single market card
function MarketCard({ market }: { market: MarketPerformance }) {
  const sparklineColor = market.clicksTrend === 'up' ? '#10b981' : market.clicksTrend === 'down' ? '#ef4444' : '#64748b';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{market.flag}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm">{market.market}</span>
              {market.isLeader && (
                <Crown className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <span className="text-xs text-slate-500">{market.marketName}</span>
          </div>
        </div>
        <Sparkline data={market.sparklineData} color={sparklineColor} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Revenue */}
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Revenue</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-slate-900 tabular-nums">
              ${market.revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <TrendBadge trend={market.revenueTrend} change={market.revenueChange} />
          </div>
          <p className="text-xs text-slate-400">
            {market.currencySymbol}{market.revenueLocal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {market.currency}
          </p>
        </div>

        {/* Clicks */}
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Clicks</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-slate-900 tabular-nums">
              {market.clicks.toLocaleString('en-US')}
            </span>
            <TrendBadge trend={market.clicksTrend} change={market.clicksChange} />
          </div>
        </div>
      </div>

      {/* Performance Row */}
      <div className="flex items-center justify-between py-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          {/* EPC */}
          <div>
            <p className="text-xs text-slate-400">EPC</p>
            <p className={`text-sm font-semibold tabular-nums ${
              market.isLeader ? 'text-emerald-600' : 'text-slate-700'
            }`}>
              ${market.epc.toFixed(2)}
            </p>
          </div>

          {/* CR */}
          <div>
            <p className="text-xs text-slate-400">CR</p>
            <p className="text-sm font-semibold text-slate-700 tabular-nums">
              {market.conversionRate.toFixed(1)}%
            </p>
          </div>

          {/* Engagement */}
          <div>
            <p className="text-xs text-slate-400">Engage</p>
            <p className="text-sm font-semibold text-slate-700 tabular-nums">
              {market.engagementScore}%
            </p>
          </div>
        </div>

        {/* Rank Badge */}
        <div className={`px-2 py-0.5 rounded text-xs font-medium ${
          market.rank === 1 ? 'bg-amber-100 text-amber-700' :
          market.rank === 2 ? 'bg-slate-100 text-slate-600' :
          market.rank === 3 ? 'bg-orange-100 text-orange-700' :
          'bg-slate-50 text-slate-500'
        }`}>
          #{market.rank} ROI
        </div>
      </div>

      {/* Top Product */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500">Top Product</span>
          </div>
          <span className="text-xs font-medium text-slate-700">{market.topProduct}</span>
        </div>
        {market.topProductClicks > 0 && (
          <p className="text-xs text-slate-400 text-right mt-0.5">
            {market.topProductClicks} clicks · ${market.topProductRevenue.toFixed(0)} revenue
          </p>
        )}
      </div>
    </div>
  );
}

export function MarketHealthGrid({ markets }: MarketHealthGridProps) {
  if (!markets || markets.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-slate-500">No market data available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {markets.map((market) => (
        <MarketCard key={market.market} market={market} />
      ))}
    </div>
  );
}
