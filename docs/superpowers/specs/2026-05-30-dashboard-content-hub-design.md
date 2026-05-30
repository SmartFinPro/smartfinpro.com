# Dashboard Design-System — `content/hub` Pass Design Spec

> **Sub-Projekt 1 von Increment 3 · isolierter Follow-up** (aus Slice 1.2 herausgelöst).
> **Datum:** 2026-05-30 · **Status:** Spec zur Review · **Branch:** `codex/dashboard-sp1-content-hub`
> **PR später:** stacked gegen `codex/dashboard-sp1-slice-1-2`.
> **Prozess (verbindlich):** lokal → localhost testen → Abnahme → erst nach Freigabe Push/Merge/Deploy.

---

## 1. Ziel

Kontrollierte Konsolidierung der Content-Hub-Seite auf die bestehenden Primitives — **ohne** die dichte, feature-reiche UI plattzubügeln. Schwerpunkt: Header → `PageHeader` (Violett→Navy) und die saubere „Content Freshness"-Card → `SectionCard`. Die filter-tragenden Elemente bleiben funktional unangetastet.

---

## 2. Datei im Scope

- `app/(dashboard)/dashboard/content/hub/page.tsx` (einzige Datei)

**Out of scope:** alle anderen Seiten; keine Änderung an den eingebundenen Client-Komponenten (`ContentHubTableBody`, `ContentFreshnessWidget`, `BacklinkImportButton`, `ContentHubRefreshButton`).

---

## 3. Was migriert wird — und was bewusst NICHT

**Migrieren (klar, in-scope):**
- **Header** (Z. ~280–296): `bg-violet-50` Icon-Box (FileSearch) → `PageHeader` (icon FileSearch, tone navy); die beiden Buttons (`BacklinkImportButton`, `ContentHubRefreshButton`) in `PageHeader.actions`. Entfernt das prominenteste Header-Violett.
- **„Content Freshness"-Card** (Z. ~539–552): `bg-white border rounded-xl shadow-sm` + `px-6 py-4 border-b`-Header + `p-5`-Body → `SectionCard` (title „Content Freshness", icon Clock **tone amber beibehalten** — kein Violett, kein Drift; description = die Meta-Zeile; `contentClassName="p-5"`).

**Bewusst NICHT migrieren / nicht plattbügeln:**
- **8 Stat-Cards** (lokale `StatCard`, Z. ~145–182): trägt **Filter-Semantik** (`href` → klickbar, `active` → Ring) — das Primitive `StatCard` kann das **nicht**. Migration = Feature-Verlust → **bleibt**. (Optionaler Mini-Eingriff: nur das **statische** „Total Pages"-Icon `bg-violet-50 text-violet-500` → Navy-Tone; die `active`/`hover`-Violett-Ringe sind interaktive Signale → eher belassen, siehe §7 Microslice 2.)
- **4 Filter-Toolbars** (SEO-Health-Breakdown-Bars, Z. ~360/401/439/494): Inline-Filter-Zeilen, keine betitelten Cards → **bleiben** (kein SectionCard-Kandidat).
- **Active-Filter-Banner** (Z. ~519–536, violett): funktionales Filter-Status/Clear-Element; sein Violett gehört zum kohärenten Filter-Akzent-System (zusammen mit den `active`-Ringen der Stat-Cards) → in diesem Kern-Pass **belassen** (siehe §7).
- **Table-Card** (Z. ~555–574): bespoke Wrapper um `ContentHubTableBody` mit Spezial-Constraint (Hydration: kein `<div>` in `<table>`) + Custom-Footer → **nicht** in SectionCard zwängen.

---

## 4. Non-Goals

- Keine Primitive-API-Erweiterung (insb. **kein** `href`/`active` an `StatCard` anflanschen).
- Kein Saved Views, kein Cohort/LTV.
- Keine Voll-Normalisierung aller Body-/Widget-Farben; Stat-Icon-Akzente (cyan/indigo/emerald/blue/amber/orange) bleiben.
- Keine Änderung der Filter-Logik / Query-Params / `buildHubUrl`.
- Keine Änderung eingebundener Client-Komponenten.

---

## 5. localhost-Verifikationsstrategie

- `npx tsc --noEmit` + `npx eslint app/(dashboard)/dashboard/content/hub/page.tsx`.
- `npm run check:imports`.
- `npm run build` am Pass-Ende.
- Grep-Guard: Header-Violett weg; verbleibende Violett-Refs sind die bewusst belassenen Filter-Akzente (Stat `active`/`hover`, Active-Filter-Banner) bzw. ggf. „Total Pages"-Icon falls in Microslice 2.
- localhost visuell (konfigurierter Dashboard-Dev-Port; Auth via `DASHBOARD_AUTH_DISABLED=true`; Live-Daten brauchen `SUPABASE_SERVICE_ROLE_KEY`): FileSearch-Header-Icon **navy**; Buttons rechts im Header; „Content Freshness"-Card unverändert in Optik (gleiche Border/Shadow); **Filter-Klicks funktionieren weiter** (Stat-Cards, SEO-Health-Bars, Clear-Filter).
- `npm run test:dashboard-smoke` → keine neuen Regressionen.

---

## 6. Risiken (kurz)

- **Filter-Funktion brechen:** höchstes Risiko — die Stat-Cards/Banner sind klickbare Filter. Strikt nur Header + Freshness-Card anfassen; Filter-Elemente unberührt lassen.
- **SectionCard-Padding/Meta:** die Freshness-Meta-Zeile sitzt aktuell `ml-auto` rechts im Header — als `description` in SectionCard prüfen, dass sie nicht den Titel verdrängt (ggf. in `actions` statt `description`).
- **Hydration (Table-Card):** nicht anfassen — bekannter `<div>`-in-`<table>`-Constraint.
- **Inkonsistenz-Falle:** halbe Violett-Normalisierung (Header navy, aber Filter-Akzente violett) ist akzeptabel als bewusste Grenze; vollständige Filter-Akzent-Normalisierung nur gebündelt (Microslice 2).

---

## 7. Empfehlung: 1 Schritt oder 2 Mikroslices?

**2 Mikroslices — aber nach Charakter/Risiko geschnitten, nicht nach Größe:**

- **Microslice 1 (empfohlen, klar & risikoarm):** `PageHeader` (Header-Violett→Navy + Buttons in actions) + „Content Freshness" → `SectionCard`. Das ist die eigentliche, saubere Primitive-Konsolidierung und entfernt das sichtbarste Violett. Klein, gut reviewbar.
- **Microslice 2 (optional, separate Entscheidung):** das **kohärente Filter-Akzent-System** Violett→Navy: Stat-Card `active`/`hover`-Ringe (lokale Komponente) + Active-Filter-Banner + statisches „Total Pages"-Icon — **gemeinsam**, damit es konsistent bleibt. Berührt interaktive Zustände → höheres Risiko, daher isoliert und nur falls gewünscht.

**Hinweis zur Erwartung:** Trotz Zeilen-/Violett-Zahl ist der *migrierbare* Anteil klein (Header + 1 SectionCard), weil Stat-Grid + Filter-Toolbars bewusst feature-erhaltend bleiben. Microslice 1 allein liefert bereits den Hauptnutzen; Microslice 2 ist reine Konsistenz-Politur.
