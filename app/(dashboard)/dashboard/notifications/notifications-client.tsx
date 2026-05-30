// app/(dashboard)/dashboard/notifications/notifications-client.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  Check,
  ExternalLink,
  Bell,
} from 'lucide-react';

type Severity = 'info' | 'success' | 'warning' | 'critical';

export interface NotificationRow {
  id: string;
  type: string;
  severity: Severity;
  title: string;
  message: string | null;
  source: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
}

type Filter = 'all' | 'unread' | Severity;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days}d`;
  return new Date(iso).toLocaleDateString('de-DE');
}

const SEVERITY_META: Record<
  Severity,
  { Icon: typeof Info; color: string; bg: string; label: string }
> = {
  info: { Icon: Info, color: 'text-[var(--sfp-navy)]', bg: 'bg-[var(--sfp-sky)]', label: 'Info' },
  success: { Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Success' },
  warning: { Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Warning' },
  critical: { Icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50', label: 'Critical' },
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'unread', label: 'Ungelesen' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'success', label: 'Success' },
  { key: 'info', label: 'Info' },
];

export default function NotificationsClient({
  initial,
}: {
  initial: NotificationRow[];
}) {
  const [items, setItems] = useState<NotificationRow[]>(initial);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(() => items.filter((n) => !n.read_at).length, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter((n) => !n.read_at);
    return items.filter((n) => n.severity === filter);
  }, [items, filter]);

  const markRead = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', id }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
        );
      }
    } catch {
      // Silently ignore
    } finally {
      setBusyId(null);
    }
  };

  const markAll = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
      }
    } catch {
      // Silently ignore
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter chips + Mark all */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[var(--sfp-navy)] bg-[var(--sfp-navy)] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
                {f.key === 'unread' && unreadCount > 0 && (
                  <span
                    className={`ml-1.5 ${active ? 'text-white/80' : 'text-[var(--sfp-navy)]'}`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={markAll}
          disabled={markingAll || unreadCount === 0}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-[var(--sfp-navy)] disabled:opacity-40"
        >
          {markingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Alle als gelesen markieren
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">
              {filter === 'all'
                ? 'Noch keine Benachrichtigungen'
                : 'Keine Benachrichtigungen für diesen Filter'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((n) => {
              const meta = SEVERITY_META[n.severity] ?? SEVERITY_META.info;
              const { Icon } = meta;
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60 ${
                    n.read_at ? '' : 'bg-[var(--sfp-sky)]/30'
                  }`}
                >
                  {/* Severity badge */}
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg}`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${meta.color}`} />
                  </span>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate text-sm ${
                          n.read_at ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      {!n.read_at && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sfp-navy)]" />
                      )}
                    </div>
                    {n.message && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      {n.source && <span className="font-mono">{n.source}</span>}
                      {n.source && <span>·</span>}
                      <span>{relativeTime(n.created_at)}</span>
                      {n.link_url && (
                        <>
                          <span>·</span>
                          <Link
                            href={n.link_url}
                            className="inline-flex items-center gap-0.5 text-[var(--sfp-navy)] hover:underline"
                          >
                            Öffnen <ExternalLink className="h-3 w-3" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Per-row mark read */}
                  <div className="shrink-0 self-center">
                    {n.read_at ? (
                      <span className="text-[11px] font-medium text-slate-300">Gelesen</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        disabled={busyId === n.id}
                        className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-[var(--sfp-navy)] hover:text-[var(--sfp-navy)] disabled:opacity-50"
                      >
                        {busyId === n.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Gelesen
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
