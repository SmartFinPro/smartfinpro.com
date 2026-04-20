// MDX content walker with 60s in-process cache.
// Scans <CONTENT_ROOT>/**/*.mdx for /go/<slug> references.

import { readdirSync, readFileSync, statSync, type Dirent } from 'node:fs';
import { resolve, relative, join } from 'node:path';

const GO_SLUG_REGEX = /\/go\/([a-z][a-z0-9-]{2,60})/g;
const CACHE_TTL_MS = 60_000;

interface SlugRef {
  slug: string;
  file: string; // relative to CONTENT_ROOT
}

interface WalkResult {
  refs: SlugRef[];
  files_scanned: number;
  computed_at: number;
}

let cached: { key: string; result: WalkResult } | null = null;

/**
 * Walk MDX files under CONTENT_ROOT, collect every `/go/<slug>` occurrence
 * with source file path. Results are cached for 60s.
 */
export function walkContentForGoSlugs(contentRoot?: string): WalkResult {
  const root = resolve(contentRoot ?? process.env.SFP_CONTENT_ROOT ?? './content');
  const key = root;
  const now = Date.now();
  if (cached && cached.key === key && now - cached.result.computed_at < CACHE_TTL_MS) {
    return cached.result;
  }

  const refs: SlugRef[] = [];
  let filesScanned = 0;

  function walk(dir: string): void {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true, encoding: 'utf8' }) as Dirent[];
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const full = join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;
      let content: string;
      try {
        content = readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      filesScanned++;
      GO_SLUG_REGEX.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = GO_SLUG_REGEX.exec(content)) !== null) {
        refs.push({ slug: m[1], file: relative(root, full) });
      }
    }
  }

  try {
    statSync(root);
    walk(root);
  } catch {
    // root doesn't exist; return empty
  }

  const result: WalkResult = { refs, files_scanned: filesScanned, computed_at: now };
  cached = { key, result };
  return result;
}
