'use client';

// components/dashboard/attribution-health-compact.tsx
// Compact Attribution-Watchdog card for the Command Center right column.
// Fetches /api/dashboard/attribution-health (pattern: autonomous-actions-widget).

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import type { HealthBand } from '@/lib/attribution/health-score';

interface CompactData {
  bands: Record<HealthBand, number>;
  providersTotal: number;
  openIncidents: number;
  riskTotal: number;
  worst: Array<{ provider: string; network: string | null; score: number | null; band: HealthBand }>;
  fetchedAt: string;
  error?: string;
}

export function AttributionHealthCompact() {
  const [data, setData] = useState<CompactData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/attribution-health');
      const json = await res.json();
      if (!res.ok) {
        setData({ ...json, error: json.error ?? `HTTP ${res.status}` });
      } else {
        setData(json);
      }
    } catch {
      setData({
        bands: { healthy: 0, warning: 0, critical: 0, na: 0 },
        providersTotal: 0,
        openIncidents: 0,
        riskTotal: 0,
        worst: [],
        fetchedAt: '',
        error: 'Verbindungsfehler',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="dashboard-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Attribution Watchdog</h3>
        </div>
        <Link
          href="/dashboard/revenue#attribution-watchdog"
          className="text-[11px] font-medium text-violet-600 hover:text-violet-700"
        >
          Details →
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      ) : data?.error ? (
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
          <span>
            Watchdog-Daten nicht verfügbar:{' '}
            <span className="font-mono break-all">{data.error}</span>
          </span>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-emerald-50 px-2 py-1.5 text-center">
              <p className="text-lg font-bold text-emerald-700 tabular-nums">
                {data.bands.healthy}
              </p>
              <p className="text-[10px] font-medium text-emerald-600 uppercase">Gesund</p>
            </div>
            <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-center">
              <p className="text-lg font-bold text-amber-700 tabular-nums">{data.bands.warning}</p>
              <p className="text-[10px] font-medium text-amber-600 uppercase">Beobachten</p>
            </div>
            <div className="rounded-lg bg-red-50 px-2 py-1.5 text-center">
              <p className="text-lg font-bold text-red-700 tabular-nums">{data.bands.critical}</p>
              <p className="text-[10px] font-medium text-red-600 uppercase">Kritisch</p>
            </div>
          </div>

          {data.openIncidents > 0 ? (
            <p className="text-xs text-slate-600">
              <AlertTriangle className="h-3 w-3 inline text-red-500 mr-1" />
              <span className="font-semibold">{data.openIncidents} offene Vorfälle</span>
              {data.riskTotal > 0 && (
                <span className="text-red-600"> · Risiko ~${Math.round(data.riskTotal)}</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-slate-500">Keine offenen Attribution-Vorfälle.</p>
          )}

          {data.worst.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
              {data.worst.map((w) => (
                <div key={w.provider} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate">{w.provider}</span>
                  <span
                    className={`font-semibold tabular-nums shrink-0 ${
                      w.band === 'critical' ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {w.score === null ? 'k. A.' : `${w.score}/100`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
