import { NextResponse } from 'next/server';
import { trackClick } from '@/lib/affiliate/tracker';
import { resolveLink } from '@/lib/affiliate/link-registry';
import { affiliateRedirectLimiter } from '@/lib/security/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Rate limit: 30 req/min per IP to prevent click fraud
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!affiliateRedirectLimiter.check(ip)) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  const { slug } = await params;

  // Pre-validate via registry cache (fast path)
  const registryLink = await resolveLink(slug);

  // Track the click (logs to Supabase with UTM, geo, subid)
  const destinationUrl = await trackClick(slug);

  if (!destinationUrl) {
    // If tracker fails but registry has the link, use registry fallback
    if (registryLink) {
      return NextResponse.redirect(registryLink.destination_url, 307);
    }
    // Link not found anywhere — redirect to homepage
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Use 307 Temporary Redirect to preserve SEO
  return NextResponse.redirect(destinationUrl, 307);
}
