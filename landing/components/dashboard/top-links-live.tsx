'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp } from 'lucide-react';
import type { TopLink } from '@/lib/actions/dashboard';

const categoryColors: Record<string, string> = {
  'ai-tools': 'bg-purple-500/10 text-purple-500',
  cybersecurity: 'bg-blue-500/10 text-blue-500',
  trading: 'bg-green-500/10 text-green-500',
  forex: 'bg-yellow-500/10 text-yellow-500',
  'personal-finance': 'bg-emerald-500/10 text-emerald-500',
  'business-banking': 'bg-indigo-500/10 text-indigo-500',
  other: 'bg-gray-500/10 text-gray-500',
};

interface TopLinksLiveProps {
  links: TopLink[];
}

export function TopLinksLive({ links }: TopLinksLiveProps) {
  if (!links || links.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No links with clicks yet.
      </div>
    );
  }

  const maxClicks = Math.max(...links.map((l) => l.clicks), 1);

  return (
    <div className="space-y-4">
      {links.map((link, index) => (
        <div key={link.slug} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                #{index + 1}
              </span>
              <span className="font-medium truncate">{link.partner_name}</span>
              <Badge
                variant="secondary"
                className={`text-xs shrink-0 ${categoryColors[link.category] || categoryColors.other}`}
              >
                {link.category}
              </Badge>
            </div>
            <span className="text-sm font-bold shrink-0 ml-2">
              {link.clicks.toLocaleString('en-US')}
            </span>
          </div>

          {/* Stats row with EPC */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground">Revenue:</span>
              <span className="font-medium">${link.revenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              <span className="text-muted-foreground">EPC:</span>
              <span className={`font-bold ${parseFloat(link.epc) > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                ${link.epc}
              </span>
            </div>
            {link.conversions > 0 && (
              <div className="text-muted-foreground">
                {link.conversions} sale{link.conversions !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <Progress
            value={(link.clicks / maxClicks) * 100}
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
}
