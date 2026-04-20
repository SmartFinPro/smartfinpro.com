// Tool: get_orphan_slugs (read-only)
// Find /go/<slug> references in MDX that are NOT active in affiliate_links.

import { getServiceClient } from '../lib/supabase.js';
import { withAudit } from '../lib/audit.js';
import { walkContentForGoSlugs } from '../lib/content-walker.js';
import { GetOrphanSlugsInput, formatZodError } from '../lib/validation.js';
import type { OrphanSlug } from '../types.js';

export const TOOL_NAME = 'get_orphan_slugs';

export const TOOL_DESCRIPTION =
  'Find /go/<slug> references in content/**/*.mdx that are not active in affiliate_links. ' +
  'Returns orphan slugs with ref_count and example source files. 60s in-process cache. Read-only.';

export const TOOL_INPUT_SCHEMA = GetOrphanSlugsInput;

interface Result {
  orphan: OrphanSlug[];
  active_in_db: number;
  total_content_refs: number;
  unique_content_slugs: number;
  files_scanned: number;
}

export const handle = withAudit(
  TOOL_NAME,
  async (rawArgs: unknown): Promise<Result> => {
    const parsed = GetOrphanSlugsInput.safeParse(rawArgs);
    if (!parsed.success) throw new Error(formatZodError(parsed.error));

    // ── Walk content for /go/<slug> refs ──────────────────────────────
    const walkResult = walkContentForGoSlugs();

    // Aggregate refs → slug → { count, examples }
    const contentMap = new Map<string, { count: number; files: Set<string> }>();
    for (const ref of walkResult.refs) {
      const cur = contentMap.get(ref.slug) ?? { count: 0, files: new Set<string>() };
      cur.count += 1;
      if (cur.files.size < 3) cur.files.add(ref.file);
      contentMap.set(ref.slug, cur);
    }

    // ── Fetch active slugs from DB ────────────────────────────────────
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('slug')
      .eq('active', true);
    if (error) throw new Error(`supabase: ${error.message}`);
    const activeSet = new Set<string>((data ?? []).map((r: { slug: string }) => r.slug));

    // ── Diff ──────────────────────────────────────────────────────────
    const orphan: OrphanSlug[] = [];
    for (const [slug, info] of contentMap) {
      if (!activeSet.has(slug)) {
        orphan.push({
          slug,
          ref_count: info.count,
          example_files: [...info.files],
        });
      }
    }
    // Sort orphans by ref_count desc (most-referenced first → highest-impact fix)
    orphan.sort((a, b) => b.ref_count - a.ref_count);

    return {
      orphan,
      active_in_db: activeSet.size,
      total_content_refs: walkResult.refs.length,
      unique_content_slugs: contentMap.size,
      files_scanned: walkResult.files_scanned,
    };
  },
);
