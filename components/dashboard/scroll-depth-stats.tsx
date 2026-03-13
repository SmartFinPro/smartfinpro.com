'use client';

import type { ScrollDepthStat } from '@/lib/actions/dashboard';
import { Progress } from '@/components/ui/progress';

interface ScrollDepthStatsProps {
  data: ScrollDepthStat[];
  averageScrollDepth: number;
}

export function ScrollDepthStats({ data, averageScrollDepth }: ScrollDepthStatsProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <p>No scroll data available yet</p>
        <p className="text-xs">Scroll tracking requires page views</p>
      </div>
    );
  }

  // Get color based on scroll depth percentage
  const getDepthColor = (depth: number): string => {
    if (depth >= 80) return 'bg-green-500';
    if (depth >= 60) return 'bg-emerald-500';
    if (depth >= 40) return 'bg-yellow-500';
    if (depth >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Format page path for display
  const formatPagePath = (stat: ScrollDepthStat): string => {
    if (stat.page_title) {
      // Truncate title if too long
      return stat.page_title.length > 40
        ? stat.page_title.slice(0, 37) + '...'
        : stat.page_title;
    }
    if (stat.article_slug) {
      return stat.article_slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return stat.page_path;
  };

  return (
    <div className="space-y-4">
      {/* Overall Average */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium">Overall Average</span>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getDepthColor(averageScrollDepth)}`} />
          <span className="text-lg font-bold">{averageScrollDepth}%</span>
        </div>
      </div>

      {/* Per-Page Stats */}
      <div className="space-y-3">
        {data.map((stat) => (
          <div key={stat.page_path} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate max-w-[200px]" title={stat.page_path}>
                {formatPagePath(stat)}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">{stat.view_count} views</span>
                <span className="font-semibold text-foreground">{stat.avg_scroll_depth}%</span>
              </div>
            </div>
            <Progress value={stat.avg_scroll_depth} className="h-2" />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Low (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>High (&gt;80%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
