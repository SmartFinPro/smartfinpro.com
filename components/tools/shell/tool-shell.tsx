// components/tools/shell/tool-shell.tsx
// RSC — common frame for every FDL tool page (SPEC 6.1/7.3): breadcrumb,
// H1 block, ToolTrustStrip, the 12-column workspace grid (mode layout goes
// in `children`), below-fold slots, and JSON-LD. This file must stay a pure
// server component with no client directive (RSC contract, PR 2.1 harte Regel).

import type { ReactNode } from 'react';
import type { ToolId, ToolMarket } from '@/lib/tools/registry/types';
import type { FAQ } from '@/types';
import { ToolTrustStrip } from './tool-trust-strip';
import { ToolJsonLd } from './tool-json-ld';

export interface ToolShellProps {
  toolId: ToolId;
  market: ToolMarket;
  breadcrumb: { label: string; href: string }[];
  h1: string;
  benefit: string;                       // 1 Satz
  estimatedMinutes: number;
  verifiedAt: string;                    // min(verifiedAt) — an TrustStrip
  methodologyHref: string;
  privacyHref: string;
  children: ReactNode;                   // Modus-Layout
  belowFold: ReactNode;                  // RSC: Methodik, Worked Example, FAQ, Quellen
  /** Additive: mirrors the visible FAQ in `belowFold` for FAQPage JSON-LD — never fabricated. */
  faq?: FAQ[];
}

export function ToolShell({
  toolId,
  market,
  breadcrumb,
  h1,
  benefit,
  estimatedMinutes,
  verifiedAt,
  methodologyHref,
  privacyHref,
  children,
  belowFold,
  faq,
}: ToolShellProps) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-8">
      <ToolJsonLd toolId={toolId} market={market} faq={faq} />

      <nav aria-label="Breadcrumb" className="breadcrumb py-4 pb-2 text-[13px] text-[var(--sfp-slate)]">
        <ol className="m-0 flex list-none flex-wrap gap-1 p-0">
          {breadcrumb.map((b, i) => (
            <li key={b.href} className="flex items-center gap-1">
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {i === breadcrumb.length - 1 ? (
                <span aria-current="page">{b.label}</span>
              ) : (
                <a href={b.href} className="text-[var(--sfp-navy)] no-underline hover:underline">
                  {b.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="page-head flex flex-col gap-1 pb-3">
        <h1 className="t-h1 m-0 text-[30px] font-bold leading-[38px] text-[var(--sfp-ink)] sm:text-[40px] sm:leading-[48px]">
          {h1}
        </h1>
        <p className="sub m-0 max-w-[70ch] text-base leading-6 text-[var(--sfp-slate)]">{benefit}</p>
      </div>

      <div className="mb-5">
        <ToolTrustStrip
          market={market}
          estimatedMinutes={estimatedMinutes}
          verifiedAt={verifiedAt}
          methodologyHref={methodologyHref}
          privacyHref={privacyHref}
        />
      </div>

      <div className="workspace">{children}</div>

      <div className="below-fold mt-10 flex max-w-[760px] flex-col gap-7">{belowFold}</div>
    </div>
  );
}
