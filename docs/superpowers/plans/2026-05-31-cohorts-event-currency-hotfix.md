# Plan: Cohorts `currency` → `event_currency` Hotfix

Spec: `docs/superpowers/specs/2026-05-31-cohorts-event-currency-hotfix.md`
Branch: `codex/dashboard-cohort-ltv` (oben drauf, VOR Merge #26).

## Schritte
1. [x] Root-Cause + Spaltenlage verifiziert (Migration `event_currency`, postback-service schreibt `event_currency`, Test unberührt).
2. [x] `lib/actions/cohorts.ts`: 3 Änderungen (Select Z.50, Mapping Z.74, Doc-Kommentar Z.28) — `currency` → `event_currency`.
3. [x] Verifiziert: `npx tsc --noEmit` (0), `npx eslint lib/actions/cohorts.ts` (0), Vitest `cohorts-aggregate.test.ts` (8/8). DB-Gegencheck via `detect_schema_drift`: live nur `event_currency`, kein `currency`.
4. [ ] Abnahme anfordern. Kein Push/PR/Deploy bis Freigabe. ← HIER

## Rollback
Einzelne Datei, drei Token-Ersetzungen → `git checkout lib/actions/cohorts.ts`.
