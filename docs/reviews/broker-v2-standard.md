# Broker-V2 — Publikationsvertrag

Was eine Broker-Review erfüllen muss, um `reviewLayout: 'v2'` tragen zu dürfen.

Die Referenz ist [`content/us/trading/etoro-review.mdx`](../../content/us/trading/etoro-review.mdx)
— sie erfüllt diesen Vertrag vollständig und dient als Beleg, dass er erreichbar ist. Referenz
heißt: Design, Struktur und Vertragserfüllung. Sie ist **keine eingefrorene Wahrheit** — Fakten,
Quell-URLs, Texte und Prüfdaten dort bleiben aktualisierbar. Dieser Vertrag prüft die **Form**,
nicht den Inhalt einer bestimmten Fassung.

**Das Design ist nicht Teil dieses Vertrags.** Es liegt vollständig in geteilten Komponenten
(`review-layout-v2.tsx`, `verdict-card.tsx`, `SECTION_LABEL` in `lib/reviews/callout-style.ts`).
Wer den Vertrag erfüllt und umschaltet, bekommt die abgenommene Optik automatisch — es gibt keine
per-Review-Stilregel und soll keine geben.

Geltungsbereich: **Broker-Reviews in `trading` und `forex`**. Andere Kategorien brauchen eigene
V2-Profile; die fünf Pflichtsektionen unten sind auf Broker zugeschnitten.

---

## A — Frontmatter

Basis ist `VerdictFrontmatterSchema` in
[`lib/reviews/verdict-frontmatter.ts`](../../lib/reviews/verdict-frontmatter.ts). Es macht nur
`verdict`, `essentialFacts` und `alternatives` verpflichtend — für eine publikationsreife Seite
reicht das nicht. Der Guard ergänzt die fehlenden Pflichten:

| Feld | Anforderung |
|---|---|
| `verdict.positioning` | 18–30 Wörter |
| `verdict.summary` | 70–120 Wörter |
| `verdict.bestFor` / `notFor` / `topStrengths` | je 1–3 Einträge |
| `verdict.mainLimitation` | nicht leer |
| `verdict.bestAlternative` | `{ name, slug, reason }` |
| `essentialFacts` | 4–6 Einträge, je mit `label`, `value`, `asOf` (ISO) und `sourceHref` (absolute URL) |
| `alternatives` | 2–3 Einträge, je `{ slug, name, whyInstead }` |
| `sectionVerdicts` | **Pflicht**, alle fünf Keys `fees` · `markets` · `platform` · `safety` · `support`, je 15–30 Wörter |
| `finalDecision` | **Pflicht**, 80–140 Wörter |
| `faq` | **Pflicht**, 4–8 Einträge, Antworten je 40–100 Wörter |
| `dataVerifiedDate` | **Pflicht**, ISO, nicht älter als das jüngste `essentialFacts[].asOf` |
| `updateLog` | **Pflicht**, ≥ 1 Eintrag `{ date: ISO, change: nicht leer }` |
| `modifiedDate` | **Pflicht**, tatsächliches Änderungsdatum |

### Die drei Daten bedeuten nicht dasselbe

Sie dürfen nicht gemeinsam „durchgezogen" werden:

- **`modifiedDate`** — bei *jeder* Änderung aktualisieren, auch bei reiner Textkorrektur.
- **`dataVerifiedDate`** — *nur* nach tatsächlicher Faktenprüfung. Eine Textkorrektur allein
  rechtfertigt kein neues Prüfdatum; das wäre eine Frische-Behauptung ohne Deckung.
- **`asOf`** — bleibt faktbezogen pro `essentialFacts`-Eintrag und wandert nicht automatisch mit.

### Quellenpflicht

Jeder `essentialFact` braucht eine echte, überprüfbare Quelle — die offizielle Anbieterseite oder
ein Regulator (z. B. FINRA BrokerCheck). **Nicht** aus den DB-Feldern `best_for`, `pros`, `cons`
oder `deep_dive` ableiten: die sind ungeprüft und waren die Quelle des sanierten
Fabrication-Problems. Recherche, kein Skript.

---

## B — Body: fünf Sektionen, je ein Dreier

Der Body enthält **genau fünf** H2-Sektionen, in dieser Reihenfolge, jede als Dreier aus
Anker, Überschrift und Sektions-Verdikt:

```mdx
<span id="fees"></span>

## Fees

<SectionVerdict id="fees" />
```

| Reihenfolge | `id` | H2-Titel |
|---|---|---|
| 1 | `fees` | Fees |
| 2 | `markets` | Markets & Tools |
| 3 | `platform` | Platform Experience |
| 4 | `safety` | Safety & Regulation |
| 5 | `support` | Support |

IDs und Titel kommen aus `REVIEW_V2_ANCHORS` in
[`lib/reviews/section-anchors.ts`](../../lib/reviews/section-anchors.ts) — dort steht die einzige
gültige Fassung, nicht hier.

Warum alle drei Teile nötig sind: der `<span id>` ist das Sprungziel der Sektions-Navigation, die
H2 die sichtbare Überschrift — und **ohne `<SectionVerdict id="…" />` bleibt das vorhandene
`sectionVerdicts`-Frontmatter unausgegeben.** Fehlt der Aufruf, ist der Text geschrieben, geprüft
und unsichtbar.

Regeln: jede ID genau einmal · die H2 folgt unmittelbar auf den Anker · das `<SectionVerdict>`
folgt unmittelbar auf die H2 und trägt **dieselbe** ID · **keine zusätzlichen H2** im Body.
„Unmittelbar" heißt *nächster nicht-leerer MDX-Block*, nicht die nächste Zeile.

Die H1 kommt aus dem Layout — im Body steht keine.

### Was aus dem Body verschwindet

V1-Reviews führen Sektionen wie *Platform Evidence & Screenshots*, *Customer Support: Our Testing
Results* oder *Our 90-Day Testing Results*. Das sind Behauptungen über eigene Tests und
Screenshots ohne Belege. Sie werden bei der Migration **entfernt**, nicht umbenannt — genau wie in
der Referenz (siehe deren `updateLog`).

---

## C — Verweise

`alternatives` verlinken nach `/{market}/{category}/{slug}`. Geprüft wird der **vollständige
Pfad**, nicht der Slug: `etoro-review` existiert in vier Märkten. Zusätzlich: keine
Selbstverlinkung, keine doppelten Einträge, jedes Ziel existiert.

`sourceHref` wird nur auf Form geprüft — **kein Netzwerkzugriff**, sonst wird der Build flaky.
Ob eine Quelle das belegt, was sie belegen soll, entscheidet die Redaktion, nicht der Guard.

---

## D — Geltung des Guards

Der Guard prüft ausschließlich Dateien mit `reviewLayout: 'v2'` und überspringt
`content/_templates/`. Die V1-Bestände bleiben unberührt — das ist der Sicherheitsmechanismus, der
den Rollout steuerbar hält.

Weil `_templates` übersprungen wird, beweist ein grüner Guard-Lauf **nicht**, dass die Vorlage
gültig ist. Dafür gibt es einen eigenen Test.

---

## E — Cockpit-Readiness (kein Guard-Kriterium)

Die rechte Spalte — Expert-Review-Karte, Market Check, Rangliste — braucht ein aufgelöstes
Cockpit-Feld (`decisionBridge.position`). Ohne Treffer rendert die Seite, aber halb.

Das hängt an Laufzeitdaten und ist deshalb **kein** Guard-Kriterium, sondern ein redaktionelles
Vor-Gate. Es wird in [`broker-v2-readiness.yml`](./broker-v2-readiness.yml) gepflegt.

---

## Vor der Umstellung einer Review

Alle vier Punkte müssen erfüllt sein:

1. Das Produkt steht im auditierten Cockpit-Feld seines Marktes.
2. 4–6 `essentialFacts` mit recherchierten, echten Quell-URLs liegen vor.
3. Der Body lässt sich fachlich auf die fünf Sektionen abbilden.
4. Alle `alternatives`-Pfade existieren.

Danach: `npm run check:review-v2`.

## Kanonische Definition einer Broker-Review

> numerisches `rating` in der Frontmatter · Kategorie `trading` oder `forex` · Dateiname endet auf
> `-review.mdx` · außerhalb `content/_templates/`

Diese Definition schließt Vergleiche, Best-Listen und Guides automatisch aus. Sie ist in
`scripts/inventory-broker-reviews.mjs` implementiert; die erzeugte
[`broker-v2-inventory.json`](./broker-v2-inventory.json) ist die Referenz für alle Bestandszahlen —
keine Ad-hoc-Greps.
