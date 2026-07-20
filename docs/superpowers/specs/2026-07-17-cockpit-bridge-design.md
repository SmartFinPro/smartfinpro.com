# Cockpit-Brücke: „Market Position Panel" (DecisionBridge)

> **Spec / Implementation Brief für Sonnet** · 2026-07-17
> Ersetzt den `<ExpertBox>`-Slot in 203 Review-Artikeln durch eine datengetriebene
> Brücke in die 38 Best-X-Cockpits. Keine Personen, keine erfundenen Zahlen,
> ohne Daten wird nichts gerendert.
> Kontext: `docs/superpowers/specs/2026-07-17-claims-inventory.md`,
> Guard: `lib/editorial/forbidden-claims.ts`.

---

## 1. Die Idee

Der Leser hat 4.000+ Wörter über EIN Produkt gelesen — was ihm fehlt, ist das eine,
was ein einzelner Review strukturell nicht liefern kann: **Kontext im Feld**. Die
Brücke ist deshalb kein „Vergleiche jetzt"-Werbekasten, sondern ein ruhiges
Daten-Exhibit im Stil eines Research-Reports: **„Wo steht dieses Produkt im
gescorten Feld?"** — Rang, Score gegen den Feldführer, Teilwert-Profil, und als
Signatur-Element die **ausgewiesene Konfidenzstufe** samt Prüfdatum und
Quellenlage. Damit wird der einzige echte Vertrauens-Vorsprung der Site (kein
Wettbewerber publiziert Konfidenz je Datenpunkt) zum sichtbaren Kern des
wertvollsten Slots. Der CTA ist die natürliche Konsequenz des Exhibits — „sieh
dir das ganze Feld an" — nicht sein Vorwand. Und weil der Slot ausschließlich aus
`product_attributes` rendert und bei fehlenden Daten leer bleibt, ist er
strukturell fabrikationsfrei: Es gibt keinen Text-Fallback, den jemand erfinden
könnte.

**Warum nicht generisch:** Ein generischer Kasten sagt „wir haben auch einen
Vergleich". Dieses Panel *zeigt das Ergebnis des Vergleichs für genau das
Produkt, über das der Leser gerade liest* — mit ehrlicher Unsicherheitsangabe.
Das ist die Bloomberg-/McKinsey-Geste: Substanz als Ästhetik, Zahl vor Adjektiv.

---

## 2. Was der Leser sieht

Visuelle Grammatik = bestehendes Split-Panel-Hausmuster (identisch zu
`TrustAuthority` / dem alten `ExpertBox`-Footprint, damit das Layout der 203
Seiten nicht springt): `rounded-2xl border border-gray-200 bg-white shadow-sm
my-10`, oben 1px-Gradient-Bar `linear-gradient(90deg, var(--sfp-navy) 0%,
var(--sfp-gold) 100%)`, links 260px-Panel auf `var(--sfp-sky)`, rechts Inhalt.
Helles Trust-Design, ausschließlich CSS-Variablen, `tabular-nums` für alle
Zahlen. `data-testid="decision-bridge"` am Wurzelelement.

**Linkes Panel (alle Zustände gleich):**
- Icon-Chip (wie Hausmuster: 28px, `rgba(26,107,58,0.1)`-Hintergrund) mit
  `BarChart3`-Icon in `var(--sfp-green)`.
- Small-Caps-Titel in `var(--sfp-navy)`: **`MARKET POSITION`**
- Subline (11px, `var(--sfp-slate)`): `{topicLabel} · {fieldCount} providers analysed`
  (z. B. „Best Super Funds · 8 providers analysed").

### Zustand A — das rezensierte Produkt ist im Cockpit-Feld (`position !== null`)

Rechtes Panel, vier Zeilen:

1. **Rang-Zeile:** groß und tabular `#3` + daneben `of 8 in Best Super Funds`
   (14px, `--sfp-ink`). Wenn `position.isTopPick`: Gold-Badge `Top Pick`
   (bestehende Badge-Optik, `--sfp-gold`). Wenn Rang 1, aber kein Top-Pick-Flag:
   kein Badge — nichts behaupten, was die Daten nicht sagen.
2. **Score-Vergleich:** zwei horizontale, gleich skalierte Balken (0–10):
   - `{position.name}` — Balken in `var(--sfp-navy)`, Wert rechts `8.2` (eine
     Dezimale).
   - `Field leader: {leader.name}` — Balken in `var(--sfp-gold)`, Wert `8.9`.
   - Ist das Produkt selbst Feldführer (`position.rank === 1`): nur EIN Balken
     plus Textzeile `Field leader` in `var(--sfp-gold-dark)` — kein zweiter
     Balken gegen sich selbst.
   - Balken sind `aria-hidden`; die Werte stehen als Text daneben (A11y).
     Optional reiner CSS-`transition` auf `width` — **kein Framer Motion**.
3. **Teilwert-Profil:** max. 4 Einträge aus `position.subScores`
   (Insertion-Reihenfolge des JSONB, keine Umsortierung), als kompakte
   Label+Wert-Zellen: `Fees 8.0 · Features 8.2 · UX 8.4 · Support 7.8`.
   Key-Humanisierung deterministisch: `ux → UX`, sonst
   `key.charAt(0).toUpperCase() + rest` (kein Mapping-Dictionary erfinden).
   Ist `subScores` leer → Zeile entfällt komplett.
4. **Konfidenz-Fußzeile** (das Signatur-Element):
   - Punkt-Indikator: `high` → `var(--sfp-green)`, `medium` → `var(--sfp-gold)`,
     `low` → `var(--sfp-slate)`.
   - Exakte Copy (englisch, wörtlich so):
     - high: `Data confidence: High — figures confirmed against official sources.`
     - medium: `Data confidence: Medium — verified, with some figures pending second-source confirmation.`
     - low: `Data confidence: Low — based on limited public data; treat as indicative.`
     - `confidence === null` → Zeile entfällt (nichts behaupten).
   - Darunter 11px `--sfp-slate`:
     `Verified {Mon YYYY} · {officialSourceCount} of {fieldCount} datasets from official sources`
     — Datumsteil entfällt bei `dataVerifiedAt === null`; Quellenteil entfällt
     bei `officialSourceCount === 0`. Sind beide leer, entfällt die Zeile.

**CTA (ein einziger, Gold):** Button `background: var(--sfp-gold)`, Hover
`--sfp-gold-dark`, Label `Compare all {fieldCount} {topicNoun} →`.
`topicNoun` = deterministische Ableitung aus dem Manifest-Label:
`label.replace(/^Best /, '').toLowerCase()` (z. B. „super funds",
„robo-advisors & micro-investing"). Href = `cockpitHref` (interner Next-`Link`).
Darunter eine 11px-Zeile (`--sfp-slate`), einmalig der Trumpf in Worten:
`We publish a confidence level for every dataset — so you know exactly how solid each number is.`

### Zustand B — Cockpit vorhanden, aber das Produkt ist nicht im Feld (`position === null`)

Rechtes Panel als „Field at a glance"-Stat-Zeile (Optik wie das
`TrustAuthority`-Stat-Grid: `grid-cols-2 lg:grid-cols-4 gap-px` auf `#E5E7EB`
— dieser eine Grauwert ist im Hausmuster bereits so hartkodiert und wird
identisch übernommen):

- `{fieldCount}` / `Providers analysed`
- `{leader.name}` / `Field leader · {leader.score}/10`
- `{scoreMin}–{scoreMax}` / `Score spread` (min/max der echten Scores im Feld)
- `{Mon YYYY}` / `Last verified` (entfällt bei `lastVerified === null`; Grid
  rendert dann 3 Zellen)

Darunter Konfidenz-Verteilung als eine Textzeile:
`{high} high · {medium} medium · {low} low confidence ratings across the field`
(Terme mit Wert 0 weglassen). CTA identisch zu Zustand A.

### Zustand C — kein Cockpit / keine Daten (`data === null`)

**Es wird exakt `null` gerendert.** Kein Wrapper-`div`, kein Platzhalter, kein
Text, keine Höhe. Betroffen: die 6 Artikel ohne Cockpit (`cross-market` ×4,
`us/credit-score` ×2), jedes Topic mit 0 aktiven Zeilen, jeder Auflösungsfehler.
Zusätzliche Degradation: ist `leader.score <= 0` (Loader-Koersion von
fehlendem Score auf 0), gilt das Topic als nicht renderbar → Zustand C. Ist nur
`position.score <= 0` → Degradation auf Zustand B.

---

## 3. Datenvertrag

Einzige Datenquelle: `product_attributes` via bestehendem
`getCockpitData(market, category, topic)` (`lib/comparison/loader.ts`) —
bereits validiert (Zod), attributions-gegated und Smart-Rank-sortiert (Top Pick
gepinnt). Die Brücke erfindet **keine** eigene Query und **keine** eigene
Sortierung: **Rang = Index+1 in genau dieser Reihenfolge** — damit zeigt die
Brücke exakt dieselbe Rangfolge wie das Cockpit, auf das sie verlinkt.

Serialisierbares Übergabeobjekt (Server → Client, plain JSON):

```ts
// lib/comparison/bridge.ts
export interface DecisionBridgeData {
  market: string;
  category: string;
  topic: string;
  topicLabel: string;          // BEST_X_MANIFEST.label
  cockpitHref: string;         // `/${market}/${category}/best/${topic}`
  fieldCount: number;          // products.length (> 0, sonst null-Return)
  leader: { name: string; score: number };        // products[0]
  scoreMin: number;            // min(products[].score)
  scoreMax: number;            // max(products[].score)
  lastVerified: string | null; // max(dataVerifiedAt) über das Feld, ISO
  officialSourceCount: number; // count(sourceType === 'official')
  confidenceMix: { high: number; medium: number; low: number }; // null-Konfidenzen zählen nirgends
  position: null | {           // null → Zustand B
    rank: number;              // index+1 in getCockpitData-Reihenfolge
    name: string;              // displayName der Produktzeile
    score: number;
    subScores: Record<string, number>;
    confidence: 'high' | 'medium' | 'low' | null;
    dataVerifiedAt: string | null;
    isTopPick: boolean;
  };
}
```

| Panel-Element | Feld | Quelle (`ProductForComparison`) | Bei `null`/leer |
|---|---|---|---|
| Rang | `position.rank` | Index in `getCockpitData`-Order | Zustand B |
| Produkt-/Leader-Score | `score` | `product_attributes.score` | `<= 0` → Degradation (s. o.) |
| Teilwert-Profil | `subScores` | `sub_scores` JSONB | Zeile entfällt |
| Konfidenz-Badge | `confidence` | `confidence` | Zeile entfällt |
| Konfidenz-Mix (B) | `confidenceMix` | `confidence` aggregiert | 0-Terme weglassen |
| Prüfdatum | `dataVerifiedAt` / max im Feld | `data_verified_at` | Datumsteil entfällt |
| Quellenzeile | `officialSourceCount` | `source_type === 'official'` gezählt | Teil entfällt bei 0 |
| Top Pick | `isTopPick` | `is_top_pick` | kein Badge |
| Label/Href | Manifest | `BEST_X_MANIFEST` | kein Eintrag → Zustand C |

**Topic-Auflösung** (deterministische Leiter in `getDecisionBridgeData`):

1. **Frontmatter-Override:** MDX-Frontmatter-Feld `cockpitTopic: "<topic>"` —
   nur akzeptiert, wenn `getTopicConfig(category, topic, market) !== null` UND
   ein Manifest-Eintrag für `market/category/topic` existiert; sonst
   `console.warn` und weiter mit Stufe 2. (Frontmatter statt Tag-Prop, weil die
   Auflösung serverseitig in `page.tsx` laufen muss — `content.meta` liegt dort
   bereits vor.)
2. **Produkt-Match:** für jeden `BEST_X_MANIFEST`-Eintrag mit passendem
   `market/category` (in Manifest-Reihenfolge, `legacy`-Einträge übersprungen)
   `getCockpitData` laden; erstes Topic, dessen Feld ein Produkt mit
   `reviewSlug === slug` (Artikel-Slug) enthält, gewinnt → `position` gesetzt.
3. **Eindeutiges Topic:** genau EIN Manifest-Eintrag für `market/category`
   (nicht-legacy, mit Daten) → dieses Topic, `position = null` (Zustand B).
   Einzige mehrdeutige Kombination ist heute `us/personal-finance` (4 Topics).
4. **Sonst `null`** → Zustand C. Kein Raten, kein „nächstbestes" Topic.

**Aufrufort:** `app/(marketing)/[market]/[category]/[slug]/page.tsx` (Server),
in beiden Zweigen (Review + Guide), parallel zu den bestehenden
`Promise.all`-Fetches. Fehler werden gefangen und auf `null` degradiert
(`try/catch` + `console.warn`) — die Brücke darf niemals eine Seite crashen.
Optional `unstable_cache` mit Key `['decision-bridge', market, category, slug]`,
`revalidate: 3600` (Muster: `getBestXIndex`). Seiten sind SSG — Kosten fallen
beim Build an, max. 4 `getCockpitData`-Aufrufe pro Seite (nur
`us/personal-finance`), sonst 1.

---

## 4. Komponenten-API

Kein „expert" in Datei-, Komponenten- oder Prop-Namen.

### `lib/comparison/bridge.ts` — Server-Loader
```ts
import 'server-only';
export interface DecisionBridgeData { /* s. o. */ }
export async function getDecisionBridgeData(
  market: Market,
  category: Category,
  slug: string,
  frontmatterTopic?: string,
): Promise<DecisionBridgeData | null>;
// Pure Kernlogik (Leiter + Aggregation) als separat exportierte, DB-freie
// Funktion `buildDecisionBridgeData(entries, productsByTopic, slug, override)`
// für Unit-Tests ohne Supabase.
```

### `components/marketing/decision-bridge.tsx` — `'use client'`
```tsx
'use client';
import { createContext, useContext } from 'react';
import type { DecisionBridgeData } from '@/lib/comparison/bridge'; // reiner Typ-Import — kein server-only-Laufzeitimport in den Client-Bundle

const DecisionBridgeContext = createContext<DecisionBridgeData | null>(null);

export function DecisionBridgeProvider({ data, children }: {
  data: DecisionBridgeData | null;
  children: React.ReactNode;
}) { /* Context.Provider */ }

/** MDX-Tag. Bewusst PROPLOS — es gibt nichts, was ein MDX-Autor
 *  hineinfabrizieren könnte. Daten kommen ausschließlich aus dem Context. */
export function DecisionBridge(): React.ReactNode | null {
  const data = useContext(DecisionBridgeContext);
  if (!data) return null;
  // ... Zustände A/B, Tracking (Abschnitt 5)
}
```

**Achtung Import-Falle** (Memory: Client-Import aus `lib/actions` → hängendes
Suspense/Turbopack-Crash): `decision-bridge.tsx` importiert aus
`lib/comparison/bridge.ts` NUR den Typ (`import type`). Wenn Sonnet auf Nummer
sicher gehen will: `DecisionBridgeData` in `lib/comparison/types.ts` (bereits
„pure types, no server imports") definieren und von beiden Seiten importieren —
das ist die bevorzugte Variante. `npm run check:imports` muss grün sein.

### Verdrahtung (chirurgisch, 3 Stellen)

1. **`page.tsx`** (beide Zweige): `const decisionBridge = await
   getDecisionBridgeData(market, category, slug, content.meta.cockpitTopic)`
   → als neues Prop `decisionBridge` an `ReportLayout`.
2. **`components/marketing/report-layout.tsx`** (Server Component): neues
   optionales Prop `decisionBridge?: DecisionBridgeData | null`; um die
   bestehende Zeile `<SafeMDX source={mdxSource} />` (~Z. 524) wird
   `<DecisionBridgeProvider data={decisionBridge ?? null}>…</DecisionBridgeProvider>`
   gelegt. Sonst nichts anfassen.
3. **`lib/mdx/components.tsx`**: `DecisionBridge` importieren und in die
   Components-Map aufnehmen; `ExpertBox`-Import/-Map-Eintrag entfernen.
   (`TrustAuthority`/`MethodologyBox` werden laut Claims-Inventory-Spec in eine
   personenfreie Datei — Vorschlag: `components/marketing/verified-data.tsx` —
   verschoben und **unverändert** weiterexportiert; Import-Pfad hier
   nachziehen.)

### MDX-Codemod (203 Dateien)

Deterministisches Skript `scripts/replace-persona-blocks.mjs`
(`node`-ausführbar, idempotent):

- Jedes `<ExpertBox …/>` (selbstschließend, mehrzeilig) und jedes
  `<ExpertBox …>…</ExpertBox>` (gepaart) wird durch exakt `<DecisionBridge />`
  ersetzt — **erste Okkurrenz pro Datei**; weitere Okkurrenzen ersatzlos
  entfernen (ein Panel pro Artikel).
- Auch in den 6 Artikeln ohne Cockpit wird der Tag gesetzt (rendert `null`;
  wenn dort später ein Cockpit live geht, leuchtet die Brücke automatisch auf —
  gleiches Aktivierungsprinzip wie die Manifest-Tiles).
- Für `us/personal-finance`-Artikel: `cockpitTopic` NUR ins Frontmatter
  schreiben, wenn Stufe 2 (Produkt-Match via `review_slug`) es eindeutig
  liefert; das Skript gibt eine Abdeckungs-Tabelle aus
  (Datei → aufgelöstes Topic → Zustand A/B/C). Erwartung: ≥ 197 Dateien
  Zustand A oder B. Kein Topic raten, keine Keyword-Heuristik.
- Danach `npm run check:mdx` (JSX-Syntax) und den Forbidden-Claims-Guard laufen
  lassen.
- `ExpertEndorsement` (20 Content-Dateien) ist **nicht** Teil dieser Spec —
  wird über die Claims-Inventory-Entfernung abgedeckt; das Codemod-Skript darf
  es zählen und melden, aber nicht anfassen.

---

## 5. Tracking

**Bestehendes Schema `cockpit_v1`** (`lib/analytics/cockpit-events.ts` +
`lib/analytics/cockpit-tracking.ts`) — keine neue Schema-Version, keine neue
Tabelle, kein neuer Endpoint. Die Surface `'body'` ist im Union-Typ
`CockpitSurface` bereits reserviert („no provider CTA exists on those surfaces
today") — genau dafür ist sie da; Kommentar entsprechend aktualisieren.

- **Context:** `useCockpitTracking({ market, category, topic })` mit den Werten
  aus `DecisionBridgeData` — `pagePath` ist automatisch der Review-Pfad
  (`usePathname`).
- **Impression:** `viewOnce('body', { productCount: fieldCount })` via
  IntersectionObserver (≥ 50 % sichtbar), Dedupe pro Session übernimmt der
  bestehende `ImpressionDeduper`.
- **CTA-Klick:** `track('cockpit_cta_click', {…}, { immediate: true })` mit:
  - `surface: 'body'`, `ctaPosition: 'primary'`,
  - `productSlug`/`rank`/`isTopPick` aus `position` (nur Zustand A),
  - `ctaMode: 'cockpit'` und `destinationType: 'internal_cockpit'` — **additive**
    Union-Erweiterung von `CockpitCtaMode` bzw. `CockpitDestinationType`
    (JSONB-Payload, kein DB-Schema betroffen; entspricht der Repo-Philosophie
    „typed now"). `resolveCockpitCta` wird NICHT angefasst — es löst
    Provider-CTAs auf, die Brücke hat keinen.
- **Dashboard-Hinweis (in den PR-Text aufnehmen):** `parseCockpitPath` matcht
  Review-Pfade nicht — das Cockpit-Dashboard leitet Kontext aus `page_path` ab.
  Brücken-Events tragen Kontext vollständig in `properties`
  (market/category/topic sind via `buildCockpitEventData` immer gesetzt). Ein
  eigener Dashboard-Filter (`surface = 'body'`) ist bewusst Follow-up, nicht
  Teil dieses PRs. Sonnet verifiziert nur, dass unbekannte
  `ctaMode`/`destinationType`-Werte `/dashboard/analytics/cockpits` nicht
  crashen (fail-soft rendern reicht).
- **Downstream:** Klick → Cockpit-Besuch ist über `sfp_session_id` joinbar
  (Session-Layer existiert); kein `?src=`-Parameter, keine neuen Props nötig.

---

## 6. Abnahmekriterien (prüfbar)

1. **Guard:** Forbidden-Claims-Guard-Test grün; zusätzlich
   `grep -riE 'CFA|CFP|\bAFA\b|expert' components/marketing/decision-bridge.tsx lib/comparison/bridge.ts`
   → 0 Treffer.
2. **Codemod-Vollständigkeit:** `grep -rl '<ExpertBox' content/` → 0 Dateien;
   `grep -rl '<DecisionBridge />' content/ | wc -l` → 203; kein Artikel
   enthält den Tag doppelt.
3. **Auflösungs-Abdeckung:** Codemod-Report zeigt ≥ 197 Artikel in Zustand A
   oder B; die 6 bekannten Ohne-Cockpit-Artikel in Zustand C.
4. **Leerzustand:** Prod-Build + `curl` einer Cross-Market-Seite → HTML enthält
   weder `data-testid="decision-bridge"` noch sonst Brücken-Markup (Memory:
   SSR-Verifikation immer via Prod-Build + curl, nicht nur Dev).
5. **SSR-Sichtbarkeit:** `curl` von
   `/au/superannuation/best-super-funds-australia` enthält das Panel-Markup
   inkl. Zahlen im Server-HTML (Crawler-sichtbar).
6. **Zustand A korrekt:** Auf einer Seite mit Produkt-Match stimmen Rang,
   Score und Leader-Name exakt mit der Reihenfolge/den Werten des verlinkten
   Cockpits überein (manueller Abgleich beider Seiten).
7. **Unit-Tests** (`__tests__/unit/decision-bridge.test.ts`, gegen die pure
   `buildDecisionBridgeData`): Frontmatter-Override (gültig/ungültig),
   Produkt-Match gewinnt vor Eindeutigkeit, mehrdeutig ohne Match → `null`,
   0 Zeilen → `null`, `leader.score <= 0` → `null`,
   `position.score <= 0` → Zustand B, Konfidenz-Mix zählt `null` nicht,
   `officialSourceCount`/`lastVerified`-Aggregation.
8. **Tracking:** Klick auf den CTA erzeugt in `analytics_events` eine Zeile mit
   `event_category='cockpit'`, `properties.schemaVersion='cockpit_v1'`,
   `properties.surface='body'`, `properties.destinationType='internal_cockpit'`
   und korrektem market/category/topic; Impression feuert einmal pro Session.
9. **Design-Regeln:** kein Hex-Wert außer dem übernommenen Grid-Grau `#E5E7EB`
   des Hausmusters; kein `backdrop-filter`, kein Dark-Design; kein Framer
   Motion; `'use client'` nur in `decision-bridge.tsx`.
10. **Build & Checks lokal:** `npm run build` (CI baut nicht voll — Memory),
    `npm run check:imports`, `npm run check:mdx`, Unit-Suite — alle grün.

---

## 7. Was diese Spec bewusst NICHT tut

- **Kein Provider-CTA / kein `/go`-Link in der Brücke.** Nur 4 aktive
  Affiliate-Links — ein Verkaufs-Button an 203 Stellen würde fast überall ins
  Leere zeigen oder das Attribution-Gate umgehen. Die Brücke verkauft Kontext;
  die Monetarisierung passiert im Cockpit, wo `resolveCockpitCta` sauber gated.
- **Kein Quiz/Matcher im Slot.** Das Cockpit hat den Matcher bereits;
  Duplikation = doppelte Wartung + verwässerte Messung.
- **Kein Client-Fetch, kein neuer API-Endpoint.** Serverseitige Datenübergabe
  hält die Zahlen im SSR-HTML (KI-/Google-Crawler), vermeidet Layout-Shift und
  eine weitere ungeschützte Route.
- **Keine Tag-Props im MDX (außer nichts).** Jedes Prop wäre eine Fläche, auf
  der ein Content-Generator wieder Behauptungen erfinden könnte. Einzige
  Steuerung ist `cockpitTopic` im Frontmatter — reines Routing, keine Aussage.
- **Kein neues Tracking-Schema, keine Migration, kein DB-Touch.**
- **Kein Redesign** von `TrustAuthority`/`MethodologyBox` (gesperrt, nur
  Dateiumzug laut Claims-Inventory) und kein Anfassen von `ExpertEndorsement`
  (separater Entfernungs-Task).
- **Kein Text-Fallback in Zustand C** — der leere Slot ist die strukturelle
  Garantie gegen die nächste Fabrikation.
- **Keine „Empfehlung".** Das Panel sagt nie „we recommend"; es zeigt Rang,
  Scores, Konfidenz und lässt den Leser entscheiden — genau das ist der
  Unterschied zum entfernten Ich-Zitat.

---

# ⚠️ V15 — VISUELLER VERTRAG (überschreibt die UI-Abschnitte oben)

**Freigegeben vom Betreiber am 2026-07-17** nach 15 Runden. Alles unterhalb dieser Linie hat Vorrang vor der ursprünglichen Fable-Spec, wo beide sich widersprechen. **Datenvertrag, Topic-Auflösung, Tracking und Architektur oben bleiben gültig** — nur die Darstellung wurde ersetzt.

**Pixel-Referenz im Repo:** `docs/superpowers/specs/assets/2026-07-17-market-check/market-check-v15.html`
(Artifact-Links sind login-pflichtig und taugen nicht als Abnahme-Artefakt — siehe Memory `fdl-decision-lab-status`.)

## Was sich gegenüber Fables Entwurf geändert hat — und warum

| Fable v1 | **v15** | Grund (vom Betreiber) |
|---|---|---|
| „Market position"-Panel, Rang + Score-Balken | **Ranglisten-Strip**: Top 3, Lücke, eigene Zeile hervorgehoben, letzter Platz | „Die Rangliste ist der stärkste Teil" — beantwortet „wer steht höher?", was der Balken offenließ |
| Überschrift `MARKET CHECK` (Versal-Tag) | **„How eToro compares"** — Georgia 17px, Satzschreibung | natürlicher, gehört zum Artikel statt ihn zu unterbrechen |
| 0–10-Achse mit Ticks | **entfällt** | der Strip zeigt die Position konkreter als jede Skala |
| Sub-Score-Tabelle sichtbar | **hinter `<details>` „View score details"** | „erklärt und verteidigt jede Zahl, statt zu entscheiden" |
| Konfidenz als Signatur-Element, rot | **neutral (slate), in der Fußzeile** | Rot ist laut CLAUDE.md **nur** für Warnungen/Cons — ein Datenqualifier ist keine Warnung |
| CTA unten | **Verdict → CTA** | erst Entscheidungshilfe, dann Vergleich |

## Aufbau (Zustand A)

```
How eToro compares                                    #8 of 9
══════════════════════════════════════════════ Navy 2px ═════
Strongest: Fees 8.8        Weakest: Support 7.8
─────────────────────────────────────────────────────────────
1   Fidelity              Best overall              9.6
2   Charles Schwab        Best all-in-one           9.3
3   Interactive Brokers   Best for active traders   9.2
⋯   4 more between
8   eToro                 Low-cost options trading  8.3   ← sky-bg, Navy-Marker RECHTS
9   Merrill Edge          Bank of America clients   8.0
▌ VERDICT
▌ Good for low-cost options trading. Consider alternatives if
▌ reliable support is a priority. The field is tight: only 1.6
▌ points separate all nine platforms.
[ Compare all 9 platforms → ]
▸ View score details
Verified 3 Jul 2026 · 9 official sources · Data confidence: limited · How we score
```

**Reihenfolge bindend:** `bar → strongest/weakest → strip → verdict → cta → details → foot`

## Harte Regeln

- **Marker RECHTS** (`tr.you td:last-child{box-shadow:inset -2px 0 0 navy}`), Score-Spalte `padding-right:9px`. Links verdeckt die Rangziffer.
- **Verdict-Bahn**: `--sfp-gray` + 2px Navy links, Label und Text **ohne Spalt** (0px, verifiziert). Georgia 14px.
- **Gold genau einmal**: der CTA. Kein weiteres Gold.
- **Kein Bild, keine Logos** (`logo_url` ist 0/273 leer), keine Person, keine Sterne, kein `AggregateRating`.
- Namen im Strip verlinken auf **Reviews**, nie auf `/go`. Das Verkaufs-Gate bleibt im Cockpit.
- Strip-Reihenfolge = **exakt** die Smart-Rank-Ordnung des Cockpits. Keine zweite Wahrheit.

## Berechnete Textzeilen — nie geschrieben

`Strongest`/`Weakest` = max/min aus `sub_scores`. Die Verdict-Zeile „only 1.6 points separate all nine" = `max(score) − min(score)`, `count`. Rendern, nicht formulieren — sonst driftet der Text von den Daten weg.

## Sprachregeln (teuer gelernt)

- **Keine Superlative aus DB-Feldern übernehmen.** `best_for: "Cheapest options trading"` ist **widerlegt** (Webull hat denselben `options_fee: 0.0`). Der Kasten sagt „Low-cost".
- **„Zero options *contract* fees"**, nie „Zero options fees". `options_fee_note`: „no commission or contract fees **beyond regulatory pass-throughs**" — es gibt Optionsgebühren, nur keine Kontraktgebühren. Schema: `// round-trip (open+close) $/contract`.
- **Kein Label „Recommendation".** `/imprint` sagt „we do not provide financial advice"; in AU trennt genau dieses Wort *factual information* von AFSL-pflichtiger *advice*. „Verdict" ist Standard im Review-Journalismus und bleibt.

## ⛔ Blocker vor dem Vollausrollen: Claim-Audit über 273 Zeilen

Ein einziger widerlegter Superlativ steht bei **einem** Produkt an **vier** Stellen:
`best_for` · `deep_dive` · `pros[0]` · `attributes.options_fee_note`

`pros`/`cons` sind 273/273 befüllt, aber **nie auditiert**. Für den Piloten reichen 4 Produkte von Hand; **vor dem Ausrollen auf ~199 Artikel muss der Audit laufen.** Falls später grüne Haken dazukommen: ein Haken ist ein **Verifikationssignal** und beglaubigt, was daneben steht — dann ist der Audit zwingend vorher.

**Nebenbefund:** `confidence` wird von Hand im Seed gesetzt, ohne Regel und ohne Begründungsfeld. Die Begründung existiert aber — eToros dritter Con lautet „Extended-hours trading availability for US accounts is **not established**". `confidence_reason` ist aus den `cons` ableitbar, per Hand. Bis dahin ist „Data confidence: limited" nur durch den `How we score`-Link gedeckt — den muss `/methodology` (Task 8) tatsächlich definieren.
