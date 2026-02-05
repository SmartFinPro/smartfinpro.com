'use client';

import { MousePointer, UserPlus, DollarSign, ArrowDown } from 'lucide-react';

interface ConversionFunnelProps {
  clicks: number;
  conversions: number;
  approvedConversions: number;
  approvedRevenue: number;
}

export function ConversionFunnel({
  clicks,
  conversions,
  approvedConversions,
  approvedRevenue,
}: ConversionFunnelProps) {
  // Calculate conversion rates
  const clickToConversionRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : '0.00';
  const conversionToApprovedRate = conversions > 0 ? ((approvedConversions / conversions) * 100).toFixed(1) : '0.0';

  // Calculate widths (100%, 60%, 35% roughly matching typical funnel)
  const clickWidth = 100;
  const conversionWidth = Math.max(20, Math.min(70, clicks > 0 ? (conversions / clicks) * 100 * 2 : 50));
  const approvedWidth = Math.max(15, Math.min(50, conversions > 0 ? (approvedConversions / conversions) * 100 : 35));

  // Canua-inspired color scheme
  const stages = [
    {
      name: 'Clicks',
      value: clicks.toLocaleString(),
      icon: MousePointer,
      width: clickWidth,
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      iconBg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      name: 'Conversions',
      value: conversions.toLocaleString(),
      icon: UserPlus,
      width: conversionWidth,
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      iconBg: 'bg-teal-50',
      textColor: 'text-teal-600',
      rate: clickToConversionRate,
      rateLabel: 'conversion rate',
    },
    {
      name: 'Approved',
      value: `$${approvedRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subValue: `${approvedConversions} sales`,
      icon: DollarSign,
      width: approvedWidth,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      rate: conversionToApprovedRate,
      rateLabel: 'approval rate',
    },
  ];

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <div key={stage.name}>
          {/* Rate indicator between stages */}
          {index > 0 && stage.rate && (
            <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-slate-500">
              <ArrowDown className="h-3 w-3" />
              <span>
                <span className="font-semibold text-slate-700">{stage.rate}%</span> {stage.rateLabel}
              </span>
            </div>
          )}

          {/* Funnel stage */}
          <div
            className="mx-auto transition-all duration-500"
            style={{ width: `${stage.width}%` }}
          >
            <div
              className={`relative overflow-hidden rounded-xl ${stage.bgColor} border ${stage.borderColor}`}
            >
              {/* Content */}
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${stage.iconBg}`}>
                    <stage.icon className={`h-4 w-4 ${stage.textColor}`} />
                  </div>
                  <span className="font-medium text-sm text-slate-700">{stage.name}</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${stage.textColor}`}>{stage.value}</div>
                  {stage.subValue && (
                    <div className="text-xs text-slate-500">{stage.subValue}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 mt-4">
        <div className="text-center p-3 rounded-xl bg-slate-50">
          <div className="text-xl font-bold text-emerald-600">{clickToConversionRate}%</div>
          <div className="text-xs text-slate-500 mt-0.5">Click → Sale</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-50">
          <div className="text-xl font-bold text-blue-600">
            ${clicks > 0 ? (approvedRevenue / clicks).toFixed(2) : '0.00'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">EPC (Overall)</div>
        </div>
      </div>
    </div>
  );
}
