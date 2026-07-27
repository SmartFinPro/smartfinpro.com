# PR 2 — Known-Red Baseline (nach Task 2 + Review-Fixes)

Gemessen am 27.07.2026 gegen einen Produktions-Build (`next start`) bei HEAD `29e6016`.

**Regel (Betreiber):** Bis zu dem Task, der die jeweils getestete Funktion wieder enthält, darf
KEINE zusätzliche Spec rot werden. Ein gelisteter Test muss aus **exakt der unten notierten
Fehlersignatur** rot sein — bleibt er aus einem NEUEN Grund rot, ist das ebenfalls ein
Stopp-Signal, nicht „weiterhin bekannt rot". Also Namens- UND Ursachengleichheit, nie bloß
gleiche Anzahl.

**Erwartete Fehlersignatur — für alle 21 identisch (verifiziert):**
```
Error: expect(locator).toBeVisible() failed
Locator: getByPlaceholder('Search platforms…')
Expected: visible
Timeout: 5000ms
```
Alle drei Specs warten in ihrem Einstieg auf dasselbe Element (`SEARCH = 'Search platforms…'`):
`research-shell.spec.ts:28`, `research-tracking.spec.ts:86`, `research-a11y.spec.ts:63`.
Wichtig für die A11y-Tests: Sie scheitern damit VOR dem axe-Scan — es sind keine gefundenen
WCAG-Verstöße. Ein echter axe-Verstoß wäre eine NEUE Signatur und damit ein Stopp.

## Ursache (eine einzige, verifiziert)

Task 2 hat den Pilot-Inhalt planmäßig durch das Hub-Skelett ersetzt. Alle 21 Fehlschläge hängen
am selben fehlenden UI: Karten, Suchfeld und Shell existieren noch nicht. Beispielbeleg
(A11y-Spec): `Locator: getByPlaceholder('Search platforms…') Expected: visible` — der Test
scheitert in seinem `gotoResearch()`-Helper, BEVOR axe überhaupt scannt. Es handelt sich also
nicht um neue Verstöße, sondern um nicht erreichbare Vorbedingungen.

## Known-Red (21)

`e2e/research-shell.spec.ts` (11 — alle):
1. the trading pilot has a stable topic scope
2. default browse shows the featured winner + all nine cards
3. search filters to matches and drops the featured pin
4. status filter narrows, and Reset restores the browse view
5. browser Back restores the search + filter state from the URL
6. shortlist enforces the max of four
7. shortlist hands off to the Cockpit compare view and lands on #comparison
8. shortlist survives the Cockpit round-trip via Back (sessionStorage)
9. the affiliate disclosure is never hidden behind the fixed shortlist bar
10. mobile — the search field sits within the first viewport
11. mobile — the shortlist bar is a compact action bar with an Edit sheet

`e2e/research-tracking.spec.ts` (6 — alle):
12. a settled search sends the query LENGTH and the result count — never the query
13. a filter chip sends the facet, its value and the resulting count
14. opening a card evidence disclosure sends research_evidence_open (open only)
15. the shortlist toggle and the Cockpit handoff are both measured
16. following a card review link sends research_review_click with its rendered position
17. the card compare and methodology links are NOT counted as review clicks

`e2e/research-a11y.spec.ts` (4 — alle):
18. WCAG 2.2 AA — default browse view (desktop)
19. WCAG 2.2 AA — default browse view (390px)
20. WCAG 2.2 AA — filtered + shortlisted state
21. Core Web Vitals budget (lab) — LCP < 2.5s, CLS < 0.1

## Erwarteter Abbau — KORRIGIERT (Betreiber-Befund)

Die erste Fassung war in sich widersprüchlich: Sie ordnete die A11y-/CWV-Tests Task 3 zu,
obwohl deren Helper (`research-a11y.spec.ts:52-63`) zwingend auf das Suchfeld wartet — und die
Suche kehrt erst mit der Client-Shell in Task 4 zurück. Auflösung:

- **Task 3 (Karten, Dossier-Knoten, Fallback, JSON-LD) — ERLEDIGT, Ergebnis gemessen:**
  Der A11y-Helper wurde vom Suchfeld **entkoppelt** (wartet auf `main` + erste gerenderte
  Karte). Das ist inhaltlich richtig, nicht bloß terminlich: A11y und Core Web Vitals des
  SERVER-gerenderten Browse-Fallbacks — der die Crawlbarkeitslast trägt — dürfen nicht von der
  Client-Shell abhängen. → **#18, #19, #21 sind grün** (LCP 148–196 ms, CLS 0,0000).
  **Korrektur gegenüber der ersten Prognose:** #1 und #2 bleiben rot. Ihre eigenen Assertions
  wären erfüllbar, aber sie hängen am GETEILTEN Helper der Shell-Spec
  (`research-shell.spec.ts:24-28`), der auf das Suchfeld wartet. Diesen ebenfalls zu entkoppeln
  würde #3–#11 mit einer NEUEN Signatur rot machen (Eingabe in ein nicht existierendes Feld
  statt Warte-Timeout) — also genau die Verwischung, die die Signatur-Regel verhindern soll.
  #1 und #2 wandern deshalb ehrlich zu **Task 4**, wo der Helper mit der Shell ohnehin wieder
  trägt. Ihre Signatur bleibt bis dahin die allowlistete.
- **Task 4 (Client-Shell, Filter, Facetten):** #1, #2 (Helper-bedingt, s. o.), #3, #4, #5, #10.
- **#20 („filtered + shortlisted state") gehört zu Task 5, nicht zu Task 4** (Betreiber-Korrektur):
  Der gefilterte Teil des Zustands existiert seit Task 4, der SHORTLISTED-Teil braucht die
  Shortlist-Toggles aus Task 5. Steht bis dahin als `test.fixme()` mit Verweis auf diese Liste
  (skipped, nicht rot) und wird in Task 5 wieder scharf gestellt, NICHT gelöscht.
- **Task 5 (Shortlist-UI):** #6, #7, #8, #9, #11.
- **Task 6 (Analytics):** #12–#17.
- Ab Ende Task 6 gilt 21/21 wieder als hartes Gate.

## Signatur-Fortschreibung nach Task 4 (Pflicht, sonst wird die Regel zu Rauschen)

Stand nach Task 4 — Zählung korrigiert (Betreiber-Befund; meine erste Angabe „9 grün / 11 rot"
war inkonsistent, sie zählte #3 nach dem Fix als grün, ließ #17 aber aus der Grün-Spalte und
korrigierte die Rot-Zahl nicht mit):

- **Technisch:** 10 passed · 10 failed · 1 skipped (#20).
- **Semantisch:** **9 belastbar grün** (#1, #2, #3, #4, #5, #10, #18, #19, #21) ·
  **#17 vakuös bestanden** (zählt nicht als Abdeckung, s. u.) · **10 rot** · #20 skipped.

Diese Doppelzählung ist Absicht: Die technische Zahl ist das, was der Runner meldet; die
semantische ist das, worauf man sich berufen darf.
Die verbliebenen roten Tests scheitern NICHT mehr an der ursprünglichen Signatur — das Suchfeld
existiert jetzt. Sie sind einen Schritt weiter gescheitert, was zulässiger Fortschritt ist. Die
neuen erwarteten Signaturen sind deshalb hier fortgeschrieben; ab jetzt gelten DIESE:

- **#6, #7, #8, #9, #11 (Shortlist, → Task 5):** kein Button `/add .+ to shortlist/i` vorhanden.
- **#12, #13, #14, #16 (Tracking, → Task 6):** 0 Events empfangen (Analytics noch nicht verdrahtet).
- **#15 (Shortlist-Tracking, → Task 5 + 6):** kein Shortlist-Button; danach Event-Prüfung.

**#3 — echter Fund, behoben (`7c64d80`):** Der Test scheiterte an einer NEUEN Signatur
(`strict mode violation`, zwei Treffer für „Charles Schwab"). Ursache verifiziert und legitim:
`lib/comparison/topics/forex-brokers.ts` führt einen eigenen, Cockpit-only, provisional
Schwab-Eintrag (`review_slug: null` per Design). Weil bei Cockpit-only-Items die Kategorie Teil
der Identität ist (Spec §4.1), bleibt das ein zweites, korrektes DiscoveryItem. Erst die jetzt
funktionierende Suche brachte beide gleichzeitig auf die Seite. Behebung ausschließlich
RÄUMLICH (Scoping auf den Trading-Dossier-Container, wie alle Geschwister-Assertions dieses
Tests); keine Zahl, keine Erwartung geändert.

**#17 — grün, aber VAKUÖS.** „compare/methodology-Links zählen NICHT als Review-Klick" besteht
derzeit nur, weil überhaupt keine Events feuern. Das ist keine echte Abdeckung. **Auflage für
Task 6 (Betreiber, verbindlich):** Der Test muss BEIDE behaupteten Negativfälle tatsächlich
ausführen — einen Klick auf den **Compare**-Link UND einen auf den **Methodology**-Link — und
zusätzlich ein **positives Kontroll-Event auf derselben Seite** auslösen (z. B. einen echten
Review-Klick, der gezählt WIRD). Nur diese Kombination beweist, dass die Negativaussage aus
korrekter Filterung stammt und nicht aus totem Tracking. Bis dahin gilt #17 nicht als erfüllt.

Nach der Entkopplung in Task 3 ändert sich die erwartete Signatur für #18, #19, #21: Sie müssen
dann grün sein; bleiben sie rot, ist die Ursache zu benennen (axe-Verstoß = echter Fund,
Timeout auf `main`/Karte = fehlender Fallback).

Alle übrigen e2e-Specs des Repos bleiben durchgehend grün; Unit-Suite und Build sind bei jedem
Task grün zu halten (aktuell 1657 Unit-Tests, Build exit 0, 4/4 Hub-Routen `○ Static`).
