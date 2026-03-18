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
// SESSION TOKEN — HMAC-based, never stores plaintext password
// Cookie value = HMAC-SHA256(secret, "sfp-dash-session") → hex
// Attacker who reads the cookie CANNOT reverse it to the password.
// ============================================================

async function createSessionToken(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode('sfp-dash-session')));
  return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison to prevent timing attacks. */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
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

export async function proxy(request: NextRequest) {
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

      // Block if secret not configured (any environment)
      if (!dashSecret) {
        return new NextResponse(
          'Dashboard unavailable.',
          { status: 503, headers: { 'Content-Type': 'text/plain' } },
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
            '403 Forbidden',
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

          // Step 1: Password check (timing-safe)
          if (!timingSafeCompare(submitted, dashSecret)) {
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
          const sessionToken = await createSessionToken(dashSecret);
          const response = NextResponse.redirect(new URL(safePath, request.url));
          response.cookies.set('sfp-dash-auth', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // 'strict' prevents cookie being sent on POST→redirect chain (ERR_TOO_MANY_REDIRECTS)
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
        const expectedToken = await createSessionToken(dashSecret);
        if (!authCookie || !timingSafeCompare(authCookie, expectedToken)) {
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
        response.cookies.set('sfp-dash-auth', expectedToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // consistent with login cookie
          maxAge: SESSION_MAX_AGE, // sliding: resets on every page load
          path: '/dashboard',
        });
        return response;
      }

      // Unreachable — dashSecret is always set at this point (blocked above if not).
      // Safety fallback: deny access.
      return new NextResponse('Forbidden', { status: 403 });
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
    ? `<div class="error-banner"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${errorMsg}</span></div>`
    : '';

  const totpField = totpEnabled ? `
    <div class="field-group">
      <label class="field-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        Authenticator Code
      </label>
      <input type="text" name="totp" placeholder="000000" required inputmode="numeric"
        autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" class="field-input totp-input">
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SmartFinPro</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #f0f2f5;
      color: #1a1a2e;
      min-height: 100vh;
      display: flex;
      align-items: stretch;
      overflow: hidden;
    }

    /* ── Left Panel — exact header gradient ── */
    .lp {
      display: none;
      width: 50%;
      position: relative;
      background: linear-gradient(to bottom, #1B4F8C, #2563EB);
      overflow: hidden;
      align-items: center;
      justify-content: center;
    }
    @media(min-width:900px){ .lp { display: flex; } }

    /* Centered logo — 1:1 header design */
    .lp-brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .lp-icon {
      width: 42px; height: 42px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .lp-icon svg { width: 24px; height: 24px; }
    .lp-name {
      font-size: 26px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.6px;
    }
    .lp-name span { color: rgba(255,255,255,0.85); }

    /* ── Right Panel ── */
    .rp {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f0f2f5;
      padding: 40px 32px;
      position: relative;
    }
    .rp::before {
      content: '';
      position: absolute;
      width: 600px; height: 600px;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(27,79,140,0.03) 0%, transparent 70%);
      pointer-events: none;
    }

    .login-wrap {
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 1;
      animation: cardIn 0.8s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 0.1s;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(40px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Gradient border */
    .card-glow {
      padding: 1px;
      border-radius: 28px;
      background: linear-gradient(135deg, rgba(27,79,140,0.12), rgba(245,166,35,0.08), rgba(27,79,140,0.06));
      background-size: 300% 300%;
      animation: glowShift 8s ease infinite;
      box-shadow:
        0 2px 4px rgba(0,0,0,0.02),
        0 8px 24px rgba(0,0,0,0.04),
        0 24px 64px rgba(0,0,0,0.06);
    }
    @keyframes glowShift {
      0%, 100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }

    .form-card {
      background: #ffffff;
      border-radius: 27px;
      padding: 44px 40px 40px;
    }

    /* Mobile logo */
    .mob-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    @media(min-width:900px){ .mob-brand { display: none; } }
    .mob-icon {
      width: 32px; height: 32px;
      background: #1B4F8C;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .mob-icon svg { width: 18px; height: 18px; }
    .mob-name { font-size: 20px; font-weight: 700; color: #1A1A2E; }
    .mob-name span { color: #1B4F8C; }

    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px 6px 10px;
      border-radius: 100px;
      background: #f0f4ff;
      border: 1px solid rgba(27,79,140,0.06);
      margin-bottom: 32px;
    }
    .badge-dot {
      width: 18px; height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1B4F8C, #2563eb);
      display: flex; align-items: center; justify-content: center;
    }
    .badge-dot svg { width: 10px; height: 10px; color: #fff; }
    .badge-text {
      font-size: 11px;
      font-weight: 700;
      color: #1B4F8C;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .card-title {
      font-size: 32px;
      font-weight: 800;
      color: #0a0a0f;
      letter-spacing: -1px;
      margin-bottom: 8px;
      line-height: 1.1;
    }
    .card-sub {
      font-size: 14px;
      color: #7c818a;
      margin-bottom: 36px;
      line-height: 1.6;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 3px solid #D64045;
      border-radius: 14px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #991b1b;
      font-weight: 500;
    }

    .field-group { margin-bottom: 20px; }
    .field-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #4a5060;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute;
      left: 16px; top: 50%;
      transform: translateY(-50%);
      color: #b0b8c1;
      pointer-events: none;
      transition: color 0.25s;
    }
    .field-input {
      width: 100%;
      padding: 15px 18px 15px 46px;
      border: 1.5px solid #e4e7ec;
      border-radius: 14px;
      font-size: 15px;
      font-family: inherit;
      color: #0a0a0f;
      background: #fafbfc;
      outline: none;
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    .field-input:focus {
      border-color: #1B4F8C;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,140,0.06), 0 1px 4px rgba(27,79,140,0.08);
    }
    .field-input:focus ~ .input-icon { color: #1B4F8C; }
    .field-input::placeholder { color: #c0c5ce; }
    .totp-input {
      letter-spacing: 0.5em;
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      padding: 16px 18px;
      font-variant-numeric: tabular-nums;
    }

    .submit-btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #F5A623 0%, #d4901a 100%);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 8px;
      box-shadow:
        0 1px 2px rgba(212,144,26,0.3),
        0 4px 12px rgba(245,166,35,0.2),
        0 8px 24px rgba(245,166,35,0.15);
      letter-spacing: 0.3px;
      position: relative;
      overflow: hidden;
    }
    .submit-btn::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      transition: left 0.5s ease;
    }
    .submit-btn:hover::before { left: 100%; }
    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow:
        0 2px 4px rgba(212,144,26,0.3),
        0 8px 24px rgba(245,166,35,0.3),
        0 16px 48px rgba(245,166,35,0.2);
    }
    .submit-btn:active { transform: translateY(0); }
    .submit-btn .arrow-icon { transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); }
    .submit-btn:hover .arrow-icon { transform: translateX(4px); }

    /* Footer */
    .sec-footer {
      margin-top: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
    .sec-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #a0a5b0;
      font-weight: 500;
    }
    .sec-item svg { flex-shrink: 0; opacity: 0.6; }
    .pulse-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #1A6B3A;
      position: relative;
      flex-shrink: 0;
    }
    .pulse-dot::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: rgba(26,107,58,0.15);
      animation: pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.8); opacity: 0; }
    }
    .sec-sep {
      width: 3px; height: 3px;
      border-radius: 50%;
      background: #d5d8de;
    }
  </style>
</head>
<body>

<!-- ── Left Panel — 1:1 header style ── -->
<div class="lp">
  <div class="lp-brand">
    <div class="lp-icon"><svg viewBox="0 0 18 18" fill="none"><rect x="6.5" y="1" width="5" height="16" rx="1.5" fill="#FFC942"/><rect x="1" y="6.5" width="16" height="5" rx="1.5" fill="#FFC942"/></svg></div>
    <div class="lp-name">Smart<span>Fin</span>Pro</div>
  </div>
</div>

<!-- ── Right Panel ── -->
<div class="rp">
  <div class="login-wrap">

    <div class="mob-brand">
      <div class="mob-icon"><svg viewBox="0 0 18 18" fill="none"><rect x="6.5" y="1" width="5" height="16" rx="1.5" fill="#FFC942"/><rect x="1" y="6.5" width="16" height="5" rx="1.5" fill="#FFC942"/></svg></div>
      <div class="mob-name">Smart<span>Fin</span>Pro</div>
    </div>

    <div class="card-glow">
      <div class="form-card">

        <div class="badge">
          <div class="badge-dot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span class="badge-text">Secure Access</span>
        </div>

        <h1 class="card-title">Welcome back</h1>
        <p class="card-sub">${totpEnabled ? 'Enter your credentials and authenticator code to continue.' : 'Enter your credentials to continue.'}</p>

        ${errorBanner}

        <form method="POST" action="${redirectPath}" autocomplete="on">
          <input type="hidden" name="redirect" value="${redirectPath}">

          <div class="field-group">
            <label class="field-label">Password</label>
            <div class="input-wrap">
              <input type="password" name="secret" placeholder="Enter your password" required
                autocomplete="current-password" autofocus class="field-input">
              <div class="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            </div>
          </div>

          ${totpField}

          <button type="submit" class="submit-btn">
            Sign In
            <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </form>
      </div>
    </div>

    <div class="sec-footer">
      <div class="sec-item">
        <div class="pulse-dot"></div>
        Online
      </div>
      <div class="sec-sep"></div>
      <div class="sec-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        ${totpEnabled ? '2FA' : 'Encrypted'}
      </div>
    </div>
  </div>
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
