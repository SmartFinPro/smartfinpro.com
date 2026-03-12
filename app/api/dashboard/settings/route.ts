// app/api/dashboard/settings/route.ts
// Proxy: client components → settings server actions
// Used by: system-settings.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/settings'

import { NextRequest, NextResponse } from 'next/server';
import {
  testAnthropicConnection,
  testSerperConnection,
  testGoogleIndexing,
  updateSettings,
  globalReset,
} from '@/lib/actions/settings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, currentValue, settings: settingsPayload } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 },
      );
    }

    if (action === 'test-anthropic') {
      const result = await testAnthropicConnection(currentValue);
      return NextResponse.json(result);
    }

    if (action === 'test-serper') {
      const result = await testSerperConnection(currentValue);
      return NextResponse.json(result);
    }

    if (action === 'test-indexing') {
      const result = await testGoogleIndexing(currentValue);
      return NextResponse.json(result);
    }

    if (action === 'update') {
      if (!settingsPayload) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: settings' },
          { status: 400 },
        );
      }
      const result = await updateSettings(settingsPayload);
      return NextResponse.json(result);
    }

    if (action === 'reset') {
      const result = await globalReset();
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
