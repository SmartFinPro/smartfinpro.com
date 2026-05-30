# Deploy-Härtung — Cold-Start-Smoke-Warm-up Design Spec

> **Essentieller Follow-up 1/3** · **Datum:** 2026-05-30 · **Status:** Spec zur Review · **Branch:** `codex/deploy-smoke-warmup` (von `main`)
> **PR später:** gegen `main`. **Kein App-Code.** Kein Deploy/Merge ohne explizite Freigabe.

## 1. Ziel
Den transienten Smoke-Test-Fehlschlag direkt nach dem PM2-Restart beseitigen. Beim #19-Deploy schlug der **CDN-Smoke-Test auf `/`** fehl (schneller Fail, kein 30s-Timeout), woraufhin der Auto-Rollback griff — obwohl Build/Health-Check grün waren und ein bloßer Re-Run sofort durchlief. Ursache: nach **PM2-Restart + Cloudflare-Purge** ist der erste `/`-Request ein Cache-MISS auf eine kalt gerenderte, schwere Homepage; die `sleep 5` vor dem Smoke-Test reichen dafür nicht zuverlässig.

## 2. Exakter Scope
Eine kleine, isolierte CI-Härtung **ausschließlich** in der Deploy-Pipeline: vor dem **gated** Smoke-Test ein **Warm-up/Retry auf `/`** (und ggf. die anderen render-schweren Critical-URLs), bis `200` kommt oder ein klarer Abbruch erfolgt. Kein Verändern der App, keine neue Logik in Seiten/Components.

## 3. Betroffene Workflow-/Script-Dateien
- **Primär:** `.github/workflows/deploy.yml` — neuer Step **„Warm-up `/` before smoke"** zwischen „Purge Cloudflare cache (pre-smoke)" (Z. ~191) und „Smoke Test" (Z. ~202). Curl-Retry-Schleife: N Versuche × Intervall gegen `${NEXT_PUBLIC_SITE_URL}/` (CDN) **und** `http://localhost:3000/` (Origin via SSH, analog zum Origin-Smoke-Step), bis HTTP 200 oder Abbruch.
- **Optional/Alternative:** `scripts/smoke-test.mjs` — Per-URL-Retry (z. B. 3× mit Backoff) statt eines einzelnen Versuchs (aktuell single-pass über `CRITICAL_URLS`, kein Retry). Würde *jeden* transienten URL-Fail abfedern, nicht nur `/`.

## 4. Non-Goals
- Keine App-/Seiten-/Component-Änderung; keine Änderung an PM2-/Standalone-Setup.
- Kein Umbau der Rollback-Logik, Health-Check-Logik oder der CF-Purge-Schritte.
- Keine Erhöhung des globalen Smoke-Timeouts als „Lösung" (verschleiert nur).
- Kein Entfernen/Abschwächen des Smoke-Gates (Qualität bleibt hart gated).

## 5. Verifikationsstrategie (CI)
- `yamllint`/`actionlint` lokal auf `deploy.yml` (falls verfügbar) bzw. sorgfältiges Review der YAML-Syntax.
- **Echter Test = nächster Deploy nach `main`:** der hinzugefügte Warm-up-Step muss vor dem Smoke-Test grün sein; Smoke-Test darf nicht mehr am Cold-Start scheitern. Bewusst über einen reellen Merge/Deploy verifizieren (mit Freigabe), da der Race nur post-restart auftritt.
- Rückfall-Sicherheit: Rollback bleibt unverändert scharf — schlägt der Smoke nach Warm-up *trotzdem* fehl, rollt es weiterhin zurück (kein Verlust an Schutz).

## 6. Risiken
- **Maskierung echter Fehler:** Ein zu großzügiger Retry könnte einen echten `/`-Defekt verschlucken. Gegenmaßnahme: kleine, begrenzte Retry-Anzahl (z. B. ≤ 6 × 5s) + harter Abbruch; der eigentliche Smoke-Test bleibt das Gate.
- **CDN vs. Origin:** CF-Edge-Verhalten nach Purge kann je Region variieren → Warm-up sollte sowohl CDN als auch Origin (localhost via SSH) treffen, konsistent zum bestehenden Origin-Smoke-Step.
- **YAML-Fehler** im Workflow → sorgfältiges Review; Step klein halten.

## 7. Empfehlung — kleinste saubere Lösung
**Ein einziger neuer Warm-up-Step in `deploy.yml`** vor dem Smoke-Test: Retry-Curl auf `/` (CDN + Origin) bis `200`/Abbruch (z. B. bis zu 6 Versuche, 5s Intervall). Klein, isoliert, kein App-/Script-Change. Den optionalen Per-URL-Retry in `smoke-test.mjs` nur nachziehen, falls auch andere URLs künftig cold-start-flaky werden — vorerst **nicht** nötig (nur `/` war betroffen). Einzel-Slice, kein Teilslice-Split.
