// components/dashboard/backlink-detail-dialog.tsx — Backlink detail popup for Content Hub
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ExternalLink,
  Search,
  Copy,
  Download,
  Check,
  ArrowUpDown,
  Link2,
  AlertCircle,
} from 'lucide-react';
import type { Backlink } from '@/lib/types/backlink';

interface BacklinkDetailDialogProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SortKey = 'source_domain' | 'anchor_text' | 'first_seen_at' | 'last_seen_at' | 'link_type';
type SortDir = 'asc' | 'desc';

export default function BacklinkDetailDialog({ url, open, onOpenChange }: BacklinkDetailDialogProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('last_seen_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Fetch backlinks when dialog opens
  useEffect(() => {
    if (!open || !url) return;
    setLoading(true);
    setError(null);
    setSelected(new Set());

    fetch(`/api/backlinks?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        setBacklinks(data.backlinks || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, [open, url]);

  // Filter + Sort
  const filtered = useMemo(() => {
    let items = backlinks;

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) =>
          b.source_url.toLowerCase().includes(q) ||
          b.source_domain.toLowerCase().includes(q) ||
          b.anchor_text.toLowerCase().includes(q)
      );
    }

    items = [...items].sort((a, b) => {
      const aVal = a[sortKey] || '';
      const bVal = b[sortKey] || '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [backlinks, search, sortKey, sortDir]);

  const activeCount = backlinks.filter((b) => !b.is_lost).length;
  const lostCount = backlinks.filter((b) => b.is_lost).length;
  const externalCount = backlinks.filter((b) => b.link_type === 'external' && !b.is_lost).length;
  const internalCount = backlinks.filter((b) => b.link_type === 'internal' && !b.is_lost).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Toggle sort
  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }, [sortKey]);

  // Select all
  const toggleAll = useCallback(() => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((b) => b.id)));
    }
  }, [filtered, selected.size]);

  // Toggle single
  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Copy selected URLs
  const copySelected = useCallback(() => {
    const urls = filtered
      .filter((b) => selected.has(b.id))
      .map((b) => b.source_url)
      .join('\n');

    if (!urls) return;
    navigator.clipboard.writeText(urls).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [filtered, selected]);

  // Export CSV
  const exportCsv = useCallback(() => {
    const header = 'Source URL,Source Domain,Anchor Text,Link Type,Rel,First Seen,Last Seen,Status\n';
    const csvRows = filtered.map((b) =>
      [
        `"${b.source_url}"`,
        `"${b.source_domain}"`,
        `"${(b.anchor_text || '').replace(/"/g, '""')}"`,
        b.link_type,
        b.rel_attributes || 'dofollow',
        b.first_seen_at?.slice(0, 10) || '',
        b.last_seen_at?.slice(0, 10) || '',
        b.is_lost ? 'lost' : 'active',
      ].join(',')
    );
    const csv = header + csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backlinks${url.replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [filtered, url]);

  // Sortable column header
  function SortHeader({ label, col }: { label: string; col: SortKey }) {
    return (
      <button
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === col ? 'text-violet-500' : 'text-slate-300'}`} />
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Link2 className="h-5 w-5 text-violet-500" />
            Backlinks for {url}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="inline-flex items-center gap-4 text-xs">
              <span className="font-medium text-emerald-600">{activeCount} active</span>
              <span className="text-red-500">{lostCount} lost</span>
              <span className="text-slate-400">({externalCount} external · {internalCount} internal)</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by URL, domain, or anchor text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
            />
          </div>
          <button
            onClick={copySelected}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : `Copy${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </button>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-slate-500">Loading backlinks...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 mr-2" />
              Failed to load backlinks
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400">
              <Link2 className="h-8 w-8 mb-2 text-slate-300" />
              {backlinks.length === 0
                ? 'No backlinks yet — Import from GSC or run internal scan'
                : 'No backlinks match your filter'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SortHeader label="Source" col="source_domain" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SortHeader label="Anchor" col="anchor_text" />
                  </th>
                  <th className="px-3 py-2 text-center">
                    <SortHeader label="Type" col="link_type" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SortHeader label="First Seen" col="first_seen_at" />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <SortHeader label="Last Seen" col="last_seen_at" />
                  </th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const isNew = b.first_seen_at && new Date(b.first_seen_at) >= thirtyDaysAgo;
                  const relBadge = !b.rel_attributes || b.rel_attributes === ''
                    ? 'dofollow'
                    : b.rel_attributes;

                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                        b.is_lost ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(b.id)}
                          onChange={() => toggleOne(b.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-3 py-2 max-w-[260px]">
                        <a
                          href={b.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 hover:text-violet-800 truncate block text-xs"
                          title={b.source_url}
                        >
                          {b.source_domain}
                          <ExternalLink className="inline-block ml-1 h-2.5 w-2.5 opacity-50" />
                        </a>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {b.source_url.replace(/^https?:\/\//, '').slice(0, 60)}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[180px]">
                        <span className="text-xs text-slate-600 truncate block" title={b.anchor_text}>
                          {b.anchor_text || <span className="text-slate-300 italic">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          b.link_type === 'internal'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {b.link_type === 'internal' ? 'INT' : 'EXT'}
                        </span>
                        {relBadge !== 'dofollow' && (
                          <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            relBadge.includes('nofollow')
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {relBadge.includes('nofollow') ? 'NF' : relBadge.slice(0, 3).toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                        {b.first_seen_at?.slice(0, 10) || '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                        {b.last_seen_at?.slice(0, 10) || '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {b.is_lost ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-50 text-red-600 border border-red-200">
                            LOST
                          </span>
                        ) : isNew ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                            NEW
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-50 text-slate-500">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>
            {filtered.length} backlink{filtered.length !== 1 ? 's' : ''} shown
            {search && ` (filtered from ${backlinks.length})`}
          </span>
          <span>
            {selected.size > 0 && `${selected.size} selected · `}
            Data source: GSC CSV + Internal Scan
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
