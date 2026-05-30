# Dashboard Design-System — Slice 1.2b-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the clean Content-&-SEO header pages to `PageHeader` with violet→navy normalization: `genesis`, `planning`, `competitors`, `competitors/gaps`. (`backlinks` recommended **separate** — see §Backlinks.)

**Architecture:** Reuse Slice-1.1 primitives in `components/dashboard/ui/` unchanged. No primitive-API changes, no new features. Color normalization limited to page headers + shared controls.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, Tailwind v4, lucide-react, existing `components/dashboard/ui/*`.

**Branch:** `codex/dashboard-sp1-slice-1-2` · **PR later:** stacked against `feat/dashboard-phase2b-inc2` (NOT main).

**Process (binding):** lokal bauen → localhost testen → Abnahme → erst nach Freigabe Push/Merge/Deploy. **Dieser Plan: keine Implementierung jetzt, kein Push, kein PR, kein Deploy.**

---

## Pages in Scope (4 clean pages)

| Page | File | Ist | Erwartete Primitives |
|---|---|---|---|
| Competitor Radar | `app/(dashboard)/dashboard/competitors/page.tsx` | `text-violet-500` Radar, `text-slate-800` h1 | `PageHeader` (Radar, navy) |
| Keyword Gaps | `app/(dashboard)/dashboard/competitors/gaps/page.tsx` | `text-violet-500` Crosshair, `text-slate-800` h1 | `PageHeader` (Crosshair, navy) |
| Auto-Genesis | `app/(dashboard)/dashboard/content/genesis/page.tsx` | `bg-violet-50` Icon-Box (Rocket) | `PageHeader` (Rocket, navy) |
| Approval Queue | `app/(dashboard)/dashboard/content/planning/page.tsx` | `bg-violet-50` Icon-Box (Sparkles) + Composite-Header (Datum-Badge, AffiliateScanButton, Chancen-Badge) | `PageHeader` (Sparkles, navy) + `actions` |

**Out of scope:** `content/hub` (schweres ~8-Card-Schwergewicht, separater Follow-up), `backlinks` (siehe §Backlinks — Empfehlung separat), alle 1.1/1.2a-Seiten, `/dashboard`.

---

## Migration Order

1. **Task 1 — `competitors`** (trivial)
2. **Task 2 — `competitors/gaps`** (trivial, identisches Muster)
3. **Task 3 — `genesis`** (Icon-Box → PageHeader)
4. **Task 4 — `planning`** (Composite-Header → PageHeader + actions)
5. **Task 5 — Verifikation**

Reihenfolge: erst die zwei trivialen Zwillingsseiten, dann genesis, dann das komplexere planning, dann slice-weite Verifikation.

---

### Task 1: `competitors` → PageHeader

**Files:** Modify `app/(dashboard)/dashboard/competitors/page.tsx`

- [ ] **Step 1: Import + Header ersetzen**

Add import:
```tsx
import { PageHeader } from '@/components/dashboard/ui';
```
Replace the header block (lines 13–21):
```tsx
      <PageHeader
        icon={Radar}
        title="Competitor Radar"
        description="SERP Intelligence & Competitor Tracking — CPS-basierte Keyword-Analyse"
      />
```

- [ ] **Step 2: Typecheck + Lint**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/dashboard/competitors/page.tsx"`
Expected: keine Fehler; `Radar` weiter genutzt.

- [ ] **Step 3: Commit**
```bash
git add "app/(dashboard)/dashboard/competitors/page.tsx"
git commit -m "refactor(dashboard): competitors page uses PageHeader (violet icon → navy)"
```

---

### Task 2: `competitors/gaps` → PageHeader

**Files:** Modify `app/(dashboard)/dashboard/competitors/gaps/page.tsx`

- [ ] **Step 1: Import + Header ersetzen**

Add import:
```tsx
import { PageHeader } from '@/components/dashboard/ui';
```
Replace the header block (lines 13–21):
```tsx
      <PageHeader
        icon={Crosshair}
        title="Keyword Gap Analysis"
        description="Competitor-vs-SmartFinPro Keyword-Vergleich — Finde fehlende Content-Opportunities"
      />
```

- [ ] **Step 2: Typecheck + Lint**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/dashboard/competitors/gaps/page.tsx"`
Expected: keine Fehler; `Crosshair` weiter genutzt.

- [ ] **Step 3: Commit**
```bash
git add "app/(dashboard)/dashboard/competitors/gaps/page.tsx"
git commit -m "refactor(dashboard): keyword-gaps page uses PageHeader (violet icon → navy)"
```

---

### Task 3: `genesis` → PageHeader

**Files:** Modify `app/(dashboard)/dashboard/content/genesis/page.tsx`

- [ ] **Step 1: Import + Header ersetzen**

Add import (alongside existing imports):
```tsx
import { PageHeader } from '@/components/dashboard/ui';
```
Replace the header block (lines 66–79, the `{/* Header */}` `<div>`):
```tsx
      {/* Header */}
      <PageHeader
        icon={Rocket}
        title="Auto-Genesis Hub"
        description="Research → Generate → Media → Launch — autonomous SEO asset pipeline"
      />
```
(`bg-violet-50` Icon-Box + `text-violet-500` Rocket → schlichtes Navy-Icon via PageHeader.)

- [ ] **Step 2: Typecheck + Lint**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/dashboard/content/genesis/page.tsx"`
Expected: keine Fehler; `Rocket` weiter genutzt; ggf. unused imports entfernen.

- [ ] **Step 3: Commit**
```bash
git add "app/(dashboard)/dashboard/content/genesis/page.tsx"
git commit -m "refactor(dashboard): genesis page uses PageHeader (violet icon → navy)"
```

---

### Task 4: `planning` → PageHeader + actions

**Files:** Modify `app/(dashboard)/dashboard/content/planning/page.tsx`

**Scope-Hinweis:** Nur der Header wird migriert. Die Violett-**Instruction-Hint-Box** im Body (`bg-violet-50 border-violet-200`, ~Zeile 60) ist ein Body-Akzent und bleibt in diesem Slice **unangetastet** (Non-Goal: keine Body-Normalisierung). Als bekannter Rest-Drift notiert.

- [ ] **Step 1: Import + Header ersetzen**

Add import:
```tsx
import { PageHeader } from '@/components/dashboard/ui';
```
Replace the header `<div>` block (lines 25–57) — Titel + Beschreibung in `PageHeader`, das `ml-auto`-Block (AffiliateScanButton + Chancen-Badge) plus das Datum-Badge wandern in `actions`:
```tsx
      {/* Header */}
      <PageHeader
        icon={Sparkles}
        title="Executive Approval"
        description="AI-curated content opportunities"
        actions={
          <>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <AffiliateScanButton />
            {plans.length > 0 && (
              <div className="px-3 py-1.5 rounded-full flex items-center gap-2 bg-emerald-50 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {plans.length} {plans.length === 1 ? 'Chance' : 'Chancen'}
                </span>
              </div>
            )}
          </>
        }
      />

      {/* Instruction hint — unverändert (Body-Akzent, out of scope) */}
      <div className="mt-4 p-3 rounded-xl flex items-center gap-3 bg-violet-50 border border-violet-200">
        <span className="text-base">&#x1F449;</span>
        <p className="text-xs text-slate-600">
          <span className="text-emerald-600 font-semibold">Swipe rechts</span> oder klicke{' '}
          <span className="text-emerald-600">Approve</span> um die Auto-Genesis Pipeline zu starten.{' '}
          <span className="text-red-500 font-semibold">Swipe links</span> oder klicke{' '}
          <span className="text-red-500">Reject</span> um das Keyword zu archivieren.
        </p>
      </div>
```
**Wichtig:** Das vorherige Markup hatte den Instruction-Hint INNERHALB des äußeren Header-`<div>`. Beim Ersetzen darauf achten, dass der Hint als eigenständiges Geschwister-Element erhalten bleibt (wie oben) und der äußere `<div>`-Wrapper sauber geschlossen wird.

- [ ] **Step 2: Typecheck + Lint**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/dashboard/content/planning/page.tsx"`
Expected: keine Fehler; `Sparkles`, `Calendar`, `AffiliateScanButton` weiter genutzt.

- [ ] **Step 3: Commit**
```bash
git add "app/(dashboard)/dashboard/content/planning/page.tsx"
git commit -m "refactor(dashboard): planning page uses PageHeader + actions (violet icon → navy)"
```

---

### Task 5: Slice-wide verification

**Files:** none (verification only)

- [ ] **Step 1: Build-time checks** — `npm run check:imports && npx tsc --noEmit && npm run test` → alle PASS (293 Unit-Tests).
- [ ] **Step 2: Production build** — `npm run build` → erfolgreich.
- [ ] **Step 3: Violett-Guard (Header):**
```bash
grep -nE "text-violet-500|bg-violet-50|from-violet" "app/(dashboard)/dashboard/competitors/page.tsx" "app/(dashboard)/dashboard/competitors/gaps/page.tsx" "app/(dashboard)/dashboard/content/genesis/page.tsx" "app/(dashboard)/dashboard/content/planning/page.tsx" || echo "OK: kein Header-Violett mehr"
```
Erwartet: nur noch der bewusst belassene `bg-violet-50 border-violet-200` Instruction-Hint in `planning` (Body) taucht ggf. auf — alle Header-Icons sind clean.
- [ ] **Step 4: dashboard-smoke** — `npm run test:dashboard-smoke` → **exakt dieselben 3 vorbestehenden** Failures (`:65`, `:114`, `:191`), keine neuen. (Diese Routen sind nicht im Scope; Demarkation wie in 1.1/1.2a.)
- [ ] **Step 5: localhost visuell** — konfigurierter Dashboard-Dev-Port (`next dev`; Auth via `DASHBOARD_AUTH_DISABLED=true`; Live-Daten brauchen `SUPABASE_SERVICE_ROLE_KEY`):
  - `/dashboard/competitors` — Radar-Icon **navy**
  - `/dashboard/competitors/gaps` — Crosshair-Icon **navy**
  - `/dashboard/content/genesis` — Rocket-Icon **navy** (keine Violett-Box)
  - `/dashboard/content/planning` — Sparkles-Icon **navy**; Datum/Scan/Chancen-Badge rechts in `actions`
- [ ] **Step 6: Abnahme anfordern** (kein Push/PR/Deploy).

---

## localhost Test Matrix (Slice 1.2b-1)

| Route | Visual | Functional |
|---|---|---|
| `/dashboard/competitors` | Radar-Icon **navy**, Heading `text-2xl text-slate-900` | CompetitorRadar lädt, keine Console-Errors |
| `/dashboard/competitors/gaps` | Crosshair-Icon **navy** | KeywordGapAnalysis lädt |
| `/dashboard/content/genesis` | Rocket-Icon **navy**, keine Violett-Box | Genesis-Pipeline-UI lädt; Placeholder-Warnung (falls vorhanden) unverändert |
| `/dashboard/content/planning` | Sparkles **navy**; Datum + Scan-Button + Chancen-Badge rechtsbündig | AffiliateScanButton funktioniert; Approval-Cards laden; Swipe-Hint sichtbar |

---

## Backlinks — Empfehlung: separat ziehen (nicht in diesem Plan ausgeführt)

`backlinks` passt **nicht** ins „PageHeader + kleines Aufräumen"-Muster:
- **Header bereits Navy** (`<Link2 style={{color:'var(--sfp-navy)'}}/>`) → kein PageHeader-Gewinn außer `text-slate-800→900`.
- **5 KPI-Karten** nutzen ein anderes Layout (Icon+Label oben, große Zahl unten) als `StatCard` (Icon-Box rechts) → Migration = **Redesign**, kein 1:1.
- **Card-Sektionen** haben Navy→Gold-Gradient-Bars → `SectionCard` würde diese Stilistik verlieren.
- Einziger echter Drift: die **eine** „Manual Queue"-KPI (`Clock text-violet-500` + `text-violet-600` Wert).

**Empfohlene Behandlung (separater Mini-Pass):** entweder (a) **nur** die „Manual Queue"-KPI Violett→Navy normalisieren (2-Zeilen-Farbtweak, ohne StatCard/SectionCard), oder (b) gebündelt mit dem `content/hub`-Follow-up als „Backlinks/Hub-Konsolidierung". **Nicht** in 1.2b-1, um Redesign-Churn zu vermeiden.

---

## Self-Review notes
- **Spec coverage:** 4 saubere Header-Seiten migriert; `backlinks` begründet separat; `content/hub` weiter isoliert.
- **Scope discipline:** nur Header + actions; `planning` Body-Violett bewusst belassen; keine StatCard/SectionCard-Redesigns.
- **Pre-existing failures:** demarkiert (Task 5 Step 4).
- **No API changes:** Primitives 1:1 aus 1.1.
