# Saved Views — Slice 2 Implementation Plan

> **SP2 · Slice 2** · Branch `codex/dashboard-saved-views-slice-2` (von `main`, enthält Slice 1). Kein neuer Spec — baut auf `docs/superpowers/specs/2026-05-30-dashboard-saved-views-design.md` (§8 Slice 2.2). PR/Push/Deploy erst auf Freigabe.
> **Voraussetzung erfüllt:** Prod-Migration `dashboard_saved_views` angewandt; `is_default`-Spalte existiert bereits → **keine neue Migration nötig**.

**Goal:** Default-View-Mechanik (Set/Unset/Marker/Auto-Apply mit Loop-Schutz) + Rollout des `SavedViews`-Controls auf 5 weitere Filter-Seiten. Bestehendes `searchParams`/`router.push`-Verhalten unverändert.

## Dateien
- **Modify** `lib/actions/saved-views.ts` — `setDefaultSavedView(route, id)`: erst alle `is_default=false` für `route`, dann `is_default=true` für `id` (eine Default pro Route).
- **Modify** `app/api/dashboard/saved-views/route.ts` — `PATCH` für Set-Default (`validate({ route, id })`). GET/POST/DELETE unverändert.
- **Modify** `components/dashboard/saved-views.tsx` — Default-Marker (gefüllter Stern/Pin) in der Liste; „Als Standard"-Aktion pro Eintrag (stopPropagation); **Auto-Apply der Default-View beim Mount nur wenn `searchParams` leer** (Loop-Schutz, siehe unten).
- **Modify (Rollout, 5 Seiten)** — `<SavedViews />` in den Filter-/Header-Bereich einklinken:
  - `app/(dashboard)/dashboard/content/hub/page.tsx` → in `PageHeader.actions`
  - `app/(dashboard)/dashboard/audit-log/page.tsx` → Header-/Filterzeile
  - `app/(dashboard)/dashboard/quiz/page.tsx` → neben `TimeRangeSelector`
  - `app/(dashboard)/dashboard/tools/money-leak/page.tsx` → neben `TimeRangeSelector`
  - `app/(dashboard)/dashboard/page.tsx` → neben dem `TimeRangeSelector`-Block (Command Center — **zuletzt**, sensibelste Seite)

## Auto-Apply Default — Loop-Schutz (kritisch)
Im `SavedViews`-Control beim Mount:
1. Lightweight-Fetch der Views für `pathname` (Liste enthält `is_default`) — einmalig (eigener Mount-Effekt, unabhängig vom Dropdown-Open).
2. Apply **nur wenn ALLE** gelten: `searchParams.toString() === ''` (gar keine Query-Params) **UND** eine Default existiert **UND** deren `params` nicht leer.
3. `router.replace(\`${pathname}?${qs}\`)` (nicht `push` — keine History-Verschmutzung).
4. **Guard:** `useRef(applied)` → max. 1× pro Mount; zusätzlich verhindert die `=== ''`-Bedingung eine Wiederholung (nach `replace` sind Params nicht-leer). → keine Redirect-Schleife.

## Slice-Struktur (intern 2 Steps, je verifizierbar)
- **Step 2a — Default-Mechanik (isoliert auf `analytics`):** `setDefaultSavedView` + PATCH + Dropdown-Marker + „Als Standard" + Auto-Apply/Loop-Schutz. Verifikation auf `/dashboard/analytics` (Control bereits aus Slice 1 vorhanden → kein Rollout, isoliert die riskante Auto-Apply-Logik).
- **Step 2b — Rollout (5 Seiten):** `<SavedViews />` einklinken; Reihenfolge **audit-log → quiz → money-leak → content/hub → dashboard** (Command Center zuletzt).

## Verifikation
- `npx tsc --noEmit` · `npx eslint <geänderte Dateien>` · `npm run check:imports` · `npm run build` (Route + Action betroffen).
- localhost (mit angewandter Migration + `SUPABASE_SERVICE_ROLE_KEY`, eingeloggte Session): View „Als Standard" setzen → Marker erscheint, vorherige Default entsetzt; Aufruf der Route **ohne** Query-Params → Default wird **einmal** angewandt (kein Loop); Aufruf **mit** Params → Default wird **nicht** überschrieben; Apply/Save/Delete unverändert.
- Grep-Guard: kein neuer Hex im JSX; Control bleibt route-generisch.

## Non-Goals / Guards
- Kein Cross-User/Sharing. Kein neues Filter-Modell. Keine neue Migration. Kein Cohort/LTV. `content/hub` Microslice 2 + `/dashboard` Command-Center-Konsolidierung bleiben out of scope (hier nur `<SavedViews />` einklinken, **keine** sonstige Umgestaltung dieser Seiten). Der geparkte Auth-Konsistenz-Fix wird **nicht** angefasst. Kein Push/PR/Deploy in der Plan-Phase.
