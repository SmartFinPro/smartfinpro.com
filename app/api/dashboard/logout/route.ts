// app/api/dashboard/logout/route.ts
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/dashboard/logout
 * Clears the sfp-dash-auth cookie and redirects to the dashboard login page.
 */
export async function GET(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim().toLowerCase()
    || new URL(request.url).protocol.replace(':', '').toLowerCase();
  const hostname = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const cookieSecure = !isLocal && proto === 'https';

  const response = NextResponse.redirect(
    new URL('/dashboard', request.url),
  );

  // Delete the auth cookie by setting maxAge=0.
  // path and domain MUST exactly match how the cookie was set in proxy.ts,
  // otherwise the browser ignores the deletion and the user stays logged in.
  // proxy.ts sets: path='/', no domain attribute → same here.
  response.cookies.set('sfp-dash-auth', '', {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
