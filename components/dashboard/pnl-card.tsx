// components/dashboard/pnl-card.tsx
// Profit & Loss card: Gross Revenue − API Cost = Net, with per-provider cost
// breakdown (anthropic / serper / resend) and margin. Light trust design —
// matches the revenue page stat-card styling.

import { DollarSign, Server, Wallet, Percent } from 'lucide-react';
import type { ProfitAndLoss } from '@/lib/actions/revenue';

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  serper: 'Serper',
  resend: 'Resend',
};

function usd(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PnlCard({ pnl, days = 30 }: { pnl: ProfitAndLoss; days?: number }) {
  const netPositive = pnl.netUsd >= 0;
  const netColor = netPositive ? 'var(--sfp-green)' : 'var(--sfp-red)';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Wallet className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
        <h3 className="font-semibold text-slate-900">Profit &amp; Loss</h3>
        <span className="text-xs text-slate-400 ml-auto">Last {days} days</span>
      </div>

      <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Revenue */}
        <div className="bg-white p-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
            <p className="text-sm text-slate-500">Gross Revenue</p>
          </div>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-2">
            {usd(pnl.grossRevenueUsd)}
          </p>
          <p className="text-xs text-slate-400 mt-1">approved conversions</p>
        </div>

        {/* API Cost + per-provider breakdown */}
        <div className="bg-white p-6">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
            <p className="text-sm text-slate-500">API Cost</p>
          </div>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-2">
            {usd(pnl.apiCostUsd)}
          </p>
          <div className="mt-2 space-y-0.5">
            {(['anthropic', 'serper', 'resend'] as const).map((provider) => {
              const entry = pnl.costByProvider.find((p) => p.provider === provider);
              return (
                <div key={provider} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{PROVIDER_LABELS[provider]}</span>
                  <span className="text-slate-500 tabular-nums">
                    {usd(entry?.costUsd ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Net */}
        <div className="bg-white p-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" style={{ color: netColor }} />
            <p className="text-sm text-slate-500">Net</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums mt-2" style={{ color: netColor }}>
            {usd(pnl.netUsd)}
          </p>
          <p className="text-xs text-slate-400 mt-1">revenue − API cost</p>
        </div>

        {/* Margin */}
        <div className="bg-white p-6">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4" style={{ color: netColor }} />
            <p className="text-sm text-slate-500">Margin</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums mt-2" style={{ color: netColor }}>
            {pnl.marginPct.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">net / gross revenue</p>
        </div>
      </div>
    </div>
  );
}
