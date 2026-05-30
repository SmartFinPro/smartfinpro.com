'use client';

import { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';

type Dataset = 'conversions' | 'affiliate-links' | 'audit-log' | 'revenue-by-page';

interface ExportButtonProps {
  dataset: Dataset;
  /** Optional time window (days) for time-bounded datasets like revenue-by-page. */
  days?: number;
  /** Optional override for the button label. */
  label?: string;
  className?: string;
}

export function ExportButton({ dataset, days, label = 'CSV', className }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    setError(false);

    try {
      const params = new URLSearchParams({ dataset });
      if (typeof days === 'number') params.set('days', String(days));

      const res = await fetch(`/api/dashboard/export?${params.toString()}`, {
        method: 'GET',
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);

      const blob = await res.blob();

      // Derive filename from Content-Disposition, fall back to a sensible default.
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const date = new Date().toISOString().slice(0, 10);
      const filename = match?.[1] ?? `${dataset}-${date}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      title={error ? 'Export failed — click to retry' : 'Export as CSV'}
      className={
        className ??
        `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          error
            ? 'border-[var(--sfp-red)] text-[var(--sfp-red)] hover:bg-red-50'
            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
        }`
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : error ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {error ? 'Retry' : label}
    </button>
  );
}
