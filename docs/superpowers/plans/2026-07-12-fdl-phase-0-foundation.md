# FDL Phase 0 — Registry, SEO- und Daten-Foundation: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle 20 Tool-Routen bekommen eine typisierte Registry als Single Source of Truth, korrekte Metadaten (Suffix, Canonical, hreflang), aktuelle Marktregeln mit Quellen und einen CI-Production-Build als Required Check — ohne jede Verhaltensänderung an cockpit_v1.

**Architecture:** Neue reine Datenmodule (`lib/tools/registry/`, `lib/rules/`) nach dem Vorbild von `lib/comparison/topics/` speisen alle bisher duplizierten Konsumenten (Hubs, Nav, Sitemap, llms.txt, Homepage, Page-Metadata). Jede Migration ist ein eigener, revertbarer PR mit Tests zuerst (TDD). Verbindliche Quelle für alle Werte: `docs/superpowers/specs/2026-07-12-financial-decision-lab-design.md` (im Folgenden **SPEC**) — Kapitel 9.1/9.2 (Titles/Descriptions/H1/Index), Kapitel 1.3 (Ist-Zustand), Kapitel 8.4 (Rules).

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Vitest (`__tests__/unit/**`), Playwright (Default `javaScriptEnabled:false`), Tailwind v3.4, kein Supabase-Zugriff nötig (reine Build-Time-Daten).

**Modell-Governance (bindend):** Umsetzung Sonnet 5, eine frische Session/Subagent pro Task; Task 4 (Rules) nach Merge zusätzlich Opus-Review; kein Task behauptet Erfolg ohne gelaufene Tests + lokalem `npm run build`. Basis-Branch je Task: frisches `origin/main`. Branch-Namen: `feat/fdl-0-<n>-<slug>`.

**Worktree-Hinweis (aus Projekt-Memory):** In Claude-Worktrees vor Build/Test `.env.local` aus dem Hauptrepo kopieren und `node_modules` symlinken (`ln -s /Users/christianb./Websites/smartfinpro.com/node_modules node_modules`), sonst schlägt der Build mit „supabaseUrl is required" fehl.

**PR-Beschreibungs-Template (jeder PR):**

```markdown
## Was
<1-3 Sätze>
## Spec-Referenz
SPEC Kapitel <n> / Plan Task <n>
## Gate-Checkliste
- [ ] npx tsc --noEmit ✓ (Output angehängt)
- [ ] vitest run <suites> ✓
- [ ] npm run build lokal ✓
- [ ] Playwright <specs> ✓ (falls zutreffend)
- [ ] Kein cockpit_v1-Code berührt (git diff geprüft)
```

---

## File Structure (Phase 0 gesamt)

```
.github/workflows/pr-build.yml                 # NEU Task 0: CI-Production-Build
lib/tools/registry/types.ts                    # NEU Task 1: reine Typen
lib/tools/registry/registry.ts                 # NEU Task 1: TOOL_REGISTRY-Daten
lib/tools/registry/index.ts                    # NEU Task 1: Accessoren
lib/tools/registry/metadata.ts                 # NEU Task 2: buildToolMetadata()
__tests__/unit/tool-registry.test.ts           # NEU Task 1: fs-Parity + Datenintegrität
__tests__/unit/tool-metadata.test.ts           # NEU Task 2
e2e/tool-seo.spec.ts                           # NEU Task 2: JS-off SEO-Assertions
app/(marketing)/**/tools/**/page.tsx           # MOD Task 2 (20×), Task 3 (gold-roi move)
next.config.ts                                 # MOD Task 3: 308-Redirect
lib/rules/{types,index,us,uk,ca,au,assumptions}.ts  # NEU Task 4
__tests__/unit/rules.test.ts                   # NEU Task 4
components/tools/{superannuation,tfsa-rrsp}-calculator.tsx  # MOD Task 4
app/(marketing)/uk/tools/isa-tax-savings-calculator/page.tsx # MOD Task 4
config/navigation.ts                           # MOD Task 5+6
app/(marketing)/{tools,uk/tools,ca/tools,au/tools}/page.tsx  # MOD Task 5+6
app/sitemap.ts                                 # MOD Task 6
app/llms.txt/route.ts                          # MOD Task 6
app/(marketing)/[market]/page.tsx              # MOD Task 6 (totalTools)
lib/seo/schema.ts + components/seo/web-application-schema.tsx # NEU/MOD Task 7
scripts/check-rule-freshness.mjs               # NEU Task 4
```

---

### Task 0 (PR 0.0): CI-Production-Build als Required Check

**Files:**
- Create: `.github/workflows/pr-build.yml`

**Sicherheits- und Zuverlässigkeitsvertrag (bindend, Review 12.07.2026):**
1. **Keine privaten Produktions-Secrets in PR-Builds.** `pull_request`-Builds führen ungemergten Code aus; private Keys (`SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `SERPER_API_KEY`, `GOOGLE_INDEXING_JSON`) bekommen **Platzhalterwerte**. Nur `NEXT_PUBLIC_*`-Werte dürfen echt sein — sie sind by design öffentlich (landen im Client-Bundle). Konsequenz: SSG-Abschnitte, die Build-Zeit-DB-Zugriff über den Service-Key brauchen (Cockpit-Loader), rendern im PR-Build ggf. leer — der Deploy-Build auf `main` bleibt das Full-Fidelity-Gate; der PR-Build fängt App-/Typ-/Prerender-Brüche.
2. **Der Check muss auf JEDEM PR erscheinen** (Required-Check-tauglich): kein `paths:`-Filter am Trigger (sonst „hängt" der Required Check bei nicht passenden PRs dauerhaft auf pending). Stattdessen entscheidet ein In-Job-Diff-Filter, ob wirklich gebaut wird; bei irrelevanten Pfaden endet der Job schnell und grün („skip-but-pass"). Der Filter schließt `.github/workflows/pr-build.yml` selbst ein, damit Workflow-Änderungen sich selbst testen.

- [ ] **Step 1: Workflow-Datei schreiben**

```yaml
# .github/workflows/pr-build.yml
name: PR Production Build
on:
  pull_request:        # bewusst OHNE paths-Filter — Check erscheint auf jedem PR
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Detect relevant changes
        id: filter
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
        run: |
          if git diff --name-only "$BASE_SHA"...HEAD | grep -E '^(app/|components/tools/|lib/(calc|rules|tools|decision|seo)/|next\.config\.ts|package(-lock)?\.json|\.github/workflows/pr-build\.yml)'; then
            echo "run=true" >> "$GITHUB_OUTPUT"
          else
            echo "run=false" >> "$GITHUB_OUTPUT"
            echo "Keine build-relevanten Pfade geändert — Build übersprungen, Check besteht."
          fi
      - uses: actions/setup-node@v4
        if: steps.filter.outputs.run == 'true'
        with:
          node-version: 20
          cache: npm
      - run: npm ci
        if: steps.filter.outputs.run == 'true'
      - name: Production build (ohne private Secrets)
        if: steps.filter.outputs.run == 'true'
        run: npm run build
        env:
          NODE_OPTIONS: "--max-old-space-size=3072"
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_KEY: "ci-placeholder"
          ANTHROPIC_API_KEY: "ci-placeholder"
          RESEND_API_KEY: "ci-placeholder"
          CRON_SECRET: "ci-placeholder"
          SERPER_API_KEY: "ci-placeholder"
          GOOGLE_INDEXING_JSON: "{}"
```

- [ ] **Step 1b: Platzhalter-Verträglichkeit EMPIRISCH beweisen (Pflicht vor Commit)**

Lokal exakt die CI-Bedingungen simulieren — Prozess-Env überschreibt `.env.local` in Next.js:

Run: `SUPABASE_SERVICE_KEY=ci-placeholder ANTHROPIC_API_KEY=ci-placeholder RESEND_API_KEY=ci-placeholder CRON_SECRET=ci-placeholder SERPER_API_KEY=ci-placeholder GOOGLE_INDEXING_JSON='{}' npm run build`
Expected: Build erfolgreich. Falls FEHLSCHLAG: exakte Fehlstelle dokumentieren (welcher Loader/welche Route braucht den Service-Key zur Build-Zeit) und STOPPEN — Eskalation statt Workaround; keine echten privaten Secrets als „Fix".

- [ ] **Step 2: YAML lokal validieren**

Run: `npx yaml-lint .github/workflows/pr-build.yml 2>/dev/null || node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/pr-build.yml','utf8')); console.log('YAML ok')"`
Expected: `YAML ok`

- [ ] **Step 3: Lokaler Build als Referenz**

Run: `npm run build`
Expected: Build erfolgreich (gleiches Kommando wie CI).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/pr-build.yml
git commit -m "ci: production build als PR-Check für App-/Tool-/Lib-Pfade (FDL 0.0)"
```

- [ ] **Step 5: Nach Merge — Required Check aktivieren (manueller Schritt / gh)**

Run: `gh api -X PATCH "repos/SmartFinPro/smartfinpro.com/branches/main/protection/required_status_checks" -f 'contexts[]=build' 2>&1 || echo "MANUELL: GitHub → Settings → Branches → main → Required status checks → 'build' hinzufügen"`
Erwartung: Entweder Erfolg oder dokumentierter manueller Schritt im PR-Text. Dieser Schritt darf NICHT stillschweigend übersprungen werden.

---

### Task 1 (PR 0.1): Tool-Registry + Paritäts-/Integritätstests

**Files:**
- Create: `lib/tools/registry/types.ts`, `lib/tools/registry/registry.ts`, `lib/tools/registry/index.ts`
- Test: `__tests__/unit/tool-registry.test.ts`

Keine bestehende Datei wird angefasst — risikofreier reiner Additions-PR.

- [ ] **Step 1: Typen schreiben**

```ts
// lib/tools/registry/types.ts
// Reine Typen — kein React, keine Server-Importe (Vorbild: lib/comparison/topics/types.ts)

export type ToolMarket = 'us' | 'uk' | 'ca' | 'au';
export type ToolStatus = 'live' | 'coming_soon' | 'redirected' | 'retired';
export type ToolTier = 'major' | 'supporting' | 'niche';
export type ShellMode = 'live-canvas' | 'guided-journey' | 'precision-worksheet';
export type DecisionCategory =
  | 'spend' | 'retire' | 'broker' | 'home' | 'debt'
  | 'credit-cards' | 'fees' | 'niche' | 'business';

export type ToolId =
  | 'money-leak-scanner' | 'broker-finder' | 'trading-cost' | 'broker-comparison'
  | 'ai-roi' | 'loan' | 'debt-payoff' | 'credit-utilization' | 'gold-roi'
  | 'credit-card-rewards' | 'isa' | 'remortgage' | 'tfsa-rrsp'
  | 'wealthsimple-fees' | 'ca-affordability' | 'superannuation' | 'au-mortgage';
// 'wealth-horizon' kommt erst in Phase 4 dazu (fs-Parity verlangt existierende Pages).

export interface ToolRouteVariant {
  market: ToolMarket;
  path: string;              // MUSS 1:1 einem app/(marketing)-Verzeichnis mit page.tsx entsprechen
  status: ToolStatus;
  indexable: boolean;        // EINE Wahrheit für robots.index UND Sitemap-Aufnahme
  title: string;             // bare, OHNE "| SmartFinPro" — Root-Template hängt Brand an
  metaDescription: string;
  h1: string;
}

export interface ToolDefinition {
  id: ToolId;                // == analytics toolId ab Phase 1; niemals umbenennen
  name: string;              // kanonischer Anzeigename (beendet Naming-Drift)
  tier: ToolTier;
  decisionCategory: DecisionCategory;
  shellMode: ShellMode;
  icon: string;              // lucide-Key, wie BEST_X_MANIFEST
  blurb: string;             // Hub-Karten-Copy, EN, 1 Satz
  variants: ToolRouteVariant[];   // SEO-Varianten: eigene indexierbare Routen = hreflang-Cluster
  availableMarkets?: ToolMarket[]; // FUNKTIONALE Verfügbarkeit (SPEC 4.2): ein globaler Pfad darf
                                   // mehrere Märkte bedienen; Default = Märkte der variants
  legacyPaths?: string[];    // 308-Quellen; Test prüft gegen next.config.ts-Redirects
}
```

**Vertrags-Kern (SPEC 4.2, bindend):** `variants[]` (SEO) und `availableMarkets[]` (Funktion) sind getrennt. Die drei globalen Broker-Tools (`broker-finder`, `trading-cost`, `broker-comparison`) erhalten `availableMarkets: ['us','uk','ca','au']` — sie erscheinen auf allen Markt-Hubs, aber über die globale Route mit validiertem `?market=`-Parameter (`getToolEntryHref`), ohne lokalisierte Duplikat-Routen. Canonical/OG bleiben parameterlos (Metadata nutzt weiterhin nur `variants`). Alle anderen Tools lassen `availableMarkets` weg (Default = variants-Märkte) — dadurch verschwinden die US-zentrischen Tools (loan, rewards, ai-roi) aus UK/CA/AU-Navigation: **beabsichtigte Verhaltensänderung „ehrliche Marktverfügbarkeit"** (SPEC In-Scope), im PR-Text von Task 6 explizit ausweisen.

- [ ] **Step 2: Failing Test schreiben (fs-Parity + Integrität)**

```ts
// __tests__/unit/tool-registry.test.ts
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY } from '@/lib/tools/registry/registry';
import { getAllVariants, countLiveConcepts, countLiveRoutes, getToolsForMarket, getToolEntryHref } from '@/lib/tools/registry';

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
});
```

- [ ] **Step 3: Test laufen lassen — muss failen**

Run: `npx vitest run __tests__/unit/tool-registry.test.ts`
Expected: FAIL — `Cannot find module '@/lib/tools/registry/registry'`.

- [ ] **Step 4: Registry-Daten schreiben**

`lib/tools/registry/registry.ts` exportiert `export const TOOL_REGISTRY: Record<ToolId, ToolDefinition>` mit **allen 17 Einträgen**. Die Feldwerte sind VOLLSTÄNDIG vorgegeben:

- `title` / `metaDescription` / `h1` je Variante: **wörtlich aus SPEC Tabelle 9.1** (Spalten Title/Description/H1 der jeweiligen Route). KEINE eigenen Formulierungen.
- `indexable`: aus SPEC 9.2 — `false` NUR für `/tools/debt-payoff-calculator` und `/uk/tools/remortgage-calculator` (credit-score-simulator bleibt bis Task 5.3/Phase 5 unter seinem ALTEN Pfad registriert, siehe Zeile unten).
- Struktur-Daten je Tool (id → name · tier · decisionCategory · shellMode · icon · Variantenpfade[Markt, status]):

| id | name | tier | decisionCategory | shellMode | icon | Varianten (alle status `live`, außer vermerkt) |
|---|---|---|---|---|---|---|
| `money-leak-scanner` | Money Leak Scanner | major | spend | live-canvas | search-dollar → nutze `scan-search` | us `/tools/money-leak-scanner`, uk `/uk/tools/money-leak-scanner`, ca `/ca/tools/money-leak-scanner`, au `/au/tools/money-leak-scanner` |
| `broker-finder` | Broker Finder Quiz | major | broker | guided-journey | `compass` | us `/tools/broker-finder` |
| `trading-cost` | Trading Cost Calculator | supporting | broker | precision-worksheet | `calculator` | us `/tools/trading-cost-calculator` |
| `broker-comparison` | Broker Comparison Tool | supporting | broker | live-canvas | `columns-3` | us `/tools/broker-comparison` |
| `ai-roi` | AI ROI Calculator | supporting | business | live-canvas | `bot` | us `/tools/ai-roi-calculator` |
| `loan` | Loan Calculator | supporting | debt | guided-journey | `banknote` | us `/tools/loan-calculator` |
| `debt-payoff` | Debt Payoff Calculator | supporting | debt | precision-worksheet | `trending-down` | us `/tools/debt-payoff-calculator` (**indexable: false**) |
| `credit-utilization` | Credit Utilization & Score Impact Explorer | supporting | debt | live-canvas | `gauge` | us `/tools/credit-score-simulator` (**indexable: false**; Slug-Wechsel erst Phase 5 — Registry-Pfad = Ist-Zustand, sonst bricht fs-Parity) |
| `gold-roi` | Gold ROI Calculator | niche | niche | live-canvas | `coins` | **in diesem Task noch** us-Pfad `/tools/gold-roi-calculator` mit market `au`?— NEIN: Task 1 registriert den IST-Zustand: market `au`, path `/tools/gold-roi-calculator`, status `live` — der Markt-Prefix-Integritätstest braucht dafür eine dokumentierte Ausnahme (`KNOWN_MISPLACED = ['/tools/gold-roi-calculator']`), die Task 3 wieder entfernt |
| `credit-card-rewards` | Credit Card Rewards Calculator | supporting | credit-cards | live-canvas | `credit-card` | us `/tools/credit-card-rewards-calculator` |
| `isa` | ISA Tax Savings Calculator | supporting | retire | live-canvas | `piggy-bank` | uk `/uk/tools/isa-tax-savings-calculator` |
| `remortgage` | UK Remortgage Calculator | supporting | home | precision-worksheet | `house` | uk `/uk/tools/remortgage-calculator` (**indexable: false**) |
| `tfsa-rrsp` | TFSA vs RRSP Calculator | supporting | retire | live-canvas | `scale` | ca `/ca/tools/tfsa-rrsp-calculator` |
| `wealthsimple-fees` | Wealthsimple Fee Savings Calculator | supporting | fees | live-canvas | `percent` | ca `/ca/tools/wealthsimple-calculator` |
| `ca-affordability` | Canadian Mortgage Affordability Calculator | supporting | home | precision-worksheet | `home` | ca `/ca/tools/ca-mortgage-affordability-calculator` |
| `superannuation` | Superannuation Calculator | supporting | retire | live-canvas | `sunrise` | au `/au/tools/superannuation-calculator` |
| `au-mortgage` | Australian Home Loan Calculator | supporting | home | precision-worksheet | `house` | au `/au/tools/au-mortgage-calculator` |

`blurb`: 1 Satz, EN, aus der jeweiligen SPEC-9.1-Description kürzbar (erster Halbsatz bis zum Doppelpunkt/Komma, ≤ 90 Zeichen).

Hinweis credit-utilization/gold-roi: Registry bildet in Task 1 den **Ist-Zustand** ab (Parity!). Titles für diese zwei Routen: für `/tools/credit-score-simulator` die BESTEHENDE bare-Title aus der Page übernehmen („Credit Score Simulator 2026 | See How Actions Affect Your Score" OHNE Suffix-Anteil → exakt: `Credit Score Simulator 2026: See How Actions Affect Your Score` erst in Phase 5 — in Task 1 wörtlich den Ist-Title ohne `| SmartFinPro`-Anteil eintragen); für gold-roi den SPEC-9.1-Title (der Text ist pfadunabhängig korrekt).

- [ ] **Step 5: Accessoren schreiben**

```ts
// lib/tools/registry/index.ts
import { TOOL_REGISTRY } from './registry';
import type { ToolDefinition, ToolId, ToolMarket, ToolRouteVariant } from './types';

export * from './types';
export { TOOL_REGISTRY };

export function getTool(id: ToolId): ToolDefinition { return TOOL_REGISTRY[id]; }

export function getAllVariants(): (ToolRouteVariant & { toolId: ToolId })[] {
  return Object.values(TOOL_REGISTRY).flatMap((t) =>
    t.variants.map((v) => ({ ...v, toolId: t.id })),
  );
}

export function getVariant(id: ToolId, market: ToolMarket): ToolRouteVariant | null {
  return TOOL_REGISTRY[id]?.variants.find((v) => v.market === market) ?? null;
}

export function getAvailableMarkets(t: ToolDefinition): ToolMarket[] {
  return t.availableMarkets ?? Array.from(new Set(t.variants.map((v) => v.market)));
}

/** Einstiegs-URL für einen Markt: lokale Variante, sonst globale Route + validierter ?market=-Param (SPEC 4.2). */
export function getToolEntryHref(id: ToolId, market: ToolMarket): string | null {
  const tool = TOOL_REGISTRY[id];
  const local = tool.variants.find((v) => v.market === market);
  if (local) return local.path;
  if (!getAvailableMarkets(tool).includes(market)) return null;
  const global = tool.variants.find((v) => v.market === 'us') ?? tool.variants[0];
  return market === 'us' ? global.path : `${global.path}?market=${market}`;
}

export function getToolsForMarket(market: ToolMarket): (ToolDefinition & { entryHref: string; localized: boolean })[] {
  return Object.values(TOOL_REGISTRY)
    .filter((t) => getAvailableMarkets(t).includes(market))
    .map((t) => ({ ...t, entryHref: getToolEntryHref(t.id, market)!, localized: t.variants.some((v) => v.market === market) }));
}

/** Öffentliche Kennzahl (Homepage): Konzepte mit ≥1 Live-Variante. */
export function countLiveConcepts(): number {
  return Object.values(TOOL_REGISTRY).filter((t) => t.variants.some((v) => v.status === 'live')).length;
}
/** Interne Kennzahl (Manifest/Health): Anzahl Live-Routen-Varianten. */
export function countLiveRoutes(): number {
  return getAllVariants().filter((v) => v.status === 'live').length;
}

export function getHubPathForMarket(market: ToolMarket): string {
  return market === 'us' ? '/tools' : `/${market}/tools`;
}

export function getSitemapToolEntries(): { url: string }[] {
  const hubs = (['us', 'uk', 'ca', 'au'] as const).map((m) => ({ url: getHubPathForMarket(m) }));
  const tools = getAllVariants()
    .filter((v) => v.status === 'live' && v.indexable)
    .map((v) => ({ url: v.path }));
  return [...hubs, ...tools];
}

export function getFooterToolLinks(market: ToolMarket): { label: string; href: string }[] {
  return getToolsForMarket(market)
    .filter((t) => {
      const v = t.variants.find((x) => x.market === market) ?? t.variants.find((x) => x.market === 'us') ?? t.variants[0];
      return v.status === 'live' && v.indexable;
    })
    .map((t) => ({ label: t.name, href: t.entryHref }));
}

export function getLlmsToolLines(): string[] {
  return getAllVariants()
    .filter((v) => v.status === 'live' && v.indexable)
    .map((v) => `- ${v.title}: https://smartfinpro.com${v.path}`);
}

export function getExpectedTrackingManifest(): { toolId: ToolId; path: string; market: ToolMarket }[] {
  return getAllVariants()
    .filter((v) => v.status === 'live')
    .map((v) => ({ toolId: v.toolId, path: v.path, market: v.market }));
}
```

- [ ] **Step 6: Tests grün laufen lassen**

Run: `npx vitest run __tests__/unit/tool-registry.test.ts`
Expected: PASS (alle Suites).

- [ ] **Step 7: Typen + Build prüfen, committen**

Run: `npx tsc --noEmit && npm run build`
```bash
git add lib/tools/registry __tests__/unit/tool-registry.test.ts
git commit -m "feat(tools): typisierte Tool-Registry als Single Source of Truth + fs-Parity-Tests (FDL 0.1)"
```

---

### Task 2 (PR 0.2): buildToolMetadata auf allen 20 Tool-Seiten

**Files:**
- Create: `lib/tools/registry/metadata.ts`, `__tests__/unit/tool-metadata.test.ts`, `e2e/tool-seo.spec.ts`
- Modify: alle 20 Tool-`page.tsx` (Liste = `getAllVariants()`-Pfade)

- [ ] **Step 1: Failing Unit-Test für den Builder**

```ts
// __tests__/unit/tool-metadata.test.ts
import { describe, it, expect } from 'vitest';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';

describe('buildToolMetadata', () => {
  it('bare title (Template hängt Brand an), self-canonical, description aus Registry', () => {
    const md = buildToolMetadata('debt-payoff', 'us');
    expect(String(md.title)).not.toContain('| SmartFinPro');
    expect(md.alternates?.canonical).toBe('https://smartfinpro.com/tools/debt-payoff-calculator');
    expect(md.robots).toMatchObject({ index: false, follow: true }); // indexable:false
  });
  it('multi-variant tool bekommt vollständigen hreflang-Cluster mit x-default', () => {
    const md = buildToolMetadata('money-leak-scanner', 'uk');
    const langs = md.alternates?.languages as Record<string, string>;
    expect(langs['en-US']).toBe('https://smartfinpro.com/tools/money-leak-scanner');
    expect(langs['en-GB']).toBe('https://smartfinpro.com/uk/tools/money-leak-scanner');
    expect(langs['en-CA']).toBe('https://smartfinpro.com/ca/tools/money-leak-scanner');
    expect(langs['en-AU']).toBe('https://smartfinpro.com/au/tools/money-leak-scanner');
    expect(langs['x-default']).toBe('https://smartfinpro.com/tools/money-leak-scanner');
  });
  it('single-variant tool: canonical only, keine languages', () => {
    const md = buildToolMetadata('isa', 'uk');
    expect(md.alternates?.canonical).toBe('https://smartfinpro.com/uk/tools/isa-tax-savings-calculator');
    expect(md.alternates?.languages).toBeUndefined();
  });
});
```

Run: `npx vitest run __tests__/unit/tool-metadata.test.ts` → FAIL (Modul fehlt).

- [ ] **Step 2: Builder implementieren**

```ts
// lib/tools/registry/metadata.ts
import type { Metadata } from 'next';
import { TOOL_REGISTRY } from './registry';
import type { ToolId, ToolMarket } from './types';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
const HREFLANG: Record<ToolMarket, string> = { us: 'en-US', uk: 'en-GB', ca: 'en-CA', au: 'en-AU' };

export function buildToolMetadata(id: ToolId, market: ToolMarket): Metadata {
  const tool = TOOL_REGISTRY[id];
  const variant = tool.variants.find((v) => v.market === market);
  if (!variant) throw new Error(`No ${market} variant for tool ${id}`);

  const canonical = `${BASE}${variant.path}`;
  let languages: Record<string, string> | undefined;
  if (tool.variants.length > 1) {
    languages = Object.fromEntries(tool.variants.map((v) => [HREFLANG[v.market], `${BASE}${v.path}`]));
    const usVariant = tool.variants.find((v) => v.market === 'us') ?? tool.variants[0];
    languages['x-default'] = `${BASE}${usVariant.path}`;
  }

  return {
    title: variant.title,
    description: variant.metaDescription,
    alternates: { canonical, ...(languages ? { languages } : {}) },
    ...(variant.indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: { title: variant.title, description: variant.metaDescription, url: canonical },
  };
}
```

Prüfe vorab per `grep -n "getCanonicalUrl\|generateAlternates" lib/seo/hreflang.ts`: wenn die bestehenden Helper dieselben URLs produzieren (US-Homepage-Sonderfall betrifft Tools nicht), stattdessen diese aufrufen statt selbst zu bauen — Wiederverwendung geht vor Neuimplementierung; die Tests oben bleiben identisch gültig.

- [ ] **Step 3: Unit-Tests grün**

Run: `npx vitest run __tests__/unit/tool-metadata.test.ts` → PASS.

- [ ] **Step 4: E2E-Spec schreiben (JS-off, läuft gegen dev-Server)**

```ts
// e2e/tool-seo.spec.ts
import { test, expect } from '@playwright/test';
import { getAllVariants } from '@/lib/tools/registry';

for (const v of getAllVariants().filter((x) => x.status === 'live')) {
  test(`SEO basics ${v.path}`, async ({ page }) => {
    await page.goto(v.path);
    const title = await page.title();
    expect((title.match(/\| SmartFinPro/g) ?? []).length, `double suffix in "${title}"`).toBeLessThanOrEqual(1);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', `https://smartfinpro.com${v.path}`);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
    if (!v.indexable) expect(robots ?? '').toContain('noindex');
  });
}
```

Falls Playwright den `@/`-Alias in Specs nicht auflöst (tsconfig-Pfade gelten dort meist nicht): relativen Import `../lib/tools/registry` verwenden — vorher mit `npx playwright test e2e/tool-seo.spec.ts --list` verifizieren.

- [ ] **Step 5: Die 20 Pages umstellen**

Pro Page: kompletten `export const metadata: Metadata = {...}`-Block ersetzen durch:

```ts
import { buildToolMetadata } from '@/lib/tools/registry/metadata';
export const metadata = buildToolMetadata('<toolId>', '<market>');
```

Zuordnung Pfad→(toolId, market) kommt aus der Registry (Task 1 Tabelle). Bestehende zusätzliche Metadata-Felder (z. B. `openGraph.images`, keywords) NICHT stillschweigend verwerfen: falls eine Page solche Felder hat, `{...buildToolMetadata(...), openGraph: {...}}`-Merge verwenden und im PR-Text auflisten. Die drei noindex-Kommentare („Coming Soon placeholder") ersatzlos entfernen — noindex kommt jetzt aus `indexable:false`.

- [ ] **Step 6: Alles grün + committen**

Run: `npx tsc --noEmit && npx vitest run __tests__/unit/tool-metadata.test.ts __tests__/unit/tool-registry.test.ts && npm run build && npx playwright test e2e/tool-seo.spec.ts`
Expected: alles PASS.

```bash
git add lib/tools/registry/metadata.ts __tests__/unit/tool-metadata.test.ts e2e/tool-seo.spec.ts app/\(marketing\)
git commit -m "fix(seo): Registry-Metadata für alle 20 Tool-Seiten — Suffix, Canonicals, hreflang (FDL 0.2)"
```

---

### Task 3 (PR 0.3): gold-roi-Umzug ATOMAR nach /au/tools/

**Files:**
- Create: `app/(marketing)/au/tools/gold-roi-calculator/page.tsx` (Verschiebung)
- Delete: `app/(marketing)/tools/gold-roi-calculator/page.tsx`
- Modify: `next.config.ts` (redirects), `lib/tools/registry/registry.ts` (Pfad + legacyPaths, `KNOWN_MISPLACED`-Ausnahme entfernen), `app/(marketing)/au/tools/page.tsx` (Hub-Karte ergänzen), `app/sitemap.ts` (nur falls der alte Pfad dort noch hart steht — `grep -n "gold-roi" app/sitemap.ts`)
- Test: Erweiterung `e2e/tool-seo.spec.ts` um Redirect-Assertion

- [ ] **Step 1: Failing Test — Redirect + neue Route**

```ts
// e2e/tool-seo.spec.ts — zusätzlich:
test('gold-roi legacy path 308s to /au/tools/', async ({ request }) => {
  const res = await request.get('/tools/gold-roi-calculator', { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()['location']).toContain('/au/tools/gold-roi-calculator');
});
```

Run → FAIL (alte Route liefert 200).

- [ ] **Step 2: Verzeichnis verschieben, Redirect setzen**

```bash
git mv "app/(marketing)/tools/gold-roi-calculator" "app/(marketing)/au/tools/gold-roi-calculator"
```

In `next.config.ts` im bestehenden `redirects()`-Block (bei den vorhandenen Tool-Redirects, `grep -n "debt-payoff-calculator" next.config.ts`):

```ts
{ source: '/tools/gold-roi-calculator', destination: '/au/tools/gold-roi-calculator', permanent: true },
```

- [ ] **Step 3: Registry + Page-Metadata aktualisieren**

Registry: `gold-roi`-Variante `path: '/au/tools/gold-roi-calculator'`, `legacyPaths: ['/tools/gold-roi-calculator']`; `KNOWN_MISPLACED`-Ausnahme im Integritätstest löschen. Die Page nutzt bereits `buildToolMetadata('gold-roi','au')` (Task 2) → Canonical/hreflang stimmen automatisch. AU-Hub-Array (`app/(marketing)/au/tools/page.tsx`): Karte für Gold ROI ergänzen (Task 6 stellt Hubs ohnehin auf Registry um; bis dahin manuelle Karte mit `href: '/au/tools/gold-roi-calculator'`).

Zusätzlicher Unit-Test in `tool-registry.test.ts`:

```ts
it('legacyPaths sind in next.config redirects abgedeckt', () => {
  const cfg = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');
  for (const t of Object.values(TOOL_REGISTRY)) {
    for (const legacy of t.legacyPaths ?? []) {
      expect(cfg.includes(`'${legacy}'`), `redirect fehlt für ${legacy}`).toBe(true);
    }
  }
});
```

- [ ] **Step 4: Grün + committen**

Run: `npx tsc --noEmit && npx vitest run __tests__/unit/tool-registry.test.ts && npm run build && npx playwright test e2e/tool-seo.spec.ts`

```bash
git add -A
git commit -m "fix(seo): gold-roi atomar nach /au/tools/ — Route, 308, Canonical, Registry, Hub (FDL 0.3)"
```

---

### Task 4 (PR 0.4): lib/rules + Stale-Constants-Fix — **Opus-Review nach Implementierung**

**Files:**
- Create: `lib/rules/types.ts`, `lib/rules/index.ts`, `lib/rules/us.ts`, `lib/rules/uk.ts`, `lib/rules/ca.ts`, `lib/rules/au.ts`, `lib/rules/assumptions.ts`, `scripts/check-rule-freshness.mjs`
- Modify: `components/tools/superannuation-calculator.tsx`, `components/tools/tfsa-rrsp-calculator.tsx`, `app/(marketing)/au/tools/superannuation-calculator/page.tsx`, `app/(marketing)/ca/tools/tfsa-rrsp-calculator/page.tsx`, `app/(marketing)/uk/tools/isa-tax-savings-calculator/page.tsx`
- Test: `__tests__/unit/rules.test.ts`

- [ ] **Step 1: Failing Tests (Boundary + Integrität)**

```ts
// __tests__/unit/rules.test.ts
import { describe, it, expect } from 'vitest';
import { getRule, getRuleMeta } from '@/lib/rules';
import { RULE_PACKS } from '@/lib/rules/index';

describe('getRule boundaries', () => {
  it('AU concessional cap flips exactly on 2026-07-01', () => {
    expect(getRule('au', 'concessionalCap', '2026-06-30')).toBe(30000);
    expect(getRule('au', 'concessionalCap', '2026-07-01')).toBe(32500);
  });
  it('AU super guarantee is 12% since 2025-07-01', () => {
    expect(getRule('au', 'superGuaranteeRate', '2025-06-30')).toBe(0.115);
    expect(getRule('au', 'superGuaranteeRate', '2026-07-12')).toBe(0.12);
  });
  it('CA 2026 limits', () => {
    expect(getRule('ca', 'rrspLimit', '2026-07-12')).toBe(33810);
    expect(getRule('ca', 'tfsaCumulative', '2026-07-12')).toBe(109000);
  });
  it('UK CGT + ISA', () => {
    expect(getRule('uk', 'cgtBasicRate', '2026-07-12')).toBe(0.18);
    expect(getRule('uk', 'cashIsaAllowance', '2027-04-06')).toBe(12000); // zukunftsdatiert
    expect(getRule('uk', 'cashIsaAllowance', '2026-07-12')).toBe(20000);
  });
  it('US 2026 retirement limits', () => {
    expect(getRule('us', 'k401Limit', '2026-01-01')).toBe(24500);
    expect(getRule('us', 'iraLimit', '2026-01-01')).toBe(7500);
  });
});

describe('rule pack integrity', () => {
  it('windows per key are sorted and non-overlapping; every entry has source + verifiedAt', () => {
    for (const [market, pack] of Object.entries(RULE_PACKS)) {
      for (const [key, entries] of Object.entries(pack)) {
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i];
          expect(e.sourceUrl, `${market}.${key}[${i}] sourceUrl`).toMatch(/^https:\/\//);
          expect(e.verifiedAt, `${market}.${key}[${i}] verifiedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          if (i > 0) {
            expect(entries[i - 1].effectiveTo ?? '9999', `${market}.${key} overlap`).toBeLessThanOrEqual(e.effectiveFrom);
            expect(entries[i - 1].effectiveFrom < e.effectiveFrom).toBe(true);
          }
        }
      }
    }
  });
});
```

Run → FAIL.

- [ ] **Step 2: Rules implementieren**

`lib/rules/types.ts` exakt nach SPEC 8.4 (`RuleCategory`, `RuleEntry`, `RulePack`). `lib/rules/index.ts`:

```ts
import { US_RULES } from './us'; import { UK_RULES } from './uk';
import { CA_RULES } from './ca'; import { AU_RULES } from './au';
import type { RuleEntry, RulePack } from './types';

export const RULE_PACKS: Record<'us' | 'uk' | 'ca' | 'au', RulePack> = {
  us: US_RULES, uk: UK_RULES, ca: CA_RULES, au: AU_RULES,
};

export function getRuleMeta(market: keyof typeof RULE_PACKS, key: string, asOf: string): RuleEntry {
  const entries = RULE_PACKS[market][key];
  if (!entries?.length) {
    if (process.env.NODE_ENV !== 'production') throw new Error(`Unknown rule ${market}.${key}`);
    // prod: fail-soft auf neuesten Eintrag wird unten behandelt
  }
  const match = [...(entries ?? [])].reverse()
    .find((e) => e.effectiveFrom <= asOf && (!e.effectiveTo || asOf <= e.effectiveTo));
  if (match) return match;
  if (process.env.NODE_ENV !== 'production') throw new Error(`No rule window ${market}.${key} @ ${asOf}`);
  return entries[entries.length - 1];
}

export function getRule(market: keyof typeof RULE_PACKS, key: string, asOf: string): number {
  return getRuleMeta(market, key, asOf).value;
}
```

Pack-Inhalte: **exakt die Tabelle SPEC 8.4** (Werte, effectiveFrom/To, category) mit diesen `sourceUrl`s: US → `https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500`; CA → `https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html`; UK CGT → `https://www.gov.uk/capital-gains-tax/rates`, ISA → `https://www.gov.uk/individual-savings-accounts`, Cash-ISA-2027 → gov.uk-Factsheet „ISA reform 2027"; AU → `https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/contributions-caps` (+ Key-rates-Seite für SG). `verifiedAt: '2026-07-12'` überall. `assumptions.ts`: realReturn 0.03/0.05/0.065 + inflation 0.025 (category `assumption`, sourceUrl auf die SPEC-Datei im Repo ist NICHT zulässig — als Quelle die Methodik-Sektion mit Herleitung dokumentieren: sourceUrl `https://smartfinpro.com/tools/retirement-calculator#methodology` erst ab Phase 4; bis dahin Eintrag mit `label: 'Editorial long-run assumption'` und dem Verweis in der Code-Doku).

- [ ] **Step 3: Tests grün**

Run: `npx vitest run __tests__/unit/rules.test.ts` → PASS.

- [ ] **Step 4: Stale-Konstanten in den 3 Widgets/2 Pages ersetzen**

Fundstellen per grep verifizieren (Zeilennummern können driften):
`grep -n "11.5\|27,500\|27500" components/tools/superannuation-calculator.tsx app/(marketing)/au/tools/superannuation-calculator/page.tsx`
`grep -n "31,560\|31560\|95,000\|95000" components/tools/tfsa-rrsp-calculator.tsx app/(marketing)/ca/tools/tfsa-rrsp-calculator/page.tsx`
`grep -n "10% (basic)\|2025/26" app/(marketing)/uk/tools/isa-tax-savings-calculator/page.tsx`

Ersetzungen (Client-Widgets importieren NICHT `lib/rules` in diesem Task — sie sind noch nicht Shell-migriert; die Zahlen werden als Konstanten mit Quelle-Kommentar aktualisiert, die Rules-Anbindung kommt mit der Shell-Migration):
- Super-Widget: Default-SG `11.5` → `12`; UI-Text „11.5% (Current)" → „12% (current since July 2025)"; Copy „increasing to 12% by 2025" → „the legislated 12% rate applies since 1 July 2025"; Cap-Copy „A$27,500 (2024-25)" → „A$32,500 (2026-27)".
- Super-Page: den widersprüchlichen Absatz auf dieselben Aussagen vereinheitlichen.
- TFSA/RRSP: `31560` → `33810`; „(2024)" → „(2026)"; „$95,000 (as of 2024)" → „$109,000 (as of 2026)"; „2024-2025 TFSA Contribution Limits" → „2026 TFSA Contribution Limits"; „based on 2024 CRA limits" → „based on 2026 CRA limits".
- ISA-Page: „Capital Gains Tax: 10% (basic)" → „Capital Gains Tax: 18% (basic rate) / 24% (higher rate)"; „Key ISA Rules (2025/26)" → „Key ISA Rules (2026/27)"; einen Satz zum Cash-ISA-Wechsel ab April 2027 ergänzen: `From 6 April 2027 the cash ISA allowance falls to £12,000 for under-65s, while the overall £20,000 ISA allowance stays unchanged.`

- [ ] **Step 5: Freshness-Script**

```js
// scripts/check-rule-freshness.mjs  (Muster: scripts/check-content-freshness.mjs)
// SLAs je category: rate=90, limit=400, tax=400, assumption=365 Tage.
// Zusätzlich: Warnung, wenn heute <30 Tage vor 01-01 (us/ca), 04-06 (uk), 07-01 (au)
// und für den Stichtag KEIN zukunftsdatierter Eintrag existiert.
// Ausgabe: Tabelle key | market | verifiedAt | ageDays | sla | status(ok/warn)
// Exit-Code 0 immer (nicht-blockierend), --strict → Exit 1 bei warn.
```
Implementierung: RULE_PACKS via `npx tsx` importieren oder die vier Pack-Dateien als Daten regex-frei über ein kleines `export`-Manifest laden — einfachster Weg: `node --loader tsx scripts/...` vermeiden und stattdessen `npx tsx scripts/check-rule-freshness.mts` als TS-Script schreiben, das direkt `RULE_PACKS` importiert. package.json-Script: `"check:rules": "npx tsx scripts/check-rule-freshness.mts"`.

- [ ] **Step 6: Alles grün + committen**

Run: `npx tsc --noEmit && npx vitest run __tests__/unit/rules.test.ts && npm run check:rules && npm run build`

```bash
git add lib/rules __tests__/unit/rules.test.ts scripts/check-rule-freshness.mts components/tools app/\(marketing\) package.json
git commit -m "feat(rules): versionierte Marktregeln + 2026-Daten-Fixes für Super/TFSA-RRSP/ISA (FDL 0.4)"
```

- [ ] **Step 7: Opus-Review anfordern** — Reviewer prüft: Werte gegen Primärquellen, Fenster-Semantik, keine weiteren Stale-Stellen (`grep -rn "27,500\|31,560\|11.5%" app components`), YMYL-Wording. Review-Protokoll in den PR-Text.

---

### Task 5 (PR 0.5): Naming-Drift + statische „Popular"-Badges entfernen

**Files:**
- Modify: `app/(marketing)/tools/page.tsx`, `app/(marketing)/{uk,ca,au}/tools/page.tsx`, `components/marketing/header.tsx`, `config/navigation.ts`, `app/(marketing)/tools/broker-finder/page.tsx`

- [ ] **Step 1: Fundstellen erheben**

Run: `grep -rn "'Popular'\|\"Popular\"\|Fee Savings Calculator\|4 quick questions\|4 Questions" app/\(marketing\) components/marketing config/navigation.ts`

- [ ] **Step 2: Ersetzen**

- Alle `badge: 'Popular'`-Properties ersatzlos entfernen (Hub-Arrays). `badge: 'Coming Soon'`-Einträge für debt-payoff/credit-score/remortgage ebenfalls entfernen (Tools sind fertig; Sichtbarkeit regelt `indexable`/Gate, nicht ein falsches Badge). KEIN neues Badge einführen.
- Kanonischer Name überall: **„Wealthsimple Fee Savings Calculator"** (US-Hub-Karte, CA-Hub-Karte, Header-Mega-Menü, Footer-Links via `config/navigation.ts`).
- Broker-Quiz-Zählung vereinheitlichen: Ist-Zustand per `grep -c "question" components/tools/broker-finder-quiz.tsx` bzw. Quiz-Definition zählen → die PAGE sagt „4", der HUB „5". Die tatsächliche Fragenzahl aus dem Quiz-Array ist maßgeblich; beide Texte darauf vereinheitlichen (Erwartung laut Audit: 5 → Page-Metadata + H1-Badge auf „5 quick questions" heben; falls real 4: Hub auf 4 senken — Ergebnis im PR-Text dokumentieren).

- [ ] **Step 3: Grün + committen**

Run: `npx tsc --noEmit && npm run build && npx playwright test e2e/tool-seo.spec.ts`

```bash
git add -A && git commit -m "fix(tools): Naming-Drift vereinheitlicht, unbelegte Popular/Coming-Soon-Badges entfernt (FDL 0.5)"
```

---

### Task 6 (PR 0.6): Übrige Registry-Konsumenten umstellen

**Files:**
- Modify: `config/navigation.ts`, 4 Hub-`page.tsx`, `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/(marketing)/[market]/page.tsx` (PlatformStats-Aufruf), `components/marketing/header.tsx` (Hub-Links markt-lokal)

- [ ] **Step 1: Failing Test erweitern**

```ts
// __tests__/unit/tool-registry.test.ts — zusätzlich:
it('sitemap entries derive from registry (no hardcoded tool list drift)', async () => {
  const { getSitemapToolEntries } = await import('@/lib/tools/registry');
  const urls = getSitemapToolEntries().map((e) => e.url);
  expect(urls).toContain('/uk/tools');            // Markt-Hubs drin
  expect(urls).toContain('/au/tools/gold-roi-calculator');
  expect(urls).not.toContain('/tools/gold-roi-calculator');   // legacy raus
  expect(urls).not.toContain('/tools/debt-payoff-calculator'); // noindex raus
});
```

- [ ] **Step 2: Konsumenten umstellen (Export-Namen stabil halten)**

- `config/navigation.ts`: `globalToolLinks`/`marketToolLinks`/`getSiloToolLinks` intern auf `getFooterToolLinks(market)` umstellen; Signaturen der Exporte unverändert lassen (Header/Footer-Komponenten bleiben unberührt). Footer verliert damit automatisch die noindex-Tools (debt-payoff, credit-score, remortgage) — im PR-Text explizit erwähnen.
- 4 Hub-Pages: `const tools = [...]`-Arrays ersetzen durch `getToolsForMarket(market)`-Mapping auf die bestehende Kartenstruktur (`title→name, description→blurb, href→entryHref, icon→icon`). **Zwei ausgewiesene Verhaltensänderungen (SPEC 4.2, im PR-Text dokumentieren):** (a) das Broker-Triple erscheint auf UK/CA/AU-Hubs über `?market=`-Links; (b) US-zentrische Tools (loan, rewards, ai-roi) verschwinden aus UK/CA/AU-Hubs und -Nav („ehrliche Marktverfügbarkeit"). Kartendesign/JSX bleibt in diesem PR unverändert (Decision Launcher kommt erst Phase 2.4).
- `app/sitemap.ts`: hardcodiertes `toolPages`-Array (inkl. auskommentierter Zeilen) löschen → `getSitemapToolEntries()`.
- `app/llms.txt/route.ts`: Sektion `## Tools & Calculators` aus `getLlmsToolLines()` einfügen.
- Homepage: `<PlatformStats totalReviews={...} totalTools={countLiveConcepts()} />` — **Konzepte, nicht Routen** (öffentliche Kennzahl; `countLiveRoutes()` bleibt intern für Manifest/Health). Den Default `9` in `homepage-sections.tsx` entfernen (Pflicht-Prop machen), damit der Drift nicht zurückkommt.
- Header: „Get Started"-CTA + Tools-Menü-Basislink auf `getHubPathForMarket(market)`.

- [ ] **Step 3: Grün + committen**

Run: `npx tsc --noEmit && npx vitest run __tests__/unit/ && npm run build && npx playwright test e2e/tool-seo.spec.ts e2e/multi-market.spec.ts`

```bash
git add -A && git commit -m "feat(tools): Nav/Hubs/Sitemap/llms.txt/Homepage aus der Registry — Duplikate eliminiert (FDL 0.6)"
```

---

### Task 7 (PR 0.7): WebApplication- + FAQPage-Schema für Tool-Seiten

**Files:**
- Modify: `lib/seo/schema.ts`
- Create: `components/seo/web-application-schema.tsx`, `components/tools/shell/tool-json-ld.tsx` (Vorzieh-Komponente, shell-Verzeichnis anlegen)
- Modify: Tool-Pages mit sichtbarer FAQ (mindestens gold-roi, debt-payoff, credit-score, remortgage, tfsa-rrsp, superannuation — per `grep -rln "FAQ" app/(marketing)/**/tools` verifizieren)

- [ ] **Step 1: Failing Unit-Test**

```ts
// __tests__/unit/schema-webapplication.test.ts
import { describe, it, expect } from 'vitest';
import { generateWebApplicationSchema } from '@/lib/seo/schema';

describe('generateWebApplicationSchema', () => {
  it('emits valid WebApplication JSON-LD without fabricated ratings', () => {
    const s = generateWebApplicationSchema({
      name: 'Debt Payoff Calculator',
      url: 'https://smartfinpro.com/tools/debt-payoff-calculator',
      description: 'x', applicationCategory: 'FinanceApplication',
    });
    expect(s['@type']).toBe('WebApplication');
    expect(s.offers).toMatchObject({ '@type': 'Offer', price: '0' });
    expect('aggregateRating' in s).toBe(false);
  });
});
```

- [ ] **Step 2: Generator implementieren** (in `lib/seo/schema.ts`, Stil der Nachbarn):

```ts
export function generateWebApplicationSchema(input: {
  name: string; url: string; description: string; applicationCategory: 'FinanceApplication';
}) {
  return {
    '@context': 'https://schema.org', '@type': 'WebApplication',
    name: input.name, url: input.url, description: input.description,
    applicationCategory: input.applicationCategory, operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'SmartFinPro', url: 'https://smartfinpro.com' },
  };
}
```

Wrapper `components/seo/web-application-schema.tsx` analog `faq-schema.tsx`. `tool-json-ld.tsx` kombiniert WebApplication + BreadcrumbSchema (+ FAQSchema nur, wenn `faq`-Daten übergeben werden — FAQPage NUR bei sichtbarer FAQ, SPEC-Regel).

- [ ] **Step 3: In Pages einbauen** — jede Tool-Page rendert `<ToolJsonLd toolId market faq={...} />`; FAQ-Daten aus dem bereits sichtbaren FAQ-Markup der Seite extrahieren (dieselben Fragen/Antworten — Schema spiegelt Sichtbares, nie mehr). Den falschen Kommentar „Linked to FAQPage Schema" in `components/ui/answer-block.tsx` löschen.

- [ ] **Step 4: Grün + committen**

Run: `npx tsc --noEmit && npx vitest run __tests__/unit/schema-webapplication.test.ts && npm run build && npx playwright test e2e/tool-seo.spec.ts`
Zusätzliche e2e-Assertion ergänzen: `JSON.parse` aller `script[type="application/ld+json"]` auf einer Tool-Seite wirft nicht und enthält `@type: 'WebApplication'`.

```bash
git add -A && git commit -m "feat(seo): WebApplication- und FAQPage-JSON-LD für Tool-Seiten (FDL 0.7)"
```

---

## Abhängigkeiten & Reihenfolge

`0.0` unabhängig (zuerst mergen — schützt alle Folge-PRs) · `0.1` unabhängig · `0.2 ← 0.1` · `0.3 ← 0.2` (Page nutzt schon buildToolMetadata) · `0.4` unabhängig · `0.5 ← 0.1` (kanonische Namen) · `0.6 ← 0.1 + 0.3 + 0.5` · `0.7 ← 0.2`.

**Kein De-noindex in Phase 0** — Indexability Gate (SPEC 11) entscheidet je Tool später.

## Revision v1.1 (12.07.2026, nach externer Review)

- **Task 0 neu geschnitten:** keine privaten Produktions-Secrets in PR-Builds (Platzhalter + empirischer Beweis-Step 1b); Trigger ohne `paths:`-Filter, In-Job-Diff-Filter mit skip-but-pass → Required Check erscheint auf jedem PR und testet Workflow-Änderungen selbst. PR #74 wird auf diesen Stand nachgezogen und erst nach einem tatsächlich gelaufenen grünen Build-Job gemerged.
- **Task 1 auf SPEC-4.2-Vertrag gehoben:** `variants[]` (SEO) getrennt von `availableMarkets[]` (Funktion); `getToolEntryHref()` mit validiertem `?market=`-Param für das Broker-Triple; `countLiveConcepts()`/`countLiveRoutes()` statt einem mehrdeutigen `countLiveTools()`; Markt-Vertragstests ergänzt. PR #75 wird entsprechend erweitert.
- **Task 6:** Hub/Nav über `entryHref`; zwei dokumentierte Verhaltensänderungen (Broker-Triple auf allen Hubs, US-zentrische Tools nur noch US).

## Self-Review-Ergebnis (Plan gegen SPEC Kapitel 11, Phase 0)

- Spec-Coverage: 0.0–0.7 vollständig abgebildet; De-noindex bewusst ausgeklammert (Gate-Regel). ✓
- Platzhalter: keine — repetitive Stellen sind durch vollständige Datentabellen bzw. wörtliche SPEC-Referenzen (Tabelle 9.1) abgedeckt. ✓
- Typ-Konsistenz: `ToolRouteVariant`/`ToolDefinition`/`getAllVariants` in Tasks 1–3 und 6 identisch verwendet; `getRule(market, key, asOf)` einheitlich. ✓
- Bekannte bewusste Abweichung: Task 4 verdrahtet die Widgets noch NICHT mit `lib/rules` (Konstanten + Quelle im Kommentar) — die Rules-Anbindung gehört zur Shell-Migration (Phase 2/5), sonst entstünde ein Client-Bundle-Import ohne Shell-Architektur. Im jeweiligen PR-Text ausweisen.
