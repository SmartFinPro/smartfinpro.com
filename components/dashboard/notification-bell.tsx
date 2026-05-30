// components/dashboard/notification-bell.tsx
/* eslint-disable sfp/require-widget-error-boundary */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  ChevronRight,
} from 'lucide-react';

type Severity = 'info' | 'success' | 'warning' | 'critical';

interface NotificationItem {
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

const POLL_MS = 60_000;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

const SEVERITY_META: Record<Severity, { Icon: typeof Info; color: string; bg: string }> = {
  info: { Icon: Info, color: 'text-[var(--sfp-navy)]', bg: 'bg-[var(--sfp-sky)]' },
  success: { Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  warning: { Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  critical: { Icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnread(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
    } catch {
      // Silently ignore — bell shows last known state
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleMarkAll = async () => {
    if (marking) return;
    setMarking(true);
    try {
      const res = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (res.ok) {
        setUnread(0);
        setItems((prev) =>
          prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
        );
      }
    } catch {
      // Silently ignore
    } finally {
      setMarking(false);
    }
  };

  const latest = items.slice(0, 6);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Benachrichtigungen${unread > 0 ? ` (${unread} ungelesen)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-[var(--sfp-navy)]"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-[var(--sfp-red)] px-1 text-[10px] font-bold leading-[18px] text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Benachrichtigungen"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Benachrichtigungen</h3>
              {unread > 0 && (
                <span className="rounded-full bg-[var(--sfp-sky)] px-2 py-0.5 text-[10px] font-medium text-[var(--sfp-navy)]">
                  {unread} neu
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={marking || unread === 0}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-[var(--sfp-navy)] disabled:opacity-40"
            >
              {marking && <Loader2 className="h-3 w-3 animate-spin" />}
              Alle als gelesen markieren
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {latest.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-sm text-slate-500">Keine Benachrichtigungen</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {latest.map((n) => {
                  const meta = SEVERITY_META[n.severity] ?? SEVERITY_META.info;
                  const { Icon } = meta;
                  const inner = (
                    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            n.read_at ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'
                          }`}
                        >
                          {n.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                          {n.source && <span className="truncate">{n.source}</span>}
                          {n.source && <span>·</span>}
                          <span className="shrink-0">{relativeTime(n.created_at)}</span>
                          {!n.read_at && (
                            <span className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sfp-navy)]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link_url ? (
                        <Link href={n.link_url} onClick={() => setOpen(false)}>
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 text-xs font-medium text-[var(--sfp-navy)] hover:underline"
            >
              Alle anzeigen <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
