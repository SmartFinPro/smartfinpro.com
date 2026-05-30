'use client';

/**
 * SystemIntegrityWidget — System Health Dashboard (F-08)
 * ──────────────────────────────────────────────────────────────────
 * Shows a composite health radar, per-market page counts + live-traffic
 * indicator, cron success rate, Web-Vitals quality, and the latest
 * compliance audit.
 *
 * Data: REAL — fetched from /api/dashboard/system-integrity, which
 *       derives every figure from live sources (content files, cron_logs,
 *       web_vitals, compliance_audit_runs). No hardcoded "100%" values,
 *       no simulated re-scan. Build-time-only metrics that cannot be
 *       measured from data are intentionally omitted rather than faked.
 * Design: Light trust design (solid backgrounds, no glassmorphism).
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Activity,
  Globe,
  Bug,
  RefreshCw,
  Loader2,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

// ── Types (mirror lib/actions/system-integrity.ts) ─────────────

interface MarketStatus {
  code: string;
  flag: string;
  name: string;
  pages: number;
  receivingTraffic: boolean;
}

interface SystemIntegrityData {
  healthScore: number | null;
  totalPages: number;
  markets: MarketStatus[];
  cron: {
    windowHours: number;
    totalRuns: number;
    successRuns: number;
    failedJobs: string[];
    successRate: number | null;
    lastRunAt: string | null;
  } | null;
  vitals: {
    windowDays: number;
    samples: number;
    goodRate: number | null;
    poorRate: number | null;
  } | null;
  compliance: {
    ranAt: string | null;
    totalLinks: number;
    compliant: number;
    attention: number;
    critical: number;
  } | null;
  computedAt: string;
}

// ── Circular SVG Progress Ring ─────────────────────────────────

function HealthRadar({ score, size = 148 }: { score: number | null; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const shown = score ?? 0;
  const offset = circumference - (shown / 100) * circumference;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const strokeColor =
    score == null ? '#94a3b8' : score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';
  const label =
    score == null ? 'No data' : score >= 90 ? 'Healthy' : score >= 70 ? 'Watch' : 'Degraded';
  const labelColor =
    score == null
      ? 'text-slate-400'
      : score >= 90
        ? 'text-emerald-600'
        : score >= 70
          ? 'text-amber-600'
          : 'text-red-600';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          opacity={0.6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
          {score == null ? '—' : `${score}%`}
        </span>
        <span className={`text-[11px] font-semibold mt-0.5 uppercase tracking-wider ${labelColor}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Market Status Tile (solid, light design) ───────────────────

function MarketTile({ market }: { market: MarketStatus }) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div
      className="relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-lg leading-none">{market.flag}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-bold text-slate-900">{market.code}</span>
        <span className="block text-[11px] text-slate-500 tabular-nums">{market.pages} pages</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${market.receivingTraffic ? 'bg-emerald-500' : 'bg-slate-300'}`}
        />
        <span
          className={`text-[11px] font-semibold ${market.receivingTraffic ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          {market.receivingTraffic ? 'Live' : 'Idle'}
        </span>
      </div>
      {showTooltip && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
          {market.name} · {market.pages} pages ·{' '}
          {market.receivingTraffic ? 'traffic in last 24h' : 'no recent traffic'}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

// ── Stat Tile (solid, light design) ────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  colorScheme,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  colorScheme: 'emerald' | 'blue' | 'slate' | 'amber';
}) {
  const colors = {
    emerald: { bg: '#ecfdf5', border: 'border-emerald-200', icon: 'text-emerald-600', label: 'text-emerald-700', value: 'text-emerald-800', detail: 'text-emerald-600' },
    blue: { bg: '#eff6ff', border: 'border-blue-200', icon: 'text-blue-600', label: 'text-blue-700', value: 'text-blue-800', detail: 'text-blue-600' },
    slate: { bg: '#f8fafc', border: 'border-slate-200', icon: 'text-slate-600', label: 'text-slate-700', value: 'text-slate-800', detail: 'text-slate-500' },
    amber: { bg: '#fffbeb', border: 'border-amber-200', icon: 'text-amber-600', label: 'text-amber-700', value: 'text-amber-800', detail: 'text-amber-600' },
  } as const;
  const c = colors[colorScheme];
  return (
    <div
      className={`px-4 py-3.5 rounded-xl border ${c.border} transition-all duration-200 hover:shadow-md`}
      style={{ background: c.bg }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
        <span className={`text-xs font-semibold ${c.label}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${c.value}`}>{value}</p>
      <p className={`text-[10px] mt-0.5 font-medium ${c.detail}`}>{detail}</p>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ── Main Widget ────────────────────────────────────────────────

function SystemIntegrityInner() {
  const [data, setData] = useState<SystemIntegrityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/system-integrity', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SystemIntegrityData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalMarketPages = data?.markets.reduce((s, m) => s + m.pages, 0) ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-emerald-200" style={{ background: '#ecfdf5' }}>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">System Integrity</h3>
            <p className="text-[11px] text-slate-500">
              {data ? `Computed: ${fmtDate(data.computedAt)} · live data` : 'Loading live data…'}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="p-6">
        {/* Error state */}
        {error && !loading && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Could not load system integrity: {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div className="animate-pulse space-y-4">
            <div className="h-36 bg-slate-100 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-20 bg-slate-100 rounded-xl" />
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Top Row: Health Radar + Stats */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
              <div className="flex flex-col items-center shrink-0">
                <HealthRadar score={data.healthScore} />
                <p className="text-xs text-slate-500 mt-2.5 tabular-nums font-medium">
                  {data.totalPages} content pages live
                </p>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                <StatTile
                  icon={Clock}
                  label="Cron Success (24h)"
                  value={data.cron?.successRate != null ? `${data.cron.successRate}%` : '—'}
                  detail={
                    data.cron
                      ? `${data.cron.successRuns}/${data.cron.totalRuns} runs${data.cron.failedJobs.length ? ` · ${data.cron.failedJobs.length} job(s) failing` : ''}`
                      : 'no runs logged'
                  }
                  colorScheme={
                    data.cron?.successRate != null && data.cron.successRate < 90 ? 'amber' : 'emerald'
                  }
                />
                <StatTile
                  icon={Bug}
                  label="Web Vitals (7d)"
                  value={data.vitals?.goodRate != null ? `${data.vitals.goodRate}% good` : '—'}
                  detail={
                    data.vitals && data.vitals.samples > 0
                      ? `${data.vitals.samples} samples · ${data.vitals.poorRate}% poor`
                      : 'no RUM samples'
                  }
                  colorScheme={
                    data.vitals?.goodRate != null && data.vitals.goodRate < 75 ? 'amber' : 'blue'
                  }
                />
                <StatTile
                  icon={ShieldCheck}
                  label="Compliance"
                  value={
                    data.compliance && data.compliance.totalLinks > 0
                      ? `${data.compliance.compliant}/${data.compliance.totalLinks}`
                      : '—'
                  }
                  detail={
                    data.compliance
                      ? `${data.compliance.critical} critical · ${data.compliance.attention} attention`
                      : 'no audit run yet'
                  }
                  colorScheme={data.compliance && data.compliance.critical > 0 ? 'amber' : 'slate'}
                />
                <StatTile
                  icon={Globe}
                  label="Content Pages"
                  value={String(data.totalPages)}
                  detail={`across ${data.markets.filter((m) => m.pages > 0).length} markets`}
                  colorScheme="slate"
                />
              </div>
            </div>

            {/* Market Status Grid */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-900">Market Status</span>
                <span className="text-xs text-slate-400 ml-auto tabular-nums font-medium">
                  {totalMarketPages} pages · live = traffic in 24h
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {data.markets.map((market) => (
                  <MarketTile key={market.code} market={market} />
                ))}
              </div>
            </div>

            {/* Cron failure detail (only when something is actually failing) */}
            {data.cron && data.cron.failedJobs.length > 0 && (
              <div className="mt-5 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-800">Cron jobs reporting errors (24h):</span>
                  <span className="text-xs text-amber-700 font-medium"> {data.cron.failedJobs.join(', ')}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function SystemIntegrityWidget() {
  return (
    <WidgetErrorBoundary label="System Integrity" minHeight="h-64">
      <SystemIntegrityInner />
    </WidgetErrorBoundary>
  );
}
