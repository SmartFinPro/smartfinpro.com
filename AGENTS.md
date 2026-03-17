# SmartFinPro — Agent Instructions
> **Version 1.1 | März 2026**
> Ergänzt CLAUDE.md. Beide Dateien gelten gemeinsam.

---

## Mandatory Review Content Quality Gate (Always-On)

Ab jetzt gilt für alle Änderungen an Review-/Comparison-Seiten (MDX + zugehörige SEO-Metadaten) automatisch ein Review Quality Gate.

**Pflicht nach JEDEM Text-Update:**

### 1. SEO-Meta
- `title` klar, intent-stark — **Länge: 45–60 Zeichen** (green range)
- `description` **140–160 Zeichen** (green range)
- `modifiedDate` und `dataVerifiedDate` auf heutiges Datum aktualisieren

### 2. Struktur
- Exakt **1× H1** (wird von `report-layout.tsx` aus `title` generiert — kein `# ...` in MDX)
- Saubere **H2/H3-Hierarchie** (kein H3 ohne vorangehendes H2)
- Alle **TOC/Anchor-IDs** aus `sections:` Frontmatter vorhanden

### 3. Link-Qualität
- Interne Links sinnvoll ergänzen — **Ziel: ≥ 8** (falls inhaltlich möglich)
- Externe Autoritätslinks sinnvoll ergänzen — **Ziel: ≥ 6** (nur seriöse Quellen: Regulatoren, offizielle Produktseiten, IRS, etc.)
- Keine kaputten Links einführen

### 4. Content-Qualität
- **E-E-A-T stärken:** Methodik, Risikohinweise, klare Empfehlung
- Keine Keyword-Stuffing-Passagen
- Fließtext professionell, präzise, konsistent zum Premium-Design-Ton

### 5. Schema/SEO-Technik
- JSON-LD valid (keine fehlenden Pflichtfelder)
- hreflang/canonical korrekt
- Keine doppelten strukturellen Fehler (z. B. Doppel-H1, doppelte Schemas)

### 6. Score-Ziel
- Interne Content-Qualität für die Seite auf **≥ 90** bringen (wenn möglich)
- Falls < 90: automatisch gezielte Nachoptimierungen ausführen und erneut prüfen

### 7. Verifikation
- `npx tsc --noEmit`
- `npx vitest run` (relevante Tests)
- `npx next build` (wenn Routing/SEO/Rendering betroffen)
- Kurze **Vorher/Nachher-Tabelle** mit Metriken

### Regeln
- Keine unnötigen Refactors
- Nur betroffene Dateien ändern
- Nach Abschluss: **Commit + kurzer Report** (Dateien, Metriken, Hash)

### Trigger bei jeder neuen Seite/Integration
> Bitte Text integrieren und danach **automatisch das Review Quality Gate ausführen.**

---

## Scoring-Referenz (lib/actions/content-hub.ts)

```
Quality = W×0.30 + S×0.25 + L×0.20 + C×0.25

W = word score     (100 = 4000–7000 Wörter)
S = structure score (H2×8 max 8 + H3×3 max 6 + FAQ+10 + ProsCons+8, cap 100)
L = link score     min(internalLinks,8)×7 + min(externalLinks,6)×7  (cap 100)
C = component score min(components,6)×12 + min(images,4)×7          (cap 100)
```

**Green-Schwellen:**

| Metrik | Green |
|--------|-------|
| Title | 45–60 Zeichen |
| Description | 140–160 Zeichen |
| Words | 4000–7000 |
| Internal links | ≥ 8 |
| External links | ≥ 6 |
| MDX components (tracked) | ≥ 6 |
| Images `![...]` | ≥ 4 |

**Tracked MDX components für C-Score:**
`<TrustAuthority>` · `<ExpertBox>` · `<Rating>` · `<AffiliateButton>` · `<ExecutiveSummary>` · `<CollapsibleSection>` · `<ComparisonTable>` · `<SimpleComparison>` · `<BrokerComparison>` · `<EnterpriseTable>` · `<FAQ>` · `<Pros>` · `<Cons>` · `<Info>` · `<Warning>` · `<Tip>` · `<EvidenceCarousel>` · `<NewsletterBox>` · `<WinnerAtGlance>`

---

*SmartFinPro.com | AGENTS.md | v1.1 | März 2026*
