// app/api/dashboard/saved-views/route.ts
// Auth handled centrally by proxy.ts for /api/dashboard/* — no inline check needed.
// Client component (saved-views.tsx) talks to this route via fetch — it must NOT
// import the 'use server' action directly (Turbopack 'use server' boundary).
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validate } from '@/lib/validation';
import { listSavedViews, createSavedView, deleteSavedView, setDefaultSavedView } from '@/lib/actions/saved-views';
import { logger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  route: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(80),
  params: z.record(z.string(), z.string()).default({}),
});

const SetDefaultSchema = z.object({
  route: z.string().min(1).max(200),
  id: z.string().uuid(),
});

// GET /api/dashboard/saved-views?route=/dashboard/analytics
export async function GET(request: NextRequest) {
  const route = new URL(request.url).searchParams.get('route');
  if (!route) {
    return Response.json({ success: false, error: 'Missing route' }, { status: 400 });
  }
  const result = await listSavedViews(route);
  return Response.json(result, { status: result.success ? 200 : 500 });
}

// POST /api/dashboard/saved-views  { route, name, params }
export async function POST(request: NextRequest) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    /* fall through — validate(null) returns a 400 */
  }
  const parsed = validate(CreateSchema, body);
  if (!parsed.ok) return parsed.error;

  try {
    const result = await createSavedView(parsed.data);
    return Response.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    logger.error('saved-views POST failed', err);
    return Response.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/dashboard/saved-views?id=<uuid>
export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  }
  const result = await deleteSavedView(id);
  return Response.json(result, { status: result.success ? 200 : 500 });
}

// PATCH /api/dashboard/saved-views  { route, id } — set as default for the route
export async function PATCH(request: NextRequest) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    /* fall through — validate(null) returns a 400 */
  }
  const parsed = validate(SetDefaultSchema, body);
  if (!parsed.ok) return parsed.error;

  try {
    const result = await setDefaultSavedView(parsed.data.route, parsed.data.id);
    return Response.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    logger.error('saved-views PATCH failed', err);
    return Response.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
