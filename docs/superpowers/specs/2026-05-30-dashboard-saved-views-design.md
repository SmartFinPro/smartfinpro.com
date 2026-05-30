# Saved Views (Sub-Projekt 2) Design Spec

> **Essentieller Follow-up 2/3** · **Datum:** 2026-05-30 · **Status:** Spec zur Review · **Branch:** `codex/dashboard-saved-views` (von `main`)
> **PR später:** gegen `main`. Baut auf den **live stehenden** Dashboard-Primitives (`FilterBar`, `ActionButton`, `SectionCard`, …) auf. Kein Deploy/Merge ohne Freigabe.

## 1. Ziel
Eine **generische Saved-Views-/Filter-Persistence-Schicht**: Nutzer können die aktuelle Filter-Kombination einer Dashboard-Seite (Time-Range, Silo, weitere Query-Params) als **benannte View speichern, wieder aufrufen, als Default setzen und löschen**. Aufgesetzt auf das bestehende `searchParams`-basierte Filter-Modell — **ohne** dessen Verhalten zu brechen.

## 2. Exakter Scope
- Persistierbare Views pro Dashboard-Route, basierend auf der **kanonischen Repräsentation der Query-Params** der jeweiligen Seite (z. B. `?range=7d&silo=uk`).
- Ein **Saved-Views-Control** (Dropdown „Views": Liste · Apply · Save current · Set default · Delete), das in die bestehende `FilterBar` einklinkt.
- Persistenz serverseitig in einer neuen Tabelle (siehe §4) via Server Action + schlanker API-Route (Pattern wie bestehende `/api/dashboard/*`).
- **Pilot-Seite:** `analytics` (echte `range`+`silo`-Filter, bestehende `TimeRangeSelector`/`SiloFilterDropdown`). Danach generisch auf weitere `searchParams`-Seiten ausrollbar.

## 3. Betroffene Seiten/Bereiche
- **Filter-Controls / Andockpunkt:** `components/dashboard/ui/filter-bar.tsx` (Shell existiert), `components/dashboard/time-range-selector.tsx`, `components/dashboard/silo-filter-dropdown.tsx`.
- **searchParams-Seiten (Roll-out-Kandidaten):** `analytics` (Pilot), sowie `dashboard` (range), `content/hub` (seo/quality/status/cps), `audit-log`, `quiz`, `tools/money-leak`.
- **Neu:** `components/dashboard/saved-views.tsx` (Client-Control), `lib/actions/saved-views.ts` (Server Action, `createServiceClient`), `app/api/dashboard/saved-views/route.ts` (falls Client-fetch nötig — Turbopack-`'use server'`-Falle beachten → ggf. API statt direktem Action-Import), Migration `supabase/migrations/<ts>_saved_views.sql`.
- **Bug-Mitnahme (klein, sinnvoll):** `silo-filter-dropdown.tsx` pusht aktuell hart auf `/dashboard/analytics` statt `usePathname()` — beim Saved-Views-Anschluss generisch auf `pathname` umstellen.

## 4. Wahrscheinliche Daten-/Persistence-Bausteine
- **Tabelle `dashboard_saved_views`** (Migration, RLS service-role): `id`, `route` (z. B. `/dashboard/analytics`), `name`, `params` (jsonb — die Query-Param-Map), `is_default` (bool), `created_at`. Eindeutigkeit `(route, name)`.
- **Server Action** `lib/actions/saved-views.ts`: `listViews(route)`, `saveView(route, name, params)`, `setDefault(route, id)`, `deleteView(id)` — Rückgabe-Pattern `{ success, data?, error? }`.
- **Apply** = `router.push(\`${pathname}?${new URLSearchParams(params)}\`)` (reines Query-Param-Setzen, kein neues Filter-Modell).
- Auth/Gating wie alle `/api/dashboard/*` über `proxy.ts`.

## 5. Non-Goals
- **Keine** Cohort/LTV-Logik (Sub-Projekt 3) in diesem Spec/Branch.
- **Kein** neues Filter-/Query-Param-Modell; bestehendes `searchParams`-Verhalten bleibt unverändert.
- **Kein** Cross-User-Sharing/Permissions, kein Multi-Tenant (Single-Operator-Dashboard).
- `content/hub` Microslice 2 und `/dashboard` Command Center bleiben **out of scope**.
- Keine Persistenz im LocalStorage als Ersatz für die DB-Schicht (DB ist die Quelle der Wahrheit).

## 6. Verifikationsstrategie (localhost/CI)
- Migration lokal anwendbar; `check:migrations` grün.
- `check:imports` (Turbopack-`'use server'`-Grenze), `tsc`, Unit-Test für die Params↔URL-Serialisierung (pure-Funktion, vitest).
- localhost (`DASHBOARD_AUTH_DISABLED=true`): auf `analytics` View speichern → Reload → in der Liste; Apply setzt `?range=&silo=`; Set-Default lädt beim Seitenaufruf ohne Params die Default-View; Delete entfernt sie. **Bestehende Filter (Time-Range/Silo) funktionieren unverändert**, auch ohne gespeicherte Views.
- `dashboard-smoke` ohne neue Regressionen.

## 7. Risiken
- **Turbopack `'use server'`-Falle:** Client-Control darf Server Action nicht dynamisch importieren → API-Route nutzen (bekanntes Repo-Pattern).
- **Default-View-Redirect-Schleifen:** Default nur anwenden, wenn **gar keine** Query-Params gesetzt sind (sonst Endlos-Redirect) — explizit absichern.
- **Generizität vs. Seiten-Spezifika:** Params-Schema variiert je Seite → die Schicht speichert die rohe Param-Map generisch; keine seiten-spezifische Validierung über das Nötigste hinaus.
- **RLS/Migration-Hygiene:** neue Tabelle mit RLS-Policy (service-role), Migration chronologisch.

## 8. Slice-Empfehlung
- **Slice 2.1 — Persistence-Kern + Pilot `analytics`:** Migration + Server Action/API + `saved-views.tsx` + Einbau in `analytics`-`FilterBar` (List/Save/Apply/Delete). Inkl. `silo-filter-dropdown` `pathname`-Fix.
- **Slice 2.2 — Default-View + Roll-out:** `is_default`-Handling (no-params → default) und generischer Einbau auf den weiteren searchParams-Seiten.
- Empfehlung: **2 Slices**, Pilot zuerst isoliert abnehmen, bevor breiter Roll-out.
