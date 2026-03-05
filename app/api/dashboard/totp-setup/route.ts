import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dashboard/totp-setup
 *
 * Returns the TOTP setup URI (otpauth://) for importing into any
 * TOTP authenticator app (Google Authenticator, Authy, 1Password, etc.).
 *
 * Auth: requires sfp-dash-auth cookie OR Bearer token.
 *
 * How to generate a secret:
 *   openssl rand -base32 20
 *   → Add to .env.local: DASHBOARD_TOTP_SECRET=<result>
 *   → Then call this endpoint to get the setup URI.
 *
 * Usage:
 *   fetch('/api/dashboard/totp-setup')
 *   → Copy the otpauthUri and import into authenticator app, OR
 *   → Paste it at https://qr.io to generate a scannable QR code.
 */
export async function GET(request: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────
  const dashSecret = process.env.DASHBOARD_SECRET;
  const authCookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '');

  const isAuthed =
    (dashSecret && authCookie === dashSecret) ||
    (dashSecret && bearerToken === dashSecret);

  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Check if TOTP is configured ────────────────────────────────
  const totpSecret = process.env.DASHBOARD_TOTP_SECRET;

  if (!totpSecret) {
    return NextResponse.json({
      enabled: false,
      message: 'TOTP 2FA is not configured.',
      setup: {
        step1: 'Generate a base32 secret:  openssl rand -base32 20',
        step2: 'Add to .env.local:         DASHBOARD_TOTP_SECRET=<result>',
        step3: 'Restart PM2:               pm2 restart smartfinpro',
        step4: 'Call this endpoint again to get the setup URI',
      },
    });
  }

  // ── Build the otpauth URI (RFC 6238) ───────────────────────────
  // Format: otpauth://totp/Label?secret=SECRET&issuer=ISSUER&algorithm=SHA1&digits=6&period=30
  const label = encodeURIComponent('SmartFinPro Dashboard');
  const issuer = encodeURIComponent('SmartFinPro');
  const otpauthUri = `otpauth://totp/${label}?secret=${totpSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

  return NextResponse.json({
    enabled: true,
    otpauthUri,
    instructions: [
      '1. Copy the otpauthUri below',
      '2. Open Google Authenticator, Authy, or 1Password',
      '3. Add account → Enter setup key manually → paste the secret',
      '   OR: generate a QR code at https://qr.io and scan it',
      '4. The app will generate 6-digit codes rotating every 30 seconds',
      '5. Enter the code in the Dashboard login form alongside your secret',
    ],
    secret: totpSecret,  // Included for manual entry in authenticator apps
    note: 'Keep this secret safe — it is equivalent to your 2FA seed.',
  });
}
