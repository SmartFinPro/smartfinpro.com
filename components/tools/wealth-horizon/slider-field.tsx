'use client';
// components/tools/wealth-horizon/slider-field.tsx
// Wealth Horizon v4 — tool-specific, slider-only input control (bindende
// User-Direktive 13.07.2026, see wealth-horizon-live.tsx's header for the
// full context). Deliberately NOT part of the shared
// components/tools/shell/fields/* family: those generic fields keep numeric
// direct entry as their PRIMARY control (SPEC design rule 7, still binding
// for every OTHER tool on the platform) — this component is Wealth
// Horizon's own, explicitly slider-only, opt-in deviation from that rule.
//
// SPEC-Regel-7-Abweichung (dokumentiert): SPEC design rule 7 requires a
// numeric direct-entry control alongside any slider. Wealth Horizon v4's
// Normal mode deliberately ships slider-only per the 13.07. user directive —
// accessibility is preserved because the native <input type="range"> stays
// fully keyboard-operable (arrow keys step by `step`, Home/End jump to the
// input's own min/max, Page Up/Down step by 10× on most browsers) and its
// `aria-valuetext` always carries the exact formatted value, so screen
// reader users still get the precise number even without a parallel text
// box.

import { useId } from 'react';

export interface SliderTick {
  value: number;
  label: string;
}

export interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  /** Optional analytics hook — most callers just use `onChange` directly
   *  (tracker.trackInputChange already debounces 600ms per inputKey), this
   *  exists for callers that want a distinct hook name in their own code. */
  onCommit?: (value: number) => void;
  help?: string;
  inputKey: string;
  /** Labelled orientation points rendered under the track — clickable to
   *  snap the slider to that value. By DEFAULT a tick click calls
   *  `onChange(tick.value)`, exactly like dragging the thumb there. Pass
   *  `onTickClick` when a tick needs to fire different tracking/logic than a
   *  plain drag (e.g. Step 4's return-preset ticks fire
   *  tracker.trackScenarioCompare(...) instead of a plain field-change
   *  event — see wealth-horizon-live.tsx). */
  ticks?: SliderTick[];
  onTickClick?: (tick: SliderTick) => void;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  onCommit,
  help,
  inputKey,
  ticks,
  onTickClick,
}: SliderFieldProps) {
  const inputId = useId();
  const helpId = help ? `${inputId}-help` : undefined;

  return (
    <div className="slider-field flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--sfp-slate)]">
          {label}
        </label>
        <span className="tabular-nums whitespace-nowrap text-[20px] font-semibold text-[var(--sfp-navy)]">
          {format(value)}
        </span>
      </div>
      {/* h-11 touch zone wraps the visually-thin `.sfp-range` track/thumb
          (shared global styles: 8px track, 22px gold thumb) so the tap
          target still meets the ≥44px mobile minimum. */}
      <div className="flex min-h-11 items-center">
        <input
          id={inputId}
          data-input-key={inputKey}
          type="range"
          className="sfp-range w-full"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={format(value)}
          aria-describedby={helpId}
          onChange={(e) => {
            const next = Number(e.target.value);
            onChange(next);
            onCommit?.(next);
          }}
        />
      </div>
      {ticks && ticks.length > 0 ? (
        // Ticks with close values (e.g. 5.5/7.5/9 on a 0–12 scale) produce
        // horizontally-overlapping labels on narrow (mobile) viewports if
        // every label sits in one row — confirmed visually at 390px width
        // (two-row staggering still left adjacent labels touching at the
        // edges). Cycling EVERY tick onto its own row (mod 3) guarantees
        // zero horizontal collision regardless of how close the values are,
        // at the cost of ~80px of vertical space for the (typical) 3-tick
        // case — same staggering principle as lifetime-range.tsx's
        // proximity-safe badges, just fully unrolled instead of alternating.
        <div className="relative h-20 w-full">
          {ticks.map((tick, i) => {
            const pct = Math.max(0, Math.min(100, ((tick.value - min) / (max - min)) * 100));
            const row = i % 3;
            return (
              <button
                key={tick.label}
                type="button"
                className="absolute flex min-h-11 -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap px-2 text-[11px] font-medium text-[var(--sfp-slate)]"
                style={{ left: `${pct}%`, top: `${row * 24}px` }}
                onClick={() => (onTickClick ? onTickClick(tick) : onChange(tick.value))}
              >
                <span aria-hidden="true" className="h-1.5 w-px" style={{ background: 'var(--tool-border-strong)' }} />
                <span>{tick.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {help ? (
        <p id={helpId} className="m-0 text-xs text-[var(--sfp-slate)]">
          {help}
        </p>
      ) : null}
    </div>
  );
}
