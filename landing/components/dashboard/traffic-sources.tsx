'use client';

import { Globe, Search, Mail, Share2 } from 'lucide-react';
import type { TrafficSource } from '@/lib/actions/analytics';

interface TrafficSourcesProps {
  data: TrafficSource[];
}

const sourceIcons: Record<string, typeof Globe> = {
  Google: Search,
  Bing: Search,
  Yahoo: Search,
  DuckDuckGo: Search,
  Email: Mail,
  Facebook: Share2,
  'Twitter/X': Share2,
  LinkedIn: Share2,
  Reddit: Share2,
};

const sourceColors: Record<string, string> = {
  Google: 'bg-blue-50 text-blue-500',
  Bing: 'bg-teal-50 text-teal-500',
  Direct: 'bg-slate-100 text-slate-500',
  Email: 'bg-amber-50 text-amber-500',
  Facebook: 'bg-indigo-50 text-indigo-500',
  'Twitter/X': 'bg-sky-50 text-sky-500',
  LinkedIn: 'bg-blue-50 text-blue-600',
  Reddit: 'bg-orange-50 text-orange-500',
};

export function TrafficSources({ data }: TrafficSourcesProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No traffic source data available
      </div>
    );
  }

  const maxSessions = Math.max(...data.map((d) => d.sessions));

  return (
    <div className="space-y-3">
      {data.map((source) => {
        const Icon = sourceIcons[source.source] || Globe;
        const colorClass = sourceColors[source.source] || 'bg-slate-100 text-slate-500';
        const barWidth = maxSessions > 0 ? (source.sessions / maxSessions) * 100 : 0;

        return (
          <div key={source.source} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium text-slate-700">{source.source}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">{source.sessions} sessions</span>
                <span className="text-slate-400 font-medium">{source.percentage}%</span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
