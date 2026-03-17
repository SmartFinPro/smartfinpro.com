// components/dashboard/hard-delete-dialog.tsx — Permanent deletion with double confirm
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface HardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archivedPage: {
    id: string;
    pageUrl: string;
    slug: string;
    title: string;
    archivedAt: string;
  };
}

export function HardDeleteDialog({ open, onOpenChange, archivedPage }: HardDeleteDialogProps) {
  const router = useRouter();
  const [confirmSlug, setConfirmSlug] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugMatches = confirmSlug.trim() === archivedPage.slug;
  const canDelete = slugMatches && understood && !isSubmitting;

  const handleHardDelete = useCallback(async () => {
    if (!canDelete) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/archive-page/hard-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archivedPageId: archivedPage.id,
          confirmSlug: confirmSlug.trim(),
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || 'Hard delete failed');
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  }, [archivedPage, confirmSlug, canDelete, onOpenChange, router]);

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmSlug('');
      setUnderstood(false);
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete Page
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The MDX file will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Warning box */}
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800 font-medium">
              You are about to permanently delete:
            </p>
            <p className="text-sm text-red-700 mt-1 font-mono">{archivedPage.pageUrl}</p>
            <p className="text-xs text-red-600 mt-2">
              This will remove the MDX file from the archive and cannot be recovered.
              The 301 redirect entry will be preserved.
            </p>
          </div>

          {/* Slug confirmation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type the page slug to confirm:
            </label>
            <input
              type="text"
              value={confirmSlug}
              onChange={(e) => setConfirmSlug(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none transition-colors ${
                confirmSlug.trim() === ''
                  ? 'border-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : slugMatches
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : 'border-red-300 bg-red-50 text-red-800'
              }`}
              placeholder={archivedPage.slug}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-slate-700">
              I understand this is irreversible and the MDX file will be permanently deleted
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleHardDelete}
            disabled={!canDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Permanently Delete
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
