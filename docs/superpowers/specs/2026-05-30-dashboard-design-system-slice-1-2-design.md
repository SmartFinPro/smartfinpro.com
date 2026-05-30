# Dashboard Design-System — Slice 1.2 Design Spec

> **Sub-Projekt 1 von Increment 3 · Slice 1.2** (Rollout der in 1.1 etablierten Primitives)
> **Datum:** 2026-05-30 · **Status:** Spec zur Review · **Branch:** `codex/dashboard-sp1-slice-1-2`
> **PR später:** stacked gegen `feat/dashboard-phase2b-inc2` (NICHT gegen `main`).
> **Prozess (verbindlich):** lokal bauen → localhost visuell + funktional testen → Abnahme → erst nach Freigabe Merge/Deploy. Kein Deploy, kein Merge in diesem Slice.

---

## 1. Ziel von Slice 1.2

Rollout der bestehenden Primitives (`PageHeader`, `StatCard`, `SectionCard`, `ActionButton`, `EmptyState`, `FilterBar`) auf die Sidebar-Gruppen **Overview** und **Content & SEO**. Reine Migration/Konsolidierung: handgebaute Header/Cards/Buttons auf die Primitives ziehen und dabei die klaren Violett-Ausreißer in Header und Shared Controls auf Brand-Navy normalisieren. **Keine neuen Features, keine Primitive-API-Erweiterung ohne guten Grund.**

---

## 2. Exakte Seitenliste im Scope

Bereits in 1.1 migriert (NICHT erneut anfassen): `revenue`, `ranking`, `analytics`.

**Gruppe Overview (3 Seiten):**
- `app/(dashboard)/dashboard/page.tsx` — Command Center
- `app/(dashboard)/dashboard/analytics/heatmap/page.tsx` — CTA Heatmap
- `app/(dashboard)/dashboard/analytics/optimize/page.tsx` — AI-Optimizer

**Gruppe Content & SEO (6 Seiten):**
- `app/(dashboard)/dashboard/content/hub/page.tsx` — Content Hub *(schwerste Migration: ~8 Card-Blöcke, viele Violett-Refs)*
- `app/(dashboard)/dashboard/content/genesis/page.tsx` — Auto-Genesis
- `app/(dashboard)/dashboard/content/planning/page.tsx` — Approval Queue
- `app/(dashboard)/dashboard/competitors/page.tsx` — Competitor Radar
- `app/(dashboard)/dashboard/competitors/gaps/page.tsx` — Keyword Gaps
- `app/(dashboard)/dashboard/backlinks/page.tsx` — Backlink Automation

**Summe: 9 Seiten.**

---

## 3. Erwartete Primitives pro Seitentyp (Heuristik aus Ist-Scan)

| Seite | Erwartete Primitives |
|---|---|
| `dashboard` (Command Center) | `StatCard` (3 Stat-Grids), `SectionCard`; Header ggf. via `PageHeader` falls vorhandener Header-Block. **Sensibel** (siehe Risiken). |
| `analytics/heatmap` | `PageHeader` (Icon Violett→Navy) |
| `analytics/optimize` | `PageHeader` (Icon Violett→Navy), ggf. `SectionCard` |
| `content/hub` | `PageHeader` + mehrere `SectionCard` (~8 Card-Blöcke), ggf. `EmptyState`; Violett nur in Header/Card-Header normalisieren |
| `content/genesis` | `PageHeader`, ggf. `SectionCard` |
| `content/planning` | `PageHeader`, ggf. `SectionCard`/`EmptyState` (leere Queue) |
| `competitors` | `PageHeader` (Icon Violett→Navy), ggf. `SectionCard` |
| `competitors/gaps` | `PageHeader` (Icon Violett→Navy) |
| `backlinks` | `PageHeader`, `StatCard` (1 Stat-Grid), `SectionCard` |

`FilterBar` nur dort, wo eine Seite bereits Filter-Controls im Header hat (kein neuer Filter wird eingeführt). `ActionButton` nur, wo bereits ein Button/CTA existiert (Inline-Violett-Overrides ersetzen).

---

## 4. Non-Goals

- Keine Primitive-API-Erweiterung ohne guten Grund (wenn nötig: erst begründen, minimal halten).
- Keine Saved Views (Sub-Projekt 2).
- Kein Cohort/LTV (Sub-Projekt 3).
- Keine Voll-Normalisierung aller Widget-/Chart-Farben.
- Keine Chart-Paletten, keine feature-spezifischen Akzentfarben im Body (nur Header + Shared Controls normalisieren).
- Kein Fix vorbestehender Bugs außerhalb des Rollouts (z. B. `silo-filter-dropdown`-Hard-Push, `/dashboard` Mobile-Scroll) — separat.
- Keine erneute Änderung der 3 bereits migrierten 1.1-Seiten.

---

## 5. Rollout- / Verifikationsstrategie (localhost)

**Pro Seite:** handgebaute Header/Cards/Buttons → Primitive ersetzen; Violett in Header/Shared-Control → Brand-Navy (bzw. passender Brand-Tone); ungenutzte Imports entfernen.

**Verifikation (wie in 1.1):**
- `npx tsc --noEmit` + `npx eslint <geänderte Seiten>` (keine unused-imports).
- `npm run check:imports` (Client/Server-Boundary).
- `npm run build` einmal am Slice-Ende.
- `npm run test:dashboard-smoke` — gegen die bekannten 3 vorbestehenden Failures abgleichen (keine NEUE Regression).
- Grep-Guards: kein `violet|purple` mehr in Headern/Shared-Controls der migrierten Seiten; kein neuer Hex im JSX.
- localhost visuell auf dem konfigurierten Dashboard-Dev-Port (`next dev` wählt 3000 bzw. den nächsten freien Port — beim letzten Lauf 3002; nicht als fester Standard zu verstehen). Auth lokal via `DASHBOARD_AUTH_DISABLED=true`; Hinweis: Live-Daten benötigen `SUPABASE_SERVICE_ROLE_KEY`.
- Abnahme-Vorlage je Sub-Slice mit Routenliste + Vorher/Nachher der Header-Icons.

---

## 6. Risikoliste (kurz)

- **Command Center (`/dashboard`)** ist die sensibelste Migration: trägt den vorbestehenden Mobile-Scroll-Smoke-Failure und hat 3 Stat-Grids. Migration darf den Failure nicht verschlimmern; nicht im selben Schritt „fixen" wollen.
- **`content/hub`** ist groß (≈8 Card-Blöcke, 9 Violett-Refs) → höchstes Diff-/Review-Risiko; Body-Violett könnte Feature-Akzent sein → nur Header/Card-Header normalisieren, im Zweifel belassen.
- **Über-Normalisierung:** Versuchung, Body-/Chart-Farben mitzuziehen → strikt auf Header + Shared Controls begrenzen.
- **StatCard-Tone-Mismatch:** bestehende Stat-Icons (emerald/blue/amber) sind keine Violett-Drift → Tones 1:1 mappen, nur Violett→Navy ändern.
- **Stacked-PR-Drift:** solange #17 offen ist, basiert dieser Branch darauf; bei späterem Rebase von `feat/dashboard-phase2b-inc2` muss nachgezogen werden.

---

## Empfehlung zur Slice-Granularität
Wegen Heterogenität (sensibles Command Center + schweres `content/hub`) **2 Teilslices entlang der Sidebar-Gruppen**:
- **1.2a — Overview** (3 Seiten, inkl. sensibles `/dashboard`)
- **1.2b — Content & SEO** (6 Seiten, inkl. schweres `content/hub`)
Je eigener, reviewbarer Stand; isoliert die beiden Risiko-Seiten.
