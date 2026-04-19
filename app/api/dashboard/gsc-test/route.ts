import { NextRequest, NextResponse } from 'next/server';
import { isGSCConfigured, getTopKeywords } from '@/lib/seo/google-search-console';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';

/**
 * GET /api/dashboard/gsc-test
 *
 * Tests the Google Search Console connection.
 * Returns config status and a test query if credentials are present.
 *
 * Auth: requires sfp-dash-auth session cookie (HMAC token) or DASHBOARD_SECRET bearer.
 *
 * Usage from browser: fetch('/api/dashboard/gsc-test')
 * Usage from curl:    curl -H "Authorization: Bearer <DASHBOARD_SECRET>" https://smartfinpro.com/api/dashboard/gsc-test
 */
export async function GET(request: NextRequest) {
  // ── Auth check (reads DASHBOARD_SECRET from env) ──────────────
  const dashSecret = process.env.DASHBOARD_SECRET;
  const authCookie = request.cookies.get('sfp-dash-auth')?.value;

  // Also accept Bearer token for programmatic access
  const bearerToken = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '');

  const isAuthed =
    isValidDashboardSessionValue(authCookie, dashSecret) ||
    compareSecret(bearerToken, dashSecret);

  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── GSC config check ──────────────────────────────────────────
  const configured = isGSCConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      error: 'GSC not configured',
      setup: {
        required_env_vars: [
          {
            name: 'GSC_CLIENT_EMAIL',
            description: 'Service account email from Google Cloud Console',
            example: 'smartfinpro-gsc@your-project.iam.gserviceaccount.com',
          },
          {
            name: 'GSC_PRIVATE_KEY',
            description: 'RSA private key (PEM format, \\n escaped)',
            example: '-----BEGIN RSA PRIVATE KEY-----\\nMIIE...\\n-----END RSA PRIVATE KEY-----',
          },
          {
            name: 'GSC_SITE_URL',
            description: 'The GSC property URL (exact match)',
            example: 'https://smartfinpro.com',
          },
        ],
        instructions: [
          '1. Go to Google Cloud Console → IAM & Admin → Service Accounts',
          '2. Create a service account (or use existing) → create key (JSON)',
          '3. Copy client_email → GSC_CLIENT_EMAIL',
          '4. Copy private_key (paste with \\n) → GSC_PRIVATE_KEY',
          '5. In Google Search Console → Settings → Users → Add user (your service account email, Full access)',
          '6. Set GSC_SITE_URL to your exact GSC property (e.g. https://smartfinpro.com)',
          '7. Set all 3 vars in Cloudways env → restart PM2 → re-run this endpoint',
        ],
      },
    });
  }

  // ── Live connection test ──────────────────────────────────────
  try {
    // Fetch the top keyword (lightweight test query)
    const keywords = await getTopKeywords({ limit: 1, market: 'us' });
    return NextResponse.json({
      configured: true,
      status: 'connected',
      siteUrl: process.env.GSC_SITE_URL,
      testQuery: {
        success: true,
        rowsFetched: keywords.length,
        sample: keywords[0] ?? null,
      },
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      status: 'error',
      siteUrl: process.env.GSC_SITE_URL,
      error: err instanceof Error ? err.message : 'Unknown GSC error',
      hint: 'Check that the service account has "Full" access in GSC and the private key is formatted correctly (\\n not \\\\n).',
    });
  }
}
