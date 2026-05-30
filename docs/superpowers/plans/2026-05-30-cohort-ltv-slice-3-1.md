# Cohort / LTV — Slice 3.1 (Datenschicht) Implementation Plan

> **SP3 · Slice 3.1** · Branch `codex/dashboard-cohort-ltv` (auf aktueller `main`, enthält SP1+SP2). Kein neuer Spec — baut auf `docs/superpowers/specs/2026-05-30-dashboard-cohort-ltv-design.md` (§8 Slice 3.1). PR/Push/Deploy/UI erst später.

**Goal (3.1):** Reine, **testbare** Kohorten-/LTV-**Aggregations-Datenschicht** — **keine UI**. Eine pure Aggregations-Funktion + eine Server-Action, die Bestandsdaten (`clicks`, `conversions`) liest, FX→USD normalisiert und Kohorten-Matrix + LTV-Serie liefert. Korrektheit zuerst (Unit-Tests mit Fixtures), bevor in 3.2 die Read-only-UI aufsetzt.

## Betroffene Dateien/Bereiche
- **Create** `lib/cohorts/aggregate.ts` — **pure Funktion** `computeCohorts(clicks, conversions, opts)` (kein `server-only`, kein DB — damit unit-testbar). Input: bereits FX-normalisierte Zeilen. Output: typisiertes `CohortResult` (Matrix + LTV-Serie + KPIs).
- **Create** `lib/actions/cohorts.ts` — `'use server'` Server-Action `getCohortData(range, granularity)`: `createServiceClient()` → `clicks`/`conversions` laden (gebundenes Fenster), `loadFxRates()` + FX→USD (analog `revenue.ts`), dann `computeCohorts(...)` aufrufen. Result-Pattern `{success,data?,error?}`.
- **Create** `__tests__/unit/cohorts-aggregate.test.ts` — vitest gegen `computeCohorts` mit deterministischen Fixtures.
- **Keine** Route, **keine** Komponente, **keine** Migration, **keine** Navigation in 3.1.

## ⚠️ Korrektur während 3.1 — echte Datenquellen
Der Spec nahm `conversions` + `click_id`-Join an. **Befund:** Die Live-`conversions`-Tabelle hat **kein `click_id`** (link-level/reconciled, von `revenue.ts` genutzt) → trägt **keine** Klick-Kohorten. Korrekte Quellen sind **`link_clicks`** (`click_id`, `clicked_at`) und **`conversion_events`** (`click_id`, `event_value`, `currency`, `received_at`, `event_type`). „Approved" = `event_type='approved'`. **Hinweis:** Diese (getrackten Postback-)Werte können von den **reconciled** Revenue-Zahlen des Revenue-Dashboards (`conversions.commission_earned`) abweichen.

## Datenquellen & Aggregationslogik
**Quellen (Live-Spalten, bestätigt):**
- `clicks`: `clicked_at` (TIMESTAMPTZ), `click_id` (VARCHAR, Tracking-ID), `link_id`, `country_code`, `page_slug`.
- `conversions`: `created_at` (TIMESTAMPTZ, Conversion-Zeit), `click_id` (VARCHAR), `commission_value` (DECIMAL), `market`, Status-Feld (approved/qualified — **exakt die Status-Logik aus `revenue.ts` spiegeln**, „approved revenue").
- FX: `loadFxRates()` + Convert-Helper aus `lib/fx-rates`/`revenue.ts` → alle Werte in **USD**.

**Logik (Kohorte = Klick-Eintritts-Periode):**
1. **Kohorten-Key:** `date_trunc('week', clicks.clicked_at)` (UTC) → wöchentliche Kohorten.
2. **Kohorten-Größe:** Anzahl Klicks je Kohorte.
3. **Zuordnung Revenue:** Conversions per `click_id` an den zugehörigen Klick joinen → Kohorte des Klicks. **Alter (age)** = ganze Wochen zwischen `clicks.clicked_at` und `conversions.created_at`.
4. **Matrix-Zelle** `[cohort][age]` = Σ FX-normalisierter `commission_value` (nur approved). **Kumulativ** über `age` (W0..Wn).
5. **LTV** `[cohort][age]` = kumulatives Revenue / Kohorten-Größe (LTV pro Klick).
6. **Headline-KPIs:** Ø LTV/Klick gesamt; Ø LTV/Klick bei festem Horizont (z. B. W4); Gesamt-Kohortengröße; Conversion-Rate (Conversions/Klicks).
- Conversions **ohne** `click_id` (unattributiert) werden in 3.1 **nicht** in die per-Klick-Kohorte gezählt (sauber ausgeschlossen; optional später separater Bucket).
- **Gebundenes Fenster** (z. B. letzte 12 Wochen, `range`-Param) + Row-Cap, um teure Roh-Aggregation zur Renderzeit zu vermeiden.

## Abgrenzung zu 3.2 / 3.3
- **3.1 (hier):** nur Datenschicht + Tests. Kein Route/Page/Component/Nav.
- **3.2:** Read-only-UI (`/dashboard/cohorts`, PageHeader, StatCard-KPIs, Kohorten-Matrix via SectionCard, FilterBar). Nicht hier.
- **3.3:** LTV-Kurve (Chart) + **Saved-Views-Anschluss**. In 3.1 nur als **spätere Abhängigkeit benannt**, nicht implementiert.

## Verifikationsstrategie
- **vitest** `cohorts-aggregate.test.ts`: deterministische Fixtures (Klicks über 2–3 Wochen + Conversions mit bekannten `click_id`/`created_at`/Werten) → erwartete Matrix-, LTV- und KPI-Werte exakt asserten (inkl. Edge: leere Daten, Conversion ohne click_id, FX-Konvertierung).
- `npx tsc --noEmit` · `npx eslint lib/cohorts/aggregate.ts lib/actions/cohorts.ts __tests__/unit/cohorts-aggregate.test.ts`.
- `npm run check:imports` (Server-Action sauber; pure Funktion ohne `server-only`).
- **Kein** `npm run build` nötig (keine neue Route in 3.1).

## Risiken
- **Join-Korrektheit** `conversions.click_id ↔ clicks.click_id` (VARCHAR; Nulls/unattributiert) → in Tests explizit abdecken; Nulls ausschließen.
- **FX/Zeitzonen/Bucketing:** konsistent UTC + `date_trunc`; FX exakt wie `revenue.ts`.
- **Status-Filter:** „approved/qualified" exakt aus `revenue.ts` übernehmen, nicht neu erfinden.
- **Performance:** Roh-Aggregation großer `clicks`/`conversions` → Fenster + Cap in 3.1; Cron-Materialisierung bleibt späterer, separater Scope.
- **Daten-Dünne:** wenige Conversions → spärliche Matrix (UI-EmptyState erst in 3.2).

## Empfehlung — kleinster sinnvoller Aggregationskern
**Eine Dimension + eine Metrik-Familie:** **wöchentliche Klick-Kohorten × kumulatives approved-Revenue (USD)** → daraus **LTV/Klick** + **Kohorten-Größe**. Headline: Ø LTV/Klick (gesamt) + bei W4. **Zuerst weglassen** (spätere Slices/Steps): Markt-Split, Retention-%-Sicht, Monats-Granularität-Toggle, unattributierte-Conversions-Bucket. Das ist der kleinste Kern, der eine echte LTV-Kurve + Kohorten-Matrix speist und voll unit-testbar ist.
