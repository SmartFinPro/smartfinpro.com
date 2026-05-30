'use client';

// Saved Views control (SP2 · Slice 1) — generic, per-route.
// Talks to /api/dashboard/saved-views via fetch (NOT a direct 'use server'
// import — keeps Turbopack's client/server boundary clean). Apply/Save operate
// purely on the page's existing query-params; no new filter model.
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Bookmark, ChevronDown, Plus, Trash2 } from 'lucide-react';

interface SavedView {
  id: string;
  route: string;
  name: string;
  params: Record<string, string>;
  is_default: boolean;
  created_at: string;
}

export function SavedViews() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/saved-views?route=${encodeURIComponent(pathname)}`);
      const json = await res.json();
      setViews(json?.success ? (json.data ?? []) : []);
    } catch {
      setViews([]);
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  // Load views when the dropdown opens.
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const applyView = (view: SavedView) => {
    const sp = new URLSearchParams(view.params);
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  const saveCurrent = async () => {
    const name = window.prompt('Name für diese View:')?.trim();
    if (!name) return;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setSaving(true);
    try {
      await fetch('/api/dashboard/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: pathname, name, params }),
      });
      await load();
    } catch {
      /* non-critical — control just won't update */
    } finally {
      setSaving(false);
    }
  };

  const deleteView = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/dashboard/saved-views?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await load();
    } catch {
      /* non-critical */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        aria-label="Saved views"
      >
        <Bookmark className="h-4 w-4 dash-tone-text-navy" />
        <span>Views</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
          <div className="py-1 max-h-72 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-2 text-sm text-slate-400">Lädt…</p>
            ) : views.length === 0 ? (
              <p className="px-4 py-2 text-sm text-slate-400">Noch keine gespeicherten Views</p>
            ) : (
              views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => applyView(view)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 group"
                >
                  <span className="truncate">{view.name}</span>
                  <Trash2
                    className="h-3.5 w-3.5 text-slate-300 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => deleteView(view.id, e)}
                  />
                </button>
              ))
            )}
          </div>
          <div className="border-t border-slate-100 py-1">
            <button
              onClick={saveCurrent}
              disabled={saving}
              className="w-full text-left px-4 py-2 text-sm font-medium dash-tone-text-navy hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {saving ? 'Speichert…' : 'Aktuelle Filter speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
