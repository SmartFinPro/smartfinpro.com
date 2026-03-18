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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      align-items: stretch;
      overflow: hidden;
    }

    /* ── Left Panel ── */
    .left-panel {
      display: none;
      width: 52%;
      position: relative;
      background: linear-gradient(145deg, #1B4F8C 0%, #0d2d52 50%, #071828 100%);
      overflow: hidden;
      padding: 60px 56px;
      flex-direction: column;
      justify-content: space-between;
    }
    @media(min-width:900px){ .left-panel { display: flex; } }

    /* Animated mesh gradient */
    .left-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 20% 20%, rgba(245,166,35,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 80% at 80% 80%, rgba(27,79,140,0.3) 0%, transparent 60%);
      animation: meshPulse 8s ease-in-out infinite alternate;
    }
    @keyframes meshPulse {
      from { opacity: 0.6; transform: scale(1); }
      to   { opacity: 1;   transform: scale(1.05); }
    }

    /* Grid pattern overlay */
    .left-panel::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 48px 48px;
    }

    .brand { position: relative; z-index: 2; }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 64px;
    }
    .brand-icon {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #F5A623, #D48B1A);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px; color: #fff;
      box-shadow: 0 4px 24px rgba(245,166,35,0.4);
    }
    .brand-name { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
    .brand-name span { color: #F5A623; }

    .hero-headline {
      font-size: 42px;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -1px;
      color: #fff;
      margin-bottom: 20px;
    }
    .hero-headline em { font-style: normal; color: #F5A623; }
    .hero-sub {
      font-size: 16px;
      color: rgba(255,255,255,0.55);
      line-height: 1.6;
      max-width: 340px;
    }

    .stats-row {
      display: flex;
      gap: 32px;
      position: relative;
      z-index: 2;
    }
    .stat { }
    .stat-value { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .stat-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-divider { width: 1px; background: rgba(255,255,255,0.1); }

    .hero-content { position: relative; z-index: 2; }

    /* ── Right Panel ── */
    .right-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 40px 32px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Mobile logo */
    .mobile-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 40px;
    }
    @media(min-width:900px){ .mobile-brand { display: none; } }
    .mobile-brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #F5A623, #D48B1A);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 15px; color: #fff;
    }
    .mobile-brand-name { font-size: 18px; font-weight: 700; color: #1A1A2E; }
    .mobile-brand-name span { color: #1B4F8C; }

    .card-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #EEF4FF;
      color: #1B4F8C;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 5px 12px;
      border-radius: 100px;
      margin-bottom: 24px;
    }
    .card-badge svg { color: #1B4F8C; }

    .card-title {
      font-size: 28px;
      font-weight: 700;
      color: #0d1117;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .card-sub {
      font-size: 14px;
      color: #6e7681;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff0f0;
      border: 1px solid #fecaca;
      border-left: 3px solid #D64045;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #991b1b;
      font-weight: 500;
    }

    .field-group { margin-bottom: 16px; }
    .field-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #444d56;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .field-label svg { color: #1B4F8C; }
    .field-input {
      width: 100%;
      padding: 13px 16px;
      border: 1.5px solid #e1e4e8;
      border-radius: 12px;
      font-size: 15px;
      font-family: inherit;
      color: #0d1117;
      background: #f6f8fa;
      outline: none;
      transition: all 0.2s;
    }
    .field-input:focus {
      border-color: #1B4F8C;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,140,0.08);
    }
    .field-input::placeholder { color: #adb5bd; }
    .totp-input {
      letter-spacing: 0.4em;
      text-align: center;
      font-size: 22px;
      font-weight: 600;
      padding: 14px 16px;
    }

    .submit-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #F5A623 0%, #D48B1A 100%);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      box-shadow: 0 4px 16px rgba(245,166,35,0.35);
      letter-spacing: 0.2px;
    }
    .submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(245,166,35,0.5);
    }
    .submit-btn:active { transform: translateY(0); }
    .submit-btn svg { transition: transform 0.2s; }
    .submit-btn:hover svg { transform: translateX(3px); }

    .footer-note {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 12px;
      color: #adb5bd;
    }
    .footer-note svg { color: #1A6B3A; }

    .divider {
      height: 1px;
      background: #e1e4e8;
      margin: 24px 0;
    }
  </style>
</head>
<body>

<!-- Left Branding Panel -->
<div class="left-panel">
  <div class="brand">
    <div class="brand-logo">
      <div class="brand-icon">SF</div>
      <div class="brand-name">Smart<span>Fin</span>Pro</div>
    </div>
    <div class="hero-content">
      <h1 class="hero-headline">Your Affiliate<br><em>Command Center</em></h1>
      <p class="hero-sub">Real-time analytics, AI-powered content, and revenue intelligence — all in one platform.</p>
    </div>
  </div>
  <div class="stats-row">
    <div class="stat">
      <div class="stat-value">200+</div>
      <div class="stat-label">Live Routes</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat">
      <div class="stat-value">108+</div>
      <div class="stat-label">MDX Reviews</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat">
      <div class="stat-value">4</div>
      <div class="stat-label">Markets</div>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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

    <div class="divider"></div>

    <div class="footer-note">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      ${totpEnabled ? 'Protected by password + TOTP 2FA' : 'Access is logged and monitored'}
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
