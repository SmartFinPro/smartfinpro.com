'use client';

import { useState, useCallback } from 'react';
import {
  Scan,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
  Globe,
  Zap,
} from 'lucide-react';

interface ScanResult {
  success: boolean;
  scanned: number;
  pending: number;
  generated: number;
  failed: number;
  skipped: number;
  duration: string;
  timestamp: string;
  details: Array<{
    folder: string;
    status: 'generated' | 'failed' | 'skipped';
    slug?: string;
    wordCount?: number;
    indexed?: boolean;
    error?: string;
  }>;
  error?: string;
}

interface LogEntry {
  id: string;
  brief_path: string;
  market: string;
  category: string;
  keyword: string;
  slug: string | null;
  status: string;
  word_count: number | null;
  indexed: boolean;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface AutoGenesisScannerProps {
  initialLogs: LogEntry[];
  pendingCount: number;
  totalSeoTexts: number;
  existingMdxCount: number;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Generiert' },
  generating: { icon: Loader2, color: 'text-blue-500', label: 'Wird generiert...' },
  pending: { icon: Clock, color: 'text-amber-500', label: 'Wartend' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Fehlgeschlagen' },
  skipped: { icon: AlertTriangle, color: 'text-slate-400', label: 'Übersprungen' },
};

export function AutoGenesisScanner({
  initialLogs,
  pendingCount,
  totalSeoTexts,
  existingMdxCount,
}: AutoGenesisScannerProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  const triggerScan = useCallback(async () => {
    setScanning(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/cron/auto-genesis', {
        headers: { Authorization: 'Bearer dev' },
      });
      const data: ScanResult = await res.json();
      data.success = res.ok;
      setLastResult(data);

      // Refresh logs
      const logsRes = await fetch('/api/auto-genesis/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err) {
      setLastResult({
        success: false,
        scanned: 0,
        pending: 0,
        generated: 0,
        failed: 0,
        skipped: 0,
        duration: '0s',
        timestamp: new Date().toISOString(),
        details: [],
        error: err instanceof Error ? err.message : 'Verbindungsfehler',
      });
    } finally {
      setScanning(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="SEO Texte"
          value={totalSeoTexts}
          icon={FileText}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          label="MDX vorhanden"
          value={existingMdxCount}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          label="Neu / Ausstehend"
          value={pendingCount}
          icon={Zap}
          color={pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'}
          bg={pendingCount > 0 ? 'bg-amber-50' : 'bg-slate-50'}
        />
        <StatCard
          label="Generiert (Log)"
          value={logs.filter((l) => l.status === 'completed').length}
          icon={Globe}
          color="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      {/* Scan Button + Last Result */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">SEO Text Scanner</h3>
            <p className="text-xs text-slate-500">
              Scannt /seo texte/ nach neuen Dateien ohne MDX-Seite und generiert automatisch
            </p>
          </div>
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: scanning ? '#94a3b8' : 'var(--sfp-navy)' }}
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Scan className="h-4 w-4" />
            )}
            {scanning ? 'Scannt & Generiert...' : 'Scan & Generate'}
          </button>
        </div>

        {/* Last scan result */}
        {lastResult && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              background: lastResult.success && lastResult.generated > 0
                ? 'rgba(16, 185, 129, 0.08)'
                : lastResult.success
                  ? 'rgba(148, 163, 184, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
            }}
          >
            {lastResult.error ? (
              <p className="text-red-600">Fehler: {lastResult.error}</p>
            ) : (
              <div className="space-y-1">
                <p className="font-medium text-slate-700">
                  {lastResult.generated > 0
                    ? `${lastResult.generated} neue Seite(n) generiert!`
                    : 'Keine neuen SEO-Texte gefunden'}
                </p>
                <p className="text-slate-500 text-xs">
                  {lastResult.scanned} gescannt · {lastResult.skipped} übersprungen ·{' '}
                  {lastResult.failed > 0 && (
                    <span className="text-red-500">{lastResult.failed} fehlgeschlagen · </span>
                  )}
                  {lastResult.duration}
                </p>
                {lastResult.details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {lastResult.details.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {d.status === 'generated' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        <span className="text-slate-600 truncate">
                          {d.slug || d.folder}
                        </span>
                        {d.wordCount && (
                          <span className="text-slate-400">
                            ({d.wordCount.toLocaleString('en-US')} Wörter)
                          </span>
                        )}
                        {d.indexed && (
                          <span className="text-emerald-500 text-[10px] font-medium uppercase">
                            Indexiert
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Logs Table */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-slate-700">
              Generierungs-Log
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--sfp-sky)' }}>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Keyword</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Market</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Kategorie</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Wörter</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">Indexiert</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Datum</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={log.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Icon
                            className={`h-3.5 w-3.5 ${cfg.color} ${
                              log.status === 'generating' ? 'animate-spin' : ''
                            }`}
                          />
                          <span className={`text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 font-medium max-w-[200px] truncate">
                        {log.keyword}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 uppercase text-xs">
                        {log.market}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">
                        {log.category}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">
                        {log.word_count?.toLocaleString('en-US') || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {log.indexed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400 text-xs whitespace-nowrap">
                        {log.completed_at
                          ? new Date(log.completed_at).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : log.created_at
                            ? new Date(log.created_at).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {logs.some((l) => l.status === 'failed' && l.error_message) && (
            <div className="px-4 py-2 border-t border-gray-100 bg-red-50/50">
              <p className="text-xs text-red-600">
                {logs.filter((l) => l.status === 'failed').length} fehlgeschlagene Einträge —
                Fehler werden nicht automatisch wiederholt
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {logs.length === 0 && !lastResult && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
          <Scan className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            Noch keine Auto-Generierungen. Klicke &quot;Scan &amp; Generate&quot; oder warte auf den nächsten Cron-Lauf.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            SEO-Texte in <code className="bg-white px-1 py-0.5 rounded">/seo texte/</code> werden automatisch erkannt
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`h-3.5 w-3.5 ${color}`} />
        </div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-800 tabular-nums">{value}</p>
    </div>
  );
}
