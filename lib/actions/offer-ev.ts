// lib/actions/offer-ev.ts
// P4: Offer-EV Ranking — Expected Value computation + ranking
//
// EV = P(approved|segment) × avg_payout × (1 - reversal_rate) × compliance_score
//
// Fallback chain:
//   1. Segment-specific EV (segment_key matches) if data_sufficient=true
//   2. Overall EV (segment_key='overall') if data_sufficient=true
//   3. Static CPA sort (current behavior — no changes needed)

'use server';

import { createServiceClient } from '@/lib/supabase/server';

// ── Types ────────────────────────────────────────────────────────

interface OfferEV {
  linkId: string;
  partnerName: string;
  slug: string;
  market: string;
  category: string;
  ev: number;
  totalClicks: number;
  approvalRate: number;
  avgPayout: number;
  reversalRate: number;
  complianceScore: number;
  dataSufficient: boolean;
}

interface ComputeResult {
  computed: number;
  sufficient: number;
  insufficient: number;
}

// Minimum clicks for data to be considered sufficient
const MIN_CLICKS = 50;

// ── Compliance scoring ───────────────────────────────────────────

/** Returns a compliance multiplier based on market match + regulation */
function getComplianceScore(linkMarket: string | null, queryMarket: string): number {
  if (!linkMarket) return 0.6; // Unknown market → penalty
  if (linkMarket === queryMarket) return 1.0; // Exact market match
  return 0.8; // Cross-market
}

// ── EV Computation ───────────────────────────────────────────────

/**
 * Rebuild the offer_ev_cache table.
 * Called nightly by /api/cron/ev-refresh.
 */
export async function computeOfferEV(): Promise<ComputeResult> {
  const supabase = createServiceClient();

  // Fetch all active affiliate links
  const { data: links } = await supabase
    .from('affiliate_links')
    .select('id, slug, partner_name, market, category, commission_value')
    .eq('active', true);

  if (!links?.length) {
    return { computed: 0, sufficient: 0, insufficient: 0 };
  }

  let computed = 0;
  let sufficient = 0;
  let insufficient = 0;

  for (const link of links) {
    // Count total clicks for this link
    const { count: totalClicks } = await supabase
      .from('link_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('link_id', link.id);

    const clicks = totalClicks || 0;

    // Fetch conversion events for this link
    const { data: events } = await supabase
      .from('conversion_events')
      .select('event_type, event_value')
      .eq('link_id', link.id);

    const approvedEvents = (events || []).filter((e) => e.event_type === 'approved');
    const reversedEvents = (events || []).filter((e) => e.event_type === 'reversed');

    const approvedCount = approvedEvents.length;
    const reversedCount = reversedEvents.length;

    // Compute metrics
    const approvalRate = clicks > 0 ? approvedCount / clicks : 0;
    const reversalRate = approvedCount > 0 ? reversedCount / approvedCount : 0;
    const avgPayout = approvedCount > 0
      ? approvedEvents.reduce((sum, e) => sum + (e.event_value || 0), 0) / approvedCount
      : (link.commission_value || 0); // Fallback to static CPA

    const dataSufficient = clicks >= MIN_CLICKS;
    const market = link.market || 'us';
    const category = link.category || 'unknown';

    // Compliance: self-match = 1.0 for "overall" segment
    const complianceScore = 1.0;

    // EV = P(approved) × avg_payout × (1 - reversal_rate) × compliance_score
    const ev = approvalRate * avgPayout * (1 - reversalRate) * complianceScore;

    // Upsert into offer_ev_cache (overall segment)
    await supabase
      .from('offer_ev_cache')
      .upsert(
        {
          link_id: link.id,
          market,
          category,
          segment_key: 'overall',
          total_clicks: clicks,
          approved_count: approvedCount,
          reversed_count: reversedCount,
          avg_payout: avgPayout,
          approval_rate: approvalRate,
          reversal_rate: reversalRate,
          compliance_score: complianceScore,
          ev,
          data_sufficient: dataSufficient,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'link_id,market,category,segment_key' },
      );

    computed++;
    if (dataSufficient) sufficient++;
    else insufficient++;
  }

  return { computed, sufficient, insufficient };
}

// ── EV-Ranked Offer Retrieval ────────────────────────────────────

/**
 * Returns EV-ranked offers for a given market + category.
 *
 * Fallback chain:
 *   1. Segment-specific if data_sufficient=true (future: when P3 segment_key is populated)
 *   2. Overall EV if data_sufficient=true
 *   3. null — caller should fall back to existing CPA sort
 */
export async function rankOffersByEV(
  market: string,
  category: string,
): Promise<OfferEV[] | null> {
  const supabase = createServiceClient();

  // Try overall EV first
  const { data: evData } = await supabase
    .from('offer_ev_cache')
    .select(`
      link_id,
      ev,
      total_clicks,
      approval_rate,
      avg_payout,
      reversal_rate,
      compliance_score,
      data_sufficient
    `)
    .eq('market', market)
    .eq('category', category)
    .eq('segment_key', 'overall')
    .eq('data_sufficient', true)
    .order('ev', { ascending: false });

  if (!evData?.length) {
    // No sufficient data → caller uses static CPA sort
    return null;
  }

  // Enrich with partner details
  const linkIds = evData.map((e) => e.link_id);
  const { data: links } = await supabase
    .from('affiliate_links')
    .select('id, slug, partner_name, market, category')
    .in('id', linkIds)
    .eq('active', true);

  const linkMap = new Map((links || []).map((l) => [l.id, l]));

  // Cross-market compliance adjustment
  const ranked: OfferEV[] = evData
    .map((e) => {
      const link = linkMap.get(e.link_id);
      if (!link) return null;

      const complianceScore = getComplianceScore(link.market, market);

      return {
        linkId: e.link_id,
        partnerName: link.partner_name,
        slug: link.slug,
        market: link.market || market,
        category: link.category || category,
        ev: e.approval_rate * e.avg_payout * (1 - e.reversal_rate) * complianceScore,
        totalClicks: e.total_clicks,
        approvalRate: e.approval_rate,
        avgPayout: e.avg_payout,
        reversalRate: e.reversal_rate,
        complianceScore,
        dataSufficient: e.data_sufficient,
      };
    })
    .filter((x): x is OfferEV => x !== null)
    .sort((a, b) => b.ev - a.ev);

  return ranked.length > 0 ? ranked : null;
}
