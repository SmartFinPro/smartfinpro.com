// lib/calc/chart-geometry.ts
// Pure geometry for the signature visuals — consumed by ScenarioChart (RSC
// and island render the SAME markup from the same data) and by the hub
// miniatures (buildMini). No React, no DOM, no Date.now.

import type { ScenarioVisualData } from '@/lib/tools/shell-types';

export interface ChartFrame { width: number; height: number; padX: number; padY: number }
export const DEFAULT_FRAME: ChartFrame = { width: 640, height: 280, padX: 44, padY: 24 };
export const MINI_FRAME: ChartFrame = { width: 120, height: 64, padX: 6, padY: 6 };

export interface CorridorLayout {
  /** SVG path 'd' per scenario key, drawn in the frame's coordinate space. */
  paths: { key: string; d: string }[];
  /** Filled band between conservative and optimistic (single path). */
  bandD: string;
  markers: { x: number; y: number; label: string }[];
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
}

export function buildCorridorPath(
  series: { key: string; rows: { x: number; y: number }[] }[],
  markers: { x: number; label: string }[],
  frame: ChartFrame = DEFAULT_FRAME,
  formatY: (v: number) => string = (v) => String(v),
): CorridorLayout {
  const all = series.flatMap((s) => s.rows);
  if (all.length === 0) return { paths: [], bandD: '', markers: [], xTicks: [], yTicks: [] };
  const xMin = Math.min(...all.map((r) => r.x));
  const xMax = Math.max(...all.map((r) => r.x));
  const yMax = Math.max(...all.map((r) => r.y), 1);
  const innerW = frame.width - 2 * frame.padX;
  const innerH = frame.height - 2 * frame.padY;
  const sx = (x: number) => frame.padX + (xMax === xMin ? 0 : ((x - xMin) / (xMax - xMin)) * innerW);
  const sy = (y: number) => frame.height - frame.padY - (y / yMax) * innerH;
  const toPath = (rows: { x: number; y: number }[]) =>
    rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${sx(r.x).toFixed(1)},${sy(r.y).toFixed(1)}`).join(' ');

  const cons = series.find((s) => s.key === 'conservative')?.rows ?? [];
  const opti = series.find((s) => s.key === 'optimistic')?.rows ?? [];
  const bandD = cons.length && opti.length
    ? `${toPath(opti)} ${[...cons].reverse().map((r) => `L${sx(r.x).toFixed(1)},${sy(r.y).toFixed(1)}`).join(' ')} Z`
    : '';

  const yStep = yMax / 4;
  return {
    paths: series.map((s) => ({ key: s.key, d: toPath(s.rows) })),
    bandD,
    markers: markers.map((m) => {
      const row = series.find((s) => s.key === 'base')?.rows.find((r) => r.x === m.x)
        ?? all.find((r) => r.x === m.x);
      return { x: sx(m.x), y: row ? sy(row.y) : frame.padY, label: m.label };
    }),
    xTicks: [xMin, Math.round((xMin + xMax) / 2), xMax].map((x) => ({ x: sx(x), label: String(x) })),
    yTicks: [0, 1, 2, 3, 4].map((i) => ({ y: sy(i * yStep), label: formatY(i * yStep) })),
  };
}

// ---------------------------------------------------------------------------
// Bars — priced/prioritized horizontal or vertical bars (Money Leak signature
// visual). Bars are laid out left→right in array order (callers pre-sort);
// each bar gets a rect origin/size in the frame's coordinate space.
// ---------------------------------------------------------------------------

export interface BarLayout {
  bars: { key: string; label: string; x: number; y: number; w: number; h: number; emphasis: boolean }[];
  totalLabel?: { x: number; y: number; text: string };
}

export function buildBarLayout(
  bars: { key: string; label: string; value: number; emphasis?: boolean }[],
  total?: { label: string; value: number },
  frame: ChartFrame = DEFAULT_FRAME,
): BarLayout {
  if (bars.length === 0) return { bars: [] };
  const innerW = frame.width - 2 * frame.padX;
  const innerH = frame.height - 2 * frame.padY;
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const gap = 8;
  const barH = Math.max(1, (innerH - gap * (bars.length - 1)) / bars.length);

  const laidOut = bars.map((b, i) => ({
    key: b.key,
    label: b.label,
    x: frame.padX,
    y: frame.padY + i * (barH + gap),
    w: Math.max(0, (b.value / maxVal) * innerW),
    h: barH,
    emphasis: b.emphasis ?? false,
  }));

  return {
    bars: laidOut,
    ...(total
      ? { totalLabel: { x: frame.padX, y: Math.max(0, frame.padY - 8), text: `${total.label}: ${total.value}` } }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Stack — single segmented bar (e.g. Home Lab payment stack), optionally
// capped at a max width representing an affordability ceiling.
// ---------------------------------------------------------------------------

export interface StackLayout {
  segments: { key: string; label: string; x: number; w: number }[];
  capX?: number;
}

export function buildStackLayout(
  segments: { key: string; label: string; value: number }[],
  cap?: number,
  frame: ChartFrame = DEFAULT_FRAME,
): StackLayout {
  if (segments.length === 0) return { segments: [] };
  const innerW = frame.width - 2 * frame.padX;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  // denom = the value that maps to the FULL track width — a supplied cap
  // (affordability ceiling) if larger than the stack total, else the total
  // itself (stack fills the track exactly).
  const denom = cap && cap > total ? cap : total;

  let cursor = frame.padX;
  const laidOut = segments.map((s) => {
    const w = (s.value / denom) * innerW;
    const seg = { key: s.key, label: s.label, x: cursor, w: Math.max(0, w) };
    cursor += seg.w;
    return seg;
  });

  return {
    segments: laidOut,
    ...(cap ? { capX: frame.padX + (cap / denom) * innerW } : {}),
  };
}

// ---------------------------------------------------------------------------
// Range — a single min–max band on an axis with an optional target marker
// (Home Lab affordability range).
// ---------------------------------------------------------------------------

export interface RangeLayout {
  trackX: number;
  trackW: number;
  bandX: number;
  bandW: number;
  markerX?: number;
}

export function buildRangeLayout(
  low: number,
  high: number,
  axisLow: number,
  axisHigh: number,
  marker?: number,
  frame: ChartFrame = DEFAULT_FRAME,
): RangeLayout {
  const innerW = frame.width - 2 * frame.padX;
  const span = axisHigh - axisLow || 1;
  const scale = (v: number) => frame.padX + ((v - axisLow) / span) * innerW;
  const bandX = scale(Math.max(axisLow, Math.min(low, axisHigh)));
  const bandRight = scale(Math.max(axisLow, Math.min(high, axisHigh)));

  return {
    trackX: frame.padX,
    trackW: innerW,
    bandX,
    bandW: Math.max(0, bandRight - bandX),
    ...(marker !== undefined ? { markerX: scale(Math.max(axisLow, Math.min(marker, axisHigh))) } : {}),
  };
}

// ---------------------------------------------------------------------------
// Hub miniature — 120×64 frame, reduced tick set, same visual kinds.
// ---------------------------------------------------------------------------

export function buildMini(
  data: ScenarioVisualData,
): { viewBox: string; body: CorridorLayout | BarLayout | StackLayout | RangeLayout } {
  const viewBox = `0 0 ${MINI_FRAME.width} ${MINI_FRAME.height}`;
  switch (data.kind) {
    case 'corridor':
      return { viewBox, body: buildCorridorPath(data.series, data.markers, MINI_FRAME) };
    case 'bars':
      return { viewBox, body: buildBarLayout(data.bars, data.total, MINI_FRAME) };
    case 'stack':
      return { viewBox, body: buildStackLayout(data.segments, data.cap?.value, MINI_FRAME) };
    case 'range':
      return {
        viewBox,
        body: buildRangeLayout(data.low, data.high, data.axisLow, data.axisHigh, data.marker?.value, MINI_FRAME),
      };
  }
}

// ---------------------------------------------------------------------------
// Milestones — pure helper (Wealth Horizon v2). First age at which a balance
// series crosses each of a set of thresholds. `rows` MUST be ordered
// ascending by age (the engine's own row/decumulationRows convention).
// ---------------------------------------------------------------------------

export function findMilestoneCrossings(
  rows: { age: number; balance: number }[],
  thresholds: number[],
): { threshold: number; age: number }[] {
  const result: { threshold: number; age: number }[] = [];
  for (const threshold of thresholds) {
    const hit = rows.find((r) => r.balance >= threshold);
    if (hit) result.push({ threshold, age: hit.age });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Lifetime Path (Wealth Horizon v2 signature visual) — a single continuous
// age axis (currentAge → endAge, typically 90) spanning BOTH the
// accumulation phase (currentAge..retireAge, drawn as a conservative↔
// optimistic corridor band + 3 lines) and the decumulation phase
// (retireAge..depletion/endAge, same 3 lines continuing from where
// accumulation left off — no second scale, no seam). RSC-safe: pure
// geometry, no React/DOM.
// ---------------------------------------------------------------------------

export interface LifetimeSeriesInput {
  key: 'conservative' | 'base' | 'optimistic';
  accumulation: { age: number; balance: number }[];
  decumulation: { age: number; balance: number }[];
}

export interface LifetimeLayoutInput {
  series: LifetimeSeriesInput[];
  currentAge: number;
  retireAge: number;
  endAge: number; // typically 90
  /** FI marker age (focused scenario), or null if FI isn't reached. */
  fiAge: number | null;
  /** Depletion marker age (focused scenario), or null if funds last to endAge. */
  depletionAge: number | null;
  /** Milestone crossings (base accumulation line), each with a pre-formatted label. */
  milestones: { age: number; balance: number; label: string }[];
  frame?: ChartFrame;
  formatY?: (v: number) => string;
}

export interface LifetimeLayout {
  frame: ChartFrame;
  accumulationPaths: { key: string; d: string }[];
  decumulationPaths: { key: string; d: string }[];
  /** Accumulation-phase corridor band (conservative↔optimistic), same
   *  convention as buildCorridorPath's bandD. */
  bandD: string;
  retirementZone: { x: number; width: number; y: number; height: number };
  dividerX: number;
  fiMarker: { x: number; y: number; age: number } | null;
  depletionMarker: { x: number; y: number; age: number } | null;
  milestoneMarkers: { x: number; y: number; age: number; label: string; labelAbove: boolean }[];
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
  /** Same-process scale functions (age→x, balance→y) — exposed so a
   *  consumer (e.g. the Lifetime Path RSC component) can derive extra
   *  same-scale coordinates (hover-point serialization for its client
   *  overlay) WITHOUT re-deriving yMax/frame math a second time. Never
   *  serialized across a client boundary itself — only the plain-data
   *  points a caller builds from them are. */
  scale: { sx: (age: number) => number; sy: (balance: number) => number };
}

function pathFrom(rows: { age: number; balance: number }[], sx: (v: number) => number, sy: (v: number) => number): string {
  return rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${sx(r.age).toFixed(1)},${sy(r.balance).toFixed(1)}`).join(' ');
}

/** Balance of `key`'s series (accumulation, falling back to decumulation) at `age`. */
function balanceAt(series: LifetimeSeriesInput[], key: string, age: number): number | null {
  const s = series.find((x) => x.key === key);
  if (!s) return null;
  const row = s.accumulation.find((r) => r.age === age) ?? s.decumulation.find((r) => r.age === age);
  return row ? row.balance : null;
}

export function buildLifetimeLayout(input: LifetimeLayoutInput): LifetimeLayout {
  const frame = input.frame ?? DEFAULT_FRAME;
  const formatY = input.formatY ?? ((v: number) => String(v));
  const allRows = input.series.flatMap((s) => [...s.accumulation, ...s.decumulation]);
  const yMax = Math.max(...allRows.map((r) => r.balance), 1);

  const xMin = input.currentAge;
  const xMax = input.endAge;
  const innerW = frame.width - 2 * frame.padX;
  const innerH = frame.height - 2 * frame.padY;
  const sx = (age: number) => frame.padX + (xMax === xMin ? 0 : ((age - xMin) / (xMax - xMin)) * innerW);
  const sy = (balance: number) => frame.height - frame.padY - (balance / yMax) * innerH;

  const accumulationPaths = input.series.map((s) => ({ key: s.key, d: pathFrom(s.accumulation, sx, sy) }));
  const decumulationPaths = input.series.map((s) => ({ key: s.key, d: pathFrom(s.decumulation, sx, sy) }));

  const consAcc = input.series.find((s) => s.key === 'conservative')?.accumulation ?? [];
  const optiAcc = input.series.find((s) => s.key === 'optimistic')?.accumulation ?? [];
  const bandD = consAcc.length && optiAcc.length
    ? `${pathFrom(optiAcc, sx, sy)} ${[...consAcc].reverse().map((r) => `L${sx(r.age).toFixed(1)},${sy(r.balance).toFixed(1)}`).join(' ')} Z`
    : '';

  const dividerX = sx(input.retireAge);
  const retirementZone = {
    x: dividerX,
    width: Math.max(0, sx(xMax) - dividerX),
    y: frame.padY,
    height: innerH,
  };

  const fiMarker = (() => {
    if (input.fiAge === null) return null;
    const y = balanceAt(input.series, 'base', input.fiAge);
    return { x: sx(input.fiAge), y: y !== null ? sy(y) : frame.padY, age: input.fiAge };
  })();

  const depletionMarker = (() => {
    if (input.depletionAge === null) return null;
    return { x: sx(input.depletionAge), y: sy(0), age: input.depletionAge };
  })();

  const milestoneMarkers = input.milestones.map((m, i) => ({
    x: sx(m.age),
    y: sy(m.balance),
    age: m.age,
    label: m.label,
    labelAbove: i % 2 === 0,
  }));

  const yStep = yMax / 4;
  return {
    frame,
    accumulationPaths,
    decumulationPaths,
    bandD,
    retirementZone,
    dividerX,
    fiMarker,
    depletionMarker,
    milestoneMarkers,
    xTicks: [xMin, input.retireAge, xMax].map((age) => ({ x: sx(age), label: String(age) })),
    yTicks: [0, 1, 2, 3, 4].map((i) => ({ y: sy(i * yStep), label: formatY(i * yStep) })),
    scale: { sx, sy },
  };
}
