// app/api/backlinks/route.ts — API route for backlink data (GET) and CSV import (POST)
import { NextRequest, NextResponse } from 'next/server';
import {
  getBacklinksForPage,
  importBacklinksFromCSV,
  scanInternalBacklinks,
} from '@/lib/actions/backlinks';
import type { BacklinkCsvMapping } from '@/lib/types/backlink';

// GET — Fetch backlinks for a specific target URL
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json(
        { error: 'Missing required "url" query parameter' },
        { status: 400 }
      );
    }

    const backlinks = await getBacklinksForPage(url);
    return NextResponse.json({ backlinks });
  } catch (err) {
    console.error('[api/backlinks] GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST — Import backlinks from CSV or trigger internal scan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Internal link scan trigger
    if (body.action === 'scan_internal') {
      const result = await scanInternalBacklinks();
      return NextResponse.json(result);
    }

    // CSV import
    const { csvText, mapping } = body as {
      csvText: string;
      mapping: BacklinkCsvMapping;
    };

    if (!csvText || !mapping) {
      return NextResponse.json(
        { error: 'csvText (string) and mapping (BacklinkCsvMapping) required' },
        { status: 400 }
      );
    }

    const result = await importBacklinksFromCSV(csvText, mapping);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/backlinks] POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
