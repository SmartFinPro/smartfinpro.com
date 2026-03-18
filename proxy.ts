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
          sameSite: 'lax', // consistent with login cookie
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
  <title>SmartFinPro — Command Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #1a1a2e;
      min-height: 100vh;
      display: flex;
      align-items: stretch;
      overflow: hidden;
    }

    /* ── Left Panel ── */
    .left-panel {
      display: none;
      width: 50%;
      position: relative;
      background: linear-gradient(160deg, #1B4F8C 0%, #12396b 40%, #0a2444 100%);
      overflow: hidden;
      padding: 48px 56px;
      flex-direction: column;
      justify-content: space-between;
    }
    @media(min-width:900px){ .left-panel { display: flex; } }

    /* Animated aurora gradient */
    .left-panel::before {
      content: '';
      position: absolute;
      inset: -50%;
      background:
        radial-gradient(ellipse 50% 40% at 30% 20%, rgba(245,166,35,0.15) 0%, transparent 60%),
        radial-gradient(ellipse 40% 50% at 70% 70%, rgba(26,107,58,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 60% 30%, rgba(59,130,246,0.1) 0%, transparent 60%);
      animation: auroraShift 12s ease-in-out infinite alternate;
    }
    @keyframes auroraShift {
      0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
      33%  { transform: translate(5%, -3%) rotate(1deg); opacity: 1; }
      66%  { transform: translate(-3%, 5%) rotate(-1deg); opacity: 0.8; }
      100% { transform: translate(2%, 2%) rotate(0.5deg); opacity: 1; }
    }

    /* Refined grid overlay */
    .left-panel::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 64px 64px;
    }

    /* Floating orb decorations */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      z-index: 1;
      pointer-events: none;
    }
    .orb-1 {
      width: 300px; height: 300px;
      background: rgba(245,166,35,0.08);
      top: -80px; right: -60px;
      animation: orbFloat1 10s ease-in-out infinite alternate;
    }
    .orb-2 {
      width: 200px; height: 200px;
      background: rgba(59,130,246,0.06);
      bottom: 10%; left: -40px;
      animation: orbFloat2 14s ease-in-out infinite alternate;
    }
    .orb-3 {
      width: 160px; height: 160px;
      background: rgba(26,107,58,0.06);
      top: 40%; right: 10%;
      animation: orbFloat3 11s ease-in-out infinite alternate;
    }
    @keyframes orbFloat1 { from { transform: translate(0,0); } to { transform: translate(-30px,40px); } }
    @keyframes orbFloat2 { from { transform: translate(0,0); } to { transform: translate(20px,-30px); } }
    @keyframes orbFloat3 { from { transform: translate(0,0); } to { transform: translate(-20px,20px); } }

    .brand { position: relative; z-index: 2; }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 80px;
    }
    .brand-icon {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #F5A623 0%, #e09520 100%);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px; color: #fff;
      box-shadow: 0 8px 32px rgba(245,166,35,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
    }
    .brand-name { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .brand-name span { color: #F5A623; }

    .hero-content { position: relative; z-index: 2; }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: rgba(245,166,35,0.9);
      margin-bottom: 24px;
    }
    .hero-eyebrow-line {
      width: 32px;
      height: 1.5px;
      background: linear-gradient(90deg, rgba(245,166,35,0.6), transparent);
    }
    .hero-headline {
      font-size: 48px;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -1.5px;
      color: #fff;
      margin-bottom: 24px;
    }
    .hero-headline em {
      font-style: normal;
      background: linear-gradient(135deg, #F5A623, #f7c164);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-sub {
      font-size: 16px;
      color: rgba(255,255,255,0.5);
      line-height: 1.7;
      max-width: 360px;
      font-weight: 400;
    }

    /* Feature pills */
    .feature-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 32px;
      position: relative;
      z-index: 2;
    }
    .feature-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 100px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .feature-pill svg { flex-shrink: 0; opacity: 0.7; }

    /* Stats bar at bottom */
    .stats-bar {
      position: relative;
      z-index: 2;
      display: flex;
      gap: 0;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 0;
      overflow: hidden;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .stat {
      flex: 1;
      padding: 20px 24px;
      text-align: center;
      position: relative;
    }
    .stat + .stat::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 1px;
      background: rgba(255,255,255,0.08);
    }
    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .stat-value span { color: #F5A623; font-weight: 800; }
    .stat-label {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
      margin-top: 6px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ── Right Panel ── */
    .right-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 40px 32px;
      position: relative;
    }

    /* Subtle background pattern on right */
    .right-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 80% 20%, rgba(27,79,140,0.03) 0%, transparent 50%),
        radial-gradient(circle at 20% 80%, rgba(245,166,35,0.02) 0%, transparent 50%);
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 1;
      animation: cardReveal 0.7s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(32px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Glass form card */
    .form-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow:
        0 1px 2px rgba(0,0,0,0.04),
        0 4px 16px rgba(0,0,0,0.04),
        0 16px 48px rgba(0,0,0,0.06);
      padding: 40px 36px;
    }

    /* Mobile logo */
    .mobile-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    @media(min-width:900px){ .mobile-brand { display: none; } }
    .mobile-brand-icon {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #F5A623, #D48B1A);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 16px; color: #fff;
      box-shadow: 0 4px 16px rgba(245,166,35,0.3);
    }
    .mobile-brand-name { font-size: 20px; font-weight: 700; color: #1A1A2E; }
    .mobile-brand-name span { color: #1B4F8C; }

    .card-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: linear-gradient(135deg, #eef4ff, #e8f0fb);
      color: #1B4F8C;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 6px 14px;
      border-radius: 100px;
      margin-bottom: 28px;
      border: 1px solid rgba(27,79,140,0.08);
    }
    .card-badge svg { color: #1B4F8C; }

    .card-title {
      font-size: 30px;
      font-weight: 800;
      color: #0d1117;
      letter-spacing: -0.8px;
      margin-bottom: 8px;
      line-height: 1.1;
    }
    .card-sub {
      font-size: 14px;
      color: #6e7681;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 3px solid #D64045;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #991b1b;
      font-weight: 500;
    }

    .field-group { margin-bottom: 18px; }
    .field-label {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 700;
      color: #444d56;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }
    .field-label svg { color: #1B4F8C; opacity: 0.7; }
    .field-input {
      width: 100%;
      padding: 14px 18px;
      border: 1.5px solid #e1e4e8;
      border-radius: 14px;
      font-size: 15px;
      font-family: inherit;
      color: #0d1117;
      background: #f8fafc;
      outline: none;
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    .field-input:focus {
      border-color: #1B4F8C;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,140,0.06), 0 2px 8px rgba(27,79,140,0.08);
    }
    .field-input::placeholder { color: #b0b8c1; }
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
      background: linear-gradient(135deg, #F5A623 0%, #e09520 100%);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 8px;
      box-shadow: 0 4px 16px rgba(245,166,35,0.25), 0 1px 3px rgba(245,166,35,0.2);
      letter-spacing: 0.3px;
      position: relative;
      overflow: hidden;
    }
    .submit-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .submit-btn:hover::before { opacity: 1; }
    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(245,166,35,0.35), 0 2px 8px rgba(245,166,35,0.25);
    }
    .submit-btn:active { transform: translateY(0); }
    .submit-btn svg { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
    .submit-btn:hover svg { transform: translateX(4px); }

    /* Security indicators below card */
    .security-footer {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    .security-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #9ca3af;
      font-weight: 500;
    }
    .security-item svg { flex-shrink: 0; }
    .security-dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #d1d5db;
    }

    /* Live pulse indicator */
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #1A6B3A;
      position: relative;
      flex-shrink: 0;
    }
    .live-dot::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1.5px solid rgba(26,107,58,0.3);
      animation: livePulse 2s ease-out infinite;
    }
    @keyframes livePulse {
      0%   { transform: scale(1); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
  </style>
</head>
<body>

<!-- Left Branding Panel -->
<div class="left-panel">
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>

  <div class="brand">
    <div class="brand-logo">
      <div class="brand-icon">SF</div>
      <div class="brand-name">Smart<span>Fin</span>Pro</div>
    </div>
    <div class="hero-content">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow-line"></span>
        Enterprise Platform
      </div>
      <h1 class="hero-headline">Your Affiliate<br><em>Command Center</em></h1>
      <p class="hero-sub">Real-time analytics, AI-powered content, and revenue intelligence across 4 global markets.</p>
      <div class="feature-pills">
        <span class="feature-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Real-time Analytics
        </span>
        <span class="feature-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          AI Content Engine
        </span>
        <span class="feature-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          Revenue Intelligence
        </span>
      </div>
    </div>
  </div>

  <div class="stats-bar">
    <div class="stat">
      <div class="stat-value">200<span>+</span></div>
      <div class="stat-label">Live Routes</div>
    </div>
    <div class="stat">
      <div class="stat-value">108<span>+</span></div>
      <div class="stat-label">MDX Reviews</div>
    </div>
    <div class="stat">
      <div class="stat-value">4</div>
      <div class="stat-label">Markets</div>
    </div>
    <div class="stat">
      <div class="stat-value">24<span>/7</span></div>
      <div class="stat-label">Monitoring</div>
    </div>
  </div>
</div>

<!-- Right Form Panel -->
<div class="right-panel">
  <div class="login-card">

    <!-- Mobile brand -->
    <div class="mobile-brand">
      <div class="mobile-brand-icon">SF</div>
      <div class="mobile-brand-name">Smart<span>Fin</span>Pro</div>
    </div>

    <div class="form-container">
      <div class="card-badge">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Secure Access
      </div>

      <h1 class="card-title">Welcome back</h1>
      <p class="card-sub">${totpEnabled ? 'Enter your password and authenticator code to access the dashboard.' : 'Enter your dashboard password to continue.'}</p>

      ${errorBanner}

      <form method="POST" action="${redirectPath}" autocomplete="on">
        <input type="hidden" name="redirect" value="${redirectPath}">

        <div class="field-group">
          <label class="field-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Password
          </label>
          <input type="password" name="secret" placeholder="Enter your password" required
            autocomplete="current-password" autofocus class="field-input">
        </div>

        ${totpField}

        <button type="submit" class="submit-btn">
          Access Dashboard
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </form>
    </div>

    <div class="security-footer">
      <div class="security-item">
        <div class="live-dot"></div>
        System Online
      </div>
      <div class="security-dot"></div>
      <div class="security-item">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        ${totpEnabled ? 'TOTP 2FA' : 'Encrypted'}
      </div>
      <div class="security-dot"></div>
      <div class="security-item">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Monitored
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
