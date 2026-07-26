// __tests__/unit/shell-rsc-smoke.test.ts
// Render-to-string smoke test (PR 2.1 brief) for the RSC-contract shell
// components — tool-shell, scenario-chart (all 4 visual kinds), assumptions-
// drawer, tool-trust-strip, live-canvas, precision-worksheet — against an
// example ToolResult. These six files must stay plain server components (no
// 'use client'), so this test uses `react-dom/server` renderToStaticMarkup
// directly (no jsdom) and plain React.createElement (this file is `.test.ts`,
// not `.tsx`, per the vitest include glob) to prove they render without
// throwing and never render an empty/blank tree.
//
// This is NOT an e2e/hydration test — the shell is unmounted in this PR (see
// AK "Shell nirgends gemountet"), so there is no live route to exercise.

import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ToolShell } from '@/components/tools/shell/tool-shell';
import { ToolTrustStrip } from '@/components/tools/shell/tool-trust-strip';
import { ScenarioChart } from '@/components/tools/shell/scenario-chart';
import { AssumptionsDrawer } from '@/components/tools/shell/assumptions-drawer';
import { LiveCanvasLayout } from '@/components/tools/shell/live-canvas';
import { PrecisionWorksheetLayout } from '@/components/tools/shell/precision-worksheet';
import type { ToolResult } from '@/lib/tools/shell-types';

const EXAMPLE_RESULT: ToolResult = {
  answer: 'You could save about $185/month by trimming three recurring costs.',
  primary: {
    label: 'Total monthly leak',
    value: 185,
    range: { low: 140, high: 230 },
    format: 'currency',
    currency: 'USD',
  },
  scenario: {
    kind: 'bars',
    bars: [
      { key: 'subscriptions', label: 'Unused subscriptions', value: 85, emphasis: true },
      { key: 'fees', label: 'Avoidable bank fees', value: 60 },
      { key: 'insurance', label: 'Overpriced insurance', value: 40 },
    ],
    total: { label: 'Total', value: 185 },
    textAlternative: 'Unused subscriptions cost $85/month, avoidable fees $60/month, overpriced insurance $40/month.',
  },
  levers: [
    { key: 'cancel-subs', title: 'Cancel unused subscriptions', deltaLabel: 'Save ~$60–90/mo' },
    { key: 'switch-bank', title: 'Switch to a fee-free account', deltaLabel: 'Save ~$40–60/mo' },
    { key: 'shop-insurance', title: 'Re-shop your insurance', deltaLabel: 'Save ~$30–50/mo' },
  ],
  assumptions: [
    { label: 'Analysis window', value: 'Last 3 months of transactions' },
    { label: 'Subscription threshold', value: '$5.00/mo', note: 'below this is ignored' },
  ],
  sources: [
    { label: 'CFPB overdraft fee guidance', url: 'https://example.com/cfpb', effectiveFrom: '2025-01-01', verifiedAt: '2026-07-01' },
  ],
  verifiedAt: '2026-07-01',
  nextAction: { href: '/us/personal-finance/best/high-yield-savings', label: 'Compare high-yield savings accounts', kind: 'cockpit' },
  resultState: 'example',
};

describe('RSC shell components render without throwing (renderToStaticMarkup smoke)', () => {
  it('ToolTrustStrip renders market/time/verified-date/links', () => {
    const html = renderToStaticMarkup(
      h(ToolTrustStrip, {
        market: 'us',
        estimatedMinutes: 3,
        verifiedAt: '2026-07-12',
        methodologyHref: '#methodology',
        privacyHref: '#privacy',
      }),
    );
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('US');
    expect(html).toContain('~3 min');
    expect(html).toContain('12 Jul 2026');
  });

  it('ScenarioChart renders each of the 4 visual kinds with a non-empty <desc>', () => {
    const corridor = renderToStaticMarkup(
      h(ScenarioChart, {
        data: {
          kind: 'corridor',
          series: [
            { key: 'conservative', rows: [{ x: 30, y: 10 }, { x: 65, y: 400 }] },
            { key: 'base', rows: [{ x: 30, y: 15 }, { x: 65, y: 600 }] },
            { key: 'optimistic', rows: [{ x: 30, y: 20 }, { x: 65, y: 900 }] },
          ],
          markers: [{ x: 55, label: 'FI date' }],
          xLabel: 'Age',
          yLabel: "Today's money",
          textAlternative: 'Corridor from age 30 to 65, base case reaches $600k.',
        },
      }),
    );
    expect(corridor).toContain('<svg');
    expect(corridor).toContain('<desc>Corridor from age 30 to 65');

    const bars = renderToStaticMarkup(h(ScenarioChart, { data: EXAMPLE_RESULT.scenario }));
    expect(bars).toContain('<svg');
    expect(bars.length).toBeGreaterThan(0);

    const stack = renderToStaticMarkup(
      h(ScenarioChart, {
        data: {
          kind: 'stack',
          segments: [
            { key: 'principal', label: 'Principal', value: 1200 },
            { key: 'interest', label: 'Interest', value: 300 },
          ],
          cap: { label: 'Affordability cap', value: 2000 },
          textAlternative: 'Payment stack: $1200 principal, $300 interest, capped at $2000.',
        },
      }),
    );
    expect(stack).toContain('<svg');

    const range = renderToStaticMarkup(
      h(ScenarioChart, {
        data: {
          kind: 'range',
          low: 300000,
          high: 450000,
          marker: { value: 380000, label: 'Your target' },
          axisLow: 0,
          axisHigh: 600000,
          textAlternative: 'Affordable range $300k-$450k, target $380k.',
        },
      }),
    );
    expect(range).toContain('<svg');

    // mini variant
    const mini = renderToStaticMarkup(h(ScenarioChart, { data: EXAMPLE_RESULT.scenario, mini: true }));
    expect(mini).toContain('0 0 120 64');
  });

  it('AssumptionsDrawer renders a native <details> with assumptions and dated sources', () => {
    const html = renderToStaticMarkup(
      h(AssumptionsDrawer, { assumptions: EXAMPLE_RESULT.assumptions, sources: EXAMPLE_RESULT.sources }),
    );
    expect(html).toContain('<details');
    expect(html).toContain('Analysis window');
    expect(html).toContain('CFPB overdraft fee guidance');
  });

  it('LiveCanvasLayout renders both inputs and result slots', () => {
    const html = renderToStaticMarkup(
      h(LiveCanvasLayout, { inputs: h('div', null, 'INPUTS_MARKER'), result: h('div', null, 'RESULT_MARKER') }),
    );
    expect(html).toContain('INPUTS_MARKER');
    expect(html).toContain('RESULT_MARKER');
  });

  it('PrecisionWorksheetLayout renders sections, assumptions and result slots', () => {
    const html = renderToStaticMarkup(
      h(PrecisionWorksheetLayout, {
        sections: [{ key: 's1', title: 'Property & loan', content: h('div', null, 'SECTION_MARKER') }],
        assumptions: h('div', null, 'ASSUMPTIONS_MARKER'),
        result: h('div', null, 'RESULT_MARKER'),
      }),
    );
    expect(html).toContain('Property &amp; loan');
    expect(html).toContain('SECTION_MARKER');
    expect(html).toContain('ASSUMPTIONS_MARKER');
    expect(html).toContain('RESULT_MARKER');
  });

  it('ToolShell renders the full frame (breadcrumb, H1, benefit, TrustStrip, workspace, below-fold) without throwing', () => {
    const html = renderToStaticMarkup(
      h(
        ToolShell,
        {
          toolId: 'money-leak-scanner',
          market: 'us',
          breadcrumb: [
            { label: 'Home', href: '/' },
            { label: 'Tools', href: '/tools' },
            { label: 'Money Leak Scanner', href: '/tools/money-leak-scanner' },
          ],
          h1: 'Money Leak Scanner',
          benefit: 'Find hidden monthly overspend in about 3 minutes.',
          estimatedMinutes: 3,
          verifiedAt: '2026-07-01',
          methodologyHref: '#methodology',
          privacyHref: '#privacy',
          belowFold: h('div', null, 'BELOW_FOLD_MARKER'),
          children: h('div', null, 'WORKSPACE_MARKER'),
        },
      ),
    );
    expect(html).toContain('Money Leak Scanner');
    expect(html).toContain('Find hidden monthly overspend');
    expect(html).toContain('WORKSPACE_MARKER');
    expect(html).toContain('BELOW_FOLD_MARKER');
    expect(html).toContain('application/ld+json');
  });
});
