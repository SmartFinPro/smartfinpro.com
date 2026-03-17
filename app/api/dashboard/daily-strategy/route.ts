// app/api/dashboard/daily-strategy/route.ts
// Proxy: client components → approveAndExecuteSingle / rejectPlanItem server actions
// Used by: planning-approval.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/daily-strategy'

import { NextRequest, NextResponse } from 'next/server';
import { approveAndExecuteSingle, rejectPlanItem } from '@/lib/actions/daily-strategy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, planId, rejectionReason } = body;

    if (!action || !planId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, planId' },
        { status: 400 },
      );
    }

    if (action === 'approve') {
      const result = await approveAndExecuteSingle(planId);
      return NextResponse.json(result);
    }

    if (action === 'reject') {
      const result = await rejectPlanItem(planId, rejectionReason);
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
