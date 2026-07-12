// __tests__/unit/tool-registry.test.ts
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY } from '@/lib/tools/registry/registry';
import { getAllVariants, countLiveTools, getToolsForMarket } from '@/lib/tools/registry';

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
  it('counts match the audited state (20 routes, 17 concepts)', () => {
    expect(getAllVariants().length).toBe(20);
    expect(Object.keys(TOOL_REGISTRY).length).toBe(17);
    expect(countLiveTools()).toBeGreaterThanOrEqual(17); // live-Variants gesamt
    expect(getToolsForMarket('uk').length).toBeGreaterThanOrEqual(3);
  });
});
