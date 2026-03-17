// app/api/dashboard/opportunities/[id]/route.ts
// Smart-Scan 2026 — Opportunity status update endpoint

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const VALID_STATUSES = ['new', 'reviewing', 'approved', 'rejected', 'published'] as const;
type Status = typeof VALID_STATUSES[number];

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sfp-dash-auth')?.value;
  const secret = process.env.DASHBOARD_SECRET;

  if (process.env.DASHBOARD_AUTH_DISABLED === 'true') return true;
  if (!secret || !authCookie) return false;
  return authCookie === secret;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const status = body.status as string;

  if (!VALID_STATUSES.includes(status as Status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('affiliate_opportunities')
    .update({
      status,
      reviewed_at: ['approved', 'rejected'].includes(status) ? new Date().toISOString() : undefined,
      published_at: status === 'published' ? new Date().toISOString() : undefined,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id, status });
}
