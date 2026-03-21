'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { GeoStat } from '@/lib/actions/dashboard';
import { MAP_COLORS } from '@/lib/constants/brand-colors';

// ── Types ──────────────────────────────────────────────────────

interface WorldMapProps {
  data: GeoStat[];
  activeCountry?: string | null;
  onCountryClick?: (code: string | null) => void;
}

interface TooltipData {
  country: string;
  code: string;
  clicks: number;
  percentage: number;
  x: number;
  y: number;
}

// ── Country Paths (simplified SVG) ──────────────────────────────

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
};

// ── Flag + Color Helpers ────────────────────────────────────────

const countryFlags: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', UK: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  ES: '🇪🇸', IT: '🇮🇹', NL: '🇳🇱', AU: '🇦🇺', JP: '🇯🇵', CN: '🇨🇳',
  IN: '🇮🇳', BR: '🇧🇷', MX: '🇲🇽', KR: '🇰🇷', RU: '🇷🇺', ZA: '🇿🇦',
  AE: '🇦🇪', SG: '🇸🇬', SE: '🇸🇪', NO: '🇳🇴', PL: '🇵🇱', XX: '🌍',
};

function getFlag(code: string): string {
  return countryFlags[code] || '🌍';
}

const COLORS = {
  muted: MAP_COLORS.muted,
  land: MAP_COLORS.land,
  border: MAP_COLORS.border,
  primary: MAP_COLORS.activeDot,
  text: MAP_COLORS.text,
};

function getHeatColor(percentage: number): string {
  if (percentage === 0) return COLORS.muted;
  return MAP_COLORS.scale[
    percentage < 5 ? 0 :
    percentage < 15 ? 1 :
    percentage < 30 ? 2 :
    percentage < 50 ? 3 : 4
  ];
}

// ── Component ───────────────────────────────────────────────────

export function WorldMap({ data, activeCountry, onCountryClick }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  // Build lookup map (handle UK→GB)
  const countryData = useMemo(() => {
    const map = new Map<string, GeoStat>();
    data.forEach((stat) => {
      if (stat.country_code === 'XX') return; // Don't map Unknown
      const code = stat.country_code === 'UK' ? 'GB' : stat.country_code;
      map.set(code, stat);
    });
    return map;
  }, [data]);

  const maxClicks = useMemo(() => {
    return Math.max(...data.filter(d => d.country_code !== 'XX').map(d => d.clicks), 1);
  }, [data]);

  const hasFilter = activeCountry !== null && activeCountry !== undefined;

  const handleCountryClick = useCallback((code: string) => {
    if (!onCountryClick) return;
    // Toggle: click same country again = clear
    const normalizedActive = activeCountry === 'UK' ? 'GB' : activeCountry;
    onCountryClick(normalizedActive === code ? null : code);
  }, [onCountryClick, activeCountry]);

  const handleBackgroundClick = useCallback(() => {
    if (onCountryClick && hasFilter) {
      onCountryClick(null);
    }
  }, [onCountryClick, hasFilter]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, code: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCountryClick(code);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCountryClick?.(null);
    }
  }, [handleCountryClick, onCountryClick]);

  // Tooltip position from SVG coordinates
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGElement>, code: string, stat: GeoStat) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltip({
      country: stat.country_name,
      code: stat.country_code,
      clicks: stat.clicks,
      percentage: stat.percentage,
      x,
      y,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Keyboard escape listener on the SVG
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasFilter) {
        onCountryClick?.(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [hasFilter, onCountryClick]);

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
        No geographic data yet.
      </div>
    );
  }

  // Determine active code for highlighting (normalize UK→GB)
  const activeCode = activeCountry === 'UK' ? 'GB' : activeCountry;

  return (
    <div className="relative" ref={svgRef}>
      <svg
        viewBox="0 0 600 300"
        className="w-full h-auto"
        style={{ maxHeight: '240px' }}
        role="img"
        aria-label="World map showing click distribution by country"
      >
        {/* Ocean background — click to clear filter */}
        <rect
          width="600"
          height="300"
          fill={MAP_COLORS.ocean}
          rx="8"
          onClick={handleBackgroundClick}
          style={{ cursor: hasFilter ? 'pointer' : 'default' }}
        />

        {/* Continent outlines */}
        <g fill={COLORS.land} stroke={COLORS.border} strokeWidth="0.5" onClick={handleBackgroundClick}>
          <path d="M40,50 Q60,40 100,45 L140,55 L145,95 L130,130 L100,155 L55,155 L50,130 L55,95 L40,70 Z" />
          <path d="M100,155 L130,155 L150,165 L180,165 L185,200 L170,240 L140,260 L110,240 L105,200 L100,170 Z" />
          <path d="M240,55 Q280,45 320,50 L330,80 L310,110 L270,120 L245,115 L235,90 L240,70 Z" />
          <path d="M250,120 L310,115 L350,140 L360,180 L340,230 L300,260 L260,240 L250,200 L260,160 Z" />
          <path d="M320,45 L500,35 L540,80 L530,130 L500,160 L450,190 L400,190 L370,160 L350,130 L330,100 L320,70 Z" />
          <path d="M460,195 L550,195 L560,230 L540,265 L480,265 L465,240 Z" />
        </g>

        {/* Country paths with interaction */}
        {Object.entries(countryPaths).map(([code, { path, cx, cy }]) => {
          const stat = countryData.get(code);
          const percentage = stat ? stat.percentage : 0;
          const clicks = stat ? stat.clicks : 0;
          const isActive = activeCode === code;
          const isDimmed = hasFilter && !isActive;

          return (
            <g key={code}>
              {/* Country shape */}
              <path
                d={path}
                fill={getHeatColor(percentage)}
                stroke={isActive ? '#1B4F8C' : 'transparent'}
                strokeWidth={isActive ? 2 : 0}
                className="transition-all duration-200"
                style={{
                  cursor: stat ? 'pointer' : 'default',
                  opacity: isDimmed ? 0.35 : 1,
                  filter: isActive ? 'brightness(1.1)' : 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (stat) handleCountryClick(code);
                }}
                onMouseMove={stat ? (e) => handleMouseMove(e, code, stat) : undefined}
                onMouseLeave={stat ? handleMouseLeave : undefined}
                onKeyDown={stat ? (e) => handleKeyDown(e, code) : undefined}
                tabIndex={stat ? 0 : undefined}
                role={stat ? 'button' : undefined}
                aria-label={stat ? `${stat.country_name}: ${clicks} clicks (${percentage}%)` : undefined}
              />
              {/* Pulse dot for countries with data */}
              {stat && clicks > 0 && (
                <g style={{ opacity: isDimmed ? 0.3 : 1 }} className="transition-opacity duration-200">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={Math.min(4 + (clicks / maxClicks) * 12, 16)}
                    fill={COLORS.primary}
                    opacity={0.35}
                    className="animate-pulse"
                  />
                  <circle cx={cx} cy={cy} r={3} fill={MAP_COLORS.dotCenter} />
                </g>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(20, 260)">
          <text x="0" y="0" fill={COLORS.text} fontSize="10">Click intensity:</text>
          {MAP_COLORS.scale.map((color, i) => (
            <rect key={i} x={80 + i * 25} y={-10} width="20" height="12" fill={color} rx="2" />
          ))}
          <text x="85" y="15" fill={COLORS.text} fontSize="8">Low</text>
          <text x="175" y="15" fill={COLORS.text} fontSize="8">High</text>
        </g>
      </svg>

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-xs"
          style={{
            left: Math.min(tooltip.x + 12, (svgRef.current?.getBoundingClientRect().width ?? 400) - 160),
            top: Math.max(tooltip.y - 60, 8),
            minWidth: 140,
          }}
        >
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
            <span className="text-base">{getFlag(tooltip.code)}</span>
            <div>
              <span className="font-semibold text-slate-900">{tooltip.country}</span>
              <span className="text-slate-400 ml-1">{tooltip.code}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Clicks</span>
              <span className="font-semibold text-slate-900 tabular-nums">{tooltip.clicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Share</span>
              <span className="font-semibold text-slate-900 tabular-nums">{tooltip.percentage}%</span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
            Click to filter table
          </div>
        </div>
      )}

      {/* Top Countries Overlay */}
      <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 text-xs border border-slate-200 shadow-sm">
        <div className="font-medium text-slate-900 mb-1">Top Countries</div>
        {data
          .filter(s => s.country_code !== 'XX')
          .slice(0, 4)
          .map((stat) => {
            const code = stat.country_code === 'UK' ? 'GB' : stat.country_code;
            const isActive = activeCode === code;
            return (
              <button
                key={stat.country_code}
                onClick={() => handleCountryClick(code)}
                className={`flex items-center gap-1.5 w-full text-left px-1 py-0.5 rounded transition-colors ${
                  isActive ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                }`}
              >
                <span className="w-4">{getFlag(stat.country_code)}</span>
                <span className="text-slate-500">{stat.country_code}</span>
                <span className="font-medium text-slate-900 ml-auto tabular-nums">{stat.clicks}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
