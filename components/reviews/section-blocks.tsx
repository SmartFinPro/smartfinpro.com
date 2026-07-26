'use client';
// components/reviews/section-blocks.tsx — V2 MDX section-level tags (T11)
// ============================================================
// Registered as MDX components (lib/mdx/components.tsx) so a V2 review's
// 5 mdx-owned H2 sections (Fees/Markets/Platform/Safety/Support) can use
// them directly in prose.
//
// ── Context-Lösung für SectionVerdict (deviation from "Server Components
// außer SectionNav" — explained fully here per the plan's "Abweichungen
// explizit" ask) ──────────────────────────────────────────────────────────
//
// lib/mdx/components.tsx — the ONE registry every review MDX body renders
// through — is itself a 'use client' file (pre-existing, used by all 216
// review MDX files, out of scope to change here). Once a component is
// registered there and actually invoked from MDX prose, Next.js compiles it
// into the SAME client-component module graph as everything else in that
// registry, regardless of whether the component's own source file carries
// 'use client'. Two non-Context alternatives were tried and ruled out
// empirically (not just reasoned about) before reaching for Context:
//
//   1. A plain module-level mutable variable, written by a Provider and read
//      by a Consumer, with NO hooks — genuinely a Server Component in
//      isolation. Verified to work correctly under this file's own
//      renderToStaticMarkup-based tests. But it breaks in the real app:
//      Next.js compiles this source file into TWO separate module instances
//      — once for the RSC/server graph (if a Server Component like
//      ReviewLayoutV2 imports the Provider directly) and once for the
//      client graph (via lib/mdx/components.tsx's 'use client' registry,
//      which is how SectionVerdict is actually invoked from MDX). A plain
//      `let` is never shared across two separate module instances, so the
//      Consumer would always see nothing in production.
//   2. `cache()` from 'react' — the documented mechanism for sharing data
//      across Server Components without prop drilling. It needs an active
//      react-server cache dispatcher that only exists inside Next.js's real
//      RSC render. Verified empirically: calling a cache()-wrapped zero-arg
//      initializer twice under `react-dom/server`'s renderToStaticMarkup
//      (the render technique every sibling test in this repo uses, e.g.
//      __tests__/unit/verdict-card.test.ts) returns a FRESH, unlinked object
//      each call — no memoization, no shared state outside a real Next.js
//      request. A component built on it could never be proven correct by
//      this task's mandated `npx vitest run` — that alone rules it out here.
//
// components/marketing/decision-bridge.tsx already solved this exact
// problem (an MDX tag needing page-level server data with zero props) with
// genuine React Context (createContext/useContext) in a 'use client' file:
// DecisionBridgeProvider is mounted by a Server Component ancestor, and
// because Context propagates correctly through a client-component subtree —
// verified empirically here too, both with and without a mounted Provider,
// under renderToStaticMarkup (see __tests__/unit/section-blocks.test.ts) —
// this is the only approach proven to work end-to-end given the existing
// architecture. SectionVerdict/SectionVerdictsProvider follow that exact,
// already-approved precedent.
//
// KeyEvidence and SmartFinProTake need no ambient data at all (children-only
// — the Proplos concern for them is simply "no text prop", not "no way to
// reach page data") and would be fine as genuine Server Components in
// isolation. They live in this same 'use client' file purely for
// co-location with SectionVerdict — the same way lib/mdx/components.tsx
// itself mixes stateful and stateless components (Tip/InfoBox/Warning sit
// beside Rating/AffiliateButton) in one 'use client' registry file.
// ============================================================

import { createContext, useContext, type ReactNode } from 'react';
import type { SectionVerdicts } from '@/lib/reviews/verdict-frontmatter';
import { MDX_ANCHOR_IDS, type MdxAnchorId } from '@/lib/reviews/section-anchors';

const SectionVerdictsContext = createContext<SectionVerdicts | null>(null);

/**
 * Mounted once by ReviewLayoutV2 (T13), wrapping the MDX body — same shape
 * as DecisionBridgeProvider in components/marketing/decision-bridge.tsx.
 * `data` is the article's already-Zod-validated `sectionVerdicts`
 * frontmatter (lib/reviews/verdict-frontmatter.ts SectionVerdictsSchema).
 */
export function SectionVerdictsProvider({
  data,
  children,
}: {
  data: SectionVerdicts | null | undefined;
  children: ReactNode;
}) {
  return <SectionVerdictsContext.Provider value={data ?? null}>{children}</SectionVerdictsContext.Provider>;
}

function isMdxAnchorId(id: string): id is MdxAnchorId {
  return (MDX_ANCHOR_IDS as readonly string[]).includes(id);
}

export interface SectionVerdictProps {
  /** Must be one of the 5 mdx-owned ids in lib/reviews/section-anchors.ts — never free text. */
  id: string;
}

/**
 * MDX tag `<SectionVerdict id="fees" />`. Deliberately PROPLOS beyond `id`
 * (Proplos-Prinzip, same reasoning as `<DecisionBridge/>`): the text comes
 * only from validated frontmatter via SectionVerdictsContext — never a prop
 * an MDX author or the Genesis pipeline could fill with free text.
 *
 * Renders null when: no SectionVerdictsProvider is mounted above it, `id`
 * isn't one of the 5 mdx-owned anchor ids (rejects the 2 layout-owned ids
 * and any typo), or the frontmatter has no text for this id.
 */
export function SectionVerdict({ id }: SectionVerdictProps) {
  const sectionVerdicts = useContext(SectionVerdictsContext);
  if (!isMdxAnchorId(id)) return null;
  const text = sectionVerdicts?.[id];
  if (!text) return null;

  return (
    <div style={{ margin: '20px 0' }}>
      <div
        style={{
          fontFamily: 'var(--font-primary)',
          fontSize: '9.5px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--sfp-navy)',
          fontWeight: 700,
          background: 'var(--sfp-gray)',
          borderLeft: '2px solid var(--sfp-navy)',
          padding: '9px 13px 0',
        }}
      >
        Verdict
      </div>
      <div
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '14px',
          lineHeight: 1.5,
          background: 'var(--sfp-gray)',
          borderLeft: '2px solid var(--sfp-navy)',
          padding: '2px 13px 9px',
          color: 'var(--sfp-ink)',
        }}
      >
        {text}
      </div>
    </div>
  );
}

export interface KeyEvidenceProps {
  /** Hand-written `<li>` article prose (real citations the author verified) — not a trust/credential claim. The repo-wide editorial-integrity guard (lib/editorial/forbidden-claims.ts) still scans every review MDX file's rendered output for fabricated-persona patterns. */
  children: ReactNode;
}

/** MDX tag `<KeyEvidence><li>...</li></KeyEvidence>` — a compact 1-3-item evidence list, hairline above, no icon/badge. */
export function KeyEvidence({ children }: KeyEvidenceProps) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: '20px 0',
        padding: '12px 0 0',
        borderTop: '1px solid var(--sfp-hairline)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: 'var(--font-primary)',
        fontSize: '13.5px',
        lineHeight: 1.5,
        color: 'var(--sfp-ink)',
      }}
    >
      {children}
    </ul>
  );
}

export interface SmartFinProTakeProps {
  /** 30-60 words of prose expected — length is a quality-gate concern (script-level), not validated by this component. */
  children: ReactNode;
}

/** MDX tag `<SmartFinProTake>...</SmartFinProTake>` — a short editorial aside. Sky background, Navy edge — never red/gold (Regel: Rot nur Cons/Risiko, Gold nur CTA). */
export function SmartFinProTake({ children }: SmartFinProTakeProps) {
  return (
    <div
      style={{
        margin: '20px 0',
        background: 'var(--sfp-sky)',
        borderLeft: '2px solid var(--sfp-navy)',
        padding: '12px 15px',
        fontFamily: 'var(--font-secondary)',
        fontSize: '14px',
        lineHeight: 1.5,
        color: 'var(--sfp-ink)',
      }}
    >
      {children}
    </div>
  );
}
