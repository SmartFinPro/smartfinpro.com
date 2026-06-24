# Editorial ↔ Produkt Design-Brücke — Design Spec

> **Datum:** 2026-06-24
> **Status:** Approved (Brainstorming abgeschlossen)
> **Scope:** Eine in sich geschlossene Implementierung — zwei wiederverwendbare Brücken-Komponenten + Governance. Keine DB-Änderungen, keine Server Actions.

---

## 1. Problem & Kontext

SmartFinPro hat zwei Design-Welten, die nebeneinander existieren:

- **Editorial-Layer (hell):** 108+ MDX-Reviews im Navy/Gold/Green-Trust-Design. Job: EEAT/YMYL-Vertrauen + SEO-Ranking. Das ist die Traffic-Eintrittsschicht.
- **Produkt-/Protocol-Layer (dunkel):** Die „Programmatic Financial Firewall"-Landingpage (tech-lastig, dunkel, Glassmorphism). Job: BOFU-Conversion bei bereits überzeugten Lesern. Dokumentierte Design-Ausnahme (siehe Memory `firewall-landing-dark-exception.md`).

Aktuell sind beide Welten **bidirektional verlinkt, aber nur funktional** (nackte MDX-Textlinks + ein Button), nicht als bewusste Brücke gestaltet:

- Editorial → Produkt: `content/us/business-banking/mercury-review.mdx:324` (Inline-Link) + `:572` (Related-Liste); `content/us/business-banking/index.mdx:399` + `:626`
- Produkt → Editorial: Button auf `firewall-client.tsx:905` + Breadcrumb

**Ziel:** Beide Welten als *eine* Marke lesbar machen, ohne einen der beiden Looks zu verwässern — durch gestaltete Übergänge und geteilte Marken-DNA.

## 2. Grundsatzentscheidung

**„Zwei Modi + gebaute Brücken"** (vom User gewählt gegenüber „vereinheitlichen" und „Mini-World"). Die zwei Looks kodieren zwei Jobs und bleiben bewusst getrennt. Verbunden wird über drei Ebenen: geteilte Marken-DNA (Fundament), eine Vorwärts-Brücke und eine Rückwärts-Brücke.

## 3. Komponenten

### 3.1 `<ProtocolBridge>` — Vorwärts-Brücke (dunkle Portal-Karte, „Variante A")

Ein dunkler, abgegrenzter CTA-Block, der im **hellen** Review sitzt und einen kontrollierten Vorgeschmack auf die Produktwelt gibt, bevor der Leser klickt.

- **Datei:** `components/marketing/ProtocolBridge.tsx`
- **Typ:** Server Component (reiner gestylter `<Link>`, keine Interaktivität → **kein `'use client'`**, vermeidet Turbopack-Client/Action-Fallstricke).
- **Props:**
  | Prop | Typ | Default |
  |---|---|---|
  | `href` | `string` | — (Pflicht, Ziel-Protocol-Seite) |
  | `title` | `string` | — (Pflicht) |
  | `kicker` | `string?` | `"Implementation Protocol"` |
  | `subtitle` | `string?` | — |
  | `chips` | `string[]?` | — (optionale Node-Chips) |
  | `cta` | `string?` | `"Open the build protocol"` |
- **Visual:** dunkle Karte (zinc-950/`#0a0a0c`, Border `white/10`, `rounded-2xl`, cyan Radial-Glow), cyan Kicker, weißer Titel, `zinc-400` Subtitle, dunkle Chips, cyan-umrandete CTA-Pill mit `→`.
- **Wichtig (Governance):** Diese Komponente nutzt bewusst die **dunkle Firewall-Palette** (Tailwind zinc/cyan-Utilities), NICHT die hellen `--sfp-*`-Tokens. Das ist Teil der dokumentierten Dark-Ausnahme — ein späterer Reviewer darf das nicht „auf hell korrigieren". Kommentar in der Datei hinterlegen.
- **A11y:** gesamte Karte ist der Link (`<Link>` umschließt Inhalt), CTA-Pill rein visuell. `rel="…"` nicht nötig (interner Link).

### 3.2 `<EditorialBacklink>` — Rückwärts-Brücke (helles Trust-Inset)

Der Spiegel von 3.1: ein **helles** Trust-Inset, das in der **dunklen** Protocol-Seite sitzt und den redaktionellen Review als Glaubwürdigkeits-Beleg zurückverlinkt.

- **Datei:** `components/marketing/EditorialBacklink.tsx`
- **Typ:** Server Component.
- **Props:** `reviewer: { name: string; role: string; image: string }`, `reviewHref: string`, `blurb?: string`.
- **Visual:** helle Karte (weiß/`--sfp-sky`, Navy-Border), Reviewer-Siegel (Avatar + Name/Rolle — gleiche Optik wie das bereits gebaute Siegel auf der Firewall-Seite), grünes „✓ Independent"-Badge, Divider, Blurb, Navy-Link mit Gold-Unterstrich.

**Einbau via Slot (RSC-Grenze beachten):** `firewall-client.tsx` ist `'use client'` — eine Server Component darf dort **nicht direkt importiert** werden, sonst landet sie im Client-Bundle bzw. bricht die RSC-Grenze. Korrektes Muster: Server Component als Prop reinreichen.

- `FirewallClient` bekommt einen Slot-Prop: `editorialBacklink?: ReactNode`.
- An der Stelle des alten Review-Buttons (`firewall-client.tsx:905`) wird stattdessen `{editorialBacklink}` gerendert.
- `page.tsx` (Server Component) rendert `<EditorialBacklink reviewer={REVIEWER} reviewHref="/us/business-banking/mercury-review" />` und übergibt es an `<FirewallClient editorialBacklink={…} />`.

### 3.3 `firewall-content.ts` — geteilte Daten (REVIEWER rausziehen)

Die `REVIEWER`-Konstante liegt aktuell in `firewall-client.tsx:41` (Client-File). Damit `page.tsx` sie für `<EditorialBacklink>` nutzen kann, **ohne aus einem Client-File zu importieren**, wird sie in eine kleine framework-neutrale Datei gezogen:

- **Datei:** `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-content.ts` (kein `'use client'`, kein `'use server'` — reine Daten/Konstanten).
- Enthält mindestens `REVIEWER` (Name, Rolle, Bildpfad). Weitere statische Inhalte können bei Bedarf nachziehen.
- `FirewallClient` **und** `page.tsx` importieren `REVIEWER` von dort.

### 3.4 `<ContentTypeTag>` — Inhaltstyp-Label (fester Bestandteil)

Kleines, aber für die neue IA tragendes Label. **Nicht optional** — wird direkt mitgebaut.

- **Datei:** `components/marketing/ContentTypeTag.tsx`
- **Typ:** Server Component.
- **Props:** `type: 'review' | 'guide' | 'protocol' | 'playbook'`.
- **Visual:** kleines Pill-Tag. Hell-Typen (`review`, `guide`) in Navy/Gold-Editorial-Optik; Dunkel-Typen (`protocol`, `playbook`) in Cyan/Dark-Optik — das Tag signalisiert schon optisch, in welche Welt der Link führt.
- **Einbau:** Hub (`index.mdx`) + ggf. Related-Listen; auch im `ProtocolBridge`-Kicker referenzierbar.

### 3.5 MDX-Registrierung

`<ProtocolBridge>` und `<ContentTypeTag>` in `lib/mdx/components.tsx` registrieren, damit sie in `.mdx` verwendbar sind. Über `serializeMDX()` scope sicherstellen. (`<EditorialBacklink>` wird **nicht** in MDX registriert — es lebt nur auf den Protocol-Seiten via Slot.)

## 4. Geteilte Marken-DNA (Fundament) — als Kontrakt

Diese Elemente müssen in **beiden** Welten auftauchen, damit die Marke trotz Look-Unterschied als eine gelesen wird. Mehrheitlich Konsistenz-Sicherung, kein Neubau:

1. **Reviewer-Siegel** — gerahmtes Trust-Element (auf der dunklen Seite bereits gebaut; Reviews nutzen `ExpertVerifier`).
2. **Gold-CTA-Akzent** (`--sfp-gold`) — taucht auf der dunklen Seite mindestens an einem Anker auf (Gold-Unterstrich im `EditorialBacklink`), als durchgehender Marken-Faden.
3. **Globaler Header/Logo** — identisch.
4. **Trust-Badges** (FDIC / FCA / ASIC) — konsistente Badge-Optik.
5. **Affiliate-Disclosure** — gleiche Formulierung/Platzierungskonvention.
6. **Heading-Typoskala** — gleiche Font-Familie + Skala.

## 5. Hub als Knoten + Label-Konvention

Auf dem Business-Banking-Hub bekommt jeder verlinkte Inhaltstyp ein sichtbares Tag (`<ContentTypeTag>` aus 3.4), damit die Beziehung lesbar ist:

- Hell = **„Review"** / **„Guide"**
- Dunkel = **„Protocol"** / **„Playbook"**

Einbau im Hub (`content/us/business-banking/index.mdx` + ggf. Hub-Page-Komponente).

## 6. Governance-Regel (gegen Design-Drift)

Festschreiben in `CLAUDE.md` (Pflichtregeln/Fallstricke) **und** Memory:

> Dunkles/Glassmorphism-Design ist **ausschließlich** für BOFU-„Protocol"-Landingpages erlaubt. Alle Reviews/Guides bleiben im hellen Navy/Gold/Green-Trust-Design.

Bestehende Memory `firewall-landing-dark-exception.md` auf „Protocol-Seiten" verallgemeinern.

## 7. Konkrete Einbaustellen

| Datei | Änderung |
|---|---|
| `components/marketing/ProtocolBridge.tsx` | **neu** (Server Component) |
| `components/marketing/EditorialBacklink.tsx` | **neu** (Server Component) |
| `components/marketing/ContentTypeTag.tsx` | **neu** (Server Component) |
| `…/programmatic-financial-firewall/firewall-content.ts` | **neu** — `REVIEWER` + geteilte Daten (kein `'use client'`) |
| `lib/mdx/components.tsx` | `ProtocolBridge` + `ContentTypeTag` registrieren |
| `…/programmatic-financial-firewall/page.tsx` | rendert `<EditorialBacklink>` und reicht es als `editorialBacklink`-Slot an `<FirewallClient>` |
| `firewall-client.tsx` | neuer Prop `editorialBacklink?: ReactNode`; rendert `{editorialBacklink}` an Stelle des Buttons `~:905`; importiert `REVIEWER` aus `firewall-content.ts` |
| `content/us/business-banking/mercury-review.mdx` | `<ProtocolBridge>` am Ende von §4 (ergänzt Inline-Link bei `:324`) |
| `content/us/business-banking/index.mdx` | Hub-Labeling via `<ContentTypeTag>` (Kontext `:399`/`:626`) |
| `CLAUDE.md` + Memory | Governance-Regel |

**Umsetzungsreihenfolge** (vom User bestätigt): (1) `firewall-content.ts` + `REVIEWER` rausziehen → (2) `ProtocolBridge` → (3) `EditorialBacklink` → (4) `ContentTypeTag` → (5) `FirewallClient` Slot + `page.tsx` Verdrahtung → (6) MDX-Registrierung → (7) Mercury-Review + Hub konkret umstellen → (8) Governance in CLAUDE.md/Memory.

Erste Instanz = das **Mercury-Paar** (Review ↔ Firewall). Danach für jedes neue Protocol-Paar wiederverwendbar.

## 8. Non-Goals (YAGNI)

- **Keine** Umstellung der 108 Reviews auf dunkel.
- **Variante C** (Gradient-Brücke) wird *nicht* jetzt gebaut — bleibt als optionales Hero-Element für *eine* Platzierung reserviert.
- Kein kompletter Hub-Redesign — nur Type-Tags + Brücke ergänzen.
- Keine neuen DB-Tabellen, keine Server Actions, keine neuen externen Domains (kein CSP-Update).

## 9. Verifikation

- Visuelle Prüfung via `npm run dev:webpack` Preview auf `mercury-review` und der Firewall-Seite (Turbopack-Cache-Fallstrick beachten: bei Reload-Loop `rm -rf .next`).
- MDX rendert die Komponente (serializeMDX-Scope greift).
- Kontrast: dunkle Karte (Text auf `#0a0a0c`) und helles Inset auf dunklem Grund — beide gegen WCAG AA prüfen.
- Keine `'use client'`-Direktive in den drei neuen Komponenten (statische Links) → Server Components beibehalten.
- **RSC-Grenze:** `EditorialBacklink` wird **nicht** in `firewall-client.tsx` importiert, sondern als Slot reingereicht; `page.tsx` importiert `REVIEWER` aus `firewall-content.ts`, nicht aus dem Client-File. `npm run check:imports` muss grün sein.

## 10. Offene Punkte

Keine blockierenden. Label-Namen („Protocol/Playbook", „Review/Guide") vom User bestätigt.
