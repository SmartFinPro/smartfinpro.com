'use client';
// components/tools/shell/fields/currency-field.tsx
// Numeric direct entry ALWAYS; optional coupled slider is an add-on, never
// the only input (SPEC design rule 7). Locale formatting via Intl.NumberFormat.

import { useState, useEffect, useId } from 'react';
import { BaseField, type BaseFieldProps } from './base-field';
import { parseCurrencyInput, clamp, currencyAffix } from '@/lib/tools/field-format';
import type { ToolCurrency } from '@/lib/tools/shell-types';

export interface CurrencyFieldProps extends Omit<BaseFieldProps, 'children'> {
  value: number | '';
  onChange: (v: number | '') => void;    // parent debounces analytics via trackInputChange
  currency: ToolCurrency;
  locale: string;                        // 'en-US' | 'en-GB' | 'en-CA' | 'en-AU' — from market
  min?: number;
  max?: number;
  step?: number;
  slider?: { min: number; max: number; step: number };
}

export function CurrencyField({
  value,
  onChange,
  currency,
  min,
  max,
  step = 1,
  slider,
  ...baseProps
}: CurrencyFieldProps) {
  // Raw text while typing — kept separate from the committed numeric value so
  // partial input ("1,2") is never force-parsed mid-keystroke.
  const [raw, setRaw] = useState<string>(value === '' ? '' : String(value));
  const sliderId = useId();

  useEffect(() => {
    setRaw(value === '' ? '' : String(value));
  }, [value]);

  function commit(nextRaw: string): void {
    const parsed = parseCurrencyInput(nextRaw);
    if (parsed === null) {
      onChange('');
      return;
    }
    onChange(clamp(parsed, min, max));
  }

  return (
    <BaseField {...baseProps}>
      {({ inputId, helpId, errorId }) => (
        <div className="control-row flex items-center gap-2.5">
          <div
            className="input-wrap flex min-h-11 items-center gap-1.5 rounded-tool-control border px-3"
            style={{ borderColor: 'var(--tool-border)' }}
          >
            <span className="unit text-[15px] text-[var(--sfp-slate)]" aria-hidden="true">
              {currencyAffix(currency)}
            </span>
            <input
              id={inputId}
              inputMode="decimal"
              type="text"
              className="tabular-nums w-[110px] min-h-[42px] border-0 bg-transparent text-[var(--sfp-ink)] outline-none"
              value={raw}
              aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
              aria-invalid={baseProps.error ? true : undefined}
              onChange={(e) => setRaw(e.target.value)}
              onBlur={() => commit(raw)}
            />
          </div>
          {slider ? (
            <input
              id={sliderId}
              type="range"
              className="sfp-range min-h-11 flex-1"
              aria-label={`${baseProps.label} slider`}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={value === '' ? slider.min : value}
              onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
            />
          ) : null}
        </div>
      )}
    </BaseField>
  );
}
