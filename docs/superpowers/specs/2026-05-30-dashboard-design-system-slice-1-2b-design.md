# Dashboard Design-System — Slice 1.2b (Content & SEO) Design Spec

> **Sub-Projekt 1 von Increment 3 · Slice 1.2b** — Rollout der Primitives auf die Sidebar-Gruppe **Content & SEO**.
> **Datum:** 2026-05-30 · **Status:** Spec zur Review · **Branch:** `codex/dashboard-sp1-slice-1-2`
> **PR später:** stacked gegen `feat/dashboard-phase2b-inc2` (NICHT `main`).
> **Prozess (verbindlich):** lokal bauen → localhost visuell + funktional testen → Abnahme → erst nach Freigabe Push/Merge/Deploy. Kein Deploy/Merge in diesem Slice.

---

## 1. Ziel von Slice 1.2b

Die in 1.1/1.2a etablierten Primitives (`PageHeader`, `StatCard`, `SectionCard`, `ActionButton`, `EmptyState`, `FilterBar`) auf die **Content-&-SEO**-Seiten ausrollen. Schwerpunkt: handgebaute Header → `PageHeader` mit Violett→Navy-Normalisierung; wo vorhanden, Card-/Stat-/Empty-Muster konsolidieren. Reine Migration/Konsolidierung — **keine** neuen Features, **keine** Primitive-API-Erweiterung ohne guten Grund.

---

## 2. Exakte Seitenliste im Scope (6 Seiten)

| Seite | Datei | Ist-Befund (Scan) |
|---|---|---|
| Content Hub | `app/(dashboard)/dashboard/content/hub/page.tsx` | Header: `bg-violet-50` Icon-Box (FileSearch); **8 Card-Blöcke**; 1 Empty-Zustand → **schwerste** Migration |
| Auto-Genesis | `app/(dashboard)/dashboard/content/genesis/page.tsx` | Header: `bg-violet-50` Icon-Box (Rocket); 0 Card-Blöcke → leicht |
| Approval Queue | `app/(dashboard)/dashboard/content/planning/page.tsx` | Header: `bg-violet-50` Icon-Box (Sparkles); 0 Card-Blöcke → leicht |
| Competitor Radar | `app/(dashboard)/dashboard/competitors/page.tsx` | Header: `text-violet-500` (Radar) → leicht |
| Keyword Gaps | `app/(dashboard)/dashboard/competitors/gaps/page.tsx` | Header: `text-violet-500` (Crosshair) → leicht |
| Backlink Automation | `app/(dashboard)/dashboard/backlinks/page.tsx` | 1 Stat-Grid; 2 Empty-Zustände; ~3 Violett-Refs → mittel |

**Out of scope / nicht anfassen:** `/dashboard` (Command Center, separater Sonderfall), bereits migrierte 1.1/1.2a-Seiten (`revenue`, `ranking`, `analytics`, `heatmap`, `optimize`).

---

## 3. Erwartete Primitives pro Seite

| Seite | Erwartete Primitives |
|---|---|
| `content/hub` | `PageHeader` (Icon Violett→Navy) + mehrere `SectionCard` (~8 Blöcke) + ggf. `EmptyState`. Violett **nur** in Header/Card-Header normalisieren; Body-/Feature-Akzente belassen. |
| `content/genesis` | `PageHeader` (Icon Violett→Navy). Rest komponentengetrieben — nicht anfassen. |
| `content/planning` | `PageHeader` (Icon Violett→Navy); ggf. `EmptyState` für leere Approval-Queue, falls dort handgebaut. |
| `competitors` | `PageHeader` (Icon Violett→Navy). |
| `competitors/gaps` | `PageHeader` (Icon Violett→Navy). |
| `backlinks` | `PageHeader`; `StatCard` (1 Stat-Grid, Violett→Navy nur bei klaren Ausreißern); ggf. `EmptyState` (2 leere Zustände, falls handgebaut). |

`ActionButton`/`FilterBar` nur, falls eine Seite bereits einen Inline-Violett-Button bzw. Filter-Controls im Header hat (kein neuer Filter/Button wird eingeführt). Der Scan zeigt **keine** Inline-`!bg-violet`-Buttons in dieser Gruppe → `ActionButton` voraussichtlich nicht nötig.

---

## 4. Non-Goals

- Keine Primitive-API-Erweiterung ohne guten Grund.
- Keine Saved Views (Sub-Projekt 2), kein Cohort/LTV (Sub-Projekt 3).
- Keine Voll-Normalisierung von Widget-/Chart-Farben; keine Chart-Paletten; keine feature-spezifischen Body-Akzente (nur Header + Shared Controls).
- `/dashboard` ausdrücklich out of scope.
- Keine erneute Änderung der 1.1/1.2a-Seiten.
- Kein Fix vorbestehender Bugs außerhalb des Rollouts.

---

## 5. Rollout-/Verifikationsstrategie (localhost)

**Pro Seite:** handgebauten Header → `PageHeader`; Card-/Stat-/Empty-Muster → Primitive; Violett in Header/Shared-Control → Brand-Navy (bzw. passender Tone); ungenutzte Imports entfernen.

**Verifikation (wie 1.1/1.2a):**
- `npx tsc --noEmit` + `npx eslint <geänderte Seiten>` (keine unused imports).
- `npm run check:imports`.
- `npm run build` einmal am (Teil-)Slice-Ende.
- `npm run test:dashboard-smoke` → Abgleich mit den **3 vorbestehenden** Failures (`:65`, `:114`, `:191`); keine NEUE Regression.
- Grep-Guards: kein `violet|purple|from-violet|bg-violet` mehr in Headern/Shared-Controls der migrierten Seiten; kein neuer Hex im JSX.
- localhost visuell auf konfiguriertem Dashboard-Dev-Port (`next dev` wählt 3000/nächster freier Port; Auth lokal via `DASHBOARD_AUTH_DISABLED=true`; Live-Daten brauchen `SUPABASE_SERVICE_ROLE_KEY`).
- Abnahme-Vorlage je Teilslice mit Routenliste + Vorher/Nachher der Header-Icons.

---

## 6. Risikoliste (kurz)

- **`content/hub`** ist die mit Abstand größte Migration (≈8 Card-Blöcke, viele Violett-Refs) → höchstes Diff-/Review-Risiko; Body-Violett könnte Feature-Akzent sein → im Zweifel belassen, nur Header/Card-Header normalisieren.
- **`backlinks`** hat 1 Stat-Grid + 2 Empty-Zustände → Tone-Mapping prüfen (nur Violett→Navy), Empty-Zustände nur migrieren, wenn sie handgebaut und nicht komponentengetrieben sind.
- **Gradient-Icon-Boxen** (wie schon bei heatmap) bei `hub`/`genesis`/`planning` ggf. `bg-violet-50`-Box → wird zu schlichtem Navy-Icon; bewusste, sichtbare Look-Änderung (= Normalisierungsziel).
- **Über-Normalisierung:** strikt auf Header + Shared Controls begrenzen.
- **Stacked-PR-Drift:** Branch basiert auf #17; bei Rebase von `feat/dashboard-phase2b-inc2` nachziehen.

---

## 7. Empfehlung zur Slice-Granularität

**2 Teilslices**, analog zum 1.2a-Muster (riskante/schwere Seite isolieren):
- **1.2b-1 — leichte Header-Rollouts (5 Seiten):** `genesis`, `planning`, `competitors`, `competitors/gaps`, `backlinks`. Überwiegend `PageHeader`-Swaps (Violett→Navy) + bei `backlinks` zusätzlich `StatCard`/`EmptyState`. Niedriges Risiko, schneller sichtbarer Hebel.
- **1.2b-2 — `content/hub` isoliert:** die schwere `SectionCard`-Konsolidierung (~8 Blöcke) als eigener, reviewbarer Stand.

Begründung: Der sichtbare Violett→Navy-Gewinn kommt risikoarm in 1.2b-1; der einzige churn-intensive Brocken (`content/hub`) bleibt isoliert und separat rückrollbar.
