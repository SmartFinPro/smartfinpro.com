'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Mock data for development
const topLinks = [
  { name: 'Jasper AI', clicks: 3420, conversions: 156, revenue: 4680 },
  { name: 'Perimeter 81', clicks: 2100, conversions: 12, revenue: 3600 },
  { name: 'Systeme.io', clicks: 1890, conversions: 89, revenue: 2670 },
  { name: 'NordVPN Teams', clicks: 1560, conversions: 78, revenue: 1560 },
  { name: 'Copy.ai', clicks: 1230, conversions: 67, revenue: 1340 },
];

const maxClicks = Math.max(...topLinks.map((l) => l.clicks));

export function TopLinks() {
  return (
    <div className="space-y-4">
      {topLinks.map((link) => (
        <div key={link.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{link.name}</span>
              <Badge variant="secondary" className="text-xs">
                {link.conversions} conv
              </Badge>
            </div>
            <span className="text-sm font-medium">
              ${link.revenue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={(link.clicks / maxClicks) * 100}
              className="h-2"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {link.clicks.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
