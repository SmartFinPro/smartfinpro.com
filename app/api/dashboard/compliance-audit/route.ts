// app/api/dashboard/compliance-audit/route.ts
// POST proxy: runs the global compliance audit and returns results.
// Solves: 'use client' components cannot import server actions directly (Turbopack crash).

import { NextResponse } from 'next/server';
import { runComplianceAudit } from '@/lib/actions/compliance-audit';

export async function POST() {
  try {
    const result = await runComplianceAudit();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Audit failed' },
      { status: 500 },
    );
  }
}
