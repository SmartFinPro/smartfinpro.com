'use client';

import type { RevenueByMarket } from '@/lib/actions/revenue';

interface RevenueByMarketProps {
  markets: RevenueByMarket[];
}

// Progress bar for market share
function ShareBar({ share, color }: { share: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(share, 100)}%` }}
      />
    </div>
  );
}

export function RevenueByMarketGrid({ markets }: RevenueByMarketProps) {
  if (!markets || markets.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        No market data yet.
      </div>
    );
  }

  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {markets.map((market, index) => (
        <div
          key={market.market}
          className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{market.flag}</span>
            <div>
              <span className="font-semibold text-slate-900 text-sm">{market.market}</span>
              <span className="text-slate-400 text-xs ml-1">{market.currency}</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="mb-3">
            <p className="text-2xl font-bold text-slate-900 tabular-nums">
              ${market.revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-400">
              {market.currency !== 'USD' && (
                <>≈ {market.currency} {market.revenueLocal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</>
              )}
            </p>
          </div>

          {/* Market Share */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Market Share</span>
              <span className="font-medium text-slate-700">{market.share.toFixed(1)}%</span>
            </div>
            <ShareBar share={market.share} color={colors[index % colors.length]} />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400">EPC</p>
              <p className={`text-sm font-semibold tabular-nums ${
                market.epc >= 1 ? 'text-emerald-600' : 'text-slate-700'
              }`}>
                ${market.epc.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Clicks</p>
              <p className="text-sm font-semibold text-slate-700 tabular-nums">
                {market.clicks.toLocaleString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">CR</p>
              <p className={`text-sm font-semibold tabular-nums ${
                market.conversionRate >= 5 ? 'text-emerald-600' : 'text-slate-700'
              }`}>
                {market.conversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
