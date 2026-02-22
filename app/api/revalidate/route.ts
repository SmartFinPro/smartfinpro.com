import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * On-Demand ISR Revalidation Endpoint
 * ────────────────────────────────────
 * Invalidates the Next.js cache for a specific slug so the page
 * is re-rendered on the next request — without a full rebuild.
 *
 * Usage:
 *   POST /api/revalidate
 *   Headers: Authorization: Bearer $CRON_SECRET
 *   Body:    { "slug": "/uk/trading/etoro-review" }
 *
 *   GET /api/revalidate?secret=$CRON_SECRET&slug=/uk/trading/etoro-review
 *
 * Called by:
 *   - deploy.sh --boost <slug>
 *   - boostAndDeploy() server action (internal fetch)
 */

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return false;
  }

  // Check Bearer token (POST)
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) return true;

  // Check query param (GET — for curl/deploy.sh usage)
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret === cronSecret) return true;

  return false;
}

// ── POST handler (preferred — from server actions) ───────────

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const slug = body.slug as string | undefined;

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required field: slug' },
        { status: 400 },
      );
    }

    // Revalidate the specific page path
    revalidatePath(slug);

    // Also revalidate the sitemap so lastmod picks up the new date
    revalidatePath('/sitemap.xml');

    console.log(`[revalidate] Successfully revalidated: ${slug}`);

    return NextResponse.json({
      revalidated: true,
      slug,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[revalidate] Error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 },
    );
  }
}

// ── GET handler (for curl / deploy.sh --boost) ──────────────

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing required query param: slug' },
      { status: 400 },
    );
  }

  try {
    revalidatePath(slug);
    revalidatePath('/sitemap.xml');

    console.log(`[revalidate] Successfully revalidated (GET): ${slug}`);

    return NextResponse.json({
      revalidated: true,
      slug,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[revalidate] Error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 },
    );
  }
}
