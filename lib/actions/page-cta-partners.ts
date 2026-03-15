// lib/actions/page-cta-partners.ts — CRUD for page ↔ affiliate partner assignments
'use server';
import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PartnerAssignmentConfig, EnrichedCtaPartner, Placement, DisplayType } from '@/lib/types/page-cta';

// ── Batch Read (for Content Hub) ───────────────────────────────

/**
 * Load all CTA partner assignments for multiple pages in one query.
 * @returns Record mapping pageUrl → partner configs. Returns `{}` on error.
 */
export async function getCtaPartnersForPages(
  pageUrls: string[]
): Promise<Record<string, PartnerAssignmentConfig[]>> {
  if (pageUrls.length === 0) return {};

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('page_cta_partners')
      .select('*')
      .in('page_url', pageUrls)
      .order('position', { ascending: true });

    if (error) {
      logger.error('[page-cta-partners] Batch load error:', error);
      return {};
    }

    const result: Record<string, PartnerAssignmentConfig[]> = {};
    for (const row of data || []) {
      if (!result[row.page_url]) result[row.page_url] = [];
      result[row.page_url].push({
        id: row.affiliate_link_id,
        placements: (row.placements as Placement[]) ?? [1, 2, 3],
        display_type: (row.display_type as DisplayType) ?? 'single',
      });
    }

    return result;
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[page-cta-partners] Batch load error:', err);
    return {};
  }
}

// ── Single Page Read ───────────────────────────────────────────

/**
 * Load CTA partner configs for a single page.
 * @returns Array of partner configs. Returns `[]` on error.
 */
export async function getCtaPartnersForPage(
  pageUrl: string
): Promise<PartnerAssignmentConfig[]> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('page_cta_partners')
      .select('*')
      .eq('page_url', pageUrl)
      .order('position', { ascending: true });

    if (error) {
      logger.error('[page-cta-partners] Single load error:', error);
      return [];
    }

    return (data || []).map((r) => ({
      id: r.affiliate_link_id,
      placements: (r.placements as Placement[]) ?? [1, 2, 3],
      display_type: (r.display_type as DisplayType) ?? 'single',
    }));
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[page-cta-partners] Single load error:', err);
    return [];
  }
}

// ── Enriched Read (for frontend rendering) ──────────────────────

/**
 * Load CTA partners with full affiliate_links data for rendering on marketing pages.
 * @returns Enriched partner array with slug, url, cpa_value etc. Returns `[]` on error.
 */
export async function getEnrichedCtaPartners(
  pageUrl: string
): Promise<EnrichedCtaPartner[]> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('page_cta_partners')
      .select(`
        affiliate_link_id, placements, display_type, position,
        affiliate_links!inner ( slug, partner_name, category, market, active )
      `)
      .eq('page_url', pageUrl)
      .order('position', { ascending: true });

    if (error) {
      // Graceful fallback: table may not exist yet or FK missing.
      // warn instead of error to avoid triggering the dev error overlay.
      const code = (error as any)?.code || '';
      const msg = (error as any)?.message || JSON.stringify(error);
      if (code === '42P01' || msg.includes('does not exist') || msg.includes('relation')) {
        // Table not created yet — completely expected during dev bootstrap
        logger.debug('[page-cta-partners] Table not found, skipping CTA enrichment');
      } else {
        logger.warn('[page-cta-partners] Enriched load skipped:', msg);
      }
      return [];
    }

    return (data || [])
      .filter((r: any) => r.affiliate_links?.active !== false)
      .map((r: any) => ({
        affiliate_link_id: r.affiliate_link_id,
        placements: (r.placements as Placement[]) ?? [1, 2, 3],
        display_type: (r.display_type as DisplayType) ?? 'single',
        position: r.position ?? 0,
        partner_name: r.affiliate_links.partner_name,
        slug: r.affiliate_links.slug,
        category: r.affiliate_links.category || '',
        market: r.affiliate_links.market || '',
      }));
  } catch (err) {
    Sentry.captureException(err);
    // Network errors, client init failures, etc. — non-blocking
    logger.warn('[page-cta-partners] Enriched load skipped:', err instanceof Error ? err.message : err);
    return [];
  }
}

// ── Write (replace all for a page) ─────────────────────────────

/**
 * Replace all CTA partner assignments for a page.
 * @returns `{ success: true }` on success, `{ success: false, error: string }` on failure.
 */
export async function setCtaPartnersForPage(
  pageUrl: string,
  partners: PartnerAssignmentConfig[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    // Delete existing assignments
    const { error: delError } = await supabase
      .from('page_cta_partners')
      .delete()
      .eq('page_url', pageUrl);

    if (delError) {
      logger.error('[page-cta-partners] Delete error:', delError);
      return { success: false, error: delError.message };
    }

    // Insert new assignments (if any)
    if (partners.length > 0) {
      const rows = partners.map((p, idx) => ({
        page_url: pageUrl,
        affiliate_link_id: p.id,
        position: idx,
        placements: p.placements.length > 0 ? p.placements : [1, 2, 3],
        display_type: p.display_type || 'single',
      }));

      let { error: insError } = await supabase
        .from('page_cta_partners')
        .insert(rows);

      // Fallback: if new columns don't exist yet, insert without them
      const isColumnMissing =
        insError?.code === '42703' ||
        insError?.message?.includes('Could not find') ||
        insError?.message?.includes('column');
      if (isColumnMissing) {
        const fallbackRows = partners.map((p, idx) => ({
          page_url: pageUrl,
          affiliate_link_id: p.id,
          position: idx,
        }));
        const fallback = await supabase.from('page_cta_partners').insert(fallbackRows);
        insError = fallback.error;
      }

      if (insError) {
        logger.error('[page-cta-partners] Insert error:', insError);
        return { success: false, error: insError.message };
      }
    }

    // Revalidate both the marketing page and the dashboard
    revalidatePath(pageUrl);
    revalidatePath('/dashboard/content/hub');

    return { success: true };
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[page-cta-partners] Set error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}
