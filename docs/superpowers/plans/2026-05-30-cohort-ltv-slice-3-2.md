# Cohort / LTV — Slice 3.2 (Read-only-UI) Implementation Plan

> **SP3 · Slice 3.2** · Branch `codex/dashboard-cohort-ltv` (auf 3.1). Baut auf der fertigen Datenschicht (`lib/actions/cohorts.ts` `getCohortData()` + `lib/cohorts/aggregate.ts`). PR/Push/Deploy erst später.

**Goal:** Read-only Server-UI für Cohort/LTV auf Basis von `getCohortData()`. **Keine** Chart-Kurve, **kein** Saved-Views-Anschluss, **keine** Migration.

## Dateien
- **Create** `app/(dashboard)/dashboard/cohorts/page.tsx` — async Server Component (`force-dynamic`), ruft `getCohortData(weeks)` **direkt** auf (Server→Server, keine API-Route nötig). Rendert:
  - `PageHeader` (icon + Titel „Cohort LTV"); in `actions` eine **minimale Wochen-Auswahl** (Preset-`<Link>`s 8 / 12 / 26, aktiver markiert) über `?weeks=`.
  - **KPI-Zeile** mit `StatCard`: total clicks · approved revenue (USD) · conversion rate · avg LTV/click · avg LTV/click @W4.
  - **`SectionCard`** „Weekly click cohorts — LTV per click" mit Matrix-Tabelle: Zeilen = Kohorten-Woche, Spalten = `Size` + `W0..W{maxAge}`, Zellen = LTV/Klick (`$`), 0 → dezent „–". `overflow-x-auto`.
  - **`EmptyState`** wenn keine Kohorten/Daten (oder `success=false`).
- **Modify** `app/(dashboard)/layout.tsx` — Sidebar-Eintrag in Gruppe **Monetization** (z. B. „Cohort LTV", neben Funnel/Revenue), passendes lucide-Icon.

## Daten / Query-Param
- `searchParams: { weeks?: string }` → in `[8,12,26]` validieren (Default 12) → `getCohortData(weeks)`.
- Datenbasis bleibt `link_clicks` + `conversion_events` (3.1). **Keine** Revenue-Reconciliation.

## Verifikation
- `npx tsc --noEmit` · `npx eslint <neue/geänderte Dateien>` · `npm run check:imports` (Server-Component ruft Server-Action direkt — kein Client-Import) · `npm run build` (neue Route).
- localhost (`DASHBOARD_AUTH_DISABLED=true`): `/dashboard/cohorts` rendert PageHeader + KPIs + Matrix bzw. EmptyState; `?weeks=8/26` wirkt; Sidebar-Eintrag sichtbar/aktiv. (Live-Zahlen brauchen `SUPABASE_SERVICE_ROLE_KEY`; ohne → EmptyState/0, kein Crash.)

## Non-Goals / Guards
- **Keine** LTV-Kurve/Chart (3.3) · **kein** Saved-Views-Anschluss (3.3) · keine Markt-Splits / Retention-% / Monatsgranularität · keine Migration · keine API-Route (Server→Server genügt). Geparkt: Auth-Konsistenz-Fix · content/hub Microslice 2 · Command-Center-Konsolidierung. Kein Push/PR/Deploy.

## Slice-Schnitt-Hinweis
3.2 = nur die statische Matrix + KPIs (read-only). 3.3 ergänzt die LTV-Kurve (Chart-Komponente) und bindet Saved Views als Filter-Persistenz an.
