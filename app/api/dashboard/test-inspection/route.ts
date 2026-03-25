// app/api/dashboard/test-inspection/route.ts
// Diagnostic endpoint: tests URL Inspection API with 1 URL and returns raw response.
// Use this to verify GSC credentials and API connectivity.
// Protected by proxy.ts API auth gate (JSON 401 if unauthenticated).
//
// Usage: GET /api/dashboard/test-inspection
//        GET /api/dashboard/test-inspection?url=https://smartfinpro.com/us/trading/...

import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_TEST_URL = 'https://smartfinpro.com/';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const testUrl = searchParams.get('url') || DEFAULT_TEST_URL;

  // ── Step 1: Check env configuration ─────────────────────────
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GSC_PRIVATE_KEY;
  const siteUrl = process.env.GSC_SITE_URL;

  const configured = !!(clientEmail && privateKeyRaw && siteUrl);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      tokenOk: false,
      url: testUrl,
      rawVerdict: null,
      rawCoverageState: null,
      status: 'error',
      error: `Missing env vars: ${[
        !clientEmail && 'GSC_CLIENT_EMAIL',
        !privateKeyRaw && 'GSC_PRIVATE_KEY',
        !siteUrl && 'GSC_SITE_URL',
      ].filter(Boolean).join(', ')}`,
    });
  }

  // ── Step 2: Get access token ─────────────────────────────────
  let token: string;
  try {
    const privateKey = privateKeyRaw!.replace(/\\n/g, '\n');
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    const enc = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    const signingInput = `${enc(header)}.${enc(payload)}`;

    const { createSign } = await import('crypto');
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    sign.end();
    const signature = sign.sign(privateKey, 'base64url');
    const jwt = `${signingInput}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return NextResponse.json({
        configured: true,
        tokenOk: false,
        url: testUrl,
        rawVerdict: null,
        rawCoverageState: null,
        status: 'error',
        error: `Token exchange failed (${tokenRes.status}): ${text}`,
      });
    }

    const tokenData = await tokenRes.json();
    token = tokenData.access_token as string;
  } catch (err) {
    return NextResponse.json({
      configured: true,
      tokenOk: false,
      url: testUrl,
      rawVerdict: null,
      rawCoverageState: null,
      status: 'error',
      error: err instanceof Error ? err.message : 'Token fetch failed',
    });
  }

  // ── Step 3: Call URL Inspection API ─────────────────────────
  try {
    const inspectRes = await fetch(
      'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionUrl: testUrl,
          siteUrl,
        }),
      }
    );

    if (!inspectRes.ok) {
      const data = await inspectRes.json().catch(() => ({}));
      const msg = data.error?.message || `HTTP ${inspectRes.status}`;
      return NextResponse.json({
        configured: true,
        tokenOk: true,
        url: testUrl,
        siteUrl,
        rawVerdict: null,
        rawCoverageState: null,
        rawResponse: data,
        status: 'error',
        error: `Inspection API error: ${msg}`,
      });
    }

    const data = await inspectRes.json();
    const indexStatus = data.inspectionResult?.indexStatusResult;
    const rawVerdict = indexStatus?.verdict ?? 'UNKNOWN';
    const rawCoverageState = indexStatus?.coverageState ?? 'UNKNOWN';

    return NextResponse.json({
      configured: true,
      tokenOk: true,
      url: testUrl,
      siteUrl,
      rawVerdict,
      rawCoverageState,
      rawResponse: data.inspectionResult,
      status: rawVerdict === 'PASS' ? 'indexed' : 'not_indexed',
      error: null,
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      tokenOk: true,
      url: testUrl,
      siteUrl,
      rawVerdict: null,
      rawCoverageState: null,
      rawResponse: null,
      status: 'error',
      error: err instanceof Error ? err.message : 'Inspection API call failed',
    });
  }
}
