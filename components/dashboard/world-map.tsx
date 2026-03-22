'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, createCoordinates } from '@vnedyalk0v/react19-simple-maps';
import type { GeoStat } from '@/lib/actions/dashboard';
import { MAP_COLORS } from '@/lib/constants/brand-colors';

// ── Types ──────────────────────────────────────────────────────

interface WorldMapProps {
  data: GeoStat[];
  activeCountry?: string | null;
  onCountryClick?: (code: string | null) => void;
  metricLabel?: string;
}

interface TooltipData {
  country: string;
  code: string;
  clicks: number;
  percentage: number;
  x: number;
  y: number;
}

// ── ISO 3166-1 Numeric → Alpha-2 Mapper ────────────────────────
// world-atlas uses numeric IDs; our GeoStats use alpha-2 codes

const numericToAlpha2: Record<string, string> = {
  '840': 'US', '826': 'GB', '124': 'CA', '036': 'AU',
  '276': 'DE', '250': 'FR', '724': 'ES', '380': 'IT',
  '528': 'NL', '076': 'BR', '356': 'IN', '392': 'JP',
  '156': 'CN', '410': 'KR', '484': 'MX', '643': 'RU',
  '710': 'ZA', '784': 'AE', '702': 'SG', '752': 'SE',
  '578': 'NO', '616': 'PL', '056': 'BE', '040': 'AT',
  '756': 'CH', '372': 'IE', '208': 'DK', '246': 'FI',
  '554': 'NZ', '764': 'TH', '608': 'PH', '360': 'ID',
  '458': 'MY', '704': 'VN', '818': 'EG', '566': 'NG',
  '404': 'KE', '032': 'AR', '152': 'CL', '170': 'CO',
  '604': 'PE', '792': 'TR', '682': 'SA', '376': 'IL',
  '620': 'PT', '203': 'CZ', '348': 'HU', '642': 'RO',
  '804': 'UA', '300': 'GR',
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

function getHeatColor(percentage: number): string {
  if (percentage === 0) return MAP_COLORS.muted;
  return MAP_COLORS.scale[
    percentage < 5 ? 0 :
    percentage < 15 ? 1 :
    percentage < 30 ? 2 :
    percentage < 50 ? 3 : 4
  ];
}

// ── TopoJSON (local, no CDN fetch) ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const geoData = require('world-atlas/countries-110m.json');

// ── Component ───────────────────────────────────────────────────

export function WorldMap({ data, activeCountry, onCountryClick, metricLabel = 'clicks' }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build lookup map (handle UK→GB)
  const countryData = useMemo(() => {
    const map = new Map<string, GeoStat>();
    data.forEach((stat) => {
      if (stat.country_code === 'XX') return;
      const code = stat.country_code === 'UK' ? 'GB' : stat.country_code;
      map.set(code, stat);
    });
    return map;
  }, [data]);

  const hasFilter = activeCountry !== null && activeCountry !== undefined;
  const activeCode = activeCountry === 'UK' ? 'GB' : activeCountry;

  const handleCountryClick = useCallback((code: string) => {
    if (!onCountryClick) return;
    const normalizedActive = activeCountry === 'UK' ? 'GB' : activeCountry;
    onCountryClick(normalizedActive === code ? null : code);
  }, [onCountryClick, activeCountry]);

  const handleBackgroundClick = useCallback(() => {
    if (onCountryClick && hasFilter) {
      onCountryClick(null);
    }
  }, [onCountryClick, hasFilter]);

  const handleMouseEnter = useCallback((evt: React.MouseEvent, code: string, stat: GeoStat) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      country: stat.country_name,
      code: stat.country_code,
      clicks: stat.clicks,
      percentage: stat.percentage,
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, code: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCountryClick(code);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCountryClick?.(null);
    }
  }, [handleCountryClick, onCountryClick]);

  // Global Escape listener
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasFilter) onCountryClick?.(null);
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

  return (
    <div className="relative" ref={containerRef}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 140, center: createCoordinates(10, 5) }}
        width={800}
        height={420}
        style={{ width: '100%', height: 'auto', maxHeight: '360px' }}
      >
        {/* Background rect for ocean color */}
        <rect width={800} height={420} fill={MAP_COLORS.ocean} />

        <ZoomableGroup
          zoom={zoom}
          onMoveEnd={(position) => setZoom(position.zoom)}
          minZoom={1}
          maxZoom={8}
          center={createCoordinates(10, 5)}
        >
        <Geographies geography={geoData}>
          {({ geographies }: { geographies: Array<{ rsmKey: string; id: string; properties: { name: string }; [key: string]: unknown }> }) =>
            geographies.map((geo, idx) => {
              const geoKey = geo.rsmKey || `geo-${geo.id}-${idx}`;
              const alpha2 = numericToAlpha2[geo.id];
              if (!alpha2) {
                // Country not in our mapper — render as neutral land
                return (
                  <Geography
                    key={geoKey}
                    geography={geo}
                    fill={MAP_COLORS.land}
                    stroke={MAP_COLORS.border}
                    strokeWidth={0.3}
                    style={{
                      default: { outline: 'none', opacity: hasFilter ? 0.3 : 1 },
                      hover: { outline: 'none', opacity: hasFilter ? 0.4 : 1, fill: '#e8ecf1' },
                      pressed: { outline: 'none' },
                    }}
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleBackgroundClick(); }}
                  />
                );
              }

              const stat = countryData.get(alpha2);
              const isActive = activeCode === alpha2;
              const isDimmed = hasFilter && !isActive;

              return (
                <Geography
                  key={geoKey}
                  geography={geo}
                  fill={stat ? getHeatColor(stat.percentage) : MAP_COLORS.land}
                  stroke={isActive ? '#1B4F8C' : MAP_COLORS.border}
                  strokeWidth={isActive ? 1.5 : 0.3}
                  style={{
                    default: {
                      outline: 'none',
                      opacity: isDimmed ? 0.3 : 1,
                      transition: 'all 200ms ease',
                    },
                    hover: {
                      outline: 'none',
                      opacity: 1,
                      fill: stat ? getHeatColor(Math.min(stat.percentage + 10, 100)) : '#e8ecf1',
                      cursor: stat ? 'pointer' : 'default',
                      transition: 'all 150ms ease',
                    },
                    pressed: { outline: 'none' },
                  }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (stat) handleCountryClick(alpha2);
                    else handleBackgroundClick();
                  }}
                  onMouseEnter={stat ? (e: React.MouseEvent) => handleMouseEnter(e, alpha2, stat) : undefined}
                  onMouseLeave={stat ? handleMouseLeave : undefined}
                  onKeyDown={stat ? (e: React.KeyboardEvent) => handleKeyDown(e, alpha2) : undefined}
                  tabIndex={stat ? 0 : -1}
                  role={stat ? 'button' : undefined}
                  aria-label={stat ? `${stat.country_name}: ${stat.clicks} ${metricLabel} (${stat.percentage}%)` : undefined}
                />
              );
            })
          }
        </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.5, 8))}
          className="w-7 h-7 rounded bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 text-sm font-bold"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z / 1.5, 1))}
          className="w-7 h-7 rounded bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 text-sm font-bold"
          aria-label="Zoom out"
        >
          −
        </button>
        {zoom > 1.1 && (
          <button
            onClick={() => setZoom(1)}
            className="w-7 h-7 rounded bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 text-[10px]"
            aria-label="Reset zoom"
          >
            ↺
          </button>
        )}
      </div>

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-xs"
          style={{
            left: Math.min(tooltip.x + 12, (containerRef.current?.getBoundingClientRect().width ?? 400) - 170),
            top: Math.max(tooltip.y - 70, 8),
            minWidth: 150,
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
              <span className="text-slate-500 capitalize">{metricLabel}</span>
              <span className="font-semibold text-slate-900 tabular-nums">{tooltip.clicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Share</span>
              <span className="font-semibold text-slate-900 tabular-nums">{tooltip.percentage}%</span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
            Click to filter · Escape to clear
          </div>
        </div>
      )}

      {/* Top Countries Overlay */}
      <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-2.5 text-xs border border-slate-200 shadow-sm">
        <div className="font-medium text-slate-900 mb-1.5">Top Countries</div>
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
                <span className="text-slate-600 w-6">{stat.country_code}</span>
                <span className="font-medium text-slate-900 ml-auto tabular-nums">{stat.clicks}</span>
              </button>
            );
          })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[10px] text-slate-500">
        <span>Click intensity:</span>
        {MAP_COLORS.scale.map((color, i) => (
          <div key={i} className="w-5 h-3 rounded-sm" style={{ background: color }} />
        ))}
        <span className="ml-0.5">Low → High</span>
      </div>
    </div>
  );
}
