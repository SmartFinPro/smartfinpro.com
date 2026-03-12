// app/api/dashboard/simulator/route.ts
// Proxy: client components → simulator server actions
// Used by: simulation-button.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/simulator'

import { NextRequest, NextResponse } from 'next/server';
import {
  getSimulationStatus,
  triggerFullSimulation,
  clearSimulationData,
} from '@/lib/actions/simulator';

export async function GET() {
  try {
    const status = await getSimulationStatus();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { active: false, clickCount: 0, planningCount: 0, optimizationCount: 0, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

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

    if (action === 'trigger') {
      const result = await triggerFullSimulation();
      return NextResponse.json(result);
    }

    if (action === 'clear') {
      const result = await clearSimulationData();
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
