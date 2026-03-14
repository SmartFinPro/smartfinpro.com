import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mapCountryToMarket, GEO_COOKIE_NAME } from '@/lib/geo/detect-market';

// ============================================================
// ROUTE SAFETY: Single source of truth for all routing
// Must match lib/i18n/config.ts exactly
// ============================================================
const MARKETS = new Set(['us', 'uk', 'ca', 'au']);

const CATEGORIES = new Set([
  'ai-tools',
  'cybersecurity',
  'trading',
  'forex',
  'personal-finance',
  'business-banking',
  'credit-repair',
  'debt-relief',
  'credit-score',
]);

// ============================================================
// PROTECTED PATHS: Routes that must NEVER be caught by [market]
// Any new top-level route must be added here
// ============================================================
const PROTECTED_PREFIXES = [
  '/_next',
  '/api',
  '/dashboard',
  '/go/',
  '/auth',
  '/tools',
  '/downloads',
  '/trading-platforms',
] as const;

const PROTECTED_EXACT = new Set([
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/methodology',
  '/affiliate-disclosure',
  '/imprint',
  '/sitemap.xml',
  '/robots.txt',
]) as ReadonlySet<string>;

// ============================================================
// SESSION CONFIG (AP-06 Phase 4)
// Sliding 30-minute idle timeout — cookie refreshed on every request.
// If the user is inactive for >30 min, the cookie expires → auto-logout.
// ============================================================
const SESSION_MAX_AGE = 60 * 30; // 30 minutes in seconds

// ============================================================
// TOTP / 2FA — RFC 4226 (HOTP) + RFC 6238 (TOTP)
// Pure WebCrypto, zero npm deps, works in Edge Runtime.
//
// How to enable 2FA:
//   1. Generate a base32 secret:  openssl rand -base32 20
//   2. Add to .env.local:         DASHBOARD_TOTP_SECRET=<secret>
//   3. Scan QR at /api/dashboard/totp-qr, or import the raw
//      base32 secret into Google Authenticator / Authy / 1Password.
//
// Leave DASHBOARD_TOTP_SECRET unset to keep single-factor (password only).
// ============================================================

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Uint8Array<ArrayBuffer> {
  const str = input.toUpperCase().replace(/[=\s]/g, '');
  const bytes: number[] = [];
  let buf = 0, bits = 0;
  for (const ch of str) {
    const v = BASE32.indexOf(ch);
    if (v < 0) continue;
    buf = (buf << 5) | v;
    bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((buf >> bits) & 0xff); }
  }
  return new Uint8Array(bytes) as Uint8Array<ArrayBuffer>;
}

async function generateTOTP(secretBase32: string, window?: number): Promise<string> {
  const t = window ?? Math.floor(Date.now() / 30_000);
  const key = await crypto.subtle.importKey(
    'raw', base32Decode(secretBase32),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'],
  );
  // 8-byte big-endian counter (high 4 bytes = 0, low 4 bytes = t)
  const counter = new DataView(new ArrayBuffer(8));
  counter.setUint32(0, 0, false);
  counter.setUint32(4, t, false);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter.buffer));
  const off = hmac[19] & 0x0f;
  const code =
    ((hmac[off] & 0x7f) << 24) |
    ((hmac[off + 1] & 0xff) << 16) |
    ((hmac[off + 2] & 0xff) << 8) |
    (hmac[off + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, '0');
}

/** Accepts ±1 time window to tolerate clock drift up to 30 s. */
async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const t = Math.floor(Date.now() / 30_000);
  for (const w of [t - 1, t, t + 1]) {
    if (await generateTOTP(secret, w) === code) return true;
  }
  return false;
}

// ============================================================
// BRUTE-FORCE PROTECTION (production-only)
// In-memory per-Edge-worker rate limiter.
// Local dev: no lockout — simple access as designed.
// Production: after MAX_ATTEMPTS failures from same IP → 15-min lockout.
// ============================================================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord { count: number; lockedUntil: number }
const loginAttempts = new Map<string, AttemptRecord>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isLockedOut(ip: string): boolean {
  const rec = loginAttempts.get(ip);
  if (!rec) return false;
  if (rec.lockedUntil > Date.now()) return true;
  // Lockout expired — reset
  loginAttempts.delete(ip);
  return false;
}

function recordFailedAttempt(ip: string): boolean /* true = now locked */ {
  const rec = loginAttempts.get(ip) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_LOGIN_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(ip, rec);
  return rec.lockedUntil > 0;
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// ============================================================
// MAIN MIDDLEWARE
// ============================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // ── Dashboard Auth Gate ──────────────────────────────────────
    // Protects /dashboard/* with DASHBOARD_SECRET cookie check.
    // Login via POST form — secret never appears in URL or browser history.
    //
    // Optional: DASHBOARD_TOTP_SECRET → enables TOTP 2FA on login form.
    // Optional: DASHBOARD_IP_WHITELIST → comma-separated allowed IPs.
    //
    // Dev-Bypass: DASHBOARD_AUTH_DISABLED=true in .env.local
    // → Dashboard ohne Login erreichbar (für lokale Entwicklung).
    if (pathname.startsWith('/dashboard')) {
      const dashSecret  = process.env.DASHBOARD_SECRET;
      const totpSecret  = process.env.DASHBOARD_TOTP_SECRET;   // optional 2FA
      const ipWhitelist = (process.env.DASHBOARD_IP_WHITELIST ?? '')
        .split(',').map((s) => s.trim()).filter(Boolean);

      const authDisabled =
        process.env.NODE_ENV !== 'production' &&
        process.env.DASHBOARD_AUTH_DISABLED === 'true';

      // Dev-Bypass
      if (authDisabled) return NextResponse.next();

      // Block if secret not configured in production
      if (!dashSecret && process.env.NODE_ENV === 'production') {
        return new NextResponse(
          'Dashboard disabled — DASHBOARD_SECRET not configured',
          { status: 503 },
        );
      }

      // ── IP Whitelist ────────────────────────────────────────────
      // Set DASHBOARD_IP_WHITELIST="1.2.3.4,5.6.7.8" to limit access.
      // Works behind Cloudflare / reverse-proxy (reads x-forwarded-for).
      if (ipWhitelist.length > 0) {
        const clientIp = getClientIp(request);
        if (!ipWhitelist.includes(clientIp)) {
          console.warn(`[dashboard] IP ${clientIp} blocked by whitelist`);
          return new NextResponse(
            `403 Forbidden — Your IP (${clientIp}) is not authorised.`,
            { status: 403, headers: { 'Content-Type': 'text/plain' } },
          );
        }
      }

      // ── Handle POST login submission ──────────────────────────
      if (dashSecret && request.method === 'POST') {
        const clientIp = getClientIp(request);

        // ── Brute-force check (production only) ──────────────────
        if (process.env.NODE_ENV === 'production' && isLockedOut(clientIp)) {
          return dashboardLoginPage(
            pathname,
            'Too many failed attempts. Please try again in 15 minutes.',
            !!totpSecret,
          );
        }

        try {
          const fd       = await request.formData();
          const submitted = fd.get('secret')?.toString() ?? '';
          const totpCode  = fd.get('totp')?.toString() ?? '';
          const target    = fd.get('redirect')?.toString() ?? '/dashboard';
          const safePath  = target.startsWith('/dashboard') ? target : '/dashboard';

          // Step 1: Password check
          if (submitted !== dashSecret) {
            // Record failed attempt (production only)
            if (process.env.NODE_ENV === 'production') {
              const nowLocked = recordFailedAttempt(clientIp);
              if (nowLocked) {
                console.warn(`[dashboard] Brute-force lockout triggered for IP ${clientIp}`);
                return dashboardLoginPage(
                  pathname,
                  'Too many failed attempts. Account locked for 15 minutes.',
                  !!totpSecret,
                );
              }
            }
            return dashboardLoginPage(pathname, 'Invalid secret. Please try again.', !!totpSecret);
          }

          // Step 2: TOTP check (only if 2FA is configured)
          if (totpSecret) {
            const ok = await verifyTOTP(totpSecret, totpCode);
            if (!ok) {
              return dashboardLoginPage(
                pathname,
                'Invalid 2FA code — codes rotate every 30 seconds.',
                true,
              );
            }
          }

          // ✅ Both checks passed — clear failed attempts + issue sliding session cookie
          if (process.env.NODE_ENV === 'production') clearAttempts(clientIp);
          const response = NextResponse.redirect(new URL(safePath, request.url));
          response.cookies.set('sfp-dash-auth', dashSecret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: SESSION_MAX_AGE, // 30 min
            path: '/dashboard',
          });
          return response;
        } catch {
          // Malformed form data
        }
        return dashboardLoginPage(pathname, 'Login failed. Please try again.', !!totpSecret);
      }

      // ── Validate auth cookie + renew sliding session ─────────
      if (dashSecret) {
        const authCookie = request.cookies.get('sfp-dash-auth')?.value;
        if (authCookie !== dashSecret) {
          const clientIp =
            request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
          console.warn(
            `[dashboard] Unauthorized attempt from ${clientIp} → ${pathname}`,
          );
          return dashboardLoginPage(pathname, false, !!totpSecret);
        }

        // ✅ Authenticated — refresh cookie to reset idle timer (sliding session)
        // User inactive for >30 min → cookie expires → next request shows login page.
        const response = NextResponse.next();
        response.cookies.set('sfp-dash-auth', dashSecret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: SESSION_MAX_AGE, // sliding: resets on every page load
          path: '/dashboard',
        });
        return response;
      }

      return NextResponse.next();
    }

    // ── Step 1: Skip system paths & protected route prefixes ──
    for (const prefix of PROTECTED_PREFIXES) {
      if (pathname.startsWith(prefix)) return NextResponse.next();
    }

    // ── Step 2: Skip static files (images, fonts, etc.) ──
    if (pathname.includes('.')) return NextResponse.next();

    // ── Step 3: Homepage → served by app/(marketing)/page.tsx directly ──
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return withGeoCookie(request, NextResponse.next());
    }

    const firstSegment = segments[0];

    // ── Step 4: Skip exact protected pages ──
    if (PROTECTED_EXACT.has(pathname) || PROTECTED_EXACT.has(`/${firstSegment}`)) {
      return NextResponse.next();
    }

    // ── Step 5: Valid market prefix → allow through + set geo cookie ──
    if (MARKETS.has(firstSegment)) {
      return withGeoCookie(request, NextResponse.next());
    }

    // ── Step 6: Legacy US clean URLs → 301 redirect to /us/... ──
    if (CATEGORIES.has(firstSegment) || firstSegment === 'reviews') {
      return NextResponse.redirect(new URL(`/us${pathname}`, request.url), 301);
    }

    // ── Step 7: Everything else → allow through + set geo cookie ──
    return withGeoCookie(request, NextResponse.next());
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown middleware error';
    console.error(`[middleware] fallback for pathname="${pathname}":`, msg);
    return NextResponse.next();
  }
}

// ── Dashboard Login Page (inline HTML, zero deps) ─────────────
function dashboardLoginPage(
  redirectPath: string,
  errorMsg: string | false,
  totpEnabled: boolean,
): NextResponse {
  const errorBanner = errorMsg
    ? `<p style="color:#D64045;font-size:13px;margin:0 0 16px;padding:8px 12px;background:rgba(214,64,69,0.08);border-radius:8px;text-align:left">${errorMsg}</p>`
    : '';

  const totpField = totpEnabled
    ? `<input type="text" name="totp" placeholder="6-digit 2FA code" required inputmode="numeric"
         autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6"
         style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:10px;font-size:16px;
                outline:none;margin-bottom:12px;letter-spacing:0.2em;text-align:center">`
    : '';

  const totpHint = totpEnabled
    ? `<p style="font-size:11px;color:#888;margin-top:14px">Use Google Authenticator, Authy, or any TOTP app.</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dashboard Login — SmartFinPro</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;
         align-items:center;height:100vh;margin:0;background:#F2F4F8;color:#1A1A2E}
    input:focus{border-color:#1B4F8C!important;box-shadow:0 0 0 3px rgba(27,79,140,.12);outline:none}
    input,button{transition:all .15s}
    button:hover{opacity:.9}
  </style>
</head>
<body>
<div style="text-align:center;width:100%;max-width:360px;padding:0 24px">
  <div style="font-size:40px;margin-bottom:16px">&#128274;</div>
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px">Dashboard Access</h1>
  <p style="color:#555;font-size:14px;margin:0 0 24px">
    ${totpEnabled ? 'Enter your secret and 2FA code to continue.' : 'Enter your dashboard secret to continue.'}
  </p>
  ${errorBanner}
  <form method="POST" action="${redirectPath}">
    <input type="hidden" name="redirect" value="${redirectPath}">
    <input type="password" name="secret" placeholder="Dashboard Secret" required
      autocomplete="current-password"
      style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:10px;
             font-size:14px;outline:none;margin-bottom:12px">
    ${totpField}
    <button type="submit"
      style="width:100%;padding:10px 14px;border:none;border-radius:10px;
             font-size:14px;font-weight:600;color:#fff;background:#F5A623;cursor:pointer">
      Sign In
    </button>
  </form>
  ${totpHint}
</div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 401,
    headers: { 'Content-Type': 'text/html' },
  });
}

// ── Geo-IP Cookie ────────────────────────────────────────────────
// Sets `sfp-geo` cookie from Cloudflare/Vercel geo-IP headers.
// Client components read this cookie to show geo-personalized CTAs
// without breaking SSG (no server-side headers() call in page components).
function withGeoCookie(request: NextRequest, response: NextResponse): NextResponse {
  // Skip if cookie is already set (avoids re-setting on every request)
  if (request.cookies.get(GEO_COOKIE_NAME)?.value) return response;

  const countryCode =
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    null;

  if (!countryCode) return response;

  const market = mapCountryToMarket(countryCode);
  if (!market) return response;

  response.cookies.set(GEO_COOKIE_NAME, market, {
    httpOnly: false, // Must be readable by client JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
