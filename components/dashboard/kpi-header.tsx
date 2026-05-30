// components/dashboard/kpi-header.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Target,
  Cpu,
} from 'lucide-react';

// Mirrors the shape returned by /api/dashboard/kpi-summary
interface KpiSummary {
  revenueUsd: number;
  netUsd: number;
  clicks: number;
  conversions: number;
  conversionRatePct: number;
  apiCostUsd: number;
}

const ZEROS: KpiSummary = {
  revenueUsd: 0,
  netUsd: 0,
  clicks: 0,
  conversions: 0,
  conversionRatePct: 0,
  apiCostUsd: 0,
};

const REFRESH_MS = 60_000;

// ── Formatters ─────────────────────────────────────────────────

function formatCompactCurrency(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(abs < 10 && abs % 1 !== 0 ? 2 : 0)}`;
}

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}

// ── Cell ───────────────────────────────────────────────────────

interface CellProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  /** Optional small secondary value (e.g. conversion rate) */
  sub?: string;
  /** Tailwind text-color class for the value (sign-aware metrics) */
  valueClass?: string;
  /** Icon tint */
  iconColor?: string;
  /** Hide on small screens (responsive collapse) */
  hideOnMobile?: boolean;
}

function Cell({
  icon: Icon,
  label,
  value,
  sub,
  valueClass = 'text-slate-900',
  iconColor = 'var(--sfp-navy)',
  hideOnMobile = false,
}: CellProps) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 lg:px-5 min-w-0 ${
        hideOnMobile ? 'hidden sm:flex' : 'flex'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color: iconColor }} />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-none">
          {label}
        </p>
        <p className="mt-0.5 flex items-baseline gap-1.5 leading-none">
          <span className={`text-sm font-bold tabular-nums ${valueClass}`}>
            {value}
          </span>
          {sub && (
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">
              {sub}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ── Skeleton cell ──────────────────────────────────────────────

function SkeletonCell({ hideOnMobile = false }: { hideOnMobile?: boolean }) {
  return (
    <div
      className={`items-center gap-2.5 px-4 lg:px-5 ${
        hideOnMobile ? 'hidden sm:flex' : 'flex'
      }`}
    >
      <div className="h-4 w-4 shrink-0 rounded bg-slate-200 animate-pulse" />
      <div className="space-y-1">
        <div className="h-2 w-12 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────

export default function KpiHeader() {
  const [data, setData] = useState<KpiSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/dashboard/kpi-summary', {
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) setData(ZEROS);
          return;
        }
        const json = (await res.json()) as KpiSummary;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(ZEROS);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const loading = data === null;
  const netPositive = (data?.netUsd ?? 0) >= 0;

  return (
    <div className="w-full border-b border-slate-200 bg-white shrink-0">
      <div className="flex h-11 items-stretch divide-x divide-slate-100 overflow-x-auto">
        {loading ? (
          <>
            <SkeletonCell />
            <SkeletonCell />
            <SkeletonCell />
            <SkeletonCell hideOnMobile />
            <SkeletonCell hideOnMobile />
          </>
        ) : (
          <>
            {/* Revenue (30d) */}
            <Cell
              icon={Wallet}
              label="Revenue 30d"
              value={formatCompactCurrency(data!.revenueUsd)}
              iconColor="var(--sfp-green)"
            />

            {/* Net (30d) — green/red by sign */}
            <Cell
              icon={netPositive ? TrendingUp : TrendingDown}
              label="Net 30d"
              value={formatCompactCurrency(data!.netUsd)}
              valueClass={netPositive ? 'text-[var(--sfp-green)]' : 'text-[var(--sfp-red)]'}
              iconColor={netPositive ? 'var(--sfp-green)' : 'var(--sfp-red)'}
            />

            {/* Clicks */}
            <Cell
              icon={MousePointerClick}
              label="Clicks 30d"
              value={formatCompactNumber(data!.clicks)}
              iconColor="var(--sfp-navy)"
            />

            {/* Conversions (+ rate) — collapses on small screens */}
            <Cell
              icon={Target}
              label="Conversions"
              value={formatCompactNumber(data!.conversions)}
              sub={`${data!.conversionRatePct.toFixed(2)}%`}
              iconColor="var(--sfp-gold)"
              hideOnMobile
            />

            {/* API cost — collapses on small screens */}
            <Cell
              icon={Cpu}
              label="API Cost 30d"
              value={formatCompactCurrency(data!.apiCostUsd)}
              valueClass="text-slate-500"
              iconColor="var(--sfp-slate)"
              hideOnMobile
            />
          </>
        )}
      </div>
    </div>
  );
}
