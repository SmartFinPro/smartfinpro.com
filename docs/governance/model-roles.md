# Modellrollen und Routing

Kurzfassung der verbindlichen Modellsteuerung, damit sie versioniert, reviewbar und in jeder
Session auffindbar ist. Die ausführliche Fassung liegt im privaten Master-Prompt des Betreibers;
bei Widerspruch gilt dort die ausführliche.

**Verbindlich sind die Rollen, nicht die Modellversionen.** Modellnamen sind zeitgebunden — die
Zuordnung Rolle → konkretes Modell steht in der datierten Ausführungsnotiz unten und wird dort
aktualisiert, ohne dass Pläne oder Verträge angefasst werden müssen.

## Rollen

| Rolle | Zuständig für | Ausdrücklich nicht |
|---|---|---|
| **Principal Architect** | Entscheidungen, Spezifikationen, Datenverträge, Referenzimplementierungen, Übergabe-Briefs, Informationsarchitektur, Finanz- und Steuermodell-Architektur, Datenschutz-/Share-Konzepte | repetitive Migrationen, Metadatenpflege |
| **Default Implementer** | freigegebene, eindeutig spezifizierte PRs — frische Session pro PR; Registry und Konsumenten, Metadaten/Canonical/hreflang/Sitemap, Umsetzung vorhandener Designvorgaben, Analytics nach festem Eventvertrag, Unit-/Integration-/Playwright-Tests, Accessibility, Doku, abgegrenzte Refactorings | neue Grundarchitektur erfinden, wenn die Spec entschieden hat — Abweichungen zuerst melden |
| **Independent Reviewer** | unabhängige Prüfung kritischer Änderungen: Berechnungslogik und Finanzformeln, YMYL-/Steuer-/Regulatorik-Annahmen, Datenschutz und Analytics-Schemas, Canonical-/hreflang-/Indexierungsänderungen mit SEO-Risiko, SSR-/Hydration-Architektur, PRs mit großem Blast Radius, Root-Cause wenn der Implementer feststeckt | — |
| **Mechanical Worker** | ausschließlich deterministische Mechanik: Dateiinventare, Formatierung, Zusammenfassung von Test-/Build-Ausgaben, eindeutige Umbenennungen, repetitive Fixtures aus geprüfter Vorlage, Suche nach Legacy-Strings, einfache Doku-Korrekturen | Finanzformeln, Marktregeln, SEO-Strategie, Canonical-/hreflang-Architektur, Tracking-Verträge, Datenschutz, Conversion-Logik, Indexierungsentscheidungen |

**Leitsatz: keine Rolle gibt ihren eigenen kritischen Entwurf allein frei.** Architect-Code prüft
möglichst der Reviewer; kritischer Implementer-Code der Reviewer oder der Architect.

Eine stärkere Rolle darf einfache Arbeit abgeben. Eine günstigere Rolle darf bei Unsicherheit
**nicht improvisieren**, sondern muss eskalieren.

## Routing

Vor jeder Aufgabe intern bestimmen: betroffene Dateien und Systeme · vollständig durch die
freigegebene Spec definiert? · enthält sie eine Finanz-, Datenschutz-, SEO- oder
Architekturentscheidung? · Blast Radius und Regressionsrisiko · reicht die gewählte Rolle?

- klar spezifiziert, lokal, geringes Risiko → **Default Implementer**
- rein mechanisch und vollständig deterministisch → **Mechanical Worker**
- neuartig, mehrdeutig, visuell anspruchsvoll oder systemübergreifend → **Principal Architect**
- unabhängige Prüfung einer kritischen Lösung → **Independent Reviewer**

## Eskalation an den Principal Architect

Sobald **eines** zutrifft: mehr als ~10 Dateien oder 3 Systemgrenzen betroffen · neue öffentliche
API oder neuer Datenvertrag nötig · Finanzformel/Modellannahme nicht vollständig spezifiziert ·
Design und Technik müssen gemeinsam entschieden werden · Datenschutz oder sensible Finanzdaten
betroffen · zwei plausible Lösungsversuche gescheitert · Tests widersprechen der Spec · eine Rolle
müsste eine Annahme erfinden.

## Rollenwechsel

Kann die Rolle nicht selbst gewechselt werden: keine riskante Umsetzung mit der falschen Rolle
beginnen · Arbeitsstand sichern · Übergabe-Block ausgeben · Zielrolle nennen · Begründung und
nächsten Schritt angeben · auf Wechsel oder neue Session warten.

```
MODEL HANDOFF
Recommended model:
Reason:
Completed:
Open decisions:
Relevant files:
Required tests:
Next exact action:
Risks:
```

## Ausführungsnotiz

**Stand 26.07.2026** — Principal Architect: Fable 5 · Default Implementer: Sonnet 5 ·
Independent Reviewer: Opus 5 · Mechanical Worker: Haiku 4.5.

Nur diese Zeile wird bei einem Modellwechsel aktualisiert.
