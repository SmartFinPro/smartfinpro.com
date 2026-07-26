# Broker-V2-Rollout — Design (Rev. 2)

> Stand 26.07.2026 · Status: vom Betreiber freigegeben — Rev. 2 arbeitet die fünf
> verbindlichen Korrekturen und die drei Entscheidungen aus dem Spec-Review ein ·
> Governance: [model-roles.md](../../governance/model-roles.md)

## Ziel

Alle 33 V1-Broker-Review-Kandidaten (trading/forex, 4 Märkte) erhalten eine
**dokumentierte Triage-Entscheidung**. Nur aktive, belegbare und cockpit-bereite
Broker werden auf den [Broker-V2-Publikationsvertrag](../../reviews/broker-v2-standard.md)
migriert. Das Ziel ist ausdrücklich **nicht** „33 Migrationen" — veraltete Produkte
werden nicht aufgewertet, nur weil sie im Inventar stehen.

## Verifiziertes Lagebild (26.07.2026)

- Vertrag, Guard (`npm run check:review-v2`, in `ci` und `prebuild`) und Inventar
  existieren auf dem Stack `fix/editorial-integrity` → `feat/broker-v2-standard`
  (25 Commits) → `feat/charles-schwab-v2-pilot` (9 Commits).
- Inventar: 36 Broker-Reviews · 3 V2 (eToro, Charles Schwab, Fidelity — alle
  us/trading) · **33 Kandidaten = 21 unterschiedliche Slugs = 19 Broker-Stämme**.
  Die Rollout-Planung führt diese Unterscheidung explizit (Datei ≠ Slug ≠ Broker).
- `node scripts/inventory-broker-reviews.mjs --check` ist **rot**: Totale stimmen,
  aber Einzelfeld-Drift (Schwab `wordCount` gespeichert 2 699 vs. aktuell 2 656).
- **`hasClaimSections` im Inventar ist ein unvollständiger Indikator**: Der
  Detector (`scripts/inventory-broker-reviews.mjs`, `hasClaimSections()`) erkennt
  nur drei exakte Überschriften. IBKR US trägt `claims=false`, enthält aber
  `## Our Testing Results`, „6 months with real money" (Frontmatter-Description)
  und Screenshot-/hands-on-Behauptungen. **Triage-Entscheidungen prüfen den
  Inhalt, nie nur das Flag.**
- Das im Vertrag referenzierte `docs/reviews/broker-v2-readiness.yml` **existiert
  nicht** — das Cockpit-Vor-Gate ist dokumentiert, aber nicht ausführbar.
- PR #103: 58 Commits, 101 Dateien, CI grün, **0 eingereichte Reviews** — nach
  eigener Governance fehlt die unabhängige Prüfung vor dem Merge.
- **PR #105 ist nicht unabhängig**: aktuell `CONFLICTING`, berührt u. a. eToro,
  Schwab, Fidelity, IBKR und `package.json` — also genau die Dateien des
  Pilot-Stacks.
- Im Repository existiert kein Plugin/`SKILL.md` — die Skills sind eine
  Neuimplementierung, keine Erweiterung eines vorhandenen Musters.
- Uncommitted im Worktree: `audits/reports/unit-latest.json` (generiert) — darf
  in keinen PR geraten.

## Getroffene Entscheidungen

| Entscheidung | Festlegung |
|---|---|
| Werkzeug | Repo-Skills (versioniert im Repo); Multi-Agent-Batches frühestens ab Welle 2, dann im hybriden Modell (siehe Phase 2) |
| Zielumfang | Alle 33 Kandidaten triagieren; migriert wird nur, was aktiv, belegbar und cockpit-bereit ist |
| Merge-Reihenfolge | #103 → #105 → Standard-Branch → Pilot-Branch, jeweils mit unabhängigem Review (siehe Phase 0) |
| Andere Kategorien | Außerhalb des Scopes — brauchen eigene V2-Profile (separates Architekt-Projekt) |
| TD Ameritrade | Triage-Entscheidung **jetzt** = `redirect` (Schwab bestätigt vollständige Kontenübertragung) — kein V2-Kandidat |

## Nicht-Ziele

- Keine Änderungen am V2-Design/Komponenten (der Vertrag prüft Form; die Optik
  lebt in geteilten Komponenten und kommt beim Umschalten automatisch).
- Keine Blind-Migration; keine Automatisierung der Faktenrecherche
  („Recherche, kein Skript" — Vertrag §A).
- Keine Multi-Agent-Orchestrierung vor stabiler Kalibrierung.

## Phase 0 — Stack stabilisieren

Merge-Reihenfolge und Branch-Verantwortlichkeiten sind **getrennt und verbindlich**
(die Worktree-Falle „auf dem Stack" war zu mehrdeutig):

1. **PR #103**: unabhängiges Review (Opus, Governance-Pflicht) → Merge.
2. **PR #105**: auf das neue main aktualisieren (Konflikte auflösen), Review →
   Merge. Erst danach ist `npm run check:evidence` verfügbar und die
   Pilot-Dateien sind konfliktfrei.
3. **`feat/broker-v2-standard`** (Verantwortung dieses Branches): Readiness-Schema
   + Generator/Validator für `broker-v2-readiness.yml` (Format siehe unten) und
   **auf diesem Stand** grünes Inventar (`--check`). Rebase auf main, Review →
   Merge.
4. **`feat/charles-schwab-v2-pilot`** (Verantwortung dieses Branches): nach dem
   Rebase Inventar auf 36/3/33 regenerieren und die Review-Quality-Gates für
   Schwab und Fidelity ausführen (Score ≥ 90, forbidden-claims, check:evidence).
   Review → Merge.

Durchgehend: voller Gate-Lauf (`npm run ci` + lokaler `npm run build` — CI baut
nicht voll); `audits/reports/unit-latest.json` nie committen.

### Readiness-Format (entschieden)

`broker-v2-readiness.yml` ist ein **generierter Cockpit-Snapshot** — keine
manuellen redaktionellen Felder im selben Artefakt (die gehören in Triage und
Dossiers). Mindestfelder:

```yaml
version: 1
generatedAt: 2026-07-26T00:00:00Z
reviews:
  content/us/trading/interactive-brokers-review.mdx:
    status: ready
    topic: trading-platforms
    productSlug: interactive-brokers
    reviewSlug: interactive-brokers-review
    rank: 3
    fieldCount: 9
    dataVerifiedAt: 2026-07-03
    auditedAt: 2026-07-26
```

Statuswerte geschlossen: `ready | missing-topic | missing-product | empty-field |
audit-error`.

## Phase 1 — Skills + Kalibrierung

Repo-Skills unter `.claude/skills/` (versioniert, reviewbar). Die Skills
**orchestrieren nur** — verbindliche Wahrheit bleiben Vertrag + Validatoren:

| Skill | Zweck |
|---|---|
| `/v2-status` | Inventar, Readiness, Triage-Stand, blockierte Seiten anzeigen |
| `/v2-research <brokerKey> [market]` | Quellen-Dossier erzeugen (Websuche Pflicht): Fakten + `sourceHref` + `asOf` + regulatorische Entität je Markt; Status `draft` → `approved` erst nach unabhängiger Faktenprüfung |
| `/v2-migrate <path>` | Migration **ausschließlich aus freigegebenem Dossier** (hartes Gate); 5-Sektionen-Mapping, Claim-Sektionen entfernen (nicht umbenennen), danach Guard + Inventar-Regeneration |
| `/v2-verify <path>` | Ausführbare Gates, siehe unten — inkl. verpflichtender Vorher/Nachher-Metriktabelle |

### Dossierformat (entschieden — Cluster-fähig)

Ein Dossier pro Broker-Stamm mit Markt-Overlays, damit Mehrfach-Markt-Broker die
Recherche amortisieren:

```
docs/reviews/research/<brokerKey>/common.yaml
docs/reviews/research/<brokerKey>/<market>-<category>.yaml
```

`common.yaml` trägt markt-unabhängige Fakten; das Overlay trägt Entität,
Regulator und markt-spezifische Werte und **gewinnt bei Konflikt**.

### Triage-Artefakt

`docs/reviews/broker-v2-triage.yml` — je Kandidat: Entscheidung
`migrate | update | merge | archive | redirect`, **Pflichtfeld `brokerKey`**
(verbindet Triage mit dem Dossier-Cluster), Begründung, Datum; bei `redirect`
oder `merge` zusätzlich **Pflichtfeld `targetPath`**.

Bereits entschieden: **TD Ameritrade = `redirect`**, `targetPath:
/us/trading/charles-schwab-review/`. Der Umsetzungs-Task
(separat, außerhalb dieses Rollouts): permanenter Redirect auf die
Schwab-Review, Entfernung der MDX-Datei, Aktualisierung interner Links,
Sitemap-/Redirect-Tests.

### Kalibrierung

Genau 2 Migrationen. **Kandidat 1: `content/us/trading/interactive-brokers-review.mdx`
— bewusst als anspruchsvoller Claim-Remediation-Test** (Testing-Sektion,
real-money-Claims, Screenshot-Behauptungen müssen ersatzlos raus; die
Frontmatter-Description muss neu). Kandidat 2 wird **erst nach dem
Readiness-Manifest** festgelegt.

**Modellrollen:** Recherche/Dossier + Migration = Default Implementer (frische
Session pro PR) · Dossier-Faktenprüfung + PR-Review = Independent Reviewer ·
Inventar/Readiness-Generator = Mechanical Worker bzw. Skript · Skill-Design und
Format-Entscheidungen = Principal Architect.

## Qualitäts-Gates (jede einzelne Migration — ausführbar)

`/v2-verify` führt aus und scheitert hart:

1. Dossier `approved` (Fakten + Quellen unabhängig geprüft).
2. Cockpit-Readiness laut Manifest `ready` (Vertrag „Vor der Umstellung", 1–4).
3. `npm run check:review-v2` grün + Inventar regeneriert und `--check` grün.
4. **Review-Score über `computeContentQuality()` aus
   `lib/reviews/content-quality.ts` berechnen; < 90 = Fail.**
   `scripts/quality-exact.mjs` ist dafür **verboten** — es dupliziert die alte
   V1-Formel und belohnt genau die zu entfernenden Bausteine
   (`<ExpertBox>`, `<EvidenceCarousel>`).
5. **Den geänderten Pfad direkt gegen `FORBIDDEN_CLAIM_PATTERNS` prüfen** — der
   globale Test steht weiterhin auf `describe.skip` und fängt nichts.
6. Nach Merge von PR #105: `npm run check:evidence`.
7. **Vorher/Nachher-Metriktabelle erzeugen** (Wortzahl, Score, Sektionen,
   entfernte Claims, Fakten mit Quelle) — Pflichtbestandteil des PR-Textes.
8. Lokaler `npm run build` grün (CI-Lücke: kein voller Next-Build).
9. Unabhängiges Review des PRs vor Merge.

## Phase 2 — Kontrollierte Wellen

- **Welle 1** = die 2 Kalibrierungs-Reviews → unabhängige fachliche Prüfung →
  Skill- und Dossierformat-Korrekturen zurückschreiben.
- **Welle 2** ≈ 5 Reviews, danach **brokerweise Cluster mit Markt-Overlays**
  (IBKR ×4 inkl. US-Forex-Variante, eToro ×3, CMC ×3, IG ×3, je ×2:
  Pepperstone, OANDA, Plus500, Questrade, forex.com).
- **Workflow ab Welle 2 (entschieden — hybrides Modell):** Recherche parallel pro
  `brokerKey` · Migrationen isoliert · **ein Integrator** übernimmt die Commits ·
  **nur der Integrator** verändert Inventar, Readiness und Triage und regeneriert
  sie **einmal pro Welle** · Verify läuft anschließend **seriell**. So entstehen
  keine Konflikte paralleler Agents auf den zentralen Artefakten.
- Jede Welle = eigener PR, frische Implementer-Session, unabhängiges Review.
