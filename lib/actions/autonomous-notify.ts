// lib/actions/autonomous-notify.ts
'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { logger } from '@/lib/logging';

/**
 * Send an autonomous system notification via email.
 * Reads notification_email from system_settings (same as Guardian).
 * HTML is auto-generated from the plain-text message.
 * Fire-and-forget: never throws.
 */
export async function sendAutonomousNotification(
  subject: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'notification_email')
      .single();

    const email = data?.value?.trim();
    if (!email) {
      logger.warn('[autonomous-notify] No notification_email configured — skipping');
      return { success: false, error: 'No notification_email configured' };
    }

    // Convert plain text to simple HTML (preserve line breaks, bold markers)
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1B4F8C; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 16px;">SmartFinPro — Autonomous System</h2>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <pre style="font-family: inherit; white-space: pre-wrap; word-wrap: break-word; margin: 0; font-size: 14px; line-height: 1.6; color: #1a1a2e;">${escapeHtml(message)}</pre>
        </div>
        <p style="color: #999; font-size: 11px; margin-top: 12px;">
          This is an automated notification from SmartFinPro's autonomous revenue system.
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: `[SFP Auto] ${subject}`,
      html,
      text: message,
    });

    if (!result.success) {
      logger.warn('[autonomous-notify] Email send failed', { error: result.error });
    }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    logger.error('[autonomous-notify] Fatal', { error: msg });
    return { success: false, error: msg };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
