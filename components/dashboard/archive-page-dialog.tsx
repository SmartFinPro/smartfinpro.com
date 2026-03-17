// components/dashboard/archive-page-dialog.tsx — Soft-delete dialog with redirect target + batch mode
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export interface PageInfo {
  url: string;
  filePath: string;
  market: string;
  category: string;
  slug: string;
  title: string;
}

interface ArchivePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: PageInfo;
  /** When provided, dialog runs in batch mode */
  batchPages?: PageInfo[];
}

export function ArchivePageDialog({ open, onOpenChange, page, batchPages }: ArchivePageDialogProps) {
  const router = useRouter();
  const isBatch = batchPages && batchPages.length > 1;
  const pages = isBatch ? batchPages : [page];

  // Compute default redirect target: category pillar page
  const marketPrefix = page.market === 'US' ? '' : `/${page.market.toLowerCase()}`;
  const defaultRedirect = `${marketPrefix}/${page.category}`;

  const [redirectTarget, setRedirectTarget] = useState(defaultRedirect);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleArchive = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setProgress(0);

    try {
      const errors: string[] = [];

      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        // Compute per-page redirect (each page's own category pillar)
        const mp = p.market === 'US' ? '' : `/${p.market.toLowerCase()}`;
        const pageRedirect = isBatch ? `${mp}/${p.category}` : redirectTarget;

        try {
          const res = await fetch('/api/archive-page/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageUrl: p.url,
              filePath: p.filePath,
              market: p.market,
              category: p.category,
              slug: p.slug,
              redirectTarget: pageRedirect,
              reason,
            }),
          });

          const result = await res.json();
          if (!result.success) {
            errors.push(`${p.slug}: ${result.error || 'failed'}`);
          }
        } catch {
          errors.push(`${p.slug}: network error`);
        }

        setProgress(i + 1);
      }

      // Send batch summary Telegram alert (fire-and-forget, ≥2 pages)
      if (isBatch) {
        fetch('/api/archive-page/batch-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalCount: pages.length,
            successCount: pages.length - errors.length,
            failedSlugs: errors.map(e => e.split(':')[0]),
            reason,
          }),
        }).catch(() => {});
      }

      if (errors.length > 0) {
        setError(`${pages.length - errors.length}/${pages.length} archived. Errors: ${errors.join(', ')}`);
        // Still refresh to show the ones that succeeded
        router.refresh();
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  }, [pages, isBatch, redirectTarget, reason, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <Archive className="h-5 w-5" />
            {isBatch ? `Archive ${pages.length} Pages` : 'Archive Page'}
          </DialogTitle>
          <DialogDescription>
            {isBatch
              ? `This will archive ${pages.length} pages with 301 redirects to their category pillars. They can be restored within 14 days.`
              : 'This will set a 301 redirect and move the MDX file to the archive. The page can be restored within 14 days.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Page(s) being archived */}
          {isBatch ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 max-h-[200px] overflow-y-auto">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                {pages.length} Pages
              </p>
              <div className="space-y-1.5">
                {pages.map((p) => (
                  <div key={p.url} className="flex items-center gap-2">
                    {isSubmitting && progress > pages.indexOf(p) ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Archive className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    )}
                    <span className="text-xs text-slate-600 truncate" title={p.url}>
                      {p.url}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Page</p>
              <p className="text-sm font-medium text-slate-800 truncate">{page.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                {page.url}
                <ExternalLink className="h-3 w-3" />
              </p>
            </div>
          )}

          {/* Redirect target (single mode only) */}
          {!isBatch && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                301 Redirect Target
              </label>
              <input
                type="text"
                value={redirectTarget}
                onChange={(e) => setRedirectTarget(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                placeholder={defaultRedirect}
              />
              <p className="text-xs text-slate-400 mt-1">
                Visitors will be redirected here. Default: category pillar page.
              </p>
            </div>
          )}

          {/* Batch redirect info */}
          {isBatch && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-700">
                Each page will redirect to its own category pillar page automatically.
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none resize-none"
              placeholder="e.g., Product discontinued, thin content, duplicate..."
            />
          </div>

          {/* Progress (batch mode) */}
          {isBatch && isSubmitting && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span className="tabular-nums">{progress}/{pages.length}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(progress / pages.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={isSubmitting || (!isBatch && !redirectTarget.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isBatch ? `Archiving ${progress}/${pages.length}...` : 'Archiving...'}
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                {isBatch ? `Archive ${pages.length} Pages` : 'Archive Page'}
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
