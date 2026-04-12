// app/api/{{NAME}}/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validate } from '@/lib/validation';
import { logger } from '@/lib/logging';
import { createServiceClient } from '@/lib/supabase/server';
// import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session'; // if auth needed

const RequestSchema = z.object({
  // TODO: define request shape
  market: z.enum(['us', 'uk', 'ca', 'au']).optional(),
});

export async function POST(request: NextRequest) {
  // ── Validate ──────────────────────────────────────────────
  const result = validate(RequestSchema, await request.json());
  if (!result.ok) return result.error; // NextResponse 400 with details

  const { market } = result.data;

  // ── Auth (uncomment if dashboard-protected) ────────────────
  // const cookie = request.cookies.get('sfp-dash-auth')?.value;
  // if (!cookie || !isValidDashboardSessionValue(cookie, process.env.DASHBOARD_SECRET)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const supabase = createServiceClient();
    void supabase; // TODO: use supabase

    // TODO: implement logic

    return NextResponse.json({ ok: true });

  } catch (err) {
    logger.error('[{{NAME}}] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServiceClient();
    void supabase; // TODO: use supabase

    // TODO: implement GET logic

    return NextResponse.json({ ok: true, data: [] });

  } catch (err) {
    logger.error('[{{NAME}}] GET error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
