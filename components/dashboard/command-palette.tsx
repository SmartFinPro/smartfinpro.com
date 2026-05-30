'use client';

// components/dashboard/command-palette.tsx
//
// Global Command Palette (Cmd+K / Ctrl+K) for the SmartFinPro dashboard.
//
// Self-contained: mounts once (anywhere inside the dashboard tree), installs a
// global key listener, and renders nothing until opened. The parent layout
// only needs `<CommandPalette />` — no props.
//
// - Cmd+K (mac) / Ctrl+K opens · Esc closes
// - "Pages" group is built client-side from the dashboard nav routes
// - DB-backed groups (links / content / keywords / competitors) come from
//   /api/dashboard/search via a ~200ms debounced fetch
// - ArrowUp/Down move through the flat result list, Enter navigates, hover/click works
// - Light enterprise trust design: bg-white, slate borders, navy/gold accents

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Link2,
  FileText,
  KeyRound,
  Radar,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type ResultType = 'page' | 'link' | 'content' | 'keyword' | 'competitor';

interface PaletteResult {
  type: ResultType;
  label: string;
  sub?: string;
  href: string;
}

interface ApiGroups {
  links?: Omit<PaletteResult, 'type'>[];
  content?: Omit<PaletteResult, 'type'>[];
  keywords?: Omit<PaletteResult, 'type'>[];
  competitors?: Omit<PaletteResult, 'type'>[];
}

// ── Static "Pages" group — mirrors the dashboard sidebar nav ────────────────
const NAV_PAGES: { label: string; href: string }[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'CTA Heatmap', href: '/dashboard/analytics/heatmap' },
  { label: 'AI-Optimizer', href: '/dashboard/analytics/optimize' },
  { label: 'Revenue', href: '/dashboard/revenue' },
  { label: 'Content Hub', href: '/dashboard/content/hub' },
  { label: 'Auto-Genesis', href: '/dashboard/content/genesis' },
  { label: 'Approval Queue', href: '/dashboard/content/planning' },
  { label: 'Ranking Tracker', href: '/dashboard/ranking' },
  { label: 'Competitor Radar', href: '/dashboard/competitors' },
  { label: 'Keyword Gaps', href: '/dashboard/competitors/gaps' },
  { label: 'Backlink Automation', href: '/dashboard/backlinks' },
  { label: 'Affiliate Links', href: '/dashboard/links' },
  { label: 'Funnel', href: '/dashboard/funnel' },
  { label: 'Opportunities', href: '/dashboard/opportunities' },
  { label: 'A/B Testing', href: '/dashboard/ab-testing' },
  { label: 'Quiz Analytics', href: '/dashboard/quiz' },
  { label: 'Money Leak Scanner', href: '/dashboard/tools/money-leak' },
  { label: 'Compliance Audit', href: '/dashboard/compliance' },
  { label: 'Web Vitals', href: '/dashboard/web-vitals' },
  { label: 'Autonomous', href: '/dashboard/autonomous' },
  { label: 'Cron Health', href: '/dashboard/cron-health' },
  { label: 'Audit Log', href: '/dashboard/audit-log' },
  { label: 'Notifications', href: '/dashboard/notifications' },
  { label: 'Settings', href: '/dashboard/settings' },
];

// ── Group metadata (label + icon per result type) ───────────────────────────
const GROUP_META: Record<
  ResultType,
  { label: string; icon: LucideIcon }
> = {
  page: { label: 'Seiten', icon: LayoutDashboard },
  link: { label: 'Affiliate-Links', icon: Link2 },
  content: { label: 'Content', icon: FileText },
  keyword: { label: 'Keywords', icon: KeyRound },
  competitor: { label: 'Wettbewerber', icon: Radar },
};

const GROUP_ORDER: ResultType[] = [
  'page',
  'link',
  'content',
  'keyword',
  'competitor',
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dbGroups, setDbGroups] = useState<ApiGroups>({});
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Element focused before the palette opened — restored on close.
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // ── Open / close helpers ───────────────────────────────────────────────────
  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDbGroups({});
    setActiveIndex(0);
  }, []);

  const openPalette = useCallback(() => {
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    setOpen(true);
  }, []);

  // ── Global hotkey: Cmd+K / Ctrl+K ──────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isToggle =
        (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isToggle) {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            restoreFocusRef.current =
              (document.activeElement as HTMLElement) ?? null;
          }
          return !prev;
        });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Autofocus input + restore focus on close ────────────────────────────────
  useEffect(() => {
    if (open) {
      // Defer focus until the input is mounted.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    // Restore focus to the element that was active before opening.
    restoreFocusRef.current?.focus?.();
    return undefined;
  }, [open]);

  // ── Debounced DB search (~200ms) ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setDbGroups({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dashboard/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setDbGroups({});
          return;
        }
        const data = (await res.json()) as { groups?: ApiGroups };
        setDbGroups(data.groups ?? {});
      } catch {
        // Aborted or network error — keep last results minimal.
        setDbGroups({});
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [query, open]);

  // ── Client-side Pages filter ────────────────────────────────────────────────
  const pageResults: PaletteResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? NAV_PAGES.filter((p) => p.label.toLowerCase().includes(q))
      : NAV_PAGES;
    return matches.map((p) => ({ type: 'page' as const, ...p }));
  }, [query]);

  // ── Build the grouped + flat result model ───────────────────────────────────
  const grouped = useMemo(() => {
    const map: Record<ResultType, PaletteResult[]> = {
      page: pageResults,
      link: (dbGroups.links ?? []).map((r) => ({ type: 'link' as const, ...r })),
      content: (dbGroups.content ?? []).map((r) => ({
        type: 'content' as const,
        ...r,
      })),
      keyword: (dbGroups.keywords ?? []).map((r) => ({
        type: 'keyword' as const,
        ...r,
      })),
      competitor: (dbGroups.competitors ?? []).map((r) => ({
        type: 'competitor' as const,
        ...r,
      })),
    };
    return map;
  }, [pageResults, dbGroups]);

  // Flat list (group order) for keyboard navigation + index lookup.
  const flatResults = useMemo(() => {
    const flat: PaletteResult[] = [];
    for (const type of GROUP_ORDER) flat.push(...grouped[type]);
    return flat;
  }, [grouped]);

  // Clamp the active index whenever the result set changes.
  useEffect(() => {
    setActiveIndex((i) =>
      flatResults.length === 0 ? 0 : Math.min(i, flatResults.length - 1),
    );
  }, [flatResults.length]);

  const navigateTo = useCallback(
    (href: string) => {
      closePalette();
      router.push(href);
    },
    [closePalette, router],
  );

  // ── Keyboard navigation within the modal ────────────────────────────────────
  const onModalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) =>
          flatResults.length === 0 ? 0 : (i + 1) % flatResults.length,
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) =>
          flatResults.length === 0
            ? 0
            : (i - 1 + flatResults.length) % flatResults.length,
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const target = flatResults[activeIndex];
        if (target) navigateTo(target.href);
        return;
      }
      // Tab focus-trap: keep focus on the search input (the only focusable
      // control), so focus never escapes the dialog.
      if (e.key === 'Tab') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    },
    [flatResults, activeIndex, closePalette, navigateTo],
  );

  // Keep the active row scrolled into view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-result-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  if (!open) return null;

  const hasResults = flatResults.length > 0;
  // Running offset so each row gets a stable flat index for nav/highlight.
  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      aria-hidden={false}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Schließen"
        tabIndex={-1}
        onClick={closePalette}
        className="absolute inset-0 cursor-default bg-[var(--sfp-ink)]/30 backdrop-blur-[1px]"
      />

      {/* Spotlight panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Befehlspalette"
        onKeyDown={onModalKeyDown}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-[var(--sfp-ink)]/20 ring-1 ring-black/5"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search
            className="h-5 w-5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-label="Suchen"
            spellCheck={false}
            autoComplete="off"
            placeholder="Seiten, Links, Content, Keywords, Wettbewerber suchen…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            className="w-full bg-transparent py-4 text-[15px] text-[var(--sfp-ink)] placeholder:text-slate-400 focus:outline-none"
          />
          {loading && (
            <span
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--sfp-navy)]"
              aria-hidden="true"
            />
          )}
          <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 sm:inline-block">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          aria-label="Suchergebnisse"
          className="max-h-[58vh] overflow-y-auto overscroll-contain py-2"
        >
          {!hasResults && (
            <div className="px-4 py-10 text-center">
              {loading ? (
                <p className="text-sm text-slate-400">Suche läuft…</p>
              ) : query.trim().length < 2 ? (
                <p className="text-sm text-slate-400">
                  Tippe mindestens 2 Zeichen, um zu suchen.
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Keine Treffer für{' '}
                  <span className="font-medium text-slate-500">
                    “{query.trim()}”
                  </span>
                  .
                </p>
              )}
            </div>
          )}

          {hasResults &&
            GROUP_ORDER.map((type) => {
              const items = grouped[type];
              if (items.length === 0) return null;
              const meta = GROUP_META[type];
              const GroupIcon = meta.icon;

              return (
                <div key={type} className="mb-1 last:mb-0">
                  <div className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {meta.label}
                  </div>
                  {items.map((item) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const isActive = idx === activeIndex;
                    return (
                      <div
                        key={`${type}-${item.href}-${item.label}`}
                        data-result-index={idx}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => navigateTo(item.href)}
                        className={`mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                          isActive
                            ? 'bg-[var(--sfp-sky)]'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                            isActive
                              ? 'border-[var(--sfp-navy)]/20 bg-white text-[var(--sfp-navy)]'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          <GroupIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--sfp-ink)]">
                            {item.label}
                          </span>
                          {item.sub && (
                            <span className="block truncate text-xs text-slate-400">
                              {item.sub}
                            </span>
                          )}
                        </span>
                        {isActive && (
                          <CornerDownLeft
                            className="h-4 w-4 shrink-0 text-[var(--sfp-navy)]/60"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
            <ArrowDown className="h-3 w-3" aria-hidden="true" />
            navigieren
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
            öffnen
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-medium">
              esc
            </kbd>
            schließen
          </span>
        </div>
      </div>
    </div>
  );
}
