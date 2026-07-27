// components/research/VerificationStatus.tsx
// Research Library — the honest provenance chip (evidence footer, card
// hierarchy §6). Server Component. THREE distinct, never-fabricated states —
// each with its own copy and treatment, none of them borrowed from another:
//   - `audited`:      "Audited · {date} · {Confidence} confidence" — full
//                      provenance. Green — the only state with a numeric claim
//                      behind it (rendered separately by ScoreBadge).
//   - `provisional`:  "Verification in progress" — data collection is under
//                      way; a score MAY exist internally but is intentionally
//                      not surfaced yet.
//   - `unavailable`:  "Score unavailable" — distinct from provisional: this is
//                      an editorial hard-suppress or a genuine data gap, not
//                      "coming soon". Same neutral slate/gray family as
//                      provisional (never red/alarming — an unavailable score
//                      is not an error), differentiated only by copy, icon and
//                      a dashed border so the two are visually distinguishable
//                      at a glance without either one reading as a warning.
//
// (No live `unavailable` rows exist in the current MVP data set, but the
// adapter's discriminated union allows for them, and this component must
// render a genuinely different result than `provisional` when it happens —
// see research-redesign functional fix #2.)

import { ShieldCheck, Clock, Info } from 'lucide-react';
import type { ConfidenceLevel } from '@/lib/comparison/types';

export interface VerificationStatusProps {
  status: 'audited' | 'provisional' | 'unavailable';
  /** ISO date (YYYY-MM-DD). Ignored unless status === 'audited'. */
  dataVerifiedAt?: string | null;
  /** Ignored unless status === 'audited'. */
  confidence?: ConfidenceLevel | null;
}

/** ISO YYYY-MM-DD -> "Jul 3, 2026". Exported so EvidenceDisclosure's per-fact
 *  source list uses the exact same date idiom as this chip. */
export function formatVerifiedDate(iso: string): string {
  try {
    const d = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return iso;
  }
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const chipBase = 'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold';

export function VerificationStatus({ status, dataVerifiedAt, confidence }: VerificationStatusProps) {
  if (status === 'audited') {
    const parts = ['Audited'];
    if (dataVerifiedAt) parts.push(formatVerifiedDate(dataVerifiedAt));
    if (confidence) parts.push(`${capitalize(confidence)} confidence`);
    return (
      <span
        className={chipBase}
        style={{
          background: 'color-mix(in srgb, var(--sfp-green) 8%, white)',
          color: 'var(--sfp-green)',
          border: '1px solid color-mix(in srgb, var(--sfp-green) 28%, white)',
        }}
      >
        <ShieldCheck size={13} aria-hidden="true" />
        {parts.join(' · ')}
      </span>
    );
  }

  if (status === 'provisional') {
    return (
      <span
        className={chipBase}
        style={{
          background: 'var(--sfp-gray)',
          color: 'var(--sfp-slate)',
          border: '1px solid color-mix(in srgb, var(--sfp-slate) 25%, white)',
        }}
      >
        <Clock size={13} aria-hidden="true" />
        Verification in progress
      </span>
    );
  }

  // unavailable — same neutral family as provisional, distinct copy + icon +
  // a dashed border so it never reads as identical to "in progress".
  return (
    <span
      className={chipBase}
      style={{
        background: 'var(--sfp-gray)',
        color: 'var(--sfp-slate)',
        border: '1px dashed color-mix(in srgb, var(--sfp-slate) 35%, white)',
      }}
    >
      <Info size={13} aria-hidden="true" />
      Score unavailable
    </span>
  );
}
