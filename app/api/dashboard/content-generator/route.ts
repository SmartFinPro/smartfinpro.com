// app/api/dashboard/content-generator/route.ts
// Proxy: client components → content-generator server actions
// Used by: keyword-gap-analysis.tsx (generateAndPublishPage)
// Fixes: 'use client' cannot import from '@/lib/actions/content-generator'

import { NextRequest, NextResponse } from 'next/server';
import { generateAndPublishPage } from '@/lib/actions/content-generator';
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

    if (action === 'generate-and-publish') {
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
      const result = await generateAndPublishPage(keyword, market, category);
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
