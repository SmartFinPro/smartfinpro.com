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

**Bewusst offen (nicht angenommen):** Die `review_count`-Werte (48567, 312, 542, …) sind **nicht verifiziert**. Sie könnten legitime Anbieterdaten sein (z. B. echte App-Store-Bewertungen). Task 7 klärt das, statt es zu unterstellen.

---

## File Structure

| Datei | Verantwortung | Task |
|---|---|---|
| `docs/superpowers/specs/2026-07-17-claims-inventory.md` | Jede Aussage → Realität → Verdikt | 1 |
| `lib/editorial/forbidden-claims.ts` | Einzige Quelle der verbotenen Claim-Muster | 2 |
| `lib/editorial/forbidden-claims.test.ts` | Guard-Test über `content/` + `components/` + `app/` | 2 |
| `lib/seo/schema.ts` (~Z. 281) | Person/Credential-Emission entfernen | 3 |
| `components/marketing/report-layout.tsx` (~Z. 275) | dito | 3 |
| `components/marketing/expert-verifier.tsx` | löschen | 4 |
| `components/marketing/expert-box.tsx` | löschen | 4 |
| `components/marketing/expert-verdict-box.tsx` | → `editorial-verdict-box.tsx` (Inhalt bleibt, Person raus) | 4 |
| `content/**/*.mdx` (216) | `reviewedBy` raus, `author` → Marke | 5 |
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

## Task 4: Expert-Komponenten entfernen

**Files:**
- Delete: `components/marketing/expert-verifier.tsx`, `components/marketing/expert-box.tsx`
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

## Task 5: Die 216 MDX-Dateien

**Files:** `content/**/*.mdx`

- [ ] **Step 1: Ist-Zustand festhalten**

```bash
grep -rl "reviewedBy" content/ | wc -l   # erwartet: 216
```

- [ ] **Step 2: `reviewedBy` ersatzlos entfernen**

```bash
find content -name '*.mdx' -exec sed -i '' '/^reviewedBy:/d' {} +
grep -rl "reviewedBy" content/ | wc -l   # erwartet: 0
```

- [ ] **Step 3: `author` auf die Marke vereinheitlichen**

Bestehende Werte wie `SmartFinPro AU Finance Team` behaupten ein Team. Vereinheitlichen auf `SmartFinPro Research`:

```bash
find content -name '*.mdx' -exec sed -i '' -E "s/^author: .*/author: SmartFinPro Research/" {} +
```

- [ ] **Step 4: Frontmatter-Schema nachziehen**

`reviewedBy` aus Typdefinition und Validierung entfernen (`lib/mdx/`), damit ein Rückfall am Typ scheitert.

- [ ] **Step 5: Build + Commit**

```bash
npx next build --webpack
git add content lib/mdx
git commit -m "content: remove 27 fabricated reviewers and their credentials from 216 pages"
```

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

## Task 7: `review_count` verifizieren — NICHT annehmen

**Files:** `content/**/*.mdx` (8 Dateien), `lib/seo/schema.ts`

- [ ] **Step 1: Werte und Herkunft prüfen**

```bash
grep -rn "review_count:" content/
```

Werte: 48567, 312, 542, 328, 267, 298, 201, 184.

- [ ] **Step 2: Für jeden Wert entscheiden**

- Stammt der Wert aus einer **belegbaren Anbieterquelle** (z. B. App-Store-Bewertungen)? → behalten, **Quelle im Frontmatter dokumentieren**, im Text als fremde Bewertung ausweisen.
- Ist er **erfunden**? → `AggregateRating` ersatzlos entfernen. Erfundene Bewertungszahlen sind exakt der Kern von FTC 16 CFR Part 465.
- **Im Zweifel: entfernen.**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix(seo): remove unverifiable AggregateRating claims"
```

---

## Task 8: Vertrauensseiten neu texten  ⚠️ **OPUS-REVIEW PFLICHT**

**Files:** `app/(marketing)/{integrity,review-policy,editorial-policy,methodology,corrections-policy,about}/page.tsx`

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
