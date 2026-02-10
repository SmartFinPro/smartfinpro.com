'use client';

import { useMemo } from 'react';
import type { GeoStat } from '@/lib/actions/dashboard';

interface WorldMapProps {
  data: GeoStat[];
}

// Simplified world map paths for major countries
// These are simplified SVG paths for visualization
const countryPaths: Record<string, { path: string; cx: number; cy: number }> = {
  US: { path: 'M55,95 L130,95 L130,130 L55,130 Z', cx: 92, cy: 112 },
  CA: { path: 'M55,55 L140,55 L140,95 L55,95 Z', cx: 97, cy: 75 },
  MX: { path: 'M55,130 L100,130 L100,155 L55,155 Z', cx: 77, cy: 142 },
  BR: { path: 'M130,165 L180,165 L180,220 L130,220 Z', cx: 155, cy: 192 },
  GB: { path: 'M245,80 L260,80 L260,95 L245,95 Z', cx: 252, cy: 87 },
  DE: { path: 'M270,85 L290,85 L290,105 L270,105 Z', cx: 280, cy: 95 },
  FR: { path: 'M250,95 L275,95 L275,120 L250,120 Z', cx: 262, cy: 107 },
  ES: { path: 'M240,110 L265,110 L265,130 L240,130 Z', cx: 252, cy: 120 },
  IT: { path: 'M280,105 L300,105 L300,135 L280,135 Z', cx: 290, cy: 120 },
  NL: { path: 'M265,78 L280,78 L280,88 L265,88 Z', cx: 272, cy: 83 },
  PL: { path: 'M295,80 L320,80 L320,100 L295,100 Z', cx: 307, cy: 90 },
  SE: { path: 'M285,45 L305,45 L305,75 L285,75 Z', cx: 295, cy: 60 },
  NO: { path: 'M270,35 L290,35 L290,65 L270,65 Z', cx: 280, cy: 50 },
  RU: { path: 'M320,40 L480,40 L480,110 L320,110 Z', cx: 400, cy: 75 },
  CN: { path: 'M420,100 L500,100 L500,160 L420,160 Z', cx: 460, cy: 130 },
  JP: { path: 'M510,105 L535,105 L535,140 L510,140 Z', cx: 522, cy: 122 },
  KR: { path: 'M495,115 L515,115 L515,135 L495,135 Z', cx: 505, cy: 125 },
  IN: { path: 'M400,135 L450,135 L450,190 L400,190 Z', cx: 425, cy: 162 },
  AU: { path: 'M470,200 L550,200 L550,260 L470,260 Z', cx: 510, cy: 230 },
  ZA: { path: 'M300,220 L340,220 L340,260 L300,260 Z', cx: 320, cy: 240 },
  AE: { path: 'M365,145 L385,145 L385,160 L365,160 Z', cx: 375, cy: 152 },
  SG: { path: 'M445,175 L460,175 L460,185 L445,185 Z', cx: 452, cy: 180 },
  // Add more countries as needed
};

// Light theme color palette - blue/emerald for data visualization
const COLORS = {
  muted: '#e2e8f0', // slate-200
  land: '#f1f5f9', // slate-100
  border: '#cbd5e1', // slate-300
  primary: '#10b981', // emerald-500
  text: '#64748b', // slate-500
};

// Color scale based on intensity - emerald shades
function getColor(percentage: number): string {
  if (percentage === 0) return COLORS.muted;
  if (percentage < 5) return '#d1fae5'; // emerald-100
  if (percentage < 15) return '#a7f3d0'; // emerald-200
  if (percentage < 30) return '#6ee7b7'; // emerald-300
  if (percentage < 50) return '#34d399'; // emerald-400
  return '#10b981'; // emerald-500
}

export function WorldMap({ data }: WorldMapProps) {
  const countryData = useMemo(() => {
    const map = new Map<string, GeoStat>();
    data.forEach((stat) => {
      // Handle UK/GB mapping
      const code = stat.country_code === 'UK' ? 'GB' : stat.country_code;
      map.set(code, stat);
    });
    return map;
  }, [data]);

  const maxClicks = useMemo(() => {
    return Math.max(...data.map((d) => d.clicks), 1);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No geographic data yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox="0 0 600 300"
        className="w-full h-auto"
        style={{ maxHeight: '220px' }}
      >
        {/* Background - light blue for ocean */}
        <rect width="600" height="300" fill="#f0f9ff" rx="8" />

        {/* Continents outline (simplified) - light gray land */}
        <g fill={COLORS.land} stroke={COLORS.border} strokeWidth="0.5">
          {/* North America */}
          <path d="M40,50 Q60,40 100,45 L140,55 L145,95 L130,130 L100,155 L55,155 L50,130 L55,95 L40,70 Z" />
          {/* South America */}
          <path d="M100,155 L130,155 L150,165 L180,165 L185,200 L170,240 L140,260 L110,240 L105,200 L100,170 Z" />
          {/* Europe */}
          <path d="M240,55 Q280,45 320,50 L330,80 L310,110 L270,120 L245,115 L235,90 L240,70 Z" />
          {/* Africa */}
          <path d="M250,120 L310,115 L350,140 L360,180 L340,230 L300,260 L260,240 L250,200 L260,160 Z" />
          {/* Asia */}
          <path d="M320,45 L500,35 L540,80 L530,130 L500,160 L450,190 L400,190 L370,160 L350,130 L330,100 L320,70 Z" />
          {/* Australia */}
          <path d="M460,195 L550,195 L560,230 L540,265 L480,265 L465,240 Z" />
        </g>

        {/* Country highlights with data */}
        {Object.entries(countryPaths).map(([code, { path, cx, cy }]) => {
          const stat = countryData.get(code);
          const percentage = stat ? stat.percentage : 0;
          const clicks = stat ? stat.clicks : 0;

          return (
            <g key={code}>
              {/* Country shape */}
              <path
                d={path}
                fill={getColor(percentage)}
                className="transition-all duration-300 hover:brightness-95"
                style={{ cursor: stat ? 'pointer' : 'default' }}
              />
              {/* Click indicator dot */}
              {stat && clicks > 0 && (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={Math.min(4 + (clicks / maxClicks) * 12, 16)}
                    fill={COLORS.primary}
                    opacity={0.4}
                    className="animate-pulse"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill="#ffffff"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(20, 260)">
          <text x="0" y="0" fill={COLORS.text} fontSize="10">
            Click intensity:
          </text>
          <rect x="80" y="-10" width="20" height="12" fill="#d1fae5" rx="2" />
          <rect x="105" y="-10" width="20" height="12" fill="#a7f3d0" rx="2" />
          <rect x="130" y="-10" width="20" height="12" fill="#6ee7b7" rx="2" />
          <rect x="155" y="-10" width="20" height="12" fill="#34d399" rx="2" />
          <rect x="180" y="-10" width="20" height="12" fill="#10b981" rx="2" />
          <text x="85" y="15" fill={COLORS.text} fontSize="8">Low</text>
          <text x="175" y="15" fill={COLORS.text} fontSize="8">High</text>
        </g>
      </svg>

      {/* Top countries overlay */}
      <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 text-xs border border-slate-200 shadow-sm">
        <div className="font-medium text-slate-900 mb-1">Top Countries</div>
        {data.slice(0, 3).map((stat) => (
          <div key={stat.country_code} className="flex items-center gap-1.5">
            <span className="w-4">{getCountryFlag(stat.country_code)}</span>
            <span className="text-slate-500">{stat.country_code}</span>
            <span className="font-medium text-slate-900 ml-auto">{stat.clicks}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', UK: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
    ES: '🇪🇸', IT: '🇮🇹', NL: '🇳🇱', AU: '🇦🇺', JP: '🇯🇵', CN: '🇨🇳',
    IN: '🇮🇳', BR: '🇧🇷', MX: '🇲🇽', KR: '🇰🇷', RU: '🇷🇺', ZA: '🇿🇦',
    AE: '🇦🇪', SG: '🇸🇬', SE: '🇸🇪', NO: '🇳🇴', PL: '🇵🇱', XX: '🌍',
  };
  return flags[code] || '🌍';
}
