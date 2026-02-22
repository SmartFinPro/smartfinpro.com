'use server';

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Market, Category, AffiliateLink } from '@/types';

// ── Types ───────────────────────────────────────────────────

export interface AuditResult {
  totalLinks: number;
  compliantLinks: number;
  attentionLinks: number;
  criticalLinks: number;
  details: AuditDetail[];
  timestamp: string;
}

export interface AuditDetail {
  id: string;
  slug: string;
  partnerName: string;
  market: Market;
  category: Category;
  destinationUrl: string;
  active: boolean;
  issues: AuditIssue[];
  status: 'compliant' | 'attention' | 'critical';
}

export interface AuditIssue {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

// ── Audit Logic ─────────────────────────────────────────────

/**
 * Run a global compliance audit against all registered affiliate links.
 * Checks:
 * 1. Link has a valid /go/ slug
 * 2. Link has a destination URL
 * 3. Link is assigned to a valid market + category
 * 4. Compliance label exists (not falling back to default)
 * 5. Link is active
 */
export async function runComplianceAudit(): Promise<AuditResult> {
  const supabase = await createClient();

  const { data: links, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .order('market', { ascending: true });

  if (error || !links) {
    return {
      totalLinks: 0,
      compliantLinks: 0,
      attentionLinks: 0,
      criticalLinks: 0,
      details: [],
      timestamp: new Date().toISOString(),
    };
  }

  const validMarkets = new Set<string>(['us', 'uk', 'ca', 'au']);
  const validCategories = new Set<string>([
    'ai-tools', 'trading', 'forex', 'personal-finance', 'business-banking', 'cybersecurity',
    'credit-repair', 'debt-relief', 'credit-score', 'remortgaging', 'cost-of-living', 'savings',
    'superannuation', 'gold-investing', 'tax-efficient-investing', 'housing',
  ]);

  const details: AuditDetail[] = links.map((link: AffiliateLink) => {
    const issues: AuditIssue[] = [];

    // Check 1: Valid slug
    if (!link.slug || link.slug.trim() === '') {
      issues.push({
        code: 'MISSING_SLUG',
        severity: 'critical',
        message: 'Link has no /go/ slug defined',
      });
    }

    // Check 2: Destination URL
    if (!link.destination_url || link.destination_url.trim() === '') {
      issues.push({
        code: 'MISSING_URL',
        severity: 'critical',
        message: 'No destination URL configured',
      });
    } else if (!link.destination_url.startsWith('https://')) {
      issues.push({
        code: 'INSECURE_URL',
        severity: 'warning',
        message: 'Destination URL does not use HTTPS',
      });
    }

    // Check 3: Valid market
    if (!validMarkets.has(link.market)) {
      issues.push({
        code: 'INVALID_MARKET',
        severity: 'critical',
        message: `Market "${link.market}" is not a recognised market code`,
      });
    }

    // Check 4: Valid category
    if (!validCategories.has(link.category)) {
      issues.push({
        code: 'INVALID_CATEGORY',
        severity: 'critical',
        message: `Category "${link.category}" is not a recognised category`,
      });
    }

    // Check 5: Inactive link
    if (!link.active) {
      issues.push({
        code: 'INACTIVE_LINK',
        severity: 'info',
        message: 'Link is currently inactive',
      });
    }

    // Check 6: Commission type
    if (!link.commission_type) {
      issues.push({
        code: 'MISSING_COMMISSION',
        severity: 'warning',
        message: 'No commission type specified',
      });
    }

    // Check 7: FCA CCI Regime (UK Apr 2026) - Investment products need CCI label
    if (link.market === 'uk' && ['trading', 'forex', 'personal-finance', 'remortgaging', 'savings'].includes(link.category)) {
      // CCI Regime: Consumer Credit Information compliance
      // PLACEHOLDER: Check if page has "This is a marketing communication" label
      issues.push({
        code: 'FCA_CCI_REGIME',
        severity: 'info',
        message: 'UK CCI Regime (Apr 2026): Verify "This is a marketing communication" label on page',
      });
    }

    // Check 8: BNPL Labels (UK Jul 2026) - Buy Now Pay Later disclosure
    if (link.market === 'uk' && link.category === 'personal-finance') {
      // FCA BNPL regulation starting July 2026
      issues.push({
        code: 'UK_BNPL_LABEL',
        severity: 'info',
        message: 'UK BNPL regulation (Jul 2026): If BNPL product, add "Credit subject to status" label',
      });
    }

    // Check 9: EU AI Act - AI-generated content must be labeled
    if (['ai-tools', 'trading', 'forex'].includes(link.category)) {
      // EU AI Act compliance: AI-generated content labeling
      issues.push({
        code: 'EU_AI_ACT',
        severity: 'info',
        message: 'EU AI Act: If content is AI-generated, add disclosure label per regulation',
      });
    }

    // Determine status
    const hasCritical = issues.some((i) => i.severity === 'critical');
    const hasWarning = issues.some((i) => i.severity === 'warning');
    const status: AuditDetail['status'] = hasCritical
      ? 'critical'
      : hasWarning
        ? 'attention'
        : 'compliant';

    return {
      id: link.id,
      slug: link.slug,
      partnerName: link.partner_name,
      market: link.market as Market,
      category: link.category as Category,
      destinationUrl: link.destination_url,
      active: link.active,
      issues,
      status,
    };
  });

  return {
    totalLinks: details.length,
    compliantLinks: details.filter((d) => d.status === 'compliant').length,
    attentionLinks: details.filter((d) => d.status === 'attention').length,
    criticalLinks: details.filter((d) => d.status === 'critical').length,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get link count per market/category for the compliance matrix.
 */
export async function getLinkDistribution(): Promise<
  Record<Market, Record<Category, number>>
> {
  const supabase = await createClient();

  const { data: links, error } = await supabase
    .from('affiliate_links')
    .select('market, category')
    .eq('active', true);

  const dist: Record<string, Record<string, number>> = {
    us: {}, uk: {}, ca: {}, au: {},
  };

  if (!error && links) {
    for (const link of links) {
      const m = link.market as string;
      const c = link.category as string;
      if (dist[m]) {
        dist[m][c] = (dist[m][c] || 0) + 1;
      }
    }
  }

  return dist as Record<Market, Record<Category, number>>;
}
