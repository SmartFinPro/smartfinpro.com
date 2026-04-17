'use client';

// components/tools/money-leak-scanner/StickyMobileBar.tsx
// Mobile-only floating bar: shows the current annual leak and scrolls to
// the results panel on tap. Fades in once results are available.

import { ArrowDown } from 'lucide-react';

interface StickyMobileBarProps {
  annualLeak: number;
  currencySymbol: string;
  onClick: () => void;
}

export function StickyMobileBar({ annualLeak, currencySymbol, onClick }: StickyMobileBarProps) {
  const fmt = (n: number) => `${currencySymbol}${Math.round(n).toLocaleString('en-US')}`;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 print:hidden pointer-events-none">
      <div className="pointer-events-auto rounded-full shadow-lg flex items-center justify-between gap-3 pl-4 pr-2 py-2"
        style={{
          background: 'var(--sfp-navy)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(16, 24, 40, 0.25)',
        }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className="text-lg font-extrabold tabular-nums whitespace-nowrap"
            style={{ color: 'var(--sfp-gold)' }}
          >
            {fmt(annualLeak)}
          </span>
          <span className="text-xs opacity-80 truncate">/ year leaking</span>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold uppercase tracking-wide"
          style={{ background: 'var(--sfp-gold)', color: 'var(--sfp-ink)' }}
        >
          See report
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
