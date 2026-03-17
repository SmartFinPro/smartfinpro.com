// app/api/dashboard/gap-analysis/route.ts
// Proxy: client components → gap-analysis server actions
// Used by: keyword-gap-analysis.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/gap-analysis'

import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeKeywordGap,
  createShadowDraft,
  bridgeTheGap,
  discardDraft,
} from '@/lib/actions/gap-analysis';
import type { Market } from '@/lib/i18n/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 },
      );
    }

    if (action === 'analyze') {
      const { competitorDomain, market } = body as {
        competitorDomain: string;
        market: Market;
      };
      if (!competitorDomain || !market) {
        return NextResponse.json(
          { success: false, error: 'Missing competitorDomain or market' },
          { status: 400 },
        );
      }
      const result = await analyzeKeywordGap(competitorDomain, market);
      return NextResponse.json(result);
    }

    if (action === 'create-draft') {
      const { keyword, market, category, competitorDomain } = body as {
        keyword: string;
        market: Market;
        category: string;
        competitorDomain?: string;
      };
      if (!keyword || !market || !category) {
        return NextResponse.json(
          { success: false, error: 'Missing keyword, market, or category' },
          { status: 400 },
        );
      }
      const result = await createShadowDraft(keyword, market, category, competitorDomain);
      return NextResponse.json(result);
    }

    if (action === 'bridge') {
      const { keyword, market, category } = body as {
        keyword: string;
        market: Market;
        category: string;
      };
      if (!keyword || !market || !category) {
        return NextResponse.json(
          { success: false, error: 'Missing keyword, market, or category' },
          { status: 400 },
        );
      }
      const result = await bridgeTheGap(keyword, market, category);
      return NextResponse.json(result);
    }

    if (action === 'discard-draft') {
      const { draftId } = body as { draftId: string };
      if (!draftId) {
        return NextResponse.json(
          { success: false, error: 'Missing draftId' },
          { status: 400 },
        );
      }
      const result = await discardDraft(draftId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
