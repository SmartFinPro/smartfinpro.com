'use server';

// ============================================================
// Newsletter Server Actions
// ============================================================
// All Node.js-only imports (crypto, next/headers, supabase/server)
// are dynamically imported INSIDE each function body.
// Reason: Turbopack creates a client-side Server Reference stub for
// 'use server' modules. Top-level imports of Node.js-only modules
// (crypto, next/headers, @supabase/ssr) make Turbopack try — and
// fail — to bundle them into the client, crashing HMR in dev mode.
// ============================================================

import type { Market } from '@/lib/supabase/types';
import { logger } from '@/lib/logging';

// Hash IP address for GDPR compliance — store pseudonymized, not raw PII.
async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const { createHash } = await import('crypto');
  return createHash('sha256').update(ip).digest('hex');
}

// ============================================================
// Newsletter Subscription
// ============================================================

interface SubscribeParams {
  email: string;
  leadMagnet?: string;
  source?: string;
  market?: Market;
  tags?: string[];
  referrer?: string;
}

interface SubscribeResult {
  success: boolean;
  message: string;
  subscriberId?: string;
  isNew?: boolean;
}

export async function subscribeToNewsletter(params: SubscribeParams): Promise<SubscribeResult> {
  try {
    if (!params.email || !isValidEmail(params.email)) {
      return { success: false, message: 'Please enter a valid email address' };
    }

    const { createServiceClient } = await import('@/lib/supabase/server');
    const { headers } = await import('next/headers');

    const supabase = createServiceClient();
    const headersList = await headers();

    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || null;

    // Check if email already exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('email', params.email.toLowerCase())
      .single();

    if (existing) {
      if (existing.status === 'unsubscribed') {
        const { error } = await supabase
          .from('subscribers')
          .update({
            status: 'pending',
            unsubscribed_at: null,
            lead_magnet: params.leadMagnet || undefined,
            source: params.source || undefined,
            tags: params.tags || [],
          })
          .eq('id', existing.id);

        if (error) {
          logger.error('Error resubscribing:', error);
          return { success: false, message: 'Failed to resubscribe. Please try again.' };
        }

        return {
          success: true,
          message: 'Welcome back! Please check your email to confirm.',
          subscriberId: existing.id,
          isNew: false,
        };
      }

      return {
        success: true,
        message: "You're already subscribed!",
        subscriberId: existing.id,
        isNew: false,
      };
    }

    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email: params.email.toLowerCase(),
        lead_magnet: params.leadMagnet,
        source: params.source || 'website',
        market: params.market || 'us',
        status: 'pending',
        tags: params.tags || [],
        ip_address: await hashIp(ip),
        user_agent: userAgent,
        referrer: params.referrer,
        preferences: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating subscriber:', error);
      if (error.code === '23505') {
        return { success: false, message: "You're already subscribed!" };
      }
      return { success: false, message: 'Failed to subscribe. Please try again.' };
    }

    return {
      success: true,
      message: 'Thanks for subscribing! Please check your email to confirm.',
      subscriberId: data.id,
      isNew: true,
    };
  } catch (error) {
    logger.error('Error in subscribeToNewsletter:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

// ============================================================
// Unsubscribe
// ============================================================

export async function unsubscribe(params: { email?: string; subscriberId?: string }) {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');

    const supabase = createServiceClient();

    let query = supabase
      .from('subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      });

    if (params.subscriberId) {
      query = query.eq('id', params.subscriberId);
    } else if (params.email) {
      query = query.eq('email', params.email.toLowerCase());
    } else {
      return { success: false, message: 'Email or subscriber ID required' };
    }

    const { error } = await query;

    if (error) {
      logger.error('Error unsubscribing:', error);
      return { success: false, message: 'Failed to unsubscribe' };
    }

    return { success: true, message: "You've been unsubscribed" };
  } catch (error) {
    logger.error('Error in unsubscribe:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

// ============================================================
// Convenience Wrapper (for backwards compatibility)
// ============================================================

export async function subscribeWithEmail(
  email: string,
  leadMagnet?: string,
  source?: string
): Promise<SubscribeResult> {
  return subscribeToNewsletter({
    email,
    leadMagnet,
    source: source || 'website',
  });
}

// ============================================================
// Helper Functions
// ============================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
