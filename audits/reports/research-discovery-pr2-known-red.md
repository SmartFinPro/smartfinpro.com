# PR 2 — Known-Red Baseline (nach Task 2 + Review-Fixes)

Gemessen am 27.07.2026 gegen einen Produktions-Build (`next start`) bei HEAD `29e6016`.

**Regel (Betreiber):** Bis zu dem Task, der alle getesteten Funktionen wieder enthält
(voraussichtlich Task 5), darf KEINE zusätzliche Spec rot werden, und die roten Tests müssen
exakt die hier gelisteten sein — Namensgleichheit, nicht bloß gleiche Anzahl. 21/21 werden erst
bei diesem Task erzwungen.

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

## Erwarteter Abbau

- Task 3 (Karten, Dossier-Knoten, Fallback, JSON-LD): #1, #2 und die A11y-/CWV-Tests #18–#21
  sollten wieder grün werden, sobald Suchfeld und Karten gerendert sind.
- Task 4 (Client-Shell, Filter, Facetten): #3, #4, #5, #10.
- Task 5 (Shortlist-UI): #6, #7, #8, #9, #11.
- Task 6 (Analytics): #12–#17.
- Spätestens am Ende von Task 5 bzw. 6 gilt wieder 21/21 als hartes Gate.

Alle übrigen e2e-Specs des Repos bleiben durchgehend grün; Unit-Suite und Build sind bei jedem
Task grün zu halten (aktuell 1657 Unit-Tests, Build exit 0, 4/4 Hub-Routen `○ Static`).
