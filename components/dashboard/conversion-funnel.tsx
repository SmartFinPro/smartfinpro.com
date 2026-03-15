'use client';

import { useMemo } from 'react';
import {
  MousePointerClick,
  UserPlus,
  FileCheck,
  ShieldCheck,
  Banknote,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { FunnelStage } from '@/lib/actions/funnel';

// ── Stage config ─────────────────────────────────────────────────────────────

interface StageConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const STAGE_CONFIG: Record<string, StageConfig> = {
  registration: {
    label: 'Registrations',
    icon: UserPlus,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  kyc_submitted: {
    label: 'KYC Submitted',
    icon: FileCheck,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
  },
  kyc_approved: {
    label: 'KYC Approved',
    icon: ShieldCheck,
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
  },
  ftd: {
    label: 'First Deposit',
    icon: Banknote,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  qualified: {
    label: 'Qualified',
    icon: CheckCircle2,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
};

// ── Funnel Visualization ─────────────────────────────────────────────────────

interface ConversionFunnelProps {
  totalClicks: number;
  stages: FunnelStage[];
}

export function ConversionFunnel({ totalClicks, stages }: ConversionFunnelProps) {
  const visibleStages = useMemo(
    () => stages.filter((s) => STAGE_CONFIG[s.event_type]),
    [stages],
  );

  const maxCount = totalClicks || 1;

  if (totalClicks === 0 && visibleStages.every((s) => s.unique_clicks === 0)) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <MousePointerClick className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">No funnel data yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Configure S2S postback URLs in your affiliate networks to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div
        className="h-1"
        style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
      />
      <div className="p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-6">Conversion Funnel</h3>

        {/* Vertical funnel (narrowing widths) */}
        <div className="space-y-3">
          <FunnelBar
            label="Clicks"
            count={totalClicks}
            rate={100}
            maxCount={maxCount}
            icon={MousePointerClick}
            color="text-slate-700"
            bgColor="bg-slate-50"
          />
          {visibleStages.map((stage) => {
            const config = STAGE_CONFIG[stage.event_type]!;
            return (
              <FunnelBar
                key={stage.event_type}
                label={config.label}
                count={stage.unique_clicks}
                rate={stage.conversion_rate}
                maxCount={maxCount}
                icon={config.icon}
                color={config.color}
                bgColor={config.bgColor}
                value={stage.total_value}
              />
            );
          })}
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-gray-100">
          <SummaryCard
            label="Click → Approved"
            value={
              totalClicks > 0
                ? `${((visibleStages.find((s) => s.event_type === 'approved')?.unique_clicks ?? 0) / totalClicks * 100).toFixed(2)}%`
                : '0%'
            }
            color="text-green-700"
          />
          <SummaryCard
            label="EPC (Net)"
            value={
              totalClicks > 0
                ? `$${(((visibleStages.find((s) => s.event_type === 'approved')?.total_value ?? 0)) / totalClicks).toFixed(2)}`
                : '$0.00'
            }
            color="text-emerald-700"
          />
          <SummaryCard
            label="Total Value"
            value={`$${(visibleStages.find((s) => s.event_type === 'approved')?.total_value ?? 0).toLocaleString('en-US')}`}
            color="text-slate-800"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-slate-50">
      <div className={`text-lg font-bold ${color} tabular-nums`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Funnel Bar (single stage) ────────────────────────────────────────────────

interface FunnelBarProps {
  label: string;
  count: number;
  rate: number;
  maxCount: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  value?: number;
}

function FunnelBar({ label, count, rate, maxCount, icon: Icon, color, bgColor, value }: FunnelBarProps) {
  const widthPercent = Math.max(20, (count / maxCount) * 100);

  return (
    <div className="mx-auto transition-all duration-300" style={{ width: `${widthPercent}%` }}>
      <div className={`${bgColor} rounded-xl border border-gray-100 p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
            <span className="text-sm font-medium text-slate-700">{label}</span>
          </div>
          <div className="text-right">
            <span className={`text-base font-bold ${color} tabular-nums`}>
              {count.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-slate-400 ml-2">{rate.toFixed(1)}%</span>
            {value !== undefined && value > 0 && (
              <span className="text-xs font-medium text-emerald-600 ml-2">
                ${value.toLocaleString('en-US')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Offer EV Table ───────────────────────────────────────────────────────────

interface OfferEVTableProps {
  offers: Array<{
    partner_name: string;
    market: string;
    total_clicks: number;
    registrations: number;
    ftds: number;
    approved: number;
    reversed: number;
    net_revenue: number;
    reversal_rate: number;
    expected_value: number;
  }>;
}

export function OfferEVTable({ offers }: OfferEVTableProps) {
  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">No offer data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-slate-900">Offer Expected Value</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          EV = P(approved|click) &times; avg payout &times; (1 &minus; reversal rate)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--sfp-sky)' }}>
              <th className="px-4 py-2.5 text-left font-medium text-slate-700">Offer</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-700">Mkt</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700">Clicks</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700">Reg</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700">FTD</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700">OK</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700">Rev</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700">Net $</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-700">Rev%</th>
              <th className="px-3 py-2.5 text-right font-semibold" style={{ color: 'var(--sfp-navy)' }}>EV</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o, i) => (
              <tr
                key={`${o.partner_name}-${o.market}`}
                className="border-t border-gray-50"
                style={{ background: i % 2 === 0 ? 'white' : 'var(--sfp-gray)' }}
              >
                <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">{o.partner_name}</td>
                <td className="px-3 py-2.5 text-slate-500 uppercase text-xs">{o.market}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{o.total_clicks.toLocaleString('en-US')}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{o.registrations}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{o.ftds}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{o.approved}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {o.reversed > 0
                    ? <span className="text-red-600">{o.reversed}</span>
                    : <span className="text-slate-400">0</span>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium text-emerald-700">
                  ${o.net_revenue.toLocaleString('en-US')}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {o.reversal_rate > 10
                    ? <span className="text-red-600 font-medium">{o.reversal_rate}%</span>
                    : <span className="text-slate-500">{o.reversal_rate}%</span>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold" style={{ color: 'var(--sfp-navy)' }}>
                  ${o.expected_value.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Recent Events Feed ───────────────────────────────────────────────────────

interface RecentEventsFeedProps {
  events: Array<{
    id: string;
    click_id: string;
    event_type: string;
    event_value: number | null;
    network: string | null;
    received_at: string;
    partner_name: string | null;
  }>;
}

const EVENT_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  registration: { icon: UserPlus, color: 'text-blue-500' },
  kyc_submitted: { icon: FileCheck, color: 'text-indigo-500' },
  kyc_approved: { icon: ShieldCheck, color: 'text-violet-500' },
  kyc_rejected: { icon: XCircle, color: 'text-red-400' },
  ftd: { icon: Banknote, color: 'text-amber-500' },
  qualified: { icon: CheckCircle2, color: 'text-emerald-500' },
  approved: { icon: CheckCircle2, color: 'text-green-600' },
  rejected: { icon: XCircle, color: 'text-red-500' },
  reversed: { icon: XCircle, color: 'text-red-600' },
};

export function RecentEventsFeed({ events }: RecentEventsFeedProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">No events received yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-slate-900">Recent Events</h3>
      </div>
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {events.map((e) => {
          const cfg = EVENT_ICONS[e.event_type] || { icon: CheckCircle2, color: 'text-slate-400' };
          const Icon = cfg.icon;
          const timeAgo = getTimeAgo(e.received_at);

          return (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-slate-800 capitalize">
                    {e.event_type.replace(/_/g, ' ')}
                  </span>
                  {e.partner_name && (
                    <span className="text-xs text-slate-400 truncate">{e.partner_name}</span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">{e.click_id.slice(0, 8)}…</span>
              </div>
              {e.event_value !== null && e.event_value > 0 && (
                <span className="text-sm font-semibold text-emerald-700 tabular-nums">
                  ${e.event_value.toFixed(2)}
                </span>
              )}
              <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
