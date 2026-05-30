import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * LEGACY — DEACTIVATED. Telegram is not a product channel.
 *
 * This endpoint previously handled inline-keyboard callbacks for the AI
 * Strategist daily digest (strategy A/B execution + content-plan approval).
 * That interactive Telegram approval flow is intentionally DEACTIVATED and has
 * no Telegram-based replacement.
 *
 * The equivalent capability now lives in-app: the Approval Queue at
 * /dashboard/content/planning approves & executes the content plan, and the
 * Notification Center surfaces system alerts.
 *
 * The route is kept only as a tombstone so any still-registered Telegram
 * webhook receives a definitive 410 Gone instead of silently 404ing.
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'Telegram webhook deactivated. Use the in-app Approval Queue (/dashboard/content/planning).' },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Telegram webhook deactivated.' },
    { status: 410 },
  );
}
