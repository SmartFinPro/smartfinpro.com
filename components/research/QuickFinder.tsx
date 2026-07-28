// components/research/QuickFinder.tsx
// Homepage Quick Finder — the client shell for the compact, market-aware
// Research Quick Finder that replaces the homepage report feed + Editor's
// Picks (research-discovery-pr3 plan, Task 3; spec §9.3). Search and category
// state are LOCAL ONLY (`useState`) and never touch the homepage URL — the
// six-card cap and every href are the SAME pure shell functions the /research
// hub uses (`finderResults`, `finderItemHref`, `finderViewAllHref`,
// lib/research/catalog-shell-logic.ts), so there is no second, Finder-specific
// item type or ranking rule.
//
// Review-backed cards link straight to their review (`finderItemHref` reads
// `item.review.href`); a Cockpit-only card (no review yet) links into the
// market Research hub, prefiltered by topic + the item's own title — NEVER
// straight to the Cockpit (spec §2.6/§9.3). This is why this card markup does
// NOT reuse CatalogCard: CatalogCard's own Cockpit-only fallback links
// straight to the Cockpit, which is correct for the Hub but forbidden here.
// The card below is a smaller, Finder-only TWO-state rating — `Editorial ·
// x/5` for a review, `In verification` for Cockpit-only; no `Audited · x/10`
// (the Finder is a lightweight teaser into the Hub, never a second place to
// show Cockpit-grade audited scores) — while still honoring every honesty
// rule CatalogCard's own doc comment states: no star icon, no `reviewCount`,
// no nested anchors (one Link per card).
//
// Analytics (research_v1, surface: 'finder'):
//   - search: `research_search` fires on the SETTLED (300ms-debounced) query
//     only, mirroring ResearchHub's own debounce (components/research/
//     ResearchHub.tsx) — but against LOCAL state only, never a router/URL
//     write;
//   - category: the visible result set updates INSTANTLY (no debounce) but a
//     category change is NOT separately tracked. `ResearchFacet`
//     (lib/analytics/research-events.ts) and its strict Zod counterpart
//     (lib/validation/index.ts) are frozen by Task 1 (already merged, out of
//     this task's file scope) to 'status'|'confidence'|'fresh' — the Finder's
//     `category` filter has no legal facet value to report through
//     `trackFilterChange`. This plan's own Task 4 analytics assertions (Step
//     2) confirm the actual wire contract: only research_search,
//     research_finder_cta, and research_review_click are checked — never a
//     category research_filter_change;
//   - a review-backed title click fires `research_review_click` immediately;
//   - a Cockpit-only card's own click fires `trackFinderCta('dossier_item', …)`;
//   - the "View all" CTA fires `trackFinderCta('view_all', …)` with the
//     `resultCount` actually on screen at click time (never recomputed after
//     the click).
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { categoryConfig, marketCategories, type Category, type Market } from '@/lib/i18n/config';
import {
  finderItemHref,
  finderResults,
  finderViewAllHref,
  type DiscoveryItem,
} from '@/lib/research/catalog-shell-logic';
import { FilterChips } from './FilterChips';
import { useResearchTracking } from '@/lib/analytics/research-tracking';
import { toQueryLength, type ResearchProductStatus } from '@/lib/analytics/research-events';

export interface QuickFinderProps {
  market: Market;
  items: DiscoveryItem[];
}

export function QuickFinder({ market, items }: QuickFinderProps) {
  const pagePath = market === 'us' ? '/' : `/${market}`;
  const tracker = useResearchTracking({ market, topic: 'hub', pagePath });

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);

  const filters = useMemo(() => ({ query, category }), [query, category]);
  const results = useMemo(() => finderResults(items, filters), [items, filters]);

  // Category chips only for categories this market's catalog actually has —
  // FilterChips itself additionally hides the whole row when fewer than two
  // options remain (spec §6.2 gating, reused here for the same reason).
  const categoryOptions = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const item of items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return marketCategories[market]
      .filter((value) => counts.has(value))
      .map((value) => ({ value, label: categoryConfig[value].name, count: counts.get(value) }));
  }, [items, market]);

  const isActive = query.trim() !== '' || category !== null;

  const resetAll = useCallback(() => {
    setQuery('');
    setCategory(null);
  }, []);

  // Settled-query analytics only — the visible `results` above already
  // update on every keystroke. `trackedQueryRef` mirrors ResearchHub's own
  // "already reported this value" guard (its `filters.query` comparison) so
  // an unrelated category change — which also changes `results.length`, a
  // dependency here — never re-fires `research_search` for a query that
  // has not actually changed since the last report.
  const trackedQueryRef = useRef('');
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === trackedQueryRef.current) return;
    const id = setTimeout(() => {
      trackedQueryRef.current = trimmed;
      tracker.trackSearch(toQueryLength(trimmed), results.length, { surface: 'finder' });
    }, 300);
    return () => clearTimeout(id);
  }, [query, results.length, tracker]);

  const handleItemClick = useCallback(
    (item: DiscoveryItem, position: number) => {
      const context = item.researchContexts[0] ?? null;
      if (item.review) {
        const status: ResearchProductStatus = context?.status ?? 'unavailable';
        const rank = context?.status === 'audited' ? context.auditedRank : null;
        tracker.trackReviewClick(item.review.slug, status, rank, position, {
          surface: 'finder',
          kind: 'review',
          category: item.category,
          ...(context ? { topic: context.topic } : {}),
        });
        return;
      }
      // Cockpit-only card — no review exists yet. `finderItemHref` already
      // sends this click to the prefiltered Research hub, never the Cockpit
      // directly; this is only the analytics side of that same click.
      if (!context) return;
      tracker.trackFinderCta(
        'dossier_item',
        {
          queryLength: toQueryLength(query),
          resultCount: results.length,
          productSlug: context.productSlug,
          kind: 'dossier',
        },
        { surface: 'finder', topic: context.topic, category: item.category },
      );
    },
    [tracker, query, results.length],
  );

  const handleViewAllClick = useCallback(() => {
    tracker.trackFinderCta(
      'view_all',
      { queryLength: toQueryLength(query), resultCount: results.length },
      { surface: 'finder' },
    );
  }, [tracker, query, results.length]);

  const viewAllHref = finderViewAllHref(market, filters);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--sfp-slate)' }}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reviews and research…"
            aria-label="Search research"
            className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--sfp-navy)]"
            style={{ borderColor: 'var(--sfp-hairline)', background: '#ffffff', color: 'var(--sfp-ink)' }}
          />
        </div>
        {/* Permanently-mounted live region (never conditionally mounted) —
            visible AND announced, so it doubles as the on-screen result
            count and the a11y announcement in one element. */}
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-sm font-medium shrink-0"
          style={{ color: 'var(--sfp-slate)' }}
        >
          {results.length} results
        </p>
      </div>

      {categoryOptions.length >= 2 && (
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips
            label="Category"
            value={category}
            options={categoryOptions}
            onChange={(value) => setCategory(value as Category | null)}
          />
          {isActive && (
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-semibold underline"
              style={{ color: 'var(--sfp-navy)' }}
            >
              Reset
            </button>
          )}
        </div>
      )}

      {results.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: 'var(--sfp-hairline)', background: 'var(--sfp-gray)' }}
        >
          <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
            No matches yet — try a different search or browse all research.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item, index) => {
            const href = finderItemHref(item);
            const ratingLabel = item.review
              ? `Editorial · ${item.review.editorialRating.toFixed(1)}/5`
              : 'In verification';

            return (
              <article
                key={item.id}
                data-finder-item={item.id}
                className="card-light flex flex-col gap-3 rounded-xl p-5"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
                  {categoryConfig[item.category].name}
                </p>

                <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--sfp-ink)' }}>
                  <Link
                    href={href}
                    onClick={() => handleItemClick(item, index + 1)}
                    className="no-underline hover:underline"
                    style={{ color: 'inherit' }}
                  >
                    {item.display.title}
                  </Link>
                </h3>

                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--sfp-slate)' }}>
                  {item.display.description}
                </p>

                {item.display.bestFor && (
                  <span
                    className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                  >
                    {item.display.bestFor}
                  </span>
                )}

                <span
                  className="mt-auto border-t pt-3 text-xs font-bold"
                  style={{
                    color: item.review ? 'var(--sfp-navy)' : 'var(--sfp-slate)',
                    borderColor: 'var(--sfp-hairline)',
                  }}
                >
                  {ratingLabel}
                </span>
              </article>
            );
          })}
        </div>
      )}

      <Link
        href={viewAllHref}
        onClick={handleViewAllClick}
        className="inline-flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold no-underline"
        style={{ background: 'var(--sfp-navy)', color: '#ffffff' }}
      >
        View all research
      </Link>
    </div>
  );
}
