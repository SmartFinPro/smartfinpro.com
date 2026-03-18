// app/api/dashboard/logout/route.ts
import { NextResponse } from 'next/server';

// Cookie domain — derived from site URL, not NODE_ENV (VPS runs as development)
const COOKIE_DOMAIN = (() => {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').hostname;
    return host.includes('localhost') || host.includes('127.0.0.1') ? undefined : host.replace(/^www\./, '');
  } catch { return undefined; }
})();

/**
 * GET /api/dashboard/logout
 * Clears the sfp-dash-auth cookie and redirects to the dashboard login page.
 */
export async function GET() {
  const response = NextResponse.redirect(
    new URL('/dashboard', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smartfinpro.com'),
  );

  // Delete the auth cookie by setting maxAge=0.
  // domain MUST match the domain used when setting the cookie,
  // otherwise the browser ignores the deletion and the user stays logged in.
  response.cookies.set('sfp-dash-auth', '', {
    httpOnly: true,
    secure: !!COOKIE_DOMAIN,
    sameSite: 'lax',
    maxAge: 0,
    path: '/dashboard',
    domain: COOKIE_DOMAIN,
  });

  return response;
}
