// app/api/dashboard/search/route.ts
//
// Global Command-Palette search backend (Cmd+K).
// Auth is handled centrally in proxy.ts (the `/api/dashboard/*` gate) — this
// route does NOT re-check the session cookie. It only runs read-only, bounded
// queries via the service-role client.
//
// GET /api/dashboard/search?q=<term>
//   → { groups: { links: [], content: [], keywords: [], competitors: [] } }
//
// The client-side "Pages" group is built in the component itself, so it is
// intentionally omitted from this payload.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAllContentSlugs } from '@/lib/mdx';

export const dynamic = 'force-dynamic';

// Bounded result limits — keep the palette snappy and the queries cheap.
const PER_GROUP_LIMIT = 6;
const MIN_QUERY_LENGTH = 2;

interface SearchResult {
  type: 'link' | 'content' | 'keyword' | 'competitor';
  label: string;
  sub?: string;
  href: string;
}

interface SearchGroups {
  links: SearchResult[];
  content: SearchResult[];
  keywords: SearchResult[];
  competitors: SearchResult[];
}

function emptyGroups(): SearchGroups {
  return { links: [], content: [], keywords: [], competitors: [] };
}

/** Escape PostgREST `ilike` wildcards so user input is treated literally. */
function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();

  // Guard: too short → nothing to search.
  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ groups: emptyGroups() });
  }

  const groups = emptyGroups();
  const pattern = `%${escapeIlike(q)}%`;
  const lowerQ = q.toLowerCase();

  try {
    const supabase = createServiceClient();

    // ── Run the three DB lookups + the content lookup in parallel ──────────
    const [linksRes, keywordsRes, snapshotsRes, contentSlugs] = await Promise.all([
      // Affiliate links — match slug OR partner_name (case-insensitive).
      supabase
        .from('affiliate_links')
        .select('slug, partner_name')
        .or(`slug.ilike.${pattern},partner_name.ilike.${pattern}`)
        .limit(PER_GROUP_LIMIT),

      // Keyword tracking — match keyword.
      supabase
        .from('keyword_tracking')
        .select('keyword')
        .ilike('keyword', pattern)
        .limit(PER_GROUP_LIMIT),

      // Competitor SERP snapshots — domains live inside the organic_results
      // JSONB array (there is no top-level domain column), so we pull the most
      // recent snapshots and extract/dedupe domains in JS.
      supabase
        .from('competitor_serp_snapshots')
        .select('organic_results, scanned_at')
        .order('scanned_at', { ascending: false })
        .limit(40),

      // Content slugs — filesystem-backed via lib/mdx.
      getAllContentSlugs().catch(() => []),
    ]);

    // ── Affiliate links ────────────────────────────────────────────────────
    if (!linksRes.error && Array.isArray(linksRes.data)) {
      groups.links = linksRes.data.map((row) => ({
        type: 'link' as const,
        label: row.partner_name || row.slug,
        sub: row.slug,
        href: '/dashboard/links',
      }));
    }

    // ── Keywords ─────────────────────────────────────────────────────────────
    if (!keywordsRes.error && Array.isArray(keywordsRes.data)) {
      groups.keywords = keywordsRes.data.map((row) => ({
        type: 'keyword' as const,
        label: row.keyword,
        href: '/dashboard/ranking',
      }));
    }

    // ── Competitors (domain extracted from organic_results JSONB) ────────────
    if (!snapshotsRes.error && Array.isArray(snapshotsRes.data)) {
      const seen = new Set<string>();
      for (const snap of snapshotsRes.data) {
        const organics = (snap.organic_results ?? []) as Array<{
          domain?: string;
          isOwnSite?: boolean;
        }>;
        for (const o of organics) {
          const domain = (o?.domain ?? '').toLowerCase();
          if (!domain || o.isOwnSite) continue;
          if (!domain.includes(lowerQ)) continue;
          if (seen.has(domain)) continue;
          seen.add(domain);
          groups.competitors.push({
            type: 'competitor',
            label: domain,
            href: '/dashboard/competitors',
          });
          if (groups.competitors.length >= PER_GROUP_LIMIT) break;
        }
        if (groups.competitors.length >= PER_GROUP_LIMIT) break;
      }
    }

    // ── Content slugs ────────────────────────────────────────────────────────
    if (Array.isArray(contentSlugs)) {
      groups.content = contentSlugs
        .filter((c) => c.slug.toLowerCase().includes(lowerQ))
        .slice(0, PER_GROUP_LIMIT)
        .map((c) => ({
          type: 'content' as const,
          label: c.slug,
          sub: `${c.market} · ${c.category}`,
          href: `/${c.market}/${c.category}/${c.slug}`,
        }));
    }

    return NextResponse.json({ groups });
  } catch {
    // Never surface internal errors to the palette — degrade to empty results.
    return NextResponse.json({ groups: emptyGroups() });
  }
}
