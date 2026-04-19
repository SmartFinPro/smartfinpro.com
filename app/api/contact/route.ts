// app/api/contact/route.ts
// Contact form API — receives form submissions, forwards via Resend
// Email addresses are NEVER exposed to the frontend

import { NextRequest, NextResponse } from 'next/server';
import { contactLimiter } from '@/lib/security/rate-limit';

// Internal routing — never sent to client
const CONTACT_ROUTES: Record<string, string> = {
  general:      'support@smartfinpro.com',
  editorial:    'editorial@smartfinpro.com',
  partnerships: 'partnerships@smartfinpro.com',
};

export async function POST(request: NextRequest) {
  try {
    // F-05: Shared rate limiter (in-memory + Upstash-ready).
    // 3 submissions per IP per 5 minutes — allows genuine follow-ups,
    // blocks abuse. Unbounded Map leak replaced with cleanup-on-read.
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!(await contactLimiter.checkAsync(ip))) {
      return NextResponse.json(
        { error: 'Please wait a few minutes before submitting again.' },
        { status: 429 }
      );
    }

    // Parse & validate body
    const body = await request.json();
    const { name, email, department, message } = body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !message?.trim() ||
      !department?.trim()
    ) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Message length guard
    if (message.trim().length < 10 || message.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Message must be between 10 and 5000 characters.' },
        { status: 400 }
      );
    }

    // Resolve internal recipient — never expose to client
    const toEmail = CONTACT_ROUTES[department] ?? CONTACT_ROUTES.general;
    const departmentLabel =
      department === 'editorial'
        ? 'Editorial'
        : department === 'partnerships'
        ? 'Partnerships & Advertising'
        : 'General Inquiries';

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[contact] RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Send notification email to internal team
    const notifyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#1B4F8C;padding:24px 30px;">
            <h2 style="color:#fff;margin:0;font-size:20px;">📬 New Contact Form Submission</h2>
            <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">SmartFinPro.com — ${departmentLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:30px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                  <strong style="color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Name</strong>
                  <p style="margin:4px 0 0;color:#1a1a2e;font-size:15px;">${escapeHtml(name)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                  <strong style="color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Reply-To Email</strong>
                  <p style="margin:4px 0 0;font-size:15px;"><a href="mailto:${escapeHtml(email)}" style="color:#1B4F8C;">${escapeHtml(email)}</a></p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                  <strong style="color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Department</strong>
                  <p style="margin:4px 0 0;color:#1a1a2e;font-size:15px;">${departmentLabel}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <strong style="color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Message</strong>
                  <p style="margin:8px 0 0;color:#1a1a2e;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 30px;text-align:center;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">SmartFinPro Contact System · Reply directly to this email to respond to ${escapeHtml(name)}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const notifyResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'SmartFinPro <hello@smartfinpro.com>',
        to:       toEmail,
        reply_to: email,
        subject:  `[Contact] ${departmentLabel} — ${name}`,
        html:     notifyHtml,
      }),
    });

    if (!notifyResponse.ok) {
      const errText = await notifyResponse.text();
      console.error('[contact] Resend error:', errText);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 502 }
      );
    }

    // Send auto-reply to sender
    const autoReplyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#1B4F8C;padding:24px 30px;">
            <h2 style="color:#fff;margin:0;font-size:20px;">✅ We received your message</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:30px;">
            <p style="color:#1a1a2e;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">Thank you for reaching out to SmartFinPro. We have received your message and will get back to you within <strong>1–2 business days</strong>.</p>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0;">In the meantime, feel free to explore our latest reviews and tools at <a href="https://smartfinpro.com" style="color:#1B4F8C;">smartfinpro.com</a>.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 30px;text-align:center;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">SmartFinPro · Independent Financial Research · Please do not reply to this automated email</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Auto-reply (fire and forget — don't fail the request if this fails)
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:    process.env.RESEND_FROM_EMAIL || 'SmartFinPro <hello@smartfinpro.com>',
        to:      email,
        subject: 'We received your message — SmartFinPro',
        html:    autoReplyHtml,
      }),
    }).catch((err) => console.error('[contact] auto-reply failed:', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact] handler error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
