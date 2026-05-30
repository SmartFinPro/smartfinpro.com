// components/dashboard/ui/page-header.tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashToneTextClass, type DashTone } from './tokens';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Icon accent. Default = brand navy. Override only for special cases. */
  tone?: DashTone;
  /** Right-aligned slot for buttons/filters. */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  tone = 'navy',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          {Icon && <Icon className={cn('h-6 w-6', dashToneTextClass(tone))} />}
          {title}
        </h1>
        {description && <p className="text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
