'use client';

import { useState, useMemo, useCallback } from 'react';
import { Globe, MapPin, AlertTriangle, X } from 'lucide-react';
import type { GeoStat, ClickData } from '@/lib/actions/dashboard';
import { WorldMap } from './world-map';
import { ClickDetailsTable } from './click-details-table';

// ── Filter Type ────────────────────────────────────────────────

type GeoFilter = 'all' | `country:${string}` | 'unknown';

interface GeoIntelligenceProps {
  geoStats: GeoStat[];
  recentClicks: ClickData[];
}

// ── Country flag helper ────────────────────────────────────────

const flags: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', UK: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  ES: '🇪🇸', IT: '🇮🇹', NL: '🇳🇱', AU: '🇦🇺', JP: '🇯🇵', CN: '🇨🇳',
  IN: '🇮🇳', BR: '🇧🇷', MX: '🇲🇽', KR: '🇰🇷', RU: '🇷🇺', ZA: '🇿🇦',
  AE: '🇦🇪', SG: '🇸🇬', SE: '🇸🇪', NO: '🇳🇴', PL: '🇵🇱',
};

function getFlag(code: string): string {
  return flags[code] || '🌍';
}

// ── Component ──────────────────────────────────────────────────

export function GeoIntelligence({ geoStats, recentClicks }: GeoIntelligenceProps) {
  const [filter, setFilter] = useState<GeoFilter>('all');

  // Computed metrics
  const metrics = useMemo(() => {
    const realCountries = geoStats.filter(s => s.country_code !== 'XX');
    const unknownStat = geoStats.find(s => s.country_code === 'XX');
    const totalClicks = geoStats.reduce((sum, s) => sum + s.clicks, 0);
    const topCountry = realCountries[0] || null; // Already sorted desc by clicks

    const unknownClicks = unknownStat?.clicks || 0;
    const unknownPct = totalClicks > 0 ? Math.round((unknownClicks / totalClicks) * 100) : 0;

    return {
      totalCountries: realCountries.length,
      topCountry,
      unknownClicks,
      unknownPct,
      totalClicks,
      highUnknown: unknownPct > 30,
    };
  }, [geoStats]);

  // Map → filter bridge: WorldMap passes country code
  const handleMapClick = useCallback((code: string | null) => {
    if (code === null) {
      setFilter('all');
    } else {
      setFilter(`country:${code}`);
    }
  }, []);

  // Table → filter bridge: ClickDetailsTable passes GeoFilter
  const handleTableFilter = useCallback((f: GeoFilter) => {
    setFilter(f);
  }, []);

  // Derive map activeCountry from filter
  const activeCountryForMap = useMemo(() => {
    if (filter.startsWith('country:')) return filter.slice(8);
    return null;
  }, [filter]);

  // Active filter display name
  const filterDisplayName = useMemo(() => {
    if (filter === 'all') return null;
    if (filter === 'unknown') return 'Unknown Traffic';
    if (filter.startsWith('country:')) {
      const code = filter.slice(8);
      const stat = geoStats.find(s => s.country_code === code || (code === 'GB' && s.country_code === 'UK'));
      return stat ? `${getFlag(code)} ${stat.country_name}` : code;
    }
    return null;
  }, [filter, geoStats]);

  // Empty state
  if (!geoStats || geoStats.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Globe className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">No geographic data yet</p>
          <p className="text-xs text-slate-400">Click data will appear here once visitors interact with your links.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
              <Globe className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Geographic Intelligence</h3>
              <p className="text-[11px] text-slate-500">Click distribution and traffic origin analysis</p>
            </div>
          </div>
          {/* Active filter pill */}
          {filterDisplayName && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ background: filter === 'unknown' ? '#D97706' : 'var(--sfp-navy)' }}
            >
              {filterDisplayName}
              <button
                onClick={() => setFilter('all')}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                aria-label="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
        {/* Total Countries */}
        <div className="bg-white p-4 text-center">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Countries</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{metrics.totalCountries}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">with tracked clicks</p>
        </div>
        {/* Top Market */}
        <div className="bg-white p-4 text-center">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Top Market</p>
          {metrics.topCountry ? (
            <>
              <p className="text-xl font-bold text-slate-900 tabular-nums">
                {getFlag(metrics.topCountry.country_code)} {metrics.topCountry.country_code}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {metrics.topCountry.clicks.toLocaleString()} clicks ({metrics.topCountry.percentage}%)
              </p>
            </>
          ) : (
            <p className="text-xl font-bold text-slate-400">—</p>
          )}
        </div>
        {/* Unknown Traffic */}
        <div className={`bg-white p-4 text-center ${metrics.highUnknown ? 'ring-1 ring-inset ring-amber-200' : ''}`}>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Unknown</p>
          <p className={`text-xl font-bold tabular-nums ${metrics.highUnknown ? 'text-amber-600' : 'text-slate-900'}`}>
            {metrics.unknownPct}%
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {metrics.unknownClicks.toLocaleString()} unmapped click{metrics.unknownClicks !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Main Content: Map + Table */}
      <div className="grid lg:grid-cols-3 gap-0 divide-x divide-slate-100">
        {/* Map Panel */}
        <div className="lg:col-span-1 p-4">
          <WorldMap
            data={geoStats}
            activeCountry={activeCountryForMap}
            onCountryClick={handleMapClick}
          />

          {/* Unknown Bucket */}
          {metrics.unknownClicks > 0 && (
            <button
              onClick={() => setFilter(filter === 'unknown' ? 'all' : 'unknown')}
              className={`mt-3 w-full rounded-lg p-3 text-left transition-all ${
                filter === 'unknown'
                  ? 'bg-amber-100 border-2 border-amber-400'
                  : metrics.highUnknown
                    ? 'bg-amber-50 border border-amber-200 hover:border-amber-300'
                    : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {metrics.highUnknown ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span className={`text-xs font-semibold ${metrics.highUnknown ? 'text-amber-700' : 'text-slate-700'}`}>
                  Unmapped Traffic
                </span>
                <span className={`ml-auto text-xs font-bold tabular-nums ${metrics.highUnknown ? 'text-amber-700' : 'text-slate-700'}`}>
                  {metrics.unknownClicks.toLocaleString()} ({metrics.unknownPct}%)
                </span>
              </div>
              {metrics.highUnknown && (
                <p className="text-[10px] text-amber-600 mt-1 leading-relaxed">
                  High unknown rate — check geo-IP headers and Cloudflare proxy configuration.
                </p>
              )}
              {!metrics.highUnknown && metrics.unknownPct > 0 && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Click to filter unknown traffic
                </p>
              )}
            </button>
          )}
        </div>

        {/* Click Details Panel */}
        <div className="lg:col-span-2 p-4 max-h-[500px] overflow-y-auto">
          <ClickDetailsTable
            clicks={recentClicks}
            activeFilter={filter}
            onFilterChange={handleTableFilter}
          />
        </div>
      </div>
    </div>
  );
}
