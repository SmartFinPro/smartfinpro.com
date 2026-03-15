/**
 * Affiliate Network API Integrations
 *
 * This module handles communication with various affiliate networks:
 * - PartnerStack (Jasper AI, SaaS products)
 * - Awin (UK/EU banking partners)
 * - FinanceAds (US/EU finance products)
 * - Impact (Various)
 */

import { createServiceClient } from '@/lib/supabase/server';

// ============================================================
// Types
// ============================================================

export interface AffiliateTransaction {
  network: string;
  networkReference: string;
  productName: string;
  linkSlug?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  transactionDate: string;
  clickId?: string;
  metadata?: Record<string, unknown>;
}

export interface SyncResult {
  network: string;
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
}

// API Response Types
interface PartnerStackTransaction {
  key?: string;
  id?: string;
  product?: { name?: string };
  commission?: { amount?: number; currency?: string };
  status?: string;
  created_at?: string;
  click_key?: string;
}

interface AwinTransaction {
  id?: number;
  advertiserName?: string;
  advertiserId?: number;
  commissionAmount?: { amount?: string; currency?: string };
  commissionStatus?: string;
  transactionDate?: string;
  clickRef?: string;
}

interface FinanceAdsTransaction {
  conversion_id?: string;
  program_name?: string;
  program_id?: string;
  commission?: string;
  currency?: string;
  status?: string;
  conversion_date?: string;
  click_id?: string;
}

// ============================================================
// PartnerStack Integration (Jasper AI, SaaS)
// ============================================================

export async function syncPartnerStack(): Promise<SyncResult> {
  const apiKey = process.env.PARTNERSTACK_API_KEY;

  const result: SyncResult = {
    network: 'partnerstack',
    success: false,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  if (!apiKey) {
    result.errors.push('PARTNERSTACK_API_KEY not configured');
    return result;
  }

  try {
    // PartnerStack API: Get transactions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await fetch(
      `https://api.partnerstack.com/v1/transactions?created_min=${thirtyDaysAgo.toISOString()}&status=all`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // If API fails, use mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('PartnerStack API failed, using mock data');
        return await processTransactions(getMockPartnerStackTransactions(), result);
      }
      throw new Error(`PartnerStack API error: ${response.status}`);
    }

    const data = await response.json();
    const transactions: AffiliateTransaction[] = ((data.items || []) as PartnerStackTransaction[]).map((t) => ({
      network: 'partnerstack',
      networkReference: t.key || t.id || '',
      productName: t.product?.name || 'Jasper AI',
      linkSlug: mapPartnerStackProduct(t.product?.name),
      amount: t.commission?.amount || 0,
      currency: t.commission?.currency || 'USD',
      status: mapPartnerStackStatus(t.status),
      transactionDate: t.created_at || new Date().toISOString(),
      clickId: t.click_key,
      metadata: { original: t },
    }));

    return await processTransactions(transactions, result);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');

    // Use mock data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock PartnerStack data');
      return await processTransactions(getMockPartnerStackTransactions(), result);
    }

    return result;
  }
}

function mapPartnerStackProduct(productName?: string): string {
  const mapping: Record<string, string> = {
    'Jasper': 'jasper-ai',
    'Jasper AI': 'jasper-ai',
    'Copy.ai': 'copy-ai',
    'Perimeter 81': 'perimeter-81',
  };
  return mapping[productName || ''] || 'jasper-ai';
}

function mapPartnerStackStatus(status?: string): 'pending' | 'approved' | 'rejected' {
  const mapping: Record<string, 'pending' | 'approved' | 'rejected'> = {
    'pending': 'pending',
    'approved': 'approved',
    'paid': 'approved',
    'rejected': 'rejected',
    'reversed': 'rejected',
  };
  return mapping[status?.toLowerCase() || ''] || 'pending';
}

// ============================================================
// Awin Integration (UK/EU Banking)
// ============================================================

export async function syncAwin(): Promise<SyncResult> {
  const apiToken = process.env.AWIN_API_TOKEN;
  const publisherId = process.env.AWIN_PUBLISHER_ID;

  const result: SyncResult = {
    network: 'awin',
    success: false,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  if (!apiToken || !publisherId) {
    result.errors.push('AWIN credentials not configured');
    // Use mock data in development
    if (process.env.NODE_ENV === 'development') {
      return await processTransactions(getMockAwinTransactions(), result);
    }
    return result;
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const response = await fetch(
      `https://api.awin.com/publishers/${publisherId}/transactions/?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        return await processTransactions(getMockAwinTransactions(), result);
      }
      throw new Error(`Awin API error: ${response.status}`);
    }

    const data = await response.json();
    const transactions: AffiliateTransaction[] = ((data || []) as AwinTransaction[]).map((t) => ({
      network: 'awin',
      networkReference: t.id?.toString() || '',
      productName: t.advertiserName || 'Unknown',
      linkSlug: mapAwinAdvertiser(t.advertiserId),
      amount: parseFloat(t.commissionAmount?.amount || '0'),
      currency: t.commissionAmount?.currency || 'GBP',
      status: mapAwinStatus(t.commissionStatus),
      transactionDate: t.transactionDate || new Date().toISOString(),
      clickId: t.clickRef,
      metadata: { original: t },
    }));

    return await processTransactions(transactions, result);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    if (process.env.NODE_ENV === 'development') {
      return await processTransactions(getMockAwinTransactions(), result);
    }
    return result;
  }
}

function mapAwinAdvertiser(advertiserId?: number): string {
  const mapping: Record<number, string> = {
    // Add actual advertiser IDs here
    12345: 'starling-business',
    12346: 'ig-uk',
    12347: 'wise-business',
    12348: 'revolut-business',
  };
  return mapping[advertiserId || 0] || 'unknown';
}

function mapAwinStatus(status?: string): 'pending' | 'approved' | 'rejected' {
  const mapping: Record<string, 'pending' | 'approved' | 'rejected'> = {
    'pending': 'pending',
    'approved': 'approved',
    'declined': 'rejected',
    'rejected': 'rejected',
  };
  return mapping[status?.toLowerCase() || ''] || 'pending';
}

// ============================================================
// FinanceAds Integration (Banking Products)
// ============================================================

export async function syncFinanceAds(): Promise<SyncResult> {
  const apiKey = process.env.FINANCEADS_API_KEY;

  const result: SyncResult = {
    network: 'financeads',
    success: false,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  if (!apiKey) {
    result.errors.push('FINANCEADS_API_KEY not configured');
    if (process.env.NODE_ENV === 'development') {
      return await processTransactions(getMockFinanceAdsTransactions(), result);
    }
    return result;
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await fetch(
      `https://api.financeads.net/v1/conversions?from=${thirtyDaysAgo.toISOString().split('T')[0]}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        return await processTransactions(getMockFinanceAdsTransactions(), result);
      }
      throw new Error(`FinanceAds API error: ${response.status}`);
    }

    const data = await response.json();
    const transactions: AffiliateTransaction[] = ((data.conversions || []) as FinanceAdsTransaction[]).map((t) => ({
      network: 'financeads',
      networkReference: t.conversion_id || '',
      productName: t.program_name || 'Unknown',
      linkSlug: mapFinanceAdsProgram(t.program_id),
      amount: parseFloat(t.commission || '0'),
      currency: t.currency || 'USD',
      status: mapFinanceAdsStatus(t.status),
      transactionDate: t.conversion_date || new Date().toISOString(),
      clickId: t.click_id,
      metadata: { original: t },
    }));

    return await processTransactions(transactions, result);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    if (process.env.NODE_ENV === 'development') {
      return await processTransactions(getMockFinanceAdsTransactions(), result);
    }
    return result;
  }
}

function mapFinanceAdsProgram(programId?: string): string {
  const mapping: Record<string, string> = {
    'mercury': 'mercury',
    'wise': 'wise-business',
    'revolut': 'revolut-business',
    'sofi': 'sofi-personal-loans',
  };
  return mapping[programId?.toLowerCase() || ''] || 'unknown';
}

function mapFinanceAdsStatus(status?: string): 'pending' | 'approved' | 'rejected' {
  const mapping: Record<string, 'pending' | 'approved' | 'rejected'> = {
    'pending': 'pending',
    'confirmed': 'approved',
    'approved': 'approved',
    'paid': 'approved',
    'rejected': 'rejected',
    'cancelled': 'rejected',
  };
  return mapping[status?.toLowerCase() || ''] || 'pending';
}

// ============================================================
// Transaction Processing
// ============================================================

// ── Conversion Status Transition Rules (Fix 1.6) ──────────────────────────
// Valid transitions: pending→approved, pending→rejected, approved→reversed,
// rejected→approved (NEW — with audit trail). reversed→approved is FORBIDDEN.
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:  ['approved', 'rejected'],
  approved: ['reversed'],
  rejected: ['approved'],  // Re-approval after review, requires audit
  reversed: [],            // Terminal state — no further transitions
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Audit Trail Helper (Fix 1.6) ──────────────────────────────────────────
async function insertStatusAudit(
  conversionId: string,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('conversion_status_audit').insert({
    conversion_id: conversionId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: changedBy,
    metadata: metadata || null,
  });
}

async function processTransactions(
  transactions: AffiliateTransaction[],
  result: SyncResult
): Promise<SyncResult> {
  const supabase = createServiceClient();
  result.recordsProcessed = transactions.length;

  // Get all affiliate links for matching
  const { data: links } = await supabase
    .from('affiliate_links')
    .select('id, slug, partner_name');

  const linkMap = new Map(
    (links || []).map((l) => [l.slug.toLowerCase(), l.id])
  );

  for (const tx of transactions) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('conversions')
        .select('id, status, commission_earned')
        .eq('network_reference', tx.networkReference)
        .eq('network', tx.network)
        .single();

      const linkId = tx.linkSlug ? linkMap.get(tx.linkSlug.toLowerCase()) : null;

      if (existing) {
        const statusChanged = existing.status !== tx.status;
        const amountChanged = existing.commission_earned !== tx.amount;

        if (statusChanged || amountChanged) {
          // Fix 1.6: Validate state transition before updating
          if (statusChanged && !isValidTransition(existing.status, tx.status)) {
            result.errors.push(
              `Invalid transition ${existing.status}→${tx.status} for ${tx.networkReference}`
            );
            result.recordsSkipped++;
            continue;
          }

          // Fix 1.6: Write audit trail BEFORE update
          if (statusChanged) {
            await insertStatusAudit(existing.id, existing.status, tx.status, 'sync-revenue', {
              network: tx.network,
              network_reference: tx.networkReference,
              amount_before: existing.commission_earned,
              amount_after: tx.amount,
            });
          }

          // Fix 1.7: Update commission_earned + currency alongside status
          await supabase
            .from('conversions')
            .update({
              status: tx.status,
              commission_earned: tx.amount,
              currency: tx.currency,
              network_status: tx.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          result.recordsUpdated++;
        } else {
          result.recordsSkipped++;
        }
      } else {
        // Insert new conversion
        await supabase.from('conversions').insert({
          link_id: linkId,
          converted_at: tx.transactionDate,
          commission_earned: tx.amount,
          currency: tx.currency,
          network: tx.network,
          network_reference: tx.networkReference,
          network_status: tx.status,
          status: tx.status,
          product_name: tx.productName,
        });
        result.recordsCreated++;
      }
    } catch (error) {
      result.errors.push(`Failed to process ${tx.networkReference}: ${error}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

// ============================================================
// Mock Data for Development
// ============================================================

function getMockPartnerStackTransactions(): AffiliateTransaction[] {
  return [
    {
      network: 'partnerstack',
      networkReference: `ps_${Date.now()}_1`,
      productName: 'Jasper AI',
      linkSlug: 'jasper-ai',
      amount: 49.00,
      currency: 'USD',
      status: 'approved',
      transactionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      network: 'partnerstack',
      networkReference: `ps_${Date.now()}_2`,
      productName: 'Jasper AI',
      linkSlug: 'jasper-ai',
      amount: 125.00,
      currency: 'USD',
      status: 'pending',
      transactionDate: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

function getMockAwinTransactions(): AffiliateTransaction[] {
  return [
    {
      network: 'awin',
      networkReference: `aw_${Date.now()}_1`,
      productName: 'Starling Business',
      linkSlug: 'starling-business',
      amount: 75.00,
      currency: 'GBP',
      status: 'approved',
      transactionDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      network: 'awin',
      networkReference: `aw_${Date.now()}_2`,
      productName: 'Revolut Business',
      linkSlug: 'revolut-business',
      amount: 50.00,
      currency: 'GBP',
      status: 'pending',
      transactionDate: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

function getMockFinanceAdsTransactions(): AffiliateTransaction[] {
  return [
    {
      network: 'financeads',
      networkReference: `fa_${Date.now()}_1`,
      productName: 'Mercury',
      linkSlug: 'mercury',
      amount: 100.00,
      currency: 'USD',
      status: 'approved',
      transactionDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      network: 'financeads',
      networkReference: `fa_${Date.now()}_2`,
      productName: 'Wise Business',
      linkSlug: 'wise-business',
      amount: 25.00,
      currency: 'USD',
      status: 'approved',
      transactionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}

// ============================================================
// Sync All Networks
// ============================================================

export async function syncAllNetworks(): Promise<{
  success: boolean;
  results: SyncResult[];
  totalCreated: number;
  totalUpdated: number;
}> {
  const results: SyncResult[] = [];

  // Sync each network
  const [partnerStack, awin, financeAds] = await Promise.all([
    syncPartnerStack(),
    syncAwin(),
    syncFinanceAds(),
  ]);

  results.push(partnerStack, awin, financeAds);

  const totalCreated = results.reduce((sum, r) => sum + r.recordsCreated, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.recordsUpdated, 0);
  const success = results.some((r) => r.success);

  // Log sync
  const supabase = createServiceClient();
  await supabase.from('api_sync_logs').insert({
    network: 'all',
    sync_type: 'revenue',
    status: success ? 'completed' : 'failed',
    records_processed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
    records_created: totalCreated,
    records_updated: totalUpdated,
    completed_at: new Date().toISOString(),
    metadata: { results },
  });

  return { success, results, totalCreated, totalUpdated };
}
