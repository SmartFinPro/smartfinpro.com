// app/api/dashboard/logout/route.ts
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getCookieConfig(request: NextRequest): { domain?: string; secure: boolean } {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const hostHeader = request.headers.get('host');
  const rawHost = (forwardedHost || hostHeader || new URL(request.url).hostname || '').split(',')[0].trim();
  const hostname = rawHost.split(':')[0].toLowerCase();

  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost');

  const domain = isLocal || !hostname ? undefined : hostname.replace(/^www\./, '');
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim().toLowerCase();
  const proto = forwardedProto || new URL(request.url).protocol.replace(':', '').toLowerCase();
  const secure = !isLocal && proto === 'https';

  return { domain, secure };
}

/**
 * GET /api/dashboard/logout
 * Clears the sfp-dash-auth cookie and redirects to the dashboard login page.
 */
export async function GET(request: NextRequest) {
  const { domain: cookieDomain, secure: cookieSecure } = getCookieConfig(request);
  const response = NextResponse.redirect(
    new URL('/dashboard', request.url),
  );

  // Delete the auth cookie by setting maxAge=0.
  // domain MUST match the domain used when setting the cookie,
  // otherwise the browser ignores the deletion and the user stays logged in.
  response.cookies.set('sfp-dash-auth', '', {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/dashboard',
    domain: cookieDomain,
  });

  return response;
}
