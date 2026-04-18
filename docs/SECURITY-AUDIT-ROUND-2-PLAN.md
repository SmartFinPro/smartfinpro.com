# Security Audit Round 2 — Exploit-Fokussierter Plan

**Audit-Datum:** 2026-04-17
**Assessment-Typ:** Red-Team / Offensive Security Review
**Scope:** Alle 95+ API-Routes, Cron-Jobs, Webhooks, Auth-Pfade, File-I/O, Dependencies
**Methode:** Statische Code-Analyse mit Exploit-Fokus (Mythos/Glasswing Mindset)

> Dieser Plan listet konkrete Exploit-Vektoren im Code. Jedes Finding ist an
> echter Datei+Zeile verifiziert — keine Spekulation, keine Best-Practice-Kosmetik.
> **Umsetzung erfolgt erst nach deiner Freigabe.**

---

## EXPLOIT-KATALOG (11 verifizierte Findings)

### CRITICAL — sofort exploitable

| ID     | Vektor                        | Impact                                    | Datei |
|--------|-------------------------------|-------------------------------------------|-------|
| C-01   | Timing-Attack auf Secrets     | CRON_SECRET / DASHBOARD / HEALTH_TOKEN-Leak | ~40 Routes, alle `===`-Vergleiche |
| C-02   | Command-Injection via Env     | RCE wenn Attacker VPS-.env schreiben kann | `app/api/audit/verify/start/route.ts:73` |
| C-03   | Undo-Token Race/Replay        | Double-Execution von Rollbacks            | `app/api/autonomous/undo/route.ts:42-89` |

### HIGH — direkt oder mit einer Voraussetzung exploitable

| ID     | Vektor                                  | Impact                                   | Datei |
|--------|------------------------------------------|------------------------------------------|-------|
| H-01   | `archive-page/hard-delete` ohne Auth   | Jeder kann archivierte Seiten löschen    | `app/api/archive-page/hard-delete/route.ts:6` ← VERIFIED |
| H-02   | X-Forwarded-For Spoofing                | Rate-Limit-Bypass, IP-Whitelist-Bypass   | `proxy.ts:315`, `postback/route.ts:60`, u.a. |
| H-03   | SSRF via PORT-Env in trigger-cron       | Metadata-Service / Internal-LAN Scan     | `app/api/dashboard/trigger-cron/route.ts:51` |
| H-04   | Resend-Webhook skippt Sig ohne Secret   | Unsubscribe-Fraud, Event-Injection       | `app/api/webhooks/resend/route.ts:60-65` ← VERIFIED |
| H-05   | Internal-Health ohne Query-Timeout      | DB-Stall-Amplifikation                   | `app/api/internal/health/route.ts:126-148` |

### MEDIUM — exploitable mit Vorbedingung

| ID     | Vektor                                  | Impact                                    | Datei |
|--------|------------------------------------------|-------------------------------------------|-------|
| M-01   | Sharp OOM via unbounded Upload          | Prozess-Kill, PM2-Restart-Loop            | `app/api/genesis/process-images/route.ts:96-120` |
| M-02   | Symlink-Loop in freshness-check         | DoS via Stack-Overflow                    | `app/api/cron/freshness-check/route.ts:38-54` |
| M-03   | Legacy-Secret-als-Cookie im Proxy       | Direkter Auth-Bypass falls Secret leakt   | `proxy.ts:262` |

---

## ROLLOUT-STRATEGIE (3 Wellen, 1 Commit pro Welle)

### Welle 1 — Sofort-Stopfen (C-01, C-02, C-03, H-01, H-04)
**Dauer-Budget:** ~60 Min Code + 5 Min Deploy
**Breaking-Risk:** sehr gering — rein defensiv, nur 401/503-Responses werden strenger

#### Schritt 1.1 — Timing-Safe Secret Comparison (C-01)
Helper `lib/security/timing-safe.ts` erstellen:
```ts
export function compareSecret(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
export function validateBearer(header: string | null, expected: string | undefined): boolean {
  if (!header || !expected) return false;
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) return false;
  return compareSecret(header.slice(prefix.length), expected);
}
```
Dann codemod über alle betroffenen Routes (grep-basiert):
- Alle `authHeader === \`Bearer ${process.env.CRON_SECRET}\`` → `validateBearer(authHeader, process.env.CRON_SECRET)`
- Alle Dashboard-Session-Checks konsolidieren

**Test:** curl mit richtigem Secret → 200, mit falschem → 401, mit falscher Länge → 401 (gleiche Latenz).

#### Schritt 1.2 — Archive Hard-Delete Auth (H-01)
Route um Dashboard-Auth-Check erweitern — dieselbe Pattern wie alle `/api/dashboard/*`:
```ts
if (!isValidDashboardSession(request)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Test:** `curl -X POST` ohne Cookie → 401; mit gültigem Dashboard-Cookie → 200.

#### Schritt 1.3 — Resend-Webhook Sig Mandatory (H-04)
`if (secret)` → `if (!secret || secret.startsWith('your-')) return 503`
→ signature check ist dann IMMER Pflicht.

**Test:** Resend-Test-Event ohne Sig → 401. Echter Webhook mit Sig → 200.

#### Schritt 1.4 — Atomic Undo-Token (C-03)
SELECT-dann-UPDATE durch einen einzelnen UPDATE mit WHERE-Guard ersetzen. RPC-Funktion optional via Supabase-Migration falls bessere Lesbarkeit gewünscht.

**Test:** N parallele curl-Aufrufe mit gleichem Token → 1× 200, N-1× 410 (gone). DB-Zeile genau 1× als `undone_at` gesetzt.

#### Schritt 1.5 — Spawn Env Whitelist (C-02)
`env: { ...process.env }` ersetzen durch Whitelist mit NODE_ENV, PATH, NEXT_PUBLIC_SUPABASE_URL. Alle API-Keys, Secrets, Auth-Tokens entfernen.

**Test:** Audit-Verify läuft weiterhin durch (Script darf keine Secrets brauchen — falls doch: explizit whitelisten und dokumentieren).

---

### Welle 2 — Härten gegen Infrastruktur-Spoofing (H-02, H-03, H-05, M-01, M-02)
**Dauer-Budget:** ~45 Min Code
**Breaking-Risk:** gering — mögliche Auswirkung auf IP-basierte Analytics (Bot-IPs werden robuster erfasst)

#### Schritt 2.1 — Trusted-IP Helper (H-02)
`lib/security/client-ip.ts`:
```ts
export function getTrustedIP(request: NextRequest): string {
  // Cloudflare: cf-connecting-ip kann nicht gespooft werden wenn CF Proxy aktiv
  const cf = request.headers.get('cf-connecting-ip');
  if (cf && /^[0-9a-f:.]+$/i.test(cf)) return cf;

  // x-forwarded-for NUR wenn CF Header FEHLT und wir Origin-IP sehen sollen
  // Im Cloudflare-Setup: niemals x-forwarded-for vertrauen
  return 'unknown';
}
```
Über alle 9 Fundstellen (`x-forwarded-for` Grep) rollen — Rate-Limiter + Blocklist + Click-Tracking.

**Cloudflare-Voraussetzung:** „Trust X-Forwarded-For" MUSS deaktiviert sein. Transform-Rule in `docs/SECURITY-AUDIT-EXTERNAL-ACTIONS.md` F-13 dokumentiert den CF-Side.

#### Schritt 2.2 — PORT-Validierung in trigger-cron (H-03)
```ts
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  return NextResponse.json({ error: 'Invalid PORT' }, { status: 500 });
}
const baseUrl = `http://127.0.0.1:${port}`;  // hard-coded loopback
```

#### Schritt 2.3 — Internal Health Query-Timeout (H-05)
`Promise.race([query, timeout(2000)])`-Pattern für cron_logs-Lookup.

#### Schritt 2.4 — Sharp Upload-Limit (M-01)
```ts
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB hard-limit
const MAX_FILES = 4;
if (files.length > MAX_FILES) return 413;
for (const f of files) if (f.size > MAX_FILE_BYTES) return 413;
// Zusätzlich: sharp().limitInputPixels(268402689) (default 0.25 GP)
```

#### Schritt 2.5 — Symlink-Loop Schutz (M-02)
Visited-Inode-Set in `collectMdxFiles` — device+inode als Key, früher Return bei bekannter Inode.

---

### Welle 3 — Altlasten entfernen + Documentation (M-03)
**Dauer-Budget:** ~20 Min
**Breaking-Risk:** Cookie-Inkompatibilität möglich — benötigt bewussten Deploy-Zeitpunkt

#### Schritt 3.1 — Legacy-Secret-Cookie Pfad entfernen (M-03)
Plan:
1. Deploy der neuen Welle 1 (mit timing-safe Auth) — alle Dashboard-User re-authen via Cookie-Refresh
2. 7 Tage später: Legacy-Fallback `|| timingSafeCompare(value, dashSecret)` entfernen
3. Wenn nach 7 Tagen niemand `401` bekommt → sicher entfernt

#### Schritt 3.2 — Dependency-Audit Baseline
`npm audit --production --audit-level=moderate` durchlaufen und gefundene Advisories in `docs/dep-audit-2026-04-17.md` dokumentieren. Keine blinden `npm audit fix --force`.

#### Schritt 3.3 — Rate-Limit auf alle Mutations
Checkliste: `/api/track`, `/api/bandit/*`, `/api/webhooks/*`, `/api/genesis/*`, `/api/postback`, `/api/autonomous/undo` — Rate-Limiter mit passender Stärke applied.

---

## TEST-PLAN (pro Welle)

### Nach Welle 1 — Exploit-Regression-Tests
```bash
# C-01 Timing
hyperfine --runs 500 \
  'curl -s -H "Authorization: Bearer wrongprefix123" https://smartfinpro.com/api/cron/freshness-check' \
  'curl -s -H "Authorization: Bearer a" https://smartfinpro.com/api/cron/freshness-check'
# Erwartung: kein statistisch signifikanter Unterschied (<5% Varianz)

# C-03 Race
for i in $(seq 1 20); do
  curl -X POST https://smartfinpro.com/api/autonomous/undo \
    -H "Content-Type: application/json" \
    -d '{"token":"VALID_TOKEN"}' &
done; wait
# Erwartung: genau 1× {success:true}, 19× 410-Gone

# H-01 Hard-Delete
curl -X POST https://smartfinpro.com/api/archive-page/hard-delete \
  -H "Content-Type: application/json" \
  -d '{"archivedPageId":"any","confirmSlug":"any"}'
# Erwartung: 401 Unauthorized

# H-04 Resend Webhook
curl -X POST https://smartfinpro.com/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -d '{"type":"email.bounced","data":{"to":["x@y.z"]}}'
# Erwartung: 401 Invalid signature (nicht mehr 200)
```

### Nach Welle 2 — Infrastruktur-Tests
```bash
# H-02 IP-Spoofing
for i in $(seq 1 20); do
  curl -H "x-forwarded-for: 1.2.3.$i" https://smartfinpro.com/api/subscribe \
    -d '{"email":"test'$i'@example.com"}'
done
# Erwartung: ab 6. Request → 429 (CF-IP bleibt konstant, XFF wird ignoriert)

# M-01 Upload
dd if=/dev/zero of=huge.png bs=1M count=50
curl -X POST https://smartfinpro.com/api/genesis/process-images -F "files=@huge.png" ...
# Erwartung: 413 Payload Too Large (nicht mehr OOM)

# M-02 Symlink (nur lokal)
ln -s ../../ content/us/loop
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/freshness-check
# Erwartung: scannt normal durch, kein Stack-Overflow
```

### Nach Welle 3
- `curl` zu allen API-Endpoints mit 200 req/min → überall 429 irgendwann erreicht
- `npm audit` sauber

---

## ROLLBACK-PLAN

Jede Welle = 1 Git-Commit, 1 GitHub-Actions-Deploy. Bei Prod-Fehler:
```bash
# GitHub Actions → Revert last deploy workflow
gh workflow run revert-last.yml
# ODER: git revert <SHA> && git push
```

Critical Envs bleiben unverändert — kein Migrations-Bedarf.

---

## ENV-VAR-ÄNDERUNGEN

Keine neuen Build-Time-Variablen. Eine neue Runtime-Variable (optional):
```
RESEND_WEBHOOK_SECRET=whsec_...    # ← MUSS in VPS .env.local gesetzt sein
```
Nach Welle 1 wird `/api/webhooks/resend` ohne dieses Secret 503 zurückgeben.
Secret im Resend-Dashboard (Webhooks → Signing Secret) holen.

---

## RISIKEN & MITIGATIONEN

| Risiko                                    | Mitigation |
|-------------------------------------------|------------|
| Rate-Limit via CF-IP bricht Dev-Umgebung  | Fallback auf `unknown` für LAN-IPs; `NODE_ENV=development` erlaubt X-Forwarded-For |
| Resend-Webhook-Secret fehlt → 503 in Prod | Vor Welle-1-Deploy: Env-Variable setzen; Welle-1 deployt erst nach Verifikation |
| Timing-safe-Compare in 40 Routes = viele  | Grep-basierter Codemod + 1 Integration-Test pro Auth-Pattern |
| Legacy-Cookie-Kill bricht aktive Sessions | Welle 3 erfolgt erst 7 Tage nach Welle 1; Monitoring via Dashboard-401-Rate |

---

## FREIGABE-CHECKLISTE

Vor Umsetzung benötige ich deine Freigabe zu:
- [ ] Welle 1 implementieren (C-01, C-02, C-03, H-01, H-04) — 1 Commit
- [ ] `RESEND_WEBHOOK_SECRET` in VPS `.env.local` gesetzt / holbar
- [ ] Welle 2 implementieren (H-02, H-03, H-05, M-01, M-02) — 1 Commit
- [ ] Cloudflare-Seite: „Trust X-Forwarded-For" abschalten (falls noch nicht)
- [ ] Welle 3 implementieren (M-03 + Dep-Audit + Rate-Limit-Rollout) — 1 Commit

---

*Erstellt 2026-04-17 nach Red-Team-Audit · Zusätzlich zu Round-1-Fixes (F-01/05/06/08/09/10/11/17/19)*
