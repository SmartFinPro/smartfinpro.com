'use client';

import { useEffect, useRef, useState } from 'react';

interface LeakBarProps {
  label: string;
  currentSpend: number;
  potentialSavings: number;
  maxSavings: number;
  currencySymbol: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  delay?: number;
}

const SEVERITY_COLOR: Record<LeakBarProps['severity'], string> = {
  low: 'var(--sfp-green)',
  medium: 'var(--sfp-gold)',
  high: 'var(--sfp-gold-dark)',
  critical: 'var(--sfp-red)',
};

/**
 * Animated horizontal leak bar. Grows to its target width on mount.
 * Respects prefers-reduced-motion (renders static if set).
 */
export function LeakBar({
  label,
  currentSpend,
  potentialSavings,
  maxSavings,
  currencySymbol,
  severity,
  reason,
  delay = 0,
}: LeakBarProps) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = maxSavings > 0 ? Math.min(100, (potentialSavings / maxSavings) * 100) : 0;
    if (reduceMotion) {
      setWidth(target);
      return;
    }
    const t = setTimeout(() => setWidth(target), delay);
    return () => clearTimeout(t);
  }, [potentialSavings, maxSavings, delay]);

  const fmt = (n: number) =>
    `${currencySymbol}${Math.round(n).toLocaleString('en-US')}`;

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: SEVERITY_COLOR[severity] }}>
          {potentialSavings > 0 ? `${fmt(potentialSavings)}/yr` : 'On track'}
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div
          className="h-full rounded-full transition-[width] ease-out"
          style={{
            width: `${width}%`,
            background: SEVERITY_COLOR[severity],
            transitionDuration: '800ms',
          }}
        />
      </div>
      {reason && (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
          {reason}
          {currentSpend > 0 && (
            <span className="ml-1 opacity-70">· Current: {fmt(currentSpend)}/mo</span>
          )}
        </p>
      )}
    </div>
  );
}
