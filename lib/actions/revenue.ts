'use server';

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
