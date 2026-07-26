import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import { FORBIDDEN_CLAIM_PATTERNS, GUARDED_GLOBS } from './forbidden-claims';

// Wird in Task 9 scharf geschaltet — bis dahin dokumentiert der Test den Ist-Zustand.
describe.skip('editorial integrity guard', () => {
  it('kein Repo-Inhalt behauptet erfundene Personen, Titel oder Prüfprozesse', () => {
    const files = GUARDED_GLOBS.flatMap((g) => globSync(g, { ignore: ['**/node_modules/**'] }));
    expect(files.length).toBeGreaterThan(200); // Schutz gegen leeres Glob = falsch-grüner Test

    const violations: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const { pattern, reason } of FORBIDDEN_CLAIM_PATTERNS) {
        if (pattern.test(text)) violations.push(`${file} :: ${pattern} — ${reason}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
