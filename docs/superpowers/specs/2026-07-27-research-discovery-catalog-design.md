# Unified Research Discovery: Katalog, Hub und Quick Finder

> **Normative Design-Spezifikation** · 2026-07-27
>
> Basis: `origin/main` auf `afeabcb` (Research-Pilot aus PR #117 live)
>
> Status: vom Nutzer als Zielarchitektur freigegeben; ersetzt den Entwurf
> „Research Quick Finder + universelles /research" einschließlich seiner
> nachträglichen Contract-Corrections.

---

## 1. Ergebnis

SmartFinPro erhält pro Markt genau eine Research-Discovery:

- Die Startseite zeigt einen kompakten **Research Quick Finder** mit lokaler
  Suche, Kategorie-Chips, höchstens sechs Ergebnissen und einem Handoff in den
  vollständigen Research-Hub.
- `/research` für die USA sowie `/{uk|ca|au}/research` zeigen alle
  veröffentlichten Reviews und alle qualifizierten Research-Dossiers eines
  Marktes.
- Review-Frontmatter und `product_attributes` werden in einem gemeinsamen,
  serverseitigen `DiscoveryItem`-Katalog zusammengeführt.
- Vergleich und Conversion bleiben ausschließlich im bestehenden Cockpit.
  Der normale Funnel lautet Research → Review → Cockpit. Ein Dossier ohne
  Review darf aus dem Hub direkt ins zugehörige Cockpit führen; die Homepage
  führt ein solches Produkt zunächst in den Research-Hub.

Die bestehende `/research`-Pilotfunktion wird generalisiert, nicht parallel
nachgebaut. Kategorie-Hubs und Cockpit-Implementierungen bleiben außerhalb
dieses Scopes.

---

## 2. Verbindliche Produktentscheidungen

1. **Markt im Pfad:** USA `/research`; UK, CA und AU jeweils
   `/{market}/research`. Es gibt kein `?market=`.
2. **Filter in der Query:** `q`, `category`, `type`, `status`, `confidence`,
   `fresh`, später `topic` und wiederholbares `spec`.
3. **Filter-URLs sind nicht indexierbar:** Canonical zeigt immer auf den
   filterlosen Markt-Hub; jede bekannte Filter-Query erhält
   `X-Robots-Tag: noindex, follow`.
4. **Ratings bleiben semantisch getrennt:**
   - Nur ein `audited` Research-Context zeigt `Audited · x/10`.
   - Ein Review ohne ausgewählten audited Context zeigt
     `Editorial · x/5`, ohne Sternsymbol und mit separatem Link auf
     `/methodology`.
   - `reviewCount` wird auf keiner Karte dargestellt oder als Karten-Prop
     geführt.
5. **Header:** „Research" wird Desktop und Mobile ein Top-Level-Ziel.
   Der bisherige US-only-Eintrag im Trading-Mega-Panel entfällt.
6. **Homepage:** Der bisherige paginierte Report-Feed und Editor's Picks werden
   durch den Quick Finder ersetzt. Kategorie-Hubs selbst bleiben unverändert.
7. **Jeder Surface-PR enthält seine Analytics.** Es gibt keine nachträgliche
   Telemetrie-Lücke.

---

## 3. Scope und Nicht-Ziele

### Im Scope

- gemeinsamer Discovery-Katalog
- Markt-Hubs und Metadaten
- Suche und Facetten
- vollständiger serverseitiger Browse-Fallback
- topic-gebundene Shortlist und Cockpit-Handoff
- Homepage Quick Finder
- Topic- und Spec-Facetten
- Research-Analytics, SEO, A11y und Performance-Gates

### Nicht im Scope

- redaktionelles `review_slug`-Seeding für AU, CA oder UK
- Migration der Kategorie-Hubs auf `DiscoveryItem`
- neue Vergleichslogik oder neue Conversion-Oberfläche
- Änderung von `cockpit_v1` oder `tool_v1`
- neue Datenbanktabellen
- Änderungen an Review-MDX, sofern sie für diese Funktion nicht zwingend sind

---

## 4. Kanonisches Domänenmodell

Es gibt keine Typen `ReviewCatalogItem` oder `CatalogItemMeta`. Alle neuen
Konsumenten verwenden die Discovery-Nomenklatur.

```ts
type ResearchStatus = "audited" | "provisional";
type ResearchConfidence = "high" | "medium" | "low";
type DiscoveryKind = "review" | "dossier";
type CockpitKey = `${Market}/${Category}/${string}`;

interface ResearchContext {
  cockpitKey: CockpitKey;
  topic: string;
  topicLabel: string;
  manifestOrder: number;
  productSlug: string;
  displayName: string;
  tagline: string | null;
  bestFor: string | null;
  status: ResearchStatus;
  confidence: ResearchConfidence | null; // nur audited, sonst null
  dataVerifiedAt: string | null;
  auditedScore: number | null; // nur audited
  auditedRank: number | null; // nur audited
  dataPoints: number;
  compareBaseHref: string;
  keyFacts: Record<string, string>;
}

interface DiscoveryReview {
  slug: string;
  href: string;
  title: string;
  description: string;
  bestFor: string | null;
  editorialRating: number; // 0–5
  publishDate: string;
  modifiedDate: string;
  readingWords: number;
  featured: boolean;
  pricing: string | null;
}

interface DiscoveryDisplay {
  title: string;
  description: string;
  bestFor: string | null;
  searchText: string;
  sortDate: string | null;
}

interface DiscoveryItem {
  id: string;
  market: Market;
  category: Category;
  review: DiscoveryReview | null;
  display: DiscoveryDisplay;
  researchContexts: ResearchContext[];
}

type DiscoveryProjection =
  | {
      itemId: string;
      kind: "review";
      item: DiscoveryItem;
      context: null;
    }
  | {
      itemId: string;
      kind: "dossier";
      item: DiscoveryItem;
      context: ResearchContext;
    };
```

### 4.1 Identität und Deduplizierung

- Review-backed: `id = "review:" + review.href`
- Cockpit-only: `id = "product:" + market + ":" + category + ":" + productSlug`
- Topic ist nie Teil der Item-ID.
- Dasselbe Produkt in mehreren Topics bleibt ein `DiscoveryItem` mit mehreren
  `researchContexts`.
- Die Context-Reihenfolge ist Manifest-Reihenfolge; innerhalb eines Topics
  folgen audited Rank und anschließend `productSlug`.
- IDs müssen katalogweit eindeutig sein. Eine Kollision ist ein Testfehler,
  kein Last-write-wins-Fall.

### 4.2 Qualifizierter Research-Context

Nur `audited` und `provisional` werden als `ResearchContext` in Discovery
aufgenommen. `unavailable` ist kein Dossier und erzeugt für ein Cockpit-only-
Produkt kein Item. Ein Review bleibt auch ohne qualifizierten Context vollständig
erhalten.

### 4.3 Display-Felder

Review-backed Items beziehen Titel, Beschreibung, bestFor, Rating, Datum,
Featured und Pricing ausschließlich aus normalisiertem MDX-Frontmatter. Für
`display.bestFor` gilt bei Review-backed Items das MDX-`bestFor`; nur wenn es
fehlt, fällt es auf den ersten qualifizierten Context zurück.

Für Review-backed Items ist `sortDate = modifiedDate || publishDate`. Besitzt
ein Review zusätzlich Research-Contexts, bleibt dieses redaktionelle Datum die
Sortierquelle des Items; `dataVerifiedAt` beschreibt weiterhin nur den
jeweiligen Context.

Cockpit-only Items beziehen:

- `title` aus `displayName`
- `description` aus `tagline`, sonst aus `bestFor`, sonst aus dem
  Manifest-Topic-Label
- `bestFor` aus dem qualifizierten Context
- `sortDate` aus dem neuesten echten `dataVerifiedAt`, sonst `null`
- `featured = false`

Es wird kein fehlendes Datum, Rating oder Beschreibungstext erfunden.

### 4.4 Search-Text

`searchText` wird einmal serverseitig normalisiert und enthält:

- Display-Titel
- Review-Titel und -Beschreibung, falls vorhanden
- `bestFor`
- Review- und Produkt-Slugs, wobei `-` als Leerzeichen behandelt wird
- Display-Namen, Taglines und Topic-Labels aller Research-Contexts
- Kategorie-Label

Der rohe Suchtext wird niemals an Analytics gesendet.

---

## 5. Katalogaufbau und Cache

### 5.1 MDX-Basis

Pro Markt werden alle `marketCategories[market]` parallel geladen. Enthalten
sind nur:

- `slug !== 'index'`
- vorhandenes redaktionelles Rating

`readingWords` wird vor dem Entfernen des MDX-Bodys übernommen. Im Cache landen
nur normalisierte Metadaten, nie der vollständige Body.

### 5.2 Research-Overlay

Alle Manifest-Topics eines Marktes werden mit `Promise.allSettled` geladen:

1. `getCockpitData(market, category, topic)`
2. `buildResearchView(products, specColumnKeys)`
3. qualifizierte Contexts ableiten
4. per `category + reviewSlug` an Reviews hängen
5. unmatched qualifizierte Rows als Cockpit-only-Items einfügen
6. gleiche Cockpit-only-Produkt-ID über Topics zusammenführen

Ein fehlgeschlagenes Topic erzeugt genau einen strukturierten Warn-Log mit
Markt, Kategorie, Topic und Fehlertyp. Andere Topics und sämtliche Reviews
bleiben verfügbar.

### 5.3 Cache-Grenzen

- MDX-Basis: 300 Sekunden, Tags `market-reviews` und `research-catalog`
- Research-Overlay: 3600 Sekunden, Tag `research-catalog`
- öffentlicher Builder: Cache-Key enthält den Markt als Funktionsargument
- serialisierter Katalog pro Markt muss unter 200 KB bleiben

Sitemap-`lastmod` verwendet ausschließlich die ohnehin geladenen MDX-Daten und
ist nie vom Supabase-Overlay abhängig.

### 5.4 Zählregeln

- `reviewBackedCount`: Items mit `review !== null`
- `dossierCount`: Items mit mindestens einem qualifizierten Research-Context
- `discoveryItemCount`: `items.length`, ohne Doppelzählung
- `auditedItemCount`: eindeutige Items mit mindestens einem audited Context
- `verifiedDataPointCount`: Summe der Datenpunkte aller qualifizierten
  Contexts; der Tile-Text bezeichnet ausdrücklich Datenpunkte, nicht Produkte

Hero, Facetten, CTA und Analytics verwenden denselben Katalog-Snapshot.

---

## 6. Projektion, Filter und Sortierung

`DiscoveryItem` ist die stabile Entität. `DiscoveryProjection` ist das
darzustellende Ergebnis.

### 6.1 Filtervertrag

```ts
interface DiscoveryFilters {
  query: string;
  category: Category | null;
  type: DiscoveryKind | null; // URL heißt type; Datenmodell heißt kind
  status: ResearchStatus | null;
  confidence: ResearchConfidence | null;
  fresh: string | null; // ISO-Untergrenze auf dataVerifiedAt
  topic: string | null;
  specs: string[];
}
```

Reihenfolge:

1. Markt ist durch die Route fest.
2. Query und Kategorie filtern Items.
3. Topic, Status, Confidence, Freshness und Specs filtern Contexts.
4. `type=review` erzeugt nur Review-Projections.
5. `type=dossier` erzeugt nur Dossier-Projections.
6. Ohne `type` gewinnt ein passender qualifizierter Dossier-Context; andernfalls
   wird das Review projiziert.

Hat ein Item mehrere passende Contexts:

1. explizit gewähltes Topic
2. sonst erster Context in Manifest-Reihenfolge

Das Item erscheint trotzdem nur einmal. Der ausgewählte Context ist die einzige
Quelle für Score, Rang, Shortlist, Cockpit-Link und item-spezifische Analytics.

Ein aktiver Research-only-Filter (`status`, `confidence`, `fresh`, `topic`,
`spec`) schließt Items ohne passenden Research-Context aus. `fresh` vergleicht
nur `dataVerifiedAt`; `modifiedDate` wird niemals als Datenverifikation
umgedeutet.

### 6.2 Facetten

Facetten sind disjunktiv:

- Der Count einer Facette respektiert Query und alle anderen aktiven Facetten,
  ignoriert aber die eigene Dimension.
- Eine Dimension wird nur gezeigt, wenn mindestens zwei auswählbare Werte
  verbleiben.
- Kategorien folgen `marketCategories`.
- Topics folgen dem Manifest.
- Confidence und Freshness beziehen sich nur auf audited Contexts.

Ungültige oder nicht zum Markt/Kategorie-Snapshot passende Werte werden
ignoriert, nicht in den Zustand übernommen und lösen keinen Fehler aus.

### 6.3 Sortierung

Gefilterter Hub:

1. Dossiers nach Manifest-Reihenfolge
2. innerhalb des Topics nach audited Rank
3. provisional nach `productSlug`
4. Reviews nach `modifiedDate` absteigend
5. stabiler Tiebreak über `item.id`

Quick Finder ohne aktive Suche/Kategorie:

1. review-backed `featured`
2. neuestes echtes `sortDate`
3. `item.id`

Quick Finder mit Filter verwendet dieselbe Prädikats- und Projektionslogik,
zeigt aber höchstens sechs Ergebnisse.

---

## 7. Routing, SEO und Marktwechsel

### 7.1 Research-Basis

```ts
researchBaseForMarket("us") === "/research";
researchBaseForMarket("uk") === "/uk/research";
researchBaseForMarket("ca") === "/ca/research";
researchBaseForMarket("au") === "/au/research";
```

Der Helper ist die einzige Quelle für Header, Quick-Finder-CTA, Canonical,
Hreflang und interne Research-Links. Ein 4×4-Test deckt jeden Ausgangs- und
Zielmarkt ab. `/us/research` redirectet permanent auf `/research`.

### 7.2 Metadaten

`hub-copy.ts` führt pro Markt getrennte Werte für:

- Metadata-Title
- H1
- Description
- Eyebrow
- `areaServed`

Die tatsächliche Titellänge inklusive Root-Suffix ` | SmartFinPro` liegt für
jeden Markt zwischen 45 und 60 Zeichen. Descriptions liegen zwischen 140 und
160 Zeichen.

Canonical:

- US: `/research`
- übrige: `/{market}/research`

Die Languages-Map wird aus `researchBaseForMarket` aufgebaut; `x-default`
zeigt auf `/research`.

### 7.3 Filterzustände

Für `q`, `category`, `type`, `status`, `confidence`, `fresh`, `topic` und
`spec` existieren getrennte `next.config.ts`-Headerregeln für US und die drei
präfixierten Märkte. Jede Regel setzt `X-Robots-Tag: noindex, follow`.

Canonical und OpenGraph-URL enthalten keine Filterparameter.

### 7.4 JSON-LD und Sitemap

- genau ein ItemList-Schema pro Hub
- nur audited Dossier-Projections
- eindeutige Produkte, keine Mehrfachaufnahme über mehrere Topics
- Position entspricht der dargestellten audited Reihenfolge
- `areaServed` entspricht dem Markt
- Review-Hrefs werden bevorzugt; Cockpit-only nutzt den echten Cockpit-Href

Die Sitemap ergänzt UK, CA und AU und aktualisiert den bestehenden US-Eintrag.
`lastModified` ist pro Markt das jüngste echte MDX-`modifiedDate` bzw.
`publishDate`.

---

## 8. Server-/Client-Grenze und Crawlability

`ResearchHubPage` ist Server Component. Es baut:

- Discovery-Katalog und Kennzahlen
- Dossier-Nodes pro `itemId + cockpitKey`
- CatalogCard-Nodes für den vollständigen Browse-Zustand
- JSON-LD
- einen vollständigen `browseFallback`

`ResearchHub` ist Client Component und erhält serialisierbare Metadaten sowie
opake React-Nodes. Die Zuordnung erfolgt ausschließlich über stabile
`itemId + cockpitKey`-Schlüssel.

`useSearchParams` bleibt unter `Suspense`. Deshalb trägt der serverseitige
Fallback die SEO-Last:

- alle Dossier-Sektionen
- das vollständige, um bereits dargestellte Dossier-Reviews deduplizierte
  Review-Grid
- erster, mittlerer und letzter Review-Link im Raw HTML

Es gibt keinen Client-Fetch. Alle vier Hub-Routen müssen im Build als
`○ Static` ausgewiesen werden.

---

## 9. Karten- und Funnel-Vertrag

### 9.1 CatalogCard

- keine ganzflächig klickbare Karte
- Titel als eigener Review-Link
- Methodology-Chip als separater Link
- dadurch keine verschachtelten Anchors
- Kategorie, `bestFor` und echtes Aktualisierungsdatum
- `Audited · x/10` nur bei ausgewähltem audited Context
- andernfalls `Editorial · x/5`, nur wenn ein Review vorhanden ist
- Cockpit-only mit provisional Context zeigt `In verification` ohne Zahl
- keine Sterne und kein `reviewCount`

### 9.2 ResearchCard

Bestehende Server-Komponente und Provenienzlogik bleiben maßgeblich.
Ein Dossier mit Review führt primär ins Review und sekundär ins Cockpit. Ein
Cockpit-only-Dossier darf primär ins Cockpit führen. Affiliate-Links werden
nicht zur primären Research-Aktion.

### 9.3 Quick Finder

Der Quick Finder erhält die normalisierten `DiscoveryItem[]` ohne MDX-Body,
hält Suche und Kategorie lokal und schreibt nicht in die Homepage-URL. Filter
und Projektion verwenden dieselben exportierten, reinen Shell-Funktionen wie
der Hub; es gibt keinen zweiten Finder-spezifischen Item-Typ.

- Review-backed Karten verlinken direkt ins Review.
- Cockpit-only Karten verlinken in den vorgefilterten Research-Hub:
  `researchBase?type=dossier&topic=<topic>&q=<displayName>`.
- Query-Strings werden ausschließlich mit `URLSearchParams` gebaut; Titel,
  Topic und Kategorie werden nie manuell in eine URL interpoliert.
- Der Haupt-CTA führt mit den aktiven `q`- und `category`-Werten in den Hub.
- Leere Parameter werden weggelassen.
- Ergebniszahl wird sichtbar und in einer permanent gemounteten
  `aria-live="polite"`-Region ausgegeben.

---

## 10. Topic- und Spec-Facetten

Topic-/Spec-Filter erscheinen erst, wenn eine Kategorie gewählt wurde und
qualifizierte Dossier-Contexts besitzt.

Bei genau einem Topic ist es implizit aktiv. Bei mehreren Topics muss zuerst
ein Topic gewählt werden; erst dann erscheinen dessen Specs.

URL:

```text
?category=personal-finance
&topic=robo-advisors
&spec=robo-advisors:management_fee:$0
```

`spec` ist wiederholbar. Der Parser trennt nur die ersten zwei Doppelpunkte;
der Rest ist der Wert. Topic und Key werden gegen die Registry validiert.

Zustandsregeln:

- Kategorieänderung löscht `topic` und alle `spec`
- Topicänderung löscht inkompatible `spec`
- Reset löscht alle Discovery-Filter
- eine Spec-Spalte erscheint nur bei mehr als einem und höchstens vier
  unterschiedlichen Werten
- Key-Facts und Spec-Facetten verwenden dieselbe serverseitige Berechnung

Analytics ergänzt die Facets `topic` und `spec`. Der Analytics-Wert
`topic:key:value` wird deterministisch auf höchstens 60 Zeichen gekürzt; die
URL-Filterung verwendet immer den vollständigen Wert.

---

## 11. Shortlist und Compare

### 11.1 Zustand

```ts
interface ScopedShortlist {
  cockpitKey: CockpitKey | null;
  slugs: string[];
}
```

Höchstens vier Produkte, alle aus exakt einem `cockpitKey`.

Storage v2:

```text
research-shortlist:${market}:${category}:${topic}
research-shortlist-active:${market} = ${category}:${topic}
```

Der Pointer speichert den vollständigen Kategorie-/Topic-Scope. Damit
kollidieren `us/credit-repair/companies` und `us/debt-relief/companies` nicht.

### 11.2 Restore ohne Effect-Order-Hazard

Persistenz hängt nicht mehr von der Reihenfolge zweier Effects ab:

1. Pointer lesen und gegen die auf der Seite vorhandenen Cockpit-Keys prüfen.
2. Gültigen Scope lesen und Slugs gegen dessen Produkte validieren.
3. Zustand setzen.
4. explizites `hasRestored = true` setzen.
5. Persist-Effect kehrt zurück, solange `hasRestored === false`.

Ein stale oder beschädigter Pointer entfernt Pointer und zugehörige ungültige
Daten und ergibt einen sauberen Leerzustand.

Der alte Pilot-Key `research-shortlist:us:trading-platforms` wird nur dann
einmalig in `research-shortlist:us:trading:trading-platforms` migriert, wenn
der v2-Key noch nicht existiert, und anschließend gelöscht. Bestehender
v2-Zustand wird nie überschrieben.

Die Migration setzt zugleich den Markt-Pointer auf den migrierten Scope,
sofern noch kein Pointer existiert; ein vorhandener Pointer wird nie
überschrieben.

### 11.3 Cross-Topic-Verhalten

Ein Add aus einem anderen Cockpit wird zunächst blockiert und erklärt:
„Shortlists compare within one research topic." Der Nutzer kann abbrechen oder
„Switch & add" wählen.

„Switch & add":

- alten scoped Storage-Eintrag löschen
- alten Pointer löschen
- neuen Scope mit genau dem gewählten Produkt setzen
- Pointer auf den neuen Scope setzen
- ein Clear-Event für den alten und ein Add-Event für den neuen Scope senden

Der Cockpit-Handoff wird ausschließlich aus `cockpitKey` und validierten Slugs
gebaut. Fremde Slugs können den URL-Builder nicht erreichen.

Der bestehende Body-`paddingBottom`-Effekt bleibt erhalten und wird beim
Verschwinden der Leiste vollständig zurückgesetzt.

---

## 12. Analytics-Vertrag

Der Schema-String bleibt `research_v1`; Erweiterungen sind optional und
additiv. Dokumentation, TypeScript-Builder und striktes Zod-Schema ändern sich
immer zusammen.

Neue Properties:

```ts
surface?: 'hub' | 'finder';
kind?: 'review' | 'dossier';
trigger?: 'view_all' | 'dossier_item';
category?: Category;
```

`topicOverride` ist kein serialisiertes Property. Es ist ein optionales
Track-Funktionsargument und ersetzt beim Event-Build ausschließlich
`properties.topic`. Item-Track-Funktionen erhalten analog die echte
`category`; dadurch bleiben gleichnamige Topics wie
`credit-repair/companies` und `debt-relief/companies` analytisch trennbar.

Globale Events verwenden `topic: 'hub'`:

- `research_search`
- globale `research_filter_change`
- `research_finder_cta` mit `trigger: 'view_all'`

Item-Events verwenden den Topic-Wert der ausgewählten
`DiscoveryProjection`:

- `research_review_click`
- `research_evidence_open`
- `research_shortlist_change`
- `research_cockpit_handoff`
- `research_finder_cta` mit `trigger: 'dossier_item'`

Track-Funktionen akzeptieren optionale Item-Dimensionen `{ topic, category }`;
ohne Override gilt der beim Tracker gebundene Context und `category` bleibt
weg. Raw Search wird nie übertragen, nur getrimmte Zeichenlänge und
Ergebniszahl.

Navigation auslösende Events werden sofort gesendet. Tracker bleiben fail-soft
und dürfen keine UI-Aktion verhindern.

Messgrößen:

- Finder-Engagement-Rate
- Finder → Research CTR
- Finder → Review CTR
- Research → Review CTR
- Research → Cockpit-Handoff pro Markt und Topic
- Hub-Zero-Result-Rate pro Markt

---

## 13. Fehler- und Degradationsmatrix

| Zustand                                  | Verbindliches Verhalten                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Ein Topic-Load scheitert                 | Topic fehlt; Reviews und andere Topics bleiben; strukturierter Warn-Log      |
| Gesamtes Overlay scheitert               | Hub bleibt als Review-Katalog mit HTTP 200 erreichbar                        |
| Review-MDX ohne Rating                   | wie bisher nicht in den Discovery-Katalog aufnehmen                          |
| Cockpit-only ohne qualifizierten Context | kein DiscoveryItem erzeugen                                                  |
| Ungültiger Query-Wert                    | ignorieren und nicht persistieren                                            |
| Stale Shortlist-Pointer                  | Storage bereinigen; leerer Zustand                                           |
| Dossier-Node fehlt                       | Item degradiert auf Review, falls vorhanden; sonst aus Ergebnissen entfernen |
| Kein Content im Markt                    | ehrlicher Leerzustand ohne erfundene Kennzahlen                              |
| Analytics schlägt fehl                   | UI und Navigation funktionieren unverändert                                  |

Es gibt keine behaupteten Scores, Ränge, Verifikationsdaten oder Ratings als
Fallback.

---

## 14. Lieferfolge

### PR 1 — Discovery-Katalog

- `lib/research/catalog.ts`
- `lib/research/catalog-shell-logic.ts`
- kanonische Typen, Builder, Projektion, Facetten, Sortierung, Counts
- `Promise.allSettled`-Overlay und Caches
- Shortlist-Core einschließlich v2-Keys und Migration
- Unit-Tests
- kein UI-Verhalten geändert

### PR 2 — Universelle Research-Hubs

- `ResearchHubPage`, `ResearchHub`, `CatalogCard`, `FilterChips`
- vier Routen, Metadaten, JSON-LD und Raw-HTML-Fallback
- Header, Market-Switcher, Sitemap, Redirect und Robots-Headers
- Shortlist-UI und Research-Analytics v1.1-Erweiterungen
- bestehende Pilot-Tests topic-spezifisch scopen

### PR 3 — Homepage Quick Finder

- Report-Feed und Editor's Picks ersetzen
- höchstens sechs Karten
- lokale Suche und Kategorien
- Review- und Cockpit-only-Handoffs
- Finder-Analytics

### PR 4 — Topic- und Spec-Facetten

- Topic-Auflösung vor Specs
- URL-State, Reset-Regeln und Header
- gemeinsame Key-Fact-/Spec-Berechnung
- Analytics-Facets

### PR 5 — Funnel-Verifikation

- vollständige Tracking-Payload-Tests
- Produktions-Smoke und SQL-Snippets
- dokumentierte Funnel-Auswertung nach zwei Wochen
- keine nachträgliche Einführung zuvor fehlender Surface-Events

Jeder PR ist unabhängig deploybar und über einen Revert rückrollbar. Kein PR
setzt einen noch nicht gemergten Folgeschritt voraus.

---

## 15. Testinvarianten

Diese Aussagen sind verbindliche Tests:

1. Jedes qualifizierte Review erzeugt genau ein `DiscoveryItem`.
2. Ein Cockpit-only-Produkt erzeugt pro Markt/Kategorie/Produkt genau ein Item.
3. Ein Produkt in zwei Topics bleibt ein Item mit zwei Contexts.
4. Kein Item besitzt doppelte `cockpitKey`-Contexts.
5. Nur audited Contexts besitzen Score, Rank und Confidence.
6. `type=review` erzeugt niemals Dossier-Projections.
7. Research-only-Filter schließen Context-freie Reviews aus.
8. Ein Ergebnis erscheint höchstens einmal.
9. Compare-URLs enthalten nur Slugs eines Cockpit-Keys.
10. Gleichnamige Topics verschiedener Kategorien verwenden verschiedene
    Storage-Keys.
11. Overlay-Ausfall entfernt keine Reviews.
12. Alle Review-Hrefs stehen im Raw HTML.
13. Hero, Facetten, CTA und Events melden konsistente Counts.
14. Marktwechsel treffen immer eine selbstkanonische 200-URL.
15. Filter-URLs tragen Noindex und einen filterlosen Canonical.
16. Item-Events melden tatsächliches Topic und tatsächliche Kategorie.

---

## 16. Definition of Done

### Funktional

- alle vier Research-Hubs liefern 200
- bestehender US-Pilot bleibt mit neun Trading-Dossiers funktional
- AU, CA und UK zeigen Reviews ohne falsche Audited-Claims
- Quick Finder zeigt höchstens sechs Karten
- Multi-Topic-Shortlist und Back-/Reload-Restore funktionieren
- Topic-/Spec-State überlebt Reload und Browser-Zurück

### SEO und Rendering

- alle vier Hub-Routen sind im Build `○ Static`
- 100 % der Review-Hrefs stehen im Raw HTML
- je Markt genau ein H1, Canonical und valides hreflang-Cluster
- gerenderte Titles 45–60 Zeichen
- Descriptions 140–160 Zeichen
- Filter-Queries liefern `X-Robots-Tag: noindex, follow`
- genau ein valides audited-only ItemList-Schema

### A11y und Responsive

- Axe: keine Findings der Stufen serious oder critical
- permanente Ergebnis-Live-Region
- Filter und Shortlist vollständig per Tastatur nutzbar
- Header bei 1024, 1100 und 1280 px ohne Umbruch oder Überlagerung
- keine verschachtelten Links

### Performance

- Homepage-JavaScript-Delta höchstens 25 KB gzip
- Mobile-Lab-LCP höchstens 2,5 s und höchstens 10 % schlechter als Baseline
- CLS unter 0,1
- keine Hydration-, Page- oder Console-Errors
- Katalog-Cache pro Markt unter 200 KB

### Befehle

```bash
npx tsc --noEmit
npx vitest run
npm run check:imports
npm run build
npx playwright test <research- und homepage-spezifische Specs>
```

E2E läuft gegen einen Production-Build mit `javaScriptEnabled: true`, außer der
ausdrückliche Raw-HTML-/No-JS-Test. Cookie Consent wird vor dem Seitenaufruf
vorbelegt.

### Vorher/Nachher-Report

Jeder Surface-PR dokumentiert mindestens:

- HTML- und JS-Payload
- LCP und CLS
- sichtbare und Raw-HTML-Linkzahlen
- Review-/Dossier-/Union-Counts
- Testanzahl und Ergebnis
- Build-Routentypen

---

## 17. Bewusst vermiedene Architektur

- kein `?market=`
- keine zweite Research-Datenbank
- kein Client-Fetch für Discovery
- kein `first-topic-wins` im Katalog
- kein Topic in der Item-ID
- kein gespeichertes `kind`
- kein Shortlist-Key ohne Kategorie
- kein Effekt-Reihenfolge-Trick für Restore/Persist
- kein ungeprüfter direkter Homepage-Handoff eines Cockpit-only-Produkts ins
  Cockpit
- kein Rating ohne eindeutige Herkunft
- keine nachträgliche Correction-Schicht über widersprüchlichen PR-Text

Diese Datei ist die einzige normative Designquelle. Der detaillierte
Implementierungsplan wird erst nach schriftlicher Freigabe dieser Spezifikation
erstellt.
