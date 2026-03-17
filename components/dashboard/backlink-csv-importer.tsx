// components/dashboard/backlink-csv-importer.tsx — CSV Import dialog for backlinks
'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { GSC_COLUMN_NAMES } from '@/lib/types/backlink';
import type { BacklinkCsvMapping, BacklinkImportResult } from '@/lib/types/backlink';

interface BacklinkCsvImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type Step = 'upload' | 'mapping' | 'importing' | 'result';

export function BacklinkCsvImporter({ open, onOpenChange, onImportComplete }: BacklinkCsvImporterProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvText, setCsvText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<BacklinkCsvMapping>({
    target_url: '',
    source_url: '',
    source_domain: '',
  });
  const [result, setResult] = useState<BacklinkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; found: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset state on close
  const reset = useCallback(() => {
    setStep('upload');
    setCsvText('');
    setHeaders([]);
    setPreviewRows([]);
    setMapping({ target_url: '', source_url: '', source_domain: '' });
    setResult(null);
    setError(null);
    setScanResult(null);
    setScanning(false);
  }, []);

  // Simple CSV line parser (handles quoted fields)
  function parseCSVLine(line: string): string[] {
    const parsed: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        parsed.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    parsed.push(current.trim());
    return parsed;
  }

  // Handle file upload
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;

      setCsvText(text);

      // Parse headers + preview
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setError('CSV must have at least a header and one data row');
        return;
      }

      const hdrs = parseCSVLine(lines[0]);
      setHeaders(hdrs);

      // Preview first 5 data rows
      const preview: string[][] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        preview.push(parseCSVLine(lines[i]));
      }
      setPreviewRows(preview);

      // Auto-detect mapping from GSC column names (EN + DE)
      const autoMapping: BacklinkCsvMapping = {
        target_url: '',
        source_url: '',
        source_domain: '',
      };
      for (const hdr of hdrs) {
        const trimmed = hdr.trim();
        const mapped = GSC_COLUMN_NAMES[trimmed] || GSC_COLUMN_NAMES[trimmed.toLowerCase()];
        if (mapped) {
          autoMapping[mapped] = trimmed;
        }
      }
      setMapping(autoMapping);

      setError(null);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, []);

  // Import CSV via API
  const doImport = useCallback(async () => {
    setStep('importing');
    setError(null);
    try {
      const res = await fetch('/api/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, mapping }),
      });
      const data = await res.json();
      if (data.errors?.length > 0) {
        setError(data.errors.join('; '));
      }
      setResult(data);
      setStep('result');
      onImportComplete?.();
    } catch (err) {
      setError(String(err));
      setStep('result');
    }
  }, [csvText, mapping, onImportComplete]);

  // Scan internal links via API
  const doScan = useCallback(async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan_internal' }),
      });
      const data = await res.json();
      setScanResult(data);
      onImportComplete?.();
    } catch (err) {
      setError(String(err));
    }
    setScanning(false);
  }, [onImportComplete]);

  const canProceed = mapping.target_url && (mapping.source_url || mapping.source_domain);
  const totalRows = csvText ? csvText.split('\n').filter((l) => l.trim()).length - 1 : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Upload className="h-5 w-5 text-violet-500" />
            Import Backlinks
          </DialogTitle>
          <DialogDescription>
            Upload a CSV from Google Search Console or scan internal links
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* CSV Upload */}
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-violet-300 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Drop a CSV file or click to browse
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports GSC &quot;External Links&quot; exports (English &amp; German)
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 uppercase">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Internal Scan */}
            <button
              onClick={doScan}
              disabled={scanning}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {scanning ? 'Scanning MDX files...' : 'Scan Internal Links from MDX'}
            </button>

            {scanResult && (
              <div className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                scanResult.success
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {scanResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {scanResult.success
                  ? `Found ${scanResult.found} internal links`
                  : 'Scan failed'}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Map CSV columns to backlink fields. Auto-detected from GSC format.
            </p>

            <div className="space-y-3">
              {(['target_url', 'source_url', 'source_domain', 'anchor_text'] as const).map((field) => (
                <div key={field} className="flex items-center gap-3">
                  <label className="w-32 text-sm font-medium text-slate-600 capitalize">
                    {field.replace(/_/g, ' ')}
                    {field !== 'anchor_text' && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <select
                    value={mapping[field] || ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                    className="flex-1 text-sm border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
                  >
                    <option value="">— Select column —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview */}
            {previewRows.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-auto max-h-[200px]">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-2 py-1.5 text-left text-slate-500 font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-t border-slate-100">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-2 py-1 text-slate-600 whitespace-nowrap max-w-[200px] truncate">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter>
              <button
                onClick={() => setStep('upload')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                onClick={doImport}
                disabled={!canProceed}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Import {totalRows > 0 ? `(~${totalRows} rows)` : ''}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
            <p className="text-sm text-slate-600 font-medium">Importing backlinks...</p>
            <p className="text-xs text-slate-400 mt-1">This may take a moment for large files</p>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              result.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
            }`}>
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {result.success ? 'Import Complete' : 'Import Failed'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {result.imported} imported · {result.lost} marked as lost
                </p>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 text-xs text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <DialogFooter>
              <button
                onClick={() => { reset(); onOpenChange(false); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
