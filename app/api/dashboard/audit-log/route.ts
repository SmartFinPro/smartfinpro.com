// app/api/dashboard/audit-log/route.ts
import { NextRequest } from 'next/server';
import { getAuditLog, type GetAuditLogOptions } from '@/lib/actions/audit-log';

// Auth handled centrally by proxy.ts for /api/dashboard/*
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sourceParam = searchParams.get('source');
  const source: GetAuditLogOptions['source'] =
    sourceParam === 'cron' || sourceParam === 'autonomous' || sourceParam === 'all'
      ? sourceParam
      : 'all';

  const limitRaw = parseInt(searchParams.get('limit') ?? '', 10);
  const offsetRaw = parseInt(searchParams.get('offset') ?? '', 10);

  const result = await getAuditLog({
    source,
    status: searchParams.get('status') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
    offset: Number.isFinite(offsetRaw) ? offsetRaw : undefined,
  });

  return Response.json(result);
}
