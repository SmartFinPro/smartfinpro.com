'use client';

// components/tools/money-leak-scanner/LeakDonut.tsx
// Pure SVG donut chart visualizing the six leak categories by potential savings.
// No external chart library.

import { useEffect, useRef, useState } from 'react';
import type { LeakCategoryResult, Severity } from '@/lib/money-leak/types';

interface LeakDonutProps {
  categories: LeakCategoryResult[];
  currencySymbol: string;
  totalAnnual: number;
  size?: number;
}

const SEVERITY_COLOR: Record<Severity, string> = {
  low: 'var(--sfp-green)',
  medium: 'var(--sfp-gold)',
  high: 'var(--sfp-gold-dark)',
  critical: 'var(--sfp-red)',
};

/**
 * Renders a donut chart from category savings. If total savings is 0, shows
 * a single muted ring (the "on track" state). Animates arc growth on mount
 * and respects prefers-reduced-motion.
 */
export function LeakDonut({
  categories,
  currencySymbol,
  totalAnnual,
  size = 220,
}: LeakDonutProps) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    setProgress(0);
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // key on totalAnnual so re-animates only when the user meaningfully changes the result
  }, [totalAnnual]);

  const stroke = Math.max(16, Math.round(size * 0.12));
  const radius = size / 2 - stroke / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Sort by savings desc; drop zero-savings; cap at 6
  const sliced = categories
    .map((c) => ({
      id: c.id,
      label: c.label,
      value: Math.max(0, c.potentialSavings),
      severity: c.severity,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalValue = sliced.reduce((s, c) => s + c.value, 0);
  const hasData = totalValue > 0;

  // Build arcs. Small gap between slices (2°).
  const GAP_DEG = 2;
  const gapCircumference = (GAP_DEG / 360) * circumference;
  const arcs = hasData
    ? sliced.map((c) => {
        const fraction = c.value / totalValue;
        const arcLen = Math.max(0, fraction * circumference - gapCircumference);
        return { ...c, arcLen };
      })
    : [];

  const fmt = (n: number) =>
    `${currencySymbol}${Math.round(n).toLocaleString('en-US')}`;

  const ariaLabel = hasData
    ? `Annual money leak ${fmt(totalAnnual)}. Top categories: ${sliced
        .slice(0, 3)
        .map((c) => `${c.label} ${fmt(c.value)}`)
        .join(', ')}.`
    : `No money leaks detected — on track.`;

  let offset = 0;

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size, maxWidth: '100%', aspectRatio: '1 / 1' }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* Base track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--sfp-gray)"
          strokeWidth={stroke}
        />
        {!hasData && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--sfp-green)"
            strokeWidth={stroke}
            strokeDasharray={`${circumference * progress} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
        )}
        {hasData &&
          arcs.map((a, i) => {
            const dash = a.arcLen * progress;
            const node = (
              <circle
                key={a.id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={SEVERITY_COLOR[a.severity]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke 300ms ease' }}
              />
            );
            offset += a.arcLen + gapCircumference;
            return node;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            i;
          })}
      </svg>

      {/* Centered label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
        <div
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: 'var(--sfp-slate)' }}
        >
          Annual leak
        </div>
        <div
          className="text-2xl md:text-3xl font-extrabold tabular-nums leading-tight"
          style={{ color: hasData ? 'var(--sfp-navy)' : 'var(--sfp-green)' }}
        >
          {fmt(totalAnnual)}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
          {hasData ? 'recoverable / year' : 'on track'}
        </div>
      </div>
    </div>
  );
}
