'use client';

import { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Globe,
  Zap,
  Loader2,
  Target,
  Eye,
  MousePointer,
  BarChart3,
  ExternalLink,
  Crown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Radio,
  Database,
  CheckCircle,
  Circle,
} from 'lucide-react';
import type { Market } from '@/types';
import type {
  RankingKeyword,
  RankingStats,
  WinnerLoser,
  SerpResult,
  RealtimeRankingResult,
} from '@/lib/actions/ranking';
import type { PositionTrend } from '@/lib/seo/google-search-console';
import { toast } from 'sonner';

// ── Constants ────────────────────────────────────────────────

const MARKETS: { code: Market | 'all'; flag: string; name: string }[] = [
  { code: 'all', flag: '\ud83c\udf0d', name: 'All Markets' },
  { code: 'us', flag: '\ud83c\uddfa\ud83c\uddf8', name: 'United States' },
  { code: 'uk', flag: '\ud83c\uddec\ud83c\udde7', name: 'United Kingdom' },
  { code: 'ca', flag: '\ud83c\udde8\ud83c\udde6', name: 'Canada' },
  { code: 'au', flag: '\ud83c\udde6\ud83c\uddfa', name: 'Australia' },
];

const CHART_COLORS = {
  position: '#7c3aed',
  clicks: '#059669',
  grid: '#e2e8f0',
  text: '#64748b',
  tooltip: { bg: '#ffffff', border: '#e2e8f0', text: '#1e293b' },
};

// ── Glass Card Wrapper ──────────────────────────────────────

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'violet' | 'emerald' | 'amber' | 'cyan' | 'slate';
  subtitle?: string;
}) {
  const colorMap = {
    violet: { text: 'text-violet-600', icon: 'text-violet-500', glow: 'rgba(139,92,246,0.08)' },
    emerald: { text: 'text-emerald-600', icon: 'text-emerald-500', glow: 'rgba(52,211,153,0.08)' },
    amber: { text: 'text-amber-600', icon: 'text-amber-500', glow: 'rgba(251,191,36,0.08)' },
    cyan: { text: 'text-cyan-600', icon: 'text-cyan-500', glow: 'rgba(34,211,238,0.08)' },
    slate: { text: 'text-slate-700', icon: 'text-slate-500', glow: 'rgba(148,163,184,0.06)' },
  };
  const c = colorMap[color];

  return (
    <div
      className="rounded-xl border border-slate-200 p-5"
      style={{ background: c.glow }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 tabular-nums ${c.text}`}>{value}</p>
          {subtitle && (
            <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200"
        >
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

// ── Position Delta Badge ────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500 px-1.5 py-0.5 rounded"
        style={{ background: 'rgba(100,116,139,0.08)' }}>
        <Minus className="h-3 w-3" /> —
      </span>
    );
  }

  const improved = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded ${
        improved ? 'text-emerald-400' : 'text-rose-400'
      }`}
      style={{ background: improved ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)' }}
    >
      {improved ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}
    </span>
  );
}

// ── Position Badge ──────────────────────────────────────────

function PositionBadge({ position }: { position: number }) {
  if (position === 0) {
    return (
      <span className="text-xs tabular-nums font-medium text-slate-400 flex items-center gap-1">
        <Circle className="h-3 w-3" /> unchecked
      </span>
    );
  }

  if (position === 1) {
    return (
      <span className="inline-flex items-center gap-1 text-sm tabular-nums font-bold text-amber-500">
        <Crown className="h-3.5 w-3.5" /> #1
      </span>
    );
  }

  if (position <= 3) {
    return (
      <span className="text-sm tabular-nums font-bold text-amber-500">#{position}</span>
    );
  }

  if (position <= 10) {
    return (
      <span className="text-sm tabular-nums font-semibold text-emerald-600">#{position}</span>
    );
  }

  if (position <= 20) {
    return (
      <span className="text-sm tabular-nums font-medium text-cyan-600">#{position}</span>
    );
  }

  return (
    <span className="text-sm tabular-nums font-medium text-slate-500">#{position}</span>
  );
}

// ── Position Trend Chart ────────────────────────────────────

function PositionTrendChart({
  data,
  keyword,
}: {
  data: PositionTrend[];
  keyword: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
        No trend data available
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    invertedPos: d.position,
  }));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-medium text-slate-700">
          Position Trend: <span className="text-violet-600">{keyword}</span>
        </p>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.grid}
            strokeOpacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            reversed
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickLine={false}
            axisLine={false}
            width={30}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltip.bg,
              border: `1px solid ${CHART_COLORS.tooltip.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              color: CHART_COLORS.tooltip.text,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            }}
            formatter={(value, name) => {
              const v = typeof value === 'number' ? value : 0;
              if (name === 'invertedPos') return [`#${v}`, 'Position'];
              if (name === 'clicks') return [`${v}`, 'Clicks'];
              return [`${v}`, name || ''];
            }}
          />
          <Line
            type="monotone"
            dataKey="invertedPos"
            stroke={CHART_COLORS.position}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.position, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART_COLORS.position }}
          />
          <Line
            type="monotone"
            dataKey="clicks"
            stroke={CHART_COLORS.clicks}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-5 mt-3 justify-center">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className="w-4 h-0.5 bg-violet-400 rounded" />
          Position (lower = better)
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className="w-4 h-0.5 bg-emerald-400 rounded" style={{ borderStyle: 'dashed' }} />
          Clicks
        </div>
      </div>
    </div>
  );
}

// ── Winners & Losers Section ────────────────────────────────

function WinnersLosers({
  winners,
  losers,
}: {
  winners: WinnerLoser[];
  losers: WinnerLoser[];
}) {
  if (winners.length === 0 && losers.length === 0) {
    return (
      <div className="py-12 text-center">
        <TrendingUp className="h-10 w-10 text-slate-700 mx-auto mb-3" />
        <p className="text-sm text-slate-500">
          Connect GSC to detect ranking winners &amp; losers
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Winners */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-slate-700">
            Winners <span className="text-[10px] text-slate-500 font-normal ml-1">7-day gain</span>
          </h4>
        </div>
        <div className="space-y-1.5">
          {winners.length > 0 ? winners.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200"
              style={{ background: 'rgba(52,211,153,0.05)' }}
            >
              <span className="text-[10px] font-bold text-emerald-600 w-5 h-5 rounded flex items-center justify-center shrink-0 border border-emerald-300"
                style={{ background: 'rgba(52,211,153,0.12)' }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{w.keyword}</p>
                <p className="text-[10px] text-slate-500 truncate">{w.page}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs tabular-nums font-medium text-slate-700">#{w.position}</p>
                <span className="text-[10px] font-medium text-emerald-600">+{Math.abs(w.positionDelta).toFixed(1)}</span>
              </div>
            </div>
          )) : (
            <p className="text-xs text-slate-600 px-3 py-4 text-center">No winners this period</p>
          )}
        </div>
      </div>

      {/* Losers */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-rose-400" />
          <h4 className="text-sm font-semibold text-slate-700">
            Losers <span className="text-[10px] text-slate-500 font-normal ml-1">7-day drop</span>
          </h4>
        </div>
        <div className="space-y-1.5">
          {losers.length > 0 ? losers.map((l, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200"
              style={{ background: 'rgba(251,113,133,0.05)' }}
            >
              <span className="text-[10px] font-bold text-rose-600 w-5 h-5 rounded flex items-center justify-center shrink-0 border border-rose-300"
                style={{ background: 'rgba(251,113,133,0.12)' }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{l.keyword}</p>
                <p className="text-[10px] text-slate-500 truncate">{l.page}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs tabular-nums font-medium text-slate-700">#{l.position}</p>
                <span className="text-[10px] font-medium text-rose-600">{l.positionDelta.toFixed(1)}</span>
              </div>
            </div>
          )) : (
            <p className="text-xs text-slate-600 px-3 py-4 text-center">No losers this period</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SERP Live Pulse Panel ───────────────────────────────────

function SerpPanel({
  result,
  isLoading,
}: {
  result: RealtimeRankingResult | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="h-8 w-8 text-violet-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Scanning SERP...</p>
      </div>
    );
  }

  if (!result || result.serpResults.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Result header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-600" />
          <h4 className="text-sm font-semibold text-slate-800">
            Live SERP: <span className="text-cyan-600">&quot;{result.keyword}&quot;</span>
          </h4>
        </div>
        <div className="flex-1" />
        {result.ownPosition !== null ? (
          <span className="text-[11px] font-medium text-amber-500 px-2 py-1 rounded-lg border border-amber-500/30"
            style={{ background: 'rgba(251,191,36,0.1)' }}>
            <Crown className="h-3 w-3 inline mr-1" />
            Your Position: #{result.ownPosition}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-500 px-2 py-1 rounded-lg border border-slate-200">
            Not in Top 10
          </span>
        )}
        {result.savedToDb && (
          <span className="text-[10px] text-emerald-600 flex items-center gap-1">
            <Database className="h-3 w-3" /> Saved
          </span>
        )}
      </div>

      {/* SERP Results */}
      {result.serpResults.map((r) => (
        <div
          key={r.position}
          className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
            r.isOwnSite
              ? 'border-violet-300'
              : 'border-slate-200 hover:border-slate-300'
          }`}
          style={{
            background: r.isOwnSite
              ? 'rgba(139,92,246,0.06)'
              : undefined,
          }}
        >
          <span
            className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center shrink-0 ${
              r.isOwnSite
                ? 'text-violet-600 border border-violet-300'
                : r.position === 1
                  ? 'text-amber-500 border border-amber-500/40'
                  : r.position <= 3
                    ? 'text-amber-500 border border-amber-500/30'
                    : 'text-slate-500 border border-slate-200'
            }`}
            style={{
              background: r.isOwnSite
                ? 'rgba(139,92,246,0.15)'
                : r.position === 1
                  ? 'rgba(251,191,36,0.15)'
                  : 'rgba(100,116,139,0.06)',
            }}
          >
            {r.position === 1 && !r.isOwnSite ? (
              <Crown className="h-3 w-3" />
            ) : (
              r.position
            )}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={`text-xs font-medium truncate ${r.isOwnSite ? 'text-violet-600' : 'text-slate-700'}`}>
                {r.title}
              </p>
              {r.isOwnSite && (
                <span className="text-[9px] font-bold text-violet-600 px-1.5 py-0.5 rounded shrink-0 border border-violet-300"
                  style={{ background: 'rgba(139,92,246,0.1)' }}>
                  YOU
                </span>
              )}
            </div>
            <p className="text-[10px] text-cyan-600 truncate">{r.link}</p>
            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{r.snippet}</p>
          </div>
          <a
            href={r.link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-1 rounded hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="h-3 w-3 text-slate-600" />
          </a>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

interface RankingDashboardProps {
  initialKeywords: RankingKeyword[];
  initialStats: RankingStats;
  initialTrend: PositionTrend[];
  initialWinners: WinnerLoser[];
  initialLosers: WinnerLoser[];
  gscConfigured: boolean;
  serperConfigured: boolean;
}

export function RankingDashboard({
  initialKeywords,
  initialStats,
  initialTrend,
  initialWinners,
  initialLosers,
  gscConfigured,
  serperConfigured,
}: RankingDashboardProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [stats] = useState(initialStats);
  const [trend, setTrend] = useState(initialTrend);
  const [trendKeyword, setTrendKeyword] = useState(
    initialKeywords.length > 0
      ? [...initialKeywords].filter((k) => k.clicks > 0).sort((a, b) => b.clicks - a.clicks)[0]?.keyword || initialKeywords[0]?.keyword || ''
      : '',
  );
  const [marketFilter, setMarketFilter] = useState<Market | 'all'>('all');
  const [sortField, setSortField] = useState<'position' | 'clicks' | 'impressions' | 'delta'>('position');
  const [sortAsc, setSortAsc] = useState(true);

  // SERP Live Pulse
  const [serpKeyword, setSerpKeyword] = useState('');
  const [serpMarket, setSerpMarket] = useState<Market>('us');
  const [serpResult, setSerpResult] = useState<RealtimeRankingResult | null>(null);
  const [serpLoading, setSerpLoading] = useState(false);

  // Single keyword pulse (from table row)
  const [pulsingKeyword, setPulsingKeyword] = useState<string | null>(null);

  // Keyword trend loading
  const [trendLoading, setTrendLoading] = useState(false);

  // Freshness boost loading (per keyword)
  const [boostingKeyword, setBoostingKeyword] = useState<string | null>(null);

  // ── Filter & Sort ────────────────────────────────────────

  const filtered = keywords.filter(
    (k) => marketFilter === 'all' || k.market === marketFilter,
  );

  const sorted = [...filtered].sort((a, b) => {
    // Always push position 0 (unchecked) to the bottom
    if (a.currentPosition === 0 && b.currentPosition !== 0) return 1;
    if (b.currentPosition === 0 && a.currentPosition !== 0) return -1;

    let cmp = 0;
    switch (sortField) {
      case 'position':
        cmp = a.currentPosition - b.currentPosition;
        break;
      case 'clicks':
        cmp = b.clicks - a.clicks;
        break;
      case 'impressions':
        cmp = b.impressions - a.impressions;
        break;
      case 'delta':
        cmp = (b.positionDelta ?? 0) - (a.positionDelta ?? 0);
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  // ── Handlers ─────────────────────────────────────────────

  const handleSerpPulse = useCallback(async () => {
    if (!serpKeyword.trim()) return;
    setSerpLoading(true);
    try {
      const res = await fetch('/api/dashboard/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'realtime-ranking',
          keyword: serpKeyword.trim(),
          market: serpMarket,
        }),
      });
      if (!res.ok) throw new Error(`SERP fetch failed: ${res.status}`);
      const result: RealtimeRankingResult = await res.json();
      setSerpResult(result);

      // Update the keyword in our local state if it exists
      if (result.ownPosition !== null) {
        setKeywords((prev) =>
          prev.map((k) =>
            k.keyword === result.keyword && k.market === result.market
              ? {
                  ...k,
                  previousPosition: k.currentPosition || null,
                  currentPosition: result.ownPosition!,
                  positionDelta: k.currentPosition > 0
                    ? Math.round((k.currentPosition - result.ownPosition!) * 10) / 10
                    : null,
                  lastUpdated: result.timestamp,
                }
              : k,
          ),
        );
      }
    } catch (err) {
      console.error('SERP fetch failed:', err);
    } finally {
      setSerpLoading(false);
    }
  }, [serpKeyword, serpMarket]);

  const handleRowPulse = useCallback(async (keyword: string, market: Market) => {
    if (!serperConfigured) return;
    setPulsingKeyword(keyword);
    try {
      const res = await fetch('/api/dashboard/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'realtime-ranking',
          keyword,
          market,
        }),
      });
      if (!res.ok) throw new Error(`Row pulse failed: ${res.status}`);
      const result: RealtimeRankingResult = await res.json();

      if (result.ownPosition !== null) {
        setKeywords((prev) =>
          prev.map((k) =>
            k.keyword === keyword && k.market === market
              ? {
                  ...k,
                  previousPosition: k.currentPosition || null,
                  currentPosition: result.ownPosition!,
                  positionDelta: k.currentPosition > 0
                    ? Math.round((k.currentPosition - result.ownPosition!) * 10) / 10
                    : null,
                  lastUpdated: result.timestamp,
                }
              : k,
          ),
        );
      }
    } catch {
      // silently fail
    } finally {
      setPulsingKeyword(null);
    }
  }, [serperConfigured]);

  const handleKeywordClick = useCallback(
    async (keyword: string) => {
      if (!gscConfigured) return;
      setTrendKeyword(keyword);
      setTrendLoading(true);
      try {
        const res = await fetch('/api/dashboard/ranking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'position-trend',
            keyword,
            days: 30,
          }),
        });
        if (!res.ok) throw new Error(`Trend fetch failed: ${res.status}`);
        const data: PositionTrend[] = await res.json();
        setTrend(data);
      } catch {
        // keep existing
      } finally {
        setTrendLoading(false);
      }
    },
    [gscConfigured],
  );

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'position');
    }
  };

  const handleBoostFreshness = useCallback(async (kw: RankingKeyword) => {
    setBoostingKeyword(kw.keyword);
    try {
      const res = await fetch('/api/dashboard/boost-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: kw.page, reason: 'Ranking recovery — manual boost' }),
      });
      const result = await res.json();

      if (!result.boostSuccess) {
        toast.error(`Freshness Boost fehlgeschlagen: ${result.error}`, {
          duration: 5000,
        });
      } else if (result.revalidateSuccess || result.deploySuccess) {
        // At least one invalidation method worked
        const method = result.revalidateSuccess ? 'Revalidation' : 'Rebuild';
        toast.success(`Freshness Boost eingeleitet. ${method} der Seite ${kw.page} gestartet.`, {
          duration: 5000,
        });
      } else {
        // Boost saved but no invalidation worked
        toast.warning(
          `Freshness Boost f\u00fcr ${kw.page} gespeichert, aber Cache-Invalidierung fehlgeschlagen: ${result.error || 'Weder Revalidation noch Deploy-Hook verf\u00fcgbar'}`,
          { duration: 6000 },
        );
      }
    } catch {
      toast.error('Freshness Boost fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBoostingKeyword(null);
    }
  }, []);

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    );
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* GSC Warning */}
      {!gscConfigured && (
        <div
          className="rounded-xl p-5 border border-amber-200"
          style={{ background: 'rgba(251,191,36,0.05)' }}
        >
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-amber-200"
              style={{ background: 'rgba(251,191,36,0.12)' }}>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                Google Search Console nicht verbunden
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Setze{' '}
                <code className="text-xs text-amber-600 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(251,191,36,0.08)' }}>GSC_CLIENT_EMAIL</code>,{' '}
                <code className="text-xs text-amber-600 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(251,191,36,0.08)' }}>GSC_PRIVATE_KEY</code> und{' '}
                <code className="text-xs text-amber-600 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(251,191,36,0.08)' }}>GSC_SITE_URL</code> in
                deiner <code className="text-xs text-amber-600 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(251,191,36,0.08)' }}>.env</code>.
                {serperConfigured && (
                  <span className="text-emerald-600 ml-2">
                    <CheckCircle className="h-3 w-3 inline mr-0.5" />
                    Serper.dev ist verbunden — nutze &quot;Live Pulse&quot; f\u00fcr Echtzeit-Checks.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          label="Tracked Keywords"
          value={keywords.length}
          icon={Target}
          color="violet"
        />
        <StatCard
          label="Avg. Position"
          value={stats.avgPosition > 0 ? `#${stats.avgPosition}` : '\u2014'}
          icon={BarChart3}
          color="cyan"
        />
        <StatCard
          label="Top 10"
          value={stats.top10Keywords}
          icon={Crown}
          color="amber"
          subtitle={stats.top3Keywords > 0 ? `${stats.top3Keywords} in Top 3` : undefined}
        />
        <StatCard
          label="Total Clicks"
          value={stats.totalClicks.toLocaleString('en-US')}
          icon={MousePointer}
          color="emerald"
        />
        <StatCard
          label="Impressions"
          value={stats.totalImpressions.toLocaleString('en-US')}
          icon={Eye}
          color="slate"
        />
      </div>

      {/* Position Trend Chart */}
      <GlassCard className="p-6">
        {trendLoading ? (
          <div className="h-[290px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
          </div>
        ) : (
          <PositionTrendChart data={trend} keyword={trendKeyword} />
        )}
      </GlassCard>

      {/* Keyword Matrix Table */}
      <GlassCard>
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-violet-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Keyword Rankings</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {serperConfigured
                  ? 'Click \u26a1 to pulse a keyword • Click row for GSC trend'
                  : 'Click a row to view GSC trend'}
              </p>
            </div>
          </div>
          <div className="flex-1" />

          {/* Market Filter Tabs */}
          <div className="flex items-center gap-1">
            {MARKETS.map((m) => (
              <button
                key={m.code}
                onClick={() => setMarketFilter(m.code)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all border ${
                  marketFilter === m.code
                    ? 'text-violet-600 border-violet-500/40'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'
                }`}
                style={{
                  background: marketFilter === m.code
                    ? 'rgba(139,92,246,0.06)'
                    : 'transparent',
                }}
              >
                {m.flag} {m.code === 'all' ? 'All' : m.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {serperConfigured && (
                    <th className="px-2 py-3 w-10" />
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                    Market
                  </th>
                  <th
                    className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-24"
                    onClick={() => handleSort('position')}
                  >
                    Position <SortIcon field="position" />
                  </th>
                  <th
                    className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-20"
                    onClick={() => handleSort('delta')}
                  >
                    Change <SortIcon field="delta" />
                  </th>
                  <th
                    className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-20"
                    onClick={() => handleSort('clicks')}
                  >
                    Clicks <SortIcon field="clicks" />
                  </th>
                  <th
                    className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-28"
                    onClick={() => handleSort('impressions')}
                  >
                    Impr. <SortIcon field="impressions" />
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                    CTR
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((kw) => {
                  const marketInfo = MARKETS.find((m) => m.code === kw.market);
                  const isPulsing = pulsingKeyword === kw.keyword;

                  return (
                    <tr
                      key={kw.id}
                      className="transition-colors cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                      style={{ background: isPulsing ? 'rgba(139,92,246,0.04)' : 'transparent' }}
                      onClick={() => handleKeywordClick(kw.keyword)}
                    >
                      {serperConfigured && (
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowPulse(kw.keyword, kw.market);
                            }}
                            disabled={isPulsing}
                            className="p-1 rounded hover:bg-slate-100 transition-colors disabled:opacity-50"
                            title="Echtzeit-SERP checken"
                          >
                            {isPulsing ? (
                              <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin" />
                            ) : (
                              <Radio className="h-3.5 w-3.5 text-slate-600 hover:text-violet-500" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {kw.keyword}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{kw.page}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-base" title={marketInfo?.name}>
                          {marketInfo?.flag}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <PositionBadge position={kw.currentPosition} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <DeltaBadge delta={kw.positionDelta} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm tabular-nums text-slate-700">
                          {kw.clicks > 0 ? kw.clicks.toLocaleString('en-US') : '\u2014'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm tabular-nums text-slate-500">
                          {kw.impressions > 0 ? kw.impressions.toLocaleString('en-US') : '\u2014'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-xs tabular-nums text-slate-500">
                          {kw.ctr > 0 ? `${kw.ctr}%` : '\u2014'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBoostFreshness(kw);
                          }}
                          disabled={boostingKeyword === kw.keyword}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-amber-300 text-amber-600 transition-all hover:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(251,191,36,0.08)' }}
                          title={`Freshness Boost für ${kw.page}`}
                        >
                          {boostingKeyword === kw.keyword ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                          Boost
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Search className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <p className="text-sm text-slate-400 mb-1">No keyword data yet</p>
            <p className="text-xs text-slate-600">
              {gscConfigured
                ? 'GSC data will appear after the first sync'
                : 'Use Live Pulse to check your rankings'}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Winners & Losers */}
      <GlassCard>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="font-semibold text-slate-800">Winners &amp; Losers</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pages with the biggest position changes in the last 7 days
            </p>
          </div>
        </div>
        <div className="p-6">
          <WinnersLosers winners={initialWinners} losers={initialLosers} />
        </div>
      </GlassCard>

      {/* SERP Live Pulse */}
      <GlassCard>
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Live Pulse</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {serperConfigured
                  ? 'Echtzeit-SERP Check \u2014 Ergebnisse werden automatisch in der DB gespeichert'
                  : 'Setze SERPER_API_KEY in .env f\u00fcr Live-Checks'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input
                type="text"
                value={serpKeyword}
                onChange={(e) => setSerpKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSerpPulse()}
                placeholder="Enter keyword to check SERP..."
                disabled={!serperConfigured}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all disabled:opacity-50"
              />
            </div>
            <select
              value={serpMarket}
              onChange={(e) => setSerpMarket(e.target.value as Market)}
              disabled={!serperConfigured}
              className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 disabled:opacity-50"
            >
              <option value="us">🇺🇸 US</option>
              <option value="uk">🇬🇧 UK</option>
              <option value="ca">🇨🇦 CA</option>
              <option value="au">🇦🇺 AU</option>
            </select>
            <button
              onClick={handleSerpPulse}
              disabled={serpLoading || !serpKeyword.trim() || !serperConfigured}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
              }}
            >
              {serpLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Pulse
            </button>
          </div>
        </div>

        <div className="p-6">
          <SerpPanel
            result={serpResult}
            isLoading={serpLoading}
          />
          {!serpLoading && !serpResult && (
            <div className="py-12 text-center">
              <Globe className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500 mb-1">No SERP data yet</p>
              <p className="text-xs text-slate-600">
                Enter a keyword and click &quot;Pulse&quot; to check the current Top 10
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
