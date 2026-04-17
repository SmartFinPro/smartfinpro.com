'use client';

// components/tools/money-leak-scanner/MethodologyCard.tsx
// Collapsible "How we calculate" panel — credibility + trust signal.

import { useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

export function MethodologyCard() {
  const [open, setOpen] = useState(false);

  return (
    <section
      className="rounded-2xl bg-white border"
      style={{ borderColor: '#E5E7EB' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              background: 'var(--sfp-sky)',
              color: 'var(--sfp-navy)',
            }}
            aria-hidden="true"
          >
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <div className="text-base font-bold" style={{ color: 'var(--sfp-ink)' }}>
              How we calculate your leak
            </div>
            <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Transparent, deterministic scoring — no hidden tricks.
            </div>
          </div>
        </div>
        <ChevronDown
          className="h-5 w-5 shrink-0 transition-transform"
          style={{
            color: 'var(--sfp-slate)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
          <ul className="space-y-2.5" style={{ color: 'var(--sfp-slate)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-ink)' }}>Banking fees</strong> — up to
              90% is recoverable by switching to a fee-free checking or challenger bank.
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-ink)' }}>Subscriptions</strong> — most
              households reclaim the portion above 3% of income through a single audit.
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-ink)' }}>Credit card interest</strong>{' '}
              — a 0% balance transfer typically eliminates 60% of yearly interest.
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-ink)' }}>Insurance</strong> — yearly
              shopping saves 10–20% on premiums on average.
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-ink)' }}>Investing fees</strong> —
              moving from 1% advisor to 0.25% robo saves ~40% of fees, compounded.
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-ink)' }}>FX &amp; remittance</strong> —
              bank markups of 2–5% vs mid-market collapse to near-zero with specialists.
            </li>
          </ul>
          <p className="mt-4 text-xs" style={{ color: 'var(--sfp-slate)' }}>
            All inputs stay in your browser until you choose to save a report. We never
            sell your data. The scoring engine is deterministic — same inputs always
            produce the same result.
          </p>
        </div>
      )}
    </section>
  );
}
