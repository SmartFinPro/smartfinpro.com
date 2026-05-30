'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import type { Market, Category, AffiliateLink } from '@/types';
import {
  runContentComplianceCheck,
  type ContentComplianceResult,
} from '@/lib/actions/compliance-content';

// ── Types ───────────────────────────────────────────────────

export interface ContentScanSummary {
  scanned: number;
  compliant: number;
  violations: number;
  generatedAt: string;
  // Only the non-compliant pages — keeps the persisted payload small.
  missing: ContentComplianceResult[];
}

export interface AuditResult {
  totalLinks: number;
  compliantLinks: number;
  attentionLinks: number;
  criticalLinks: number;
  details: AuditDetail[];
  contentScan: ContentScanSummary;
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

export interface LatestAuditRun {
  ranAt: string;
  triggeredBy: string;
  totalLinks: number;
  verified: number;
  warnings: number;
  critical: number;
  details: AuditDetail[];
  contentScan: ContentScanSummary | null;
}

function isMissingAuditRunsTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(
    error && (
      error.code === '42P01' ||
      error.code === 'PGRST204' ||
      error.message?.includes('does not exist') ||
      error.message?.includes('schema cache')
    ),
  );
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
  const supabase = createServiceClient();

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
      contentScan: {
        scanned: 0,
        compliant: 0,
        violations: 0,
        generatedAt: new Date().toISOString(),
        missing: [],
      },
      timestamp: new Date().toISOString(),
    };
  }

  const validMarkets = new Set<string>(['us', 'uk', 'ca', 'au']);
  const validCategories = new Set<string>([
    'ai-tools', 'trading', 'forex', 'personal-finance', 'business-banking', 'cybersecurity',
    'credit-repair', 'debt-relief', 'credit-score', 'remortgaging', 'cost-of-living', 'savings',
    'superannuation', 'gold-investing', 'tax-efficient-investing', 'housing',
  ]);

  // ── Real MDX content disclosure scan (FCA/ASIC/CIRO/SEC) ──────────────
  // Awaited ONCE here (reads MDX from disk). Findings are indexed by
  // market+category so they can be merged into matching links cheaply.
  const contentReport = await runContentComplianceCheck();
  const contentViolations = contentReport.results.filter((r) => !r.compliant);

  // Index missing-disclosure pages by `${market}/${category}` for O(1) lookup.
  const contentByMarketCategory = new Map<string, ContentComplianceResult[]>();
  for (const page of contentViolations) {
    const key = `${page.market}/${page.category}`;
    const bucket = contentByMarketCategory.get(key);
    if (bucket) bucket.push(page);
    else contentByMarketCategory.set(key, [page]);
  }

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

    // Check 7: Real regulatory disclosure scan (FCA/ASIC/CIRO/SEC).
    // No longer faked — driven by the actual MDX content scan above.
    // If any page in this link's market+category is missing a mandatory
    // regulator disclosure, surface it as a warning on this link.
    const offendingPages = contentByMarketCategory.get(`${link.market}/${link.category}`) ?? [];
    if (offendingPages.length > 0) {
      const regulators = Array.from(
        new Set(offendingPages.flatMap((p) => p.issues.map((i) => i.regulator))),
      ).join(', ');
      issues.push({
        code: 'CONTENT_DISCLOSURE_MISSING',
        severity: 'warning',
        message: `${offendingPages.length} ${link.market.toUpperCase()}/${link.category} page(s) missing required ${regulators} disclosure`,
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
    contentScan: {
      scanned: contentReport.scanned,
      compliant: contentReport.compliant,
      violations: contentReport.violations,
      generatedAt: contentReport.generatedAt,
      missing: contentViolations,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get link count per market/category for the compliance matrix.
 */
export async function getLinkDistribution(): Promise<
  Record<Market, Record<Category, number>>
> {
  const supabase = createServiceClient();

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

export async function saveAuditRun(
  result: AuditResult,
  triggeredBy: 'manual' | 'cron',
  durationMs: number,
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('compliance_audit_runs')
    .insert({
      ran_at: result.timestamp,
      triggered_by: triggeredBy,
      total_links: result.totalLinks,
      compliant_count: result.compliantLinks,
      attention_count: result.attentionLinks,
      critical_count: result.criticalLinks,
      // No dedicated column for the content scan → persist inside details jsonb.
      // Stored as a structured object; getLatestAuditRun() reads it back
      // tolerantly (still accepts the legacy bare-array shape).
      details: {
        links: result.details,
        contentScan: result.contentScan,
      },
      duration_ms: durationMs,
    });

  if (error) {
    if (isMissingAuditRunsTable(error)) {
      return;
    }
    throw new Error(`Failed to persist compliance audit: ${error.message}`);
  }
}

export async function getLatestAuditRun(): Promise<LatestAuditRun | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('compliance_audit_runs')
    .select('*')
    .order('ran_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingAuditRunsTable(error)) {
      return null;
    }
    throw new Error(`Failed to load latest compliance audit: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // `details` may be the legacy bare AuditDetail[] OR the new
  // { links, contentScan } object. Normalise both shapes.
  const rawDetails = data.details;
  let details: AuditDetail[] = [];
  let contentScan: ContentScanSummary | null = null;

  if (Array.isArray(rawDetails)) {
    details = rawDetails as AuditDetail[];
  } else if (rawDetails && typeof rawDetails === 'object') {
    const obj = rawDetails as { links?: unknown; contentScan?: unknown };
    details = (obj.links ?? []) as AuditDetail[];
    contentScan = (obj.contentScan ?? null) as ContentScanSummary | null;
  }

  return {
    ranAt: data.ran_at,
    triggeredBy: data.triggered_by,
    totalLinks: data.total_links,
    verified: data.compliant_count,
    warnings: data.attention_count,
    critical: data.critical_count,
    details,
    contentScan,
  };
}
