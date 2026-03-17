'use client';

import { useState, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
  Zap,
  Target,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { getRevenueForecast } from '@/lib/actions/revenue-forecast';
import type { RevenueForecastSummary } from '@/lib/actions/revenue-forecast';

// ============================================================
// Revenue Forecast Panel — Light Dashboard Theme
// Shows live CTA click × CPA revenue projection
// ============================================================

interface RevenueForecastProps {
  initialData: RevenueForecastSummary;
}

const FLAG_MAP: Record<string, string> = {
  us: '🇺🇸',
  uk: '🇬🇧',
  ca: '🇨🇦',
  au: '🇦🇺',
};

export function RevenueForecast({ initialData }: RevenueForecastProps) {
  const [data, setData] = useState<RevenueForecastSummary>(initialData);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>(initialData.timeRange);

  const refresh = useCallback(async (newRange?: '7d' | '30d') => {
    setLoading(true);
    try {
      const range = newRange ?? timeRange;
      const result = await getRevenueForecast(range);
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error('[Revenue Forecast] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const handleTimeChange = (range: '7d' | '30d') => {
    setTimeRange(range);
    refresh(range);
  };

  const isUp = data.trend === 'up';
  const isDown = data.trend === 'down';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
            <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Revenue Forecast</h3>
            <p className="text-[11px] text-slate-500">CTA Clicks × CPA × 3% Conversion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            {(['7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleTimeChange(r)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  timeRange === r
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === '7d' ? '7D' : '30D'}
              </button>
            ))}
          </div>
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Expected Revenue */}
          <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Expected Revenue</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold text-slate-800">
                ${data.totalExpectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              {data.trendChange > 0 && (
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 mb-0.5 ${
                  isUp ? 'text-emerald-600' : isDown ? 'text-rose-500' : 'text-slate-500'
                }`}>
                  {isUp ? <ArrowUpRight className="h-3 w-3" /> : isDown ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {data.trendChange}%
                </span>
              )}
            </div>
          </div>

          {/* Monthly Run Rate */}
          <div className="rounded-xl p-4 bg-violet-50 border border-violet-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Monthly Run Rate</span>
            </div>
            <span className="text-xl font-bold text-slate-800">
              ${data.monthlyRunRate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Emerald Clicks */}
          <div className="rounded-xl p-4 bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Action Clicks</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold text-slate-800">{data.totalEmeraldClicks.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 mb-0.5">
                {data.totalMatchedClicks} matched
              </span>
            </div>
          </div>

          {/* Avg CPA */}
          <div className="rounded-xl p-4 bg-cyan-50 border border-cyan-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Avg CPA</span>
            </div>
            <span className="text-xl font-bold text-slate-800">
              ${data.avgCpa.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Revenue by Provider + Market (side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Providers */}
          <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="h-3 w-3 text-emerald-500" />
              Top Revenue by Provider
            </h4>
            {data.byProvider.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No matched providers yet</p>
            ) : (
              <div className="space-y-2">
                {data.byProvider.slice(0, 5).map((p) => {
                  const maxRev = data.byProvider[0]?.revenue || 1;
                  const pct = (p.revenue / maxRev) * 100;
                  return (
                    <div key={p.provider} className="flex items-center gap-3">
                      <span className="text-xs text-slate-700 font-medium w-28 truncate">{p.provider}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 w-16 text-right">
                        ${p.revenue.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revenue by Market */}
          <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Globe className="h-3 w-3 text-violet-500" />
              Revenue by Market
            </h4>
            {data.byMarket.length === 0 || data.byMarket.every(m => m.revenue === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No market revenue data yet</p>
            ) : (
              <div className="space-y-2.5">
                {data.byMarket.filter(m => m.revenue > 0).map((m) => {
                  const maxRev = Math.max(...data.byMarket.map(x => x.revenue), 1);
                  const pct = (m.revenue / maxRev) * 100;
                  return (
                    <div key={m.market} className="flex items-center gap-3">
                      <span className="text-sm">{FLAG_MAP[m.market] || '🌐'}</span>
                      <span className="text-xs text-slate-700 font-semibold uppercase w-6">{m.market}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-violet-600 w-16 text-right">
                        ${m.revenue.toFixed(0)}
                      </span>
                      <span className="text-[10px] text-slate-400 w-14 text-right">
                        {m.clicks} clicks
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
