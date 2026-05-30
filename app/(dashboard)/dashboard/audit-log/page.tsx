// app/(dashboard)/dashboard/audit-log/page.tsx
import Link from 'next/link';
import {
  ScrollText,
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Minus,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getAuditLog,
  type AuditLogEntry,
  type AuditLogStatus,
  type GetAuditLogOptions,
} from '@/lib/actions/audit-log';
import { AuditLogControls, ExpandableMetadata } from './audit-log-controls';
import { ExportButton } from '@/components/dashboard/export-button';
import { SavedViews } from '@/components/dashboard/saved-views';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 50;

// ── Helpers ────────────────────────────────────────────────────

function formatAge(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatExact(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function statusBadge(status: AuditLogStatus) {
  const map: Record<AuditLogStatus, { cls: string; label: string }> = {
    success: { cls: 'bg-green-50 text-green-700 border-green-200', label: 'success' },
    positive: { cls: 'bg-green-50 text-green-700 border-green-200', label: 'positive' },
    error: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'error' },
    timeout: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'timeout' },
    negative: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'negative' },
    running: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'running' },
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'pending' },
    undone: { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'undone' },
    neutral: { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'neutral' },
  };
  const { cls, label } = map[status] ?? map.neutral;
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function sourceBadge(source: AuditLogEntry['source']) {
  if (source === 'autonomous') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--sfp-sky)] text-[var(--sfp-navy)] text-[10px] font-medium">
        <Bot className="h-3 w-3" />
        Autonomous
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
      <Clock className="h-3 w-3" />
      Cron
    </span>
  );
}

function statusIcon(status: AuditLogStatus) {
  switch (status) {
    case 'success':
    case 'positive':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
    case 'timeout':
    case 'negative':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
    case 'pending':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'undone':
      return <RotateCcw className="h-4 w-4 text-slate-400" />;
    default:
      return <Minus className="h-4 w-4 text-slate-400" />;
  }
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Page ───────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const first = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v;

  const sourceParam = first(sp.source);
  const source: GetAuditLogOptions['source'] =
    sourceParam === 'cron' || sourceParam === 'autonomous' ? sourceParam : 'all';
  const status = first(sp.status);
  const q = first(sp.q);
  const offset = Math.max(parseInt(first(sp.offset) ?? '0', 10) || 0, 0);

  const { entries, total } = await getAuditLog({
    source,
    status,
    q,
    limit: PAGE_SIZE,
    offset,
  });

  const card = 'bg-white border border-slate-200 rounded-xl shadow-sm';
  const showingFrom = total === 0 ? 0 : offset + 1;
  const showingTo = Math.min(offset + PAGE_SIZE, total);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  const pageQuery = (newOffset: number): string => {
    const params = new URLSearchParams();
    if (source !== 'all') params.set('source', source);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    if (newOffset > 0) params.set('offset', String(newOffset));
    const str = params.toString();
    return str ? `?${str}` : '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-[var(--sfp-navy)]" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500">
            Unified audit trail — autonomous actions and cron runs across the platform
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SavedViews />
          <ExportButton dataset="audit-log" />
        </div>
      </div>

      {/* Filter bar */}
      <AuditLogControls />

      {/* Table */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Events</span>
          <span className="text-xs text-slate-400">
            {total > 0 ? `${showingFrom}–${showingTo} of ${total}` : 'No results'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="px-5 py-3 w-8" />
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3 text-right">Duration</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">
                    No audit events match the current filters.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 align-top">
                    <td className="px-5 py-3">{statusIcon(entry.status)}</td>
                    <td className="px-5 py-3 whitespace-nowrap" title={formatExact(entry.ts)}>
                      <span className="text-slate-600">{formatAge(entry.ts)}</span>
                    </td>
                    <td className="px-5 py-3">{sourceBadge(entry.source)}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {entry.category}
                    </td>
                    <td className="px-5 py-3">{statusBadge(entry.status)}</td>
                    <td className="px-5 py-3 text-slate-700 max-w-xs truncate" title={entry.title}>
                      {entry.title}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-500 whitespace-nowrap">
                      {formatDuration(entry.durationMs)}
                    </td>
                    <td className="px-5 py-3">
                      <ExpandableMetadata metadata={entry.metadata} detail={entry.detail} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {showingFrom}–{showingTo} of {total}
            </span>
            <div className="flex items-center gap-2">
              {hasPrev ? (
                <Link
                  href={`/dashboard/audit-log${pageQuery(Math.max(offset - PAGE_SIZE, 0))}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-medium text-slate-300 cursor-not-allowed">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </span>
              )}
              {hasNext ? (
                <Link
                  href={`/dashboard/audit-log${pageQuery(offset + PAGE_SIZE)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-medium text-slate-300 cursor-not-allowed">
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
