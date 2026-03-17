// app/api/dashboard/ab-testing/route.ts
// Proxy: client components → ab-testing server actions
// Used by: ab-live-view.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/ab-testing'

import { NextRequest, NextResponse } from 'next/server';
import { getAbTestLiveData, resetAbTest } from '@/lib/actions/ab-testing';

export async function GET() {
  try {
    const data = await getAbTestLiveData();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error', data: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, hubId } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 },
      );
    }

    if (action === 'reset') {
      if (!hubId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: hubId' },
          { status: 400 },
        );
      }
      const result = await resetAbTest(hubId);
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
