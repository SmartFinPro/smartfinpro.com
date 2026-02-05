import { NextResponse } from 'next/server';
import { trackClick } from '@/lib/affiliate/tracker';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const destinationUrl = await trackClick(slug);

  if (!destinationUrl) {
    // Redirect to homepage if link not found
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Use 307 Temporary Redirect to preserve SEO
  return NextResponse.redirect(destinationUrl, 307);
}
