# Broker-V2-Rollout Phase 0 — Stack stabilisieren (Implementierungsplan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den dreistufigen Basis-Stack (#103 → #105 → `feat/broker-v2-standard` →
`feat/charles-schwab-v2-pilot`) mit Governance-Reviews auf `main` mergen und dabei das
fehlende Readiness-Manifest, das rote Inventar und die ausführbaren Quality-Gates liefern.

**Architecture:** Vier sequenzielle Merge-Stufen, jede mit unabhängigem Review (Opus)
vor dem Merge. Der einzige neue Code entsteht auf `feat/broker-v2-standard`:
pure Readiness-Ableitung in `lib/reviews/readiness.ts` (TDD), ein IO-Generator-Skript
mit `--check`-Modus, plus zwei dünne CLI-Runner (Score ≥ 90, forbidden-claims pro Pfad),
die später von `/v2-verify` wiederverwendet werden. Downstream-Branches werden mit
`git rebase --onto` umgehängt, weil `main` Squash-Merges bekommt.

**Tech Stack:** Next.js 16 Repo · Node/tsx-Skripte · Vitest (node env) ·
Supabase JS (read-only SELECT auf Prod `product_attributes`) · gh CLI.

**Spec:** [2026-07-26-broker-v2-rollout-design.md](../specs/2026-07-26-broker-v2-rollout-design.md) (Rev. 2)

---

## Verbindliche Arbeitsumgebungen (Worktree-Falle!)

| Branch | Worktree (absolut) | Zustand |
|---|---|---|
| `fix/editorial-integrity` (PR #103) | `/private/tmp/sfp-editorial-integrity` | existiert, eingerichtet |
| `claude/optimistic-sanderson-a83dc7` (PR #105) | `/Users/christianb./Websites/smartfinpro.com/.worktrees/pr-105-evidence` | **neu anlegen** (Task 2) |
| `feat/broker-v2-standard` | `/Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard` | **neu anlegen** (Task 3) |
| `feat/charles-schwab-v2-pilot` | `/Users/christianb./Websites/smartfinpro.com/.worktrees/editorial-merge` | existiert, eingerichtet |
| `main` | kein eigener Checkout — nur `git fetch` + `gh` | — |

Regeln für JEDE Session dieses Plans:

- Bash immer mit explizitem `cd <absoluter Worktree-Pfad> && …` beginnen (cwd driftet).
- Neue Worktrees sofort einrichten: `.env.local` aus dem Haupt-Repo kopieren,
  `node_modules` symlinken (`ln -s /Users/christianb./Websites/smartfinpro.com/node_modules node_modules`).
- `audits/reports/unit-latest.json` NIE stagen/committen — vor jedem Commit `git status --short` prüfen.
- Reviews = frische Independent-Reviewer-Session (Opus) laut `docs/governance/model-roles.md`.
- Nach jedem Merge auf `main`: Deploy am **run conclusion** prüfen, nicht am Watch-Exit.

---

### Task 1: PR #103 — unabhängiges Review, dann Merge

**Files:** keine Code-Änderung (Review + Merge-Aktion).

- [ ] **Step 1: Reviewer-Session dispatchen** — Agent `superpowers:code-reviewer`, `model: opus`,
  mit diesem Charter (wörtlich übergeben):

  > Unabhängiges Review von PR #103 (`fix/editorial-integrity`, 58 Commits, 101 Dateien).
  > Arbeitsverzeichnis: `/private/tmp/sfp-editorial-integrity`. Prüfe gegen die Governance
  > in `docs/governance/model-roles.md` und die Spec
  > `docs/superpowers/specs/2026-07-26-broker-v2-rollout-design.md` (liegt im Worktree
  > `.worktrees/editorial-merge`, Branch-Kontext beachten). Schwerpunkte:
  > (1) Kein `"@type":"Person"`/fabrizierter Reviewer mehr im Build-Output der
  > V1-Review-Seiten (Stichprobe: Prod-Build + curl gegen 2 Reviews).
  > (2) Genau EINE V2-Review auf diesem Branch (`content/us/trading/etoro-review.mdx`) —
  > `git grep -l reviewLayout -- content/` muss genau diese Datei liefern.
  > (3) Die Gate-Umbauten aus `5735a1f` (check-frontmatter, check-trust-blocks) verlangen
  > `reviewedBy` nicht mehr und brechen den Build nicht.
  > (4) Volle Gates lokal: `npm run ci` UND `npm run build` (CI baut nicht voll!).
  > (5) Kein Secret-/CSP-/Compliance-Regressions-Risiko in den 101 Dateien (Stichproben
  > nach Risiko, nicht Volllektüre).
  > Ergebnis: Verdikt SHIP / SHIP-mit-Fixes / BLOCK mit konkreten Findings (Datei:Zeile).

- [ ] **Step 2: Findings behandeln** — Blocker-Findings auf `fix/editorial-integrity`
  fixen (Implementer-Session), Review-Loop bis Verdikt SHIP.

- [ ] **Step 3: Review auf GitHub dokumentieren**

```bash
gh pr review 103 --approve --body "Independent review (Opus, model-roles.md): SHIP. Gates lokal grün (ci + voller Build), genau 1 V2-Review (eToro), keine fabrizierten Reviewer im Build-Output. Details im Review-Protokoll der Session."
```

- [ ] **Step 4: Merge (Squash) — Basis-Branch NICHT löschen**

```bash
gh pr merge 103 --squash
```

Erwartung: PR #103 MERGED. `fix/editorial-integrity` bleibt als Branch bestehen
(Basis für die `--onto`-Rebases in Task 3/9).

- [ ] **Step 5: Deploy verifizieren**

```bash
gh run list --workflow deploy.yml --limit 1 --json conclusion,displayTitle
curl -s -o /dev/null -w '%{http_code}' "https://smartfinpro.com/us/trading/etoro-review/?cachebust=$(date +%s)"
```

Erwartung: `"conclusion":"success"` und HTTP 200.

---

### Task 2: PR #105 — auf neues main aktualisieren, Review, Merge

**Files:**
- Worktree anlegen: `.worktrees/pr-105-evidence`
- Modify (Konfliktauflösung): Content-MDX, `package.json`, ggf. `components/marketing/*`, `e2e/*`

- [ ] **Step 1: Worktree anlegen und einrichten**

```bash
cd /Users/christianb./Websites/smartfinpro.com
git fetch origin
git worktree add .worktrees/pr-105-evidence claude/optimistic-sanderson-a83dc7
cd .worktrees/pr-105-evidence
cp /Users/christianb./Websites/smartfinpro.com/.env.local .env.local
ln -s /Users/christianb./Websites/smartfinpro.com/node_modules node_modules
```

- [ ] **Step 2: main einmergen (Merge, nicht Rebase — Branch ist gepusht und im PR)**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/pr-105-evidence
git merge origin/main
git status --short | head -40
```

Erwartete Konfliktklassen und Auflösungsregeln:

| Dateiklasse | Regel |
|---|---|
| `content/**/*.mdx` | Beide Seiten vereinen: #105-Entfernung der unbelegten Evidence-Carousels BEHALTEN, mains übrige Editorial-Änderungen BEHALTEN. Bei eToro (auf main jetzt V2): main-Fassung gewinnt vollständig — V2 hat keine Carousels mehr; #105-Hunks dort verwerfen. |
| `package.json` | Union der Scripts: `check:evidence` aus #105 ergänzen, alle main-Scripts behalten. Danach prüfen: `grep -c '"check:evidence"' package.json` → `1`. |
| `app/(marketing)/[market]/page.tsx`, `components/marketing/hero.tsx` | main-Fassung (PR #108 Hero) als Basis, #105-Änderungen nur wenn sie Carousel-Entfernung betreffen. |
| `e2e/*` | Beide Specs behalten. |

- [ ] **Step 3: Gates auf dem aktualisierten Branch**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/pr-105-evidence
npm run check:evidence
npm run ci
npm run build
```

Erwartung: alle drei Exit 0. (`check:evidence` ist der neue Guard dieses PRs — muss grün
sein, sonst ist die Carousel-Entfernung unvollständig.)

- [ ] **Step 4: Push**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/pr-105-evidence
git push origin claude/optimistic-sanderson-a83dc7
gh pr view 105 --json mergeable,mergeStateStatus
```

Erwartung: `"mergeable":"MERGEABLE"`.

- [ ] **Step 5: Reviewer-Session (Opus) dispatchen** — Charter:

  > Unabhängiges Review von PR #105 nach dem main-Merge. Arbeitsverzeichnis
  > `.worktrees/pr-105-evidence`. Schwerpunkte: (1) Merge-Auflösung hat keine
  > main-Änderung rückgängig gemacht (`git diff origin/main...HEAD` enthält NUR
  > Evidence-/Guard-Änderungen); (2) `npm run check:evidence` grün; (3) die 6 e2e aus
  > dem PR laufen gegen einen Prod-Build (`npm run build` + `next start`); (4) kein
  > verwaister `<EvidenceCarousel>`-Import bleibt.

- [ ] **Step 6: Review dokumentieren + Merge + Deploy prüfen**

```bash
gh pr review 105 --approve --body "Independent review (Opus): SHIP nach main-Update. check:evidence grün, e2e 6/6 gegen Prod-Build, keine main-Regression im Range-Diff."
gh pr merge 105 --squash --delete-branch
gh run list --workflow deploy.yml --limit 1 --json conclusion
```

Erwartung: MERGED, Deploy `success`.

---

### Task 3: `feat/broker-v2-standard` — Worktree + Rebase auf main

**Files:** Worktree anlegen; Konfliktauflösung wie Task 2 Step 2.

- [ ] **Step 1: Worktree anlegen und einrichten**

```bash
cd /Users/christianb./Websites/smartfinpro.com
git fetch origin
git worktree add .worktrees/broker-v2-standard feat/broker-v2-standard
cd .worktrees/broker-v2-standard
cp /Users/christianb./Websites/smartfinpro.com/.env.local .env.local
ln -s /Users/christianb./Websites/smartfinpro.com/node_modules node_modules
```

- [ ] **Step 2: Rebase — NUR die eigenen 25 Commits umhängen (`--onto`!)**

`main` enthält #103 als Squash — ein normales `git rebase main` würde alle 58
Editorial-Commits erneut abspielen und massenhaft konfliktieren. Deshalb:

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
git rebase --onto origin/main fix/editorial-integrity feat/broker-v2-standard
```

Konflikte nach den Regeln aus Task 2 Step 2 auflösen (zusätzlich: bei
`scripts/check-*`-Gates gewinnt die Fassung dieses Branches — er besitzt die Gates).

- [ ] **Step 3: Gates nach Rebase**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
npm run ci && npm run build
```

Erwartung: Exit 0. Noch NICHT pushen — erst nach Task 7.

---

### Task 4: Readiness-Ableitung als pure Logik (TDD)

**Files:**
- Create: `.worktrees/broker-v2-standard/lib/reviews/readiness.ts`
- Test: `.worktrees/broker-v2-standard/__tests__/unit/broker-v2-readiness.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

```typescript
// __tests__/unit/broker-v2-readiness.test.ts
import { describe, it, expect } from 'vitest';
import {
  countFields,
  rankRows,
  deriveReadinessEntry,
  type CockpitRowLite,
} from '@/lib/reviews/readiness';

const row = (over: Partial<CockpitRowLite> = {}): CockpitRowLite => ({
  market: 'us', category: 'trading', topic: 'trading-platforms',
  slug: 'interactive-brokers', review_slug: 'interactive-brokers-review',
  score: 9.2, is_top_pick: false, data_verified_at: '2026-07-03',
  attributes: { fees: 0, min_deposit: 0, platforms: 'TWS' },
  ...over,
});

const cand = {
  path: 'content/us/trading/interactive-brokers-review.mdx',
  market: 'us', category: 'trading', slug: 'interactive-brokers-review',
};

describe('countFields', () => {
  it('zählt nur nicht-leere Attributwerte', () => {
    expect(countFields({ a: 1, b: '', c: null, d: 'x', e: undefined })).toBe(2);
  });
  it('null/fehlende attributes → 0', () => {
    expect(countFields(null)).toBe(0);
  });
});

describe('rankRows', () => {
  it('ordnet is_top_pick desc, dann score desc (nulls last), dann slug asc', () => {
    const rows = [
      row({ slug: 'b', score: 9.0, is_top_pick: false }),
      row({ slug: 'a', score: null, is_top_pick: false }),
      row({ slug: 'c', score: 8.0, is_top_pick: true }),
      row({ slug: 'd', score: 9.0, is_top_pick: false }),
    ];
    expect(rankRows(rows).map((r) => r.slug)).toEqual(['c', 'b', 'd', 'a']);
  });
});

describe('deriveReadinessEntry', () => {
  const audited = '2026-07-26';

  it('ready: Produkt gefunden, Felder + data_verified_at + score vorhanden', () => {
    const e = deriveReadinessEntry(cand, ['trading-platforms'],
      new Map([['trading-platforms', [row({ slug: 'etoro', review_slug: 'etoro-review', score: 9.6, is_top_pick: true }), row()]]]), audited);
    expect(e).toMatchObject({
      status: 'ready', topic: 'trading-platforms', productSlug: 'interactive-brokers',
      reviewSlug: 'interactive-brokers-review', rank: 2, fieldCount: 3,
      dataVerifiedAt: '2026-07-03', auditedAt: audited,
    });
  });

  it('missing-topic: keine Manifest-Topics für market/category', () => {
    expect(deriveReadinessEntry(cand, [], new Map(), audited).status).toBe('missing-topic');
  });

  it('missing-product: Topics existieren, aber kein row.review_slug matcht', () => {
    const e = deriveReadinessEntry(cand, ['trading-platforms'],
      new Map([['trading-platforms', [row({ review_slug: 'etoro-review', slug: 'etoro' })]]]), audited);
    expect(e.status).toBe('missing-product');
  });

  it('empty-field: Produkt gefunden, aber 0 Felder ODER kein data_verified_at ODER kein score', () => {
    for (const bad of [{ attributes: {} }, { data_verified_at: null }, { score: null }]) {
      const e = deriveReadinessEntry(cand, ['trading-platforms'],
        new Map([['trading-platforms', [row(bad as Partial<CockpitRowLite>)]]]), audited);
      expect(e.status).toBe('empty-field');
    }
  });

  it('erster Topic-Treffer gewinnt bei mehreren Topics', () => {
    const e = deriveReadinessEntry(cand, ['a-topic', 'trading-platforms'],
      new Map([
        ['a-topic', [row({ topic: 'a-topic' })]],
        ['trading-platforms', [row()]],
      ]), audited);
    expect(e.topic).toBe('a-topic');
  });
});
```

- [ ] **Step 2: Fehlschlag verifizieren**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
npx vitest run __tests__/unit/broker-v2-readiness.test.ts
```

Erwartung: FAIL — `Cannot find module '@/lib/reviews/readiness'`.

- [ ] **Step 3: Implementierung**

```typescript
// lib/reviews/readiness.ts
// Pure Ableitung für docs/reviews/broker-v2-readiness.yml — das Cockpit-Vor-Gate
// aus docs/reviews/broker-v2-standard.md §E. Kein IO hier: der Generator
// (scripts/generate-broker-v2-readiness.mts) liefert Kandidaten + DB-Rows.
// Statuswerte sind die geschlossene Menge aus der Rollout-Spec (Rev. 2).

export type ReadinessStatus =
  | 'ready' | 'missing-topic' | 'missing-product' | 'empty-field' | 'audit-error';

export interface ReadinessCandidate {
  path: string;
  market: string;
  category: string;
  slug: string; // review slug, z. B. "interactive-brokers-review"
}

/** Schmaler Ausschnitt einer product_attributes-Row (Spaltennamen = DB). */
export interface CockpitRowLite {
  market: string;
  category: string;
  topic: string;
  slug: string;
  review_slug: string | null;
  score: number | null;
  is_top_pick: boolean | null;
  data_verified_at: string | null;
  attributes: Record<string, unknown> | null;
}

export interface ReadinessEntry {
  status: ReadinessStatus;
  topic: string | null;
  productSlug: string | null;
  reviewSlug: string;
  rank: number | null;
  fieldCount: number | null;
  dataVerifiedAt: string | null;
  auditedAt: string;
}

export function countFields(attributes: Record<string, unknown> | null): number {
  if (!attributes) return 0;
  return Object.values(attributes)
    .filter((v) => v !== null && v !== undefined && v !== '').length;
}

/**
 * Deterministische Snapshot-Ordnung: is_top_pick desc → score desc (nulls last)
 * → slug asc. Bewusst NICHT das Laufzeit-Smart-Ranking (das hängt an
 * Usage-Defaults); `rank` ist ein informatives Snapshot-Feld.
 */
export function rankRows(rows: CockpitRowLite[]): CockpitRowLite[] {
  return [...rows].sort((a, b) => {
    const pick = Number(!!b.is_top_pick) - Number(!!a.is_top_pick);
    if (pick !== 0) return pick;
    if (a.score !== b.score) {
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    }
    return a.slug.localeCompare(b.slug);
  });
}

export function deriveReadinessEntry(
  candidate: ReadinessCandidate,
  topicsForMarketCategory: string[],
  rowsByTopic: Map<string, CockpitRowLite[]>,
  auditedAt: string,
): ReadinessEntry {
  const base: ReadinessEntry = {
    status: 'missing-topic', topic: null, productSlug: null,
    reviewSlug: candidate.slug, rank: null, fieldCount: null,
    dataVerifiedAt: null, auditedAt,
  };
  if (topicsForMarketCategory.length === 0) return base;

  for (const topic of topicsForMarketCategory) {
    const rows = rowsByTopic.get(topic) ?? [];
    const match = rows.find((r) => r.review_slug === candidate.slug);
    if (!match) continue;

    const fieldCount = countFields(match.attributes);
    const complete = fieldCount > 0 && !!match.data_verified_at && match.score !== null;
    const rank = complete
      ? rankRows(rows).findIndex((r) => r.slug === match.slug) + 1
      : null;
    return {
      ...base,
      status: complete ? 'ready' : 'empty-field',
      topic,
      productSlug: match.slug,
      rank,
      fieldCount,
      dataVerifiedAt: match.data_verified_at,
    };
  }
  return { ...base, status: 'missing-product' };
}
```

- [ ] **Step 4: Tests grün**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
npx vitest run __tests__/unit/broker-v2-readiness.test.ts
```

Erwartung: PASS (alle Cases).

- [ ] **Step 5: Commit**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
git status --short   # unit-latest.json darf NICHT dabei sein
git add lib/reviews/readiness.ts __tests__/unit/broker-v2-readiness.test.ts
git commit -m "feat(reviews): pure readiness derivation for the broker-v2 pre-gate"
```

---

### Task 5: Readiness-Generator-Skript + npm-Verdrahtung

**Files:**
- Create: `.worktrees/broker-v2-standard/scripts/generate-broker-v2-readiness.mts`
- Modify: `.worktrees/broker-v2-standard/package.json` (scripts)

- [ ] **Step 1: Skript schreiben**

```typescript
// scripts/generate-broker-v2-readiness.mts
// Generiert docs/reviews/broker-v2-readiness.yml — reiner Cockpit-Snapshot
// (Spec Rev. 2: keine redaktionellen Felder; die gehören in Triage/Dossiers).
// Read-only SELECT auf Prod product_attributes. Aufruf:
//   npx tsx --env-file=.env.local scripts/generate-broker-v2-readiness.mts [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { BEST_X_MANIFEST } from '@/lib/comparison/topics/manifest';
import {
  deriveReadinessEntry,
  type CockpitRowLite,
  type ReadinessCandidate,
  type ReadinessEntry,
} from '@/lib/reviews/readiness';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const INVENTORY = path.join(ROOT, 'docs/reviews/broker-v2-inventory.json');
const OUT = path.join(ROOT, 'docs/reviews/broker-v2-readiness.yml');
const CHECK = process.argv.includes('--check');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY — run with --env-file=.env.local');
  process.exit(2);
}
const supabase = createClient(url, key);

interface InventoryFile {
  reviews: Array<{ path: string; market: string; category: string; slug: string }>;
}

function yamlEscape(v: string | number | null): string {
  if (v === null) return 'null';
  if (typeof v === 'number') return String(v);
  return /^[A-Za-z0-9_./-]+$/.test(v) ? v : JSON.stringify(v);
}

function emitYaml(entries: Map<string, ReadinessEntry>, generatedAt: string): string {
  const lines = ['version: 1', `generatedAt: ${generatedAt}`, 'reviews:'];
  for (const [p, e] of [...entries.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  ${p}:`);
    lines.push(`    status: ${e.status}`);
    lines.push(`    topic: ${yamlEscape(e.topic)}`);
    lines.push(`    productSlug: ${yamlEscape(e.productSlug)}`);
    lines.push(`    reviewSlug: ${yamlEscape(e.reviewSlug)}`);
    lines.push(`    rank: ${yamlEscape(e.rank)}`);
    lines.push(`    fieldCount: ${yamlEscape(e.fieldCount)}`);
    lines.push(`    dataVerifiedAt: ${yamlEscape(e.dataVerifiedAt)}`);
    lines.push(`    auditedAt: ${e.auditedAt}`);
  }
  return lines.join('\n') + '\n';
}

/** generatedAt ist Rauschen — für --check auf beiden Seiten entfernen. */
const stripGeneratedAt = (s: string) => s.replace(/^generatedAt: .*$/m, 'generatedAt: <ignored>');

async function main() {
  const inv: InventoryFile = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const candidates: ReadinessCandidate[] = inv.reviews.map((r) => ({
    path: r.path, market: r.market, category: r.category, slug: r.slug,
  }));

  const auditedAt = new Date().toISOString().slice(0, 10);
  const generatedAt = new Date().toISOString();
  const entries = new Map<string, ReadinessEntry>();

  // Ein Query pro (market, category) — Topics kommen aus dem Manifest (pure data).
  const groups = new Map<string, ReadinessCandidate[]>();
  for (const c of candidates) {
    const k = `${c.market}/${c.category}`;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }

  for (const [k, group] of groups) {
    const [market, category] = k.split('/');
    const topics = BEST_X_MANIFEST
      .filter((e) => e.market === market && e.category === category)
      .map((e) => e.topic);

    let rowsByTopic = new Map<string, CockpitRowLite[]>();
    let auditError = false;
    if (topics.length > 0) {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('market, category, topic, slug, review_slug, score, is_top_pick, data_verified_at, attributes')
        .eq('market', market)
        .eq('category', category)
        .in('topic', topics);
      if (error) {
        console.error(`[audit-error] ${k}: ${error.message}`);
        auditError = true;
      } else {
        for (const row of (data ?? []) as CockpitRowLite[]) {
          rowsByTopic.set(row.topic, [...(rowsByTopic.get(row.topic) ?? []), row]);
        }
      }
    }

    for (const c of group) {
      entries.set(
        c.path,
        auditError
          ? { status: 'audit-error', topic: null, productSlug: null, reviewSlug: c.slug,
              rank: null, fieldCount: null, dataVerifiedAt: null, auditedAt }
          : deriveReadinessEntry(c, topics, rowsByTopic, auditedAt),
      );
    }
  }

  const yaml = emitYaml(entries, generatedAt);

  if (CHECK) {
    const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (stripGeneratedAt(existing) !== stripGeneratedAt(yaml)) {
      console.error('❌ readiness drift — run: npx tsx --env-file=.env.local scripts/generate-broker-v2-readiness.mts');
      process.exit(1);
    }
    console.log('✓ broker-v2-readiness.yml is current');
    return;
  }

  fs.writeFileSync(OUT, yaml);
  const counts = [...entries.values()].reduce<Record<string, number>>(
    (acc, e) => ((acc[e.status] = (acc[e.status] ?? 0) + 1), acc), {});
  console.log('✓ wrote docs/reviews/broker-v2-readiness.yml', counts);
}

main().catch((err) => { console.error(err); process.exit(2); });
```

- [ ] **Step 2: npm-Scripts ergänzen** — in `package.json` unter `scripts`:

```json
"readiness:reviews": "npx tsx --env-file=.env.local scripts/generate-broker-v2-readiness.mts",
"check:readiness": "npx tsx --env-file=.env.local scripts/generate-broker-v2-readiness.mts --check"
```

`check:readiness` NICHT in `ci` aufnehmen — der PR-Build läuft ohne private Secrets
(kein DB-Zugriff in CI). Readiness wird on-demand und pro Welle regeneriert.

- [ ] **Step 3: Generator laufen lassen + Plausibilität**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
npm run readiness:reviews
head -30 docs/reviews/broker-v2-readiness.yml
npm run check:readiness
```

Erwartung: Exit 0, Statuszählung auf stdout, `check:readiness` grün direkt nach
Generierung. Plausibilität: `content/us/trading/interactive-brokers-review.mdx` →
`status: ready`, `topic: trading-platforms` (US-Trading-Cockpit ist auditiert);
UK/AU/CA-Kandidaten ohne Manifest-Topic → `missing-topic`.
Falls tsx `--env-file` nicht durchreicht: Fallback
`node --env-file=.env.local --import tsx scripts/generate-broker-v2-readiness.mts`
und die npm-Scripts entsprechend anpassen.

- [ ] **Step 4: Commit**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
git status --short
git add scripts/generate-broker-v2-readiness.mts package.json docs/reviews/broker-v2-readiness.yml
git commit -m "feat(reviews): generate the broker-v2 readiness manifest from the cockpit"
```

---

### Task 6: CLI-Runner für Score- und Claims-Gate

**Files:**
- Create: `.worktrees/broker-v2-standard/scripts/review-quality.mts`
- Create: `.worktrees/broker-v2-standard/scripts/check-claims-path.mts`
- Modify: `.worktrees/broker-v2-standard/package.json` (scripts)

- [ ] **Step 1: Score-Runner schreiben** — dünner CLI um den echten Scorer
  (`scripts/quality-exact.mjs` ist laut Spec VERBOTEN — V1-Formel):

```typescript
// scripts/review-quality.mts
// CLI um lib/reviews/content-quality.ts — das ausführbare "Score >= min"-Gate
// aus der Rollout-Spec (Rev. 2). Aufruf:
//   npx tsx scripts/review-quality.mts [--min 90] content/...mdx [weitere.mdx]
import fs from 'node:fs';
import matter from 'gray-matter';
import { computeContentQuality } from '@/lib/reviews/content-quality';

const args = process.argv.slice(2);
const minIdx = args.indexOf('--min');
const min = minIdx >= 0 ? Number(args[minIdx + 1]) : 90;
const files = args.filter((a, i) => a !== '--min' && i !== minIdx + 1);
if (files.length === 0) {
  console.error('usage: review-quality.mts [--min N] <file.mdx> ...');
  process.exit(2);
}

let failed = false;
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const { data: fm, content } = matter(raw);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const isV2 = fm.reviewLayout === 'v2';
  const q = computeContentQuality(content, wordCount, isV2, fm);
  const ok = q.score >= min;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✗'} ${file}  score=${q.score} (${q.breakdown})  v2=${isV2}`);
}
process.exit(failed ? 1 : 0);
```

Hinweis: `ContentQuality` heißt das Feld für den Gesamtscore laut Interface in
`lib/reviews/content-quality.ts` — vor dem Ausführen dort verifizieren (Zeile ~19 ff.);
falls es nicht `score` heißt, den Property-Namen im CLI angleichen, NICHT im Lib.

- [ ] **Step 2: Claims-Runner schreiben** — Pfad-genauer Check, weil der globale
  Test weiterhin `describe.skip` ist:

```typescript
// scripts/check-claims-path.mts
// Prüft konkrete Dateien gegen FORBIDDEN_CLAIM_PATTERNS — das ausführbare
// forbidden-claims-Gate pro geändertem Pfad (Rollout-Spec Rev. 2). Aufruf:
//   npx tsx scripts/check-claims-path.mts content/...mdx [weitere Dateien]
import fs from 'node:fs';
import { FORBIDDEN_CLAIM_PATTERNS } from '@/lib/editorial/forbidden-claims';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: check-claims-path.mts <file> ...');
  process.exit(2);
}

let failed = false;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const { pattern, reason } of FORBIDDEN_CLAIM_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g');
    const hits = [...text.matchAll(re)];
    if (hits.length > 0) {
      failed = true;
      console.log(`✗ ${file}: ${hits.length}× /${pattern.source}/ — ${reason}`);
    }
  }
}
if (!failed) console.log(`✓ ${files.length} Datei(en) frei von forbidden claims`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: npm-Scripts ergänzen**

```json
"review:quality": "npx tsx scripts/review-quality.mts",
"review:claims": "npx tsx scripts/check-claims-path.mts"
```

- [ ] **Step 4: Smoke-Verifikation gegen bekannte Zustände**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
npm run review:quality -- content/us/trading/etoro-review.mdx
npm run review:claims -- content/us/trading/etoro-review.mdx
npm run review:claims -- content/us/trading/robinhood-review.mdx; echo "exit=$?"
```

Erwartung: eToro `✓ … score>=90 … v2=true` und claims-frei (Exit 0);
Robinhood (V1, `claims=true` im Inventar) → mindestens ein `✗`-Treffer, `exit=1`.

- [ ] **Step 5: Commit**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
git status --short
git add scripts/review-quality.mts scripts/check-claims-path.mts package.json
git commit -m "feat(reviews): executable score and claims gates for v2 verification"
```

---

### Task 7: Inventar auf Standard-Stand grün + `ci`-Verdrahtung

**Files:**
- Modify: `.worktrees/broker-v2-standard/docs/reviews/broker-v2-inventory.json` (regeneriert)
- Modify: `.worktrees/broker-v2-standard/package.json` (`check:inventory` + `ci`)

- [ ] **Step 1: Inventar regenerieren**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
npm run inventory:reviews
node scripts/inventory-broker-reviews.mjs --check
```

Erwartung: `--check` Exit 0. **Auf diesem Branch sind die Totale 36/1/35**
(nur eToro ist V2 — Schwab/Fidelity leben im Pilot-Branch). Das ist korrekt und
gewollt; der Pilot regeneriert in Task 9 auf 36/3/33.

- [ ] **Step 2: Drift-Schutz in `ci` verdrahten** — der Drift blieb bisher unbemerkt,
  weil nichts den Check ausführte. In `package.json`:

```json
"check:inventory": "node scripts/inventory-broker-reviews.mjs --check"
```

und `ci` erweitern (ans Ende der Kette):

```json
"ci": "npm run check:types && npm run check:imports && npm run lint:p1p5 && npm run test && npm run check:migrations && npm run check:review-v2 && npm run check:inventory"
```

- [ ] **Step 3: Volle Gates**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
npm run ci && npm run build
```

Erwartung: Exit 0 (inkl. neuem `check:inventory`).

- [ ] **Step 4: Commit**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
git status --short
git add docs/reviews/broker-v2-inventory.json package.json
git commit -m "chore(reviews): regenerate inventory on this branch and gate ci on drift"
```

---

### Task 8: `feat/broker-v2-standard` — PR, Review, Merge

- [ ] **Step 1: Push + PR**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/broker-v2-standard
git push --force-with-lease origin feat/broker-v2-standard
gh pr create --base main --head feat/broker-v2-standard \
  --title "feat(reviews): Broker-V2 contract, guard, inventory + readiness pre-gate" \
  --body "$(cat <<'EOF'
Stufe 3 des Phase-0-Stacks (Spec: docs/superpowers/specs/2026-07-26-broker-v2-rollout-design.md).

- Broker-V2-Publikationsvertrag + Guard (check:review-v2, in ci/prebuild)
- Kanonisches Inventar (36/1/35 auf diesem Stand) + Drift-Check jetzt in `ci`
- NEU: Readiness-Manifest (generierter Cockpit-Snapshot, Statuswerte
  ready|missing-topic|missing-product|empty-field|audit-error) + pure Ableitung mit Tests
- NEU: ausführbare Gates `review:quality` (>=90 via lib/reviews/content-quality.ts)
  und `review:claims` (FORBIDDEN_CLAIM_PATTERNS pro Pfad)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Reviewer-Session (Opus) dispatchen** — Charter:

  > Unabhängiges Review des Standard-PRs. Arbeitsverzeichnis
  > `.worktrees/broker-v2-standard`. Schwerpunkte: (1) Rebase-Range-Diff gegen main
  > enthält nur die ~25 eigenen Commits (keine Editorial-Duplikate); (2) Readiness-
  > Ableitung entspricht der geschlossenen Statusmenge der Spec Rev. 2 und erfindet
  > keine redaktionellen Felder; (3) Generator ist read-only (nur SELECT);
  > (4) `review:quality` nutzt `lib/reviews/content-quality.ts` und NICHT
  > `scripts/quality-exact.mjs`; (5) Vertrag/Guard/Inventar konsistent (36/1/35);
  > (6) `npm run ci` + `npm run build` lokal grün.

- [ ] **Step 3: Review dokumentieren + Merge + Deploy prüfen**

```bash
gh pr review <PR-NR> --approve --body "Independent review (Opus): SHIP. Range-Diff sauber, Readiness-Snapshot spec-konform, Gates lokal grün."
gh pr merge <PR-NR> --squash
gh run list --workflow deploy.yml --limit 1 --json conclusion
```

Erwartung: MERGED, Deploy `success`. Branch `feat/broker-v2-standard` NICHT löschen
(Basis für den `--onto`-Rebase in Task 9).

---

### Task 9: Pilot-Branch — Rebase, Regeneration, Gates

**Files:**
- Worktree: `.worktrees/editorial-merge` (existiert)
- Modify: `docs/reviews/broker-v2-inventory.json` (regeneriert, 36/3/33)
- Modify: `docs/reviews/broker-v2-readiness.yml` (regeneriert)
- Modify: `e2e/review-cockpit-regression.spec.ts` (gated Evidence-Ausnahme entfernen)

- [ ] **Step 1: Rebase — nur die eigenen ~9 Commits (+2 Spec/Plan-Commits) umhängen**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/editorial-merge
git fetch origin
git rebase --onto origin/main feat/broker-v2-standard feat/charles-schwab-v2-pilot
```

Konflikte: Inventar-JSON → nach dem Rebase ohnehin regenerieren (Step 2), im
Konfliktfall `--theirs`-Fassung nehmen und weiterziehen.

- [ ] **Step 2: Inventar + Readiness regenerieren**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/editorial-merge
npm run inventory:reviews
node scripts/inventory-broker-reviews.mjs --check
npm run readiness:reviews
```

Erwartung: Inventar-Totale **36/3/33** (eToro, Schwab, Fidelity), `--check` grün;
Readiness mit `ready` für die drei V2-Dateien.

- [ ] **Step 3: Quality-Gates für Schwab und Fidelity**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/editorial-merge
npm run review:quality -- content/us/trading/charles-schwab-review.mdx content/us/trading/fidelity-review.mdx content/us/trading/etoro-review.mdx
npm run review:claims -- content/us/trading/charles-schwab-review.mdx content/us/trading/fidelity-review.mdx
npm run check:evidence
```

Erwartung: alle drei Kommandos Exit 0, jede Datei `score >= 90`.
Scheitert eine Datei am Score: Inhalt nachbessern (Implementer), NICHT den
Schwellwert senken.

- [ ] **Step 4: Gated e2e-Ausnahme entfernen** — in
  `e2e/review-cockpit-regression.spec.ts` die als „gated auf PR #105" markierte
  Evidence-Ausnahme suchen (`grep -n "105\|evidence" e2e/review-cockpit-regression.spec.ts`)
  und den Gate-Zweig entfernen, sodass der Spec die Evidence-Regel wieder voll prüft.
  Danach gegen einen Prod-Build laufen lassen:

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/editorial-merge
npm run build && npx next start -p 3013 &
BASE_URL=http://localhost:3013 PLAYWRIGHT_BASE_URL=http://localhost:3013 npx playwright test e2e/review-cockpit-regression.spec.ts
kill %1
```

Erwartung: alle Tests PASS (JS aktiviert beachten — die globale Playwright-Config
setzt `javaScriptEnabled: false`; der Spec bringt sein eigenes `test.use` mit).

- [ ] **Step 5: Vorher/Nachher-Metriktabelle erzeugen** (Pflicht laut Spec-Gate 7) —
  alte Fassungen aus der main-Historie ziehen und beide Runner darauf anwenden:

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/editorial-merge
SCRATCH=/private/tmp/claude-501/-Users-christianb--Websites-smartfinpro-com/5f9901e1-4762-4c21-a851-5133dbb9bb98/scratchpad
git show $(git log origin/main --format=%H -- content/us/trading/charles-schwab-review.mdx | tail -1):content/us/trading/charles-schwab-review.mdx > $SCRATCH/schwab-v1.mdx 2>/dev/null || git show origin/main~20:content/us/trading/charles-schwab-review.mdx > $SCRATCH/schwab-v1.mdx
npm run review:quality -- $SCRATCH/schwab-v1.mdx content/us/trading/charles-schwab-review.mdx || true
```

Analog für Fidelity. Aus den Ausgaben die Tabelle bauen (Spalten: Datei · Wörter
vorher/nachher · Score vorher/nachher · H2-Sektionen vorher/nachher · entfernte
Claim-Sektionen · essentialFacts mit Quelle) und in den PR-Text übernehmen.
Wichtig: die Vorher-Fassung ist die V1 von `origin/main` VOR dem Squash von #103/#105 —
wenn `git log origin/main -- <datei>` nur den Squash-Commit liefert, die Fassung aus
`fix/editorial-integrity` ziehen (`git show fix/editorial-integrity:content/...`).

- [ ] **Step 6: Volle Gates + Commit**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/editorial-merge
npm run ci && npm run build
git status --short   # unit-latest.json NICHT stagen
git add docs/reviews/broker-v2-inventory.json docs/reviews/broker-v2-readiness.yml e2e/review-cockpit-regression.spec.ts
git commit -m "chore(reviews): regenerate inventory+readiness after rebase, un-gate evidence e2e"
```

---

### Task 10: Pilot-PR — Review, Merge, Abschluss

- [ ] **Step 1: Push + PR (Metriktabelle aus Task 9 Step 5 in den Body)**

```bash
cd /Users/christianb./Websites/smartfinpro.com/.worktrees/editorial-merge
git push --force-with-lease origin feat/charles-schwab-v2-pilot
gh pr create --base main --head feat/charles-schwab-v2-pilot \
  --title "content(reviews): Charles Schwab + Fidelity auf Broker-V2" \
  --body "<Stufe 4 des Phase-0-Stacks + Metriktabelle Schwab/Fidelity + Gate-Ergebnisse>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 2: Reviewer-Session (Opus) dispatchen** — Charter:

  > Unabhängiges Review des Pilot-PRs (fachlich!). Arbeitsverzeichnis
  > `.worktrees/editorial-merge`. Schwerpunkte: (1) Schwab-/Fidelity-Fakten gegen die
  > `essentialFacts[].sourceHref`-Quellen stichproben (mind. 3 Fakten je Review real
  > gegenprüfen); (2) beide erfüllen den Publikationsvertrag (`npm run check:review-v2`);
  > (3) Score >= 90 über `review:quality`, keine forbidden claims über `review:claims`;
  > (4) Inventar 36/3/33 + Readiness konsistent; (5) Range-Diff enthält nur
  > Pilot-Commits; (6) `npm run ci` + `npm run build` grün; (7) un-gated e2e grün
  > gegen Prod-Build.

- [ ] **Step 3: Review dokumentieren + Merge + Deploy prüfen**

```bash
gh pr review <PR-NR> --approve --body "Independent review (Opus): SHIP. Fakten-Stichproben gegen Quellen ok, Vertrag+Gates grün, Metriktabelle plausibel."
gh pr merge <PR-NR> --squash --delete-branch
gh run list --workflow deploy.yml --limit 1 --json conclusion
```

- [ ] **Step 4: Live-Verifikation**

```bash
curl -s "https://smartfinpro.com/us/trading/charles-schwab-review/?cachebust=$(date +%s)" | grep -c "SectionVerdict\|id=\"fees\"" 
curl -s -o /dev/null -w '%{http_code}' "https://smartfinpro.com/us/trading/fidelity-review/?cachebust=$(date +%s)"
```

Erwartung: Schwab liefert die V2-Sektionsanker im HTML (Zähler > 0), Fidelity HTTP 200.

- [ ] **Step 5: Aufräumen + Statusmeldung**

```bash
cd /Users/christianb./Websites/smartfinpro.com
git worktree remove .worktrees/pr-105-evidence
git branch -d feat/broker-v2-standard 2>/dev/null || true
```

`fix/editorial-integrity` und den Worktree `/private/tmp/sfp-editorial-integrity` erst
nach User-Bestätigung entfernen. Abschlussmeldung an den User: Phase 0 komplett,
Phase 1 (Skills + Kalibrierung) kann als eigener Plan starten.

---

## Self-Review-Ergebnis (beim Planschreiben ausgeführt)

- Spec-Abdeckung Phase 0: Merge-Reihenfolge #103→#105→Standard→Pilot ✓ (Tasks 1/2/8/10),
  Readiness-Schema+Generator auf Standard-Branch ✓ (Tasks 4/5), grünes Inventar je
  Branch-Stand ✓ (Tasks 7/9), Schwab/Fidelity-Gates ✓ (Task 9), ausführbare
  Score-/Claims-Gates als Vorleistung für `/v2-verify` ✓ (Task 6).
- Squash-Merges + `rebase --onto`: konsistent in Tasks 3 und 9; Basis-Branches werden
  erst nach ihrer letzten Verwendung gelöscht (Task 10 Step 5).
- Bekannte Unschärfen, bewusst als Laufzeit-Verifikation formuliert: exakter
  Score-Property-Name im `ContentQuality`-Interface (Task 6 Step 1 Hinweis),
  tsx-`--env-file`-Durchreichung (Task 5 Step 3 Fallback), Fundort der gated
  e2e-Ausnahme (Task 9 Step 4 grep).
