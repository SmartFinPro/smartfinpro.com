'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  FileSearch,
  Loader2,
  Minus,
  MousePointer,
  RefreshCw,
  Search,
  Target,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  PageRanking,
  PageRankingRange,
  PageRankingsResult,
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
        (p) => p.page.toLowerCase().includes(q) || (p.topQuery ?? '').toLowerCase().includes(q),
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
          {data.range.start} bis {data.range.end}, GSC-Daten haben ~3 Tage Verzögerung)
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">
                    {data.pages.length === 0
                      ? 'Noch keine Ranking-Daten von Google Search Console für diesen Zeitraum.'
                      : 'Keine Seiten passen zum Filter.'}
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.page} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 max-w-[380px]">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
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
                        <span className="truncate inline-block max-w-[200px] align-bottom" title={p.topQuery}>
                          {p.topQuery}
                        </span>
                        {p.topQueryPosition !== null && (
                          <span className="ml-1.5 text-[11px] text-slate-400 tabular-nums">
                            #{p.topQueryPosition.toFixed(1)}
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
              ))}
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
