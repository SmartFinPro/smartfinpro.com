'use client';

import { useCallback, useMemo, useState } from 'react';
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
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileSearch,
  Loader2,
  Minus,
  MousePointer,
  Radio,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  PageKeyword,
  PageRanking,
  PageRankingRange,
  PageRankingsResult,
  PageTrendPoint,
} from '@/lib/actions/page-rankings';

// ── Constants ────────────────────────────────────────────────

const MARKETS: { code: 'all' | 'us' | 'uk' | 'ca' | 'au'; flag: string; name: string }[] = [
  { code: 'all', flag: '🌍', name: 'Alle' },
  { code: 'us', flag: '🇺🇸', name: 'US' },
  { code: 'uk', flag: '🇬🇧', name: 'UK' },
  { code: 'ca', flag: '🇨🇦', name: 'CA' },
  { code: 'au', flag: '🇦🇺', name: 'AU' },
];

const RANGES: { value: PageRankingRange; label: string }[] = [
  { value: '7d', label: '7 Tage' },
  { value: '28d', label: '28 Tage' },
  { value: '90d', label: '90 Tage' },
];

type SortKey = 'position' | 'delta' | 'clicks' | 'impressions' | 'ctr';

type TrendState = PageTrendPoint[] | 'loading' | 'error';

interface LiveCheckState {
  status: 'loading' | 'done';
  /** Live position of THIS page (null = not in top 10) */
  pagePosition: number | null;
  /** Live position of another own page ranking instead (cannibalization) */
  sitePosition: number | null;
  sitePage: string | null;
}

// ── Small UI pieces ─────────────────────────────────────────

function PositionBadge({ position }: { position: number }) {
  let cls = 'text-slate-600 bg-slate-100';
  if (position <= 3) cls = 'text-amber-700 bg-amber-100';
  else if (position <= 10) cls = 'text-emerald-700 bg-emerald-100';
  else if (position <= 20) cls = 'text-cyan-700 bg-cyan-50';

  return (
    <span className={`inline-flex items-center justify-center min-w-[2.75rem] px-2 py-0.5 rounded-md text-sm font-bold tabular-nums ${cls}`}>
      {position.toFixed(1)}
    </span>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-[11px] font-medium text-slate-400">neu</span>;
  }
  if (Math.abs(delta) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500">
        <Minus className="h-3 w-3" /> 0.0
      </span>
    );
  }
  const improved = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        improved ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {improved ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}
    </span>
  );
}

/** SEO opportunity classification for a keyword position. */
function OpportunityChip({ position }: { position: number }) {
  let label = 'Fernfeld';
  let cls = 'text-slate-500 bg-slate-100';
  if (position <= 3) {
    label = 'Top 3';
    cls = 'text-amber-700 bg-amber-100';
  } else if (position <= 10) {
    label = 'Quick Win';
    cls = 'text-emerald-700 bg-emerald-100';
  } else if (position <= 20) {
    label = 'Seite 2';
    cls = 'text-violet-700 bg-violet-100';
  }
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

/** Share of the page's visible clicks driven by this keyword. */
function ClickShareBar({ share }: { share: number }) {
  const pct = Math.min(100, Math.round(share * 100));
  return (
    <div className="flex items-center gap-1.5 min-w-[72px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

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
    <div className="rounded-xl border border-slate-200 p-5" style={{ background: c.glow }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 tabular-nums ${c.text}`}>{value}</p>
          {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200">
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = 'right',
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = activeKey === sortKey;
  return (
    <th
      className={`px-3 py-2.5 text-${align} text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${
        active ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
      }`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {active &&
          (direction === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          ))}
      </span>
    </th>
  );
}

// ── Trend chart (position over time, lower = better = up) ──

function TrendChart({ data }: { data: PageTrendPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="h-[140px] flex items-center justify-center text-xs text-slate-400">
        Zu wenige Datenpunkte für einen Verlauf.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={(d: string) => d.slice(5)}
          interval="preserveStartEnd"
        />
        <YAxis
          reversed
          domain={['dataMin - 2', 'dataMax + 2']}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name) => {
            const v = typeof value === 'number' ? value : 0;
            if (name === 'position') return [`#${v}`, 'Position'];
            return [`${v}`, name || ''];
          }}
          labelFormatter={(d) => `Datum: ${d ?? ''}`}
        />
        <Line
          type="monotone"
          dataKey="position"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Expanded row: keyword drill-down ────────────────────────

function ExpandedPanel({
  page,
  trend,
  live,
  onLiveCheck,
}: {
  page: PageRanking;
  trend: TrendState | undefined;
  live: Record<string, LiveCheckState>;
  onLiveCheck: (page: PageRanking, keyword: string) => void;
}) {
  const hiddenImpressions = Math.max(0, page.impressions - page.visibleImpressions);
  const hiddenShare =
    page.impressions > 0 ? Math.round((hiddenImpressions / page.impressions) * 100) : 0;
  const maxClicks = Math.max(1, page.visibleClicks);

  return (
    <td colSpan={9} className="px-4 py-4 bg-slate-50/60">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Keyword table */}
        <div className="xl:col-span-2 rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Keywords dieser Seite ({page.queryCount} sichtbar)
            </p>
            {hiddenShare > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] text-slate-400"
                title="Google blendet seltene Suchanfragen aus Datenschutzgründen aus (anonymisierte Queries). Dieser Anteil der Impressionen ist keinem sichtbaren Keyword zugeordnet."
              >
                <EyeOff className="h-3 w-3" />
                ~{hiddenShare}% der Impressionen anonymisiert
              </span>
            )}
          </div>
          {page.topQueries.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-400">
              Google zeigt für diese Seite keine einzelnen Suchanfragen (zu wenige oder nur
              anonymisierte Impressionen).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2 text-left font-semibold">Keyword</th>
                    <th className="px-2 py-2 text-left font-semibold">Chance</th>
                    <th className="px-2 py-2 text-right font-semibold">Position</th>
                    <th className="px-2 py-2 text-right font-semibold">Δ</th>
                    <th className="px-2 py-2 text-right font-semibold">Klicks</th>
                    <th className="px-2 py-2 text-left font-semibold">Klick-Anteil</th>
                    <th className="px-2 py-2 text-right font-semibold">Impr.</th>
                    <th className="px-2 py-2 text-right font-semibold">CTR</th>
                    <th className="px-2 py-2 text-center font-semibold" title="Live-SERP-Check via Serper.dev — prüft die echte Google-Ergebnisseite jetzt (Top 10)">
                      Live
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {page.topQueries.map((kw: PageKeyword) => {
                    const liveKey = `${page.page}|${kw.query}`;
                    const liveState = live[liveKey];
                    return (
                      <tr key={kw.query} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 max-w-[240px]">
                          <span className="text-slate-700 font-medium truncate inline-block max-w-full align-bottom" title={kw.query}>
                            {kw.query}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <OpportunityChip position={kw.position} />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <span className="tabular-nums font-bold text-slate-700">
                            {kw.position.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <DeltaBadge delta={kw.delta} />
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums font-medium text-emerald-600">
                          {kw.clicks.toLocaleString('de-DE')}
                        </td>
                        <td className="px-2 py-1.5">
                          <ClickShareBar share={kw.clicks / maxClicks} />
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">
                          {kw.impressions.toLocaleString('de-DE')}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">
                          {kw.ctr.toFixed(2)}%
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {liveState?.status === 'loading' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500 inline" />
                          ) : liveState?.status === 'done' ? (
                            liveState.pagePosition !== null ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"
                                title="Diese Seite rankt live auf dieser Position"
                              >
                                <Radio className="h-3 w-3" />#{liveState.pagePosition}
                              </span>
                            ) : liveState.sitePosition !== null ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600"
                                title={`Nicht diese Seite — ${liveState.sitePage} rankt live auf #${liveState.sitePosition} (mögliche Kannibalisierung)`}
                              >
                                ≠#{liveState.sitePosition}
                              </span>
                            ) : (
                              <span
                                className="text-[10px] text-slate-400"
                                title="Keine SmartFinPro-Seite aktuell in den Top 10 der Live-SERP"
                              >
                                &gt;10
                              </span>
                            )
                          ) : (
                            <button
                              onClick={() => onLiveCheck(page, kw.query)}
                              className="p-1 rounded hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors"
                              title={`Live-SERP-Check für "${kw.query}" (${page.market.toUpperCase()}) — prüft, ob DIESE Seite jetzt in den Top 10 rankt. 1 Serper-Abfrage`}
                            >
                              <Radio className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trend + page insights */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
              Positions-Verlauf
            </p>
            {trend === 'loading' || trend === undefined ? (
              <div className="h-[140px] flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
              </div>
            ) : trend === 'error' ? (
              <div className="h-[140px] flex items-center justify-center text-xs text-red-400">
                Verlauf konnte nicht geladen werden.
              </div>
            ) : (
              <TrendChart data={trend} />
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Seiten-Insights
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-slate-50 px-2.5 py-2">
                <p className="text-slate-400 text-[10px] uppercase">Sichtbare Keywords</p>
                <p className="font-bold text-slate-700 tabular-nums">{page.queryCount}</p>
              </div>
              <div className="rounded-md bg-slate-50 px-2.5 py-2">
                <p className="text-slate-400 text-[10px] uppercase">Anonymisiert</p>
                <p className="font-bold text-slate-700 tabular-nums">~{hiddenShare}%</p>
              </div>
              <div className="rounded-md bg-slate-50 px-2.5 py-2">
                <p className="text-slate-400 text-[10px] uppercase">Quick Wins (Pos. 4–10)</p>
                <p className="font-bold text-emerald-600 tabular-nums">
                  {page.topQueries.filter((k) => k.position > 3 && k.position <= 10).length}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 px-2.5 py-2">
                <p className="text-slate-400 text-[10px] uppercase">Seite-2-Keywords</p>
                <p className="font-bold text-violet-600 tabular-nums">
                  {page.topQueries.filter((k) => k.position > 10 && k.position <= 20).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </td>
  );
}

// ── CSV export ──────────────────────────────────────────────

function csvField(v: string | number | null): string {
  const s = v === null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function exportKeywordCsv(pages: PageRanking[], range: string) {
  const header = [
    'Seite', 'Markt', 'Seiten-Position', 'Keyword', 'Keyword-Position', 'Delta',
    'Klicks', 'Impressionen', 'CTR %',
  ].join(';');

  const rows: string[] = [];
  for (const p of pages) {
    if (p.topQueries.length === 0) {
      rows.push(
        [csvField(p.page), csvField(p.market), csvField(p.position), '', '', '',
          csvField(p.clicks), csvField(p.impressions), csvField(p.ctr)].join(';'),
      );
      continue;
    }
    for (const kw of p.topQueries) {
      rows.push(
        [csvField(p.page), csvField(p.market), csvField(p.position), csvField(kw.query),
          csvField(kw.position), csvField(kw.delta), csvField(kw.clicks),
          csvField(kw.impressions), csvField(kw.ctr)].join(';'),
      );
    }
  }

  // BOM so Excel opens umlauts correctly
  const blob = new Blob([`﻿${header}\n${rows.join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sfp-page-rankings-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ──────────────────────────────────────────

export function PageRankings({ initialData }: { initialData: PageRankingsResult }) {
  const [data, setData] = useState<PageRankingsResult>(initialData);
  const [range, setRange] = useState<PageRankingRange>(initialData.range.label);
  const [market, setMarket] = useState<'all' | 'us' | 'uk' | 'ca' | 'au'>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('clicks');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [showNoData, setShowNoData] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [trends, setTrends] = useState<Record<string, TrendState>>({});
  const [live, setLive] = useState<Record<string, LiveCheckState>>({});

  const fetchTrend = useCallback(
    async (path: string, forRange: PageRankingRange) => {
      setTrends((t) => ({ ...t, [path]: 'loading' }));
      try {
        const res = await fetch(
          `/api/dashboard/page-rankings/trend?page=${encodeURIComponent(path)}&range=${forRange}`,
          { cache: 'no-store' },
        );
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
        setTrends((t) => ({ ...t, [path]: json.trend as PageTrendPoint[] }));
      } catch {
        setTrends((t) => ({ ...t, [path]: 'error' }));
      }
    },
    [],
  );

  const toggleExpand = useCallback(
    (path: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
          if (!trends[path]) void fetchTrend(path, range);
        }
        return next;
      });
    },
    [trends, fetchTrend, range],
  );

  const liveCheck = useCallback(async (page: PageRanking, keyword: string) => {
    const key = `${page.page}|${keyword}`;
    setLive((l) => ({
      ...l,
      [key]: { status: 'loading', pagePosition: null, sitePosition: null, sitePage: null },
    }));
    try {
      const res = await fetch('/api/dashboard/page-rankings/live-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, market: page.market, page: page.page }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);

      const pagePosition = json.pagePosition as number | null;
      const sitePosition = json.sitePosition as number | null;
      const sitePage = json.sitePage as string | null;
      setLive((l) => ({ ...l, [key]: { status: 'done', pagePosition, sitePosition, sitePage } }));

      const mkt = page.market.toUpperCase();
      if (pagePosition !== null) {
        toast.success(`"${keyword}": diese Seite live auf #${pagePosition} (${mkt})`);
      } else if (sitePosition !== null) {
        toast.info(
          `"${keyword}": diese Seite nicht in den Top 10 — aber ${sitePage} rankt live auf #${sitePosition} (${mkt}, mögliche Kannibalisierung)`,
        );
      } else {
        toast.success(`"${keyword}": keine SmartFinPro-Seite in den Live-Top-10 (${mkt})`);
      }
    } catch (err) {
      setLive((l) => {
        const next = { ...l };
        delete next[key];
        return next;
      });
      toast.error(
        `Live-Check fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
      );
    }
  }, []);

  const refresh = useCallback(
    async (nextRange: PageRankingRange = range) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/page-rankings?range=${nextRange}`, {
          cache: 'no-store',
        });
        const json: PageRankingsResult = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        setData(json);
        // Trends & live checks belong to the old dataset/range
        setTrends({});
        setLive({});
        toast.success(
          `Aktualisiert — ${json.stats.ranked} Seiten mit Ranking-Daten (live aus Google Search Console)`,
        );
      } catch (err) {
        toast.error(`Aktualisierung fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      } finally {
        setLoading(false);
      }
    },
    [range],
  );

  const changeRange = (next: PageRankingRange) => {
    setRange(next);
    void refresh(next);
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Position reads best ascending; volume metrics descending
      setSortDir(key === 'position' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = data.pages;
    if (market !== 'all') rows = rows.filter((p) => p.market === market);
    if (q) {
      rows = rows.filter(
        (p) =>
          p.page.toLowerCase().includes(q) ||
          p.topQueries.some((kw) => kw.query.toLowerCase().includes(q)),
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? (sortKey === 'delta' ? -Infinity : 0);
      const bv = b[sortKey] ?? (sortKey === 'delta' ? -Infinity : 0);
      return ((av as number) - (bv as number)) * dir;
    });
  }, [data.pages, market, query, sortKey, sortDir]);

  const noDataFiltered = useMemo(
    () => (market === 'all' ? data.noDataPages : data.noDataPages.filter((p) => p.market === market)),
    [data.noDataPages, market],
  );

  const lastFetched = new Date(data.fetchedAt).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Not configured ────────────────────────────────────────
  if (!data.configured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Google Search Console ist nicht konfiguriert. Bitte <code>GSC_CLIENT_EMAIL</code>,{' '}
        <code>GSC_PRIVATE_KEY</code> und <code>GSC_SITE_URL</code> in den Umgebungsvariablen setzen.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GSC API failure — without this banner a broken integration looks like "no rankings" */}
      {data.error && (
        <div
          className="rounded-xl border border-red-200 p-4 text-sm flex items-start gap-2.5"
          style={{ background: 'rgba(214,64,69,0.05)' }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-red)' }} />
          <div>
            <p className="font-semibold text-slate-800">
              Google Search Console Fehler — es werden keine Live-Daten angezeigt
            </p>
            <p className="text-slate-500 mt-0.5 break-all font-mono text-xs">{data.error}</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Seiten im Ranking" value={data.stats.ranked} icon={FileSearch} color="violet" subtitle={`${data.range.start} – ${data.range.end}`} />
        <StatCard label="Top 3" value={data.stats.top3} icon={Trophy} color="amber" />
        <StatCard label="Top 10" value={data.stats.top10} icon={Target} color="emerald" />
        <StatCard label="Ø Position" value={data.stats.avgPosition} icon={Eye} color="cyan" subtitle="gewichtet nach Impressionen" />
        <StatCard label="Ohne Suchdaten" value={data.stats.noData} icon={MousePointer} color="slate" subtitle="in Sitemap, kein GSC-Eintrag" />
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Seite oder Keyword filtern…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Market filter */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            {MARKETS.map((m) => (
              <button
                key={m.code}
                onClick={() => setMarket(m.code)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  market === m.code
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="mr-1">{m.flag}</span>
                {m.name}
              </button>
            ))}
          </div>

          {/* Range */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => changeRange(r.value)}
                disabled={loading}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  range === r.value
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* CSV Export */}
          <button
            onClick={() => exportKeywordCsv(filtered, range)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:text-violet-600 hover:border-violet-200 disabled:opacity-50 transition-colors"
            title="Exportiert die gefilterte Ansicht inkl. aller Keywords als CSV (Excel-kompatibel)"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>

          {/* Refresh */}
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {loading ? 'Lade live von Google…' : 'Aktualisieren'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Zuletzt aktualisiert: {lastFetched} Uhr · Datenquelle: Google Search Console (Zeitraum{' '}
          {data.range.start} bis {data.range.end}, GSC-Daten haben ~3 Tage Verzögerung) · Zeile
          anklicken für Keyword-Details
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-8" />
                <th className="px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Seite ({filtered.length})
                </th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Markt
                </th>
                <SortHeader label="Position" sortKey="position" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Δ" sortKey="delta" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Top-Keyword
                </th>
                <SortHeader label="Klicks" sortKey="clicks" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Impressionen" sortKey="impressions" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="CTR" sortKey="ctr" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400 text-sm">
                    {data.pages.length === 0
                      ? 'Noch keine Ranking-Daten von Google Search Console für diesen Zeitraum.'
                      : 'Keine Seiten passen zum Filter.'}
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const isOpen = expanded.has(p.page);
                return (
                  <PageRow
                    key={p.page}
                    page={p}
                    isOpen={isOpen}
                    onToggle={() => toggleExpand(p.page)}
                    trend={trends[p.page]}
                    live={live}
                    onLiveCheck={liveCheck}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pages without search data */}
      {noDataFiltered.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowNoData((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span>
              Seiten ohne Google-Suchdaten ({noDataFiltered.length}) — in der Sitemap, aber ohne
              Impressionen im Zeitraum
            </span>
            {showNoData ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showNoData && (
            <div className="border-t border-slate-100 px-4 py-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
              {noDataFiltered.map((p) => (
                <a
                  key={p.page}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-violet-600 truncate"
                  title={p.page}
                >
                  {MARKETS.find((m) => m.code === p.market)?.flag} {p.page}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single page row (+ expanded panel) ──────────────────────

function PageRow({
  page: p,
  isOpen,
  onToggle,
  trend,
  live,
  onLiveCheck,
}: {
  page: PageRanking;
  isOpen: boolean;
  onToggle: () => void;
  trend: TrendState | undefined;
  live: Record<string, LiveCheckState>;
  onLiveCheck: (page: PageRanking, keyword: string) => void;
}) {
  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${isOpen ? 'bg-violet-50/40' : 'hover:bg-slate-50'}`}
        onClick={onToggle}
      >
        <td className="pl-3 pr-1 py-2.5 text-slate-400">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-2 py-2.5 max-w-[360px]">
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group inline-flex items-center gap-1.5 text-slate-700 hover:text-violet-600 font-medium"
            title={p.page}
          >
            <span className="truncate">{p.page}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-violet-400" />
          </a>
        </td>
        <td className="px-3 py-2.5 text-center">
          <span title={p.market.toUpperCase()}>
            {MARKETS.find((m) => m.code === p.market)?.flag}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right">
          <PositionBadge position={p.position} />
        </td>
        <td className="px-3 py-2.5 text-right">
          <DeltaBadge delta={p.delta} />
        </td>
        <td className="px-3 py-2.5 max-w-[260px]">
          {p.topQuery ? (
            <span className="text-slate-600">
              <span className="truncate inline-block max-w-[180px] align-bottom" title={p.topQuery}>
                {p.topQuery}
              </span>
              {p.topQueryPosition !== null && (
                <span className="ml-1.5 text-[11px] text-slate-400 tabular-nums">
                  #{p.topQueryPosition.toFixed(1)}
                </span>
              )}
              {p.queryCount > 1 && (
                <span className="ml-1.5 text-[10px] text-violet-500 font-medium">
                  +{p.queryCount - 1} weitere
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums font-medium text-emerald-600">
          {p.clicks.toLocaleString('de-DE')}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
          {p.impressions.toLocaleString('de-DE')}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
          {p.ctr.toFixed(2)}%
        </td>
      </tr>
      {isOpen && (
        <tr>
          <ExpandedPanel page={p} trend={trend} live={live} onLiveCheck={onLiveCheck} />
        </tr>
      )}
    </>
  );
}
