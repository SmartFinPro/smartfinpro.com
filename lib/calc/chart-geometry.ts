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
