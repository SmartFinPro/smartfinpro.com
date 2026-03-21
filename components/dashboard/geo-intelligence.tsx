'use client';

import { useState, useMemo, useCallback } from 'react';
import { Globe, MapPin, AlertTriangle, X, TrendingUp } from 'lucide-react';
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
    const topCountry = realCountries[0] || null;

    const unknownClicks = unknownStat?.clicks || 0;
    const unknownPct = totalClicks > 0 ? Math.round((unknownClicks / totalClicks) * 100) : 0;

    return {
      totalCountries: realCountries.length,
      realCountries,
      topCountry,
      unknownClicks,
      unknownPct,
      totalClicks,
      highUnknown: unknownPct > 30,
    };
  }, [geoStats]);

  // Map → filter bridge
  const handleMapClick = useCallback((code: string | null) => {
    setFilter(code === null ? 'all' : `country:${code}`);
  }, []);

  // Table → filter bridge
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
          <div className="flex items-center gap-3">
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
            {/* KPI badges inline */}
            <div className="hidden lg:flex items-center gap-4 text-xs">
              <span className="text-slate-500">
                <span className="font-bold text-slate-900 tabular-nums">{metrics.totalCountries}</span> countries
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                <span className="font-bold text-slate-900 tabular-nums">{metrics.totalClicks.toLocaleString()}</span> clicks
              </span>
              {metrics.unknownClicks > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className={metrics.highUnknown ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                    <span className="font-bold tabular-nums">{metrics.unknownPct}%</span> unknown
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Map — full width */}
      <div className="px-6 pt-5 pb-3">
        <WorldMap
          data={geoStats}
          activeCountry={activeCountryForMap}
          onCountryClick={handleMapClick}
        />
      </div>

      {/* Unknown Warning Banner (only when high) */}
      {metrics.highUnknown && (
        <div className="mx-6 mb-3">
          <button
            onClick={() => setFilter(filter === 'unknown' ? 'all' : 'unknown')}
            className={`w-full rounded-lg p-3 text-left transition-all ${
              filter === 'unknown'
                ? 'bg-amber-100 border-2 border-amber-400'
                : 'bg-amber-50 border border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold text-amber-700">
                High Unmapped Traffic: {metrics.unknownClicks.toLocaleString()} clicks ({metrics.unknownPct}%)
              </span>
              <span className="text-[10px] text-amber-600 ml-auto">
                Check geo-IP headers and proxy configuration
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Panel: Top Countries + Click Details */}
      <div className="border-t border-slate-100">
        <div className="grid lg:grid-cols-5 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left: Top Countries Summary + Unknown Bucket */}
          <div className="lg:col-span-2 p-5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Top Countries
            </h4>
            <div className="space-y-2">
              {metrics.realCountries.slice(0, 6).map((stat, i) => {
                const code = stat.country_code === 'UK' ? 'GB' : stat.country_code;
                const isActive = activeCountryForMap === code;
                const barWidth = metrics.totalClicks > 0
                  ? Math.max((stat.clicks / metrics.totalClicks) * 100, 3)
                  : 0;
                return (
                  <button
                    key={stat.country_code}
                    onClick={() => handleMapClick(isActive ? null : code)}
                    className={`flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-slate-100 ring-1 ring-slate-300'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-400 w-4 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-base">{getFlag(stat.country_code)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-800">{stat.country_name}</span>
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          {stat.clicks.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%`, background: 'var(--sfp-navy)' }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">
                      {stat.percentage}%
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Unknown Bucket (compact, below countries) */}
            {metrics.unknownClicks > 0 && !metrics.highUnknown && (
              <button
                onClick={() => setFilter(filter === 'unknown' ? 'all' : 'unknown')}
                className={`mt-3 w-full rounded-lg p-2.5 text-left transition-all ${
                  filter === 'unknown'
                    ? 'bg-amber-100 border-2 border-amber-400'
                    : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Unknown</span>
                  <span className="ml-auto text-xs font-bold tabular-nums text-slate-600">
                    {metrics.unknownClicks.toLocaleString()} ({metrics.unknownPct}%)
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Right: Click Details Table */}
          <div className="lg:col-span-3 p-4 max-h-[420px] overflow-y-auto">
            <ClickDetailsTable
              clicks={recentClicks}
              activeFilter={filter}
              onFilterChange={handleTableFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
