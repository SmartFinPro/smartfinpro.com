# SmartFinPro.com — Architektur-Referenz
> **Version 1.0 | Februar 2026**
> Master-Dokument für KI-gestützte Entwicklung & Skalierung.
> Muss bei jedem architekturrelevanten Change aktualisiert werden.

---

## 1. Tech Stack & Infrastruktur

### 1.1 Anwendung

| Schicht | Technologie | Details |
|---|---|---|
| **Framework** | Next.js 16.1.6 | App Router, React 19, Server Components, Turbopack |
| **Rendering** | Static Generation (SSG) | 260 statische Seiten, ISR (1d revalidate) für Reviews |
| **Styling** | Tailwind CSS v4 | Config in `tailwind.css` — **nicht** `tailwind.config.js` |
| **Animationen** | Framer Motion | Nur in Client Components (`'use client'`) |
| **Content** | MDX (next-mdx-remote) | 108+ Reviews, 4.000–7.000 Wörter pro Artikel |
| **Datenbank** | Supabase (PostgreSQL) | 30+ Tabellen, RLS, 25 Migrations |
| **KI** | Anthropic Claude API | `claude-sonnet-4-6` / `claude-opus-4-6` für Content-Generierung |
| **E-Mail** | Resend | Newsletter, Nurture Sequences, Transaktionale E-Mails |
| **Monitoring** | Serper.dev | SERP-Monitoring, Competitor Intelligence |
| **Alerts** | Telegram Bot | Spike Alerts, Daily Strategy Digest, Weekly Reports |

### 1.2 Hosting & Infrastruktur

```
User → Cloudflare CDN → Cloudflare Zero Trust (Dashboard) → Cloudways VPS → PM2 Cluster → Next.js Standalone
```

| Schicht | Technologie | Konfiguration |
|---|---|---|
| **CDN** | Cloudflare | DNS, DDoS-Schutz, Brotli-Kompression, Edge-Caching |
| **VPS** | Cloudways (DigitalOcean) | 2 GB RAM, Node.js Stack |
| **Process Manager** | PM2 | Cluster-Modus (`instances: 'max'`), Zero-Downtime Reloads |
| **Build Output** | `output: 'standalone'` | `.next/standalone/server.js` — selbstständig lauffähig |
| **Domain** | OrangeWebsite (Island) | WHOIS-Schutz, Privacy-Jurisdiktion |
| **Rechtsform** | Wyoming LLC | Juristischer Schutz, US-Geschäftsstruktur |

### 1.3 PM2 Cluster-Konfiguration

```javascript
// ecosystem.config.js — Produktionsrelevante Einstellungen
{
  name: 'SmartFinPro-Live',
  script: '.next/standalone/server.js',
  instances: 'max',              // 1 Worker pro CPU-Core
  exec_mode: 'cluster',          // Zero-Downtime Reloads
  max_memory_restart: '1G',      // Hard-Restart bei 1 GB RSS
  max_restarts: 15,              // Max 15 Restarts
  kill_timeout: 8000,            // 8s Graceful Shutdown
  node_args: '--max-old-space-size=1024 --dns-result-order=ipv4first',
  log_type: 'json',              // Strukturiertes Logging
}
```

### 1.4 Deployment-Prozess

```bash
# Auf dem VPS (via SSH):
cd /home/master/applications/smartfinpro/public_html
git pull origin main
npm run build              # Generiert .next/standalone + 260 statische Seiten
pm2 reload SmartFinPro-Live --update-env   # Zero-Downtime Reload
```

> **WARNUNG:** Entferne niemals `output: 'standalone'` aus `next.config.ts` — PM2 benötigt die standalone-Ausgabe.

---

## 2. Security & Defense-in-Depth

### 2.1 Zwei-Schlösser-Prinzip (Dashboard-Zugang)

Das `/dashboard` ist durch zwei unabhängige Sicherheitsschichten geschützt:

```
Angreifer → [Schloss 1: Cloudflare Zero Trust] → [Schloss 2: Middleware Auth Gate] → Dashboard
```

**Level 1 — Netzwerk (Cloudflare Zero Trust / Access)**
- Cloudflare Access verlangt YubiKey/WebAuthn-Authentifizierung
- Blockiert jeden nicht-authentifizierten Request **bevor** er den VPS erreicht
- Konfiguration über Cloudflare Dashboard (nicht im Code)

**Level 2 — Applikation (Next.js Middleware)**
- Login über URL-Parameter: `/dashboard?auth=DASHBOARD_SECRET`
- Setzt ein HttpOnly-Cookie (`sfp-dash-auth`) mit folgenden Attributen:

```typescript
// middleware.ts — Dashboard Auth Gate
response.cookies.set('sfp-dash-auth', dashSecret, {
  httpOnly: true,       // Kein JavaScript-Zugriff
  secure: true,         // Nur über HTTPS
  sameSite: 'strict',   // Kein Cross-Site-Zugriff
  maxAge: 60 * 60 * 24 * 7,  // 7 Tage TTL
  path: '/dashboard',   // Nur für Dashboard-Routen gültig
});
```

- Bei fehlendem/ungültigem Cookie → HTTP 401 Response
- Bei fehlendem `DASHBOARD_SECRET` in Production → HTTP 503 (Dashboard komplett deaktiviert)

### 2.2 Security Headers (Financial-Grade)

Ziel: **securityheaders.com A+ Rating**

Konfiguriert in `next.config.ts`:

| Header | Wert | Zweck |
|---|---|---|
| `Content-Security-Policy` | Striktes Whitelist (self, Supabase, Plausible, GTM) | XSS-Prävention |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HSTS — erzwingt HTTPS für 2 Jahre |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking-Schutz |
| `X-Content-Type-Options` | `nosniff` | MIME-Sniffing-Schutz |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Kontrollierte Referrer-Weitergabe |
| `Permissions-Policy` | Kamera, Mikrofon, Geolocation etc. deaktiviert | Feature-Einschränkung |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | Isolierung (Affiliate-Popups erlaubt) |
| `X-Powered-By` | Entfernt (`poweredByHeader: false`) | Fingerprinting-Schutz |

### 2.3 Rate Limiting

In-Memory Sliding-Window Rate Limiter (`lib/security/rate-limit.ts`):

```typescript
// Vorkonfigurierte Limiter
affiliateRedirectLimiter  → 30 req/min pro IP  (Affiliate-Redirects)
genesisApiLimiter         → 10 req/min pro IP  (KI-API-Aufrufe)
webhookLimiter            → 60 req/min pro IP  (Webhook-Endpoints)
```

**Automatische Bereinigung:** Stale Entries werden alle 5 Minuten entfernt (Memory-Leak-Prävention).

> **Regel für Skalierung:** Bei Bedarf durch Redis/Upstash oder Cloudflare Rate Limiting ersetzen.

### 2.4 Cron-Job-Authentifizierung

Alle 7 Cron-Endpunkte sind durch `CRON_SECRET` geschützt:

```bash
# Crontab-Eintrag (VPS):
*/15 * * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/spike-monitor >> logs/cron.log 2>&1
```

```typescript
// Pattern in jeder Cron-Route:
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret || cronSecret.startsWith('your-')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const isAuthenticated = authHeader === `Bearer ${cronSecret}`;
if (!isAuthenticated && process.env.NODE_ENV !== 'development') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2.5 Affiliate-Link-Schutz

Alle Affiliate-Links sind verschleiert über `/go/[slug]/`:

```typescript
// app/(marketing)/go/[slug]/route.ts
// 1. Rate Limiting (30 req/min)
// 2. Registry-Lookup (Cache-Layer)
// 3. Click-Tracking (Supabase: IP-Hash, UTM, Geo, SubID)
// 4. 307 Temporary Redirect (SEO-safe)
```

> **WARNUNG:** Direkte Affiliate-URLs dürfen niemals im Frontend erscheinen. Immer `/go/[slug]/` verwenden.

### 2.6 Zusammenfassung Sicherheitsmaßnahmen

| Maßnahme | Implementierung |
|---|---|
| Dashboard-Zugang | Cloudflare Zero Trust + Middleware Cookie-Auth |
| HSTS | 2 Jahre, includeSubDomains, preload |
| CSP | Striktes Whitelist, kein `unsafe-eval` |
| Rate Limiting | In-Memory Sliding Window pro Route |
| Cron-Schutz | Bearer-Token via `CRON_SECRET` |
| Affiliate-Verschleierung | `/go/[slug]/` mit 307-Redirect |
| Source Maps | Deaktiviert in Production |
| Console-Logs | `removeConsole` in Production (nur error/warn) |
| Compression | Node.js gzip + Cloudflare Brotli |

---

## 3. Datenbank-Strategie (Supabase)

### 3.1 Architektur

```
Client Components → Anon Key (lib/supabase/client.ts) → RLS-geschützte Queries
Server Actions     → Service Role Key (lib/supabase/server.ts) → Voller DB-Zugriff
```

**Zwei Clients:**

```typescript
// CLIENT — Browser (nur für RLS-geschützte öffentliche Daten)
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// SERVER — Server Actions & API Routes (voller Zugriff)
// lib/supabase/server.ts
export function createServiceClient() {
  return createServerClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
```

> **REGEL:** Der `SUPABASE_SERVICE_KEY` darf **ausschließlich** in Server Actions, API Routes und Cron-Jobs verwendet werden. Niemals in Client Components oder im Browser.

### 3.2 Migration-Strategie

- 25 Migrations in `supabase/migrations/`
- Namenskonvention: `YYYYMMDDHHMMSS_beschreibung.sql`
- Anwendung: `npx supabase db push`

> **REGEL:** Schema-Änderungen immer als neue Migration. Niemals bestehende Migrations editieren. Jede neue Tabelle muss RLS-Policies haben.

### 3.3 Parametrisierte Queries

> **REGEL:** Alle Queries müssen strikt parametrisiert sein — **niemals** String-Interpolation für SQL.

```typescript
// ✅ RICHTIG — Parametrisiert
const { data } = await supabase
  .from('affiliate_links')
  .select('*')
  .eq('slug', userInput)
  .single();

// ❌ FALSCH — SQL-Injection-Risiko
const { data } = await supabase.rpc('custom_query', {
  raw_sql: `SELECT * FROM links WHERE slug = '${userInput}'`
});
```

### 3.4 Tabellenübersicht (Kernbereiche)

| Bereich | Tabellen | Zweck |
|---|---|---|
| **Core** | `affiliate_links`, `clicks`, `conversions` | Affiliate-Tracking & Revenue |
| **Content** | `content_items`, `content_overrides` | Genesis Pipeline & Overrides |
| **Analytics** | `analytics`, `cta_analytics`, `keyword_rankings` | Traffic & SEO-Daten |
| **Revenue** | `revenue`, `affiliate_rates` | Einnahmen & CPA-Raten |
| **Users** | `leads`, `subscribers`, `email_sequences` | E-Mail-Marketing |
| **Intel** | `competitors`, `keyword_gaps` | Competitor Intelligence |
| **System** | `cron_logs`, `system_settings`, `notifications` | Infrastruktur |
| **Testing** | `ab_tests`, `ab_test_hub` | A/B Testing Engine |

---

## 4. State-Management & Datenfluss

### 4.1 Calculator-Pattern (verbindlich für alle Tools)

SmartFinPro-Calculators folgen einem strikten, einheitlichen Pattern:

```
'use client' Component
  └─ useState() für jeden Input-Parameter (Slider/Toggle/Select)
  └─ useMemo() für berechnete Ergebnisse (reagiert auf Input-Änderungen)
  └─ JSX: Input-Sektion (links) | Ergebnis-Sektion (rechts)
```

**Referenz-Implementierung:** `components/tools/ca-mortgage-affordability-calculator.tsx`

#### Schritt 1: Interface für Ergebnisse definieren

```typescript
interface AffordabilityResults {
  maxHomePrice: number;
  monthlyMortgagePayment: number;
  gdsRatio: number;
  tdsRatio: number;
  isAffordable: boolean;
  // ... alle berechneten Werte
}
```

#### Schritt 2: State-Variablen für alle Inputs

```typescript
export function CAMortgageAffordabilityCalculator() {
  // Jeder Input hat seinen eigenen useState
  const [annualIncome, setAnnualIncome] = useState(85000);
  const [monthlyDebt, setMonthlyDebt] = useState(500);
  const [downPayment, setDownPayment] = useState(50000);
  const [interestRate, setInterestRate] = useState(5.49);
  const [amortization, setAmortization] = useState<25 | 30>(25);
```

#### Schritt 3: useMemo für Berechnungen

```typescript
  const results: AffordabilityResults = useMemo(() => {
    // Alle Berechnungen hier — wird nur neu berechnet wenn
    // sich ein Dependency-Wert ändert
    const grossMonthlyIncome = annualIncome / 12;
    // ... komplexe Finanzberechnungen
    return { maxHomePrice, gdsRatio, tdsRatio, isAffordable, ... };
  }, [annualIncome, monthlyDebt, downPayment, interestRate, amortization, ...]);
```

#### Schritt 4: Layout-Pattern (Desktop 2-Spalten)

```tsx
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* LINKS: Inputs mit Slidern */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            {/* Slider-Inputs */}
          </div>
          {/* Warnhinweise & Disclaimers */}
        </div>

        {/* RECHTS: Ergebnisse */}
        <div className="space-y-6">
          {/* Highlight-Karte mit Hauptergebnis */}
          {/* Detail-Karten mit Breakdown */}
          {/* CTA zum passenden Affiliate */}
        </div>
      </div>
    </div>
  );
```

### 4.2 Design-System für Calculators

| Element | Styling |
|---|---|
| Container | `rounded-2xl border border-gray-200 bg-white shadow-sm p-6` |
| Input-Label | `text-sm font-medium` + `style={{ color: 'var(--sfp-slate)' }}` |
| Value-Badge | `px-3 py-1 rounded-full` + `style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}` |
| Highlight-Karte | `rounded-2xl p-6 text-white` + `style={{ background: 'var(--sfp-green)' }}` oder `var(--sfp-red)` |
| Progress-Bar | `h-2 rounded-full overflow-hidden bg-gray-100` mit farbigem Inner-Div |
| CTA-Button | `style={{ background: 'var(--sfp-gold)' }}` |
| Disclaimer | `rounded-xl p-4 border border-amber-500/20` + amber-Akzente |

### 4.3 Kein globaler State-Store

SmartFinPro verwendet **keinen** globalen State-Store (kein Redux, kein Zustand, kein Context).

**Datenfluss:**
- **Calculator-Ergebnisse:** Lokal in der Komponente via `useState` + `useMemo`
- **Dashboard-Daten:** Server Components laden Daten direkt via Supabase-Queries
- **Affiliate-Tracking:** Server Actions (`logCtaClick`) — Fire-and-Forget via `useTransition`
- **Cookie-Consent:** `localStorage` + Custom Event (`cookie-consent-updated`)
- **A/B-Testing:** `localStorage` für Varianten-Zuweisung, Supabase für Impression/Click-Logging

> **REGEL:** Neue Tools müssen exakt diesem Pattern folgen. Kein globaler State, kein externer State-Store. Jede Komponente managt ihren eigenen State.

---

## 5. KI-Workflow & Entwicklungsprozess

### 5.1 Tooling

| Werkzeug | Verwendung |
|---|---|
| **Claude Code** (CLI) | Primäres Entwicklungstool — autonome Code-Änderungen, Multi-File-Edits |
| **Cursor IDE** | Ergänzendes Tool für Code-Review und manuelle Anpassungen |
| **GitHub** | Privates Repository, Versionskontrolle |
| **SSH** | Manuelles Deployment auf Cloudways VPS |

### 5.2 Deployment-Pipeline

```
1. Lokale Entwicklung (Claude Code / Cursor)
2. Git commit + push → Privates GitHub Repo
3. SSH auf Cloudways VPS:
   git pull → npm run build → pm2 reload SmartFinPro-Live --update-env
4. Cloudflare CDN invalidiert automatisch bei Cache-TTL-Ablauf
```

### 5.3 Build-Validierung

```bash
npm run build
# Muss ausgeben:
# ✓ Compiled successfully
# ✓ Generating static pages (260/260)
# ✓ CRITICAL CSS INJECTION — 33 pages injected
```

### 5.4 Content-Generierung (Genesis Pipeline)

```
MagicFind (Research) → Generate (Claude AI) → Process Images (Sharp) → Distribute (Deploy + Index)
```

Der Content-Generator (`lib/actions/content-generator.ts`) produziert vollständige MDX-Reviews mit:
- Pflicht-Frontmatter (title, market, category, affiliate_link)
- Helles Trust-Design (Navy/Gold/Green-Akzente)
- JSON-LD Schema (Review + AggregateRating + FAQPage)
- Trust-Komponenten (ExpertVerifier, TrustAuthority, WinnerAtGlance)

---

## 6. URL-Architektur & Routing

### 6.1 Marktstruktur

```
smartfinpro.com/                        → USA (kein Prefix)
smartfinpro.com/uk/                     → United Kingdom
smartfinpro.com/ca/                     → Canada
smartfinpro.com/au/                     → Australia
```

**US-Clean-URLs:** Die Middleware rewrites `/ai-tools/...` → `/us/ai-tools/...` transparent.

### 6.2 Route-Typen

| Muster | Beispiel | Rendering |
|---|---|---|
| `/{market}` | `/uk` | SSG |
| `/{market}/{category}` | `/us/ai-tools` | ISR (1d) |
| `/{market}/{category}/{slug}` | `/us/ai-tools/jasper-ai-review` | ISR (1d) |
| `/{market}/{category}/overview` | `/us/trading/overview` | SSG |
| `/{market}/reviews/{broker}` | `/us/reviews/etoro` | SSG |
| `/tools/{tool}` | `/tools/loan-calculator` | SSG (global, kein Markt-Prefix) |
| `/go/{slug}` | `/go/jasper-ai` | Dynamic (307 Redirect) |

### 6.3 Middleware-Routing

Die Middleware (`middleware.ts`) ist der zentrale Router mit folgender Priorität:

1. **Dashboard-Auth-Gate** — `/dashboard/*` mit Cookie-Prüfung
2. **Protected Prefixes** — `/_next`, `/api`, `/dashboard`, `/go/`, `/tools`, etc. → Durchleiten
3. **Static Files** — Pfade mit `.` (Dateiendung) → Durchleiten
4. **Protected Pages** — `/about`, `/privacy`, `/terms`, etc. → Durchleiten
5. **Market Prefix** — `/uk/`, `/ca/`, `/au/` → Durchleiten
6. **US Clean URL Rewrite** — `/ai-tools/...` → Rewrite zu `/us/ai-tools/...`
7. **Fallback** — Alles andere → Durchleiten

---

## 7. Verbindliche Regeln für KI-Entwicklung

### 7.1 Code-Standards

- [ ] **Tailwind CSS v4** — Config in `tailwind.css`, **nicht** `tailwind.config.js`
- [ ] **Semi-transparente Hintergründe** — Immer inline `style={{ background: 'rgba(...)' }}` (Tailwind v4 Limitierung)
- [ ] **CSS-Variablen** — Niemals Hex-Werte hardcoden, immer `var(--sfp-navy)`, `var(--sfp-gold)`, etc.
- [ ] **React 19 Server Components** — `'use client'` nur für `useState`, `useEffect`, Event-Handler
- [ ] **Framer Motion** — Nur in Client Components
- [ ] **Helles Trust-Design** — Weißer/heller Hintergrund, Navy+Gold+Green-Akzente, **kein** Dark Mode

### 7.2 Sicherheitsregeln

- [ ] **Supabase Service Key** — Nur serverseitig, niemals im Client
- [ ] **Parametrisierte Queries** — Kein String-Interpolation in SQL
- [ ] **RLS** — Jede neue Tabelle braucht Row Level Security Policies
- [ ] **CSP updaten** — Bei jeder neuen externen Domain `next.config.ts` anpassen
- [ ] **Affiliate-Links** — Immer `/go/[slug]/`, nie direkte URLs
- [ ] **Cron-Auth** — Jede neue Cron-Route muss `CRON_SECRET` prüfen
- [ ] **DB-Schema nur via Migration** — Neue Datei in `supabase/migrations/`

### 7.3 Compliance & Legal

- [ ] **Affiliate Disclosure** — Auf jeder Seite mit Affiliate-Links sichtbar
- [ ] **FCA-Labels** — Auf allen UK-Seiten zu Finanzprodukten
- [ ] **ASIC-Labels** — Auf allen AU-Seiten zu Finanzprodukten
- [ ] **CIRO-Labels** — Auf allen CA-Seiten zu Finanzprodukten

### 7.4 Performance

- [ ] **`output: 'standalone'`** — Niemals entfernen
- [ ] **Image-Formate** — AVIF/WebP via Next.js Image Optimization
- [ ] **Console-Logs** — In Production automatisch entfernt (außer error/warn)
- [ ] **Cache-Strategie** — Statische Assets 1 Jahr immutable, HTML 1h + stale-while-revalidate

> **WARNUNG:** Führe niemals Backdoors, Debug-Endpunkte ohne Auth oder öffentlich zugängliche Admin-Funktionen ein. Jeder geschützte Endpunkt muss authentifiziert sein.

---

## 8. Umgebungsvariablen

Alle Secrets in `.env.local` — **niemals im Code committen**.

| Variable | Zweck | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (RLS-geschützt) | Client + Server |
| `SUPABASE_SERVICE_KEY` | Supabase Service Role Key | **Nur Server** |
| `DASHBOARD_SECRET` | Dashboard-Auth-Token | Server (Middleware) |
| `CRON_SECRET` | Cron-Job-Authentifizierung | Server (API Routes) |
| `ANTHROPIC_API_KEY` | Claude API für Genesis Pipeline | Server |
| `RESEND_API_KEY` | E-Mail-Versand | Server |
| `TELEGRAM_BOT_TOKEN` | Telegram Alerts | Server |
| `TELEGRAM_CHAT_ID` | Telegram Empfänger | Server |
| `SERPER_API_KEY` | SERP-Monitoring | Server |
| `DEPLOY_HOOK_URL` | Cloudways Auto-Deploy | Server |

---

*SmartFinPro.com | Architektur-Referenz | v1.0 | Februar 2026*
*Enterprise Affiliate Platform · Next.js 16 · Supabase · 260 Seiten · 16 Tools*
