# Dashboard Design-System — Slice 1.2a (Overview) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Roll the existing dashboard primitives onto the **Overview** sidebar group — migrate the two header-only pages (`heatmap`, `optimize`) to `PageHeader` with violet→navy normalization, and conservatively consolidate the Command Center's (`/dashboard`) local `card`-const blocks onto `SectionCard`.

**Architecture:** Reuse the Slice-1.1 primitives in `components/dashboard/ui/` unchanged. No primitive-API changes. No new features. Color normalization limited to page headers + shared controls.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, Tailwind v4, lucide-react, existing `components/dashboard/ui/*`.

**Branch:** `codex/dashboard-sp1-slice-1-2` · **PR later:** stacked against `feat/dashboard-phase2b-inc2` (NOT main).

**Process (binding):** lokal bauen → localhost visuell + funktional testen → Abnahme → erst nach Freigabe Push/Merge/Deploy. **Dieser Plan: keine Implementierung jetzt, kein Push, kein PR, kein Deploy.**

---

## Pages in Scope (Overview group, 3 pages)

| Page | File | Ist-Befund | Erwartete Primitives |
|---|---|---|---|
| CTA Heatmap | `app/(dashboard)/dashboard/analytics/heatmap/page.tsx` | Header: Violett-Gradient-Icon-Box + `text-xl` h1 | `PageHeader` (icon Flame, tone navy) |
| AI-Optimizer | `app/(dashboard)/dashboard/analytics/optimize/page.tsx` | Header: `bg-violet-50` Icon-Box + `text-violet-500` Brain + Inline-„AI-Powered"-Badge | `PageHeader` (icon Brain, tone navy); Badge → `actions` |
| Command Center | `app/(dashboard)/dashboard/page.tsx` | **Kein** h1/Header, **kein** Violett; lokale `card`-Konstante (~10 Blöcke, `rounded-lg`) | `SectionCard` (konservativ, nur saubere Header+Body-Blöcke) |

**Bereits in 1.1 migriert — NICHT anfassen:** `revenue`, `ranking`, `analytics`.

---

## Migration Order

1. **Task 1 — `heatmap`** (trivial, 1 PageHeader)
2. **Task 2 — `optimize`** (trivial, 1 PageHeader + Badge in actions)
3. **Task 3 — `/dashboard`** (isoliert, konservativ, riskanteste Seite — eigener Commit, eigener Verifikations-Guard)
4. **Task 4 — Slice-weite Verifikation**

Begründung der Reihenfolge: Die beiden trivialen, klar nutzbringenden (Violett→Navy) Header-Migrationen zuerst; das riskante Command Center isoliert am Ende, damit es separat reviewbar/rückrollbar ist.

---

### Task 1: Migrate `heatmap` to PageHeader

**Files:**
- Modify: `app/(dashboard)/dashboard/analytics/heatmap/page.tsx`

- [ ] **Step 1: Add import + replace header block**

Add import:
```tsx
import { PageHeader } from '@/components/dashboard/ui';
```

Replace the header block (lines 44–57, the `{/* Header */}` `<div>`):
```tsx
      {/* Header */}
      <PageHeader
        icon={Flame}
        title="CTA Click Heatmap"
        description={`Click density across all ${data.cells.length || 194} pages — find your conversion winners`}
      />
```
(Removes the `bg-gradient-to-br from-violet-500 to-indigo-600` icon box; Flame renders brand-navy. Heading standardizes to `text-2xl`.)

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/dashboard/analytics/heatmap/page.tsx"`
Expected: no errors; remove any now-unused import (none expected — `Flame` still used by PageHeader).

- [ ] **Step 3: Commit**
```bash
git add "app/(dashboard)/dashboard/analytics/heatmap/page.tsx"
git commit -m "refactor(dashboard): heatmap page uses PageHeader (violet icon → navy)"
```

---

### Task 2: Migrate `optimize` to PageHeader

**Files:**
- Modify: `app/(dashboard)/dashboard/analytics/optimize/page.tsx`

- [ ] **Step 1: Add import + replace header block**

Add import:
```tsx
import { PageHeader } from '@/components/dashboard/ui';
```

Replace the header block (lines 21–40). The cyan „AI-Powered" badge is a feature accent (keep its color) and moves into `actions` (right-aligned), since `PageHeader.title` is a plain string:
```tsx
      {/* Header */}
      <PageHeader
        icon={Brain}
        title="AI-Optimization Center"
        description="Periodische Performance-Analyse mit One-Click Content-Optimierungen"
        actions={
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-600 border border-cyan-200">
            <Zap className="h-3 w-3" />
            AI-Powered
          </span>
        }
      />
```
(Violet Brain icon → brand-navy via PageHeader default tone. Cyan badge unchanged in color.)

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/dashboard/analytics/optimize/page.tsx"`
Expected: no errors; `Zap` and `Brain` still used.

- [ ] **Step 3: Commit**
```bash
git add "app/(dashboard)/dashboard/analytics/optimize/page.tsx"
git commit -m "refactor(dashboard): optimize page uses PageHeader (violet icon → navy, badge in actions)"
```

---

### Task 3: Command Center (`/dashboard`) — conservative SectionCard consolidation

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Scope guard (read first):** This page has **no** page-title header and **no** violet drift — so there is NO PageHeader migration and NO color normalization here. The only applicable primitive is `SectionCard`, replacing the local `card` const blocks (`'bg-white border border-slate-200 rounded-lg shadow-sm'`) that follow the clean *header-row + body* pattern. **Do NOT** touch: `ExecutiveOverview`, `GeoIntelligence`, the `ActionItemRow` helper, the Geo/Market hero blocks with bespoke icon-badge layout, or the `Key Metrics` 4-metric grid (not a titled card section). **Do NOT** attempt to fix the mobile-scroll smoke failure here.

- [ ] **Step 1: Add import**
```tsx
import { SectionCard } from '@/components/dashboard/ui';
```

- [ ] **Step 2: Convert the clean `card`-const blocks to `SectionCard`**

Apply this transformation rule to each block of the shape
`<div className={card}> <div className="px-6 py-4 border-b…"><h3…>TITLE</h3></div> <div className="p-6"|"p-4">BODY</div> </div>`
→
`<SectionCard title="TITLE" contentClassName="p-6"|"p-4">BODY</SectionCard>`

Blocks to convert (by current title), with notes:
1. **Click Activity** (lines ~455–466) → `<SectionCard title="Click Activity" className="lg:col-span-2">…</SectionCard>` (keep the `lg:col-span-2` on the SectionCard).
2. **Conversion Funnel** (lines ~469–486) → `<SectionCard title="Conversion Funnel">…</SectionCard>`.
3. **Deploy History** (lines ~432–450) → `<SectionCard title="Deploy History" actions={<>…last-deploy badge…</>}>…</SectionCard>` — move the existing `deployStats.lastDeploy` badge into `actions` (unchanged markup/colors), body `contentClassName="p-4"`.
4. **Market Opportunities** (lines ~514–522) → `<SectionCard title="Market Opportunities" description="Actionable insights for regional optimization" contentClassName="p-4">…</SectionCard>`.
5. **Top Links / Top Pages / Devices** (lines ~528–567) → three `<SectionCard title="…">…</SectionCard>`.
6. **Recent Activity** (lines ~570–582) → `<SectionCard title="Recent Activity" actions={<span className="w-2 h-2 rounded-full bg-green-500" />}>…</SectionCard>`.
7. **Optimization Opportunities** (lines ~588–600) → `<SectionCard title="Optimization Opportunities" description="Articles with high engagement but low CTR">…</SectionCard>`.
8. **Key Metrics** (lines ~603–641) → `<SectionCard title="Key Metrics">…the grid-cols-2 metrics block…</SectionCard>` (keep the inner metric grid exactly as-is).
9. **Scroll Depth by Article** (lines ~645–659) → `<SectionCard title="Scroll Depth by Article">…</SectionCard>`.
10. **Action Items** (lines ~371–382) → `<SectionCard title="Action Items" contentClassName="p-4 space-y-2">{stats.actionItems.map(...)}</SectionCard>` (keep the `stats.actionItems.length > 0` guard wrapping the SectionCard).

**Important:** SectionCard uses `.dashboard-card` (radius `0.75rem`/`rounded-xl`, hover shadow) vs the old `card` const (`rounded-lg`, static `shadow-sm`). This is a minor, intentional consistency change — confirm visually it reads as the same card family.

- [ ] **Step 3: Remove the now-unused local `card` const**

Delete `const card = 'bg-white border border-slate-200 rounded-lg shadow-sm';` (line ~195) ONLY if no remaining usages — verify first:
Run: `grep -n "\${card}\|className={card}\|className={\`\${card}" "app/(dashboard)/dashboard/page.tsx"`
Expected after migration: no matches → safe to delete. If any block was intentionally left unmigrated and still uses `card`, KEEP the const.

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/dashboard/page.tsx"`
Expected: no errors; remove any now-unused imports.

- [ ] **Step 5: Commit**
```bash
git add "app/(dashboard)/dashboard/page.tsx"
git commit -m "refactor(dashboard): command center cards use SectionCard primitive (no color/header change)"
```

---

### Task 4: Slice-wide verification

**Files:** none (verification only)

- [ ] **Step 1: Build-time checks**

Run: `npm run check:imports && npx tsc --noEmit && npm run test`
Expected: all PASS (293 unit tests green — Task 1.1's tone test included).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Grep guards**

Run:
```bash
grep -nE "violet|purple|from-violet|to-indigo" "app/(dashboard)/dashboard/analytics/heatmap/page.tsx" "app/(dashboard)/dashboard/analytics/optimize/page.tsx" || echo "OK: no violet on heatmap/optimize"
```
Expected: no violet/indigo on heatmap/optimize headers. (`/dashboard` had none to begin with.)

- [ ] **Step 4: dashboard-smoke — demarcation from pre-existing failures**

Run: `npm run test:dashboard-smoke`
Expected: **exactly the same 3 pre-existing failures** as the Slice-1.1 baseline, NO new ones:
- `:65` auth flow → shows login form (route `/dashboard`)
- `:114` live feed message (live-stats logic, untouched)
- `:191` no horizontal scroll on mobile (route `/dashboard`, bodyWidth ~398 > 391)

**Critical /dashboard guard:** Task 3 edits `/dashboard`, which carries failure `:191`. Verify the mobile `bodyWidth` did **not increase** vs baseline (~398). If it grew, the SectionCard migration introduced new overflow → STOP and investigate (do not "fix" the pre-existing 398 here; only ensure no regression). These 3 failures are **pre-existing and out of scope** (confirmed in Slice 1.1 against base `4d81677`); 1.2a must neither fix nor worsen them.

- [ ] **Step 5: localhost visual**

Start `next dev` (configured dashboard dev port — `next dev` picks 3000 or next free port; auth bypass via `DASHBOARD_AUTH_DISABLED=true`; live data needs `SUPABASE_SERVICE_ROLE_KEY`). Verify:
- `/dashboard/analytics/heatmap` — Flame icon **navy** (was violet gradient), heading `text-2xl`.
- `/dashboard/analytics/optimize` — Brain icon **navy** (was violet), „AI-Powered" badge right-aligned in header.
- `/dashboard` — all card sections render with identical content; cards read as the same family (rounded-xl); no layout break; mobile (390px) no worse than baseline.

- [ ] **Step 6: Request Abnahme** (no push/PR/deploy).

---

## localhost Test Matrix (Slice 1.2a)

| Route | Visual | Functional |
|---|---|---|
| `/dashboard/analytics/heatmap` | Flame-Icon **navy**, Heading `text-2xl` | RevenueForecast + Heatmap laden, keine Console-Errors |
| `/dashboard/analytics/optimize` | Brain-Icon **navy**, „AI-Powered"-Badge rechts | A/B Live-View + Optimization-Chat funktionieren |
| `/dashboard` | Card-Sektionen einheitlich (SectionCard), Inhalt unverändert | TimeRange-Wechsel unverändert; Mobile-Scroll nicht schlechter als Baseline |

---

## Self-Review notes
- **Spec coverage:** Overview-Gruppe vollständig (heatmap, optimize, /dashboard). Content & SEO bewusst in 1.2b (separater Plan).
- **Scope discipline:** /dashboard ohne Violett/Header → nur SectionCard, kein Color/Header-Change; Hero/Metrics/Geo unangetastet.
- **Pre-existing failures:** explizit demarkiert in Task 4 Step 4 — weder fixen noch verschlimmern.
- **No API changes:** alle Primitives 1:1 aus 1.1.
```
