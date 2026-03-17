'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';

// ============================================================
// Low-Performance Warning System
// Identifies pages with high clicks but zero conversions
// ============================================================

export interface LowPerformancePage {
  page_path: string;
  article_slug: string | null;
  page_title: string | null;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  last_click_at: string | null;
  severity: 'warning' | 'critical';
  recommendation: string;
}

export interface PerformanceAlertStats {
  totalLowPerformancePages: number;
  criticalPages: number;
  warningPages: number;
  potentialLostRevenue: number;
}

interface LinkClickRecord {
  link_id: string;
  affiliate_links: {
    slug: string;
    partner_name: string;
    category: string | null;
  } | null;
}

interface PageViewRecord {
  page_path: string;
  article_slug: string | null;
  page_title: string | null;
}

interface ConversionRecord {
  link_id: string;
}

/**
 * Get all pages with low conversion performance
 * Threshold: >100 clicks but 0 conversions = warning
 * Threshold: >500 clicks but 0 conversions = critical
 */
export async function getLowPerformancePages(): Promise<LowPerformancePage[]> {
  const supabase = createServiceClient();

  // Safe query helper — returns [] if table doesn't exist (pre-migration)
  const safe = <T>(result: { data: T[] | null; error: { code?: string; message?: string } | null }): T[] => {
    if (result.error?.code === 'PGRST204' || result.error?.message?.includes('schema cache')) return [];
    if (result.error) console.warn('[performance-alerts] Query warning:', result.error.message);
    return result.data || [];
  };

  // Get clicks per affiliate link
  const clicksResult = await supabase
    .from('link_clicks')
    .select(`
      link_id,
      affiliate_links (
        slug,
        partner_name,
        category
      )
    `)
    .not('link_id', 'is', null);

  // Get conversions per link
  const conversionsResult = await supabase
    .from('conversions')
    .select('link_id')
    .not('link_id', 'is', null);

  // Get page views with article info
  const pageViewsResult = await supabase
    .from('page_views')
    .select('page_path, article_slug, page_title')
    .not('article_slug', 'is', null);

  const typedClicks = safe(clicksResult) as unknown as LinkClickRecord[];
  const typedConversions = safe(conversionsResult) as unknown as ConversionRecord[];
  const typedPageViews = safe(pageViewsResult) as unknown as PageViewRecord[];

  // Aggregate clicks per link
  const clicksPerLink = new Map<string, {
    count: number;
    slug: string;
    partner_name: string;
    category: string | null;
  }>();

  typedClicks.forEach((click) => {
    if (click.link_id && click.affiliate_links) {
      const existing = clicksPerLink.get(click.link_id);
      if (existing) {
        existing.count++;
      } else {
        clicksPerLink.set(click.link_id, {
          count: 1,
          slug: click.affiliate_links.slug,
          partner_name: click.affiliate_links.partner_name,
          category: click.affiliate_links.category,
        });
      }
    }
  });

  // Aggregate conversions per link
  const conversionsPerLink = new Map<string, number>();
  typedConversions.forEach((conv) => {
    if (conv.link_id) {
      conversionsPerLink.set(conv.link_id, (conversionsPerLink.get(conv.link_id) || 0) + 1);
    }
  });

  // Find page info by slug
  const pageInfoBySlug = new Map<string, { page_path: string; page_title: string | null }>();
  typedPageViews.forEach((pv) => {
    if (pv.article_slug && !pageInfoBySlug.has(pv.article_slug)) {
      pageInfoBySlug.set(pv.article_slug, {
        page_path: pv.page_path,
        page_title: pv.page_title,
      });
    }
  });

  // Identify low-performance pages
  const lowPerformancePages: LowPerformancePage[] = [];

  clicksPerLink.forEach((data, linkId) => {
    const conversionCount = conversionsPerLink.get(linkId) || 0;
    const clickCount = data.count;

    // Only flag if clicks > 100 and conversions = 0
    if (clickCount >= 100 && conversionCount === 0) {
      const pageInfo = pageInfoBySlug.get(data.slug);
      const severity: 'warning' | 'critical' = clickCount >= 500 ? 'critical' : 'warning';

      lowPerformancePages.push({
        page_path: pageInfo?.page_path || `/go/${data.slug}`,
        article_slug: data.slug,
        page_title: pageInfo?.page_title || data.partner_name,
        total_clicks: clickCount,
        total_conversions: conversionCount,
        conversion_rate: 0,
        last_click_at: null,
        severity,
        recommendation: getRecommendation(clickCount, data.category),
      });
    }
  });

  // Sort by clicks descending (most urgent first)
  return lowPerformancePages.sort((a, b) => b.total_clicks - a.total_clicks);
}

/**
 * Get performance alert statistics
 */
export async function getPerformanceAlertStats(): Promise<PerformanceAlertStats> {
  const pages = await getLowPerformancePages();

  const criticalPages = pages.filter((p) => p.severity === 'critical').length;
  const warningPages = pages.filter((p) => p.severity === 'warning').length;

  // Estimate lost revenue based on industry average conversion rate of 2-3%
  // If we had 2% conversion rate on these clicks, what would we have earned?
  const avgCommission = 50; // Average commission per conversion
  const expectedConversionRate = 0.02; // 2%
  const totalMissedClicks = pages.reduce((sum, p) => sum + p.total_clicks, 0);
  const potentialLostRevenue = Math.round(totalMissedClicks * expectedConversionRate * avgCommission);

  return {
    totalLowPerformancePages: pages.length,
    criticalPages,
    warningPages,
    potentialLostRevenue,
  };
}

/**
 * Get category-specific recommendations
 */
function getRecommendation(clicks: number, category: string | null): string {
  const recommendations: Record<string, string[]> = {
    'ai-tools': [
      'Add a video demo or animated GIF showing the tool in action',
      'Include more specific ROI calculations for finance teams',
      'Add comparison with free alternatives to address objections',
    ],
    'cybersecurity': [
      'Emphasize compliance benefits (SOC 2, GDPR, etc.)',
      'Add case study from similar company size',
      'Include security breach statistics to create urgency',
    ],
    'trading': [
      'Add more trust signals (regulation, insurance)',
      'Show actual screenshot of platform interface',
      'Include risk disclaimer more prominently (builds trust)',
    ],
    'personal-finance': [
      'Add APR comparison table at top of page',
      'Include "soft pull" messaging to reduce friction',
      'Show approval odds/pre-qualification option',
    ],
    'business-banking': [
      'Emphasize time savings and ease of setup',
      'Add integration list (Xero, QuickBooks, etc.)',
      'Include fee comparison vs. traditional banks',
    ],
  };

  const categoryRecs = recommendations[category || ''] || [
    'Review CTA placement and copy',
    'Add more social proof (testimonials, user count)',
    'Check mobile experience for friction points',
  ];

  // Pick recommendation based on click level
  if (clicks >= 500) {
    return `URGENT: ${categoryRecs[0]}. Consider A/B testing CTA buttons.`;
  }
  return categoryRecs[Math.floor(Math.random() * categoryRecs.length)];
}

/**
 * Check if there are any critical alerts that need attention
 */
export async function hasCriticalAlerts(): Promise<boolean> {
  const stats = await getPerformanceAlertStats();
  return stats.criticalPages > 0;
}
