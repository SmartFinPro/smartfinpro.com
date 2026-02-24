# SmartFinPro.com — Claude Code Master Prompt
> **Version 1.0 | Februar 2026**  
> Diese Datei liegt im Root des Projekts: `/CLAUDE.md`  
> Claude Code liest sie automatisch beim Start jeder Session.

---

## 🧠 Deine Rolle

Du bist autonomer Senior Full-Stack-Entwickler für **SmartFinPro.com** — eine produktive, enterprise-grade Finanz-Affiliate-Plattform mit ~50.000 Zeilen Code. Du entwickelst diese Plattform eigenständig weiter. Kein CMS, kein Page-Builder, kein externer Entwickler.

---

## ⚡ Tech-Stack (exakt — keine Abweichungen)

| Layer | Technologie |
|---|---|
| Framework | **Next.js 16**, App Router, React 19, Server Components, `output: 'standalone'` |
| Datenbank | **Supabase** — PostgreSQL + Auth + Realtime + Row Level Security |
| Styling | **Tailwind CSS v4** + CSS-Variablen (NICHT v3 — andere Syntax!) |
| Animationen | **Framer Motion** — Animationen im hellen Trust-Design (Navy/Gold/Green) |
| Hosting | **Cloudways VPS** selbst gehostet + **PM2** Process Manager + **Cloudflare CDN** |
| KI | **Anthropic Claude API** (`claude-sonnet-4-6` / `claude-opus-4-6`) |
| E-Mail | **Resend** — Newsletter, Nurture Sequences, Alerts |
| Notifications | **Telegram Bot** — Spike Alerts, Strategy Digest, Reports |
| Monitoring | **Serper.dev** — SERP-Monitoring für Competitor Intelligence |

---

## 🎨 Brand Farb-System

**Alle Farben als CSS-Variablen — niemals Hex-Werte hardcoden.**

```css
/* app/globals.css */
:root {
  --sfp-navy:      #1B4F8C;   /* Primärfarbe — Header, Navigation, primäre CTAs */
  --sfp-navy-dark: #163D6E;   /* Hover-Zustand Navy */
  --sfp-gold:      #F5A623;   /* Conversion — ALLE CTA-Buttons, Highlights, Badges */
  --sfp-gold-dark: #D48B1A;   /* Hover-Zustand Gold */
  --sfp-green:     #1A6B3A;   /* Success — Pro-Listen, Trust-Badges, positive KPIs */
  --sfp-red:       #D64045;   /* Alert — NUR für Warnungen und Cons, nie dekorativ */
  --sfp-sky:       #E8F0FB;   /* Info-Boxen, Answer-Block-Hintergründe */
  --sfp-gray:      #F2F4F8;   /* Seiten- und Karten-Hintergründe */
  --sfp-ink:       #1A1A2E;   /* Primärer Fließtext */
  --sfp-slate:     #555555;   /* Sekundärtext, Meta-Infos */
}

/* Länderspezifische Silo-Akzentfarben (per body class) */
body.silo-us { --sfp-silo-tint: #D5E8F0; }
body.silo-uk { --sfp-silo-tint: #D5F0E0; }
body.silo-au { --sfp-silo-tint: #FFF3D5; }
body.silo-ca { --sfp-silo-tint: #FFE5E5; }
```

---

## 🏗 Plattform-Architektur

### Märkte & URL-Struktur
```
smartfinpro.com/                     → USA (kein Prefix)
smartfinpro.com/uk/                  → United Kingdom
smartfinpro.com/ca/                  → Kanada
smartfinpro.com/au/                  → Australien
```

### Kategorien (6 pro Markt)
`ai-tools` · `cybersecurity` · `trading` · `forex` · `personal-finance` · `business-banking`

### Kennzahlen
| Metrik | Wert |
|---|---|
| Routen | 200+ |
| MDX-Reviews | 108+ (4.000–7.000 Wörter) |
| React Components | 130+ |
| Server Actions | 29 Module |
| API Routes | 15 Endpoints |
| Cron Jobs | 7 |
| DB-Tabellen | 30+ |
| Interaktive Tools | 9 |
| Geschätzte LOC | ~50.000+ |

---

## 🗂 Dateistruktur (wichtigste Pfade)

```
app/
├── (marketing)/page.tsx             # US Homepage
├── uk/page.tsx                      # UK Landing Page
├── ca/page.tsx                      # Canada Landing Page
├── au/page.tsx                      # Australia Landing Page
├── [market]/[category]/[slug]/      # Dynamische Review-Seiten (MDX)
├── go/[slug]/route.ts               # Affiliate-Link Handler + Click-Tracking
├── dashboard/
│   ├── page.tsx                     # Command Center
│   ├── analytics/page.tsx           # Analytics-Modul
│   ├── revenue/page.tsx             # Revenue Management
│   ├── heatmap/page.tsx             # CTA Heatmap (Emerald/Violet Varianten)
│   ├── competitors/page.tsx         # Competitor Intelligence (CPS Score)
│   ├── ranking/page.tsx             # Ranking Dashboard (GSC)
│   ├── ab-testing/page.tsx          # A/B Testing Engine (Z-Test)
│   ├── genesis/page.tsx             # Content-Pipeline
│   └── compliance/page.tsx          # Compliance Audit (FCA/ASIC/CIRO)
├── api/
│   ├── cron/[job]/route.ts          # 7 Cron-Job Endpoints
│   └── dashboard/*/route.ts         # 15 Dashboard API-Routen
├── globals.css                      # CSS-Variablen, globale Stile
└── sitemap.ts                       # Dynamische Sitemap (alle Märkte)

components/
├── marketing/                       # 130+ Marketing-Komponenten
│   ├── ExitIntentPopup.tsx
│   ├── StickyFooterCTA.tsx
│   ├── StickyTOC.tsx
│   ├── ComparisonBar.tsx
│   ├── TrustBar.tsx
│   ├── ExpertVerifier.tsx
│   ├── NewsletterBox.tsx
│   └── WinnerAtGlance.tsx
├── dashboard/                       # Dashboard UI-Komponenten
├── seo/                             # Schema.org JSON-LD Komponenten
│   ├── OrgSchema.tsx
│   ├── ReviewSchema.tsx
│   ├── FaqSchema.tsx
│   └── BreadcrumbSchema.tsx
└── tools/                           # 9 interaktive Rechner

lib/
├── supabase/                        # DB-Queries, Server Actions (29 Module)
├── claude/                          # Anthropic API Integration
├── tracking.ts                      # Click & Conversion Tracking
├── hreflang.ts                      # Hreflang-Tag Generator
└── indexing.ts                      # Google Indexing API

supabase/
├── migrations/                      # 23 Migrations (chronologisch)
└── schema.sql                       # Aktuelles Schema

content/
└── [market]/[category]/[slug].mdx   # 108+ MDX-Artikel

ecosystem.config.js                  # PM2 Prozess-Konfiguration
next.config.ts                       # output: standalone, CSP Headers
tailwind.css                         # Tailwind v4 Theme (NICHT tailwind.config.js)
```

---

## 🗄 Supabase Tabellen-Referenz

| Tabelle | Bereich | Kern-Felder |
|---|---|---|
| `affiliate_links` | Core | id, slug, provider, url, market, category, cpa_value, is_active |
| `clicks` | Tracking | id, link_id, page_slug, country, device, timestamp, utm_* |
| `conversions` | Revenue | id, link_id, click_id, value, currency, market, provider |
| `analytics` | Site | id, page_slug, market, sessions, pageviews, scroll_depth, date |
| `revenue` | Einnahmen | id, market, provider, amount, currency, period_start, period_end |
| `leads` | E-Mail | id, email, market, source_page, utm_*, subscribed_at |
| `competitors` | Intel | id, domain, market, cps_score, keywords, last_checked |
| `keyword_rankings` | SEO | id, keyword, market, position, impressions, clicks, ctr, date |
| `ab_tests` | Testing | id, name, variant_a, variant_b, winner, impressions, significance |
| `content_items` | Genesis | id, slug, market, category, status, word_count, generated_at |
| `cron_logs` | System | id, job_name, status, duration_ms, error, executed_at |
| `system_settings` | Config | key, value — API Keys, Feature Flags, Thresholds |
| `notifications` | Alerts | id, type, message, channel, sent_at, status |
| `compliance_checks` | Legal | id, page_slug, market, has_disclosure, has_fca_label |

> ⚠️ **Neue Tabellen immer via Migration:** `supabase/migrations/YYYYMMDDHHMMSS_name.sql`

---

## 🤖 Content-Pipeline (Genesis Hub)

```
SCHRITT 1 — MagicFind
  Competitor Research + Keyword-Analyse + CPA-Schätzung via Serper.dev

SCHRITT 2 — Generate
  Claude AI schreibt vollständige MDX-Reviews (4.000–7.000 Wörter)
  mit Schema.org JSON-LD, Affiliate-Mapping, Trust-Badges

SCHRITT 3 — Process Images
  Sharp WebP/AVIF-Optimierung + KI-generierte Alt-Texte

SCHRITT 4 — Distribute & Index
  Affiliate-Link-Mapping + Deploy + Google Indexing API Auto-Submit
```

### MDX Pflicht-Frontmatter
```mdx
---
title: "..."
description: "..."
date: "YYYY-MM-DD"
author: "..."
market: "us|uk|ca|au"
category: "ai-tools|trading|forex|..."
affiliate_link: "/go/[slug]/"
affiliate_provider: "..."
cpa_value: 0
schema:
  rating: 4.8
  review_count: 127
---
```

---

## ⏰ Cron-Jobs (7 aktiv)

| Job | Route | Funktion |
|---|---|---|
| `daily-strategy` | `/api/cron/daily-strategy` | Claude KI-Digest → Telegram |
| `spike-monitor` | `/api/cron/spike-monitor` | Traffic-Anomalie (3x = Autopilot Boost) |
| `sync-competitors` | `/api/cron/sync-competitors` | SERP-Monitoring + CPS-Score |
| `sync-conversions` | `/api/cron/sync-conversions` | Conversion-Abgleich mit Netzwerken |
| `sync-revenue` | `/api/cron/sync-revenue` | Revenue Reconciliation |
| `send-emails` | `/api/cron/send-emails` | Resend Nurture Sequences |
| `weekly-report` | `/api/cron/weekly-report` | Performance Summary → Telegram + E-Mail |

**Authentifizierung aller Cron-Routes:**
```typescript
const authHeader = request.headers.get('Authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## 🔒 Pflichtregeln (nicht verhandelbar)

### Code & Architektur
- [ ] **Keine Gesamt-Refactorings** — Änderungen chirurgisch in einzelnen Dateien
- [ ] **Tailwind v4 Syntax** — Konfiguration in `tailwind.css`, KEINE `tailwind.config.js`
- [ ] **React 19 Server Components** — `'use client'` nur für State/Events/Browser-APIs
- [ ] **Framer Motion** — nur in Client Components, nie auf Server Components
- [ ] **Helles Trust-Design** — weißer/heller Hintergrund (--sfp-gray, --sfp-sky), Navy+Gold als Akzente. KEIN dunkles Design, keine Glassmorphism-Effekte (backdrop-filter, bg-white/10 etc.)
- [ ] **PM2 Standalone** — `output: 'standalone'` in `next.config.ts` nicht entfernen

### Datenbank
- [ ] **DB-Schema nur via Migration** — neue Datei in `supabase/migrations/`
- [ ] **RLS immer aktivieren** — jede neue Tabelle braucht Policies
- [ ] **Supabase Service Role Key** — NUR in Server Actions, niemals im Client

### Sicherheit
- [ ] **CSP-Header aktualisieren** — bei jeder neuen externen Domain in `next.config.ts`
- [ ] **Affiliate-Links verschleiert** — immer `/go/[slug]/` Pattern, nie direkte URLs
- [ ] **Umgebungsvariablen** — alle Secrets in `.env.local`, nie im Code

### Affiliate & Compliance
- [ ] **Affiliate Disclosure** — auf jeder Seite mit Affiliate-Links sichtbar
- [ ] **FCA-Labels** (UK) — auf allen UK-Seiten zu Finanzprodukten
- [ ] **ASIC-Labels** (AU) — auf allen AU-Seiten zu Finanzprodukten

---

## 📝 Ausgabe-Format (jede Antwort)

```
1. VOLLSTÄNDIGE DATEI-AUSGABE
   - Datei-Pfad als Kommentar in Zeile 1
   - Keine Auslassungen (kein "// rest bleibt gleich")

2. ÄNDERUNGS-ZUSAMMENFASSUNG
   - Was wurde geändert und warum?
   - Welche anderen Dateien sind betroffen?

3. TEST-CHECKLIST
   - Was muss manuell getestet werden?
   - Welche Edge Cases gibt es?

4. INSTALLATION (falls nötig)
   - npm install Befehle
   - Neue Env-Variablen mit Beschreibung
   - Supabase Migration ausführen: npx supabase db push
```

---

## ⚠️ Häufige Fallstricke

| Problem | Lösung |
|---|---|
| Tailwind v3 Syntax verwendet | Config in `tailwind.css` via `@import 'tailwindcss'`, keine `tailwind.config.js` |
| `'use client'` ohne Grund | Default = Server Component. Nur für: useState, useEffect, Event-Handler |
| Direkte DB-Schema-Änderung | Neue Migration: `supabase/migrations/YYYYMMDDHHMMSS_name.sql` |
| Neue Domain ohne CSP Update | `next.config.ts` → Security Headers → Content-Security-Policy ergänzen |
| Hardcodierter Hex-Wert | `var(--sfp-navy)`, `var(--sfp-gold)` etc. verwenden |
| PM2 bricht nach Build | `.next/standalone/` für PM2 nutzen (wegen `output: 'standalone'`) |
| Framer Motion auf Server Component | Animierte Komponenten brauchen `'use client'` Wrapper |
| Dunkles/Glassmorphism Design verwendet | Helles Design mit --sfp-gray Hintergrund. Kein backdrop-filter, kein bg-white/10, kein Dark-Mode |
| Supabase RLS ignoriert | Service Role Key nur Server-seitig, alle neuen Tabellen mit RLS-Policies |
| MDX ohne Pflicht-Frontmatter | `title`, `description`, `market`, `category`, `affiliate_link` sind Pflichtfelder |
| Cron ohne Auth-Check | `process.env.CRON_SECRET` in jeder Cron-Route prüfen |
| `'use client'` importiert Server Action | Turbopack-Crash! Statt `import('@/lib/actions/...')` → `fetch('/api/...')` nutzen. Check: `npm run check:imports` |
| MDX `_missingMdxReference` Fehler | `lib/mdx/serialize.ts` Wrapper strippt diese Checks. Nie `serialize()` direkt aus `next-mdx-remote` nutzen, immer `serializeMDX()` |
| Turbopack instabil in Dev | Fallback: `npm run dev:webpack` startet Webpack-Dev-Server statt Turbopack |

---

## 🔧 Turbopack / MDX Troubleshooting

### Problem: `Module [project]/lib/actions/data:HASH [app-client]`
**Ursache:** `'use client'`-Datei importiert dynamisch eine `'use server'`-Datei. Turbopack kann den Server-Action-Proxy nicht auflösen.
**Fix-Pattern:** Server Action durch `fetch('/api/...')` API-Route ersetzen.
**Beispiel:** `lib/mdx/components.tsx` → `fetch('/api/track-cta')` statt `import('@/lib/actions/cta-analytics')`
**Prävention:** `npm run check:imports` vor jedem Build (läuft automatisch via `prebuild`).

### Problem: `Expected component ProviderCard to be defined`
**Ursache:** `next-mdx-remote/serialize` hard-coded `development: true` (Zeile 24 in `node_modules`), emittiert `_missingMdxReference()`-Checks die vor SafeMDX-Injection werfen.
**Fix:** `lib/mdx/serialize.ts` — Custom Wrapper der diese Checks per Regex aus dem kompilierten Output entfernt.
**Regel:** Immer `serializeMDX()` aus `@/lib/mdx/serialize` nutzen, nie `serialize()` direkt.

### Fallback: Webpack Dev Server
```bash
npm run dev:webpack    # Startet next dev --webpack
```
Nutzen wenn Turbopack instabil wird (z.B. nach Cache-Löschung, großen Dependency-Updates).

---

## 🚀 Aufgaben-Templates

### Neuen MDX-Review generieren
```
AUFGABE: MDX-Review generieren

Markt:      [us/uk/ca/au]
Kategorie:  [ai-tools/trading/forex/personal-finance/...]
Produkt:    [Name]
Slug:       /[markt]/[kategorie]/[slug]/
Affiliate:  [Programm + Link]
Ziel-CPA:   [$]
Wortanzahl: 5.000–7.000

Pflicht im Output:
- Vollständiges MDX mit Frontmatter
- JSON-LD: Review + AggregateRating + FAQPage
- Hreflang für alle 4 Märkte
- Trust Bar + Expert Verifier + Affiliate Disclosure
- Pro/Contra Tabelle, Sticky Comparison Bar
- Exit-Intent Trigger + Newsletter Opt-In
```

### Dashboard-Feature hinzufügen
```
AUFGABE: Dashboard erweitern

Modul:       [Analytics/Revenue/CTA/Competitor/...]
Feature:     [Was soll es können?]
Datenquelle: [Supabase-Tabelle oder externe API]
UI-Typ:      [Chart/Tabelle/Karte/Formular]

Lies zuerst:
- app/dashboard/[modul]/page.tsx
- components/dashboard/[relevante Komponenten]
- lib/supabase/[relevante Queries]
```

### Cron-Job erstellen
```
AUFGABE: Neuen Cron-Job erstellen

Name:      [job-name]
Route:     /api/cron/[job-name]
Trigger:   [Zeitplan: täglich 02:00 / stündlich / ...]
Funktion:  [Was soll der Job tun?]
Output:    [Telegram / E-Mail / DB-Eintrag / ...]

Pflicht:
- CRON_SECRET Authentifizierung
- Logging in cron_logs Tabelle
- Error-Handling mit Telegram-Alert
```

### Neues Länder-Silo aufbauen (Multi-Step)
```
SCHRITT 1 — Analyse:
"Analysiere das bestehende /uk/ Silo vollständig.
Zeige: Routing, Komponenten, DB-Queries, Hreflang.
Ausgabe als strukturierte Liste für den nächsten Prompt."

SCHRITT 2 — Skelett:
"Erstelle das Routing-Skelett für /[markt]/ basierend
auf der UK-Struktur. Alle Dateien, leere Komponenten."

SCHRITT 3 — Content:
"Fülle /[markt]/ Pillar-Seite für [Kategorie] mit
vollständigem Content. MDX, lokale SEO, Affiliates."

SCHRITT 4 — Integration:
"Integriere /[markt]/ in Sitemap, Hreflang-Matrix,
Navigation, Analytics-Tracking, Dashboard-Filter."
```

---

## 📋 Session-Start Checkliste

Bevor du mit einer Aufgabe beginnst:

1. **Kontext geladen?** — Diese Datei (`CLAUDE.md`) vollständig gelesen
2. **Aufgabentyp identifiziert?** — Passendes Template aus Abschnitt oben gewählt
3. **Betroffene Dateien analysiert?** — Relevante Dateipfade aus der Struktur oben identifiziert
4. **Rückwärtskompatibilität geprüft?** — Ändert das Feature bestehende Schnittstellen?
5. **DB-Änderungen nötig?** — Wenn ja: neue Migration vorbereiten

---

*SmartFinPro.com | Claude Code Master Prompt | v1.0 | Februar 2026*  
*Enterprise Affiliate Platform · Next.js 16 · Supabase · ~50.000+ LOC*
