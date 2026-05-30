# Dashboard Design-System / Komponenten-Library — Design Spec

> **Sub-Projekt 1 von Increment 3** (Design-System → Saved Views → Cohort/LTV)
> **Datum:** 2026-05-30 · **Status:** Spec zur Review · **Ansatz:** A (Primitives + Pilot + gruppenweiser Rollout)
> **Prozess (verbindlich):** lokal bauen → auf localhost visuell + funktional testen → Abnahme anfordern → **erst nach expliziter Freigabe deployen**. Kein direkter Deploy.

---

## 1. Problem & Ziel

Die 25 Dashboard-Seiten unter `app/(dashboard)/dashboard/*` bauen wiederkehrende UI-Muster jeweils von Hand:

- **Page-Header** als Ad-hoc-`<div><h1 …><p …></div>` — uneinheitlich (`text-slate-800` vs. `text-slate-900`), Header-Icon fast überall `text-violet-500` (Drift vom Brand-System Navy/Gold/Green).
- **Stat-Cards** teils über CSS-Klasse `.dashboard-stat`/`.stat-icon.*`, teils über Inline-Tailwind-Tones (`text-purple-500`).
- **Cards** als Ad-hoc-`<div className="dashboard-card p-6">`.
- **Buttons** mit Inline-Overrides wie `!bg-violet-600 hover:!bg-violet-700`.
- Kein gemeinsames `EmptyState`, keine gemeinsame Filter-Shell.

**Ziel:** Eine schlanke, token-getriebene Dashboard-Primitive-Library, die diese Muster konsolidiert und die klaren Farb-Ausreißer in Shell + Shared Controls zentral auf Brand-Tokens normalisiert — ohne harten Voll-Rebrand und ohne Verhaltensänderung an bestehender Filter-/Query-Param-Logik.

---

## 2. Scope: „Extraction + sanfte Normalisierung"

**In Scope (Sub-Projekt 1):**
- 6 Primitives in neuem Verzeichnis `components/dashboard/ui/`.
- Brand-Button-/Control-Tokens in `app/(dashboard)/dashboard.css` ergänzen.
- Zentrale Normalisierung der **Header-Icon-Farbe** (Default Navy) und der **Button-Farben** (Brand statt Violett) über die Primitives.
- Pilot-Migration von 4 Seiten auf die Primitives.
- Gruppenweiser Rollout auf die restlichen Seiten.

**Non-Goals (explizit ausgeschlossen — Punkt 6):**
- Vollständige Farb-Normalisierung aller Widgets.
- Chart-Paletten (bleiben unverändert).
- Feature-spezifische Akzentfarben in einzelnen Widgets (z. B. `conversion-funnel` KYC-Stufen-Farben).
- Saved Views (Sub-Projekt 2).
- Cohort/LTV (Sub-Projekt 3).
- Fix des `silo-filter-dropdown.tsx`-Hard-Push auf `/dashboard/analytics` (gehört in Sub-Projekt 2 — FilterBar ist hier nur Layout).

---

## 3. Architektur — Primitives

Neues Verzeichnis: **`components/dashboard/ui/`** (dashboard-spezifisch, getrennt von marketing `components/ui/`).
Server Components per Default; `'use client'` **nur** wenn Interaktion nötig.
**Token-Regel (Punkt 3):** Komponenten enthalten keine harten Hexwerte im JSX. Farben kommen ausschließlich aus CSS-Variablen/Klassen in `dashboard.css`.

### 3.1 `PageHeader` (Server Component)
```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Akzent-Override für Sonderfälle; Default = 'navy' (Brand) — Punkt 2 */
  tone?: 'navy' | 'gold' | 'green' | 'red' | 'slate';
  /** Rechtsbündiger Slot für Buttons/Filter */
  actions?: React.ReactNode;
}
```
- Heading einheitlich `text-2xl font-bold text-slate-900`.
- Icon-Farbe aus `tone` → Brand-Token-Klasse. **Default `navy`** normalisiert die `text-violet-500`-Header-Ausreißer zentral; `tone` lässt Ausnahmen bewusst zu.

### 3.2 `StatCard` (Server Component)
```tsx
interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'navy' | 'green' | 'gold' | 'red' | 'slate';
  delta?: { value: string; direction: 'up' | 'down' | 'neutral' };
}
```
- **Konsolidiert das bestehende `.dashboard-stat`/`.stat-icon.*`-Muster (Punkt 5)** — keine Parallelstruktur. Rendert die vorhandenen CSS-Klassen; `tone` mappt auf brand-bereinigte `.stat-icon`-Klassen in `dashboard.css`.

### 3.3 `SectionCard` (Server Component)
```tsx
interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}
```
- Wrapper über die **bestehende `.dashboard-card`-Klasse (Punkt 5)** + optionaler Header-Zeile. Ersetzt Ad-hoc-`<div className="dashboard-card p-6">`.

### 3.4 `ActionButton` (Client/Server je nach Nutzung)
```tsx
interface ActionButtonProps extends ButtonHTMLAttributes {
  variant?: 'primary' | 'cta' | 'success' | 'secondary' | 'danger';
  icon?: LucideIcon;
}
```
- Baut auf bestehendem `components/ui/button.tsx` auf, setzt **nur** Brand-Token-Klassen (Punkt 3): `primary`=Navy, `cta`=Gold, `success`=Green, `secondary`=Slate-Outline, `danger`=Red. Ersetzt Inline-`!bg-violet-600`.

### 3.5 `EmptyState` (Server Component)
```tsx
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

### 3.6 `FilterBar` (Server Component — **nur Layout-Shell, Punkt 4**)
```tsx
interface FilterBarProps {
  children: React.ReactNode; // bestehende TimeRangeSelector / SiloFilterDropdown etc.
}
```
- **Reine Layout-/Shell-Primitive.** Konsistente Anordnung/Spacing der vorhandenen Filter-Controls. **Kein** Persistence-, kein Saved-Views-, kein URL-/Query-Param-Verhalten — bestehendes `searchParams`/`router.push`-Verhalten bleibt 1:1 unverändert. Saved-Views-Dropdown kommt in Sub-Projekt 2.

---

## 4. Token-Änderungen in `app/(dashboard)/dashboard.css`

Additiv, nicht-brechend:
- Button-Token-Klassen für `ActionButton`-Variants (Navy/Gold/Green/Red/Slate) auf Basis der vorhandenen `--sfp-*`-Brand-Variablen.
- Brand-bereinigte `.stat-icon`-Tone-Klassen für `StatCard` (konsolidiert vorhandene `.stat-icon.{green|blue|purple|amber}`; `purple` ist heute bereits Navy-gefärbt).
- **Unangetastet:** `--dash-accent-*`-Tokens, soweit sie Charts/Feature-Akzente speisen.

---

## 5. Slice-Plan (je deploybar, je lokal getestet + Abnahme)

### Slice 1.1 — Library + Pilot
- Alle 6 Primitives in `components/dashboard/ui/` + Index-Export.
- Button-/Stat-Tone-Tokens in `dashboard.css`.
- **Pilot-Migration 4 Seiten** (Punkt 1): `revenue`, `ranking`, `analytics`, `links`.
  Begründung: decken Header + StatCard + SectionCard + ActionButton + reale FilterBar/`searchParams`-Logik (über `analytics`) sauber ab.
- **Betroffene Dateien:**
  - NEU: `components/dashboard/ui/{page-header,stat-card,section-card,action-button,empty-state,filter-bar,index}.tsx`
  - EDIT: `app/(dashboard)/dashboard.css`
  - EDIT: `app/(dashboard)/dashboard/revenue/page.tsx`
  - EDIT: `app/(dashboard)/dashboard/ranking/page.tsx`
  - EDIT: `app/(dashboard)/dashboard/analytics/page.tsx`
  - EDIT: `app/(dashboard)/dashboard/links/page.tsx`

### Slice 1.2 — Rollout Gruppen *Overview* + *Content & SEO*
- Restliche Seiten dieser beiden Sidebar-Gruppen auf Primitives (heatmap, optimize, content/hub, content/genesis, content/planning, competitors, competitors/gaps, backlinks).

### Slice 1.3 — Rollout Gruppen *Monetization* + *Operations*
- Restliche Seiten (funnel, opportunities, ab-testing, quiz, tools/money-leak, compliance, web-vitals, autonomous, cron-health, audit-log, notifications, settings).

---

## 6. localhost-Routen für die Prüfung (Slice 1.1)

| Route | Prüf-Fokus |
|---|---|
| `/dashboard/revenue` | PageHeader, StatCard, SectionCard, ActionButton (Export-Button) |
| `/dashboard/ranking` | PageHeader (Icon Navy statt Violett), SectionCard |
| `/dashboard/analytics` | PageHeader + **FilterBar** (TimeRange/Silo), StatCards, Filter-Verhalten unverändert |
| `/dashboard/links` | PageHeader, ActionButton (vorher `!bg-violet-600`) |

---

## 7. Test-Checkliste (Slice 1.1)

**Visuell (localhost via preview_screenshot/snapshot):**
- [ ] Header-Icons auf allen 4 Pilotseiten in Brand-Navy (kein Violett mehr).
- [ ] Headings einheitlich `text-2xl font-bold text-slate-900`.
- [ ] „Create Link"-Button (`/dashboard/links`) in Brand-Farbe statt Violett.
- [ ] StatCards optisch identisch/konsistent zur bisherigen `.dashboard-stat`-Optik.
- [ ] SectionCards: gleiche Border/Shadow/Radius wie bisher (`.dashboard-card`).
- [ ] Keine Layout-Regression im Shell (Sidebar, KPI-Header, Topbar).

**Funktional:**
- [ ] `/dashboard/analytics`: TimeRange-Wechsel (24h/7d/30d/all) ändert `?range=` und lädt Daten — Verhalten **unverändert**.
- [ ] `/dashboard/analytics`: Silo-Filter ändert `?silo=` — Verhalten **unverändert**.
- [ ] Keine Console-Errors / Hydration-Mismatches (preview_console_logs).
- [ ] `npm run build` / Typecheck grün; `npm run check:imports` grün (keine `'use server'`-Imports in Client-Primitives).

**Regression-Guard:**
- [ ] Keine harten Hexwerte im JSX der neuen Primitives (Punkt 3).
- [ ] Charts / Feature-Akzente unverändert (Non-Goals nicht berührt).

---

## 8. Risiken & Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Visueller Churn / unerwartete Look-Änderung | Nur 4 Pilotseiten in Slice 1.1; lokal verifizieren vor Abnahme |
| StatCard weicht optisch ab | Auf bestehende `.dashboard-stat`-Klassen aufsetzen, nicht neu erfinden |
| `'use server'`-Bundling-Crash (Turbopack) | Primitives als Server Components; `check:imports` im Test |
| FilterBar verändert versehentlich Query-Verhalten | FilterBar strikt nur Layout; bestehende Selector-Komponenten unverändert einbinden |

---

## 9. Offene Punkte für Folge-Sub-Projekte (nicht hier)
- SP2 Saved Views: FilterBar erhält Saved-Views-Dropdown + DB-Tabelle + Persistence; dabei `silo-filter-dropdown.tsx`-Hard-Push-Bug auf `pathname` fixen.
- SP3 Cohort/LTV: nutzt Primitives + Saved-Views-Mechanik.
