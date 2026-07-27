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
- **Task 4 (Client-Shell, Filter, Facetten):** #1, #2 (Helper-bedingt, s. o.), #3, #4, #5, #10 —
  und #20 („filtered + shortlisted state"), das die Shell inhaltlich BRAUCHT und deshalb ehrlich
  hier bleibt statt vorgezogen zu werden. #20 steht bis dahin als `test.fixme()` mit Verweis auf
  diese Liste (skipped, nicht rot) — es wird in Task 4 wieder scharf gestellt, NICHT gelöscht.
- **Task 5 (Shortlist-UI):** #6, #7, #8, #9, #11.
- **Task 6 (Analytics):** #12–#17.
- Ab Ende Task 6 gilt 21/21 wieder als hartes Gate.

Nach der Entkopplung in Task 3 ändert sich die erwartete Signatur für #18, #19, #21: Sie müssen
dann grün sein; bleiben sie rot, ist die Ursache zu benennen (axe-Verstoß = echter Fund,
Timeout auf `main`/Karte = fehlender Fallback).

Alle übrigen e2e-Specs des Repos bleiben durchgehend grün; Unit-Suite und Build sind bei jedem
Task grün zu halten (aktuell 1657 Unit-Tests, Build exit 0, 4/4 Hub-Routen `○ Static`).
