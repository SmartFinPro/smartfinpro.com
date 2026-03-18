// app/api/dashboard/logout/route.ts
import { NextResponse } from 'next/server';

/**
 * GET /api/dashboard/logout
 * Clears the sfp-dash-auth cookie and redirects to the dashboard login page.
 */
export async function GET() {
  const response = NextResponse.redirect(
    new URL('/dashboard', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smartfinpro.com'),
  );

  // Delete the auth cookie by setting maxAge=0.
  // domain MUST match the domain used when setting the cookie (smartfinpro.com),
  // otherwise the browser ignores the deletion and the user stays logged in.
  response.cookies.set('sfp-dash-auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/dashboard',
    domain: process.env.NODE_ENV === 'production' ? 'smartfinpro.com' : undefined,
  });

  return response;
}
