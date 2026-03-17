// app/api/dashboard/revenue-forecast/route.ts
// GET proxy: accepts ?range=7d|30d and returns revenue forecast data.
// Solves: 'use client' components cannot import server actions directly (Turbopack crash).

import { NextRequest, NextResponse } from 'next/server';
import { getRevenueForecast } from '@/lib/actions/revenue-forecast';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as '7d' | '30d') || '30d';
    const result = await getRevenueForecast(range);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : 'Forecast failed' },
      { status: 500 },
    );
  }
}
