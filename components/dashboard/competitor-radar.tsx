'use client';

import { useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Target,
  Flame,
  AlertTriangle,
  Bell,
  Search,
  Loader2,
  Zap,
  Crown,
  Circle,
  ChevronDown,
  ChevronUp,
  Globe,
  Eye,
  ShieldAlert,
  TrendingDown,
  X,
  Crosshair,
  Radar,
  BarChart3,
  Radio,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Market, Category } from '@/lib/i18n/config';
import { marketCategories } from '@/lib/i18n/config';
import type {
  CompetitorDashboardData,
  SerpSnapshot,
  CompetitorAlert,
  HeatmapCell,
  CpsTrendPoint,
  SpyResult,
} from '@/lib/actions/competitors';
import {
  triggerCompetitorScan,
  spyDomain as spyDomainAction,
  dismissAlert,
  boostFromAlert,
  analyzeKeyword,
} from '@/lib/actions/competitors';
import { boostAndDeploy } from '@/lib/actions/content-overrides';

// ── Constants ────────────────────────────────────────────────

const MARKETS: { code: Market | 'all'; flag: string; name: string }[] = [
  { code: 'all', flag: '\ud83c\udf0d', name: 'All Markets' },
  { code: 'us', flag: '\ud83c\uddfa\ud83c\uddf8', name: 'US' },
  { code: 'uk', flag: '\ud83c\uddec\ud83c\udde7', name: 'UK' },
  { code: 'ca', flag: '\ud83c\udde8\ud83c\udde6', name: 'CA' },
  { code: 'au', flag: '\ud83c\udde6\ud83c\uddfa', name: 'AU' },
];

const CATEGORIES: { code: Category | 'all'; label: string }[] = [
  { code: 'all', label: 'All' },
  { code: 'trading', label: 'Trading' },
  { code: 'forex', label: 'Forex' },
  { code: 'personal-finance', label: 'Personal Finance' },
  { code: 'business-banking', label: 'Business Banking' },
  { code: 'ai-tools', label: 'AI Tools' },
  { code: 'cybersecurity', label: 'Cybersecurity' },
];

const CHART_COLORS = {
  cps: '#7c3aed',
  grid: '#e2e8f0',
  text: '#64748b',
  tooltip: { bg: '#ffffff', border: '#e2e8f0', text: '#1e293b' },
};

// ── Glass Card ──────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'violet' | 'emerald' | 'amber' | 'cyan' | 'rose';
}) {
  const colorMap = {
    violet: { text: 'text-violet-600', icon: 'text-violet-500', glow: 'rgba(139,92,246,0.08)' },
    emerald: { text: 'text-emerald-600', icon: 'text-emerald-500', glow: 'rgba(52,211,153,0.08)' },
    amber: { text: 'text-amber-600', icon: 'text-amber-500', glow: 'rgba(251,191,36,0.08)' },
    cyan: { text: 'text-cyan-600', icon: 'text-cyan-500', glow: 'rgba(34,211,238,0.08)' },
    rose: { text: 'text-rose-600', icon: 'text-rose-500', glow: 'rgba(251,113,133,0.08)' },
  };
  const c = colorMap[color];

  return (
    <div className="rounded-xl border border-slate-200 p-5" style={{ background: c.glow }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 tabular-nums ${c.text}`}>{value}</p>
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

// ── CPS Badge ───────────────────────────────────────────────

function CpsBadge({ score }: { score: number }) {
  let color: string;
  let bgColor: string;
  if (score >= 80) {
    color = 'text-emerald-600';
    bgColor = 'rgba(52,211,153,0.12)';
  } else if (score >= 60) {
    color = 'text-amber-600';
    bgColor = 'rgba(251,191,36,0.12)';
  } else if (score >= 40) {
    color = 'text-cyan-600';
    bgColor = 'rgba(34,211,238,0.12)';
  } else {
    color = 'text-slate-500';
    bgColor = 'rgba(255,255,255,0.04)';
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-bold tabular-nums px-2 py-0.5 rounded ${color}`}
      style={{ background: bgColor }}
    >
      {score.toFixed(1)}
    </span>
  );
}

// ── Position Badge (reused from ranking) ────────────────────

function PositionBadge({ position }: { position: number | null }) {
  if (position === null) {
    return (
      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
        <Minus className="h-3 w-3" /> —
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
  if (position <= 3) return <span className="text-sm tabular-nums font-bold text-amber-500">#{position}</span>;
  if (position <= 10) return <span className="text-sm tabular-nums font-semibold text-emerald-600">#{position}</span>;
  if (position <= 20) return <span className="text-sm tabular-nums font-medium text-cyan-600">#{position}</span>;
  return <span className="text-sm tabular-nums font-medium text-slate-500">#{position}</span>;
}

// ── Heatmap Cell Style ──────────────────────────────────────

function getHeatmapStyle(cps: number, disabled: boolean) {
  if (disabled) return { background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(148,163,184,0.08)' };
  if (cps >= 80) return { background: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.4)' };
  if (cps >= 60) return { background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)' };
  if (cps >= 40) return { background: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.2)' };
  if (cps > 0) return { background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.15)' };
  return { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(148,163,184,0.12)' };
}

// ── Alert Type Config ───────────────────────────────────────

function getAlertConfig(type: string) {
  switch (type) {
    case 'competitor_drop':
      return { icon: TrendingDown, label: 'Competitor Drop', color: 'text-amber-600' };
    case 'new_gap':
      return { icon: Eye, label: 'Content Gap', color: 'text-rose-600' };
    case 'authority_exit':
      return { icon: ShieldAlert, label: 'Authority Exit', color: 'text-cyan-600' };
    default:
      return { icon: AlertTriangle, label: 'Alert', color: 'text-slate-400' };
  }
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'critical':
      return { border: 'border-rose-200', bg: 'rgba(251,113,133,0.06)' };
    case 'warning':
      return { border: 'border-amber-200', bg: 'rgba(251,191,36,0.06)' };
    default:
      return { border: 'border-cyan-200', bg: 'rgba(34,211,238,0.06)' };
  }
}

// ── Main Component ──────────────────────────────────────────

interface CompetitorRadarProps {
  initialData: CompetitorDashboardData;
}

export function CompetitorRadar({ initialData }: CompetitorRadarProps) {
  const [stats] = useState(initialData.stats);
  const [top25, setTop25] = useState(initialData.top25);
  const [heatmap] = useState(initialData.heatmap);
  const [alerts, setAlerts] = useState(initialData.alerts);
  const [cpsTrend] = useState(initialData.cpsTrend);

  // Filters
  const [marketFilter, setMarketFilter] = useState<Market | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  // Table sort
  const [sortField, setSortField] = useState<'cps' | 'position' | 'authority' | 'ads'>('cps');
  const [sortAsc, setSortAsc] = useState(false);

  // Scan
  const [scanLoading, setScanLoading] = useState(false);
  const [pulsingKeyword, setPulsingKeyword] = useState<string | null>(null);

  // Boost
  const [boostingKeyword, setBoostingKeyword] = useState<string | null>(null);

  // Domain Spy
  const [spyInput, setSpyInput] = useState('');
  const [spyMarket, setSpyMarket] = useState<Market>('us');
  const [spyResults, setSpyResults] = useState<SpyResult[] | null>(null);
  const [spyLoading, setSpyLoading] = useState(false);

  // ── Filter & Sort ──────────────────────────────────────

  const filtered = top25.filter((kw) => {
    if (marketFilter !== 'all' && kw.market !== marketFilter) return false;
    if (categoryFilter !== 'all' && kw.category !== categoryFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'cps':
        cmp = a.cpsScore - b.cpsScore;
        break;
      case 'position':
        cmp = (a.ownPosition ?? 999) - (b.ownPosition ?? 999);
        break;
      case 'authority':
        cmp = a.authorityCount - b.authorityCount;
        break;
      case 'ads':
        cmp = a.adCount - b.adCount;
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  // ── Handlers ───────────────────────────────────────────

  const handleScan = useCallback(async () => {
    setScanLoading(true);
    try {
      const market = marketFilter !== 'all' ? marketFilter : undefined;
      const category = categoryFilter !== 'all' ? categoryFilter : undefined;
      const result = await triggerCompetitorScan(market, category);
      toast.success(
        `Scan abgeschlossen: ${result.scanned} Keywords analysiert, ${result.newAlerts} neue Alerts.`,
        { duration: 5000 },
      );
      // Reload page to get fresh data
      window.location.reload();
    } catch {
      toast.error('Scan fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setScanLoading(false);
    }
  }, [marketFilter, categoryFilter]);

  const handleRowPulse = useCallback(async (kw: SerpSnapshot) => {
    if (!initialData.serperConfigured) return;
    setPulsingKeyword(kw.keyword);
    try {
      const result = await analyzeKeyword(kw.keyword, kw.market, kw.category);
      if (result) {
        setTop25((prev) =>
          prev.map((k) =>
            k.keyword === kw.keyword && k.market === kw.market
              ? { ...k, cpsScore: result.cpsScore, ownPosition: result.ownPosition, organicResults: result.organicResults, adCount: result.adCount, authorityCount: result.authorityCount }
              : k,
          ),
        );
        toast.success(`${kw.keyword}: CPS ${result.cpsScore}${result.ownPosition ? `, Position #${result.ownPosition}` : ''}`);
      }
    } catch {
      // silently fail
    } finally {
      setPulsingKeyword(null);
    }
  }, [initialData.serperConfigured]);

  const handleBoost = useCallback(async (kw: SerpSnapshot) => {
    setBoostingKeyword(kw.keyword);
    const prefix = `/${kw.market}`;
    const slug = `${prefix}/${kw.category}`;
    try {
      const result = await boostAndDeploy(slug, `Competitor opportunity: ${kw.keyword}`);
      if (result.boostSuccess) {
        toast.success(`Freshness Boost eingeleitet. Revalidation der Seite ${slug} gestartet.`);
      } else {
        toast.error(`Boost fehlgeschlagen: ${result.error}`);
      }
    } catch {
      toast.error('Boost fehlgeschlagen.');
    } finally {
      setBoostingKeyword(null);
    }
  }, []);

  const handleSpy = useCallback(async () => {
    if (!spyInput.trim()) return;
    setSpyLoading(true);
    try {
      const results = await spyDomainAction(spyInput.trim(), spyMarket);
      setSpyResults(results);
      if (results.length === 0) {
        toast.info('Keine Keywords gefunden f\u00fcr diese Domain. Erst einen Scan durchf\u00fchren.');
      }
    } catch {
      toast.error('Domain Spy fehlgeschlagen.');
    } finally {
      setSpyLoading(false);
    }
  }, [spyInput, spyMarket]);

  const handleDismissAlert = useCallback(async (alertId: string) => {
    const result = await dismissAlert(alertId);
    if (result.success) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success('Alert dismissed.');
    }
  }, []);

  const handleBoostAlert = useCallback(async (alert: CompetitorAlert) => {
    const result = await boostFromAlert(alert.id);
    if (result.success) {
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, boostTriggered: true } : a)));
      toast.success(`Freshness Boost f\u00fcr "${alert.keyword}" eingeleitet.`);
    } else {
      toast.error(`Boost fehlgeschlagen: ${result.error}`);
    }
  }, []);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'position');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  // ── Heatmap Data ───────────────────────────────────────

  const heatmapMarkets: Market[] = ['us', 'uk', 'ca', 'au'];
  const heatmapCategories: Category[] = ['trading', 'forex', 'personal-finance', 'business-banking', 'ai-tools', 'cybersecurity'];

  function getHeatmapValue(market: Market, category: Category): HeatmapCell | null {
    return heatmap.find((c) => c.market === market && c.category === category) || null;
  }

  // ── CPS Trend formatted ────────────────────────────────

  const trendFormatted = cpsTrend.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Serper Warning */}
      {!initialData.serperConfigured && (
        <div className="rounded-xl p-5 border border-amber-200" style={{ background: 'rgba(251,191,36,0.05)' }}>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-amber-200" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Serper.dev nicht verbunden</h3>
              <p className="text-sm text-slate-500">
                Setze <code className="text-xs text-amber-600 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(251,191,36,0.08)' }}>SERPER_API_KEY</code> in deiner <code className="text-xs text-amber-600 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(251,191,36,0.08)' }}>.env</code> f&uuml;r Competitor Radar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Keywords Tracked" value={stats.totalKeywords} icon={Target} color="violet" />
        <StatCard label="Avg CPS" value={stats.avgCps > 0 ? stats.avgCps.toFixed(1) : '\u2014'} icon={Flame} color="amber" />
        <StatCard label="Content Gaps" value={stats.gapCount} icon={AlertTriangle} color="rose" />
        <StatCard label="Active Alerts" value={stats.alertCount} icon={Bell} color="cyan" />
      </div>

      {/* Heatmap Grid */}
      <GlassCard>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-violet-500" />
            <div>
              <h3 className="font-semibold text-slate-800">CPS Heatmap</h3>
              <p className="text-xs text-slate-500 mt-0.5">Conversion Potential Score by Market &times; Category</p>
            </div>
          </div>
          <button
            onClick={handleScan}
            disabled={scanLoading || !initialData.serperConfigured}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}
          >
            {scanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            {scanLoading ? 'Scanning...' : 'Full Scan'}
          </button>
        </div>
        <div className="p-6 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Header row */}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: '80px repeat(6, 1fr)' }}>
              <div />
              {heatmapCategories.map((cat) => (
                <div key={cat} className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center px-1 py-2">
                  {cat.replace('-', ' ').replace('ai tools', 'AI Tools')}
                </div>
              ))}

              {/* Data rows */}
              {heatmapMarkets.map((market) => {
                const marketInfo = MARKETS.find((m) => m.code === market);
                return [
                  <div key={`label-${market}`} className="flex items-center gap-1.5 text-xs font-medium text-slate-300 py-2">
                    <span>{marketInfo?.flag}</span> {market.toUpperCase()}
                  </div>,
                  ...heatmapCategories.map((cat) => {
                    const available = (marketCategories[market] as readonly string[]).includes(cat);
                    const cell = getHeatmapValue(market, cat);
                    const cps = cell?.avgCps ?? 0;
                    const style = getHeatmapStyle(cps, !available);

                    return (
                      <button
                        key={`${market}-${cat}`}
                        disabled={!available}
                        onClick={() => {
                          setMarketFilter(market);
                          setCategoryFilter(cat);
                        }}
                        className={`rounded-lg border p-2.5 text-center transition-all ${
                          available ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-30'
                        } ${
                          marketFilter === market && categoryFilter === cat
                            ? 'ring-2 ring-violet-500/50'
                            : ''
                        }`}
                        style={{ background: style.background, borderColor: style.borderColor }}
                      >
                        {available && cps > 0 ? (
                          <>
                            <p className="text-sm font-bold tabular-nums text-slate-800">{cps.toFixed(0)}</p>
                            {cell && cell.gapCount > 0 && (
                              <p className="text-[9px] text-rose-600 mt-0.5">{cell.gapCount} gaps</p>
                            )}
                          </>
                        ) : available ? (
                          <p className="text-[10px] text-slate-600">no data</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">N/A</p>
                        )}
                      </button>
                    );
                  }),
                ];
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-center">
              {[
                { label: 'CPS < 40', color: 'rgba(139,92,246,0.06)' },
                { label: '40–60', color: 'rgba(34,211,238,0.08)' },
                { label: '60–80', color: 'rgba(251,191,36,0.12)' },
                { label: '80+', color: 'rgba(52,211,153,0.15)' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <div className="w-3 h-3 rounded" style={{ background: l.color, border: '1px solid rgba(255,255,255,0.1)' }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Top 25 Keywords Table */}
      <GlassCard>
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Top Keywords by CPS</h3>
              <p className="text-xs text-slate-500 mt-0.5">Highest conversion potential — click cells in heatmap to filter</p>
            </div>
          </div>
          <div className="flex-1" />

          {/* Market Filter */}
          <div className="flex items-center gap-1">
            {MARKETS.map((m) => (
              <button
                key={m.code}
                onClick={() => setMarketFilter(m.code)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all border ${
                  marketFilter === m.code ? 'text-violet-600 border-violet-500/40' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
                style={{ background: marketFilter === m.code ? 'rgba(139,92,246,0.06)' : 'transparent' }}
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
                  {initialData.serperConfigured && <th className="px-2 py-3 w-10" />}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keyword</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Mkt</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 w-20" onClick={() => handleSort('cps')}>
                    CPS <SortIcon field="cps" />
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 w-20" onClick={() => handleSort('position')}>
                    Our Pos <SortIcon field="position" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-44">Top Competitor</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 w-16" onClick={() => handleSort('authority')}>
                    Auth <SortIcon field="authority" />
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 w-14" onClick={() => handleSort('ads')}>
                    Ads <SortIcon field="ads" />
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((kw) => {
                  const marketInfo = MARKETS.find((m) => m.code === kw.market);
                  const isPulsing = pulsingKeyword === kw.keyword;
                  const isBoosting = boostingKeyword === kw.keyword;
                  const topCompetitor = kw.organicResults.find((r) => !r.isOwnSite);

                  return (
                    <tr
                      key={`${kw.keyword}-${kw.market}`}
                      className="transition-colors border-b border-slate-100 hover:bg-slate-50"
                      style={{ background: isPulsing ? 'rgba(139,92,246,0.04)' : 'transparent' }}
                    >
                      {initialData.serperConfigured && (
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => handleRowPulse(kw)}
                            disabled={isPulsing}
                            className="p-1 rounded hover:bg-slate-100 transition-colors disabled:opacity-50"
                            title="Re-scan keyword"
                          >
                            {isPulsing ? <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin" /> : <Radio className="h-3.5 w-3.5 text-slate-600 hover:text-violet-500" />}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{kw.keyword}</p>
                          <span className="text-[10px] text-slate-500">{kw.category}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-base" title={marketInfo?.name}>{marketInfo?.flag}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <CpsBadge score={kw.cpsScore} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <PositionBadge position={kw.ownPosition} />
                      </td>
                      <td className="px-3 py-3">
                        {topCompetitor ? (
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{topCompetitor.domain}</p>
                            <p className="text-[10px] text-slate-500">#{topCompetitor.position}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">&mdash;</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-xs tabular-nums text-slate-500">{kw.authorityCount}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {kw.adCount > 0 ? (
                          <span className="text-xs tabular-nums font-medium text-amber-600">{kw.adCount}</span>
                        ) : (
                          <span className="text-xs text-slate-600">&mdash;</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleBoost(kw)}
                          disabled={isBoosting}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-amber-300 text-amber-600 transition-all hover:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(251,191,36,0.08)' }}
                          title={`Freshness Boost`}
                        >
                          {isBoosting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
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
            <Crosshair className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-400 mb-1">No competitor data yet</p>
            <p className="text-xs text-slate-600">Click &quot;Full Scan&quot; to analyze SERP landscapes</p>
          </div>
        )}
      </GlassCard>

      {/* Opportunity Alerts */}
      {alerts.length > 0 && (
        <GlassCard>
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Opportunity Alerts</h3>
              <p className="text-xs text-slate-500 mt-0.5">{alerts.length} active — competitors dropping, gaps opening</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {alerts.slice(0, 10).map((alert) => {
              const config = getAlertConfig(alert.alertType);
              const severity = getSeverityStyle(alert.severity);
              const AlertIcon = config.icon;

              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${severity.border}`}
                  style={{ background: severity.bg }}
                >
                  <AlertIcon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">{config.label}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        alert.severity === 'critical' ? 'text-rose-600 bg-rose-500/10' : alert.severity === 'warning' ? 'text-amber-600 bg-amber-500/10' : 'text-cyan-600 bg-cyan-500/10'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      <strong>{alert.keyword}</strong>
                      {alert.competitorDomain && (
                        <span className="text-slate-500"> &middot; {alert.competitorDomain}</span>
                      )}
                      {alert.previousPosition && alert.currentPosition && (
                        <span className="text-slate-500"> &middot; #{alert.previousPosition} → #{alert.currentPosition}</span>
                      )}
                    </p>
                    {alert.cpsScore && (
                      <span className="inline-flex items-center gap-1 mt-1">
                        <CpsBadge score={alert.cpsScore} />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {alert.slugToBoost && !alert.boostTriggered && (
                      <button
                        onClick={() => handleBoostAlert(alert)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded border border-amber-300 text-amber-600 hover:border-amber-500/50 transition-all"
                        style={{ background: 'rgba(251,191,36,0.08)' }}
                      >
                        <Zap className="h-2.5 w-2.5" /> Boost
                      </button>
                    )}
                    {alert.boostTriggered && (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                        <Zap className="h-2.5 w-2.5" /> Boosted
                      </span>
                    )}
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="p-1 rounded hover:bg-slate-100 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5 text-slate-600 hover:text-slate-800" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Domain Spy + CPS Trend side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Domain Spy */}
        <GlassCard>
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-violet-500" />
              <div>
                <h3 className="font-semibold text-slate-800">Domain Spy</h3>
                <p className="text-xs text-slate-500 mt-0.5">Analysiere Keywords einer Konkurrenz-Domain</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type="text"
                  value={spyInput}
                  onChange={(e) => setSpyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpy()}
                  placeholder="nerdwallet.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
                />
              </div>
              <select
                value={spyMarket}
                onChange={(e) => setSpyMarket(e.target.value as Market)}
                className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              >
                <option value="us">{'\ud83c\uddfa\ud83c\uddf8'} US</option>
                <option value="uk">{'\ud83c\uddec\ud83c\udde7'} UK</option>
                <option value="ca">{'\ud83c\udde8\ud83c\udde6'} CA</option>
                <option value="au">{'\ud83c\udde6\ud83c\uddfa'} AU</option>
              </select>
              <button
                onClick={handleSpy}
                disabled={spyLoading || !spyInput.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}
              >
                {spyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Spy
              </button>
            </div>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {spyLoading && (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 text-violet-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Scanning domain...</p>
              </div>
            )}
            {!spyLoading && spyResults && spyResults.length > 0 && (
              <div className="space-y-1.5">
                {spyResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{r.keyword}</p>
                      <p className="text-[10px] text-slate-600">{r.category}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-[10px] text-slate-500">Their: <span className="font-medium text-rose-600">#{r.theirPosition}</span></p>
                      <p className="text-[10px] text-slate-500">Ours: <span className="font-medium text-emerald-600">{r.ourPosition ? `#${r.ourPosition}` : '\u2014'}</span></p>
                    </div>
                    <CpsBadge score={r.cpsScore} />
                  </div>
                ))}
              </div>
            )}
            {!spyLoading && spyResults && spyResults.length === 0 && (
              <div className="py-8 text-center">
                <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No results. Run a Full Scan first to build data.</p>
              </div>
            )}
            {!spyLoading && !spyResults && (
              <div className="py-8 text-center">
                <Eye className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Enter a competitor domain to see their keywords</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* CPS Trend Chart */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-medium text-slate-700">CPS Trend (30 days)</p>
          </div>
          {trendFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendFormatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.cps} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.cps} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_COLORS.text }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: CHART_COLORS.text }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.tooltip.bg,
                    border: `1px solid ${CHART_COLORS.tooltip.border}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: CHART_COLORS.tooltip.text,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value) => {
                    const v = typeof value === 'number' ? value : 0;
                    return [`${v.toFixed(1)}`, 'Avg CPS'];
                  }}
                />
                <Area type="monotone" dataKey="avgCps" stroke={CHART_COLORS.cps} strokeWidth={2} fill="url(#cpsFill)" dot={{ fill: CHART_COLORS.cps, r: 2, strokeWidth: 0 }} activeDot={{ r: 4, fill: CHART_COLORS.cps }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
              No trend data — run a scan to start tracking
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
