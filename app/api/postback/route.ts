/**
 * S2S Postback API Route — Universal Affiliate Network Endpoint
 *
 * Receives conversion funnel events (registration, KYC, FTD, approved, reversed)
 * from any affiliate network via URL macros.
 *
 * Supports both GET (standard S2S postback) and POST (JSON webhook).
 *
 * GET format (most networks):
 *   /api/postback?click_id={SUBID}&event=ftd&payout=150&currency=USD
 *     &txn_id={TXN_ID}&connector=partnerstack&token={TOKEN}
 *
 * POST format (JSON body):
 *   /api/postback?connector=partnerstack&token={TOKEN}
 *   { "click_id": "...", "event": "ftd", "payout": 150 }
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';
import { processPostback, validatePostbackToken } from '@/lib/api/postback-service';

// ── Rate Limiting (in-memory, per-worker) ────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;         // requests per window
const RATE_WINDOW = 60_000;    // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// Clean stale entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000); // every 5 min

// ── Shared handler for GET + POST ────────────────────────────────────────────

async function handlePostback(
  request: NextRequest,
  body?: Record<string, unknown>,
): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;

  // ── Rate limit by IP ──
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 },
    );
  }

  // ── Extract parameters (query string + optional body) ──
  const token = params.get('token') || '';
  const connector = params.get('connector') || undefined;

  const click_id = (body?.click_id as string) || params.get('click_id') || '';
  const event = (body?.event as string) || params.get('event') || '';
  const payoutRaw = body?.payout ?? params.get('payout');
  const payout = payoutRaw !== null && payoutRaw !== undefined
    ? Number(payoutRaw) : undefined;
  const currency = (body?.currency as string) || params.get('currency') || 'USD';
  const txn_id = (body?.txn_id as string) || params.get('txn_id') || undefined;

  // ── Validate required fields ──
  if (!click_id) {
    return NextResponse.json(
      { success: false, error: 'Missing click_id' },
      { status: 400 },
    );
  }
  if (!event) {
    return NextResponse.json(
      { success: false, error: 'Missing event' },
      { status: 400 },
    );
  }

  // ── Validate token ──
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Missing token' },
      { status: 401 },
    );
  }

  const tokenResult = await validatePostbackToken(token, connector);
  if (!tokenResult.valid) {
    logger.warn(`[postback] Invalid token from IP ${ip}, connector=${connector}`);
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 },
    );
  }

  // ── Process the postback ──
  const result = await processPostback({
    click_id,
    event,
    payout: payout && !isNaN(payout) ? payout : undefined,
    currency,
    txn_id,
    connector: tokenResult.connector || connector,
    metadata: body ? { raw_body: body, ip, user_agent: request.headers.get('user-agent') } : { ip },
  });

  if (!result.success && result.reason !== 'duplicate_skipped') {
    return NextResponse.json(
      { success: false, error: result.reason },
      { status: 400 },
    );
  }

  // Return 200 for both new events and dedup skips (network expects 200)
  return NextResponse.json({
    success: true,
    event_id: result.event_id || null,
    status: result.reason === 'duplicate_skipped' ? 'duplicate' : 'recorded',
  });
}

// ── GET: Standard S2S postback (URL params) ──────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    return await handlePostback(request);
  } catch (error) {
    Sentry.captureException(error);
    logger.error('[postback] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── POST: JSON webhook ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    return await handlePostback(request, body);
  } catch (error) {
    Sentry.captureException(error);
    logger.error('[postback] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
