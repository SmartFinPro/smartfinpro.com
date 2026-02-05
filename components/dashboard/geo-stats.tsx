'use client';

import { Progress } from '@/components/ui/progress';
import type { GeoStat } from '@/lib/actions/dashboard';

const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  UK: '🇬🇧',
  CA: '🇨🇦',
  AU: '🇦🇺',
  DE: '🇩🇪',
  FR: '🇫🇷',
  ES: '🇪🇸',
  IT: '🇮🇹',
  NL: '🇳🇱',
  BR: '🇧🇷',
  IN: '🇮🇳',
  JP: '🇯🇵',
  CN: '🇨🇳',
  KR: '🇰🇷',
  MX: '🇲🇽',
  XX: '🌍',
};

interface GeoStatsProps {
  data: GeoStat[];
}

export function GeoStats({ data }: GeoStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No geographic data yet.
      </div>
    );
  }

  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <div className="space-y-3">
      {data.map((geo) => (
        <div key={geo.country_code} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {countryFlags[geo.country_code] || '🌍'}
              </span>
              <span className="font-medium text-sm">{geo.country_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{geo.clicks}</span>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {geo.percentage}%
              </span>
            </div>
          </div>
          <Progress value={(geo.clicks / maxClicks) * 100} className="h-2" />
        </div>
      ))}
    </div>
  );
}
