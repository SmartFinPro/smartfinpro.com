'use client';
// components/research/ResearchLibrary.tsx
// Research Library — the interactive discovery SHELL (plan §3/§12, step 4).
//
// RSC pattern: ResearchCard is a Server Component (it reads the filesystem for
// logos), so this client shell never renders a card itself — the server renders
// every card to a ReactNode and hands it here as `items[].node` (+ `featuredNode`
// for the #1 card). The shell only orchestrates VISIBILITY, URL-state and the
// shortlist over those opaque nodes, filtering on the parallel `meta`.
//
// Honesty/scope guardrails baked in here:
//   - The shell owns NO comparison logic: no cost model, no table, no ranking.
//     "Compare in the cockpit" only builds a handoff URL the Cockpit consumes
//     (?compare=a,b,c&view=compare — verified against comparison-cockpit.tsx's
//     applyUrlInit). All compare rendering stays in the Cockpit.
//   - The Featured Winner Dossier shows ONLY in the default (unfiltered) browse
//     state. The moment a search or filter is active, every match — including
//     the #1 — renders as a normal card in a uniform grid (a pinned winner over
//     a "provisional"/"eToro" search would read as an ad / a broken result).
//   - Filters render ONLY when they actually differentiate the current data
//     (>1 distinct value): status, confidence, freshness. Category (one value
//     in this pilot) and a "BEST-X 8+" threshold are deliberately omitted.
//   - useSearchParams lives under a <Suspense> boundary in the page, so
//     /research stays statically prerenderable; search writes are debounced via
//     router.replace, filter toggles via router.push.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, GitCompare, SlidersHorizontal } from 'lucide-react';
import {
  MAX_SHORTLIST,
  buildCompareUrl,
  computeFacets,
  hasActiveFilters,
  matchesFilters,
  restoreShortlist,
  toggleShortlist as toggleShortlistSet,
  type ResearchLibraryItemMeta,
} from '@/lib/research/shell-logic';

// Re-exported so page.tsx (which builds `items` with this shape) keeps its path.
export type { ResearchLibraryItemMeta };

export interface ResearchLibraryItem {
  meta: ResearchLibraryItemMeta;
  /** Standard-card render of this product (used in the grid + filtered view). */
  node: ReactNode;
  /** Featured "Winner Dossier" render — present only on the #1 audited card. */
  featuredNode?: ReactNode;
}

export interface ResearchLibraryProps {
  items: ResearchLibraryItem[];
  featuredSlug: string | null;
  /** Cockpit base for the compare handoff, e.g. /us/trading/best/trading-platforms */
  compareBaseHref: string;
  /** sessionStorage key for the shortlist, e.g. research-shortlist:us:trading-platforms.
   *  Session-scoped (not the URL, not localStorage) — survives the Cockpit
   *  round-trip + Back, clears when the browser session ends. */
  storageKey: string;
}

const STATUS_LABEL: Record<ResearchLibraryItemMeta['status'], string> = {
  audited: 'Audited',
  provisional: 'In verification',
  unavailable: 'Unavailable',
};
const CONFIDENCE_LABEL: Record<'high' | 'medium' | 'low', string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** A row of exclusive-ish toggle chips for one filter dimension. Clicking the
 *  active chip clears the filter. */
function FilterChips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { v: string; l: string }[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
        {label}
      </span>
      {options.map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : opt.v)}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            style={
              active
                ? { background: 'var(--sfp-navy)', color: '#ffffff' }
                : { background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }
            }
          >
            {opt.l}
          </button>
        );
      })}
    </div>
  );
}

/** Wraps a server-rendered card node and adds the shortlist toggle (a corner
 *  pill in the grid gutter, so it never overlaps the card's own design) plus a
 *  navy selection ring. */
function SelectableCard({
  slug,
  name,
  node,
  selected,
  atCapacity,
  onToggle,
}: {
  slug: string;
  name: string;
  node: ReactNode;
  selected: boolean;
  atCapacity: boolean;
  onToggle: (slug: string) => void;
}) {
  const disabled = atCapacity && !selected;
  return (
    <div
      className="relative"
      style={selected ? { boxShadow: '0 0 0 2px var(--sfp-navy)', borderRadius: 18 } : undefined}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-label={
          disabled
            ? `Shortlist full — remove one to add ${name} (maximum 4 products)`
            : selected
              ? `Remove ${name} from shortlist`
              : `Add ${name} to shortlist`
        }
        title={disabled ? 'Maximum 4 products' : undefined}
        disabled={disabled}
        onClick={() => onToggle(slug)}
        className="absolute -right-2.5 -top-2.5 z-10 inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        style={
          selected
            ? { background: 'var(--sfp-navy)', color: '#ffffff' }
            : { background: '#ffffff', color: 'var(--sfp-navy)', border: '1px solid var(--sfp-navy)' }
        }
      >
        {selected ? '✓ Shortlisted' : '+ Shortlist'}
      </button>
      {node}
    </div>
  );
}

export function ResearchLibrary({ items, featuredSlug, compareBaseHref, storageKey }: ResearchLibraryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const urlQ = sp.get('q') ?? '';
  const status = sp.get('status');
  const confidence = sp.get('confidence');
  const fresh = sp.get('fresh');

  // Search input is controlled locally for instant filtering; the URL is
  // updated (debounced, replace) for shareability + Back. When the URL's `q`
  // changes — our own debounced write OR a Back/forward navigation — re-sync the
  // input to it during render (React's recommended alternative to a
  // setState-in-effect: no cascading-render lint violation, concurrent-safe).
  const [query, setQuery] = useState(urlQ);
  const [syncedUrlQ, setSyncedUrlQ] = useState(urlQ);
  if (urlQ !== syncedUrlQ) {
    setSyncedUrlQ(urlQ);
    setQuery(urlQ);
  }

  useEffect(() => {
    const current = sp.get('q') ?? '';
    const nextQ = query.trim();
    if (nextQ === current) return;
    const id = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (nextQ) params.set('q', nextQ);
      else params.delete('q');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [query, sp, pathname, router]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [sp, pathname, router],
  );

  const resetAll = useCallback(() => {
    setQuery('');
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  // ── Facets: only offer a filter dimension that actually differentiates ────
  const facets = useMemo(() => computeFacets(items.map((i) => i.meta)), [items]);
  const showStatus = facets.statuses.length > 1;
  const showConfidence = facets.confidences.length > 1;
  const showFreshness = facets.freshnessDates.length > 1;

  // ── Filtering (pure predicate lives in lib/research/shell-logic) ──────────
  const isActive = hasActiveFilters({ query, status, confidence, fresh });
  const filtered = useMemo(
    () => items.filter((i) => matchesFilters(i.meta, { query, status, confidence, fresh })),
    [items, query, status, confidence, fresh],
  );

  // ── Shortlist (session state, not URL) ────────────────────────────────────
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false); // mobile "Edit" names sheet
  const toggleShortlist = useCallback((slug: string) => {
    setShortlist((prev) => toggleShortlistSet(prev, slug));
  }, []);

  // Restore the shortlist from sessionStorage on mount so it survives the
  // Cockpit round-trip + Back (empty on the server → set after mount, so no
  // hydration mismatch). Validated against the current items + capped at MAX.
  // ORDER HAZARD: this restore effect MUST stay declared BEFORE the persist
  // effect below. On mount it reads storage and setShortlist(...) before the
  // persist effect's stale (empty) closure would write "[]"; render #2 then
  // re-persists the restored set. Swapping the two silently makes the shortlist
  // stop surviving the Cockpit round-trip.
  useEffect(() => {
    const restored = restoreShortlist(sessionStorage.getItem(storageKey), items.map((i) => i.meta.slug));
    if (restored.length) setShortlist(new Set(restored));
    // Restore once for this storageKey; items is stable for the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist on every change (session-scoped). MUST stay declared AFTER the
  // restore effect above (see ORDER HAZARD).
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...shortlist]));
    } catch {
      /* storage blocked — shortlist still works in-memory this session */
    }
  }, [shortlist, storageKey]);

  // The fixed shortlist bar overlays the bottom of the VIEWPORT, so an
  // in-component spacer can't protect the affiliate-disclosure section that
  // FOLLOWS this one (CLAUDE.md: disclosure visibility is non-negotiable).
  // Pad the whole document instead, so every section below — the disclosure
  // included — scrolls clear of the bar. Reverted when the bar disappears.
  useEffect(() => {
    if (shortlist.size === 0) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '96px';
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [shortlist.size]);

  // If the shortlist empties (e.g. chips removed one-by-one in the mobile Edit
  // sheet), collapse the sheet so the bar never remounts pre-expanded.
  // Render-time reset — conditional + self-terminating, so it's lint-safe.
  if (shortlist.size === 0 && sheetOpen) setSheetOpen(false);

  const slugs = useMemo(() => [...shortlist], [shortlist]);
  const nameFor = useCallback((slug: string) => items.find((i) => i.meta.slug === slug)?.meta.name ?? slug, [items]);
  // buildCompareUrl (shell-logic) requires >=2 slugs and lands on #comparison so
  // the Cockpit opens on the compare surface, not the hero.
  const compareUrl = buildCompareUrl(compareBaseHref, slugs);

  const wrap = (item: ResearchLibraryItem, node: ReactNode) => (
    <SelectableCard
      key={item.meta.slug}
      slug={item.meta.slug}
      name={item.meta.name}
      node={node}
      selected={shortlist.has(item.meta.slug)}
      atCapacity={shortlist.size >= MAX_SHORTLIST}
      onToggle={toggleShortlist}
    />
  );

  const featuredItem = featuredSlug ? items.find((i) => i.meta.slug === featuredSlug) : null;
  const restItems = featuredItem ? items.filter((i) => i.meta.slug !== featuredItem.meta.slug) : items;

  return (
    <div>
      {/* Toolbar: search + differentiating filters */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--sfp-slate)' }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search platforms…"
            aria-label="Search trading platforms"
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--sfp-navy)]"
            style={{ borderColor: 'var(--sfp-hairline)', background: '#ffffff', color: 'var(--sfp-ink)' }}
          />
        </div>

        {(showStatus || showConfidence || showFreshness) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <SlidersHorizontal size={15} aria-hidden="true" style={{ color: 'var(--sfp-slate)' }} />
            {showStatus && (
              <FilterChips
                label="Status"
                value={status}
                onChange={(v) => setParam('status', v)}
                options={facets.statuses.map((s) => ({ v: s, l: STATUS_LABEL[s] }))}
              />
            )}
            {showConfidence && (
              <FilterChips
                label="Confidence"
                value={confidence}
                onChange={(v) => setParam('confidence', v)}
                options={facets.confidences.map((c) => ({ v: c, l: CONFIDENCE_LABEL[c] }))}
              />
            )}
            {showFreshness && (
              <FilterChips
                label="Verified since"
                value={fresh}
                onChange={(v) => setParam('fresh', v)}
                options={facets.freshnessDates.map((d) => ({ v: d, l: formatDate(d) }))}
              />
            )}
          </div>
        )}

        {/* Permanently-mounted SR live region — a live region that first mounts
            already-populated is often NOT announced, so keep it in the tree and
            only mutate its text. The visible count below is aria-hidden to
            avoid a double announcement. */}
        <span className="sr-only" role="status" aria-live="polite">
          {isActive ? `${filtered.length} ${filtered.length === 1 ? 'platform matches' : 'platforms match'} your search` : ''}
        </span>

        {isActive && (
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--sfp-slate)' }}>
            <span aria-hidden="true">
              {filtered.length} {filtered.length === 1 ? 'platform' : 'platforms'}
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 font-semibold hover:underline"
              style={{ color: 'var(--sfp-navy)' }}
            >
              <X size={13} aria-hidden="true" />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Results. Default (browse) = Winner Dossier + grid. Active = uniform grid. */}
      {!isActive ? (
        <>
          {featuredItem?.featuredNode && <div className="mb-6">{wrap(featuredItem, featuredItem.featuredNode)}</div>}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {restItems.map((item) => wrap(item, item.node))}
          </div>
        </>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">{filtered.map((item) => wrap(item, item.node))}</div>
      ) : (
        <div
          className="rounded-xl border border-dashed px-6 py-16 text-center"
          style={{ borderColor: 'var(--sfp-hairline)', color: 'var(--sfp-slate)' }}
        >
          <p className="text-sm">No platforms match your search or filters.</p>
          <button type="button" onClick={resetAll} className="mt-2 text-sm font-semibold hover:underline" style={{ color: 'var(--sfp-navy)' }}>
            Clear all filters
          </button>
        </div>
      )}

      {/* Sticky Research Shortlist bar — hands the selection to the Cockpit.
          Desktop shows the name chips inline; mobile stays a single-line action
          bar (count · Edit · Compare) and reveals the names in an "Edit" sheet
          so a full shortlist never buries card content behind a tall bar. */}
      {shortlist.size > 0 &&
        (() => {
          const chip = (slug: string) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
            >
              {nameFor(slug)}
              <button type="button" aria-label={`Remove ${nameFor(slug)} from shortlist`} onClick={() => toggleShortlist(slug)} className="inline-flex">
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          );
          const clearAll = () => {
            setShortlist(new Set());
            setSheetOpen(false);
          };
          const compareCta = compareUrl ? (
            <a
              href={compareUrl}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
              style={{ background: 'var(--sfp-navy)', color: '#ffffff', textDecoration: 'none' }}
            >
              <GitCompare size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Compare in the cockpit</span>
              <span className="sm:hidden">Compare</span>
            </a>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
              style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}
              aria-disabled="true"
            >
              <GitCompare size={15} aria-hidden="true" />
              Add one more to compare
            </span>
          );

          return (
            // Bottom clearance is handled by document body padding-bottom (see
            // the effect above) so the disclosure section below never hides
            // behind this fixed bar.
            <div
              className="fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-4px_24px_rgba(27,79,140,0.10)]"
                style={{ background: '#ffffff', borderColor: 'var(--sfp-hairline)' }}
                role="region"
                aria-label="Research shortlist"
              >
                {/* Mobile "Edit" sheet — the names, revealed above the bar */}
                {sheetOpen && (
                  <div className="border-b px-6 py-3 sm:hidden" style={{ borderColor: 'var(--sfp-hairline)' }}>
                    <div className="flex flex-wrap gap-1.5">{slugs.map(chip)}</div>
                  </div>
                )}
                <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-6 py-3">
                  <span className="whitespace-nowrap text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                    Shortlist
                    <span className="ml-1 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      {shortlist.size}/{MAX_SHORTLIST}
                    </span>
                  </span>

                  {/* Desktop: chips inline */}
                  <div className="hidden flex-wrap gap-1.5 sm:flex">{slugs.map(chip)}</div>

                  {/* Mobile: Edit toggles the names sheet */}
                  <button
                    type="button"
                    onClick={() => setSheetOpen((o) => !o)}
                    aria-expanded={sheetOpen}
                    className="text-xs font-semibold hover:underline sm:hidden"
                    style={{ color: 'var(--sfp-navy)' }}
                  >
                    {sheetOpen ? 'Done' : 'Edit'}
                  </button>

                  <div className="ml-auto flex items-center gap-3">
                    <button type="button" onClick={clearAll} className="whitespace-nowrap text-xs font-semibold hover:underline" style={{ color: 'var(--sfp-slate)' }}>
                      Clear
                    </button>
                    {compareCta}
                  </div>
                </div>
              </div>
          );
        })()}
    </div>
  );
}
