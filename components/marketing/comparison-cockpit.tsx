'use client';

// components/marketing/comparison-cockpit.tsx
// Interactive Comparison Cockpit orchestrator. Holds all client state and
// renders one of three views (Cards / Table / Compare) from the server-passed,
// pre-ordered products. Imports ONLY pure logic (no server actions → no
// Turbopack boundary crash). URL state lives in an inner <Suspense> child so
// useSearchParams cannot de-opt the SSR of the cards (AEO top-3 requirement).

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, Table as TableIcon, Columns3, Columns2 } from 'lucide-react';
import type { Market, Category } from '@/lib/i18n/config';
import type { ProductForComparison } from '@/lib/comparison/types';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import { costOverTime, orderProducts, type CostInputs } from '@/lib/comparison/cost';
import { useComponentTracking } from '@/lib/hooks/use-component-tracking';
import { CockpitDecisionBar, type MatchRow } from '@/components/marketing/cockpit-decision-bar';
import { CockpitCard } from '@/components/marketing/cockpit-card';
import { CockpitTable } from '@/components/marketing/cockpit-table';
import { CockpitCompare } from '@/components/marketing/cockpit-compare';

const C = {
  ink: '#1A1F36',
  slate: '#6B7280',
  border: '#C9D1DC',
  navy: '#1B4F8C',
  gold: '#F5A623',
  sky: '#E8F0FB',
} as const;

type View = 'cards' | 'table' | 'compare';

export interface ComparisonCockpitProps {
  products: ProductForComparison[];
  market: Market;
  category: Category;
  /** Topic key — the client resolves the (function-laden, non-serializable)
   *  TopicConfig itself rather than receiving it across the RSC boundary. */
  topic: string;
}

export function ComparisonCockpit({ products, market, category, topic }: ComparisonCockpitProps) {
  const { trackInteraction } = useComponentTracking('comparison-cockpit');
  // Resolved client-side: the config module is pure (no server imports). The
  // server route has already guaranteed a non-null config (else notFound()).
  // market MUST be passed — market-only topics (uk:/ca:/au: registry keys)
  // resolve to null without it, and shared slugs would hydrate the US config.
  const config = getTopicConfig(category, topic, market)!;
  const cm = config.costModel;

  const [amount, setAmount] = useState(cm.amountDefault);
  const [years, setYears] = useState(cm.yearsDefault);
  const [sort, setSort] = useState<string>('smart');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [view, setViewState] = useState<View>('cards');
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [matchResult, setMatchResult] = useState<MatchRow[] | null>(null);

  const inputs: CostInputs = { amount, years };

  const visible = useMemo(() => {
    const active = [...filters];
    const subset = products.filter((p) =>
      active.every((k) => config.filters.find((f) => f.key === k)?.predicate(p) ?? true),
    );
    return orderProducts(subset, config, inputs, sort, dir);
  }, [products, config, filters, sort, dir, amount, years]);

  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const matchSlug = matchResult && matchResult.length > 0 ? matchResult[0].product.slug : null;

  // Per-column winners (specColumns + rating + cost), with a "varies" guard.
  const winners = useMemo(() => {
    const m: Record<string, { value: number; varies: boolean }> = {};
    if (visible.length === 0) return m;
    for (const col of config.specColumns) {
      if (!col.winner) continue;
      const vals = visible.map((p) => Number(col.accessor(p)));
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      m[col.key] = { value: col.winner === 'min' ? lo : hi, varies: lo !== hi };
    }
    const rv = visible.map((p) => p.rating);
    m.rating = { value: Math.max(...rv), varies: Math.min(...rv) !== Math.max(...rv) };
    const cv = visible.map((p) => costOverTime(p, cm, inputs));
    m.__cost = { value: Math.min(...cv), varies: Math.min(...cv) !== Math.max(...cv) };
    return m;
  }, [visible, config, cm, amount, years]);

  const isColWinner = useCallback(
    (colKey: string, p: ProductForComparison): boolean => {
      const w = winners[colKey];
      if (!w || !w.varies) return false;
      const val =
        colKey === 'rating'
          ? p.rating
          : Number(config.specColumns.find((c) => c.key === colKey)?.accessor(p) ?? NaN);
      return val === w.value;
    },
    [winners, config],
  );

  const isCostWinner = useCallback(
    (p: ProductForComparison): boolean => {
      const w = winners.__cost;
      return !!w && w.varies && costOverTime(p, cm, inputs) === w.value;
    },
    [winners, cm, amount, years],
  );

  const toggleDetails = useCallback((slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }, []);

  const toggleSelect = useCallback(
    (slug: string) => {
      setSelection((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) {
          if (view === 'compare' && next.size <= 2) return prev; // keep ≥2 in compare
          next.delete(slug);
        } else {
          if (next.size >= 4) return prev; // max 4
          next.add(slug);
        }
        return next;
      });
    },
    [view],
  );

  const onOfferClick = useCallback(
    (p: ProductForComparison) => {
      trackInteraction('offer_click', p.slug, { ctaMode: p.ctaMode, attribution: p.offerAttribution });
    },
    [trackInteraction],
  );

  const setView = useCallback(
    (v: View) => {
      if (v === 'compare') {
        setSelection((prev) =>
          prev.size >= 2
            ? prev
            : new Set(visibleRef.current.slice(0, Math.min(3, visibleRef.current.length)).map((p) => p.slug)),
        );
      }
      setViewState(v);
      trackInteraction('view', v);
    },
    [trackInteraction],
  );

  const onIntent = useCallback(
    (sortKey: string) => {
      if (sort === sortKey) {
        setSort('smart');
        setDir('desc');
      } else {
        setSort(sortKey);
        setDir('desc');
        trackInteraction('intent', sortKey);
      }
    },
    [sort, trackInteraction],
  );

  const onHeaderSort = useCallback(
    (key: string) => {
      if (sort === key) setDir((d) => (d === 'desc' ? 'asc' : 'desc'));
      else {
        setSort(key);
        setDir('desc');
      }
    },
    [sort],
  );

  const toggleFilter = useCallback(
    (key: string) => {
      setFilters((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
      trackInteraction('filter', key);
    },
    [trackInteraction],
  );

  const runMatch = useCallback(() => {
    const scored: MatchRow[] = products.map((p) => {
      let raw = 0;
      let max = 0;
      const reasons: string[] = [];
      for (const q of config.matcher) {
        const a = answers[q.id];
        if (!a) continue;
        const res = q.award(p, a);
        if (!res) continue;
        max += q.weight;
        if (res.matched) {
          raw += q.weight;
          if (res.reason) reasons.push(res.reason);
        }
      }
      raw += p.score;
      max += 10;
      const fitScore = max > 0 ? Math.round((raw / max) * 100) : Math.round((p.score / 10) * 100);
      return { product: p, fitScore, reasons };
    });
    scored.sort((a, b) => b.fitScore - a.fitScore || b.product.score - a.product.score);
    const top = scored.slice(0, 3);
    setMatchResult(top);
    trackInteraction('find_match', top[0]?.product.slug, {
      answered: Object.keys(answers).filter((k) => answers[k]).length,
    });
  }, [products, config, answers, trackInteraction]);

  // Write current state to the URL (shareable + restorable). Client-only effect.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (view !== 'cards') params.set('view', view);
    if (sort !== 'smart') params.set('sort', sort);
    if (dir !== 'desc') params.set('dir', dir);
    if (amount !== cm.amountDefault) params.set('amount', String(amount));
    if (years !== cm.yearsDefault) params.set('years', String(years));
    if (filters.size) params.set('filters', [...filters].join(','));
    if (selection.size) params.set('compare', [...selection].join(','));
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [view, sort, dir, amount, years, filters, selection, cm.amountDefault, cm.yearsDefault]);

  const applyUrlInit = useCallback(
    (s: Record<string, string | null>) => {
      if (s.sort) setSort(s.sort);
      if (s.dir === 'asc' || s.dir === 'desc') setDir(s.dir);
      const a = Number(s.amount);
      if (s.amount && Number.isFinite(a)) setAmount(a);
      const y = Number(s.years);
      if (s.years && Number.isFinite(y)) setYears(y);
      if (s.filters) setFilters(new Set(s.filters.split(',').filter(Boolean)));
      if (s.compare) setSelection(new Set(s.compare.split(',').filter(Boolean)));
      if (s.view === 'table') setViewState('table');
      else if (s.view === 'compare') {
        if (!s.compare) {
          setSelection(new Set(visibleRef.current.slice(0, 3).map((p) => p.slug)));
        }
        setViewState('compare');
      }
    },
    [],
  );

  const views: { key: View; label: string; Icon: typeof LayoutGrid }[] = [
    { key: 'cards', label: 'Cards', Icon: LayoutGrid },
    { key: 'table', label: 'Table', Icon: TableIcon },
    { key: 'compare', label: 'Compare', Icon: Columns3 },
  ];

  return (
    <div className="ck-root" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <style>{`
        .ck-root .ck-cta::after{content:none !important}
        .ck-root .cmp-cta{transition:background .12s ease,color .12s ease,border-color .12s ease}
        .ck-root .cmp-cta:hover{background:#54B269 !important;border-color:#54B269 !important;color:#fff !important}
        .ck-root .ck-fil{border:1px solid #C9D1DC;background:#fff;color:${C.ink};font-size:12px;padding:7px 13px;border-radius:999px;cursor:pointer;transition:all .12s;font-weight:500;font-family:inherit}
        .ck-root .ck-fil:hover{background:#54B269;border-color:#54B269;color:#fff}
        .ck-root .ck-fil[data-on="true"]{background:#54B269;border-color:#54B269;color:#fff}
        .ck-root .ck-seg{padding:9px 15px;font-size:13px;font-weight:600;color:${C.navy};background:#fff;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;border:none;transition:all .12s}
        .ck-root .ck-seg:hover:not([data-on="true"]){background:#54B269;color:#fff}
        .ck-root .ck-seg[data-on="true"]{background:${C.navy};color:#fff}
        /* Phase B — mobile (≤640px). Base rules replicate prior inline desktop values (no desktop regression). */
        .ck-root .ck-toolbar-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .ck-root .ck-seg-group{display:inline-flex;border:1.5px solid ${C.navy};border-radius:11px;overflow:hidden}
        .ck-root .ck-sort{display:flex;align-items:center;gap:8px}
        .ck-root .ck-card{padding:22px 24px}
        .ck-root .ck-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
        .ck-root .ck-card-cta{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0}
        .ck-root .ck-card-spec{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:18px 0 4px}
        .ck-root .ck-card-proscons{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:16px 0 2px}
        .ck-root .ck-card-rating-row{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
        .ck-root .ck-card-rating-actions{display:flex;gap:10px}
        .ck-root .ck-card-head > *,.ck-root .ck-card-spec > *,.ck-root .ck-card-proscons > *,.ck-root .ck-card-rating-actions > *{min-width:0}
        .ck-root .ck-scroll-x{-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
        .ck-root .ck-checkcol{width:40px;text-align:center;padding:8px 0}
        @media (max-width:640px){
          .ck-root .ck-toolbar-controls{width:100%;flex-direction:column;align-items:stretch;gap:10px}
          .ck-root .ck-seg-group{width:100%}
          .ck-root .ck-seg-group .ck-seg{flex:1;justify-content:center}
          .ck-root .ck-sort{justify-content:flex-end}
          .ck-root .ck-sort select{flex:1}
          .ck-root .ck-card{padding:18px 16px}
          .ck-root .ck-card-head{flex-direction:column;gap:14px}
          .ck-root .ck-card-cta{align-items:stretch;width:100%}
          .ck-root .ck-card-cta .ck-card-cta-btn{width:100%;justify-content:center}
          .ck-root .ck-card-spec{grid-template-columns:repeat(2,1fr);gap:14px}
          .ck-root .ck-card-proscons{grid-template-columns:1fr;gap:6px}
          .ck-root .ck-card-rating-row{flex-direction:column;align-items:stretch}
          .ck-root .ck-card-rating-actions{width:100%}
          .ck-root .ck-card-rating-actions > a,.ck-root .ck-card-rating-actions > button{flex:1;justify-content:center;text-align:center}
          .ck-root .ck-tbl td.ck-sticky-c1{position:sticky;left:0;z-index:1;background:#fff}
          .ck-root .ck-tbl td.ck-sticky-c2{position:sticky;left:40px;z-index:1;background:#fff;box-shadow:1px 0 0 #E1E7F0}
          .ck-root .ck-tbl th.ck-sticky-c1{position:sticky;left:0;z-index:1;background:#FAFBFD}
          .ck-root .ck-tbl th.ck-sticky-c2{position:sticky;left:40px;z-index:1;background:#FAFBFD;box-shadow:1px 0 0 #E1E7F0}
          .ck-root .ck-tbl-check{min-width:40px;min-height:40px;display:inline-flex;align-items:center;justify-content:center}
          .ck-root .ck-cmp-corner{position:sticky;left:0;z-index:3;background:${C.navy}}
          .ck-root .ck-cmp-label{position:sticky;left:0;z-index:2;background:#FAFBFD}
          .ck-root .ck-cmp-remove{min-width:40px;min-height:40px;display:inline-flex;align-items:center;justify-content:center}
        }
      `}</style>

      <Suspense fallback={null}>
        <CockpitUrlSync onInit={applyUrlInit} />
      </Suspense>

      <CockpitDecisionBar
        config={config}
        market={market}
        amount={amount}
        years={years}
        onAmount={setAmount}
        onYears={setYears}
        activeSort={sort}
        onIntent={onIntent}
        matcherOpen={matcherOpen}
        onToggleMatcher={() => setMatcherOpen((v) => !v)}
        answers={answers}
        onAnswer={(qid, val) => setAnswers((prev) => ({ ...prev, [qid]: val }))}
        onRunMatch={runMatch}
        matchResult={matchResult}
      />

      {/* Controls: count · view switch · sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 2px 12px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
          {visible.length} {visible.length === 1 ? 'provider' : 'providers'}
        </div>
        <div className="ck-toolbar-controls">
          <div className="ck-seg-group">
            {views.map((v, i) => (
              <button
                key={v.key}
                type="button"
                className="ck-seg"
                data-on={view === v.key}
                onClick={() => setView(v.key)}
                style={i > 0 ? { borderLeft: `1.5px solid ${C.navy}` } : undefined}
              >
                <v.Icon size={14} aria-hidden="true" /> {v.label}
                {v.key === 'compare' && view !== 'compare' && (
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, display: 'inline-block' }} />
                )}
              </button>
            ))}
          </div>
          <div className="ck-sort" style={{ fontSize: 13, color: C.slate }}>
            <label htmlFor="ck-sort">Sort</label>
            <select
              id="ck-sort"
              value={config.sortOptions.some((o) => o.value === sort) ? sort : 'smart'}
              onChange={(e) => {
                setSort(e.target.value);
                setDir('desc');
              }}
              style={{ border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 10px', background: '#fff', color: C.ink, fontSize: 13, cursor: 'pointer' }}
            >
              {config.sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      {config.filters.length > 0 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '0 2px 16px' }}>
          {config.filters.map((f) => (
            <button key={f.key} type="button" className="ck-fil" data-on={filters.has(f.key)} onClick={() => toggleFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: C.slate, fontSize: 14, background: '#fff', border: '1px solid #E1E7F0', borderRadius: 14 }}>
          No providers match these filters.{' '}
          <button type="button" onClick={() => setFilters(new Set())} style={{ color: C.navy, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            Clear filters
          </button>
        </div>
      ) : view === 'table' ? (
        <CockpitTable
          products={visible}
          config={config}
          market={market}
          inputs={inputs}
          sort={sort}
          dir={dir}
          onSort={onHeaderSort}
          selection={selection}
          onToggleSelect={toggleSelect}
          isColWinner={isColWinner}
          isCostWinner={isCostWinner}
          onOfferClick={onOfferClick}
        />
      ) : view === 'compare' ? (
        <CockpitCompare
          all={visible}
          selectedSlugs={[...selection]}
          config={config}
          market={market}
          inputs={inputs}
          onToggleSelect={toggleSelect}
          onOfferClick={onOfferClick}
        />
      ) : (
        <div>
          {visible.map((p, i) => (
            <CockpitCard
              key={p.slug}
              product={p}
              rank={i + 1}
              config={config}
              market={market}
              inputs={inputs}
              isMatch={p.slug === matchSlug}
              selected={selection.has(p.slug)}
              expanded={expanded.has(p.slug)}
              isColWinner={isColWinner}
              isCostWinner={isCostWinner}
              onToggleDetails={toggleDetails}
              onToggleSelect={toggleSelect}
              onOfferClick={onOfferClick}
            />
          ))}
        </div>
      )}

      {/* Compare-tray shortcut (Cards/Table only) */}
      {view !== 'compare' && selection.size > 0 && (
        <div style={{ position: 'sticky', bottom: 8, background: C.navy, borderRadius: 12, padding: '11px 14px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxShadow: '0 6px 24px rgba(27,79,140,.28)' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{selection.size} selected</span>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setView('compare')}
            disabled={selection.size < 2}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, background: '#54B269', color: '#fff', border: 'none', cursor: selection.size < 2 ? 'not-allowed' : 'pointer', opacity: selection.size < 2 ? 0.5 : 1 }}
          >
            Compare side-by-side <Columns2 size={14} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setSelection(new Set())} style={{ color: '#cfe0f5', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

/** Reads URL params once on mount and lifts them up. Wrapped in <Suspense> by
 *  the parent so useSearchParams cannot de-opt the SSR of the rest of the tree. */
function CockpitUrlSync({ onInit }: { onInit: (s: Record<string, string | null>) => void }) {
  const sp = useSearchParams();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    onInit({
      view: sp.get('view'),
      sort: sp.get('sort'),
      dir: sp.get('dir'),
      amount: sp.get('amount'),
      years: sp.get('years'),
      filters: sp.get('filters'),
      compare: sp.get('compare'),
    });
  }, [sp, onInit]);
  return null;
}
