// app/api/dashboard/import-csv/route.ts
// Proxy: client component → importConversionsFromCSV server action
// Fixes: 'use client' cannot import from '@/lib/actions/revenue'

import { NextRequest, NextResponse } from 'next/server';
import { importConversionsFromCSV } from '@/lib/actions/revenue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvData, columnMapping, defaultLinkId, defaultStatus } = body;

    if (!csvData || !columnMapping?.dateColumn || !columnMapping?.amountColumn) {
      return NextResponse.json(
        { success: false, imported: 0, skipped: 0, errors: ['Missing required fields: csvData, columnMapping.dateColumn, columnMapping.amountColumn'] },
        { status: 400 },
      );
    }

    const result = await importConversionsFromCSV(
      csvData,
      {
        dateColumn: columnMapping.dateColumn,
        amountColumn: columnMapping.amountColumn,
        referenceColumn: columnMapping.referenceColumn || undefined,
        statusColumn: columnMapping.statusColumn || undefined,
        linkColumn: columnMapping.linkColumn || undefined,
      },
      defaultLinkId || undefined,
      defaultStatus,
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, imported: 0, skipped: 0, errors: [err instanceof Error ? err.message : 'Unknown error'] },
      { status: 500 },
    );
  }
}
