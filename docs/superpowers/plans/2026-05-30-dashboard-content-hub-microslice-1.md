# Dashboard Design-System — `content/hub` Microslice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Gezielter, risikoarmer Header-/Card-Pass auf `content/hub`: Header → `PageHeader` (Violett→Navy) und „Content Freshness"-Card → `SectionCard`. Alle filter-tragenden und hydration-sensiblen Bereiche bleiben unverändert.

**Architecture:** Reuse der bestehenden Primitives aus `components/dashboard/ui/`. Keine API-Erweiterung, keine Logik-/Filter-Änderung.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, Tailwind v4, lucide-react.

**Branch:** `codex/dashboard-sp1-content-hub` · **PR später:** stacked gegen `codex/dashboard-sp1-slice-1-2`.

**Process (binding):** lokal → localhost testen → Abnahme → erst nach Freigabe Push/Merge/Deploy. **Dieser Plan: keine Implementierung jetzt, kein Push, kein PR, kein Deploy.**

---

## 1. Ziel

Die zwei klar risikoarmen, sauber abgegrenzten Bereiche von `content/hub` auf Primitives konsolidieren — ohne die dichte Filter-UI anzufassen.

## 2. Datei im Scope

- `app/(dashboard)/dashboard/content/hub/page.tsx` (einzige Datei)

## 3. Welche Bereiche migriert werden

**A) Header (Z. ~279–296) → `PageHeader`**
Aktuelles Markup (Icon-Box violett + Titel + Button-Zeile) wird ersetzt durch:
```tsx
      {/* Header */}
      <PageHeader
        icon={FileSearch}
        title="Content Hub"
        description="SEO health, content inventory & indexation status across all markets"
        actions={
          <>
            <BacklinkImportButton />
            <ContentHubRefreshButton />
          </>
        }
      />
```
(`bg-violet-50` Icon-Box + `text-violet-500` → schlichtes Navy-Icon; Buttons rechtsbündig via `actions`.)

**B) „Content Freshness"-Card (Z. ~538–552) → `SectionCard`**
```tsx
      {/* Content Freshness */}
      <SectionCard
        title="Content Freshness"
        icon={Clock}
        tone="amber"
        contentClassName="p-5"
        actions={
          <span className="text-xs text-slate-400">
            {Math.round(stats.freshnessCoverage * 100)}% MDX coverage · {stats.freshnessStaleCount} stale · updated daily by freshness-check cron
          </span>
        }
      >
        <WidgetErrorBoundary label="Content Freshness" minHeight="h-48">
          <ContentFreshnessWidget stats={freshnessStats} />
        </WidgetErrorBoundary>
      </SectionCard>
```
(Clock bleibt **amber** — kein Violett, kein Drift. Meta-Zeile wandert in `actions` = rechtsbündig wie zuvor `ml-auto`. Hinweis: SectionCard-`amber`-Tone ist `#D97706` vs. vorher `text-amber-500` `#F59E0B` — minimal kräftiger, bewusst akzeptiert für Token-Konsistenz.)

**Import-Ergänzung** (FileSearch/Clock sind bereits importiert):
```tsx
import { PageHeader, SectionCard } from '@/components/dashboard/ui';
```

## 4. Welche Bereiche bewusst NICHT migriert werden

- **Lokale `StatCard`** (Z. ~145–182) mit `href`/`active`-Filter-Semantik → **bleibt** (Primitive kann das nicht; Migration = Feature-Verlust). Auch das statische „Total Pages"-Violett-Icon bleibt in diesem Microslice.
- **4 Filter-Toolbars** (SEO-Health-Bars, Z. ~360/401/439/494) → **bleiben**.
- **Active-Filter-Banner** (Z. ~519–536, violett) + Stat-Card `active`/`hover`-Violett-Ringe → **bleiben** (Microslice 2).
- **Table-Card** (Z. ~555–574, Hydration-Constraint `<div>`-in-`<table>`) → **bleibt**.
- Keine Änderung an Client-Komponenten, Filter-Logik, `buildHubUrl`, Query-Params.

## 5. Verifikationsschritte (localhost)

- [ ] `npx tsc --noEmit` → keine Fehler in `content/hub`.
- [ ] `npx eslint "app/(dashboard)/dashboard/content/hub/page.tsx"` → keine unused/errors (prüfen, ob durch Header-Ersetzung ein Import ungenutzt wird — unwahrscheinlich, da FileSearch/Clock/Buttons weiter genutzt).
- [ ] `npm run check:imports` → grün.
- [ ] `npm run build` → erfolgreich.
- [ ] Grep-Guard: `grep -nE "violet|purple" app/(dashboard)/dashboard/content/hub/page.tsx` → Header-Violett (Z. ~282/283) **weg**; verbleibend nur die bewusst belassenen Filter-Akzente (lokale StatCard `active`/`hover`, „Total Pages"-Icon, Active-Filter-Banner).
- [ ] localhost visuell (konfigurierter Dev-Port; `DASHBOARD_AUTH_DISABLED=true`; Live-Daten brauchen `SUPABASE_SERVICE_ROLE_KEY`):
  - FileSearch-Header-Icon **navy**; `BacklinkImportButton` + `ContentHubRefreshButton` rechts im Header.
  - „Content Freshness"-Card optisch unverändert (gleiche Border/Shadow/Radius), Meta-Zeile rechts, Widget lädt.
  - **Filter-Funktion unberührt:** Stat-Cards klickbar (Filter), SEO-Health-Bars klickbar, Active-Filter-Banner + Clear-Filter funktionieren.
- [ ] `npm run test:dashboard-smoke` → keine neuen Regressionen (3 vorbestehende Failures unverändert).

## 6. Risiken (kurz)

- **Filter-Funktion brechen** (höchstes Risiko): nur Header + Freshness-Card anfassen; Stat-Grid/Toolbars/Banner unberührt lassen.
- **Meta-Zeile-Layout:** in `actions` rechtsbündig — visuell gegen vorher (`ml-auto`) prüfen; nicht in `description` (würde neben Titel drängen).
- **Amber-Ton-Verschiebung:** Clock-Icon minimal kräftigeres Amber (Token) — bewusst, kein Bug.
- **JSX-Struktur:** beim Ersetzen des Header-`<div className="flex items-start justify-between">`-Blocks sauber schließen (er umschloss Icon-Box + Button-Zeile).

## 7. Abgrenzung zu optionalem Microslice 2

Microslice 2 (noch **nicht** freigegeben, nur möglicher Follow-up) würde das **kohärente Violett-Filter-Akzent-System** gemeinsam normalisieren: lokale StatCard `active`/`hover`-Ringe + Active-Filter-Banner + statisches „Total Pages"-Icon → Brand-Navy. Bewusst getrennt, weil es interaktive Zustände berührt (höheres Risiko) und erst nach erneuter Sichtung entschieden wird. **In Microslice 1 nicht angefasst.**

---

## Self-Review notes
- **Spec coverage:** beide in-scope-Bereiche (Header, Freshness) abgedeckt; alle Non-Goals explizit erhalten.
- **No API changes:** Primitives 1:1; `StatCard`-Filtersemantik bewusst nicht ans Primitive angeflanscht.
- **Single pass:** klein genug für einen Durchgang (2 lokale Ersetzungen + 1 Import).
