// lib/tools/count-up.ts
// Pure easing/interpolation math behind the Wealth Horizon v3 hero
// "count-up" animation (DESIGN-DIREKTIVE v3, item 2: "große Zahl ... mit
// Count-up-Animation (~500 ms, requestAnimationFrame, easing-out, startet
// vom vorherigen Wert; prefers-reduced-motion: sofort setzen)"). No React,
// no DOM, no requestAnimationFrame here — the imperative rAF loop lives in
// the component (wealth-horizon-live.tsx); this file only holds the pure,
// unit-testable math so the animation curve itself can be verified without
// a browser.

/** Clamped ease-out-cubic — fast start, gentle settle. `t` is progress in [0,1]. */
export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/** Interpolates from `from` to `to` along the ease-out-cubic curve at `progress` (0..1). */
export function interpolateCountUp(from: number, to: number, progress: number): number {
  return from + (to - from) * easeOutCubic(progress);
}
