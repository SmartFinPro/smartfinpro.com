'use client';

// components/tools/money-leak-scanner/SliderField.tsx
// Accessible range input with gold thumb + gradient fill + live number.
// Part of the single-page Money Leak Scanner live calculator.

import { type LucideIcon } from 'lucide-react';

interface SliderFieldProps {
  label: string;
  hint?: string;
  icon?: LucideIcon;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  format?: (v: number) => string;
  ariaLabel?: string;
}

export function SliderField({
  label,
  hint,
  icon: Icon,
  value,
  onChange,
  min,
  max,
  step,
  prefix = '',
  suffix = '',
  format,
  ariaLabel,
}: SliderFieldProps) {
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const displayValue = format ? format(value) : `${prefix}${value.toLocaleString('en-US')}${suffix}`;
  const minLabel = format ? format(min) : `${prefix}${min.toLocaleString('en-US')}${suffix}`;
  const maxLabel = format
    ? format(max)
    : `${prefix}${max.toLocaleString('en-US')}${suffix}+`;

  return (
    <div className="rounded-xl bg-white border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <span
              className="inline-flex items-center justify-center rounded-md shrink-0"
              style={{
                width: 28,
                height: 28,
                background: 'var(--sfp-sky)',
                color: 'var(--sfp-navy)',
              }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--sfp-ink)' }}>
            {label}
          </span>
        </div>
        <span
          className="text-lg md:text-xl font-extrabold tabular-nums whitespace-nowrap"
          style={{ color: 'var(--sfp-navy)' }}
        >
          {displayValue}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel || label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="sfp-range w-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--sfp-gold) 0%, var(--sfp-gold) ${percent}%, #E5E7EB ${percent}%, #E5E7EB 100%)`,
        }}
      />

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs tabular-nums" style={{ color: 'var(--sfp-slate)' }}>
          {minLabel}
        </span>
        {hint && (
          <span className="text-xs truncate mx-2" style={{ color: 'var(--sfp-slate)' }}>
            {hint}
          </span>
        )}
        <span className="text-xs tabular-nums" style={{ color: 'var(--sfp-slate)' }}>
          {maxLabel}
        </span>
      </div>
    </div>
  );
}
