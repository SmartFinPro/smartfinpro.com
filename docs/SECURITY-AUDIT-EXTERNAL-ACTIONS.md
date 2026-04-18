# Security Audit 2026-04-14 — External Actions Required

> Die Code-Fixes (F-01, F-05, F-06, F-08, F-09, F-10, F-11, F-17, F-19) wurden
> im Repo erledigt. Die folgenden Punkte können **nicht** im Code gelöst werden
> und müssen manuell in externen Systemen umgesetzt werden (Cloudflare, Supabase,
> DNS, Cloudways). Reihenfolge = Priorität (Most-Impact zuerst).

---

## F-03 — Supabase Projekt-Referenz verbergen (MEDIUM)

**Problem:** `NEXT_PUBLIC_SUPABASE_URL=https://devkeyhniwdxsqvoscdu.supabase.co`
leakt die Projekt-ID in jedem Client-Bundle. Angreifer kann damit das Supabase
Project-Dashboard targetieren.

**Fix (Supabase Dashboard):**
1. Supabase Dashboard → Project Settings → **Custom Domain**
2. CNAME setzen: `db.smartfinpro.com → devkeyhniwdxsqvoscdu.supabase.co`
3. `NEXT_PUBLIC_SUPABASE_URL=https://db.smartfinpro.com` in GitHub Secrets
4. Deploy workflow bauen (Build-Zeit-Variable)
5. RLS-Policies bleiben unverändert — Custom Domain routet nur

**Aufwand:** ~30 Min · **Downtime:** 0 (CNAME-Warm-up)

---

## F-04 — DMARC / SPF / DKIM Hardening (HIGH)

**Problem:** E-Mails von `hello@smartfinpro.com` sind zwar SPF-aligned, aber
DMARC steht auf `p=none`. Spoofing möglich.

**Fix (Cloudflare DNS):**

```
# TXT _dmarc.smartfinpro.com
v=DMARC1; p=reject; rua=mailto:dmarc@smartfinpro.com; aspf=s; adkim=s; pct=100

# TXT smartfinpro.com (SPF hardening)
v=spf1 include:_spf.resend.com -all
# Wichtig: -all (NICHT ~all) nach 2 Wochen Monitoring

# DKIM — Resend Dashboard → Domains → "Add Domain" → 3× CNAME kopieren
resend._domainkey.smartfinpro.com  CNAME  ... (aus Resend Dashboard)
```

**Aufwand:** ~15 Min Setup + 2 Wochen Monitoring-Phase mit `p=quarantine`
**Monitoring:** Free tier bei dmarcian.com oder postmarkapp.com/dmarc

---

## F-07 — CAA DNS Records setzen (LOW)

**Problem:** Ohne CAA kann jede CA (Certificate Authority) ein TLS-Cert für
smartfinpro.com ausstellen. CAA schränkt auf explizit erlaubte CAs ein.

**Fix (Cloudflare DNS):**
```
smartfinpro.com CAA 0 issue "letsencrypt.org"
smartfinpro.com CAA 0 issue "cloudflare.com"
smartfinpro.com CAA 0 issuewild ";"
smartfinpro.com CAA 0 iodef "mailto:security@smartfinpro.com"
```

**Aufwand:** ~2 Min · Sofort aktiv

---

## F-13 — Cloudflare Transform Rules für sensible Pfade (MEDIUM)

**Problem:** `/api/cron/*` und `/api/internal/*` sind öffentlich erreichbar und
machen Auth-Check → Logging → 401. Ein Bot kann damit unser Logging fluten.

**Fix (Cloudflare Dashboard → Rules → Transform Rules):**

**Rule 1: Block cron paths ohne CF-Connecting-IP Match (GitHub Actions IPs)**
```
Wenn: (http.request.uri.path matches "^/api/cron/")
      and not (ip.src in $github_actions_ips)
Dann: Block (403)
```
GitHub Actions IP-Liste: https://api.github.com/meta → `actions` Array
(In Cloudflare als IP-Liste `github_actions_ips` anlegen).

**Rule 2: Block /api/internal/ außer für bekannte Monitoring-IPs**
```
Wenn: (http.request.uri.path matches "^/api/internal/")
      and not (ip.src in $monitoring_ips)
Dann: Managed Challenge
```

**Aufwand:** ~20 Min · Keine Downtime

---

## F-14 — SRI-Hashes für Plausible / Externe Scripts (LOW)

**Problem:** `<script src="https://plausible.io/js/script.js">` hat keine
`integrity=` Attribut. Wenn Plausible kompromittiert wird, injizieren sie
Code in alle unsere Seiten.

**Optionen:**
- **A) SRI-Hash statisch setzen** (bricht bei jedem Plausible-Update)
- **B) Plausible selbst hosten** via `plausible-community-edition` Docker
- **C) Plausible CDN whitelisten + Sentry-Alert auf Hash-Drift**

**Empfehlung:** Option C (lowest effort, gleiche Security wie A wenn Hash-Monitoring läuft).

**Fix:** In `app/layout.tsx` nach `<script src="...plausible.io...">` hinzufügen:
```tsx
<script
  defer
  data-domain="smartfinpro.com"
  src="https://plausible.io/js/script.js"
  integrity="sha384-{HASH}"    // aus `curl https://plausible.io/js/script.js | openssl dgst -sha384 -binary | openssl base64 -A`
  crossOrigin="anonymous"
/>
```

**Aufwand:** ~10 Min + monatlich Hash-Refresh

---

## F-16 — wp-admin 404-Bot-Flut (LOW)

**Problem:** Apache-/Cloudflare-Logs voll mit `GET /wp-admin/…` (404). Jeder Hit
triggert Next.js 404-Handler → CPU-Waste.

**Fix (Cloudflare → Rules → Page Rules oder Transform Rules):**
```
Wenn: (http.request.uri.path matches "(?i)/wp-(admin|login|content)")
      or (http.request.uri.path matches "\\.(php|asp|aspx)$")
Dann: Block (444 — no response)
```

**Effekt:** -60 % Origin-Requests laut Cloudflare Analytics Beispielwerten.

**Aufwand:** ~5 Min

---

## F-18 — Network Error Logging (NEL) aktivieren (LOW)

**Problem:** Keine Sicht auf TLS/DNS/TCP-Fehler auf Client-Seite.

**Fix:** In `next.config.ts` Security-Headers ergänzen (wenn Report-URI
konfiguriert ist — z.B. Sentry oder report-uri.com):

```ts
{ key: 'Report-To', value: JSON.stringify({
    group: 'network-errors',
    max_age: 10886400,
    endpoints: [{ url: process.env.NEL_REPORT_URI }],
  })
},
{ key: 'NEL', value: JSON.stringify({
    report_to: 'network-errors',
    max_age: 2592000,
    include_subdomains: true,
    success_fraction: 0.01,
    failure_fraction: 1.0,
  })
},
```

Env: `NEL_REPORT_URI=https://{sentry-endpoint}`

**Aufwand:** ~10 Min nach F-17 Setup

---

## F-17 Nachtrag — CSP_REPORT_URI konfigurieren

Die Code-Infrastruktur ist fertig. Zum Aktivieren:

1. Sentry Dashboard → Settings → Security Headers → **Set up**
2. Report-URL kopieren (Format: `https://o{id}.ingest.sentry.io/api/{project}/security/?sentry_key=...`)
3. Auf VPS: `.env.local` ergänzen:
   ```
   CSP_REPORT_URI=https://o.../security/?sentry_key=...
   ```
4. `pm2 restart smartfinpro --update-env`
5. Test: In DevTools Console `fetch('https://evil.example')` → sollte in Sentry
   als CSP-Violation auftauchen

**Aufwand:** ~10 Min

---

## F-05 Nachtrag — Upstash Redis (optional, für Multi-Instance)

Der Rate-Limiter funktioniert jetzt mit In-Memory-Fallback. Für echtes
Distributed-Rate-Limiting (z.B. wenn wir von PM2 cluster mode → mehrere
VPS-Nodes wechseln):

1. Upstash.com → Neue Redis-Datenbank (Free tier: 10k commands/day)
2. REST API Credentials kopieren
3. GitHub Secrets + VPS `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```
4. `pm2 restart smartfinpro --update-env`
5. `subscribeLimiter.checkAsync()` nutzt automatisch Upstash.

**Aufwand:** ~15 Min

---

## Zusammenfassung der Code-Fixes (bereits deployed-ready)

| ID   | Fix                                                                 | Datei                                          |
|------|---------------------------------------------------------------------|------------------------------------------------|
| F-01 | Public /api/health minimiert, /api/internal/health Bearer-geschützt | `app/api/health/route.ts`, `app/api/internal/` |
| F-05 | Rate-Limiter Upstash-ready + contact-Route angebunden               | `lib/security/rate-limit.ts`, `app/api/contact`|
| F-06 | X-XSS-Protection: `0` (deprecated, attack-surface)                  | `next.config.ts`                               |
| F-08 | `/.well-known/security.txt` (RFC 9116)                              | `public/.well-known/security.txt`              |
| F-09 | Sentry tracePropagationTargets auf eigene Origins begrenzt          | `instrumentation-client.ts`, `sentry.*.ts`     |
| F-10 | X-Frame-Options: DENY + CSP frame-ancestors 'none'                  | `next.config.ts`                               |
| F-11 | sfp-geo Cookie: sameSite=strict, secure=true, Rationale dokumentiert| `proxy.ts`                                     |
| F-17 | CSP report-uri via `CSP_REPORT_URI` env var                         | `next.config.ts`                               |
| F-19 | Permissions-Policy: browsing-topics, attribution-reporting, etc.    | `next.config.ts`                               |

**Nach Deploy testen:**
- https://securityheaders.com/?q=smartfinpro.com → sollte **A+** zeigen
- https://observatory.mozilla.org/analyze/smartfinpro.com → sollte **A+** zeigen
- `curl -I https://smartfinpro.com` → keine `X-XSS-Protection: 1; mode=block` mehr
- `curl https://smartfinpro.com/.well-known/security.txt` → 200
- `curl https://smartfinpro.com/api/health` → `{"status":"ok","timestamp":"..."}` (keine checks-Details)
- `curl -H "Authorization: Bearer $HEALTH_TOKEN" https://smartfinpro.com/api/internal/health` → volle Diagnostik

---

*Erstellt: 2026-04-14 · SECURITY AUDIT Response*
