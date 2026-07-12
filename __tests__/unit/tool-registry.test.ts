// __tests__/unit/tool-registry.test.ts
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY } from '@/lib/tools/registry/registry';
import { getAllVariants, countLiveConcepts, countLiveRoutes, getToolsForMarket, getToolEntryHref, getExpectedTrackingManifest } from '@/lib/tools/registry';

const MARKETING = join(process.cwd(), 'app', '(marketing)');

// FDL 0.1 known deviation: gold-roi is registered with market 'au' but still lives
// at its pre-move US path ('/tools/gold-roi-calculator') because Task 1 must reflect
// the audited Ist-Zustand for fs-parity. Task 0.3 moves the page to /au/tools/ and
// removes this exception.
const KNOWN_MISPLACED = ['/tools/gold-roi-calculator'];

function pageFileForPath(routePath: string): string {
  // '/tools/x' → app/(marketing)/tools/x/page.tsx ; '/uk/tools/x' → app/(marketing)/uk/tools/x/page.tsx
  return join(MARKETING, ...routePath.split('/').filter(Boolean), 'page.tsx');
}

function collectToolRoutes(): string[] {
  const roots: Array<[string, string]> = [
    ['tools', '/tools'], ['uk/tools', '/uk/tools'], ['ca/tools', '/ca/tools'], ['au/tools', '/au/tools'],
  ];
  const routes: string[] = [];
  for (const [dir, prefix] of roots) {
    const abs = join(MARKETING, ...dir.split('/'));
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(abs, entry.name, 'page.tsx'))) {
        routes.push(`${prefix}/${entry.name}`);
      }
    }
  }
  return routes.sort();
}

describe('tool registry ↔ filesystem parity', () => {
  it('every registry variant path has a page.tsx', () => {
    for (const v of getAllVariants()) {
      expect(existsSync(pageFileForPath(v.path)), `missing page for ${v.path}`).toBe(true);
    }
  });
  it('every tool page.tsx under */tools/* is registered', () => {
    const registered = new Set(getAllVariants().map((v) => v.path));
    for (const route of collectToolRoutes()) {
      expect(registered.has(route), `unregistered tool route ${route}`).toBe(true);
    }
  });
});

describe('registry data integrity', () => {
  it('unique ids and unique variant paths', () => {
    const ids = Object.keys(TOOL_REGISTRY);
    expect(new Set(ids).size).toBe(ids.length);
    const paths = getAllVariants().map((v) => v.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
  it('titles never hardcode the brand suffix', () => {
    for (const v of getAllVariants()) {
      expect(v.title.includes('| SmartFinPro'), `${v.path} title has brand suffix`).toBe(false);
    }
  });
  it('market prefix matches variant market', () => {
    for (const v of getAllVariants()) {
      if (KNOWN_MISPLACED.includes(v.path)) continue; // gold-roi pre-move exception, see Task 0.3
      const expectedPrefix = v.market === 'us' ? '/tools/' : `/${v.market}/tools/`;
      expect(v.path.startsWith(expectedPrefix), `${v.path} vs market ${v.market}`).toBe(true);
    }
  });
  it('counts: 20 Routen, 17 Konzepte — getrennte Zählfunktionen', () => {
    expect(getAllVariants().length).toBe(20);
    expect(Object.keys(TOOL_REGISTRY).length).toBe(17);
    expect(countLiveRoutes()).toBe(20);      // interne Kennzahl (Manifest/Health)
    expect(countLiveConcepts()).toBe(17);    // öffentliche Kennzahl (Homepage)
  });
});

describe('market availability contract (SPEC 4.2)', () => {
  it('broker triple is functionally available in all 4 markets via global route + ?market=', () => {
    for (const id of ['broker-finder', 'trading-cost', 'broker-comparison'] as const) {
      expect(getToolEntryHref(id, 'us')).not.toContain('?market=');
      expect(getToolEntryHref(id, 'uk')).toMatch(/^\/tools\/.+\?market=uk$/);
      expect(getToolEntryHref(id, 'ca')).toMatch(/\?market=ca$/);
      expect(getToolEntryHref(id, 'au')).toMatch(/\?market=au$/);
    }
  });
  it('localized variant wins over global route', () => {
    expect(getToolEntryHref('money-leak-scanner', 'uk')).toBe('/uk/tools/money-leak-scanner');
  });
  it('US-centric tools are NOT offered to other markets (ehrliche Marktverfügbarkeit)', () => {
    for (const id of ['loan', 'credit-card-rewards', 'ai-roi'] as const) {
      expect(getToolEntryHref(id, 'uk')).toBeNull();
    }
    expect(getToolsForMarket('uk').some((t) => t.id === 'broker-finder')).toBe(true);
    expect(getToolsForMarket('uk').some((t) => t.id === 'loan')).toBe(false);
  });
  it('tracking manifest expands availableMarkets (29 funktionale Einträge, nicht 20 Routen)', () => {
    const manifest = getExpectedTrackingManifest();
    expect(manifest.length).toBe(29); // 20 Routen + Broker-Triple × uk/ca/au
    expect(manifest).toContainEqual({ toolId: 'broker-finder', path: '/tools/broker-finder', market: 'uk' });
    expect(manifest).toContainEqual({ toolId: 'trading-cost', path: '/tools/trading-cost-calculator', market: 'au' });
  });
});
