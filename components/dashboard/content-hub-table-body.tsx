// components/dashboard/content-hub-table-body.tsx — Client table with checkbox, inline archive, context menu
'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  Clock,
  Link2,
  Archive,
  RotateCcw,
  Trash2,
  Loader2,
  Copy,
  SquareArrowOutUpRight,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import { CtaPartnerSelect } from './cta-partner-select';
import { ArchivePageDialog } from './archive-page-dialog';
import { HardDeleteDialog } from './hard-delete-dialog';
import type { ContentHubRow, HealthStatus, ContentQuality } from '@/lib/actions/content-hub';
import type { PartnerOption } from './cta-partner-select';
import type { PartnerAssignmentConfig } from '@/lib/types/page-cta';

const BacklinkDetailDialog = dynamic(
  () => import('./backlink-detail-dialog'),
  { ssr: false }
);

// ── Helper Components ──────────────────────────────────────────

function HealthDot({ status }: { status: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${colors[status]}`} />;
}

function MarketBadge({ market }: { market: string }) {
  const styles: Record<string, string> = {
    US: 'bg-blue-50 text-blue-700 border-blue-200',
    UK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CA: 'bg-red-50 text-red-700 border-red-200',
    AU: 'bg-amber-50 text-amber-700 border-amber-200',
    GLOBAL: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${styles[market] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {market}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600">
      {category}
    </span>
  );
}

function SeoDetail({ seoHealth }: { seoHealth: ContentHubRow['seoHealth'] }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <HealthDot status={seoHealth.titleStatus} />
        <span className="text-xs text-slate-500">
          Title: {seoHealth.titleLength > 0 ? `${seoHealth.titleLength} chars` : 'missing'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <HealthDot status={seoHealth.descStatus} />
        <span className="text-xs text-slate-500">
          Desc: {seoHealth.descLength > 0 ? `${seoHealth.descLength} chars` : 'missing'}
        </span>
      </div>
    </div>
  );
}

function QualityBadge({ quality }: { quality: ContentQuality }) {
  if (quality.score === 0 && quality.breakdown === '—') {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const color =
    quality.score >= 80
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : quality.score >= 50
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full border ${color}`}
        title={`Words: ${quality.wordScore} | Structure: ${quality.structureScore} | Links: ${quality.linkScore} | Components: ${quality.componentScore}`}
      >
        {quality.score}
      </span>
      <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
        {quality.breakdown}
      </span>
    </div>
  );
}

function CpsBadge({ cps }: { cps: number | null }) {
  if (cps === null) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const color =
    cps >= 70
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : cps >= 40
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200';

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-md border tabular-nums ${color}`}
      title={`Conversion Potential Score — ${cps >= 70 ? 'High opportunity' : cps >= 40 ? 'Medium competition' : 'High competition'}`}
    >
      {cps.toFixed(1)}
    </span>
  );
}

function BacklinkBadge({
  count,
  new30d,
  onClick,
}: {
  count: number | null;
  new30d: number | null;
  onClick: () => void;
}) {
  if (count === null) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const color =
    count >= 20
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
      : count >= 5
        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-md border tabular-nums cursor-pointer transition-colors ${color}`}
      title={`${count} active backlinks — click for details`}
    >
      <Link2 className="h-3 w-3" />
      {count}
      {new30d && new30d > 0 ? (
        <span className="text-[10px] font-normal text-emerald-600">+{new30d}</span>
      ) : null}
    </button>
  );
}

// ── Helper: build PageInfo for dialog ──────────────────────────

function toPageInfo(row: ContentHubRow) {
  return {
    url: row.url,
    filePath: row.filePath,
    market: row.market,
    category: row.category,
    slug: row.url.split('/').pop() || '',
    title: row.seoTitle || row.title,
  };
}

// ── Main Table (thead + tbody) ─────────────────────────────────

interface ContentHubTableBodyProps {
  rows: ContentHubRow[];
  siteUrl: string;
  partnerAssignments: Record<string, PartnerAssignmentConfig[]>;
  partnersByMarket: Record<string, PartnerOption[]>;
}

export function ContentHubTableBody({
  rows,
  siteUrl,
  partnerAssignments,
  partnersByMarket,
}: ContentHubTableBodyProps) {
  const router = useRouter();

  // ── Selection state ──────────────────────────────────────────
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [batchArchiveOpen, setBatchArchiveOpen] = useState(false);

  // ── Single-action state ──────────────────────────────────────
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ContentHubRow | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<ContentHubRow | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  // ── Selectable rows (only active MDX pages) ──────────────────
  const selectableUrls = useMemo(
    () => new Set(rows.filter((r) => r.type === 'mdx' && r.archiveStatus !== 'archived').map((r) => r.url)),
    [rows]
  );

  const allSelected = selectableUrls.size > 0 && [...selectableUrls].every((u) => selectedUrls.has(u));
  const someSelected = selectedUrls.size > 0 && !allSelected;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(selectableUrls));
    }
  }, [allSelected, selectableUrls]);

  const toggleRow = useCallback((url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  }, []);

  // ── Batch pages for dialog ──────────────────────────────────
  const batchPages = useMemo(
    () => rows.filter((r) => selectedUrls.has(r.url)).map(toPageInfo),
    [rows, selectedUrls]
  );

  // ── Restore handler ──────────────────────────────────────────
  const handleRestore = useCallback(async (archivedPageId: string) => {
    setRestoringId(archivedPageId);
    try {
      const res = await fetch('/api/archive-page/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedPageId }),
      });
      const result = await res.json();
      if (result.success) {
        setConfirmRestoreId(null);
        router.refresh();
      } else {
        alert(result.error || 'Restore failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setRestoringId(null);
    }
  }, [router]);

  // ── Copy to clipboard (with fallback) ────────────────────────
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    // Try modern Clipboard API first
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Falls through to fallback
      }
    }
    // Fallback: textarea + execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }, []);

  const copyUrl = useCallback((url: string) => {
    copyToClipboard(`${siteUrl}${url}`);
  }, [siteUrl, copyToClipboard]);

  return (
    <>
    {/* ── Batch Action Bar (OUTSIDE <table> to avoid hydration error) ── */}
    {selectedUrls.size > 0 && (
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
        <span className="text-sm font-semibold text-amber-800 tabular-nums">
          {selectedUrls.size} page{selectedUrls.size > 1 ? 's' : ''} selected
        </span>
        <button
          onClick={() => setBatchArchiveOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Archive className="h-3.5 w-3.5" />
          Archive Selected
        </button>
        <button
          onClick={async () => {
            const urls = Array.from(selectedUrls).map(u => `${siteUrl}${u}`).join('\n');
            const ok = await copyToClipboard(urls);
            if (ok) {
              setCopiedBatch(true);
              setTimeout(() => setCopiedBatch(false), 2000);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          {copiedBatch ? 'Copied!' : 'Copy URLs'}
        </button>
        <button
          onClick={() => setSelectedUrls(new Set())}
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Clear
        </button>
      </div>
    )}

    <div className="overflow-x-auto">
    <table className="w-full min-w-[1440px]">
    {/* ── Table Head (owned by client for select-all checkbox) ── */}
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        <th className="px-3 py-3 w-10">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected; }}
            onChange={toggleSelectAll}
            aria-label="Select all MDX pages"
            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
            title="Select all MDX pages"
          />
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Market</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SEO Title</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CTA Partner</th>
        <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Words</th>
        <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality</th>
        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">CPS</th>
        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">BL</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SEO</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Index</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
      </tr>
    </thead>

    {/* ── Table Body ────────────────────────────────────────────── */}
    <tbody>
      {rows.map((row) => {
        const assignedPartners = partnerAssignments[row.url] || [];
        const available = partnersByMarket[row.market] || [];
        const isArchived = row.archiveStatus === 'archived';
        const isMdx = row.type === 'mdx';
        const canSelect = isMdx && !isArchived;
        const isSelected = selectedUrls.has(row.url);

        return (
          <ContextMenu key={row.url}>
            <ContextMenuTrigger asChild>
              <tr
                className={`group border-b border-slate-100 transition-colors ${
                  isSelected
                    ? 'bg-amber-50/60'
                    : isArchived
                      ? 'bg-amber-50/40 hover:bg-amber-50/60'
                      : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Checkbox */}
                <td className="px-3 py-3 w-10">
                  {canSelect ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(row.url)}
                      aria-label={`Select ${row.url}`}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
                    />
                  ) : (
                    <span className="block w-4 h-4" />
                  )}
                </td>

                {/* URL + inline Archive icon */}
                <td className="px-4 py-3 max-w-[280px]">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`${siteUrl}${row.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm font-medium truncate block ${
                        isArchived ? 'text-slate-400' : 'text-violet-600 hover:text-violet-800'
                      }`}
                      title={row.url}
                    >
                      {row.url}
                      <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-50" />
                    </a>
                    {/* Inline Archive icon (hover-visible, focus-visible for keyboard) */}
                    {isMdx && !isArchived && (
                      <button
                        onClick={() => setArchiveTarget(row)}
                        aria-label={`Archive ${row.url}`}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-0.5 rounded text-amber-400 hover:text-amber-600 hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 transition-all shrink-0 outline-none"
                        title="Archive page"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {/* Inline Restore icon for archived rows */}
                    {isArchived && row.archivedPageId && (
                      <button
                        onClick={() => setConfirmRestoreId(row.archivedPageId!)}
                        aria-label={`Restore ${row.url}`}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-0.5 rounded text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 transition-all shrink-0 outline-none"
                        title="Restore page"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {isArchived && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                        Archived
                      </span>
                    )}
                  </div>
                  {isMdx && !isArchived && (
                    <span className="text-[11px] text-slate-400 truncate block">
                      {row.filePath}
                    </span>
                  )}
                  {isArchived && row.redirectTarget && (
                    <span className="text-[10px] text-slate-400 truncate block">
                      301 → {row.redirectTarget}
                    </span>
                  )}
                </td>

                {/* Market */}
                <td className="px-3 py-3">
                  <MarketBadge market={row.market} />
                </td>

                {/* Category */}
                <td className="px-3 py-3">
                  <CategoryBadge category={row.category} />
                </td>

                {/* SEO Title */}
                <td className="px-3 py-3 max-w-[220px]">
                  <span className="text-xs text-slate-700 line-clamp-2" title={row.seoTitle}>
                    {row.seoTitle || <span className="text-red-400 italic">missing</span>}
                  </span>
                </td>

                {/* CTA Partner */}
                <td className="px-3 py-3 min-w-[160px]">
                  <CtaPartnerSelect
                    pageUrl={row.url}
                    assignedPartners={assignedPartners}
                    availablePartners={available}
                  />
                </td>

                {/* Word Count */}
                <td className="px-3 py-3 text-right">
                  <span className="text-xs text-slate-600 tabular-nums font-mono">
                    {row.wordCount > 0 ? row.wordCount.toLocaleString('en-US') : '—'}
                  </span>
                </td>

                {/* Size */}
                <td className="px-3 py-3 text-right">
                  <span className="text-xs text-slate-500 tabular-nums font-mono">
                    {row.sizeKB > 0 ? `${row.sizeKB} KB` : '—'}
                  </span>
                </td>

                {/* Content Quality */}
                <td className="px-3 py-3 text-center">
                  <QualityBadge quality={row.contentQuality} />
                </td>

                {/* CPS Score */}
                <td className="px-3 py-3 text-center">
                  <CpsBadge cps={row.cpsScore} />
                </td>

                {/* BL (Backlinks) */}
                <td className="px-3 py-3 text-center">
                  <BacklinkBadge
                    count={row.backlinkCount}
                    new30d={row.backlinkNew30d}
                    onClick={() => setSelectedUrl(row.url)}
                  />
                </td>

                {/* SEO Status */}
                <td className="px-3 py-3">
                  <SeoDetail seoHealth={row.seoHealth} />
                </td>

                {/* Index Status */}
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {row.indexStatus}
                  </span>
                </td>

                {/* Action */}
                <td className="px-3 py-3">
                  {isArchived && row.archivedPageId ? (
                    <div className="flex items-center gap-1">
                      {confirmRestoreId === row.archivedPageId ? (
                        <>
                          <button
                            onClick={() => handleRestore(row.archivedPageId!)}
                            disabled={restoringId === row.archivedPageId}
                            className="px-2 py-1 rounded text-[10px] font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition-all"
                          >
                            {restoringId === row.archivedPageId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : 'Yes'}
                          </button>
                          <button
                            onClick={() => setConfirmRestoreId(null)}
                            className="px-2 py-1 rounded text-[10px] font-semibold text-slate-500 bg-slate-100"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setConfirmRestoreId(row.archivedPageId!)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            title="Restore page"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </button>
                          <button
                            onClick={() => setHardDeleteTarget(row)}
                            disabled={!row.canHardDelete}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title={row.canHardDelete ? 'Permanently delete' : `Available in ${row.daysUntilHardDelete}d`}
                          >
                            <Trash2 className="h-3 w-3" />
                            {row.canHardDelete ? 'Delete' : `${row.daysUntilHardDelete}d`}
                          </button>
                        </>
                      )}
                    </div>
                  ) : isMdx ? (
                    <button
                      onClick={() => setArchiveTarget(row)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-colors"
                      title="Archive page"
                    >
                      <Archive className="h-3 w-3" />
                      Archive
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-300">—</span>
                  )}
                </td>
              </tr>
            </ContextMenuTrigger>

            {/* ── Right-Click Context Menu ───────────────────────── */}
            <ContextMenuContent className="w-48">
              <ContextMenuLabel>{row.url.split('/').pop()}</ContextMenuLabel>
              <ContextMenuSeparator />
              {isMdx && !isArchived && (
                <ContextMenuItem onClick={() => setArchiveTarget(row)}>
                  <Archive className="h-4 w-4 text-amber-500" />
                  Archive Page
                </ContextMenuItem>
              )}
              {isArchived && row.archivedPageId && (
                <>
                  <ContextMenuItem onClick={() => setConfirmRestoreId(row.archivedPageId!)}>
                    <RotateCcw className="h-4 w-4 text-emerald-500" />
                    Restore Page
                  </ContextMenuItem>
                  <ContextMenuItem
                    disabled={!row.canHardDelete}
                    onClick={() => { if (row.canHardDelete) setHardDeleteTarget(row); }}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {row.canHardDelete ? 'Hard Delete' : `Hard Delete (${row.daysUntilHardDelete}d)`}
                  </ContextMenuItem>
                </>
              )}
              {(isMdx || isArchived) && <ContextMenuSeparator />}
              <ContextMenuItem onClick={() => {
                if (selectedUrls.size > 0 && selectedUrls.has(row.url)) {
                  // Batch: copy all selected URLs
                  const urls = Array.from(selectedUrls).map(u => `${siteUrl}${u}`).join('\n');
                  copyToClipboard(urls);
                } else {
                  // Single: copy this row's URL
                  copyUrl(row.url);
                }
              }}>
                <Copy className="h-4 w-4" />
                {selectedUrls.size > 0 && selectedUrls.has(row.url)
                  ? `Copy ${selectedUrls.size} URLs`
                  : 'Copy URL'}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => window.open(`${siteUrl}${row.url}`, '_blank')}>
                <SquareArrowOutUpRight className="h-4 w-4" />
                Open in New Tab
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
      {rows.length === 0 && (
        <tr>
          <td colSpan={14} className="px-4 py-12 text-center text-sm text-slate-400">
            No pages match this filter.
          </td>
        </tr>
      )}
    </tbody>
    </table>
    </div>

    {/* ── Dialogs ───────────────────────────────────────────────── */}
    {selectedUrl && (
      <BacklinkDetailDialog
        url={selectedUrl}
        open={!!selectedUrl}
        onOpenChange={(open: boolean) => { if (!open) setSelectedUrl(null); }}
      />
    )}
    {/* Single archive */}
    {archiveTarget && !batchArchiveOpen && (
      <ArchivePageDialog
        open={!!archiveTarget}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
        page={toPageInfo(archiveTarget)}
      />
    )}
    {/* Batch archive */}
    {batchArchiveOpen && batchPages.length > 0 && (
      <ArchivePageDialog
        open={batchArchiveOpen}
        onOpenChange={(open) => {
          setBatchArchiveOpen(open);
          if (!open) setSelectedUrls(new Set());
        }}
        page={batchPages[0]}
        batchPages={batchPages}
      />
    )}
    {hardDeleteTarget && hardDeleteTarget.archivedPageId && (
      <HardDeleteDialog
        open={!!hardDeleteTarget}
        onOpenChange={(open) => { if (!open) setHardDeleteTarget(null); }}
        archivedPage={{
          id: hardDeleteTarget.archivedPageId,
          pageUrl: hardDeleteTarget.url,
          slug: hardDeleteTarget.url.split('/').pop() || '',
          title: hardDeleteTarget.seoTitle || hardDeleteTarget.title,
          archivedAt: hardDeleteTarget.archivedAt || '',
        }}
      />
    )}
    </>
  );
}
