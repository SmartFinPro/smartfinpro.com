'use client';
// components/tools/shell/fields/duration-field.tsx
// Analogous to CurrencyField (SPEC 7.3) — integer years/months entry with a
// unit suffix (default 'years'); no decimal parsing needed.

import { useState, useEffect, useId } from 'react';
import { BaseField, type BaseFieldProps } from './base-field';
import { parseNumericInput, clamp } from '@/lib/tools/field-format';

export interface DurationFieldProps extends Omit<BaseFieldProps, 'children'> {
  value: number | '';
  onChange: (v: number | '') => void;
  unit?: 'years' | 'months';
  min?: number;
  max?: number;
  slider?: { min: number; max: number; step: number };
}

export function DurationField({
  value,
  onChange,
  unit = 'years',
  min,
  max,
  slider,
  ...baseProps
}: DurationFieldProps) {
  const [raw, setRaw] = useState<string>(value === '' ? '' : String(value));
  const sliderId = useId();

  useEffect(() => {
    setRaw(value === '' ? '' : String(value));
  }, [value]);

  function commit(nextRaw: string): void {
    const parsed = parseNumericInput(nextRaw);
    if (parsed === null) {
      onChange('');
      return;
    }
    onChange(clamp(Math.round(parsed), min, max));
  }

  return (
    <BaseField {...baseProps}>
      {({ inputId, helpId, errorId }) => (
        <div className="control-row flex items-center gap-2.5">
          <div
            className="input-wrap flex min-h-11 items-center gap-1.5 rounded-tool-control border px-3"
            style={{ borderColor: 'var(--tool-border)' }}
          >
            <input
              id={inputId}
              inputMode="numeric"
              type="text"
              className="tabular-nums w-[110px] min-h-[42px] border-0 bg-transparent text-[var(--sfp-ink)] outline-none"
              value={raw}
              aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
              aria-invalid={baseProps.error ? true : undefined}
              onChange={(e) => setRaw(e.target.value)}
              onBlur={() => commit(raw)}
            />
            <span className="unit text-[15px] text-[var(--sfp-slate)]" aria-hidden="true">{unit}</span>
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
