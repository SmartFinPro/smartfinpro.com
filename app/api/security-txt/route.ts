import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Served at /.well-known/security.txt via rewrite in next.config.ts.
// App Router cannot host a folder named ".well-known" (dot-prefix = private),
// and public/.well-known/* gets shadowed by the [market]/[category] dynamic
// route, so a route handler + rewrite is the only durable fix.

export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', '.well-known', 'security.txt');
  const body = await readFile(filePath, 'utf8');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
