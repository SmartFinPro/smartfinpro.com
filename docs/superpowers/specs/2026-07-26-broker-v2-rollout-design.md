# Broker-V2-Rollout — Design

> Stand 26.07.2026 · Status: vom Betreiber freigegeben (Entscheidungen aus dem
> Strategie-Review übernommen) · Governance: [model-roles.md](../../governance/model-roles.md)

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
- Das im Vertrag referenzierte `docs/reviews/broker-v2-readiness.yml` **existiert
  nicht** — das Cockpit-Vor-Gate ist dokumentiert, aber nicht ausführbar.
- PR #103: 58 Commits, 101 Dateien, CI grün, **0 eingereichte Reviews** — nach
  eigener Governance fehlt die unabhängige Prüfung vor dem Merge.
- Im Repository existiert kein Plugin/`SKILL.md` — die Skills sind eine
  Neuimplementierung, keine Erweiterung eines vorhandenen Musters.
- Uncommitted im Worktree: `audits/reports/unit-latest.json` (generiert) — darf
  in keinen PR geraten.

## Getroffene Entscheidungen

| Entscheidung | Festlegung |
|---|---|
| Werkzeug | Repo-Skills (Plugin-artig, versioniert im Repo); Multi-Agent-Workflow-Batches frühestens nach erfolgreicher Kalibrierungswelle |
| Zielumfang | Alle 33 Kandidaten triagieren; migriert wird nur, was aktiv, belegbar und cockpit-bereit ist |
| Merge-Reihenfolge | Erst den dreistufigen Basis-Stack sauber mergen (mit Governance-Review), dann Rollout |
| Andere Kategorien | Außerhalb des Scopes — brauchen eigene V2-Profile (separates Architekt-Projekt) |

## Nicht-Ziele

- Keine Änderungen am V2-Design/Komponenten (der Vertrag prüft Form; die Optik
  lebt in geteilten Komponenten und kommt beim Umschalten automatisch).
- Keine Blind-Migration; keine Automatisierung der Faktenrecherche
  („Recherche, kein Skript" — Vertrag §A).
- Keine Multi-Agent-Orchestrierung vor stabiler Kalibrierung.

## Phase 0 — Stack stabilisieren

1. **Unabhängiges Review von PR #103** (Opus, Governance-Pflicht), danach Merge.
2. Auf dem Standard-/Pilot-Stack, vor deren Merge:
   - `broker-v2-readiness.yml` **erzeugen** (Format definieren; Cockpit-Status je
     Markt aus den auditierten Cockpit-Feldern ableiten, redaktionelle Felder
     manuell) — damit wird das Vor-Gate des Vertrags erstmals ausführbar.
   - Inventar **regenerieren** (`npm run inventory:reviews`), `--check` grün.
   - Voller Gate-Lauf (`npm run ci` + lokaler `npm run build` — CI baut nicht
     voll, siehe bekannte Lücke).
   - `audits/reports/unit-latest.json` nicht committen.
3. `feat/broker-v2-standard` und `feat/charles-schwab-v2-pilot` als separate PRs
   (kleiner Blast-Radius pro Review) in dieser Reihenfolge mergen, jeweils nach
   unabhängigem Review.
4. PR #105 (Evidence-Guard) ist unabhängig und kann parallel mergen; nach dessen
   Merge die gated e2e-Ausnahme entfernen (bestehender Task).

## Phase 1 — Skills + Kalibrierung

Repo-Skills unter `.claude/skills/` (versioniert, reviewbar). Die Skills
**orchestrieren nur** — verbindliche Wahrheit bleiben Vertrag + Validatoren:

| Skill | Zweck |
|---|---|
| `/v2-status` | Inventar, Readiness, Triage-Stand, blockierte Seiten anzeigen |
| `/v2-research <broker> <market>` | Quellen-Dossier erzeugen (Websuche Pflicht): Fakten + `sourceHref` + `asOf` + regulatorische Entität je Markt; Ablage `docs/reviews/research/<market>-<slug>.yaml`; Status `draft` → `approved` erst nach unabhängiger Faktenprüfung |
| `/v2-migrate <path>` | Migration **ausschließlich aus freigegebenem Dossier** (hartes Gate); 5-Sektionen-Mapping, Claim-Sektionen entfernen (nicht umbenennen), danach Guard + Inventar-Regeneration |
| `/v2-verify <path>` | Guard, Inventar-Check, SEO-/forbidden-claims-Checks, relevante Tests, Diff-Zusammenfassung fürs Review |

**Triage-Artefakt:** `docs/reviews/broker-v2-triage.yml` — je Kandidat eine
Entscheidung `migrate | update | merge | archive | redirect` mit Begründung und
Datum. Beispiel: **TD Ameritrade ist kein V2-Kandidat** — alle Konten sind zu
Schwab übertragen; die Seite braucht zuerst eine Redirect-/Archivierungs-
entscheidung (eigener Task, außerhalb dieses Rollouts).

**Kalibrierung:** genau 2 Migrationen. Kandidat 1: `content/us/trading/
interactive-brokers-review.mdx` (aktiv, keine Claim-Sektionen, im auditierten
US-Trading-Cockpit). Kandidat 2 wird **erst nach dem Readiness-Manifest**
festgelegt.

**Modellrollen:** Recherche/Dossier + Migration = Default Implementer (frische
Session pro PR) · Dossier-Faktenprüfung + PR-Review = Independent Reviewer ·
Inventar/Readiness-Generator = Mechanical Worker bzw. Skript · Skill-Design und
Format-Entscheidungen = Principal Architect.

## Phase 2 — Kontrollierte Wellen

- **Welle 1** = die 2 Kalibrierungs-Reviews → unabhängige fachliche Prüfung →
  Skill- und Dossierformat-Korrekturen zurückschreiben.
- **Welle 2** ≈ 5 Reviews, danach **brokerweise Cluster mit Markt-Overlays**:
  ein Broker-Dossier pro Stamm, Markt-Overlay je regulatorischer Entität
  (z. B. eToro USA/UK/AUS-Entitäten; CMC ASIC/CIRO). Mehrfach-Markt-Broker
  amortisieren so die Recherche (IBKR ×4 inkl. US-Forex-Variante, eToro ×3,
  CMC ×3, IG ×3, je ×2: Pepperstone, OANDA, Plus500, Questrade, forex.com).
- Multi-Agent-Orchestrierung (parallele Recherche → Migration → Verify) erst ab
  Welle 2 und nur bei stabiler Kalibrierung — vorher würde sie einen
  unkalibrierten Prozess beschleunigen.
- Jede Welle = eigener PR, frische Implementer-Session, unabhängiges Review.

## Qualitäts-Gates (jede einzelne Migration)

1. Dossier `approved` (Fakten + Quellen unabhängig geprüft).
2. Cockpit-Readiness laut Manifest erfüllt (Vertrag „Vor der Umstellung", Punkte 1–4).
3. `npm run check:review-v2` grün + Inventar regeneriert und `--check` grün.
4. forbidden-claims-/Evidence-Checks grün.
5. Lokaler `npm run build` grün (CI-Lücke: kein voller Next-Build).
6. Unabhängiges Review des PRs vor Merge.

## Offene Punkte

- Format von `broker-v2-readiness.yml` (wird in Phase 0 entschieden; Architekt).
- Redirect-/Archivierungskonzept TD Ameritrade (separater Task).
- Ob Welle-2+-Cluster einen Workflow-Batch nutzen — Entscheidung nach Welle 1.
