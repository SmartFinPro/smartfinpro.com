'use client';

import { ExternalLink } from 'lucide-react';
import type { ReferrerStat } from '@/lib/actions/analytics';

interface ReferrersListProps {
  data: ReferrerStat[];
}

export function ReferrersList({ data }: ReferrersListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No referrer data available
      </div>
    );
  }

  const maxSessions = Math.max(...data.map((d) => d.sessions));

  return (
    <div className="space-y-2">
      {data.map((referrer, index) => {
        const barWidth = maxSessions > 0 ? (referrer.sessions / maxSessions) * 100 : 0;
        const isExternal = referrer.domain !== 'Direct' && !referrer.domain.includes('smartfinpro');

        return (
          <div
            key={referrer.domain}
            className="group relative p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {/* Background bar */}
            <div
              className="absolute inset-0 bg-emerald-50 rounded-lg transition-all duration-500"
              style={{ width: `${barWidth}%` }}
            />

            {/* Content */}
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-5 text-xs font-medium text-slate-400">
                  {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {referrer.domain}
                  </span>
                  {isExternal && (
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">
                  {referrer.sessions} sessions
                </span>
                <span className="text-slate-400 font-medium w-12 text-right">
                  {referrer.percentage}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
