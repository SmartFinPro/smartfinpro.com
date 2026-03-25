'use client';

// app/(dashboard)/dashboard/ranking/indexing-card.tsx
// Google Indexing API card — submit URLs + check real indexing status.

import { useEffect, useState } from 'react';
import { Zap, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw, Search } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

interface SubmitResult {
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

interface PersistentStatus {
  totalInSitemap: number;
  alreadySubmitted: number;
  remaining: number;
  indexed: number;
  notIndexed: number;
  errors: number;
  unchecked: number;
  lastCheckedAt: string | null;
}

interface InspectionResult {
  totalSubmitted: number;
  indexed: number;
  notIndexed: number;
  unchecked: number;
  errors: number;
  dbErrors: number;
  checkedNow: number;
  cachedResults: number;
  errorSample: string | null;
}

type SubmitState = 'idle' | 'running' | 'done' | 'error';
type InspectState = 'idle' | 'running' | 'done' | 'error';

// ── Component ────────────────────────────────────────────────

export function IndexingCard() {
  // Persistent status (loaded on mount)
  const [status, setStatus] = useState<PersistentStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Submit state
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Inspection state
  const [inspectState, setInspectState] = useState<InspectState>('idle');
  const [inspectResult, setInspectResult] = useState<InspectionResult | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // ── Load persistent status on mount ────────────────────────
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/dashboard/indexing-status');
        if (res.status === 401) { window.location.reload(); return; }
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) { window.location.reload(); return; }
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        // Silent fail — card will show idle state
      } finally {
        setStatusLoading(false);
      }
    }
    loadStatus();
  }, []);

  // ── Submit handler ─────────────────────────────────────────
  async function handleSubmit() {
    if (submitState === 'running') return;
    setSubmitState('running');
    setSubmitResult(null);
    setSubmitError(null);

    try {
      const res = await fetch('/api/dashboard/submit-indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 200 }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? `HTTP ${res.status}`);
        setSubmitState('error');
        return;
      }

      setSubmitResult(data);
      setSubmitState('done');

      // Update persistent status with new counts
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              alreadySubmitted: prev.alreadySubmitted + (data.succeeded ?? 0),
              remaining: data.remaining ?? 0,
            }
          : prev
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Netzwerkfehler');
      setSubmitState('error');
    }
  }

  // ── Inspect handler (auto-continue batches) ───────────────
  async function handleInspect() {
    if (inspectState === 'running') return;
    setInspectState('running');
    setInspectResult(null);
    setInspectError(null);

    let batchCount = 0;
    const MAX_BATCHES = 8; // 8 × 30 = 240 URLs max
    let prevUnchecked = Infinity;

    try {
      while (batchCount < MAX_BATCHES) {
        batchCount++;
        const res = await fetch('/api/dashboard/check-indexing-status');

        // Auth + Content-Type checks
        if (res.status === 401) { window.location.reload(); return; }
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) {
          setInspectError(`Ungültige API-Antwort (HTTP ${res.status}, kein JSON). Seite neu laden und erneut versuchen.`);
          setInspectState('error');
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          setInspectError(data.error ?? `HTTP ${res.status}`);
          setInspectState('error');
          return;
        }

        const unchecked = data.unchecked ?? 0;

        // Progress-Guard: if unchecked doesn't decrease → stop (avoid infinite loop)
        if (unchecked >= prevUnchecked && batchCount > 1) {
          break;
        }
        prevUnchecked = unchecked;

        // Update intermediate results (UI re-renders with progress)
        setInspectResult({
          totalSubmitted: data.totalSubmitted ?? 0,
          indexed: data.indexed ?? 0,
          notIndexed: data.notIndexed ?? 0,
          unchecked,
          errors: data.errors ?? 0,
          dbErrors: data.dbErrors ?? 0,
          checkedNow: data.checkedNow ?? 0,
          cachedResults: data.cachedResults ?? 0,
          errorSample: data.errorSample ?? null,
        });

        // Update persistent status
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                indexed: data.indexed ?? 0,
                notIndexed: data.notIndexed ?? 0,
                errors: data.errors ?? 0,
                unchecked,
                lastCheckedAt: new Date().toISOString(),
              }
            : prev
        );

        // No unchecked left → done
        if (unchecked === 0) break;
        // Nothing new checked this batch (all cached) → done
        if ((data.checkedNow ?? 0) === 0) break;
      }

      setInspectState('done');
    } catch (err) {
      setInspectError(err instanceof Error ? err.message : 'Netzwerkfehler');
      setInspectState('error');
    }
  }

  const failedUrls = submitResult?.results.filter((r) => r.status === 'error') ?? [];

  // Determine displayed values
  const totalInSitemap = submitResult?.totalInSitemap ?? status?.totalInSitemap ?? 0;
  const alreadySubmitted = submitResult?.alreadySubmitted ?? status?.alreadySubmitted ?? 0;
  const remaining = submitResult?.remaining ?? status?.remaining ?? 0;
  const hasSubmitted = alreadySubmitted > 0;
  const allDone = submitResult?.allDone || (remaining === 0 && alreadySubmitted > 0);

  // Inspection counts
  const indexed = inspectResult?.indexed ?? status?.indexed ?? 0;
  const notIndexed = inspectResult?.notIndexed ?? status?.notIndexed ?? 0;
  const inspectErrors = inspectResult?.errors ?? status?.errors ?? 0;
  const unchecked = inspectResult?.unchecked ?? status?.unchecked ?? 0;
  const hasInspectionData = indexed > 0 || notIndexed > 0 || inspectErrors > 0 || inspectResult !== null;
  const errorSample = inspectResult?.errorSample ?? null;

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

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {/* Inspect button */}
            {hasSubmitted && (
              <button
                onClick={handleInspect}
                disabled={inspectState === 'running'}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all border"
                style={{
                  borderColor: 'var(--sfp-navy)',
                  color: inspectState === 'done' ? 'var(--sfp-green)' : 'var(--sfp-navy)',
                  background: inspectState === 'done' ? '#f0fdf4' : 'white',
                }}
              >
                {inspectState === 'running' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
                {inspectState === 'running' ? 'Wird geprüft…' : 'Status prüfen'}
              </button>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitState === 'running' || allDone}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{
                background: allDone
                  ? 'var(--sfp-green)'
                  : submitState === 'error'
                    ? 'var(--sfp-red)'
                    : 'var(--sfp-navy)',
              }}
            >
              {submitState === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
              {allDone && <CheckCircle2 className="h-4 w-4" />}
              {submitState === 'done' && !allDone && <Zap className="h-4 w-4" />}
              {submitState === 'error' && <XCircle className="h-4 w-4" />}
              {submitState === 'idle' && !allDone && <Zap className="h-4 w-4" />}

              {submitState === 'running' && 'Wird eingereicht…'}
              {submitState === 'idle' && !allDone && remaining > 0 && hasSubmitted && 'Verbleibende einreichen'}
              {submitState === 'idle' && !allDone && (!hasSubmitted || remaining === 0) && 'Jetzt einreichen'}
              {allDone && 'Alle eingereicht'}
              {submitState === 'done' && !allDone && 'Verbleibende einreichen'}
              {submitState === 'error' && 'Nochmal versuchen'}
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {statusLoading && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--sfp-gray)' }} />
            ))}
          </div>
        )}

        {/* Stats row 1: Submission status (always visible after load) */}
        {!statusLoading && (totalInSitemap > 0 || submitResult) && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-3">
            <StatPill label="In Sitemap" value={totalInSitemap} color="slate" />
            <StatPill label="Bereits eingereicht" value={alreadySubmitted} color="navy" />
            <StatPill label="Verbleibend" value={remaining} color={remaining > 0 ? 'amber' : 'green'} />
          </div>
        )}

        {/* Stats row 2: Submission result (after submit) */}
        {submitState === 'done' && submitResult && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <StatPill label="Jetzt eingereicht" value={submitResult.succeeded} color="green" />
            <StatPill label="Fehlgeschlagen" value={submitResult.failed} color={submitResult.failed > 0 ? 'red' : 'green'} />
          </div>
        )}

        {/* Stats row 3: Indexing status (after inspection or from cache) */}
        {hasInspectionData && (
          <div className={`mt-3 grid gap-3 ${inspectErrors > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <StatPill label="Indexiert" value={indexed} color="green" />
            <StatPill label="Nicht indexiert" value={notIndexed} color={notIndexed > 0 ? 'red' : 'green'} />
            {inspectErrors > 0 && (
              <StatPill label="API-Fehler" value={inspectErrors} color="amber" />
            )}
            <StatPill label="Nicht geprüft" value={unchecked} color={unchecked > 0 ? 'amber' : 'green'} />
          </div>
        )}

        {/* API error warning (GSC credentials / config issue) */}
        {inspectErrors > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-800">
                {inspectErrors} URL{inspectErrors !== 1 ? 's' : ''} konnten nicht geprüft werden (API-Fehler)
              </p>
              {errorSample && (
                <p className="mt-0.5 text-xs text-amber-700 font-mono truncate">{errorSample}</p>
              )}
              <p className="mt-1 text-xs text-amber-600">
                GSC-Credentials prüfen: <code className="font-mono">GSC_CLIENT_EMAIL</code>, <code className="font-mono">GSC_PRIVATE_KEY</code>, <code className="font-mono">GSC_SITE_URL</code> in <code className="font-mono">.env.local</code> auf dem VPS.
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/dashboard/test-inspection');
                    if (res.status === 401) { window.location.reload(); return; }
                    const data = await res.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (e) {
                    alert('Diagnose fehlgeschlagen: ' + (e instanceof Error ? e.message : String(e)));
                  }
                }}
                className="mt-1.5 text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900"
              >
                Diagnose ausführen →
              </button>
            </div>
          </div>
        )}

        {/* Last checked timestamp */}
        {status?.lastCheckedAt && (
          <p className="mt-2 text-xs text-slate-400">
            Indexierung zuletzt geprüft: {new Date(status.lastCheckedAt).toLocaleString('de-DE')}
          </p>
        )}

        {/* Info pills (idle, no data yet) */}
        {submitState === 'idle' && !hasSubmitted && !statusLoading && (
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
        {submitState === 'running' && (
          <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--sfp-sky)' }}>
            <p className="text-sm text-slate-600">
              Nur ausstehende URLs werden eingereicht… Das dauert ca. 30–60 Sekunden.
            </p>
          </div>
        )}

        {/* Inspect running state with progress bar */}
        {inspectState === 'running' && (
          <div className="mt-3 rounded-xl p-4" style={{ background: 'var(--sfp-sky)' }}>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--sfp-navy)' }} />
              <p className="text-sm text-slate-600">
                {inspectResult && inspectResult.totalSubmitted > 0
                  ? `${inspectResult.totalSubmitted - (inspectResult.unchecked ?? 0)} von ${inspectResult.totalSubmitted} URLs geprüft…`
                  : 'Indexierungsstatus wird bei Google geprüft…'}
              </p>
            </div>
            {inspectResult && inspectResult.totalSubmitted > 0 && (
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    background: 'var(--sfp-navy)',
                    width: `${Math.round(((inspectResult.totalSubmitted - (inspectResult.unchecked ?? 0)) / inspectResult.totalSubmitted) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Inspect done note */}
        {inspectState === 'done' && inspectResult && inspectResult.errors === 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
            <p className="text-xs text-green-700">
              <strong>{inspectResult.checkedNow} URLs</strong> bei Google geprüft
              {inspectResult.cachedResults > 0 && `, ${inspectResult.cachedResults} aus Cache`}.
              {' '}<strong>{inspectResult.indexed} von {inspectResult.totalSubmitted}</strong> sind indexiert.
            </p>
          </div>
        )}

        {/* Submit error */}
        {submitState === 'error' && submitError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Fehler</span>
            </div>
            <p className="mt-1 text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Inspect error */}
        {inspectState === 'error' && inspectError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Status-Check Fehler</span>
            </div>
            <p className="mt-1 text-sm text-red-600">{inspectError}</p>
          </div>
        )}

        {/* Quota warning */}
        {submitResult?.quotaNote && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">{submitResult.quotaNote}</p>
          </div>
        )}

        {/* Success note */}
        {submitResult && submitResult.succeeded > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
            <p className="text-xs text-green-700">
              <strong>{submitResult.succeeded} neue URLs</strong> erfolgreich bei Google eingereicht. Google crawlt diese Seiten jetzt priorisiert — Indexierung typischerweise innerhalb von Stunden bis 1–2 Tagen sichtbar in GSC.
            </p>
          </div>
        )}

        {/* All done */}
        {allDone && submitState !== 'done' && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
            <p className="text-xs text-green-700">
              <strong>Alle {totalInSitemap} URLs</strong> wurden bereits erfolgreich bei Google eingereicht. Keine ausstehenden URLs.
            </p>
          </div>
        )}

        {/* Failed URLs details */}
        {failedUrls.length > 0 && (
          <div className="mt-3">
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
    </div>
  );
}

// ── StatPill ─────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'slate' | 'navy' | 'green' | 'red' | 'amber';
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
    <div className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
      <div className="text-xl font-bold tabular-nums" style={{ color: s.text }}>
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
