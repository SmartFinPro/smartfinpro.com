'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MousePointerClick, Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';
import type { LiveClick, LiveStatsResponse } from '@/app/api/dashboard/live-stats/route';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

const REFRESH_INTERVAL_MS = 10_000; // 10 seconds

const MARKET_FLAGS: Record<string, string> = {
  us: '🇺🇸',
  uk: '🇬🇧',
  ca: '🇨🇦',
  au: '🇦🇺',
};

const MARKET_LABELS: Record<string, string> = {
  us: 'US',
  uk: 'UK',
  ca: 'CA',
  au: 'AU',
};

function DeviceIcon({ type }: { type: string | null }) {
  const cls = 'h-3.5 w-3.5 text-slate-400';
  switch (type?.toLowerCase()) {
    case 'mobile':   return <Smartphone className={cls} />;
    case 'tablet':   return <Tablet className={cls} />;
    case 'desktop':  return <Monitor className={cls} />;
    default:         return <Laptop className={cls} />;
  }
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatPath(path: string | null): string {
  if (!path) return 'Unknown page';
  // Remove market prefix for display brevity
  const clean = path.replace(/^\/(us|uk|ca|au)\//, '/');
  // Truncate long paths
  return clean.length > 42 ? clean.slice(0, 39) + '…' : clean;
}

interface ClickRowProps {
  click: LiveClick;
  isNew: boolean;
}

function ClickRow({ click, isNew }: ClickRowProps) {
  const [highlight, setHighlight] = useState(isNew);

  useEffect(() => {
    if (!isNew) return;
    const t = setTimeout(() => setHighlight(false), 2000);
    return () => clearTimeout(t);
  }, [isNew]);

  const market = click.market ?? 'us';
  const flag = MARKET_FLAGS[market] ?? '🌐';
  const label = MARKET_LABELS[market] ?? market.toUpperCase();

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-1000 ${
        highlight ? 'bg-amber-50' : 'hover:bg-slate-50'
      }`}
    >
      {/* Market flag */}
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base shrink-0">
        {flag}
      </div>

      {/* Page path */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate leading-none mb-0.5">
          {formatPath(click.page_path)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400 font-medium">{label}</span>
          {click.utm_source && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
              {click.utm_source}
            </span>
          )}
        </div>
      </div>

      {/* Device + time */}
      <div className="flex items-center gap-2 shrink-0">
        <DeviceIcon type={click.device_type} />
        <span className="text-xs text-slate-400 tabular-nums w-12 text-right">
          {timeAgo(click.clicked_at)}
        </span>
      </div>
    </div>
  );
}

export function LiveClicksFeed() {
  const [clicks, setClicks] = useState<LiveClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const prevIdsRef = useRef<Set<string>>(new Set());

  const fetchClicks = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/live-stats', { cache: 'no-store' });
      if (!res.ok) return;
      const json: LiveStatsResponse = await res.json();
      setClicks(json.recentClicks);
      setTotal(json.todayClicks);
      prevIdsRef.current = new Set(json.recentClicks.map((c) => c.id));
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Track which IDs are "new" since last fetch
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const fetchWithDiff = useCallback(async () => {
    const oldIds = prevIdsRef.current;
    try {
      const res = await fetch('/api/dashboard/live-stats', { cache: 'no-store' });
      if (!res.ok) return;
      const json: LiveStatsResponse = await res.json();
      const freshIds = new Set(json.recentClicks.map((c) => c.id));
      const added = new Set([...freshIds].filter((id) => !oldIds.has(id)));
      setNewIds(added);
      setClicks(json.recentClicks);
      setTotal(json.todayClicks);
      prevIdsRef.current = freshIds;
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchClicks();
    const interval = setInterval(fetchWithDiff, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchClicks, fetchWithDiff]);

  return (
    <WidgetErrorBoundary label="Live Clicks Feed" minHeight="h-48">
    <div className="dashboard-card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Live Click Feed</h3>
          {total > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
              {total} today
            </span>
          )}
        </div>
        {/* Pulse indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="text-xs text-slate-400">10s refresh</span>
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          // Skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/3" />
              </div>
              <div className="w-12 h-3 bg-slate-100 rounded animate-pulse" />
            </div>
          ))
        ) : clicks.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <MousePointerClick className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No clicks recorded yet</p>
            <p className="text-xs text-slate-300 mt-1">Clicks will appear here in real-time</p>
          </div>
        ) : (
          clicks.map((click) => (
            <ClickRow key={click.id} click={click} isNew={newIds.has(click.id)} />
          ))
        )}
      </div>
    </div>
    </WidgetErrorBoundary>
  );
}
