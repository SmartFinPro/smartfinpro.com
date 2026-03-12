// app/api/dashboard/affiliate-scan/route.ts
// POST proxy: triggers analyzeAffiliateOpportunities and returns results.
// Solves: 'use client' components cannot import server actions directly (Turbopack crash).

import { NextResponse } from 'next/server';
import { analyzeAffiliateOpportunities } from '@/lib/actions/daily-strategy';

export async function POST() {
  try {
    const result = await analyzeAffiliateOpportunities();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, plans: [], error: err instanceof Error ? err.message : 'Scan failed' },
      { status: 500 },
    );
  }
}
