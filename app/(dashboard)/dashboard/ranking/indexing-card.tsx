'use client';

// app/(dashboard)/dashboard/ranking/indexing-card.tsx
// Triggers Google Indexing API submission — only for URLs not yet submitted.

import { useState } from 'react';
import { Zap, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink, CircleDot } from 'lucide-react';

interface Result {
  total: number;
  succeeded: number;
  failed: number;
  submitted: number;
  skipped: number;
  remaining: number;
  totalInSitemap: number;
  alreadySubmitted: number;
  allDone: boolean;
  quotaNote: string | null;
  message?: string;
  results: Array<{ url: string; status: 'success' | 'error'; message: string }>;
}

type State = 'idle' | 'running' | 'done' | 'error';

export function IndexingCard() {
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  async function handleSubmit() {
    if (state === 'running') return;
    setState('running');
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/dashboard/submit-indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 200 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? `HTTP ${res.status}`);
        setState('error');
        return;
      }

      setResult(data);
      setState('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Netzwerkfehler');
      setState('error');
    }
  }

  const failedUrls = result?.results.filter((r) => r.status === 'error') ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Gradient bar */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
      />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--sfp-sky)' }}
            >
              <Zap className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Google Indexing API</h3>
              <p className="text-xs text-slate-500">
                Nur neue/ausstehende URLs einreichen — bereits eingereichte werden übersprungen
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={state === 'running' || (state === 'done' && result?.allDone)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{
              background:
                state === 'done' && result?.allDone
                  ? 'var(--sfp-green)'
                  : state === 'done'
                    ? 'var(--sfp-navy)'
                    : state === 'error'
                      ? 'var(--sfp-red)'
                      : 'var(--sfp-navy)',
            }}
          >
            {state === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
            {state === 'done' && result?.allDone && <CheckCircle2 className="h-4 w-4" />}
            {state === 'done' && !result?.allDone && <Zap className="h-4 w-4" />}
            {state === 'error' && <XCircle className="h-4 w-4" />}
            {state === 'idle' && <Zap className="h-4 w-4" />}

            {state === 'idle' && 'Jetzt einreichen'}
            {state === 'running' && 'Wird eingereicht…'}
            {state === 'done' && result?.allDone && 'Alle eingereicht'}
            {state === 'done' && !result?.allDone && 'Verbleibende einreichen'}
            {state === 'error' && 'Nochmal versuchen'}
          </button>
        </div>

        {/* Info pills */}
        {state === 'idle' && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
              Max. 200 URLs/Tag (Google-Limit)
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: '#f0fdf4', color: 'var(--sfp-green)' }}>
              Bereits eingereichte URLs werden automatisch übersprungen
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
              Beschleunigt Indexierung um Tage
            </span>
          </div>
        )}

        {/* Running state */}
        {state === 'running' && (
          <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--sfp-sky)' }}>
            <p className="text-sm text-slate-600">
              Nur ausstehende URLs werden eingereicht… Das dauert ca. 30–60 Sekunden.
            </p>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && errorMsg && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Fehler</span>
            </div>
            <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {/* Success state */}
        {state === 'done' && result && (
          <div className="mt-4 space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatPill label="In Sitemap" value={result.totalInSitemap} color="slate" />
              <StatPill label="Bereits eingereicht" value={result.alreadySubmitted} color="navy" icon="check" />
              <StatPill label="Jetzt eingereicht" value={result.succeeded} color="green" />
              <StatPill label="Fehlgeschlagen" value={result.failed} color={result.failed > 0 ? 'red' : 'green'} />
              <StatPill label="Verbleibend" value={result.remaining} color={result.remaining > 0 ? 'amber' : 'green'} />
            </div>

            {/* All done message */}
            {result.allDone && (
              <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <p className="text-xs text-green-700">
                  <strong>Alle {result.totalInSitemap} URLs</strong> wurden bereits erfolgreich bei Google eingereicht. Keine ausstehenden URLs.
                </p>
              </div>
            )}

            {/* Quota warning — remaining URLs */}
            {result.quotaNote && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700">{result.quotaNote}</p>
              </div>
            )}

            {/* Success note */}
            {result.succeeded > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <p className="text-xs text-green-700">
                  <strong>{result.succeeded} neue URLs</strong> erfolgreich bei Google eingereicht. Google crawlt diese Seiten jetzt priorisiert — Indexierung typischerweise innerhalb von Stunden bis 1–2 Tagen sichtbar in GSC.
                </p>
              </div>
            )}

            {/* Failed URLs details */}
            {failedUrls.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-slate-500 underline underline-offset-2"
                >
                  {showDetails ? 'Details ausblenden' : `${failedUrls.length} fehlgeschlagene URLs anzeigen`}
                </button>
                {showDetails && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-red-100 bg-red-50 p-3 space-y-1">
                    {failedUrls.map((r) => (
                      <div key={r.url} className="flex items-start gap-2 text-xs">
                        <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                        <div>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-red-700 hover:underline flex items-center gap-1"
                          >
                            {r.url.replace('https://smartfinpro.com', '')}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                          <span className="text-red-500">{r.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'slate' | 'navy' | 'green' | 'red' | 'amber';
  icon?: 'check';
}) {
  const styles: Record<string, { bg: string; text: string }> = {
    slate: { bg: 'var(--sfp-gray)', text: '#64748b' },
    navy:  { bg: 'var(--sfp-sky)',  text: 'var(--sfp-navy)' },
    green: { bg: '#f0fdf4',         text: 'var(--sfp-green)' },
    red:   { bg: '#fef2f2',         text: 'var(--sfp-red)' },
    amber: { bg: '#fffbeb',         text: '#b45309' },
  };
  const s = styles[color];

  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: s.bg }}
    >
      <div className="text-xl font-bold tabular-nums" style={{ color: s.text }}>
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
