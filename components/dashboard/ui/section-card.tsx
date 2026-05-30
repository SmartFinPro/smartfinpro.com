// components/dashboard/ui/section-card.tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashToneTextClass, type DashTone } from './tokens';

export interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  /** Icon accent. Default = brand navy. */
  tone?: DashTone;
  /** Right-aligned slot in the header row. */
  actions?: React.ReactNode;
  className?: string;
  /** Body padding override. Default 'p-6'; use 'p-4' for dense tables. */
  contentClassName?: string;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  tone = 'navy',
  actions,
  className,
  contentClassName = 'p-6',
  children,
}: SectionCardProps) {
  const hasHeader = Boolean(title || actions || Icon);
  return (
    <div className={cn('dashboard-card overflow-hidden', className)}>
      {hasHeader && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          {Icon && <Icon className={cn('h-5 w-5', dashToneTextClass(tone))} />}
          {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
          {description && <span className="text-xs text-slate-400">{description}</span>}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
