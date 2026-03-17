// components/dashboard/content-hub-refresh-button.tsx — Refresh Content Hub cache
'use client';

import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ContentHubRefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/refresh-content-hub', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setLastRefreshed(new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }));
        // Refresh the server component data
        router.refresh();
      } else {
        console.error('[ContentHubRefresh] API error:', data.message);
      }
    } catch (err) {
      console.error('[ContentHubRefresh] Network error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-violet-200 hover:text-violet-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Scanning...' : 'Refresh Content'}
      </button>
      {lastRefreshed && (
        <span className="text-xs text-emerald-600">
          ✓ Updated {lastRefreshed}
        </span>
      )}
    </div>
  );
}
