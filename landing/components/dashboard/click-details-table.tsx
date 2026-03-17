'use client';

import React, { useState } from 'react';
import { Globe, ExternalLink, Clock, Filter, ChevronDown } from 'lucide-react';
import type { ClickData } from '@/lib/actions/dashboard';

interface ClickDetailsTableProps {
  clicks: ClickData[];
}

// Country flags
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
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ClickDetailsTable({ clicks }: ClickDetailsTableProps) {
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!clicks || clicks.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No click data available yet.
      </div>
    );
  }

  // Get unique countries for filter
  const uniqueCountries = [...new Set(clicks.map(c => c.country_code))].sort();

  // Filter clicks
  const filteredClicks = filter === 'all'
    ? clicks
    : clicks.filter(c => c.country_code === filter);

  // Group by country for summary
  const countryStats = clicks.reduce((acc, click) => {
    const key = click.country_code;
    if (!acc[key]) {
      acc[key] = { count: 0, name: click.country_name };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { count: number; name: string }>);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({clicks.length})
          </button>
          {uniqueCountries.map(code => (
            <button
              key={code}
              onClick={() => setFilter(code)}
              className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                filter === code
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {getFlag(code)} {code} ({countryStats[code]?.count || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Click Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Time</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Country</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Product</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Source</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Referrer Domain</th>
            </tr>
          </thead>
          <tbody>
            {filteredClicks.map((click) => (
              <React.Fragment key={click.id}>
                <tr
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
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
                {/* Expanded Details Row */}
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
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>
          Showing {filteredClicks.length} of {clicks.length} clicks
        </span>
        <span>
          {Object.keys(countryStats).length} countries
        </span>
      </div>
    </div>
  );
}
