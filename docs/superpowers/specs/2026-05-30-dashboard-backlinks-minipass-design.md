# Dashboard Design-System — `backlinks` Mini-Pass Design Spec

> **Sub-Projekt 1 von Increment 3 · separater Mini-Pass** (aus Slice 1.2b herausgelöst).
> **Datum:** 2026-05-30 · **Status:** Spec zur Review · **Branch:** `codex/dashboard-sp1-slice-1-2`
> **PR später:** stacked gegen `feat/dashboard-phase2b-inc2`.
> **Prozess (verbindlich):** lokal → localhost testen → Abnahme → erst nach Freigabe Push/Merge/Deploy.

---

## 1. Ziel

Gezielte **Drift-Korrektur** auf der Backlink-Automation-Seite: das letzte sichtbare Off-Brand-Violett im KPI-Streifen entfernen. **Keine** Struktur-Migration, **kein** KPI-Redesign, **keine** Gradient-Bar-Änderung. Bewusst minimal.

---

## 2. Datei im Scope

- `app/(dashboard)/dashboard/backlinks/page.tsx` (einzige Datei)

**Out of scope:** `content/hub` (weiterhin isoliert), alle bereits migrierten 1.1/1.2a/1.2b-1-Seiten, `/dashboard`.

---

## 3. Was migriert/korrigiert wird — und was bewusst NICHT

**Korrigieren (Drift):**
- **Manual-Queue-KPI** (Zeilen ~122/125): `Clock` `text-violet-500` → Brand-Navy, Wert `text-violet-600` → Brand-Navy. Reine Farb-Token-Korrektur, kein Layout-Eingriff.
  - Umsetzung token-driven (kein neuer Hex im JSX): entweder `style={{ color: 'var(--sfp-navy)' }}` analog zu den bestehenden navy-KPIs derselben Datei (Zeilen 93/109), oder eine vorhandene Tone-Klasse. **Konsistent zum Datei-eigenen Muster** (die anderen KPIs nutzen bereits `var(--sfp-navy)`).

**Bewusst NICHT anfassen:**
- **`StatusBadge.manual_review`** (Zeile 18, `bg-violet-100/text-violet-700`): **semantische** Status-Farbe (Zustand „Manual"), kein dekorativer Drift → bleibt, um Status-Semantik nicht zu verfälschen.
- **5 KPI-Karten-Layout**: anderes Idiom als `StatCard` (Icon+Label oben, Zahl unten) → **kein** StatCard-Redesign.
- **5 Gradient-Bar-Sections** (`navy→gold`): bewusste Brand-Optik, kein Look-Verlust-Risiko eingehen → **kein** SectionCard.
- **Header**: bereits Navy (`<Link2 style={{color:'var(--sfp-navy)'}}/>`) → **optional** PageHeader-Swap (nur Konsistenz `text-slate-800→900`, marginal); im Zweifel weglassen, um die Datei minimal zu halten.

---

## 4. Non-Goals

- Kein KPI-Redesign, kein StatCard/SectionCard-Rollout.
- Keine Gradient-Bar-Entfernung/-Änderung.
- Keine Änderung der `StatusBadge`-Semantik.
- Keine Primitive-API-Erweiterung.
- Kein Saved Views, kein Cohort/LTV.
- Keine Body-/Widget-Voll-Normalisierung.

---

## 5. localhost-Verifikationsstrategie

- `npx tsc --noEmit` + `npx eslint app/(dashboard)/dashboard/backlinks/page.tsx`.
- `npm run check:imports`.
- `npm run build` (optional bei so kleinem Diff, aber empfohlen vor Abnahme).
- Grep-Guard: nach Korrektur nur noch **eine** zulässige Violett-Referenz (Zeile 18 `StatusBadge.manual_review`); die KPI-Refs (122/125) sind weg.
- localhost visuell auf konfiguriertem Dashboard-Dev-Port (`next dev`; Auth via `DASHBOARD_AUTH_DISABLED=true`): KPI „Manual Queue" Icon+Zahl jetzt Navy, restliche 4 KPIs unverändert, Gradient-Bars unverändert.
- `npm run test:dashboard-smoke` → keine neuen Regressionen (3 vorbestehende Failures bleiben).

---

## 6. Risikoliste (kurz)

- **Semantik-Verlust:** Navy macht „Manual Queue" optisch wie die neutralen Navy-KPIs (Live/⌀DA) — der bisherige „Aufmerksamkeit"-Cue (Violett) entfällt. Falls ein Attention-Cue gewünscht ist, wäre **Gold/Amber** (Brand) die Alternative statt Navy. (Bewusste Designentscheidung, kein Bug.)
- **Sehr geringes technisches Risiko:** isolierte 2-Zeilen-Farbänderung, keine Struktur.
- **Über-Eifer-Risiko:** Versuchung, „wenn schon hier" KPIs/Gradients mitzumigrieren → strikt vermeiden.

---

## 7. Empfehlung: machen oder auslassen?

**Empfehlung: jetzt machen — aber strikt minimal** (nur Manual-Queue-KPI Violett→Navy; Header-PageHeader optional/auslassbar; alles andere unverändert).

Begründung: Es ist eine isolierte 2-Zeilen-Token-Korrektur mit nahezu null Regressionsrisiko, die das letzte sichtbare Off-Brand-Violett im KPI-Streifen entfernt und die Seite konsistent zur restlichen Navy-Optik macht. Eine größere Migration (KPIs/Gradients) lohnt **nicht** — das wäre Redesign ohne klaren Gewinn. Wer maximale Minimal-Invasität will, kann den Pass auch auslassen; der verbleibende Violett-Akzent ist klein und teilweise semantisch (Status-Badge bleibt ohnehin).
