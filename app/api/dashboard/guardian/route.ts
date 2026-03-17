// app/api/dashboard/guardian/route.ts
// Proxy: client components → getGuardianStatus / sendTestNotification server actions
// Used by: system-settings.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/guardian'

import { NextRequest, NextResponse } from 'next/server';
import { getGuardianStatus, sendTestNotification } from '@/lib/actions/guardian';

export async function GET() {
  try {
    const status = await getGuardianStatus();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { enabled: false, lastCheck: null, results: [], error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email } = body;

    if (action === 'send-test') {
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: email' },
          { status: 400 },
        );
      }
      const result = await sendTestNotification(email);
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
