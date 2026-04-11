'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Eye, MousePointerClick, RefreshCw, Wifi } from 'lucide-react';
import type { LiveStatsResponse } from '@/app/api/dashboard/live-stats/route';

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const start = prev.current;
    if (start === target) return;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

export function LiveDashboardBar() {
  const [data, setData] = useState<LiveStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const fetchedAtRef = useRef<Date | null>(null);

  const activeNow = useCountUp(data?.activeNow ?? 0);
  const todayPageViews = useCountUp(data?.todayPageViews ?? 0);
  const todayClicks = useCountUp(data?.todayClicks ?? 0);

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard/live-stats', { cache: 'no-store' });
      if (!res.ok) return;
      const json: LiveStatsResponse = await res.json();
      setData(json);
      fetchedAtRef.current = new Date(json.fetchedAt);
      setSecondsAgo(0);
    } catch {
      // silently ignore — stale data is fine
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setRefreshing(false), 500);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const pollInterval = setInterval(() => fetchStats(), REFRESH_INTERVAL_MS);
    const tickInterval = setInterval(() => {
      if (!fetchedAtRef.current) return;
      setSecondsAgo(Math.floor((Date.now() - fetchedAtRef.current.getTime()) / 1000));
    }, 1000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, [fetchStats]);

  const pulse = data?.activeNow && data.activeNow > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-6 flex-wrap shadow-sm">
      {/* Live indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          {pulse && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulse ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        </span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live</span>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-slate-100 hidden sm:block" />

      {/* Active Now */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Users className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs text-slate-400 leading-none mb-0.5">Active Now</p>
          <p className="text-sm font-bold text-slate-800 tabular-nums leading-none">
            {loading ? '—' : activeNow}
          </p>
        </div>
      </div>

      {/* Today Page Views */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <Eye className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-slate-400 leading-none mb-0.5">Today</p>
          <p className="text-sm font-bold text-slate-800 tabular-nums leading-none">
            {loading ? '—' : todayPageViews.toLocaleString()} <span className="font-normal text-slate-400 text-xs">PVs</span>
          </p>
        </div>
      </div>

      {/* Today Clicks */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
          <MousePointerClick className="h-3.5 w-3.5 text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-slate-400 leading-none mb-0.5">Clicks</p>
          <p className="text-sm font-bold text-slate-800 tabular-nums leading-none">
            {loading ? '—' : todayClicks.toLocaleString()} <span className="font-normal text-slate-400 text-xs">today</span>
          </p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 hidden sm:block" />

      {/* Last updated + manual refresh */}
      <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
        <Wifi className="h-3 w-3" />
        <span>{loading ? 'Loading…' : `${secondsAgo}s ago`}</span>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="ml-1 p-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
          title="Refresh now"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
