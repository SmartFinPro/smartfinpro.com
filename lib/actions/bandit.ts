// lib/actions/bandit.ts
// P5: Contextual Bandit — Server Actions
//
// selectOffer(): Thompson Sampling arm selection for a segment
// updatePosterior(): Reward/penalty update after conversion events
//
// Segments: Market × Device = 12 segments total
// Warmup: Falls back to P4 EV-ranking until 100 total_shown per arm

'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { selectArm, BANDIT_WARMUP_THRESHOLD } from '@/lib/bandit/thompson-sampling';
import { rankOffersByEV } from '@/lib/actions/offer-ev';
import { logger } from '@/lib/logging';
import type { BanditArm } from '@/lib/bandit/thompson-sampling';

// ── Types ────────────────────────────────────────────────────────

interface BanditSelection {
  /** Selected partner slug */
  slug: string;
  /** Whether Thompson Sampling was used (vs. fallback) */
  method: 'thompson' | 'ev' | 'static';
  /** Link ID for tracking */
  linkId: string;
}

// ── Select Offer ─────────────────────────────────────────────────

/**
 * Select the best offer for a given context using Thompson Sampling.
 *
 * Fallback chain:
 *   1. Thompson Sampling (if warmup complete: all arms >= BANDIT_WARMUP_THRESHOLD)
 *   2. P4 EV-ranking (if sufficient data)
 *   3. null → caller uses static CPA sort
 */
export async function selectOffer(
  market: string,
  category: string,
  deviceType: string = 'desktop',
): Promise<BanditSelection | null> {
  const supabase = createServiceClient();

  try {
    // Fetch bandit arms for this segment
    const { data: armsData } = await supabase
      .from('bandit_arms')
      .select('link_id, alpha, beta_param, total_shown')
      .eq('market', market)
      .eq('category', category)
      .eq('device_type', deviceType);

    const arms: BanditArm[] = (armsData || []).map((a) => ({
      linkId: a.link_id,
      alpha: parseFloat(String(a.alpha)),
      betaParam: parseFloat(String(a.beta_param)),
      totalShown: a.total_shown,
    }));

    // Warmup: require >= 2 arms AND enough total impressions across the segment.
    // Using total segment impressions (not per-arm) avoids a deadlock where
    // unshown arms block warmup forever. Thompson's Beta(1,1) prior naturally
    // explores arms with no data (high variance → high sample probability).
    const totalSegmentShown = arms.reduce((sum, a) => sum + a.totalShown, 0);
    const allWarmedUp = arms.length >= 2 &&
      totalSegmentShown >= BANDIT_WARMUP_THRESHOLD;

    if (allWarmedUp) {
      // Thompson Sampling
      const selectedIdx = selectArm(arms);
      if (selectedIdx >= 0) {
        const selected = arms[selectedIdx];

        // Get slug from affiliate_links
        const { data: link } = await supabase
          .from('affiliate_links')
          .select('slug')
          .eq('id', selected.linkId)
          .maybeSingle();

        if (link) {
          // Atomic increment via RPC — no read-modify-write race condition
          await supabase.rpc('increment_bandit_shown', {
            p_link_id: selected.linkId,
            p_market: market,
            p_category: category,
            p_device_type: deviceType,
          });

          return {
            slug: link.slug,
            method: 'thompson',
            linkId: selected.linkId,
          };
        }
      }
    }

    // Fallback: P4 EV-ranking
    // Track the impression so warmup progresses toward Thompson activation.
    // Seed ALL EV-ranked offers as arm rows so arms.length >= 2 becomes
    // reachable. Only the displayed arm gets total_shown incremented.
    const evRanked = await rankOffersByEV(market, category);
    if (evRanked && evRanked.length > 0) {
      try {
        // 1. Increment shown for the displayed (top-EV) arm
        await supabase.rpc('increment_bandit_shown', {
          p_link_id: evRanked[0].linkId,
          p_market: market,
          p_category: category,
          p_device_type: deviceType,
        });

        // 2. Seed remaining arms (total_shown=0) so they exist for
        //    the arms.length >= 2 warmup check. Uses upsert — no-op
        //    if arm row already exists.
        for (let i = 1; i < evRanked.length; i++) {
          await supabase
            .from('bandit_arms')
            .upsert(
              {
                link_id: evRanked[i].linkId,
                market,
                category,
                device_type: deviceType,
                alpha: 1.0,
                beta_param: 1.0,
                total_shown: 0,
                total_reward: 0,
              },
              { onConflict: 'link_id,market,category,device_type', ignoreDuplicates: true },
            );
        }
      } catch {
        // Non-blocking: impression tracking should never break offer selection
      }

      return {
        slug: evRanked[0].slug,
        method: 'ev',
        linkId: evRanked[0].linkId,
      };
    }

    // No data available → caller uses static CPA sort
    return null;
  } catch (e) {
    logger.error('[bandit] selectOffer failed', { error: e, market, category, deviceType });
    return null;
  }
}

// ── Update Posterior ──────────────────────────────────────────────

/**
 * Update the bandit posterior after a conversion event.
 * Called from the postback service after processing a conversion_event.
 *
 * @param linkId - Affiliate link ID
 * @param market - Market code
 * @param category - Category slug
 * @param deviceType - Device type (mobile/tablet/desktop)
 * @param isReward - true for approved/ftd, false for reversed/rejected
 */
export async function updatePosterior(
  linkId: string,
  market: string,
  category: string,
  deviceType: string,
  isReward: boolean,
): Promise<void> {
  const supabase = createServiceClient();

  try {
    await supabase.rpc('update_bandit_posterior', {
      p_link_id: linkId,
      p_market: market,
      p_category: category,
      p_device_type: deviceType || 'desktop',
      p_is_reward: isReward,
    });
  } catch (e) {
    logger.error('[bandit] updatePosterior failed', {
      error: e,
      linkId,
      market,
      category,
      deviceType,
      isReward,
    });
  }
}
