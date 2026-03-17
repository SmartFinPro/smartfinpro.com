import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/lib/api/sync-service';

/**
 * Webhook endpoint for receiving conversion notifications from affiliate networks.
 *
 * URL format: /api/webhooks/conversions?connector=partnerstack
 *
 * Each connector may use different signature headers:
 * - PartnerStack: X-Partnerstack-Signature
 * - Impact: X-Impact-Signature
 * etc.
 */
export async function POST(request: NextRequest) {
  try {
    const connectorName = request.nextUrl.searchParams.get('connector');

    if (!connectorName) {
      return NextResponse.json(
        { error: 'Missing connector parameter' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    let payload: unknown;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Get signature header based on connector
    const signatureHeaders: Record<string, string> = {
      partnerstack: 'x-partnerstack-signature',
      impact: 'x-impact-signature',
      shareasale: 'x-shareasale-signature',
    };

    const signatureHeader = signatureHeaders[connectorName] || 'x-webhook-signature';
    const signature = request.headers.get(signatureHeader) || undefined;

    // Process the webhook
    const result = await processWebhook(connectorName, payload, signature);

    if (!result.success) {
      console.error(`Webhook processing failed for ${connectorName}:`, result.errors);
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: result.errors[0]?.includes('signature') ? 401 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      records_synced: result.records_synced,
      records_skipped: result.records_skipped,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for webhook verification (some networks send a verification ping)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');

  if (challenge) {
    // Return challenge for webhook verification
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ status: 'Webhook endpoint active' });
}
