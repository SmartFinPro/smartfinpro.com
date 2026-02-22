/**
 * Google Indexing API Integration
 * ────────────────────────────────
 * Submit URLs to Google Indexing API to request immediate indexing.
 * Uses Service Account authentication (same as GSC).
 *
 * Env vars (must be set on Cloudways / .env.local):
 *   GSC_CLIENT_EMAIL  – service account email
 *   GSC_PRIVATE_KEY   – PEM-encoded RSA private key
 *   NEXT_PUBLIC_SITE_URL – base URL (e.g. "https://smartfinpro.com")
 *
 * API Endpoint: https://indexing.googleapis.com/v3/urlNotifications:publish
 * Docs: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */

'use server';

import 'server-only';

// ── Types ───────────────────────────────────────────────────

export interface IndexingResult {
  url: string;
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}

export interface BatchIndexingResult {
  total: number;
  succeeded: number;
  failed: number;
  results: IndexingResult[];
}

// ── JWT Token Generation ────────────────────────────────────

async function createIndexingJWT(): Promise<string> {
  const email = process.env.GSC_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GSC_PRIVATE_KEY;

  if (!email || !privateKeyRaw) {
    throw new Error('GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY must be configured');
  }

  // Replace escaped newlines from env
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const signingInput = `${enc(header)}.${enc(payload)}`;

  // Use Node.js crypto for RSA signing
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');

  return `${signingInput}.${signature}`;
}

async function getIndexingAccessToken(): Promise<string> {
  const jwt = await createIndexingJWT();

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
    throw new Error(`Indexing API token exchange failed: ${res.status} — ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Core API Functions ──────────────────────────────────────

/**
 * Submit a single URL to Google Indexing API.
 * Action: URL_UPDATED (default) or URL_DELETED.
 */
export async function submitUrlForIndexing(
  url: string,
  action: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<IndexingResult> {
  try {
    const token = await getIndexingAccessToken();

    const res = await fetch(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          type: action,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        url,
        status: 'error',
        message: data.error?.message || `HTTP ${res.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      url,
      status: 'success',
      message: `Submitted as ${action}`,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      url,
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Submit multiple URLs to Google Indexing API in batch.
 * Processes requests sequentially to avoid rate limits (200 requests/day/URL).
 */
export async function submitBatchForIndexing(
  urls: string[],
  action: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<BatchIndexingResult> {
  const results: IndexingResult[] = [];

  for (const url of urls) {
    const result = await submitUrlForIndexing(url, action);
    results.push(result);

    // Add delay to avoid rate limiting (max 600 requests/min)
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return {
    total: urls.length,
    succeeded: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error').length,
    results,
  };
}

/**
 * Submit all new silo URLs for indexing.
 * This includes all new category pillar pages and review pages.
 */
export async function submitNewSiloUrlsForIndexing(): Promise<BatchIndexingResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  // All new silo pillar pages from TASKS.md
  const newSiloUrls = [
    // US Credit Repair & Debt Relief
    `${baseUrl}/us/credit-repair`,
    `${baseUrl}/us/debt-relief`,
    `${baseUrl}/us/credit-score`,

    // UK Remortgaging & Cost of Living
    `${baseUrl}/uk/remortgaging`,
    `${baseUrl}/uk/cost-of-living`,
    `${baseUrl}/uk/savings`,

    // AU Superannuation & Gold Investing
    `${baseUrl}/au/superannuation`,
    `${baseUrl}/au/gold-investing`,
    `${baseUrl}/au/savings`,

    // CA Tax-Efficient Investing & Housing
    `${baseUrl}/ca/tax-efficient-investing`,
    `${baseUrl}/ca/housing`,
  ];

  console.log(`[Indexing API] Submitting ${newSiloUrls.length} new silo URLs...`);

  return await submitBatchForIndexing(newSiloUrls);
}

/**
 * Submit URLs from a specific market for indexing.
 */
export async function submitMarketUrlsForIndexing(
  market: 'us' | 'uk' | 'ca' | 'au',
  categories: string[]
): Promise<BatchIndexingResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  const urls = categories.map((cat) => `${baseUrl}/${market}/${cat}`);

  console.log(`[Indexing API] Submitting ${urls.length} URLs for market: ${market}`);

  return await submitBatchForIndexing(urls);
}

/**
 * Check if Indexing API credentials are configured.
 */
export function isIndexingApiConfigured(): boolean {
  return !!(
    process.env.GSC_CLIENT_EMAIL &&
    process.env.GSC_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_SITE_URL
  );
}
