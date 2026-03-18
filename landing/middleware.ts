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
  // New silo categories (US-specific clean URLs)
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Dashboard Auth Gate ──────────────────────────────────────
  // Protects /dashboard/* with DASHBOARD_SECRET cookie check.
  // Login via /dashboard/login or ?auth=<DASHBOARD_SECRET> on any dashboard page.
  if (pathname.startsWith('/dashboard')) {
    const dashSecret = process.env.DASHBOARD_SECRET;

    // If no DASHBOARD_SECRET configured, block all dashboard access in production
    if (!dashSecret && process.env.NODE_ENV === 'production') {
      return new NextResponse('Dashboard disabled — DASHBOARD_SECRET not configured', { status: 503 });
    }

    // In production, require valid auth cookie
    if (dashSecret) {
      const authCookie = request.cookies.get('sfp-dash-auth')?.value;

      // Allow login via query param: /dashboard?auth=<secret>
      const authParam = request.nextUrl.searchParams.get('auth');
      if (authParam === dashSecret) {
        // Set auth cookie and redirect to clean URL (strip ?auth param)
        const cleanUrl = new URL(pathname, request.url);
        const response = NextResponse.redirect(cleanUrl);
        response.cookies.set('sfp-dash-auth', dashSecret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/dashboard',
        });
        return response;
      }

      // Check existing auth cookie
      if (authCookie !== dashSecret) {
        return new NextResponse(
          '<html><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;background:#0f0a1a;color:#fff"><div style="text-align:center"><h1>🔒 Dashboard Access Required</h1><p style="color:#94a3b8">Append <code style="background:#1e293b;padding:2px 8px;border-radius:4px">?auth=YOUR_SECRET</code> to the URL</p></div></div></html>',
          {
            // 200 instead of 401 to avoid Cloudways/Nginx auth error interception loops.
            status: 200,
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache',
            },
          }
        );
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

  // ── Step 3: Skip homepage ──
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return NextResponse.next();
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

  // ── Step 6: US clean URLs → rewrite category/reviews to /us/... ──
  if (CATEGORIES.has(firstSegment) || firstSegment === 'reviews') {
    return NextResponse.rewrite(new URL(`/us${pathname}`, request.url));
  }

  // ── Step 7: Everything else → allow through to exact match ──
  return NextResponse.next();
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
