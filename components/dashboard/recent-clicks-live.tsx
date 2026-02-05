'use client';

import { Badge } from '@/components/ui/badge';
import type { ClickData } from '@/lib/actions/dashboard';

const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  UK: '🇬🇧',
  GB: '🇬🇧',
  CA: '🇨🇦',
  AU: '🇦🇺',
  DE: '🇩🇪',
  FR: '🇫🇷',
  XX: '🌍',
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

interface RecentClicksLiveProps {
  clicks: ClickData[];
}

export function RecentClicksLive({ clicks }: RecentClicksLiveProps) {
  if (!clicks || clicks.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No clicks recorded yet. Visit /go/jasper-ai to test tracking.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clicks.map((click) => (
        <div
          key={click.id}
          className="flex items-center justify-between py-2 border-b last:border-0"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {countryFlags[click.country_code] || countryFlags.XX}
            </span>
            <div>
              <div className="font-medium text-sm">{click.partner_name}</div>
              <div className="text-xs text-muted-foreground">
                /go/{click.slug}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {click.utm_source && (
              <Badge variant="outline" className="text-xs">
                {click.utm_source}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {timeAgo(click.clicked_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
