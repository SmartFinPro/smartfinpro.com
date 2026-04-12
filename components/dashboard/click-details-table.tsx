'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Globe, ExternalLink, Clock, Filter, X, Eye, DollarSign } from 'lucide-react';
import type { ClickData, VisitorData, ConversionData } from '@/lib/actions/dashboard';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

// ── Types ──────────────────────────────────────────────────────

type GeoFilter = 'all' | `country:${string}` | 'unknown';
type DataSource = 'visitors' | 'clicks' | 'conversions';

interface ClickDetailsTableProps {
  clicks: ClickData[];
  visitors?: VisitorData[];
  conversions?: ConversionData[];
  dataSource?: DataSource;
  activeFilter?: GeoFilter;
  onFilterChange?: (filter: GeoFilter) => void;
}

// ── Helpers ────────────────────────────────────────────────────

const countryFlags: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', UK: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  ES: '🇪🇸', IT: '🇮🇹', NL: '🇳🇱', AU: '🇦🇺', JP: '🇯🇵', CN: '🇨🇳',
  IN: '🇮🇳', BR: '🇧🇷', MX: '🇲🇽', KR: '🇰🇷', RU: '🇷🇺', ZA: '🇿🇦',
  AE: '🇦🇪', SG: '🇸🇬', SE: '🇸🇪', NO: '🇳🇴', PL: '🇵🇱', XX: '🌍',
};

function getFlag(code: string): string {
  return countryFlags[code] || '🌍';
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    US: 'United States', GB: 'United Kingdom', UK: 'United Kingdom',
    CA: 'Canada', AU: 'Australia', DE: 'Germany', FR: 'France',
    XX: 'Unknown',
  };
  return names[code] || code;
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ── Generic row type for filtering ─────────────────────────────

interface GeoRow {
  id: string;
  country_code: string;
  country_name: string;
  timestamp: string;
}

function toGeoRows(dataSource: DataSource, clicks: ClickData[], visitors: VisitorData[], conversions: ConversionData[]): GeoRow[] {
  switch (dataSource) {
    case 'clicks':
      return clicks.map(c => ({ id: c.id, country_code: c.country_code, country_name: c.country_name, timestamp: c.clicked_at }));
    case 'visitors':
      return visitors.map(v => ({ id: v.id, country_code: v.country_code, country_name: v.country_name, timestamp: v.viewed_at }));
    case 'conversions':
      return conversions.map(c => ({ id: c.id, country_code: c.country_code, country_name: c.country_name, timestamp: c.converted_at }));
  }
}

// ── Component ──────────────────────────────────────────────────

export function ClickDetailsTable({
  clicks,
  visitors = [],
  conversions = [],
  dataSource = 'clicks',
  activeFilter,
  onFilterChange,
}: ClickDetailsTableProps) {
  const [internalFilter, setInternalFilter] = useState<GeoFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filter = activeFilter !== undefined ? activeFilter : internalFilter;

  const setFilter = useCallback((f: GeoFilter) => {
    if (onFilterChange) {
      onFilterChange(f);
    } else {
      setInternalFilter(f);
    }
  }, [onFilterChange]);

  // Unified rows for country chip counting & filtering
  const allRows = useMemo(() => toGeoRows(dataSource, clicks, visitors, conversions), [dataSource, clicks, visitors, conversions]);

  // Country stats for chips
  const countryStats = useMemo(() => {
    const stats: Record<string, { count: number; name: string }> = {};
    allRows.forEach((row) => {
      const key = row.country_code;
      if (!stats[key]) stats[key] = { count: 0, name: row.country_name };
      stats[key].count++;
    });
    return stats;
  }, [allRows]);

  const countryCodes = useMemo(() => {
    return Object.keys(countryStats).filter(c => c !== 'XX').sort();
  }, [countryStats]);

  const hasUnknown = !!countryStats['XX'];

  // Filter rows by country
  const filteredIds = useMemo(() => {
    let rows = allRows;
    if (filter === 'unknown') rows = rows.filter(r => r.country_code === 'XX');
    else if (filter.startsWith('country:')) {
      const code = filter.slice(8);
      rows = rows.filter(r => r.country_code === code || (code === 'GB' && r.country_code === 'UK'));
    }
    return new Set(rows.map(r => r.id));
  }, [allRows, filter]);

  const filteredClicks = useMemo(() => clicks.filter(c => filteredIds.has(c.id)), [clicks, filteredIds]);
  const filteredVisitors = useMemo(() => visitors.filter(v => filteredIds.has(v.id)), [visitors, filteredIds]);
  const filteredConversions = useMemo(() => conversions.filter(c => filteredIds.has(c.id)), [conversions, filteredIds]);

  const totalFiltered = dataSource === 'clicks' ? filteredClicks.length
    : dataSource === 'visitors' ? filteredVisitors.length
    : filteredConversions.length;

  const activeFilterName = useMemo(() => {
    if (filter === 'all') return null;
    if (filter === 'unknown') return 'Unknown';
    if (filter.startsWith('country:')) {
      const code = filter.slice(8);
      return `${getFlag(code)} ${getCountryName(code)}`;
    }
    return null;
  }, [filter]);

  const metricLabel = dataSource === 'clicks' ? 'clicks' : dataSource === 'visitors' ? 'visitors' : 'conversions';

  if (allRows.length === 0) {
    return (
      <WidgetErrorBoundary label="Click Details Table" minHeight="h-48">
        <div className="text-center py-8 text-slate-500 text-sm">
          No {metricLabel} data available yet.
        </div>
      </WidgetErrorBoundary>
    );
  }

  return (
    <WidgetErrorBoundary label="Click Details Table" minHeight="h-48">
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              filter === 'all'
                ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={filter === 'all' ? { background: 'var(--sfp-navy)' } : undefined}
          >
            All ({allRows.length})
          </button>
          {countryCodes.map(code => {
            const isActive = filter === `country:${code}`;
            return (
              <button
                key={code}
                onClick={() => setFilter(isActive ? 'all' : `country:${code}`)}
                className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={isActive ? { background: 'var(--sfp-navy)' } : undefined}
              >
                {getFlag(code)} {code} ({countryStats[code]?.count || 0})
              </button>
            );
          })}
          {hasUnknown && (
            <button
              onClick={() => setFilter(filter === 'unknown' ? 'all' : 'unknown')}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                filter === 'unknown'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              🌍 Unknown ({countryStats['XX']?.count || 0})
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Pill */}
      {activeFilterName && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ background: filter === 'unknown' ? '#F59E0B' : 'var(--sfp-navy)' }}>
            {activeFilterName}
            <button
              onClick={() => setFilter('all')}
              className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              aria-label="Clear filter"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
          <span className="text-[11px] text-slate-400">
            {totalFiltered} {metricLabel === 'clicks' ? `click${totalFiltered !== 1 ? 's' : ''}` : metricLabel}
          </span>
        </div>
      )}

      {/* Table */}
      {totalFiltered === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500 mb-2">
            No {metricLabel} from {activeFilterName || 'this filter'}
          </p>
          <button
            onClick={() => setFilter('all')}
            className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-slate-100"
            style={{ color: 'var(--sfp-navy)' }}
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {dataSource === 'clicks' && (
            <ClicksTable clicks={filteredClicks} expanded={expanded} setExpanded={setExpanded} />
          )}
          {dataSource === 'visitors' && (
            <VisitorsTable visitors={filteredVisitors} expanded={expanded} setExpanded={setExpanded} />
          )}
          {dataSource === 'conversions' && (
            <ConversionsTable conversions={filteredConversions} expanded={expanded} setExpanded={setExpanded} />
          )}
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>Showing {totalFiltered} of {allRows.length} {metricLabel}</span>
        <span>{countryCodes.length} countries</span>
      </div>
    </div>
    </WidgetErrorBoundary>
  );
}

// ── Clicks Sub-Table ───────────────────────────────────────────

function ClicksTable({ clicks, expanded, setExpanded }: {
  clicks: ClickData[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Time</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Country</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Product</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Source</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Referrer</th>
        </tr>
      </thead>
      <tbody>
        {clicks.map((click) => (
          <React.Fragment key={click.id}>
            <tr
              className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${
                click.country_code === 'XX' ? 'bg-amber-50/30' : ''
              }`}
              onClick={() => setExpanded(expanded === click.id ? null : click.id)}
            >
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-600" title={formatDateTime(click.clicked_at)}>
                    {formatTime(click.clicked_at)}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getFlag(click.country_code)}</span>
                  <div>
                    <span className="font-medium text-slate-900">{click.country_code}</span>
                    <span className="text-slate-400 ml-1 text-xs hidden sm:inline">
                      {click.country_name}
                    </span>
                  </div>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <span className="font-medium text-slate-800">{click.partner_name}</span>
                <span className="text-slate-400 text-xs ml-1">/{click.slug}</span>
              </td>
              <td className="py-2.5 px-3">
                {click.source_page ? (
                  <span className="text-emerald-600 text-xs bg-emerald-50 px-1.5 py-0.5 rounded">
                    {click.source_page.length > 25
                      ? click.source_page.slice(0, 25) + '...'
                      : click.source_page}
                  </span>
                ) : click.utm_source ? (
                  <span className="text-blue-600 text-xs bg-blue-50 px-1.5 py-0.5 rounded">
                    {click.utm_source}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Direct</span>
                )}
              </td>
              <td className="py-2.5 px-3">
                {click.referrer_domain ? (
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-600">{click.referrer_domain}</span>
                    {click.referrer && !click.referrer_domain.includes('smartfinpro') && (
                      <a
                        href={click.referrer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">—</span>
                )}
              </td>
            </tr>
            {expanded === click.id && (
              <tr className="bg-slate-50">
                <td colSpan={5} className="py-3 px-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Full Time</span>
                      <span className="text-slate-900 font-medium">{formatDateTime(click.clicked_at)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Country</span>
                      <span className="text-slate-900 font-medium">{click.country_name} ({click.country_code})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">UTM Source</span>
                      <span className="text-slate-900 font-medium">{click.utm_source || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Full Referrer</span>
                      <span className="text-slate-900 font-medium break-all">
                        {click.referrer ? (
                          <a
                            href={click.referrer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {click.referrer.length > 60 ? click.referrer.slice(0, 60) + '...' : click.referrer}
                          </a>
                        ) : '—'}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

// ── Visitors Sub-Table ─────────────────────────────────────────

function VisitorsTable({ visitors, expanded, setExpanded }: {
  visitors: VisitorData[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Time</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Country</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Page</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Referrer</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Engagement</th>
        </tr>
      </thead>
      <tbody>
        {visitors.map((v) => (
          <React.Fragment key={v.id}>
            <tr
              className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${
                v.country_code === 'XX' ? 'bg-amber-50/30' : ''
              }`}
              onClick={() => setExpanded(expanded === v.id ? null : v.id)}
            >
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-600" title={formatDateTime(v.viewed_at)}>
                    {formatTime(v.viewed_at)}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getFlag(v.country_code)}</span>
                  <span className="font-medium text-slate-900">{v.country_code}</span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <span className="font-medium text-slate-800" title={v.page_title || v.page_path}>
                  {v.page_path.length > 30 ? v.page_path.slice(0, 30) + '...' : v.page_path}
                </span>
              </td>
              <td className="py-2.5 px-3">
                {v.referrer_domain ? (
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-600">{v.referrer_domain}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Direct</span>
                )}
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2 text-xs">
                  {v.time_on_page ? (
                    <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {formatDuration(v.time_on_page)}
                    </span>
                  ) : null}
                  {v.scroll_depth ? (
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {v.scroll_depth}%
                    </span>
                  ) : null}
                  {!v.time_on_page && !v.scroll_depth && (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </td>
            </tr>
            {expanded === v.id && (
              <tr className="bg-slate-50">
                <td colSpan={5} className="py-3 px-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Full Time</span>
                      <span className="text-slate-900 font-medium">{formatDateTime(v.viewed_at)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Page Title</span>
                      <span className="text-slate-900 font-medium">{v.page_title || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Time on Page</span>
                      <span className="text-slate-900 font-medium">{formatDuration(v.time_on_page)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Scroll Depth</span>
                      <span className="text-slate-900 font-medium">{v.scroll_depth ? `${v.scroll_depth}%` : '—'}</span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

// ── Conversions Sub-Table ──────────────────────────────────────

function ConversionsTable({ conversions, expanded, setExpanded }: {
  conversions: ConversionData[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Time</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Country</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Product</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Commission</th>
          <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody>
        {conversions.map((conv) => {
          const statusColors: Record<string, string> = {
            approved: 'text-emerald-700 bg-emerald-50',
            pending: 'text-amber-700 bg-amber-50',
            rejected: 'text-red-700 bg-red-50',
            reversed: 'text-slate-700 bg-slate-100',
          };
          const statusClass = statusColors[conv.status] || 'text-slate-600 bg-slate-50';

          return (
            <React.Fragment key={conv.id}>
              <tr
                className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${
                  conv.country_code === 'XX' ? 'bg-amber-50/30' : ''
                }`}
                onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-600" title={formatDateTime(conv.converted_at)}>
                      {formatTime(conv.converted_at)}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getFlag(conv.country_code)}</span>
                    <span className="font-medium text-slate-900">{conv.country_code}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="font-medium text-slate-800">
                    {conv.product_name || 'Unknown Product'}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {conv.commission_earned.toFixed(2)}
                    </span>
                    <span className="text-slate-400 text-xs">{conv.currency}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusClass}`}>
                    {conv.status}
                  </span>
                </td>
              </tr>
              {expanded === conv.id && (
                <tr className="bg-slate-50">
                  <td colSpan={5} className="py-3 px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-1">Full Time</span>
                        <span className="text-slate-900 font-medium">{formatDateTime(conv.converted_at)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Country</span>
                        <span className="text-slate-900 font-medium">{conv.country_name} ({conv.country_code})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Commission</span>
                        <span className="text-slate-900 font-medium">${conv.commission_earned.toFixed(2)} {conv.currency}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Status</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusClass}`}>
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
