// components/dashboard/ui/stat-card.tsx
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashToneIconClass, type DashTone } from './tokens';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon?: LucideIcon;
  /** Icon box accent. Default = brand navy. */
  tone?: DashTone;
  /** Optional delta badge next to the value. */
  delta?: { direction: 'up' | 'down' | 'neutral'; value: string };
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'navy',
  delta,
  className,
}: StatCardProps) {
  return (
    <div className={cn('dashboard-card p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-semibold text-slate-900 tabular-nums">{value}</p>
            {delta && delta.direction !== 'neutral' && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  delta.direction === 'up' ? 'text-emerald-600' : 'text-red-500',
                )}
              >
                {delta.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {delta.value}
              </span>
            )}
          </div>
          {subtext && <p className="text-sm text-slate-400 mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              dashToneIconClass(tone),
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
