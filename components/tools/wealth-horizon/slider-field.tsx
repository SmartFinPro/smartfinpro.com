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
//
// v4.1 restyle (User-Direktive 13.07.2026, image reference — the Money Leak
// Scanner's slider anatomy, see components/tools/money-leak-scanner/
// SliderField.tsx, is now Wealth Horizon's own standard, styling only):
//   - Gold hard-stop track fill (`.sfp-slider`, globals.css) — v4.2
//     (User-Direktive 14.07.2026) replaced v4.1's bespoke 26px-thumb
//     `.wh-slider` with `.sfp-slider`, an exact 1:1 copy of the Money Leak
//     Scanner's own `.sfp-range` thumb/ring anatomy (22px gold thumb, 3px
//     white border, same rgba hover/focus rings) — v4.1's version had
//     drifted from the anatomy it claimed to match.
//   - A min/max/hint row now sits under the track (min left, optional hint
//     centre — the old full-width `help` paragraph moved here, max right).
//   - `card` (default true) wraps the field in the same white rounded-14
//     `.wh-step-card` used by every NumberedStep — this is what makes
//     Advanced settings read as a consistent card list. Steps whose
//     NumberedStep wrapper is ALREADY that same card (every step's single
//     primary slider) pass `card={false}` so the slider isn't double-boxed.
//   - `hideHeader` (default false) hides this component's OWN label/value
//     row when the parent NumberedStep already renders that exact label as
//     its title and that exact value as its big header number — the
//     `<label>` element itself stays in the DOM (visually hidden via
//     `sr-only`), so the native `for`/`id` association still supplies the
//     slider's accessible name unchanged.
//   - No aria/min/max/step/analytics behavior changed — purely visual.

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
  /** v4.1 — wrap this field in its own `.wh-step-card` (border + shadow +
   *  padding). Default true (Advanced settings' natural, consistent card
   *  list). Pass false when a parent NumberedStep already supplies that
   *  same card (every step's primary slider, and Step 2's nested
   *  escalation sub-slider). */
  card?: boolean;
  /** v4.1 — hide this field's own label/value header row (the parent
   *  NumberedStep already shows the identical label as its title and the
   *  identical value as its big header number). The `<label>` stays in the
   *  DOM, visually hidden, so the slider's accessible name is unchanged. */
  hideHeader?: boolean;
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
  card = true,
  hideHeader = false,
}: SliderFieldProps) {
  const inputId = useId();
  const helpId = help ? `${inputId}-help` : undefined;
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const body = (
    <div className="slider-field flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className={hideHeader ? 'sr-only' : 'text-[13px] font-medium text-[var(--sfp-slate)]'}>
          {label}
        </label>
        {!hideHeader ? (
          <span className="wh-slider-value-sm tabular-nums whitespace-nowrap font-semibold text-[var(--sfp-navy)]">
            {format(value)}
          </span>
        ) : null}
      </div>
      {/* h-11 touch zone wraps the visually-thin `.sfp-slider` track/thumb
          (8px track, 22px gold thumb w/ 3px white border — Money Leak
          Scanner's exact anatomy) so the tap target still meets the ≥44px
          mobile minimum. */}
      <div className="flex min-h-11 items-center">
        <input
          id={inputId}
          data-input-key={inputKey}
          type="range"
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
          className="sfp-slider w-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--sfp-gold) 0%, var(--sfp-gold) ${percent}%, var(--tool-border) ${percent}%, var(--tool-border) 100%)`,
          }}
        />
      </div>
      {/* Min/max/hint row — min left, optional hint centre (formerly a
          full-width `help` paragraph below the track), max right. */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-[var(--sfp-slate)]">{format(min)}</span>
        {help ? (
          <span id={helpId} className="mx-2 truncate text-xs text-[var(--sfp-slate)]">
            {help}
          </span>
        ) : null}
        <span className="text-xs tabular-nums text-[var(--sfp-slate)]">{format(max)}</span>
      </div>
      {ticks && ticks.length > 0 ? (
        // Ticks with close values (e.g. 5.5/7.5/9 on a 0–12 scale) produce
        // horizontally-overlapping labels on narrow (mobile) viewports if
        // every label sits in one row — confirmed visually at 390px width
        // (two-row staggering still left adjacent labels touching at the
        // edges). Cycling EVERY tick onto its own row (mod 3) guarantees
        // zero horizontal collision regardless of how close the values are
        // on mobile. NOTE: a `md:top-0` single-row collapse was tried here
        // (per the original brief's "desktop has room for 3 short labels on
        // one line" assumption) and measured to NOT hold — this card lives
        // in the 5-of-12-column input rail, not the full viewport (~439px
        // wide even at a 1280px desktop breakpoint), so the outer two labels
        // ("Conservative 5.5%" / "Optimistic 9%") still collide by 30-40px
        // when forced onto one row. Keeping the mod-3 stagger unconditional
        // (every breakpoint) is the one layout that's collision-free at any
        // width this card can realistically render at — documented deviation,
        // see the restyle report.
        <div className="relative h-20 w-full">
          {ticks.map((tick, i) => {
            const pct = Math.max(0, Math.min(100, ((tick.value - min) / (max - min)) * 100));
            const row = i % 3;
            const rowTopClass = ['top-0', 'top-6', 'top-12'][row];
            return (
              <button
                key={tick.label}
                type="button"
                className={`absolute flex min-h-11 -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap px-2 text-[11px] font-medium text-[var(--sfp-slate)] ${rowTopClass}`}
                style={{ left: `${pct}%` }}
                onClick={() => (onTickClick ? onTickClick(tick) : onChange(tick.value))}
              >
                <span aria-hidden="true" className="h-1.5 w-px" style={{ background: 'var(--tool-border-strong)' }} />
                <span>{tick.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  if (!card) return body;

  return <div className="wh-step-card">{body}</div>;
}
