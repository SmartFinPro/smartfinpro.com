'use client';

import { Target, TrendingUp } from 'lucide-react';
import type { UTMStats } from '@/lib/actions/analytics';

interface UTMCampaignsTableProps {
  data: UTMStats[];
}

function getConversionColor(rate: number): string {
  if (rate >= 10) return 'bg-emerald-100 text-emerald-700';
  if (rate >= 5) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export function UTMCampaignsTable({ data }: UTMCampaignsTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No UTM campaign data available</p>
        <p className="text-xs mt-1">Add utm_campaign parameters to your links</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((campaign) => (
        <div
          key={campaign.campaign}
          className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-medium text-slate-800">{campaign.campaign}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  {campaign.source}
                </span>
                <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                  {campaign.medium}
                </span>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getConversionColor(campaign.conversionRate)}`}>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {campaign.conversionRate}% CTR
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Sessions</p>
              <p className="text-lg font-semibold text-slate-700">{campaign.sessions}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Clicks</p>
              <p className="text-lg font-semibold text-emerald-600">{campaign.clicks}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Conversion</p>
              <p className="text-lg font-semibold text-slate-700">{campaign.conversionRate}%</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
