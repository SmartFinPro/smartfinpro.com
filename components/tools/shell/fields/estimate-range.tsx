'use client';
// components/tools/shell/fields/estimate-range.tsx
// The "I'm not sure" estimate affordance (SPEC 7.3, base-field.tsx
// `notSureHint`): a small set of coarse, labeled buckets a user can pick
// instead of typing an exact figure. Selecting a bucket commits its
// representative value (caller decides what that is — typically a
// midpoint) exactly like any other field's onChange.

import { BaseField, type BaseFieldProps } from './base-field';

export interface EstimateRangeOption {
  label: string;      // e.g. "$50–150/mo"
  value: number;       // representative value committed on selection
}

export interface EstimateRangeProps extends Omit<BaseFieldProps, 'children'> {
  value: number | '';
  onChange: (v: number) => void;
  options: EstimateRangeOption[];
}

export function EstimateRangeField({ value, onChange, options, ...baseProps }: EstimateRangeProps) {
  return (
    <BaseField {...baseProps}>
      {({ inputId, helpId, errorId }) => (
        <div
          id={inputId}
          role="radiogroup"
          aria-label={baseProps.label}
          aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          className="flex flex-wrap gap-2"
        >
          {options.map((opt) => {
            const selected = value !== '' && value === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(opt.value)}
                className="chip-btn min-h-8 rounded-full border px-3 py-1.5 text-[13px]"
                style={{
                  borderColor: selected ? 'var(--sfp-navy)' : 'var(--tool-border)',
                  background: selected ? 'var(--sfp-navy)' : 'var(--tool-surface)',
                  color: selected ? '#fff' : 'var(--sfp-ink)',
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </BaseField>
  );
}
