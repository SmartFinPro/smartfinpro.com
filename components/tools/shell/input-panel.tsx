'use client';
// components/tools/shell/input-panel.tsx
// Client — form container with an error-summary region (role="alert") and
// section grouping (SPEC 7.3). Fields inside are provided as children /
// section content by the calling tool page; InputPanel itself holds no
// calculation logic.

import type { ReactNode } from 'react';

export interface InputPanelSection {
  key: string;
  title?: string;
  content: ReactNode;
}

export interface InputPanelProps {
  sections?: InputPanelSection[];
  errors?: string[];
  children?: ReactNode;
}

export function InputPanel({ sections, errors = [], children }: InputPanelProps) {
  return (
    <div
      className="panel flex flex-col rounded-tool-panel border"
      style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface)', boxShadow: 'var(--tool-shadow)' }}
    >
      {errors.length > 0 ? (
        <div role="alert" className="section flex flex-col gap-1 border-b p-5 text-sm" style={{ borderColor: 'var(--tool-border)' }}>
          <p className="m-0 font-semibold text-[var(--sfp-red)]">Please check the following:</p>
          <ul className="m-0 list-disc pl-5 text-[var(--sfp-red)]">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {sections
        ? sections.map((s) => (
            <div key={s.key} className="section border-t p-5 first:border-t-0" style={{ borderColor: 'var(--tool-border)' }}>
              {s.title ? (
                <p className="section-label m-0 mb-3 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--sfp-slate)]">
                  {s.title}
                </p>
              ) : null}
              {s.content}
            </div>
          ))
        : (
          <div className="section p-5">{children}</div>
        )}
    </div>
  );
}
