// lib/comparison/intents.ts
// "In a hurry?" quick-select intents. Each intent maps to a sort mode used by
// the ranking module. Pure — no React / no server imports.

import type { SortKey } from './types';

export interface Intent {
  id: string;
  label: string;
  icon: string; // Tabler icon name (without the `ti ti-` prefix consumed by the UI)
  sort: SortKey;
}

export const INTENTS: Intent[] = [
  { id: 'cost', label: 'Lowest cost', icon: 'coin', sort: 'cost' },
  { id: 'bonus', label: 'Best bonus', icon: 'gift', sort: 'bonus' },
  { id: 'team', label: 'A team', icon: 'users', sort: 'team' },
  { id: 'apy', label: 'Interest', icon: 'percentage', sort: 'apy' },
  { id: 'travel', label: 'I travel', icon: 'plane', sort: 'travel' },
];

/** Sort keys the user-facing Sort dropdown exposes (subset of SortKey). */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'smart', label: 'Smart rank' },
  { value: 'cost', label: 'Lowest cost' },
  { value: 'rating', label: 'Best rated' },
  { value: 'bonus', label: 'Biggest bonus' },
  { value: 'apy', label: 'Highest APY' },
];

export function intentById(id: string | null): Intent | undefined {
  if (!id) return undefined;
  return INTENTS.find((i) => i.id === id);
}
