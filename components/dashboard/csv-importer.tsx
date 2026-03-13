'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CSVImporterProps {
  affiliateLinks: { id: string; slug: string; partner_name: string }[];
}

type ImportStep = 'upload' | 'mapping' | 'confirm' | 'result';

export function CSVImporter({ affiliateLinks }: CSVImporterProps) {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Column mapping
  const [dateColumn, setDateColumn] = useState<string>('');
  const [amountColumn, setAmountColumn] = useState<string>('');
  const [referenceColumn, setReferenceColumn] = useState<string>('');
  const [statusColumn, setStatusColumn] = useState<string>('');
  const [linkColumn, setLinkColumn] = useState<string>('');
  const [defaultLinkId, setDefaultLinkId] = useState<string>('');
  const [defaultStatus, setDefaultStatus] = useState<'pending' | 'approved'>('pending');

  // Result
  const [result, setResult] = useState<{
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const autoDetectColumns = useCallback((headerLine: string[]) => {
    headerLine.forEach((h) => {
      const lower = h.toLowerCase();
      if (lower.includes('date') || lower.includes('time') || lower.includes('datum')) {
        setDateColumn(h);
      }
      if (lower.includes('amount') || lower.includes('commission') || lower.includes('revenue') || lower.includes('betrag') || lower.includes('provision')) {
        setAmountColumn(h);
      }
      if (lower.includes('reference') || lower.includes('ref') || lower.includes('id') || lower.includes('order')) {
        setReferenceColumn(h);
      }
      if (lower.includes('status')) {
        setStatusColumn(h);
      }
      if (lower.includes('link') || lower.includes('subid') || lower.includes('sub_id') || lower.includes('campaign')) {
        setLinkColumn(h);
      }
    });
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);

      // Parse headers and preview
      const lines = text.trim().split('\n');
      if (lines.length > 0) {
        const headerLine = parseCSVLine(lines[0]);
        setHeaders(headerLine);

        // Get preview rows (up to 5)
        const preview = lines.slice(1, 6).map(parseCSVLine);
        setPreviewRows(preview);

        // Auto-detect columns
        autoDetectColumns(headerLine);
        setStep('mapping');
      }
    };
    reader.readAsText(file);
  }, [autoDetectColumns]);

  const handleImport = async () => {
    if (!dateColumn || !amountColumn) {
      alert('Please select at least Date and Amount columns');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvData,
          columnMapping: {
            dateColumn,
            amountColumn,
            referenceColumn: referenceColumn || undefined,
            statusColumn: statusColumn || undefined,
            linkColumn: linkColumn || undefined,
          },
          defaultLinkId: defaultLinkId || undefined,
          defaultStatus,
        }),
      });

      const importResult = await res.json();
      setResult(importResult);
      setStep('result');
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
      setStep('result');
    } finally {
      setIsLoading(false);
    }
  };

  const resetImporter = () => {
    setStep('upload');
    setCsvData('');
    setFileName('');
    setHeaders([]);
    setPreviewRows([]);
    setDateColumn('');
    setAmountColumn('');
    setReferenceColumn('');
    setStatusColumn('');
    setLinkColumn('');
    setDefaultLinkId('');
    setDefaultStatus('pending');
    setResult(null);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          CSV Import
        </CardTitle>
        <CardDescription>
          Import conversion data from your affiliate network exports
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop a CSV file, or click to browse
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Supported formats:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Date, Amount, Reference (SubID), Status columns</li>
                <li>Common network exports: PartnerStack, Impact, ShareASale, CJ, etc.</li>
                <li>Date formats: YYYY-MM-DD, MM/DD/YYYY, DD.MM.YYYY</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                File: <span className="font-medium text-foreground">{fileName}</span>
              </p>
              <Button variant="ghost" size="sm" onClick={resetImporter}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>

            {/* Column Mapping */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Column *</Label>
                <Select value={dateColumn} onValueChange={setDateColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount Column *</Label>
                <Select value={amountColumn} onValueChange={setAmountColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference/Order ID Column</Label>
                <Select value={referenceColumn} onValueChange={setReferenceColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status Column</Label>
                <Select value={statusColumn} onValueChange={setStatusColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link/SubID Column</Label>
                <Select value={linkColumn} onValueChange={setLinkColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Affiliate Link</Label>
                <Select value={defaultLinkId} onValueChange={setDefaultLinkId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select if no SubID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No default</SelectItem>
                    {affiliateLinks.map((link) => (
                      <SelectItem key={link.id} value={link.id}>
                        {link.partner_name} ({link.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Status (if no status column)</Label>
              <Select value={defaultStatus} onValueChange={(v) => setDefaultStatus(v as 'pending' | 'approved')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview (first 5 rows)</Label>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">
                          {h}
                          {h === dateColumn && <span className="ml-1 text-primary">(Date)</span>}
                          {h === amountColumn && <span className="ml-1 text-green-600">(Amount)</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 truncate max-w-[150px]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetImporter}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!dateColumn || !amountColumn || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? 'Import Completed' : 'Import Failed'}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p>Records imported: <span className="font-medium">{result.imported}</span></p>
                <p>Records skipped: <span className="font-medium">{result.skipped}</span></p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Errors:</p>
                <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={resetImporter} className="w-full">
              Import Another File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper: Parse CSV line
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}
