// components/dashboard/audit-verify-button.tsx
// Client Component — "Verify Audit now" button with live status polling.
//
// Placed inside AuditStatusWidget (Server Component) via composition.
// Polls /api/audit/verify/status every 5s while a run is active.
// After completion, triggers a page refresh to update Server Component data.
//
// Design: Clean Fintech Look — solid surfaces, clear contrasts, NO glassmorphism.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { VerifyRunStatus, VerifyState } from '@/lib/audit/verify-types';

// ── Constants ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;
const START_URL = '/api/audit/verify/start';
const STATUS_URL = '/api/audit/verify/status';

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerifyRunStatus }) {
  const config: Record<VerifyRunStatus, { label: string; bg: string; text: string }> = {
    idle:    { label: 'Bereit',   bg: 'bg-slate-100',   text: 'text-slate-600' },
    running: { label: 'Läuft…',   bg: 'bg-amber-100',   text: 'text-amber-700' },
    passed:  { label: 'Bestanden', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    failed:  { label: 'Fehler',   bg: 'bg-rose-100',    text: 'text-rose-700' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {status === 'running' && <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />}
      {status === 'passed' && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
      {status === 'failed' && <XCircle className="h-2.5 w-2.5 mr-1" />}
      {c.label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AuditVerifyButton() {
  const [verifyState, setVerifyState] = useState<VerifyState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch current status ─────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(STATUS_URL);
      if (!res.ok) return;
      const data: VerifyState = await res.json();
      setVerifyState(data);
      return data;
    } catch {
      // Silently ignore fetch errors during polling
      return null;
    }
  }, []);

  // ── Polling management ───────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // already polling
    pollingRef.current = setInterval(async () => {
      const data = await fetchStatus();
      if (data && data.status !== 'running') {
        // Run finished — stop polling, refresh page to update Server Component data
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        // Small delay to let the user see the final status before refresh
        setTimeout(() => {
          window.location.reload();
        }, 1_500);
      }
    }, POLL_INTERVAL_MS);
  }, [fetchStatus]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ── Initial status fetch + auto-resume polling if already running ────────

  useEffect(() => {
    fetchStatus().then((data) => {
      if (data?.status === 'running') {
        startPolling();
      }
    });
    return () => stopPolling();
  }, [fetchStatus, startPolling, stopPolling]);

  // ── Start handler ────────────────────────────────────────────────────────

  const handleStart = async () => {
    setIsStarting(true);
    setStartError(null);

    try {
      const res = await fetch(START_URL, { method: 'POST' });

      if (res.status === 202) {
        // Successfully started
        const data = await res.json();
        setVerifyState({
          status: 'running',
          runId: data.runId,
          startedAt: data.startedAt,
          finishedAt: null,
          exitCode: null,
          lastError: null,
          pid: null, // Client doesn't need PID
        });
        startPolling();
      } else if (res.status === 409) {
        // Already running — sync state
        const data = await res.json();
        setStartError(data.error);
        await fetchStatus();
        startPolling();
      } else {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setStartError(data.error ?? 'Unbekannter Fehler');
      }
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Netzwerkfehler');
    } finally {
      setIsStarting(false);
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────

  const isRunning = verifyState?.status === 'running' || isStarting;
  const showResult = verifyState && verifyState.status !== 'idle';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="pt-2.5 mt-2.5 border-t border-slate-100">
      <div className="flex items-center justify-between">
        {/* Left: verify button */}
        <button
          onClick={handleStart}
          disabled={isRunning}
          className={`
            flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg
            transition-colors
            ${isRunning
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }
          `}
        >
          {isRunning
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Play className="h-3 w-3" />
          }
          {isRunning ? 'Läuft…' : 'Verify Audit'}
        </button>

        {/* Right: status badge */}
        {showResult && <StatusBadge status={verifyState.status} />}
      </div>

      {/* Error message */}
      {startError && (
        <p className="text-[10px] text-rose-600 mt-1.5">{startError}</p>
      )}

      {/* Last run info (only when finished) */}
      {verifyState?.finishedAt && (
        <p className="text-[9px] text-slate-400 mt-1">
          Letzter Run: {new Intl.DateTimeFormat('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }).format(new Date(verifyState.finishedAt))}
          {verifyState.exitCode !== null && ` · Exit ${verifyState.exitCode}`}
        </p>
      )}

      {/* Error details */}
      {verifyState?.lastError && verifyState.status === 'failed' && (
        <p className="text-[9px] text-rose-500 mt-1 line-clamp-2">{verifyState.lastError}</p>
      )}
    </div>
  );
}
