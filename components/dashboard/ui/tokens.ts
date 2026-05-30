// components/dashboard/ui/tokens.ts
// Pure mapping from a brand tone to the CSS class defined in
// app/(dashboard)/dashboard.css. Keeps all color decisions token-driven
// (no hex in component JSX). Default + fallback = brand navy.

export type DashTone = 'navy' | 'green' | 'gold' | 'red' | 'slate' | 'blue' | 'amber';

const TONES: readonly DashTone[] = ['navy', 'green', 'gold', 'red', 'slate', 'blue', 'amber'];

function normalize(tone: DashTone): DashTone {
  return TONES.includes(tone) ? tone : 'navy';
}

/** Class for a filled icon box (background tint + foreground color). */
export function dashToneIconClass(tone: DashTone = 'navy'): string {
  return `dash-tone-${normalize(tone)}`;
}

/** Class for a bare colored icon/text (foreground only). */
export function dashToneTextClass(tone: DashTone = 'navy'): string {
  return `dash-tone-text-${normalize(tone)}`;
}
