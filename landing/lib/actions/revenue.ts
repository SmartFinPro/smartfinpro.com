'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Internal type for raw Supabase query results (affiliate_links is returned as array from join)
interface ConversionQueryResultRaw {
  id: string;
  link_id: string | null;
  converted_at: string;
  commission_earned: number;
  currency: string;
  network_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  affiliate_links: { slug: string; partner_name: string }[] | null;
}

// Processed type with single affiliate link object
interface ConversionQueryResult {
  id: string;
  link_id: string | null;
  converted_at: string;
  commission_earned: number;
  currency: string;
  network_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  affiliate_links?: {
    slug: string;
    partner_name: string;
  } | null;
}

export interface ConversionRecord {
  id: string;
  link_id: string | null;
  converted_at: string;
  commission_earned: number;
  currency: string;
  network_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  affiliate_link?: {
    slug: string;
    partner_name: string;
  };
}

export interface RevenueStats {
  totalRevenue: number;
  pendingRevenue: number;
  approvedRevenue: number;
  totalConversions: number;
  conversionsByMonth: { month: string; revenue: number; count: number }[];
  recentConversions: ConversionRecord[];
}

// New interfaces for automatic revenue dashboard
export interface RevenueByProduct {
  linkId: string;
  partnerName: string;
  slug: string;
  revenue: number;
  conversions: number;
  clicks: number;
  epc: number;
  conversionRate: number;
  trend: 'up' | 'down' | 'neutral';
  trendChange: number;
}

export interface RevenueByMarket {
  market: 'US' | 'GB' | 'CA' | 'AU';
  marketName: string;
  flag: string;
  currency: string;
  revenue: number;
  revenueLocal: number;
  conversions: number;
  clicks: number;
  epc: number;
  conversionRate: number;
  share: number; // percentage of total revenue
}

export interface EPCTrendData {
  label: string;
  epc: number;
  revenue: number;
  clicks: number;
}

export interface AutoRevenueStats {
  // Summary
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  globalEPC: number;
  globalConversionRate: number;
  // Trends
  revenueTrend: 'up' | 'down' | 'neutral';
  revenueTrendChange: number;
  epcTrend: 'up' | 'down' | 'neutral';
  epcTrendChange: number;
  // Breakdowns
  revenueByProduct: RevenueByProduct[];
  revenueByMarket: RevenueByMarket[];
  epcTrendData: EPCTrendData[];
  // Recent
  recentConversions: ConversionRecord[];
  // Monthly for chart
  conversionsByMonth: { month: string; revenue: number; count: number }[];
}

export interface CSVParseResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

// Get all affiliate links for mapping
export async function getAffiliateLinksForMapping() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('id, slug, partner_name')
    .order('partner_name');

  if (error) throw error;
  return data || [];
}

// Get revenue statistics
export async function getRevenueStats(): Promise<RevenueStats> {
  const supabase = createServiceClient();

  // Get all conversions with link info
  const { data: conversions } = await supabase
    .from('conversions')
    .select(`
      id,
      link_id,
      converted_at,
      commission_earned,
      currency,
      network_reference,
      status,
      affiliate_links (
        slug,
        partner_name
      )
    `)
    .order('converted_at', { ascending: false });

  // Process raw results - Supabase returns affiliate_links as array from join
  const rawConversions = (conversions || []) as unknown as ConversionQueryResultRaw[];
  const allConversions: ConversionQueryResult[] = rawConversions.map((c) => ({
    ...c,
    affiliate_links: c.affiliate_links?.[0] ?? null,
  }));

  // Calculate totals
  const totalRevenue = allConversions
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + (c.commission_earned || 0), 0);

  const pendingRevenue = allConversions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + (c.commission_earned || 0), 0);

  const approvedRevenue = totalRevenue;

  // Group by month
  const monthlyMap = new Map<string, { revenue: number; count: number }>();
  allConversions
    .filter((c) => c.status === 'approved')
    .forEach((c) => {
      const month = c.converted_at.slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(month) || { revenue: 0, count: 0 };
      monthlyMap.set(month, {
        revenue: existing.revenue + (c.commission_earned || 0),
        count: existing.count + 1,
      });
    });

  const conversionsByMonth = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      count: data.count,
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);

  // Recent conversions
  const recentConversions: ConversionRecord[] = allConversions.slice(0, 20).map((c) => ({
    id: c.id,
    link_id: c.link_id,
    converted_at: c.converted_at,
    commission_earned: c.commission_earned,
    currency: c.currency,
    network_reference: c.network_reference,
    status: c.status,
    affiliate_link: c.affiliate_links ? {
      slug: c.affiliate_links.slug,
      partner_name: c.affiliate_links.partner_name,
    } : undefined,
  }));

  return {
    totalRevenue,
    pendingRevenue,
    approvedRevenue,
    totalConversions: allConversions.length,
    conversionsByMonth,
    recentConversions,
  };
}

// Parse and import CSV data
export async function importConversionsFromCSV(
  csvData: string,
  columnMapping: {
    dateColumn: string;
    amountColumn: string;
    referenceColumn?: string;
    statusColumn?: string;
    linkColumn?: string;
  },
  defaultLinkId?: string,
  defaultStatus: 'pending' | 'approved' = 'pending'
): Promise<CSVParseResult> {
  const supabase = createServiceClient();
  const lines = csvData.trim().split('\n');

  if (lines.length < 2) {
    return { success: false, imported: 0, skipped: 0, errors: ['CSV must have at least a header and one data row'] };
  }

  // Parse header
  const header = parseCSVLine(lines[0]);
  const dateIdx = header.findIndex((h) => h.toLowerCase().includes(columnMapping.dateColumn.toLowerCase()));
  const amountIdx = header.findIndex((h) => h.toLowerCase().includes(columnMapping.amountColumn.toLowerCase()));
  const refIdx = columnMapping.referenceColumn
    ? header.findIndex((h) => h.toLowerCase().includes(columnMapping.referenceColumn!.toLowerCase()))
    : -1;
  const statusIdx = columnMapping.statusColumn
    ? header.findIndex((h) => h.toLowerCase().includes(columnMapping.statusColumn!.toLowerCase()))
    : -1;
  const linkIdx = columnMapping.linkColumn
    ? header.findIndex((h) => h.toLowerCase().includes(columnMapping.linkColumn!.toLowerCase()))
    : -1;

  if (dateIdx === -1 || amountIdx === -1) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [`Required columns not found. Looking for: "${columnMapping.dateColumn}" and "${columnMapping.amountColumn}". Found: ${header.join(', ')}`],
    };
  }

  // Get all links for SubID matching
  const { data: links } = await supabase.from('affiliate_links').select('id, slug, partner_name');
  type LinkRecord = { id: string; slug: string; partner_name: string };
  const linkMap = new Map(((links || []) as LinkRecord[]).map((l) => [l.slug.toLowerCase(), l.id]));
  const linkNameMap = new Map(((links || []) as LinkRecord[]).map((l) => [l.partner_name.toLowerCase(), l.id]));

  const errors: string[] = [];
  interface InsertRecord {
    link_id: string | null;
    converted_at: string;
    commission_earned: number;
    currency: string;
    network_reference: string | null;
    status: 'pending' | 'approved' | 'rejected';
    network?: string;
  }
  const recordsToInsert: InsertRecord[] = [];
  let skipped = 0;

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length === 0 || row.every((cell) => !cell.trim())) {
      skipped++;
      continue;
    }

    const dateStr = row[dateIdx]?.trim();
    const amountStr = row[amountIdx]?.trim();
    const reference = refIdx >= 0 ? row[refIdx]?.trim() : null;
    const statusStr = statusIdx >= 0 ? row[statusIdx]?.trim().toLowerCase() : null;
    const linkStr = linkIdx >= 0 ? row[linkIdx]?.trim().toLowerCase() : null;

    // Parse date
    let convertedAt: Date | null = null;
    try {
      convertedAt = parseDate(dateStr);
    } catch {
      errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
      skipped++;
      continue;
    }

    // Parse amount
    const amount = parseAmount(amountStr);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
      skipped++;
      continue;
    }

    // Determine link ID
    let linkId = defaultLinkId || null;
    if (linkStr) {
      linkId = linkMap.get(linkStr) || linkNameMap.get(linkStr) || linkId;
    }

    // Determine status
    let status: 'pending' | 'approved' | 'rejected' = defaultStatus;
    if (statusStr) {
      if (statusStr.includes('approved') || statusStr.includes('paid') || statusStr.includes('confirmed')) {
        status = 'approved';
      } else if (statusStr.includes('reject') || statusStr.includes('cancel') || statusStr.includes('declined')) {
        status = 'rejected';
      } else if (statusStr.includes('pending') || statusStr.includes('processing')) {
        status = 'pending';
      }
    }

    recordsToInsert.push({
      link_id: linkId,
      converted_at: convertedAt.toISOString(),
      commission_earned: amount,
      currency: 'USD',
      network_reference: reference,
      status,
    });
  }

  // Insert records
  if (recordsToInsert.length > 0) {
    const { error } = await supabase.from('conversions').insert(recordsToInsert);
    if (error) {
      return {
        success: false,
        imported: 0,
        skipped: skipped + recordsToInsert.length,
        errors: [...errors, `Database error: ${error.message}`],
      };
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/revenue');

  return {
    success: true,
    imported: recordsToInsert.length,
    skipped,
    errors: errors.slice(0, 10), // Limit error messages
  };
}

// Add single conversion manually
export async function addConversion(data: {
  link_id?: string;
  converted_at: string;
  commission_earned: number;
  currency?: string;
  network_reference?: string;
  status?: 'pending' | 'approved' | 'rejected';
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.from('conversions').insert({
    link_id: data.link_id || null,
    converted_at: data.converted_at,
    commission_earned: data.commission_earned,
    currency: data.currency || 'USD',
    network_reference: data.network_reference || null,
    status: data.status || 'pending',
  });

  if (error) throw error;

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/revenue');
}

// Update conversion status
export async function updateConversionStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('conversions')
    .update({ status })
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/revenue');
}

// Delete conversion
export async function deleteConversion(id: string) {
  const supabase = createServiceClient();

  const { error } = await supabase.from('conversions').delete().eq('id', id);

  if (error) throw error;

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/revenue');
}

// Helper: Parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Helper: Parse various date formats
function parseDate(dateStr: string): Date {
  // Try ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try MM/DD/YYYY
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    return new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
  }

  // Try DD.MM.YYYY
  const euMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (euMatch) {
    return new Date(parseInt(euMatch[3]), parseInt(euMatch[2]) - 1, parseInt(euMatch[1]));
  }

  // Try YYYY-MM-DD
  const dashMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dashMatch) {
    return new Date(parseInt(dashMatch[1]), parseInt(dashMatch[2]) - 1, parseInt(dashMatch[3]));
  }

  throw new Error('Invalid date format');
}

// Helper: Parse amount (handles currency symbols and formats)
function parseAmount(amountStr: string): number {
  // Remove currency symbols and whitespace
  const cleaned = amountStr
    .replace(/[$€£¥]/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '');

  return parseFloat(cleaned);
}

// ============================================================
// AUTOMATIC REVENUE STATS (No manual input needed)
// ============================================================

const marketConfig: Record<'US' | 'GB' | 'CA' | 'AU', {
  name: string;
  flag: string;
  currency: string;
  exchangeRate: number;
}> = {
  US: { name: 'United States', flag: '🇺🇸', currency: 'USD', exchangeRate: 1 },
  GB: { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', exchangeRate: 1.27 },
  CA: { name: 'Canada', flag: '🇨🇦', currency: 'CAD', exchangeRate: 0.74 },
  AU: { name: 'Australia', flag: '🇦🇺', currency: 'AUD', exchangeRate: 0.65 },
};

function getMarketFromCountry(countryCode: string): 'US' | 'GB' | 'CA' | 'AU' | null {
  const mapping: Record<string, 'US' | 'GB' | 'CA' | 'AU'> = {
    US: 'US',
    GB: 'GB',
    UK: 'GB',
    CA: 'CA',
    AU: 'AU',
  };
  return mapping[countryCode] || null;
}

export async function getAutoRevenueStats(): Promise<AutoRevenueStats> {
  const supabase = createServiceClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Fetch all conversions
  const { data: conversionsData } = await supabase
    .from('conversions')
    .select(`
      id,
      link_id,
      converted_at,
      commission_earned,
      currency,
      network_reference,
      status,
      created_at,
      affiliate_links (
        id,
        slug,
        partner_name
      )
    `)
    .eq('status', 'approved')
    .order('converted_at', { ascending: false });

  interface ConversionWithLink {
    id: string;
    link_id: string | null;
    converted_at: string;
    commission_earned: number;
    currency: string;
    network_reference: string | null;
    status: 'approved';
    created_at: string;
    affiliate_links: { id: string; slug: string; partner_name: string }[] | null;
  }

  const conversions = (conversionsData || []) as unknown as ConversionWithLink[];

  // Fetch all clicks with country info
  const { data: clicksData } = await supabase
    .from('link_clicks')
    .select('id, link_id, country_code, clicked_at')
    .gte('clicked_at', sixtyDaysAgo.toISOString());

  interface ClickRecord {
    id: string;
    link_id: string;
    country_code: string | null;
    clicked_at: string;
  }

  const clicks = (clicksData || []) as ClickRecord[];

  // Fetch all affiliate links
  const { data: linksData } = await supabase
    .from('affiliate_links')
    .select('id, slug, partner_name');

  interface LinkRecord {
    id: string;
    slug: string;
    partner_name: string;
  }

  const links = (linksData || []) as LinkRecord[];
  const linksMap = new Map(links.map(l => [l.id, l]));

  // ============================================================
  // Calculate totals
  // ============================================================
  const totalRevenue = conversions.reduce((sum, c) => sum + (c.commission_earned || 0), 0);
  const totalClicks = clicks.filter(c => new Date(c.clicked_at) >= thirtyDaysAgo).length;
  const totalConversions = conversions.length;
  const globalEPC = totalClicks > 0 ? totalRevenue / totalClicks : 0;
  const globalConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  // ============================================================
  // Calculate trends (current 30d vs previous 30d)
  // ============================================================
  const currentPeriodConversions = conversions.filter(c => new Date(c.converted_at) >= thirtyDaysAgo);
  const previousPeriodConversions = conversions.filter(c => {
    const date = new Date(c.converted_at);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  });

  const currentRevenue = currentPeriodConversions.reduce((sum, c) => sum + (c.commission_earned || 0), 0);
  const previousRevenue = previousPeriodConversions.reduce((sum, c) => sum + (c.commission_earned || 0), 0);

  const currentClicks = clicks.filter(c => new Date(c.clicked_at) >= thirtyDaysAgo).length;
  const previousClicks = clicks.filter(c => {
    const date = new Date(c.clicked_at);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  }).length;

  const currentEPC = currentClicks > 0 ? currentRevenue / currentClicks : 0;
  const previousEPC = previousClicks > 0 ? previousRevenue / previousClicks : 0;

  const revenueTrendChange = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;
  const epcTrendChange = previousEPC > 0 ? Math.round(((currentEPC - previousEPC) / previousEPC) * 100) : 0;

  // ============================================================
  // Revenue by Product
  // ============================================================
  const productStats = new Map<string, {
    linkId: string;
    partnerName: string;
    slug: string;
    revenue: number;
    conversions: number;
    clicks: number;
    previousRevenue: number;
  }>();

  // Initialize from links
  links.forEach(link => {
    productStats.set(link.id, {
      linkId: link.id,
      partnerName: link.partner_name,
      slug: link.slug,
      revenue: 0,
      conversions: 0,
      clicks: 0,
      previousRevenue: 0,
    });
  });

  // Add conversions
  conversions.forEach(conv => {
    if (conv.link_id && productStats.has(conv.link_id)) {
      const stats = productStats.get(conv.link_id)!;
      stats.revenue += conv.commission_earned || 0;
      stats.conversions += 1;

      // Track previous period
      if (new Date(conv.converted_at) < thirtyDaysAgo) {
        stats.previousRevenue += conv.commission_earned || 0;
      }
    }
  });

  // Add clicks
  clicks.forEach(click => {
    if (click.link_id && productStats.has(click.link_id)) {
      productStats.get(click.link_id)!.clicks += 1;
    }
  });

  const revenueByProduct: RevenueByProduct[] = Array.from(productStats.values())
    .filter(p => p.revenue > 0 || p.clicks > 0)
    .map(p => {
      const currentRev = p.revenue - p.previousRevenue;
      const trendChange = p.previousRevenue > 0 ? Math.round(((currentRev - p.previousRevenue) / p.previousRevenue) * 100) : 0;
      return {
        linkId: p.linkId,
        partnerName: p.partnerName,
        slug: p.slug,
        revenue: p.revenue,
        conversions: p.conversions,
        clicks: p.clicks,
        epc: p.clicks > 0 ? p.revenue / p.clicks : 0,
        conversionRate: p.clicks > 0 ? (p.conversions / p.clicks) * 100 : 0,
        trend: (trendChange > 0 ? 'up' : trendChange < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
        trendChange: Math.abs(trendChange),
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ============================================================
  // Revenue by Market
  // ============================================================
  const marketStats: Record<'US' | 'GB' | 'CA' | 'AU', {
    revenue: number;
    conversions: number;
    clicks: number;
  }> = {
    US: { revenue: 0, conversions: 0, clicks: 0 },
    GB: { revenue: 0, conversions: 0, clicks: 0 },
    CA: { revenue: 0, conversions: 0, clicks: 0 },
    AU: { revenue: 0, conversions: 0, clicks: 0 },
  };

  // Map link_id to countries from clicks
  const linkToCountries = new Map<string, Set<string>>();
  clicks.forEach(click => {
    if (click.link_id && click.country_code) {
      if (!linkToCountries.has(click.link_id)) {
        linkToCountries.set(click.link_id, new Set());
      }
      linkToCountries.get(click.link_id)!.add(click.country_code);
    }
  });

  // Add clicks by market
  clicks.forEach(click => {
    const market = getMarketFromCountry(click.country_code || '');
    if (market) {
      marketStats[market].clicks += 1;
    }
  });

  // Add conversions by market (infer from link's primary country)
  conversions.forEach(conv => {
    if (conv.link_id) {
      const countries = linkToCountries.get(conv.link_id);
      if (countries && countries.size > 0) {
        for (const country of countries) {
          const market = getMarketFromCountry(country);
          if (market) {
            marketStats[market].revenue += conv.commission_earned || 0;
            marketStats[market].conversions += 1;
            break;
          }
        }
      }
    }
  });

  const totalMarketRevenue = Object.values(marketStats).reduce((sum, m) => sum + m.revenue, 0);

  const revenueByMarket: RevenueByMarket[] = (['US', 'GB', 'CA', 'AU'] as const).map(market => {
    const config = marketConfig[market];
    const stats = marketStats[market];
    return {
      market,
      marketName: config.name,
      flag: config.flag,
      currency: config.currency,
      revenue: stats.revenue,
      revenueLocal: stats.revenue / config.exchangeRate,
      conversions: stats.conversions,
      clicks: stats.clicks,
      epc: stats.clicks > 0 ? stats.revenue / stats.clicks : 0,
      conversionRate: stats.clicks > 0 ? (stats.conversions / stats.clicks) * 100 : 0,
      share: totalMarketRevenue > 0 ? (stats.revenue / totalMarketRevenue) * 100 : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // ============================================================
  // EPC Trend Data (last 7 days)
  // ============================================================
  const epcTrendData: EPCTrendData[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayKey = dayDate.toISOString().slice(0, 10);

    const dayClicks = clicks.filter(c => c.clicked_at.slice(0, 10) === dayKey).length;
    const dayRevenue = conversions
      .filter(c => c.converted_at.slice(0, 10) === dayKey)
      .reduce((sum, c) => sum + (c.commission_earned || 0), 0);
    const dayEPC = dayClicks > 0 ? dayRevenue / dayClicks : 0;

    epcTrendData.push({
      label: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
      epc: parseFloat(dayEPC.toFixed(2)),
      revenue: dayRevenue,
      clicks: dayClicks,
    });
  }

  // ============================================================
  // Monthly data for chart
  // ============================================================
  const monthlyMap = new Map<string, { revenue: number; count: number }>();
  conversions.forEach(c => {
    const month = c.converted_at.slice(0, 7);
    const existing = monthlyMap.get(month) || { revenue: 0, count: 0 };
    monthlyMap.set(month, {
      revenue: existing.revenue + (c.commission_earned || 0),
      count: existing.count + 1,
    });
  });

  const conversionsByMonth = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      count: data.count,
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);

  // ============================================================
  // Recent conversions
  // ============================================================
  const recentConversions: ConversionRecord[] = conversions.slice(0, 10).map(c => {
    const link = c.affiliate_links?.[0];
    return {
      id: c.id,
      link_id: c.link_id,
      converted_at: c.converted_at,
      commission_earned: c.commission_earned,
      currency: c.currency,
      network_reference: c.network_reference,
      status: c.status,
      affiliate_link: link ? {
        slug: link.slug,
        partner_name: link.partner_name,
      } : undefined,
    };
  });

  return {
    totalRevenue,
    totalClicks,
    totalConversions,
    globalEPC: parseFloat(globalEPC.toFixed(2)),
    globalConversionRate: parseFloat(globalConversionRate.toFixed(2)),
    revenueTrend: revenueTrendChange > 0 ? 'up' : revenueTrendChange < 0 ? 'down' : 'neutral',
    revenueTrendChange: Math.abs(revenueTrendChange),
    epcTrend: epcTrendChange > 0 ? 'up' : epcTrendChange < 0 ? 'down' : 'neutral',
    epcTrendChange: Math.abs(epcTrendChange),
    revenueByProduct,
    revenueByMarket,
    epcTrendData,
    recentConversions,
    conversionsByMonth,
  };
}
