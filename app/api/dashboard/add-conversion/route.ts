// app/api/dashboard/add-conversion/route.ts
// POST proxy: accepts conversion data JSON and calls addConversion server action.
// Solves: 'use client' components cannot import server actions directly (Turbopack crash).

import { NextRequest, NextResponse } from 'next/server';
import { addConversion } from '@/lib/actions/revenue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await addConversion(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add conversion' },
      { status: 500 },
    );
  }
}
