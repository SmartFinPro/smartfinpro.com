// components/dashboard/ui/filter-bar.tsx
// Pure layout shell for dashboard filter controls. It does NOT own any
// state, URL params, or persistence — it only arranges whatever filter
// controls (TimeRangeSelector, SiloFilterDropdown, etc.) are passed in.
// Saved-Views logic is intentionally deferred to Sub-Project 2.
import { cn } from '@/lib/utils';

export interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {children}
    </div>
  );
}
