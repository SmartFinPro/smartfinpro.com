'use client';
// components/tools/shell/fields/base-field.tsx
// Shared label/help/error scaffold for the Financial Field family (SPEC 7.3).
// Every field type (currency/percentage/duration/integer/estimate-range/
// segmented-control) composes this — it owns the label, the a11y wiring
// (htmlFor/aria-describedby ids) and the help/error text rows, and hands the
// actual control markup back to the caller via the render-prop `children`.

import { useId } from 'react';

export interface BaseFieldProps {
  label: string;
  inputKey: string;                       // = analytics inputKey
  help?: string;
  error?: string | null;
  notSureHint?: string;                   // renders an "I'm not sure" estimate affordance
  required?: boolean;
  /** Visually hide the label (kept for screen readers). Use when a visible
   *  heading right above the field already says the same thing — e.g. the
   *  numbered-step titles in Wealth Horizon v3 — so the text isn't doubled. */
  hideLabel?: boolean;
  children: (ids: { inputId: string; helpId?: string; errorId?: string }) => React.ReactNode;
}

export function BaseField({ label, help, error, notSureHint, required, hideLabel, children }: BaseFieldProps) {
  const inputId = useId();
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-err` : undefined;
  return (
    <div className="field flex flex-col gap-1.5">
      <div className={hideLabel && !notSureHint ? 'sr-only' : 'flex items-center justify-between gap-2'}>
        <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'text-sm font-medium text-[var(--sfp-ink)]'}>
          {label}{required ? <span aria-hidden="true"> *</span> : null}
        </label>
        {notSureHint ? (
          <span className="chip-btn rounded-full border border-[var(--tool-border)] px-2 py-0.5 text-xs text-[var(--sfp-slate)]">
            {notSureHint}
          </span>
        ) : null}
      </div>
      {children({ inputId, helpId, errorId })}
      {help ? <p id={helpId} className="text-xs text-[var(--sfp-slate)]">{help}</p> : null}
      {error ? <p id={errorId} role="alert" className="text-xs text-[var(--sfp-red)]">{error}</p> : null}
    </div>
  );
}
