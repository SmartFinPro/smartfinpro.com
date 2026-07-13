// __tests__/unit/tool-registry.test.ts
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY } from '@/lib/tools/registry/registry';
import {
  getAllVariants, countLiveConcepts, countLiveRoutes, getToolsForMarket, getToolEntryHref,
  getExpectedTrackingManifest, getFooterToolLinks, getLlmsToolLines,
} from '@/lib/tools/registry';

const MARKETING = join(process.cwd(), 'app', '(marketing)');

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
      const expectedPrefix = v.market === 'us' ? '/tools/' : `/${v.market}/tools/`;
      expect(v.path.startsWith(expectedPrefix), `${v.path} vs market ${v.market}`).toBe(true);
    }
  });
  it('counts: 24 Routen, 18 Konzepte — getrennte Zählfunktionen (FDL 4.3: +3 Wealth Horizon UK/CA/AU)', () => {
    expect(getAllVariants().length).toBe(24);
    expect(Object.keys(TOOL_REGISTRY).length).toBe(18);
    expect(countLiveRoutes()).toBe(24);      // interne Kennzahl (Manifest/Health)
    expect(countLiveConcepts()).toBe(18);    // öffentliche Kennzahl (Homepage)
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
  it('tracking manifest expands availableMarkets (33 funktionale Einträge, nicht 24 Routen)', () => {
    const manifest = getExpectedTrackingManifest();
    expect(manifest.length).toBe(33); // 24 Routen + Broker-Triple × uk/ca/au
    expect(manifest).toContainEqual({ toolId: 'broker-finder', path: '/tools/broker-finder', market: 'uk' });
    expect(manifest).toContainEqual({ toolId: 'trading-cost', path: '/tools/trading-cost-calculator', market: 'au' });
  });
});

describe('hidden mechanism (FDL 4.2) — Wealth Horizon stays out of every hub/footer/llms consumer', () => {
  it('getAllVariants / fs-parity still SEE the hidden route (it exists and is directly linkable)', () => {
    const wh = getAllVariants().find((v) => v.toolId === 'wealth-horizon');
    expect(wh).toBeDefined();
    expect(wh!.path).toBe('/tools/retirement-calculator');
    expect(wh!.hidden).toBe(true);
    expect(wh!.indexable).toBe(false);
  });

  it('getToolsForMarket("us") does NOT include wealth-horizon', () => {
    expect(getToolsForMarket('us').some((t) => t.id === 'wealth-horizon')).toBe(false);
  });

  it('getFooterToolLinks("us") does NOT include wealth-horizon', () => {
    expect(getFooterToolLinks('us').some((l) => l.href === '/tools/retirement-calculator')).toBe(false);
  });

  it('getLlmsToolLines() does NOT mention the wealth-horizon route', () => {
    expect(getLlmsToolLines().some((line) => line.includes('/tools/retirement-calculator'))).toBe(false);
  });

  // FDL 4.3 — the 3 new UK/CA/AU variants stay hidden+noindex too (bindende
  // Plan-Abweichung: the atomic index-flip from the 4.3 brief moved to a
  // separate launch PR after the baseline window ends).
  const NEW_VARIANTS: { market: 'uk' | 'ca' | 'au'; path: string }[] = [
    { market: 'uk', path: '/uk/tools/pension-calculator' },
    { market: 'ca', path: '/ca/tools/retirement-calculator' },
    { market: 'au', path: '/au/tools/retirement-calculator' },
  ];

  for (const { market, path } of NEW_VARIANTS) {
    it(`${market} wealth-horizon variant (${path}) exists, hidden+noindex`, () => {
      const v = getAllVariants().find((x) => x.toolId === 'wealth-horizon' && x.market === market);
      expect(v).toBeDefined();
      expect(v!.path).toBe(path);
      expect(v!.hidden).toBe(true);
      expect(v!.indexable).toBe(false);
    });

    it(`getToolsForMarket("${market}") does NOT include wealth-horizon`, () => {
      expect(getToolsForMarket(market).some((t) => t.id === 'wealth-horizon')).toBe(false);
    });

    it(`getFooterToolLinks("${market}") does NOT include wealth-horizon`, () => {
      expect(getFooterToolLinks(market).some((l) => l.href === path)).toBe(false);
    });

    it(`getLlmsToolLines() does NOT mention ${path}`, () => {
      expect(getLlmsToolLines().some((line) => line.includes(path))).toBe(false);
    });
  }
});

describe('legacy path redirect coverage (FDL 0.3)', () => {
  it('legacyPaths sind in next.config redirects abgedeckt', () => {
    const cfg = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');
    for (const t of Object.values(TOOL_REGISTRY)) {
      for (const legacy of t.legacyPaths ?? []) {
        expect(cfg.includes(`'${legacy}'`), `redirect fehlt für ${legacy}`).toBe(true);
      }
    }
  });
});

describe('registry consumers (FDL 0.6)', () => {
  it('sitemap entries derive from registry (no hardcoded tool list drift)', async () => {
    const { getSitemapToolEntries } = await import('@/lib/tools/registry');
    const urls = getSitemapToolEntries().map((e) => e.url);
    expect(urls).toContain('/uk/tools');            // Markt-Hubs drin
    expect(urls).toContain('/au/tools/gold-roi-calculator');
    expect(urls).not.toContain('/tools/gold-roi-calculator');   // legacy raus
    expect(urls).not.toContain('/tools/debt-payoff-calculator'); // noindex raus
    expect(urls).not.toContain('/tools/retirement-calculator'); // FDL 4.2: noindex raus
    // FDL 4.3: the 3 new UK/CA/AU variants stay noindex too (bindende Plan-Abweichung).
    expect(urls).not.toContain('/uk/tools/pension-calculator');
    expect(urls).not.toContain('/ca/tools/retirement-calculator');
    expect(urls).not.toContain('/au/tools/retirement-calculator');
  });
});
