'use client';
// components/tools/shell/fields/segmented-control.tsx
// Discrete choice control (SPEC 7.1 `.seg` pattern) — used for e.g. frequency
// toggles or market switches inside a tool's input panel. 44px targets,
// aria-pressed on the active option, focus-visible ring, no hover-translate.

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  label: string;
  inputKey: string;
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string = string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--sfp-ink)]">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="seg inline-flex overflow-hidden rounded-tool-control border"
        style={{ borderColor: 'var(--tool-border)' }}
      >
        {options.map((opt) => {
          const pressed = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(opt.value)}
              className="min-h-11 border-0 px-4 text-sm"
              style={{
                background: pressed ? 'var(--sfp-navy)' : 'var(--tool-surface)',
                color: pressed ? '#fff' : 'var(--sfp-ink)',
                fontWeight: pressed ? 600 : 400,
                borderLeft: '1px solid var(--tool-border)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
