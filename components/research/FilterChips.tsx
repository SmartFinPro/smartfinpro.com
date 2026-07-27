// components/research/FilterChips.tsx
// One reusable filter-dimension row for the universal Research hub shell
// (unified-research-discovery-pr2-hubs plan, Task 4; spec §6.2). Extracted
// from the Research Library pilot's inline `FilterChips` (ResearchLibrary.tsx)
// so `ResearchHub` can render every applicable dimension (category, type,
// status, confidence, freshness) through one component instead of five
// near-duplicate blocks.
//
// RENDER GATING LIVES HERE, not in the caller: spec §6.2 says a dimension is
// shown only when at least two selectable values remain. `computeDiscoveryFacets`
// (lib/research/catalog-shell-logic.ts) deliberately does NOT apply this gate —
// it reports every value that currently has count > 0, whether that is one
// value or ten. Returning `null` below when `options.length < 2` is what
// keeps a single-value dimension (e.g. a market with only one category) from
// ever shipping a chip that can't do anything (there's nothing to switch to).
//
// Clicking the already-active chip clears the dimension (toggle-to-null);
// clicking a different value replaces it — a filter dimension is a single
// value here, never a multi-select, so there is no "add" state to represent.
'use client';

export interface FilterChipOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterChipsProps {
  label: string;
  value: string | null;
  options: FilterChipOption[];
  onChange(value: string | null): void;
}

export function FilterChips({ label, value, options, onChange }: FilterChipsProps) {
  if (options.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
        {label}
      </span>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : option.value)}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            style={
              active
                ? { background: 'var(--sfp-navy)', color: '#ffffff' }
                : { background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
