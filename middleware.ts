import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Markets and categories must match lib/i18n/config.ts
const markets = ['us', 'uk', 'ca', 'au'];
const categories = [
  'ai-tools',
  'cybersecurity',
  'trading',
  'forex',
  'personal-finance',
  'business-banking',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, api routes, dashboard, and other system paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/go/') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.') // Static files like .ico, .png, etc.
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);

  // No segments = homepage, skip
  if (segments.length === 0) {
    return NextResponse.next();
  }

  const firstSegment = segments[0];

  // If first segment is a market, let it through
  if (markets.includes(firstSegment)) {
    return NextResponse.next();
  }

  // If first segment is a category or a known sub-section, rewrite to /us/...
  if (categories.includes(firstSegment) || firstSegment === 'reviews') {
    const newPath = `/us${pathname}`;
    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  // For all other paths, let them through (contact, about, etc.)
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
