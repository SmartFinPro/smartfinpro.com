// app/api/dashboard/boost-deploy/route.ts
// Proxy: client components → boostAndDeploy server action
// Shared by: ranking-dashboard.tsx, competitor-radar.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/content-overrides'

import { NextRequest, NextResponse } from 'next/server';
import { boostAndDeploy } from '@/lib/actions/content-overrides';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, reason } = body;

    if (!slug) {
      return NextResponse.json(
        { boostSuccess: false, error: 'Missing required field: slug' },
        { status: 400 },
      );
    }

    const result = await boostAndDeploy(slug, reason);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { boostSuccess: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
