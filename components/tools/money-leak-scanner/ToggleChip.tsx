'use client';

// components/tools/money-leak-scanner/ToggleChip.tsx
// Accessible on/off chip for lifestyle questions.

import { Check } from 'lucide-react';

interface ToggleChipProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleChip({ label, hint, checked, onChange }: ToggleChipProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full text-left rounded-xl border p-3 md:p-4 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{
        borderColor: checked ? 'var(--sfp-gold)' : '#E5E7EB',
        background: checked ? 'rgba(245, 166, 35, 0.06)' : '#ffffff',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center rounded-md shrink-0"
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            background: checked ? 'var(--sfp-gold)' : '#F3F4F6',
            color: '#ffffff',
            transition: 'background 150ms ease',
          }}
        >
          {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>
            {label}
          </div>
          {hint && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
              {hint}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
