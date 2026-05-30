// app/(dashboard)/dashboard/audit-log/audit-log-controls.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'error', label: 'Error' },
  { value: 'timeout', label: 'Timeout' },
  { value: 'running', label: 'Running' },
  { value: 'pending', label: 'Pending' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'undone', label: 'Undone' },
];

const SOURCE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'cron', label: 'Cron' },
  { value: 'autonomous', label: 'Autonomous' },
];

function buildQuery(params: URLSearchParams, updates: Record<string, string>): string {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  // Any filter change resets pagination.
  next.delete('offset');
  const str = next.toString();
  return str ? `?${str}` : '';
}

export function AuditLogControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSource = searchParams.get('source') ?? 'all';
  const currentStatus = searchParams.get('status') ?? '';
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '');

  const navigate = (updates: Record<string, string>) => {
    const query = buildQuery(searchParams, updates);
    startTransition(() => {
      router.push(`${pathname}${query}`);
    });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: searchValue });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Source tabs */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        {SOURCE_TABS.map((tab) => {
          const active = currentSource === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => navigate({ source: tab.value === 'all' ? '' : tab.value })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                active
                  ? 'bg-[var(--sfp-navy)] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Status select */}
      <select
        value={currentStatus}
        onChange={(e) => navigate({ status: e.target.value })}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--sfp-navy)]/20"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Search */}
      <form onSubmit={submitSearch} className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search category, title, error…"
          className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--sfp-navy)]/20"
        />
      </form>
    </div>
  );
}

export function ExpandableMetadata({
  metadata,
  detail,
}: {
  metadata: Record<string, unknown> | null;
  detail: string | null;
}) {
  const [open, setOpen] = useState(false);

  const hasMetadata = metadata && Object.keys(metadata).length > 0;
  if (!hasMetadata && !detail) {
    return <span className="text-slate-300">—</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--sfp-navy)] hover:underline"
      >
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        {open ? 'Hide details' : 'Details'}
      </button>
      {open && (
        <div className="mt-2 rounded-md bg-slate-50 border border-slate-200 p-3 text-[11px] font-mono text-slate-600 overflow-x-auto max-w-md">
          {detail && (
            <p className="mb-2 whitespace-pre-wrap break-words text-slate-700">{detail}</p>
          )}
          {hasMetadata && (
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
