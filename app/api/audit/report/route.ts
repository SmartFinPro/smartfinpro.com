// app/api/audit/report/route.ts
// Serves the latest integration audit report JSON for browser download.
// Requires: ./audits/reports/integration-latest.json to exist.

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const REPORT_FILE = path.join(process.cwd(), 'audits', 'reports', 'integration-latest.json');

export async function GET() {
  if (!fs.existsSync(REPORT_FILE)) {
    return NextResponse.json(
      { error: 'No audit report found. Run: npm run verify:audit' },
      { status: 404 },
    );
  }

  const content = fs.readFileSync(REPORT_FILE, 'utf-8');

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="sfp-integration-audit-latest.json"',
      'Cache-Control': 'no-store',
    },
  });
}
