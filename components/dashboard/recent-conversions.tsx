'use client';

import { Check, Clock, X } from 'lucide-react';
import type { ConversionRecord } from '@/lib/actions/revenue';

interface RecentConversionsProps {
  conversions: ConversionRecord[];
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700',
  },
  approved: {
    label: 'Approved',
    icon: Check,
    className: 'bg-emerald-50 text-emerald-700',
  },
  rejected: {
    label: 'Rejected',
    icon: X,
    className: 'bg-red-50 text-red-700',
  },
};

function formatTimeAgo(dateString: string): string {
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

export function RecentConversions({ conversions }: RecentConversionsProps) {
  if (!conversions || conversions.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        No conversions recorded yet. Conversions will appear automatically as they're tracked.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Time</th>
            <th className="text-left py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Product</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Commission</th>
            <th className="text-center py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Reference</th>
          </tr>
        </thead>
        <tbody>
          {conversions.map((conversion) => {
            const status = statusConfig[conversion.status];
            const StatusIcon = status.icon;

            return (
              <tr
                key={conversion.id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-3 text-slate-600">
                  <span title={new Date(conversion.converted_at).toLocaleString('en-US')}>
                    {formatTimeAgo(conversion.converted_at)}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {conversion.affiliate_link ? (
                    <div>
                      <span className="font-medium text-slate-900">
                        {conversion.affiliate_link.partner_name}
                      </span>
                      <span className="text-slate-400 text-xs ml-1.5">
                        /{conversion.affiliate_link.slug}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="font-semibold text-emerald-600 tabular-nums">
                    ${conversion.commission_earned.toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-xs ml-1">
                    {conversion.currency}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-400 text-xs truncate max-w-[120px]">
                  {conversion.network_reference || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
