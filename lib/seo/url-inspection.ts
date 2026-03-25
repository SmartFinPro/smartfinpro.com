/**
 * Google URL Inspection API Integration
 * ──────────────────────────────────────
 * Check whether submitted URLs are actually indexed by Google.
 * Uses Service Account authentication (same credentials as GSC).
 *
 * Env vars (must be set on Cloudways / .env.local):
 *   GSC_CLIENT_EMAIL  – service account email
 *   GSC_PRIVATE_KEY   – PEM-encoded RSA private key
 *   GSC_SITE_URL      – site URL in GSC (e.g. "https://smartfinpro.com")
 *
 * API: POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect
 * Rate limits: ~600/min, 2000/day
 */

'use server';

import 'server-only';

// ── Types ───────────────────────────────────────────────────

export interface InspectionResult {
  url: string;
  status: 'indexed' | 'not_indexed';
  coverageState: string;
  verdict: string;
}

export interface BatchInspectionResult {
  total: number;
  indexed: number;
  notIndexed: number;
  checked: number;
  results: InspectionResult[];
}

// ── JWT Token Generation (webmasters.readonly scope) ────────

async function createInspectionJWT(): Promise<string> {
  const email = process.env.GSC_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GSC_PRIVATE_KEY;

  if (!email || !privateKeyRaw) {
    throw new Error('GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY must be configured');
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
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

  return `${signingInput}.${signature}`;
}

async function getInspectionAccessToken(): Promise<string> {
  const jwt = await createInspectionJWT();

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`URL Inspection API token exchange failed: ${res.status} — ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Core API Functions ──────────────────────────────────────

/**
 * Inspect a single URL using the URL Inspection API.
 */
export async function inspectUrl(
  url: string,
  token: string
): Promise<InspectionResult> {
  const siteUrl = process.env.GSC_SITE_URL || 'https://smartfinpro.com';

  try {
    const res = await fetch(
      'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error?.message || `HTTP ${res.status}`;
      // Rethrow quota errors so batch can handle them
      if (res.status === 429 || msg.includes('Quota')) {
        throw new Error(`Quota exceeded: ${msg}`);
      }
      return {
        url,
        status: 'not_indexed',
        coverageState: 'ERROR',
        verdict: msg,
      };
    }

    const data = await res.json();
    const indexStatus = data.inspectionResult?.indexStatusResult;
    const verdict = indexStatus?.verdict || 'UNKNOWN';
    const coverageState = indexStatus?.coverageState || 'UNKNOWN';

    return {
      url,
      status: verdict === 'PASS' ? 'indexed' : 'not_indexed',
      coverageState,
      verdict,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Quota')) {
      throw err; // Let batch handler deal with quota
    }
    return {
      url,
      status: 'not_indexed',
      coverageState: 'ERROR',
      verdict: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Inspect multiple URLs in batch.
 * Gets one token and reuses it. Stops early on quota exhaustion.
 */
export async function inspectBatchUrls(
  urls: string[],
  limit?: number
): Promise<BatchInspectionResult> {
  const batch = limit ? urls.slice(0, limit) : urls;
  const results: InspectionResult[] = [];

  let token: string;
  try {
    token = await getInspectionAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Token fetch failed';
    return {
      total: batch.length,
      indexed: 0,
      notIndexed: 0,
      checked: 0,
      results: batch.map((url) => ({
        url,
        status: 'not_indexed' as const,
        coverageState: 'ERROR',
        verdict: msg,
      })),
    };
  }

  let consecutiveQuotaErrors = 0;

  for (const url of batch) {
    try {
      const result = await inspectUrl(url, token);
      results.push(result);
      consecutiveQuotaErrors = 0;
    } catch (err) {
      // Quota exceeded — stop early
      if (err instanceof Error && err.message.startsWith('Quota')) {
        consecutiveQuotaErrors++;
        if (consecutiveQuotaErrors >= 2) {
          break;
        }
      }
      results.push({
        url,
        status: 'not_indexed',
        coverageState: 'ERROR',
        verdict: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    // 100ms delay between requests (rate limit: ~600/min)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    total: batch.length,
    indexed: results.filter((r) => r.status === 'indexed').length,
    notIndexed: results.filter((r) => r.status === 'not_indexed').length,
    checked: results.length,
    results,
  };
}

/**
 * Check if URL Inspection API is configured (same creds as GSC).
 */
export async function isInspectionApiConfigured(): Promise<boolean> {
  return !!(
    process.env.GSC_CLIENT_EMAIL &&
    process.env.GSC_PRIVATE_KEY &&
    process.env.GSC_SITE_URL
  );
}
