'use client';

import { useState, useCallback } from 'react';
import {
  Flame,
  Grid3X3,
  Loader2,
  RefreshCw,
  MousePointerClick,
  TrendingUp,
  Zap,
  Globe,
  Bell,
  BellOff,
  Send,
  Settings2,
  Eye,
  Target,
  ShieldCheck,
  Minus,
  Plus,
} from 'lucide-react';
import type { HeatmapCell, HeatmapData, HeatmapTimeRange } from '@/lib/actions/cta-analytics';
import type { AlertSettings } from '@/lib/actions/spike-monitor';
import type { Market } from '@/lib/supabase/types';

// ============================================================
// CTA Heatmap Grid — Click Density Visualization
// ============================================================

interface CtaHeatmapProps {
  initialData: HeatmapData;
  initialAlertSettings?: AlertSettings[];
}

const MARKET_TABS: { value: Market | 'all'; label: string; flag: string }[] = [
  { value: 'all', label: 'GLOBAL', flag: '🌐' },
  { value: 'us', label: 'US', flag: '🇺🇸' },
  { value: 'uk', label: 'UK', flag: '🇬🇧' },
  { value: 'au', label: 'AU', flag: '🇦🇺' },
  { value: 'ca', label: 'CA', flag: '🇨🇦' },
];

const TIME_TABS: { value: HeatmapTimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

// Color mapping based on intensity (0-100) — Light theme
function getIntensityColor(intensity: number): string {
  if (intensity === 0) return 'bg-slate-100';
  if (intensity <= 20) return 'bg-slate-200';
  if (intensity <= 50) return 'bg-indigo-100';
  if (intensity <= 80) return 'bg-violet-200';
  return 'bg-emerald-300';
}

function getIntensityBorder(intensity: number): string {
  if (intensity === 0) return 'border-slate-200';
  if (intensity <= 20) return 'border-slate-300';
  if (intensity <= 50) return 'border-indigo-200';
  if (intensity <= 80) return 'border-violet-300';
  return 'border-emerald-400';
}

function getIntensityGlow(intensity: number): string {
  if (intensity <= 20) return '';
  if (intensity <= 50) return '0 0 8px rgba(99, 102, 241, 0.1)';
  if (intensity <= 80) return '0 0 12px rgba(139, 92, 246, 0.15)';
  return '0 0 16px rgba(16, 185, 129, 0.2)';
}

function getIntensityLabel(intensity: number): string {
  if (intensity === 0) return 'No data';
  if (intensity <= 20) return 'Ice Cold';
  if (intensity <= 50) return 'Warming Up';
  if (intensity <= 80) return 'Active';
  return 'Red Hot 🔥';
}

function getCtrLabel(ctr: number): { label: string; color: string } {
  if (ctr === 0) return { label: 'No data', color: 'text-slate-400' };
  if (ctr < 2) return { label: 'Very Low', color: 'text-slate-400' };
  if (ctr < 5) return { label: 'Low', color: 'text-amber-500' };
  if (ctr < 10) return { label: 'Good', color: 'text-emerald-500' };
  return { label: 'Excellent', color: 'text-emerald-600 font-bold' };
}

function getCtrBarColor(ctr: number): string {
  if (ctr < 2) return 'bg-slate-400';
  if (ctr < 5) return 'bg-amber-500';
  if (ctr < 10) return 'bg-emerald-500';
  return 'bg-emerald-600';
}

function formatSlug(slug: string): string {
  // /personal-finance/best-robo-advisors → best-robo-advisors
  const parts = slug.split('/').filter(Boolean);
  return parts[parts.length - 1] || slug;
}

export function CtaHeatmap({ initialData, initialAlertSettings }: CtaHeatmapProps) {
  const [data, setData] = useState<HeatmapData>(initialData);
  const [marketFilter, setMarketFilter] = useState<Market | 'all'>('all');
  const [timeRange, setTimeRange] = useState<HeatmapTimeRange>(initialData.timeRange);
  const [loading, setLoading] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [alertSettings, setAlertSettings] = useState<AlertSettings[]>(
    initialAlertSettings || [
      { market: 'us' as Market, telegramEnabled: false, ctrThreshold: 5.0 },
      { market: 'uk' as Market, telegramEnabled: false, ctrThreshold: 5.0 },
      { market: 'ca' as Market, telegramEnabled: false, ctrThreshold: 5.0 },
      { market: 'au' as Market, telegramEnabled: false, ctrThreshold: 5.0 },
    ]
  );
  const [togglingMarket, setTogglingMarket] = useState<Market | null>(null);
  const [updatingThreshold, setUpdatingThreshold] = useState<Market | null>(null);

  const refresh = useCallback(
    async (newRange?: HeatmapTimeRange, newMarket?: Market | 'all') => {
      setLoading(true);
      try {
        const range = newRange ?? timeRange;
        const market = newMarket ?? marketFilter;
        const params = new URLSearchParams({ timeRange: range });
        if (market !== 'all') params.set('market', market);
        const res = await fetch(`/api/dashboard/cta-heatmap?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (err) {
        console.error('[Heatmap] Refresh error:', err);
      } finally {
        setLoading(false);
      }
    },
    [timeRange, marketFilter]
  );

  const handleMarketChange = (market: Market | 'all') => {
    setMarketFilter(market);
    refresh(undefined, market);
  };

  const handleTimeChange = (range: HeatmapTimeRange) => {
    setTimeRange(range);
    refresh(range, undefined);
  };

  const handleToggleAlert = useCallback(async (market: Market) => {
    setTogglingMarket(market);
    try {
      const current = alertSettings.find((s) => s.market === market);
      const newValue = !(current?.telegramEnabled ?? false);
      const res = await fetch('/api/dashboard/spike-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleMarketAlert', market, enabled: newValue }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success) {
        setAlertSettings((prev) =>
          prev.map((s) => (s.market === market ? { ...s, telegramEnabled: newValue } : s))
        );
      }
    } catch (err) {
      console.error('[Heatmap] Toggle alert error:', err);
    } finally {
      setTogglingMarket(null);
    }
  }, [alertSettings]);

  const handleCtrThreshold = useCallback(async (market: Market, delta: number) => {
    setUpdatingThreshold(market);
    try {
      const current = alertSettings.find((s) => s.market === market);
      const currentVal = current?.ctrThreshold ?? 5.0;
      const newVal = Math.max(0, Math.min(100, currentVal + delta));
      const res = await fetch('/api/dashboard/spike-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateCtrThreshold', market, threshold: newVal }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success) {
        setAlertSettings((prev) =>
          prev.map((s) => (s.market === market ? { ...s, ctrThreshold: newVal } : s))
        );
      }
    } catch (err) {
      console.error('[Heatmap] CTR threshold error:', err);
    } finally {
      setUpdatingThreshold(null);
    }
  }, [alertSettings]);

  const handleCellHover = (cell: HeatmapCell, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredCell(cell);
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  // Filter cells by market (client-side for instant filtering when data is already loaded)
  const filteredCells =
    marketFilter === 'all'
      ? data.cells
      : data.cells.filter((c) => c.market === marketFilter);

  // Stat calculations
  const totalClicks = filteredCells.reduce((sum, c) => sum + c.totalClicks, 0);
  const avgIntensity =
    filteredCells.length > 0
      ? Math.round(filteredCells.reduce((sum, c) => sum + c.intensity, 0) / filteredCells.length)
      : 0;
  const hotPages = filteredCells.filter((c) => c.intensity > 80).length;
  const coldPages = filteredCells.filter((c) => c.intensity <= 20).length;

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MousePointerClick}
          label="Total CTA Clicks"
          value={totalClicks.toLocaleString('en-US')}
          color="emerald"
        />
        <StatCard
          icon={Flame}
          label="Avg Intensity"
          value={`${avgIntensity}/100`}
          color="amber"
        />
        <StatCard
          icon={Zap}
          label="Hot Pages"
          value={hotPages.toString()}
          subtitle="intensity > 80"
          color="violet"
        />
        <StatCard
          icon={Grid3X3}
          label="Cold Pages"
          value={coldPages.toString()}
          subtitle="intensity ≤ 20"
          color="slate"
        />
      </div>

      {/* ── Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Market Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
          {MARKET_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleMarketChange(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                marketFilter === tab.value
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="mr-1">{tab.flag}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Time Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
            {TIME_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTimeChange(tab.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  timeRange === tab.value
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* ── Heatmap Grid ───────────────────────────────── */}
      <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-violet-500" />
            Click Density Grid
            <span className="text-slate-400 font-normal">
              ({filteredCells.length} page{filteredCells.length !== 1 ? 's' : ''})
            </span>
          </h3>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500">
            <span>Cold</span>
            <div className="flex gap-0.5">
              <div className="w-4 h-3 rounded-sm bg-slate-200" />
              <div className="w-4 h-3 rounded-sm bg-indigo-100" />
              <div className="w-4 h-3 rounded-sm bg-violet-200" />
              <div className="w-4 h-3 rounded-sm bg-emerald-300" />
            </div>
            <span>Hot</span>
          </div>
        </div>

        {filteredCells.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <MousePointerClick className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No CTA click data yet</p>
            <p className="text-xs mt-1">
              Clicks will appear here as users interact with affiliate buttons
            </p>
          </div>
        ) : (
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
            }}
          >
            {filteredCells.map((cell) => (
              <div
                key={`${cell.slug}|${cell.market}`}
                className={`relative aspect-square rounded-md border cursor-pointer transition-all hover:scale-110 hover:z-10 ${getIntensityColor(
                  cell.intensity
                )} ${getIntensityBorder(cell.intensity)}`}
                style={{
                  boxShadow: getIntensityGlow(cell.intensity),
                }}
                onMouseEnter={(e) => handleCellHover(cell, e)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {/* Click count label for hot cells */}
                {cell.intensity > 50 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">
                    {cell.totalClicks}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tooltip ────────────────────────────────── */}
        {hoveredCell && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 px-4 py-3 text-xs min-w-[220px]">
              {/* Slug */}
              <p className="font-semibold text-sm mb-2 text-slate-800 truncate max-w-[240px]">
                {formatSlug(hoveredCell.slug)}
              </p>

              {/* Market badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium uppercase text-slate-600">
                  {hoveredCell.market}
                </span>
                <span className="text-slate-500">{getIntensityLabel(hoveredCell.intensity)}</span>
              </div>

              {/* Stats */}
              <div className="space-y-1 text-slate-500">
                <div className="flex justify-between">
                  <span>Total Clicks</span>
                  <span className="font-semibold text-slate-800">{hoveredCell.totalClicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Action (Emerald)
                  </span>
                  <span className="font-medium text-slate-700">{hoveredCell.emeraldClicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Learn More (Violet)
                  </span>
                  <span className="font-medium text-slate-700">{hoveredCell.violetClicks}</span>
                </div>
                {/* Ratio bar */}
                {hoveredCell.totalClicks > 0 && (
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 mt-1">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${(hoveredCell.emeraldClicks / hoveredCell.totalClicks) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-violet-500"
                      style={{
                        width: `${(hoveredCell.violetClicks / hoveredCell.totalClicks) * 100}%`,
                      }}
                    />
                  </div>
                )}
                {hoveredCell.topProvider && (
                  <div className="flex justify-between pt-1 border-t border-slate-100 mt-1">
                    <span>Top Provider</span>
                    <span className="font-medium text-emerald-600">{hoveredCell.topProvider}</span>
                  </div>
                )}
                {/* CTR Confidence Score */}
                <div className="pt-1.5 mt-1.5 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-blue-500" />
                      Page Views
                    </span>
                    <span className="font-medium text-slate-700">{hoveredCell.pageViews.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-cyan-500" />
                      CTR
                    </span>
                    <span className={`font-semibold ${getCtrLabel(hoveredCell.ctr).color}`}>
                      {hoveredCell.ctr.toFixed(1)}%
                      <span className="text-[9px] ml-1 opacity-70">
                        ({getCtrLabel(hoveredCell.ctr).label})
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tooltip arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white" />
            </div>
          </div>
        )}
      </div>

      {/* ── Top Pages Table ────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Top Performing Pages
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Clicks
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Emerald / Violet
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Top Provider
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Views
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  CTR
                </th>
                <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Intensity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCells.slice(0, 25).map((cell, i) => (
                <tr key={`${cell.slug}|${cell.market}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 w-5">{i + 1}.</span>
                      <span className="font-medium text-slate-700 truncate max-w-[280px]">
                        {formatSlug(cell.slug)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold uppercase text-slate-600">
                      {cell.market}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                    {cell.totalClicks}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-2 w-20 rounded-full overflow-hidden bg-slate-100">
                        {cell.totalClicks > 0 && (
                          <>
                            <div
                              className="bg-emerald-500"
                              style={{
                                width: `${(cell.emeraldClicks / cell.totalClicks) * 100}%`,
                              }}
                            />
                            <div
                              className="bg-violet-500"
                              style={{
                                width: `${(cell.violetClicks / cell.totalClicks) * 100}%`,
                              }}
                            />
                          </>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {cell.emeraldClicks}/{cell.violetClicks}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 truncate max-w-[140px]">
                    {cell.topProvider || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-slate-500">
                    {cell.pageViews > 0 ? cell.pageViews.toLocaleString('en-US') : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getCtrBarColor(cell.ctr)}`}
                          style={{ width: `${Math.min(cell.ctr * 5, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-12 text-right ${getCtrLabel(cell.ctr).color}`}>
                        {cell.ctr > 0 ? `${cell.ctr.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            cell.intensity > 80
                              ? 'bg-emerald-500'
                              : cell.intensity > 50
                                ? 'bg-violet-500'
                                : cell.intensity > 20
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-400'
                          }`}
                          style={{ width: `${cell.intensity}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 w-7 text-right">
                        {cell.intensity}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCells.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No click data available for this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Telegram Alert Settings + CTR Thresholds ──── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-500" />
            Telegram Spike Alerts
          </h3>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
            Every 15 min &bull; 300% threshold
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">
            Receive a Telegram notification when CTA clicks spike above 300% of the 7-day average.
            Toggle per market below.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['us', 'uk', 'ca', 'au'] as const).map((market) => {
              const setting = alertSettings.find((s) => s.market === market);
              const enabled = setting?.telegramEnabled ?? false;
              const isToggling = togglingMarket === market;
              const flagMap = { us: '🇺🇸', uk: '🇬🇧', ca: '🇨🇦', au: '🇦🇺' };

              return (
                <button
                  key={market}
                  onClick={() => handleToggleAlert(market)}
                  disabled={isToggling}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                    enabled
                      ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  } ${isToggling ? 'opacity-60' : ''}`}
                >
                  <span className="text-lg">{flagMap[market]}</span>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-slate-700 uppercase">{market}</p>
                    <p className="text-[10px] text-slate-400">
                      {enabled ? 'Alerts ON' : 'Alerts OFF'}
                    </p>
                  </div>
                  {isToggling ? (
                    <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                  ) : enabled ? (
                    <Bell className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <BellOff className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
          {!process.env.NEXT_PUBLIC_SITE_URL && (
            <p className="text-[10px] text-amber-500 mt-3 flex items-center gap-1">
              <Settings2 className="h-3 w-3" />
              Set TELEGRAM_BOT_TOKEN &amp; TELEGRAM_CHAT_ID in .env.local to enable delivery
            </p>
          )}
        </div>
      </div>

      {/* ── CTR Threshold Settings (Auto-Pilot Gate) ─── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-500" />
            CTR Decision Threshold
          </h3>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
            Auto-Pilot Gate
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-1">
            Auto-pilot only fires a rebuild when <strong>Spike detected AND CTR &gt; threshold</strong>.
          </p>
          <p className="text-[10px] text-slate-400 mb-4">
            CTR &gt; 10% = High-Priority Rebuild &bull; CTR &lt; threshold = Telegram alert only (no rebuild)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['us', 'uk', 'ca', 'au'] as const).map((market) => {
              const setting = alertSettings.find((s) => s.market === market);
              const threshold = setting?.ctrThreshold ?? 5.0;
              const isUpdating = updatingThreshold === market;
              const flagMap = { us: '🇺🇸', uk: '🇬🇧', ca: '🇨🇦', au: '🇦🇺' };

              return (
                <div
                  key={market}
                  className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{flagMap[market]}</span>
                    <span className="text-xs font-semibold text-slate-700 uppercase">{market}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCtrThreshold(market, -0.5)}
                      disabled={isUpdating || threshold <= 0}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      <Minus className="h-3 w-3 text-slate-500" />
                    </button>
                    <div className="w-16 text-center">
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 text-slate-400 animate-spin mx-auto" />
                      ) : (
                        <span className="text-sm font-bold text-cyan-600">
                          {threshold.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCtrThreshold(market, 0.5)}
                      disabled={isUpdating || threshold >= 100}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="h-3 w-3 text-slate-500" />
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-400">min CTR for rebuild</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Stat Card (light dashboard theme)
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  color: 'emerald' | 'amber' | 'violet' | 'slate';
}) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', ring: 'ring-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-500', ring: 'ring-amber-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-500', ring: 'ring-violet-100' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-500', ring: 'ring-slate-200' },
  };
  const c = colorMap[color];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${c.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
