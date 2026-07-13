'use client';
// components/tools/shell/fields/integer-field.tsx
// Analogous to CurrencyField (SPEC 7.3) — plain whole-number entry (counts:
// dependents, accounts, cards, etc.), locale grouping on display only.

import { useState, useEffect } from 'react';
import { BaseField, type BaseFieldProps } from './base-field';
import { parseNumericInput, clamp } from '@/lib/tools/field-format';

export interface IntegerFieldProps extends Omit<BaseFieldProps, 'children'> {
  value: number | '';
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
}

export function IntegerField({ value, onChange, min, max, ...baseProps }: IntegerFieldProps) {
  const [raw, setRaw] = useState<string>(value === '' ? '' : String(value));

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
        </div>
      )}
    </BaseField>
  );
}
