# Deploy-Härtung — Cold-Start-Smoke-Warm-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Transienten Smoke-Fail auf `/` direkt nach PM2-Restart + CF-Purge beseitigen — via best-effort Warm-up-Probe vor dem gated Smoke-Test. Kein App-Code, Rollback bleibt scharf.

**Tech:** GitHub Actions (`.github/workflows/deploy.yml`), bash/curl/ssh. Keine App-Logik.

**Branch:** `codex/deploy-smoke-warmup` · **PR:** Draft gegen `main`. Kein Deploy/Merge in diesem Schritt.

---

## File
- Modify: `.github/workflows/deploy.yml` — **ein neuer Step** zwischen „Purge Cloudflare cache (pre-smoke)" (Z. ~197) und „Smoke Test" (Z. ~202).

## Design
- Neuer Step **„Warm-up `/` before smoke test"**:
  - `if: steps.healthcheck.outcome == 'success'` (nur wenn Origin gesund), `continue-on-error: true` (best-effort, **kein** Gate).
  - **Origin-Warm-up** (via SSH → `http://localhost:3000/`): bounded Retry (6 × 5s), break bei `200`.
  - **CDN-Warm-up** (`${NEXT_PUBLIC_SITE_URL}/`): bounded Retry (6 × 5s), break bei `200` — primt den Cloudflare-Cache nach dem Pre-Smoke-Purge, sodass der gated Smoke-Test einen **warmen** `/`-Cache trifft.
  - Verwendet dasselbe `curl -sf -o /dev/null -w "%{http_code}" … || echo "000"`-Muster wie der bestehende Health-Check.
- **Smoke-Test-Step bleibt unverändert** (hartes Gate, `continue-on-error` NICHT gesetzt). Rollback-Bedingung (`steps.smoketest.outcome == 'failure'`) bleibt 1:1.
- Warm-up gated NIE den Deploy: erreicht es kein `200`, läuft es trotzdem weiter zum echten Smoke-Test (der bei echtem Defekt weiterhin fehlschlägt → Rollback).

### Task 1: Warm-up-Step einfügen
- [ ] **Step 1:** In `deploy.yml` direkt nach dem „Purge Cloudflare cache (pre-smoke)"-Step den Warm-up-Step einfügen (siehe Code unten).
- [ ] **Step 2:** YAML-Struktur lokal validieren (python `yaml.safe_load` / node `js-yaml`, soweit verfügbar) + sorgfältiges Review.
- [ ] **Step 3:** Guard-Checks: Smoke-Test-Step unverändert; Rollback-Bedingung unverändert; Warm-up hat `continue-on-error: true`.
- [ ] **Step 4:** Commit.

```yaml
      # ── 11b-warm. Warm-up `/` (best-effort) BEFORE the gated smoke test ──
      # After PM2 restart + CF purge, the first CDN hit to `/` is a cache MISS
      # against a freshly-restarted origin → the heavy homepage can render slowly
      # on the very first request, causing a transient smoke-test FAIL (observed
      # on deploy of #19). This probe warms `/` on origin (via SSH) AND CDN with
      # bounded retries so the gated Smoke Test below hits a ready, cached `/`.
      # It NEVER gates the deploy (continue-on-error): the Smoke Test stays the
      # hard gate and rollback remains keyed to its outcome.
      - name: Warm-up `/` before smoke test
        if: steps.healthcheck.outcome == 'success'
        continue-on-error: true
        run: |
          echo "── Warming origin / (via SSH → localhost:3000) ──"
          ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} \
            'for i in 1 2 3 4 5 6; do
               S=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
               echo "  origin attempt $i: HTTP $S"
               [ "$S" = "200" ] && { echo "  origin ready"; exit 0; }
               sleep 5
             done
             echo "  origin not 200 after retries (continuing — smoke test is the gate)"; exit 0'
          echo "── Warming CDN / (primes Cloudflare after pre-smoke purge) ──"
          for i in 1 2 3 4 5 6; do
            S=$(curl -sf -o /dev/null -w "%{http_code}" "${{ secrets.NEXT_PUBLIC_SITE_URL }}/" 2>/dev/null || echo "000")
            echo "  cdn attempt $i: HTTP $S"
            [ "$S" = "200" ] && { echo "  cdn ready"; break; }
            sleep 5
          done
```

### Task 2: Verifikation + PR
- [ ] **Step 1:** `git diff` reviewen — nur der eine neue Step, keine App-/anderen Workflow-Änderungen.
- [ ] **Step 2:** Branch pushen, Draft-PR gegen `main`.
- [ ] **Step 3:** Echte Wirksamkeit verifiziert sich erst beim nächsten realen Deploy (Race nur post-restart) — bewusst so, nicht in diesem Schritt deployen.

## Non-Goals / Guards
- Kein App-/Dashboard-Code. Kein Aufblasen globaler Sleeps. Smoke-Gate nicht weichmachen. Rollback-Logik unverändert. Kein Deploy/Merge jetzt.
