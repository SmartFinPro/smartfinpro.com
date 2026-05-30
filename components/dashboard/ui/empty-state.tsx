// components/dashboard/ui/empty-state.tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashToneIconClass, type DashTone } from './tokens';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  tone?: DashTone;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'slate',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {Icon && (
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', dashToneIconClass(tone))}>
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
