# Cohort / LTV (Sub-Projekt 3) Design Spec

> **Essentieller Follow-up 3/3** · **Datum:** 2026-05-30 · **Status:** Spec zur Review · **Branch:** `codex/dashboard-cohort-ltv` (von `main`)
> **PR später:** gegen `main`. Baut auf den **live stehenden Primitives** auf und **idealerweise auf der Saved-Views-Mechanik** (Sub-Projekt 2). Kein Deploy/Merge ohne Freigabe.

## 1. Ziel
Eine saubere **Kohorten-/LTV-Analyse** im Dashboard: Lead-/Click-Kohorten (nach Eintritts-Zeitraum) und deren **Lifetime Value** über die Zeit sichtbar machen — auf Basis des bestehenden Design-Systems, ohne Ad-hoc-UI und ohne Big-Bang.

## 2. Exakter Scope
- Eine neue Dashboard-Route **`/dashboard/cohorts`** (Arbeitstitel) mit:
  - **Kohorten-Retention/Value-Matrix** (Kohorte = Eintritts-Periode z. B. Woche/Monat; Zellen = kumulierter Wert/Conversion-Rate je Folgeperiode).
  - **LTV-Kurve** (durchschnittlicher kumulierter Revenue pro Lead/Click über Zeit, je Kohorte/Markt).
- Wiederverwendung der Primitives: `PageHeader`, `StatCard` (Kennzahl-KPIs: Ø LTV, Payback-Periode, Best-Kohorte), `SectionCard` (Matrix/Chart-Container), `FilterBar` (Time-Range/Silo/Markt) — und **Saved-Views** für gespeicherte Kohorten-Filter.
- Datenherkunft: bestehende Tabellen `clicks`, `conversions`, `revenue`, `leads` (read-only Aggregation via Server Action).

## 3. Betroffene Seiten/Bereiche
- **Neu:** `app/(dashboard)/dashboard/cohorts/page.tsx` (Server Component, `force-dynamic`), `lib/actions/cohorts.ts` (Aggregations-Server-Action, `createServiceClient`), Client-Chart-Component(s) `components/dashboard/cohort-matrix.tsx` / `ltv-curve.tsx` (Framer Motion/Recharts wie bestehende Charts).
- **Navigation:** Sidebar-Eintrag in `app/(dashboard)/layout.tsx` (Gruppe *Monetization* — z. B. neben Funnel/Revenue).
- **Abhängigkeit (nicht hier implementieren):** Saved-Views-Mechanik aus Sub-Projekt 2 für persistierte Kohorten-Filter — **nur als Dependency benennen**, nicht in diesen Branch ziehen.
- **Ggf. Aggregations-Performance:** falls Roh-Aggregation zu teuer, später Cron-gestützte Materialisierung (separater Folge-Scope, hier nur benennen).

## 4. Erwartete UI-/Daten-Bausteine
- **KPIs (StatCard):** Ø LTV / Lead, Ø Payback-Tage, Conversion-Rate, Top-Kohorte.
- **Kohorten-Matrix (SectionCard):** Zeilen = Kohorten-Perioden, Spalten = Alter (W0..Wn), Zellen = kumul. Revenue oder Retention; Brand-Tone-Heat (Navy-Skala, keine Fremdfarben).
- **LTV-Kurve (SectionCard):** Liniendiagramm kumul. Revenue/Lead über Zeit, optional je Markt.
- **Daten:** Server-seitige SQL-Aggregation (Kohorte = `date_trunc` des Eintritts; Value = Σ `conversions.value`/`revenue.amount` join über `click_id`/`link_id`), FX-Konvertierung via bestehendem `lib/fx-rates`.
- **Filter:** `FilterBar` (range/silo/markt) + Saved-Views (nach SP2).

## 5. Non-Goals
- **Keine** Saved-Views-Implementierung in diesem Branch (nur konsumieren/benennen).
- Keine Ad-hoc-UI außerhalb des Design-Systems; keine neuen Primitive-APIs ohne guten Grund.
- Keine Schema-Migrationen für neue Roh-Tabellen, solange Aggregation aus Bestandsdaten reicht (Materialisierung = späterer, separater Scope).
- `content/hub` Microslice 2 und `/dashboard` Command Center bleiben **out of scope**.
- Kein Predictive-LTV/ML — nur deskriptive, historische Aggregation.

## 6. Verifikationsstrategie (localhost/CI)
- `tsc`, `check:imports`, `npm run build`; Unit-Test für die **reine Kohorten-Aggregations-Funktion** (deterministische Fixtures → erwartete Matrix/LTV-Werte, vitest).
- localhost (`DASHBOARD_AUTH_DISABLED=true`): Seite rendert mit Primitives; KPIs/Matrix/Kurve laden; Filter (range/silo) wirken; keine Console-Errors. (Live-Zahlen brauchen `SUPABASE_SERVICE_ROLE_KEY`.)
- `dashboard-smoke` ohne neue Regressionen; neue Route ggf. in die Smoke-URL-Liste aufnehmen (separat zu entscheiden).

## 7. Risiken
- **Aggregations-Korrektheit** (Joins clicks↔conversions↔revenue, FX, Zeitzonen, Kohorten-Bucketing) → durch Pure-Function + Unit-Tests mit Fixtures absichern.
- **Performance** großer Roh-Aggregationen zur Renderzeit (`force-dynamic`) → Query begrenzen/indexieren; bei Bedarf Cron-Materialisierung (Folge-Scope).
- **Daten-Dünne:** bei wenig Conversions sind Kohorten spärlich → saubere `EmptyState`-Behandlung (Primitive vorhanden).
- **SP2-Kopplung:** ohne Saved Views ist Cohort/LTV nutzbar (FilterBar genügt); Saved-Views ist Komfort, kein Blocker — Reihenfolge entsprechend wählen.

## 8. Slice-/Teilslice-Empfehlung
- **Slice 3.1 — Datenschicht:** `lib/actions/cohorts.ts` Aggregation + Unit-Tests (keine UI). Zuerst Korrektheit sichern.
- **Slice 3.2 — Read-only-UI:** Route + PageHeader + KPIs (StatCard) + Kohorten-Matrix (SectionCard) + FilterBar; Sidebar-Eintrag.
- **Slice 3.3 — LTV-Kurve + Saved-Views-Anschluss** (nach SP2): LTV-Chart + persistierte Kohorten-Filter.
- Empfehlung: **3 Teilslices**, Datenschicht zuerst (testbar, isoliert), UI danach inkrementell — kein Big-Bang.

## 9. Reihenfolge-Empfehlung gegenüber Saved Views
**Cohort/LTV nach Saved Views umsetzen.** Begründung: Slice 3.3 dockt sinnvoll an die Saved-Views-Mechanik an; baut man Cohort/LTV zuerst, müsste man die Filter-Persistence später nachrüsten. Die **Datenschicht (3.1)** ist allerdings SP2-unabhängig und könnte bei Bedarf vorgezogen/parallel erarbeitet werden.
