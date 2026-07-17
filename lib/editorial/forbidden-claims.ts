/**
 * Muster, die eine Person, eine Qualifikation oder einen Prüfprozess behaupten,
 * den es bei SmartFin Value LLC nicht gibt. Der Guard-Test verhindert Rückfälle.
 * Siehe docs/superpowers/specs/2026-07-17-claims-inventory.md
 */
export const FORBIDDEN_CLAIM_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bexpert board\b/i,            reason: 'Es gibt kein Expert Board.' },
  { pattern: /distinguished specialists?/i,  reason: 'Diese Personen existieren nicht.' },
  { pattern: /expert[- ]fact[- ]checked/i,   reason: 'Kein Mensch prüft die Inhalte.' },
  { pattern: /hands[- ]on testing/i,         reason: 'Niemand testet Produkte hands-on.' },
  { pattern: /create real accounts/i,        reason: 'Niemand eröffnet echte Konten.' },
  { pattern: /\breviewedBy\b/i,              reason: 'Erfundene Reviewer — ersatzlos entfernt.' },
  { pattern: /\bCFA\b/,                      reason: 'Geschützte Marke des CFA Institute, kein Träger vorhanden.' },
  { pattern: /\bCFP\b/,                      reason: 'Zertifizierungsmarke des CFP Board, kein Träger vorhanden.' },
  { pattern: /\bAFA\b/,                      reason: 'AU-Beratertitel ohne ASIC-Registrierung (s923C).' },
  { pattern: /\[EXPERT NAME\]/i,             reason: 'Unausgefüllter Template-Platzhalter.' },
];

/** Verzeichnisse, die der Guard prüft. */
export const GUARDED_GLOBS = ['content/**/*.mdx', 'components/**/*.tsx', 'app/**/*.tsx'] as const;
