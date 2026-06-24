# Fix: Cohorts „Earnings per Click" — `currency` → `event_currency` (Schema-Mismatch)

> **Typ:** chirurgischer Bugfix (1 Datei) · **Branch:** `codex/dashboard-cohort-ltv` (oben drauf, VOR Merge von #26) · Kein Push/PR/Deploy bis Abnahme.
> Verifiziert am 2026-05-30 im Dev-Log. Realisiert die im Postback-Sync-Spec geparkte Notiz „#26 cohorts `currency`→`event_currency` (eigener Scope)".

## Problem
`lib/actions/cohorts.ts` → `getCohortData()` selektiert aus `conversion_events` mit
`.select('click_id, received_at, event_value, currency, event_type')` (Z.50) und mappt `r.currency` (Z.74).
Die Live-Spalte heißt aber **`event_currency`** (`supabase/migrations/20260307150000_conversion_events.sql:33`,
`event_currency VARCHAR(3) DEFAULT 'USD'`) — eine Spalte `currency` existiert auf der Tabelle **nicht**.
PostgREST liefert daher den Fehler „column conversion_events.currency does not exist" **zurück**; der Code
prüft `eventsRes.error` → `getCohortData` gibt `{success:false}` → die Seite `/dashboard/cohorts`
(„Earnings per Click") zeigt dauerhaft nur den EmptyState statt echter Daten.

## Faktenlage (verifiziert)
- Insert-Pfad `lib/api/postback-service.ts:175` schreibt `event_currency` (+ `occurred_at` Z.179). `received_at` hat DB-Default. Quelle stimmt.
- Migration `conversion_events`: `event_currency`, kein `currency`.
- Vitest `__tests__/unit/cohorts-aggregate.test.ts` testet die **pure** Funktion `computeCohorts`/`weekStartUtc` (Import `@/lib/cohorts/aggregate`), referenziert `currency` nirgends → von Query/Select unberührt, bleibt grün.

## Fix (chirurgisch, eine Datei: `lib/actions/cohorts.ts`)
1. Z.50 Select: `currency` → `event_currency`.
2. Z.74 Mapping: `toUSD(Number(r.event_value) || 0, r.currency …)` → `r.event_currency` (FX-Konvertierung via `toUSD` unverändert).
3. Z.28 Doc-Kommentar: Spaltenname `currency` → `event_currency` (Konsistenz).

**Keine** Migration, **kein** Schema-Change, **keine** Änderung an `lib/cohorts/aggregate.ts` oder am Test.

## Verifikation
- `npx tsc --noEmit` · `npx eslint lib/actions/cohorts.ts` · Vitest `cohorts-aggregate.test.ts` grün.
- Optional gegen DB: `getCohortData()` kommt jetzt ohne Fehler zurück (kein „column … does not exist").

## Non-Goals / Guards
- Kein weiterer Scope · keine Materialisierung der Aggregation · keine `types.ts`-Reconciliation.
- Kein Push/PR/Deploy bis explizite Freigabe. Hotfix wird VOR dem Merge von #26 gezogen (oben auf den #26-Branch).
