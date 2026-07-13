// components/tools/shell/tool-trust-strip.tsx
// RSC — Markt · Bearbeitungszeit · "Data verified {date}" · Methodology/Privacy
// links (SPEC 6.1). Named ToolTrustStrip to avoid collision with the existing
// components/marketing/trust-bar.tsx. Stays a plain server component —
// verifiedAt is an ISO string prop (server-formatted), never a live clock
// read at render time (the hydration-safety guard would flag that pattern).

import type { ToolMarket } from '@/lib/tools/registry/types';

export interface ToolTrustStripProps {
  market: ToolMarket;
  estimatedMinutes: number;
  verifiedAt: string;          // ISO — min(verifiedAt) of critical rules
  methodologyHref: string;
  privacyHref: string;
}

const MARKET_LABEL: Record<ToolMarket, string> = {
  us: 'US',
  uk: 'UK',
  ca: 'CA',
  au: 'AU',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Pure, deterministic date formatting from an ISO string — no ambient locale/clock. */
function formatVerifiedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function ToolTrustStrip({
  market,
  estimatedMinutes,
  verifiedAt,
  methodologyHref,
  privacyHref,
}: ToolTrustStripProps) {
  return (
    <div
      className="trust-strip flex flex-wrap items-center gap-4 rounded-tool-panel border px-3.5 py-2 text-[13px]"
      style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface)', color: 'var(--sfp-slate)' }}
    >
      <strong className="font-semibold text-[var(--sfp-ink)]">{MARKET_LABEL[market]}</strong>
      <span aria-hidden="true">·</span>
      <span>~{estimatedMinutes} min</span>
      <span aria-hidden="true">·</span>
      <span>Data verified {formatVerifiedDate(verifiedAt)}</span>
      <span className="links ml-auto flex gap-3.5">
        <a href={methodologyHref} className="text-[var(--sfp-navy)] no-underline hover:underline">
          Methodology
        </a>
        <a href={privacyHref} className="text-[var(--sfp-navy)] no-underline hover:underline">
          Privacy
        </a>
      </span>
    </div>
  );
}
