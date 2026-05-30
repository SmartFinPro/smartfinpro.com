# Saved Views — Slice 1 Implementation Plan

> **SP2 · Slice 1** · Branch `codex/dashboard-saved-views` (auf frischer `main`). PR/Push/Deploy erst auf Freigabe.
> Spec: `docs/superpowers/specs/2026-05-30-dashboard-saved-views-design.md` (gegen Main geprüft: FilterBar/TimeRange/Silo/validation/migrations-Pattern unverändert vorhanden).

**Goal (Slice 1):** Generische Saved-Views-Kernschicht (List/Save/Apply/Delete) + Pilot auf `analytics`. Bestehendes `searchParams`/`router.push`-Verhalten unverändert. `silo-filter-dropdown`-`pathname`-Bug mitnehmen. **Kein** Default-Handling, **kein** breiter Rollout (→ Slice 2).

**Pilot-Route:** `/dashboard/analytics`.

## Dateien
- **Create** `supabase/migrations/20260530160000_create_dashboard_saved_views.sql` — Tabelle + RLS (service-role).
- **Create** `lib/actions/saved-views.ts` — Server Action (`listSavedViews`, `createSavedView`, `deleteSavedView`).
- **Create** `app/api/dashboard/saved-views/route.ts` — GET(list)/POST(save)/DELETE; POST via `validate()`. (Client darf Server Action nicht importieren → Turbopack-`'use server'`-Falle → fetch über API.)
- **Create** `components/dashboard/saved-views.tsx` — `'use client'` Dropdown (List · Save current · Apply · Delete), fetch gegen API.
- **Modify** `app/(dashboard)/dashboard/analytics/page.tsx` — `<SavedViews />` in die bestehende `FilterBar` einklinken.
- **Modify** `components/dashboard/silo-filter-dropdown.tsx` — Hard-Push `/dashboard/analytics` → `usePathname()`.

## Datenmodell
`dashboard_saved_views(id uuid pk, route text, name text, params jsonb, is_default bool default false, created_at timestamptz)`, UNIQUE `(route,name)`, Index `(route, created_at desc)`, RLS service-role (Pattern wie `notifications`). `is_default` bereits im Schema (Default-Logik erst Slice 2).

## Tasks
1. Migration schreiben.
2. Server Action (`createServiceClient`, Result-Pattern `{success,data?,error?}`; `createSavedView` upsert on conflict `(route,name)`).
3. API-Route (GET `?route=`, POST `{route,name,params}` mit Zod-`validate`, DELETE `?id=`).
4. Client-Control `saved-views.tsx` (useRouter/usePathname/useSearchParams; Save liest aktuelle Query-Params; Apply = `router.push(\`${pathname}?${params}\`)`; Delete; Outside-Click-Close; brand-konforme Optik wie Silo-Dropdown, kein Hex im JSX).
5. Einbau in `analytics`-`FilterBar`.
6. silo-Bug-Fix (`usePathname`).

## Verifikation
- `npx tsc --noEmit`
- `npx eslint` betroffene Dateien
- `npm run check:imports` (Client→`'use server'`-Grenze)
- `npm run check:migrations`
- `npm run build` (Route + Server Action betroffen)
- localhost (`DASHBOARD_AUTH_DISABLED=true`): auf `/dashboard/analytics` View speichern (Name) → erscheint in Liste; Apply setzt `?range=&silo=`; Delete entfernt; **Time-Range/Silo unverändert funktionsfähig**; Silo-Push nutzt jetzt `pathname`.
  - DB-Schreiben braucht lokal `SUPABASE_SERVICE_ROLE_KEY` — sonst nur UI/Struktur prüfbar.

## Non-Goals / Guards
- Kein Default-View-Handling, kein Multi-Page-Rollout (Slice 2). Kein Cross-User/Sharing. Kein neues Filter-Modell. Kein Cohort/LTV. `content/hub` Microslice 2 + `/dashboard` Command Center out of scope. Kein Push/PR/Deploy in diesem Schritt.
