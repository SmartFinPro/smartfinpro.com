'use client';

// components/marketing/comparison-engine.tsx
// Interactive Comparison Engine. Holds all client state (cost sliders, intents,
// filters, sort, find-my-match, expand). Renders cards from props in the body
// (useMemo) so the server-rendered initial HTML carries every fact for AEO.
// Imports ONLY pure logic from lib/comparison (no server actions → no Turbopack
// boundary crash).

import { useMemo, useState, useCallback } from 'react';
import type { Market, Category } from '@/lib/i18n/config';
import type { FilterKey, ProductForComparison, SortKey, Usage, MatcherAnswers } from '@/lib/comparison/types';
import { DEFAULT_USAGE, rankProducts } from '@/lib/comparison/ranking';
import { INTENTS, SORT_OPTIONS } from '@/lib/comparison/intents';
import { MATCHER_QUESTIONS, MATCHER_DISCLAIMER, matchProducts, type MatchResult } from '@/lib/comparison/matcher';
import { useComponentTracking } from '@/lib/hooks/use-component-tracking';
import { ComparisonCard } from '@/components/marketing/comparison-card';
import { Sparkles, Zap, Calculator, ArrowRight, Coins, Gift, Users, Percent, Plane, type LucideIcon } from 'lucide-react';

const C = {
  ink: '#1A1F36',
  slate: '#6B7280',
  navy: '#1B4F8C',
  navyDark: '#163D6E',
  sky: '#E8F0FB',
  border: '#C9D1DC',
} as const;

const INTENT_ICON: Record<string, LucideIcon> = {
  coin: Coins,
  gift: Gift,
  users: Users,
  percentage: Percent,
  plane: Plane,
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'noMonthly', label: 'No monthly fee' },
  { key: 'freeAtm', label: 'Free ATM' },
  { key: 'noFx', label: 'No FX fee' },
  { key: 'cashback', label: 'Cashback' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'subAccounts', label: 'Sub-accounts' },
  { key: 'interest', label: 'Interest' },
  { key: 'applePay', label: 'Apple Pay' },
];

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

export interface ComparisonEngineProps {
  products: ProductForComparison[];
  market: Market;
  category: Category;
}

export function ComparisonEngine({ products }: ComparisonEngineProps) {
  // `market`/`category` are part of the public prop API (used by the Phase 2
  // Claude matcher endpoint); cards read market/category from each product.
  const { trackInteraction } = useComponentTracking('comparison-engine');

  const [usage, setUsage] = useState<Usage>({ ...DEFAULT_USAGE });
  const [sort, setSort] = useState<SortKey>('smart');
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [matchOpen, setMatchOpen] = useState(false);
  const [answers, setAnswers] = useState<MatcherAnswers>({});
  const [results, setResults] = useState<MatchResult[] | null>(null);

  const visible = useMemo(() => {
    const filterKeys = [...filters];
    const subset = products.filter((p) => filterKeys.every((k) => p.flags[k]));
    return rankProducts(subset, usage, sort);
  }, [products, filters, usage, sort]);

  const matchSlug = results && results.length > 0 ? results[0].product.slug : null;

  const toggleDetails = useCallback((slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const onOfferClick = useCallback(
    (p: ProductForComparison) => {
      trackInteraction('offer_click', p.slug, { ctaMode: p.ctaMode });
    },
    [trackInteraction],
  );

  const pickIntent = (id: string, sortKey: SortKey) => {
    if (activeIntent === id) {
      setActiveIntent(null);
      setSort('smart');
    } else {
      setActiveIntent(id);
      setSort(sortKey);
      trackInteraction('intent', id);
    }
  };

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    trackInteraction('filter', key);
  };

  const runMatch = () => {
    const r = matchProducts(answers, products);
    setResults(r);
    trackInteraction('find_match', r[0]?.product.slug, { answered: Object.keys(answers).length });
  };

  return (
    <div style={{ fontVariantNumeric: 'tabular-nums' }}>
      <style>{`
        .cmp-pill{border:1px solid ${C.border};background:#fff;color:${C.navyDark};font-size:12.5px;padding:7px 12px;border-radius:20px;cursor:pointer;transition:all .12s;white-space:nowrap;font-weight:500}
        .cmp-pill:hover{background:${C.sky};border-color:#BBD3F2;color:#2563EB}
        .cmp-pill[data-on="true"]{background:${C.navy};border-color:${C.navy};color:#fff}
        .cmp-fil{border:1px solid ${C.border};background:#fff;color:${C.ink};font-size:12px;padding:6px 12px;border-radius:8px;cursor:pointer;transition:all .12s;font-weight:500}
        .cmp-fil:hover{background:${C.sky};border-color:#BBD3F2;color:#2563EB}
        .cmp-fil[data-on="true"]{background:${C.sky};border-color:${C.navy};color:${C.navyDark}}
        .cmp-range{width:100%;accent-color:#F5A623;margin:6px 0 12px}
        .cmp-ghost{background:#fff;border:1px solid ${C.border};color:${C.ink};font-weight:500;cursor:pointer;border-radius:8px;transition:all .15s}
        .cmp-ghost:hover{background:${C.sky};border-color:#BBD3F2;color:#2563EB}
        .cmp-cta::after{content:none !important}
      `}</style>

      {/* Controls card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', marginBottom: 14, boxShadow: '0 1px 3px rgba(27,79,140,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navyDark, letterSpacing: '-.2px', margin: 0 }}>
              Business banking, compared
            </h2>
            <div style={{ fontSize: 13, color: C.slate, marginTop: 3 }}>
              {products.length} US providers · ranked live by real data · hands-on reviews
            </div>
          </div>
          <button type="button" className="cmp-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13 }} onClick={() => setMatchOpen((v) => !v)}>
            <Sparkles size={15} aria-hidden="true" /> Find my match
          </button>
        </div>

        {matchOpen && (
          <div style={{ marginTop: 14, background: C.sky, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navyDark, marginBottom: 10 }}>
              Answer a few questions — we&apos;ll rank your best fits.
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {MATCHER_QUESTIONS.map((q) => (
                <div key={q.id}>
                  <div style={{ fontSize: 12.5, color: C.ink, marginBottom: 6, fontWeight: 500 }}>{q.label}</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {q.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className="cmp-pill"
                        data-on={answers[q.id] === opt.value}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: prev[q.id] === opt.value ? '' : opt.value,
                          }))
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={runMatch}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '11px 22px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, letterSpacing: '.3px', background: '#54B269', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              See my matches <ArrowRight size={16} aria-hidden="true" />
            </button>

            {results && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navyDark, marginBottom: 8 }}>Your top matches</div>
                {results.map((r, i) => (
                  <div key={r.product.slug} style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>
                    <b style={{ color: C.navyDark, fontWeight: 600 }}>
                      {i + 1}. {r.product.displayName}
                    </b>{' '}
                    <span style={{ color: C.slate }}>· {r.fitScore}% fit</span>
                    {r.reasons.length > 0 && <span style={{ color: C.slate }}> — {r.reasons.join(' · ')}</span>}
                  </div>
                ))}
                <div style={{ fontSize: 11.5, color: C.slate, marginTop: 8, lineHeight: 1.5 }}>{MATCHER_DISCLAIMER}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          {/* In a hurry */}
          <div style={{ background: '#FAFBFD', border: '1px solid #E1E7F0', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 9 }}>
              <Zap size={13} aria-hidden="true" /> In a hurry?
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {INTENTS.map((it) => {
                const Ic = INTENT_ICON[it.icon] ?? Coins;
                return (
                  <button
                    key={it.id}
                    type="button"
                    className="cmp-pill"
                    data-on={activeIntent === it.id}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onClick={() => pickIntent(it.id, it.sort)}
                  >
                    <Ic size={14} aria-hidden="true" /> {it.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Your cost */}
          <div style={{ background: '#FAFBFD', border: '1px solid #E1E7F0', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
              <Calculator size={13} aria-hidden="true" /> Your cost · re-ranks live
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.ink }}>
              <span>Foreign spend / mo</span>
              <b style={{ fontWeight: 600, color: C.navyDark }}>{money(usage.fxSpend)}</b>
            </div>
            <input
              className="cmp-range"
              type="range"
              min={0}
              max={5000}
              step={100}
              value={usage.fxSpend}
              aria-label="Foreign spend per month"
              onChange={(e) => setUsage((u) => ({ ...u, fxSpend: Number(e.target.value) }))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.ink }}>
              <span>ATM withdrawals / mo</span>
              <b style={{ fontWeight: 600, color: C.navyDark }}>{usage.atmCount}</b>
            </div>
            <input
              className="cmp-range"
              type="range"
              min={0}
              max={30}
              step={1}
              value={usage.atmCount}
              aria-label="ATM withdrawals per month"
              onChange={(e) => setUsage((u) => ({ ...u, atmCount: Number(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      {/* Count + sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 10px', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>
          {visible.length} {visible.length === 1 ? 'provider' : 'providers'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.slate }}>
          <label htmlFor="cmp-sort">Sort</label>
          <select
            id="cmp-sort"
            value={SORT_OPTIONS.some((o) => o.value === sort) ? sort : 'smart'}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setActiveIntent(null);
            }}
            style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', background: '#fff', color: C.ink, fontSize: 13, cursor: 'pointer' }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '0 4px 14px' }}>
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className="cmp-fil" data-on={filters.has(f.key)} onClick={() => toggleFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div>
        {visible.map((p, i) => (
          <ComparisonCard
            key={p.slug}
            product={p}
            rank={i + 1}
            usage={usage}
            isMatch={p.slug === matchSlug}
            expanded={expanded.has(p.slug)}
            onToggleDetails={toggleDetails}
            onOfferClick={onOfferClick}
          />
        ))}
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: C.slate, fontSize: 14 }}>
            No providers match those filters. <button type="button" className="cmp-ghost" style={{ padding: '6px 12px', fontSize: 13, marginLeft: 8 }} onClick={() => setFilters(new Set())}>Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
