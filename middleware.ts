import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // ── Dashboard Auth Gate ──────────────────────────────────────
    // Protects /dashboard/* with DASHBOARD_SECRET cookie check.
    // Login via POST form — secret never appears in URL or browser history.
    //
    // Dev-Bypass: DASHBOARD_AUTH_DISABLED=true in .env.local
    // → Dashboard ohne Login erreichbar (für lokale Entwicklung).
    // Zum Scharfschalten: Variable entfernen oder auf "false" setzen.
    if (pathname.startsWith('/dashboard')) {
      const dashSecret = process.env.DASHBOARD_SECRET;
      const authDisabled =
        process.env.NODE_ENV !== 'production' &&
        process.env.DASHBOARD_AUTH_DISABLED === 'true';

      // Dev-Bypass: Auth deaktiviert (nur in Dev — ignoriert in Production)
      if (authDisabled) {
        return NextResponse.next();
      }

      // If no DASHBOARD_SECRET configured, block all dashboard access in production
      if (!dashSecret && process.env.NODE_ENV === 'production') {
        return new NextResponse('Dashboard disabled — DASHBOARD_SECRET not configured', { status: 503 });
      }

      // Handle POST login submission
      if (dashSecret && request.method === 'POST') {
        try {
          const formData = await request.formData();
          const submitted = formData.get('secret')?.toString() || '';
          if (submitted === dashSecret) {
            const target = formData.get('redirect')?.toString() || '/dashboard';
            // Prevent open redirect — only allow /dashboard/* paths
            const safePath = target.startsWith('/dashboard') ? target : '/dashboard';
            const response = NextResponse.redirect(new URL(safePath, request.url));
            response.cookies.set('sfp-dash-auth', dashSecret, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: '/dashboard',
            });
            return response;
          }
        } catch {
          // Malformed form data — fall through to login page with error
        }
        // Wrong secret — show login again (POST with bad credentials)
        return dashboardLoginPage(pathname, true);
      }

      // In production, require valid auth cookie for GET requests
      if (dashSecret) {
        const authCookie = request.cookies.get('sfp-dash-auth')?.value;
        if (authCookie !== dashSecret) {
          return dashboardLoginPage(pathname, false);
        }
      }

      return NextResponse.next();
    }

    // ── Step 1: Skip system paths & protected route prefixes ──
    for (const prefix of PROTECTED_PREFIXES) {
      if (pathname.startsWith(prefix)) {
        return NextResponse.next();
      }
    }

    // ── Step 2: Skip static files (images, fonts, etc.) ──
    if (pathname.includes('.')) {
      return NextResponse.next();
    }

    // ── Step 3: Homepage → redirect to /us ──
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return NextResponse.redirect(new URL('/us', request.url), 301);
    }

    const firstSegment = segments[0];

    // ── Step 4: Skip exact protected pages ──
    if (PROTECTED_EXACT.has(pathname) || PROTECTED_EXACT.has(`/${firstSegment}`)) {
      return NextResponse.next();
    }

    // ── Step 5: Valid market prefix → allow through ──
    if (MARKETS.has(firstSegment)) {
      return NextResponse.next();
    }

    // ── Step 6: Legacy US clean URLs → 301 redirect to /us/... ──
    // Old: /credit-score → New: /us/credit-score (SEO-safe permanent redirect)
    if (CATEGORIES.has(firstSegment) || firstSegment === 'reviews') {
      return NextResponse.redirect(new URL(`/us${pathname}`, request.url), 301);
    }

    // ── Step 7: Everything else → allow through to exact match ──
    return NextResponse.next();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown middleware error';
    console.error(`[middleware] fallback to NextResponse.next for pathname="${pathname}":`, msg);
    return NextResponse.next();
  }
}

// ── Dashboard Login Page (inline HTML) ──────────────────────────
function dashboardLoginPage(redirectPath: string, showError: boolean): NextResponse {
  const errorBanner = showError
    ? '<p style="color:#D64045;font-size:13px;margin:0 0 16px;padding:8px 12px;background:rgba(214,64,69,0.08);border-radius:8px">Invalid secret. Please try again.</p>'
    : '';
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard Login — SmartFinPro</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#F2F4F8;color:#1A1A2E}
input:focus{border-color:#1B4F8C;box-shadow:0 0 0 3px rgba(27,79,140,0.12)}button:hover{opacity:0.9}</style>
</head>
<body>
<div style="text-align:center;width:100%;max-width:360px;padding:0 24px">
  <div style="font-size:40px;margin-bottom:16px">&#128274;</div>
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px">Dashboard Access</h1>
  <p style="color:#555;font-size:14px;margin:0 0 24px">Enter your dashboard secret to continue.</p>
  ${errorBanner}
  <form method="POST" action="${redirectPath}">
    <input type="hidden" name="redirect" value="${redirectPath}">
    <input type="password" name="secret" placeholder="Dashboard Secret" required autocomplete="current-password"
      style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:10px;font-size:14px;outline:none;margin-bottom:12px">
    <button type="submit"
      style="width:100%;padding:10px 14px;border:none;border-radius:10px;font-size:14px;font-weight:600;color:#fff;background:#F5A623;cursor:pointer">
      Sign In
    </button>
  </form>
</div>
</body>
</html>`;
  return new NextResponse(html, {
    status: 401,
    headers: { 'Content-Type': 'text/html' },
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
