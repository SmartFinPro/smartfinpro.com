'use client';

import { FileText, Globe, Link2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { PageStat } from '@/lib/actions/dashboard';

interface TopPagesProps {
  data: PageStat[];
}

function getPageIcon(page: string) {
  if (page === 'Direct') return <Link2 className="h-4 w-4 text-blue-500" />;
  if (page.startsWith('External:')) return <Globe className="h-4 w-4 text-green-500" />;
  return <FileText className="h-4 w-4 text-purple-500" />;
}

export function TopPages({ data }: TopPagesProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No page data yet.
      </div>
    );
  }

  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <div className="space-y-3">
      {data.map((page, index) => (
        <div key={page.page + index} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getPageIcon(page.page)}
              <span className="font-medium text-sm truncate" title={page.page}>
                {page.page}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold">{page.clicks}</span>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {page.percentage}%
              </span>
            </div>
          </div>
          <Progress value={(page.clicks / maxClicks) * 100} className="h-2" />
        </div>
      ))}
    </div>
  );
}
