# Editorial ↔ Produkt Design-Brücke — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verbinde den hellen Editorial-Layer (Reviews) und den dunklen Produkt-/Protocol-Layer (Firewall-Landingpage) über zwei wiederverwendbare Brücken-Komponenten + Inhaltstyp-Labels, ohne einen der beiden Looks zu vereinheitlichen.

**Architecture:** Drei neue, framework-neutrale Presentational-Komponenten (`ProtocolBridge`, `EditorialBacklink`, `ContentTypeTag`) im `components/marketing/`-Pattern (kein `'use client'`). `EditorialBacklink` wird **nie** in das `'use client'`-File `firewall-client.tsx` importiert, sondern via `ReactNode`-Slot aus der Server Component `page.tsx` reingereicht (korrekte RSC-Grenze). Geteilte Daten (`REVIEWER`) wandern in eine reine Datendatei `firewall-content.ts`.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, Tailwind v4, MDX (`next-mdx-remote` via `serializeMDX`), vitest (Unit), `check:*`-Skripte (types/imports/mdx/hydration) + visuelle Preview (`npm run dev:webpack`).

**Spec:** `docs/superpowers/specs/2026-06-24-editorial-product-design-bridge-design.md`

---

## Pre-Flight (vor Task 1)

Die Firewall-Dateien sind aktuell uncommitteter WIP (Rename `page.tsx`→`firewall-client.tsx` + heutige Edits an Tabs/Abständen/Siegel + neue `page.tsx` Server Component + Bilder). Damit die Brücken-Commits saubere Diffs haben:

- [ ] **Pre-Flight: Bestehenden Firewall-WIP committen** (mit User-OK)

```bash
git add "app/(marketing)/us/business-banking/programmatic-financial-firewall/" public/images/firewall/ scripts/convert-firewall-images.mjs scripts/gen-firewall-placeholders.mjs app/globals.css app/sitemap.ts
git commit -m "feat(firewall): refactor page into client/server split, polish hero spacing + reviewer seal"
```

Falls der User den WIP separat reviewen will: stattdessen vorerst `git stash --keep-index` o. Ä. — nicht erzwingen. Der Rest des Plans funktioniert unabhängig davon.

---

## File Structure

| Datei | Verantwortung |
|---|---|
| `components/marketing/content-type-meta.ts` | **neu** — reine Typ→Label/Style-Map (keine JSX, keine Next-Imports) → unit-testbar |
| `components/marketing/ContentTypeTag.tsx` | **neu** — Pill-Label, rendert aus der Map |
| `components/marketing/ProtocolBridge.tsx` | **neu** — dunkle Vorwärts-Portal-Karte (Link) |
| `components/marketing/EditorialBacklink.tsx` | **neu** — helles Rückwärts-Trust-Inset (Link) |
| `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-content.ts` | **neu** — `REVIEWER` + geteilte Daten |
| `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-client.tsx` | mod — `REVIEWER` importieren statt definieren; `editorialBacklink`-Slot-Prop; Slot statt „Read Mercury Review"-Button |
| `app/(marketing)/us/business-banking/programmatic-financial-firewall/page.tsx` | mod — `EditorialBacklink` rendern + als Slot übergeben |
| `lib/mdx/components.tsx` | mod — `ProtocolBridge` + `ContentTypeTag` registrieren |
| `content/us/business-banking/mercury-review.mdx` | mod — `<ProtocolBridge>` am Ende von §4 |
| `content/us/business-banking/index.mdx` | mod — `<ProtocolBridge>` + `<ContentTypeTag>` im Hub |
| `__tests__/unit/content-type-meta.test.ts` | **neu** — Unit-Test der Map |
| `CLAUDE.md` | mod — Governance-Regel |
| Memory `firewall-landing-dark-exception.md` | mod — auf „Protocol-Seiten" verallgemeinern |

---

## Task 1: `firewall-content.ts` — REVIEWER rausziehen

**Files:**
- Create: `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-content.ts`
- Modify: `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-client.tsx` (REVIEWER-Block + Import)

- [ ] **Step 1: Datendatei anlegen**

```typescript
// app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-content.ts
// Shared, framework-neutral content for the Programmatic Financial Firewall page.
// Imported by BOTH firewall-client.tsx ('use client') and page.tsx (Server Component),
// so it must contain NO 'use client'/'use server' directive and no server-only imports.

export const REVIEWER = {
  name: 'Robert Hayes, CFP',
  role: 'Certified Financial Planner · Business banking',
  image: '/images/experts/robert-hayes.webp',
} as const;
```

- [ ] **Step 2: In `firewall-client.tsx` den inline `REVIEWER`-Block durch einen Import ersetzen**

Entferne diesen Block (steht direkt über `const trustPoints = [`):

```tsx
// EEAT: the real reviewer of SmartFinPro's Mercury coverage (portrait matches name).
const REVIEWER = {
  name: 'Robert Hayes, CFP',
  role: 'Certified Financial Planner · Business banking',
  image: '/images/experts/robert-hayes.webp',
};
```

Und füge bei den übrigen lokalen Imports am Dateikopf hinzu:

```tsx
import { REVIEWER } from './firewall-content';
```

- [ ] **Step 3: Typen + Client/Server-Grenze prüfen**

Run: `npm run check:types && npm run check:imports`
Expected: beide grün (kein Typfehler; keine Client/Server-Verletzung — `firewall-content.ts` hat keine Direktive und keine Server-Imports).

- [ ] **Step 4: Commit**

```bash
git add "app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-content.ts" "app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-client.tsx"
git commit -m "refactor(firewall): extract REVIEWER into shared firewall-content.ts"
```

---

## Task 2: `ProtocolBridge` — Vorwärts-Brücke (dunkle Portal-Karte)

**Files:**
- Create: `components/marketing/ProtocolBridge.tsx`

- [ ] **Step 1: Komponente schreiben**

```tsx
// components/marketing/ProtocolBridge.tsx
/**
 * ProtocolBridge — forward bridge from a light editorial review into the dark
 * BOFU "Protocol" landing page. Renders a dark portal card that gives readers a
 * controlled preview of the product world before they click.
 *
 * Uses the firewall DARK palette (zinc/cyan utilities) on purpose — it is a dark
 * block embedded in a light article. Do NOT "fix" this to the light --sfp tokens;
 * it is part of the documented dark BOFU exception.
 *
 * Client-safe — no server imports. (Rendered through the 'use client' MDX map.)
 */

import Link from 'next/link';

export interface ProtocolBridgeProps {
  href: string;
  title: string;
  kicker?: string;
  subtitle?: string;
  chips?: string[];
  cta?: string;
}

export function ProtocolBridge({
  href,
  title,
  kicker = 'Implementation Protocol',
  subtitle,
  chips,
  cta = 'Open the build protocol',
}: ProtocolBridgeProps) {
  return (
    <Link
      href={href}
      className="group not-prose my-8 block rounded-[1.5rem] border border-white/10 bg-[#0a0a0c] p-6 no-underline shadow-[0_0_40px_rgba(34,211,238,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{kicker}</p>
      <p className="mt-2 text-xl font-extrabold text-white">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      {chips && chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <span className="mt-5 inline-flex items-center gap-2 rounded-[1rem] border border-cyan-300/50 bg-black/80 px-5 py-2.5 text-sm font-bold text-white">
        {cta}
        <span className="text-cyan-300 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Typen prüfen**

Run: `npm run check:types`
Expected: PASS (keine Typfehler).

- [ ] **Step 3: Commit**

```bash
git add components/marketing/ProtocolBridge.tsx
git commit -m "feat(marketing): add ProtocolBridge forward-bridge card"
```

---

## Task 3: `EditorialBacklink` — Rückwärts-Brücke (helles Trust-Inset)

**Files:**
- Create: `components/marketing/EditorialBacklink.tsx`

- [ ] **Step 1: Komponente schreiben**

```tsx
// components/marketing/EditorialBacklink.tsx
/**
 * EditorialBacklink — reverse bridge: a LIGHT trust inset placed on a dark
 * Protocol page that links back to the editorial review as the credibility source.
 *
 * Server-renderable (no 'use client', no hooks). Must be rendered by a Server
 * Component (e.g. page.tsx) and passed into the 'use client' FirewallClient via a
 * ReactNode slot — NEVER imported directly into firewall-client.tsx.
 *
 * Uses the light --sfp brand tokens (inline style, matching the Rating component
 * pattern) so the brand DNA shows through inside the dark world.
 */

import Link from 'next/link';
import Image from 'next/image';

export interface EditorialBacklinkProps {
  reviewer: { name: string; role: string; image: string };
  reviewHref: string;
  blurb?: string;
}

export function EditorialBacklink({ reviewer, reviewHref, blurb }: EditorialBacklinkProps) {
  return (
    <aside
      className="rounded-[1.25rem] border p-5"
      style={{ borderColor: 'rgba(27,79,140,0.20)', background: '#ffffff' }}
    >
      <div className="flex items-center gap-3">
        <Image
          src={reviewer.image}
          alt={reviewer.name}
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
          style={{ border: '1px solid rgba(27,79,140,0.20)' }}
        />
        <div className="leading-tight">
          <p className="text-sm font-bold" style={{ color: '#16233a' }}>
            Reviewed by {reviewer.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
            {reviewer.role}
          </p>
        </div>
        <span
          className="ml-auto rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: 'var(--sfp-green)', background: 'rgba(26,107,58,0.10)' }}
        >
          ✓ Independent
        </span>
      </div>
      <div className="mt-3 border-t pt-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
          {blurb ?? 'This protocol is backed by our hands-on, independent Mercury review — fees, FDIC coverage and onboarding tested in full.'}
        </p>
        <Link
          href={reviewHref}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold no-underline"
          style={{ color: 'var(--sfp-navy)', borderBottom: '2px solid var(--sfp-gold)', paddingBottom: '2px' }}
        >
          Read the full Mercury review →
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Typen prüfen**

Run: `npm run check:types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/marketing/EditorialBacklink.tsx
git commit -m "feat(marketing): add EditorialBacklink reverse-bridge inset"
```

---

## Task 4: `ContentTypeTag` — Inhaltstyp-Label (TDD)

**Files:**
- Create: `components/marketing/content-type-meta.ts`
- Create: `__tests__/unit/content-type-meta.test.ts`
- Create: `components/marketing/ContentTypeTag.tsx`

- [ ] **Step 1: Failing test schreiben**

```typescript
// __tests__/unit/content-type-meta.test.ts
import { describe, it, expect } from 'vitest';
import { CONTENT_TYPE_META, CONTENT_TYPES } from '@/components/marketing/content-type-meta';

describe('CONTENT_TYPE_META', () => {
  it('exposes the four content types', () => {
    expect(CONTENT_TYPES).toEqual(['review', 'guide', 'protocol', 'playbook']);
  });

  it('maps every type to a non-empty label', () => {
    expect(CONTENT_TYPE_META.review.label).toBe('Review');
    expect(CONTENT_TYPE_META.guide.label).toBe('Guide');
    expect(CONTENT_TYPE_META.protocol.label).toBe('Protocol');
    expect(CONTENT_TYPE_META.playbook.label).toBe('Playbook');
  });

  it('groups light types (review/guide) apart from dark types (protocol/playbook)', () => {
    expect(CONTENT_TYPE_META.review.tone).toBe('light');
    expect(CONTENT_TYPE_META.guide.tone).toBe('light');
    expect(CONTENT_TYPE_META.protocol.tone).toBe('dark');
    expect(CONTENT_TYPE_META.playbook.tone).toBe('dark');
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `npx vitest run __tests__/unit/content-type-meta.test.ts`
Expected: FAIL mit „Cannot find module '@/components/marketing/content-type-meta'".

- [ ] **Step 3: Map-Datei implementieren**

```typescript
// components/marketing/content-type-meta.ts
// Pure mapping for content-type labels — no JSX, no Next imports, so it stays
// trivially unit-testable. ContentTypeTag.tsx renders from this.

export type ContentType = 'review' | 'guide' | 'protocol' | 'playbook';

export const CONTENT_TYPES: ContentType[] = ['review', 'guide', 'protocol', 'playbook'];

export interface ContentTypeMeta {
  label: string;
  /** 'light' = editorial (Navy/Gold), 'dark' = BOFU protocol (cyan) */
  tone: 'light' | 'dark';
  /** Tailwind classes for the pill */
  className: string;
}

export const CONTENT_TYPE_META: Record<ContentType, ContentTypeMeta> = {
  review: {
    label: 'Review',
    tone: 'light',
    className: 'border-[rgba(27,79,140,0.25)] bg-[var(--sfp-sky)] text-[var(--sfp-navy)]',
  },
  guide: {
    label: 'Guide',
    tone: 'light',
    className: 'border-[rgba(212,139,26,0.35)] bg-[rgba(245,166,35,0.12)] text-[var(--sfp-gold-dark)]',
  },
  protocol: {
    label: 'Protocol',
    tone: 'dark',
    className: 'border-cyan-300/40 bg-cyan-950/30 text-cyan-700',
  },
  playbook: {
    label: 'Playbook',
    tone: 'dark',
    className: 'border-cyan-300/40 bg-cyan-950/30 text-cyan-700',
  },
};
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

Run: `npx vitest run __tests__/unit/content-type-meta.test.ts`
Expected: PASS (3 passing).

- [ ] **Step 5: Tag-Komponente implementieren**

```tsx
// components/marketing/ContentTypeTag.tsx
/**
 * ContentTypeTag — small pill labeling a link's content type so the hub IA
 * stays legible: light types (Review/Guide) vs dark types (Protocol/Playbook).
 *
 * Client-safe — no server imports.
 */

import { CONTENT_TYPE_META, type ContentType } from './content-type-meta';

export function ContentTypeTag({ type }: { type: ContentType }) {
  const meta = CONTENT_TYPE_META[type];
  return (
    <span
      className={`not-prose mr-2 inline-flex items-center rounded-full border px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-[0.12em] ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
```

- [ ] **Step 6: Typen prüfen**

Run: `npm run check:types`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/marketing/content-type-meta.ts components/marketing/ContentTypeTag.tsx __tests__/unit/content-type-meta.test.ts
git commit -m "feat(marketing): add ContentTypeTag with tested type→meta map"
```

---

## Task 5: FirewallClient-Slot + page.tsx-Verdrahtung

**Files:**
- Modify: `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-client.tsx` (Props + Slot statt Button)
- Modify: `app/(marketing)/us/business-banking/programmatic-financial-firewall/page.tsx` (EditorialBacklink rendern + übergeben)

- [ ] **Step 1: `FirewallClient`-Signatur um den Slot-Prop erweitern**

Ersetze die Funktionssignatur:

```tsx
export default function FirewallClient({ faqs }: { faqs: FAQ[] }) {
```

durch:

```tsx
export default function FirewallClient({
  faqs,
  editorialBacklink,
}: {
  faqs: FAQ[];
  editorialBacklink?: ReactNode;
}) {
```

(`ReactNode` ist am Dateikopf bereits importiert: `import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';` — kein neuer Import nötig.)

- [ ] **Step 2: Den „Read Mercury Review"-Button durch den Slot ersetzen**

Finde diesen Block (Win-Win-Sektion):

```tsx
                      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                        <Link
                          href={MERCURY_AFFILIATE_URL}
                          target="_blank"
                          rel="noopener sponsored"
                          className={protocolButtonClass('wide')}
                        >
                          Launch Free Account
                          <ChevronRight className={protocolButtonIconClass} />
                        </Link>
                        <Link href="/us/business-banking/mercury-review" className={protocolButtonClass('wide')}>
                          Read Mercury Review
                          <ChevronRight className={protocolButtonIconClass} />
                        </Link>
                      </div>
```

und ersetze ihn durch (primärer CTA bleibt, der sekundäre Review-Button weicht dem Trust-Inset darunter):

```tsx
                      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                        <Link
                          href={MERCURY_AFFILIATE_URL}
                          target="_blank"
                          rel="noopener sponsored"
                          className={protocolButtonClass('wide')}
                        >
                          Launch Free Account
                          <ChevronRight className={protocolButtonIconClass} />
                        </Link>
                      </div>
                      {editorialBacklink ? <div className="mt-8">{editorialBacklink}</div> : null}
```

- [ ] **Step 3: `page.tsx` — EditorialBacklink rendern und als Slot übergeben**

Ergänze die Imports in `page.tsx`:

```tsx
import { EditorialBacklink } from '@/components/marketing/EditorialBacklink';
import { REVIEWER } from './firewall-content';
```

Ersetze die Render-Zeile:

```tsx
      <FirewallClient faqs={firewallFaqs} />
```

durch:

```tsx
      <FirewallClient
        faqs={firewallFaqs}
        editorialBacklink={
          <EditorialBacklink reviewer={REVIEWER} reviewHref="/us/business-banking/mercury-review" />
        }
      />
```

- [ ] **Step 4: Typen + RSC-Grenze prüfen**

Run: `npm run check:types && npm run check:imports`
Expected: beide grün. Insbesondere darf `check:imports` KEINE Verletzung melden — `EditorialBacklink` wird nur in `page.tsx` (Server) importiert, nicht in `firewall-client.tsx`.

- [ ] **Step 5: Visuell verifizieren (Preview)**

Run: `rm -rf .next && npm run dev:webpack` (Webpack vermeidet den Turbopack-Cache-Reload-Loop), dann die Seite `/us/business-banking/programmatic-financial-firewall` laden und prüfen: unter dem „Launch Free Account"-CTA sitzt das helle EditorialBacklink-Inset mit Reviewer-Siegel + „Read the full Mercury review →".
Expected: helles Inset rendert im dunklen Win-Win-Block, Link funktioniert, keine Hydration-Errors in der Konsole.

- [ ] **Step 6: Commit**

```bash
git add "app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-client.tsx" "app/(marketing)/us/business-banking/programmatic-financial-firewall/page.tsx"
git commit -m "feat(firewall): wire EditorialBacklink reverse bridge via ReactNode slot"
```

---

## Task 6: MDX-Registrierung

**Files:**
- Modify: `lib/mdx/components.tsx` (Imports + Map-Einträge)

- [ ] **Step 1: Imports am Dateikopf ergänzen**

Direkt nach den bestehenden Imports am Anfang von `lib/mdx/components.tsx` einfügen:

```tsx
import { ProtocolBridge } from '@/components/marketing/ProtocolBridge';
import { ContentTypeTag } from '@/components/marketing/ContentTypeTag';
```

- [ ] **Step 2: In den `components`-Map-Block aufnehmen**

Im Abschnitt `// Custom components` (bei `Tip, Info: InfoBox, …`) die zwei Keys ergänzen, z. B. direkt nach `ExpertVerifier,`:

```tsx
  ExpertVerifier,
  ProtocolBridge,
  ContentTypeTag,
```

- [ ] **Step 3: Typen + Client/Server-Grenze prüfen**

Run: `npm run check:types && npm run check:imports`
Expected: beide grün (`ProtocolBridge`/`ContentTypeTag` haben keine Server-Imports → erlaubt im `'use client'`-Map-File).

- [ ] **Step 4: Commit**

```bash
git add lib/mdx/components.tsx
git commit -m "feat(mdx): register ProtocolBridge and ContentTypeTag for MDX"
```

---

## Task 7: Mercury-Review + Hub konkret umstellen

**Files:**
- Modify: `content/us/business-banking/mercury-review.mdx` (ProtocolBridge am Ende von §4)
- Modify: `content/us/business-banking/index.mdx` (ProtocolBridge + ContentTypeTag im Hub)

- [ ] **Step 1: `<ProtocolBridge>` in `mercury-review.mdx` einfügen**

Finde den Absatz mit dem Inline-Link (er endet mit „… and the Mercury CLI.") gefolgt von einer Leerzeile und `---`. Füge die Karte zwischen Absatz und `---` ein:

```mdx
If you want a concrete, code-level blueprint for putting this API to work, our [Programmatic Financial Firewall guide](/us/business-banking/programmatic-financial-firewall) walks through isolating LLC cash flow with per-vendor virtual cards, automating receipt reconciliation through Mercury webhooks and a Next.js API route, and hardening account access with FIDO2 keys and the Mercury CLI.

<ProtocolBridge
  href="/us/business-banking/programmatic-financial-firewall"
  title="The Programmatic Financial Firewall"
  subtitle="Per-vendor card isolation · webhook receipt sync · FIDO2 access"
  chips={["Ad Spend", "Core Infra", "Team SaaS"]}
/>

---
```

- [ ] **Step 2: `<ProtocolBridge>` in `index.mdx` einfügen**

Finde den Absatz „Treating your LLC's banking like infrastructure? …" (endet „… and the Mercury CLI.") gefolgt von „### Best for High-Volume International: Revolut Business". Füge die Karte dazwischen:

```mdx
Treating your LLC's banking like infrastructure? Our [Programmatic Financial Firewall guide](/us/business-banking/programmatic-financial-firewall) shows how to isolate cash flow with per-vendor Mercury virtual cards, automate receipt reconciliation through the API, and harden account access with FIDO2 hardware keys and the Mercury CLI.

<ProtocolBridge
  href="/us/business-banking/programmatic-financial-firewall"
  title="The Programmatic Financial Firewall"
  subtitle="Per-vendor card isolation · webhook receipt sync · FIDO2 access"
  chips={["Ad Spend", "Core Infra", "Team SaaS"]}
/>

### Best for High-Volume International: Revolut Business
```

- [ ] **Step 3: `<ContentTypeTag>` in die Hub-Liste „Internal Resources" einfügen**

Finde in `index.mdx` die Liste unter `## Internal Resources` und tagge jeden Eintrag mit seinem Typ (Firewall = `protocol`, Reviews = `review`):

```mdx
## Internal Resources

- <ContentTypeTag type="protocol" />[Programmatic Financial Firewall: Isolate Your LLC's Cash Flow](/us/business-banking/programmatic-financial-firewall)
- <ContentTypeTag type="review" />[Bluevine Business Banking Review 2026](/us/business-banking/bluevine-review)
- <ContentTypeTag type="review" />[Mercury Business Banking Review 2026](/us/business-banking/mercury-review)
- <ContentTypeTag type="review" />[Relay Financial Review 2026](/us/business-banking/relay-review)
```

(Falls weitere Einträge folgen, analog mit `type="review"` taggen.)

- [ ] **Step 4: MDX-Syntax + Frontmatter prüfen**

Run: `npm run check:mdx && npm run check:frontmatter`
Expected: beide grün (JSX-Komponenten korrekt, keine HTML-Kommentare, Frontmatter intakt).

- [ ] **Step 5: Visuell verifizieren (Preview)**

Bei laufendem `npm run dev:webpack` die Seiten `/us/business-banking/mercury-review` und `/us/business-banking` (Hub) laden.
Expected: Am Ende von §4 bzw. im Hub rendert die dunkle `ProtocolBridge`-Karte sauber im hellen Artikel; in „Internal Resources" stehen die Pills (Protocol/Review) vor den Links. Keine MDX-Render-Fehler in Server-Logs/Konsole.

- [ ] **Step 6: Commit**

```bash
git add content/us/business-banking/mercury-review.mdx content/us/business-banking/index.mdx
git commit -m "feat(content): add ProtocolBridge + ContentTypeTag to Mercury review and hub"
```

---

## Task 8: Governance-Regel festschreiben

**Files:**
- Modify: `CLAUDE.md` (Fallstrick-/Regel-Abschnitt)
- Modify: `/Users/christianb./.claude/projects/-Users-christianb--Websites-smartfinpro-com/memory/firewall-landing-dark-exception.md`

- [ ] **Step 1: Regel in `CLAUDE.md` ergänzen**

In der Tabelle „⚠️ Häufige Fallstricke" eine Zeile hinzufügen:

```markdown
| Dunkles Design außerhalb einer Protocol-Seite | Dunkel/Glassmorphism ist NUR für BOFU-„Protocol"-Landingpages erlaubt (z. B. Financial Firewall). Reviews/Guides bleiben hell (Navy/Gold/Green). Brücken via `ProtocolBridge`/`EditorialBacklink`/`ContentTypeTag`. |
```

- [ ] **Step 2: Memory verallgemeinern**

Den Body von `memory/firewall-landing-dark-exception.md` so erweitern, dass die Ausnahme generell für „Protocol/Playbook-Seiten" gilt (nicht nur die eine Firewall-Seite), und auf die Brücken-Komponenten verweisen. Beispiel-Ergänzung am Ende des Bodys:

```markdown

**Verallgemeinert (2026-06-24):** Dunkles/Glassmorphism-Design ist die bewusste Ausnahme für BOFU-„Protocol/Playbook"-Landingpages. Alle Reviews/Guides bleiben hell. Verbindung beider Welten über `components/marketing/ProtocolBridge.tsx` (vorwärts), `components/marketing/EditorialBacklink.tsx` (rückwärts, via ReactNode-Slot in page.tsx) und `components/marketing/ContentTypeTag.tsx` (Hub-Labels). Siehe Spec `docs/superpowers/specs/2026-06-24-editorial-product-design-bridge-design.md`.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(governance): dark design only for BOFU Protocol pages"
```

(Die Memory-Datei liegt außerhalb des Repos und wird nicht mitcommittet.)

---

## Final Verification

- [ ] **Step 1: Volle Check-Suite**

Run: `npm run check:types && npm run check:imports && npm run check:mdx && npm run check:frontmatter && npx vitest run __tests__/unit/content-type-meta.test.ts`
Expected: alle grün.

- [ ] **Step 2: Hydration-Safety der Firewall-Seite**

Run: `npm run check:hydration`
Expected: grün (die Firewall-Seite bleibt interaktiv; der Slot ändert daran nichts).

- [ ] **Step 3: Visueller End-to-End-Durchlauf**

Bei `npm run dev:webpack`:
- `/us/business-banking/mercury-review` → `ProtocolBridge` am §4-Ende.
- `/us/business-banking` → `ProtocolBridge` + `ContentTypeTag`-Pills im Hub.
- `/us/business-banking/programmatic-financial-firewall` → `EditorialBacklink` unter dem Win-Win-CTA.
Expected: Brücken in beide Richtungen sichtbar, Marken-DNA (Siegel/Gold) durchgängig, keine Konsole-/Server-Fehler.

---

## Self-Review-Notiz (vom Autor)

- **Spec-Abdeckung:** ProtocolBridge (Spec 3.1 → Task 2), EditorialBacklink (3.2 → Task 3 + Slot in Task 5), firewall-content.ts (3.3 → Task 1), ContentTypeTag (3.4 → Task 4), MDX-Registrierung (3.5 → Task 6), geteilte Marken-DNA (4 → durch Siegel/Gold in EditorialBacklink + ContentTypeTag erfüllt), Hub-Labeling (5 → Task 7 Step 3), Governance (6 → Task 8), Einbaustellen (7 → Tasks 5/7), Verifikation (9 → Final Verification). Keine Lücke.
- **Non-Goals respektiert:** keine 108-Reviews-Umstellung, keine Variante C, kein DB/Server-Action, kein CSP.
- **Typkonsistenz:** `ContentType`, `CONTENT_TYPE_META`, `CONTENT_TYPES` einheitlich zwischen `content-type-meta.ts`, Test und `ContentTypeTag.tsx`. `ProtocolBridgeProps`/`EditorialBacklinkProps` exportiert und in MDX/page.tsx konsistent genutzt. Slot-Prop `editorialBacklink: ReactNode` einheitlich in `firewall-client.tsx` und `page.tsx`.
