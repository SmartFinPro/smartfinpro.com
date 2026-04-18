import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/genesis/index-url
 * Submits a URL to the Google Indexing API for instant SERP presence.
 *
 * Uses the `googleapis` library with Service Account JSON authentication.
 * Method: urlNotifications.publish with type URL_UPDATED
 *
 * Body: { url: string }
 * Auth: Bearer CRON_SECRET
 *
 * Requires: GOOGLE_INDEXING_JSON env var (raw JSON or base64-encoded service account key).
 * If not configured, returns graceful success=false with a message.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Auth check (timing-safe)
  if (!validateBearer(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const url = body.url as string;

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const serviceAccountJson = process.env.GOOGLE_INDEXING_JSON;
    if (!serviceAccountJson) {
      logger.info('[index-url] GOOGLE_INDEXING_JSON not configured — skipping');
      return NextResponse.json({
        success: false,
        message: 'Google Indexing API not configured. Set GOOGLE_INDEXING_JSON env var.',
        url,
        responseTimeMs: Date.now() - startTime,
      });
    }

    // Parse the service account credentials (supports raw JSON or base64)
    let credentials: { client_email: string; private_key: string };
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      try {
        const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
        credentials = JSON.parse(decoded);
      } catch {
        return NextResponse.json({
          success: false,
          message: 'Invalid GOOGLE_INDEXING_JSON format — must be JSON or base64-encoded JSON.',
          responseTimeMs: Date.now() - startTime,
        });
      }
    }

    // Authenticate via googleapis library
    const { google } = await import('googleapis');
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth });

    // Submit URL_UPDATED notification
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type: 'URL_UPDATED',
      },
    });

    const notifyTime = response.data?.urlNotificationMetadata?.latestUpdate?.notifyTime || null;
    const elapsed = Date.now() - startTime;

    logger.info(`[index-url] Successfully submitted: ${url} (${elapsed}ms)`, response.data);

    return NextResponse.json({
      success: true,
      url,
      notifyTime,
      responseTimeMs: elapsed,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[index-url] Error:', msg);
    return NextResponse.json({
      success: false,
      error: msg,
      responseTimeMs: Date.now() - startTime,
    }, { status: 500 });
  }
}
