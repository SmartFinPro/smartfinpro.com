// app/api/webhooks/resend/route.ts
// Resend Email Webhook Handler
//
// Handles bounce, complaint, and unsubscribe events from Resend.
// Resend sends POST requests to this URL when email events occur.
//
// Setup in Resend Dashboard:
//   Webhooks → Add Endpoint → https://smartfinpro.com/api/webhooks/resend
//   Events: email.bounced, email.complained, email.delivered, email.opened
//
// Env required: RESEND_WEBHOOK_SECRET (from Resend dashboard → Webhooks → Signing Secret)

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { webhookLimiter } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/client-ip';

type ResendWebhookEvent = {
  type:
    | 'email.sent'
    | 'email.delivered'
    | 'email.delivery_delayed'
    | 'email.bounced'
    | 'email.complained'
    | 'email.opened'
    | 'email.clicked'
    | 'email.unsubscribed';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
    bounce?: { message: string };
    click?: { link: string };
  };
};

/** Verify Resend webhook signature (HMAC-SHA256, timing-safe, length-guarded) */
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  // Resend sends: "sha256=<hash>" (or plain hex for older formats)
  const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  // Hex must be 64 chars (SHA-256) — anything else is malformed
  if (!/^[0-9a-fA-F]{64}$/.test(provided)) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(provided, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit before HMAC verification to blunt flood-based CPU exhaustion.
  // Resend's webhook retries + signature verification are CPU-bound; bursts
  // from a spoofed source IP would otherwise spike worker load.
  const ip = getClientIp(request);
  if (!webhookLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const rawBody = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  // ── Signature verification (MANDATORY) ─────────────────────────────────
  // Production refuses every unsigned request — no silent bypass.
  if (!secret || secret.startsWith('your-')) {
    logger.error('[resend-webhook] RESEND_WEBHOOK_SECRET not configured — rejecting all requests');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 },
    );
  }

  const signature = request.headers.get('svix-signature') ??
                    request.headers.get('resend-signature');
  if (!verifySignature(rawBody, signature, secret)) {
    logger.warn('[resend-webhook] Invalid or missing signature — rejecting', {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
      hasSignature: !!signature,
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const eventType = event.type;
  const emailAddresses = event.data?.to ?? [];

  logger.info(`[resend-webhook] Event: ${eventType} → ${emailAddresses.join(', ')}`);

  for (const email of emailAddresses) {
    const normalizedEmail = email.toLowerCase().trim();

    switch (eventType) {
      case 'email.bounced': {
        // Hard bounce → mark as bounced + stop sending
        const { error } = await supabase
          .from('subscribers')
          .update({
            status: 'bounced',
            updated_at: new Date().toISOString(),
          })
          .eq('email', normalizedEmail);

        if (error) {
          logger.error(`[resend-webhook] Failed to mark bounced: ${normalizedEmail}`, error.message);
        } else {
          logger.info(`[resend-webhook] Marked bounced: ${normalizedEmail}`);
        }
        break;
      }

      case 'email.complained': {
        // Spam complaint → immediate unsubscribe (GDPR requirement)
        const { error } = await supabase
          .from('subscribers')
          .update({
            status: 'complained',
            updated_at: new Date().toISOString(),
          })
          .eq('email', normalizedEmail);

        if (error) {
          logger.error(`[resend-webhook] Failed to mark complained: ${normalizedEmail}`, error.message);
        } else {
          logger.info(`[resend-webhook] Marked complained: ${normalizedEmail}`);
        }
        break;
      }

      case 'email.unsubscribed': {
        const { error } = await supabase
          .from('subscribers')
          .update({
            status: 'unsubscribed',
            updated_at: new Date().toISOString(),
          })
          .eq('email', normalizedEmail);

        if (error) {
          logger.error(`[resend-webhook] Failed to mark unsubscribed: ${normalizedEmail}`, error.message);
        } else {
          logger.info(`[resend-webhook] Marked unsubscribed: ${normalizedEmail}`);
        }
        break;
      }

      case 'email.delivered':
        // Optional: update delivery timestamp in email_sequence_logs
        await supabase
          .from('email_sequence_logs')
          .update({ delivered_at: new Date().toISOString() })
          .eq('email', normalizedEmail)
          .is('delivered_at', null)
          .order('sent_at', { ascending: false });
        break;

      default:
        // Other events (opened, clicked) — ignore or track optionally
        break;
    }
  }

  return NextResponse.json({ received: true, type: eventType });
}
