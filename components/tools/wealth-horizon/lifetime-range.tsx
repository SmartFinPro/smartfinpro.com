'use client';
// components/tools/wealth-horizon/lifetime-range.tsx
// Wealth Horizon v4 — two-handle lifetime axis replacing the "Today"/
// "Retirement" IntegerField pair (bindende User-Direktive 13.07.2026). A11y
// pattern: ONE visual track (18..80) with TWO native <input type="range">
// overlaid absolutely, each `pointer-events-none` except its own thumb
// (`::-webkit-slider-thumb`/`::-moz-range-thumb` re-enabled via Tailwind
// arbitrary-variant selectors) — the standard technique for a dual-thumb
// range built from two native inputs instead of a custom pointer-drag
// implementation, so keyboard operation (Tab, arrow keys, Home/End) comes
// for free from the browser.
//
// Constraint: retirement ≥ today + 1. `constrainLifetime` is the single pure
// function that enforces it — see its own doc comment for the exact rule
// (the MOVED handle stops at the other one; the other handle is never
// silently clamped). Both the native inputs' own min/max (18–70 for today,
// 45–80 for retirement) AND this cross-handle stop apply, so Home/End keys
// naturally respect both: End on "today" jumps to the input's own max (70),
// then constrainLifetime clamps it down to retirement−1 if that's lower.

import { useId } from 'react';

export const LIFETIME_TRACK_MIN = 18;
export const LIFETIME_TRACK_MAX = 80;
export const LIFETIME_TODAY_MIN = 18;
export const LIFETIME_TODAY_MAX = 70;
export const LIFETIME_RETIREMENT_MIN = 45;
export const LIFETIME_RETIREMENT_MAX = 80;

export interface LifetimeValues {
  today: number;
  retirement: number;
}

/**
 * Enforces retirement ≥ today + 1 by clamping ONLY the handle that just
 * moved (`changed`) — the other value is returned untouched. This is
 * deliberately NOT a symmetric clamp of both values: dragging "today" up
 * past "retirement − 1" stops today's own handle at that ceiling (today
 * max = retirement − 1); dragging "retirement" down past "today + 1" stops
 * retirement's own handle at that floor (retirement min = today + 1). Each
 * handle's own absolute bounds ([18,70] / [45,80]) are applied first, then
 * the cross-handle stop.
 */
export function constrainLifetime(
  today: number,
  retirement: number,
  changed: 'today' | 'retirement',
): LifetimeValues {
  if (changed === 'today') {
    const bounded = Math.max(LIFETIME_TODAY_MIN, Math.min(LIFETIME_TODAY_MAX, today));
    const stopped = Math.min(bounded, retirement - 1); // today max = retirement − 1
    return { today: stopped, retirement };
  }
  const bounded = Math.max(LIFETIME_RETIREMENT_MIN, Math.min(LIFETIME_RETIREMENT_MAX, retirement));
  const stopped = Math.max(bounded, today + 1); // retirement min = today + 1
  return { today, retirement: stopped };
}

function pct(value: number): number {
  return Math.max(0, Math.min(100, ((value - LIFETIME_TRACK_MIN) / (LIFETIME_TRACK_MAX - LIFETIME_TRACK_MIN)) * 100));
}

export interface LifetimeRangeProps {
  today: number;
  retirement: number;
  onChange: (next: LifetimeValues) => void;
  todayInputKey: string;
  retirementInputKey: string;
}

// Shared overlay technique: transparent full-width native range input,
// pointer events disabled on the whole element and re-enabled only on the
// thumb pseudo-element, so two overlapping inputs never fight over clicks
// anywhere except their own handle.
const OVERLAY_INPUT_CLASSES =
  'sfp-range pointer-events-none absolute inset-0 w-full appearance-none bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto';

export function LifetimeRange({ today, retirement, onChange, todayInputKey, retirementInputKey }: LifetimeRangeProps) {
  const todayId = useId();
  const retirementId = useId();
  const todayPct = pct(today);
  const retirementPct = pct(retirement);

  function handleTodayChange(next: number): void {
    onChange(constrainLifetime(next, retirement, 'today'));
  }
  function handleRetirementChange(next: number): void {
    onChange(constrainLifetime(today, next, 'retirement'));
  }

  return (
    <div className="lifetime-range flex flex-col gap-2">
      {/* Badges are ALWAYS vertically staggered (today above, retirement
          below the track) rather than only when close together — this is a
          deliberate simplification of "stack offset when near" that avoids
          horizontal overlap unconditionally, at the cost of a fixed extra
          ~28px of vertical space even when the handles are far apart. */}
      <div className="relative h-16 w-full">
        <span
          className="absolute -top-1 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
          style={{ left: `${todayPct}%`, background: 'var(--sfp-navy)' }}
        >
          Today {today}
        </span>
        <span
          className="absolute top-7 -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold"
          style={{
            left: `${retirementPct}%`,
            background: 'var(--sfp-gold)',
            borderColor: 'var(--sfp-gold-dark)',
            color: 'var(--sfp-ink)',
          }}
        >
          Retire {retirement}
        </span>

        <div className="absolute top-[52px] min-h-11 w-full">
          <div className="pointer-events-none absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full" style={{ background: 'var(--tool-border)' }}>
            <div
              className="absolute h-1.5 rounded-full"
              style={{ left: `${todayPct}%`, width: `${Math.max(0, retirementPct - todayPct)}%`, background: 'var(--sfp-navy)' }}
            />
          </div>

          <input
            id={todayId}
            data-input-key={todayInputKey}
            type="range"
            aria-label="Your age today"
            aria-valuetext={`age ${today}`}
            min={LIFETIME_TODAY_MIN}
            max={LIFETIME_TODAY_MAX}
            step={1}
            value={today}
            onChange={(e) => handleTodayChange(Number(e.target.value))}
            className={OVERLAY_INPUT_CLASSES}
          />
          <input
            id={retirementId}
            data-input-key={retirementInputKey}
            type="range"
            aria-label="Retirement age"
            aria-valuetext={`retire at ${retirement}`}
            min={LIFETIME_RETIREMENT_MIN}
            max={LIFETIME_RETIREMENT_MAX}
            step={1}
            value={retirement}
            onChange={(e) => handleRetirementChange(Number(e.target.value))}
            className={OVERLAY_INPUT_CLASSES}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs text-[var(--sfp-slate)]">
        <span>{LIFETIME_TRACK_MIN}</span>
        <span>{LIFETIME_TRACK_MAX}</span>
      </div>
    </div>
  );
}
