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

  // Delete the auth cookie by setting maxAge=0
  response.cookies.set('sfp-dash-auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/dashboard',
  });

  return response;
}
