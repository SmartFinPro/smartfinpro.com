/**
 * Resend Email Integration
 *
 * Handles transactional emails for newsletter subscriptions and lead magnet delivery.
 * Uses React Email components for beautiful, responsive templates.
 */

import { render } from '@react-email/components';
import { WelcomeEmail } from './templates/welcome-email';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'SmartFinPro <hello@smartfinpro.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo || 'hello@smartfinpro.com',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send welcome email with lead magnet using React Email template
 */
export async function sendLeadMagnetEmail(
  email: string,
  leadMagnetTitle: string
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://smartfinpro.com';

  // Interactive guide page URL (instead of static PDF)
  const downloadUrl = `${baseUrl}/downloads/ai-finance-workflow`;

  // Generate unsubscribe token
  const unsubscribeToken = Buffer.from(email).toString('base64').slice(0, 16);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;

  // Render React Email template to HTML
  const html = await render(
    WelcomeEmail({
      downloadUrl,
      unsubscribeUrl,
      baseUrl,
    })
  );

  // Plain text version
  const text = `
🚀 Dein Download: Der 5-Minuten KI-Finanz-Workflow

Hallo!

Willkommen bei SmartFinPro!

Wie versprochen findest du hier deinen Guide für mehr Effizienz im Finanz-Alltag:

👉 ${downloadUrl}

Was dich erwartet:
✅ Seite 1: 3 Copy-Paste Prompts für sofortige Ergebnisse
✅ Seite 2: Die Tool-Matrix – welches KI-Tool für welche Aufgabe
✅ Seite 3: Die Compliance-Checkliste für Profis

---

In den nächsten Tagen werde ich dir zeigen, wie du diese Workflows nutzt, um nicht nur Zeit zu sparen, sondern deine Conversion-Rates bei Finanzprodukten massiv zu steigern.

💡 Unser Tool-Tipp: Jasper AI
Für Finanz-Content empfehlen wir Jasper AI. SOC 2 zertifiziert, perfekt für Compliance.
${baseUrl}/go/jasper-ai

---

Falls du Fragen zu Jasper, Krypto-Trading oder Automatisierung hast – antworte einfach auf diese Mail. Ich lese jede Nachricht persönlich.

Stay smart,
Dein Team von smartfinpro.com

---
Abmelden: ${unsubscribeUrl}
  `.trim();

  return sendEmail({
    to: email,
    subject: `🚀 Dein Download: ${leadMagnetTitle}`,
    html,
    text,
  });
}

/**
 * Send weekly newsletter digest
 */
// Re-export nurture sequence functions
export { processNurtureSequence, getSequenceStats } from './nurture-sequence';

export async function sendNewsletterDigest(
  email: string,
  content: {
    headline: string;
    articles: Array<{ title: string; url: string; excerpt: string }>;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://smartfinpro.com';
  const unsubscribeToken = Buffer.from(email).toString('base64').slice(0, 16);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;

  const articlesHtml = content.articles
    .map(
      (article) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
          <h3 style="color: #1f2937; margin: 0 0 8px; font-size: 16px;">
            <a href="${article.url}" style="color: #2563eb; text-decoration: none;">${article.title}</a>
          </h3>
          <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">${article.excerpt}</p>
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: #2563eb; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${content.headline}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <table width="100%">
                ${articlesHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af;">Abmelden</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: `📊 ${content.headline}`,
    html,
  });
}
