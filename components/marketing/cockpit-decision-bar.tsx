// components/marketing/cockpit-decision-bar.tsx
// Presentational decision bar: "Find my match" wizard, "In a hurry?" intent
// quick-sorts, and the live cost sliders that re-rank everything. Config-driven.

import { Sparkles, Zap, Calculator, ArrowRight, Coins, Percent, Wallet, Star, Users, type LucideIcon } from 'lucide-react';
import type { ProductForComparison } from '@/lib/comparison/types';
import type { TopicConfig } from '@/lib/comparison/topics/types';

const C = {
  ink: '#1A1F36',
  slate: '#6B7280',
  border: '#C9D1DC',
  navy: '#1B4F8C',
  navyDark: '#163D6E',
  sky: '#E8F0FB',
  ctaGreen: '#54B269',
} as const;

const CHIP_ICON: Record<string, LucideIcon> = { Coins, Percent, Wallet, Star, Users };
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

export interface MatchRow {
  product: ProductForComparison;
  fitScore: number;
  reasons: string[];
}

export interface CockpitDecisionBarProps {
  config: TopicConfig;
  amount: number;
  years: number;
  onAmount: (n: number) => void;
  onYears: (n: number) => void;
  activeSort: string;
  onIntent: (sortKey: string) => void;
  matcherOpen: boolean;
  onToggleMatcher: () => void;
  answers: Record<string, string>;
  onAnswer: (qid: string, value: string) => void;
  onRunMatch: () => void;
  matchResult: MatchRow[] | null;
}

export function CockpitDecisionBar({
  config,
  amount,
  years,
  onAmount,
  onYears,
  activeSort,
  onIntent,
  matcherOpen,
  onToggleMatcher,
  answers,
  onAnswer,
  onRunMatch,
  matchResult,
}: CockpitDecisionBarProps) {
  const cm = config.costModel;
  return (
    <div style={{ background: '#fff', border: '1px solid #E1E7F0', borderRadius: 14, padding: '18px', marginBottom: 16 }}>
      <style>{`
        .ck-root .ck-pill{border:1px solid ${C.border};background:#fff;color:${C.navyDark};font-size:12.5px;padding:7px 12px;border-radius:999px;cursor:pointer;transition:all .12s;white-space:nowrap;font-weight:500;display:inline-flex;align-items:center;gap:5px;font-family:inherit}
        .ck-root .ck-pill:hover{background:#54B269;border-color:#54B269;color:#fff}
        .ck-root .ck-pill[data-on="true"]{background:#54B269;border-color:#54B269;color:#fff}
        .ck-root .ck-range{width:100%;accent-color:#F5A623;margin:7px 0 0}
        .ck-root .ck-decision-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
        @media (max-width:640px){.ck-root .ck-decision-grid{grid-template-columns:1fr;gap:12px}}
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        {/* Visually h1/h2-sized, semantically NOT headings — the page's single <h1>
            lives in the hero, and a UI hint is no section heading (audited hierarchy). */}
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          {/* Same type treatment as the hero: title mirrors the h1 (font-bold,
              tracking-tight, 30→38px), the hint mirrors the eyebrow label
              (11px bold uppercase, 1.5px tracking). */}
          <span style={{ fontSize: 'clamp(30px, 3.2vw, 38px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.12, color: 'var(--sfp-gold)' }}>
            Best-X Compare
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--sfp-navy)' }}>
            Choose Table or Compare to make better decisions.
          </span>
        </span>
        <button
          type="button"
          className="ck-pill"
          data-on={matcherOpen}
          style={{ padding: '11px 18px', fontSize: 14 }}
          onClick={onToggleMatcher}
        >
          <Sparkles size={15} aria-hidden="true" /> Find my match
        </button>
      </div>

      {matcherOpen && (
        <div style={{ background: '#FAFBFD', border: '1px solid #E1E7F0', borderRadius: 12, padding: 16, marginTop: 8 }}>
          {config.matcher.map((q) => (
            <div key={q.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, color: C.slate, marginBottom: 7, fontWeight: 600 }}>{q.label}</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="ck-pill"
                    data-on={answers[q.id] === opt.value}
                    onClick={() => onAnswer(q.id, answers[q.id] === opt.value ? '' : opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={onRunMatch}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, background: C.ctaGreen, color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            See my match <ArrowRight size={15} aria-hidden="true" />
          </button>
          {matchResult && matchResult.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 13, color: C.navyDark }}>
              <b style={{ fontWeight: 600 }}>Your match: {matchResult[0].product.displayName}</b>{' '}
              <span style={{ color: C.slate }}>· {matchResult[0].fitScore}% fit</span>
              {matchResult[0].reasons.length > 0 && (
                <span style={{ color: C.slate }}> — {matchResult[0].reasons.join(' · ')}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="ck-decision-grid">
        {/* In a hurry? */}
        <div style={{ background: '#FAFBFD', border: '1px solid #E1E7F0', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 13 }}>
            <Zap size={13} aria-hidden="true" /> In a hurry?
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {config.priorityChips.map((chip) => {
              const Ic = CHIP_ICON[chip.icon] ?? Coins;
              return (
                <button key={chip.id} type="button" className="ck-pill" data-on={activeSort === chip.sort} onClick={() => onIntent(chip.sort)}>
                  <Ic size={14} aria-hidden="true" /> {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Your cost */}
        <div style={{ background: '#FAFBFD', border: '1px solid #E1E7F0', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.slate, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 9 }}>
            <Calculator size={13} aria-hidden="true" /> Your cost · re-ranks live
          </div>
          {/* Banking cost = annual fees × years (amount is ignored) → hide the amount slider. */}
          {cm.kind !== 'banking' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: C.ink }}>
                <span>{cm.amountLabel}</span>
                {/* monthly-plus-setup repurposes this slider as a MONTHS dial, not a
                    dollar amount (credit repair: setup + monthly fee × months) — the
                    other 3 kinds keep the existing $-formatted display unchanged. */}
                <b style={{ fontWeight: 700, color: C.navy }}>{cm.kind === 'monthly-plus-setup' ? `${amount} months` : usd(amount)}</b>
              </div>
              <input className="ck-range" type="range" min={cm.amountMin} max={cm.amountMax} step={cm.amountStep} value={amount} aria-label={cm.amountLabel} onChange={(e) => onAmount(Number(e.target.value))} />
            </>
          )}
          {/* fee-on-amount cost is a one-time fee% of the amount, independent of years
              (no compounding balance, no annual charge) — a years slider here would be
              interactive but inert, which reads as broken. Hide it, same as the amount
              slider is hidden for `banking`. monthly-plus-setup has the same problem
              (its "months" dial above already captures program duration; a separate
              years slider would be redundant and inert), so it's hidden too. */}
          {cm.kind !== 'fee-on-amount' && cm.kind !== 'monthly-plus-setup' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: C.ink, marginTop: cm.kind === 'banking' ? 0 : 12 }}>
                <span>{cm.yearsLabel}</span>
                <b style={{ fontWeight: 700, color: C.navy }}>{years}</b>
              </div>
              <input className="ck-range" type="range" min={cm.yearsMin} max={cm.yearsMax} step={1} value={years} aria-label={cm.yearsLabel} onChange={(e) => onYears(Number(e.target.value))} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
