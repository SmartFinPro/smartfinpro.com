'use client';

import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import type { RevenueByProduct } from '@/lib/actions/revenue';

interface RevenueByProductProps {
  products: RevenueByProduct[];
}

function TrendBadge({ trend, change }: { trend: 'up' | 'down' | 'neutral'; change: number }) {
  if (trend === 'neutral' || change === 0) {
    return <Minus className="h-3 w-3 text-slate-400" />;
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      trend === 'up' ? 'text-emerald-600' : 'text-red-500'
    }`}>
      {trend === 'up' ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {change}%
    </span>
  );
}

export function RevenueByProductTable({ products }: RevenueByProductProps) {
  if (!products || products.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        No product revenue data yet. Revenue will appear as conversions are tracked.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Product</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Revenue</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">EPC</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Clicks</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Conv.</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">CR</th>
            <th className="text-center py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Trend</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr
              key={product.linkId}
              className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
            >
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  {index < 3 && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-100 text-slate-600' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                  <div>
                    <span className="font-medium text-slate-900">{product.partnerName}</span>
                    <span className="text-slate-400 text-xs ml-1.5">/{product.slug}</span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="font-semibold text-slate-900 tabular-nums">
                  ${product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className={`font-medium tabular-nums ${
                  product.epc >= 1 ? 'text-emerald-600' :
                  product.epc >= 0.5 ? 'text-slate-700' :
                  'text-slate-400'
                }`}>
                  ${product.epc.toFixed(2)}
                </span>
              </td>
              <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                {product.clicks.toLocaleString('en-US')}
              </td>
              <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                {product.conversions}
              </td>
              <td className="py-3 px-3 text-right">
                <span className={`tabular-nums ${
                  product.conversionRate >= 5 ? 'text-emerald-600 font-medium' :
                  product.conversionRate >= 2 ? 'text-slate-700' :
                  'text-slate-400'
                }`}>
                  {product.conversionRate.toFixed(1)}%
                </span>
              </td>
              <td className="py-3 px-3 text-center">
                <TrendBadge trend={product.trend} change={product.trendChange} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
