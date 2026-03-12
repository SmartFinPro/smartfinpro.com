// app/api/dashboard/optimization-engine/route.ts
// Proxy: client components → optimization-engine server actions
// Used by: optimization-chat.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/optimization-engine'

import { NextRequest, NextResponse } from 'next/server';
import {
  executePageOptimization,
  dismissOptimizationTask,
  runOptimizationAnalysis,
} from '@/lib/actions/optimization-engine';
import type { IntervalType } from '@/lib/actions/optimization-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskId, intervalType } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 },
      );
    }

    if (action === 'execute') {
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: taskId' },
          { status: 400 },
        );
      }
      const result = await executePageOptimization(taskId);
      return NextResponse.json(result);
    }

    if (action === 'dismiss') {
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: taskId' },
          { status: 400 },
        );
      }
      const result = await dismissOptimizationTask(taskId);
      return NextResponse.json(result);
    }

    if (action === 'analyze') {
      const result = await runOptimizationAnalysis(
        (intervalType as IntervalType) || 'weekly',
      );
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
