'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  job: string;
}

type State = 'idle' | 'running' | 'ok' | 'error';

export function TriggerButton({ job }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [duration, setDuration] = useState<number | null>(null);

  async function trigger() {
    if (state === 'running') return;
    setState('running');
    setDuration(null);

    try {
      const res = await fetch('/api/dashboard/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      const data = await res.json();
      setDuration(data.duration ?? null);
      setState(data.ok ? 'ok' : 'error');
      // Refresh server data so the last-run timestamps update
      router.refresh();
    } catch {
      setState('error');
    }

    // Reset to idle after 4s
    setTimeout(() => setState('idle'), 4000);
  }

  return (
    <button
      onClick={trigger}
      disabled={state === 'running'}
      title={`Run ${job} now`}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all disabled:opacity-50"
      style={{
        background: state === 'ok'    ? '#f0fdf4' :
                    state === 'error' ? '#fef2f2' :
                    state === 'running' ? '#f1f5f9' : '#f8fafc',
        color:      state === 'ok'    ? '#16a34a' :
                    state === 'error' ? '#dc2626' :
                    state === 'running' ? '#64748b' : '#64748b',
        border:     `1px solid ${
                    state === 'ok'    ? '#bbf7d0' :
                    state === 'error' ? '#fecaca' :
                    '#e2e8f0'}`,
      }}
    >
      {state === 'idle'    && <Play      className="h-3 w-3" />}
      {state === 'running' && <Loader2   className="h-3 w-3 animate-spin" />}
      {state === 'ok'      && <CheckCircle2 className="h-3 w-3" />}
      {state === 'error'   && <XCircle   className="h-3 w-3" />}

      <span>
        {state === 'idle'    && 'Run'}
        {state === 'running' && 'Running…'}
        {state === 'ok'      && `Done${duration ? ` ${duration}ms` : ''}`}
        {state === 'error'   && 'Failed'}
      </span>
    </button>
  );
}
