// lib/xray/alternatives.ts
// Finds top alternative products for X-Ray Score comparison.
// Server-only — called from API route.

import { createServiceClient } from '@/lib/supabase/server';
import { computeFullXRay, type ProductProfile, type UserInputs } from './score-engine';

export interface AlternativeProduct {
  slug: string;
  name: string;
  xrayScore: number;
  decisionLabel: string;
  affiliateUrl: string;
}

/**
 * Find top 2 alternative products in the same market + category.
 *
 * Resolution order:
 * 1. product_profiles table (scored with same user inputs)
 * 2. affiliate_links table (name + slug, score = 0)
 * 3. Empty array
 */
export async function findAlternatives(
  currentSlug: string,
  market: string,
  category: string,
  inputs: UserInputs,
): Promise<AlternativeProduct[]> {
  const supabase = createServiceClient();

  // ── Tier 1: scored alternatives from product_profiles ─────────
  try {
    const { data: profiles, error } = await supabase
      .from('product_profiles')
      .select('*')
      .eq('market', market)
      .eq('category', category)
      .neq('slug', currentSlug)
      .limit(10);

    if (!error && profiles && profiles.length > 0) {
      const scored = profiles.map((row) => {
        const profile: ProductProfile = {
          basePriceMonthly: Number(row.base_price_monthly),
          seatPriceMonthly: Number(row.seat_price_monthly),
          freeSeats: Number(row.free_seats),
          usageOverageMonthly: Number(row.usage_overage_monthly),
          addonCostMonthly: Number(row.addon_cost_monthly),
          onboardingHours: Number(row.onboarding_hours),
          fitDimensions: {
            beginner: Number(row.fit_beginner),
            advanced: Number(row.fit_advanced),
            teams: Number(row.fit_teams),
            solo: Number(row.fit_solo),
            lowCost: Number(row.fit_low_cost),
            featureRich: Number(row.fit_feature_rich),
            compliance: Number(row.fit_compliance),
          },
          riskDimensions: {
            complianceGap: Number(row.compliance_gap),
            lockinRisk: Number(row.lockin_risk),
            supportRisk: Number(row.support_risk),
            outageRisk: Number(row.outage_risk),
            policyRisk: Number(row.policy_risk),
          },
          expectedHoursSaved: Number(row.expected_hours_saved),
        };

        const result = computeFullXRay(profile, inputs);
        return {
          slug: row.slug as string,
          name: ((row.slug as string) || '')
            .replace(/-review$/, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase()),
          xrayScore: result.xrayScore,
          decisionLabel: result.decisionLabel,
          affiliateUrl: `/go/${row.slug}/`,
        };
      });

      return scored
        .sort((a, b) => b.xrayScore - a.xrayScore)
        .slice(0, 2);
    }
  } catch {
    // product_profiles query failed — fall through
  }

  // ── Tier 2: unscored alternatives from affiliate_links ────────
  try {
    const { data: links, error } = await supabase
      .from('affiliate_links')
      .select('slug, partner_name')
      .eq('market', market)
      .eq('category', category)
      .eq('active', true)
      .neq('slug', currentSlug)
      .order('commission_value', { ascending: false })
      .limit(2);

    if (!error && links && links.length > 0) {
      return links.map((link) => ({
        slug: link.slug as string,
        name: (link.partner_name as string) || ((link.slug as string) || '')
          .replace(/-review$/, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase()),
        xrayScore: 0,
        decisionLabel: 'Alternative',
        affiliateUrl: `/go/${link.slug}/`,
      }));
    }
  } catch {
    // affiliate_links query failed — return empty
  }

  return [];
}
