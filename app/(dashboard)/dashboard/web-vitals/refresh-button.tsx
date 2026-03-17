// app/(dashboard)/dashboard/web-vitals/refresh-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState, useTransition } from 'react';

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
      setLastRefresh(
        new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    });
  }

  return (
    <div className="flex items-center gap-2">
      {lastRefresh && (
        <span className="text-xs text-slate-400 hidden sm:inline">
          Aktualisiert {lastRefresh}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`}
        />
        {isPending ? 'Lädt…' : 'Refresh'}
      </button>
    </div>
  );
}
