// app/api/dashboard/competitors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  triggerCompetitorScan,
  spyDomain,
  dismissAlert,
  boostFromAlert,
  analyzeKeyword,
} from '@/lib/actions/competitors';
import type { Market } from '@/lib/i18n/config';

// Allow up to 55s for scan batches (Cloudflare free tier = 100s)
export const maxDuration = 55;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'scan': {
        const { market, category } = body as { market?: Market; category?: string };
        const result = await triggerCompetitorScan(market, category);
        return NextResponse.json(result);
      }

      case 'spy': {
        const { domain, market } = body as { domain: string; market?: Market };
        if (!domain) {
          return NextResponse.json({ error: 'domain is required' }, { status: 400 });
        }
        const results = await spyDomain(domain, market);
        return NextResponse.json(results);
      }

      case 'dismiss-alert': {
        const { alertId } = body as { alertId: string };
        if (!alertId) {
          return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
        }
        const result = await dismissAlert(alertId);
        return NextResponse.json(result);
      }

      case 'boost-from-alert': {
        const { alertId } = body as { alertId: string };
        if (!alertId) {
          return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
        }
        const result = await boostFromAlert(alertId);
        return NextResponse.json(result);
      }

      case 'analyze-keyword': {
        const { keyword, market } = body as { keyword: string; market: Market };
        if (!keyword || !market) {
          return NextResponse.json({ error: 'keyword and market are required' }, { status: 400 });
        }
        const { category } = body as { category: string };
        const result = await analyzeKeyword(keyword, market, category);
        return NextResponse.json(result);
      }

      case 'check': {
        // Diagnostic: check if Serper API key is configured and DB tables exist
        const hasSerper = !!process.env.SERPER_API_KEY;
        const serperKeyLength = process.env.SERPER_API_KEY?.length ?? 0;

        // Try to count tracked keywords
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { count: trackedCount, error: trackedErr } = await supabase
          .from('competitor_tracked_keywords')
          .select('id', { count: 'exact', head: true });
        const { count: snapshotCount, error: snapshotErr } = await supabase
          .from('competitor_serp_snapshots')
          .select('id', { count: 'exact', head: true });

        return NextResponse.json({
          serperConfigured: hasSerper,
          serperKeyLength,
          trackedKeywords: trackedCount ?? 0,
          trackedError: trackedErr?.message ?? null,
          snapshots: snapshotCount ?? 0,
          snapshotError: snapshotErr?.message ?? null,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
