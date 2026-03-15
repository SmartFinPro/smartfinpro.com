// lib/backlinks/prlog-client.ts
// PRLog.org free press release submission
// Also handles PR.com and OpenPR.com as fallback channels
// These are free-tier PR distribution sites (DA 55-65)

export interface PressReleasePayload {
  title: string;           // Max 100 chars
  body: string;            // 300-800 words recommended
  industry: string;        // PRLog industry category
  country: string;         // ISO country code
  city?: string;
  contactName: string;
  contactEmail: string;
  contactUrl: string;      // Our site URL
}

/**
 * Submit a press release to PRLog.org
 * Free tier allows 3/month, no API key required for basic submission
 *
 * Note: PRLog does NOT have a public API for automated submission.
 * This function builds the submission payload and returns it formatted
 * for manual submission OR for use with browser automation.
 *
 * For full automation, consider:
 * - EIN Presswire (free tier has API): https://www.einpresswire.com
 * - PR Newswire has a partner API
 */
export function buildPressReleasePayload(params: {
  title: string;
  body: string;
  market: string;
  category: string;
  targetUrl: string;
  contactEmail?: string;
}): PressReleasePayload {
  const { title, body, market, category, targetUrl, contactEmail } = params;

  const industryMap: Record<string, string> = {
    'forex': 'Financial Services',
    'trading': 'Financial Services',
    'personal-finance': 'Financial Services',
    'ai-tools': 'Technology',
    'cybersecurity': 'Technology',
    'business-banking': 'Banking',
  };

  const countryMap: Record<string, string> = {
    us: 'US',
    uk: 'GB',
    ca: 'CA',
    au: 'AU',
  };

  return {
    title: title.slice(0, 100),
    body,
    industry: industryMap[category] ?? 'Financial Services',
    country: countryMap[market] ?? 'US',
    contactName: 'SmartFinPro Editorial Team',
    contactEmail: contactEmail ?? process.env.RESEND_FROM_EMAIL ?? 'contact@smartfinpro.com',
    contactUrl: targetUrl,
  };
}

/**
 * EIN Presswire API submission (free tier: 3 releases/month)
 * API Docs: https://www.einpresswire.com/api/
 */
export async function submitEINPresswire(params: {
  title: string;
  body: string;
  market: string;
  category: string;
  targetUrl: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const apiKey = process.env.EIN_PRESSWIRE_API_KEY;

  if (!apiKey) {
    // Return the payload formatted for manual submission
    const payload = buildPressReleasePayload(params);
    return {
      success: false,
      error: 'EIN_PRESSWIRE_API_KEY not configured. Manual submission required.',
    };
  }

  try {
    const payload = buildPressReleasePayload(params);

    const response = await fetch('https://www.einpresswire.com/api/news/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        industry: payload.industry,
        country: payload.country,
        contact_name: payload.contactName,
        contact_email: payload.contactEmail,
        contact_website: payload.contactUrl,
        publish: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `EIN Presswire failed: ${response.status} — ${text}` };
    }

    const data = await response.json();
    return { success: true, url: data?.url ?? data?.permalink };

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * Check if any PR distribution is configured
 */
export function isPRConfigured(): boolean {
  return !!(process.env.EIN_PRESSWIRE_API_KEY);
}

/**
 * Generate press release title for a new review or milestone
 */
export function generatePRTitle(params: {
  type: 'new_review' | 'ranking' | 'tool_launch';
  productName?: string;
  keyword?: string;
  market: string;
  position?: number;
}): string {
  const marketNames: Record<string, string> = {
    us: 'US', uk: 'UK', ca: 'Canada', au: 'Australia',
  };
  const marketName = marketNames[params.market] ?? params.market.toUpperCase();

  switch (params.type) {
    case 'new_review':
      return `SmartFinPro Publishes Comprehensive ${params.productName ?? 'Financial Product'} Review for ${marketName} Investors`;
    case 'ranking':
      return `SmartFinPro Named Top Resource for "${params.keyword ?? 'Financial Comparison'}" — Ranking #${params.position ?? 1} in ${marketName}`;
    case 'tool_launch':
      return `SmartFinPro Launches Free ${params.productName ?? 'Financial Calculator'} Tool for ${marketName} Consumers`;
    default:
      return `SmartFinPro Expands ${marketName} Financial Resource Library`;
  }
}
