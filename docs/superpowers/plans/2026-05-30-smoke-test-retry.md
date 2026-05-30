# Smoke-Test Per-URL-Retry — Implementation Plan

> **Deploy-Härtung Abschluss** · Branch `codex/smoke-test-retry` (von `main`) · PR Draft gegen `main`. Kein Deploy/Merge in diesem Schritt.

**Goal:** Transiente Cold-Start-/First-hit-Fehler im gated Smoke-Test robust abfangen — bounded Retry pro URL, nur für transiente Fehler. Gate bleibt **hart** (echte Fehler failen weiterhin). Kein App-/Dashboard-Code.

**File:** `scripts/smoke-test.mjs` (einzige Datei). `deploy.yml` bewusst **nicht** anfassen.

## Design
- Neuer `fetchWithRetry(url, ms)`-Wrapper um das bestehende `fetchWithTimeout` (node-fetch-Pfad, der CF passiert).
- **Retry NUR bei transient:** fetch-throw (Netzwerk/connection refused/DNS), Timeout (`AbortError`), HTTP **5xx**, HTTP **429**.
- **KEIN Retry / sofort zurück:** HTTP **200** (→ Content-Checks laufen normal; deren Fehler = echter Fail, kein Retry) und **4xx inkl. 404** (echter Inhaltsfehler → fail, nicht weichgespült).
- **3 Versuche** pro URL, kurzer Backoff (500ms, 1500ms). Nach erschöpften Retries: letzten `res` zurückgeben bzw. Fehler rethrown → `smokeTest` wertet wie bisher → bei Misserfolg `process.exit(1)`.
- Retries werden geloggt (`↻ … attempt n/3, retrying…`) für Transparenz.

## Tasks
- [ ] `fetchWithRetry` + `isTransientStatus` + `sleep` einfügen; in `smokeTest` `fetchWithTimeout` → `fetchWithRetry` ersetzen.
- [ ] `node --check scripts/smoke-test.mjs` (Syntax).
- [ ] Happy-Path-Lauf gegen Produktion (read-only GETs) → alle 200 → Exit 0.
- [ ] Commit, Push, Draft-PR.

## Guards / Non-Goals
- Gate bleibt hart: 404/4xx nicht retryt, Content-Check-Fehler nicht retryt; nach Retries weiterhin Exit 1.
- Keine globalen Sleeps; Backoff nur im Transient-Fall.
- Keine App-/Dashboard-Dateien, kein `deploy.yml`-Change, kein Saved-Views-Start.
