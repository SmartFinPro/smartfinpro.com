// components/research/EvidenceDisclosure.tsx
// Research Library — "View evidence" (card hierarchy §6, evidence footer).
// A native <details>/<summary> disclosure, server-rendered with no client JS:
// expands to the per-fact source list backing an audited/provisional record,
// keyed from `research.fieldSources` (TopicConfig specColumn key -> {sourceUrl,
// sourceType, verifiedAt} — see lib/comparison/types.ts FieldSource).
//
// Naming fix (research-redesign functional fix #3): this deliberately never
// says "N sources" anywhere — Object.keys(fieldSources).length counts Tier-1
// FACTS, not unique sources (several facts can cite the same source URL, or a
// broker page can cite different tables for different facts). The summary
// says "N verified data points" instead, and every entry it expands to names
// its own source explicitly, so nothing here overclaims uniqueness it hasn't
// checked.

import type { FieldSource } from '@/lib/comparison/types';
import { formatVerifiedDate } from './VerificationStatus';

export interface EvidenceDisclosureProps {
  fieldSources: Record<string, FieldSource>;
  /** Maps a fieldSources key (a TopicConfig specColumn key) to its human label. */
  labelFor: (key: string) => string;
}

const SOURCE_TYPE_LABEL: Record<FieldSource['sourceType'], string> = {
  official: 'Official',
  regulator: 'Regulator',
  editorial: 'Editorial',
  user_reviews: 'User reviews',
};

export function EvidenceDisclosure({ fieldSources, labelFor }: EvidenceDisclosureProps) {
  const entries = Object.entries(fieldSources);
  if (entries.length === 0) return null;

  return (
    <details className="text-xs">
      <summary className="cursor-pointer select-none font-semibold" style={{ color: 'var(--sfp-navy)' }}>
        View evidence — {entries.length} verified data point{entries.length === 1 ? '' : 's'}
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5 border-l-2 pl-3" style={{ borderColor: 'var(--sfp-hairline)' }}>
        {entries.map(([key, source]) => (
          <li key={key} style={{ color: 'var(--sfp-slate)' }}>
            <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>
              {labelFor(key)}
            </span>
            {' — '}
            <a
              href={source.sourceUrl}
              target="_blank"
              rel="nofollow noopener"
              className="underline"
              style={{ color: 'var(--sfp-navy)' }}
            >
              {SOURCE_TYPE_LABEL[source.sourceType] ?? source.sourceType}
            </a>
            {' · verified '}
            {formatVerifiedDate(source.verifiedAt)}
          </li>
        ))}
      </ul>
    </details>
  );
}
