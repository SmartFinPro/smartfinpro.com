/**
 * Google Search Console API Integration
 * ─────────────────────────────────────
 * Uses a Service Account (GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY) to fetch
 * search analytics data from the GSC Performance Report API.
 *
 * Env vars (must be set on Cloudways / .env.local):
 *   GSC_CLIENT_EMAIL  – service-account email
 *   GSC_PRIVATE_KEY   – PEM-encoded RSA private key (paste with \n)
 *   GSC_SITE_URL      – property in GSC (e.g. "https://smartfinpro.com")
 */

// ── Types ────────────────────────────────────────────────────

export interface GSCRow {
  keys: string[]; // [query, page, country, device] depending on dimensions
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCResponse {
  rows: GSCRow[];
  responseAggregationType?: string;
}

export interface KeywordData {
  keyword: string;
  page: string;
  market: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PositionTrend {
  date: string;
  position: number;
  clicks: number;
  impressions: number;
}

// ── JWT Token Generation ────────────────────────────────────

async function createJWT(): Promise<string> {
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
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
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

async function getAccessToken(): Promise<string> {
  const jwt = await createJWT();

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
    throw new Error(`GSC token exchange failed: ${res.status} — ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Country code → Market mapping ───────────────────────────

const COUNTRY_TO_MARKET: Record<string, string> = {
  usa: 'us',
  gbr: 'uk',
  can: 'ca',
  aus: 'au',
};

export function countryToMarket(country: string): string {
  return COUNTRY_TO_MARKET[country.toLowerCase()] || country.toLowerCase();
}

// ── Core API Calls ──────────────────────────────────────────

const GSC_API = 'https://www.googleapis.com/webmasters/v3';

/**
 * Query GSC Search Analytics.
 * Returns raw rows with the requested dimensions.
 */
export async function querySearchAnalytics(params: {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions: ('query' | 'page' | 'country' | 'device' | 'date')[];
  rowLimit?: number;
  startRow?: number;
  dimensionFilterGroups?: Array<{
    filters: Array<{
      dimension: string;
      operator: 'contains' | 'equals' | 'notContains' | 'notEquals' | 'includingRegex' | 'excludingRegex';
      expression: string;
    }>;
  }>;
}): Promise<GSCRow[]> {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) {
    console.warn('[GSC] GSC_SITE_URL not configured — returning empty data');
    return [];
  }

  try {
    const token = await getAccessToken();
    const encodedSite = encodeURIComponent(siteUrl);

    const res = await fetch(
      `${GSC_API}/sites/${encodedSite}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: params.dimensions,
          rowLimit: params.rowLimit || 1000,
          startRow: params.startRow || 0,
          ...(params.dimensionFilterGroups && {
            dimensionFilterGroups: params.dimensionFilterGroups,
          }),
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[GSC] API error:', res.status, text);
      return [];
    }

    const data: GSCResponse = await res.json();
    return data.rows || [];
  } catch (err) {
    console.error('[GSC] Query failed:', err);
    return [];
  }
}

/**
 * Fetch top keywords with position & clicks, grouped by market.
 */
export async function getTopKeywords(options?: {
  days?: number;
  limit?: number;
  market?: string;
}): Promise<KeywordData[]> {
  const days = options?.days || 7;
  const limit = options?.limit || 100;

  const end = new Date();
  // GSC data has ~3 day lag
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const filterGroups = options?.market
    ? [
        {
          filters: [
            {
              dimension: 'country' as const,
              operator: 'equals' as const,
              expression: marketToCountry(options.market),
            },
          ],
        },
      ]
    : undefined;

  const rows = await querySearchAnalytics({
    startDate: fmt(start),
    endDate: fmt(end),
    dimensions: ['query', 'page', 'country'],
    rowLimit: limit,
    dimensionFilterGroups: filterGroups,
  });

  return rows.map((row) => ({
    keyword: row.keys[0],
    page: row.keys[1],
    market: countryToMarket(row.keys[2]),
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: Math.round(row.ctr * 10000) / 100, // e.g. 0.043 → 4.3
    position: Math.round(row.position * 10) / 10, // 1 decimal
  }));
}

/**
 * Get daily position trend for a specific keyword.
 */
export async function getKeywordTrend(
  keyword: string,
  days: number = 30,
): Promise<PositionTrend[]> {
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC data lag
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const rows = await querySearchAnalytics({
    startDate: fmt(start),
    endDate: fmt(end),
    dimensions: ['date'],
    dimensionFilterGroups: [
      {
        filters: [
          {
            dimension: 'query',
            operator: 'equals',
            expression: keyword,
          },
        ],
      },
    ],
    rowLimit: days,
  });

  return rows
    .map((row) => ({
      date: row.keys[0],
      position: Math.round(row.position * 10) / 10,
      clicks: row.clicks,
      impressions: row.impressions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Detect winners (position improved) and losers (position dropped)
 * by comparing current vs. previous period.
 */
export async function getWinnersAndLosers(days: number = 7): Promise<{
  winners: KeywordData[];
  losers: KeywordData[];
}> {
  const end = new Date();
  end.setDate(end.getDate() - 3);

  // Current period
  const currentStart = new Date(end);
  currentStart.setDate(currentStart.getDate() - days);

  // Previous period
  const prevEnd = new Date(currentStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const [currentRows, prevRows] = await Promise.all([
    querySearchAnalytics({
      startDate: fmt(currentStart),
      endDate: fmt(end),
      dimensions: ['query', 'page', 'country'],
      rowLimit: 500,
    }),
    querySearchAnalytics({
      startDate: fmt(prevStart),
      endDate: fmt(prevEnd),
      dimensions: ['query', 'page', 'country'],
      rowLimit: 500,
    }),
  ]);

  // Build lookup from previous period
  const prevMap = new Map<string, GSCRow>();
  for (const row of prevRows) {
    prevMap.set(row.keys[0], row); // key = query
  }

  type KeywordWithDelta = KeywordData & { positionDelta: number };
  const deltas: KeywordWithDelta[] = [];

  for (const row of currentRows) {
    const query = row.keys[0];
    const prev = prevMap.get(query);
    if (!prev) continue; // new keyword — skip

    const delta = prev.position - row.position; // positive = improved
    deltas.push({
      keyword: query,
      page: row.keys[1],
      market: countryToMarket(row.keys[2]),
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 10000) / 100,
      position: Math.round(row.position * 10) / 10,
      positionDelta: Math.round(delta * 10) / 10,
    });
  }

  // Sort: winners = biggest positive delta, losers = biggest negative delta
  deltas.sort((a, b) => b.positionDelta - a.positionDelta);

  return {
    winners: deltas.filter((d) => d.positionDelta > 0).slice(0, 10),
    losers: deltas
      .filter((d) => d.positionDelta < 0)
      .sort((a, b) => a.positionDelta - b.positionDelta)
      .slice(0, 10),
  };
}

// ── Helpers ─────────────────────────────────────────────────

function marketToCountry(market: string): string {
  const map: Record<string, string> = {
    us: 'usa',
    uk: 'gbr',
    ca: 'can',
    au: 'aus',
  };
  return map[market.toLowerCase()] || market;
}

/**
 * Check if GSC credentials are configured.
 */
export function isGSCConfigured(): boolean {
  return !!(
    process.env.GSC_CLIENT_EMAIL &&
    process.env.GSC_PRIVATE_KEY &&
    process.env.GSC_SITE_URL
  );
}
