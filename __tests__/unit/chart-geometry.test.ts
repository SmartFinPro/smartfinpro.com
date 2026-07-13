// __tests__/unit/chart-geometry.test.ts
// Pure SVG geometry (lib/calc/chart-geometry.ts) for the FDL signature
// visuals — corridor/bars/stack/range + the hub miniature wrapper. No React,
// no DOM: assertions are on path strings / rect coordinates only.

import { describe, it, expect } from 'vitest';
import {
  buildCorridorPath,
  buildBarLayout,
  buildStackLayout,
  buildRangeLayout,
  buildMini,
  DEFAULT_FRAME,
  MINI_FRAME,
} from '@/lib/calc/chart-geometry';

describe('buildCorridorPath()', () => {
  const series = [
    { key: 'conservative', rows: [{ x: 30, y: 10 }, { x: 45, y: 40 }, { x: 60, y: 80 }] },
    { key: 'base', rows: [{ x: 30, y: 15 }, { x: 45, y: 55 }, { x: 60, y: 110 }] },
    { key: 'optimistic', rows: [{ x: 30, y: 20 }, { x: 45, y: 70 }, { x: 60, y: 140 }] },
  ];

  it('paths begin with M and use L for subsequent points', () => {
    const layout = buildCorridorPath(series, []);
    for (const p of layout.paths) {
      expect(p.d.startsWith('M')).toBe(true);
      expect(p.d.split(' ').length).toBe(3);
      expect(p.d.includes('L')).toBe(true);
    }
  });

  it('band path is built from optimistic forward + conservative reversed, closed with Z', () => {
    const layout = buildCorridorPath(series, []);
    expect(layout.bandD.endsWith('Z')).toBe(true);
    expect(layout.bandD.startsWith('M')).toBe(true);
  });

  it('markers snap to the base series at matching x', () => {
    const layout = buildCorridorPath(series, [{ x: 45, label: 'FI date' }]);
    expect(layout.markers).toHaveLength(1);
    expect(layout.markers[0].label).toBe('FI date');
    // base row at x=45 has y=55 → marker y should equal the scaled y of that row,
    // NOT the conservative (40) or optimistic (70) row at the same x.
    const baseLine = layout.paths.find((p) => p.key === 'base')!;
    const basePoints = baseLine.d.match(/-?\d+\.\d/g)!;
    // second point of base path corresponds to x=45 → its y is basePoints[3]
    expect(layout.markers[0].y.toFixed(1)).toBe(Number(basePoints[3]).toFixed(1));
  });

  it('empty series returns empty layout without throwing', () => {
    const layout = buildCorridorPath([], []);
    expect(layout).toEqual({ paths: [], bandD: '', markers: [], xTicks: [], yTicks: [] });
  });

  it('series with all-zero y values does not NaN (yMax floored at 1)', () => {
    const zeroSeries = [{ key: 'base', rows: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }];
    const layout = buildCorridorPath(zeroSeries, []);
    expect(layout.paths[0].d).not.toContain('NaN');
    for (const t of layout.yTicks) expect(Number.isNaN(t.y)).toBe(false);
  });

  it('single-point series (xMin === xMax) does not divide by zero', () => {
    const single = [{ key: 'base', rows: [{ x: 10, y: 5 }] }];
    const layout = buildCorridorPath(single, []);
    expect(layout.paths[0].d).not.toContain('NaN');
  });

  it('yTicks/xTicks are populated for a non-empty series', () => {
    const layout = buildCorridorPath(series, []);
    expect(layout.yTicks).toHaveLength(5);
    expect(layout.xTicks).toHaveLength(3);
  });
});

describe('buildBarLayout()', () => {
  it('lays out bars proportional to the max value, within the frame', () => {
    const layout = buildBarLayout([
      { key: 'a', label: 'A', value: 100 },
      { key: 'b', label: 'B', value: 50, emphasis: true },
    ]);
    expect(layout.bars).toHaveLength(2);
    const [a, b] = layout.bars;
    expect(a.w).toBeGreaterThan(b.w); // 100 > 50 → wider bar
    expect(b.emphasis).toBe(true);
    expect(a.emphasis).toBe(false);
    for (const bar of layout.bars) {
      expect(bar.x).toBeGreaterThanOrEqual(0);
      expect(bar.w).toBeLessThanOrEqual(DEFAULT_FRAME.width);
    }
  });

  it('empty bars array returns empty layout without throwing', () => {
    expect(buildBarLayout([])).toEqual({ bars: [] });
  });

  it('includes totalLabel only when a total is passed', () => {
    const withTotal = buildBarLayout([{ key: 'a', label: 'A', value: 10 }], { label: 'Total', value: 10 });
    expect(withTotal.totalLabel?.text).toContain('Total');
    const withoutTotal = buildBarLayout([{ key: 'a', label: 'A', value: 10 }]);
    expect(withoutTotal.totalLabel).toBeUndefined();
  });
});

describe('buildStackLayout()', () => {
  it('segments occupy sequential, non-overlapping x ranges summing to the track width when uncapped', () => {
    const layout = buildStackLayout([
      { key: 'principal', label: 'Principal', value: 60 },
      { key: 'interest', label: 'Interest', value: 40 },
    ]);
    expect(layout.segments).toHaveLength(2);
    const [first, second] = layout.segments;
    expect(second.x).toBeCloseTo(first.x + first.w, 1);
    const innerW = DEFAULT_FRAME.width - 2 * DEFAULT_FRAME.padX;
    expect(first.w + second.w).toBeCloseTo(innerW, 1);
  });

  it('a cap larger than the total scales the stack to occupy less than the full track (capX marks the ceiling)', () => {
    const layout = buildStackLayout([{ key: 'a', label: 'A', value: 50 }], 100);
    expect(layout.capX).toBeDefined();
    const innerW = DEFAULT_FRAME.width - 2 * DEFAULT_FRAME.padX;
    expect(layout.segments[0].w).toBeCloseTo(innerW / 2, 1);
  });

  it('empty segments returns empty layout without throwing', () => {
    expect(buildStackLayout([])).toEqual({ segments: [] });
  });
});

describe('buildRangeLayout()', () => {
  it('band x/width fall within the track for a range inside the axis', () => {
    const layout = buildRangeLayout(200, 400, 0, 1000);
    expect(layout.bandX).toBeGreaterThanOrEqual(layout.trackX);
    expect(layout.bandX + layout.bandW).toBeLessThanOrEqual(layout.trackX + layout.trackW + 0.01);
  });

  it('clamps low/high/marker outside the axis bounds', () => {
    const layout = buildRangeLayout(-500, 2000, 0, 1000, 5000);
    expect(layout.bandX).toBeCloseTo(layout.trackX, 1);
    expect(layout.bandX + layout.bandW).toBeCloseTo(layout.trackX + layout.trackW, 1);
    expect(layout.markerX).toBeCloseTo(layout.trackX + layout.trackW, 1);
  });

  it('omits markerX when no marker is passed', () => {
    const layout = buildRangeLayout(0, 100, 0, 100);
    expect(layout.markerX).toBeUndefined();
  });
});

describe('buildMini()', () => {
  it('returns a 120x64 viewBox regardless of visual kind', () => {
    const corridor = buildMini({
      kind: 'corridor',
      series: [{ key: 'base', rows: [{ x: 0, y: 1 }, { x: 1, y: 2 }] }],
      markers: [],
      xLabel: 'Age',
      yLabel: 'Value',
      textAlternative: 'alt',
    });
    expect(corridor.viewBox).toBe(`0 0 ${MINI_FRAME.width} ${MINI_FRAME.height}`);

    const bars = buildMini({
      kind: 'bars',
      bars: [{ key: 'a', label: 'A', value: 1 }],
      textAlternative: 'alt',
    });
    expect(bars.viewBox).toBe('0 0 120 64');

    const stack = buildMini({
      kind: 'stack',
      segments: [{ key: 'a', label: 'A', value: 1 }],
      textAlternative: 'alt',
    });
    expect(stack.viewBox).toBe('0 0 120 64');

    const range = buildMini({
      kind: 'range',
      low: 1,
      high: 2,
      axisLow: 0,
      axisHigh: 10,
      textAlternative: 'alt',
    });
    expect(range.viewBox).toBe('0 0 120 64');
  });
});
