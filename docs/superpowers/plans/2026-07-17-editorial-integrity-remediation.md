# Editorial Integrity Remediation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle erfundenen Personen, erfundenen Berufstitel und unwahren Prüfprozess-Behauptungen von smartfinpro.com entfernen und durch ehrliche Zuschreibung an die **SmartFin Value LLC** ersetzen — ohne die Anonymität des Inhabers anzutasten.

**Architecture:** Risiko-geordnet, nicht bequemlichkeits-geordnet. Zuerst fällt die maschinenlesbare Titel-Behauptung im JSON-LD (kleinste Änderung, größtes Risiko), dann die Render-Schicht, dann die 216 Inhalte, zuletzt die Prosa. Kernidee: **Ehrlichkeit wird nicht der Urteilskraft des Modells überlassen, sondern als Test kodiert.** Ein `FORBIDDEN_CLAIMS`-Guard-Test macht jeden Rückfall CI-hart unmöglich; ein Claims-Inventar zwingt jede neue Aussage zu einem Beleg.

**Tech Stack:** Next.js 16 · MDX (216 Dateien) · Supabase (`experts`) · vitest · Tailwind v4

**Nicht-Ziele:** Kein Redesign. Kein Ranking-Projekt. Die `/imprint`-Seite ist bereits korrekt (SmartFin Value LLC, Wyoming, Kontakt) und wird **nicht** angefasst.

---

## Befundlage (in Session 2026-07-16/17 verifiziert)

| Fund | Umfang | Beleg |
|---|---|---|
| Erfundene Reviewer mit **geschützten Titeln** | **27 Personas**, 216 MDX | `reviewedBy: 'Emma Whitfield, CFA, AFA'` |
| CFA-Behauptung | **167 Seiten** | `grep -c` über `content/` |
| CFP / AFA / CPA | 44 / 42 / 7 Seiten | dito |
| Template-Platzhalter live | 1 Seite | `reviewedBy: '[EXPERT NAME], [ROLE + CREDENTIALS]'` |
| **Titel als JSON-LD an Google** | live | `"@type":"EducationalOccupationalCredential"` ×2, `"@type":"Person"` ×4 |
| Porträtfotos | 18 | `public/images/experts/*.jpg` |
| Prozess-Behauptungen | 6 Seiten | „Expert Board", „Expert Fact-Checked", „30–90 Day Hands-On Testing" |
| Vertrauensseiten ranken | Pos 4–10 | GSC: `/about` 7,5 · `/review-policy` 6,6 |

**Warum die Titel der scharfe Punkt sind:** CFA ist eine eingetragene Marke des CFA Institute, CFP eine Zertifizierungsmarke des CFP Board, CPA in US-Bundesstaaten gesetzlich geschützt. In Australien — Markt #2 — ist das Führen von Finanzberater-Titeln ohne Eintrag im ASIC-Register nach Corporations Act s923C **strafbewehrt**. Das ist eine andere Kategorie als eine irreführende Werbeaussage.

**Task 7 ist am 2026-07-17 geklärt — nicht mehr offen.** Die `review_count`-Werte zerfallen in zwei Fälle mit unterschiedlichem Fix:
- **273 Cockpit-Werte: NICHT erfunden, aber falsch zugeordnet.** Es sind echte **App-Store-Bewertungen der Banking-App** des Anbieters (`scripts/seed-credit-card-companies.mjs:23ff` dokumentiert `review_source: 'App Store iOS'`). Live steht aber „Chase — 4.8 ★, 3,500,000 reviews" neben einer **Kreditkarte**. → **exakt beschriften** statt löschen (Weg (b) im Inventar).
- **8 MDX-Werte: erfunden.** `schema.review_count` sitzt auf Kategorie-Indizes (`au/superannuation/index.mdx`: 328) und Vergleichsartikeln (`etoro-vs-robinhood.mdx`: live sichtbar „48,567 Ratings"). Keine mögliche Quelle. → **ersatzlos entfernen.**
- **Entwarnung:** `AggregateRating`-JSON-LD wird **nirgends ausgeliefert** (0 Vorkommen live). Die Werte erscheinen nur als sichtbarer Text.

---

## File Structure

| Datei | Verantwortung | Task |
|---|---|---|
| `docs/superpowers/specs/2026-07-17-claims-inventory.md` | Jede Aussage → Realität → Verdikt | 1 |
| `lib/editorial/forbidden-claims.ts` | Einzige Quelle der verbotenen Claim-Muster | 2 |
| `lib/editorial/forbidden-claims.test.ts` | Guard-Test über `content/` + `components/` + `app/` | 2 |
| `lib/seo/schema.ts` (~Z. 281) | Person/Credential-Emission entfernen | 3 ✅ |
| `components/marketing/report-layout.tsx` (~Z. 275) | dito | 3 ✅ |
| `lib/seo/schema.ts:284` (`generatePersonSchema`) | Funktion emittiert weiter `Person` — mit Aufrufern entfernen | **4** |
| `components/seo/person-schema.tsx` | Aufrufer von `generatePersonSchema` | **4** |
| `app/(marketing)/[market]/[category]/best/[topic]/page.tsx` | ruft `getMarketExpert` → `Person` auf 38 Cockpit-Routen | **4** |
| `app/(marketing)/integrity/page.tsx:54` | **hartkodiertes `EXPERTS`-Array** — sichtbar (Z. 220) + JSON-LD `jobTitle: credentials` (Z. 727) | **8** |
| `app/(marketing)/about/page.tsx:34` | **hartkodiertes `allAuthors`-Array** — sichtbar (Z. 253) + JSON-LD `founders` (Z. 727) | **8** |
| `components/marketing/expert-verifier.tsx` | löschen | 4 |
| `components/marketing/expert-box.tsx` | ⚠️ **NICHT löschen** — enthält auch `TrustAuthority` (212 MDX!) + `MethodologyBox` (76), beide gesperrt. Aufteilen. | **5a** |
| `components/marketing/trust-blocks.tsx` | NEU — `TrustAuthority` + `MethodologyBox` byte-gleich, personenfrei | **5a** |
| `lib/comparison/bridge.ts` · `components/marketing/decision-bridge.tsx` | Market Check (V15-Vertrag) | **5a** |
| `components/marketing/expert-verdict-box.tsx` | → `editorial-verdict-box.tsx` (Inhalt bleibt, Person raus) | 4 |
| 4 Pilot-MDX | `<ExpertBox>` raus, `<DecisionBridge />` rein, `reviewedBy` raus | **5b** |
| `content/**/*.mdx` (~199 Rest) | Codemod — erst nach 5b-Freigabe **und** Task 10 | **5c** |
| `lib/actions/experts.ts` · `lib/experts/image-routing.ts` | entfernen | 6 |
| `public/images/experts/*.jpg` (18) | löschen | 6 |
| `app/(marketing)/{integrity,review-policy,editorial-policy,methodology,corrections-policy,about}/page.tsx` | Neutext | 8 |

---

## Task 1: Claims-Inventar (Fundament — ohne das ist der Rest Raten)

**Files:**
- Create: `docs/superpowers/specs/2026-07-17-claims-inventory.md`

- [ ] **Step 1: Jede Vertrauensaussage der 6 Seiten extrahieren**

```bash
for p in integrity review-policy editorial-policy methodology corrections-policy about; do
  echo "════ /$p"
  curl -sL "https://smartfinpro.com/$p" | python3 -c "
import sys,re
h=re.sub(r'<(script|style).*?</\1>','',sys.stdin.read(),flags=re.S)
t=re.sub(r'<[^>]+>',' ',h); t=re.sub(r'[ \t]+',' ',t)
print('\n'.join(l.strip() for l in t.split('\n') if l.strip()))"
done > /tmp/claims-raw.txt
```

- [ ] **Step 2: Inventar-Tabelle anlegen**

Jede Aussage bekommt genau eine Zeile. Verdikt ist `WAHR` / `FALSCH` / `UNVERIFIZIERT`. **Keine Zeile darf leer bleiben.**

```markdown
| # | Seite | Aussage (wörtlich) | Was tatsächlich passiert | Verdikt | Aktion |
|---|-------|--------------------|--------------------------|---------|--------|
| 1 | /integrity | "Our Professional Expert Board" | Es gibt kein Board. Eine Person betreibt die LLC. | FALSCH | ersatzlos streichen |
| 2 | /integrity | "composed of distinguished specialists" | Existieren nicht. | FALSCH | ersatzlos streichen |
| 3 | /integrity | "Expert Fact-Checked" | Kein Mensch prüft. | FALSCH | ersatzlos streichen |
| 4 | /integrity | "Certified: March 2026" | Keine Zertifizierung existiert. | FALSCH | ersatzlos streichen |
| 5 | /review-policy | "30–90 Day Hands-On Testing — Our reviewers create real accounts" | Niemand eröffnet Konten. | FALSCH | ersatzlos streichen |
| 6 | /review-policy | "Every factual claim is verified against primary sources" | Genesis-Pipeline arbeitet gegen Primärquellen. | UNVERIFIZIERT | Task 7 klärt; bis dahin abschwächen auf tatsächlichen Prozess |
| 7 | /imprint | "We operate as an affiliate publisher" | Trifft zu. | WAHR | bleibt |
| 8 | /imprint | "Editorial decisions are made independently from affiliate relationships" | Trifft zu. | WAHR | bleibt |
```

- [ ] **Step 3: Regel dokumentieren, die alles Weitere steuert**

```markdown
## Trennlinie
ERLAUBT: unternehmerisches "wir" für die SmartFin Value LLC; Beschreibung des real ablaufenden Prozesses; eigene redaktionelle Bewertung ("wir bewerten X mit 4,5/5").
VERBOTEN: benannte Personen, die nicht existieren; Berufstitel ohne Träger; Prüfschritte, die niemand ausführt; Zertifizierungen ohne Zertifikat; AggregateRating ohne echte Bewerter.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-07-17-claims-inventory.md
git commit -m "docs: claims inventory — every trust claim mapped to reality"
```

---

## Task 2: Guard-Test (TDD — der Test MUSS zuerst rot sein)

**Files:**
- Create: `lib/editorial/forbidden-claims.ts`
- Create: `lib/editorial/forbidden-claims.test.ts`

- [ ] **Step 1: Verbotsliste als einzige Quelle**

```typescript
// lib/editorial/forbidden-claims.ts
/**
 * Muster, die eine Person, eine Qualifikation oder einen Prüfprozess behaupten,
 * den es bei SmartFin Value LLC nicht gibt. Der Guard-Test verhindert Rückfälle.
 * Siehe docs/superpowers/specs/2026-07-17-claims-inventory.md
 */
export const FORBIDDEN_CLAIM_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bexpert board\b/i,            reason: 'Es gibt kein Expert Board.' },
  { pattern: /distinguished specialists?/i,  reason: 'Diese Personen existieren nicht.' },
  { pattern: /expert[- ]fact[- ]checked/i,   reason: 'Kein Mensch prüft die Inhalte.' },
  { pattern: /hands[- ]on testing/i,         reason: 'Niemand testet Produkte hands-on.' },
  { pattern: /create real accounts/i,        reason: 'Niemand eröffnet echte Konten.' },
  { pattern: /\breviewedBy\b/i,              reason: 'Erfundene Reviewer — ersatzlos entfernt.' },
  { pattern: /\bCFA\b/,                      reason: 'Geschützte Marke des CFA Institute, kein Träger vorhanden.' },
  { pattern: /\bCFP\b/,                      reason: 'Zertifizierungsmarke des CFP Board, kein Träger vorhanden.' },
  { pattern: /\bAFA\b/,                      reason: 'AU-Beratertitel ohne ASIC-Registrierung (s923C).' },
  { pattern: /\[EXPERT NAME\]/i,             reason: 'Unausgefüllter Template-Platzhalter.' },
];

/** Verzeichnisse, die der Guard prüft. */
export const GUARDED_GLOBS = ['content/**/*.mdx', 'components/**/*.tsx', 'app/**/*.tsx'] as const;
```

- [ ] **Step 2: Guard-Test schreiben**

```typescript
// lib/editorial/forbidden-claims.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import { FORBIDDEN_CLAIM_PATTERNS, GUARDED_GLOBS } from './forbidden-claims';

describe('editorial integrity guard', () => {
  it('kein Repo-Inhalt behauptet erfundene Personen, Titel oder Prüfprozesse', () => {
    const files = GUARDED_GLOBS.flatMap((g) => globSync(g, { ignore: ['**/node_modules/**'] }));
    expect(files.length).toBeGreaterThan(200); // Schutz gegen leeres Glob = falsch-grüner Test

    const violations: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const { pattern, reason } of FORBIDDEN_CLAIM_PATTERNS) {
        if (pattern.test(text)) violations.push(`${file} :: ${pattern} — ${reason}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 3: Test laufen lassen — er MUSS scheitern**

Run: `npx vitest run lib/editorial/forbidden-claims.test.ts`
Expected: **FAIL** mit ~216+ Violations (CFA in 167 Dateien, reviewedBy in 216 …).
Falls der Test grün ist, ist das Glob kaputt — nicht weitermachen.

- [ ] **Step 4: Commit (roter Test ist Absicht, deshalb `.skip` bis Task 8)**

```bash
# Test temporär skippen, damit CI bis Task 8 nicht blockiert:
# describe.skip('editorial integrity guard', ...)
git add lib/editorial/forbidden-claims.ts lib/editorial/forbidden-claims.test.ts
git commit -m "test: editorial integrity guard (skipped until remediation completes)"
```

---

## Task 3: JSON-LD — die maschinenlesbare Titel-Behauptung abschalten

**Höchstes Risiko, kleinste Änderung. Läuft zuerst.**

**Files:**
- Modify: `lib/seo/schema.ts` (~Z. 281, `EducationalOccupationalCredential`)
- Modify: `components/marketing/report-layout.tsx` (~Z. 275)

- [ ] **Step 1: Test, dass kein Person/Credential-Node mehr entsteht**

```typescript
// lib/seo/schema.test.ts (ergänzen)
it('emittiert weder Person- noch EducationalOccupationalCredential-Nodes', () => {
  const json = JSON.stringify(buildReviewSchema({ /* bestehende Test-Fixture */ }));
  expect(json).not.toContain('EducationalOccupationalCredential');
  expect(json).not.toContain('"@type":"Person"');
});
```

- [ ] **Step 2: Test laufen lassen**

Run: `npx vitest run lib/seo/schema.test.ts`
Expected: FAIL — beide Nodes sind noch da.

- [ ] **Step 3: Emission entfernen**

In `lib/seo/schema.ts`: den `author`/`reviewedBy`-Zweig, der `Person` + `EducationalOccupationalCredential` baut, ersetzen durch `Organization`:

```typescript
// statt Person mit credentials:
author: {
  '@type': 'Organization',
  name: 'SmartFinPro',
  url: 'https://smartfinpro.com',
},
```

Den `EducationalOccupationalCredential`-Block **ersatzlos** löschen. Analog in `report-layout.tsx`.

- [ ] **Step 4: Tests grün**

Run: `npx vitest run lib/seo/schema.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add lib/seo/schema.ts components/marketing/report-layout.tsx lib/seo/schema.test.ts
git commit -m "fix(seo): stop emitting fabricated Person and credential structured data"
```

---

## Task 4: Expert-Komponenten + restliche Person-Emission entfernen

> ⚠️ **Erweitert 2026-07-17 (Fund aus Task 3):** Task 3 hat `Person` aus `generateReviewSchema`/`generateArticleSchema` und `report-layout.tsx` entfernt. **Vier Emissionsstellen leben weiter** — drei davon gehören hierher:
> - `lib/seo/schema.ts:284` — `generatePersonSchema` selbst emittiert weiter `'@type': 'Person'`
> - `components/seo/person-schema.tsx` — Aufrufer
> - `app/(marketing)/[market]/[category]/best/[topic]/page.tsx` — ruft `getMarketExpert` aus `lib/actions/experts`, emittiert `Person` auf **38 Cockpit-Routen** (live verifiziert auf `/au/superannuation/best-super-funds-australia` und `/us/personal-finance/best/credit-card-companies`)
> - `components/marketing/expert-verifier.tsx:111,225` — ohnehin in diesem Task
>
> Die vierte (`/integrity` + `/about`, hartkodierte Arrays) ist **Task 8**.
>
> `lib/actions/experts.ts` wird erst in **Task 6** gelöscht — dieser Task muss den Aufrufer in `best/[topic]/page.tsx` also schon entkoppeln, sonst bricht Task 6 den Build.

**Files:**
- Delete: `components/marketing/expert-verifier.tsx`, `components/marketing/expert-box.tsx`
- Delete: `components/seo/person-schema.tsx`
- Modify: `lib/seo/schema.ts` — `generatePersonSchema` ersatzlos entfernen (keine Aufrufer mehr)
- Modify: `app/(marketing)/[market]/[category]/best/[topic]/page.tsx` — `getMarketExpert`-Aufruf + Person-JSON-LD entfernen
- Rename+Modify: `components/marketing/expert-verdict-box.tsx` → `components/marketing/editorial-verdict-box.tsx`

- [ ] **Step 1: Alle Verwendungsstellen finden**

```bash
grep -rln "ExpertVerifier\|ExpertBox\|ExpertVerdictBox" app/ components/ lib/ content/ | grep -v node_modules
```

- [ ] **Step 2: `expert-verdict-box.tsx` umbauen**

Das Verdikt (die Bewertung) ist eine legitime redaktionelle Aussage und bleibt. Nur die **Person** verschwindet: Name, Foto, Titel-Zeile raus, Attribution auf `SmartFinPro Research`.

- [ ] **Step 3: Registrierung in `lib/mdx/components.tsx` anpassen**

Alte Namen entfernen, `EditorialVerdictBox` eintragen. Alte Namen dürfen **nicht** als Alias bestehen bleiben (sonst schlägt der Guard nie an).

- [ ] **Step 4: Build**

Run: `npx next build --webpack`
Expected: keine „component not defined"-Fehler.

- [ ] **Step 5: Commit**

```bash
git commit -am "refactor(marketing): remove fabricated expert components, keep editorial verdict"
```

---

## Task 5a: expert-box.tsx aufteilen + Market Check bauen  ·  **Modell: Sonnet**

> **Vertrag:** `docs/superpowers/specs/2026-07-17-cockpit-bridge-design.md` — **der V15-Abschnitt am Ende hat Vorrang.** Pixel-Referenz: `docs/superpowers/specs/assets/2026-07-17-market-check/market-check-v15.html`.

**⚠️ Task 4 hat bewiesen, warum `expert-box.tsx` NICHT gelöscht werden darf:** Die Datei exportiert vier Komponenten. `ExpertBox` (203 MDX) und `ExpertEndorsement` (20) sind Personas — aber **`TrustAuthority` steckt in 212 MDX-Dateien** und `MethodologyBox` in 76. Beide sind personenfrei und stehen laut `memory/design-system-locked.md` unter Änderungssperre.

**Files:**
- Create: `components/marketing/trust-blocks.tsx` — `TrustAuthority` + `MethodologyBox` **byte-gleich** verschoben, keine Änderung
- Modify: `components/marketing/expert-box.tsx` — nur noch `ExpertBox`/`ExpertEndorsement`, bleibt bis Task 5b bestehen (225 MDX-Tags zeigen noch darauf)
- Create: `lib/comparison/bridge.ts` (server-only) — Datenschicht
- Create: `components/marketing/decision-bridge.tsx` — die Komponente
- Modify: `lib/mdx/components.tsx` — `DecisionBridge` registrieren, `TrustAuthority`/`MethodologyBox` aus der neuen Datei

- [ ] **Step 1: Split zuerst, mit Beweis der Unveränderlichkeit**

```bash
git mv --force /dev/null 2>/dev/null || true
# TrustAuthority + MethodologyBox nach trust-blocks.tsx, dann:
npx next build --webpack   # muss gruen sein
```
Beweis erbringen, dass `TrustAuthority` byte-gleich ist:
```bash
git show HEAD:components/marketing/expert-box.tsx | sed -n '/export function TrustAuthority/,/^}/p' > /tmp/ta-before.txt
sed -n '/export function TrustAuthority/,/^}/p' components/marketing/trust-blocks.tsx > /tmp/ta-after.txt
diff /tmp/ta-before.txt /tmp/ta-after.txt && echo "IDENTISCH"
```

- [ ] **Step 2: `<DecisionBridge />` ist PROPLOS**

```tsx
/** MDX-Tag. Bewusst PROPLOS — es gibt kein Feld, in das jemand etwas erfinden koennte.
 *  Genau ueber Props kam die Fabrikation herein:
 *  <ExpertBox name="…" credentials="CFA, AFA" quote="My top recommendation…" />
 *  Alle Daten kommen serverseitig aus getCockpitData per Context. */
export function DecisionBridge(): JSX.Element | null
```

- [ ] **Step 3: Array-Guards — bekannte Falle in genau diesem Codebase**

`memory/ssr-mdx-unguarded-array-props`: ein ungeguardetes `.map()` in einer SSR-MDX-Komponente hat schon einmal **Review-Bodies geleert — mit HTTP 200**, also unbemerkt. Bei 203 Seiten waere das teuer.

**Pflicht:** jedes Array vor `.map`/`.length` mit `Array.isArray()` pruefen; `products?.length ? … : null`. Kein optionales Feld ohne Guard.

- [ ] **Step 4: Berechnete Zeilen, nicht geschriebene**

`Strongest`/`Weakest` aus `sub_scores` (max/min). Verdict-Spread aus `max(score) − min(score)` und `count`. **Keine Superlative aus `best_for`/`pros`/`deep_dive` uebernehmen** — sie sind ungeprueft (siehe Audit-Blocker in der Spec).

- [ ] **Step 5: Guard-Muster ergaenzen**

In `lib/editorial/forbidden-claims.ts`: die neue Komponente darf nie Personen/Titel tragen.

- [ ] **Step 6: Verifikation**

```bash
npx vitest run && npx next build --webpack
grep -rl "<TrustAuthority" content/ | wc -l   # erwartet: 212 (unveraendert)
```

- [ ] **Step 7: Commit** (deutsch, `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 5b: PILOT mit 4 Artikeln — KEIN Codemod  ·  **Modell: Sonnet**

> **Betreiber-Entscheidung 2026-07-17:** „nicht sofort per Codemod über 203 Dateien ausrollen. Erst eToro plus 2–3 unterschiedliche Reviewseiten testen, insbesondere mobil und bei fehlenden Daten. Danach automatisiert skalieren."

**Die vier Piloten:**
| Artikel | prueft |
|---|---|
| `content/us/trading/etoro-review.mdx` | **Zustand A** — Produkt im Feld, `review_slug`-Match |
| ein Artikel **mit** Cockpit, **ohne** `review_slug`-Match | **Zustand B** — Field at a glance |
| ein `content/cross-market/*.mdx` | **Zustand C** — rendert `null` |
| einer mit **langem Produktnamen** (z. B. `interactive-brokers-review`) | Mobil-Umbruch bei 390px |

- [ ] **Step 1:** In diesen 4 Dateien `<ExpertBox …>` (samt Zitat, Name, Titeln, `credentials`) **ersatzlos** entfernen, `<DecisionBridge />` an dieselbe Stelle, `reviewedBy` aus dem Frontmatter.
- [ ] **Step 2:** Fuer die Pilot-Produkte `pros`/`cons`/`best_for` **von Hand pruefen** — der Superlativ-Audit im Kleinen.
- [ ] **Step 3: Live-Beweis gegen den geleerten Body.** Prod-Build + `curl`, **h2-Zaehlung** pro Pilotseite (gesunde Review ≈ 17 h2). Ein leerer Body liefert **200**, nicht 500 — nur die h2-Zahl verraet ihn.
- [ ] **Step 4:** Mobil 390px: kein Umbruch in Strip-Zeilen, Marker verdeckt keine Ziffer.
- [ ] **Step 5:** Zustand C: HTML enthaelt **keinen** leeren Kasten, kein Platzhalter.
- [ ] **Step 6: STOP.** Ergebnis vorlegen. Der Codemod ueber die restlichen ~199 laeuft **erst nach Freigabe** — und erst nach dem Claim-Audit (Task 10).

---

## Task 5c: Codemod ueber die restlichen ~199  ·  **Modell: Haiku (Mechanik)**

**Startet NICHT vor Task 5b-Freigabe UND Task 10 (Claim-Audit).**

- [ ] `<ExpertBox>`/`<ExpertEndorsement>`/`<ExpertVerifier>` samt der **205 erfundenen Zitate** aus allen MDX entfernen, `<DecisionBridge />` einsetzen, `reviewedBy` streichen.
- [ ] Danach: `ExpertBox`/`ExpertEndorsement` aus `expert-box.tsx` loeschen, Datei entfaellt; `expert-verifier.tsx` loeschen.
- [ ] `grep -rl "<ExpertBox" content/` → 0 · `grep -rn "reviewedBy" content/` → 0
- [ ] 6 Artikel ohne Cockpit (`cross-market` ×4, `us/credit-score` ×2) rendern `null` — der Tag bleibt trotzdem drin und aktiviert sich automatisch, sobald ein Cockpit live geht.

---

## Task 6: Porträts und experts-DB

**Files:**
- Delete: `public/images/experts/*.jpg` (18)
- Delete: `lib/actions/experts.ts`, `lib/experts/image-routing.ts`

- [ ] **Step 1: Konsumenten prüfen**

```bash
grep -rln "lib/experts\|actions/experts\|images/experts" app/ components/ lib/ | grep -v node_modules
```

- [ ] **Step 2: Löschen, nachdem Task 4+5 die Konsumenten entfernt haben**

```bash
git rm -r public/images/experts lib/experts lib/actions/experts.ts
```

- [ ] **Step 3: DB-Migration**

`supabase/migrations/20260717120000_drop_experts.sql`:

```sql
-- Die experts-Tabelle enthielt ausschließlich erfundene Personen.
DROP TABLE IF EXISTS experts;
```

⚠️ **Migration wird NICHT vom Deploy ausgeführt** (siehe `deploy-no-migration-step`) — manuell via `supabase db push` anwenden.

- [ ] **Step 4: Build + Commit**

```bash
npx next build --webpack
git commit -am "chore: remove fabricated expert portraits, routing and database table"
```

---

## Task 7: `review_count` — zwei Fälle, zwei Fixes  ·  **Modell: Haiku (Mechanik)**

**Geklärt am 2026-07-17. Nichts mehr zu untersuchen — nur auszuführen.**

**Files:**
- Modify: die 8 MDX aus Step 1
- Modify: `scripts/seed-credit-card-companies.mjs`, `product_attributes` (Beschriftung)

- [ ] **Step 1: Die 8 erfundenen Werte ersatzlos entfernen**

Betroffen (verifiziert):
```
content/us/trading/etoro-vs-robinhood.mdx
content/ca/tax-efficient-investing/wealthsimple-vs-questrade.mdx
content/ca/housing/best-mortgage-rates-canada.mdx
content/au/superannuation/index.mdx
content/cross-market/green-finance-esg-guide.mdx
content/cross-market/best-ai-financial-advisors.mdx
content/cross-market/ai-financial-coaching.mdx
content/cross-market/best-esg-funds.mdx
```

Aus dem Frontmatter den kompletten `schema:`-Block mit `rating` + `review_count` entfernen. **Kein Ersatzwert, keine Schaetzung.** Grund: Diese Werte sitzen auf Kategorie-Indizes und Vergleichsartikeln — es gibt niemanden, der sie bewertet haben koennte.

- [ ] **Step 2: Verifizieren**

```bash
grep -rn "review_count" content/ | wc -l   # erwartet: 0
curl -sL "https://smartfinpro.com/us/trading/etoro-vs-robinhood" | grep -c "48,567"   # erwartet nach Deploy: 0
```

- [ ] **Step 3: Die 273 Cockpit-Werte exakt beschriften (NICHT loeschen)**

Die Zahl ist echt — es ist die App-Store-Bewertung der Banking-App. Falsch ist nur die Etikettierung. Im Cockpit-UI muss aus

`Chase — 4.8 ★, 3,500,000 reviews`

werden:

`Chase Mobile app: 4.8★ · ~3.5M App Store ratings (iOS)`

Regeln: Das Wort **"app"** ist Pflicht. Nie als Bewertung des Finanzprodukts. Nie als `AggregateRating`. `source_url` fuer diesen Wert auf das App-Store-Listing setzen — die aktuelle Marketing-URL belegt ihn nicht.

- [ ] **Step 4: Guard-Muster ergaenzen**

In `lib/editorial/forbidden-claims.ts` aufnehmen, damit die Fehl-Etikettierung nicht zurueckkehrt:

```typescript
{ pattern: /\d[\d,\.]*\s*(reviews|ratings)(?!.{0,40}\bapp\b)/i,
  reason: 'Fremdbewertung ohne "app"-Kennzeichnung — App-Store-Werte sind keine Produktbewertungen.' },
```

- [ ] **Step 5: Commit**

```bash
git add content scripts lib/editorial
git commit -m "fix: remove 8 fabricated review counts, relabel app-store ratings as app ratings"
```

---

## Task 8: Vertrauensseiten neu texten  ⚠️ **OPUS-REVIEW PFLICHT**

**Files:** `app/(marketing)/{integrity,review-policy,editorial-policy,methodology,corrections-policy,about}/page.tsx`

> ⚠️ **Nachgetragen 2026-07-17 (Fund aus Task 3 — der Plan hatte diese Lücke):** `/integrity` und `/about` enthalten **hartkodierte Persona-Arrays direkt im Seiten-Code**:
> - `app/(marketing)/integrity/page.tsx:54` → `const EXPERTS = [{ name: 'Jessica Miller', credentials: 'CFA, CFP', image: '/images/experts/james-miller.jpg', … }]` — sichtbar gerendert (Z. 220) **und** als JSON-LD emittiert (Z. 727, `jobTitle: expert.credentials` → gibt „CFA, CFP" maschinenlesbar an Google).
> - `app/(marketing)/about/page.tsx:34` → `const allAuthors = […]` — sichtbar (Z. 253) **und** als `founders`-`Person`-Nodes (Z. 727).
>
> Das Array ist die gemeinsame Quelle für Prosa UND JSON-LD. **Beides fällt mit dem Array** — deshalb gehört es hierher und nicht in Task 3. Nach diesem Task darf `grep -rn "'@type': 'Person'" app/` **0 Treffer** liefern.
>
> Randnotiz als Fabrikationsbeleg: „Jessica Miller" nutzt `james-miller.jpg`, „Michelle Torres" nutzt `michael-torres.jpg` — dieselben Stock-Porträts über Geschlechter hinweg recycelt.

- [ ] **Step 0: Persona-Arrays entfernen (vor der Prosa)**

`EXPERTS` in `integrity/page.tsx` und `allAuthors` in `about/page.tsx` ersatzlos löschen — samt der sichtbaren Sektionen, die darauf rendern, und der JSON-LD-Blöcke, die daraus `Person`-Nodes bauen. **Keine Ersatz-Personas, kein „Editorial Team"-Platzhalter mit Fantasienamen.**

- [ ] **Step 1: Jede neue Aussage gegen das Inventar aus Task 1 prüfen**

Regel: **Keine Aussage ohne Zeile im Inventar mit Verdikt `WAHR`.**

- [ ] **Step 2: Ehrliche Methodik formulieren**

Das ist die tatsächliche, legitime Methodik — sie muss nicht beschönigt werden:

> **How we work.** SmartFinPro is published by SmartFin Value LLC (Wyoming, USA). We are a small, independent operation — not a large newsroom, and we do not employ a board of advisers.
>
> Our comparisons are built from primary sources: regulator registers (FCA, ASIC, CIRO, SEC/FINRA), provider terms and official pricing pages. We record every product attribute in a structured database with the date it was checked, and we re-check it on a schedule. Where we state a rating, it is our own editorial assessment against published criteria — not a survey of users.
>
> We do not open accounts with the providers we compare, and we do not claim to. Where a claim comes from the provider rather than from us, we say so.
>
> We earn affiliate commissions. That never changes a ranking, and every ranked list is generated from the same criteria for every product.

- [ ] **Step 3: „Expert Board"-Sektion ersatzlos löschen** — nicht ersetzen, nicht umbenennen.

- [ ] **Step 4: Opus-Review anfordern**

Prüfauftrag: *„Prüfe jede Aussage der 6 Seiten gegen `docs/superpowers/specs/2026-07-17-claims-inventory.md`. Markiere JEDE Aussage, die mehr behauptet, als das Inventar belegt. Prüfe insbesondere auf wiedereingeführte Prozess-, Personen- oder Qualifikationsbehauptungen. Bewerte gegen FTC §5 / 16 CFR Part 465, FCA fair-clear-not-misleading, ASIC s12DA."*

- [ ] **Step 5: Commit**

```bash
git commit -am "content: rewrite trust pages to describe the actual editorial process"
```

---

## Task 9: Guard scharf schalten + Live-Verifikation

- [ ] **Step 1: `.skip` aus Task 2 entfernen**

- [ ] **Step 2: Guard muss grün sein**

Run: `npx vitest run lib/editorial/forbidden-claims.test.ts`
Expected: **PASS**, 0 Violations.

- [ ] **Step 3: Volle Suite + Build**

Run: `npx vitest run && npx next build --webpack` → beides grün.

- [ ] **Step 4: Nach Deploy live prüfen**

```bash
curl -sL "https://smartfinpro.com/au/superannuation/best-super-funds-australia" \
  | grep -o '"@type":"[A-Za-z]*"' | sort | uniq -c
# Erwartet: KEIN "Person", KEIN "EducationalOccupationalCredential"

for p in integrity review-policy editorial-policy; do
  curl -sL "https://smartfinpro.com/$p" | grep -ci "expert board\|hands-on testing\|fact-checked"
done
# Erwartet: 0 0 0
```

- [ ] **Step 5: Google über die Änderung informieren**

Betroffene URLs via Indexing API / GSC neu einreichen, damit die alten strukturierten Daten zügig ersetzt werden.

- [ ] **Step 6: Commit**

```bash
git commit -am "test: enable editorial integrity guard — regressions now fail CI"
```

---

## Reihenfolge & Gates

```
1 (Inventar) → 2 (Guard, rot) → 3 (JSON-LD) → 4 (Komponenten) → 5 (216 MDX)
                                                                      ↓
                                    9 (Guard grün) ← 8 (Prosa, OPUS) ← 6 (Assets/DB) → 7 (Ratings)
```

- Task 3 zuerst: kleinste Änderung, höchstes Risiko.
- Task 8 erst nach 3–6: sonst wird Prosa geschrieben, die gleich wieder bricht.
- Task 9 ist das Schlussgate — vorher darf nichts als „fertig" gelten.

---

## Task 10: Claim-Audit über 273 Zeilen  ⛔ **BLOCKER vor Task 5c**  ·  **Modell: Sonnet + Opus-Review**

**Files:** `product_attributes` (273 Zeilen), `scripts/*.mjs`

**Der Beweis, dass das nötig ist:** Ein einziger widerlegter Superlativ steht bei **einem** Produkt an **vier** Stellen. `options_fee` ist bei eToro **0.0** — bei **Webull ebenfalls 0.0**. Trotzdem:

| Feld | Inhalt |
|---|---|
| `best_for` | „**Cheapest** options trading" |
| `deep_dive` | „the **only** broker in this comparison charging genuinely $0" |
| `pros[0]` | „$0/contract options — the **only true** zero-fee options broker" |
| `attributes.options_fee_note` | „The **only true** $0-options broker among these 9" |

Wenn das bei einem Produkt viermal passiert, sagt das genug über die restlichen 272.

- [ ] **Step 1:** Superlative maschinell finden — `only`, `cheapest`, `best`, `lowest`, `fastest`, `no other`, `unmatched`, `#1` — über `best_for`, `deep_dive`, `pros`, `cons`, `chips`, `attributes.*_note`.
- [ ] **Step 2:** Jeden Treffer gegen die **Feld-Daten** prüfen: Ist der Superlativ innerhalb des Vergleichsfelds wahr? Bei Gleichstand → entschärfen („matched only by X" / „low-cost").
- [ ] **Step 3:** `confidence_reason` als Feld ergänzen und aus den `cons` befüllen. Beleg, dass es geht: eToros dritter Con lautet „Extended-hours trading availability for US accounts is **not established**" — das **ist** der Grund für `confidence: low`, nur im falschen Feld.
- [ ] **Step 4:** `verified`-Boolean klären — verifiziert von wem, wogegen? Sonst raus.
- [ ] **Step 5:** Guard-Muster ergänzen, damit Superlative nicht zurückkehren.
- [ ] **Step 6: Opus-Review** — dieselbe Kategorie wie Marktregeln: Falschheit hat reale Folgen (FTC §5, FCA, ASIC s12DA).

**Warum das VOR Task 5c muss:** Der Market Check zeigt `best_for` im Strip. Ein unbelegter Superlativ auf 199 Seiten ist schlimmer als auf einer. Und falls später grüne Haken dazukommen: **ein Haken ist ein Verifikationssignal** und beglaubigt, was daneben steht.
